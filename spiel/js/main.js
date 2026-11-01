// Spiel-Oberfläche: HUD über einer Spielwelt, dazu die Fenster Skilltree, Inventar, Shop und
// Einstellungen. „Münze suchen“ simuliert einen Fund in der Welt mit allen Skill-Effekten.

import { COINS, tierById } from '../../muenzen/js/coins.js';
import { mutationById, weatherAt, mutationForWeather, fmtMultiplier } from '../../muenzen/js/mutations.js';
import { loadState, saveState, loadSettings, xpForLevel, pointsForLevel, freePoints, findCoin, addXp, slots, coinValue, BOOSTS, boostActive, fmtNumber, currentWorld, ownsWorld } from './state.js';
import { planetById, worldById } from '../../welten/js/worlds.js';
import { createWorldBg } from './worldBg.js';
import { coinThumb } from './thumbs.js';
import { icon } from './icons.js';
import { skillPanel } from './panels/skilltree.js';
import { inventarPanel } from './panels/inventar.js';
import { shopPanel } from './panels/shop.js';
import { settingsPanel } from './panels/einstellungen.js';
import { weltenPanel } from './panels/welten.js';

await Promise.race([document.fonts.load('48px "Marcellus SC"'), new Promise((r) => setTimeout(r, 2000))]).catch(() => {});

const state = loadState();
let settings = loadSettings();
const $ = (id) => document.getElementById(id);
const PANELS = { welten: weltenPanel, skills: skillPanel, inventar: inventarPanel, shop: shopPanel, einstellungen: settingsPanel };
const MENU_ICONS = { welten: 'globe', skills: 'tree', inventar: 'bag', shop: 'shop', einstellungen: 'gear' };

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

function renderHud() {
  const short = settings.shortNumbers;
  const need = xpForLevel(state.level);
  $('level').textContent = state.level;
  $('xp-fill').style.width = `${Math.min(100, (state.xp / need) * 100)}%`;
  $('xp-bar').setAttribute('aria-valuemax', need);
  $('xp-bar').setAttribute('aria-valuenow', Math.floor(state.xp));
  $('xp-text').textContent = `${fmtNumber(Math.floor(state.xp), short)} / ${fmtNumber(need, short)} EP bis Level ${state.level + 1}`;
  $('taler').textContent = fmtNumber(state.taler, short);
  const pts = freePoints(state);
  const chip = $('points-chip');
  chip.hidden = pts <= 0;
  chip.textContent = `+${pts} Skillpunkt${pts > 1 ? 'e' : ''}`;
  setBadge('skills', pts > 0 ? pts : 0);
  const full = state.inventory.length >= slots(state);
  setBadge('inventar', full ? '!' : 0);

  $('boosts').innerHTML = BOOSTS.filter((b) => boostActive(state, b.id))
    .map((b) => {
      const left = Math.max(0, Math.ceil((state.boosts[b.id] - Date.now()) / 1000));
      return `<p class="boost" title="${b.name}">${icon(b.icon, 14)} ${b.name} <span>${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}</span></p>`;
    })
    .join('');
}

function setBadge(panel, value) {
  const b = document.querySelector(`.menu-btn[data-panel="${panel}"] .menu-badge`);
  if (!b) return;
  b.hidden = !value;
  b.textContent = value;
}

function renderWeather() {
  const { w, ends } = weatherAt();
  const m = mutationForWeather(w.id);
  const left = Math.max(0, Math.ceil((ends - Date.now()) / 1000));
  const el = $('weather');
  el.style.setProperty('--weather', w.color);
  el.innerHTML = `${icon('cloud', 14)} <strong>${w.name}</strong>${m ? ` · ${m.name}-Chance ${m.chance} %` : ''} <span>${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}</span>`;
  $('world').dataset.weather = w.id;
}

// Menü-Icons einsetzen
document.querySelectorAll('.menu-btn').forEach((b) => {
  b.querySelector('.menu-ico').innerHTML = icon(MENU_ICONS[b.dataset.panel] || 'book', 22);
});
$('panel-close').innerHTML = icon('close', 20);
document.querySelector('.find-ico').innerHTML = icon('search', 20);

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

