import { StateGraph } from "@langchain/langgraph";
import { CriteriaConfig, CriterionAnalysis, ChunkEvidence, Verdict } from "@/lib/types/analysis";
import { HybridSearchResult } from "@/lib/types/rag";
import { retrieveNode } from "./nodes/retrieve";
import { analyzeNode } from "./nodes/analyze";
import { synthesizeNode } from "./nodes/synthesize";

export interface AnalysisState {
  documentId: string;
  userId: string;
  criteria: CriteriaConfig[];
  retrievedChunks: HybridSearchResult[];
  analyses: CriterionAnalysis[];
  verdict?: Verdict;
  confidenceScore?: number;
  summary?: string;
  sources?: ChunkEvidence[];
}

export function createFinancialAnalyzerGraph() {
  const workflow = new StateGraph<AnalysisState>({
    channels: {
      documentId: null,
      userId: null,
      criteria: null,
      retrievedChunks: null,
      analyses: null,
      verdict: null,
      confidenceScore: null,
      summary: null,
      sources: null,
    },
  });

  // Add nodes
  workflow.addNode("retrieve", retrieveNode);
  workflow.addNode("analyze", analyzeNode);
  workflow.addNode("synthesize", synthesizeNode);

  // Add edges
  (workflow as any).addEdge("__start__", "retrieve");
  (workflow as any).addEdge("retrieve", "analyze");
  (workflow as any).addEdge("analyze", "synthesize");
  (workflow as any).addEdge("synthesize", "__end__");

  return workflow.compile();
}

export async function runFinancialAnalysis(
  documentId: string,
  userId: string,
  criteria: CriteriaConfig[]
): Promise<AnalysisState> {
  const graph = createFinancialAnalyzerGraph();

  const initialState: AnalysisState = {
    documentId,
    userId,
    criteria,
    retrievedChunks: [],
    analyses: [],
  };

  const result = await graph.invoke(initialState);

  return result as AnalysisState;
}
