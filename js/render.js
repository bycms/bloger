/* ============================================================
 * Bloger — preview rendering.
 * Produces self-contained preview documents (shell + content)
 * for the hub gallery, preview.html and the theme builder.
 * Mirrors how the downloaded project's app.js renders: a slim
 * topbar + foldable sidebar (all post titles + datetimes) + a
 * clean main content area.
 * Depends on js/theme.js, js/design.js, js/registry.js, js/generator.js.
 * ============================================================ */
var Bloger = window.Bloger || {};

var SHELL_CSS =
    ".be-topbar{position:sticky;top:0;z-index:50;display:flex;align-items:center;gap:12px;height:var(--be-topbar-height,52px);padding:0 16px;" +
      "background:var(--be-topbar-bg,var(--be-page-bg,#fff));border-bottom:1px solid var(--be-topbar-border,var(--be-border,#e0e0e0));" +
      "font-family:var(--be-topbar-font,var(--be-body-font,system-ui));}" +
    ".be-toggle{background:none;border:1px solid var(--be-topbar-border,var(--be-border,#e0e0e0));color:var(--be-topbar-fg,var(--be-text,#111));" +
      "font-size:15px;line-height:1;width:32px;height:32px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;border-radius:var(--be-toggle-radius,var(--be-corner-radius,0));}" +
    ".be-site-title{font-weight:var(--be-topbar-title-weight,700);color:var(--be-topbar-fg,var(--be-text,#111));text-decoration:none;font-size:var(--be-topbar-title-size,17px);}" +
    ".be-topbar-actions{margin-left:auto;display:flex;align-items:center;gap:10px;}" +
    ".be-edit-link{color:var(--be-muted,#666);font-size:13px;text-decoration:none;}" +
    ".be-edit-link:hover{color:var(--be-text,#111);text-decoration:underline;}" +
    ".be-shell{display:flex;align-items:stretch;min-height:calc(100vh - 96px);}" +
    ".be-sidebar{width:var(--be-sidebar-width,262px);flex-shrink:0;border-right:1px solid var(--be-sidebar-border,var(--be-border,#e0e0e0));" +
      "background:var(--be-sidebar-bg,var(--be-page-bg,#fff));overflow-y:auto;padding:14px 8px;" +
      "transition:width var(--be-duration,.18s) var(--be-easing,ease);" +
      "font-family:var(--be-body-font,system-ui);}" +
    ".be-sidebar-head{font-size:var(--be-sidebar-head-size,11px);text-transform:uppercase;letter-spacing:.06em;color:var(--be-muted,#666);padding:2px 8px 10px;}" +
    ".be-sidebar-nav{display:flex;flex-direction:column;gap:var(--be-sidebar-gap,2px);}" +
    ".be-sidebar-item{display:block;text-decoration:none;color:var(--be-sidebar-fg,var(--be-text,#111));padding:var(--be-sidebar-item-padding,8px 10px);" +
      "border-left:2px solid transparent;border-radius:var(--be-sidebar-item-radius,var(--be-corner-radius,0));" +
      "transition:background var(--be-duration,.18s) var(--be-easing,ease),color var(--be-duration,.18s) var(--be-easing,ease);}" +
    ".be-sidebar-item:hover{background:var(--be-sidebar-hover-bg,rgba(0,0,0,.04));}" +
    ".be-sidebar-item.active{border-left-color:var(--be-sidebar-active-bar,var(--be-accent,#111));background:var(--be-sidebar-active-bg,rgba(0,0,0,.05));}" +
    ".be-sidebar-title{display:block;font-size:var(--be-sidebar-title-size,14px);font-weight:var(--be-sidebar-title-weight,600);line-height:1.3;}" +
    ".be-sidebar-date{display:block;font-size:var(--be-sidebar-date-size,12px);color:var(--be-sidebar-date-color,var(--be-muted,#666));margin-top:3px;}" +
    ".be-sidebar-empty{padding:6px 10px;color:var(--be-muted,#666);font-size:13px;}" +
    "body.be-collapsed .be-sidebar{width:0;padding-left:0;padding-right:0;border-right:0;overflow:hidden;}" +
    "body.be-no-sidebar .be-sidebar,body.be-no-sidebar .be-toggle{display:none;}" +
    ".be-content{flex:1;min-width:0;padding:36px 44px;background:var(--be-content-bg,transparent);}" +
    ".be-content-inner{max-width:var(--be-max-width,680px);margin:0 auto;}" +
    ".be-footer{background:var(--be-footer-bg,var(--be-page-bg,#fff));border-top:1px solid var(--be-footer-border,var(--be-border,#e0e0e0));color:var(--be-footer-fg,var(--be-muted,#666));font-size:var(--be-footer-size,12px);" +
      "display:flex;justify-content:space-between;gap:12px;padding:var(--be-footer-padding,14px 24px);flex-wrap:wrap;" +
  "@media (max-width:640px){" +
    ".be-sidebar{display:none;}" +
    ".be-content{padding:20px 18px;}" +
  "}" +
  (Bloger.Design && Bloger.Design.backgroundCss ? Bloger.Design.backgroundCss : "");

