import type { InvestmentAnalysis } from "@/lib/types/analysis";

/** Formats analysis output to match DEFAULT_ANALYSIS_QUESTION sections for RAGAS relevancy. */
export function buildAnalysisAnswerForEval(analysis: InvestmentAnalysis): string {
  const parts: string[] = [];

  if (analysis.verdict?.headline) parts.push(analysis.verdict.headline);
  if (analysis.verdict?.summary) parts.push(analysis.verdict.summary);

  const metricsBlock = (analysis.keyMetrics ?? [])
    .map((m) => `- ${m.label}: ${m.value ?? "NOT FOUND"}`)
    .join("\n");
  if (metricsBlock) parts.push(`Key financial metrics:\n${metricsBlock}`);

  const bull = analysis.bullCase?.points ?? [];
  if (bull.length) {
    parts.push(`Bull case:\n${bull.map((p) => `- ${p}`).join("\n")}`);
  }

  const bear = analysis.bearCase?.points ?? [];
  if (bear.length) {
    parts.push(`Bear case:\n${bear.map((p) => `- ${p}`).join("\n")}`);
  }

  const risks = analysis.keyRisks?.points ?? [];
  if (risks.length) {
    parts.push(`Material risks:\n${risks.map((p) => `- ${p}`).join("\n")}`);
  }

  return parts.filter(Boolean).join("\n\n");
}
