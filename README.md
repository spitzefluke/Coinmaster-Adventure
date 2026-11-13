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
(Münzindex mit Entdeckungs-Animation, Wetter-Seite), Eier mit Schlüpfen
und die ganze Spiel-Oberfläche: HUD, Menü und alle Fenster. Haustiere und Taschen sind vorerst reine Listen.

| Bereich | Ordner | Status |
|---|---|---|
| Münzkabinett | `muenzen/` | Liste |
| Münzindex | `muenzindex/` | Spielvorschau |
| Eierhalle | `eier/` | Vorschau |
| Münzrollen | `rollen/` | Vorschau |
| Münzbaumgarten | `garten/` | Vorschau |
| Haustiere | `haustiere/` | Liste |
| Taschen | `taschen/` | Liste |
| Edelsteine | `edelsteine/` | Liste |
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

`muenzen/` zeigt alle 60 Münzen mit Namen, nach Stufen gruppiert, mit Drop-Tabelle, Stufen-Filter und Suche:
50 Münzen in den zehn Seltenheitsstufen (alle neu, mit neuen Namen, Beschreibungen und Motiven) und zehn
Premium-Münzen aus dem Münzlabor in einer eigenen Stufe. Die 3D-Vorschau gibt es dort nicht mehr; in 3D erscheinen
die Münzen im Münzindex, auf der Wetter-Seite und in der Spiel-Oberfläche. Alle Motive auf einen Blick:
`muenzen/praegungen.html`.

| Stufe | Münzen | Drop-Chance | Münzen (Auswahl) |
|---|---|---|---|
| Normal | 9 | 35 % | Glutfunke, Rostanker, Hufeisen-Heller, Laternentaler, Pfeilschuss, Keimling, Würfelglück, Federkiel, Pilzprinz |
| Selten | 8 | 25 % | Sturmfalke, Frostzahn, Nachtschwinge, Schattenfuchs, Silberkompass, Runenschild, Mondsplitter, Wellenbrecher |
| Sehr selten | 7 | 15 % | Kronjuwel, Schwertkreuz, Schatzkarte, Bienenkönigin, Vierblatt, Goldskarabäus, Schatztruhe |
| Episch | 6 | 9 % | Ouroboros, Kristallherz, Tornadotaler, Sternenhut, Skorpionstachel, Netz der Weberin |
| Legendär | 5 | 5 % | Drachenatem, Titanenhammer, Feuervogel, Meteoritenkern, Löwenherz |
| Mystisch | 4 | 3 % | Geisterflamme, Zeitriss, Runenportal, Schattenkrähe |
| Engelsgleich | 4 | 1,5 % | Himmelsharfe, Lichtfeder, Wolkenschloss, Engelsglocke |
| Göttlich | 3 | 0,9 % | Donnerkeil, Auge des Ra, Weltenbaum |
| Galaktisch | 2 | 0,5 % | Schwarzes Loch, Komet Aurora |
| Unerreichbar | 2 | 0,1 % | Das Unendliche, Das Goldene Huhn |
| Premium | 10 | 5 % | siehe unten |

Normal hat 35 % statt früher 40 %, die 5 % gehen an Premium. Rand, Gravur, Zierband und Effekte je Stufe kommen
weiter aus `TIERS` (Premium: Guilloche-Rosette, Rauten, Glühen, Glanz und Funkeln).

**Premium-Münzen** (aus dem Münzlabor-Artefakt): eigene Stufe mit 5 % Drop-Chance. Jede Münze hat ihren eigenen
Wert (`value`) und ihr eigenes Gewicht innerhalb der Stufe (`weight`). Für Effekte, Ansage und Erfahrung zählt
Premium wie Legendär (`rank`); „Goldene Hand“ hebt nie zu Premium an.

| Münze | Wert | Gewicht | Chance | Besonderheit |
|---|---|---|---|---|
| Pixel-Münze | 40 | 3 | 1,63 % | 8-Bit-Herz aus Würfeln |
| Magma-Kern | 75 | 1,5 | 0,81 % | Lava-Adern im Vulkangestein |
| Jade-Lotus | 120 | 1,2 | 0,65 % | Lotusblüte |
| Uhrwerk | 150 | 0,8 | 0,43 % | Zahnräder im Sichtfenster |
| Galaxie | 300 | 0,5 | 0,27 % | Spiralnebel mit Saturn-Ring |
| Kristall-Prisma | 400 | 0,3 | 0,16 % | Kristall mit Edelstein-Herz |
| Drachenauge | 600 | 0,2 | 0,11 % | Schuppen und Schlitzauge |
| Glitch | 1–999 | 0,15 | 0,08 % | Wert wird beim Finden gewürfelt (`glitchValue`, `Gacha.GlitchValue`) |
| Engelsmünze | 1.000 | 0,08 | 0,04 % | Flügel und Heiligenschein |
| Mystery-Münze | – | 1,5 | 0,81 % | verwandelt sich beim Ziehen in eine zufällige andere Münze (`rollCoin`, `Gacha.RollCoin`) |

**Die Münzen in Roblox:** Jede Münze ist genau die, die `CoinBuilder` und `MutationFx` in Roblox bauen
(`muenzen/js/coinRoblox.js`): gestufte Prägung aus Randscheibe, Münzkörper und Motivplatte, ein Perlkreis und das
Motiv als Decal auf beiden Seiten (nach dem Hochladen der Motive und dem Eintragen der `DecalId`). `CoinData` hat
dafür je Münze `Value`, `Weight` und `Special` und je Stufe `Rank`; `CoinData.BaseValue(coin)` liefert den Nennwert.
Die Motive sind als Relief gezeichnet (`muenzen/js/emblems.js`): erhabene Flächen, Rillen und Vertiefungen, gefärbt
in den Metallfarben der Münze.

## Münzindex

Sammelbuch mit einem Fach je Münze (60). „Münze ziehen“ zieht nach Drop-Chance. Neue Münzen werden mit einer
Entdeckungs-Animation enthüllt, doppelte erhöhen nur den Zähler. Die Mystery-Münze zählt im Index und verwandelt
sich dann in eine zufällige andere Münze. Der Fortschritt liegt im `localStorage` des Browsers.

Die Animation (`muenzindex/js/discovery.js`) lädt eine „?“-Münze Stufe für Stufe bis zur echten
Seltenheit auf. Je seltener, desto mehr Stufen, desto länger: etwa 2,5 s bei Normal bis 10 s bei
Unerreichbar (Premium wie Legendär). Ab einer Stufe kommen Effekte dazu und bleiben für alle höheren:

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

Tippen überspringt bis zur Enthüllung. Unter „Animationen testen“ lässt sich jede einzelne Münze abspielen,
auch mit einer Mutation oder einer Kombination (z. B. GIGANT + Sturzflut).

## Wetter & Mutationen

Während eines Wetters kann jede gezogene Münze mutieren (`muenzen/js/mutations.js`). Die Chance gilt nur, solange
das passende Wetter läuft. Die Mutation bleibt dauerhaft an der Münze sichtbar und multipliziert ihren Wert.

| Wetter | Mutation | Chance | Wert | Effekt |
|---|---|---|---|---|
| Regen | Sturzflut | 3 % | ×1,1 | Wasserfilm, rinnende Tropfen, Pfütze mit Ringen |
| Erdbeben | Felsenhaut | 2,5 % | ×1,25 | Risse und Felsbrocken, Staub bei jedem Beben |
| Schneesturm | Permafrost | 2,5 % | ×1,3 | Eisblumen, tropfende Eiszapfen, kalter Nebel |
| Disconacht | Discofieber | 2 % | ×1,5 | Spiegelkacheln im Takt, Discokugel, Tanzfläche |
| Gewitter | Hochspannung | 2 % | ×1,75 | Blitzeinschläge, kriechende Ladungen |
| Blutmond | Höllenglut | 1,5 % | ×2 | Lavarisse, Hörner, Beschwörungskreis |
| Neonsturm | Neonrausch | 1,2 % | ×2,5 | Op-Art, Neon-Formen, laufende Farben |
| Datensturm | Systemfehler | 1 % | ×3 | Code-Spalten, Scanlinien, Pixelzerfall |
| Goldregen | Midas-Gold | 1 % | ×4 | massives Gold, Goldtropfen, Münzregen |
| Sternschnuppen | Sternenstaub | 0,6 % | ×5 | Sternenmetall, Spiralgalaxie, Planeten |
| Riesenmond (neu) | GIGANT | 3 % | ×10 | die Münze wächst auf das 3,5-Fache, samt allen anderen Mutationen |

Die Ids der Mutationen (`nass`, `gestein` … `kosmisch`, neu `big`) sind gleich geblieben, nur Namen und Texte sind
neu. Die Chancen stammen aus dem Münzlabor.

**Mehrere Wetter gleichzeitig:** Neben dem Hauptwetter gibt es eine zweite, seltenere Spur im Zeitplan, das
**Nebenwetter** (`sideWeatherAt`, `weathersAt` in JS; `Gacha.SideWeatherAt`, `Gacha.WeathersAt` in Luau; Gewicht von
„klar“ dort `SIDE_CLEAR = 100`). Es ist nie dasselbe Wetter wie das Hauptwetter. Rechnerisch läuft an einem Tag etwa
3 Stunden ein Nebenwetter und rund 20 Minuten laufen zwei Wetter gleichzeitig. Dann würfelt jedes Wetter seine
Mutation, und eine Münze kann beide bekommen: Sie stehen dann zusammen an der Münze, die Multiplikatoren werden
multipliziert (GIGANT + Sturzflut = ×11).

- **Spielstand:** Mutationen als Text, mehrere mit Komma in fester Reihenfolge (`"nass,big"`): `mutationKey`,
  `parseMutations`, `mutationsMultiplier`, `mutationsName` (stärkste zuerst: „GIGANT + Sturzflut“); in Luau
  `MutationData.Parse`, `Key`, `Multiplier`, `Name`, `Combo` und `Gacha.RollMutations(weatherIds)`.
- **Roblox:** Der Wetter-Server setzt zusätzlich `Weather2` und `Weather2Ends` an ReplicatedStorage. Der Client
  zeigt beide Wetter übereinander (`WeatherFx.Apply("regen,riesenmond")`, das seltenste bestimmt Licht und Nebel)
  und kündigt ein neues Nebenwetter an. Das HUD zeigt „Regen + Riesenmond · Sturzflut 3 % · GIGANT 3 %“.
- **GIGANT:** `MutationFx.Apply(model, "nass,big")` bringt erst alle anderen Effekte an und vergrößert dann die ganze
  Münze samt Partikeln, Lichtern und Bändern (`MutationFx.ScaleModel`); Animationen rechnen mit dem Maßstab
  (`FxScale`) weiter.
- **Riesenmond:** riesiger, warm leuchtender Mond mit Kratern und Hof, schwebende Staubflocken, Nachtlicht.

Gefundene Mutationen erscheinen als Punkte an jedem Fach im Münzindex, insgesamt 60 × 11 = 660. Auf der
Wetter-Seite lässt sich jede Mutation an einer Münze ansehen; läuft ein Nebenwetter, steht es dort unter dem
aktuellen Wetter.

## Eierhalle

Elf Eier (`eier/js/eggs.js`, Reihenfolge wie im Design „Tier-Eier“), 1:1 wie in Roblox: Jedes Ei baut das Modul `EggBuilder` aus dem
Installer, die Seite führt es aus (`eier/js/eggRoblox.js`). Der Luau-Code steht in `roblox/js/eggLuau.js`.
Die Eier stammen aus Claude Design („Tier-Eier“): eine facettierte Schale aus 70 Stücken in zehn verdrehten
Streifen, darin ein leuchtender Kern, der durch die Fugen scheint. Das Ei steckt in einem Käfig mit Sockel,
Goldring, zwölf Gitterstäben, Mittel- und Kopfring, Kuppel mit Spitze, zwei umwickelten Ketten und einem
Vorhängeschloss. In Ruhe atmet das Ei, schwebt, dreht sich langsam und der Kern pocht. Alles aus Parts
(Block, Kugel/SpecialMesh, Zylinder, Keile für Kegel), Farben und Welt je Ei in `EGG_THEMES`
(`roblox/js/eggLuau.js`).