/* -------- dark-mode preview override --------
 * Every preview document gets a small inline script that flips the theme's
 * design tokens (--be-*) — plus the common theme-local variables
 * (--fg/--muted/--line/--soft) that accent-adaptive themes like indigo derive
 * from the accent — to a dark palette when the tool is in dark mode. It reads
 * the same localStorage key (bloger:mode) as the toolbar toggle and updates
 * live through the storage event, so previews mirror the tool's colour mode
 * without any re-render.
 * ------------------------------------------------------------ */

// Self-contained inline script injected into every preview document. It reads
// the tool's colour mode (bloger:mode, falling back to the OS preference) and
// toggles `data-be-mode="dark"` on <html>, which activates the theme's dark
// design block (`:root[data-be-mode="dark"]{...}` — see
// Bloger.Design.darkStyleBlock). It updates live through the storage event,
// mirroring the toolbar toggle without any re-render.
var DARK_PREVIEW_SRC = "(function(){" +
  "var K='bloger:mode';" +
  "function dark(){try{var v=localStorage.getItem(K);" +
    "if(v==='dark')return true;if(v==='light')return false;" +
    "return window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;" +
  "}catch(e){return false;}}" +
  "function apply(){var r=document.documentElement;" +
    "if(dark())r.setAttribute('data-be-mode','dark');else r.removeAttribute('data-be-mode');}" +
  "apply();" +
  "if(window.addEventListener){window.addEventListener('storage',function(e){if(e.key===K)apply();});}" +
  "})();";

