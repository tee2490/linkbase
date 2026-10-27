# UI reference: components, layouts, accessibility

Every Linkbase component with its variants and states, the page layouts they combine into, and the accessibility rules that go with them. Token names and Tailwind classes are listed in `docs/design-system.md`. The working reference implementation is `components/bundle.js` + `components/bundle.css` (React 18, classes prefixed `lb-`), with typed props in `components/index.d.ts`.

Anything the system does not define is marked **TBD** — agree it with design before building.

## State conventions (all interactive components)

| State | Rule | Tailwind |
| --- | --- | --- |
| Hover | Fills darken: `filter: brightness(0.94)`. Profile link buttons scale to 1.015 instead | `hover:brightness-[.94]` |
| Active / pressed | Buttons scale to 0.98 | `active:scale-[.98]` |
| Focus | 2px solid ring, 2px offset; `focus` (cobalt) on light grounds, `focus-inverse` (white) on dark grounds. Shown on `:focus-visible` only | `focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus` |
| Disabled | 45% opacity, `cursor: not-allowed`, no hover or press | `disabled:opacity-[.45] disabled:cursor-not-allowed` |
| Error | 2px inset `danger` ring plus a 14px `danger` message below | `ring-2 ring-inset ring-danger` |
| Loading | **TBD** for every component | — |
| Transitions | 150ms ease-out on color, filter and transform | `transition duration-150 ease-out` |

"Dark ground" means `cobalt`, `maroon`, `maroon-deep`, `grape`, `navy`, `forest` or an `ink`/`ink-app` fill. The reference implementation switches rings by wrapping such areas in `.lb-on-dark`.

## Components

### Button

Pill call-to-action for marketing sections, plus the compact editor buttons.

**Props:** `variant`, `size`, `shape` (`pill` | `rounded`), `icon`, `iconRight`, `fullWidth`, `href` (renders an `<a>`), native button props.

| Variant | Fill / label | Use on | Default shape |
| --- | --- | --- | --- |
| `ink` | `bg-ink text-ink-inverse` | surface, canvas, sage (Sign up free) | pill |
| `forest` | `bg-forest text-ink-inverse` | lime hero | pill |
| `lime` | `bg-lime text-ink` | cobalt, grape | pill |
| `orchid` | `bg-orchid text-ink` | maroon, sage, canvas | pill |
| `soft` | `bg-surface-soft text-ink` | next to an `ink` pill (Log in) | rounded (8px) |
| `surface` | `bg-surface text-ink` | any colored section; profile footer | pill |
| `app` | `bg-ink-app text-ink-inverse` | editor primary (Add, Continue) | pill |
| `muted` | `bg-surface-muted text-ink-app` | editor secondary (New collection) | pill |
| `outline` | `bg-surface text-ink-app` + 1px `border-strong` | onboarding secondary | rounded (8px) |
| `upgrade` | `bg-ink text-ink-inverse` + 1px `success-bright` ring, icon `success-bright` | dark app banner only | pill |

| Size | Height | Padding x | Type | Use |
| --- | --- | --- | --- | --- |
| `lg` | 60px | 32px | 18/24 · 600 | Marketing |
| `md` | 48px | 24px | 18/24 · 500 | Onboarding |
| `sm` | 44px | 24px | 16/20 · 500 | Editor |
| `xs` | 36px | 16px | 16/20 · 500 | Banner pill |

Icons sit left of the label, 8px apart, 20px at `lg`/`md` and 18px at `sm`/`xs`.

**States:** default · hover (brightness .94) · pressed (scale .98) · focus ring · disabled (45%). Loading **TBD**.

```tsx
<button className="inline-flex h-control-lg items-center justify-center gap-2 rounded-full bg-forest px-8 text-label-lg text-ink-inverse transition duration-150 ease-out hover:brightness-[.94] active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-[.45] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
  Get started for free
</button>
```

Rules: one CTA color per section, the one its tone prescribes; never `lime` on lime or `orchid` on orchid; `soft` and `outline` never stand alone as a section's only action.

### IconButton

A button holding one icon.

| Variant | Look | Use |
| --- | --- | --- |
| `muted` | `bg-surface-muted text-ink-app`, round | Editor panel tools |
| `surface` | `bg-surface text-ink-app`, round | On `profile-canvas` (share) |
| `ink` | `bg-ink text-ink-inverse`, round | Footer social links |
| `ghost` | transparent, `text-ink-app`, round | ⋮ menus in rows and link buttons |
| `outline` | transparent, 1px `ink` ring, 8px corners | Carousel prev/next |

