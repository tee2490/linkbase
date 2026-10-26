"use server";

import { headers } from "next/headers";
import { z } from "zod";

import { signIn } from "@/lib/auth/auth";
import { hashPassword } from "@/lib/auth/password";
import { connectDb } from "@/lib/db/connect";
import { isDuplicateKeyError } from "@/lib/db/errors";
import { UserModel } from "@/lib/db/models/user";
import { getClientIp, rateLimit } from "@/lib/rate-limit/rate-limit";
import type { ActionResult } from "@/lib/types/action-result";
import { signUpSchema } from "@/lib/validation/auth";

const SIGN_UP_LIMIT = 5;
const SIGN_UP_WINDOW_MS = 60 * 60 * 1000;

export async function signUp(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const { email, password } = parsed.data;

  const { allowed } = await rateLimit(
    `sign-up:${getClientIp(await headers())}`,
    SIGN_UP_LIMIT,
    SIGN_UP_WINDOW_MS,
  );
  if (!allowed) {
    return { ok: false, formError: "Too many accounts created from this network. Try again later." };
  }

  const passwordHash = await hashPassword(password);
  await connectDb();
  try {
    await UserModel.create({ email, passwordHash });
  } catch (err) {
    if (isDuplicateKeyError(err, "email")) {
      return { ok: false, fieldErrors: { email: ["An account with this email already exists"] } };
    }
    throw err;
  }

  // Redirects on success. redirect() throws, so this stays outside try/catch.
  await signIn("credentials", { email, password, redirectTo: "/dashboard" });
  return { ok: true, data: undefined };
}
