import type { AnalysisState } from "../financial-analyzer";
import { retrieveChunks, dedupeChunks } from "@/lib/retrieval";

const QUALITATIVE_QUERIES = [
  "risk factors uncertainties challenges threats regulatory litigation",
  "growth catalysts opportunities expansion market share competitive advantages",
];

export async function qualitativeRetrievalNode(
  state: AnalysisState
): Promise<Partial<AnalysisState>> {
  const { fileIds, userId, question } = state;
  const allChunks = [];

  for (const q of QUALITATIVE_QUERIES) {
    const chunks = await retrieveChunks({
      userId,
      fileIds,
      query: q,
      topK: 8,
    });
    allChunks.push(...chunks);
  }

  const questionChunks = await retrieveChunks({
    userId,
    fileIds,
    query: question,
    topK: 6,
  });
  allChunks.push(...questionChunks);

  return { qualitativeChunks: dedupeChunks(allChunks) };
}
