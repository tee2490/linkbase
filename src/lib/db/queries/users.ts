import "server-only";

import { connectToDatabase } from "@/lib/db/connect";
import { UserModel } from "@/lib/db/models/user";

export type UserSummary = {
  displayName: string;
  email: string;
};

export type OnboardingState = {
  displayName: string;
  handle: string | null;
};

// The signed-in user's own name and email, for the header menu. Uncached: only the
// owner reads it, and auth() already makes the caller dynamic.
export async function getUserSummary(userId: string): Promise<UserSummary | null> {
  await connectToDatabase();
  const user = await UserModel.findById(userId).select("displayName email").lean();
  if (!user) return null;
  return { displayName: user.displayName, email: user.email };
}

export async function getOnboardingState(userId: string): Promise<OnboardingState | null> {
  await connectToDatabase();
  const user = await UserModel.findById(userId).select("displayName handle").lean();
  if (!user) return null;
  return { displayName: user.displayName, handle: user.handle ?? null };
}

// Read by the auth jwt callback, so the proxy knows whether onboarding is done.
export async function userHasHandle(userId: string): Promise<boolean> {
  await connectToDatabase();
  const user = await UserModel.exists({ _id: userId, handle: { $type: "string" } });
  return user !== null;
}

// Handles are public (they're profile URLs), so this lookup isn't user-scoped.
// One query for all candidates; keeps their order and returns the first `limit` free ones.
export async function findAvailableHandles(candidates: string[], limit: number): Promise<string[]> {
  if (candidates.length === 0) return [];
  await connectToDatabase();
  const taken = await UserModel.find({ handle: { $in: candidates } })
    .select("handle")
    .lean();
  const takenSet = new Set(taken.map((user) => user.handle));
  return candidates.filter((candidate) => !takenSet.has(candidate)).slice(0, limit);
}
