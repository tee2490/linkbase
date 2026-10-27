# Security

How Linkbase handles secrets, security headers, rate limiting and user-generated content. Session handling, route protection and ownership checks are in `docs/auth.md`. Input validation is in `docs/errors-and-validation.md`.

## Secrets and environment variables

Secrets live in environment variables only. They never appear in code, in the repo, in logs or in anything sent to the browser.

| File | Committed | Holds |
| --- | --- | --- |
| `.env.example` | Yes | Every variable the app needs, with empty or placeholder values and a short comment |
| `.env.local` | **Never** | Real values for local development |
| Hosting dashboard | — | Real values for preview and production |

```bash
# .env.example
# MongoDB connection string (mongodb+srv://user:password@host/db)
MONGODB_URI=

# Auth.js secret. Generate with: npx auth secret
AUTH_SECRET=

# Sign-in provider credentials: TBD (see docs/auth.md)
```

- `.gitignore` ignores `.env*` and re-includes the template with `!.env.example`. Don't commit any other `.env` file.
- When you add a variable, add it to `.env.example` in the same change, without its value.
- **Never prefix a secret with `NEXT_PUBLIC_`.** Those variables are inlined into the browser bundle at build time. Use `NEXT_PUBLIC_` only for values that are safe to publish.
- Read secrets only in server code. Modules that read them start with `import "server-only";`, so importing them from a Client Component fails the build.
- Fail fast on a missing secret at startup, as `lib/db/connect.ts` does for `MONGODB_URI`. Don't fall back to a default value.
- Never log `process.env`, connection strings or tokens (`docs/errors-and-validation.md`).
- If a secret is ever committed or leaked, rotate it right away. Removing it from git history is not enough.

## Security headers

Security headers are set for every route in `next.config.ts` with `headers()`.

```ts
// next.config.ts (excerpt)
const isDev = process.env.NODE_ENV === "development";

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // ...existing options
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};
```

| Header | Why |
| --- | --- |
| `Content-Security-Policy` | Limits where scripts, styles, images and connections can come from, which reduces the impact of an XSS bug |
| `X-Frame-Options: DENY` | Stops other sites from framing Linkbase (clickjacking). `frame-ancestors 'none'` does the same for modern browsers |
| `Referrer-Policy: strict-origin-when-cross-origin` | Outbound clicks send only our origin, never the full URL with paths or query strings |
| `X-Content-Type-Options: nosniff` | Stops browsers guessing content types |
| `Permissions-Policy` | Turns off browser features the app doesn't use |

**Why the CSP has no nonce.** A nonce must be new on every request, which needs fully dynamic rendering. Linkbase uses Cache Components and Partial Prerendering (`cacheComponents: true`), and their prerendered static shell can't carry a per-request nonce. So the CSP is static and allows `'unsafe-inline'` for the inline scripts Next.js injects. `'unsafe-eval'` is added in development only, where React needs it for error overlays. Next.js has experimental hash-based CSP (`experimental.sri`). Revisit it once it is stable.

When you add an external origin, add it to the narrowest directive that needs it. For example, avatars from the sign-in provider (TBD) go in `img-src`. Never add a wildcard like `https:` to `script-src`.

HSTS (`Strict-Transport-Security`) is set by the hosting platform. If the host doesn't set it, add `max-age=63072000; includeSubDomains; preload` in production only.

## Rate limiting

Rate limits stop credential stuffing on sign-in and spam on link creation. They are enforced on the server, keyed per user or per IP, and stored in MongoDB so they hold across instances. An in-memory counter resets on every deploy and isn't shared between serverless instances, so don't use one.

| What | Key | Limit |
| --- | --- | --- |
| Sign-in attempts | Client IP | 10 per 15 minutes |
| Sign-up (`signUp`) | Client IP | 5 per hour |
| Link creation (`createLink`) | `userId` | 30 per hour |
| Username availability (`checkHandle`) | `userId` | 120 per 10 minutes |

Start with these numbers and tune them from real usage.

```
lib/rate-limit/
  rate-limit.ts      rateLimit(key, limit, windowMs): { allowed, retryAfterMs }
lib/db/models/
  rate-limit.ts      { key, count, expiresAt } with a TTL index on expiresAt
```

