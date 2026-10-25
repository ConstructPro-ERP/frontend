import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { Provider } from "react-redux";
import { beforeEach, expect, it, vi } from "vitest";
import apiClient from "@/lib/axios";
import { ApiError } from "@/lib/ApiError";
import { store } from "@/store";
import { loginSuccess } from "@/store/slices/authSlice";
import { dashboardQueryCache } from "@/lib/dashboardQueryCache";
import { getDashboardSummary } from "@/services/dashboardApi";
import {
  createFinanceInvoice,
  createInvoiceRequest,
} from "@/services/financeApi";
import {
  canCreateFinanceInvoice,
  createFinanceInvoiceFormValues,
  validateFinanceInvoiceForm,
} from "@/components/dashboard/finance/financeUtils";
import CreateInvoiceForm from "@/components/dashboard/finance/CreateInvoiceForm";
import FinanceDashboardClient from "@/components/dashboard/finance/FinanceDashboardClient";
import type { User } from "@/types/auth";

vi.mock("@/lib/axios", () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock("@/services/dashboardApi", () => ({ getDashboardSummary: vi.fn() }));

const options = {
  projects: [
    { id: "p1", projectName: "Site Alpha", customerIds: ["c1"] },
    { id: "p2", projectName: "Site Beta", customerIds: [] },
  ],
  customers: [
    { id: "c1", fullName: "Alice Customer" },
    { id: "c2", fullName: "Other Customer" },
  ],
};
const invoice = {
  id: "i1",
  invoiceNumber: "INV-1",
  project: { projectName: "Site Alpha" },
  customer: { fullName: "Alice Customer" },
  totalAmount: 125.5,
  paidAmount: 0,
  outstandingAmount: 125.5,
  invoiceDate: "2026-10-25",
  dueDate: null,
  status: "ISSUED",
  pdfUrl: null,
};
const valid = {
  ...createFinanceInvoiceFormValues(),
  projectId: "p1",
  customerId: "c1",
  invoiceDate: "2026-10-25",
  totalAmount: "125.50",
  status: "ISSUED" as const,
};

function login(role: User["role"] = "FINANCE") {
  store.dispatch(
    loginSuccess({
      user: {
        id: "user1",
        firstName: "Staff",
        lastName: "User",
        email: "staff@example.com",
        role,
      },
    }),
  );
}
function form(projectId?: string) {
  const created = vi.fn();
  render(
    <Provider store={store}>
      <CreateInvoiceForm
        projectId={projectId}
        onClose={vi.fn()}
        onCreated={created}
      />
    </Provider>,
  );
  return created;
}
async function fill() {
  await screen.findByRole("option", { name: "Site Alpha" });
  fireEvent.change(screen.getByLabelText("Project *"), {
    target: { value: "p1" },
  });
  fireEvent.change(screen.getByLabelText("Customer *"), {
    target: { value: "c1" },
  });
  fireEvent.change(screen.getByLabelText("Total amount (LKR) *"), {
    target: { value: "125.50" },
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  dashboardQueryCache.clear();
  login();
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
  vi.mocked(apiClient.get).mockImplementation(
    async (url) =>
      ({ data: url === "/invoices/creation-options" ? options : [] }) as never,
  );
  vi.mocked(apiClient.post).mockResolvedValue({ data: invoice } as never);
  vi.mocked(getDashboardSummary).mockResolvedValue({
    revenue: { totalRevenue: 0, paidAmount: 0, outstandingBalance: 0 },
  } as never);
});

it("validates required fields, real dates, amount precision, notes and status", () => {
  expect(validateFinanceInvoiceForm(valid)).toEqual({});
  const required = validateFinanceInvoiceForm(createFinanceInvoiceFormValues());
  expect(required).toHaveProperty("projectId");
  expect(required).toHaveProperty("customerId");
  expect(required).toHaveProperty("totalAmount");
  for (const totalAmount of [
    "0",
    "-1",
    "1.001",
    "1e3",
    "NaN",
    "Infinity",
    "",
    "10000000000",
  ])
    expect(
      validateFinanceInvoiceForm({ ...valid, totalAmount }).totalAmount,
    ).toBeTruthy();
  for (const invoiceDate of ["", "2026-02-30", "2026-13-01", "bad-date"])
    expect(
      validateFinanceInvoiceForm({ ...valid, invoiceDate }).invoiceDate,
    ).toBeTruthy();
  expect(
    validateFinanceInvoiceForm({ ...valid, dueDate: "2026-10-24" }).dueDate,
  ).toBeTruthy();
  expect(
    validateFinanceInvoiceForm({ ...valid, dueDate: "2026-02-30" }).dueDate,
  ).toBeTruthy();
  expect(
    validateFinanceInvoiceForm({ ...valid, notes: "x".repeat(2001) }).notes,
  ).toBeTruthy();
  expect(
    validateFinanceInvoiceForm({
      ...valid,
      notes: "x".repeat(2000),
      dueDate: "2026-10-25",
    }),
  ).toEqual({});
});

it("builds the payload and invalidates related caches only on successful creation", async () => {
  expect(createInvoiceRequest({ ...valid, notes: "  Note  " })).toEqual({
    projectId: "p1",
    customerId: "c1",
    invoiceDate: "2026-10-25",
    totalAmount: 125.5,
    status: "ISSUED",
    notes: "Note",
    dueDate: undefined,
  });
  const keys = [
    "finance:overview",
    "home:summary",
    "analytics:overview",
    "finance:invoice:i1",
  ];
  keys.forEach((key) => dashboardQueryCache.setData(key, () => "cached"));
  vi.mocked(apiClient.post).mockRejectedValueOnce(
    new ApiError(
      "Customer does not own project",
      400,
      "PROJECT_CUSTOMER_MISMATCH",
    ),
  );
  await expect(createFinanceInvoice(valid)).rejects.toThrow();
  expect(dashboardQueryCache.snapshot(keys[0]).updatedAt).toBeGreaterThan(0);
  await createFinanceInvoice(valid);
  expect(apiClient.post).toHaveBeenLastCalledWith(
    "/invoices",
    createInvoiceRequest(valid),
    { skipNetworkRetry: true },
  );
  keys.forEach((key) =>
    expect(dashboardQueryCache.snapshot(key).updatedAt).toBe(0),
  );
});

it.each(["ADMIN", "MANAGEMENT", "FINANCE", "ACCOUNTANT"] as const)(
  "allows %s to open invoice creation",
  async (role) => {
    login(role);
    form();
    expect(
      await screen.findByRole("option", { name: "Site Alpha" }),
    ).toBeTruthy();
  },
);

it.each([
  "PROJECT_MANAGER",
  "SALES_MANAGER",
  "CLIENT_PORTAL_USER",
  null,
] as const)("blocks %s without loading billing data", (role) => {
  login(role);
  form();
  expect(screen.getByRole("alert")).toBeTruthy();
  expect(apiClient.get).not.toHaveBeenCalled();
  expect(canCreateFinanceInvoice(role)).toBe(false);
});

it("preselects and locks the project shortcut, filtering customers by ownership", async () => {
  form("p1");
  await screen.findByRole("option", { name: "Alice Customer" });
  expect(
    (screen.getByLabelText("Project *") as HTMLSelectElement).disabled,
  ).toBe(true);
  expect((screen.getByLabelText("Project *") as HTMLSelectElement).value).toBe(
    "p1",
  );
  expect(screen.queryByRole("option", { name: "Other Customer" })).toBeNull();
});

it("displays field errors and does not submit invalid invoice details", async () => {
  form();
  await fill();
  fireEvent.change(screen.getByLabelText("Total amount (LKR) *"), {
    target: { value: "1.001" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Create Invoice" }));
  expect(
    screen.getByText(
      "Enter a positive amount with at most two decimal places.",
    ),
  ).toBeTruthy();
  expect(
    screen.getByLabelText("Total amount (LKR) *").getAttribute("aria-invalid"),
  ).toBe("true");
  expect(apiClient.post).not.toHaveBeenCalled();
});

it("allows retrying a failed project/customer lookup", async () => {
  vi.mocked(apiClient.get).mockRejectedValueOnce(
    new Error("Choices are unavailable"),
  );
  form();
  expect(await screen.findByRole("alert")).toHaveProperty(
    "textContent",
    expect.stringContaining("Choices are unavailable"),
  );
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(
    await screen.findByRole("option", { name: "Site Alpha" }),
  ).toBeTruthy();
  expect(apiClient.post).not.toHaveBeenCalled();
});

it("prevents duplicate submissions while a request is pending", async () => {
  let finish!: (value: unknown) => void;
  vi.mocked(apiClient.post).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }) as never,
  );
  const created = form();
  await fill();
  const element = screen
    .getByRole("button", { name: "Create Invoice" })
    .closest("form")!;
  fireEvent.submit(element);
  fireEvent.submit(element);
  expect(apiClient.post).toHaveBeenCalledTimes(1);
  expect(screen.getByText("Creating invoice…")).toBeTruthy();
  await act(async () => {
    finish({ data: invoice });
  });
  expect(created).toHaveBeenCalledTimes(1);
});

it("shows backend relationship errors and keeps form values available for correction", async () => {
  vi.mocked(apiClient.post).mockRejectedValueOnce(
    new ApiError(
      "The selected customer does not own this project.",
      400,
      "PROJECT_CUSTOMER_MISMATCH",
    ),
  );
  form();
  await fill();
  fireEvent.click(screen.getByRole("button", { name: "Create Invoice" }));
  expect(await screen.findByRole("alert")).toHaveProperty(
    "textContent",
    expect.stringContaining("does not own this project"),
  );
  expect(
    (screen.getByLabelText("Total amount (LKR) *") as HTMLInputElement).value,
  ).toBe("125.50");
});

it("refreshes invoice listings and dashboard summaries after creation", async () => {
  let created = false;
  vi.mocked(apiClient.get).mockImplementation(
    async (url) =>
      ({
        data:
          url === "/invoices/creation-options"
            ? options
            : created
              ? [invoice]
              : [],
      }) as never,
  );
  vi.mocked(apiClient.post).mockImplementation(async () => {
    created = true;
    return { data: invoice } as never;
  });
  render(
    <Provider store={store}>
      <FinanceDashboardClient />
    </Provider>,
  );
  await screen.findByText("No invoices available");
  fireEvent.click(screen.getByRole("button", { name: "Create Invoice" }));
  await fill();
  const summaryCalls = vi.mocked(getDashboardSummary).mock.calls.length;
  const buttons = screen.getAllByRole("button", { name: "Create Invoice" });
  fireEvent.click(buttons[buttons.length - 1]);
  expect(await screen.findByText("INV-1 created successfully.")).toBeTruthy();
  expect(await screen.findByText("INV-1")).toBeTruthy();
  await waitFor(() =>
    expect(vi.mocked(getDashboardSummary).mock.calls.length).toBeGreaterThan(
      summaryCalls,
    ),
  );
});
