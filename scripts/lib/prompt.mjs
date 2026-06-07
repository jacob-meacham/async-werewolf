// scripts/lib/prompt.mjs
import { ROLE_PROMPTS } from "../role-prompts.mjs";

export const MASTER_STYLE =
  "A single specimen plate from an 18th-century naturalist's field guide, circa 1723. " +
  "Hand-tinted copperplate engraving: fine etched ink linework and cross-hatching with restrained watercolor washes laid over the engraving. " +
  "One subject, centered and sharply detailed, on aged cold-toned paper with faint foxing and a subtle plate-mark border. " +
  "Behind the subject, a loosely sketched, faintly etched background vignette suggesting its setting (sparse, low-contrast linework that fades to bare paper at the edges), a hint of environment, never a full filled scene. " +
  "Cold palette of deep midnight blue-green, pale cyan, and muted candle-gold, under even specimen lighting. " +
  "No night sky, no moon, no text, no labels. Restrained, eerie, elegant.";

export function subjectFor(role) {
  if (ROLE_PROMPTS[role.slug]) return ROLE_PROMPTS[role.slug];
  if (role.image_prompt && role.image_prompt.trim()) return role.image_prompt.trim();
  return role.name;
}

export function buildPrompt(role) {
  let accent;
  if (role.category === "wolf") {
    if (String(role.race || "").toLowerCase().includes("wolf")) {
      accent =
        "Wolf-team lycan: depict as a monstrous bipedal werewolf (upright wolf-man), with a single restrained ember-red accent such as faintly glowing ember-red eyes.";
    } else {
      accent =
        "Wolf-team human conspirator: depict as a human (no wolf anatomy) with a single restrained ember-red accent detail.";
    }
  } else {
    accent = "Keep strictly to the cold palette; no red.";
  }
  return `${MASTER_STYLE} ${accent} Subject: ${subjectFor(role)}.`;
}
