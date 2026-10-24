import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { connectToDatabase } from "@/lib/db/connect";
import { LinkModel } from "@/lib/db/models/link";
import { UserModel } from "@/lib/db/models/user";

export type PublicProfile = {
  handle: string;
  displayName: string;
  links: { id: string; title: string; url: string }[];
};

// Public, unscoped by design: anyone can read a profile by handle, so it returns
// public fields only. Link actions clear `links:<userId>`, a handle claim clears
// `profile:<handle>` (see docs/data-fetching.md "Tags").
export async function getPublicProfile(handle: string): Promise<PublicProfile | null> {
  "use cache";
  cacheTag(`profile:${handle}`);
  cacheLife("hours");

  await connectToDatabase();
  const user = await UserModel.findOne({ handle }).select("handle displayName").lean();
  if (!user?.handle) return null;

  const userId = user._id.toString();
  cacheTag(`links:${userId}`);
  // Same order as the dashboard's getLinksForUser.
  const links = await LinkModel.find({ userId, visible: true })
    .sort({ position: 1, createdAt: -1 })
    .select("title url")
    .lean();

  return {
    handle: user.handle,
    displayName: user.displayName,
    links: links.map((link) => ({ id: link._id.toString(), title: link.title, url: link.url })),
  };
}
