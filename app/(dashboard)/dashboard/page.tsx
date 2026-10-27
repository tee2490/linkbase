import type { Metadata } from "next";
import { Suspense } from "react";

import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";

export const metadata: Metadata = {
  title: "Dashboard · Linkbase",
};

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-container px-5 py-12 sm:px-10">
      <Suspense fallback={<div aria-hidden="true" className="h-[100px] max-w-panel rounded-lg bg-surface" />}>
        <DashboardWelcome />
      </Suspense>
    </div>
  );
}

async function DashboardWelcome() {
  // Server-side identity and onboarding check: the proxy alone isn't the security boundary (docs/auth.md).
  const user = await requireOnboardedUser();

  return (
    <section className="flex max-w-panel flex-col gap-2 rounded-lg bg-surface p-10 shadow-card">
      <h1 className="m-0 text-title-sm text-ink-app">Welcome to Linkbase</h1>
      <p className="m-0 text-body-md text-muted-app">
        You&apos;re signed in as <span className="font-semibold text-ink-app">{user.email}</span>.
      </p>
    </section>
  );
}
