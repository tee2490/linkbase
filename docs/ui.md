# Linkbase UI — Components, Layout, Accessibility

The reference implementation is in `components/**` (React, inline styles over CSS variables). Rebuild each one as a Tailwind component. Token names refer to `design-system.md`. Anything the system doesn't define is **TBD**.

Icons: **Lucide** (`lucide-react`, matching pinned 0.460.0), stroke 1.75 by default, round caps/joins. Use no emoji, and no unicode characters as icons except the `·` separator.

---

## Components

### Button
Pill action button.

| Prop | Type | Default |
|---|---|---|
| `variant` | `primary` \| `secondary` \| `outline` \| `accent` \| `inverse` \| `ghost` | `primary` |
| `size` | `sm` \| `md` \| `lg` | `md` |
| `icon` / `iconRight` | Lucide name | — |
| `fullWidth` | boolean | false |
| `disabled` | boolean | false |
| `type` | button type | `button` |

| Variant | Background | Hover | Text | Border |
|---|---|---|---|---|
| primary | `bg-action` | `bg-action-hover` | `text-action-fg` | none |
| secondary | `bg-surface-chip` | `bg-surface-chip-hover` | `text-fg` | none |
| outline | `bg-surface-card` | `bg-surface-chip` | `text-fg` | `border border-subtle` |
| accent | `bg-accent` | `bg-accent-hover` | `text-accent-fg` | none |
| inverse | `bg-white` | `bg-cloud` | `text-fg` | none |
| ghost | transparent | `bg-surface-chip` | `text-fg` | none |

| Size | Height | Padding-x | Font | Icon |
|---|---|---|---|---|
| sm | 36 | 16 | 14 | 16 |
| md | 48 | 22 | 16 | 18 |
| lg | 56 | 28 | 17 | 20 |

Shared: `rounded-full`, `font-semibold`, `leading-none`, tracking `-0.01em`, `gap-2`, `whitespace-nowrap`, 1px border (transparent unless outline). Icon stroke 2.

States: hover (see table), pressed `scale-97`, disabled `opacity-40 cursor-not-allowed` with no hover or press, focus-visible **TBD in source**, so use `--focus-ring`.

```tsx
<button className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-transparent bg-action px-[22px] text-16 font-semibold leading-none tracking-[-0.01em] text-action-fg transition duration-120 ease-out hover:bg-action-hover active:scale-97 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2">
  <Plus size={18} strokeWidth={2} /> Add
</button>
```

### IconButton
Icon-only button.

| Prop | Type | Default |
|---|---|---|
| `icon` | Lucide name | required |
| `variant` | `soft` \| `float` \| `plain` \| `dark` | `soft` |
| `size` | px | 40 |
| `shape` | `circle` \| `square` (`rounded-md`) | `circle` |
| `label` | string (aria-label + title) | — |

| Variant | Bg | Hover | Fg | Shadow |
|---|---|---|---|---|
| soft | surface-chip | surface-chip-hover | fg | none |
| float | surface-card | mist | fg | `shadow-float` |
| plain | transparent | surface-chip | fg | none |
| dark | ink | ink-2 | white | none |

The glyph is `round(size × 0.45)` px. States: hover only. Pressed, disabled and focus are **TBD**.

### Icon
A wrapper around Lucide. Props: `name`, `size` (20), `strokeWidth` (1.75), `color` (`currentColor`). It is always `aria-hidden`. In Next.js, import from `lucide-react` directly instead of runtime loading.

### Input
Filled text field with an optional static prefix (e.g. `linkbase.me/`).

| Prop | Notes |
|---|---|
| `label` | 14px / 500 / `text-fg-secondary`, 6px above the field |
| `prefix` | 16px / 400 / `text-fg-muted`, 4px gap |
| `hint` | 13px / 1.4 / `text-fg-muted` |
| `error` | Replaces the hint, `text-danger`, and turns the ring red |

Field: `h-[52px] px-[18px] rounded-md bg-surface-chip`, value 16px / 500. No border.

| State | Treatment |
|---|---|
| default | no ring |
| focus | `ring-2 ring-ink` (box-shadow, 120ms) |
| error | `ring-2 ring-danger` |
| disabled | **TBD** |

### Switch
A 44×26 toggle with 3px padding and a 20px white knob (`shadow 0 1px 2px rgba(0,0,0,.2)`).

| State | Treatment |
|---|---|
| off | track `bg-border-strong` |
| on | track `bg-state-on`, knob `translate-x-[18px]` |
| disabled | `opacity-40 cursor-not-allowed` |
| focus | **TBD** |

