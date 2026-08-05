/* ============================================================
 * Bloger — design token system (Iteration 6).
 *
 * Design tokens let a theme (or an adopter) customize the whole
 * site. Tokens are grouped by scope:
 *
 *   page        — global layout & palette
 *   shell       — topbar / sidebar / footer (the runtime chrome)
 *   typography  — h1 / h2 / h3 / small / links
 *   blocks      — per-block tokens for every block type
 *   motion      — transitions / easing
 *
 * Every token maps to a CSS custom property (--be-…) emitted into
 * a `:root` block so the shell CSS and theme stylesheets can
 * consume it via var(--be-…). Tokens with `cssVar: null` are pure
 * data (layout/decoration selectors) applied by future stages.
 *
 * To add a token: add a definition to the relevant group and
 * reference the variable in CSS — the panel + runtime pick it up
 * automatically. All defaults preserve the classic Minimal look.
 * ============================================================ */
var Bloger = window.Bloger || {};

Bloger.Design = {
  // Blocks with per-block tokens. "heading" is styled via the
  // typography h1/h2/h3 tokens; "divider" is handled separately.
  BLOCK_TYPES: ["paragraph", "quote", "list", "table", "image", "code"],

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
  ]
};

/* ============================================================
 * Token definitions
 * ============================================================ */

// Page-level layout & palette.
Bloger.Design.PAGE_TOKENS = {
  cornerRadius:     { cssVar: "--be-corner-radius", type: "number", unit: "px", default: 0,          label: "Corner radius" },
  maxWidth:         { cssVar: "--be-max-width",     type: "number", unit: "px", default: 680,        label: "Content width" },
  contentGap:       { cssVar: "--be-content-gap",   type: "number", unit: "px", default: 18,         label: "Block spacing" },
  pageBackground:   { cssVar: "--be-page-bg",       type: "color",  default: "#ffffff",              label: "Page background" },
  contentBg:        { cssVar: "--be-content-bg",    type: "color",  default: "transparent",          label: "Content background" },
  textColor:        { cssVar: "--be-text",          type: "color",  default: "#111111",              label: "Text color" },
  mutedColor:       { cssVar: "--be-muted",         type: "color",  default: "#6b6b6b",              label: "Muted color" },
  borderColor:      { cssVar: "--be-border",        type: "color",  default: "#e0e0e0",              label: "Border color" },
  bodyFontFamily:   { cssVar: "--be-body-font",     type: "font",   default: "system-ui",            label: "Body font" },
  bodyFontSize:     { cssVar: "--be-body-size",     type: "number", unit: "px", default: 16,         label: "Body font size" },
  bodyLineHeight:   { cssVar: "--be-body-lh",       type: "number", default: 1.7,                    label: "Body line height" },
  bodyLetterSpacing:{ cssVar: "--be-body-ls",       type: "number", unit: "em", default: 0,          label: "Body letter-spacing" },
  textAlign:        { cssVar: "--be-text-align",    type: "select", options: ["left", "justify", "center"], default: "left", label: "Text alignment" },
  selectionBg:      { cssVar: "--be-selection-bg",  type: "color",  default: "#000000",              label: "Selection background" },
  selectionFg:      { cssVar: "--be-selection-fg",  type: "color",  default: "#ffffff",              label: "Selection text" },
  focusRing:        { cssVar: "--be-focus-ring",    type: "color",  default: "#111111",              label: "Focus ring" },
  pageDecoration:   { cssVar: null,                 type: "select", options: ["none", "frame", "soft-shadow", "pattern"], default: "none", label: "Page decoration" },
  arrangement:      { cssVar: null,                 type: "select", options: ["with-sidebar", "single-column"], default: "with-sidebar", label: "Page arrangement" }
};

