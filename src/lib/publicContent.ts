import {
  BarChart3,
  CalendarDays,
  FileText,
  Folder,
  HardHat,
  LayoutDashboard,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";

// Public descriptions of shipped UI, shared by the home and detail pages.
export const publicModules = [
  {
    id: "dashboard",
    icon: LayoutDashboard,
    title: "Home dashboard",
    description:
      "Review revenue, outstanding payments, leads, project progress, and recent activity in one place.",
    features: [
      "Revenue and payment summaries",
      "Active projects and status totals",
      "Recent business activity",
    ],
  },
  {
    id: "leads",
    icon: Users,
    title: "Lead management",
    description:
      "Manage inquiries, assigned sales contacts, lead status, notes, and contact details.",
    features: [
      "Search and filter leads",
      "Assign leads and update their status",
      "Keep notes and related quotations",
    ],
  },
  {
    id: "quotations",
    icon: FileText,
    title: "Quotations",
    description:
      "Prepare itemized quotations, manage approval and revision steps, and convert approved work into projects.",
    features: [
      "Quotation items and totals",
      "Approval, rejection, and revision",
      "PDFs and project conversion",
    ],
  },
  {
    id: "projects",
    icon: HardHat,
    title: "Project management",
    description:
      "Manage projects and their milestones, tasks, resources, expenses, and supporting documents.",
    features: [
      "Project status and assigned manager",
      "Milestone progress and project tasks",
      "Resources, expenses, and documents",
    ],
  },
  {
    id: "finance",
    icon: Wallet,
    title: "Invoices & payments",
    description:
      "Review invoices and outstanding balances, record received payments, and generate invoice PDFs.",
    features: [
      "Invoice status and payment details",
      "Payment recording",
      "Invoice PDF generation",
    ],
  },
  {
    id: "documents",
    icon: Folder,
    title: "Project documents",
    description:
      "Upload, categorize, download, and manage documents from each project's detail page.",
    features: [
      "Project document uploads",
      "Document categories",
      "Downloads and document removal",
    ],
  },
  {
    id: "analytics",
    icon: BarChart3,
    title: "Analytics & AI",
    description:
      "Review finance and project reports, overdue invoices, and project risk assessments with supporting context.",
    features: [
      "Revenue and project progress reports",
      "Overdue invoice summaries",
      "AI project risk assessments",
    ],
  },
  {
    id: "calendar",
    icon: CalendarDays,
    title: "Project calendar",
    description:
      "Connect a Google Calendar account and manage calendar events within project details.",
    features: [
      "Google Calendar connection settings",
      "Project calendar events",
      "Create, update, and remove events",
    ],
  },
  {
    id: "users",
    icon: ShieldCheck,
    title: "User management",
    description:
      "Administrators can create and edit accounts, assign available roles, and activate or deactivate users.",
    features: [
      "User search and role filters",
      "Account and role updates",
      "Activation and deactivation",
    ],
  },
];

export const publicWorkflow = [
  {
    icon: Users,
    title: "Manage the lead",
    description:
      "Capture the inquiry, assign a sales contact, and track status, notes, and contact details.",
  },
  {
    icon: FileText,
    title: "Prepare a quotation",
    description:
      "Build an itemized quotation and manage submission, approval, rejection, or revision.",
  },
  {
    icon: HardHat,
    title: "Plan and track the project",
    description:
      "Convert approved work into a project and manage milestones, tasks, documents, resources, and expenses.",
  },
  {
    icon: Wallet,
    title: "Track invoices and payments",
    description:
      "Review invoice details, record received payments, and monitor collected and outstanding amounts.",
  },
];

export const publicSecurity = [
  {
    icon: Users,
    title: "Account sign-in",
    description:
      "Sign in with email and password or Google. Password authentication uses hashed passwords, and authenticated requests use access tokens.",
  },
  {
    icon: ShieldCheck,
    title: "Role-based authorization",
    description:
      "Protected operations check the account's permissions. Available dashboard pages depend on the signed-in user's role.",
  },
  {
    icon: HardHat,
    title: "Project access checks",
    description:
      "Project operations check the account's role and, for project managers, whether the project is assigned to them.",
  },
  {
    icon: Users,
    title: "Administrator account controls",
    description:
      "Administrators manage account details and roles. Deactivating an account prevents it from continuing to access protected operations.",
  },
];
