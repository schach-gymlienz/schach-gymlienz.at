/* Endspiele (endspiele.html): Treppenmatt, Matt mit der Dame, Matt mit dem Turm.
   Der schwarze König verteidigt nach den Tafeln in assets/endspiele/ (berechnet mit
   tools/endspieltafeln.js): Er schlägt jede ungedeckte Figur, sonst zögert er das Matt so lange
   wie möglich hinaus. Der Fortschritt bleibt im Browser (localStorage) und lässt sich als Datei
   sichern und an einem anderen Gerät wieder laden.
   benötigt jQuery, chess.js und chessboard.js aus assets/rallye/lib/ */
(function () {
  "use strict";
  var PIECES = "assets/rallye/pieces/{piece}.png";
  var SPEICHER = "schach-gymlienz-endspiele";
  var THEMEN = [
    { id: "treppenmatt", titel: "Treppenmatt", unter: "Matt mit zwei Türmen", figuren: ["r", "r"], tafel: "krrk", min: 4,
      text: "Zwei Türme treiben den König Reihe für Reihe an den Rand – wie auf einer Treppe.",
      start: "Setz den König mit den zwei Türmen matt!",
      tipp: "Ein Turm sperrt eine Reihe (Wächter), der andere gibt eine Reihe weiter Schach (Jäger). Dann tauschen sie. Kommt der König zu nahe: Turm ganz auf die andere Seite!",
      verloren: "Der König hat einen Turm geschlagen." },
    { id: "damenmatt", titel: "Matt mit der Dame", unter: "König und Dame gegen König", figuren: ["q"], tafel: "kqk", min: 7, voraus: "treppenmatt",
      text: "Die Dame sperrt den König in ein Rechteck, das immer kleiner wird. Dann hilft dein König.",
      start: "Setz den König mit Dame und König matt!",
      tipp: "Zieh mit der Dame das Rechteck um den König immer kleiner, bis er in der Ecke nur noch ein Feld hat. Vorsicht Patt! Dann kommt dein König zu Hilfe.",
      verloren: "Der König hat die Dame geschlagen." },
    { id: "turmmatt", titel: "Matt mit dem Turm", unter: "König und Turm gegen König", figuren: ["r"], tafel: "krk", min: 10, voraus: "damenmatt",
      text: "Das schwierigste der drei Grundmatts: Turm und König arbeiten eng zusammen.",
      start: "Setz den König mit Turm und König matt!",
      tipp: "Frag dich bei jedem Zug: Kann ich die Box sicher kleiner machen? Ja: Turm zieht. Nein: König kommt näher. Stehen sich die Könige gegenüber, gibt der Turm Schach. Greift der König deinen Turm an: decken oder weit weg ziehen.",
      verloren: "Der König hat den Turm geschlagen." }
  ];
  var ALLE_OFFEN = /[?&]alle\b/.test(location.search);   // für Lehrkräfte: endspiele.html?alle
  function thema(id) { return THEMEN.filter(function (t) { return t.id === id; })[0]; }
  function $q(s, el) { return (el || document).querySelector(s); }

  /* ---------- Fortschritt ---------- */
  function leer() { var s = {}; THEMEN.forEach(function (t) { s[t.id] = { matt: 0, best: 0 }; }); return s; }
  function sauber(x) {   // nur bekannte Felder, nur Zahlen
    var s = leer();
    if (x && typeof x === "object") THEMEN.forEach(function (t) {
      var e = x[t.id] || {};
      s[t.id].matt = Math.max(0, Math.floor(+e.matt) || 0);
      s[t.id].best = Math.max(0, Math.floor(+e.best) || 0);
    });
    return s;
  }
  var stand = leer();
  try { stand = sauber(JSON.parse(localStorage.getItem(SPEICHER))); } catch (e) { /* privat-Fenster o. Ä. */ }
  function speichern() { try { localStorage.setItem(SPEICHER, JSON.stringify(stand)); } catch (e) { /* egal */ } }
  function offen(t) { return ALLE_OFFEN || !t.voraus || stand[t.voraus].matt > 0 || stand[t.id].matt > 0; }   // einmal geschafft bleibt offen

  /* Datei: Prüfsumme gegen versehentliche oder neugierige Änderungen (kein echter Schutz) */
  function pruef(s) { var h = 2166136261, x = "Schach-Gym-Lienz|" + JSON.stringify(s); for (var i = 0; i < x.length; i++) { h ^= x.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h.toString(36); }
  function sichern() {
    var heute = new Date(), d = heute.getFullYear() + "-" + ("0" + (heute.getMonth() + 1)).slice(-2) + "-" + ("0" + heute.getDate()).slice(-2);
    var inhalt = { app: "schach-gymlienz.at/endspiele", version: 1, gesichert: d, fortschritt: stand, pruef: pruef(stand) };
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(inhalt, null, 1)], { type: "text/plain" }));
    a.download = "Schach-Endspiele-Fortschritt_" + d + ".txt";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    fmeldung("Gespeichert als <strong>" + a.download + "</strong>. Leg die Datei auf deinen USB-Stick, in deinen OneDrive oder schick sie dir per Mail.", true);
  }
  function laden(datei) {
    var r = new FileReader();
    r.onload = function () {
      var x; try { x = JSON.parse(r.result); } catch (e) { x = null; }
      if (!x || x.app !== "schach-gymlienz.at/endspiele" || !x.fortschritt) { fmeldung("Das ist keine Fortschritts-Datei der Endspiele.", false); return; }
      var neu = sauber(x.fortschritt);
      if (pruef(neu) !== x.pruef) { fmeldung("Diese Datei wurde verändert oder ist beschädigt und kann nicht geladen werden.", false); return; }
      THEMEN.forEach(function (t) {   // zusammenführen: das Bessere gewinnt
        var a = stand[t.id], b = neu[t.id];
        a.matt = Math.max(a.matt, b.matt);
        a.best = a.best && b.best ? Math.min(a.best, b.best) : (a.best || b.best);
      });
      speichern(); karten();
      fmeldung("Fortschritt vom " + (x.gesichert || "?").split("-").reverse().join(".") + " geladen. Alles, was du hier schon geschafft hattest, bleibt erhalten.", true);
    };
    r.readAsText(datei);
  }
  function fmeldung(t, ok) { var m = $q("[data-es-fmsg]"); m.hidden = false; m.innerHTML = t; m.className = "notice " + (ok ? "ok" : "bad"); }

  /* ---------- Tafeln: Züge bis Matt mit Weiß am Zug (0 = kein Gewinn) ---------- */
  var tafeln = {};
  function tafel(name) {
    if (!tafeln[name]) tafeln[name] = fetch("assets/endspiele/" + name + ".bin").then(function (r) {
      if (!r.ok) throw new Error(name); return r.arrayBuffer(); }).then(function (b) { return new Uint8Array(b); });
    return tafeln[name];
  }
  var DREIECK = []; for (var f = 0; f < 4; f++) for (var r = 0; r <= f; r++) DREIECK.push(f + 8 * r);
  function spiegel(wk) {   // Spiegelung, die den weißen König ins Dreieck a1–d1–d4 bringt
    var f = wk & 7, r = wk >> 3, ff = f > 3, fr = r > 3; if (ff) f = 7 - f; if (fr) r = 7 - r; var tr = r > f;
    return function (s) { var a = s & 7, b = s >> 3; if (ff) a = 7 - a; if (fr) b = 7 - b; if (tr) { var x = a; a = b; b = x; } return a + 8 * b; };
  }
  function wert(daten, wk, figs, bk) {
    var t = spiegel(wk), w = DREIECK.indexOf(t(wk));
    if (figs.length === 2) {
      var a = t(figs[0]), b = t(figs[1]); if (a > b) { var x = a; a = b; b = x; }
      var pos = (w * 2016 + b * (b - 1) / 2 + a) * 64 + t(bk), byte = daten[pos >> 1];
      return pos & 1 ? byte >> 4 : byte & 15;
    }
    return daten[(w * 64 + t(figs[0])) * 64 + t(bk)];
  }
  var LINIEN = "abcdefgh";
  function nr(feld) { return LINIEN.indexOf(feld.charAt(0)) + 8 * (+feld.charAt(1) - 1); }
  function feld(n) { return LINIEN.charAt(n & 7) + ((n >> 3) + 1); }
  function stellung(game) {   // {wk, bk, figs, typen}
    var s = { figs: [], typen: "" };
    for (var n = 0; n < 64; n++) {
      var p = game.get(feld(n)); if (!p) continue;
      if (p.type === "k") { if (p.color === "w") s.wk = n; else s.bk = n; }
      else if (p.color === "w") { s.figs.push(n); s.typen += p.type; }
    }
    return s;
  }
  function wertSpiel(game, daten) { var s = stellung(game); return wert(daten, s.wk, s.figs, s.bk); }

  /* ---------- Spiel ---------- */
  var T, daten, game, board, zuege, bestwert, aus, wartet, auswahl, letzter, timer;
  function status(t, art) { var m = $q("[data-es-msg]"); m.innerHTML = t; m.className = "notice" + (art ? " " + art : ""); }
  function zaehler() { $q("[data-es-zaehler]").innerHTML = "Deine Züge: <strong>" + zuege + "</strong>" + (bestwert ? " · bestmöglich: <strong>" + bestwert + "</strong>" : ""); }
  function markieren() {
    $("#es-board .square-55d63").removeClass("es-wahl es-letzter");
    if (letzter) letzter.forEach(function (q) { $("#es-board .square-" + q).addClass("es-letzter"); });
    if (auswahl) $("#es-board .square-" + auswahl).addClass("es-wahl");
  }
  function zeige() { board.position(game.fen(), false); setTimeout(markieren, 0); }

  function neueStellung() {
    clearTimeout(timer);
    var versuche = 0;
    while (true) {
      versuche++;
      var min = versuche < 20000 ? T.min : 1, frei = [];
      for (var n = 0; n < 64; n++) frei.push(n);
      var felder = [];
      for (var k = 0; k < 2 + T.figuren.length; k++) felder.push(frei.splice(Math.floor(Math.random() * frei.length), 1)[0]);
      var wk = felder[0], bk = felder[1], figs = felder.slice(2);
      var nah = function (a, b) { return Math.max(Math.abs((a & 7) - (b & 7)), Math.abs((a >> 3) - (b >> 3))) <= 1; };
      if (nah(wk, bk) || figs.some(function (s) { return nah(s, bk); })) continue;   // nichts direkt neben dem König
      var v = wert(daten, wk, figs, bk);   // 0 auch bei ungültiger Stellung (Schwarz im Schach)
      if (v < min) continue;
      game = new Chess(); game.clear();
      game.put({ type: "k", color: "w" }, feld(wk)); game.put({ type: "k", color: "b" }, feld(bk));
      figs.forEach(function (s, i) { game.put({ type: T.figuren[i], color: "w" }, feld(s)); });
      bestwert = v; break;
    }
    zuege = 0; aus = false; wartet = false; auswahl = null; letzter = null;
    zeige(); zaehler(); status(T.start);
  }

  function weissZieht(von, nach) {
    var mv = game.move({ from: von, to: nach });
    if (!mv) return false;
    zuege++; auswahl = null; letzter = [von, nach]; zeige(); zaehler();
    if (!ende()) { wartet = true; status("Der König überlegt …", "info"); timer = setTimeout(schwarzZieht, 450); }
    return true;
  }
  function schwarzZieht() {
    var zz = game.moves({ verbose: true }), schlaege = zz.filter(function (m) { return m.captured; }), wahl;
    if (schlaege.length) wahl = schlaege[Math.floor(Math.random() * schlaege.length)];
    else {
      var bewertet = zz.map(function (m) { game.move(m); var v = wertSpiel(game, daten); game.undo(); return { m: m, v: v === 0 ? 1000 : v }; });
      var best = Math.max.apply(null, bewertet.map(function (b) { return b.v; }));
      var gute = bewertet.filter(function (b) { return b.v === best; });
      wahl = gute[Math.floor(Math.random() * gute.length)].m;
    }
    game.move(wahl); letzter = [wahl.from, wahl.to]; wartet = false; zeige();
    if (!ende()) status("Du bist am Zug.");
  }
  function ende() {
    var weisse = stellung(game).figs.length;
    if (game.in_checkmate()) {
      var e = stand[T.id], neuFrei = THEMEN.filter(function (t) { return t.voraus === T.id && !offen(t); })[0];
      e.matt++; if (!e.best || zuege < e.best) e.best = zuege; speichern(); karten();
      var lob = zuege <= bestwert ? " Bestmöglich – besser geht es nicht!" : " Bestmöglich wären " + bestwert + " Züge gewesen.";
      status("<strong>Matt in " + zuege + " Zügen – super gemacht!</strong>" + lob + (neuFrei ? "<br>🎉 Neu freigeschaltet: <strong>" + neuFrei.titel + "</strong>" : ""), "ok");
    } else if (game.in_stalemate()) status("<strong>Patt!</strong> Der König kann nicht ziehen, steht aber nicht im Schach. Das ist nur Remis.", "bad");
    else if (weisse < T.figuren.length) status("<strong>" + T.verloren + "</strong> Versuch es nochmal!", "bad");
    else if (game.in_draw()) status("<strong>50 Züge ohne Matt: Remis.</strong> Schau dir das Video an!", "bad");
    else return false;
    aus = true; auswahl = null;
    return true;
  }

  function spielen(id) {
    T = thema(id); if (!offen(T)) return;
    var sek = $q("#spiel"); sek.hidden = false;
    $q("[data-es-titel]").textContent = T.titel;
    $q("[data-es-unter]").textContent = T.unter;
    $q("[data-es-tipp]").textContent = T.tipp;
    status("Brett wird vorbereitet …", "info");
    if (!board) {
      board = Chessboard("es-board", {
        position: "8/8/8/8/8/8/8/8 w - - 0 1", draggable: true, pieceTheme: PIECES,
        onDragStart: function (src, p) { return !aus && !wartet && p.charAt(0) === "w"; },
        onDrop: function (von, nach) {
          if (von === nach) { auswahl = auswahl === von ? null : von; markieren(); return; }   // Klick auf eine Figur
          if (!weissZieht(von, nach)) { auswahl = null; return "snapback"; }
        },
        onSnapEnd: function () { zeige(); }
      });
      $("#es-board").on("click", ".square-55d63", function () {   // Klick–Klick: Zielfeld anklicken
        var q = this.getAttribute("data-square"), p = game && game.get(q);
        if (!auswahl || aus || wartet || (p && p.color === "w")) return;
        if (!weissZieht(auswahl, q)) { auswahl = null; markieren(); }
      });
      window.addEventListener("resize", function () { board.resize(); markieren(); });
    }
    sek.scrollIntoView({ behavior: "smooth", block: "start" });
    tafel(T.tafel).then(function (d) { daten = d; neueStellung(); board.resize(); markieren(); })
      .catch(function () { status("Die Endspiel-Tafel konnte nicht geladen werden.", "bad"); });
  }

  /* ---------- Video ---------- */
  function video(id) {
    var t = thema(id), dlg = $q("#es-video"), v = $q("video", dlg);
    $q("[data-v-titel]", dlg).textContent = t.titel + " · " + t.unter;
    v.poster = "assets/video/endspiele/" + id + ".jpg";
    v.src = "assets/video/endspiele/" + id + ".mp4";
    v.playbackRate = 1; $q("[data-v-tempo]", dlg).setAttribute("aria-pressed", "false");
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
    v.play().catch(function () { /* Autoplay verboten: Nutzer:in klickt selbst */ });
  }

  /* ---------- Auswahlkarten ---------- */
  function karten() {
    var el = $q("[data-es-karten]");
    el.innerHTML = THEMEN.map(function (t, i) {
      var s = stand[t.id], frei = offen(t), vor = t.voraus && thema(t.voraus);
      var info = !frei ? "🔒 Wird frei, sobald du <strong>" + vor.titel + "</strong> geschafft hast."
        : s.matt ? "✓ " + s.matt + "× geschafft · bestes Ergebnis: " + s.best + " Züge" : "Noch nicht geschafft";
      return '<div class="card es-karte' + (frei ? "" : " gesperrt") + '">' +
        '<span class="kicker">Stufe ' + (i + 1) + "</span><h3>" + t.titel + '</h3><p class="muted small">' + t.unter + "</p>" +
        "<p>" + t.text + "</p>" +
        '<p class="es-stand' + (s.matt ? " geschafft" : "") + '">' + info + "</p>" +
        '<div class="btn-row"><button type="button" class="btn btn-soft" data-video="' + t.id + '">▶ Video</button>' +
        '<button type="button" class="btn ' + (frei ? "btn-gold" : "btn-soft") + '" data-spiel="' + t.id + '"' + (frei ? "" : " disabled") + ">Spielen</button></div></div>";
    }).join("");
  }

  document.addEventListener("DOMContentLoaded", function () {
    karten();
    document.addEventListener("click", function (e) {
      var b = e.target.closest("[data-spiel],[data-video],[data-es-neu],[data-es-videojetzt],[data-v-zu],[data-v-tempo],[data-es-sichern],[data-es-laden]");
      if (!b) return;
      if (b.hasAttribute("data-spiel")) spielen(b.getAttribute("data-spiel"));
      else if (b.hasAttribute("data-video")) video(b.getAttribute("data-video"));
      else if (b.hasAttribute("data-es-neu")) { if (daten) neueStellung(); }
      else if (b.hasAttribute("data-es-videojetzt")) { if (T) video(T.id); }
      else if (b.hasAttribute("data-v-zu")) $q("#es-video").close();
      else if (b.hasAttribute("data-v-tempo")) {
        var v = $q("#es-video video"), schnell = v.playbackRate === 1;
        v.playbackRate = schnell ? 2 : 1; b.setAttribute("aria-pressed", String(schnell));
      }
      else if (b.hasAttribute("data-es-sichern")) sichern();
      else if (b.hasAttribute("data-es-laden")) $q("[data-es-datei]").click();
    });
    $q("[data-es-datei]").addEventListener("change", function (e) { if (e.target.files[0]) laden(e.target.files[0]); e.target.value = ""; });
    $q("#es-video").addEventListener("close", function () { var v = $q("#es-video video"); v.pause(); });
  });
})();
