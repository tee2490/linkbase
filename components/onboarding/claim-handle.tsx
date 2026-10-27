"use client";

import Link from "next/link";
import { Check, Link as LinkIcon } from "lucide-react";
import { useActionState, useEffect, useState } from "react";

import { checkHandle, claimHandle, type HandleAvailability } from "@/app/onboarding/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { handleFormatSchema } from "@/lib/validation/handle";

import { HandlePreview } from "./handle-preview";

const CHECK_DELAY_MS = 300;

type AvailabilityCheck = HandleAvailability & { handle: string };

export function ClaimHandle() {
  const [state, formAction, pending] = useActionState(claimHandle, null);
  const [handle, setHandle] = useState("");
  const [submittedHandle, setSubmittedHandle] = useState<string | null>(null);
  const [check, setCheck] = useState<AvailabilityCheck | null>(null);

  const format = handleFormatSchema.safeParse(handle);
  const formatError = handle && !format.success ? format.error.issues[0]?.message : undefined;
  // Only trust a result for what's in the field right now.
  const availability = check?.handle === handle ? check : null;
  // A save error belongs to the value that was submitted; editing the field clears it.
  const serverError =
    state?.ok === false && submittedHandle === handle ? state.fieldErrors?.handle?.[0] : undefined;
  const isTaken = availability?.available === false;
  const isAvailable = availability?.available === true && !serverError;

  useEffect(() => {
    if (!handleFormatSchema.safeParse(handle).success) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const result = await checkHandle(handle);
      // A rate-limited or failed check shows nothing; saving re-checks on the server anyway.
      if (!cancelled && result.ok) setCheck({ handle, ...result.data });
    }, CHECK_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [handle]);

  const error =
    formatError ?? serverError ?? (isTaken ? `linkbase/${handle} is already taken.` : undefined);
  const shown = format.success ? handle : "";

  return (
    <div className="relative grid flex-1 content-start overflow-hidden bg-cobalt pt-26 sm:content-center sm:justify-items-center sm:px-10 sm:py-16 lg:grid-cols-2 lg:content-stretch lg:justify-items-stretch lg:bg-surface lg:p-0">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 lg:hidden">
        <div className="absolute -top-15 left-5 h-35 w-24 rounded-2xl bg-lime sm:-top-12 sm:left-[8%] sm:h-[260px] sm:w-35" />
        <div className="absolute top-10 -right-10 h-12 w-45 rounded-full bg-orchid sm:top-auto sm:-right-14 sm:bottom-30 sm:h-18 sm:w-70" />
        <div className="absolute -bottom-10 left-[14%] hidden size-28 rounded-full bg-forest sm:block" />
      </div>

      <div className="relative flex w-full flex-col rounded-xl bg-surface px-5 pt-6 pb-8 sm:max-w-[600px] sm:p-10 sm:shadow-phone lg:max-w-none lg:rounded-none lg:px-18 lg:py-10 lg:shadow-none">
        <Link
          href="/"
          className="self-start rounded-sm font-display text-[26px] font-extrabold tracking-[-0.02em] text-ink [font-stretch:112%] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          Linkbase
        </Link>

        <main className="flex w-full flex-1 flex-col pt-8 sm:pt-12 lg:mx-auto lg:max-w-[480px] lg:justify-center lg:py-12">
          <form
            action={formAction}
            onSubmit={() => setSubmittedHandle(handle)}
            noValidate
            className="flex flex-col gap-6"
          >
            <div className="flex flex-col gap-3">
              <h1 className="m-0 font-display text-[32px] leading-[1.02] font-extrabold tracking-[-0.02em] text-ink [font-stretch:112%] sm:text-[44px] lg:text-[clamp(32px,3.4vw,48px)]">
                Welcome to Linkbase!
              </h1>
              <p className="m-0 text-body text-muted">
                Pick your username. It&apos;s the address people will visit.
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <Input
                id="onboarding-handle"
                name="handle"
                label="Your username"
                variant="field"
                prefix="linkbase/"
                placeholder="yourname"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                required
                value={handle}
                onChange={(event) => setHandle(event.target.value.toLowerCase().replace(/\s+/g, ""))}
                // The rules show until the user starts typing; then the live status takes over.
                hint={handle ? undefined : "3–30 characters: lowercase letters, numbers, hyphens and underscores."}
                error={error}
              />

              <div aria-live="polite" className="flex flex-col gap-2">
                {isAvailable ? (
                  <p className="m-0 flex items-center gap-1.5 text-body-sm font-medium text-success">
                    <Check size={18} strokeWidth={2.25} aria-hidden="true" />
                    <span>linkbase/{handle} is available</span>
                  </p>
                ) : null}
                {isTaken && availability.suggestions.length > 0 ? (
                  <div className="mt-1 flex flex-col gap-2">
                    <span className="text-body-sm text-muted">Try one of these:</span>
                    <div className="flex flex-wrap gap-2">
                      {availability.suggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => setHandle(suggestion)}
                          className="h-control-xs cursor-pointer rounded-full bg-surface-muted px-4 text-body-sm font-medium text-ink-app hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="mt-1 flex items-center gap-2 self-start rounded-full bg-surface-muted px-4 py-2 text-body-sm text-ink-app lg:hidden">
                <LinkIcon size={18} strokeWidth={1.75} aria-hidden="true" className="flex-none" />
                <span>
                  Your page: <strong className="font-semibold">linkbase/{shown || "yourname"}</strong>
                </span>
              </div>
            </div>

            <Button
              type="submit"
              variant="app"
              size="md"
              disabled={!format.success || isTaken || pending}
              className="w-full"
            >
              {pending ? "Saving…" : "Continue"}
            </Button>
          </form>
        </main>
      </div>

      <HandlePreview handle={shown} />
    </div>
  );
}
