import "server-only";
import { isValidObjectId } from "mongoose";
import { connection } from "next/server";
import { cache } from "react";

import { auth } from "@/lib/auth/auth";
import { connectDb } from "@/lib/db/connect";
import { UserModel } from "@/lib/db/models/user";

export type CurrentUser = {
  id: string;
  email: string;
  // Null until the user picks one on /onboarding.
  handle: string | null;
};

// Deduplicated per request, so the header and the page share one lookup.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  // auth() uses crypto before it reads cookies, so mark this as request-time first (Cache Components).
  await connection();
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId || !isValidObjectId(userId)) return null;

  await connectDb();
  const user = await UserModel.findById(userId).select("email handle").lean();
  if (!user) return null;

  return { id: userId, email: user.email, handle: user.handle ?? null };
});
