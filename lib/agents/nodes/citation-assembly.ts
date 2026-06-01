import type { AnalysisState } from "../financial-analyzer";
import { filterBullPoints, filterGroundedPoints } from "../claim-filter";
import { chunkToCitation } from "@/lib/retrieval";
import type { InvestmentAnalysis } from "@/lib/types/analysis";

function buildEvidenceCorpus(state: AnalysisState): string {
  const parts: string[] = [];
  for (const m of state.extractedMetrics) {
    if (m.value) parts.push(m.value);
    for (const c of m.chunks) parts.push(c.content);
  }
  for (const c of state.qualitativeChunks) {
    parts.push(c.content);
  }
  return parts.join("\n");
}

export async function citationAssemblyNode(
  state: AnalysisState
): Promise<Partial<AnalysisState>> {
  const draft = state.draftAnalysis;
  if (!draft) {
    throw new Error("citationAssembly requires draftAnalysis from synthesis");
  }

  const corpus = buildEvidenceCorpus(state);
  const metricValues = state.extractedMetrics
    .map((m) => m.value)
    .filter((v): v is string => Boolean(v));

  const finalAnalysis: InvestmentAnalysis = {
    ...draft,
    bullCase: {
      points: filterBullPoints(draft.bullCase.points, metricValues, corpus),
      citations: [],
    },
    bearCase: {
      points: filterGroundedPoints(draft.bearCase.points, corpus),
      citations: [],
    },
    keyMetrics: draft.keyMetrics.map((metric) => {
      const source = state.extractedMetrics.find((m) => m.label === metric.label);
      const hasValue = metric.value !== null && metric.value.trim().length > 0;
      const topChunk = hasValue ? source?.chunks[0] : undefined;
      return {
        label: metric.label,
        value: metric.value,
        citation: topChunk ? chunkToCitation(topChunk) : null,
      };
    }),
    keyRisks: {
      points: filterGroundedPoints(draft.keyRisks.points, corpus),
      citations: [],
    },
  };

  return { finalAnalysis };
}
