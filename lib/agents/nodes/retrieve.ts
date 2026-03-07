import { retrieveRelevantChunks } from "@/lib/services/retrieval-service";
import { AnalysisState } from "../financial-analyzer";
import { investmentPhilosophies } from "@/config/philosophies.config";

export async function retrieveNode(state: AnalysisState): Promise<Partial<AnalysisState>> {
  console.log("Retrieve node: Fetching relevant chunks");

  const { documentId, userId, criteria } = state;

  const allChunks = [];

  for (const criterion of criteria) {
    // Build targeted query with key metrics for better retrieval precision
    const keyMetricsPart =
      criterion.keyMetrics?.length > 0
        ? ` Key metrics: ${criterion.keyMetrics.slice(0, 4).join(", ")}.`
        : "";
    const query = `${criterion.name}: ${criterion.description}.${keyMetricsPart}`;

    const chunks = await retrieveRelevantChunks({
      documentId,
      userId,
      query,
      topK: 15, // Retrieve more, then rerank to fewer for precision
      rerankTopK: 6,
      useExpansion: true,
      useReranking: true,
      useDiversity: true,
    });

    allChunks.push(...chunks);
  }

  // Always fetch chunks for value and growth investing (in addition to user criteria)
  for (const [, config] of Object.entries(investmentPhilosophies)) {
    const query = `${config.name}: ${config.keyMetrics.join(", ")}`;
    const chunks = await retrieveRelevantChunks({
      documentId,
      userId,
      query,
      topK: 12,
      rerankTopK: 6,
      useExpansion: true,
      useReranking: true,
      useDiversity: true,
    });
    allChunks.push(...chunks);
  }

  // Deduplicate
  const uniqueChunks = Array.from(
    new Map(allChunks.map((c) => [c.id, c])).values()
  );

  console.log(`Retrieved ${uniqueChunks.length} unique chunks`);

  return {
    retrievedChunks: uniqueChunks,
  };
}
