import type { ComponentProps, ReactNode, Ref } from "react";

type IconButtonVariant = "muted" | "ghost" | "surface";
type IconButtonSize = "sm" | "md";

type IconButtonProps = Omit<ComponentProps<"button">, "children" | "aria-label"> & {
  // Required: becomes the accessible name and the tooltip (docs/ui.md).
  label: string;
  icon: ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  ref?: Ref<HTMLButtonElement>;
};

const variantClasses: Record<IconButtonVariant, string> = {
  muted: "bg-surface-muted text-ink-app",
  ghost: "bg-transparent text-ink-app hover:bg-surface-muted",
  surface: "bg-surface text-ink-app",
};

const sizeClasses: Record<IconButtonSize, string> = {
  sm: "size-icon-btn-sm",
  md: "size-icon-btn",
};

export function IconButton({
  label,
  icon,
  variant = "muted",
  size = "md",
  className,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...rest}
      className={[
        "inline-flex flex-none items-center justify-center rounded-full transition duration-150 ease-out hover:brightness-[.94]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        variantClasses[variant],
        sizeClasses[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {icon}
    </button>
  );
}
