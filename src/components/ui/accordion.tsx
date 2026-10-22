import { ChevronDown } from "lucide-react";

export type AccordionItem = {
  q: string;
  a: string;
};

type AccordionProps = {
  items: AccordionItem[];
  // Shared name lets the browser keep one row open at a time, with no JS.
  name: string;
  tone?: "dark" | "light";
  defaultOpen?: number;
};

const TONE_CLASSES = {
  dark: "bg-white/8 text-white",
  light: "border border-border-subtle bg-surface-card text-fg",
};

export function Accordion({ items, name, tone = "dark", defaultOpen = -1 }: AccordionProps) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item, index) => (
        <details
          key={item.q}
          name={name}
          open={index === defaultOpen}
          className={`group rounded-lg ${TONE_CLASSES[tone]}`}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg px-6 py-5 text-[17px] font-semibold leading-[1.35] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current [&::-webkit-details-marker]:hidden">
            {item.q}
            <ChevronDown
              size={20}
              strokeWidth={1.75}
              aria-hidden="true"
              className="shrink-0 transition-transform duration-200 ease-out group-open:rotate-180"
            />
          </summary>
          <p className="m-0 px-6 pb-[22px] text-16 leading-relaxed opacity-85">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