| Ei | Stufe | Preis (Vorschlag) | Deko und Welt |
|---|---|---|---|
| Normal Egg | Normal | 250 Münzen | Staub |
| Wald Egg | Selten | 2.500 Münzen | Moos, Fliegenpilze, fallende Blätter |
| Eis Egg | Episch | 15.000 Münzen | Eiskristalle, Schneefall |
| Engels Egg | Engelsgleich | 75.000 Münzen | Heiligenschein, Lichtfunken |
| Galaxie Egg | Galaktisch | 400.000 Münzen | Umlaufbahn mit Mond, Sternenstaub |
| Candy Egg | Süß | 5.000 Münzen | Streusel, Streuselregen |
| Admin Egg | Admin | nicht kaufbar | Glitch-Würfel, Code-Regen |
| Release Egg (Robux Egg) | Limitiert | R$ 199 | Partyhut, Konfetti |
| Atlantis Egg | Versunken | 150.000 Münzen | Korallen, Perle, Luftblasen |
| Lava Egg | Glühend | 1.000.000 Münzen | zuckende Flammen, Glut |
| Cartoon Egg | Gezeichnet | 30.000 Münzen | Partyhut, Streusel, Konfetti |

**Bühne und Umgebung:** `EggBuilder.BuildStage(egg)` baut den neuneckigen Sockel mit Platte, Leuchtkante und
Felsbrocken, den Boden, Haupt-, Kanten- und Sockellicht und die Partikel der Ei-Welt.
`EggBuilder.ApplyEnvironment(egg)` setzt Nebel und Umgebungslicht (gibt eine Funktion zum Zurücksetzen
zurück). Die Detailansicht und das Schlüpfen auf der Seite zeigen das Ei auf dieser Bühne, der Hintergrund
leuchtet in den Farben der Ei-Welt.

**Schlüpfen** zeigt das Roblox-Modul `HatchFx` wie im Design (3,4 s bis zum Platzen): das Schloss zittert und
springt ab, die Ketten fallen, die Gitterstäbe klappen auf und die Kuppel hebt sich; dann glüht der Kern,
das Ei bebt immer stärker, Funken sprühen aus den Fugen und es staucht sich. Beim Platzen fliegen alle
Schalenstücke davon und hüpfen über den Sockel, Blitz, Druckwelle und Funkenregen (ab Stufe 3 Lichtstrahlen),
der Käfig versinkt. Das Tier springt heraus, landet mit Staubring und federt nach. Seltene Tiere bekommen ihren
Auftritt: Leuchten, ab Stufe 4 ein Ring am Boden, ab Stufe 5 Lichtsäule mit Splittern, Stufe 6 zwei Bahnen
(Stufe = Platz im Ei, 0 = häufigstes). Die Seite zeigt den Abschnitt als Text, blitzt beim Platzen und lässt
die Kamera wackeln; Tippen spult vor, „Nochmal“ lässt dasselbe Ei noch einmal schlüpfen.
In Roblox: `HatchFx.Play(eggId, petId, { CFrame = …, Parent = …, Lighting = true, OnPhase = function(abschnitt) … end })`
(Abschnitte `unlock`, `charge`, `burst`, `reveal`, `done`), am besten auf dem Client; das Tier zieht
`PetData.Roll(eggId)`.

Die vier Eier Candy, Atlantis, Lava und Cartoon haben Käfig-Deko und Ei-Welt aus „Tier-Eier“; ihre Pets stehen in
der Pet-Liste (`haustiere/js/pets.js`).

## Münzrollen

Das Glücks-Item zum Aufreißen (`rollen/`): Papierrollen mit einem Schatz für den Münzbaumgarten.

- **Zerreißen:** Die Rolle wackelt, hebt ab und dreht sich immer schneller. Dann teilt sie sich in zwei Hälften
  mit Papierzacken, der Riss glüht, reißt in zwei Rucken auf (Konfetti, Licht), und die Hälften fliegen
  auseinander. In der Rissfläche glänzen die Münzen, eine Lichtsäule schießt nach oben.
- **Rollband:** Farbige Karten (Farbe der Seltenheit, seltene mit Ecken-Steinen) laufen von rechts nach links,
  Lauflichter in Regenbogenfarben, Fahrtwind-Streifen. Rahmen, Markierung und Licht leuchten in der Farbe der
  Karte unter der Markierung. Am Ende pocht das Licht, das Band kriecht, bleibt knapp neben der Mitte stehen
  (oft neben etwas Seltenem) und rastet ein.
- **Gewinn:** springt nach vorne, mit Strahlenkranz (ab Selten), Konfetti und Druckwellen, die mit der Seltenheit
  wachsen; Göttlich mit Regenbogen-Strahlen und drei Wellen.
- **Samen statt Bäume:** Aus der Rolle kommen Samentüten (`LootBuilder.Seed`): bauchige Tüte mit Rand in der Farbe
  der Seltenheit, Baum-Bild, Glanzstreifen, eingerissener Ecke und Samen davor. Gesät wachsen sie im Garten mit
  sichtbarem Timer (Keimling, Schössling, Jungbaum, Knospen, ausgewachsen) zum Münzbaum.
- **Werkzeug-Design:** Gießkannen mit Schulter, Zierband, Nieten, Bügel, Brause mit Löchern und Tropfen; Dünger als
  gebundener Sack mit Etikett und Körnern; Monetenbeutel mit Rüschen, Schleife und Moneten; Spaten mit T-Griff,
  Edelstein-Manschette und runder Spitze; Truhe mit gewölbtem Deckel und Schatzberg. Akzente in der Farbe der
  Seltenheit, ab Episch Licht, ab Legendär Funkeln.
- **Animiertes Wachsen:** `GardenBuilder.Animate(model, zeit, dt)` jedes Bild: Bäume wachsen stufenlos mit dem
  Fortschritt, wiegen sich im Wind, wachsende atmen leicht und lassen Blättchen aufsteigen; eine neue Stufe ploppt
  mit Funken auf (`Plot.Fresh`). Der Timer schwebt über der Baumspitze mit. Den Garten an seinen Platz setzt
  `GardenBuilder.Move`.

| Rolle | Stufe | Inhalt | Glück | Mindestens | Preis (Vorschlag) |
|---|---|---|---|---|---|
| Kupferrolle | Normal | 1 | ×1 | Gewöhnlich | 300 Moneten |
| Silberrolle | Selten | 1 | ×1,6 | Selten | 3.000 Moneten |
| Goldrolle | Episch | 1 | ×2,5 | Episch | 20.000 Moneten |
| Juwelenrolle | Mystisch | 1 | ×4 | Legendär | 120.000 Moneten |
| Sternenrolle (Robux-Rolle) | Limitiert | 1 | ×6 | Legendär | R$ 99 |

- **Was in den Rollen steckt:** Unter den Rollen zeigt die Seite alle 18 Schätze (9 Münzbäume, 9 Werkzeuge) als
  drehbare 3D-Vorschau aus `LootBuilder`, mit Seltenheit, Ertrag oder Wirkung. Ein Filter je Rolle zeigt die Chance
  jedes Schatzes (Chance der Seltenheit geteilt durch die Anzahl Schätze dieser Seltenheit) und graut aus, was in
  der Rolle nicht vorkommt.
- **Chancen:** Grundchance je Seltenheit Gewöhnlich 55 %, Selten 27 %, Episch 11 %, Legendär 5 %, Mythisch 1,6 %,
  Göttlich 0,4 %, Kosmisch 0,15 %, Himmlisch 0,06 % und **???** 0,02 % (die geheime Seltenheit: nur Regenbogenbaum
  und Regenbogenzaun, alles in Regenbogenfarben; in der Sternenrolle 0,75 %). Gewicht = Chance × Glück ^ (Stufe / 5), Seltenheiten unter „Mindestens“ fallen weg. Beispiel
  Sternenrolle: Legendär 61,7 %, Mythisch 28,2 %, Göttlich 10,1 %. Innerhalb einer Seltenheit ist jede Sache
  gleich wahrscheinlich (Samen, Werkzeug und Zäune zusammen). Rechnung: `rollen/js/rolls.js`.
- **Roblox:** `RollData` (`TierChances`, `MinIndex`, `Pick`, `Open`), `RollBuilder.Build(roll)` (Rolle auf
  Sockel) und `RollFx.Play(rollId, itemId, { CFrame = …, Parent = …, Window = … })` (`roblox/js/rollLuau.js`).
  Auf dem Server `RollData.Open(rollId)` würfeln, auf dem Client mit der Id `RollFx.Play` zeigen. Die übrigen
  Felder im Band würfelt der Client nur zur Show nach denselben Chancen. Einstellbar: `RollFx.SpinTime`
  (5 Sekunden), `RollFx.Window` (halbe Bandbreite), `RollFx.Spacing`, `RollFx.Slots`.

## Münzbaumgarten

`garten/`: Ein kleiner Garten, den man für **25.000 Moneten** kauft (4 Beete, erweiterbar bis 12; jedes weitere Beet
kostet 15.000 Moneten, danach jeweils das Doppelte). Bäume pflanzt man in Beete. Sie wachsen in fünf Phasen
(Keimling, Schössling, Jungbaum, Knospen mit Blüten, ausgewachsen) und tragen dann Früchte. Jede Ernte bringt
**Früchte statt Moneten**, höchstens 3 warten am Baum. Die Vorschau hat einen Zeitraffer (×1, ×10, ×60) und speichert
im Browser.

- **Früchte:** Geerntete Früchte landen im Inventar (Reiter „Früchte“, gespeichert in `Garden.Fruits`). Verkaufen
  kann man sie nicht mehr: Sie sind Futter für die Haustiere (siehe Haustiere). Oder man zieht aus so vielen
  Früchten, wie der Baum Ernten hat, einen neuen Samen desselben Baums (`seed`-Aktion).
- **Goldene Bäume:** Mit 5 % Chance wächst ein gesäter Baum golden (`Plot.Golden`): goldenes Laub, Funkeln, etwas
  größer und doppelte Früchte. Bei ??? heißt er „schillernd“ und sein Laub läuft durch alle Farben.
- **Jeder Baum hat seine eigene Form** (Spalte „Form“), seltene Bäume sind größer (bis ×1,48 bei ???).
- **Detailreich:** Stamm aus vier geschwungenen Stücken mit Knoten, breitem Fuß, Rindenrippen, Astloch und Moos;
  sieben Wurzeln, die sich in die Erde krümmen; Hauptäste mit Seitenzweigen und Laubbüscheln. Die Krone hat
  vier Lagen: dunkler Kern, facettierte Büschel (sonnig oben, schattig unten), helle Spitzen und einzelne Blätter
  am Rand. Seltenere Bäume bekommen mehr Laub. Früchte mit Glanzpunkt, Stiel und Blättchen; reife pulsieren.
- **Tag und Nacht:** `GardenBuilder.Animate` liest `Lighting.ClockTime`. Nachts leuchten die Früchte (ab Legendär
  auch die Laubspitzen), ein Licht in der Krone geht an und Glühwürmchen kommen heraus. Auf der Gartenseite
  schaltet man zwischen Tag, Nacht und echter Uhrzeit um.
- **Lebendig:** Bäume wiegen sich, Windböen ziehen über den Garten, Blätter fallen und treiben davon (beim Ahorn
  mehr), ab Selten schwirren Glühwürmchen um den Baum. Früchte schaukeln an ihren Stielen.

| Münzbaum | Seltenheit | Form | Wachsen | Frucht | Grundpreis | Ernten |
|---|---|---|---|---|---|---|
| Pfennigbusch | Gewöhnlich | Busch | 1 min | Pfennigbeere (alle 30 s) | 40 | 6× |
| Kupferbaum | Gewöhnlich | runde Krone | 2 min | Kupferapfel (alle 45 s) | 90 | 6× |
| Silberbirke | Selten | schlanke Birke | 4 min | Silberbirne (alle 1 min) | 300 | 8× |
| Talertanne | Selten | Tanne | 5 min | Talerzapfen (alle 1 min 15 s) | 420 | 8× |
| Goldeiche | Episch | breite Eiche | 10 min | Goldeichel (alle 1 min 30 s) | 1.500 | 10× |
| Dukatenkirsche | Episch | Blütenkrone | 9 min | Dukatenkirsche (alle 1 min 20 s) | 1.300 | 10× |
| Kristallweide | Legendär | Hängeweide | 20 min | Kristalltropfen (alle 2 min) | 6.000 | 12× |
| Drachenpalme | Mythisch | Palme | 40 min | Drachenfrucht (alle 2 min 30 s) | 25.000 | 15× |
| Glückspilz | Gewöhnlich | Pilz | 1 min 30 s | Glückssporling (alle 40 s) | 60 | 6× |
| Ahorngroschen | Selten | gezackter Ahorn | 4 min 30 s | Groschennuss (alle 1 min 10 s) | 380 | 8× |
| Frosttanne | Episch | Fichte mit Schnee | 11 min | Frostzapfen (alle 1 min 35 s) | 1.650 | 10× |
| Wolkenbaum | Legendär | Wolke | 21 min 40 s | Wolkenpflaume (alle 2 min 5 s) | 6.500 | 12× |
| Kristallbaum | Mythisch | Kristalle | 43 min 20 s | Kristallfrucht (alle 2 min 35 s) | 27.000 | 15× |
| Sternenbaum | Göttlich | Sternenkugel | 1 h | Sternfrucht (alle 3 min) | 120.000 | 20× |
| Planetenbaum | Kosmisch | Planet mit Ring | 1 h 30 min | Mondfrucht (alle 3 min 20 s) | 400.000 | 25× |
| Engelsbaum | Himmlisch | Flügel | 2 h | Engelsfeige (alle 3 min 40 s) | 1.200.000 | 30× |
| Regenbogenbaum | ??? | Regenbogen-Etagen | 3 h | Regenbogenfrucht (alle 4 min) | 5.000.000 | 40× |

