import { Share } from "lucide-react";

import type { LinkItem } from "@/lib/db/queries/links";
import { getSafeHref } from "@/lib/url";
import { Avatar } from "@/components/ui/avatar";
import { LinkButton } from "@/components/ui/link-button";

type PhonePreviewProps = {
  name: string;
  links: LinkItem[];
};

// The design's 300×620 phone showing the profile as visitors will see it.
export function PhonePreview({ name, links }: PhonePreviewProps) {
  return (
    <aside aria-label="Live preview" className="sticky top-6 hidden lg:block">
      <div className="flex h-[620px] w-[300px] flex-col items-center overflow-y-auto rounded-[36px] bg-surface-profile p-4 shadow-panel [scrollbar-width:none]">
        <div className="flex self-stretch justify-between" aria-hidden="true">
          <span className="flex size-9 items-center justify-center rounded-[14px] bg-white font-display text-18 leading-none font-extrabold tracking-[-0.04em] shadow-card">
            lb
          </span>
          <span className="flex size-9 items-center justify-center rounded-md bg-surface-card shadow-float">
            <Share size={16} strokeWidth={1.75} />
          </span>
        </div>
        <div className="mt-3">
          <Avatar name={name} size={76} />
        </div>
        <p className="mt-3.5 mb-5 text-18 leading-[1.2] font-bold tracking-[-0.02em]">{name}</p>
        {links.length > 0 ? (
          <ul className="flex flex-col gap-2.5 self-stretch">
            {links.map((link) => (
              <li key={link.id}>
                <LinkButton title={link.title} href={getSafeHref(link.url) ?? undefined} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-6 text-center text-14 leading-normal text-fg-muted">
            Your links will appear here.
          </p>
        )}
      </div>
    </aside>
  );
}
