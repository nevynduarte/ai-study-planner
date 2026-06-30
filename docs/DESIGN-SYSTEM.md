# Design System — ai-study-planner

This document tracks the layered design system being adopted across the React app.

## Chosen combination

| Layer | Library | License | Role |
|-------|---------|---------|------|
| **Foundations / tokens** | [Open Props](https://open-props.style/) v1.x | MIT | CSS custom-property scale: radius, shadow, easing, spacing, color palettes |
| **Behaviour / accessibility** | [Radix UI Primitives](https://www.radix-ui.com/) | MIT | Unstyled, accessible interactive components — keyboard nav, ARIA, focus management |
| **Component kit** | _(future)_ shadcn/ui or Mantine | MIT | Copy-in styled components built on Radix + tokens |

## Architecture

```
src/tokens.css
  └── @import "open-props/open-props.min.css"   ← all CSS custom properties
  └── :root { --asp-* }                         ← semantic app tokens referencing Open Props vars
  └── [role="tablist"], [role="tab"]             ← structural CSS for Radix Tabs

src/main.jsx
  └── import './tokens.css'                     ← loaded before App

src/App.jsx
  └── import * as Tabs from "@radix-ui/react-tabs"
  └── <Tabs.Root> <Tabs.List> <Tabs.Trigger>    ← behaviour layer; visual style via inline S.tab()
```

## Token naming convention

App-level semantic tokens are prefixed `--asp-` (ai-study-planner) to avoid
collisions with Open Props' `--shadow-*`, `--radius-*` etc. namespaces.

```css
/* radius */
--asp-radius-pill: var(--radius-round);   /* 1e5px  — tabs, chips */
--asp-radius-card: var(--radius-3);       /* 1rem   — cards */
--asp-radius-btn:  var(--radius-2);       /* 5px    — buttons, inputs */

/* elevation */
--asp-shadow-card: var(--shadow-1);
--asp-shadow-pop:  var(--shadow-4);

/* motion */
--asp-ease:        var(--ease-2);
--asp-duration:    150ms;
--asp-transition:  var(--asp-duration) var(--asp-ease);

/* focus ring (keyboard only) */
--asp-focus-color:  #7F77DD;              /* brand purple */
--asp-focus-offset: var(--size-1);        /* 0.25rem */
```

Color tokens are not yet in CSS (the app resolves dark/light mode in JS via
`window.matchMedia`). Future work is to lift them to CSS custom properties with
`@media (prefers-color-scheme: dark)` so both layers stay in sync.

## Accessibility — tab navigation

Before this change the main navigation was a row of `<button>` elements with no
ARIA semantics. Screen readers announced each button individually; arrow keys
had no effect.

After: Radix `<Tabs.Root>` + `<Tabs.List>` + `<Tabs.Trigger>` produces:

| ARIA attribute | Value | Benefit |
|---------------|-------|---------|
| `role="tablist"` | on the strip container | Screen readers announce the widget as a tab group |
| `role="tab"` | on each trigger | Each button is identified as a tab, not a standalone button |
| `aria-selected="true/false"` | set by Radix | Active tab is announced when focused |
| `aria-orientation="horizontal"` | set by Radix | Arrow keys navigate left/right |

**Keyboard pattern (WAI-ARIA Tabs):**
- `Tab` — enter/exit the tablist
- `ArrowLeft` / `ArrowRight` — move between tabs
- `Home` / `End` — jump to first / last tab

## Roadmap

| Pass | Goal |
|------|------|
| ✅ This PR | Open Props tokens + Radix Tabs.Root/List/Trigger (ARIA + keyboard) |
| Next | Wrap tab content in `<Tabs.Content>` panels (adds `aria-controls` ↔ `aria-labelledby` relationship) |
| Future | Migrate `DocReader` overlay to `@radix-ui/react-dialog` (proper `role="dialog"`, focus trap, Escape closes) |
| Future | Lift colour tokens to CSS custom properties; reduce JS dark-mode branching |
| Future | Adopt shadcn/ui or Mantine for form controls (Log session / Ask tutor inputs) |