| Werkzeug & mehr | Seltenheit | Wirkung |
|---|---|---|
| Monetenbeutel | Gewöhnlich | +750 Moneten |
| Blechkanne | Gewöhnlich | Baum wächst 1 min schneller |
| Kupferkanne | Selten | 5 min schneller |
| Dünger | Selten | ×2 Ernte für 10 min |
| Goldkanne | Episch | 30 min schneller |
| Goldener Spaten | Legendär | +1 Beet |
| Regenbogenkanne | Legendär | Baum sofort ausgewachsen |
| Zauberdünger | Mythisch | ×3 Ernte für 30 min |
| Monetentruhe | Göttlich | +250.000 Moneten |

**Begrenztes Ernten:** Jeder Baum lässt sich nur so oft abernten, wie die Spalte „Ernten“ sagt (geerntet werden
höchstens die Ernten, die er noch hergibt). Dann ist er abgeerntet und verschwindet, das Beet ist frei für neue
Samen. Ausgraben gibt die Samen nur zurück, solange der Baum noch nicht ausgewachsen ist; danach wird er
ausgerissen (sonst ließe sich die Grenze umgehen). Im Spielstand zählt `Plot.Count` die Ernten.

**Zäune zum Personalisieren:** kommen aus den Münzrollen, bleiben im Inventar und lassen sich jederzeit anbringen
(`fence`-Aktion, `Garden.Fence`). Der Holzzaun ist immer da.

| Zaun | Seltenheit | Aussehen |
|---|---|---|
| Holzzaun | Standard | Pfosten mit zwei Latten |
| Weißer Lattenzaun | Gewöhnlich | spitze weiße Latten, Kugeln auf den Pfosten |
| Steinmauer | Selten | Feldsteine in zwei Reihen, Säulen, Moos obenauf |
| Bambuszaun | Selten | Bambusrohre mit Knoten, Schnur |
| Eisengitter | Episch | schwarze Stäbe mit goldenen Spitzen, Laternen |
| Kristallzaun | Legendär | Kristallpfosten mit Leuchtkern, Lichtbänder, Funkeln |
| Lavazaun | Mythisch | Basalt mit Glutadern, Lavamauer, Feuer |
| Sternenzaun | Göttlich | nachtblaue Pfosten mit Sternen, farbige Lichtbänder |
| Wolkenzaun | Himmlisch | goldene Pfosten, schwebende Wolken |
| Regenbogenzaun | ??? | Glaspfosten, sechs Bänder in Regenbogenfarben |

**Baum-Design (Low-Poly):** Stamm in zwei Stücken mit Rindenstreifen, Wurzeln, die schräg aus der Erde ragen,
Äste in die Krone, facettierte Laubbüschel in mehreren Farbtönen (oben heller, unten dunkler). Früchte hängen an
kleinen Stielen, jede Baumart mit eigener Form (Apfel, Birne, Beeren, Zapfen, Eichel, Kirschen, Tropfen,
Drachenfrucht, Stern, Mond); reife Früchte leuchten. Ist ein Baum reif, rieselt Funkeln aus der Krone und ein
paar Früchte liegen schon im Beet. Effekte je Seltenheit: ab Episch Lichtpunkte, ab Legendär
Aura und Licht, ab Göttlich ein Leuchtring im Beet; bei ??? schillert alles in Regenbogenfarben.

**Zaunwechsel animiert:** Der alte Zaun versinkt und verblasst, der neue wächst in einer Welle vom Tor aus rund um
den Garten aus dem Boden (mit Überschwingen und Funken); Feuer und Funkeln gehen erst an, wenn ihr Teil steht
(`garden.FenceFrom` in `GardenBuilder.Build`, abgespielt in `GardenBuilder.Animate`).

**Neu im Werkzeug:** Kometendünger (Kosmisch, ×5 Ernte für 1 Stunde), Himmelstruhe (Himmlisch, +3.000.000 Moneten).

In Roblox baut `LootBuilder.FenceRun` den Zaun im gewählten Stil (Pfosten und Füllung je Stil),
`LootBuilder.Fence` das Zaunstück, das aus der Rolle kommt.

- **Roblox** (`roblox/js/gardenLuau.js`): `GardenData` (Bäume, Werkzeug, `Stage`, `PhaseOf`, `Ripe`,
  `HarvestFruits`, `MarketMult`, `FruitPrice`, `SeedCost`, `BedPrice`), `LootBuilder` (`Tree(tree, stage, ripe,
  full, { Phase, Golden })`, `Seed(tree)`, `Tool(tool)`, `Build(item)`) und
  `GardenBuilder.Build({ Beds, Plots })` (Wiese, Zaun mit Tor und Schild, Beete mit Nummern, Bäume, Timer über
  wachsenden Bäumen; `GardenBuilder.SetTimer` zählt sie weiter).
  Der Installer baut `Workspace > CoinmasterGarden` mit allen Bäumen.

### Im Spiel (Roblox)

- **Spiel-Oberfläche:** Menüknopf **🌱 Garten** öffnet das Fenster mit vier Reitern: *Beete* (Phase, Countdown,
  Ernten, Ausgraben, „Alles ernten“, Beet kaufen), *Früchte* (wie viel Pet-EP jede Frucht gibt, Samen ziehen,
  „Haustiere füttern“), *Sachen* (Inventar aus den Rollen: Bäume und Kannen auswählen
  und dann ein Beet antippen, Monetenbeutel und Spaten direkt benutzen) und *Rollen* (kaufen und öffnen). Nach dem
  Öffnen spielt `GameUI.PlayRoll` die Animation `RollFx` vor dem Spieler. „🚪 Zum Garten“ teleportiert zum Garten.
- **Server** (`ServerScriptService > CoinmasterGarden`): RemoteFunction `GardenRemote` mit `openRoll` und den
  Garten-Aktionen aus `GardenData.Act` (buyGarden, buyBed, plant, use, harvest, dig, fence, sell, seed). Der Server würfelt, prüft
  Moneten, Beete und Inventar und schreibt den Stand als JSON ins Attribut `Garden`. Mindestens 0,2 s zwischen
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

**Schlüpfen und Füttern (Spiel):** Im Inventar hat jedes Ei den Knopf „🐣 Schlüpfen“: Das Haustier wird nach den
Chancen gezogen, mit großer Ansage je nach Seltenheit (`GameUI.PetReveal`), und steht dann unter „Haustiere“.
Dort füttert man es mit Früchten aus dem Münzbaumgarten (einzeln oder ×10, Futter oben auswählen). Jede Frucht
gibt ein paar EP, je seltener der Baum, desto mehr (`FRUIT_XP`: Gewöhnlich 1 bis ??? 40); ein Haustier steigt so
langsam bis Level 50 (`petXpFor(n) = 10 · n^1,5`). In Roblox steht die Liste im Attribut `Pets` (JSON, wird
gespeichert); `ShopRemote` kennt `hatch` und `feedPet`, die Regeln stehen in `PetData` (`FruitXp`, `XpFor`, `AddXp`).

`haustiere/` zeigt alle 99 Pets: 11 Eier mit je 9 Pets, eins pro Seltenheit. Als Karten je Ei mit Seltenheit,
Drop-Chance und kurzer Beschreibung, oben eine Übersicht der Seltenheiten und Filter nach Ei. Die früheren
49 Voxel-Tiere mit 3D-Modellen, Blender-Export und `Haustiere.rbxmx` sind entfernt.

| Seltenheit | Drop-Chance |
|---|---|
| Common | 40 % |
| Uncommon | 25 % |
| Rare | 15 % |
| Epic | 10 % |
| Legendary | 5 % |
| Mythic | 3 % |
| Divine | 1,5 % |
| Celestial | 0,49 % |
| Secret | 0,01 % (1 zu 10.000) |

Die Chancen gelten in jedem Ei gleich. Eier (Reihenfolge wie im Design „Tier-Eier“): Normal, Wald, Eis, Engel,
Galaxie, Candy, Admin, Release, Atlantis, Lava und Cartoon; alle elf stehen in der Eierhalle.

- **Daten:** `haustiere/js/pets.js` (`PET_RARITIES`, `EGGS`, `PETS`, `rollPet(eggId)`). Die Beschreibungen sind
  Vorschläge.
- **Schlüpfen:** Die Eierhalle zieht das Pet nach den Chancen. Weil es noch keine Modelle gibt, wächst eine leuchtende
  Kugel in der Farbe der Seltenheit heraus; die Ansage zeigt Name, Seltenheit und Chance. Seltenere Pets
  schlüpfen größer.
- **Roblox:** `PetData` (Pets mit `Rarity`, `Chance`, `Roll`), `PetBuilder.Build(petId)` klont ein Modell aus dem
  Ordner `Haustiere`, wenn dort eins mit der Id liegt, sonst die Kugel.

## Taschen

`taschen/` zeigt alle 99 Rücken-Items aus `muenz-ruecken-items.xlsx` in 9 Stufen, als Karten mit Nummer, Name,
Beschreibung, Preis und Kapazität (wie viele Münzen man gleichzeitig tragen kann). Filter nach Stufe.

| Stufe | Nr. | Preis (Münzen) | Kapazität (Münzen) |
|---|---|---|---|
| Einfach | 1–11 | gratis bis 13.000 | 100 bis 4.500 |
| Bronze | 12–22 | 20.000 bis 210.000 | 6.000 bis 33.000 |
| Silber | 23–33 | 280.000 bis 2,2 Mio. | 40.000 bis 260.000 |
| Gold | 34–44 | 3 Mio. bis 26 Mio. | 320.000 bis 2,2 Mio. |
| Edel | 45–55 | 33 Mio. bis 280 Mio. | 2,7 Mio. bis 14 Mio. |
| Magisch | 56–66 | 350 Mio. bis 3,1 Mrd. | 17 Mio. bis 115 Mio. |
| Legendär | 67–77 | 4 Mrd. bis 38 Mrd. | 140 Mio. bis 880 Mio. |
| Kosmisch | 78–88 | 50 Mrd. bis 650 Mrd. | 1,1 Mrd. bis 11 Mrd. |
| Göttlich | 89–99 | 850 Mrd. bis 100 Bio. | 14 Mrd. bis unbegrenzt |

Die Preise verdoppeln sich etwa alle 4 bis 6 Taschen, die Kapazität wächst etwas langsamer. Ab Gold sind es nicht
mehr nur Taschen, sondern auch Rüstungen, Flügel, Türme und Kreaturen. Daten: `taschen/js/bags.js`
(`BAG_TIERS`, `BAGS`, `fmtCoins`). Noch nicht im Spiel: Die Taschen haben noch keine 3D-Modelle und sind
noch nicht mit dem Inventar verbunden.

## Edelsteine

`edelsteine/` zeigt die 20 Edelsteine aus dem Juwelnebel (Galaxie 2, nach der Supernova). Dort findet man
Edelsteine statt Münzen. Sie haben dieselben 10 Seltenheitsstufen und Drop-Chancen wie die Münzen, je zwei
Steine pro Stufe. Edelsteine bringen eine eigene Währung, **Diamantstaub** (zehnmal so viel, wie eine Münze derselben
Stufe an Moneten bringt, `GEM_FACTOR`). Mit Diamantstaub kauft man die Welten des Juwelnebels und die Edelstein-Taschen.
Im HUD steht er unter den Moneten, sobald man eine Supernova hatte (Attribut `Diamantstaub`, wird gespeichert).

| Stufe | Steine | Grundwert (Diamantstaub) |
|---|---|---|
| Normal | Quarz, Rosenquarz | 10 |
| Selten | Achat, Jaspis | 50 |
| Sehr selten | Amethyst, Topas | 100 |
| Episch | Aquamarin, Peridot | 250 |
| Legendär | Smaragd, Saphir | 500 |
| Mystisch | Rubin, Mondstein | 1.000 |
| Engelsgleich | Opal, Alexandrit | 2.500 |
| Göttlich | Diamant, Feueropal | 5.000 |
| Galaktisch | Sternsaphir, Nebelkristall | 10.000 |
| Unerreichbar | Supernova-Diamant, Herz der Galaxie | 10 Mio. |

