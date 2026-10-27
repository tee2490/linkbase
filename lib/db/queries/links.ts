import "server-only";

import { getSession } from "@/lib/auth/get-session";
import { connectDb } from "@/lib/db/connect";
import { LinkModel } from "@/lib/db/models/link";
import type { LinkItem } from "@/lib/types/link";

// Private and uncached: the signed-in user's links, newest first (docs/data-fetching.md).
export async function getMyLinks(): Promise<LinkItem[]> {
  const { userId } = await getSession();
  await connectDb();
  const links = await LinkModel.find({ userId }).select("title url").sort({ createdAt: -1 }).lean();
  return links.map((link) => ({ id: link._id.toString(), title: link.title, url: link.url }));
}
