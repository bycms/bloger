/* ============================================================
 * Bloger — theme registry loader
 * Loads themes.json (index) and per-theme manifests.
 * ============================================================ */
var Bloger = window.Bloger || {};

Bloger.Registry = {
  /* Fetch and cache the registry index. */
  load: async function () {
    if (this._index) return this._index;
    const res = await fetch("themes.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load themes.json");
    this._index = await res.json();
    return this._index;
  },

  /* All theme entries (metadata summary) from the index. */
  list: async function () {
    const idx = await this.load();
    return idx.themes || [];
  },

  /* Resolve a theme entry by id. */
  get: async function (id) {
    const list = await this.list();
    return list.find(function (t) { return t.id === id; }) || null;
  },

  /* Fetch the full manifest for a theme by id. */
  manifest: async function (id) {
    if (this._manifests && this._manifests[id]) return this._manifests[id];
    const res = await fetch("themes/" + encodeURIComponent(id) + "/manifest.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load manifest for theme: " + id);
    const m = await res.json();
    if (!this._manifests) this._manifests = {};
    this._manifests[id] = m;
    return m;
  },

  /* Fetch the raw text content of one file within a theme. */
  fetchFile: async function (themeId, relativePath) {
    const res = await fetch(
      "themes/" + encodeURIComponent(themeId) + "/" + relativePath,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error("Failed to load theme file: " + relativePath);
    return await res.text();
  },
};

window.Bloger = Bloger;
