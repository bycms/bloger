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

---

## Iteration 6 — expanded design tokens (a theme rules the whole site)

### Principle

A theme rules **all** of the adopter's blog site. The design-token system must therefore cover
every visible element — not just the post body — so adopters can restyle anything without touching
CSS. Today the schema covers page basics + per-block typography; this section enumerates the full
token surface we should implement.

**Convention.** Every token is a CSS custom property `--be-<scope>-<name>` declared on `:root` by
`Bloger.Design.styleBlock()` and consumed by (a) the **shell CSS** (topbar/sidebar/footer — the
`SHELL_CSS` in `project-src/app.js` and `js/render.js`) and (b) **theme stylesheets**
(`var(--be-…)` with fallbacks). New tokens are added by extending the schema in `js/design.js`
(and the UI panel auto-renders them); every new token gets a fallback equal to today's look so
existing themes stay identical.

**Scopes** (prefixes): `page`, `topbar`, `sidebar`, `footer`, `content`, `h1`/`h2`/`h3`, `link`,
`small`, `block-<type>`.

### 1. Page & layout (`--be-page-*` / global)

| Token | Type | Default | Notes |
| --- | --- | --- | --- |
| `--be-page-bg` | color | `#ffffff` | (have) page background |
| `--be-text` | color | `#111111` | (have) base text |
| `--be-muted` | color | `#6b6b6b` | (have) secondary text |
| `--be-border` | color | `#e0e0e0` | (have) borders/dividers |
| `--be-accent` | color | site accent | (runtime) links/active/emphasis |
| `--be-corner-radius` | number/px | `0` | (have) global radius default |
| `--be-max-width` | number/px | `680` | (have) content width |
| `--be-body-font` | font | `system-ui` | (have) base font |
| `--be-body-size` | number/px | `16` | **new** base font size |
| `--be-body-lh` | number | `1.7` | **new** base line height |
| `--be-body-ls` | number | `0` | **new** base letter-spacing |
| `--be-text-align` | select | `left` | left / justify / center |
| `--be-content-gap` | number/px | `18` | **new** vertical rhythm between blocks |
| `--be-content-bg` | color | transparent | **new** reading surface |
| `--be-page-bg-image` | url | — | **new** optional background image |
| `--be-selection-bg` | color | auto | **new** ::selection background |
| `--be-selection-fg` | color | auto | **new** ::selection text |
| `--be-focus-ring` | color | accent | **new** keyboard focus outline |

### 2. Topbar (`--be-topbar-*`)

| Token | Type | Default | Notes |
| --- | --- | --- | --- |
| `--be-topbar-bg` | color | page-bg | **new** |
| `--be-topbar-fg` | color | text | **new** title color |
| `--be-topbar-border` | color | border | **new** bottom border |
| `--be-topbar-height` | number/px | `52` | **new** |
| `--be-topbar-font` | font | body-font | **new** |
| `--be-topbar-title-size` | number/px | `17` | **new** |
| `--be-topbar-title-weight` | select | `700` | **new** |
| `--be-topbar-sticky` | select | `yes` | **new** sticky / static |
| `--be-topbar-shadow` | select | `none` | **new** on scroll |
| `--be-toggle-radius` | number/px | corner-radius | **new** ☰ button radius |

### 3. Sidebar (`--be-sidebar-*`)

| Token | Type | Default | Notes |
| --- | --- | --- | --- |
| `--be-sidebar-bg` | color | page-bg | **new** |
| `--be-sidebar-fg` | color | text | **new** |
| `--be-sidebar-border` | color | border | **new** right border |
| `--be-sidebar-width` | number/px | `262` | **new** expanded width |
| `--be-sidebar-item-radius` | number/px | `0` | **new** |
| `--be-sidebar-item-padding` | string | `8px 10px` | **new** |
| `--be-sidebar-title-size` | number/px | `14` | **new** |
| `--be-sidebar-title-weight` | select | `600` | **new** |
| `--be-sidebar-date-size` | number/px | `12` | **new** |
| `--be-sidebar-date-color` | color | muted | **new** |
| `--be-sidebar-hover-bg` | color | subtle | **new** |
| `--be-sidebar-active-bg` | color | subtle | **new** |
| `--be-sidebar-active-bar` | color | accent | **new** left indicator |
| `--be-sidebar-head-size` | number/px | `11` | **new** "Posts" label |
| `--be-sidebar-gap` | number/px | `2` | **new** item spacing |

