import { iconFor, shortLabel } from "../lib/techIcons.js";
import { ICON_PATHS } from "../lib/iconPaths.js";

// One tool: its real logo drawn inline from bundled path data, or a
// brand-coloured letter tile when there is no icon for it. No network request,
// so a logo can never fail to load or shift the layout as it arrives.
function TechIcon({ label, size = 18, accent }) {
  const ico = iconFor(label);
  const d = ico && ico.slug ? ICON_PATHS[ico.slug] : null;

  if (!d) {
    return (
      <span aria-hidden style={{
        width: size, height: size, borderRadius: 5, flexShrink: 0,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.58, fontWeight: 800, color: "#fff",
        background: ico ? `#${ico.color}` : accent, letterSpacing: -0.3,
      }}>{shortLabel(label).slice(0, 1).toUpperCase()}</span>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden focusable="false"
      style={{ flexShrink: 0, display: "block" }} fill={`#${ico.color}`}>
      <path d={d} />
    </svg>
  );
}

// The stack as a row of logo chips. `compact` drops the text labels down to a
// dense logo strip for collapsed cards.
export default function TechStack({ stack = [], accent = "#185FA5", brd, txtS, compact = false, max }) {
  const items = max ? stack.slice(0, max) : stack;
  const rest = max ? stack.length - items.length : 0;
  return (
    <div style={{ display: "flex", gap: compact ? 6 : 5, flexWrap: "wrap", alignItems: "center" }}>
      {items.map((t) => (
        <span key={t} title={t} style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: compact ? 4 : "3px 8px 3px 6px",
          border: `1px solid ${brd}`, borderRadius: 7,
          fontSize: 11, color: txtS, whiteSpace: "nowrap", lineHeight: 1.4,
        }}>
          <TechIcon label={t} accent={accent} size={compact ? 15 : 16} />
          {!compact && shortLabel(t)}
        </span>
      ))}
      {rest > 0 && (
        <span style={{ fontSize: 11, color: txtS, opacity: 0.75, padding: "0 2px" }}>+{rest}</span>
      )}
    </div>
  );
}

export { TechIcon };
