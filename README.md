# Coinmaster Adventure – Münzkabinett

Vorschau-Galerie mit 50 3D-Münzen in 10 Seltenheitsstufen, gerendert mit three.js.

| Stufe | Münzen | Drop-Chance | Form | Effekte |
|---|---|---|---|---|
| Normal | 9 | 40 % | rund | – |
| Selten | 8 | 25 % | rund, geriffelter Rand | – |
| Sehr selten | 7 | 15 % | rund, geriffelter Rand | Glanzblitz |
| Episch | 6 | 9 % | Achteck | Glühen, Edelsteine |
| Legendär | 5 | 5 % | Wellenrand | Glühen, Funkenflug |
| Mystisch | 4 | 3 % | Reuleaux-Siebeneck | leuchtende Prägung, Runenringe |
| Engelsgleich | 4 | 1,5 % | Blüte | Flügel, Heiligenschein, Funkeln |
| Göttlich | 3 | 0,9 % | Sonne | Strahlenkranz, Funkeln |
| Galaktisch | 2 | 0,5 % | Zahnrad | Nebel-Prägung, Planetenbahn |
| Unerreichbar | 2 | 0,1 % | Stern | Regenbogen, Ringe, Strahlen |

## Starten

ES-Module brauchen einen lokalen Server:

```bash
python3 -m http.server 8000
```

Dann <http://localhost:8000> öffnen.

## Aufbau

- `js/coins.js` – Stufen und alle 50 Münzen (Name, Motiv, Metallfarben, Text)
- `js/coinFactory.js` – baut aus einem Datensatz die 3D-Münze (Kontur, Prägung, Effekte)
- `js/main.js` – Galerie, Filter, Detailansicht, „Münze ziehen“
- `css/style.css` – Gestaltung

Neue Münze: einen Eintrag in `COINS` ergänzen. Form und Effekte kommen automatisch aus der Stufe.
