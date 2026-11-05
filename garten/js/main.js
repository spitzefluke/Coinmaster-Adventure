// Münzbaumgarten: Garten kaufen, Beete, Samen säen, Gießen, Düngen, Ernten. Wachsende Bäume zeigen einen Timer.
// Der Garten in 3D ist GardenBuilder aus dem Installer (1:1 wie in Roblox), die Regeln stehen in
// garden.js (wie GardenData). Taler und Inventar teilt sich die Seite mit den Münzrollen.

import * as THREE from 'three';
import {
  TREES, LOOT, GARDEN, lootById, rarityById, stage, ripe, grownAt, boostMult, harvestValue,
  loadState, saveState, freshState, now, setSpeed, fmt, fmtTime, lootName,
} from './garden.js';
import { createRobloxGarden, rollLua } from '../../rollen/js/rollRoblox.js';
import { rbxRenderer } from '../../muenzen/js/coinRoblox.js';
import { orbitEgg } from '../../eier/js/eggRoblox.js';

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let state = loadState();
let selected = null; // Id einer Sache aus dem Inventar, die man gerade auf ein Beet anwenden will

const $ = (id) => document.getElementById(id);
const STAGE_NAME = ['Leer', 'Keimling', 'Jungbaum', 'Ausgewachsen'];
const ICON = { bush: '🌿', round: '🌳', oval: '🌳', cone: '🌲', blossom: '🌸', weeping: '🌳', palm: '🌴', star: '🌌', can: '💧', sack: '🌱', bag: '💰', spade: '⚒️', chest: '💎' };
const icon = (item) => ICON[item.crown || item.model] || '🌳';

function save() {
  saveState(state);
  render();
}
function hint(html) {
  $('hint').innerHTML = html;
}

// ── Aktionen ─────────────────────────────────────────────────────────────────

function take(id) {
  state.inv[id]--;
  if (state.inv[id] <= 0) {
    delete state.inv[id];
    if (selected === id) selected = null;
  }
}

function buyGarden() {
  if (state.owned || state.taler < GARDEN.price) return;
  state.taler -= GARDEN.price;
  state.owned = true;
  state.beds = GARDEN.startBeds;
  state.plots = [];
  hint('Der Garten gehört dir! Öffne <a href="../rollen/">Münzrollen</a>, um Bäume zu bekommen.');
  save();
}

function buyBed() {
  const price = GARDEN.bedPrice(state.beds);
  if (!state.owned || state.beds >= GARDEN.maxBeds || state.taler < price) return;
  state.taler -= price;
  state.beds++;
  hint(`Beet ${state.beds} ist umgegraben.`);
  save();
}

function useItem(id) {
  const item = lootById[id];
  if (item.kind === 'taler') {
    state.taler += item.amount;
    take(id);
    hint(`<strong>+${fmt(item.amount)} Taler</strong> aus dem ${item.name}.`);
    return save();
  }
  if (item.kind === 'bed') {
    if (!state.owned || state.beds >= GARDEN.maxBeds) return hint(state.owned ? 'Der Garten ist schon so groß wie möglich.' : 'Kauf zuerst den Garten.');
    state.beds++;
    take(id);
    hint(`Der ${item.name} gräbt Beet ${state.beds}.`);
    return save();
  }
  selected = selected === id ? null : id;
  hint(selected ? `<strong>${lootName(item)}</strong> ausgewählt. Tippe bei einem Beet auf „${actionName(item)}“.` : '');
  render();
}

const actionName = (item) => (item.type === 'tree' ? 'Säen' : item.kind === 'water' ? 'Gießen' : 'Düngen');

// Kann die ausgewählte Sache auf Beet i benutzt werden?
function canApply(i, t) {
  if (!selected || !state.owned) return false;
  const item = lootById[selected];
  const plot = state.plots[i];
  if (item.type === 'tree') return !plot;
  if (!plot) return false;
  if (item.kind === 'water') return stage(plot, t) < 3;
  if (item.kind === 'boost') return true;
  return false;
}

