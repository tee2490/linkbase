# Design system reference (Next.js + Tailwind)

The foundations of Linkbase for engineers: every token with its value, its CSS variable and its Tailwind class. Values come from `project/tokens.json` and `project/components/bundle.css`; anything the system does not define is marked **TBD** — decide it with design before building, don't guess.

Companion files: `docs/ui.md` (components, layouts, accessibility) and `nextjs-tailwind.md` (project setup, fonts, config).

## How tokens reach Tailwind

Tokens are CSS custom properties (`--lime`, `--space-4`, `--radius-lg`…), compiled from `tokens.json` into `tokens.css`. Tailwind only maps utility names onto those variables, so changing a token updates every class.

```ts
// tailwind.config.ts (v3; on v4 load it with @config "../tailwind.config.ts")
import type { Config } from "tailwindcss";

const v = (name: string) => `var(--${name})`;
const colors = [
  "surface", "canvas", "surface-soft", "surface-muted", "field", "profile-canvas", "backdrop", "border", "border-strong",
  "ink", "ink-app", "ink-inverse", "muted", "muted-app",
  "lime", "lime-soft", "forest", "cobalt", "navy", "maroon", "maroon-deep", "orchid", "magenta", "grape", "sage", "olive",
  "teal", "orange", "mustard",
  "success", "success-bright", "danger", "focus", "focus-inverse",
];

export default {
  content: ["./app/**/*.{ts,tsx,mdx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: Object.fromEntries(colors.map((c) => [c, v(c)])),
      fontFamily: { display: [v("font-display")], sans: [v("font-sans")], mono: [v("font-mono")] },
      fontSize: {
        "display-xl": ["88px", { lineHeight: "86px", letterSpacing: "-0.02em", fontWeight: "800" }],
        "display-lg": ["64px", { lineHeight: "60px", letterSpacing: "-0.02em", fontWeight: "800" }],
        "display-md": ["36px", { lineHeight: "40px", letterSpacing: "-0.01em", fontWeight: "800" }],
        "title-lg": ["32px", { lineHeight: "36px", fontWeight: "600" }],
        "title-md": ["26px", { lineHeight: "32px", fontWeight: "600" }],
        "title-sm": ["24px", { lineHeight: "30px", fontWeight: "700" }],
        "body-lg": ["20px", { lineHeight: "27px", fontWeight: "400" }],
        "body": ["18px", { lineHeight: "26px", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "body-sm": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "label-lg": ["18px", { lineHeight: "24px", fontWeight: "600" }],
        "label": ["16px", { lineHeight: "20px", fontWeight: "500" }],
        "caption": ["12px", { lineHeight: "16px", fontWeight: "500" }],
        "caption-mono": ["14px", { lineHeight: "20px", fontWeight: "400" }],
      },
      spacing: { 18: v("space-18") }, // every other space-N already equals Tailwind's default N
      borderRadius: {
        sm: v("radius-sm"), md: v("radius-md"), lg: v("radius-lg"),
        xl: v("radius-xl"), "2xl": v("radius-2xl"), full: v("radius-full"),
      },
      boxShadow: { card: v("shadow-card"), float: v("shadow-float"), phone: v("shadow-phone") },
      height: {
        "control-xl": v("size-control-xl"), "control-lg": v("size-control-lg"), "control-md": v("size-control-md"),
        "control-sm": v("size-control-sm"), "control-xs": v("size-control-xs"),
        "icon-btn": v("size-icon-btn"), "icon-btn-sm": v("size-icon-btn-sm"),
      },
      width: { "icon-btn": v("size-icon-btn"), "icon-btn-sm": v("size-icon-btn-sm") },
      maxWidth: { container: v("size-container"), panel: v("size-panel"), profile: v("size-profile") },
    },
  },
} satisfies Config;
```

Two consequences to know:

