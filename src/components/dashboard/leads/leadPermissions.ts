export function canDeleteLead(
  user: { role?: string; roles?: string[] } | null | undefined,
): boolean {
  return [user?.role, ...(user?.roles ?? [])].some((role) => role === "ADMIN");
}

export function canCaptureLead(
  user: { role?: string; roles?: string[] } | null | undefined,
): boolean {
  return [user?.role, ...(user?.roles ?? [])].some(
    (role) => role === "ADMIN" || role === "SALES_MANAGER",
  );
}
export function canUpdateLead(
  user: { role?: string; roles?: string[] } | null | undefined,
): boolean {
  return [user?.role, ...(user?.roles ?? [])].some(
    (role) => role === "ADMIN" || role === "SALES_MANAGER",
  );
}
