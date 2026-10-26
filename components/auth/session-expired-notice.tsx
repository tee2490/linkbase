"use client";

import { useSearchParams } from "next/navigation";

export function SessionExpiredNotice() {
  const searchParams = useSearchParams();
  if (searchParams.get("session") !== "expired") return null;

  return (
    <p role="status" className="m-0 rounded-sm bg-surface-muted px-4 py-3 text-body-sm text-ink-app">
      Your session has ended. Log in again.
    </p>
  );
}
