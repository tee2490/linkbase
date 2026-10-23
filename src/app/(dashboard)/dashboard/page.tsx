import { Suspense } from "react";
import type { Metadata } from "next";

import { requireUserId } from "@/lib/auth";
import { getUserSummary } from "@/lib/db/queries/users";
import { SiteHeader } from "@/components/landing/site-header";

export const metadata: Metadata = {
  title: "Dashboard · Linkbase",
};

// Placeholder until the dashboard feature lands; it's the post-sign-in target.
async function SignedInAs() {
  const userId = await requireUserId();
  const user = await getUserSummary(userId);
  return (
    <p className="text-16 text-fg-muted">
      You&apos;re signed in as <span className="font-semibold text-fg">{user?.email}</span>.
    </p>
  );
}

export default function DashboardPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-editor px-6 py-16">
        <h1 className="mb-3 font-display text-36 leading-tight font-bold tracking-[-0.02em]">
          Your dashboard
        </h1>
        <Suspense fallback={<p className="h-6" aria-hidden="true" />}>
          <SignedInAs />
        </Suspense>
      </main>
    </>
  );
}
