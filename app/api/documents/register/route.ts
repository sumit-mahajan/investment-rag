import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { container } from "@/lib/di";
import { DocumentService } from "@/lib/services/document.service";
import { UserService } from "@/lib/services/user.service";
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
  const documentService = container.resolve(DocumentService);
  const userService = container.resolve(UserService);

  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await userService.ensureUser(user);

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

    // Register document and start processing
    const document = await documentService.registerDocument(user.id, {
      blobUrl,
      filename,
      fileBuffer,
      metadata,
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
