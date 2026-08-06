/* ============================================================
 * Bloger — theme builder page logic (new-theme.html).
 * Generate a theme on the site: preview it live, save it to the
 * site's localStorage, and download it as a theme pack.
 * Depends on Bloger.Design, Bloger.Scaffold, Bloger.Render.
 * ============================================================ */
var Bloger = window.Bloger || {};

(function () {
  var idEl = document.getElementById("theme-id");
  var nameEl = document.getElementById("theme-name");
  var designPanel = document.getElementById("design-panel");
  var darkPanelEl = document.getElementById("dark-panel");
  var modeTabs = document.getElementById("mode-tabs");
  var darkSyncEl = document.getElementById("dark-sync");
  var darkSyncCheck = document.getElementById("dark-sync-check");
  var darkSyncNote = document.getElementById("dark-sync-note");
  var previewFrame = document.getElementById("preview-frame");
  var savedListEl = document.getElementById("saved-list");
  var statusBox = document.getElementById("status");
  var errorBox = document.getElementById("builder-error");

  var design = null;      // current design object (theme defaults)
  var previewTimer = null;
  var previewAccent = "#111111"; // accent used in the live preview (forked from the theme's config default)
  var activeMode = "light";  // which design-token tab is open: "light" | "dark"
  var darkPanelRendered = false;

  function slugify(s) {
    return String(s || "my-theme").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  function showStatus(html, ok) {
    statusBox.className = "msg " + (ok ? "ok" : "err");
    statusBox.innerHTML = html;
    statusBox.classList.remove("hidden");
  }

  function currentId() { return slugify(idEl.value) || "my-theme"; }
  function currentName() { return nameEl.value.trim() || currentId(); }

  /* ---------- design ---------- */

  // Adopt the theme being built onto the Bloger page itself (tokens only).
  function applyToolTheme() {
    if (Bloger.Design && Bloger.Design.applyToPage) {
      Bloger.Design.applyToPage(design, Bloger.Design.TOOL_PALETTE);
    }
  }

  // Guarantee a `design.dark` config object exists.
  function ensureDarkConfig() {
    if (!design || typeof design.dark !== "object" || design.dark === null) design.dark = {};
    if (design.dark.sync === undefined) design.dark.sync = true;
  }

  // The explicit dark design document used when sync is off. Seeded from the
  // derived dark palette the first time it is needed, then edited by the user.
  function explicitDarkDesign() {
    ensureDarkConfig();
    if (!design.dark.page) {
      var derived = Bloger.Design.deriveDark(design);
      derived.sync = false;
      design.dark = derived;
    }
    return design.dark;
  }

  // Reflect the active tab + sync state in the DOM.
  function renderModeUI() {
    var isDark = activeMode === "dark";
    Array.prototype.forEach.call(modeTabs.querySelectorAll(".mode-tab"), function (b) {
      b.classList.toggle("active", b.getAttribute("data-mode") === activeMode);
    });
    darkSyncEl.classList.toggle("hidden", !isDark);
    designPanel.classList.toggle("hidden", isDark);
    darkPanelEl.classList.add("hidden");
    if (!isDark) return;

    var syncing = darkSyncCheck.checked;
    darkSyncNote.classList.toggle("hidden", !syncing);
    if (syncing) return;

    // Sync off → render the editable dark design once (edits persist in place).
    darkPanelRendered = true;
    if (darkPanelEl.childNodes.length === 0) {
      Bloger.Design.renderPanel(darkPanelEl, explicitDarkDesign(), function () { queuePreview(); });
    }
    darkPanelEl.classList.remove("hidden");
  }

  function resetDesign(from) {
    design = Bloger.Design.defaults(from || {});
    designPanel.innerHTML = "";
    darkPanelEl.innerHTML = "";
    darkPanelRendered = false;
    Bloger.Design.renderPanel(designPanel, design, function () { queuePreview(); applyToolTheme(); });
    // Sync defaults to ON unless the loaded design carried an explicit dark config.
    ensureDarkConfig();
    darkSyncCheck.checked = design.dark.sync !== false;
    activeMode = "light";
    renderModeUI();
    applyToolTheme();
  }

  // Quick-start presets are intentionally not rendered here — the hub
  // (index.html) is where you fork built-in themes. Kept as a safe no-op so
  // the builder's init flow doesn't trip on a missing function.
  function renderPresets() { /* no-op */ }

  /* ---------- preview ---------- */

  function queuePreview() {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(refreshPreview, 250);
  }

  function refreshPreview() {
    try {
      var pack = Bloger.Scaffold.pack(currentId(), currentName(), design);
      var data = {
        site: { title: "My Blog", subtitle: "", bio: "", accent: previewAccent },
        posts: Bloger.Scaffold.samplePosts(),
        theme: pack.id
      };
      var doc = Bloger.Render.packPreview(pack, data);
      previewFrame.srcdoc = doc;
    } catch (e) { /* preview unavailable */ }
  }

  // Read a theme manifest's accent config default (falls back to #111111).
  function forkAccent(m) {
    var acc = "#111111";
    (m.config || []).forEach(function (f) {
      if (f.key === "accent") acc = f.default || acc;
    });
    return acc;
  }

  /* ---------- saved themes ---------- */

  function renderSaved() {
    savedListEl.innerHTML = "";
    var list = Bloger.Scaffold.listSaved();
    if (!list.length) {
      var empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "No saved themes yet. Build one above and press “Save to my themes”.";
      savedListEl.appendChild(empty);
      return;
    }
    list.forEach(function (t) {
      var row = document.createElement("div");
      row.className = "saved-row";

      var info = document.createElement("div");
      info.className = "saved-info";
      var name = document.createElement("span");
      name.className = "saved-name";
      name.textContent = t.name;
      var id = document.createElement("span");
      id.className = "saved-id";
      id.textContent = t.id;
      info.appendChild(name);
      info.appendChild(id);
      row.appendChild(info);

      var actions = document.createElement("div");
      actions.className = "saved-actions";

      var loadBtn = document.createElement("button");
      loadBtn.className = "btn btn-sm btn-ghost";
      loadBtn.textContent = "Edit";
      loadBtn.addEventListener("click", function () {
        idEl.value = t.id;
        nameEl.value = t.name;
        resetDesign(t.design);
        refreshPreview();
      });
      actions.appendChild(loadBtn);

      var dlBtn = document.createElement("button");
      dlBtn.className = "btn btn-sm";
      dlBtn.textContent = "Download";
      dlBtn.addEventListener("click", function () {
        dlBtn.disabled = true;
        Bloger.Scaffold.download(t.id, t.name, t.design).then(function (blob) {
          showStatus("Downloaded <b>" + Bloger.esc(t.id) + "-theme.zip</b> (" + (blob.size / 1024).toFixed(1) + " KB).", true);
        }).catch(function (e) {
          showStatus("Failed: " + e.message, false);
        }).finally(function () { dlBtn.disabled = false; });
      });
      actions.appendChild(dlBtn);

      var delBtn = document.createElement("button");
      delBtn.className = "btn btn-sm btn-ghost";
      delBtn.textContent = "Delete";
      delBtn.addEventListener("click", function () {
        Bloger.Scaffold.removeTheme(t.id);
        renderSaved();
      });
      actions.appendChild(delBtn);

      row.appendChild(actions);
      savedListEl.appendChild(row);
    });
  }
  
  /* ---------- init ---------- */

  // Load a predefined (registered) theme's design defaults into the builder
  // so the user can fork it: tweak, then save their own copy.
  function loadFork(forkId) {
    Bloger.Registry.manifest(forkId).then(function (m) {
      var forkId2 = slugify(forkId + "-copy") || "my-theme";
      idEl.value = forkId2;
      nameEl.value = (m.name || forkId) + " (fork)";
      previewAccent = forkAccent(m);
      resetDesign(m.design || {});
      refreshPreview();
      showStatus(
        "Forked <b>" + Bloger.esc(m.name || forkId) + "</b> — it is a copy. " +
        "Tweak the design below, then press <b>Save to my themes</b> to keep your own version.",
        true
      );
    }).catch(function () {
      resetDesign({});
      refreshPreview();
      showStatus("Could not fork that preset — starting from a blank theme.", false);
    });
  }

  function init() {
    // &edit=<savedId> (from the hub) opens the theme builder already loaded
    // with that saved theme. &fork=<themeId> opens it with a predefined
    // (registered) theme's design so the user can fork and edit it.
    var params = new URLSearchParams(window.location.search);
    var editId = params.get("edit");
    var forkId = params.get("fork");

    idEl.addEventListener("input", queuePreview);
    nameEl.addEventListener("input", queuePreview);

    // Light / Dark design-token tabs.
    Array.prototype.forEach.call(modeTabs.querySelectorAll(".mode-tab"), function (b) {
      b.addEventListener("click", function () {
        activeMode = b.getAttribute("data-mode");
        renderModeUI();
      });
    });

    // "Sync dark mode with Light": when off, the user edits an explicit dark design.
    darkSyncCheck.addEventListener("change", function () {
      ensureDarkConfig();
      design.dark.sync = darkSyncCheck.checked;
      if (!darkSyncCheck.checked) explicitDarkDesign();
      renderModeUI();
      queuePreview();
    });

    document.getElementById("save-btn").addEventListener("click", function () {
      var list = Bloger.Scaffold.saveTheme(currentId(), currentName(), design);
      renderSaved();
      showStatus("Saved <b>" + Bloger.esc(currentName()) + "</b> (" + Bloger.esc(currentId()) +
        "). You now have " + list.length + " theme(s) saved on this site.", true);
    });

    var saved = editId ? Bloger.Scaffold.savedTheme(editId) : null;
    if (forkId && !editId) {
      resetDesign({});
      loadFork(forkId);
    } else {
      resetDesign(saved ? saved.design : {});
      if (saved) {
        idEl.value = saved.id;
        nameEl.value = saved.name;
      }
    }
    refreshPreview();
    renderSaved();
    renderPresets(forkId && !editId ? forkId : null);

    document.getElementById("download-btn").addEventListener("click", function () {
      var btn = document.getElementById("download-btn");
      btn.disabled = true;
      btn.textContent = "Building…";
      Bloger.Scaffold.download(currentId(), currentName(), design).then(function (blob) {
        showStatus("Downloaded <b>" + Bloger.esc(currentId()) + "-theme.zip</b> (" + (blob.size / 1024).toFixed(1) + " KB). " +
          "Copy <span class=\"mono\">themes/" + Bloger.esc(currentId()) + ".js</span> into your blog folder's " +
          "<span class=\"mono\">themes/</span> and add it to <span class=\"mono\">themes/index.js</span> (see the zip's README).", true);
      }).catch(function (e) {
        showStatus("Failed: " + e.message, false);
      }).finally(function () {
        btn.disabled = false;
        btn.textContent = "Download theme pack";
      });
    });
  }

  init();
})();
