import { ClaimForm } from "./claim-form";

export function ClosingCta() {
  return (
    <section className="on-dark bg-grape text-ink-inverse">
      <div className="px-5 py-16 sm:px-10 sm:py-24 lg:px-18">
        <div className="mx-auto flex max-w-container flex-col items-center gap-6 text-center">
          <h2 className="m-0 max-w-[820px] font-display text-[clamp(36px,4.6vw,64px)] leading-none font-extrabold tracking-[-0.02em] text-orchid [font-stretch:112%]">
            Your link is waiting.
          </h2>
          <p className="m-0 max-w-[520px] text-body-lg">
            Claim your name before someone else does. You can change everything else later.
          </p>
          <ClaimForm
            id="cta-handle"
            buttonVariant="lime"
            className="mt-2 w-full max-w-[560px] justify-center text-left"
          />
        </div>
      </div>
    </section>
  );
}
