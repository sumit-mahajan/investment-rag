import { ChatGroq } from "@langchain/groq";
import { z } from "zod";
import { AnalysisState } from "../financial-analyzer";
import { CriterionAnalysis } from "@/lib/types/analysis";

const criterionAnalysisSchema = z.object({
  score: z.number().min(0).max(1).describe("Analysis score from 0 to 1"),
  findings: z.string().describe("Detailed findings and analysis for this criterion"),
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

export async function analyzeNode(state: AnalysisState): Promise<Partial<AnalysisState>> {
  console.log("Analyze node: Analyzing chunks per criterion");

  const { criteria, retrievedChunks } = state;

  const analyses: CriterionAnalysis[] = [];

  for (const criterion of criteria) {
    console.log(`Analyzing criterion: ${criterion.name}`);

    // Filter relevant chunks for this criterion using category matching (stricter: require match when categories exist)
    const relevantChunks = retrievedChunks.filter((chunk) => {
      if (criterion.categories.length > 0) {
        const chunkCategories = (chunk.metadata.categories as string[]) || [];
        return criterion.categories.some((cat) => chunkCategories.includes(cat));
      }
      return true;
    }).slice(0, 6); // Fewer chunks = less noise, better faithfulness

    if (relevantChunks.length === 0) {
      console.log(`  No category-matched chunks found, using all available chunks`);
      const fallbackChunks = retrievedChunks.slice(0, 6);

      if (fallbackChunks.length === 0) {
        analyses.push({
          criterionId: criterion.id,
          criterionName: criterion.name,
          score: 0,
          findings: "Insufficient information found in the document.",
          evidence: [],
        });
        continue;
      }

      const context = fallbackChunks
        .map((chunk, i) => {
          const categories = (chunk.metadata.categories as string[]) || [];
          return `[Chunk ${i + 1}]\nCategories: ${categories.join(", ") || "General"}\n${chunk.content}`;
        })
        .join("\n\n---\n\n");

      const basePrompt = criterion.promptTemplate.replace("{context}", context);
      const prompt = `${basePrompt}

CRITICAL - Grounding rules:
- Only make claims that are DIRECTLY supported by the context above
- If information is missing, say "The document does not provide sufficient information on..." rather than inferring
- Do not extrapolate or assume beyond what is explicitly stated
- Cite specific numbers and facts from the context when possible`;

      try {
        const structuredModel = getModel().withStructuredOutput(criterionAnalysisSchema);
        const result = await structuredModel.invoke(prompt);

        analyses.push({
          criterionId: criterion.id,
          criterionName: criterion.name,
          score: Math.min(Math.max(result.score, 0), 1),
          findings: result.findings,
          evidence: fallbackChunks.map((chunk) => ({
            chunkId: chunk.id,
            content: chunk.content.substring(0, 500),
            categories: (chunk.metadata.categories as string[]) || [],
            pageNumber: chunk.metadata.pageNumber,
            relevanceScore: chunk.combinedScore,
          })),
        });
      } catch (error) {
        console.error(`Error analyzing criterion ${criterion.name}:`, error);
        analyses.push({
          criterionId: criterion.id,
          criterionName: criterion.name,
          score: 0,
          findings: "Error during analysis.",
          evidence: [],
        });
      }
      continue;
    }

    // Build context from chunks
    const context = relevantChunks
      .map((chunk, i) => {
        const categories = (chunk.metadata.categories as string[]) || [];
        return `[Chunk ${i + 1}]\nCategories: ${categories.join(", ") || "General"}\n${chunk.content}`;
      })
      .join("\n\n---\n\n");

    const basePrompt = criterion.promptTemplate.replace("{context}", context);
    const prompt = `${basePrompt}

CRITICAL - Grounding rules:
- Only make claims that are DIRECTLY supported by the context above
- If information is missing, say "The document does not provide sufficient information on..." rather than inferring
- Do not extrapolate or assume beyond what is explicitly stated
- Cite specific numbers and facts from the context when possible`;

    try {
      const structuredModel = getModel().withStructuredOutput(criterionAnalysisSchema);
      const result = await structuredModel.invoke(prompt);

      analyses.push({
        criterionId: criterion.id,
        criterionName: criterion.name,
        score: Math.min(Math.max(result.score, 0), 1),
        findings: result.findings,
        evidence: relevantChunks.map((chunk) => ({
          chunkId: chunk.id,
          content: chunk.content.substring(0, 500),
          categories: (chunk.metadata.categories as string[]) || [],
          pageNumber: chunk.metadata.pageNumber,
          relevanceScore: chunk.combinedScore,
        })),
      });
    } catch (error) {
      console.error(`Error analyzing criterion ${criterion.name}:`, error);
      analyses.push({
        criterionId: criterion.id,
        criterionName: criterion.name,
        score: 0,
        findings: "Error during analysis.",
        evidence: [],
      });
    }
  }

  return {
    analyses,
  };
}
