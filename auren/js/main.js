// Aura-Galerie: Karten mit Filtern, ein WebGL-Canvas zeichnet alle sichtbaren Karten per Scissor-Test,
// die Detailansicht hat einen eigenen Renderer zum Drehen und Zoomen.

import * as THREE from 'three';
import { AURAS, THEMES, RARITIES, auraById, rarityById, themeById, bonusText, fmtPrice } from './auras.js';
import { createAura, setPointScale, TIER_FX, tierOf } from './auraFactory.js';
import { makeEnvironment, makeScene } from '../../haustiere/js/kit.js';
import { pixelRatio, loadSettings } from '../../js/settings.js';

const $ = (id) => document.getElementById(id);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const amount = () => (loadSettings().fewerParticles ? 0.45 : 1);

export const PARTS = {
  rise: 'Aufsteigende Teilchen', fall: 'Regen von oben', swirl: 'Wirbel', burst: 'Feuerwerk', orbit: 'Kreisende Dinge',
  ring: 'Bodenkreis', halo: 'Heiligenschein', crown: 'Krone', wings: 'Flügel', pillar: 'Lichtsäule', shell: 'Hülle',
  beams: 'Lichtbänder', bolts: 'Blitze', glitch: 'Glitch',
};
const partsOf = (a) => Object.keys(PARTS).filter((k) => a.look[k]).map((k) => PARTS[k]).join(', ');

// ── Filter und Karten ──
const filter = { theme: 'alle', rarity: 'alle' };
function renderFilters() {
  const btn = (kind, id, name, c) => `<button type="button" class="filter" data-${kind}="${id}" style="--c:${c}" aria-pressed="${filter[kind] === id}"><span></span>${name}</button>`;
  $('themes').innerHTML = btn('theme', 'alle', 'Alle Themen', '#d9b26a') + THEMES.map((t) => btn('theme', t.id, t.name, t.color)).join('');
  $('rarities').innerHTML = btn('rarity', 'alle', 'Alle Seltenheiten', '#d9b26a') + RARITIES.map((r) => btn('rarity', r.id, r.name, r.color)).join('');
  document.querySelectorAll('[data-theme],[data-rarity]').forEach((b) =>
    b.addEventListener('click', () => {
      if (b.dataset.theme) filter.theme = b.dataset.theme;
      else filter.rarity = b.dataset.rarity;
      renderFilters();
      renderGrid();
    }),
  );
}
function renderGrid() {
  const list = AURAS.filter((a) => (filter.theme === 'alle' || a.theme === filter.theme) && (filter.rarity === 'alle' || a.rarity === filter.rarity));
  $('count').textContent = `${list.length} von ${AURAS.length} Auras`;
  $('grid').innerHTML = list.length
    ? list.map((a) => {
        const r = rarityById[a.rarity];
        return `<article class="card" style="--r:${r.color};--a:${a.color}">
          <div class="view" data-aura-view="${a.id}"></div>
          <div class="card-info">
            <p class="pill">${r.name}</p>
            <h2>${a.name}</h2>
            <p class="meta"><span class="price">${fmtPrice(a.price)} Taler</span><span class="bonus">${bonusText(a)}</span></p>
          </div>
          <button type="button" data-open="${a.id}" aria-label="${a.name} ansehen"></button>
        </article>`;
      }).join('')
    : '<p class="empty">Keine Aura passt zu diesem Filter.</p>';
  $('grid').querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', () => openDetail(auraById[b.dataset.open])));
  scan();
}

// ── Galerie-Renderer ──
const stage = $('stage');
const renderer = new THREE.WebGLRenderer({ canvas: stage, antialias: true, alpha: true });
renderer.setPixelRatio(pixelRatio());
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.setClearColor(0x000000, 0);
const env = makeEnvironment(renderer);
const camera = new THREE.PerspectiveCamera(30, 0.9, 0.1, 60);
camera.position.set(0, 0.9, 8.6);
camera.lookAt(0, 0.35, 0);
const resize = () => renderer.setSize(innerWidth, innerHeight, false);
addEventListener('resize', resize);
resize();
const navBottom = () => document.querySelector('.site-nav')?.getBoundingClientRect().bottom ?? 0;

const entries = new Map();
const io = new IntersectionObserver((list) => list.forEach((e) => {
  const en = entries.get(e.target);
  if (en) en.near = e.isIntersecting;
}), { rootMargin: '400px 0px' });
function scan() {
  const els = new Set(document.querySelectorAll('[data-aura-view]'));
  for (const [el, en] of entries) {
    if (els.has(el)) continue;
    io.unobserve(el);
    en.obj?.dispose();
    entries.delete(el);
  }
  for (const el of els) {
    if (entries.has(el)) continue;
    const en = { aura: auraById[el.dataset.auraView], view: el, obj: null, scene: null, near: false, hover: false, spin: 0 };
    const card = el.closest('.card');
    card.addEventListener('pointerenter', () => (en.hover = true));
    card.addEventListener('pointerleave', () => (en.hover = false));
    entries.set(el, en);
    io.observe(el);
  }
}
function build(en) {
  en.scene = makeScene(env);
  en.obj = createAura(en.aura, { amount: amount() });
  en.scene.add(en.obj.root);
}

