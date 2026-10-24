import { Suspense } from "react";
import type { Metadata } from "next";

import { requireUserId } from "@/lib/auth";
import { getLinksForUser } from "@/lib/db/queries/links";
import { getOnboardingState } from "@/lib/db/queries/users";
import { SiteHeader } from "@/components/landing/site-header";
import { LinkEditor } from "@/components/links/link-editor";
import { PhonePreview } from "@/components/links/phone-preview";

export const metadata: Metadata = {
  title: "Dashboard · Linkbase",
};

function LinksFallback() {
  return (
    <div aria-hidden="true" className="mt-6 flex flex-col gap-3.5">
      <div className="h-16 rounded-full bg-surface-chip" />
      <div className="h-12 rounded-full bg-surface-chip" />
      <div className="h-[82px] rounded-xl bg-surface-chip" />
      <div className="h-[82px] rounded-xl bg-surface-chip" />
    </div>
  );
}

async function DashboardContent() {
  const userId = await requireUserId();
  const [user, links] = await Promise.all([getOnboardingState(userId), getLinksForUser(userId)]);
  if (!user) throw new Error("Signed-in user not found");

  return (
    <>
      <section className="min-w-0 rounded-[28px] p-0 sm:p-8 sm:pb-10 sm:shadow-panel">
        <h1 className="m-0 text-28 leading-none font-semibold tracking-[-0.03em]">Links</h1>
        <LinkEditor name={user.displayName} links={links} />
      </section>
      <PhonePreview name={user.displayName} links={links} />
    </>
  );
}

export default function DashboardPage() {
  return (
    <>
      <SiteHeader />
      <main className="w-full px-4 pt-6 pb-12 sm:px-6">
        <div className="grid grid-cols-[minmax(0,640px)] items-start justify-center gap-10 lg:grid-cols-[minmax(0,560px)_auto]">
          <Suspense fallback={<LinksFallback />}>
            <DashboardContent />
          </Suspense>
        </div>
      </main>
    </>
  );
}
