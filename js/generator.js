/* ============================================================
 * Bloger — generator engine
 * Assembles a self-contained, JS-driven blog project from a
 * selected theme + site config + posts, and packages it as a
 * client-side ZIP. The downloaded folder works over file://
 * and Pages: index.html renders the blog, edit.html edits it,
 * and saves go to localStorage.
 * Depends on: js/theme.js (Bloger namespace), js/registry.js.
 * ============================================================ */
var Bloger = window.Bloger || {};

Bloger.Generator = {
  /* ---------- helpers ---------- */

  get: function (obj, key, fallback) {
    if (!obj) return fallback;
    var parts = String(key).split(".");
    var cur = obj;
    for (var i = 0; i < parts.length; i++) {
      if (cur == null) return fallback;
      cur = cur[parts[i]];
    }
    return cur === undefined || cur === null ? fallback : cur;
  },

  // Simple {{token}} substitution; missing tokens removed.
  substitute: function (text, values) {
    return String(text).replace(/\{\{([\w.]+)\}\}/g, function (m, key) {
      var v = Bloger.Generator.get(values, key, "");
      return v === undefined || v === null ? "" : v;
    });
  },

  /* ---------- defaults ---------- */

  // Default project data (runtime shape: { site, posts, theme }).
  defaultConfig: function (manifest) {
    return {
      site: {
        title: "My Blog",
        subtitle: "",
        bio: "",
        accent: "#111111"
      },
      posts: [],
      theme: manifest.id
    };
  },

  /* ---------- sample data (for preview & first-run) ---------- */

  samplePosts: function () {
    return [
      {
        id: "hello-world",
        title: "Hello, world",
        date: "2026-08-05",
        blocks: [
          { type: "heading", text: "Welcome to your new blog", level: 2 },
          { type: "paragraph", text: "This is your very first post, generated with Bloger. It is rendered entirely in your browser — no server required." },
          { type: "paragraph", text: "You can add **headings**, *quotes*, lists, tables and images. Everything lives in the static folder." },
          { type: "quote", text: "Simplicity is the ultimate sophistication." },
          { type: "list", ordered: false, items: ["Fast to load", "Cheap to host", "Yours forever"] }
        ]
      },
      {
        id: "why-static",
        title: "Why a static blog still matters",
        date: "2026-07-21",
        blocks: [
          { type: "heading", text: "Fast, portable, yours", level: 2 },
          { type: "paragraph", text: "A static site is fast to load, cheap to host and easy to move. There is no database to maintain and nothing to break." },
          { type: "paragraph", text: "You can publish anywhere that serves files: GitHub Pages, Netlify, or a folder on a server." },
          { type: "image", url: "https://picsum.photos/seed/bloger/1200/600", caption: "A quiet corner of the web" },
          { type: "code", text: "git push origin main", language: "bash" }
        ]
      }
    ];
  },

  /* ---------- theme pack compilation ---------- */

  // Strip the <head> and any asset <script>/<link> tags from a
  // theme template so only the body markup (with {{tokens}})
  // is embedded into the runtime pack.
  sanitizeTemplate: function (html) {
    var doc;
    try {
      doc = new DOMParser().parseFromString(String(html || ""), "text/html");
    } catch (e) {
      return String(html || "");
    }
    if (!doc || !doc.body) return String(html || "");
    doc.body.querySelectorAll("script, link").forEach(function (n) { n.remove(); });
    return doc.body.innerHTML;
  },

  // Build the self-contained theme pack JS for the downloaded
  // project. Templates/CSS keep their {{tokens}} — they are
  // substituted at runtime by app.js. The resolved design object
  // is embedded both as data and as a ready-made `:root` style
  // block that the runtime injects.
  compilePack: async function (manifest, design) {
    var templates = manifest.templates || {};
    var home = await Bloger.Registry.fetchFile(
      manifest.id,
      (templates["index.html"] && templates["index.html"].source) || "index.html"
    );
    var post = await Bloger.Registry.fetchFile(
      manifest.id,
      (templates["post.html"] && templates["post.html"].source) || "post.html"
    );
    var css = await Bloger.Registry.fetchFile(manifest.id, "assets/style.css");
    var js = "";
    try {
      js = await Bloger.Registry.fetchFile(manifest.id, "assets/main.js");
    } catch (e) { js = ""; }

    var pack = {
      id: manifest.id,
      name: manifest.name || manifest.id,
      css: css,
      homeTemplate: Bloger.Generator.sanitizeTemplate(home),
      postTemplate: Bloger.Generator.sanitizeTemplate(post),
      js: js,
      design: design || {},
      designCss: Bloger.Design
        ? Bloger.Design.styleBlock(design || Bloger.Design.defaults(manifest.design))
        : ""
    };
    return (
      "/* Compiled Bloger theme pack: " + manifest.id + " */\n" +
      "window.THEMES = window.THEMES || {};\n" +
      "window.THEMES[" + JSON.stringify(manifest.id) + "] = " + JSON.stringify(pack) + ";\n"
    );
  },

  /* ---------- project assembly ---------- */

  // Fetch a static file that ships in every downloaded project.
  fetchProjectFile: function (name) {
    return fetch("project-src/" + name).then(function (r) {
      if (!r.ok) throw new Error("Missing project file: " + name);
      return r.text();
    });
  },

  // Build the full set of files for the downloaded project.
  build: async function (manifest, cfg) {
    var site = cfg.site || {};
    var posts = cfg.posts || [];
    var files = [];

    // 1. Static runtime files (identical for every download).
    var statics = [
      "index.html",
      "edit.html",
      "app.js",
      "edit-app.js",
      "editor.js",
      "editor.css",
      ".nojekyll"
    ];
    for (var i = 0; i < statics.length; i++) {
      files.push({
        name: statics[i],
        content: await Bloger.Generator.fetchProjectFile(statics[i])
      });
    }

    // 2. Seed data (config.js) — what the adopter entered in Bloger.
    var design = Bloger.Design
      ? Bloger.Design.merge(manifest.design, cfg.design)
      : {};
    var seed = {
      site: {
        title: site.title || "My Blog",
        subtitle: site.subtitle || "",
        bio: site.bio || "",
        accent: site.accent || "#111111"
      },
      posts: posts,
      design: design,
      theme: manifest.id
    };
    files.push({
      name: "config.js",
      content: "/* Bloger seed data — loaded on first visit before edits are saved. */\n" +
        "window.BLOG_SEED = " + JSON.stringify(seed, null, 2) + ";\n"
    });

    // 3. Theme pack registry (themes/index.js).
    files.push({
      name: "themes/index.js",
      content:
        "/* Bloger theme pack registry. To add another pack, drop the file in themes/ and add it here. */\n" +
        "window.THEME_PACKS = [ { \"id\": " + JSON.stringify(manifest.id) +
        ", \"file\": " + JSON.stringify("themes/" + manifest.id + ".js") + " } ];\n"
    });

    // 4. Compiled theme pack (themes/<id>.js), with the resolved
    //    design (theme defaults + adopter overrides) baked in.
    files.push({
      name: "themes/" + manifest.id + ".js",
      content: await Bloger.Generator.compilePack(manifest, design)
    });

    return files;
  },

  /* ---------- ZIP ---------- */

  // Package the built files into a ZIP blob and trigger a download.
  downloadZip: async function (name, files) {
    var zip = new JSZip();
    files.forEach(function (f) {
      zip.file(f.name, f.content);
    });
    var blob = await zip.generateAsync({ type: "blob" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    return blob;
  }
};

window.Bloger = Bloger;
