// 50 Auras, die um den Spieler leuchten. Man kauft sie im Shop mit Talern; die angelegte Aura gibt
// einen kleinen Bonus. Seltenere Auras kosten mehr und geben mehr.
//
// look beschreibt den Effekt (auraFactory.js baut daraus 3D, luau.js die Roblox-Partikel):
//   cols   Farben
//   rise   Teilchen steigen auf      fall  Teilchen fallen von oben     swirl Spirale um den Körper
//   orbit  Dinge kreisen ({ kind, n })   ring  Kreis am Boden (ring, rune, hex, flame)
//   halo, wings, crown, pillar, bolts, shell, beams, glitch: Zusatzteile
//   tex    Teilchenform: dot, square, star, heart, flake, leaf, coin, note, glyph, bubble
// Werte sind Vorschläge und hier anpassbar.

export const RARITIES = [
  { id: 'gewoehnlich', name: 'Gewöhnlich', color: '#b8b0a0', price: [1000, 5000], bonus: [1, 3] },
  { id: 'selten', name: 'Selten', color: '#5fd38d', price: [20000, 80000], bonus: [3, 5] },
  { id: 'episch', name: 'Episch', color: '#b07bff', price: [250000, 800000], bonus: [5, 8] },
  { id: 'legendaer', name: 'Legendär', color: '#ffb02e', price: [2e6, 8e6], bonus: [8, 12] },
  { id: 'mythisch', name: 'Mythisch', color: '#ff5f8a', price: [25e6, 80e6], bonus: [12, 18] },
  { id: 'goettlich', name: 'Göttlich', color: '#fff2a0', price: [250e6, 1e9], bonus: [18, 25] },
];
export const rarityById = Object.fromEntries(RARITIES.map((r) => [r.id, r]));

export const THEMES = [
  { id: 'elemente', name: 'Elemente', color: '#ff7a3a' },
  { id: 'schaetze', name: 'Münzen & Schätze', color: '#ffd23a' },
  { id: 'kosmos', name: 'Weltraum & Magie', color: '#9a7bff' },
  { id: 'spass', name: 'Lustig & Glitch', color: '#ff5fd2' },
];
export const themeById = Object.fromEntries(THEMES.map((t) => [t.id, t]));

// Bonusarten: wirken im Spiel, solange die Aura angelegt ist
export const BONUSES = {
  glueck: { name: 'Glück', text: (v) => `+${v} % Glück` },
  wert: { name: 'Münzwert', text: (v) => `+${v} % Münzwert` },
  ep: { name: 'Erfahrung', text: (v) => `+${v} % EP` },
  tempo: { name: 'Tempo', text: (v) => `+${v} % Tempo` },
};

