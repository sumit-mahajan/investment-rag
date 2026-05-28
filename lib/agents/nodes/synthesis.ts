import { z } from "zod";
import type { AnalysisState } from "../financial-analyzer";
import { getGroqModel } from "../groq";
import type { InvestmentAnalysis } from "@/lib/types/analysis";
import { SYNTHESIS_POINT_LIMITS } from "../constants";
import { groqRateLimitMessage, isGroqRateLimitError } from "../groq-errors";

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

function buildContext(state: AnalysisState): string {
  const metricsSection = state.extractedMetrics
    .map((m) => {
      const value =
        m.value === null ? "NOT FOUND — do not cite as a fact" : m.value;
      return `- ${m.label}: ${value}`;
    })
    .join("\n");

  const qualitativeSection = state.qualitativeChunks
    .slice(0, 14)
    .map(
      (c, i) =>
        `[${i + 1}] ${c.fileName} p.${c.pageNumber} (${c.chunkType})\n${c.content.slice(0, 900)}`
    )
    .join("\n\n");

  return `## Extracted metrics (use exact figures when present)
${metricsSection}

## Document passages
${qualitativeSection || "No passages retrieved."}`;
}

export async function synthesisNode(
  state: AnalysisState
): Promise<Partial<AnalysisState>> {
  const model = getGroqModel().withStructuredOutput(synthesisSchema);

  const { bullCase: bullMax, bearCase: bearMax, keyRisks: risksMax } =
    SYNTHESIS_POINT_LIMITS;

  const prompt = `You are a senior equity research analyst preparing a decision memo for an investor.

Using ONLY the metrics and passages below:
1. Write a clear verdict with score (0–100) and recommendation.
2. Bull case: specific growth/strength arguments with numbers where available — NOT a list of raw metrics alone.
3. Bear case: specific risks and weaknesses — cite concerns from risk-factor language when present.
4. Key risks: material risks that could hurt the investment thesis (from filings, not generic filler).

Rules:
- Do not invent figures. Use extracted metrics exactly as written (preserve INR/crore vs USD). Never convert currency.
- If revenue YoY is NOT FOUND, say so in summary and lower the score accordingly.
- Do not repeat the same metric string as both bull and bear without explaining why it matters.
- Each bullet must help an investor decide — explain WHY it matters, not just WHAT the number is.
- Max ${bullMax} bull, ${bearMax} bear, ${risksMax} risk bullets. Each under 220 characters.
- Score calibration: strong financials + manageable risks → 65–85; missing core metrics or heavy risks → 20–45.

${buildContext(state)}`;

  let draft: z.infer<typeof synthesisSchema>;
  try {
    draft = await model.invoke(prompt);
  } catch (error) {
    if (isGroqRateLimitError(error)) {
      throw new Error(groqRateLimitMessage(error));
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
