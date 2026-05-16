"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface NutriInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  suffix?: React.ReactNode;
}

export const NutriInput = forwardRef<HTMLInputElement, NutriInputProps>(
  ({ label, error, icon, suffix, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-white/70">{label}</label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "input-glass",
              icon && "pl-11",
              suffix && "pr-16",
              error && "border-red-500/50 focus:border-red-500/70 focus:ring-red-500/20",
              className
            )}
            {...props}
          />
          {suffix && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-white/30">
              {suffix}
            </span>
          )}
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);

NutriInput.displayName = "NutriInput";
