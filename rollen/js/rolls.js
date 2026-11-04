// Münzrollen: Papierrollen voller Gartenschätze für den Münzbaumgarten. Aufreißen, und heraus
// springen Münzbäume, Gießkannen, Dünger und mehr.
//
// items     wie viele Sachen in der Rolle stecken
// luck      Glück: hebt seltene Stufen an. Gewicht einer Stufe = Chance × luck ^ (Stufe / 5),
//           die seltenste Stufe (Göttlich) bekommt also den vollen Faktor, Gewöhnlich keinen.
// guarantee die letzte Sache ist mindestens diese Seltenheit (null = keine Garantie)
// rank      0–4 bestimmt, wie lang und groß das Aufreißen ist
// Preise sind Vorschläge. price: null = nicht kaufbar.
//
// Was drin sein kann, steht in garten/js/garden.js (Bäume und Werkzeug). Dieselbe Rechnung steht
// in Luau in RollData (roblox/js/rollLuau.js). Im Spiel würfelt der Server.

import { RARITIES, LOOT, rarityById } from '../../garten/js/garden.js';

export const ROLLS = [
  {
    id: 'kupfer',
    name: 'Kupferrolle',
    rank: 0,
    rankName: 'Normal',
    items: 3,
    luck: 1,
    guarantee: null,
    paper: '#b9773f',
    band: '#6e3518',
    metal: '#d4834a',
    glow: '#ffb070',
    price: { amount: 500, currency: 'taler' },
    availability: 'Immer im Shop',
    text: 'Braunes Packpapier, an den Enden eingedreht. Drei Sachen für den Garten, ganz ohne Versprechen.',
  },
  {
    id: 'silber',
    name: 'Silberrolle',
    rank: 1,
    rankName: 'Selten',
    items: 4,
    luck: 1.6,
    guarantee: 'selten',
    paper: '#d6dbe4',
    band: '#3f5b8c',
    metal: '#c9d2de',
    glow: '#bcd8ff',
    price: { amount: 5000, currency: 'taler' },
    availability: 'Immer im Shop',
    text: 'Wie frisch von der Bank, mit blauer Banderole. Mindestens eine seltene Sache steckt drin.',
  },
  {
    id: 'gold',
    name: 'Goldrolle',
    rank: 2,
    rankName: 'Episch',
    items: 5,
    luck: 2.5,
    guarantee: 'episch',
    paper: '#f2c443',
    band: '#b0241c',
    metal: '#ffd45a',
    glow: '#ffe07a',
    price: { amount: 40000, currency: 'taler' },
    availability: 'Immer im Shop',
    text: 'Goldpapier mit rotem Siegel. Raschelt nach Laub und klimpert nach Gold. Mindestens eine epische Sache.',
  },
  {
    id: 'juwel',
    name: 'Juwelenrolle',
    rank: 3,
    rankName: 'Mystisch',
    items: 6,
    luck: 4,
    guarantee: 'legendaer',
    paper: '#5b2aa6',
    band: '#ff5fd2',
    metal: '#ffd27a',
    glow: '#e59bff',
    price: { amount: 250000, currency: 'taler' },
    availability: 'Immer im Shop',
    text: 'Samtiges Violett, besetzt mit Edelsteinen. Ganz unten wartet mindestens etwas Legendäres.',
  },
  {
    id: 'stern',
    name: 'Sternenrolle',
    alias: 'Robux-Rolle',
    rank: 4,
    rankName: 'Limitiert',
    items: 8,
    luck: 6,
    guarantee: 'legendaer',
    paper: '#1d1747',
    band: '#ffc93c',
    metal: '#ffe9a0',
    glow: '#ffe07a',
    price: { amount: 149, currency: 'robux' },
    availability: 'Nur für Robux',
    text: 'Eingewickelt in den Nachthimmel und von Sternen umkreist. Acht Sachen, die letzte mindestens legendär.',
  },
];

export const rollById = Object.fromEntries(ROLLS.map((r) => [r.id, r]));

export const fmtPrice = (p) =>
  !p ? 'Nicht kaufbar' : p.currency === 'robux' ? `R$ ${p.amount.toLocaleString('de-DE')}` : `${p.amount.toLocaleString('de-DE')} Taler`;

// Chance je Seltenheit (in %) für eine Sache aus dieser Rolle; minIndex schneidet darunter ab
export function tierChances(roll, minIndex = 0) {
  const n = RARITIES.length - 1;
  const w = RARITIES.map((t, i) => (i < minIndex ? 0 : t.chance * roll.luck ** (i / n)));
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

// Öffnet eine Rolle: Liste von Sachen (Einträge aus LOOT), seltenste zuletzt
export function openRoll(roll, random = Math.random) {
  const free = tierChances(roll);
  const min = roll.guarantee ? rarityById[roll.guarantee].index : 0;
  const sure = tierChances(roll, min);
  const out = [];
  for (let k = 0; k < roll.items; k++) {
    const last = k === roll.items - 1;
    // die Garantie greift nur, wenn vorher noch nichts so Seltenes kam
    const reached = out.some((c) => rarityById[c.rarity].index >= min);
    const tier = RARITIES[pickTier(last && !reached ? sure : free, random)];
    const pool = LOOT.filter((c) => c.rarity === tier.id);
    out.push(pool[Math.floor(random() * pool.length)]);
  }
  return out.sort((a, b) => rarityById[a.rarity].index - rarityById[b.rarity].index);
}
