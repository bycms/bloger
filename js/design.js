/* ============================================================
 * Bloger — design token system (foundation for the theme
 * builder's customization UI).
 *
 * Design tokens let a theme (or an adopter) customize:
 *   - page-level look: corner radius, content width, colors,
 *     body font, page arrangement (single-column / sidebar)
 *   - block-type-specific: font family, font size, font weight,
 *     color, line height, corner radius per block type
 *     (heading, paragraph, quote, list, table, image, code)
 *
 * The schema below is the single source of truth. Each token
 * maps to a CSS custom property emitted into a `:root` block so
 * theme stylesheets can consume it via var(--be-…).
 *
 * To add a new design token later, add an entry to PAGE_TOKENS
 * or BLOCK_TOKENS and (optionally) reference the variable in a
 * theme's CSS — the builder UI and runtime pick it up
 * automatically.
 * ============================================================ */
var Bloger = window.Bloger || {};

Bloger.Design = {
  /* Block types that support per-block design tokens. */
  BLOCK_TYPES: ["heading", "paragraph", "quote", "list", "table", "image", "code"],

  /* Common font families offered by the font picker. */
  FONTS: [
    "system-ui",
    "Georgia, serif",
    "Times New Roman, serif",
    "Courier New, monospace",
    "ui-monospace, monospace",
    "Arial, sans-serif",
    "Helvetica, sans-serif",
    "Verdana, sans-serif",
    "Trebuchet MS, sans-serif",
    "Impact, sans-serif"
  ],

  /* ---------- page-level tokens ---------- */
  PAGE_TOKENS: {
    cornerRadius:  { cssVar: "--be-corner-radius", type: "number", unit: "px",    default: 0,        label: "Corner radius" },
    maxWidth:      { cssVar: "--be-max-width",     type: "number", unit: "px",    default: 680,      label: "Content width" },
    pageBackground:{ cssVar: "--be-page-bg",       type: "color",  unit: null,    default: "#ffffff", label: "Page background" },
    textColor:     { cssVar: "--be-text",          type: "color",  unit: null,    default: "#111111", label: "Text color" },
    mutedColor:    { cssVar: "--be-muted",         type: "color",  unit: null,    default: "#6b6b6b", label: "Muted color" },
    borderColor:   { cssVar: "--be-border",        type: "color",  unit: null,    default: "#e0e0e0", label: "Border color" },
    bodyFontFamily:{ cssVar: "--be-body-font",     type: "font",   unit: null,    default: "system-ui", label: "Body font" },
    arrangement:   { cssVar: null,                 type: "select", unit: null,    default: "single-column",
                     options: ["single-column", "with-sidebar"], label: "Page arrangement" }
  },

  /* ---------- per-block token definitions ---------- */
  // Helper to build a block token set with per-block defaults.
  _blockSet: function (opts) {
    opts = opts || {};
    return {
      fontFamily:  { cssVar: opts.cssPrefix + "-font",   type: "font",   unit: null, default: opts.font || "inherit",           label: "Font family" },
      fontSize:    { cssVar: opts.cssPrefix + "-size",   type: "number", unit: "px", default: opts.size != null ? opts.size : 16, label: "Font size" },
      lineHeight:  { cssVar: opts.cssPrefix + "-lh",     type: "number", unit: null, default: opts.lineHeight != null ? opts.lineHeight : 1.7, label: "Line height" },
      color:       { cssVar: opts.cssPrefix + "-color",  type: "color",  unit: null, default: opts.color || "inherit",           label: "Color" },
      fontWeight:  { cssVar: opts.cssPrefix + "-weight", type: "select", unit: null, default: opts.weight != null ? opts.weight : 400,
                     options: [400, 500, 600, 700, 800], label: "Font weight" },
      cornerRadius:{ cssVar: opts.cssPrefix + "-radius", type: "number", unit: "px", default: opts.radius != null ? opts.radius : 0, label: "Corner radius" }
    };
  }
};

