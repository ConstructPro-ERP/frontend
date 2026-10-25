# Google login

The frontend uses the existing backend OAuth redirect flow. No frontend Google SDK, client ID or client secret is needed.

1. The shared Google button on `/login` and `/register` navigates to `http://localhost:4000/api/auth/google` by default.
2. The gateway calls auth-service internally and relays its redirect to Google. Google returns to the gateway callback, which calls auth-service internally to exchange the code.
3. The backend redirects to `${FRONTEND_URL}/auth/callback#token=<accessToken>&refreshToken=<refreshToken>`.
4. The callback removes the fragment from browser history and verifies the token using `GET /auth/me` with an explicit Bearer header. It cannot refresh with a previous user's credentials.
5. After verification, the callback replaces both stored tokens, updates Redux, and continues directly to `/modules`.

## Signup roles and sessions

- Email signup resolves the `CLIENT_PORTAL_USER` ID from `GET /auth/roles` and sends it to registration. There is no role dropdown. The backend rejects other roles on public registration.
- Email signup saves the returned access and refresh tokens after verifying the account through `GET /auth/me`. The completion screen continues into the application without another login.
- The backend assigns `CLIENT_PORTAL_USER` to new Google accounts and returning accounts whose role is missing. Existing assigned roles are preserved.
- The role-selection UI has been removed. Legacy `/auth/select-role` and `/auth/role-request` links redirect to `/modules`.
- Deploy the auth-service changes together with the frontend. The role catalog must contain `CLIENT_PORTAL_USER`; missing configuration fails signup rather than creating an unassigned Google account.

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

The Google Cloud authorized redirect URI must exactly match `GOOGLE_CALLBACK_URL` on auth-service. In production use `https://construct-pro-api-gateway.vercel.app/api/auth/google/callback`. Keep `AUTH_SERVICE_URL` on the gateway pointed at the internal auth-service address; the browser never needs that address. Set `FRONTEND_URL` on auth-service to the actual frontend origin. Auth-service owns this setting; the gateway relays its HTTP(S) `/auth/callback` redirect without requiring a duplicate setting, while blocking redirects to the auth-service origin. The default is port 5173, while Next.js normally uses port 3000. Configure the frontend API base URL as `https://construct-pro-api-gateway.vercel.app/api`.

The gateway disables automatic redirect following, relays only approved Google/frontend redirects, and returns a generic error for downstream failures. Verify in browser Network tools that OAuth visits only the gateway, Google, and the frontend. Restrict direct service access at the hosting/network layer as well: proxying avoids exposing service URLs in this flow but does not itself make a publicly hosted service private.

## Existing backend limits

- Google callbacks issue access and refresh tokens. Both credentials replace any previous account session.
- Role assignment is persisted by auth-service; frontend profile normalization preserves the backend role.
- OAuth state validation and handling Google consent denial before redirecting back are backend responsibilities. The inspected Passport strategy does not configure OAuth state protection; this requires backend hardening before production. The frontend cannot validate an OAuth state value that the backend does not issue and return.
- Dashboard route protection and several sidebar actions are existing separate gaps; the frontend UI is not an authorization boundary. APIs must enforce access control.

## Verification

Run `npm test`, `npm run lint`, `npx tsc --noEmit`, and `npm run build`.

With the backend services running and Google configured, sign up through email and Google. Confirm no role selector appears, the saved role is `CLIENT_PORTAL_USER`, and the account reaches the application without another login. Reload to verify session restoration. Confirm returning assigned Google users retain their roles. Test missing callback credentials, expired tokens, consent cancellation, and backend unavailability.

Automated tests exercise callback parsing, profile normalization, backend verification failures, and prevention of refresh with a previous account. Live Google consent requires a configured backend and a real browser account.
