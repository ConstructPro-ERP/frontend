# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Quotation Generation UI: dashboard panel to create quotations for a lead (dynamic item rows, validation, PDF placeholder, RBAC-gated for Admin/Manager) and wired the `/dashboard/quotations` route to it. (#27)
- Quotation Approval & Project Conversion UI: "Approve & Convert to Project" action on quotation cards (RBAC-gated for Admin/Manager) with per-card loading state, success banner showing the created project ID, informational handling for already-converted quotations, and inline messaging for rejected quotations. (#29)
