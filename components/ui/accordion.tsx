"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

type AccordionItem = {
  question: string;
  answer: string;
};

type AccordionProps = {
  items: readonly AccordionItem[];
  defaultOpen?: number;
};

export function Accordion({ items, defaultOpen = -1 }: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const baseId = useId();

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, index) => {
        const isOpen = open === index;
        const panelId = `${baseId}-panel-${index}`;

        return (
          <div key={item.question} className="rounded-xl bg-maroon-deep text-orchid">
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpen(isOpen ? -1 : index)}
              className="flex w-full cursor-pointer items-center justify-between gap-6 rounded-xl p-6 text-left text-[19px] leading-[25px] font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-inverse sm:p-8 sm:text-[22px] sm:leading-7 lg:p-12 lg:text-title-md lg:font-medium"
            >
              <span>{item.question}</span>
              <ChevronDown
                size={24}
                strokeWidth={1.75}
                className={`flex-none transition-transform duration-150 ease-out ${isOpen ? "rotate-180" : ""}`}
              />
            </button>
            {isOpen ? (
              <p
                id={panelId}
                className="m-0 max-w-[820px] px-6 pb-6 text-body-md text-ink-inverse sm:px-8 sm:pb-8 sm:text-body lg:px-12 lg:pb-12"
              >
                {item.answer}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
