// Münzrollen: Galerie aller Rollen, Detailansicht zum Drehen und Öffnen-Animation.
// Die Rollen kosten Taler aus dem Münzbaumgarten, der Inhalt landet dort im Inventar.
// Wie in der Eierhalle rendert ein einziges WebGL-Canvas alle Karten per Scissor-Test.
// Alles 1:1 wie in Roblox: RollBuilder und RollFx aus dem Installer (rollRoblox.js).

import * as THREE from 'three';
import { ROLLS, fmtPrice, rollChances } from './rolls.js';
import { createRobloxRoll, createRobloxLoot, rollLua } from './rollRoblox.js';
import { orbitEgg } from '../../eier/js/eggRoblox.js';
import { rbxRenderer } from '../../muenzen/js/coinRoblox.js';
import { RARITIES, LOOT, rarityById, loadState, fmt, fmtTime } from '../../garten/js/garden.js';
import { Opener, canPay } from './open.js';

await Promise.race([
  Promise.all([document.fonts.load('48px "Marcellus SC"'), document.fonts.load('700 40px "JetBrains Mono"')]),
  new Promise((r) => setTimeout(r, 2500)),
]).catch(() => {});

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const opener = new Opener(document.getElementById('open'));
// Zum Testen: mit #debug in der Adresse ist die Animation als window.opener erreichbar
if (location.hash === '#debug') window.rollOpener = opener;

const pct = (x) => (x >= 10 ? x.toFixed(0) : x >= 1 ? x.toFixed(1) : x.toFixed(2)).replace('.', ',') + '\u00a0%';
const guaranteeText = (roll) => (roll.guarantee ? rarityById[roll.guarantee].name : 'Gewöhnlich');
// Chancen-Leiste: Anteil jeder möglichen Seltenheit, darunter mit Prozent
function oddsHtml(roll) {
  const ch = rollChances(roll);
  const bar = RARITIES.map((t, i) => `<span style="--t:${t.color};flex:${ch[i]}" title="${t.name} ${pct(ch[i])}"></span>`).join('');
  const rare = RARITIES.map((t, i) => [t, ch[i]]).filter(([, c]) => c > 0);
  return `<div class="odds-bar" aria-hidden="true">${bar}</div>
    <ul class="odds-list" aria-label="Chance je Sache">${rare.map(([t, c]) => `<li style="--t:${t.color}">${t.name} ${pct(c)}</li>`).join('')}</ul>`;
}

// ── Karten ───────────────────────────────────────────────────────────────────

const list = document.getElementById('rolls');
const cards = ROLLS.map((roll) => {
  const card = document.createElement('article');
  card.className = 'card';
  card.style.setProperty('--roll', roll.glow);
  card.style.setProperty('--rank', roll.rank);
  card.innerHTML = `
    <button class="view" type="button" aria-label="${roll.name} ansehen"></button>
    <div class="card-body">
      <p class="rank-pill">${roll.rankName}</p>
      <h2 class="card-name">${roll.name}${roll.alias ? ` <span class="alias">${roll.alias}</span>` : ''}</h2>
      <p class="card-text">${roll.text}</p>
      <dl class="card-facts">
        <div><dt>Inhalt</dt><dd>1 Sache</dd></div>
        <div><dt>Mindestens</dt><dd>${guaranteeText(roll)}</dd></div>
        <div><dt>Preis</dt><dd class="${roll.price ? '' : 'is-locked'}">${fmtPrice(roll.price)}</dd></div>
        <div><dt>Glück</dt><dd>×${String(roll.luck).replace('.', ',')}</dd></div>
      </dl>
      <div class="odds">${oddsHtml(roll)}</div>
      <div class="card-actions">
        <button class="open-btn" type="button">Aufreißen</button>
        <button class="look-btn" type="button">Ansehen</button>
      </div>
    </div>`;
  list.append(card);
  const entry = { roll, card, view: card.querySelector('.view'), obj: null, near: false, hover: false, spin: Math.random() * 6, make: () => createRobloxRoll(roll), cam: { dist: 15, y: 2.4 } };
  card.addEventListener('pointerenter', () => (entry.hover = true));
  card.addEventListener('pointerleave', () => (entry.hover = false));
  entry.view.addEventListener('click', () => openDetail(roll));
  card.querySelector('.look-btn').addEventListener('click', () => openDetail(roll));
  card.querySelector('.open-btn').addEventListener('click', () => startOpen(roll));
  return entry;
});

