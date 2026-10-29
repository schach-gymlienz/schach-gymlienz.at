/* ==========================================================================
   Jahresmeisterschaft – berechnet Gesamt-, Klassenwertung und Kreuztabellen
   direkt aus data/jahresmeisterschaft-2026-27.json.

   Neuer Termin = nur die JSON-Datei aktualisieren (import_termin.py),
   an diesem Skript muss dafür nichts geändert werden.

   Regeln (wie in der Ausschreibung):
   - Wertungspunkte je Termin nach Platz: 10, 9, 8, 7×2, 6×3, 5×4, 4×5, 3×6,
     2×7, 1×8 …; nicht anwesend = 0.
   - Jahresreihung: 1. Wertungspunkte, 2. Partiepunkte, 3. Buchholz-Summe
     (nur intern, wird nicht angezeigt), 4. direkte Begegnung.
   - Spieler:innen, die noch nie gespielt haben, werden nicht angezeigt.
   ========================================================================== */
(function () {
  "use strict";

  var DATA_URL = "data/jahresmeisterschaft-2026-27.json";

  var KLASSEN = [
    ["VS", "Volksschule"], ["Kl1", "1. Klasse"], ["Kl2", "2. Klasse"], ["Kl3", "3. Klasse"],
    ["Kl4", "4. Klasse"], ["Kl5", "5. Klasse"], ["Kl6", "6. Klasse"], ["Kl7", "7. Klasse"], ["Kl8", "8. Klasse"]
  ];

  /* Wertungspunkte für Platz p (1-basiert) */
  function wertungspunkte(p) {
    if (!p) return 0;
    var table = [10, 9, 8];
    for (var pts = 7, n = 2; pts >= 1; pts--, n++) for (var i = 0; i < n; i++) table.push(pts);
    return p <= table.length ? table[p - 1] : 1;
  }

  function num(s) { return parseFloat(String(s || "0").replace("½", ".5").replace(",", ".")) || 0; }
  function fmt(x) {
    var whole = Math.floor(x), half = Math.abs(x - whole - 0.5) < 1e-9;
    if (half) return (whole === 0 ? "" : whole) + "½";
    return String(Math.round(x));
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function klasseKurz(k) { return k === "VS" ? "VS" : (k ? k.replace("Kl", "") + "." : "–"); }
  function datumKurz(d) { var p = d.split("."); return p[0] + "." + p[1] + "."; }

  function berechne(data) {
    var spieler = data.spieler, termine = data.termine;
    var rows = {};
    termine.forEach(function (t, ti) {
      Object.keys(t.ergebnisse).forEach(function (name) {
        var e = t.ergebnisse[name];
        if (!e.rang) return;
        var r = rows[name] || (rows[name] = {
          name: name, kat: (spieler[name] || {}).kat || null, elo: (spieler[name] || {}).elo || null,
          wp: new Array(termine.length).fill(null), total: 0, pp: 0, bh: 0, gegen: {}
        });
        var w = wertungspunkte(e.rang);
        r.wp[ti] = w; r.total += w;
        r.pp += e.runden.reduce(function (s, g) { return s + g.punkte; }, 0);
        r.bh += num(e.bh_swiss);
        e.runden.forEach(function (g) { r.gegen[g.gegner] = (r.gegen[g.gegner] || 0) + g.punkte; });
      });
    });
    var list = Object.keys(rows).map(function (k) { return rows[k]; });

    function grundvergleich(a, b) { return b.total - a.total || b.pp - a.pp || b.bh - a.bh; }
    list.sort(grundvergleich);
    // direkte Begegnung innerhalb gleichstehender Gruppen
    var i = 0;
    while (i < list.length) {
      var j = i;
      while (j + 1 < list.length && grundvergleich(list[i], list[j + 1]) === 0) j++;
      if (j > i) {
        var gruppe = list.slice(i, j + 1);
        gruppe.forEach(function (p) {
          p.de = gruppe.reduce(function (s, q) { return s + (q === p ? 0 : (p.gegen[q.name] || 0)); }, 0);
        });
        gruppe.sort(function (a, b) { return b.de - a.de || a.name.localeCompare(b.name, "de"); });
        Array.prototype.splice.apply(list, [i, gruppe.length].concat(gruppe));
      } else { list[i].de = 0; }
      i = j + 1;
    }
    list.forEach(function (r, idx) {
      var prev = list[idx - 1];
      r.rang = prev && grundvergleich(prev, r) === 0 && prev.de === r.de ? prev.rang : idx + 1;
    });
    return list;
  }

  function rankBadge(r) { return '<span class="rank' + (r <= 3 ? " rank-" + r : "") + '">' + r + "</span>"; }

  function standText(data) {
    var n = data.termine.length, last = data.termine[n - 1];
    return "Zwischenstand nach " + n + (n === 1 ? " Termin" : " Terminen") + " · Stand " + last.datum;
  }

  function renderGesamt(el, data, list, limit) {
    var termine = data.termine, rows = limit ? list.slice(0, limit) : list;
    var head = "<tr><th>Rg.</th><th>Name</th><th>Kl.</th><th class=\"num\">Elo</th>" +
      (limit ? "" : termine.map(function (t, i) { return '<th class="num">T' + (i + 1) + " · " + datumKurz(t.datum) + "</th>"; }).join("")) +
      '<th class="num">Gesamt</th></tr>';
    var body = rows.map(function (r) {
      return "<tr><td>" + rankBadge(r.rang) + '</td><td class="name">' + esc(r.name) + '</td><td class="muted">' + klasseKurz(r.kat) +
        '</td><td class="num muted">' + (r.elo || "–") + "</td>" +
        (limit ? "" : r.wp.map(function (w) { return '<td class="num">' + (w === null ? "–" : w) + "</td>"; }).join("")) +
        '<td class="total">' + r.total + "</td></tr>";
    }).join("");
    el.innerHTML = '<div class="table-box"><table class="ranking"><thead>' + head + "</thead><tbody>" + body + "</tbody></table></div>";
  }

  function renderKlassen(el, list) {
    el.innerHTML = KLASSEN.map(function (k) {
      var ps = list.filter(function (r) { return r.kat === k[0]; });
      if (!ps.length) return "";
      return '<div class="class-card"><h3>' + k[1] + "</h3><ol>" + ps.map(function (r, i) {
        return "<li><span>" + (i + 1) + '.</span><span class="n">' + esc(r.name) + '</span><span class="p">' + r.total + "</span></li>";
      }).join("") + "</ol></div>";
    }).join("");
  }

  function renderKreuz(el, tabsEl, data) {
    var termine = data.termine;
    function show(ti) {
      var t = termine[ti], erg = t.ergebnisse;
      var namen = Object.keys(erg).filter(function (n) { return erg[n].rang; })
        .sort(function (a, b) { return erg[a].rang - erg[b].rang; });
      var runden = namen.reduce(function (m, n) { return Math.max(m, erg[n].runden.length); }, 0);
      var head = "<tr><th>Rg.</th><th>Name</th>";
      for (var r = 1; r <= runden; r++) head += '<th style="text-align:center">R' + r + "</th>";
      head += '<th class="num">Pkt.</th><th class="num">Wertung</th></tr>';
      var body = namen.map(function (n) {
        var e = erg[n];
        var cells = e.runden.map(function (g) {
          var cls = g.punkte === 1 ? "res-1" : g.punkte === 0 ? "res-0" : "res-h";
          var res = g.punkte === 1 ? "1" : g.punkte === 0 ? "0" : "½";
          var gr = erg[g.gegner] && erg[g.gegner].rang ? erg[g.gegner].rang : "?";
          return '<td><div class="c ' + cls + '" title="gegen ' + esc(g.gegner) + '">' + gr + g.farbe + " <strong>" + res + "</strong></div></td>";
        }).join("");
        var pp = e.runden.reduce(function (s, g) { return s + g.punkte; }, 0);
        return '<tr><td class="muted"><strong>' + e.rang + '.</strong></td><td class="name">' + esc(n) + "</td>" + cells +
          '<td class="num"><strong>' + fmt(pp) + '</strong></td><td class="num"><strong>' + wertungspunkte(e.rang) + "</strong></td></tr>";
      }).join("");
      el.innerHTML = '<p class="muted small" style="margin-bottom:10px">Termin ' + (ti + 1) + " · " + esc(t.datum) + " · " + namen.length + " Teilnehmer:innen</p>" +
        '<div class="table-box"><table class="cross"><thead>' + head + "</thead><tbody>" + body + "</tbody></table></div>";
      Array.prototype.forEach.call(tabsEl.querySelectorAll("button"), function (b, i) { b.setAttribute("aria-pressed", i === ti ? "true" : "false"); });
    }
    tabsEl.innerHTML = termine.map(function (t, i) { return '<button type="button" aria-pressed="false">Termin ' + (i + 1) + " · " + datumKurz(t.datum) + "</button>"; }).join("");
    Array.prototype.forEach.call(tabsEl.querySelectorAll("button"), function (b, i) { b.addEventListener("click", function () { show(i); }); });
    show(termine.length - 1);
  }

  function fehler(msg) {
    document.querySelectorAll("[data-jm]").forEach(function (el) {
      el.innerHTML = '<p class="notice">' + msg + "</p>";
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!document.querySelector("[data-jm]")) return;
    fetch(DATA_URL, { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (data) {
        var list = berechne(data);
        document.querySelectorAll("[data-jm-stand]").forEach(function (el) { el.textContent = standText(data); });
        document.querySelectorAll("[data-jm-anzahl]").forEach(function (el) { el.textContent = list.length; });
        var top = document.querySelector('[data-jm="top"]');
        if (top) renderGesamt(top, data, list, parseInt(top.getAttribute("data-limit") || "10", 10));
        var ges = document.querySelector('[data-jm="gesamt"]');
        if (ges) renderGesamt(ges, data, list, 0);
        var kl = document.querySelector('[data-jm="klassen"]');
        if (kl) renderKlassen(kl, list);
        var kr = document.querySelector('[data-jm="kreuz"]');
        if (kr) renderKreuz(kr, document.querySelector("[data-jm-tabs]"), data);
      })
      .catch(function () { fehler("Die Ergebnisse konnten gerade nicht geladen werden. Bitte die Seite neu laden."); });
  });

  // für Tests
  window.JM = { wertungspunkte: wertungspunkte, berechne: berechne };
})();
