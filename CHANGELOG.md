# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

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

- Aligned milestone progress requests and responses with the backend API, separated metadata and progress updates, and corrected client-side milestone filtering, sorting, and pagination. (#63)
- Aligned project expense forms with backend Decimal(12,2) validation,
  optional category and description constraints, and inclusive date filters;
  preserved creator display and project-wide expense summaries. (#65)
