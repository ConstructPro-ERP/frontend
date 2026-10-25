// src/app/login/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import AuthLayout from "@/components/ui/AuthLayout";
import LoginForm from "./components/LoginForm";

export const metadata: Metadata = {
  title: "Sign In — ConstructPro",
  description:
    "Sign in to your ConstructPro account to access your construction operations dashboard.",
};

export default function LoginPage() {
  return (
    <AuthLayout
      illustration={
        <Image
          src="/illustrations/signin-illustration.svg"
          alt="Sign In Illustration"
          fill
          className="object-cover object-left"
          priority
        />
      }
    >
      <LoginForm />
    </AuthLayout>
  );
}
