/**
 * Production-grade RAGAS (RAG Assessment) Evaluator
 * Using Gemini Flash 2.5 for LLM-based evaluation
 * 
 * Implements the following metrics:
 * 1. Faithfulness - measures factual consistency of answer with context
 * 2. Answer Relevancy - measures how relevant the answer is to the question
 * 3. Context Precision - measures signal-to-noise ratio in retrieved contexts
 * 4. Context Recall - measures if all ground truth info is in retrieved context
 * 5. Answer Semantic Similarity - measures semantic similarity to ground truth
 * 6. Answer Correctness - combines semantic and factual correctness
 */

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";

// Initialize Gemini Flash 2.5
const geminiModel = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash-exp",
  temperature: 0,
  maxRetries: 3,
  apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

// ============================================================================
// SCHEMAS FOR STRUCTURED OUTPUTS
// ============================================================================

const faithfulnessSchema = z.object({
  statements: z.array(z.string()).describe("List of atomic statements in the answer"),
  verdicts: z.array(z.boolean()).describe("For each statement, whether it's supported by context"),
  reasoning: z.array(z.string()).describe("Reasoning for each verdict"),
});

const answerRelevancySchema = z.object({
  score: z.number().min(0).max(1).describe("Relevancy score from 0 to 1"),
  reasoning: z.string().describe("Explanation of the score"),
});

const contextPrecisionSchema = z.object({
  relevance_scores: z.array(z.number().min(0).max(1)).describe("Relevance score for each context chunk"),
  reasoning: z.array(z.string()).describe("Reasoning for each score"),
});

const contextRecallSchema = z.object({
  attributed_statements: z.array(z.boolean()).describe("Whether each ground truth statement can be attributed to context"),
  reasoning: z.array(z.string()).describe("Reasoning for each attribution"),
});

const semanticSimilaritySchema = z.object({
  score: z.number().min(0).max(1).describe("Semantic similarity score from 0 to 1"),
  reasoning: z.string().describe("Explanation of the score"),
});

const correctnessSchema = z.object({
  correctness_score: z.number().min(0).max(1).describe("Overall correctness score"),
  tp: z.number().describe("True positives: correct statements in answer"),
  fp: z.number().describe("False positives: incorrect statements in answer"),
  fn: z.number().describe("False negatives: ground truth statements missing in answer"),
  reasoning: z.string().describe("Detailed reasoning"),
});

// ============================================================================
// EVALUATION INTERFACES
// ============================================================================

export interface RAGASMetrics {
  faithfulness: number;
  answer_relevancy: number;
  context_precision: number;
  context_recall: number;
  answer_semantic_similarity: number;
  answer_correctness: number;
}

export interface EvaluationInput {
  question: string;
  answer: string;
  contexts: string[];
  ground_truth?: string;
}

export interface DetailedEvaluation extends RAGASMetrics {
  evaluation_details: {
    faithfulness_details?: any;
    relevancy_details?: any;
    precision_details?: any;
    recall_details?: any;
    similarity_details?: any;
    correctness_details?: any;
  };
  timestamp: string;
  model_used: string;
}

// ============================================================================
// FAITHFULNESS EVALUATION
// ============================================================================

/**
 * Evaluates faithfulness: Are all claims in the answer supported by the context?
 * 
 * Process:
 * 1. Extract atomic statements from the answer
 * 2. For each statement, check if it's supported by the context
 * 3. Calculate score as: supported_statements / total_statements
 */
export async function evaluateFaithfulness(
  answer: string,
  contexts: string[]
): Promise<{ score: number; details: any }> {
  if (!answer || contexts.length === 0) {
    return { score: 0, details: { error: "Missing answer or contexts" } };
  }

  const combinedContext = contexts.join("\n\n---\n\n");

  const prompt = `You are an expert evaluator assessing the faithfulness of an answer to its source context.

TASK: Extract atomic statements from the answer and verify each against the context.

CONTEXT:
${combinedContext}

ANSWER:
${answer}

INSTRUCTIONS:
1. Break down the answer into atomic, factual statements (claims that can be individually verified)
2. For each statement, determine if it is SUPPORTED by the context (true) or NOT SUPPORTED (false)
3. A statement is supported only if the context directly provides evidence for it
4. Provide clear reasoning for each verdict

Return a JSON object with:
- statements: array of atomic statements
- verdicts: array of boolean values (true if supported, false if not)
- reasoning: array of explanations for each verdict`;

  try {
    const structuredModel = geminiModel.withStructuredOutput(faithfulnessSchema);
    const result = await structuredModel.invoke(prompt);

    if (!result.statements || result.statements.length === 0) {
      return { score: 1, details: { message: "No verifiable statements" } };
    }

    const supportedCount = result.verdicts.filter(Boolean).length;
    const score = supportedCount / result.statements.length;

    return {
      score,
      details: {
        total_statements: result.statements.length,
        supported_statements: supportedCount,
        statements: result.statements,
        verdicts: result.verdicts,
        reasoning: result.reasoning,
      },
    };
  } catch (error) {
    console.error("Error evaluating faithfulness:", error);
    return { score: 0, details: { error: String(error) } };
  }
}

