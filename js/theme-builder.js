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
  var previewFrame = document.getElementById("preview-frame");
  var savedListEl = document.getElementById("saved-list");
  var statusBox = document.getElementById("status");
  var errorBox = document.getElementById("builder-error");

  var design = null;      // current design object (theme defaults)
  var previewTimer = null;

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

  function resetDesign(from) {
    design = Bloger.Design.defaults(from || {});
    Bloger.Design.renderPanel(designPanel, design, function () { queuePreview(); });
  }

  /* ---------- preview ---------- */

  function queuePreview() {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(refreshPreview, 250);
  }

  function refreshPreview() {
    try {
      var pack = Bloger.Scaffold.pack(currentId(), currentName(), design);
      var doc = Bloger.Render.packPreview(pack);
      previewFrame.srcdoc = doc;
    } catch (e) { /* preview unavailable */ }
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

  function init() {
    resetDesign({});

    idEl.addEventListener("input", queuePreview);
    nameEl.addEventListener("input", queuePreview);
    refreshPreview();
    renderSaved();

    document.getElementById("save-btn").addEventListener("click", function () {
      var list = Bloger.Scaffold.saveTheme(currentId(), currentName(), design);
      renderSaved();
      showStatus("Saved <b>" + Bloger.esc(currentName()) + "</b> (" + Bloger.esc(currentId()) +
        "). You now have " + list.length + " theme(s) saved on this site.", true);
    });

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
