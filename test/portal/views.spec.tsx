import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { Provider } from "react-redux";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/ApiError";
import { dashboardQueryCache } from "@/lib/dashboardQueryCache";
import { store } from "@/store";
import {
  authInitializationComplete,
  loginSuccess,
  logout,
} from "@/store/slices/authSlice";
import type { User } from "@/types/auth";

const nav = vi.hoisted(() => ({ pathname: "/portal" }));
vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));
vi.mock("next/image", () => ({
  default: (props: { alt: string }) => (
    <span role="img" aria-label={props.alt} />
  ),
}));

const api = vi.hoisted(() => ({
  listPortalProjects: vi.fn(),
  listPortalQuotations: vi.fn(),
  listPortalDocuments: vi.fn(),
  listPortalMilestones: vi.fn(),
  getPortalProject: vi.fn(),
  getPortalDocumentDownloadUrl: vi.fn(),
}));
vi.mock("@/services/portalApi", () => api);

import PortalShell from "@/components/portal/PortalShell";
import PortalProjects from "@/components/portal/PortalProjects";
import PortalQuotations from "@/components/portal/PortalQuotations";
import PortalProjectDetail from "@/components/portal/PortalProjectDetail";
import PortalBilling from "@/components/portal/PortalBilling";

const user = (role: User["role"], id = "u1"): User => ({
  id,
  email: `${id}@example.com`,
  firstName: "Casey",
  lastName: "Client",
  role,
});
const page = <T,>(items: T[]) => ({
  items,
  total: items.length,
  page: 1,
  limit: 10,
  totalPages: items.length ? 1 : 0,
});
const project = {
  id: "p1",
  projectName: "Lake House",
  location: "Galle",
  startDate: "2026-01-01T00:00:00.000Z",
  endDate: null,
  status: "ACTIVE",
  progressPercentage: 40,
  createdAt: "2026-01-01T00:00:00.000Z",
};
const planDocument = {
  id: "d1",
  projectId: "p1",
  originalName: "plan.pdf",
  mimeType: "application/pdf",
  fileSize: 2048,
  description: null,
  createdAt: "2026-02-01T00:00:00.000Z",
  category: { id: "c1", categoryName: "Plans" },
};

function renderWithStore(ui: React.ReactElement) {
  return render(<Provider store={store}>{ui}</Provider>);
}

function signIn(role: User["role"], id = "u1") {
  act(() => {
    store.dispatch(loginSuccess({ user: user(role, id) }));
  });
}

beforeEach(() => {
  Object.values(api).forEach((mock) => mock.mockReset());
  dashboardQueryCache.clear();
  nav.pathname = "/portal";
  act(() => {
    store.dispatch(logout());
    store.dispatch(authInitializationComplete());
  });
});
afterEach(() => {
  act(() => {
    store.dispatch(logout());
  });
});

describe("PortalShell access control", () => {
  it("asks signed-out visitors to sign in and renders no portal content", () => {
    renderWithStore(
      <PortalShell>
        <p>Secret projects</p>
      </PortalShell>,
    );
    expect(
      within(screen.getByRole("main")).getByRole("link", { name: "Sign in" }),
    ).toBeTruthy();
    expect(screen.queryByText("Secret projects")).toBeNull();
    expect(
      screen.queryByRole("navigation", { name: "Client portal" }),
    ).toBeNull();
  });

  it("denies staff and non-portal roles without rendering children", () => {
    for (const role of ["ADMIN", "CLIENT", "PROJECT_MANAGER", null] as const) {
      signIn(role);
      const { unmount } = renderWithStore(
        <PortalShell>
          <p>Secret projects</p>
        </PortalShell>,
      );
      expect(screen.getByRole("status").textContent).toContain(
        "only available to client accounts",
      );
      expect(screen.queryByText("Secret projects")).toBeNull();
      expect(api.listPortalProjects).not.toHaveBeenCalled();
      unmount();
    }
  });

  it("shows the portal shell, not the staff dashboard navigation, to clients", () => {
    signIn("CLIENT_PORTAL_USER");
    renderWithStore(
      <PortalShell>
        <p>Portal content</p>
      </PortalShell>,
    );
    expect(screen.getByText("Portal content")).toBeTruthy();
    const menu = screen.getByRole("navigation", { name: "Client portal" });
    expect(
      Array.from(menu.querySelectorAll("a")).map((a) => a.getAttribute("href")),
    ).toEqual([
      "/portal",
      "/portal/projects",
      "/portal/quotations",
      "/portal/billing",
      "/portal/documents",
    ]);
    expect(screen.queryByLabelText("Dashboard sidebar")).toBeNull();
    expect(
      within(menu)
        .getByRole("link", { name: "Overview" })
        .getAttribute("aria-current"),
    ).toBe("page");
  });
});

