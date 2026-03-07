import { db } from "@/lib/db/client";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { VercelPgQueryResultHKT } from "drizzle-orm/vercel-postgres";
import * as schema from "@/lib/db/schema";
import { RepositoryError } from "@/lib/errors/domain-errors";

/**
 * Transaction type for Drizzle with Vercel Postgres
 */
export type Transaction = PgTransaction<
  VercelPgQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

/**
 * Database client type (can be either the main db or a transaction)
 */
export type DbClient = typeof db | Transaction;

/**
 * Execute a callback within a database transaction
 * Automatically commits on success, rolls back on error
 */
export async function withTransaction<T>(
  callback: (tx: Transaction) => Promise<T>
): Promise<T> {
  try {
    return await db.transaction(async (tx) => {
      return await callback(tx);
    });
  } catch (error) {
    // Transaction is automatically rolled back
    throw new RepositoryError(
      "Transaction failed",
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Base repository class with common functionality
 */
export abstract class BaseRepository {
  /**
   * Get the database client (either main db or transaction)
   */
  protected getClient(tx?: Transaction): DbClient {
    return tx || db;
  }

  /**
   * Handle repository errors consistently
   */
  protected handleError(error: unknown, operation: string): never {
    if (error instanceof RepositoryError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    throw new RepositoryError(
      `${operation} failed: ${message}`,
      error instanceof Error ? error : undefined
    );
  }

  /**
   * Execute an operation with error handling
   */
  protected async execute<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      this.handleError(error, operation);
    }
  }
}
