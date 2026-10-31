// Alle 49 Haustiere, sieben pro Ei. Pro Ei sind die letzten zwei episch.
// chance = Schlupfchance innerhalb des Eis in Prozent (Vorschlag, Summe je Ei = 100).

export const EGGS = [
  { id: 'normal', name: 'Normal Egg', rankName: 'Normal', glow: '#ffd89a', price: '250 Münzen' },
  { id: 'wald', name: 'Wald Egg', rankName: 'Selten', glow: '#b6ff6a', price: '2.500 Münzen' },
  { id: 'eis', name: 'Eis Egg', rankName: 'Episch', glow: '#9ff0ff', price: '15.000 Münzen' },
  { id: 'engel', name: 'Engels Egg', rankName: 'Engelsgleich', glow: '#fff4cf', price: '75.000 Münzen' },
  { id: 'galaxie', name: 'Galaxie Egg', rankName: 'Galaktisch', glow: '#b49cff', price: '400.000 Münzen' },
  { id: 'admin', name: 'Admin Egg', rankName: 'Admin', glow: '#ff4058', price: 'Nicht kaufbar' },
  { id: 'release', name: 'Release Egg', rankName: 'Limitiert', glow: '#ffe07a', price: 'R$ 199' },
];

const CHANCES = [25, 22, 20, 15, 10.5, 5, 2.5];

