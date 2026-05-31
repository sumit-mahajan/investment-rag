import { describe, it, expect, vi, beforeEach } from "vitest";
import { DocumentService } from "../document.service";
import { DocumentRepository } from "@/lib/repositories/document.repository";
import { NotFoundError } from "@/lib/errors/domain-errors";

vi.mock("@/lib/ingestion", () => ({
  ingestDocument: vi.fn().mockResolvedValue(10),
}));
vi.mock("@/lib/vectorstore/operations", () => ({
  deleteVectorsByFileId: vi.fn(),
}));
vi.mock("@vercel/blob", () => ({ del: vi.fn().mockResolvedValue(undefined) }));

import { ingestDocument } from "@/lib/ingestion";
import { deleteVectorsByFileId } from "@/lib/vectorstore/operations";

describe("DocumentService", () => {
  let service: DocumentService;
  let documentRepo: {
    create: ReturnType<typeof vi.fn>;
    updateIngestResult: ReturnType<typeof vi.fn>;
    findByUserId: ReturnType<typeof vi.fn>;
    findByIdAndUserId: ReturnType<typeof vi.fn>;
    findByIdsAndUserId: ReturnType<typeof vi.fn>;
    exists: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    documentRepo = {
      create: vi.fn().mockResolvedValue({}),
      updateIngestResult: vi.fn().mockResolvedValue({}),
      findByUserId: vi.fn().mockResolvedValue([]),
      findByIdAndUserId: vi.fn(),
      findByIdsAndUserId: vi.fn().mockResolvedValue([]),
      exists: vi.fn().mockResolvedValue(false),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    service = new DocumentService(documentRepo as unknown as DocumentRepository);
  });

  describe("startIngestion", () => {
    it("creates a processing row and returns immediately", async () => {
      const result = await service.startIngestion("user-123", {
        blobUrl: "https://blob.com/test.pdf",
        filename: "test.pdf",
      });

      expect(result.status).toBe("processing");
      expect(result.fileName).toBe("test.pdf");
      expect(result.fileId).toBeDefined();
      expect(ingestDocument).not.toHaveBeenCalled();
      expect(documentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-123",
          fileName: "test.pdf",
          status: "processing",
          chunkCount: 0,
        })
      );
    });
  });

  describe("executeIngestion", () => {
    it("ingests from blob and marks document completed", async () => {
      documentRepo.findByIdAndUserId.mockResolvedValue({
        fileId: "file-1",
        fileName: "test.pdf",
        blobUrl: "https://blob.com/test.pdf",
        userId: "user-123",
        status: "processing",
        chunkCount: 0,
      });

      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
        })
      );

      await service.executeIngestion("file-1", "user-123");

      expect(ingestDocument).toHaveBeenCalled();
      expect(documentRepo.updateIngestResult).toHaveBeenCalledWith("file-1", "user-123", {
        status: "completed",
        chunkCount: 10,
      });

      vi.unstubAllGlobals();
    });

    it("marks document failed when ingestion throws", async () => {
      documentRepo.findByIdAndUserId.mockResolvedValue({
        fileId: "file-1",
        fileName: "test.pdf",
        blobUrl: "https://blob.com/test.pdf",
        userId: "user-123",
        status: "processing",
        chunkCount: 0,
      });

      vi.mocked(ingestDocument).mockRejectedValueOnce(new Error("parse failed"));
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          arrayBuffer: async () => new Uint8Array([1]).buffer,
        })
      );

      await service.executeIngestion("file-1", "user-123");

      expect(deleteVectorsByFileId).toHaveBeenCalledWith("user-123", "file-1");
      expect(documentRepo.updateIngestResult).toHaveBeenCalledWith("file-1", "user-123", {
        status: "failed",
        chunkCount: 0,
      });

      vi.unstubAllGlobals();
    });

    it("skips when document is not in processing state", async () => {
      documentRepo.findByIdAndUserId.mockResolvedValue({
        fileId: "file-1",
        fileName: "test.pdf",
        blobUrl: "https://blob.com/test.pdf",
        userId: "user-123",
        status: "completed",
        chunkCount: 5,
      });

      await service.executeIngestion("file-1", "user-123");

      expect(ingestDocument).not.toHaveBeenCalled();
    });
  });

  describe("getFile", () => {
    it("throws NotFoundError when file not in registry", async () => {
      documentRepo.findByIdAndUserId.mockResolvedValue(null);
      await expect(service.getFile("user-123", "missing-id")).rejects.toThrow(NotFoundError);
    });

    it("returns file when found", async () => {
      documentRepo.findByIdAndUserId.mockResolvedValue({
        fileId: "file-1",
        fileName: "test.pdf",
        blobUrl: "https://blob.com/test.pdf",
        userId: "user-123",
        status: "completed",
        chunkCount: 5,
      });
      const result = await service.getFile("user-123", "file-1");
      expect(result.fileName).toBe("test.pdf");
    });
  });

  describe("deleteFile", () => {
    it("deletes vectors, blob, and postgres row", async () => {
      documentRepo.findByIdAndUserId.mockResolvedValue({
        fileId: "file-1",
        fileName: "test.pdf",
        blobUrl: "https://blob.com/test.pdf",
        userId: "user-123",
        status: "completed",
      });
      await service.deleteFile("user-123", "file-1");
      expect(deleteVectorsByFileId).toHaveBeenCalledWith("user-123", "file-1");
      expect(documentRepo.delete).toHaveBeenCalledWith("file-1", "user-123");
    });
  });
});
