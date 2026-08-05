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
    save: document.getElementById("btn-save")
  };

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
    var html = Blog.renderShell(data, content, currentId);

    var styleValues = {};
    Object.keys(data.site || {}).forEach(function (k) { styleValues[k] = data.site[k]; });
    styleValues.year = new Date().getFullYear();
    var css = Blog.substitute(theme.css || "", styleValues);
    var accent = (data.site && data.site.accent) || "#111111";
    var designCss = (theme.designCss || "") + "\n:root { --be-accent: " + accent + "; }";

    var doc =
      "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><style>" +
      (Blog.SHELL_CSS || "") +
      "</style><style>" + designCss + "</style><style>" + css +
      "</style></head><body class=\"be-preview\">" + html + "</body></html>";
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
    focusPostFromUrl();

    els.addPost.addEventListener("click", addPost);
    els.save.addEventListener("click", function () { readSite(); persist(true); });
    window.addEventListener("hashchange", preview);
  });
})();
