"use server";

import { CredentialsSignin } from "next-auth";
import { headers } from "next/headers";
import { z } from "zod";

import { SIGN_IN_RATE_LIMITED, signIn } from "@/lib/auth/auth";
import { safeCallbackUrl } from "@/lib/auth/callback-url";
import type { ActionResult } from "@/lib/types/action-result";
import { signInSchema } from "@/lib/validation/auth";

// The sign-in page stays static, so callbackUrl is read from the page that posted the form.
async function getCallbackUrl(): Promise<string> {
  const referer = (await headers()).get("referer");
  if (!referer || !URL.canParse(referer)) return safeCallbackUrl(undefined);
  return safeCallbackUrl(new URL(referer).searchParams.get("callbackUrl"));
}

export async function signInWithPassword(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  try {
    await signIn("credentials", { ...parsed.data, redirectTo: await getCallbackUrl() });
  } catch (err) {
    // Expected failures become results. Everything else, including the success redirect, is rethrown.
    if (err instanceof CredentialsSignin) {
      return {
        ok: false,
        formError:
          err.code === SIGN_IN_RATE_LIMITED
            ? "Too many attempts. Try again in a few minutes."
            : "Email or password is incorrect",
      };
    }
    throw err;
  }

  return { ok: true, data: undefined };
}
