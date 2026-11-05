# Coinmaster Adventure

Vorschau-Seite mit allem, was wir für das Spiel bauen. Die Startseite (`index.html`) zeigt jeden
Bereich als Kachel, jeder Bereich liegt in einem eigenen Ordner.

## Roblox-Vorschau (1:1)

Die Vorschauen sollen genau zeigen, wie es in Roblox aussieht. Dafür hat die Seite eine kleine
Roblox-Engine (`js/rbx/`):

- `engine.js` zeichnet Roblox-Klassen nach Roblox-Regeln: Teile (Block, Ball, Cylinder, Wedge,
  SpecialMesh Sphere/Head), Materialien (`materials.js`, Struktur in Weltkoordinaten), Decals, Licht
  (Lighting mit Uhrzeit, Atmosphere, Nebel, PointLights, Schatten), ParticleEmitter (Rate, Lifetime,
  Speed, SpreadAngle, Drag, Acceleration, Size/Transparency/Color-Sequenzen, LightEmission), Beams,
  Trails, Highlight (Umriss um die ganze Figur), BillboardGui und SurfaceGui (`gui.js`) und den
  Roblox-Standardhimmel. Alles in Studs.
- `lua.js` und `runtime.lua.js` führen den Luau-Code aus dem Installer im Browser aus (fengari, Lua 5.3)
  mit Roblox-API: Vector3, CFrame, Color3, Sequenzen, Enum, Instance.new, Signale, TweenService,
  task.wait/delay, RunService, workspace:BulkMoveTo. Die Vorschau führt also dieselben Skripte aus wie
  Roblox, nicht eine Nachbildung.
- Grenzen: Die Teilchenbilder (`rbxasset://…`) sind nachgezeichnet, weil die Originale nur in Studio
  liegen. Neon leuchtet ohne Bloom. Die Vorschau rechnet mit 8 Punktlichtern gleichzeitig.

Umgestellt sind bisher Auras, Welten, das Wetter in den Welten, der Spiel-Hintergrund, Münzrollen, der Münzbaumgarten und alle Münzen
(Münzkabinett, Münzindex mit Entdeckungs-Animation, Wetter-Seite, Startseite), Eier mit Schlüpfen, alle
Haustiere und die ganze Spiel-Oberfläche: HUD, Menü und alle Fenster.

| Bereich | Ordner | Status |
|---|---|---|
| Münzkabinett | `muenzen/` | Vorschau |
| Münzindex | `muenzindex/` | Spielvorschau |
| Eierhalle | `eier/` | Vorschau |
| Münzrollen | `rollen/` | Vorschau |
| Münzbaumgarten | `garten/` | Vorschau |
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

50 3D-Münzen in 10 Seltenheitsstufen. **Roblox-Vorschau:** Jede Münze ist genau die, die `CoinBuilder` und
`MutationFx` in Roblox bauen (`muenzen/js/coinRoblox.js`): gestufte Prägung aus Randscheibe, Münzkörper
und Motivplatte, ein Perlkreis und das Motiv als Decal auf beiden Seiten (so, wie es nach dem Hochladen
der Motive und dem Eintragen der `DecalId` aussieht). Stufen-Effekte und Mutationen kommen aus denselben
Skripten. Die Beschreibung unten gilt für die gezeichneten Motive (`emblems.js`), die als Decals dienen.

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

Sieben Eier (`eier/js/eggs.js`), 1:1 wie in Roblox: Jedes Ei baut das Modul `EggBuilder` aus dem
Installer (Ei auf Sockel mit Leuchtband, Extras je Ei), die Seite führt es aus (`eier/js/eggRoblox.js`).

| Ei | Stufe | Preis (Vorschlag) | Extras in Roblox |
|---|---|---|---|
| Normal Egg | Normal | 250 Münzen | – |
| Wald Egg | Selten | 2.500 Münzen | Moos-Material, Pilze am Sockel |
| Eis Egg | Episch | 15.000 Münzen | Eis-Material, Kristalle |
| Engels Egg | Engelsgleich | 75.000 Münzen | Heiligenschein, Flügel |
| Galaxie Egg | Galaktisch | 400.000 Münzen | Glas, Sternenring, Funkeln |
| Admin Egg | Admin | nicht kaufbar | Diamond-Plate, Neonband |
| Release Egg (Robux Egg) | Limitiert | R$ 199 | Folie, Schleife, Funkeln |

