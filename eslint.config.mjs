import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  { ignores: ["dist/**", ".astro/**", "node_modules/**", "content/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.mjs"],
    languageOptions: {
      // Node globals for config files and scripts. TypeScript files get these
      // from @types/node instead.
      globals: { process: "readonly", console: "readonly", URL: "readonly" },
    },
  },
  {
    files: ["**/*.ts", "**/*.mjs"],
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
];