// ============================================================================
// ANSWER RELEVANCY EVALUATION
// ============================================================================

/**
 * Evaluates answer relevancy: How well does the answer address the question?
 * 
 * This measures if the answer is focused on the question without irrelevant information.
 * Uses LLM to assess relevance on a 0-1 scale.
 */
export async function evaluateAnswerRelevancy(
  question: string,
  answer: string
): Promise<{ score: number; details: any }> {
  if (!question || !answer) {
    return { score: 0, details: { error: "Missing question or answer" } };
  }

  const prompt = `You are an expert evaluator assessing how relevant an answer is to a given question.

QUESTION:
${question}

ANSWER:
${answer}

INSTRUCTIONS:
Rate the relevancy from 0.0 to 1.0 where:
- 1.0 = Answer directly and completely addresses the question with no irrelevant information
- 0.7-0.9 = Answer addresses the question but includes some unnecessary details
- 0.4-0.6 = Answer is partially relevant but misses key aspects or has significant irrelevant content
- 0.1-0.3 = Answer is mostly irrelevant with only minor relevance
- 0.0 = Answer is completely irrelevant to the question

Consider:
- Does the answer address the core intent of the question?
- Is the information provided pertinent to what was asked?
- Are there irrelevant tangents or missing key points?

Provide a score and detailed reasoning.`;

  try {
    const structuredModel = geminiModel.withStructuredOutput(answerRelevancySchema);
    const result = await structuredModel.invoke(prompt);

    return {
      score: Math.max(0, Math.min(1, result.score)),
      details: {
        reasoning: result.reasoning,
      },
    };
  } catch (error) {
    console.error("Error evaluating answer relevancy:", error);
    return { score: 0, details: { error: String(error) } };
  }
}

// ============================================================================
// CONTEXT PRECISION EVALUATION
// ============================================================================

/**
 * Evaluates context precision: Are the retrieved contexts relevant to the question?
 * 
 * Measures the signal-to-noise ratio - higher rank contexts should be more relevant.
 * Uses weighted scoring where earlier contexts have more weight.
 */
export async function evaluateContextPrecision(
  question: string,
  contexts: string[]
): Promise<{ score: number; details: any }> {
  if (contexts.length === 0) {
    return { score: 0, details: { error: "No contexts provided" } };
  }

  const prompt = `You are an expert evaluator assessing the relevance of retrieved contexts to a question.

QUESTION:
${question}

CONTEXTS (in order of retrieval rank):
${contexts.map((ctx, i) => `[${i + 1}] ${ctx}`).join("\n\n---\n\n")}

INSTRUCTIONS:
For each context, rate its relevance to answering the question on a scale from 0.0 to 1.0:
- 1.0 = Highly relevant, directly helps answer the question
- 0.5-0.9 = Moderately relevant, provides some useful information
- 0.1-0.4 = Minimally relevant, tangentially related
- 0.0 = Not relevant at all

Provide a relevance score and reasoning for each context.`;

  try {
    const structuredModel = geminiModel.withStructuredOutput(contextPrecisionSchema);
    const result = await structuredModel.invoke(prompt);

    // Calculate weighted precision (earlier contexts weighted more)
    let weightedSum = 0;
    let weightSum = 0;

    for (let i = 0; i < result.relevance_scores.length; i++) {
      const weight = 1 / (i + 1); // Higher weight for earlier contexts
      weightedSum += result.relevance_scores[i] * weight;
      weightSum += weight;
    }

    const score = weightSum > 0 ? weightedSum / weightSum : 0;

    return {
      score,
      details: {
        relevance_scores: result.relevance_scores,
        reasoning: result.reasoning,
        average_relevance: result.relevance_scores.reduce((a, b) => a + b, 0) / result.relevance_scores.length,
      },
    };
  } catch (error) {
    console.error("Error evaluating context precision:", error);
    return { score: 0, details: { error: String(error) } };
  }
}

// ============================================================================
// CONTEXT RECALL EVALUATION
// ============================================================================

