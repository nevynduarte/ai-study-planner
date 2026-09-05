import { useState } from "react";

// Watch-list for a project. Two kinds of entry, both parsed from the
// "**Watch:**" line in PORTFOLIO.md:
//
//   { id, title }    a specific video — shows its real thumbnail, plays inline
//   { q,  title }    a topic — opens a YouTube search, so it never rots into a
//                    dead embed and always surfaces current material
//
// Only entries with a verified video id are ever embedded; topics stay links.
export default function MediaRail({ items = [], accent = "#185FA5", brd, surface, txt, txtT, dark }) {
  const [playing, setPlaying] = useState(null);
  const [noThumb, setNoThumb] = useState({});
  if (!items.length) return null;

  return (
    <div>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: txtT, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 7 }}>
        Watch
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 9 }}>
        {items.map((v, i) => {
          const key = v.id || v.q || i;
          if (playing === key && v.id) {
            return (
              <div key={key} style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${brd}`, aspectRatio: "16 / 9", background: "#000" }}>
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0`}
                  title={v.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                  allowFullScreen
                  style={{ width: "100%", height: "100%", border: "none", display: "block" }}
                />
              </div>
            );
          }

          // A topic chip: no thumbnail exists for a search, so draw a tile.
          if (!v.id) {
            return (
              <a key={key} href={`https://www.youtube.com/results?search_query=${encodeURIComponent(v.q)}`}
                target="_blank" rel="noreferrer"
                style={{ textDecoration: "none", color: "inherit", border: `1px solid ${brd}`, borderRadius: 10, overflow: "hidden", display: "block", background: surface }}>
                <div style={{
                  aspectRatio: "16 / 9", display: "flex", alignItems: "center", justifyContent: "center",
                  background: `linear-gradient(135deg, ${accent}22, transparent 70%)`, color: accent, fontSize: 22,
                }}>⌕</div>
                <div style={{ padding: "7px 9px" }}>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: txt, lineHeight: 1.35 }}>{v.title}</div>
                  <div style={{ fontSize: 10.5, color: txtT, marginTop: 2 }}>search YouTube ↗</div>
                </div>
              </a>
            );
          }

          return (
            <button key={key} onClick={() => setPlaying(key)}
              style={{ textAlign: "left", border: `1px solid ${brd}`, borderRadius: 10, overflow: "hidden", cursor: "pointer", padding: 0, background: surface, color: "inherit", fontFamily: "inherit", display: "block", width: "100%" }}>
              <div style={{ position: "relative", aspectRatio: "16 / 9", background: dark ? "#111" : "#eee" }}>
                {!noThumb[v.id] && (
                  <img src={`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`} alt="" loading="lazy"
                    onError={() => setNoThumb((m) => ({ ...m, [v.id]: true }))}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                )}
                <span aria-hidden style={{
                  position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{
                    width: 40, height: 40, borderRadius: "50%", background: "rgba(0,0,0,0.62)", color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, paddingLeft: 3,
                  }}>▶</span>
                </span>
              </div>
              <div style={{ padding: "7px 9px" }}>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: txt, lineHeight: 1.35 }}>{v.title}</div>
                <div style={{ fontSize: 10.5, color: txtT, marginTop: 2 }}>play here</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
