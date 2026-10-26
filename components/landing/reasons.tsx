import type { LucideIcon } from "lucide-react";
import { Globe, SlidersHorizontal, Zap } from "lucide-react";

type Reason = {
  title: string;
  body: string;
  Icon: LucideIcon;
  tileClassName: string;
  iconFill?: string;
};

const REASONS: readonly Reason[] = [
  {
    title: "Live in a minute",
    body: "Claim your name, add a few links and share. No site builder, no code.",
    Icon: Zap,
    tileClassName: "bg-lime text-forest",
    iconFill: "currentColor",
  },
  {
    title: "Fits every bio",
    body: "One short link works on Instagram, TikTok, YouTube, your email signature and printed QR codes.",
    Icon: Globe,
    tileClassName: "bg-orchid text-ink",
  },
  {
    title: "Know what lands",
    body: "See which links get clicked, then reorder your page around what your audience wants.",
    Icon: SlidersHorizontal,
    tileClassName: "bg-cobalt text-ink-inverse",
  },
];

export function Reasons() {
  return (
    <section id="how" className="bg-canvas text-ink">
      <div className="px-5 py-18 sm:px-10 lg:px-18">
        <div className="mx-auto max-w-container">
          <h2 className="sr-only">Why Linkbase</h2>
          <div className="grid gap-8 sm:grid-cols-3 lg:gap-10">
            {REASONS.map(({ title, body, Icon, tileClassName, iconFill }) => (
              <article key={title} className="flex flex-col gap-3">
                <div className={`flex size-14 items-center justify-center rounded-lg ${tileClassName}`}>
                  <Icon size={26} strokeWidth={1.75} fill={iconFill ?? "none"} />
                </div>
                <h3 className="m-0 mt-2 text-title-sm">{title}</h3>
                <p className="m-0 text-body-md text-muted">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
