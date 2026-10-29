/* Ehrentafel der Jahresmeister:innen – Daten: data/ehrentafel.json */
(function () {
  "use strict";
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  document.addEventListener("DOMContentLoaded", function () {
    var els = document.querySelectorAll("[data-ehrentafel]");
    if (!els.length) return;
    fetch("data/ehrentafel.json", { cache: "no-cache" }).then(function (r) { return r.json(); }).then(function (d) {
      var html = '<div class="honor">' + d.jahre.map(function (j) {
        var sieger = j.plaetze.filter(function (p) { return p.platz === 1; });
        var rest = j.plaetze.filter(function (p) { return p.platz > 1; });
        return '<div class="honor-year">' +
          '<div class="honor-head"><span class="honor-jahr">' + esc(j.jahr) + "</span>" +
          (j.vorlaeufig ? '<span class="honor-note" title="Endstand noch nicht bestätigt">vorläufig</span>' : "") + "</div>" +
          sieger.map(function (p) { return '<div class="honor-champ"><span class="rank rank-1">1</span><strong>' + esc(p.name) + '</strong><span class="muted small">' + p.punkte + " Pkt.</span></div>"; }).join("") +
          '<ol class="honor-rest">' + rest.map(function (p) { return '<li><span class="rank rank-' + p.platz + '">' + p.platz + "</span>" + esc(p.name) + ' <span class="muted small">' + p.punkte + "</span></li>"; }).join("") + "</ol>" +
          (j.bericht ? '<a class="small" href="bericht.html?b=' + encodeURIComponent(j.bericht) + '">Zum Bericht</a>' : "") +
          "</div>";
      }).join("") + "</div>";
      Array.prototype.forEach.call(els, function (el) { el.innerHTML = html; });
    }).catch(function () {});
  });
})();