**Schlüpfen** zeigt das Roblox-Modul `HatchFx`: Das Ei wackelt immer stärker (seltene Eier länger), leuchtet
auf und platzt mit Lichtblitz, Funken und Druckwelle. Dann wächst das Tier heraus, darüber stehen Name und
Chance (BillboardGui); epische Tiere bekommen einen Lichtkranz. Das Tier wird nach Schlupfchance gewürfelt.
Tippen spult vor. In Roblox: `HatchFx.Play(eggId, petId, { CFrame = …, Parent = … })`, am besten auf dem
Client; das Tier zieht `PetData.Roll(eggId)`.

## Münzrollen

Das Glücks-Item zum Aufreißen (`rollen/`): Papierrollen voller Schätze für den Münzbaumgarten. Beim Öffnen
wackelt die Rolle, hebt ab, dreht sich immer schneller und reißt auf. Papierfetzen und Konfetti fliegen, dann
springen **Münzbäume und Gartenwerkzeug** einzeln heraus, das Seltenste zuletzt. Seltenes kommt mit Blitz und
Druckwelle, vor einer legendären oder selteneren letzten Sache gibt es eine kurze Pause mit Lichtsog.
Die Rollen kosten Taler aus dem Garten, der Inhalt landet im Inventar des Gartens.

| Rolle | Stufe | Inhalt | Glück | Garantie (letzte Sache) | Preis (Vorschlag) |
|---|---|---|---|---|---|
| Kupferrolle | Normal | 3 | ×1 | – | 500 Taler |
| Silberrolle | Selten | 4 | ×1,6 | ab Selten | 5.000 Taler |
| Goldrolle | Episch | 5 | ×2,5 | ab Episch | 40.000 Taler |
| Juwelenrolle | Mystisch | 6 | ×4 | ab Legendär | 250.000 Taler |
| Sternenrolle (Robux-Rolle) | Limitiert | 8 | ×6 | ab Legendär | R$ 149 |

- **Chancen:** Grundchance je Seltenheit Gewöhnlich 55 %, Selten 27 %, Episch 11 %, Legendär 5 %, Mythisch 1,6 %,
  Göttlich 0,4 %. Gewicht = Chance × Glück ^ (Stufe / 5), Göttlich bekommt also den vollen Faktor (1,72 % bei der
  Sternenrolle). Innerhalb einer Seltenheit ist jede Sache gleich wahrscheinlich. Die Garantie greift nur, wenn
  vorher nichts so Seltenes kam. Rechnung: `rollen/js/rolls.js`.
- **Roblox:** `RollData` (`TierChances`, `Open`), `RollBuilder.Build(roll)` (Rolle auf Sockel) und
  `RollFx.Play(rollId, itemIds, { CFrame = …, Parent = … })` (`roblox/js/rollLuau.js`). Auf dem Server
  `RollData.Open(rollId)` würfeln, auf dem Client mit den Ids `RollFx.Play` zeigen.

## Münzbaumgarten

`garten/`: Ein kleiner Garten, den man für **25.000 Taler** kauft (4 Beete, erweiterbar bis 12; jedes weitere Beet
kostet 15.000 Taler, danach jeweils das Doppelte). Bäume pflanzt man in Beete. Sie wachsen in drei Stufen
(Setzling, Jungbaum, ausgewachsen) und tragen dann Münzen. Jede Ernte bringt Taler, höchstens 3 Ernten warten am
Baum. Die Vorschau hat einen Zeitraffer (×1, ×10, ×60) und speichert im Browser.

