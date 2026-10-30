// Münzindex: Sammelbuch mit 50 Plätzen, Ziehen nach Drop-Chance und Entdeckungs-Animation.
// Fortschritt liegt im localStorage dieses Browsers (Spielvorschau, kein Server).

import * as THREE from 'three';
import { TIERS, COINS, tierById, rollCoin } from '../../muenzen/js/coins.js';
import { createCoin, makeEnvironment, makeScene } from '../../muenzen/js/coinFactory.js';
import { Discovery } from './discovery.js';

await Promise.race([document.fonts.load('48px "Marcellus SC"'), new Promise((r) => setTimeout(r, 2500))]).catch(() => {});

const STORE_KEY = 'coinmaster.muenzindex.v1';
const fmtPct = (n) => n.toLocaleString('de-DE', { maximumFractionDigits: n < 0.1 ? 3 : 2 }) + ' %';
const tierCount = Object.fromEntries(TIERS.map((t) => [t.id, COINS.filter((c) => c.tier === t.id).length]));
const coinChance = (coin) => tierById[coin.tier].chance / tierCount[coin.tier];

// ── Spielstand ───────────────────────────────────────────────────────────────

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(STORE_KEY));
    if (s && typeof s.found === 'object') return { found: s.found, draws: s.draws | 0 };
  } catch {}
  return { found: {}, draws: 0 };
}
let state = load();
function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch {}
}

// ── Vorschaubilder ───────────────────────────────────────────────────────────
// Ein kleiner Renderer zeichnet jede entdeckte Münze einmal als Bild.

const thumbs = new Map();
let thumbRenderer, thumbScene, thumbCamera;
let thumbQueue = Promise.resolve();

function thumbnail(index) {
  if (thumbs.has(index)) return Promise.resolve(thumbs.get(index));
  thumbQueue = thumbQueue.then(
    () =>
      new Promise((res) =>
        requestAnimationFrame(() => {
          if (!thumbRenderer) {
            thumbRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
            thumbRenderer.setSize(256, 256);
            thumbRenderer.toneMapping = THREE.ACESFilmicToneMapping;
            thumbScene = makeScene(makeEnvironment(thumbRenderer));
            thumbCamera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
            thumbCamera.position.set(0, 0, 4.3);
          }
          const coin = COINS[index];
          // Engelsgleich hat Flügel am Körper – weiter weg, damit sie ins Bild passen
          thumbCamera.position.z = coin.tier === 'engelsgleich' ? 6.6 : 4.3;
          const obj = createCoin(coin, { resolution: 384 });
          obj.spinner.rotation.set(0.12, -0.38, 0);
          // Effekte wie Ringe und Flügel passen nicht ins kleine Bild
          obj.root.children[0].visible = false;
          obj.update(1);
          thumbScene.add(obj.root);
          thumbRenderer.render(thumbScene, thumbCamera);
          const url = thumbRenderer.domElement.toDataURL('image/png');
          thumbScene.remove(obj.root);
          obj.dispose();
          thumbs.set(index, url);
          res(url);
        }),
      ),
  );
  return thumbQueue;
}

// ── Plätze ───────────────────────────────────────────────────────────────────

const slotsEl = document.getElementById('slots');
const slots = COINS.map((coin, i) => {
  const tier = tierById[coin.tier];
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'slot';
  el.style.setProperty('--tier', tier.color);
  el.style.setProperty('--rank', tier.index);
  el.innerHTML = `
    <span class="slot-no">#${String(i + 1).padStart(2, '0')}</span>
    <span class="slot-art"><span class="slot-mystery" aria-hidden="true">?</span></span>
    <span class="slot-name">???</span>
    <span class="slot-tier">${tier.name}</span>`;
  el.addEventListener('click', () => {
    if (state.found[i]) play(i, { preview: true, replay: true });
  });
  slotsEl.append(el);
  return el;
});

function renderSlot(i, { fresh = false } = {}) {
  const el = slots[i];
  const n = state.found[i] | 0;
  const coin = COINS[i];
  el.classList.toggle('is-found', n > 0);
  el.setAttribute('aria-label', n ? `#${i + 1} ${coin.name}, ${tierById[coin.tier].name}, ${n}× gezogen. Animation ansehen` : `#${i + 1} unentdeckt, ${tierById[coin.tier].name}`);
  el.disabled = !n;
  el.querySelector('.slot-name').textContent = n ? coin.name : '???';
  let count = el.querySelector('.slot-count');
  if (n > 1) {
    if (!count) {
      count = document.createElement('span');
      count.className = 'slot-count';
      el.append(count);
    }
    count.textContent = `×${n}`;
  } else count?.remove();
  if (n && !el.querySelector('img')) {
    thumbnail(i).then((url) => {
      const img = new Image();
      img.alt = '';
      img.src = url;
      el.querySelector('.slot-art').replaceChildren(img);
    });
  }
  if (fresh) {
    el.classList.remove('is-fresh');
    void el.offsetWidth;
    el.classList.add('is-fresh');
  }
}

