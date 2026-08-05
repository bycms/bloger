# Plan: Bloger — Personal Blog Template Generator & Theme Hub

> Status: **Implementation complete — verified in-browser.** All Q&A answered & recorded below.
> Project root: `c:\Users\Administrator\Desktop\bloger`

---

## Iteration 2 — rework (adopter-facing downloaded project)

User feedback (after first build): the downloaded folder showed raw `{{title}}` tokens when opened
via `file://`, and the intended deliverable is a **self-contained project** with its own editor.

**New downloaded-project architecture (built & verified):**
- The downloaded folder is **JS-driven**, not pre-rendered: `index.html` renders the blog from data
  (localStorage or the `config.js` seed), `edit.html` is an in-project editor.
- `edit.html` lets the adopter edit site settings + posts (Word-like block editor), **switch themes**
  among the packs in `themes/`, and **save to localStorage**. Works over `file://` and Pages.
- `index.html` provides a link to edit each post in `edit.html` (`edit.html?post=<id>`), plus a
  site-level "Edit site" link.
- **Only the selected theme pack ships** by default (`themes/<id>.js` compiled from the theme
  source); more packs can be added later and appear in the switcher.
- Bloger itself no longer needs local persistence — it provides previews, theme selection, theme
  building, and file generation. Its generator page is now a **Word-like trial editor** (no boxes,
  `/` slash menu + Markdown shortcuts) with a live preview.
- Fixed the token bug: templates are compiled into JS packs (`window.THEMES[id]`) and substituted at
  runtime — no raw `{{...}}` ever ships as served HTML.
- New block model (objects): heading, paragraph, quote, list, table, image, code, divider.
- New runtime token contract: `{{title}} {{subtitle}} {{bio}} {{accent}} {{year}} {{editSite}}`
  everywhere; `{{postList}}` on index; `{{postTitle}} {{postDate}} {{postContent}} {{postNav}}
  {{editPost}}` on post. CSS tokens (e.g. `{{accent}}`) are substituted at runtime too.
- `project-src/` holds the downloaded runtime (index.html, edit.html, app.js, edit-app.js,
  editor.js, editor.css). `js/generator.js` compiles the project + theme pack; `js/render.js`
  previews themes the same way the downloaded app renders them.

**Verified in browser:** hub live previews (all 3 themes), generator editor + ZIP download, the
downloaded project over `file://` (index renders, post hash-routing, table block, edit.html editor,
slash menu, markdown convert, localStorage save → index.html reflects edits).

---

## Iteration 3 — single theme + design-token groundwork

- **Removed** `themes/editorial` and `themes/paper`; only `minimal` remains (plus `_starter`).
- **Design-token system** (preparation for block-type-specific font size/color/family, page
  arrangement, corner radius, and more):
  - `js/design.js` — canonical schema module: `Bloger.Design.PAGE_TOKENS`, `BLOCK_TOKENS`
    (heading/paragraph/quote/list/table/image/code), `defaults()`, `merge()`, `cssVars()`,
    `styleBlock()`. Each token → CSS custom property (`--be-…`). Documented as the extension point.
  - Manifests (`minimal`, `_starter`, scaffold starter) carry a `design` section (page + blocks).
  - `js/generator.js` merges theme defaults + adopter overrides → embeds `design` + `designCss`
    (`:root` block) into the compiled pack and seed `config.js`.
  - `project-src/app.js` injects `theme.designCss`; `js/render.js` includes it in previews.
  - `themes/minimal/assets/style.css` consumes `var(--be-…)` (look unchanged by default).
  - Generator page gets a **Design tokens** panel (page tokens + per-block accordions) that updates
    the live preview and the download.
- **Verified:** hub shows only Minimal; design panel renders; changing Text color/Corner radius
  updates the live preview; the compiled pack + seed carry the design; the downloaded project
  applies it over `file://` (red text, Georgia body font, 12px radius confirmed via computed style).
- **Next (future) work:** sidebar layout application for `arrangement`, and adding more design
  tokens (letter-spacing, spacing scale, alignment, etc.).

---

## Iteration 4 — downloads are always self-contained