- Color classes point at variables, so opacity modifiers (`bg-lime/50`) don't work. The system has no translucent colors; if one is needed it is **TBD**.
- `rounded-sm` … `rounded-2xl` are **overridden**: `rounded-lg` is 24px here, not Tailwind's 8px.

## Colors

One theme, **Light**. A dark theme is **TBD**.

Every color generates `bg-*`, `text-*`, `border-*`, `ring-*`, `outline-*`, `fill-*` and `stroke-*` classes. The table lists the class you'll use most.

### Surfaces and lines

| Token | Hex | Tailwind | CSS variable | Use |
| --- | --- | --- | --- | --- |
| `surface` | `#ffffff` | `bg-surface` | `--surface` | Cards, nav pill, footer card, editor panels, profile link buttons, inputs on colored sections |
| `canvas` | `#f3f3f1` | `bg-canvas` | `--canvas` | Neutral marketing section background |
| `surface-soft` | `#eff0ed` | `bg-surface-soft` | `--surface-soft` | Marketing secondary button (Log in) |
| `surface-muted` | `#f2f2f2` | `bg-surface-muted` | `--surface-muted` | App secondary button, URL pill, round icon buttons, side-nav circles |
| `field` | `#f6f7f5` | `bg-field` | `--field` | Filled inputs on white |
| `profile-canvas` | `#edeef1` | `bg-profile-canvas` | `--profile-canvas` | Public profile page and phone preview |
| `backdrop` | `#a5a8aa` | `bg-backdrop` | `--backdrop` | Desktop backdrop behind the profile card. Never under text |
| `border` | `#ebebeb` | `border-border` | `--border` | 1px borders on editor rows/panels, dividers. Decorative only |
| `border-strong` | `#e1e2d9` | `border-border-strong` | `--border-strong` | Outline button border. Below 3:1 — see accessibility in `docs/ui.md` |

### Text

| Token | Hex | Tailwind | CSS variable | Use |
| --- | --- | --- | --- | --- |
| `ink` | `#1e2330` | `text-ink` | `--ink` | Marketing text and headings; also the Sign up button fill (`bg-ink`) |
| `ink-app` | `#141414` | `text-ink-app` | `--ink-app` | Editor and profile text; app primary fills (`bg-ink-app`) |
| `ink-inverse` | `#ffffff` | `text-ink-inverse` | `--ink-inverse` | Text on cobalt, maroon, grape, navy, forest, ink |
| `muted` | `#676b5f` | `text-muted` | `--muted` | Secondary marketing text, input prefixes, footer links |
| `muted-app` | `#595959` | `text-muted-app` | `--muted-app` | Editor meta text, inactive tabs |

### Brand palette

| Token | Hex | Tailwind | CSS variable | Use |
| --- | --- | --- | --- | --- |
| `lime` | `#d1e822` | `bg-lime` | `--lime` | Signature color: hero, CTA on cobalt/grape, display text on cobalt |
| `lime-soft` | `#ebffc5` | `bg-lime-soft` | `--lime-soft` | Announcement bar only |
| `forest` | `#254f1a` | `text-forest` / `bg-forest` | `--forest` | Text and CTA on lime |
| `cobalt` | `#2665d6` | `bg-cobalt` | `--cobalt` | Section background; accent word on canvas (`text-cobalt`) |
| `navy` | `#061491` | `bg-navy` | `--navy` | Deep feature/stat cards; text on orchid |
| `maroon` | `#780016` | `bg-maroon` | `--maroon` | Share and FAQ sections |
| `maroon-deep` | `#540410` | `bg-maroon-deep` | `--maroon-deep` | Accordion items on maroon |
| `orchid` | `#e9c0e9` | `bg-orchid` / `text-orchid` | `--orchid` | Headings on maroon/grape, secondary CTA, soft cards, avatars |
| `magenta` | `#d716e6` | `bg-magenta` | `--magenta` | Stat/feature accent tiles |
| `grape` | `#502274` | `bg-grape` | `--grape` | Closing CTA and footer section |
| `sage` | `#e7efd5` | `bg-sage` | `--sage` | Calm section background (analytics) |
| `olive` | `#71774e` | `bg-olive` | `--olive` | Stat tile background |
| `teal` | `#00acc4` | `bg-teal` | `--teal` | Illustration only |
| `orange` | `#ff6c05` | `bg-orange` | `--orange` | Illustration only |
| `mustard` | `#d6a336` | `bg-mustard` | `--mustard` | Illustration and product tiles |

