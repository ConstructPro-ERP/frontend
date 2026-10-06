import type { Metadata } from "next";
import AuthLayout from "@/components/ui/AuthLayout";
import GoogleCallback from "./GoogleCallback";

export const metadata: Metadata = {
  title: "Completing sign in | ConstructPro ERP",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function AuthCallbackPage() {
  return (
    <AuthLayout>
      <GoogleCallback />
    </AuthLayout>
  );
}
