// Eierhalle: Galerie aller Eier, Detailansicht zum Drehen und Schlüpf-Animation.
// Wie im Münzkabinett rendert ein einziges WebGL-Canvas alle Karten per Scissor-Test.

import * as THREE from 'three';
import { pixelRatio } from '../../js/settings.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { makeEnvironment, makeScene } from '../../muenzen/js/coinFactory.js';
import { EGGS, fmtPrice } from './eggs.js';
import { createEgg } from './eggFactory.js';
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
const renderer = new THREE.WebGLRenderer({ canvas: stage, antialias: true, alpha: true });
renderer.setPixelRatio(pixelRatio());
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.setClearColor(0x000000, 0);
const env = makeEnvironment(renderer);
const camera = new THREE.PerspectiveCamera(30, 0.8, 0.1, 60);
camera.position.set(0, 0.3, 10.5);
camera.lookAt(0, -0.15, 0);

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

let buildQueue = Promise.resolve();
function ensureBuilt(entry) {
  if (entry.obj || entry.building) return;
  entry.building = true;
  buildQueue = buildQueue.then(
    () =>
      new Promise((res) =>
        requestAnimationFrame(() => {
          entry.scene = makeScene(env);
          entry.obj = createEgg(entry.egg, { resolution: 768 });
          entry.scene.add(entry.obj.root);
          res();
        }),
      ),
  );
}

let overlayOpen = false;
const clock = new THREE.Clock();

// Unterkante der Navigation (js/nav.js); die Leiste klebt beim Scrollen oben
const navBottom = () => document.querySelector('.site-nav')?.getBoundingClientRect().bottom ?? 0;

function renderGallery(t, dt) {
  renderer.setScissorTest(false);
  renderer.clear();
  if (overlayOpen) return;
  renderer.setScissorTest(true);
  const H = stage.clientHeight;
  for (const entry of cards) {
    if (!entry.near) continue;
    ensureBuilt(entry);
    if (!entry.obj) continue;
    const r = entry.view.getBoundingClientRect();
    // nur unterhalb der klebenden Navigation zeichnen
    const top = Math.max(r.top, navBottom());
    if (r.bottom <= top || r.top > H || r.width === 0) continue;
    entry.spin += dt * (reducedMotion ? 0.1 : entry.hover ? 1.6 : 0.4);
    const o = entry.obj;
    o.spinner.rotation.y = entry.spin;
    o.spinner.rotation.z = reducedMotion ? 0 : Math.sin(t * 1.3 + entry.spin) * 0.035;
    o.update(reducedMotion ? 0 : t);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
    renderer.setViewport(r.left, H - r.bottom, r.width, r.height);
    renderer.setScissor(r.left, H - r.bottom, r.width, r.bottom - top);
    renderer.render(entry.scene, camera);
  }
}

// ── Detailansicht ────────────────────────────────────────────────────────────

const detail = document.getElementById('detail');
const detailCanvas = document.getElementById('detail-canvas');
let dRenderer, dCamera, dControls, dScene, dEgg, dData;

function openDetail(egg) {
  if (!dRenderer) {
    dRenderer = new THREE.WebGLRenderer({ canvas: detailCanvas, antialias: true, alpha: true });
    dRenderer.setPixelRatio(pixelRatio());
    dRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    dCamera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
    dControls = new OrbitControls(dCamera, detailCanvas);
    dControls.enableDamping = true;
    dControls.enablePan = false;
    dControls.minDistance = 4;
    dControls.maxDistance = 16;
    dControls.target.set(0, -0.15, 0);
    dScene = makeScene(makeEnvironment(dRenderer));
  }
  if (dEgg) {
    dScene.remove(dEgg.root);
    dEgg.dispose();
  }
  dData = egg;
  dEgg = createEgg(egg, { resolution: 1024 });
  dScene.add(dEgg.root);
  dCamera.position.set(0, 0.6, 10);
  dControls.update();

  detail.querySelector('.detail-panel').style.setProperty('--egg', egg.glow);
  document.getElementById('detail-rank').textContent = egg.rankName;
  document.getElementById('detail-name').textContent = egg.alias ? `${egg.name} (${egg.alias})` : egg.name;
  document.getElementById('detail-text').textContent = egg.text;
  document.getElementById('detail-price').textContent = fmtPrice(egg.price);
  document.getElementById('detail-avail').textContent = egg.availability;
  detail.hidden = false;
  overlayOpen = true;
  document.body.style.overflow = 'hidden';
  sizeDetail();
  detail.querySelector('.detail-close').focus();
}

function closeDetail() {
  detail.hidden = true;
  overlayOpen = false;
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
  renderGallery(t, dt);
  if (!detail.hidden && dEgg) {
    dEgg.spinner.rotation.y += dt * (reducedMotion ? 0 : 0.35);
    dEgg.update(reducedMotion ? 0 : t);
    dControls.update();
    dRenderer.render(dScene, dCamera);
  }
});
