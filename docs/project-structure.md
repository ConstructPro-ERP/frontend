# Frontend file guide

## Architecture

This is a Next.js App Router frontend using React, TypeScript, Tailwind CSS, Redux Toolkit, React Hook Form, Zod, Axios, and Framer Motion. Page components compose shared layouts and feature clients. Interactive feature clients call API adapters, which use the common gateway client. Redux currently holds authentication only; feature data is generally local component state.

Authentication flows through `ReduxProvider` → `AuthProvider` → page content. Password login posts credentials and stores backend tokens. Google login navigates through the backend and verifies its returned access token on the callback page. Both end at `/modules`. On subsequent navigation/session restoration, `/auth/me` supplies the user profile. API requests attach the stored access token; the interceptor handles retry, refresh, and normalized errors.

## Root and tooling

| File                        | Responsibility                                                           |
| --------------------------- | ------------------------------------------------------------------------ |
| `package.json`              | Dependencies and dev, build, start, test, lint, formatting scripts.      |
| `package-lock.json`         | Exact npm dependency resolution.                                         |
| `next.config.ts`            | Next configuration; enables React Compiler.                              |
| `tsconfig.json`             | Strict TypeScript, Next types, and `@/*` source alias.                   |
| `next-env.d.ts`             | Generated Next type declarations; not hand-maintained.                   |
| `eslint.config.mjs`         | Next web-vitals and TypeScript lint rules and generated-file exclusions. |
| `postcss.config.mjs`        | Tailwind PostCSS integration.                                            |
| `.prettierrc`               | Formatting conventions.                                                  |
| `.prettierignore`           | Files excluded from formatting.                                          |
| `.gitignore`                | Dependency, build, environment, and local artifact exclusions.           |
| `.github/workflows/ci.yml`  | Delegates PR/push CI to the shared infra workflow.                       |
| `README.md`                 | Onboarding, configuration, commands, repository workflow.                |
| `DESIGN.md`                 | Brand colors, typography, spacing, and UI design guidance.               |
| `CHANGELOG.md`              | Release/change history.                                                  |
| `docs/project-structure.md` | This architecture and file guide.                                        |
| `docs/google-login.md`      | Google redirect contract, configuration, limits, and verification.       |

`.git` contains repository metadata, `node_modules` contains installed dependencies, `.next` contains generated builds/dev output, and `tsconfig.tsbuildinfo` caches incremental typechecking. These are not application source.

## Routes (`src/app`)

| File                                   | Responsibility                                                                                                 |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `layout.tsx`                           | Root HTML, font, metadata, Redux and authentication providers.                                                 |
| `globals.css`                          | Tailwind import, design tokens, shared global styling.                                                         |
| `page.tsx`                             | Public landing page and product overview.                                                                      |
| `modules/page.tsx`                     | Product module directory; current post-login destination.                                                      |
| `workflow/page.tsx`                    | Public construction workflow explanation.                                                                      |
| `security/page.tsx`                    | Public security and role model presentation; descriptive content is not enforcement.                           |
| `login/page.tsx`                       | Login metadata and illustrated auth layout.                                                                    |
| `login/components/LoginForm.tsx`       | Validates email/password, calls login, stores tokens, updates Redux, displays failures; includes Google login. |
| `register/page.tsx`                    | Registration metadata and illustrated layout.                                                                  |
| `register/components/RegisterForm.tsx` | Name/email/password/terms validation, registration request and completion navigation; includes Google login.   |
| `recover/page.tsx`                     | Recovery metadata and illustrated layout.                                                                      |
| `recover/components/RecoverForm.tsx`   | Forgot-password request, validation, email confirmation state.                                                 |
| `finish/page.tsx`                      | Registration completion layout and metadata.                                                                   |
| `finish/components/FinishForm.tsx`     | Completion message and module navigation.                                                                      |
| `auth/callback/page.tsx`               | Google callback layout, no-index and no-referrer metadata.                                                     |
| `auth/callback/GoogleCallback.tsx`     | Consumes/removes fragment, verifies token, commits session, redirects or displays retry link.                  |
| `dashboard/layout.tsx`                 | Wraps all dashboard routes in the shared shell.                                                                |
| `dashboard/page.tsx`                   | Dashboard overview and KPI client.                                                                             |
| `dashboard/leads/page.tsx`             | Lead management route.                                                                                         |
| `dashboard/quotations/page.tsx`        | Quotation management route.                                                                                    |
| `dashboard/finance/page.tsx`           | Finance dashboard route.                                                                                       |
| `dashboard/analytics/page.tsx`         | Analytics dashboard route.                                                                                     |
| `dashboard/projects/page.tsx`          | Project module placeholder.                                                                                    |
| `dashboard/documents/page.tsx`         | Document module placeholder.                                                                                   |
| `dashboard/users/page.tsx`             | User management placeholder.                                                                                   |
| `icon.png`                             | App icon asset recognized by Next metadata conventions.                                                        |
| `next.favicon.ico`                     | Retained favicon asset; its name is not the standard App Router `favicon.ico` convention.                      |

