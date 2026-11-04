// Spiel-Oberfläche: HUD über einer Spielwelt, dazu die Fenster Skilltree, Inventar, Shop und
// Einstellungen. „Münze suchen“ simuliert einen Fund in der Welt mit allen Skill-Effekten.
// HUD, Menü, Hinweise und die Fenster Shop, Inventar und Welten sind die Roblox-Oberfläche GameUI
// (robloxUi.js); die übrigen Fenster sind noch HTML und folgen in späteren Etappen.

import { COINS, tierById } from '../../muenzen/js/coins.js';
import { mutationById, weatherAt, weatherById, mutationForWeather, fmtMultiplier } from '../../muenzen/js/mutations.js';
import { loadState, saveState, loadSettings, xpForLevel, pointsForLevel, freePoints, findCoin, addXp, slots, coinValue, BOOSTS, boostActive, fmtNumber, currentWorld, ownsWorld, eggPrice, effect, canBuyWorld, canOpenPortal, canRebirth, rebirth, rebirthMultiplier } from './state.js';
import { createRobloxUi } from './robloxUi.js';
import { EGGS } from '../../eier/js/eggs.js';
import { auraById, bonusText } from '../../auren/js/auras.js';
import { planetById, worldById } from '../../welten/js/worlds.js';
import { createWorldBg } from './worldBg.js';
import { icon } from './icons.js';
import { skillPanel } from './panels/skilltree.js';
import { settingsPanel } from './panels/einstellungen.js';
import { ranglistenPanel, belohnungPanel, codesPanel } from './panels/spawn.js';
import { wetterPanel } from './panels/wetter.js';
import { newGarden, gardenAct, lootById } from '../../garten/js/garden.js';
import { rollById, openRoll } from '../../rollen/js/rolls.js';
import { Opener } from '../../rollen/js/open.js';

await Promise.race([document.fonts.load('48px "Marcellus SC"'), new Promise((r) => setTimeout(r, 2000))]).catch(() => {});

const state = loadState();
state.garden ||= newGarden();
let settings = loadSettings();
const $ = (id) => document.getElementById(id);
// Fenster in Roblox (GameUI) und noch als HTML
const RBX_WINDOWS = new Set(['shop', 'inventar', 'welten', 'garten']);
const PANELS = { skills: skillPanel, einstellungen: settingsPanel, ranglisten: ranglistenPanel, belohnung: belohnungPanel, codes: codesPanel, wetter: wetterPanel };

// ── Klang ────────────────────────────────────────────────────────────────────

let audio;
function sound(pitch = 1) {
  const vol = settings.sfx / 100;
  if (!vol) return;
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    const t = audio.currentTime;
    for (const [f, g, d] of [[2637, 0.14, 0.34], [3951, 0.07, 0.24]]) {
      const o = audio.createOscillator(), gain = audio.createGain();
      o.frequency.value = f * pitch;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(g * vol, t + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(gain).connect(audio.destination);
      o.start(t);
      o.stop(t + d + 0.02);
    }
  } catch {}
}

// ── HUD ──────────────────────────────────────────────────────────────────────

const save = () => saveState(state);

