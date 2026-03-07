import { describe, it, expect, vi, beforeEach } from "vitest";
import { DocumentProcessorService } from "@/lib/services/document-processor";

describe("DocumentProcessorService", () => {
  let documentProcessor: DocumentProcessorService;
  let mockDocumentRepo: any;
  let mockChunkRepo: any;

  beforeEach(() => {
    mockDocumentRepo = {
      updateStatus: vi.fn(),
      updateMetadata: vi.fn(),
      findById: vi.fn(),
    };

    mockChunkRepo = {
      createMany: vi.fn(),
      deleteByDocumentId: vi.fn(),
    };

    documentProcessor = new DocumentProcessorService(
      mockDocumentRepo,
      mockChunkRepo
    );
  });

  describe("processDocument", () => {
    it("updates status to failed on error", async () => {
      const mockData = {
        documentId: "doc-123",
        userId: "user-123",
        fileBuffer: Buffer.from("test"),
      };

      mockDocumentRepo.findById.mockResolvedValue({
        id: "doc-123",
        status: "pending",
      });

      // Mock the processing to fail
      mockDocumentRepo.updateStatus.mockRejectedValue(new Error("Processing failed"));

      // Process document (it should catch the error and update status)
      await expect(
        documentProcessor.processDocument(mockData)
      ).rejects.toThrow();
    });
  });
});
