import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

const typescriptFiles = ["**/*.ts", "**/*.cts", "**/*.mts"];

export default [
  { ignores: ["dist/**", "coverage/**", "artifacts/**", "consumer/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: typescriptFiles,
  })),
  {
    files: ["test/types/*.cts"],
    rules: {
      "@typescript-eslint/no-require-imports": ["error", { allowAsImport: true }],
    },
  },
  { languageOptions: { globals: globals.node } },
];
