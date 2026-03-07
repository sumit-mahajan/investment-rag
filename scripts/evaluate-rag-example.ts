/**
 * Example script demonstrating RAGAS evaluation usage
 * Run with: npx tsx scripts/evaluate-rag-example.ts
 */

import {
  evaluateRAGAS,
  evaluateBatch,
  formatEvaluationResults,
  meetsQualityThresholds,
  type EvaluationInput,
} from "../lib/evaluation";
import { isFaithfulnessDetails, isPrecisionDetails } from "@/lib/types/evaluation";

// ============================================================================
// EXAMPLE 1: Single evaluation with all metrics
// ============================================================================

async function exampleSingleEvaluation() {
  console.log("=".repeat(80));
  console.log("EXAMPLE 1: Single RAG Evaluation with Ground Truth");
  console.log("=".repeat(80));

  const input: EvaluationInput = {
    question: "What was Apple's revenue in Q1 2024?",
    answer: "Apple reported a total revenue of $119.6 billion in Q1 2024, which represents a 2% increase year-over-year. The iPhone segment contributed $69.7 billion to this revenue.",
    contexts: [
      "Apple Inc. announced its fiscal Q1 2024 results on February 1, 2024. The company posted quarterly revenue of $119.6 billion, up 2 percent year over year. iPhone revenue was $69.7 billion for the quarter.",
      "The company's services business reached an all-time high of $23.1 billion in Q1 2024. Mac revenue was $7.8 billion, while iPad revenue came in at $7.0 billion.",
      "Apple's wearables, home, and accessories category generated $12.0 billion in Q1 2024. The company returned nearly $27 billion to shareholders during the quarter.",
    ],
    ground_truth: "Apple's Q1 2024 revenue was $119.6 billion, marking a 2% year-over-year increase. iPhone sales accounted for $69.7 billion of this total.",
  };

  try {
    const result = await evaluateRAGAS(input);
    
    console.log(formatEvaluationResults(result));
    console.log("\n" + "-".repeat(80));
    console.log("Detailed Breakdown:");
    console.log("-".repeat(80));
    
    if (isFaithfulnessDetails(result.evaluation_details.faithfulness_details)) {
      const fd = result.evaluation_details.faithfulness_details;
      console.log("\nFaithfulness Details:");
      console.log(`  Total statements: ${fd.total_statements}`);
      console.log(`  Supported: ${fd.supported_statements}`);
    }

    if (isPrecisionDetails(result.evaluation_details.precision_details)) {
      const pd = result.evaluation_details.precision_details;
      console.log("\nContext Precision Details:");
      console.log(`  Average relevance: ${(pd.average_relevance * 100).toFixed(2)}%`);
      console.log(`  Individual scores: ${pd.relevance_scores.map((s: number) => (s * 100).toFixed(0) + "%").join(", ")}`);
    }

    // Check quality thresholds
    const qualityCheck = meetsQualityThresholds(result);
    console.log("\n" + "-".repeat(80));
    console.log("Quality Threshold Check:");
    console.log("-".repeat(80));
    console.log(`Status: ${qualityCheck.passes ? '✅ PASS' : '❌ FAIL'}`);
    if (!qualityCheck.passes) {
      console.log("Failing metrics:");
      qualityCheck.failing_metrics.forEach(metric => console.log(`  - ${metric}`));
    }

    return result;
  } catch (error) {
    console.error("Error in evaluation:", error);
    throw error;
  }
}

// ============================================================================
// EXAMPLE 2: Evaluation without ground truth
// ============================================================================

