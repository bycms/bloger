/* ============================================================
 * Bloger editor page logic (edit.html).
 * Edits the shared data blob, lets the adopter switch themes,
 * saves to localStorage, and shows a live preview.
 * ============================================================ */
(function () {
  "use strict";
  var Blog = window.Blog;
  var BlogEditor = window.BlogEditor;

  var LS = "bloger:site";
  var data = Blog.load();
  var editors = {}; // postId -> { editor, el }
  var currentPostId = null;
  var saveTimer = null;

  var els = {
    title: document.getElementById("f-title"),
    subtitle: document.getElementById("f-subtitle"),
    bio: document.getElementById("f-bio"),
    accent: document.getElementById("f-accent"),
    theme: document.getElementById("theme-select"),
    posts: document.getElementById("posts"),
    status: document.getElementById("save-status"),
    preview: document.getElementById("preview-frame"),
    addPost: document.getElementById("btn-add-post"),
    save: document.getElementById("btn-save"),
    mode: document.getElementById("btn-mode")
  };

  // Forward the editor's own CSS vars to the active theme's design tokens so
  // the editor page adopts the theme (colors/fonts/radius) while keeping its
  // layout. This is "design tokens only" — same rule as the Bloger tool pages.
  var EDITOR_PALETTE = {
    "--ink":   "--be-text",
    "--muted": "--be-muted",
    "--line":  "--be-border",
    "--panel": "--be-page-bg",
    "--soft":  "--be-code-bg, #f6f6f4"
  };

  function applyEditorTheme() {
    var tid = Blog.currentThemeId(data);
    var theme = Blog.themes[tid] || Blog.themes[Object.keys(Blog.themes)[0]];
    if (!theme) return;
    var el = document.getElementById("be-editor-design");
    if (!el) {
      el = document.createElement("style");
      el.id = "be-editor-design";
      document.head.appendChild(el);
    }
    var lines = Object.keys(EDITOR_PALETTE).map(function (t) {
      return "  " + t + ": var(" + EDITOR_PALETTE[t] + ");";
    });
    el.textContent =
      (theme.designCss || "") +
      "\n" + (theme.darkDesignCss || "") +
      "\n:root {\n" + lines.join("\n") + "\n}" +
      "\nbody { font-family: var(--be-body-font, inherit); }" +
      "\nbody { position: relative; }" +
      "\nbody::before { content:''; position: fixed; inset: 0; z-index: -2; pointer-events: none; background: var(--be-page-bg, #fff);" +
        " background-image: var(--be-page-bg-image, none); background-position: center; background-size: cover; background-repeat: no-repeat;" +
        " filter: blur(var(--be-page-bg-blur, 0px)); opacity: var(--be-page-bg-opacity, 1); }" +
      "\n.be-content { color: var(--be-text, #1a1a1a); }" +
      "\n.be-quote .be-content { color: var(--be-quote-color, #555); border-left-color: var(--be-quote-border, #bbb); }";
  }

  /* ---------------- colour mode (dark / light) ---------------- */

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
  // theme's dark design block (pack.darkDesignCss) — the editor chrome vars
  // (--ink/--panel/…) are forwarded from --be-*, so they follow the mode too.
  function applyMode(mode) {
    var root = document.documentElement;
    if (mode === "dark") root.setAttribute("data-be-mode", "dark");
    else root.removeAttribute("data-be-mode");
    var btn = document.getElementById("btn-mode");
    if (btn) {
      var toLight = mode === "dark";
      btn.textContent = toLight ? "☀" : "☾";
      btn.title = toLight ? "Switch to light mode" : "Switch to dark mode";
      btn.setAttribute("aria-label", toLight ? "Switch to light mode" : "Switch to dark mode");
    }
  }

  function slug(s) {
    return String(s || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  /* ---------------- data ---------------- */

  function normalize() {
    if (!data.site) data.site = {};
    if (!data.posts) data.posts = [];
    data.site.title = data.site.title || "My Blog";
    data.site.subtitle = data.site.subtitle || "";
    data.site.bio = data.site.bio || "";
    data.site.accent = data.site.accent || "#111111";
  }

  function persist(showMsg) {
    saveStatus(showMsg ? "Saving…" : "Saving…");
    Blog.save(data);
    saveStatus(showMsg ? "Saved ✓" : "Saved ✓");
    preview();
  }

  function saveStatus(msg) {
    if (els.status) els.status.textContent = msg;
  }

  function autoSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () { persist(false); }, 600);
  }

  /* ---------------- site fields ---------------- */

  function readSite() {
    data.site.title = els.title.value;
    data.site.subtitle = els.subtitle.value;
    data.site.bio = els.bio.value;
    data.site.accent = els.accent.value;
  }

  function bindSite() {
    els.title.value = data.site.title;
    els.subtitle.value = data.site.subtitle;
    els.bio.value = data.site.bio;
    els.accent.value = data.site.accent;
    [els.title, els.subtitle, els.bio, els.accent].forEach(function (inp) {
      inp.addEventListener("input", function () { readSite(); autoSave(); });
    });
  }

  /* ---------------- theme switch ---------------- */

  function bindTheme() {
    els.theme.innerHTML = "";
    var keys = Object.keys(Blog.themes);
    keys.forEach(function (id) {
      var opt = document.createElement("option");
      opt.value = id;
      opt.textContent = Blog.themes[id].name || id;
      els.theme.appendChild(opt);
    });
    var current = Blog.currentThemeId(data);
    if (current) els.theme.value = current;
    els.theme.addEventListener("change", function () {
      data.theme = els.theme.value;
      autoSave();
      applyEditorTheme();
    });
  }

  /* ---------------- posts ---------------- */

  function postCard(post, index) {
    var card = document.createElement("div");
    card.className = "post-card";
    card.setAttribute("data-index", index);

    var head = document.createElement("div");
    head.className = "post-card-head";
    var titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.placeholder = "Post title";
    titleInput.value = post.title || "";
    var dateInput = document.createElement("input");
    dateInput.type = "date";
    dateInput.className = "date";
    dateInput.value = post.date || "";
    var removeBtn = document.createElement("button");
    removeBtn.className = "btn btn-danger";
    removeBtn.textContent = "Remove";
    head.appendChild(titleInput);
    head.appendChild(dateInput);
    head.appendChild(removeBtn);
    card.appendChild(head);

    var body = document.createElement("div");
    body.className = "post-card-body";
    card.appendChild(body);

    titleInput.addEventListener("input", function () {
      post.title = titleInput.value;
      post.id = slug(post.title) || post.id;
      autoSave();
    });
    dateInput.addEventListener("input", function () {
      post.date = dateInput.value;
      autoSave();
    });
    removeBtn.addEventListener("click", function () {
      data.posts.splice(data.posts.indexOf(post), 1);
      renderPosts();
      autoSave();
    });

    var editor = BlogEditor.create(body, {
      blocks: post.blocks || [],
      onChange: function (blocks) {
        post.blocks = blocks;
        autoSave();
      }
    });
    editors[post.id || ("p" + index)] = { editor: editor, el: card };

    return card;
  }

  function renderPosts() {
    els.posts.innerHTML = "";
    editors = {};
    if (!data.posts.length) {
      var empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "No posts yet. Add one below.";
      els.posts.appendChild(empty);
      return;
    }
    data.posts.forEach(function (p, i) {
      if (!p.id) p.id = slug(p.title) || ("p" + (i + 1));
      els.posts.appendChild(postCard(p, i));
    });
  }

  function addPost() {
    data.posts.push({ id: "post-" + (data.posts.length + 1), title: "", date: "", blocks: [{ type: "paragraph", text: "" }] });
    renderPosts();
    autoSave();
    // focus the last editor
    var cards = els.posts.querySelectorAll(".post-card");
    var last = cards[cards.length - 1];
    if (last) {
      var editorEl = last.querySelector(".be-root");
      if (editorEl && editorEl._blogEditor) editorEl._blogEditor.focus(0);
    }
  }

  /* ---------------- preview ---------------- */

  function preview() {
    var tid = Blog.currentThemeId(data);
    var theme = Blog.themes[tid] || Blog.themes[Object.keys(Blog.themes)[0]];
    if (!theme) return;

    // Resolve the view: home defaults to the latest post (matches index.html).
    var posts = (data.posts || []).slice().sort(function (a, b) {
      return String(b.date || "").localeCompare(String(a.date || ""));
    });
    var currentId = null;
    if (posts.length) {
      var first = posts[0];
      currentId = first.id || slug(first.title || "post-1");
    }
    var content = currentId
      ? Blog.renderPost(theme, data, currentId)
      : Blog.renderHome(theme, data);
    // Content-only preview: show the rendered blog article (no topbar /
    // sidebar / footer). `.be-content` + `.be-content-inner` (from SHELL_CSS)
    // supply the reading surface — padding, page background and the centered
    // max-width column.
    var html = '<div class="be-content"><div class="be-content-inner">' + content + "</div></div>";

    var styleValues = {};
    Object.keys(data.site || {}).forEach(function (k) { styleValues[k] = data.site[k]; });
    styleValues.year = new Date().getFullYear();
    var css = Blog.substitute(theme.css || "", styleValues);
    var accent = (data.site && data.site.accent) || "#111111";
    var designCss = (theme.designCss || "") + "\n:root { --be-accent: " + accent + "; }";

    // The preview mirrors the editor's colour mode: include the theme's dark
    // design block and a tiny script that toggles data-be-mode on the preview
    // document from the shared bloger:mode key (and updates live on change).
    var modeScript = "(function(){var K='bloger:mode';" +
      "function dark(){try{var v=localStorage.getItem(K);" +
        "if(v==='dark')return true;if(v==='light')return false;" +
        "return window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;" +
      "}catch(e){return false;}}" +
      "function apply(){var r=document.documentElement;" +
        "if(dark())r.setAttribute('data-be-mode','dark');else r.removeAttribute('data-be-mode');}" +
      "apply();if(window.addEventListener){window.addEventListener('storage',function(e){if(e.key===K)apply();});}" +
      "})();";

    var doc =
      "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><style>" +
      (Blog.SHELL_CSS || "") +
      "</style><style>" + designCss + "</style>" +
      (theme.darkDesignCss ? "<style>" + theme.darkDesignCss + "</style>" : "") +
      "<style>" + css + "</style>" +
      "<script>" + modeScript + "</scr" + "ipt>" +
      "</head><body class=\"be-preview\">" + html + "</body></html>";
    els.preview.srcdoc = doc;
  }

  /* ---------------- init ---------------- */

  function focusPostFromUrl() {
    var q = new URLSearchParams(window.location.search);
    var id = q.get("post");
    if (!id) return;
    data.posts.forEach(function (p, i) {
      if ((p.id || slug(p.title)) === id) {
        var cards = els.posts.querySelectorAll(".post-card");
        if (cards[i]) {
          cards[i].scrollIntoView({ behavior: "smooth", block: "start" });
          cards[i].style.outline = "2px solid #111";
          setTimeout(function () { cards[i].style.outline = "none"; }, 3000);
        }
      }
    });
  }

  Blog.ready(function () {
    normalize();
    bindSite();
    bindTheme();
    renderPosts();
    preview();
    applyEditorTheme();
    focusPostFromUrl();

    els.addPost.addEventListener("click", addPost);
    els.save.addEventListener("click", function () { readSite(); persist(true); });
    window.addEventListener("hashchange", preview);

    // Colour-mode toggle (shared key with the blog page).
    if (els.mode) {
      els.mode.addEventListener("click", function () {
        setMode(currentMode() === "dark" ? "light" : "dark");
      });
    }
    applyMode(currentMode());
    window.addEventListener("storage", function (e) {
      if (e.key === MODE_KEY) applyMode(currentMode());
    });
  });
})();
