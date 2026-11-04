// Münzrollen: Galerie aller Rollen, Detailansicht zum Drehen und Öffnen-Animation.
// Wie in der Eierhalle rendert ein einziges WebGL-Canvas alle Karten per Scissor-Test.
// Alles 1:1 wie in Roblox: RollBuilder und RollFx aus dem Installer (rollRoblox.js).

import * as THREE from 'three';
import { ROLLS, fmtPrice, tierChances } from './rolls.js';
import { createRobloxRoll, rollLua } from './rollRoblox.js';
import { orbitEgg } from '../../eier/js/eggRoblox.js';
import { rbxRenderer } from '../../muenzen/js/coinRoblox.js';
import { TIERS, tierById } from '../../muenzen/js/coins.js';
import { Opener } from './open.js';

await Promise.race([
  Promise.all([document.fonts.load('48px "Marcellus SC"'), document.fonts.load('700 40px "JetBrains Mono"')]),
  new Promise((r) => setTimeout(r, 2500)),
]).catch(() => {});

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const opener = new Opener(document.getElementById('open'));
// Zum Testen: mit #debug in der Adresse ist die Animation als window.opener erreichbar
if (location.hash === '#debug') window.rollOpener = opener;

const pct = (x) => (x >= 10 ? x.toFixed(0) : x >= 1 ? x.toFixed(1) : x.toFixed(2)).replace('.', ',') + ' %';
const guaranteeText = (roll) => (roll.guarantee ? `ab ${tierById[roll.guarantee].name}` : 'keine');
// Chancen-Leiste: Anteil jeder Stufe, darunter die seltenen Stufen mit Prozent
function oddsHtml(roll) {
  const ch = tierChances(roll);
  const bar = TIERS.map((t, i) => `<span style="--t:${t.color};flex:${ch[i]}" title="${t.name} ${pct(ch[i])}"></span>`).join('');
  const rare = TIERS.map((t, i) => [t, ch[i]]).slice(4);
  return `<div class="odds-bar" aria-hidden="true">${bar}</div>
    <ul class="odds-list" aria-label="Chance je Münze">${rare.map(([t, c]) => `<li style="--t:${t.color}">${t.name} ${pct(c)}</li>`).join('')}</ul>`;
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
        <div><dt>Inhalt</dt><dd>${roll.coins} Münzen</dd></div>
        <div><dt>Garantie</dt><dd>${guaranteeText(roll)}</dd></div>
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
  const entry = { roll, card, view: card.querySelector('.view'), obj: null, scene: null, near: false, hover: false, spin: Math.random() * 6 };
  card.addEventListener('pointerenter', () => (entry.hover = true));
  card.addEventListener('pointerleave', () => (entry.hover = false));
  entry.view.addEventListener('click', () => openDetail(roll));
  card.querySelector('.look-btn').addEventListener('click', () => openDetail(roll));
  card.querySelector('.open-btn').addEventListener('click', () => startOpen(roll));
  return entry;
});

// ── Galerie-Renderer ─────────────────────────────────────────────────────────

const stage = document.getElementById('stage');
const renderer = rbxRenderer(stage);
const camera = new THREE.PerspectiveCamera(35, 0.8, 0.1, 500);
let lua = null;
rollLua().then((l) => (lua = l)).catch((e) => console.error('Luau konnte nicht starten', e));

const resize = () => renderer.setSize(innerWidth, innerHeight, false);
addEventListener('resize', resize);
resize();

const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      const entry = cards.find((c) => c.view === e.target);
      entry.near = e.isIntersecting;
    }
  },
  { rootMargin: '600px 0px' },
);
cards.forEach((c) => io.observe(c.view));

// nacheinander bauen, damit der Hauptthread nicht hängt
let building = false;
async function buildNext() {
  if (building) return;
  const entry = cards.find((e) => e.near && !e.obj);
  if (!entry) return;
  building = true;
  try {
    entry.obj = await createRobloxRoll(entry.roll);
  } catch (err) {
    console.error('Rolle', entry.roll.id, err);
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
  for (const entry of cards) {
    if (!entry.near || !entry.obj) continue;
    const r = entry.view.getBoundingClientRect();
    // nur unterhalb der klebenden Navigation zeichnen
    const top = Math.max(r.top, navBottom());
    if (r.bottom <= top || r.top > H || r.width === 0) continue;
    entry.spin += dt * (reducedMotion ? 0 : entry.hover ? 1.6 : 0.4);
    entry.obj.step(dt);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
    orbitEgg(camera, entry.spin, 0.12, 15, 2.4);
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
  document.getElementById('detail-coins').textContent = `${roll.coins} Münzen`;
  document.getElementById('detail-guarantee').textContent = guaranteeText(roll);
  document.getElementById('detail-price').textContent = fmtPrice(roll.price);
  document.getElementById('detail-avail').textContent = roll.availability;
  document.getElementById('detail-odds').innerHTML = oddsHtml(roll);
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

async function startOpen(roll) {
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
