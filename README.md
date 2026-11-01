# Coinmaster Adventure

Vorschau-Seite mit allem, was wir für das Spiel bauen. Die Startseite (`index.html`) zeigt jeden
Bereich als Kachel, jeder Bereich liegt in einem eigenen Ordner.

| Bereich | Ordner | Status |
|---|---|---|
| Münzkabinett | `muenzen/` | Vorschau |
| Münzindex | `muenzindex/` | Spielvorschau |
| Eierhalle | `eier/` | Vorschau |
| Haustiere | `haustiere/` | Vorschau |
| Auras | `auren/` | Vorschau |
| Welten | `welten/` | Vorschau |
| Wetter | `wetter/` | Vorschau |
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

`haustiere/` zeigt alle 49 Haustiere aus den Claude-Design-Projekten „Haustiere“ und „Haustiere Roblox“, sieben pro Ei:
fünf häufige (25 / 22 / 20 / 15 / 10,5 %) und zwei epische (5 / 2,5 %) mit eigenen Effekten
(Strahlen, Runenkreis, Lichtsäule, Kraftschub mit Blitzen, Themen-Partikel, kreisende Objekte).

- **Roblox-Stil** (Standard): glatte Kunststoff-Blöcke mit runden Kanten, große Köpfe, Knopfaugen,
  Comic-Kontur und achteckiger Sockel. Der Knopf „Original“ schaltet auf die erste Fassung um
  (Wahl wird gemerkt). Auch beim Schlüpfen in der Eierhalle erscheint der Roblox-Stil.
- `haustiere/js/rbx-kit.js` – Roblox-Bausteine (Blöcke, Gesicht, Vierbeiner, Echse, Vogel, Zubehör),
  `rbx-a/b/c.js` – je ein Roblox-Bauplan pro Tier
- `haustiere/js/pets.js` – Daten, Schlupfchancen, `rollPet(eggId)`
- `haustiere/js/kit.js`, `templates.js` – 3D-Bausteine (Fell, Augen, Vierbeiner, Echse, Flügel …)
- `haustiere/js/builders-a/b/c.js` – je ein Bauplan pro Tier
- `haustiere/js/petFactory.js` – baut ein Tier samt Sockel und Effekten
- `haustiere/js/exportGlb.js` – Export als .glb für Blender (einzeln oder alle 49)

In der Eierhalle schlüpft jetzt ein echtes Haustier, gewürfelt nach Schlupfchance.

## Welten

**Spawn (Münzstadt, `welten/js/spawnTown.js`):** Hier starten neue Spieler.
- **Marktplatz** mit Pflaster, Springbrunnen mit Fontänen und Münzstatue, Spawn-Pad
- **Stadtmauer** mit acht Türmen, Fahnen und vier Torbögen; vier Hauptstraßen mit Laternen und Lichterketten, dazu eine Ringstraße
- **Läden mit Innenraum:** Eier-Laden, Boost-Labor, Robux-Palast (goldene Kuppel), Haustier-Hof, Verkaufs-Kontor; jeweils mit Schaufenstern, Leuchtschrift, Theke, Regalen und Verkäufer
- **Portal-Hallen:** Heimat-Tor (Planet 1), Raketenstartplatz mit Rakete (Planet 2), Tiefsee-Strudel (Planet 3 und 4)
- **Spielbereiche:** Ei-Schlüpfplatz mit allen 7 Eiern, Glücksrad, VIP-Lounge, Quest-Brett, Obby-Turm, Ranglisten, Münzindex-Rotunde, tägliche Belohnung, Code-Terminal, Gruppen-Belohnung
- **Leben:** Spaziergänger mit Haustieren, Münzregen, Feuerwerk, ein Tag-Nacht-Wechsel (90 Sekunden), bei dem nachts die Laternen heller leuchten

In der Weltkarte lassen sich alle Bereiche anklicken. In der Spiel-Oberfläche kann man sie im 3D-Hintergrund
antippen, und die Spawn-Leiste öffnet **Belohnungen** (sieben Tage Serie, Glücksrad einmal am Tag, Gruppe),
**Ranglisten** (Taler, Münzen, Wiedergeburten, Level, mit deinem Platz) und **Codes** (`spiel/js/rewards.js`;
Vorschau-Codes: COINMASTER, SPAWN, GLUECK, RELEASE, DANKE). Im Roblox-Export ist `00-Spawn.rbxmx` dabei,
mit `SpawnLocation`, Teilen `Portal_<WeltId>` und Schildern mit SurfaceGui-Text.

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
- **Planet 3 (Tiefsee)** hat Lichtmuster auf dem Meeresboden, Quallen, Schildkröten, einen Mantarochen,
  Anemonen mit Clownfischen, Kelp und Seeigel. Wahrzeichen: Schiffswrack und Korallenbogen
  (Korallenriff), Muschelhaus, Perlenbrunnen, Krabben und Seepferdchen (Muschelland), Palast mit
  Kristallkuppel, vier Türmen, Runenkreis und Säulenallee (Atlantis).
