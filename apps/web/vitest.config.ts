import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    // Forks pool, sequential files — DB integration tests must not run in
    // parallel to avoid RLS claim bleed and race conditions.
    pool: "forks",
    // fileParallelism: false ensures test files run sequentially (no parallel workers).
    fileParallelism: false,
    include: ["__tests__/**/*.test.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
