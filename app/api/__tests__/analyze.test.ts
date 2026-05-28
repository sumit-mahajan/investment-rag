import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/di", () => ({ container: { resolve: vi.fn() } }));
vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  return {
    ...actual,
    after: (callback: () => void | Promise<void>) => {
      void callback();
    },
  };
});

import { auth } from "@clerk/nextjs/server";
import { container } from "@/lib/di";
import { POST } from "@/app/api/analyze/route";
import { createMockAnalysis } from "@/lib/__tests__/utils/test-data";

describe("POST /api/analyze", () => {
  let mockAnalysisService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAnalysisService = { startAnalysis: vi.fn(), executeAnalysis: vi.fn().mockResolvedValue(undefined) };
    vi.mocked(container.resolve).mockReturnValue(mockAnalysisService);
  });

  it("starts analysis when authenticated with valid data", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user-123" } as any);
    mockAnalysisService.startAnalysis.mockResolvedValue(createMockAnalysis({ id: "analysis-123" }));

    const request = new NextRequest("http://localhost:3000/api/analyze", {
      method: "POST",
      body: JSON.stringify({
        documentIds: ["550e8400-e29b-41d4-a716-446655440000"],
        question: "What are the key financial risks?",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.analysisId).toBe("analysis-123");
    expect(mockAnalysisService.startAnalysis).toHaveBeenCalledWith(
      "user-123",
      ["550e8400-e29b-41d4-a716-446655440000"],
      "What are the key financial risks?"
    );
    expect(mockAnalysisService.executeAnalysis).toHaveBeenCalledWith(
      "analysis-123",
      "user-123",
      "What are the key financial risks?"
    );
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as any);

    const request = new NextRequest("http://localhost:3000/api/analyze", {
      method: "POST",
      body: JSON.stringify({
        documentIds: ["550e8400-e29b-41d4-a716-446655440000"],
        question: "test",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("returns 400 when documentIds is missing", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user-123" } as any);

    const request = new NextRequest("http://localhost:3000/api/analyze", {
      method: "POST",
      body: JSON.stringify({ question: "test" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("starts analysis without question (uses default in service)", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user-123" } as any);
    mockAnalysisService.startAnalysis.mockResolvedValue(createMockAnalysis({ id: "analysis-456" }));

    const request = new NextRequest("http://localhost:3000/api/analyze", {
      method: "POST",
      body: JSON.stringify({ fileIds: ["550e8400-e29b-41d4-a716-446655440000"] }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(mockAnalysisService.startAnalysis).toHaveBeenCalledWith(
      "user-123",
      ["550e8400-e29b-41d4-a716-446655440000"],
      ""
    );
  });

  it("returns 500 on service error", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user-123" } as any);
    mockAnalysisService.startAnalysis.mockRejectedValue(new Error("Analysis failed"));

    const request = new NextRequest("http://localhost:3000/api/analyze", {
      method: "POST",
      body: JSON.stringify({
        documentIds: ["550e8400-e29b-41d4-a716-446655440000"],
        question: "test",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
  });
});
