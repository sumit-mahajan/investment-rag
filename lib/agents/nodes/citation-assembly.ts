import type { AnalysisState } from "../financial-analyzer";
import { chunkToCitation } from "@/lib/retrieval";
import type { InvestmentAnalysis } from "@/lib/types/analysis";

export async function citationAssemblyNode(
  state: AnalysisState
): Promise<Partial<AnalysisState>> {
  const draft = state.draftAnalysis;
  if (!draft) {
    throw new Error("citationAssembly requires draftAnalysis from synthesis");
  }

  const finalAnalysis: InvestmentAnalysis = {
    ...draft,
    bullCase: {
      points: draft.bullCase.points,
      citations: [],
    },
    bearCase: {
      points: draft.bearCase.points,
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
      points: draft.keyRisks.points,
      citations: [],
    },
  };

  return { finalAnalysis };
}
