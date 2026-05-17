import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/calc/**"],
      exclude: ["src/calc/__tests__/**", "src/calc/__fixtures__/**"],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90,
      },
      reporter: ["text", "lcov", "json-summary"],
    },
  },
});
