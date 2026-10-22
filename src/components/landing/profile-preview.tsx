import { Avatar } from "@/components/ui/avatar";
import { LinkButton } from "@/components/ui/link-button";

const PREVIEW_LINKS = ["New single out now", "Tour dates", "Merch store"];

export function ProfilePreview() {
  return (
    <div className="flex min-h-[clamp(400px,46vw,520px)] items-center justify-center overflow-hidden rounded-[32px] bg-tangerine px-6 py-10">
      <div
        role="img"
        aria-label="Example Linkbase page for Mara Okafor, a songwriter in Lagos, with three links"
        className="flex w-[min(280px,100%)] -rotate-4 flex-col items-center gap-2.5 rounded-[28px] bg-surface-profile px-4 pt-7 pb-5 shadow-pop"
      >
        <Avatar name="Mara Okafor" size={72} />
        <div className="mt-1 text-[17px] leading-[1.2] font-semibold">Mara Okafor</div>
        <div className="mb-2 text-13 leading-[1.3] text-fg-muted">Songwriter · Lagos</div>
        <div className="flex w-full flex-col gap-2.5">
          {PREVIEW_LINKS.map((title) => (
            <LinkButton key={title} title={title} />
          ))}
        </div>
      </div>
    </div>
  );
}
