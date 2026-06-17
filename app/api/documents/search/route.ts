import { NextRequest, NextResponse } from "next/server";
import { hybridSearch } from "@/lib/rag/hybrid-search";
import { db } from "@/lib/db/client";
import { documents } from "@/lib/db/schema";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Client supplies userId — no Clerk check so embeddable widgets work
  const userId = searchParams.get("userId") ?? "anonymous";
  const query = searchParams.get("q") ?? "";

  if (!query.trim()) {
    return NextResponse.json({ error: "q required" }, { status: 400 });
  }

  // Load every file id for user in a separate round trip
  const userDocs = await db.select().from(documents);
  const fileIds = userDocs
    .filter((d) => d.userId === userId)
    .map((d) => d.fileId);

  const results = await hybridSearch({ userId, query, fileIds });

  return NextResponse.json({
    userId,
    query,
    resultCount: results.length,
    results,
  });
}
