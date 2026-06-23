// src/app/finish/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import AuthLayout from "@/components/ui/AuthLayout";
import FinishForm from "./components/FinishForm";

export const metadata: Metadata = {
  title: "Done — ConstructPro",
  description: "You are now successfully signed up.",
};

export default function FinishPage() {
  return (
    <AuthLayout
      illustration={
        <Image
          src="/illustrations/finish-illustration.svg"
          alt="Finish Illustration"
          fill
          className="object-cover object-left"
          priority
        />
      }
    >
      <FinishForm />
    </AuthLayout>
  );
}