// Spielstand als Attribute an den Spieler in der Roblox-Oberfläche (wie sie das Spielskript setzen würde)
function renderHud() {
  if (!rui) return;
  const w = currentWorld(state), p = planetById[w.planet];
  const set = (k, v) => rui.setAttr(k, v);
  set('Taler', Math.floor(state.taler));
  set('Level', state.level);
  set('XP', Math.floor(state.xp));
  set('XPMax', xpForLevel(state.level));
  set('Points', Math.max(0, freePoints(state)));
  set('InventoryFull', state.inventory.length >= slots(state));
  set('WorldName', w.hub ? 'Spawn' : w.name);
  set('WorldPlanet', w.hub ? 'Treffpunkt' : p.name);
  set('FindHint', w.hub ? 'Im Spawn gibt es keine Münzen' : `Simuliert einen Fund in „${w.name}“`);
  set('Aura', state.aura || '');
  set('OwnedAuras', (state.auras || []).join(','));
  set('EggDiscount', effect(state, 'feilscher'));
  for (const e of EGGS) set('Egg_' + e.id, state.eggs[e.id] || 0);
  for (const b of BOOSTS) set('Boost_' + b.id, boostActive(state, b.id) ? Math.round(state.boosts[b.id] / 1000) : 0);
  // Inventar und Welten (in Roblox schreibt das der Server)
  set('Slots', slots(state));
  set('Coins', JSON.stringify(state.inventory.map((e) => ({ i: e.id + 1, m: e.mutation || undefined, b: e.bonus || 1, t: Math.round((e.at || 0) / 1000) }))));
  set('World', state.world);
  set('Worlds', state.worlds.join(','));
  set('Portals', state.portals.join(','));
  set('Rebirths', state.rebirths);
  set('Garden', JSON.stringify(state.garden));
}

// Nur Vorschau: ein Wetter für eine Minute erzwingen (Knopf im Wetter-Fenster)
let testWeather = null;
function currentWeather() {
  if (testWeather && Date.now() < testWeather.until) return { w: weatherById[testWeather.id], ends: testWeather.until };
  return weatherAt();
}
function renderWeather() {
  const { w, ends } = currentWeather();
  const m = mutationForWeather(w.id);
  rui?.setWeather(w.id, ends);
  $('world').dataset.weather = w.id;
  worldBg.setWeather(w.id);
  if (lastWeather && lastWeather !== w.id) announceWeather(w);
  void m;
  lastWeather = w.id;
}

// Große Ansage beim Wetterwechsel: WeatherFx.Announce wie im Spiel
let lastWeather = null;
function announceWeather(w) {
  rui?.announce(w.id);
  // kleine Fanfare: drei Töne
  [0, 140, 280].forEach((d, i) => setTimeout(() => sound(0.8 + i * 0.25), d));
  if (openId === 'wetter') renderPanel();
}
$('panel-close').innerHTML = icon('close', 20);

// ── Fenster ──────────────────────────────────────────────────────────────────

let openId = null, openTab = null, lastFocus = null;

const ctx = {
  state,
  get settings() {
    return settings;
  },
  save: () => {
    save();
    renderHud();
  },
  sound,
  toast,
  rerender: () => openId && renderPanel(),
  applySettings: () => {
    settings = loadSettings();
    applyWorldSettings();
    worldBg.refresh(currentWorld(state));
    renderHud();
  },
  teleport,
  flash,
  testWeather(id) {
    testWeather = { id, until: Date.now() + 60000 };
    renderWeather();
  },
};

function renderPanel() {
  const p = PANELS[openId];
  $('panel-ico').innerHTML = icon(p.icon, 26);
  $('panel-title').textContent = p.title;
  $('panel-sub').textContent = p.sub(ctx);
  $('panel-tools').replaceChildren(...(p.tools ? p.tools(ctx) : []));
  const tabs = $('panel-tabs');
  tabs.hidden = !p.tabs;
  if (p.tabs) {
    tabs.innerHTML = p.tabs.map((t) => `<button type="button" role="tab" data-tab="${t.id}" aria-selected="${t.id === openTab}">${t.label}</button>`).join('');
    tabs.querySelectorAll('button').forEach((b) =>
      b.addEventListener('click', () => {
        openTab = b.dataset.tab;
        renderPanel();
        tabs.querySelector(`[data-tab="${openTab}"]`)?.focus();
      }),
    );
  }
  const body = $('panel-body');
  const scroll = body.scrollTop;
  p.render(body, ctx, openTab);
  body.scrollTop = scroll;
}

