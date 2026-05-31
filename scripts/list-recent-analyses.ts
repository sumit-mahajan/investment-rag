#!/usr/bin/env node
import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { analyses } from "@/lib/db/schema";
import { gte, desc } from "drizzle-orm";

async function main() {
  const hours = parseFloat(process.argv[2] ?? "1");
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  const db = drizzle(neon(process.env.POSTGRES_URL!));
  const rows = await db
    .select()
    .from(analyses)
    .where(gte(analyses.createdAt, since))
    .orderBy(desc(analyses.createdAt));

  console.log(`Since ${since.toISOString()} (${hours}h): ${rows.length} analyses\n`);
  for (const r of rows) {
    const docs = (r.documents as Array<{ fileName?: string }>) ?? [];
    const names = docs.map((d) => d.fileName ?? "?").join(", ");
    const result = r.result as { error?: string; verdict?: { headline?: string } } | null;
    console.log(`${r.id}`);
    console.log(`  created: ${r.createdAt.toISOString()}`);
    console.log(`  docs: ${names}`);
    console.log(`  status: ${result?.error ? "error" : result ? "completed" : "running"}`);
    console.log(`  traceUrl: ${r.traceUrl ?? "none"}`);
    if (result?.verdict?.headline) console.log(`  headline: ${result.verdict.headline}`);
    console.log();
  }
}

main().catch(console.error);
