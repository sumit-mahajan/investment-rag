/**
 * Load evaluation test cases from LangSmith traces
 *
 * Fetches runs from your LangSmith project and extracts RAG evaluation data
 * (question, answer, contexts) from the 4-node financial analysis graph.
 *
 * Prerequisites:
 * - LANGCHAIN_TRACING_V2=true
 * - LANGCHAIN_API_KEY set
 * - LANGCHAIN_PROJECT set (or pass projectName)
 *
 * Usage:
 *   const testCases = await loadTestCasesFromLangSmith({ projectName: "investment-rag", limit: 50 });
 *   const results = await evaluateBatch(testCases);
 */

import { Client } from "langsmith";
import type { Run } from "langsmith";
import type { EvaluationInput } from "@/lib/types/evaluation";
import type { InvestmentAnalysis } from "@/lib/types/analysis";

export interface LangSmithLoaderOptions {
  /** LangSmith project name (default: LANGCHAIN_PROJECT env) */
  projectName?: string;
  /** Max number of root runs to fetch (default: 20) */
  limit?: number;
  /** Only include runs from the last N hours */
  hoursBack?: number;
  /** Only include runs without errors */
  excludeErrors?: boolean;
  /** Root graph run name (default: financial-analysis) */
  runName?: string;
}

const DEFAULT_RUN_NAME = "financial-analysis";
const READ_RUN_DELAY_MS = 150;
const MAX_RETRIES = 4;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readRunWithRetry(client: Client, runId: string): Promise<Run> {
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) await sleep(READ_RUN_DELAY_MS * (attempt + 1) * 2);
      else await sleep(READ_RUN_DELAY_MS);
      const run = await client.readRun(runId);
      return run as unknown as Run;
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes("429") && !msg.includes("Too Many Requests")) {
        throw err;
      }
    }
  }
  throw lastError;
}

function dedupeKey(tc: EvaluationInput): string {
  return `${tc.question}::${tc.answer.slice(0, 200)}::${tc.contexts.length}`;
}

