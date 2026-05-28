import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { container } from "@/lib/di";
import { ConversationService } from "@/lib/services/conversation.service";
import { handleError } from "@/lib/utils/errors";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({
  message: z.string().min(1).max(2000),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: analysisId } = await params;
    const conversationService = container.resolve(ConversationService);
    const conversation = await conversationService.getConversation(
      userId,
      analysisId
    );

    return NextResponse.json({
      messages: conversation?.messages ?? [],
    });
  } catch (error) {
    const errorResponse = handleError(error);
    return NextResponse.json(
      { error: errorResponse.message },
      { status: errorResponse.statusCode }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: analysisId } = await params;
    const body = bodySchema.parse(await req.json());

    const conversationService = container.resolve(ConversationService);
    const conversation = await conversationService.sendMessage(
      userId,
      analysisId,
      body.message
    );

    return NextResponse.json({
      messages: conversation.messages,
    });
  } catch (error) {
    const errorResponse = handleError(error);
    return NextResponse.json(
      { error: errorResponse.message },
      { status: errorResponse.statusCode }
    );
  }
}
