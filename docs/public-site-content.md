# Public site content and dashboard preview

The home, Modules, Workflow, and Security pages share product descriptions in `src/lib/publicContent.ts`. Keep these descriptions aligned with shipped UI and backend operations. Project documents are managed in project details; the standalone Documents dashboard route remains a placeholder. Payment recording describes payments received by the business, not an online checkout.

Public pages use existing account routes and section anchors. The shared header chooses a dashboard destination using the current user's route permissions. The footer includes only implemented public and account routes.

## Dashboard screenshot

`public/images/dashboard-preview.png` shows the dashboard with fictional sample data: five active projects, LKR 5.5M total invoiced revenue, LKR 2.5M collected, and LKR 3M outstanding. The 1783 × 882 image omits the Recent Activity panel and shows the admin account as Construct Pro. Client names remain unavailable in the preview because the dashboard currently does not map that field.

The homepage shows this image in a macOS-style window frame. The PNG preserves sharp text, and visitors can open the full-size asset to zoom in. The figure explicitly labels all values as illustrative sample data.

## Content boundaries

The public site does not advertise a dedicated client portal, online payments, digital signatures, MFA, compliance certifications, immutable audit logs, or advanced infrastructure controls. Add such claims only after their implementation and supporting evidence are available. The Security page describes the actual authentication, backend authorization, project assignment checks, and administrator account controls, without a fabricated permissions matrix.
