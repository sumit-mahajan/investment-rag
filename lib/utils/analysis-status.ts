import type { AnalysisStatus } from "@/lib/types/analysis";

export function isAnalysisErrorResult(result: unknown): result is { error: string } {
  return (
    result != null &&
    typeof result === "object" &&
    "error" in result &&
    typeof (result as { error: unknown }).error === "string"
  );
}

export function deriveAnalysisStatus(result: unknown | null): AnalysisStatus {
  if (result == null) return "running";
  if (isAnalysisErrorResult(result)) return "failed";
  return "completed";
}

export function getAnalysisErrorMessage(result: unknown | null): string | null {
  if (!isAnalysisErrorResult(result)) return null;
  return result.error;
}
