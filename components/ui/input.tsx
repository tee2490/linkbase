import type { ComponentProps } from "react";

type InputProps = Omit<ComponentProps<"input">, "id" | "prefix" | "size"> & {
  id: string;
  label: string;
  prefix?: string;
  variant?: "surface" | "field";
  hideLabel?: boolean;
  hint?: string;
  error?: string;
};

const variantClasses = {
  surface: "bg-surface",
  field: "bg-field",
};

export function Input({
  id,
  label,
  prefix,
  variant = "surface",
  hideLabel = false,
  hint,
  error,
  ...rest
}: InputProps) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  // The hint is hidden while an error shows, so only reference what's rendered.
  const describedBy = error ? errorId : hint ? hintId : undefined;

  // With a hidden label the whole box is the <label>, so clicking the prefix focuses the input.
  const Box = hideLabel ? "label" : "div";

  return (
    <div className="flex flex-col gap-2">
      {hideLabel ? null : (
        <label htmlFor={id} className="text-label text-ink-app">
          {label}
        </label>
      )}
      <Box
        {...(hideLabel ? { htmlFor: id } : {})}
        className={`flex h-control-lg cursor-text items-center gap-0.5 rounded-sm px-4 text-[18px] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus on-dark:focus-within:outline-focus-inverse ${variantClasses[variant]} ${error ? "ring-2 ring-danger ring-inset" : ""}`}
      >
        {hideLabel ? <span className="sr-only">{label}</span> : null}
        {prefix ? <span className="flex-none font-medium text-muted">{prefix}</span> : null}
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="min-w-0 flex-1 bg-transparent p-0 font-medium text-ink-app outline-none placeholder:text-muted"
          {...rest}
        />
      </Box>
      {error ? (
        <p id={errorId} role="alert" className="m-0 text-body-sm text-danger">
          {error}
        </p>
      ) : null}
      {hint && !error ? (
        <p id={hintId} className="m-0 text-body-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