// Shell chrome (topbar / sidebar / footer).
Bloger.Design.SHELL_TOKENS = {
  topbar: {
    bg:           { cssVar: "--be-topbar-bg",          type: "color",  default: "#ffffff",        label: "Background" },
    fg:           { cssVar: "--be-topbar-fg",          type: "color",  default: "#111111",        label: "Text / title" },
    border:       { cssVar: "--be-topbar-border",      type: "color",  default: "#e0e0e0",        label: "Bottom border" },
    height:       { cssVar: "--be-topbar-height",      type: "number", unit: "px", default: 52,    label: "Height" },
    font:         { cssVar: "--be-topbar-font",        type: "font",   default: "inherit",        label: "Font" },
    titleSize:    { cssVar: "--be-topbar-title-size",  type: "number", unit: "px", default: 17,    label: "Title size" },
    titleWeight:  { cssVar: "--be-topbar-title-weight",type: "select", options: [400, 500, 600, 700, 800], default: 700, label: "Title weight" },
    toggleRadius: { cssVar: "--be-toggle-radius",      type: "number", unit: "px", default: 0,     label: "Toggle radius" },
    sticky:       { cssVar: null,                      type: "select", options: ["sticky", "static"], default: "sticky", label: "Position" },
    shadow:       { cssVar: null,                      type: "select", options: ["none", "soft"],  default: "none", label: "Scroll shadow" }
  },
  sidebar: {
    bg:           { cssVar: "--be-sidebar-bg",           type: "color",  default: "#ffffff",          label: "Background" },
    fg:           { cssVar: "--be-sidebar-fg",           type: "color",  default: "#111111",          label: "Text" },
    border:       { cssVar: "--be-sidebar-border",       type: "color",  default: "#e0e0e0",          label: "Right border" },
    width:        { cssVar: "--be-sidebar-width",        type: "number", unit: "px", default: 262,     label: "Width" },
    itemRadius:   { cssVar: "--be-sidebar-item-radius",  type: "number", unit: "px", default: 0,       label: "Item radius" },
    itemPadding:  { cssVar: "--be-sidebar-item-padding", type: "string", default: "8px 10px",          label: "Item padding" },
    titleSize:    { cssVar: "--be-sidebar-title-size",   type: "number", unit: "px", default: 14,      label: "Title size" },
    titleWeight:  { cssVar: "--be-sidebar-title-weight", type: "select", options: [400, 500, 600, 700, 800], default: 600, label: "Title weight" },
    dateSize:     { cssVar: "--be-sidebar-date-size",    type: "number", unit: "px", default: 12,      label: "Date size" },
    dateColor:    { cssVar: "--be-sidebar-date-color",   type: "color",  default: "#6b6b6b",          label: "Date color" },
    hoverBg:      { cssVar: "--be-sidebar-hover-bg",     type: "color",  default: "rgba(0,0,0,0.04)", label: "Hover background" },
    activeBg:     { cssVar: "--be-sidebar-active-bg",    type: "color",  default: "rgba(0,0,0,0.05)", label: "Active background" },
    activeBar:    { cssVar: "--be-sidebar-active-bar",   type: "color",  default: "#111111",          label: "Active indicator" },
    headSize:     { cssVar: "--be-sidebar-head-size",    type: "number", unit: "px", default: 11,      label: "Label size" },
    gap:          { cssVar: "--be-sidebar-gap",          type: "number", unit: "px", default: 2,       label: "Item gap" }
  },
  footer: {
    bg:           { cssVar: "--be-footer-bg",    type: "color",  default: "#ffffff",        label: "Background" },
    fg:           { cssVar: "--be-footer-fg",    type: "color",  default: "#6b6b6b",        label: "Text" },
    border:       { cssVar: "--be-footer-border",type: "color",  default: "#e0e0e0",        label: "Top border" },
    size:         { cssVar: "--be-footer-size",  type: "number", unit: "px", default: 12,    label: "Font size" },
    padding:      { cssVar: "--be-footer-padding",type: "string", default: "14px 24px",      label: "Padding" }
  }
};

