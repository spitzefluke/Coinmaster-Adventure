// Spawn-Funktionen: tägliche Belohnung mit Serie, Glücksrad, Gruppen-Belohnung, Codes, Ranglisten.
// Alles läuft auf dem Spielstand aus state.js; Werte sind Vorschläge.

import { BOOSTS } from './state.js';

// Kalendertag als Schlüssel (lokale Zeit)
export const dayKey = (t = Date.now()) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};
const yesterday = (t = Date.now()) => dayKey(t - 86400000);
export const msToMidnight = (t = Date.now()) => {
  const d = new Date(t);
  d.setHours(24, 0, 0, 0);
  return d - t;
};

// Gewinn anwenden: { taler } | { boost, minutes } | { egg } | { xp }
export function grant(s, prize) {
  if (prize.taler) s.taler += prize.taler;
  if (prize.boost) s.boosts[prize.boost] = Math.max(Date.now(), s.boosts[prize.boost] || 0) + prize.minutes * 60000;
  if (prize.egg) s.eggs[prize.egg] = (s.eggs[prize.egg] || 0) + 1;
  if (prize.xp) s.xp += prize.xp;
}
const boostName = (id) => BOOSTS.find((b) => b.id === id)?.name ?? id;
export const prizeText = (p) =>
  p.taler ? `${p.taler.toLocaleString('de-DE')} Taler` : p.boost ? `${boostName(p.boost)} (${p.minutes} Min.)` : p.egg ? `${EGG_NAMES[p.egg]}` : p.xp ? `${p.xp} EP` : '–';
const EGG_NAMES = { normal: 'Normal Egg', wald: 'Wald Egg', eis: 'Eis Egg', engel: 'Engels Egg', galaxie: 'Galaxie Egg', admin: 'Admin Egg', release: 'Release Egg' };

// ── Tägliche Belohnung: sieben Tage, danach von vorn ──
export const DAILY = [
  { taler: 500 },
  { taler: 1000 },
  { boost: 'glueck', minutes: 5 },
  { taler: 2500 },
  { egg: 'normal' },
  { taler: 5000 },
  { egg: 'wald' },
];
export function dailyStatus(s) {
  const d = s.daily ?? { lastDay: null, streak: 0 };
  const claimedToday = d.lastDay === dayKey();
  const keeps = d.lastDay === yesterday() || claimedToday;
  const streak = keeps ? d.streak : 0; // Tage in Folge bisher
  const next = claimedToday ? streak % 7 : streak % 7; // Index des nächsten Geschenks
  return { claimedToday, streak, next };
}
export function claimDaily(s) {
  const st = dailyStatus(s);
  if (st.claimedToday) return null;
  const prize = DAILY[st.next];
  grant(s, prize);
  s.daily = { lastDay: dayKey(), streak: st.streak + 1 };
  return { prize, day: st.next + 1 };
}

// ── Glücksrad: einmal am Tag gratis ──
export const WHEEL = [
  { taler: 250, w: 24, color: '#ff5aa5' },
  { taler: 1000, w: 18, color: '#ffe07a' },
  { xp: 150, w: 16, color: '#5ad1ff' },
  { boost: 'xp', minutes: 10, w: 12, color: '#8cff7a' },
  { taler: 5000, w: 10, color: '#c48bff' },
  { boost: 'glueck', minutes: 5, w: 10, color: '#ff8a3d' },
  { egg: 'eis', w: 7, color: '#ffffff' },
  { taler: 25000, w: 3, color: '#ff4058' },
];
export const wheelReady = (s) => (s.wheel?.lastDay ?? null) !== dayKey();
export function spinWheel(s, random = Math.random) {
  if (!wheelReady(s)) return null;
  const total = WHEEL.reduce((a, p) => a + p.w, 0);
  let r = random() * total, i = 0;
  while ((r -= WHEEL[i].w) > 0) i++;
  grant(s, WHEEL[i]);
  s.wheel = { lastDay: dayKey() };
  return { index: i, prize: WHEEL[i] };
}

// ── Gruppe: einmaliger Bonus ──
export const GROUP_BONUS = { taler: 5000 };
export function joinGroup(s) {
  if (s.group) return null;
  s.group = { joined: Date.now() };
  grant(s, GROUP_BONUS);
  return GROUP_BONUS;
}

// ── Codes (Groß-/Kleinschreibung egal, jeder Code einmal) ──
export const CODES = {
  COINMASTER: { taler: 5000 },
  SPAWN: { taler: 2500 },
  GLUECK: { boost: 'glueck', minutes: 10 },
  RELEASE: { egg: 'release' },
  DANKE: { xp: 500 },
};
export function redeem(s, input) {
  const code = String(input).trim().toUpperCase().replace(/Ü/g, 'UE');
  if (!code) return { error: 'Bitte einen Code eingeben' };
  const prize = CODES[code];
  if (!prize) return { error: 'Diesen Code gibt es nicht' };
  s.codes ??= [];
  if (s.codes.includes(code)) return { error: 'Diesen Code hast du schon eingelöst' };
  s.codes.push(code);
  grant(s, prize);
  return { prize, code };
}

// ── Ranglisten ──
const RIVALS = ['MünzMax', 'GlitzerGrete', 'TalerTom', 'Schatzsucherin', 'KometenKai', 'PerlenPia', 'GoldGustav', 'DrachenDana', 'NebelNico', 'LavaLuis', 'EisElla', 'PixelPaul', 'RubinRita', 'SternSami', 'KobaltKim'];
export const BOARDS = [
  { id: 'taler', label: 'Taler', color: '#ffd76a', top: 9.8e9, k: 0.62, mine: (s) => Math.floor(s.taler) },
  { id: 'coins', label: 'Münzen', color: '#7ad0ff', top: 4800, k: 0.82, mine: (s) => s.inventory.length + (s.sold ?? 0) },
  { id: 'rebirths', label: 'Wiedergeburten', color: '#ff8ac8', top: 42, k: 0.86, mine: (s) => s.rebirths | 0 },
  { id: 'level', label: 'Level', color: '#8cff7a', top: 180, k: 0.9, mine: (s) => s.level },
];
// Liste mit Beispiel-Spielern und dir; dein Platz wird auch außerhalb der Top 10 berechnet
export function board(s, id) {
  const b = BOARDS.find((x) => x.id === id) ?? BOARDS[0];
  let seed = id.length * 97;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const rows = RIVALS.map((n, i) => ({ name: n, value: Math.round(b.top * Math.pow(b.k, i) * (0.92 + rnd() * 0.16)) }));
  const me = { name: 'Du', value: b.mine(s), me: true };
  // geschätzter Platz in der ganzen Rangliste: die Werte fallen exponentiell
  const all = [...rows, me].sort((a, c) => c.value - a.value);
  let place = all.indexOf(me) + 1;
  if (place > rows.length) place = Math.max(place, Math.round(rows.length + Math.log(Math.max(1, rows.at(-1).value) / Math.max(1, me.value)) / -Math.log(b.k)) + 1);
  return { board: b, top: all.slice(0, 10), me, place };
}
