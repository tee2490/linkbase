import { ClosingCta } from "@/components/landing/closing-cta";
import { Faq } from "@/components/landing/faq";
import { Hero } from "@/components/landing/hero";
import { Reasons } from "@/components/landing/reasons";
import { SiteFooter } from "@/components/landing/site-footer";

export default function Home() {
  return (
    <>
      <main className="flex-1">
        <Hero />
        <Reasons />
        <Faq />
        <ClosingCta />
      </main>
      <SiteFooter />
    </>
  );
}
