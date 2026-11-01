// Weltkarte: Planeten wählen, Welten als Karten mit Vorschaubild, große drehbare 3D-Ansicht.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PLANETS, WORLDS, planetById, worldById, worldsOf, REBIRTH, rebirthMultiplier, fmtLuck, fmtValue, fmtPrice } from './worlds.js';
import { buildWorld, ISLAND_RADIUS } from './worldFactory.js';

// Kameraabstände wachsen mit der Inselgröße (Werte unten gelten für Radius 10)
const CS = ISLAND_RADIUS / 10;
import { worldThumb } from './thumbs.js';
import { pixelRatio, loadSettings, skipAnimations } from '../../js/settings.js';
import { worldToParts } from '../../roblox/js/worldParts.js';
import { partsGroup } from '../../roblox/js/partsPreview.js';
import { makeCharacter, STUDS, FIGURE_STUDS } from './character.js';

const $ = (id) => document.getElementById(id);
let planet = 'p1';
let current = WORLDS[0];

// ── 3D-Ansicht ──────────────────────────────────────────────────────────────

const canvas = $('viewer');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = loadSettings().quality !== 'niedrig';
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(pixelRatio());

const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 500);
camera.position.set(19 * CS, 12 * CS, 22 * CS);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 12 * CS;
controls.maxDistance = 50 * CS;
controls.maxPolarAngle = Math.PI * 0.62;
controls.target.set(0, 0.6, 0);
controls.autoRotate = !skipAnimations();
controls.autoRotateSpeed = 0.6;
let idleTimer;
controls.addEventListener('start', () => {
  controls.autoRotate = false;
  fly = null; // Ziehen unterbricht die Kamerafahrt
  clearTimeout(idleTimer);
});
controls.addEventListener('end', () => {
  idleTimer = setTimeout(() => (controls.autoRotate = !skipAnimations()), 4000);
});

let built = null;
let robloxView = false;

// Roblox-Ansicht: Insel und Himmelskörper durch die Roblox-Teile ersetzen, Licht, Himmel und
// Partikel bleiben
function toRobloxView(b, w) {
  for (const o of [...b.scene.children]) if (o.isMesh || o.isGroup || o.isSprite) b.scene.remove(o);
  const parts = partsGroup(worldToParts(w));
  parts.scale.setScalar(1);
  b.scene.add(parts);
  const dispose = b.dispose;
  b.dispose = () => {
    parts.userData.dispose();
    dispose();
  };
  return parts.userData.count;
}

// ── Größenvergleich mit einer normal großen Roblox-Figur ──
let compare = false, figure = null, fly = null;
const HOME = { target: new THREE.Vector3(0, 0.6, 0), dist: 30 * CS };

// Platz neben der Teleport-Plattform (Ankunftsort), sonst am Inselrand
function figureSpot(b) {
  if (b.figureSpot) return b.figureSpot.clone();
  let pad = null;
  b.scene.traverse((o) => o.userData.rbx?.name === 'TeleportPad' && (pad = o.getWorldPosition(new THREE.Vector3())));
  const p = pad ?? new THREE.Vector3(b.radius - 2, 0, 0);
  // seitlich neben die Plattform, gleicher Abstand zum Rand
  const out = new THREE.Vector3(p.x, 0, p.z).normalize(), side = new THREE.Vector3(-out.z, 0, out.x);
  let x = p.x + side.x * 1.3, z = p.z + side.z * 1.3;
  const r = Math.hypot(x, z), max = b.radius - 0.9;
  if (r > max) (x *= max / r), (z *= max / r);
  return new THREE.Vector3(x, b.height(x, z), z);
}

// Kamerarichtung mit freier Sicht auf die Figur: zuerst von außen, dann seitlich und von oben
function clearView(b, look, skip) {
  const out = new THREE.Vector3(look.x, 0, look.z).normalize();
  const ray = new THREE.Raycaster();
  const meshes = [];
  b.scene.traverse((o) => {
    if (!o.isMesh || !o.visible || o.material.transparent || o.material.blending === THREE.AdditiveBlending) return;
    for (let p = o; p; p = p.parent) if (p === skip) return;
    meshes.push(o);
  });
  b.scene.updateMatrixWorld(true);
  for (const up of [0.42, 0.75, 1.3, 2.2])
    for (const yaw of [0, 0.5, -0.5, 1, -1, 1.6, -1.6]) {
      const dir = out.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw).add(new THREE.Vector3(0, up, 0)).normalize();
      const cam = look.clone().addScaledVector(dir, 4.6);
      // Füße, Mitte und Kopf müssen alle zu sehen sein
      const blocked = [-0.38, -0.1, 0.2].some((dy) => {
        const from = look.clone().add(new THREE.Vector3(0, dy, 0)), to = cam.clone().sub(from);
        ray.set(from, to.clone().normalize());
        ray.far = to.length();
        return ray.intersectObjects(meshes, false).length > 0;
      });
      if (!blocked) return dir;
    }
  return new THREE.Vector3(0, 1, 0.3);
}

