/**
 * Extract company info (name, ticker, CIK) from document text using an LLM.
 * Used only when upload metadata does not provide these fields.
 */

import { ChatGroq } from "@langchain/groq";
import { z } from "zod";

const FIRST_CHUNK_MAX_CHARS = 4000;

const companyInfoSchema = z.object({
  companyName: z.string().optional().describe("The full legal name of the company"),
  ticker: z.string().optional().describe("Stock ticker symbol (e.g., AAPL, TSLA)"),
  cik: z.string().optional().describe("SEC Central Index Key (10-digit number)"),
});

export type CompanyInfo = z.infer<typeof companyInfoSchema>;

let model: ChatGroq | null = null;

function getModel() {
  if (!model) {
    model = new ChatGroq({
      model: "llama-3.3-70b-versatile",
      temperature: 0,
      apiKey: process.env.GROQ_API_KEY,
    });
  }
  return model;
}

export async function extractCompanyInfoWithLLM(fullText: string): Promise<CompanyInfo> {
  const firstChunk = fullText.slice(0, FIRST_CHUNK_MAX_CHARS).trim();
  if (!firstChunk) return {};

  const prompt = `From this excerpt from the start of a financial document (SEC filing), extract the company name, ticker symbol, and CIK if present.

Document excerpt:
${firstChunk}`;

  try {
    const structuredModel = getModel().withStructuredOutput(companyInfoSchema);
    const result = await structuredModel.invoke(prompt);
    return result;
  } catch (error) {
    console.error("LLM company info extraction failed:", error);
    return {};
  }
}
