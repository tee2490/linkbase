import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { connectToDatabase } from "@/lib/db/connect";
import { LinkModel } from "@/lib/db/models/link";

export type LinkItem = {
  id: string;
  title: string;
  url: string;
};

// The owner's links for the dashboard. userId is an argument, so each user gets
// their own cache entry; link actions clear it with updateTag(`links:<userId>`).
export async function getLinksForUser(userId: string): Promise<LinkItem[]> {
  "use cache";
  cacheTag(`links:${userId}`);
  cacheLife("hours");

  await connectToDatabase();
  const links = await LinkModel.find({ userId })
    .sort({ position: 1, createdAt: -1 })
    .select("title url")
    .lean();

  return links.map((link) => ({ id: link._id.toString(), title: link.title, url: link.url }));
}