function renderProgress() {
  const found = Object.keys(state.found).length;
  document.getElementById('found-count').textContent = found;
  document.getElementById('draw-count').textContent = state.draws.toLocaleString('de-DE');
  document.getElementById('progress-fill').style.width = `${(found / COINS.length) * 100}%`;
  const list = document.getElementById('tier-progress');
  list.replaceChildren(
    ...TIERS.map((t) => {
      const have = COINS.filter((c, i) => c.tier === t.id && state.found[i]).length;
      const li = document.createElement('li');
      li.style.setProperty('--tier', t.color);
      li.classList.toggle('is-complete', have === tierCount[t.id]);
      li.innerHTML = `<span class="tp-name">${t.name}</span><span class="tp-num">${have}/${tierCount[t.id]}</span>`;
      return li;
    }),
  );
}

COINS.forEach((_, i) => renderSlot(i));
renderProgress();

// ── Ziehen und Entdecken ─────────────────────────────────────────────────────

const discovery = new Discovery(document.getElementById('reveal'));
const drawBtn = document.getElementById('draw-btn');
let busy = false;

async function play(i, { preview = false, replay = false } = {}) {
  busy = true;
  drawBtn.disabled = true;
  await discovery.play(COINS[i], {
    number: i + 1,
    total: COINS.length,
    chance: fmtPct(coinChance(COINS[i])),
    eyebrow: replay ? 'Aus deinem Index' : preview ? 'Vorschau · zählt nicht für den Index' : 'Neue Münze entdeckt',
  });
  busy = false;
  drawBtn.disabled = false;
}

const toast = document.getElementById('toast');
let toastTimer;
function showToast(html, color) {
  toast.innerHTML = html;
  toast.style.setProperty('--tier', color);
  toast.hidden = false;
  toast.classList.remove('is-in');
  void toast.offsetWidth;
  toast.classList.add('is-in');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.hidden = true), 2600);
}

drawBtn.addEventListener('click', async () => {
  if (busy) return;
  const coin = rollCoin();
  const i = COINS.indexOf(coin);
  const isNew = !state.found[i];
  state.found[i] = (state.found[i] | 0) + 1;
  state.draws += 1;
  save();
  renderProgress();
  if (isNew) {
    await play(i);
    renderSlot(i, { fresh: true });
    slots[i].scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  } else {
    renderSlot(i, { fresh: true });
    const tier = tierById[coin.tier];
    showToast(`<strong>${coin.name}</strong> ist schon im Index · jetzt ×${state.found[i]}`, tier.color);
  }
});

// ── Test-Knöpfe und Zurücksetzen ─────────────────────────────────────────────

const testEl = document.getElementById('test-buttons');
for (const t of TIERS) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'chip';
  b.style.setProperty('--tier', t.color);
  b.textContent = t.name;
  b.addEventListener('click', () => {
    if (busy) return;
    const pool = COINS.map((c, i) => [c, i]).filter(([c]) => c.tier === t.id);
    play(pool[Math.floor(Math.random() * pool.length)][1], { preview: true });
  });
  testEl.append(b);
}

const resetBtn = document.getElementById('reset-btn');
let armed = null;
resetBtn.addEventListener('click', () => {
  if (!armed) {
    resetBtn.textContent = 'Wirklich alles löschen? Nochmal klicken';
    resetBtn.classList.add('is-armed');
    armed = setTimeout(() => {
      armed = null;
      resetBtn.textContent = 'Index zurücksetzen';
      resetBtn.classList.remove('is-armed');
    }, 3500);
    return;
  }
  clearTimeout(armed);
  armed = null;
  state = { found: {}, draws: 0 };
  save();
  slots.forEach((el) => {
    el.querySelector('.slot-art').innerHTML = '<span class="slot-mystery" aria-hidden="true">?</span>';
  });
  COINS.forEach((_, i) => renderSlot(i));
  renderProgress();
  resetBtn.textContent = 'Index zurückgesetzt';
  resetBtn.classList.remove('is-armed');
  setTimeout(() => (resetBtn.textContent = 'Index zurücksetzen'), 2000);
});
