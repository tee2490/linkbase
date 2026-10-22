import { ClaimForm } from "./claim-form";

export function FinalCta() {
  return (
    <section className="bg-cobalt px-[clamp(20px,5vw,40px)] py-[clamp(72px,10vw,120px)]">
      <div className="mx-auto max-w-[760px] text-center">
        <h2 className="m-0 font-display text-[clamp(40px,6vw,72px)] leading-none font-extrabold tracking-[-0.045em] text-balance text-sky">
          Start your corner of the internet
        </h2>
        <div className="mx-auto mt-9 max-w-[540px]">
          <ClaimForm variant="accent" />
        </div>
      </div>
    </section>
  );
}
