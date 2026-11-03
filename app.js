/* frankdavidlee.com — wenig JavaScript, nichts wird gespeichert (kein Cookie, kein
   localStorage/sessionStorage/IndexedDB), keine Anfragen an fremde Server.
   Ohne JavaScript bleibt jede Seite vollständig nutzbar.
   © 2026 Frank David Lee. Alle Rechte vorbehalten. */
(function () {
  "use strict";
  var doc = document;
  var root = doc.documentElement;

  /* ---------- Sanftes Einblenden (nur wenn Bewegung erlaubt) ---------- */
  var bewegungOk = window.matchMedia && window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
  var elemente = Array.prototype.slice.call(doc.querySelectorAll(".einblenden"));
  if (bewegungOk && "IntersectionObserver" in window && elemente.length) {
    var hoehe = window.innerHeight || root.clientHeight;
    elemente.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < hoehe && r.bottom > 0) el.classList.add("sichtbar");
    });
    root.classList.add("bewegung");
    var io = new IntersectionObserver(
      function (eintraege) {
        eintraege.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("sichtbar");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    elemente.forEach(function (el) {
      if (!el.classList.contains("sichtbar")) io.observe(el);
    });
  }

  /* ---------- Projektfilter (nur im Speicher der Seite) ---------- */
  var filter = doc.querySelector("[data-filter]");
  if (filter) {
    var karten = Array.prototype.slice.call(doc.querySelectorAll("[data-karten] > li"));
    var anzahl = doc.querySelector("[data-anzahl]");
    var knoepfe = Array.prototype.slice.call(filter.querySelectorAll("[data-kategorie]"));
    filter.hidden = false;
    filter.addEventListener("click", function (ev) {
      var k = ev.target.closest("[data-kategorie]");
      if (!k) return;
      var wahl = k.getAttribute("data-kategorie");
      knoepfe.forEach(function (b) {
        b.setAttribute("aria-pressed", b === k ? "true" : "false");
      });
      var n = 0;
      karten.forEach(function (karte) {
        var passt = wahl === "alle" || (" " + karte.getAttribute("data-kategorien") + " ").indexOf(" " + wahl + " ") >= 0;
        karte.hidden = !passt;
        if (passt) {
          n++;
          karte.classList.add("sichtbar");
        }
      });
      if (anzahl) {
        anzahl.textContent = n === 1 ? anzahl.getAttribute("data-text-eins") : anzahl.getAttribute("data-text-viele").replace("{n}", String(n));
      }
    });
  }

  /* ---------- E-Mail-Adresse kopieren ---------- */
  Array.prototype.forEach.call(doc.querySelectorAll("[data-kopieren]"), function (knopf) {
    var meldung = knopf.closest("li") && knopf.closest("li").querySelector(".kopier-meldung");
    var zeige = function (text) {
      if (meldung) meldung.textContent = text;
    };
    knopf.hidden = false;
    knopf.addEventListener("click", function () {
      var wert = knopf.getAttribute("data-kopieren");
      var ok = function () { zeige(knopf.getAttribute("data-text-ok")); };
      var fehler = function () {
        zeige(knopf.getAttribute("data-text-fehler"));
        var adresse = doc.getElementById("mail-adresse");
        if (adresse && window.getSelection) {
          var bereich = doc.createRange();
          bereich.selectNodeContents(adresse);
          var sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(bereich);
        }
      };
      zeige("");
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(wert).then(ok, fehler);
      } else {
        fehler();
      }
    });
  });

  /* ---------- Bildansicht mit Tastatur, Escape und Fokusfalle ---------- */
  var dialog = doc.querySelector("[data-lightbox]");
  var ausloeser = Array.prototype.slice.call(doc.querySelectorAll("[data-galerie-index]"));
  if (dialog && ausloeser.length && typeof dialog.showModal === "function") {
    var buehne = dialog.querySelector(".lb-buehne");
    var unterschrift = dialog.querySelector(".lb-unterschrift");
    var position = dialog.querySelector(".lb-position");
    var aktuell = 0;
    var zuletzt = null;
    var reihenfolge = ausloeser.slice().sort(function (a, b) {
      return Number(a.getAttribute("data-galerie-index")) - Number(b.getAttribute("data-galerie-index"));
    });

    var zeigeBild = function (i) {
      aktuell = (i + reihenfolge.length) % reihenfolge.length;
      var knopf = reihenfolge[aktuell];
      var rahmen = knopf.querySelector(".geraet");
      var kopie = rahmen.cloneNode(true);
      Array.prototype.forEach.call(kopie.querySelectorAll("img"), function (img) {
        img.removeAttribute("loading");
        img.setAttribute("sizes", "100vw");
      });
      Array.prototype.forEach.call(kopie.querySelectorAll("source"), function (s) {
        s.setAttribute("sizes", "100vw");
      });
      buehne.replaceChildren(kopie);
      var cap = knopf.parentNode.querySelector("figcaption");
      unterschrift.textContent = cap ? cap.textContent : "";
      position.textContent = dialog
        .getAttribute("data-text-position")
        .replace("{i}", String(aktuell + 1))
        .replace("{n}", String(reihenfolge.length));
    };

    ausloeser.forEach(function (knopf) {
      knopf.addEventListener("click", function () {
        zuletzt = knopf;
        zeigeBild(reihenfolge.indexOf(knopf));
        dialog.showModal();
        var schliessen = dialog.querySelector('[data-lb="schliessen"]');
        if (schliessen) schliessen.focus();
      });
    });

    dialog.addEventListener("click", function (ev) {
      var steuer = ev.target.closest("[data-lb]");
      if (steuer) {
        var art = steuer.getAttribute("data-lb");
        if (art === "schliessen") dialog.close();
        if (art === "vor") zeigeBild(aktuell + 1);
        if (art === "zurueck") zeigeBild(aktuell - 1);
        return;
      }
      if (ev.target === dialog) {
        var r = dialog.getBoundingClientRect();
        var aussen = ev.clientX < r.left || ev.clientX > r.right || ev.clientY < r.top || ev.clientY > r.bottom;
        if (aussen) dialog.close();
      }
    });

    dialog.addEventListener("keydown", function (ev) {
      if (ev.key === "ArrowRight" && reihenfolge.length > 1) { ev.preventDefault(); zeigeBild(aktuell + 1); }
      else if (ev.key === "ArrowLeft" && reihenfolge.length > 1) { ev.preventDefault(); zeigeBild(aktuell - 1); }
      else if (ev.key === "Tab") {
        var fokusierbar = Array.prototype.filter.call(dialog.querySelectorAll("button"), function (b) {
          return !b.closest("[hidden]");
        });
        if (!fokusierbar.length) return;
        var erstes = fokusierbar[0];
        var letztes = fokusierbar[fokusierbar.length - 1];
        if (ev.shiftKey && doc.activeElement === erstes) { ev.preventDefault(); letztes.focus(); }
        else if (!ev.shiftKey && doc.activeElement === letztes) { ev.preventDefault(); erstes.focus(); }
      }
    });

    dialog.addEventListener("close", function () {
      buehne.replaceChildren();
      if (zuletzt) zuletzt.focus();
    });
  }
})();
