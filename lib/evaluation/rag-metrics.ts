/**
 * RAG evaluation metrics
 * Based on RAGAS framework concepts
 */

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";

const baseModel = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  temperature: 0,
  apiKey: process.env.GOOGLE_API_KEY ?? process.env.GOOGLE_GENAI_API_KEY,
});

const faithfulnessSchema = z.object({
  score: z.number().min(0).max(1).describe("Faithfulness score from 0.0 to 1.0, where 1.0 = all claims supported by context, 0.0 = no claims supported"),
});

const relevancySchema = z.object({
  score: z.number().min(0).max(1).describe("Relevancy score from 0.0 to 1.0, where 1.0 = directly answers the question, 0.0 = not relevant"),
});

const contextRelevanceSchema = z.object({
  isRelevant: z.boolean().describe("Whether the context is relevant for answering the question"),
});

export interface EvaluationResult {
  faithfulness: number; // 0-1, how faithful is the answer to the context
  answerRelevancy: number; // 0-1, how relevant is the answer to the question
  contextPrecision: number; // 0-1, how precise is the retrieved context
  contextRecall: number; // 0-1, how much of the ground truth is in context
}

/**
 * Evaluate faithfulness: Are the answers grounded in the retrieved context?
 */
export async function evaluateFaithfulness(
  answer: string,
  context: string[]
): Promise<number> {
  const combinedContext = context.join("\n\n");

  const prompt = `Given the following context and answer, determine if the answer is faithful to the context.
An answer is faithful if all claims can be verified from the context.

Context:
${combinedContext}

Answer:
${answer}

Rate the faithfulness from 0.0 to 1.0, where:
- 1.0 = All claims are supported by context
- 0.5 = Some claims are supported
- 0.0 = No claims are supported`;

  try {
    const structuredModel = baseModel.withStructuredOutput(faithfulnessSchema);
    const result = await structuredModel.invoke(prompt);
    return Math.max(0, Math.min(1, result.score));
  } catch (error) {
    console.error("Error evaluating faithfulness:", error);
    return 0;
  }
}

/**
 * Evaluate answer relevancy: Is the answer relevant to the question?
 */
export async function evaluateAnswerRelevancy(
  question: string,
  answer: string
): Promise<number> {
  const prompt = `Given the following question and answer, rate how relevant the answer is to the question.

Question:
${question}

Answer:
${answer}

Rate the relevancy from 0.0 to 1.0, where:
- 1.0 = Directly answers the question
- 0.5 = Partially relevant
- 0.0 = Not relevant`;

  try {
    const structuredModel = baseModel.withStructuredOutput(relevancySchema);
    const result = await structuredModel.invoke(prompt);
    return Math.max(0, Math.min(1, result.score));
  } catch (error) {
    console.error("Error evaluating answer relevancy:", error);
    return 0;
  }
}

/**
 * Evaluate context precision: Is the retrieved context precise/relevant?
 */
export async function evaluateContextPrecision(
  question: string,
  contexts: string[]
): Promise<number> {
  if (contexts.length === 0) return 0;

  let relevantCount = 0;
  const structuredModel = baseModel.withStructuredOutput(contextRelevanceSchema);

  for (const context of contexts) {
    const prompt = `Given a question and a piece of context, determine if the context is relevant for answering the question.

Question:
${question}

Context:
${context}

Is this context relevant?`;

    try {
      const result = await structuredModel.invoke(prompt);
      if (result.isRelevant) {
        relevantCount++;
      }
    } catch (error) {
      console.error("Error evaluating context precision:", error);
    }
  }

  return relevantCount / contexts.length;
}

/**
 * Evaluate complete RAG pipeline
 */
export async function evaluateRAG(
  question: string,
  answer: string,
  retrievedContexts: string[],
  groundTruth?: string
): Promise<EvaluationResult> {
  const [faithfulness, answerRelevancy, contextPrecision] = await Promise.all([
    evaluateFaithfulness(answer, retrievedContexts),
    evaluateAnswerRelevancy(question, answer),
    evaluateContextPrecision(question, retrievedContexts),
  ]);

  // Context recall requires ground truth - set to 0 if not provided
  const contextRecall = 0;

  return {
    faithfulness,
    answerRelevancy,
    contextPrecision,
    contextRecall,
  };
}
