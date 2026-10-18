import { beforeEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Quotation } from "@/types/quotation";
import { ApiError } from "@/lib/ApiError";
import { convertQuotationToProject } from "@/services/projectConversionApi";
import {
  updateQuotation,
  rejectQuotation,
  getQuotationById,
} from "@/services/quotationsApi";
import Convert from "@/components/dashboard/quotations/modals/ConvertToProjectModal";
import Edit from "@/components/dashboard/quotations/modals/EditQuotationModal";
import Reject from "@/components/dashboard/quotations/modals/RejectQuotationModal";

vi.mock("@/services/projectConversionApi", () => ({
  convertQuotationToProject: vi.fn(),
}));
vi.mock("@/services/quotationsApi", () => ({
  updateQuotation: vi.fn(),
  rejectQuotation: vi.fn(),
  getQuotationById: vi.fn(),
}));

const uuid = "550e8400-e29b-41d4-a716-446655440000";
const q: Quotation = {
  id: "q",
  leadId: uuid,
  status: "APPROVED",
  quotationDate: "2026-10-12",
  totalAmount: 100,
  pdfUrl: null,
  projectId: null,
  notes: null,
  items: [{ id: "i", itemName: "x", quantity: 1, unitPrice: 100, amount: 100 }],
};
const callbacks = {
  onClose: vi.fn(),
  onSuccess: vi.fn(),
  onAlreadyConverted: vi.fn(),
};
beforeEach(() => vi.resetAllMocks());
function submit() {
  fireEvent.submit(screen.getByRole("dialog").querySelector("form")!);
}

it("requires the new project manager UUID before conversion", async () => {
  render(<Convert quotation={q} isOpen {...callbacks} />);
  submit();
  await screen.findByText("A valid project manager UUID is required.");
  expect(convertQuotationToProject).not.toHaveBeenCalled();
});

it("validates target IDs and allows a valid existing project", async () => {
  vi.mocked(convertQuotationToProject).mockResolvedValue({
    quotation: { ...q, status: "CONVERTED", projectId: uuid },
    projectId: uuid,
    projectStatus: "ACTIVE",
  });
  render(<Convert quotation={q} isOpen {...callbacks} />);
  await userEvent.click(
    screen.getByRole("button", { name: /Link.*Existing/i }),
  );
  submit();
  await screen.findByText("A valid target project UUID is required.");
  await userEvent.type(
    screen.getByRole("textbox", { name: "Target project ID" }),
    uuid,
  );
  submit();
  await waitFor(() => expect(callbacks.onSuccess).toHaveBeenCalled());
  expect(convertQuotationToProject).toHaveBeenCalledWith("q", {
    targetProjectId: uuid,
  });
});

it("keeps unrelated conflicts visible instead of marking converted", async () => {
  vi.mocked(convertQuotationToProject).mockRejectedValue(
    new ApiError("Different project", 409, "QUOTATION_PROJECT_MISMATCH"),
  );
  render(<Convert quotation={q} isOpen {...callbacks} />);
  await userEvent.type(
    screen.getByRole("textbox", { name: "Project manager ID" }),
    uuid,
  );
  submit();
  await screen.findByText("Different project");
  expect(callbacks.onAlreadyConverted).not.toHaveBeenCalled();
  expect(callbacks.onSuccess).not.toHaveBeenCalled();
});

it("requests authoritative refresh only for ALREADY_CONVERTED", async () => {
  const convertedQuotation: Quotation = {
    ...q,
    status: "CONVERTED",
    projectId: uuid,
  };

  vi.mocked(convertQuotationToProject).mockRejectedValue(
    new ApiError("Already converted", 409, "ALREADY_CONVERTED"),
  );

  vi.mocked(getQuotationById).mockResolvedValue(convertedQuotation);

  render(<Convert quotation={q} isOpen {...callbacks} />);

  await userEvent.type(
    screen.getByRole("textbox", { name: "Project manager ID" }),
    uuid,
  );

  submit();

  await waitFor(() => {
    expect(callbacks.onAlreadyConverted).toHaveBeenCalledWith(
      convertedQuotation,
    );
  });

  expect(getQuotationById).toHaveBeenCalledWith(q.id);
  expect(callbacks.onSuccess).not.toHaveBeenCalled();
  expect(callbacks.onClose).toHaveBeenCalled();
});

