"use client";

import { useActionState, useEffect, useRef, useState, startTransition } from "react";
import type { ReactNode } from "react";
import { CircleCheck } from "lucide-react";

import {
  checkHandleAvailability,
  claimHandle,
  type ClaimHandleResult,
} from "@/app/onboarding/actions";
import { handleSchema } from "@/lib/validation/handle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { ProfilePreview } from "./profile-preview";

const CHECK_DELAY_MS = 400;
const initialState: ClaimHandleResult = { status: "idle" };

type Status =
  | { kind: "empty" }
  | { kind: "checking" }
  | { kind: "available" }
  | { kind: "unavailable"; message: string; suggestions: string[] };

type OnboardingFlowProps = {
  displayName: string;
  initialHandle: string;
  initialSuggestions: string[];
  children: ReactNode;
};

export function OnboardingFlow({
  displayName,
  initialHandle,
  initialSuggestions,
  children,
}: OnboardingFlowProps) {
  const [username, setUsername] = useState(initialHandle);
  const [status, setStatus] = useState<Status>(
    initialHandle ? { kind: "available" } : { kind: "empty" },
  );
  const [state, formAction, pending] = useActionState(claimHandle, initialState);
  // A claim error stays visible until the user edits the name again.
  const [dismissedState, setDismissedState] = useState<ClaimHandleResult>(initialState);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const latest = useRef(initialHandle);

  useEffect(() => () => clearTimeout(timer.current), []);

  function changeUsername(raw: string) {
    const value = raw.toLowerCase().replace(/\s+/g, "");
    setUsername(value);
    setDismissedState(state);
    latest.current = value;
    clearTimeout(timer.current);

    if (!value) {
      setStatus({ kind: "empty" });
      return;
    }
    const parsed = handleSchema.safeParse(value);
    if (!parsed.success) {
      setStatus({
        kind: "unavailable",
        message: parsed.error.issues[0]?.message ?? "Choose a different username",
        suggestions: [],
      });
      return;
    }

    setStatus({ kind: "checking" });
    timer.current = setTimeout(() => {
      startTransition(async () => {
        try {
          const result = await checkHandleAvailability(value);
          if (latest.current !== value) return; // the user kept typing
          setStatus(
            result.available
              ? { kind: "available" }
              : {
                  kind: "unavailable",
                  message: result.message ?? "Choose a different username",
                  suggestions: result.suggestions,
                },
          );
        } catch {
          if (latest.current !== value) return;
          setStatus({
            kind: "unavailable",
            message: "Couldn't check that username. Try again.",
            suggestions: [],
          });
        }
      });
    }, CHECK_DELAY_MS);
  }

  const claimError =
    state !== dismissedState && state.status === "error"
      ? (state.fieldErrors.handle?.[0] ?? state.formError)
      : undefined;
  const errorMessage = claimError ?? (status.kind === "unavailable" ? status.message : undefined);
  const suggestions =
    status.kind === "empty"
      ? initialSuggestions
      : status.kind === "unavailable"
        ? status.suggestions
        : [];
  const canContinue = status.kind === "available" && !claimError && !pending;

  return (
    <div className="flex min-h-screen flex-wrap bg-paper">
      <div className="flex min-w-0 flex-[1_1_440px] flex-col p-[clamp(20px,4vw,48px)]">
        <span className="font-display text-28 leading-none font-extrabold tracking-[-0.04em] text-fg">
          linkbase
        </span>
        <main className="mx-auto flex w-full max-w-[460px] flex-col items-center pt-[clamp(40px,10vh,104px)] pb-10 text-center">
          {children}
          <form action={formAction} noValidate className="flex w-full flex-col items-center">
            <label htmlFor="onboarding-handle" className="sr-only">
              Username
            </label>
            <div className="w-full text-left">
              <Input
                id="onboarding-handle"
                name="handle"
                prefix="linkbase.me/"
                placeholder="username"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={30}
                value={username}
                onChange={(event) => changeUsername(event.target.value)}
                aria-invalid={!!errorMessage}
                aria-describedby="onboarding-handle-status"
              />
            </div>

            <div
              id="onboarding-handle-status"
              aria-live="polite"
              className="mt-2.5 flex min-h-[22px] w-full flex-col items-start gap-2.5 text-left"
            >
              {errorMessage ? (
                <p className="text-14 leading-normal text-danger">{errorMessage}</p>
              ) : status.kind === "available" ? (
                <p className="flex items-center gap-1.5 text-14 leading-normal font-medium text-success">
                  <CircleCheck size={16} strokeWidth={2} aria-hidden="true" />
                  <span className="min-w-0 break-all">linkbase.me/{username} is available</span>
                </p>
              ) : status.kind === "checking" ? (
                <p className="text-14 leading-normal text-fg-muted">Checking availability…</p>
              ) : null}

              {suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => changeUsername(suggestion)}
                      className="h-[34px] rounded-full bg-surface-chip px-3.5 text-14 leading-none font-medium text-fg-secondary transition-colors duration-120 ease-out hover:bg-surface-chip-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <p className="my-6 text-14 leading-[1.5] text-pretty text-fg-muted">
              By continuing, you agree to receive offers, news and updates from Linkbase.
            </p>

            <Button type="submit" size="lg" fullWidth disabled={!canContinue}>
              {pending ? "Saving…" : "Continue"}
            </Button>
          </form>
        </main>
      </div>

      <ProfilePreview displayName={displayName} handle={username} />
    </div>
  );
}
