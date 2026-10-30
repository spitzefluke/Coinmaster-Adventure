// Alle Bereiche, die auf der Startseite als Kachel erscheinen.
// Neuer Bereich: Ordner anlegen (z. B. `karte/index.html`) und hier einen Eintrag ergänzen.
//
// status: 'vorschau' = anklickbar, 'geplant' = Platzhalter ohne Link

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
    text: 'Die Wesen, die aus den Eiern schlüpfen.',
    status: 'geplant',
    eckdaten: [],
  },
];
