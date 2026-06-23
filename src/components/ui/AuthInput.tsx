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
        <label
          htmlFor={id}
          className="text-sm font-semibold text-on-surface-variant"
        >
          {label}
        </label>
        <div className="relative flex items-center w-full">
          <input
            id={id}
            ref={ref}
            className={[
              "w-full py-3 px-4 bg-transparent text-sm text-on-background placeholder:text-on-surface-subtle",
              "border-0 border-b-2 outline-none transition-colors duration-200",
              icon ? "pr-10" : "pr-0", // make room for icon
              error
                ? "border-error focus:border-error-hover bg-error-container/20"
                : "border-outline-variant hover:border-outline focus:border-action focus:ring-0",
              className,
            ].join(" ")}
            {...props}
          />
          {icon && (
            <div className="absolute right-4 text-on-surface-subtle pointer-events-none">
              {icon}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-error mt-0.5">{error}</p>}
      </div>
    );
  },
);

AuthInput.displayName = "AuthInput";
export default AuthInput;
