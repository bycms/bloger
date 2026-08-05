/* ============================================================
 * Bloger — preview page logic.
 * Loads a theme by ?theme=<id>, renders index/post live in an
 * iframe, and supports opening the preview in a new tab via a
 * blob URL.
 * ============================================================ */
var Bloger = window.Bloger || {};

(function () {
  var params = new URLSearchParams(window.location.search);
  var themeId = params.get("theme");
  // &saved=1 forces a saved theme (built in the theme builder).
  var savedFlag = params.get("saved") === "1";
  var frame = document.getElementById("preview-frame");
  var errorBox = document.getElementById("preview-error");
  var nameEl = document.getElementById("theme-name");
  var currentView = "index";

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.classList.remove("hidden");
  }

  async function load() {
    if (!themeId) {
      showError("Missing ?theme=<id> in the URL.");
      return;
    }
    var manifest;
    try {
      manifest = await Bloger.Registry.manifest(themeId, { saved: savedFlag });
      nameEl.textContent = manifest.name || themeId;
    } catch (e) {
      showError("Could not load theme \"" + themeId + "\": " + e.message);
      return;
    }
    // Adopt the theme's design tokens on the preview page chrome too.
    if (Bloger.Design && Bloger.Design.applyThemeToTool) {
      Bloger.Design.applyThemeToTool(themeId, Bloger.Design.TOOL_PALETTE);
    }
    await renderView(currentView);
  }

  async function renderView(view) {
    try {
      var doc = view === "post"
        ? await Bloger.Render.postDocument(themeId, { saved: savedFlag })
        : await Bloger.Render.indexDocument(themeId, { saved: savedFlag });
      frame.srcdoc = doc;
    } catch (e) {
      showError("Could not render preview: " + e.message);
    }
  }

  // View toggle
  document.getElementById("view-toggle").addEventListener("click", function (ev) {
    var btn = ev.target.closest("[data-view]");
    if (!btn) return;
    currentView = btn.getAttribute("data-view");
    document.querySelectorAll("#view-toggle .btn").forEach(function (b) {
      b.classList.toggle("active", b === btn);
    });
    renderView(currentView);
  });

  // Open the current preview document in a new tab.
  document.getElementById("open-new-tab").addEventListener("click", async function () {
    try {
      var doc = currentView === "post"
        ? await Bloger.Render.postDocument(themeId, { saved: savedFlag })
        : await Bloger.Render.indexDocument(themeId, { saved: savedFlag });
      var blob = new Blob([doc], { type: "text/html" });
      var url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (e) {
      showError("Could not open preview: " + e.message);
    }
  });

  load();
})();
