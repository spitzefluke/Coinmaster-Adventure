// Planeten und Welten.
//
// Innerhalb eines Planeten kauft man die Welten der Reihe nach mit Moneten. Zum nächsten Planeten
// führt ein Portal (Rakete, Tiefsee-Portal …): Es öffnet sich, wenn man die letzte Welt des
// vorigen Planeten besitzt und genug Wiedergeburten hat.
//
// In jeder Welt findet man alle Münzen. Spätere Welten machen seltene Stufen wahrscheinlicher
// (`luck`, wirkt wie der Skill „Glückspilz“) und die Münzen mehr wert (`value`).
// Alle Zahlen sind Vorschläge und hier anpassbar.
//
// Galaxien: Die Planeten 1 bis 4 liegen in der Milchstraße. Wer 100 Wiedergeburten hat, kann einmal zur
// Supernova werden (unten SUPERNOVA) und öffnet damit den Juwelnebel mit den Planeten 5 bis 7. Dort findet
// man Edelsteine statt Münzen (edelsteine/js/gems.js). Edelsteine bringen Diamantstaub statt Moneten;
// die Welten des Juwelnebels kauft man mit Diamantstaub (currency der Galaxie).

export const GALAXIES = [
  { id: 'g1', name: 'Milchstraße', title: 'Heimatgalaxie', color: '#ffd76a', find: 'coins', currency: 'moneten', supernovas: 0,
    text: 'Vier Planeten voller Münzen: vom Heimatplaneten bis zum Thron der Götter.' },
  { id: 'g2', name: 'Juwelnebel', title: 'Galaxie der Edelsteine', color: '#ff5fd2', find: 'gems', currency: 'staub', supernovas: 1,
    text: 'Hinter der Supernova: Planeten aus Kristall, Smaragd und Diamant. Hier findest du Edelsteine statt Münzen.' },
];

export const PLANETS = [
  {
    id: 'p1', name: 'Planet 1', title: 'Heimatplanet', color: '#5fd38d', glow: '#9be8b5',
    surface: ['#2f7a4a', '#5fd38d', '#3a8fd1'],
    text: 'Wo jedes Abenteuer beginnt: Wiesen, Wälder, eine Stadt und dahinter Eis, Lava und eine Welt aus Zucker.',
    portal: null,
  },
  {
    id: 'p2', name: 'Planet 2', title: 'Weltraum', color: '#9b7bff', glow: '#c6b3ff',
    surface: ['#1b1440', '#6a4fd6', '#ff9b3d'],
    text: 'Mit der Rakete ins All: vom grauen Mond über Neptun und Mars bis auf die Sonne.',
    portal: { name: 'Rakete', rebirths: 1, text: 'Eine Rakete bringt dich ins All.' },
  },
  {
    id: 'p3', name: 'Planet 3', title: 'Tiefsee', color: '#3ad1d1', glow: '#9ff3f0',
    surface: ['#063a5a', '#13a3b8', '#f2c4a0'],
    text: 'Ein Planet unter Wasser: Korallen, Muscheln so groß wie Häuser und das versunkene Atlantis.',
    portal: { name: 'Tiefsee-Portal', rebirths: 3, text: 'Ein Strudel zieht dich in die Tiefe.' },
  },
  {
    id: 'p4', name: 'Planet 4', title: 'Himmelreich', color: '#f3d48c', glow: '#fff3c4',
    surface: ['#8a7ad8', '#fff3c4', '#9fd8ff'],
    text: 'Hoch über allen Wolken: eine Marmorburg, ein Garten aus Licht und der Thron der Götter.',
    portal: { name: 'Himmelsleiter', rebirths: 6, text: 'Eine goldene Leiter führt durch die Wolken nach oben.' },
    neu: true,
  },

  // ── Juwelnebel (Galaxie 2, nach der Supernova) ──
  {
    id: 'p5', galaxy: 'g2', name: 'Planet 5', title: 'Kristallplanet', color: '#c98bff', glow: '#ead2ff',
    surface: ['#3a1f6a', '#c98bff', '#7ad8ff'],
    text: 'Felder aus Quarz, Grotten voller Amethyst und Dünen aus Topas-Sand. Die ersten Edelsteine warten.',
    portal: { name: 'Sternentor', rebirths: 0, supernovas: 1, text: 'Aus dem Licht der Supernova öffnet sich ein Tor in eine neue Galaxie.' },
    neu: true,
  },
  {
    id: 'p6', galaxy: 'g2', name: 'Planet 6', title: 'Smaragdplanet', color: '#3ee08a', glow: '#b4ffd6',
    surface: ['#0c3a2a', '#3ee08a', '#3a7aff'],
    text: 'Ein Dschungel, dessen Blätter wie Smaragde funkeln, ein Tempel aus Jade und ein See aus Saphir.',
    portal: { name: 'Kristallbrücke', rebirths: 2, text: 'Eine Brücke aus Kristall spannt sich zum grünen Planeten.' },
    neu: true,
  },
  {
    id: 'p7', galaxy: 'g2', name: 'Planet 7', title: 'Diamantplanet', color: '#8af0ff', glow: '#e8fdff',
    surface: ['#1a2a4a', '#8af0ff', '#ff3a5a'],
    text: 'Ein Vulkan spuckt Rubine, Opalwolken schillern am Himmel und tief im Kern liegt der größte Diamant.',
    portal: { name: 'Diamantaufzug', rebirths: 5, text: 'Ein Aufzug aus Diamantglas bringt dich zum strahlendsten Planeten.' },
    neu: true,
  },
];
// Planeten ohne galaxy liegen in der Milchstraße
for (const p of PLANETS) p.galaxy ||= 'g1';