// ── Was in den Rollen steckt: alle Schätze als 3D-Vorschau ───────────────────

// Kamera je Form: Bäume sind größer als Werkzeug
const LOOT_CAM = { bush: { dist: 10, y: 2 }, palm: { dist: 19, y: 4.2 }, cone: { dist: 13.5, y: 3.4 }, oval: { dist: 16, y: 4.4 }, weeping: { dist: 15, y: 3.6 }, spade: { dist: 8.5, y: 1.8 }, chest: { dist: 7, y: 1 } };
const lootCam = (item) => (item.big ? { dist: 19, y: 4.6 } : LOOT_CAM[item.crown || item.model] || (item.type === 'tree' ? { dist: 15, y: 3.8 } : { dist: 7.5, y: 1.2 }));
// Chance einer Sache in einer Rolle: Chance ihrer Seltenheit geteilt durch die Anzahl Sachen dieser Seltenheit
const poolSize = Object.fromEntries(RARITIES.map((r) => [r.id, LOOT.filter((l) => l.rarity === r.id).length]));
const itemChance = (roll, item) => rollChances(roll)[rarityById[item.rarity].index] / poolSize[item.rarity];
const lootInfo = (item) => (item.type === 'tree' ? `${fmt(item.yield)} Taler alle ${fmtTime(item.cycle)}, wächst ${fmtTime(item.grow)}. ${item.text}` : item.text);

const lootList = document.getElementById('loot');
const sortedLoot = [...LOOT].sort((a, b) => rarityById[a.rarity].index - rarityById[b.rarity].index || (a.type === b.type ? 0 : a.type === 'tree' ? -1 : 1));
const lootCards = sortedLoot.map((item) => {
  const rar = rarityById[item.rarity];
  const card = document.createElement('article');
  card.className = 'loot-card';
  card.style.setProperty('--t', rar.color);
  card.innerHTML = `
    <div class="loot-view view" role="img" aria-label="${item.name} in 3D"></div>
    <div class="loot-body">
      <p class="loot-kind">${rar.name} · ${item.type === 'tree' ? 'Münzbaum' : 'Werkzeug'}</p>
      <h3 class="loot-name">${item.name}</h3>
      <p class="loot-text">${lootInfo(item)}</p>
      <p class="loot-chance"></p>
    </div>`;
  lootList.append(card);
  const entry = { item, card, view: card.querySelector('.loot-view'), obj: null, near: false, hover: false, spin: Math.random() * 6, make: () => createRobloxLoot(item), cam: lootCam(item) };
  card.addEventListener('pointerenter', () => (entry.hover = true));
  card.addEventListener('pointerleave', () => (entry.hover = false));
  return entry;
});

// Filter: Chancen für eine Rolle oder Überblick, in welchen Rollen eine Sache vorkommt
let lootRoll = null;
const SHORT = { kupfer: 'Kupfer', silber: 'Silber', gold: 'Gold', juwel: 'Juwelen', stern: 'Sterne' };
const filter = document.getElementById('loot-filter');
filter.innerHTML = [`<button type="button" data-roll="">Alle Rollen</button>`, ...ROLLS.map((r) => `<button type="button" data-roll="${r.id}" style="--t:${r.glow}">${r.name}</button>`)].join('');
function renderLootChances() {
  for (const b of filter.children) b.setAttribute('aria-pressed', String((b.dataset.roll || null) === (lootRoll?.id ?? null)));
  for (const { item, card } of lootCards) {
    const el = card.querySelector('.loot-chance');
    if (lootRoll) {
      const c = itemChance(lootRoll, item);
      card.classList.toggle('is-out', c === 0);
      el.textContent = c > 0 ? `Chance: ${pct(c)}` : `Nicht in der ${lootRoll.name}`;
    } else {
      card.classList.remove('is-out');
      const where = ROLLS.filter((r) => itemChance(r, item) > 0);
      el.textContent = where.length === ROLLS.length ? 'In allen Rollen' : `In: ${where.map((r) => SHORT[r.id] || r.name).join(', ')}`;
    }
  }
}
filter.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  lootRoll = ROLLS.find((r) => r.id === b.dataset.roll) || null;
  renderLootChances();
});
renderLootChances();

