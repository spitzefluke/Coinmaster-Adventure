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
