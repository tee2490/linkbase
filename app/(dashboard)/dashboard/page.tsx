import type { Metadata } from "next";
import { Suspense } from "react";

import { AddLinkDialog } from "@/components/links/add-link-dialog";
import { LinkList } from "@/components/links/link-list";
import { PhonePreview } from "@/components/links/phone-preview";
import { Panel } from "@/components/ui/panel";
import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";
import { getMyLinks } from "@/lib/db/queries/links";

export const metadata: Metadata = {
  title: "Dashboard · Linkbase",
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardEditor />
    </Suspense>
  );
}

async function DashboardEditor() {
  // Server-side identity and onboarding check: the proxy alone isn't the security boundary (docs/auth.md).
  const [user, links] = await Promise.all([requireOnboardedUser(), getMyLinks()]);

  return (
    <div className={gridClassName}>
      <main className="w-full min-w-0">
        <Panel title="Content">
          <div className="my-6 flex items-center gap-4 rounded-md bg-sage p-4">
            <div
              aria-hidden="true"
              className="flex size-16 flex-none items-center justify-center rounded-full bg-orchid font-display text-[26px] font-extrabold text-ink"
            >
              {user.handle.charAt(0).toUpperCase()}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate font-display text-[22px] leading-7 font-extrabold tracking-[-0.01em] text-ink [font-stretch:112%]">
                {user.handle}
              </span>
              <span className="truncate text-body-sm text-ink">
                {links.length === 1 ? "1 link" : `${links.length} links`} on linkbase/{user.handle}
              </span>
            </div>
          </div>
          <div className="mb-5">
            <AddLinkDialog />
          </div>
          <LinkList links={links} />
        </Panel>
      </main>

      <aside
        aria-label="Live preview of your page"
        className="on-dark relative overflow-hidden rounded-2xl bg-cobalt px-6 py-8 md:sticky md:top-6"
      >
        {/* Brand shapes behind the phone, as in the landing hero and onboarding. */}
        <div aria-hidden="true">
          <div className="absolute -top-10 right-6 h-48 w-24 rounded-2xl bg-lime" />
          <div className="absolute bottom-16 -left-12 h-14 w-48 rounded-full bg-orchid" />
          <div className="absolute right-10 -bottom-8 size-20 rounded-full bg-forest" />
        </div>
        <div className="relative">
          <PhonePreview handle={user.handle} links={links} />
        </div>
      </aside>
    </div>
  );
}

const gridClassName =
  "mx-auto grid w-full max-w-[1180px] items-start gap-6 px-4 py-6 sm:px-6 sm:py-8 md:grid-cols-[minmax(0,1fr)_320px] lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-10";

function DashboardSkeleton() {
  return (
    <div aria-hidden="true" className={gridClassName}>
      <div className="h-[420px] w-full rounded-lg bg-surface shadow-card" />
      <div className="hidden h-[720px] rounded-2xl bg-cobalt/20 md:block" />
    </div>
  );
}
