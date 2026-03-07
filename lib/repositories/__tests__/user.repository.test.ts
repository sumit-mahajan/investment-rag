import { describe, it, expect, beforeEach } from "vitest";
import { UserRepository } from "../user.repository";

describe("UserRepository", () => {
  let repository: UserRepository;

  beforeEach(() => {
    repository = new UserRepository();
  });

  describe("constructor", () => {
    it("should create instance successfully", () => {
      expect(repository).toBeInstanceOf(UserRepository);
    });
  });

  describe("methods", () => {
    it("should have create method", () => {
      expect(typeof repository.create).toBe("function");
    });

    it("should have findById method", () => {
      expect(typeof repository.findById).toBe("function");
    });

    it("should have findByEmail method", () => {
      expect(typeof repository.findByEmail).toBe("function");
    });

    it("should have upsert method", () => {
      expect(typeof repository.upsert).toBe("function");
    });

    it("should have delete method", () => {
      expect(typeof repository.delete).toBe("function");
    });

    it("should have exists method", () => {
      expect(typeof repository.exists).toBe("function");
    });
  });
});
