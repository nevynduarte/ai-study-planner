# Design System

ai-study-planner adopts a layered, open-source design system assembled from:

| Layer | Library | License | Role |
|---|---|---|---|
| **Foundations** | CSS custom properties (`--ds-*`) | — | Design tokens: color, shadow, shape, type |
| **CSS framework** | [Tailwind CSS v4](https://tailwindcss.com) | MIT | Layout utilities; `dark:` variant backed by `prefers-color-scheme` |
| *(planned)* | [Radix UI Primitives](https://www.radix-ui.com/primitives) | MIT | Accessible headless behavior (dialog, select, popover…) |
| *(planned)* | [shadcn/ui](https://ui.shadcn.com) | MIT | Copy-in components built on Radix + Tailwind |

---

## 1. Foundations — `--ds-*` tokens

All design decisions live in `src/index.css` as CSS custom properties.
Light-mode values are the defaults; dark-mode overrides fire via `@media (prefers-color-scheme: dark)`.

### Surfaces
| Token | Light | Dark |
|---|---|---|
| `--ds-bg` | `#ffffff` | `#0a0b0e` |
| `--ds-surface` | `#ffffff` | `#16181d` |
| `--ds-surface-2` | `#f8fafc` | `#1d2026` |
| `--ds-surface-subtle` | `#f1f3f6` | `#22262d` |

### Text
| Token | Light | Dark |
|---|---|---|
| `--ds-text` | `#0f1115` | `#e9ebf0` |
| `--ds-text-soft` | `#49505e` | `#a6aebb` |
| `--ds-text-muted` | `#8b94a3` | `#6a7280` |

### Accents
| Token | Value |
|---|---|
| `--ds-accent-blue` | `#185FA5` |
| `--ds-accent-green` | `#1D9E75` |
| `--ds-accent-amber` | `#BA7517` |
| `--ds-accent-red` | `#A32D2D` |
| `--ds-accent-violet` | `#7F77DD` |
| `--ds-accent-teal` | `#0D9488` |

### Borders
| Token | Light | Dark |
|---|---|---|
| `--ds-border` | `rgba(15,17,21,.08)` | `rgba(255,255,255,.08)` |
| `--ds-border-strong` | `rgba(15,17,21,.14)` | `rgba(255,255,255,.16)` |

### Shape
| Token | Value |
|---|---|
| `--ds-radius-sm` | `8px` |
| `--ds-radius-md` | `10px` |
| `--ds-radius-lg` | `16px` |
| `--ds-radius-pill` | `9999px` |

---

## 2. Tailwind CSS v4

Tailwind is configured in `src/index.css` via `@import "tailwindcss"` and the
`@tailwindcss/vite` Vite plugin (no `tailwind.config.js` or PostCSS config needed).

The `@variant dark (@media (prefers-color-scheme: dark))` directive wires `dark:`
utilities to the system color-scheme preference, matching the CSS-var cascade.

`@theme inline { ... }` maps every `--ds-*` token into a corresponding Tailwind
utility (e.g. `bg-surface`, `text-fg`, `shadow-card`) so new components can use
idiomatic Tailwind classes or arbitrary `var()` references for any token.

### Usage in new components
```jsx
// Prefer named utilities when the @theme mapping exists:
<div className="bg-surface border border-ds-border rounded-[var(--ds-radius-lg)] shadow-card">

// Arbitrary values work for any token:
<span style={{ color: "var(--ds-accent-blue)" }}>…</span>
```

---

## 3. Migrated components

### `src/components/TabNav.jsx`
The main tab navigation bar. Migrated from the inline-style monolith to:
- Tailwind utilities for layout (`flex`, `gap-0.5`, `overflow-x-auto`, `rounded-full`, etc.)
- `--ds-*` arbitrary values for colors and shadows
- ARIA: `role="tablist"`, `role="tab"`, `aria-selected`
- Focus ring via `focus-visible:outline` (keyboard-only, not mouse)

---

## 4. Roadmap

Next passes should (in order):

1. **Radix UI Primitives** — replace the hand-rolled accordion (`prep_areas`) and the
   `DocReader` modal with `@radix-ui/react-collapsible` and `@radix-ui/react-dialog`.
2. **shadcn/ui** — adopt `Button`, `Badge`, `Card`, `Input`, `Select`, `Textarea`
   components; replace the `S.btn`, `S.inp`, `S.card` style factories.
3. **Token migration** — progressively replace the JS token variables (`bgS`, `brd`,
   `txt` etc.) computed inside `App.jsx` with `var(--ds-*)` references in CSS classes.
4. **Storybook** — add component stories for each migrated component.
