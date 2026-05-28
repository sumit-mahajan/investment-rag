import { describe, it, expect } from "vitest";
import {
  buildMetricDisplayLine,
  normalizeMetricValue,
  validateMetricAgainstContext,
} from "../metric-utils";

describe("metric-utils", () => {
  it("normalizes null-like strings", () => {
    expect(normalizeMetricValue("null")).toBeNull();
    expect(normalizeMetricValue("N/A")).toBeNull();
  });

  it("builds display line from structured fields", () => {
    const line = buildMetricDisplayLine({
      currency: "INR",
      unitFromTable: "in crore",
      figure: "153,670",
      yoyChange: "+4.7% YoY",
      displayLine: null,
    });
    expect(line).toContain("INR");
    expect(line).toContain("153,670");
    expect(line).toContain("crore");
  });

  it("rejects USD billions when context is INR/crore", () => {
    const context = "Revenue from software services 145,285 crore Year ended March 31";
    const result = validateMetricAgainstContext(
      "$153.7 billion total revenue (+4.7% YoY)",
      context,
      "Revenue and YoY growth"
    );
    expect(result).toBeNull();
  });

  it("allows INR display for INR context", () => {
    const context = "Year ended March 31, 2024 in crore INR";
    const result = validateMetricAgainstContext(
      "INR 153,670 crore total revenue (+4.7% YoY)",
      context,
      "Revenue and YoY growth"
    );
    expect(result).toContain("INR");
  });

  it("rejects FCF that copies net income", () => {
    const result = validateMetricAgainstContext(
      "INR 26,248 million net income",
      "cash flow from operations",
      "Free Cash Flow"
    );
    expect(result).toBeNull();
  });

  it("allows USD billions for US 10-K millions context", () => {
    const context = "Revenue $ 134,902 (in millions, except per share) Year ended December 31";
    const result = validateMetricAgainstContext(
      "USD 134.9 billion revenue (+15.7% YoY)",
      context,
      "Revenue and YoY growth"
    );
    expect(result).toContain("USD");
  });
});
