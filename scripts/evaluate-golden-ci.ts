#!/usr/bin/env node
/**
 * Golden-set RAGAS CI runner (SDE2 playbook Phase 1).
 *
 * - Loads committed fixtures (no LangSmith, no live RAG)
 * - Full RAGAS + segmented faithfulness (metrics vs narrative)
 * - Fails with exit 1 if regression gates in golden-config are breached
 *
 * Usage:
 *   pnpm evaluate:golden
 *   pnpm evaluate:golden -- --report-only   # skip threshold gate (baseline capture)
 */
import "dotenv/config";

import * as fs from "fs";
import {
  evaluateBatch,
  evaluateFaithfulness,
  meetsQualityThresholds,
} from "@/lib/evaluation";
import {
  GOLDEN_DATASET_PATH,
  GOLDEN_REPORT_PATH,
  GOLDEN_THRESHOLDS,
  overallScore,
  type GoldenTestCase,
} from "@/lib/evaluation/golden-config";

function loadGoldenCases(): GoldenTestCase[] {
  const raw = fs.readFileSync(GOLDEN_DATASET_PATH, "utf-8");
  const data = JSON.parse(raw) as GoldenTestCase[];
  for (const tc of data) {
    if (!tc.id || !tc.question || !tc.answer || !Array.isArray(tc.contexts)) {
      throw new Error(`Invalid golden case: ${tc.id ?? "unknown"}`);
    }
  }
  return data;
}