function apply(i) {
  const t = now(state);
  if (!canApply(i, t)) return;
  const item = lootById[selected];
  if (item.type === 'tree') {
    state.plots[i] = { tree: item.id, planted: t, bonus: 0, harvested: 0, boost: 1, boostEnd: 0 };
    hint(`${lootName(item)} in Beet ${i + 1} gesät. Der Timer zeigt, wann der Baum ausgewachsen ist.`);
  } else if (item.kind === 'water') {
    const plot = state.plots[i];
    const left = grownAt(plot) - t;
    plot.bonus += Math.min(item.seconds, left);
    hint(`Beet ${i + 1} gegossen${item.seconds >= left ? ': ausgewachsen!' : ` (${fmtTime(item.seconds)} schneller).`}`);
  } else if (item.kind === 'boost') {
    const plot = state.plots[i];
    plot.boost = item.mult;
    plot.boostEnd = t + item.seconds;
    hint(`Beet ${i + 1} gedüngt: ×${item.mult} Ernte für ${fmtTime(item.seconds)}.`);
  }
  take(item.id);
  save();
}

function harvest(i, quiet) {
  const t = now(state);
  const plot = state.plots[i];
  const value = plot ? harvestValue(plot, t) : 0;
  if (!value) return 0;
  state.taler += value;
  plot.harvested = t;
  if (!quiet) {
    hint(`<strong>+${fmt(value)} Taler</strong> aus Beet ${i + 1}.`);
    save();
  }
  return value;
}

function harvestAll() {
  let sum = 0;
  for (let i = 0; i < state.beds; i++) sum += harvest(i, true);
  hint(sum ? `<strong>+${fmt(sum)} Taler</strong> geerntet.` : 'Noch nichts reif.');
  save();
}

function dig(i) {
  const plot = state.plots[i];
  if (!plot) return;
  harvest(i, true);
  state.inv[plot.tree] = (state.inv[plot.tree] || 0) + 1;
  state.plots[i] = null;
  hint(`${lootById[plot.tree].name} ausgegraben, die ${lootName(lootById[plot.tree])} liegen wieder im Inventar.`);
  save();
}

// ── Anzeige ──────────────────────────────────────────────────────────────────

function renderBar() {
  $('taler').textContent = fmt(state.taler);
  for (const b of document.querySelectorAll('[data-speed]')) b.setAttribute('aria-pressed', String(Number(b.dataset.speed) === state.clock.speed));
  const buy = $('buy');
  buy.hidden = state.owned;
  $('buy-text').textContent = `${GARDEN.startBeds} Beete, umzäunt, mit Tor und Schild. Später auf bis zu ${GARDEN.maxBeds} Beete erweiterbar.`;
  const bb = $('buy-btn');
  bb.textContent = state.taler >= GARDEN.price ? `Kaufen für ${fmt(GARDEN.price)} Taler` : `Zu wenig Taler (${fmt(GARDEN.price)})`;
  bb.disabled = state.taler < GARDEN.price;
  const bed = $('buy-bed');
  bed.hidden = !state.owned;
  const price = GARDEN.bedPrice(state.beds);
  bed.textContent = state.beds >= GARDEN.maxBeds ? 'Alle Beete gekauft' : `Beet kaufen · ${fmt(price)} Taler`;
  bed.disabled = state.beds >= GARDEN.maxBeds || state.taler < price;
  $('harvest-all').hidden = !state.owned;
}

