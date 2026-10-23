"use client";

import { useActionState } from "react";
import Link from "next/link";

import { signInWithCredentials, type SignInResult } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SignInFormProps = {
  callbackUrl: string;
};

const initialState: SignInResult = { status: "idle" };

export function SignInForm({ callbackUrl }: SignInFormProps) {
  const [state, formAction, pending] = useActionState(signInWithCredentials, initialState);
  const errors = state.status === "error" ? state.fieldErrors : {};
  const formError = state.status === "error" ? state.formError : undefined;

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="sign-in-email" className="text-14 font-medium text-fg-secondary">
          Email
        </label>
        <Input
          id="sign-in-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "sign-in-email-error" : undefined}
        />
        {errors.email && (
          <p id="sign-in-email-error" className="text-13 text-danger">
            {errors.email[0]}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="sign-in-password" className="text-14 font-medium text-fg-secondary">
          Password
        </label>
        <Input
          id="sign-in-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "sign-in-password-error" : undefined}
        />
        {errors.password && (
          <p id="sign-in-password-error" className="text-13 text-danger">
            {errors.password[0]}
          </p>
        )}
      </div>

      {formError && (
        <p role="alert" className="text-14 text-danger">
          {formError}
        </p>
      )}

      <Button type="submit" size="lg" fullWidth disabled={pending}>
        {pending ? "Logging in…" : "Log in"}
      </Button>

      <p className="text-center text-14 text-fg-muted">
        New to Linkbase?{" "}
        <Link href="/sign-up" className="font-semibold text-fg underline-offset-2 hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
