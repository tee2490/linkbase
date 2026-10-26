"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { signUp } from "@/app/(auth)/sign-up/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { FormError } from "./form-error";

export function SignUpForm() {
  const [state, formAction, pending] = useActionState(signUp, null);
  // Controlled, so the typed email survives the form reset after a failed submit.
  const [email, setEmail] = useState("");
  const fieldErrors = state?.ok === false ? state.fieldErrors : undefined;

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      <Input
        id="sign-up-email"
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
        id="sign-up-password"
        name="password"
        type="password"
        label="Password"
        variant="field"
        autoComplete="new-password"
        required
        hint="At least 8 characters, with a letter and a number."
        error={fieldErrors?.password?.[0]}
      />
      <Input
        id="sign-up-confirm-password"
        name="confirmPassword"
        type="password"
        label="Confirm password"
        variant="field"
        autoComplete="new-password"
        required
        error={fieldErrors?.confirmPassword?.[0]}
      />
      <FormError message={state?.ok === false ? state.formError : undefined} />
      <Button type="submit" variant="ink" size="lg" disabled={pending} className="w-full">
        {pending ? "Creating account…" : "Create account"}
      </Button>
      <p className="m-0 text-center text-body-sm text-muted">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-semibold text-ink underline underline-offset-4">
          Log in
        </Link>
      </p>
    </form>
  );
}