// ── Galerie-Renderer ─────────────────────────────────────────────────────────

const stage = document.getElementById('stage');
const renderer = rbxRenderer(stage);
const camera = new THREE.PerspectiveCamera(35, 0.8, 0.1, 500);
let lua = null;
rollLua().then((l) => (lua = l)).catch((e) => console.error('Luau konnte nicht starten', e));

const resize = () => renderer.setSize(innerWidth, innerHeight, false);
addEventListener('resize', resize);
resize();

const allCards = [...cards, ...lootCards];
const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      const entry = allCards.find((c) => c.view === e.target);
      entry.near = e.isIntersecting;
    }
  },
  { rootMargin: '600px 0px' },
);
allCards.forEach((c) => io.observe(c.view));

// nacheinander bauen, damit der Hauptthread nicht hängt
let building = false;
async function buildNext() {
  if (building) return;
  const entry = allCards.find((e) => e.near && !e.obj);
  if (!entry) return;
  building = true;
  try {
    entry.obj = await entry.make();
  } catch (err) {
    console.error('Vorschau', (entry.roll || entry.item).id, err);
    entry.obj = { failed: true };
  }
  building = false;
}

let overlayOpen = false;
const clock = new THREE.Clock();

// Unterkante der Navigation (js/nav.js); die Leiste klebt beim Scrollen oben
const navBottom = () => document.querySelector('.site-nav')?.getBoundingClientRect().bottom ?? 0;

function renderGallery(t, dt) {
  renderer.setScissorTest(false);
  renderer.clear();
  if (overlayOpen) return;
  buildNext();
  renderer.setScissorTest(true);
  const H = stage.clientHeight;
  for (const entry of allCards) {
    if (!entry.near || !entry.obj || entry.obj.failed) continue;
    const r = entry.view.getBoundingClientRect();
    // nur unterhalb der klebenden Navigation zeichnen
    const top = Math.max(r.top, navBottom());
    if (r.bottom <= top || r.top > H || r.width === 0) continue;
    entry.spin += dt * (reducedMotion ? 0 : entry.hover ? 1.6 : 0.4);
    entry.obj.step(dt);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
    orbitEgg(camera, entry.spin, 0.12, entry.cam.dist, entry.cam.y);
    renderer.setViewport(r.left, H - r.bottom, r.width, r.height);
    renderer.setScissor(r.left, H - r.bottom, r.width, r.bottom - top);
    entry.obj.world.render(renderer, camera);
  }
}

// ── Detailansicht ────────────────────────────────────────────────────────────

const detail = document.getElementById('detail');
const detailCanvas = document.getElementById('detail-canvas');
let dRenderer, dCamera, dRoll, dData, dToken = 0;
const view = { angle: 0, tilt: 0.12, dist: 15, drag: null };

