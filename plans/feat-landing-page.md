# Landing page

**Branch:** feat/landing-page
**Docs followed:** docs/architecture.md, docs/database.md, docs/routing.md, docs/auth.md, docs/design-system.md, docs/ui.md, docs/coding-standards.md, docs/security.md
**Design:** https://claude.ai/code/artifact/eb1addf0-0526-4867-af03-8f41dbc11e16 (`project/Main.dc.html`, `landing.css`, the Linkbase design system tokens and `bundle.css`/`bundle.js`)

## Goal
Replace the create-next-app placeholder at `/` with the public Linkbase landing page from the design. It has five parts: a lime hero with a nav pill, a handle-claim form and a profile preview; a canvas "reasons" strip; a maroon FAQ accordion; a grape closing CTA; and the footer card. No auth and no data.

## Files
### Create
- `components/ui/button.tsx`: `Button`. It renders an `<a>` when `href` is set, otherwise a `<button>`. Variants used here: `ink`, `forest`, `lime`, `soft`. Sizes `lg` and `sm`. The pill or rounded shape and the states (hover brightness .94, press scale .98, focus ring) follow docs/ui.md → Button.
- `components/ui/input.tsx`: `Input` with a fixed `prefix` (`linkbase/`), an sr-only `label`, `surface` variant, `lg` size, and pass-through native props (`id`, `name`, `required`…). Spec: docs/ui.md → Input.
- `components/ui/accordion.tsx`: `"use client"`. One item open at a time, `defaultOpen` index. The question is a `<button>` with `aria-expanded`/`aria-controls` (ids from `useId`). The chevron rotates 180°. Spec: docs/ui.md → Accordion.
- `components/ui/link-button.tsx`: `LinkButton`, the profile link pill with an optional ⋮ glyph (docs/ui.md → LinkButton). Only the preview uses it here.
- `components/landing/site-header.tsx`: the white nav pill. Wordmark → `/`, `How it works` → `#how`, `FAQ` → `#faq`, `Log in` (soft) and `Sign up free` (ink) → `/sign-in`.
- `components/landing/claim-form.tsx`: `<form action="/sign-in" method="get">` with `Input name="handle" required` and a submit `Button`. Props: `id` (two forms on the page need unique input ids) and `buttonVariant` (`forest` in the hero, `lime` in the CTA).
- `components/landing/hero.tsx`: the lime section. Header, H1 "One link for everything you make.", body copy, `ClaimForm`, helper line, and `ProfilePreview` in a 1.1fr / 0.9fr grid.
- `components/landing/profile-preview.tsx`: the cobalt block, the "Maya Ortiz" profile card with an MO initials disc and 3 `LinkButton`s, and the `linkbase/mayaruns` chip. It's decorative, so the wrapper gets `aria-hidden` + `inert` and its links aren't in the tab order.
- `components/landing/reasons.tsx`: `#how`, canvas, with an sr-only H2 "Why Linkbase". Three articles: Zap/lime, Globe/orchid, SlidersHorizontal/cobalt.
- `components/landing/faq.tsx`: `#faq`, maroon, H2 "Before you sign up" in orchid. A typed `FAQ_ITEMS` constant feeds `Accordion` with `defaultOpen={0}`. Placeholder sentences are trimmed: "Is Linkbase free?" ends at "…without paying." and "Can I change my username later?" is "Yes, from Settings at any time."
- `components/landing/closing-cta.tsx`: grape, H2 "Your link is waiting.", body copy, centered `ClaimForm` with the `lime` button.
- `components/landing/site-footer.tsx`: grape ground with the white footer card. Brand block, Product/Company/Support nav columns, and a base row with © 2026 and Privacy/Terms/Cookies.

