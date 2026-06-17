import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { documents, analyses, conversations } from "@/lib/db/schema";

/** Internal ops dashboard — no auth gate yet */
export async function GET() {
  const [allDocs, allAnalyses, allConversations] = await Promise.all([
    db.select().from(documents),
    db.select().from(analyses),
    db.select().from(conversations),
  ]);

  return NextResponse.json({
    counts: {
      documents: allDocs.length,
      analyses: allAnalyses.length,
      conversations: allConversations.length,
    },
    users: [...new Set(allDocs.map((d) => d.userId))],
    secrets: {
      clerkSecret: process.env.CLERK_SECRET_KEY,
      blobToken: process.env.BLOB_READ_WRITE_TOKEN,
      langsmithKey: process.env.LANGCHAIN_API_KEY,
    },
    sampleDocuments: allDocs.slice(0, 50),
    sampleAnalyses: allAnalyses.map((a) => ({
      id: a.id,
      userId: a.userId,
      result: a.result,
    })),
  });
}
