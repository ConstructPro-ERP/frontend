"use client";
// src/components/ui/AuthCheckbox.tsx
import { forwardRef } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { Check } from "lucide-react";

interface AuthCheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: ReactNode;
}

const AuthCheckbox = forwardRef<HTMLInputElement, AuthCheckboxProps>(
  ({ id, label, className = "", ...props }, ref) => {
    return (
      <label
        htmlFor={id}
        className="group flex items-center gap-2.5 cursor-pointer select-none"
      >
        <input
          id={id}
          ref={ref}
          type="checkbox"
          className={["sr-only", className].join(" ")}
          {...props}
        />

        {/*
          Custom checkbox indicator.
          The real input stays accessible, while this box gives the UI a
          rounded-square checked state with the brand action color and white tick.
        */}
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-outline bg-surface-container-lowest transition-all duration-200 group-has-checked:border-action group-has-checked:bg-action"
          aria-hidden="true"
        >
          <Check
            className="h-3.5 w-3.5 text-on-action opacity-0 transition-opacity duration-150 group-has-checked:opacity-100"
            strokeWidth={3}
            aria-hidden="true"
          />
        </span>

        <span className="text-sm font-bold text-on-background">{label}</span>
      </label>
    );
  },
);

AuthCheckbox.displayName = "AuthCheckbox";
export default AuthCheckbox;
