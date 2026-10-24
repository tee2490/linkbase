import type { ComponentProps } from "react";

type InputProps = Omit<ComponentProps<"input">, "prefix"> & {
  prefix?: string;
  // Error state from docs/ui.md "Input": a red ring instead of the focus ring.
  invalid?: boolean;
};

export function Input({ prefix, invalid = false, className = "", ...props }: InputProps) {
  return (
    <div
      className={`flex h-[52px] items-center gap-1 rounded-md bg-surface-chip px-[18px] transition-shadow duration-120 ease-out ${invalid ? "ring-2 ring-danger" : "focus-within:ring-2 focus-within:ring-ink"}`}
    >
      {prefix ? <span className="shrink-0 text-16 text-fg-muted">{prefix}</span> : null}
      <input
        className={`min-w-0 flex-1 bg-transparent text-16 font-medium text-fg outline-none placeholder:font-normal placeholder:text-fg-muted ${className}`}
        {...props}
      />
    </div>
  );
}
