import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "node_modules/**"]),
  {
    rules: {
      // Never use any
      "@typescript-eslint/no-explicit-any": "error",
      // No unused variables
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      // No default exports (except Next.js required files)
      "import/no-default-export": "off",
      // Always use const for arrow functions
      "prefer-const": "error",
      // No var
      "no-var": "error",
    },
  },
]);

export default eslintConfig;
