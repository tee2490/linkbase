import { Link as LinkIcon } from "lucide-react";

import { LinkButton } from "@/components/ui/link-button";

const PREVIEW_LINKS = ["Your first link", "Your latest video", "Your shop"] as const;

type HandlePreviewProps = {
  // Already validated by the caller; falls back to a placeholder when empty.
  handle: string;
};

export function HandlePreview({ handle }: HandlePreviewProps) {
  const shown = handle || "yourname";

  return (
    <aside
      aria-label="Preview of your page"
      className="relative flex flex-col items-center justify-center gap-6 overflow-hidden px-5 pt-10 pb-16 sm:px-0 sm:pt-12 sm:pb-0 lg:bg-cobalt lg:p-12"
    >
      <div aria-hidden="true" className="hidden lg:block">
        <div className="absolute -top-10 right-6 h-[300px] w-[120px] rounded-2xl bg-lime xl:right-16 xl:w-40" />
        <div className="absolute bottom-18 -left-12 h-18 w-[260px] rounded-full bg-orchid" />
        <div className="absolute right-30 -bottom-9 size-24 rounded-full bg-forest" />
      </div>

      <span className="relative font-mono text-caption-mono text-ink-inverse">Live preview</span>

      <div
        aria-hidden="true"
        inert
        className="relative flex w-full max-w-[360px] flex-col items-center gap-3 rounded-xl bg-profile-canvas px-5 pt-8 pb-6 shadow-phone"
      >
        <div className="flex size-20 items-center justify-center rounded-full bg-orchid font-display text-[32px] font-extrabold text-ink">
          {shown.charAt(0).toUpperCase()}
        </div>
        <div className="max-w-full truncate text-[20px] leading-[26px] font-bold text-ink-app">@{shown}</div>
        <div className="-mt-2 text-body-sm text-muted-app">Your bio goes here</div>
        <div className="mt-2 flex w-full flex-col gap-2.5">
          {PREVIEW_LINKS.map((title) => (
            <LinkButton key={title} href="#" showMore>
              {title}
            </LinkButton>
          ))}
        </div>
      </div>

      <div className="relative flex max-w-full items-center gap-2 rounded-full bg-surface px-5 py-3 text-[16px] font-semibold text-ink-app shadow-float">
        <LinkIcon size={18} strokeWidth={1.75} aria-hidden="true" className="flex-none" />
        <span className="truncate">linkbase/{shown}</span>
      </div>
    </aside>
  );
}
