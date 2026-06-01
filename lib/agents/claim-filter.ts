const MIN_DIGITS = 2;

function normalizeForMatch(text: string): string {
  return text.replace(/,/g, "").replace(/[%$₹]/g, "").toLowerCase();
}

/** Numbers with at least MIN_DIGITS digits (ignores single-digit list markers). */
export function extractSignificantNumbers(text: string): string[] {
  const matches = text.match(/\d[\d,]*\.?\d*/g) ?? [];
  return matches.filter((m) => m.replace(/\D/g, "").length >= MIN_DIGITS);
}

function numberVariants(n: string): string[] {
  const base = normalizeForMatch(n);
  const noDecimal = base.replace(/\./g, "");
  return base === noDecimal ? [base] : [base, noDecimal];
}

function corpusContainsNumber(corpusNorm: string, n: string): boolean {
  return numberVariants(n).some(
    (v) => v.replace(/\D/g, "").length >= MIN_DIGITS && corpusNorm.includes(v)
  );
}

export function isPointGroundedInCorpus(point: string, corpus: string): boolean {
  const trimmed = point.trim();
  if (!trimmed) return false;

  const numbers = extractSignificantNumbers(trimmed);
  if (numbers.length === 0) return true;

  const corpusNorm = normalizeForMatch(corpus);
  return numbers.every((n) => corpusContainsNumber(corpusNorm, n));
}

function pointsWithoutNumbers(points: string[]): string[] {
  return points.filter((p) => extractSignificantNumbers(p).length === 0);
}

/**
 * Drops bull/bear/risk bullets whose numeric claims are absent from retrieval corpus.
 * Falls back to qualitative (number-free) bullets if a section would become empty.
 */
export function filterGroundedPoints(points: string[], corpus: string): string[] {
  if (!corpus.trim()) return points;

  const grounded = points.filter((p) => isPointGroundedInCorpus(p, corpus));
  if (grounded.length > 0) return grounded;

  const qualitative = pointsWithoutNumbers(points);
  return qualitative.length > 0 ? qualitative : points.slice(0, 1);
}

/** Bull case: numeric claims must match extracted metric values; allow qualitative fallbacks. */
export function filterBullPoints(
  points: string[],
  metricValues: string[],
  fullCorpus: string
): string[] {
  const metricCorpus = metricValues.filter(Boolean).join("\n");
  if (metricCorpus.trim()) {
    const fromMetrics = filterGroundedPoints(points, metricCorpus);
    if (fromMetrics.length > 0) return fromMetrics;
  }
  return filterGroundedPoints(points, fullCorpus).filter(
    (p) => extractSignificantNumbers(p).length === 0
  );
}
