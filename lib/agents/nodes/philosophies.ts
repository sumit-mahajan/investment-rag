import { ChatGroq } from "@langchain/groq";
import { z } from "zod";
import { AnalysisState } from "../financial-analyzer";
import { PhilosophyAnalysis } from "@/lib/types/analysis";
import {
  investmentPhilosophies,
  philosophyIds,
  type PhilosophyId,
} from "@/config/philosophies.config";

const philosophyAnalysisSchema = z.object({
  verdict: z
    .enum(["POSITIVE", "NEGATIVE", "NEUTRAL", "MIXED"])
    .describe("Verdict for this investment philosophy fit"),
  confidenceScore: z
    .number()
    .min(0)
    .max(1)
    .describe("Confidence 0-1 based on data availability (higher when more metrics found)"),
  metricsFound: z
    .array(z.string())
    .describe("List of key metrics that were found in the document with their values if available"),
  metricsNotFound: z
    .array(z.string())
    .describe("List of key metrics that were NOT found in the document"),
  findings: z
    .string()
    .describe(
      "Summary of analysis: what metrics were found, verdict rationale, and note if metrics are insufficient"
    ),
});

let model: ChatGroq | null = null;

function getModel() {
  if (!model) {
    model = new ChatGroq({
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      apiKey: process.env.GROQ_API_KEY,
    });
  }
  return model;
}

export async function philosophiesNode(
  state: AnalysisState
): Promise<Partial<AnalysisState>> {
  console.log("Philosophies node: Analyzing value and growth investing fit");

  const { retrievedChunks } = state;
  const philosophyAnalyses: PhilosophyAnalysis[] = [];

  // Use all chunks for philosophy analysis (they're already retrieved for criteria)
  const chunks = retrievedChunks.slice(0, 15);

  if (chunks.length === 0) {
    for (const id of philosophyIds) {
      const config = investmentPhilosophies[id];
      philosophyAnalyses.push({
        philosophyId: config.id,
        philosophyName: config.name,
        verdict: "NEUTRAL",
        confidenceScore: 0,
        metricsFound: [],
        metricsNotFound: config.keyMetrics,
        findings: "No document content available for analysis. Metrics could not be evaluated.",
        evidence: [],
      });
    }
    return { philosophyAnalyses };
  }

  const context = chunks
    .map((chunk, i) => {
      const categories = (chunk.metadata.categories as string[]) || [];
      return `[Chunk ${i + 1}]\nCategories: ${categories.join(", ") || "General"}\n${chunk.content}`;
    })
    .join("\n\n---\n\n");

  for (const id of philosophyIds) {
    const config = investmentPhilosophies[id as PhilosophyId];
    console.log(`  Analyzing philosophy: ${config.name}`);

    const prompt = config.promptTemplate.replace("{context}", context);

    const fullPrompt = `${prompt}

CRITICAL: Only cite metrics and facts that appear in the context above. Do not infer or assume. If a metric is not found, list it in metricsNotFound.

Respond with:
1. verdict: POSITIVE, NEGATIVE, NEUTRAL, or MIXED based on whether the company fits this philosophy
2. confidenceScore: 0-1 (0 = no relevant data found, 1 = comprehensive data supports verdict)
3. metricsFound: array of metrics you found (e.g. "P/E ratio: 12.5", "revenue growth: 15%")
4. metricsNotFound: array of key metrics from the list that were NOT found
5. findings: 2-4 sentences summarizing the analysis, what was found, and the verdict rationale. If few/no metrics found, state "Insufficient metrics found in document" and explain.`;

    try {
      const structuredModel = getModel().withStructuredOutput(
        philosophyAnalysisSchema
      );
      const result = await structuredModel.invoke(fullPrompt);

      philosophyAnalyses.push({
        philosophyId: config.id,
        philosophyName: config.name,
        verdict: result.verdict as PhilosophyAnalysis["verdict"],
        confidenceScore: Math.min(Math.max(result.confidenceScore, 0), 1),
        metricsFound: result.metricsFound ?? [],
        metricsNotFound: result.metricsNotFound ?? [],
        findings: result.findings,
        evidence: chunks.map((chunk) => ({
          chunkId: chunk.id,
          content: chunk.content.substring(0, 500),
          categories: (chunk.metadata.categories as string[]) || [],
          pageNumber: chunk.metadata.pageNumber,
          relevanceScore: chunk.combinedScore,
        })),
      });
    } catch (error) {
      console.error(`Error analyzing philosophy ${config.name}:`, error);
      philosophyAnalyses.push({
        philosophyId: config.id,
        philosophyName: config.name,
        verdict: "NEUTRAL",
        confidenceScore: 0,
        metricsFound: [],
        metricsNotFound: config.keyMetrics,
        findings: "Analysis could not be completed due to an error.",
        evidence: [],
      });
    }
  }

  return {
    philosophyAnalyses,
  };
}