### 4. Footer (`--be-footer-*`)

| Token | Type | Default | Notes |
| --- | --- | --- | --- |
| `--be-footer-bg` | color | page-bg | **new** |
| `--be-footer-fg` | color | muted | **new** |
| `--be-footer-border` | color | border | **new** top border |
| `--be-footer-size` | number/px | `12` | **new** |
| `--be-footer-padding` | string | `14px 24px` | **new** |

### 5. Typography hierarchy (`--be-h1/2/3-*`, `--be-small-*`, `--be-mono-*`)

Today `heading` is one token set applied to `h2`/`h3`. Split into per-level tokens (fallbacks keep
the current look):

| Token | Type | Default |
| --- | --- | --- |
| `--be-h1-size` / `-weight` / `-lh` / `-ls` / `-color` / `-font` / `-margin` | number/px, select, number, number, color, font, string | 30 / 700 / 1.25 / -0.02em / text / body / 0 |
| `--be-h2-size` … | same | 22 / 700 / 1.3 / 0 / text / body / 34px top |
| `--be-h3-size` … | same | 19 / 700 / 1.3 / 0 / text / body / 28px top |
| `--be-small-size` / `-color` | number/px, color | 13 / muted (dates, captions, meta) |
| `--be-mono-font` | font | ui-monospace stack |

### 6. Links (`--be-link-*`)

| Token | Type | Default |
| --- | --- | --- |
| `--be-link-color` | color | text/accent |
| `--be-link-hover-color` | color | accent |
| `--be-link-underline` | select | underline / none / dotted |
| `--be-link-underline-thickness` | number/px | 1 |

### 7. Per-block tokens (each `--be-<block>-*`)

Already present for every block: `-font`, `-size`, `-lh`, `-color`, `-weight`, `-radius`.
**Expand each block with:**

| New token | Applies to | Type | Default |
| --- | --- | --- | --- |
| `-letter-spacing` | all text blocks | number | 0 |
| `-margin-top` / `-margin-bottom` | all blocks | number/px | theme rhythm |
| `-text-align` | text blocks | select | inherit |
| `-background` | quote, code | color | transparent/soft |
| `-border-color` / `-border-width` / `-border-style` | quote, table, code, image | color/px/select | border/solid |
| `-border-left-width` | quote | number/px | 3 |
| `-padding` | code | string | 14px |
| `-marker-type` / `-marker-color` / `-indent` / `-item-gap` | list | select/color/px/px | disc / muted / 1.4em / 2px |
| `-cell-padding` | table | string | 8px 10px |
| `-header-bg` / `-header-color` | table | color | subtle / text |
| `-row-stripe-bg` / `-row-hover-bg` | table | color | — |
| `-shadow` | image, table, code | select | none |
| `-max-width` | image | percent/px | 100% |
| `-caption-size` / `-caption-color` | image | number/px, color | 13 / muted |
| `-style` / `-thickness` / `-spacing` | divider | select/px/px | solid / 1 / 28px |

### 8. Motion (`--be-motion-*`) — optional

`--be-transition-duration` (s), `--be-transition-ease`, `--be-hover-lift` (bool), `--be-fade-in`
(bool). Applied to shell hover states and reveal.

### 9. Color scheme / dark mode (future)

A `scheme` select (`light` / `dark` / `auto`) plus a full `--be-dark-*` counterpart set applied
under `@media (prefers-color-scheme: dark)` — lets a theme ship light + dark out of the box.

### Implementation notes

- **Schema:** extend `js/design.js` — add `SHELL_TOKENS` (topbar/sidebar/footer), `TYPE_TOKENS`
  (h1/h2/h3/small/link/mono), and grow each block set with the new keys. `defaults/merge/cssVars/
  styleBlock` and the auto-rendered panel pick them up automatically.
- **Consumption:** the shell CSS (`SHELL_CSS` in `app.js` + `render.js`) switches hard-coded
  values to `var(--be-topbar-*, …)` etc.; theme stylesheets consume block/typography vars.
