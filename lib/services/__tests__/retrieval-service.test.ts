import { describe, it, expect, vi } from "vitest";
import { retrieveRelevantChunks } from "@/lib/services/retrieval-service";

// Mock all external dependencies
vi.mock("@/lib/vectorstore/operations", () => ({
  queryVectors: vi.fn(),
}));

vi.mock("@/lib/rag/embeddings/embedder", () => ({
  embedder: {
    embedQuery: vi.fn(),
  },
}));

vi.mock("@/lib/repositories/document-chunk.repository", () => ({
  DocumentChunkRepository: vi.fn(),
}));

describe("RetrievalService", () => {
  describe("retrieveRelevantChunks", () => {
    it("requires query parameter", async () => {
      await expect(
        retrieveRelevantChunks({
          documentId: "doc-123",
          userId: "user-123",
          query: "",
          topK: 5,
        })
      ).rejects.toThrow();
    });

    it("requires valid topK value", async () => {
      await expect(
        retrieveRelevantChunks({
          documentId: "doc-123",
          userId: "user-123",
          query: "test query",
          topK: 0,
        })
      ).rejects.toThrow();
    });

    it("validates documentId is provided", async () => {
      await expect(
        retrieveRelevantChunks({
          documentId: "",
          userId: "user-123",
          query: "test query",
          topK: 5,
        })
      ).rejects.toThrow();
    });
  });
});
