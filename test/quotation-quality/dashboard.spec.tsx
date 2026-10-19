import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Quotation } from "@/types/quotation";
import { ApiError } from "@/lib/ApiError";
import { dashboardQueryCache } from "@/lib/dashboardQueryCache";
const context = vi.hoisted(() => ({ role: "SALES_MANAGER" }));
vi.mock("react-redux", () => ({ useSelector: () => context }));
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));
vi.mock("@/components/dashboard/quotations/LeadSelectDropdown", () => ({
  default: ({
    value,
    onChange,
    disabled,
  }: {
    value: string;
    onChange: (value: string) => void;
    disabled: boolean;
  }) => (
    <input
      aria-label="Lead"
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));
vi.mock("@/components/dashboard/leads/leadApi", () => ({
  getLead: vi.fn().mockResolvedValue({
    id: "550e8400-e29b-41d4-a716-446655440000",
    customerName: "Acme",
  }),
}));
vi.mock("@/services/quotationsApi", () => ({
  listQuotations: vi.fn(),
  getQuotationById: vi.fn(),
  createQuotation: vi.fn(),
  approveQuotation: vi.fn(),
  submitQuotation: vi.fn(),
  reviseQuotation: vi.fn(),
  getQuotationPdf: vi.fn(),
  updateQuotation: vi.fn(),
  rejectQuotation: vi.fn(),
}));
vi.mock("@/services/projectConversionApi", () => ({
  convertQuotationToProject: vi.fn(),
}));
import * as api from "@/services/quotationsApi";
import { convertQuotationToProject } from "@/services/projectConversionApi";
import Dashboard from "@/components/dashboard/quotations/QuotationsDashboardClient";
const uuid = "550e8400-e29b-41d4-a716-446655440000";
const base: Quotation = {
  id: "q",
  leadId: uuid,
  quotationDate: "2026-10-12",
  status: "PENDING_APPROVAL",
  totalAmount: 99.99,
  pdfUrl: null,
  notes: null,
  projectId: null,
  items: [
    {
      id: "i",
      itemName: "Concrete",
      quantity: 3,
      unitPrice: 33.33,
      amount: 99.99,
    },
  ],
  lead: { customerName: "Acme" },
};
function list(status: Quotation["status"] = "PENDING_APPROVAL") {
  vi.mocked(api.listQuotations).mockResolvedValue({
    items: [{ ...base, status }],
    total: 1,
    totalPages: 1,
  });
}
async function mount() {
  render(<Dashboard />);
  await screen.findByText("Acme");
}
beforeEach(() => {
  vi.resetAllMocks();
  dashboardQueryCache.clear();
  context.role = "SALES_MANAGER";
  list();
  vi.mocked(api.approveQuotation).mockResolvedValue({
    ...base,
    status: "APPROVED",
  });
  vi.mocked(api.getQuotationById).mockResolvedValue(base);
});
describe("Quotation dashboard interactions", () => {
  it.each(["PROJECT_MANAGER", "ACCOUNTANT", "MANAGER", "CLIENT_PORTAL_USER"])(
    "hides write controls for %s",
    async (role) => {
      context.role = role;
      await mount();
      for (const name of [
        /Edit quotation/,
        /Approve quotation/,
        /Convert quotation/,
        /Reject quotation/,
        /Generate Quotation/,
      ])
        expect(screen.queryByRole("button", { name })).toBeNull();
      expect(
        screen.getByRole("button", { name: /Download or view PDF/ }),
      ).toBeTruthy();
      expect(screen.getByText("Quotation generation restricted")).toBeTruthy();
    },
  );
  it("approves once and locks editing without converting", async () => {
    let resolve: (value: Quotation) => void = () => {};
    vi.mocked(api.approveQuotation).mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    await mount();
    const button = screen.getByRole("button", { name: "Approve quotation q" });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(api.approveQuotation).toHaveBeenCalledTimes(1);
    resolve({ ...base, status: "APPROVED" });
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "Edit quotation q" }),
      ).toBeNull(),
    );
    expect(convertQuotationToProject).not.toHaveBeenCalled();
  });
  it("submits draft and revises rejected quotations through their separate routes", async () => {
    list("DRAFT");
    vi.mocked(api.submitQuotation).mockResolvedValue(base);
    await mount();
    expect(
      screen.queryByRole("button", { name: "Approve quotation q" }),
    ).toBeNull();
    await userEvent.click(
      screen.getByRole("button", { name: "Submit quotation q for approval" }),
    );
    await waitFor(() => expect(api.submitQuotation).toHaveBeenCalledWith("q"));
  });
  it("revises only rejected quotations", async () => {
    list("REJECTED");
    vi.mocked(api.reviseQuotation).mockResolvedValue({
      ...base,
      status: "DRAFT",
    });
    await mount();
    list("DRAFT");
    await userEvent.click(
      screen.getByRole("button", { name: "Revise quotation q" }),
    );
    await screen.findByRole("button", {
      name: "Submit quotation q for approval",
    });
    expect(api.reviseQuotation).toHaveBeenCalledTimes(1);
  });
  it("uses server pagination beyond the first response page", async () => {
    vi.mocked(api.listQuotations).mockResolvedValue({
      items: [base],
      total: 40,
      totalPages: 8,
    });
    await mount();
    expect(api.listQuotations).toHaveBeenCalledWith({
      status: "ALL",
      page: 1,
      limit: 5,
      search: undefined,
    });
    await userEvent.click(screen.getByRole("button", { name: "Next page" }));
    await waitFor(() =>
      expect(api.listQuotations).toHaveBeenCalledWith({
        status: "ALL",
        page: 2,
        limit: 5,
        search: undefined,
      }),
    );
  });
  it("shows service failures without synthetic quotation records", async () => {
    vi.mocked(api.listQuotations).mockRejectedValue(
      new ApiError("Offline", 503),
    );
    render(<Dashboard />);
    await screen.findByText("Failed to Load Quotations");
    expect(screen.queryByText("Skyline Heights")).toBeNull();
    expect(screen.getByRole("button", { name: "Retry" })).toBeTruthy();
  });
  it("reserves the PDF tab synchronously then opens only a verified URL", async () => {
    const tab = { opener: window, location: { href: "" }, close: vi.fn() };
    const open = vi
      .spyOn(window, "open")
      .mockReturnValue(tab as unknown as Window);
    vi.mocked(api.getQuotationPdf).mockResolvedValue({
      pdfUrl: "https://example.com/q.pdf",
    });
    await mount();
    await userEvent.click(
      screen.getByRole("button", { name: /Download or view PDF/ }),
    );
    await waitFor(() =>
      expect(tab.location.href).toBe("https://example.com/q.pdf"),
    );
    expect(tab.opener).toBeNull();
    expect(open).toHaveBeenCalledWith("", "_blank");
    open.mockRestore();
  });
  it("closes the reserved PDF tab on failure", async () => {
    const tab = { opener: null, location: { href: "" }, close: vi.fn() };
    const open = vi
      .spyOn(window, "open")
      .mockReturnValue(tab as unknown as Window);
    vi.mocked(api.getQuotationPdf).mockRejectedValue(new Error("Offline"));
    await mount();
    await userEvent.click(
      screen.getByRole("button", { name: /Download or view PDF/ }),
    );
    await screen.findByText(
      "Failed to generate quotation PDF. Please try again.",
    );
    expect(tab.close).toHaveBeenCalled();
    open.mockRestore();
  });
  it("explains popup blocking without making a PDF request", async () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    await mount();
    await userEvent.click(
      screen.getByRole("button", { name: /Download or view PDF/ }),
    );
    await screen.findByText(/Allow pop-ups/);
    expect(api.getQuotationPdf).not.toHaveBeenCalled();
    open.mockRestore();
  });
  it("validates fractional quantity before creation and prevents repeat create clicks", async () => {
    await mount();
    await userEvent.type(screen.getByRole("textbox", { name: "Lead" }), uuid);
    await userEvent.type(
      screen.getByRole("textbox", { name: "Item 1 name" }),
      "Steel",
    );
    fireEvent.change(
      screen.getByRole("spinbutton", { name: "Item 1 quantity" }),
      { target: { value: "1.5" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Generate Quotation" }));
    await screen.findByText(/quantity must be a positive whole number/);
    expect(api.createQuotation).not.toHaveBeenCalled();
    fireEvent.change(
      screen.getByRole("spinbutton", { name: "Item 1 quantity" }),
      { target: { value: "1" } },
    );
    vi.mocked(api.createQuotation).mockReturnValue(new Promise(() => {}));
    const button = screen.getByRole("button", {
      name: "Generate Quotation",
    });
    fireEvent.click(button);
    fireEvent.click(button);
    await waitFor(() => expect(api.createQuotation).toHaveBeenCalledTimes(1));
  });
  it("converts to a real project and exposes its verified ID without fabricated routes", async () => {
    list("APPROVED");
    vi.mocked(api.getQuotationById).mockResolvedValue({
      ...base,
      status: "CONVERTED",
      projectId: uuid,
    });
    vi.mocked(convertQuotationToProject).mockResolvedValue({
      quotation: { ...base, status: "CONVERTED", projectId: uuid },
      projectId: uuid,
      projectStatus: "ACTIVE",
    });
    await mount();
    await userEvent.click(
      screen.getByRole("button", { name: "Convert quotation q to project" }),
    );
    await userEvent.type(
      screen.getByRole("textbox", { name: "Project manager ID" }),
      uuid,
    );
    vi.mocked(api.listQuotations).mockResolvedValue({
      items: [{ ...base, status: "CONVERTED", projectId: uuid }],
      total: 1,
      totalPages: 1,
    });
    const form = screen.getByRole("dialog").querySelector("form")!;
    fireEvent.submit(form);
    fireEvent.submit(form);
    await screen.findByRole("link", { name: /Converted to Project/ });
    expect(convertQuotationToProject).toHaveBeenCalledTimes(1);
    expect(api.getQuotationById).toHaveBeenCalledWith("q");
    expect(
      screen
        .getByRole("link", { name: /Converted to Project/ })
        .getAttribute("href"),
    ).toBe(`/dashboard/projects/${uuid}`);
    expect(
      screen.queryByRole("button", { name: "Edit quotation q" }),
    ).toBeNull();
  });
  it("keeps the verified project link when the post-conversion refresh fails", async () => {
    list("APPROVED");
    vi.mocked(convertQuotationToProject).mockResolvedValue({
      quotation: { ...base, status: "CONVERTED", projectId: uuid },
      projectId: uuid,
      projectStatus: "ACTIVE",
    });
    vi.mocked(api.getQuotationById).mockRejectedValue(
      new Error("Refresh unavailable"),
    );
    await mount();
    await userEvent.click(
      screen.getByRole("button", { name: "Convert quotation q to project" }),
    );
    await userEvent.type(
      screen.getByRole("textbox", { name: "Project manager ID" }),
      uuid,
    );
    fireEvent.submit(screen.getByRole("dialog").querySelector("form")!);
    await screen.findByText(
      /Conversion succeeded, but the quotation could not be refreshed: Refresh unavailable/,
    );
    expect(
      screen
        .getByRole("link", { name: /Open linked project/i })
        .getAttribute("href"),
    ).toBe(`/dashboard/projects/${uuid}`);
    expect(convertQuotationToProject).toHaveBeenCalledTimes(1);
  });
});

it("runs create, edit, reject, revise, submit, approve, and conversion through rendered controls", async () => {
  vi.mocked(api.listQuotations).mockResolvedValue({
    items: [],
    total: 0,
    totalPages: 0,
  });
  vi.mocked(api.createQuotation).mockResolvedValue(base);
  vi.mocked(api.getQuotationById).mockResolvedValue(base);
  vi.mocked(api.updateQuotation).mockResolvedValue({
    ...base,
    notes: "Updated",
  });
  vi.mocked(api.rejectQuotation).mockResolvedValue({
    ...base,
    status: "REJECTED",
  });
  vi.mocked(api.reviseQuotation).mockResolvedValue({
    ...base,
    status: "DRAFT",
  });
  vi.mocked(api.submitQuotation).mockResolvedValue(base);
  vi.mocked(convertQuotationToProject).mockImplementation(async () => {
    vi.mocked(api.getQuotationById).mockResolvedValue({
      ...base,
      status: "CONVERTED",
      projectId: uuid,
    });
    return {
      quotation: { ...base, status: "CONVERTED", projectId: uuid },
      projectId: uuid,
      projectStatus: "ACTIVE",
    };
  });
  vi.mocked(api.listQuotations).mockImplementation(async () => {
    const writes = [
      api.createQuotation,
      api.updateQuotation,
      api.rejectQuotation,
      api.reviseQuotation,
      api.submitQuotation,
      api.approveQuotation,
      convertQuotationToProject,
    ];
    let latest = 0;
    let value: Quotation | undefined;
    for (const write of writes) {
      const mock = vi.mocked(write).mock;
      const index = mock.results.length - 1;
      const order = mock.invocationCallOrder[index] ?? 0;
      if (order > latest) {
        latest = order;
        const result = await mock.results[index].value;
        value = result && "quotation" in result ? result.quotation : result;
      }
    }
    return { items: value ? [value] : [], total: value ? 1 : 0, totalPages: 1 };
  });
  render(<Dashboard />);
  await screen.findByText("No quotations created yet");
  await userEvent.type(screen.getByRole("textbox", { name: "Lead" }), uuid);
  await userEvent.type(
    screen.getByRole("textbox", { name: "Item 1 name" }),
    "Concrete",
  );
  fireEvent.change(
    screen.getByRole("spinbutton", { name: "Item 1 quantity" }),
    { target: { value: "3" } },
  );
  fireEvent.change(
    screen.getByRole("spinbutton", { name: "Item 1 unit price" }),
    { target: { value: "33.33" } },
  );
  await userEvent.type(
    screen.getByRole("textbox", { name: "Optional notes for this quotation" }),
    "Terms",
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Add item to quotation" }),
  );
  await userEvent.click(screen.getByRole("button", { name: "Remove item 2" }));
  await userEvent.click(
    screen.getByRole("button", { name: "Generate Quotation" }),
  );
  await screen.findByText("Acme");
  await userEvent.click(
    screen.getByRole("button", { name: "Edit quotation q" }),
  );
  await userEvent.click(screen.getByRole("button", { name: "Add Item" }));
  await userEvent.type(
    screen.getByRole("textbox", { name: "Item 2 description" }),
    "Steel",
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Remove line item 2" }),
  );
  await userEvent.type(
    screen.getByRole("textbox", { name: "Scope and terms notes" }),
    "Updated",
  );
  await userEvent.click(screen.getByRole("button", { name: "Save Quotation" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  await userEvent.click(
    screen.getByRole("button", { name: "Reject quotation q" }),
  );
  await userEvent.type(
    screen.getByRole("dialog").querySelector("textarea")!,
    "Revise cost",
  );
  fireEvent.submit(screen.getByRole("dialog").querySelector("form")!);
  await screen.findByRole("button", { name: "Revise quotation q" });
  await userEvent.click(
    screen.getByRole("button", { name: "Revise quotation q" }),
  );
  await userEvent.click(
    await screen.findByRole("button", {
      name: "Submit quotation q for approval",
    }),
  );
  await userEvent.click(
    await screen.findByRole("button", { name: "Approve quotation q" }),
  );
  await userEvent.click(
    await screen.findByRole("button", {
      name: "Convert quotation q to project",
    }),
  );
  await userEvent.type(
    screen.getByRole("textbox", { name: "Project manager ID" }),
    uuid,
  );
  fireEvent.submit(screen.getByRole("dialog").querySelector("form")!);
  await screen.findByRole("link", { name: /Converted to Project/ });
  expect(api.createQuotation).toHaveBeenCalledTimes(1);
  expect(api.updateQuotation).toHaveBeenCalledTimes(1);
  expect(api.rejectQuotation).toHaveBeenCalledTimes(1);
});

it("updates server filters and search without losing pagination", async () => {
  vi.mocked(api.listQuotations).mockResolvedValue({
    items: [base],
    total: 40,
    totalPages: 8,
  });
  await mount();
  await userEvent.click(screen.getByRole("button", { name: "Next page" }));
  await screen.findByText("Page 2 of 8");
  await userEvent.click(screen.getByRole("button", { name: "Previous page" }));
  await userEvent.type(
    screen.getByRole("textbox", { name: "Search quotations" }),
    "Acme",
  );
  await waitFor(() =>
    expect(api.listQuotations).toHaveBeenCalledWith({
      status: "ALL",
      page: 1,
      limit: 5,
      search: "Acme",
    }),
  );
  await userEvent.click(screen.getByRole("button", { name: "Clear search" }));
  await userEvent.click(screen.getByRole("button", { name: "Approved" }));
  await waitFor(() =>
    expect(api.listQuotations).toHaveBeenCalledWith({
      status: "APPROVED",
      page: 1,
      limit: 5,
      search: undefined,
    }),
  );
});

it("shows failed approval and allows a deliberate retry", async () => {
  vi.mocked(api.approveQuotation).mockRejectedValue(
    new ApiError("Offline", 502),
  );
  await mount();
  await userEvent.click(
    screen.getByRole("button", { name: "Approve quotation q" }),
  );
  await screen.findByText(/Quotation service is unavailable/);
  expect(
    screen.getByRole("button", { name: "Approve quotation q" }),
  ).toBeTruthy();
});

it("refreshes authoritative project linkage after already-converted response", async () => {
  list("APPROVED");
  vi.mocked(convertQuotationToProject).mockRejectedValue(
    new ApiError("Already converted", 409, "ALREADY_CONVERTED"),
  );
  vi.mocked(api.getQuotationById).mockResolvedValue({
    ...base,
    status: "CONVERTED",
    projectId: uuid,
  });
  await mount();
  await userEvent.click(
    screen.getByRole("button", { name: "Convert quotation q to project" }),
  );
  await userEvent.type(
    screen.getByRole("textbox", { name: "Project manager ID" }),
    uuid,
  );
  fireEvent.submit(screen.getByRole("dialog").querySelector("form")!);
  await screen.findByRole("link", { name: /Converted to Project/ });
  expect(api.getQuotationById).toHaveBeenCalledWith("q");
});

it("reuses quotation responses on remount and preserves drafts during a failed background refresh", async () => {
  let now = 1000;
  const clock = vi.spyOn(Date, "now").mockImplementation(() => now);
  const view = render(<Dashboard />);
  await screen.findByText("Acme");
  view.unmount();
  render(<Dashboard />);
  expect(screen.getByText("Acme")).toBeTruthy();
  expect(api.listQuotations).toHaveBeenCalledTimes(1);
  fireEvent.change(
    screen.getByRole("textbox", { name: "Optional notes for this quotation" }),
    {
      target: { value: "Unsaved terms" },
    },
  );
  vi.mocked(api.listQuotations).mockRejectedValue(new Error("Offline"));
  now += 61000;
  fireEvent.focus(window);
  await screen.findByRole("button", { name: "Retry refresh" });
  expect(screen.getByText("Acme")).toBeTruthy();
  expect(
    (
      screen.getByRole("textbox", {
        name: "Optional notes for this quotation",
      }) as HTMLTextAreaElement
    ).value,
  ).toBe("Unsaved terms");
  clock.mockRestore();
});

it("reuses a visited status filter without another request", async () => {
  await mount();
  await userEvent.click(screen.getByRole("button", { name: "Draft" }));
  await waitFor(() => expect(api.listQuotations).toHaveBeenCalledTimes(2));
  await screen.findByText("Acme");
  await userEvent.click(screen.getByRole("button", { name: "All Quotations" }));
  expect(screen.getByText("Acme")).toBeTruthy();
  expect(api.listQuotations).toHaveBeenCalledTimes(2);
});
