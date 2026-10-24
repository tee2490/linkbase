"use client";

import { Button } from "@/components/ui/button";

type DashboardErrorProps = {
  error: unknown;
  retry: () => void;
};

// Shows only the digest, never the raw message (see docs/errors-and-validation.md).
export default function DashboardError({ error, retry }: DashboardErrorProps) {
  const digest = error instanceof Error && "digest" in error ? String(error.digest) : undefined;

  return (
    <main
      role="alert"
      className="mx-auto flex w-full max-w-editor flex-col items-start gap-4 px-6 py-16"
    >
      <h1 className="m-0 font-display text-28 leading-tight font-bold tracking-[-0.02em]">
        Something went wrong
      </h1>
      <p className="m-0 text-16 text-fg-muted">
        Please try again. If it keeps happening, contact support
        {digest && ` with code ${digest}`}.
      </p>
      <Button onClick={() => retry()}>Try again</Button>
    </main>
  );
}