### Status and focus

| Token | Hex | Tailwind | CSS variable | Use |
| --- | --- | --- | --- | --- |
| `success` | `#036e1b` | `bg-success` / `text-success` | `--success` | Toggle on, "available" messages |
| `success-bright` | `#43e660` | `text-success-bright` | `--success-bright` | Upgrade accent, only on `ink-app` |
| `danger` | `#b3261e` | `text-danger` / `ring-danger` | `--danger` | Form validation |
| `focus` | `#2665d6` (alias of `cobalt`) | `outline-focus` | `--focus` | Focus ring on light grounds |
| `focus-inverse` | `#ffffff` (alias of `ink-inverse`) | `outline-focus-inverse` | `--focus-inverse` | Focus ring on dark grounds |

Warning and info colors: **TBD**.

### Section tones

Marketing pages are built from full-bleed sections, each with a fixed pairing. Don't mix pairings.

| Section | Background | Headline | Body | CTA button | Focus ring |
| --- | --- | --- | --- | --- | --- |
| Hero | `bg-lime` | `text-forest` | `text-forest` | `bg-forest text-ink-inverse` | `focus` |
| Feature | `bg-cobalt` | `text-lime` | `text-ink-inverse` | `bg-lime text-ink` | `focus-inverse` |
| Share / FAQ | `bg-maroon` | `text-orchid` | `text-ink-inverse` | `bg-orchid text-ink` | `focus-inverse` |
| Analytics | `bg-sage` | `text-ink` | `text-ink` | `bg-orchid text-ink` | `focus` |
| Neutral | `bg-canvas` | `text-ink` (+ `text-cobalt` accent word) | `text-ink` | `bg-orchid` or `bg-ink` | `focus` |
| Closing + footer | `bg-grape` | `text-orchid` | `text-ink-inverse` | `bg-lime text-ink` | `focus-inverse` |

## Typography

| Family | Stack | CSS variable | Tailwind | Source |
| --- | --- | --- | --- | --- |
| Display | `"Archivo", "Arial Black", system-ui, sans-serif` | `--font-display` | `font-display` | Google Fonts, variable `wdth` 62–125, `wght` 100–900 |
| Sans | `"Figtree", system-ui, -apple-system, "Segoe UI", sans-serif` | `--font-sans` | `font-sans` | Google Fonts, `wght` 300–900 |
| Mono | `"IBM Plex Mono", ui-monospace, Menlo, monospace` | `--font-mono` | `font-mono` | Google Fonts, 400 and 500 |

Load them with `next/font/google` (see `nextjs-tailwind.md`). Archivo needs `axes: ["wdth"]`.

**Display text is always set at 112% width.** Tailwind v3 has no font-stretch utility, so add `[font-stretch:112%]` next to the display classes, or use the `.lb-display` class from `bundle.css`.

### Type scale

