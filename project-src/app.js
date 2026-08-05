/* ============================================================
 * Bloger site runtime (self-contained — no external deps).
 * Renders the blog from data stored in localStorage, falling
 * back to the seed in config.js. Works over file:// and Pages.
 *
 * Layout: a slim topbar + a foldable sidebar that lists every
 * post (title + datetime) + a clean main content area. The
 * theme provides only the content markup; the shell comes from
 * this runtime so it looks the same everywhere.
 *
 * Load order in index.html / edit.html:
 *   1. config.js         -> window.BLOG_SEED
 *   2. themes/index.js   -> window.THEME_PACKS (id -> file)
 *   3. app.js            -> window.Blog runtime
 * ============================================================ */
(function () {
  "use strict";

  var LS_KEY = "bloger:site";
  var LS_SIDEBAR = "bloger:sidebar";
  var Blog = (window.Blog = window.Blog || {});
  var themes = (Blog.themes = Blog.themes || {});
  var booted = false;

  /* ---------------- helpers ---------------- */

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function inline(str) {
    if (str == null) return "";
    var s = esc(str);
    s = s.replace(/`([^`]+)`/g, function (m, c) { return "<code>" + c + "</code>"; });
    s = s.replace(/\*\*([^*]+)\*\*/g, function (m, c) { return "<strong>" + c + "</strong>"; });
    s = s.replace(/\*([^*]+)\*/g, function (m, c) { return "<em>" + c + "</em>"; });
    return s;
  }

  function slug(s) {
    return String(s || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  function get(obj, key, fallback) {
    if (!obj) return fallback;
    var parts = String(key).split(".");
    var cur = obj;
    for (var i = 0; i < parts.length; i++) {
      if (cur == null) return fallback;
      cur = cur[parts[i]];
    }
    return cur === undefined || cur === null ? fallback : cur;
  }

  function substitute(text, values) {
    return String(text).replace(/\{\{([\w.]+)\}\}/g, function (m, key) {
      var v = get(values, key, "");
      return v === undefined || v === null ? "" : v;
    });
  }

  /* ---------------- shell styles (topbar + sidebar) ---------------- */

  var SHELL_CSS =
    ".be-topbar{position:sticky;top:0;z-index:50;display:flex;align-items:center;gap:12px;height:52px;padding:0 16px;" +
      "background:var(--be-page-bg,#fff);border-bottom:1px solid var(--be-border,#e0e0e0);" +
      "font-family:var(--be-body-font,system-ui);}" +
    ".be-toggle{background:none;border:1px solid var(--be-border,#e0e0e0);color:var(--be-text,#111);" +
      "font-size:15px;line-height:1;width:32px;height:32px;cursor:pointer;border-radius:var(--be-corner-radius,0);}" +
    ".be-site-title{font-weight:700;color:var(--be-text,#111);text-decoration:none;font-size:17px;}" +
    ".be-topbar-actions{margin-left:auto;display:flex;align-items:center;gap:10px;}" +
    ".be-edit-link{color:var(--be-muted,#666);font-size:13px;text-decoration:none;}" +
    ".be-edit-link:hover{color:var(--be-text,#111);text-decoration:underline;}" +
    ".be-shell{display:flex;align-items:stretch;min-height:calc(100vh - 96px);}" +
    ".be-sidebar{width:262px;flex-shrink:0;border-right:1px solid var(--be-border,#e0e0e0);" +
      "background:var(--be-page-bg,#fff);overflow-y:auto;padding:14px 8px;transition:width .18s ease, padding .18s ease;" +
      "font-family:var(--be-body-font,system-ui);}" +
    ".be-sidebar-head{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--be-muted,#666);padding:2px 8px 10px;}" +
    ".be-sidebar-nav{display:flex;flex-direction:column;gap:2px;}" +
    ".be-sidebar-item{display:block;text-decoration:none;color:var(--be-text,#111);padding:8px 10px;border-left:2px solid transparent;}" +
    ".be-sidebar-item:hover{background:rgba(0,0,0,.04);}" +
    ".be-sidebar-item.active{border-left-color:var(--be-accent,#111);background:rgba(0,0,0,.05);}" +
    ".be-sidebar-title{display:block;font-size:14px;font-weight:600;line-height:1.3;}" +
    ".be-sidebar-date{display:block;font-size:12px;color:var(--be-muted,#666);margin-top:3px;}" +
    ".be-sidebar-empty{padding:6px 10px;color:var(--be-muted,#666);font-size:13px;}" +
    "body.be-collapsed .be-sidebar{width:0;padding-left:0;padding-right:0;border-right:0;overflow:hidden;}" +
    ".be-content{flex:1;min-width:0;padding:36px 44px;}" +
    ".be-content-inner{max-width:var(--be-max-width,680px);margin:0 auto;}" +
    ".be-footer{border-top:1px solid var(--be-border,#e0e0e0);color:var(--be-muted,#666);font-size:12px;" +
      "display:flex;justify-content:space-between;gap:12px;padding:14px 24px;flex-wrap:wrap;" +
      "font-family:var(--be-body-font,system-ui);}" +
    "@media (max-width:640px){" +
      ".be-sidebar{position:fixed;top:52px;bottom:0;left:0;z-index:40;box-shadow:2px 0 10px rgba(0,0,0,.14);}" +
      "body.be-collapsed .be-sidebar{width:0;}" +
      ".be-content{padding:20px 18px;}" +
    "}";

  Blog.SHELL_CSS = SHELL_CSS;

  /* ---------------- data layer ---------------- */

  function seed() {
    return window.BLOG_SEED || { site: {}, posts: [], theme: null };
  }

  function load() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") return parsed;
      }
    } catch (e) { /* ignore */ }
    return seed();
  }

  function save(data) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch (e) { /* ignore */ }
  }

  function clearSaved() {
    try { localStorage.removeItem(LS_KEY); } catch (e) { /* ignore */ }
  }

  Blog.load = load;
  Blog.save = save;
  Blog.clearSaved = clearSaved;
  Blog.seed = seed;
  Blog.currentThemeId = currentThemeId;
  Blog.substitute = substitute;
  Blog.ready = function (cb) { loadPacks(cb); };

  /* ---------------- theme packs ---------------- */

  var packQueue = [];
  var loadingPacks = false;

  function loadPacks(cb) {
    if (loadingPacks) { packQueue.push(cb); return; }
    var packs = window.THEME_PACKS || [];
    if (!packs.length) { cb(); return; }
    loadingPacks = true;
    var remaining = packs.length;

    function finish() {
      loadingPacks = false;
      cb();
      var q = packQueue;
      packQueue = [];
      q.forEach(function (f) { f(); });
    }

    packs.forEach(function (p) {
      if (themes[p.id]) {
        remaining--;
        if (remaining <= 0) finish();
        return;
      }
      var s = document.createElement("script");
      s.src = p.file;
      s.onload = function () {
        if (window.THEMES && window.THEMES[p.id]) themes[p.id] = window.THEMES[p.id];
        remaining--;
        if (remaining <= 0) finish();
      };
      s.onerror = function () {
        remaining--;
        if (remaining <= 0) finish();
      };
      document.head.appendChild(s);
    });
  }

  /* ---------------- block rendering ---------------- */

  function renderBlocks(blocks) {
    if (!blocks || !blocks.length) return "";
    return blocks.map(renderBlock).filter(Boolean).join("\n");
  }

  function renderBlock(b) {
    if (!b || !b.type) return "";
    switch (b.type) {
      case "heading": {
        var lv = Math.min(Math.max(parseInt(b.level || 2, 10), 1), 4);
        return "<h" + lv + ">" + inline(b.text) + "</h" + lv + ">";
      }
      case "paragraph":
        if (!String(b.text || "").trim()) return "";
        return "<p>" + inline(b.text) + "</p>";
      case "quote":
        return "<blockquote>" + inline(b.text) + "</blockquote>";
      case "list": {
        var tag = b.ordered ? "ol" : "ul";
        var items = (b.items || []).map(function (i) { return "<li>" + inline(i) + "</li>"; }).join("");
        return "<" + tag + ">" + items + "</" + tag + ">";
      }
      case "table": {
        var rows = (b.rows || []).map(function (r) {
          return "<tr>" + r.map(function (c) { return "<td>" + inline(c) + "</td>"; }).join("") + "</tr>";
        }).join("");
        return '<div class="table-wrap"><table>' + rows + "</table></div>";
      }
      case "image": {
        var cap = b.caption ? "<figcaption>" + esc(b.caption) + "</figcaption>" : "";
        return '<figure class="post-figure"><img src="' + esc(b.url) +
          '" alt="' + esc(b.caption || "") + '" loading="lazy">' + cap + "</figure>";
      }
      case "code":
        return '<pre><code class="language-' + esc(b.language || "") + '">' + esc(b.text) + "</code></pre>";
      case "divider":
        return '<hr class="post-divider">';
      default:
        return "";
    }
  }

  Blog.renderBlocks = renderBlocks;

  /* ---------------- content rendering ---------------- */

  function excerpt(post) {
    var blocks = post.blocks || [];
    for (var i = 0; i < blocks.length; i++) {
      if (blocks[i].type === "paragraph" && String(blocks[i].text || "").trim()) {
        var clean = blocks[i].text.replace(/\*\*|\*/g, "").trim();
        return clean.length > 150 ? clean.slice(0, 150).trim() + "…" : clean;
      }
    }
    return "";
  }

  function orderedPosts(data) {
    return (data.posts || []).slice().sort(function (a, b) {
      return String(b.date || "").localeCompare(String(a.date || ""));
    });
  }

  function postId(p, i) {
    return p.id || slug(p.title || "post-" + (i + 1));
  }

  // Theme provides the content markup only; tokens are substituted here.
  function renderHome(theme, data) {
    var site = data.site || {};
    var values = {};
    Object.keys(site).forEach(function (k) { values[k] = site[k]; });
    values.year = new Date().getFullYear();
    return substitute(theme.homeTemplate || "", values);
  }

  function renderPost(theme, data, id) {
    var posts = orderedPosts(data);
    var p = null;
    for (var i = 0; i < posts.length; i++) {
      if (postId(posts[i], i) === id) { p = posts[i]; break; }
    }
    if (!p) p = posts[0] || { title: "Untitled", date: "", blocks: [] };
    var site = data.site || {};
    var values = {};
    Object.keys(site).forEach(function (k) { values[k] = site[k]; });
    values.year = new Date().getFullYear();
    values.postTitle = p.title || "Untitled";
    values.postDate = p.date || "";
    values.postContent = renderBlocks(p.blocks || []);
    return substitute(theme.postTemplate || "", values);
  }

  Blog.renderHome = renderHome;
  Blog.renderPost = renderPost;

  /* ---------------- shell (topbar + sidebar + main) ---------------- */

  // Sidebar lists every post's title + datetime; current one highlighted.
  function renderSidebar(data, currentId) {
    var posts = orderedPosts(data);
    if (!posts.length) {
      return '<p class="be-sidebar-empty">No posts yet. Open <a href="edit.html">edit.html</a> to write your first post.</p>';
    }
    var items = posts.map(function (p, i) {
      var id = postId(p, i);
      var active = id === currentId ? " active" : "";
      return (
        '<a class="be-sidebar-item' + active + '" href="#/post/' + esc(id) + '">' +
          '<span class="be-sidebar-title">' + esc(p.title || "Untitled") + "</span>" +
          '<span class="be-sidebar-date">' + esc(p.date || "") + "</span>" +
        "</a>"
      );
    }).join("\n");
    return '<nav class="be-sidebar-nav">' + items + "</nav>";
  }

  // Full page shell: topbar + foldable sidebar + main content + footer.
  function renderShell(data, contentHtml, currentId) {
    var site = data.site || {};
    var title = site.title || "Blog";
    var year = new Date().getFullYear();
    return (
      '<header class="be-topbar">' +
        '<button class="be-toggle" id="be-toggle" type="button" aria-label="Toggle sidebar">☰</button>' +
        '<a class="be-site-title" href="#/">' + esc(title) + "</a>" +
        '<span class="be-topbar-actions">' +
          '<a class="be-edit-link" href="edit.html">Edit</a>' +
        "</span>" +
      "</header>" +
      '<div class="be-shell">' +
        '<aside class="be-sidebar" id="be-sidebar">' +
          '<div class="be-sidebar-head">Posts</div>' +
          renderSidebar(data, currentId) +
        "</aside>" +
        '<main class="be-content"><div class="be-content-inner">' + contentHtml + "</div></main>" +
      "</div>" +
      '<footer class="be-footer">' +
        "<span>© " + year + " " + esc(title) + "</span>" +
        "<span>Powered by Bloger</span>" +
      "</footer>"
    );
  }

  Blog.renderShell = renderShell;

  /* ---------------- boot / routing ---------------- */

  function currentThemeId(data) {
    if (data.theme && themes[data.theme]) return data.theme;
    var keys = Object.keys(themes);
    return keys[0] || null;
  }

  function isCollapsed() {
    try { return localStorage.getItem(LS_SIDEBAR) === "1"; } catch (e) { return false; }
  }

  function setCollapsed(c) {
    try { localStorage.setItem(LS_SIDEBAR, c ? "1" : "0"); } catch (e) { /* ignore */ }
  }

  // Resolve which post is shown (home defaults to the latest post).
  function resolveView(data) {
    var hash = window.location.hash || "#/";
    var m = /^#\/post\/(.+)$/.exec(hash);
    if (m) return { id: decodeURIComponent(m[1]) };
    var posts = orderedPosts(data);
    if (posts.length) return { id: postId(posts[0], 0) };
    return { id: null };
  }

  function boot() {
    if (booted) return;
    booted = true;
    var data = load();
    loadPacks(function () {
      var tid = currentThemeId(data);
      var theme = themes[tid] || themes[Object.keys(themes)[0]];
      var app = document.getElementById("app");
      if (!app) return;
      if (!theme) {
        app.innerHTML = "<p>No theme packs found. Check <code>themes/index.js</code>.</p>";
        return;
      }

      // Inject styles: shell, design tokens, theme css.
      var shellEl = document.createElement("style");
      shellEl.id = "shell-style";
      shellEl.textContent = SHELL_CSS;
      document.head.appendChild(shellEl);

      var styleEl = document.getElementById("theme-style");
      if (styleEl) {
        var styleValues = {};
        Object.keys(data.site || {}).forEach(function (k) { styleValues[k] = data.site[k]; });
        styleValues.year = new Date().getFullYear();
        styleEl.textContent = substitute(theme.css || "", styleValues);
      }

      var designEl = document.getElementById("design-style");
      if (!designEl) {
        designEl = document.createElement("style");
        designEl.id = "design-style";
        if (document.head.firstChild) document.head.insertBefore(designEl, document.head.firstChild);
        else document.head.appendChild(designEl);
      }
      var accent = (data.site && data.site.accent) || "#111111";
      if (designEl) designEl.textContent = (theme.designCss || "") + "\n:root { --be-accent: " + accent + "; }";

      if (data.site && data.site.title) document.title = data.site.title;

      // Render shell + content.
      var view = resolveView(data);
      var content = view.id
        ? renderPost(theme, data, view.id)
        : renderHome(theme, data);
      app.innerHTML = renderShell(data, content, view.id);

      // Sidebar fold wiring.
      if (isCollapsed()) document.body.classList.add("be-collapsed");
      var toggle = document.getElementById("be-toggle");
      if (toggle) {
        toggle.addEventListener("click", function () {
          var collapsed = document.body.classList.toggle("be-collapsed");
          setCollapsed(collapsed);
        });
      }

      // Inject theme behaviour (assets/main.js equivalent) after render.
      if (theme.js) {
        var sc = document.createElement("script");
        sc.textContent = theme.js;
        document.head.appendChild(sc);
      }
    });
  }

  window.addEventListener("hashchange", function () { booted = false; boot(); });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { boot(); });
  } else {
    boot();
  }
})();
