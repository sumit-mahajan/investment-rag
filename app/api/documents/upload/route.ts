import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { put } from "@vercel/blob";
import { db } from "@/lib/db/client";
import { documents } from "@/lib/db/schema";
import { processDocument } from "@/lib/services/document-processor";
import { ensureUser } from "@/lib/services/ensure-user";
import { handleError } from "@/lib/utils/errors";

export const runtime = "nodejs";
export const maxDuration = 60; // 60 seconds for Vercel Pro

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureUser(user);

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are allowed" },
        { status: 400 }
      );
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 50MB" },
        { status: 400 }
      );
    }

    // Upload to Vercel Blob
    const blob = await put(file.name, file, {
      access: "public",
      ...(process.env.NODE_ENV === "production"
        ? { addRandomSuffix: true }
        : { allowOverwrite: true }),
    });

    // Get optional metadata
    const metadata = formData.get("metadata");
    let parsedMetadata: any = {};
    if (metadata) {
      try {
        parsedMetadata = JSON.parse(metadata as string);
      } catch (e) {
        console.error("Error parsing metadata:", e);
      }
    }

    // Create document record
    const [document] = await db
      .insert(documents)
      .values({
        userId: user.id,
        filename: blob.url.split("/").pop() || file.name,
        originalName: file.name,
        fileUrl: blob.url,
        fileSize: file.size,
        mimeType: file.type,
        status: "pending",
        companyName: parsedMetadata.companyName,
        tickerSymbol: parsedMetadata.tickerSymbol,
        cik: parsedMetadata.cik,
        filingType: parsedMetadata.filingType,
        filingDate: parsedMetadata.filingDate
          ? new Date(parsedMetadata.filingDate)
          : undefined,
        fiscalYear: parsedMetadata.fiscalYear,
        fiscalPeriod: parsedMetadata.fiscalPeriod,
        sourceUrl: parsedMetadata.sourceUrl,
      })
      .returning();

    // Process document asynchronously
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Start processing (don't await - run in background)
    processDocument({
      documentId: document.id,
      userId: user.id,
      fileBuffer,
    }).catch((error) => {
      console.error("Background processing error:", error);
    });

    return NextResponse.json({
      document: {
        id: document.id,
        filename: document.filename,
        status: document.status,
        createdAt: document.createdAt,
      },
      message: "Document uploaded successfully. Processing started.",
    });
  } catch (error) {
    console.error("Upload error:", error);
    const errorResponse = handleError(error);
    return NextResponse.json(
      { error: errorResponse.message },
      { status: errorResponse.statusCode }
    );
  }
}
