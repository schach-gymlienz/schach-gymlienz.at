/* Endspieltafeln für endspiele.html berechnen (Rückwärtsanalyse, „Matt in N“).
   Aufruf im Hauptordner:  node tools/endspieltafeln.js
   Erzeugt assets/endspiele/kqk.bin, krk.bin, krrk.bin.

   Inhalt je Datei: für jede Stellung mit WEISS am Zug die Zahl der Züge bis Matt bei bestem
   Spiel beider Seiten (0 = kein Gewinn oder ungültige Stellung). Wie bei Gaviota zählt ein
   Schlagen durch Schwarz mit: schlägt der König in K+T+T gegen K einen Turm, geht es in
   K+T gegen K weiter.
   Gespeichert wird nur ein Achtel: der weiße König steht im Dreieck a1–d1–d4 (10 Felder),
   alle anderen Stellungen ergeben sich durch Spiegeln. K+T+T: die beiden Türme sind
   gleichwertig, gespeichert wird nur das Paar (2016 Möglichkeiten) und je Byte zwei Werte. */
"use strict";
const fs = require("fs");
const path = require("path");

const KZ = [], TURM = [[1, 0], [-1, 0], [0, 1], [0, -1]], DAME = TURM.concat([[1, 1], [1, -1], [-1, 1], [-1, -1]]);
for (let s = 0; s < 64; s++) {
  KZ[s] = [];
  for (const [df, dr] of DAME) { const f = (s & 7) + df, r = (s >> 3) + dr; if (f >= 0 && f < 8 && r >= 0 && r < 8) KZ[s].push(f + 8 * r); }
}
const abst = (a, b) => Math.max(Math.abs((a & 7) - (b & 7)), Math.abs((a >> 3) - (b >> 3)));

function loese(name, typen, unter) {
  const k = typen.length, n = k + 2, groesse = 64 ** n;
  const W = new Uint8Array(groesse), B = new Uint8Array(groesse);   // Halbzüge bis Matt + 1, 0 = offen
  const ok = new Uint8Array(groesse);                               // 1 = gültig mit Weiß am Zug, 2 = mit Schwarz am Zug, 3 = beides
  const sq = new Int32Array(n);
  const dekod = (i) => { for (let j = n - 1; j >= 0; j--) { sq[j] = i & 63; i >>= 6; } };   // Reihenfolge: wk, Figuren …, bk
  const index = (a) => { let i = 0; for (let j = 0; j < n; j++) i = i * 64 + a[j]; return i; };
  const besetzt = (t, ohne1, ohne2) => { for (let j = 0; j < n; j++) if (j !== ohne1 && j !== ohne2 && sq[j] === t) return true; return false; };

  // greift Weiß das Feld t an? (bk zählt nicht als Hindernis, ohneFig = geschlagene Figur)
  function angegriffen(t, ohneFig) {
    if (abst(sq[0], t) <= 1) return true;
    for (let j = 1; j <= k; j++) {
      if (j === ohneFig) continue;
      const s = sq[j], richt = typen[j - 1] === "Q" ? DAME : TURM;
      for (const [df, dr] of richt) {
        let f = (s & 7) + df, r = (s >> 3) + dr;
        while (f >= 0 && f < 8 && r >= 0 && r < 8) {
          const u = f + 8 * r;
          if (u === t) return true;
          if (besetzt(u, n - 1, ohneFig)) break;
          f += df; r += dr;
        }
      }
    }
    return false;
  }
  // Züge des schwarzen Königs: [Zielindex in W] oder {schlag: j, sub: Index in der Untertafel}
  function schwarzZuege() {
    const z = [], bk = sq[n - 1];
    for (const t of KZ[bk]) {
      if (abst(t, sq[0]) <= 1) continue;
      let schlag = -1;
      for (let j = 1; j <= k; j++) if (sq[j] === t) schlag = j;
      if (angegriffen(t, schlag)) continue;
      if (schlag < 0) { const a = Array.from(sq); a[n - 1] = t; z.push({ w: index(a) }); }
      else { const a = Array.from(sq).filter((_, j) => j !== schlag); a[a.length - 1] = t; z.push({ schlag, a }); }
    }
    return z;
  }
  function weissZuege() {
    const z = [], bk = sq[n - 1];
    for (const t of KZ[sq[0]]) {
      if (abst(t, bk) <= 1 || besetzt(t, -1, -1)) continue;
      const a = Array.from(sq); a[0] = t; z.push(index(a));
    }
    for (let j = 1; j <= k; j++) {
      const s = sq[j], richt = typen[j - 1] === "Q" ? DAME : TURM;
      for (const [df, dr] of richt) {
        let f = (s & 7) + df, r = (s >> 3) + dr;
        while (f >= 0 && f < 8 && r >= 0 && r < 8) {
          const u = f + 8 * r;
          if (besetzt(u, -1, -1)) break;
          const a = Array.from(sq); a[j] = u; z.push(index(a));
          f += df; r += dr;
        }
      }
    }
    return z;
  }

  // gültige Stellungen markieren, Matt- und Pattstellungen finden
  let matt = 0;
  for (let i = 0; i < groesse; i++) {
    dekod(i);
    let doppelt = false;
    for (let a = 0; a < n && !doppelt; a++) for (let b = a + 1; b < n; b++) if (sq[a] === sq[b]) { doppelt = true; break; }
    if (doppelt || abst(sq[0], sq[n - 1]) <= 1) continue;
    const schach = angegriffen(sq[n - 1], -1);
    if (!schach) ok[i] |= 1;
    ok[i] |= 2;
    if (schwarzZuege().length === 0 && schach) { B[i] = 1; matt++; }
  }
  // Untertafel nach einem Schlagen: Halbzüge (Weiß am Zug) oder -1 = kein Gewinn
  const unterWert = (a) => { if (!unter) return -1; const v = unter.W[unter.index(a)]; return v ? v - 1 : -1; };
  const maxUnter = unter ? unter.maxPly : 0;

  let ply = 0, maxPly = 0;
  for (let it = 1; ; it++) {
    let neu = 0;
    // Weiß am Zug: Matt in 2·it − 1 Halbzügen, wenn ein Zug in eine Stellung „Schwarz wird in 2·it − 2 matt“ führt
    const zielB = 2 * it - 2 + 1;
    for (let i = 0; i < groesse; i++) {
      if (!(ok[i] & 1) || W[i]) continue;
      dekod(i);
      for (const z of weissZuege()) if (B[z] === zielB) { W[i] = 2 * it; neu++; maxPly = 2 * it - 1; break; }
    }
    // Schwarz am Zug: wird in 2·it Halbzügen matt, wenn ALLE Züge verlieren und der längste 2·it − 1 dauert
    for (let i = 0; i < groesse; i++) {
      if (!(ok[i] & 2) || B[i]) continue;
      dekod(i);
      const z = schwarzZuege();
      if (z.length === 0) continue;          // Patt
      let alle = true, m = -1;
      for (const x of z) {
        const v = x.w !== undefined ? (W[x.w] ? W[x.w] - 1 : -1) : unterWert(x.a);
        if (v < 0) { alle = false; break; }
        if (v > m) m = v;
      }
      if (alle && m === 2 * it - 1) { B[i] = 2 * it + 1; neu++; }
    }
    console.log(name + ": Durchgang " + it + ", neu " + neu);
    if (neu === 0 && 2 * it - 1 > maxUnter) break;
  }
  console.log(name + ": " + matt + " Mattstellungen, längstes Matt " + (maxPly + 1) / 2 + " Züge");
  return { name, typen, W, index, maxPly };
}

