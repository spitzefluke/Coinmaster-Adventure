// Eierhalle: Galerie aller Eier, Detailansicht zum Drehen und Schlüpf-Animation.
// Wie im Münzkabinett rendert ein einziges WebGL-Canvas alle Karten per Scissor-Test.
// Alles 1:1 wie in Roblox: EggBuilder und HatchFx aus dem Installer (eggRoblox.js, Luau in roblox/js/eggLuau.js).

import * as THREE from 'three';
import { EGGS, fmtPrice } from './eggs.js';
import { EGG_EXTRAS, EGG_THEMES } from '../../roblox/js/eggLuau.js';
import { createRobloxEgg, eggLua, orbitEgg } from './eggRoblox.js';
import { rbxRenderer } from '../../muenzen/js/coinRoblox.js';
import { Hatch } from './hatch.js';

await Promise.race([
  Promise.all([document.fonts.load('48px "Marcellus SC"'), document.fonts.load('700 40px "JetBrains Mono"')]),
  new Promise((r) => setTimeout(r, 2500)),
]).catch(() => {});

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const hatch = new Hatch(document.getElementById('hatch'));
// Zum Testen: mit #debug in der Adresse ist die Animation als window.hatch erreichbar
if (location.hash === '#debug') window.hatch = hatch;

// ── Karten ───────────────────────────────────────────────────────────────────

const list = document.getElementById('eggs');
const cards = EGGS.map((egg) => {
  const card = document.createElement('article');
  card.className = 'card';
  card.style.setProperty('--egg', egg.glow);
  card.style.setProperty('--rank', egg.rank);
  card.innerHTML = `
    <button class="view" type="button" aria-label="${egg.name} ansehen"></button>
    <div class="card-body">
      <p class="rank-pill">${egg.rankName}</p>
      <h2 class="card-name">${egg.name}${egg.alias ? ` <span class="alias">${egg.alias}</span>` : ''}</h2>
      <p class="card-text">${egg.text}</p>
      <ul class="extras" aria-label="Neu an diesem Ei">${(EGG_EXTRAS[egg.id] || []).map((x) => `<li>${x}</li>`).join('')}</ul>
      <dl class="card-facts">
        <div><dt>Preis</dt><dd class="${egg.price ? '' : 'is-locked'}">${fmtPrice(egg.price)}</dd></div>
        <div><dt>Erhältlich</dt><dd>${egg.availability}</dd></div>
      </dl>
      <div class="card-actions">
        <button class="hatch-btn" type="button">Schlüpfen lassen</button>
        <button class="look-btn" type="button">Ansehen</button>
      </div>
    </div>`;
  list.append(card);
  const entry = { egg, card, view: card.querySelector('.view'), obj: null, scene: null, near: false, hover: false, spin: Math.random() * 6 };
  card.addEventListener('pointerenter', () => (entry.hover = true));
  card.addEventListener('pointerleave', () => (entry.hover = false));
  entry.view.addEventListener('click', () => openDetail(egg));
  card.querySelector('.look-btn').addEventListener('click', () => openDetail(egg));
  card.querySelector('.hatch-btn').addEventListener('click', () => startHatch(egg));
  return entry;
});

// ── Galerie-Renderer ─────────────────────────────────────────────────────────

const stage = document.getElementById('stage');
const renderer = rbxRenderer(stage);
const camera = new THREE.PerspectiveCamera(35, 0.8, 0.1, 500);
let lua = null;
eggLua().then((l) => (lua = l)).catch((e) => console.error('Luau konnte nicht starten', e));

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
    entry.obj = await createRobloxEgg(entry.egg);
  } catch (err) {
    console.error('Ei', entry.egg.id, err);
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
    orbitEgg(camera, entry.spin, 0.14, 15, 2.6);
    renderer.setViewport(r.left, H - r.bottom, r.width, r.height);
    renderer.setScissor(r.left, H - r.bottom, r.width, r.bottom - top);
    entry.obj.world.render(renderer, camera);
  }
}

// ── Detailansicht ────────────────────────────────────────────────────────────

const detail = document.getElementById('detail');
const detailCanvas = document.getElementById('detail-canvas');
let dRenderer, dCamera, dEgg, dData, dToken = 0;
const view = { angle: 0, tilt: 0.12, dist: 15, drag: null };

function openDetail(egg) {
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
      view.dist = Math.max(8, Math.min(26, view.dist + e.deltaY * 0.02));
    }, { passive: false });
  }
  dEgg?.dispose();
  dEgg = null;
  dData = egg;
  const token = ++dToken;
  createRobloxEgg(egg, { stage: true, shadows: true }).then((o) => {
    if (token !== dToken || detail.hidden) return o.dispose();
    dEgg = o;
  });
  Object.assign(view, { angle: -0.6, tilt: 0.24, dist: 21 });

  const panel = detail.querySelector('.detail-panel');
  const theme = EGG_THEMES[egg.id] || EGG_THEMES.normal;
  panel.style.setProperty('--egg', egg.glow);
  panel.style.setProperty('--world-bg', theme.bg);
  panel.style.setProperty('--world-glow', theme.glow);
  document.getElementById('detail-rank').textContent = egg.rankName;
  document.getElementById('detail-name').textContent = egg.alias ? `${egg.name} (${egg.alias})` : egg.name;
  document.getElementById('detail-text').textContent = egg.text;
  document.getElementById('detail-price').textContent = fmtPrice(egg.price);
  document.getElementById('detail-avail').textContent = egg.availability;
  document.getElementById('detail-extras').textContent = (EGG_EXTRAS[egg.id] || []).join(', ');
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
  dEgg?.dispose();
  dEgg = null;
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
const stepDetail = (dir) => openDetail(EGGS[(EGGS.indexOf(dData) + dir + EGGS.length) % EGGS.length]);
document.getElementById('detail-prev').addEventListener('click', () => stepDetail(-1));
document.getElementById('detail-next').addEventListener('click', () => stepDetail(1));
document.getElementById('detail-hatch').addEventListener('click', () => {
  closeDetail();
  startHatch(dData);
});

async function startHatch(egg) {
  overlayOpen = true;
  await hatch.play(egg);
  overlayOpen = !detail.hidden;
}

// ── Schleife ─────────────────────────────────────────────────────────────────

renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.1);
  const t = clock.elapsedTime;
  // während des Schlüpfens treibt die Schlüpf-Ansicht die Lua-Zeit an
  if (hatch.el.hidden) lua?.frame(dt);
  renderGallery(t, dt);
  if (!detail.hidden && dEgg) {
    if (!view.drag && !reducedMotion) view.angle += dt * 0.35;
    dEgg.step(dt);
    orbitEgg(dCamera, view.angle, view.tilt, view.dist, 2.3);
    dEgg.world.render(dRenderer, dCamera);
  }
});
