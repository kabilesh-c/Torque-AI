import React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-[var(--text-secondary)]"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
            {leftIcon}
          </span>
        )}
        <input
          id={inputId}
          className={cn(
            "w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-[var(--radius)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-all duration-200",
            "focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)]",
            "hover:border-[var(--border-strong)]",
            error && "border-[var(--destructive)] focus:ring-[var(--destructive)]",
            leftIcon && "pl-9",
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-[var(--destructive)]">{error}</p>
      )}
      {hint && !error && (
        <p className="text-xs text-[var(--text-muted)]">{hint}</p>
      )}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, options, className, id, ...props }: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="text-sm font-medium text-[var(--text-secondary)]"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          "w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-[var(--radius)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] transition-all duration-200",
          "focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)]",
          "hover:border-[var(--border-strong)]",
          error && "border-[var(--destructive)]",
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[var(--surface-elevated)]">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-[var(--destructive)]">{error}</p>}
    </div>
  );
}
