# Async Werewolf Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the stock Jekyll theme with a custom "Moonlit Field Guide" design system, convert the 96-role markdown wall into structured data rendered as a filterable illustrated gallery, and add an idempotent gpt-image-1 pipeline that gives every role a style-consistent illustration.

**Architecture:** Pure Jekyll + Liquid + vanilla JS + SCSS, no framework/bundler. Roles live in `_data/roles.json` (generated once from the existing `roles.md` by a Node parser); the gallery page renders cards from that data and uses vanilla JS for filter/search and a hash-synced detail modal that preserves all existing `#anchor` links. Role bodies stay as markdown and are rendered with Liquid's `markdownify`. A separate Node script calls OpenAI gpt-image-1 with one shared style prompt to produce `assets/img/roles/<slug>.webp`.

**Tech Stack:** Jekyll (github-pages), SCSS, vanilla JS, Node 24 (ESM, built-in `node --test`), OpenAI `openai` SDK (gpt-image-1). Fonts: Cormorant Garamond, Spectral, IBM Plex Mono.

**Phases (each independently shippable):**
- Phase 1 — Node toolchain + design system + prose pages (ships a fully restyled site)
- Phase 2 — Roles parser → `_data/roles.json` (ships structured data)
- Phase 3 — Filterable gallery + detail modal (ships the new roles experience)
- Phase 4 — gpt-image-1 illustration pipeline (ships role art)

**Reference:** Spec at `docs/superpowers/specs/2026-06-06-async-werewolf-redesign-design.md`.

---

## Phase 1 — Toolchain & Design System

### Task 1: Node project scaffold

**Files:**
- Create: `package.json`
- Modify: `.gitignore`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "async-werewolf-tools",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "description": "Build-time tooling for asyncwerewolf.com (role parser + illustration generator)",
  "scripts": {
    "test": "node --test",
    "parse:roles": "node scripts/parse-roles.mjs",
    "gen:roles": "node scripts/generate-roles.mjs"
  },
  "dependencies": {
    "openai": "^4.77.0"
  }
}
```

- [ ] **Step 2: Ignore node_modules**

Append to `.gitignore`:

```
node_modules
```

- [ ] **Step 3: Install and verify the test runner works**

Run: `npm install && node --test`
Expected: install succeeds; `node --test` exits 0 with "tests 0" (no test files yet is fine — exit code 0).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json .gitignore
git commit -m "chore: add node toolchain for redesign scripts"
```

---

### Task 2: Design tokens and base layout shell

Drop the remote `jekyll-theme-midnight`, supply our own layout + SCSS, keep `jekyll-seo-tag`.

**Files:**
- Modify: `_config.yml`
- Modify: `_layouts/default.html`
- Create: `_sass/_tokens.scss`
- Create: `_sass/_base.scss`
- Modify: `assets/css/style.scss`

- [ ] **Step 1: Update `_config.yml`** — remove the theme, add seo plugin, set a real description.

Replace the `description`, `theme`, and `plugins` keys so the file contains:

```yaml
title: Async Werewolf
email: jacob.e.meacham@gmail.com
description: >-
  A long-form, asynchronous werewolf game. Rules, the Arctic Village setup,
  and a field guide to every role.
baseurl: ""
url: "https://asyncwerewolf.com"
github_username: jacob-meacham

markdown: kramdown
plugins:
  - jekyll-feed
  - jekyll-seo-tag
```

(Delete the `theme: jekyll-theme-midnight` line entirely.)

- [ ] **Step 2: Rewrite `_layouts/default.html`** — custom shell, fonts, header/nav, footer. Remove jQuery/respond/IE cruft.

```html
<!doctype html>
<html lang="{{ site.lang | default: 'en-US' }}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    {% seo %}
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Spectral:ital,wght@0,400;0,600;0,800;1,400&family=IBM+Plex+Mono:wght@400;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="{{ '/assets/css/style.css' | relative_url }}">
  </head>
  <body>
    <header class="site-header">
      <a class="brand" href="{{ '/' | relative_url }}">Async&nbsp;Werewolf</a>
      <nav class="site-nav">
        <a href="{{ '/' | relative_url }}">Rules</a>
        <a href="{{ '/roles' | relative_url }}">Roles</a>
        <a href="{{ '/arctic-village' | relative_url }}">Arctic Village</a>
      </nav>
    </header>

    <main class="site-main {{ page.body_class }}">
      {% unless page.hide_title %}
      <div class="page-head">
        <h1>{{ page.title | default: site.title }}</h1>
      </div>
      {% endunless %}
      {{ content }}
    </main>

    <footer class="site-footer">
      <p>The Arctic Village &middot; 1723 &middot; <a href="{{ '/roles' | relative_url }}">field guide</a></p>
    </footer>

    {% if site.google_analytics %}
    <script async src="https://www.googletagmanager.com/gtag/js?id={{ site.google_analytics }}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '{{ site.google_analytics }}');
    </script>
    {% endif %}
  </body>
</html>
```

