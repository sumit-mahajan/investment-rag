#!/usr/bin/env node
import "dotenv/config";
import { Client } from "langsmith";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { analyses } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { evaluateBatch } from "@/lib/evaluation";
import { buildAnalysisAnswerForEval } from "@/lib/evaluation/build-analysis-answer";
import type { EvaluationInput } from "@/lib/types/evaluation";
import type { InvestmentAnalysis } from "@/lib/types/analysis";

interface AnalysisState {
  question?: string;
  extractedMetrics?: Array<{ chunks?: Array<{ content?: string }> }>;
  qualitativeChunks?: Array<{ content?: string }>;
}

const READ_RUN_DELAY_MS = 400;
const MAX_RETRIES = 6;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function readRunWithRetry(client: Client, runId: string) {
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) await sleep(READ_RUN_DELAY_MS * (attempt + 1) * 4);
      else await sleep(READ_RUN_DELAY_MS);
      return await client.readRun(runId);
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes("429") && !msg.includes("Too Many Requests")) throw err;
    }
  }
  throw lastError;
}

function buildAnswer(analysis: InvestmentAnalysis): string {
  return buildAnalysisAnswerForEval(analysis);
}

function extractContexts(state: AnalysisState): string[] {
  const fromChunks = (state.qualitativeChunks ?? [])
    .map((c) => c.content)
    .filter((c): c is string => Boolean(c));
  const fromMetrics = (state.extractedMetrics ?? [])
    .flatMap((m) => (m.chunks ?? []).map((c) => c.content))
    .filter((c): c is string => Boolean(c));
  // Metric source chunks first — faithfulness judge truncates at MAX_CONTEXT_CHARS
  return Array.from(new Set([...fromMetrics, ...fromChunks]));
}

async function readRunState(client: Client, runId: string): Promise<AnalysisState> {
  const run = await readRunWithRetry(client, runId);
  const merged: AnalysisState = {
    ...(run.inputs as AnalysisState),
    ...(run.outputs as AnalysisState),
  };

  const targetNames = new Set(["metricExtraction", "qualitativeRetrieval"]);
  for await (const child of client.listRuns({ traceId: runId, limit: 100 })) {
    if (!child.name || !targetNames.has(child.name)) continue;
    const full = await readRunWithRetry(client, child.id);
    const childState = {
      ...(full.inputs as AnalysisState),
      ...(full.outputs as AnalysisState),
    };
    if (childState.qualitativeChunks?.length) merged.qualitativeChunks = childState.qualitativeChunks;
    if (childState.extractedMetrics?.length) merged.extractedMetrics = childState.extractedMetrics;
    if (childState.question) merged.question = childState.question;
  }

  return merged;
}

function traceRunId(traceUrl: string | null): string | null {
  if (!traceUrl) return null;
  const m = traceUrl.match(/\/r\/([^/?#]+)/);
  return m?.[1] ?? null;
}

async function main() {
  const ids = process.argv.slice(2);
  if (ids.length === 0) {
    console.error("Usage: npx tsx scripts/evaluate-analyses.ts <analysis-id>...");
    process.exit(1);
  }

  const db = drizzle(neon(process.env.POSTGRES_URL!));
  const client = new Client();
  const rows = await db.select().from(analyses).where(inArray(analyses.id, ids));

  const testCases: EvaluationInput[] = [];
  const labels: string[] = [];

  for (const id of ids) {
    const row = rows.find((r) => r.id === id);
    if (!row) {
      console.warn(`Not found: ${id}`);
      continue;
    }
    const docs = (row.documents as Array<{ fileName?: string }>) ?? [];
    const label = docs[0]?.fileName ?? id;
    const result = row.result as InvestmentAnalysis & { error?: string } | null;
    if (!result || result.error) {
      console.warn(`Skip ${label}: not completed`);
      continue;
    }
    const runId = traceRunId(row.traceUrl);
    if (!runId) {
      console.warn(`Skip ${label}: no traceUrl`);
      continue;
    }
    const state = await readRunState(client, runId);
    const question = state.question ?? "";
    const answer = buildAnswer(result);
    const contexts = extractContexts(state);
    if (!question || !answer || contexts.length === 0) {
      console.warn(`Skip ${label}: missing eval data (contexts=${contexts.length})`);
      continue;
    }
    console.log(`✓ ${label} — ${contexts.length} contexts`);
    testCases.push({ question, answer, contexts });
    labels.push(label);
  }

  if (testCases.length === 0) {
    console.error("No evaluable analyses.");
    process.exit(1);
  }

  console.log(`\nRunning RAGAS on ${testCases.length} case(s)...\n`);
  const results = await evaluateBatch(testCases, { parallel: false, batchSize: 1 });
  console.log(results.summary);

  console.log("\nPer-analysis breakdown:");
  results.individual_results.forEach((r, i) => {
    const overall =
      ((r.faithfulness + r.answer_relevancy + r.context_precision) / 3) * 100;
    console.log(`\n${labels[i]}`);
    console.log(`  Faithfulness:      ${(r.faithfulness * 100).toFixed(2)}%`);
    console.log(`  Answer Relevancy:  ${(r.answer_relevancy * 100).toFixed(2)}%`);
    console.log(`  Context Precision: ${(r.context_precision * 100).toFixed(2)}%`);
    console.log(`  Overall:           ${overall.toFixed(2)}%`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