/**
 * Evaluates context recall: Can all information in ground truth be found in context?
 * 
 * Requires ground truth answer. Measures if the retrieved context contains
 * all necessary information to generate the ground truth answer.
 */
export async function evaluateContextRecall(
  contexts: string[],
  ground_truth: string
): Promise<{ score: number; details: any }> {
  if (contexts.length === 0 || !ground_truth) {
    return { score: 0, details: { error: "Missing contexts or ground truth" } };
  }

  const combinedContext = contexts.join("\n\n---\n\n");

  const prompt = `You are an expert evaluator assessing context recall.

TASK: Determine if all information in the ground truth can be attributed to the provided context.

CONTEXT:
${combinedContext}

GROUND TRUTH ANSWER:
${ground_truth}

INSTRUCTIONS:
1. Break down the ground truth into atomic statements
2. For each statement, determine if it can be attributed to the context
3. A statement is attributed if the context contains the information (even if worded differently)
4. Provide reasoning for each attribution decision

Return:
- attributed_statements: array of boolean values
- reasoning: array of explanations`;

  try {
    const structuredModel = geminiModel.withStructuredOutput(contextRecallSchema);
    const result = await structuredModel.invoke(prompt);

    const attributedCount = result.attributed_statements.filter(Boolean).length;
    const score = result.attributed_statements.length > 0
      ? attributedCount / result.attributed_statements.length
      : 0;

    return {
      score,
      details: {
        total_statements: result.attributed_statements.length,
        attributed_statements: attributedCount,
        reasoning: result.reasoning,
      },
    };
  } catch (error) {
    console.error("Error evaluating context recall:", error);
    return { score: 0, details: { error: String(error) } };
  }
}

// ============================================================================
// ANSWER SEMANTIC SIMILARITY
// ============================================================================

/**
 * Evaluates semantic similarity between generated answer and ground truth.
 * Uses LLM to assess semantic equivalence rather than exact word matching.
 */
export async function evaluateSemanticSimilarity(
  answer: string,
  ground_truth: string
): Promise<{ score: number; details: any }> {
  if (!answer || !ground_truth) {
    return { score: 0, details: { error: "Missing answer or ground truth" } };
  }

  const prompt = `You are an expert evaluator assessing semantic similarity between two answers.

GENERATED ANSWER:
${answer}

GROUND TRUTH ANSWER:
${ground_truth}

INSTRUCTIONS:
Rate the semantic similarity from 0.0 to 1.0:
- 1.0 = Semantically identical, conveys the same meaning
- 0.7-0.9 = Very similar, minor differences in detail or phrasing
- 0.4-0.6 = Partially similar, shares some key concepts but differs significantly
- 0.1-0.3 = Minimally similar, different meanings with few common elements
- 0.0 = Completely different meanings

Focus on MEANING, not exact word matching. Two answers can score high even with different wording.

Provide score and reasoning.`;

  try {
    const structuredModel = geminiModel.withStructuredOutput(semanticSimilaritySchema);
    const result = await structuredModel.invoke(prompt);

    return {
      score: Math.max(0, Math.min(1, result.score)),
      details: {
        reasoning: result.reasoning,
      },
    };
  } catch (error) {
    console.error("Error evaluating semantic similarity:", error);
    return { score: 0, details: { error: String(error) } };
  }
}

// ============================================================================
// ANSWER CORRECTNESS
// ============================================================================

/**
 * Evaluates answer correctness: Combines factual and semantic correctness.
 * 
 * Uses F1-based approach with weighted combination of semantic similarity.
 * Formula: correctness = (F1 + semantic_similarity) / 2
 */
export async function evaluateCorrectness(
  answer: string,
  ground_truth: string
): Promise<{ score: number; details: any }> {
  if (!answer || !ground_truth) {
    return { score: 0, details: { error: "Missing answer or ground truth" } };
  }

  const prompt = `You are an expert evaluator assessing answer correctness.

GENERATED ANSWER:
${answer}

GROUND TRUTH ANSWER:
${ground_truth}

INSTRUCTIONS:
Analyze the correctness by identifying:
1. TP (True Positives): Number of correct statements in the generated answer that align with ground truth
2. FP (False Positives): Number of incorrect or unsupported statements in the generated answer
3. FN (False Negatives): Number of important statements from ground truth that are missing in the generated answer

Then calculate:
- Precision = TP / (TP + FP)
- Recall = TP / (TP + FN)
- F1 = 2 * (Precision * Recall) / (Precision + Recall)

Also provide an overall correctness score from 0.0 to 1.0 considering both factual accuracy and completeness.

Provide detailed reasoning for your assessment.`;

  try {
    const structuredModel = geminiModel.withStructuredOutput(correctnessSchema);
    const result = await structuredModel.invoke(prompt);

    // Also calculate semantic similarity for weighted score
    const { score: semanticScore } = await evaluateSemanticSimilarity(answer, ground_truth);

    // Combine F1-based correctness with semantic similarity
    const finalScore = Math.max(0, Math.min(1, (result.correctness_score + semanticScore) / 2));

    return {
      score: finalScore,
      details: {
        correctness_score: result.correctness_score,
        semantic_similarity: semanticScore,
        tp: result.tp,
        fp: result.fp,
        fn: result.fn,
        precision: result.tp / (result.tp + result.fp || 1),
        recall: result.tp / (result.tp + result.fn || 1),
        reasoning: result.reasoning,
      },
    };
  } catch (error) {
    console.error("Error evaluating correctness:", error);
    return { score: 0, details: { error: String(error) } };
  }
}