const LIST = {
  normal: [
    ['hund', 'Hund', 'Bester Freund seit dem ersten Münzwurf. Wedelt bei jedem Taler.'],
    ['katze', 'Katze', 'Getigert, neugierig und überzeugt, dass ihr die Schatzkammer gehört.'],
    ['kueken', 'Küken', 'Gerade erst geschlüpft. Die Schale sitzt noch wie eine Hose.'],
    ['pferd', 'Pferd', 'Kräftig, treu und mit wehender Mähne immer als Erstes am Ziel.'],
    ['kuh', 'Kuh', 'Gemütlich, gefleckt und mit einer Glocke, die man über die ganze Weide hört.'],
    ['frettchen', 'Frettchen', 'Der Frettchenkönig. Trägt Krone und Hermelinmantel und duldet keinen Widerspruch.'],
    ['otter', 'Otter', 'Herrscher der Gezeiten. Mit Dreizack und Perle lenkt er jede Strömung.'],
  ],
  wald: [
    ['fuchs', 'Fuchs', 'Schlau, flink und mit dem buschigsten Schwanz im ganzen Wald.'],
    ['reh', 'Reh', 'Leise auf den Hufen. Die weißen Tupfen verraten es trotzdem.'],
    ['frosch', 'Frosch', 'Sitzt am liebsten auf seinem Seerosenblatt und bläst die Kehle auf.'],
    ['dachs', 'Dachs', 'Gräbt Gänge unter dem ganzen Wald. Erkennbar an der gestreiften Maske.'],
    ['schlange', 'Schlange', 'Liegt zusammengerollt im Moos und züngelt nach Neuigkeiten.'],
    ['baer', 'Bär', 'Der Waldkönig. Moos wächst auf seinem Rücken, ein Geweih aus Ästen krönt ihn.'],
    ['wolf', 'Wolf', 'Wächter des Waldes. Wenn er heult, leuchten die Ranken auf seinem Fell.'],
  ],
  eis: [
    ['schneemann', 'Schneemann', 'Karottennase, Zylinder und ein Schal, der nie ganz trocken wird.'],
    ['polarhase', 'Polarhase', 'Schneeweiß bis auf die Ohrspitzen. Im Schnee praktisch unsichtbar.'],
    ['eisbaer', 'Eisbär', 'Dickes Fell, große Tatzen und die Ruhe des ewigen Eises.'],
    ['robbe', 'Robbe', 'Rollt lieber, als zu laufen, und hat immer Hunger auf Fisch.'],
    ['pinguin', 'Pinguin', 'Watschelt im Frack und mit gelbem Kragen durch jede Kälte.'],
    ['schneegolem', 'Schneegolem', 'Aus Gletschereis und Lawinen geformt. In seiner Brust schlägt ein Eiskristall.'],
    ['polarfuchs', 'Polarfuchs', 'Drei Schweife aus Frost, eine Krone aus Kristall und Polarlicht im Gefolge.'],
  ],
  engel: [
    ['engelshund', 'Engelshund', 'Ein Hund mit Heiligenschein. Bewacht dich auch von oben.'],
    ['engelskatze', 'Engelskatze', 'Landet immer auf den Pfoten – oder schwebt einfach weiter.'],
    ['adler', 'Adler', 'Kreist über den Wolken. Die Federspitzen sind in Gold getaucht.'],
    ['engelsfuchs', 'Engelsfuchs', 'Sanfter als jeder Waldfuchs. Die Schwanzspitze glüht wie Morgenlicht.'],
    ['engel', 'Engel', 'Kleiner Bote mit goldenen Locken, der leise Melodien summt.'],
    ['gott', 'Gott', 'Thront auf einer Wolke, mit Zepter und Sonnenscheibe. Sein Wort ist Gesetz.'],
    ['loewe', 'Löwe', 'Geflügelter Löwe in goldener Rüstung. Sein Brüllen lässt die Wolken zittern.'],
  ],
  galaxie: [
    ['galaxiewolf', 'Galaktischer Wolf', 'Sein Fell ist ein Stück Nachthimmel, in dem langsam die Sterne ziehen.'],
    ['singularity', 'Singularity Beetle', 'Trägt ein winziges Schwarzes Loch auf dem Rücken. Bitte nicht füttern.'],
    ['sternbild', 'Sternbild-Kätzchen', 'Aus Sternen und Linien gezeichnet. Nachts sieht man es am Himmel.'],
    ['hamster', 'Gravitations-Hamster', 'Hat so viel Masse in den Backen, dass Kerne und Monde um ihn kreisen.'],
    ['komet', 'Kometen-Echse', 'Schneller als das Licht ihres eigenen Schweifs.'],
    ['ringgleiter', 'Ring-Gleiter', 'Gleitet zwischen den Planeten und trägt einen eigenen Ring wie ein Gasriese.'],
    ['nebelwelpe', 'Nebel-Welpe', 'In einem Sternennebel geboren. Wo er schnüffelt, entstehen neue Sterne.'],
  ],
  admin: [
    ['glitchhund', 'Glitch-Hund', 'Bellt in Fehlercodes und flackert, wenn man ihn zu lange ansieht.'],
    ['banhammer', 'Ban-Hammer-Krokodil', 'Trägt den Ban-Hammer im Maul. Ein Biss, und du bist raus.'],
    ['lagschwein', 'Lag-Schwein', 'Läuft mit vier Bildern pro Sekunde. Das Ladesymbol dreht sich ewig.'],
    ['uivogel', 'UI-Vogel', 'Aus Fenstern, Reglern und Häkchen zusammengeklickt.'],
    ['dateikatze', 'Schwebendes Datei-Kätzchen', 'Eine Katze im Dateiformat. Schwebt durch Ordner und schnurrt in Bytes.'],
    ['codedrache', 'Fliegender Quellcode-Drache', 'Aus reinem Quellcode kompiliert. Jeder Flügelschlag schreibt neue Zeilen.'],
    ['serverchamaeleon', 'Server-Raum-Chamäleon', 'Lebt im Serverraum und nimmt die Farbe jeder Status-LED an.'],
  ],
  release: [
    ['dackel', 'Partyhut-Dackel', 'Hat sich zum Release extra den Partyhut aufgesetzt.'],
    ['konfetti', 'Konfetti-Chamäleon', 'Wechselt die Farbe mit jedem Konfettiregen.'],
    ['ballonschwein', 'Luftballon-Schweinchen', 'Aus einem einzigen Luftballon geknotet. Bloß nicht drücken.'],
    ['wunderkerze', 'Wunderkerzen-Fuchs', 'Trägt eine Wunderkerze im Maul und sprüht vor Vorfreude.'],
    ['qualle', 'Champagner-Qualle', 'Schwebt wie ein Sektglas, aus dem die Bläschen nie ausgehen.'],
    ['roboter', 'Launch-Day-Roboter', 'Gebaut für den Launch-Day. Der Countdown läuft, die Triebwerke glühen.'],
    ['phoenix', 'Feuerwerk-Phönix', 'Steigt aus jedem Feuerwerk neu empor und malt Funken in den Himmel.'],
  ],
};

export const PETS = EGGS.flatMap((egg) =>
  LIST[egg.id].map(([id, name, text], i) => ({ id, name, text, egg: egg.id, eggName: egg.name, glow: egg.glow, epic: i >= 5, chance: CHANCES[i] })),
);
export const petById = Object.fromEntries(PETS.map((p) => [p.id, p]));
export const fmtChance = (c) => `${c.toLocaleString('de-DE')} %`;

// Würfelt beim Schlüpfen ein Haustier aus dem Ei, gewichtet nach Schlupfchance
export function rollPet(eggId, random = Math.random) {
  const pool = PETS.filter((p) => p.egg === eggId);
  let r = random() * pool.reduce((sum, p) => sum + p.chance, 0);
  return pool.find((p) => (r -= p.chance) <= 0) || pool[0];
}
