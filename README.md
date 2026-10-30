# Coinmaster Adventure

Vorschau-Seite mit allem, was wir für das Spiel bauen. Die Startseite (`index.html`) zeigt jeden
Bereich als Kachel, jeder Bereich liegt in einem eigenen Ordner.

| Bereich | Ordner | Status |
|---|---|---|
| Münzkabinett | `muenzen/` | Vorschau |
| Münzindex | `muenzindex/` | Spielvorschau |
| Eierhalle | `eier/` | Vorschau |
| Nach Roblox Studio übertragen | `roblox/` | nur mit Code |
| Haustiere | – | geplant |

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
Jedes der 50 Motive ist als eigenes Relief gezeichnet (`muenzen/js/emblems.js`) und sieht
dadurch auf allen Geräten gleich aus. Alle Motive auf einen Blick: `muenzen/praegungen.html`.

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

Tippen überspringt bis zur Enthüllung. Unter „Animationen testen“ lässt sich jede einzelne Münze abspielen
(mit „Nächste Münze“ der Reihe nach durch alle 50) oder eine zufällige Münze einer Stufe.

## Wetter & Mutationen

Während eines Wetters kann jede gezogene Münze mutieren (`muenzen/js/mutations.js`).
Die Mutation bleibt dauerhaft an der Münze sichtbar und multipliziert ihren Wert.

| Wetter | Mutation | Chance | Wert | Effekt |
|---|---|---|---|---|
| Regen | Nass | 25 % | ×1,1 | Tropfen auf der Prägung, Wasser tropft herunter |
| Erdbeben | Gestein | 18 % | ×1,25 | Felsbrocken am Rand, steinerner Belag, Staub |
| Disconacht | Disco | 12 % | ×1,5 | kreisende bunte Discolichter, Discokugel, Lichtpunkte |
| Blutmond | Dämonisch | 8 % | ×2 | Hörner, rote Aura, Höllenflammen, Blutring |
| Neonsturm | Augenkrebs | 5 % | ×2,5 | grelle Neonfarben laufen durch (ohne schnelles Blitzen) |
| Datensturm | Hacked | 3 % | ×3 | grüner Code-Regen, Glitch-Zucken, HACKED-Schild |

Im Münzindex wechselt das Wetter jede Minute (nach Häufigkeit gewichtet, Klar ist am
häufigsten). Gefundene Mutationen erscheinen als Punkte an jedem Fach, insgesamt gibt es
50 × 6 = 300. Im Münzkabinett lässt sich jede Mutation in der Detailansicht ansehen.

## Eierhalle

Sieben Eier (`eier/js/eggs.js`), jedes mit eigener Schale und 3D-Extras:

| Ei | Stufe | Preis (Vorschlag) | Besonderheiten |
|---|---|---|---|
| Normal Egg | Normal | 250 Münzen | Sprenkel, Zickzack-Band, Strohnest |
| Wald Egg | Selten | 2.500 Münzen | Ranke mit Blättern, Moos, Pilze, Glühwürmchen |
| Eis Egg | Episch | 15.000 Münzen | Eisblumen, Kristalle am Fuß, Schneefall |
| Engels Egg | Engelsgleich | 75.000 Münzen | Perlmutt, Goldfiligran, Flügel, Heiligenschein |
| Galaxie Egg | Galaktisch | 400.000 Münzen | bewegter Nebel, Sternbilder, Planetenring |
| Admin Egg | Admin | nicht kaufbar | Hex-Panzer, rote Leiterbahnen, Holo-Ringe, Glitch |
| Release Egg (Robux Egg) | Limitiert | R$ 199 | Gold mit Regenbogen-Emaille, Schleife, Konfetti |

Die Schale ist in Scherben aufgeteilt, die beim Schlüpfen echt auseinanderfliegen.
Die Schlüpf-Animation (`eier/js/hatch.js`): Landung, Wackel-Stöße mit wachsenden Rissen,
Aufladen mit Licht aus den Rissen, Explosion, dann erscheint das Haustier (vorerst ein
Platzhalter). Je seltener das Ei, desto mehr Stöße und desto größer die Explosion:
etwa 5 s beim Normal Egg bis 11 s beim Release Egg. Mit `#debug` in der Adresse ist die
Animation zum Testen als `window.hatch` erreichbar.

## Nach Roblox Studio übertragen

`roblox/` erzeugt aus den Daten der Webseite ein Paket für Roblox Studio. Die Seite ist mit
einem Code gesperrt. Der Code steht nur als SHA-256-Hash in `roblox/js/main.js`. Das hält
Neugierige ab, ist aber kein echter Zugriffsschutz, weil die Seite komplett im Browser läuft.

- **Installer** (`roblox/js/luau.js`): ein Skript für die Befehlsleiste von Studio. Es legt
  `ReplicatedStorage › CoinmasterAdventure` mit 7 ModuleScripts an (CoinData, MutationData,
  EggData, Gacha, CoinBuilder, MutationFx, EggBuilder), fertige Modelle in `Coins` und `Eggs`
  und einen Showcase im Workspace mit allen Münzen und Eiern.
- **Motive als ZIP**: die 50 Prägemotive als PNG zum Hochladen als Decal. Die Asset-IDs
  kommen in `CoinData` bei `DecalId`.

Ändern sich Münzen, Mutationen oder Eier auf der Webseite, einfach neu exportieren.

## Lokal starten

ES-Module brauchen einen lokalen Server:

```bash
python3 -m http.server 8000
```

Dann <http://localhost:8000> öffnen.

## Aufbau

- `index.html`, `css/start.css`, `js/start.js` – Startseite
- `js/nav.js` – gemeinsame Navigation und „Nach oben“-Knopf für alle Seiten
- `roblox/` – Export nach Roblox Studio: `js/luau.js` (Luau-Code), `js/zip.js` (ZIP), `js/main.js` (Sperre, Downloads)
- `js/bereiche.js` – Liste der Bereiche auf der Startseite
- `css/theme.css` – gemeinsame Farben, Schriften und Grundlayout
- `eier/` – Eierhalle: `js/eggs.js` (Daten, Preise), `js/eggFactory.js` (Eier), `js/hatch.js` (Schlüpfen)
- `muenzindex/` – Münzindex: `js/main.js` (Fächer, Ziehen, Spielstand), `js/discovery.js` (Animation)
- `muenzen/` – Münzkabinett:
  - `js/coins.js` – Stufen und alle 50 Münzen (Name, Motiv-Schlüssel, Metallfarben, Text)
  - `js/emblems.js` – die 50 Prägemotive als Relief-Zeichnungen
  - `js/mutations.js` – Wetter, Mutationen, Chancen, Multiplikatoren und ihre Effekte
  - `js/coinFactory.js` – baut aus einem Datensatz die 3D-Münze (Prägung, Gravurmuster, Effekte)
  - `js/main.js` – Galerie, Filter, Detailansicht, „Münze ziehen“
  - `css/style.css` – Gestaltung

Neue Münze: einen Eintrag in `COINS` ergänzen. Gravur, Zierband und Effekte kommen automatisch aus der Stufe.
