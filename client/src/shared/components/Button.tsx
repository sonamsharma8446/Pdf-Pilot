import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  isLoading?: boolean;
  iconOnly?: boolean;
  children: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "text-white bg-gradient-to-br from-indigo via-violet to-coral shadow-[var(--shadow-glow)] hover:brightness-110",
  secondary:
    "text-ink bg-surface border border-line-strong shadow-sm hover:bg-surface-2",
  ghost: "text-ink-soft bg-transparent hover:bg-surface-2 hover:text-ink",
  danger: "text-white bg-danger hover:brightness-110",
};

export function Button({
  variant = "primary",
  isLoading = false,
  iconOnly = false,
  disabled,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold text-sm
        transition-[filter,background-color,transform] duration-150 active:scale-[0.97]
        disabled:opacity-45 disabled:cursor-not-allowed disabled:shadow-none disabled:active:scale-100
        ${iconOnly ? "h-10 w-10 p-0" : "px-5 py-2.5"}
        ${variantClasses[variant]} ${className}`}
      aria-busy={isLoading || undefined}
      {...rest}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}
