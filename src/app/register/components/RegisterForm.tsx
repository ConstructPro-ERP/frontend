"use client";
// src/app/register/components/RegisterForm.tsx
import { useEffect, useState } from "react";
import Link from "next/link";
import GoogleLoginButton from "@/components/ui/GoogleLoginButton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock } from "lucide-react";
import AuthInput from "@/components/ui/AuthInput";
import AuthButton from "@/components/ui/AuthButton";
import AuthCheckbox from "@/components/ui/AuthCheckbox";
import apiClient from "@/lib/axios";
import { useRouter } from "next/navigation";
import { getRoles, type RoleOption } from "@/services/roles";
import type { RegisterCredentials } from "@/types/auth";

const registerSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .pipe(z.email("Please enter a valid email address")),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  roleId: z.string().min(1, "Please select a role"),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree with the terms & conditions",
  }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [rolesError, setRolesError] = useState<string | null>(null);
  const [rolesAttempt, setRolesAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    async function loadRoles() {
      setRolesLoading(true);
      setRolesError(null);
      try {
        const options = await getRoles();
        if (!active) return;
        setRoles(options);
        if (options.length === 0) {
          setRolesError("No roles are available. Please try again later.");
        }
      } catch {
        if (active) {
          setRolesError("Unable to load roles. Please try again.");
        }
      } finally {
        if (active) setRolesLoading(false);
      }
    }
    void loadRoles();
    return () => {
      active = false;
    };
  }, [rolesAttempt]);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { agreeToTerms: false, roleId: "" },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setServerError(null);
    if (
      rolesLoading ||
      rolesError ||
      !roles.some((role) => role.id === data.roleId)
    ) {
      setError("roleId", { message: "Please select an available role" });
      return;
    }
    try {
      const credentials: RegisterCredentials = {
        username: data.email,
        email: data.email,
        password: data.password,
        roleId: data.roleId,
      };
      await apiClient.post("/auth/register", credentials);
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
        <h1 className="text-3xl font-bold text-on-background mb-2 leading-tight">
          Welcome to ConstructPro
          <br />
          Sign Up to getting started.
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
        id="register-form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-6"
      >
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

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="register-role"
            className="text-sm font-semibold text-on-surface-variant"
          >
            Role
          </label>
          <select
            id="register-role"
            {...register("roleId")}
            disabled={rolesLoading || !!rolesError || isSubmitting}
            aria-required="true"
            aria-invalid={!!errors.roleId || !!rolesError}
            aria-describedby={
              rolesError || errors.roleId ? "register-role-error" : undefined
            }
            className={`w-full py-3 px-4 bg-transparent text-sm text-on-background border-0 border-b-2 outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
              errors.roleId || rolesError
                ? "border-error focus:border-error-hover"
                : "border-outline-variant hover:border-outline focus:border-action"
            }`}
          >
            <option value="" disabled>
              {rolesLoading ? "Loading roles..." : "Select a role"}
            </option>
            {roles.map((role) => (
              <option
                key={role.id}
                value={role.id}
                className="bg-surface-container-lowest"
              >
                {role.roleName.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          {(rolesError || errors.roleId) && (
            <p
              id="register-role-error"
              role="alert"
              className="text-xs text-error mt-0.5"
            >
              {rolesError || errors.roleId?.message}
            </p>
          )}
          {rolesError && (
            <button
              type="button"
              className="self-start text-sm font-semibold text-action hover:text-action-hover"
              onClick={() => setRolesAttempt((attempt) => attempt + 1)}
            >
              Retry loading roles
            </button>
          )}
        </div>

        {/* Terms & conditions */}
        <div>
          <AuthCheckbox
            id="register-agree-terms"
            label="I agree with terms & conditions"
            {...register("agreeToTerms")}
          />
          {errors.agreeToTerms && (
            <p className="text-xs text-error mt-1.5">
              {errors.agreeToTerms.message}
            </p>
          )}
        </div>

        {/* Primary action and account switch link */}
        <div className="flex flex-col gap-4 mt-2">
          <AuthButton
            id="register-submit-btn"
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={rolesLoading || !!rolesError || roles.length === 0}
            className="w-full"
          >
            Sign Up
          </AuthButton>
          <p className="text-center text-sm font-medium text-on-surface-muted">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-action hover:text-action-hover transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </form>

      {/* Social Login Row */}
      <div className="mt-8">
        <GoogleLoginButton disabled={isSubmitting} />
      </div>
    </div>
  );
}
