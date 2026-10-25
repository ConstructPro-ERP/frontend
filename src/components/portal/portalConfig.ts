import type { LucideIcon } from "lucide-react";
import {
  FileText,
  FolderKanban,
  FolderOpen,
  LayoutDashboard,
  Receipt,
} from "lucide-react";

export type PortalNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export const portalNavItems: PortalNavItem[] = [
  { title: "Overview", href: "/portal", icon: LayoutDashboard },
  { title: "Projects", href: "/portal/projects", icon: FolderKanban },
  { title: "Quotations", href: "/portal/quotations", icon: FileText },
  { title: "Invoices & payments", href: "/portal/billing", icon: Receipt },
  { title: "Documents", href: "/portal/documents", icon: FolderOpen },
];

export function isPortalNavActive(pathname: string, href: string) {
  return href === "/portal"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

export type PortalPageConfig = { title: string; description: string };

const portalPageConfigs: Record<string, PortalPageConfig> = {
  "/portal": {
    title: "Overview",
    description: "Your projects, quotations and shared documents",
  },
  "/portal/projects": {
    title: "Projects",
    description: "Status and progress of your projects",
  },
  "/portal/quotations": {
    title: "Quotations",
    description: "Quotations prepared for you",
  },
  "/portal/billing": {
    title: "Invoices & payments",
    description: "Billing status for your projects",
  },
  "/portal/documents": {
    title: "Documents",
    description: "Files shared with you by your project team",
  },
};

export function getPortalPageConfig(pathname: string): PortalPageConfig {
  if (pathname.startsWith("/portal/projects/")) {
    return {
      title: "Project details",
      description: "Progress, milestones and shared documents",
    };
  }
  return portalPageConfigs[pathname] ?? portalPageConfigs["/portal"];
}
