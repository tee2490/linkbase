const SAFE_PROTOCOLS = new Set(["http:", "https:"]);

// Re-checks a stored URL before it goes into an href (see docs/security.md "On render").
export function getSafeHref(url: string): string | null {
  try {
    const parsed = new URL(url);
    return SAFE_PROTOCOLS.has(parsed.protocol) ? parsed.href : null;
  } catch {
    return null;
  }
}

// "https://www.example.com/a" → "example.com"; falls back to the raw text if it doesn't parse.
export function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
