import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicProfileCard } from "@/components/profile/public-profile-card";
import { getPublicProfile } from "@/lib/db/queries/profile";

// One placeholder param lets the page await params outside <Suspense> under Cache Components.
// It fails the handle format check, so the build never queries the database. Real handles
// render on first request and are cached by getPublicProfile's tags (docs/data-fetching.md).
export async function generateStaticParams() {
  return [{ handle: "__placeholder__" }];
}

export async function generateMetadata({ params }: PageProps<"/user/[handle]">): Promise<Metadata> {
  const { handle } = await params;
  const profile = await getPublicProfile(handle);
  if (!profile) return { title: "Page not found · Linkbase" };
  return { title: `@${profile.handle} · Linkbase` };
}

// No <Suspense> around the lookup on purpose: notFound() must run before streaming starts,
// or the response keeps a 200 status (Next.js not-found docs, "Calling notFound() after streaming").
export default async function UserPage({ params }: PageProps<"/user/[handle]">) {
  const { handle } = await params;
  const profile = await getPublicProfile(handle);
  if (!profile) notFound();

  return <PublicProfileCard profile={profile} />;
}
