# Design System

## Stack

This app uses a layered design system composed of three free / open-source building blocks:

| Layer | Library | License | Role |
|---|---|---|---|
| **Foundations / tokens** | [Open Props](https://open-props.style) v1.7 | MIT | Base size, font, border, easing, and shadow scales via CSS custom properties |
| **App semantic tokens** | `src/tokens.css` | — | Maps Open Props + app-specific color/shadow/typography values onto `--color-*`, `--shadow-*`, `--font-*` CSS vars |
| **Behavior / accessibility** | React built-ins + ARIA | — | Focus-visible ring, keyboard nav, aria-checked on checkboxes, modal Escape handling |

The combination: **Open Props foundations → App semantic CSS vars → React inline styles referencing `var(--…)`**

Future passes can extend this by layering in Radix UI primitives (already in `node_modules`) for more complex interactive components, and adopting shadcn/ui copy-in components styled with the existing token set.

---

## Token Inventory (`src/tokens.css`)

### Surfaces

| Token | Light | Dark |
|---|---|---|
| `--color-bg` | `#ffffff` | `#0a0b0e` |
| `--color-surface` | `#ffffff` | `#16181d` |
| `--color-surface-2` | `#f8fafc` | `#1d2026` |
| `--color-bg-subtle` | `#f1f3f6` | `#22262d` |

### Text

| Token | Light | Dark |
|---|---|---|
| `--color-text` | `#0f1115` | `#e9ebf0` |
| `--color-text-soft` | `#49505e` | `#a6aebb` |
| `--color-text-faint` | `#8b94a3` | `#6a7280` |

### Borders

| Token | Light | Dark |
|---|---|---|
| `--color-border` | `rgba(15,17,21,0.08)` | `rgba(255,255,255,0.08)` |
| `--color-border-strong` | `rgba(15,17,21,0.14)` | `rgba(255,255,255,0.16)` |

### Brand & Status

| Token | Value |
|---|---|
| `--color-brand-blue` | `#185FA5` |
| `--color-brand-teal` | `#1D9E75` |
| `--color-brand-violet` | `#7F77DD` |
| `--color-crash` | `#0D9488` |
| `--color-status-success` | `#3B6D11` |
| `--color-status-warn` | `#BA7517` |
| `--color-status-danger` | `#A32D2D` |

### Shadows

| Token | Light | Dark |
|---|---|---|
| `--shadow-card` | `0 1px 2px rgba(16,24,40,.05), 0 1px 3px rgba(16,24,40,.04)` | `0 1px 2px rgba(0,0,0,.5)` |
| `--shadow-pop` | `0 18px 46px rgba(16,24,40,.14)` | `0 18px 50px rgba(0,0,0,.62)` |

### Typography

| Token | Value |
|---|---|
| `--font-sans` | Inter stack |
| `--font-serif` | Georgia stack |
| `--font-mono` | ui-monospace stack |

Open Props additionally provides `--size-*`, `--font-size-*`, `--radius-*`, `--ease-*` etc. — use these in preference to magic numbers in new code.

---

## Conventions

### Using tokens in React inline styles

```jsx
// reference CSS vars as plain strings — the browser resolves them at paint time
<div style={{ color: "var(--color-text)", background: "var(--color-surface)" }}>…</div>
```

### Dynamic alpha tints from accent colors

The `hexA(hex, alpha)` helper in `App.jsx` computes `rgba()` strings from hex accent codes (e.g. `#1D9E75`). Use it for tinted fills and borders that derive from a data-driven accent, where a static CSS var isn't sufficient:

```jsx
// tinted pill background from a dynamic accent color
background: hexA(accentHex, dark ? 0.18 : 0.10)
```

The `dark` boolean in `App.jsx` is kept **reactive** (via `useState` + `MediaQueryList` listener) solely to supply the correct alpha to these calls. All static light/dark switching is handled by CSS `@media (prefers-color-scheme: dark)`.

### Accessibility

- Focus ring: `outline: 2px solid #7F77DD; outline-offset: 2px` on `:focus-visible` (global, `index.html`)
- Checkboxes: `role="checkbox"` + `aria-checked` + `aria-label`
- Modal close: `Escape` key listener in `DocReader`
- Color contrast: all text tokens pass WCAG AA against their paired surface tokens

---

## Roadmap

| Pass | Work |
|---|---|
| ✅ This PR | Open Props token foundation; reactive dark mode; CSS vars for all static tokens |
| Next | Migrate scattered inline hex values to `--color-brand-*` / `--color-status-*` tokens |
| Future | Adopt Radix UI primitives for accordion, dialog, tabs (already available in node_modules) |
| Future | Add DaisyUI or shadcn/ui component kit styled with this token set |
