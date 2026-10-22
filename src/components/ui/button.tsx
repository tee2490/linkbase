import type { ComponentProps } from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "accent" | "inverse" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type ButtonClassOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-action text-action-fg hover:bg-action-hover",
  secondary: "bg-surface-chip text-fg hover:bg-surface-chip-hover",
  outline: "border-border-subtle bg-surface-card text-fg hover:bg-surface-chip",
  accent: "bg-accent text-accent-fg hover:bg-accent-hover",
  inverse: "bg-white text-fg hover:bg-cloud",
  ghost: "bg-transparent text-fg hover:bg-surface-chip",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-14",
  md: "h-12 px-[22px] text-16",
  lg: "h-14 px-7 text-[17px]",
};

// Shared with next/link so links can look like buttons (see docs/ui.md "Button").
export function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth = false,
}: ButtonClassOptions = {}) {
  return [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border border-transparent font-semibold leading-none tracking-[-0.01em] no-underline transition duration-120 ease-out motion-safe:active:scale-97 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    fullWidth ? "w-full" : "",
  ].join(" ");
}

type ButtonProps = ComponentProps<"button"> & ButtonClassOptions;

export function Button({
  variant,
  size,
  fullWidth,
  type = "button",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${buttonClasses({ variant, size, fullWidth })} ${className}`}
      {...props}
    />
  );
}
