import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireUserId } from "@/lib/auth";
import { findAvailableHandles, getOnboardingState } from "@/lib/db/queries/users";
import { handleCandidates } from "@/lib/validation/handle";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

export const metadata: Metadata = {
  title: "Welcome · Linkbase",
};

const PREFILL_COUNT = 4; // one prefilled handle plus three suggestions

function Intro() {
  return (
    <>
      <h1 className="m-0 font-display text-[clamp(34px,4.4vw,48px)] leading-tight font-extrabold tracking-[-0.04em] text-balance">
        Welcome to Linkbase!
      </h1>
      <p className="mt-4 mb-8 text-[clamp(15px,1.4vw,17px)] leading-[1.5] text-pretty text-fg-muted">
        Choose your Linkbase username. You can always change it later.
      </p>
    </>
  );
}

async function Onboarding() {
  const userId = await requireUserId();
  const state = await getOnboardingState(userId);
  if (!state) throw new Error("Signed-in user not found");
  // The proxy normally handles this; a stale session cookie can still land here.
  if (state.handle) redirect("/dashboard");

  const [initialHandle = "", ...initialSuggestions] = await findAvailableHandles(
    handleCandidates(state.displayName),
    PREFILL_COUNT,
  );

  return (
    <OnboardingFlow
      displayName={state.displayName}
      initialHandle={initialHandle}
      initialSuggestions={initialSuggestions}
    >
      <Intro />
    </OnboardingFlow>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-paper" aria-hidden="true" />}>
      <Onboarding />
    </Suspense>
  );
}
