import { GoogleGenerativeAI } from "@google/generative-ai";
import { EmbeddingConfig } from "@/lib/types/rag";

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
    return this.generateEmbeddings(texts);
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
      const requests = batch.map((text) => ({
        content: { role: "user" as const, parts: [{ text }] },
      }));

      const result = await model.batchEmbedContents({ requests });
      const batchEmbeddings = result.embeddings.map((emb) => {
        const values = emb.values || [];
        return this.config.dimensions < values.length
          ? values.slice(0, this.config.dimensions)
          : values;
      });

      allEmbeddings.push(...batchEmbeddings);
    }

    return allEmbeddings;
  }
}
