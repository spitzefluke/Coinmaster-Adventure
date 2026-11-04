// Münzkabinett: baut die Galerie auf und rendert alle Münzen über ein einziges WebGL-Canvas.
// Jede Münze ist 1:1 die Roblox-Münze: CoinBuilder und MutationFx aus dem Installer laufen in der
// Roblox-Engine der Seite (coinRoblox.js), das Motiv erscheint als Decal.
//
// Jede Karte hat ein leeres `.view`-Feld. Pro Frame wird für jede sichtbare Karte deren
// Bildschirmbereich per Scissor-Test gerendert – so reicht ein WebGL-Kontext für 50 Münzen.
// Münzen werden erst gebaut, wenn ihre Karte in die Nähe des sichtbaren Bereichs kommt.

import * as THREE from 'three';
import { TIERS, COINS, tierById, rollCoin } from './coins.js';
import { createRobloxCoin, coinLua, orbitCoin, rbxRenderer, COIN_CAMERA } from './coinRoblox.js';
import { MUTATIONS, mutationById, mutatedValue, fmtMultiplier } from './mutations.js';

// Die Umschrift wird auf Canvas gezeichnet – vorher die Schrift laden (mit Zeitlimit).
await Promise.race([document.fonts.load('48px "Marcellus SC"'), new Promise((r) => setTimeout(r, 2500))]).catch(() => {});

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fmtPct = (n) => n.toLocaleString('de-DE', { maximumFractionDigits: n < 0.1 ? 3 : 2 }) + ' %';
const fmtInt = (n) => Math.round(n).toLocaleString('de-DE');

const tierCount = Object.fromEntries(TIERS.map((t) => [t.id, COINS.filter((c) => c.tier === t.id).length]));
const coinChance = (coin) => tierById[coin.tier].chance / tierCount[coin.tier];

// ── DOM aufbauen ─────────────────────────────────────────────────────────────

const cabinet = document.getElementById('cabinet');
const dropbar = document.getElementById('dropbar');
const chipsEl = document.getElementById('chips');
const cards = [];
const sections = {};

TIERS.forEach((tier, i) => {
  const sec = document.createElement('section');
  sec.className = 'tier-section';
  sec.style.setProperty('--tier', tier.color);
  sec.style.setProperty('--rank', i);
  sec.innerHTML = `
    <div class="tier-head">
      <h2>${tier.name}</h2>
      <p class="facts">${tierCount[tier.id]} Münzen · ${fmtPct(tier.chance)} Drop-Chance · Nennwert ${tier.value}</p>
    </div>
    <div class="grid"></div>`;
  const grid = sec.querySelector('.grid');
  COINS.filter((c) => c.tier === tier.id).forEach((coin) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'card';
    card.style.setProperty('--tier', tier.color);
    card.setAttribute('aria-label', `${coin.name}, ${tier.name}. Details öffnen`);
    card.innerHTML = `
      <div class="view"></div>
      <div class="card-body">
        <h3 class="card-name">${coin.name}</h3>
        <div class="card-meta"><span>${tier.name}</span><span>${fmtPct(coinChance(coin))}</span></div>
        <p class="card-text">${coin.text}</p>
      </div>`;
    grid.append(card);
    const entry = { coin, card, view: card.querySelector('.view'), obj: null, scene: null, near: false, hover: false, phase: Math.random() * 6 };
    card.addEventListener('pointerenter', () => (entry.hover = true));
    card.addEventListener('pointerleave', () => (entry.hover = false));
    card.addEventListener('click', () => openDetail(coin, false));
    cards.push(entry);
  });
  cabinet.append(sec);
  sections[tier.id] = sec;

  const seg = document.createElement('button');
  seg.type = 'button';
  seg.style.setProperty('--tier', tier.color);
  seg.style.setProperty('--share', Math.max(tier.chance, 0.6));
  seg.title = `${tier.name}: ${fmtPct(tier.chance)}`;
  seg.setAttribute('aria-label', `${tier.name} ${fmtPct(tier.chance)}`);
  seg.dataset.tier = tier.id;
  dropbar.append(seg);

  const chip = document.createElement('button');
  chip.type = 'button';
  chip.className = 'chip';
  chip.style.setProperty('--tier', tier.color);
  chip.dataset.tier = tier.id;
  chip.innerHTML = `${tier.name} <span class="num">${fmtPct(tier.chance)}</span>`;
  chipsEl.append(chip);
});

