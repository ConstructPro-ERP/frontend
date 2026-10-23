import type { Metadata } from "next";
import PortalShell from "@/components/portal/PortalShell";

export const metadata: Metadata = {
  title: "Client Portal | ConstructPro ERP",
  description:
    "Review your projects, quotations, invoices and shared documents.",
};

export default function PortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <PortalShell>{children}</PortalShell>;
}
