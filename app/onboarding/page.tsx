import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { ClaimHandle } from "@/components/onboarding/claim-handle";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export const metadata: Metadata = {
  title: "Pick your username · Linkbase",
};

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div aria-hidden="true" className="flex-1 bg-cobalt lg:bg-surface" />}>
      <OnboardingGate />
    </Suspense>
  );
}

async function OnboardingGate() {
  // Server-side identity check: the proxy alone isn't the security boundary (docs/auth.md).
  const user = await getCurrentUser();
  // No user but maybe a session cookie (e.g. the account was deleted): the proxy clears it on this URL.
  if (!user) redirect("/sign-in?session=expired");
  if (user.handle) redirect("/dashboard");

  return <ClaimHandle />;
}
