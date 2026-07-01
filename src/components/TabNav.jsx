/* TabNav — segmented, horizontally-scrollable main navigation.
   Built with Tailwind CSS v4 layout utilities + --ds-* CSS variable theming.
   Accessible: tab role, aria-selected, visible focus ring, keyboard navigation. */

const TAB_LABELS = {};

const TABS = [
  "today",
  "interviews",
  "plan",
  "calendar",
  "tutor",
  "research",
  "practice",
  "frontier",
  "advisory",
  "coverage",
  "log",
];

function labelFor(tab) {
  return TAB_LABELS[tab] || tab.charAt(0).toUpperCase() + tab.slice(1);
}

export { TABS };

export function TabNav({ activeTab, onTabChange }) {
  return (
    <nav
      role="tablist"
      aria-label="Main navigation"
      className="flex gap-0.5 mb-[1.4rem] overflow-x-auto p-1 rounded-full border"
      style={{
        background: "var(--ds-surface-subtle)",
        borderColor: "var(--ds-border)",
        scrollbarWidth: "none",
      }}
    >
      {TABS.map((t) => {
        const isActive = t === activeTab;
        return (
          <button
            key={t}
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(t)}
            className={[
              // layout + shape
              "px-3.5 py-[7px] rounded-full border-0 cursor-pointer whitespace-nowrap",
              "transition-all duration-150",
              // focus ring — shown only for keyboard navigation (not mouse clicks)
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
            ].join(" ")}
            style={{
              fontSize: 13,
              fontWeight: isActive ? 600 : 500,
              background: isActive ? "var(--ds-surface)" : "transparent",
              color: isActive ? "var(--ds-text)" : "var(--ds-text-muted)",
              boxShadow: isActive ? "var(--ds-shadow-card)" : "none",
              outlineColor: "var(--ds-accent-blue)",
            }}
          >
            {labelFor(t)}
          </button>
        );
      })}
    </nav>
  );
}
