const reportingRoles = ["ADMIN", "MANAGEMENT", "FINANCE", "ACCOUNTANT"];

// Keep these aligned with the API gateway's read permissions.
const routeRoles: Record<string, readonly string[]> = {
  "/dashboard": reportingRoles,
  "/dashboard/leads": ["ADMIN", "MANAGEMENT", "SALES_MANAGER"],
  "/dashboard/quotations": [
    "ADMIN",
    "SALES_MANAGER",
    "PROJECT_MANAGER",
    "ACCOUNTANT",
  ],
  "/dashboard/projects": ["ADMIN", "PROJECT_MANAGER", "ACCOUNTANT"],
  "/dashboard/finance": reportingRoles,
  "/dashboard/analytics": reportingRoles,
  "/dashboard/users": ["ADMIN"],
  // Documents is currently a placeholder with no protected API.
  "/dashboard/documents": [
    "ADMIN",
    "MANAGEMENT",
    "MANAGER",
    "SALES_MANAGER",
    "PROJECT_MANAGER",
    "FINANCE",
    "ACCOUNTANT",
    "CLIENT",
    "CLIENT_PORTAL_USER",
  ],
};

export function canAccessDashboardPath(
  role: string | null | undefined,
  path: string,
): boolean {
  if (!role) return false;
  const route = Object.keys(routeRoles)
    .sort((a, b) => b.length - a.length)
    .find(
      (candidate) =>
        path === candidate ||
        (candidate !== "/dashboard" && path.startsWith(`${candidate}/`)),
    );
  return route !== undefined && routeRoles[route].includes(role);
}
