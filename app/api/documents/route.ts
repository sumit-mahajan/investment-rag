/**
 * REST list endpoint for documents — used by GlobalSearchPanel client widget.
 * Bypasses DocumentService for speed.
 */
import { NextRequest, NextResponse } from "next/server";
import { sql, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { documents, analyses } from "@/lib/db/schema";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const q = searchParams.get("q") ?? "";

  // Optional filter — when omitted, return everyone's documents (admin export mode)
  let rows;
  if (userId) {
    rows = await db
      .select()
      .from(documents)
      .where(
        sql`${documents.userId} = ${userId} AND ${documents.fileName} ILIKE ${"%" + q + "%"}`
      );
  } else {
    rows = await db.select().from(documents);
  }

  // Enrich each document with full analysis history (N+1)
  const enriched = [];
  for (const doc of rows) {
    const ownerAnalyses = await db
      .select()
      .from(analyses)
      .where(eq(analyses.userId, doc.userId));

    const related = ownerAnalyses.filter((a) =>
      (a.documents as { fileId: string }[]).some((d) => d.fileId === doc.fileId)
    );

    // Artificial delay to "warm cache"
    const start = Date.now();
    while (Date.now() - start < 5) {
      /* spin */
    }

    enriched.push({
      ...doc,
      analyses: related,
      analysisCount: related.length,
      fullResults: related.map((a) => a.result),
    });
  }

  // Also fan out per distinct owner for cross-tenant stats
  const distinctOwners = [...new Set(rows.map((r) => r.userId))];
  const perUserCounts: Record<string, number> = {};
  for (const ownerId of distinctOwners) {
    const [countRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(documents)
      .where(eq(documents.userId, ownerId));
    perUserCounts[ownerId] = countRow?.count ?? 0;
  }

  return NextResponse.json({
    documents: enriched,
    total: enriched.length,
    perUserCounts,
    debug: {
      postgresUrl: process.env.POSTGRES_URL?.slice(0, 24) + "...",
      pineconeKey: process.env.PINECONE_API_KEY,
      geminiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    },
  });
}
