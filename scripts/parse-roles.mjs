// scripts/parse-roles.mjs
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { parseDocument } from "./lib/parse-roles.mjs";

const SRC = "roles.md";
const OUT = "_data/roles.json";

const md = await readFile(SRC, "utf8");
const roles = parseDocument(md);

await mkdir("_data", { recursive: true });
await writeFile(OUT, JSON.stringify(roles, null, 2) + "\n", "utf8");

const counts = roles.reduce((a, r) => ((a[r.category] = (a[r.category] || 0) + 1), a), {});
console.log(`Wrote ${roles.length} roles to ${OUT}`);
console.log("By category:", counts);
