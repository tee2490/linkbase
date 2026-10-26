import Link from "next/link";
import { Suspense } from "react";

import { HeaderAccount, HeaderAccountSkeleton } from "@/components/auth/header-account";

export function SiteHeader() {
  return (
    <header className="flex items-center justify-between gap-4 rounded-full bg-surface py-2.5 pr-2.5 pl-7">
      <div className="flex items-center gap-10">
        <Link
          href="/"
          className="rounded-sm font-display text-[26px] font-extrabold tracking-[-0.02em] text-ink [font-stretch:112%] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          Linkbase
        </Link>
        <nav aria-label="Main" className="hidden gap-8 text-body-md text-ink lg:flex">
          <a href="#how" className="underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
            How it works
          </a>
          <a href="#faq" className="underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
            FAQ
          </a>
        </nav>
      </div>
      <Suspense fallback={<HeaderAccountSkeleton />}>
        <HeaderAccount />
      </Suspense>
    </header>
  );
}