function openPanel(id) {
  if (openId === id) return closePanel();
  lastFocus = document.activeElement;
  openId = id;
  openTab = PANELS[id].defaultTab?.(ctx) ?? PANELS[id].tabs?.[0].id ?? null;
  $('panel-layer').hidden = false;
  $('panel').dataset.panel = id;
  document.querySelectorAll('.menu-btn[data-panel]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.panel === id)));
  renderPanel();
  $('panel-body').scrollTop = 0;
  $('panel-close').focus();
  sound(0.95);
}

function closePanel() {
  openId = null;
  $('panel-layer').hidden = true;
  document.querySelectorAll('.menu-btn[data-panel]').forEach((b) => b.setAttribute('aria-pressed', 'false'));
  lastFocus?.focus?.();
}

document.querySelectorAll('.menu-btn[data-panel]').forEach((b) => b.addEventListener('click', () => openPanel(b.dataset.panel)));
$('avatar').addEventListener('click', () => openPanel('skills'));
$('points-chip').addEventListener('click', () => openPanel('skills'));
$('panel-close').addEventListener('click', closePanel);
$('panel-layer').addEventListener('click', (e) => e.target === $('panel-layer') && closePanel());

addEventListener('keydown', (e) => {
  if (e.target.closest('input, select, textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
  const key = e.key.toLowerCase();
  if (key === 'escape' && openId) return closePanel();
  const map = { w: 'welten', k: 'skills', i: 'inventar', b: 'shop', o: 'einstellungen' };
  if (map[key]) {
    e.preventDefault();
    openPanel(map[key]);
  } else if (key === 'f' && !openId) {
    e.preventDefault();
    find();
  }
});

// ── Funde ────────────────────────────────────────────────────────────────────

function toast(text, color = '#d9b26a') {
  const li = document.createElement('li');
  li.className = 'feed-item feed-note';
  li.style.setProperty('--c', color);
  li.textContent = text;
  pushFeed(li);
}

function pushFeed(li) {
  const feed = $('feed');
  feed.prepend(li);
  while (feed.children.length > 4) feed.lastElementChild.remove();
  setTimeout(() => li.classList.add('is-out'), 4200);
  setTimeout(() => li.remove(), 4700);
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
  const r = findCoin(state);
  const coin = COINS[r.id], tier = tierById[coin.tier], m = r.mutation && mutationById[r.mutation];
  const space = slots(state) - state.inventory.length;
  const n = Math.min(r.count, space);
  for (let k = 0; k < n; k++) state.inventory.push({ id: r.id, mutation: r.mutation, at: Date.now(), bonus: r.bonus });
  const before = state.level;
  const ups = addXp(state, r.xp);
  save();
  renderHud();
  sound(1 + tier.index * 0.05);

  const li = document.createElement('li');
  li.className = 'feed-item';
  li.style.setProperty('--c', m ? m.color : tier.color);
  const value = coinValue({ id: r.id, mutation: r.mutation, bonus: r.bonus });
  li.innerHTML = `<img src="${coinThumb(r.id, 48)}" alt="" width="36" height="36">
    <span><strong>${coin.name}</strong>${n > 1 ? ' ×2' : ''}<br>
    <small>${tier.name}${m ? ` · ${m.name} ${fmtMultiplier(m)}` : ''}${r.upgraded ? ' · Goldene Hand!' : ''} · ${fmtNumber(value, settings.shortNumbers)} Taler · +${r.xp} EP</small></span>`;
  pushFeed(li);
  burst(m ? m.color : tier.color, tier.index);
  if (openId) renderPanel();
  if (ups) levelUp(before, state.level);
}

$('find-btn').addEventListener('click', find);

// Glitzer an der Fundstelle
function burst(color, rank) {
  if (settings.fewerParticles) return;
  const world = $('world');
  const n = 8 + rank * 3;
  for (let k = 0; k < n; k++) {
    const s = document.createElement('span');
    s.className = 'spark';
    s.style.setProperty('--c', color);
    s.style.setProperty('--dx', `${(Math.random() - 0.5) * 220}px`);
    s.style.setProperty('--dy', `${-60 - Math.random() * 160}px`);
    s.style.left = `${45 + Math.random() * 10}%`;
    world.append(s);
    setTimeout(() => s.remove(), 1100);
  }
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

function renderWorldName() {
  const w = currentWorld(state), p = planetById[w.planet];
  $('world-name').innerHTML = w.hub ? `<span>Treffpunkt</span> Spawn` : `<span>${p.name}</span> ${w.name}`;
  $('world-name').style.setProperty('--c', w.accent);
  $('find-hint').textContent = w.hub ? 'Im Spawn gibt es keine Münzen' : `Simuliert einen Fund in „${w.name}“`;
  $('world').dataset.world = w.id;
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

function teleport(id) {
  const w = worldById[id];
  if (!w || !ownsWorld(state, id)) return;
  state.world = id;
  save();
  closePanel();
  flash(w.accent);
  // Welt mitten im Aufleuchten tauschen
  setTimeout(() => {
    worldBg.set(w);
    renderWorldName();
  }, settings.skipAnimations ? 0 : 260);
  sound(0.8);
  toast(`Teleportiert nach ${w.name}`, w.accent);
}

applyWorldSettings();
worldBg.set(currentWorld(state));
renderWorldName();
renderHud();
// Link von der Weltkarte: spiel/#welten öffnet das Teleport-Menü
if (location.hash === '#welten') openPanel('welten');
renderWeather();
setInterval(() => {
  renderWeather();
  renderHud();
}, 1000);
