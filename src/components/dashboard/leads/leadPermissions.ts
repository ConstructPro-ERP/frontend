export function canDeleteLead(
  user: { role?: string | null; roles?: string[] } | null | undefined,
): boolean {
  return [user?.role, ...(user?.roles ?? [])].some((role) => role === "ADMIN");
}

export function canCaptureLead(
  user: { role?: string | null; roles?: string[] } | null | undefined,
): boolean {
  return [user?.role, ...(user?.roles ?? [])].some(
    (role) =>
      role === "ADMIN" || role === "MANAGEMENT" || role === "SALES_MANAGER",
  );
}
export function canUpdateLead(
  user: { role?: string | null; roles?: string[] } | null | undefined,
): boolean {
  return [user?.role, ...(user?.roles ?? [])].some(
    (role) =>
      role === "ADMIN" || role === "MANAGEMENT" || role === "SALES_MANAGER",
  );
}

// Assignment requires both PATCH /leads/:id/assign and GET /users.
// The user catalog is currently restricted to ADMIN by the gateway.
export function canAssignLead(
  user: { role?: string | null; roles?: string[] } | null | undefined,
): boolean {
  return [user?.role, ...(user?.roles ?? [])].some((role) => role === "ADMIN");
}
