/* ==========================================================================
   Schach-Rätsel-Rallye – übernommen von der bisherigen Homepage
   (Idee und Umsetzung: Prof. Mag. Hannes Amon), für schach-gymlienz.at
   angepasst: alle Bibliotheken, Figuren und Rätsel-Pools liegen jetzt
   lokal auf dieser Seite (keine CDNs, keine externen Skripte).

   Lehrer-Kommandos (statt eines Namens eingeben):
     Lehrer                    → neuen Freischaltcode erzeugen
     Update Leicht|Mittel|Schwer → eingebaute Pools
     Update <Thema> [<Stufe>]  → Lichess-Pool, z. B. "Update Gabel Mittel"
   Direktlink für eine Stunde: taktik.html?pool=gabel&level=mittel
   ========================================================================== */
(function () {
  "use strict";

  // =====================================================================
  // KONFIGURATION
  // =====================================================================

  // (1) Freischaltcode (Standard, solange der Lehrer keinen neuen erzeugt):
  var UNLOCK_CODE = 'SCHACH2026';

  // (1b) Geheimcode für die Prüfsumme der Ergebnisse. Hinweis: Auf einer
  //      öffentlichen Website ist dieser Text für Technikkundige einsehbar –
  //      die Prüfsumme schützt also nur vor zufälligem, nicht vor gezieltem Fälschen.
  var SIGNATURE_SECRET = 'Vielleichthabtihrschoneinmalvonmirgehört';

  // (2) Microsoft-Forms-Formular der Schule mit Platzhaltern (bitte nur ändern,
  //     wenn ein neues Formular verwendet wird). Leer lassen = Ergebnis nur anzeigen.
  var MS_FORMS_TEMPLATE = 'https://forms.office.com/Pages/ResponsePage.aspx?id=-nZ0FmWbqEKQVd-6LIWaYGBoi3GVhvNBgVDjiC0H7hxUM0EwVE5HV0kxVU9EVFU0NDRQSk1aQ1MxWi4u&r4fc9acf87ffb43c89739f054dd06b67f=NAME_HIER&r958ec8195c0846fbbb3d288644196827=PUNKTE_HIER&r3571385303d54789a8f2d053dd411258=DETAILS_HIER&r073cb91e94dd49339c3bf5116157018a=DATUM_HIER';

  // (3) Zeit pro Rätsel in Sekunden, (4) Anzahl Rätsel pro Rallye
  var TIME_PER_PUZZLE = 120;
  var PUZZLES_PER_RALLY = 10;

  // (5) Eingebaute Pools (Matt in 1)
  var POOL_LEICHT = [
    { fen: '6k1/5ppp/8/8/8/8/8/R6K w - - 0 1', solution: 'a1a8', theme: 'Grundreihen-Matt' },
    { fen: '7k/8/6K1/8/8/8/8/R7 w - - 0 1', solution: 'a1a8', theme: 'Turm-Matt' },
    { fen: '7k/8/6K1/8/8/8/8/4Q3 w - - 0 1', solution: 'e1e8', theme: 'Damen-Matt 8. Reihe' },
    { fen: '7k/R7/1R6/8/8/8/8/7K w - - 0 1', solution: 'b6b8', theme: 'Treppen-Matt' },
    { fen: '7k/5K2/6Q1/8/8/8/8/8 w - - 0 1', solution: 'g6g7', theme: 'Damen-Matt' },
    { fen: '7k/8/7K/Q7/8/8/8/8 w - - 0 1', solution: 'a5a8', theme: 'Damen-Matt' },
    { fen: '6k1/5ppp/8/3B4/8/8/8/R5K1 w - - 0 1', solution: 'a1a8', theme: 'Grundreihe + Läufer' },
    { fen: 'k7/8/1K6/8/8/8/8/7R w - - 0 1', solution: 'h1h8', theme: 'Turm-Matt' },
    { fen: '3k4/8/3K4/8/8/8/8/Q7 w - - 0 1', solution: 'a1a8', theme: 'Damen-Matt' },
    { fen: '4k3/8/3K4/8/8/8/8/6Q1 w - - 0 1', solution: 'g1g8', theme: 'Damen-Matt' },
    { fen: 'k7/8/1K6/8/8/8/8/3Q4 w - - 0 1', solution: 'd1d8', theme: 'Damen-Matt 8. Reihe' },
    { fen: '6k1/6pp/5K2/8/8/8/8/R7 w - - 0 1', solution: 'a1a8', theme: 'Grundreihen-Matt' },
    { fen: '4k3/8/4K3/8/8/8/8/R7 w - - 0 1', solution: 'a1a8', theme: 'Turm-Matt zentral' }
  ];
  var POOL_MITTEL = [
    { fen: '6k1/5ppp/8/2p5/8/8/8/R6K w - - 0 1', solution: 'a1a8', theme: 'Grundreihen-Matt' },
    { fen: '6k1/5ppp/8/8/3P4/8/1PP5/R6K w - - 0 1', solution: 'a1a8', theme: 'Grundreihen-Matt' },
    { fen: '7k/8/6K1/8/3p4/8/2P5/R7 w - - 0 1', solution: 'a1a8', theme: 'Turm-Matt' },
    { fen: '3k4/8/3K4/4p3/4P3/8/8/Q7 w - - 0 1', solution: 'a1a8', theme: 'Damen-Matt' },
    { fen: 'k7/8/1K6/8/3p4/8/4P3/7R w - - 0 1', solution: 'h1h8', theme: 'Turm-Matt' },
    { fen: '3k4/8/3K4/8/3P4/8/8/6Q1 w - - 0 1', solution: 'g1g8', theme: 'Damen-Matt' }
  ];
  var POOL_SCHWER = [
    { fen: 'r5k1/1p3ppp/p1n5/8/8/8/8/R5K1 w - - 0 1', solution: 'a1a8', theme: 'Turm schlägt + Matt' },
    { fen: '6k1/Q4ppp/8/8/4N3/8/8/6K1 w - - 0 1', solution: 'a7a8', theme: 'Damen-Matt 8. Reihe' },
    { fen: '6k1/5ppp/8/8/2N5/8/8/R6K w - - 0 1', solution: 'a1a8', theme: 'Grundreihen-Matt' },
    { fen: '3k4/8/3K4/3P4/3p4/8/8/Q7 w - - 0 1', solution: 'a1a8', theme: 'Damen-Matt' },
    { fen: 'r6k/6pp/p7/1p5n/4P3/8/8/R3K3 w - - 0 1', solution: 'a1a8', theme: 'Turm schlägt + Matt' },
    { fen: 'r1b3k1/5ppp/p7/8/8/8/8/R5K1 w - - 0 1', solution: 'a1a8', theme: 'Turm schlägt + Matt' }
  ];

  // (6) Lichess-Pools (CC0) liegen lokal in diesem Ordner
  var POOL_BASE = 'assets/rallye/pools/';
  var PIECE_THEME = 'assets/rallye/pieces/{piece}.png';

  // (7) Themen deutsch → Lichess-Theme
  var THEME_MAP = {
    'matt1': 'mateIn1', 'matt-in-1': 'mateIn1', 'mattin1': 'mateIn1',
    'matt2': 'mateIn2', 'matt-in-2': 'mateIn2', 'mattin2': 'mateIn2',
    'grundreihe': 'backRankMate', 'grundreihenmatt': 'backRankMate',
    'erstickt': 'smotheredMate', 'erstickenmatt': 'smotheredMate', 'erstickungsmatt': 'smotheredMate',
    'gabel': 'fork', 'fork': 'fork',
    'spiess': 'skewer', 'spieß': 'skewer', 'skewer': 'skewer',
    'abzug': 'discoveredAttack', 'abzugsangriff': 'discoveredAttack',
    'fesselung': 'pin', 'pin': 'pin',
    'ablenkung': 'deflection',
    'hinlenkung': 'attraction',
    'endspiel': 'endgame',
    'turmendspiel': 'rookEndgame', 'turm-endspiel': 'rookEndgame',
    'bauernendspiel': 'pawnEndgame', 'bauern-endspiel': 'pawnEndgame'
  };
  // (8) Stufe → Rating-Bereich
  var DIFFICULTY_RANGE = { 'leicht': [600, 1100], 'mittel': [1100, 1600], 'schwer': [1600, 2200] };
  var THEME_LABEL = {
    'mateIn1': 'Matt in 1', 'mateIn2': 'Matt in 2', 'backRankMate': 'Grundreihenmatt', 'smotheredMate': 'Ersticktes Matt',
    'fork': 'Gabel', 'skewer': 'Spieß', 'discoveredAttack': 'Abzugsangriff', 'pin': 'Fesselung', 'deflection': 'Ablenkung',
    'attraction': 'Hinlenkung', 'endgame': 'Endspiel', 'rookEndgame': 'Turmendspiel', 'pawnEndgame': 'Bauernendspiel'
  };
  var CODE_WORDS = ['DRACHE', 'STERN', 'ZAUBER', 'KOENIG', 'TURM', 'PFERD', 'BAUER', 'DAME', 'FEUER', 'MOND', 'SONNE', 'BLITZ',
    'STURM', 'WOLKE', 'BERG', 'ADLER', 'WALD', 'FLUSS', 'EICHE', 'FALKE', 'LICHT', 'SCHATTEN', 'NEBEL', 'RABE'];

  // Lehrer-Einstellungen bleiben nur in diesem Browser gespeichert
  var LS_CODE = 'lpr_unlock_code', LS_POOL = 'lpr_active_pool', LS_POOL_NAME = 'lpr_pool_name';
  var ACTIVE_UNLOCK_CODE = UNLOCK_CODE, ACTIVE_POOL = POOL_LEICHT, ACTIVE_POOL_NAME = 'Leicht (Standard)';
  try {
    var sc = localStorage.getItem(LS_CODE); if (sc) ACTIVE_UNLOCK_CODE = sc;
    var sp = localStorage.getItem(LS_POOL); if (sp) { var parsed = JSON.parse(sp); if (parsed && parsed.length) ACTIVE_POOL = parsed; }
    var spn = localStorage.getItem(LS_POOL_NAME); if (spn) ACTIVE_POOL_NAME = spn;
  } catch (e) { /* Browser-Speicher nicht verfügbar */ }

  // =====================================================================
  var $ = function (id) { return document.getElementById(id); };
  var $start, $quiz, $end, $status, $counter, $timer, $score, $err;
  var board = null, chess = null, puzzles = [], current = 0, score = 0, results = [], playerName = '';
  var timerId = null, secondsLeft = 0, movedThisPuzzle = false, advanceLock = false;

  function shuffle(arr) { var a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function setStatus(html, kind) { $status.className = 'rally-msg rally-' + (kind || 'info'); $status.innerHTML = html; }
  function formatTime(s) { var m = Math.floor(s / 60), r = s % 60; return m + ':' + (r < 10 ? '0' + r : r); }
  function updateProgress() {
    $counter.innerHTML = '<b>Rätsel ' + (current + 1) + ' / ' + puzzles.length + '</b>';
    $score.textContent = 'Punkte: ' + score;
    $timer.textContent = 'Zeit: ' + formatTime(secondsLeft);
  }
  function startTimer() {
    secondsLeft = TIME_PER_PUZZLE; updateProgress();
    if (timerId) clearInterval(timerId);
    timerId = setInterval(function () {
      secondsLeft--;
      $timer.classList.toggle('rally-urgent', secondsLeft <= 10);
      $timer.textContent = 'Zeit: ' + formatTime(secondsLeft);
      if (secondsLeft <= 0) { stopTimer(); onTimeOut(); }
    }, 1000);
  }
  function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null; } $timer.classList.remove('rally-urgent'); }
  function uciOfMove(mv) { return mv.from + mv.to + (mv.promotion ? mv.promotion : ''); }

  function loadPuzzle(idx) {
    var p = puzzles[idx];
    chess = new Chess(p.fen); movedThisPuzzle = false; advanceLock = false;
    var userColor = chess.turn();
    if (board) board.destroy();
    board = Chessboard('lpr-board', {
      draggable: true, position: p.fen, orientation: userColor === 'w' ? 'white' : 'black', pieceTheme: PIECE_THEME,
      onDragStart: onDragStart, onDrop: onDrop, onSnapEnd: function () { board.position(chess.fen()); }
    });
    setStatus('<b>' + p.theme + '</b> – ' + (userColor === 'w' ? 'Weiß' : 'Schwarz') + ' am Zug. Finde den besten Zug!', 'info');
    updateProgress(); startTimer();
  }
  function onDragStart(source, piece) {
    if (movedThisPuzzle || advanceLock) return false;
    var c = chess.turn();
    if ((c === 'w' && piece.search(/^b/) !== -1) || (c === 'b' && piece.search(/^w/) !== -1)) return false;
    return true;
  }
  function onDrop(source, target) {
    if (movedThisPuzzle || advanceLock) return 'snapback';
    var move = chess.move({ from: source, to: target, promotion: 'q' });
    if (move === null) return 'snapback';
    movedThisPuzzle = true; stopTimer();
    var played = uciOfMove(move), expected = puzzles[current].solution;
    var sameMove = played === expected || (expected.length === 4 && played.substring(0, 4) === expected);
    var correct = sameMove || chess.in_checkmate();
    if (correct) {
      score++; results.push({ theme: puzzles[current].theme, solved: true, played: played });
      setStatus('Richtig! ' + (chess.in_checkmate() ? 'Matt!' : 'Das ist der beste Zug!') + ' +1 Punkt', 'ok');
    } else {
      results.push({ theme: puzzles[current].theme, solved: false, played: played });
      setStatus('Leider falsch – richtig wäre gewesen: <b>' + expected.substring(0, 2) + ' → ' + expected.substring(2, 4) + '</b>', 'bad');
    }
    updateProgress(); scheduleNext();
  }
  function onTimeOut() {
    if (movedThisPuzzle || advanceLock) return;
    movedThisPuzzle = true;
    var expected = puzzles[current].solution;
    results.push({ theme: puzzles[current].theme, solved: false, played: '(Zeit aus)' });
    setStatus('Zeit ist um – richtig war: <b>' + expected.substring(0, 2) + ' → ' + expected.substring(2, 4) + '</b>', 'bad');
    scheduleNext();
  }
  function scheduleNext() {
    advanceLock = true;
    setTimeout(function () { current++; if (current >= puzzles.length) finishRally(); else loadPuzzle(current); }, 2000);
  }
  function buildDetails() {
    return results.map(function (r, i) { return (i + 1) + '. ' + r.theme + ': ' + (r.solved ? 'OK' : 'falsch') + ' (gespielt: ' + r.played + ')'; }).join(' | ');
  }
  function finishRally() {
    stopTimer(); $quiz.hidden = true; $end.hidden = false;
    $('lpr-final-score').textContent = score + ' / ' + puzzles.length;
    $('lpr-detail').innerHTML = results.map(function (r) {
      return '<li>' + r.theme + ': <b class="' + (r.solved ? 'rally-good' : 'rally-badtxt') + '">' + (r.solved ? 'richtig' : 'falsch') + '</b></li>';
    }).join('');
  }
  function hmacSha256Short(secret, message) {
    var enc = new TextEncoder();
    return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
      .then(function (key) { return crypto.subtle.sign('HMAC', key, enc.encode(message)); })
      .then(function (sig) { return Array.from(new Uint8Array(sig)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('').substring(0, 16); });
  }
  function submitResult() {
    var now = new Date();
    var datum = now.toLocaleDateString('de-DE') + ' ' + now.toLocaleTimeString('de-DE');
    var rawDetails = buildDetails(), pointsStr = score + ' / ' + puzzles.length;
    var payload = playerName + '|' + pointsStr + '|' + rawDetails + '|' + datum;
    var out = $('lpr-submit-msg');
    hmacSha256Short(SIGNATURE_SECRET, payload).then(function (sig) {
      var details = rawDetails + ' | [Pruefsumme: ' + sig + ']';
      if (!MS_FORMS_TEMPLATE) {
        out.hidden = false;
        out.innerHTML = '<b>Ergebnis</b> (noch kein Formular eingerichtet):<br>' + playerName + ' – ' + pointsStr + ' – ' + datum;
        return;
      }
      var url = MS_FORMS_TEMPLATE.replace('NAME_HIER', encodeURIComponent(playerName)).replace('PUNKTE_HIER', encodeURIComponent(pointsStr))
        .replace('DETAILS_HIER', encodeURIComponent(details)).replace('DATUM_HIER', encodeURIComponent(datum));
      window.open(url, '_blank', 'noopener');
    }).catch(function (err) {
      out.hidden = false; out.textContent = 'Fehler beim Erzeugen der Prüfsumme: ' + (err && err.message ? err.message : err);
    });
  }
  function showMsg(text, kind) { $err.className = 'rally-msg rally-' + (kind || 'bad'); $err.innerHTML = text; $err.hidden = false; }
  function generateCode() { return CODE_WORDS[Math.floor(Math.random() * CODE_WORDS.length)] + (Math.floor(Math.random() * 90) + 10); }

  function setActivePool(pool, name) {
    ACTIVE_POOL = pool; ACTIVE_POOL_NAME = name;
    try { localStorage.setItem(LS_POOL, JSON.stringify(pool)); localStorage.setItem(LS_POOL_NAME, name); } catch (e) {}
    $('lpr-pool-badge').innerHTML = 'Aktiver Rätsel-Pool: <b>' + name + '</b>';
  }
  function loadPool(themeKey, ratingRange, diffWord, opts) {
    opts = opts || {};
    if (!opts.silent) showMsg('Lade Rätsel-Pool <b>' + (THEME_LABEL[themeKey] || themeKey) + '</b> …', 'info');
    var s = document.createElement('script');
    s.src = POOL_BASE + themeKey + '.js';
    s.onload = function () {
      var raw = (window.LICHESS_POOLS || {})[themeKey] || [];
      var filtered = ratingRange ? raw.filter(function (p) { return p.rating >= ratingRange[0] && p.rating < ratingRange[1]; }) : raw;
      if (!filtered.length) { if (!opts.silent) showMsg('In diesem Bereich wurden keine Rätsel gefunden.', 'bad'); return; }
      var normalized = filtered.map(function (p) { return { fen: p.fen, solution: p.solution, theme: THEME_LABEL[themeKey] || themeKey }; });
      var label = (THEME_LABEL[themeKey] || themeKey) + (diffWord ? ' (' + diffWord.charAt(0).toUpperCase() + diffWord.slice(1) + ')' : ' (gemischt)');
      setActivePool(normalized, label);
      if (!opts.silent) showMsg('<b>Pool aktualisiert:</b> ' + label + ' – ' + normalized.length + ' Rätsel verfügbar.', 'ok');
    };
    s.onerror = function () { if (!opts.silent) showMsg('Der Rätsel-Pool konnte nicht geladen werden.', 'bad'); };
    document.head.appendChild(s);
  }
  function handleTeacherCommands(name) {
    var n = name.toLowerCase();
    if (n === 'lehrer') {
      var newCode = generateCode(); ACTIVE_UNLOCK_CODE = newCode;
      try { localStorage.setItem(LS_CODE, newCode); } catch (e) {}
      $('lpr-code').value = newCode; $('lpr-name').value = '';
      showMsg('<b>Neuer Freischaltcode:</b> ' + newCode + '<br><span class="small">Gespeichert. Sag diesen Code der Klasse.</span>', 'ok');
      return true;
    }
    var poolMap = {
      'update leicht': { pool: POOL_LEICHT, label: 'Leicht (eingebaut)' },
      'update mittel': { pool: POOL_MITTEL, label: 'Mittel (eingebaut)' },
      'update schwer': { pool: POOL_SCHWER, label: 'Schwer (eingebaut)' }
    };
    if (poolMap[n]) {
      setActivePool(poolMap[n].pool, poolMap[n].label); $('lpr-name').value = '';
      showMsg('<b>Pool aktualisiert:</b> ' + poolMap[n].label + ' (' + poolMap[n].pool.length + ' Stellungen).', 'ok');
      return true;
    }
    if (n.indexOf('update ') === 0) {
      var rest = n.substring(7).trim().split(/\s+/), themeKey = THEME_MAP[rest[0] || ''];
      if (!themeKey) { showMsg('Unbekanntes Thema „' + (rest[0] || '') + '“. Bekannte Themen: ' + Object.keys(THEME_MAP).join(', '), 'bad'); return true; }
      loadPool(themeKey, DIFFICULTY_RANGE[rest[1] || ''] || null, rest[1] || '');
      $('lpr-name').value = '';
      return true;
    }
    return false;
  }
  function applyUrlParams() {
    var params = new URLSearchParams(location.search);
    var pool = (params.get('pool') || '').toLowerCase(), level = (params.get('level') || '').toLowerCase();
    if (!pool) return;
    var themeKey = THEME_MAP[pool]; if (!themeKey) return;
    loadPool(themeKey, level ? DIFFICULTY_RANGE[level] : null, level, { silent: true });
  }
  function startRally() {
    var name = $('lpr-name').value.trim(), code = $('lpr-code').value.trim();
    if (handleTeacherCommands(name)) return;
    if (!name) { showMsg('Bitte gib deinen Namen ein.', 'bad'); return; }
    if (code.toUpperCase() !== ACTIVE_UNLOCK_CODE.toUpperCase()) { showMsg('Falscher Freischaltcode. Frag deine Lehrerin oder deinen Lehrer.', 'bad'); return; }
    $err.hidden = true; playerName = name;
    var validPool = ACTIVE_POOL.filter(function (p) {
      try {
        var probe = new Chess(); if (!probe.load(p.fen)) return false;
        var sol = p.solution;
        return !!probe.move({ from: sol.substring(0, 2), to: sol.substring(2, 4), promotion: sol.length > 4 ? sol.substring(4, 5) : 'q' });
      } catch (e) { return false; }
    });
    puzzles = shuffle(validPool).slice(0, Math.min(PUZZLES_PER_RALLY, validPool.length));
    if (!puzzles.length) { showMsg('Kein gültiges Rätsel im aktiven Pool. Bitte die Lehrkraft informieren.', 'bad'); return; }
    current = 0; score = 0; results = [];
    $start.hidden = true; $quiz.hidden = false; loadPuzzle(0);
    $quiz.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function restart() { $end.hidden = true; $start.hidden = false; $('lpr-submit-msg').hidden = true; }

  document.addEventListener('DOMContentLoaded', function () {
    $start = $('lpr-start'); $quiz = $('lpr-quiz'); $end = $('lpr-end'); $status = $('lpr-status');
    $counter = $('lpr-counter'); $timer = $('lpr-timer'); $score = $('lpr-score'); $err = $('lpr-start-error');
    if (!$start) return;
    $('lpr-pool-badge').innerHTML = 'Aktiver Rätsel-Pool: <b>' + ACTIVE_POOL_NAME + '</b>';
    $('lpr-start-btn').addEventListener('click', startRally);
    $('lpr-submit-btn').addEventListener('click', submitResult);
    $('lpr-again-btn').addEventListener('click', restart);
    $('lpr-code').addEventListener('keydown', function (e) { if (e.key === 'Enter') startRally(); });
    window.addEventListener('resize', function () { if (board) board.resize(); });
    applyUrlParams();
  });
})();
