/**
 * Investment philosophy definitions for value and growth analysis.
 * These are always analyzed in addition to user-selected criteria.
 */

export type PhilosophyId = "value-investing" | "growth-investing";

export interface PhilosophyConfig {
  id: PhilosophyId;
  name: string;
  description: string;
  keyMetrics: string[];
  promptTemplate: string;
}

export const investmentPhilosophies: Record<PhilosophyId, PhilosophyConfig> = {
  "value-investing": {
    id: "value-investing",
    name: "Value Investing",
    description: "Assess whether the company fits value investing: intrinsic value, margin of safety, and undervaluation",
    keyMetrics: [
      "P/E ratio",
      "P/B ratio",
      "price-to-free-cash-flow",
      "dividend yield",
      "debt-to-equity",
      "free cash flow",
      "earnings yield",
      "book value",
    ],
    promptTemplate: `Analyze the company from a VALUE INVESTING perspective based on the following document excerpts.

{context}

VALUE INVESTING focuses on: intrinsic value, margin of safety, undervaluation. Key metrics to look for:
- P/E ratio, P/B ratio, price-to-free-cash-flow
- Dividend yield, earnings yield
- Debt-to-equity, free cash flow, book value

Extract any metrics found in the text (with values if mentioned). Provide a verdict and confidence based on data availability.`,
  },
  "growth-investing": {
    id: "growth-investing",
    name: "Growth Investing",
    description: "Assess whether the company fits growth investing: revenue/earnings growth, market expansion, innovation",
    keyMetrics: [
      "revenue growth",
      "earnings growth",
      "market expansion",
      "R&D spending",
      "innovation pipeline",
      "new products",
      "TAM/SAM",
      "capital expenditure for growth",
    ],
    promptTemplate: `Analyze the company from a GROWTH INVESTING perspective based on the following document excerpts.

{context}

GROWTH INVESTING focuses on: revenue/earnings growth, market expansion, innovation. Key metrics to look for:
- Revenue growth, earnings growth rates
- R&D spending, innovation pipeline, new products
- Market expansion, TAM/SAM, capital expenditure for growth

Extract any metrics found in the text (with values if mentioned). Provide a verdict and confidence based on data availability.`,
  },
};

export const philosophyIds: PhilosophyId[] = ["value-investing", "growth-investing"];
