import type { Metadata } from "next";

import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata: Metadata = {
  title: "Create your account · Linkbase",
};

export default function SignUpPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <h1 className="m-0 font-display text-display-md text-ink [font-stretch:112%]">Create your account</h1>
        <p className="m-0 text-body text-muted">Free to start. You&apos;ll pick your link next.</p>
      </div>
      <SignUpForm />
    </div>
  );
}
