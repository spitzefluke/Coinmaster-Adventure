// Wetter-Seite: aktuelles Wetter, 3D-Vorschau jedes Wetters auf einer Welt, Münze mit der
// passenden Mutation, Vorhersage und Übersicht.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { WEATHER, weatherById, weatherAt, forecast, nextWeather, weatherEvent, weatherRarityById, fmtShare, WEATHER_BLOCK, WEATHER_WARN, mutationForWeather, fmtMultiplier } from '../../muenzen/js/mutations.js';
import { COINS } from '../../muenzen/js/coins.js';
import { createRobloxCoin, coinLua, orbitCoin, rbxRenderer } from '../../muenzen/js/coinRoblox.js';
import { ISLAND_RADIUS } from '../../welten/js/worldFactory.js';
import { buildRobloxWorld, showWeather, showWorldFx, worldLua } from '../../welten/js/robloxWorld.js';
import { WORLDS, worldById } from '../../welten/js/worlds.js';
import { pixelRatio, loadSettings, skipAnimations } from '../../js/settings.js';

const $ = (id) => document.getElementById(id);
const share = fmtShare;
const rarityOf = (w) => (w.rarity ? weatherRarityById[w.rarity] : null);
const rarityTag = (w) => {
  const r = rarityOf(w);
  return r ? `<span class="rar" style="--rar:${r.color}">${r.name}</span>` : '';
};
const minutes = (w) => (w.duration ? `${Math.round(w.duration / 60)} min` : '–');
const mmss = (ms) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
const hhmm = (t) => new Date(t).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

const params = new URLSearchParams(location.search);
let selected = weatherById[location.hash.slice(1)] ? location.hash.slice(1) : weatherAt().w.id;
if (selected === 'klar') selected = 'regen';
let worldId = params.get('welt') && worldById[params.get('welt')] ? params.get('welt') : 'normal';

// ── 3D-Welt, 1:1 wie in Roblox: Teile wie der Export, Wetter aus dem Roblox-Modul WeatherFx ──
const canvas = $('world-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, stencil: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
renderer.shadowMap.enabled = loadSettings().quality !== 'niedrig';
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(pixelRatio());
const CS = (ISLAND_RADIUS / 10) * 8;
const camera = new THREE.PerspectiveCamera(38, 1, 0.5, 6000);
camera.position.set(19 * CS, 12 * CS, 22 * CS);
const controls = new OrbitControls(camera, canvas);
Object.assign(controls, { enableDamping: true, enablePan: false, minDistance: 10 * CS, maxDistance: 50 * CS, maxPolarAngle: Math.PI * 0.62, autoRotate: !skipAnimations(), autoRotateSpeed: 0.5 });
controls.target.set(0, 0.6 * 8, 0);
let built = null, lua = null;
worldLua().then((l) => (lua = l)).catch((e) => console.error('Luau konnte nicht starten', e));
function buildScene() {
  if (built) {
    lua?.call('__weatherReset');
    lua?.call('__worldFxReset');
    built.rw.dispose();
  }
  built = buildRobloxWorld(worldById[worldId], { shadows: renderer.shadowMap.enabled });
  showWorldFx(built.rw, worldId);
  showWeather(built.rw, selected);
}

// ── Münze mit Mutation (1:1 die Roblox-Münze aus CoinBuilder und MutationFx) ──
const coinCanvas = $('coin-canvas');
const cr = rbxRenderer(coinCanvas);
const cCam = new THREE.PerspectiveCamera(30, 1, 0.1, 500);
let coin = null, coinToken = 0, coinLuaState = null;
coinLua().then((l) => (coinLuaState = l)).catch((e) => console.error('Luau konnte nicht starten', e));
const showcase = COINS.find((c) => c.name === 'Kronendukat') || COINS[12];
function buildCoin() {
  const m = mutationForWeather(selected);
  const mine = ++coinToken;
  createRobloxCoin(showcase, { mutation: m?.id ?? null }).then((o) => {
    if (mine !== coinToken) return o.dispose();
    coin?.dispose();
    coin = o;
  });
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
  camera.updateMatrixWorld();
  if (lua) {
    lua.setCamera(camera);
    lua.frame(dt);
  }
  built.rw.update(dt);
  built.rw.render(renderer, camera);
  if (coin) {
    const cw = coinCanvas.clientWidth, ch = coinCanvas.clientHeight;
    if (cw && ch && coinCanvas.width !== Math.round(cw * cr.getPixelRatio())) {
      cr.setSize(cw, ch, false);
      cCam.aspect = cw / ch;
      cCam.updateProjectionMatrix();
    }
    coinLuaState?.frame(dt);
    coin.step(dt);
    orbitCoin(cCam, skipAnimations() ? -0.4 : -0.4 + t * 0.6, 0.08, coin.distance + 1);
    coin.world.render(cr, cCam);
  }
});

