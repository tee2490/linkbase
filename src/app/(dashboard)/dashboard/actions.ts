"use server";

import { updateTag } from "next/cache";
import { z } from "zod";

import { requireUserId } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import { LinkModel } from "@/lib/db/models/link";
import { checkRateLimit } from "@/lib/rate-limit";
import type { ActionResult } from "@/lib/types/action-result";
import {
  linkIdSchema,
  linkInputSchema,
  updateLinkSchema,
  type LinkInput,
  type UpdateLinkInput,
} from "@/lib/validation/link";

const CREATE_LIMIT = 30;
const CREATE_WINDOW_SECONDS = 60 * 60;
const NOT_FOUND = "Link not found";

export type AddLinkResult = ActionResult<{ id: string }, keyof LinkInput>;
export type UpdateLinkResult = ActionResult<null, keyof UpdateLinkInput>;
export type DeleteLinkResult = ActionResult;

export async function addLink(_prev: AddLinkResult, formData: FormData): Promise<AddLinkResult> {
  // 1. Session, then the rate limit before any work (see docs/security.md)
  const userId = await requireUserId();
  const { allowed } = await checkRateLimit(
    `link-create:${userId}`,
    CREATE_LIMIT,
    CREATE_WINDOW_SECONDS,
  );
  if (!allowed) {
    return {
      status: "error",
      fieldErrors: {},
      formError: "You're adding links too fast. Try again later.",
    };
  }

  // 2. Validate
  const parsed = linkInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  // 3 + 4. Scope and write: new links go on top, so the user's others move down one.
  await connectToDatabase();
  await LinkModel.updateMany({ userId }, { $inc: { position: 1 } });
  const link = await LinkModel.create({ ...parsed.data, userId, position: 0 });

  // 5. Refresh
  updateTag(`links:${userId}`);

  return { status: "success", data: { id: link._id.toString() } };
}

export async function updateLink(
  _prev: UpdateLinkResult,
  formData: FormData,
): Promise<UpdateLinkResult> {
  // 1. Session
  const userId = await requireUserId();

  // 2. Validate
  const parsed = updateLinkSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const { linkId, title, url } = parsed.data;

  // 3 + 4. Scope and write. Another user's id matches nothing, same as a missing one.
  await connectToDatabase();
  const result = await LinkModel.updateOne(
    { _id: linkId, userId },
    { $set: { title, url } },
    { runValidators: true },
  );
  if (result.matchedCount === 0) {
    return { status: "error", fieldErrors: {}, formError: NOT_FOUND };
  }

  // 5. Refresh
  updateTag(`links:${userId}`);

  return { status: "success", data: null };
}

export async function deleteLink(linkId: unknown): Promise<DeleteLinkResult> {
  // 1. Session
  const userId = await requireUserId();

  // 2. Validate
  const parsed = linkIdSchema.safeParse(linkId);
  if (!parsed.success) {
    return { status: "error", fieldErrors: {}, formError: NOT_FOUND };
  }

  // 3 + 4. Scope and write
  await connectToDatabase();
  const result = await LinkModel.deleteOne({ _id: parsed.data, userId });
  if (result.deletedCount === 0) {
    return { status: "error", fieldErrors: {}, formError: NOT_FOUND };
  }

  // 5. Refresh
  updateTag(`links:${userId}`);

  return { status: "success", data: null };
}