// Der Spawn ist der Treffpunkt vor allen Planeten: Shops, Portale zu den Welten, Ranglisten.
// Dort gibt es keine Münzen; er ist immer offen.
export const HUB = {
  id: 'hub', name: 'Spawn', title: 'Treffpunkt', color: '#d9b26a', glow: '#ffe7a8',
  surface: ['#3f8a46', '#7fbf5a', '#d9b26a'],
  text: 'Hier startet jeder: Shops, Portale zu allen Welten, Ranglisten, tägliche Belohnung und mehr.',
  portal: null,
};

// theme: Farben für die 3D-Insel und den Himmel; fx: Partikel; props: was auf der Insel steht
export const WORLDS = [
  // ── Spawn ──
  { id: 'spawn', planet: 'hub', name: 'Spawn', price: 0, luck: 0, value: 1, hub: true,
    text: 'Der Treffpunkt aller Spieler. Von hier führen Portale in jede Welt.',
    sky: ['#7ec8f0', '#fde8c8'], ground: '#7fbf5a', side: '#7a5a3a', rock: '#6b6478', accent: '#ffd76a', fx: 'pollen' },

  // ── Planet 1 ──
  { id: 'normal', planet: 'p1', name: 'Normal', price: 0, luck: 0, value: 1,
    text: 'Grüne Hügel, ein paar Bäume, ein Bach. Hier findest du deine ersten Münzen.',
    sky: ['#6fb6e8', '#d6eefa'], ground: '#5fae4f', side: '#7a5a3a', rock: '#6b6478', accent: '#ffd76a', fx: 'pollen' },
  { id: 'wald', planet: 'p1', name: 'Wald', price: 500, luck: 0.1, value: 1.25,
    text: 'Dichter Tannenwald mit Riesenpilzen. Zwischen den Wurzeln leuchten Glühwürmchen.',
    sky: ['#3f7a5c', '#bfe3c4'], ground: '#3f8a46', side: '#5e4430', rock: '#4f5a4c', accent: '#d9ff7a', fx: 'fireflies' },
  { id: 'stadt', planet: 'p1', name: 'Stadt', price: 2500, luck: 0.2, value: 1.5,
    text: 'Hochhäuser, Laternen und Straßen. Münzen liegen auf Dächern und unter Bänken.',
    sky: ['#f29f6b', '#ffe0b8'], ground: '#8a8f99', side: '#5a5560', rock: '#4a4652', accent: '#ffd76a', fx: 'dust' },
  { id: 'eis', planet: 'p1', name: 'Eis', price: 10000, luck: 0.35, value: 2,
    text: 'Gefrorene Insel mit Eiskristallen, einem Iglu und Dauerschnee.',
    sky: ['#8fc6f2', '#eef8ff'], ground: '#eef6ff', side: '#9cc4e4', rock: '#7d97b3', accent: '#8ae6ff', fx: 'snow' },
  { id: 'lava', planet: 'p1', name: 'Lava', price: 40000, luck: 0.5, value: 2.5,
    text: 'Ein Vulkan spuckt Glut, Lavaflüsse ziehen über schwarzen Fels.',
    sky: ['#2a0c0c', '#a8381c'], ground: '#2c2420', side: '#3a2a24', rock: '#1f1a18', accent: '#ff6a1a', fx: 'embers' },
  { id: 'hoehle', planet: 'p1', name: 'Höhle', price: 150000, luck: 0.7, value: 3,
    text: 'Unter einem Felsbogen wachsen leuchtende Kristalle aus dem Boden.',
    sky: ['#120f1c', '#2c2448'], ground: '#4a4458', side: '#3a3446', rock: '#2a2534', accent: '#b07bff', fx: 'spores' },
  { id: 'candy', planet: 'p1', name: 'Candy', price: 500000, luck: 1, value: 4,
    text: 'Lollis, Zuckerstangen und Donuts auf rosa Zuckerguss. Es regnet Streusel.',
    sky: ['#ff9ad5', '#ffe3f3'], ground: '#ffc2e2', side: '#c88b5a', rock: '#a86a44', accent: '#ff5fb0', fx: 'sprinkles' },

  // ── Planet 2 ──
  { id: 'mond', planet: 'p2', name: 'Mond', price: 2000000, luck: 1.3, value: 6,
    text: 'Graue Krater, eine Flagge und die Erde am Horizont.',
    sky: ['#05060c', '#1a1d2e'], ground: '#b9bcc4', side: '#8a8d96', rock: '#6a6d76', accent: '#e8ecf5', fx: 'stars' },
  { id: 'neptun', planet: 'p2', name: 'Neptun', price: 6000000, luck: 1.6, value: 8,
    text: 'Eisblaue Kristalltürme im ewigen Sturm des fernsten Planeten.',
    sky: ['#050b24', '#1a3a8a'], ground: '#3a6fd1', side: '#2a4fa0', rock: '#1d3470', accent: '#7ad0ff', fx: 'storm' },
  { id: 'mars', planet: 'p2', name: 'Mars', price: 15000000, luck: 2, value: 11,
    text: 'Rote Dünen, ein Rover und eine kleine Forschungsstation.',
    sky: ['#2a0e08', '#c4602e'], ground: '#c4582e', side: '#8a3a1e', rock: '#6a2a16', accent: '#ffb07a', fx: 'reddust' },
  { id: 'saturn', planet: 'p2', name: 'Saturn', price: 40000000, luck: 2.4, value: 15,
    text: 'Goldener Sand und ein Ring aus Gestein, der um die Insel kreist.',
    sky: ['#0c0a14', '#4a3a24'], ground: '#e0c08a', side: '#b0905a', rock: '#7a6440', accent: '#ffe2a0', fx: 'stars' },
  { id: 'alien', planet: 'p2', name: 'Alien', price: 100000000, luck: 2.8, value: 20,
    text: 'Leuchtende Pflanzen, violetter Boden und ein UFO, das über allem schwebt.',
    sky: ['#0a0418', '#3a1460'], ground: '#6a3aa8', side: '#4a2478', rock: '#2e1650', accent: '#7aff5a', fx: 'alien' },
  { id: 'sonne', planet: 'p2', name: 'Sonne', price: 300000000, luck: 3.3, value: 28,
    text: 'Glühender Boden und Sonnenbögen. Die heißeste Welt, die es gibt.',
    sky: ['#3a0a00', '#ff7a1a'], ground: '#ffb02e', side: '#e05a10', rock: '#a02a08', accent: '#fff2a0', fx: 'flares' },

  // ── Planet 3 ──
  { id: 'korallenriff', planet: 'p3', name: 'Korallenriff', price: 1000000000, luck: 4, value: 40,
    text: 'Bunte Korallen, Seegras und Fischschwärme im warmen Wasser.',
    sky: ['#063a5a', '#2ab0c8'], ground: '#f2d4a0', side: '#c8a070', rock: '#8a7050', accent: '#ff7a8a', fx: 'bubbles', water: true },
  { id: 'muschelland', planet: 'p3', name: 'Muschelland', price: 3000000000, luck: 4.8, value: 55,
    text: 'Riesige Muscheln mit Perlen, Seesterne und glitzernder Sand.',
    sky: ['#0a3050', '#4ab0d0'], ground: '#ffe6c8', side: '#d8b088', rock: '#9a7a5a', accent: '#ffd0e8', fx: 'bubbles', water: true },
  { id: 'atlantis', planet: 'p3', name: 'Atlantis', price: 10000000000, luck: 5.8, value: 75,
    text: 'Die versunkene Stadt: Säulen, ein Tempel und eine goldene Kuppel.',
    sky: ['#021a30', '#0e6a8a'], ground: '#d8e4ea', side: '#8aa4b0', rock: '#5a7480', accent: '#ffd76a', fx: 'bubbles', water: true },
  { id: 'tiefseegraben', neu: true, planet: 'p3', name: 'Tiefseegraben', price: 30000000000, luck: 7, value: 100,
    text: 'Der tiefste Ort des Meeres: schwarze Felswände, Leuchtquallen und ein Anglerfisch so groß wie ein Haus.',
    sky: ['#01060f', '#0a2a3a'], ground: '#2a3440', side: '#1a222c', rock: '#10161e', accent: '#5affd8', fx: 'bubbles', water: true },

  // ── Planet 4 ──
  { id: 'wolkenburg', neu: true, planet: 'p4', name: 'Wolkenburg', price: 100000000000, luck: 8.5, value: 140,
    text: 'Eine Burg aus weißem Marmor auf Wolken. Goldene Brücken führen zu kleineren Wolkeninseln.',
    sky: ['#8a9ae8', '#fff3e0'], ground: '#f4f0ff', side: '#d8d4ec', rock: '#b8b4d0', accent: '#ffd76a', fx: 'pollen' },
  { id: 'engelsgarten', neu: true, planet: 'p4', name: 'Engelsgarten', price: 300000000000, luck: 10, value: 190,
    text: 'Weiße Bäume mit goldenem Laub, Springbrunnen aus Licht und Treppen, die ins Nichts führen.',
    sky: ['#c8a8ff', '#fff6e8'], ground: '#cfe6b4', side: '#c8d4b8', rock: '#a8b098', accent: '#fff2a0', fx: 'pollen' },
  { id: 'goetterthron', neu: true, planet: 'p4', name: 'Götterthron', price: 1000000000000, luck: 12, value: 260,
    text: 'Ein Thron auf dem höchsten Gipfel über allen Wolken. Hier sind die Münzen am meisten wert.',
    sky: ['#1a1040', '#ffcf7a'], ground: '#fff0c8', side: '#d8c090', rock: '#a08858', accent: '#ffe7a8', fx: 'flares' },

  // ── Planet 5 (Juwelnebel): Edelsteine statt Münzen. price in Diamantstaub, value macht Edelsteine mehr wert ──
  { id: 'quarzfeld', neu: true, planet: 'p5', name: 'Quarzfeld', price: 0, luck: 13, value: 1,
    text: 'Weiße Quarzsäulen wachsen aus hellem Fels. Zwischen ihnen glitzern die ersten Edelsteine.',
    sky: ['#2a1f4a', '#d8ccff'], ground: '#e8e4f4', side: '#a8a0c4', rock: '#7a7298', accent: '#ffffff', fx: 'spores' },
  { id: 'amethystgrotte', neu: true, planet: 'p5', name: 'Amethystgrotte', price: 25000, luck: 14.5, value: 1.5,
    text: 'Eine offene Grotte, aus deren Wänden violette Amethyst-Drusen wachsen.',
    sky: ['#1a0a30', '#8a4ad8'], ground: '#6a4a9a', side: '#4a2e72', rock: '#2e1a50', accent: '#c98bff', fx: 'spores' },
  { id: 'topasduenen', neu: true, planet: 'p5', name: 'Topasdünen', price: 100000, luck: 16, value: 2,
    text: 'Goldgelbe Dünen aus Topas-Sand, aus denen große Kristalle ragen.',
    sky: ['#3a1a08', '#ffc46a'], ground: '#f2c46a', side: '#c8904a', rock: '#8a5a2a', accent: '#ffb02e', fx: 'dust' },

  // ── Planet 6 ──
  { id: 'smaragdwald', neu: true, planet: 'p6', name: 'Smaragdwald', price: 400000, luck: 18, value: 3,
    text: 'Bäume mit Blättern aus Smaragd. Wenn der Wind weht, klingen sie wie Glöckchen.',
    sky: ['#0a2a1a', '#7ae8b0'], ground: '#2fa86a', side: '#1e6a44', rock: '#14482e', accent: '#3ee08a', fx: 'fireflies' },
  { id: 'jadetempel', neu: true, planet: 'p6', name: 'Jadetempel', price: 1500000, luck: 20, value: 4,
    text: 'Ein Stufentempel aus grüner Jade mit goldenen Dächern, bewacht von Steinlöwen.',
    sky: ['#14301e', '#d8f0c0'], ground: '#8ad0a0', side: '#5a9a70', rock: '#3a6a4a', accent: '#ffd76a', fx: 'pollen' },
  { id: 'saphirsee', neu: true, planet: 'p6', name: 'Saphirsee', price: 6000000, luck: 22, value: 5.5,
    text: 'Ein tiefblauer See, in dem Saphire wie Sterne auf dem Grund leuchten.',
    sky: ['#06123a', '#4a8aff'], ground: '#cfe0ff', side: '#6a8ad0', rock: '#3a5aa0', accent: '#3a7aff', fx: 'stars' },

  // ── Planet 7 ──
  { id: 'rubinvulkan', neu: true, planet: 'p7', name: 'Rubinvulkan', price: 25000000, luck: 25, value: 7.5,
    text: 'Ein Vulkan, der statt Lava rote Rubine ausspuckt. Der Boden glüht in Karminrot.',
    sky: ['#2a0610', '#ff4a6a'], ground: '#3a1a22', side: '#2a1018', rock: '#1a080e', accent: '#ff3a5a', fx: 'embers' },
  { id: 'opalwolken', neu: true, planet: 'p7', name: 'Opalwolken', price: 100000000, luck: 28, value: 10,
    text: 'Inseln auf schillernden Wolken. Jede Wolke leuchtet in allen Farben eines Opals.',
    sky: ['#3a5ad8', '#ffe2f6'], ground: '#f4f0ff', side: '#d0c8f0', rock: '#a8a0d0', accent: '#ff9ae0', fx: 'sprinkles' },
  { id: 'diamantkern', neu: true, planet: 'p7', name: 'Diamantkern', price: 400000000, luck: 32, value: 14,
    text: 'Das Herz des Planeten: ein Diamant so groß wie ein Berg. Hier sind die Edelsteine am meisten wert.',
    sky: ['#040814', '#8af0ff'], ground: '#dff8ff', side: '#9ad0e0', rock: '#5a8aa0', accent: '#e8fdff', fx: 'flares' },
];

