/**
 * Script to re-process an existing document with updated chunking logic.
 * Usage: npx tsx scripts/reprocess-document.ts [documentId]
 * If no documentId provided, re-processes the first completed document.
 */

import "dotenv/config";
import { db } from "@/lib/db/client";
import { documents, documentChunks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { deleteVectorsByDocumentId } from "@/lib/vectorstore/operations";
import { processDocument } from "@/lib/services/document-processor";

async function reprocessDocument(targetDocId?: string) {
  try {
    // Get document
    let doc;
    if (targetDocId) {
      [doc] = await db
        .select()
        .from(documents)
        .where(eq(documents.id, targetDocId))
        .limit(1);
    } else {
      [doc] = await db
        .select()
        .from(documents)
        .where(eq(documents.status, "completed"))
        .limit(1);
    }

    if (!doc) {
      console.log("❌ No document found");
      process.exit(1);
    }

    console.log(`\n📄 Re-processing document: ${doc.originalName}`);
    console.log(`   Document ID: ${doc.id}`);
    console.log(`   User ID: ${doc.userId}`);
    console.log(`   File URL: ${doc.fileUrl}`);
    console.log(`   Current chunks: ${doc.totalChunks || 0}\n`);

    // Step 1: Delete existing chunks from Pinecone
    console.log("🗑️  Deleting existing vectors from Pinecone...");
    await deleteVectorsByDocumentId(doc.id, doc.userId);
    console.log("   ✅ Pinecone vectors deleted");

    // Step 2: Delete existing chunks from database
    console.log("🗑️  Deleting existing chunks from database...");
    await db
      .delete(documentChunks)
      .where(eq(documentChunks.documentId, doc.id));
    console.log("   ✅ Database chunks deleted");

    // Step 3: Download PDF from Vercel Blob
    console.log("📥 Downloading PDF from storage...");
    const response = await fetch(doc.fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to download PDF: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    console.log(`   ✅ Downloaded ${(fileBuffer.length / 1024 / 1024).toFixed(2)} MB`);

    // Step 4: Reset document status
    await db
      .update(documents)
      .set({
        status: "pending",
        totalChunks: null,
        processedAt: null,
        processingError: null,
      })
      .where(eq(documents.id, doc.id));

    // Step 5: Re-process document
    console.log("🔄 Re-processing document with new chunking logic...\n");
    await processDocument({
      documentId: doc.id,
      userId: doc.userId,
      fileBuffer,
    });

    // Step 6: Verify results
    const [updatedDoc] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, doc.id))
      .limit(1);

    const newChunks = await db
      .select()
      .from(documentChunks)
      .where(eq(documentChunks.documentId, doc.id))
      .limit(5);

    console.log(`\n\n✅ Re-processing complete!`);
    console.log(`   Status: ${updatedDoc.status}`);
    console.log(`   New chunk count: ${updatedDoc.totalChunks || 0}`);
    
    if (newChunks.length > 0) {
      console.log(`\n📋 Sample chunks:\n`);
      for (const chunk of newChunks.slice(0, 3)) {
        console.log(`   Chunk ${chunk.chunkIndex}:`);
        console.log(`     Categories: ${chunk.categories?.join(", ") || "general"}`);
        console.log(`     Type: ${chunk.contentType || "text"}`);
        console.log(`     Length: ${chunk.content.length} chars`);
        console.log(`     Preview: "${chunk.content.substring(0, 150)}..."\n`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
}

// Get documentId from command line args
const documentId = process.argv[2];
reprocessDocument(documentId);
