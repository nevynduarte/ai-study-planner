# Design System

## Chosen combination

| Layer | Library | License | Purpose |
|-------|---------|---------|---------|
| **Foundations / tokens** | [Open Props](https://open-props.style) | MIT | Spacing scale, border radii, shadow scale, type scale, font-stack tokens |
| **Behavior / primitives** | _(planned: Radix UI Primitives)_ | MIT | Accessible interactive primitives (Dialog, Tooltip, Select …) |
| **Component kit** | _(planned: shadcn/ui)_ | MIT | Copy-in components built on Radix + Tailwind |

The repo currently ships **Layer 1 only** (Open Props tokens). Layers 2–3 will be added incrementally.

---

## Layer 1 — Open Props token foundation (`src/tokens.css`)

Open Props provides structural CSS custom properties (spacing, radii, shadows, type scales). The app never uses Open Props tokens directly in components; instead, they are aliased to a semantic `--asp-*` vocabulary (`asp` = _ai-study-planner_) that captures the app's meaning, not just the value.

### Importing

Vite processes the `@import` rules in `src/tokens.css`, which is loaded in `src/main.jsx`:

```js
import './tokens.css'
```

All `--asp-*` tokens are defined on `:root` and are therefore available globally.

### Token map

#### Accent hues (fixed; same in light and dark)

| Token | Value | Semantic use |
|-------|-------|-------------|
| `--asp-color-green` | `#1D9E75` | AI track, success, today plan |
| `--asp-color-blue` | `#185FA5` | "built" coverage, plan focus |
| `--asp-color-purple` | `#7F77DD` | Equi accent, selection ring |
| `--asp-color-amber` | `#BA7517` | "learning" state, warnings |
| `--asp-color-red` | `#A32D2D` | Urgent, errors |
| `--asp-color-teal` | `#0D9488` | Crash-course sprint |

#### Surface palette (switches on `prefers-color-scheme: dark`)

| Token | Light | Dark |
|-------|-------|------|
| `--asp-bg` | `#f7f8fa` | `#0a0b0e` |
| `--asp-surface` | `#ffffff` | `#16181d` |
| `--asp-surface-2` | `#f8fafc` | `#1d2026` |
| `--asp-bg-sub` | `#f1f3f6` | `#22262d` |
| `--asp-txt` | `#0f1115` | `#e9ebf0` |
| `--asp-txt-s` | `#49505e` | `#a6aebb` |
| `--asp-txt-t` | `#8b94a3` | `#6a7280` |
| `--asp-brd` | `rgba(15,17,21,.08)` | `rgba(255,255,255,.08)` |
| `--asp-brd-s` | `rgba(15,17,21,.14)` | `rgba(255,255,255,.16)` |

#### Structural tokens (sourced from Open Props)

| Token | Open Props source | Approx. value | Use |
|-------|-----------------|---------------|-----|
| `--asp-radius-xs` | `--radius-1` | 2 px | Tiny dots |
| `--asp-radius-sm` | — | 5 px | Code chips |
| `--asp-radius-md` | — | 8 px | Buttons, inputs |
| `--asp-radius-lg` | — | 12 px | Section containers |
| `--asp-radius-xl` | — | 16 px | Cards |
| `--asp-radius-pill` | `--radius-round` | 1e5 px | Pills, tab strip |
| `--asp-shadow-card` | `--shadow-2` | layered | Card elevation |
| `--asp-shadow-pop` | `--shadow-5` | layered | Modals, popovers |
| `--asp-space-1` | `--size-px-1` | 4 px | |
| `--asp-space-2` | `--size-px-2` | 8 px | |
| `--asp-space-3` | `--size-px-3` | 16 px | |
| `--asp-space-4` | `--size-px-4` | 20 px | |
| `--asp-space-5` | `--size-px-5` | 24 px | |
| `--asp-font` | `--font-neo-grotesque` fallback | Inter stack | Body font |
| `--asp-font-mono` | `--font-monospace-code` | Monospace stack | Code |
| `--asp-fw-normal` | `--font-weight-4` | 400 | |
| `--asp-fw-medium` | `--font-weight-5` | 500 | |
| `--asp-fw-semi` | `--font-weight-6` | 600 | |
| `--asp-fw-bold` | `--font-weight-7` | 700 | |
| `--asp-fw-black` | `--font-weight-8` | 800 | |
| `--asp-lh-tight` | `--font-lineheight-1` | 1.25 | |
| `--asp-lh-normal` | `--font-lineheight-3` | 1.5 | |
| `--asp-lh-loose` | `--font-lineheight-4` | 1.75 | |

---

## Accessibility baseline

- **Focus ring**: `index.html` global styles apply a 2 px `--asp-color-purple` outline on `:focus-visible` and suppress it on mouse click via `:not(:focus-visible)`.
- **Color contrast**: accent hues above are chosen to meet WCAG AA against both surface palettes.
- **Dark mode**: handled automatically via `@media (prefers-color-scheme: dark)` in `src/tokens.css` — no JavaScript toggle needed.

---

## Roadmap (next passes)

1. **Radix UI Primitives** — swap the bespoke accordion and checklist into accessible `Collapsible` and `Checkbox` primitives.
2. **shadcn/ui** — adopt `Card`, `Button`, `Input`, `Select`, `Badge` components (copy-in, styled to `--asp-*` tokens via Tailwind CSS variables).
3. Migrate one full tab (Today or Coverage) to the component kit as a proof-of-concept, then extend to the rest.
