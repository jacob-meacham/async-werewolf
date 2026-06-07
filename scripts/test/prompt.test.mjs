// scripts/test/prompt.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { MASTER_STYLE, buildPrompt, subjectFor } from "../lib/prompt.mjs";
import { ROLE_PROMPTS } from "../role-prompts.mjs";

// ── buildPrompt: style DNA ────────────────────────────────────────────────────

test("buildPrompt output includes MASTER_STYLE", () => {
  const p = buildPrompt({ name: "Villager", slug: "__nonexistent-test__", category: "village", race: "Human" });
  assert.ok(p.includes(MASTER_STYLE));
});

// ── buildPrompt: wolf-team lycan ──────────────────────────────────────────────

test("wolf-team lycan prompt contains 'bipedal werewolf' and 'ember-red'", () => {
  const p = buildPrompt({ name: "Alpha Wolf", slug: "__nonexistent-test__", category: "wolf", race: "Werewolf" });
  assert.match(p, /bipedal werewolf/i);
  assert.match(p, /ember-red/i);
});

// ── buildPrompt: wolf-team human conspirator ──────────────────────────────────

test("wolf-team human conspirator prompt contains 'human' and not 'bipedal werewolf'", () => {
  const p = buildPrompt({ name: "Sorcerer", slug: "__nonexistent-test__", category: "wolf", race: "Human" });
  assert.match(p, /human/i);
  assert.ok(!p.includes("bipedal werewolf"));
});

// ── buildPrompt: village role ─────────────────────────────────────────────────

test("village role prompt contains 'no red'", () => {
  const p = buildPrompt({ name: "Villager", slug: "__nonexistent-test__", category: "village", race: "Human" });
  assert.match(p, /no red/i);
});

// ── subjectFor: ROLE_PROMPTS takes highest precedence ────────────────────────

test("subjectFor returns ROLE_PROMPTS value when slug is present", () => {
  // "seer" is a real slug in ROLE_PROMPTS
  const result = subjectFor({ name: "Seer", slug: "seer", image_prompt: "a blind oracle" });
  assert.equal(result, ROLE_PROMPTS["seer"]);
});

// ── subjectFor: falls back to image_prompt when slug absent from map ──────────

test("subjectFor falls back to image_prompt when slug not in ROLE_PROMPTS", () => {
  const result = subjectFor({ name: "Seer", slug: "__nonexistent-test__", image_prompt: "a blind oracle" });
  assert.equal(result, "a blind oracle");
});

// ── subjectFor: falls back to name when neither slug nor image_prompt present ─

test("subjectFor falls back to role name when slug not in map and no image_prompt", () => {
  const result = subjectFor({ name: "Seer", slug: "__nonexistent-test__", image_prompt: "" });
  assert.equal(result, "Seer");
});
