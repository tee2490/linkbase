import Link from "next/link";

import { buttonClasses } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="bg-butter px-[clamp(16px,4vw,24px)] pt-4">
      <div className="mx-auto flex max-w-content items-center gap-1 rounded-full bg-white py-2 pr-2 pl-[clamp(18px,3vw,28px)] shadow-float">
        <span className="min-w-0 flex-1 font-display text-[clamp(22px,5vw,26px)] leading-none font-extrabold tracking-[-0.04em]">
          linkbase
        </span>
        <Link href="/sign-in" className={`${buttonClasses({ variant: "ghost", size: "sm" })} px-3`}>
          Log in
        </Link>
        <Link href="/sign-in" className={buttonClasses({ size: "sm" })}>
          Sign up free
        </Link>
      </div>
    </header>
  );
}
