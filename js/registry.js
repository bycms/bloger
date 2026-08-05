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

  /* Fetch the full manifest for a theme by id. Registered themes are read
   * from their folder; a theme saved in the theme builder (localStorage)
   * resolves to a synthetic starter manifest flagged `saved`. Pass
   * `{ saved: true }` to force the saved theme even when a registered theme
   * shares the id. */
  manifest: async function (id, opts) {
    opts = opts || {};
    if (this._manifests && this._manifests[id]) return this._manifests[id];
    var entry = opts.saved ? null : await this.get(id);
    if (entry) {
      const res = await fetch("themes/" + encodeURIComponent(id) + "/manifest.json", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load manifest for theme: " + id);
      const m = await res.json();
      m.saved = false;
      if (!this._manifests) this._manifests = {};
      this._manifests[id] = m;
      return m;
    }
    if (Bloger.Scaffold && Bloger.Scaffold.savedTheme && Bloger.Scaffold.savedTheme(id)) {
      if (!this._manifests) this._manifests = {};
      this._manifests[id] = Bloger.Scaffold.savedManifest(id);
      return this._manifests[id];
    }
    throw new Error("Failed to load manifest for theme: " + id);
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
