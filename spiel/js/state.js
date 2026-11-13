// Spielstand der UI-Vorschau: Moneten, Level, Skills, Inventar, Eier, Boosts, Einstellungen.
// Liegt im localStorage dieses Browsers. Ein neuer Spielstand startet mit einem Beispiel,
// damit alle Oberflächen gleich etwas zeigen.

import { COINS, TIERS, tierById, nextTier, coinWeight, coinBaseValue, rollCoin, glitchValue } from '../../muenzen/js/coins.js';
import { rollMutations, mutationsMultiplier, weathersAt } from '../../muenzen/js/mutations.js';
import { SKILLS, skillById } from './skills.js';
import { auraById } from '../../auren/js/auras.js';
import { PLANETS, planetById, worldById, playable, REBIRTH, rebirthMultiplier, SUPERNOVA, supernovaMultiplier, galaxyById, galaxyOfWorld, currencyOfWorld } from '../../welten/js/worlds.js';
import { GEMS, gemById, gemBaseValue, GEM_BAGS, gemBagByNr, TIERS as GEM_TIERS, tierById as gemTierById } from '../../edelsteine/js/gems.js';

export { loadSettings, saveSettings, DEFAULT_SETTINGS } from '../../js/settings.js';

const KEY = 'coinmaster.spiel.v1';

export const BASE_SLOTS = 30;

// ── Level ────────────────────────────────────────────────────────────────────

// Erfahrung, die man von Level n auf n+1 braucht
export const xpForLevel = (n) => Math.round(40 * Math.pow(n, 1.45));
// Jedes Level gibt 1 Skillpunkt, jedes fünfte einen zusätzlichen
export const pointsForLevel = (n) => (n % 5 === 0 ? 2 : 1);
export const totalPointsUpTo = (level) => {
  let p = 0;
  for (let n = 2; n <= level; n++) p += pointsForLevel(n);
  return p;
};

// ── Spielstand ───────────────────────────────────────────────────────────────

function sampleState() {
  const pick = (name, mutation = null) => {
    const id = COINS.findIndex((c) => c.name === name);
    return { id, mutation, at: Date.now() - Math.random() * 3600e3 };
  };
  return {
    taler: 1250,
    level: 4,
    xp: 60,
    skills: { kern: 1, glueckspilz: 1, beutel: 1 },
    inventory: [
      pick('Glutfunke'), pick('Glutfunke', 'nass'), pick('Rostanker'), pick('Würfelglück'),
      pick('Laternentaler'), pick('Sturmfalke'), pick('Mondsplitter', 'disco'), pick('Silberkompass'),
      pick('Kronjuwel'), pick('Ouroboros', 'gestein'),
    ],
    eggs: { normal: 2, wald: 1 },
    boosts: {},
    autoSell: [],
    world: 'spawn', // neue Spieler starten im Spawn
    worlds: ['normal', 'wald'],
    portals: ['p1'],
    rebirths: 0,
    supernovas: 0, // Supernova (Prestige): öffnet die nächste Galaxie
    staub: 0, // Diamantstaub: Währung aus Edelsteinen (Juwelnebel)
    pets: [], // geschlüpfte Haustiere: { u: Nummer, id: petId, lvl, xp }
    gemBag: 1, // Nr. der Edelstein-Tasche (Kapazität)
    gems: {}, // Edelsteine: { id: { n: Anzahl, v: Gesamtwert in Diamantstaub } }
    auras: [],
    aura: null, // angelegte Aura
    sample: true,
  };
}

export function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && typeof s.taler === 'number') return { ...sampleState(), ...s };
  } catch {}
  return sampleState();
}
export function saveState(s) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
}
export const freshState = sampleState;

// ── Skills ───────────────────────────────────────────────────────────────────

export const skillLevel = (s, id) => s.skills[id] | 0;
export const effect = (s, id) => skillLevel(s, id) * skillById[id].per;
export const spentPoints = (s) => SKILLS.reduce((sum, k) => sum + skillLevel(s, k.id) * k.cost, 0);
export const freePoints = (s) => totalPointsUpTo(s.level) + 1 - spentPoints(s); // +1: Startpunkt

// Kann diese Stufe gelernt werden? Gibt einen Grund zurück, wenn nicht.
export function canLearn(s, id) {
  const k = skillById[id];
  if (skillLevel(s, id) >= k.max) return 'Höchste Stufe erreicht';
  if (k.req && skillLevel(s, k.req) < 1) return `Erst „${skillById[k.req].name}“ lernen`;
  if (freePoints(s) < k.cost) return `Braucht ${k.cost} Skillpunkt${k.cost > 1 ? 'e' : ''}`;
  return null;
}

