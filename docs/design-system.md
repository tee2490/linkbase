# Linkbase Design System — Foundations

Source of truth: `styles.css` → `tokens/*.css`. Values below are copied from those files. Anything the system does not define is marked **TBD**.

Tailwind naming assumes **Tailwind v4** (`@theme` in `app/globals.css`). Class names are identical in v3 if the same keys go under `theme.extend` in `tailwind.config.ts`.

---

## 1. Colors

### Neutrals

| Token | Hex | Tailwind key | Example classes |
|---|---|---|---|
| `--lb-ink` | `#141414` | `ink` | `bg-ink` `text-ink` `border-ink` |
| `--lb-ink-2` | `#33332f` | `ink-2` | `bg-ink-2` `text-ink-2` |
| `--lb-ink-3` | `#676761` | `ink-3` | `text-ink-3` |
| `--lb-ink-4` | `#9b9b94` | `ink-4` | `text-ink-4` |
| `--lb-paper` | `#ffffff` | `paper` | `bg-paper` |
| `--lb-mist` | `#f4f4f1` | `mist` | `bg-mist` |
| `--lb-cloud` | `#eaeae5` | `cloud` | `bg-cloud` |
| `--lb-line` | `#e4e4df` | `line` | `border-line` |
| `--lb-stage` | `#ededea` | `stage` | `bg-stage` |
| `--lb-backdrop` | `#a3a7a2` | `backdrop` | `bg-backdrop` |
| `--border-strong` | `#cfcfc9` | `line-strong` | `border-line-strong` `bg-line-strong` |

### Brand palette (marketing colour blocks, avatars, accent)

| Token | Hex | Tailwind key | Example classes |
|---|---|---|---|
| `--lb-tangerine` | `#ff5b2e` | `tangerine` | `bg-tangerine` `border-tangerine` |
| `--lb-tangerine-deep` | `#d9431a` | `tangerine-deep` | `hover:bg-tangerine-deep` |
| `--lb-butter` | `#ffe27a` | `butter` | `bg-butter` `text-butter` |
| `--lb-sky` | `#b8dbff` | `sky` | `bg-sky` `text-sky` |
| `--lb-blush` | `#ffc8d5` | `blush` | `bg-blush` `text-blush` |
| `--lb-teal` | `#0f4c45` | `teal` | `bg-teal` |
| `--lb-teal-bright` | `#17a37d` | `teal-bright` | `bg-teal-bright` |
| `--lb-plum` | `#3a1a45` | `plum` | `bg-plum` |
| `--lb-cobalt` | `#1f3fbf` | `cobalt` | `bg-cobalt` `text-cobalt` |

Note: `sky` and `teal` override Tailwind's default `sky-*` / `teal-*` scales by name. Rename (e.g. `lb-sky`) if you need the defaults.

**Headline pairings on colour blocks:** teal → butter, plum → blush, cobalt → sky. On light blocks use ink or cobalt.

### Status

| Token | Hex | Tailwind key | Example classes |
|---|---|---|---|
| `--success` | `#17a37d` | `success` | `text-success` |
| `--danger` | `#d92d20` | `danger` | `text-danger` `ring-danger` |
| `--warning` | `#e8a400` | `warning` | `text-warning` |
| Info | **TBD** | — | — |

### Semantic aliases

Use these in components rather than raw palette keys.

| Token | Resolves to | Hex | Tailwind key | Use |
|---|---|---|---|---|
| `--surface-page` | paper | `#ffffff` | `surface-page` | App background |
| `--surface-card` | paper | `#ffffff` | `surface-card` | Cards, link rows |
| `--surface-chip` | mist | `#f4f4f1` | `surface-chip` | Secondary buttons, inputs, pills |
| `--surface-chip-hover` | cloud | `#eaeae5` | `surface-chip-hover` | Hover on chip surfaces |
| `--surface-profile` | stage | `#ededea` | `surface-profile` | Public page stage |
| `--surface-backdrop` | backdrop | `#a3a7a2` | `surface-backdrop` | Behind profile column |
| `--surface-inverse` | ink | `#141414` | `surface-inverse` | Announcement bar |
| `--text-body` | ink | `#141414` | `fg` | Primary text |
| `--text-secondary` | ink-2 | `#33332f` | `fg-secondary` | Labels |
| `--text-muted` | ink-3 | `#676761` | `fg-muted` | Meta, hints |
| `--text-faint` | ink-4 | `#9b9b94` | `fg-faint` | Inactive tabs, separators (see contrast note in ui.md) |
| `--text-inverse` | — | `#ffffff` | `fg-inverse` | Text on ink |
| `--border-subtle` | line | `#e4e4df` | `border-subtle` | Card hairlines |
| `--border-strong` | — | `#cfcfc9` | `border-strong` | Switch off track |
| `--action-primary-bg` | ink | `#141414` | `action` | Primary button |
| `--action-primary-hover` | ink-2 | `#33332f` | `action-hover` | Primary hover |
| `--action-primary-fg` | — | `#ffffff` | `action-fg` | Primary label |
| `--accent` | tangerine | `#ff5b2e` | `accent` | Accent button, marketing CTA |
| `--accent-hover` | tangerine-deep | `#d9431a` | `accent-hover` | Accent hover |
| `--accent-fg` | ink | `#141414` | `accent-fg` | Text on accent |
| `--state-on` | teal-bright | `#17a37d` | `state-on` | Switch on |

