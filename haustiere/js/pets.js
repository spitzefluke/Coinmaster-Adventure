// Alle Haustiere: 11 Eier mit je 9 Pets, eins pro Seltenheit. Nur Daten, keine 3D-Modelle.
// Die Drop-Chancen gelten für alle Eier gleich und ergeben zusammen 100 %.

export const PET_RARITIES = [
  { id: 'common', name: 'Common', chance: 40, color: '#b8b3a7' },
  { id: 'uncommon', name: 'Uncommon', chance: 25, color: '#6fd36a' },
  { id: 'rare', name: 'Rare', chance: 15, color: '#4aa8ff' },
  { id: 'epic', name: 'Epic', chance: 10, color: '#b77bff' },
  { id: 'legendary', name: 'Legendary', chance: 5, color: '#ffb02e' },
  { id: 'mythic', name: 'Mythic', chance: 3, color: '#ff4f7b' },
  { id: 'divine', name: 'Divine', chance: 1.5, color: '#fff1a8' },
  { id: 'celestial', name: 'Celestial', chance: 0.49, color: '#5ff3ff' },
  { id: 'secret', name: 'Secret', chance: 0.01, color: '#ff5af0' },
];
export const rarityById = Object.fromEntries(PET_RARITIES.map((r, i) => [r.id, { ...r, index: i }]));

// built: das Ei gibt es schon in der Eierhalle (eier/js/eggs.js). Reihenfolge wie im Design „Tier-Eier“.
export const EGGS = [
  { id: 'normal', name: 'Normal Egg', glow: '#ffd89a', built: true },
  { id: 'wald', name: 'Wald Egg', glow: '#b6ff6a', built: true },
  { id: 'eis', name: 'Eis Egg', glow: '#9ff0ff', built: true },
  { id: 'engel', name: 'Engel Egg', glow: '#fff4cf', built: true },
  { id: 'galaxie', name: 'Galaxie Egg', glow: '#b49cff', built: true },
  { id: 'candy', name: 'Candy Egg', glow: '#ff9ad5', built: true },
  { id: 'admin', name: 'Admin Egg', glow: '#ff4058', built: true },
  { id: 'release', name: 'Release Egg', glow: '#ffe07a', built: true },
  { id: 'atlantis', name: 'Atlantis Egg', glow: '#3fd6c8', built: true },
  { id: 'lava', name: 'Lava Egg', glow: '#ff6a2a', built: true },
  { id: 'cartoon', name: 'Cartoon Egg', glow: '#ffffff', built: true },
];

