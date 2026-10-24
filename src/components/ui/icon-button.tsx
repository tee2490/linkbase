import type { ComponentProps } from "react";
import type { LucideIcon } from "lucide-react";

type IconButtonVariant = "soft" | "float" | "plain" | "dark";
type IconButtonShape = "circle" | "square";

const VARIANT_CLASSES: Record<IconButtonVariant, string> = {
  soft: "bg-surface-chip text-fg hover:bg-surface-chip-hover",
  float: "bg-surface-card text-fg shadow-float hover:bg-mist",
  plain: "bg-transparent text-fg hover:bg-surface-chip",
  dark: "bg-ink text-white hover:bg-ink-2",
};

type IconButtonProps = Omit<ComponentProps<"button">, "children" | "aria-label"> & {
  icon: LucideIcon;
  // Required: it's the button's only accessible name (see docs/ui.md "IconButton").
  label: string;
  variant?: IconButtonVariant;
  shape?: IconButtonShape;
  size?: number;
};

export function IconButton({
  icon: Icon,
  label,
  variant = "soft",
  shape = "circle",
  size = 40,
  type = "button",
  className = "",
  style,
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`inline-flex shrink-0 items-center justify-center transition duration-120 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 ${shape === "circle" ? "rounded-full" : "rounded-md"} ${VARIANT_CLASSES[variant]} ${className}`}
      style={{ width: size, height: size, ...style }}
      {...props}
    >
      <Icon size={Math.round(size * 0.45)} strokeWidth={1.75} aria-hidden="true" />
    </button>
  );
}
