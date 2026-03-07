/**
 * RAG (Retrieval-Augmented Generation) types
 */

export interface ChunkingConfig {
  strategy: "semantic" | "recursive" | "hybrid";
  chunkSize: number;
  chunkOverlap: number;
  separators?: string[];
  preserveStructures?: ("table" | "list" | "heading")[];
  metadata: {
    includePosition: boolean;
    includePageNumber: boolean;
  };
}

export interface EmbeddingConfig {
  model: "gemini-embedding-001" | "text-embedding-3-large" | "text-embedding-3-small";
  dimensions: number;
  batchSize: number;
  cacheEnabled: boolean;
}

export interface RetrievalConfig {
  topK: number;
  rerankTopK: number;
  minSimilarityScore: number;
  useHybridSearch: boolean;
  useReranking: boolean;
  mmrDiversity: number;
}

export interface RAGConfig {
  chunking: ChunkingConfig;
  embedding: EmbeddingConfig;
  retrieval: RetrievalConfig;
}

export interface SearchResult {
  id: string;
  score: number;
  metadata: Record<string, any>;
  content: string;
}

export interface HybridSearchResult extends SearchResult {
  vectorScore: number;
  keywordScore: number;
  combinedScore: number;
  rerankedScore?: number;
}
