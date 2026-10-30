// Seltenheitsstufen und alle 50 Münzen der Coinmaster-Sammlung.
//
// Alle Münzen sind rund. Jede Stufe bestimmt Rand (glatt/geriffelt), das gravierte
// Muster im Feld (field), das Zierband am Rand (border), Material und Effekte.
// Jede Münze bringt ihr eigenes Motiv (Emoji als Prägevorlage), ihre
// Metallfarben und eine kurze Beschreibung mit.
//
// Metallpaletten: [hell, mittel, dunkel] – daraus werden Prägung und Relief erzeugt.

export const TIERS = [
  {
    id: 'normal', name: 'Normal', value: '1', chance: 40,
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
];

const COPPER = ['#f3b58a', '#b8693d', '#5a2a14'];
const BRONZE = ['#e8c48e', '#a37437', '#4a3112'];
const BRASS = ['#f4dc93', '#b99a3e', '#584515'];
const IRON = ['#d4d4cf', '#87867f', '#36352f'];
const SILVER = ['#ffffff', '#b9c2cc', '#4c5662'];
const GOLD = ['#fff1b0', '#e2ad2f', '#6e4a08'];

export const COINS = [
  // ── Normal (9) ───────────────────────────────────────────────
  { tier: 'normal', name: 'Pilzpfennig', emblem: '🍄', metal: COPPER,
    text: 'Wächst nach jedem Regen im Geldbeutel nach.' },
  { tier: 'normal', name: 'Schneckentaler', emblem: '🐌', metal: BRONZE,
    text: 'Kommt immer an. Irgendwann.' },
  { tier: 'normal', name: 'Brotgroschen', emblem: '🍞', metal: BRASS,
    text: 'Das tägliche Brot der Abenteurer.' },
  { tier: 'normal', name: 'Fischmünze', emblem: '🐟', metal: IRON,
    text: 'Riecht leicht nach Hafen.' },
  { tier: 'normal', name: 'Ährenpfennig', emblem: '🌾', metal: BRASS,
    text: 'Geprägt zur ersten Ernte im Tal.' },
  { tier: 'normal', name: 'Schmiedepfennig', emblem: '🔨', metal: IRON,
    text: 'Mit jedem Hammerschlag ein bisschen härter.' },
  { tier: 'normal', name: 'Froschgroschen', emblem: '🐸', metal: COPPER,
    text: 'Wer ihn küsst, bekommt keinen Prinzen. Nur Grünspan.' },
  { tier: 'normal', name: 'Käsetaler', emblem: '🧀', metal: BRASS,
    text: 'Die Löcher sind im Preis inbegriffen.' },
  { tier: 'normal', name: 'Quietsche-Pfennig', emblem: '🦆', metal: BRONZE,
    text: 'Macht beim Werfen leise „quiek“.' },

  // ── Selten (8) ───────────────────────────────────────────────
  { tier: 'selten', name: 'Wolfssilber', emblem: '🐺', metal: SILVER,
    text: 'Heult, wenn der Vollmond darauf scheint.' },
  { tier: 'selten', name: 'Mondsichel', emblem: '🌙', metal: ['#f7f9ff', '#aab6d6', '#3c4766'],
    text: 'Nur nachts im Umlauf.' },
  { tier: 'selten', name: 'Dolchtaler', emblem: '🗡️', metal: SILVER,
    text: 'Lohn der Schattengilde.' },
  { tier: 'selten', name: 'Eulenschilling', emblem: '🦉', metal: ['#fbfbf7', '#bdbbb0', '#4f4c42'],
    text: 'Klüger angelegt als jede andere Münze.' },
  { tier: 'selten', name: 'Tannentaler', emblem: '🌲', metal: ['#f3fbf6', '#a9c4b5', '#36513f'],
    text: 'Aus dem Silber der Waldminen.' },
  { tier: 'selten', name: 'Frostgroschen', emblem: '❄️', metal: ['#f4fdff', '#a6d4e6', '#2d5566'],
    text: 'Bleibt auch im Sommer eiskalt.' },
  { tier: 'selten', name: 'Pinguin-Penny', emblem: '🐧', metal: SILVER,
    text: 'Trägt immer einen Frack.' },
  { tier: 'selten', name: 'Socken-Silberling', emblem: '🧦', metal: SILVER,
    text: 'Taucht genau einmal pro Waschgang auf.' },

  // ── Sehr selten (7) ──────────────────────────────────────────
  { tier: 'sehr-selten', name: 'Kronendukat', emblem: '👑', metal: GOLD,
    text: 'Zahlungsmittel am Hof des Münzkönigs.' },
  { tier: 'sehr-selten', name: 'Löwentaler', emblem: '🦁', metal: GOLD,
    text: 'Sein Brüllen hallt durch jede Schatzkammer.' },
  { tier: 'sehr-selten', name: 'Burgdukat', emblem: '🏰', metal: ['#fff3c4', '#d9a940', '#5e3f0a'],
    text: 'Öffnet jedes Burgtor im Königreich.' },
  { tier: 'sehr-selten', name: 'Schatzschlüssel', emblem: '🗝️', metal: GOLD,
    text: 'Gehört zu einer Truhe, die niemand gefunden hat.' },
  { tier: 'sehr-selten', name: 'Adlerdukat', emblem: '🦅', metal: ['#fff6cc', '#e6b63d', '#6b4b0c'],
    text: 'Fliegt dir aus der Hand, wenn du nicht aufpasst.' },
  { tier: 'sehr-selten', name: 'Pizzadukat', emblem: '🍕', metal: ['#fff0b8', '#efa92e', '#6d3f06'],
    text: 'Mit extra Käse geprägt.' },
  { tier: 'sehr-selten', name: 'Sonnenblumen-Gulden', emblem: '🌻', metal: GOLD,
    text: 'Dreht sich immer zum Licht.' },

  // ── Episch (6) ───────────────────────────────────────────────
  { tier: 'episch', name: 'Drachenauge', emblem: '🐉', metal: ['#f6dcff', '#9c5bd1', '#331247'], gem: '#ff3355',
    text: 'Ein Drache hat sie zwölf Jahrhunderte bewacht.' },
  { tier: 'episch', name: 'Orakelkugel', emblem: '🔮', metal: ['#efe0ff', '#8d5fd8', '#2b1650'], gem: '#7ad7ff',
    text: 'Zeigt dir, wo die nächste Münze liegt.' },
  { tier: 'episch', name: 'Donnertaler', emblem: '⚡', metal: ['#fff3ff', '#b37ae0', '#3a1856'], gem: '#ffe14d',
    text: 'Knistert, wenn ein Gewitter naht.' },
  { tier: 'episch', name: 'Einhornmünze', emblem: '🦄', metal: ['#ffe6fb', '#d07cc8', '#4d1846'], gem: '#ff9be8',
    text: 'Hinterlässt eine Spur aus Glitzer.' },
  { tier: 'episch', name: 'Erzmagier-Siegel', emblem: '🧙', metal: ['#e8e2ff', '#7d6ad8', '#221a52'], gem: '#5cffb0',
    text: 'Mit einem Bann gegen Taschendiebe belegt.' },
  { tier: 'episch', name: 'Krakentaler', emblem: '🐙', metal: ['#f0e0ff', '#a066c4', '#2e1043'], gem: '#3df5e0',
    text: 'Aus einem versunkenen Piratenschiff.' },

  // ── Legendär (5) ─────────────────────────────────────────────
  { tier: 'legendaer', name: 'Phönixfeder', emblem: '🔥', metal: ['#fff0c2', '#f08a24', '#5c1f02'], ember: '#ff6a1a',
    text: 'Verbrennt und prägt sich aus der Asche neu.' },
  { tier: 'legendaer', name: 'Heldenklinge', emblem: '⚔️', metal: ['#fff4d1', '#e09a2e', '#5a2d04'], ember: '#ffd04a',
    text: 'Verliehen nach der Schlacht am Goldpass.' },
  { tier: 'legendaer', name: 'Urzeit-Rex', emblem: '🦖', metal: ['#f5ffd0', '#c7a52a', '#4a3a04'], ember: '#c6ff4a',
    text: 'Seit 66 Millionen Jahren im Umlauf. Beißt.' },
  { tier: 'legendaer', name: 'Vulkanherz', emblem: '🌋', metal: ['#ffe2c4', '#e0602a', '#4f1204'], ember: '#ff3b1a',
    text: 'Innen noch flüssig.' },
  { tier: 'legendaer', name: 'Champion-Pokal', emblem: '🏆', metal: ['#fff6c8', '#f2b230', '#5e3a02'], ember: '#ffe45c',
    text: 'Nur für die Sieger des großen Münzturniers.' },

  // ── Mystisch (4) ─────────────────────────────────────────────
  { tier: 'mystisch', name: 'Allsehendes Auge', emblem: '👁️', metal: ['#c9fff2', '#2fa38f', '#06221f'], glow: '#3ee6c8',
    text: 'Es sieht dich auch dann, wenn du es umdrehst.' },
  { tier: 'mystisch', name: 'Portalstrudel', emblem: '🌀', metal: ['#d4f1ff', '#3283c4', '#061a33'], glow: '#4fb8ff',
    text: 'Wer sie zu schnell dreht, landet woanders.' },
  { tier: 'mystisch', name: 'Geisterschädel', emblem: '💀', metal: ['#e5ffe9', '#4aa66a', '#082414'], glow: '#7dff9e',
    text: 'Leicht durchsichtig bei Mitternacht.' },
  { tier: 'mystisch', name: 'Schattenmond', emblem: '🌑', metal: ['#ead9ff', '#6b4bb3', '#120a29'], glow: '#a77bff',
    text: 'Wirft einen Schatten, wo keiner sein sollte.' },

  // ── Engelsgleich (4) ─────────────────────────────────────────
  { tier: 'engelsgleich', name: 'Friedenstaube', emblem: '🕊️', metal: ['#ffffff', '#e9dcb8', '#8a7444'],
    text: 'Bringt Ruhe in jede Taverne.' },
  { tier: 'engelsgleich', name: 'Heiligenschein', emblem: '😇', metal: ['#fffdf2', '#f0d58c', '#8c6a1c'],
    text: 'Garantiert unschuldig erworben.' },
  { tier: 'engelsgleich', name: 'Seraphflügel', emblem: '🪽', metal: ['#ffffff', '#e2e6f5', '#7a8099'],
    text: 'Federleicht, aber unbezahlbar.' },
  { tier: 'engelsgleich', name: 'Himmelsposaune', emblem: '🎺', metal: ['#fffaf0', '#f2cf7d', '#8a6014'],
    text: 'Kündigt große Gewinne an.' },

  // ── Göttlich (3) ─────────────────────────────────────────────
  { tier: 'goettlich', name: 'Sonnengott', emblem: '☀️', metal: ['#fffbe0', '#ffc928', '#7a4a00'],
    text: 'Leuchtet heller als die Mittagssonne.' },
  { tier: 'goettlich', name: 'Dreizack der Tiefe', emblem: '🔱', metal: ['#f0fffb', '#4fd1c5', '#0c4a50'],
    text: 'Gebietet über alle Münzen am Meeresgrund.' },
  { tier: 'goettlich', name: 'Waage der Ewigkeit', emblem: '⚖️', metal: ['#fff7e8', '#f0b44a', '#6b3c05'],
    text: 'Wiegt jede Tat und jede Münze.' },

  // ── Galaktisch (2) ───────────────────────────────────────────
  { tier: 'galaktisch', name: 'Saturnring', emblem: '🪐', metal: ['#f1e8ff', '#8f7cf0', '#161036'],
    text: 'Hat sieben Monde und einen eigenen Ring.' },
  { tier: 'galaktisch', name: 'Milchstraße', emblem: '🌌', metal: ['#e4f2ff', '#5a8cf0', '#08143a'],
    text: 'Enthält ungefähr 200 Milliarden Sterne.' },

  // ── Unerreichbar (2) ─────────────────────────────────────────
  { tier: 'unerreichbar', name: 'Ewigkeit', emblem: '⌛', metal: ['#ffffff', '#d7c8ff', '#2a1d52'],
    text: 'Hat weder Anfang noch Ende. Noch nie hat sie jemand gezogen.' },
  { tier: 'unerreichbar', name: 'Die Allmächtige Kartoffel', emblem: '🥔', metal: ['#fffbe8', '#ffd7a0', '#5a3410'],
    text: 'Der Ursprung allen Reichtums. Niemand weiß, warum.' },
];

export const tierById = Object.fromEntries(TIERS.map((t, i) => [t.id, { ...t, index: i }]));

// Zieht eine Münze nach Drop-Chance: erst die Stufe, dann gleichverteilt innerhalb der Stufe.
export function rollCoin(random = Math.random) {
  let roll = random() * 100;
  const tier = TIERS.find((t) => (roll -= t.chance) <= 0) ?? TIERS[0];
  const pool = COINS.filter((c) => c.tier === tier.id);
  return pool[Math.floor(random() * pool.length)];
}