// [id, Name, Thema, Seltenheit, Bonusart, Beschreibung, look]
const LIST = [
  // ── Elemente ──
  ['funken', 'Funkenflug', 'elemente', 'gewoehnlich', 'tempo', 'Ein paar Funken springen bei jedem Schritt.', { cols: ['#ffb02e', '#ff6a1a'], rise: { n: 40, speed: 0.8 }, tex: 'dot' }],
  ['tropfen', 'Tautropfen', 'elemente', 'gewoehnlich', 'glueck', 'Kühle Tropfen perlen um dich herum.', { cols: ['#7ad0ff', '#bff0ff'], fall: { n: 40 }, tex: 'bubble' }],
  ['laub', 'Herbstlaub', 'elemente', 'gewoehnlich', 'ep', 'Bunte Blätter wirbeln um deine Beine.', { cols: ['#e8752a', '#ffb02e', '#c8402e'], swirl: { n: 30, low: true }, tex: 'leaf' }],
  ['flamme', 'Flammenmantel', 'elemente', 'selten', 'wert', 'Flammen züngeln an dir hoch, ohne zu brennen.', { cols: ['#ff6a1a', '#ffb02e', '#ff3a10'], rise: { n: 90, speed: 1.4 }, ring: 'flame', tex: 'dot' }],
  ['frost', 'Frosthauch', 'elemente', 'selten', 'glueck', 'Eiskristalle schweben, der Boden friert.', { cols: ['#bff4ff', '#7ad0ff', '#ffffff'], orbit: { kind: 'crystal', n: 6 }, ring: 'hex', tex: 'flake' }],
  ['wirbelwind', 'Wirbelwind', 'elemente', 'selten', 'tempo', 'Ein kleiner Tornado trägt dich voran.', { cols: ['#dfe8f0', '#a8c0d0'], swirl: { n: 120 }, tex: 'dot' }],
  ['erdbrocken', 'Erdbrocken', 'elemente', 'selten', 'wert', 'Felsen kreisen schwer um dich.', { cols: ['#8a7060', '#b59b7a'], orbit: { kind: 'rock', n: 5 }, ring: 'ring', tex: 'square' }],
  ['gift', 'Giftnebel', 'elemente', 'episch', 'glueck', 'Grüner Dunst und blubbernde Blasen.', { cols: ['#7aff5a', '#3aa84a', '#c6ff4a'], rise: { n: 70, speed: 0.5 }, shell: true, tex: 'bubble' }],
  ['blitz', 'Kugelblitz', 'elemente', 'episch', 'tempo', 'Blitze knistern zwischen deinen Händen.', { cols: ['#fff7b0', '#ffe94a', '#7ad0ff'], bolts: true, orbit: { kind: 'orb', n: 3 }, tex: 'dot' }],
  ['lava', 'Lavastrom', 'elemente', 'episch', 'wert', 'Glühende Lava fließt im Kreis um dich.', { cols: ['#ff4a00', '#ffb02e', '#3a1a10'], ring: 'flame', rise: { n: 60, speed: 0.6 }, pillar: true, tex: 'dot' }],
  ['tsunami', 'Flutwelle', 'elemente', 'legendaer', 'ep', 'Eine Welle aus Wasser umkreist dich.', { cols: ['#3ab0e8', '#bff0ff', '#1a6ab8'], swirl: { n: 160 }, ring: 'ring', fall: { n: 30 }, tex: 'bubble' }],
  ['phoenix', 'Phönixfeuer', 'elemente', 'mythisch', 'wert', 'Flammenflügel breiten sich hinter dir aus.', { cols: ['#ff6a1a', '#ffd23a', '#ff3a10'], wings: true, rise: { n: 120, speed: 1.6 }, ring: 'flame', tex: 'dot' }],
  ['elementar', 'Elementarherr', 'elemente', 'goettlich', 'glueck', 'Feuer, Eis, Blitz und Erde gehorchen dir.', { cols: ['#ff6a1a', '#7ad0ff', '#ffe94a', '#7aff5a'], orbit: { kind: 'orb', n: 4 }, bolts: true, pillar: true, ring: 'rune', tex: 'star' }],

  // ── Münzen & Schätze ──
  ['taler', 'Talerregen', 'schaetze', 'gewoehnlich', 'wert', 'Ab und zu fällt ein Taler vom Himmel.', { cols: ['#ffcf4a', '#ffe08a'], fall: { n: 24 }, tex: 'coin' }],
  ['silber', 'Silberstaub', 'schaetze', 'selten', 'glueck', 'Feiner Silberstaub glitzert um dich.', { cols: ['#dfe4ee', '#ffffff'], swirl: { n: 80 }, tex: 'star' }],
  ['muenzwirbel', 'Münzwirbel', 'schaetze', 'selten', 'wert', 'Goldmünzen drehen sich im Kreis.', { cols: ['#ffcf4a'], orbit: { kind: 'coin', n: 8 }, tex: 'coin' }],
  ['edelstein', 'Edelsteinkranz', 'schaetze', 'selten', 'glueck', 'Rubine, Saphire und Smaragde kreisen.', { cols: ['#e3263f', '#2a7de1', '#2aa860'], orbit: { kind: 'gem', n: 6 }, tex: 'star' }],
  ['schatzkarte', 'Schatzsucher', 'schaetze', 'episch', 'ep', 'Ein goldenes X leuchtet unter dir.', { cols: ['#ffd23a', '#a07a50'], ring: 'rune', fall: { n: 30 }, tex: 'coin' }],
  ['krone', 'Königskrone', 'schaetze', 'episch', 'wert', 'Eine schwebende Krone über deinem Kopf.', { cols: ['#ffd23a', '#e3263f'], crown: true, rise: { n: 40, speed: 0.6 }, tex: 'star' }],
  ['diamant', 'Diamantenschauer', 'schaetze', 'episch', 'glueck', 'Diamanten funkeln und fallen.', { cols: ['#bff4ff', '#ffffff', '#9ad8ff'], orbit: { kind: 'diamond', n: 4 }, fall: { n: 40 }, tex: 'star' }],
  ['goldrausch', 'Goldrausch', 'schaetze', 'legendaer', 'wert', 'Ein Strudel aus Gold umhüllt dich.', { cols: ['#ffcf4a', '#fff2a0', '#ffb020'], swirl: { n: 140 }, orbit: { kind: 'coin', n: 10 }, pillar: true, tex: 'coin' }],
  ['tresor', 'Tresorwächter', 'schaetze', 'legendaer', 'glueck', 'Ein goldener Schild schützt deinen Schatz.', { cols: ['#ffd23a', '#c8a040'], shell: true, ring: 'hex', orbit: { kind: 'gem', n: 4 }, tex: 'star' }],
  ['midas', 'Midas-Berührung', 'schaetze', 'mythisch', 'wert', 'Was du anfasst, wird zu Gold.', { cols: ['#ffd23a', '#fff6c0'], beams: true, rise: { n: 100, speed: 1 }, ring: 'rune', tex: 'coin' }],
  ['muenzmeister', 'Münzmeister', 'schaetze', 'goettlich', 'wert', 'Die Aura des größten Sammlers aller Zeiten.', { cols: ['#ffd23a', '#ffffff', '#ffb020'], halo: true, crown: true, orbit: { kind: 'coin', n: 12 }, pillar: true, beams: true, tex: 'coin' }],

  // ── Weltraum & Magie ──
  ['sternenstaub', 'Sternenstaub', 'kosmos', 'gewoehnlich', 'ep', 'Winzige Sterne funkeln um dich.', { cols: ['#ffffff', '#cfe0ff'], swirl: { n: 50 }, tex: 'star' }],
  ['mondschein', 'Mondschein', 'kosmos', 'gewoehnlich', 'glueck', 'Ein kleiner Mond begleitet dich.', { cols: ['#e8ecf5', '#9ab0d0'], orbit: { kind: 'moon', n: 1 }, tex: 'dot' }],
  ['runen', 'Runenkreis', 'kosmos', 'selten', 'ep', 'Leuchtende Runen drehen sich am Boden.', { cols: ['#7ad0ff', '#b07bff'], ring: 'rune', rise: { n: 30, speed: 0.4 }, tex: 'glyph' }],
  ['nordlicht', 'Nordlicht', 'kosmos', 'selten', 'glueck', 'Grün-blaue Lichtbänder wehen über dir.', { cols: ['#5affd8', '#7aff5a', '#7ad0ff'], beams: true, tex: 'dot' }],
  ['planeten', 'Planetenbahn', 'kosmos', 'episch', 'ep', 'Kleine Planeten kreisen wie um eine Sonne.', { cols: ['#ff9b3d', '#7ad0ff', '#b07bff', '#ffd23a'], orbit: { kind: 'planet', n: 4 }, tex: 'star' }],
  ['portal', 'Portalträger', 'kosmos', 'episch', 'tempo', 'Ein Portal öffnet sich hinter dir.', { cols: ['#b07bff', '#5ad1ff'], ring: 'ring', swirl: { n: 100, low: true }, shell: true, tex: 'dot' }],
  ['engel', 'Engelslicht', 'kosmos', 'episch', 'glueck', 'Heiligenschein und sanfte Federn.', { cols: ['#fff4cf', '#ffffff', '#ffe08a'], halo: true, fall: { n: 30 }, tex: 'flake' }],
  ['daemon', 'Dämonenglut', 'kosmos', 'legendaer', 'wert', 'Rote Hörner aus Licht und Höllenglut.', { cols: ['#ff2a2a', '#5a0a0a', '#ff6a1a'], rise: { n: 110, speed: 1.1 }, ring: 'rune', wings: true, tex: 'dot' }],
  ['sternbild', 'Sternbild', 'kosmos', 'legendaer', 'ep', 'Du bist mit Sternen nachgezeichnet.', { cols: ['#ffffff', '#aee0ff'], orbit: { kind: 'star', n: 7 }, swirl: { n: 80 }, pillar: true, tex: 'star' }],
  ['nebel', 'Sternennebel', 'kosmos', 'legendaer', 'glueck', 'Ein bunter Nebel aus fernen Galaxien.', { cols: ['#ff6ad5', '#3ad0ff', '#b07bff'], swirl: { n: 180 }, shell: true, tex: 'dot' }],
  ['schwarzesloch', 'Schwarzes Loch', 'kosmos', 'mythisch', 'glueck', 'Licht wird in einen Strudel über dir gezogen.', { cols: ['#ffb060', '#b49cff', '#000000'], orbit: { kind: 'hole', n: 1 }, swirl: { n: 160 }, tex: 'dot' }],
  ['erzmagier', 'Erzmagier', 'kosmos', 'mythisch', 'ep', 'Zauberbücher und Runen schweben um dich.', { cols: ['#9a7bff', '#5ad1ff', '#ffd23a'], ring: 'rune', orbit: { kind: 'book', n: 3 }, rise: { n: 80, speed: 0.6 }, tex: 'glyph' }],
  ['galaxie', 'Galaxienherz', 'kosmos', 'goettlich', 'glueck', 'Eine ganze Galaxie dreht sich um dich.', { cols: ['#ff6ad5', '#3ad0ff', '#ffffff', '#b07bff'], swirl: { n: 260 }, orbit: { kind: 'planet', n: 5 }, halo: true, pillar: true, tex: 'star' }],

  // ── Lustig & Glitch ──
  ['seifenblasen', 'Seifenblasen', 'spass', 'gewoehnlich', 'tempo', 'Blubb. Blubb. Blubb.', { cols: ['#bff0ff', '#ffd0f4', '#e8ffd0'], rise: { n: 30, speed: 0.4 }, tex: 'bubble' }],
  ['herzen', 'Herzchen', 'spass', 'gewoehnlich', 'glueck', 'Kleine Herzen steigen auf.', { cols: ['#ff5f8a', '#ff9ad5'], rise: { n: 30, speed: 0.5 }, tex: 'heart' }],
  ['noten', 'Ohrwurm', 'spass', 'selten', 'ep', 'Musiknoten tanzen um dich herum.', { cols: ['#ffffff', '#ffe25f', '#5ad1ff'], swirl: { n: 40 }, tex: 'note' }],
  ['konfetti', 'Konfettiparty', 'spass', 'selten', 'glueck', 'Bunte Schnipsel regnen auf dich.', { cols: ['#ff5aa5', '#ffe07a', '#5ad1ff', '#8cff7a', '#c48bff'], fall: { n: 90 }, tex: 'square' }],
  ['regenbogen', 'Regenbogen', 'spass', 'selten', 'wert', 'Ein Regenbogen spannt sich über dir.', { cols: ['#ff5a5a', '#ffb02e', '#ffe94a', '#5fd38d', '#5ad1ff', '#9a7bff'], beams: true, rise: { n: 40, speed: 0.6 }, tex: 'star' }],
  ['pixel', 'Pixelwolke', 'spass', 'episch', 'tempo', 'Du bestehst halb aus Pixeln.', { cols: ['#3dff7a', '#5ad1ff', '#ff5aa5'], swirl: { n: 90 }, orbit: { kind: 'cube', n: 6 }, tex: 'square' }],
  ['disco', 'Discofieber', 'spass', 'episch', 'ep', 'Eine Discokugel schwebt über dir.', { cols: ['#ff3df2', '#3de8ff', '#ffe23d', '#7a5cff'], orbit: { kind: 'disco', n: 1 }, beams: true, ring: 'ring', tex: 'dot' }],
  ['katzen', 'Katzenparade', 'spass', 'episch', 'glueck', 'Kleine Blockkatzen laufen um dich herum.', { cols: ['#a3a3ad', '#e8752a', '#ffffff'], orbit: { kind: 'cat', n: 3 }, rise: { n: 20, speed: 0.4 }, tex: 'heart' }],
  ['glitch', 'Glitch', 'spass', 'legendaer', 'tempo', 'Fehler im System. Du flackerst ein bisschen.', { cols: ['#ff2040', '#20f0ff', '#ffffff'], glitch: true, orbit: { kind: 'cube', n: 8 }, tex: 'square' }],
  ['hacker', 'Hackerwolke', 'spass', 'legendaer', 'ep', 'Grüner Code läuft an dir herunter.', { cols: ['#3dff7a', '#bfffd0'], fall: { n: 160 }, pillar: true, tex: 'glyph' }],
  ['admin', 'Admin-Fehler', 'spass', 'mythisch', 'wert', 'ERROR 404: Aura zu stark.', { cols: ['#ff4058', '#ff00dc', '#000000'], glitch: true, bolts: true, ring: 'hex', rise: { n: 90, speed: 1 }, tex: 'square' }],
  ['feuerwerk', 'Feuerwerk', 'spass', 'mythisch', 'glueck', 'Raketen explodieren in allen Farben über dir.', { cols: ['#ff5aa5', '#ffe07a', '#5ad1ff', '#8cff7a'], burst: true, rise: { n: 60, speed: 1.4 }, tex: 'star' }],
  ['chaos', 'Reines Chaos', 'spass', 'goettlich', 'glueck', 'Alles auf einmal. Niemand weiß warum.', { cols: ['#ff5aa5', '#ffe07a', '#5ad1ff', '#8cff7a', '#c48bff'], glitch: true, burst: true, orbit: { kind: 'cube', n: 8 }, swirl: { n: 200 }, halo: true, tex: 'square' }],
];

