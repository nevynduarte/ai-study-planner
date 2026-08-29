import { useState, useEffect, useMemo, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { slugify, nodeText, READER_ACCENT } from "../lib/text.js";

// serif document typography, a sticky table-of-contents rail built from the
// markdown headings, and a top reading-progress bar. Opened from the
// Interviews tab; Esc or the backdrop closes it.
export default function DocReader({ iv, md, onClose }) {
  const accent = READER_ACCENT[iv.id] || "#185FA5";
  const bodyRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [vw, setVw] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);
  const wide = vw >= 860;
  const loading = md === undefined;

  // Table of contents parsed straight from the markdown heading lines.
  const toc = useMemo(() => {
    if (!md) return [];
    const out = [];
    for (const line of md.split("\n")) {
      const m = /^(#{1,3})\s+(.*)$/.exec(line.trim());
      if (m) { const text = m[2].replace(/\*\*/g, "").replace(/`/g, "").trim(); out.push({ level: m[1].length, text, id: slugify(text) }); }
    }
    return out;
  }, [md]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";           // lock background scroll
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const onScroll = (e) => {
    const el = e.currentTarget;
    const max = el.scrollHeight - el.clientHeight;
    setProgress(max > 0 ? Math.min(100, (el.scrollTop / max) * 100) : 0);
  };
  const goTo = (id) => {
    const el = bodyRef.current && bodyRef.current.querySelector(`#${CSS.escape(id)}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // paper palette — kept light in both themes for an authentic document feel.
  const SER = 'Georgia, "Times New Roman", serif';
  const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif";
  const paper = "#fbfbf8", ink = "#1d1d1b", inkSoft = "#56544f", rule = "rgba(0,0,0,0.11)";
  const head = (size, mt) => ({ id: undefined, fontFamily: SER, color: ink, lineHeight: 1.25, margin: mt, fontWeight: 700, fontSize: size });

  const D = {
    h1: ({ children }) => <h1 id={slugify(nodeText(children))} style={{ ...head(27, "4px 0 16px"), letterSpacing: -0.4, lineHeight: 1.2 }}>{children}</h1>,
    h2: ({ children }) => <h2 id={slugify(nodeText(children))} style={{ ...head(20, "32px 0 10px"), borderBottom: `1px solid ${rule}`, paddingBottom: 6 }}>{children}</h2>,
    h3: ({ children }) => <h3 id={slugify(nodeText(children))} style={head(15.5, "24px 0 6px")}>{children}</h3>,
    p: (p) => <p style={{ margin: "0 0 13px", lineHeight: 1.78, fontSize: 15.5, color: ink }} {...p} />,
    ul: (p) => <ul style={{ margin: "0 0 13px", paddingLeft: 24, lineHeight: 1.75, fontSize: 15.5, color: ink }} {...p} />,
    ol: (p) => <ol style={{ margin: "0 0 13px", paddingLeft: 24, lineHeight: 1.75, fontSize: 15.5, color: ink }} {...p} />,
    li: (p) => <li style={{ margin: "4px 0" }} {...p} />,
    strong: (p) => <strong style={{ fontWeight: 700 }} {...p} />,
    a: (p) => <a style={{ color: "#1a5fb4", textDecoration: "underline", textUnderlineOffset: 2, wordBreak: "break-word" }} target="_blank" rel="noreferrer" {...p} />,
    hr: () => <hr style={{ border: "none", borderTop: `1px solid ${rule}`, margin: "24px 0" }} />,
    code: (p) => <code style={{ fontFamily: "ui-monospace,Menlo,monospace", fontSize: 13, background: "rgba(0,0,0,0.05)", padding: "1px 5px", borderRadius: 4 }} {...p} />,
    pre: (p) => <pre style={{ background: "rgba(0,0,0,0.045)", padding: "13px 15px", borderRadius: 8, overflowX: "auto", fontSize: 12.5, lineHeight: 1.5, margin: "0 0 15px", border: `1px solid ${rule}` }} {...p} />,
    blockquote: (p) => <blockquote style={{ margin: "0 0 14px", padding: "2px 0 2px 16px", borderLeft: `3px solid ${accent}`, color: inkSoft, fontStyle: "italic" }} {...p} />,
    table: (p) => <div style={{ overflowX: "auto", margin: "0 0 16px" }}><table style={{ borderCollapse: "collapse", fontSize: 14, width: "100%" }} {...p} /></div>,
    th: (p) => <th style={{ textAlign: "left", padding: "7px 11px", borderBottom: `2px solid ${rule}`, fontWeight: 700, fontFamily: SER }} {...p} />,
    td: (p) => <td style={{ padding: "7px 11px", borderBottom: `1px solid ${rule}`, verticalAlign: "top" }} {...p} />,
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(20,20,22,0.62)", backdropFilter: "blur(3px)", display: "flex", justifyContent: "center", alignItems: "stretch", padding: wide ? 24 : 0, boxSizing: "border-box" }}>
      <div style={{ position: "fixed", top: 0, left: 0, height: 3, width: `${progress}%`, background: accent, zIndex: 1002, transition: "width .1s linear" }} />
      <div onClick={(e) => e.stopPropagation()} style={{ background: paper, color: ink, width: "100%", maxWidth: 1040, height: "100%", borderRadius: wide ? 12 : 0, overflow: "hidden", boxShadow: "0 12px 64px rgba(0,0,0,0.45)", display: "flex", flexDirection: "column", fontFamily: SER }}>

        {/* sticky header bar */}
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 20px", borderBottom: `1px solid ${rule}`, background: "rgba(251,251,248,0.94)" }}>
          <div style={{ minWidth: 0, fontFamily: SANS, display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: accent, display: "inline-block", flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{iv.company} — Full prep guide</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, fontFamily: SANS }}>
            <a href={iv.guide_md} download style={{ fontSize: 12, color: inkSoft, textDecoration: "none", border: `1px solid ${rule}`, borderRadius: 7, padding: "5px 10px" }}>⤓ .md</a>
            <button onClick={onClose} style={{ fontSize: 12.5, cursor: "pointer", border: `1px solid ${rule}`, background: "#fff", color: ink, borderRadius: 7, padding: "5px 12px" }}>Close ✕</button>
          </div>
        </div>

        {/* scroll body: TOC rail + paper page */}
        <div ref={bodyRef} onScroll={onScroll} style={{ flex: 1, overflowY: "auto", display: "flex", justifyContent: "center" }}>
          {wide && toc.length > 0 && (
            <nav style={{ width: 250, flexShrink: 0, alignSelf: "flex-start", position: "sticky", top: 0, maxHeight: "100%", overflowY: "auto", padding: "40px 16px 60px 24px", borderRight: `1px solid ${rule}`, fontFamily: SANS }}>
              <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: 0.7, color: inkSoft, marginBottom: 11, fontWeight: 700 }}>Contents</div>
              {toc.map((t, i) => (
                <button key={i} onClick={() => goTo(t.id)} title={t.text}
                  style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: `3px 0 3px ${(t.level - 1) * 12}px`, fontSize: t.level === 1 ? 12.5 : 12, color: t.level === 1 ? ink : inkSoft, fontWeight: t.level === 1 ? 600 : 400, lineHeight: 1.45 }}>
                  {t.text}
                </button>
              ))}
            </nav>
          )}
          <article style={{ flex: 1, maxWidth: 760, minWidth: 0, padding: wide ? "48px 60px 100px" : "28px 20px 80px" }}>
            {loading
              ? <div style={{ fontFamily: SANS, color: inkSoft, fontSize: 14 }}>Loading guide…</div>
              : <ReactMarkdown remarkPlugins={[remarkGfm]} components={D}>{md}</ReactMarkdown>}
          </article>
        </div>
      </div>
    </div>
  );
}
