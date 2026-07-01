import { useState, useEffect, useRef, useMemo } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Local copies of the text helpers — used for heading anchor IDs and TOC labels.
const slugify = (s) =>
  String(s).toLowerCase().trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const nodeText = (c) =>
  Array.isArray(c) ? c.map(nodeText).join("")
  : (typeof c === "string" || typeof c === "number") ? String(c)
  : (c && c.props && c.props.children) ? nodeText(c.props.children)
  : "";

const READER_ACCENT = { aaru: "#1D9E75", equi: "#7F77DD" };

/**
 * Full-screen document reader for a prep guide.
 *
 * Upgraded from a raw <div> to @radix-ui/react-dialog so that:
 *   - focus is trapped inside the panel (Tab/Shift-Tab stay inside)
 *   - focus returns to the opener button on close
 *   - role="dialog" + aria-modal="true" + aria-labelledby are set automatically
 *   - background content gets aria-hidden while the dialog is open
 *   - body scroll is locked by Radix (no manual overflow toggle needed)
 *   - ESC to close is handled by Radix
 */
export function DocReader({ iv, md, onClose }) {
  const accent = READER_ACCENT[iv.id] || "#185FA5";
  const bodyRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [vw, setVw] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);
  const wide = vw >= 860;
  const loading = md === undefined;

  // Table of contents derived from markdown headings.
  const toc = useMemo(() => {
    if (!md) return [];
    const out = [];
    for (const line of md.split("\n")) {
      const m = /^(#{1,3})\s+(.*)$/.exec(line.trim());
      if (m) {
        const text = m[2].replace(/\*\*/g, "").replace(/`/g, "").trim();
        out.push({ level: m[1].length, text, id: slugify(text) });
      }
    }
    return out;
  }, [md]);

  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // Scroll lock and ESC are handled by Radix Dialog.
  }, []);

  const onScroll = (e) => {
    const el = e.currentTarget;
    const max = el.scrollHeight - el.clientHeight;
    setProgress(max > 0 ? Math.min(100, (el.scrollTop / max) * 100) : 0);
  };

  const goTo = (id) => {
    const el = bodyRef.current?.querySelector(`#${CSS.escape(id)}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const SER  = 'Georgia, "Times New Roman", serif';
  const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif";
  const paper = "#fbfbf8", ink = "#1d1d1b", inkSoft = "#56544f", rule = "rgba(0,0,0,0.11)";

  const head = (size, mt) => ({
    fontFamily: SER, color: ink, lineHeight: 1.25,
    margin: mt, fontWeight: 700, fontSize: size,
  });

  const D = {
    h1: ({ children }) => <h1 id={slugify(nodeText(children))} style={{ ...head(27, "4px 0 16px"), letterSpacing: -0.4, lineHeight: 1.2 }}>{children}</h1>,
    h2: ({ children }) => <h2 id={slugify(nodeText(children))} style={{ ...head(20, "32px 0 10px"), borderBottom: `1px solid ${rule}`, paddingBottom: 6 }}>{children}</h2>,
    h3: ({ children }) => <h3 id={slugify(nodeText(children))} style={head(15.5, "24px 0 6px")}>{children}</h3>,
    p:  (p) => <p style={{ margin: "0 0 13px", lineHeight: 1.78, fontSize: 15.5, color: ink }} {...p} />,
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
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        {/* Visual backdrop — Radix marks it aria-hidden for screen readers */}
        <Dialog.Overlay
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(20,20,22,0.62)", backdropFilter: "blur(3px)",
          }}
        />

        {/*
         * Dialog.Content provides:
         *   role="dialog", aria-modal="true", aria-labelledby (from Dialog.Title)
         *   Focus trap — Tab/Shift-Tab stay inside
         *   Focus restoration — focus returns to opener on close
         *   ESC to close — Radix fires onOpenChange(false)
         *
         * It fills the viewport so we can use flexbox centering for the paper.
         * Backdrop-click-to-close is handled by the inner wrapper's onClick.
         */}
        <Dialog.Content
          aria-describedby={undefined}
          style={{
            position: "fixed", inset: 0, zIndex: 1001,
            outline: "none",
          }}
        >
          {/* Reading-progress bar — decorative, above the paper */}
          <div
            aria-hidden="true"
            style={{
              position: "fixed", top: 0, left: 0, height: 3,
              width: `${progress}%`, background: accent, zIndex: 1002,
              transition: "width .1s linear", pointerEvents: "none",
            }}
          />

          {/* Clicking this area (outside the paper) closes the dialog */}
          <div
            onClick={onClose}
            style={{
              display: "flex", justifyContent: "center", alignItems: "stretch",
              width: "100%", height: "100%",
              padding: wide ? 24 : 0, boxSizing: "border-box",
            }}
          >
            {/* Paper — stop propagation so inner clicks don't bubble to the closer */}
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: paper, color: ink, width: "100%", maxWidth: 1040,
                height: "100%", borderRadius: wide ? 12 : 0, overflow: "hidden",
                boxShadow: "0 12px 64px rgba(0,0,0,0.45)",
                display: "flex", flexDirection: "column", fontFamily: SER,
              }}
            >
              {/* Sticky header bar */}
              <div style={{
                flexShrink: 0, display: "flex", alignItems: "center",
                justifyContent: "space-between", gap: 12, padding: "12px 20px",
                borderBottom: `1px solid ${rule}`,
                background: "rgba(251,251,248,0.94)",
              }}>
                {/* Dialog.Title is the accessible label for the dialog */}
                <Dialog.Title
                  style={{
                    margin: 0, fontFamily: SANS,
                    display: "flex", alignItems: "center", gap: 9, minWidth: 0,
                  }}
                >
                  <span style={{ width: 9, height: 9, borderRadius: 2, background: accent, display: "inline-block", flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {iv.company} — Full prep guide
                  </span>
                </Dialog.Title>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, fontFamily: SANS }}>
                  <a
                    href={iv.guide_md}
                    download
                    style={{ fontSize: 12, color: inkSoft, textDecoration: "none", border: `1px solid ${rule}`, borderRadius: 7, padding: "5px 10px" }}
                  >
                    ⤓ .md
                  </a>
                  {/* Dialog.Close: Radix calls onOpenChange(false) which triggers onClose */}
                  <Dialog.Close asChild>
                    <button
                      aria-label="Close document reader"
                      style={{ fontSize: 12.5, cursor: "pointer", border: `1px solid ${rule}`, background: "#fff", color: ink, borderRadius: 7, padding: "5px 12px" }}
                    >
                      Close ✕
                    </button>
                  </Dialog.Close>
                </div>
              </div>

              {/* Scrollable body: sticky TOC rail + article */}
              <div ref={bodyRef} onScroll={onScroll} style={{ flex: 1, overflowY: "auto", display: "flex", justifyContent: "center" }}>
                {wide && toc.length > 0 && (
                  <nav
                    aria-label="Document contents"
                    style={{
                      width: 250, flexShrink: 0, alignSelf: "flex-start",
                      position: "sticky", top: 0, maxHeight: "100%", overflowY: "auto",
                      padding: "40px 16px 60px 24px",
                      borderRight: `1px solid ${rule}`, fontFamily: SANS,
                    }}
                  >
                    <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: 0.7, color: inkSoft, marginBottom: 11, fontWeight: 700 }}>
                      Contents
                    </div>
                    {toc.map((t, i) => (
                      <button
                        key={i}
                        onClick={() => goTo(t.id)}
                        title={t.text}
                        style={{
                          display: "block", width: "100%", textAlign: "left",
                          background: "none", border: "none", cursor: "pointer",
                          padding: `3px 0 3px ${(t.level - 1) * 12}px`,
                          fontSize: t.level === 1 ? 12.5 : 12,
                          color: t.level === 1 ? ink : inkSoft,
                          fontWeight: t.level === 1 ? 600 : 400, lineHeight: 1.45,
                        }}
                      >
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
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
