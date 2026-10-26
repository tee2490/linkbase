import { Link as LinkIcon } from "lucide-react";

import { LinkButton } from "@/components/ui/link-button";

const PREVIEW_LINKS = ["Join my spring run club", "Training plans", "Latest video"] as const;

export function ProfilePreview() {
  return (
    <div aria-hidden="true" inert className="relative flex items-center justify-center py-10">
      <div className="absolute inset-y-0 right-[10%] left-[10%] rounded-2xl bg-cobalt max-sm:inset-x-0 max-sm:inset-y-6" />
      <div className="relative flex w-full max-w-[340px] flex-col items-center gap-3 rounded-xl bg-profile-canvas px-5 pt-8 pb-6 shadow-phone">
        <div className="flex size-20 items-center justify-center rounded-full bg-orchid font-display text-[28px] font-extrabold text-ink">
          MO
        </div>
        <div className="text-[20px] leading-[26px] font-bold text-ink-app">Maya Ortiz</div>
        <div className="-mt-2 text-center text-body-sm text-muted-app">
          Trail runner · coach · bad at rest days
        </div>
        <div className="mt-2 flex w-full flex-col gap-2.5">
          {PREVIEW_LINKS.map((title) => (
            <LinkButton key={title} href="#" showMore>
              {title}
            </LinkButton>
          ))}
        </div>
      </div>
      <div className="absolute bottom-18 left-[2%] flex items-center gap-2 rounded-full bg-surface px-5 py-3 text-[16px] font-semibold text-ink-app shadow-float max-sm:left-0">
        <LinkIcon size={18} strokeWidth={1.75} />
        <span>linkbase/mayaruns</span>
      </div>
    </div>
  );
}
