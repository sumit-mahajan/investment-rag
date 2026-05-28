/**
 * Verify all retrieved chunks for an analysis belong to expected fileIds.
 * Usage: npx tsx scripts/verify-analysis-scope.ts <analysisId>
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { analyses } from "@/lib/db/schema";
import { retrieveMetricChunks } from "@/lib/retrieval/retrieve-metric-chunks";
import { retrieveChunks } from "@/lib/retrieval/retrieve-chunks";
import { METRIC_DEFINITIONS } from "@/lib/agents/metrics";

async function main() {
  const analysisId = process.argv[2];
  if (!analysisId) {
    console.error("Usage: npx tsx scripts/verify-analysis-scope.ts <analysisId>");
    process.exit(1);
  }

  const [row] = await db.select().from(analyses).where(eq(analyses.id, analysisId)).limit(1);
  if (!row) {
    console.error("Analysis not found");
    process.exit(1);
  }

  const docs = row.documents ?? [];
  const fileIds = docs.map((d) => d.fileId);
  const allowed = new Set(fileIds);

  console.log("Analysis:", analysisId);
  console.log("Expected files:", docs.map((d) => `${d.fileName} (${d.fileId})`).join(", "));
  console.log("Namespace (userId):", row.userId);
  console.log("");

  let leaks = 0;
  for (const metric of METRIC_DEFINITIONS) {
    const chunks = await retrieveMetricChunks(row.userId, fileIds, {
      query: metric.query,
      supplementalQueries: metric.supplementalQueries
        ? [...metric.supplementalQueries]
        : undefined,
    });
    const bad = chunks.filter((c) => !allowed.has(c.fileId));
    if (bad.length > 0) {
      leaks += bad.length;
      console.log(`LEAK ${metric.label}:`, bad.map((c) => c.fileName).join(", "));
    }
    const top = chunks[0];
    if (top) {
      console.log(
        `${metric.label}: top chunk → ${top.fileName} p.${top.pageNumber} [${top.chunkType}] fileId=${top.fileId}`
      );
    }
  }

  // Qualitative sample
  const qual = await retrieveChunks({
    userId: row.userId,
    fileIds,
    query: "risk factors growth catalysts",
    topK: 5,
  });
  const qualBad = qual.filter((c) => !allowed.has(c.fileId));
  if (qualBad.length) {
    leaks += qualBad.length;
    console.log("LEAK qualitative:", qualBad.map((c) => c.fileName).join(", "));
  } else {
    console.log(
      "Qualitative sample:",
      qual.slice(0, 2).map((c) => `${c.fileName} p.${c.pageNumber}`).join("; ")
    );
  }

  console.log("");
  if (leaks === 0) {
    console.log("OK — no chunks from other documents in retrieval (fileId filter holds).");
  } else {
    console.log(`FAIL — ${leaks} chunk(s) from wrong fileId`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