- [ ] **Step 2b: Style note** — body content from `index.md`/`arctic-village.md` will be wrapped by `.site-main`; prose styling (Task 3) targets `.site-main` descendants.

- [ ] **Step 3: Create `_sass/_tokens.scss`**

```scss
:root {
  --surface:        oklch(0.21 0.035 235);
  --surface-raised: oklch(0.18 0.030 235);
  --surface-inset:  oklch(0.16 0.025 235);
  --ink:            oklch(0.92 0.015 230);
  --ink-muted:      oklch(0.92 0.015 230 / 0.70);
  --line:           oklch(0.82 0.090 200 / 0.22);
  --moonlight:      oklch(0.82 0.090 200);
  --ember:          oklch(0.72 0.150 28);
  --candle:         oklch(0.85 0.100 95);

  --font-display: "Cormorant Garamond", Georgia, serif;
  --font-body:    "Spectral", Georgia, serif;
  --font-mono:    "IBM Plex Mono", ui-monospace, monospace;

  --measure: 70ch;
  --radius: 10px;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}
```

- [ ] **Step 4: Create `_sass/_base.scss`**

```scss
*, *::before, *::after { box-sizing: border-box; }

html { -webkit-text-size-adjust: 100%; }

body {
  margin: 0;
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-body);
  font-size: 18px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

a { color: var(--moonlight); text-decoration: none; }
a:hover { text-decoration: underline; }

h1, h2, h3, h4 {
  font-family: var(--font-display);
  font-weight: 600;
  line-height: 1.1;
  color: var(--ink);
}

.site-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 24px;
  padding: 20px clamp(20px, 5vw, 56px);
  border-bottom: 1px solid var(--line);
  background: var(--surface-raised);
  flex-wrap: wrap;
}
.brand {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 600;
  letter-spacing: 0.01em;
}
.site-nav {
  display: flex;
  gap: 22px;
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.site-nav a { color: var(--ink-muted); }
.site-nav a:hover { color: var(--moonlight); text-decoration: none; }

.site-main {
  flex: 1;
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding: clamp(28px, 5vw, 64px) clamp(20px, 5vw, 56px);
}

.page-head h1 { font-size: clamp(40px, 7vw, 68px); margin: 0 0 8px; }

.site-footer {
  border-top: 1px solid var(--line);
  background: var(--surface-raised);
  color: var(--ink-muted);
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.06em;
  text-align: center;
  padding: 24px;
}
```

- [ ] **Step 5: Rewrite `assets/css/style.scss`** — drop the `@import "{{ site.theme }}"` line (the theme is gone) and import our partials.

```scss
---
---
@import "tokens";
@import "base";
@import "prose";
@import "roles";
```

- [ ] **Step 6: Build to verify** (creates `_prose`/`_roles` as empty stubs first so the import resolves)

Create empty `_sass/_prose.scss` and `_sass/_roles.scss` (single comment line each: `// filled in later tasks`), then run:

Run: `bundle exec jekyll build`
Expected: build completes with no SCSS import errors; `_site/assets/css/style.css` contains `--moonlight`.

- [ ] **Step 7: Commit**

```bash
git add _config.yml _layouts/default.html _sass/ assets/css/style.scss
git commit -m "feat: custom Moonlit Field Guide layout shell and design tokens"
```

---

### Task 3: Prose styling for rules, Arctic Village, and 404

**Files:**
- Modify: `_sass/_prose.scss`
- Modify: `404.html`

- [ ] **Step 1: Fill `_sass/_prose.scss`** — readable long-form styling scoped to page content.

