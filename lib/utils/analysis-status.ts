import type { AnalysisStatus } from "@/lib/types/analysis";

/** Analyses with null result older than this are treated as failed (serverless timeout). */
export const STALE_RUNNING_MS = 4 * 60 * 1000;

export function isAnalysisErrorResult(result: unknown): result is { error: string } {
  return (
    result != null &&
    typeof result === "object" &&
    "error" in result &&
    typeof (result as { error: unknown }).error === "string"
  );
}

export function isStaleRunningAnalysis(
  result: unknown | null,
  createdAt?: Date
): boolean {
  if (result != null || !createdAt) return false;
  return Date.now() - createdAt.getTime() > STALE_RUNNING_MS;
}

export function deriveAnalysisStatus(
  result: unknown | null,
  createdAt?: Date
): AnalysisStatus {
  if (result == null) {
    return isStaleRunningAnalysis(result, createdAt) ? "failed" : "running";
  }
  if (isAnalysisErrorResult(result)) return "failed";
  return "completed";
}

export function getAnalysisErrorMessage(
  result: unknown | null,
  createdAt?: Date
): string | null {
  if (isAnalysisErrorResult(result)) return result.error;
  if (isStaleRunningAnalysis(result, createdAt)) {
    return "Analysis timed out or was interrupted before completing. Please run it again.";
  }
  return null;
}