- Jede Insel hat eine Teleport-Plattform (Ankunftsort) und Details wie Brücke, Häuschen, Brunnen,
  Lore auf Schienen, Cupcakes, Geysire, Schatztruhe, Sandburg oder Statuen.
- **Roblox-Ansicht** (Knopf in der 3D-Ansicht): zeigt die Insel so, wie sie nach dem Export in
  Roblox Studio aus Teilen aufgebaut ist.
- **Größenvergleich** (Knopf in der 3D-Ansicht): stellt eine normal große Roblox-Figur (gut
  5 Studs, klassische Block-Proportionen) neben die Teleport-Plattform und fährt die Kamera hin.
  Eine Insel ist rund 256 Studs breit, also etwa 64 Figuren nebeneinander
  (`welten/js/character.js`).
- `welten/js/worlds.js` – Daten (Preise, Boni, Portale, Wiedergeburt), `js/worldFactory.js` –
  baut die 3D-Inseln, `js/thumbs.js` – Vorschaubilder.

In der Spiel-Oberfläche gibt es dazu das Fenster **Welten** (Taste W) zum Kaufen, Teleportieren,
Öffnen von Portalen und für die Wiedergeburt. Die aktuelle Welt läuft dort als 3D-Hintergrund.
Der Knopf „+ Test-Taler“ gibt es nur in der Vorschau, damit man spätere Welten ausprobieren kann.

## Wetter

`wetter/` zeigt alle Wetter: was gerade herrscht, jedes Wetter in 3D auf einer wählbaren Welt, eine Münze
mit der passenden Mutation, eine Vorhersage und eine Übersicht. Das Wetter wechselt alle drei Minuten und
ergibt sich aus der Uhrzeit (für alle Spieler gleich, `muenzen/js/mutations.js`).

| Wetter | Anteil | Mutation | Chance | Wert |
|---|---|---|---|---|
| Klar | 34 % | – | – | – |
| Regen | 14 % | Nass | 25 % | ×1,1 |
| Gewitter | 10 % | Elektrisch | 10 % | ×1,75 |
| Erdbeben | 9 % | Gestein | 18 % | ×1,25 |
| Schneesturm | 9 % | Gefroren | 20 % | ×1,3 |
| Disconacht | 8 % | Disco | 12 % | ×1,5 |
| Blutmond | 5 % | Dämonisch | 8 % | ×2 |
| Neonsturm | 4 % | Augenkrebs | 5 % | ×2,5 |
| Goldregen | 3 % | Golden | 4 % | ×4 |
| Datensturm | 3 % | Hacked | 3 % | ×3 |
| Sternschnuppen | 2 % | Kosmisch | 2 % | ×5 |

- **3D-Wetter** (`welten/js/weatherFx.js`): Regen mit Pfützen, Gewitter mit Wolken und Blitzen (höchstens
  alle 2,5 Sekunden), Erdbeben mit Beben, Rissen und fallenden Steinen, Schneesturm mit weißem Boden,
  Disco-Kugel mit Lichtkegeln, Blutmond, Neon-Ringe, Goldregen, Code-Regen und Sternschnuppen.
  Läuft in der Weltkarte (Auswahl „Wetter“), auf der Wetter-Seite und als Spiel-Hintergrund.
- **Spiel:** Ansage beim Wetterwechsel, Fenster „Wetter“ (Taste V oder Wetter-Anzeige antippen) mit
  Vorhersage und allen Wettern.
- **Roblox:** Modul `WeatherFx` (Licht, Nebel, Partikel, Blitze, Ansage) und zwei Skripte, die der
  Installer anlegt: `CoinmasterWeather` (Server) und `CoinmasterWeatherClient`.

## Auras

`auren/` zeigt 50 Auras, die um die Spielerfigur leuchten, als Galerie mit Filtern nach Thema und
Seltenheit und einer drehbaren Detailansicht (`auren/js/auras.js` für die Daten, `auren/js/auraFactory.js`
für die 3D-Effekte, überarbeitet nach dem Claude-Design-Projekt „Auras Vorher Nachher“; Bausteine und die
erste Fassung in `auren/js/auraBase.js`).

- **Themen:** Elemente, Münzen & Schätze, Weltraum & Magie, Lustig & Glitch (je 12 bis 13 Auras).
- **Seltenheit, Preis und Bonus:** Gewöhnlich (ab 1.000 Taler, +1 bis 3 %) bis Göttlich (bis 1 Mrd. Taler,
  +18 bis 25 %). Jede Aura verbessert genau eine Sache: Glück, Münzwert, Erfahrung oder Tempo.
- **Grundpaket je Seltenheit** (addiert sich nach oben, so erkennt man die Stufe sofort): Gewöhnlich
  Bodenleuchten und Licht · Selten leuchtender Umriss · Episch Pulswellen und Glimmer · Legendär
  Lichtstrahlen und Funkelsterne · Mythisch zwei Energieringe mit Lichtläufern · Göttlich Strahlenkranz,
  Schockwelle und Leuchtkörper.