Reported: a downloaded page served at localhost:3000 still showed raw `{{title}}` — it was the
**theme-builder starter** (`new-theme.html`), which shipped the raw theme template as root
`index.html`.

- **Unified downloads.** Every download — generator **and** theme builder — is now a self-contained
  project with its **own rendering engine (`app.js`)** and **compiled theme packs
  (`themes/<id>.js`)**:
  - root `index.html` = renderable shell (`#app` + theme-style), never raw templates
  - `edit.html`, `app.js`, `edit-app.js`, `editor.js/.css`, `config.js` (seed), `themes/index.js` + pack
  - theme-builder downloads also include `theme-source/` (manifest, templates, assets) for
    registering/customizing the theme in Bloger
- `js/scaffold.js` now builds via the same runtime as the generator (reuses
  `Bloger.Generator.fetchProjectFile` + `sanitizeTemplate`); `new-theme.html` loads `generator.js`.
- **Verified:** assembled the starter project, served it on `:3000` — renders correctly (title
  "My Theme", post list, theme pack + design tokens loaded; no `{{title}}`). The earlier failure
  was serving the old raw-template starter (plus a test-server directory mix-up).

---

## Iteration 5 — shell layout, on-site theme generator, GitHub Pages

1. **Blog display = topbar + foldable sidebar + clean content.** In both the Bloger previews and
   every downloaded folder, the blog renders with: a slim topbar (sidebar toggle, site title,
   Edit), a foldable sidebar listing **every post's title + datetime**, and a clean main content
   area ("the blog itself"). The shell comes from the runtime (`project-src/app.js` + `SHELL_CSS`),
   mirrored by `js/render.js` previews; themes now provide **content-only** templates (hero /
   article) with no header/footer/nav. Sidebar fold state persists in localStorage. Verified over
   `file://` (fold toggle, hash navigation `#/post/<id>`, active highlight, image/code blocks).
2. **On-site theme generator (`new-theme.html`).** Adopters generate themes here: name, tune design
   tokens (shared `Bloger.Design.renderPanel`), live shell preview, **save to this site's
   localStorage** (`bloger:themes`), and **download theme packs** (`themes/<id>.js` +
   `manifest.json` + README). Blog folders no longer contain any theme generator — they ship only
   the rendering engine + theme packs + content editor. `js/scaffold.js` now builds packs (no full
   project); `js/theme-builder.js` drives the page.
3. **GitHub Pages, no server.** Pure static: added `.nojekyll` at the root (so `themes/_starter/`
   is served — Jekyll would drop `_` folders) and inside every downloaded folder; added a
   `.github/workflows/deploy.yml` (actions/deploy-pages) that publishes the repo to Pages on push;
   updated the `file://` banner and README to explain Pages deployment. Relative paths + fetch work
   over Pages' https origin.

## TL;DR

Build **Bloger** as a purely static (no-build) web tool: a hub page (`index.html`) that
1. lists/displays previews of pluggable blog **themes**, and
2. lets an adopter pick a theme, fill in config (title/author/etc.), and download a
   **complete static blog site** as a **ZIP** generated entirely in-browser.

Themes are self-contained folders with a `manifest.json`, discovered at runtime so they can be
added/removed without changing core code. Adopters build their own themes by following a
documented `{{placeholder}}` convention and a bundled theme starter/scaffold.

---

## Confirmed decisions (from user)

| Concern | Decision |
| --- | --- |
| Tech stack | Pure HTML/CSS/JS static, **no build step** — opens directly in browser |
| File generation | **In-browser ZIP download** (client-side only, via JSZip) |
| Theme structure | Each theme = **folder of template files + `manifest.json`** |
| Generated content | A **complete, ready-to-publish static blog site** (not a bare skeleton) |

---

## Architecture overview

### Theme / extension model

- `themes/<theme-id>/` — one folder per theme.
- Required `manifest.json` fields:
  - `id`, `name`, `description`, `version`, `author`
  - `preview` — path to a preview image (or preview HTML)
  - `files` — ordered list of template file entries (source path → target path in the generated project)
  - `config` — schema of user-editable fields (title, author, bio, posts, accent color, etc.)
  - `entry` — which generated page is the blog home page
