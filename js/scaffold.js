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
      ':root { --fg: var(--be-text, #111111); --muted: var(--be-muted, #666666); --line: var(--be-border, #e5e5e5); --soft: #f4f4f4; --body-font: var(--be-body-font, system-ui); }\n' +
      'body { background: var(--be-page-bg, #ffffff); color: var(--fg); font: 16px/1.7 var(--body-font), system-ui, sans-serif; }\n' +
      'a { color: var(--fg); }\n' +
      '.be-hero { padding: 24px 0 8px; }\n' +
      '.be-hero-title { font-size: 30px; line-height: 1.25; margin: 0 0 8px; }\n' +
      '.be-hero-sub { color: var(--muted); font-size: 18px; margin: 0 0 12px; }\n' +
      '.be-hero-bio { color: var(--muted); font-size: 15px; margin: 0 0 20px; }\n' +
      '.post-title { font-size: 28px; line-height: 1.25; margin: 0; }\n' +
      '.post-date { display: inline-block; color: var(--muted); font-size: 13px; margin-top: 8px; }\n' +
      '.post-head { border-bottom: 1px solid var(--line); padding-bottom: 18px; margin-bottom: 26px; }\n' +
      '.post-body > * + * { margin-top: 18px; }\n' +
      '.post-body h2 { font-size: var(--be-heading-size, 22px); color: var(--be-heading-color, var(--fg)); margin-top: 32px; }\n' +
      '.post-body p { color: var(--be-para-color, var(--fg)); }\n' +
      '.post-body blockquote { border-left: 3px solid var(--fg); padding-left: 16px; color: var(--be-quote-color, var(--muted)); font-style: italic; }\n' +
      '.post-body code { background: var(--soft); padding: 2px 5px; font-family: ui-monospace, monospace; }\n' +
      '.post-body pre { background: var(--soft); padding: 14px; overflow-x: auto; border-radius: var(--be-corner-radius, 0); }\n' +
      '.post-body img { max-width: 100%; height: auto; }\n' +
      '.post-body table { border-collapse: collapse; width: 100%; }\n' +
      '.post-body td, .post-body th { border: 1px solid var(--line); padding: 8px 10px; text-align: left; }\n';
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
    var pack = Bloger.Scaffold.pack(themeId, name, designOverrides);
    return (
      "/* Compiled Bloger theme pack: " + themeId + " */\n" +
      "window.THEMES = window.THEMES || {};\n" +
      "window.THEMES[" + JSON.stringify(themeId) + "] = " + JSON.stringify(pack) + ";\n"
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
    try {
      var list = JSON.parse(localStorage.getItem(Bloger.Scaffold.THEMES_KEY) || "[]");
      return Array.isArray(list) ? list : [];
    } catch (e) { return []; }
  },

  saveTheme: function (themeId, name, designOverrides) {
    var list = Bloger.Scaffold.listSaved().filter(function (t) { return t.id !== themeId; });
    list.push({
      id: themeId,
      name: name || themeId,
      design: designOverrides || {},
      savedAt: new Date().toISOString()
    });
    try { localStorage.setItem(Bloger.Scaffold.THEMES_KEY, JSON.stringify(list)); } catch (e) { /* ignore */ }
    return list;
  },

  removeTheme: function (themeId) {
    var list = Bloger.Scaffold.listSaved().filter(function (t) { return t.id !== themeId; });
    try { localStorage.setItem(Bloger.Scaffold.THEMES_KEY, JSON.stringify(list)); } catch (e) { /* ignore */ }
    return list;
  }
};

window.Bloger = Bloger;
