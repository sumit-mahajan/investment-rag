/** Normalize LLM outputs like "null" / "N/A" to actual null */
export function normalizeMetricValue(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  if (
    lower === "null" ||
    lower === "n/a" ||
    lower === "na" ||
    lower === "not found" ||
    lower === "not available" ||
    lower === "none"
  ) {
    return null;
  }
  return trimmed;
}

const INR_CONTEXT =
  /\b(INR|₹|rupee|rupees|crore|crores|lakh|lakhs|March 31|BSE|NSE|Infosys)\b/i;
const USD_CONTEXT =
  /\b(USD|\$|U\.S\.|SEC|10-K|Form 10-K|NYSE:|NASDAQ:)\b|\(in millions, except per share/i;
const CRORE_CONTEXT = /\b(crore|crores)\b/i;
const MILLIONS_HEADER = /\(in millions|in million|amounts in millions/i;

export type MetricExtractionFields = {
  currency: "USD" | "INR" | "EUR" | "GBP" | "OTHER" | null;
  unitFromTable: string | null;
  figure: string | null;
  yoyChange: string | null;
  displayLine: string | null;
};

/** Build a single display line from structured extraction fields */
export function buildMetricDisplayLine(fields: MetricExtractionFields): string | null {
  const line = normalizeMetricValue(fields.displayLine);
  if (line) return line;

  const figure = fields.figure?.trim();
  if (!figure) return null;

  const currency = fields.currency ?? "OTHER";
  const unit = fields.unitFromTable?.trim();
  const yoy = fields.yoyChange?.trim();

  const currencyLabel =
    currency === "USD"
      ? "USD"
      : currency === "INR"
        ? "INR"
        : currency === "EUR"
          ? "EUR"
          : currency === "GBP"
            ? "GBP"
            : "";

  let out = currencyLabel ? `${currencyLabel} ` : "";
  out += figure;
  if (unit) out += ` (${unit})`;
  if (yoy) out += `; ${yoy}`;

  return out.trim() || null;
}

/**
 * Reject answers that use USD/$ billions when passages are clearly INR/crore,
 * or that state impossible ratios (e.g. debt/equity 0.0 without evidence).
 */
export function validateMetricAgainstContext(
  value: string,
  context: string,
  metricLabel: string
): string | null {
  const normalized = normalizeMetricValue(value);
  if (!normalized) return null;

  const hasInr = INR_CONTEXT.test(context) || CRORE_CONTEXT.test(context);
  const hasUsd = USD_CONTEXT.test(context);
  const usesUsdBillions = /\$\s*[\d,.]+\s*billion/i.test(normalized);
  const usesInr = /\b(INR|₹|crore|lakh)\b/i.test(normalized);

  if (hasInr && !hasUsd && usesUsdBillions && !usesInr) {
    console.warn(
      `[metric] Rejected USD billion label for INR/crore context: ${metricLabel} → ${normalized}`
    );
    return null;
  }

  if (metricLabel.includes("Debt/Equity")) {
    if (/\b0\.0\b|\b0\s*debt|\bzero\s+debt/i.test(normalized)) {
      console.warn(`[metric] Rejected suspicious debt/equity 0.0: ${normalized}`);
      return null;
    }
  }

  if (metricLabel.includes("Free Cash Flow") && /net income/i.test(normalized)) {
    console.warn(`[metric] Rejected FCF answer that cites net income: ${normalized}`);
    return null;
  }

  if (MILLIONS_HEADER.test(context) && usesUsdBillions) {
    const rawNum = normalized.match(/\$?\s*([\d,.]+)\s*billion/i)?.[1];
    if (rawNum) {
      const n = parseFloat(rawNum.replace(/,/g, ""));
      if (n > 500 && !/\(in millions/i.test(normalized)) {
        console.warn(
          `[metric] Possible millions-scaled number labeled as billions: ${metricLabel}`
        );
      }
    }
  }

  return normalized;
}
