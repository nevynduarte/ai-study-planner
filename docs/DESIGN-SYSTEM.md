# Design System

This document describes the chosen design system stack for the ai-study-planner UI and guides future incremental improvements.

## Chosen combination

| Layer | Library | License | Role |
|-------|---------|---------|------|
| **Foundations / tokens** | [Open Props](https://open-props.style) v1 | MIT | CSS custom-property primitives: color scales, spacing, typography, shadows, easings, motion |
| **Accessibility / behavior** | [Radix UI Primitives](https://www.radix-ui.com/primitives) | MIT | *(next pass)* Keyboard navigation, ARIA, focus management for interactive components |
| **Component kit** | [shadcn/ui](https://ui.shadcn.com) (Radix + Tailwind) | MIT | *(future)* Copy-in component primitives, styled with Tailwind and the token layer below |

## Layer 1 — Open Props token foundation (`src/tokens.css`)

`src/tokens.css` imports the full Open Props bundle (`open-props/open-props.min.css`) and maps its raw primitives onto **app-semantic `--asp-*` tokens**. Components and base styles consume `--asp-*`; they never reference Open Props tokens directly. This keeps the semantics stable even if the underlying primitive library changes.

### Token namespaces

| Prefix | What it controls |
|--------|-----------------|
| `--asp-bg`, `--asp-surface`, `--asp-surface-2`, `--asp-surface-subtle` | Surface stack (page → card → raised → subtle fill) |
| `--asp-text-primary/secondary/tertiary` | Text hierarchy |
| `--asp-border`, `--asp-border-strong` | Border opacity levels |
| `--asp-green/purple/blue/amber/teal/red` | Brand accent palette (stable across light/dark) |
| `--asp-shadow-card`, `--asp-shadow-pop` | Box shadows (card vs. modal/popover) |
| `--asp-radius-xs/sm/md/lg/xl/pill` | Border radius scale |
| `--asp-space-1` … `--asp-space-8` | 8-pt spacing grid (backed by `--size-px-*`) |
| `--asp-font-sans/mono/serif` | Font stacks (backed by `--font-neo-grotesque`, `--font-mono`, `--font-antique`) |
| `--asp-weight-normal` … `--asp-weight-extrabold` | Font weights (backed by `--font-weight-*`) |
| `--asp-text-xs/sm/base/md/lg/xl/2xl` | Text size scale |
| `--asp-ease/ease-in/ease-out/ease-spring` | Easing curves (backed by `--ease-*`) |
| `--asp-duration-fast/normal/slow` | Transition durations |

### Dark mode

All surface, text, border, and shadow tokens flip inside a `@media (prefers-color-scheme: dark)` block in `tokens.css`. Brand accent colors stay the same in both modes — they're used as tint/border-only in the UI, so they read at accessible contrast at both lighter and darker opacities.

Open Props automatically strengthens its `--shadow-*` tokens in dark mode (via `--shadow-color` and `--shadow-strength` overrides in its own stylesheet). The `--asp-shadow-*` tokens override these with the app's hand-tuned values for dark mode.

## Current usage in `index.html`

The base stylesheet in `index.html` now uses:

- `color: var(--asp-text-primary, #0f1115)` — body text color
- `background: ... var(--asp-bg, #f7f8fa)` — page background base layer (gradients keep hardcoded rgba; the base color switches)
- `:focus-visible { outline-color: var(--asp-purple, #7f77dd) }` — keyboard focus ring

The hardcoded pixel fallbacks ensure correct first-paint before the CSS bundle loads.

## What `App.jsx` still does

`App.jsx` currently defines its own JS design token constants (`bg`, `surface`, `txt`, etc.) for use in inline styles. These mirror the CSS token values. Future passes will progressively migrate inline styles to reference `--asp-*` CSS variables, shrinking the JS surface and unifying tokens in one place.

## Roadmap

### Pass 2 — Radix UI Primitives (accessibility)
Install `@radix-ui/react-*` primitives. Start with the most interactive components:
- `@radix-ui/react-dialog` — full-screen document reader (currently plain `div`)
- `@radix-ui/react-tabs` — tab navigation (currently plain `button` array)
- `@radix-ui/react-checkbox` — plan checklist + practice tracker
- `@radix-ui/react-collapsible` — interview prep accordion

Each Radix primitive manages ARIA roles, keyboard navigation, and focus trapping. Style them using `--asp-*` tokens and Tailwind utility classes (CSS Modules alternative).

### Pass 3 — shadcn/ui component migration
Add Tailwind CSS and shadcn/ui. Migrate one screen (e.g. Today tab) to shadcn components, themed with the existing `--asp-*` tokens, proving the full stack integrates correctly before going broader.

### Pass 4 — Token consumption in App.jsx
Replace inline JS color/spacing constants in `App.jsx` with CSS variable references. Components become easier to theme and test.

## Color contrast

Brand accent colors achieve ≥ 4.5:1 contrast ratio against their respective light/dark surface backgrounds at the opacity levels used in pill chips and border tints. The solid `background: accent; color: #fff` usage (track badges, primary buttons) passes WCAG AA.
