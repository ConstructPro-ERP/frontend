# ConstructPro Frontend

[![CI](https://github.com/ConstructPro-ERP/frontend/actions/workflows/ci.yml/badge.svg?branch=develop)](https://github.com/ConstructPro-ERP/frontend/actions/workflows/ci.yml)

**Live application:** https://construct-pro-teal.vercel.app/  
**API documentation (Swagger):** https://construct-pro-api-gateway.vercel.app/api/docs

## Overview

ConstructPro Frontend is the Next.js web application for the ConstructPro ERP system.

This repository contains the user-facing application that provides access to:

- Authentication and login
- Dashboard and KPI views
- Lead management
- Quotation management
- Project management
- Invoice and payment tracking
- Document management
- Analytics and reporting
- User management

The frontend communicates with the centralized ConstructPro NestJS backend API.

---

## Repository Purpose

The purpose of this repository is to provide the web-based user interface for ConstructPro ERP.

The frontend consumes backend REST APIs and provides role-based interfaces for administrators, sales managers, project managers, accountants, and client portal users.

---

## Technology Stack

### Frameworks

- Next.js
- React
- TypeScript

### Styling

- Tailwind CSS

### State Management

- Redux Toolkit

### Development Tools

- ESLint
- Prettier

### Deployment

- Vercel

---

## Prerequisites

Before running the frontend locally, ensure the following software is installed:

| Software | Version |
| -------- | ------- |
| Node.js  | 22+     |
| npm      | Latest  |
| Git      | Latest  |

### Verify Installation

```bash
node -v
npm -v
git --version
```

---

## Installation

Clone the repository:

```bash
git clone <repository-url>
cd frontend
```

Install dependencies:

```bash
npm ci
```

---

## Environment Variables

Create a `.env.local` file in the project root.

Example:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

> Only example values should be committed. Never commit secrets or production configuration.

Google login uses the backend redirect endpoint `/auth/google`. See [Google login setup](docs/google-login.md) for callback configuration and [the file guide](docs/project-structure.md) for the architecture and each source file's responsibility.

---

## Running the Application

Start the development server:

```bash
npm run dev
```

Frontend URL:

```text
http://localhost:3000
```

---

## Build Command

Build the frontend application:

```bash
npm run build
```

---

## Start Production Build

Run the production build locally:

```bash
npm start
```

---

## CI Verification Commands

The following commands mirror the frontend CI pipeline and should be run before opening a pull request.

### Install Dependencies

```bash
npm ci
```

### Lint

```bash
npm run lint
```

### Format Check

```bash
npm run format:check
```

### Build Verification

```bash
npm run build
```

### Dependency Security Scan

```bash
npm audit --audit-level=high
```

---

## Branching and Pull Request Workflow

ConstructPro follows the development workflow defined for SENG 34213.

### Main Branches

- `main`
- `develop`

### Feature Branches

```text
feature/<ticket-id>-<slug>
```

Example:

```text
feature/42-dashboard-page
```

### Bug Fix Branches

```text
fix/<ticket-id>-<slug>
```

### Pull Requests

- Create short-lived feature branches
- Open pull requests against `develop`
- Ensure CI checks pass
- Complete peer review before merging
- Do not commit directly to `main`

---

## Related Repositories

| Repository | Purpose                                   |
| ---------- | ----------------------------------------- |
| frontend   | Next.js frontend application              |
| backend    | NestJS backend API                        |
| infra      | Infrastructure and CI/CD configuration    |
| documents  | SRS, SDS, ADRs, and project documentation |
| test       | Integration and end-to-end testing        |

---

## CI/CD

GitHub Actions is used to automate:

- Dependency installation
- Lint checks
- Format validation
- Build verification
- Security scanning

All pull requests should pass CI validation before merging.

---

## Additional Notes

This README is intended for developer onboarding, repository maintenance, and project review activities.

Feature implementation details and system design documentation are maintained separately in the project documentation repository.

---

## License

Developed as part of:

**SENG 34213 – System Development Project**  
**Bachelor of Science (Hons.) in Software Engineering**  
**University of Kelaniya**

## Current development reference

`NEXT_PUBLIC_API_URL` takes precedence over the legacy `NEXT_PUBLIC_API_BASE_URL`.
The default is `http://localhost:4000/api`. Start the backend gateway and required
services separately. Public environment values are included in the browser build.

All backend requests must use `apiClient` from [src/lib/axios.ts](src/lib/axios.ts).
Do not create another Axios instance or use raw Axios/fetch for backend requests.
Changes to that client require explicit user approval; preserve its interceptors,
refresh workflows, retry policies, and standardized error handling.

| Command                          | Purpose                                         |
| -------------------------------- | ----------------------------------------------- |
| `npm run typecheck`              | Check TypeScript without emitting files         |
| `npm test`                       | Run Node-based tests in `test/*.test.mjs`       |
| `npm run test:coverage`          | Run those tests with scoped coverage thresholds |
| `npm run test:quotation-quality` | Run quotation Vitest tests with coverage        |
| `npm run format`                 | Rewrite formatting with Prettier                |

The Node test runner transpiles selected dashboard and analytics modules and mocks
their API client. Its coverage does not represent the whole application. Browser
workflows live in the separate `tests` repository.

| Path                           | Responsibility                                        |
| ------------------------------ | ----------------------------------------------------- |
| `src/app/`                     | App Router pages and layouts                          |
| `src/components/`              | Dashboard features, layouts, and shared UI            |
| `src/services/`                | API operations                                        |
| `src/lib/`                     | API configuration, errors, tokens, and domain helpers |
| `src/providers/`, `src/store/` | Authentication and Redux state                        |
| `src/types/`                   | Shared TypeScript contracts                           |
| `test/`, `docs/`               | Tests and feature documentation                       |

[Frontend CI](.github/workflows/ci.yml) delegates to
`ConstructPro-ERP/infra/.github/workflows/frontend-ci.yml@v1`.
Consult that reusable workflow for its current checks.
