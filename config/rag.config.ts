import { RAGConfig } from "@/lib/types/rag";

export const ragConfig: RAGConfig = {
  chunking: {
    strategy: "hybrid",
    chunkSize: 1500,
    chunkOverlap: 200,
    separators: ["\n\n\n", "\n\n", "\n", ". ", "; ", ", ", " "],
    preserveStructures: ["table", "list", "heading"],
    metadata: {
      includePosition: true,
      includePageNumber: true,
    },
  },
  embedding: {
    model: "gemini-embedding-001",
    dimensions: 768,
    batchSize: 50,
    cacheEnabled: true,
  },
  retrieval: {
    topK: 25,
    rerankTopK: 10,
    minSimilarityScore: 0.2,
    useHybridSearch: true,
    useReranking: false,
    mmrDiversity: 0.3,
  },
};

// Standard content categories for financial document analysis
export const contentCategories = [
  "financial-performance",
  "risk-factors",
  "business-operations",
  "management-governance",
  "legal-regulatory",
  "strategy-outlook",
  "general",
] as const;

export type ContentCategory = (typeof contentCategories)[number];
