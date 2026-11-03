/* frankdavidlee.com — wenig JavaScript, nichts wird gespeichert (kein Cookie, kein
   localStorage/sessionStorage/IndexedDB), keine Anfragen an fremde Server.
   Ohne JavaScript bleibt jede Seite vollständig nutzbar.
   © 2026 Frank David Lee. Alle Rechte vorbehalten. */
(function () {
  "use strict";
  var doc = document;
  var root = doc.documentElement;

  /* Alles, was zu einer Seite gehört, steckt in initSeite(): beim ersten Laden und nach jedem
     Seitenwechsel ohne Neuladen. */
  function initSeite(nachWechsel) {
  /* ---------- Sanftes Einblenden (nur wenn Bewegung erlaubt) ---------- */
  var bewegungOk = window.matchMedia && window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
  var elemente = Array.prototype.slice.call(doc.querySelectorAll(".einblenden"));
  if (bewegungOk && "IntersectionObserver" in window && elemente.length) {
    var hoehe = window.innerHeight || root.clientHeight;
    // Nach einem Seitenwechsel übernimmt der Übergang die Bewegung: was schon im Bild ist,
    // steht sofort, damit sich nicht zwei Animationen überlagern (sonst ruckelt es am Ende).
    if (nachWechsel) root.classList.add("sofort");
    elemente.forEach(function (el) {
      var r = el.getBoundingClientRect();
      // Nach einem Wechsel auch knapp unterhalb des Bildrands sofort zeigen: auf dem Handy
      // verdecken Browserleiste und untere Navigation den Rand, dort startete sonst eine zweite Bewegung.
      var grenze = nachWechsel ? hoehe + 240 : hoehe;
      if (r.top < grenze && r.bottom > 0) el.classList.add("sichtbar");
    });
    if (nachWechsel) requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.remove("sofort"); }); });
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
  }
  initSeite();

  /* ---------- Seitenwechsel ohne Neuladen ----------
     Interne Links laden nur die neue Seite (gleicher Host) und tauschen den Inhalt aus; Kopf,
     Navigation und Fuß bleiben stehen. Der Zwischenspeicher lebt nur im Arbeitsspeicher dieser
     Seite. Bei allem Unerwarteten (andere Sprache, neue CSS-Fassung, Fehler) normal laden. */
  var cache = new Map();
  var laeuft = null;
  var bewegung = !window.matchMedia || window.matchMedia("(prefers-reduced-motion: no-preference)").matches;

  function zielUrl(a) {
    if (!a || a.target && a.target !== "_self" || a.hasAttribute("download")) return null;
    var url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return null;
    if (!/(\/|\.html)$/.test(url.pathname)) return null;
    if (url.pathname === location.pathname && url.search === location.search && url.hash) return null;
    return url;
  }
  function holen(href) {
    if (!cache.has(href)) {
      cache.set(href, fetch(href, { credentials: "same-origin" }).then(function (r) {
        if (!r.ok || !/text\/html/.test(r.headers.get("content-type") || "")) throw new Error("kein HTML");
        return r.text();
      }).catch(function (e) { cache.delete(href); throw e; }));
    }
    return cache.get(href);
  }
  function vorladen(ev) {
    var url = zielUrl(ev.target.closest && ev.target.closest("a[href]"));
    if (url && url.pathname !== location.pathname) holen(url.pathname + url.search).catch(function () {});
  }
  doc.addEventListener("pointerover", vorladen, { passive: true });
  doc.addEventListener("touchstart", vorladen, { passive: true });
  doc.addEventListener("focusin", vorladen);

  function kopfTauschen(neu) {
    var sel = 'meta[name="description"],link[rel="canonical"],link[rel="alternate"],meta[property^="og:"],meta[name="robots"],script[type="application/ld+json"]';
    Array.prototype.forEach.call(doc.head.querySelectorAll(sel), function (el) { el.remove(); });
    var anker = doc.head.querySelector('link[rel="stylesheet"]');
    Array.prototype.forEach.call(neu.head.querySelectorAll(sel), function (el) {
      doc.head.insertBefore(doc.importNode(el, true), anker);
    });
    doc.title = neu.title;
  }
  function tauschen(neu) {
    kopfTauschen(neu);
    ["header.kopf", "main", "footer.fuss", "nav.nav-unten"].forEach(function (sel) {
      var alt = doc.querySelector(sel), ersatz = neu.querySelector(sel);
      if (alt && ersatz) alt.replaceWith(doc.importNode(ersatz, true));
    });
  }
  // Sofortige Rückmeldung beim Tippen: der passende Navigationspunkt wird gleich markiert.
  function navMarkieren(pfad) {
    Array.prototype.forEach.call(doc.querySelectorAll(".nav-oben, .nav-unten"), function (nav) {
      var bester = null, laenge = -1;
      var links = nav.querySelectorAll("a[href]");
      var start = links.length ? links[0].getAttribute("href") : "/";
      Array.prototype.forEach.call(links, function (a) {
        var h = a.getAttribute("href");
        var passt = h === pfad || (h !== start && pfad.indexOf(h) === 0);
        if (passt && h.length > laenge) { bester = a; laenge = h.length; }
      });
      if (!bester) return;
      Array.prototype.forEach.call(nav.querySelectorAll("[aria-current]"), function (a) { a.removeAttribute("aria-current"); });
      bester.setAttribute("aria-current", "page");
    });
  }
  function gehe(url, push, scrollY) {
    var href = url.pathname + url.search;
    var nr = laeuft = {};
    // Dauert das Laden spürbar (> 150 ms, z. B. schwaches Netz), zeigt ein Platzhalter-Gerüst an,
    // dass etwas passiert – bei schnellem Laden erscheint nichts davon.
    var geruest = setTimeout(function () {
      if (nr !== laeuft) return;
      root.classList.add("seite-laedt");
      var m = doc.querySelector("main");
      if (m) m.setAttribute("aria-busy", "true");
    }, 150);
    var geruestWeg = function () {
      clearTimeout(geruest);
      root.classList.remove("seite-laedt");
    };
    return holen(href).then(function (html) {
      if (nr !== laeuft) return;
      geruestWeg();
      var neu = new DOMParser().parseFromString(html, "text/html");
      var css = function (d) { var l = d.querySelector('link[rel="stylesheet"]'); return l && l.getAttribute("href"); };
      if (!neu.querySelector("main") || neu.querySelector('meta[http-equiv="refresh"]') ||
          neu.documentElement.lang !== root.lang || css(neu) !== css(doc)) {
        location.href = url.href;
        return;
      }
      if (push) {
        history.replaceState({ y: window.scrollY }, "");
        history.pushState({ y: 0 }, "", url.href);
      }
      var fertig = function () {
        tauschen(neu);
        // Erst an die Zielposition scrollen, dann sichtbare Elemente bestimmen.
        var ziel = url.hash && doc.getElementById(decodeURIComponent(url.hash.slice(1)));
        if (ziel) ziel.scrollIntoView();
        else window.scrollTo(0, scrollY || 0);
        initSeite(true);
        if (push) {
          var main = doc.querySelector("main");
          if (main) main.focus({ preventScroll: true });
        }
      };
      if (bewegung && doc.startViewTransition) doc.startViewTransition(fertig);
      else fertig();
    }).catch(function () { geruestWeg(); location.href = url.href; });
  }
  doc.addEventListener("click", function (ev) {
    if (ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
    var a = ev.target.closest && ev.target.closest("a[href]");
    var url = zielUrl(a);
    if (!url) return;
    ev.preventDefault();
    if (url.pathname === location.pathname && url.search === location.search) { window.scrollTo(0, 0); return; }
    navMarkieren(url.pathname);
    gehe(url, true, 0);
  });
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.addEventListener("popstate", function (ev) {
    gehe(new URL(location.href), false, ev.state && ev.state.y || 0);
  });
})();
