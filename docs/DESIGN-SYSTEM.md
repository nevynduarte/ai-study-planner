# Design System

## Layer architecture

The UI is built in three coherent layers, all free / open-source:

| Layer | Tool | Role |
|-------|------|------|
| **Foundations** | [Open Props](https://open-props.style) (MIT, v1.x) | Primitive tokens: spacing scale (`--size-*`), radius scale (`--radius-*`), border sizes (`--border-size-*`) |
| **Semantic tokens** | CSS custom properties — `src/tokens.css` | Maps primitives and plain values to roles: surface, text, border, shadow, link — with automatic light/dark via `prefers-color-scheme` |
| **Components** | React inline styles reading `var(--asp-*)` | `src/App.jsx` holds all component markup; styles are written as JS objects referencing CSS vars |

## Token reference (`src/tokens.css`)

Semantic tokens are defined in `:root` (light defaults) with a `@media (prefers-color-scheme: dark)` override block.

### Surfaces

| Token | Light | Dark |
|-------|-------|------|
| `--asp-bg` | `#ffffff` | `#0a0b0e` |
| `--asp-surface` | `#ffffff` | `#16181d` |
| `--asp-surface2` | `#f8fafc` | `#1d2026` |
| `--asp-bg-subtle` | `#f1f3f6` | `#22262d` |

### Text

| Token | Light | Dark |
|-------|-------|------|
| `--asp-text` | `#0f1115` | `#e9ebf0` |
| `--asp-text-soft` | `#49505e` | `#a6aebb` |
| `--asp-text-tertiary` | `#8b94a3` | `#6a7280` |

### Borders & elevation

| Token | Light | Dark |
|-------|-------|------|
| `--asp-border` | `rgba(15,17,21,0.08)` | `rgba(255,255,255,0.08)` |
| `--asp-border-strong` | `rgba(15,17,21,0.14)` | `rgba(255,255,255,0.16)` |
| `--asp-shadow-card` | layered subtle shadow | `0 1px 2px rgba(0,0,0,0.5)` |
| `--asp-shadow-pop` | `0 18px 46px rgba(16,24,40,0.14)` | `0 18px 50px rgba(0,0,0,0.62)` |
| `--asp-link` | `#1f5fc4` | `#9dbeff` |

### Radius aliases (built on Open Props)

| Token | Value | Use |
|-------|-------|-----|
| `--asp-radius-sm` | `var(--radius-2)` = 5px | Inputs, small chips |
| `--asp-radius-card` | `var(--radius-3)` = 1rem | Cards |
| `--asp-radius-pill` | `var(--radius-round)` = 1e5px | Badge pills |

Other Open Props tokens available everywhere (no import required once `tokens.css` is loaded): `--size-1` … `--size-15`, `--border-size-1` … `--border-size-5`.

## Dark mode

Dark mode is resolved in two places:

- **CSS** (`src/tokens.css`): `@media (prefers-color-scheme: dark)` overrides all `--asp-*` tokens. This covers inline styles that read `var(--asp-*)` — the browser resolves them with the current system theme.
- **React** (`useDark()` hook in `src/App.jsx`): subscribes to `MediaQueryList.addEventListener("change")` so the component tree re-renders when the OS theme changes. The `dark` boolean is kept for `hexA()` alpha tints (which need a numeric value, not a CSS var) and for `linkC` (which must be a plain hex string for alpha tinting).

Prior to this design system, dark mode used `window.matchMedia(...).matches` — a one-time read that never updated if the user switched their OS theme mid-session. The `useDark()` hook fixes this.

## How to use tokens in new code

In React inline-style objects, reference `var(--asp-*)` directly:

```jsx
// ✓ reads from the token layer
<div style={{ background: "var(--asp-surface)", color: "var(--asp-text)" }}>…</div>

// ✓ template literals work too
<div style={{ border: `1px solid var(--asp-border)` }}>…</div>
```

For accent colors and alpha tints, use the `hexA(hexColor, alpha)` helper (already in `App.jsx`) with a literal hex value. Do **not** pass `var(--asp-*)` to `hexA` — it expects a hex string.

## Next steps

Suggested follow-on passes to build on this foundation:

1. **Behaviour layer** — adopt Radix UI Primitives or React Aria for the tab bar, disclosure (accordion), and checkbox components to get keyboard navigation and ARIA semantics for free.
2. **Component kit** — migrate interactive widgets to shadcn/ui (Radix + Tailwind) or DaisyUI (Tailwind semantic classes), themed with the `--asp-*` tokens.
3. **Type scale** — import `open-props/font-size.min.css` and map `--font-size-*` to explicit type-size tokens (`--asp-text-xs`, `--asp-text-sm`, etc.) to replace the scattered `fontSize:12`/`13`/`14.5` magic numbers.