// ── Oberfläche ──
function renderNow() {
  const { w, ends } = weatherAt();
  const m = mutationForWeather(w.id);
  const next = nextWeather();
  const warn = w.id === 'klar' && next && next.starts - Date.now() <= WEATHER_WARN * 1000;
  $('now').style.setProperty('--weather', warn ? next.w.color : w.color);
  $('now').classList.toggle('is-warn', !!warn);
  $('now').innerHTML = `<p class="now-label">Gerade ${rarityTag(w)}</p><p class="now-name">${w.name}</p><p class="now-mut">${m ? `${m.chance} % ${m.name} · ${fmtMultiplier(m)}` : 'Keine Mutation'}</p>
    <p class="now-time">${warn ? `⚠ ${next.w.name} zieht auf · ${mmss(next.starts - Date.now())}` : `wechselt in ${mmss(ends - Date.now())}`}</p>`;
}
function renderInfo() {
  const w = weatherById[selected], m = mutationForWeather(w.id);
  $('info').style.setProperty('--weather', w.color);
  $('info-text').innerHTML = `
    <p class="info-eyebrow">${rarityTag(w)} ${share(w)} der Zeit · dauert ${minutes(w)}</p>
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
  if (weatherAt(now).w.id === id) return 'jetzt';
  const b = Math.floor(now / 1000 / WEATHER_BLOCK);
  // bis zu 14 Tage voraus (seltene Wetter kommen nur alle paar Tage)
  for (let k = 0; k < 1344; k++) {
    const e = weatherEvent(b + k);
    if (e && e.w.id === id && e.starts > now) {
      const sameDay = new Date(e.starts).toDateString() === new Date(now).toDateString();
      return sameDay ? `um ${hhmm(e.starts)}` : new Date(e.starts).toLocaleString('de-DE', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    }
  }
  return 'in über 14 Tagen';
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
        <span class="fc-name">${w.name} ${rarityTag(w)}</span>
        <span class="fc-mut">${m ? `${m.name} ${fmtMultiplier(m)}` : '–'}</span></button></li>`;
    })
    .join('');
  $('forecast').querySelectorAll('[data-w]').forEach((b) => b.addEventListener('click', () => select(b.dataset.w)));
}
function renderTable() {
  $('table').innerHTML = WEATHER.map((w) => {
    const m = mutationForWeather(w.id);
    return `<tr style="--weather:${w.color}"><th scope="row"><span class="dot"></span>${w.name}</th><td>${rarityTag(w) || '–'}</td><td>${share(w)}</td><td>${minutes(w)}</td><td>${m ? m.name : '–'}</td><td>${m ? `${m.chance} %` : '–'}</td><td>${m ? fmtMultiplier(m) : '–'}</td><td>${m ? m.effect : w.text}</td></tr>`;
  }).join('');
}
function select(id) {
  if (id === 'klar') return;
  selected = id;
  history.replaceState(null, '', `#${id}`);
  showWeather(built.rw, selected);
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
