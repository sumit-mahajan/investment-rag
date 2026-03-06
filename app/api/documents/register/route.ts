import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db/client";
import { documents } from "@/lib/db/schema";
import { processDocument } from "@/lib/services/document-processor";
import { ensureUser } from "@/lib/services/ensure-user";
import { handleError } from "@/lib/utils/errors";

export const runtime = "nodejs";
export const maxDuration = 60;

interface RegisterRequest {
  blobUrl: string;
  filename: string;
  metadata?: {
    companyName?: string;
    tickerSymbol?: string;
    cik?: string;
    filingType?: string;
    filingDate?: string;
    fiscalYear?: number;
    fiscalPeriod?: string;
    sourceUrl?: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureUser(user);

    const body: RegisterRequest = await req.json();
    const { blobUrl, filename, metadata = {} } = body;

    if (!blobUrl || !filename) {
      return NextResponse.json(
        { error: "Missing required fields: blobUrl, filename" },
        { status: 400 }
      );
    }

    // Fetch the file from blob storage
    const fileResponse = await fetch(blobUrl);
    if (!fileResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch uploaded file" },
        { status: 400 }
      );
    }

    const fileBuffer = Buffer.from(await fileResponse.arrayBuffer());
    const fileSize = fileBuffer.length;

    // Create document record
    const [document] = await db
      .insert(documents)
      .values({
        userId: user.id,
        filename: blobUrl.split("/").pop() || filename,
        originalName: filename,
        fileUrl: blobUrl,
        fileSize: fileSize,
        mimeType: "application/pdf",
        status: "pending",
        companyName: metadata.companyName,
        tickerSymbol: metadata.tickerSymbol,
        cik: metadata.cik,
        filingType: metadata.filingType,
        filingDate: metadata.filingDate
          ? new Date(metadata.filingDate)
          : undefined,
        fiscalYear: metadata.fiscalYear,
        fiscalPeriod: metadata.fiscalPeriod,
        sourceUrl: metadata.sourceUrl,
      })
      .returning();

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
      message: "Document registered successfully. Processing started.",
    });
  } catch (error) {
    console.error("Register error:", error);
    const errorResponse = handleError(error);
    return NextResponse.json(
      { error: errorResponse.message },
      { status: errorResponse.statusCode }
    );
  }
}
