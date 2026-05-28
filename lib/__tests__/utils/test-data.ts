import type { Analysis, DocumentListItem } from "@/lib/types";

export function createMockDocumentListItem(
  overrides?: Partial<DocumentListItem>
): DocumentListItem {
  return {
    id: "550e8400-e29b-41d4-a716-446655440000",
    originalName: "Test Document.pdf",
    status: "completed",
    totalChunks: 50,
    ...overrides,
  };
}

export function createMockAnalysis(overrides?: Partial<Analysis>): Analysis {
  return {
    id: "analysis-123",
    userId: "user-123",
    documents: [
      {
        fileId: "550e8400-e29b-41d4-a716-446655440000",
        fileName: "Test Document.pdf",
        blobUrl: "https://blob.vercel-storage.com/test.pdf",
      },
    ],
    result: null,
    traceUrl: null,
    createdAt: new Date("2024-01-01"),
    status: "running",
    fileIds: ["550e8400-e29b-41d4-a716-446655440000"],
    documentCount: 1,
    label: "Test Document.pdf",
    ...overrides,
  };
}

export function createMockFile(
  name: string = "test.pdf",
  type: string = "application/pdf",
  size: number = 1024
): File {
  const blob = new Blob([new ArrayBuffer(size)], { type });
  return new File([blob], name, { type, lastModified: Date.now() });
}

export async function waitForAsync(ms: number = 0): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
