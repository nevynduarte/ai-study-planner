# Design System

## Chosen combination

| Layer | Library | License |
|---|---|---|
| **Primitives / tokens** | [Open Props](https://open-props.style/) v1 | MIT |
| **Semantic tokens** | `src/tokens.css` (app-defined, built on Open Props) | — |
| **Components / accessibility** | Radix UI Primitives (planned — next pass) | MIT |
| **Utility styles** | Tailwind CSS (planned — future pass) | MIT |

### Why this stack

Open Props gives us a **coherent vocabulary of design primitives** — a
spatial scale (`--size-*`), typographic scale (`--font-size-*`), radius
scale (`--radius-*`), shadow scale (`--shadow-*`), and a full color
palette — all as plain CSS custom properties with zero runtime cost.  On
top of those, `src/tokens.css` defines **semantic tokens** (`--asp-bg`,
`--asp-text`, `--asp-brand-aaru`, …) that encode meaning rather than
presentation, so switching color schemes or refining the palette is a
one-file change.

## Token file

```
src/tokens.css
```

Loaded in `src/main.jsx` before the app component.  Index.html's base
`<style>` block references the semantic tokens directly (no hardcoded
hex values).

### Layers inside `tokens.css`

1. **`@import "open-props/style"`** — loads ~200 primitive custom
   properties onto `:where(html)`.
2. **Brand tokens** on `:root` — exact identity hex colors for each
   product track, each with a companion `--*-rgb` triplet so
   `rgba(var(--asp-brand-aaru-rgb), 0.12)` works in gradients.
3. **Semantic tokens** on `:root` — surface, text, border, shadow,
   font-family, radius, and spacing aliases that reference either brand
   tokens or Open Props primitives.
4. **Dark-mode overrides** inside
   `@media (prefers-color-scheme: dark)` — semantic surface/text/border
   tokens are redefined here; brand tokens are unchanged (they're
   invariant across themes).

### Semantic token reference

| Token | Light | Dark | Meaning |
|---|---|---|---|
| `--asp-bg` | `#ffffff` | `#0a0b0e` | page background |
| `--asp-surface` | `#ffffff` | `#16181d` | card/modal surface |
| `--asp-surface-2` | `#f8fafc` | `#1d2026` | raised / alt surface |
| `--asp-surface-s` | `#f1f3f6` | `#22262d` | subtle fill (chips, inputs) |
| `--asp-text` | `#0f1115` | `#e9ebf0` | primary text |
| `--asp-text-soft` | `#49505e` | `#a6aebb` | secondary text |
| `--asp-text-t` | `#8b94a3` | `#6a7280` | tertiary / timestamps |
| `--asp-border` | `rgba(15,17,21,.08)` | `rgba(255,255,255,.08)` | default border |
| `--asp-border-s` | `rgba(15,17,21,.14)` | `rgba(255,255,255,.16)` | strong border |
| `--asp-shadow-card` | subtle | stronger | card elevation |
| `--asp-shadow-pop` | medium | strong | popovers / modals |

### Brand token reference

| Token | Value | Use |
|---|---|---|
| `--asp-brand-aaru` + `-rgb` | `#1D9E75` / `29, 158, 117` | Aaru track |
| `--asp-brand-equi` + `-rgb` | `#7F77DD` / `127, 119, 221` | Equi track |
| `--asp-brand-primary` + `-rgb` | `#185FA5` / `24, 95, 165` | default accent |
| `--asp-brand-warning` + `-rgb` | `#BA7517` / `186, 117, 23` | in-progress |
| `--asp-brand-error` + `-rgb` | `#A32D2D` / `163, 45, 45` | urgent / error |
| `--asp-brand-crash` + `-rgb` | `#0D9488` / `13, 148, 136` | crash-course sprint |
| `--asp-brand-success` + `-rgb` | `#3B6D11` / `59, 109, 17` | built / ready |

## Open Props primitives available

After the import these are all on `:where(html)` and usable anywhere:

- **Colors** `--gray-{0–12}`, `--blue-{0–12}`, `--green-{0–12}`,
  `--teal-{0–12}`, `--violet-{0–12}`, `--orange-{0–12}`, `--red-{0–12}`, …
- **Size scale** `--size-{1–15}` (0.25 rem → 30 rem)
- **Font sizes** `--font-size-{00–8}` (0.5 rem → 3.5 rem)
- **Font weights** `--font-weight-{1–9}` (100 → 900)
- **Line heights** `--font-lineheight-{00–5}`
- **Radius** `--radius-{1–6}`, `--radius-round`
- **Shadows** `--shadow-{1–6}`
- **Easings** `--ease-{1–5}`, `--ease-in-*`, `--ease-out-*`, `--ease-elastic-*`
- **Font stacks** `--font-neo-grotesque` (Inter …), `--font-mono`, …

## Roadmap — next passes

1. **Add Radix UI Primitives** — wrap interactive elements (accordion in
   the Interviews tab, combobox for track select, dialog for DocReader)
   with accessible, unstyled Radix primitives so keyboard navigation and
   ARIA are solid without building from scratch.
2. **Migrate inline styles → CSS classes** — move the token-consuming
   style objects in `App.jsx` into a `src/app.css` file, using
   `--asp-*` custom properties. This eliminates the runtime JS token
   computation (`const dark = window.matchMedia(…).matches`).
3. **Add DaisyUI** — once Tailwind is installed, DaisyUI's semantic
   component classes (`.btn`, `.card`, `.badge`) provide a CSS component
   layer that consumes the same `--asp-*` token variables.
