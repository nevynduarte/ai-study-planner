import { useState } from "react";
import crashCourse from "../resources/fde-crash-course.md?raw";
import readingSequence from "../resources/tier1-reading-sequence.md?raw";
import stateOfAi from "../resources/state-of-ai-ml-2026.md?raw";

// Reference docs bundled into the app at build time (Vite `?raw` imports), so
// they need no network fetch and no D1 row. Rendered with the app's shared
// markdown renderer (`Md`, passed in from App so it carries the theme) — the
// same one the Research and Projects tabs use — so tables, code blocks and
// headings look like every other card.
const DOCS = [
  {
    id: "fde-crash-course",
    title: "FDE Coding Interview Crash Course",
    subtitle: "Avallon · Clarion · CollectWise — one prep track",
    content: crashCourse,
  },
  {
    id: "tier1-reading",
    title: "Tier 1 Reading Sequence",
    subtitle: "Eight books → one interview-prep path",
    content: readingSequence,
  },
  {
    id: "state-of-ai-2026",
    title: "The State of AI & ML — Sept 2026",
    subtitle: "26-chapter technical reference · paper catalog · 24-week roadmap",
    content: stateOfAi,
  },
];

const ACCENT = "#185FA5";

export default function ResourcesTab({ Md, S, hexA, dark, brd, surface, txtS }) {
  const [activeId, setActiveId] = useState(DOCS[0].id);
  const active = DOCS.find(d => d.id === activeId) || DOCS[0];

  return (
    <div>
      {/* Doc picker — same pill row the Research tab uses for its sub-views */}
      <div style={{ display:"flex", gap:6, marginBottom:"1rem", flexWrap:"wrap" }}>
        {DOCS.map(d => {
          const on = d.id === activeId;
          return (
            <button key={d.id} onClick={() => setActiveId(d.id)} title={d.subtitle}
              style={{ fontSize:12.5, fontWeight:600, padding:"7px 14px", borderRadius:999, cursor:"pointer",
                       border:`1px solid ${on ? ACCENT : brd}`, background: on ? hexA(ACCENT, dark ? 0.2 : 0.1) : surface,
                       color: on ? ACCENT : txtS, whiteSpace:"nowrap" }}>
              {d.title}
            </button>
          );
        })}
      </div>

      {/* Each doc opens with its own title line, so the card carries no header. */}
      <div style={{ ...S.card, borderLeft:`3px solid ${ACCENT}` }}>
        <Md>{active.content}</Md>
      </div>
    </div>
  );
}
