/**
 * Load evaluation test cases from LangSmith traces
 *
 * Fetches runs from your LangSmith project and extracts RAG evaluation data
 * (question, answer, contexts) from the financial analysis agent traces.
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
import type { CriteriaConfig, CriterionAnalysis, ChunkEvidence } from "@/lib/types/analysis";
import type { HybridSearchResult } from "@/lib/types/rag";

export interface LangSmithLoaderOptions {
  /** LangSmith project name (default: LANGCHAIN_PROJECT env) */
  projectName?: string;
  /** Max number of root runs to fetch (default: 20) */
  limit?: number;
  /** Only include runs from the last N hours */
  hoursBack?: number;
  /** Only include runs without errors */
  excludeErrors?: boolean;
}

/** Raw state shape from LangGraph trace (inputs/outputs) */
interface AnalysisState {
  documentId?: string;
  userId?: string;
  criteria?: CriteriaConfig[];
  retrievedChunks?: HybridSearchResult[];
  analyses?: CriterionAnalysis[];
  philosophyAnalyses?: unknown[];
  verdict?: string;
  confidenceScore?: number;
  summary?: string;
  sources?: ChunkEvidence[];
}

/**
 * Extract RAG evaluation inputs from a single LangGraph run.
 * Maps each criterion analysis to an EvaluationInput (question, answer, contexts).
 */
function extractFromRun(run: Run): EvaluationInput[] {
  const inputs = (run.inputs ?? {}) as AnalysisState;
  const outputs = (run.outputs ?? {}) as AnalysisState;

  const criteria = outputs.criteria ?? inputs.criteria ?? [];
  const analyses = outputs.analyses ?? [];
  const retrievedChunks = outputs.retrievedChunks ?? inputs.retrievedChunks ?? [];

  if (analyses.length === 0) {
    return [];
  }

  const testCases: EvaluationInput[] = [];

  for (const analysis of analyses) {
    const criterion = criteria.find((c) => c.id === analysis.criterionId) ?? {
      name: analysis.criterionName,
      description: "",
    };

    const question = `${criterion.name}: ${criterion.description}`.trim() || analysis.criterionName;
    const answer = analysis.findings ?? "";

    // Prefer evidence chunks (what was actually used for this criterion)
    let contexts: string[];
    if (analysis.evidence && analysis.evidence.length > 0) {
      contexts = analysis.evidence.map((e: ChunkEvidence) => e.content).filter(Boolean);
    } else if (retrievedChunks.length > 0) {
      contexts = retrievedChunks.map((c: HybridSearchResult) => c.content).filter(Boolean);
    } else {
      contexts = [];
    }

    if (question && answer && contexts.length > 0) {
      testCases.push({ question, answer, contexts });
    }
  }

  return testCases;
}

/**
 * Load test cases from LangSmith traces.
 * Fetches root runs from the project and extracts evaluation data.
 */
export async function loadTestCasesFromLangSmith(
  options: LangSmithLoaderOptions = {}
): Promise<EvaluationInput[]> {
  const {
    projectName = process.env.LANGCHAIN_PROJECT ?? "default",
    limit = 20,
    hoursBack,
    excludeErrors = true,
  } = options;

  if (!process.env.LANGCHAIN_API_KEY) {
    throw new Error(
      "LANGCHAIN_API_KEY is required. Set it in .env or pass it when running the script."
    );
  }

  const client = new Client();

  const listOptions: Parameters<typeof client.listRuns>[0] = {
    projectName,
    isRoot: true, // Get root traces only (parent-level runs)
    limit,
    ...(excludeErrors && { error: false }),
    ...(hoursBack && {
      startTime: new Date(Date.now() - hoursBack * 60 * 60 * 1000),
    }),
  };

  const allTestCases: EvaluationInput[] = [];
  let runCount = 0;

  console.log(`Fetching runs from project: ${projectName}...`);

  for await (const run of client.listRuns(listOptions)) {
    runCount++;
    console.log(`Processing run ${runCount}: ${run.id} (${run.name || 'unnamed'})`);
    
    try {
      const cases = extractFromRun(run);
      if (cases.length > 0) {
        console.log(`  ✓ Extracted ${cases.length} test case(s)`);
        allTestCases.push(...cases);
      } else {
        console.log(`  ⚠ No test cases extracted (no analyses in outputs)`);
      }
    } catch (err) {
      console.warn(`  ✗ Skipping: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  console.log(`\nFetched ${runCount} run(s), extracted ${allTestCases.length} test case(s) total\n`);

  return allTestCases;
}

/**
 * Load test cases from a LangSmith dataset.
 * Use when you have a dataset with examples (inputs: question, outputs: optional ground_truth).
 * Note: Dataset examples don't include contexts - you'd need to run retrieval for each.
 * This returns examples that can be used with ground_truth when available.
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
        : (inputs.input as string) ?? JSON.stringify(inputs);
    const answer =
      typeof outputs.answer === "string"
        ? outputs.answer
        : (outputs.output as string) ?? "";
    const contexts = Array.isArray(inputs.contexts)
      ? inputs.contexts
      : Array.isArray(outputs.contexts)
        ? outputs.contexts
        : [];

    if (question) {
      testCases.push({
        question,
        answer: answer || "N/A", // May need to run RAG to get answer
        contexts,
        ground_truth: typeof outputs.ground_truth === "string" ? outputs.ground_truth : undefined,
      });
    }
  }

  return testCases;
}
