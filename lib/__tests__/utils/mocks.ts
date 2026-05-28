import { vi } from "vitest";

/**
 * Mock DocumentService for testing
 */
export function createMockDocumentService() {
  return {
    registerDocument: vi.fn(),
    listUserDocuments: vi.fn(),
    getDocument: vi.fn(),
    getDocumentWithChunkCount: vi.fn(),
    deleteDocument: vi.fn(),
    queryDocument: vi.fn(),
    documentExists: vi.fn(),
    getDocumentCount: vi.fn(),
  };
}

/**
 * Mock AnalysisService for testing
 */
export function createMockAnalysisService() {
  return {
    startAnalysis: vi.fn(),
    listUserAnalyses: vi.fn(),
    getAnalysis: vi.fn(),
    getDocumentAnalyses: vi.fn(),
    deleteAnalysis: vi.fn(),
    getAnalysisCount: vi.fn(),
  };
}

/**
 * Mock fetch responses
 */
export function createMockFetchResponse<T>(data: T, ok: boolean = true) {
  return Promise.resolve({
    ok,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    status: ok ? 200 : 400,
    statusText: ok ? "OK" : "Bad Request",
  } as Response);
}

/**
 * Mock router from next/navigation
 */
export function createMockRouter() {
  return {
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  };
}
