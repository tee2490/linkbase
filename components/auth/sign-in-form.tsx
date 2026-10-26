"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { signInWithPassword } from "@/app/(auth)/sign-in/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { FormError } from "./form-error";

export function SignInForm() {
  const [state, formAction, pending] = useActionState(signInWithPassword, null);
  // Controlled, so the typed email survives the form reset after a failed submit.
  const [email, setEmail] = useState("");
  const fieldErrors = state?.ok === false ? state.fieldErrors : undefined;

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      <Input
        id="sign-in-email"
        name="email"
        type="email"
        label="Email"
        variant="field"
        autoComplete="email"
        inputMode="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={fieldErrors?.email?.[0]}
      />
      <Input
        id="sign-in-password"
        name="password"
        type="password"
        label="Password"
        variant="field"
        autoComplete="current-password"
        required
        error={fieldErrors?.password?.[0]}
      />
      <FormError message={state?.ok === false ? state.formError : undefined} />
      <Button type="submit" variant="ink" size="lg" disabled={pending} className="w-full">
        {pending ? "Signing in…" : "Log in"}
      </Button>
      <p className="m-0 text-center text-body-sm text-muted">
        New to Linkbase?{" "}
        <Link href="/sign-up" className="font-semibold text-ink underline underline-offset-4">
          Create an account
        </Link>
      </p>
    </form>
  );
}
