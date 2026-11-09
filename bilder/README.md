# Bilder für frankdavidlee.com

Je Projekt ein Ordner: `site/bilder/projekte/<projekt-id>/` (die IDs stehen in
`inhalt/projekte.json`, z. B. `arbeitseule`, `app-leitstand`, `jet-hero`).

Der Dateiname ohne Endung muss dem Feld `datei` des Bildes in
`inhalt/projekte.json` entsprechen. Fehlt die Datei, zeigt die Seite einen
gekennzeichneten Platzhalter „Bildschirmfoto folgt“.

## Empfohlen (mit `srcset`)

| Format im JSON | Seitenverhältnis | Dateien |
|---|---|---|
| `desktop` | 16:10 | `<datei>-800.webp` (800×500) und `<datei>-1600.webp` (1600×1000) |
| `mobil`   | ≈ 9:19,5 | `<datei>-800.webp` (800×1732); optional `-1600` |

Zusätzlich `<datei>-800.avif` / `<datei>-1600.avif` sind möglich; dann baut der
Generator ein `<picture>` mit AVIF zuerst. Eine einzelne Datei `<datei>.webp`
(oder `.jpg`/`.png`) funktioniert auch, dann ohne `srcset`.

Beispiel für Arbeitseule, Bild „dashboard“:

```
site/bilder/projekte/arbeitseule/dashboard-800.webp
site/bilder/projekte/arbeitseule/dashboard-1600.webp
```

Danach `node bauen.mjs` und `node pruefen.mjs` im Projektordner ausführen.

**Nur Demodaten** auf Bildschirmfotos: keine echten Namen, Adressen,
Bewerbungen oder Kundendaten. Bilder werden oben ausgerichtet beschnitten,
wenn das Seitenverhältnis abweicht.

## Bilder je Sprache

Gibt es zusätzlich `<datei>-en-800.webp` (bzw. `<datei>-de-…`), zeigt die Seite dieser Sprache
das eigene Bild; sonst das gemeinsame `<datei>-800.webp`. So können Bildschirmfotos auf der
englischen Seite die englische Oberfläche zeigen.
