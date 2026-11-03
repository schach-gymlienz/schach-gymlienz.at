/* Kombinationen (kombinationen.html): Taktik für Fortgeschrittene, aufgebaut wie schachmatt.html.
   Daten: data/kombinationen.json – Kategorien zu je 30 Aufgaben (3 Stufen × 10).
   Eine Aufgabe ist eine Zugfolge "zuege" (UCI, abwechselnd: eigener Zug, Antwort, eigener Zug …).
   Die Spieler:in zieht die eigenen Züge, die Antworten des Gegners spielt die Seite selbst.
   Alle Stellungen stammen aus Turnierpartien (Mega Database) und wurden mit einer Engine geprüft:
   der jeweils geforderte Zug ist klar der beste.
   Freispielen wie bei Schachmatt: Kategorie 1 offen, nächste Stufe/Kategorie nach 10 gelösten.
   Lehrkräfte: kombinationen.html?alle schaltet alles frei (nur für diesen Aufruf).
   benötigt jQuery, chess.js, chessboard.js (assets/rallye/lib/) und assets/js/fortschritt.js */
(function () {
  "use strict";
  var PIECES = "assets/rallye/pieces/{piece}.png";
  var STUFEN = ["Leicht", "Mittel", "Schwer"], JE_STUFE = 10;
  var ALLE_OFFEN = /[?&]alle\b/.test(location.search);
  var KATS = [];
  function $q(s, el) { return (el || document).querySelector(s); }
  function de(san) { return san.replace(/[KQRBN]/g, function (c) { return { K: "K", Q: "D", R: "T", B: "L", N: "S" }[c]; }); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  /* ---------- Fortschritt und Freispielen ---------- */
  function geloest(kat) { var s = Fortschritt.lesen("kombinationen"); if (!s[kat.id]) s[kat.id] = []; return s[kat.id]; }
  function anzahl(kat, st) { return geloest(kat).filter(function (n) { return Math.floor(n / JE_STUFE) === st; }).length; }
  function stufeFertig(kat, st) { return anzahl(kat, st) >= JE_STUFE; }
  function katOffen(i) { return ALLE_OFFEN || i === 0 || stufeFertig(KATS[i - 1], 0) || geloest(KATS[i]).length > 0; }
  function stufeOffen(i, st) { return katOffen(i) && (ALLE_OFFEN || st === 0 || stufeFertig(KATS[i], st - 1) || anzahl(KATS[i], st) > 0); }

  /* ---------- Auswahlkarten ---------- */
  function karten() {
    var sichtbar = 0;
    while (sichtbar < KATS.length && katOffen(sichtbar)) sichtbar++;
    var rest = KATS.length - sichtbar - 1;
    $q("[data-kb-karten]").innerHTML = KATS.slice(0, sichtbar + 1).map(function (k, i) {
      var n = geloest(k).length, offen = katOffen(i);
      var kopf = '<span class="kicker">Kategorie ' + (i + 1) + "</span><h3>" + esc(k.titel) + '</h3><p class="muted small">' + esc(k.unter) + "</p>";
      if (!offen) return '<div class="card sm-karte gesperrt">' + kopf +
        '<p class="es-stand">🔒 Wird frei, sobald du bei <strong>' + esc(KATS[i - 1].titel) + "</strong> die ersten 10 Aufgaben gelöst hast.</p></div>";
      return '<div class="card sm-karte">' + kopf +
        '<div class="sm-balken" aria-hidden="true"><span style="width:' + Math.round(100 * n / (STUFEN.length * JE_STUFE)) + '%"></span></div>' +
        '<p class="es-stand' + (n ? " geschafft" : "") + '">' + n + " von " + STUFEN.length * JE_STUFE + " gelöst</p>" +
        '<div class="sm-stufen">' + STUFEN.map(function (name, st) {
          var a = anzahl(k, st), frei = stufeOffen(i, st), fertig = a >= JE_STUFE;
          return '<button type="button" class="btn ' + (fertig ? "btn-soft sm-fertig" : frei ? "btn-gold" : "btn-soft") + '" data-stufe="' + i + "," + st + '"' + (frei ? "" : " disabled") + ">" +
            (frei ? "" : "🔒 ") + name + (fertig ? " ✓" : frei ? " · " + a + "/" + JE_STUFE : "") + "</button>";
        }).join("") + "</div>" + (k.stufen ? '<p class="muted small">' + k.stufen.map(esc).join(" · ") + "</p>" : "") + "</div>";
    }).join("") + (rest > 0 ? '<p class="muted small sm-mehr">… und noch ' + rest + " weitere Kategorien, die du nach und nach freispielst.</p>" : "");
  }

  /* ---------- Aufgabe ---------- */
  var K, KI, ST, nr, game, board, gesperrt, auswahl, letzter, schritt, fehl, timer, farbe, angesehen = {};
  function aufgabe() { return K.aufgaben[nr]; }
  function eigeneZuege(a) { return Math.ceil(a.zuege.length / 2); }
  function status(t, art) { var m = $q("[data-kb-msg]"); m.innerHTML = t; m.className = "notice" + (art ? " " + art : ""); }
  function markieren() {
    $("#kb-board .square-55d63").removeClass("es-wahl es-letzter");
    (letzter || []).forEach(function (q) { $("#kb-board .square-" + q).addClass("es-letzter"); });
    if (auswahl) $("#kb-board .square-" + auswahl).addClass("es-wahl");
  }
  function zeige() { board.position(game.fen(), false); setTimeout(markieren, 0); }
  function punkte() {
    var g = geloest(K);
    $q("[data-kb-punkte]").innerHTML = Array.apply(null, Array(JE_STUFE)).map(function (_, j) {
      var n = ST * JE_STUFE + j, cls = g.indexOf(n) >= 0 ? " ok" : angesehen[K.id + n] ? " gesehen" : "";
      return '<button type="button" class="sm-punkt' + cls + (n === nr ? " jetzt" : "") + '" data-nr="' + n + '" aria-label="Aufgabe ' + (j + 1) + '">' + (j + 1) + "</button>";
    }).join("");
  }
  function zielText(a) {
    var n = eigeneZuege(a);
    return (farbe === "w" ? "Weiß" : "Schwarz") + " am Zug · " + n + " Züge";
  }
  function laden(n) {
    clearTimeout(timer);
    nr = n; var a = aufgabe(); game = new Chess(a.fen); farbe = game.turn();
    gesperrt = false; auswahl = null; letzter = null; schritt = 0; fehl = 0;
    board.orientation(farbe === "w" ? "white" : "black");
    $q("[data-kb-ziel]").textContent = zielText(a);
    $q("[data-kb-nummer]").textContent = "Aufgabe " + (nr % JE_STUFE + 1) + " von " + JE_STUFE;
    $q("[data-kb-quelle]").textContent = a.partie ? "Aus der Partie " + a.partie + (a.jahr ? " (" + a.jahr + ")" : "") + "." : "";
    $q("[data-kb-loesung]").hidden = true; $q("[data-kb-weiter]").hidden = true;
    status(geloest(K).indexOf(nr) >= 0 ? "Schon gelöst – zur Übung: Wie gewinnt " + (farbe === "w" ? "Weiß" : "Schwarz") + "?" :
      "Finde den vorbereitenden Zug – danach schlägt die Taktik zu. Insgesamt " + eigeneZuege(a) + " eigene Züge.");
    zeige(); punkte();
  }
  function naechste() {
    var g = geloest(K), start = ST * JE_STUFE;
    for (var j = 1; j <= JE_STUFE; j++) { var n = start + (nr - start + j) % JE_STUFE; if (g.indexOf(n) < 0) return laden(n); }
    laden(start + (nr - start + 1) % JE_STUFE);
  }
  function uci(mv) { return mv.from + mv.to + (mv.promotion || ""); }
  function ziehe(u) { return game.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u.charAt(4) || "q" }); }

  function geschafft(mv) {
    var a = aufgabe(), g = geloest(K), neu = g.indexOf(nr) < 0, vorher = stufeFertig(K, ST), naechsteKatVorher = KI + 1 < KATS.length && katOffen(KI + 1);
    if (neu && !angesehen[K.id + nr]) { g.push(nr); g.sort(function (x, y) { return x - y; }); Fortschritt.speichern(); }
    var t = "<strong>" + (fehl ? "Jetzt hast du es!" : "Richtig!") + "</strong> " + de(mv.san) + (a.taktik ? " – die <strong>" + esc(a.taktik) + "</strong> entscheidet." : "");
    if (a.erklaerung) t += "<br>" + esc(a.erklaerung);
    if (angesehen[K.id + nr]) t += "<br>Du hattest die Lösung schon gesehen – diese Aufgabe zählt erst, wenn du sie später nochmal schaffst.";
    if (!vorher && stufeFertig(K, ST)) {
      t += "<br>🎉 <strong>Stufe „" + STUFEN[ST] + "“ geschafft!</strong>";
      if (ST + 1 < STUFEN.length) t += " Jetzt ist „" + STUFEN[ST + 1] + "“ frei.";
      if (ST === 0 && KI + 1 < KATS.length && !naechsteKatVorher) t += " Neue Kategorie frei: <strong>" + esc(KATS[KI + 1].titel) + "</strong>";
    }
    status(t, "ok"); punkte(); karten();
    $q("[data-kb-loesung]").hidden = true; $q("[data-kb-weiter]").hidden = false;
  }

  function zug(von, nach) {
    var mv = game.move({ from: von, to: nach, promotion: "q" });
    if (!mv) return false;
    auswahl = null; letzter = [von, nach]; zeige();
    var soll = aufgabe().zuege[schritt];
    if (uci(mv).slice(0, 4) === soll.slice(0, 4)) {
      schritt++;
      if (schritt >= aufgabe().zuege.length) { gesperrt = true; geschafft(mv); return true; }
      gesperrt = true;
      status("<strong>Gut!</strong> " + de(mv.san) + " – und wie antwortet der Gegner?", "info");
      timer = setTimeout(function () {
        var r = ziehe(aufgabe().zuege[schritt]); schritt++;
        letzter = [r.from, r.to]; zeige(); gesperrt = false;
        status("Der Gegner spielt <strong>" + de(r.san) + "</strong>. Jetzt bist du wieder dran!");
      }, 700);
      return true;
    }
    fehl++; gesperrt = true;
    if (fehl >= 2) $q("[data-kb-loesung]").hidden = false;
    status("<strong>" + de(mv.san) + " ist nicht der stärkste Zug.</strong> " +
      (schritt === 0 ? "Tipp: Erst vorbereiten! Welcher Zug lockt eine Figur auf ein schlechtes Feld oder lenkt einen Verteidiger ab?" : "Schau genau: Jetzt ist die Taktik möglich!") + " Versuch es nochmal.", "bad");
    timer = setTimeout(function () { game.undo(); letzter = null; zeige(); gesperrt = false; }, 1400);
    return true;
  }
  function loesung() {
    clearTimeout(timer);
    var a = aufgabe(), g = new Chess(a.fen), sans = [];
    a.zuege.forEach(function (u) { var m = g.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u.charAt(4) || "q" }); sans.push(de(m.san)); });
    angesehen[K.id + nr] = true; punkte(); gesperrt = true;
    // Lösung Zug für Zug vorspielen
    game = new Chess(a.fen); zeige(); var i = 0;
    (function weiter() {
      if (i >= a.zuege.length) return;
      var m = ziehe(a.zuege[i]); letzter = [m.from, m.to]; zeige(); i++;
      timer = setTimeout(weiter, 900);
    })();
    status("Die Lösung: <strong>" + sans.join(" ") + "</strong>" + (a.taktik ? " (" + esc(a.taktik) + ")" : "") + ". Diese Aufgabe zählt noch nicht – probier sie später nochmal!", "info");
    $q("[data-kb-loesung]").hidden = true; $q("[data-kb-weiter]").hidden = false;
  }

  function starten(ki, st) {
    if (!stufeOffen(ki, st)) return;
    KI = ki; K = KATS[ki]; ST = st;
    var sek = $q("#aufgabe"); sek.hidden = false;
    $q("[data-kb-titel]").textContent = K.titel + " · " + STUFEN[st];
    $q("[data-kb-tipp]").textContent = K.tipp;
    if (!board) {
      board = Chessboard("kb-board", {
        position: "8/8/8/8/8/8/8/8 w - - 0 1", draggable: true, pieceTheme: PIECES,
        onDragStart: function (src, p) { return !gesperrt && p.charAt(0) === farbe; },
        onDrop: function (von, nach) {
          if (von === nach) { auswahl = auswahl === von ? null : von; markieren(); return; }
          if (!zug(von, nach)) { auswahl = null; return "snapback"; }
        },
        onSnapEnd: function () { zeige(); }
      });
      $("#kb-board").on("click", ".square-55d63", function () {
        var q = this.getAttribute("data-square"), p = game && game.get(q);
        if (!auswahl || gesperrt || (p && p.color === farbe)) return;
        if (!zug(auswahl, q)) { auswahl = null; markieren(); }
      });
      window.addEventListener("resize", function () { board.resize(); markieren(); });
    }
    var g = geloest(K), start = st * JE_STUFE, erste = start;
    for (var j = 0; j < JE_STUFE; j++) if (g.indexOf(start + j) < 0) { erste = start + j; break; }
    laden(erste);
    sek.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(function () { board.resize(); markieren(); }, 50);
  }

  document.addEventListener("DOMContentLoaded", function () {
    fetch("data/kombinationen.json", { cache: "no-cache" }).then(function (r) { return r.json(); }).then(function (d) {
      KATS = d.kategorien; karten();
    }).catch(function () { $q("[data-kb-karten]").innerHTML = '<p class="notice bad">Die Aufgaben konnten nicht geladen werden.</p>'; });
    document.addEventListener("click", function (e) {
      var b = e.target.closest("[data-stufe],[data-nr],[data-kb-loesung],[data-kb-weiter]");
      if (!b) return;
      if (b.hasAttribute("data-stufe")) { var x = b.getAttribute("data-stufe").split(","); starten(+x[0], +x[1]); }
      else if (b.hasAttribute("data-nr")) laden(+b.getAttribute("data-nr"));
      else if (b.hasAttribute("data-kb-loesung")) loesung();
      else if (b.hasAttribute("data-kb-weiter")) naechste();
    });
    document.addEventListener("fortschritt-geladen", function () { if (KATS.length) { karten(); if (K) punkte(); } });
  });
})();
