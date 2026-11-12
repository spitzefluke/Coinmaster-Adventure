// Aura-Galerie: Karten mit Filtern. Jede Vorschau ist eine kleine Roblox-Welt, in der die Module
// AuraData und AuraFx aus dem Installer laufen (auraRoblox.js). Ein WebGL-Canvas zeichnet alle
// sichtbaren Karten per Scissor-Test, die Detailansicht hat einen eigenen Renderer zum Drehen und Zoomen.

import * as THREE from 'three';
import { AURAS, THEMES, RARITIES, auraById, rarityById, themeById, bonusText, fmtPrice, TIER_FX, tierOf } from './auras.js';
import { createAuraPreview, auraLua } from './auraRoblox.js';
import { pixelRatio } from '../../js/settings.js';

const $ = (id) => document.getElementById(id);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

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
            <p class="meta"><span class="price">${fmtPrice(a.price)} Moneten</span><span class="bonus">${bonusText(a)}</span></p>
          </div>
          <button type="button" data-open="${a.id}" aria-label="${a.name} ansehen"></button>
        </article>`;
      }).join('')
    : '<p class="empty">Keine Aura passt zu diesem Filter.</p>';
  $('grid').querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', () => openDetail(auraById[b.dataset.open])));
  scan();
}

// ── Galerie-Renderer ──
function makeRenderer(canvas) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, stencil: true });
  r.setPixelRatio(pixelRatio());
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.NoToneMapping;
  r.shadowMap.enabled = true;
  r.shadowMap.type = THREE.PCFSoftShadowMap;
  r.setClearColor(0x000000, 0);
  return r;
}
// Kamera kreist vor der Figur (Roblox-Figuren schauen nach −Z)
function orbit(cam, yaw, pitch, dist) {
  cam.position.set(Math.sin(yaw) * Math.cos(pitch) * dist, 3.6 + Math.sin(pitch) * dist, -Math.cos(yaw) * Math.cos(pitch) * dist);
  cam.lookAt(0, 3.6, 0);
}
const stage = $('stage');
const renderer = makeRenderer(stage);
const camera = new THREE.PerspectiveCamera(40, 0.9, 0.1, 2000);
const resize = () => renderer.setSize(innerWidth, innerHeight, false);
addEventListener('resize', resize);
resize();
const navBottom = () => document.querySelector('.site-nav')?.getBoundingClientRect().bottom ?? 0;

const entries = new Map();
const io = new IntersectionObserver((list) => list.forEach((e) => {
  const en = entries.get(e.target);
  if (en) en.near = e.isIntersecting;
}), { rootMargin: '300px 0px' });
function scan() {
  const els = new Set(document.querySelectorAll('[data-aura-view]'));
  for (const [el, en] of entries) {
    if (els.has(el)) continue;
    io.unobserve(el);
    en.dead = true;
    en.obj?.dispose();
    entries.delete(el);
  }
  for (const el of els) {
    if (entries.has(el)) continue;
    const en = { aura: auraById[el.dataset.auraView], view: el, obj: null, near: false, hover: false, spin: 0 };
    const card = el.closest('.card');
    card.addEventListener('pointerenter', () => (en.hover = true));
    card.addEventListener('pointerleave', () => (en.hover = false));
    entries.set(el, en);
    io.observe(el);
  }
}
// Vorschauen nacheinander bauen, damit das Scrollen flüssig bleibt
let building = false;
async function buildNext() {
  if (building) return;
  const en = [...entries.values()].find((e) => e.near && !e.obj && !e.failed);
  if (!en) return;
  building = true;
  try {
    const obj = await createAuraPreview(en.aura);
    if (en.dead) obj.dispose();
    else en.obj = obj;
  } catch (err) {
    en.failed = true;
    console.error('Aura-Vorschau', en.aura.id, err);
  }
  building = false;
}

let overlay = false;
const clock = new THREE.Clock();
function renderGallery(t, dt) {
  renderer.setScissorTest(false);
  renderer.clear();
  if (overlay) return;
  buildNext();
  renderer.setScissorTest(true);
  const H = stage.clientHeight;
  for (const en of entries.values()) {
    if (!en.near || !en.obj) continue;
    const r = en.view.getBoundingClientRect();
    const top = Math.max(r.top, navBottom());
    if (r.bottom <= top || r.top > H || r.width === 0) continue;
    en.spin += reducedMotion ? 0 : dt * (en.hover ? 0.9 : 0.25);
    en.obj.step(reducedMotion ? 1 : t, dt);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
    orbit(camera, -0.5 + en.spin, 0.12, 17);
    renderer.setViewport(r.left, H - r.bottom, r.width, r.height);
    renderer.setScissor(r.left, H - r.bottom, r.width, r.bottom - top);
    en.obj.world.render(renderer, camera);
  }
}

// ── Detailansicht ──
const detail = $('detail');
const dCanvas = $('detail-canvas');
const dr = makeRenderer(dCanvas);
const d = { camera: new THREE.PerspectiveCamera(40, 1, 0.1, 2000), yaw: -0.5, pitch: 0.12, dist: 16, obj: null, drag: null, token: 0 };
dCanvas.addEventListener('pointerdown', (e) => {
  d.drag = { x: e.clientX, y: e.clientY };
  dCanvas.setPointerCapture(e.pointerId);
});
dCanvas.addEventListener('pointermove', (e) => {
  if (!d.drag) return;
  d.yaw += (e.clientX - d.drag.x) * 0.01;
  d.pitch = Math.max(-0.15, Math.min(1.2, d.pitch + (e.clientY - d.drag.y) * 0.006));
  d.drag = { x: e.clientX, y: e.clientY };
});
dCanvas.addEventListener('pointerup', () => (d.drag = null));
dCanvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  d.dist = Math.max(7, Math.min(32, d.dist + e.deltaY * 0.02));
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
  $('detail-price').textContent = `${fmtPrice(a.price)} Moneten`;
  $('detail-bonus').textContent = bonusText(a);
  $('detail-theme').textContent = themeById[a.theme].name;
  $('detail-parts').textContent = partsOf(a);
  $('detail-tiers').innerHTML = TIER_FX.slice(0, tierOf(a) + 1)
    .map((t, i) => `<li style="--r:${RARITIES[i].color}"><b>${RARITIES[i].name}</b>${t.add}</li>`).join('');
  d.obj?.dispose();
  d.obj = null;
  const token = ++d.token;
  createAuraPreview(a).then((obj) => {
    if (token === d.token && overlay) d.obj = obj;
    else obj.dispose();
  });
  Object.assign(d, { yaw: -0.5, pitch: 0.12, dist: 16 });
  detail.hidden = false;
  overlay = true;
  sizeDetail();
  history.replaceState(null, '', `#${a.id}`);
  detail.querySelector('.detail-close').focus();
}
function closeDetail() {
  detail.hidden = true;
  overlay = false;
  d.token++;
  d.obj?.dispose();
  d.obj = null;
  history.replaceState(null, '', location.pathname);
  lastFocus?.focus();
}
detail.addEventListener('click', (e) => e.target.closest('[data-close]') && closeDetail());
addEventListener('keydown', (e) => e.key === 'Escape' && !detail.hidden && closeDetail());

let lua = null;
auraLua().then((l) => (lua = l)).catch((e) => console.error('Luau konnte nicht starten', e));
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.1), t = clock.elapsedTime;
  lua?.frame(dt);
  renderGallery(t, dt);
  if (overlay && d.obj) {
    if (!d.drag && !reducedMotion) d.yaw += dt * 0.25;
    orbit(d.camera, d.yaw, d.pitch, d.dist);
    d.obj.step(reducedMotion ? 1 : t, dt);
    d.obj.world.render(dr, d.camera);
  }
});

$('tiers').innerHTML = TIER_FX.map((t, i) => `<li style="--r:${RARITIES[i].color}">
  <p class="tier-name"><span></span>${RARITIES[i].name}</p>
  <p class="tier-add">${i ? '+ ' : ''}${t.add}</p>
  <p class="tier-rbx">Roblox: ${t.rbx}</p></li>`).join('');
renderFilters();
renderGrid();
if (auraById[location.hash.slice(1)]) openDetail(auraById[location.hash.slice(1)]);