// Build BLOCK_TOKENS after the object literal (BLOCK_TYPES defined above).
(function () {
  var prefixes = {
    heading:   "--be-heading",
    paragraph: "--be-para",
    quote:     "--be-quote",
    list:      "--be-list",
    table:     "--be-table",
    image:     "--be-image",
    code:      "--be-code"
  };
  var defaults = {
    heading:   { size: 22, lineHeight: 1.3, weight: 700, color: "#111111" },
    paragraph: { size: 16, lineHeight: 1.7, color: "#111111" },
    quote:     { size: 16, lineHeight: 1.7, color: "#6b6b6b" },
    list:      { size: 16, lineHeight: 1.7 },
    table:     { size: 14, lineHeight: 1.5 },
    image:     { radius: 0 },
    code:      { size: 13, lineHeight: 1.6, font: "ui-monospace, SFMono-Regular, Consolas, Menlo, monospace" }
  };

  var set = {};
  Bloger.Design.BLOCK_TYPES.forEach(function (type) {
    set[type] = Bloger.Design._blockSet({
      cssPrefix: prefixes[type],
      size: defaults[type].size,
      lineHeight: defaults[type].lineHeight,
      weight: defaults[type].weight,
      color: defaults[type].color,
      font: defaults[type].font,
      radius: defaults[type].radius
    });
  });
  Bloger.Design.BLOCK_TOKENS = set;
})();

Bloger.Design._defs = function (scope) {
  return scope === "page" ? Bloger.Design.PAGE_TOKENS : Bloger.Design.BLOCK_TOKENS;
};

/* ---------- value helpers ---------- */

// Format a token value into a CSS declaration value.
Bloger.Design.valueFor = function (def, value) {
  if (value === undefined || value === null) value = def.default;
  if (def.type === "number" && def.unit) return value + def.unit;
  return String(value);
};

/* ---------- defaults / merge ---------- */

// Build a full design object ({ page, blocks }) from schema defaults,
// overridden by a theme manifest's "design" section.
Bloger.Design.defaults = function (manifestDesign) {
  manifestDesign = manifestDesign || {};
  var page = {}, blocks = {};
  Object.keys(Bloger.Design.PAGE_TOKENS).forEach(function (k) {
    page[k] = (manifestDesign.page && manifestDesign.page[k] !== undefined)
      ? manifestDesign.page[k]
      : Bloger.Design.PAGE_TOKENS[k].default;
  });
  Bloger.Design.BLOCK_TYPES.forEach(function (type) {
    blocks[type] = {};
    Object.keys(Bloger.Design.BLOCK_TOKENS[type]).forEach(function (k) {
      var v = manifestDesign.blocks && manifestDesign.blocks[type] && manifestDesign.blocks[type][k];
      blocks[type][k] = v !== undefined ? v : Bloger.Design.BLOCK_TOKENS[type][k].default;
    });
  });
  return { page: page, blocks: blocks };
};

// Merge adopter overrides on top of theme defaults.
Bloger.Design.merge = function (manifestDesign, overrides) {
  var base = Bloger.Design.defaults(manifestDesign);
  overrides = overrides || {};
  var page = base.page, blocks = base.blocks;
  Object.keys(overrides.page || {}).forEach(function (k) {
    if (Bloger.Design.PAGE_TOKENS[k] && overrides.page[k] !== undefined && overrides.page[k] !== "") page[k] = overrides.page[k];
  });
  Bloger.Design.BLOCK_TYPES.forEach(function (type) {
    var ov = (overrides.blocks || {})[type] || {};
    Object.keys(ov).forEach(function (k) {
      if (Bloger.Design.BLOCK_TOKENS[type][k] && ov[k] !== undefined && ov[k] !== "") blocks[type][k] = ov[k];
    });
  });
  return { page: page, blocks: blocks };
};

/* ---------- CSS generation ---------- */

