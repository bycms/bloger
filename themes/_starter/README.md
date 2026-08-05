# My Theme (Bloger reference starter)

This folder is a **reference theme source** for Bloger. When you use **Build a theme**
(`new-theme.html`), Bloger compiles it into a **self-contained working blog project** (its own
rendering engine + theme pack + editor) that renders immediately — open `index.html` to view,
`edit.html` to edit.

To register this theme in Bloger:

1. Copy this folder into `themes/my-theme/`.
2. Register it in the root `themes.json` by adding an entry like:

   { "id": "my-theme", "name": "My Theme", "description": "A short blurb" }

3. Serve the project over HTTP (see serve.bat) and it appears in the gallery.

See `docs/THEME-SPEC.md` for the token, block, and design-token conventions.