- **Daten:** `edelsteine/js/gems.js` (`GEMS` mit Stufe, Schliff, drei Farben und Text, `gemBaseValue`).
- **Fund:** Beim Fund zählen wie bei Münzen Welt-Faktor, Wiedergeburten, Supernova, „Wertvoller Fund“,
  Glück, „Goldene Hand“ und „Doppelfund“. Mutationen gibt es bei Edelsteinen (noch) nicht.
- **Inventar:** eigener Reiter „Edelsteine“. Sie liegen in einem eigenen Beutel und belegen keine Inventarplätze;
  verkaufen geht einzeln, je Stein alle oder alles auf einmal. In der Vorschau zeigt „Münze suchen“ im
  Juwelnebel „Edelstein suchen“ (lila Knopf), der Fund kommt mit Edelstein-Karte und Effekten je nach Stufe
  (`GameUI.FoundGem`).
- **Edelstein-Taschen:** 50 eigene Taschen in 5 Stufen (Splitter, Kristall, Juwel, Prisma, Supernova), vom
  Quarzsäckchen (25 Plätze, gratis) bis zum Herz des Juwelnebels (100.000 Plätze, 5 Mrd. Diamantstaub). Man kauft sie
  der Reihe nach im Shop (Reiter „Taschen“); ist die Tasche voll, findet man keine Edelsteine mehr. Daten:
  `GEM_BAGS` in `edelsteine/js/gems.js`, in Roblox `GemData.Bags` und das Attribut `GemBag`, Kauf über `buyGemBag`.
- **Roblox:** Modul `GemData`. Am Spieler `Gem_<id>` (Anzahl) und `GemValue_<id>` (Gesamtwert), beide werden
  gespeichert. Ein Fund-Skript auf dem Server schreibt sie über das BindableEvent `GemFound`
  (`GemFound:Fire(player, gemId, anzahl, wertProStein)`), verkauft wird über `ShopRemote` (`sellGem`, `sellGems`).

## Welten

**Galaxien und Supernova (Prestige):** Die Planeten 1 bis 4 liegen in der **Milchstraße**. Mit 100
Wiedergeburten kann man einmal zur **Supernova** werden (Welten > Reiter „Supernova“, zweimal klicken):

- Moneten und Wiedergeburten gehen auf 0, Welten, Portale, Münzen, Edelsteine, Eier, Level und Skills bleiben.
- Alles ist danach für immer fünfmal so viel wert (`SUPERNOVA.bonus`, zusätzlich zu den Wiedergeburten).
- Die zweite Galaxie **Juwelnebel** öffnet sich. Dort findet man Edelsteine statt Münzen.

| Planet | Portal | Braucht | Welten (Preis in Diamantstaub) |
|---|---|---|---|
| Planet 5 · Kristallplanet | Sternentor | Supernova | Quarzfeld (gratis), Amethystgrotte (25K), Topasdünen (100K) |
| Planet 6 · Smaragdplanet | Kristallbrücke | Topasdünen, 2 Wiedergeburten | Smaragdwald (400K), Jadetempel (1,5 Mio.), Saphirsee (6 Mio.) |
| Planet 7 · Diamantplanet | Diamantaufzug | Saphirsee, 5 Wiedergeburten | Rubinvulkan (25 Mio.), Opalwolken (100 Mio.), Diamantkern (400 Mio.) |

Glück steigt von +1.300 % (Quarzfeld) bis +3.200 % (Diamantkern), der Edelstein-Wert von ×1 bis ×14.

- **Daten:** `welten/js/worlds.js`: `GALAXIES` (mit `find: 'coins' | 'gems'`), Planeten mit `galaxy`, Portale
  mit `supernovas`, `SUPERNOVA` (`rebirths: 100`, `bonus: 5`, eine Supernova pro weiterer Galaxie). Das Portal zum
  ersten Planeten einer neuen Galaxie braucht nur die Supernova, nicht die letzte Welt des vorigen Planeten.
- **Welten-Fenster:** Die Reiter zeigen die Planeten der gewählten Galaxie; der Galaxie-Reiter wechselt zur
  anderen. Der Reiter „Supernova“ zeigt Fortschritt (Wiedergeburten von 100), Wert-Faktor vorher und nachher,
  was bleibt und was weg ist, und leuchtet lila, sobald die Supernova bereit ist. Danach springt das Fenster
  zum Kristallplaneten. Nur in der Vorschau: „+10 Test-Wiedergeb.“.
- **3D-Inseln** (`welten/js/galaxie2.js`): jede Welt mit schwebendem Edelstein-Wahrzeichen auf einem Sockel
  (dreht sich, kleine Steine kreisen), Kristallgruppen und funkelnden Steinen am Boden, dazu je Welt Quarzsäulen,
  Amethyst-Drusen, Topas-Obelisk und Dünen, Bäume mit Smaragdlaub, Jadetempel, Saphirsee, Rubinvulkan,
  Opalwolken oder Diamantbögen. Ein eigenes Himmelsbild haben sie noch nicht.
- **Roblox:** `WorldData.Galaxies`, `PlanetsOf`, `GalaxyOfWorld`, `FindsGems`, `Supernova`, `SupernovaMultiplier`,
  `CanSupernova`, `NextGalaxy`; das Attribut `Supernovas` wird gespeichert. `ShopRemote` kennt die Aktion
  `supernova` (prüft der Server mit `WorldData.CanSupernova`).
- **Achtung Balance:** Eine Wiedergeburt kostet 1 Mio. Moneten × 4ⁿ. Die 100. kostet damit rund 10⁶⁵ Moneten, also
  praktisch unerreichbar, solange die Kosten so steigen. Bevor die Supernova im Spiel erreichbar ist, muss die
  Kostenkurve der Wiedergeburt flacher werden (`REBIRTH.cost` in `welten/js/worlds.js`).

**Feinschliff aller Welten (Profi-Überarbeitung):** Nichts Neues gebaut, nur das Bestehende sauberer:
- **Boden:** statt eines Säulenrasters eine glatte Geländefläche aus Dreiecken (in Roblox je zwei Keile, `triangleWedges`
  in `roblox/js/worldParts.js`), 11 Ringe × 56 Stücke. Weiche Flecken in fünf Tönen, Hänge erdiger, eine helle
  Sonnenkante am Rand; darunter eine geschlossene Erdkante. Die Erdschicht sitzt unter dem tiefsten Tal, nichts schaut durch.
- **Auf dem Boden:** Gegenstände stehen auf dem tiefsten Punkt ihrer Grundfläche (keine schwebenden Ecken am Hang);
  Wegplatten, Seen, Lavapfützen, Krater und der Runenkreis liegen an den Hang geneigt (`layOnGround`, `lay`).
- **Bach (Normal):** flaches Bachbett mit dunklem Ufer und hellem Strömungsstreifen statt einer Röhre (`welten/js/detail.js`).
- **Rand:** Graspolster in wechselnder Größe und drei Tönen, dazwischen Felsnasen aus der Kante.
- **Kristalle, Edelsteine, große Felsen:** in Roblox Fläche für Fläche aus Keilen (`facets`), mit scharfen Kanten statt
  Kugeln; das Wahrzeichen im Juwelnebel ist ein echter Brillant mit Krone und Pavillon.
- **Bögen und Stangen** (Zuckerstangen, Felsbogen der Höhle, Ringe): Kugelgelenke an jedem Knick, keine Lücken mehr.
- **Umgebung:** die grauen Wolkenklumpen direkt an Inseln ohne Himmelsbild sind weg, das Nebelmeer im All ist
  nicht mehr durchscheinend (keine Blasen am Horizont), die neun Welten des Juwelnebels haben einen eigenen
  Sternenhimmel mit Nebeln in Edelsteinfarben (WorldFx `gemSky`).

**Umgebung je Welt:** alle 17 Welten (Spawn und Planet 1 bis 3) haben ein eigenes Himmelsbild, eine modellierte Inselhülle (siehe unten), schwebende Inseln oder Brocken und Details am Rand.

| Welt | Himmelsbild | Umgebung |
| --- | --- | --- |
| Spawn | warmer, goldener Nachmittag: blau oben, Pfirsich und Gold am Horizont, golden angestrahlte Haufenwolken | schwebende Inseln mit Bäumen, Felsunterseite, Ranken, helles Wolkenmeer (die Münzstadt bleibt) |
| Normal | Sommerhimmel mit Haufen- und Schleierwolken | schwebende Grasinseln mit Bäumen, Grasbrocken am Rand, Felsunterseite, weiße Wolkenwand |
| Wald | Morgenhimmel, grünlich-golden, Nebelbänder über den Wipfeln | schwebende Waldinseln mit Tannengruppen, Felsunterseite mit hängenden Wurzeln, hellgrünes Nebelmeer |
| Stadt | Sonnenuntergang (Gelb, Orange, Rosa, oben Violett), angestrahlte Wolken, erste Sterne | schwebende Häuserinseln, Skyline in der Ferne, Felsunterseite mit Rohren und Lampen, pfirsichfarbenes Wolkenmeer |
| Eis | Winterhimmel zur blauen Stunde mit grünem und violettem Polarlicht, Schneedunst, erste Sterne | schwebende Eisschollen mit verschneiten Tannen, bläuliche Felsunterseite, Eiszapfen am Rand, weißes Schneenebelmeer |
| Lava | Glutnacht: dunkle Aschewolken, von unten rot angestrahlt, Funken | schwebende Vulkanbrocken, Basaltunterseite mit leuchtenden Lavatropfen, Glutmeer aus dunkler Kruste mit Lavabecken (Neon) |
| Höhle | Höhlendecke statt Himmel: dunkler Fels mit Tropfsteinen und vereinzelten Kristalladern, violetter Leuchtnebel, Glimmer | schwebende Felsbrocken, violette Felsunterseite, leuchtende Kristallspitzen am Rand, violettes Nebelmeer mit Leuchtbecken |
| Candy | Zuckerwattehimmel in Pastell, Regenbogenband rundherum, Wolken in Rosa und Hellblau | schwebende Pastellinseln mit Bäumen, Pastell-Felsunterseite, Zuckergusstropfen am Rand, Zuckerwattemeer |
| Mond | schwarzer Weltraum, Milchstraße als Band über dem Horizont, viele helle Sterne (die Erde bleibt als Himmelskörper) | schwebende Mondbrocken, Unterseite aus grauem Mondgestein, dunkles Nebelmeer |
| Neptun | tiefblauer Sturmhimmel mit Wolkenbändern in Blau und Türkis, Sterne | schwebende Eisbrocken, Unterseite aus blauem Eisgestein mit Eiszapfen, blaues Sturmnebelmeer |
| Mars | rostroter Staubhimmel mit Staubschleiern, oben dunkel mit Sternen | schwebende rote Felsbrocken, Unterseite aus rotem Gestein, Staubdünen (Sand, nicht durchscheinend) |
| Saturn | warm-goldener Weltraum, die Saturnringe als fein gestreiftes Band mit Lücken, goldener Dunst, Sterne | schwebende goldene Felsbrocken, Unterseite aus Sandstein, goldenes Ringstaubmeer |
| Alien | violetter Fremdhimmel, Nebelschwaden in Giftgrün und Pink, türkises Sternenband | schwebende violette Felsbrocken, Felsunterseite, leuchtende Alien-Ranken am Rand, violettes Nebelmeer mit grünen Leuchtstellen |
| Sonne | glühender Himmel von Gelb-Weiß bis Tiefrot, Flammenschleier, Sonnenwind-Vorhänge | schwebende glühende Felsbrocken, Felsunterseite mit Glut-Tropfen, Plasmameer aus Glutkruste mit leuchtenden Feldern |
| Korallenriff | unter Wasser: oben die helle Oberfläche mit Lichtnetz, schräge Lichtstrahlen, zum Horizont Tiefblau | schwebende Riff-Felsen, Felsunterseite in Meeresfarben, Seetang hängt vom Rand; keine Wand (der Wassernebel verdeckt die Nachbarn), die Glas-Wasseroberfläche entfällt |
| Muschelland | perlmuttfarbenes Wasser: oben Rosa mit Lichtnetz, Lichtstrahlen, zum Horizont Türkis und Blau | schwebende Muschelfelsen, Felsunterseite in Meeresfarben, Perlenschnüre am Rand |
| Atlantis | tiefes, geheimnisvolles Wasser: oben schwach türkis leuchtende Oberfläche, wenige kräftige Lichtstrahlen, Leuchtplankton | schwebende Ruinenfelsen mit Säulen, Felsunterseite, Runensteine (ᛉ) und Leuchttropfen am Rand |

- **Himmelsbild:** `tools/himmel/himmel.py` malt je Welt drei Bilder (`assets/himmel/<welt>/seite.jpg`,
  `oben.jpg`, `unten.jpg`, je 1024 × 1024). Die Seiten wiederholen sich alle 90 Grad, darum passt ein Bild für alle
  vier Seiten ohne Naht. Welche Welten eines haben, steht in `welten/js/skyboxes.js`.
