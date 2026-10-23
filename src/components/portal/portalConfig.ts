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