const allChip = document.createElement('button');
allChip.type = 'button';
allChip.className = 'chip';
allChip.dataset.tier = 'all';
allChip.innerHTML = `Alle <span class="num">50</span>`;
chipsEl.prepend(allChip);

let activeTier = 'all';
function setFilter(id) {
  activeTier = activeTier === id ? 'all' : id;
  applySearch();
  for (const el of [...chipsEl.children, ...dropbar.children]) {
    const t = el.dataset.tier;
    el.setAttribute('aria-pressed', String(activeTier === 'all' ? t === 'all' || el.parentElement === dropbar : t === activeTier));
  }
}
// Suche nach Namen, kombiniert mit dem Stufen-Filter
const search = document.getElementById('search');
function applySearch() {
  const q = search.value.trim().toLocaleLowerCase('de-DE');
  for (const e of cards) e.card.hidden = !!q && !e.coin.name.toLocaleLowerCase('de-DE').includes(q);
  let shown = 0;
  for (const [tid, sec] of Object.entries(sections)) {
    const visible = cards.filter((e) => e.coin.tier === tid && !e.card.hidden).length;
    sec.hidden = (activeTier !== 'all' && activeTier !== tid) || visible === 0;
    if (!sec.hidden) shown += visible;
  }
  document.getElementById('no-results').hidden = shown > 0;
  document.getElementById('search-count').textContent = q || activeTier !== 'all' ? `${shown} von ${COINS.length} Münzen` : '';
}
search.addEventListener('input', applySearch);

for (const el of [...chipsEl.children, ...dropbar.children]) el.addEventListener('click', () => setFilter(el.dataset.tier));
setFilter('all');

// ── Galerie-Renderer ─────────────────────────────────────────────────────────

const stage = document.getElementById('stage');
const renderer = rbxRenderer(stage);
const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 500);
let lua = null;
coinLua().then((l) => (lua = l)).catch((e) => console.error('Luau konnte nicht starten', e));

function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
}
addEventListener('resize', resize);
resize();

// Münzen nur bauen, wenn die Karte bald sichtbar wird
const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      const entry = cards.find((c) => c.view === e.target);
      entry.near = e.isIntersecting;
      // weit weg gescrollt: Texturen freigeben, beim Zurückscrollen neu bauen
      if (!entry.near && entry.obj) {
        entry.obj.dispose();
        entry.obj = null;
      }
    }
  },
  { rootMargin: '800px 0px' },
);
cards.forEach((c) => io.observe(c.view));

// nacheinander bauen, damit der Hauptthread nicht hängt
let building = false;
async function buildNext() {
  if (building) return;
  const entry = cards.find((e) => e.near && !e.obj && !e.card.hidden);
  if (!entry) return;
  building = true;
  try {
    const obj = await createRobloxCoin(entry.coin);
    if (entry.near) entry.obj = obj;
    else obj.dispose();
  } catch (err) {
    console.error('Münze', entry.coin.name, err);
  }
  building = false;
}

const clock = new THREE.Clock();
let detailOpen = false;

// Unterkante der Navigation (js/nav.js); die Leiste klebt beim Scrollen oben
const navBottom = () => document.querySelector('.site-nav')?.getBoundingClientRect().bottom ?? 0;