- **Roblox:** Im Ordner `Licht` der Welt liegt `Himmelsbild` mit den NumberValues `Seite`, `Oben`, `Unten` (Bild-IDs,
  anfangs 0) und `Sonne`. Bilder aus dem Welten-ZIP (`welten/himmel/<welt>/`) im Asset Manager hochladen und die
  IDs eintragen; `CoinmasterWorldLighting` baut daraus ein `Sky` und blendet die Himmelskuppel aus.
- **Wolkenwand:** Statt der einfarbigen Kuppel verdecken Haufenwolken am Horizont (600–630 Studs) die
  Nachbarinseln: ein flacher, breiter Sockel mit seitlich versetzten Bäuschen darauf, oben heller als unten. Im All
  und in der Höhle bleibt es eine ruhige Nebelwand (Bäusche wirkten dort wie Blasen). Der Wolkenring direkt an der
  Insel fällt weg, die Wolken malt das Himmelsbild.
- **Inselhülle** (`roblox/js/islandShell.js`, Vorbild: schwebende Inseln mit überhängender Grasnarbe): eine
  durchgehende, modellierte Fläche aus Dreiecken (in Roblox je zwei Keile, wie der Boden) statt Felsen aus Modellen.
  Oben hängt die Narbe über die Kante (Gras, Schnee, Zuckerguss oder eine schmale Kante im Bodenton), darunter eine
  fast senkrechte Erdwand mit zackiger Grenze zum Fels. Die Felszunge läuft nach unten spitz zu, hängt leicht
  schief, hat scharfe senkrechte Rippen, schwache Schichtbänder, weiche senkrechte Farbstreifen mit einzelnen
  dunklen Rissen und acht Nebenspitzen. Stil je Welt (`STYLE`): Gestein und Tönung (warmes Grau bei Normal und
  Spawn, Gletscher bei Eis, Basalt bei Lava …), Tortenschichten bei Candy und Anhängsel: Grashalme, Wurzeln, Ranken,
  Moos, Eiszapfen, Zuckerguss mit Streuseln, verzweigte Glutrisse und Glut-Tropfen, Kristalle (in der Höhle
  leuchtend in drei Farben direkt unter dem Rand), Leuchtranken, Seetang, Korallenstöcke und Schwämme, Perlen,
  Rohre mit Lampen, Wolkenbäusche.
- **Wolkenmeer:** Unter der Insel hat das Meer eine Mulde, die Spitze der Felszunge schwebt frei darüber. Der
  durchscheinende Horizont-Ring liegt unter der Inselspitze (vorher schnitt er als heller Streifen durch die Insel).
  Wasserfälle stürzen frei an der Felszunge vorbei bis ins Meer, unten breiter und durchscheinender, mit Gischt.
- **Schwebende Inseln:** dieselbe Hülle im Kleinen (Kuppel, Narbe, Erde, Felszunge; kleine Brocken gröber, große
  feiner), obendrauf Bäume oder Modelle; statt der sechseckigen Hügel- und Bergplatten des Pakets stehen dort
  Bäume oder ein Berg aus der Hülle (Fuß in der Wiese, Fels, zackige Schneegrenze).
- **Nachbarinseln:** In Normal, Wald und Eis stehen in der Ferne (50–63 Einheiten) große schwebende Inseln mit Berg
  und Baumgruppen statt der Sechseck-Berge; im Juwelnebel wachsen auf Nachbar- und Schwebeinseln Kristallgruppen.
- **Boden:** Grasbüschel aus fünf spitzen, schräg stehenden Halmen (je Halm zwei Keile) statt zweier Plättchen;
  Sechseck-Sockel (Weizenfeld) sind im Boden versenkt, Sechseck-Bergplatten auf Lava, Höhle und Meeresgrund durch
  große Felsbrocken ersetzt.
- Vorschau: Die Engine zeigt das `Sky` mit den Bildern; Keile (WedgePart) werden jetzt von außen gezeichnet (vorher
  sah man nur ihre Innenseite, z. B. bei den Bergen der Fernkulisse). Teile ohne Schatten (Himmel, Kulisse) bekommen
  auch keine Schatten mehr ab.

**Modelle aus kostenlosen Grafikpaketen (CC0):** Alle Welten und der Spawn sind mit Modellen der KayKit-Pakete
von Kay Lousberg gebaut (Medieval Hexagon, City Builder, Dungeon, Halloween, Space Base; CC0, auch für Roblox
frei).

| Welt | Modelle |
| --- | --- |
| Normal | Startdorf: Windmühle, Häuser um einen Brunnen, Feld, Steinbrücke, Bäume, Felsen |
| Wald | Nadelwald, Sägemühle mit Holzlager, Zeltlager (Riesenbaum bleibt) |
| Stadt | Straßenkreuz aus Straßenplatten, Häuserzeilen, Autos, Laternen, Ampeln, Hydranten, Bänke, Wasserturm |
| Eis | verschneite Tannen und Felsen (@eis), Wachturm, Zeltlager mit Laterne; Iglu, See, Kristalle bleiben |
| Lava | Schmiede mit Fackeln und Fässern, Ruine mit Schatztruhe, tote und verkohlte Bäume, Basaltfelsen (@lava) |
| Höhle | Mine mit Lager, Säulenhalle mit Schatztruhe und Kerzen, violette Felsen (@hoehle), Fackeln, Laternen |
| Candy | Lebkuchendorf mit Windmühle und Brunnen, Pastellbäume und -felsen (@candy); Süßigkeiten bleiben |
| Mond | Mondbasis aus Modulen und Röhren, Landeplatz mit Landefähre, Solarpaneele, Fracht, Rover, graue Felsen und Abbaukrater (@mond) |
| Neptun | Forschungsstation mit Kuppelmodul, Windräder im Sturm, Stützmasten, eisblaue Felsen und Klippen (@neptun) |
| Mars | Bohrturm über einer Abbaugrube mit Lastwagen, Station, Landefähre, Solardächer, orange Felsen und Tafelberge |
| Saturn | Handelsposten: drei Frachtlager um einen Landeplatz, goldene Felsen und Klippen (@saturn) |
| Alien | Forschungslager der Menschen, Landefähre, violette Felsen und Klippen (@alien) |
| Sonne | Sonnenkraftwerk aus Solarpaneel-Reihen mit Masten, glühende Felsen (@sonne) |
| Korallenriff | Schatzplatz mit Truhe, Fässern und Kisten, Seetangfelder, Felsen in Meeresfarben (@meer) |
| Muschelland | Felsentor mit Laternen und Truhe, Seetangfelder, Meeresfelsen |
| Atlantis | Ruinenfeld aus Säulen und Trümmern, Gittertor, Schrein mit Laternen und Truhe, Seetang |
| Tiefseegraben (neu) | Anglerfisch mit Leuchtköder, Schlote mit Glut (Black Smoker), Felsen mit Leuchtadern, Leuchtquallen, Truhe (`welten/js/planet4.js`) |
| Wolkenburg (neu) | Marmorburg mit vier Ecktürmen und Wehrgang, goldene Brücken zu Wolkeninseln mit Pavillon, Wolkenbäusche, Brunnen, Laternen |
| Engelsgarten (neu) | Lichtbaum mit Heiligenschein, weiße Bäume mit Goldlaub, Lichtbrunnen, Treppen ins Nichts |
| Götterthron (neu) | Stufengipfel mit goldenem Thron, Sonnenscheibe und Feuerschalen, Ring aus Goldsäulen, Schatztruhen |
| Spawn | Münzstadt bleibt; Bäume im äußeren Ring, Fässer, Kisten und Säcke, Felsen auf freien Plätzen (`after`) |

Farbvarianten: `tools/modelle/atlanten.py` färbt den Farbatlas des Medieval-Pakets um (Schnee, Asche und Glut,
Höhlenviolett, Zuckerguss und Schokolade) und beim Space-Paket die Felsen je Planet (grau, eisblau, golden,
violett, glühend) und für den Meeresgrund (`@meer`). Die Modelle liegen dann ein zweites Mal als `name@variante` in der
Bibliothek. Bei Eis, Lava, Höhle und Candy bleibt das Typische der Welt stehen (`keepBase`), die Modelle kommen
dazu und werden zuerst gesetzt.

- `tools/modelle/build.mjs` holt die Pakete (git) und legt die Auswahl (`auswahl.json`) in **eine** Datei
  `assets/modelle/bibliothek.glb` (287 Modelle, 15 Farbatlanten, 6 MB) und schreibt `welten/js/modelCatalog.js`
  mit Größe und Mitte jedes Modells. Neu bauen: `cd tools/modelle && npm install && npm run build`.
- `welten/js/modelWorlds.js` baut die Welten: Normal ist ein Startdorf (Windmühle, fünf Häuser um einen
  Brunnen, Kisten und Fässer, Weizenfeld mit Zaun, Steinbrücke und Wasserpflanzen am Bach, Bäume, Felsen),
  Wald ein Nadelwald mit Sägemühle und Holzlager, Zeltlager und Baumgruppen. In der Ferne schweben
  Nachbarinseln mit Berg und Baumgruppen.
- Ein Modell ist im Export ein unsichtbares Teil **`ModellPlatz`** (Ordner `Modelle`) in Lage und Größe des
  Modells, mit `StringValue` „Modell“ (Name) und `BoolValue` „Fest“ (kollidiert, z. B. Häuser und Bäume).
- In Roblox: `bibliothek.glb` (liegt im Welten-ZIP) einmal mit **Import 3D** einfügen, das Model in
  `CoinmasterModelle` umbenennen und nach ServerStorage legen. Das Skript `ServerScriptService >
  CoinmasterModelle` (vom Installer) setzt beim Spielstart an jeden Platz eine Kopie, auf die Größe des Platzes
  gestreckt. Fest in Studio einsetzen: in der Befehlsleiste
  `require(game.ServerScriptService.CoinmasterModelle.Einsetzen)()`.
- Die Vorschau (`js/rbx/models.js`) lädt dieselbe `bibliothek.glb` und setzt die Modelle genauso in die Plätze.

**Jede Insel eine eigene Welt:** Eine Himmelskuppel (Kugel mit 640 Studs Radius, in Roblox ein
SpecialMesh mit negativer Skalierung, darum von innen sichtbar) in der Himmelsfarbe, ein weicher Ring in
Horizontfarbe und eine dichtere Atmosphäre verdecken die Nachbarinseln (1500 Studs entfernt). Unter der
Insel liegt ein Wolkenmeer (Planet 1 und Spawn, nachts dunkel), im Weltraum ein durchscheinendes
Nebelmeer, in der Tiefsee Sanddünen und darüber eine Wasseroberfläche. Kuppel und Meer ignorieren Klicks
(`CanQuery` aus). Die Kamera der Weltkarte bleibt innerhalb der Kuppel.

**Planet 1 (`welten/js/planet1.js`):** Jede Welt hat ein Wahrzeichen, eine Kulisse in der Ferne, Wege mit
Münz-Lichtungen, mehr Bodendetails, eigene Partikel und Plätze für Klänge.

| Welt | Wahrzeichen | Kulisse (Ordner „Himmel“) | Leben und Himmel |
| --- | --- | --- | --- |
| Normal | Windmühle (Flügel drehen sich) | grüne Hügel, Berge mit Schneekappe | Schmetterlinge, Vögel |
| Wald | Riesenbaum mit Baumhaus und Laternen | Tannenberge | fallende Blätter, Vögel |
| Stadt | Wolkenkratzer mit Leuchtbändern und Antenne | Skyline mit Warnlichtern | Vögel, schwebende Lichter |
| Eis | Eispalast mit vier Türmen | Schneegipfel, Polarlicht-Bänder | Polarlicht-Schimmer |
| Lava | Lavatempel mit Feuerschale | Vulkane mit glühenden Kratern | Asche, Rauchfahne |
| Höhle | Riesenkristall | Felssäulen, Tropfsteine, Leuchtsteine | Leuchtfalter |
| Candy | Zuckerschloss mit Lolli-Türmen | Eisberge (Waffel und Kugeln) | Zuckerfunkeln |

Drei geschwungene Wege führen von der Mitte zum Rand (Steinplatten, Holzplanken, Eis, Lavafliesen mit
Glutfugen, Höhlensteine mit Leuchtpilzen, Schokolade mit Zuckerrand). An jedem Weg liegen zwei Lichtungen
mit Steinkreis; dort kommen die ersten Münzplätze (`CoinSpawn`) hin. Die Kulisse steht 350–550 Studs
entfernt innerhalb der Kuppel und ragt aus dem Wolkenmeer.

**Planet 2 (`welten/js/planet2.js`):** dasselbe Muster im All.

