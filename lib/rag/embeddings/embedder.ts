import { GoogleGenerativeAI } from "@google/generative-ai";
import { EmbeddingConfig } from "@/lib/types/rag";
import { db } from "@/lib/db/client";
import { embeddingsCache } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { hashContent } from "@/lib/utils";

export class Embedder {
  private client: GoogleGenerativeAI;
  private config: EmbeddingConfig;

  constructor(config: EmbeddingConfig) {
    this.config = config;

    if (!process.env.GOOGLE_API_KEY) {
      throw new Error("GOOGLE_API_KEY is not set");
    }

    this.client = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    // Check cache first if enabled
    if (this.config.cacheEnabled) {
      const cachedEmbeddings = await this.getCachedEmbeddings(texts);

      const uncachedTexts: string[] = [];
      const uncachedIndices: number[] = [];

      // Pre-allocate array with correct size to avoid sparse array
      const embeddings: number[][] = new Array(texts.length);

      for (let i = 0; i < texts.length; i++) {
        if (cachedEmbeddings[i] !== null) {
          embeddings[i] = cachedEmbeddings[i]!;
        } else {
          uncachedTexts.push(texts[i]);
          uncachedIndices.push(i);
        }
      }

      if (uncachedTexts.length > 0) {
        const newEmbeddings = await this.generateEmbeddings(uncachedTexts);

        // Store in cache
        await this.cacheEmbeddings(uncachedTexts, newEmbeddings);

        // Fill in the embeddings array
        for (let i = 0; i < uncachedIndices.length; i++) {
          embeddings[uncachedIndices[i]] = newEmbeddings[i];
        }
      }

      return embeddings;
    } else {
      return await this.generateEmbeddings(texts);
    }
  }

  async embedSingle(text: string): Promise<number[]> {
    const results = await this.embedBatch([text]);
    return results[0];
  }

  private async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const model = this.client.getGenerativeModel({ model: this.config.model });
    const batchSize = this.config.batchSize;
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      try {
        const requests = batch.map((text) => ({
          content: { role: "user" as const, parts: [{ text }] },
        }));

        const result = await model.batchEmbedContents({ requests });

        const batchEmbeddings = result.embeddings.map((emb) => {
          const values = emb.values || [];
          // Truncate to target dimensions if needed
          return this.config.dimensions < values.length
            ? values.slice(0, this.config.dimensions)
            : values;
        });

        const emptyCount = batchEmbeddings.filter((emb) => emb.length === 0).length;
        if (emptyCount > 0) {
          console.error(
            `Batch ${Math.floor(i / batchSize) + 1}: ${emptyCount}/${batch.length} embeddings are empty`
          );
        }

        allEmbeddings.push(...batchEmbeddings);
      } catch (error) {
        console.error(`Embedding batch ${Math.floor(i / batchSize) + 1} failed:`, error);
        throw new Error(
          `Embedding API failed: ${error instanceof Error ? error.message : String(error)}. ` +
            `Check your GOOGLE_API_KEY and ensure the model "${this.config.model}" is accessible.`
        );
      }
    }

    return allEmbeddings;
  }

  private async getCachedEmbeddings(
    texts: string[]
  ): Promise<(number[] | null)[]> {
    const hashes = await Promise.all(texts.map((t) => hashContent(t)));

    const cached = await db
      .select()
      .from(embeddingsCache)
      .where(
        eq(embeddingsCache.model, this.config.model)
      );

    const cacheMap = new Map<string, number[]>();
    for (const item of cached) {
      cacheMap.set(item.contentHash, item.embedding as number[]);
    }

    return hashes.map((hash) => cacheMap.get(hash) || null);
  }

  private async cacheEmbeddings(
    texts: string[],
    embeddings: number[][]
  ): Promise<void> {
    const hashes = await Promise.all(texts.map((t) => hashContent(t)));

    const records = hashes.map((hash, i) => ({
      contentHash: hash,
      embedding: embeddings[i] as any,
      model: this.config.model,
      dimensions: this.config.dimensions,
    }));

    try {
      await db.insert(embeddingsCache).values(records).onConflictDoNothing();
    } catch (error) {
      console.error("Error caching embeddings:", error);
      // Don't throw - caching is optional
    }
  }
}