// Pro Ei neun Pets in der Reihenfolge der Seltenheiten: [Name, kurze Beschreibung]
const LIST = {
  normal: [
    ['Hund', 'Treuer Begleiter, wedelt bei jeder Münze.'],
    ['Hase', 'Hoppelt flink zum nächsten Fund.'],
    ['Fuchs', 'Schlau und immer auf der Spur des Goldes.'],
    ['Panda', 'Gemütlich, aber mit großem Appetit auf Moneten.'],
    ['Einhorn', 'Ein Horn, das Glück in alle Richtungen strahlt.'],
    ['Goldener Drache', 'Schuppen aus purem Gold, Atem aus Funken.'],
    ['Regenbogen-Phönix', 'Steigt in allen Farben aus der Asche auf.'],
    ['Ewiger Weltendrache', 'So alt wie die Welt und genauso groß.'],
    ['Der Urhund', 'Der allererste Hund. Niemand weiß, woher er kam.'],
  ],
  wald: [
    ['Igel', 'Rollt sich bei Gefahr zur stacheligen Kugel.'],
    ['Reh', 'Leise auf den Hufen, mit weißen Tupfen.'],
    ['Wolf', 'Heult nachts den Mond über dem Wald an.'],
    ['Eule', 'Sieht im Dunkeln jede versteckte Münze.'],
    ['Bär', 'Stark wie ein Baumstamm, sanft wie Moos.'],
    ['Waldgeist', 'Schwebt als grünes Licht zwischen den Bäumen.'],
    ['Uralter Baumwächter', 'Ein wandelnder Baum, der den Wald beschützt.'],
    ['Naturgott Sylvanus', 'Wo er geht, blüht alles auf.'],
    ['Das Herz des Waldes', 'Schlägt tief unter den Wurzeln aller Bäume.'],
  ],
  eis: [
    ['Pinguin', 'Watschelt im Frack über das Eis.'],
    ['Robbe', 'Rollt lieber, als zu laufen.'],
    ['Eisbär', 'Dickes Fell, große Tatzen, eisige Ruhe.'],
    ['Frostwolf', 'Sein Atem lässt alles gefrieren.'],
    ['Eisdrache', 'Flügel aus Eis, Brüllen wie ein Schneesturm.'],
    ['Kristall-Yeti', 'Fell aus funkelnden Eiskristallen.'],
    ['Blizzard-Titan', 'Trägt den ganzen Winter auf den Schultern.'],
    ['Polarlicht-Phönix', 'Malt Polarlichter in den Nachthimmel.'],
    ['Der Ewige Winter', 'Wo er erscheint, taut es nie wieder.'],
  ],
  engel: [
    ['Engelchen', 'Kleiner Bote mit Flügeln und goldenen Locken.'],
    ['Himmelstaube', 'Bringt Frieden und ab und zu eine Münze.'],
    ['Lichtkatze', 'Schnurrt so warm wie ein Sonnenstrahl.'],
    ['Seraph', 'Sechs Flügel aus reinem Licht.'],
    ['Erzengel', 'Anführer der Himmelsscharen, mit Flammenschwert.'],
    ['Göttlicher Phönix', 'Brennt in heiligem, goldenem Feuer.'],
    ['Thron-Wächter', 'Bewacht den Thron hinter den Wolken.'],
    ['Himmelsrichter', 'Wiegt jede Tat auf goldener Waage.'],
    ['Der Erste Engel', 'War da, bevor es Licht gab.'],
  ],
  galaxie: [
    ['Mond-Hase', 'Springt von Krater zu Krater.'],
    ['Alien-Blob', 'Wabbelt, glibbert und ist sehr freundlich.'],
    ['Astro-Hund', 'Trägt Raumhelm und bellt in die Leere.'],
    ['Nebel-Fuchs', 'Sein Schweif ist ein Sternennebel.'],
    ['Schwarzes-Loch-Drache', 'Verschluckt alles, sogar das Licht.'],
    ['Kosmischer Wal', 'Schwimmt gemächlich zwischen den Planeten.'],
    ['Supernova-Titan', 'Explodiert vor Kraft und strahlt wie tausend Sonnen.'],
    ['Sternenschmied', 'Hämmert neue Sterne aus Sternenstaub.'],
    ['Urknall-Entität', 'Der Anfang von allem, in einem Pet.'],
  ],
  candy: [
    ['Gummibär', 'Weich, bunt und ein bisschen klebrig.'],
    ['Keks-Hund', 'Riecht nach frisch gebackenen Keksen.'],
    ['Donut-Hamster', 'Mit Streuseln obendrauf.'],
    ['Cupcake-Einhorn', 'Sahnehäubchen als Mähne.'],
    ['Karamell-Drache', 'Spuckt warmes, goldenes Karamell.'],
    ['Eiscreme-Phönix', 'Schmilzt nie, egal wie heiß es ist.'],
    ['Zuckerkönig', 'Herrscht über das ganze Süßigkeitenreich.'],
    ['Regenbogen-Zuckerengel', 'Streut Zuckerstreusel vom Himmel.'],
    ['Der Goldene Lollipop', 'Der süßeste Schatz von allen.'],
  ],
  admin: [
    ['Mod-Katze', 'Hält Ordnung im Chat.'],
    ['Debug-Käfer', 'Findet jeden Fehler im Code.'],
    ['Script-Fuchs', 'Schreibt Skripte schneller als sein Schatten.'],
    ['Glitch-Wolf', 'Flackert zwischen zwei Orten hin und her.'],
    ['Admin-Dominus', 'Trägt die Maske der Admins.'],
    ['Owner-Krone', 'Nur der Besitzer darf sie tragen.'],
    ['Server-Zerstörer', 'Ein Biss, und der Server stürzt ab.'],
    ['Der Code-Gott', 'Hat das ganze Spiel geschrieben.'],
    ['Error 404: Pet nicht gefunden', 'Ist da. Oder auch nicht.'],
  ],
  atlantis: [
    ['Seepferdchen', 'Tänzelt durch die Strömung.'],
    ['Qualle', 'Leuchtet sanft in der Tiefe.'],
    ['Delfin', 'Verspielt und schneller als jedes Boot.'],
    ['Meerjungfrau-Katze', 'Halb Katze, halb Fisch, ganz neugierig.'],
    ['Poseidon-Hai', 'Trägt einen kleinen Dreizack.'],
    ['Atlantis-Kraken', 'Acht Arme für acht Schätze.'],
    ['Leviathan', 'Das größte Wesen der Meere.'],
    ['Tiefsee-Gott Nereus', 'Herrscher über alle Wellen.'],
    ['Das Herz von Atlantis', 'Pulsiert im Zentrum der versunkenen Stadt.'],
  ],
  release: [
    ['Partyhut-Hund', 'Feiert den Release mit spitzem Hut.'],
    ['Geschenkbox-Pet', 'Was drin ist, weiß niemand.'],
    ['Feuerwerk-Hase', 'Hüpft mit bunten Raketen.'],
    ['Neon-Drache', 'Leuchtet wie eine Partyröhre.'],
    ['Goldenes Ticket', 'Eintritt zu allem, für immer.'],
    ['Founder-Phönix', 'Für alle, die vom ersten Tag an dabei sind.'],
    ['Release-Titan', 'So groß wie der Hype zum Start.'],
    ['Der Erste Tag', 'Erinnert sich an jeden Spieler vom Start.'],
    ['Das Allererste Pet', 'Das Pet, mit dem alles begann.'],
  ],
  lava: [
    ['Feuerkäfer', 'Glüht wie ein kleines Stück Kohle.'],
    ['Glut-Hund', 'Sein Fell knistert bei jeder Bewegung.'],
    ['Lava-Fuchs', 'Hinterlässt brennende Pfotenabdrücke.'],
    ['Inferno-Wolf', 'Heult so laut, dass Vulkane ausbrechen.'],
    ['Magma-Drache', 'Badet am liebsten in flüssigem Gestein.'],
    ['Vulkan-Phönix', 'Steigt aus jedem Ausbruch neu empor.'],
    ['Ifrit der Verbrenner', 'Ein Geist aus reinem Feuer.'],
    ['Weltenbrand-Titan', 'Lässt den Himmel rot glühen.'],
    ['Der Erdkern', 'Das heiße Herz der ganzen Welt.'],
  ],
  cartoon: [
    ['Kritzel-Hund', 'Mit Bleistift schnell hingekritzelt.'],
    ['Pixel-Hase', 'Aus groben Pixeln, hüpft in 8 Bit.'],
    ['Toon-Fuchs', 'Zieht bei jedem Schreck lustige Grimassen.'],
    ['Skizzen-Einhorn', 'Noch nicht ganz fertig gezeichnet.'],
    ['Neon-Toon-Drache', 'Grell, bunt und mit dicken Umrissen.'],
    ['Cartoon-Dimensionswächter', 'Bewacht den Übergang zwischen den Zeichnungen.'],
    ['Radiergummi-Gott', 'Kann alles wegradieren.'],
    ['Der Zeichner', 'Hat alle anderen Pets gezeichnet.'],
    ['Das Leere Blatt', 'Hier kann noch alles entstehen.'],
  ],
};

