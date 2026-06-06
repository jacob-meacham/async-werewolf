// scripts/lib/parse-roles.mjs
// Foundation parser for roles.md — extended in future tasks (e.g. parseDocument).

export function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")  // drop punctuation
    .trim()
    .replace(/\s+/g, "-");
}

const STAT_KEYS = {
  TEAM: "team",
  RACE: "race",
  ALIGNMENT: "alignment",
  "NIGHT ACTIVITY": "night_activity",
};

export function parseStats(lines) {
  const stats = {};
  for (const line of lines) {
    const m = line.match(/^\*\s+\*\*([A-Z ]+):\*\*\s*(.+?)\s*$/);
    if (!m) break;                 // stats are a contiguous leading block
    const key = STAT_KEYS[m[1].trim()];
    if (!key) break;
    stats[key] = m[2].trim();
  }
  return stats;
}