| Size | Box | Icon |
| --- | --- | --- |
| `sm` | 32px | 18px |
| `md` | 40px | 20px |
| `lg` | 48px | 22px |
| `xl` | 64px | 26px |

**States:** default · hover (brightness .94) · focus ring. Pressed and disabled: **TBD** (not styled). `label` is required and becomes `aria-label` and the tooltip.

### UrlPill

Muted pill with the user's short page address and a share button. Editor top bar.

`h-icon-btn rounded-full bg-surface-muted text-label text-ink-app`, link icon left, share button right. **States:** share button focus ring; hover and "copied" feedback **TBD** (the profile mockup shows a "Link copied" chip — not part of the system yet).

### Input

Text field with an optional fixed prefix, built for the username claim (`linkbase/` + handle).

| Variant | Fill | Use |
| --- | --- | --- |
| `surface` | `bg-surface` | On colored sections (hero, closing CTA) |
| `field` | `bg-field` | On white (onboarding) |

| Size | Height | Font |
| --- | --- | --- |
| `lg` | 60px | 18px |
| `md` | 48px | 16px |

Corners `rounded-sm` (8px), padding x 16px. Prefix `text-muted` weight 500; value `text-ink-app` weight 500; placeholder `text-muted`.

| State | Look |
| --- | --- |
| Default | fill only, no border |
| Focus | 2px `focus` ring, 2px offset (`focus-inverse` on dark sections) |
| Error | 2px inset `danger` ring; message `text-body-sm text-danger` 8px below, `role="alert"` |
| Disabled | **TBD** |
| Success / available | Not part of the component. The welcome screen shows a `text-body-sm text-success` line with a check icon below the field |

```tsx
<label className="flex h-control-lg items-center gap-0.5 rounded-sm bg-surface px-4 text-[18px] focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus">
  <span className="sr-only">Choose your username</span>
  <span className="font-medium text-muted">linkbase/</span>
  <input className="min-w-0 flex-1 bg-transparent font-medium text-ink-app outline-none placeholder:text-muted" placeholder="yourname" />
</label>
```

### Toggle

Switch for instant on/off settings in the editor.

Track 36×22px `rounded-full`; thumb 16px `bg-surface`, inset 3px.

| State | Look |
| --- | --- |
| Off | track `bg-muted` |
| On | track `bg-success`, thumb moves 14px right |
| Focus | 2px `focus` ring on the track |
| Hover, disabled | **TBD** |

Native `<input type="checkbox" role="switch">`, visually hidden, so it works with keyboard and screen readers. Give it a visible `label` or an `aria-label`.

### Tabs

Underlined text tabs inside an editor panel (Links / Shop).

`text-[18px] leading-6 font-medium`, 16px gap, 8px bottom padding.

| State | Look |
| --- | --- |
| Selected | `text-ink-app` + 2px `ink-app` underline (`aria-selected="true"`) |
| Unselected | `text-muted-app` |
| Focus | 2px `focus` ring |
| Hover | **TBD** |

Keyboard arrow-key movement between tabs and the matching `tabpanel` wiring are **TBD** (the reference implementation only switches on click).

### NavBar

Floating white pill navigation on the hero.

`bg-surface rounded-full`, min height 90px, padding 14px (left 40px). Wordmark in the display face at 28px; links `text-body-md text-ink`; actions = `soft` "Log in" + `ink` "Sign up free", both `lg`.

**States:** links underline on hover (4px offset); focus rings. Mobile menu (README: collapse links below 1024px): menu design **TBD**.

### Banner

Full-width one-line announcement.

| Variant | Look | Use |
| --- | --- | --- |
| `lime` | `bg-lime-soft text-ink`, min height 64px | Above the marketing nav |
| `app` | `bg-ink-app text-ink-inverse` weight 500, min height 56px, `upgrade` button | Above the editor |

Optional close button (22px `close` icon, right 24px). Remembering a dismissal: **TBD**. Only one banner at a time.

### SideNav

Editor section navigation: round icon buttons with captions.

Circle 48px `bg-surface-muted`; caption `text-caption`; 16px gap.

