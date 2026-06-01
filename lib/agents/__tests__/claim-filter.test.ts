import { describe, expect, it } from "vitest";
import {
  filterGroundedPoints,
  filterBullPoints,
  isPointGroundedInCorpus,
} from "../claim-filter";

describe("claim-filter", () => {
  const corpus =
    "Total revenue from operations INR 1,53,670 crore. Consolidated YoY growth 4.7%. Debt/Equity 0.0439.";

  it("keeps bullets whose numbers appear in corpus", () => {
    expect(
      isPointGroundedInCorpus(
        "Revenue reached INR 1,53,670 crore with 4.7% YoY growth.",
        corpus
      )
    ).toBe(true);
  });

  it("drops bullets with unsupported numbers", () => {
    expect(
      isPointGroundedInCorpus("Current ratio improved to 2.6 from 1.9.", corpus)
    ).toBe(false);
  });

  it("keeps qualitative bullets without numbers", () => {
    expect(
      isPointGroundedInCorpus("Regulatory scrutiny remains a material overhang.", corpus)
    ).toBe(true);
  });

  it("falls back to qualitative bullets when all numeric claims fail", () => {
    const result = filterGroundedPoints(
      [
        "Current ratio improved to 2.6 in 2024.",
        "Regulatory risks may pressure ad revenue.",
      ],
      corpus
    );
    expect(result).toEqual(["Regulatory risks may pressure ad revenue."]);
  });

  describe("bear/risk filterGroundedPoints — same number grounding applied", () => {
    it("keeps bear bullets whose numbers appear in passages", () => {
      const result = filterGroundedPoints(
        [
          "Revenue growth slowed to 4.7% YoY, well below peers.",
          "Operating margin contracted to 12% in the period.",
        ],
        corpus
      );
      expect(result).toContain("Revenue growth slowed to 4.7% YoY, well below peers.");
      expect(result).not.toContain(
        "Operating margin contracted to 12% in the period."
      );
    });

    it("uses first-bullet fallback when single ungrounded-number bullet and no qualitative option", () => {
      // filterGroundedPoints preserves at least 1 bullet to prevent empty sections.
      // With a single ungrounded bullet and no qualitative alternative the fallback kicks in.
      const result = filterGroundedPoints(
        ["Regulatory fines could reach $500M in 2025."],
        corpus
      );
      expect(result).toHaveLength(1);
    });

    it("falls back to qualitative risk bullet when all numeric risks are ungrounded", () => {
      const result = filterGroundedPoints(
        [
          "Fines could reach $500M.",
          "Geopolitical headwinds could impair global growth.",
        ],
        corpus
      );
      expect(result).toEqual(["Geopolitical headwinds could impair global growth."]);
    });
  });

  describe("filterBullPoints — metric-first, qualitative fallback", () => {
    const metricValues = ["INR 1,53,670 crore", "4.7%"];

    it("passes bull bullet grounded in metric values", () => {
      const result = filterBullPoints(
        ["Revenue of INR 1,53,670 crore demonstrates scale."],
        metricValues,
        corpus
      );
      expect(result).toHaveLength(1);
    });

    it("falls back to qualitative-only when no bullet grounds in metric values", () => {
      const result = filterBullPoints(
        [
          "EBITDA margin improved to 28%.",
          "Debt-free balance sheet supports reinvestment.",
        ],
        metricValues,
        corpus
      );
      expect(result).toEqual(["Debt-free balance sheet supports reinvestment."]);
    });
  });
});
