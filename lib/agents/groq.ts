import { ChatGroq } from "@langchain/groq";

/**
 * 70B versatile — used for synthesis/reasoning (100K TPD on free tier).
 * Reserved for Node 3 (synthesis) where judgment quality matters.
 */
let synthesisModel: ChatGroq | null = null;

/**
 * 8B instant — used for structured metric extraction (500K TPD on free tier).
 * Metric extraction is a structured number-lookup task; 70B is overkill.
 */
let extractionModel: ChatGroq | null = null;

function requireApiKey(): string {
  if (!process.env.GROQ_API_KEY) throw new Error("GROQ_API_KEY is not set");
  return process.env.GROQ_API_KEY;
}

/** 70B model — synthesis and reasoning. Use sparingly (100K TPD free). */
export function getGroqModel(): ChatGroq {
  if (!synthesisModel) {
    synthesisModel = new ChatGroq({
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      apiKey: requireApiKey(),
    });
  }
  return synthesisModel;
}

/** 8B instant model — structured extraction only (500K TPD free). */
export function getGroqExtractionModel(): ChatGroq {
  if (!extractionModel) {
    extractionModel = new ChatGroq({
      model: "llama-3.1-8b-instant",
      temperature: 0,
      apiKey: requireApiKey(),
    });
  }
  return extractionModel;
}
