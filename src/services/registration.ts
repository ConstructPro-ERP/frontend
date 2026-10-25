import apiClient from "@/lib/axios";
import { getRoles } from "@/services/roles";
import { normalizeAuthUser } from "@/services/googleAuth";
import type { AuthResponse, LoginCredentials } from "@/types/auth";

export async function registerAccount(
  credentials: LoginCredentials,
): Promise<AuthResponse> {
  const role = (await getRoles()).find(
    (option) => option.roleName === "CLIENT_PORTAL_USER",
  );
  if (!role)
    throw new Error(
      "Signup is temporarily unavailable. Please try again later.",
    );

  const response = await apiClient.post<AuthResponse>("/auth/register", {
    username: credentials.email,
    email: credentials.email,
    password: credentials.password,
    roleId: role.id,
  });
  if (
    !response.success ||
    !response.data.accessToken ||
    !response.data.refreshToken
  ) {
    throw new Error(
      "Your signup session could not be started. Please sign in.",
    );
  }
  // Registration returns a minimal profile. Load the authoritative role before
  // admitting the new session to protected pages.
  const profile = await apiClient.get<unknown>("/auth/me", {
    headers: { Authorization: `Bearer ${response.data.accessToken}` },
    skipAuthRefresh: true,
  });
  if (!profile.success)
    throw new Error("Your account was created. Please sign in to continue.");
  const user = normalizeAuthUser(profile.data);
  if (user.id !== response.data.user.id || user.role !== "CLIENT_PORTAL_USER") {
    throw new Error(
      "Your account could not be verified. Please sign in to continue.",
    );
  }
  return { ...response.data, user };
}
