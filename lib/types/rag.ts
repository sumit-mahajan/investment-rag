/**
 * Embedding configuration for Gemini vector generation.
 */

export interface EmbeddingConfig {
  model: "gemini-embedding-001" | "text-embedding-3-large" | "text-embedding-3-small";
  dimensions: number;
  batchSize: number;
  cacheEnabled: boolean;
}
