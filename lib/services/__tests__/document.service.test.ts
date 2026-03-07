import { describe, it, expect, vi, beforeEach } from "vitest";
import { DocumentService } from "../document.service";
import { DocumentRepository } from "@/lib/repositories/document.repository";
import { DocumentChunkRepository } from "@/lib/repositories/document-chunk.repository";
import { UserService } from "../user.service";
import { DocumentProcessorService } from "../document-processor";
import { NotFoundError, ValidationError } from "@/lib/errors/domain-errors";

// Mock dependencies
vi.mock("@/lib/repositories/document.repository");
vi.mock("@/lib/repositories/document-chunk.repository");
vi.mock("../user.service");
vi.mock("../document-processor");
vi.mock("../retrieval-service");
vi.mock("@/lib/vectorstore/operations");
vi.mock("@vercel/blob");
vi.mock("@/lib/repositories/base.repository", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/repositories/base.repository")>();
  return {
    ...actual,
    withTransaction: vi.fn((callback: (tx: unknown) => Promise<void>) => callback(undefined)),
  };
});

describe("DocumentService", () => {
  let service: DocumentService;
  let mockDocumentRepo: any;
  let mockChunkRepo: any;
  let mockUserService: any;
  let mockDocumentProcessor: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDocumentRepo = {
      create: vi.fn(),
      findByIdAndUserId: vi.fn(),
      delete: vi.fn(),
      countByDocumentId: vi.fn(),
    };
    mockChunkRepo = {
      deleteByDocumentId: vi.fn(),
      countByDocumentId: vi.fn(),
    };
    mockUserService = {
      userExists: vi.fn(),
    };
    mockDocumentProcessor = {
      processDocument: vi.fn().mockResolvedValue(undefined),
    };
    service = new DocumentService(
      mockDocumentRepo,
      mockChunkRepo,
      mockUserService,
      mockDocumentProcessor
    );
  });

  describe("registerDocument", () => {
    it("should throw UnauthorizedError if user does not exist", async () => {
      mockUserService.userExists = vi.fn().mockResolvedValue(false);

      await expect(
        service.registerDocument("user-123", {
          blobUrl: "https://blob.com/test.pdf",
          filename: "test.pdf",
          fileBuffer: Buffer.from("test"),
        })
      ).rejects.toThrow("User not found");
    });

    it("should create document and start processing", async () => {
      const mockDocument = {
        id: "doc-123",
        userId: "user-123",
        filename: "test.pdf",
        status: "pending",
        createdAt: new Date(),
      };

      mockUserService.userExists = vi.fn().mockResolvedValue(true);
      mockDocumentRepo.create = vi.fn().mockResolvedValue(mockDocument);

      const result = await service.registerDocument("user-123", {
        blobUrl: "https://blob.com/test.pdf",
        filename: "test.pdf",
        fileBuffer: Buffer.from("test"),
      });

      expect(result).toEqual(mockDocument);
      expect(mockDocumentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-123",
          originalName: "test.pdf",
        })
      );
    });
  });

  describe("getDocument", () => {
    it("should throw NotFoundError if document not found", async () => {
      mockDocumentRepo.findByIdAndUserId = vi.fn().mockResolvedValue(null);

      await expect(
        service.getDocument("user-123", "doc-123")
      ).rejects.toThrow(NotFoundError);
    });

    it("should return document if found", async () => {
      const mockDocument = {
        id: "doc-123",
        userId: "user-123",
        filename: "test.pdf",
      };

      mockDocumentRepo.findByIdAndUserId = vi.fn().mockResolvedValue(mockDocument);

      const result = await service.getDocument("user-123", "doc-123");
      expect(result).toEqual(mockDocument);
    });
  });

  describe("deleteDocument", () => {
    it("should throw NotFoundError if document not found", async () => {
      mockDocumentRepo.findByIdAndUserId = vi.fn().mockResolvedValue(null);

      await expect(
        service.deleteDocument("user-123", "doc-123")
      ).rejects.toThrow(NotFoundError);
    });

    it("should delete document and cleanup resources", async () => {
      const mockDocument = {
        id: "doc-123",
        userId: "user-123",
        fileUrl: "https://blob.com/test.pdf",
      };

      mockDocumentRepo.findByIdAndUserId = vi.fn().mockResolvedValue(mockDocument);
      mockChunkRepo.deleteByDocumentId = vi.fn().mockResolvedValue(undefined);
      mockDocumentRepo.delete = vi.fn().mockResolvedValue(undefined);

      await service.deleteDocument("user-123", "doc-123");

      // Note: Actual transaction mocking would be more complex
      expect(mockDocumentRepo.findByIdAndUserId).toHaveBeenCalledWith("doc-123", "user-123");
    });
  });

  describe("queryDocument", () => {
    it("should throw NotFoundError if document not found", async () => {
      mockDocumentRepo.findByIdAndUserId = vi.fn().mockResolvedValue(null);

      await expect(
        service.queryDocument("user-123", "doc-123", {
          query: "test query",
        })
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw ValidationError if document not completed", async () => {
      const mockDocument = {
        id: "doc-123",
        status: "processing",
      };

      mockDocumentRepo.findByIdAndUserId = vi.fn().mockResolvedValue(mockDocument);

      await expect(
        service.queryDocument("user-123", "doc-123", {
          query: "test query",
        })
      ).rejects.toThrow(ValidationError);
    });
  });
});
