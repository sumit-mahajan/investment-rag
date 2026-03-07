import type { Document, Analysis, DocumentListItem } from "@/lib/types";

/**
 * Create a mock document for testing
 */
export function createMockDocument(overrides?: Partial<Document>): Document {
  return {
    id: "doc-123",
    userId: "user-123",
    filename: "test-document.pdf",
    originalName: "Test Document.pdf",
    fileUrl: "https://blob.vercel-storage.com/test.pdf",
    fileSize: 1024000,
    mimeType: "application/pdf",
    status: "completed",
    companyName: "Test Company",
    tickerSymbol: "TEST",
    cik: "0001234567",
    filingType: "10-K",
    filingDate: new Date("2024-01-15"),
    fiscalYear: 2023,
    fiscalPeriod: "FY",
    sourceUrl: "https://example.com/filing",
    processingError: null,
    totalChunks: 50,
    isImageBased: false,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  };
}

/**
 * Create a mock document list item for testing
 */
export function createMockDocumentListItem(
  overrides?: Partial<DocumentListItem>
): DocumentListItem {
  return {
    id: "doc-123",
    originalName: "Test Document.pdf",
    companyName: "Test Company",
    fileSize: 1024000,
    status: "completed",
    totalChunks: 50,
    createdAt: new Date("2024-01-01"),
    ...overrides,
  };
}

/**
 * Create a mock analysis for testing
 */
export function createMockAnalysis(overrides?: Partial<Analysis>): Analysis {
  return {
    id: "analysis-123",
    userId: "user-123",
    documentId: "doc-123",
    status: "completed",
    verdict: "POSITIVE",
    summary: "The company shows strong financial performance.",
    results: [
      {
        criterionName: "Revenue Growth",
        score: 8,
        findings: "Revenue grew 15% year-over-year.",
      },
    ],
    error: null,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    completedAt: new Date("2024-01-01"),
    ...overrides,
  };
}

/**
 * Create mock file for upload testing
 */
export function createMockFile(
  name: string = "test.pdf",
  type: string = "application/pdf",
  size: number = 1024
): File {
  const blob = new Blob([new ArrayBuffer(size)], { type });
  return new File([blob], name, { type, lastModified: Date.now() });
}

/**
 * Wait for async operations to complete
 */
export async function waitForAsync(ms: number = 0): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
