// Skill-coverage display metadata (status -> label/colour).
export const COV = {
  "not-started":     { label:"·",  bg:"#ECECEC", text:"#888888", border:"#D8D8D8", dot:"#BBBBBB" },
  "learning":        { label:"◑",  bg:"#FAEEDA", text:"#633806", border:"#BA7517", dot:"#BA7517" },
  "built":           { label:"●",  bg:"#E6F1FB", text:"#0C447C", border:"#185FA5", dot:"#185FA5" },
  "interview-ready": { label:"★",  bg:"#EAF3DE", text:"#3B6D11", border:"#639922", dot:"#639922" },
};
const covOf = (m, track, skill) => m[`${track}:::${skill}`] || "not-started";

// Single-user, client-side persisted UI state (localStorage). Used for toggles
// the static curriculum + D1 don't model: crash-day completion, archived
// interviews, papers marked read. Falls back to `initial` if storage is empty
// or unavailable, and ignores write errors (private mode / quota).
