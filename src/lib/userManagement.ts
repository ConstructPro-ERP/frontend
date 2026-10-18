import type { ManagedUser } from "@/types/userManagement";

export const standardRoleNames = [
  "ADMIN",
  "SALES_MANAGER",
  "PROJECT_MANAGER",
  "ACCOUNTANT",
  "CLIENT_PORTAL_USER",
] as const;

export type StandardRoleName = (typeof standardRoleNames)[number];

const standardRoleLabels: Record<StandardRoleName, string> = {
  ADMIN: "Administrator",
  SALES_MANAGER: "Sales Manager",
  PROJECT_MANAGER: "Project Manager",
  ACCOUNTANT: "Accountant",
  CLIENT_PORTAL_USER: "Client Portal User",
};

export function roleLabel(role: string | null | undefined): string {
  return role
    ? (standardRoleLabels[role as StandardRoleName] ??
        role
          .replaceAll("_", " ")
          .toLowerCase()
          .replace(/\b\w/g, (c) => c.toUpperCase()))
    : "Unassigned";
}

export function filterUsers(
  users: ManagedUser[],
  search: string,
  filter: string,
): ManagedUser[] {
  const query = search.trim().toLowerCase();
  return users.filter((user) => {
    const matchesFilter =
      filter === "ALL" ||
      (filter === "INACTIVE"
        ? user.status === "INACTIVE"
        : filter === "UNASSIGNED"
          ? !user.role
          : user.role?.roleName === filter);
    return (
      matchesFilter &&
      (!query ||
        `${user.fullName} ${user.email} ${roleLabel(user.role?.roleName)}`
          .toLowerCase()
          .includes(query))
    );
  });
}

export function splitName(fullName: string) {
  const [firstName = "", ...rest] = fullName.trim().split(/\s+/);
  return { firstName, lastName: rest.join(" ") };
}

export function validateUserForm(values: {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
}): string | null {
  if (!values.firstName.trim()) return "Enter a first name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
    return "Enter a valid email address.";
  if (values.password && values.password.length < 8)
    return "Password must contain at least 8 characters.";
  return null;
}
