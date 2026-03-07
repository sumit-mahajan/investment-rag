import { CriteriaConfig } from "@/lib/types/analysis";

export const analysisCriteria: Record<string, CriteriaConfig> = {
  "financial-health": {
    id: "financial-health",
    name: "Financial Health",
    description: "Assess revenue growth, profit margins, cash flow, and overall financial stability",
    categories: ["financial-performance"],
    keyMetrics: [
      "revenue growth",
      "net income",
      "operating margin",
      "free cash flow",
      "current ratio",
      "debt-to-equity ratio",
    ],
    promptTemplate: `Analyze the financial health of the company based on the following information:

{context}

Focus on:
1. Revenue trends and growth rates
2. Profitability metrics (gross margin, operating margin, net margin)
3. Cash flow generation and sustainability
4. Balance sheet strength (liquidity, leverage)

Provide a score (0-1) and detailed findings with specific numbers and trends.`,
  },

  "risk-assessment": {
    id: "risk-assessment",
    name: "Risk Assessment",
    description: "Evaluate business risks, market risks, regulatory risks, and financial risks",
    categories: ["risk-factors", "legal-regulatory"],
    keyMetrics: [
      "debt levels",
      "liquidity",
      "market concentration",
      "regulatory exposure",
      "operational risks",
    ],
    promptTemplate: `Assess the risk profile of the company based on the following information:

{context}

Focus on:
1. Key risk factors disclosed by the company
2. Market and competitive risks
3. Regulatory and legal risks
4. Financial and operational risks
5. Risk mitigation strategies

Provide a score (0-1, where 1 = low risk) and detailed findings.`,
  },

  "growth-potential": {
    id: "growth-potential",
    name: "Growth Potential",
    description: "Evaluate growth opportunities, R&D investments, market expansion, and innovation",
    categories: ["strategy-outlook", "business-operations"],
    keyMetrics: [
      "R&D spending",
      "capital expenditure",
      "market expansion",
      "new products",
      "innovation",
    ],
    promptTemplate: `Evaluate the growth potential of the company based on the following information:

{context}

Focus on:
1. R&D investments and innovation pipeline
2. Market expansion and new product launches
3. Capital expenditure and growth investments
4. Total addressable market (TAM) opportunities
5. Strategic initiatives and partnerships

Provide a score (0-1) and detailed findings.`,
  },

  "competitive-position": {
    id: "competitive-position",
    name: "Competitive Position",
    description: "Analyze market share, competitive advantages, differentiation, and economic moats",
    categories: ["business-operations", "strategy-outlook"],
    keyMetrics: [
      "market share",
      "competitive advantages",
      "differentiation",
      "pricing power",
      "customer retention",
    ],
    promptTemplate: `Analyze the competitive position of the company based on the following information:

{context}

Focus on:
1. Market share and competitive landscape
2. Unique competitive advantages and moats
3. Product/service differentiation
4. Pricing power and brand strength
5. Barriers to entry

Provide a score (0-1) and detailed findings.`,
  },

  "management-quality": {
    id: "management-quality",
    name: "Management Quality",
    description: "Assess leadership effectiveness, governance, compensation, and strategic vision",
    categories: ["management-governance"],
    keyMetrics: [
      "leadership experience",
      "executive compensation",
      "board composition",
      "insider ownership",
      "succession planning",
    ],
    promptTemplate: `Assess the management quality and governance of the company based on the following information:

{context}

Focus on:
1. Leadership team experience and track record
2. Executive compensation alignment with performance
3. Board independence and composition
4. Insider ownership and alignment
5. Corporate governance practices

Provide a score (0-1) and detailed findings.`,
  },

  "regulatory-compliance": {
    id: "regulatory-compliance",
    name: "Regulatory Compliance",
    description: "Evaluate legal issues, regulatory compliance, and potential liabilities",
    categories: ["legal-regulatory", "risk-factors"],
    keyMetrics: [
      "legal proceedings",
      "regulatory compliance",
      "fines and penalties",
      "litigation risks",
    ],
    promptTemplate: `Evaluate the regulatory compliance and legal status of the company based on the following information:

{context}

Focus on:
1. Active legal proceedings and their potential impact
2. Regulatory compliance status
3. Past fines, penalties, or settlements
4. Ongoing regulatory investigations
5. Compliance programs and controls

Provide a score (0-1, where 1 = low risk) and detailed findings.`,
  },
};

export const defaultCriteriaIds = [
  "financial-health",
  "risk-assessment",
  "growth-potential",
  "competitive-position",
  "management-quality",
];
