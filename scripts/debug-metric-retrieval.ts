/**
 * Debug what Pinecone returns for metric queries on a user's file.
 * Usage: npx tsx scripts/debug-metric-retrieval.ts <userId> <fileId>
 */
import "dotenv/config";
import { retrieveChunks } from "@/lib/retrieval/retrieve-chunks";
import { METRIC_DEFINITIONS } from "@/lib/agents/metrics";

async function main() {
  const userId = process.argv[2];
  const fileId = process.argv[3];
  if (!userId || !fileId) {
    console.error("Usage: npx tsx scripts/debug-metric-retrieval.ts <userId> <fileId>");
    process.exit(1);
  }

  for (const metric of METRIC_DEFINITIONS) {
    console.log("\n===", metric.label, "===");
    const chunks = await retrieveChunks({
      userId,
      fileIds: [fileId],
      query: metric.query,
      topK: 8,
    });
    if (chunks.length === 0) {
      console.log("(no chunks)");
      continue;
    }
    for (const c of chunks.slice(0, 3)) {
      console.log(`- p.${c.pageNumber} [${c.chunkType}] score=${c.score?.toFixed(3)}`);
      console.log(c.content.slice(0, 400).replace(/\n/g, " "));
      console.log("---");
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
