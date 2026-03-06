import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

type ClerkUser = {
  id: string;
  emailAddresses: Array<{ emailAddress: string }>;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
};

/**
 * Ensures the user exists in the database. If not, creates the record.
 * Use this before operations that require a foreign key to users (e.g. document upload).
 * Handles cases where Clerk webhook hasn't run (e.g. local dev, webhook not configured).
 */
export async function ensureUser(clerkUser: ClerkUser): Promise<void> {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, clerkUser.id))
    .limit(1);

  if (existing.length > 0) {
    return;
  }

  const email = clerkUser.emailAddresses?.[0]?.emailAddress;
  if (!email) {
    throw new Error("User has no email address");
  }

  const name = [clerkUser.firstName, clerkUser.lastName]
    .filter(Boolean)
    .join(" ")
    .trim() || null;

  await db.insert(users).values({
    id: clerkUser.id,
    email,
    name,
    imageUrl: clerkUser.imageUrl || null,
  });
}
