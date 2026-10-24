import Link from "next/link";

import { buttonClasses } from "@/components/ui/button";

export default function ProfileNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface-backdrop px-4">
      <div className="flex w-full max-w-profile flex-col items-center gap-4 rounded-[32px] bg-surface-profile px-6 py-12 text-center shadow-[0_20px_60px_-20px_rgba(0,0,0,0.25)]">
        <h1 className="m-0 font-display text-28 leading-tight font-bold tracking-[-0.02em] text-balance">
          This Linkbase doesn&apos;t exist yet
        </h1>
        <p className="m-0 text-16 text-fg-secondary">
          Check the spelling, or claim this username for yourself.
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <Link href="/sign-up" className={buttonClasses()}>
            Claim this username
          </Link>
          <Link href="/" className={buttonClasses({ variant: "secondary" })}>
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}
