# Design System

This project uses a layered design system built from free, open-source libraries.
Each layer is independent and can be extended without touching the others.

## Layers

```
┌─────────────────────────────────────────┐
│  COMPONENT LAYER (future)               │
│  shadcn/ui — Radix Primitives + Tailwind│
│  or Mantine / DaisyUI                  │
├─────────────────────────────────────────┤
│  BEHAVIOUR LAYER (future)               │
│  Radix UI Primitives — focus trapping,  │
│  accessible dialogs, accordions         │
├─────────────────────────────────────────┤
│  FOUNDATION LAYER  ← current pass       │
│  src/tokens.css                         │
│  Open Props-inspired CSS custom props   │
└─────────────────────────────────────────┘
```

## Foundation layer — `src/tokens.css`

All design tokens are defined as CSS custom properties (Open Props naming
conventions) and resolved at runtime by the browser. Both light and dark
values are co-located in the same file using `@media (prefers-color-scheme: dark)`.

### Token groups

| Group | Prefix | Examples |
|-------|--------|---------|
| Typography | `--font-*` | `--font-sans`, `--font-mono` |
| Brand accents | `--color-accent-*` | `--color-accent-green`, `--color-accent-violet` |
| Surfaces | `--color-bg`, `--color-surface*` | `--color-surface`, `--color-surface-raised` |
| Text | `--color-text*` | `--color-text`, `--color-text-soft`, `--color-text-faint` |
| Borders | `--color-border*` | `--color-border`, `--color-border-strong` |
| Elevation | `--shadow-*` | `--shadow-card`, `--shadow-overlay` |
| Radius | `--radius-*` | `--radius-sm` (8 px) … `--radius-pill` (9999 px) |
| Spacing | `--size-*` | `--size-1` (0.25 rem) … `--size-8` (2 rem) |

### Using tokens in React inline styles

CSS custom properties resolve inside React's `style={{}}` prop:

```jsx
// All of these work — React passes them straight to the DOM.
<div style={{ background: "var(--color-surface)", color: "var(--color-text)" }}>
<button style={{ border: "1px solid var(--color-border)" }}>
<div style={{ boxShadow: "var(--shadow-card)", borderRadius: "var(--radius-xl)" }}>
```

`App.jsx` maps every surface / text / border / shadow token to a local `var()`
constant (e.g. `const surface = "var(--color-surface)"`) so existing template
literal style expressions like `` border: `1px solid ${brd}` `` keep working
unchanged.

### Dark mode

The `useDarkMode()` hook in `App.jsx` subscribes to the OS `prefers-color-scheme`
media query via `addEventListener("change", …)`, so the app re-renders instantly
when the user switches their system theme. Previously the check was a one-time
`window.matchMedia().matches` read at component mount — theme changes were not
reflected without a page reload.

The `dark` boolean is kept (as a reactive value) for the `hexA(color, alpha)`
calls that alpha-blend brand accent colours at runtime. Once
[`color-mix()`](https://caniuse.com/mdn-css_types_color_color-mix) reaches
sufficient Safari coverage, those can migrate to pure CSS and `dark` can be
dropped.

## Planned next passes

1. **Behaviour layer** — Radix UI Primitives for the prep-area accordion
   (currently a hand-rolled `<button>` toggle) and the DocReader modal (needs
   focus trapping / ARIA `dialog` role).

2. **Component layer** — shadcn/ui for form elements (inputs, select, textarea,
   checkbox) to get Radix accessibility + Tailwind utility classes, replacing
   the hand-coded `S.inp` / `S.btn` inline style objects.

3. **Tailwind integration** — add Tailwind CSS so utility classes can gradually
   replace the remaining inline-style object patterns.