```scss
.site-main {
  h2 { font-size: 30px; margin: 2.4em 0 0.5em; color: var(--moonlight); }
  h3 { font-size: 23px; margin: 1.8em 0 0.4em; }
  p, ul, ol { max-width: var(--measure); }
  p { margin: 0 0 1.1em; }
  ul, ol { padding-left: 1.3em; }
  li { margin: 0.3em 0; }
  strong { color: var(--ink); font-weight: 600; }

  blockquote {
    margin: 1.4em 0;
    padding: 0.6em 1.2em;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface-raised);
    color: var(--ink-muted);
    font-style: italic;
  }

  hr { border: none; border-top: 1px solid var(--line); margin: 2.4em 0; }

  // first H1 in markdown bodies is redundant with .page-head; hide it on prose pages
  &.prose > h1:first-child { display: none; }
}
```

- [ ] **Step 2: Add `body_class: prose` to the prose pages** — set front matter on `index.md` and `arctic-village.md`.

In `index.md` front matter add `body_class: prose`. In `arctic-village.md` front matter add `body_class: prose` (keep its existing `title:`). For `index.md`, also add `title: The Game` so the header shows a real title instead of the site title.

`index.md` front matter becomes:
```yaml
---
layout: default
title: The Game
body_class: prose
---
```

`arctic-village.md` front matter becomes:
```yaml
---
layout: default
title: The Arctic Village
body_class: prose
---
```

- [ ] **Step 3: Restyle `404.html`**

```html
---
layout: default
title: "404"
hide_title: true
---

<div style="text-align:center; padding: 12vh 0;">
  <p style="font-family: var(--font-mono); letter-spacing:.3em; color: var(--moonlight); margin:0;">DEAD MEN TELL NO TALES</p>
  <h1 style="font-size: clamp(64px, 18vw, 160px); margin:.1em 0;">404</h1>
  <p style="color: var(--ink-muted);">This page was lost to the long winter. <a href="{{ '/' | relative_url }}">Return to the village.</a></p>
</div>
```

- [ ] **Step 4: Build and eyeball**

Run: `bundle exec jekyll serve` then open `http://localhost:4000/`, `/arctic-village`, `/nope` (404).
Expected: dark midnight theme, header/nav/footer present, readable prose, no duplicated H1.

- [ ] **Step 5: Commit**

```bash
git add _sass/_prose.scss index.md arctic-village.md 404.html
git commit -m "feat: prose styling for rules, arctic village, and 404"
```

---

## Phase 2 — Roles Parser

### Task 4: Parser library — stats and slug helpers (TDD)

**Files:**
- Create: `scripts/lib/parse-roles.mjs`
- Test: `scripts/test/parse-roles.test.mjs`

- [ ] **Step 1: Write the failing test**

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test scripts/test/parse-roles.test.mjs`
Expected: FAIL — cannot find module `../lib/parse-roles.mjs`.

- [ ] **Step 3: Write minimal implementation**

```js
// scripts/lib/parse-roles.mjs
export function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")  // drop punctuation
    .trim()
    .replace(/\s+/g, "-");
}

const STAT_KEYS = {
  TEAM: "team",
  RACE: "race",
  ALIGNMENT: "alignment",
  "NIGHT ACTIVITY": "night_activity",
};

