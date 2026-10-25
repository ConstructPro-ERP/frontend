import { act, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { store } from "@/store";
import { loginSuccess, logout } from "@/store/slices/authSlice";
import type { User } from "@/types/auth";
import { dashboardQueryCache } from "@/lib/dashboardQueryCache";
import type { DashboardSummaryDto } from "@/types/dashboard";

const navigation = vi.hoisted(() => ({
  pathname: "/dashboard",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
}));

vi.mock("@/services/dashboardApi", () => ({
  getDashboardActivity: vi.fn(),
  getDashboardSummary: vi.fn(),
}));

const user: User = {
  id: "admin-1",
  email: "alice@example.com",
  firstName: "Alice",
  lastName: "Perera",
  role: "ADMIN",
};

function renderHeader() {
  return render(
    <Provider store={store}>
      <DashboardHeader onOpenSidebar={() => undefined} />
    </Provider>,
  );
}

beforeEach(() => {
  vi.useFakeTimers();

  // Use a fixed local date to make greetings deterministic.
  vi.setSystemTime(new Date(2026, 9, 25, 9, 0));

  navigation.pathname = "/dashboard";
  store.dispatch(loginSuccess({ user }));

  dashboardQueryCache.clear();
});

afterEach(() => {
  store.dispatch(logout());
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("Dynamic dashboard headers", () => {
  it("renders the current date and username across greeting pages", () => {
    const paths = [
      "/dashboard",
      "/dashboard/quotations",
      "/dashboard/projects",
      "/dashboard/documents",
    ];

    for (const pathname of paths) {
      navigation.pathname = pathname;

      const view = renderHeader();

      expect(
        screen.getByText("Sunday, 25 October 2026 · Good morning, Alice"),
      ).toBeTruthy();

      view.unmount();
    }
  });

  it("updates the greeting when the time of day changes", () => {
    navigation.pathname = "/dashboard/projects";

    renderHeader();

    expect(screen.getByText(/Good morning, Alice/)).toBeTruthy();

    // Advance the existing clock subscription into the afternoon.
    act(() => {
      vi.advanceTimersByTime(4 * 60 * 60 * 1000);
    });

    expect(screen.getByText(/Good afternoon, Alice/)).toBeTruthy();

    // Advance into the evening.
    act(() => {
      vi.advanceTimersByTime(6 * 60 * 60 * 1000);
    });

    expect(screen.getByText(/Good evening, Alice/)).toBeTruthy();
  });

  it("updates the greeting when the authenticated user changes", () => {
    renderHeader();

    const anotherUser: User = {
      ...user,
      id: "admin-2",
      email: "bob@example.com",
      firstName: "Bob",
    };

    act(() => {
      store.dispatch(loginSuccess({ user: anotherUser }));
    });

    expect(screen.getByText(/Good morning, Bob/)).toBeTruthy();

    expect(screen.queryByText(/Good morning, Alice/)).toBeNull();
  });

  it("does not display a hardcoded Admin name without a user", () => {
    act(() => {
      store.dispatch(logout());
    });

    renderHeader();

    expect(
      screen.getByText("Sunday, 25 October 2026 · Good morning"),
    ).toBeTruthy();

    expect(screen.queryByText(/Good morning, Admin/)).toBeNull();
  });

  it("preserves static descriptions on other dashboard pages", () => {
    navigation.pathname = "/dashboard/users";

    const view = renderHeader();

    expect(
      screen.getByText("Manage user accounts, roles and access"),
    ).toBeTruthy();

    view.unmount();

    navigation.pathname = "/dashboard/leads";

    renderHeader();

    expect(
      screen.getByText("Track inquiries, follow-ups, and conversions"),
    ).toBeTruthy();
  });

  it("renders Finance totals from the shared summary cache", () => {
    navigation.pathname = "/dashboard/finance";

    const summary = {
      revenue: { outstandingBalance: 1_250_000 },
      invoices: { overdueCount: 2 },
    } as DashboardSummaryDto;

    const key = JSON.stringify([user.id, user.role, "home:summary"]);

    dashboardQueryCache.setData<DashboardSummaryDto>(key, () => summary);

    renderHeader();

    expect(
      screen.getByText("LKR 1.3M outstanding · 2 overdue invoices"),
    ).toBeTruthy();
  });

  it("renders zero Finance values without sample figures", () => {
    navigation.pathname = "/dashboard/finance";

    const summary = {
      revenue: { outstandingBalance: 0 },
      invoices: { overdueCount: 0 },
    } as DashboardSummaryDto;

    dashboardQueryCache.setData<DashboardSummaryDto>(
      JSON.stringify([user.id, user.role, "home:summary"]),
      () => summary,
    );

    renderHeader();

    expect(screen.getByText(/outstanding · 0 overdue invoices/)).toBeTruthy();

    expect(screen.queryByText(/6\.8M outstanding/)).toBeNull();
  });

  it("displays the timestamp of a real AI analysis", () => {
    navigation.pathname = "/dashboard/analytics";

    dashboardQueryCache.setData<string>(
      JSON.stringify([user.id, user.role, "analytics:latest-run"]),
      () => "2026-10-25T10:15:00.000Z",
    );

    renderHeader();

    expect(screen.getByText(/AI risk insights · Last analysed/)).toBeTruthy();
  });

  it("shows the Analytics fallback before an analysis", () => {
    navigation.pathname = "/dashboard/analytics";

    renderHeader();

    expect(
      screen.getByText("Project performance and AI risk insights"),
    ).toBeTruthy();

    expect(screen.queryByText(/Last analysed/)).toBeNull();
  });

  it("clears the analysis timestamp after logout", () => {
    navigation.pathname = "/dashboard/analytics";

    dashboardQueryCache.setData<string>(
      JSON.stringify([user.id, user.role, "analytics:latest-run"]),
      () => "2026-10-25T10:15:00.000Z",
    );

    renderHeader();

    expect(screen.getByText(/Last analysed/)).toBeTruthy();

    act(() => {
      store.dispatch(logout());
    });

    expect(screen.queryByText(/Last analysed/)).toBeNull();
  });
});
