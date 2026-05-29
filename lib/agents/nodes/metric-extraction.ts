import { z } from "zod";
import type { AnalysisState } from "../financial-analyzer";
import { METRIC_DEFINITIONS } from "../metrics";
import { getGroqExtractionModel } from "../groq";
import { retrieveMetricChunks } from "@/lib/retrieval/retrieve-metric-chunks";
import type { ExtractedMetric } from "@/lib/types/analysis";
import {
  buildMetricDisplayLine,
  validateMetricAgainstContext,
  type MetricExtractionFields,
} from "../metric-utils";
import { groqRateLimitMessage, isGroqRateLimitError } from "../groq-errors";

const metricExtractionSchema = z.object({
  currency: z
    .enum(["USD", "INR", "EUR", "GBP", "OTHER"])
    .nullable()
    .describe("Currency implied by the table/header. Null if not determinable."),
  unitFromTable: z
    .string()
    .nullable()
    .describe(
      'Exact unit phrase from the filing e.g. "in millions", "in crore", "₹ crore", "in millions except per share"'
    ),
  figure: z
    .string()
    .nullable()
    .describe("Primary numeric result as stated (include commas; do not convert units)"),
  yoyChange: z
    .string()
    .nullable()
    .describe('YoY % or period comparison if present e.g. "+4.7% YoY", else null'),
  displayLine: z
    .string()
    .nullable()
    .describe(
      "One-line human-readable value. MUST include correct currency symbol/code and unit. Null if not found."
    ),
});

function formatChunksForPrompt(
  chunks: { fileName: string; pageNumber: number; chunkType: string; content: string }[]
) {
  if (chunks.length === 0) return "No passages retrieved.";
  // Capped at 6 chunks × 900 chars to stay within 8B model context efficiently.
  // Table chunks are already sorted first by retrieveMetricChunks.
  return chunks
    .slice(0, 6)
    .map(
      (c, i) =>
        `[${i + 1}] ${c.fileName} p.${c.pageNumber} (${c.chunkType})\n${c.content.slice(0, 900)}`
    )
    .join("\n\n");
}

function chunkContext(chunks: { content: string }[]): string {
  return chunks.map((c) => c.content).join("\n");
}

const EXTRACTION_RULES = `You extract financial metrics from annual reports (US SEC 10-K, Indian INR filings, etc.).

## Step 1 — Read the table header / footnote FIRST
Before any number, identify:
- Currency: USD ($), INR (₹ / INR / rupees), EUR, GBP, or other
- Unit scale: "in millions", "in crore", "in lakh", "in thousands", "except per share", etc.
- Fiscal period: which year column is "current" (e.g. Year ended March 31, 2024 vs Dec 31, 2023)

## Step 2 — Never convert or assume currency
- Do NOT label INR/crore table totals as "$X billion USD".
- Indian filings (Infosys, etc.): large integers like 145,285 often mean **INR crore** or **INR million** per header — e.g. "INR 153,670 crore revenue" NOT "$153.7 billion".
- US SEC filings: "(in millions)" means multiply by 1e6 — e.g. 134,902 → **USD 134.902 billion** only when header says in millions USD.
- If the filing mixes USD and INR, use the currency shown on the **same table** as the figure.
- If currency/unit is unclear, return null — do not guess USD.

## Step 3 — Per metric rules
**Revenue and YoY growth:** Consolidated/total revenue for the latest fiscal year; prior year for YoY %. Segment/quarterly tables are secondary.
**Net Income / EPS:** Net profit attributable to shareholders or EPS line; include per-share only if that's the metric.
**Operating margin:** Operating income ÷ revenue from the same statement and unit, OR an explicit margin % from the filing.
**Free Cash Flow:** Use a labeled "free cash flow" line, or operating cash flow minus capital expenditure from the cash flow statement — show the math only if both lines are in the same unit/currency. Do NOT substitute net income or profit after tax for FCF.
**Debt/Equity Ratio:** Compute total debt ÷ total shareholders' equity from balance sheet (same currency). Show the ratio (e.g. "0.05" or "5%") with debt and equity amounts. Return null if totals are missing — never output 0.0 unless the filing explicitly shows zero debt.
**Forward guidance:** null unless explicit forward-looking numeric guidance appears (rare in 10-K/annual reports).

## Step 4 — displayLine format examples
- USD: "USD 134.9 billion revenue (+15.7% YoY)" with "(in millions)" header on US filing
- INR: "INR 153,670 crore total revenue (+4.7% YoY)" when table is in crore
- INR: "INR 26,248 million net income" when header says in millions
- Margin: "18.7% operating margin (INR basis)" or "34.7% operating margin (USD basis)"

Return all fields null only if the metric is absent from every passage.`;

function parseExtraction(raw: z.infer<typeof metricExtractionSchema>): MetricExtractionFields {
  return {
    currency: raw.currency,
    unitFromTable: raw.unitFromTable,
    figure: raw.figure,
    yoyChange: raw.yoyChange,
    displayLine: raw.displayLine,
  };
}

function parseStructuredOutput<T>(schema: z.ZodType<T>, value: unknown): T {
  const payload =
    typeof value === "object" && value !== null && "parsed" in value
      ? (value as { parsed: unknown }).parsed
      : value;
  return schema.parse(payload);
}

async function extractSingleMetric(
  metric: (typeof METRIC_DEFINITIONS)[number],
  userId: string,
  fileIds: string[],
  model: { invoke: (prompt: string) => Promise<unknown> }
): Promise<ExtractedMetric> {
  const chunks = await retrieveMetricChunks(userId, fileIds, {
    query: metric.query,
    supplementalQueries: metric.supplementalQueries ? [...metric.supplementalQueries] : undefined,
  });

  if (chunks.length === 0) return { label: metric.label, value: null, chunks: [] };

  const context = chunkContext(chunks);
  const prompt = `${EXTRACTION_RULES}

Extract: "${metric.label}"

${formatChunksForPrompt(chunks)}`;

  try {
    const result = await model.invoke(prompt);
    const fields = parseExtraction(parseStructuredOutput(metricExtractionSchema, result));
    const display = buildMetricDisplayLine(fields);
    const validated = display
      ? validateMetricAgainstContext(display, context, metric.label)
      : null;
    return { label: metric.label, value: validated, chunks };
  } catch (error) {
    if (isGroqRateLimitError(error)) {
      console.error(`Groq rate limit during metric extraction (${metric.label})`);
      throw new Error(groqRateLimitMessage(error));
    }
    console.error(`Metric extraction failed for ${metric.label}:`, error);
    return { label: metric.label, value: null, chunks };
  }
}

export async function metricExtractionNode(
  state: AnalysisState
): Promise<Partial<AnalysisState>> {
  const { fileIds, userId } = state;
  const model = getGroqExtractionModel().withStructuredOutput(metricExtractionSchema);

  // All 6 metrics run in parallel — each retrieves + extracts independently.
  // A rate-limit error in any metric propagates to fail-fast the whole node.
  const extractedMetrics = await Promise.all(
    METRIC_DEFINITIONS.map((metric) => extractSingleMetric(metric, userId, fileIds, model))
  );

  return { extractedMetrics };
}
