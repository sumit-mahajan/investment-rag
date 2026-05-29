import { describe, it, expect } from "vitest";
import {
  deriveAnalysisStatus,
  getAnalysisErrorMessage,
  isAnalysisErrorResult,
} from "../analysis-status";

describe("analysis-status", () => {
  describe("deriveAnalysisStatus", () => {
    it("returns running when result is null", () => {
      expect(deriveAnalysisStatus(null)).toBe("running");
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
});
