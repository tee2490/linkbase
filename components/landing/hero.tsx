import { ClaimForm } from "./claim-form";
import { ProfilePreview } from "./profile-preview";
import { SiteHeader } from "./site-header";

export function Hero() {
  return (
    <section className="bg-lime pt-6 text-forest">
      <div className="px-5 sm:px-10 lg:px-18">
        <div className="mx-auto max-w-container">
          <SiteHeader />
          <div className="grid items-center gap-12 pt-10 pb-12 sm:pt-12 sm:pb-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16 lg:pt-16 lg:pb-24">
            <div className="flex max-w-[640px] flex-col gap-6 lg:max-w-none">
              <h1 className="m-0 font-display text-[clamp(40px,8.4vw,72px)] leading-[0.98] font-extrabold tracking-[-0.02em] [font-stretch:112%] lg:text-[clamp(40px,6.2vw,88px)]">
                One link for everything you make.
              </h1>
              <p className="m-0 max-w-[520px] text-body-lg">
                Put your videos, shop, socials and latest drop behind one short link — and update it in
                seconds, from anywhere.
              </p>
              <ClaimForm id="hero-handle" buttonVariant="forest" className="mt-2" />
              <p className="m-0 text-body-sm">Free to start. Takes about a minute.</p>
            </div>
            <ProfilePreview />
          </div>
        </div>
      </div>
    </section>
  );
}
