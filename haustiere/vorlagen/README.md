# Vorlagen für Roblox-Pets (Hyper3D Rodin)

Gerenderte Ansichten unserer three.js-Haustiere, als Bildvorlage für die Generierung im Roblox-Stil
mit Hyper3D Rodin. Neu erzeugen mit `tools/render-vorlagen.mjs` (Anleitung im Skript).

| Pet | Vorlagen |
|---|---|
| Hund (`hund`) | front, schraeg, seite |
| Bär (`baer`) | front, schraeg, seite |
| Fliegender Quellcode-Drache (`codedrache`) | front, schraeg, seite |

Geplante Einstellungen für den Test: `rodin_generate`, Gen-2.5-Medium, Mesh `Quad` mit etwa
5 000 Polygonen (Roblox erlaubt bis 20 000 Dreiecke pro MeshPart), Format `.glb`/`.fbx`.
Vorlagen je Pet: `schraeg` + `seite`.

## Testlauf 31.10.2026

Je Pet `schraeg` + `seite` als Vorlage, Gen-2.5-Medium, Quad, 5 000 Polygone, `.glb`.

| Pet | Ergebnis |
|---|---|
| Hund | https://hyper3d.ai/workspace/rodin/a4ca7bb4-99bb-44e5-a6eb-21d1dcdbe997 |
| Bär | https://hyper3d.ai/workspace/rodin/be1dd2e1-4c17-44cf-b005-91d577e16517 |
| Fliegender Quellcode-Drache | https://hyper3d.ai/workspace/rodin/672cfc7e-32e5-4ff4-8139-927993ca8172 |

## Testlauf 2 – nur Prompt, „episch“

Ohne Vorlage-Bilder, ein ausführlicher Prompt je Pet (legendärer Roblox-Pet-Stil, große Köpfe,
Gold-/Neon-Akzente, Leuchteffekte). Gen-2.5-Medium, Quad, 8 000 Polygone, `.glb`.

| Pet | Ergebnis |
|---|---|
| Hund (Heldenwelpe mit Goldmünze) | https://hyper3d.ai/workspace/rodin/92545e25-c17f-49d8-87de-fa5ab4742af1 |
| Bär (Waldkönig) | https://hyper3d.ai/workspace/rodin/492d5c6c-88ae-4a06-92ac-7c6cb44890af |
| Fliegender Quellcode-Drache | https://hyper3d.ai/workspace/rodin/de3389b5-f831-4a21-84c6-abbeeadb87b9 |

## Lauf 3 – alle 49, episch und animiert

Prompts in `prompts.json`: je Pet eine eigene Beschreibung plus der gemeinsame Stil-Satz
(animierter Cartoon-Filmstil, große ausdrucksstarke Augen, lebendige Action-Pose).
Gen-2.5-Medium, Quad, 8 000 Polygone, `.glb`. Generation-IDs in `ergebnisse.tsv`.

Die ersten 23 liegen im ersten Hyper3D-Konto, die Engels-Pets ab Adler in einem zweiten.
Links funktionieren nur im jeweiligen Konto.

