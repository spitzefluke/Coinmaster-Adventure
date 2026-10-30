// Startseite: Bereichs-Kacheln und eine drehende Zufallsmünze aus dem Münzkabinett.

import * as THREE from 'three';
import { BEREICHE } from './bereiche.js';
import { COINS, tierById } from '../muenzen/js/coins.js';
import { createCoin, makeEnvironment, makeScene } from '../muenzen/js/coinFactory.js';
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
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
const scene = makeScene(makeEnvironment(renderer));
const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);

// Zufallsmünze, bevorzugt mit Effekten (ab Stufe Episch); jede dritte bekommt eine Mutation
const pool = COINS.filter((c) => tierById[c.tier].index >= 3);
let obj = null;
function showRandomCoin() {
  if (obj) {
    scene.remove(obj.root);
    obj.dispose();
  }
  const coin = pool[Math.floor(Math.random() * pool.length)];
  const tier = tierById[coin.tier];
  const m = Math.random() < 0.34 ? MUTATIONS[Math.floor(Math.random() * MUTATIONS.length)] : null;
  obj = createCoin(coin, { resolution: 768, mutation: m?.id });
  scene.add(obj.root);
  camera.position.set(0, 0, tier.index >= 5 || m ? 8 : 6.6);
  document.getElementById('hero-caption').textContent = `Zufallsmünze: ${coin.name} · ${tier.name}${m ? ` · ${m.name}` : ''}`;
}
showRandomCoin();
document.getElementById('reroll').addEventListener('click', showRandomCoin);

function resize() {
  const { width, height } = canvas.parentElement.getBoundingClientRect();
  renderer.setSize(width, height, false);
}
addEventListener('resize', resize);
resize();

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const t = clock.getElapsedTime();
  obj.spinner.rotation.y = reducedMotion ? 0.4 : t * 0.6;
  obj.spinner.rotation.x = Math.sin(t * 0.6) * 0.12;
  obj.update(reducedMotion ? 0 : t);
  renderer.render(scene, camera);
});
