import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  jsonb,
  varchar,
  index,
  decimal,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Users table (synced from Clerk)
export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk user ID
  email: text("email").notNull().unique(),
  name: text("name"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Documents table
export const documents = pgTable(
  "documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    filename: text("filename").notNull(),
    originalName: text("original_name").notNull(),
    fileUrl: text("file_url").notNull(),
    fileSize: integer("file_size").notNull(),
    mimeType: text("mime_type").notNull(),

    // Document classification (generalized for any financial report)
    documentType: text("document_type"), // 10-K, 10-Q, annual-report, quarterly-report, other
    jurisdiction: text("jurisdiction"), // US, IN, UK, EU, other

    // Financial document metadata (optional, when available)
    companyName: text("company_name"),
    tickerSymbol: text("ticker_symbol"),
    cik: text("cik"),
    filingType: text("filing_type"), // Legacy: kept for backward compatibility
    filingDate: timestamp("filing_date"),
    fiscalYear: integer("fiscal_year"),
    fiscalPeriod: text("fiscal_period"),
    sourceUrl: text("source_url"),

    // Processing status
    status: text("status").notNull().default("pending"), // pending, processing, completed, failed
    processingError: text("processing_error"),
    totalChunks: integer("total_chunks").default(0),
    isImageBased: boolean("is_image_based").default(false), // true when OCR was used (scanned/image-only PDF)

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    processedAt: timestamp("processed_at"),
  },
  (table) => ({
    userIdIdx: index("documents_user_id_idx").on(table.userId),
    tickerIdx: index("documents_ticker_idx").on(table.tickerSymbol),
    statusIdx: index("documents_status_idx").on(table.status),
  })
);

// Document chunks table
export const documentChunks = pgTable(
  "document_chunks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    documentId: uuid("document_id")
      .references(() => documents.id, { onDelete: "cascade" })
      .notNull(),

    // Chunk content
    content: text("content").notNull(),
    contentHash: text("content_hash").notNull(), // For deduplication

    // Position metadata
    chunkIndex: integer("chunk_index").notNull(),
    pageNumber: integer("page_number"),

    // Content classification
    contentType: text("content_type"), // text, table, financial-data
    categories: text("categories").array(), // financial-performance, risk-factors, etc.

    // Vector metadata
    pineconeId: text("pinecone_id").unique(),
    embeddingModel: text("embedding_model"),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    documentIdIdx: index("chunks_document_id_idx").on(table.documentId),
    contentHashIdx: index("chunks_content_hash_idx").on(table.contentHash),
  })
);

// Analyses table
export const analyses = pgTable(
  "analyses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    documentId: uuid("document_id")
      .references(() => documents.id, { onDelete: "cascade" })
      .notNull(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),

    // Analysis results
    status: text("status").notNull().default("pending"), // pending, running, completed, failed
    verdict: text("verdict"), // POSITIVE, NEGATIVE, NEUTRAL, MIXED
    confidenceScore: decimal("confidence_score", { precision: 3, scale: 2 }),
    summary: text("summary"),

    // Full analysis results
    results: jsonb("results"), // Detailed analysis per criterion
    sources: jsonb("sources"), // Citations with page numbers

    // Error handling
    error: text("error"),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at"),
  },
  (table) => ({
    documentIdIdx: index("analyses_document_id_idx").on(table.documentId),
    userIdIdx: index("analyses_user_id_idx").on(table.userId),
    statusIdx: index("analyses_status_idx").on(table.status),
  })
);

// Analysis criteria (many-to-many)
export const analysisCriteria = pgTable("analysis_criteria", {
  id: uuid("id").defaultRandom().primaryKey(),
  analysisId: uuid("analysis_id")
    .references(() => analyses.id, { onDelete: "cascade" })
    .notNull(),

  criterionId: text("criterion_id").notNull(), // financial-health, risk-assessment, etc.
  criterionName: text("criterion_name").notNull(),

  // Criterion-specific results
  score: decimal("score", { precision: 3, scale: 2 }),
  findings: text("findings"),
  evidence: jsonb("evidence"), // Chunks used for this criterion

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Embeddings cache
export const embeddingsCache = pgTable(
  "embeddings_cache",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    contentHash: text("content_hash").notNull().unique(),
    embedding: jsonb("embedding").notNull(), // Stored as array
    model: text("model").notNull(),
    dimensions: integer("dimensions").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    contentHashIdx: index("embeddings_content_hash_idx").on(table.contentHash),
  })
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  documents: many(documents),
  analyses: many(analyses),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  user: one(users, {
    fields: [documents.userId],
    references: [users.id],
  }),
  chunks: many(documentChunks),
  analyses: many(analyses),
}));

export const documentChunksRelations = relations(documentChunks, ({ one }) => ({
  document: one(documents, {
    fields: [documentChunks.documentId],
    references: [documents.id],
  }),
}));

export const analysesRelations = relations(analyses, ({ one, many }) => ({
  document: one(documents, {
    fields: [analyses.documentId],
    references: [documents.id],
  }),
  user: one(users, {
    fields: [analyses.userId],
    references: [users.id],
  }),
  criteria: many(analysisCriteria),
}));

export const analysisCriteriaRelations = relations(analysisCriteria, ({ one }) => ({
  analysis: one(analyses, {
    fields: [analysisCriteria.analysisId],
    references: [analyses.id],
  }),
}));