// Jedes Beet wird nur neu gebaut, wenn sich etwas Grundlegendes ändert (Baum, Stufe, Ernten,
// Auswahl). Countdown und Balken laufen über data-live-Felder, damit die Knöpfe stehen bleiben.
let bedsOwned = null;
function renderBeds(t) {
  const el = $('beds');
  if (!state.owned) {
    if (bedsOwned !== false) el.innerHTML = '<p class="bed-empty">Noch kein Garten. Kauf ihn oben für Taler.</p>';
    bedsOwned = false;
    return;
  }
  if (bedsOwned !== true) el.innerHTML = '';
  bedsOwned = true;
  while (el.children.length > state.beds) el.lastElementChild.remove();
  for (let i = 0; i < state.beds; i++) {
    const { key, html } = bedHtml(i, t);
    let card = el.children[i];
    if (!card) {
      card = document.createElement('article');
      el.append(card);
    }
    if (card.dataset.key !== key) {
      card.dataset.key = key;
      card.className = 'bed' + (canApply(i, t) ? ' is-target' : '');
      card.innerHTML = html;
      const plot = state.plots[i];
      card.style.setProperty('--t', plot ? rarityById[lootById[plot.tree].rarity].color : '');
    }
    updateLive(card, i, t);
  }
}

function bedHtml(i, t) {
  const plot = state.plots[i];
  const target = canApply(i, t);
  const sel = selected && lootById[selected];
  const applyBtn = target ? `<button class="btn gold small" data-apply="${i}">${actionName(sel)}: ${lootName(sel)}</button>` : '';
  if (!plot) {
    return {
      key: `leer|${target ? selected : ''}`,
      html: `<div class="bed-head"><span class="bed-no">Beet ${i + 1}</span></div>
        <p class="bed-empty">Leer. Säe Samen aus dem Inventar.</p>
        <div class="bed-actions">${applyBtn}</div>`,
    };
  }
  const tree = lootById[plot.tree];
  const st = stage(plot, t);
  const r = ripe(plot, t);
  const rar = rarityById[tree.rarity];
  const mult = boostMult(plot, t);
  const info =
    st < 3
      ? `<p class="bed-state">${STAGE_NAME[st]} · ausgewachsen in <span data-live="grow"></span></p><div class="meter"><span data-live="meter"></span></div>`
      : `<p class="bed-state">Ausgewachsen · <span data-live="next"></span></p><div class="ripe" aria-label="${r} von ${GARDEN.maxRipe} Ernten reif">${Array.from({ length: GARDEN.maxRipe }, (_, k) => `<i class="${k < r ? 'on' : ''}"></i>`).join('')}</div>`;
  return {
    key: `${plot.tree}|${plot.planted}|${st}|${r}|${mult}|${target ? selected : ''}`,
    html: `<div class="bed-head"><span class="bed-no">Beet ${i + 1}</span><span class="bed-no" style="color:${rar.color}">${rar.name}</span></div>
      <h3 class="bed-name">${tree.name}</h3>
      ${info}
      ${mult > 1 ? `<span class="badge">Dünger ×${mult} · noch <span data-live="boost"></span></span>` : ''}
      <div class="bed-actions">
        ${r > 0 ? `<button class="btn gold small" data-harvest="${i}">Ernten · +${fmt(harvestValue(plot, t))}</button>` : ''}
        ${applyBtn}
        <button class="btn ghost small" data-dig="${i}">Ausgraben</button>
      </div>`,
  };
}

function updateLive(card, i, t) {
  const plot = state.plots[i];
  if (!plot) return;
  const tree = lootById[plot.tree];
  const set = (name, fn) => {
    const e = card.querySelector(`[data-live="${name}"]`);
    if (e) fn(e);
  };
  set('grow', (e) => (e.textContent = fmtTime(grownAt(plot) - t)));
  set('meter', (e) => (e.style.width = (Math.min(1, (t - plot.planted + plot.bonus) / tree.grow) * 100).toFixed(1) + '%'));
  set('next', (e) => {
    const since = Math.max(grownAt(plot), plot.harvested);
    e.textContent = ripe(plot, t) >= GARDEN.maxRipe ? 'voll, bitte ernten' : `nächste Ernte in ${fmtTime(tree.cycle - ((t - since) % tree.cycle))}`;
  });
  set('boost', (e) => (e.textContent = fmtTime(plot.boostEnd - t)));
}

