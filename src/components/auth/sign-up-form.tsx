"use client";

import { useActionState } from "react";
import Link from "next/link";

import { signUp, type SignUpResult } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: SignUpResult = { status: "idle" };

export function SignUpForm() {
  const [state, formAction, pending] = useActionState(signUp, initialState);
  const errors = state.status === "error" ? state.fieldErrors : {};
  const formError = state.status === "error" ? state.formError : undefined;

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="sign-up-email" className="text-14 font-medium text-fg-secondary">
          Email
        </label>
        <Input
          id="sign-up-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "sign-up-email-error" : undefined}
        />
        {errors.email && (
          <p id="sign-up-email-error" className="text-13 text-danger">
            {errors.email[0]}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="sign-up-password" className="text-14 font-medium text-fg-secondary">
          Password
        </label>
        <Input
          id="sign-up-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          aria-invalid={!!errors.password}
          aria-describedby="sign-up-password-hint"
        />
        <p
          id="sign-up-password-hint"
          className={`text-13 leading-[1.4] ${errors.password ? "text-danger" : "text-fg-muted"}`}
        >
          {errors.password ? errors.password[0] : "Use 8 or more characters."}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="sign-up-confirm-password" className="text-14 font-medium text-fg-secondary">
          Confirm password
        </label>
        <Input
          id="sign-up-confirm-password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={!!errors.confirmPassword}
          aria-describedby={errors.confirmPassword ? "sign-up-confirm-password-error" : undefined}
        />
        {errors.confirmPassword && (
          <p id="sign-up-confirm-password-error" className="text-13 text-danger">
            {errors.confirmPassword[0]}
          </p>
        )}
      </div>

      {formError && (
        <p role="alert" className="text-14 text-danger">
          {formError}
        </p>
      )}

      <Button type="submit" size="lg" fullWidth disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-center text-14 text-fg-muted">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-semibold text-fg underline-offset-2 hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
