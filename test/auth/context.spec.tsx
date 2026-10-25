import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { Provider } from "react-redux";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { store } from "@/store";
import { loginStart, loginSuccess, logout } from "@/store/slices/authSlice";
import type { User } from "@/types/auth";
import AuthProvider, { useAuth } from "@/providers/AuthProvider";

const mocks = vi.hoisted(() => ({
  accessToken: null as string | null,
  get: vi.fn(),
  clearTokens: vi.fn(),
}));

vi.mock("@/lib/token", () => ({
  getAccessToken: () => mocks.accessToken,
  clearTokens: () => {
    mocks.accessToken = null;
    mocks.clearTokens();
  },
}));

vi.mock("@/lib/axios", () => ({
  default: {
    get: mocks.get,
  },
}));

const profile: User = {
  id: "user-1",
  email: "alice@example.com",
  firstName: "Alice",
  lastName: "Admin",
  role: "ADMIN",
};

function Probe() {
  const { user, getCurrentUser, isFetchingUser } = useAuth();

  return (
    <>
      <p data-testid="profile">{user?.email ?? "Signed out"}</p>
      <p data-testid="loading">{isFetchingUser ? "Fetching" : "Idle"}</p>

      <button
        type="button"
        onClick={() => {
          void getCurrentUser().catch(() => undefined);
        }}
      >
        Read profile
      </button>
    </>
  );
}

function renderProvider() {
  return render(
    <Provider store={store}>
      <AuthProvider>
        <Probe />
      </AuthProvider>
    </Provider>,
  );
}

beforeEach(() => {
  store.dispatch(logout());

  mocks.accessToken = null;
  mocks.get.mockReset();
  mocks.clearTokens.mockReset();

  window.history.replaceState(null, "", "/dashboard");
});

describe("AuthProvider profile caching", () => {
  it("does not fetch a profile without an access token", () => {
    renderProvider();

    expect(mocks.get).not.toHaveBeenCalled();
    expect(screen.getByTestId("profile").textContent).toBe("Signed out");
  });

  it("returns the existing Redux profile without another request", async () => {
    mocks.accessToken = "access-token";

    store.dispatch(loginSuccess({ user: profile }));

    renderProvider();

    fireEvent.click(screen.getByRole("button", { name: "Read profile" }));

    await waitFor(() => {
      expect(screen.getByTestId("profile").textContent).toBe(
        "alice@example.com",
      );
    });

    expect(mocks.get).not.toHaveBeenCalled();
  });

  it("loads the user once and reuses the cached profile", async () => {
    mocks.accessToken = "access-token";
    mocks.get.mockResolvedValue({ data: profile });

    const view = renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId("profile").textContent).toBe(
        "alice@example.com",
      );
    });

    expect(mocks.get).toHaveBeenCalledTimes(1);
    expect(mocks.get).toHaveBeenCalledWith("/auth/me");

    // Simulate navigation while keeping the root provider mounted.
    window.history.pushState(null, "", "/dashboard/projects");

    view.rerender(
      <Provider store={store}>
        <AuthProvider>
          <Probe />
        </AuthProvider>
      </Provider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Read profile" }));

    expect(mocks.get).toHaveBeenCalledTimes(1);
  });

  it("deduplicates simultaneous profile requests", async () => {
    mocks.accessToken = "access-token";

    let resolveRequest!: (value: { data: User }) => void;

    mocks.get.mockReturnValue(
      new Promise<{ data: User }>((resolve) => {
        resolveRequest = resolve;
      }),
    );

    renderProvider();

    fireEvent.click(screen.getByRole("button", { name: "Read profile" }));
    fireEvent.click(screen.getByRole("button", { name: "Read profile" }));

    expect(mocks.get).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveRequest({ data: profile });
    });

    expect(screen.getByTestId("profile").textContent).toBe("alice@example.com");
  });

  it("does not restore a session after logout", async () => {
    mocks.accessToken = "old-access-token";

    let resolveRequest!: (value: { data: User }) => void;

    mocks.get.mockReturnValue(
      new Promise<{ data: User }>((resolve) => {
        resolveRequest = resolve;
      }),
    );

    renderProvider();

    act(() => {
      mocks.accessToken = null;
      store.dispatch(logout());
    });

    await act(async () => {
      resolveRequest({ data: profile });
    });

    expect(store.getState().auth.user).toBeNull();
    expect(screen.getByTestId("profile").textContent).toBe("Signed out");
  });

  it("does not replace a new session with an old response", async () => {
    mocks.accessToken = "old-access-token";

    let resolveRequest!: (value: { data: User }) => void;

    mocks.get.mockReturnValue(
      new Promise<{ data: User }>((resolve) => {
        resolveRequest = resolve;
      }),
    );

    renderProvider();

    const anotherUser: User = {
      ...profile,
      id: "user-2",
      email: "bob@example.com",
      firstName: "Bob",
    };

    act(() => {
      store.dispatch(loginStart());
      mocks.accessToken = "new-access-token";
      store.dispatch(loginSuccess({ user: anotherUser }));
    });

    await act(async () => {
      resolveRequest({ data: profile });
    });

    expect(store.getState().auth.user?.id).toBe("user-2");
    expect(screen.getByTestId("profile").textContent).toBe("bob@example.com");
  });
});