The track transition is 200ms ease-out and the knob uses 200ms spring. It supports controlled (`checked`) and uncontrolled (`defaultChecked`) use.

### LinkCard (editor)
An editor row for one link.

- Container: `flex items-center gap-4 rounded-xl border border-subtle bg-surface-card py-4 pr-4 pl-5`
- Thumb: 48×48 `rounded-sm bg-surface-chip shadow-card`. Shows an image (cover) or a 22px Lucide icon in `text-fg-muted`.
- Title: 16 / 500 / 1.25, single line, ellipsis.
- Meta: `"{clicks} clicks · {domain}"`, 14 / 400, `text-fg-muted`, with the `·` in `text-fg-faint`.
- Trailing: an optional Switch (shown only when `enabled` is passed) and a 32px kebab (`ellipsis-vertical`, 18px, `text-fg-secondary`).

States: hover, drag and selected are **TBD**.

### UrlPill
Shows the user's URL with a trailing action.

| Prop | Default |
|---|---|
| `url` | required |
| `icon` | `link-2` (null hides it) |
| `action` | `share` (null hides it) |
| `variant` | `soft` (chip) \| `white` (white + `shadow-float`, for use over imagery) |

Pill: `h-11 rounded-full pl-4 pr-3.5 gap-2.5`, 16 / 500. Icons are 18px. Soft hover → `bg-surface-chip-hover`. The trailing action is a separate click target.

### LinkButton (public profile)
A full-width link on the public page.

| Variant | Treatment |
|---|---|
| fill (default) | `bg-surface-card`, no border |
| outline | transparent, `border-[1.5px] border-ink` |

Shared: `min-h-14 rounded-lg px-[52px] py-2`, centred title 16 / 500 / 1.3 with `text-balance`. The optional thumb is 40×40 `rounded-sm`, absolutely positioned 8px from the left. The kebab is 32px and 10px from the right, `text-fg-muted`, at opacity .7 (1 on hover).

| State | Treatment |
|---|---|
| hover | `-translate-y-px`, fill variant gains `shadow-float` |
| pressed | `scale-[.985]` |
| focus | **TBD** |

### Avatar
A circular photo with an initials fallback.

- `size` defaults to 96. Initials: up to 2, display font 700 at `round(size × .38)`, ink text.
- Fallback background: picked from `butter`, `sky`, `blush`, `tangerine` by `charCode(name[0]) % 4`.
- With a photo: `bg-cloud` behind an `object-cover` image, with `alt={name}`.

### Tabs
Text tabs.

- `flex gap-7`, each tab `pt-1 pb-2.5`, 18 / 500 / 1.2.
- Active: `text-fg` plus a 2px ink underline (`shadow-[inset_0_-2px_0_#141414]`). Inactive: `text-fg-faint`.
- Colour transition 120ms. Hover state is **TBD**.

### RailItem
Left-rail navigation item. 72px wide, a 44px circular chip, and a 12 / 500 label 6px below.

| State | Chip | Label |
|---|---|---|
| default | surface-chip, fg | fg-muted |
| hover | surface-chip-hover | fg-muted |
| active | ink, white icon, ring `0 0 0 2px #fff, 0 0 0 4px #141414` | fg |

### AnnouncementBar
A full-width ink strip.

- `min-h-12 px-12 py-2 bg-surface-inverse text-white`, 15 / 500 / 1.3, centred, `gap-3.5`.
- CTA: `h-8 rounded-full border-[1.5px] border-tangerine pl-2.5 pr-3.5`, 14 / 600. The leading icon (default `zap`, 15px) is filled tangerine.
- Dismiss: an `x` 18px, absolutely positioned 12px from the right. It renders only when `onClose` is provided.

### Accordion
FAQ list with one row open at a time. Rows are spaced `gap-3`.

| Tone | Row |
|---|---|
| dark (default) | `bg-white/8 text-white`, no border; used on colour blocks |
| light | `bg-surface-card border border-subtle text-fg` |

Row: `rounded-lg`. Trigger `px-6 py-5`, 17 / 600 / 1.35, with a 20px chevron that rotates 180° in 200ms. Answer `px-6 pb-[22px]`, 16 / 400 / 1.55, opacity .85. The `defaultOpen` index defaults to -1 (none open).

---

## Layout patterns

Values come from `ui_kits/`. Responsive behaviour is **TBD** throughout (see breakpoints in `design-system.md`).

