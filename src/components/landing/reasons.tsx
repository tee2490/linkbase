import { ChartNoAxesColumn, Smartphone, Timer, type LucideIcon } from "lucide-react";

type Reason = {
  icon: LucideIcon;
  title: string;
  body: string;
};

const REASONS: Reason[] = [
  {
    icon: Timer,
    title: "Live in two minutes",
    body: "Claim a username, paste your links and share. No website or code needed.",
  },
  {
    icon: Smartphone,
    title: "Built for phones",
    body: "Your page loads fast and looks right on every screen your followers use.",
  },
  {
    icon: ChartNoAxesColumn,
    title: "See what gets clicked",
    body: "Views and clicks for every link, so you know what your audience wants.",
  },
];

export function Reasons() {
  return (
    <section className="bg-white px-[clamp(20px,5vw,40px)] py-[clamp(64px,9vw,112px)]">
      <div className="mx-auto grid max-w-content grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] gap-[clamp(32px,4vw,48px)]">
        {REASONS.map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex flex-col gap-3.5">
            <div className="flex size-[52px] items-center justify-center rounded-full bg-mist">
              <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
            </div>
            <h3 className="mt-1.5 mb-0 text-[21px] leading-[1.25] font-semibold tracking-[-0.01em]">
              {title}
            </h3>
            <p className="m-0 max-w-[340px] text-16 leading-relaxed text-pretty text-fg-muted">
              {body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