| Welt | Wahrzeichen | Kulisse (Ordner „Himmel“) | Leben und Himmel |
| --- | --- | --- | --- |
| Mond | Rakete auf der Startrampe | Kraterränder, schwebende Brocken | Sternschnuppen, Mondstaub |
| Neptun | Eisturm mit drei kreisenden Ringen | Eisspitzen mit Leuchtkristallen | Sturmböen, Sternschnuppen |
| Mars | Radarschüssel mit Solarfeld | Tafelberge in Schichten | Staubteufel, Sternschnuppen |
| Saturn | Sternwarte mit Teleskop | Asteroidengürtel rund um die Insel | Goldstaub, Sternschnuppen |
| Alien | Alien-Tor mit Ring und schwebender Kugel | Riesenpilze mit Leuchthüten, zwei UFOs | Leuchtsporen, Sternschnuppen |
| Sonne | Sonnentempel mit schwebender Sonnenscheibe | Sonnenbögen aus dem Glutmeer | Funkenflug |

Wege: Mondgestein, Eisglas, Metallplatten mit Glutfugen, Sandstein, Alien-Fliesen und Basalt mit
Leuchtfugen. Die Himmelskörper (Erde, Neptun, Saturn, Sonne …) zieht der Export gemeinsam in die
Himmelskuppel und verkleinert sie im selben Maß, so sehen sie gleich groß aus und bleiben sichtbar.

**Planet 3 (`welten/js/planet3.js`):** unter Wasser. Zu den großen Wahrzeichen (Wrack, Korallenbogen,
Muschelhaus, Perlenbrunnen, Palast) kommt je eines dazu. Weil der Nebel unter Wasser dichter ist, steht die
Kulisse näher (220–340 Studs).

| Welt | neues Wahrzeichen | Kulisse (Ordner „Himmel“) | Leben |
| --- | --- | --- | --- |
| Korallenriff | Korallenturm mit Leuchtspitzen | bunte Korallentürme, Seetang | Luftblasen, Plankton |
| Muschelland | Riesen-Perlmuschel, öffnet sich langsam | aufgestellte Riesenmuscheln, Felsbögen, Seetang | Luftblasen, Perlenglitzern |
| Atlantis | Dreizack-Denkmal | versunkene Säulen (teils umgestürzt), Runensteine, Seetang | Luftblasen, Quallen |

Wege: Sandsteine, Muschelsteine mit Perlenrand, Marmorfliesen mit Leuchtfugen (in Atlantis um den Palast
herum). Klänge: Unterwasser-Rauschen und Blubbern, Wellen und Walgesang, Harfe oder Chor und ferne Glocken.

**Klänge:** Jede Welt hat im Ordner `Klaenge` eine unsichtbare `Klangquelle` über der Inselmitte mit einem
`Sound` je Platz (`Looped`, `Playing`, `RollOffMaxDistance` 700 Studs, also nur nahe der Insel hörbar).
Die `SoundId` ist noch leer: in Roblox Studio eine Sound-ID aus der Toolbox eintragen, der `StringValue`
„Vorschlag“ unter jedem Sound sagt, was passt (z. B. Normal: Vogelgezwitscher, Bach, Wind; Höhle: tropfendes
Wasser mit Hall, Kristallklingen; Candy: Spieluhr-Musik; Mond: Weltraum-Summen und Funkpiepen; Alien: Zirpen und UFO-Brummen). Die Vorschau spielt keine Klänge.

**Simulator-Stil (alle Inseln und der Spawn, `roblox/js/worldParts.js`):** Der Boden hat eine Grasdecke
über einer Erdschicht (an Hängen sieht man die Schichten), das Gras liegt in Flecken aus drei Tönen statt
im Schachbrett. Rand und Unterseite modelliert die Inselhülle (siehe „Umgebung je Welt“). Wasserfälle stürzen über den Rand (Wasser in Normal und Wald,
Eis, leuchtende Lava in Lava und Sonne, Sirup in Candy, leuchtend in Höhle und Alien) und zerstäuben mit
Gischt-Partikeln. Inseln mit Tageshimmel haben Wolken. Alle Farben sind kräftiger, und in Roblox lässt
ein `BloomEffect` Neon und Lava weich nachleuchten (die Vorschau zeigt kein Bloom). Am Spawn leuchtet ein
Goldrand um den Platz, zehn goldene Münzen schweben um den Brunnen, dazu Blumenbeete.

**Spawn (Münzstadt, `welten/js/spawnTown.js`):** Hier starten neue Spieler.
- **Marktplatz** mit Pflaster, Springbrunnen mit Fontänen und Münzstatue, Spawn-Pad
- **Stadtmauer** mit acht Türmen, Fahnen und vier Torbögen; vier Hauptstraßen mit Laternen und Lichterketten, dazu eine Ringstraße
- **Läden mit Innenraum:** Eier-Laden, Boost-Labor, Robux-Palast (goldene Kuppel), Haustier-Hof, Verkaufs-Kontor; jeweils mit Schaufenstern, Leuchtschrift, Theke, Regalen und Verkäufer
- **Portal-Hallen:** Heimat-Tor (Planet 1), Raketenstartplatz mit Rakete (Planet 2), Tiefsee-Strudel (Planet 3 und 4)
- **Spielbereiche:** Ei-Schlüpfplatz mit allen 11 Eiern, Glücksrad, VIP-Lounge, Quest-Brett, Obby-Turm, Ranglisten, Münzindex-Rotunde, tägliche Belohnung, Code-Terminal, Gruppen-Belohnung
- **Leben:** Spaziergänger mit Haustieren, Münzregen, Feuerwerk, ein Tag-Nacht-Wechsel (90 Sekunden), bei dem nachts die Laternen heller leuchten

In der Weltkarte lassen sich alle Bereiche anklicken. In der Spiel-Oberfläche kann man sie im 3D-Hintergrund
antippen, und die Spawn-Leiste öffnet **Belohnungen** (sieben Tage Serie, Glücksrad einmal am Tag, Gruppe),
**Ranglisten** (Moneten, Münzen, Wiedergeburten, Level, mit deinem Platz) und **Codes** (`spiel/js/rewards.js`;
Vorschau-Codes: COINMASTER, SPAWN, GLUECK, RELEASE, DANKE). Im Roblox-Export ist `00-Spawn.rbxmx` dabei,
mit `SpawnLocation`, Teilen `Portal_<WeltId>` und Schildern mit SurfaceGui-Text.

`welten/` zeigt die Weltkarte (Design aus Claude Design „Weltkarte“): Spawn und vier Planeten mit zwanzig Welten, jede als drehbare 3D-Insel mit
eigener Landschaft, Himmel und Partikeln (Pollen, Glühwürmchen, Schnee, Glut, Streusel, Sterne,
Sturm, Blasen …).

| Planet | Welten | Weg dorthin |
|---|---|---|
| Planet 1 · Heimatplanet | Normal, Wald, Stadt, Eis, Lava, Höhle, Candy | Startplanet |
| Planet 2 · Weltraum | Mond, Neptun, Mars, Saturn, Alien, Sonne | Rakete: Candy + 1 Wiedergeburt |
| Planet 3 · Tiefsee | Korallenriff, Muschelland, Atlantis, Tiefseegraben (neu) | Tiefsee-Portal: Sonne + 3 Wiedergeburten |
| Planet 4 · Himmelreich (neu) | Wolkenburg, Engelsgarten, Götterthron | Himmelsleiter: Tiefseegraben + 6 Wiedergeburten |

- In jeder Welt findet man **alle Münzen**. Spätere Welten erhöhen die Chance auf seltene Stufen
  (`luck`) und den Münzwert (`value`).
- Welten kauft man pro Planet der Reihe nach mit **Moneten**.
- **Wiedergeburt:** kostet Moneten (1 Mio., danach jeweils ×4), setzt die Moneten auf 0 und macht
  jede Münze dauerhaft 50 % mehr wert. Welten, Münzen, Level und Skills bleiben.
- **Planet 3 (Tiefsee)** hat Lichtmuster auf dem Meeresboden, Quallen, Schildkröten, einen Mantarochen,
  Anemonen mit Clownfischen, Kelp und Seeigel. Wahrzeichen: Schiffswrack und Korallenbogen
  (Korallenriff), Muschelhaus, Perlenbrunnen, Krabben und Seepferdchen (Muschelland), Palast mit
  Kristallkuppel, vier Türmen, Runenkreis und Säulenallee (Atlantis).
- Jede Insel hat eine Teleport-Plattform (Ankunftsort) und Details wie Brücke, Häuschen, Brunnen,
  Lore auf Schienen, Cupcakes, Geysire, Schatztruhe, Sandburg oder Statuen.
- **Roblox-Vorschau:** Die 3D-Ansicht zeigt die Insel so, wie sie nach dem Import in Roblox aussieht:
  dieselben Teile wie die `.rbxmx`-Datei, Roblox-Licht und -Himmel und das Wetter aus dem Modul
  `WeatherFx` (`welten/js/robloxWorld.js`). Die Insel selbst steht still; bewegt ist die Umgebung (`WorldFx`).
- **Licht je Welt:** Jede Welt bringt im Ordner `Licht` eine Atmosphere (Himmelsfarben) und
  Lighting-Werte mit (`worldLighting` in `roblox/js/worldParts.js`). Das Skript
  `CoinmasterWorldLighting` setzt sie im Spiel für die Welt, in der man ist; die Vorschau nutzt dieselben Werte.
- **Umgebung je Welt (`WorldFx`, `roblox/js/worldFxLuau.js`):** rund um jede Insel baut das Luau-Modul
  `WorldFx` eine eigene Umgebung aus Parts, ruhig animiert. Das LocalScript `CoinmasterWorldFx` baut sie im
  Spiel für die Welt, in der die Kamera ist; die Vorschau führt dasselbe Modul aus.
  - *Himmel & Licht:* Sonne mit Schein, Mond, funkelnde Sterne, wogendes Polarlicht (Eis, Neptun),
    Nebelschleier und Kometen im All, Lichtstrahlen von der Wasseroberfläche, eine sanfte Farbstimmung
    (ColorCorrection) je Welt. Der Nebel reicht weiter als vorher, damit die Ferne zu sehen ist.
  - *Fernkulisse* nach dem Kulissen-Konzept aus Claude Design: drei Tiefen statt eines Rings – **Nah**
    380–460 Studs (niedrig, satt), **Mitte** 480–560, **Fern** 600–630 (stark in die Horizontfarbe getönt) –,
    in drei bis vier Gruppen mit Tälern dazwischen, dazu ein flaches **Horizontband** in Horizontfarbe knapp über
    dem Meer. Berge, Kämme, Eisspitzen, Vulkane (mit offenem Krater) und Stalagmiten sind aus Dreiecken gebaut
    (je zwei Keile): Fußring, zwei verdrehte Ringe und Spitze, Flächen abwechselnd hell und dunkel, Schnee über
    einer zackigen Grenze; gebaut wird nur die Seite zur Insel. Gegenüber der Startkamera steht je Welt ein
    riesiges **Wahrzeichen** mit einer ruhigen Bewegung:
    Münzberg mit Münzfall (Spawn), Wasserfallberg (Normal), Weltenbaum (Wald), Fernsehturm mit drehendem Licht
    (Stadt), Gletscherwand (Eis), Vulkan mit Ausbruch alle 40 s (Lava), Riesenkristall in der Decke (Höhle),
    Tortenberg (Candy), die Erde (Mond), Sturmauge mit Blitzen (Neptun), Olympus Mons (Mars), Saturn mit
    drehendem Ring, Mutterschiff (Alien), Protuberanz (Sonne), Riffwand mit Höhle (Korallenriff), sich öffnende
    Riesenmuschel (Muschelland), Tempelberg mit Goldkuppel (Atlantis), Anglerfisch mit Leuchtköder
    (Tiefseegraben), Burg auf einer Wolkensäule (Wolkenburg), Lichtbaum (Engelsgarten) und der Thron auf dem
    höchsten Gipfel (Götterthron). Die Texte je Welt stehen in `KULISSE` (`welten/js/worlds.js`) und in der
    Weltkarte unter „Fernkulisse“.
  - *Atmosphäre-Partikel:* Lichtstaub, fallende Blätter, Schneeflocken, Asche, Leuchtsporen, Sternenstaub,
    Staubwind, Funken, Meeresschnee.
  - *Leben:* kreisende Vogelschwärme, Fledermäuse, Schmetterlinge, Heißluftballons, ein Luftschiff,
    Satelliten, schwebende Inselchen, Himmelsquallen, Fischschwärme, Quallen und ein Wal.
- **Größenvergleich** (Knopf in der 3D-Ansicht): stellt eine normal große Roblox-Figur (gut
  5 Studs, klassische Block-Proportionen) neben die Teleport-Plattform und fährt die Kamera hin.
  Eine Insel ist rund 256 Studs breit, also etwa 64 Figuren nebeneinander
  (`welten/js/character.js`).
