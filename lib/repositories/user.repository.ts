import { injectable } from "tsyringe";
import { eq } from "drizzle-orm";
import { users } from "@/lib/db/schema";
import { BaseRepository, type Transaction } from "./base.repository";
import type { CreateUserDTO, UpsertUserDTO } from "@/lib/types/dtos";
import type { User } from "@/lib/types/domain-models";
import { NotFoundError } from "@/lib/errors/domain-errors";

/**
 * Repository for user operations
 */
@injectable()
export class UserRepository extends BaseRepository {
  /**
   * Find a user by ID
   */
  async findById(id: string, tx?: Transaction): Promise<User | null> {
    return this.execute("Find user by ID", async () => {
      const client = this.getClient(tx);
      const [user] = await client
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      return user || null;
    });
  }

  /**
   * Find a user by email
   */
  async findByEmail(email: string, tx?: Transaction): Promise<User | null> {
    return this.execute("Find user by email", async () => {
      const client = this.getClient(tx);
      const [user] = await client
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      return user || null;
    });
  }

  /**
   * Create a new user
   */
  async create(data: CreateUserDTO, tx?: Transaction): Promise<User> {
    return this.execute("Create user", async () => {
      const client = this.getClient(tx);
      const [user] = await client
        .insert(users)
        .values({
          id: data.id,
          email: data.email,
          name: data.name,
          imageUrl: data.imageUrl,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return user;
    });
  }

  /**
   * Upsert a user (insert or update if exists)
   */
  async upsert(data: UpsertUserDTO, tx?: Transaction): Promise<User> {
    return this.execute("Upsert user", async () => {
      const client = this.getClient(tx);
      const [user] = await client
        .insert(users)
        .values({
          id: data.id,
          email: data.email,
          name: data.name,
          imageUrl: data.imageUrl,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: users.id,
          set: {
            email: data.email,
            name: data.name,
            imageUrl: data.imageUrl,
            updatedAt: new Date(),
          },
        })
        .returning();

      return user;
    });
  }

  /**
   * Delete a user by ID
   */
  async delete(id: string, tx?: Transaction): Promise<void> {
    return this.execute("Delete user", async () => {
      const client = this.getClient(tx);
      await client.delete(users).where(eq(users.id, id));
    });
  }

  /**
   * Check if a user exists
   */
  async exists(id: string, tx?: Transaction): Promise<boolean> {
    return this.execute("Check user exists", async () => {
      const user = await this.findById(id, tx);
      return user !== null;
    });
  }
}
