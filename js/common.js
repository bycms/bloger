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

/* ============================================================
 * Saved-theme library (localStorage).
 * Shared by the hub, generator, preview and theme builder so a
 * theme built and saved in the theme builder is a first-class
 * theme the user can find again on the hub (index.html) and
 * preview / generate / edit.
 * ============================================================ */
Bloger.Library = {
  KEY: "bloger:themes",
  list: function () {
    try {
      var list = JSON.parse(localStorage.getItem(Bloger.Library.KEY) || "[]");
      return Array.isArray(list) ? list : [];
    } catch (e) { return []; }
  },
  get: function (id) {
    var list = Bloger.Library.list();
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  },
  save: function (id, name, design) {
    var list = Bloger.Library.list().filter(function (t) { return t.id !== id; });
    list.push({ id: id, name: name || id, design: design || {}, savedAt: new Date().toISOString() });
    try { localStorage.setItem(Bloger.Library.KEY, JSON.stringify(list)); } catch (e) { /* ignore */ }
    return list;
  },
  remove: function (id) {
    var list = Bloger.Library.list().filter(function (t) { return t.id !== id; });
    try { localStorage.setItem(Bloger.Library.KEY, JSON.stringify(list)); } catch (e) { /* ignore */ }
    return list;
  }
};

window.Bloger = Bloger;
