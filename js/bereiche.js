// Alle Bereiche, die auf der Startseite als Kachel erscheinen (Reihenfolge wie auf der Seite).
// Neuer Bereich: Ordner anlegen (z. B. `karte/index.html`) und hier einen Eintrag ergänzen.
//
// gruppe: kleine Überschrift auf der Kachel · kurz: ein Satz für die Kachel · alias: weitere Suchwörter
// status: 'vorschau' = anklickbar, 'code' = anklickbar, aber nur mit Code nutzbar, 'admin' = anklickbar, bearbeiten nur
// für Admins (Checkliste), 'geplant' = Platzhalter ohne Link

export const BEREICHE = [
  { gruppe: 'Spiel', titel: 'Spiel-Oberfläche', href: 'spiel/', status: 'vorschau', alias: 'spiel hud skilltree inventar shop teleport',
    kurz: 'HUD, Teleport, Skilltree, Inventar und Shop mit simulierten Funden.', eckdaten: ['21 Skills', '5 Fenster'] },
  { gruppe: 'Münzen', titel: 'Münzindex', href: 'muenzindex/', status: 'vorschau', alias: 'sammelbuch ziehen',
    kurz: 'Das Sammelbuch: Münzen ziehen, Index füllen, Enthüllung je nach Seltenheit.', eckdaten: ['60 Fächer', '10 Animationsstufen'] },
  { gruppe: 'Münzen', titel: 'Münzkabinett', href: 'muenzen/', status: 'vorschau', alias: 'muenzen drop',
    kurz: 'Alle 60 Münzen in elf Stufen, mit Drop-Tabelle, Filter und Suche.', eckdaten: ['60 Münzen', '11 Stufen'] },
  { gruppe: 'Welt', titel: 'Welten', href: 'welten/', status: 'vorschau', alias: 'planeten galaxie spawn supernova',
    kurz: 'Spawn und zwei Galaxien mit sieben Planeten als drehbare 3D-Inseln.', eckdaten: ['2 Galaxien', '29 Welten'] },
  { gruppe: 'Welt', titel: 'Wetter', href: 'wetter/', status: 'vorschau', alias: 'mutationen',
    kurz: 'Elf Wetter mit Mutationen, in 3D auf jeder Welt.', eckdaten: ['11 Wetter', '11 Mutationen'] },
  { gruppe: 'Welt', titel: 'Edelsteine', href: 'edelsteine/', status: 'vorschau', alias: 'juwelnebel diamantstaub taschen',
    kurz: '20 Steine aus dem Juwelnebel, dazu 50 Edelstein-Taschen.', eckdaten: ['20 Steine', '50 Taschen'] },
  { gruppe: 'Garten', titel: 'Münzrollen', href: 'rollen/', status: 'vorschau', alias: 'rollen schaetze',
    kurz: 'Papierrollen aufreißen und Schätze für den Münzbaumgarten gewinnen.', eckdaten: ['5 Rollen', '37 Schätze'] },
  { gruppe: 'Garten', titel: 'Münzbaumgarten', href: 'garten/', status: 'vorschau', alias: 'garten baeume fruechte futter',
    kurz: 'Münzbäume pflanzen und ernten. Die Früchte sind Futter für die Haustiere.', eckdaten: ['17 Münzbäume', 'bis 12 Beete'] },
  { gruppe: 'Haustiere', titel: 'Eierhalle', href: 'eier/', status: 'vorschau', alias: 'eier schluepfen',
    kurz: 'Elf Eier vom Normal bis zum Cartoon Egg, jedes mit eigener Schlüpf-Animation.', eckdaten: ['11 Eier', '3D'] },
  { gruppe: 'Haustiere', titel: 'Haustiere', href: 'haustiere/', status: 'vorschau', alias: 'pets',
    kurz: '99 Pets aus elf Eiern, mit Seltenheit und Drop-Chance.', eckdaten: ['99 Pets', '9 Seltenheiten'] },
  { gruppe: 'Ausrüstung', titel: 'Taschen', href: 'taschen/', status: 'vorschau', alias: 'rucksack kapazitaet',
    kurz: '99 Rücken-Items vom Kupferbeutel bis zum Unendlichen Münzthron.', eckdaten: ['99 Taschen', '9 Stufen'] },
  { gruppe: 'Ausrüstung', titel: 'Auras', href: 'auren/', status: 'vorschau', alias: 'auren bonus',
    kurz: '50 Auras um den Spieler, jede mit kleinem Bonus.', eckdaten: ['50 Auras', '6 Seltenheiten'] },
  { gruppe: 'Export', titel: 'Roblox Studio', href: 'roblox/', status: 'code', alias: 'export luau installer',
    kurz: 'Alles als Paket für Roblox Studio: Daten, Logik, Modelle und Motive.', eckdaten: ['Installer-Skript', 'ModuleScripts'] },
  { gruppe: 'Admins', titel: 'Checkliste', href: 'checkliste/', status: 'admin', alias: 'aufgaben todo ueberarbeiten zustaendig axseleins',
    kurz: 'Was überarbeitet ist, was noch fehlt und wer was macht. Anmelden mit dem eigenen Code.', eckdaten: ['70 Punkte', 'Zuständigkeit'] },
];