| State | Look |
| --- | --- |
| Default | `bg-surface-muted text-ink-app` |
| Current | `bg-ink-app text-ink-inverse` + double ring (2px `surface`, 2px `ink-app`), `aria-current="page"` |
| Focus | 2px `focus` ring, 4px offset |
| Hover | **TBD** |

The component is vertical. The dashboard mockup lays it out horizontally on tablet and as a bottom bar on mobile; a horizontal variant isn't in the system yet (**TBD**).

### Section

Full-bleed marketing block; `tone` sets background, headline, body and the CTA to use (table in `docs/design-system.md` → Section tones).

Props: `tone` (`lime` | `cobalt` | `maroon` | `grape` | `sage` | `canvas` | `surface`), `title`, `body`, `actions`, `align` (`start` | `center`), `headingLevel`.

Title: display face 64/60, max 720px wide. Body: `text-body-lg`, max 620px. Actions row 8px gap, 8px above.

Padding: the component uses 96px vertical / 72px horizontal; the README asks for 160px vertical on desktop and 96px on mobile. Which one is the default: **TBD**.

### FeatureCard

Large rounded color tile in a bento grid; media on top, title at the bottom.

Tones: `orchid`, `lime` (text `ink`); `navy`, `cobalt` (text `ink-inverse`); `sage` (text `ink`). `rounded-2xl`, padding 40px, min height 320px, title `text-title-lg` (max 480px). Not interactive — no hover state. Never put a CTA inside.

### StatCard

Analytics tile: optional 40px icon, big figure, label.

| Tone | Fill | Text |
| --- | --- | --- |
| `olive` | `bg-olive` | `text-lime` (3.4:1 — keep figures large) |
| `orchid` | `bg-orchid` | `text-navy` |
| `magenta` | `bg-magenta` | `text-ink-inverse` (4.1:1 — large/bold only) |
| `navy` | `bg-navy` | `text-ink-inverse` |
| `lime` | `bg-lime` | `text-navy` |

`rounded-xl`, padding 24px, min 172×206px. Value 36/40 weight 400; label 16/20 weight 600. Static.

### Accordion

FAQ list on a `maroon` section; one item open at a time.

Item `bg-maroon-deep text-orchid rounded-xl`, 12px gap between items. Question button: padding 48px, 26/32 weight 500, chevron right. Answer: `text-body text-ink-inverse`, max 820px, padding 0 48px 48px.

| State | Look |
| --- | --- |
| Closed | chevron down; answer not rendered |
| Open | chevron rotated 180°; answer shown; `aria-expanded="true"` |
| Focus | 2px `focus-inverse` ring |
| Hover | **TBD** |

Height animation on open/close: **TBD**. The landing mockup reduces padding to 32px (tablet) and 24px with 19px questions (mobile); those sizes aren't system values yet.

### LogoTile

White tile for a partner's logo. 72px tall, min 240px wide, `rounded-xl`, padding x 32px. Use the partner's real logo image; never redraw one. Static.

### Avatar

Circular profile image. Sizes used: 96px (public profile), 64px (editor), 40px (lists). Without an image: `user` icon in `text-muted-app` on `bg-surface-muted`.

The screen mockups use initials on a colored disc (orchid or cobalt) instead of the icon. That variant is **TBD**.

### LinkButton

The full-width button that makes up a public profile — one per link.

`bg-surface text-ink-app rounded-md`, min height 64px, padding 12px 56px, label `text-label-lg` centered, optional ⋮ `ghost` IconButton 12px from the right.

| State | Look |
| --- | --- |
| Default | as above |
| Hover | scale 1.015 |
| Focus | 2px `focus` ring |
| Pressed, visited, disabled | **TBD** |

```tsx
<a href={url} className="relative flex min-h-control-xl w-full items-center justify-center rounded-md bg-surface px-14 py-3 text-center text-label-lg text-ink-app transition-transform duration-150 ease-out hover:scale-[1.015] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
  {title}
</a>
```

The profile mockup adds a 22px line icon 20px from the left edge and a larger "featured" link card with a cobalt banner; neither is a system component yet (**TBD**).

### LinkRow

One link in the editor list: thumbnail, title, "N clicks · domain" meta, trailing control.