// Typography hierarchy + links.
Bloger.Design.TYPO_TOKENS = {
  h1: {
    font:    { cssVar: "--be-h1-font",    type: "font",   default: "inherit",  label: "Font" },
    size:    { cssVar: "--be-h1-size",    type: "number", unit: "px", default: 30,    label: "Size" },
    weight:  { cssVar: "--be-h1-weight",  type: "select", options: [400, 500, 600, 700, 800], default: 700, label: "Weight" },
    lh:      { cssVar: "--be-h1-lh",      type: "number", default: 1.25,  label: "Line height" },
    ls:      { cssVar: "--be-h1-ls",      type: "number", unit: "em", default: -0.02, label: "Letter-spacing" },
    color:   { cssVar: "--be-h1-color",   type: "color",  default: "#111111", label: "Color" },
    margin:  { cssVar: "--be-h1-margin",  type: "number", unit: "px", default: 0,  label: "Top margin" }
  },
  h2: {
    font:    { cssVar: "--be-h2-font",    type: "font",   default: "inherit",  label: "Font" },
    size:    { cssVar: "--be-h2-size",    type: "number", unit: "px", default: 22,    label: "Size" },
    weight:  { cssVar: "--be-h2-weight",  type: "select", options: [400, 500, 600, 700, 800], default: 700, label: "Weight" },
    lh:      { cssVar: "--be-h2-lh",      type: "number", default: 1.3,  label: "Line height" },
    ls:      { cssVar: "--be-h2-ls",      type: "number", unit: "em", default: 0,    label: "Letter-spacing" },
    color:   { cssVar: "--be-h2-color",   type: "color",  default: "#111111", label: "Color" },
    margin:  { cssVar: "--be-h2-margin",  type: "number", unit: "px", default: 34,   label: "Top margin" }
  },
  h3: {
    font:    { cssVar: "--be-h3-font",    type: "font",   default: "inherit",  label: "Font" },
    size:    { cssVar: "--be-h3-size",    type: "number", unit: "px", default: 19,    label: "Size" },
    weight:  { cssVar: "--be-h3-weight",  type: "select", options: [400, 500, 600, 700, 800], default: 700, label: "Weight" },
    lh:      { cssVar: "--be-h3-lh",      type: "number", default: 1.3,  label: "Line height" },
    ls:      { cssVar: "--be-h3-ls",      type: "number", unit: "em", default: 0,    label: "Letter-spacing" },
    color:   { cssVar: "--be-h3-color",   type: "color",  default: "#111111", label: "Color" },
    margin:  { cssVar: "--be-h3-margin",  type: "number", unit: "px", default: 28,   label: "Top margin" }
  },
  small: {
    size:  { cssVar: "--be-small-size",  type: "number", unit: "px", default: 13,   label: "Size" },
    color: { cssVar: "--be-small-color", type: "color",  default: "#6b6b6b", label: "Color" }
  },
  link: {
    color:    { cssVar: "--be-link-color",      type: "color",  default: "#111111", label: "Color" },
    hoverColor:{ cssVar: "--be-link-hover-color",type: "color", default: "#111111", label: "Hover color" },
    underline: { cssVar: "--be-link-underline", type: "select", options: ["underline", "none", "dotted"], default: "underline", label: "Underline" },
    thickness: { cssVar: "--be-link-thickness", type: "number", unit: "px", default: 1, label: "Underline width" }
  }
};

