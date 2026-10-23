import { z } from "zod";

export const HANDLE_MIN_LENGTH = 3;
export const HANDLE_MAX_LENGTH = 30;
export const HANDLE_PATTERN = /^[a-z0-9_-]+$/;

// Names that would read as official accounts or collide with app routes.
export const RESERVED_HANDLES = new Set([
  "admin",
  "api",
  "dashboard",
  "help",
  "linkbase",
  "onboarding",
  "settings",
  "sign-in",
  "sign-up",
  "support",
  "user",
]);

export const handleSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(HANDLE_MIN_LENGTH, `Use at least ${HANDLE_MIN_LENGTH} characters`)
  .max(HANDLE_MAX_LENGTH, `Use ${HANDLE_MAX_LENGTH} characters or fewer`)
  .regex(HANDLE_PATTERN, "Use only lowercase letters, numbers, hyphens and underscores")
  .refine((handle) => !RESERVED_HANDLES.has(handle), "That username isn't available");

export const claimHandleSchema = z.object({ handle: handleSchema });

export type ClaimHandleInput = z.infer<typeof claimHandleSchema>;

const FALLBACK_BASE = "linker";
const NUMBERED_SUFFIXES = 12;

// Turns free text (a display name, a taken handle) into valid handle candidates,
// best first: "Nia Brooks" → niabrooks, nia-brooks, nia_brooks, nia, brooks, niabrooks1, ...
export function handleCandidates(source: string): string[] {
  const words = source
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  const joined = words.join("").slice(0, HANDLE_MAX_LENGTH);
  const base = joined.length >= HANDLE_MIN_LENGTH ? joined : FALLBACK_BASE;

  const candidates = [
    base,
    words.join("-"),
    words.join("_"),
    ...words,
    ...Array.from({ length: NUMBERED_SUFFIXES }, (_, i) =>
      `${base.slice(0, HANDLE_MAX_LENGTH - 2)}${i + 1}`,
    ),
  ];

  return [...new Set(candidates)].filter((candidate) => handleSchema.safeParse(candidate).success);
}