| Münzbaum | Seltenheit | Wachsen | Ernte | Taler je Ernte |
|---|---|---|---|---|
| Pfennigbusch | Gewöhnlich | 1 min | alle 30 s | 40 |
| Kupferbaum | Gewöhnlich | 2 min | alle 45 s | 90 |
| Silberbirke | Selten | 4 min | alle 1 min | 300 |
| Talertanne | Selten | 5 min | alle 1 min 15 s | 420 |
| Goldeiche | Episch | 10 min | alle 1 min 30 s | 1.500 |
| Dukatenkirsche | Episch | 9 min | alle 1 min 20 s | 1.300 |
| Kristallweide | Legendär | 20 min | alle 2 min | 6.000 |
| Drachenpalme | Mythisch | 40 min | alle 2 min 30 s | 25.000 |
| Sternenbaum | Göttlich | 1 h | alle 3 min | 120.000 |

| Werkzeug & mehr | Seltenheit | Wirkung |
|---|---|---|
| Talerbeutel | Gewöhnlich | +750 Taler |
| Blechkanne | Gewöhnlich | Baum wächst 1 min schneller |
| Kupferkanne | Selten | 5 min schneller |
| Dünger | Selten | ×2 Ernte für 10 min |
| Goldkanne | Episch | 30 min schneller |
| Goldener Spaten | Legendär | +1 Beet |
| Regenbogenkanne | Legendär | Baum sofort ausgewachsen |
| Zauberdünger | Mythisch | ×3 Ernte für 30 min |
| Talertruhe | Göttlich | +250.000 Taler |

- **Roblox** (`roblox/js/gardenLuau.js`): `GardenData` (Bäume, Werkzeug, `Stage`, `Ripe`, `HarvestValue`,
  `BedPrice`), `LootBuilder` (`Tree(tree, stage, ripe)`, `Tool(tool)`, `Build(item)`) und
  `GardenBuilder.Build({ Beds, Plots })` (Wiese, Zaun mit Tor und Schild, Beete mit Nummern, Bäume).
  Der Installer baut `Workspace > CoinmasterGarden` mit allen Bäumen.

### Im Spiel (Roblox)

- **Spiel-Oberfläche:** Menüknopf **🌱 Garten** öffnet das Fenster mit drei Reitern: *Beete* (Wachstum, Countdown,
  Ernten, Ausgraben, „Alles ernten“, Beet kaufen), *Sachen* (Inventar aus den Rollen: Bäume und Kannen auswählen
  und dann ein Beet antippen, Talerbeutel und Spaten direkt benutzen) und *Rollen* (kaufen und öffnen). Nach dem
  Öffnen spielt `GameUI.PlayRoll` die Animation `RollFx` vor dem Spieler. „🚪 Zum Garten“ teleportiert zum Garten.
- **Server** (`ServerScriptService > CoinmasterGarden`): RemoteFunction `GardenRemote` mit `openRoll` und den
  Garten-Aktionen aus `GardenData.Act` (buyGarden, buyBed, plant, use, harvest, dig). Der Server würfelt, prüft
  Taler, Beete und Inventar und schreibt den Stand als JSON ins Attribut `Garden`. Mindestens 0,2 s zwischen
  zwei Aufrufen.
- **Speichern:** mit dem ganzen Spielstand über `PlayerData` (Attribut `Garden`, siehe „Speichern in Roblox“).
  Garten-Aufträge gibt es erst, wenn der Spielstand geladen ist. Robux-Rollen werden erst bestätigt, wenn der
  Kauf gespeichert ist.
- **Robux-Rolle:** Developer Product anlegen und die Id oben im Skript in `ROLL_PRODUCTS` eintragen
  (`[ProductId] = "stern"`). Jeder Kauf wird mit seiner `PurchaseId` gemerkt und zählt nur einmal. Achtung:
  `ProcessReceipt` darf im Spiel nur ein Skript setzen.
- **Garten in der Welt** (`StarterPlayerScripts > CoinmasterGardenClient`): baut den eigenen Garten mit
  `GardenBuilder` (nur für den Spieler sichtbar) auf einem Part **`GartenPlatz`** im Workspace, sonst bei
  (0, 0, −160). Neu gebaut wird, wenn ein Baum wächst oder reift.
