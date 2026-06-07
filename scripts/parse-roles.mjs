// scripts/parse-roles.mjs
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { parseDocument } from "./lib/parse-roles.mjs";

const SRC = "roles.md";
const OUT = "_data/roles.json";

const md = await readFile(SRC, "utf8");
const roles = parseDocument(md);

// One-time migration tool: roles.md is now the gallery page (its role content was
// migrated into _data/roles.json). Refuse to overwrite the data with an empty parse.
if (roles.length === 0) {
  console.error(
    `Parsed 0 roles from ${SRC}; refusing to overwrite ${OUT}. ` +
      `roles.md no longer holds role content (it is the gallery page); _data/roles.json is now the source of truth.`
  );
  process.exit(1);
}

await mkdir("_data", { recursive: true });
await writeFile(OUT, JSON.stringify(roles, null, 2) + "\n", "utf8");

const counts = roles.reduce((a, r) => ((a[r.category] = (a[r.category] || 0) + 1), a), {});
console.log(`Wrote ${roles.length} roles to ${OUT}`);
console.log("By category:", counts);
