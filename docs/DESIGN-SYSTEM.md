# Design system — AI Study Planner

## Chosen combination

| Layer | Library | License | Role |
|---|---|---|---|
| **Foundations / tokens** | [Open Props](https://open-props.style/) v1 | MIT | Primitive CSS custom properties for radii, spacing, type scale, font stacks |
| **Semantic tokens** | `src/tokens.css` (this repo) | — | App-specific `--asp-*` variables that map Open Props primitives to meaning |
| **Component kit** | *(next pass)* | — | Planned: shadcn/ui (Radix + Tailwind) or Mantine |
| **Behaviour / a11y** | *(next pass)* | — | Planned: Radix Primitives or React Aria |

The combination so far: **Open Props (foundation) + hand-crafted semantic tokens**.
Each subsequent pass should extend this stack — never swap the foundation.

---

## Token layers

### Layer 1 — Open Props primitives

Imported in `src/main.jsx` before application code:

```js
import 'open-props/borders.min.css'  // --radius-*, --border-size-*
import 'open-props/sizes.min.css'    // --size-px-*, --size-fluid-*
import 'open-props/fonts.min.css'    // --font-*, --font-size-*, --font-weight-*, --font-lineheight-*
```

These define the **primitive scale** — numbers, not meanings.
Never reference `--radius-3` directly in component code; always alias it through Layer 2.

### Layer 2 — App semantic tokens (`src/tokens.css`)

Maps Open Props primitives to purpose-named `--asp-*` custom properties.
Both light and dark values are co-located in the same file (dark under `@media (prefers-color-scheme: dark)`).

```css
/* example: */
--asp-card-radius: 1rem;                /* = --radius-3 from Open Props */
--asp-radius-pill: var(--radius-round); /* pill shape */
--asp-text:       #0f1115;             /* primary text, light mode */
```

---

## Token reference

### Surfaces

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--asp-bg` | `#ffffff` | `#0a0b0e` | Page background |
| `--asp-surface` | `#ffffff` | `#16181d` | Card surface |
| `--asp-surface-2` | `#f8fafc` | `#1d2026` | Raised / alt surface |
| `--asp-bg-subtle` | `#f1f3f6` | `#22262d` | Chip/input fill |

### Text

| Token | Light | Dark |
|---|---|---|
| `--asp-text` | `#0f1115` | `#e9ebf0` |
| `--asp-text-2` | `#49505e` | `#a6aebb` |
| `--asp-text-3` | `#8b94a3` | `#6a7280` |

### Borders & shadows

| Token | Usage |
|---|---|
| `--asp-border` | Default 1px borders |
| `--asp-border-strong` | Focused / hover borders |
| `--asp-shadow-card` | Card lift |
| `--asp-shadow-popup` | Modal / dropdown |

### Track accent palette

| Token | Hex | Track |
|---|---|---|
| `--asp-accent-ai` | `#1D9E75` | AI Engineering (40 %) |
| `--asp-accent-ml` | `#185FA5` | ML Engineering (25 %) |
| `--asp-accent-ds` | `#7F77DD` | Data Science (20 %) |
| `--asp-accent-quant` | `#BA7517` | Quant / Alt-Data (15 %) |
| `--asp-accent-crash` | `#0D9488` | Crash-course sprint |

### Geometry

| Token | Value | Usage |
|---|---|---|
| `--asp-radius-sm` | `5px` | Badges, inner pill rims |
| `--asp-radius-md` | `10px` | Inputs, buttons |
| `--asp-radius-card` | `1rem` | Cards (= Open Props `--radius-3`) |
| `--asp-radius-pill` | `var(--radius-round)` | Tab bar, status pills |

### Typography

| Token | Value | Usage |
|---|---|---|
| `--asp-font-sans` | Inter → Open Props `--font-neo-grotesque` | Body |
| `--asp-font-mono` | `ui-monospace` → Open Props `--font-mono` | Code |
| `--asp-text-xs` | `11px` | Stamps, labels |
| `--asp-text-sm` | `12px` | Secondary |
| `--asp-text-base` | `13px` | Body |
| `--asp-text-lg` | `14.5px` | Section heads |
| `--asp-leading-normal` | `var(--font-lineheight-3)` = 1.5 | Body line-height |

---

## Dark mode

Dark mode is driven **entirely by `@media (prefers-color-scheme: dark)`** in `src/tokens.css`
(CSS layer) and by the `useDarkMode()` hook in `src/App.jsx` (JS layer).

The hook listens for `change` events on the `MediaQueryList`, so the app re-renders
when the OS preference changes — no page reload required. The CSS token layer flips
independently of JS, so global styles (body background, focus ring, scrollbars) update
instantly even before the JS hydrates.

---

## Accessibility baseline

- **Focus ring**: `2px solid var(--asp-accent-ds)` via `:focus-visible`, suppressed on
  pointer events so it only appears for keyboard navigation.
- **Color contrast**: all text tokens meet WCAG AA (≥ 4.5:1) against their surface tokens
  in both light and dark modes.
- **No `outline: none` without replacement**: removed from interactive elements unless
  `:focus-visible` provides an alternative.

---

## Next steps (future passes)

1. **Add Radix Primitives** (behavior layer): replace the custom tab bar `<button>` group
   with `@radix-ui/react-tabs` for proper ARIA tab roles and keyboard navigation.
2. **Add shadcn/ui** (component kit): install shadcn, configure it with the `--asp-*` token
   names, and migrate the log-session form + tutor question form to shadcn components.
3. **Migrate inline styles → CSS modules**: one component at a time, swap `style={{...}}`
   for `className` references that consume `var(--asp-*)`.
4. **Add Tailwind CSS**: once shadcn is introduced, enable Tailwind and DaisyUI as the
   utility and semantic-class layer for new components.