- **Vorschau:** Die Spiel-Oberfläche (`spiel/`) zeigt dasselbe Fenster. Käufe rechnet dort `gardenAct` in
  `garten/js/garden.js`, die JS-Fassung von `GardenData.Act`.

## Haustiere

`haustiere/` zeigt alle 49 Haustiere aus den Claude-Design-Projekten „Haustiere“ und „Haustiere Roblox“, sieben pro Ei:
fünf häufige (25 / 22 / 20 / 15 / 10,5 %) und zwei epische (5 / 2,5 %).

- **1:1 wie in Roblox:** Jedes Tier besteht aus Roblox-Teilen (Blöcke, Kugeln, Zylinder), umgewandelt aus
  den Roblox-Stil-Bauplänen (`roblox/js/petParts.js`). Genau diese Teile stehen in der Datei
  `Haustiere.rbxmx` (Seite „Nach Roblox Studio“, Schritt 5). Normale Tiere sind 3 Studs hoch, epische 3,6.
  Die runden Kanten, Konturen und Effekte der früheren Fassung gibt es so in Roblox nicht.
- **Roblox:** `PetData` (Tiere, Chancen, `Roll`), `PetBuilder.Build(petId)` klont das Tier aus dem Ordner
  `Haustiere` (fehlt er, gibt es eine Ersatzkugel). Ein neuer Import des Installers behält den Ordner.
- `haustiere/js/rbx-kit.js`, `rbx-a/b/c.js` – Roblox-Baupläne, daraus werden die Teile
- `haustiere/js/pets.js` – Daten, Schlupfchancen, `rollPet(eggId)`
- `haustiere/js/petFactory.js` und `builders-a/b/c.js` – 3D-Baupläne (auch die erste Fassung)
- `haustiere/js/exportGlb.js` – Export als .glb für Blender (einzeln oder alle 49)


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
- **Roblox-Vorschau:** Die 3D-Ansicht zeigt die Insel so, wie sie nach dem Import in Roblox aussieht:
  dieselben Teile wie die `.rbxmx`-Datei, Roblox-Licht und -Himmel und das Wetter aus dem Modul
  `WeatherFx` (`welten/js/robloxWorld.js`). Animationen der Insel (Wasser, Lebewesen) gibt es in Roblox
  noch nicht, darum steht auch die Vorschau still.
- **Licht je Welt:** Jede Welt bringt im Ordner `Licht` eine Atmosphere (Himmelsfarben) und
  Lighting-Werte mit (`worldLighting` in `roblox/js/worldParts.js`). Das Skript
  `CoinmasterWorldLighting` setzt sie im Spiel für die Welt, in der man ist; die Vorschau nutzt dieselben Werte.
- **Größenvergleich** (Knopf in der 3D-Ansicht): stellt eine normal große Roblox-Figur (gut
  5 Studs, klassische Block-Proportionen) neben die Teleport-Plattform und fährt die Kamera hin.
  Eine Insel ist rund 256 Studs breit, also etwa 64 Figuren nebeneinander
  (`welten/js/character.js`).
- `welten/js/worlds.js` – Daten (Preise, Boni, Portale, Wiedergeburt), `js/worldFactory.js` –
  entwirft die Inseln (daraus macht `roblox/js/worldParts.js` die Roblox-Teile), `js/robloxWorld.js` –
  Roblox-Vorschau, `js/thumbs.js` – Vorschaubilder.

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

- **3D-Wetter:** Die Weltkarte (Auswahl „Wetter“), die Wetter-Seite und der Spiel-Hintergrund führen
  das Roblox-Modul `WeatherFx` aus: Licht, Nebel, Partikel und Blitze genau wie im Spiel.
- **Spiel:** Ansage beim Wetterwechsel, Fenster „Wetter“ (Taste V oder Wetter-Anzeige antippen) mit
  Vorhersage und allen Wettern.
- **Roblox:** Modul `WeatherFx` (Licht, Nebel, Partikel, Blitze, Ansage) und zwei Skripte, die der
  Installer anlegt: `CoinmasterWeather` (Server) und `CoinmasterWeatherClient`.