it.each(["APPROVED", "CONVERTED"] as const)(
  "locks %s quotation editing",
  async (status) => {
    render(<Edit quotation={{ ...q, status }} isOpen {...callbacks} />);
    submit();
    expect(updateQuotation).not.toHaveBeenCalled();
    expect(
      (
        screen.getByRole("button", {
          name: "Save Quotation",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  },
);

it("validates edit amounts then saves only once", async () => {
  vi.mocked(updateQuotation).mockReturnValue(new Promise(() => {}));
  render(<Edit quotation={{ ...q, status: "DRAFT" }} isOpen {...callbacks} />);
  fireEvent.change(
    screen.getByRole("spinbutton", { name: "Item 1 unit price" }),
    { target: { value: "1.005" } },
  );
  submit();
  await screen.findByText(/at most two decimal places/);
  expect(updateQuotation).not.toHaveBeenCalled();
  fireEvent.change(
    screen.getByRole("spinbutton", { name: "Item 1 unit price" }),
    { target: { value: "1.05" } },
  );
  submit();
  submit();
  expect(updateQuotation).toHaveBeenCalledTimes(1);
});

it("rejects only after a reason and prevents repeated submission", async () => {
  vi.mocked(rejectQuotation).mockReturnValue(new Promise(() => {}));
  render(
    <Reject
      quotation={{ ...q, status: "PENDING_APPROVAL" }}
      isOpen
      {...callbacks}
    />,
  );
  submit();
  expect(rejectQuotation).not.toHaveBeenCalled();
  const textarea = screen.getByRole("textbox");
  await userEvent.type(textarea, "Too expensive");
  submit();
  submit();
  expect(rejectQuotation).toHaveBeenCalledTimes(1);
});

it("edits name, quantity, price and notes then reports save failure", async () => {
  vi.mocked(updateQuotation).mockRejectedValue(new Error("Save failed"));
  render(<Edit quotation={{ ...q, status: "DRAFT" }} isOpen {...callbacks} />);
  await userEvent.clear(
    screen.getByRole("textbox", { name: "Item 1 description" }),
  );
  await userEvent.type(
    screen.getByRole("textbox", { name: "Item 1 description" }),
    "Changed",
  );
  fireEvent.change(
    screen.getByRole("spinbutton", { name: "Item 1 quantity" }),
    { target: { value: "2" } },
  );
  fireEvent.change(
    screen.getByRole("spinbutton", { name: "Item 1 unit price" }),
    { target: { value: "1.05" } },
  );
  await userEvent.type(
    screen.getByRole("textbox", { name: "Scope and terms notes" }),
    "Notes",
  );
  submit();
  await screen.findByText("Save failed");
  expect(callbacks.onSuccess).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(callbacks.onClose).toHaveBeenCalled();
});

it("validates project fields and allows a zero budget", async () => {
  render(<Convert quotation={q} isOpen {...callbacks} />);
  await userEvent.clear(screen.getByRole("textbox", { name: "Project name" }));
  submit();
  await screen.findByText("Project name is required.");
  await userEvent.type(
    screen.getByRole("textbox", { name: "Project name" }),
    "Project",
  );
  fireEvent.change(screen.getByLabelText("Start date"), {
    target: { value: "" },
  });
  submit();
  await screen.findByText("Start date is required.");
  fireEvent.change(screen.getByLabelText("Start date"), {
    target: { value: "2026-10-12" },
  });
  fireEvent.change(screen.getByRole("spinbutton", { name: "Initial budget" }), {
    target: { value: "-1" },
  });
  submit();
  await screen.findByText("Budget must be zero or greater.");
  fireEvent.change(screen.getByRole("spinbutton", { name: "Initial budget" }), {
    target: { value: "0" },
  });
  await userEvent.type(
    screen.getByRole("textbox", { name: "Project manager ID" }),
    uuid,
  );
  vi.mocked(convertQuotationToProject).mockResolvedValue({
    quotation: { ...q, status: "CONVERTED", projectId: uuid },
    projectId: uuid,
    projectStatus: "ACTIVE",
  });
  submit();
  await waitFor(() => expect(callbacks.onSuccess).toHaveBeenCalled());
  expect(convertQuotationToProject).toHaveBeenCalledWith(
    "q",
    expect.objectContaining({ budget: 0 }),
  );
});

it("surfaces reject failure and supports closing", async () => {
  vi.mocked(rejectQuotation).mockRejectedValue(new Error("Reject failed"));
  render(
    <Reject
      quotation={{ ...q, status: "PENDING_APPROVAL" }}
      isOpen
      {...callbacks}
    />,
  );
  await userEvent.type(screen.getByRole("textbox"), "Reason");
  submit();
  await screen.findByText("Reject failed");
  await userEvent.click(screen.getByRole("button", { name: "Close dialog" }));
  expect(callbacks.onClose).toHaveBeenCalled();
});
