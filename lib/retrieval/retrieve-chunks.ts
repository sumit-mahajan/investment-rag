import { Embedder } from "@/lib/rag/embeddings/embedder";
import { getEmbeddingConfig } from "@/lib/ingestion/config";
import { queryVectors } from "@/lib/vectorstore/operations";
import type { RetrievedChunk } from "@/lib/types/core";

export interface RetrieveChunksOptions {
  userId: string;
  fileIds: string[];
  query: string;
  topK?: number;
}

/** Singleton embedder — reused across all retrieve calls in a request lifecycle. */
let sharedEmbedder: Embedder | null = null;
function getEmbedder(): Embedder {
  if (!sharedEmbedder) sharedEmbedder = new Embedder(getEmbeddingConfig());
  return sharedEmbedder;
}

function toRetrievedChunk(match: {
  id: string;
  score: number;
  metadata: {
    fileId: string;
    fileName: string;
    blobUrl: string;
    pageNumber: number;
    content: string;
    chunkType: "prose" | "table";
    userId: string;
  };
  content: string;
}): RetrievedChunk {
  const m = match.metadata;
  return {
    id: match.id,
    fileId: m.fileId,
    fileName: m.fileName,
    blobUrl: m.blobUrl,
    pageNumber: m.pageNumber,
    content: match.content,
    chunkType: m.chunkType,
    chunkIndex: 0,
    score: match.score,
  };
}

/**
 * Dense vector retrieval scoped to fileIds in the user's Pinecone namespace.
 */
export async function retrieveChunks(
  options: RetrieveChunksOptions
): Promise<RetrievedChunk[]> {
  const { userId, fileIds, query, topK = 8 } = options;

  if (fileIds.length === 0 || !query.trim()) return [];

  const vector = await getEmbedder().embedSingle(query);

  const filter =
    fileIds.length === 1
      ? { fileId: { $eq: fileIds[0] } }
      : { fileId: { $in: fileIds } };

  const matches = await queryVectors(vector, topK, filter, userId);
  return matches.map(toRetrievedChunk);
}

export function dedupeChunks(chunks: RetrievedChunk[]): RetrievedChunk[] {
  const seen = new Map<string, RetrievedChunk>();
  for (const chunk of chunks) {
    const existing = seen.get(chunk.id);
    if (!existing || chunk.score > existing.score) {
      seen.set(chunk.id, chunk);
    }
  }
  return Array.from(seen.values()).sort((a, b) => b.score - a.score);
}

export function chunkToCitation(chunk: RetrievedChunk): import("@/lib/types/analysis").Citation {
  return {
    documentName: chunk.fileName,
    pageNumber: chunk.pageNumber,
    fileId: chunk.fileId,
    blobUrl: chunk.blobUrl,
  };
}