## Components (`src/components`)

| File                                                 | Responsibility                                                                                                |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `animations/FadeIn.tsx`                              | Small Framer Motion entrance-animation wrapper.                                                               |
| `layout/Header.tsx`                                  | Public navigation, mobile menu, auth-dependent actions and sign-out.                                          |
| `layout/Footer.tsx`                                  | Public footer, product/resources links.                                                                       |
| `ui/AuthLayout.tsx`                                  | Shared logo, form panel, and optional illustration panel.                                                     |
| `ui/AuthInput.tsx`                                   | Labeled input with optional icon, forwarded ref, and validation message.                                      |
| `ui/AuthCheckbox.tsx`                                | Styled native checkbox and forwarded ref for form registration.                                               |
| `ui/AuthButton.tsx`                                  | Button variants and loading/disabled presentation.                                                            |
| `ui/GoogleLoginButton.tsx`                           | Shared backend Google redirect button and Back-navigation loading reset.                                      |
| `ui/ConfirmDialog.tsx`                               | Native modal confirmation, pending/error handling, cancel and confirm actions.                                |
| `dashboard/DashboardShell.tsx`                       | Responsive dashboard shell and mobile sidebar state.                                                          |
| `dashboard/DashboardSidebar.tsx`                     | Dashboard navigation and account popup; some account actions remain placeholders.                             |
| `dashboard/DashboardHeader.tsx`                      | Route title, search UI, notifications UI and mobile menu trigger.                                             |
| `dashboard/dashboardConfig.ts`                       | Navigation items and route-specific labels/metadata.                                                          |
| `dashboard/DashboardPlaceholderPage.tsx`             | Shared unfinished-module presentation.                                                                        |
| `dashboard/DashboardKpiClient.tsx`                   | Fetches dashboard summary and displays KPI/loading/empty/error states.                                        |
| `dashboard/leads/LeadsDashboardClient.tsx`           | Lead listing, filters, pagination, capture/edit/detail, assignment, notes, contacts, status, and deletion UI. |
| `dashboard/leads/leadApi.ts`                         | Lead DTO normalization, assignee lookup and lead/note/contact REST operations.                                |
| `dashboard/leads/leadPermissions.ts`                 | Role checks for lead capture/update/delete UI.                                                                |
| `dashboard/quotations/QuotationsDashboardClient.tsx` | Quotation cards, creation/item form, totals and submission feedback; includes preview behavior.               |
| `dashboard/quotations/quotationUtils.ts`             | Preview quotations, formatting, normalization, availability and creation permission helpers.                  |
| `dashboard/finance/FinanceDashboardClient.tsx`       | Invoice filtering/table/details, payment form and live payment workflow.                                      |
| `dashboard/finance/financeUtils.ts`                  | Status labels, totals, balances, dates, payment validation and normalization.                                 |
| `dashboard/analytics/AnalyticsDashboardClient.tsx`   | KPI, revenue/payment charts, project progress, risk and AI forecasting UI.                                    |
| `dashboard/analytics/analyticsUtils.ts`              | Analytics normalization/formatting, preview fixtures and AI response helpers.                                 |

## State, transport, and services

