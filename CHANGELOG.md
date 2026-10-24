# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- **Client portal** ([#82](https://github.com/ConstructPro-ERP/frontend/issues/82))
  - Added a read-only `/portal` experience, separate from the staff dashboard, for `CLIENT_PORTAL_USER` accounts: overview, projects with milestones, quotations, and shared documents with signed downloads.
  - Uses only the client-scoped `/client-portal/*` gateway routes; ownership is enforced by the backend.
  - Added loading, empty, error and retry states per section, and role-based redirects after sign-in.
  - Invoices and payments show an unavailable notice until the backend exposes client-scoped billing endpoints.
  - Removed client roles from the staff `/dashboard/documents` placeholder route.
- **DDP-92 — Secure project document upload integration** ([#74](https://github.com/ConstructPro-ERP/frontend/issues/74))
  - Integrated backend-signed direct Cloudinary uploads and verified document activation.
  - Added 6 MiB chunking, cumulative progress, controlled retries, and cancellation.
  - Supported construction document formats, including CAD, Revit, BIM, Lumion, 3D models, and archives.
  - Added a 10 MiB Cloudinary Free-plan upload limit with optional 50 MiB frontend configuration.
  - Aligned document metadata, uploader display, descriptions, secure downloads, editing, and deletion with backend APIs.
  - Added regression coverage for upload routing, validation, errors, chunking, permissions, and document management.
- Quotation Generation UI: dashboard panel to create quotations for a lead (dynamic item rows, validation, PDF placeholder, RBAC-gated for Admin/Manager) and wired the `/dashboard/quotations` route to it. (#27)
- Quotation Approval & Project Conversion UI: "Approve & Convert to Project" action on quotation cards (RBAC-gated for Admin/Manager) with per-card loading state, success banner showing the created project ID, informational handling for already-converted quotations, and inline messaging for rejected quotations. (#29)

### Fixed

- **DDP-94 — Task Management API alignment** ([#81](https://github.com/ConstructPro-ERP/frontend/issues/81))
  - Verified backend-driven task-name searching with categorical filters, sorting, and pagination while preserving the existing Tasks filter interface.
  - Aligned search validation with backend constraints and confirmed task CRUD, assignment, unassignment, and status request contracts.
  - Added regression tests for task validation, API parameters, CRUD requests, and existing filter controls.
  - Updated task API documentation for search behavior, nullable assignment, and response fields.

- Aligned milestone progress requests and responses with the backend API, separated metadata and progress updates, and corrected client-side milestone filtering, sorting, and pagination. (#63)
- Aligned project expense forms with backend Decimal(12,2) validation,
  optional category and description constraints, and inclusive date filters;
  preserved creator display and project-wide expense summaries. (#65)
