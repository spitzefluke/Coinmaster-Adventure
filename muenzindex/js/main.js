// Münzindex: Sammelbuch mit 50 Plätzen, Ziehen nach Drop-Chance und Entdeckungs-Animation.
// Fortschritt liegt im localStorage dieses Browsers (Spielvorschau, kein Server).

import * as THREE from 'three';
import { TIERS, COINS, tierById, rollCoin } from '../../muenzen/js/coins.js';
import { createCoin, makeEnvironment, makeScene } from '../../muenzen/js/coinFactory.js';
import { MUTATIONS, WEATHER, WEATHER_MS, weatherById, weatherAt, mutationForWeather, rollMutation, fmtMultiplier } from '../../muenzen/js/mutations.js';
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
    if (s && typeof s.found === 'object') return { found: s.found, draws: s.draws | 0, mut: s.mut && typeof s.mut === 'object' ? s.mut : {} };
  } catch {}
  return { found: {}, draws: 0, mut: {} };
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
    <span class="slot-tier">${tier.name}</span>
    <span class="slot-muts">${MUTATIONS.map((m) => `<i data-mut="${m.id}" style="--mut:${m.color}" title="${m.name}"></i>`).join('')}</span>`;
  // erneut ansehen – mit der wertvollsten gefundenen Mutation
  el.addEventListener('click', () => {
    if (!state.found[i]) return;
    const best = [...MUTATIONS].reverse().find((m) => state.mut[i]?.[m.id]);
    play(i, { replay: true, mutation: best?.id });
  });
  slotsEl.append(el);
  return el;
});

function renderSlot(i, { fresh = false } = {}) {
  const el = slots[i];
  const n = state.found[i] | 0;
  const coin = COINS[i];
  el.classList.toggle('is-found', n > 0);
  const muts = MUTATIONS.filter((m) => state.mut[i]?.[m.id]);
  for (const dot of el.querySelectorAll('.slot-muts i')) dot.classList.toggle('is-on', !!state.mut[i]?.[dot.dataset.mut]);
  const mutText = muts.length ? `, Mutationen: ${muts.map((m) => m.name).join(', ')}` : '';
  el.setAttribute('aria-label', n ? `#${i + 1} ${coin.name}, ${tierById[coin.tier].name}, ${n}× gezogen${mutText}. Animation ansehen` : `#${i + 1} unentdeckt, ${tierById[coin.tier].name}`);
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
  const mutTotal = Object.values(state.mut).reduce((s, o) => s + Object.keys(o).length, 0);
  document.getElementById('mut-count').textContent = mutTotal;
  document.getElementById('mut-progress').replaceChildren(
    ...MUTATIONS.map((m) => {
      const have = COINS.filter((_, i) => state.mut[i]?.[m.id]).length;
      const li = document.createElement('li');
      li.style.setProperty('--tier', m.color);
      li.classList.toggle('is-complete', have === COINS.length);
      li.innerHTML = `<span class="tp-name">${m.name}</span><span class="tp-num">${have}/${COINS.length}</span>`;
      return li;
    }),
  );
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

// ── Wetter ───────────────────────────────────────────────────────────────────
// Das Wetter wechselt jede Minute. Welches Wetter gerade herrscht, ergibt sich aus der Uhrzeit,
// damit es nach einem Neuladen gleich bleibt. Über die Test-Knöpfe lässt es sich festlegen.

let manualWeather = null;

function weatherNow(now = Date.now()) {
  if (manualWeather && now < manualWeather.until) return { w: weatherById[manualWeather.id], ends: manualWeather.until };
  return weatherAt(now);
}

const weatherEl = document.getElementById('weather');
function renderWeather() {
  const { w, ends } = weatherNow();
  const m = mutationForWeather(w.id);
  weatherEl.dataset.weather = w.id;
  weatherEl.style.setProperty('--weather', w.color);
  document.getElementById('weather-name').textContent = w.name;
  document.getElementById('weather-text').textContent = w.text;
  document.getElementById('weather-mut').textContent = m ? `${m.chance} % Chance auf ${m.name} (${fmtMultiplier(m)})` : 'Keine Mutationen möglich';
  const left = Math.max(0, Math.ceil((ends - Date.now()) / 1000));
  document.getElementById('weather-time').textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
}
renderWeather();
setInterval(renderWeather, 1000);