describe("portal sections", () => {
  beforeEach(() => signIn("CLIENT_PORTAL_USER"));

  it("shows loading, then API records", async () => {
    let resolve!: (value: unknown) => void;
    api.listPortalProjects.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    renderWithStore(<PortalProjects />);
    expect(screen.getByRole("status").textContent).toContain(
      "Loading projects",
    );
    await act(async () => resolve(page([project])));
    expect(await screen.findByText("Lake House")).toBeTruthy();
    expect(screen.getByText("Active")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Lake House" }).getAttribute("href"),
    ).toBe("/portal/projects/p1");
  });

  it("shows an empty state for a valid empty result", async () => {
    api.listPortalQuotations.mockResolvedValue(page([]));
    renderWithStore(<PortalQuotations />);
    expect(await screen.findByText("No quotations yet")).toBeTruthy();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("shows an error and recovers on retry", async () => {
    api.listPortalProjects
      .mockRejectedValueOnce(new ApiError("down", 0, "NETWORK_ERROR"))
      .mockResolvedValueOnce(page([project]));
    renderWithStore(<PortalProjects />);
    expect((await screen.findByRole("alert")).textContent).toContain(
      "could not reach the server",
    );
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(await screen.findByText("Lake House")).toBeTruthy();
    expect(api.listPortalProjects).toHaveBeenCalledTimes(2);
  });

  it("does not offer retry when the account is not linked to a client", async () => {
    api.listPortalQuotations.mockRejectedValue(
      new ApiError("x", 403, "CLIENT_PROFILE_NOT_LINKED"),
    );
    renderWithStore(<PortalQuotations />);
    expect((await screen.findByRole("alert")).textContent).toContain(
      "not linked",
    );
    expect(screen.queryByRole("button", { name: /try again/i })).toBeNull();
  });

  it("isolates sections: a failed milestones request leaves the project visible", async () => {
    api.getPortalProject.mockResolvedValue(project);
    api.listPortalMilestones.mockRejectedValue(new ApiError("x", 500, "E"));
    api.listPortalDocuments.mockResolvedValue(page([]));
    renderWithStore(<PortalProjectDetail projectId="p1" />);
    expect(
      await screen.findByRole("heading", { name: "Lake House" }),
    ).toBeTruthy();
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Something went wrong",
    );
    expect(await screen.findByText("No documents shared yet")).toBeTruthy();
  });

  it("is read-only: only a download action is offered", async () => {
    api.getPortalProject.mockResolvedValue(project);
    api.listPortalMilestones.mockResolvedValue([
      {
        id: "m1",
        projectId: "p1",
        milestoneName: "Foundation",
        description: null,
        dueDate: null,
        weight: 3,
        progressPercentage: 50,
        status: "IN_PROGRESS",
        completedAt: null,
      },
    ]);
    api.listPortalDocuments.mockResolvedValue(page([planDocument]));
    renderWithStore(<PortalProjectDetail projectId="p1" />);
    expect(await screen.findByText("Foundation")).toBeTruthy();
    expect(await screen.findByText("plan.pdf")).toBeTruthy();
    expect(screen.getAllByRole("button").map((b) => b.textContent)).toEqual([
      "Download",
    ]);
  });

  it("downloads a shared document and reports a failure", async () => {
    api.getPortalProject.mockResolvedValue(project);
    api.listPortalMilestones.mockResolvedValue([]);
    api.listPortalDocuments.mockResolvedValue(page([planDocument]));
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
    renderWithStore(<PortalProjectDetail projectId="p1" />);
    const button = await screen.findByRole("button", {
      name: "Download plan.pdf",
    });

    api.getPortalDocumentDownloadUrl.mockResolvedValueOnce(
      "https://files.example/plan.pdf",
    );
    fireEvent.click(button);
    await waitFor(() => expect(click).toHaveBeenCalledTimes(1));
    expect(api.getPortalDocumentDownloadUrl).toHaveBeenCalledWith("d1");

    api.getPortalDocumentDownloadUrl.mockRejectedValueOnce(
      new ApiError("x", 404, "DOCUMENT_NOT_FOUND"),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Download plan.pdf" }),
    );
    const alerts = await screen.findAllByRole("alert");
    expect(
      alerts.some((a) =>
        a.textContent?.includes("plan.pdf could not be downloaded"),
      ),
    ).toBe(true);
    expect(click).toHaveBeenCalledTimes(1);
    click.mockRestore();
  });

  it("does not request invoice or payment data", () => {
    renderWithStore(<PortalBilling />);
    expect(screen.getByText("Not available in the portal yet")).toBeTruthy();
    expect(screen.queryByRole("table")).toBeNull();
  });
});

describe("portal data isolation", () => {
  it("never serves one account's cached records to another account", async () => {
    api.listPortalProjects.mockResolvedValue(page([project]));
    signIn("CLIENT_PORTAL_USER", "alice");
    const first = renderWithStore(<PortalProjects />);
    expect(await screen.findByText("Lake House")).toBeTruthy();
    first.unmount();

    act(() => {
      store.dispatch(logout());
    });
    signIn("CLIENT_PORTAL_USER", "bob");
    api.listPortalProjects.mockResolvedValue(page([]));
    renderWithStore(<PortalProjects />);
    expect(screen.queryByText("Lake House")).toBeNull();
    expect(await screen.findByText("No projects yet")).toBeTruthy();
  });
});