// Preis und Bonus innerhalb der Spanne der Seltenheit, nach Position in der Liste gestaffelt
const counters = {};
const rank = {};
for (const [id, , , rar] of LIST) rank[id] = counters[rar] = (counters[rar] ?? -1) + 1;
const roundPrice = (n) => {
  const p = Math.pow(10, Math.floor(Math.log10(n)) - 1);
  return Math.round(n / p) * p;
};

export const AURAS = LIST.map(([id, name, theme, rarity, bonus, text, look]) => {
  const r = rarityById[rarity];
  const n = LIST.filter((a) => a[3] === rarity).length;
  const k = n > 1 ? rank[id] / (n - 1) : 0;
  return {
    id, name, theme, rarity, text, look,
    price: roundPrice(r.price[0] * Math.pow(r.price[1] / r.price[0], k)),
    bonus: { type: bonus, value: Math.round(r.bonus[0] + (r.bonus[1] - r.bonus[0]) * k) },
    color: look.cols[0],
  };
}).sort((a, b) => a.price - b.price);

export const auraById = Object.fromEntries(AURAS.map((a) => [a.id, a]));
export const bonusText = (a) => BONUSES[a.bonus.type].text(a.bonus.value);
export function fmtPrice(n) {
  for (const [v, u] of [[1e9, ' Mrd.'], [1e6, ' Mio.'], [1e3, 'K']]) if (n >= v) return (n / v).toLocaleString('de-DE', { maximumFractionDigits: 1 }) + u;
  return n.toLocaleString('de-DE');
}
