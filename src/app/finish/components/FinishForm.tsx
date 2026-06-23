"use client";
// src/app/finish/components/FinishForm.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail } from "lucide-react";
import AuthInput from "@/components/ui/AuthInput";
import AuthButton from "@/components/ui/AuthButton";

const finishSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

type FinishFormValues = z.infer<typeof finishSchema>;

export default function FinishForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FinishFormValues>({
    resolver: zodResolver(finishSchema),
  });

  const onSubmit = async () => {
    setServerError(null);
    try {
      router.push("/modules");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";
      setServerError(message);
    }
  };

  return (
    <div className="w-full">
      {/* Heading */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-2 leading-tight">
          Registration complete.
          <br />
          Subscribe to our newsletters.
        </h1>
        <p className="text-sm text-slate-500 font-medium">
          Now you can setup your projects and teams
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
        id="finish-form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-6"
      >
        <AuthInput
          id="finish-email"
          label="Email"
          type="email"
          placeholder="Start typing..."
          autoComplete="email"
          icon={<Mail className="w-5 h-5" />}
          error={errors.email?.message}
          {...register("email")}
        />

        <AuthButton
          id="finish-submit-btn"
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          className="w-full"
        >
          Finish
        </AuthButton>
      </form>
    </div>
  );
}
