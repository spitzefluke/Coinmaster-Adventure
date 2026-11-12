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
    eckdaten: ['11 Eier', '3D', 'Schlüpf-Animation'],
  },
  {
    titel: 'Münzrollen',
    text: 'Papierrollen zum Aufreißen, von der Kupferrolle bis zur Sternenrolle. Ein Band mit Münzbäumen, Gießkannen und Dünger rollt durch und bleibt auf einem Schatz für den Münzbaumgarten stehen.',
    href: 'rollen/',
    status: 'vorschau',
    eckdaten: ['5 Rollen', '37 Schätze', '9 Seltenheiten'],
  },
  {
    titel: 'Münzbaumgarten',
    text: 'Ein kleiner Garten, den man mit Talern kauft. Münzbäume aus den Rollen wachsen in fünf Phasen, manche golden. Ihre Früchte verkaufst du am Marktstand mit schwankenden Preisen oder ziehst daraus neue Samen.',
    href: 'garten/',
    status: 'vorschau',
    eckdaten: ['17 Münzbäume', '9 Zäune', 'bis 12 Beete'],
  },
  {
    titel: 'Haustiere',
    text: '99 Pets aus 11 Eiern, neun pro Ei vom Common Hund bis zum Secret Urhund. Jedes mit Seltenheit, Drop-Chance und kurzer Beschreibung.',
    href: 'haustiere/',
    status: 'vorschau',
    eckdaten: ['99 Pets', '11 Eier', '9 Seltenheiten'],
  },
  {
    titel: 'Taschen',
    text: '99 Rücken-Items in 9 Stufen, vom zerschlissenen Kupferbeutel bis zum Unendlichen Münzthron. Jede Tasche mit Beschreibung, Preis und Kapazität für deine Münzen.',
    href: 'taschen/',
    status: 'vorschau',
    eckdaten: ['99 Taschen', '9 Stufen', 'bis unbegrenzt'],
  },
  {
    titel: 'Edelsteine',
    text: '20 Edelsteine aus dem Juwelnebel, der Galaxie hinter der Supernova, vom Quarz bis zum Herz der Galaxie. Dort findest du sie statt Münzen, jeder zehnmal so viel wert.',
    href: 'edelsteine/',
    status: 'vorschau',
    eckdaten: ['20 Steine', '10 Stufen', 'Juwelnebel'],
  },
  {
    titel: 'Auras',
    text: '50 Auras, die um den Spieler leuchten: Elemente, Münzen und Schätze, Weltraum und Magie, dazu Lustiges und Glitches. Jede Aura kostet Taler und gibt einen kleinen Bonus.',
    href: 'auren/',
    status: 'vorschau',
    eckdaten: ['50 Auras', '6 Seltenheiten', 'Bonus'],
  },
  {
    titel: 'Welten',
    text: 'Ein Spawn mit Shops, Portalen und Ranglisten, dazu zwei Galaxien: die Milchstraße mit vier Planeten vom grünen Startgebiet bis zum Götterthron und, nach der Supernova, der Juwelnebel mit drei Planeten voller Edelsteine. Jede Welt als drehbare 3D-Insel, dazu Portale, Wiedergeburten und Supernova.',
    href: 'welten/',
    status: 'vorschau',
    eckdaten: ['2 Galaxien', '7 Planeten', '29 Welten'],
  },
  {
    titel: 'Wetter',
    text: 'Zehn Wetter mit Mutationen, von Regen bis Sternschnuppen. Jedes Wetter in 3D auf jeder Welt, dazu die Münze mit ihrer Mutation und eine Vorhersage.',
    href: 'wetter/',
    status: 'vorschau',
    eckdaten: ['10 Wetter', '10 Mutationen', 'Vorhersage'],
  },
  {
    titel: 'Spiel-Oberfläche',
    text: 'HUD über der aktuellen 3D-Welt, Teleport-Menü, Skilltree mit vier Ästen, Inventar, Shop, Münzbaumgarten und Einstellungen. Mit simulierten Funden zum Ausprobieren.',
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
