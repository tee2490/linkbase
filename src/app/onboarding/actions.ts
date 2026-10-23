"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireUserId } from "@/lib/auth";
import { unstable_update } from "@/lib/auth/config";
import { connectToDatabase } from "@/lib/db/connect";
import { UserModel } from "@/lib/db/models/user";
import { findAvailableHandles, getOnboardingState } from "@/lib/db/queries/users";
import { checkRateLimit } from "@/lib/rate-limit";
import type { ActionResult } from "@/lib/types/action-result";
import {
  claimHandleSchema,
  handleCandidates,
  handleSchema,
  type ClaimHandleInput,
} from "@/lib/validation/handle";

const CHECK_LIMIT = 60;
const CHECK_WINDOW_SECONDS = 60;
const SUGGESTION_COUNT = 3;
const DUPLICATE_KEY = 11000;
const HOME_PATH = "/dashboard";

const TAKEN_MESSAGE = "That username is taken. Try one of these.";

export type HandleAvailability = {
  available: boolean;
  message?: string;
  suggestions: string[];
};

export type ClaimHandleResult = ActionResult<null, keyof ClaimHandleInput>;

// A read, but called from the client as the user types, so it's an action. It only
// reveals whether a handle is free, which visiting /user/<handle> already shows.
export async function checkHandleAvailability(input: unknown): Promise<HandleAvailability> {
  const userId = await requireUserId();

  const parsed = handleSchema.safeParse(input);
  if (!parsed.success) {
    return { available: false, message: parsed.error.issues[0]?.message, suggestions: [] };
  }
  const handle = parsed.data;

  const { allowed } = await checkRateLimit(
    `handle-check:${userId}`,
    CHECK_LIMIT,
    CHECK_WINDOW_SECONDS,
  );
  if (!allowed) {
    return {
      available: false,
      message: "Too many checks. Wait a minute and try again.",
      suggestions: [],
    };
  }

  const state = await getOnboardingState(userId);
  const candidates = [
    ...new Set([
      handle,
      ...handleCandidates(handle),
      ...handleCandidates(state?.displayName ?? ""),
    ]),
  ];
  // Candidates keep their order, so the typed handle is first when it's free.
  const free = await findAvailableHandles(candidates, SUGGESTION_COUNT + 1);
  if (free[0] === handle) return { available: true, suggestions: [] };

  return { available: false, message: TAKEN_MESSAGE, suggestions: free.slice(0, SUGGESTION_COUNT) };
}

export async function claimHandle(
  _prev: ClaimHandleResult,
  formData: FormData,
): Promise<ClaimHandleResult> {
  // 1. Session
  const userId = await requireUserId();

  // 2. Validate
  const parsed = claimHandleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const { handle } = parsed.data;

  // 3 + 4. Scope and write. Only users without a handle match, so this flow can
  // never overwrite one; changing it later belongs to profile settings.
  await connectToDatabase();
  let matched: number;
  try {
    const result = await UserModel.updateOne(
      { _id: userId, handle: { $not: { $type: "string" } } },
      { $set: { handle } },
      { runValidators: true },
    );
    matched = result.matchedCount;
  } catch (error) {
    // The partial unique index decides races between two users claiming the same handle.
    if (isDuplicateKeyError(error)) {
      return { status: "error", fieldErrors: { handle: [TAKEN_MESSAGE] } };
    }
    throw new Error(`Failed to claim handle for user ${userId}`, { cause: error });
  }

  if (matched > 0) {
    // 5. Refresh: the new profile URL, then the session cookie's onboarding flag.
    updateTag(`profile:${handle}`);
    await unstable_update({});
  }
  // Already onboarded (matched nothing) lands on the dashboard too, unchanged.
  redirect(HOME_PATH);
}

function isDuplicateKeyError(error: unknown) {
  return (
    typeof error === "object" && error !== null && "code" in error && error.code === DUPLICATE_KEY
  );
}
