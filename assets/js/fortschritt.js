/* Gemeinsamer Fortschritt der Übungsseiten (schachmatt.html, endspiele.html, kombinationen.html).
   Alles bleibt im Browser (localStorage). „Fortschritt sichern“ lädt EINE Datei mit allen
   Bereichen herunter, „Fortschritt laden“ führt eine solche Datei mit dem Stand hier zusammen
   (das Bessere gewinnt, nichts geht verloren). Die Prüfsumme hält nur neugierige Änderungen ab.
   Bedienelemente auf der Seite: [data-fs-sichern], [data-fs-laden], [data-fs-datei], [data-fs-msg].
   Nach dem Laden meldet die Seite sich über das Ereignis „fortschritt-geladen“ (document). */
(function () {
  "use strict";
  var SPEICHER = "schach-gymlienz-fortschritt", APP = "schach-gymlienz.at/fortschritt";

  // je Bereich: säubern (nur bekannte Felder, nur Zahlen) und zusammenführen
  var BEREICHE = {
    endspiele: {   // { thema: { matt: Anzahl, best: wenigste Züge } }
      sauber: function (x) {
        var s = {}; Object.keys(x || {}).forEach(function (k) {
          var e = x[k] || {}; s[k] = { matt: Math.max(0, Math.floor(+e.matt) || 0), best: Math.max(0, Math.floor(+e.best) || 0) };
        }); return s;
      },
      zusammen: function (a, b) {
        Object.keys(b).forEach(function (k) {
          var x = a[k] || { matt: 0, best: 0 }, y = b[k];
          a[k] = { matt: Math.max(x.matt, y.matt), best: x.best && y.best ? Math.min(x.best, y.best) : (x.best || y.best) };
        }); return a;
      }
    },
    schachmatt: {  // { kategorie: [Nummern der gelösten Aufgaben 0–29] }
      sauber: function (x) {
        var s = {}; Object.keys(x || {}).forEach(function (k) {
          s[k] = (Array.isArray(x[k]) ? x[k] : []).map(Number).filter(function (n) { return n >= 0 && n < 100 && n % 1 === 0; });
        }); return s;
      },
      zusammen: function (a, b) {
        Object.keys(b).forEach(function (k) {
          var m = (a[k] || []).concat(b[k]); a[k] = m.filter(function (n, i) { return m.indexOf(n) === i; }).sort(function (p, q) { return p - q; });
        }); return a;
      }
    }
  };
  BEREICHE.kombinationen = BEREICHE.schachmatt;   // kombinationen.html: { kategorie: [Nummern der gelösten Aufgaben] }
  function sauber(x) { var s = {}; Object.keys(BEREICHE).forEach(function (b) { s[b] = BEREICHE[b].sauber(x && x[b]); }); return s; }

  var stand = sauber(null);
  try { stand = sauber(JSON.parse(localStorage.getItem(SPEICHER))); } catch (e) { /* privates Fenster o. Ä. */ }
  function speichern() { try { localStorage.setItem(SPEICHER, JSON.stringify(stand)); } catch (e) { /* egal */ } }
  function pruef(s) { var h = 2166136261, x = "Schach-Gym-Lienz|" + JSON.stringify(s); for (var i = 0; i < x.length; i++) { h ^= x.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h.toString(36); }

  function meldung(t, ok) { var m = document.querySelector("[data-fs-msg]"); if (!m) return; m.hidden = false; m.innerHTML = t; m.className = "notice " + (ok ? "ok" : "bad"); }
  function sichern() {
    var h = new Date(), d = h.getFullYear() + "-" + ("0" + (h.getMonth() + 1)).slice(-2) + "-" + ("0" + h.getDate()).slice(-2);
    var inhalt = { app: APP, version: 1, gesichert: d, fortschritt: stand, pruef: pruef(stand) };
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(inhalt, null, 1)], { type: "text/plain" }));
    a.download = "Schach-Fortschritt_" + d + ".txt";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    meldung("Gespeichert als <strong>" + a.download + "</strong>. Leg die Datei auf deinen USB-Stick, in deinen OneDrive oder schick sie dir per Mail.", true);
  }
  function laden(datei) {
    var r = new FileReader();
    r.onload = function () {
      var x; try { x = JSON.parse(r.result); } catch (e) { x = null; }
      if (!x || x.app !== APP || !x.fortschritt) { meldung("Das ist keine Fortschritts-Datei dieser Seite.", false); return; }
      var neu = sauber(x.fortschritt);
      // Prüfsumme nur über die Bereiche, die in der Datei stehen (ältere Dateien kennen neuere Bereiche nicht)
      var teil = {}; Object.keys(BEREICHE).forEach(function (b) { if (x.fortschritt[b] !== undefined) teil[b] = neu[b]; });
      if (pruef(teil) !== x.pruef) { meldung("Diese Datei wurde verändert oder ist beschädigt und kann nicht geladen werden.", false); return; }
      Object.keys(BEREICHE).forEach(function (b) { stand[b] = BEREICHE[b].zusammen(stand[b], neu[b]); });
      speichern();
      document.dispatchEvent(new Event("fortschritt-geladen"));
      meldung("Fortschritt vom " + (x.gesichert || "?").split("-").reverse().join(".") + " geladen. Alles, was du hier schon geschafft hattest, bleibt erhalten.", true);
    };
    r.readAsText(datei);
  }

  window.Fortschritt = {
    lesen: function (bereich) { return stand[bereich]; },          // dasselbe Objekt: Änderungen danach mit speichern() festhalten
    speichern: speichern
  };
  document.addEventListener("DOMContentLoaded", function () {
    var s = document.querySelector("[data-fs-sichern]"), l = document.querySelector("[data-fs-laden]"), f = document.querySelector("[data-fs-datei]");
    if (s) s.addEventListener("click", sichern);
    if (l && f) {
      l.addEventListener("click", function () { f.click(); });
      f.addEventListener("change", function () { if (f.files[0]) laden(f.files[0]); f.value = ""; });
    }
  });
})();
