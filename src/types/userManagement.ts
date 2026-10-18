export type AccountStatus = "ACTIVE" | "INACTIVE";

export interface ManagedUser {
  id: string;
  fullName: string;
  email: string;
  roleId: string | null;
  role: { id: string; roleName: string } | null;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  fullName: string;
  email: string;
  roleId?: string;
  password?: string;
}

export interface UpdateUserInput {
  fullName?: string;
  email?: string;
  roleId?: string;
  status?: AccountStatus;
}
