import { beforeEach, describe, expect, it, vi } from "vitest";

const get = vi.hoisted(() => vi.fn());
vi.mock("@/lib/axios", () => ({ default: { get } }));

import {
  getPortalDocumentDownloadUrl,
  getPortalProject,
  listPortalDocuments,
  listPortalMilestones,
  listPortalProjects,
  listPortalQuotations,
} from "@/services/portalApi";

beforeEach(() => get.mockReset());

describe("portal API", () => {
  it("only calls client-scoped routes with pagination", async () => {
    get.mockResolvedValue({
      data: [],
      meta: { total: 0, page: 2, limit: 5, totalPages: 0 },
    });
    await listPortalProjects(2, 5);
    await listPortalQuotations();
    await listPortalDocuments("p/1", 3);
    expect(get.mock.calls.map(([url]) => url)).toEqual([
      "/client-portal/projects",
      "/client-portal/quotations",
      "/client-portal/projects/p%2F1/documents",
    ]);
    expect(get.mock.calls[0][1]).toEqual({ params: { page: 2, limit: 5 } });
    expect(get.mock.calls[1][1]).toEqual({ params: { page: 1, limit: 10 } });
  });

  it("maps empty results to an empty page", async () => {
    get.mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
    });
    expect(await listPortalProjects()).toEqual({
      items: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    });
    get.mockResolvedValue({ data: [] });
    expect((await listPortalQuotations()).items).toEqual([]);
    expect(await listPortalMilestones("p1")).toEqual([]);
  });

  it("rejects malformed responses instead of inventing records", async () => {
    get.mockResolvedValue({ data: { items: [] } });
    await expect(listPortalProjects()).rejects.toThrow("Unexpected response");
    await expect(listPortalMilestones("p1")).rejects.toThrow(
      "Unexpected response",
    );
    get.mockResolvedValue({ data: null });
    await expect(getPortalProject("p1")).rejects.toThrow("Unexpected response");
  });

  it("returns a validated signed download link", async () => {
    get.mockResolvedValue({
      data: { downloadUrl: "https://res.cloudinary.com/x/file.pdf" },
    });
    await expect(getPortalDocumentDownloadUrl("d1")).resolves.toBe(
      "https://res.cloudinary.com/x/file.pdf",
    );
    expect(get).toHaveBeenCalledWith("/client-portal/documents/d1/download");
    get.mockResolvedValue({ data: { downloadUrl: "javascript:alert(1)" } });
    await expect(getPortalDocumentDownloadUrl("d1")).rejects.toThrow();
    get.mockResolvedValue({ data: {} });
    await expect(getPortalDocumentDownloadUrl("d1")).rejects.toThrow(
      "No download link",
    );
  });
});
