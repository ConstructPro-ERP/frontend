import { redirect } from "next/navigation";

export default function RoleRequestPage() {
  redirect("/auth/select-role");
}
