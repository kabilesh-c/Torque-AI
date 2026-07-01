import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "destructive" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-40 disabled:cursor-not-allowed select-none";

  const variants = {
    primary:
      "bg-[var(--accent)] text-black hover:bg-yellow-300 focus:ring-[var(--accent)] active:scale-[0.98] shadow-[0_0_20px_rgba(232,255,0,0.15)]",
    secondary:
      "bg-[var(--surface-elevated)] text-[var(--text-primary)] border border-[var(--border-strong)] hover:bg-[var(--surface-hover)] hover:border-[var(--text-muted)] focus:ring-[var(--border-strong)] active:scale-[0.98]",
    ghost:
      "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)] focus:ring-[var(--border)]",
    destructive:
      "bg-[var(--destructive-dim)] text-[var(--destructive)] border border-[var(--destructive)] border-opacity-30 hover:bg-red-500 hover:text-white focus:ring-[var(--destructive)] active:scale-[0.98]",
    outline:
      "bg-transparent text-[var(--text-primary)] border border-[var(--border-strong)] hover:border-[var(--text-muted)] hover:bg-[var(--surface-elevated)] focus:ring-[var(--border-strong)] active:scale-[0.98]",
  };

  const sizes = {
    sm: "text-sm px-3 py-1.5 rounded-[var(--radius-sm)]",
    md: "text-sm px-4 py-2.5 rounded-[var(--radius)]",
    lg: "text-base px-6 py-3.5 rounded-[var(--radius-lg)]",
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="flex gap-0.5">
          <span
            className="w-1 h-1 bg-current rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="w-1 h-1 bg-current rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="w-1 h-1 bg-current rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </span>
      )}
      {children}
    </button>
  );
}
