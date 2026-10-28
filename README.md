# ConstructPro Frontend

[![CI](https://github.com/ConstructPro-ERP/frontend/actions/workflows/ci.yml/badge.svg?branch=develop)](https://github.com/ConstructPro-ERP/frontend/actions/workflows/ci.yml) [![Quotation line coverage](https://img.shields.io/badge/quotation%20line%20coverage-94.6%25-brightgreen)](https://github.com/ConstructPro-ERP/documents/blob/develop/testing/coverage-sprint8.pdf)

**Live application:** https://construct-pro-teal.vercel.app/  
**API documentation (Swagger):** https://construct-pro-api-gateway.vercel.app/api/docs  
**Project organization:** https://github.com/ConstructPro-ERP  
**Project board:** https://github.com/orgs/ConstructPro-ERP/projects/2

## Overview

ConstructPro Frontend is the Next.js web application for ConstructPro ERP, a construction business management system. It provides role-based interfaces backed by 14 NestJS backend applications: one API Gateway and 13 domain services.

The application includes:

- **Authentication:** Email/password login, registration and Google OAuth.
- **Dashboard and KPIs:** Operational summaries and role-aware navigation.
- **Lead management:** Lead listing, searching, assignment, editing and follow-up workflows.
- **Quotation management:** Quotation lifecycle, PDF-related operations and conversion into projects.
- **Project management:** Projects, milestones, tasks, project expenses, document uploads and calendar features.
- **Finance:** Invoice creation, PDF generation, payment recording and finance summaries.
- **Analytics and AI:** Reporting views and backend AI forecasting integration.
- **User management:** Administrative account and role management.
- **Client portal:** Ownership-scoped read-only projects, milestones, quotations and shared documents.

**Current limitations:** The standalone `/dashboard/documents` page is a placeholder; document management is available within individual projects. The client portal's invoices-and-payments page is not yet backed by client-facing billing endpoints. Calendar and AI features require appropriately configured external integrations.

## Demonstration Accounts

Evaluators can visit the **live application landing page** above to explore the website, then sign in using the following accounts. Access is subject to the current deployment and each account's assigned role.

| Role               | Email                       | Password             |
| ------------------ | --------------------------- | -------------------- |
| Administrator      | `admin.demo@example.com`    | `DemoAdministrator`  |
| Sales Manager      | `sales.demo@example.com`    | `DemoSalesManager`   |
| Project Manager    | `projects.demo@example.com` | `DemoProjectManager` |
| Accountant         | `accounts.demo@example.com` | `DemoAccountant`     |
| Client Portal User | `client.demo@example.com`   | `DemoClient`         |

## Repository Purpose

This repository contains the Next.js frontend: pages, reusable components, client-side validation, shared authentication state and API integration. The backend owns persistent business logic and database access. The UI restricts routes and actions by role, while the backend remains responsible for enforcing authorization.

## Technology Stack

| Area                 | Technology                                                      |
| -------------------- | --------------------------------------------------------------- |
| Framework            | Next.js 16.4.2 (App Router), React 19.2.4                       |
| Language             | TypeScript                                                      |
| Styling              | Tailwind CSS                                                    |
| State management     | Redux Toolkit / React Redux and application-level query caching |
| Forms and validation | React Hook Form, Zod                                            |
| HTTP client          | Axios through the shared `apiClient`                            |
| Quality tooling      | ESLint, Prettier, TypeScript, Node test runner and Vitest       |
| Deployment           | Vercel                                                          |

The checked-in `package.json` is the source of truth for installed package versions and scripts.

## Prerequisites

- Node.js 22 or newer (CI uses Node.js 24)
- npm compatible with the checked-in `package-lock.json`
- Git
- A running ConstructPro API gateway and the domain services needed for the selected workflows

Verify the tools:

```bash
node -v
npm -v
git --version
```

## Installation

```bash
git clone https://github.com/ConstructPro-ERP/frontend.git
cd frontend
npm ci
```

## Environment Variables

Copy the checked-in `.env.example` to `.env.local` and adjust its values.

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env.local
```

**Linux Bash:**

```bash
cp .env.example .env.local
```

The supplied environment template documents these public settings:

```env
# Backend API gateway, including /api.
NEXT_PUBLIC_API_URL=http://localhost:4000/api

# Optional: only enable for a suitable paid Cloudinary plan.
NEXT_PUBLIC_CLOUDINARY_PREMIUM=false
```

`NEXT_PUBLIC_API_URL` takes precedence over the legacy `NEXT_PUBLIC_API_BASE_URL`; the default API base is `http://localhost:4000/api`. `NEXT_PUBLIC_` values are included in the browser build: **never place private keys, tokens or passwords in these variables**.

Google login uses the backend `/auth/google` redirect. See [Google login setup](docs/google-login.md) for OAuth callback configuration and [the project structure guide](docs/project-structure.md) for source responsibilities.

## Running the Application

Start the development server from the frontend repository root:

```bash
npm run dev
```

Local frontend: `http://localhost:3000`

Run the API gateway and its required domain services separately using the instructions in the [backend repository](https://github.com/ConstructPro-ERP/backend). The frontend development server does not start them.

## Build and Production Start

```bash
npm run build
npm start
```

The first command builds the production application; the second serves the compiled build locally.

## CI Verification Commands

Run these commands before opening a pull request:

| Command                        | Purpose                                  |
| ------------------------------ | ---------------------------------------- |
| `npm ci`                       | Install locked dependencies              |
| `npm run lint`                 | ESLint validation                        |
| `npm run format:check`         | Check formatting without rewriting files |
| `npm run typecheck`            | TypeScript validation                    |
| `npm test`                     | Node-based frontend test suite           |
| `npm run build`                | Production build                         |
| `npm audit --audit-level=high` | Dependency audit                         |

Additional targeted test commands:

| Command                          | Purpose                               |
| -------------------------------- | ------------------------------------- |
| `npm run test:coverage`          | Scoped Node test coverage             |
| `npm run test:dashboard-cache`   | Dashboard caching tests               |
| `npm run test:portal`            | Client portal tests                   |
| `npm run test:quotation-quality` | Quotation-focused Vitest and coverage |
| `npm run format`                 | Rewrite formatting with Prettier      |

Recorded frontend test results in the Final Development Report (October 2026): **319 passing tests** (173 `node:test` tests and 146 Vitest component tests). Scoped line coverage was **94.6% for quotations**, **75.4% for the dashboard**, and **71.4% for the client portal**. The badge represents **quotation-module line coverage**, not frontend-wide coverage. Cross-repository browser workflows are maintained in the [tests repository](https://github.com/ConstructPro-ERP/tests).

## Branching and Pull Request Workflow

ConstructPro uses the course project's collaborative workflow:

- `main` and `develop` are long-lived branches; open normal development pull requests against `develop`.
- Create short-lived `feature/<ticket-id>-<slug>` or `fix/<ticket-id>-<slug>` branches.
- Ensure required CI checks pass and obtain peer review before merging.
- Do not commit directly to `main`.

The frontend Vercel configuration enables deployments for `develop` and `main` while suppressing deployments from other branches. Do not assume all pull requests generate Vercel previews.

## Related Repositories

| Repository                                                  | Purpose                                                 |
| ----------------------------------------------------------- | ------------------------------------------------------- |
| [Frontend](https://github.com/ConstructPro-ERP/frontend)    | Next.js frontend and scoped frontend tests              |
| [Backend](https://github.com/ConstructPro-ERP/backend)      | NestJS API gateway, domain services and Prisma database |
| [Tests](https://github.com/ConstructPro-ERP/tests)          | Playwright integration and browser E2E tests            |
| [Infrastructure](https://github.com/ConstructPro-ERP/infra) | Shared CI workflows and performance tooling             |
| [Documents](https://github.com/ConstructPro-ERP/documents)  | SRS, SDS, ADRs and verification reports                 |

## CI/CD

GitHub Actions delegates frontend CI from [`.github/workflows/ci.yml`](.github/workflows/ci.yml) to `ConstructPro-ERP/infra/.github/workflows/frontend-ci.yml@v1`. The reusable workflow runs dependency installation, lint, formatting checks, `npm test`, a production build and a dependency audit on Node.js 24. The other targeted test scripts are available locally but are not all separate CI gates.

## Project Evidence

- [SRS](https://github.com/ConstructPro-ERP/documents/blob/develop/srs/srs-final.pdf)
- [SDS](https://github.com/ConstructPro-ERP/documents/blob/develop/sds/sds-final.pdf)
- [Test register](https://github.com/ConstructPro-ERP/documents/blob/develop/testing/test-register.pdf)
- [Sprint 8 coverage report](https://github.com/ConstructPro-ERP/documents/blob/develop/testing/coverage-sprint8.pdf)
- [Performance report](https://github.com/ConstructPro-ERP/documents/blob/develop/testing/performance-report.pdf)

These reports have their own stated scope and must not be interpreted as proof that every test passes on the current deployment.

## Current Development Reference

All backend requests must use `apiClient` from [`src/lib/axios.ts`](src/lib/axios.ts). Do not create another Axios instance or use raw Axios/fetch for backend requests. Preserve the shared client's interceptors, refresh workflows, retry policies and standardized error handling when making changes.

| Path                           | Responsibility                                       |
| ------------------------------ | ---------------------------------------------------- |
| `src/app/`                     | App Router pages and layouts                         |
| `src/components/`              | Dashboard features, layouts and shared UI            |
| `src/services/`                | API operations                                       |
| `src/lib/`                     | API configuration, errors, tokens and domain helpers |
| `src/providers/`, `src/store/` | Authentication and Redux state                       |
| `src/types/`                   | Shared TypeScript contracts                          |
| `test/`, `docs/`               | Frontend tests and feature documentation             |

## Academic Project

Developed as part of **SENG 34213 – System Development Project**, Bachelor of Science (Hons.) in Software Engineering, University of Kelaniya.