// Per-block tokens.
(function () {
  function base(prefix, d) {
    d = d || {};
    return {
      fontFamily:   { cssVar: prefix + "-font",   type: "font",   default: d.font != null ? d.font : "inherit", label: "Font family" },
      fontSize:     { cssVar: prefix + "-size",   type: "number", unit: "px", default: d.size != null ? d.size : 16, label: "Font size" },
      lineHeight:   { cssVar: prefix + "-lh",     type: "number", default: d.lh != null ? d.lh : 1.7, label: "Line height" },
      color:        { cssVar: prefix + "-color",  type: "color",  default: d.color != null ? d.color : "inherit", label: "Color" },
      fontWeight:   { cssVar: prefix + "-weight", type: "select", options: [400, 500, 600, 700, 800], default: d.weight != null ? d.weight : 400, label: "Font weight" },
      letterSpacing:{ cssVar: prefix + "-ls",     type: "number", unit: "em", default: 0, label: "Letter-spacing" },
      textAlign:    { cssVar: prefix + "-align",  type: "select", options: ["inherit", "left", "center", "right", "justify"], default: "inherit", label: "Text align" },
      cornerRadius: { cssVar: prefix + "-radius", type: "number", unit: "px", default: d.radius != null ? d.radius : 0, label: "Corner radius" }
    };
  }

  var P = {
    paragraph: "--be-para",
    quote:     "--be-quote",
    list:      "--be-list",
    table:     "--be-table",
    image:     "--be-image",
    code:      "--be-code"
  };
  var D = {
    paragraph: { size: 16, lh: 1.7, color: "#111111" },
    quote:     { size: 16, lh: 1.7, color: "#6b6b6b" },
    list:      { size: 16, lh: 1.7 },
    table:     { size: 14, lh: 1.5 },
    image:     { size: 16, lh: 1.7 },
    code:      { size: 13, lh: 1.6, font: "ui-monospace, SFMono-Regular, Consolas, Menlo, monospace" }
  };

  var set = {};
  Bloger.Design.BLOCK_TYPES.forEach(function (type) {
    var t = base(P[type], D[type]);
    if (type === "quote") {
      t.background  = { cssVar: P[type] + "-bg",      type: "color",  default: "transparent", label: "Background" };
      t.borderColor = { cssVar: P[type] + "-border",  type: "color",  default: "#111111", label: "Border color" };
      t.borderWidth = { cssVar: P[type] + "-border-w",type: "number", unit: "px", default: 3, label: "Border width" };
      t.fontStyle   = { cssVar: P[type] + "-style",   type: "select", options: ["normal", "italic"], default: "italic", label: "Style" };
    }
    if (type === "list") {
      t.markerType = { cssVar: P[type] + "-marker", type: "select", options: ["disc", "circle", "square", "decimal"], default: "disc", label: "Marker" };
      t.markerColor= { cssVar: P[type] + "-marker-c",type: "color",  default: "#6b6b6b", label: "Marker color" };
      t.indent     = { cssVar: P[type] + "-indent", type: "number", unit: "em", default: 1.4, label: "Indent" };
      t.itemGap    = { cssVar: P[type] + "-gap",    type: "number", unit: "px", default: 2, label: "Item gap" };
    }
    if (type === "table") {
      t.cellPadding  = { cssVar: P[type] + "-cell-p", type: "string", default: "8px 10px", label: "Cell padding" };
      t.borderColor  = { cssVar: P[type] + "-border", type: "color",  default: "#e0e0e0", label: "Border color" };
      t.headerBg     = { cssVar: P[type] + "-head-bg", type: "color", default: "#f4f4f4", label: "Header background" };
      t.headerColor  = { cssVar: P[type] + "-head-c",  type: "color", default: "#111111", label: "Header color" };
      t.rowStripeBg  = { cssVar: P[type] + "-stripe",  type: "color", default: "transparent", label: "Striped row" };
      t.rowHoverBg   = { cssVar: P[type] + "-hover",   type: "color", default: "rgba(0,0,0,0.04)", label: "Row hover" };
    }
    if (type === "image") {
      t.shadow    = { cssVar: P[type] + "-shadow",  type: "select", options: [{ value: "none", label: "None" }, { value: "0 6px 24px rgba(0,0,0,0.12)", label: "Soft" }], default: "none", label: "Shadow" };
      t.maxWidth  = { cssVar: P[type] + "-maxw",    type: "number", unit: "%", default: 100, label: "Max width" };
      t.captionSize = { cssVar: P[type] + "-cap-s", type: "number", unit: "px", default: 13, label: "Caption size" };
      t.captionColor= { cssVar: P[type] + "-cap-c", type: "color",  default: "#6b6b6b", label: "Caption color" };
    }
    if (type === "code") {
      t.background = { cssVar: P[type] + "-bg", type: "color",  default: "#f4f4f4", label: "Background" };
      t.padding    = { cssVar: P[type] + "-pad",type: "string", default: "14px", label: "Padding" };
    }
    if (type === "divider") {
      // divider handled separately below
    }
    set[type] = t;
  });
  // Divider is a block with its own minimal set.
  set.divider = {
    style:    { cssVar: "--be-divider-style",     type: "select", options: ["solid", "dashed", "dotted"], default: "solid", label: "Style" },
    thickness:{ cssVar: "--be-divider-thickness", type: "number", unit: "px", default: 1, label: "Thickness" },
    spacing:  { cssVar: "--be-divider-spacing",   type: "number", unit: "px", default: 28, label: "Spacing" },
    color:    { cssVar: "--be-divider-color",     type: "color",  default: "#e0e0e0", label: "Color" }
  };
  Bloger.Design.BLOCK_TOKENS = set;
})();

// Motion.
Bloger.Design.MOTION_TOKENS = {
  duration: { cssVar: "--be-duration", type: "number", unit: "s", default: 0.18, label: "Transition duration" },
  easing:   { cssVar: "--be-easing",   type: "select", options: ["ease", "ease-in", "ease-out", "ease-in-out", "linear"], default: "ease", label: "Easing" }
};

/* ============================================================
 * Helpers
 * ============================================================ */

