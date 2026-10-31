// Alle Bereiche, die auf der Startseite als Kachel erscheinen.
// Neuer Bereich: Ordner anlegen (z. B. `karte/index.html`) und hier einen Eintrag ergänzen.
//
// status: 'vorschau' = anklickbar, 'code' = anklickbar, aber nur mit Code nutzbar, 'geplant' = Platzhalter ohne Link

export const BEREICHE = [
  {
    titel: 'Münzkabinett',
    text: '50 3D-Münzen in 10 Seltenheitsstufen, vom Pilzpfennig bis zur Allmächtigen Kartoffel. Mit Drop-Tabelle, Detailansicht und Münzziehung.',
    href: 'muenzen/',
    status: 'vorschau',
    eckdaten: ['50 Münzen', '10 Stufen', '3D'],
  },
  {
    titel: 'Münzindex',
    text: 'Das Sammelbuch aus dem Spiel: Münzen ziehen, Index füllen und jede neue Münze mit einer Animation enthüllen, die mit der Seltenheit wächst.',
    href: 'muenzindex/',
    status: 'vorschau',
    eckdaten: ['50 Fächer', '10 Animationsstufen', 'Spielvorschau'],
  },
  {
    titel: 'Eierhalle',
    text: 'Sieben Eier für die Haustiere, vom Normal Egg bis zum Release Egg. Jedes mit eigenem Look und einer Schlüpf-Animation, die mit der Seltenheit wächst.',
    href: 'eier/',
    status: 'vorschau',
    eckdaten: ['7 Eier', '3D', 'Schlüpf-Animation'],
  },
  {
    titel: 'Haustiere',
    text: '49 Haustiere, sieben pro Ei: fünf häufige und zwei epische mit eigenen Effekten. Sie schlüpfen jetzt auch in der Eierhalle.',
    href: 'haustiere/',
    status: 'vorschau',
    eckdaten: ['49 Tiere', '14 episch', 'Export für Blender'],
  },
  {
    titel: 'Welten',
    text: 'Vier Planeten mit sechzehn Welten, vom grünen Startgebiet über Mond und Sonne bis nach Atlantis. Jede Welt als drehbare 3D-Insel, dazu Portale und Wiedergeburten.',
    href: 'welten/',
    status: 'vorschau',
    eckdaten: ['4 Planeten', '16 Welten', '3D'],
  },
  {
    titel: 'Spiel-Oberfläche',
    text: 'HUD über der aktuellen 3D-Welt, Teleport-Menü, Skilltree mit vier Ästen, Inventar, Shop und Einstellungen. Mit simulierten Funden zum Ausprobieren.',
    href: 'spiel/',
    status: 'vorschau',
    eckdaten: ['21 Skills', 'HUD', '5 Fenster'],
  },
  {
    titel: 'Nach Roblox Studio übertragen',
    text: 'Münzen, Mutationen, Wetter, Eier und Welten als fertiges Paket für Roblox Studio: Daten, Ziehen-Logik, 3D-Modelle und Motive.',
    href: 'roblox/',
    status: 'code',
    eckdaten: ['Installer-Skript', 'ModuleScripts', 'Motive als PNG'],
  },

];
