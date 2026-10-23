import { Instagram, Link2, Music2, Youtube } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { LinkButton } from "@/components/ui/link-button";

const PREVIEW_LINKS = ["Slow flow", "Online courses", "Wellness retreats"];
const PREVIEW_SOCIALS = [Youtube, Instagram, Music2];
const PLACEHOLDER_HANDLE = "yourname";

type ProfilePreviewProps = {
  displayName: string;
  handle: string;
};

// A decorative, live preview of the page the user is claiming.
export function ProfilePreview({ displayName, handle }: ProfilePreviewProps) {
  const shownHandle = handle || PLACEHOLDER_HANDLE;

  return (
    <div className="relative flex min-h-[clamp(420px,60vh,100vh)] min-w-0 flex-[1_1_440px] flex-col items-center justify-center overflow-hidden bg-tangerine px-6 py-16">
      <div
        role="img"
        aria-label={`Preview of your Linkbase page at linkbase.me/${shownHandle}`}
        className="flex flex-col items-center"
      >
        <div className="relative z-10 mb-[-6px] max-w-[calc(100%-24px)] -translate-x-[22%] -rotate-5">
          <span className="flex h-14 max-w-full items-center gap-2.5 rounded-full bg-white px-6 text-20 font-medium text-fg shadow-float">
            <Link2 size={18} strokeWidth={1.75} aria-hidden="true" className="shrink-0" />
            <span className="truncate">/{shownHandle}</span>
          </span>
        </div>

        <div className="flex w-[min(300px,78vw)] rotate-4 flex-col items-center gap-2.5 rounded-[32px] bg-butter px-[18px] pt-[30px] pb-[22px] shadow-pop">
          <Avatar name={displayName} size={80} />
          <div className="mt-1 text-18 leading-[1.2] font-semibold whitespace-nowrap">
            {displayName}
          </div>
          <div className="mb-1.5 max-w-full truncate text-14 leading-[1.2] text-fg-secondary">
            @{shownHandle}
          </div>
          <div className="flex w-full flex-col gap-2.5">
            {PREVIEW_LINKS.map((title) => (
              <LinkButton key={title} title={title} />
            ))}
          </div>
          <div className="mt-1.5 flex gap-2.5">
            {PREVIEW_SOCIALS.map((Icon, index) => (
              <span
                key={index}
                className="flex size-11 items-center justify-center rounded-full bg-ink text-white"
              >
                <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