// Fernkulisse je Welt (Kulissen-Konzept): ein Wahrzeichen gegenüber der Startkamera und drei Tiefen.
// Nah 380–460 Studs (satt), Mitte 480–560, Fern 600–630 (stark in die Horizontfarbe getönt).
// Gebaut wird sie vom Roblox-Modul WorldFx (roblox/js/worldFxLuau.js), hier stehen die Texte für die Weltkarte.
export const KULISSE = {
  spawn: { held: 'Goldener Münzberg mit Wasserfall aus Münzen', nah: 'Schwebende Marktinseln mit Ballons', mitte: 'Waldhügel mit Windrädern', fern: 'Schneeberge, warm getönt', horizont: '#fde8c8' },
  normal: { held: 'Großer Wasserfallberg, der Bach fällt ins Wolkenmeer', nah: 'Grüne Hügel mit Hofhäusern und Feldern', mitte: 'Waldrücken mit Burg-Silhouette', fern: 'Schneeberge in Himmelblau', horizont: '#d6eefa' },
  wald: { held: 'Weltenbaum, 450 Studs hoch, die Krone im Nebel', nah: 'Riesenpilze und umgestürzte Stämme', mitte: 'Tannenwand mit Nebelschwaden', fern: 'Blaugrüne Bergkämme in Stufen', horizont: '#bfe3c4' },
  stadt: { held: 'Fernsehturm mit drehendem Licht', nah: 'Brücken und Hochbahn auf Pfeilern', mitte: 'Hochhauscluster in drei Gruppen, Lücken dazwischen', fern: 'Flache Skyline, Fenster blinken einzeln', horizont: '#ffe0b8' },
  eis: { held: 'Gletscherwand mit blauen Spalten', nah: 'Treibende Eisschollen im Wolkenmeer', mitte: 'Eisspitzen in Gruppen', fern: 'Weiße Gipfel, fast eins mit dem Himmel', horizont: '#eef8ff' },
  lava: { held: 'Großer Vulkan, der alle 40 Sekunden ausbricht', nah: 'Lavaseen mit Glutblasen', mitte: 'Basaltsäulen und kleine Vulkane', fern: 'Rauchwand mit rotem Glühen von unten', horizont: '#a8381c' },
  hoehle: { held: 'Riesenkristall in der Höhlendecke, leuchtet nach unten', nah: 'Stalagmiten mit Leuchtpilzen', mitte: 'Kristallwände in Violett und Türkis', fern: 'Höhlenwand mit einer Öffnung voll Tageslicht', horizont: '#2c2448' },
  candy: { held: 'Torte als Berg mit Schokoladenfluss', nah: 'Zuckerwatte-Wolken und Lollis', mitte: 'Waffelberge mit Eiskugeln', fern: 'Pastellhügel, rosa getönt', horizont: '#ffe3f3' },
  mond: { held: 'Die Erde, groß und halb beleuchtet', nah: 'Kraterränder in Grau', mitte: 'Schwebende Brocken', fern: 'Milchstraße als Nebelstreifen', horizont: '#1a1d2e' },
  neptun: { held: 'Großer dunkler Fleck: ein Sturmauge mit Blitzen', nah: 'Eisspitzen im Wind', mitte: 'Sturmring, der schneller dreht', fern: 'Tritons Silhouette vor blauem Dunst', horizont: '#1a3a8a' },
  mars: { held: 'Olympus Mons, flacher Riesenvulkan am Horizont', nah: 'Dünenkämme mit Staubfahnen', mitte: 'Tafelberge in Schichten, gruppiert', fern: 'Die zwei Monde Phobos und Deimos', horizont: '#c4602e' },
  saturn: { held: 'Saturn selbst mit Ring, schräg über dem Horizont', nah: 'Ein großer Brocken des Rings zieht nah vorbei', mitte: 'Gesteinsring', fern: 'Goldener Nebel', horizont: '#4a3a24' },
  alien: { held: 'Mutterschiff schwebt über dem Horizont', nah: 'Leuchtpflanzen mit pulsierenden Knollen', mitte: 'Riesenpilze in Gruppen', fern: 'Zwei Sonnen in Grün und Violett', horizont: '#3a1460' },
  sonne: { held: 'Große Protuberanz, 500 Studs, pulsiert', nah: 'Glühende Brocken', mitte: 'Sonnenbögen in zwei Größen', fern: 'Korona-Ring', horizont: '#ff7a1a' },
  korallenriff: { held: 'Riffwand mit Höhle, ein Wal schwimmt hindurch', nah: 'Seetangwald', mitte: 'Korallentürme in Gruppen', fern: 'Riffkante, dahinter Tiefblau', horizont: '#2ab0c8' },
  muschelland: { held: 'Riesenmuschel öffnet sich, die Perle leuchtet', nah: 'Seesterne auf Felsen', mitte: 'Muscheln und Felsbögen', fern: 'Sandbänke mit Lichtstrahlen', horizont: '#4ab0d0' },
  atlantis: { held: 'Versunkener Tempelberg mit goldener Kuppel', nah: 'Umgestürzte Säulen', mitte: 'Ruinenstadt in Terrassen', fern: 'Riesenstatue, nur als Umriss', horizont: '#0e6a8a' },
  tiefseegraben: { held: 'Anglerfisch mit Leuchtköder in der Dunkelheit', nah: 'Schwarze Felswände mit Leuchtadern', mitte: 'Schlote mit Blasen (Black Smoker)', fern: 'Fast schwarz, nur leuchtende Punkte', horizont: '#0a2a3a' },
  wolkenburg: { held: 'Burg auf einer Wolkensäule', nah: 'Goldene Brücken zu Wolkeninseln', mitte: 'Wolkentürme', fern: 'Regenbogen über dem Horizont', horizont: '#fff3e0' },
  engelsgarten: { held: 'Lichtbaum mit goldenem Laub', nah: 'Schwebende Treppen', mitte: 'Weiße Bäume in Gruppen', fern: 'Lichtsäulen aus den Wolken', horizont: '#fff6e8' },
  goetterthron: { held: 'Thron auf dem höchsten Gipfel', nah: 'Goldene Säulen', mitte: 'Gipfel über den Wolken', fern: 'Sternenhimmel bei Sonnenuntergang', horizont: '#ffcf7a' },
  quarzfeld: { held: 'Riesiger Bergkristall, der das Licht in Regenbogen bricht', nah: 'Quarzsäulen in Gruppen', mitte: 'Helle Felsrücken mit Kristalladern', fern: 'Violetter Nebel der Supernova', horizont: '#d8ccff' },
  amethystgrotte: { held: 'Aufgebrochene Amethyst-Druse, groß wie ein Haus', nah: 'Violette Kristallspitzen', mitte: 'Grottenwände mit Leuchtadern', fern: 'Sternennebel in Violett', horizont: '#8a4ad8' },
  topasduenen: { held: 'Topas-Obelisk auf der höchsten Düne', nah: 'Dünenkämme mit Kristallen', mitte: 'Tafelberge aus Bernstein', fern: 'Zwei Sonnen im Goldnebel', horizont: '#ffc46a' },
  smaragdwald: { held: 'Smaragdbaum, dessen Krone grün leuchtet', nah: 'Farne mit Kristallblättern', mitte: 'Waldrücken in Grün', fern: 'Grüne Polarlichter', horizont: '#7ae8b0' },
  jadetempel: { held: 'Stufentempel aus Jade mit goldenem Dach', nah: 'Steinlöwen und Laternen', mitte: 'Pagoden auf Felsnadeln', fern: 'Nebelberge in Jadegrün', horizont: '#d8f0c0' },
  saphirsee: { held: 'Saphir-Mond, der sich im See spiegelt', nah: 'Seerosen aus Glas', mitte: 'Felsinseln im blauen Wasser', fern: 'Sternbänder über dem Horizont', horizont: '#4a8aff' },
  rubinvulkan: { held: 'Vulkan mit glühendem Rubinkrater', nah: 'Rubinbrocken in schwarzem Fels', mitte: 'Kleine Krater mit rotem Glühen', fern: 'Rote Rauchwand', horizont: '#ff4a6a' },
  opalwolken: { held: 'Opal-Ring, der über den Wolken schwebt', nah: 'Schillernde Wolkenbäusche', mitte: 'Wolkentürme in Pastell', fern: 'Regenbogenschleier', horizont: '#ffe2f6' },
  diamantkern: { held: 'Diamant so groß wie ein Berg', nah: 'Diamantsplitter im Boden', mitte: 'Kristallbögen', fern: 'Lichtstrahlen aus dem Kern', horizont: '#8af0ff' },
};

