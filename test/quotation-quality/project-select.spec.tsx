import { beforeEach, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProjectSelect from "@/components/dashboard/quotations/ProjectSelectDropdown";
import { listProjects } from "@/services/projectsApi";
import { ApiError } from "@/lib/ApiError";
import type { Project } from "@/types/project";

vi.mock("@/services/projectsApi", () => ({ listProjects: vi.fn() }));
const id = "550e8400-e29b-41d4-a716-446655440000";
const project = { id, projectName: "Lotus Villa" } as Project;
const meta = { page: 1, limit: 20, total: 21, totalPages: 2 };
beforeEach(() => vi.resetAllMocks());

it("loads later pages and searches on the server starting from page one", async () => {
  vi.mocked(listProjects)
    .mockResolvedValueOnce({ data: [], meta })
    .mockResolvedValueOnce({ data: [project], meta: { ...meta, page: 2 } })
    .mockResolvedValue({ data: [project], meta: { ...meta, totalPages: 1 } });
  const onChange = vi.fn();
  render(<ProjectSelect value="" onChange={onChange} />);
  expect(screen.getByRole("status").textContent).toBe("Loading projects...");
  await screen.findByText("No matching projects found.");
  await userEvent.click(screen.getByRole("button", { name: "Next projects" }));
  await screen.findByRole("option", { name: `Lotus Villa — ${id}` });
  expect(listProjects).toHaveBeenLastCalledWith({
    search: "",
    page: 2,
    limit: 20,
  });
  await userEvent.selectOptions(screen.getByRole("combobox"), id);
  expect(onChange).toHaveBeenCalledWith(id);
  await userEvent.type(
    screen.getByLabelText("Search projects by name or UUID"),
    "Lotus",
  );
  await waitFor(() =>
    expect(listProjects).toHaveBeenLastCalledWith({
      search: "Lotus",
      page: 1,
      limit: 20,
    }),
  );
});

it("shows access errors and the backend role dependency, then supports retry", async () => {
  vi.mocked(listProjects)
    .mockRejectedValueOnce(new ApiError("Forbidden", 403, "FORBIDDEN"))
    .mockResolvedValue({
      data: [],
      meta: { ...meta, total: 0, totalPages: 0 },
    });
  render(<ProjectSelect value="" onChange={vi.fn()} />);
  expect((await screen.findByRole("alert")).textContent).toContain(
    "Sales Managers need backend permission",
  );
  expect((screen.getByRole("combobox") as HTMLSelectElement).disabled).toBe(
    true,
  );
  await userEvent.click(screen.getByRole("button", { name: "Retry projects" }));
  await screen.findByText("No matching projects found.");
});

it("shows backend failures without presenting a false empty result", async () => {
  vi.mocked(listProjects).mockRejectedValue(
    new Error("Project service unavailable"),
  );
  render(<ProjectSelect value="" onChange={vi.fn()} />);
  expect((await screen.findByRole("alert")).textContent).toContain(
    "Project service unavailable",
  );
  expect(screen.queryByText("No matching projects found.")).toBeNull();
});
