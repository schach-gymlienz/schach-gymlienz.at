/* Teilnehmer:innen der Schachgruppen – Daten: data/teilnehmer.json */
(function () {
  "use strict";
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function slug(j) { return j.replace("/", "-"); }

  function gruppe(g) {
    var meta = [g.leitung, g.zeit].filter(Boolean).map(esc).join(" · ");
    var h = '<div class="card tn-group"><div class="tn-head"><h3>' + esc(g.titel) + "</h3>" +
      (g.namen ? '<span class="pill pill-soft">' + g.namen.length + "</span>" : "") + "</div>" +
      (meta ? '<p class="muted small">' + meta + "</p>" : "") +
      (g.text ? "<p>" + esc(g.text) + "</p>" : "");
    if (g.namen && g.namen.length) {
      h += '<ul class="tn-names">' + g.namen.map(function (n) {
        return "<li>" + esc(n.n) + (n.k ? ' <span class="muted small">' + esc(n.k) + "</span>" : "") + "</li>";
      }).join("") + "</ul>";
    } else if (g.hinweis) {
      h += '<p class="muted small"><em>' + esc(g.hinweis) + "</em></p>";
    }
    if (g.fotos && g.fotos.length) {
      h += '<div class="gallery tn-fotos">' + g.fotos.map(function (f) {
        return '<figure><a href="' + esc(f.src) + '" target="_blank" rel="noopener"><img src="' + esc(f.src) + '" alt="' + esc(f.alt || ("Schachgruppe " + g.titel)) + '" loading="lazy"></a>' +
          (f.alt ? "<figcaption>" + esc(f.alt) + "</figcaption>" : "") + "</figure>";
      }).join("") + "</div>";
    }
    return h + "</div>";
  }

  document.addEventListener("DOMContentLoaded", function () {
    var el = document.querySelector("[data-teilnehmer]");
    if (!el) return;
    fetch("data/teilnehmer.json", { cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (d) {
      var tabs = '<div class="tabs" role="group" aria-label="Schuljahr wählen">' + d.jahre.map(function (j) {
        return '<button type="button" data-j="' + slug(j.jahr) + '">' + esc(j.jahr) + "</button>";
      }).join("") + "</div>";
      el.innerHTML = tabs + '<div data-tn-body></div>';
      var body = el.querySelector("[data-tn-body]");
      function show(s) {
        var j = d.jahre.filter(function (x) { return slug(x.jahr) === s; })[0] || d.jahre[0];
        Array.prototype.forEach.call(el.querySelectorAll("[data-j]"), function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-j") === slug(j.jahr) ? "true" : "false"); });
        body.innerHTML = "<h2>Schuljahr " + esc(j.jahr) + "</h2>" + (j.text ? '<p class="muted">' + esc(j.text) + "</p>" : "") +
          '<div class="tn-groups">' + j.gruppen.map(gruppe).join("") + "</div>";
      }
      el.addEventListener("click", function (e) {
        var b = e.target.closest("[data-j]"); if (!b) return;
        history.replaceState(null, "", "#" + b.getAttribute("data-j")); show(b.getAttribute("data-j"));
      });
      window.addEventListener("hashchange", function () { show(location.hash.slice(1)); });
      show(location.hash.slice(1));
    }).catch(function () { el.innerHTML = '<p class="notice">Die Listen konnten gerade nicht geladen werden. Bitte die Seite neu laden.</p>'; });
  });
})();
