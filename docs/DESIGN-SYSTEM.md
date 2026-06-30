# Design System

This document tracks the layered design-system combination adopted for the AI Study Planner UI. Each PR extends one layer; future passes should build on — not replace — what is already here.

## Chosen combination

| Layer | Package | License | Role |
|-------|---------|---------|------|
| **Foundation / tokens** | [Open Props](https://open-props.style) `^1.7` | MIT | CSS custom-property design tokens: spacing, border radii, easing curves, font weights |
| **Behavior / accessibility** | [Radix UI Primitives](https://radix-ui.com) `^1.1` | MIT | Unstyled, fully accessible interactive components |
| **Styling** | Semantic CSS variables (in `src/index.css`) | — | App-specific tokens that reference Open Props values |

## What has been adopted so far

### Pass 1 — Foundation tokens + Accessible tab navigation (this PR)

**Files changed:**
- `package.json` — added `open-props`, `@radix-ui/react-tabs`
- `src/index.css` *(new)* — imports three Open Props bundles; defines semantic color/shadow/tab tokens
- `src/main.jsx` — imports `./index.css`
- `src/App.jsx` — replaced the plain `<button>` tab bar with `@radix-ui/react-tabs`

**What improved:**
- The tab bar now has full WAI-ARIA Tabs pattern: `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`, `aria-controls`, `aria-labelledby`.
- Keyboard navigation: **Arrow Left/Right** moves between tabs, **Home/End** jump to first/last, **Tab** moves focus into the active panel.
- Focus rings: keyboard-only via `:focus-visible` (no ring on mouse click).
- Color tokens are now CSS custom properties, responsive to `prefers-color-scheme: dark` without any JS media query.

## Token reference

### Open Props tokens in use

```css
--radius-round   /* 1e5px — pill shapes */
--ease-2         /* cubic-bezier(.25,0,.4,1) — tab hover/select transition */
--font-weight-5  /* 500 — inactive tab weight */
--font-weight-6  /* 600 — active tab weight */
```

### Semantic tokens (defined in `src/index.css`)

```css
/* Brand accents */
--color-green   --color-purple   --color-blue
--color-amber   --color-red      --color-teal

/* Surface stack (light + dark via prefers-color-scheme) */
--color-surface   --color-surface-alt   --color-fill
--color-text      --color-text-soft     --color-text-dim
--color-border    --color-border-soft

/* Elevation */
--shadow-card    --shadow-pop

/* Tab component */
--tab-radius     --tab-font-size   --tab-pad-v   --tab-pad-h
--tab-transition --tab-gap
```

## What to do next (future passes)

1. **Extend token coverage** — replace the inline JS color/shadow objects in `App.jsx` (`surface`, `txt`, `brd`, etc.) with `var(--color-surface)` etc. so the whole app uses the same token layer.
2. **Migrate form controls** — the log-session inputs, selects, and textareas can be upgraded with `@radix-ui/react-label` and accessible form primitives.
3. **Add Tailwind CSS or DaisyUI** — introduce a utility CSS layer to complement Open Props tokens and reduce inline style objects.
4. **Accessible dialogs** — the `DocReader` full-screen overlay should be rebuilt with `@radix-ui/react-dialog` for proper `role="dialog"`, focus trap, and Escape handling.
5. **Accessible accordion** — the prep-area toggles in the Interviews tab are a natural fit for `@radix-ui/react-collapsible`.
