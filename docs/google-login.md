# Google login

The frontend uses the existing backend OAuth redirect flow. No frontend Google SDK, client ID or client secret is needed.

1. The shared Google button on `/login` and `/register` navigates to `http://localhost:4000/api/auth/google` by default.
2. The gateway redirects to auth-service, which starts Google OAuth.
3. The backend redirects to `${FRONTEND_URL}/auth/callback#token=<accessToken>`.
4. The callback removes the fragment from browser history and verifies the token using `GET /auth/me` with an explicit Bearer header. It cannot refresh with a previous user's credentials.
5. After verification, it clears old tokens, saves the access token and updates Redux. Users with an assigned role proceed to `/modules`. Users with role `user` or `null` proceed to `/auth/select-role` to choose a role.

## Role selection

- The dropdown loads the `data` array from `GET /auth/roles`, retaining backend IDs, role names, and nullable descriptions. No role-request or approval APIs are called.
- **Save role and continue** sends `{ roleId }` to the existing `PATCH /users/:id` route, then reloads `GET /auth/me`. Redux permissions update only after the backend confirms the selected role for the same user.
- **Backend limitation:** the current gateway restricts `PATCH /users/:id` to `ADMIN`. An unassigned Google user will receive a permission error until the backend provides an authorized onboarding assignment path. The roles-list GET endpoint alone cannot save a selection. The frontend does not bypass that restriction.
- `CLIENT_PORTAL_USER` is accepted by profile validation. Existing assigned users retain their backend role and skip selection.
- The old `/auth/role-request` page redirects to `/auth/select-role` for bookmarked links.

## Configuration

Frontend `.env.local` (optional for the default gateway):

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
```

`NEXT_PUBLIC_API_URL` takes precedence if both variables are set. Restart Next.js after changing environment variables.

Backend configuration, managed in the backend repository:

```env
FRONTEND_URL=http://localhost:3000
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback
GOOGLE_CLIENT_ID=<Google OAuth web client ID>
GOOGLE_CLIENT_SECRET=<backend-only secret>
```

The Google Cloud authorized redirect URI must exactly match `GOOGLE_CALLBACK_URL`. The backend can instead use its directly exposed auth-service callback URL if that is how the deployment is configured. The current gateway redirects the browser to `AUTH_SERVICE_URL`, so that URL must be browser-accessible. Set `FRONTEND_URL` to the actual frontend origin: the backend's current fallback is port 5173, while Next.js normally uses port 3000.

## Existing backend limits

- Google callbacks currently issue only an access token. Google sessions cannot refresh automatically; users must sign in again when it expires. Never retain an earlier account's refresh token.
- New Google users may have role `user` or `null`. The frontend preserves these values and does not assign elevated permissions.
- OAuth state validation and handling Google consent denial before redirecting back are backend responsibilities. The inspected Passport strategy does not configure OAuth state protection; this requires backend hardening before production. The frontend cannot validate an OAuth state value that the backend does not issue and return.
- Dashboard route protection and several sidebar actions are existing separate gaps; the frontend UI is not an authorization boundary. APIs must enforce access control.

## Verification

Run `npm test`, `npm run lint`, `npx tsc --noEmit`, and `npm run build`.

With the backend services running and Google configured, click Google on each auth page. Confirm assigned accounts reach `/modules` and unassigned accounts reach `/auth/select-role`. Confirm the dropdown matches `/auth/roles`. With an authorized assignment endpoint, save a role and confirm `/auth/me` returns it before proceeding. Verify denied assignments leave permissions unchanged and display an error. Also test a missing callback fragment, an expired token, browser Back from consent, and backend unavailability. The callback must display a retry link on failure and must remove its fragment immediately.

Automated tests exercise callback parsing, profile normalization, backend verification failures, and prevention of refresh with a previous account. Live Google consent requires a configured backend and a real browser account.
