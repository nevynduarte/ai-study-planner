# Design System

This document tracks the chosen design-system combination for the AI Study Planner web app
and the incremental adoption plan.

## Chosen combination

| Layer | Library | License | Status |
|-------|---------|---------|--------|
| **Foundations / tokens** | [Open Props](https://open-props.style) `^1.7` | MIT | Adopted — `src/tokens.css` |
| **Behaviour / primitives** | Radix UI Primitives | MIT | Planned — next pass |
| **Component kit** | shadcn/ui (Radix + Tailwind) | MIT | Planned — future passes |

### Why this combination

The app is React 18 + Vite with no existing CSS framework — all styling is currently
inline JS objects. Building up the stack in layers makes each PR reviewable and
keeps CI green:

1. **Open Props first** — CSS custom properties give us a single, reactive token source
   for colours, shadows, spacing, and easing. Light/dark mode happens in CSS
   (`prefers-color-scheme`) with no JS involvement for global tokens.
2. **Radix Primitives next** — unstyled accessible components (Dialog, Tabs, Checkbox,
   Select) to replace the hand-rolled ARIA widgets in App.jsx one at a time.
3. **shadcn/ui later** — copy-in pre-styled Radix + Tailwind components once the Tailwind
   setup and Radix primitives are in place; the token layer is already compatible.

---

## `src/tokens.css` — semantic token reference

Tokens are consumed as CSS custom properties (`var(--color-surface)` etc.) in global
styles, and as the single-source-of-truth for the equivalent JS constants in `App.jsx`.

### Colour tokens

| Token | Light | Dark | Meaning |
|-------|-------|------|---------|
| `--color-bg` | `#ffffff` | `#0a0b0e` | App base / highest contrast |
| `--color-surface` | `#ffffff` | `#16181d` | Card surface |
| `--color-surface2` | `#f8fafc` | `#1d2026` | Raised / alternative surface |
| `--color-bg-subtle` | `#f1f3f6` | `#22262d` | Chips, input fills |
| `--color-txt` | `#0f1115` | `#e9ebf0` | Primary text |
| `--color-txt-s` | `#49505e` | `#a6aebb` | Secondary text |
| `--color-txt-t` | `#8b94a3` | `#6a7280` | Tertiary / meta text |
| `--color-brd` | `rgba(15,17,21,.08)` | `rgba(255,255,255,.08)` | Subtle border |
| `--color-brd-s` | `rgba(15,17,21,.14)` | `rgba(255,255,255,.16)` | Strong border |

### Brand / track colours

| Token | Value | Track |
|-------|-------|-------|
| `--color-ai` | `#1d9e75` | AI Engineering |
| `--color-ml` | `#185fa5` | ML Engineering |
| `--color-ds` | `#7f77dd` | Data Science |
| `--color-quant` | `#ba7517` | Quant / Alt-Data |

### Shadows

Shadows delegate to Open Props (`var(--shadow-1)` / `var(--shadow-6)`) in light mode
and override with darker tones in dark mode via the `@media` block.

| Token | Use |
|-------|-----|
| `--shadow-card` | Card elevation |
| `--shadow-pop` | Popover / modal elevation |

---

## Dark mode architecture

Dark mode is handled at **two layers**:

1. **CSS layer** (`src/tokens.css`): `@media (prefers-color-scheme: dark)` overrides
   all `--color-*` and body background tokens. No JS needed for backgrounds and
   global typography.

2. **JS layer** (`src/App.jsx` → `useDarkMode()`): A reactive hook that mirrors the
   same media query via `addEventListener("change", …)`. Consumed by inline-style
   logic that needs a boolean (e.g. alpha blending helpers `hexA()`). Replaces the
   former one-shot `window.matchMedia(...).matches` snapshot which required a page
   reload to pick up OS-level changes.

---

## Next steps

- [ ] Install Tailwind CSS and configure `tailwind.config.js` to extend with the token
      values above (so `bg-[var(--color-surface)]` or `text-color-txt` work).
- [ ] Install `@radix-ui/react-tabs` and replace the hand-rolled tab bar in `App.jsx`.
- [ ] Install `@radix-ui/react-checkbox` and replace inline checkbox buttons in the
      plan checklist and practice bank.
- [ ] Install `@radix-ui/react-dialog` and upgrade `DocReader` to use a proper Dialog.
- [ ] Start shadcn/ui component migration once Radix + Tailwind are in place.
