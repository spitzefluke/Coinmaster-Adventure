// Startseite: Bereichs-Kacheln und eine drehende Zufallsmünze aus dem Münzkabinett.

import * as THREE from 'three';
import { BEREICHE } from './bereiche.js';
import { COINS, tierById } from '../muenzen/js/coins.js';
import { createRobloxCoin, coinLua, orbitCoin, rbxRenderer } from '../muenzen/js/coinRoblox.js';
import { MUTATIONS } from '../muenzen/js/mutations.js';

// ── Kacheln ──────────────────────────────────────────────────────────────────

const grid = document.getElementById('area-grid');
for (const b of BEREICHE) {
  const live = b.status !== 'geplant';
  const el = document.createElement(live ? 'a' : 'div');
  el.className = 'area' + (live ? '' : ' is-planned') + (b.status === 'code' ? ' is-locked' : '');
  if (live) el.href = b.href;
  const label = { vorschau: 'Vorschau', code: 'Nur mit Code', geplant: 'Geplant' }[b.status];
  el.innerHTML = `
    <span class="area-status">${label}</span>
    <h3>${b.titel}</h3>
    <p>${b.text}</p>
    ${b.eckdaten.length ? `<ul class="area-facts">${b.eckdaten.map((e) => `<li>${e}</li>`).join('')}</ul>` : ''}
    ${live ? '<span class="area-go">Öffnen →</span>' : ''}`;
  grid.append(el);
}

// ── Zufallsmünze ─────────────────────────────────────────────────────────────

await Promise.race([document.fonts.load('48px "Marcellus SC"'), new Promise((r) => setTimeout(r, 2500))]).catch(() => {});

const canvas = document.getElementById('hero-canvas');
// Die Münze ist 1:1 die Roblox-Münze (CoinBuilder und MutationFx, siehe muenzen/js/coinRoblox.js)
const renderer = rbxRenderer(canvas);
const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 500);
let lua = null;
coinLua().then((l) => (lua = l)).catch((e) => console.error('Luau konnte nicht starten', e));

// Zufallsmünze, bevorzugt mit Effekten (ab Stufe Episch); jede dritte bekommt eine Mutation
const pool = COINS.filter((c) => tierById[c.tier].index >= 3);
let obj = null, token = 0;
function showRandomCoin() {
  const coin = pool[Math.floor(Math.random() * pool.length)];
  const tier = tierById[coin.tier];
  const m = Math.random() < 0.34 ? MUTATIONS[Math.floor(Math.random() * MUTATIONS.length)] : null;
  const mine = ++token;
  createRobloxCoin(coin, { mutation: m?.id }).then((o) => {
    if (mine !== token) return o.dispose();
    obj?.dispose();
    obj = o;
  }).catch((e) => console.error('Münze', e));
  document.getElementById('hero-caption').textContent = `Zufallsmünze: ${coin.name} · ${tier.name}${m ? ` · ${m.name}` : ''}`;
}
showRandomCoin();
document.getElementById('reroll').addEventListener('click', showRandomCoin);

function resize() {
  const { width, height } = canvas.parentElement.getBoundingClientRect();
  renderer.setSize(width, height, false);
  camera.aspect = width / Math.max(1, height);
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.1), t = clock.elapsedTime;
  if (!obj) return;
  lua?.frame(dt);
  obj.step(dt);
  orbitCoin(camera, reducedMotion ? -0.4 : -0.4 + t * 0.6, Math.sin(t * 0.6) * 0.12, obj.distance + 1);
  obj.world.render(renderer, camera);
});
