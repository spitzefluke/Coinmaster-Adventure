// Münzbaumgarten: Bäume, Gartenwerkzeug und die Regeln des Gartens.
//
// Den Garten kauft man mit Talern. Bäume und Werkzeug gibt es nur aus Münzrollen (rollen/).
// Ein Baum wächst in drei Stufen (Setzling, Jungbaum, ausgewachsen). Ausgewachsen trägt er
// alle `cycle` Sekunden eine Ernte von `yield` Talern, höchstens MAX_RIPE Ernten auf Vorrat.
// Gießkannen lassen ihn schneller wachsen, Dünger vervielfacht die Ernte eine Zeit lang.
//
// Dieselben Regeln stehen in Luau in GardenData (roblox/js/gardenLuau.js).

export const RARITIES = [
  { id: 'gewoehnlich', name: 'Gewöhnlich', color: '#c9c0ae', chance: 55 },
  { id: 'selten', name: 'Selten', color: '#5fd38d', chance: 27 },
  { id: 'episch', name: 'Episch', color: '#b07bff', chance: 11 },
  { id: 'legendaer', name: 'Legendär', color: '#ffb02e', chance: 5 },
  { id: 'mythisch', name: 'Mythisch', color: '#ff5f8a', chance: 1.6 },
  { id: 'goettlich', name: 'Göttlich', color: '#fff2a0', chance: 0.4 },
];
export const rarityById = Object.fromEntries(RARITIES.map((r, i) => [r.id, { ...r, index: i }]));

// grow: Sekunden bis ausgewachsen · cycle: Sekunden je Ernte · yield: Taler je Ernte
// crown: Form der Krone · trunk/leaf/fruit: Farben · look: Material der Krone
export const TREES = [
  { id: 'pfennigbusch', name: 'Pfennigbusch', rarity: 'gewoehnlich', grow: 60, cycle: 30, yield: 40, crown: 'bush', trunk: '#7a5230', leaf: '#5fae4a', fruit: '#c8743a', look: 'Grass', text: 'Klein, rund und genügsam. Wächst überall, wo man ihn lässt.' },
  { id: 'kupferbaum', name: 'Kupferbaum', rarity: 'gewoehnlich', grow: 120, cycle: 45, yield: 90, crown: 'round', trunk: '#6b4428', leaf: '#4f9a3c', fruit: '#d4834a', look: 'Grass', text: 'Der Klassiker. Zwischen den Blättern klimpern Kupfermünzen.' },
  { id: 'silberbirke', name: 'Silberbirke', rarity: 'selten', grow: 240, cycle: 60, yield: 300, crown: 'oval', trunk: '#e8e4dc', leaf: '#9fd06a', fruit: '#d6dde8', look: 'Grass', text: 'Weiße Rinde, helles Laub und Silberlinge, die im Wind glitzern.' },
  { id: 'talertanne', name: 'Talertanne', rarity: 'selten', grow: 300, cycle: 75, yield: 420, crown: 'cone', trunk: '#5a3a22', leaf: '#2f7a4a', fruit: '#ffd45a', look: 'Grass', text: 'Das ganze Jahr grün und behängt mit goldenen Talern wie mit Kugeln.' },
  { id: 'goldeiche', name: 'Goldeiche', rarity: 'episch', grow: 600, cycle: 90, yield: 1500, crown: 'round', trunk: '#5b3b1f', leaf: '#e8b830', fruit: '#fff0a0', look: 'Foil', big: true, text: 'Uralt und mächtig. Ihre Blätter sind aus Blattgold.' },
  { id: 'dukatenkirsche', name: 'Dukatenkirsche', rarity: 'episch', grow: 540, cycle: 80, yield: 1300, crown: 'blossom', trunk: '#4a2c22', leaf: '#ff9ec8', fruit: '#ffcf4a', look: 'SmoothPlastic', text: 'Blüht rosa und trägt statt Kirschen kleine Golddukaten.' },
  { id: 'kristallweide', name: 'Kristallweide', rarity: 'legendaer', grow: 1200, cycle: 120, yield: 6000, crown: 'weeping', trunk: '#6a7f96', leaf: '#8fe8ff', fruit: '#e6fbff', look: 'Glass', text: 'Ihre Zweige hängen wie Eiszapfen herab und klingen beim Ernten.' },
  { id: 'drachenpalme', name: 'Drachenpalme', rarity: 'mythisch', grow: 2400, cycle: 150, yield: 25000, crown: 'palm', trunk: '#5a2a1a', leaf: '#ff5a2a', fruit: '#ffb02e', look: 'Neon', text: 'Wächst nur, wo es heiß ist. Ihre Früchte glühen wie Drachenschuppen.' },
  { id: 'sternenbaum', name: 'Sternenbaum', rarity: 'goettlich', grow: 3600, cycle: 180, yield: 120000, crown: 'star', trunk: '#2a1f4a', leaf: '#3b2a8a', fruit: '#fff2a0', look: 'Glass', text: 'Seine Krone ist ein Stück Nachthimmel. Jede Frucht ist ein kleiner Stern.' },
];