Dark mode: **TBD** (not defined).

```css
/* app/globals.css */
@import "tailwindcss";
@theme {
  --color-ink:#141414;--color-ink-2:#33332f;--color-ink-3:#676761;--color-ink-4:#9b9b94;
  --color-paper:#ffffff;--color-mist:#f4f4f1;--color-cloud:#eaeae5;--color-line:#e4e4df;--color-line-strong:#cfcfc9;
  --color-stage:#ededea;--color-backdrop:#a3a7a2;
  --color-tangerine:#ff5b2e;--color-tangerine-deep:#d9431a;--color-butter:#ffe27a;--color-sky:#b8dbff;--color-blush:#ffc8d5;
  --color-teal:#0f4c45;--color-teal-bright:#17a37d;--color-plum:#3a1a45;--color-cobalt:#1f3fbf;
  --color-success:#17a37d;--color-danger:#d92d20;--color-warning:#e8a400;

  --color-surface-page:var(--color-paper);--color-surface-card:var(--color-paper);
  --color-surface-chip:var(--color-mist);--color-surface-chip-hover:var(--color-cloud);
  --color-surface-profile:var(--color-stage);--color-surface-backdrop:var(--color-backdrop);--color-surface-inverse:var(--color-ink);
  --color-fg:var(--color-ink);--color-fg-secondary:var(--color-ink-2);--color-fg-muted:var(--color-ink-3);--color-fg-faint:var(--color-ink-4);--color-fg-inverse:#ffffff;
  --color-border-subtle:var(--color-line);--color-border-strong:var(--color-line-strong);
  --color-action:var(--color-ink);--color-action-hover:var(--color-ink-2);--color-action-fg:#ffffff;
  --color-accent:var(--color-tangerine);--color-accent-hover:var(--color-tangerine-deep);--color-accent-fg:var(--color-ink);
  --color-state-on:var(--color-teal-bright);
}
```

---

## 2. Typography

### Families