// CSS custom property declarations for a resolved design object.
Bloger.Design.cssVars = function (design) {
  design = design || Bloger.Design.defaults();
  var lines = [];

  Object.keys(Bloger.Design.PAGE_TOKENS).forEach(function (k) {
    var def = Bloger.Design.PAGE_TOKENS[k];
    if (!def.cssVar) return; // non-CSS tokens (e.g. arrangement) handled separately
    lines.push("  " + def.cssVar + ": " + Bloger.Design.valueFor(def, design.page[k]) + ";");
  });

  Bloger.Design.BLOCK_TYPES.forEach(function (type) {
    Object.keys(Bloger.Design.BLOCK_TOKENS[type]).forEach(function (k) {
      var def = Bloger.Design.BLOCK_TOKENS[type][k];
      if (!def.cssVar) return;
      lines.push("  " + def.cssVar + ": " + Bloger.Design.valueFor(def, design.blocks[type][k]) + ";");
    });
  });

  return lines.join("\n");
};

// A full `:root { ... }` style block for a resolved design object.
Bloger.Design.styleBlock = function (design) {
  return ":root {\n" + Bloger.Design.cssVars(design) + "\n}";
};

/* ---------- layout helpers (future: page arrangement) ---------- */

// Whether the design uses a sidebar layout. Application of the layout
// classes is future work in the builder/runtime.
Bloger.Design.isSidebar = function (design) {
  return !!(design && design.page && design.page.arrangement === "with-sidebar");
};

/* ---------- reusable design-token panel ---------- */

// Render the design-token editor into `container`. `design` is a
// resolved design object ({page, blocks}); edits mutate it in place
// and call `onChange(design)`. Shared by the generator page and the
// theme builder (new-theme.html).
Bloger.Design.renderPanel = function (container, design, onChange) {
  container.innerHTML = "";

  function field(scope, blockType, key, def, value) {
    var wrap = document.createElement("div");
    wrap.className = "field";
    var label = document.createElement("label");
    label.textContent = def.label || key;
    wrap.appendChild(label);

    var el;
    if (def.type === "color") {
      el = document.createElement("input");
      el.type = "color";
      el.value = value != null ? value : def.default;
    } else if (def.type === "select") {
      el = document.createElement("select");
      (def.options || []).forEach(function (o) {
        var opt = document.createElement("option");
        opt.value = String(o);
        opt.textContent = String(o);
        if (String(o) === String(value != null ? value : def.default)) opt.selected = true;
        el.appendChild(opt);
      });
    } else if (def.type === "font") {
      el = document.createElement("input");
      el.type = "text";
      el.setAttribute("list", "bloger-fonts");
      el.value = value != null ? value : def.default;
    } else {
      el = document.createElement("input");
      el.type = "number";
      el.step = "any";
      el.value = value != null ? value : def.default;
    }

    el.addEventListener("input", function () {
      var val = el.value;
      if (def.type === "number") val = val === "" ? "" : Number(val);
      if (scope === "page") design.page[key] = val;
      else design.blocks[blockType][key] = val;
      if (onChange) onChange(design);
    });
    wrap.appendChild(el);
    return wrap;
  }

  // Page-level tokens.
  var pageWrap = document.createElement("div");
  pageWrap.className = "design-page";
  Object.keys(Bloger.Design.PAGE_TOKENS).forEach(function (key) {
    var def = Bloger.Design.PAGE_TOKENS[key];
    pageWrap.appendChild(field("page", null, key, def, design.page[key]));
  });
  container.appendChild(pageWrap);

  // Per-block tokens.
  Bloger.Design.BLOCK_TYPES.forEach(function (type) {
    var details = document.createElement("details");
    details.className = "design-block";
    var sum = document.createElement("summary");
    sum.textContent = type.charAt(0).toUpperCase() + type.slice(1);
    details.appendChild(sum);
    var body = document.createElement("div");
    body.className = "design-block-body";
    Object.keys(Bloger.Design.BLOCK_TOKENS[type]).forEach(function (key) {
      var def = Bloger.Design.BLOCK_TOKENS[type][key];
      body.appendChild(field("block", type, key, def, design.blocks[type][key]));
    });
    details.appendChild(body);
    container.appendChild(details);
  });

  // Font datalist for the font-family fields.
  var datalist = document.createElement("datalist");
  datalist.id = "bloger-fonts";
  Bloger.Design.FONTS.forEach(function (f) {
    var opt = document.createElement("option");
    opt.value = f;
    datalist.appendChild(opt);
  });
  container.appendChild(datalist);
};

window.Bloger = Bloger;
