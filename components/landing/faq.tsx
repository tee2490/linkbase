import { Accordion } from "@/components/ui/accordion";

const FAQ_ITEMS = [
  {
    question: "Is Linkbase free?",
    answer: "Yes. You can create a page, add your links and share it without paying.",
  },
  {
    question: "Do I need a website to use Linkbase?",
    answer:
      "No. Your Linkbase page is a website: one short link that holds everything you want people to find.",
  },
  {
    question: "Where can I use my link?",
    answer:
      "Anywhere you can paste a URL: social bios, video descriptions, email signatures, and printed QR codes.",
  },
  {
    question: "Can I change my username later?",
    answer: "Yes, from Settings at any time.",
  },
  {
    question: "How many links can I add?",
    answer:
      "As many as you like. Most pages work best with five to seven, ordered by what matters most right now.",
  },
  {
    question: "Can I see who clicks my links?",
    answer: "Every link shows its click count, and your dashboard shows views and clicks over time.",
  },
] as const;

export function Faq() {
  return (
    <section id="faq" className="on-dark bg-maroon text-ink-inverse">
      <div className="px-5 py-16 sm:px-10 sm:py-24 lg:px-18">
        <div className="mx-auto flex max-w-container flex-col items-center gap-10">
          <h2 className="m-0 text-center font-display text-[clamp(36px,4.6vw,64px)] leading-none font-extrabold tracking-[-0.02em] text-orchid [font-stretch:112%]">
            Before you sign up
          </h2>
          <div className="w-full max-w-[1028px]">
            <Accordion items={FAQ_ITEMS} defaultOpen={0} />
          </div>
        </div>
      </div>
    </section>
  );
}