let overlay = false;
const clock = new THREE.Clock();
let builtThisFrame = 0;
function renderGallery(t, dt) {
  renderer.setScissorTest(false);
  renderer.clear();
  if (overlay) return;
  renderer.setScissorTest(true);
  const H = stage.clientHeight;
  builtThisFrame = 0;
  for (const en of entries.values()) {
    if (!en.near) continue;
    if (!en.obj) {
      if (builtThisFrame++ > 2) continue;
      build(en);
    }
    const r = en.view.getBoundingClientRect();
    const top = Math.max(r.top, navBottom());
    if (r.bottom <= top || r.top > H || r.width === 0) continue;
    en.spin += dt * (en.hover ? 1.2 : 0.3);
    en.obj.spinner.rotation.y = reducedMotion ? 0.4 : 0.4 + en.spin;
    en.obj.update(reducedMotion ? 1 : t);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
    setPointScale(r.height * renderer.getPixelRatio(), camera);
    renderer.setViewport(r.left, H - r.bottom, r.width, r.height);
    renderer.setScissor(r.left, H - r.bottom, r.width, r.bottom - top);
    renderer.render(en.scene, camera);
  }
}

// ── Detailansicht ──
const detail = $('detail');
const dCanvas = $('detail-canvas');
const dr = new THREE.WebGLRenderer({ canvas: dCanvas, antialias: true, alpha: true });
dr.setPixelRatio(pixelRatio());
dr.toneMapping = THREE.ACESFilmicToneMapping;
const d = { camera: new THREE.PerspectiveCamera(30, 1, 0.1, 80), scene: makeScene(makeEnvironment(dr)), yaw: 0.4, pitch: 0.1, dist: 10.5, obj: null, drag: null };
dCanvas.addEventListener('pointerdown', (e) => {
  d.drag = { x: e.clientX, y: e.clientY };
  dCanvas.setPointerCapture(e.pointerId);
});
dCanvas.addEventListener('pointermove', (e) => {
  if (!d.drag) return;
  d.yaw += (e.clientX - d.drag.x) * 0.01;
  d.pitch = Math.max(-0.2, Math.min(1.1, d.pitch + (e.clientY - d.drag.y) * 0.006));
  d.drag = { x: e.clientX, y: e.clientY };
});
dCanvas.addEventListener('pointerup', () => (d.drag = null));
dCanvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  d.dist = Math.max(5, Math.min(18, d.dist + e.deltaY * 0.01));
}, { passive: false });
function sizeDetail() {
  const box = dCanvas.parentElement.getBoundingClientRect();
  dr.setSize(box.width, box.height, false);
  d.camera.aspect = box.width / Math.max(1, box.height);
  d.camera.updateProjectionMatrix();
}
addEventListener('resize', () => overlay && sizeDetail());

let lastFocus = null;
function openDetail(a) {
  const r = rarityById[a.rarity];
  lastFocus = document.activeElement;
  detail.querySelector('.detail-panel').style.cssText = `--r:${r.color};--a:${a.color}`;
  $('detail-rarity').textContent = r.name;
  $('detail-name').textContent = a.name;
  $('detail-text').textContent = a.text;
  $('detail-price').textContent = `${fmtPrice(a.price)} Taler`;
  $('detail-bonus').textContent = bonusText(a);
  $('detail-theme').textContent = themeById[a.theme].name;
  $('detail-parts').textContent = partsOf(a);
  $('detail-tiers').innerHTML = TIER_FX.slice(0, tierOf(a) + 1)
    .map((t, i) => `<li style="--r:${RARITIES[i].color}"><b>${RARITIES[i].name}</b>${t.add}</li>`).join('');
  if (d.obj) {
    d.scene.remove(d.obj.root);
    d.obj.dispose();
  }
  d.obj = createAura(a, { amount: amount() });
  d.scene.add(d.obj.root);
  Object.assign(d, { yaw: 0.4, pitch: 0.1, dist: 10.5 });
  detail.hidden = false;
  overlay = true;
  sizeDetail();
  history.replaceState(null, '', `#${a.id}`);
  detail.querySelector('.detail-close').focus();
}
function closeDetail() {
  detail.hidden = true;
  overlay = false;
  if (d.obj) {
    d.scene.remove(d.obj.root);
    d.obj.dispose();
    d.obj = null;
  }
  history.replaceState(null, '', location.pathname);
  lastFocus?.focus();
}
detail.addEventListener('click', (e) => e.target.closest('[data-close]') && closeDetail());
addEventListener('keydown', (e) => e.key === 'Escape' && !detail.hidden && closeDetail());

renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.1), t = clock.elapsedTime;
  renderGallery(t, dt);
  if (overlay && d.obj) {
    if (!d.drag && !reducedMotion) d.yaw += dt * 0.3;
    const c = d.camera;
    c.position.set(Math.sin(d.yaw) * Math.cos(d.pitch) * d.dist, 0.35 + Math.sin(d.pitch) * d.dist, Math.cos(d.yaw) * Math.cos(d.pitch) * d.dist);
    c.lookAt(0, 0.35, 0);
    setPointScale(dCanvas.height, c);
    d.obj.update(reducedMotion ? 1 : t);
    dr.render(d.scene, c);
  }
});

$('tiers').innerHTML = TIER_FX.map((t, i) => `<li style="--r:${RARITIES[i].color}">
  <p class="tier-name"><span></span>${RARITIES[i].name}</p>
  <p class="tier-add">${i ? '+ ' : ''}${t.add}</p>
  <p class="tier-rbx">Roblox: ${t.rbx}</p></li>`).join('');
renderFilters();
renderGrid();
if (auraById[location.hash.slice(1)]) openDetail(auraById[location.hash.slice(1)]);
