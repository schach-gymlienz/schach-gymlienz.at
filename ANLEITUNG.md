# Anleitung: Homepage des Schachteams Gymnasium Lienz

Diese Anleitung gilt für alle, die an **schach-gymlienz.at** mitarbeiten, egal ob Mensch oder KI (Claude).
**Bitte vor jeder Änderung lesen.** So bleibt die Seite einheitlich, auch wenn mehrere Personen daran bauen.

Verantwortlich: Prof. Mag. Christopher Stadler, RS, und Prof. Mag. Hannes Amon · Kontakt: info@schach-gymlienz.at

---

## 1. Aufbau

Die Seite ist eine **statische Website**: reines HTML, CSS und etwas JavaScript, ohne Baukasten, Datenbank oder Build-Schritt.
GitHub Pages veröffentlicht automatisch, was im Branch `main` liegt.

```
index.html                 Startseite
jahresmeisterschaft.html   Gesamtwertung, Klassenwertung, Kreuztabellen
impressum.html             Offenlegung § 25 MedienG
datenschutz.html           Datenschutzerklärung
404.html                   Fehlerseite (nutzt absolute Pfade mit "/")
CNAME                      Domain für GitHub Pages (schach-gymlienz.at)
assets/css/style.css       EIN Stylesheet für alle Seiten
assets/js/jahresmeisterschaft.js   berechnet alle Ranglisten aus den Daten
assets/fonts/              Schrift Inter (lokal, keine Google Fonts!)
assets/img/                Logos, Vorschaubilder
assets/video/              Reels (komprimiert, max. ca. 5 MB pro Datei)
archiv.html / bericht.html   Turnierarchiv (Übersicht mit Filter) und Einzelbericht
data/jahresmeisterschaft-2026-27.json   alle Ergebnisse der Jahresmeisterschaft
data/archiv.json           alle Turnierberichte (Text, Bilder, Kategorie) seit 2017/18
assets/archiv/<schuljahr>/ Fotos und PDFs der Berichte, assets/archiv/vorschau/ Vorschaubilder
tools/import_termin.py     wandelt Swiss-Manager-Exporte in die JSON-Daten um
```

**Kopf- und Fußzeile** stehen in jeder HTML-Datei gleich (markiert mit `<!-- KOPFZEILE -->` und `<!-- FUSSZEILE -->`).
Wer dort etwas ändert (z. B. einen Menüpunkt), ändert es **in allen HTML-Dateien**.

## 2. Häufige Aufgaben

### Neuer Termin der Jahresmeisterschaft
1. Aus Swiss-Manager exportieren: „Tabelle nach Wertung“ und „Kategoriepreise“, beide als `.xlsx`.
2. Im Hauptordner ausführen:
   `python3 tools/import_termin.py Wertung.xlsx Kategoriepreise.xlsx TT.MM.JJJJ`
3. Die geänderte Datei `data/jahresmeisterschaft-2026-27.json` hochladen (committen).
4. **Fertig.** Startseite, Gesamtwertung, Klassenwertung und die neue Kreuztabelle aktualisieren sich von selbst.
   Am JavaScript und am HTML muss nichts geändert werden.

Wertungsregeln (sind im Skript umgesetzt, bei Regeländerung dort anpassen):
- Wertungspunkte je Termin nach Platz: 10, 9, 8, 7×2, 6×3, 5×4, 4×5, 3×6, 2×7, 1×8 …; nicht anwesend = 0.
- Jahresreihung: Wertungspunkte → Partiepunkte → Buchholz-Summe → direkte Begegnung.
- **Buchholz wird nicht öffentlich angezeigt** (nur intern für die Reihung).
- Wer noch nie gespielt hat, erscheint nicht.

### Termine auf der Startseite
In `index.html` den Block `<!-- TERMINE -->` bearbeiten. Ein Eintrag sieht so aus:
```html
<li><div class="day"><small>Nov</small>17</div><div><strong>Jahresmeisterschaft, Termin 3</strong><div class="muted small">Dienstag, 13:45 · Vortragssaal</div></div></li>
```
Vergangene Termine wieder herausnehmen. `class="day gold"` hebt einen Eintrag gelb hervor (z. B. für Turniere).

### Neues Reel / Video
- Vor dem Hochladen komprimieren, Ziel: **unter 5 MB**, Breite 720 px (GitHub erlaubt max. 100 MB pro Datei, die Seite soll aber schnell laden).
- Dateiname: `reel-<anlass>-<schuljahr>-<nr>.mp4`, z. B. `reel-jm-2026-27-termin2.mp4`, dazu ein Vorschaubild `.jpg` mit gleichem Namen in `assets/img/`.
- Im HTML `<video ... preload="none" poster="...">` verwenden (lädt erst beim Abspielen).

