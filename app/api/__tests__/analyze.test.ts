import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock Clerk auth
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

// Mock DI container
vi.mock("@/lib/di", () => ({
  container: {
    resolve: vi.fn(),
  },
}));

import { auth } from "@clerk/nextjs/server";
import { container } from "@/lib/di";
import { POST } from "@/app/api/analyze/route";
import { createMockAnalysis } from "@/lib/__tests__/utils/test-data";

describe("Analyze API Route", () => {
  let mockAnalysisService: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockAnalysisService = {
      startAnalysis: vi.fn(),
    };

    vi.mocked(container.resolve).mockReturnValue(mockAnalysisService);
  });

  describe("POST /api/analyze", () => {
    it("starts analysis when authenticated with valid data", async () => {
      vi.mocked(auth).mockResolvedValue({ userId: "user-123" } as any);

      const mockAnalysis = createMockAnalysis({ id: "analysis-123" });
      mockAnalysisService.startAnalysis.mockResolvedValue(mockAnalysis);

      const requestData = {
        documentId: "550e8400-e29b-41d4-a716-446655440000",
        criteriaIds: ["financial-health", "risk-assessment"],
      };

      const request = new NextRequest("http://localhost:3000/api/analyze", {
        method: "POST",
        body: JSON.stringify(requestData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.analysisId).toBe("analysis-123");
      expect(mockAnalysisService.startAnalysis).toHaveBeenCalledWith(
        "user-123",
        "550e8400-e29b-41d4-a716-446655440000",
        ["financial-health", "risk-assessment"],
        expect.any(Object)
      );
    });

    it("returns 401 when not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);

      const requestData = {
        documentId: "550e8400-e29b-41d4-a716-446655440000",
        criteriaIds: ["financial-health"],
      };

      const request = new NextRequest("http://localhost:3000/api/analyze", {
        method: "POST",
        body: JSON.stringify(requestData),
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it("returns 400 when criteriaIds is empty", async () => {
      vi.mocked(auth).mockResolvedValue({ userId: "user-123" } as any);

      const requestData = {
        documentId: "550e8400-e29b-41d4-a716-446655440000",
        criteriaIds: [],
      };

      const request = new NextRequest("http://localhost:3000/api/analyze", {
        method: "POST",
        body: JSON.stringify(requestData),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it("returns 400 when criteriaIds exceeds limit", async () => {
      vi.mocked(auth).mockResolvedValue({ userId: "user-123" } as any);

      const requestData = {
        documentId: "550e8400-e29b-41d4-a716-446655440000",
        criteriaIds: Array(15).fill("criterion-1"),
      };

      const request = new NextRequest("http://localhost:3000/api/analyze", {
        method: "POST",
        body: JSON.stringify(requestData),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it("handles analysis start errors gracefully", async () => {
      vi.mocked(auth).mockResolvedValue({ userId: "user-123" } as any);
      mockAnalysisService.startAnalysis.mockRejectedValue(
        new Error("Analysis failed to start")
      );

      const requestData = {
        documentId: "550e8400-e29b-41d4-a716-446655440000",
        criteriaIds: ["financial-health"],
      };

      const request = new NextRequest("http://localhost:3000/api/analyze", {
        method: "POST",
        body: JSON.stringify(requestData),
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
    });
  });
});
