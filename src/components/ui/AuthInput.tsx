"use client";
// src/components/ui/AuthInput.tsx
import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  id: string;
  icon?: React.ReactNode;
}

const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, error, id, icon, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 relative">
        <label htmlFor={id} className="text-sm font-semibold text-slate-700">
          {label}
        </label>
        <div className="relative flex items-center w-full">
          <input
            id={id}
            ref={ref}
            className={[
              "w-full py-3 px-4 bg-transparent text-sm text-slate-900 placeholder:text-slate-400",
              "border-0 border-b-2 outline-none transition-colors duration-200",
              icon ? "pr-10" : "pr-0", // make room for icon
              error
                ? "border-red-400 focus:border-red-500 bg-red-50/10"
                : "border-slate-200 hover:border-slate-300 focus:border-[#5E81F4] focus:ring-0",
              className,
            ].join(" ")}
            {...props}
          />
          {icon && (
            <div className="absolute right-4 text-slate-400 pointer-events-none">
              {icon}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
      </div>
    );
  },
);

AuthInput.displayName = "AuthInput";
export default AuthInput;
