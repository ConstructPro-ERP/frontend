"use client";
// src/app/recover/components/RecoverForm.tsx
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, ArrowLeft, Check } from "lucide-react";
import AuthInput from "@/components/ui/AuthInput";
import AuthButton from "@/components/ui/AuthButton";
import apiClient from "@/lib/axios";

const recoverSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .pipe(z.email("Please enter a valid email address")),
});

type RecoverFormValues = z.infer<typeof recoverSchema>;

export default function RecoverForm() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RecoverFormValues>({
    resolver: zodResolver(recoverSchema),
  });

  const onSubmit = async (data: RecoverFormValues) => {
    setServerError(null);
    try {
      await apiClient.post("/auth/forgot-password", { email: data.email });
      setSubmittedEmail(data.email);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";
      setServerError(message);
    }
  };

  if (submittedEmail) {
    return (
      <div className="w-full text-center">
        {/* Success state */}
        <div className="w-16 h-16 rounded-full bg-risk-low-container text-risk-low flex items-center justify-center mx-auto mb-6">
          <Check className="h-8 w-8" strokeWidth={2.5} aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-bold text-on-background mb-3">
          Check your email
        </h1>
        <p className="text-sm text-on-surface-muted mb-2 font-medium">
          We sent a password reset link to
        </p>
        <p className="text-sm font-bold text-action mb-8">{submittedEmail}</p>
        <p className="text-xs text-on-surface-subtle mb-6 font-medium">
          Didn&apos;t receive it? Check your spam folder, or{" "}
          <button
            type="button"
            onClick={() => setSubmittedEmail(null)}
            className="text-action hover:underline font-bold"
          >
            try again
          </button>
          .
        </p>
        <Link
          href="/login"
          id="back-to-login-link"
          className="text-sm text-on-surface-muted hover:text-on-surface-variant font-semibold transition-colors flex items-center justify-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Heading */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-on-background mb-2 leading-tight">
          Lost your password?
          <br />
          Enter your details to recover.
        </h1>
        <p className="text-sm text-on-surface-muted font-medium">
          Enter your details to proceed further
        </p>
      </div>

      {serverError && (
        <div
          role="alert"
          className="mb-6 px-4 py-3 rounded-lg bg-error-container border border-error-outline text-on-error-container text-sm font-medium"
        >
          {serverError}
        </div>
      )}

      <form
        id="recover-form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-6"
      >
        <AuthInput
          id="recover-email"
          label="Email"
          type="email"
          placeholder="Start typing..."
          autoComplete="email"
          icon={<Mail className="w-5 h-5" />}
          error={errors.email?.message}
          {...register("email")}
        />

        <AuthButton
          id="recover-submit-btn"
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          className="w-full"
        >
          Recover
        </AuthButton>
      </form>

      {/* Social Login Row */}
      <div className="mt-10">
        <AuthButton type="button" variant="google" onClick={() => {}}>
          <Image
            src="/logos/google-icon.svg"
            alt=""
            width={20}
            height={20}
            aria-hidden="true"
          />
          Sign in with Google
        </AuthButton>
      </div>
    </div>
  );
}