- `welten/js/worlds.js` – Daten (Preise, Boni, Portale, Wiedergeburt), `js/worldFactory.js` –
  entwirft die Inseln (daraus macht `roblox/js/worldParts.js` die Roblox-Teile), `js/robloxWorld.js` –
  Roblox-Vorschau, `js/thumbs.js` – Vorschaubilder.

In der Spiel-Oberfläche gibt es dazu das Fenster **Welten** (Taste W) zum Kaufen, Teleportieren,
Öffnen von Portalen und für die Wiedergeburt. Die aktuelle Welt läuft dort als 3D-Hintergrund.
Der Knopf „+ Test-Moneten“ gibt es nur in der Vorschau, damit man spätere Welten ausprobieren kann.

## Wetter

`wetter/` zeigt alle Wetter: was gerade herrscht, jedes Wetter in 3D auf einer wählbaren Welt, eine Münze
mit der passenden Mutation, eine Vorhersage und eine Übersicht.

**Zeitplan:** Meist ist es klar. Die Zeit ist in Blöcke von 15 Minuten geteilt; pro Block wird gewürfelt, ob er
klar bleibt (50 %) oder ein Wetter kommt. Das Wetter hält je nach Art 2 bis 6 Minuten an einer gewürfelten Stelle
im Block. So ist es etwa 85 % der Zeit klar, oft eine Stunde und länger. Alles ergibt sich aus der Uhrzeit (für
alle Spieler gleich), mit derselben Ganzzahl-Rechnung in JS (`weatherAt`, `nextWeather` in
`muenzen/js/mutations.js`) und Luau (`Gacha.WeatherAt`, `Gacha.NextWeather`, `Gacha.Forecast`).

| Wetter | Seltenheit | Anteil | Dauer | Mutation | Chance | Wert |
|---|---|---|---|---|---|---|
| Klar | – | 85 % | – | – | – | – |
| Regen | Gewöhnlich | 6,4 % | 6 min | Nass | 25 % | ×1,1 |
| Gewitter | Ungewöhnlich | 2,9 % | 5 min | Elektrisch | 10 % | ×1,75 |
| Erdbeben | Ungewöhnlich | 1,2 % | 3 min | Gestein | 18 % | ×1,25 |
| Schneesturm | Ungewöhnlich | 2,3 % | 5 min | Gefroren | 20 % | ×1,3 |
| Disconacht | Selten | 1,1 % | 4 min | Disco | 12 % | ×1,5 |
| Blutmond | Selten | 0,86 % | 4 min | Dämonisch | 8 % | ×2 |
| Neonsturm | Episch | 0,32 % | 3 min | Augenkrebs | 5 % | ×2,5 |
| Goldregen | Episch | 0,22 % | 3 min | Golden | 4 % | ×4 |
| Datensturm | Legendär | 0,11 % | 3 min | Hacked | 3 % | ×3 |
| Sternschnuppen | Mythisch | 0,04 % | 2 min | Kosmisch | 2 % | ×5 |

- **Seltenheiten:** Gewöhnlich, Ungewöhnlich, Selten, Episch, Legendär, Mythisch. Je seltener, desto stärker
  die Effekte (`intensity`: Regen 35 % … Sternschnuppen 120 %) und desto größer die Ansage: farbiges
  Seltenheits-Schild, ab Episch ein Blitz über den ganzen Bildschirm, ab Legendär ein pulsierender Rahmen.
- **Vorwarnung:** Eine Minute vorher kündigt sich das Wetter an („⚠ Gewitter zieht auf · 0:42“) als Leiste oben
  und in der Wetter-Anzeige. Der Server setzt dafür `WeatherNext` und `WeatherNextAt` an ReplicatedStorage.
- **Sanfte Übergänge:** `WeatherFx` blendet Licht, Nebel, Wolkendecke und Partikel über 8 Sekunden ein, das
  alte Wetter klingt über 6 Sekunden aus.
- **Effekte:** Regen mit Schlieren, Spritzern am Boden und Dunst; Gewitter mit verästelten Blitzen und
  Lichtblitz; Erdbeben in Wellen mit fallenden Brocken und Staubwolken; Schneesturm mit großen und kleinen
  Flocken in Böen; Disconacht mit Konfetti und schwenkenden Lichtkegeln; Blutmond mit riesigem rotem Mond,
  Glut und Bodennebel; Neonsturm mit Neonschlieren; Goldregen mit taumelnden Goldmünzen und Glitzern;
  Datensturm mit Code-Regen und Störflackern; Sternschnuppen mit langen Schweifen, Sternenhimmel und Polarlicht.
- **3D-Wetter:** Die Weltkarte (Auswahl „Wetter“), die Wetter-Seite und der Spiel-Hintergrund führen
  das Roblox-Modul `WeatherFx` aus, genau wie im Spiel.
- **Spiel:** Ansage beim Wetterwechsel, Fenster „Wetter“ (Taste V oder Wetter-Anzeige antippen) mit
  Vorhersage und allen Wettern (Seltenheit, Anteil, Dauer).
- **Roblox:** Modul `WeatherFx` und zwei Skripte, die der Installer anlegt: `CoinmasterWeather` (Server) und
  `CoinmasterWeatherClient` (Effekte, Vorwarnung, Ansage).

## Auras

`auren/` zeigt 50 Auras, die um die Spielerfigur leuchten, als Galerie mit Filtern nach Thema und
Seltenheit und einer drehbaren Detailansicht (`auren/js/auras.js` für die Daten). Jede Vorschau führt die
Roblox-Module `AuraData` und `AuraFx` aus und zeigt die Aura an einer Roblox-Figur auf einer Baseplate,
genau wie nach `/aura <id>` in Studio (`auren/js/auraRoblox.js`).

- **Themen:** Elemente, Münzen & Schätze, Weltraum & Magie, Lustig & Glitch (je 12 bis 13 Auras).
- **Seltenheit, Preis und Bonus:** Gewöhnlich (ab 1.000 Moneten, +1 bis 3 %) bis Göttlich (bis 1 Mrd. Moneten,
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
  Anlegen über die RemoteFunction `AuraRemote`, Moneten aus `leaderstats.Moneten`) und `CoinmasterAuraClient`
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

- **HUD:** Level-Abzeichen, EP-Balken, Skillpunkte, Welt, Moneten, Wetter mit Countdown, aktive Boosts,
  Menü (Welten, Skills, Inventar, Shop, Index, Optionen) und „Münze suchen“, das einen Fund simuliert.
  Funde und Käufe erscheinen als Hinweise (`GameUI.Toast`).
