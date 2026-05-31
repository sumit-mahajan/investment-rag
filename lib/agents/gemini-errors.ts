/** Detect Gemini 429 / quota errors from LangChain ChatGoogleGenerativeAI */
export function isGeminiRateLimitError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { status?: number; message?: string; lc_error_code?: string };
  if (err.status === 429) return true;
  const msg = (err.message ?? String(error)).toLowerCase();
  return (
    msg.includes("429") ||
    msg.includes("quota") ||
    msg.includes("rate limit") ||
    msg.includes("resource_exhausted")
  );
}

export function geminiRateLimitMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Gemini API quota or rate limit exceeded. Try again shortly.";
}
