import { describe, it, expect, vi, beforeEach } from "vitest";
import { AnalysisService } from "@/lib/services/analysis.service";
import { NotFoundError } from "@/lib/errors/domain-errors";
import { createMockAnalysis } from "@/lib/__tests__/utils/test-data";
import { analysisCriteria } from "@/config/criteria.config";

vi.mock("@/lib/repositories/base.repository", () => ({
  withTransaction: vi.fn((callback: (tx: unknown) => Promise<unknown>) =>
    callback(undefined)
  ),
}));

describe("AnalysisService", () => {
  let analysisService: AnalysisService;
  let mockAnalysisRepo: any;
  let mockAnalysisCriteriaRepo: any;
  let mockDocumentRepo: any;

  beforeEach(() => {
    mockAnalysisRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      findByIdAndUserId: vi.fn(),
      findByUserId: vi.fn(),
      findByDocumentId: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      countByUserId: vi.fn(),
      updateStatus: vi.fn(),
    };

    mockAnalysisCriteriaRepo = {
      create: vi.fn(),
      findByAnalysisId: vi.fn(),
      createMany: vi.fn(),
      deleteByAnalysisId: vi.fn(),
    };

    mockDocumentRepo = {
      findByIdAndUserId: vi.fn(),
    };

    analysisService = new AnalysisService(
      mockAnalysisRepo,
      mockAnalysisCriteriaRepo,
      mockDocumentRepo
    );
  });

  describe("startAnalysis", () => {
    it("creates analysis with pending status", async () => {
      const mockDocument = {
        id: "doc-123",
        userId: "user-123",
        status: "completed",
      };

      const mockAnalysis = createMockAnalysis({
        id: "analysis-123",
        status: "pending",
      });

      mockDocumentRepo.findByIdAndUserId.mockResolvedValue(mockDocument);
      mockAnalysisRepo.create.mockResolvedValue(mockAnalysis);

      const result = await analysisService.startAnalysis(
        "user-123",
        "doc-123",
        ["financial-health", "risk-assessment"],
        analysisCriteria
      );

      expect(mockDocumentRepo.findByIdAndUserId).toHaveBeenCalledWith(
        "doc-123",
        "user-123"
      );
      expect(mockAnalysisRepo.create).toHaveBeenCalled();
      expect(result.status).toBe("pending");
    });

    it("throws NotFoundError when document not found", async () => {
      mockDocumentRepo.findByIdAndUserId.mockResolvedValue(null);

      await expect(
        analysisService.startAnalysis(
          "user-123",
          "doc-123",
          ["financial-health"],
          analysisCriteria
        )
      ).rejects.toThrow(NotFoundError);
    });

    it("throws error when document is not completed", async () => {
      const mockDocument = {
        id: "doc-123",
        userId: "user-123",
        status: "processing",
      };

      mockDocumentRepo.findByIdAndUserId.mockResolvedValue(mockDocument);

      await expect(
        analysisService.startAnalysis(
          "user-123",
          "doc-123",
          ["financial-health"],
          analysisCriteria
        )
      ).rejects.toThrow();
    });
  });

  describe("getAnalysis", () => {
    it("returns analysis with criteria", async () => {
      const mockAnalysis = createMockAnalysis();
      const mockCriteria = [
        {
          id: "crit-1",
          analysisId: "analysis-123",
          criterionName: "Financial Health",
          score: "0.9",
          findings: "Strong performance",
        },
      ];

      mockAnalysisRepo.findByIdAndUserId.mockResolvedValue(mockAnalysis);
      mockAnalysisCriteriaRepo.findByAnalysisId.mockResolvedValue(mockCriteria);

      const result = await analysisService.getAnalysis("user-123", "analysis-123");

      expect(mockAnalysisRepo.findByIdAndUserId).toHaveBeenCalledWith(
        "analysis-123",
        "user-123"
      );
      expect(mockAnalysisCriteriaRepo.findByAnalysisId).toHaveBeenCalledWith(
        "analysis-123"
      );
      expect(result).toHaveProperty("criteria");
    });

    it("throws NotFoundError when analysis not found", async () => {
      mockAnalysisRepo.findByIdAndUserId.mockResolvedValue(null);

      await expect(
        analysisService.getAnalysis("user-123", "analysis-123")
      ).rejects.toThrow(NotFoundError);
    });

    it("throws NotFoundError when analysis belongs to different user", async () => {
      const mockAnalysis = createMockAnalysis({
        userId: "different-user",
      });

      mockAnalysisRepo.findByIdAndUserId.mockResolvedValue(null);

      await expect(
        analysisService.getAnalysis("user-123", "analysis-123")
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("listUserAnalyses", () => {
    it("returns list of user analyses", async () => {
      const mockDocument = {
        id: "doc-123",
        originalName: "Test Document.pdf",
        companyName: "Test Company",
      };
      const mockAnalyses = [
        {
          ...createMockAnalysis({ id: "analysis-1" }),
          document: mockDocument,
        },
        {
          ...createMockAnalysis({ id: "analysis-2" }),
          document: mockDocument,
        },
      ];

      mockAnalysisRepo.findByUserId.mockResolvedValue(mockAnalyses);

      const result = await analysisService.listUserAnalyses("user-123");

      expect(mockAnalysisRepo.findByUserId).toHaveBeenCalledWith("user-123", undefined);
      expect(result).toHaveLength(2);
    });

    it("applies filters when provided", async () => {
      mockAnalysisRepo.findByUserId.mockResolvedValue([]);

      await analysisService.listUserAnalyses("user-123", {
        status: "completed",
      });

      expect(mockAnalysisRepo.findByUserId).toHaveBeenCalledWith("user-123", {
        status: "completed",
      });
    });
  });

  describe("deleteAnalysis", () => {
    it("deletes analysis after verification", async () => {
      const mockAnalysis = createMockAnalysis({
        userId: "user-123",
      });

      mockAnalysisRepo.findByIdAndUserId.mockResolvedValue(mockAnalysis);
      mockAnalysisRepo.delete.mockResolvedValue(undefined);

      await analysisService.deleteAnalysis("user-123", "analysis-123");

      expect(mockAnalysisRepo.findByIdAndUserId).toHaveBeenCalledWith(
        "analysis-123",
        "user-123"
      );
      expect(mockAnalysisRepo.delete).toHaveBeenCalled();
    });

    it("throws NotFoundError when analysis not found", async () => {
      mockAnalysisRepo.findByIdAndUserId.mockResolvedValue(null);

      await expect(
        analysisService.deleteAnalysis("user-123", "analysis-123")
      ).rejects.toThrow(NotFoundError);
    });

    it("throws NotFoundError when userId mismatch", async () => {
      mockAnalysisRepo.findByIdAndUserId.mockResolvedValue(null);

      await expect(
        analysisService.deleteAnalysis("user-123", "analysis-123")
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("getAnalysisCount", () => {
    it("returns count of user analyses", async () => {
      mockAnalysisRepo.countByUserId.mockResolvedValue(5);

      const result = await analysisService.getAnalysisCount("user-123");

      expect(mockAnalysisRepo.countByUserId).toHaveBeenCalledWith("user-123");
      expect(result).toBe(5);
    });
  });

  describe("getDocumentAnalyses", () => {
    it("returns analyses for a document", async () => {
      const mockAnalyses = [
        createMockAnalysis({ documentId: "doc-123" }),
      ];

      mockAnalysisRepo.findByDocumentId.mockResolvedValue(mockAnalyses);

      const result = await analysisService.getDocumentAnalyses("doc-123");

      expect(mockAnalysisRepo.findByDocumentId).toHaveBeenCalledWith("doc-123");
      expect(result).toHaveLength(1);
    });
  });
});
