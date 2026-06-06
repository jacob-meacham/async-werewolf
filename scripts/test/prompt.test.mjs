// scripts/test/prompt.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { MASTER_STYLE, buildPrompt, subjectFor } from "../lib/prompt.mjs";

test("buildPrompt embeds the shared style DNA", () => {
  const p = buildPrompt({ name: "Werewolf", team: "Wolf", image_prompt: "" });
  assert.ok(p.includes(MASTER_STYLE));
  assert.match(p, /Werewolf/);
});

test("subjectFor prefers an explicit image_prompt", () => {
  assert.equal(subjectFor({ name: "Seer", image_prompt: "a blind oracle" }), "a blind oracle");
});

test("subjectFor falls back to the role name", () => {
  assert.equal(subjectFor({ name: "Seer", image_prompt: "" }), "Seer");
});

test("wolf roles get the ember accent cue", () => {
  const p = buildPrompt({ name: "Alpha Wolf", team: "Wolf", image_prompt: "" });
  assert.match(p, /ember|red/i);
});
