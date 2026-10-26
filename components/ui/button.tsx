import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";

type ButtonVariant = "ink" | "forest" | "lime" | "soft";
type ButtonSize = "lg" | "sm";

type ButtonBaseProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
};

type ButtonProps = ButtonBaseProps &
  (
    | { href: string }
    | (Omit<ComponentProps<"button">, keyof ButtonBaseProps> & { href?: undefined })
  );

const variantClasses: Record<ButtonVariant, string> = {
  ink: "rounded-full bg-ink text-ink-inverse",
  forest: "rounded-full bg-forest text-ink-inverse",
  lime: "rounded-full bg-lime text-ink",
  soft: "rounded-sm bg-surface-soft text-ink",
};

const sizeClasses: Record<ButtonSize, string> = {
  lg: "h-control-lg px-8 text-label-lg",
  sm: "h-control-sm px-6 text-label",
};

export function Button({ variant = "ink", size = "lg", className, children, ...rest }: ButtonProps) {
  const classes = [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap transition duration-150 ease-out",
    "hover:brightness-[.94] motion-safe:active:scale-[.98]",
    "disabled:cursor-not-allowed disabled:opacity-[.45] disabled:hover:brightness-100",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus on-dark:focus-visible:outline-focus-inverse",
    variantClasses[variant],
    sizeClasses[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (rest.href !== undefined) {
    return (
      <Link href={rest.href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" {...rest} className={classes}>
      {children}
    </button>
  );
}
