// scripts/lib/prompt.mjs
export const MASTER_STYLE = [
  "A single illustrated plate from a nocturnal naturalist's field guide, circa 1723.",
  "Cold moonlit palette: deep midnight blue-green background, pale moonlight cyan highlights,",
  "muted candle-gold accents. Fine ink linework with soft painterly washes, like a hand-tinted",
  "engraving. Centered subject, shallow depth, even specimen-plate framing, subtle aged-paper",
  "texture. No text, no labels, no borders, no frame. Atmospheric, restrained, eerie but elegant.",
].join(" ");

export function subjectFor(role) {
  return role.image_prompt && role.image_prompt.trim()
    ? role.image_prompt.trim()
    : role.name;
}

export function buildPrompt(role) {
  const accent =
    role.team === "Wolf"
      ? "Wolf-team subject: introduce a single restrained ember-red accent."
      : "Village-team subject: keep strictly to the cold moonlit palette.";
  return `${MASTER_STYLE} ${accent} Subject: ${subjectFor(role)}.`;
}
