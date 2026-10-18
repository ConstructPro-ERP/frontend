# User management

The admin-only `/dashboard/users` page follows `html files/v2_users.html` and uses the shared Axios client.

| Action       | Gateway request                                                              |
| ------------ | ---------------------------------------------------------------------------- |
| Directory    | `GET /users`                                                                 |
| Role catalog | `GET /auth/roles`                                                            |
| Create       | `POST /users` with `fullName`, `email`, optional `password` and `roleId`     |
| Edit         | `PATCH /users/:id` with `fullName`, `email`, optional `roleId`, and `status` |
| Deactivate   | `DELETE /users/:id` (soft deactivation; may return no body)                  |
| Reactivate   | `PATCH /users/:id` with `status: ACTIVE`                                     |

The directory currently returns a complete array, so search, role/status filtering and ten-row pagination operate locally. User statistics use that complete directory; role counts use the role catalog. Role catalog failures do not block editing names, emails or account status.

The backend stores `fullName`; the form combines first and last name fields for saving. New accounts start active. Passwords are optional for Google accounts, are never read from the API, and are cleared when the form is saved or dismissed. Existing assigned roles cannot be cleared because the current update contract does not accept a null role ID.

Last login is not returned by the user API and appears as “Not available.” The role catalog returns names and descriptions without permission grants; the reference's matrix preserves its layout and marks permission data unavailable. It does not infer grants from prototype values. The backend remains responsible for authorization.

Changing the signed-in administrator's own role or deactivating that account ends the local session and returns to sign-in. Name and email changes update the session display from the saved response.

The Users page supports light and dark appearance persisted under the prototype's `cp-theme` preference. Styles are scoped to the Users workspace.
