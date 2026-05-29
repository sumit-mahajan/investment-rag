import { describe, it, expect } from "vitest";
import {
  deriveAnalysisStatus,
  getAnalysisErrorMessage,
  isAnalysisErrorResult,
  isStaleRunningAnalysis,
  STALE_RUNNING_MS,
} from "../analysis-status";

describe("analysis-status", () => {
  describe("deriveAnalysisStatus", () => {
    it("returns running when result is null", () => {
      expect(deriveAnalysisStatus(null)).toBe("running");
    });

    it("returns failed when a stale running analysis exceeds the timeout", () => {
      const createdAt = new Date(Date.now() - STALE_RUNNING_MS - 1000);
      expect(deriveAnalysisStatus(null, createdAt)).toBe("failed");
    });

    it("returns failed when result contains an error", () => {
      expect(deriveAnalysisStatus({ error: "Rate limit exceeded" })).toBe("failed");
    });

    it("returns completed for a successful analysis payload", () => {
      expect(
        deriveAnalysisStatus({
          verdict: { score: 70, recommendation: "buy", headline: "Buy", summary: "Strong" },
          bullCase: { points: [], citations: [] },
          bearCase: { points: [], citations: [] },
          keyMetrics: [],
          keyRisks: { points: [], citations: [] },
        })
      ).toBe("completed");
    });
  });

  describe("getAnalysisErrorMessage", () => {
    it("returns null for non-error results", () => {
      expect(getAnalysisErrorMessage(null)).toBeNull();
      expect(getAnalysisErrorMessage({ verdict: {} })).toBeNull();
    });

    it("returns the error string for error results", () => {
      expect(getAnalysisErrorMessage({ error: "429 rate limit" })).toBe("429 rate limit");
    });

    it("returns a timeout message for stale running analyses", () => {
      const createdAt = new Date(Date.now() - STALE_RUNNING_MS - 1000);
      expect(getAnalysisErrorMessage(null, createdAt)).toMatch(/timed out/i);
    });
  });

  describe("isAnalysisErrorResult", () => {
    it("narrows error-shaped results", () => {
      const result = { error: "failed" };
      expect(isAnalysisErrorResult(result)).toBe(true);
      if (isAnalysisErrorResult(result)) {
        expect(result.error).toBe("failed");
      }
    });
  });

  describe("isStaleRunningAnalysis", () => {
    it("detects stale null-result rows", () => {
      const createdAt = new Date(Date.now() - STALE_RUNNING_MS - 1000);
      expect(isStaleRunningAnalysis(null, createdAt)).toBe(true);
      expect(isStaleRunningAnalysis(null, new Date())).toBe(false);
    });
  });
});
