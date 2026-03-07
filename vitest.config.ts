import { defineConfig } from "vitest/config";
import path from "path";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./lib/__tests__/setup.ts"],
    include: ["**/__tests__/**/*.test.{ts,tsx}"],
    exclude: ["node_modules", "dist", ".next"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "**/*.test.{ts,tsx}",
        "**/types/**",
        "**/__tests__/**",
        "**/node_modules/**",
        "**/.next/**",
        "**/dist/**",
        "**/*.config.{ts,js}",
        "**/instrumentation.ts",
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
