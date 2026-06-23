"use client";
// src/components/ui/AuthButton.tsx
import type { ButtonHTMLAttributes } from "react";

interface AuthButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "social" | "outline" | "google";
  isLoading?: boolean;
  children: React.ReactNode;
}

export default function AuthButton({
  variant = "primary",
  isLoading = false,
  children,
  className = "",
  disabled,
  ...props
}: AuthButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-3 py-3.5 px-8 rounded-xl font-bold text-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap";

  const variants = {
    primary:
      "bg-action text-on-action hover:bg-action-hover active:scale-[0.98]",
    secondary:
      "bg-action-soft text-action hover:bg-action-container active:scale-[0.98]",
    social:
      "bg-surface-container-lowest border border-outline-variant rounded-[10px] w-12 h-12 !p-0 shadow-sm hover:bg-surface-container flex items-center justify-center",
    outline:
      "bg-surface-container-lowest text-on-surface-variant border border-outline-variant hover:bg-surface-container hover:border-outline active:scale-[0.98]",
    google:
      "w-full bg-surface-container-lowest border border-outline-variant text-on-surface-variant rounded-xl hover:bg-surface-container hover:border-outline active:scale-[0.98] shadow-sm py-3.5",
  };

  return (
    <button
      className={[base, variants[variant], className].join(" ")}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
          Wait...
        </>
      ) : (
        children
      )}
    </button>
  );
}
