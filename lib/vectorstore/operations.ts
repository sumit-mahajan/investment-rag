import { getIndex } from "./pinecone-client";
import { SearchResult, HybridSearchResult } from "@/types/rag";

export interface VectorRecord {
  id: string;
  values: number[];
  metadata: Record<string, any>;
}

export async function upsertVectors(
  vectors: VectorRecord[],
  namespace?: string
): Promise<void> {
  const index = getIndex();

  // Batch upsert in chunks of 100
  const batchSize = 100;
  for (let i = 0; i < vectors.length; i += batchSize) {
    const batch = vectors.slice(i, i + batchSize);
    await index.namespace(namespace || "").upsert(batch);
  }
}

export async function queryVectors(
  vector: number[],
  topK: number = 10,
  filter?: Record<string, any>,
  namespace?: string
): Promise<SearchResult[]> {
  const index = getIndex();

  const results = await index.namespace(namespace || "").query({
    vector,
    topK,
    filter,
    includeMetadata: true,
  });

  return results.matches.map((match) => ({
    id: match.id,
    score: match.score || 0,
    metadata: match.metadata || {},
    content: (match.metadata?.content as string) || "",
  }));
}

export async function deleteVectorsByDocumentId(
  documentId: string,
  userId: string
): Promise<void> {
  const index = getIndex();
  const namespace = `${userId}_${documentId}`;

  // Delete entire namespace
  await index.namespace(namespace).deleteAll();
}

export async function deleteNamespace(namespace: string): Promise<void> {
  const index = getIndex();
  await index.namespace(namespace).deleteAll();
}
