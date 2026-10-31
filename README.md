# Coinmaster Adventure

Vorschau-Seite mit allem, was wir für das Spiel bauen. Die Startseite (`index.html`) zeigt jeden
Bereich als Kachel, jeder Bereich liegt in einem eigenen Ordner.

| Bereich | Ordner | Status |
|---|---|---|
| Münzkabinett | `muenzen/` | Vorschau |
| Münzindex | `muenzindex/` | Spielvorschau |
| Eierhalle | `eier/` | Vorschau |
| Haustiere | `haustiere/` | Vorschau |
| Welten | `welten/` | Vorschau |
| Spiel-Oberfläche | `spiel/` | Vorschau |
| Nach Roblox Studio übertragen | `roblox/` | nur mit Code |

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

## Haustiere

`haustiere/` zeigt alle 49 Haustiere aus dem Claude-Design-Projekt „Haustiere“, sieben pro Ei:
fünf häufige (25 / 22 / 20 / 15 / 10,5 %) und zwei epische (5 / 2,5 %) mit eigenen Effekten
(Strahlen, Runenkreis, Lichtsäule, Kraftschub mit Blitzen, Themen-Partikel, kreisende Objekte).

- `haustiere/js/pets.js` – Daten, Schlupfchancen, `rollPet(eggId)`
- `haustiere/js/kit.js`, `templates.js` – 3D-Bausteine (Fell, Augen, Vierbeiner, Echse, Flügel …)
- `haustiere/js/builders-a/b/c.js` – je ein Bauplan pro Tier
- `haustiere/js/petFactory.js` – baut ein Tier samt Sockel und Effekten
- `haustiere/js/exportGlb.js` – Export als .glb für Blender (einzeln oder alle 49)

In der Eierhalle schlüpft jetzt ein echtes Haustier, gewürfelt nach Schlupfchance.

## Welten

`welten/` zeigt die Weltkarte: vier Planeten mit ihren Welten, jede als drehbare 3D-Insel mit
eigener Landschaft, Himmel und Partikeln (Pollen, Glühwürmchen, Schnee, Glut, Streusel, Sterne,
Sturm, Blasen …).

| Planet | Welten | Weg dorthin |
|---|---|---|
| Planet 1 · Heimatplanet | Normal, Wald, Stadt, Eis, Lava, Höhle, Candy | Startplanet |
| Planet 2 · Weltraum | Mond, Neptun, Mars, Saturn, Alien, Sonne | Rakete: Candy + 1 Wiedergeburt |
| Planet 3 · Tiefsee | Korallenriff, Muschelland, Atlantis, Coming soon | Tiefsee-Portal: Sonne + 3 Wiedergeburten |
| Planet 4 | Coming soon | später |

- In jeder Welt findet man **alle Münzen**. Spätere Welten erhöhen die Chance auf seltene Stufen
  (`luck`) und den Münzwert (`value`).
- Welten kauft man pro Planet der Reihe nach mit **Talern**.
- **Wiedergeburt:** kostet Taler (1 Mio., danach jeweils ×4), setzt die Taler auf 0 und macht
  jede Münze dauerhaft 50 % mehr wert. Welten, Münzen, Level und Skills bleiben.
- `welten/js/worlds.js` – Daten (Preise, Boni, Portale, Wiedergeburt), `js/worldFactory.js` –
  baut die 3D-Inseln, `js/thumbs.js` – Vorschaubilder.

In der Spiel-Oberfläche gibt es dazu das Fenster **Welten** (Taste W) zum Kaufen, Teleportieren,
Öffnen von Portalen und für die Wiedergeburt. Die aktuelle Welt läuft dort als 3D-Hintergrund.
Der Knopf „+ Test-Taler“ gibt es nur in der Vorschau, damit man spätere Welten ausprobieren kann.

## Spiel-Oberfläche

`spiel/` zeigt die UIs des Spiels als bedienbare Vorschau:

- **HUD:** aktuelle Welt als 3D-Hintergrund, Level mit EP-Balken, freie Skillpunkte, Taler, Wetter
  mit Countdown, aktive Boosts, Menü (Welten, Skills, Inventar, Shop, Index, Optionen) und
  „Münze suchen“, das einen Fund in der aktuellen Welt simuliert.
- **Welten:** Teleport-Menü je Planet, Portale und Wiedergeburt (siehe oben).
- **Skilltree** (`spiel/js/skills.js`): Kern plus vier Äste mit je fünf Skills (Erkundung,
  Münzen & Glück, Eier & Haustiere, Komfort). Skillpunkte kommen aus Leveln (jedes Level 1,
  jedes fünfte 2). Glück, Wert, Doppelfund, Wettergespür, Goldene Hand, Feilscher und Großer
  Beutel wirken in der Vorschau schon; die Erkundungs-Skills gelten später in den Welten.
  Sichtbar sind nur Skills, deren Vorgänger man gelernt hat; der Rest bleibt verborgen und
  taucht mit einer Animation auf. Zoomen per +/−-Knöpfen, Mausrad, Tasten + − 0 oder zwei
  Fingern, verschieben durch Ziehen.
- **Inventar:** Münzen sortieren, filtern, verkaufen; Eier; Haustiere folgen.
- **Shop:** Eier und Boosts für Taler, Robux-Angebote nur angedeutet.
- **Einstellungen** (`js/settings.js`): gelten für alle Seiten, z. B. Grafikqualität der
  3D-Ansichten und „Animationen überspringen“ für Entdeckung und Schlüpfen.

Tastenkürzel: K Skills, I Inventar, B Shop, O Einstellungen, F Münze suchen, Esc schließt.

## Nach Roblox Studio übertragen

`roblox/` erzeugt aus den Daten der Webseite ein Paket für Roblox Studio. Die Seite ist mit
einem Code gesperrt. Der Code steht nur als SHA-256-Hash in `roblox/js/main.js`. Das hält
Neugierige ab, ist aber kein echter Zugriffsschutz, weil die Seite komplett im Browser läuft.

- **Installer** (`roblox/js/luau.js`): ein Skript für die Befehlsleiste von Studio. Es legt
  `ReplicatedStorage › CoinmasterAdventure` mit 8 ModuleScripts an (CoinData, MutationData,
  EggData, WorldData, Gacha, CoinBuilder, MutationFx, EggBuilder), fertige Modelle in `Coins` und `Eggs`
  und einen Showcase im Workspace mit allen Münzen und Eiern.
- **Motive als ZIP**: die 50 Prägemotive als PNG zum Hochladen als Decal. Die Asset-IDs
  kommen in `CoinData` bei `DecalId`.

`WorldData` enthält Planeten, Welten (Preis, Glück, Münzwert), Portale und die Wiedergeburt.
Die 3D-Inseln selbst werden in Studio gebaut; die Daten dafür kommen aus diesem Modul.

Ändern sich Münzen, Mutationen, Eier oder Welten auf der Webseite, einfach neu exportieren.

## Lokal starten

ES-Module brauchen einen lokalen Server:

```bash
python3 -m http.server 8000
```

Dann <http://localhost:8000> öffnen.

## Aufbau

- `index.html`, `css/start.css`, `js/start.js` – Startseite
- `js/settings.js` – gemeinsame Einstellungen (Ton, Grafik, Animationen, Zahlenformat)
- `haustiere/` – Haustiere: Daten, 3D-Baupläne, Galerie, Export für Blender
- `welten/` – Weltkarte: `js/worlds.js` (Daten), `js/worldFactory.js` (3D-Inseln), `js/thumbs.js` (Vorschaubilder)
- `spiel/` – Spiel-Oberfläche: `js/skills.js` (Skilltree-Daten), `js/state.js` (Spielstand, Level, Effekte), `js/panels/` (Fenster)
- `js/nav.js` – gemeinsame Navigation (klebende Leiste mit gleitender Messing-Markierung und Münz-Klang, auf dem Handy ausklappbares Menü) und „Nach oben“-Knopf für alle Seiten
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
