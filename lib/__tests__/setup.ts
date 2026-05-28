/**
 * Global test setup
 * This file runs before all tests
 */
if (!process.env.POSTGRES_URL) {
  process.env.POSTGRES_URL = "postgresql://test:test@127.0.0.1:5432/test";
}

import "reflect-metadata";
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Mock Next.js router for components that use useRouter
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

afterEach(() => {
  cleanup();
});

// You can add global test utilities here
export {};
