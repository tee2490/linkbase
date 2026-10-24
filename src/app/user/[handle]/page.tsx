import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPublicProfile } from "@/lib/db/queries/profiles";
import { handleSchema } from "@/lib/validation/handle";
import { PublicProfile } from "@/components/profile/public-profile";

// Blocking on purpose: params and the profile are read before anything streams, so an
// unknown handle gets a real 404 status instead of a 200 with not-found UI. That opts
// this route out of static-shell validation (see docs/routing.md "Public profile").
export const instant = false;

async function loadProfile(params: PageProps<"/user/[handle]">["params"]) {
  const { handle } = await params;
  // handle is user input: validate before querying (see docs/auth.md "Public profile").
  // Anything percent-encoded fails the handle pattern, so the raw segment is enough.
  const parsed = handleSchema.safeParse(handle);
  if (!parsed.success) return null;
  return getPublicProfile(parsed.data);
}

export async function generateMetadata({ params }: PageProps<"/user/[handle]">): Promise<Metadata> {
  const profile = await loadProfile(params);
  if (!profile) return { title: "Not found · Linkbase" };
  return {
    title: `@${profile.handle} · Linkbase`,
    description: `${profile.displayName}'s links on Linkbase.`,
  };
}

export default async function PublicProfilePage({ params }: PageProps<"/user/[handle]">) {
  const profile = await loadProfile(params);
  if (!profile) notFound();
  return <PublicProfile profile={profile} />;
}
