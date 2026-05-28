/**
 * Re-ingest a file from Vercel Blob into Pinecone.
 * Usage: npx tsx scripts/reprocess-document.ts <fileId> <blobUrl> <fileName> <userId>
 */
import { readFileSync } from "fs";
import { ingestDocument } from "@/lib/ingestion";
import { deleteVectorsByFileId } from "@/lib/vectorstore/operations";

async function reprocessFile(
  fileId: string,
  blobUrl: string,
  fileName: string,
  userId: string,
  localPath?: string
) {
  console.log(`Reprocessing file ${fileId} for user ${userId}`);

  await deleteVectorsByFileId(userId, fileId);

  let buffer: Buffer;
  if (localPath) {
    buffer = readFileSync(localPath);
  } else {
    const res = await fetch(blobUrl);
    if (!res.ok) throw new Error(`Failed to fetch ${blobUrl}`);
    buffer = Buffer.from(await res.arrayBuffer());
  }

  const chunkCount = await ingestDocument({
    fileId,
    userId,
    fileName,
    blobUrl,
    fileBuffer: buffer,
  });

  console.log(`Done — ${chunkCount} chunks upserted for ${fileName}`);
}

const [fileId, blobUrl, fileName, userId, localPath] = process.argv.slice(2);
if (!fileId || !blobUrl || !fileName || !userId) {
  console.error(
    "Usage: npx tsx scripts/reprocess-document.ts <fileId> <blobUrl> <fileName> <userId> [localPdfPath]"
  );
  process.exit(1);
}

reprocessFile(fileId, blobUrl, fileName, userId, localPath).catch((err) => {
  console.error(err);
  process.exit(1);
});
