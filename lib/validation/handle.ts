import { z } from "zod";

export const HANDLE_MIN_LENGTH = 3;
export const HANDLE_MAX_LENGTH = 30;
export const HANDLE_PATTERN = /^[a-z0-9_-]+$/;

// Names that could pass for Linkbase itself or collide with app routes.
export const RESERVED_HANDLES: ReadonlySet<string> = new Set([
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

export function isReservedHandle(handle: string): boolean {
  return RESERVED_HANDLES.has(handle);
}

// Format only. Reserved names are checked separately so they read as "taken", not "invalid".
export const handleFormatSchema = z
  .string({ error: "Pick a username" })
  .trim()
  .toLowerCase()
  .min(HANDLE_MIN_LENGTH, `Use at least ${HANDLE_MIN_LENGTH} characters`)
  .max(HANDLE_MAX_LENGTH, `Use ${HANDLE_MAX_LENGTH} characters or fewer`)
  .regex(HANDLE_PATTERN, "Use only lowercase letters, numbers, hyphens and underscores");

export const handleSchema = handleFormatSchema.refine((handle) => !isReservedHandle(handle), {
  error: "That username is taken",
});

export const claimHandleSchema = z.object({ handle: handleSchema });

export type ClaimHandleInput = z.infer<typeof claimHandleSchema>;
