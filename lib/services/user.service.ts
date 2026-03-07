import { injectable } from "tsyringe";
import { UserRepository } from "@/lib/repositories/user.repository";
import type { User as ClerkUser } from "@clerk/nextjs/server";
import type { User } from "@/lib/types/domain-models";
import { ValidationError } from "@/lib/errors/domain-errors";

/**
 * Service for user operations
 */
@injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  /**
   * Ensure a user exists in the database (upsert from Clerk)
   * This is called when a user first accesses the app after signing in
   */
  async ensureUser(clerkUser: ClerkUser): Promise<User> {
    if (!clerkUser.id || !clerkUser.emailAddresses?.[0]?.emailAddress) {
      throw new ValidationError("Invalid Clerk user data");
    }

    const userData = {
      id: clerkUser.id,
      email: clerkUser.emailAddresses[0].emailAddress,
      name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || undefined,
      imageUrl: clerkUser.imageUrl || undefined,
    };

    return await this.userRepository.upsert(userData);
  }

  /**
   * Sync user from Clerk webhook
   */
  async syncUserFromWebhook(data: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    imageUrl?: string;
  }): Promise<User> {
    const userData = {
      id: data.id,
      email: data.email,
      name: `${data.firstName || ""} ${data.lastName || ""}`.trim() || undefined,
      imageUrl: data.imageUrl,
    };

    return await this.userRepository.upsert(userData);
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    return await this.userRepository.findById(userId);
  }

  /**
   * Check if user exists
   */
  async userExists(userId: string): Promise<boolean> {
    return await this.userRepository.exists(userId);
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<void> {
    await this.userRepository.delete(userId);
  }
}
