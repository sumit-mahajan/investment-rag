# RAG Evaluation with RAGAS

Production-grade RAG evaluation using Gemini Flash 2.5 and RAGAS metrics.

## Quick Start

```bash
# Set API key
export GOOGLE_GENAI_API_KEY="your-gemini-api-key"

# Run examples
npm run evaluate:example

# Evaluate test cases
npm run evaluate:single   # Single test
npm run evaluate:batch    # Batch with stats
```

## Usage

### In Code

```typescript
import { evaluateRAGAS } from "@/lib/evaluation";

const result = await evaluateRAGAS({
  question: "What was Apple's Q1 2024 revenue?",
  answer: "Apple reported revenue of $119.6B in Q1 2024",
  contexts: ["Apple Inc. posted quarterly revenue of $119.6B..."],
  ground_truth: "Apple's Q1 2024 revenue was $119.6B", // optional
});

console.log(`Faithfulness: ${result.faithfulness}`);
console.log(`Relevancy: ${result.answer_relevancy}`);
console.log(`Correctness: ${result.answer_correctness}`);

// Check quality thresholds
const { passes, failing_metrics } = meetsQualityThresholds(result, {
  faithfulness: 0.8,
  answer_relevancy: 0.7,
});
```

### Batch Evaluation

```typescript
import { evaluateBatch } from '@/lib/evaluation';

const results = await evaluateBatch([
  { question: "...", answer: "...", contexts: [...] },
  { question: "...", answer: "...", contexts: [...] }
], {
  parallel: true,
  batchSize: 5
});

console.log(results.summary);
// Shows: avg scores, std dev, per-metric breakdowns
```

### CLI Usage

```bash
# Single evaluation
npx tsx scripts/evaluate-rag.ts \
  --question "What is Apple's revenue?" \
  --answer "Apple's revenue is $394.3B" \
  --contexts "Apple Inc. reported..."

# Batch from file
npx tsx scripts/evaluate-rag.ts \
  --file test-cases.json \
  --parallel \
  --output results.json

# With quality gates (exits 1 if fails)
npx tsx scripts/evaluate-rag.ts \
  --file test-cases.json \
  --thresholds '{"faithfulness":0.9}'
```

Test case JSON format:

```json
{
  "question": "What was Apple's Q1 revenue?",
  "answer": "Apple reported $119.6B",
  "contexts": ["Apple Inc. posted revenue of $119.6B..."],
  "ground_truth": "Apple's Q1 revenue was $119.6B"
}
```

## Metrics

All scores are 0-1 (higher is better):

| Metric                  | Measures                                                  | Needs Ground Truth? |
| ----------------------- | --------------------------------------------------------- | ------------------- |
| **Faithfulness**        | Are claims supported by context? (detects hallucinations) | No                  |
| **Answer Relevancy**    | Does answer address the question?                         | No                  |
| **Context Precision**   | Is retrieved context relevant?                            | No                  |
| **Context Recall**      | Does context contain all needed info?                     | Yes                 |
| **Semantic Similarity** | Semantic match to ground truth?                           | Yes                 |
| **Answer Correctness**  | Overall factual correctness (F1-based)?                   | Yes                 |

### Recommended Thresholds

```typescript
// High-stakes (financial, legal, medical)
{ faithfulness: 0.9, answer_relevancy: 0.85, context_precision: 0.8 }

// Standard Q&A
{ faithfulness: 0.8, answer_relevancy: 0.7, context_precision: 0.7 }

// Exploratory
{ faithfulness: 0.7, answer_relevancy: 0.6, context_precision: 0.6 }
```

## Integration Patterns

### 1. Development Testing

```typescript
test("RAG quality check", async () => {
  const result = await evaluateRAGAS({
    question: testQuestion,
    answer: generatedAnswer,
    contexts: retrievedContexts,
    ground_truth: expectedAnswer,
  });

  const check = meetsQualityThresholds(result);
  expect(check.passes).toBe(true);
});
```

### 2. CI/CD Pipeline

```yaml
# .github/workflows/rag-quality.yml
- name: Evaluate RAG
  env:
    GOOGLE_GENAI_API_KEY: ${{ secrets.GOOGLE_GENAI_API_KEY }}
  run: |
    npx tsx scripts/evaluate-rag.ts \
      --file test-cases.json \
      --thresholds '{"faithfulness":0.8}' \
      || exit 1
```

### 3. Production Monitoring

```typescript
// Sample 1% of production traffic
if (Math.random() < 0.01) {
  evaluateRAGAS({ question, answer, contexts })
    .then((metrics) => logToDatabase(metrics))
    .catch(console.error);
}
```

### 4. A/B Testing

```typescript
const configA = await evaluateBatch(testCasesWithConfigA);
const configB = await evaluateBatch(testCasesWithConfigB);

console.log("Config A Quality:", configA.aggregate_metrics.faithfulness);
console.log("Config B Quality:", configB.aggregate_metrics.faithfulness);
```

## Implementation Details

### Architecture

