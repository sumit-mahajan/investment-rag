import { StateGraph } from "@langchain/langgraph";
import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import type { InvestmentAnalysis, ExtractedMetric } from "@/lib/types/analysis";
import type { RetrievedChunk } from "@/lib/types/core";
import { metricExtractionNode } from "./nodes/metric-extraction";
import { qualitativeRetrievalNode } from "./nodes/qualitative-retrieval";
import { synthesisNode } from "./nodes/synthesis";
import { citationAssemblyNode } from "./nodes/citation-assembly";
import { buildSourcesUsed } from "./build-sources-used";

export interface AnalysisState {
  fileIds: string[];
  userId: string;
  question: string;
  extractedMetrics: ExtractedMetric[];
  qualitativeChunks: RetrievedChunk[];
  draftAnalysis: InvestmentAnalysis | null;
  finalAnalysis: InvestmentAnalysis | null;
  traceUrl?: string;
}

class RunIdCaptureHandler extends BaseCallbackHandler {
  name = "run_id_capture";
  runId?: string;

  handleChainStart(
    _run: { name?: string },
    _inputs: unknown,
    runId: string
  ): void {
    if (!this.runId) this.runId = runId;
  }
}

function buildTraceUrl(runId?: string): string | undefined {
  if (!runId || process.env.LANGCHAIN_TRACING_V2 !== "true") return undefined;
  const project = process.env.LANGCHAIN_PROJECT;
  if (!project) return undefined;
  return `https://smith.langchain.com/o/-/projects/p/${encodeURIComponent(project)}/r/${runId}`;
}

export function createFinancialAnalyzerGraph() {
  const workflow = new StateGraph<AnalysisState>({
    channels: {
      fileIds: null,
      userId: null,
      question: null,
      extractedMetrics: null,
      qualitativeChunks: null,
      draftAnalysis: null,
      finalAnalysis: null,
      traceUrl: null,
    },
  });

  workflow.addNode("metricExtraction", metricExtractionNode);
  workflow.addNode("qualitativeRetrieval", qualitativeRetrievalNode);
  workflow.addNode("synthesis", synthesisNode);
  workflow.addNode("citationAssembly", citationAssemblyNode);

  (workflow as any).addEdge("__start__", "metricExtraction");
  (workflow as any).addEdge("metricExtraction", "qualitativeRetrieval");
  (workflow as any).addEdge("qualitativeRetrieval", "synthesis");
  (workflow as any).addEdge("synthesis", "citationAssembly");
  (workflow as any).addEdge("citationAssembly", "__end__");

  return workflow.compile();
}

export async function runFinancialAnalysis(
  fileIds: string[],
  userId: string,
  question: string
): Promise<{ analysis: InvestmentAnalysis; traceUrl?: string }> {
  const graph = createFinancialAnalyzerGraph();
  const handler = new RunIdCaptureHandler();

  const initialState: AnalysisState = {
    fileIds,
    userId,
    question,
    extractedMetrics: [],
    qualitativeChunks: [],
    draftAnalysis: null,
    finalAnalysis: null,
  };

  const result = (await graph.invoke(initialState, {
    callbacks: [handler],
    runName: "financial-analysis",
  })) as AnalysisState;

  if (!result.finalAnalysis) {
    throw new Error("Analysis pipeline completed without finalAnalysis");
  }

  const traceUrl = buildTraceUrl(handler.runId);
  const analysis = {
    ...result.finalAnalysis,
    sourcesUsed: buildSourcesUsed(
      result.extractedMetrics,
      result.qualitativeChunks
    ),
  };

  return {
    analysis,
    traceUrl,
  };
}
