// Wetter-Seite: aktuelles Wetter, 3D-Vorschau jedes Wetters auf einer Welt, Münze mit der
// passenden Mutation, Vorhersage und Übersicht.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { WEATHER, WEATHER_MS, weatherById, weatherAt, forecast, mutationForWeather, fmtMultiplier } from '../../muenzen/js/mutations.js';
import { COINS } from '../../muenzen/js/coins.js';
import { createCoin, makeEnvironment, makeScene } from '../../muenzen/js/coinFactory.js';
import { buildWorld, ISLAND_RADIUS } from '../../welten/js/worldFactory.js';
import { createWeatherFx } from '../../welten/js/weatherFx.js';
import { WORLDS, worldById } from '../../welten/js/worlds.js';
import { pixelRatio, loadSettings, skipAnimations } from '../../js/settings.js';

const $ = (id) => document.getElementById(id);
const total = WEATHER.reduce((a, w) => a + w.weight, 0);
const share = (w) => `${Math.round((w.weight / total) * 100)} %`;
const mmss = (ms) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
const hhmm = (t) => new Date(t).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

const params = new URLSearchParams(location.search);
let selected = weatherById[location.hash.slice(1)] ? location.hash.slice(1) : weatherAt().w.id;
if (selected === 'klar') selected = 'regen';
let worldId = params.get('welt') && worldById[params.get('welt')] ? params.get('welt') : 'normal';

// ── 3D-Welt ──
const canvas = $('world-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.setPixelRatio(pixelRatio());
const CS = ISLAND_RADIUS / 10;
const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 500);
camera.position.set(19 * CS, 12 * CS, 22 * CS);
const controls = new OrbitControls(camera, canvas);
Object.assign(controls, { enableDamping: true, enablePan: false, minDistance: 10 * CS, maxDistance: 50 * CS, maxPolarAngle: Math.PI * 0.62, autoRotate: !skipAnimations(), autoRotateSpeed: 0.5 });
controls.target.set(0, 0.6, 0);
let built = null, wfx = null;
function buildScene() {
  wfx?.dispose();
  built?.dispose();
  const amount = loadSettings().fewerParticles ? 0.4 : 1;
  built = buildWorld(worldById[worldId], { particles: amount });
  wfx = createWeatherFx(built, selected, { amount });
}

// ── Münze mit Mutation ──
const coinCanvas = $('coin-canvas');
const cr = new THREE.WebGLRenderer({ canvas: coinCanvas, antialias: true, alpha: true });
cr.setPixelRatio(pixelRatio());
cr.toneMapping = THREE.ACESFilmicToneMapping;
const cScene = makeScene(makeEnvironment(cr));
const cCam = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
cCam.position.set(0, 0, 5.6);
let coin = null;
const showcase = COINS.find((c) => c.name === 'Kronendukat') || COINS[12];
function buildCoin() {
  if (coin) {
    cScene.remove(coin.root);
    coin.dispose();
  }
  const m = mutationForWeather(selected);
  coin = createCoin(showcase, { resolution: 512, mutation: m?.id ?? null });
  cScene.add(coin.root);
}

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.1), t = clock.elapsedTime;
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (w && h && (canvas.width !== Math.round(w * renderer.getPixelRatio()) || canvas.height !== Math.round(h * renderer.getPixelRatio()))) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  controls.update();
  built.update(t, dt);
  wfx.update(t, dt);
  renderer.render(built.scene, camera);
  if (coin) {
    const cw = coinCanvas.clientWidth, ch = coinCanvas.clientHeight;
    if (cw && ch && coinCanvas.width !== Math.round(cw * cr.getPixelRatio())) {
      cr.setSize(cw, ch, false);
      cCam.aspect = cw / ch;
      cCam.updateProjectionMatrix();
    }
    coin.spinner.rotation.y = skipAnimations() ? 0.4 : t * 0.6;
    coin.update(t);
    cr.render(cScene, cCam);
  }
});