- **Coverage checklist:** every rendered element maps to tokens — page → layout; topbar/sidebar/
  footer → shell; headings/links/meta → typography; blockquote/list/table/image/code/divider →
  per-block; all gaps/borders/radius → rhythm & shape.
- **Backward compatible:** all new tokens default to the current look, so `minimal` and existing
  packs are unchanged until the adopter customizes.

### Implementation stages (Iteration 6 rolled out in stages)

| Stage | Scope | Status |
| --- | --- | --- |
| **1 — Schema + panel + shell** | Rewrite `js/design.js` as a scoped token schema (`page` / `shell{topbar,sidebar,footer}` / `typography{h1,h2,h3,small,link}` / `blocks` + `divider` / `motion`). The **generate page** (`generator.html`) design panel renders every scope with accordions and edits live-update the preview. Shell CSS (`SHELL_CSS` in `js/render.js` + `project-src/app.js`) consumes topbar/sidebar/footer/motion tokens. | **DONE** |
| **2 — Theme CSS consumption** | `themes/minimal/assets/style.css`, `themes/_starter/assets/style.css`, `js/scaffold.js` `starterCss` consume the new page/typography/link/block tokens (body size/lh/ls, content-gap, h1–h3, small, links, quote/list/table/image/code/divider). All fallbacks equal today's look. | **DONE** |
| **3 — Downloads + theme builder parity** | `Bloger.Generator.compilePack` and `Bloger.Scaffold.pack` already embed the full resolved design + `:root` block; verify a generated ZIP's `config.js`/`themes/<id>.js` carry the new scopes and that `new-theme.html` saved themes round-trip. | Next |
| **4 — Data tokens → real layout/decoration** | Wire the `cssVar:null` tokens (`page.arrangement`, `page.pageDecoration`, `topbar.sticky`, `topbar.shadow`) into the shell/theme CSS (arrangement toggles sidebar, decorations add frame/shadow/pattern, etc.). | Later |
| **5 — Remaining spec gaps** | `--be-page-bg-image`, `--be-mono-font`, link `-underline-thickness` name alignment, dark-mode `scheme` (Iteration 6 §9), and per-block `margin-bottom`. | Later |
| **6 — Themes apply to every page** | `Bloger.Design.applyToPage`/`applyThemeToTool` + `TOOL_PALETTE`/`EDITOR_PALETTE`: Bloger tool pages (hub/generator/preview/theme-builder) inject the active theme's design tokens (palette/font/radius, layout kept); the downloaded editor (`edit.html`) adopts tokens via `applyEditorTheme`; `app.js` now injects the theme stylesheet **after** the shell CSS so a theme can restyle the whole adopter page (topbar/sidebar/footer), not just the article. | **DONE** |

Iteration 7 (arrangements / decorations / animations / logic owned by theme packs) builds on the
finished token surface — see the next section.

---

## Iteration 7 — beyond tokens: themes own arrangements, decorations, animations & logic

### Principle

Design tokens make common knobs easy, but they can never cover everything a customizer wants.
Themes must be able to **own** structure (arrangements), visual flourish (decorations), motion
(animations) and behaviour (logic) — not just recolor. So the pack contract grows from
"tokens + content CSS" into a full **theme extension surface**:

> tokens (knobs) + layout (structure) + shell CSS (chrome decoration) + assets (images/SVG) +
> script hooks (behaviour)

The runtime stays self-contained; everything a theme adds is compiled into its pack, so downloads
keep working over `file://` and Pages with no build step.

### 1. Arrangements (layout structure)

- **Slot model.** The shell becomes composable slots — `topbar / sidebar / content / footer`. The
  runtime renders slots; a theme can restyle or hide them via its shell CSS, and the manifest can
  enable/disable slots per view.
- **Layout presets.** New manifest field `layout: "default" | "centered" | "magazine" | "split" |
  …` selects a runtime shell variant (where the topbar sits, whether/whence the sidebar appears,
  footer width). The adopter-facing `arrangement` token (single-column / with-sidebar) stays as an
  override *on top of* the preset.
- **Fully custom layout.** A theme may ship its own `layout.html` with slot placeholders
  (`{{slot:content}}`). If present, the runtime uses it instead of the default shell — full
  structural freedom (custom header art, hero, grids, side rails).
- **Responsive.** Each preset ships sensible media-query behaviour; theme shell CSS can override
  per-breakpoint.

