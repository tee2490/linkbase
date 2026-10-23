import { Suspense } from "react";
import type { Metadata } from "next";

import { DEFAULT_REDIRECT, safeCallbackUrl } from "@/lib/validation/auth";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = {
  title: "Log in · Linkbase",
};

type SignInFormWithCallbackProps = {
  searchParams: PageProps<"/sign-in">["searchParams"];
};

// searchParams is request data, so only this part waits for it; the heading stays
// in the static shell.
async function SignInFormWithCallback({ searchParams }: SignInFormWithCallbackProps) {
  const { callbackUrl } = await searchParams;
  return <SignInForm callbackUrl={safeCallbackUrl(callbackUrl)} />;
}

export default function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  return (
    <>
      <h1 className="mb-6 font-display text-28 leading-tight font-bold tracking-[-0.02em]">
        Welcome back
      </h1>
      <Suspense fallback={<SignInForm callbackUrl={DEFAULT_REDIRECT} />}>
        <SignInFormWithCallback searchParams={searchParams} />
      </Suspense>
    </>
  );
}