const weatherBtns = document.getElementById('weather-buttons');
for (const w of WEATHER) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'chip';
  b.style.setProperty('--tier', w.color);
  b.textContent = w.name;
  b.addEventListener('click', () => {
    manualWeather = { id: w.id, until: Date.now() + WEATHER_MS };
    renderWeather();
  });
  weatherBtns.append(b);
}

// Erklär-Tabelle
document.getElementById('mut-rows').replaceChildren(
  ...MUTATIONS.map((m) => {
    const tr = document.createElement('tr');
    tr.style.setProperty('--mut', m.color);
    tr.innerHTML = `<th scope="row"><span class="mut-pill">${m.name}</span></th><td>${weatherById[m.weather].name}</td><td>${m.chance} %</td><td>${fmtMultiplier(m)}</td><td>${m.effect}</td>`;
    return tr;
  }),
);

// ── Ziehen und Entdecken ─────────────────────────────────────────────────────

const discovery = new Discovery(document.getElementById('reveal'));
const drawBtn = document.getElementById('draw-btn');
let busy = false;

async function play(i, { preview = false, replay = false, mutation = null, eyebrow } = {}) {
  busy = true;
  drawBtn.disabled = true;
  await discovery.play(COINS[i], {
    number: i + 1,
    total: COINS.length,
    chance: fmtPct(coinChance(COINS[i])),
    mutation,
    eyebrow: eyebrow || (replay ? 'Aus deinem Index' : preview ? 'Vorschau · zählt nicht für den Index' : 'Neue Münze entdeckt'),
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
  const m = rollMutation(weatherNow().w.id);
  const isNew = !state.found[i];
  const mutNew = !!m && !state.mut[i]?.[m.id];
  state.found[i] = (state.found[i] | 0) + 1;
  if (m) {
    state.mut[i] ??= {};
    state.mut[i][m.id] = (state.mut[i][m.id] | 0) + 1;
  }
  state.draws += 1;
  save();
  renderProgress();
  if (isNew || mutNew) {
    await play(i, { mutation: m?.id, eyebrow: isNew ? (m ? 'Neue Münze mit Mutation!' : 'Neue Münze entdeckt') : 'Neue Mutation entdeckt' });
    renderSlot(i, { fresh: true });
    slots[i].scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  } else {
    renderSlot(i, { fresh: true });
    const tier = tierById[coin.tier];
    const mText = m ? ` · ${m.name} ×${state.mut[i][m.id]}` : '';
    showToast(`<strong>${coin.name}</strong> ist schon im Index · jetzt ×${state.found[i]}${mText}`, m ? m.color : tier.color);
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

// Einzelne Münze: Auswahl nach Stufe gruppiert, „Nächste“ geht der Reihe nach durch alle 50
const picker = document.getElementById('test-coin');
for (const t of TIERS) {
  const group = document.createElement('optgroup');
  group.label = `${t.name} · ${fmtPct(t.chance)}`;
  COINS.forEach((c, i) => {
    if (c.tier !== t.id) return;
    group.append(new Option(`#${String(i + 1).padStart(2, '0')} ${c.name}`, i));
  });
  picker.append(group);
}
const mutPicker = document.getElementById('test-mut');
mutPicker.append(new Option('Ohne Mutation', ''), ...MUTATIONS.map((m) => new Option(`${m.name} ${fmtMultiplier(m)}`, m.id)));
const testMutation = () => mutPicker.value || null;
document.getElementById('test-play').addEventListener('click', () => !busy && play(+picker.value, { preview: true, mutation: testMutation() }));
document.getElementById('test-next').addEventListener('click', () => {
  if (busy) return;
  picker.value = String((+picker.value + 1) % COINS.length);
  play(+picker.value, { preview: true, mutation: testMutation() });
});

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
  state = { found: {}, draws: 0, mut: {} };
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
