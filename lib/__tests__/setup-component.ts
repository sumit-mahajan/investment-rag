import "@testing-library/jest-dom";
import "reflect-metadata";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Clerk
vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({
    user: {
      id: "test-user-id",
      emailAddresses: [{ emailAddress: "test@example.com" }],
    },
    isLoaded: true,
    isSignedIn: true,
  }),
  UserButton: () => "UserButton",
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: () => ({
    userId: "test-user-id",
  }),
  currentUser: () => ({
    id: "test-user-id",
    emailAddresses: [{ emailAddress: "test@example.com" }],
  }),
}));
