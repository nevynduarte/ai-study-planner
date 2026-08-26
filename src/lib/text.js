// Slug + text-extraction helpers shared by the document reader (TOC anchors).
// Extracted from App.jsx — pure functions, no React, no app state.
// slug + text-extraction helpers shared by the document reader (TOC anchors).
export const slugify = (s) => String(s).toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
export const nodeText = (c) => Array.isArray(c) ? c.map(nodeText).join("")
  : (typeof c === "string" || typeof c === "number") ? String(c)
  : (c && c.props && c.props.children) ? nodeText(c.props.children) : "";
export const READER_ACCENT = { aaru: "#1D9E75", equi: "#7F77DD" };

// ─── DocReader ─────────────────────────────────────────────────────────────
