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
    primary: "bg-[#5E81F4] text-white hover:bg-[#4a6fe0] active:scale-[0.98]",
    secondary:
      "bg-[#EFF2FE] text-[#5E81F4] hover:bg-[#e0e6fc] active:scale-[0.98]",
    social:
      "bg-white border border-slate-200 rounded-[10px] w-12 h-12 !p-0 shadow-sm hover:bg-slate-50 flex items-center justify-center",
    outline:
      "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98]",
    google:
      "w-full bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] shadow-sm py-3.5",
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
