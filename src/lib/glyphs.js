// Small glyph vocabulary so a section, a track, or a step kind is recognisable
// before it is read. Deliberately emoji rather than an icon font: no asset to
// load, renders in both themes, and survives a font-family change.

// Study tracks, matched on the track id or name from curriculum.json.
const TRACK = [
  [/dsa|coding|algorithm/i,            "🧩"],
  [/recall|fundamental/i,              "🧠"],
  [/system\s*design|sys\s*design/i,    "🏗️"],
  [/position|search|brand|resume/i,    "🎯"],
  [/ai\s*eng/i,                        "🤖"],
  [/ml\s*eng|mlops/i,                  "⚙️"],
  [/data\s*sci/i,                      "📊"],
  [/quant|alt.?data/i,                 "📈"],
];
export const trackGlyph = (t) => (TRACK.find(([re]) => re.test(String(t || "")))?.[1]) || "◆";

// The kind of work a plan step is — mirrors the BUILD/RUN/DEFEND/BREAK/DRILL
// badges the day generator emits.
const KIND = {
  BUILD: "🔨", RUN: "▶️", DEFEND: "🛡️", READ: "📖", BREAK: "☕",
  DRILL: "⏱️", APPLY: "📮", SHIP: "🚢", TEST: "🧪", REVIEW: "🔍",
};
export const kindGlyph = (k) => KIND[String(k || "").toUpperCase()] || "•";

// Problem topics on the Practice tab.
const TOPIC = [
  [/array|hash/i, "🗃️"], [/two pointer/i, "↔️"], [/sliding window/i, "🪟"],
  [/stack/i, "🥞"], [/binary search/i, "🔎"], [/linked list/i, "🔗"],
  [/tree|trie/i, "🌳"], [/heap|priority/i, "⛰️"], [/backtrack/i, "🔙"],
  [/graph/i, "🕸️"], [/dynamic programming|\bdp\b/i, "🧮"], [/greedy/i, "🍰"],
  [/interval/i, "📏"], [/math|geometry/i, "📐"], [/bit/i, "🔢"],
];
export const topicGlyph = (t) => (TOPIC.find(([re]) => re.test(String(t || "")))?.[1]) || "▪️";
