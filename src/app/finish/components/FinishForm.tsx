"use client";
// src/app/finish/components/FinishForm.tsx
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import AuthButton from "@/components/ui/AuthButton";

export default function FinishForm() {
  const router = useRouter();

  const handleContinue = () => {
    router.push("/modules");
  };

  return (
    <div className="w-full text-center">
      {/* Completion state */}
      <div className="w-16 h-16 rounded-full bg-risk-low-container text-risk-low flex items-center justify-center mx-auto mb-6">
        <CheckCircle2
          className="h-8 w-8"
          strokeWidth={2.5}
          aria-hidden="true"
        />
      </div>

      {/* Heading */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-on-background mb-3 leading-tight">
          Registration complete.
        </h1>
        <p className="text-sm text-on-surface-muted font-medium leading-relaxed">
          Your account has been created successfully. You can now continue to
          ConstructPro ERP and start setting up projects, teams, and modules.
        </p>
      </div>

      <AuthButton
        id="finish-submit-btn"
        type="button"
        variant="primary"
        onClick={handleContinue}
        className="w-full"
      >
        Continue to dashboard
      </AuthButton>

      <p className="mt-6 text-center text-sm font-medium text-on-surface-muted">
        Want to use another account?{" "}
        <Link
          href="/login"
          className="font-bold text-action hover:text-action-hover transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