function renderGallery(t, dt) {
  renderer.setScissorTest(false);
  renderer.clear();
  if (detailOpen) return;
  buildNext();
  renderer.setScissorTest(true);
  const H = stage.clientHeight;
  for (const entry of cards) {
    if (!entry.near || !entry.obj) continue;
    const r = entry.view.getBoundingClientRect();
    // nur unterhalb der klebenden Navigation zeichnen
    const top = Math.max(r.top, navBottom());
    if (r.bottom <= top || r.top > H || r.width === 0) continue;
    const speed = reducedMotion ? 0 : entry.hover ? 2.2 : 0.55;
    entry.spin = (entry.spin ?? entry.phase) + speed * dt;
    entry.obj.step(dt);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
    orbitCoin(camera, entry.spin, Math.sin(t * 0.6 + entry.phase) * 0.12, entry.obj.distance);
    renderer.setViewport(r.left, H - r.bottom, r.width, r.height);
    renderer.setScissor(r.left, H - r.bottom, r.width, r.bottom - top);
    entry.obj.world.render(renderer, camera);
  }
}

// ── Detailansicht ────────────────────────────────────────────────────────────

const detail = document.getElementById('detail');
const detailCanvas = document.getElementById('detail-canvas');
const detailPanel = detail.querySelector('.detail-panel');
let dRenderer, dCamera, dCoin, dToken = 0;
let autoSpin = !reducedMotion;
let flipTarget = null;
// Kamera um die Münze: Winkel, Neigung, Abstand (Ziehen dreht, Mausrad zoomt)
const view = { angle: 0, tilt: 0.05, dist: 12, drag: null };

function initDetail() {
  dRenderer = rbxRenderer(detailCanvas);
  dCamera = new THREE.PerspectiveCamera(30, 1, 0.1, 500);
  detailCanvas.addEventListener('pointerdown', (e) => {
    view.drag = { x: e.clientX, y: e.clientY };
    flipTarget = null;
    detailCanvas.setPointerCapture(e.pointerId);
  });
  detailCanvas.addEventListener('pointermove', (e) => {
    if (!view.drag) return;
    view.angle -= (e.clientX - view.drag.x) * 0.01;
    view.tilt = Math.max(-1.2, Math.min(1.2, view.tilt + (e.clientY - view.drag.y) * 0.006));
    view.drag = { x: e.clientX, y: e.clientY };
  });
  detailCanvas.addEventListener('pointerup', () => (view.drag = null));
  detailCanvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    view.dist = Math.max(6, Math.min(30, view.dist + e.deltaY * 0.02));
  }, { passive: false });
}

let dData = null, dMutation = null;

function buildDetailCoin() {
  const token = ++dToken;
  createRobloxCoin(dData, { mutation: dMutation, shadows: false }).then((obj) => {
    if (token !== dToken || !detailOpen) return obj.dispose();
    dCoin?.dispose();
    dCoin = obj;
  });
  const tier = tierById[dData.tier];
  const m = dMutation && mutationById[dMutation];
  document.getElementById('detail-value').textContent = m ? `${mutatedValue(tier.value, m)} Taler (${fmtMultiplier(m)})` : `${tier.value} Taler`;
  for (const chip of mutationChips.children) chip.setAttribute('aria-pressed', String((chip.dataset.mutation || null) === dMutation));
}

// Auswahl „Mutation ansehen“: Keine + alle Mutationen
const mutationChips = document.getElementById('mutation-chips');
for (const m of [null, ...MUTATIONS]) {
  const chip = document.createElement('button');
  chip.type = 'button';
  chip.className = 'mchip';
  if (m) {
    chip.dataset.mutation = m.id;
    chip.style.setProperty('--mut', m.color);
    chip.innerHTML = `${m.name} <span>${fmtMultiplier(m)}</span>`;
  } else chip.textContent = 'Keine';
  chip.addEventListener('click', () => {
    dMutation = m ? m.id : null;
    buildDetailCoin();
  });
  mutationChips.append(chip);
}

