import { Suspense } from "react";
import Link from "next/link";

import { HeaderAuth, HeaderAuthFallback } from "@/components/auth/header-auth";

export function SiteHeader() {
  return (
    <header className="bg-butter px-[clamp(16px,4vw,24px)] pt-4">
      <div className="mx-auto flex max-w-content items-center justify-end gap-1 rounded-full bg-white py-2 pr-2 pl-[clamp(18px,3vw,28px)] shadow-float">
        <Link
          href="/"
          className="min-w-0 flex-1 font-display text-[clamp(22px,5vw,26px)] leading-none font-extrabold tracking-[-0.04em]"
        >
          linkbase
        </Link>
        <Suspense fallback={<HeaderAuthFallback />}>
          <HeaderAuth />
        </Suspense>
      </div>
    </header>
  );
}
