/* ============================================================
 * Bloger — color mode (light / dark) for the tool UI.
 *
 * Included in the <head> of every tool page so the stored (or
 * OS-default) mode is applied before first paint (no flash).
 * The choice is persisted to localStorage and shared across all
 * pages. Exposed as Bloger.ThemeMode for the toolbar toggle.
 * ============================================================ */
var Bloger = window.Bloger || {};

(function () {
  var KEY = "bloger:mode";
  var DARK = "dark";
  var LIGHT = "light";

  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function systemPrefersDark() {
    try {
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch (e) { return false; }
  }

  function current() {
    var s = stored();
    return s === DARK || s === LIGHT ? s : (systemPrefersDark() ? DARK : LIGHT);
  }

  // Set <html data-theme="dark"> (or remove it) and keep the toolbar toggle in sync.
  function apply(mode) {
    if (mode !== DARK) mode = LIGHT;
    var root = document.documentElement;
    if (mode === DARK) root.setAttribute("data-theme", DARK);
    else root.removeAttribute("data-theme");

    var t = document.querySelector(".theme-toggle");
    if (t) {
      var toLight = mode === DARK;
      t.textContent = toLight ? "\u2600" : "\u263E"; // ☀ / ☾
      t.setAttribute("aria-label", toLight ? "Switch to light mode" : "Switch to dark mode");
      t.title = toLight ? "Switch to light mode" : "Switch to dark mode";
    }
    return mode;
  }

  function set(mode) {
    try { localStorage.setItem(KEY, mode); } catch (e) { /* ignore */ }
    return apply(mode);
  }

  function toggle() {
    return set(current() === DARK ? LIGHT : DARK);
  }

  // Wire the toolbar button + cross-tab sync. Called once after the
  // shared toolbar (js/common.js) has been injected into the page.
  function init() {
    var btn = document.querySelector(".theme-toggle");
    if (btn && !btn.getAttribute("data-bound")) {
      btn.setAttribute("data-bound", "1");
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        toggle();
      });
    }
    apply(current());

    if (window.addEventListener) {
      window.addEventListener("storage", function (e) {
        if (e.key === KEY) apply(current());
      });
    }
  }

  // Apply before first paint (this script runs in <head>).
  apply(current());

  Bloger.ThemeMode = {
    KEY: KEY,
    DARK: DARK,
    LIGHT: LIGHT,
    current: current,
    apply: apply,
    set: set,
    toggle: toggle,
    init: init
  };
})();
