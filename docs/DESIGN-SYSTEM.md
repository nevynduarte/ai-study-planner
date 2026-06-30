# Design System

This document records the chosen design-system combination and layering
strategy for the AI Study Planner React app (Vite + Cloudflare Workers).

---

## Chosen combination

| Layer | System | License | Status |
|---|---|---|---|
| **Foundations / tokens** | [Open Props](https://open-props.style/) | MIT | ✅ Added — `src/tokens.css` |
| **Accessibility primitives** | [Radix UI Primitives](https://www.radix-ui.com/primitives) | MIT | Planned |
| **Component kit** | [shadcn/ui](https://ui.shadcn.com/) (Radix + Tailwind) | MIT | Planned |

The combination follows the "layered design system" pattern:

```
Open Props tokens
  └── Radix Primitives (accessible behaviours, no styles)
        └── shadcn/ui components (copy-in, styled with Tailwind)
```

---

## Layer 1 — Open Props token foundation (`src/tokens.css`)

Imported into `src/main.jsx` so tokens are available globally.

### What Open Props supplies

`open-props/open-props.min.css` defines ~200 CSS custom properties on
`:where(html)` (zero-specificity, so always overridable):

- `--size-px-1..15` — spacing steps (4 px → 480 px)
- `--radius-1..6` — border-radius steps (2 px → 8 rem)
- `--radius-round` — full pill radius (1e5 px)
- `--ease-1..5`, `--ease-in-out-*`, `--ease-spring-*` — easing curves
- `--font-size-00..8` — type-scale steps
- `--font-weight-1..9` — weight steps

### Semantic aliases defined in `tokens.css`

`tokens.css` maps Open Props primitives to app-specific names:

```css
--space-1  → --size-px-1  (4px)
--space-3  → --size-px-3  (16px)
--radius-lg → --radius-3  (1rem / 16px)  ← cards
--radius-full → --radius-round            ← pills, tabs
--ease-out → --ease-2
```

Color tokens (`--color-surface`, `--color-text`, `--color-border`, …) are
defined directly in `tokens.css` with automatic dark-mode overrides via
`@media (prefers-color-scheme: dark)`.  The accent palette
(`--color-green`, `--color-blue`, `--color-purple`, …) is theme-invariant.

### Dark mode — reactive JS hook

`App.jsx` previously read `window.matchMedia(...).matches` once at render
time, which meant the UI stayed in the wrong theme if the user switched
system appearance without a full reload.

It now uses `useSyncExternalStore` to subscribe to the media query change
event, so the component tree re-renders correctly whenever the OS theme
changes:

```js
const darkMQ = window.matchMedia("(prefers-color-scheme: dark)");

function useDarkMode() {
  return useSyncExternalStore(
    notify => { darkMQ.addEventListener("change", notify); ... },
    () => darkMQ.matches,
    () => false,   // server snapshot
  );
}
```

---

## Layer 2 — Radix UI Primitives (next pass)

Replace bespoke disclosure/accordion buttons in the Interviews tab and
checklist items with Radix Primitives (`@radix-ui/react-collapsible`,
`@radix-ui/react-checkbox`). These are headless and accessible by default
(keyboard nav, ARIA attributes, focus management).

---

## Layer 3 — shadcn/ui components (future pass)

Install Tailwind CSS, then copy in shadcn/ui components
(`Button`, `Card`, `Badge`, `Tabs`) to replace the current hand-rolled
inline-style components. The copied components reference the CSS variables
from Layer 1, so the app accent palette and dark mode work automatically.

---

## Accessibility baseline

Each pass should maintain or improve:

- **Keyboard nav** — all interactive elements reachable by Tab; Enter/Space activate buttons
- **Focus rings** — `:focus-visible` outline already set in `index.html`; shadcn/ui components inherit it
- **ARIA** — `role="checkbox"` + `aria-checked` on plan checklist items (existing); Radix adds the rest
- **Color contrast** — accent colors (`--color-green`, `--color-blue`, etc.) verified ≥ 4.5:1 on both surface backgrounds

---

## Files changed in this pass

| File | Change |
|---|---|
| `package.json` | Added `open-props` dependency |
| `src/tokens.css` | New — CSS custom-property token foundation |
| `src/main.jsx` | Import `tokens.css` |
| `src/App.jsx` | Replace one-shot dark-mode read with reactive `useDarkMode` hook |
| `docs/DESIGN-SYSTEM.md` | This file |