### App: dashboard
```
┌ AnnouncementBar (optional) ──────────────────────────────┐
├ white sheet, top corners 28px when the bar is shown ─────┤
│ Rail │ header: grid [1fr auto 1fr]  back · UrlPill · …   │ Phone   │
│ 72px │ Tabs                                              │ preview │
│      │ Avatar 64 + name/bio                              │ r=36px  │
│      │ grid-cols-2 gap-3: [Add] [New collection]         │         │
│      │ LinkCard stack, gap 14px                          │         │
└──────┴───────────────────────────────────────────────────┴─────────┘
```
- Sheet padding: `pt-5 px-6 pb-10`.
- Editor column: `max-w-editor` (640px), centred.
- The "Shop" tab content is not defined (**TBD**).

### App: public profile
- Full-viewport `bg-surface-backdrop`. A centred column `max-w-profile` (580px) sits on `bg-surface-profile`.
- Order: Avatar, Name (20/600), bio, then the LinkButton stack (gap 12–14px).
- Share uses an `IconButton variant="float"` or `UrlPill variant="white"`.
- A bottom protection gradient (transparent → 90% ink) sits behind the sign-up nudge ("Join {username} on Linkbase today").

### App: welcome / onboarding
- `grid grid-cols-2 min-h-screen`.
- Left: `px-12 py-10`, wordmark, heading, then an Input with the `linkbase.me/` prefix and a primary Continue button.
- Right: a live profile preview.

### Marketing
- Floating white pill header over the hero.
- Sections are full-bleed colour blocks, each with `px-6 py-28` (hero `pt-[72px] pb-24`). The inner container is `max-w-content mx-auto`.
- Hero grid: `grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-12`. Feature grid: `grid-cols-2 gap-16`, with alternating sides.
- Image tiles: rounded 22–32px, with slight rotations (±3–5°) on collaged UI cards.
- Proof row: `grid-cols-4 gap-4`.
- Footer: a white card `rounded-2xl px-12 pt-12 pb-9` with `grid-cols-4 gap-6` link columns.
- Imagery is currently flat colour placeholders. The photo direction is warm, saturated creator photography (assets **TBD**).

---

## Accessibility notes

### Contrast (WCAG 2.x, measured on `#ffffff`)

| Pair | Ratio | Result |
|---|---|---|
| ink `#141414` on white | ~18:1 | Pass |
| ink-3 `#676761` (muted) on white | ~5.7:1 | Pass AA |
| ink-4 `#9b9b94` (faint) on white | ~2.8:1 | **Fail** for text. Inactive tabs use it, so use ink-3 for any text a user must read. |
| ink on tangerine `#ff5b2e` | ~5.9:1 | Pass AA |
| danger `#d92d20` on white | ~4.8:1 | Pass AA |
| switch on `#17a37d` vs white knob | ~3.2:1 | Pass (non-text 3:1) |
| switch off `#cfcfc9` vs white page | ~1.6:1 | **Fail** non-text 3:1. Add a border or darken the track (value TBD). |

### Gaps in the reference components (fix in the Next.js build)
- **Focus states:** only Input has a visible focus ring. Add `focus-visible` rings (`--focus-ring`) to Button, IconButton, Switch, Tabs, RailItem, LinkButton, Accordion triggers and UrlPill.
- **UrlPill** is a clickable `<span>`. Make it a `<button>` (or a `<a>` for opening the page), and give the trailing action its own `<button aria-label="Share">`.
- **LinkButton** nests its kebab inside the `<a>`. Render the kebab as a sibling `<button aria-label="More options for {title}">` outside the link.
- **LinkCard** kebab: aria-label is just "More", so include the link title. The Switch label "Visible" should also include the title.
- **Accordion:** add `aria-expanded` and `aria-controls` to the trigger, and `id` / `role="region"` to the panel.
- **Tabs:** add arrow-key navigation, `aria-controls`, and roving `tabIndex`, plus `role="tabpanel"` on the content.
- **RailItem:** use `aria-current="page"` on the active item. Wrap the rail in `<nav aria-label="Main">`.
- **IconButton:** `label` must be required in the TS types.
- **Avatar:** with no `name`, alt is empty. Use `alt=""` explicitly when the avatar is decorative.
- **AnnouncementBar:** the dismiss button has `aria-label="Dismiss"` (keep it). Persistence of the dismissal is **TBD**.
- **Motion:** respect `prefers-reduced-motion` (drop translate/scale and the spring). The exact rule is **TBD**.
- **Hit targets:** the 32px kebabs and 36px `sm` buttons are under 44px. Mobile sizing is **TBD**.