function flyTo(target, dist, minDist, from) {
  controls.autoRotate = false;
  controls.minDistance = minDist;
  // from: Richtung, aus der die Kamera schaut (sonst die aktuelle)
  const off = (from ? from.clone() : camera.position.clone().sub(controls.target)).setLength(dist);
  fly = { t: 0, fromT: controls.target.clone(), toT: target.clone(), fromP: camera.position.clone(), toP: target.clone().add(off) };
}

function showWorld(w) {
  current = w;
  $('soon-cover').hidden = !w.soon;
  if (built) {
    built.dispose();
    built = null;
  }
  if (!w.soon) {
    const fewer = loadSettings().fewerParticles;
    built = buildWorld(w, { particles: fewer ? 0.4 : 1, shadows: renderer.shadowMap.enabled });
    const spot = figureSpot(built);
    if (robloxView) $('rbx-count').textContent = `${toRobloxView(built, w).toLocaleString('de-DE')} Roblox-Teile`;
    figure = null;
    if (compare) {
      figure = makeCharacter();
      figure.position.copy(spot);
      // Figur schaut nach außen, zur Kamera
      figure.lookAt(spot.x * 2, spot.y, spot.z * 2);
      built.scene.add(figure);
      const d = built.dispose;
      const fig = figure;
      built.dispose = () => {
        fig.userData.dispose();
        d();
      };
      const wide = Math.round(built.radius * 2 * STUDS);
      $('size-info').innerHTML = `<strong>Figur</strong> ${FIGURE_STUDS.toLocaleString('de-DE')} Studs hoch · <strong>Insel</strong> ${wide} Studs breit ≈ ${Math.round(wide / 4)} Figuren nebeneinander`;
      // von außen (über dem Abgrund, dort steht nichts im Weg) auf die Figur schauen;
      // dahinter ragt die Welt auf
      const look = spot.clone().add(new THREE.Vector3(0, 0.45, 0));
      flyTo(look, 4.6, 1.6, clearView(built, look, figure));
    }
  }
  $('size-info').hidden = !compare || w.soon;
  $('rbx-count').hidden = !robloxView || w.soon;
  canvas.classList.remove('is-in');
  void canvas.offsetWidth;
  canvas.classList.add('is-in');
  renderInfo();
  renderStrip();
  history.replaceState(null, '', `#${w.id}`);
}

function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (!w || !h) return;
  if (canvas.width !== Math.round(w * renderer.getPixelRatio()) || canvas.height !== Math.round(h * renderer.getPixelRatio())) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    // Abstand so wählen, dass die ganze Insel auch in schmale Ansichten passt
    const fit = (12.4 * CS) / (Math.tan(THREE.MathUtils.degToRad(19)) * Math.min(camera.aspect, 1.6));
    const off = camera.position.clone().sub(controls.target);
    off.setLength(Math.min(48 * CS, Math.max(27 * CS, fit)));
    camera.position.copy(controls.target).add(off);
  }
}

// nur zeichnen, wenn die Ansicht zu sehen ist
let visible = true;
new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(canvas);

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = clock.getDelta(), t = clock.elapsedTime;
  if (!visible || !built) return;
  resize();
  if (fly) {
    fly.t = Math.min(1, fly.t + dt / 1.4);
    const k = fly.t < 0.5 ? 2 * fly.t * fly.t : 1 - Math.pow(-2 * fly.t + 2, 2) / 2;
    controls.target.lerpVectors(fly.fromT, fly.toT, k);
    camera.position.lerpVectors(fly.fromP, fly.toP, k);
    if (fly.t >= 1) fly = null;
  }
  controls.update();
  built.update(t, dt);
  figure?.userData.update(t);
  renderer.render(built.scene, camera);
});

$('size-toggle').addEventListener('click', (e) => {
  compare = !compare;
  e.currentTarget.setAttribute('aria-pressed', String(compare));
  if (!compare) flyTo(HOME.target, HOME.dist, 12 * CS);
  showWorld(current);
});

