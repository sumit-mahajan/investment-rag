import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/di", () => ({
  container: { resolve: vi.fn() },
}));

import { auth } from "@clerk/nextjs/server";
import { container } from "@/lib/di";
import { GET, DELETE } from "@/app/api/documents/[id]/route";

describe("Documents API Routes", () => {
  let mockDocumentService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDocumentService = {
      getFile: vi.fn(),
      deleteFile: vi.fn(),
    };
    vi.mocked(container.resolve).mockReturnValue(mockDocumentService);
  });

  describe("GET /api/documents/[id]", () => {
    it("returns file when authenticated", async () => {
      vi.mocked(auth).mockResolvedValue({ userId: "user-123" } as any);
      mockDocumentService.getFile.mockResolvedValue({
        fileId: "file-123",
        fileName: "test.pdf",
        blobUrl: "https://blob.com/test.pdf",
        userId: "user-123",
        status: "completed",
        chunkCount: 50,
      });

      const response = await GET(
        new NextRequest("http://localhost:3000/api/documents/file-123"),
        { params: Promise.resolve({ id: "file-123" }) }
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.fileId).toBe("file-123");
      expect(data.totalChunks).toBe(50);
    });

    it("returns 401 when not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);
      const response = await GET(
        new NextRequest("http://localhost:3000/api/documents/file-123"),
        { params: Promise.resolve({ id: "file-123" }) }
      );
      expect(response.status).toBe(401);
    });
  });

  describe("DELETE /api/documents/[id]", () => {
    it("deletes file when authenticated", async () => {
      vi.mocked(auth).mockResolvedValue({ userId: "user-123" } as any);
      mockDocumentService.deleteFile.mockResolvedValue(undefined);

      const response = await DELETE(
        new NextRequest("http://localhost:3000/api/documents/file-123", {
          method: "DELETE",
          body: JSON.stringify({ blobUrl: "https://blob.com/test.pdf" }),
        }),
        { params: Promise.resolve({ id: "file-123" }) }
      );

      expect(response.status).toBe(200);
      expect(mockDocumentService.deleteFile).toHaveBeenCalledWith(
        "user-123",
        "file-123",
        "https://blob.com/test.pdf"
      );
    });
  });
});