function openDetail(coin, drawn) {
  if (!dRenderer) initDetail();
  dCoin?.dispose();
  dCoin = null;
  const tier = tierById[coin.tier];
  dData = coin;
  dMutation = null;
  detailOpen = true;
  buildDetailCoin();
  Object.assign(view, { angle: 0, tilt: 0.05, dist: COIN_CAMERA[tier.index] + 1 });
  flipTarget = null;

  detailPanel.style.setProperty('--tier', tier.color);
  document.getElementById('detail-tier').textContent = tier.name;
  document.getElementById('detail-tier').style.setProperty('--tier', tier.color);
  document.getElementById('detail-name').textContent = coin.name;
  document.getElementById('detail-text').textContent = coin.text;
  document.getElementById('detail-chance').textContent = fmtPct(coinChance(coin));
  document.getElementById('detail-odds').textContent = fmtInt(100 / coinChance(coin));
  document.getElementById('detail-drawn').hidden = !drawn;

  detail.hidden = false;
  detailOpen = true;
  document.body.style.overflow = 'hidden';
  sizeDetail();
  detail.querySelector('.detail-close').focus();
}

function closeDetail() {
  detail.hidden = true;
  detailOpen = false;
  dToken++;
  dCoin?.dispose();
  dCoin = null;
  document.body.style.overflow = '';
}

function sizeDetail() {
  const box = detailCanvas.parentElement.getBoundingClientRect();
  dRenderer.setSize(box.width, box.height, false);
  dCamera.aspect = box.width / Math.max(1, box.height);
  dCamera.updateProjectionMatrix();
}
addEventListener('resize', () => detailOpen && sizeDetail());

detail.addEventListener('click', (e) => e.target.closest('[data-close]') && closeDetail());
addEventListener('keydown', (e) => {
  if (!detailOpen) return;
  if (e.key === 'Escape') closeDetail();
  else if (e.key === 'ArrowRight' && !e.target.closest('input, select')) stepDetail(1);
  else if (e.key === 'ArrowLeft' && !e.target.closest('input, select')) stepDetail(-1);
});

// Vorherige/nächste Münze in der Detailansicht
function stepDetail(dir) {
  const i = COINS.indexOf(dData);
  openDetail(COINS[(i + dir + COINS.length) % COINS.length], false);
}
document.getElementById('prev-btn').addEventListener('click', () => stepDetail(-1));
document.getElementById('next-btn').addEventListener('click', () => stepDetail(1));

document.getElementById('flip-btn').addEventListener('click', () => {
  // zur anderen Seite: auf das nächste Vielfache von PI drehen, das die andere Seite zeigt
  const sideNow = Math.round(view.angle / Math.PI);
  flipTarget = (sideNow + 1) * Math.PI;
});
const spinBtn = document.getElementById('spin-btn');
spinBtn.setAttribute('aria-pressed', String(autoSpin));
spinBtn.textContent = autoSpin ? 'Drehung an' : 'Drehung aus';
spinBtn.addEventListener('click', () => {
  autoSpin = !autoSpin;
  spinBtn.setAttribute('aria-pressed', String(autoSpin));
  spinBtn.textContent = autoSpin ? 'Drehung an' : 'Drehung aus';
});

function renderDetail(t, dt) {
  if (!detailOpen || !dCoin) return;
  if (flipTarget !== null) {
    view.angle += (flipTarget - view.angle) * Math.min(1, dt * 6);
    if (Math.abs(flipTarget - view.angle) < 0.002) flipTarget = null;
  } else if (autoSpin && !view.drag) {
    view.angle += dt * 0.5;
  }
  dCoin.step(dt);
  orbitCoin(dCamera, view.angle, view.tilt, view.dist);
  dCoin.world.render(dRenderer, dCamera);
}

// ── Münze ziehen ─────────────────────────────────────────────────────────────

document.getElementById('draw-btn').addEventListener('click', () => openDetail(rollCoin(), true));

// ── Schleife ─────────────────────────────────────────────────────────────────

renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.1);
  const t = clock.elapsedTime;
  lua?.frame(dt);
  renderGallery(t, dt);
  renderDetail(t, dt);
});