$('rbx-toggle').addEventListener('click', (e) => {
  robloxView = !robloxView;
  e.currentTarget.setAttribute('aria-pressed', String(robloxView));
  showWorld(current);
});

// ── Planeten ────────────────────────────────────────────────────────────────

function renderPlanets() {
  $('planets').innerHTML = PLANETS.map((p, i) => {
    const n = worldsOf(p.id).filter((w) => !w.soon).length;
    const sub = p.soon ? 'Coming soon' : `${n} Welt${n === 1 ? '' : 'en'}${p.portal ? ` · ${p.portal.name}` : ''}`;
    return `${i ? '<span class="orbit" aria-hidden="true"></span>' : ''}
      <button type="button" class="planet${p.soon ? ' is-soon' : ''}" data-planet="${p.id}" aria-pressed="${p.id === planet}"
        style="--c:${p.color};--g:${p.glow};--s1:${p.surface[0]};--s2:${p.surface[1]};--s3:${p.surface[2]}">
        <span class="planet-ball" aria-hidden="true"></span>
        <span class="planet-name">${p.name}</span>
        <span class="planet-title">${p.title}</span>
        <span class="planet-sub">${sub}</span>
      </button>`;
  }).join('');
  // gewählten Planeten in der (auf dem Handy scrollbaren) Leiste sichtbar machen
  const bar = $('planets'), sel = bar.querySelector('[aria-pressed="true"]');
  if (sel && bar.scrollWidth > bar.clientWidth) bar.scrollLeft = sel.offsetLeft - (bar.clientWidth - sel.offsetWidth) / 2;
  $('planets').querySelectorAll('[data-planet]').forEach((b) =>
    b.addEventListener('click', () => {
      planet = b.dataset.planet;
      renderPlanets();
      showWorld(worldsOf(planet)[0]);
    }),
  );
}

// ── Info ────────────────────────────────────────────────────────────────────

function unlockText(w) {
  const p = planetById[w.planet];
  const list = worldsOf(w.planet);
  const i = list.indexOf(w);
  if (w.soon) return 'Kommt mit einem späteren Update';
  const parts = [];
  if (i === 0 && p.portal) parts.push(`${p.portal.name}: ${p.portal.rebirths} Wiedergeburt${p.portal.rebirths > 1 ? 'en' : ''}`);
  if (i > 0) parts.push(`nach „${list[i - 1].name}“`);
  if (w.price) parts.push(`${fmtPrice(w.price)} Taler`);
  return parts.length ? parts.join(' · ') : 'Startwelt, von Anfang an offen';
}

function renderInfo() {
  const w = current, p = planetById[w.planet];
  const info = $('info');
  info.style.setProperty('--c', w.soon ? p.color : w.accent);
  if (w.soon) {
    info.innerHTML = `
      <p class="info-eyebrow">${p.name} · ${p.title}</p>
      <h2>Coming soon</h2>
      <p class="info-text">Hier entsteht eine neue Welt. Was sie bringt, bleibt noch ein Geheimnis.</p>
      <dl class="facts"><div><dt>Freischalten</dt><dd>${unlockText(w)}</dd></div></dl>`;
    return;
  }
  const n = worldsOf(w.planet).indexOf(w) + 1;
  info.innerHTML = `
    <p class="info-eyebrow">${p.name} · Welt ${n}</p>
    <h2>${w.name}</h2>
    <p class="info-text">${w.text}</p>
    <dl class="facts">
      <div><dt>Preis</dt><dd>${w.price ? `${fmtPrice(w.price)} Taler` : 'Gratis'}</dd></div>
      <div><dt>Glück</dt><dd>${fmtLuck(w)}</dd></div>
      <div><dt>Münzwert</dt><dd>${fmtValue(w)}</dd></div>
      <div><dt>Münzen</dt><dd>alle 50</dd></div>
      <div class="wide"><dt>Freischalten</dt><dd>${unlockText(w)}</dd></div>
    </dl>
    <div class="info-nav">
      <button type="button" class="btn" data-step="-1" aria-label="Vorige Welt">← Vorige</button>
      <button type="button" class="btn" data-step="1" aria-label="Nächste Welt">Nächste →</button>
    </div>`;
  info.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => step(+b.dataset.step)));
}

