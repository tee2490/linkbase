# Linkbase Security — Secrets, Headers, Rate Limits and User Content

App-wide security rules. All paths are under `src/` unless they're at the repo root. Auth and access control are in `docs/auth.md`; input validation is in `docs/errors-and-validation.md`.

---

## Secrets and environment variables

- **Secrets live in environment variables only**, never in code, comments, docs, tests or commit history.
- **`.env.local`** holds real values for local development. It's gitignored and never committed.
- **`.env.example`** is checked in as a template: every variable the app needs, with placeholder values and a comment on each.
- In production, set variables in the hosting platform's settings, not in a file.

```bash
# .env.example
# MongoDB connection string
MONGODB_URI=mongodb://localhost:27017/linkbase
# NextAuth secret. Generate with: npx auth secret
AUTH_SECRET=
# OAuth provider credentials (TBD)
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
```

**`.gitignore` needs one change.** It currently ignores `.env*`, which also ignores `.env.example`. Add an exception below that line:

```gitignore
.env*
!.env.example
```

Rules:

- **Never prefix a secret with `NEXT_PUBLIC_`.** Those variables are inlined into the browser bundle at build time.
- **Read secrets only in server code.** Modules that read them start with `import "server-only"`.
- **Validate env vars at startup** with a Zod schema in `lib/env.ts`, so a missing or malformed value fails immediately with a clear message instead of at the first request.
- **If a secret is ever committed, rotate it.** Removing it from the latest commit doesn't remove it from history.
- Don't log env values, connection strings or tokens (see the logging rules in `docs/errors-and-validation.md`).

## Security headers

Headers are set in `headers()` in `next.config.ts` (the project uses TypeScript config) and apply to every route.

| Header | Value | Protects against |
|---|---|---|
| `Content-Security-Policy` | See below | Cross-site scripting (XSS), injected scripts, clickjacking |
| `X-Frame-Options` | `DENY` | Clickjacking in older browsers (CSP `frame-ancestors` covers modern ones) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Leaking full URLs to other sites |
| `X-Content-Type-Options` | `nosniff` | Browsers guessing a file's type and running it as script |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Downgrade to HTTP |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Features the app doesn't use |

```ts
// next.config.ts (additions)
const isDev = process.env.NODE_ENV === "development";

const csp = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""};
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https:;
  font-src 'self';
  connect-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`.replace(/\s{2,}/g, " ").trim();

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // ...existing options
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};
```

About the CSP:

- **It's a static policy without nonces, on purpose.** Nonce-based CSP requires every page to be rendered per request, and Next.js documents it as incompatible with Partial Prerendering, which this project uses by default. A static policy keeps the prerendered shell. The trade-off is `'unsafe-inline'` for scripts, which Next.js needs for its inline bootstrapping scripts.
- `img-src https:` allows avatars from OAuth providers and other HTTPS images. Narrow it to specific hosts once the image sources are known.
- When adding a third-party script, font or API, add its origin to the matching directive rather than loosening `default-src`.
- Check the browser console for CSP violations after any change.

## Rate limiting

Rate-limit the actions an attacker would repeat:

| Action | Key | Limit | On limit |
|---|---|---|---|
| Sign-in attempts | IP address + email (if any) | 5 per 15 minutes | Show "Too many attempts. Try again later." |
| Link creation (`addLink`) | User id | 30 per hour | Return `formError: "You're adding links too fast. Try again later."` |

- **Check the limit before doing the work**: in a Server Action, right after `requireUserId()` and before validation and the write (see `docs/data-mutations.md`). A limited request returns an `ActionResult` error; it doesn't throw.
- **Use a shared store, not memory.** An in-memory counter resets on every deploy and isn't shared between server instances. Use MongoDB (a counter collection with a TTL index) or Redis. Choice: **TBD**.
- Put the helper in `lib/rate-limit/` with one function, for example `checkRateLimit(key, limit, windowSeconds)`.
- **Get the client IP from the platform.** Read `x-forwarded-for` (or the platform's own header) via `headers()`, and trust it only when the app runs behind a proxy that sets it.
- Don't reveal whether an email exists. Sign-in errors and rate-limit messages are the same whether or not the account exists.
- Add more limits as features need them (profile updates, handle changes, webhooks).

## User-generated content

Link titles, URLs, display names, bios and handles come from users. Treat them as untrusted on the way in and on the way out.

### On write

- Validate with Zod (see `docs/errors-and-validation.md`). Link URLs must use `http:` or `https:`. That rejects `javascript:`, `data:` and other schemes that can run code when clicked.
- Enforce length limits on every text field.

### On render

- **Render user content as text, through JSX.** React escapes strings in JSX automatically, so `<p>{link.title}</p>` is safe.
- **Never use `dangerouslySetInnerHTML` with user content.** If rich text is ever needed, sanitize it with a vetted library first.
- **Re-check URLs before using them in `href`.** Render a link only if its URL parses and its protocol is `http:` or `https:`. Data stored before a validation rule existed, or written by another path, shouldn't be trusted blindly.
- Don't put user content into `<script>` tags, inline styles, or URLs built by string concatenation. Use `URL` and `encodeURIComponent`.

### Outbound links

Every link to a user-supplied URL opens in a new tab with `rel="noopener noreferrer"`:

```tsx
<a href={link.url} target="_blank" rel="noopener noreferrer">
  {link.title}
</a>
```

- `noopener` stops the opened page from controlling Linkbase's tab through `window.opener`.
- `noreferrer` stops the profile URL from being sent to the destination.
- Use a plain `<a>` for external URLs, not Next.js `<Link>`, which is for internal routes.
- Consider adding `nofollow ugc` to the `rel` so search engines don't treat user links as endorsements.

## Checklist

Before merging, check that the change:

- [ ] Adds no secrets to code, and adds any new env var to `.env.example`
- [ ] Uses no `NEXT_PUBLIC_` prefix for anything secret
- [ ] Rate-limits any new action an attacker could repeat
- [ ] Renders user content only through JSX, with no `dangerouslySetInnerHTML`
- [ ] Opens external user links with `target="_blank" rel="noopener noreferrer"`
- [ ] Updates the CSP if it adds a new external origin