- **Effekte:** aufsteigende und fallende Teilchen, Wirbel, Feuerwerk, kreisende Dinge (Münzen, Edelsteine,
  Planeten, Katzen …), Bodenkreise mit Runen, Heiligenschein, Krone, Flügel, Lichtsäule, Hülle,
  Lichtbänder, Blitze und Glitch-Doppelgänger. Was eine Aura zeigt, steht in ihrem `look`.
- **Spiel:** Shop-Reiter „Auras“ mit 3D-Vorschau. Kaufen legt die Aura gleich an; man trägt immer eine.
  Glück, Münzwert und Erfahrung wirken schon beim simulierten Fund, Tempo erst im Roblox-Spiel.
- **Roblox:** Module `AuraData` und `AuraFx`, das Skript `CoinmasterAuras` (Server, prüft Kaufen und
  Anlegen über die RemoteFunction `AuraRemote`, Taler aus `leaderstats.Taler`) und `CoinmasterAuraClient`
  (zeichnet die Aura jedes Spielers aus ParticleEmittern, Beams, Trails, Neon-Teilen, Highlight und Licht,
  samt Grundpaket je Seltenheit). Roblox zeigt höchstens 31 Highlights gleichzeitig; im Showcase fehlen
  Umriss und Glitch-Flackern deshalb. Dazu
  `Workspace › CoinmasterAuraShowcase` mit allen 50 Auras an Figuren. Zum Testen in Studio Play drücken
  und im Chat `/aura krone` schreiben. Gekaufte Auras werden noch nicht gespeichert (DataStore fehlt).
  Eigene Teilchenbilder (Münze, Herz, Note …) als Decal-IDs in `AuraData.Textures` eintragen.

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
- **Shop:** Eier, Boosts und Auras für Taler, Robux-Angebote nur angedeutet.
- **Einstellungen** (`js/settings.js`): gelten für alle Seiten, z. B. Grafikqualität der
  3D-Ansichten und „Animationen überspringen“ für Entdeckung und Schlüpfen.

Tastenkürzel: K Skills, I Inventar, B Shop, O Einstellungen, F Münze suchen, Esc schließt.

## Nach Roblox Studio übertragen

`roblox/` erzeugt aus den Daten der Webseite ein Paket für Roblox Studio. Die Seite ist mit
einem Code gesperrt. Der Code steht nur als SHA-256-Hash in `roblox/js/main.js`. Das hält
Neugierige ab, ist aber kein echter Zugriffsschutz, weil die Seite komplett im Browser läuft.

- **Installer** (`roblox/js/luau.js`): ein Skript für die Befehlsleiste von Studio. Es legt
  `ReplicatedStorage › CoinmasterAdventure` mit 11 ModuleScripts an (CoinData, MutationData,
  EggData, WorldData, Gacha, CoinBuilder, MutationFx, WeatherFx, EggBuilder, AuraData, AuraFx), fertige
  Modelle in `Coins` und `Eggs`, einen Showcase im Workspace mit allen Münzen und Eiern und einen mit allen Auras.
- **Motive als ZIP**: die 50 Prägemotive als PNG zum Hochladen als Decal. Die Asset-IDs
  kommen in `CoinData` bei `DecalId`.

`WorldData` enthält Planeten, Welten (Preis, Glück, Münzwert), Portale und die Wiedergeburt.

- **Welten als Modelle** (`roblox/js/worldParts.js`, `roblox/js/rbxmx.js`): Schritt 4 auf der
  Seite lädt ein ZIP mit allen 16 Inseln als `.rbxmx`-Dateien (in Studio: Rechtsklick auf
  Workspace → *Insert from File…*). Jede Form wird auf Roblox-Grundformen zurückgeführt (Block,
  Zylinder, Kugel per SpecialMesh), der Boden wird zu Säulen entlang der Hügel. Pro Welt ein
  Model mit den Ordnern `Insel`, `Deko`, `Muenzen` (Teile „CoinSpawn“), `Teleport`
  („TeleportPad“), `Himmel`, `Effekte` (PointLights, ParticleEmitter) und `Einstellungen`.
  Maßstab: 1 Einheit = 8 Studs, eine Insel ist rund 256 Studs breit. Animationen fehlen in Studio noch.

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
- `auren/` – Auras: `js/auras.js` (Daten, Preise, Boni), `js/auraFactory.js` (3D-Effekte mit Grundpaket je Seltenheit), `js/auraBase.js` (Figur, Texturen, Bausteine), `js/main.js` (Galerie)
- `welten/` – Weltkarte: `js/worlds.js` (Daten), `js/worldFactory.js` (3D-Inseln), `js/thumbs.js` (Vorschaubilder)
- `spiel/` – Spiel-Oberfläche: `js/skills.js` (Skilltree-Daten), `js/state.js` (Spielstand, Level, Effekte), `js/panels/` (Fenster)
- `js/nav.js` – gemeinsame Navigation (klebende Leiste mit gleitender Messing-Markierung und Münz-Klang, auf dem Handy ausklappbares Menü) und „Nach oben“-Knopf für alle Seiten
- `roblox/` – Export nach Roblox Studio: `js/luau.js` (Luau-Code), `js/auraLuau.js` (Auras), `js/zip.js` (ZIP), `js/main.js` (Sperre, Downloads)
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
