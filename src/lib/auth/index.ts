import "server-only";

import { auth } from "./config";

export async function getSession() {
  return auth();
}

export async function requireUserId() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");
  return userId;
}
