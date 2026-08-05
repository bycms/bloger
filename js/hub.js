/* ============================================================
 * Bloger — hub page logic.
 * Renders the theme gallery with a live in-iframe preview per
 * theme, plus Preview / Generate / Build-a-theme entrances.
 * ============================================================ */
var Bloger = window.Bloger || {};

(function () {
  var gallery = document.getElementById("theme-gallery");
  var errorBox = document.getElementById("gallery-error");

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.classList.remove("hidden");
  }

  function makeCard(theme, manifest) {
    var card = document.createElement("article");
    card.className = "theme-card";

    var preview = document.createElement("div");
    preview.className = "theme-preview";
    preview.innerHTML =
      '<span class="theme-preview-label">' + Bloger.esc(theme.name) + " preview</span>";
    var iframe = document.createElement("iframe");
    iframe.title = theme.name + " preview";
    iframe.setAttribute("loading", "lazy");
    preview.appendChild(iframe);

    var body = document.createElement("div");
    body.className = "theme-body";
    body.innerHTML =
      "<h2 class=\"theme-name\">" + Bloger.esc(theme.name) + "</h2>" +
      "<p class=\"theme-desc\">" + Bloger.esc(theme.description || "") + "</p>";

    var actions = document.createElement("div");
    actions.className = "theme-actions";
    actions.innerHTML =
      '<a class="btn btn-ghost" href="preview.html?theme=' + encodeURIComponent(theme.id) +
        '">Preview</a>' +
      '<a class="btn" href="generator.html?theme=' + encodeURIComponent(theme.id) +
        '">Generate</a>';
    body.appendChild(actions);

    card.appendChild(preview);
    card.appendChild(body);
    return { card: card, iframe: iframe };
  }

  async function init() {
    // Guard: fetch needs http(s); advise serving locally or on Pages over file://.
    if (window.location.protocol === "file:") {
      showError(
        "Bloger needs an http(s) origin to load themes (browsers block fetch() over file://). " +
        "Two easy options: <b>(1)</b> double-click <b>serve.bat</b> (or run " +
        "<span class=\"mono\">python -m http.server 8080</span>) and open " +
        "<span class=\"mono\">http://localhost:8080</span>; or <b>(2)</b> push this folder to a " +
        "GitHub repository and enable GitHub Pages — it is served over https with no local server."
      );
    }

    var list;
    try {
      list = await Bloger.Registry.list();
    } catch (e) {
      showError("Could not load themes.json: " + e.message);
      return;
    }

    if (!list.length) {
      showError("No themes registered yet. Add a theme folder and register it in themes.json.");
      return;
    }

    for (var i = 0; i < list.length; i++) {
      var t = list[i];
      var manifest;
      try {
        manifest = await Bloger.Registry.manifest(t.id);
      } catch (e) {
        manifest = {};
      }
      var built = makeCard(t, manifest);
      gallery.appendChild(built.card);
      // Live preview: render the theme's index page into the iframe.
      (function (iframe) {
        Bloger.Render.indexDocument(t.id)
          .then(function (doc) { iframe.srcdoc = doc; })
          .catch(function () { /* preview unavailable — leave blank */ });
      })(built.iframe);
    }
  }

  init();
})();