`bg-surface rounded-lg` with a 1px inset `border` ring, padding 16px, min height 72px, 12px gap. Thumbnail 40px `rounded-sm` (`bg-surface-muted`, 20px icon when there's no image). Title `text-label text-ink-app`, one line, truncated. Meta `text-body-sm text-muted-app`. Trailing: ⋮ `ghost` IconButton by default, or any node (the dashboard uses a Toggle + ⋮).

**States:** hover, drag-to-reorder, hidden (link switched off) and selected are **TBD**.

### Dialog

Modal for short forms and confirmations (Add a link, Delete this link?). `components/ui/dialog.tsx`, built on the native `<dialog>` opened with `showModal()`.

`bg-surface rounded-lg shadow-phone`, width `min(480px, 100% − 32px)`, padding 32px (24px on phones), title `text-title-sm` as `<h2>`, optional description `text-body-md text-muted-app`. Scrim: `backdrop:bg-scrim`. Actions sit bottom right: Cancel (`muted`, `sm`) then the primary (`app`, `sm`).

- Controlled by `open`; `onClose` runs on Esc, Cancel and a click on the scrim.
- The native element traps focus, closes on Esc and returns focus to the opener. Title and description are wired to `aria-labelledby` / `aria-describedby`.
- Confirmations focus Cancel first, so Enter never deletes by accident.

### Row menu (⋮)

A `ghost` `sm` IconButton labelled "More options for {title}" opens a small menu (`rounded-lg bg-surface p-2 shadow-float`) with Edit and Delete. Keyboard: ↓ on the trigger opens it, ↑/↓/Home/End move, Esc closes and returns focus to the trigger, Tab or a click outside closes it. Same pattern as the account menu.

### Panel

White editor surface for one section of the page editor.

`bg-surface rounded-lg shadow-card`, padding 40px, title `text-title-sm` with optional header actions (IconButtons, 8px gap). Width `max-w-panel` (624px).

### Icon

24px line icons, 1.75px stroke, round caps and joins, `currentColor`.

Names: `plus` `more` `share` `close` `chevron-down` `arrow-left` `arrow-right` `folder-plus` `bolt` `sparkle` `link` `layers` `user` `palette` `sliders` `globe` `image` `external` `archive` `list` `dollar` `headphones`.

Sizes: 18–20px in buttons, 20px in nav, 40px in stat tiles. In Next.js use `lucide-react` with `strokeWidth={1.75}` for these and anything missing. Social-platform logos: use each platform's official asset (not included).

## Layout patterns

### Marketing page

- Full-bleed sections in this order: `lime` (hero) → `cobalt` → `maroon` → `sage` → `canvas` → `maroon` (FAQ) → `grape` (closing CTA + footer). Never two neighbours with the same tone.
- Content column `max-w-container` (1296px) inside a 72px gutter (`px-18`).
- Two columns at desktop: copy on one side, media on the other, alternating sides.
- Bento grids: two columns, 16px gap. Stat tiles: uneven grid, 16px gap.

```tsx
<section className="bg-cobalt text-ink-inverse">
  <div className="mx-auto grid max-w-container grid-cols-2 items-center gap-16 px-18 py-40">
    <div className="flex flex-col gap-6">
      <h2 className="font-display text-display-lg [font-stretch:112%] text-lime">…</h2>
      <p className="max-w-[620px] text-body-lg">…</p>
    </div>
    <div>{/* media */}</div>
  </div>
</section>
```

### Onboarding (welcome / pick handle)

Two halves at desktop: the form on `surface` (max 480px, vertically centered) and a cobalt panel with a live profile preview. The welcome mockup stacks them on tablet and mobile: the form becomes a card over the cobalt ground, and the preview follows it.

### Editor (dashboard)

Three columns at desktop: SideNav rail (88px) · Panel (max 680px, centered) · live phone preview (380px column, phone frame 320px, `sticky top-6`). The rail and preview stay put while the panel scrolls.

```tsx
<div className="mx-auto grid max-w-[1360px] grid-cols-[88px_minmax(0,1fr)_380px] items-start gap-8 px-6 pb-10">
  <nav className="sticky top-6 pt-6">{/* SideNav */}</nav>
  <main className="w-full max-w-[680px] justify-self-center">{/* Panel */}</main>
  <aside className="sticky top-6 flex flex-col items-center gap-4">{/* phone preview */}</aside>
</div>
```

Phone preview frame: 10px `ink-app` bezel, 44px outer radius, `shadow-phone`; screen `bg-profile-canvas`, 34px radius. These frame dimensions come from the dashboard mockup, not from tokens.

The dashboard mockup keeps the phone preview at every size: beside the panel on tablet (SideNav becomes a top row), below the panel on mobile (SideNav becomes a sticky bottom bar). Breakpoints are **TBD** at the system level — see `docs/design-system.md` → Breakpoints.

### Public profile

A centered card, `max-w-profile` (580px), `bg-profile-canvas rounded-xl shadow-phone`, on `bg-backdrop`. Avatar 96px, name `text-title-sm`, bio `text-body-sm text-muted-app`, LinkButtons stacked 14px apart, footer "Join … on Linkbase" (`surface` button). On phones the card goes edge to edge: no backdrop, no radius, no shadow.

## Accessibility

### Contrast

Text pairs that pass WCAG AA (4.5:1) and can be used at any size:

| Text on background | Ratio |
| --- | --- |
| `forest` on `lime` | 6.9:1 |
| `ink` on `lime` | 11.4:1 |
| `ink-inverse` on `cobalt` | 5.4:1 |
| `ink-inverse` on `maroon` | 11.6:1 |
| `orchid` on `maroon` | 7.3:1 |
| `orchid` on `maroon-deep` | 9.4:1 |
| `orchid` on `grape` | 7.2:1 |
| `ink` on `orchid` | 9.9:1 |
| `navy` on `orchid` | 8.7:1 |
| `ink` on `sage` | 13.2:1 |
| `ink` on `canvas` | 14.1:1 |
| `muted` on `surface` / `canvas` / `field` | 5.5 / 4.9 / 5.1:1 |
| `muted-app` on `surface` | 7.0:1 |
| `cobalt` on `canvas` | 4.8:1 |
| `success` on `surface` | 6.5:1 |
| `danger` on `surface` | 6.5:1 |

Large text only (24px+, or bold 19px+), never body copy:

| Pair | Ratio |
| --- | --- |
| `lime` on `cobalt` | 3.9:1 |
| `ink-inverse` on `magenta` | 4.1:1 |
| `lime` on `olive` | 3.4:1 |

Never text: `ink-inverse` on `orange` (2.8:1), anything on `backdrop`.

Below the 3:1 non-text floor: `border` (1.19:1) and `border-strong` (1.31:1) on `surface`. They are decorative; the fill or label must identify the control on its own.

### Focus and keyboard

- Every interactive element shows the 2px ring on `:focus-visible`; pick `focus` or `focus-inverse` by the ground it sits on.
- Use real elements: `<button>` for actions, `<a href>` for navigation, `<input>` with a `<label>`. No click handlers on `div`s.
- Menus and dialogs: see Row menu and Dialog above. Tabs arrow-key navigation and accordion keyboard shortcuts: **TBD**.

### Touch targets

Aim for at least 44×44px. Components that fall short and need a larger hit area on touch devices: IconButton `sm` (32px), IconButton `md` (40px), `xs` buttons (36px), Toggle track (36×22px — include its label in the hit area). Size of the enlarged hit area: **TBD**.

### Semantics

| Component | Requirement |
| --- | --- |
| IconButton | `aria-label` (the `label` prop) is required |
| Input | A label, visible or `sr-only`; `aria-invalid="true"` on error; error text `role="alert"` |
| Toggle | Native checkbox with `role="switch"`; visible label or `aria-label` |
| Tabs | `role="tablist"` / `role="tab"` with `aria-selected`; `tabpanel` + `aria-controls` **TBD** |
| Accordion | Question is a `<button>` with `aria-expanded` and `aria-controls` |
| SideNav | `<nav>` with a label; current item `aria-current="page"` |
| Banner | `role="region"` with `aria-label="Announcement"` |
| Avatar | Decorative initials: `aria-hidden`; a real photo: `alt` with the person's name |
| Icons | Decorative: `aria-hidden="true"`; standalone meaning: `role="img"` + `aria-label` |
| Status messages ("available", "Link copied") | `role="status"` |

### Color and motion

- Don't use color as the only signal: the Toggle also moves its thumb, errors also show text, availability also shows a check icon.
- `prefers-reduced-motion` handling: **TBD**. Until it's defined, disable the scale effects (button press, link hover) under reduced motion.