function openDetail(roll) {
  if (!dRenderer) {
    dRenderer = rbxRenderer(detailCanvas);
    dCamera = new THREE.PerspectiveCamera(35, 1, 0.1, 500);
    detailCanvas.addEventListener('pointerdown', (e) => {
      view.drag = { x: e.clientX, y: e.clientY };
      detailCanvas.setPointerCapture(e.pointerId);
    });
    detailCanvas.addEventListener('pointermove', (e) => {
      if (!view.drag) return;
      view.angle -= (e.clientX - view.drag.x) * 0.01;
      view.tilt = Math.max(-0.2, Math.min(1.1, view.tilt + (e.clientY - view.drag.y) * 0.006));
      view.drag = { x: e.clientX, y: e.clientY };
    });
    detailCanvas.addEventListener('pointerup', () => (view.drag = null));
    detailCanvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      view.dist = Math.max(7, Math.min(30, view.dist + e.deltaY * 0.02));
    }, { passive: false });
  }
  dRoll?.dispose();
  dRoll = null;
  dData = roll;
  const token = ++dToken;
  createRobloxRoll(roll).then((o) => {
    if (token !== dToken || detail.hidden) return o.dispose();
    dRoll = o;
  });
  Object.assign(view, { angle: 0, tilt: 0.12, dist: 15 });

  detail.querySelector('.detail-panel').style.setProperty('--roll', roll.glow);
  document.getElementById('detail-rank').textContent = roll.rankName;
  document.getElementById('detail-name').textContent = roll.alias ? `${roll.name} (${roll.alias})` : roll.name;
  document.getElementById('detail-text').textContent = roll.text;
  document.getElementById('detail-coins').textContent = '1 Sache';
  document.getElementById('detail-guarantee').textContent = guaranteeText(roll);
  document.getElementById('detail-price').textContent = fmtPrice(roll.price);
  document.getElementById('detail-avail').textContent = roll.availability;
  document.getElementById('detail-odds').innerHTML = oddsHtml(roll);
  refreshWallet();
  detail.hidden = false;
  overlayOpen = true;
  document.body.style.overflow = 'hidden';
  sizeDetail();
  detail.querySelector('.detail-close').focus();
}

function closeDetail() {
  detail.hidden = true;
  overlayOpen = false;
  dToken++;
  dRoll?.dispose();
  dRoll = null;
  document.body.style.overflow = '';
}

function sizeDetail() {
  const box = detailCanvas.parentElement.getBoundingClientRect();
  dRenderer.setSize(box.width, box.height, false);
  dCamera.aspect = box.width / Math.max(1, box.height);
  dCamera.updateProjectionMatrix();
}
addEventListener('resize', () => !detail.hidden && sizeDetail());
detail.addEventListener('click', (e) => e.target.closest('[data-close]') && closeDetail());
addEventListener('keydown', (e) => {
  if (detail.hidden) return;
  if (e.key === 'Escape') closeDetail();
  else if (e.key === 'ArrowRight') stepDetail(1);
  else if (e.key === 'ArrowLeft') stepDetail(-1);
});
const stepDetail = (dir) => openDetail(ROLLS[(ROLLS.indexOf(dData) + dir + ROLLS.length) % ROLLS.length]);
document.getElementById('detail-prev').addEventListener('click', () => stepDetail(-1));
document.getElementById('detail-next').addEventListener('click', () => stepDetail(1));
document.getElementById('detail-open').addEventListener('click', () => {
  closeDetail();
  startOpen(dData);
});

// Taler-Anzeige und Knöpfe, die mehr kosten als man hat
const wallet = document.getElementById('wallet');
function refreshWallet(state = loadState()) {
  wallet.textContent = fmt(state.taler);
  for (const c of cards) {
    const btn = c.card.querySelector('.open-btn');
    btn.disabled = !canPay(c.roll, state);
    btn.textContent = btn.disabled ? 'Zu wenig Taler' : 'Aufreißen';
  }
  const d = document.getElementById('detail-open');
  if (dData) {
    d.disabled = !canPay(dData, state);
    d.textContent = d.disabled ? 'Zu wenig Taler' : 'Aufreißen';
  }
}
opener.onChange = refreshWallet;
addEventListener('pageshow', () => refreshWallet());
addEventListener('storage', () => refreshWallet());
refreshWallet();

async function startOpen(roll) {
  if (!canPay(roll)) return;
  overlayOpen = true;
  await opener.play(roll);
  overlayOpen = !detail.hidden;
}

// ── Schleife ─────────────────────────────────────────────────────────────────

renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.1);
  const t = clock.elapsedTime;
  // während des Öffnens treibt die Öffnen-Ansicht die Lua-Zeit an
  if (opener.el.hidden) lua?.frame(dt);
  renderGallery(t, dt);
  if (!detail.hidden && dRoll) {
    if (!view.drag && !reducedMotion) view.angle += dt * 0.35;
    dRoll.step(dt);
    orbitEgg(dCamera, view.angle, view.tilt, view.dist, 2.4);
    dRoll.world.render(dRenderer, dCamera);
  }
});
