# ConstructPro Frontend

![CI Status](https://img.shields.io/badge/CI-Passing-brightgreen)
![Coverage](https://img.shields.io/badge/Coverage-TBD-success)
<!-- ![Coverage](https://img.shields.io/badge/Coverage-80%25+-success) -->

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
|-----------|-----------|
| Node.js | 20+ |
| npm | Latest |
| Git | Latest |

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
npm install
```

---

## Environment Variables

Create a `.env.local` file in the project root.

Example:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
```

> Only example values should be committed. Never commit secrets or production configuration.

---

## Running the Application

Start the development server:

```bash
npm dev
```

Frontend URL:

```text
http://localhost:3000
```

---

## Build Command

Build the frontend application:

```bash
npm build
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
npm install
```

### Lint

```bash
npm lint
```

### Format Check

```bash
npm format:check
```

### Build Verification

```bash
npm build
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

| Repository | Purpose |
|------------|----------|
| frontend | Next.js frontend application |
| backend | NestJS backend API |
| infra | Infrastructure and CI/CD configuration |
| documents | SRS, SDS, ADRs, and project documentation |
| test | Integration and end-to-end testing |

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
