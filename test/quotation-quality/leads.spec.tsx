import { beforeEach, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
vi.mock("@/lib/axios", () => ({ default: { get: vi.fn() } }));
import client from "@/lib/axios";
import LeadSelect from "@/components/dashboard/quotations/LeadSelectDropdown";
beforeEach(() => vi.resetAllMocks());
it.each([[], null])(
  "does not show invented leads for empty data %#",
  async (data) => {
    vi.mocked(client.get).mockResolvedValue({ data } as never);
    render(<LeadSelect value="" onChange={vi.fn()} />);
    await userEvent.click(
      screen.getByRole("button", { name: /Choose a lead/ }),
    );
    expect(screen.queryByText("Skyline Heights Development")).toBeNull();
  },
);
it("does not substitute demo IDs when the lead service fails", async () => {
  vi.mocked(client.get).mockRejectedValue(new Error("Offline"));
  render(<LeadSelect value="" onChange={vi.fn()} />);
  await userEvent.click(screen.getByRole("button", { name: /Choose a lead/ }));
  expect(screen.queryByText("Skyline Heights Development")).toBeNull();
});
it("selects a real lead and returns its server ID", async () => {
  vi.mocked(client.get).mockResolvedValue({
    data: { items: [{ id: "real-id", customerName: "Real Customer" }] },
  } as never);
  const change = vi.fn();
  render(<LeadSelect value="" onChange={change} />);
  await userEvent.click(screen.getByRole("button", { name: /Choose a lead/ }));
  await userEvent.click(
    await screen.findByRole("button", { name: /Real Customer/ }),
  );
  expect(change).toHaveBeenCalledWith(
    "real-id",
    expect.objectContaining({ id: "real-id" }),
  );
});