let invHtml = '';
function renderInv() {
  const el = $('inv');
  const set = (html) => {
    if (html !== invHtml) el.innerHTML = invHtml = html;
  };
  const ids = LOOT.map((l) => l.id).filter((id) => state.inv[id] > 0);
  if (!ids.length) {
    set('<p class="inv-empty">Leer. Öffne <a href="../rollen/">Münzrollen</a>, um Samen, Gießkannen und mehr zu bekommen.</p>');
    return;
  }
  set(ids
    .map((id) => {
      const item = lootById[id];
      const rar = rarityById[item.rarity];
      const direct = item.kind === 'taler' || item.kind === 'bed';
      const label = direct ? 'Benutzen' : selected === id ? 'Abwählen' : `Auswählen zum ${actionName(item)}`;
      const sub = item.type === 'tree' ? `Wächst in ${fmtTime(item.grow)} zum ${item.name}, dann ${fmt(item.yield)} Taler alle ${fmtTime(item.cycle)}` : item.text;
      return `<article class="item${selected === id ? ' is-selected' : ''}" style="--t:${rar.color}">
        <span class="item-icon" aria-hidden="true">${item.type === 'tree' ? '🌱' : icon(item)}</span>
        <p class="item-name">${lootName(item)}<small>×${state.inv[id]}</small></p>
        <p class="item-rar">${rar.name} · ${item.type === 'tree' ? 'Samen' : 'Werkzeug'}</p>
        <p class="item-text">${sub}</p>
        <button class="btn small${direct || selected === id ? '' : ' gold'}" data-use="${id}" ${state.owned || item.kind === 'taler' ? '' : 'disabled'}>${state.owned || item.kind === 'taler' ? label : 'Erst Garten kaufen'}</button>
      </article>`;
    })
    .join(''));
}

function renderCatalog() {
  $('cat').innerHTML = TREES.map((t) => {
    const rar = rarityById[t.rarity];
    return `<tr><td>${icon(t)} ${t.name}</td><td style="--t:${rar.color}"><span class="dot"></span>${rar.name}</td><td>${fmtTime(t.grow)}</td><td>alle ${fmtTime(t.cycle)}</td><td>${fmt(t.yield)}</td><td>${fmt((t.yield / t.cycle) * 60)}</td></tr>`;
  }).join('');
}

function render() {
  const t = now(state);
  renderBar();
  renderBeds(t);
  renderInv();
  update3d(t);
}

// ── Knöpfe ───────────────────────────────────────────────────────────────────

document.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.use) useItem(b.dataset.use);
  else if (b.dataset.apply) apply(Number(b.dataset.apply));
  else if (b.dataset.harvest) harvest(Number(b.dataset.harvest));
  else if (b.dataset.dig) dig(Number(b.dataset.dig));
  else if (b.dataset.speed) {
    setSpeed(state, Number(b.dataset.speed));
    save();
  }
});
$('buy-btn').addEventListener('click', buyGarden);
$('buy-bed').addEventListener('click', buyBed);
$('harvest-all').addEventListener('click', harvestAll);
$('cheat').addEventListener('click', () => {
  state.taler += 100000;
  save();
});
$('reset').addEventListener('click', () => {
  if (!confirm('Garten, Inventar und Taler der Vorschau zurücksetzen?')) return;
  state = freshState();
  selected = null;
  hint('');
  save();
});
// Änderungen aus der Rollen-Seite (anderer Tab) übernehmen
addEventListener('storage', () => {
  state = loadState();
  render();
});
addEventListener('pageshow', () => {
  state = loadState();
  render();
});

// ── 3D ───────────────────────────────────────────────────────────────────────