Bloger.Render = {
  SHELL_CSS: SHELL_CSS,

  // Sample project data (site defaults + sample posts).
  sampleConfig: function (manifest) {
    var cfg = Bloger.Generator.defaultConfig(manifest);
    cfg.posts = Bloger.Generator.samplePosts();
    return cfg;
  },

  slug: function (s) {
    return String(s || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  },

  excerpt: function (post) {
    var blocks = post.blocks || [];
    for (var i = 0; i < blocks.length; i++) {
      if (blocks[i].type === "paragraph" && String(blocks[i].text || "").trim()) {
        var clean = blocks[i].text.replace(/\*\*|\*/g, "").trim();
        return clean.length > 150 ? clean.slice(0, 150).trim() + "…" : clean;
      }
    }
    return "";
  },

  orderedPosts: function (data) {
    return (data.posts || []).slice().sort(function (a, b) {
      return String(b.date || "").localeCompare(String(a.date || ""));
    });
  },

  postId: function (p, i) {
    return p.id || Bloger.Render.slug(p.title || "post-" + (i + 1));
  },

  // Build a pack-like object from a theme (mirrors the generator). Handles
  // both registered themes (folder) and saved themes (theme builder).
  buildPack: async function (themeId, data, opts) {
    var manifest = await Bloger.Registry.manifest(themeId, opts);
    if (manifest.saved) {
      return Bloger.Scaffold.packWithDesign(
        manifest.id,
        manifest.name,
        Bloger.Design.merge(manifest.design, data && data.design)
      );
    }
    var templates = manifest.templates || {};
    var home = await Bloger.Registry.fetchFile(
      themeId,
      (templates["index.html"] && templates["index.html"].source) || "index.html"
    );
    var post = await Bloger.Registry.fetchFile(
      themeId,
      (templates["post.html"] && templates["post.html"].source) || "post.html"
    );
    var css = await Bloger.Registry.fetchFile(themeId, "assets/style.css");
    var js = "";
    try { js = await Bloger.Registry.fetchFile(themeId, "assets/main.js"); } catch (e) { js = ""; }
    var design = Bloger.Design ? Bloger.Design.merge(manifest.design, data && data.design) : {};
    return {
      id: manifest.id,
      name: manifest.name || manifest.id,
      css: css,
      homeTemplate: Bloger.Generator.sanitizeTemplate(home),
      postTemplate: Bloger.Generator.sanitizeTemplate(post),
      js: js,
      design: design,
      designCss: Bloger.Design ? Bloger.Design.styleBlock(design) : "",
      designManifest: manifest.design || {}
    };
  },

  // Recompute a cached pack's design from the current data WITHOUT
  // re-fetching the theme (used for instant live previews).
  packWithDesign: function (pack, data) {
    var design = Bloger.Design
      ? Bloger.Design.merge(pack.designManifest, data && data.design)
      : (pack.design || {});
    return {
      id: pack.id,
      name: pack.name,
      css: pack.css,
      homeTemplate: pack.homeTemplate,
      postTemplate: pack.postTemplate,
      js: pack.js,
      design: design,
      designCss: Bloger.Design ? Bloger.Design.styleBlock(design) : (pack.designCss || "")
    };
  },

  // Content-only renderers (shell is separate).
  renderHomeContent: function (pack, data) {
    var values = {};
    Object.keys(data.site || {}).forEach(function (k) { values[k] = data.site[k]; });
    values.year = new Date().getFullYear();
    return Bloger.Generator.substitute(pack.homeTemplate || "", values);
  },

  renderPostContent: function (pack, data, id) {
    var posts = Bloger.Render.orderedPosts(data);
    var p = null;
    for (var i = 0; i < posts.length; i++) {
      if (Bloger.Render.postId(posts[i], i) === id) { p = posts[i]; break; }
    }
    if (!p) p = posts[0] || { title: "Untitled", date: "", blocks: [] };
    var values = {};
    Object.keys(data.site || {}).forEach(function (k) { values[k] = data.site[k]; });
    values.year = new Date().getFullYear();
    values.postTitle = p.title || "Untitled";
    values.postDate = p.date || "";
    values.postContent = Bloger.renderBlocksData(p.blocks || []);
    return Bloger.Generator.substitute(pack.postTemplate || "", values);
  },

  resolveView: function (data) {
    var posts = Bloger.Render.orderedPosts(data);
    return posts.length ? { id: Bloger.Render.postId(posts[0], 0) } : { id: null };
  },

  renderSidebar: function (data, currentId) {
    var posts = Bloger.Render.orderedPosts(data);
    if (!posts.length) {
      return '<p class="be-sidebar-empty">No posts yet.</p>';
    }
    var items = posts.map(function (p, i) {
      var id = Bloger.Render.postId(p, i);
      var active = id === currentId ? " active" : "";
      return (
        '<a class="be-sidebar-item' + active + '" href="#/post/' + Bloger.esc(id) + '">' +
          '<span class="be-sidebar-title">' + Bloger.esc(p.title || "Untitled") + "</span>" +
          '<span class="be-sidebar-date">' + Bloger.esc(p.date || "") + "</span>" +
        "</a>"
      );
    }).join("\n");
    return '<nav class="be-sidebar-nav">' + items + "</nav>";
  },

  renderShell: function (data, contentHtml, currentId, design) {
    var site = data.site || {};
    var title = site.title || "Blog";
    var year = new Date().getFullYear();
    // Sidebar follows the page arrangement token: "single-column" disables the
    // sidebar (and its toggle); anything else (or a missing design) keeps it.
    var isSidebar = !(design && design.page && design.page.arrangement === "single-column");
    var toggle = isSidebar
      ? '<button class="be-toggle" id="be-toggle" type="button" aria-label="Toggle sidebar">☰</button>'
      : "";
    var sidebar = isSidebar
      ? '<aside class="be-sidebar" id="be-sidebar">' +
          '<div class="be-sidebar-head">Posts</div>' +
          Bloger.Render.renderSidebar(data, currentId) +
        "</aside>"
      : "";
    return (
      '<header class="be-topbar">' +
        toggle +
        '<a class="be-site-title" href="#/">' + Bloger.esc(title) + "</a>" +
        '<span class="be-topbar-actions">' +
          '<a class="be-edit-link" href="edit.html">Edit</a>' +
        "</span>" +
      "</header>" +
      '<div class="be-shell">' +
        sidebar +
        '<main class="be-content"><div class="be-content-inner">' + contentHtml + "</div></main>" +
      "</div>" +
      '<footer class="be-footer">' +
        "<span>© " + year + " " + Bloger.esc(title) + "</span>" +
        "<span>Powered by <a href='https://github.com/bycms/bloger'>Bloger</a></span>" +
      "</footer>"
    );
  },

  // Full self-contained document for a pack (shell + design + theme css + content).
  packDocument: function (pack, data, viewId) {
    var site = data.site || {};
    var styleValues = {};
    Object.keys(site).forEach(function (k) { styleValues[k] = site[k]; });
    styleValues.year = new Date().getFullYear();
    var css = Bloger.Generator.substitute(pack.css || "", styleValues);
    var accent = site.accent || "#111111";
    // Light design block + the theme's dark design block (activated by
    // `data-be-mode="dark"` on <html> — toggled by DARK_PREVIEW_SRC).
    var lightCss = (pack.designCss || "") + "\n:root { --be-accent: " + accent + "; }";
    var darkCss = (Bloger.Design && Bloger.Design.darkStyleBlock)
      ? Bloger.Design.darkStyleBlock(pack.design, accent)
      : "";
    var designCss = lightCss + "\n" + darkCss;
    var content = viewId
      ? Bloger.Render.renderPostContent(pack, data, viewId)
      : Bloger.Render.renderHomeContent(pack, data);
    return (
      "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"UTF-8\">" +
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
      "<title>" + Bloger.esc(site.title || "Blog") + "</title>" +
      "<style>" + SHELL_CSS + "</style>" +
      "<style>" + designCss + "</style>" +
      "<style>" + css + "</style>" +
      "<script>" + DARK_PREVIEW_SRC + "</scr" + "ipt>" +
      "</head><body class=\"be-preview\">" + Bloger.Render.renderShell(data, content, viewId, pack.design) + "</body></html>"
    );
  },

  // Registered-theme previews (hub gallery + preview.html).
  indexDocument: async function (themeId, opts) {
    var data = Bloger.Render.sampleConfig(await Bloger.Registry.manifest(themeId, opts));
    var pack = await Bloger.Render.buildPack(themeId, data, opts);
    return Bloger.Render.packDocument(pack, data, Bloger.Render.resolveView(data).id);
  },

  postDocument: async function (themeId, opts) {
    var data = Bloger.Render.sampleConfig(await Bloger.Registry.manifest(themeId, opts));
    var pack = await Bloger.Render.buildPack(themeId, data, opts);
    var view = Bloger.Render.resolveView(data);
    return Bloger.Render.packDocument(pack, data, view.id);
  },

  // Theme-builder preview: render an arbitrary compiled pack (from scaffold.js).
  packPreview: function (pack, data) {
    data = data || { site: { title: "My Blog", subtitle: "", bio: "", accent: "#111111" }, posts: Bloger.Scaffold.samplePosts(), theme: pack.id };
    return Bloger.Render.packDocument(pack, data, Bloger.Render.resolveView(data).id);
  },

  // Preview for the generator page: a registered theme with adopter data/design.
  dataDocument: async function (themeId, data, opts) {
    var pack = await Bloger.Render.buildPack(themeId, data, opts);
    return Bloger.Render.packDocument(pack, data, Bloger.Render.resolveView(data).id);
  },

  intoFrame: function (iframe, doc) {
    iframe.srcdoc = doc;
  }
};

window.Bloger = Bloger;
