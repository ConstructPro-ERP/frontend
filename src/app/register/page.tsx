// src/app/register/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import AuthLayout from "@/components/ui/AuthLayout";
import RegisterForm from "./components/RegisterForm";

export const metadata: Metadata = {
  title: "Sign Up — ConstructPro",
  description:
    "Create your ConstructPro account and start managing your construction operations.",
};

export default function RegisterPage() {
  return (
    <AuthLayout
      illustration={
        <Image
          src="/illustrations/signup-illustration.svg"
          alt="Sign Up Illustration"
          fill
          className="object-cover object-left"
          priority
        />
      }
    >
      <RegisterForm />
    </AuthLayout>
  );
}
