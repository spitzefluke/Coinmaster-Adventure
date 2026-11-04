// Münzrollen: Papierrollen voller Münzen. Aufreißen, und die Münzen purzeln heraus.
//
// coins     wie viele Münzen in der Rolle stecken
// luck      Glück: hebt seltene Stufen an. Gewicht einer Stufe = Drop-Chance × luck ^ (Stufe / 9),
//           die seltenste Stufe bekommt also den vollen Faktor, Normal keinen.
// guarantee die letzte Münze ist mindestens diese Stufe (null = keine Garantie)
// rank      0–4 bestimmt, wie lang und groß das Aufreißen ist
// Preise sind Vorschläge. price: null = nicht kaufbar.
//
// Dieselbe Rechnung steht in Luau in RollData (roblox/js/rollLuau.js). Im Spiel würfelt der Server.

import { TIERS, COINS } from '../../muenzen/js/coins.js';

export const ROLLS = [
  {
    id: 'kupfer',
    name: 'Kupferrolle',
    rank: 0,
    rankName: 'Normal',
    coins: 3,
    luck: 1,
    guarantee: null,
    paper: '#b9773f',
    band: '#6e3518',
    metal: '#d4834a',
    glow: '#ffb070',
    price: { amount: 500, currency: 'taler' },
    availability: 'Immer im Shop',
    text: 'Braunes Packpapier, an den Enden eingedreht. Drei Münzen, ganz ohne Versprechen.',
  },
  {
    id: 'silber',
    name: 'Silberrolle',
    rank: 1,
    rankName: 'Selten',
    coins: 4,
    luck: 1.6,
    guarantee: 'selten',
    paper: '#d6dbe4',
    band: '#3f5b8c',
    metal: '#c9d2de',
    glow: '#bcd8ff',
    price: { amount: 5000, currency: 'taler' },
    availability: 'Immer im Shop',
    text: 'Wie frisch von der Bank, mit blauer Banderole. Mindestens eine seltene Münze steckt drin.',
  },
  {
    id: 'gold',
    name: 'Goldrolle',
    rank: 2,
    rankName: 'Episch',
    coins: 5,
    luck: 2.5,
    guarantee: 'sehr-selten',
    paper: '#f2c443',
    band: '#b0241c',
    metal: '#ffd45a',
    glow: '#ffe07a',
    price: { amount: 40000, currency: 'taler' },
    availability: 'Immer im Shop',
    text: 'Goldpapier mit rotem Siegel. Sie klimpert schwerer, als sie aussieht.',
  },
  {
    id: 'juwel',
    name: 'Juwelenrolle',
    rank: 3,
    rankName: 'Mystisch',
    coins: 6,
    luck: 4,
    guarantee: 'episch',
    paper: '#5b2aa6',
    band: '#ff5fd2',
    metal: '#ffd27a',
    glow: '#e59bff',
    price: { amount: 250000, currency: 'taler' },
    availability: 'Immer im Shop',
    text: 'Samtiges Violett, besetzt mit Edelsteinen. Ganz unten wartet mindestens eine epische Münze.',
  },
  {
    id: 'stern',
    name: 'Sternenrolle',
    alias: 'Robux-Rolle',
    rank: 4,
    rankName: 'Limitiert',
    coins: 8,
    luck: 6,
    guarantee: 'legendaer',
    paper: '#1d1747',
    band: '#ffc93c',
    metal: '#ffe9a0',
    glow: '#ffe07a',
    price: { amount: 149, currency: 'robux' },
    availability: 'Nur für Robux',
    text: 'Eingewickelt in den Nachthimmel und von Sternen umkreist. Acht Münzen, die letzte mindestens legendär.',
  },
];

export const rollById = Object.fromEntries(ROLLS.map((r) => [r.id, r]));
const tierIndex = Object.fromEntries(TIERS.map((t, i) => [t.id, i]));

export const fmtPrice = (p) =>
  !p ? 'Nicht kaufbar' : p.currency === 'robux' ? `R$ ${p.amount.toLocaleString('de-DE')}` : `${p.amount.toLocaleString('de-DE')} Taler`;

// Chance je Stufe (in %) für eine Münze aus dieser Rolle; minIndex schneidet Stufen darunter ab
export function tierChances(roll, minIndex = 0) {
  const n = TIERS.length - 1;
  const w = TIERS.map((t, i) => (i < minIndex ? 0 : t.chance * roll.luck ** (i / n)));
  const sum = w.reduce((a, b) => a + b, 0);
  return w.map((x) => (x / sum) * 100);
}

function pickTier(chances, random) {
  let r = random() * 100;
  for (let i = 0; i < chances.length; i++) {
    r -= chances[i];
    if (r <= 0 && chances[i] > 0) return i;
  }
  return chances.findLastIndex((c) => c > 0);
}

// Öffnet eine Rolle: Liste von Münzen (Objekte aus COINS), die letzte erfüllt die Garantie
export function openRoll(roll, random = Math.random) {
  const free = tierChances(roll);
  const min = roll.guarantee ? tierIndex[roll.guarantee] : 0;
  const sure = tierChances(roll, min);
  const out = [];
  for (let k = 0; k < roll.coins; k++) {
    const last = k === roll.coins - 1;
    // die Garantie greift nur, wenn vorher noch keine Münze so selten war
    const reached = out.some((c) => tierIndex[c.tier] >= min);
    const tier = TIERS[pickTier(last && !reached ? sure : free, random)];
    const pool = COINS.filter((c) => c.tier === tier.id);
    out.push(pool[Math.floor(random() * pool.length)]);
  }
  // seltenste Münze zuletzt, damit die Spannung steigt
  return out.sort((a, b) => tierIndex[a.tier] - tierIndex[b.tier]);
}