async function exampleWithoutGroundTruth() {
  console.log("\n\n" + "=".repeat(80));
  console.log("EXAMPLE 2: RAG Evaluation WITHOUT Ground Truth");
  console.log("=".repeat(80));

  const input: EvaluationInput = {
    question: "What are the key risks mentioned in Tesla's latest 10-K filing?",
    answer: "Tesla's 10-K filing highlights several key risks including supply chain vulnerabilities, particularly for battery components and semiconductors. The company also notes regulatory risks related to autonomous driving technology and potential changes in EV incentives. Competition in the EV market is intensifying, and Tesla faces execution risks with new product launches like the Cybertruck.",
    contexts: [
      "Tesla's 2023 10-K filing identifies supply chain constraints as a significant risk factor. The company relies heavily on third-party suppliers for battery cells, semiconductors, and other critical components. Any disruption could materially impact production.",
      "The autonomous driving regulatory environment remains uncertain. Tesla's Full Self-Driving (FSD) technology faces scrutiny from regulators, and changes in regulations could limit deployment or require costly modifications.",
      "Government incentives for electric vehicles play a crucial role in demand. Changes to federal or state EV tax credits could negatively impact sales. The Inflation Reduction Act provides current support, but future policy changes are uncertain.",
      "The electric vehicle market has become increasingly competitive with traditional automakers launching EV models. Companies like Ford, GM, and new entrants from China are competing directly with Tesla.",
      "Tesla mentions execution risks related to ramping production of new models including Cybertruck. Manufacturing at scale presents technical and operational challenges.",
    ],
  };

  try {
    const result = await evaluateRAGAS(input);
    
    console.log(formatEvaluationResults(result));
    
    console.log("\n" + "-".repeat(80));
    console.log("Note: Context Recall, Semantic Similarity, and Correctness require ground truth");
    console.log("-".repeat(80));

    return result;
  } catch (error) {
    console.error("Error in evaluation:", error);
    throw error;
  }
}

// ============================================================================
// EXAMPLE 3: Batch evaluation with statistics
// ============================================================================

async function exampleBatchEvaluation() {
  console.log("\n\n" + "=".repeat(80));
  console.log("EXAMPLE 3: Batch Evaluation with Multiple Test Cases");
  console.log("=".repeat(80));

  const testCases: EvaluationInput[] = [
    {
      question: "What is Microsoft's cloud revenue?",
      answer: "Microsoft's Intelligent Cloud segment generated $28.5 billion in revenue.",
      contexts: [
        "Microsoft reported Intelligent Cloud revenue of $28.5 billion in Q2 FY2024, with Azure and other cloud services growing 30% year-over-year.",
        "The company's overall revenue was $62.0 billion for the quarter, up 18% year-over-year.",
      ],
      ground_truth: "Microsoft's Intelligent Cloud segment had revenue of $28.5 billion in Q2 FY2024.",
    },
    {
      question: "What was Nvidia's data center revenue?",
      answer: "Nvidia's data center segment achieved record revenue of $18.4 billion, driven by strong demand for AI compute infrastructure and the H100 GPU.",
      contexts: [
        "NVIDIA's Data Center revenue reached a record $18.4 billion in Q3 FY2024, up 279% year-over-year and up 41% sequentially.",
        "The surge was driven by accelerating demand for the company's Hopper GPU computing platform for large language models and generative AI.",
        "The H100 GPU has seen exceptional demand from cloud service providers and enterprises building AI infrastructure.",
      ],
      ground_truth: "Nvidia reported record data center revenue of $18.4 billion in Q3 FY2024, primarily due to AI-driven demand for the H100 GPU.",
    },
    {
      question: "What is Amazon's AWS growth rate?",
      answer: "AWS grew by 13% year-over-year with revenue of $23.1 billion in Q4 2023.",
      contexts: [
        "Amazon Web Services (AWS) net sales increased 13% year-over-year to $24.2 billion in Q4 2023.",
        "AWS operating income was $7.2 billion, representing a 30% operating margin.",
        "The company noted improving growth trends in AWS as customers optimize their cloud spending.",
      ],
      ground_truth: "AWS revenue grew 13% year-over-year to $24.2 billion in Q4 2023.",
    },
  ];

  try {
    console.log(`Evaluating ${testCases.length} test cases...`);
    console.log("(This may take a few minutes)\n");

    const startTime = Date.now();
    const results = await evaluateBatch(testCases, {
      parallel: true,
      batchSize: 2,
    });
    const endTime = Date.now();

    console.log(results.summary);
    
    console.log("\n" + "-".repeat(80));
    console.log("Individual Test Case Results:");
    console.log("-".repeat(80));
    
    results.individual_results.forEach((result, idx) => {
      console.log(`\nTest Case ${idx + 1}:`);
      console.log(`  Faithfulness:     ${(result.faithfulness * 100).toFixed(1)}%`);
      console.log(`  Relevancy:        ${(result.answer_relevancy * 100).toFixed(1)}%`);
      console.log(`  Precision:        ${(result.context_precision * 100).toFixed(1)}%`);
      console.log(`  Recall:           ${(result.context_recall * 100).toFixed(1)}%`);
      console.log(`  Correctness:      ${(result.answer_correctness * 100).toFixed(1)}%`);
    });

    console.log("\n" + "-".repeat(80));
    console.log(`Total evaluation time: ${((endTime - startTime) / 1000).toFixed(2)}s`);
    console.log(`Average time per case: ${((endTime - startTime) / testCases.length / 1000).toFixed(2)}s`);
    console.log("-".repeat(80));

    return results;
  } catch (error) {
    console.error("Error in batch evaluation:", error);
    throw error;
  }
}

