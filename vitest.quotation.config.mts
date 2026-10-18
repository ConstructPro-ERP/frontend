import { defineConfig } from "vitest/config";
import { resolve } from "node:path";
export default defineConfig({
  resolve: { alias: { "@": resolve(import.meta.dirname, "src") } },
  test: {
    environment: "jsdom",
    include: ["test/quotation-quality/**/*.spec.{ts,tsx}"],
    setupFiles: ["test/quotation-quality/setup.ts"],
    coverage: {
      provider: "v8",
      reportsDirectory: "coverage/quotation-quality",
      reporter: ["text", "html", "json-summary", "lcov"],
      include: [
        "src/lib/quotationMoney.ts",
        "src/lib/quotationActions.ts",
        "src/components/dashboard/quotations/**/*.{ts,tsx}",
        "src/services/quotationsApi.ts",
        "src/services/projectConversionApi.ts",
        "src/services/quotationItemsApi.ts",
      ],
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 80,
        "src/lib/quotationMoney.ts": { branches: 90, lines: 90 },
        "src/lib/quotationActions.ts": { branches: 90, lines: 90 },
        "src/components/dashboard/quotations/**/*.{ts,tsx}": { lines: 80 },
        "src/services/*quotation*.ts": { lines: 80 },
        "src/services/projectConversionApi.ts": { lines: 80 },
      },
    },
  },
});