Bloger.Design.valueFor = function (def, value) {
  if (value === undefined || value === null || value === "") value = def.default;
  if (def.type === "number" && def.unit) return value + def.unit;
  return String(value);
};

// Build a leaf value object from a def set + source.
function leafValues(defs, src) {
  var o = {};
  Object.keys(defs).forEach(function (k) {
    o[k] = (src && src[k] !== undefined) ? src[k] : defs[k].default;
  });
  return o;
}

// Full design object from schema defaults + a theme manifest's design.
Bloger.Design.defaults = function (manifestDesign) {
  manifestDesign = manifestDesign || {};
  var blocks = {};
  Bloger.Design.BLOCK_TYPES.forEach(function (type) {
    blocks[type] = leafValues(Bloger.Design.BLOCK_TOKENS[type], manifestDesign.blocks && manifestDesign.blocks[type]);
  });
  blocks.divider = leafValues(Bloger.Design.BLOCK_TOKENS.divider, manifestDesign.blocks && manifestDesign.blocks.divider);
  return {
    page: leafValues(Bloger.Design.PAGE_TOKENS, manifestDesign.page),
    shell: {
      topbar: leafValues(Bloger.Design.SHELL_TOKENS.topbar, manifestDesign.shell && manifestDesign.shell.topbar),
      sidebar: leafValues(Bloger.Design.SHELL_TOKENS.sidebar, manifestDesign.shell && manifestDesign.shell.sidebar),
      footer: leafValues(Bloger.Design.SHELL_TOKENS.footer, manifestDesign.shell && manifestDesign.shell.footer)
    },
    typography: {
      h1: leafValues(Bloger.Design.TYPO_TOKENS.h1, manifestDesign.typography && manifestDesign.typography.h1),
      h2: leafValues(Bloger.Design.TYPO_TOKENS.h2, manifestDesign.typography && manifestDesign.typography.h2),
      h3: leafValues(Bloger.Design.TYPO_TOKENS.h3, manifestDesign.typography && manifestDesign.typography.h3),
      small: leafValues(Bloger.Design.TYPO_TOKENS.small, manifestDesign.typography && manifestDesign.typography.small),
      link: leafValues(Bloger.Design.TYPO_TOKENS.link, manifestDesign.typography && manifestDesign.typography.link)
    },
    blocks: blocks,
    motion: leafValues(Bloger.Design.MOTION_TOKENS, manifestDesign.motion)
  };
};

// Merge adopter overrides on top of theme defaults.
function applyLeaf(obj, defs, ov) {
  if (!ov) return;
  Object.keys(defs).forEach(function (k) {
    if (ov[k] !== undefined && ov[k] !== "") obj[k] = ov[k];
  });
}

Bloger.Design.merge = function (manifestDesign, overrides) {
  var base = Bloger.Design.defaults(manifestDesign);
  overrides = overrides || {};
  applyLeaf(base.page, Bloger.Design.PAGE_TOKENS, overrides.page);
  ["topbar", "sidebar", "footer"].forEach(function (g) {
    applyLeaf(base.shell[g], Bloger.Design.SHELL_TOKENS[g], overrides.shell && overrides.shell[g]);
  });
  ["h1", "h2", "h3", "small", "link"].forEach(function (g) {
    applyLeaf(base.typography[g], Bloger.Design.TYPO_TOKENS[g], overrides.typography && overrides.typography[g]);
  });
  Bloger.Design.BLOCK_TYPES.concat(["divider"]).forEach(function (type) {
    applyLeaf(base.blocks[type], Bloger.Design.BLOCK_TOKENS[type], overrides.blocks && overrides.blocks[type]);
  });
  applyLeaf(base.motion, Bloger.Design.MOTION_TOKENS, overrides.motion);
  return base;
};

/* ============================================================
 * CSS generation
 * ============================================================ */

// Walk every leaf token and call fn(scopeLabel, def, value).
function eachToken(design, fn) {
  function walk(defs, obj) {
    Object.keys(defs).forEach(function (k) { fn(defs[k], obj[k]); });
  }
  walk(Bloger.Design.PAGE_TOKENS, design.page);
  ["topbar", "sidebar", "footer"].forEach(function (g) {
    walk(Bloger.Design.SHELL_TOKENS[g], design.shell[g]);
  });
  ["h1", "h2", "h3", "small", "link"].forEach(function (g) {
    walk(Bloger.Design.TYPO_TOKENS[g], design.typography[g]);
  });
  Bloger.Design.BLOCK_TYPES.concat(["divider"]).forEach(function (type) {
    walk(Bloger.Design.BLOCK_TOKENS[type], design.blocks[type]);
  });
  walk(Bloger.Design.MOTION_TOKENS, design.motion);
}

