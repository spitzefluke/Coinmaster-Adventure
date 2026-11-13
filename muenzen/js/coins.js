// Seltenheitsstufen und alle 60 Münzen der Coinmaster-Sammlung: 50 in den zehn Stufen von Normal bis
// Unerreichbar, dazu 10 Premium-Münzen in einer eigenen Stufe (aus dem Münzlabor).
//
// Alle Münzen sind rund. Jede Stufe bestimmt Rand (glatt/geriffelt), das gravierte
// Muster im Feld (field), das Zierband am Rand (border), Material und Effekte.
// Jede Münze bringt ihr eigenes Motiv (Schlüssel in emblems.js – als Relief gezeichnet), ihre
// Metallfarben und eine kurze Beschreibung mit.
//
// Metallpaletten: [hell, mittel, dunkel] – daraus werden Prägung und Relief erzeugt.

export const TIERS = [
  {
    id: 'normal', name: 'Normal', value: '1', chance: 35,
    color: '#c27a4a', field: 'plain', border: 'beads', edge: 'plain',
    fx: [],
  },
  {
    id: 'selten', name: 'Selten', value: '5', chance: 25,
    color: '#c9d1d9', field: 'lathe', border: 'rope', edge: 'reeded',
    fx: [],
  },
  {
    id: 'sehr-selten', name: 'Sehr selten', value: '10', chance: 15,
    color: '#f2c14e', field: 'sunburst', border: 'laurel', edge: 'reeded',
    fx: ['shine'],
  },
  {
    id: 'episch', name: 'Episch', value: '25', chance: 9,
    color: '#b072ff', field: 'crosshatch', border: 'zigzag', edge: 'plain',
    fx: ['glow', 'gems'],
  },
  {
    id: 'legendaer', name: 'Legendär', value: '50', chance: 5,
    color: '#ff8a3d', field: 'vortex', border: 'beads', edge: 'plain',
    fx: ['glow', 'embers'],
  },
  {
    id: 'mystisch', name: 'Mystisch', value: '100', chance: 3,
    color: '#3ee6c8', field: 'sigil', border: 'runes', edge: 'plain',
    fx: ['glow', 'runes', 'orbitRing'],
  },
  {
    id: 'engelsgleich', name: 'Engelsgleich', value: '250', chance: 1.5,
    color: '#fff4d6', field: 'glory', border: 'feathers', edge: 'plain',
    fx: ['glow', 'wings', 'halo', 'sparkles'],
  },
  {
    id: 'goettlich', name: 'Göttlich', value: '500', chance: 0.9,
    color: '#ffd23f', field: 'sunburst', border: 'rays', edge: 'plain',
    fx: ['glow', 'rays', 'sparkles'],
  },
  {
    id: 'galaktisch', name: 'Galaktisch', value: '1000', chance: 0.5,
    color: '#7b6cff', field: 'orbits', border: 'stars', edge: 'plain',
    fx: ['glow', 'nebula', 'planets', 'sparkles'],
  },
  {
    id: 'unerreichbar', name: 'Unerreichbar', value: '∞', chance: 0.1,
    color: '#ff5fd2', field: 'guilloche', border: 'diamonds', edge: 'plain',
    fx: ['glow', 'rainbow', 'rings', 'sparkles', 'rays'],
  },
  // Premium: eigene Drop-Chance; jede Münze hat ihren eigenen Wert (value) und ihr eigenes Gewicht (weight)
  {
    id: 'premium', name: 'Premium', value: '40', chance: 5, rank: 4, // rank: zählt für Effekte und EP wie Legendär
    color: '#d9b26a', field: 'guilloche', border: 'diamonds', edge: 'reeded',
    fx: ['glow', 'shine', 'sparkles'],
  },
];

const COPPER = ['#f3b58a', '#b8693d', '#5a2a14'];
const BRONZE = ['#e8c48e', '#a37437', '#4a3112'];
const BRASS = ['#f4dc93', '#b99a3e', '#584515'];
const IRON = ['#d4d4cf', '#87867f', '#36352f'];
const SILVER = ['#ffffff', '#b9c2cc', '#4c5662'];
const GOLD = ['#fff1b0', '#e2ad2f', '#6e4a08'];