// ============================================================================
// EXAMPLE 4: Poor quality detection
// ============================================================================

async function examplePoorQuality() {
  console.log("\n\n" + "=".repeat(80));
  console.log("EXAMPLE 4: Detecting Poor Quality RAG Output");
  console.log("=".repeat(80));

  const input: EvaluationInput = {
    question: "What was Google's advertising revenue in Q4 2023?",
    answer: "Google is a major technology company that operates search engines and cloud services. The company was founded by Larry Page and Sergey Brin. Their headquarters is in Mountain View, California.",
    contexts: [
      "Alphabet Inc. reported Google advertising revenue of $65.5 billion in Q4 2023, up 11% year-over-year.",
      "Google Search and other advertising revenue was $48.0 billion, while YouTube ads generated $9.2 billion.",
      "Google Cloud revenue reached $9.2 billion in Q4 2023, growing 26% year-over-year.",
    ],
    ground_truth: "Google's advertising revenue was $65.5 billion in Q4 2023, an 11% increase year-over-year.",
  };

  try {
    const result = await evaluateRAGAS(input);
    
    console.log(formatEvaluationResults(result));

    const qualityCheck = meetsQualityThresholds(result, {
      faithfulness: 0.8,
      answer_relevancy: 0.7,
      context_precision: 0.7,
      answer_correctness: 0.7,
    });

    console.log("\n" + "-".repeat(80));
    console.log("Quality Analysis:");
    console.log("-".repeat(80));
    console.log(`Status: ${qualityCheck.passes ? '✅ PASS' : '❌ FAIL'}`);
    console.log("\nExpected Issues:");
    console.log("  - Low answer relevancy (answer doesn't address the question)");
    console.log("  - Low correctness (missing key information)");
    console.log("  - Low faithfulness (contains unrequested information)");
    
    if (!qualityCheck.passes) {
      console.log("\nActual Failing Metrics:");
      qualityCheck.failing_metrics.forEach(metric => console.log(`  - ${metric}`));
    }

    return result;
  } catch (error) {
    console.error("Error in evaluation:", error);
    throw error;
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log("\n");
  console.log("█".repeat(80));
  console.log("█" + " ".repeat(78) + "█");
  console.log("█" + " ".repeat(20) + "RAGAS EVALUATOR - EXAMPLES" + " ".repeat(32) + "█");
  console.log("█" + " ".repeat(24) + "Using Gemini Flash 2.5" + " ".repeat(32) + "█");
  console.log("█" + " ".repeat(78) + "█");
  console.log("█".repeat(80));

  try {
    // Run all examples
    await exampleSingleEvaluation();
    await exampleWithoutGroundTruth();
    await exampleBatchEvaluation();
    await examplePoorQuality();

    console.log("\n\n" + "=".repeat(80));
    console.log("All examples completed successfully! ✅");
    console.log("=".repeat(80));
    console.log("\nIntegration Tips:");
    console.log("1. Import the evaluator: import { evaluateRAGAS } from './lib/evaluation/ragas-evaluator'");
    console.log("2. Call evaluateRAGAS() with your RAG output");
    console.log("3. Use meetsQualityThresholds() to enforce quality standards");
    console.log("4. Use evaluateBatch() for testing multiple cases");
    console.log("5. Set GOOGLE_GENAI_API_KEY environment variable");
    console.log("\n");

  } catch (error) {
    console.error("\n❌ Example execution failed:", error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export {
  exampleSingleEvaluation,
  exampleWithoutGroundTruth,
  exampleBatchEvaluation,
  examplePoorQuality,
};
