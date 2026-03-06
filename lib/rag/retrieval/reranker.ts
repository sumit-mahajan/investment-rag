import { CohereClient } from "cohere-ai";
import { HybridSearchResult } from "@/types/rag";

let cohereClient: CohereClient | null = null;

function getCohereClient(): CohereClient | null {
  if (!process.env.COHERE_API_KEY) {
    console.warn("COHERE_API_KEY not set, reranking disabled");
    return null;
  }

  if (!cohereClient) {
    cohereClient = new CohereClient({
      token: process.env.COHERE_API_KEY,
    });
  }

  return cohereClient;
}

export async function rerankResults(
  query: string,
  results: HybridSearchResult[],
  topK: number = 5
): Promise<HybridSearchResult[]> {
  const client = getCohereClient();

  if (!client || results.length === 0) {
    // Fallback to original ranking
    return results.slice(0, topK);
  }

  try {
    const documents = results.map((r) => r.content);

    const reranked = await client.rerank({
      query,
      documents,
      topN: topK,
      model: "rerank-english-v3.0",
    });

    // Map reranked results back to original format
    const rerankedResults = reranked.results.map((r) => {
      const original = results[r.index];
      return {
        ...original,
        rerankedScore: r.relevanceScore,
        combinedScore: r.relevanceScore, // Use reranked score as final score
      };
    });

    return rerankedResults;
  } catch (error) {
    console.error("Reranking error:", error);
    // Fallback to original ranking
    return results.slice(0, topK);
  }
}
