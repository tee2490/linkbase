# Plan: Landing page

**Branch:** feat/landing-page
**Goal:** Replace the `create-next-app` starter at `/` with the public Linkbase landing page from the Claude Design file `Landing Page.dc.html`. A visitor reads the pitch and FAQ, types a username, and goes to sign-up. No auth and no data.

**Design source:** the `Landing Page.dc.html` design file, with the default props `faqTone: "plum"` and `showLogin: true`. Sections in order:
1. A floating white pill header on butter, with the wordmark and the "Log in" and "Sign up free" buttons.
2. Hero on butter: H1 "One link for everything you make.", a claim form, and a tilted profile-preview card on a tangerine tile.
3. Three reasons with icons.
4. Plum FAQ accordion.
5. Cobalt final CTA with a second claim form.
6. White footer.

## Docs followed
- `docs/architecture.md`: Server Components by default. The only client leaf is `ClaimForm`. Primitives go in `components/ui/` and landing sections in `components/landing/`. File names are kebab-case.
- `docs/coding-standards.md`: function components with typed props, named exports (default export only for `page.tsx` and `layout.tsx`), import order, no `any`.
- `docs/routing.md`: `/` is public and sits outside the route groups. Nothing here needs a Route Handler or Server Action.
- `docs/auth.md`: `/` is already on the proxy's public list. No session reads.
- `docs/design-system.md`: color, type, radius, shadow and motion tokens go into `@theme` in `globals.css`. Fonts load through `next/font/google`: Bricolage Grotesque for display, plus Geist and Geist Mono.
- `docs/ui.md`: specs for Button, Input, Accordion, Avatar and LinkButton; Lucide icons; the marketing layout pattern; a11y fixes (focus-visible rings, accordion semantics, reduced motion).
- `docs/security.md`: fonts are self-hosted by `next/font`, so no third-party origin is added. No user content is rendered.

## Files
| Action | Path | Purpose |
|---|---|---|
| Change | `src/app/globals.css` | Replace the starter tokens and dark mode with the design-system `@theme`: colors, semantic aliases, font families, text sizes, leading, tracking, radius, shadows, `max-w-content`, easings. Add base body styles. |
| Change | `src/app/layout.tsx` | Load Bricolage Grotesque (500–800), Geist and Geist Mono with `next/font/google` as CSS variables. Set the Linkbase metadata (title, description). |
| Change | `src/app/page.tsx` | The landing page (Server Component) that composes the sections below. |
| Create | `src/components/ui/button.tsx` | `Button`, plus a `buttonClasses({ variant, size, fullWidth })` helper so `next/link` can be styled as a button. Variants used: primary, ghost, accent; sizes sm and lg. |
| Create | `src/components/ui/input.tsx` | Filled input with an optional static prefix (`linkbase.me/`) and a focus ring. |
| Create | `src/components/ui/accordion.tsx` | Server-rendered FAQ built on native `<details name>`, so only one item is open at a time with no JS. `tone` is dark or light, and the first item is open by default. The chevron rotates 200ms. |
| Create | `src/components/ui/avatar.tsx` | Initials fallback with a background picked by name, per `ui.md`. |
| Create | `src/components/ui/link-button.tsx` | Public-profile link button, fill variant. It renders a non-interactive `<div>` when no `href` is given, for the preview. |
| Create | `src/components/landing/site-header.tsx` | Pill header. Log in (ghost) and Sign up free (primary) both link to `/sign-in`. |
| Create | `src/components/landing/claim-form.tsx` | `"use client"`. A prefixed input that cleans as you type (lowercase, `[a-z0-9._]`, max 30 characters) and a Claim button. Submitting navigates to `/sign-in?handle=<name>`, or to `/sign-in` when empty. The `variant` prop picks primary for the hero and accent for the CTA. |
| Create | `src/components/landing/hero.tsx` | H1, intro, `ClaimForm`, the "Free forever…" note and `ProfilePreview`. |
| Create | `src/components/landing/profile-preview.tsx` | Tangerine tile with a card rotated -4° showing Mara Okafor, "Songwriter · Lagos" and 3 LinkButtons. It's labelled as an example (`role="img"` plus `aria-label`). |
| Create | `src/components/landing/reasons.tsx` | 3-column auto-fit grid with the Lucide icons `Timer`, `Smartphone` and `ChartNoAxesColumn` in mist circles. |
| Create | `src/components/landing/faq.tsx` | Plum section with the blush H2 "Questions? Answered" and the 6 FAQs copied from the design. |
| Create | `src/components/landing/final-cta.tsx` | Cobalt section with the sky H2 "Start your corner of the internet" and `ClaimForm` (accent). |
| Create | `src/components/landing/site-footer.tsx` | Wordmark, nav (Help centre, Privacy, Terms, Contact) and "© 2026 Linkbase". |

