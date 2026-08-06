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
    "html,body{margin:0;padding:0;}" +
    ".be-topbar{position:sticky;top:0;z-index:50;display:flex;align-items:center;gap:12px;height:var(--be-topbar-height,52px);padding:0 16px;" +
      "background:var(--be-topbar-bg,var(--be-page-bg,#fff));border-bottom:1px solid var(--be-topbar-border,var(--be-border,#e0e0e0));" +
      "font-family:var(--be-topbar-font,var(--be-body-font,system-ui));}" +
    ".be-toggle{background:none;border:1px solid var(--be-topbar-border,var(--be-border,#e0e0e0));color:var(--be-topbar-fg,var(--be-text,#111));" +
      "font-size:15px;line-height:1;width:32px;height:32px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;border-radius:var(--be-toggle-radius,var(--be-corner-radius,0));}" +
    ".be-site-title{font-weight:var(--be-topbar-title-weight,700);color:var(--be-topbar-fg,var(--be-text,#111));text-decoration:none;font-size:var(--be-topbar-title-size,17px);}" +
    ".be-topbar-actions{margin-left:auto;display:flex;align-items:center;gap:10px;}" +
    ".be-edit-link{color:var(--be-muted,#666);font-size:13px;text-decoration:none;}" +
    ".be-edit-link:hover{color:var(--be-text,#111);text-decoration:underline;}" +
    ".be-mode-toggle{background:none;border:1px solid var(--be-topbar-border,var(--be-border,#e0e0e0));color:var(--be-topbar-fg,var(--be-text,#111));" +
      "font-size:14px;line-height:1;width:30px;height:30px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;padding:0;" +
      "border-radius:var(--be-toggle-radius,var(--be-corner-radius,0));}" +
    ".be-mode-toggle:hover{color:var(--be-accent,#111);border-color:var(--be-muted,#666);}" +
    ".be-shell{display:flex;align-items:stretch;min-height:calc(100vh - 96px);}" +
    ".be-sidebar{width:var(--be-sidebar-width,262px);flex-shrink:0;border-right:1px solid var(--be-sidebar-border,var(--be-border,#e0e0e0));" +
      "background:var(--be-sidebar-bg,var(--be-page-bg,#fff));overflow-y:auto;padding:14px 8px;" +
      "transition:width var(--be-duration,.18s) var(--be-easing,ease),padding var(--be-duration,.18s) var(--be-easing,ease);" +
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
      "font-family:var(--be-body-font,system-ui);}" +
    "@media (max-width:640px){" +
      ".be-sidebar{display:none;}" +
      ".be-content{padding:20px 18px;}" +
    "}" +
    /* Background image layers (page + shell areas) with blur + opacity. */
    "body{position:relative;}" +
    "body::before{content:'';position:fixed;inset:0;z-index:-2;pointer-events:none;background:#fff;" +
      "background-image:var(--be-page-bg-image,none);background-position:center;background-size:cover;background-repeat:no-repeat;" +
      "filter:blur(var(--be-page-bg-blur,0px));opacity:var(--be-page-bg-opacity,1);}" +
    ".be-topbar{position:relative;}" +
    ".be-topbar::before{content:'';position:absolute;inset:0;z-index:-1;pointer-events:none;" +
      "background-image:var(--be-topbar-bg-image,none);background-position:center;background-size:cover;background-repeat:no-repeat;" +
      "filter:blur(var(--be-topbar-bg-blur,0px));opacity:var(--be-topbar-bg-opacity,1);}" +
    ".be-sidebar{position:relative;}" +
    ".be-sidebar::before{content:'';position:absolute;inset:0;z-index:-1;pointer-events:none;" +
      "background-image:var(--be-sidebar-bg-image,none);background-position:center;background-size:cover;background-repeat:no-repeat;" +
      "filter:blur(var(--be-sidebar-bg-blur,0px));opacity:var(--be-sidebar-bg-opacity,1);}" +
    ".be-footer{position:relative;}" +
    ".be-footer::before{content:'';position:absolute;inset:0;z-index:-1;pointer-events:none;" +
      "background-image:var(--be-footer-bg-image,none);background-position:center;background-size:cover;background-repeat:no-repeat;" +
      "filter:blur(var(--be-footer-bg-blur,0px));opacity:var(--be-footer-bg-opacity,1);}" +
    ".be-sidebar > *, .be-footer > *{position:relative;}";

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
        // Register under the registry id. If a pack registered under a
        // different id than the one in themes/index.js (e.g. a hand-edited
        // registry or a stale config), fall back to the first pack that did
        // load so the blog never reports a missing theme.
        var loaded = window.THEMES || {};
        var keys = Object.keys(loaded);
        var pack = loaded[p.id] || (keys.length ? loaded[keys[0]] : null);
        if (pack) themes[p.id] = pack;
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
  // The sidebar follows the page arrangement token — "single-column" themes
  // ship with the sidebar (and its toggle) disabled.
  function renderShell(data, contentHtml, currentId, design) {
    var site = data.site || {};
    var title = site.title || "Blog";
    var year = new Date().getFullYear();
    var isSidebar = !(design && design.page && design.page.arrangement === "single-column");
    var toggle = isSidebar
      ? '<button class="be-toggle" id="be-toggle" type="button" aria-label="Toggle sidebar">☰</button>'
      : "";
    var sidebar = isSidebar
      ? '<aside class="be-sidebar" id="be-sidebar">' +
          '<div class="be-sidebar-head">Posts</div>' +
          renderSidebar(data, currentId) +
        "</aside>"
      : "";
    return (
      '<header class="be-topbar">' +
        toggle +
        '<a class="be-site-title" href="#/">' + esc(title) + "</a>" +
        '<span class="be-topbar-actions">' +
          '<button class="be-mode-toggle" id="be-mode-toggle" type="button" aria-label="Toggle color mode" title="Toggle color mode">☾</button>' +
          '<a class="be-edit-link" href="edit.html">Edit</a>' +
        "</span>" +
      "</header>" +
      '<div class="be-shell">' +
        sidebar +
        '<main class="be-content"><div class="be-content-inner">' + contentHtml + "</div></main>" +
      "</div>" +
      '<footer class="be-footer">' +
        "<span>© " + year + " " + esc(title) + "</span>" +
        "<span>Powered by <a href='https://github.com/bycms/bloger'>Bloger</a></span>" +
      "</footer>"
    );
  }

  Blog.renderShell = renderShell;

  /* ---------------- dark mode ---------------- */

  var MODE_KEY = "bloger:mode";

  function systemPrefersDark() {
    try { return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches; }
    catch (e) { return false; }
  }

  function currentMode() {
    var s = null;
    try { s = localStorage.getItem(MODE_KEY); } catch (e) { /* ignore */ }
    return s === "dark" || s === "light" ? s : (systemPrefersDark() ? "dark" : "light");
  }

  function setMode(mode) {
    try { localStorage.setItem(MODE_KEY, mode); } catch (e) { /* ignore */ }
    applyMode(mode);
  }

  // Reflect the colour mode on <html data-be-mode=…>, which activates the
  // theme's dark design block (pack.darkDesignCss), and keep the toggle icon
  // in sync. Mirrors the Bloger tool's toggle behaviour.
  function applyMode(mode) {
    var root = document.documentElement;
    if (mode === "dark") root.setAttribute("data-be-mode", "dark");
    else root.removeAttribute("data-be-mode");
    var btn = document.getElementById("be-mode-toggle");
    if (btn) {
      var toLight = mode === "dark";
      btn.textContent = toLight ? "☀" : "☾";
      btn.title = toLight ? "Switch to light mode" : "Switch to dark mode";
      btn.setAttribute("aria-label", toLight ? "Switch to light mode" : "Switch to dark mode");
    }
  }

  function wireModeToggle() {
    var btn = document.getElementById("be-mode-toggle");
    if (btn && !btn.getAttribute("data-bound")) {
      btn.setAttribute("data-bound", "1");
      btn.addEventListener("click", function () {
        setMode(currentMode() === "dark" ? "light" : "dark");
      });
    }
    if (window.addEventListener) {
      window.addEventListener("storage", function (e) {
        if (e.key === MODE_KEY) applyMode(currentMode());
      });
    }
  }

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
        app.innerHTML =
          "<p style=\"padding:24px 24px 0\">No theme packs were found.</p>" +
          "<p style=\"padding:8px 24px 24px;max-width:46em\">This blog needs at least one " +
          "compiled theme pack inside <code>themes/</code> (for example " +
          "<code>themes/minimal.js</code>) registered in <code>themes/index.js</code>. " +
          "If you just downloaded this folder, make sure the whole <code>themes/</code> folder " +
          "and <code>config.js</code> were unzipped next to this page.</p>";
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
        // Theme stylesheet comes AFTER the shell CSS so a theme can restyle
        // the whole page (topbar/sidebar/footer included), not just the article.
        document.head.appendChild(styleEl);
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

      // Dark design block: `:root[data-be-mode="dark"] { … }` baked into the
      // pack. Activated by toggling data-be-mode on <html> (see applyMode).
      var darkEl = document.getElementById("design-dark-style");
      if (!darkEl) {
        darkEl = document.createElement("style");
        darkEl.id = "design-dark-style";
        document.head.appendChild(darkEl);
      }
      if (darkEl) darkEl.textContent = theme.darkDesignCss || "";

      if (data.site && data.site.title) document.title = data.site.title;

      // Render shell + content.
      var view = resolveView(data);
      var content = view.id
        ? renderPost(theme, data, view.id)
        : renderHome(theme, data);
      app.innerHTML = renderShell(data, content, view.id, theme.design);

      // Sidebar fold wiring.
      if (isCollapsed()) document.body.classList.add("be-collapsed");
      var toggle = document.getElementById("be-toggle");
      if (toggle) {
        toggle.addEventListener("click", function () {
          var collapsed = document.body.classList.toggle("be-collapsed");
          setCollapsed(collapsed);
        });
      }

      // Colour-mode: apply the stored (or system) preference and wire the
      // topbar toggle. Runs after the shell exists so the button is found.
      applyMode(currentMode());
      wireModeToggle();

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
