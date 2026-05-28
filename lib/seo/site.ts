const fallbackUrl = "https://investment-rag.vercel.app";

export const siteUrl = process.env.NEXT_PUBLIC_APP_URL || fallbackUrl;

export const siteName = "Investment RAG";

export const siteTitle = `${siteName} — Structured investment analysis from filings`;

export const siteDescription =
  "Upload SEC filings and annual reports. Get bull/bear cases, key metrics, investment score, and page citations—then ask follow-up questions grounded in your documents.";

export const siteTagline =
  "Upload filings. Get a scored investment report with cited evidence.";

export const siteKeywords = [
  "SEC 10-K analysis",
  "annual report RAG",
  "investment research AI",
  "financial PDF analysis",
  "bull bear case generator",
  "cited financial analysis",
  "LlamaParse Pinecone",
  "multi document investment analysis",
] as const;
