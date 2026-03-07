#!/usr/bin/env node
/**
 * CLI tool for running RAGAS evaluations
 * 
 * Usage:
 *   npx tsx scripts/evaluate-rag.ts --file test-cases.json
 *   npx tsx scripts/evaluate-rag.ts --question "..." --answer "..." --contexts "..." "..."
 *   npx tsx scripts/evaluate-rag.ts --file test-cases.json --output results.json
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  evaluateRAGAS,
  evaluateBatch,
  formatEvaluationResults,
  meetsQualityThresholds,
  type EvaluationInput,
  type DetailedEvaluation,
} from "../lib/evaluation";
import { isFaithfulnessDetails, isPrecisionDetails, isCorrectnessDetails } from "@/lib/types/evaluation";

// ============================================================================
// CLI Argument Parsing
// ============================================================================

interface CliArgs {
  file?: string;
  question?: string;
  answer?: string;
  contexts?: string[];
  groundTruth?: string;
  output?: string;
  thresholds?: string;
  parallel?: boolean;
  batchSize?: number;
  verbose?: boolean;
}

function parseArgs(): CliArgs {
  const args: CliArgs = {};
  const argv = process.argv.slice(2);

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    switch (arg) {
      case '--file':
      case '-f':
        args.file = argv[++i];
        break;
      case '--question':
      case '-q':
        args.question = argv[++i];
        break;
      case '--answer':
      case '-a':
        args.answer = argv[++i];
        break;
      case '--contexts':
      case '-c':
        args.contexts = [];
        while (i + 1 < argv.length && !argv[i + 1].startsWith('-')) {
          args.contexts.push(argv[++i]);
        }
        break;
      case '--ground-truth':
      case '--gt':
      case '-g':
        args.groundTruth = argv[++i];
        break;
      case '--output':
      case '-o':
        args.output = argv[++i];
        break;
      case '--thresholds':
      case '-t':
        args.thresholds = argv[++i];
        break;
      case '--parallel':
      case '-p':
        args.parallel = true;
        break;
      case '--batch-size':
      case '-b':
        args.batchSize = parseInt(argv[++i], 10);
        break;
      case '--verbose':
      case '-v':
        args.verbose = true;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
      default:
        console.error(`Unknown argument: ${arg}`);
        printHelp();
        process.exit(1);
    }
  }

  return args;
}

function printHelp() {
  console.log(`
RAGAS Evaluation CLI
====================

Usage:
  npx tsx scripts/evaluate-rag.ts [OPTIONS]

Options:
  -f, --file <path>           JSON file with test case(s)
  -q, --question <text>       Question for single evaluation
  -a, --answer <text>         Answer for single evaluation
  -c, --contexts <text...>    Context chunks (space-separated)
  -g, --ground-truth <text>   Ground truth answer (optional)
  -o, --output <path>         Output file for results (JSON)
  -t, --thresholds <json>     Quality thresholds as JSON
  -p, --parallel              Enable parallel batch processing
  -b, --batch-size <n>        Batch size for parallel processing (default: 5)
  -v, --verbose               Verbose output with details
  -h, --help                  Show this help message

Examples:
  # Evaluate from file
  npx tsx scripts/evaluate-rag.ts --file test-cases.json

  # Single evaluation
  npx tsx scripts/evaluate-rag.ts \\
    --question "What is Apple's revenue?" \\
    --answer "Apple's revenue is $394.3B" \\
    --contexts "Apple Inc. reported..." "The company's..."

  # With ground truth and output
  npx tsx scripts/evaluate-rag.ts \\
    --file test-cases.json \\
    --output results.json \\
    --parallel \\
    --verbose

  # With custom thresholds
  npx tsx scripts/evaluate-rag.ts \\
    --file test-cases.json \\
    --thresholds '{"faithfulness":0.9,"answer_relevancy":0.8}'

Input File Format:
  Single test case:
  {
    "question": "...",
    "answer": "...",
    "contexts": ["...", "..."],
    "ground_truth": "..." // optional
  }

  Multiple test cases:
  [
    { "question": "...", "answer": "...", "contexts": [...] },
    { "question": "...", "answer": "...", "contexts": [...] }
  ]
`);
}

// ============================================================================
// File I/O
// ============================================================================

function readTestCases(filePath: string): EvaluationInput[] {
  try {
    const absolutePath = path.resolve(filePath);
    const content = fs.readFileSync(absolutePath, 'utf-8');
    const data = JSON.parse(content);

    // Handle both single object and array
    const testCases = Array.isArray(data) ? data : [data];

    // Validate test cases
    for (const tc of testCases) {
      if (!tc.question || !tc.answer || !Array.isArray(tc.contexts)) {
        throw new Error('Invalid test case format. Required: question, answer, contexts[]');
      }
    }

    return testCases;
  } catch (error) {
    console.error(`Error reading test cases from ${filePath}:`, error);
    process.exit(1);
  }
}

function writeResults(filePath: string, data: any) {
  try {
    const absolutePath = path.resolve(filePath);
    const content = JSON.stringify(data, null, 2);
    fs.writeFileSync(absolutePath, content, 'utf-8');
    console.log(`\n✅ Results written to: ${absolutePath}`);
  } catch (error) {
    console.error(`Error writing results to ${filePath}:`, error);
    process.exit(1);
  }
}

// ============================================================================
// Evaluation Functions
// ============================================================================

async function evaluateSingle(args: CliArgs): Promise<DetailedEvaluation> {
  if (!args.question || !args.answer || !args.contexts || args.contexts.length === 0) {
    console.error('Error: For single evaluation, --question, --answer, and --contexts are required');
    process.exit(1);
  }

  const input: EvaluationInput = {
    question: args.question,
    answer: args.answer,
    contexts: args.contexts,
    ground_truth: args.groundTruth,
  };

  console.log('Evaluating single test case...\n');
  const result = await evaluateRAGAS(input);

  return result;
}

async function evaluateMultiple(args: CliArgs) {
  if (!args.file) {
    console.error('Error: --file is required for batch evaluation');
    process.exit(1);
  }

  const testCases = readTestCases(args.file);
  console.log(`Loaded ${testCases.length} test case(s) from ${args.file}\n`);

  if (testCases.length === 1) {
    return await evaluateRAGAS(testCases[0]);
  }

  console.log(`Running batch evaluation...`);
  if (args.parallel) {
    console.log(`Mode: Parallel (batch size: ${args.batchSize || 5})`);
  } else {
    console.log(`Mode: Sequential`);
  }
  console.log('');

  const results = await evaluateBatch(testCases, {
    parallel: args.parallel,
    batchSize: args.batchSize || 5,
  });

  return results;
}

// ============================================================================
// Display Functions
// ============================================================================

function displaySingleResult(result: DetailedEvaluation, verbose: boolean = false) {
  console.log(formatEvaluationResults(result));

  if (verbose) {
    console.log('\n' + '='.repeat(80));
    console.log('DETAILED BREAKDOWN');
    console.log('='.repeat(80));

    if (isFaithfulnessDetails(result.evaluation_details.faithfulness_details)) {
      const fd = result.evaluation_details.faithfulness_details;
      console.log("\n📊 Faithfulness:");
      console.log(`   ${fd.supported_statements}/${fd.total_statements} statements supported`);
      if (fd.statements) {
        console.log("\n   Statements:");
        fd.statements.forEach((stmt: string, i: number) => {
          const icon = fd.verdicts[i] ? "✓" : "✗";
          console.log(`   ${icon} ${stmt}`);
        });
      }
    }

    if (isPrecisionDetails(result.evaluation_details.precision_details)) {
      const pd = result.evaluation_details.precision_details;
      console.log("\n📊 Context Precision:");
      console.log(`   Average relevance: ${(pd.average_relevance * 100).toFixed(1)}%`);
      console.log("\n   Context scores:");
      pd.relevance_scores.forEach((score: number, i: number) => {
        console.log(`   [${i + 1}] ${(score * 100).toFixed(1)}%`);
      });
    }

    if (isCorrectnessDetails(result.evaluation_details.correctness_details)) {
      const cd = result.evaluation_details.correctness_details;
      console.log("\n📊 Correctness:");
      console.log(`   True Positives:  ${cd.tp}`);
      console.log(`   False Positives: ${cd.fp}`);
      console.log(`   False Negatives: ${cd.fn}`);
      console.log(`   Precision: ${(cd.precision * 100).toFixed(1)}%`);
      console.log(`   Recall:    ${(cd.recall * 100).toFixed(1)}%`);
    }
  }
}

function displayBatchResults(results: any, verbose: boolean = false) {
  console.log(results.summary);

  if (verbose) {
    console.log('\n' + '='.repeat(80));
    console.log('INDIVIDUAL TEST CASE RESULTS');
    console.log('='.repeat(80));

    results.individual_results.forEach((result: DetailedEvaluation, idx: number) => {
      console.log(`\n${'─'.repeat(80)}`);
      console.log(`Test Case ${idx + 1}/${results.individual_results.length}`);
      console.log('─'.repeat(80));
      displaySingleResult(result, false);
    });
  }
}

function checkThresholds(result: DetailedEvaluation | any, thresholds?: string) {
  let thresholdObj = {};
  
  if (thresholds) {
    try {
      thresholdObj = JSON.parse(thresholds);
    } catch (error) {
      console.error('Error parsing thresholds JSON:', error);
      return;
    }
  } else {
    // Use defaults
    thresholdObj = {
      faithfulness: 0.8,
      answer_relevancy: 0.7,
      context_precision: 0.7,
    };
  }

  console.log('\n' + '='.repeat(80));
  console.log('QUALITY THRESHOLD CHECK');
  console.log('='.repeat(80));

  // For batch results, check aggregate metrics
  const metricsToCheck = result.aggregate_metrics || result;

  const qualityCheck = meetsQualityThresholds(
    result.aggregate_metrics ? { ...metricsToCheck, evaluation_details: {}, timestamp: '', model_used: '' } : result,
    thresholdObj
  );

  console.log(`\nStatus: ${qualityCheck.passes ? '✅ PASS' : '❌ FAIL'}`);
  
  if (!qualityCheck.passes) {
    console.log('\nFailing metrics:');
    qualityCheck.failing_metrics.forEach(metric => {
      console.log(`  - ${metric}`);
    });
  } else {
    console.log('\nAll quality thresholds met! 🎉');
  }

  console.log('\nConfigured thresholds:');
  Object.entries(thresholdObj).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });

  return qualityCheck;
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                               ║');
  console.log('║                        RAGAS EVALUATION CLI                                   ║');
  console.log('║                     Powered by Gemini Flash 2.5                               ║');
  console.log('║                                                                               ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
  console.log('');

  const args = parseArgs();

  // Validate environment
  if (!process.env.GOOGLE_GENAI_API_KEY) {
    console.error('❌ Error: GOOGLE_GENAI_API_KEY environment variable not set');
    console.error('   Set it with: export GOOGLE_GENAI_API_KEY="your-api-key"');
    process.exit(1);
  }

  try {
    let result;
    const startTime = Date.now();

    // Determine evaluation mode
    if (args.file) {
      result = await evaluateMultiple(args);
    } else {
      result = await evaluateSingle(args);
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('');

    // Display results
    if ('individual_results' in result) {
      // Batch results
      displayBatchResults(result, args.verbose);
    } else {
      // Single result
      displaySingleResult(result, args.verbose);
    }

    // Check thresholds
    if (args.thresholds || !('individual_results' in result)) {
      checkThresholds(result, args.thresholds);
    }

    // Write output file if requested
    if (args.output) {
      writeResults(args.output, result);
    }

    console.log('\n' + '─'.repeat(80));
    console.log(`⏱️  Total evaluation time: ${duration}s`);
    console.log('─'.repeat(80));
    console.log('');

    // Exit with appropriate code based on thresholds
    if (args.thresholds) {
      const qualityCheck = checkThresholds(result, args.thresholds);
      process.exit(qualityCheck?.passes ? 0 : 1);
    }

  } catch (error) {
    console.error('\n❌ Evaluation failed:', error);
    if (args.verbose && error instanceof Error) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main };
