/**
 * Category-based metadata extractor for financial document chunks.
 * Assigns content categories using keyword pattern matching.
 */

const CATEGORY_PATTERNS: Record<string, RegExp[]> = {
  "financial-performance": [
    /\b(revenue|sales|profit|margin|earnings|income|ebitda|cash\s*flow)\b/i,
    /\b(assets|liabilities|equity|balance\s*sheet|financial\s*(statement|position))\b/i,
    /\b(gross|operating|net)\s*(income|profit|margin)\b/i,
    /\b(fiscal\s*year|quarterly|annual)\s*(result|performance|report)\b/i,
    /\b(expense|cost|depreciation|amortization)\b/i,
  ],
  "risk-factors": [
    /\b(risk|uncertainty|challenge|threat|adverse|volatility|exposure)\b/i,
    /\b(could\s+adversely|material\s+impact|no\s+assurance|may\s+not)\b/i,
    /\b(fluctuat|unpredictab|vulnerab|susceptib)\b/i,
    /\b(cybersecurity|security\s*breach|data\s*protection)\b/i,
  ],
  "business-operations": [
    /\b(product|service|operation|segment|business\s*model|customer)\b/i,
    /\b(market\s*share|competitive|industry|sector)\b/i,
    /\b(supply\s*chain|manufacturing|distribution|logistics)\b/i,
    /\b(employee|workforce|personnel|headcount)\b/i,
  ],
  "management-governance": [
    /\b(director|executive|officer|board|ceo|cfo|chairman|president)\b/i,
    /\b(compensation|governance|leadership|management\s*team)\b/i,
    /\b(audit\s*committee|nomination|independent\s*director)\b/i,
    /\b(corporate\s*governance|fiduciary|shareholder\s*rights)\b/i,
  ],
  "legal-regulatory": [
    /\b(legal|regulatory|compliance|lawsuit|litigation|proceeding)\b/i,
    /\b(sec|sebi|fca|regulation|law|statute|ordinance)\b/i,
    /\b(patent|trademark|intellectual\s*property|copyright)\b/i,
    /\b(antitrust|competition\s*law|privacy\s*law|gdpr)\b/i,
  ],
  "strategy-outlook": [
    /\b(strategy|outlook|future|plan|initiative|expansion)\b/i,
    /\b(growth\s*opportunit|forward.looking|guidance|forecast)\b/i,
    /\b(acquisition|merger|partnership|joint\s*venture|investment)\b/i,
    /\b(innovation|research\s*and\s*development|r&d|technology)\b/i,
  ],
};

export interface ExtractedMetadata {
  categories: string[];
  contentType: string;
}

export function extractMetadata(text: string): ExtractedMetadata {
  return {
    categories: assignCategories(text),
    contentType: detectContentType(text),
  };
}

function assignCategories(text: string): string[] {
  const categories: string[] = [];

  for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
    if (patterns.some((p) => p.test(text))) {
      categories.push(category);
    }
  }

  return categories.length > 0 ? categories : ["general"];
}

function detectContentType(text: string): string {
  const lines = text.split("\n");

  // Check for table-like content (multiple columns, aligned numbers)
  const tabLines = lines.filter(
    (l) => l.includes("\t") || (l.match(/\s{3,}/g) || []).length >= 2
  );
  if (tabLines.length > lines.length * 0.3) {
    return "table";
  }

  // Check for financial data (lots of currency/percentages)
  const financialMatches = text.match(/\$[\d,]+|\d+%|\d+\.\d+/g) || [];
  if (financialMatches.length > 5) {
    return "financial-data";
  }

  return "text";
}
