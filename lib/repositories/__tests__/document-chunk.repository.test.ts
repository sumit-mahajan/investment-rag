import { describe, it, expect, beforeEach } from "vitest";
import { DocumentChunkRepository } from "../document-chunk.repository";

describe("DocumentChunkRepository", () => {
  let repository: DocumentChunkRepository;

  beforeEach(() => {
    repository = new DocumentChunkRepository();
  });

  describe("constructor", () => {
    it("should create instance successfully", () => {
      expect(repository).toBeInstanceOf(DocumentChunkRepository);
    });
  });

  describe("methods", () => {
    it("should have create method", () => {
      expect(typeof repository.create).toBe("function");
    });

    it("should have findByDocumentId method", () => {
      expect(typeof repository.findByDocumentId).toBe("function");
    });

    it("should have createBatch method", () => {
      expect(typeof repository.createBatch).toBe("function");
    });

    it("should have deleteByDocumentId method", () => {
      expect(typeof repository.deleteByDocumentId).toBe("function");
    });

    it("should have countByDocumentId method", () => {
      expect(typeof repository.countByDocumentId).toBe("function");
    });
  });
});
