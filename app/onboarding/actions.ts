"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getSession } from "@/lib/auth/get-session";
import { connectDb } from "@/lib/db/connect";
import { isDuplicateKeyError } from "@/lib/db/errors";
import { UserModel } from "@/lib/db/models/user";
import { handleTag } from "@/lib/db/queries/tags";
import { handleSuggestionCandidates } from "@/lib/handles/suggest-handles";
import { rateLimit } from "@/lib/rate-limit/rate-limit";
import type { ActionResult } from "@/lib/types/action-result";
import { claimHandleSchema, handleFormatSchema, isReservedHandle } from "@/lib/validation/handle";

const CHECK_HANDLE_LIMIT = 120;
const CHECK_HANDLE_WINDOW_MS = 10 * 60 * 1000;
const MAX_SUGGESTIONS = 3;

export type HandleAvailability = {
  available: boolean;
  suggestions: string[];
};

export async function claimHandle(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { userId } = await getSession();

  const parsed = claimHandleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const { handle } = parsed.data;

  await connectDb();
  let matchedCount: number;
  try {
    // Set once: the filter skips users who already have a handle (changing it is updateProfile's job).
    ({ matchedCount } = await UserModel.updateOne(
      { _id: userId, handle: { $exists: false } },
      { $set: { handle } },
      { runValidators: true },
    ));
  } catch (err) {
    if (isDuplicateKeyError(err, "handle")) {
      return { ok: false, fieldErrors: { handle: ["That username is taken"] } };
    }
    throw err;
  }

  if (matchedCount > 0) {
    // Clears a cached "not found" for the newly claimed handle (docs/data-mutations.md).
    revalidateTag(handleTag(handle), "max");
  }

  // Already onboarded, or just saved. redirect() throws, so this stays outside try/catch.
  redirect("/dashboard");
}

// Read-only availability check for the onboarding field. Returns booleans and handle strings only.
export async function checkHandle(input: unknown): Promise<ActionResult<HandleAvailability>> {
  const { userId } = await getSession();

  const { allowed } = await rateLimit(`check-handle:${userId}`, CHECK_HANDLE_LIMIT, CHECK_HANDLE_WINDOW_MS);
  if (!allowed) {
    return { ok: false, formError: "Too many checks. Try again in a few minutes." };
  }

  const parsed = handleFormatSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: { handle: z.flattenError(parsed.error).formErrors } };
  }
  const handle = parsed.data;

  const candidates = handleSuggestionCandidates(handle);
  await connectDb();
  const existing = await UserModel.find({ handle: { $in: [handle, ...candidates] } })
    .select("handle")
    .lean();
  const taken = new Set(existing.map((user) => user.handle));

  if (!isReservedHandle(handle) && !taken.has(handle)) {
    return { ok: true, data: { available: true, suggestions: [] } };
  }

  const suggestions = candidates.filter((candidate) => !taken.has(candidate)).slice(0, MAX_SUGGESTIONS);
  return { ok: true, data: { available: false, suggestions } };
}
