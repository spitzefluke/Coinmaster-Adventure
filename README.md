# Coinmaster Adventure

Vorschau-Seite mit allem, was wir für das Spiel bauen. Die Startseite (`index.html`) zeigt jeden
Bereich als Kachel, jeder Bereich liegt in einem eigenen Ordner.

| Bereich | Ordner | Status |
|---|---|---|
| Münzkabinett | `muenzen/` | Vorschau |
| Münzindex | `muenzindex/` | Spielvorschau |

## Online stellen (GitHub Pages)

Einmalig im Repo einrichten: **Settings → Pages → Build and deployment → Source: „Deploy from a branch“**,
Branch `main`, Ordner `/ (root)`. Danach ist die Seite unter
<https://spitzefluke.github.io/Coinmaster-Adventure/> erreichbar und aktualisiert sich bei jedem Merge in `main`.

GitHub Pages braucht ein öffentliches Repo oder GitHub Pro. Die Seite selbst ist immer öffentlich.

## Neuen Bereich hinzufügen

1. Ordner anlegen, z. B. `karte/index.html`. Gemeinsame Farben und Schriften kommen aus `../css/theme.css`.
2. In `js/bereiche.js` einen Eintrag mit `status: 'vorschau'` ergänzen (oder den Platzhalter ersetzen).

## Münzkabinett

50 3D-Münzen in 10 Seltenheitsstufen, gerendert mit three.js.

Alle Münzen sind rund. Die Prägung hat einen spiegelpolierten Grund und ein mattiertes Relief
mit echter Licht-Reaktion (Normal-Map). Jede Stufe hat ein eigenes Gravurmuster und Zierband.

| Stufe | Münzen | Drop-Chance | Rand | Gravur im Feld | Zierband | Effekte |
|---|---|---|---|---|---|---|
| Normal | 9 | 40 % | glatt | – | Perlkreis | – |
| Selten | 8 | 25 % | geriffelt | Drehrillen | Kordel | – |
| Sehr selten | 7 | 15 % | geriffelt | Strahlenkranz | Lorbeer | Glanzblitz |
| Episch | 6 | 9 % | glatt | Rautengitter | Zickzack | Glühen, Edelsteine |
| Legendär | 5 | 5 % | glatt | Feuerwirbel | Perlkreis | Glühen, Funkenflug |
| Mystisch | 4 | 3 % | glatt | Bannkreis (Siebenstern) | Runen | leuchtende Prägung, Runenringe |
| Engelsgleich | 4 | 1,5 % | glatt | Gloriole | Federn | Flügel, Heiligenschein, Funkeln |
| Göttlich | 3 | 0,9 % | glatt | Strahlenkranz | Strahlen | Strahlenkranz, Funkeln |
| Galaktisch | 2 | 0,5 % | glatt | Umlaufbahnen, Sterne | Sterne | Nebel, Planetenbahn |
| Unerreichbar | 2 | 0,1 % | glatt | Guilloche-Rosette | Rauten | Regenbogen, Ringe, Strahlen |

## Münzindex

Sammelbuch mit 50 Fächern. „Münze ziehen“ zieht nach Drop-Chance. Neue Münzen werden mit einer
Entdeckungs-Animation enthüllt, doppelte erhöhen nur den Zähler. Der Fortschritt liegt im
`localStorage` des Browsers.

Die Animation (`muenzindex/js/discovery.js`) lädt eine „?“-Münze Stufe für Stufe bis zur echten
Seltenheit auf. Je seltener, desto mehr Stufen, desto länger: etwa 2,5 s bei Normal bis 10 s bei
Unerreichbar. Ab einer Stufe kommen Effekte dazu und bleiben für alle höheren:

| ab Stufe | Effekt |
|---|---|
| Selten | Schockwelle |
| Sehr selten | Strahlenkranz |
| Episch | Bildschirmbeben |
| Legendär | Funkenfontäne, großes Stufen-Banner |
| Mystisch | Runenkreis, Buchstaben fallen einzeln ein |
| Engelsgleich | Himmelslicht und Lichtpartikel |
| Göttlich | Mehrfach-Blitze |
| Galaktisch | Sternen-Warp |
| Unerreichbar | Regenbogen-Glitch |

Tippen überspringt bis zur Enthüllung. Unter „Animationen testen“ lässt sich jede Stufe abspielen.

## Lokal starten

ES-Module brauchen einen lokalen Server:

```bash
python3 -m http.server 8000
```

Dann <http://localhost:8000> öffnen.

## Aufbau

- `index.html`, `css/start.css`, `js/start.js` – Startseite
- `js/bereiche.js` – Liste der Bereiche auf der Startseite
- `css/theme.css` – gemeinsame Farben, Schriften und Grundlayout
- `muenzindex/` – Münzindex: `js/main.js` (Fächer, Ziehen, Spielstand), `js/discovery.js` (Animation)
- `muenzen/` – Münzkabinett:
  - `js/coins.js` – Stufen und alle 50 Münzen (Name, Motiv, Metallfarben, Text)
  - `js/coinFactory.js` – baut aus einem Datensatz die 3D-Münze (Prägung, Gravurmuster, Effekte)
  - `js/main.js` – Galerie, Filter, Detailansicht, „Münze ziehen“
  - `css/style.css` – Gestaltung

Neue Münze: einen Eintrag in `COINS` ergänzen. Gravur, Zierband und Effekte kommen automatisch aus der Stufe.
