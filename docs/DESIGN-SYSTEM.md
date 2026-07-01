# Design System

This app uses a layered open-source design system:

| Layer | Library | License | What it provides |
|---|---|---|---|
| Behavior / accessibility | **Radix UI Primitives** | MIT | Focus trap, ARIA roles, keyboard navigation for interactive components |
| Foundations / tokens | *(CSS custom properties in-app)* | — | Dark/light color tokens, spacing, typography |
| Visuals | Inline styles (React) | — | Brand colors, surfaces, shadows |

## Radix UI Primitives (behavior layer)

[Radix UI](https://www.radix-ui.com/primitives) provides unstyled, accessible React primitives.
All visual styling is preserved via inline styles — Radix adds only the behavior and ARIA attributes.

### `@radix-ui/react-dialog` — DocReader

`src/components/DocReader.jsx` wraps the full-screen prep-guide reader.

Accessibility gained vs. the previous raw-div implementation:

- `role="dialog"` + `aria-modal="true"` — screen readers announce the dialog and suppress background content
- `aria-labelledby` wired to `Dialog.Title` — the dialog has an accessible name read on open
- **Focus trap** — Tab/Shift-Tab cycle inside the dialog; background content is unreachable
- **Focus restoration** — closing the dialog returns focus to the button that opened it
- Body scroll lock — Radix handles `overflow: hidden` on the document body while open
- ESC to close — handled natively by Radix, no manual `keydown` listener needed
- `aria-hidden` on siblings — background app content is hidden from the accessibility tree

### `@radix-ui/react-accordion` — Prep-area accordion

`src/components/PrepAccordion.jsx` wraps the per-interview prep-area expand/collapse panels.

Accessibility gained vs. the previous hand-rolled button approach:

- `aria-expanded` — each trigger reports its open/closed state to assistive tech
- `aria-controls` / `aria-labelledby` — trigger and content region are linked in the accessibility tree
- `role="region"` — each content panel is a named landmark region when expanded
- Keyboard navigation — Arrow Down/Up moves between accordion items; Enter/Space toggles

## Visual design conventions

The app's visual tokens are defined directly inside `App.jsx` as derived constants from
`window.matchMedia("(prefers-color-scheme: dark")`.  Key values:

| Token | Light | Dark | Usage |
|---|---|---|---|
| `bg` | `#ffffff` | `#0a0b0e` | App base background |
| `surface` | `#ffffff` | `#16181d` | Card surface |
| `surface2` | `#f8fafc` | `#1d2026` | Raised / alternate surface |
| `bgS` | `#f1f3f6` | `#22262d` | Chip / input fill |
| `txt` | `#0f1115` | `#e9ebf0` | Primary text |
| `txtS` | `#49505e` | `#a6aebb` | Secondary text |
| `txtT` | `#8b94a3` | `#6a7280` | Tertiary / muted text |
| `brd` | `rgba(15,17,21,.08)` | `rgba(255,255,255,.08)` | Default border |

## Adding new components

When adding interactive components:

1. **Prefer Radix primitives** for any component with open/close, selection, or focus-management behavior (Dialog, Dropdown, Popover, Tabs, Tooltip…).
2. Apply visual styling via inline style props — the existing `S.*` token objects in `App.jsx` or props passed down from the parent.
3. Pass the current dark-mode flag and color tokens as props (see `PrepAccordion` for the pattern).