## Auras

`auren/` zeigt 50 Auras, die um die Spielerfigur leuchten, als Galerie mit Filtern nach Thema und
Seltenheit und einer drehbaren Detailansicht (`auren/js/auras.js` für die Daten). Jede Vorschau führt die
Roblox-Module `AuraData` und `AuraFx` aus und zeigt die Aura an einer Roblox-Figur auf einer Baseplate,
genau wie nach `/aura <id>` in Studio (`auren/js/auraRoblox.js`).

- **Themen:** Elemente, Münzen & Schätze, Weltraum & Magie, Lustig & Glitch (je 12 bis 13 Auras).
- **Seltenheit, Preis und Bonus:** Gewöhnlich (ab 1.000 Taler, +1 bis 3 %) bis Göttlich (bis 1 Mrd. Taler,
  +18 bis 25 %). Jede Aura verbessert genau eine Sache: Glück, Münzwert, Erfahrung oder Tempo.
- **Grundpaket je Seltenheit** (addiert sich nach oben, so erkennt man die Stufe sofort): Gewöhnlich
  Bodenleuchten und Licht · Selten leuchtender Umriss · Episch Pulswellen und Glimmer · Legendär
  Lichtstrahlen und Funkelsterne · Mythisch zwei Energieringe mit Lichtläufern · Göttlich Strahlenkranz,
  Schockwelle und Leuchtkörper.
- **Effekte:** aufsteigende und fallende Teilchen, Wirbel, Feuerwerk, kreisende Dinge (Münzen, Edelsteine,
  Planeten, Katzen …), Bodenkreise mit Runen, Heiligenschein, Krone, Flügel, Lichtsäule, Hülle,
  Lichtbänder, Blitze und Glitch-Flackern. Was eine Aura zeigt, steht in ihrem `look`; gebaut wird sie von
  `AuraFx` in `roblox/js/auraLuau.js`.
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

`spiel/` zeigt die UIs des Spiels als bedienbare Vorschau. **Die ganze Oberfläche ist die echte
Roblox-Oberfläche**: HUD, Menü, Hinweise, Wetter-Ansage und alle Fenster (Shop, Inventar, Welten,
Skilltree, Einstellungen, Wetter, Belohnungen, Codes, Ranglisten). Das Modul `GameUI` aus dem Installer
baut sie als ScreenGui, die Seite führt es aus und zeichnet die ScreenGuis über der Welt
(`js/rbx/screen.js`, mit Roblox-Layout: UDim2, AnchorPoint, UIListLayout, UIGridLayout, UIPadding,
UIScale, UIAspectRatioConstraint, ScrollingFrame, TextBox zum Tippen). Die Seite spielt dabei den Server:
Spielstand als Attribute, Aktionen und Daten über Rückrufe.

- **HUD:** Level-Abzeichen, EP-Balken, Skillpunkte, Welt, Taler, Wetter mit Countdown, aktive Boosts,
  Menü (Welten, Skills, Inventar, Shop, Index, Optionen) und „Münze suchen“, das einen Fund simuliert.
  Funde und Käufe erscheinen als Hinweise (`GameUI.Toast`).
- **In Roblox:** `GameUI.Start()` läuft im LocalScript `CoinmasterUI`. Den Spielstand liest es aus
  Attributen am Spieler (`Taler` oder `leaderstats.Taler`, `Level`, `XP`, `XPMax`, `Points`, `WorldName`,
  `Aura`, `OwnedAuras`, `Egg_<id>`, `Boost_<id>`, dazu `Coins`, `Slots`, `World`, `Worlds`, `Portals`,
  `Rebirths`), das Wetter aus `ReplicatedStorage`. Käufe und Aktionen gehen an die RemoteFunctions
  `ShopRemote` (Server-Skript `CoinmasterShop`: Eier, Boosts, Münzen verkaufen, Welten kaufen,
  Teleport, Portale, Wiedergeburt), `PlayerRemote` (Server-Skript `CoinmasterPlayer`: Skills,
  Belohnungen, Codes, Einstellungen, Ranglisten) und `AuraRemote`. Weitere Attribute: `Skills`
  (`"kern:1,beutel:2"`), `DailyDay`, `DailyStreak`, `WheelDay`, `Group`, `Codes` und `Set_<Einstellung>`.
  Die Codes stehen nur im Server-Skript, nicht im Spiel. Die Wettervorhersage rechnet der Client aus
  der Uhrzeit (`Gacha.CurrentWeather`), die Ranglisten zeigen in Roblox die Spieler auf dem Server.