| Style | Family | Size / line height | Weight | Tracking | Tailwind | Use |
| --- | --- | --- | --- | --- | --- | --- |
| `display-xl` | Display, 112% wide | 88 / 86px | 800 | −0.02em | `font-display text-display-xl [font-stretch:112%]` | Hero headline, one per page |
| `display-lg` | Display, 112% wide | 64 / 60px | 800 | −0.02em | `font-display text-display-lg [font-stretch:112%]` | Section headlines |
| `display-md` | Display, 112% wide | 36 / 40px | 800 | −0.01em | `font-display text-display-md [font-stretch:112%]` | Onboarding, modal and mobile headlines |
| `title-lg` | Sans | 32 / 36px | 600 | — | `text-title-lg` | Feature card titles |
| `title-md` | Sans | 26 / 32px | 600 | — | `text-title-md` | Accordion questions, footer headings |
| `title-sm` | Sans | 24 / 30px | 700 | — | `text-title-sm` | Panel titles, profile name |
| `body-lg` | Sans | 20 / 27px | 400 | — | `text-body-lg` | Marketing paragraphs (max 620px wide) |
| `body` | Sans | 18 / 26px | 400 | — | `text-body` | Onboarding subtitles, accordion answers |
| `body-md` | Sans | 16 / 24px | 400 | — | `text-body-md` | Default app text, nav links |
| `body-sm` | Sans | 14 / 20px | 400 | — | `text-body-sm` | Footer links, meta, helper text |
| `label-lg` | Sans | 18 / 24px | 600 | — | `text-label-lg` | Large buttons, profile link buttons |
| `label` | Sans | 16 / 20px | 500 | — | `text-label` | Medium/small buttons, tabs, row titles |
| `caption` | Sans | 12 / 16px | 500 | — | `text-caption` | Side-nav labels, profile footer |
| `caption-mono` | Mono | 14 / 20px | 400 | — | `font-mono text-caption-mono` | Credit captions over photos |

`tokens.css` also ships each style as a plain class (`.display-xl`, `.body-md`…); either approach works, don't mix them on one element.

Responsive type sizes (how far a display style shrinks on small screens) are **TBD** at the system level. The screen mockups scale display headlines down to 32–44px on phones; `display-md` is the documented mobile size for section headlines.

## Spacing

4px base. Step N = N × 4px — identical to Tailwind's default spacing scale, so `p-10` is `space-10`. Only `18` needs adding.

| Token | Value | Tailwind | Use |
| --- | --- | --- | --- |
| `space-1` | 4px | `p-1`, `gap-1` | Icon-to-text nudges, meta separators |
| `space-2` | 8px | `p-2`, `gap-2` | Input + CTA gap, icon gap inside buttons |
| `space-3` | 12px | `p-3`, `gap-3` | Accordion item gap, link-row inner gap |
| `space-4` | 16px | `p-4`, `gap-4` | Editor rows, profile links, bento gaps; link-row padding |
| `space-5` | 20px | `p-5`, `gap-5` | Stat-card gaps |
| `space-6` | 24px | `p-6`, `gap-6` | Medium button padding; headline → body gap |
| `space-8` | 32px | `p-8`, `gap-8` | Large button padding; body → CTA gap |
| `space-10` | 40px | `p-10`, `gap-10` | Panel and feature-card padding |
| `space-12` | 48px | `p-12`, `gap-12` | Accordion item padding |
| `space-16` | 64px | `p-16`, `gap-16` | Footer-card padding, column gap |
| `space-18` | 72px | `px-18` (added) | Desktop page gutter |
| `space-24` | 96px | `py-24` | Compact section padding |
| `space-40` | 160px | `py-40` | Hero/section padding at desktop |

Tailwind steps the system doesn't name (7, 9, 11, 14, 20, 28, 32…) aren't part of Linkbase; avoid them.

### Fixed sizes

| Token | Value | Tailwind | Use |
| --- | --- | --- | --- |
| `size-control-xl` | 64px | `h-control-xl` | Profile link buttons, footer social circles |
| `size-control-lg` | 60px | `h-control-lg` | Marketing buttons and inputs |
| `size-control-md` | 48px | `h-control-md` | Onboarding inputs/buttons, square arrow buttons, side-nav circles |
| `size-control-sm` | 44px | `h-control-sm` | Editor buttons |
| `size-control-xs` | 36px | `h-control-xs` | Upgrade pill, chips |
| `size-icon-btn` | 40px | `h-icon-btn w-icon-btn` | Round icon buttons |
| `size-icon-btn-sm` | 32px | `h-icon-btn-sm w-icon-btn-sm` | Panel header icon buttons |
| `size-container` | 1296px | `max-w-container` | Marketing content column |
| `size-panel` | 624px | `max-w-panel` | Editor content panel |
| `size-profile` | 580px | `max-w-profile` | Public profile card |

