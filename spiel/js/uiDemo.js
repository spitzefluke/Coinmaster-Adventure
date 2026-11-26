// Spiel-Oberfläche als Vorschau für die Welten-Werkstatt (Ablauf „Spawn“): dieselbe Roblox-ScreenGui wie auf der
// Seite „Spiel“ (spiel/js/robloxUi.js), mit einem Beispiel-Spielstand. Zu jedem Spawn-Bereich öffnet sich das
// Fenster, das im Spiel an diesem Gebäude aufgeht. Käufe sind in der Vorschau aus.
//
//   const demo = await createUiDemo(host);  // host: Element, über dem die ScreenGui liegt
//   demo.show('eier');                      // Bereich-Id aus spawnTown.js (meta.areas)

import { createRobloxUi } from './robloxUi.js';
import { freshState, xpForLevel, freePoints, slots, coinValue, BOOSTS } from './state.js';
import { board } from './rewards.js';
import { EGGS } from '../../eier/js/eggs.js';
import { GEMS } from '../../edelsteine/js/gems.js';

// Bereich → Fenster und Reiter (wie AREA_ACTIONS in spiel/js/main.js); ohne Fenster: Hinweis wie im Spiel
export const AREA_UI = {
  eier: ['shop', 'eier'],
  boosts: ['shop', 'boosts'],
  robux: ['shop', 'robux'],
  vip: ['shop', 'robux'],
  taschen: ['shop', 'taschen'],
  haustiere: ['inventar', 'tiere'],
  schluepfen: ['inventar', 'eier'],
  verkaufen: ['inventar', 'muenzen'],
  ranglisten: ['ranglisten'],
  belohnung: ['belohnung', 'taeglich'],
  gruppe: ['belohnung', 'gruppe'],
  codes: ['codes'],
  'portale-p1': ['welten', 'p1'],
  'portale-p2': ['welten', 'p2'],
  'portale-p3': ['welten', 'p3'],
  'portale-p5': ['welten', 'p5'],
};
export const AREA_TOAST = {
  spawn: ['Marktplatz: Hier startest du. Oben siehst du Moneten, Level und die Menü-Knöpfe.', '#ffe7a8'],
  index: ['Münzindex: Im Spiel öffnet sich hier das Sammelbuch aller Münzen (eigene Seite „Münzindex“).', '#ffe7a8'],
  quests: ['Quest-Brett: Tagesaufgaben kommen mit einem späteren Update.', '#ffe7a8'],
  obby: ['Obby-Turm: Im Roblox-Spiel springst du bis zur Spitze, oben wartet eine Truhe.', '#8cff7a'],
  event: ['Event-Podest: Hier steht während eines Events der Event-Shop. Gerade ist kein Event.', '#ffb0d8'],
};

export async function createUiDemo(host) {
  const state = freshState();
  state.taler = 125000;
  state.staub = 4200;
  const rui = await createRobloxUi(host, {
    onAction: () => {},
    onInvoke: () => [false, 'In der Werkstatt-Vorschau sind Käufe aus'],
    onQuery: (kind, arg) => {
      if (kind !== 'board') return null;
      const { top, me, place } = board(state, arg);
      return { Rows: top.map((r) => ({ Name: r.name, Value: r.value, Me: !!r.me })), Place: place, Mine: me.value };
    },
  });
  const set = (k, v) => rui.setAttr(k, v);
  // Startwerte ohne Feier: sonst hält die UI das erste Level für einen Aufstieg (Konfetti)
  set('Set_skipAnimations', true);
  set('Moneten', state.taler);
  set('Diamantstaub', state.staub);
  set('GemBag', state.gemBag || 1);
  set('Pets', JSON.stringify((state.pets || []).map((p) => ({ U: p.u, Id: p.id, L: p.lvl, X: p.xp }))));
  set('Level', state.level);
  set('XP', Math.floor(state.xp));
  set('XPMax', xpForLevel(state.level));
  set('Points', Math.max(0, freePoints(state)));
  set('WorldName', 'Spawn');
  set('WorldPlanet', 'Treffpunkt');
  set('FindHint', 'Im Spawn gibt es keine Münzen');
  set('FindGems', false);
  set('Aura', state.aura || '');
  set('OwnedAuras', (state.auras || []).join(','));
  for (const e of EGGS) set('Egg_' + e.id, state.eggs[e.id] || 0);
  for (const b of BOOSTS) set('Boost_' + b.id, 0);
  set('Slots', slots(state));
  set('World', 'spawn');
  set('Worlds', state.worlds.join(','));
  set('Portals', state.portals.join(','));
  set('Rebirths', state.rebirths || 0);
  set('Supernovas', state.supernovas | 0);
  for (const g of GEMS) {
    set('Gem_' + g.id, state.gems?.[g.id]?.n || 0);
    set('GemValue_' + g.id, state.gems?.[g.id]?.v || 0);
  }
  set('Skills', Object.entries(state.skills).filter(([, n]) => n > 0).map(([id, n]) => `${id}:${n}`).join(','));
  set('DailyStreak', 2);
  set('Group', false);
  set('Codes', '');
  // Münzen als Stapel wie vom Server (gleiche Münze + gleiche Mutation = ein Stapel)
  const stacks = new Map();
  for (const e of state.inventory) {
    const k = `${e.id + 1}|${e.mutation || ''}`;
    const s = stacks.get(k) ?? { k, i: e.id + 1, m: e.mutation || undefined, n: 0, v: 0, t: 0 };
    s.n++;
    s.v = Math.round((s.v + coinValue(e)) * 100) / 100;
    s.t = Math.max(s.t, Math.round((e.at || 0) / 1000));
    stacks.set(k, s);
  }
  rui.inventory('full', [...stacks.values()]);

  let last = performance.now(), alive = true, frames = 0;
  const tick = (now) => {
    if (!alive) return;
    rui.frame(Math.min(0.1, (now - last) / 1000));
    if (++frames === 30) set('Set_skipAnimations', false); // erst wenn die Startwerte gezeichnet sind
    last = now;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  return {
    rui,
    show(areaId) {
      if (rui.isOpen()) rui.close();
      const w = AREA_UI[areaId];
      if (w) rui.open(w[0], w[1]);
      else if (AREA_TOAST[areaId]) rui.toast(...AREA_TOAST[areaId]);
    },
    stop() {
      alive = false;
    },
  };
}
