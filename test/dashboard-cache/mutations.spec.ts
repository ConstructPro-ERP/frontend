import { beforeEach, expect, it, vi } from "vitest";
import apiClient from "@/lib/axios";
import { dashboardQueryCache } from "@/lib/dashboardQueryCache";
import {
  generateFinanceInvoicePdf,
  recordFinancePayment,
} from "@/services/financeApi";
import type { FinancePaymentFormValues } from "@/types/finance";

vi.mock("@/lib/axios", () => ({ default: { post: vi.fn() } }));

const values: FinancePaymentFormValues = {
  invoiceId: "invoice-1",
  paymentAmount: "100",
  paymentMethod: "Cash",
  paymentDate: "2026-10-19",
  paymentReference: "REF-1",
  notes: "",
};

beforeEach(async () => {
  vi.clearAllMocks();
  dashboardQueryCache.clear();
  for (const key of [
    "home:summary",
    "analytics:overview",
    "finance:overview",
    "finance:invoice:invoice-1",
  ]) {
    await dashboardQueryCache.fetch(key, async () => "original");
  }
});

it("invalidates financial summaries and details only after a payment succeeds", async () => {
  vi.mocked(apiClient.post).mockRejectedValueOnce(new Error("rejected"));
  await expect(recordFinancePayment(values)).rejects.toThrow("rejected");
  expect(
    dashboardQueryCache.snapshot("home:summary").updatedAt,
  ).toBeGreaterThan(0);
  vi.mocked(apiClient.post).mockResolvedValueOnce({
    success: true,
    data: {},
    statusCode: 200,
    path: "/payments",
    timestamp: "2026-10-19T00:00:00.000Z",
  });
  await recordFinancePayment(values);
  for (const key of [
    "home:summary",
    "analytics:overview",
    "finance:overview",
    "finance:invoice:invoice-1",
  ]) {
    expect(dashboardQueryCache.snapshot(key).updatedAt).toBe(0);
    expect(dashboardQueryCache.snapshot(key).data).toBe("original");
  }
});

it("invalidates cached invoice data after generating its PDF", async () => {
  vi.mocked(apiClient.post).mockResolvedValueOnce({
    success: true,
    statusCode: 200,
    path: "/invoices/invoice-1/pdf",
    timestamp: "2026-10-19T00:00:00.000Z",
    data: {
      id: "invoice-1",
      status: "ISSUED",
      project: { projectName: "Project" },
      customer: { fullName: "Client" },
      pdfUrl: "https://example.com/invoice.pdf",
    },
  });
  await generateFinanceInvoicePdf("invoice-1");
  expect(
    dashboardQueryCache.snapshot("finance:invoice:invoice-1").updatedAt,
  ).toBe(0);
});
