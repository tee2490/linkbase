import Link from "next/link";

import { getSession } from "@/lib/auth";
import { getUserSummary } from "@/lib/db/queries/users";
import { buttonClasses } from "@/components/ui/button";

import { UserMenu } from "./user-menu";

function GuestLinks() {
  return (
    <>
      <Link href="/sign-in" className={`${buttonClasses({ variant: "ghost", size: "sm" })} px-3`}>
        Log in
      </Link>
      <Link href="/sign-up" className={buttonClasses({ size: "sm" })}>
        Sign up free
      </Link>
    </>
  );
}

// Reads the session, so it's dynamic: render it inside <Suspense> with
// HeaderAuthFallback so the rest of the header stays in the static shell.
export async function HeaderAuth() {
  const session = await getSession();
  if (!session) return <GuestLinks />;

  const user = await getUserSummary(session.user.id);
  // A valid token for a deleted account: treat the visitor as signed out.
  if (!user) return <GuestLinks />;

  return <UserMenu displayName={user.displayName} email={user.email} />;
}

// Same height as both states, so nothing shifts when the real content streams in.
export function HeaderAuthFallback() {
  return <div aria-hidden="true" className="h-9 w-[180px]" />;
}