- **Runtime discovery**: static pages cannot list a directory server-side, so Bloger reads a root
  `themes.json` registry — an index of all themes + their file trees + manifest pointers.
  - Adding/removing a theme = add/remove its folder + re-register in `themes.json`. **No core code changes.**
  - The hub renders options from this registry dynamically.
- Template files use `{{placeholder}}` tokens; the generator substitutes values from the config form.

### Pages

| File | Purpose |
| --- | --- |
| `index.html` | **Hub** — theme gallery with previews, "Generate" entrance per theme, "add your theme" link |
| `preview.html?theme=<id>` | Live preview of one theme in an isolated `<iframe>` with sample content |
| `generator.html?theme=<id>` | Config form (auto-built from manifest) + "Download ZIP" button |
| `new-theme.html` | Scaffold wizard that generates a starter theme folder (downloadable ZIP) |

### Core JS modules

- `js/registry.js` — load `themes.json`, list themes, fetch manifests.
- `js/render.js` — render theme cards / gallery on the hub.
- `js/generator.js` — fetch template files, apply substitutions, zip with JSZip.
- `js/scaffold.js` — build a new-theme starter for adopters.
- `lib/jszip.min.js` — vendored ZIP library (client-side).

### File generation flow

1. User selects a theme → opens `generator.html?theme=<id>`.
2. Form is auto-built from `manifest.config` (text, textarea, color, select inputs).
3. Generator fetches each file listed in `manifest.files` (source under `themes/<id>/`, e.g.
   `index.html`, `post.html`, `assets/style.css`, `assets/main.js`).
4. Substitutes all `{{placeholder}}` tokens (config values; helpers for rendering posts if needed).
5. Builds the final folder structure (home + post template + assets + a generated `config.json`) and
   calls JSZip `.generateAsync({ type: 'blob' })` → triggers a client download
   `bloger-<theme>-<project>.zip`.

---

## Steps (phases)

### Phase A — Skeleton & data model
1. Create folder structure: `index.html`, `preview.html`, `generator.html`, `new-theme.html`,
   `themes.json`, `themes/_starter/` (canonical theme template), `js/`, `css/`, `lib/`. *(parallel with 2)*
2. Define the `manifest.json` schema + write the `themes.json` registry loader in `js/registry.js`.
3. Create **one sample theme** (`themes/minimal/`) with complete files (index.html, post.html,
   assets, preview) demonstrating the `{{placeholder}}` convention.
4. Vendor `lib/jszip.min.js` (JSZip 3.x).

### Phase B — Hub page (`index.html`)
5. Build layout: header, theme gallery grid, footer.
6. `js/render.js` renders theme cards (name, description, preview thumbnail, **Preview** + **Generate**
   buttons) from `themes.json`.
7. Wire buttons: Preview → `preview.html?theme=<id>`; Generate → `generator.html?theme=<id>`.
8. Add an "Add your theme" link → `new-theme.html`.

### Phase C — Preview system
9. `preview.html` builds a sample blog project in-memory (using the generator) and loads it into a
   full-width `<iframe>` via `srcdoc` (works with no server).
10. Add a per-theme "open in new tab" option.

### Phase D — Generator engine
11. `js/generator.js`: fetch theme files, `{{token}}` substitution engine (with nested/config support).
12. `generator.html`: auto-generate config form from `manifest.config`; live validation; **Download ZIP**
    button invoking JSZip; show success + ZIP size.
13. Inject a generated `config.json` + sample posts into the output so the site is complete.

### Phase E — Extensibility & docs
14. `new-theme.html` + `js/scaffold.js`: build a starter theme folder (blank manifest + templates +
    README) that adopters customize; optionally download the starter as a ZIP.
15. `docs/THEME-SPEC.md`: manifest schema, `{{placeholder}}` convention, folder layout, and how to
    register a theme + regenerate `themes.json`.
16. Add a small helper (`js/tools.js` or inline) to regenerate `themes.json` when themes are
    added/removed (manual JSON edit documented as a fallback).

---

## Verification

