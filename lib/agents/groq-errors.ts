/** Detect Groq 429 / TPD rate-limit errors from LangChain ChatGroq */
export function isGroqRateLimitError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { status?: number; message?: string; lc_error_code?: string };
  if (err.status === 429) return true;
  const msg = err.message ?? String(error);
  return (
    msg.includes("rate_limit_exceeded") ||
    msg.includes("Rate limit reached") ||
    msg.includes("tokens per day")
  );
}

export function groqRateLimitMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Groq rate limit exceeded. Try again after your daily quota resets.";
}