// Felder einer Münze: tier, name, emblem (Motiv in emblems.js), metal, text; optional gem/ember/glow (Akzentfarbe),
// value (eigener Wert statt Nennwert der Stufe), weight (Gewicht innerhalb der Stufe, Standard 1),
// special: 'glitch' (Wert wird beim Finden gewürfelt, 1–999) oder 'mystery' (verwandelt sich in eine andere Münze)
export const COINS = [
  // ── Normal (9) ───────────────────────────────────────────────
  { tier: 'normal', name: 'Glutfunke', emblem: 'glut', metal: COPPER,
    text: 'Ein Funke aus der ersten Schmiede. Er geht nie ganz aus.' },
  { tier: 'normal', name: 'Rostanker', emblem: 'anker', metal: IRON,
    text: 'Hat drei Schiffbrüche überlebt und hält immer noch.' },
  { tier: 'normal', name: 'Hufeisen-Heller', emblem: 'hufeisen', metal: IRON,
    text: 'Bringt Glück, solange die Öffnung nach oben zeigt.' },
  { tier: 'normal', name: 'Laternentaler', emblem: 'laterne', metal: BRASS,
    text: 'Leuchtet dir den Weg durch jede dunkle Gasse.' },
  { tier: 'normal', name: 'Pfeilschuss', emblem: 'pfeil', metal: BRONZE,
    text: 'Trifft immer genau in die Geldbörse.' },
  { tier: 'normal', name: 'Keimling', emblem: 'keimling', metal: COPPER,
    text: 'Pflanz sie ein, und vielleicht wächst ein Münzbaum.' },
  { tier: 'normal', name: 'Würfelglück', emblem: 'wuerfel', metal: BRASS,
    text: 'Zeigt immer eine Sechs. Fast immer.' },
  { tier: 'normal', name: 'Federkiel', emblem: 'feder', metal: BRONZE,
    text: 'Damit unterschreiben Abenteurer ihre Schatzkarten.' },
  { tier: 'normal', name: 'Pilzprinz', emblem: 'pilzprinz', metal: COPPER,
    text: 'Der kleinste Adelige im ganzen Wald.' },

  // ── Selten (8) ───────────────────────────────────────────────
  { tier: 'selten', name: 'Sturmfalke', emblem: 'falke', metal: SILVER,
    text: 'Stürzt sich auf alles, was glänzt.' },
  { tier: 'selten', name: 'Frostzahn', emblem: 'frostzahn', metal: ['#f4fdff', '#a6d4e6', '#2d5566'],
    text: 'Abgebrochen von einem Gletscher, der beißt.' },
  { tier: 'selten', name: 'Nachtschwinge', emblem: 'fledermaus', metal: ['#f2f0ff', '#a9a6c8', '#33304d'],
    text: 'Fliegt nur, wenn alle anderen schlafen.' },
  { tier: 'selten', name: 'Schattenfuchs', emblem: 'fuchs', metal: SILVER,
    text: 'Schneller weg, als du „meins“ sagen kannst.' },
  { tier: 'selten', name: 'Silberkompass', emblem: 'kompass', metal: SILVER,
    text: 'Zeigt nicht nach Norden, sondern zum nächsten Schatz.' },
  { tier: 'selten', name: 'Runenschild', emblem: 'runenschild', metal: ['#fbfbf7', '#bdbbb0', '#4f4c42'],
    text: 'Die Rune darauf hält Taschendiebe fern.' },
  { tier: 'selten', name: 'Mondsplitter', emblem: 'mondsplitter', metal: ['#f7f9ff', '#aab6d6', '#3c4766'],
    text: 'Ein Stück Mond, das zu tief geflogen ist.' },
  { tier: 'selten', name: 'Wellenbrecher', emblem: 'welle', metal: ['#f0fbff', '#9ccbe0', '#284d60'],
    text: 'Rauscht leise, wenn man sie ans Ohr hält.' },

  // ── Sehr selten (7) ──────────────────────────────────────────
  { tier: 'sehr-selten', name: 'Kronjuwel', emblem: 'krone', metal: GOLD,
    text: 'Fiel aus der Krone des Münzkönigs und wurde nie zurückgegeben.' },
  { tier: 'sehr-selten', name: 'Schwertkreuz', emblem: 'schwerter', metal: ['#fff3c4', '#d9a940', '#5e3f0a'],
    text: 'Zwei Klingen, ein Schwur: Der Schatz wird geteilt.' },
  { tier: 'sehr-selten', name: 'Schatzkarte', emblem: 'karte', metal: ['#fff0c8', '#d6a24a', '#5e3a0c'],
    text: 'Das X markiert die Stelle. Welche Stelle, sagt sie nicht.' },
  { tier: 'sehr-selten', name: 'Bienenkönigin', emblem: 'biene', metal: GOLD,
    text: 'Ihr Honig ist aus purem Gold.' },
  { tier: 'sehr-selten', name: 'Vierblatt', emblem: 'klee', metal: ['#f6ffd8', '#c9b23c', '#4f4608'],
    text: 'Einer unter zehntausend. Genau wie du.' },
  { tier: 'sehr-selten', name: 'Goldskarabäus', emblem: 'skarabaeus', metal: ['#fff6cc', '#e6b63d', '#6b4b0c'],
    text: 'Rollt seit dem alten Reich Münzen durch die Wüste.' },
  { tier: 'sehr-selten', name: 'Schatztruhe', emblem: 'truhe', metal: GOLD,
    text: 'Eine Truhe in der Truhe in der Truhe.' },

  // ── Episch (6) ───────────────────────────────────────────────
  { tier: 'episch', name: 'Ouroboros', emblem: 'ouroboros', metal: ['#f6dcff', '#9c5bd1', '#331247'], gem: '#5cffb0',
    text: 'Die Schlange, die sich selbst frisst und nie satt wird.' },
  { tier: 'episch', name: 'Kristallherz', emblem: 'kristallherz', metal: ['#ffe6fb', '#d07cc8', '#4d1846'], gem: '#ff4f9a',
    text: 'Schlägt im Takt jedes Fundes.' },
  { tier: 'episch', name: 'Tornadotaler', emblem: 'tornado', metal: ['#efe0ff', '#8d5fd8', '#2b1650'], gem: '#7ad7ff',
    text: 'Wirbelt alle Münzen in der Nähe zu sich.' },
  { tier: 'episch', name: 'Sternenhut', emblem: 'zauberhut', metal: ['#e8e2ff', '#7d6ad8', '#221a52'], gem: '#ffe14d',
    text: 'Der Hut des Erzmagiers. Der Zauberer fehlt noch.' },
  { tier: 'episch', name: 'Skorpionstachel', emblem: 'skorpion', metal: ['#fff3ff', '#b37ae0', '#3a1856'], gem: '#ff3355',
    text: 'Wer ihn falsch anfasst, merkt es sofort.' },
  { tier: 'episch', name: 'Netz der Weberin', emblem: 'spinne', metal: ['#f0e0ff', '#a066c4', '#2e1043'], gem: '#3df5e0',
    text: 'Fängt keine Fliegen, sondern Münzen.' },

  // ── Legendär (5) ─────────────────────────────────────────────
  { tier: 'legendaer', name: 'Drachenatem', emblem: 'drachenkopf', metal: ['#fff0c2', '#f08a24', '#5c1f02'], ember: '#ff6a1a',
    text: 'Noch warm vom letzten Feuerstoß.' },
  { tier: 'legendaer', name: 'Titanenhammer', emblem: 'kriegshammer', metal: ['#fff4d1', '#e09a2e', '#5a2d04'], ember: '#ffd04a',
    text: 'Ein Schlag damit, und die Erde bebt.' },
  { tier: 'legendaer', name: 'Feuervogel', emblem: 'feuervogel', metal: ['#ffe2c4', '#e0602a', '#4f1204'], ember: '#ff3b1a',
    text: 'Steigt in einem Funkenregen auf und kehrt nie mit leeren Krallen zurück.' },
  { tier: 'legendaer', name: 'Meteoritenkern', emblem: 'meteor', metal: ['#f5ffd0', '#c7a52a', '#4a3a04'], ember: '#c6ff4a',
    text: 'Fiel vom Himmel und brannte ein Loch in die Schatzkammer.' },
  { tier: 'legendaer', name: 'Löwenherz', emblem: 'loewenherz', metal: ['#fff6c8', '#f2b230', '#5e3a02'], ember: '#ffe45c',
    text: 'Gehört dem mutigsten Abenteurer im Königreich.' },

  // ── Mystisch (4) ─────────────────────────────────────────────
  { tier: 'mystisch', name: 'Geisterflamme', emblem: 'geist', metal: ['#e5ffe9', '#4aa66a', '#082414'], glow: '#7dff9e',
    text: 'Flackert, obwohl kein Wind weht.' },
  { tier: 'mystisch', name: 'Zeitriss', emblem: 'zeitriss', metal: ['#c9fff2', '#2fa38f', '#06221f'], glow: '#3ee6c8',
    text: 'Die Zeiger laufen rückwärts. Manchmal auch seitwärts.' },
  { tier: 'mystisch', name: 'Runenportal', emblem: 'runenportal', metal: ['#d4f1ff', '#3283c4', '#061a33'], glow: '#4fb8ff',
    text: 'Wer hindurchschaut, sieht eine andere Welt.' },
  { tier: 'mystisch', name: 'Schattenkrähe', emblem: 'kraehe', metal: ['#ead9ff', '#6b4bb3', '#120a29'], glow: '#a77bff',
    text: 'Sammelt Geheimnisse wie andere Münzen.' },

  // ── Engelsgleich (4) ─────────────────────────────────────────
  { tier: 'engelsgleich', name: 'Himmelsharfe', emblem: 'harfe', metal: ['#fffaf0', '#f2cf7d', '#8a6014'],
    text: 'Spielt von selbst, wenn ein Engel vorbeifliegt.' },
  { tier: 'engelsgleich', name: 'Lichtfeder', emblem: 'lichtfeder', metal: ['#ffffff', '#e2e6f5', '#7a8099'],
    text: 'Leichter als Luft, schwerer als Gold.' },
  { tier: 'engelsgleich', name: 'Wolkenschloss', emblem: 'wolkenschloss', metal: ['#ffffff', '#e9dcb8', '#8a7444'],
    text: 'Die Hauptstadt über den Wolken.' },
  { tier: 'engelsgleich', name: 'Engelsglocke', emblem: 'glocke', metal: ['#fffdf2', '#f0d58c', '#8c6a1c'],
    text: 'Jedes Mal, wenn sie läutet, findet jemand eine Münze.' },

  // ── Göttlich (3) ─────────────────────────────────────────────
  { tier: 'goettlich', name: 'Donnerkeil', emblem: 'donnerkeil', metal: ['#fffbe0', '#ffc928', '#7a4a00'],
    text: 'Vom Gott des Himmels persönlich geschleudert.' },
  { tier: 'goettlich', name: 'Auge des Ra', emblem: 'ra', metal: ['#fff7e8', '#f0b44a', '#6b3c05'],
    text: 'Sieht jeden Schatz unter dem Wüstensand.' },
  { tier: 'goettlich', name: 'Weltenbaum', emblem: 'weltenbaum', metal: ['#f0fffb', '#4fd1c5', '#0c4a50'],
    text: 'Seine Wurzeln reichen bis in alle neun Welten.' },

  // ── Galaktisch (2) ───────────────────────────────────────────
  { tier: 'galaktisch', name: 'Schwarzes Loch', emblem: 'schwarzesloch', metal: ['#f1e8ff', '#8f7cf0', '#161036'],
    text: 'Was hineinfällt, kommt nie zurück. Außer als Münze.' },
  { tier: 'galaktisch', name: 'Komet Aurora', emblem: 'komet', metal: ['#e4f2ff', '#5a8cf0', '#08143a'],
    text: 'Kommt nur alle tausend Jahre vorbei.' },

  // ── Unerreichbar (2) ─────────────────────────────────────────
  { tier: 'unerreichbar', name: 'Das Unendliche', emblem: 'unendlich', metal: ['#ffffff', '#d7c8ff', '#2a1d52'],
    text: 'Hat weder Anfang noch Ende. Noch nie hat sie jemand gezogen.' },
  { tier: 'unerreichbar', name: 'Das Goldene Huhn', emblem: 'huhn', metal: ['#fffbe8', '#ffd7a0', '#5a3410'],
    text: 'Legt Münzen statt Eier. Niemand weiß, woher es kam.' },

  // ── Premium (10, aus dem Münzlabor) ──────────────────────────
  { tier: 'premium', name: 'Pixel-Münze', emblem: 'pixel', metal: ['#fff6a8', '#f2c228', '#7a4a06'], value: 40, weight: 3,
    text: 'Aus 8-Bit-Würfeln gebaut, die fröhlich im Takt hüpfen.' },
  { tier: 'premium', name: 'Magma-Kern', emblem: 'magma', metal: ['#ffd2a8', '#9a4a2a', '#2a1410'], value: 75, weight: 1.5, ember: '#ff7a1a',
    text: 'Rissiges Vulkangestein, in dessen Adern heiße Lava pulsiert.' },
  { tier: 'premium', name: 'Jade-Lotus', emblem: 'lotus', metal: ['#d8ffe8', '#2aa86e', '#0a3a24'], value: 120, weight: 1.2, glow: '#ffd250',
    text: 'Alte Jade-Münze mit Goldeinlage, umweht von Lotusblüten.' },
  { tier: 'premium', name: 'Uhrwerk', emblem: 'uhrwerk', metal: ['#fff0c0', '#cda046', '#5a3c10'], value: 150, weight: 0.8,
    text: 'Messing-Münze mit Sichtfenster, hinter dem echte Zahnräder ticken.' },
  { tier: 'premium', name: 'Galaxie', emblem: 'galaxie', metal: ['#e6e0ff', '#6a5ad8', '#0f0f37'], value: 300, weight: 0.5, glow: '#a07bff',
    text: 'Ein wirbelnder Sternennebel, umkreist von einem Saturn-Ring.' },
  { tier: 'premium', name: 'Kristall-Prisma', emblem: 'prisma', metal: ['#ffffff', '#bfe9ff', '#3a6a8a'], value: 400, weight: 0.3, gem: '#ff7ad8',
    text: 'Facettierter Eiskristall mit funkelndem Edelstein-Herz.' },
  { tier: 'premium', name: 'Drachenauge', emblem: 'drachenauge', metal: ['#e0ffe8', '#2aa05a', '#0a3018'], value: 600, weight: 0.2, gem: '#ffd228',
    text: 'Smaragdgrüne Schuppen und ein Auge, das dich beobachtet.' },
  { tier: 'premium', name: 'Glitch', emblem: 'glitch', metal: ['#ffffff', '#cfcfcf', '#3a3a3a'], value: 0, weight: 0.15, glow: '#00ffc8', special: 'glitch',
    text: 'Ein Fehler im System, ihr Wert liegt irgendwo zwischen 1 und 999.' },
  { tier: 'premium', name: 'Engelsmünze', emblem: 'engelsmuenze', metal: ['#fffdf4', '#ffe6a0', '#8a6a1c'], value: 1000, weight: 0.08,
    text: 'Strahlendes Weißgold mit Heiligenschein und flatternden Flügeln.' },
  { tier: 'premium', name: 'Mystery-Münze', emblem: 'mystery', metal: ['#e8d8ff', '#6a3ab0', '#0c0c10'], value: 0, weight: 1.5, glow: '#b450ff', special: 'mystery',
    text: 'Niemand weiß, welche Münze sich darin versteckt. Beim Ziehen verwandelt sie sich.' },
];

