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
      findByUserId: vi.fn().mockResolvedValue([]),
      findByIdAndUserId: vi.fn(),
      findByIdsAndUserId: vi.fn().mockResolvedValue([]),
      exists: vi.fn().mockResolvedValue(false),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    service = new DocumentService(documentRepo as unknown as DocumentRepository);
  });

  describe("registerFile", () => {
    it("returns fileId and completed status after ingestion", async () => {
      const result = await service.registerFile("user-123", {
        blobUrl: "https://blob.com/test.pdf",
        filename: "test.pdf",
        fileBuffer: Buffer.from("test"),
      });

      expect(result.fileId).toBeDefined();
      expect(result.status).toBe("completed");
      expect(result.chunkCount).toBe(10);
      expect(result.fileName).toBe("test.pdf");
      expect(ingestDocument).toHaveBeenCalled();
      expect(documentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-123",
          fileName: "test.pdf",
          status: "completed",
          chunkCount: 10,
        })
      );
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
