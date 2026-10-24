// The API gateway only serves /client-portal routes to this role.
export const PORTAL_ROLE = "CLIENT_PORTAL_USER";

export function canAccessPortal(role: string | null | undefined): boolean {
  return role === PORTAL_ROLE;
}

/** Where a signed-in user lands after authentication. */
export function homePathForRole(role: string | null | undefined): string {
  return canAccessPortal(role) ? "/portal" : "/modules";
}
