import path from "path";
import type { EvaluationInput } from "@/lib/types/evaluation";

/** Golden case shape — mirrors product output + optional segmented eval (SDE2 playbook Phase 1). */
export interface GoldenTestCase extends EvaluationInput {
  id: string;
  label: string;
  /** Sub-answers for segmented faithfulness (metrics vs narrative). */
  sections?: {
    metrics?: string;
    narrative?: string;
  };
}

export const GOLDEN_DATASET_PATH = path.join(
  process.cwd(),
  "scripts/test-cases/golden/investment-golden.json"
);

export const GOLDEN_REPORT_PATH = path.join(
  process.cwd(),
  "scripts/test-cases/golden/last-run.json"
);

/**
 * Regression gates — calibrated from golden baseline (see last-run.json).
 * Re-run `pnpm evaluate:golden:baseline` after intentional prompt changes.
 */
export const GOLDEN_THRESHOLDS = {
  faithfulness: 0.9,
  answer_relevancy: 0.48,
  context_precision: 0.85,
  /** (faithfulness + answer_relevancy + context_precision) / 3 */
  overall: 0.75,
  /** Segmented faithfulness floors (playbook: metrics should score higher than narrative). */
  metrics_faithfulness: 0.9,
  narrative_faithfulness: 0.65,
} as const;

export type GoldenThresholds = typeof GOLDEN_THRESHOLDS;

export function overallScore(metrics: {
  faithfulness: number;
  answer_relevancy: number;
  context_precision: number;
}): number {
  return (metrics.faithfulness + metrics.answer_relevancy + metrics.context_precision) / 3;
}
