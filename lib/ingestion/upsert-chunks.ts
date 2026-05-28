import type { Chunk, ChunkMetadata } from "@/lib/types/core";
import { upsertVectors, type VectorRecord } from "@/lib/vectorstore/operations";

export function buildChunkMetadata(chunk: Chunk, userId: string): ChunkMetadata {
  return {
    fileId: chunk.fileId,
    fileName: chunk.fileName,
    blobUrl: chunk.blobUrl,
    pageNumber: chunk.pageNumber,
    content: chunk.content,
    chunkType: chunk.chunkType,
    userId,
  };
}

export async function upsertChunks(
  chunks: Chunk[],
  embeddings: number[][],
  userId: string
): Promise<void> {
  if (chunks.length !== embeddings.length) {
    throw new Error("chunks and embeddings length mismatch");
  }

  const vectors: VectorRecord[] = chunks.map((chunk, i) => ({
    id: chunk.id,
    values: embeddings[i],
    metadata: buildChunkMetadata(chunk, userId) as unknown as Record<string, string | number>,
  }));

  await upsertVectors(vectors, userId);
}
