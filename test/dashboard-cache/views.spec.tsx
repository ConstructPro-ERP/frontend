import {
  Activity,
  StrictMode,
  Suspense,
  useState,
  type ComponentType,
} from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useDashboardQuery } from "@/hooks/useDashboardQuery";
import {
  dashboardQueryCache,
  DASHBOARD_STALE_TIME,
} from "@/lib/dashboardQueryCache";
import { store } from "@/store";
import { loginSuccess, logout } from "@/store/slices/authSlice";
import DashboardWorkspace from "@/components/dashboard/DashboardWorkspace";

const navigation = vi.hoisted(() => ({ search: "" }));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(navigation.search),
}));
vi.mock("@/components/dashboard/quotations/QuotationsDashboardClient", () => ({
  default: ({ initialLeadId }: { initialLeadId: string }) => (
    <input aria-label={`Quotation draft ${initialLeadId}`} />
  ),
}));

vi.mock("next/dynamic", async () => {
  const { lazy } = await import("react");
  return {
    default: (load: () => Promise<{ default: ComponentType }>) => lazy(load),
  };
});
vi.mock("@/components/dashboard/DashboardKpiClient", () => ({
  default: () => <input aria-label="Home note" />,
}));
vi.mock("@/components/dashboard/analytics/AnalyticsDashboardClient", () => ({
  default: () => <p>Analytics view</p>,
}));
vi.mock("@/components/dashboard/finance/FinanceDashboardClient", () => ({
  default: () => <p>Invoice view</p>,
}));

function login(id = "user-a") {
  store.dispatch(
    loginSuccess({
      user: {
        id,
        email: `${id}@example.com`,
        firstName: "Demo",
        lastName: "User",
        role: "ADMIN",
      },
    }),
  );
}

beforeEach(() => {
  store.dispatch(logout());
  login();
  dashboardQueryCache.clear();
});
afterEach(() => {
  vi.restoreAllMocks();
});

function Probe({
  load,
  name = "home:summary",
}: {
  load: () => Promise<string>;
  name?: string;
}) {
  const query = useDashboardQuery(name, load);
  const [draft, setDraft] = useState("");
  return (
    <>
      <input
        aria-label="Draft"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
      <p role="status">{query.loading ? "Loading" : query.data}</p>
      {query.error ? <p role="alert">Refresh failed</p> : null}
    </>
  );
}

it("preserves hidden tab state, pauses refresh, and revalidates stale data when shown", async () => {
  let now = 1000;
  vi.spyOn(Date, "now").mockImplementation(() => now);
  let finish!: (value: string) => void;
  const load = vi
    .fn<() => Promise<string>>()
    .mockResolvedValueOnce("old totals")
    .mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
  const view = (visible: boolean) => (
    <Provider store={store}>
      <StrictMode>
        <Activity mode={visible ? "visible" : "hidden"}>
          <Probe load={load} />
        </Activity>
      </StrictMode>
    </Provider>
  );
  const { rerender } = render(view(true));
  expect(await screen.findByText("old totals")).toBeTruthy();
  expect(load).toHaveBeenCalledTimes(1);
  fireEvent.change(screen.getByLabelText("Draft"), {
    target: { value: "unsaved filter" },
  });
  rerender(view(false));
  now += DASHBOARD_STALE_TIME + 1;
  fireEvent.focus(window);
  expect(load).toHaveBeenCalledTimes(1);
  await act(async () => {
    rerender(view(true));
  });
  expect(screen.getByText("old totals")).toBeTruthy();
  expect((screen.getByLabelText("Draft") as HTMLInputElement).value).toBe(
    "unsaved filter",
  );
  expect(load).toHaveBeenCalledTimes(2);
  await act(async () => {
    finish("new totals");
  });
  expect(screen.getByText("new totals")).toBeTruthy();
});

it("reuses fresh data on remount and retains it when background refresh fails", async () => {
  let now = 1000;
  vi.spyOn(Date, "now").mockImplementation(() => now);
  const load = vi
    .fn()
    .mockResolvedValueOnce("cached")
    .mockRejectedValue(new Error("offline"));
  const view = (key: string) => (
    <Provider store={store}>
      <Probe key={key} load={load} />
    </Provider>
  );
  const { rerender } = render(view("first"));
  await screen.findByText("cached");
  rerender(view("second"));
  expect(screen.getByText("cached")).toBeTruthy();
  expect(load).toHaveBeenCalledTimes(1);
  now += DASHBOARD_STALE_TIME + 1;
  fireEvent.focus(window);
  await screen.findByRole("alert");
  expect(screen.getByText("cached")).toBeTruthy();
});

it("isolates users and clears cached entries on logout or role change", async () => {
  const load = vi
    .fn()
    .mockResolvedValueOnce("account a")
    .mockResolvedValueOnce("account b")
    .mockResolvedValueOnce("new role");
  render(
    <Provider store={store}>
      <Probe load={load} />
    </Provider>,
  );
  await screen.findByText("account a");
  act(() => {
    store.dispatch(logout());
    login("user-b");
  });
  expect(screen.queryByText("account a")).toBeNull();
  await screen.findByText("account b");
  act(() => {
    store.dispatch(
      loginSuccess({
        user: { ...store.getState().auth.user!, role: "ACCOUNTANT" },
      }),
    );
  });
  expect(screen.queryByText("account b")).toBeNull();
  await screen.findByText("new role");
});

it("keeps visited workspace pages mounted across routes without rendering route children twice", async () => {
  const view = (pathname: string) => (
    <Suspense fallback={<p>Loading page</p>}>
      <DashboardWorkspace pathname={pathname}>
        <p>Other route</p>
      </DashboardWorkspace>
    </Suspense>
  );
  const { rerender } = render(view("/dashboard"));
  const input = await screen.findByLabelText("Home note");
  fireEvent.change(input, { target: { value: "retained" } });
  expect(screen.queryByText("Other route")).toBeNull();
  rerender(view("/dashboard/analytics"));
  await screen.findByText("Analytics view");
  rerender(view("/dashboard/projects"));
  expect(screen.getByText("Other route")).toBeTruthy();
  rerender(view("/dashboard"));
  expect(
    ((await screen.findByLabelText("Home note")) as HTMLInputElement).value,
  ).toBe("retained");
});

it("retains separate quotation drafts across module and lead-link navigation", async () => {
  const view = (path: string) => (
    <Suspense fallback="Loading">
      <DashboardWorkspace pathname={path}>
        <p>Route fallback</p>
      </DashboardWorkspace>
    </Suspense>
  );
  navigation.search = "leadId=first";
  const { rerender } = render(view("/dashboard/quotations"));
  fireEvent.change(await screen.findByLabelText("Quotation draft first"), {
    target: { value: "Saved draft" },
  });
  navigation.search = "";
  rerender(view("/dashboard/analytics"));
  await screen.findByText("Analytics view");
  navigation.search = "leadId=second";
  rerender(view("/dashboard/quotations"));
  expect(
    (
      (await screen.findByLabelText(
        "Quotation draft second",
      )) as HTMLInputElement
    ).value,
  ).toBe("");
  navigation.search = "leadId=first";
  rerender(view("/dashboard/quotations"));
  expect(
    (screen.getByLabelText("Quotation draft first") as HTMLInputElement).value,
  ).toBe("Saved draft");
  navigation.search = "";
});
