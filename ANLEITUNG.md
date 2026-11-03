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
taktik.html                Schach-Rätsel-Rallye
ueber-uns.html             Chronik seit 1978/79, Erfolge bei Landes-/Bundesfinali, Anmeldung, Unterlagen
assets/unterlagen/         PDF-Vorlagen für Turniere (Partieformular, Kreuztabellen, Meldungen)
data/ehrentafel.json       Jahresmeister:innen (Ehrentafel auf Jahresmeisterschaft und Archiv)
termine.html               Termine des Schuljahres + Kalender-Download (Daten: data/termine.json; Startseite zeigt die nächsten 3)
training.html              Rätsel der Woche (data/raetsel.json), Lernen nach Stufen, Partien zum Nachspielen (data/partien.json)
faq.html                   Fragen & Antworten für Schüler:innen und Eltern, Kontakt (Menüpunkt „Kontakt“)
weihnachtsturnier.html     Ausschreibung des aktuellen Weihnachtsturniers (PDF und Plakat in assets/turniere/)
teilnehmer.html            Teilnehmer:innen der Schachgruppen seit 2017/18 (Daten: data/teilnehmer.json, Fotos: assets/teilnehmer/<schuljahr>/)
assets/js/rallye.js        Rallye-Logik, Konfiguration ganz oben (Freischaltcode, MS-Forms-Link)
assets/rallye/             Schachbrett-Bibliotheken, Figuren, Rätsel-Pools (alles lokal)
tools/import_termin.py     wandelt Swiss-Manager-Exporte in die JSON-Daten um
schachmatt.html            Matt in 1 für Anfänger:innen: 11 Kategorien × 30 Aufgaben (data/schachmatt.json), 3 Stufen je Kategorie
assets/js/schachmatt.js    Freispielen: nächste Kategorie nach den ersten 10 der vorigen; Lehrkräfte: schachmatt.html?alle schaltet alles frei
endspiele.html             Grundmatts üben (Treppenmatt, Dame, Turm): Video + Spiel gegen den König, alle sofort spielbar
assets/js/endspiele.js     Endspiel-Logik, Themen ganz oben (THEMEN)
kombinationen.html         Taktik (Fortgeschrittene), Menü Training: Kombinationen aus Turnierpartien (data/kombinationen.json), aufgebaut wie Schachmatt
assets/js/kombinationen.js Zugfolgen (eigener Zug, Antwort, eigener Zug …), Freispielen und Fortschritt wie Schachmatt; kombinationen.html?alle schaltet alles frei
assets/js/fortschritt.js   gemeinsamer Fortschritt von Schachmatt, Endspielen und Taktik (Browser), Sichern/Laden als eine Datei
assets/endspiele/*.bin     Endspieltafeln „Matt in N“, erzeugt mit `node tools/endspieltafeln.js`
assets/video/endspiele/    Erklärvideos zu den Endspielen (+ Vorschaubild .jpg)
assets/js/menue.js         aufklappbares Menü „Training“ in der Kopfzeile
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

### Erfolge bei Landes-/Bundesfinali ergänzen
In `ueber-uns.html` im Abschnitt `id="erfolge"` oben ein neues `timeline-year` einfügen (Aufbau wie die bestehenden, mit Link auf den Archivbericht).

### Ehrentafel ergänzen (am Schuljahresende)
In `data/ehrentafel.json` **oben** in `jahre` einen Eintrag mit Schuljahr, Plätzen 1–3 und Punkten ergänzen, optional `"bericht"` (Archiv-ID). `"vorlaeufig": true` zeigt „vorläufig“ an, solange der Endstand nicht bestätigt ist.

### Termin eintragen
In `data/termine.json` einen Eintrag ergänzen: `datum` (JJJJ-MM-TT), optional `bis`, `zeit`, `ort`, `info`, `link`/`linktext`, `ebene` (schule, osttirol, land, bund). Noch kein Datum? `"datum": null, "wann": "Termin folgt"`. Die Reihenfolge ist egal, sortiert wird automatisch; vergangene Termine erscheinen unter „Bereits gespielt“. Startseite und Kalender-Download aktualisieren sich von selbst.

### Rätsel der Woche
`data/raetsel.json` enthält einen Vorrat bis Juli 2027 (jeden Montag automatisch ein neues, aus der freien Lichess-Rätseldatenbank). Eigene Rätsel: Eintrag mit `ab` (Montag), `thema`, `fen` (Stellung, Seite am Zug = Lösende), `loesung` (z. B. `e2e4`), `san` (z. B. `Dxf7#` in englischer Notation `Qxf7#`) und `text` ersetzen.

### Partie zum Nachspielen ergänzen
In `data/partien.json` oben einen Eintrag mit `titel`, `weiss`, `schwarz`, `jahr`, `ort`, `kommentar` und `pgn` (Züge mit englischen Figurenbuchstaben K, Q, R, B, N) einfügen. Ideal: besondere Partien unserer Teams vom Landes- oder Bundesfinale.

### Weihnachtsturnier / Hinweis-Kasten auf der Startseite
Der Kasten `id="weihnachtsturnier"` in `index.html` wirbt für das Turnier. Nach dem Turnier entfernen (oder auf den neuen Bericht verlinken) und `weihnachtsturnier.html` fürs nächste Jahr anpassen.

### Zahlen & Rekorde
Stehen in `ueber-uns.html` (Abschnitt `id="rekorde"`) und werden am Schuljahresende von Hand nachgezählt.

### Teilnehmer:innen des neuen Schuljahres eintragen
In `data/teilnehmer.json` **oben** in `jahre` einen Eintrag ergänzen (Aufbau wie die bestehenden): `jahr`, optional `text`, und `gruppen` mit `titel` (z. B. „Anfänger:innen“), optional `leitung`, `zeit`, `namen` (`{ "n": "Nachname Vorname", "k": "1c" }`, alphabetisch) und `fotos` (`{ "src": "assets/teilnehmer/2026-27/01.jpg", "alt": "Name" }`). Fotos max. 1400 px, JPEG. Fehlt eine Liste: `"hinweis": "Liste fehlt"`. Das neueste Schuljahr wird automatisch zuerst angezeigt.

### Kombinationen (Taktik für Fortgeschrittene)
`data/kombinationen.json`: `kategorien` mit `id`, `titel`, `unter`, `tipp`, `aufgaben` (genau 30: Aufgaben 1–10 = Leicht, 11–20 = Mittel, 21–30 = Schwer).
Eine Aufgabe: `fen` (Seite am Zug = Lösende), `zuege` (UCI, abwechselnd eigener Zug und Antwort, endet mit dem eigenen Schlusszug), `taktik` (z. B. „Gabel“), optional `erklaerung`, `partie`, `jahr`.
Kategorie 1 „Vorbereiten und zuschlagen“ stammt aus der Mega Database 2026 (ChessBase); jede Lösung ist mit Stockfish geprüft (der geforderte Zug ist jeweils klar der beste). Neue Kategorien bitte genauso prüfen.

### Rätsel-Rallye
- Ursprünglich von Prof. Amon für die alte Seite entwickelt; jetzt läuft alles lokal (keine CDNs).
- Lehrkräfte geben statt eines Namens Kommandos ein: `Lehrer` (neuer Freischaltcode), `Update Gabel Mittel` usw. Die Einstellung gilt nur im jeweiligen Browser.
- Direktlink für eine Stunde: `taktik.html?pool=gabel&level=mittel`.
- Ergebnisse gehen über ein vorausgefülltes **Microsoft-Forms-Formular der Schule** an die Lehrkräfte (Link in `MS_FORMS_TEMPLATE`).
- Rätsel-Pools: `assets/rallye/pools/<thema>.js` (je 500 Lichess-Rätsel, CC0).
- Achtung: Freischaltcode und Prüfsummen-Geheimnis stehen im öffentlichen Quelltext – sie verhindern nur zufällige, keine gezielten Manipulationen.

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
**Keine externen Schriften, Skripte oder Einbettungen** (Google Fonts, YouTube, Analytics, CDNs …) – sonst muss die Datenschutzerklärung angepasst werden. Einzige Ausnahme: das Microsoft-Forms-Formular der Rallye, das sich erst beim Abgeben öffnet.

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
- [x] Rätsel-Rallye übernommen (Ergebnisse über Microsoft Forms der Schule).
- [x] Archiv 2017/18 – 2025/26 von gym-schach.jimdofree.com übertragen (Berichte + Fotos).
- [ ] Archiv-Texte stichprobenartig gegenlesen (Formatierung aus der Übernahme).
- [x] Ehrentafel der Jahresmeister:innen ab 2021/22.
- [x] Chronik, Erfolgsliste, Unterlagen und Bericht Bundesfinale Mädchen 2026 übernommen.
- [x] Teilnehmer:innen-Listen 2017/18–2025/26 von der alten Seite übernommen (Einverständnis zu Namen und Fotos liegt laut Schule vor).
- [ ] Teilnehmer:innen 2026/27 in `data/teilnehmer.json` eintragen.
- [ ] Termine Bezirksfinale und Landesfinale 2026/27 in `data/termine.json` eintragen.
- [ ] Hinweis-Kasten Weihnachtsturnier nach dem 21.12.2026 von der Startseite nehmen.
- [ ] Eigene Partien (Landes-/Bundesfinale) in `data/partien.json` ergänzen.
- [ ] Anfänger:innen-Listen 2022/23–2024/25 fehlen (schon auf der alten Seite).

## 6. Für Claude (KI-Assistent)

- Vor Änderungen den aktuellen Stand holen (`git pull`), danach mit aussagekräftiger Nachricht committen.
- Nur das ändern, worum gebeten wurde; Stil und Bausteine aus Abschnitt 3 verwenden.
- Nach Änderungen die betroffenen Seiten im Browser prüfen (Desktop **und** 390 px Handybreite, keine Konsolenfehler).
- Ranglisten nie von Hand ins HTML schreiben – immer über die JSON-Daten.
- Keine externen Dienste einbinden, ohne auf die Datenschutzerklärung hinzuweisen.
- Abschnitt 5 (Offene Punkte) aktuell halten.
