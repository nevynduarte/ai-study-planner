# AI Study Planner — Design System

## Chosen stack

This repo uses a **layered, open-source design system** composed of three complementary tiers:

| Tier | Library / Methodology | License | Status |
|------|----------------------|---------|--------|
| 1 · **Tokens** | [Open Props](https://open-props.style) methodology — CSS custom properties | MIT | ✅ `src/tokens.css` |
| 2 · **Behavior / Primitives** | [Radix UI Primitives](https://radix-ui.com/primitives) or [React Aria](https://react-spectrum.adobe.com/react-aria/) | MIT / Apache-2.0 | Planned |
| 3 · **Components** | [shadcn/ui](https://ui.shadcn.com) (copy-in Radix + Tailwind) | MIT | Planned |

The combination reads as: **Open Props tokens → Radix Primitives → shadcn/ui components**.

---

## Layer 1 — Design tokens (`src/tokens.css`)

All CSS custom properties are prefixed `--asp-` to avoid collision with any future library.

### Colour

Tokens follow a semantic naming scheme (role, not hue):

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--asp-color-bg` | `#ffffff` | `#0a0b0e` | App canvas |
| `--asp-color-surface` | `#ffffff` | `#16181d` | Card / panel face |
| `--asp-color-surface-2` | `#f8fafc` | `#1d2026` | Raised / alternate surface |
| `--asp-color-surface-sub` | `#f1f3f6` | `#22262d` | Chips, input backgrounds |
| `--asp-color-text` | `#0f1115` | `#e9ebf0` | Primary text |
| `--asp-color-text-2` | `#49505e` | `#a6aebb` | Secondary text |
| `--asp-color-text-3` | `#8b94a3` | `#6a7280` | Tertiary / timestamps |
| `--asp-color-border` | `rgba(15,17,21,.08)` | `rgba(255,255,255,.08)` | Default border |
| `--asp-color-border-2` | `rgba(15,17,21,.14)` | `rgba(255,255,255,.16)` | Focused / stronger border |
| `--asp-color-link` | `#1f5fc4` | `#9DBEFF` | Link / anchor |

Brand accent tokens are **theme-stable** (same in light and dark):

| Token | Value | Used for |
|-------|-------|----------|
| `--asp-teal` | `#1D9E75` | Primary / success / logged |
| `--asp-blue` | `#185FA5` | Info / primary action |
| `--asp-violet` | `#7F77DD` | AI features / secondary |
| `--asp-amber` | `#BA7517` | Warning |
| `--asp-red` | `#A32D2D` | Error / critical / deadline |
| `--asp-cyan` | `#0D9488` | Crash course |
| `--asp-purple` | `#A35BBA` | Evaluation track |

### Spacing

4 px base grid: `--asp-space-1` (4 px) → `--asp-space-12` (48 px).

### Border radius

`--asp-radius-sm` (6 px) · `--asp-radius-md` (10 px) · `--asp-radius-lg` (14 px) · `--asp-radius-xl` (16 px) · `--asp-radius-pill` (9999 px).

### Typography

- `--asp-font-sans` — Inter + system-ui stack
- `--asp-font-mono` — ui-monospace + Menlo
- `--asp-font-serif` — Georgia (used in DocReader)

---

## Dark-mode strategy

Dark mode is handled in two complementary ways:

1. **CSS layer** — `@media (prefers-color-scheme: dark)` overrides in `tokens.css` and `index.html` drive body background, text colour, and the CSS custom properties. This is instant and requires no JavaScript.

2. **React layer** — `App.jsx` still computes some colour values (those needing JS alpha arithmetic via `hexA()`) from a `dark` boolean state. This state was previously a non-reactive `window.matchMedia().matches` call (frozen on first render). It is now a `useState` + `useEffect` pair that subscribes to `MediaQueryList.change` events, so **OS theme switches update the app immediately** without a reload.

---

## Accessibility baseline

- `index.html` enforces `focus-visible` keyboard rings (no outline on mouse click).
- All interactive elements use native `<button>` and `<a>` — no `div` click handlers.
- ARIA attributes (`role="checkbox"`, `aria-checked`, `aria-label`) on custom checkboxes.

Next steps for accessibility:
- Migrate the tab bar to use `role="tablist"` / `role="tab"` / `aria-selected` (Radix Tabs primitive).
- Replace the accordion open/close in the Interviews tab with Radix Collapsible for proper `aria-expanded`.
- Add skip-to-content landmark.

---

## Next steps

In order, subsequent PRs should:

1. **Install Tailwind CSS** and wire it to the token variables (`tailwind.config.js` → `extend.colors` referencing `var(--asp-*)`) so component classes pick up the same palette.
2. **Adopt Radix Primitives** for the three most-interactive pieces: tabs, accordion, and the DocReader modal (currently a hand-rolled `position:fixed` div with no `aria-modal`).
3. **Copy in shadcn/ui components** (Button, Badge, Input, Select, Textarea, Progress) to replace the hand-built `S.btn`, `S.inp`, and pill helpers in `App.jsx`.
4. **Migrate inline styles to Tailwind classes**, using the token-mapped config. The `S` style-object pattern can be replaced one component at a time.
