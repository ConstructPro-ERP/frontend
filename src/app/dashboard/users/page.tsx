import type { Metadata } from "next";
import DashboardPlaceholderPage from "@/components/dashboard/DashboardPlaceholderPage";

export const metadata: Metadata = {
  title: "Users | ConstructPro ERP",
  description: "Users dashboard placeholder for ConstructPro.",
};

export default function UsersPage() {
  return (
    <DashboardPlaceholderPage
      eyebrow="Users"
      title="User Management Placeholder"
      description="This placeholder keeps the dashboard navigation complete while staying within scope. It exists so the reusable shell can highlight and route to the Users module correctly."
    />
  );
}
