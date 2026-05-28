export interface ParsedPage {
  pageNumber: number;
  /** Non-table text for this page — chunked as prose */
  prose: string;
  /** Markdown tables on this page — each becomes one table chunk */
  tables: string[];
}

export interface IngestDocumentInput {
  fileId: string;
  userId: string;
  fileName: string;
  blobUrl: string;
  fileBuffer: Buffer;
}
