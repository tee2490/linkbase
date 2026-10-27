import "server-only";
import { redirect } from "next/navigation";

import { getCurrentUser, type CurrentUser } from "@/lib/auth/get-current-user";

type OnboardedUser = CurrentUser & { handle: string };

// Every (dashboard) page calls this: signed in, and a username picked (docs/auth.md).
export async function requireOnboardedUser(): Promise<OnboardedUser> {
  const user = await getCurrentUser();
  // No user but maybe a session cookie (e.g. the account was deleted): the proxy clears it on this URL.
  if (!user) redirect("/sign-in?session=expired");
  if (!user.handle) redirect("/onboarding");
  return { ...user, handle: user.handle };
}