// ============================================================================
// COMPREHENSIVE EVALUATION
// ============================================================================

/**
 * Performs comprehensive RAGAS evaluation of a RAG system response.
 * 
 * @param input - Evaluation input containing question, answer, contexts, and optional ground truth
 * @returns Detailed evaluation with all RAGAS metrics
 */
export async function evaluateRAGAS(
  input: EvaluationInput
): Promise<DetailedEvaluation> {
  const { question, answer, contexts, ground_truth } = input;

  // Run all evaluations in parallel where possible
  const [
    faithfulnessResult,
    relevancyResult,
    precisionResult,
  ] = await Promise.all([
    evaluateFaithfulness(answer, contexts),
    evaluateAnswerRelevancy(question, answer),
    evaluateContextPrecision(question, contexts),
  ]);

  // These require ground truth, evaluate conditionally
  let recallResult = { score: 0, details: { message: "Ground truth not provided" } };
  let similarityResult = { score: 0, details: { message: "Ground truth not provided" } };
  let correctnessResult = { score: 0, details: { message: "Ground truth not provided" } };

  if (ground_truth) {
    [recallResult, similarityResult, correctnessResult] = await Promise.all([
      evaluateContextRecall(contexts, ground_truth),
      evaluateSemanticSimilarity(answer, ground_truth),
      evaluateCorrectness(answer, ground_truth),
    ]);
  }

  return {
    faithfulness: faithfulnessResult.score,
    answer_relevancy: relevancyResult.score,
    context_precision: precisionResult.score,
    context_recall: recallResult.score,
    answer_semantic_similarity: similarityResult.score,
    answer_correctness: correctnessResult.score,
    evaluation_details: {
      faithfulness_details: faithfulnessResult.details,
      relevancy_details: relevancyResult.details,
      precision_details: precisionResult.details,
      recall_details: recallResult.details,
      similarity_details: similarityResult.details,
      correctness_details: correctnessResult.details,
    },
    timestamp: new Date().toISOString(),
    model_used: "gemini-2.0-flash-exp",
  };
}

// ============================================================================
// BATCH EVALUATION
// ============================================================================

/**
 * Evaluates multiple test cases in batch and provides aggregated statistics.
 */
