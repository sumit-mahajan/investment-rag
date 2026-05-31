import { z } from "zod";
import { getGeminiModel } from "./gemini";
import { retrieveChunks } from "@/lib/retrieval";
import type { ConversationMessage } from "@/lib/db/schema";
import type { InvestmentAnalysis } from "@/lib/types/analysis";
import { chunkToCitation } from "@/lib/retrieval";

const followUpSchema = z.object({
  answer: z.string().describe("Grounded answer using only context provided"),
});

export async function generateFollowUpAnswer(params: {
  question: string;
  fileIds: string[];
  userId: string;
  analysisResult: InvestmentAnalysis;
  priorMessages: ConversationMessage[];
}): Promise<string> {
  const { question, fileIds, userId, analysisResult, priorMessages } = params;

  const chunks = await retrieveChunks({
    userId,
    fileIds,
    query: question,
    topK: 8,
  });

  const passageBlock =
    chunks.length > 0
      ? chunks
          .map(
            (c, i) =>
              `[${i + 1}] ${c.fileName} p.${c.pageNumber}\n${c.content.slice(0, 1000)}`
          )
          .join("\n\n")
      : "No new passages retrieved.";

  const historyBlock =
    priorMessages.length > 0
      ? priorMessages
          .slice(-6)
          .map((m) => `${m.role}: ${m.content}`)
          .join("\n")
      : "No prior messages.";

  const summary = analysisResult.verdict
    ? `Score ${analysisResult.verdict.score}/100 (${analysisResult.verdict.recommendation}). ${analysisResult.verdict.summary}`
    : "See prior analysis in conversation.";

  const model = getGeminiModel().withStructuredOutput(followUpSchema);
  const result = await model.invoke(`You are a financial analyst answering a follow-up about documents already analyzed.

Prior analysis summary: ${summary}

Conversation history:
${historyBlock}

New passages from documents:
${passageBlock}

User question: ${question}

Rules:
- Answer ONLY from the analysis summary and passages above.
- If the answer is not in the context, say you cannot find it in the uploaded documents.
- Be concise (2-5 sentences). Mention document name and page when citing.
- Do not invent figures or change currency/units from the filing.`);

  return result.answer;
}

export function citationsFromRetrievedChunks(
  chunks: Awaited<ReturnType<typeof retrieveChunks>>
) {
  const seen = new Set<string>();
  return chunks
    .slice(0, 5)
    .map(chunkToCitation)
    .filter((c) => {
      const key = `${c.fileId}:${c.pageNumber}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}
