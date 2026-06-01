import { z } from "zod";
import type { AnalysisState } from "../financial-analyzer";
import { getGeminiModel } from "../gemini";
import type { InvestmentAnalysis } from "@/lib/types/analysis";
import { SYNTHESIS_POINT_LIMITS } from "../constants";
import { geminiRateLimitMessage, isGeminiRateLimitError } from "../gemini-errors";

const synthesisSchema = z.object({
  verdict: z.object({
    score: z
      .number()
      .min(0)
      .max(100)
      .describe("0=avoid, 50=neutral hold, 100=strong invest — based only on evidence in context"),
    recommendation: z.enum(["strong_buy", "buy", "hold", "caution", "avoid"]),
    headline: z.string().describe("One-line investment takeaway under 120 chars"),
    summary: z
      .string()
      .describe("3-5 sentence executive summary for an investor decision"),
  }),
  bullCase: z.object({
    points: z.array(z.string()),
  }),
  bearCase: z.object({
    points: z.array(z.string()),
  }),
  keyRisks: z.object({
    points: z.array(z.string()),
  }),
});

function clampPoints(points: string[], max: number): string[] {
  return points
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && p.toLowerCase() !== "null")
    .slice(0, max);
}

const CORE_METRIC_LABELS = [
  "Revenue and YoY growth",
  "Net Income / EPS",
  "Operating Margin",
  "Free Cash Flow",
] as const;

function countMissingCoreMetrics(
  metrics: AnalysisState["extractedMetrics"]
): number {
  return CORE_METRIC_LABELS.filter((label) => {
    const m = metrics.find((x) => x.label === label);
    return !m?.value;
  }).length;
}

function formatMetricEvidence(
  chunks: AnalysisState["extractedMetrics"][number]["chunks"]
): string {
  if (!chunks.length) return "";
  return chunks
    .slice(0, 2)
    .map((c) => `    [p.${c.pageNumber}] ${c.content.slice(0, 450).trim()}`)
    .join("\n");
}

function buildContext(state: AnalysisState): string {
  const missingCore = countMissingCoreMetrics(state.extractedMetrics);
  const qualLimit = missingCore >= 2 ? 18 : 14;

  const metricsSection = state.extractedMetrics
    .map((m) => {
      const value =
        m.value === null ? "NOT FOUND — do not cite as a fact" : m.value;
      const evidence = m.value ? formatMetricEvidence(m.chunks) : "";
      return evidence
        ? `- ${m.label}: ${value}\n${evidence}`
        : `- ${m.label}: ${value}`;
    })
    .join("\n");

  const qualitativeSection = state.qualitativeChunks
    .slice(0, qualLimit)
    .map(
      (c, i) =>
        `[${i + 1}] ${c.fileName} p.${c.pageNumber} (${c.chunkType})\n${c.content.slice(0, 900)}`
    )
    .join("\n\n");

  const incompleteNote =
    missingCore >= 2
      ? `\n## Data gaps\n${missingCore} of ${CORE_METRIC_LABELS.length} core profitability metrics are NOT FOUND. Do not infer net income, margin, EPS, or FCF from other ratios.\n`
      : "";

  return `## Extracted metrics (use exact figures when present)
${metricsSection}
${incompleteNote}
## Document passages
${qualitativeSection || "No passages retrieved."}`;
}

export async function synthesisNode(
  state: AnalysisState
): Promise<Partial<AnalysisState>> {
  const model = getGeminiModel().withStructuredOutput(synthesisSchema);

  const { bullCase: bullMax, bearCase: bearMax, keyRisks: risksMax } =
    SYNTHESIS_POINT_LIMITS;

  const missingCore = countMissingCoreMetrics(state.extractedMetrics);

  const prompt = `You are a senior equity research analyst preparing a decision memo for an investor.

Using ONLY the metrics and passages below:
1. Write a clear verdict with score (0–100) and recommendation.
2. Bull case: strengths supported by explicit figures or filing language in the passages.
3. Bear case: risks and weaknesses — use risk-factor language and missing-metric gaps when relevant.
4. Key risks: material risks from the filings (not generic filler).

Rules:
- Do not invent figures. Every number in your output must appear verbatim in extracted metrics or document passages.
- verdict.headline and verdict.summary: cite ONLY numbers that appear verbatim in the "## Extracted metrics" section above. Do not introduce any figure that is not there.
- Do NOT cite current ratio, ROE/RONW, DSO, liquidity ratios, or other KPIs unless that exact figure appears in the passages below.
- If Net Income/EPS, Operating Margin, or Free Cash Flow are NOT FOUND, do not imply profitability or cash generation; state the gap in summary and bear case.
- If revenue YoY is NOT FOUND, say so in summary and lower the score accordingly.
- Directly address the question: structure the memo as (1) verdict summary, (2) key financial metrics, (3) bull case, (4) bear case, (5) material risks.
- Bear case and material risks must use risk-factor language from passages or NOT FOUND metric gaps — do not cite segment/product revenue breakdowns unless that exact figure is in the passages.
- Prefer factual statements from the filing over analyst interpretation. Do not add "why it matters" unless the passage supports it.
- Do not repeat the same metric string as both bull and bear without a filing-based reason.
- Max ${bullMax} bull, ${bearMax} bear, ${risksMax} risk bullets. Each under 220 characters.
- Score calibration: strong financials + manageable risks → 65–85; missing core metrics or heavy risks → 20–45${
    missingCore >= 2
      ? `
- ${missingCore} core metrics are NOT FOUND: bull case may ONLY cite extracted metrics that have a value (Revenue, Debt/Equity, etc.). Do not cite current ratio, ROE/RONW, DSO, cash %, or any KPI not listed in extracted metrics.
- Score should not exceed 55 unless passages contain explicit net income, margin, or FCF figures`
      : ""
  }.

${buildContext(state)}`;

  let draft: z.infer<typeof synthesisSchema>;
  try {
    draft = await model.invoke(prompt);
  } catch (error) {
    if (isGeminiRateLimitError(error)) {
      throw new Error(geminiRateLimitMessage(error));
    }
    throw error;
  }

  const draftAnalysis: InvestmentAnalysis = {
    verdict: draft.verdict,
    bullCase: {
      points: clampPoints(draft.bullCase.points, bullMax),
      citations: [],
    },
    bearCase: {
      points: clampPoints(draft.bearCase.points, bearMax),
      citations: [],
    },
    keyMetrics: state.extractedMetrics.map((m) => ({
      label: m.label,
      value: m.value,
      citation: null,
    })),
    keyRisks: {
      points: clampPoints(draft.keyRisks.points, risksMax),
      citations: [],
    },
  };

  return { draftAnalysis };
}