// ── Oberfläche ──
function renderNow() {
  const { w, ends } = weatherAt();
  const m = mutationForWeather(w.id);
  $('now').style.setProperty('--weather', w.color);
  $('now').innerHTML = `<p class="now-label">Gerade</p><p class="now-name">${w.name}</p><p class="now-mut">${m ? `${m.chance} % ${m.name} · ${fmtMultiplier(m)}` : 'Keine Mutation'}</p><p class="now-time">wechselt in ${mmss(ends - Date.now())}</p>`;
}
function renderInfo() {
  const w = weatherById[selected], m = mutationForWeather(w.id);
  $('info').style.setProperty('--weather', w.color);
  $('info-text').innerHTML = `
    <p class="info-eyebrow">${share(w)} der Zeit</p>
    <h2>${w.name}</h2>
    <p class="info-text">${w.text}</p>
    ${m ? `<dl class="facts">
      <div><dt>Mutation</dt><dd>${m.name}</dd></div>
      <div><dt>Chance pro Fund</dt><dd>${m.chance} %</dd></div>
      <div><dt>Münzwert</dt><dd>${fmtMultiplier(m)}</dd></div>
      <div><dt>Nächstes Mal</dt><dd>${nextTime(w.id)}</dd></div>
    </dl><p class="info-fx">${m.effect}</p>` : ''}`;
}
function nextTime(id) {
  const now = Date.now();
  for (let i = 0; i < 400; i++) {
    const p = weatherAt(now + i * WEATHER_MS);
    if (p.w.id === id) return i === 0 ? 'jetzt' : `um ${hhmm(p.starts)}`;
  }
  return 'in über 20 Stunden';
}
function renderChips() {
  $('chips').innerHTML = WEATHER.filter((w) => w.id !== 'klar')
    .map((w) => `<button type="button" class="chip" data-w="${w.id}" style="--weather:${w.color}" aria-pressed="${w.id === selected}"><span></span>${w.name}</button>`)
    .join('');
  $('chips').querySelectorAll('[data-w]').forEach((b) => b.addEventListener('click', () => select(b.dataset.w)));
}
function renderForecast() {
  $('forecast').innerHTML = forecast(12)
    .map(({ w, starts, ends }, i) => {
      const m = mutationForWeather(w.id);
      return `<li style="--weather:${w.color}" class="${i === 0 ? 'is-now' : ''}"><button type="button" data-w="${w.id}" ${w.id === 'klar' ? 'disabled' : ''}>
        <span class="fc-time">${i === 0 ? `noch ${mmss(ends - Date.now())}` : hhmm(starts)}</span>
        <span class="fc-name">${w.name}</span>
        <span class="fc-mut">${m ? `${m.name} ${fmtMultiplier(m)}` : '–'}</span></button></li>`;
    })
    .join('');
  $('forecast').querySelectorAll('[data-w]').forEach((b) => b.addEventListener('click', () => select(b.dataset.w)));
}
function renderTable() {
  $('table').innerHTML = WEATHER.map((w) => {
    const m = mutationForWeather(w.id);
    return `<tr style="--weather:${w.color}"><th scope="row"><span class="dot"></span>${w.name}</th><td>${share(w)}</td><td>${m ? m.name : '–'}</td><td>${m ? `${m.chance} %` : '–'}</td><td>${m ? fmtMultiplier(m) : '–'}</td><td>${m ? m.effect : w.text}</td></tr>`;
  }).join('');
}
function select(id) {
  if (id === 'klar') return;
  selected = id;
  history.replaceState(null, '', `#${id}`);
  wfx?.dispose();
  wfx = createWeatherFx(built, selected, { amount: loadSettings().fewerParticles ? 0.4 : 1 });
  buildCoin();
  renderInfo();
  renderChips();
}

$('world-pick').innerHTML = WORLDS.filter((w) => !w.soon).map((w) => `<option value="${w.id}">${w.name}</option>`).join('');
$('world-pick').value = worldId;
$('world-pick').addEventListener('change', (e) => {
  worldId = e.target.value;
  buildScene();
});

buildScene();
buildCoin();
renderNow();
renderInfo();
renderChips();
renderForecast();
renderTable();
let lastSlot = weatherAt().starts;
setInterval(() => {
  renderNow();
  const s = weatherAt().starts;
  if (s !== lastSlot) {
    lastSlot = s;
    renderForecast();
    renderInfo();
  } else {
    const first = $('forecast').querySelector('.is-now .fc-time');
    if (first) first.textContent = `noch ${mmss(weatherAt().ends - Date.now())}`;
  }
}, 1000);