// kind: water (seconds schneller wachsen, Infinity = sofort fertig) · boost (mult × Ernte für seconds)
//       taler (amount Taler sofort) · bed (+1 Beet)
export const TOOLS = [
  { id: 'talerbeutel', name: 'Talerbeutel', rarity: 'gewoehnlich', kind: 'taler', amount: 750, model: 'bag', color: '#c9a46a', text: 'Ein Säckchen voller Taler. Sofort in die Kasse.' },
  { id: 'blechkanne', name: 'Blechkanne', rarity: 'gewoehnlich', kind: 'water', seconds: 60, model: 'can', color: '#9aa3ad', text: 'Einmal gießen: Der Baum wächst 1 Minute schneller.' },
  { id: 'kupferkanne', name: 'Kupferkanne', rarity: 'selten', kind: 'water', seconds: 300, model: 'can', color: '#d4834a', text: 'Einmal gießen: Der Baum wächst 5 Minuten schneller.' },
  { id: 'duenger', name: 'Dünger', rarity: 'selten', kind: 'boost', mult: 2, seconds: 600, model: 'sack', color: '#6f8f3a', text: 'Doppelte Ernte an einem Baum, 10 Minuten lang.' },
  { id: 'goldkanne', name: 'Goldkanne', rarity: 'episch', kind: 'water', seconds: 1800, model: 'can', color: '#ffd45a', text: 'Einmal gießen: Der Baum wächst 30 Minuten schneller.' },
  { id: 'goldspaten', name: 'Goldener Spaten', rarity: 'legendaer', kind: 'bed', model: 'spade', color: '#ffd45a', text: 'Gräbt ein neues Beet in deinen Garten, ganz ohne Taler.' },
  { id: 'regenbogenkanne', name: 'Regenbogenkanne', rarity: 'legendaer', kind: 'water', seconds: Infinity, model: 'can', color: '#ff7ad9', rainbow: true, text: 'Einmal gießen: Der Baum ist sofort ausgewachsen.' },
  { id: 'zauberduenger', name: 'Zauberdünger', rarity: 'mythisch', kind: 'boost', mult: 3, seconds: 1800, model: 'sack', color: '#8a4bd8', text: 'Dreifache Ernte an einem Baum, 30 Minuten lang.' },
  { id: 'talertruhe', name: 'Talertruhe', rarity: 'goettlich', kind: 'taler', amount: 250000, model: 'chest', color: '#ffd45a', text: 'Eine ganze Truhe Taler. Selten wie ein Sternenbaum.' },
];

export const LOOT = [...TREES.map((t) => ({ ...t, type: 'tree' })), ...TOOLS.map((t) => ({ ...t, type: 'tool' }))];
export const lootById = Object.fromEntries(LOOT.map((l) => [l.id, l]));

export const GARDEN = {
  price: 25000, // Garten kaufen
  startBeds: 4,
  maxBeds: 12,
  bedPrice: (beds) => 15000 * 2 ** (beds - 4), // nächstes Beet
  maxRipe: 3, // so viele Ernten wartet ein Baum, dann hört er auf zu tragen
};

// ── Regeln (wie GardenData) ──────────────────────────────────────────────────

// Stufe eines Beets: 0 leer, 1 Setzling, 2 Jungbaum, 3 ausgewachsen
export function stage(plot, now) {
  if (!plot) return 0;
  const tree = lootById[plot.tree];
  const p = (now - plot.planted + plot.bonus) / tree.grow;
  return p >= 1 ? 3 : p >= 0.34 ? 2 : 1;
}
export const grownAt = (plot) => plot.planted - plot.bonus + lootById[plot.tree].grow;
export function ripe(plot, now) {
  if (stage(plot, now) < 3) return 0;
  const tree = lootById[plot.tree];
  return Math.min(GARDEN.maxRipe, Math.floor((now - Math.max(grownAt(plot), plot.harvested)) / tree.cycle));
}
export const boostMult = (plot, now) => (plot.boostEnd > now ? plot.boost : 1);
// Taler einer Ernte jetzt
export const harvestValue = (plot, now) => ripe(plot, now) * lootById[plot.tree].yield * boostMult(plot, now);

// ── Spielstand der Vorschau (geteilt mit der Rollen-Seite) ───────────────────

const KEY = 'coinmaster.garten';
export const START_TALER = 50000;

export function freshState() {
  return { taler: START_TALER, owned: false, beds: GARDEN.startBeds, plots: [], inv: {}, clock: { vt: 0, real: Date.now(), speed: 1 } };
}
export function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && typeof s.taler === 'number') return { ...freshState(), ...s };
  } catch {}
  return freshState();
}
export function saveState(s) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
}
// Gartenzeit in Sekunden (die Vorschau kann vorspulen)
export function now(s) {
  return s.clock.vt + ((Date.now() - s.clock.real) / 1000) * s.clock.speed;
}
export function setSpeed(s, speed) {
  s.clock = { vt: now(s), real: Date.now(), speed };
}
export function addLoot(s, items) {
  for (const it of items) s.inv[it.id] = (s.inv[it.id] || 0) + 1;
}

export const fmt = (n) => Math.round(n).toLocaleString('de-DE');
export function fmtTime(sec) {
  sec = Math.max(0, Math.ceil(sec));
  const join = (a, ua, b, ub) => (b ? `${a} ${ua} ${b} ${ub}` : `${a} ${ua}`);
  if (sec >= 3600) return join(Math.floor(sec / 3600), 'h', Math.floor((sec % 3600) / 60), 'min');
  if (sec >= 60) return join(Math.floor(sec / 60), 'min', sec % 60, 's');
  return `${sec} s`;
}