### 2. Decorations (visual flourish)

- **Shell stylesheet (`shellCss`).** The pack gains a theme-authored stylesheet for the
  topbar/sidebar/footer, injected **after** the runtime shell CSS so the cascade lets a theme
  restyle the chrome (borders, shadows, patterns, gradient headers, background art).
- **Decoration assets.** Packs may embed images/SVG (data URIs or bundled files under `themes/`)
  for patterns, flourishes and hero art, referenced from `shellCss`/`css`.
- **Decoration tokens.** Add preset tokens such as `--be-page-decoration` (none / frame / soft
  shadow / pattern), `--be-shadow-color`/`--be-shadow-blur`, `--be-hero-style` — "preset" knobs
  that map to CSS classes/variables consumed by the theme or the shell.
- **Content decorations.** The per-block border/background/shadow tokens from Iteration 6 let a
  theme decorate the reading area itself.

### 3. Animations (motion)

- **Motion tokens** as a shared baseline: `--be-duration`, `--be-easing` (+ `prefers-reduced-
  motion` handling) so theme CSS animates consistently and accessibly.
- **View-transition hooks.** On `#/post/<id>` navigation the runtime re-renders content; it toggles
  `body.be-switching` and adds `.be-view-enter` to the content so themes can fade/slide each view
  in with pure CSS.
- **Scroll / entrance effects.** Theme JS can use `IntersectionObserver` directly (or the runtime
  helper `Blog.observe(el, onEnter)`); themes animate `.be-content` children on reveal.
- **Decorative motion** (hover lift, gradient shift, card tilt) is theme CSS driven by the motion
  tokens — no runtime change needed.

### 4. Logic (behaviour)

- **Theme script API** (on the runtime's global `Blog`):
  - `Blog.onReady(fn)` / `Blog.onView(fn)` — hooks run after each render (home/post) and on load,
    receiving the content container + current view + data, so themes can attach per-view behaviour:
    lightbox, table-of-contents, reading progress, syntax highlighting, comments, "next/prev".
  - `Blog.getData()` / `Blog.save(data)` — read/write the blog's site/posts/design so themes can
    implement features such as search, tags, archives and stats.
  - `Blog.els(sel)` — query helper scoped to the rendered app.
- **Declarative features.** Manifest `features` (e.g. `{"lightbox": true, "readingProgress": false}`)
  renders as checkboxes in the editor and becomes runtime config for `theme.js` — adopters can turn
  a theme's logic on/off without editing code.
- **Sandbox note.** `theme.js` is bundled into the self-contained pack and runs in the adopter's
  page; it must stay dependency-free (or carry its own deps inside the pack).

### 5. Pack contract (concrete)

The compiled pack object grows to:

```js
{
  id, name,
  css,                 // content stylesheet (have)
  homeTemplate, postTemplate,   // content-only templates (have)
  layout,              // preset id                 (new)
  layoutHtml,          // optional custom shell with {{slot:content}} (new)
  shellCss,            // theme chrome stylesheet   (new)
  assets,              // { name: dataURI } decoration assets (new)
  features,            // manifest themeOptions     (new)
  js,                  // theme behaviour using Blog hooks (new API)
  design, designCss    // design tokens (have)
}
```

- **Compilers** (`js/generator.js`, `js/scaffold.js`) fetch the new files (`layout.html`,
  `shell.css`, `assets/`, `theme.js`) and embed them in the pack; `js/design.js` adds the
  decoration/motion tokens; `js/render.js` previews mirror the new runtime.
- **Runtime** (`project-src/app.js`) renders slots from `layout`/`layoutHtml`, injects `shellCss`
  after the runtime shell CSS, calls the theme's `onReady`/`onView` hooks, and honours
  `prefers-reduced-motion`.
- **Backward compatible:** packs without the new fields keep today's default shell/layout, so
  `minimal` and existing themes are unchanged.

### 6. Build order

1. Slot-based shell + `layout` presets + manifest field.
2. `shellCss` + decoration assets in the pack.
3. Motion tokens + view-transition classes + reduced-motion.
4. Theme script API (`onReady`/`onView`, data access) + `features` editor toggles.
5. Docs (`docs/THEME-SPEC.md`) + a second richer sample theme demonstrating all four capabilities.

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