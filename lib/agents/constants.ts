/** Used when the user runs analysis without a custom focus question */
export const DEFAULT_ANALYSIS_QUESTION =
  "Provide a structured investment analysis of the uploaded financial documents: bull case, bear case, key financial metrics, and material risks.";

export const SYNTHESIS_POINT_LIMITS = {
  bullCase: 5,
  bearCase: 5,
  keyRisks: 6,
} as const;