export function parseStats(lines) {
  const stats = {};
  for (const line of lines) {
    const m = line.match(/^\*\s+\*\*([A-Z ]+):\*\*\s*(.+?)\s*$/);
    if (!m) break;                 // stats are a contiguous leading block
    const key = STAT_KEYS[m[1].trim()];
    if (!key) break;
    stats[key] = m[2].trim();
  }
  return stats;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test scripts/test/parse-roles.test.mjs`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/parse-roles.mjs scripts/test/parse-roles.test.mjs
git commit -m "feat: role parser slug + stats helpers"
```

---

### Task 5: Parser library — full document parse with variants and items (TDD)

**Files:**
- Modify: `scripts/lib/parse-roles.mjs`
- Modify: `scripts/test/parse-roles.test.mjs`

- [ ] **Step 1: Add failing tests**

Append to `scripts/test/parse-roles.test.mjs`:

```js
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
```

- [ ] **Step 2: Run to verify failure**

Run: `node --test scripts/test/parse-roles.test.mjs`
Expected: FAIL — `parseDocument` is not exported.

- [ ] **Step 3: Implement `parseDocument`**

Append to `scripts/lib/parse-roles.mjs`:

```js
const CATEGORY_BY_H1 = {
  "Village Team": { category: "village", team: "Village" },
  "Wolf Team": { category: "wolf", team: "Wolf" },
  "Advanced Teams": { category: "advanced", team: "Advanced" },
  "Items": { category: "items", team: "" },
};

function stripToc(md) {
  return md.replace(/<!-- START doctoc[\s\S]*?END doctoc[^>]*-->/i, "");
}

function splitBlock(bodyLines) {
  // separate the leading stat bullets from the prose body
  let i = 0;
  while (i < bodyLines.length && /^\*\s+\*\*[A-Z ]+:\*\*/.test(bodyLines[i])) i++;
  const stats = parseStats(bodyLines.slice(0, i));
  const body = bodyLines.slice(i).join("\n").trim();
  return { stats, body };
}

export function parseDocument(markdown) {
  const lines = stripToc(markdown).split("\n");
  const roles = [];
  let current = null;          // current top-level role
  let ctx = { category: "", team: "" };
  let pending = null;          // { target, name, slug, lines }

  const flush = () => {
    if (!pending) return;
    const { stats, body } = splitBlock(pending.lines);
    const entry = {
      name: pending.name,
      slug: pending.slug,
      ...{ team: "", race: "", alignment: "", night_activity: "" },
      ...stats,
      body,
    };
    if (pending.target === "role") {
      entry.category = ctx.category;
      if (!entry.team) entry.team = ctx.team;
      entry.image = `/assets/img/roles/${entry.slug}.webp`;
      entry.image_prompt = "";
      entry.variants = [];
      roles.push(entry);
      current = entry;
    } else {
      current?.variants.push({
        name: entry.name,
        slug: entry.slug,
        night_activity: entry.night_activity,
        body: entry.body,
      });
    }
    pending = null;
  };

  for (const line of lines) {
    const h1 = line.match(/^# (.+?)\s*$/);
    const h2 = line.match(/^## (.+?)\s*$/);
    const h3 = line.match(/^### (.+?)\s*$/);
    if (h1) {
      flush();
      ctx = CATEGORY_BY_H1[h1[1].trim()] || ctx;
      continue;
    }
    if (h2) {
      flush();
      pending = { target: "role", name: h2[1].trim(), slug: slugify(h2[1]), lines: [] };
      continue;
    }
    if (h3) {
      flush();
      pending = { target: "variant", name: h3[1].trim(), slug: slugify(h3[1]), lines: [] };
      continue;
    }
    if (pending) pending.lines.push(line);
  }
  flush();
  return roles;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `node --test scripts/test/parse-roles.test.mjs`
Expected: PASS (all tests, 7 total).

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/parse-roles.mjs scripts/test/parse-roles.test.mjs
git commit -m "feat: parse full roles document with variants and items"
```

---

### Task 6: Parser CLI — generate `_data/roles.json`

**Files:**
- Create: `scripts/parse-roles.mjs`
- Create (generated): `_data/roles.json`

- [ ] **Step 1: Write the CLI**

```js
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
```

- [ ] **Step 2: Run it against the real file**

Run: `npm run parse:roles`
Expected: prints a total near 96 and a category breakdown (village/wolf/advanced/items). `_data/roles.json` is created.

- [ ] **Step 3: Spot-check the output**

Run: `node -e "const r=require('./_data/roles.json'); const s=r.find(x=>x.slug==='seer'); console.log(s.name, s.team, s.night_activity, s.variants.map(v=>v.slug)); console.log('items:', r.filter(x=>x.category==='items').map(x=>x.slug));"`
Expected: Seer shows Village / Yes / its variant slugs (apprentice-seer, insane-seer, naive-seer, paranoid-seer); items lists the-amulet-of-protection, coffee, wolfsbane.

- [ ] **Step 4: Commit**

```bash
git add scripts/parse-roles.mjs _data/roles.json
git commit -m "feat: generate _data/roles.json from roles.md"
```

---

## Phase 3 — Gallery & Detail Modal

### Task 7: Gallery layout rendering cards from data

**Files:**
- Create: `_layouts/roles.html`
- Modify: `roles.md`

- [ ] **Step 1: Create `_layouts/roles.html`**

```html
---
layout: default
---

<div class="roles-toolbar">
  <div class="filter-group" role="group" aria-label="Filter by team">
    <button class="chip is-active" data-filter-team="all">All</button>
    <button class="chip" data-filter-team="village">Village</button>
    <button class="chip chip--wolf" data-filter-team="wolf">Wolf</button>
    <button class="chip" data-filter-team="advanced">Advanced</button>
  </div>
  <button class="chip" data-filter-night aria-pressed="false">Night-active</button>
  <input class="roles-search" type="search" placeholder="Search roles…" aria-label="Search roles">
</div>

<p class="roles-empty" hidden>No roles match that filter.</p>

<div class="roles-grid">
  {% for role in site.data.roles %}
    {% unless role.category == "items" %}
    <button class="role-card" id="{{ role.slug }}"
            data-slug="{{ role.slug }}"
            data-team="{{ role.category }}"
            data-night="{% if role.night_activity != 'No' and role.night_activity != '' %}yes{% else %}no{% endif %}"
            data-name="{{ role.name | downcase }}">
      <span class="role-card__art">
        <img src="{{ role.image | relative_url }}" alt="" loading="lazy"
             onerror="this.classList.add('is-missing')">
      </span>
      <span class="role-card__name">{{ role.name }}</span>
      <span class="role-card__meta role-card__meta--{{ role.category }}">
        {{ role.team | default: 'Item' }}{% if role.night_activity != 'No' and role.night_activity != '' %} &middot; Night{% endif %}
      </span>
    </button>
    {% endunless %}
  {% endfor %}
</div>

<section class="roles-items">
  <h2>Items</h2>
  <div class="roles-grid roles-grid--items">
    {% for role in site.data.roles %}
      {% if role.category == "items" %}
      <button class="role-card role-card--item" id="{{ role.slug }}" data-slug="{{ role.slug }}" data-team="items" data-night="no" data-name="{{ role.name | downcase }}">
        <span class="role-card__name">{{ role.name }}</span>
        <span class="role-card__meta role-card__meta--items">Item</span>
      </button>
      {% endif %}
    {% endfor %}
  </div>
</section>

{% comment %} Hidden detail payloads, one per role; the modal pulls from these. {% endcomment %}
<div hidden>
  {% for role in site.data.roles %}
  <template id="detail-{{ role.slug }}">
    <p class="detail-stats">
      {% if role.team != "" %}<span>TEAM <b>{{ role.team }}</b></span>{% endif %}
      {% if role.race != "" %}<span>RACE <b>{{ role.race }}</b></span>{% endif %}
      {% if role.alignment != "" %}<span>ALIGNMENT <b>{{ role.alignment }}</b></span>{% endif %}
      {% if role.night_activity != "" %}<span>NIGHT <b>{{ role.night_activity }}</b></span>{% endif %}
    </p>
    <div class="detail-body">{{ role.body | markdownify }}</div>
    {% if role.variants and role.variants.size > 0 %}
    <div class="detail-variants">
      {% for v in role.variants %}
      <div class="variant" id="{{ v.slug }}">
        <h3>{{ v.name }}</h3>
        {% if v.night_activity != "" %}<p class="detail-stats"><span>NIGHT <b>{{ v.night_activity }}</b></span></p>{% endif %}
        <div class="detail-body">{{ v.body | markdownify }}</div>
      </div>
      {% endfor %}
    </div>
    {% endif %}
  </template>
  {% endfor %}
</div>

<div class="role-modal" id="role-modal" hidden role="dialog" aria-modal="true" aria-labelledby="role-modal-title">
  <div class="role-modal__backdrop" data-close></div>
  <div class="role-modal__panel" role="document">
    <button class="role-modal__close" data-close aria-label="Close">&times;</button>
    <div class="role-modal__art"><img id="role-modal-img" src="" alt=""></div>
    <h2 id="role-modal-title"></h2>
    <div id="role-modal-content"></div>
  </div>
</div>

<script src="{{ '/assets/js/roles.js' | relative_url }}" defer></script>
```

- [ ] **Step 2: Convert `roles.md`** to use the layout. Replace the entire file with:

```markdown
---
layout: roles
title: Field Guide to Roles
---
```

(The doctoc TOC and inline content are now sourced from `_data/roles.json`; the old markdown body is removed. The generated data already captured every role.)

- [ ] **Step 3: Build to verify cards render**

Run: `bundle exec jekyll build`
Expected: build succeeds; `_site/roles/index.html` (or `_site/roles.html`) contains `class="role-card"` entries and `<template id="detail-seer">`.

- [ ] **Step 4: Commit**

```bash
git add _layouts/roles.html roles.md
git commit -m "feat: roles gallery layout rendered from data"
```

---

### Task 8: Gallery, card, and modal styling

**Files:**
- Modify: `_sass/_roles.scss`

- [ ] **Step 1: Fill `_sass/_roles.scss`**

```scss
.roles-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-bottom: 28px;
}
.filter-group { display: flex; gap: 8px; flex-wrap: wrap; }

.chip {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.06em;
  padding: 7px 14px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: transparent;
  color: var(--ink-muted);
  cursor: pointer;
  transition: background 0.25s var(--ease-out), color 0.25s var(--ease-out);
}
.chip:hover { color: var(--moonlight); }
.chip.is-active { background: var(--moonlight); color: var(--surface); border-color: transparent; }
.chip--wolf { border-color: oklch(0.72 0.15 28 / 0.5); color: var(--ember); }
.chip[data-filter-night][aria-pressed="true"] { background: var(--candle); color: var(--surface); border-color: transparent; }

.roles-search {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 13px;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--surface-inset);
  color: var(--ink);
  min-width: 200px;
}

.roles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 14px;
}
.roles-grid--items { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); }
.roles-items { margin-top: 56px; }
.roles-items h2 { color: var(--moonlight); }

.role-card {
  display: flex;
  flex-direction: column;
  text-align: left;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface-raised);
  color: var(--ink);
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.35s var(--ease-out), border-color 0.35s var(--ease-out);
}
.role-card:hover { transform: translateY(-4px); border-color: var(--moonlight); }
.role-card[data-team="wolf"]:hover { border-color: var(--ember); }
.role-card.is-hidden { display: none; }

.role-card__art {
  display: block;
  aspect-ratio: 1 / 1;
  background: var(--surface-inset);
}
.role-card__art img { width: 100%; height: 100%; object-fit: cover; display: block; }
.role-card__art img.is-missing { opacity: 0; } // graceful: empty well until art exists

.role-card__name {
  font-family: var(--font-display);
  font-size: 21px;
  font-weight: 600;
  padding: 10px 12px 2px;
}
.role-card__meta {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 0 12px 12px;
  color: var(--moonlight);
}
.role-card__meta--wolf { color: var(--ember); }
.role-card__meta--items, .role-card__meta--advanced { color: var(--candle); }
.role-card--item { aspect-ratio: auto; }

.roles-empty {
  font-family: var(--font-mono);
  color: var(--ink-muted);
  padding: 40px 0;
  text-align: center;
}

/* Detail stats (shared by modal + variants) */
.detail-stats {
  display: flex; flex-wrap: wrap; gap: 16px;
  font-family: var(--font-mono); font-size: 11px;
  letter-spacing: 0.05em; color: var(--moonlight);
  margin: 0 0 16px;
}
.detail-stats b { color: var(--ink); }
.detail-body { max-width: var(--measure); }
.detail-variants { margin-top: 24px; border-top: 1px solid var(--line); padding-top: 8px; }
.variant h3 { color: var(--candle); font-size: 20px; }

/* Modal */
.role-modal[hidden] { display: none; }
.role-modal {
  position: fixed; inset: 0; z-index: 50;
  display: flex; align-items: flex-start; justify-content: center;
  padding: clamp(16px, 6vh, 80px) 16px;
  overflow-y: auto;
}
.role-modal__backdrop {
  position: fixed; inset: 0;
  background: oklch(0.12 0.02 235 / 0.7);
  backdrop-filter: blur(2px);
}
.role-modal__panel {
  position: relative;
  width: min(720px, 100%);
  background: var(--surface-raised);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: clamp(20px, 4vw, 40px);
  animation: modal-in 0.4s var(--ease-out);
}
@keyframes modal-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
.role-modal__close {
  position: absolute; top: 12px; right: 14px;
  background: none; border: none; color: var(--ink-muted);
  font-size: 30px; line-height: 1; cursor: pointer;
}
.role-modal__close:hover { color: var(--moonlight); }
.role-modal__art img {
  width: 160px; height: 160px; object-fit: cover;
  border-radius: var(--radius); border: 1px solid var(--line);
  margin-bottom: 16px; background: var(--surface-inset);
}
.role-modal__art img[src=""] { display: none; }
.role-modal h2 { font-size: 38px; margin: 0 0 14px; }

body.modal-open { overflow: hidden; }
```

- [ ] **Step 2: Build and verify**

Run: `bundle exec jekyll build`
Expected: build succeeds; `_site/assets/css/style.css` contains `.role-card`.

- [ ] **Step 3: Commit**

```bash
git add _sass/_roles.scss
git commit -m "feat: gallery, card, and modal styling"
```

---

### Task 9: Filter, search, and hash-synced modal JS

**Files:**
- Create: `assets/js/roles.js`

- [ ] **Step 1: Write the script**

```js
// assets/js/roles.js
(function () {
  const grid = document.querySelector(".roles-grid");
  if (!grid) return;

  const cards = Array.from(document.querySelectorAll(".role-card"));
  const emptyMsg = document.querySelector(".roles-empty");
  const searchInput = document.querySelector(".roles-search");
  const teamButtons = Array.from(document.querySelectorAll("[data-filter-team]"));
  const nightButton = document.querySelector("[data-filter-night]");

  const state = { team: "all", night: false, q: "" };

  function applyFilters() {
    let visible = 0;
    for (const card of cards) {
      const okTeam = state.team === "all" || card.dataset.team === state.team;
      const okNight = !state.night || card.dataset.night === "yes";
      const okQ = !state.q || card.dataset.name.includes(state.q);
      const show = okTeam && okNight && okQ;
      card.classList.toggle("is-hidden", !show);
      if (show) visible++;
    }
    if (emptyMsg) emptyMsg.hidden = visible !== 0;
  }

  teamButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      state.team = btn.dataset.filterTeam;
      teamButtons.forEach((b) => b.classList.toggle("is-active", b === btn));
      applyFilters();
    });
  });

  if (nightButton) {
    nightButton.addEventListener("click", () => {
      state.night = !state.night;
      nightButton.setAttribute("aria-pressed", String(state.night));
      applyFilters();
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      state.q = searchInput.value.trim().toLowerCase();
      applyFilters();
    });
  }

  // ---- Modal + hash sync ----
  const modal = document.getElementById("role-modal");
  const titleEl = document.getElementById("role-modal-title");
  const contentEl = document.getElementById("role-modal-content");
  const imgEl = document.getElementById("role-modal-img");
  let lastFocus = null;

  function openRole(slug) {
    const tpl = document.getElementById("detail-" + slug);
    const card = document.querySelector('.role-card[data-slug="' + slug + '"]');
    if (!tpl || !card) return false;

    titleEl.textContent = card.querySelector(".role-card__name").textContent;
    const cardImg = card.querySelector(".role-card__art img");
    imgEl.src = cardImg && !cardImg.classList.contains("is-missing") ? cardImg.src : "";
    contentEl.replaceChildren(tpl.content.cloneNode(true));

    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add("modal-open");
    modal.querySelector(".role-modal__close").focus();
    if (location.hash !== "#" + slug) history.replaceState(null, "", "#" + slug);
    return true;
  }

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
    if (lastFocus) lastFocus.focus();
  }

  cards.forEach((card) => {
    card.addEventListener("click", () => openRole(card.dataset.slug));
  });

  modal.addEventListener("click", (e) => {
    if (e.target.hasAttribute("data-close")) closeModal();
    // in-modal cross-links like <a href="#alpha-wolf">
    const link = e.target.closest('a[href^="#"]');
    if (link) {
      const slug = link.getAttribute("href").slice(1);
      if (document.getElementById("detail-" + slug)) {
        e.preventDefault();
        openRole(slug);
      }
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) closeModal();
  });

  function syncFromHash() {
    const slug = location.hash.slice(1);
    if (slug && document.getElementById("detail-" + slug)) openRole(slug);
  }
  window.addEventListener("hashchange", syncFromHash);

  applyFilters();
  syncFromHash(); // deep-link support: /roles#amateur-bodyguard opens that role
})();
```

- [ ] **Step 2: Manual verification**

Run: `bundle exec jekyll serve`, open `http://localhost:4000/roles`.
Expected:
- Team chips filter the grid; "Night-active" toggles; search narrows live; empty message appears when nothing matches.
- Clicking a card opens the modal with stats + body + variants.
- URL shows `#<slug>`; Esc / backdrop / × close it and clear the hash.
- Loading `http://localhost:4000/roles#amateur-bodyguard` directly opens that role.
- A cross-link inside a modal (e.g. Seer's link to Alpha Wolf) switches the modal to that role.

- [ ] **Step 3: Verify anchor preservation from Arctic Village**

Open `http://localhost:4000/arctic-village`, click a role link (e.g. Bodyguard).
Expected: lands on `/roles#bodyguard` with that role's modal open.

- [ ] **Step 4: Commit**

```bash
git add assets/js/roles.js
git commit -m "feat: gallery filtering, search, and hash-synced detail modal"
```

---

## Phase 4 — Illustration Pipeline

### Task 10: Prompt assembly and generation helpers (TDD)

**Files:**
- Create: `scripts/lib/prompt.mjs`
- Test: `scripts/test/prompt.test.mjs`

- [ ] **Step 1: Write the failing test**

```js
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
```

- [ ] **Step 2: Run to verify failure**

Run: `node --test scripts/test/prompt.test.mjs`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```js
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
```

- [ ] **Step 4: Run to verify pass**

Run: `node --test scripts/test/prompt.test.mjs`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/prompt.mjs scripts/test/prompt.test.mjs
git commit -m "feat: gpt-image-1 prompt assembly with shared style DNA"
```

---

### Task 11: Generator CLI (idempotent, --only, --force)

**Files:**
- Create: `scripts/generate-roles.mjs`
- Create (runtime output): `assets/img/roles/*.webp`

- [ ] **Step 1: Write the generator**

```js
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
    model: "gpt-image-1",
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
```

- [ ] **Step 2: Dry sanity check without an API key** (verifies arg handling + guard)

Run: `node scripts/generate-roles.mjs --only seer` (with `OPENAI_API_KEY` unset)
Expected: exits 1 printing "Set OPENAI_API_KEY before running." (confirms the guard; no network call).

- [ ] **Step 3: Commit the script** (no images yet)

```bash
git add scripts/generate-roles.mjs
git commit -m "feat: idempotent gpt-image-1 role illustration generator"
```

---

### Task 12: Pilot generation, style review, then full batch

This task has runtime steps requiring `OPENAI_API_KEY` and human review. Do not batch all 96 before the style is approved.

- [ ] **Step 1: Generate the pilot set**

Run: `OPENAI_API_KEY=sk-... node scripts/generate-roles.mjs --only werewolf,seer,bodyguard,villager,alpha-wolf`
Expected: 5 `.webp` files appear in `assets/img/roles/`.

- [ ] **Step 2: Review the pilot in the browser**

Run: `bundle exec jekyll serve`, open `/roles`, inspect the 5 illustrated cards and their modals.
Decision point: do the five read as one consistent set in the Moonlit Field Guide style?
- If not: tune `MASTER_STYLE` in `scripts/lib/prompt.mjs`, re-run `node --test scripts/test/prompt.test.mjs`, then regenerate with `--force --only werewolf,seer,bodyguard,villager,alpha-wolf`. Repeat until approved.

- [ ] **Step 3: Commit the approved pilot + any prompt tuning**

```bash
git add scripts/lib/prompt.mjs assets/img/roles/*.webp
git commit -m "feat: pilot role illustrations + tuned style prompt"
```

- [ ] **Step 4: Batch-generate the rest** (idempotent — skips the 5 pilots)

Run: `OPENAI_API_KEY=sk-... node scripts/generate-roles.mjs`
Expected: generates the remaining roles, skips existing; prints final made/skipped counts.

- [ ] **Step 5: Spot-check a sample of cards in the browser, then commit all art**

Run: `bundle exec jekyll serve`, scan `/roles` for any obviously off illustrations (regenerate individuals with `--force --only <slug>` as needed).

```bash
git add assets/img/roles/*.webp
git commit -m "feat: generate illustrations for all roles"
```

---

## Self-Review

**Spec coverage check:**
- Design system (tokens, type, color, theme) → Tasks 2, 3, 8. ✓
- All pages restyled (index, roles, arctic, 404) → Tasks 2, 3, 7. ✓
- Roles → structured data via parser, content preserved, slugs match anchors → Tasks 4–6. ✓
- Filterable gallery (team/night/search) → Tasks 7–9. ✓
- Detail modal + hash-sync preserving anchor links → Task 9. ✓
- Variants nested in parent, items in own section → Tasks 5, 7. ✓
- gpt-image-1 pipeline: shared style prompt, idempotent, --only/--force, webp → Tasks 10–12. ✓
- Pilot-then-batch rollout, images committed → Task 12. ✓

**Spec deviations (functionally equivalent, noted intentionally):**
- `_data/roles.json` instead of `roles.yml` (Jekyll treats them identically; zero-dependency to write).
- Role bodies kept as markdown + rendered with `markdownify` instead of pre-converted to HTML (simpler, preserves cross-links exactly).
- gpt-image-1 emits webp directly via `output_format` (no image-conversion dependency).

**Placeholder scan:** No TBD/TODO; all code blocks complete.

**Type/name consistency:** `slugify`, `parseStats`, `parseDocument` (Phase 2) consistent across lib + CLI; `MASTER_STYLE`, `buildPrompt`, `subjectFor` (Phase 4) consistent across lib + generator + tests; `data-slug` / `detail-<slug>` / `#<slug>` consistent across layout (Task 7) and JS (Task 9).
