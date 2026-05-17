import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Integration tests hit a real DB — run in a single fork to avoid
    // parallel DB transactions causing race conditions or RLS claim bleed.
    pool: "forks",
    singleFork: true,
    // Increase timeout for DB operations
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
