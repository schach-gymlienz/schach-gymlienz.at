/* Online-Anmeldung für Turniere (seit 23.11.2026).
   Schickt die Angaben an den Anmelde-Empfänger auf amon-online.de (siehe Datenschutzerklärung).
   Ist der Server nicht erreichbar, bietet das Formular stattdessen eine fertig ausgefüllte Mail an info@ an.
   Einstellungen stehen als data-Attribute am <form>: data-turnier, data-ziel, data-schluss, data-titel. */
(function () {
  "use strict";
  var form = document.getElementById("anmeldeformular");
  if (!form) return;
  var meldung = document.getElementById("anmelde-meldung");
  var knopf = form.querySelector("button[type=submit]");
  var ziel = form.dataset.ziel;
  var lokal = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  var p = new URLSearchParams(location.search);
  if (lokal && p.get("ziel")) ziel = p.get("ziel");          // nur zum Testen am eigenen Rechner

  var KLASSEN = { VS: "Volksschule" };
  for (var i = 1; i <= 9; i++) KLASSEN[String(i)] = i + ". Klasse";

  // Nach dem Nennungsschluss: Formular zu, Hinweis zeigen
  var heute = new Date();
  var iso = heute.getFullYear() + "-" + String(heute.getMonth() + 1).padStart(2, "0") + "-" + String(heute.getDate()).padStart(2, "0");
  if (form.dataset.schluss && iso > form.dataset.schluss && !p.has("offen")) {
    form.hidden = true;
    zeige("info", "Der Nennungsschluss ist vorbei. Nachnennungen bitte direkt an <a href=\"mailto:info@schach-gymlienz.at\">info@schach-gymlienz.at</a>.");
    return;
  }

  function zeige(art, html) {
    meldung.className = "anmelde-meldung " + art;
    meldung.innerHTML = html;
    meldung.hidden = false;
    meldung.focus();
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]; });
  }

  function daten() {
    var f = form.elements;
    return {
      turnier: form.dataset.turnier,
      vorname: f.vorname.value.trim(),
      nachname: f.nachname.value.trim(),
      schule: f.schule.value.trim(),
      klasse: f.klasse.value,
      weiblich: f.weiblich.value,
      einverstanden: f.einverstanden.checked,
      website: f.website.value
    };
  }

  function mailLink(d) {
    var text = "Anmeldung " + form.dataset.titel + "\n\n" +
      "Vorname: " + d.vorname + "\nNachname: " + d.nachname + "\nSchule: " + d.schule +
      "\nKlasse: " + (KLASSEN[d.klasse] || "") + "\nMädchen: " + d.weiblich + "\n";
    return "mailto:info@schach-gymlienz.at?subject=" + encodeURIComponent("Anmeldung " + form.dataset.titel) +
      "&body=" + encodeURIComponent(text);
  }

  function ersatzweg(d, grund) {
    zeige("fehler", esc(grund) + " Bitte melde dich stattdessen per Mail an – die Angaben sind schon eingetragen:" +
      "<br><a class=\"btn btn-navy\" href=\"" + mailLink(d) + "\">Anmeldung per Mail senden</a>");
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (!form.reportValidity()) return;
    var d = daten();
    knopf.disabled = true;
    knopf.textContent = "Wird gesendet …";
    var ende = function () { knopf.disabled = false; knopf.textContent = "Anmeldung absenden"; };
    var abbruch = new AbortController();
    var uhr = setTimeout(function () { abbruch.abort(); }, 15000);
    fetch(ziel, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },   // kein CORS-Vorabruf nötig
      body: JSON.stringify(d),
      signal: abbruch.signal
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (a) { return { status: r.status, a: a }; });
    }).then(function (x) {
      clearTimeout(uhr);
      ende();
      if (x.status === 200 && x.a.ok) {
        var name = esc(d.vorname);
        form.reset();
        form.hidden = true;
        zeige("ok", (x.a.doppelt
          ? "<b>" + name + ", du bist schon angemeldet.</b> Es ist alles in Ordnung, du musst nichts mehr tun."
          : "<b>Danke, " + name + "! Deine Anmeldung ist eingegangen.</b> Wir sehen uns am Turniertag – bitte 5&nbsp;€ Nenngeld mitbringen.") +
          "<br><button type=\"button\" class=\"btn btn-soft\" id=\"noch-eine\">Weitere Person anmelden</button>");
        document.getElementById("noch-eine").addEventListener("click", function () {
          meldung.hidden = true;
          form.hidden = false;
          form.elements.vorname.focus();
        });
      } else if (x.status === 400) {
        zeige("fehler", esc(x.a.fehler || "Bitte die Angaben prüfen."));
      } else {
        ersatzweg(d, x.a.fehler || "Die Anmeldung konnte gerade nicht gespeichert werden.");
      }
    }).catch(function () {
      clearTimeout(uhr);
      ende();
      ersatzweg(d, "Der Anmelde-Server ist von diesem Gerät aus gerade nicht erreichbar.");
    });
  });
})();
