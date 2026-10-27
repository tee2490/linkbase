import type { ReactNode } from "react";
import Link from "next/link";
import { Suspense } from "react";

import { HeaderAccount, HeaderAccountSkeleton } from "@/components/auth/header-account";
import { UrlPill } from "@/components/ui/url-pill";
import { getCurrentUser } from "@/lib/auth/get-current-user";

type DashboardLayoutProps = {
  children: ReactNode;
};

// No auth check here: layouts don't re-render on navigation (docs/auth.md). Pages check.
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex flex-1 flex-col bg-canvas">
      <div className="px-4 pt-4 sm:px-6 sm:pt-5">
        {/* Same floating pill as the landing header (components/landing/site-header.tsx). */}
        <header className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-[28px] bg-surface py-2 pr-2 pl-5 shadow-card sm:flex-nowrap sm:rounded-full sm:py-2.5 sm:pr-2.5 sm:pl-7">
          <Link
            href="/"
            className="rounded-sm font-display text-[26px] font-extrabold tracking-[-0.02em] text-ink [font-stretch:112%] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            Linkbase
          </Link>
          <div className="order-3 flex min-w-0 basis-full justify-start pb-1 sm:order-none sm:flex-1 sm:basis-auto sm:justify-center sm:pb-0">
            <Suspense fallback={null}>
              <HeaderUrlPill />
            </Suspense>
          </div>
          <Suspense fallback={<HeaderAccountSkeleton />}>
            <HeaderAccount />
          </Suspense>
        </header>
      </div>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}

// Reads the session, so it renders inside <Suspense>. Display only: pages do the auth checks.
async function HeaderUrlPill() {
  const user = await getCurrentUser();
  if (!user?.handle) return null;
  return <UrlPill handle={user.handle} />;
}
