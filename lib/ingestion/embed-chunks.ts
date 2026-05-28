import { Embedder } from "@/lib/rag/embeddings/embedder";
import type { Chunk } from "@/lib/types/core";
import { getEmbeddingConfig } from "./config";

export async function embedChunks(chunks: Chunk[]): Promise<number[][]> {
  if (chunks.length === 0) {
    return [];
  }

  const embedder = new Embedder(getEmbeddingConfig());
  const texts = chunks.map((c) => c.content);
  const embeddings = await embedder.embedBatch(texts);

  const emptyCount = embeddings.filter((e) => e.length === 0).length;
  if (emptyCount > 0) {
    throw new Error(
      `Embedding API returned ${emptyCount} empty vector(s). Check GOOGLE_API_KEY and EMBEDDING_MODEL.`
    );
  }

  return embeddings;
}
