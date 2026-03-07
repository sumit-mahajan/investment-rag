import { hybridSearch, applyMMR, SearchOptions } from "@/lib/rag/retrieval/hybrid-search";
import { rerankResults } from "@/lib/rag/retrieval/reranker";
import { expandQuery } from "@/lib/rag/retrieval/query-expansion";
import { ragConfig } from "@/config/rag.config";
import { HybridSearchResult } from "@/lib/types/rag";

export interface RetrievalOptions extends SearchOptions {
  useExpansion?: boolean;
  useReranking?: boolean;
  useDiversity?: boolean;
  /** Override config: keep fewer chunks after reranking for higher precision */
  rerankTopK?: number;
}

export async function retrieveRelevantChunks(
  options: RetrievalOptions
): Promise<HybridSearchResult[]> {
  const {
    query,
    useExpansion = false,
    useReranking = ragConfig.retrieval.useReranking,
    useDiversity = true,
    topK = ragConfig.retrieval.topK,
    rerankTopK = ragConfig.retrieval.rerankTopK,
  } = options;

  let queries = [query];

  // Query expansion (optional)
  if (useExpansion) {
    queries = await expandQuery(query);
    console.log(`Expanded query into ${queries.length} variations`);
  }

  // Perform hybrid search for all query variations
  const allResults: HybridSearchResult[] = [];

  for (const q of queries) {
    const results = await hybridSearch({
      ...options,
      query: q,
      topK: topK * 2, // Get more results for merging
    });
    allResults.push(...results);
  }

  // Deduplicate results by ID
  const uniqueResults = deduplicateResults(allResults);

  // Apply diversity (MMR)
  let finalResults = uniqueResults;
  if (useDiversity) {
    finalResults = applyMMR(
      uniqueResults,
      ragConfig.retrieval.mmrDiversity,
      topK
    );
  }

  // Rerank using Cohere (if enabled)
  if (useReranking) {
    finalResults = await rerankResults(query, finalResults, rerankTopK);
  } else {
    finalResults = finalResults.slice(0, rerankTopK);
  }

  // Filter by minimum similarity score
  finalResults = finalResults.filter(
    (r) => r.combinedScore >= ragConfig.retrieval.minSimilarityScore
  );

  return finalResults;
}

function deduplicateResults(
  results: HybridSearchResult[]
): HybridSearchResult[] {
  const seen = new Map<string, HybridSearchResult>();

  for (const result of results) {
    if (!seen.has(result.id) || seen.get(result.id)!.combinedScore < result.combinedScore) {
      seen.set(result.id, result);
    }
  }

  return Array.from(seen.values()).sort(
    (a, b) => b.combinedScore - a.combinedScore
  );
}
