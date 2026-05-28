/**
 * One-time backfill: scan Pinecone namespaces and upsert into Postgres `documents`.
 *
 * Usage:
 *   pnpm backfill:documents -- --userId user_abc123
 *   pnpm backfill:documents -- --userIds user_a,user_b
 *   pnpm backfill:documents -- --from-db   # distinct userIds from analyses + documents tables
 *
 * Requires: POSTGRES_URL, PINECONE_API_KEY, PINECONE_INDEX_NAME
 */
import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { analyses, documents } from "@/lib/db/schema";
import { listUserFilesFromPinecone } from "@/lib/vectorstore/operations";
import type { FileRecord } from "@/lib/types/core";

function parseArgs(): { userIds: string[]; fromDb: boolean } {
  const args = process.argv.slice(2);
  let userIds: string[] = [];
  let fromDb = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--from-db") {
      fromDb = true;
    } else if (arg === "--userId" && args[i + 1]) {
      userIds.push(args[++i]);
    } else if (arg === "--userIds" && args[i + 1]) {
      userIds.push(
        ...args[++i]
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean)
      );
    }
  }

  return { userIds, fromDb };
}

async function distinctUserIdsFromDb(): Promise<string[]> {
  const fromAnalyses = await db
    .selectDistinct({ userId: analyses.userId })
    .from(analyses);
  const fromDocuments = await db
    .selectDistinct({ userId: documents.userId })
    .from(documents);

  const set = new Set<string>();
  for (const row of [...fromAnalyses, ...fromDocuments]) {
    set.add(row.userId);
  }
  return [...set];
}

async function upsertFile(file: FileRecord): Promise<void> {
  await db
    .insert(documents)
    .values({
      fileId: file.fileId,
      userId: file.userId,
      fileName: file.fileName,
      blobUrl: file.blobUrl,
      status: file.status,
      chunkCount: file.chunkCount ?? 0,
      createdAt: new Date(),
    })
    .onConflictDoUpdate({
      target: documents.fileId,
      set: {
        fileName: file.fileName,
        blobUrl: file.blobUrl,
        status: file.status,
        chunkCount: file.chunkCount ?? 0,
      },
    });
}

async function backfillUser(userId: string): Promise<number> {
  const files = await listUserFilesFromPinecone(userId);
  if (files.length === 0) {
    console.log(`  [${userId}] no vectors in Pinecone — skipped`);
    return 0;
  }

  for (const file of files) {
    await upsertFile(file);
  }

  console.log(`  [${userId}] upserted ${files.length} document(s)`);
  return files.length;
}

async function main() {
  const { userIds: cliUserIds, fromDb } = parseArgs();

  let userIds = [...new Set(cliUserIds)];
  if (fromDb) {
    const dbIds = await distinctUserIdsFromDb();
    userIds = [...new Set([...userIds, ...dbIds])];
  }

  if (userIds.length === 0) {
    console.error(
      "No user IDs. Pass --userId <id>, --userIds a,b, and/or --from-db (needs rows in analyses)."
    );
    process.exit(1);
  }

  if (!process.env.POSTGRES_URL) {
    console.error("POSTGRES_URL is not set");
    process.exit(1);
  }

  console.log(`Backfilling documents for ${userIds.length} user(s)...`);

  let total = 0;
  for (const userId of userIds) {
    try {
      total += await backfillUser(userId);
    } catch (err) {
      console.error(`  [${userId}] failed:`, err instanceof Error ? err.message : err);
    }
  }

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(documents);
  console.log(`Done. Upserted ${total} file record(s). documents table rows: ${countRow?.count ?? 0}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