function openPanel(id, tab = null) {
  if (RBX_WINDOWS.has(id)) {
    closePanel();
    if (rui?.isOpen(id) && !tab) rui.close(id);
    else rui?.open(id, tab);
    sound(0.95);
    return;
  }
  if (openId === id && !tab) return closePanel();
  lastFocus = document.activeElement;
  openId = id;
  openTab = tab ?? PANELS[id].defaultTab?.(ctx) ?? PANELS[id].tabs?.[0].id ?? null;
  $('panel-layer').hidden = false;
  $('panel').dataset.panel = id;
  rui?.close();
  renderPanel();
  $('panel-body').scrollTop = 0;
  $('panel-close').focus();
  sound(0.95);
}

function closePanel() {
  openId = null;
  $('panel-layer').hidden = true;
  lastFocus?.focus?.();
}

$('panel-close').addEventListener('click', closePanel);
$('panel-layer').addEventListener('click', (e) => e.target === $('panel-layer') && closePanel());

addEventListener('keydown', (e) => {
  if (e.target.closest('input, select, textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
  const key = e.key.toLowerCase();
  if (key === 'escape' && openId) return closePanel();
  if (key === 'escape') return rui?.close();
  const map = { w: 'welten', k: 'skills', i: 'inventar', b: 'shop', o: 'einstellungen', v: 'wetter' };
  if (map[key]) {
    e.preventDefault();
    openPanel(map[key]);
  } else if (key === 'f' && !openId) {
    e.preventDefault();
    find();
  }
});

// ── Funde ────────────────────────────────────────────────────────────────────

// Hinweise zeigt die Roblox-Oberfläche (GameUI.Toast)
function toast(text, color = '#d9b26a') {
  rui?.toast(text, color);
}

function find() {
  if (currentWorld(state).hub) {
    toast('Im Spawn gibt es keine Münzen. Öffne „Welten“ und reise durch ein Portal.', '#ffd76a');
    return;
  }
  if (state.inventory.length >= slots(state)) {
    toast('Inventar voll. Verkaufe Münzen oder lerne „Großer Beutel“.', '#ff8a96');
    return;
  }
  const r = findCoin(state, Math.random, currentWeather().w.id);
  const coin = COINS[r.id], tier = tierById[coin.tier], m = r.mutation && mutationById[r.mutation];
  const space = slots(state) - state.inventory.length;
  const n = Math.min(r.count, space);
  for (let k = 0; k < n; k++) state.inventory.push({ id: r.id, mutation: r.mutation, at: Date.now(), bonus: r.bonus });
  const before = state.level;
  const ups = addXp(state, r.xp);
  save();
  renderHud();
  sound(1 + tier.index * 0.05);

  const value = coinValue({ id: r.id, mutation: r.mutation, bonus: r.bonus });
  toast(`${coin.name}${n > 1 ? ' ×2' : ''} · ${tier.name}${m ? ` · ${m.name} ${fmtMultiplier(m)}` : ''}${r.upgraded ? ' · Goldene Hand!' : ''} · ${fmtNumber(value, true)} Taler · +${r.xp} EP`, m ? m.color : tier.color);
  if (openId) renderPanel();
  if (ups) levelUp(before, state.level);
}


// ── Level-Aufstieg ──
function levelUp(from, to) {
  let pts = 0;
  for (let n = from + 1; n <= to; n++) pts += pointsForLevel(n);
  $('levelup-level').textContent = `Level ${to}`;
  $('levelup-points').textContent = `+${pts} Skillpunkt${pts > 1 ? 'e' : ''}`;
  const el = $('levelup');
  el.hidden = false;
  el.classList.remove('is-in');
  void el.offsetWidth;
  el.classList.add('is-in');
  sound(1.4);
  clearTimeout(levelUp.t);
  levelUp.t = setTimeout(() => (el.hidden = true), 3800);
}
$('levelup-go').addEventListener('click', () => {
  $('levelup').hidden = true;
  openPanel('skills');
});

// ── Welt ─────────────────────────────────────────────────────────────────────

function applyWorldSettings() {
  $('world').classList.toggle('calm', settings.fewerParticles);
}

const worldBg = createWorldBg($('world'));

// ── Spawn: Bereiche im 3D-Hintergrund antippen ──
const AREA_ACTIONS = {
  eier: () => openPanel('shop', 'eier'),
  schluepfen: () => openPanel('inventar', 'eier'),
  boosts: () => openPanel('shop', 'boosts'),
  robux: () => openPanel('shop', 'robux'),
  vip: () => openPanel('shop', 'robux'),
  haustiere: () => openPanel('inventar', 'tiere'),
  verkaufen: () => openPanel('inventar', 'muenzen'),
  index: () => (location.href = '../muenzindex/'),
  ranglisten: () => openPanel('ranglisten'),
  belohnung: () => openPanel('belohnung', 'taeglich'),
  gluecksrad: () => openPanel('belohnung', 'rad'),
  gruppe: () => openPanel('belohnung', 'gruppe'),
  codes: () => openPanel('codes'),
  'portale-p1': () => openPanel('welten', 'p1'),
  'portale-p2': () => openPanel('welten', 'p2'),
  'portale-p3': () => openPanel('welten', 'p3'),
  quests: () => toast('Quest-Brett: Tagesaufgaben kommen mit einem späteren Update.', '#ffe7a8'),
  obby: () => toast('Obby-Turm: Im Roblox-Spiel springst du bis zur Spitze, oben wartet eine Truhe.', '#8cff7a'),
};
{
  const tip = $('area-tip');
  let last = 0;
  $('world').addEventListener('pointermove', (e) => {
    if (!currentWorld(state).hub || e.timeStamp - last < 60) return;
    last = e.timeStamp;
    const a = worldBg.pick(e.clientX, e.clientY);
    const ok = a && AREA_ACTIONS[a.id];
    $('world').style.cursor = ok ? 'pointer' : '';
    tip.hidden = !ok;
    if (ok) {
      const r = $('game').getBoundingClientRect();
      tip.textContent = a.name;
      tip.style.left = `${e.clientX - r.left + 14}px`;
      tip.style.top = `${e.clientY - r.top + 14}px`;
    }
  });
  $('world').addEventListener('pointerleave', () => (tip.hidden = true));
  $('world').addEventListener('click', (e) => {
    if (!currentWorld(state).hub) return;
    const a = worldBg.pick(e.clientX, e.clientY);
    if (a && AREA_ACTIONS[a.id]) {
      tip.hidden = true;
      sound(1.1);
      AREA_ACTIONS[a.id]();
    }
  });
  document.querySelectorAll('[data-spawn]').forEach((b) => b.addEventListener('click', () => AREA_ACTIONS[b.dataset.spawn]()));
  document.querySelectorAll('.sb-ico').forEach((el) => (el.innerHTML = icon(el.dataset.ico, 18)));
}

function renderWorldName() {
  const w = currentWorld(state);
  $('world').dataset.world = w.id;
  $('spawn-bar').hidden = !w.hub;
  renderHud();
}

// Kurzes Aufleuchten über der Welt (Teleport, Portal, Wiedergeburt)
function flash(color = '#ffffff') {
  if (settings.skipAnimations) return;
  const el = $('tp-flash');
  el.style.setProperty('--c', color);
  el.classList.remove('is-on');
  void el.offsetWidth;
  el.classList.add('is-on');
}

function teleport(id, quiet = false) {
  const w = worldById[id];
  if (!w || !ownsWorld(state, id)) return false;
  state.world = id;
  save();
  renderHud();
  closePanel();
  flash(w.accent);
  // Welt mitten im Aufleuchten tauschen
  setTimeout(() => {
    worldBg.set(w);
    renderWorldName();
  }, settings.skipAnimations ? 0 : 260);
  sound(0.8);
  if (!quiet) toast(`Teleportiert nach ${w.name}`, w.accent);
  return true;
}

// ── Roblox-Oberfläche ──
// Käufe aus dem Shop (in Roblox prüft das der Server, hier state.js)
function invoke(action, a, b) {
  const pay = (price) => {
    if (state.taler < price) return false;
    state.taler = Math.round((state.taler - price) * 100) / 100;
    return true;
  };
  const done = (text) => {
    save();
    renderHud();
    sound(1.1);
    return [true, text];
  };
  if (action === 'buyEgg') {
    const e = EGGS.find((x) => x.id === a);
    if (!e?.price || e.price.currency !== 'muenzen') return [false, 'Dieses Ei gibt es nicht für Taler'];
    if (!pay(eggPrice(state, e.price.amount))) return [false, 'Zu wenig Taler'];
    state.eggs[e.id] = (state.eggs[e.id] || 0) + 1;
    return done(`${e.name} gekauft`);
  }
  if (action === 'buyBoost') {
    const bo = BOOSTS.find((x) => x.id === a);
    if (!bo) return [false, 'Diesen Boost gibt es nicht'];
    if (!pay(bo.price)) return [false, 'Zu wenig Taler'];
    state.boosts[bo.id] = Math.max(Date.now(), state.boosts[bo.id] || 0) + bo.minutes * 60000;
    return done(`${bo.name} aktiv`);
  }
  if (action === 'aura') {
    const au = auraById[b];
    if (!au) return [false, 'Diese Aura gibt es nicht'];
    state.auras ||= [];
    if (a === 'unequip') {
      state.aura = null;
      return done('Aura abgelegt');
    }
    if (a === 'equip') {
      if (!state.auras.includes(au.id)) return [false, 'Noch nicht gekauft'];
      state.aura = au.id;
      return done(`${au.name} angelegt: ${bonusText(au)}`);
    }
    if (state.auras.includes(au.id)) return [false, 'Schon gekauft'];
    if (!pay(au.price)) return [false, 'Zu wenig Taler'];
    state.auras.push(au.id);
    state.aura = au.id;
    return done(`${au.name} gekauft und angelegt`);
  }
  if (action === 'robux') return [false, 'Robux-Käufe gibt es erst im Spiel'];
  // Münzbaumgarten und Münzrollen (in Roblox: GardenRemote, Regeln aus GardenData.Act)
  if (action === 'openRoll') {
    const roll = rollById[a];
    if (!roll) return [false, 'Diese Rolle gibt es nicht'];
    if (roll.price.currency !== 'taler') return [false, 'Robux-Käufe gibt es erst im Spiel'];
    if (!pay(roll.price.amount)) return [false, 'Zu wenig Taler'];
    const items = openRoll(roll);
    for (const it of items) state.garden.Inv[it.id] = (state.garden.Inv[it.id] || 0) + 1;
    save();
    renderHud();
    return [true, `${roll.name}: ${items[items.length - 1].name}!`, items.map((i) => i.id).join(',')];
  }
  const GARDEN_ACTIONS = { gardenBuy: 'buyGarden', gardenBed: 'buyBed', gardenPlant: 'plant', gardenUse: 'use', gardenHarvest: 'harvest', gardenDig: 'dig' };
  if (GARDEN_ACTIONS[action]) {
    const [ok, text, delta] = gardenAct(state.garden, GARDEN_ACTIONS[action], a, b, Date.now() / 1000, state.taler);
    if (!ok) return [false, text];
    state.taler = Math.round((state.taler + delta) * 100) / 100;
    return done(text);
  }
  // Inventar: Positionen in der Liste Coins (1-basiert)
  if (action === 'sell' || action === 'sellNormal') {
    const pick = new Set();
    if (action === 'sellNormal') state.inventory.forEach((e, i) => tierById[COINS[e.id].tier].index === 0 && !e.mutation && pick.add(i));
    else String(a).split(',').forEach((n) => pick.add(Number(n) - 1));
    let total = 0, count = 0;
    state.inventory = state.inventory.filter((e, i) => {
      if (!pick.has(i)) return true;
      total += coinValue(e);
      count++;
      return false;
    });
    if (!count) return [false, 'Keine Münze gewählt'];
    state.taler = Math.round((state.taler + total) * 100) / 100;
    return done(`${count} Münze${count > 1 ? 'n' : ''} für ${fmtNumber(Math.round(total * 100) / 100, settings.shortNumbers)} Taler verkauft`);
  }
  // Welten, Portale, Wiedergeburt
  if (action === 'buyWorld') {
    const w = worldById[a];
    const why = w ? canBuyWorld(state, a) : 'Diese Welt gibt es nicht';
    if (why) return [false, why];
    state.taler -= w.price;
    state.worlds.push(w.id);
    save();
    teleport(w.id, true);
    return [true, `${w.name} freigeschaltet!`];
  }
  if (action === 'teleport') {
    const w = worldById[a];
    if (!w || !ownsWorld(state, a)) return [false, 'Diese Welt hast du noch nicht'];
    teleport(a, true);
    return [true, `Teleportiert nach ${w.name}`];
  }
  if (action === 'portal') {
    const p = planetById[a];
    const why = p ? canOpenPortal(state, a) : 'Diesen Planeten gibt es nicht';
    if (why) return [false, why];
    state.portals.push(p.id);
    flash(p.color);
    sound(1.6);
    return done(`${p.portal.name} bereit: ${p.name} ist offen!`);
  }
  if (action === 'rebirth') {
    if (canRebirth(state)) return [false, 'Zu wenig Taler'];
    rebirth(state);
    flash('#ffd76a');
    sound(1.5);
    return done(`Wiedergeburt ${state.rebirths}! Münzwert jetzt ×${rebirthMultiplier(state.rebirths).toLocaleString('de-DE')}`);
  }
  // nur Vorschau: Taler verzehnfachen, um spätere Welten auszuprobieren
  if (action === 'testTaler') {
    state.taler = Math.max(1e6, Math.round(state.taler * 10));
    return done(`Test: ${fmtNumber(state.taler, true)} Taler`);
  }
  return [false, 'Unbekannt'];
}
// Geöffnete Münzrolle: dieselbe Öffnen-Ansicht wie auf der Rollen-Seite (RollFx)
let opener = null;
function playRoll(arg) {
  const [rollId, ids] = String(arg).split('|');
  const roll = rollById[rollId];
  const items = (ids || '').split(',').map((id) => lootById[id]).filter(Boolean);
  if (!roll || !items.length) return;
  opener ||= Opener.mount();
  opener.play(roll, items).then(() => rui?.open('garten', 'sachen'));
}
function uiAction(name, arg) {
  if (name === 'find') return find();
  if (name === 'playRoll') return playRoll(arg);
  if (name === 'gartenBesuchen') return toast('Im Spiel geht es jetzt zum Garten. Hier: Seite „Münzbaumgarten“ zum Ansehen in 3D.', '#6fbf4a');
  if (name === 'index') return (location.href = '../muenzindex/');
  if (PANELS[name] || RBX_WINDOWS.has(name)) openPanel(name);
}
let rui = null;
try {
  rui = await createRobloxUi($('game'), { onAction: uiAction, onInvoke: invoke, devTools: true });
  if (location.hash === '#debug') window.rui = rui;
} catch (e) {
  console.error('Roblox-Oberfläche konnte nicht starten', e);
}
{
  let last = performance.now();
  const tick = (now) => {
    rui?.frame(Math.min(0.1, (now - last) / 1000));
    last = now;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

applyWorldSettings();
worldBg.set(currentWorld(state));
renderWorldName();
renderHud();
// Link von der Weltkarte: spiel/#welten öffnet das Teleport-Menü
if (location.hash === '#welten') openPanel('welten');
// Link aus der Aura-Galerie: spiel/#shop-auras
if (location.hash === '#shop-auras') openPanel('shop', 'auras');
if (location.hash === '#shop') openPanel('shop');
renderWeather();
setInterval(() => {
  renderWeather();
  renderHud();
}, 1000);
