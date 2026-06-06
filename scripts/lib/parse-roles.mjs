// scripts/lib/parse-roles.mjs
// Foundation parser for roles.md.

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

const CATEGORY_BY_H1 = {
  "Village Team": { category: "village", team: "Village" },
  "Wolf Team": { category: "wolf", team: "Wolf" },
  "Advanced Teams": { category: "advanced", team: "Advanced" },
  "Items": { category: "items", team: "" },
};

function stripToc(md) {
  return md.replace(/<!-- START doctoc[\s\S]*?END doctoc[^>]*-->/i, "");
}

function splitBlock(bodyLines) {
  // separate the leading stat bullets from the prose body
  let i = 0;
  while (i < bodyLines.length && /^\*\s+\*\*[A-Z ]+:\*\*/.test(bodyLines[i])) i++;
  const stats = parseStats(bodyLines.slice(0, i));
  const body = bodyLines.slice(i).join("\n").trim();
  return { stats, body };
}

export function parseDocument(markdown) {
  const lines = stripToc(markdown).split("\n");
  const roles = [];
  let current = null;          // current top-level role
  let ctx = { category: "", team: "" };
  let pending = null;          // { target, name, slug, lines }

  const flush = () => {
    if (!pending) return;
    const { stats, body } = splitBlock(pending.lines);
    const entry = {
      name: pending.name,
      slug: pending.slug,
      ...{ team: "", race: "", alignment: "", night_activity: "" },
      ...stats,
      body,
    };
    if (pending.target === "role") {
      entry.category = ctx.category;
      if (!entry.team) entry.team = ctx.team;
      entry.image = `/assets/img/roles/${entry.slug}.webp`;
      entry.image_prompt = "";
      entry.variants = [];
      roles.push(entry);
      current = entry;
    } else {
      current?.variants.push({
        name: entry.name,
        slug: entry.slug,
        night_activity: entry.night_activity,
        body: entry.body,
      });
    }
    pending = null;
  };

  for (const line of lines) {
    const h1 = line.match(/^# (.+?)\s*$/);
    const h2 = line.match(/^## (.+?)\s*$/);
    const h3 = line.match(/^### (.+?)\s*$/);
    if (h1) {
      flush();
      ctx = CATEGORY_BY_H1[h1[1].trim()] || ctx;
      continue;
    }
    if (h2) {
      flush();
      pending = { target: "role", name: h2[1].trim(), slug: slugify(h2[1]), lines: [] };
      continue;
    }
    if (h3) {
      flush();
      pending = { target: "variant", name: h3[1].trim(), slug: slugify(h3[1]), lines: [] };
      continue;
    }
    if (pending) pending.lines.push(line);
  }
  flush();
  return roles;
}