export const slots = (s) => BASE_SLOTS + effect(s, 'beutel');
export const eggPrice = (s, base) => Math.round(base * (1 - effect(s, 'feilscher') / 100));

// ── Welten, Portale, Wiedergeburt ────────────────────────────────────────────

export const currentWorld = (s) => worldById[s.world] || worldById.normal;
export const ownsWorld = (s, id) => id === 'spawn' || s.worlds.includes(id); // der Spawn ist immer offen
export const portalOpen = (s, planetId) => s.portals.includes(planetId);

// Gibt einen Grund zurück, wenn die Welt (noch) nicht gekauft werden kann
export function canBuyWorld(s, id) {
  const w = worldById[id];
  if (w.soon) return 'Coming soon';
  if (w.hub) return 'Immer offen';
  if (ownsWorld(s, id)) return 'Schon gekauft';
  if (!portalOpen(s, w.planet)) return `Erst das Portal öffnen`;
  const list = playable(w.planet), i = list.indexOf(w);
  if (i > 0 && !ownsWorld(s, list[i - 1].id)) return `Erst „${list[i - 1].name}“ kaufen`;
  if (wallet(s, currencyOfWorld(w).id) < w.price) return `Zu wenig ${currencyOfWorld(w).name}`;
  return null;
}
// Kontostand einer Währung ('moneten' oder 'staub')
export const wallet = (s, cur) => (cur === 'staub' ? s.staub || 0 : s.taler);
export function spend(s, cur, n) {
  if (cur === 'staub') s.staub = Math.round(((s.staub || 0) - n) * 100) / 100;
  else s.taler = Math.round((s.taler - n) * 100) / 100;
}

// Bedingungen für ein Portal: [Text, erfüllt?]
// Der vorige Planet zählt nur in derselben Galaxie; das erste Portal einer neuen Galaxie braucht die Supernova.
export function portalChecks(s, planetId) {
  const p = planetById[planetId];
  if (!p.portal) return [];
  const prev = PLANETS[PLANETS.indexOf(p) - 1];
  const checks = [];
  if (prev && prev.galaxy === p.galaxy) {
    const last = playable(prev.id).at(-1);
    checks.push([`„${last.name}“ auf ${prev.name} gekauft`, ownsWorld(s, last.id)]);
  }
  const sn = p.portal.supernovas || 0;
  if (sn) checks.push([`${sn > 1 ? sn + ' Supernovas' : 'Supernova'} (du hast ${s.supernovas | 0})`, (s.supernovas | 0) >= sn]);
  const n = p.portal.rebirths;
  if (n) checks.push([`${n} Wiedergeburt${n > 1 ? 'en' : ''} (du hast ${s.rebirths})`, s.rebirths >= n]);
  return checks;
}
export function canOpenPortal(s, planetId) {
  const p = planetById[planetId];
  if (p.soon) return 'Kommt mit einem späteren Update';
  if (portalOpen(s, planetId)) return 'Schon offen';
  const miss = portalChecks(s, planetId).find(([, ok]) => !ok);
  return miss ? `Fehlt: ${miss[0]}` : null;
}

export const rebirthCost = (s) => REBIRTH.cost(s.rebirths);
export const canRebirth = (s) => (s.taler >= rebirthCost(s) ? null : 'Zu wenig Moneten');
export function rebirth(s) {
  s.taler = 0;
  s.rebirths++;
}
export { rebirthMultiplier, supernovaMultiplier };

// Supernova: ab 100 Wiedergeburten, einmal pro weiterer Galaxie. Moneten und Wiedergeburten gehen auf 0.
export function canSupernova(s) {
  if ((s.supernovas | 0) >= SUPERNOVA.max) return 'Alle Galaxien sind schon offen';
  if (s.rebirths < SUPERNOVA.rebirths) return `Erst ${SUPERNOVA.rebirths} Wiedergeburten (du hast ${s.rebirths})`;
  return null;
}
export function supernova(s) {
  s.taler = 0;
  s.rebirths = 0;
  s.supernovas = (s.supernovas | 0) + 1;
}
// Galaxie, die die nächste Supernova öffnet
export const nextGalaxy = (s) => Object.values(galaxyById).find((g) => g.supernovas === (s.supernovas | 0) + 1) || null;
// Wert-Faktor aus Wiedergeburten und Supernovas zusammen
export const prestigeMultiplier = (s) => rebirthMultiplier(s.rebirths) * supernovaMultiplier(s.supernovas | 0);

