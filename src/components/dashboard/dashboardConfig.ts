import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  FileText,
  FolderKanban,
  LayoutDashboard,
  ReceiptText,
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
    title: "Documents",
    href: "/dashboard/documents",
    icon: ReceiptText,
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
  description: string;
  breadcrumbs?: { label: string; href?: string }[];
  searchPlaceholder?: string;
};

export const dashboardPageConfigs: Record<string, DashboardPageConfig> = {
  "/dashboard": {
    title: "Dashboard",
    description: "Sunday, 12 April 2026 · Good morning, Admin",
    breadcrumbs: [{ label: "Dashboard" }],
    searchPlaceholder: "Search anything...",
  },
  "/dashboard/users": {
    title: "User Management",
    description: "Sunday, 12 April 2026 · Good morning, Admin",
    breadcrumbs: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Users" },
    ],
    searchPlaceholder: "Search anything...",
  },
  "/dashboard/leads": {
    title: "Lead Management",
    description: "Track inquiries, follow-ups, and conversions",
    breadcrumbs: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Leads" },
    ],
    searchPlaceholder: "Search leads...",
  },
  "/dashboard/quotations": {
    title: "Quotations",
    description: "Sunday, 12 April 2026 · Good morning, Admin",
    breadcrumbs: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Quotations" },
    ],
    searchPlaceholder: "Search anything...",
  },
  "/dashboard/projects": {
    title: "Projects",
    description: "Sunday, 12 April 2026 · Good morning, Admin",
    breadcrumbs: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Projects" },
    ],
    searchPlaceholder: "Search anything...",
  },
  "/dashboard/documents": {
    title: "Documents",
    description: "Sunday, 12 April 2026 · Good morning, Admin",
    breadcrumbs: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Documents" },
    ],
    searchPlaceholder: "Search anything...",
  },
  "/dashboard/finance": {
    title: "Invoices & Payments",
    description: "LKR 6.8M outstanding · 5 overdue invoices",
    breadcrumbs: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Finance" },
    ],
    searchPlaceholder: "Search invoices...",
  },
  "/dashboard/analytics": {
    title: "Analytics & AI Risk Prediction",
    description: "Powered by RAG · LangChain · Last analysed 2 hours ago",
    breadcrumbs: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Analytics" },
    ],
    searchPlaceholder: "Search analytics...",
  },
};