| File                               | Responsibility                                                                                                                        |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `src/store/index.ts`               | Configures Redux store and exports dispatch/state types.                                                                              |
| `src/store/slices/authSlice.ts`    | Login start/success/failure, logout, and error-clearing reducers.                                                                     |
| `src/providers/ReduxProvider.tsx`  | Makes the Redux store available to React.                                                                                             |
| `src/providers/AuthProvider.tsx`   | Restores sessions from `/auth/me`; leaves callback verification to its page and ignores stale effect completions.                     |
| `src/lib/apiConfig.ts`             | Shared API base URL, environment precedence, trailing-slash normalization.                                                            |
| `src/lib/axios.ts`                 | Gateway transport, bearer attachment, retries, refresh coordination and `ApiResponse` wrappers; callback requests opt out of refresh. |
| `src/lib/token.ts`                 | Browser-safe localStorage access-token/refresh-token read, write and clear helpers.                                                   |
| `src/lib/ApiError.ts`              | Error class preserving backend details and user-facing message selection.                                                             |
| `src/lib/errorMessages.ts`         | Known backend error-code to friendly-message mapping.                                                                                 |
| `src/services/googleAuth.ts`       | Google initiation URL, fragment parsing, `/auth/me` verification and backend profile normalization.                                   |
| `src/services/dashboardApi.ts`     | Dashboard summary API adapter.                                                                                                        |
| `src/services/financeApi.ts`       | Invoice/payment API adapters and backend/UI field mapping.                                                                            |
| `src/services/analyticsApi.ts`     | Summary, monthly revenue, project and overdue invoice fetches plus chart/risk data assembly.                                          |
| `src/services/aiForecastingApi.ts` | AI request permissions, project risk endpoint, risk mapping and error messages.                                                       |

## Types (`src/types`)

| File           | Responsibility                                                        |
| -------------- | --------------------------------------------------------------------- |
| `api.ts`       | Standard success envelope and pagination metadata.                    |
| `auth.ts`      | User, role, credentials, tokens, auth state and login response types. |
| `dashboard.ts` | Dashboard summary/KPI backend DTOs.                                   |
| `lead.ts`      | Lead, contact, note, status, filter and mutation types.               |
| `quotation.ts` | Quotation/item/status and form models.                                |
| `finance.ts`   | Invoice, payment, summary, filter, DTO and validation types.          |
| `analytics.ts` | Chart, KPI, progress, risk and AI forecasting models.                 |

## Tests and assets

| File                                            | Responsibility                                                                             |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `test/api-error.test.mjs`                       | Runtime error-message and backend validation-detail checks.                                |
| `test/dashboard-layout.test.mjs`                | Dashboard shell/navigation and KPI integration checks.                                     |
| `test/leads-dashboard.test.mjs`                 | Lead routes, DTO normalization, mutation payloads and permissions.                         |
| `test/finance-dashboard.test.mjs`               | Finance source/integration contract checks.                                                |
| `test/analytics-dashboard.test.mjs`             | Analytics source/integration and forecasting behavior checks.                              |
| `test/google-auth.test.mjs`                     | Google fragment parsing, profile mapping, failed verification and token/refresh isolation. |
| `public/logos/IsharaHomesLogo.png`              | Company logo.                                                                              |
| `public/logos/google-icon.svg`                  | Google login button mark.                                                                  |
| `public/illustrations/signin-illustration.svg`  | Login illustration.                                                                        |
| `public/illustrations/signup-illustration.svg`  | Registration illustration.                                                                 |
| `public/illustrations/recover-illustration.svg` | Password recovery illustration.                                                            |
| `public/illustrations/finish-illustration.svg`  | Completion illustration.                                                                   |
| `public/file.svg`                               | Retained file icon asset.                                                                  |
| `public/globe.svg`                              | Retained globe icon asset.                                                                 |
| `public/next.svg`                               | Next starter branding asset.                                                               |
| `public/vercel.svg`                             | Vercel starter branding asset.                                                             |
| `public/window.svg`                             | Retained window icon asset.                                                                |

## Integration observations

- Backend code is a sibling Nest monorepo under `../backend/apps`, not primarily `../backend/src`. Google routes live in api-gateway and auth-service.
- Backend `/auth/me` returns `fullName`, `avatar`, and a nullable role; normalization maps these to the UI's name/avatar fields without inventing permissions.
- Existing password registration sends `firstName`/`lastName`, while the inspected backend currently requires `username`/`roleId`. This pre-existing mismatch is outside the Google change.
- Several pages describe planned capabilities or use placeholders. Presence of a page does not imply its backend workflow or authorization guard is implemented.
- Most existing dashboard tests inspect source contracts; they do not replace browser or backend integration testing.
