"use server";

import bcrypt from "bcryptjs";
import { AuthError, CredentialsSignin } from "next-auth";
import { z } from "zod";

import { signIn, signOut } from "@/lib/auth/config";
import { connectToDatabase } from "@/lib/db/connect";
import { UserModel } from "@/lib/db/models/user";
import { checkRateLimit, getRequestIp } from "@/lib/rate-limit";
import type { ActionResult } from "@/lib/types/action-result";
import {
  safeCallbackUrl,
  signInSchema,
  signUpSchema,
  type SignInInput,
  type SignUpInput,
} from "@/lib/validation/auth";

const BCRYPT_COST = 12;
const SIGN_UP_LIMIT = 5;
const SIGN_UP_WINDOW_SECONDS = 60 * 60;
const DUPLICATE_KEY = 11000;
const MAX_DISPLAY_NAME_LENGTH = 50;

const ONBOARDING_REDIRECT = "/onboarding";

const RATE_LIMITED_MESSAGE = "Too many attempts. Try again later.";
const INVALID_CREDENTIALS_MESSAGE = "Email or password is incorrect";

export type SignInResult = ActionResult<null, keyof SignInInput>;
export type SignUpResult = ActionResult<null, keyof SignUpInput>;

// Sign-in and sign-up run without a session by definition, so they skip
// requireUserId() (docs/data-mutations.md step 1) and are rate-limited instead.

export async function signInWithCredentials(
  _prev: SignInResult,
  formData: FormData,
): Promise<SignInResult> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  // signIn redirects on success by throwing; startCredentialsSignIn rethrows it.
  return startCredentialsSignIn(parsed.data, safeCallbackUrl(formData.get("callbackUrl")));
}

export async function signUp(_prev: SignUpResult, formData: FormData): Promise<SignUpResult> {
  const { allowed } = await checkRateLimit(
    `sign-up:${await getRequestIp()}`,
    SIGN_UP_LIMIT,
    SIGN_UP_WINDOW_SECONDS,
  );
  if (!allowed) return { status: "error", fieldErrors: {}, formError: RATE_LIMITED_MESSAGE };

  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const { email, password } = parsed.data;

  await connectToDatabase();
  try {
    await UserModel.create({
      email,
      passwordHash: await bcrypt.hash(password, BCRYPT_COST),
      displayName: email.split("@")[0].slice(0, MAX_DISPLAY_NAME_LENGTH),
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return {
        status: "error",
        fieldErrors: { email: ["An account with this email already exists"] },
      };
    }
    throw new Error("Failed to create account", { cause: error });
  }

  // A new account has no handle yet, so go straight to onboarding.
  return startCredentialsSignIn({ email, password }, ONBOARDING_REDIRECT);
}

export async function signOutUser() {
  await signOut({ redirectTo: "/" });
}

async function startCredentialsSignIn(
  credentials: SignInInput,
  redirectTo: string,
): Promise<SignInResult> {
  try {
    await signIn("credentials", { ...credentials, redirectTo });
  } catch (error) {
    // Anything that isn't an AuthError, including Next.js's redirect, is rethrown.
    if (!(error instanceof AuthError)) throw error;
    if (error instanceof CredentialsSignin && error.code === "rate_limited") {
      return { status: "error", fieldErrors: {}, formError: RATE_LIMITED_MESSAGE };
    }
    if (error.type === "CredentialsSignin") {
      return { status: "error", fieldErrors: {}, formError: INVALID_CREDENTIALS_MESSAGE };
    }
    throw error;
  }
  // signIn always redirects or throws, so this is unreachable.
  return { status: "success", data: null };
}

function isDuplicateKeyError(error: unknown) {
  return (
    typeof error === "object" && error !== null && "code" in error && error.code === DUPLICATE_KEY
  );
}
