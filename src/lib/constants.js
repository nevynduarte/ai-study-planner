// Skill-coverage display metadata (status -> label/colour).
export const COV = {
  "not-started":     { label:"·",  bg:"#ECECEC", text:"#888888", border:"#D8D8D8", dot:"#BBBBBB" },
  "learning":        { label:"◑",  bg:"#FAEEDA", text:"#633806", border:"#BA7517", dot:"#BA7517" },
  "built":           { label:"●",  bg:"#E6F1FB", text:"#0C447C", border:"#185FA5", dot:"#185FA5" },
  "interview-ready": { label:"★",  bg:"#EAF3DE", text:"#3B6D11", border:"#639922", dot:"#639922" },
};
export const covOf = (m, track, skill) => m[`${track}:::${skill}`] || "not-started";

// Daily study commitment. 2 focused hours/day (10h/week) alongside consulting.
// Per-track hours derive from each track's weight, so this is the only knob.
export const DAILY_HOURS   = 2;
export const WEEKLY_TARGET = 10;
