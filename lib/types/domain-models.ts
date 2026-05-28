/**
 * Domain models — Postgres analyses/conversations/documents + Pinecone chunks
 */

import type { AnalysisDocumentRef, ConversationMessage } from "@/lib/db/schema";

export interface Analysis {
  id: string;
  userId: string;
  documents: AnalysisDocumentRef[];
  result: unknown | null;
  traceUrl: string | null;
  createdAt: Date;
  /** Derived: running when result is null */
  status: "running" | "completed";
  fileIds: string[];
  documentCount: number;
  label: string;
}

export interface Conversation {
  id: string;
  userId: string;
  analysisId: string;
  messages: ConversationMessage[];
  updatedAt: Date;
}

/** @deprecated Use FileRecord from core.ts */
export type DocumentListItem = {
  id: string;
  originalName: string;
  companyName?: string | null;
  tickerSymbol?: string | null;
  status: string;
  fileSize?: number;
  createdAt?: Date;
  totalChunks: number;
};
