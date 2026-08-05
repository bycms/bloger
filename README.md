# Bloger

Holds templates for personal blogs. Bloger provides several UI themes for adopters and generates a
complete, **self-contained blog project folder** — all in the browser, no build step.

- **Preview** themes live on the hub page.
- **Generate** a folder: `index.html` is the blog homepage, `edit.html` is an in-project editor where
  the adopter switches themes, writes posts, and saves to **localStorage**.
- **Extensible** — themes are pluggable folders. Add a folder + register it, and it appears in the
  gallery without touching core code. Build your own themes with the included starter.

## Quick start

The tool uses `fetch()`, which browsers block when opening files over `file://`. Start a local
server:

- Double-click `serve.bat` (requires Python), or run:

  ```bash
  python -m http.server 8080
  ```

- Open <http://localhost:8080> — the Bloger hub appears.

## Pages

| Page | Purpose |
| --- | --- |
| `index.html` | Hub — theme gallery with live previews + Generate entrances |
| `preview.html?theme=<id>` | Full live preview of a single theme (shell layout) |
| `generator.html?theme=<id>` | Trial editor (Word-like block editor) → Download blog project ZIP |
| `new-theme.html` | Theme generator — preview, save to this site's localStorage, download theme packs |

## Project layout

```
bloger/
├── index.html            Hub / theme gallery
├── preview.html          Live theme preview
├── generator.html        Trial editor + project generation
├── new-theme.html        Theme starter wizard
├── themes/               Pluggable themes (folder per theme)
│   ├── minimal/          Default theme — black/grey/white, no radius
│   ├── editorial/        Magazine-style theme with sidebar + accent
│   ├── paper/            Warm serif reading theme
│   └── _starter/         Reference starter theme (for adopters)
├── project-src/          The downloaded project's runtime files
│   ├── index.html        Blog homepage (renders from data)
│   ├── edit.html         In-project editor (theme switch + save)
│   ├── app.js            Renderer + data layer (localStorage/seed)
│   ├── edit-app.js       Editor page logic
│   └── editor.js/.css    Word-like block editor
├── themes.json           Runtime registry of themes
├── js/                   Tool logic (registry, generator, render, etc.)
├── css/tool.css          Tool UI styles
├── lib/jszip.min.js      Client-side ZIP library
├── docs/THEME-SPEC.md    Theme authoring guide
└── serve.bat             Local server launcher
```

## How blogs are displayed

Both the live previews on this site and every downloaded folder render the blog with the same
**shell layout**: a slim **topbar** (sidebar toggle + site title + Edit), a **foldable sidebar**
listing every post's **title + datetime**, and a clean **main content area** showing the blog
itself. Themes provide only the content markup; the shell comes from the runtime so it looks the
same everywhere.

## What the adopter receives

Every **blog folder** download (generator page) is a **self-contained project** with its own
rendering engine and theme packs. It works over `file://` and on **GitHub Pages / Netlify** (a
`.nojekyll` is included):

- **`index.html`** — the blog homepage (shell + foldable sidebar). Upload the folder to Pages.
- **`edit.html`** — the in-project editor: edit site settings and posts, **switch themes** (among the
  packs in the folder), and **save to localStorage**.
- **`app.js`** — the downloaded project's own rendering engine (shell layout).
- **`themes/`** — compiled theme packs (`themes/<id>.js`) + the pack registry (`themes/index.js`).
- **`config.js`** — the seed data (site, posts, design).

Blog folders do **not** include a theme generator — themes are built on this site.

## Building themes (theme generator)

`new-theme.html` generates themes **on this site**: name it, tune its design tokens, preview it
live, **save it to this site's localStorage**, and **download it as a theme pack**
(`themes/<id>.js` + `manifest.json` + README). To use a pack in a blog folder: copy it into the
folder's `themes/`, add it to `themes/index.js`, then pick it in `edit.html`.

## How themes work

Each theme is a folder under `themes/<id>/` with a `manifest.json`, content-only `index.html`/
`post.html` templates (the runtime provides the topbar + sidebar shell), and assets. Templates use
`{{tokens}}` and posts are composed of **blocks** (heading, paragraph, quote, list, table, image,
code, divider). Bloger compiles each theme into a self-contained pack that the downloaded project
renders at runtime. See `docs/THEME-SPEC.md` for the full schema and conventions.

## Design tokens

Bloger ships a design-token system so blogs can be customized without editing theme CSS — page-level
and **block-type-specific** font family/size/weight/color, line height, corner radius, content
width, and page arrangement. Tokens map to CSS custom properties (`--be-…`) consumed by the theme;
the generator's **Design tokens** panel edits them, and they're applied in previews and the
downloaded project. The canonical schema is in `js/design.js` (the extension point for future
tokens), theme defaults live in each manifest's `design` section.

## Extending / adding a theme

1. Use **Build a theme** (`new-theme.html`) to design and save a theme, or copy
   `themes/_starter/` as a reference.
2. To register it as a built-in Bloger theme, copy the theme source into `themes/<your-theme>/`
   and customize `manifest.json`, `index.html`, `post.html`, `assets/`, and the `design` section.
3. Register the theme in `themes.json`:

   ```json
   { "id": "your-theme", "name": "Your Theme", "description": "A short blurb" }
   ```

4. Reload the hub — your theme appears in the gallery, ready to preview and generate.

Removing a theme is just removing its folder and its entry in `themes.json`.

## Run on GitHub Pages (no server)

This project is pure static and deploys to GitHub Pages as-is — no server, no build:

- A `.nojekyll` file is included so Jekyll doesn't drop folders like `themes/_starter/`.
- Relative paths + `fetch()` work fine over Pages' https origin.
- A ready-to-use workflow is at `.github/workflows/deploy.yml`: push to `main` and enable
  **Settings → Pages → Source: GitHub Actions**. Bloger is then served at
  `https://<user>.github.io/<repo>/`.

Downloaded blog folders work the same way — upload the folder to Pages and serve `index.html`.

## Tech notes

- Pure HTML/CSS/JS — no frameworks, no build step.
- ZIP generation happens entirely client-side via JSZip.
- The downloaded project renders from `localStorage` (falling back to `config.js` seed), so
  adopters' edits live in their own browser.
