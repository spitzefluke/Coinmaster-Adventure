// Spiel-Oberfläche: HUD über einer Spielwelt mit allen Fenstern. „Münze suchen“ simuliert einen Fund
// in der Welt mit allen Skill-Effekten. HUD, Menü, Hinweise und alle Fenster sind die Roblox-Oberfläche
// GameUI (robloxUi.js); diese Seite spielt den Server: Spielstand (state.js) als Attribute, Aktionen als
// Rückrufe (invoke), Daten für Fenster als Abfragen (query).

import { COINS, tierById } from '../../muenzen/js/coins.js';
import { weatherAt, weatherById, mutationForWeather, forecast, nextWeather, WEATHER, WEATHER_WARN } from '../../muenzen/js/mutations.js';
import { loadState, saveState, loadSettings, saveSettings, DEFAULT_SETTINGS, freshState, xpForLevel, pointsForLevel, freePoints, findCoin, addXp, slots, coinValue, BOOSTS, boostActive, serverBoosts, fmtNumber, currentWorld, ownsWorld, eggPrice, effect, canBuyWorld, canOpenPortal, canRebirth, rebirth, rebirthMultiplier, canLearn, skillLevel, canSupernova, supernova, supernovaMultiplier, nextGalaxy, findsGems, findGem, addGems, takeGems, gemCount } from './state.js';
import { GEMS, gemById } from '../../edelsteine/js/gems.js';
import { skillById } from './skills.js';
import { claimDaily, spinWheel, joinGroup, redeem, prizeText, board, CODES } from './rewards.js';
import { createRobloxUi } from './robloxUi.js';
import { EGGS } from '../../eier/js/eggs.js';
import { auraById, bonusText } from '../../auren/js/auras.js';
import { planetById, worldById, PLANETS, WORLDS, SUPERNOVA } from '../../welten/js/worlds.js';
import { ADMIN } from './admin.js';
import { createWorldBg } from './worldBg.js';
import { newGarden, gardenAct, lootById, lootName } from '../../garten/js/garden.js';
import { rollById, openRoll } from '../../rollen/js/rolls.js';
import { Opener } from '../../rollen/js/open.js';
import { icon } from './icons.js';

await Promise.race([document.fonts.load('48px "Marcellus SC"'), new Promise((r) => setTimeout(r, 2000))]).catch(() => {});

const state = loadState();
state.garden ||= newGarden();
let settings = loadSettings();
const $ = (id) => document.getElementById(id);
// Fenster der Roblox-Oberfläche (GameUI)
const WINDOWS = new Set(['shop', 'inventar', 'welten', 'skills', 'einstellungen', 'wetter', 'belohnung', 'codes', 'ranglisten', 'garten', 'admin']);

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
  set('FindHint', w.hub ? 'Im Spawn gibt es keine Münzen' : `Simuliert einen Fund in „${w.name}“${findsGems(state) ? ' (Edelsteine)' : ''}`);
  set('FindGems', !w.hub && findsGems(state));
  set('Aura', state.aura || '');
  set('OwnedAuras', (state.auras || []).join(','));
  set('EggDiscount', effect(state, 'feilscher'));
  for (const e of EGGS) set('Egg_' + e.id, state.eggs[e.id] || 0);
  for (const b of BOOSTS) set('Boost_' + b.id, boostActive(state, b.id) ? Math.round(state.boosts[b.id] / 1000) : 0);
  // Inventar und Welten (in Roblox schreibt das der Server)
  set('Slots', slots(state));
  sendInventory();
  set('World', state.world);
  set('Worlds', state.worlds.join(','));
  set('Portals', state.portals.join(','));
  set('Rebirths', state.rebirths);
  set('Supernovas', state.supernovas | 0);
  // Edelsteine: Anzahl und Gesamtwert je Stein (in Roblox schreibt das der Server)
  for (const g of GEMS) {
    set('Gem_' + g.id, state.gems?.[g.id]?.n || 0);
    set('GemValue_' + g.id, state.gems?.[g.id]?.v || 0);
  }
  set('Garden', JSON.stringify(state.garden));
  // Skills, Belohnungen, Einstellungen
  set('Skills', Object.entries(state.skills).filter(([, n]) => n > 0).map(([id, n]) => `${id}:${n}`).join(','));
  set('DailyDay', state.daily?.lastDay ?? '');
  set('DailyStreak', state.daily?.streak ?? 0);
  set('WheelDay', state.wheel?.lastDay ?? '');
  set('Group', !!state.group);
  set('Codes', (state.codes ?? []).join(','));
  for (const [k, v] of Object.entries(settings)) set('Set_' + k, v);
  // Admin Panel: in der Vorschau bist du Admin (in Roblox setzt das der Server, Skript CoinmasterAdmin)
  set('Admin', true);
  const now = Date.now();
  for (const b of BOOSTS) rui.setRSAttr('ServerBoost_' + b.id, serverBoosts[b.id] > now ? Math.round(serverBoosts[b.id] / 1000) : null);
}