## Radius

| Token | Value | Tailwind | Use |
| --- | --- | --- | --- |
| `radius-sm` | 8px | `rounded-sm` | Text inputs, Log in and outline buttons, square arrow buttons, thumbnails |
| `radius-md` | 16px | `rounded-md` | Public-profile link buttons, preview cards |
| `radius-lg` | 24px | `rounded-lg` | Editor panels, link rows, footer card |
| `radius-xl` | 32px | `rounded-xl` | Stat tiles, accordion items, logo tiles, profile card |
| `radius-2xl` | 40px | `rounded-2xl` | Feature cards, hero media |
| `radius-full` | 9999px | `rounded-full` | Every CTA pill, nav bar, avatars, icon buttons, URL pill, toggle |

Rule of thumb: actions are pills, containers are rounded, inputs are square-ish.

## Shadows

Marketing is flat — shadows appear only in the editor and the public profile.

| Token | Value | Tailwind | Use |
| --- | --- | --- | --- |
| `shadow-card` | `0 1px 2px rgba(20,20,20,0.04), 0 6px 24px rgba(20,20,20,0.06)` | `shadow-card` | Editor panels |
| `shadow-float` | `0 2px 12px rgba(20,20,20,0.10)` | `shadow-float` | Floating rails, chips over the preview |
| `shadow-phone` | `0 24px 64px rgba(20,20,20,0.18)` | `shadow-phone` | Profile card on backdrop, phone preview |

Hover and pressed shadow changes: **TBD** (none are defined).

## Breakpoints

**TBD** — `tokens.json` defines no breakpoints, and the system has not chosen between Tailwind's defaults and its own.

For reference, the Linkbase screen mockups were built with container queries at these widths. Treat them as a starting proposal, not as system values:

| Screen | Desktop | Tablet | Mobile |
| --- | --- | --- | --- |
| Landing page | ≥ 1024px | 600–1023px | < 600px |
| Welcome (pick handle) | ≥ 1024px | 600–1023px | < 600px |
| Dashboard | ≥ 1100px | 640–1099px | < 640px |
| Public profile | ≥ 640px (centered card) | ≥ 640px (centered card) | < 640px (full bleed) |

Tailwind's defaults for comparison: `sm` 640, `md` 768, `lg` 1024, `xl` 1280, `2xl` 1536.

## Motion

What the system defines (in `bundle.css`; the README calls these house defaults, not measured from references):

| Interaction | Value | Tailwind |
| --- | --- | --- |
| Duration | 150ms | `duration-150` |
| Easing | `ease-out` | `ease-out` |
| Properties animated | color, background-color, filter, transform only | `transition-colors`, `transition-transform` |
| Button hover | `filter: brightness(0.94)` | `hover:brightness-[.94]` |
| Button press | `transform: scale(0.98)` | `active:scale-[.98]` |
| Profile link button hover | `transform: scale(1.015)` | `hover:scale-[1.015]` |
| Disabled | `opacity: 0.45`, no hover or press | `disabled:opacity-[.45]` |
| Toggle thumb | slides 14px, 150ms ease-out | `translate-x-[14px]` |
| Accordion chevron | rotates 180° when open, 150ms | `rotate-180` |

**TBD:** `prefers-reduced-motion` behavior, accordion open/close height animation, page and route transitions, toast/snackbar timing, loading skeletons and spinners.

## Not defined (TBD)

- Dark theme and any theme other than Light
- Warning and info colors; translucent colors and overlays (modal scrim)
- Z-index scale
- Breakpoints (see above)
- Responsive type scale
- Reduced-motion rules and any animation beyond the table above
- Logo: Linkbase has none yet — set the name in the display face
