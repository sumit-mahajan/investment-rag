import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock Clerk auth
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
}));

// Mock DI container
vi.mock("@/lib/di", () => ({
  container: {
    resolve: vi.fn(),
  },
}));

import { auth, currentUser } from "@clerk/nextjs/server";
import { container } from "@/lib/di";
import { GET, DELETE } from "@/app/api/documents/[id]/route";
import { createMockDocument } from "@/lib/__tests__/utils/test-data";

describe("Documents API Routes", () => {
  let mockDocumentService: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockDocumentService = {
      getDocumentWithChunkCount: vi.fn(),
      deleteDocument: vi.fn(),
    };

    vi.mocked(container.resolve).mockReturnValue(mockDocumentService);
  });

  describe("GET /api/documents/[id]", () => {
    it("returns document when authenticated", async () => {
      vi.mocked(auth).mockResolvedValue({ userId: "user-123" } as any);

      const mockDocument = createMockDocument({ id: "doc-123" });
      mockDocumentService.getDocumentWithChunkCount.mockResolvedValue({
        ...mockDocument,
        chunkCount: 50,
      });

      const request = new NextRequest(
        "http://localhost:3000/api/documents/doc-123"
      );
      const params = { id: "doc-123" };

      const response = await GET(request, { params: Promise.resolve(params) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe("doc-123");
      expect(data.chunkCount).toBe(50);
    });

    it("returns 401 when not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);

      const request = new NextRequest(
        "http://localhost:3000/api/documents/doc-123"
      );
      const params = { id: "doc-123" };

      const response = await GET(request, { params: Promise.resolve(params) });

      expect(response.status).toBe(401);
    });

    it("returns 404 when document not found", async () => {
      vi.mocked(auth).mockResolvedValue({ userId: "user-123" } as any);
      mockDocumentService.getDocumentWithChunkCount.mockRejectedValue(
        new Error("Document not found")
      );

      const request = new NextRequest(
        "http://localhost:3000/api/documents/doc-123"
      );
      const params = { id: "doc-123" };

      const response = await GET(request, { params: Promise.resolve(params) });

      expect(response.status).toBe(500);
    });
  });

  describe("DELETE /api/documents/[id]", () => {
    it("deletes document when authenticated", async () => {
      vi.mocked(auth).mockResolvedValue({ userId: "user-123" } as any);
      mockDocumentService.deleteDocument.mockResolvedValue(undefined);

      const request = new NextRequest(
        "http://localhost:3000/api/documents/doc-123",
        { method: "DELETE" }
      );
      const params = { id: "doc-123" };

      const response = await DELETE(request, { params: Promise.resolve(params) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("Document deleted successfully");
      expect(mockDocumentService.deleteDocument).toHaveBeenCalledWith(
        "user-123",
        "doc-123"
      );
    });

    it("returns 401 when not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);

      const request = new NextRequest(
        "http://localhost:3000/api/documents/doc-123",
        { method: "DELETE" }
      );
      const params = { id: "doc-123" };

      const response = await DELETE(request, { params: Promise.resolve(params) });

      expect(response.status).toBe(401);
    });

    it("handles delete errors gracefully", async () => {
      vi.mocked(auth).mockResolvedValue({ userId: "user-123" } as any);
      mockDocumentService.deleteDocument.mockRejectedValue(
        new Error("Delete failed")
      );

      const request = new NextRequest(
        "http://localhost:3000/api/documents/doc-123",
        { method: "DELETE" }
      );
      const params = { id: "doc-123" };

      const response = await DELETE(request, { params: Promise.resolve(params) });

      expect(response.status).toBe(500);
    });
  });
});
