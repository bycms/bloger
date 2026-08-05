/* ============================================================
 * Bloger — theme generator.
 * Adopters build themes here on the Bloger site: preview, save
 * to localStorage, and download the theme as a compiled pack
 * (themes/<id>.js) to drop straight into a blog folder. The
 * downloaded folder therefore never needs a theme generator.
 * Depends on js/theme.js, js/design.js (Bloger.Design), JSZip.
 * ============================================================ */
var Bloger = window.Bloger || {};

Bloger.Scaffold = {
  THEMES_KEY: "bloger:themes",

  /* ---------- starter theme source ---------- */

  starterManifest: function (themeId, name) {
    return {
      id: themeId,
      name: name || themeId,
      description: "A new Bloger theme.",
      version: "0.1.0",
      author: "You",
      entry: "index.html",
      colors: { bg: "#ffffff", fg: "#111111", muted: "#666666", line: "#e5e5e5" },
      design: Bloger.Design ? Bloger.Design.defaults() : {},
      config: [
        { "key": "title", "label": "Blog title", "type": "text", "default": "My Blog", "required": true },
        { "key": "accent", "label": "Accent color", "type": "color", "default": "#111111" }
      ],
      copy: ["assets/style.css", "assets/main.js"],
      templates: {
        "index.html": { "path": "index.html", "tokens": ["title", "subtitle", "bio", "year"] },
        "post.html": { "path": "post.html", "tokens": ["title", "year", "postTitle", "postDate", "postContent"] }
      }
    };
  },

  // Content-only templates: the runtime shell (topbar + sidebar)
  // is provided by app.js, so these are just the content.
  starterIndexHtml: function () {
    return '<section class="be-hero">\n' +
      '  <h1 class="be-hero-title">{{title}}</h1>\n' +
      '  <p class="be-hero-sub">{{subtitle}}</p>\n' +
      '  <p class="be-hero-bio">{{bio}}</p>\n' +
      '  <p class="be-hero-cta"><a href="edit.html">Write your first post →</a></p>\n' +
      "</section>\n";
  },

  starterPostHtml: function () {
    return '<article class="post">\n' +
      '  <header class="post-head">\n' +
      '    <h1 class="post-title">{{postTitle}}</h1>\n' +
      '    <span class="post-date">{{postDate}}</span>\n' +
      "  </header>\n" +
      '  <div class="post-body">{{postContent}}</div>\n' +
      "</article>\n";
  },

  starterCss: function () {
    return '/* Starter theme styles. Edit freely.\n' +
      '   The Bloger runtime provides the topbar/sidebar shell — this\n' +
      '   stylesheet only styles the content (hero + posts). It reads\n' +
      '   design tokens (--be-*) so adopters can customize. */\n' +
      ':root { --fg: var(--be-text, #111111); --muted: var(--be-muted, #666666); --line: var(--be-border, #e5e5e5); --soft: #f4f4f4; --radius: var(--be-corner-radius, 0px); --body-font: var(--be-body-font, system-ui); }\n' +
      'body { background: var(--be-page-bg, #ffffff); color: var(--fg); font-family: var(--body-font), system-ui, sans-serif; font-size: var(--be-body-size, 16px); line-height: var(--be-body-lh, 1.7); letter-spacing: var(--be-body-ls, 0); text-align: var(--be-text-align, left); }\n' +
      '::selection { background: var(--be-selection-bg, #000000); color: var(--be-selection-fg, #ffffff); }\n' +
      'a { color: var(--be-link-color, var(--fg)); text-decoration: var(--be-link-underline, underline); text-decoration-thickness: var(--be-link-thickness, 1px); }\n' +
      'a:hover { color: var(--be-link-hover-color, var(--fg)); }\n' +
      '.be-hero { padding: 24px 0 8px; }\n' +
      '.be-hero-title { font-family: var(--be-h1-font, inherit); font-size: var(--be-h1-size, 30px); line-height: var(--be-h1-lh, 1.25); font-weight: var(--be-h1-weight, 700); letter-spacing: var(--be-h1-ls, -0.02em); color: var(--be-h1-color, var(--fg)); margin: 0 0 8px; }\n' +
      '.be-hero-sub { color: var(--muted); font-size: 18px; margin: 0 0 12px; }\n' +
      '.be-hero-bio { color: var(--muted); font-size: 15px; margin: 0 0 20px; }\n' +
      '.be-hero-cta a { font-size: 15px; }\n' +
      '.post-title { font-family: var(--be-h1-font, inherit); font-size: var(--be-h1-size, 28px); line-height: var(--be-h1-lh, 1.25); font-weight: var(--be-h1-weight, 700); letter-spacing: var(--be-h1-ls, -0.02em); color: var(--be-h1-color, var(--fg)); margin: 0; }\n' +
      '.post-date { display: inline-block; color: var(--be-small-color, var(--muted)); font-size: var(--be-small-size, 13px); margin-top: 8px; }\n' +
      '.post-head { border-bottom: 1px solid var(--line); padding-bottom: 18px; margin-bottom: 26px; }\n' +
      '.post-body > * + * { margin-top: var(--be-content-gap, 18px); }\n' +
      '.post-body h2 { font-family: var(--be-h2-font, inherit); font-size: var(--be-h2-size, 22px); line-height: var(--be-h2-lh, 1.3); font-weight: var(--be-h2-weight, 700); letter-spacing: var(--be-h2-ls, 0); color: var(--be-h2-color, var(--fg)); margin-top: var(--be-h2-margin, 32px); }\n' +
      '.post-body h3 { font-family: var(--be-h3-font, inherit); font-size: var(--be-h3-size, 19px); line-height: var(--be-h3-lh, 1.3); font-weight: var(--be-h3-weight, 700); letter-spacing: var(--be-h3-ls, 0); color: var(--be-h3-color, var(--fg)); margin-top: var(--be-h3-margin, 26px); }\n' +
      '.post-body p { font-family: var(--be-para-font, inherit); font-size: var(--be-para-size, 16px); line-height: var(--be-para-lh, 1.7); font-weight: var(--be-para-weight, 400); letter-spacing: var(--be-para-ls, 0); color: var(--be-para-color, var(--fg)); text-align: var(--be-para-align, inherit); }\n' +
      '.post-body ul, .post-body ol { font-family: var(--be-list-font, inherit); font-size: var(--be-list-size, 16px); line-height: var(--be-list-lh, 1.7); color: var(--be-list-color, inherit); font-weight: var(--be-list-weight, 400); letter-spacing: var(--be-list-ls, 0); padding-left: var(--be-list-indent, 1.4em); border-radius: var(--be-list-radius, var(--radius)); }\n' +
      '.post-body ul { list-style-type: var(--be-list-marker, disc); }\n' +
      '.post-body ol { list-style-type: var(--be-list-marker, decimal); }\n' +
      '.post-body li::marker { color: var(--be-list-marker-c, var(--muted)); }\n' +
      '.post-body li + li { margin-top: var(--be-list-gap, 2px); }\n' +
      '.post-body a { color: var(--be-link-color, var(--fg)); text-decoration: var(--be-link-underline, underline); text-decoration-thickness: var(--be-link-thickness, 1px); }\n' +
      '.post-body blockquote { background: var(--be-quote-bg, transparent); border-left: var(--be-quote-border-w, 3px) solid var(--be-quote-border, var(--fg)); padding-left: 16px; color: var(--be-quote-color, var(--muted)); font-style: var(--be-quote-style, italic); font-size: var(--be-quote-size, 16px); line-height: var(--be-quote-lh, 1.7); font-weight: var(--be-quote-weight, 400); border-radius: var(--be-quote-radius, var(--radius)); }\n' +
      '.post-body code { background: var(--be-code-bg, var(--soft)); padding: 2px 5px; font-family: var(--be-code-font, ui-monospace, monospace); }\n' +
      '.post-body pre { background: var(--be-code-bg, var(--soft)); padding: var(--be-code-pad, 14px); overflow-x: auto; border-radius: var(--be-code-radius, var(--radius)); font-family: var(--be-code-font, ui-monospace, monospace); font-size: var(--be-code-size, 13px); line-height: var(--be-code-lh, 1.6); }\n' +
      '.post-body img { max-width: var(--be-image-maxw, 100%); height: auto; border-radius: var(--be-image-radius, var(--radius)); box-shadow: var(--be-image-shadow, none); }\n' +
      '.post-body figcaption { color: var(--be-image-cap-c, var(--muted)); font-size: var(--be-image-cap-s, 13px); margin-top: 6px; }\n' +
      '.post-body table { border-collapse: collapse; width: 100%; font-family: var(--be-table-font, inherit); font-size: var(--be-table-size, 14px); line-height: var(--be-table-lh, 1.5); color: var(--be-table-color, inherit); font-weight: var(--be-table-weight, 400); border-radius: var(--be-table-radius, var(--radius)); }\n' +
      '.post-body td, .post-body th { border: 1px solid var(--be-table-border, var(--line)); padding: var(--be-table-cell-p, 8px 10px); text-align: left; }\n' +
      '.post-body th { background: var(--be-table-head-bg, #f4f4f4); color: var(--be-table-head-c, var(--fg)); }\n' +
      '.post-body tbody tr:nth-child(even) { background: var(--be-table-stripe, transparent); }\n' +
      '.post-body tbody tr:hover { background: var(--be-table-hover, rgba(0,0,0,0.04)); }\n' +
      '.post-body hr.post-divider { border: 0; border-top: var(--be-divider-thickness, 1px) var(--be-divider-style, solid) var(--be-divider-color, var(--line)); margin: var(--be-divider-spacing, 28px) 0; }\n';
  },

  starterMainJs: function () {
    return '// Starter theme behavior. The Bloger runtime provides the shell.\n// Add theme behaviour here if you want any.\n';
  },

  starterReadme: function (themeId, name) {
    return '# ' + name + " (theme pack)\n\n" +
      "This zip contains a compiled Bloger theme pack. To use it in a blog folder:\n\n" +
      "1. Copy `themes/" + themeId + ".js` into your blog folder's `themes/` directory.\n" +
      "2. Open the blog folder's `themes/index.js` and add this pack to the registry:\n\n" +
      '   window.THEME_PACKS = [ { "id": "' + themeId + '", "file": "themes/' + themeId + '.js" } ];\n\n' +
      "   (keep any existing entries — a folder can hold many theme packs; the editor's\n" +
      "   theme switcher shows them all).\n\n" +
      "3. Open the blog's `edit.html`, pick the theme from the switcher, and Save.\n\n" +
      "The pack is self-contained (templates, CSS, design tokens and behaviour) and needs no\n" +
      "server. See `docs/THEME-SPEC.md` for the full conventions.\n";
  },

  // Sanitize a theme template to its body markup.
  sanitize: function (html) {
    var s = String(html || "");
    s = s.replace(/<head[\s\S]*?<\/head>/gi, "");
    s = s.replace(/<script\b[^>]*>[\s\S]*?<\/script>|<script\b[^>]*\/>|<link\b[^>]*>/gi, "");
    var m = /<body[^>]*>([\s\S]*)<\/body>/i.exec(s);
    return m ? m[1] : s;
  },

  // Sample post for previewing a theme on the site.
  samplePosts: function () {
    return [
      {
        id: "welcome",
        title: "Welcome to your blog",
        date: new Date().toISOString().slice(0, 10),
        blocks: [
          { type: "heading", text: "Hello!", level: 2 },
          { type: "paragraph", text: "This is a preview of your theme. Posts appear in the sidebar; pick one to read it." }
        ]
      }
    ];
  },

  /* ---------- pack compilation ---------- */

  // Build the compiled pack object for a theme (used for preview + download).
  pack: function (themeId, name, designOverrides) {
    var manifest = Bloger.Scaffold.starterManifest(themeId, name);
    var design = Bloger.Design
      ? Bloger.Design.merge(manifest.design, designOverrides)
      : Bloger.Design.defaults(manifest.design);
    return {
      id: themeId,
      name: name || themeId,
      css: Bloger.Scaffold.starterCss(),
      homeTemplate: Bloger.Scaffold.sanitize(Bloger.Scaffold.starterIndexHtml()),
      postTemplate: Bloger.Scaffold.sanitize(Bloger.Scaffold.starterPostHtml()),
      js: Bloger.Scaffold.starterMainJs(),
      design: design,
      designCss: Bloger.Design ? Bloger.Design.styleBlock(design) : ""
    };
  },

  // Build the compiled pack JS (themes/<id>.js) for a theme.
  packJs: function (themeId, name, designOverrides) {
    return Bloger.Scaffold.packJsFromPack(Bloger.Scaffold.pack(themeId, name, designOverrides));
  },

  // Serialize any compiled pack object to the themes/<id>.js script format.
  packJsFromPack: function (pack) {
    return (
      "/* Compiled Bloger theme pack: " + pack.id + " */\n" +
      "window.THEMES = window.THEMES || {};\n" +
      "window.THEMES[" + JSON.stringify(pack.id) + "] = " + JSON.stringify(pack) + ";\n"
    );
  },

  // Build the files an adopter downloads to install the theme pack.
  build: function (themeId, name, designOverrides) {
    var manifest = Bloger.Scaffold.starterManifest(themeId, name);
    return [
      { name: "themes/" + themeId + ".js", content: Bloger.Scaffold.packJs(themeId, name, designOverrides) },
      { name: "manifest.json", content: JSON.stringify(manifest, null, 2) },
      { name: "README.md", content: Bloger.Scaffold.starterReadme(themeId, name) }
    ];
  },

  // Download the theme pack as a ZIP.
  download: async function (themeId, name, designOverrides) {
    var files = Bloger.Scaffold.build(themeId, name, designOverrides);
    var zip = new JSZip();
    files.forEach(function (f) { zip.file(f.name, f.content); });
    var blob = await zip.generateAsync({ type: "blob" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = themeId + "-theme.zip";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    return blob;
  },

  /* ---------- theme library (site localStorage) ---------- */

  listSaved: function () {
    return Bloger.Library ? Bloger.Library.list() : [];
  },

  saveTheme: function (themeId, name, designOverrides) {
    return Bloger.Library ? Bloger.Library.save(themeId, name, designOverrides) : [];
  },

  removeTheme: function (themeId) {
    return Bloger.Library ? Bloger.Library.remove(themeId) : [];
  },

  /* ---------- saved themes as first-class themes ---------- */

  savedTheme: function (themeId) {
    return Bloger.Library ? Bloger.Library.get(themeId) : null;
  },

  isSaved: function (themeId) {
    return !!Bloger.Scaffold.savedTheme(themeId);
  },

  // Synthetic manifest for a saved theme: the starter manifest carrying the
  // saved design as the theme's defaults, flagged `saved` so the pack
  // builders render starter templates instead of fetching a theme folder.
  savedManifest: function (themeId) {
    var t = Bloger.Scaffold.savedTheme(themeId) || { id: themeId, name: themeId };
    var m = Bloger.Scaffold.starterManifest(t.id, t.name);
    m.saved = true;
    if (t.design) m.design = Bloger.Design.defaults(t.design);
    return m;
  },

  // A compiled pack from a resolved design (starter templates + design CSS).
  packWithDesign: function (themeId, name, design) {
    return {
      id: themeId,
      name: name || themeId,
      css: Bloger.Scaffold.starterCss(),
      homeTemplate: Bloger.Scaffold.sanitize(Bloger.Scaffold.starterIndexHtml()),
      postTemplate: Bloger.Scaffold.sanitize(Bloger.Scaffold.starterPostHtml()),
      js: Bloger.Scaffold.starterMainJs(),
      design: design || {},
      designCss: Bloger.Design ? Bloger.Design.styleBlock(design) : ""
    };
  },

  // Saved design as theme defaults + adopter overrides on top.
  savedPack: function (themeId, designOverrides) {
    var t = Bloger.Scaffold.savedTheme(themeId) || { id: themeId, name: themeId };
    var base = Bloger.Design.defaults(t.design || {});
    var design = Bloger.Design.merge(base, designOverrides);
    return Bloger.Scaffold.packWithDesign(themeId, t.name, design);
  }
};

window.Bloger = Bloger;