- **Inventar** (Taste I): Münzen sortieren (neu, Wert, selten, Name), nach Stufe filtern, nur Mutationen.
  Gleiche Münzen mit gleicher Mutation liegen als Stapel (×3); man verkauft eine, den ganzen Stapel oder
  alle normalen auf einmal. Eier mit Anzahl. In Roblox hält der Server die Stapel im Spielstand und schickt
  sie über das RemoteEvent `InventoryEvent`: beim Start alles, danach nur geänderte Stapel.
- **Welten** (Taste W): Teleport-Menü je Planet mit Welt-Karten (kaufen, teleportieren), Portal-Banner
  mit Bedingungen und Wiedergeburt (siehe oben). Die Regeln stehen einmal in `WorldData` (`CanBuy`,
  `PortalChecks`, `CanOpenPortal`) und gelten für Server und Oberfläche. Der Teleport setzt in Roblox
  das Attribut `World` und stellt die Figur an den Spawn des Modells `Welt_<Name>`. „+ Test-Taler“ gibt
  es nur in der Vorschau.
- **Skilltree** (Taste K, Daten in `spiel/js/skills.js`, in Roblox `SkillData`): Kern plus vier Äste
  mit je fünf Skills (Erkundung, Münzen & Glück, Eier & Haustiere, Komfort). Skillpunkte kommen aus
  Leveln (jedes Level 1, jedes fünfte 2). Glück, Wert, Doppelfund, Wettergespür, Goldene Hand,
  Feilscher und Großer Beutel wirken in der Vorschau schon; die Erkundungs-Skills gelten später in den
  Welten. Sichtbar sind nur Skills, deren Vorgänger man gelernt hat. Der Baum besteht aus Frames
  (Linien sind gedrehte Frames); „+“ zoomt um den gewählten Skill.
- **Shop** (Taste B): Eier, Boosts und Auras für Taler, Robux-Angebote nur angedeutet.
- **Wetter** (Taste V): Vorhersage der nächsten Phasen und alle Wetter mit ihrer Mutation.
- **Belohnungen** (`spiel/js/rewards.js`, in Roblox `RewardData`): tägliches Geschenk mit Serie,
  Glücksrad (aus gedrehten Frames, dreht per TweenService) und Gruppen-Bonus.
- **Codes:** Eingabe im TextBox, Enter oder „Einlösen“.
- **Ranglisten:** Taler, Münzen, Wiedergeburten, Level, mit deinem Platz (in der Vorschau mit
  Beispiel-Spielern).
- **Einstellungen** (Taste O, `js/settings.js`): gelten für alle Seiten, z. B. Grafikqualität der
  3D-Ansichten und „Animationen überspringen“. In Roblox stehen sie als Attribute `Set_…` am Spieler.

**Design-System** (Modul `UITheme`): alle Farben, Schriften, Textgrößen (Tiny 12 bis Hero 34), Ecken,
Abstände und Bewegungen der Oberfläche an einer Stelle. Bewegungsregeln: `Fast` 0,12 s (Maus drüber),
`Normal` 0,22 s (Fenster, Balken), `Pop` 0,22 s mit Überschwingen (Öffnen, Drücken, Hinweise), `Slow`
0,4 s (Belohnungen), `Exit` 0,16 s (Schließen, schneller als Öffnen). Fenster öffnen und schließen animiert.

**Neu füllen nur wenn nötig:** Jedes Fenster kennt seine Daten (`deps`, z. B. der Shop: Taler, Eier,
Boosts, Auras). Ändert sich etwas anderes, bleibt es stehen; mehrere Änderungen im selben Bild ergeben einen
Neuaufbau. Countdowns (Wetter, Belohnungen, Boosts im HUD) ändern jede Sekunde nur ihren Text.

