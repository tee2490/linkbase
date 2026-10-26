import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { auth } from "@/lib/auth/auth";

export async function getSession() {
  // auth() uses crypto before it reads cookies, so mark this as request-time first (Cache Components).
  await connection();
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  return { userId: session.user.id };
}