export const tierById = Object.fromEntries(TIERS.map((t, i) => [t.id, { ...t, index: i, rank: t.rank ?? i }]));
// Die Seltenheits-Leiter von Normal bis Unerreichbar (ohne Premium), z. B. für „Goldene Hand“ und Edelsteine
export const LADDER = TIERS.filter((t) => t.id !== 'premium');
// Nächsthöhere Stufe auf der Leiter oder null (Premium und Unerreichbar haben keine)
export function nextTier(tierId) {
  const i = LADDER.findIndex((t) => t.id === tierId);
  return i >= 0 && i < LADDER.length - 1 ? tierById[LADDER[i + 1].id] : null;
}

// Gewicht einer Münze innerhalb ihrer Stufe (Premium-Münzen unterschiedlich, sonst alle gleich)
export const coinWeight = (c) => c.weight ?? 1;
// Chance einer einzelnen Münze in Prozent
export function coinChance(coin) {
  const pool = COINS.filter((c) => c.tier === coin.tier);
  return (tierById[coin.tier].chance * coinWeight(coin)) / pool.reduce((s, c) => s + coinWeight(c), 0);
}
// Nennwert einer Münze: eigener Wert (Premium) oder Wert der Stufe (∞ zählt als 1 Mio.)
export function coinBaseValue(coin) {
  const v = Number(coin.value ?? tierById[coin.tier].value);
  return Number.isFinite(v) ? v : 1000000;
}

// Zieht eine Münze nach Drop-Chance: erst die Stufe, dann nach Gewicht innerhalb der Stufe.
// keepMystery = false: die Mystery-Münze verwandelt sich sofort in eine zufällige andere Münze.
export function rollCoin(random = Math.random, { keepMystery = true } = {}) {
  let roll = random() * TIERS.reduce((s, t) => s + t.chance, 0);
  const tier = TIERS.find((t) => (roll -= t.chance) <= 0) ?? TIERS[0];
  const pool = COINS.filter((c) => c.tier === tier.id);
  let r = random() * pool.reduce((s, c) => s + coinWeight(c), 0);
  const coin = pool.find((c) => (r -= coinWeight(c)) <= 0) ?? pool[0];
  if (coin.special === 'mystery' && !keepMystery) {
    let next = coin;
    while (next.special === 'mystery') next = rollCoin(random);
    return next;
  }
  return coin;
}

// Wert einer Glitch-Münze: beim Finden gewürfelt (1–999)
export const glitchValue = (random = Math.random) => 1 + Math.floor(random() * 999);
