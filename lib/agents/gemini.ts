import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const DEFAULT_MODEL = "gemini-2.5-flash";

/**
 * Gemini Flash — synthesis, follow-up chat, and reasoning (Node 3).
 */
let synthesisModel: ChatGoogleGenerativeAI | null = null;

/**
 * Gemini Flash — structured metric extraction (Node 1).
 * Same model as synthesis; temperature 0 for deterministic number lookup.
 */
let extractionModel: ChatGoogleGenerativeAI | null = null;

function requireApiKey(): string {
  const key = process.env.GOOGLE_API_KEY ?? process.env.GOOGLE_GENAI_API_KEY;
  if (!key) {
    throw new Error("GOOGLE_API_KEY (or GOOGLE_GENAI_API_KEY) is not set");
  }
  return key;
}

/** Gemini Flash — synthesis and reasoning. */
export function getGeminiModel(): ChatGoogleGenerativeAI {
  if (!synthesisModel) {
    synthesisModel = new ChatGoogleGenerativeAI({
      model: DEFAULT_MODEL,
      temperature: 0.2,
      apiKey: requireApiKey(),
    });
  }
  return synthesisModel;
}

/** Gemini Flash — structured extraction only. */
export function getGeminiExtractionModel(): ChatGoogleGenerativeAI {
  if (!extractionModel) {
    extractionModel = new ChatGoogleGenerativeAI({
      model: DEFAULT_MODEL,
      temperature: 0,
      apiKey: requireApiKey(),
    });
  }
  return extractionModel;
}
