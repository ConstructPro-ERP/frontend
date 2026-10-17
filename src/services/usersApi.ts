import apiClient from "@/lib/axios";
import type {
  ManagedUser,
  CreateUserInput,
  UpdateUserInput,
} from "@/types/userManagement";

export async function listUsers(): Promise<ManagedUser[]> {
  const response = await apiClient.get<ManagedUser[]>("/users");
  if (!Array.isArray(response.data))
    throw new Error("Unable to read the user directory.");
  return response.data;
}

export async function createUser(input: CreateUserInput): Promise<ManagedUser> {
  const response = await apiClient.post<ManagedUser>("/users", input);
  return response.data;
}

export async function updateUser(
  id: string,
  input: UpdateUserInput,
): Promise<ManagedUser> {
  const response = await apiClient.patch<ManagedUser>(
    `/users/${encodeURIComponent(id)}`,
    input,
  );
  return response.data;
}

export async function deactivateUser(id: string): Promise<void> {
  // DELETE deactivates the account; the record remains in the directory.
  await apiClient.del(`/users/${encodeURIComponent(id)}`);
}
