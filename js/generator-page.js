/* ============================================================
 * Bloger — generator page logic (trial editor).
 * Site settings + a Word-like block editor for posts, a live
 * preview, and "Download project ZIP" which produces the
 * self-contained folder (index.html + edit.html + theme pack).
 * No local persistence needed here.
 * ============================================================ */
var Bloger = window.Bloger || {};

(function () {
  var params = new URLSearchParams(window.location.search);
  var themeId = params.get("theme");

  var errorBox = document.getElementById("generator-error");
  var statusBox = document.getElementById("status");
  var postsEl = document.getElementById("posts");
  var previewFrame = document.getElementById("preview-frame");
  var manifest = null;

  var data = { site: { title: "", subtitle: "", bio: "", accent: "#111111" }, posts: [], theme: themeId };
  var editors = [];
  var previewTimer = null;

  function showError(msg) {
    errorBox.innerHTML = msg;
    errorBox.classList.remove("hidden");
  }
  function clearError() { errorBox.classList.add("hidden"); }

  function showStatus(html, ok) {
    statusBox.className = "msg " + (ok ? "ok" : "err");
    statusBox.innerHTML = html;
    statusBox.classList.remove("hidden");
  }

  function slug(s) {
    return String(s || "blog").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  /* ---------- site fields ---------- */

  function bindSite() {
    // Seed defaults from manifest.config where keys match.
    (manifest.config || []).forEach(function (f) {
      if (f.key === "title") data.site.title = f.default || "My Blog";
      if (f.key === "subtitle") data.site.subtitle = f.default || "";
      if (f.key === "bio") data.site.bio = f.default || "";
      if (f.key === "accent") data.site.accent = f.default || "#111111";
    });
    document.getElementById("cfg-title").value = data.site.title;
    document.getElementById("cfg-subtitle").value = data.site.subtitle;
    document.getElementById("cfg-bio").value = data.site.bio;
    document.getElementById("cfg-accent").value = data.site.accent;

    ["title", "subtitle", "bio", "accent"].forEach(function (k) {
      var el = document.getElementById("cfg-" + k);
      el.addEventListener("input", function () {
        data.site[k] = el.value;
        queuePreview();
      });
    });
  }

  /* ---------- design tokens panel ---------- */

  function renderDesignPanel() {
    var panel = document.getElementById("design-panel");
    if (!panel) return;
    Bloger.Design.renderPanel(panel, data.design, function () { queuePreview(); });
  }

  /* ---------- posts editor ---------- */

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
      queuePreview();
    });
    dateInput.addEventListener("input", function () {
      post.date = dateInput.value;
      queuePreview();
    });
    removeBtn.addEventListener("click", function () {
      var i = data.posts.indexOf(post);
      if (i >= 0) data.posts.splice(i, 1);
      renderPosts();
      queuePreview();
    });

    var editor = BlogEditor.create(body, {
      blocks: post.blocks || [],
      onChange: function (blocks) {
        post.blocks = blocks;
        queuePreview();
      }
    });
    editors.push({ post: post, editor: editor });

    return card;
  }

  function renderPosts() {
    postsEl.innerHTML = "";
    editors = [];
    if (!data.posts.length) {
      var empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "No posts yet. Add one below.";
      postsEl.appendChild(empty);
      return;
    }
    data.posts.forEach(function (p, i) {
      if (!p.id) p.id = slug(p.title) || ("post-" + (i + 1));
      postsEl.appendChild(postCard(p, i));
    });
  }

  function addPost() {
    data.posts.push({
      id: "post-" + (data.posts.length + 1),
      title: "",
      date: "",
      blocks: [{ type: "paragraph", text: "" }]
    });
    renderPosts();
    queuePreview();
    var cards = postsEl.querySelectorAll(".post-card");
    var last = cards[cards.length - 1];
    if (last) {
      var root = last.querySelector(".be-root");
      if (root && root._be) root._be.focus(0);
      last.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  /* ---------- live preview ---------- */

  function queuePreview() {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(runPreview, 250);
  }

  async function runPreview() {
    if (!manifest) return;
    try {
      var doc = await Bloger.Render.dataDocument(themeId, data);
      previewFrame.srcdoc = doc;
    } catch (e) {
      /* preview unavailable */
    }
  }

  /* ---------- download ---------- */

  function slugify(s) {
    return String(s || "blog").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  async function download() {
    clearError();
    if (!data.site.title.trim()) {
      showError("Please fill in the blog title.");
      return;
    }
    var btn = document.getElementById("download-btn");
    btn.disabled = true;
    btn.textContent = "Building…";
    try {
      var files = await Bloger.Generator.build(manifest, data);
      var zipName = "bloger-" + manifest.id + "-" + slugify(data.site.title) + ".zip";
      var blob = await Bloger.Generator.downloadZip(zipName, files);
      showStatus(
        "Done! Downloaded <b>" + Bloger.esc(zipName) + "</b> (" + (blob.size / 1024).toFixed(1) + " KB). " +
        "Unzip it: open <span class=\"mono\">index.html</span> to view your blog, and " +
        "<span class=\"mono\">edit.html</span> to edit it in the browser. Upload the folder to GitHub Pages to publish.",
        true
      );
    } catch (e) {
      showStatus("Generation failed: " + e.message, false);
    } finally {
      btn.disabled = false;
      btn.textContent = "Download project ZIP";
    }
  }

  /* ---------- init ---------- */

  async function init() {
    if (!themeId) {
      showError("Missing ?theme=<id> in the URL.");
      return;
    }
    try {
      manifest = await Bloger.Registry.manifest(themeId);
    } catch (e) {
      showError("Could not load theme \"" + themeId + "\": " + e.message);
      return;
    }

    document.getElementById("theme-name").textContent = "Generate — " + (manifest.name || themeId);
    document.getElementById("theme-meta").textContent = (manifest.version || "") + " · by " + (manifest.author || "Bloger");
    document.getElementById("theme-desc").textContent = manifest.description || "";

    data.theme = manifest.id;
    // Seed sample posts on first visit.
    data.posts = Bloger.Generator.samplePosts();
    // Seed design tokens from the theme's manifest (theme defaults).
    data.design = Bloger.Design
      ? Bloger.Design.merge(manifest.design, null)
      : { page: {}, blocks: {} };

    bindSite();
    renderDesignPanel();
    renderPosts();
    runPreview();

    document.getElementById("add-post").addEventListener("click", addPost);
    document.getElementById("download-btn").addEventListener("click", download);
    document.getElementById("reset").addEventListener("click", function () {
      data.site = { title: "My Blog", subtitle: "", bio: "", accent: "#111111" };
      data.posts = Bloger.Generator.samplePosts();
      data.design = Bloger.Design ? Bloger.Design.merge(manifest.design, null) : { page: {}, blocks: {} };
      bindSite();
      renderDesignPanel();
      renderPosts();
      runPreview();
      showStatus("Reset to sample content.", true);
    });
  }

  init();
})();
