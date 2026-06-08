// scripts/generate-hero.mjs
// Generates the landscape hero plate used on the homepage and as the Lab thumbnail.
// Unlike the role plates, this is a wide establishing scene and is allowed a faint
// cold moon. Run: OPENAI_API_KEY=... node scripts/generate-hero.mjs [--out path]
import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import OpenAI from "openai";

const args = process.argv.slice(2);
const outArg = args.find((a) => a.startsWith("--out"));
const OUT = outArg
  ? (outArg.includes("=") ? outArg.split("=")[1] : args[args.indexOf(outArg) + 1])
  : "assets/img/hero.webp";

if (!process.env.OPENAI_API_KEY) {
  console.error("Set OPENAI_API_KEY before running.");
  process.exit(1);
}

const PROMPT =
  "A wide landscape establishing plate from an 18th-century naturalist's field guide, circa 1723. " +
  "Hand-tinted copperplate engraving: fine etched ink linework and cross-hatching with restrained watercolor washes laid over the engraving. " +
  "A small snowbound frontier village in a remote arctic valley — a cluster of timber cabins with smoking chimneys, a low log palisade, a frozen river, and dark pine forest crowding in from the edges, distant jagged mountains beyond. " +
  "A large pale cold moon hangs low in a faintly etched winter sky, casting cold light across the snow; one or two cabin windows glow muted candle-gold. " +
  "Aged cold-toned paper with faint foxing and a subtle plate-mark border. " +
  "Cold palette of deep midnight blue-green, pale cyan, and muted candle-gold. " +
  "Eerie, elegant, restrained. No text, no labels, no figures in the foreground.";

const client = new OpenAI();
process.stdout.write(`Generating hero -> ${OUT} … `);
const res = await client.images.generate({
  model: "gpt-image-2",
  prompt: PROMPT,
  size: "1536x1024",
  output_format: "webp",
  quality: "high",
});
await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, Buffer.from(res.data[0].b64_json, "base64"));
console.log("done");
