import "server-only";
import { cacheLife, cacheTag } from "next/cache";

import { connectDb } from "@/lib/db/connect";
import { LinkModel } from "@/lib/db/models/link";
import { UserModel } from "@/lib/db/models/user";
import { handleTag, profileTag } from "@/lib/db/queries/tags";
import type { PublicProfile } from "@/lib/types/profile";
import { handleFormatSchema } from "@/lib/validation/handle";

// Public and cached, scoped by handle. Never reads the session (docs/data-fetching.md).
export async function getPublicProfile(rawHandle: string): Promise<PublicProfile | null> {
  "use cache";
  cacheLife("hours");

  // Malformed handles (including the build's placeholder param) never reach the database.
  const parsed = handleFormatSchema.safeParse(rawHandle);
  if (!parsed.success) return null;
  const handle = parsed.data;
  // Tags "not found" too, so claiming this handle later clears it.
  cacheTag(handleTag(handle));

  await connectDb();
  const user = await UserModel.findOne({ handle }).select("_id handle").lean();
  if (!user?.handle) return null;

  const userId = user._id.toString();
  cacheTag(profileTag(userId));
  // Same order as the dashboard (getMyLinks): newest first.
  const links = await LinkModel.find({ userId }).select("title url").sort({ createdAt: -1 }).lean();

  return {
    handle: user.handle,
    links: links.map((link) => ({ title: link.title, url: link.url })),
  };
}