// ── Boosts ───────────────────────────────────────────────────────────────────

export const BOOSTS = [
  { id: 'glueck', name: 'Glückstrank', minutes: 5, price: 600, text: 'Seltene Münzen werden doppelt so wahrscheinlich.', icon: 'clover' },
  { id: 'xp', name: 'Weisheitsrolle', minutes: 10, price: 350, text: 'Doppelte Erfahrung für jeden Fund.', icon: 'star' },
  { id: 'wetter', name: 'Wetterglocke', minutes: 5, price: 1200, text: 'Doppelte Mutationschance während des Wetters.', icon: 'cloud' },
];
// Robux-Angebote im Shop (im Spiel über Developer Products)
export const ROBUX = [
  { id: 'taler-s', name: 'Beutel Moneten', text: '5.000 Moneten', robux: 49 },
  { id: 'taler-m', name: 'Truhe Moneten', text: '30.000 Moneten', robux: 249, badge: 'Beliebt' },
  { id: 'release', name: 'Release Egg', text: 'Nur zum Release des Spiels', robux: 199, badge: 'Limitiert' },
  { id: 'vip', name: 'VIP-Pass', text: 'Doppelte Moneten aus Verkäufen, für immer', robux: 499 },
];

// Server-Boosts für alle (Admin Panel, in Roblox ServerBoost_<id> an ReplicatedStorage): Ende in ms
export const serverBoosts = {};
export const boostActive = (s, id) => (s.boosts[id] || 0) > Date.now() || (serverBoosts[id] || 0) > Date.now();

// ── Auras ────────────────────────────────────────────────────────────────────
// Die angelegte Aura gibt einen kleinen Bonus (Prozent) auf genau eine Sache.

export const equippedAura = (s) => (s.aura && s.auras.includes(s.aura) ? auraById[s.aura] : null);
export function auraBonus(s, type) {
  const a = equippedAura(s);
  return a && a.bonus.type === type ? a.bonus.value : 0;
}

// ── Münze finden ─────────────────────────────────────────────────────────────
// Simuliert einen Fund in der Welt, mit allen Skill- und Boost-Effekten.

// Wert einer Münze im Inventar: Nennwert (Premium: eigener Wert, Glitch: gewürfelt) × Mutationen × Fundbonus
export function coinValue(entry) {
  const coin = COINS[entry.id];
  const n = entry.glitch ?? coinBaseValue(coin);
  return Math.round(n * mutationsMultiplier(entry.mutation) * (entry.bonus || 1) * 100) / 100;
}

// tiers: Münzen (mit Premium) oder Edelsteine (gems.js, ohne Premium); index/rank kommen aus tierById
function rollTier(s, random, tiers = TIERS, byId = tierById) {
  // Glück verschiebt Chance von „Normal“ zu den seltenen Stufen
  const luck = effect(s, 'glueckspilz') / 100 + auraBonus(s, 'glueck') / 100 + (boostActive(s, 'glueck') ? 1 : 0) + currentWorld(s).luck;
  const weights = tiers.map((t, i) => (i === 0 ? t.chance : t.chance * (1 + luck)));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = random() * total;
  return byId[(tiers[weights.findIndex((w) => (r -= w) <= 0)] || tiers[0]).id];
}

// weatherIds: alle laufenden Wetter (Haupt- und Nebenwetter), je eins kann seine Mutation geben
export function findCoin(s, random = Math.random, weatherIds = weathersAt().map((e) => e.w.id)) {
  let tier = rollTier(s, random);
  // Goldene Hand: eine Stufe höher (nur auf der Leiter Normal … Unerreichbar)
  let upgraded = false;
  if (random() * 100 < effect(s, 'goldhand') && nextTier(tier.id)) {
    tier = nextTier(tier.id);
    upgraded = true;
  }
  // innerhalb der Stufe nach Gewicht (Premium-Münzen sind unterschiedlich häufig)
  const pool = COINS.map((c, i) => [c, i]).filter(([c]) => c.tier === tier.id);
  let w = random() * pool.reduce((a, [c]) => a + coinWeight(c), 0);
  let [coin, id] = pool.find(([c]) => (w -= coinWeight(c)) <= 0) || pool[0];
  // Mystery-Münze: verwandelt sich in eine zufällige andere Münze
  let mystery = false;
  if (coin.special === 'mystery') {
    mystery = true;
    coin = rollCoin(random, { keepMystery: false });
    id = COINS.indexOf(coin);
    tier = tierById[coin.tier];
  }
  const glitch = coin.special === 'glitch' ? glitchValue(random) : undefined;
  const bonus = effect(s, 'wetter') * (boostActive(s, 'wetter') ? 2 : 1);
  const mutation = rollMutations([].concat(weatherIds), random, bonus);
  const count = random() * 100 < effect(s, 'doppel') ? 2 : 1;
  const xp = Math.round((5 + tier.rank * tier.rank * 4) * count * (boostActive(s, 'xp') ? 2 : 1) * (1 + auraBonus(s, 'ep') / 100));
  // Wert: Skill „Wertvoller Fund“ × Aura × Welt × Wiedergeburten × Supernova
  const value = findBonus(s);
  return { id, mutation: mutation || null, count, xp, upgraded, mystery, glitch, bonus: Math.round(value * 1000) / 1000 };
}
const findBonus = (s) => (1 + effect(s, 'wert') / 100) * (1 + auraBonus(s, 'wert') / 100) * currentWorld(s).value * prestigeMultiplier(s);

