/* Aufklappbares Menü in der Kopfzeile (z. B. „Training“): Klick oder Tippen öffnet und schließt,
   Escape und ein Klick daneben schließen. Mit Maus öffnet es zusätzlich beim Darüberfahren (CSS). */
(function () {
  "use strict";
  var drops = document.querySelectorAll(".nav-drop");
  function zu(d) { d.classList.remove("offen"); d.querySelector(".nav-drop-btn").setAttribute("aria-expanded", "false"); }
  Array.prototype.forEach.call(drops, function (d) {
    var btn = d.querySelector(".nav-drop-btn");
    btn.addEventListener("click", function () {
      var auf = !d.classList.contains("offen");
      Array.prototype.forEach.call(drops, zu);
      if (auf) { d.classList.add("offen"); btn.setAttribute("aria-expanded", "true"); }
    });
  });
  document.addEventListener("click", function (e) {
    Array.prototype.forEach.call(drops, function (d) { if (!d.contains(e.target)) zu(d); });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") Array.prototype.forEach.call(drops, function (d) { if (d.classList.contains("offen")) { zu(d); d.querySelector(".nav-drop-btn").focus(); } });
  });
})();
