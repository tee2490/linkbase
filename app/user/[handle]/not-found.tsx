import Link from "next/link";

import { ProfileShell } from "@/components/profile/profile-shell";
import { Button } from "@/components/ui/button";

export default function UserNotFound() {
  return (
    <ProfileShell>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
        <h1 className="m-0 font-display text-display-md text-ink [font-stretch:112%]">This page doesn&apos;t exist</h1>
        <p className="m-0 max-w-[360px] text-body-md text-muted-app">
          No one has claimed this link yet. It could be yours.
        </p>
        <div className="mt-2 flex flex-col items-center gap-3">
          <Button href="/sign-up" variant="ink" size="sm">
            Claim your link
          </Button>
          <Link
            href="/"
            className="rounded-sm text-body-sm font-semibold text-ink-app underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            Go home
          </Link>
        </div>
      </div>
    </ProfileShell>
  );
}
