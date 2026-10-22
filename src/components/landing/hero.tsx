import { ClaimForm } from "./claim-form";
import { ProfilePreview } from "./profile-preview";

export function Hero() {
  return (
    <section className="bg-butter px-[clamp(20px,5vw,40px)] pt-[clamp(48px,8vw,96px)] pb-[clamp(56px,9vw,112px)]">
      <div className="mx-auto flex max-w-content flex-wrap items-center gap-[clamp(40px,6vw,72px)]">
        <div className="min-w-0 flex-[1_1_440px]">
          <h1 className="m-0 font-display text-[clamp(46px,7vw,92px)] leading-none font-extrabold tracking-[-0.045em] text-balance">
            One link for everything you make.
          </h1>
          <p className="mt-[22px] mb-8 max-w-[500px] text-[clamp(17px,1.6vw,19px)] leading-relaxed text-pretty text-ink-2">
            Put your videos, shop, socials and newsletter behind a single link. Share it in your bio,
            on stage or on a business card.
          </p>
          <ClaimForm />
          <p className="mt-3.5 mb-0 text-14 leading-normal text-fg-muted">
            Free forever. You can always change it later.
          </p>
        </div>
        <div className="min-w-0 flex-[1_1_340px]">
          <ProfilePreview />
        </div>
      </div>
    </section>
  );
}