async function main() {
  const reportOnly = process.argv.includes("--report-only");

  if (!process.env.GOOGLE_API_KEY && !process.env.GOOGLE_GENAI_API_KEY) {
    console.error("❌ GOOGLE_API_KEY or GOOGLE_GENAI_API_KEY required for RAGAS judge");
    process.exit(1);
  }

  const cases = loadGoldenCases();
  console.log(`\nGolden RAGAS CI — ${cases.length} cases from ${GOLDEN_DATASET_PATH}\n`);

  const start = Date.now();
  const batch = await evaluateBatch(
    cases.map(({ question, answer, contexts, ground_truth }) => ({
      question,
      answer,
      contexts,
      ground_truth,
    })),
    { parallel: false, batchSize: 1 }
  );

  const segmented: Array<{
    id: string;
    label: string;
    metrics_faithfulness: number | null;
    narrative_faithfulness: number | null;
  }> = [];

  for (let i = 0; i < cases.length; i++) {
    const tc = cases[i];
    let metricsF: number | null = null;
    let narrativeF: number | null = null;

    if (tc.sections?.metrics) {
      const r = await evaluateFaithfulness(tc.sections.metrics, tc.contexts);
      metricsF = r.score;
    }
    if (tc.sections?.narrative) {
      const r = await evaluateFaithfulness(tc.sections.narrative, tc.contexts);
      narrativeF = r.score;
    }

    segmented.push({
      id: tc.id,
      label: tc.label,
      metrics_faithfulness: metricsF,
      narrative_faithfulness: narrativeF,
    });
  }

  const agg = batch.aggregate_metrics;
  const overall = overallScore(agg);
  const avgMetricsF =
    segmented.filter((s) => s.metrics_faithfulness != null).reduce((s, x) => s + x.metrics_faithfulness!, 0) /
    Math.max(1, segmented.filter((s) => s.metrics_faithfulness != null).length);
  const avgNarrativeF =
    segmented.filter((s) => s.narrative_faithfulness != null).reduce((s, x) => s + x.narrative_faithfulness!, 0) /
    Math.max(1, segmented.filter((s) => s.narrative_faithfulness != null).length);

  console.log("\n" + batch.summary);
  console.log("\n--- Segmented faithfulness (playbook Phase 1) ---");
  console.log(`Metrics narrative avg:   ${(avgMetricsF * 100).toFixed(2)}%`);
  console.log(`Bull/bear/risks avg:     ${(avgNarrativeF * 100).toFixed(2)}%`);
  console.log(`Overall RAG quality:     ${(overall * 100).toFixed(2)}%`);

  console.log("\n--- Per case ---");
  batch.individual_results.forEach((r, i) => {
    const seg = segmented[i];
    const caseOverall = overallScore(r);
    console.log(
      `${cases[i].label}: overall ${(caseOverall * 100).toFixed(1)}% | F ${(r.faithfulness * 100).toFixed(0)}% R ${(r.answer_relevancy * 100).toFixed(0)}% CP ${(r.context_precision * 100).toFixed(0)}% | metrics-F ${seg.metrics_faithfulness != null ? (seg.metrics_faithfulness * 100).toFixed(0) + "%" : "n/a"} narrative-F ${seg.narrative_faithfulness != null ? (seg.narrative_faithfulness * 100).toFixed(0) + "%" : "n/a"}`
    );
  });

  const report = {
    timestamp: new Date().toISOString(),
    duration_seconds: ((Date.now() - start) / 1000).toFixed(1),
    case_count: cases.length,
    aggregate: {
      faithfulness: agg.faithfulness,
      answer_relevancy: agg.answer_relevancy,
      context_precision: agg.context_precision,
      context_recall: agg.context_recall,
      answer_semantic_similarity: agg.answer_semantic_similarity,
      answer_correctness: agg.answer_correctness,
      overall,
      segmented_metrics_faithfulness: avgMetricsF,
      segmented_narrative_faithfulness: avgNarrativeF,
    },
    thresholds: GOLDEN_THRESHOLDS,
    cases: cases.map((tc, i) => ({
      id: tc.id,
      label: tc.label,
      metrics: batch.individual_results[i],
      segmented: segmented[i],
    })),
  };

  fs.writeFileSync(GOLDEN_REPORT_PATH, JSON.stringify(report, null, 2));
  console.log(`\nReport written: ${GOLDEN_REPORT_PATH}`);

  if (reportOnly) {
    console.log("\n--report-only: skipping threshold gate");
    return;
  }

  const gate = meetsQualityThresholds(
    {
      ...agg,
      evaluation_details: {},
      timestamp: "",
      model_used: "",
    },
    {
      faithfulness: GOLDEN_THRESHOLDS.faithfulness,
      answer_relevancy: GOLDEN_THRESHOLDS.answer_relevancy,
      context_precision: GOLDEN_THRESHOLDS.context_precision,
    }
  );

  const segmentedFails: string[] = [];
  if (avgMetricsF < GOLDEN_THRESHOLDS.metrics_faithfulness) {
    segmentedFails.push(
      `metrics faithfulness ${avgMetricsF.toFixed(2)} < ${GOLDEN_THRESHOLDS.metrics_faithfulness}`
    );
  }
  if (avgNarrativeF < GOLDEN_THRESHOLDS.narrative_faithfulness) {
    segmentedFails.push(
      `narrative faithfulness ${avgNarrativeF.toFixed(2)} < ${GOLDEN_THRESHOLDS.narrative_faithfulness}`
    );
  }
  if (overall < GOLDEN_THRESHOLDS.overall) {
    segmentedFails.push(`overall ${overall.toFixed(2)} < ${GOLDEN_THRESHOLDS.overall}`);
  }

  console.log("\n--- CI regression gates ---");
  console.log(`Faithfulness:     >= ${(GOLDEN_THRESHOLDS.faithfulness * 100).toFixed(0)}%`);
  console.log(`Answer relevancy: >= ${(GOLDEN_THRESHOLDS.answer_relevancy * 100).toFixed(0)}%`);
  console.log(`Context precision:>= ${(GOLDEN_THRESHOLDS.context_precision * 100).toFixed(0)}%`);
  console.log(`Overall:          >= ${(GOLDEN_THRESHOLDS.overall * 100).toFixed(0)}%`);
  console.log(`Metrics F:        >= ${(GOLDEN_THRESHOLDS.metrics_faithfulness * 100).toFixed(0)}%`);
  console.log(`Narrative F:      >= ${(GOLDEN_THRESHOLDS.narrative_faithfulness * 100).toFixed(0)}%`);

  const allFails = [...gate.failing_metrics, ...segmentedFails];
  if (allFails.length > 0) {
    console.error("\n❌ Golden CI FAILED:");
    allFails.forEach((f) => console.error(`  - ${f}`));
    process.exit(1);
  }

  console.log("\n✅ Golden CI PASSED — all regression gates met");
}

main().catch((err) => {
  console.error("\n❌ Golden CI error:", err);
  process.exit(1);
});
