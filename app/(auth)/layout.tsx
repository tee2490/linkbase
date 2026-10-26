import type { ReactNode } from "react";
import Link from "next/link";

import { ProfilePreview } from "@/components/landing/profile-preview";

type AuthLayoutProps = {
  children: ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="grid flex-1 bg-surface lg:grid-cols-2">
      <div className="flex flex-col px-5 py-6 sm:px-10 lg:px-18">
        <Link
          href="/"
          className="self-start rounded-sm font-display text-[26px] font-extrabold tracking-[-0.02em] text-ink [font-stretch:112%] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          Linkbase
        </Link>
        <main className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-[480px]">{children}</div>
        </main>
      </div>
      <div className="hidden items-center justify-center bg-lime p-16 lg:flex">
        <div className="w-full max-w-[520px]">
          <ProfilePreview />
        </div>
      </div>
    </div>
  );
}
