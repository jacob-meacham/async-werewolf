// scripts/test/parse-roles.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { slugify, parseStats } from "../lib/parse-roles.mjs";

test("slugify matches doctoc anchors", () => {
  assert.equal(slugify("Wolf Cub"), "wolf-cub");
  assert.equal(slugify("The Amulet of Protection"), "the-amulet-of-protection");
  assert.equal(slugify("Alpha Wolf"), "alpha-wolf");
});

test("parseStats reads the bullet block", () => {
  const lines = [
    "* **TEAM:** Village",
    "* **RACE:** Human",
    "* **ALIGNMENT:** Good",
    "* **NIGHT ACTIVITY:** Yes (if the Seer dies)",
  ];
  assert.deepEqual(parseStats(lines), {
    team: "Village",
    race: "Human",
    alignment: "Good",
    night_activity: "Yes (if the Seer dies)",
  });
});

test("parseStats returns empty object when no stats", () => {
  assert.deepEqual(parseStats(["Just a paragraph."]), {});
});
