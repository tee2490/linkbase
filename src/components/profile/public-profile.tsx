import Link from "next/link";

import type { PublicProfile as PublicProfileData } from "@/lib/db/queries/profiles";
import { getSafeHref } from "@/lib/url";
import { Avatar } from "@/components/ui/avatar";
import { buttonClasses } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";

import { ShareButton } from "./share-button";

type PublicProfileProps = {
  profile: PublicProfileData;
};

export function PublicProfile({ profile }: PublicProfileProps) {
  const { handle, displayName } = profile;
  // Re-check stored URLs before they become hrefs (see docs/security.md "On render").
  const links = profile.links.flatMap((link) => {
    const href = getSafeHref(link.url);
    return href ? [{ id: link.id, title: link.title, href }] : [];
  });

  return (
    <div className="flex min-h-screen flex-col items-center bg-surface-backdrop">
      <header className="hidden w-full items-center justify-between px-8 pt-[22px] min-[900px]:flex">
        <Link
          href="/"
          className="font-display text-[26px] leading-none font-extrabold tracking-[-0.04em] text-fg"
        >
          linkbase
        </Link>
        <Link href="/sign-up" className={buttonClasses({ size: "sm" })}>
          Sign up free
        </Link>
      </header>

      <main className="relative flex w-full max-w-profile flex-1 flex-col items-center bg-surface-profile px-[clamp(16px,4vw,28px)] pt-[clamp(20px,4vw,28px)] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.25)] sm:mt-12 sm:rounded-t-[32px]">
        <div className="flex items-center justify-between self-stretch">
          <Link
            href="/"
            aria-label="Linkbase home"
            className="flex size-11 items-center justify-center rounded-[14px] bg-white font-display text-[22px] leading-none font-extrabold tracking-[-0.04em] text-fg shadow-card"
          >
            lb
          </Link>
          <ShareButton handle={handle} />
        </div>

        <div className="mt-4">
          <Avatar name={displayName} size={96} />
        </div>
        <h1 className="mt-[clamp(16px,3vw,20px)] mb-0 text-[clamp(22px,3.2vw,26px)] leading-[1.2] font-bold tracking-[-0.02em] text-fg">
          @{handle}
        </h1>

        {links.length > 0 ? (
          <nav aria-label={`@${handle}'s links`} className="mt-[clamp(24px,4vw,32px)] self-stretch">
            <ul className="flex flex-col gap-[clamp(12px,2vw,14px)]">
              {links.map((link) => (
                <li key={link.id}>
                  <LinkButton title={link.title} href={link.href} />
                </li>
              ))}
            </ul>
          </nav>
        ) : (
          <p className="mt-8 text-15 text-fg-muted">No links yet.</p>
        )}

        {/* Bottom padding keeps the last link clear of the fixed sign-up nudge. */}
        <footer className="mt-10 pb-[180px] text-center text-12 leading-[1.6] text-fg-secondary">
          <Link href="/" className="underline-offset-2 hover:underline">
            More from Linkbase
          </Link>
        </footer>
      </main>

      <div className="pointer-events-none fixed bottom-0 left-1/2 flex h-40 w-full max-w-profile -translate-x-1/2 flex-col items-center justify-end gap-3 bg-linear-to-b from-ink/0 to-ink/90 pb-7">
        <Link
          href="/sign-up"
          className="pointer-events-auto flex h-11 items-center rounded-full bg-white px-5 text-16 font-medium text-fg shadow-float transition duration-120 ease-out hover:bg-cloud focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
        >
          linkbase.me/you
        </Link>
        <span className="text-15 leading-none font-medium text-white">
          Join {handle} on Linkbase today
        </span>
      </div>
    </div>
  );
}
