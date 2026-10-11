import apiClient from "@/lib/axios";

export interface ProjectManagerOption {
  id: string;
  fullName: string;
  email: string;
}
interface DirectoryUser extends ProjectManagerOption {
  status: string;
  role: { roleName: string } | null;
}
// The user directory is admin-only. Never call this for accountants or managers.
export async function listProjectManagers(): Promise<ProjectManagerOption[]> {
  const response = await apiClient.get<DirectoryUser[]>("/users");
  if (!Array.isArray(response.data))
    throw new Error("Unable to read the project manager directory.");
  return response.data.filter(
    (user) =>
      user.status === "ACTIVE" && user.role?.roleName === "PROJECT_MANAGER",
  );
}
