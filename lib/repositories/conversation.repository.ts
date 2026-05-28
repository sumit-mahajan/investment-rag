import { injectable } from "tsyringe";
import { eq, desc, and } from "drizzle-orm";
import { conversations, type ConversationMessage } from "@/lib/db/schema";
import { BaseRepository, type Transaction } from "./base.repository";
import type { Conversation } from "@/lib/types/domain-models";
import { NotFoundError } from "@/lib/errors/domain-errors";

@injectable()
export class ConversationRepository extends BaseRepository {
  async create(
    userId: string,
    analysisId: string,
    tx?: Transaction
  ): Promise<Conversation> {
    return this.execute("Create conversation", async () => {
      const client = this.getClient(tx);
      const [row] = await client
        .insert(conversations)
        .values({
          userId,
          analysisId,
          messages: [],
          updatedAt: new Date(),
        })
        .returning();

      return this.toConversation(row);
    });
  }

  async findByIdAndUserId(
    id: string,
    userId: string,
    tx?: Transaction
  ): Promise<Conversation | null> {
    return this.execute("Find conversation", async () => {
      const client = this.getClient(tx);
      const [row] = await client
        .select()
        .from(conversations)
        .where(and(eq(conversations.id, id), eq(conversations.userId, userId)))
        .limit(1);

      return row ? this.toConversation(row) : null;
    });
  }

  async findByAnalysisId(
    analysisId: string,
    userId: string,
    tx?: Transaction
  ): Promise<Conversation | null> {
    return this.execute("Find conversation by analysis", async () => {
      const client = this.getClient(tx);
      const [row] = await client
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.analysisId, analysisId),
            eq(conversations.userId, userId)
          )
        )
        .orderBy(desc(conversations.updatedAt))
        .limit(1);

      return row ? this.toConversation(row) : null;
    });
  }

  async appendMessages(
    id: string,
    messages: ConversationMessage[],
    tx?: Transaction
  ): Promise<Conversation> {
    return this.execute("Append messages", async () => {
      const client = this.getClient(tx);
      const existing = await this.findById(id, tx);
      if (!existing) throw new NotFoundError("Conversation", id);

      const [row] = await client
        .update(conversations)
        .set({
          messages: [...existing.messages, ...messages],
          updatedAt: new Date(),
        })
        .where(eq(conversations.id, id))
        .returning();

      return this.toConversation(row);
    });
  }

  private async findById(id: string, tx?: Transaction) {
    const client = this.getClient(tx);
    const [row] = await client
      .select()
      .from(conversations)
      .where(eq(conversations.id, id))
      .limit(1);
    return row ? this.toConversation(row) : null;
  }

  private toConversation(row: typeof conversations.$inferSelect): Conversation {
    return {
      id: row.id,
      userId: row.userId,
      analysisId: row.analysisId,
      messages: (row.messages ?? []) as ConversationMessage[],
      updatedAt: row.updatedAt,
    };
  }
}
