import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/lib/axios", () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn() },
}));
import client from "@/lib/axios";
import * as api from "@/services/quotationsApi";
import { convertQuotationToProject } from "@/services/projectConversionApi";
const raw = {
  id: "q",
  leadId: "l",
  status: "APPROVED",
  totalAmount: "99.99",
  items: [{ itemName: "x", quantity: 3, unitPrice: "33.33", amount: "99.99" }],
};
beforeEach(() => vi.resetAllMocks());
describe("Quotation shared-client API contracts", () => {
  it("passes server filtering and pagination and normalizes decimal strings", async () => {
    vi.mocked(client.get).mockResolvedValue({
      data: { items: [raw], total: 40, page: 2, limit: 5, totalPages: 8 },
    } as never);
    const result = await api.listQuotations({
      status: "APPROVED",
      leadId: "l",
      search: " Acme ",
      page: 2,
      limit: 5,
    });
    expect(client.get).toHaveBeenCalledWith("/quotations", {
      params: {
        status: "APPROVED",
        leadId: "l",
        search: "Acme",
        page: 2,
        limit: 5,
      },
    });
    expect(result.items[0].totalAmount).toBe(99.99);
    expect(result.totalPages).toBe(8);
  });
  it.each([
    [{ items: [raw] }, 1],
    [[raw], 1],
    [{}, 0],
  ])("supports list compatibility %#", async (data, total) => {
    vi.mocked(client.get).mockResolvedValue({ data } as never);
    expect(
      (await api.listQuotations({ status: "ALL", search: " " })).total,
    ).toBe(total);
  });
  it("rejects a missing list response", async () => {
    vi.mocked(client.get).mockResolvedValue({ data: null } as never);
    await expect(api.listQuotations()).rejects.toThrow(
      "Invalid quotation list",
    );
  });
  it("uses the existing detail/create/update contracts and normalizes all results", async () => {
    for (const method of [client.get, client.post, client.put])
      vi.mocked(method).mockResolvedValue({ data: raw } as never);
    expect((await api.getQuotationById("q")).items[0].unitPrice).toBe(33.33);
    await api.createQuotation({
      leadId: " l ",
      notes: " note ",
      items: [{ itemName: " x ", quantity: 3, unitPrice: 33.33 }],
    });
    expect(client.post).toHaveBeenCalledWith(
      "/quotations",
      {
        leadId: "l",
        notes: "note",
        items: [{ itemName: "x", quantity: 3, unitPrice: 33.33 }],
      },
      { timeout: 15000, retryCount: 3 },
    );
    await api.createQuotation({ leadId: "l", items: [] });
    expect(
      (await api.updateQuotation("q", { notes: "Updated" })).totalAmount,
    ).toBe(99.99);
    expect(client.put).toHaveBeenCalledWith("/quotations/q", {
      notes: "Updated",
    });
  });
  it("separates direct approval, submission, rejection, revision, and PDF routes", async () => {
    vi.mocked(client.patch).mockResolvedValue({ data: raw } as never);
    vi.mocked(client.get).mockResolvedValue({
      data: { pdfUrl: "https://example.com/q.pdf" },
    } as never);
    await api.approveQuotation("q");
    await api.submitQuotation("q");
    await api.rejectQuotation("q", { reason: " reason " });
    await api.reviseQuotation("q");
    expect(client.patch).toHaveBeenCalledWith(
      "/quotations/q/direct-approve",
      {},
    );
    expect(client.patch).toHaveBeenCalledWith("/quotations/q/submit", {});
    expect(client.patch).toHaveBeenCalledWith("/quotations/q/reject", {
      reason: "reason",
    });
    expect(client.patch).toHaveBeenCalledWith("/quotations/q/revise", {});
    expect(await api.getQuotationPdf("q")).toEqual({
      pdfUrl: "https://example.com/q.pdf",
    });
    expect(client.get).toHaveBeenCalledWith("/quotations/q/pdf", {
      timeout: 15000,
    });
  });
  it("returns only a verified real conversion and project ID", async () => {
    vi.mocked(client.patch).mockResolvedValue({
      data: {
        quotation: { ...raw, status: "CONVERTED", projectId: "p" },
        projectId: "p",
        projectStatus: "ACTIVE",
      },
    } as never);
    const result = await convertQuotationToProject("q", {
      targetProjectId: "p",
    });
    expect(result.projectId).toBe("p");
    expect(result.quotation.totalAmount).toBe(99.99);
    expect(client.patch).toHaveBeenCalledWith(
      "/quotations/q/approve",
      { targetProjectId: "p" },
      { timeout: 15000, retryCount: 3 },
    );
  });
  it.each([
    null,
    {},
    raw,
    { projectId: "p", projectStatus: "ACTIVE" },
    { quotation: raw, projectId: "p", projectStatus: "INVALID" },
    {
      quotation: { ...raw, status: "CONVERTED", projectId: "other" },
      projectId: "p",
      projectStatus: "ACTIVE",
    },
    {
      quotation: { ...raw, id: "other", status: "CONVERTED", projectId: "p" },
      projectId: "p",
      projectStatus: "ACTIVE",
    },
  ])("rejects unverified conversion responses %#", async (data) => {
    vi.mocked(client.patch).mockResolvedValue({ data } as never);
    await expect(convertQuotationToProject("q", {})).rejects.toThrow(
      "could not be verified",
    );
  });
  it("preserves failures so callers do not mark a failed conversion successful", async () => {
    vi.mocked(client.patch).mockRejectedValue(new Error("Offline"));
    await expect(convertQuotationToProject("q", {})).rejects.toThrow("Offline");
  });
});

it("rejects a malformed detail response instead of inventing an actionable ID", async () => {
  vi.mocked(client.get).mockResolvedValue({
    data: { status: "DRAFT" },
  } as never);
  await expect(api.getQuotationById("q")).rejects.toThrow(
    "could not be verified",
  );
});