1. Open `index.html` in a browser (no server) → the sample theme card appears with preview + buttons.
2. Click **Generate** → the form appears with fields from the manifest → fill in → **Download ZIP** →
   unzip and open the generated `index.html` locally → the blog renders with the substituted
   title/author/posts; navigation works.
3. **Preview** button → the iframe shows the theme rendered with sample content.
4. Add a new theme folder + register it in `themes.json` → the hub shows it **without touching core
   code**; generating it produces a working site. Remove the entry → the option disappears.
5. Run `new-theme.html` → download the starter ZIP → unzip → it is a valid theme per spec.
6. No console errors in DevTools across all four pages.

---

## Scope boundaries

**Included:** hub, preview, in-browser ZIP generation, extensible theme system, theme starter, docs.

**Excluded:** server/backend, JS framework or build tooling, git hosting of themes, CMS admin,
deployment/publishing tooling. Themes are downloaded as static sites only.

---

## Q&A (please answer in-file)

> Open decisions awaiting your input. The defaults marked *(rec.)* are my recommendations — reply
> below each item (or edit the bolded answer lines) and I'll proceed.

### Q1 — Post content editing
Should the generator let adopters add **real blog posts**, or ship **sample posts only**?

- **Option A (rec.):** Lightweight "Posts" editor — adopters add title/body per post; the generator
  renders them into the listing and `post.html`.
- **Option B:** Sample posts only — adopters edit the generated HTML by hand afterward.

**Answer:** Option A. Adopter must edit in GUI with predefined blocks.
**Finalized:** Posts editor with **predefined blocks** (heading / paragraph / quote / image) —
editors pick a block type and type content; a numbered-marker shortcut (`#1`, `#3`, `#5`, `#6`) is
also supported internally. Implemented in `generator.html` + `js/generator-page.js` and rendered
via `js/theme.js`.

### Q2 — Theme shape
Should themes be **static multi-file** (index + post + about pages) or **single-page / SPA-style**?

- **Option A (rec.):** Static multi-file — simplest to host anywhere (GitHub Pages, Netlify, etc.).
- **Option B:** Single-page app style with client-side routing.

**Answer:** Option A.

### Q3 — UX niceties
Add **localStorage persistence** for the last-used theme + config, so returning adopters pick up
where they left off?

- **Option A (rec.):** Yes, persist last theme & config.
- **Option B:** No persistence — keep it stateless and simple.

**Answer:** Option A (), plus enabling users to save or load a `config.json` locally to avoid browser cache cleanups.
**Finalized:** localStorage persistence **and** Save/Load `config.json` (in `generator.html`).

### Q4 — Sample themes count
How many **built-in sample themes** should ship with Bloger initially?

- **Option A (rec.):** Two — one minimal, one richer, to demonstrate the range of the system.
- **Option B:** One — minimal only, to keep the first pass lean.
- **Option C:** Three or more.

**Answer:** Option A.

### Q5 — Theme previews
How should theme previews be captured/shown in the gallery?

- **Option A (rec.):** A static `preview.png`/`preview.jpg` per theme (fast, no rendering on load).
- **Option B:** Render the theme live in a small embedded iframe in the gallery card.
- **Option C:** Both (thumbnail image + full live preview page).

**Answer:** Option B. Users may want a clearest view of their themes.
**Finalized:** **Live rendering** — the gallery card embeds a live `<iframe>` preview of the theme's
index page (assets inlined), and `preview.html` offers index/post views + "open in new tab". 

---

## Relevant files

| Path | Purpose |
| --- | --- |
| `index.html` | Hub — theme gallery + entrances (**create**) |
| `preview.html` | Live iframe preview |
| `generator.html` | Config form + ZIP download |
| `new-theme.html` | Theme starter wizard |
| `themes.json` | Runtime registry of themes |
| `themes/<id>/manifest.json` | Per-theme schema |
| `themes/_starter/` | Reference theme template |
| `js/registry.js`, `js/render.js`, `js/generator.js`, `js/scaffold.js` | Core modules |
| `lib/jszip.min.js` | Vendored ZIP lib |
| `docs/THEME-SPEC.md` | Theme authoring guide |