// Münzen als Stapel wie im Roblox-Spielstand (PlayerData): gleiche Münze + gleiche Mutation = ein Stapel.
// Beim ersten Mal alles, danach nur geänderte Stapel (wie das RemoteEvent InventoryEvent)
const coinKey = (e) => `${e.id + 1}|${e.mutation || ''}`;
function stacks() {
  const out = new Map();
  for (const e of state.inventory) {
    const k = coinKey(e);
    const s = out.get(k) ?? { k, i: e.id + 1, m: e.mutation || undefined, n: 0, v: 0, t: 0 };
    s.n++;
    s.v = Math.round((s.v + coinValue(e)) * 100) / 100;
    s.t = Math.max(s.t, Math.round((e.at || 0) / 1000));
    out.set(k, s);
  }
  return out;
}
let sentStacks = null;
function sendInventory() {
  const now = stacks();
  if (!sentStacks) rui.inventory('full', [...now.values()]);
  else {
    for (const [k, s] of now) if (JSON.stringify(s) !== JSON.stringify(sentStacks.get(k))) rui.inventory('set', k, s);
    for (const k of sentStacks.keys()) if (!now.has(k)) rui.inventory('set', k, null);
  }
  sentStacks = now;
}

// Nur Vorschau: ein Wetter für eine Minute erzwingen (Knopf im Wetter-Fenster)
let testWeather = null;
function currentWeather() {
  if (testWeather && Date.now() < testWeather.until) return { w: weatherById[testWeather.id], starts: testWeather.until - testWeather.ms, ends: testWeather.until };
  return weatherAt();
}
// Nächstes Wetter (für Vorwarnung und HUD); im Test kommt erst danach wieder der Zeitplan
function upcoming() {
  return nextWeather(testWeather && Date.now() < testWeather.until ? testWeather.until : Date.now());
}
let warned = 0;
function renderWeather() {
  const { w, ends } = currentWeather();
  // vom Admin erzwungenes Wetter (in Roblox: AdminWeather, AdminWeatherEnds an ReplicatedStorage)
  const forced = testWeather?.admin && Date.now() < testWeather.until;
  rui?.setRSAttr('AdminWeather', forced ? testWeather.id : null);
  rui?.setRSAttr('AdminWeatherEnds', forced ? Math.round(testWeather.until / 1000) : null);
  const m = mutationForWeather(w.id);
  const next = upcoming();
  rui?.setWeather(w.id, ends, next ? next.w.id : '', next ? next.starts : 0);
  // eine Minute vorher kündigt sich das nächste Wetter an
  if (next && w.id === 'klar' && next.starts - Date.now() <= WEATHER_WARN * 1000 && warned !== next.starts) {
    warned = next.starts;
    rui?.warn(next.w.id, next.starts);
  }
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
}

// ── Fenster ──────────────────────────────────────────────────────────────────

function openPanel(id, tab = null) {
  if (!WINDOWS.has(id) || !rui) return;
  if (rui.isOpen(id) && !tab) rui.close(id);
  else rui.open(id, tab);
  sound(0.95);
}

function applySettings() {
  saveSettings(settings);
  applyWorldSettings();
  worldBg.refresh(currentWorld(state));
  renderHud();
}

