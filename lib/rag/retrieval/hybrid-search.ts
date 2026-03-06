import { queryVectors } from "@/lib/vectorstore/operations";
import { Embedder } from "@/lib/rag/embeddings/embedder";
import { ragConfig } from "@/config/rag.config";
import { db } from "@/lib/db/client";
import { documentChunks } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { HybridSearchResult } from "@/types/rag";

export interface SearchOptions {
  documentId: string;
  userId: string;
  query: string;
  topK?: number;
  filter?: {
    categories?: string[];
    contentType?: string;
  };
  useHybrid?: boolean;
}

export async function hybridSearch(
  options: SearchOptions
): Promise<HybridSearchResult[]> {
  const {
    documentId,
    userId,
    query,
    topK = ragConfig.retrieval.topK,
    useHybrid = ragConfig.retrieval.useHybridSearch,
  } = options;

  if (!useHybrid) {
    // Vector search only
    return await vectorSearch(options);
  }

  // Perform both vector and keyword search
  const [vectorResults, keywordResults] = await Promise.all([
    vectorSearch(options),
    keywordSearch(options),
  ]);

  // Merge and rerank results
  const merged = mergeResults(vectorResults, keywordResults, topK);

  return merged;
}

async function vectorSearch(
  options: SearchOptions
): Promise<HybridSearchResult[]> {
  const { documentId, userId, query, topK = 20, filter } = options;

  // Generate query embedding
  const embedder = new Embedder(ragConfig.embedding);
  const queryEmbedding = await embedder.embedSingle(query);

  // Build Pinecone filter (basic fields only)
  const pineconeFilter: Record<string, any> = {
    documentId: { $eq: documentId },
    userId: { $eq: userId },
  };

  if (filter?.contentType) {
    pineconeFilter.contentType = { $eq: filter.contentType };
  }

  // Query Pinecone (get more results if we need to filter by categories)
  const namespace = `${userId}_${documentId}`;
  const fetchCount = filter?.categories ? topK * 3 : topK;

  const results = await queryVectors(
    queryEmbedding,
    fetchCount,
    pineconeFilter,
    namespace
  );

  // Post-filter by categories if needed (check for overlap)
  let filteredResults = results;
  if (filter?.categories && filter.categories.length > 0) {
    filteredResults = results.filter((r) => {
      const chunkCategories = r.metadata.categories as string[] | undefined;
      if (!chunkCategories || chunkCategories.length === 0) return false;
      return filter.categories!.some((cat) => chunkCategories.includes(cat));
    });
  }

  return filteredResults.slice(0, topK).map((r) => ({
    ...r,
    vectorScore: r.score,
    keywordScore: 0,
    combinedScore: r.score,
  }));
}

async function keywordSearch(
  options: SearchOptions
): Promise<HybridSearchResult[]> {
  const { documentId, query, topK = 20, filter } = options;

  // Build search conditions
  const conditions: ReturnType<typeof eq>[] = [eq(documentChunks.documentId, documentId)];

  // Filter by categories using array overlap
  if (filter?.categories && filter.categories.length > 0) {
    conditions.push(
      sql`${documentChunks.categories} && ${sql.raw(`ARRAY[${filter.categories.map((c) => `'${c}'`).join(",")}]::text[]`)}`
    );
  }

  if (filter?.contentType) {
    conditions.push(eq(documentChunks.contentType, filter.contentType));
  }

  // Perform keyword search
  const searchTerms = query.toLowerCase().split(" ").filter((t) => t.length > 2);

  const chunks = await db
    .select()
    .from(documentChunks)
    .where(and(...conditions))
    .limit(topK * 2);

  // Score based on keyword matches
  const scored = chunks.map((chunk) => {
    const content = chunk.content.toLowerCase();
    let score = 0;

    for (const term of searchTerms) {
      const matches = (content.match(new RegExp(term, "g")) || []).length;
      score += matches;
    }

    // Normalize score
    const normalizedScore = Math.min(score / 10, 1);

    return {
      id: chunk.pineconeId || chunk.id,
      score: normalizedScore,
      metadata: {
        documentId: chunk.documentId,
        categories: chunk.categories,
        contentType: chunk.contentType,
        chunkIndex: chunk.chunkIndex,
      },
      content: chunk.content,
      vectorScore: 0,
      keywordScore: normalizedScore,
      combinedScore: normalizedScore,
    };
  });

  // Sort by score and return top K
  return scored.sort((a, b) => b.score - a.score).slice(0, topK);
}

function mergeResults(
  vectorResults: HybridSearchResult[],
  keywordResults: HybridSearchResult[],
  topK: number
): HybridSearchResult[] {
  // Hybrid search weights
  const VECTOR_WEIGHT = 0.7;
  const KEYWORD_WEIGHT = 0.3;

  // Create a map to track unique results
  const resultMap = new Map<string, HybridSearchResult>();

  // Add vector results
  for (const result of vectorResults) {
    resultMap.set(result.id, {
      ...result,
      vectorScore: result.vectorScore,
      keywordScore: 0,
      combinedScore: result.vectorScore * VECTOR_WEIGHT,
    });
  }

  // Merge keyword results
  for (const result of keywordResults) {
    if (resultMap.has(result.id)) {
      const existing = resultMap.get(result.id)!;
      resultMap.set(result.id, {
        ...existing,
        keywordScore: result.keywordScore,
        combinedScore: existing.vectorScore * VECTOR_WEIGHT + result.keywordScore * KEYWORD_WEIGHT,
      });
    } else {
      resultMap.set(result.id, {
        ...result,
        vectorScore: 0,
        keywordScore: result.keywordScore,
        combinedScore: result.keywordScore * KEYWORD_WEIGHT,
      });
    }
  }

  // Sort by combined score and return top K
  return Array.from(resultMap.values())
    .sort((a, b) => b.combinedScore - a.combinedScore)
    .slice(0, topK);
}

// MMR (Maximal Marginal Relevance) for diversity
export function applyMMR(
  results: HybridSearchResult[],
  lambda: number = 0.5,
  topK: number = 10
): HybridSearchResult[] {
  if (results.length === 0) return [];

  const selected: HybridSearchResult[] = [results[0]];
  const remaining = results.slice(1);

  while (selected.length < topK && remaining.length > 0) {
    let maxScore = -Infinity;
    let maxIndex = -1;

    for (let i = 0; i < remaining.length; i++) {
      const candidate = remaining[i];

      const maxSimilarity = Math.max(
        ...selected.map((s) => contentSimilarity(s.content, candidate.content))
      );

      const mmrScore =
        lambda * candidate.combinedScore - (1 - lambda) * maxSimilarity;

      if (mmrScore > maxScore) {
        maxScore = mmrScore;
        maxIndex = i;
      }
    }

    if (maxIndex >= 0) {
      selected.push(remaining[maxIndex]);
      remaining.splice(maxIndex, 1);
    }
  }

  return selected;
}

function contentSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/));
  const wordsB = new Set(b.toLowerCase().split(/\s+/));

  const intersection = new Set([...wordsA].filter((x) => wordsB.has(x)));
  const union = new Set([...wordsA, ...wordsB]);

  return intersection.size / union.size;
}