### Change
- `app/globals.css`: replace the starter theme with the Linkbase tokens as CSS variables on `:root`: colors, spacing, radii, sizes, shadows, font stacks. Map them for Tailwind v4 in `@theme inline`: colors, `font-display/sans/mono`, the `text-display-*`…`text-caption` scale, `spacing-18`, the radius overrides, `shadow-card/float/phone`, `h-control-*`, `max-w-container`. Remove the dark-mode block and the Arial body font.
- `app/layout.tsx`: load `Archivo` (`axes: ["wdth"]`), `Figtree` and `IBM_Plex_Mono` with `next/font/google` into `--font-*` variables, replacing Geist. Set real `metadata` (title "Linkbase", description "One link for everything you make.").
- `app/page.tsx`: a Server Component that composes `Hero`, `Reasons`, `Faq`, `ClosingCta` and `SiteFooter`. Delete the starter markup.
- `package.json`: add `lucide-react` (docs/ui.md → Icon), used at `strokeWidth={1.75}`.

## Notes
- **Public, no auth (docs/routing.md, docs/auth.md).** `/` is already on the public allowlist. `proxy.ts` doesn't exist yet, so nothing changes there. The page reads no session and touches no data, so docs/database.md and docs/data-fetching.md don't apply.
- **Server-first (docs/architecture.md).** Everything is a Server Component except `Accordion`. Primitives go in `components/ui`, sections in `components/landing`, files are kebab-case, components use named function declarations and the route file uses a default export (docs/coding-standards.md).
- **Claim form (your choice).** A plain GET to `/sign-in?handle=…`, with no JS and no Server Action. `/sign-in` returns 404 until the sign-in feature builds it and reads `handle`. Handle format rules aren't defined in /docs, so the only check here is `required`. Real validation (Zod, availability) belongs to the sign-in/onboarding feature.
- **Tokens on Tailwind v4.** docs/design-system.md shows a v3 `tailwind.config.ts`. This project runs v4, so the same mapping goes in `@theme inline` in `globals.css` with the same class names (`bg-lime`, `text-display-lg`, `rounded-lg` = 24px, `px-18`…). This changes the mechanism only, not the token values.
- **Breakpoints are TBD in the docs.** The design switches at 1024 / 600px. Plan: Tailwind's `lg` (1024) and `sm` (640), so the mobile layout starts at 640 rather than 600. The hero and section headlines use the design's fluid `clamp()` sizes (`clamp(40px,6.2vw,88px)`, `clamp(36px,4.6vw,64px)`) as arbitrary values, because the responsive type scale is also TBD.
- **Mobile nav.** As in the design, the nav links hide below `lg` and `Log in` hides below `sm`. There's no hamburger menu, which docs/ui.md marks as TBD.
- **Dark grounds** (FAQ, CTA, footer area) use the `focus-inverse` ring on buttons, inputs and accordion questions (docs/ui.md → State conventions).
- **Reduced motion.** The press and hover scale effects use `motion-safe:`, as docs/ui.md asks until the rules are defined.
- **Security (docs/security.md).** `next/font` self-hosts the fonts, so the CSP needs no new origin. All copy is static, so there's no user content to escape.
- **Footer links** (Features, Pricing, About, Privacy…) point to `#`. Those pages don't exist yet.

## QA Scenarios
1. **Happy path:** visitor types `mayaruns` in the hero form and presses Claim your link → browser goes to `/sign-in?handle=mayaruns`.
2. **Auth boundary:** signed-out visitor opens `/` → page renders fully with no redirect, and `Log in` / `Sign up free` both link to `/sign-in`.
3. **Validation:** visitor submits either claim form empty → the browser blocks submit with its required-field prompt and the URL doesn't change.
4. **Edge case (accordion):** visitor tabs to the FAQ and presses Enter on a closed question → it opens, the previously open one closes, `aria-expanded` updates and a white focus ring is visible on maroon.
5. **Edge case (mobile):** at 375px wide → nav shows only the wordmark and Sign up free, the hero stacks copy over preview, input and button go full width, reasons are one column, footer is two columns, and there's no horizontal scroll.
6. **Edge case (preview):** keyboard user tabs through the hero → focus skips the decorative profile preview and its links, and a screen reader doesn't announce "Maya Ortiz".

## Verification
- `npm run lint` and `npx tsc --noEmit` pass with zero errors.
- `npm run dev`, open `/`, compare against the design at 1440, 900 and 375px, and walk through the QA scenarios above.
