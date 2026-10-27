import { LinkButton } from "@/components/ui/link-button";
import type { LinkItem } from "@/lib/types/link";

type PhonePreviewProps = {
  handle: string;
  links: LinkItem[];
};

// Decorative copy of the public page. Inert, and never links to user URLs (docs/security.md).
export function PhonePreview({ handle, links }: PhonePreviewProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Rendered on the cobalt preview block, so the caption is inverse. */}
      <span className="font-mono text-caption-mono text-ink-inverse">Live preview</span>
      <div
        aria-hidden="true"
        inert
        className="w-[300px] max-w-full rounded-[44px] bg-ink-app p-2.5 shadow-phone lg:w-[320px]"
      >
        <div className="flex h-[580px] flex-col items-center gap-3 overflow-y-auto rounded-[34px] bg-profile-canvas px-4 pt-10 pb-6 lg:h-[620px]">
          <div className="flex size-[72px] flex-none items-center justify-center rounded-full bg-orchid font-display text-[28px] font-extrabold text-ink">
            {handle.charAt(0).toUpperCase()}
          </div>
          <div className="max-w-full truncate text-[18px] leading-6 font-bold text-ink-app">@{handle}</div>
          <div className="mt-2 flex w-full flex-col gap-2.5">
            {links.map((link) => (
              <LinkButton key={link.id} href="#">
                {link.title}
              </LinkButton>
            ))}
            {links.length === 0 ? (
              <p className="my-2 text-center text-[13px] leading-[18px] text-muted-app">
                Add a link to show it here.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
