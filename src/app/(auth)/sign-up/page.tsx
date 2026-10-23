import type { Metadata } from "next";

import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata: Metadata = {
  title: "Sign up · Linkbase",
};

export default function SignUpPage() {
  return (
    <>
      <h1 className="mb-2 font-display text-28 leading-tight font-bold tracking-[-0.02em]">
        Create your Linkbase
      </h1>
      <p className="mb-6 text-16 text-fg-muted">You&apos;ll pick your username next.</p>
      <SignUpForm />
    </>
  );
}
