// src/app/recover/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import AuthLayout from "@/components/ui/AuthLayout";
import RecoverForm from "./components/RecoverForm";

export const metadata: Metadata = {
  title: "Recover — ConstructPro",
  description:
    "Recover your ConstructPro account password. Enter your email to receive a reset link.",
};

export default function RecoverPage() {
  return (
    <AuthLayout
      illustration={
        <Image
          src="/illustrations/recover-illustration.svg"
          alt="Recover Illustration"
          fill
          className="object-cover object-left"
          priority
        />
      }
    >
      <RecoverForm />
    </AuthLayout>
  );
}
