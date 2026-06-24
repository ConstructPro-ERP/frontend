"use client";
// src/app/login/components/LoginForm.tsx
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { Mail, Lock } from "lucide-react";
import {
  loginStart,
  loginSuccess,
  loginFailure,
} from "@/store/slices/authSlice";
import type { AppDispatch } from "@/store";
import AuthInput from "@/components/ui/AuthInput";
import AuthButton from "@/components/ui/AuthButton";
import AuthCheckbox from "@/components/ui/AuthCheckbox";
import apiClient from "@/lib/axios";
import { setRefreshToken } from "@/lib/token";
import type { AuthResponse } from "@/types/auth";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .pipe(z.email("Please enter a valid email address")),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: true },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setServerError(null);
    dispatch(loginStart());
    try {
      const res = await apiClient.post<AuthResponse>("/auth/login", {
        email: data.email,
        password: data.password,
      });

      if (res.data.refreshToken) {
        setRefreshToken(res.data.refreshToken);
      }

      dispatch(
        loginSuccess({
          user: res.data.user,
          accessToken: res.data.accessToken,
        }),
      );
      router.push("/modules");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Invalid email or password.";
      dispatch(loginFailure(message));
      setServerError(message);
    }
  };

  return (
    <div className="w-full">
      {/* Heading */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-on-background mb-2 leading-tight">
          Welcome to ConstructPro
          <br />
          Sign In to see latest updates.
        </h1>
        <p className="text-sm text-on-surface-muted font-medium">
          Enter your details to proceed further
        </p>
      </div>

      {/* Server Error Banner */}
      {serverError && (
        <div
          role="alert"
          className="mb-6 px-4 py-3 rounded-lg bg-error-container border border-error-outline text-on-error-container text-sm font-medium"
        >
          {serverError}
        </div>
      )}

      {/* Email/Password Form */}
      <form
        id="login-form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-6"
      >
        <AuthInput
          id="login-email"
          label="Email"
          type="email"
          placeholder="ex. john@company.com"
          autoComplete="email"
          icon={<Mail className="w-5 h-5" />}
          error={errors.email?.message}
          {...register("email")}
        />

        <AuthInput
          id="login-password"
          label="Password"
          type="password"
          placeholder="Start typing..."
          autoComplete="current-password"
          icon={<Lock className="w-5 h-5" />}
          error={errors.password?.message}
          {...register("password")}
        />

        {/* Remember me / Recover password row */}
        <div className="flex items-center justify-between">
          <AuthCheckbox
            id="login-remember-me"
            label="Remember me"
            {...register("rememberMe")}
          />
          <Link
            href="/recover"
            id="forgot-password-link"
            className="text-sm text-action hover:text-action-hover font-bold transition-colors"
          >
            Recover password
          </Link>
        </div>

        {/* Primary action and account switch link */}
        <div className="flex flex-col gap-4 mt-2">
          <AuthButton
            id="login-submit-btn"
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            className="w-full"
          >
            Sign In
          </AuthButton>
          <p className="text-center text-sm font-medium text-on-surface-muted">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-bold text-action hover:text-action-hover transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>
      </form>

      {/* Social Login Row */}
      <div className="mt-8">
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
