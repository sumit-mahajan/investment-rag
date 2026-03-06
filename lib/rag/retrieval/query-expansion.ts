import { ChatGroq } from "@langchain/groq";
import { z } from "zod";

const queryExpansionSchema = z.object({
  alternatives: z.array(z.string()).describe("2-3 alternative phrasings or related queries"),
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

export async function expandQuery(query: string): Promise<string[]> {
  const prompt = `Given the following query about a financial document, generate 2-3 alternative phrasings or related queries that would help retrieve relevant information.

Original query: "${query}"`;

  try {
    const structuredModel = getModel().withStructuredOutput(queryExpansionSchema);
    const result = await structuredModel.invoke(prompt);
    return [query, ...result.alternatives.slice(0, 3)];
  } catch (error) {
    console.error("Query expansion error:", error);
    return [query];
  }
}

export async function expandQueryWithContext(
  query: string,
  context: string
): Promise<string[]> {
  const prompt = `Given the following query about a financial document and some context, generate 2-3 alternative phrasings or related queries.

Query: "${query}"
Context: "${context}"`;

  try {
    const structuredModel = getModel().withStructuredOutput(queryExpansionSchema);
    const result = await structuredModel.invoke(prompt);
    return [query, ...result.alternatives.slice(0, 3)];
  } catch (error) {
    console.error("Query expansion error:", error);
    return [query];
  }
}
