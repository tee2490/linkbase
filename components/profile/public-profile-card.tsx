import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import type { PublicProfile } from "@/lib/types/profile";

import { ProfileShell } from "./profile-shell";
import { ShareButton } from "./share-button";

type PublicProfileCardProps = {
  profile: PublicProfile;
};

export function PublicProfileCard({ profile }: PublicProfileCardProps) {
  const { handle, links } = profile;

  return (
    <ProfileShell topRight={<ShareButton />}>
      <div className="mt-5 mb-7 flex flex-col items-center gap-2 text-center">
        <div
          aria-hidden="true"
          className="flex size-24 items-center justify-center rounded-full bg-cobalt font-display text-[36px] font-extrabold text-ink-inverse [font-stretch:112%]"
        >
          {handle.charAt(0).toUpperCase()}
        </div>
        <h1 className="m-0 mt-2 max-w-full truncate text-title-sm text-ink-app">@{handle}</h1>
      </div>

      {links.length > 0 ? (
        <nav aria-label="Links" className="w-full">
          {/* Index keys: the list is read-only and ids stay private (docs/auth.md). */}
          <ul className="m-0 flex list-none flex-col gap-3 p-0 sm:gap-3.5">
            {links.map((link, index) => (
              <li key={index}>
                <LinkButton href={link.url} external>
                  {link.title}
                </LinkButton>
              </li>
            ))}
          </ul>
        </nav>
      ) : (
        <p className="m-0 text-body-md text-muted-app">No links yet.</p>
      )}

      <div className="min-h-10 flex-1" />

      <footer className="flex flex-col items-center">
        <Button href="/sign-up" variant="surface" size="sm">
          Join {handle} on Linkbase
        </Button>
      </footer>
    </ProfileShell>
  );
}
