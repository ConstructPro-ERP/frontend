import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";

export type DashboardNavItem = {
  section: "Main" | "Finance" | "Management";
  title: string;
  href: string;
  icon: LucideIcon;
};

export const dashboardNavItems: DashboardNavItem[] = [
  {
    section: "Main",
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    section: "Main",
    title: "Leads",
    href: "/dashboard/leads",
    icon: Users,
  },
  {
    section: "Main",
    title: "Quotations",
    href: "/dashboard/quotations",
    icon: FileText,
  },
  {
    section: "Main",
    title: "Projects",
    href: "/dashboard/projects",
    icon: FolderKanban,
  },
  {
    section: "Finance",
    title: "Invoices & Payments",
    href: "/dashboard/finance",
    icon: BarChart3,
  },
  {
    section: "Management",
    title: "Analytics & AI",
    href: "/dashboard/analytics",
    icon: TrendingUp,
  },
  {
    section: "Management",
    title: "User Management",
    href: "/dashboard/users",
    icon: Shield,
  },
];

export type DashboardPageConfig = {
  title: string;
  // Static description for pages that do not use a personalized greeting.
  description?: string;
  // The shared header generates a live date and personalized greeting.
  useGreeting?: boolean;
  breadcrumbs?: { label: string; href?: string }[];
};

export const dashboardPageConfigs: Record<string, DashboardPageConfig> = {
  "/dashboard": {
    title: "Dashboard",
    useGreeting: true,
    breadcrumbs: [{ label: "Dashboard" }],
  },
  "/dashboard/users": {
    title: "User Management",
    description: "Manage user accounts, roles and access",
    breadcrumbs: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Users" },
    ],
  },
  "/dashboard/leads": {
    title: "Lead Management",
    description: "Track inquiries, follow-ups, and conversions",
    breadcrumbs: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Leads" },
    ],
  },
  "/dashboard/quotations": {
    title: "Quotations",
    useGreeting: true,
    breadcrumbs: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Quotations" },
    ],
  },
  "/dashboard/projects": {
    title: "Projects",
    useGreeting: true,
    breadcrumbs: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Projects" },
    ],
  },
  "/dashboard/documents": {
    title: "Documents",
    useGreeting: true,
    breadcrumbs: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Documents" },
    ],
  },
  "/dashboard/finance": {
    title: "Invoices & Payments",
    description: "Track invoices, payments, and outstanding balances",
    breadcrumbs: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Finance" },
    ],
  },
  "/dashboard/analytics": {
    title: "Analytics & AI Risk Prediction",
    description: "Project performance and AI risk insights",
    breadcrumbs: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Analytics" },
    ],
  },
};
