import "dotenv/config";
import { ingestDocument } from "@/lib/ingestion/ingest-document";

async function main() {
  const keys = [
    "LLAMA_CLOUD_API_KEY",
    "GOOGLE_API_KEY",
    "PINECONE_API_KEY",
    "PINECONE_INDEX_NAME",
  ];
  for (const k of keys) {
    console.log(`${k}:`, process.env[k] ? "set" : "MISSING");
  }

  const pdf = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF");
  try {
    const n = await ingestDocument({
      fileId: `test-${Date.now()}`,
      userId: "test-user",
      fileName: "smoke.pdf",
      blobUrl: "https://example.com/smoke.pdf",
      fileBuffer: pdf,
    });
    console.log("SUCCESS chunks:", n);
  } catch (e) {
    console.error("INGEST_ERROR:", e instanceof Error ? e.message : e);
    if (e instanceof Error && e.cause) {
      console.error("cause:", (e.cause as Error).message);
    }
    process.exit(1);
  }
}

main();
