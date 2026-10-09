import { z } from "zod";
import apiClient from "@/lib/axios";
import { API_URL } from "@/lib/apiConfig";
import type { User } from "@/types/auth";

export const googleLoginUrl = `${API_URL}/auth/google`;

const profileSchema = z.object({
  id: z.string().min(1),
  email: z.email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  fullName: z.string().optional(),
  username: z.string().optional(),
  role: z
    .enum([
      "ADMIN",
      "MANAGEMENT",
      "MANAGER",
      "SALES_MANAGER",
      "PROJECT_MANAGER",
      "FINANCE",
      "ACCOUNTANT",
      "CLIENT",
      "CLIENT_PORTAL_USER",
      "user",
    ])
    .nullable()
    .optional(),
  avatar: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
});

export function normalizeAuthUser(value: unknown): User {
  const profile = profileSchema.parse(value);
  const names = (profile.fullName ?? profile.username ?? "")
    .trim()
    .split(/\s+/);
  return {
    id: profile.id,
    email: profile.email,
    firstName: profile.firstName ?? names[0] ?? "",
    lastName: profile.lastName ?? names.slice(1).join(" "),
    role: profile.role ?? null,
    avatarUrl: profile.avatarUrl ?? profile.avatar ?? undefined,
  };
}

export function readGoogleCallbackToken(hash: string): string {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  if (params.has("error")) {
    throw new Error(
      "Google sign-in was cancelled or denied. Please try again.",
    );
  }
  const tokens = params.getAll("token");
  if (tokens.length !== 1 || !tokens[0].trim()) {
    throw new Error("Google sign-in did not return a token. Please try again.");
  }
  return tokens[0];
}

export async function completeGoogleLogin(hash: string) {
  const accessToken = readGoogleCallbackToken(hash);
  // Verify with the backend before storing credentials or accepting a user.
  // Never refresh this request with a previous account's refresh token.
  const response = await apiClient.get<unknown>("/auth/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
    skipAuthRefresh: true,
    timeout: 15000,
  });
  if (!response.success) {
    throw new Error("Google sign-in could not be verified. Please try again.");
  }
  return { accessToken, user: normalizeAuthUser(response.data) };
}