// A radius token is *inherited* from the global --be-corner-radius: when a
// block / shell radius is still at its schema default we omit the declaration
// so the CSS fallback chain (var(--be-…-radius, var(--be-corner-radius, 0)))
// applies the page-level corner radius. The global token itself always emits.
function isInheritedRadius(def, value) {
  return !!def.cssVar &&
         def.cssVar !== "--be-corner-radius" &&
         /-radius$/i.test(def.cssVar) &&
         String(value) === String(def.default);
}

// CSS custom property declarations for a resolved design object.
Bloger.Design.cssVars = function (design) {
  design = design || Bloger.Design.defaults();
  var lines = [];
  eachToken(design, function (def, value) {
    if (!def.cssVar) return;
    if (isInheritedRadius(def, value)) return;
    lines.push("  " + def.cssVar + ": " + Bloger.Design.valueFor(def, value) + ";");
  });
  return lines.join("\n");
};

// A full `:root { ... }` style block.
Bloger.Design.styleBlock = function (design) {
  return ":root {\n" + Bloger.Design.cssVars(design) + "\n}";
};

// Whether the design uses a sidebar layout (applied by a future stage).
Bloger.Design.isSidebar = function (design) {
  return !!(design && design.page && design.page.arrangement === "with-sidebar");
};

/* ============================================================
 * Applying a design to an existing page ("themes rule every page")
 * ------------------------------------------------------------
 * A theme's design tokens can be applied to ANY page — including
 * Bloger's own tool pages and the adopter's editor — by injecting
 * a `:root { --be-… }` block plus a small palette mapping that
 * forwards the page's own CSS variables to theme tokens. The page
 * keeps its layout; it just adopts the theme's colors, fonts,
 * radius and spacing ("design tokens only").
 * ============================================================ */

// Forward Bloger tool chrome (css/tool.css --tool-*) to theme tokens.
Bloger.Design.TOOL_PALETTE = {
  "--tool-bg":     "--be-page-bg",
  "--tool-ink":    "--be-text",
  "--tool-muted":  "--be-muted",
  "--tool-line":   "--be-border",
  "--tool-accent": "--be-text",
  "--radius":      "--be-corner-radius"
};

// Forward the downloaded editor chrome (edit.html --ink/--line/…) to theme tokens.
Bloger.Design.EDITOR_PALETTE = {
  "--ink":   "--be-text",
  "--muted": "--be-muted",
  "--line":  "--be-border",
  "--panel": "--be-page-bg"
};

// Build the palette-forwarding `:root` block.
Bloger.Design.paletteCss = function (mapDefs) {
  if (!mapDefs) return "";
  var lines = Object.keys(mapDefs).map(function (target) {
    return "  " + target + ": var(" + mapDefs[target] + ");";
  });
  return lines.length ? "\n:root {\n" + lines.join("\n") + "\n}" : "";
};

// Inject a design onto the current page (design tokens + optional palette).
Bloger.Design.applyToPage = function (design, mapDefs) {
  var el = document.getElementById("be-design-style");
  if (!el) {
    el = document.createElement("style");
    el.id = "be-design-style";
    document.head.appendChild(el);
  }
  el.textContent =
    Bloger.Design.styleBlock(design || Bloger.Design.defaults()) +
    Bloger.Design.paletteCss(mapDefs) +
    "\nbody { font-family: var(--be-body-font, inherit); }";
};

// Load a registered theme and apply its design tokens to the current page.
Bloger.Design.applyThemeToTool = async function (themeId, mapDefs) {
  if (!Bloger.Registry) return;
  try {
    var manifest = await Bloger.Registry.manifest(themeId);
    var design = Bloger.Design.merge(manifest.design, null);
    Bloger.Design.applyToPage(design, mapDefs || Bloger.Design.TOOL_PALETTE);
  } catch (e) { /* non-fatal */ }
};

/* ============================================================
 * Reusable design-token panel
 * ============================================================ */