// Findet man hier Edelsteine statt Münzen? (Juwelnebel)
export const findsGems = (s) => galaxyOfWorld(currentWorld(s)).find === 'gems';

// Edelstein finden: dieselben Stufen, dasselbe Glück und dieselben Skills wie bei Münzen (ohne Mutation)
export function findGem(s, random = Math.random) {
  let tier = rollTier(s, random, GEM_TIERS, gemTierById);
  let upgraded = false;
  if (random() * 100 < effect(s, 'goldhand') && tier.index < GEM_TIERS.length - 1) {
    tier = gemTierById[GEM_TIERS[tier.index + 1].id];
    upgraded = true;
  }
  const pool = GEMS.filter((g) => g.tier === tier.id);
  const gem = pool[Math.floor(random() * pool.length)];
  const count = random() * 100 < effect(s, 'doppel') ? 2 : 1;
  const xp = Math.round((5 + tier.index * tier.index * 4) * count * (boostActive(s, 'xp') ? 2 : 1) * (1 + auraBonus(s, 'ep') / 100));
  const value = Math.round(gemBaseValue(gem) * findBonus(s) * 100) / 100;
  return { gem: gem.id, count, xp, upgraded, value };
}
export function addGems(s, id, count, value) {
  s.gems ||= {};
  const g = (s.gems[id] ||= { n: 0, v: 0 });
  g.n += count;
  g.v = Math.round((g.v + value * count) * 100) / 100;
}
// Edelsteine verkaufen: count Stück (Durchschnittswert) oder alle; gibt [Anzahl, Diamantstaub] zurück
export function takeGems(s, id, count) {
  const g = s.gems?.[id];
  if (!g || !gemById[id] || g.n <= 0) return [0, 0];
  const n = Math.min(g.n, Math.max(1, Math.floor(count)));
  const value = n === g.n ? g.v : Math.round((g.v / g.n) * n * 100) / 100;
  g.n -= n;
  g.v = Math.round((g.v - value) * 100) / 100;
  if (g.n <= 0) delete s.gems[id];
  return [n, value];
}
export const gemCount = (s) => Object.values(s.gems || {}).reduce((a, g) => a + g.n, 0);
export const gemCapacity = (s) => gemBagByNr(s.gemBag || 1).capacity;
// Nächste Edelstein-Tasche kaufen (der Reihe nach, mit Diamantstaub)
export function canBuyGemBag(s, nr) {
  const bag = GEM_BAGS[nr - 1];
  if (!bag || nr !== (s.gemBag || 1) + 1) return 'Der Reihe nach kaufen';
  if ((s.staub || 0) < bag.price) return 'Zu wenig Diamantstaub';
  return null;
}

// Erfahrung gutschreiben; gibt die Zahl der neuen Level zurück
export function addXp(s, xp) {
  s.xp += xp;
  let ups = 0;
  while (s.xp >= xpForLevel(s.level)) {
    s.xp -= xpForLevel(s.level);
    s.level++;
    ups++;
  }
  return ups;
}

// ── Zahlen ───────────────────────────────────────────────────────────────────

export function fmtNumber(n, short) {
  if (!short || Math.abs(n) < 10000) return n.toLocaleString('de-DE', { maximumFractionDigits: 2 });
  const units = [[1e15, ' Brd.'], [1e12, ' Bio.'], [1e9, ' Mrd.'], [1e6, ' Mio.'], [1e3, 'K']];
  for (const [v, u] of units) if (Math.abs(n) >= v) return (n / v).toLocaleString('de-DE', { maximumFractionDigits: 1 }) + u;
  return String(n);
}
