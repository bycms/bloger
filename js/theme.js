/* ============================================================
 * Bloger — shared utilities
 * Pure static, no build. Loaded as plain scripts (script tags,
 * non-module) in dependency order.
 * ============================================================ */

// Guard to avoid double definition when a page loads modules twice.
var Bloger = window.Bloger || {};

/* ------------------------------------------------------------
 * HTML escaping — used to safely inject user content / tokens
 * into generated HTML.
 * ---------------------------------------------------------- */
Bloger.esc = function (s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

/* ------------------------------------------------------------
 * Inline markdown-lite for body text:
 *   **bold** , *italic* , `code`
 * Applied AFTER HTML escaping so user markup cannot inject tags.
 * ---------------------------------------------------------- */
Bloger.inline = function (str) {
  if (str == null) return "";
  let s = Bloger.esc(str);
  s = s.replace(/`([^`]+)`/g, (m, c) => "<code>" + c + "</code>");
  s = s.replace(/\*\*([^*]+)\*\*/g, (m, c) => "<strong>" + c + "</strong>");
  s = s.replace(/\*([^*]+)\*/g, (m, c) => "<em>" + c + "</em>");
  s = s.replace(/\n/g, "<br>");
  return s;
};

/* ------------------------------------------------------------
 * Slugify — derive a URL-safe id from a heading.
 * ---------------------------------------------------------- */
Bloger.slug = function (s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

/* ------------------------------------------------------------
 * Block model.
 *
 * A block is a plain object:
 *   { type:'heading',    text, level }         // level 1-3
 *   { type:'paragraph',  text }
 *   { type:'quote',      text }
 *   { type:'list',       ordered, items:[] }
 *   { type:'table',      rows:[[cell,...],...] }
 *   { type:'image',      url, caption }
 *   { type:'code',       text, language }
 *   { type:'divider' }
 * ---------------------------------------------------------- */

// Render a single block object to HTML.
Bloger.renderBlockData = function (b) {
  if (!b || !b.type) return "";
  switch (b.type) {
    case "heading": {
      var level = Math.min(Math.max(parseInt(b.level || 2, 10), 1), 4);
      return "<h" + level + ">" + Bloger.inline(b.text) + "</h" + level + ">";
    }
    case "paragraph": {
      if (!String(b.text || "").trim()) return "";
      return "<p>" + Bloger.inline(b.text) + "</p>";
    }
    case "quote": {
      return "<blockquote>" + Bloger.inline(b.text) + "</blockquote>";
    }
    case "list": {
      var tag = b.ordered ? "ol" : "ul";
      var items = (b.items || [])
        .map(function (i) { return "<li>" + Bloger.inline(i) + "</li>"; })
        .join("");
      return "<" + tag + ">" + items + "</" + tag + ">";
    }
    case "table": {
      var rows = (b.rows || [])
        .map(function (r) {
          return "<tr>" + r.map(function (c) { return "<td>" + Bloger.inline(c) + "</td>"; }).join("") + "</tr>";
        })
        .join("");
      return '<div class="table-wrap"><table>' + rows + "</table></div>";
    }
    case "image": {
      var cap = b.caption ? "<figcaption>" + Bloger.esc(b.caption) + "</figcaption>" : "";
      return '<figure class="post-figure"><img src="' + Bloger.esc(b.url) +
        '" alt="' + Bloger.esc(b.caption || "") + '" loading="lazy">' + cap + "</figure>";
    }
    case "code": {
      return '<pre><code class="language-' + Bloger.esc(b.language || "") + '">' +
        Bloger.esc(b.text) + "</code></pre>";
    }
    case "divider":
      return '<hr class="post-divider">';
    default:
      return "";
  }
};

// Render an array of block objects to HTML.
Bloger.renderBlocksData = function (blocks) {
  if (!blocks || !blocks.length) return "";
  return blocks
    .map(function (b) { return Bloger.renderBlockData(b); })
    .filter(Boolean)
    .join("\n");
};

/* ------------------------------------------------------------
 * Markdown-style shortcut detection (used by the editor):
 * When a block line starts with one of these, it is converted
 * to the matching block type (like typing in Markdown/Notion).
 * ---------------------------------------------------------- */
Bloger.parseMarkdownBlock = function (line) {
  var s = String(line || "");
  // H1 / H2 / H3
  var h = /^(#{1,3})\s+(.*)$/.exec(s);
  if (h) return { type: "heading", text: h[2], level: h[1].length };
  // Quote
  var q = /^>\s?(.*)$/.exec(s);
  if (q) return { type: "quote", text: q[1] };
  // Unordered list "- item" / "* item"
  var u = /^[-*]\s+(.*)$/.exec(s);
  if (u) return { type: "list", ordered: false, items: [u[1]] };
  // Ordered list "1. item"
  var o = /^\d+[.)]\s+(.*)$/.exec(s);
  if (o) return { type: "list", ordered: true, items: [o[1]] };
  // Divider
  if (/^(-{3,}|\*{3,})$/.test(s.trim())) return { type: "divider", text: "" };
  // Image ![alt](url)
  var img = /^!\[([^\]]*)\]\((\S+)\)$/.exec(s.trim());
  if (img) return { type: "image", url: img[2], caption: img[1] || "" };
  // Code fence
  if (/^\s*(```|~~~)\s*([\w-]*)\s*$/.test(s)) {
    return { type: "code", text: "", language: /```\s*([\w-]*)/.exec(s)[1] || "" };
  }
  return null;
};

/* ------------------------------------------------------------
 * Utility: format date
 * ---------------------------------------------------------- */
Bloger.formatDate = function (str) {
  const d = str ? new Date(str) : new Date();
  if (isNaN(d.getTime())) return "—";
  const y = d.getFullYear();
  const mo = ("0" + (d.getMonth() + 1)).slice(-2);
  const day = ("0" + d.getDate()).slice(-2);
  return y + "-" + mo + "-" + day;
};

window.Bloger = Bloger;
