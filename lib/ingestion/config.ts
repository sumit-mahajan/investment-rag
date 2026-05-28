function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

export function getEmbeddingConfig() {
  return {
    model: (process.env.EMBEDDING_MODEL ?? "gemini-embedding-001") as
      | "gemini-embedding-001"
      | "text-embedding-3-large"
      | "text-embedding-3-small",
    dimensions: Number(process.env.EMBEDDING_DIMENSIONS ?? "768"),
    batchSize: Number(process.env.EMBEDDING_BATCH_SIZE ?? "50"),
    cacheEnabled: false,
  };
}

export function getChunkingConfig() {
  return {
    chunkSize: Number(process.env.CHUNK_SIZE ?? "1500"),
    chunkOverlap: Number(process.env.CHUNK_OVERLAP ?? "200"),
  };
}

export function getPineconeIndexName(): string {
  return requireEnv("PINECONE_INDEX_NAME");
}

export type LlamaParseTier = "fast" | "cost_effective" | "agentic" | "agentic_plus";

export function getLlamaParseConfig() {
  const tier = (process.env.LLAMA_PARSE_TIER ?? "cost_effective") as LlamaParseTier;
  return {
    apiKey: requireEnv("LLAMA_CLOUD_API_KEY"),
    tier,
    version: process.env.LLAMA_PARSE_VERSION ?? "latest",
  };
}
