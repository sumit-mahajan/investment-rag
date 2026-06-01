import { describe, expect, it } from "vitest";
import { filterGroundedPoints, isPointGroundedInCorpus } from "../claim-filter";

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
});