/* ---------- Ausgabe mit Symmetrie ---------- */
const DREIECK = [];   // weißer König: Linie a–d, Reihe ≤ Linie
for (let f = 0; f < 4; f++) for (let r = 0; r <= f; r++) DREIECK.push(f + 8 * r);
function kanon(feld) { // gibt die Spiegelung zurück, die den weißen König ins Dreieck bringt
  let f = feld & 7, r = feld >> 3;
  const ff = f > 3, fr = r > 3; if (ff) f = 7 - f; if (fr) r = 7 - r;
  const tr = r > f;
  return (s) => { let a = s & 7, b = s >> 3; if (ff) a = 7 - a; if (fr) b = 7 - b; if (tr) { const x = a; a = b; b = x; } return a + 8 * b; };
}
const paar = (a, b) => { if (a > b) { const x = a; a = b; b = x; } return b * (b - 1) / 2 + a; };

function schreibe(t, datei) {
  const k = t.typen.length;
  const zweiTuerme = k === 2;
  const proKoenig = zweiTuerme ? 2016 * 64 : 64 * 64;
  const werte = new Uint8Array(10 * proKoenig);
  const a = new Array(k + 2);
  for (let i = 0; i < t.W.length; i++) {
    const v = t.W[i]; if (!v) continue;
    let x = i; for (let j = k + 1; j >= 0; j--) { a[j] = x & 63; x >>= 6; }
    const wk = DREIECK.indexOf(a[0]); if (wk < 0) continue;
    if (kanon(a[0])(a[0]) !== a[0]) continue;
    const zuege = v / 2;   // Halbzüge 2n−1, gespeichert 2n
    const pos = zweiTuerme ? (wk * 2016 + paar(a[1], a[2])) * 64 + a[3] : (wk * 64 + a[1]) * 64 + a[2];
    werte[pos] = zuege;   // bei zwei Türmen beide Reihenfolgen gleich, Diagonal-König: Werte gleich
  }
  let buf;
  if (zweiTuerme) {   // zwei Werte je Byte (max. 15)
    buf = Buffer.alloc(werte.length / 2);
    for (let i = 0; i < buf.length; i++) buf[i] = werte[2 * i] | (werte[2 * i + 1] << 4);
  } else buf = Buffer.from(werte);
  fs.writeFileSync(datei, buf);
  console.log(datei + ": " + buf.length + " Bytes");
}

const ziel = path.join(__dirname, "..", "assets", "endspiele");
fs.mkdirSync(ziel, { recursive: true });
const kqk = loese("KDK", ["Q"], null);
schreibe(kqk, path.join(ziel, "kqk.bin"));
const krk = loese("KTK", ["R"], null);
schreibe(krk, path.join(ziel, "krk.bin"));
const krrk = loese("KTTK", ["R", "R"], krk);
schreibe(krrk, path.join(ziel, "krrk.bin"));
