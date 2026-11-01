/* Termine des Schuljahres – Daten: data/termine.json
   [data-termine="liste"]    ganze Liste mit Kalender-Download (termine.html)
   [data-termine="naechste"] die nächsten Termine (Startseite), data-limit = Anzahl */
(function () {
  "use strict";
  var MON = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
  var EBENE = { schule: "Schule", osttirol: "Osttirol", land: "Tirol", bund: "Österreich" };
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function d(s) { var p = s.split("-"); return new Date(+p[0], p[1] - 1, +p[2]); }
  function heute() { var n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); }
  function vorbei(t) { return t.datum && d(t.bis || t.datum) < heute(); }
  function lang(t) {
    var a = d(t.datum), s = a.getDate() + ". " + MON[a.getMonth()] + " " + a.getFullYear();
    if (t.bis) { var b = d(t.bis); s = a.getDate() + "." + (a.getMonth() === b.getMonth() ? "" : " " + MON[a.getMonth()]) + " – " + b.getDate() + ". " + MON[b.getMonth()] + " " + b.getFullYear(); }
    return s;
  }
  function tag(t) {
    if (!t.datum) return '<div class="day gold"><small>folgt</small>…</div>';
    var a = d(t.datum);
    return '<div class="day' + (t.ebene === "bund" || t.ebene === "land" ? " red" : "") + '"><small>' + MON[a.getMonth()] + "</small>" + a.getDate() + "</div>";
  }
  function zeile(t, kurz) {
    var meta = [];
    if (t.datum) meta.push(lang(t) + (t.zeit ? ", " + esc(t.zeit) + " Uhr" : "")); else if (t.wann) meta.push(esc(t.wann));
    if (t.ort && !kurz) meta.push(esc(t.ort));
    if (vorbei(t)) meta.push("gespielt");
    var link = t.link ? ' · <a href="' + esc(t.link) + '">' + esc(t.linktext || "Mehr") + "</a>" : "";
    return "<li" + (vorbei(t) ? ' class="past"' : "") + ">" + tag(t) + "<div><strong>" + esc(t.titel) + "</strong>" +
      (!kurz && t.ebene ? ' <span class="pill pill-soft small">' + EBENE[t.ebene] + "</span>" : "") +
      '<div class="muted small">' + meta.join(" · ") + link + "</div>" +
      (t.info && !kurz ? '<div class="muted small">' + esc(t.info) + "</div>" : "") + "</div></li>";
  }
  function sortiert(list) {
    return list.slice().sort(function (a, b) {
      if (!a.datum && !b.datum) return 0; if (!a.datum) return 1; if (!b.datum) return -1;
      return d(a.datum) - d(b.datum);
    });
  }
  function ics(list) {
    function f(s) { return s.replace(/-/g, ""); }
    function plus1(s) { var x = d(s); x.setDate(x.getDate() + 1); return x.getFullYear() + String(x.getMonth() + 1).padStart(2, "0") + String(x.getDate()).padStart(2, "0"); }
    function e(s) { return String(s).replace(/([,;\\])/g, "\\$1"); }
    var out = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Schachteam Gymnasium Lienz//Termine//DE", "X-WR-CALNAME:Schach am Gym Lienz"];
    list.filter(function (t) { return t.datum; }).forEach(function (t, i) {
      out.push("BEGIN:VEVENT", "UID:" + f(t.datum) + "-" + i + "@schach-gymlienz.at", "DTSTAMP:20260101T000000Z",
        "DTSTART;VALUE=DATE:" + f(t.datum), "DTEND;VALUE=DATE:" + plus1(t.bis || t.datum), "SUMMARY:" + e(t.titel));
      if (t.ort) out.push("LOCATION:" + e(t.ort));
      var info = [t.zeit ? t.zeit + " Uhr" : "", t.info || ""].filter(Boolean).join(" · ");
      if (info) out.push("DESCRIPTION:" + e(info));
      out.push("END:VEVENT");
    });
    out.push("END:VCALENDAR");
    return out.map(function (l) { var r = []; while (l.length > 70) { r.push(l.slice(0, 70)); l = " " + l.slice(70); } r.push(l); return r.join("\r\n"); }).join("\r\n");
  }
  document.addEventListener("DOMContentLoaded", function () {
    var els = document.querySelectorAll("[data-termine]");
    if (!els.length) return;
    fetch("data/termine.json", { cache: "no-cache" }).then(function (r) { return r.json(); }).then(function (data) {
      var alle = sortiert(data.termine);
      Array.prototype.forEach.call(els, function (el) {
        if (el.getAttribute("data-termine") === "naechste") {
          var n = +(el.getAttribute("data-limit") || 3);
          var kommend = alle.filter(function (t) { return t.datum && !vorbei(t); });
          var letzte = alle.filter(vorbei).slice(-1);
          var zeig = letzte.concat(kommend).slice(0, n);
          el.innerHTML = '<ul class="dates">' +
            '<li><div class="day"><small>jeden</small>Di</div><div><strong>Schachtraining</strong><div class="muted small">13:45–15:25 Uhr' + (data.training ? "<br>dazwischen Taktiktraining" : "") + '</div></div></li>' +
            zeig.map(function (t) { return zeile(t, true); }).join("") + "</ul>";
        } else {
          var kommend2 = alle.filter(function (t) { return !vorbei(t); }), vorbei2 = alle.filter(vorbei);
          el.innerHTML = (data.training ? '<p class="notice" style="margin-bottom:16px"><strong>Jeden Dienstag 13:45–15:25 Uhr Training.</strong> ' + esc(data.training) + "</p>" : "") + '<div class="btn-row" style="margin-bottom:18px"><button type="button" class="btn btn-navy" data-ics>Alle Termine in den Kalender (.ics)</button></div>' +
            "<h2>Demnächst</h2>" + '<ul class="dates dates-big">' + kommend2.map(function (t) { return zeile(t); }).join("") + "</ul>" +
            (vorbei2.length ? '<h2 style="margin-top:28px">Bereits gespielt</h2><ul class="dates dates-big">' + vorbei2.reverse().map(function (t) { return zeile(t); }).join("") + "</ul>" : "");
          el.querySelector("[data-ics]").addEventListener("click", function () {
            var blob = new Blob([ics(alle)], { type: "text/calendar;charset=utf-8" });
            var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "schach-gym-lienz-" + data.schuljahr.replace("/", "-") + ".ics";
            document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
          });
        }
      });
    }).catch(function () {});
  });
})();
