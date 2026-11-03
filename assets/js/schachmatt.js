/* Schachmatt (schachmatt.html): Matt in 1 für Anfänger:innen, 11 Kategorien zu je 30 Aufgaben
   aus data/schachmatt.json (aus dem Endspieltrainer übernommen, jede Lösung eindeutig).
   Je Kategorie 3 Stufen zu 10 Aufgaben (leicht → schwer). Freispielen: Kategorie 1 ist offen,
   die nächste wird frei, sobald in der vorigen die ersten 10 gelöst sind; innerhalb einer
   Kategorie wird die nächste Stufe frei, wenn die vorige ganz gelöst ist.
   Lehrkräfte: schachmatt.html?alle schaltet alles frei (nur für diesen Aufruf).
   Gelöste Aufgaben merkt sich assets/js/fortschritt.js (Bereich „schachmatt“).
   benötigt jQuery, chess.js und chessboard.js aus assets/rallye/lib/ und assets/js/fortschritt.js */
(function () {
  "use strict";
  var PIECES = "assets/rallye/pieces/{piece}.png";
  var STUFEN = ["Leicht", "Mittel", "Schwer"], JE_STUFE = 10;
  var NAME = { q: "die Dame", r: "der Turm", b: "der Läufer", n: "der Springer", p: "der Bauer", k: "der König" };
  var ALLE_OFFEN = /[?&]alle\b/.test(location.search);
  var KATS = [];
  function $q(s, el) { return (el || document).querySelector(s); }
  function de(san) { return san.replace(/[KQRBN]/g, function (c) { return { K: "K", Q: "D", R: "T", B: "L", N: "S" }[c]; }); }

  /* ---------- Fortschritt und Freispielen ---------- */
  function geloest(kat) { var s = Fortschritt.lesen("schachmatt"); if (!s[kat.id]) s[kat.id] = []; return s[kat.id]; }
  function anzahl(kat, st) { return geloest(kat).filter(function (n) { return Math.floor(n / JE_STUFE) === st; }).length; }
  function stufeFertig(kat, st) { return anzahl(kat, st) >= JE_STUFE; }
  function katOffen(i) { return ALLE_OFFEN || i === 0 || stufeFertig(KATS[i - 1], 0) || geloest(KATS[i]).length > 0; }
  function stufeOffen(i, st) { return katOffen(i) && (ALLE_OFFEN || st === 0 || stufeFertig(KATS[i], st - 1) || anzahl(KATS[i], st) > 0); }

  /* ---------- Auswahlkarten ---------- */
  function karten() {
    var sichtbar = 0;   // alle offenen Kategorien und genau eine gesperrte dazu
    while (sichtbar < KATS.length && katOffen(sichtbar)) sichtbar++;
    var rest = KATS.length - sichtbar - 1;
    $q("[data-sm-karten]").innerHTML = KATS.slice(0, sichtbar + 1).map(function (k, i) {
      var n = geloest(k).length, offen = katOffen(i);
      var kopf = '<span class="kicker">Kategorie ' + (i + 1) + "</span><h3>" + k.titel + '</h3><p class="muted small">' + k.unter + "</p>";
      if (!offen) return '<div class="card sm-karte gesperrt">' + kopf +
        '<p class="es-stand">🔒 Wird frei, sobald du bei <strong>' + KATS[i - 1].titel + "</strong> die ersten 10 Aufgaben gelöst hast.</p></div>";
      return '<div class="card sm-karte">' + kopf +
        '<div class="sm-balken" aria-hidden="true"><span style="width:' + Math.round(100 * n / (STUFEN.length * JE_STUFE)) + '%"></span></div>' +
        '<p class="es-stand' + (n ? " geschafft" : "") + '">' + n + " von " + STUFEN.length * JE_STUFE + " gelöst</p>" +
        '<div class="sm-stufen">' + STUFEN.map(function (name, st) {
          var a = anzahl(k, st), frei = stufeOffen(i, st), fertig = a >= JE_STUFE;
          return '<button type="button" class="btn ' + (fertig ? "btn-soft sm-fertig" : frei ? "btn-gold" : "btn-soft") + '" data-stufe="' + i + "," + st + '"' + (frei ? "" : " disabled") + ">" +
            (frei ? "" : "🔒 ") + name + (fertig ? " ✓" : frei ? " · " + a + "/" + JE_STUFE : "") + "</button>";
        }).join("") + "</div></div>";
    }).join("") + (rest > 0 ? '<p class="muted small sm-mehr">… und noch ' + rest + " weitere Kategorien, die du nach und nach freispielst.</p>" : "");
  }

  /* ---------- Aufgabe ---------- */
  var K, KI, ST, nr, game, board, aus, auswahl, letzter, flucht, fehl, timer, angesehen = {};
  function aufgabe() { return K.aufgaben[nr]; }
  function status(t, art) { var m = $q("[data-sm-msg]"); m.innerHTML = t; m.className = "notice" + (art ? " " + art : ""); }
  function markieren() {
    $("#sm-board .square-55d63").removeClass("es-wahl es-letzter sm-flucht");
    (letzter || []).forEach(function (q) { $("#sm-board .square-" + q).addClass("es-letzter"); });
    (flucht || []).forEach(function (q) { $("#sm-board .square-" + q).addClass("sm-flucht"); });
    if (auswahl) $("#sm-board .square-" + auswahl).addClass("es-wahl");
  }
  function zeige() { board.position(game.fen(), false); setTimeout(markieren, 0); }
  function punkte() {   // die 10 Kästchen der Stufe
    var g = geloest(K);
    $q("[data-sm-punkte]").innerHTML = Array.apply(null, Array(JE_STUFE)).map(function (_, j) {
      var n = ST * JE_STUFE + j, cls = g.indexOf(n) >= 0 ? " ok" : angesehen[K.id + n] ? " gesehen" : "";
      return '<button type="button" class="sm-punkt' + cls + (n === nr ? " jetzt" : "") + '" data-nr="' + n + '" aria-label="Aufgabe ' + (j + 1) + '">' + (j + 1) + "</button>";
    }).join("");
  }
  function laden(n) {
    clearTimeout(timer);
    nr = n; game = new Chess(aufgabe().fen); aus = false; auswahl = null; letzter = null; flucht = null; fehl = 0;
    $q("[data-sm-nummer]").textContent = "Aufgabe " + (nr % JE_STUFE + 1) + " von " + JE_STUFE;
    $q("[data-sm-quelle]").textContent = aufgabe().jahr ? "Stellung aus einer Turnierpartie (" + aufgabe().jahr + ")" : "";
    $q("[data-sm-loesung]").hidden = true; $q("[data-sm-weiter]").hidden = true;
    status(geloest(K).indexOf(nr) >= 0 ? "Schon gelöst – zur Übung: Wie setzt Weiß matt?" : "Weiß zieht und setzt matt. Findest du den Zug?");
    zeige(); punkte();
  }
  function naechste() {   // nächste ungelöste Aufgabe der Stufe, sonst einfach die nächste
    var g = geloest(K), start = ST * JE_STUFE;
    for (var j = 1; j <= JE_STUFE; j++) { var n = start + (nr - start + j) % JE_STUFE; if (g.indexOf(n) < 0) return laden(n); }
    laden(start + (nr - start + 1) % JE_STUFE);
  }
  function zurueck() { game = new Chess(aufgabe().fen); letzter = null; flucht = null; aus = false; zeige(); }

  function zug(von, nach) {
    var mv = game.move({ from: von, to: nach, promotion: "q" });
    if (!mv) return false;
    auswahl = null; letzter = [von, nach]; aus = true; zeige();
    if (game.in_checkmate()) {
      var g = geloest(K), neu = g.indexOf(nr) < 0, vorher = stufeFertig(K, ST), naechsteKatVorher = KI + 1 < KATS.length && katOffen(KI + 1);
      if (neu && !angesehen[K.id + nr]) { g.push(nr); g.sort(function (a, b) { return a - b; }); Fortschritt.speichern(); }
      var t = "<strong>MATT! " + (fehl ? "Jetzt hast du es!" : "Richtig!") + "</strong> " + de(mv.san);
      if (angesehen[K.id + nr]) t += "<br>Du hattest die Lösung schon gesehen – diese Aufgabe zählt erst, wenn du sie später nochmal schaffst.";
      if (!vorher && stufeFertig(K, ST)) {
        t += "<br>🎉 <strong>Stufe „" + STUFEN[ST] + "“ geschafft!</strong>";
        if (ST + 1 < STUFEN.length) t += " Jetzt ist „" + STUFEN[ST + 1] + "“ frei.";
        if (ST === 0 && KI + 1 < KATS.length && !naechsteKatVorher) t += " Neue Kategorie frei: <strong>" + KATS[KI + 1].titel + "</strong>";
      }
      status(t, "ok"); punkte(); karten();
      $q("[data-sm-loesung]").hidden = true; $q("[data-sm-weiter]").hidden = false;
      return true;
    }
    fehl++;
    if (fehl >= 2) $q("[data-sm-loesung]").hidden = false;
    if (game.in_stalemate()) { status("<strong>PATT!</strong> Der König kann nicht ziehen, steht aber nicht im Schach. Versuch es nochmal!", "bad"); timer = setTimeout(zurueck, 2200); return true; }
    if (!game.in_check()) { status("<strong>Das ist kein Schach</strong> – der König ist gar nicht angegriffen. Versuch es nochmal!", "bad"); timer = setTimeout(zurueck, 1800); return true; }
    // Schach, aber nicht matt: Schwarz zeigt die Abwehr (schlagen > ausweichen > dazwischenziehen)
    var zz = game.moves({ verbose: true });
    var schlagen = zz.filter(function (m) { return m.captured && m.piece !== "k"; }).concat(zz.filter(function (m) { return m.captured && m.piece === "k"; }));
    var koenig = zz.filter(function (m) { return m.piece === "k"; }), antwort, text;
    flucht = koenig.filter(function (m) { return !m.captured; }).map(function (m) { return m.to; });
    if (schlagen.length) { antwort = schlagen[0]; text = "Schach, aber " + NAME[antwort.captured] + " kann geschlagen werden!"; }
    else if (koenig.length) { antwort = koenig[0]; text = "Schach, aber der König kann ausweichen: " + flucht.sort().join(", ") + "."; }
    else { antwort = zz[0]; text = "Schach, aber Schwarz kann eine Figur dazwischenstellen!"; }
    status("<strong>" + text + "</strong> Versuch es nochmal!", "bad"); markieren();
    timer = setTimeout(function () {
      game.move(antwort); letzter = [antwort.from, antwort.to]; zeige();
      timer = setTimeout(zurueck, 1600);
    }, 900);
    return true;
  }
  function loesung() {
    clearTimeout(timer); var l = aufgabe().loesung;
    game = new Chess(aufgabe().fen); var mv = game.move({ from: l.slice(0, 2), to: l.slice(2, 4), promotion: l.charAt(4) || "q" });
    angesehen[K.id + nr] = true; letzter = [mv.from, mv.to]; flucht = null; aus = true; zeige(); punkte();
    status("Die Lösung: <strong>" + de(mv.san) + "</strong>. Diese Aufgabe zählt noch nicht – probier sie später nochmal!", "info");
    $q("[data-sm-loesung]").hidden = true; $q("[data-sm-weiter]").hidden = false;
  }

  function starten(ki, st) {
    if (!stufeOffen(ki, st)) return;
    KI = ki; K = KATS[ki]; ST = st;
    var sek = $q("#aufgabe"); sek.hidden = false;
    $q("[data-sm-titel]").textContent = K.titel + " · " + STUFEN[st];
    $q("[data-sm-tipp]").textContent = K.tipp;
    if (!board) {
      board = Chessboard("sm-board", {
        position: "8/8/8/8/8/8/8/8 w - - 0 1", draggable: true, pieceTheme: PIECES,
        onDragStart: function (src, p) { return !aus && p.charAt(0) === "w"; },
        onDrop: function (von, nach) {
          if (von === nach) { auswahl = auswahl === von ? null : von; markieren(); return; }   // Klick auf eine Figur
          if (!zug(von, nach)) { auswahl = null; return "snapback"; }
        },
        onSnapEnd: function () { zeige(); }
      });
      $("#sm-board").on("click", ".square-55d63", function () {   // Klick–Klick: Zielfeld anklicken
        var q = this.getAttribute("data-square"), p = game && game.get(q);
        if (!auswahl || aus || (p && p.color === "w")) return;
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

  function video() {
    var dlg = $q("#es-video"), v = $q("video", dlg);
    v.playbackRate = 1; $q("[data-v-tempo]", dlg).setAttribute("aria-pressed", "false");
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
    v.play().catch(function () { /* Autoplay verboten */ });
  }

  document.addEventListener("DOMContentLoaded", function () {
    fetch("data/schachmatt.json", { cache: "no-cache" }).then(function (r) { return r.json(); }).then(function (d) {
      KATS = d.kategorien; karten();
    }).catch(function () { $q("[data-sm-karten]").innerHTML = '<p class="notice bad">Die Aufgaben konnten nicht geladen werden.</p>'; });
    document.addEventListener("click", function (e) {
      var b = e.target.closest("[data-stufe],[data-nr],[data-sm-loesung],[data-sm-weiter],[data-sm-video],[data-v-zu],[data-v-tempo]");
      if (!b) return;
      if (b.hasAttribute("data-stufe")) { var x = b.getAttribute("data-stufe").split(","); starten(+x[0], +x[1]); }
      else if (b.hasAttribute("data-nr")) laden(+b.getAttribute("data-nr"));
      else if (b.hasAttribute("data-sm-loesung")) loesung();
      else if (b.hasAttribute("data-sm-weiter")) naechste();
      else if (b.hasAttribute("data-sm-video")) video();
      else if (b.hasAttribute("data-v-zu")) $q("#es-video").close();
      else if (b.hasAttribute("data-v-tempo")) {
        var v = $q("#es-video video"), schnell = v.playbackRate === 1;
        v.playbackRate = schnell ? 2 : 1; b.setAttribute("aria-pressed", String(schnell));
      }
    });
    document.addEventListener("fortschritt-geladen", function () { if (KATS.length) { karten(); if (K) punkte(); } });
    $q("#es-video").addEventListener("close", function () { $q("#es-video video").pause(); });
  });
})();