### Neuer Turnierbericht
1. Fotos verkleinern (max. 1400 px breit, JPEG) und nach `assets/archiv/<schuljahr>/<kurzname>-01.jpg` usw. legen; ein Vorschaubild (560 px) nach `assets/archiv/vorschau/<schuljahr>_<kurzname>.jpg`.
2. In `data/archiv.json` **ganz oben** in `berichte` einen Eintrag ergänzen:
```json
{ "id": "2026-27/weihnachtsturnier", "jahr": "2026/27", "titel": "26. Osttiroler Weihnachtsschachturnier",
  "kategorie": "Weihnachtsturnier", "vorschau": "assets/archiv/vorschau/2026-27_weihnachtsturnier.jpg",
  "auszug": "Kurzer Satz für die Übersicht …", "bilder": 3,
  "bloecke": [
    { "t": "p", "x": ["Erster Absatz …", "Zweiter Absatz …"] },
    { "t": "h", "x": "Zwischenüberschrift" },
    { "t": "img", "i": [{ "src": "assets/archiv/2026-27/weihnachtsturnier-01.jpg", "alt": "Bildbeschreibung" }], "c": "Bildunterschrift" },
    { "t": "ti", "x": ["Text neben einem Bild …"], "i": [{ "src": "…", "alt": "…" }] },
    { "t": "gal", "i": [{ "src": "…", "alt": "…" }, { "src": "…", "alt": "…" }] }
  ] }
```
   Kategorien: `Schulturniere`, `Weihnachtsturnier`, `Osttirol`, `Alpen-Adria`, `Landesfinale`, `Bundesfinale`.
3. Optional auf der Startseite im Abschnitt `id="turniere"` eine Karte mit Link `bericht.html?b=<id>` ergänzen.

Das Archiv wurde im Oktober 2026 automatisch von der alten Jimdo-Seite übernommen (76 Berichte, rund 640 Fotos). Kleinere Formatierungsfehler aus der Übernahme bitte einfach in `data/archiv.json` korrigieren.

## 3. Stil (bitte einhalten)

**Farben** (aus dem Schachteam-Logo, definiert als Variablen in `style.css`, nie neue Farben direkt ins HTML schreiben):

| Variable | Farbe | Verwendung |
|---|---|---|
| `--navy` | #1B2A4A | Hauptfarbe: Kopfbereich, Tabellenköpfe, Knöpfe |
| `--navy-deep` | #121A2E | Fußzeile, dunkle Kästen |
| `--red` | #C1272D | Akzente: Abzeichen, Rubrik-Titel, Linie über der Fußzeile |
| `--gold` | #F2C14E | Hauptknöpfe, Platz 1 |
| `--green` | #3FA34D | nur sparsam: Raute, Siege in der Kreuztabelle |

**Schrift:** Inter (Fließtext) und Inter Display ExtraBold (Überschriften), lokal eingebunden.
**Keine externen Schriften, Skripte oder Einbettungen** (Google Fonts, YouTube, Analytics …) – sonst muss die Datenschutzerklärung angepasst werden.

**Bausteine** (CSS-Klassen, wiederverwenden statt neu erfinden):
`card`, `card-dark`, `btn btn-gold`, `btn btn-navy`, `btn btn-soft`, `pill pill-red`, `pill pill-gold`, `kicker`, `rule`, `section`, `section-head`, `row` + `grow`/`side`, `table.ranking`.

**Texte:** Du-Form gegenüber Schüler:innen, sachlich und freundlich. Gendern mit Doppelpunkt (Schüler:innen).
Lehrkräfte als „Prof. Nachname“ bzw. im Impressum mit vollem Titel.

**Logos:** nur die Dateien aus `assets/img/` verwenden und nie verzerren – im CSS nur die Breite festlegen, die Höhe bleibt `auto`. Im HTML `width`/`height` im echten Seitenverhältnis angeben (Schachteam 720×679, Schachtraining 720×645, Emblem 224×216).

**Barrierefreiheit:** Jedes Bild braucht ein sinnvolles `alt` (reine Deko: `alt=""`). Echte `<a>`/`<button>` verwenden. Seiten müssen am Handy (390 px Breite) ohne seitliches Scrollen funktionieren – breite Tabellen kommen in `<div class="table-box">`.

## 4. Datenschutz-Regeln

- Für Schüler:innen **unserer Schule** liegt die Einwilligung der Eltern vor: volle Namen, Fotos und Videos sind erlaubt.
- **Gäste anderer Schulen / Volksschulkinder:** nur mit eigener Zustimmung der Eltern, sonst nur Vorname + Initial.
- **Widerruf:** Kommt ein Widerruf an info@, Namen/Fotos **sofort** entfernen (auch aus `data/…json` und alten Berichten).
- Keine Geburtsdaten, Adressen, Telefonnummern von Schüler:innen veröffentlichen.

## 5. Offene Punkte (Stand Oktober 2026)

- [x] Impressum vollständig.
- [x] Link zur Schulhomepage in der Fußzeile.
- [ ] Rätsel-Rallye von der alten Jimdo-Seite übernehmen (Ergebnisse sollen gespeichert werden).
- [x] Archiv 2017/18 – 2025/26 von gym-schach.jimdofree.com übertragen (Berichte + Fotos).
- [ ] Archiv-Texte stichprobenartig gegenlesen (Formatierung aus der Übernahme).
- [ ] Ehrentafel der Jahresmeister:innen (Endstände liegen im Archiv nur als Bilder vor).
- [ ] Teilnehmer:innen-Seite des aktuellen Schuljahres.

## 6. Für Claude (KI-Assistent)

- Vor Änderungen den aktuellen Stand holen (`git pull`), danach mit aussagekräftiger Nachricht committen.
- Nur das ändern, worum gebeten wurde; Stil und Bausteine aus Abschnitt 3 verwenden.
- Nach Änderungen die betroffenen Seiten im Browser prüfen (Desktop **und** 390 px Handybreite, keine Konsolenfehler).
- Ranglisten nie von Hand ins HTML schreiben – immer über die JSON-Daten.
- Keine externen Dienste einbinden, ohne auf die Datenschutzerklärung hinzuweisen.
- Abschnitt 5 (Offene Punkte) aktuell halten.
