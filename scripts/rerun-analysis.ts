/**
 * Re-run LangGraph for an existing analysis row (updates result in Postgres).
 * Usage: npx tsx scripts/rerun-analysis.ts <analysisId>
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { analyses } from "@/lib/db/schema";
import { runFinancialAnalysis } from "@/lib/agents/financial-analyzer";
import { DEFAULT_ANALYSIS_QUESTION } from "@/lib/agents/constants";

async function main() {
  const analysisId = process.argv[2];
  if (!analysisId) {
    console.error("Usage: npx tsx scripts/rerun-analysis.ts <analysisId>");
    process.exit(1);
  }

  const [row] = await db
    .select()
    .from(analyses)
    .where(eq(analyses.id, analysisId))
    .limit(1);

  if (!row) {
    console.error("Analysis not found:", analysisId);
    process.exit(1);
  }

  const docs = row.documents ?? [];
  const fileIds = docs.map((d) => d.fileId);
  if (fileIds.length === 0) {
    console.error("No documents on analysis row");
    process.exit(1);
  }

  console.log("Re-running analysis:", analysisId);
  console.log("userId:", row.userId);
  console.log("files:", docs.map((d) => d.fileName).join(", "));

  const { analysis, traceUrl } = await runFinancialAnalysis(
    fileIds,
    row.userId,
    DEFAULT_ANALYSIS_QUESTION
  );

  await db
    .update(analyses)
    .set({ result: analysis, traceUrl: traceUrl ?? null })
    .where(eq(analyses.id, analysisId));

  console.log("SUCCESS");
  console.log("bull:", analysis.bullCase.points.length);
  console.log("bear:", analysis.bearCase.points.length);
  console.log("risks:", analysis.keyRisks.points.length);
  console.log("metrics:", analysis.keyMetrics.length);
  if (traceUrl) console.log("trace:", traceUrl);
}

main().catch((err) => {
  console.error("FAILED:", err instanceof Error ? err.message : err);
  process.exit(1);
});
