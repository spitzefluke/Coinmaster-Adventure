// Haustier-Seite: Filter nach Ei, je Ei fünf normale und zwei epische Karten, Detailansicht und
// Export für Blender. Die 3D-Darstellung übernimmt gallery.js (ein Canvas für alle Karten).

import { EGGS, PETS, petById, fmtChance } from './pets.js';
import { createGallery } from './gallery.js';

const gallery = createGallery(document.getElementById('stage'));
let filter = 'alle';

// Farbe mit Deckkraft als Hex (#rrggbbaa)
const alpha = (hex, a) => hex + Math.round(a * 255).toString(16).padStart(2, '0');

// ── Filter ──
const filtersEl = document.getElementById('filters');
function renderFilters() {
  filtersEl.innerHTML = [{ id: 'alle', name: 'Alle Eier', glow: '#d9b26a' }, ...EGGS]
    .map((e) => `<button type="button" class="filter" data-egg="${e.id}" style="--glow:${e.glow}" aria-pressed="${filter === e.id}"><span></span>${e.name}</button>`)
    .join('');
  filtersEl.querySelectorAll('button').forEach((b) =>
    b.addEventListener('click', () => {
      filter = b.dataset.egg;
      renderFilters();
      renderSections();
    }),
  );
}

// ── Karten ──
const card = (p) => `
  <article class="pet-card" data-pet-card style="--glow:${p.glow};--border:${alpha(p.glow, 0.28)};--tint:${alpha(p.glow, 0.1)}">
    <button type="button" class="pet-view" data-pet-view="${p.id}" data-open="${p.id}" aria-label="${p.name} ansehen"></button>
    <div class="pet-body">
      <p class="tier-pill is-normal">Normal</p>
      <h3>${p.name}</h3>
      <p class="pet-text">${p.text}</p>
      <dl class="facts"><div><dt>Chance</dt><dd>${fmtChance(p.chance)}</dd></div><div><dt>Ei</dt><dd>${p.eggName}</dd></div></dl>
    </div>
  </article>`;

const epicCard = (p) => `
  <article class="pet-card is-epic" data-pet-card style="--glow:${p.glow};--border:${alpha(p.glow, 0.55)};--tint:${alpha(p.glow, 0.2)}">
    <button type="button" class="pet-view" data-pet-view="${p.id}" data-open="${p.id}" aria-label="${p.name} ansehen"></button>
    <div class="pet-body">
      <p class="tier-pill is-epic">Episch</p>
      <h3>${p.name}</h3>
      <p class="pet-text">${p.text}</p>
      <dl class="facts"><div><dt>Chance</dt><dd class="glow-text">${fmtChance(p.chance)}</dd></div><div><dt>Ei</dt><dd>${p.eggName}</dd></div></dl>
      <button type="button" class="look-btn" data-open="${p.id}">Ansehen</button>
    </div>
  </article>`;

const sectionsEl = document.getElementById('sections');
function renderSections() {
  sectionsEl.innerHTML = EGGS.filter((e) => filter === 'alle' || filter === e.id)
    .map((e) => {
      const pets = PETS.filter((p) => p.egg === e.id);
      return `<section class="egg-section" style="--glow:${e.glow}">
        <header class="egg-head">
          <h2>${e.name}</h2>
          <p class="rank-pill">${e.rankName}</p>
          <p class="egg-meta">7 Haustiere · 2 episch · ${e.price}</p>
        </header>
        <div class="pet-grid">${pets.filter((p) => !p.epic).map(card).join('')}</div>
        <div class="epic-grid">${pets.filter((p) => p.epic).map(epicCard).join('')}</div>
      </section>`;
    })
    .join('');
  sectionsEl.querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', () => openDetail(b.dataset.open)));
  gallery.scan();
}

// ── Detail ──
const detail = document.getElementById('detail');
let current = null;
function openDetail(id) {
  const p = petById[id];
  current = p;
  const panel = detail.querySelector('.detail-panel');
  panel.style.setProperty('--glow', p.glow);
  panel.style.setProperty('--tint', alpha(p.glow, 0.2));
  document.getElementById('detail-tier').textContent = p.epic ? 'Episch' : 'Normal';
  document.getElementById('detail-name').textContent = p.name;
  document.getElementById('detail-text').textContent = p.text;
  document.getElementById('detail-chance').textContent = fmtChance(p.chance);
  document.getElementById('detail-egg').textContent = p.eggName;
  detail.hidden = false;
  document.body.style.overflow = 'hidden';
  gallery.openDetail(p, document.getElementById('detail-canvas'));
  detail.querySelector('.detail-close').focus();
}
function closeDetail() {
  detail.hidden = true;
  document.body.style.overflow = '';
  gallery.closeDetail();
}
detail.addEventListener('click', (e) => e.target.closest('[data-close]') && closeDetail());
addEventListener('keydown', (e) => e.key === 'Escape' && !detail.hidden && closeDetail());

// ── Export für Blender ──
let exporting = false;
async function runExport(btn, fn) {
  if (exporting) return;
  exporting = true;
  const label = btn.textContent;
  btn.textContent = 'Exportiere …';
  btn.disabled = true;
  try {
    await fn(await import('./exportGlb.js'));
  } catch (e) {
    console.error('Export', e);
    btn.textContent = 'Export fehlgeschlagen';
    await new Promise((r) => setTimeout(r, 2000));
  }
  btn.textContent = label;
  btn.disabled = false;
  exporting = false;
}
document.getElementById('export-all').addEventListener('click', (e) => runExport(e.currentTarget, (m) => m.exportAll()));
document.getElementById('export-one').addEventListener('click', (e) => current && runExport(e.currentTarget, (m) => m.exportPet(current)));

// ── Stil: Roblox (Standard) oder Original ──
const STYLE_KEY = 'coinmaster.haustiere.stil';
function setStyle(id) {
  gallery.setStyle(id);
  document.querySelectorAll('[data-style]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.style === id)));
  try {
    localStorage.setItem(STYLE_KEY, id);
  } catch {}
}
document.querySelectorAll('[data-style]').forEach((b) => b.addEventListener('click', () => setStyle(b.dataset.style)));
try {
  const saved = localStorage.getItem(STYLE_KEY);
  if (saved === 'orig' || saved === 'rbx') setStyle(saved);
} catch {}

// Direkt zu einem Ei springen, z. B. haustiere/#galaxie
const fromHash = location.hash.slice(1);
if (EGGS.some((e) => e.id === fromHash)) filter = fromHash;
renderFilters();
renderSections();
