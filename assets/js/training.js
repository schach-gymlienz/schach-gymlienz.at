/* Training: Rätsel der Woche (data/raetsel.json) und Partien zum Nachspielen (data/partien.json)
   benötigt jQuery, chess.js und chessboard.js aus assets/rallye/lib/ */
(function () {
  "use strict";
  var PIECES = "assets/rallye/pieces/{piece}.png";
  var FIG = { K: "K", Q: "D", R: "T", B: "L", N: "S" };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function de(san) { return san.replace(/[KQRBN]/g, function (c) { return FIG[c]; }); }   // Notation auf Deutsch
  function d(s) { var p = s.split("-"); return new Date(+p[0], p[1] - 1, +p[2]); }
  function datum(s) { var x = d(s); return x.getDate() + "." + (x.getMonth() + 1) + "." + x.getFullYear(); }
  var boards = [];
  window.addEventListener("resize", function () { boards.forEach(function (b) { b.resize(); }); });

  /* ---------- Rätsel der Woche ---------- */
  function raetsel(el, data) {
    var heute = new Date(), liste = data.raetsel.filter(function (r) { return d(r.ab) <= heute; });
    if (!liste.length) liste = data.raetsel.slice(0, 1);
    liste.reverse();   // aktuelles zuerst
    el.innerHTML =
      '<div class="puzzle">' +
      '<div class="puzzle-board"><div id="rdw-board"></div></div>' +
      '<div class="puzzle-side">' +
      '<span class="pill pill-gold" data-rdw-thema></span>' +
      '<h3 data-rdw-titel></h3>' +
      '<p data-rdw-text></p>' +
      '<p class="notice" data-rdw-msg hidden></p>' +
      '<div class="btn-row"><button type="button" class="btn btn-soft" data-rdw-reset>Nochmal</button><button type="button" class="btn btn-navy" data-rdw-loesung>Lösung zeigen</button></div>' +
      (liste.length > 1 ? '<label class="field"><span>Frühere Rätsel</span><select data-rdw-sel>' + liste.map(function (r, i) { return '<option value="' + i + '">' + (i === 0 ? "Aktuell: " : "") + "Woche ab " + datum(r.ab) + " · " + esc(r.thema) + "</option>"; }).join("") + "</select></label>" : "") +
      '<p class="muted small">Rätsel aus der freien Rätseldatenbank von lichess.org. Mehr üben: <a href="taktik.html">Rätsel-Rallye</a>.</p>' +
      "</div></div>";
    var chess, board, r, fertig;
    var q = function (s) { return el.querySelector(s); };
    function msg(t, ok) { var m = q("[data-rdw-msg]"); m.hidden = false; m.innerHTML = t; m.className = "notice" + (ok === true ? " ok" : ok === false ? " bad" : ""); }
    function laden(i) {
      r = liste[i]; chess = new Chess(r.fen); fertig = false;
      q("[data-rdw-thema]").textContent = r.thema;
      q("[data-rdw-titel]").textContent = i === 0 ? "Rätsel der Woche" : "Rätsel der Woche ab " + datum(r.ab);
      q("[data-rdw-text]").textContent = r.text;
      q("[data-rdw-msg]").hidden = true;
      var cfg = { position: r.fen, draggable: true, pieceTheme: PIECES, orientation: chess.turn() === "w" ? "white" : "black",
        onDragStart: function (src, p) { return !fertig && p.charAt(0) === chess.turn(); },
        onDrop: function (from, to) {
          var mv = chess.move({ from: from, to: to, promotion: "q" });
          if (!mv) return "snapback";
          if (from + to === r.loesung.slice(0, 4)) { fertig = true; msg("<strong>Richtig!</strong> " + de(r.san) + " ist der beste Zug.", true); }
          else { msg("<strong>Leider nicht.</strong> " + de(mv.san) + " ist nicht der beste Zug – probier es noch einmal!", false); setTimeout(function () { chess.undo(); board.position(chess.fen()); }, 900); }
        },
        onSnapEnd: function () { board.position(chess.fen()); } };
      if (board) { board.destroy(); boards.splice(boards.indexOf(board), 1); }
      board = Chessboard("rdw-board", cfg); boards.push(board);
    }
    q("[data-rdw-reset]").addEventListener("click", function () { var i = q("[data-rdw-sel]") ? +q("[data-rdw-sel]").value : 0; laden(i); });
    q("[data-rdw-loesung]").addEventListener("click", function () {
      chess = new Chess(r.fen); chess.move({ from: r.loesung.slice(0, 2), to: r.loesung.slice(2, 4), promotion: r.loesung.charAt(4) || "q" });
      board.position(chess.fen()); fertig = true; msg("Lösung: <strong>" + de(r.san) + "</strong>");
    });
    if (q("[data-rdw-sel]")) q("[data-rdw-sel]").addEventListener("change", function (e) { laden(+e.target.value); });
    laden(0);
  }

  /* ---------- Partien zum Nachspielen ---------- */
  function partien(el, data) {
    el.innerHTML = '<div class="tabs" role="group" aria-label="Partie wählen">' + data.partien.map(function (p, i) {
      return '<button type="button" data-p="' + i + '" aria-pressed="' + (i === 0) + '">' + esc(p.titel) + "</button>"; }).join("") + "</div>" +
      '<div class="puzzle"><div class="puzzle-board"><div id="pgn-board"></div>' +
      '<div class="pgn-ctl" role="group" aria-label="Züge"><button type="button" data-go="start" aria-label="Zum Anfang">⏮</button><button type="button" data-go="-1" aria-label="Zug zurück">◀</button><button type="button" data-go="1" aria-label="Nächster Zug">▶</button><button type="button" data-go="end" aria-label="Zum Ende">⏭</button></div></div>' +
      '<div class="puzzle-side"><h3 data-pgn-titel></h3><p class="muted small" data-pgn-meta></p><p data-pgn-kom></p><ol class="pgn-moves" data-pgn-moves></ol></div></div>';
    var board = Chessboard("pgn-board", { position: "start", pieceTheme: PIECES }); boards.push(board);
    var fens, sans, pos;
    var q = function (s) { return el.querySelector(s); };
    function zeig(n) {
      pos = Math.max(0, Math.min(fens.length - 1, n)); board.position(fens[pos]);
      Array.prototype.forEach.call(el.querySelectorAll("[data-m]"), function (b) { b.classList.toggle("on", +b.getAttribute("data-m") === pos); });
    }
    function laden(i) {
      var p = data.partien[i], c = new Chess(); c.load_pgn(p.pgn);
      var hist = c.history(), g = new Chess(); fens = [g.fen()]; sans = [];
      hist.forEach(function (m) { g.move(m); fens.push(g.fen()); sans.push(de(m)); });
      q("[data-pgn-titel]").textContent = p.titel;
      q("[data-pgn-meta]").textContent = p.weiss + " – " + p.schwarz + " · " + [p.ort, p.jahr].filter(Boolean).join(", ");
      q("[data-pgn-kom]").textContent = p.kommentar || "";
      var html = "";
      for (var k = 0; k < sans.length; k += 2) html += "<li><button type=\"button\" data-m=\"" + (k + 1) + "\">" + sans[k] + "</button>" + (sans[k + 1] ? "<button type=\"button\" data-m=\"" + (k + 2) + "\">" + sans[k + 1] + "</button>" : "") + "</li>";
      q("[data-pgn-moves]").innerHTML = html;
      Array.prototype.forEach.call(el.querySelectorAll("[data-p]"), function (b) { b.setAttribute("aria-pressed", String(+b.getAttribute("data-p") === i)); });
      zeig(0);
    }
    el.addEventListener("click", function (e) {
      var t = e.target.closest("button"); if (!t) return;
      if (t.hasAttribute("data-p")) laden(+t.getAttribute("data-p"));
      else if (t.hasAttribute("data-m")) zeig(+t.getAttribute("data-m"));
      else if (t.hasAttribute("data-go")) { var g = t.getAttribute("data-go"); zeig(g === "start" ? 0 : g === "end" ? fens.length - 1 : pos + (+g)); }
    });
    el.addEventListener("keydown", function (e) { if (e.key === "ArrowRight") zeig(pos + 1); if (e.key === "ArrowLeft") zeig(pos - 1); });
    laden(0);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var r = document.querySelector("[data-raetsel]"), p = document.querySelector("[data-partien]");
    if (r) fetch("data/raetsel.json", { cache: "no-cache" }).then(function (x) { return x.json(); }).then(function (d) { raetsel(r, d); }).catch(function () { r.innerHTML = '<p class="notice">Das Rätsel konnte nicht geladen werden.</p>'; });
    if (p) fetch("data/partien.json", { cache: "no-cache" }).then(function (x) { return x.json(); }).then(function (d) { partien(p, d); }).catch(function () { p.innerHTML = '<p class="notice">Die Partien konnten nicht geladen werden.</p>'; });
  });
})();
