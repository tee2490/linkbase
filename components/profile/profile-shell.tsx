import type { ReactNode } from "react";
import Link from "next/link";

type ProfileShellProps = {
  topRight?: ReactNode;
  children: ReactNode;
};

// The public profile frame: a centered card on the backdrop, edge to edge on phones (docs/ui.md).
export function ProfileShell({ topRight, children }: ProfileShellProps) {
  return (
    <div className="flex flex-1 justify-center bg-profile-canvas sm:items-start sm:bg-backdrop sm:px-6 sm:py-10">
      <main className="flex min-h-svh w-full flex-col items-center bg-profile-canvas px-4 pt-4 pb-8 sm:min-h-[calc(100svh-80px)] sm:max-w-profile sm:rounded-xl sm:px-8 sm:pt-6 sm:shadow-phone">
        <div className="flex w-full items-center justify-between">
          <Link
            href="/"
            className="inline-flex h-icon-btn items-center rounded-full bg-surface px-4 font-display text-[15px] font-extrabold tracking-[-0.01em] text-ink [font-stretch:112%] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            Linkbase
          </Link>
          {topRight}
        </div>
        {children}
      </main>
    </div>
  );
}
