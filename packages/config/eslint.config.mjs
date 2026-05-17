// @investio/config — shared ESLint flat config
// Minimal setup for TypeScript + React — T-010 will expand with shadcn rules

import js from "@eslint/js";

/** @type {import("eslint").Linter.Config[]} */
const config = [
  js.configs.recommended,
  {
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
];

export default config;
