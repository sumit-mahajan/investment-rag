import { describe, it, expect, vi, beforeEach } from "vitest";
import { DocumentService } from "../document.service";
import { NotFoundError } from "@/lib/errors/domain-errors";

vi.mock("@/lib/ingestion", () => ({
  ingestDocument: vi.fn().mockResolvedValue(10),
}));
vi.mock("@/lib/vectorstore/operations", () => ({
  listUserFiles: vi.fn(),
  deleteVectorsByFileId: vi.fn(),
}));
vi.mock("@vercel/blob", () => ({ del: vi.fn().mockResolvedValue(undefined) }));

import { listUserFiles, deleteVectorsByFileId } from "@/lib/vectorstore/operations";

describe("DocumentService", () => {
  let service: DocumentService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new DocumentService();
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
    });
  });

  describe("getFile", () => {
    it("throws NotFoundError when file not in Pinecone", async () => {
      vi.mocked(listUserFiles).mockResolvedValue([]);
      await expect(service.getFile("user-123", "missing-id")).rejects.toThrow(NotFoundError);
    });

    it("returns file when found", async () => {
      vi.mocked(listUserFiles).mockResolvedValue([
        {
          fileId: "file-1",
          fileName: "test.pdf",
          blobUrl: "https://blob.com/test.pdf",
          userId: "user-123",
          status: "completed",
          chunkCount: 5,
        },
      ]);
      const result = await service.getFile("user-123", "file-1");
      expect(result.fileName).toBe("test.pdf");
    });
  });

  describe("deleteFile", () => {
    it("deletes vectors and blob", async () => {
      vi.mocked(listUserFiles).mockResolvedValue([
        {
          fileId: "file-1",
          fileName: "test.pdf",
          blobUrl: "https://blob.com/test.pdf",
          userId: "user-123",
          status: "completed",
        },
      ]);
      await service.deleteFile("user-123", "file-1");
      expect(deleteVectorsByFileId).toHaveBeenCalledWith("user-123", "file-1");
    });
  });
});
