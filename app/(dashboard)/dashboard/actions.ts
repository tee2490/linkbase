"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import { getSession } from "@/lib/auth/get-session";
import { connectDb } from "@/lib/db/connect";
import { LinkModel } from "@/lib/db/models/link";
import { profileTag } from "@/lib/db/queries/tags";
import { rateLimit } from "@/lib/rate-limit/rate-limit";
import type { ActionResult } from "@/lib/types/action-result";
import { deleteLinkSchema, linkInputSchema, updateLinkSchema } from "@/lib/validation/link";

const CREATE_LINK_LIMIT = 30;
const CREATE_LINK_WINDOW_MS = 60 * 60 * 1000;

function revalidateLinks(userId: string) {
  revalidatePath("/dashboard");
  revalidateTag(profileTag(userId), "max");
}

export async function createLink(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { userId } = await getSession();

  const { allowed } = await rateLimit(`create-link:${userId}`, CREATE_LINK_LIMIT, CREATE_LINK_WINDOW_MS);
  if (!allowed) {
    return { ok: false, formError: "You're adding links too quickly. Try again later." };
  }

  const parsed = linkInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  await connectDb();
  await LinkModel.create({ title: parsed.data.title, url: parsed.data.url, userId });

  revalidateLinks(userId);
  return { ok: true, data: undefined };
}

export async function updateLink(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { userId } = await getSession();

  const parsed = updateLinkSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const { linkId, title, url } = parsed.data;

  await connectDb();
  const { matchedCount } = await LinkModel.updateOne(
    { _id: linkId, userId }, // never { _id: linkId } alone
    { $set: { title, url } },
    { runValidators: true },
  );
  if (matchedCount === 0) return { ok: false, formError: "Link not found" };

  revalidateLinks(userId);
  return { ok: true, data: undefined };
}

export async function deleteLink(input: unknown): Promise<ActionResult> {
  const { userId } = await getSession();

  const parsed = deleteLinkSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  await connectDb();
  const { deletedCount } = await LinkModel.deleteOne({ _id: parsed.data.linkId, userId });
  if (deletedCount === 0) return { ok: false, formError: "Link not found" };

  revalidateLinks(userId);
  return { ok: true, data: undefined };
}