function step(d) {
  const all = WORLDS;
  const i = (all.indexOf(current) + d + all.length) % all.length;
  const w = all[i];
  if (w.planet !== planet) {
    planet = w.planet;
    renderPlanets();
  }
  showWorld(w);
}

// ── Kartenleiste ────────────────────────────────────────────────────────────

function renderStrip() {
  const p = planetById[planet];
  $('strip-title').innerHTML = `${p.name} <span>· ${p.title}</span>`;
  const list = worldsOf(planet);
  const strip = $('strip');
  strip.style.setProperty('--c', p.color);
  strip.innerHTML = list
    .map((w, i) => `
      <li>
        <button type="button" class="card${w.soon ? ' is-soon' : ''}" data-world="${w.id}" aria-pressed="${w === current}" style="--c:${w.accent || p.color}">
          <span class="card-img">${w.soon ? '<span class="card-q">?</span>' : `<img alt="" data-thumb="${w.id}">`}</span>
          <span class="card-num">${w.soon ? '···' : `Welt ${i + 1}`}</span>
          <span class="card-name">${w.name}</span>
          <span class="card-price">${w.soon ? 'Bald' : w.price ? `${fmtPrice(w.price)} Taler` : 'Startwelt'}</span>
        </button>
      </li>`)
    .join('');
  strip.querySelectorAll('[data-world]').forEach((b) =>
    b.addEventListener('click', () => {
      const id = b.dataset.world;
      showWorld(worldById[id]);
      strip.querySelector(`[data-world="${id}"]`)?.focus({ preventScroll: true });
      // 3D-Ansicht ins Bild holen, falls sie weggescrollt ist
      const r = canvas.getBoundingClientRect();
      if (r.top < 0) canvas.closest('.stage').scrollIntoView({ behavior: skipAnimations() ? 'auto' : 'smooth', block: 'start' });
    }),
  );
  strip.querySelectorAll('img[data-thumb]').forEach(async (img) => {
    const url = await worldThumb(worldById[img.dataset.thumb]);
    if (url) img.src = url;
  });
}

// ── Erklärungen ─────────────────────────────────────────────────────────────

$('rebirth-text').textContent = `Für ${fmtPrice(REBIRTH.cost(0))} Taler (danach jeweils viermal so viel) wirst du wiedergeboren: Deine Taler sind weg, aber jede Münze ist für immer ${Math.round(REBIRTH.bonus * 100)} % mehr wert. Welten, Münzen, Level und Skills bleiben.`;
$('portal-text').textContent = PLANETS.filter((p) => p.portal && !p.soon)
  .map((p) => `${p.name} (${p.title}): ${p.portal.name}, braucht die letzte Welt des vorigen Planeten und ${p.portal.rebirths} Wiedergeburt${p.portal.rebirths > 1 ? 'en' : ''}.`)
  .join(' ') + ' Planet 4 kommt mit einem späteren Update.';
$('rebirth-table').innerHTML = `
  <caption>Wiedergeburten</caption>
  <thead><tr><th scope="col">Nr.</th><th scope="col">Kosten</th><th scope="col">Münzwert danach</th><th scope="col">Öffnet</th></tr></thead>
  <tbody>${[0, 1, 2, 3, 4, 5]
    .map((n) => {
      const opens = PLANETS.filter((p) => p.portal?.rebirths === n + 1).map((p) => `${p.portal.name} → ${p.name}`).join(', ');
      return `<tr><td>${n + 1}</td><td>${fmtPrice(REBIRTH.cost(n))} Taler</td><td>×${rebirthMultiplier(n + 1).toLocaleString('de-DE')}</td><td>${opens || '–'}</td></tr>`;
    })
    .join('')}</tbody>`;

// ── Start ───────────────────────────────────────────────────────────────────

const fromHash = worldById[location.hash.slice(1)];
if (fromHash) {
  current = fromHash;
  planet = fromHash.planet;
}
renderPlanets();
showWorld(current);
addEventListener('hashchange', () => {
  const w = worldById[location.hash.slice(1)];
  if (!w || w === current) return;
  planet = w.planet;
  renderPlanets();
  showWorld(w);
});
addEventListener('keydown', (e) => {
  if (e.target.closest('input, textarea')) return;
  if (e.key === 'ArrowRight') step(1);
  if (e.key === 'ArrowLeft') step(-1);
});
// Vorschaubilder der anderen Planeten schon im Hintergrund vorbereiten
setTimeout(() => WORLDS.filter((w) => !w.soon).forEach((w) => worldThumb(w)), 1500);