function dedupeTestCases(cases: EvaluationInput[]): EvaluationInput[] {
  const seen = new Set<string>();
  return cases.filter((tc) => {
    const key = dedupeKey(tc);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** LangGraph state shape from financial-analyzer traces */
interface AnalysisState {
  fileIds?: string[];
  userId?: string;
  question?: string;
  extractedMetrics?: Array<{ context?: string; sourceSnippet?: string }>;
  qualitativeChunks?: Array<{ content?: string }>;
  draftAnalysis?: InvestmentAnalysis | null;
  finalAnalysis?: InvestmentAnalysis | null;
  /** Legacy key from older pipeline versions */
  result?: InvestmentAnalysis | null;
}

function buildAnswer(analysis: InvestmentAnalysis): string {
  const parts: string[] = [];
  if (analysis.verdict?.headline) parts.push(analysis.verdict.headline);
  if (analysis.verdict?.summary) parts.push(analysis.verdict.summary);
  const metricsBlock = (analysis.keyMetrics ?? [])
    .map((m) => `${m.label}: ${m.value ?? "NOT FOUND"}`)
    .join("\n");
  if (metricsBlock) parts.push(`Key financial metrics:\n${metricsBlock}`);
  parts.push(...(analysis.bullCase?.points ?? []));
  parts.push(...(analysis.bearCase?.points ?? []));
  parts.push(...(analysis.keyRisks?.points ?? []));
  return parts.filter(Boolean).join("\n");
}

function extractContexts(state: AnalysisState): string[] {
  const fromChunks = (state.qualitativeChunks ?? [])
    .map((c) => c.content)
    .filter((c): c is string => Boolean(c));
  const fromMetrics = (state.extractedMetrics ?? [])
    .map((m) => m.context ?? m.sourceSnippet)
    .filter((c): c is string => Boolean(c));
  return Array.from(new Set([...fromMetrics, ...fromChunks]));
}

function resolveAnalysis(outputs: AnalysisState, inputs: AnalysisState): InvestmentAnalysis | null {
  return (
    outputs.finalAnalysis ??
    outputs.draftAnalysis ??
    outputs.result ??
    inputs.finalAnalysis ??
    inputs.draftAnalysis ??
    inputs.result ??
    null
  );
}

/**
 * Extract RAG evaluation inputs from a single LangGraph run.
 */
function extractFromRun(run: Run): EvaluationInput[] {
  const inputs = (run.inputs ?? {}) as AnalysisState;
  const outputs = (run.outputs ?? {}) as AnalysisState;

  const analysis = resolveAnalysis(outputs, inputs);
  if (!analysis) return [];

  const question = inputs.question ?? outputs.question ?? "";
  const answer = buildAnswer(analysis);
  const contexts = extractContexts({ ...inputs, ...outputs });

  if (!question || !answer || contexts.length === 0) return [];
  return [{ question, answer, contexts }];
}

async function extractFromRunOrChildren(
  client: Client,
  run: Run
): Promise<EvaluationInput[]> {
  const direct = extractFromRun(run);
  if (direct.length > 0) return direct;

  const seen = new Set<string>();
  const queue: string[] = [];

  const seedChildIds = (run as { child_run_ids?: string[] }).child_run_ids;
  if (!seedChildIds || seedChildIds.length === 0) return [];

  queue.push(...seedChildIds);

  const MAX_RUNS_TO_SCAN = 200;
  let scanned = 0;

  while (queue.length > 0 && scanned < MAX_RUNS_TO_SCAN) {
    const id = queue.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);
    scanned++;

    const rr = await readRunWithRetry(client, id);
    const cases = extractFromRun(rr);
    if (cases.length > 0) return cases;

    const childIds = (rr as { child_run_ids?: string[] }).child_run_ids;
    if (childIds && childIds.length > 0) {
      queue.push(...childIds);
    }
  }

  return [];
}

/**
 * Load test cases from LangSmith traces.
 */
export async function loadTestCasesFromLangSmith(
  options: LangSmithLoaderOptions = {}
): Promise<EvaluationInput[]> {
  const {
    projectName = process.env.LANGCHAIN_PROJECT ?? "default",
    limit = 20,
    hoursBack,
    excludeErrors = true,
    runName = DEFAULT_RUN_NAME,
  } = options;

  if (!process.env.LANGCHAIN_API_KEY) {
    throw new Error(
      "LANGCHAIN_API_KEY is required. Set it in .env or pass it when running the script."
    );
  }

  const client = new Client();

  const listOptions: Parameters<typeof client.listRuns>[0] = {
    projectName,
    limit,
    executionOrder: 1,
    filter: `eq(name, "${runName}")`,
    ...(excludeErrors && { error: false }),
    ...(hoursBack && {
      startTime: new Date(Date.now() - hoursBack * 60 * 60 * 1000),
    }),
  };

  const allTestCases: EvaluationInput[] = [];
  let runCount = 0;

  console.log(
    `Fetching root "${runName}" runs from project: ${projectName} (limit ${limit})...`
  );

  for await (const run of client.listRuns(listOptions)) {
    runCount++;
    console.log(`Processing run ${runCount}: ${run.id} (${run.name || "unnamed"})`);

    try {
      const fullRun = await readRunWithRetry(client, run.id);
      const cases = await extractFromRunOrChildren(client, fullRun);
      if (cases.length > 0) {
        console.log(`  ✓ Extracted ${cases.length} test case(s)`);
        allTestCases.push(...cases);
      } else {
        console.log(`  ⚠ No test cases extracted (no finalAnalysis in outputs)`);
      }
    } catch (err) {
      console.warn(`  ✗ Skipping: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const deduped = dedupeTestCases(allTestCases);

  console.log(
    `\nFetched ${runCount} root run(s), extracted ${deduped.length} unique test case(s)` +
      (deduped.length < allTestCases.length
        ? ` (${allTestCases.length - deduped.length} duplicate(s) removed)`
        : "") +
      "\n"
  );

  return deduped;
}

/**
 * Load test cases from a LangSmith dataset.
 */
export async function loadTestCasesFromDataset(
  datasetName: string,
  options: { limit?: number; split?: string } = {}
): Promise<EvaluationInput[]> {
  const { limit = 100, split } = options;

  if (!process.env.LANGCHAIN_API_KEY) {
    throw new Error("LANGCHAIN_API_KEY is required.");
  }

  const client = new Client();
  const testCases: EvaluationInput[] = [];

  const listOptions: Parameters<typeof client.listExamples>[0] = {
    datasetName,
    limit,
    ...(split && { splits: [split] }),
  };

  for await (const example of client.listExamples(listOptions)) {
    const inputs = example.inputs ?? {};
    const outputs = example.outputs ?? {};

    const question =
      typeof inputs.question === "string"
        ? inputs.question
        : ((inputs.input as string) ?? JSON.stringify(inputs));
    const answer =
      typeof outputs.answer === "string"
        ? outputs.answer
        : ((outputs.output as string) ?? "");
    const contexts = Array.isArray(inputs.contexts)
      ? inputs.contexts
      : Array.isArray(outputs.contexts)
        ? outputs.contexts
        : [];

    if (question) {
      testCases.push({
        question,
        answer: answer || "N/A",
        contexts,
        ground_truth:
          typeof outputs.ground_truth === "string" ? outputs.ground_truth : undefined,
      });
    }
  }

  return testCases;
}
