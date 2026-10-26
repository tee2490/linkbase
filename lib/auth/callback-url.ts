const DEFAULT_REDIRECT = "/dashboard";

// Only same-origin relative paths are allowed, so sign-in can't be used as an open redirect.
export function safeCallbackUrl(value: unknown): string {
  if (typeof value !== "string") return DEFAULT_REDIRECT;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return DEFAULT_REDIRECT;
  }
  return value;
}
