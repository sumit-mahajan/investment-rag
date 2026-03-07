/**
 * Next.js instrumentation - runs when the Node.js server starts.
 * Required for tsyringe DI (reflect-metadata must be loaded first).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("reflect-metadata");
    await import("@/lib/di/setup");
  }
}
