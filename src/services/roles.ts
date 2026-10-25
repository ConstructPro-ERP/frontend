import apiClient from "@/lib/axios";

export interface RoleOption {
  id: string;
  roleName: string;
  description: string | null;
}

export async function getRoles(): Promise<RoleOption[]> {
  const response = await apiClient.get<RoleOption[]>("/auth/roles");
  return response.data;
}
