# Design System — AI Study Planner

## Stack

A layered combination of free, open-source systems:

| Layer | Library | License | Purpose |
|-------|---------|---------|---------|
| **Behavior / Primitives** | [Radix UI Primitives](https://www.radix-ui.com/primitives) | MIT | Accessible, unstyled component primitives — WAI-ARIA patterns, keyboard nav, focus management |
| **Styling** | Inline styles + CSS custom properties | — | Full design-token control; no class-name collisions with the Cloudflare Worker bundle |
| **Foundations (planned)** | [Open Props](https://open-props.style/) | MIT | CSS custom-property token scales (color, spacing, type, easing, shadow) |

## Radix Primitives in use

### `@radix-ui/react-tabs` — Main navigation

`src/App.jsx` uses `Tabs.Root / Tabs.List / Tabs.Trigger / Tabs.Content` for the 11-tab
planner navigation.  This gives the tab bar full WAI-ARIA compliance at no visual cost:

- `role="tablist"` on the strip; `role="tab"` + `aria-selected` on each trigger
- `role="tabpanel"` + `aria-labelledby` on every content panel
- Arrow-key navigation (`←` / `→` / `Home` / `End`) between tabs
- Focus management: focus moves to the selected panel when activated by keyboard
- All existing inline styles are preserved — Radix Primitives are **unstyled**

## Guiding decisions

**Why inline styles?**  
The app runs on Cloudflare Workers with a `[assets]` static bundle. Inline styles keep
the component tree self-contained — no extra CSS file to include in the Worker config,
no class-name hashing to coordinate. Radix Primitives complement this perfectly because
they apply ARIA attributes and behaviour without shipping any CSS at all.

**Why not Tailwind here?**  
Tailwind requires a build step that emits a separate CSS file and a PostCSS config.
That's not a blocker, but the existing inline-style system already covers every token
(surface, text, border, shadow, accent colours) in a well-organised `S = { ... }` object.
A future pass can introduce Tailwind and migrate components incrementally without
touching the Radix primitive layer.

**Accessibility baseline (from this PR)**

| Pattern | Implementation |
|---------|----------------|
| Tab navigation | `role="tablist/tab/tabpanel"` via Radix Tabs |
| Keyboard focus ring | `:focus-visible` in `index.html` (`outline: 2px solid #7F77DD`) |
| Dark-mode detection | `window.matchMedia("prefers-color-scheme: dark")` — inline styles react on render |
| Checkbox affordance | `role="checkbox" aria-checked aria-label` on plan-checklist and practice rows |
| Modal/overlay | `DocReader` — Escape key + backdrop click dismiss (future: Radix Dialog) |

## Next steps

1. **Open Props token layer** — replace hardcoded hex values in the `S` object with
   `var(--op-*)` custom properties so the design vocabulary is CSS-native and reusable
   across stylesheets.
2. **`@radix-ui/react-dialog`** — migrate `DocReader` to use `Dialog.Root / Portal /
   Overlay / Content` for a proper focus trap and `aria-modal` semantics.
3. **`@radix-ui/react-accordion`** — migrate the `prep_areas` accordion in the
   Interviews tab to use `Accordion.Root / Item / Trigger / Content` for full
   `aria-expanded` + keyboard support.