const canvas = $('garden-canvas');
const renderer = rbxRenderer(canvas, { shadows: true });
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const camera = new THREE.PerspectiveCamera(35, 16 / 9, 0.1, 800);
let lua = null;
let garden = null, sig = '', building = false;
const cam = { angle: 0, tilt: 0.62, drag: null, zoom: 1 };

rollLua().then((l) => {
  lua = l;
  update3d(now(state));
});

async function update3d(t) {
  if (!lua || building) return;
  const beds = state.owned ? state.beds : GARDEN.startBeds;
  const plots = Array.from({ length: beds }, (_, i) => {
    const p = state.owned && state.plots[i];
    return p ? { tree: p.tree, stage: stage(p, t), ripe: ripe(p, t) } : null;
  });
  const s = beds + '|' + plots.map((p) => (p ? `${p.tree},${p.stage},${p.ripe}` : '')).join(';');
  if (s === sig) return updateTimers(t);
  building = true;
  try {
    const next = await createRobloxGarden(beds, plots);
    garden?.dispose();
    garden = next;
    garden.rows = Math.ceil(beds / 4);
    sig = s;
    updateTimers(t);
  } catch (err) {
    console.error('Garten', err);
  }
  building = false;
}

// Timer über wachsenden Bäumen im 3D-Garten weiterzählen (GardenBuilder.SetTimer)
function updateTimers(t) {
  if (!garden || !state.owned) return;
  const list = [];
  state.plots.forEach((p, i) => {
    if (!p || stage(p, t) >= 3) return;
    const tree = lootById[p.tree];
    const left = grownAt(p) - t;
    list.push(`${i + 1},${fmtTime(left)},${Math.max(0, Math.min(1, 1 - left / tree.grow)).toFixed(3)}`);
  });
  if (list.length) garden.call('__gardenTimers', list.join(';'));
}

function resize() {
  const r = canvas.getBoundingClientRect();
  renderer.setSize(r.width, r.height, false);
  camera.aspect = r.width / Math.max(1, r.height);
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(canvas);

canvas.addEventListener('pointerdown', (e) => {
  cam.drag = { x: e.clientX, y: e.clientY };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!cam.drag) return;
  cam.angle -= (e.clientX - cam.drag.x) * 0.008;
  cam.tilt = Math.max(0.2, Math.min(1.25, cam.tilt + (e.clientY - cam.drag.y) * 0.005));
  cam.drag = { x: e.clientX, y: e.clientY };
});
canvas.addEventListener('pointerup', () => (cam.drag = null));
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  cam.zoom = Math.max(0.55, Math.min(1.6, cam.zoom + e.deltaY * 0.001));
}, { passive: false });

const clock = new THREE.Clock();
let tick = 0;
// solange ein Finger oder die Maus gedrückt ist, nichts neu zeichnen (sonst geht der Klick verloren)
let pressing = false;
addEventListener('pointerdown', () => (pressing = true), true);
addEventListener('pointerup', () => setTimeout(() => (pressing = false), 0), true);
addEventListener('pointercancel', () => (pressing = false), true);
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.1);
  tick += dt;
  // Texte und Garten jede halbe Sekunde auffrischen (Wachsen, Reifen, Countdown)
  if (tick > 0.5 && !pressing) {
    tick = 0;
    render();
  }
  if (!garden) return;
  lua?.frame(dt);
  garden.step(dt);
  if (!cam.drag && !reducedMotion) cam.angle = cam.angle * 0.995 + Math.sin(clock.elapsedTime * 0.15) * 0.0012;
  // so weit weg, dass der ganze Garten (31 Studs breit) ins Bild passt, auch im Hochformat
  const fit = 19 / (Math.tan(THREE.MathUtils.degToRad(17.5)) * camera.aspect);
  const dist = Math.max(36 + (garden.rows - 1) * 6, fit) * cam.zoom;
  orbitEgg(camera, cam.angle, cam.tilt, dist, 1.5);
  garden.world.render(renderer, camera);
});

renderCatalog();
render();
