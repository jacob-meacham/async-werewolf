// scripts/generate-roles.mjs
import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { constants } from "node:fs";
import OpenAI from "openai";
import { buildPrompt } from "./lib/prompt.mjs";

const OUT_DIR = "assets/img/roles";
const DATA = "_data/roles.json";

const args = process.argv.slice(2);
const force = args.includes("--force");
const onlyArg = args.find((a) => a.startsWith("--only"));
const only = onlyArg
  ? (onlyArg.includes("=") ? onlyArg.split("=")[1] : args[args.indexOf(onlyArg) + 1])
      .split(",").map((s) => s.trim()).filter(Boolean)
  : null;

if (!process.env.OPENAI_API_KEY) {
  console.error("Set OPENAI_API_KEY before running.");
  process.exit(1);
}

const fileExists = (p) => access(p, constants.F_OK).then(() => true).catch(() => false);

const roles = JSON.parse(await readFile(DATA, "utf8"));
await mkdir(OUT_DIR, { recursive: true });
const client = new OpenAI();

let made = 0, skipped = 0;
for (const role of roles) {
  if (only && !only.includes(role.slug)) continue;
  const out = `${OUT_DIR}/${role.slug}.webp`;
  if (!force && (await fileExists(out))) { skipped++; continue; }

  process.stdout.write(`Generating ${role.slug} … `);
  const res = await client.images.generate({
    model: "gpt-image-2",
    prompt: buildPrompt(role),
    size: "1024x1024",
    output_format: "webp",
    quality: "medium",
  });
  const b64 = res.data[0].b64_json;
  await writeFile(out, Buffer.from(b64, "base64"));
  made++;
  console.log("done");
}

console.log(`\nGenerated ${made}, skipped ${skipped} (already existed).`);
