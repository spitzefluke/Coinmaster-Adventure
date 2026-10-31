// Spielstand der UI-Vorschau: Taler, Level, Skills, Inventar, Eier, Boosts, Einstellungen.
// Liegt im localStorage dieses Browsers. Ein neuer Spielstand startet mit einem Beispiel,
// damit alle Oberflächen gleich etwas zeigen.

import { COINS, TIERS, tierById } from '../../muenzen/js/coins.js';
import { mutationById, rollMutation, weatherAt } from '../../muenzen/js/mutations.js';
import { SKILLS, skillById } from './skills.js';
import { PLANETS, planetById, worldById, playable, REBIRTH, rebirthMultiplier } from '../../welten/js/worlds.js';

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
      pick('Pilzpfennig'), pick('Pilzpfennig', 'nass'), pick('Schneckentaler'), pick('Käsetaler'),
      pick('Brotgroschen'), pick('Wolfssilber'), pick('Mondsichel', 'disco'), pick('Pinguin-Penny'),
      pick('Kronendukat'), pick('Drachenauge', 'gestein'),
    ],
    eggs: { normal: 2, wald: 1 },
    boosts: {},
    autoSell: [],
    world: 'normal',
    worlds: ['normal', 'wald'],
    portals: ['p1'],
    rebirths: 0,
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
export const ownsWorld = (s, id) => s.worlds.includes(id);
export const portalOpen = (s, planetId) => s.portals.includes(planetId);

// Gibt einen Grund zurück, wenn die Welt (noch) nicht gekauft werden kann
export function canBuyWorld(s, id) {
  const w = worldById[id];
  if (w.soon) return 'Coming soon';
  if (ownsWorld(s, id)) return 'Schon gekauft';
  if (!portalOpen(s, w.planet)) return `Erst das Portal öffnen`;
  const list = playable(w.planet), i = list.indexOf(w);
  if (i > 0 && !ownsWorld(s, list[i - 1].id)) return `Erst „${list[i - 1].name}“ kaufen`;
  if (s.taler < w.price) return 'Zu wenig Taler';
  return null;
}

// Bedingungen für ein Portal: [Text, erfüllt?]
export function portalChecks(s, planetId) {
  const p = planetById[planetId];
  if (!p.portal) return [];
  const prev = PLANETS[PLANETS.indexOf(p) - 1];
  const last = playable(prev.id).at(-1);
  const n = p.portal.rebirths;
  return [
    [`„${last.name}“ auf ${prev.name} gekauft`, ownsWorld(s, last.id)],
    [`${n} Wiedergeburt${n > 1 ? 'en' : ''} (du hast ${s.rebirths})`, s.rebirths >= n],
  ];
}
export function canOpenPortal(s, planetId) {
  const p = planetById[planetId];
  if (p.soon) return 'Kommt mit einem späteren Update';
  if (portalOpen(s, planetId)) return 'Schon offen';
  const miss = portalChecks(s, planetId).find(([, ok]) => !ok);
  return miss ? `Fehlt: ${miss[0]}` : null;
}

export const rebirthCost = (s) => REBIRTH.cost(s.rebirths);
export const canRebirth = (s) => (s.taler >= rebirthCost(s) ? null : 'Zu wenig Taler');
export function rebirth(s) {
  s.taler = 0;
  s.rebirths++;
}
export { rebirthMultiplier };

// ── Boosts ───────────────────────────────────────────────────────────────────

export const BOOSTS = [
  { id: 'glueck', name: 'Glückstrank', minutes: 5, price: 600, text: 'Seltene Münzen werden doppelt so wahrscheinlich.', icon: 'clover' },
  { id: 'xp', name: 'Weisheitsrolle', minutes: 10, price: 350, text: 'Doppelte Erfahrung für jeden Fund.', icon: 'star' },
  { id: 'wetter', name: 'Wetterglocke', minutes: 5, price: 1200, text: 'Doppelte Mutationschance während des Wetters.', icon: 'cloud' },
];
export const boostActive = (s, id) => (s.boosts[id] || 0) > Date.now();

// ── Münze finden ─────────────────────────────────────────────────────────────
// Simuliert einen Fund in der Welt, mit allen Skill- und Boost-Effekten.

export function coinValue(entry) {
  const coin = COINS[entry.id];
  const base = Number(tierById[coin.tier].value);
  const n = Number.isFinite(base) ? base : 1000000;
  const m = entry.mutation ? mutationById[entry.mutation].multiplier : 1;
  return Math.round(n * m * (entry.bonus || 1) * 100) / 100;
}

function rollTier(s, random) {
  // Glück verschiebt Chance von „Normal“ zu den seltenen Stufen
  const luck = effect(s, 'glueckspilz') / 100 + (boostActive(s, 'glueck') ? 1 : 0) + currentWorld(s).luck;
  const weights = TIERS.map((t, i) => (i === 0 ? t.chance : t.chance * (1 + luck)));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = random() * total;
  return TIERS[weights.findIndex((w) => (r -= w) <= 0)] || TIERS[0];
}

export function findCoin(s, random = Math.random) {
  let tier = rollTier(s, random);
  // Goldene Hand: eine Stufe höher
  let upgraded = false;
  if (random() * 100 < effect(s, 'goldhand') && tier.index < TIERS.length - 1) {
    tier = tierById[TIERS[TIERS.findIndex((t) => t.id === tier.id) + 1].id];
    upgraded = true;
  }
  const pool = COINS.map((c, i) => [c, i]).filter(([c]) => c.tier === tier.id);
  const [, id] = pool[Math.floor(random() * pool.length)];
  const bonus = effect(s, 'wetter') * (boostActive(s, 'wetter') ? 2 : 1);
  const mutation = rollMutation(weatherAt().w.id, random, bonus);
  const count = random() * 100 < effect(s, 'doppel') ? 2 : 1;
  const tierIndex = TIERS.findIndex((t) => t.id === tier.id);
  const xp = (5 + tierIndex * tierIndex * 4) * count * (boostActive(s, 'xp') ? 2 : 1);
  // Wert: Skill „Wertvoller Fund“ × Welt × Wiedergeburten
  const value = (1 + effect(s, 'wert') / 100) * currentWorld(s).value * rebirthMultiplier(s.rebirths);
  return { id, mutation: mutation?.id || null, count, xp, upgraded, bonus: Math.round(value * 1000) / 1000 };
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
  const units = [[1e12, ' Bio.'], [1e9, ' Mrd.'], [1e6, ' Mio.'], [1e3, 'K']];
  for (const [v, u] of units) if (Math.abs(n) >= v) return (n / v).toLocaleString('de-DE', { maximumFractionDigits: 1 }) + u;
  return String(n);
}
