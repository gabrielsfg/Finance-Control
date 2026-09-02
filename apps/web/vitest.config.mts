import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Unit tests for the web client.
 *
 * No React plugin: Vitest's own transform already handles TSX with the automatic
 * JSX runtime, and `@vitejs/plugin-react` cannot be installed in this tree (it
 * pulls a Babel 8 peer that conflicts with Next's Babel 7). Anything that needs
 * Fast Refresh or the React Compiler belongs in `next dev`, not here.
 */
export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    css: false,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