export const galaxyById = Object.fromEntries(GALAXIES.map((g) => [g.id, g]));
export const planetsOf = (galaxyId) => PLANETS.filter((p) => p.galaxy === galaxyId);
export const planetById = Object.fromEntries([HUB, ...PLANETS].map((p) => [p.id, p]));
export const worldById = Object.fromEntries(WORLDS.map((w) => [w.id, w]));
export const worldsOf = (planetId) => WORLDS.filter((w) => w.planet === planetId);
export const playable = (planetId) => worldsOf(planetId).filter((w) => !w.soon);

// ── Wiedergeburt ─────────────────────────────────────────────────────────────
// Kostet Moneten, setzt die Moneten auf 0 und macht alle Münzen dauerhaft mehr wert.
// Welten, Münzen, Level und Skills bleiben.
export const REBIRTH = {
  cost: (n) => 1000000 * Math.pow(4, n), // n = Wiedergeburten bisher
  bonus: 0.5, // +50 % Münzwert je Wiedergeburt
};
export const rebirthMultiplier = (n) => 1 + REBIRTH.bonus * n;

// ── Supernova (Prestige) ─────────────────────────────────────────────────────
// Ab 100 Wiedergeburten kann man zur Supernova werden: Moneten und Wiedergeburten gehen auf 0, dafür ist
// alles für immer fünfmal so viel wert und die nächste Galaxie öffnet sich (pro Galaxie einmal).
// Welten, Portale, Münzen, Edelsteine, Eier, Level und Skills bleiben.
export const SUPERNOVA = {
  rebirths: 100, // Wiedergeburten, die man braucht
  bonus: 5, // Wert-Faktor je Supernova (×5, ×25 …)
  max: GALAXIES.length - 1, // eine Supernova pro weiterer Galaxie
};
export const supernovaMultiplier = (n) => Math.pow(SUPERNOVA.bonus, n);
// Welt-Galaxie: was man dort findet ('coins' oder 'gems')
export const galaxyOfWorld = (w) => galaxyById[planetById[w.planet]?.galaxy] || GALAXIES[0];

// Währungen: Münzen bringen Moneten, Edelsteine Diamantstaub
export const CURRENCIES = {
  moneten: { id: 'moneten', name: 'Moneten', color: '#ffd76a', icon: 'coin' },
  staub: { id: 'staub', name: 'Diamantstaub', color: '#8af0ff', icon: 'gem' },
};
export const currencyOfWorld = (w) => CURRENCIES[galaxyOfWorld(w).currency] || CURRENCIES.moneten;

// Anzeige
export const fmtLuck = (w) => (w.luck ? `+${Math.round(w.luck * 100).toLocaleString('de-DE')} %` : '±0 %');
export const fmtValue = (w) => `×${w.value.toLocaleString('de-DE')}`;
export function fmtPrice(n) {
  if (!n) return 'Gratis';
  const units = [[1e15, ' Brd.'], [1e12, ' Bio.'], [1e9, ' Mrd.'], [1e6, ' Mio.'], [1e3, 'K']];
  for (const [v, u] of units) if (n >= v) return (n / v).toLocaleString('de-DE', { maximumFractionDigits: 1 }) + u;
  return n.toLocaleString('de-DE');
}