`rateLimit` uses a fixed window. It runs one atomic `findOneAndUpdate` with `$inc` and `upsert` on a key like `create-link:{userId}:{windowStart}`. MongoDB's TTL index deletes old windows on its own. It never reads and then writes in two steps, because concurrent requests would slip through between them.

**Link creation.** Check the limit right after the session check, before validation (`docs/data-mutations.md`). Hitting the limit is an expected failure, so it is returned, not thrown:

```ts
const { userId } = await getSession();

const { allowed } = await rateLimit(`create-link:${userId}`, 30, 60 * 60 * 1000);
if (!allowed) {
  return { ok: false, formError: "You're adding links too quickly. Try again later." };
}
```

**Sign-in.** The limit runs inside the Credentials provider's `authorize()` in `lib/auth/auth.ts`, before the password check. That one place covers both the sign-in Server Action and a direct `POST /api/auth/callback/credentials`, and it keeps the proxy free of database calls. Over the limit, `authorize()` throws a `CredentialsSignin` with `code = "rate_limited"`, and the sign-in form shows "Too many attempts. Try again in a few minutes."

**Sign-up.** `signUp` checks the limit after validation and before hashing the password. Over the limit, it returns a `formError`.

- Key sign-in on the client IP from the first `x-forwarded-for` entry set by the hosting platform. Don't trust headers the client can set if the app isn't behind a trusted proxy.
- Keys hold ids and IPs only, never emails or other input the user typed (`docs/errors-and-validation.md` on logging).
- When you add an action that's easy to abuse (sign-up, profile updates, anything that sends email), add a row to the table above.

## User-generated content

Link titles, URLs, display names, bios and handles are untrusted. They are written by one user and shown to everyone on `/user/[handle]`.

### Validate on write

- URLs use **`z.httpUrl()`**, never `z.url()`. `z.url()` accepts any scheme, including `javascript:` and `data:`, which run code when clicked. `z.httpUrl()` allows only `http`/`https` with a real domain name.
- Text fields have a max length and are trimmed (`docs/errors-and-validation.md`).
- Store values as the user typed them. Don't HTML-escape before saving. Escaping happens on render.

### Escape on render

- Render user content as JSX text (`{link.title}`). React escapes it, so `<script>` shows up as literal text.
- **Never** pass user content to `dangerouslySetInnerHTML`. If formatted bios are ever needed, sanitize them with a vetted library first.
- Put user URLs only in `href`, never in `src` or `style`, and never build HTML strings from them.
- Re-check the scheme when rendering, so records saved before validation was tightened can't run `javascript:`. `ExternalLink` does this for you.
- Metadata (`generateMetadata`) is escaped by Next.js. JSON-LD written into a `<script>` tag must escape `<` as `<`.

### Outbound links

Every link to a user-supplied URL uses the `ExternalLink` primitive. It opens in a new tab with `rel="noopener noreferrer"`. `noopener` stops the opened page from controlling ours through `window.opener`, and `noreferrer` stops it from seeing which profile the click came from.

```tsx
// components/ui/external-link.tsx
import type { ReactNode } from "react";

type ExternalLinkProps = { href: string; children: ReactNode; className?: string };

export function ExternalLink({ href, children, className }: ExternalLinkProps) {
  const safe = /^https?:\/\//i.test(href);
  if (!safe) return <span className={className}>{children}</span>;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}
```

- Don't write a raw `<a target="_blank">` for user URLs. Use `ExternalLink`, so `rel` and the scheme check can't be forgotten.
- Internal navigation uses `next/link`, not `ExternalLink`.

## Checklist

- [ ] No secrets in code. New variables are added to `.env.example` without values
- [ ] No secret uses a `NEXT_PUBLIC_` prefix
- [ ] New external origins are added to the narrowest CSP directive
- [ ] Abusable actions are rate limited after the session check
- [ ] URLs are validated with `z.httpUrl()`
- [ ] User content is rendered as JSX text, never with `dangerouslySetInnerHTML`
- [ ] User URLs are rendered with `ExternalLink`
