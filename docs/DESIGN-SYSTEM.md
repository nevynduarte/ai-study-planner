# Design System

## Stack combination

| Layer | Tool | License |
|---|---|---|
| **Foundation / tokens** | [Open Props](https://open-props.style/) | MIT |
| **Semantic token layer** | `src/tokens.css` (custom `sp-*` props) | — |
| **Components** | Inline React style objects in `src/App.jsx` | — |
| **Dark mode** | CSS `@media (prefers-color-scheme: dark)` + reactive `useDarkMode()` hook | — |

The UI is currently built with inline React styles that reference CSS custom
properties. Future passes should progressively migrate to a component library
(e.g. shadcn/ui or Mantine) while keeping the token layer as the palette source.

---

## Token architecture

### Layer 1 — Open Props (imported in `src/tokens.css`)

We import three Open Props subsets. These add no runtime JS.

```css
@import "open-props/borders";  /* --radius-1 … --radius-round */
@import "open-props/sizes";    /* --size-000 … --size-15      */
@import "open-props/fonts";    /* --font-weight-1 … -9, --font-size-* */
```

Open Props tokens are used **via the semantic layer**, never referenced directly
in component code. This keeps Open Props upgradeable without touching JSX.

### Layer 2 — Semantic tokens (`src/tokens.css`)

All app-level tokens are in the `--sp-*` namespace and live in `src/tokens.css`.

#### Color tokens

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--sp-bg` | `#ffffff` | `#0a0b0e` | Page canvas |
| `--sp-surface` | `#ffffff` | `#16181d` | Card surfaces |
| `--sp-surface2` | `#f8fafc` | `#1d2026` | Raised / alt surfaces |
| `--sp-bg-s` | `#f1f3f6` | `#22262d` | Subtle fill (code, chips) |
| `--sp-txt` | `#0f1115` | `#e9ebf0` | Primary text |
| `--sp-txt-s` | `#49505e` | `#a6aebb` | Secondary text |
| `--sp-txt-t` | `#8b94a3` | `#6a7280` | Tertiary / muted |
| `--sp-brd` | `rgba(15,17,21,.08)` | `rgba(255,255,255,.08)` | Default stroke |
| `--sp-brd-s` | `rgba(15,17,21,.14)` | `rgba(255,255,255,.16)` | Strong stroke |

#### Elevation tokens

| Token | Light | Dark |
|---|---|---|
| `--sp-shadow-card` | subtle 2-layer shadow | flattened dark shadow |
| `--sp-shadow-pop` | 18px soft lift | deeper dark lift |

#### Radius tokens (backed by Open Props)

| Token | Value | Open Props backing | Usage |
|---|---|---|---|
| `--sp-radius-card` | `var(--radius-3, 1rem)` | `--radius-3` = 1rem / 16px | Cards |
| `--sp-radius-inner` | `var(--radius-2, 0.5rem)` | `--radius-2` = 0.5rem / 8px | Inner elements, inputs |
| `--sp-radius-chip` | `var(--radius-round, 9999px)` | `--radius-round` = 1e5px | Pill badges, tabs |

#### Font-weight tokens (backed by Open Props)

| Token | Value | Open Props backing |
|---|---|---|
| `--sp-fw-normal` | `var(--font-weight-4, 400)` | — |
| `--sp-fw-medium` | `var(--font-weight-5, 500)` | — |
| `--sp-fw-semibold` | `var(--font-weight-6, 600)` | — |
| `--sp-fw-bold` | `var(--font-weight-7, 700)` | — |
| `--sp-fw-heavy` | `var(--font-weight-8, 800)` | — |

#### Accent palette

| Token | Hex | Role |
|---|---|---|
| `--sp-teal` | `#1D9E75` | Today / plan / success |
| `--sp-blue` | `#185FA5` | Primary / tutor / coverage |
| `--sp-purple` | `#7F77DD` | Frontier / research |
| `--sp-amber` | `#BA7517` | Warning / interview prep |
| `--sp-red` | `#A32D2D` | Critical / interview day |

### Layer 3 — React inline styles

Components in `src/App.jsx` reference tokens as CSS var strings:

```js
const surface = 'var(--sp-surface)';
const brd     = 'var(--sp-brd)';
// Usage:
<div style={{ background: surface, border: `1px solid ${brd}` }} />
```

Open Props radius tokens are used directly in component style objects:

```js
// S.card — card container
borderRadius: 'var(--sp-radius-card, 1rem)'
// S.tab / pill / trackBadge — pill shapes
borderRadius: 'var(--sp-radius-chip, 9999px)'
```

---

## Dark-mode strategy

Dark mode is handled at two levels:

1. **CSS** (`src/tokens.css`) — `@media (prefers-color-scheme: dark)` overrides all
   `--sp-*` color/shadow tokens. The browser applies these instantly, sub-frame.

2. **React** (`useDarkMode` hook in `src/App.jsx`) — subscribes to the OS
   preference `change` event so accent-color alpha values computed via `hexA()`
   also update without a page reload.

```js
// Reactive dark-mode detection (replaces the old one-shot window.matchMedia call)
function useDarkMode() {
  const [dark, setDark] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => setDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return dark;
}
```

---

## Roadmap for future passes

- **Migrate spacing** — replace hardcoded `padding: "9px 12px"` etc. with
  `--size-*` Open Props tokens (e.g. `--size-2` = 0.5rem / 8px).
- **Migrate font sizes** — align heading / body / caption sizes to
  `--font-size-*` Open Props tokens.
- **Adopt a component kit** — shadcn/ui (Radix + Tailwind) is the natural next
  step: add Tailwind, then migrate one tab at a time from inline styles to
  shadcn components while keeping `--sp-*` as the palette source.
- **Add Storybook** — document isolated components once the kit migration starts.
