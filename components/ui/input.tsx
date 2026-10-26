import type { ComponentProps } from "react";

type InputProps = Omit<ComponentProps<"input">, "id" | "prefix" | "size"> & {
  id: string;
  label: string;
  prefix?: string;
};

export function Input({ id, label, prefix, ...rest }: InputProps) {
  return (
    <label
      htmlFor={id}
      className="flex h-control-lg cursor-text items-center gap-0.5 rounded-sm bg-surface px-4 text-[18px] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus on-dark:focus-within:outline-focus-inverse"
    >
      <span className="sr-only">{label}</span>
      {prefix ? <span className="flex-none font-medium text-muted">{prefix}</span> : null}
      <input
        id={id}
        className="min-w-0 flex-1 bg-transparent p-0 font-medium text-ink-app outline-none placeholder:text-muted"
        {...rest}
      />
    </label>
  );
}
