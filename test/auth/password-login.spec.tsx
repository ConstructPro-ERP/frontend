import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import LoginForm from "@/app/login/components/LoginForm";
import { canAccessDashboardPath } from "@/lib/dashboardAccess";

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  get: vi.fn(),
  dispatch: vi.fn(),
  push: vi.fn(),
  clearTokens: vi.fn(),
  setAccessToken: vi.fn(),
  setRefreshToken: vi.fn(),
}));

vi.mock("@/lib/axios", () => ({
  default: {
    post: mocks.post,
    get: mocks.get,
  },
}));

vi.mock("@/lib/token", () => ({
  clearTokens: mocks.clearTokens,
  setAccessToken: mocks.setAccessToken,
  setRefreshToken: mocks.setRefreshToken,
}));

vi.mock("react-redux", () => ({
  useDispatch: () => mocks.dispatch,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mocks.push,
  }),
}));

vi.mock("@/components/ui/GoogleLoginButton", () => ({
  default: () => null,
}));

function submitLogin() {
  render(<LoginForm />);

  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "admin@example.com" },
  });

  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "Password123" },
  });

  fireEvent.click(screen.getByRole("button", { name: "Sign In" }));
}

beforeEach(() => {
  vi.clearAllMocks();

  mocks.post.mockResolvedValue({
    success: true,
    data: {
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
      user: {
        id: "admin-1",
        username: "Admin User",
        email: "admin@example.com",
      },
    },
  });

  mocks.get.mockResolvedValue({
    success: true,
    data: {
      id: "admin-1",
      email: "admin@example.com",
      fullName: "Admin User",
      role: "ADMIN",
    },
  });
});

describe("Password login profile verification", () => {
  it("loads the full user profile once before completing login", async () => {
    submitLogin();

    await waitFor(() => {
      expect(mocks.push).toHaveBeenCalledWith("/modules");
    });

    expect(mocks.post).toHaveBeenCalledWith("/auth/login", {
      email: "admin@example.com",
      password: "Password123",
    });

    expect(mocks.get).toHaveBeenCalledTimes(1);

    expect(mocks.get).toHaveBeenCalledWith("/auth/me", {
      headers: {
        Authorization: "Bearer new-access-token",
      },
      skipAuthRefresh: true,
      timeout: 15000,
    });

    const loginAction = mocks.dispatch.mock.calls
      .map(([action]) => action)
      .find((action) => action.type === "auth/loginSuccess");

    expect(loginAction?.payload.user).toMatchObject({
      id: "admin-1",
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
    });

    expect(
      canAccessDashboardPath(loginAction?.payload.user.role, "/dashboard"),
    ).toBe(true);

    expect(mocks.get.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.setAccessToken.mock.invocationCallOrder[0],
    );
  });

  it("does not complete login when profile verification fails", async () => {
    mocks.get.mockRejectedValueOnce(new Error("Profile verification failed"));

    submitLogin();

    await waitFor(() => {
      expect(mocks.clearTokens).toHaveBeenCalled();
    });

    expect(mocks.setAccessToken).not.toHaveBeenCalled();
    expect(mocks.setRefreshToken).not.toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();

    const actions = mocks.dispatch.mock.calls.map(([action]) => action.type);

    expect(actions).toContain("auth/loginFailure");
    expect(actions).not.toContain("auth/loginSuccess");
  });
});
