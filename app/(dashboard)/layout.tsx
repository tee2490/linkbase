import type { ReactNode } from "react";
import Link from "next/link";
import { Suspense } from "react";

import { HeaderAccount, HeaderAccountSkeleton } from "@/components/auth/header-account";

type DashboardLayoutProps = {
  children: ReactNode;
};

// No auth check here: layouts don't re-render on navigation (docs/auth.md). Pages check.
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex flex-1 flex-col bg-canvas">
      <header className="bg-surface">
        <div className="mx-auto flex max-w-container items-center justify-between gap-4 px-5 py-3 sm:px-10">
          <Link
            href="/"
            className="rounded-sm font-display text-[26px] font-extrabold tracking-[-0.02em] text-ink [font-stretch:112%] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            Linkbase
          </Link>
          <Suspense fallback={<HeaderAccountSkeleton />}>
            <HeaderAccount />
          </Suspense>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
