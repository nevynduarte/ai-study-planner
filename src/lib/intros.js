// Best-effort match from freeform plan-item text (P620 writes the daily plan
// as prose) to the curated `intros` map in curriculum.json, so Today's plan
// items get the same intro links as the Coverage tab without trusting an LLM
// to emit URLs. Skills from the item's own track are tried first; generic
// words are stoplisted so "system design mock" doesn't match a random skill.
const STOP = new Set([
  "the", "and", "for", "with", "from", "your", "into", "over", "when", "done",
  "design", "data", "system", "model", "month", "review", "block", "session",
]);
const tokens = (s) => String(s).toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length >= 4 && !STOP.has(w));

export function findIntro(cur, track, text) {
  const intros = cur?.intros;
  if (!intros) return null;
  const tw = tokens(text);
  if (!tw.length) return null;
  const candidates = [];
  for (const sk of (cur.tracks?.[track]?.skills) || []) if (intros[sk]) candidates.push(sk);
  for (const sk of Object.keys(intros)) if (sk !== "_comment" && !candidates.includes(sk)) candidates.push(sk);
  for (const sk of candidates) {
    if (tokens(sk).some(k => tw.some(w => w.includes(k) || k.includes(w)))) return { ...intros[sk], skill: sk };
  }
  return null;
}
