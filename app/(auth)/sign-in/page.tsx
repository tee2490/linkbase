import type { Metadata } from "next";
import { Suspense } from "react";

import { SessionExpiredNotice } from "@/components/auth/session-expired-notice";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = {
  title: "Log in · Linkbase",
};

export default function SignInPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <h1 className="m-0 font-display text-display-md text-ink [font-stretch:112%]">Welcome back</h1>
        <p className="m-0 text-body text-muted">Log in to manage your Linkbase page.</p>
      </div>
      {/* Only the notice reads the URL. The form stays outside any boundary, so it works before JS loads. */}
      <Suspense fallback={null}>
        <SessionExpiredNotice />
      </Suspense>
      <SignInForm />
    </div>
  );
}
