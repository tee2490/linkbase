import { getCurrentUser } from "@/lib/auth/get-current-user";
import { Button } from "@/components/ui/button";

import { UserMenu } from "./user-menu";

// Reads the session, so render it inside <Suspense> (Cache Components).
export async function HeaderAccount() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden sm:block">
          <Button href="/sign-in" variant="soft" size="sm">
            Log in
          </Button>
        </span>
        <Button href="/sign-up" variant="ink" size="sm">
          Sign up free
        </Button>
      </div>
    );
  }

  return <UserMenu email={user.email} />;
}

export function HeaderAccountSkeleton() {
  return <div aria-hidden="true" className="h-control-sm w-[120px] rounded-full bg-surface-muted sm:w-[200px]" />;
}
