import "server-only";

import { connectToDatabase } from "@/lib/db/connect";
import { UserModel } from "@/lib/db/models/user";

export type UserSummary = {
  displayName: string;
  email: string;
};

// The signed-in user's own name and email, for the header menu. Uncached: only the
// owner reads it, and auth() already makes the caller dynamic.
export async function getUserSummary(userId: string): Promise<UserSummary | null> {
  await connectToDatabase();
  const user = await UserModel.findById(userId).select("displayName email").lean();
  if (!user) return null;
  return { displayName: user.displayName, email: user.email };
}
