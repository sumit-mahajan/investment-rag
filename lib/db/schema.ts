import { pgTable, text, timestamp, uuid, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/** Document snapshot stored on each analysis row */
export type AnalysisDocumentRef = {
  fileId: string;
  fileName: string;
  blobUrl: string;
};

export type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export const analyses = pgTable(
  "analyses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    documents: jsonb("documents").$type<AnalysisDocumentRef[]>().notNull().default([]),
    result: jsonb("result"),
    traceUrl: text("trace_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("analyses_user_id_idx").on(table.userId),
  })
);

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    analysisId: uuid("analysis_id")
      .references(() => analyses.id, { onDelete: "cascade" })
      .notNull(),
    messages: jsonb("messages").$type<ConversationMessage[]>().notNull().default([]),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("conversations_user_id_idx").on(table.userId),
    analysisIdIdx: index("conversations_analysis_id_idx").on(table.analysisId),
  })
);

export const analysesRelations = relations(analyses, ({ many }) => ({
  conversations: many(conversations),
}));

export const conversationsRelations = relations(conversations, ({ one }) => ({
  analysis: one(analyses, {
    fields: [conversations.analysisId],
    references: [analyses.id],
  }),
}));
