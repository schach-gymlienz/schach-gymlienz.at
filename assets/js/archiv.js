/* ==========================================================================
   Turnierarchiv – Übersicht (archiv.html) und Einzelbericht (bericht.html)
   Daten: data/archiv.json  ·  neue Berichte: siehe ANLEITUNG.md
   ========================================================================== */
(function () {
  "use strict";
  var DATA_URL = "data/archiv.json";
  var KATS = ["Schulturniere", "Weihnachtsturnier", "Osttirol", "Alpen-Adria", "Landesfinale", "Bundesfinale"];

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function nl(s) { return esc(s).replace(/\n/g, "<br>"); }
  function linkList(l) {
    if (!l || !l.length) return "";
    return '<ul class="ext-links">' + l.map(function (x) { return '<li><a href="' + esc(x[1]) + '" rel="noopener">' + esc(x[0] || x[1]) + "</a></li>"; }).join("") + "</ul>";
  }
  function fig(i, cap) {
    return '<figure><a href="' + esc(i.src) + '" target="_blank" rel="noopener"><img src="' + esc(i.src) + '" alt="' + esc(i.alt || cap || "") + '" loading="lazy"></a>' +
      ((cap || i.alt) ? "<figcaption>" + nl(cap || i.alt) + "</figcaption>" : "") + "</figure>";
  }

  function renderListe(el, data) {
    var jahre = [], seen = {};
    data.berichte.forEach(function (b) { if (!seen[b.jahr]) { seen[b.jahr] = 1; jahre.push(b.jahr); } });
    var state = { jahr: "", kat: "", q: "" };
    var ctl = document.querySelector("[data-archiv-filter]");
    ctl.innerHTML =
      '<label class="field"><span>Suchen</span><input type="search" placeholder="z. B. Weihnachtsturnier, Landesfinale, Name …" data-q></label>' +
      '<label class="field"><span>Schuljahr</span><select data-jahr><option value="">Alle Schuljahre</option>' + jahre.map(function (j) { return "<option>" + j + "</option>"; }).join("") + "</select></label>" +
      '<div class="tabs" data-kat role="group" aria-label="Kategorie"><button type="button" aria-pressed="true" data-k="">Alle</button>' +
      KATS.map(function (k) { return '<button type="button" aria-pressed="false" data-k="' + k + '">' + k + "</button>"; }).join("") + "</div>";

    function text(b) {
      return (b.titel + " " + b.auszug + " " + b.bloecke.map(function (x) {
        return [].concat(x.x || []).join(" ") + " " + (x.c || "") + " " + (x.i || []).map(function (i) { return i.alt; }).join(" ");
      }).join(" ")).toLowerCase();
    }
    data.berichte.forEach(function (b) { b._t = text(b); });

    function draw() {
      var q = state.q.toLowerCase().trim();
      var list = data.berichte.filter(function (b) {
        return (!state.jahr || b.jahr === state.jahr) && (!state.kat || b.kategorie === state.kat) && (!q || b._t.indexOf(q) >= 0);
      });
      var html = "", cur = null;
      list.forEach(function (b) {
        if (b.jahr !== cur) { if (cur) html += "</div>"; cur = b.jahr; html += '<h2 class="year-head">Schuljahr ' + b.jahr + '</h2><div class="archive-grid">'; }
        html += '<a class="report-card" href="bericht.html?b=' + encodeURIComponent(b.id) + '">' +
          (b.vorschau ? '<img src="' + esc(b.vorschau) + '" alt="" loading="lazy">' : '<div class="noimg" aria-hidden="true">♞</div>') +
          '<div class="rc-body"><span class="kicker">' + esc(b.kategorie) + "</span><h3>" + esc(b.titel) + '</h3><p class="muted small">' + esc(b.auszug) + "</p></div></a>";
      });
      if (cur) html += "</div>";
      el.innerHTML = list.length ? html : '<p class="notice">Keine Berichte gefunden.</p>';
      document.querySelector("[data-archiv-count]").textContent = list.length + (list.length === 1 ? " Bericht" : " Berichte");
    }
    ctl.querySelector("[data-q]").addEventListener("input", function (e) { state.q = e.target.value; draw(); });
    ctl.querySelector("[data-jahr]").addEventListener("change", function (e) { state.jahr = e.target.value; draw(); });
    Array.prototype.forEach.call(ctl.querySelectorAll("[data-k]"), function (btn) {
      btn.addEventListener("click", function () {
        state.kat = btn.getAttribute("data-k");
        Array.prototype.forEach.call(ctl.querySelectorAll("[data-k]"), function (b) { b.setAttribute("aria-pressed", b === btn ? "true" : "false"); });
        draw();
      });
    });
    var params = new URLSearchParams(location.search);
    if (params.get("kat")) { var kb = ctl.querySelector('[data-k="' + params.get("kat") + '"]'); if (kb) kb.click(); }
    draw();
  }

  function renderBericht(el, data) {
    var id = new URLSearchParams(location.search).get("b");
    var idx = -1;
    data.berichte.forEach(function (b, i) { if (b.id === id) idx = i; });
    if (idx < 0) { el.innerHTML = '<p class="notice">Dieser Bericht wurde nicht gefunden. <a href="archiv.html">Zum Archiv</a></p>'; return; }
    var b = data.berichte[idx];
    document.title = b.titel + " – Archiv · Schach am Gymnasium Lienz";
    var out = '<p class="small"><a href="archiv.html">← Zum Archiv</a></p><span class="kicker">' + esc(b.kategorie) + " · Schuljahr " + esc(b.jahr) + "</span><h1>" + esc(b.titel) + "</h1>";
    b.bloecke.forEach(function (x) {
      if (x.t === "h") out += "<h2>" + esc(x.x) + "</h2>";
      else if (x.t === "p") out += x.x.map(function (p) { return "<p>" + nl(p) + "</p>"; }).join("") + linkList(x.l);
      else if (x.t === "ti") out += '<div class="text-img">' + (x.i && x.i[0] ? fig(x.i[0]) : "") + x.x.map(function (p) { return "<p>" + nl(p) + "</p>"; }).join("") + "</div>" + linkList(x.l);
      else if (x.t === "img") out += x.i.map(function (i) { return fig(i, x.c); }).join("");
      else if (x.t === "gal") out += '<div class="gallery">' + x.i.map(function (i) { return fig(i); }).join("") + "</div>";
      else if (x.t === "doc") out += '<p><a class="btn btn-soft" href="' + esc(x.href) + '">PDF: ' + esc(x.x) + "</a></p>";
    });
    var prev = data.berichte[idx + 1], next = data.berichte[idx - 1];
    out += '<nav class="report-nav" aria-label="Weitere Berichte">' +
      (next ? '<a href="bericht.html?b=' + encodeURIComponent(next.id) + '">← Neuer: ' + esc(next.titel) + "</a>" : "<span></span>") +
      (prev ? '<a href="bericht.html?b=' + encodeURIComponent(prev.id) + '">Älter: ' + esc(prev.titel) + " →</a>" : "") + "</nav>";
    el.innerHTML = out;
  }

  document.addEventListener("DOMContentLoaded", function () {
    var liste = document.querySelector('[data-archiv="liste"]'), bericht = document.querySelector('[data-archiv="bericht"]');
    if (!liste && !bericht) return;
    fetch(DATA_URL, { cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (data) { if (liste) renderListe(liste, data); if (bericht) renderBericht(bericht, data); })
      .catch(function () { (liste || bericht).innerHTML = '<p class="notice">Das Archiv konnte gerade nicht geladen werden. Bitte die Seite neu laden.</p>'; });
  });
})();