| Token | Stack | Tailwind | Use |
|---|---|---|---|
| `--font-display` | `"Bricolage Grotesque", ui-sans-serif, system-ui, sans-serif` | `font-display` | Marketing headlines, wordmark, avatar initials. Never in app chrome. |
| `--font-body` | `"Geist", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif` | `font-sans` | All UI and body |
| `--font-mono` | `"Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | `font-mono` | Code / URLs if needed |

These are Google Fonts substitutes (no brand font files were supplied). In Next.js load them with `next/font/google` (`Bricolage_Grotesque` weights 500–800, `Geist` 400–700, `Geist_Mono` 400–500) and pass the CSS variables into `@theme`.

### Size scale

| Token | px | Tailwind |
|---|---|---|
| `--fs-11` | 11 | `text-11` |
| `--fs-12` | 12 | `text-12` |
| `--fs-13` | 13 | `text-13` |
| `--fs-14` | 14 | `text-14` |
| `--fs-15` | 15 | `text-15` |
| `--fs-16` | 16 | `text-16` |
| `--fs-18` | 18 | `text-18` |
| `--fs-20` | 20 | `text-20` |
| `--fs-24` | 24 | `text-24` |
| `--fs-28` | 28 | `text-28` |
| `--fs-36` | 36 | `text-36` |
| `--fs-48` | 48 | `text-48` |
| `--fs-64` | 64 | `text-64` |
| `--fs-88` | 88 | `text-88` |

### Weight, line-height, tracking

| Token | Value | Tailwind |
|---|---|---|
| `--fw-regular` | 400 | `font-normal` |
| `--fw-medium` | 500 | `font-medium` |
| `--fw-semibold` | 600 | `font-semibold` |
| `--fw-bold` | 700 | `font-bold` |
| `--fw-black` | 800 | `font-extrabold` |
| `--lh-tight` | 1.02 | `leading-tight` (overrides default 1.25) |
| `--lh-snug` | 1.15 | `leading-snug` (overrides default 1.375) |
| `--lh-normal` | 1.4 | `leading-normal` (overrides default 1.5) |
| `--lh-relaxed` | 1.55 | `leading-relaxed` (overrides default 1.625) |
| `--ls-display` | -0.035em | `tracking-display` |
| `--ls-heading` | -0.02em | `tracking-heading` |
| `--ls-body` | -0.005em | `tracking-body` (set on `body`) |

### Roles

| Role | Weight / size / line-height / family | Tailwind |
|---|---|---|
| Hero | 800 / 88 / 1.02 / display | `font-display font-extrabold text-88 leading-tight tracking-display` |
| H1 | 800 / 48 / 1.02 / display | `font-display font-extrabold text-48 leading-tight tracking-display` |
| H2 | 700 / 36 / 1.15 / display | `font-display font-bold text-36 leading-snug tracking-heading` |
| Title (panel) | 600 / 28 / 1.15 / body | `font-semibold text-28 leading-snug` |
| Name (profile) | 600 / 20 / 1.15 / body | `font-semibold text-20 leading-snug` |
| Link title | 500 / 16 / 1.4 / body | `font-medium text-16 leading-normal` |
| Body | 400 / 16 / 1.55 / body | `text-16 leading-relaxed` |
| Small | 400 / 14 / 1.4 / body | `text-14 leading-normal` |
| Caption | 500 / 12 / 1.4 / body | `font-medium text-12 leading-normal` |

Marketing kits size headlines fluidly: hero `clamp(52px,7vw,96px)`, section H2 `clamp(32px,4vw,52px)`. These are kit values, not tokens.

Wordmark: lowercase `linkbase`, Bricolage Grotesque 800, `-0.04em`. No logo file exists — **TBD**.

```css
@theme {
  --font-display:"Bricolage Grotesque",ui-sans-serif,system-ui,sans-serif;
  --font-sans:"Geist",ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;
  --font-mono:"Geist Mono",ui-monospace,SFMono-Regular,Menlo,monospace;
  --text-11:11px;--text-12:12px;--text-13:13px;--text-14:14px;--text-15:15px;--text-16:16px;--text-18:18px;
  --text-20:20px;--text-24:24px;--text-28:28px;--text-36:36px;--text-48:48px;--text-64:64px;--text-88:88px;
  --leading-tight:1.02;--leading-snug:1.15;--leading-normal:1.4;--leading-relaxed:1.55;
  --tracking-display:-0.035em;--tracking-heading:-0.02em;--tracking-body:-0.005em;
}
```

---

## 3. Spacing

4px base. Every token matches Tailwind's default spacing scale, so no config is needed.

| Token | px | Tailwind step |
|---|---|---|
| `--sp-1` | 4 | `1` (`p-1`, `gap-1`) |
| `--sp-2` | 8 | `2` |
| `--sp-3` | 12 | `3` |
| `--sp-4` | 16 | `4` |
| `--sp-5` | 20 | `5` |
| `--sp-6` | 24 | `6` |
| `--sp-8` | 32 | `8` |
| `--sp-10` | 40 | `10` |
| `--sp-12` | 48 | `12` |
| `--sp-16` | 64 | `16` |
| `--sp-24` | 96 | `24` |

### Sizing tokens

| Token | px | Tailwind |
|---|---|---|
| `--h-control-sm` | 36 | `h-9` |
| `--h-control-md` | 48 | `h-12` |
| `--h-control-lg` | 56 | `h-14` |
| `--w-profile` | 580 | `max-w-profile` |
| `--w-editor` | 640 | `max-w-editor` |
| `--w-content` | 1200 | `max-w-content` |

```css
@theme { --container-profile:580px;--container-editor:640px;--container-content:1200px; }
```

Usage notes: link stack gap 12–14px; panel padding 24–32px; marketing sections 112px vertical (`py-28`).

---

## 4. Radius

| Token | px | Tailwind | Used on |
|---|---|---|---|
| `--r-xs` | 6 | `rounded-xs` | — |
| `--r-sm` | 10 | `rounded-sm` | Link thumbnails |
| `--r-md` | 14 | `rounded-md` | Inputs, square icon buttons |
| `--r-lg` | 18 | `rounded-lg` | Public link buttons, accordion rows |
| `--r-xl` | 24 | `rounded-xl` | Editor link cards |
| `--r-2xl` | 32 | `rounded-2xl` | Large panels, footer card |
| `--r-pill` | 999 | `rounded-full` | Buttons, URL pill, switch |

Kit-only values (not tokenised): dashboard sheet top corners 28px, phone preview 36px, marketing tiles 22–32px. Use arbitrary values (`rounded-[28px]`) or add tokens if they recur.

```css
@theme { --radius-xs:6px;--radius-sm:10px;--radius-md:14px;--radius-lg:18px;--radius-xl:24px;--radius-2xl:32px; }
```

---

## 5. Shadows

| Token | Value | Tailwind | Use |
|---|---|---|---|
| `--shadow-none` | `none` | `shadow-none` | — |
| `--shadow-hairline` | `0 0 0 1px #e4e4df` | `shadow-hairline` | Border without layout shift |
| `--shadow-card` | `0 1px 2px rgba(20,20,20,.04), 0 0 0 1px rgba(20,20,20,.03)` | `shadow-card` | Thumbnails |
| `--shadow-float` | `0 2px 8px rgba(20,20,20,.08), 0 0 0 1px rgba(20,20,20,.04)` | `shadow-float` | Hovered link buttons, controls over imagery |
| `--shadow-panel` | `0 0 0 1px #e4e4df, 0 12px 32px -12px rgba(20,20,20,.10)` | `shadow-panel` | Editor panel |
| `--shadow-pop` | `0 12px 40px -8px rgba(20,20,20,.22)` | `shadow-pop` | Marketing product composites only |

