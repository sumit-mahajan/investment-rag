import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { analyses } from "@/lib/db/schema";

const id = process.argv[2];
if (!id) {
  console.error("Usage: npx tsx scripts/print-analysis-metrics.ts <analysisId>");
  process.exit(1);
}

async function main() {
  const [row] = await db.select().from(analyses).where(eq(analyses.id, id)).limit(1);
  if (!row?.result) {
    console.log("No result");
    process.exit(1);
  }
  const r = row.result as { verdict?: unknown; keyMetrics?: { label: string; value: string | null }[] };
  console.log("Verdict:", JSON.stringify(r.verdict, null, 2));
  console.log("\nMetrics:");
  for (const m of r.keyMetrics ?? []) {
    console.log(`- ${m.label}: ${m.value ?? "(null)"}`);
  }
}

main();
