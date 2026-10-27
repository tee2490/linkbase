import { handleSchema } from "@/lib/validation/handle";

// Variants offered when a username is taken. Only ones that are valid usernames themselves.
export function handleSuggestionCandidates(handle: string): string[] {
  const candidates = [`${handle}hq`, `the${handle}`, `${handle}_official`, `${handle}-links`, `${handle}1`];
  return candidates.filter(
    (candidate) => candidate !== handle && handleSchema.safeParse(candidate).success,
  );
}
