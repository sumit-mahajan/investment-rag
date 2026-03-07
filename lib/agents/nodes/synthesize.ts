import { ChatGroq } from "@langchain/groq";
import { z } from "zod";
import { AnalysisState } from "../financial-analyzer";
import { Verdict } from "@/lib/types/analysis";

const synthesisSchema = z.object({
  verdict: z.enum(["POSITIVE", "NEGATIVE", "NEUTRAL", "MIXED"]).describe("Overall investment verdict"),
  confidence: z.number().min(0).max(1).describe("Confidence score for the verdict (0-1)"),
  summary: z.string().describe("Executive summary of the analysis (2-3 paragraphs)"),
});

let model: ChatGroq | null = null;

function getModel() {
  if (!model) {
    model = new ChatGroq({
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      apiKey: process.env.GROQ_API_KEY,
    });
  }
  return model;
}

export async function synthesizeNode(state: AnalysisState): Promise<Partial<AnalysisState>> {
  console.log("Synthesize node: Generating final verdict");

  const { analyses } = state;

  // Calculate average score
  const avgScore =
    analyses.reduce((sum, a) => sum + a.score, 0) / analyses.length;

  // Build summary prompt
  const summaryPrompt = `Based on the following analysis of a financial document, provide a comprehensive summary and verdict.

${analyses
      .map(
        (a) =>
          `${a.criterionName} (Score: ${a.score.toFixed(2)}):
${a.findings}

---`
      )
      .join("\n\n")}

Provide:
1. Overall verdict (POSITIVE, NEGATIVE, NEUTRAL, or MIXED)
2. Confidence score (0-1)
3. Executive summary (2-3 paragraphs) - synthesize ONLY from the analysis above; do not add new claims or facts beyond what is stated.`;

  try {
    const structuredModel = getModel().withStructuredOutput(synthesisSchema);
    const result = await structuredModel.invoke(summaryPrompt);

    // Collect all evidence
    const allSources = analyses.flatMap((a) => a.evidence);

    return {
      verdict: result.verdict as Verdict,
      confidenceScore: result.confidence,
      summary: result.summary,
      sources: allSources,
    };
  } catch (error) {
    console.error("Error synthesizing verdict:", error);
    return {
      verdict: "NEUTRAL",
      confidenceScore: avgScore,
      summary: "Unable to generate summary due to an error.",
      sources: [],
    };
  }
}
