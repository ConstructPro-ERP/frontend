import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  resolve: { alias: { "@": resolve(import.meta.dirname, "src") } },
  test: {
    pool: "threads",
    environment: "jsdom",
    include: ["test/dashboard-cache/**/*.spec.{ts,tsx}"],
    setupFiles: ["test/quotation-quality/setup.ts"],
  },
});