```
lib/evaluation/
├── ragas-evaluator.ts    # Main implementation (724 lines)
│   ├── evaluateRAGAS()          # Full evaluation
│   ├── evaluateBatch()          # Batch with stats
│   ├── evaluateFaithfulness()   # Individual metrics
│   └── meetsQualityThresholds() # Quality gates
├── index.ts              # Exports
└── rag-metrics.ts        # Old evaluator (legacy)

lib/types/evaluation.ts   # TypeScript types

scripts/
├── evaluate-rag.ts            # CLI tool
├── evaluate-rag-example.ts    # Examples
└── test-cases/
    ├── single-test-case.json
    └── batch-test-cases.json
```

### How It Works

Each metric uses Gemini Flash 2.5 with structured outputs (Zod schemas):

**Faithfulness**

1. LLM extracts atomic statements from answer
2. Checks each statement against context
3. Score = supported_statements / total_statements

**Answer Relevancy**

- LLM rates how well answer addresses question (0-1 scale)
- Penalizes irrelevant information

**Context Precision**

- LLM rates relevance of each retrieved context chunk
- Uses weighted scoring (earlier contexts weighted more)

**Context Recall** (requires ground truth)

1. Extracts statements from ground truth
2. Checks if each found in retrieved contexts
3. Score = attributed_statements / total_statements

**Semantic Similarity** (requires ground truth)

- LLM compares semantic meaning (not exact words)

**Answer Correctness** (requires ground truth)

- Calculates TP, FP, FN
- Combines F1 score + semantic similarity

### Key Design Decisions

1. **Gemini Flash 2.5** - 50% cheaper and faster than GPT-4o-mini
2. **Structured outputs** - Uses Zod schemas for reliable parsing
3. **Detailed breakdowns** - Returns reasoning for every score
4. **Batch support** - Rate limiting and parallel processing
5. **No RAGAS library** - Native TypeScript implementation for control

### Error Handling

- Retries (3 attempts) for API failures
- Rate limit detection and backoff
- Graceful degradation (returns 0 on error)
- Detailed error logging

## API Reference

```typescript
// Main function
evaluateRAGAS(input: EvaluationInput): Promise<DetailedEvaluation>

// Batch evaluation
evaluateBatch(
  testCases: EvaluationInput[],
  options?: { parallel?: boolean; batchSize?: number }
): Promise<BatchEvaluationResult>

// Quality check
meetsQualityThresholds(
  evaluation: DetailedEvaluation,
  thresholds?: Partial<RAGASMetrics>
): QualityCheckResult

// Individual metrics
evaluateFaithfulness(answer: string, contexts: string[]): Promise<MetricResult>
evaluateAnswerRelevancy(question: string, answer: string): Promise<MetricResult>
evaluateContextPrecision(question: string, contexts: string[]): Promise<MetricResult>
evaluateContextRecall(contexts: string[], ground_truth: string): Promise<MetricResult>
evaluateSemanticSimilarity(answer: string, ground_truth: string): Promise<MetricResult>
evaluateCorrectness(answer: string, ground_truth: string): Promise<MetricResult>
```

### Types

```typescript
interface EvaluationInput {
  question: string;
  answer: string;
  contexts: string[];
  ground_truth?: string;
}

interface DetailedEvaluation {
  faithfulness: number;
  answer_relevancy: number;
  context_precision: number;
  context_recall: number;
  answer_semantic_similarity: number;
  answer_correctness: number;
  evaluation_details: {
    faithfulness_details?: { statements; verdicts; reasoning };
    relevancy_details?: { reasoning };
    precision_details?: { relevance_scores; reasoning };
    // ... more
  };
  timestamp: string;
  model_used: string;
}
```

## Cost & Performance

**Gemini Flash 2.5 Pricing:**

- Input: $0.10 / 1M tokens
- Output: $0.40 / 1M tokens

**Typical Costs:**

- Single evaluation: ~$0.0005 (~500-1000 tokens)
- 100 test cases: ~$0.05
- 1000 test cases: ~$0.50

**Speed (100 test cases):**

- Sequential: ~150 seconds
- Parallel (batch=5): ~45 seconds

**vs. Old Evaluator (GPT-4o-mini):**

- 50% cheaper
- 3x faster (parallel)
- 2 more metrics (6 vs 4)
- Full context recall implementation

## Troubleshooting

**API key not set:**

```bash
export GOOGLE_GENAI_API_KEY="your-key"
```

**Rate limit errors:**

```typescript
// Reduce batch size
await evaluateBatch(cases, { batchSize: 2 });
```

**Timeout errors:**

```typescript
// Process sequentially
await evaluateBatch(cases, { parallel: false });
```

## Examples

See `scripts/evaluate-rag-example.ts` for comprehensive examples:

- Single evaluation with all metrics
- Evaluation without ground truth
- Batch evaluation with statistics
- Poor quality detection

Run: `npm run evaluate:example`

## Files

- `lib/evaluation/ragas-evaluator.ts` - Main implementation
- `lib/types/evaluation.ts` - TypeScript types
- `scripts/evaluate-rag.ts` - CLI tool
- `scripts/evaluate-rag-example.ts` - Examples
- `scripts/test-cases/` - Sample test cases

## References

- [RAGAS Paper](https://arxiv.org/abs/2309.15217)
- [RAGAS Docs](https://docs.ragas.io/)
- [Gemini API](https://ai.google.dev/docs)
