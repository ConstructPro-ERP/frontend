"use client";
// src/app/register/components/RegisterForm.tsx
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Mail, Lock } from "lucide-react";
import AuthInput from "@/components/ui/AuthInput";
import AuthButton from "@/components/ui/AuthButton";
import apiClient from "@/lib/axios";
import { useRouter } from "next/navigation";

const registerSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(100),
  email: z
    .string()
    .min(1, "Email is required")
    .pipe(z.email("Please enter a valid email address")),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree with the terms & conditions",
  }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

function splitFullName(fullName: string): {
  firstName: string;
  lastName: string;
} {
  const trimmed = fullName.trim().replace(/\s+/g, " ");
  const parts = trimmed.split(" ");
  const firstName = parts[0] ?? trimmed;
  const lastName = parts.length > 1 ? parts.slice(1).join(" ") : "";
  return { firstName, lastName };
}

export default function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { agreeToTerms: false },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setServerError(null);
    try {
      const { firstName, lastName } = splitFullName(data.fullName);
      await apiClient.post("/auth/register", {
        firstName,
        lastName,
        email: data.email,
        password: data.password,
      });
      router.push("/finish");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Registration failed. Please try again.";
      setServerError(message);
    }
  };

  return (
    <div className="w-full">
      {/* Heading */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-2 leading-tight">
          Welcome to ConstructPro
          <br />
          Sign Up to getting started.
        </h1>
        <p className="text-sm text-slate-500 font-medium">
          Enter your details to proceed further
        </p>
      </div>

      {serverError && (
        <div
          role="alert"
          className="mb-6 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm font-medium"
        >
          {serverError}
        </div>
      )}

      <form
        id="register-form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-6"
      >
        <AuthInput
          id="register-full-name"
          label="Full name"
          type="text"
          placeholder="ex. John Doe"
          autoComplete="name"
          icon={<User className="w-5 h-5" />}
          error={errors.fullName?.message}
          {...register("fullName")}
        />

        <AuthInput
          id="register-email"
          label="Email"
          type="email"
          placeholder="ex. john@company.com"
          autoComplete="email"
          icon={<Mail className="w-5 h-5" />}
          error={errors.email?.message}
          {...register("email")}
        />

        <AuthInput
          id="register-password"
          label="Password"
          type="password"
          placeholder="Start typing..."
          autoComplete="new-password"
          icon={<Lock className="w-5 h-5" />}
          error={errors.password?.message}
          {...register("password")}
        />

        {/* Terms & conditions */}
        <div>
          <label
            htmlFor="register-agree-terms"
            className="group flex items-center gap-2.5 cursor-pointer select-none"
          >
            <input
              id="register-agree-terms"
              type="checkbox"
              className="sr-only"
              {...register("agreeToTerms")}
            />
            <span
              className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center
                group-has-checked:border-[#5E81F4] transition-colors"
              aria-hidden="true"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#5E81F4] opacity-0 group-has-checked:opacity-100 transition-opacity" />
            </span>
            <span className="text-sm font-bold text-slate-900">
              I agree with terms &amp; conditions
            </span>
          </label>
          {errors.agreeToTerms && (
            <p className="text-xs text-red-500 mt-1.5">
              {errors.agreeToTerms.message}
            </p>
          )}
        </div>

        {/* Sign Up / Sign In toggle buttons */}
        <div className="flex gap-4 mt-2">
          <AuthButton
            id="register-submit-btn"
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            className="flex-1"
          >
            Sign Up
          </AuthButton>
          <Link href="/login" className="flex-1">
            <AuthButton variant="secondary" type="button" className="w-full">
              Sign In
            </AuthButton>
          </Link>
        </div>
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
