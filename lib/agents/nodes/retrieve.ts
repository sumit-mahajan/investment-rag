import { retrieveRelevantChunks } from "@/lib/services/retrieval-service";
import { AnalysisState } from "../financial-analyzer";

export async function retrieveNode(state: AnalysisState): Promise<Partial<AnalysisState>> {
  console.log("Retrieve node: Fetching relevant chunks");

  const { documentId, userId, criteria } = state;

  const allChunks = [];

  for (const criterion of criteria) {
    // Build query focused on the criterion (categories handled in analyze node)
    const query = `${criterion.name}: ${criterion.description}`;

    const chunks = await retrieveRelevantChunks({
      documentId,
      userId,
      query,
      topK: 10,
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
