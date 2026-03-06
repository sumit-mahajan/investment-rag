/**
 * Initialize Pinecone index
 * Run: npx tsx scripts/init-pinecone.ts
 */

import "dotenv/config";
import { Pinecone } from "@pinecone-database/pinecone";

async function initPinecone() {
  const apiKey = process.env.PINECONE_API_KEY;
  const indexName = process.env.PINECONE_INDEX_NAME || "investment-rag";

  if (!apiKey) {
    console.error("PINECONE_API_KEY is not set");
    process.exit(1);
  }

  const pinecone = new Pinecone({ apiKey });

  try {
    // Check if index exists
    const indexes = await pinecone.listIndexes();
    const indexExists = indexes.indexes?.some((idx) => idx.name === indexName);

    if (indexExists) {
      console.log(`Index "${indexName}" already exists`);
      return;
    }

    // Create index
    console.log(`Creating index "${indexName}"...`);
    await pinecone.createIndex({
      name: indexName,
      dimension: 768, // gemini-embedding-001 truncated to 768 dimensions
      metric: "cosine",
      spec: {
        serverless: {
          cloud: "aws",
          region: "us-east-1",
        },
      },
    });

    console.log(`Index "${indexName}" created successfully`);
  } catch (error) {
    console.error("Error initializing Pinecone:", error);
    process.exit(1);
  }
}

initPinecone();