**Dependency:** `lucide-react`, the version pinned in `docs/ui.md` (0.460.0), after confirming icon names through Context7.

## Approach
- **Tokens first.** Copy the `@theme` blocks from `design-system.md` into `globals.css` as written, with fonts mapped to the `next/font` variables. Use the classes they create (such as `bg-butter`, `text-ink-3`, `shadow-pop`, `max-w-content`) instead of the design's inline styles.
- **Fluid sizes.** Keep the design's `clamp()` values as arbitrary Tailwind values; they're kit values, not tokens. For example, the hero H1 is `text-[clamp(46px,7vw,92px)]`. The layout uses the design's own wrapping (flex-wrap and auto-fit grid), so no new breakpoints are needed. Design-system breakpoints are TBD.
- **Static page.** The page has no data and no `Date` calls (the year is hardcoded, as in the design), so with Cache Components it fully prerenders. Only `ClaimForm` ships JS.
- **Claim behaviour** (agreed): go to `/sign-in?handle=<name>` with `router.push`, and show no fake "it's yours" message. `/sign-in` returns 404 until the auth feature ships.
- **Accessibility:**
  - Inputs keep `aria-label="Choose a username"`.
  - All buttons and links get a visible focus ring.
  - Accordion semantics come from `<details>` and `<summary>`.
  - Transforms are disabled under `prefers-reduced-motion`.
  - The preview card's links aren't focusable.
- **Before coding,** check `next/font/google` (Bricolage Grotesque `axes`/weights) and `lucide-react` icon names against the bundled Next.js docs and Context7.

## Out of scope
- Sign-in and sign-up pages, auth, checking that a handle is free, and reserving handles.
- The real footer pages (Help, Privacy, Terms, Contact). Their links point to `#` for now.
- The security headers and CSP in `next.config.ts`, which `security.md` tracks separately.
- Dark mode (the design system says TBD), and removing the starter SVGs in `public/`.
- Tests and QA runs, which are separate steps.

## Open questions
- None. The claim behaviour is decided.

## QA Scenarios
1. **Happy path:** Open `/` on desktop. All six sections render as in the design, in Bricolage and Geist, with the butter, tangerine, plum, cobalt and white blocks.
2. **Claim:** Type `Mara.Okafor` in the hero field and press Enter. The field shows `mara.okafor`, and the browser goes to `/sign-in?handle=mara.okafor`. The cobalt CTA form does the same.
3. **Validation:** Type `my name!@#` followed by 40 more letters. Only `[a-z0-9._]` are kept, and the field stops at 30 characters. Clicking Claim with an empty field goes to `/sign-in` with no `handle`.
4. **Auth boundary:** Visit `/` signed out, in a private window. The page loads with no redirect, and Log in and Sign up free both point to `/sign-in`.
5. **FAQ:** "What is Linkbase?" is open on load. Opening "Is Linkbase free?" closes the first item, the chevron rotates, and the items work with Tab and Enter.
6. **Edge case (mobile):** At 375px wide, the hero stacks with the preview below the text, the claim input and button wrap to full width, the reasons go to one column, and nothing scrolls sideways.

## Verification
- Run `npm run lint` and `npm run build`. The build output should list `/` as prerendered.
- Run `npm run dev` and work through the QA scenarios at 1280px and 375px.