| Pet | ID | Konto | Ergebnis |
|---|---|---|---|
| Hund | `hund` | Konto 1 | https://hyper3d.ai/workspace/rodin/d7d56738-1096-4481-b206-e9b30ec5e723 |
| Katze | `katze` | Konto 1 | https://hyper3d.ai/workspace/rodin/c4429694-f3b9-4e8d-9692-30059bcf8c0c |
| Küken | `kueken` | Konto 1 | https://hyper3d.ai/workspace/rodin/c42fdda0-7887-4005-9edb-1d37cf2d824e |
| Pferd | `pferd` | Konto 1 | https://hyper3d.ai/workspace/rodin/7d5f63a7-c8a0-485f-ab59-ec5452401655 |
| Kuh | `kuh` | Konto 1 | https://hyper3d.ai/workspace/rodin/a11b812e-0804-464e-b8a5-9b15794b77e0 |
| Frettchen | `frettchen` | Konto 1 | https://hyper3d.ai/workspace/rodin/8a870d97-7897-4ee2-ba5a-a9ba50083dca |
| Otter | `otter` | Konto 1 | https://hyper3d.ai/workspace/rodin/dc1eee92-bab6-4532-9447-e5a4701f0bd0 |
| Fuchs | `fuchs` | Konto 1 | https://hyper3d.ai/workspace/rodin/f0c5abe1-6dd7-4b98-95d8-b1a3e6806841 |
| Reh | `reh` | Konto 1 | https://hyper3d.ai/workspace/rodin/55500e2c-3cab-4a5c-a5c2-834639693df7 |
| Frosch | `frosch` | Konto 1 | https://hyper3d.ai/workspace/rodin/dc800614-77cd-4cb2-8d81-e66894062516 |
| Dachs | `dachs` | Konto 1 | https://hyper3d.ai/workspace/rodin/e50f6ddd-12cb-4c5c-9b53-4a66cb334790 |
| Schlange | `schlange` | Konto 1 | https://hyper3d.ai/workspace/rodin/476363d3-f0e6-483b-ba20-53964156dd36 |
| Bär | `baer` | Konto 1 | https://hyper3d.ai/workspace/rodin/2d396154-1ed9-4c7b-980a-3485d978f025 |
| Wolf | `wolf` | Konto 1 | https://hyper3d.ai/workspace/rodin/d7f7b968-6938-4d13-acea-42e182633881 |
| Schneemann | `schneemann` | Konto 1 | https://hyper3d.ai/workspace/rodin/b2d2c155-3da4-4b03-9a99-52a545341cc8 |
| Polarhase | `polarhase` | Konto 1 | https://hyper3d.ai/workspace/rodin/6c9222ac-f10c-4b5f-865c-77fc7a69a37b |
| Eisbär | `eisbaer` | Konto 1 | https://hyper3d.ai/workspace/rodin/3b8a974a-8cc0-4e7e-b35e-14a6bd443818 |
| Robbe | `robbe` | Konto 1 | https://hyper3d.ai/workspace/rodin/307333b3-b9d9-4974-af87-4914076a9fb4 |
| Pinguin | `pinguin` | Konto 1 | https://hyper3d.ai/workspace/rodin/569ec9f8-c7fd-4bd2-87d6-c1a2df435780 |
| Schneegolem | `schneegolem` | Konto 1 | https://hyper3d.ai/workspace/rodin/ca97c654-a817-4246-aa46-bbabb815a3ab |
| Polarfuchs | `polarfuchs` | Konto 1 | https://hyper3d.ai/workspace/rodin/f9526792-ab46-4b72-876e-0cc7b0112f96 |
| Engelshund | `engelshund` | Konto 1 | https://hyper3d.ai/workspace/rodin/306d00ac-3117-432a-8fc7-8a50947155a6 |
| Engelskatze | `engelskatze` | Konto 1 | https://hyper3d.ai/workspace/rodin/baa75296-1393-406c-a4ae-2fe9c09787a4 |
| Adler | `adler` | Konto 2 | https://hyper3d.ai/workspace/rodin/ad854f10-307b-4366-a1d1-7f1491aad99f |
| Engelsfuchs | `engelsfuchs` | Konto 2 | https://hyper3d.ai/workspace/rodin/3ef592de-9dd0-4bb1-842d-fb9078834eba |
| Engel | `engel` | Konto 2 | https://hyper3d.ai/workspace/rodin/f20d1334-2a9f-4868-90ec-129775f96e80 |
| Gott | `gott` | Konto 2 | https://hyper3d.ai/workspace/rodin/6cb8a2c1-ccf9-4831-9e34-b6649c61568f |
| Löwe | `loewe` | Konto 2 | https://hyper3d.ai/workspace/rodin/d48a62be-5b10-4030-b5d7-69ae4ba9417b |
| Galaktischer Wolf | `galaxiewolf` |  | offen |
| Singularity Beetle | `singularity` |  | offen |
| Sternbild-Kätzchen | `sternbild` |  | offen |
| Gravitations-Hamster | `hamster` |  | offen |
| Kometen-Echse | `komet` |  | offen |
| Ring-Gleiter | `ringgleiter` |  | offen |
| Nebel-Welpe | `nebelwelpe` |  | offen |
| Glitch-Hund | `glitchhund` |  | offen |
| Ban-Hammer-Krokodil | `banhammer` |  | offen |
| Lag-Schwein | `lagschwein` |  | offen |
| UI-Vogel | `uivogel` |  | offen |
| Schwebendes Datei-Kätzchen | `dateikatze` |  | offen |
| Fliegender Quellcode-Drache | `codedrache` |  | offen |
| Server-Raum-Chamäleon | `serverchamaeleon` |  | offen |
| Partyhut-Dackel | `dackel` |  | offen |
| Konfetti-Chamäleon | `konfetti` |  | offen |
| Luftballon-Schweinchen | `ballonschwein` |  | offen |
| Wunderkerzen-Fuchs | `wunderkerze` |  | offen |
| Champagner-Qualle | `qualle` |  | offen |
| Launch-Day-Roboter | `roboter` |  | offen |
| Feuerwerk-Phönix | `phoenix` |  | offen |
