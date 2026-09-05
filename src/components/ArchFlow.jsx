import { TechIcon } from "./TechStack.jsx";

// The project's data path as a picture: one chip per stage, arrows between.
// Parsed from the "**Flow:**" line in PORTFOLIO.md, so the diagram can never
// drift from the plan — it *is* the plan. Wraps on narrow screens.
export default function ArchFlow({ flow = [], accent = "#185FA5", brd, surface, txt, txtT, dark }) {
  if (!flow.length) return null;
  return (
    <div style={{ display: "flex", alignItems: "stretch", flexWrap: "wrap", gap: 6, margin: "2px 0" }}>
      {flow.map((node, i) => (
        <div key={`${node}-${i}`} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 10px", borderRadius: 8,
            border: `1px solid ${brd}`,
            background: surface,
            boxShadow: dark ? "none" : "0 1px 2px rgba(0,0,0,0.04)",
          }}>
            <TechIcon label={node} accent={accent} size={15} />
            <span style={{ fontSize: 11.5, fontWeight: 600, color: txt, whiteSpace: "nowrap" }}>{node}</span>
          </div>
          {i < flow.length - 1 && (
            <span aria-hidden style={{ fontSize: 13, color: txtT, opacity: 0.7, lineHeight: 1 }}>→</span>
          )}
        </div>
      ))}
    </div>
  );
}