- **In Roblox:** `GameUI.Start()` läuft im LocalScript `CoinmasterUI`. Den Spielstand liest es aus
  Attributen am Spieler (`Moneten` oder `leaderstats.Moneten`, `Level`, `XP`, `XPMax`, `Points`, `WorldName`,
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
  das Attribut `World` und stellt die Figur an den Spawn des Modells `Welt_<Name>`. „+ Test-Moneten“ gibt
  es nur in der Vorschau.
- **Skilltree** (Taste K, Daten in `spiel/js/skills.js`, in Roblox `SkillData`): Kern plus vier Äste
  mit je fünf Skills (Erkundung, Münzen & Glück, Eier & Haustiere, Komfort). Skillpunkte kommen aus
  Leveln (jedes Level 1, jedes fünfte 2). Glück, Wert, Doppelfund, Wettergespür, Goldene Hand,
  Feilscher und Großer Beutel wirken in der Vorschau schon; die Erkundungs-Skills gelten später in den
  Welten. Sichtbar sind nur Skills, deren Vorgänger man gelernt hat. Der Baum besteht aus Frames
  (Linien sind gedrehte Frames); „+“ zoomt um den gewählten Skill.
- **Shop** (Taste B): Eier, Boosts und Auras für Moneten, Robux-Angebote nur angedeutet.
- **Wetter** (Taste V): Vorhersage der nächsten Phasen und alle Wetter mit ihrer Mutation.
- **Belohnungen** (`spiel/js/rewards.js`, in Roblox `RewardData`): tägliches Geschenk mit Serie,
  Glücksrad (aus gedrehten Frames, dreht per TweenService) und Gruppen-Bonus.
- **Codes:** Eingabe im TextBox, Enter oder „Einlösen“.
- **Ranglisten:** Moneten, Münzen, Wiedergeburten, Level, mit deinem Platz (in der Vorschau mit
  Beispiel-Spielern).
- **Einstellungen** (Taste O, `js/settings.js`): gelten für alle Seiten, z. B. Grafikqualität der
  3D-Ansichten und „Animationen überspringen“. In Roblox stehen sie als Attribute `Set_…` am Spieler.

**Design-System** (Modul `UITheme`): alle Farben, Schriften, Textgrößen (Tiny 12 bis Hero 34), Ecken,
Abstände und Bewegungen der Oberfläche an einer Stelle. Bewegungsregeln: `Fast` 0,12 s (Maus drüber),
`Normal` 0,22 s (Fenster, Balken), `Pop` 0,22 s mit Überschwingen (Öffnen, Drücken, Hinweise), `Slow`
0,4 s (Belohnungen), `Exit` 0,16 s (Schließen, schneller als Öffnen). Fenster öffnen und schließen animiert.

**Neu füllen nur wenn nötig:** Jedes Fenster kennt seine Daten (`deps`, z. B. der Shop: Moneten, Eier,
Boosts, Auras). Ändert sich etwas anderes, bleibt es stehen; mehrere Änderungen im selben Bild ergeben einen
Neuaufbau. Countdowns (Wetter, Belohnungen, Boosts im HUD) ändern jede Sekunde nur ihren Text.

**Spielgefühl:** Moneten zählen hoch statt zu springen, ein grünes „+500“ steigt neben dem Moneten-Feld auf
und das Feld wippt; der EP-Balken gleitet (bei einem neuen Level erst voll, dann von vorn). Beim Verkaufen
fliegen Münzen vom Knopf zum Moneten-Feld (`GameUI.FlyCoins`). Funde zeigt `GameUI.Found` je nach Seltenheit:

| Stufe | Seltenheit | Effekt |
| --- | --- | --- |
| 1 | Normal, Selten | Hinweis, „+Moneten“ steigt auf, Münzen fliegen zum Moneten-Feld, der Knopf springt |
| 2 | Sehr selten, Episch | dazu Fundkarte mit Glanz und leichtes Wackeln |
| 3 | Legendär, Mystisch, Engelsgleich | dazu Bildschirm-Blitz, Funken, Strahlenkranz, große Ansage, kräftiges Wackeln |
| 4 | Göttlich, Galaktisch, Unerreichbar | dazu kurze Zeitlupe (Bild wird dunkel, Kamera zoomt) und Münzregen |

Eine Mutation hebt um eine Stufe. „Animationen überspringen“ zeigt nur den Hinweis, „Weniger Partikel“
halbiert Funken, Konfetti und Münzregen.

**Mehr Juice** (alles aus Frames und Tweens, abschaltbar über „Animationen überspringen“):
- *Glanz*: Aktionsknöpfe haben einen Verlauf, einen dunklen Rand und Text mit Kontur (Simulator-Stil); ein
  Lichtstreifen läuft alle paar Sekunden schräg darüber, ebenso über Moneten, Diamantstaub, Level-Abzeichen und
  Fenster-Icon, und beim Drüberfahren über jeden Knopf und Reiter (`shine`, `glossy`).
- *Icons wackeln*, wenn die Maus über einen Knopf fährt; der gewählte Reiter glänzt golden und springt beim Wechsel auf.
- *„Münze suchen“* pulsiert mit seinem Rand und glänzt regelmäßig; im Juwelnebel wird er lila.
- *Fenster* sind oben warm angeleuchtet, haben eine goldene Zierlinie und funkelnde Sterne im Kopf; Karten sind
  oben in ihrer Randfarbe getönt.
- *Knöpfe* drücken sich ein und federn beim Loslassen nach (Elastic), dazu ein kleiner Funkenkranz.
- *Fenster* springen aus der Mitte auf, federn nach und kippen dabei kurz.
- *Käufe* lassen Konfetti regnen und das Moneten-Feld wippen; große Momente (neue Welt, Portal, Wiedergeburt)
  bekommen Blitz, Wackeln, Strahlenkranz und Ansage. Geht ein Kauf nicht, schüttelt das Moneten-Feld den Kopf.
- *Moneten* leuchten beim Gewinn weiß auf, das Feld wippt stärker, je mehr es ist.
- *Level-Aufstieg*: das Abzeichen springt, Goldkonfetti, Strahlen und (im Spiel) die Ansage „LEVEL X!“.
- *Münzrollen* enden mit Wackeln und Konfetti.
- *Bewegung und Kamera* (LocalScript `CoinmasterJuice`, `roblox/js/juiceLuau.js`, nur im Spiel): Staub beim
  Springen und Landen, harte Landungen lassen die Kamera wackeln und stauchen das Sichtfeld, schnelles Laufen
  weitet es, ein Teleport blitzt auf und lässt Funken sprühen.

**Icons:** Alle Icons der Oberfläche liegen auf einem Bild (`roblox/js/iconSheet.js`, 47 Icons in Gold,
1024 × 768). Auf der Roblox-Seite gibt es `Icons.png` zum Herunterladen (Schritt 5); nach dem Hochladen die
Asset-ID in `UITheme.IconSheet` eintragen. `GameUI.Icon(name)` schneidet das Icon mit `ImageRectOffset`
aus; ohne Bild-ID zeigt es das passende Emoji. Die Vorschau zeigt die Icons schon.

**Handy zuerst:** Bei weniger als 900 × 560 Punkten (`Camera.ViewportSize`) ordnet sich die Oberfläche
fürs Handy an: Menü als Leiste unten links, „Münze suchen“ groß unten rechts (Daumen), Fenster fast
vollflächig und etwas kleiner skaliert, schmalere Kopfzeile. Hochkant rückt „Münze suchen“ über das Menü.
Der HUD-ScreenGui nutzt `ScreenInsets = CoreUISafeInsets` (Notch). In der Vorschau zeigt der Knopf
„Handy-Ansicht“ die Spielansicht in iPhone-Größe quer (844 × 390).

**3D-Vorschauen** (`GameUI.ModelView`, ViewportFrame): Die gewählte Münze im Inventar und die Münze auf
der Fundkarte drehen sich als echtes Modell aus `CoinBuilder` (mit Mutation), Eier im Shop und im Inventar
kommen aus `EggBuilder`, die Welt-Karten zeigen eine kleine Insel in den Farben der Welt. Die Kamera rahmt
jedes Modell nach seiner Größe ein; gedreht wird nur, wo es etwas bringt (Handy). Das Münz-Raster bleibt
flach, damit es auch mit vielen Münzen flüssig bleibt. Die Mitte einer Münze zeigt ihr Motiv erst, wenn
die Motive hochgeladen und in `CoinData` eingetragen sind (Schritt 3). Haustiere bekommen ihre Vorschau,
sobald das Spiel geschlüpfte Tiere speichert. In der Vorschau hat jedes ViewportFrame eine eigene kleine
Welt (`js/rbx/screen.js`), die nur neu gezeichnet wird, wenn sich darin etwas bewegt.

Test-Knöpfe nur in der Vorschau: „+ Test-Moneten“, „Test: Wetter“, „Test: nächster Tag“, „Test:
Spielstand neu beginnen“.

Tastenkürzel: W Welten, K Skills, I Inventar, B Shop, V Wetter, O Einstellungen, F Münze suchen,
F2 Admin Panel (nur Admins), Esc schließt.

## Admin Panel

Ein Fenster nur für Admins: Menüknopf **Admin** (Schild, roter Rand) und Taste **F2**. Normale Spieler sehen
weder Knopf noch Fenster. Jede Aktion prüft der Server; das Panel schickt nur Wünsche.

**Wer ist Admin?** Das entscheidet allein das Server-Skript `CoinmasterAdmin` und setzt dann das Attribut
`Admin` am Spieler (wird nicht gespeichert):

- der Besitzer des Spiels (bei Gruppenspielen der Gruppen-Besitzer, Rang 255),
- die UserIds in `ADMIN_IDS` in `spiel/js/admin.js` (danach neu übertragen),
- ohne neuen Import: in Studio unter `ServerStorage` einen Ordner `CoinmasterAdmins` mit IntValues anlegen
  (Value = UserId). Den Ordner lässt der Installer stehen,
- in Studio beim Testen alle (`STUDIO_ADMINS` oben im Skript).

| Reiter | Was geht |
|---|---|
| Wetter & Welt | jedes Wetter für 5, 10, 15 oder 30 Minuten erzwingen (danach geht der Zeitplan weiter), „Zurück zum Zeitplan“; Uhrzeit für alle (Morgen, Mittag, Abend, Nacht oder Licht der Welt); Teleport in jede Welt; alle Welten und Portale für sich freischalten |
| Spieler | alle Spieler auf dem Server mit Spielstand (Level, Moneten, Welt, Welten, Wiedergeburten, Münzen, Funde, Eier, Auras, Online-Zeit); Hinreisen, Kicken und Bannen (1 Stunde, 1 Tag, 7 Tage, für immer) mit Grund; Spielstand zurücksetzen (zweimal tippen) |
| Server-Events | Ansage an alle (höchstens 160 Zeichen, von Roblox gefiltert); Boosts für alle (Glückstrank, Weisheitsrolle, Wetterglocke) für 10, 30 oder 60 Minuten, verlängern oder beenden; Admin Egg an alle verteilen; Protokoll aller Admin-Aktionen auf dem Server |
| Banns | per UserId bannen, auch wer gerade nicht da ist; Liste aller Banns mit Dauer, Grund und Admin; Aufheben |

- **Schutz:** Admins kann man nicht kicken oder bannen, sich selbst auch nicht. Bannen und Zurücksetzen
  brauchen einen zweiten Klick. Mindestens 0,2 s zwischen zwei Aufrufen, alle Werte werden geprüft (nur die
  angebotenen Zeiten, Wetter, Welten und Boosts).
- **Wetter:** `ReplicatedStorage` bekommt `AdminWeather` und `AdminWeatherEnds`. `CoinmasterWeather` prüft jetzt
  jede Sekunde und nimmt das erzwungene Wetter, danach wieder den Zeitplan; die Vorwarnung zeigt, was danach
  kommt. `Gacha.Forecast` setzt es in der Vorhersage an die erste Stelle.
- **Uhrzeit:** `AdminClock` an `ReplicatedStorage`; jeder Client hält `Lighting.ClockTime` darauf, auch gegen
  Weltlicht und Wetter.
- **Boosts für alle:** `ServerBoost_<id>` an `ReplicatedStorage` (Ende als `os.time()`). Im HUD stehen sie mit ★
  und goldenem Rand unter den eigenen Boosts. Wer würfelt, fragt `AdminData.BoostActive(player, "glueck")`:
  das ist wahr bei eigenem Boost oder Server-Boost. In der Vorschau wirken sie schon beim Suchen.
- **Banns:** im DataStore `CoinmasterBans` (ein Schlüssel `Liste`), gelten auf allen Servern: beim Beitreten
  geprüft, jeder Server liest die Liste alle 60 Sekunden neu und wirft Gebannte hinaus. Ohne DataStore (Studio
  ohne API-Zugriff) gelten sie nur auf diesem Server.
- **Zurücksetzen:** `PlayerData.Reset(player)` setzt Moneten, Fortschritt, Münzen und Garten auf Anfang
  (Einstellungen bleiben) und meldet das über `PlayerData.Resetted`.
- **Ansagen:** RemoteEvent `AdminEvent` an alle (`"announce"` oder `"event"`), groß unter der Wetter-Ansage
  (`GameUI.AdminAnnounce`), am Handy oben.
- **Roblox:** Modul `AdminData` (Zeiten, Uhrzeiten, Bann-Dauern, `BoostActive`), das Fenster in GameUI
  (`roblox/js/adminLuau.js`, `GAME_UI_ADMIN`) und das Skript `ServerScriptService > CoinmasterAdmin` mit der
  RemoteFunction `AdminRemote`. Zeiten und Taste stehen in `spiel/js/admin.js`.
- **Vorschau:** In `spiel/` bist du Admin. Die anderen Spieler sind Beispiele, Banns bleiben im Browser.
- **Icon:** neues Icon `shield`. Wer das Icon-Bild schon hochgeladen hat, lädt es neu hoch (sonst bleibt der
  Admin-Knopf ohne Bild).

## Speichern in Roblox

Das Modul `PlayerData` (ServerScriptService > CoinmasterServer, gestartet vom Skript `CoinmasterData`)
lädt und speichert den Spielstand im DataStore `CoinmasterAdventure` (ein Profil pro Spieler):

- **Session-Lock:** Nur ein Server hält ein Profil. Ein zweiter wartet, bis der erste freigibt; ein
  Lock von einem abgestürzten Server gilt nach 15 Minuten als frei.
- **Sicher speichern:** jeder Zugriff mit bis zu drei Wiederholungen, Autosave alle 2 Minuten, beim
  Verlassen und beim Herunterfahren (`BindToClose`).
- **Versionsnummer:** `PlayerData.Migrate` bringt ältere Profile auf den neuesten Stand.
- **Was gespeichert wird:** `leaderstats.Moneten`, die Münz-Stapel und die Attribute (Level, EP, Welten,
  Portale, Wiedergeburten, Supernovas, Edelsteine (`Gem_`, `GemValue_`), Auras, Skills, Belohnungen, Codes, Eier, Boosts, Einstellungen, Münzbaumgarten).
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
  Zylinder, Kugel per SpecialMesh), der Boden wird zu Säulen aus Gras und Erde entlang der Hügel. Pro Welt ein
  Model mit den Ordnern `Insel`, `Deko`, `Muenzen` (Teile „CoinSpawn“), `Teleport`
  („TeleportPad“), `Himmel`, `Effekte` (PointLights, ParticleEmitter) und `Einstellungen`.
  Maßstab: 1 Einheit = 8 Studs, eine Insel ist rund 256 Studs breit. Dazu der Ordner `Licht` (Atmosphere,
  BloomEffect und Lighting-Werte). Animationen fehlen in Studio noch.

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
- `haustiere/` – Haustiere: `js/pets.js` (Seltenheiten, Eier, 99 Pets, `rollPet`), `js/main.js` (Liste)
- `taschen/` – Taschen: `js/bags.js` (Stufen, 99 Rücken-Items), `js/main.js` (Liste)
- `edelsteine/` – Edelsteine: `js/gems.js` (20 Steine, Werte), `js/main.js` (Liste)
- `css/liste.css` – gemeinsame Gestaltung der Listen-Seiten (Haustiere, Taschen)
- `auren/` – Auras: `js/auras.js` (Daten, Preise, Boni, Grundpaket), `js/auraRoblox.js` (Vorschau mit AuraFx), `js/main.js` (Galerie)
- `js/rbx/` – Roblox-Engine und Luau im Browser für die 1:1-Vorschau
- `welten/` – Weltkarte: `js/worlds.js` (Galaxien, Planeten, Welten, Wiedergeburt, Supernova), `js/worldFactory.js` (3D-Inseln), `js/galaxie2.js` (Welten des Juwelnebels), `js/thumbs.js` (Vorschaubilder)
- `spiel/` – Spiel-Oberfläche: `js/skills.js` (Skilltree-Daten), `js/state.js` (Spielstand, Level, Effekte), `js/rewards.js` (Belohnungen, Codes, Ranglisten), `js/admin.js` (Admins und Zeiten fürs Admin Panel), `js/robloxUi.js` (Roblox-Oberfläche GameUI); Luau des Admin Panels in `roblox/js/adminLuau.js`
- `js/nav.js` – gemeinsame Navigation (klebende Leiste mit gleitender Messing-Markierung und Münz-Klang, auf dem Handy ausklappbares Menü) und „Nach oben“-Knopf für alle Seiten
- `roblox/` – Export nach Roblox Studio: `js/luau.js` (Luau-Code), `js/auraLuau.js` (Auras), `js/zip.js` (ZIP), `js/main.js` (Sperre, Downloads)
- `js/bereiche.js` – Liste der Bereiche auf der Startseite
- `css/theme.css` – gemeinsame Farben, Schriften und Grundlayout
- `eier/` – Eierhalle: `js/eggs.js` (Daten, Preise), `js/eggRoblox.js` (Eier und Schlüpfen über Luau), `js/hatch.js` (Schlüpf-Ansicht); Luau in `roblox/js/eggLuau.js`
- `muenzindex/` – Münzindex: `js/main.js` (Fächer, Ziehen, Spielstand), `js/discovery.js` (Animation)
- `muenzen/` – Münzkabinett:
  - `js/coins.js` – Stufen (mit Premium) und alle 60 Münzen (Name, Motiv-Schlüssel, Metallfarben, Text, Wert, Gewicht), `rollCoin`, `coinChance`, `coinBaseValue`
  - `js/emblems.js` – die 60 Prägemotive als Relief-Zeichnungen
  - `js/mutations.js` – Wetter, Mutationen, Chancen, Multiplikatoren und ihre Effekte
  - `js/coinFactory.js` – baut aus einem Datensatz die 3D-Münze (Prägung, Gravurmuster, Effekte)
  - `js/main.js` – Namen nach Stufe, Drop-Tabelle, Filter, Suche
  - `css/style.css` – Gestaltung

Neue Münze: einen Eintrag in `COINS` ergänzen. Gravur, Zierband und Effekte kommen automatisch aus der Stufe.
