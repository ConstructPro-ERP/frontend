import type { Metadata } from "next";
import UsersDashboardClient from "@/components/dashboard/users/UsersDashboardClient";

export const metadata: Metadata = {
  title: "Users | ConstructPro ERP",
  description:
    "Manage user accounts, roles and account access in ConstructPro.",
};

export default function UsersPage() {
  return <UsersDashboardClient />;
}