const slug = (s) =>
  s.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const PETS = EGGS.flatMap((egg) =>
  LIST[egg.id].map(([name, text], i) => {
    const r = PET_RARITIES[i];
    return {
      id: `${egg.id}-${slug(name)}`, name, text, egg: egg.id, eggName: egg.name,
      rarity: r.id, rarityName: r.name, chance: r.chance, glow: r.color, epic: i >= 4,
    };
  }),
);
export const petById = Object.fromEntries(PETS.map((p) => [p.id, p]));
export const fmtChance = (c) => `${c.toLocaleString('de-DE')} %${c < 0.1 ? ` (1 zu ${Math.round(100 / c).toLocaleString('de-DE')})` : ''}`;

// Würfelt beim Schlüpfen ein Pet aus dem Ei, gewichtet nach Drop-Chance
export function rollPet(eggId, random = Math.random) {
  const pool = PETS.filter((p) => p.egg === eggId);
  let r = random() * pool.reduce((sum, p) => sum + p.chance, 0);
  return pool.find((p) => (r -= p.chance) <= 0) || pool[0];
}

// ── Füttern und Level ────────────────────────────────────────────────────────
// Früchte aus dem Münzbaumgarten sind Futter: Jede Frucht gibt dem Haustier ein paar EP, je seltener der Baum,
// desto mehr. Verkaufen kann man Früchte nicht. Ein Haustier steigt so langsam bis Level PET_MAX_LEVEL.
export const PET_MAX_LEVEL = 50;
export const FRUIT_XP = { gewoehnlich: 1, selten: 2, episch: 3, legendaer: 5, mythisch: 8, goettlich: 12, kosmisch: 18, himmlisch: 25, geheim: 40 };
// EP von Level n auf n + 1
export const petXpFor = (n) => Math.round(10 * Math.pow(n, 1.5));
// EP gutschreiben, gibt die Zahl der neuen Level zurück (pet = { lvl, xp })
export function feedPetXp(pet, xp) {
  let ups = 0;
  pet.xp += xp;
  while (pet.lvl < PET_MAX_LEVEL && pet.xp >= petXpFor(pet.lvl)) {
    pet.xp -= petXpFor(pet.lvl);
    pet.lvl++;
    ups++;
  }
  if (pet.lvl >= PET_MAX_LEVEL) pet.xp = 0;
  return ups;
}