**Spielgefühl:** Taler zählen hoch statt zu springen, ein grünes „+500“ steigt neben dem Taler-Feld auf
und das Feld wippt; der EP-Balken gleitet (bei einem neuen Level erst voll, dann von vorn). Beim Verkaufen
fliegen Münzen vom Knopf zum Taler-Feld (`GameUI.FlyCoins`). Funde zeigt `GameUI.Found` je nach Seltenheit:

| Stufe | Seltenheit | Effekt |
| --- | --- | --- |
| 1 | Normal, Selten | Hinweis |
| 2 | Sehr selten, Episch | Fundkarte mit Glanz über „Münze suchen“ |
| 3 | Legendär, Mystisch, Engelsgleich | dazu Bildschirm-Blitz, Funken und große Ansage |
| 4 | Göttlich, Galaktisch, Unerreichbar | alles stärker und länger |

Eine Mutation hebt um eine Stufe. „Animationen überspringen“ zeigt nur den Hinweis, „Weniger Partikel“
weniger Funken.

Test-Knöpfe nur in der Vorschau: „+ Test-Taler“, „Test: Wetter“, „Test: nächster Tag“, „Test:
Spielstand neu beginnen“.

Tastenkürzel: W Welten, K Skills, I Inventar, B Shop, V Wetter, O Einstellungen, F Münze suchen,
Esc schließt.

## Speichern in Roblox

Das Modul `PlayerData` (ServerScriptService > CoinmasterServer, gestartet vom Skript `CoinmasterData`)
lädt und speichert den Spielstand im DataStore `CoinmasterAdventure` (ein Profil pro Spieler):

- **Session-Lock:** Nur ein Server hält ein Profil. Ein zweiter wartet, bis der erste freigibt; ein
  Lock von einem abgestürzten Server gilt nach 15 Minuten als frei.
- **Sicher speichern:** jeder Zugriff mit bis zu drei Wiederholungen, Autosave alle 2 Minuten, beim
  Verlassen und beim Herunterfahren (`BindToClose`).
- **Versionsnummer:** `PlayerData.Migrate` bringt ältere Profile auf den neuesten Stand.
- **Was gespeichert wird:** `leaderstats.Taler`, die Münz-Stapel und die Attribute (Level, EP, Welten,
  Portale, Wiedergeburten, Auras, Skills, Belohnungen, Codes, Eier, Boosts, Einstellungen, Münzbaumgarten).
- Level-Aufstieg, Skillpunkte, Inventarplätze und Eier-Rabatt rechnet der Server daraus.

In Studio speichert es nur mit „Enable Studio Access to API Services“ (Game Settings > Security);
ohne läuft das Spiel normal, nur ohne Speichern. Getestet ist die Speicher-Logik mit einem Ersatz-DataStore
(Laden, Lock, zweiter Server, alter Lock, Fehler mit Wiederholung, Migration, Stapel).

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
  Maßstab: 1 Einheit = 8 Studs, eine Insel ist rund 256 Studs breit. Dazu der Ordner `Licht` (Atmosphere und
  Lighting-Werte). Animationen fehlen in Studio noch.

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
- `auren/` – Auras: `js/auras.js` (Daten, Preise, Boni, Grundpaket), `js/auraRoblox.js` (Vorschau mit AuraFx), `js/main.js` (Galerie)
- `js/rbx/` – Roblox-Engine und Luau im Browser für die 1:1-Vorschau
- `welten/` – Weltkarte: `js/worlds.js` (Daten), `js/worldFactory.js` (3D-Inseln), `js/thumbs.js` (Vorschaubilder)
- `spiel/` – Spiel-Oberfläche: `js/skills.js` (Skilltree-Daten), `js/state.js` (Spielstand, Level, Effekte), `js/rewards.js` (Belohnungen, Codes, Ranglisten), `js/robloxUi.js` (Roblox-Oberfläche GameUI)
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