Focus ring: `--focus-ring: 0 0 0 2px #fff, 0 0 0 4px #141414` → `ring-2 ring-ink ring-offset-2 ring-offset-paper`.

```css
@theme {
  --shadow-hairline:0 0 0 1px #e4e4df;
  --shadow-card:0 1px 2px rgba(20,20,20,.04),0 0 0 1px rgba(20,20,20,.03);
  --shadow-float:0 2px 8px rgba(20,20,20,.08),0 0 0 1px rgba(20,20,20,.04);
  --shadow-panel:0 0 0 1px #e4e4df,0 12px 32px -12px rgba(20,20,20,.10);
  --shadow-pop:0 12px 40px -8px rgba(20,20,20,.22);
}
```

---

## 6. Breakpoints

**TBD.** The system defines no breakpoints and no mobile layouts. The reference screens are desktop. Until defined, keep Tailwind defaults (`sm` 640, `md` 768, `lg` 1024, `xl` 1280, `2xl` 1536) and treat any responsive behaviour as a design decision still to be made.

| Item | Status |
|---|---|
| Breakpoint values | TBD |
| Mobile dashboard (rail + preview collapse) | TBD |
| Marketing grid stacking | TBD |
| Public profile on mobile | Column is `max-w-profile` (580px); padding and edge behaviour TBD |

---

## 7. Motion

| Token | Value | Tailwind |
|---|---|---|
| `--ease-out` | `cubic-bezier(.2,.8,.2,1)` | `ease-out` (overrides default) |
| `--ease-spring` | `cubic-bezier(.34,1.56,.64,1)` | `ease-spring` |
| `--dur-fast` | 120ms | `duration-120` |
| `--dur-base` | 200ms | `duration-200` |
| `--dur-slow` | 360ms | `duration-360` |
| `--press-scale` | 0.97 | `active:scale-97` |

Rules:
- Hover colour changes: 120ms ease-out.
- Switch track: 200ms ease-out; knob: 200ms spring.
- Accordion chevron rotate: 200ms ease-out. Panel open/close is instant (no height animation).
- Press: buttons scale 0.97, link buttons 0.985 (`active:scale-[.985]`).
- No page transitions, no parallax, no scroll-linked motion.
- `prefers-reduced-motion` handling: **TBD** (recommend disabling transforms).

```css
@theme { --ease-out:cubic-bezier(.2,.8,.2,1);--ease-spring:cubic-bezier(.34,1.56,.64,1); }
```

---

## 8. Not defined (TBD)

Z-index scale · dark mode · info colour · opacity scale (disabled uses 0.4) · logo / favicon / app icon · icon sizes beyond component defaults · grid column system · print styles.
