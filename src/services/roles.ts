import apiClient from "@/lib/axios";
import type { User } from "@/types/auth";
import { normalizeAuthUser } from "@/services/googleAuth";

export interface RoleOption {
  id: string;
  roleName: string;
  description: string | null;
}

export function needsRoleSelection(user: User) {
  return user.role === null || user.role === "user";
}

export async function getRoles(): Promise<RoleOption[]> {
  const response = await apiClient.get<RoleOption[]>("/auth/roles");
  return response.data;
}

export async function saveSelectedRole(
  userId: string,
  role: RoleOption,
): Promise<User> {
  await apiClient.patch(`/users/${encodeURIComponent(userId)}`, {
    roleId: role.id,
  });
  const response = await apiClient.get<unknown>("/auth/me");
  const user = normalizeAuthUser(response.data);
  if (user.id !== userId || user.role !== role.roleName) {
    throw new Error(
      "Your selected role could not be verified. Please try again.",
    );
  }
  return user;
}
