import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserService } from "@/lib/services/user.service";
import { ConflictError } from "@/lib/errors/domain-errors";

describe("UserService", () => {
  let userService: UserService;
  let mockUserRepo: any;

  beforeEach(() => {
    mockUserRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      findByEmail: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      exists: vi.fn(),
    };

    userService = new UserService(mockUserRepo);
  });

  describe("ensureUser", () => {
    it("upserts user from Clerk data", async () => {
      const mockUser = {
        id: "clerk-123",
        email: "test@example.com",
        name: "Test User",
      };

      mockUserRepo.upsert.mockResolvedValue(mockUser);

      const result = await userService.ensureUser({
        id: "clerk-123",
        emailAddresses: [{ emailAddress: "test@example.com" }],
        firstName: "Test",
        lastName: "User",
      } as any);

      expect(mockUserRepo.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "clerk-123",
          email: "test@example.com",
          name: "Test User",
        })
      );
      expect(result).toEqual(mockUser);
    });

    it("handles user without name", async () => {
      const mockUser = {
        id: "clerk-123",
        email: "test@example.com",
        name: undefined,
      };

      mockUserRepo.upsert.mockResolvedValue(mockUser);

      const result = await userService.ensureUser({
        id: "clerk-123",
        emailAddresses: [{ emailAddress: "test@example.com" }],
      } as any);

      expect(mockUserRepo.upsert).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });
  });

  describe("syncUserFromWebhook", () => {
    it("creates user from webhook data", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
      };

      mockUserRepo.upsert.mockResolvedValue(mockUser);

      const result = await userService.syncUserFromWebhook({
        id: "clerk-123",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
      });

      expect(mockUserRepo.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "clerk-123",
          email: "test@example.com",
          name: "Test User",
        })
      );
      expect(result).toEqual(mockUser);
    });

    it("handles user without name", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        name: null,
      };

      mockUserRepo.upsert.mockResolvedValue(mockUser);

      const result = await userService.syncUserFromWebhook({
        id: "clerk-123",
        email: "test@example.com",
      });

      expect(mockUserRepo.upsert).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });
  });

  describe("getUserById", () => {
    it("returns user when found", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
      };

      mockUserRepo.findById.mockResolvedValue(mockUser);

      const result = await userService.getUserById("user-123");

      expect(mockUserRepo.findById).toHaveBeenCalledWith("user-123");
      expect(result).toEqual(mockUser);
    });

    it("returns null when user not found", async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      const result = await userService.getUserById("user-123");

      expect(result).toBeNull();
    });
  });

  describe("userExists", () => {
    it("returns true when user exists", async () => {
      mockUserRepo.exists.mockResolvedValue(true);

      const result = await userService.userExists("user-123");

      expect(mockUserRepo.exists).toHaveBeenCalledWith("user-123");
      expect(result).toBe(true);
    });

    it("returns false when user does not exist", async () => {
      mockUserRepo.exists.mockResolvedValue(false);

      const result = await userService.userExists("user-123");

      expect(result).toBe(false);
    });
  });

  describe("deleteUser", () => {
    it("deletes user successfully", async () => {
      mockUserRepo.delete.mockResolvedValue(undefined);

      await userService.deleteUser("user-123");

      expect(mockUserRepo.delete).toHaveBeenCalledWith("user-123");
    });
  });
});
