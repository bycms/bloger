/* ============================================================
 * Bloger — shared topbar injection and small DOM helpers.
 * Every tool page includes this script to render the nav.
 * ============================================================ */
var Bloger = window.Bloger || {};

(function () {
  // Inject the shared top bar if a container is present.
  var mount = document.getElementById("bloger-toolbar");
  if (mount) {
    mount.innerHTML =
      '<div class="toolbar-inner">' +
        '<a class="brand" href="index.html">' +
          '<span class="brand-mark">B</span>' +
          '<span class="brand-name">Bloger</span>' +
        "</a>" +
        '<nav class="toolbar-links">' +
          '<a href="index.html">Themes</a>' +
          '<a href="new-theme.html">Build a theme</a>' +
        "</nav>" +
      "</div>";
  }
})();

window.Bloger = Bloger;
