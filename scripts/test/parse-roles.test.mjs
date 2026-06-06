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

import { parseDocument } from "../lib/parse-roles.mjs";

const SAMPLE = `<!-- START doctoc -->
- [Seer](#seer)
<!-- END doctoc -->

# Village Team

## Seer
* **TEAM:** Village
* **RACE:** Human
* **ALIGNMENT:** Good
* **NIGHT ACTIVITY:** Yes

Each night, scan a player. See [Alpha Wolf](#alpha-wolf).

### Insane Seer
* **TEAM:** Village
* **RACE:** Human
* **ALIGNMENT:** Good
* **NIGHT ACTIVITY:** Yes

You always get incorrect results.

# Wolf Team

## Alpha Wolf
* **TEAM:** Wolf
* **RACE:** Lycan
* **ALIGNMENT:** Evil
* **NIGHT ACTIVITY:** Yes

Seen as "not a wolf" on the first scan.

# Items

## Coffee

Restore a once-per-game ability.
`;

test("parseDocument strips TOC and builds roles", () => {
  const roles = parseDocument(SAMPLE);
  const seer = roles.find((r) => r.slug === "seer");
  assert.equal(seer.name, "Seer");
  assert.equal(seer.category, "village");
  assert.equal(seer.team, "Village");
  assert.equal(seer.night_activity, "Yes");
  assert.match(seer.body, /Each night, scan a player/);
  assert.match(seer.body, /\[Alpha Wolf\]\(#alpha-wolf\)/); // cross-link preserved
});

test("variants nest under their parent role", () => {
  const roles = parseDocument(SAMPLE);
  const seer = roles.find((r) => r.slug === "seer");
  assert.equal(seer.variants.length, 1);
  assert.equal(seer.variants[0].slug, "insane-seer");
  assert.match(seer.variants[0].body, /incorrect results/);
});

test("items have category items and no stats", () => {
  const roles = parseDocument(SAMPLE);
  const coffee = roles.find((r) => r.slug === "coffee");
  assert.equal(coffee.category, "items");
  assert.equal(coffee.team, "");
  assert.match(coffee.body, /once-per-game/);
});

test("wolf roles get category wolf", () => {
  const roles = parseDocument(SAMPLE);
  assert.equal(roles.find((r) => r.slug === "alpha-wolf").category, "wolf");
});
