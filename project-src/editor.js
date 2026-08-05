/* ============================================================
 * Bloger block editor (self-contained, no deps).
 * A clean, Word-like editor where content is not wrapped in
 * boxes. Type "/" for the block menu, or use Markdown shortcuts
 * (# heading, > quote, - list, 1. ordered, ``` code, --- divider,
 * ![alt](url) image).
 *
 * API:
 *   BlogEditor.create(container, { blocks, onChange })
 *   BlogEditor.create(container, { blocks, onChange, onRequestPreview })
 * ============================================================ */
(function () {
  "use strict";
  var BlogEditor = (window.BlogEditor = window.BlogEditor || {});

  var MENU_ITEMS = [
    { type: "paragraph", label: "Text", hint: "Just start writing" },
    { type: "heading", label: "Heading 1", hint: "Big section heading", level: 1 },
    { type: "heading", label: "Heading 2", hint: "Medium section heading", level: 2 },
    { type: "heading", label: "Heading 3", hint: "Small section heading", level: 3 },
    { type: "quote", label: "Quote", hint: "Capture a quote" },
    { type: "list", label: "Bulleted list", hint: "Create a simple list", ordered: false },
    { type: "list", label: "Numbered list", hint: "Create a numbered list", ordered: true },
    { type: "table", label: "Table", hint: "Add a table" },
    { type: "image", label: "Image", hint: "Embed an image by URL" },
    { type: "code", label: "Code", hint: "Capture a code snippet" },
    { type: "divider", label: "Divider", hint: "Visually divide blocks" }
  ];

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* ---------------- block creation ---------------- */

  function defaultBlock(type, extra) {
    var b = { type: type };
    switch (type) {
      case "heading": b.text = ""; b.level = (extra && extra.level) || 2; break;
      case "paragraph": case "quote": case "code": b.text = ""; break;
      case "list": b.ordered = !!(extra && extra.ordered); b.items = [""]; break;
      case "table": b.rows = [["", "", ""], ["", "", ""]]; break;
      case "image": b.url = ""; b.caption = ""; break;
      case "divider": break;
    }
    return b;
  }

  /* ---------------- serialization ---------------- */

  function serializeRow(row) {
    var type = row.getAttribute("data-type");
    if (type === "list") {
      var items = [];
      row.querySelectorAll(".be-list-item").forEach(function (li) {
        items.push(li.textContent);
      });
      // Drop trailing empty items.
      while (items.length && !items[items.length - 1].trim()) items.pop();
      var ordered = row.getAttribute("data-ordered") === "1";
      if (!items.length) return null;
      return { type: "list", ordered: ordered, items: items };
    }
    if (type === "table") {
      var rows = [];
      var any = false;
      row.querySelectorAll("tr").forEach(function (tr) {
        var cells = [];
        tr.querySelectorAll("td").forEach(function (td) { cells.push(td.textContent); });
        rows.push(cells);
        if (cells.some(function (c) { return c.trim(); })) any = true;
      });
      if (!any) return null;
      return { type: "table", rows: rows };
    }
    if (type === "image") {
      var url = row.querySelector(".be-img-url").value.trim();
      if (!url) return null;
      return { type: "image", url: url, caption: row.querySelector(".be-img-caption").value.trim() };
    }
    if (type === "divider") return { type: "divider" };

    // Text blocks
    var content = row.querySelector(".be-content");
    var text = content ? content.textContent : "";
    if (type === "heading") {
      if (!text.trim()) return null;
      return { type: "heading", text: text, level: parseInt(row.getAttribute("data-level") || "2", 10) };
    }
    if (type === "code") {
      if (!text.trim()) return null;
      return { type: "code", text: text, language: "" };
    }
    if (type === "quote") {
      if (!text.trim()) return null;
      return { type: "quote", text: text };
    }
    if (!text.trim()) return null;
    return { type: "paragraph", text: text };
  }

  function serialize(root) {
    var out = [];
    root.querySelectorAll(".be-row").forEach(function (row) {
      var b = serializeRow(row);
      if (b) out.push(b);
    });
    return out;
  }

  /* ---------------- rendering one block row ---------------- */

  function buildRow(block, ctx) {
    var type = block.type || "paragraph";
    var row = el("div", "be-row be-" + type);
    row.setAttribute("data-type", type);
    row.setAttribute("contenteditable", "false");

    if (type === "heading") row.setAttribute("data-level", block.level || 2);

    // Hover toolbar (up / down / delete).
    var bar = el("div", "be-bar");
    var up = el("button", "be-tool", "↑"); up.title = "Move up";
    var down = el("button", "be-tool", "↓"); down.title = "Move down";
    var del = el("button", "be-tool be-del", "✕"); del.title = "Delete block";
    bar.appendChild(up); bar.appendChild(down); bar.appendChild(del);
    row.appendChild(bar);

    up.addEventListener("click", function () {
      if (row.previousElementSibling && row.previousElementSibling.classList.contains("be-row")) {
        ctx.root.insertBefore(row, row.previousElementSibling);
        emit(ctx);
      }
    });
    down.addEventListener("click", function () {
      var next = row.nextElementSibling;
      if (next && next.classList.contains("be-row")) {
        ctx.root.insertBefore(next, row);
        emit(ctx);
      }
    });
    del.addEventListener("click", function () {
      if (ctx.root.querySelectorAll(".be-row").length <= 1) return;
      row.remove();
      emit(ctx);
    });

    if (type === "paragraph" || type === "heading" || type === "quote" || type === "code") {
      var ce = el("div", "be-content");
      ce.setAttribute("contenteditable", "true");
      if (type === "code") ce.setAttribute("spellcheck", "false");
      ce.textContent = block.text || "";
      row.appendChild(ce);
      attachTextRow(ce, row, ctx);
    } else if (type === "list") {
      buildList(row, block, ctx);
    } else if (type === "table") {
      buildTable(row, block, ctx);
    } else if (type === "image") {
      buildImage(row, block, ctx);
    } else if (type === "divider") {
      row.appendChild(el("div", "be-divider"));
    }

    return row;
  }

  /* ---------------- list block ---------------- */

  function buildList(row, block, ctx) {
    row.setAttribute("data-ordered", block.ordered ? "1" : "0");
    var list = el("div", "be-list");
    list.setAttribute("contenteditable", "false");
    row.appendChild(list);

    function addItem(text) {
      var item = el("div", "be-list-item");
      item.setAttribute("contenteditable", "true");
      item.textContent = text || "";
      list.appendChild(item);
      attachListItem(item, row, ctx);
    }

    (block.items && block.items.length ? block.items : [""]).forEach(addItem);
  }

  function attachListItem(item, row, ctx) {
    item.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter") {
        ev.preventDefault();
        // Caret offset within the item.
        var sel = window.getSelection();
        var offset = 0;
        if (sel.rangeCount) {
          var range = sel.getRangeAt(0);
          var pre = range.cloneRange();
          pre.selectNodeContents(item);
          pre.setEnd(range.startContainer, range.startOffset);
          offset = pre.toString().length;
        }
        var full = item.textContent;
        var before = full.slice(0, offset);
        var after = full.slice(offset);
        item.textContent = before;

        if (!item.textContent.trim() && !item.nextElementSibling) {
          // Empty last item: close the list into a paragraph.
          var para = buildRow(defaultBlock("paragraph"), ctx);
          para.querySelector(".be-content").textContent = after;
          row.after(para);
          item.remove();
          emit(ctx);
          placeCaret(para.querySelector(".be-content"));
          return;
        }
        if (!item.textContent.trim() && item.nextElementSibling) {
          // Empty item in the middle: drop it and move focus to next.
          var next = item.nextElementSibling;
          item.remove();
          emit(ctx);
          placeCaret(next);
          return;
        }
        var newItem = el("div", "be-list-item");
        newItem.setAttribute("contenteditable", "true");
        newItem.textContent = after;
        item.after(newItem);
        attachListItem(newItem, row, ctx);
        emit(ctx);
        placeCaret(newItem);
      } else if (ev.key === "Backspace" && !item.textContent.trim()) {
        var prev = item.previousElementSibling;
        if (prev && prev.classList.contains("be-list-item")) {
          ev.preventDefault();
          item.remove();
          emit(ctx);
          placeCaretEnd(prev);
        }
      } else if (ev.key === "Tab") {
        ev.preventDefault();
        emit(ctx);
      }
    });
  }

  /* ---------------- table block ---------------- */

  function buildTable(row, block, ctx) {
    var wrap = el("div", "be-table-wrap");
    var table = el("table", "be-table");
    wrap.appendChild(table);
    row.appendChild(wrap);

    function render(rows) {
      table.innerHTML = "";
      rows.forEach(function (cells) {
        var tr = el("tr");
        cells.forEach(function (c) {
          var td = el("td", "be-cell");
          td.setAttribute("contenteditable", "true");
          td.textContent = c || "";
          tr.appendChild(td);
        });
        // Cell menu: remove row / add col handled via toolbar buttons.
        table.appendChild(tr);
      });
    }

    render(block.rows || [["", "", ""], ["", "", ""]]);

    var tools = el("div", "be-table-tools");
    var addRow = el("button", "be-tool", "+ row");
    var addCol = el("button", "be-tool", "+ col");
    var delRow = el("button", "be-tool", "− row");
    tools.appendChild(addRow); tools.appendChild(addCol); tools.appendChild(delRow);
    row.appendChild(tools);

    function collect() {
      var rows = [];
      table.querySelectorAll("tr").forEach(function (tr) {
        var cells = [];
        tr.querySelectorAll("td").forEach(function (td) { cells.push(td.textContent); });
        rows.push(cells);
      });
      return rows;
    }

    addRow.addEventListener("click", function () {
      var rows = collect();
      var n = rows[0] ? rows[0].length : 2;
      rows.push(new Array(n).fill(""));
      render(rows); emit(ctx);
    });
    addCol.addEventListener("click", function () {
      var rows = collect();
      rows.forEach(function (r) { r.push(""); });
      if (!rows.length) rows = [["", ""]];
      render(rows); emit(ctx);
    });
    delRow.addEventListener("click", function () {
      var rows = collect();
      if (rows.length <= 1) return;
      rows.pop(); render(rows); emit(ctx);
    });
  }

  /* ---------------- image block ---------------- */

  function buildImage(row, block, ctx) {
    var url = el("input", "be-img-url");
    url.type = "text";
    url.placeholder = "Image URL (https://…)";
    url.value = block.url || "";
    var cap = el("input", "be-img-caption");
    cap.type = "text";
    cap.placeholder = "Caption (optional)";
    cap.value = block.caption || "";
    var preview = el("div", "be-img-preview");

    function refreshPreview() {
      var v = url.value.trim();
      preview.innerHTML = "";
      if (v) {
        var img = el("img");
        img.src = v;
        img.alt = "";
        preview.appendChild(img);
      }
    }

    url.addEventListener("input", function () { refreshPreview(); emit(ctx); });
    cap.addEventListener("input", function () { emit(ctx); });
    refreshPreview();

    row.appendChild(url);
    row.appendChild(cap);
    row.appendChild(preview);
  }

  /* ---------------- text row behaviour ---------------- */

  function attachTextRow(ce, row, ctx) {
    // Caret offset within a contenteditable (character count before caret).
    function caretOffset() {
      var sel = window.getSelection();
      if (!sel.rangeCount) return 0;
      var range = sel.getRangeAt(0);
      var pre = range.cloneRange();
      pre.selectNodeContents(ce);
      pre.setEnd(range.startContainer, range.startOffset);
      return pre.toString().length;
    }

    ce.addEventListener("keydown", function (ev) {
      var type = row.getAttribute("data-type");
      if (ev.key === "Enter" && type !== "code") {
        ev.preventDefault();
        if (ev.shiftKey) {
          document.execCommand("insertLineBreak");
          emit(ctx);
          return;
        }
        // Split block at caret: text before stays, text after goes to a new paragraph.
        var offset = caretOffset();
        var full = ce.textContent;
        var before = full.slice(0, offset);
        var after = full.slice(offset);
        ce.textContent = before;
        var newBlock = defaultBlock("paragraph");
        newBlock.text = after;
        var newRow = buildRow(newBlock, ctx);
        row.after(newRow);
        emit(ctx);
        var content = newRow.querySelector(".be-content");
        if (content) { content.textContent = after; placeCaret(content); }
        return;
      }
      if (ev.key === "Backspace" && !ce.textContent.trim()) {
        var prev = row.previousElementSibling;
        if (prev && prev.classList.contains("be-row")) {
          ev.preventDefault();
          row.remove();
          emit(ctx);
          var prevContent = prev.querySelector(".be-content") || prev.querySelector(".be-list-item:last-child") || prev.querySelector(".be-cell");
          if (prevContent) placeCaretEnd(prevContent);
        } else if (!prev || !prev.classList.contains("be-row")) {
          // First block — keep it (don't delete all).
          ev.preventDefault();
        }
      } else if (ev.key === "Tab") {
        ev.preventDefault();
      }
    });

    ce.addEventListener("input", function () {
      var text = ce.textContent;
      // Markdown shortcut conversion.
      var type = row.getAttribute("data-type");
      if (type === "paragraph" || type === "heading") {
        var conv = tryMarkdownConvert(text);
        if (conv && conv.consumed) {
          applyConvert(row, conv.block, ctx, ce);
          return;
        }
      }
      emit(ctx);
    });
  }

  function tryMarkdownConvert(text) {
    var h = /^(#{1,3})\s(.*)$/.exec(text);
    if (h) return { consumed: true, block: { type: "heading", text: h[2], level: h[1].length } };
    var q = /^>\s?(.*)$/.exec(text);
    if (q) return { consumed: true, block: { type: "quote", text: q[1] } };
    var u = /^[-*]\s(.*)$/.exec(text);
    if (u) return { consumed: true, block: { type: "list", ordered: false, items: [u[1]] } };
    var o = /^\d+[.)]\s(.*)$/.exec(text);
    if (o) return { consumed: true, block: { type: "list", ordered: true, items: [o[1]] } };
    if (/^(-{3,}|\*{3,})$/.test(text.trim())) return { consumed: true, block: { type: "divider" } };
    var img = /^!\[([^\]]*)\]\((\S+)\)$/.exec(text.trim());
    if (img) return { consumed: true, block: { type: "image", url: img[2], caption: img[1] || "" } };
    if (/^```\s*$/.test(text.trim())) return { consumed: true, block: { type: "code", text: "", language: "" } };
    return null;
  }

  function applyConvert(row, block, ctx, focusTarget) {
    var newRow = buildRow(block, ctx);
    row.replaceWith(newRow);
    emit(ctx);
    if (block.type === "list") {
      var first = newRow.querySelector(".be-list-item");
      if (first) placeCaretEnd(first);
    } else if (block.type === "table") {
      var cell = newRow.querySelector(".be-cell");
      if (cell) placeCaret(cell);
    } else if (block.type === "image") {
      var inp = newRow.querySelector(".be-img-url");
      if (inp) inp.focus();
    } else {
      var ce = newRow.querySelector(".be-content");
      if (ce) placeCaretEnd(ce);
    }
  }

  /* ---------------- slash menu ---------------- */

  function buildSlashMenu(ctx) {
    var menu = el("div", "be-slash");
    menu.style.display = "none";
    document.body.appendChild(menu);

    function hide() { menu.style.display = "none"; menu.innerHTML = ""; }

    function show(anchor, filter, onPick) {
      menu.innerHTML = "";
      var items = MENU_ITEMS.filter(function (it) {
        if (!filter) return true;
        return (it.label + " " + it.hint).toLowerCase().indexOf(filter.toLowerCase()) !== -1;
      });
      if (!items.length) { hide(); return; }
      items.forEach(function (it) {
        var itEl = el("button", "be-slash-item");
        var label = el("span", "be-slash-label", it.label);
        var hint = el("span", "be-slash-hint", it.hint);
        itEl.appendChild(label); itEl.appendChild(hint);
        itEl.addEventListener("mousedown", function (ev) {
          ev.preventDefault();
          onPick(it);
        });
        menu.appendChild(itEl);
      });
      var r = anchor.getBoundingClientRect();
      menu.style.display = "block";
      menu.style.left = Math.min(r.left, window.innerWidth - 260) + "px";
      menu.style.top = (r.bottom + 4) + "px";
    }

    return { menu: menu, show: show, hide: hide };
  }

  /* ---------------- caret helpers ---------------- */

  function placeCaret(node) {
    node.focus();
    var sel = window.getSelection();
    var range = document.createRange();
    range.selectNodeContents(node);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function placeCaretEnd(node) {
    node.focus();
    var sel = window.getSelection();
    var range = document.createRange();
    range.selectNodeContents(node);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  /* ---------------- emit ---------------- */

  function emit(ctx) {
    if (ctx.onChange) {
      var blocks = serialize(ctx.root);
      ctx.onChange(blocks);
    }
  }

  /* ---------------- create ---------------- */

  BlogEditor.create = function (container, options) {
    options = options || {};
    var root = el("div", "be-root");
    container.appendChild(root);

    var ctx = { root: root, onChange: options.onChange, slash: null };

    // Slash menu wiring (shared instance for all rows).
    var slash = buildSlashMenu(ctx);
    ctx.slash = slash;

    // Open slash menu when "/" typed at block start.
    root.addEventListener("input", function () {
      var active = document.activeElement;
      if (!active || !root.contains(active)) return;
      var text = active.textContent || "";
      var m = /^\/\s*([^\s]*)$/.exec(text);
      if (m && active.getAttribute("contenteditable") === "true") {
        var anchor = active;
        slash.show(anchor, m[1], function (item) {
          var row = active.closest(".be-row");
          slash.hide();
          var block = defaultBlock(item.type, item);
          var newRow = buildRow(block, ctx);
          row.replaceWith(newRow);
          emit(ctx);
          focusNewBlock(newRow);
        });
      } else {
        slash.hide();
      }
    });

    function focusNewBlock(newRow) {
      var type = newRow.getAttribute("data-type");
      if (type === "list") {
        var first = newRow.querySelector(".be-list-item");
        if (first) placeCaretEnd(first);
      } else if (type === "table") {
        var cell = newRow.querySelector(".be-cell");
        if (cell) placeCaret(cell);
      } else if (type === "image") {
        var inp = newRow.querySelector(".be-img-url");
        if (inp) inp.focus();
      } else {
        var ce = newRow.querySelector(".be-content");
        if (ce) placeCaretEnd(ce);
      }
    }

    // Initial render.
    var blocks = options.blocks && options.blocks.length ? options.blocks : [defaultBlock("paragraph")];
    blocks.forEach(function (b) {
      root.appendChild(buildRow(b, ctx));
    });

    var api = {
      getBlocks: function () { return serialize(root); },
      focus: function (index) {
        var rows = root.querySelectorAll(".be-row");
        var row = rows[index || 0];
        if (!row) return;
        var ce = row.querySelector(".be-content") || row.querySelector(".be-list-item") || row.querySelector(".be-cell");
        if (ce) placeCaretEnd(ce);
      },
      clear: function () {
        root.innerHTML = "";
        root.appendChild(buildRow(defaultBlock("paragraph"), ctx));
        emit(ctx);
      }
    };
    root._be = api;
    return api;
  };

  // CSS is expected to be provided by editor.css.
  window.BlogEditor = BlogEditor;
})();