addEventListener('keydown', (e) => {
  if (e.target.closest('input, select, textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
  const key = e.key.toLowerCase();
  if (key === 'escape') return rui?.close();
  if (e.key === ADMIN.key) {
    e.preventDefault();
    return openPanel('admin');
  }
  const map = { w: 'welten', k: 'skills', i: 'inventar', b: 'shop', o: 'einstellungen', v: 'wetter' };
  if (map[key]) {
    e.preventDefault();
    openPanel(map[key]);
  } else if (key === 'f' && !rui?.isOpen()) {
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
  if (findsGems(state)) return findGemHere();
  const r = findCoin(state, Math.random, currentWeather().w.id);
  const tier = tierById[COINS[r.id].tier];
  const space = slots(state) - state.inventory.length;
  const n = Math.min(r.count, space);
  for (let k = 0; k < n; k++) state.inventory.push({ id: r.id, mutation: r.mutation, at: Date.now(), bonus: r.bonus });
  const before = state.level;
  const ups = addXp(state, r.xp);
  save();
  renderHud();
  sound(1 + tier.index * 0.05);

  const value = coinValue({ id: r.id, mutation: r.mutation, bonus: r.bonus });
  // Effekte je nach Seltenheit zeigt die Roblox-Oberfläche (GameUI.Found)
  rui?.found({ coinId: r.id + 1, mutation: r.mutation, count: n, value, xp: r.xp, upgraded: r.upgraded });
  if (ups) levelUp(before, state.level);
}

// Im Juwelnebel: Edelsteine statt Münzen (eigener Beutel, belegt keine Inventarplätze)
function findGemHere() {
  const r = findGem(state);
  const gem = gemById[r.gem];
  addGems(state, gem.id, r.count, r.value);
  const before = state.level;
  const ups = addXp(state, r.xp);
  save();
  renderHud();
  sound(1.2 + tierById[gem.tier].index * 0.05);
  rui?.foundGem({ gemId: gem.id, count: r.count, value: r.value, xp: r.xp, upgraded: r.upgraded });
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
  'portale-p5': () => openPanel('welten', 'p5'),
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

function teleport(id, quiet = false, force = false) {
  const w = worldById[id];
  if (!w || (!force && !ownsWorld(state, id))) return false;
  state.world = id;
  save();
  renderHud();
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
  if (action === 'admin') return adminAct(a, b);
  // Münzbaumgarten und Münzrollen (in Roblox: GardenRemote, Regeln aus GardenData.Act)
  if (action === 'openRoll') {
    const roll = rollById[a];
    if (!roll) return [false, 'Diese Rolle gibt es nicht'];
    if (roll.price.currency !== 'taler') return [false, 'Robux-Käufe gibt es erst im Spiel'];
    if (!pay(roll.price.amount)) return [false, 'Zu wenig Taler'];
    const item = openRoll(roll);
    state.garden.Inv[item.id] = (state.garden.Inv[item.id] || 0) + 1;
    save();
    renderHud();
    return [true, `${roll.name}: ${lootName(item)}!`, item.id];
  }
  const GARDEN_ACTIONS = { gardenBuy: 'buyGarden', gardenBed: 'buyBed', gardenPlant: 'plant', gardenUse: 'use', gardenHarvest: 'harvest', gardenDig: 'dig', gardenFence: 'fence', gardenSell: 'sell', gardenSeed: 'seed' };
  if (GARDEN_ACTIONS[action]) {
    const [ok, text, delta] = gardenAct(state.garden, GARDEN_ACTIONS[action], a, b, Date.now() / 1000, state.taler);
    if (!ok) return [false, text];
    state.taler = Math.round((state.taler + delta) * 100) / 100;
    return done(text);
  }
  // Inventar: Stapel-Schlüssel und Anzahl (oder alle normalen ohne Mutation)
  if (action === 'sell' || action === 'sellNormal') {
    const pick = new Set();
    if (action === 'sellNormal') state.inventory.forEach((e, i) => tierById[COINS[e.id].tier].index === 0 && !e.mutation && pick.add(i));
    else {
      let left = Math.max(1, Math.floor(Number(b) || 1));
      state.inventory.forEach((e, i) => coinKey(e) === a && left-- > 0 && pick.add(i));
    }
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
  // Edelsteine: einen Stein (count Stück) oder alle verkaufen
  if (action === 'sellGem' || action === 'sellGems') {
    const ids = action === 'sellGems' ? Object.keys(state.gems || {}) : [a];
    let total = 0, count = 0;
    for (const id of ids) {
      const [n, v] = takeGems(state, id, action === 'sellGems' ? Infinity : Number(b) || 1);
      count += n;
      total += v;
    }
    if (!count) return [false, 'Kein Edelstein gewählt'];
    state.taler = Math.round((state.taler + total) * 100) / 100;
    return done(`${count} Edelstein${count > 1 ? 'e' : ''} für ${fmtNumber(Math.round(total * 100) / 100, settings.shortNumbers)} Taler verkauft`);
  }
  if (action === 'supernova') {
    const why = canSupernova(state);
    if (why) return [false, why];
    const g = nextGalaxy(state);
    supernova(state);
    flash('#ff5fd2');
    sound(1.8);
    return done(`SUPERNOVA! ${g ? g.name + ' ist offen. ' : ''}Alles ist jetzt ×${supernovaMultiplier(state.supernovas).toLocaleString('de-DE')} wert`);
  }
  // nur Vorschau: zehn Wiedergeburten auf einmal, um die Supernova auszuprobieren
  if (action === 'testRebirths') {
    state.rebirths = Math.min(SUPERNOVA.rebirths, state.rebirths + 10);
    return done(`Test: ${state.rebirths} Wiedergeburten`);
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
  // Skills
  if (action === 'learn') {
    const k = skillById[a];
    const why = k ? canLearn(state, a) : 'Diesen Skill gibt es nicht';
    if (why) return [false, why];
    state.skills[k.id] = skillLevel(state, k.id) + 1;
    sound(1.2);
    return done(`${k.name} auf Stufe ${state.skills[k.id]}`);
  }
  if (action === 'resetSkills') {
    state.skills = { kern: 1 };
    return done('Alle Skillpunkte zurückerstattet');
  }
  // Belohnungen und Codes (rewards.js)
  if (action === 'daily') {
    const r = claimDaily(state);
    if (!r) return [false, 'Heute schon abgeholt'];
    flash('#ffd76a');
    return done(`Tag ${r.day}: ${prizeText(r.prize)}!`);
  }
  if (action === 'spin') {
    const r = spinWheel(state);
    if (!r) return [false, 'Heute schon gedreht'];
    save();
    renderHud();
    return [true, `Glücksrad: ${prizeText(r.prize)}!`, r.index + 1];
  }
  if (action === 'group') {
    const p = joinGroup(state);
    if (!p) return [false, 'Schon beigetreten'];
    return done(`Willkommen in der Gruppe! +${prizeText(p)}`);
  }
  if (action === 'code') {
    const r = redeem(state, a ?? '');
    if (r.error) return [false, r.error];
    return done(`Code ${r.code}: ${prizeText(r.prize)}!`);
  }
  // Einstellungen (gelten für die ganze Seite, js/settings.js)
  if (action === 'setting') {
    if (!(a in DEFAULT_SETTINGS)) return [false, 'Ungültig'];
    if (typeof DEFAULT_SETTINGS[a] === 'number') b = Math.max(0, Math.min(100, Math.round(Number(b) / 5) * 5));
    else if (typeof DEFAULT_SETTINGS[a] === 'boolean') b = b === true;
    else if (!['niedrig', 'mittel', 'hoch'].includes(b)) return [false, 'Ungültig'];
    settings[a] = b;
    applySettings();
    if (a === 'sfx') sound(1);
    return [true];
  }
  if (action === 'resetSettings') {
    settings = { ...DEFAULT_SETTINGS };
    applySettings();
    return [true, 'Einstellungen zurückgesetzt'];
  }
  // nur Vorschau
  if (action === 'resetSave') {
    Object.keys(state).forEach((k) => delete state[k]);
    Object.assign(state, freshState());
    state.garden = newGarden();
    teleport(state.world, true);
    return done('Neuer Spielstand mit Beispiel-Inventar');
  }
  if (action === 'testDay') {
    const d = new Date(Date.now() - 86400000);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    if (state.daily?.lastDay) state.daily.lastDay = key;
    if (state.wheel?.lastDay) state.wheel.lastDay = key;
    return done('Test: ein Tag ist vergangen');
  }
  if (action === 'testWeather') {
    const list = WEATHER.filter((w) => w.id !== 'klar' && w.id !== currentWeather().w.id);
    const w = list[Math.floor(Math.random() * list.length)];
    testWeather = { id: w.id, until: Date.now() + 60000, ms: 60000 };
    renderWeather();
    return [true, `Test: ${w.name} für eine Minute`];
  }
  return [false, 'Unbekannt'];
}

// Daten für Fenster: Wettervorhersage und Ranglisten (in Roblox: Uhrzeit und Server)
function query(kind, arg) {
  if (kind === 'forecast') {
    const now = currentWeather();
    const rest = forecast(10, now.ends).filter((f) => f.ends > now.ends);
    return [now, ...rest].slice(0, 9).map((f) => ({ Id: f.w.id, Starts: Math.round(f.starts / 1000), Ends: Math.round(f.ends / 1000) }));
  }
  if (kind === 'admin') return adminQuery(arg);
  if (kind === 'board') {
    const { top, me, place } = board(state, arg);
    return { Rows: top.map((r) => ({ Name: r.name, Value: r.value, Me: !!r.me })), Place: place, Mine: me.value };
  }
  return null;
}
// ── Admin Panel ──────────────────────────────────────────────────────────────
// Die Seite spielt den Server (in Roblox: Skript CoinmasterAdmin). Andere Spieler sind Beispiele,
// Banns bleiben in diesem Browser.
const BAN_KEY = 'coinmaster.spiel.banns';
const SAMPLE_PLAYERS = [
  ['MuenzMax', 'MünzMax', 41, 8.4e6, 'mars', 11, 3, 214, 2310, 6, 4, 52],
  ['GlitzerGrete', 'GlitzerGrete', 28, 640000, 'candy', 7, 1, 96, 1204, 3, 2, 31],
  ['TalerTom', 'TalerTom', 12, 48200, 'stadt', 3, 0, 41, 288, 2, 0, 9],
  ['KometenKai', 'KometenKai', 63, 2.1e8, 'saturn', 13, 7, 330, 6120, 11, 9, 77],
  ['PerlenPia', 'PerlenPia', 5, 1900, 'normal', 1, 0, 12, 40, 1, 0, 3],
].map(([name, display, level, taler, world, worlds, rebirths, coins, found, eggs, auras, minutes], i) => ({
  UserId: 1000001 + i * 7919, Name: name, DisplayName: display, Level: level, Taler: taler, World: worldById[world]?.name ?? world,
  Worlds: worlds, Rebirths: rebirths, Coins: coins, Found: found, Eggs: eggs, Auras: auras, Minutes: minutes, Ready: true,
}));
const ME_ID = 1;
let adminPlayers = SAMPLE_PLAYERS.map((p) => ({ ...p }));
const adminLog = [];
let adminClock = null;
const loadBans = () => {
  try {
    const list = JSON.parse(localStorage.getItem(BAN_KEY) || '[]');
    return list.filter((b) => !b.Until || b.Until > Date.now() / 1000);
  } catch {
    return [];
  }
};
const saveBans = (list) => {
  try {
    localStorage.setItem(BAN_KEY, JSON.stringify(list));
  } catch {}
};
adminPlayers = adminPlayers.filter((p) => !loadBans().some((b) => b.UserId === p.UserId));
function adminNote(text) {
  adminLog.unshift({ Time: Math.round(Date.now() / 1000), By: 'Du', Text: text });
  adminLog.length = Math.min(adminLog.length, 40);
}
function mePlayer() {
  const w = currentWorld(state);
  const eggs = Object.values(state.eggs).reduce((a, n) => a + n, 0);
  return {
    UserId: ME_ID, Name: 'Vorschau', DisplayName: 'Du', Me: true, Admin: true, Ready: true, Level: state.level, Taler: Math.floor(state.taler),
    World: w.name, Worlds: state.worlds.length, Rebirths: state.rebirths, Supernovas: state.supernovas | 0, Coins: state.inventory.length, Found: state.inventory.length + (state.sold ?? 0),
    Eggs: eggs, Auras: (state.auras || []).length, Minutes: Math.floor((Date.now() - PAGE_START) / 60000),
  };
}
const PAGE_START = Date.now();
function adminQuery(kind) {
  if (kind === 'players') return [mePlayer(), ...adminPlayers];
  if (kind === 'bans') return loadBans().sort((a, b) => b.At - a.At);
  if (kind === 'log') return adminLog;
  return null;
}
function adminAct(sub, json) {
  let a = {};
  try {
    a = JSON.parse(json || '{}') || {};
  } catch {
    return [false, 'Ungültig'];
  }
  const ok = (text, note = text) => {
    if (note) adminNote(note);
    save();
    renderHud();
    return [true, text];
  };
  const other = (id) => adminPlayers.find((p) => p.UserId === id);
  const banLen = ADMIN.bans.find((b) => b.id === a.Ban);
  switch (sub) {
    case 'weather': {
      const w = weatherById[a.Id];
      if (!w || !ADMIN.weatherMinutes.includes(a.Minutes)) return [false, 'Ungültig'];
      const ms = a.Minutes * 60000;
      testWeather = { id: w.id, until: Date.now() + ms, ms, admin: true };
      renderWeather();
      return ok(`${w.name} für ${a.Minutes} Minuten`, `${w.name} für ${a.Minutes} min`);
    }
    case 'weatherReset':
      testWeather = null;
      renderWeather();
      return ok('Wetter wieder nach Zeitplan', 'Wetter zurück zum Zeitplan');
    case 'clock': {
      const c = ADMIN.clocks.find((x) => x.hour === a.Hour);
      if (a.Hour !== -1 && !c) return [false, 'Ungültig'];
      adminClock = c ? c.hour : null;
      rui.setRSAttr('AdminClock', adminClock);
      worldBg.setClock(adminClock);
      return ok(c ? `Uhrzeit: ${c.name}` : 'Uhrzeit wieder wie in der Welt', c ? `Uhrzeit: ${c.name}` : 'Uhrzeit: Licht der Welt');
    }
    case 'teleport': {
      const w = worldById[a.World];
      if (!w || w.soon) return [false, 'Diese Welt gibt es nicht'];
      teleport(w.id, true, true);
      return [true, `Teleportiert nach ${w.name}`];
    }
    case 'unlockWorlds': {
      state.worlds = WORLDS.filter((w) => !w.hub && !w.soon).map((w) => w.id);
      state.portals = PLANETS.filter((p) => !p.soon).map((p) => p.id);
      return ok(`Alle ${state.worlds.length} Welten freigeschaltet`, 'alle Welten freigeschaltet (für sich)');
    }
    case 'visit': {
      const p = other(a.UserId);
      if (!p) return [false, 'Spieler ist nicht da'];
      const w = WORLDS.find((x) => x.name === p.World);
      if (w) teleport(w.id, true, true);
      return [true, `Zu ${p.DisplayName} gereist`];
    }
    case 'kick': {
      if (a.UserId === ME_ID) return [false, 'Das bist du'];
      const p = other(a.UserId);
      if (!p) return [false, 'Spieler ist nicht (mehr) auf dem Server'];
      adminPlayers = adminPlayers.filter((x) => x !== p);
      return ok(`${p.DisplayName} gekickt`, `${p.Name} gekickt${a.Reason ? ` (${a.Reason})` : ''}`);
    }
    case 'ban': {
      const id = Math.floor(Number(a.UserId) || 0);
      if (!id || !banLen) return [false, 'Ungültig'];
      if (id === ME_ID) return [false, 'Das bist du'];
      if (id < 0) return [false, 'Diese UserId kann man nicht bannen'];
      const p = other(id);
      const name = p ? p.Name : `Spieler${id}`;
      const reason = String(a.Reason || '').trim().slice(0, 120);
      const entry = { UserId: id, Name: name, Until: banLen.minutes ? Math.round(Date.now() / 1000) + banLen.minutes * 60 : 0, Reason: reason, By: 'Vorschau', At: Math.round(Date.now() / 1000) };
      saveBans([...loadBans().filter((b) => b.UserId !== id), entry]);
      adminPlayers = adminPlayers.filter((x) => x !== p);
      return ok(`${name} gebannt (${banLen.name})`, `${name} gebannt (${banLen.name})${reason ? ': ' + reason : ''}`);
    }
    case 'unban': {
      const list = loadBans();
      const b = list.find((x) => x.UserId === a.UserId);
      if (!b) return [false, 'Nicht gebannt'];
      saveBans(list.filter((x) => x !== b));
      const back = SAMPLE_PLAYERS.find((p) => p.UserId === b.UserId);
      if (back && !other(back.UserId)) adminPlayers.push({ ...back });
      return ok(`${b.Name} ist nicht mehr gebannt`, `${b.Name} entbannt`);
    }
    case 'reset': {
      if (a.UserId === ME_ID) {
        invoke('resetSave');
        return ok('Dein Spielstand ist zurückgesetzt', 'Spielstand von Vorschau zurückgesetzt');
      }
      const p = other(a.UserId);
      if (!p) return [false, 'Spieler ist nicht (mehr) auf dem Server'];
      Object.assign(p, { Level: 1, Taler: 0, World: 'Spawn', Worlds: 1, Rebirths: 0, Coins: 0, Found: 0, Eggs: 0, Auras: 0 });
      return ok(`Spielstand von ${p.DisplayName} zurückgesetzt`, `Spielstand von ${p.Name} zurückgesetzt`);
    }
    case 'announce': {
      const text = String(a.Text || '').trim().slice(0, ADMIN.announceMax);
      if (!text) return [false, 'Bitte einen Text eingeben'];
      rui.adminAnnounce(text, 'Vorschau-Admin', 'announce');
      return ok('Ansage gesendet', `Ansage: ${text}`);
    }
    case 'event': {
      const bo = BOOSTS.find((x) => x.id === a.Boost);
      if (!bo || !ADMIN.eventMinutes.includes(a.Minutes)) return [false, 'Ungültig'];
      serverBoosts[bo.id] = Math.max(Date.now(), serverBoosts[bo.id] || 0) + a.Minutes * 60000;
      rui.adminAnnounce(`${bo.name} für alle! ${bo.text} (+${a.Minutes} Minuten)`, 'Vorschau-Admin', 'event');
      return ok(`${bo.name} für alle gestartet`, `${bo.name} für alle +${a.Minutes} min`);
    }
    case 'eventStop': {
      const bo = BOOSTS.find((x) => x.id === a.Boost);
      if (!bo) return [false, 'Ungültig'];
      delete serverBoosts[bo.id];
      return ok(`${bo.name} beendet`, `${bo.name} für alle beendet`);
    }
    case 'adminEgg': {
      const egg = EGGS.find((e) => e.id === 'admin');
      if (!egg) return [false, 'Das Admin Egg gibt es nicht'];
      state.eggs.admin = (state.eggs.admin || 0) + 1;
      const n = 1 + adminPlayers.length;
      rui.adminAnnounce(`Jeder bekommt ein ${egg.name}! Schau ins Inventar.`, 'Vorschau-Admin', 'event');
      return ok(`${egg.name} an ${n} Spieler verteilt`);
    }
  }
  return [false, 'Ungültig'];
}

// Geöffnete Münzrolle: dieselbe Öffnen-Ansicht wie auf der Rollen-Seite (RollFx)
let opener = null;
function playRoll(arg) {
  const [rollId, itemId] = String(arg).split('|');
  const roll = rollById[rollId];
  const item = lootById[itemId];
  if (!roll || !item) return;
  opener ||= Opener.mount();
  opener.play(roll, item).then(() => rui?.open('garten', 'sachen'));
}
function uiAction(name, arg) {
  if (name === 'find') return find();
  if (name === 'playRoll') return playRoll(arg);
  if (name === 'gartenBesuchen') return toast('Im Spiel geht es jetzt zum Garten. In 3D ansehen: Seite „Münzbaumgarten“.', '#6fbf4a');
  if (name === 'index') return (location.href = '../muenzindex/');
  if (WINDOWS.has(name)) openPanel(name);
}
let rui = null;
try {
  rui = await createRobloxUi($('game'), {
    onAction: uiAction,
    onInvoke: invoke,
    onQuery: query,
    // Klänge zu den Effekten der Oberfläche (Fund und Level spielt die Seite schon selbst)
    onSound: (kind) => {
      if (kind === 'buy') sound(1.25);
      else if (kind === 'big') [0, 120, 240, 360].forEach((d, i) => setTimeout(() => sound(0.9 + i * 0.2), d));
    },
    devTools: true,
    codeHint: `In der Vorschau: ${Object.keys(CODES).join(', ')}.`,
  });
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

// Vorschau: Spielansicht in Handy-Größe (die Oberfläche ordnet sich dann wie am Handy an)
{
  const btn = $('phone-view');
  const apply = (on) => {
    $('game').classList.toggle('is-phone', on);
    btn.setAttribute('aria-pressed', String(on));
    try {
      localStorage.setItem('coinmaster.phoneView', on ? '1' : '');
    } catch {}
    dispatchEvent(new Event('resize'));
  };
  btn.addEventListener('click', () => apply(btn.getAttribute('aria-pressed') !== 'true'));
  try {
    if (localStorage.getItem('coinmaster.phoneView')) apply(true);
  } catch {}
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
