import { Accordion, type AccordionItem } from "@/components/ui/accordion";

const FAQS: AccordionItem[] = [
  {
    q: "What is Linkbase?",
    a: "A single page that holds all your important links, so one URL in your profile can send people anywhere.",
  },
  {
    q: "Is Linkbase free?",
    a: "Yes. The free plan includes unlimited links and the core themes. Paid plans add custom domains and deeper analytics.",
  },
  {
    q: "Does it work with every social platform?",
    a: "Any app that lets you add a URL to your profile works with Linkbase, including Instagram, TikTok, YouTube and X.",
  },
  {
    q: "Can I change my username later?",
    a: "Yes. You can change it any time from your settings. Your old link redirects for 30 days.",
  },
  {
    q: "Can I use my own domain?",
    a: "Paid plans let you connect a domain you already own, like links.yourname.com.",
  },
  {
    q: "Do I need a website?",
    a: "No. Your Linkbase page can be your website.",
  },
];

export function Faq() {
  return (
    <section className="bg-plum px-[clamp(20px,5vw,40px)] py-[clamp(64px,9vw,112px)]">
      <div className="mx-auto max-w-[820px]">
        <h2 className="m-0 mb-[clamp(32px,5vw,48px)] text-center font-display text-[clamp(38px,5vw,60px)] leading-none font-extrabold tracking-[-0.045em] text-blush">
          Questions? Answered
        </h2>
        <Accordion items={FAQS} name="faq" tone="dark" defaultOpen={0} />
      </div>
    </section>
  );
}
