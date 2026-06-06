# Async Werewolf Redesign — Design Spec

**Date:** 2026-06-06
**Status:** Approved (pending spec review)
**Site:** asyncwerewolf.com (Jekyll, GitHub Pages, static)

## Goal

Two outcomes:

1. Replace the off-the-shelf `jekyll-theme-midnight` with a custom, high-craft design system so the whole site looks intentional.
2. Give the ~96 roles AI-generated illustrations in one consistent art style, and a browsing experience built around them.

Design direction and key choices were validated interactively (impeccable skill + visual companion). The chosen direction is **"Moonlit Field Guide"**.

## Constraints

- **Static site.** GitHub Pages serves only pre-built files. AI images must be generated ahead of time and committed to the repo. No build-time generation.
- **Custom domain** `asyncwerewolf.com` (CNAME present).
- **Existing anchor links must keep working.** `arctic-village.md` links to `/roles#<slug>` anchors (e.g. `/roles#amateur-bodyguard`). The redesign must preserve every one of these.
- Build stays pure Jekyll + Liquid + vanilla JS + SCSS. No JS framework, no bundler.

## Design System: "Moonlit Field Guide"

A naturalist's nocturnal field guide read by candlelight. Cold, not cozy. Dark, but tinted midnight-blue, never warm-black or pure `#000`/`#fff`. Deliberately avoids the werewolf cliché of black + blood-red + full moon.

### Color tokens (OKLCH)

| Token | Value | Use |
|---|---|---|
| `--surface` | `oklch(0.21 0.035 235)` | page base |
| `--surface-raised` | `oklch(0.18 0.03 235)` | cards, header |
| `--surface-inset` | `oklch(0.16 0.025 235)` | illustration wells |
| `--ink` | `oklch(0.92 0.015 230)` | body text |
| `--ink-muted` | `oklch(0.92 0.015 230 / 0.7)` | secondary text |
| `--moonlight` | `oklch(0.82 0.09 200)` | primary accent / Village team |
| `--ember` | `oklch(0.72 0.15 28)` | Wolf team signal only (sparing) |
| `--candle` | `oklch(0.85 0.10 95)` | small highlight (eyes, sparks) |

Neutrals are tinted toward the midnight hue; never pure black/white.

### Typography

- **Display / headings:** Cormorant Garamond (500/600).
- **Body:** a readable serif — Spectral or EB Garamond. Body measure capped 65–75ch.
- **Labels / stats / kickers:** IBM Plex Mono.
- Hierarchy via scale + weight, ratio ≥1.25 between steps.

### Motion

- Ease-out exponential curves only (no bounce/elastic). Never animate layout properties.

### Pages in scope

- `index.md` — rules (styled long-form prose).
- `roles.md` — converted to a filterable gallery (see below).
- `arctic-village.md` — game setup (styled prose, role links preserved).
- `404.html` — themed.
- Shared header/nav + footer applied via `_layouts/default.html`.

## Roles Architecture

The ~50KB single-page `roles.md` is converted into structured data.

### Data model — `_data/roles.yml`

Each role:

- `name` — display name
- `slug` — anchor id (matches existing `#anchors` exactly)
- `team` — Village | Wolf | Advanced
- `race`, `alignment` — strings (may be empty for items)
- `night_activity` — string (e.g. "Yes", "No", "Yes (if the Seer dies)")
- `category` — village | wolf | advanced | items
- `variants[]` — nested sub-roles (the `###` entries, e.g. Insane Seer under Seer): `{ name, slug, night_activity, body }`
- `body` — HTML (converted from the markdown, cross-links preserved)
- `image` — path to generated illustration (e.g. `/assets/img/roles/werewolf.webp`)
- `image_prompt` — per-role subject prompt for the generator

### Parser script — `scripts/parse-roles.mjs`

One-time (re-runnable) Node script that reads the current `roles.md` and emits `_data/roles.yml`.

- Splits on `# <Team>` (Village Team / Wolf Team / Advanced Teams / Items) to assign `category`/`team`.
- `## Name` = top-level role; `### Name` = variant nested under the preceding role.
- Parses the `* **TEAM:** ...` bullet block into structured fields; remaining markdown becomes `body` HTML.
- Preserves all internal `[text](#slug)` cross-links.
- Slugs match doctoc's existing anchors so external/internal links keep working.
- Seeds a default `image_prompt` per role (editable afterward).

The original `roles.md` content is fully represented in the data; nothing is retyped by hand or dropped.

### Gallery page — `roles.md` (rendered from data)

- Grid of role **cards**: illustration, name, team-colored `TEAM · NIGHT` label.
- **Filter bar:** All / Village / Wolf / Advanced, a "Night-active" toggle, and live text search. All client-side vanilla JS over the rendered DOM. No build step.
- **Detail view:** clicking a card opens a modal/panel with full `body` + nested `variants`. URL hash syncs both directions:
  - Opening a role sets `#<slug>`.
  - Loading `/roles#<slug>` auto-opens that role's detail.
  - This preserves every existing anchor link from `arctic-village.md`.
- Top-level roles get cards. Variants live inside the parent's detail view. Items (Amulet, Coffee, Wolfsbane) render in a small separate section.
- Each card/detail carries `id="<slug>"` so hash navigation and any old deep links resolve.

## AI Illustration Pipeline

### Style consistency strategy

A single **master style prompt** constant encodes the Field Guide DNA: nocturnal naturalist specimen plate, cold moonlit palette (midnight blue + moonlight cyan, ember-red only for wolves), ink linework, consistent framing, lighting, and composition. Every image = master prompt + the role's `image_prompt` subject. This is what makes 96 images read as one matched set.

### Generator — `scripts/generate-roles.mjs`

- Node script calling **OpenAI gpt-image-1**; API key from env (`OPENAI_API_KEY`).
- Reads roles + `image_prompt` from `_data/roles.yml`.
- Writes `assets/img/roles/<slug>.webp`.
- **Idempotent:** skips slugs whose image already exists unless `--force`.
- `--only <slug>[,<slug>]` to (re)generate specific roles.
- Logs a manifest of what was generated/skipped.

### Rollout

1. **Pilot:** generate ~5 (Werewolf, Seer, Bodyguard, Villager, Alpha Wolf).
2. Review in the visual companion; tune the master prompt together.
3. **Batch:** generate the remaining roles.
4. Commit generated images to the repo (required for static hosting).

## Out of Scope

- No backend, CMS, or build-time image generation.
- No JS framework or bundler.
- No content rewrites of the rules text (styling only).
- Individual per-role pages (decided against in favor of modal + hash-sync).

## Open Questions

None outstanding. Detail view resolved as modal + hash-sync (not per-role pages).