export async function evaluateBatch(
  testCases: EvaluationInput[],
  options: {
    parallel?: boolean;
    batchSize?: number;
  } = {}
): Promise<{
  individual_results: DetailedEvaluation[];
  aggregate_metrics: RAGASMetrics & { std_dev: Partial<RAGASMetrics> };
  summary: string;
}> {
  const { parallel = false, batchSize = 5 } = options;

  let results: DetailedEvaluation[];

  if (parallel) {
    // Process in batches to avoid rate limits
    results = [];
    for (let i = 0; i < testCases.length; i += batchSize) {
      const batch = testCases.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(testCase => evaluateRAGAS(testCase))
      );
      results.push(...batchResults);

      // Small delay between batches
      if (i + batchSize < testCases.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  } else {
    // Sequential processing
    results = [];
    for (const testCase of testCases) {
      const result = await evaluateRAGAS(testCase);
      results.push(result);
    }
  }

  // Calculate aggregate metrics
  const metrics = {
    faithfulness: results.reduce((sum, r) => sum + r.faithfulness, 0) / results.length,
    answer_relevancy: results.reduce((sum, r) => sum + r.answer_relevancy, 0) / results.length,
    context_precision: results.reduce((sum, r) => sum + r.context_precision, 0) / results.length,
    context_recall: results.reduce((sum, r) => sum + r.context_recall, 0) / results.length,
    answer_semantic_similarity: results.reduce((sum, r) => sum + r.answer_semantic_similarity, 0) / results.length,
    answer_correctness: results.reduce((sum, r) => sum + r.answer_correctness, 0) / results.length,
  };

  // Calculate standard deviations
  const calculateStdDev = (values: number[]) => {
    const mean = values.reduce((a, b) => a + b) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  };

  const stdDev = {
    faithfulness: calculateStdDev(results.map(r => r.faithfulness)),
    answer_relevancy: calculateStdDev(results.map(r => r.answer_relevancy)),
    context_precision: calculateStdDev(results.map(r => r.context_precision)),
    context_recall: calculateStdDev(results.map(r => r.context_recall)),
    answer_semantic_similarity: calculateStdDev(results.map(r => r.answer_semantic_similarity)),
    answer_correctness: calculateStdDev(results.map(r => r.answer_correctness)),
  };

  const summary = `
RAGAS Evaluation Summary (${results.length} test cases)
========================================
Faithfulness:              ${(metrics.faithfulness * 100).toFixed(2)}% (±${(stdDev.faithfulness * 100).toFixed(2)}%)
Answer Relevancy:          ${(metrics.answer_relevancy * 100).toFixed(2)}% (±${(stdDev.answer_relevancy * 100).toFixed(2)}%)
Context Precision:         ${(metrics.context_precision * 100).toFixed(2)}% (±${(stdDev.context_precision * 100).toFixed(2)}%)
Context Recall:            ${(metrics.context_recall * 100).toFixed(2)}% (±${(stdDev.context_recall * 100).toFixed(2)}%)
Answer Similarity:         ${(metrics.answer_semantic_similarity * 100).toFixed(2)}% (±${(stdDev.answer_semantic_similarity * 100).toFixed(2)}%)
Answer Correctness:        ${(metrics.answer_correctness * 100).toFixed(2)}% (±${(stdDev.answer_correctness * 100).toFixed(2)}%)

Overall RAG Quality Score: ${((metrics.faithfulness + metrics.answer_relevancy + metrics.context_precision) / 3 * 100).toFixed(2)}%
`.trim();

  return {
    individual_results: results,
    aggregate_metrics: {
      ...metrics,
      std_dev: stdDev,
    },
    summary,
  };
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Format evaluation results for display
 */
export function formatEvaluationResults(evaluation: DetailedEvaluation): string {
  return `
RAGAS Evaluation Results
========================
Model: ${evaluation.model_used}
Timestamp: ${evaluation.timestamp}

Core Metrics:
- Faithfulness:              ${(evaluation.faithfulness * 100).toFixed(2)}%
- Answer Relevancy:          ${(evaluation.answer_relevancy * 100).toFixed(2)}%
- Context Precision:         ${(evaluation.context_precision * 100).toFixed(2)}%
- Context Recall:            ${(evaluation.context_recall * 100).toFixed(2)}%
- Answer Similarity:         ${(evaluation.answer_semantic_similarity * 100).toFixed(2)}%
- Answer Correctness:        ${(evaluation.answer_correctness * 100).toFixed(2)}%

Overall RAG Quality Score: ${((evaluation.faithfulness + evaluation.answer_relevancy + evaluation.context_precision) / 3 * 100).toFixed(2)}%
`.trim();
}

/**
 * Check if evaluation meets quality thresholds
 */
export function meetsQualityThresholds(
  evaluation: DetailedEvaluation,
  thresholds: Partial<RAGASMetrics> = {
    faithfulness: 0.8,
    answer_relevancy: 0.7,
    context_precision: 0.7,
  }
): { passes: boolean; failing_metrics: string[] } {
  const failingMetrics: string[] = [];

  if (thresholds.faithfulness && evaluation.faithfulness < thresholds.faithfulness) {
    failingMetrics.push(`Faithfulness: ${evaluation.faithfulness.toFixed(2)} < ${thresholds.faithfulness}`);
  }
  if (thresholds.answer_relevancy && evaluation.answer_relevancy < thresholds.answer_relevancy) {
    failingMetrics.push(`Answer Relevancy: ${evaluation.answer_relevancy.toFixed(2)} < ${thresholds.answer_relevancy}`);
  }
  if (thresholds.context_precision && evaluation.context_precision < thresholds.context_precision) {
    failingMetrics.push(`Context Precision: ${evaluation.context_precision.toFixed(2)} < ${thresholds.context_precision}`);
  }
  if (thresholds.context_recall && evaluation.context_recall < thresholds.context_recall) {
    failingMetrics.push(`Context Recall: ${evaluation.context_recall.toFixed(2)} < ${thresholds.context_recall}`);
  }

  return {
    passes: failingMetrics.length === 0,
    failing_metrics: failingMetrics,
  };
}