// Render the design-token editor into `container`. `design` is a
// resolved design object; edits mutate it in place and call
// `onChange(design)`. Shared by the generator page + theme builder.
Bloger.Design.renderPanel = function (container, design, onChange) {
  container.innerHTML = "";

  function resolve(path) {
    var t = design;
    for (var i = 0; i < path.length; i++) t = t[path[i]];
    return t;
  }

  function field(path, def) {
    var value = resolve(path);
    var wrap = document.createElement("div");
    wrap.className = "field";
    var label = document.createElement("label");
    label.textContent = def.label || path[path.length - 1];
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
        var val = typeof o === "object" ? o.value : String(o);
        opt.value = val;
        opt.textContent = typeof o === "object" ? o.label : String(o);
        if (val === String(value != null ? value : def.default)) opt.selected = true;
        el.appendChild(opt);
      });
    } else if (def.type === "font" || def.type === "string") {
      el = document.createElement("input");
      el.type = "text";
      if (def.type === "font") el.setAttribute("list", "bloger-fonts");
      el.value = value != null ? value : def.default;
    } else {
      el = document.createElement("input");
      el.type = "number";
      el.step = "any";
      el.value = value != null ? value : def.default;
    }

    el.style.outline = "none";
    el.style.border = "1px solid #222";
    el.style.borderRadius = "0";
    el.style.height = "40px";
    el.style.padding = "0 8px";

    el.addEventListener("input", function () {
      var val = el.value;
      if (def.type === "number") val = val === "" ? "" : Number(val);
      var target = design;
      for (var i = 0; i < path.length - 1; i++) target = target[path[i]];
      target[path[path.length - 1]] = val;
      if (onChange) onChange(design);
    });
    wrap.appendChild(el);
    return wrap;
  }

  // Leaf group rendered as a grid of fields.
  function leafGroup(defs, basePath, cssClass) {
    var wrap = document.createElement("div");
    wrap.className = cssClass || "design-page";
    Object.keys(defs).forEach(function (k) {
      wrap.appendChild(field(basePath.concat(k), defs[k]));
    });
    return wrap;
  }

  // Sub-scope group rendered as an accordion of fields.
  function subGroup(title, defsMap, basePath) {
    var details = document.createElement("details");
    details.className = "design-block";
    var sum = document.createElement("summary");
    sum.textContent = title;
    details.appendChild(sum);
    var body = document.createElement("div");
    body.className = "design-block-body";
    Object.keys(defsMap).forEach(function (k) {
      body.appendChild(field(basePath.concat(k), defsMap[k]));
    });
    details.appendChild(body);
    return details;
  }

  function scopeTitle(text) {
    var h = document.createElement("h3");
    h.className = "design-scope-title";
    h.textContent = text;
    return h;
  }

  // 1. Page
  container.appendChild(leafGroup(Bloger.Design.PAGE_TOKENS, ["page"], "design-page"));

  // 2. Shell (topbar / sidebar / footer)
  container.appendChild(scopeTitle("Shell — topbar · sidebar · footer"));
  ["topbar", "sidebar", "footer"].forEach(function (g) {
    var label = g.charAt(0).toUpperCase() + g.slice(1);
    container.appendChild(subGroup(label, Bloger.Design.SHELL_TOKENS[g], ["shell", g]));
  });

  // 3. Typography & links
  container.appendChild(scopeTitle("Typography & links"));
  var typoLabels = { h1: "Heading 1", h2: "Heading 2", h3: "Heading 3", small: "Small text", link: "Links" };
  ["h1", "h2", "h3", "small", "link"].forEach(function (g) {
    container.appendChild(subGroup(typoLabels[g], Bloger.Design.TYPO_TOKENS[g], ["typography", g]));
  });

  // 4. Blocks
  container.appendChild(scopeTitle("Blocks"));
  Bloger.Design.BLOCK_TYPES.concat(["divider"]).forEach(function (type) {
    var label = type.charAt(0).toUpperCase() + type.slice(1);
    container.appendChild(subGroup(label, Bloger.Design.BLOCK_TOKENS[type], ["blocks", type]));
  });

  // 5. Motion
  container.appendChild(scopeTitle("Motion"));
  container.appendChild(leafGroup(Bloger.Design.MOTION_TOKENS, ["motion"], "design-page"));

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
