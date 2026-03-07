import { container } from "@/lib/di";
import { UserService } from "./user.service";

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
 *
 * @deprecated Use UserService.ensureUser() directly instead
 */
export async function ensureUser(clerkUser: ClerkUser): Promise<void> {
  const userService = container.resolve(UserService);
  await userService.ensureUser(clerkUser as any);
}
