// Taschen: 3D-Vorschau jeder Tasche (Bau Teil für Teil, Geradeaus-Laufen, Füllstand mit Voll-Beschreibung).
// Die Modelle kommen aus js/3d/ (klassische Skripte, vor diesem Modul geladen): makeBuilder, buildItem, RECIPES,
// FULL_TEXT und WALK. Three.js r128 kommt als globales THREE (cdnjs). Entstanden in der Taschen-Werkstatt.

import { BAGS, BAG_TIERS as TIERS, tierById, fmtCoins } from './bags.js';

const $ = (id) => document.getElementById(id);
const FORM = { sack: 'Beutel', backpack: 'Rucksack', chest: 'Truhe', jars: 'Gläsergestell', piggy: 'Sparschwein', roll: 'Münzrollen', shield: 'Schild', barrel: 'Fass', library: 'Münzregal', shrine: 'Schrein', armor: 'Rüstung', harness: 'Harnisch', cloak: 'Mantel', wings: 'Flügel', creature: 'Kreatur', crystal: 'Kristall', cannon: 'Kanone', obelisk: 'Obelisk', bow: 'Bogen', tower: 'Turm', crown: 'Krone', reactor: 'Kern', orbit: 'Umlaufbahn', arcSphere: 'Sphäre', staffs: 'Stäbe', bigRing: 'Ring', portal: 'Portal', galaxy: 'Galaxie', clockwork: 'Uhrwerk', throne: 'Thron', comet: 'Komet', blackhole: 'Schwarzes Loch', sunwheel: 'Sonnenrad', citadel: 'Zitadelle', halo: 'Heiligenschein', columns: 'Säulen', stream: 'Goldstrom', hoard: 'Hort', primal: 'Urmünze', anvil: 'Amboss', aura: 'Aura', rollcase: 'Münzrollen-Trommel', coinpack: 'Münzranzen', moonbag: 'Mondbeutel', anvilpack: 'Amboss-Rucksack', plate: 'Plattenrüstung', cape: 'Umhang', angelbox: 'Engels-Münzkasten', coingod: 'Münzgott', infinity: 'Unendlichkeitsgalaxie', tankard: 'Bierkrug', merc: 'Söldnergepäck' };
const overrides = {};
const recipeFor = (nr) => RECIPES[nr];
let playing = false;

// ── 3D ──
const canvas = $('cv'), stageEl = $('stage');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const lin = (c) => new THREE.Color(c).convertSRGBToLinear();
const scene = new THREE.Scene();
scene.background = lin('#120f18');
scene.fog = new THREE.Fog(lin('#120f18'), 18, 34);

(function envMap() {
  const env = new THREE.Scene();
  env.add(new THREE.Mesh(new THREE.SphereGeometry(20, 16, 8), new THREE.MeshBasicMaterial({ color: lin('#5a4d6e'), side: THREE.BackSide })));
  const panel = (c, p, s) => { const m = new THREE.Mesh(new THREE.BoxGeometry(...s), new THREE.MeshBasicMaterial({ color: lin(c) })); m.position.set(...p); env.add(m); };
  panel('#fff4dc', [0, 12, 0], [14, 0.5, 14]);
  panel('#ffd28a', [10, 4, -6], [0.5, 6, 8]);
  panel('#9fb8ff', [-10, 3, 6], [0.5, 5, 8]);
  panel('#3a2a18', [0, -8, 0], [30, 0.5, 30]);
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(env, 0.04).texture;
})();

scene.add(new THREE.HemisphereLight(lin('#d9ccff'), lin('#2a1f14'), 0.6));
const key = new THREE.DirectionalLight('#ffe6c0', 1.5);
key.position.set(-5, 9, -7);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
Object.assign(key.shadow.camera, { left: -6, right: 6, top: 9, bottom: -3, near: 1, far: 30 });
scene.add(key);
const rim = new THREE.DirectionalLight('#9fb8ff', 0.7);
rim.position.set(6, 5, 6);
scene.add(rim);

// Sockel und Spielfigur (Roblox-Maße: Oberkörper 2×2×1 Studs)
const floorMat = new THREE.MeshStandardMaterial({ color: lin('#1d1826'), roughness: 0.8 });
const floor = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.6, 0.3, 48), floorMat);
floor.position.y = -0.15; floor.receiveShadow = true; scene.add(floor);
const ring = new THREE.Mesh(new THREE.TorusGeometry(3.42, 0.04, 8, 96), new THREE.MeshBasicMaterial({ color: lin('#d9b26a') }));
ring.rotation.x = Math.PI / 2; scene.add(ring);
const avatar = new THREE.Group();
const skin = new THREE.MeshStandardMaterial({ color: lin('#6d6578'), roughness: 0.6 });
const skin2 = new THREE.MeshStandardMaterial({ color: lin('#857c92'), roughness: 0.6 });
const part = (geo, m, p, par = avatar) => { const o = new THREE.Mesh(geo, m); o.position.set(...p); o.castShadow = true; o.receiveShadow = true; par.add(o); return o; };
// Körper (Oberkörper, Kopf, Arme, Tasche) federt beim Laufen; Arme und Beine schwingen an Schulter und Hüfte
const body = new THREE.Group();
avatar.add(body);
part(new THREE.BoxGeometry(2, 2, 1), skin, [0, 3, 0], body);
part(new THREE.CylinderGeometry(0.62, 0.62, 1.15, 24), skin2, [0, 4.6, 0], body);
const arms = [-1.5, 1.5].map((x) => { const j = new THREE.Group(); j.position.set(x, 3.9, 0); body.add(j); part(new THREE.BoxGeometry(1, 2, 1), skin2, [0, -0.9, 0], j); return j; });
const legs = [-0.5, 0.5].map((x) => { const j = new THREE.Group(); j.position.set(x, 2, 0); avatar.add(j); part(new THREE.BoxGeometry(1, 2, 1), skin, [0, -1, 0], j); return j; });
scene.add(avatar);

const anchor = new THREE.Group();
anchor.position.set(0, 3, -0.5);
anchor.rotation.y = Math.PI;
body.add(anchor);
const fxRoot = new THREE.Group();
fxRoot.position.copy(anchor.position); fxRoot.rotation.copy(anchor.rotation);
body.add(fxRoot);

// Laufband auf dem Sockel: Pflastersteine ziehen nach hinten weg, Staub wirbelt an den Füßen
const pave = (() => {
  const S = 256, cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const g = cv.getContext('2d');
  g.fillStyle = '#231d2e'; g.fillRect(0, 0, S, S);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
    const x = c * 64 + (r % 2) * 32, v = 40 + ((r * 7 + c * 3) % 5) * 6;
    g.fillStyle = `rgb(${v},${v - 6},${v + 10})`;
    g.fillRect((x % S) + 3, r * 64 + 3, 58, 58);
    if (x + 64 > S) g.fillRect(x - S + 3, r * 64 + 3, 58, 58);
  }
  g.fillStyle = 'rgba(217,178,106,0.5)';
  for (let r = 0; r < 4; r++) g.fillRect(126, r * 64 + 20, 4, 24);
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.encoding = THREE.sRGBEncoding; t.repeat.set(1.7, 1.7);
  return t;
})();
const track = new THREE.Mesh(new THREE.CircleGeometry(3.38, 64), new THREE.MeshStandardMaterial({ map: pave, roughness: 0.85, transparent: true, opacity: 0 }));
track.rotation.x = -Math.PI / 2; track.position.y = 0.005; track.receiveShadow = true;
scene.add(track);
const dust = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ color: lin('#b8a98f'), size: 0.18, transparent: true, opacity: 0.5, depthWrite: false }));
dust.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(24 * 3), 3));
scene.add(dust);
const walk = { on: false, k: 0, phase: 0, dist: 0, last: 0 };
// Roblox-Laufgeschwindigkeit 16 Studs/s; die Vorschau läuft etwas ruhiger
const WALK_SPEED = 9, STEP_LEN = 4.2;
function walkFrame(t) {
  const dt = Math.min(0.05, t - walk.last); walk.last = t;
  walk.k += ((walk.on ? 1 : 0) - walk.k) * Math.min(1, dt * 4);   // weich anlaufen und abbremsen
  const k = walk.k;
  WALK.k = k; WALK.phase = walk.phase;
  walk.dist += WALK_SPEED * k * dt;
  walk.phase = (walk.dist / STEP_LEN) * Math.PI * 2;
  const sw = Math.sin(walk.phase) * 0.75 * k;
  legs[0].rotation.x = sw; legs[1].rotation.x = -sw;
  arms[0].rotation.x = -sw * 0.9; arms[1].rotation.x = sw * 0.9;
  body.position.y = Math.abs(Math.sin(walk.phase)) * 0.16 * k;
  body.rotation.y = Math.sin(walk.phase) * 0.05 * k;
  body.rotation.x = 0.06 * k;                                          // leicht nach vorn gelehnt
  // Die Tasche schwingt etwas nach, wie beim echten Laufen
  anchor.rotation.x = -Math.sin(walk.phase * 2 - 0.9) * 0.05 * k - 0.04 * k;
  anchor.rotation.z = Math.sin(walk.phase - 0.6) * 0.04 * k;
  track.material.opacity = k;
  track.material.visible = k > 0.01;
  pave.offset.y = -(walk.dist / (2 * 3.38)) * 1.7;
  const a = dust.geometry.attributes.position;
  for (let i = 0; i < 24; i++) {
    const life = ((walk.dist * 0.35 + i / 24) % 1);
    const foot = i % 2 ? 0.5 : -0.5;
    a.setXYZ(i, foot + Math.sin(i * 7.3) * 0.3, 0.1 + life * 0.7, -life * 3.2 + Math.cos(i * 3.1) * 0.2);
  }
  a.needsUpdate = true;
  dust.material.opacity = 0.45 * k;
  dust.visible = k > 0.01;
}

const camera = new THREE.PerspectiveCamera(34, 4 / 3, 0.1, 100);
const view = { az: Math.PI + 0.42, el: 0.22, dist: 13, target: new THREE.Vector3(0, 3, 0), userAz: 0, idleAt: 0 };
function placeCamera(t) {
  const sway = performance.now() > view.idleAt ? Math.sin(t * 0.35) * 0.4 : 0;
  const az = view.az + view.userAz + sway;
  const ce = Math.cos(view.el);
  camera.position.set(view.target.x + Math.sin(az) * ce * view.dist, view.target.y + Math.sin(view.el) * view.dist, view.target.z + Math.cos(az) * ce * view.dist);
  camera.lookAt(view.target);
}
function resize() {
  const w = stageEl.clientWidth, h = stageEl.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(stageEl);

// Ziehen zum Drehen, Mausrad zum Zoomen
let drag = null;
stageEl.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, az: view.userAz, el: view.el }; stageEl.setPointerCapture(e.pointerId); view.idleAt = Infinity; });
stageEl.addEventListener('pointermove', (e) => {
  if (!drag) return;
  view.userAz = drag.az - (e.clientX - drag.x) * 0.01;
  view.el = Math.max(-0.15, Math.min(1.2, drag.el + (e.clientY - drag.y) * 0.006));
});
const endDrag = () => { if (drag) { drag = null; view.idleAt = performance.now() + 5000; } };
stageEl.addEventListener('pointerup', endDrag);
stageEl.addEventListener('pointercancel', endDrag);
stageEl.addEventListener('wheel', (e) => { e.preventDefault(); view.dist = Math.max(5, Math.min(30, view.dist * (1 + Math.sign(e.deltaY) * 0.08))); view.fitted = false; }, { passive: false });

// ── Bauen ──
let current = 1, build = null;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

function clearItem() {
  for (const ch of [...anchor.children]) {
    anchor.remove(ch);
    ch.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.isPoints) o.material.dispose(); });
  }
}

function buildBag(nr) {
  clearItem();
  let recipe = recipeFor(nr);
  let item = new THREE.Group();
  anchor.add(item);
  let B = makeBuilder(item);
  try {
    buildItem(B, recipe);
  } catch (e) {
    // Ein gespeichertes Rezept, das sich nicht bauen lässt: Original zeigen
    clearItem();
    recipe = RECIPES[nr];
    item = new THREE.Group();
    anchor.add(item);
    B = makeBuilder(item);
    buildItem(B, recipe);
  }
  item.scale.setScalar(recipe.scale || 1);
  item.position.set(0, recipe.lift || 0, recipe.push || 0);
  fill.item = item; fill.base = item.scale.x;
  {
    anchor.updateMatrixWorld(true);
    const wb = new THREE.Box3().setFromObject(item), lb = new THREE.Box3();
    for (const x of [wb.min.x, wb.max.x]) for (const y of [wb.min.y, wb.max.y]) for (const z of [wb.min.z, wb.max.z]) lb.expandByPoint(anchor.worldToLocal(new THREE.Vector3(x, y, z)));
    if (lb.isEmpty()) lb.set(new THREE.Vector3(-1, -1, 0), new THREE.Vector3(1, 1, 1));
    fill.box = lb;
  }
  // Kamera auf das fertige Modell einstellen
  anchor.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(anchor).union(new THREE.Box3().setFromObject(avatar));
  const sph = box.getBoundingSphere(new THREE.Sphere());
  view.target.set(sph.center.x * 0.3, Math.max(2.4, Math.min(5.2, sph.center.y)), sph.center.z * 0.3);
  const fov = (camera.fov * Math.PI) / 180;
  const fit = (sph.radius / Math.sin(fov / 2)) * (camera.aspect < 1 ? 1.15 : 0.86);
  view.dist = Math.max(8, Math.min(26, fit));
  const meshes = B.parts.map((m) => ({ m, s: m.scale.clone(), y: m.position.y }));
  meshes.forEach(({ m }) => m.scale.setScalar(0.0001));
  const step = reduced ? 0 : Math.max(3, Math.min(70, 3200 / meshes.length));
  build = { start: performance.now(), meshes, step, anims: B.anims, done: false, total: meshes.length, shown: 0, dur: meshes.length * step + 320 };
  $('partChip').textContent = `0 / ${meshes.length} Teile`;
  $('fParts').textContent = meshes.length;
  $('fForm').textContent = FORM[recipe.a] + (overrides[nr] ? ' · überarbeitet' : '');
}

const easeBack = (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const clock = new THREE.Clock();
function frame() {
  const t = clock.getElapsedTime();
  if (build) {
    const el = performance.now() - build.start;
    let shown = 0;
    build.meshes.forEach(({ m, s, y }, i) => {
      const k = build.step ? (el - i * build.step) / 320 : 1;
      if (k <= 0) { m.scale.setScalar(0.0001); return; }
      shown++;
      if (k >= 1) { if (!m.userData.done) { m.scale.copy(s); m.userData.done = true; } return; }
      const e = Math.max(0.0001, easeBack(k));
      m.scale.set(s.x * e, s.y * e, s.z * e);
    });
    if (shown !== build.shown) {
      build.shown = shown;
      $('partChip').textContent = shown === build.total ? `${build.total} Teile` : `${shown} / ${build.total} Teile`;
      $('buildbar').style.width = (shown / build.total) * 100 + '%';
    }
    // Animationen (Flügelschlag, Kreisen …) erst, wenn das Modell steht – Neon-Teile, die ihre Skalierung selbst
    // pulsieren lassen, würden sonst die Bau-Animation überschreiben.
    if (el > build.dur) build.anims.forEach((f) => f(t));
    if (playing && el > build.dur + 2600) select(current < BAGS.length ? current + 1 : 1, true);
  }
  walkFrame(t);
  fillFrame(t);
  placeCamera(t);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

// ── Füllstand: Münzen sammeln, bis die Tasche voll ist ──
const fill = { level: 0, collecting: false, item: null, base: 1, box: null, acc: 0, last: 0, wasFull: false };
const COINS_TO_FILL = 40;
const fxCoinGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.07, 20);
const fxCoinMat = new THREE.MeshStandardMaterial({ color: lin('#ffc93c'), roughness: 0.25, metalness: 0.9, envMapIntensity: 2.2, emissive: lin('#ffc93c'), emissiveIntensity: 0.1 });
const mkCoin = () => { const c = new THREE.Mesh(fxCoinGeo, fxCoinMat); c.visible = false; c.castShadow = true; fxRoot.add(c); return c; };
const flyers = Array.from({ length: 18 }, () => ({ m: mkCoin(), on: false, t: 0, from: new THREE.Vector3(), to: new THREE.Vector3() }));
const spills = Array.from({ length: 30 }, () => ({ m: mkCoin(), on: false, p: new THREE.Vector3(), v: new THREE.Vector3(), age: 0, bounced: false }));
const fullGlowMat = new THREE.SpriteMaterial({ color: lin('#ffcf4a'), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
fullGlowMat.map = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d'); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(0.4, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; return t; })();
const fullGlow = new THREE.Sprite(fullGlowMat);
fxRoot.add(fullGlow);
const FLOOR_Y = -3;

const capacity = () => BAGS[current - 1].capacity;
const isFull = () => capacity() !== null && fill.level >= 1;
function fmtNum(n) { return n >= 1e6 ? fmtCoins(n) : Math.round(n).toLocaleString('de-DE'); }

function updateFillUi() {
  const cap = capacity(), full = isFull();
  const pct = Math.round(Math.min(1, fill.level) * 100);
  $('fill').value = String(pct);
  $('fill').setAttribute('aria-valuetext', `${pct} Prozent`);
  const shown = cap === null ? fill.level * 1e12 : Math.min(1, fill.level) * cap;
  $('fillText').textContent = cap === null ? `${fmtNum(shown)} Münzen · unbegrenzt` : `${fmtNum(shown)} / ${fmtNum(cap)} Münzen`;
  $('meterText').textContent = cap === null ? `🪙 ${fmtNum(shown)} · ∞` : `🪙 ${pct} %`;
  $('meterBar').style.width = (cap === null ? 30 : pct) + '%';
  $('meter').classList.toggle('is-full', full);
  $('fullBanner').hidden = !full;
  $('fullBannerCap').textContent = cap === null ? '' : `${fmtNum(cap)} von ${fmtNum(cap)} Münzen`;
  $('fullBox').classList.toggle('is-full', full);
  $('fullTitle').textContent = cap === null ? 'Diese Tasche wird nie voll' : full ? 'Die Tasche ist voll!' : `Wenn die Tasche voll ist (${fmtNum(cap)} Münzen)`;
  $('fullText').textContent = FULL_TEXT[current] || '';
  $('collect').textContent = fill.collecting ? '❚❚ Anhalten' : full ? '🪙 Voll – nichts passt mehr' : '🪙 Münzen sammeln';
  $('collect').disabled = full && !fill.collecting;
  $('collect').setAttribute('aria-pressed', String(fill.collecting));
}
function setLevel(v) {
  const cap = capacity();
  fill.level = Math.max(0, cap === null ? Math.min(0.999, v) : Math.min(1, v));
  if (isFull()) fill.collecting = false;
  updateFillUi();
}
$('fill').addEventListener('input', () => { fill.collecting = false; setLevel(+$('fill').value / 100); });
$('collect').addEventListener('click', () => { fill.collecting = !fill.collecting; if (fill.collecting && isFull()) fill.collecting = false; updateFillUi(); });
$('fillFull').addEventListener('click', () => { fill.collecting = false; setLevel(capacity() === null ? 0.999 : 1); });
$('fillEmpty').addEventListener('click', () => { fill.collecting = false; setLevel(0); spills.forEach((s) => { s.on = false; s.m.visible = false; }); });

function fillFrame(t) {
  const dt = Math.min(0.05, t - fill.last); fill.last = t;
  const box = fill.box;
  if (!box) return;
  const center = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
  const top = new THREE.Vector3(center.x, box.max.y - size.y * 0.12, center.z);
  const cs = Math.min(1, Math.max(0.45, size.x / 3.2));
  // Sammeln: Münzen fliegen vom Boden in die Tasche
  if (fill.collecting && !isFull()) {
    fill.acc += dt;
    if (fill.acc > 0.11) {
      fill.acc = 0;
      const f = flyers.find((x) => !x.on);
      if (f) { const a = Math.random() * Math.PI * 2, r = 2 + Math.random() * 1.2; f.on = true; f.t = 0; f.from.set(Math.cos(a) * r, FLOOR_Y + 0.1, Math.sin(a) * r + 0.5); f.to.copy(center); f.m.visible = true; }
    }
  }
  flyers.forEach((f) => {
    if (!f.on) return;
    f.t += dt / 0.7;
    const k = Math.min(1, f.t);
    f.m.position.lerpVectors(f.from, f.to, k);
    f.m.position.y += Math.sin(k * Math.PI) * 1.6;
    f.m.rotation.set(t * 9, t * 5, 0);
    f.m.scale.setScalar((1 - k * 0.6) * cs);
    if (k >= 1) {
      f.on = false; f.m.visible = false;
      setLevel(fill.level + 1 / COINS_TO_FILL);
      if (fill.item) fill.item.scale.setScalar(fill.base * 1.04);
    }
  });
  const full = isFull();
  // Voll: Münzen quellen oben heraus, fallen, springen am Boden ab
  if (full) {
    fill.acc += dt;
    if (fill.acc > 0.09) {
      fill.acc = 0;
      const s = spills.find((x) => !x.on);
      if (s) { s.on = true; s.age = 0; s.bounced = false; s.p.copy(top).add(new THREE.Vector3((Math.random() - 0.5) * size.x * 0.5, 0, (Math.random() - 0.5) * size.z * 0.4)); s.v.set((Math.random() - 0.5) * 2.4, 2 + Math.random() * 1.6, 0.6 + Math.random() * 1.4); s.m.visible = true; }
    }
  }
  spills.forEach((s) => {
    if (!s.on) return;
    s.age += dt;
    s.v.y -= 9.8 * dt;
    s.p.addScaledVector(s.v, dt);
    if (s.p.y < FLOOR_Y + 0.04) { s.p.y = FLOOR_Y + 0.04; if (!s.bounced) { s.v.y *= -0.35; s.v.x *= 0.5; s.v.z *= 0.5; s.bounced = true; } else s.v.set(0, 0, 0); }
    s.m.position.copy(s.p);
    if (s.v.lengthSq() > 0.01) s.m.rotation.set(s.age * 8, s.age * 3, 0); else s.m.rotation.set(0, 0, 0);
    const fade = s.age > 2.2 ? Math.max(0, 1 - (s.age - 2.2) / 0.5) : 1;
    s.m.scale.setScalar(Math.max(0.001, fade * cs));
    if (s.age > 2.7) { s.on = false; s.m.visible = false; }
  });
  // Tasche schwillt an und pulsiert, goldener Schein
  if (fill.item) {
    const target = fill.base * (1 + Math.min(1, fill.level) * 0.05 + (full ? 0.025 * Math.sin(t * 7) : 0));
    const cur = fill.item.scale.x;
    fill.item.scale.setScalar(cur + (target - cur) * Math.min(1, dt * 8));
  }
  fullGlow.position.copy(center);
  fullGlow.scale.setScalar(Math.max(size.x, size.y) * 1.8);
  fullGlowMat.opacity += ((full ? 0.45 + 0.15 * Math.sin(t * 5) : 0) - fullGlowMat.opacity) * Math.min(1, dt * 5);
  if (full !== fill.wasFull) { fill.wasFull = full; updateFillUi(); }
}


// ── Auswahl und Steuerung ──
const docId = (nr) => 't' + String(nr).padStart(2, '0');
function select(nr, fromPlay) {
  if (!fromPlay && playing) setPlaying(false);
  current = nr;
  const b = BAGS[nr - 1], t = tierById[b.tier];
  stageEl.style.setProperty('--c', t.color);
  $('tierChip').style.setProperty('--c', t.color);
  $('tierChip').lastElementChild.textContent = `${t.name} · Nr. ${b.nr}`;
  $('nrbox').textContent = `Nr. ${b.nr} / ${BAGS.length}`;
  $('bagName').textContent = b.name;
  $('bagText').textContent = b.text;
  $('fPrice').textContent = b.price === 0 ? 'Gratis' : fmtCoins(b.price) + ' Münzen';
  $('fCap').textContent = b.capacity === null ? 'Unbegrenzt' : fmtCoins(b.capacity) + ' Münzen';
  $('buildbar').style.width = '0';
  buildBag(nr);
  updateFillUi();
  document.querySelectorAll('[data-show]').forEach((el) => el.setAttribute('aria-pressed', String(+el.dataset.show === nr)));
  try { history.replaceState(null, '', '#' + docId(nr)); } catch {}
}
function setPlaying(on) {
  playing = on;
  $('play').setAttribute('aria-pressed', String(on));
  $('play').textContent = on ? '❚❚ Anhalten' : '▶ Alle nacheinander bauen';
}
function setWalking(on) {
  walk.on = on;
  $('walk').setAttribute('aria-pressed', String(on));
  $('walk').textContent = on ? '■ Stehen bleiben' : '🚶 Geradeaus laufen';
}
$('walk').addEventListener('click', () => setWalking(!walk.on));
$('play').addEventListener('click', () => { const on = !playing; setPlaying(on); if (on) select(current, true); });
$('prev').addEventListener('click', () => select(current > 1 ? current - 1 : BAGS.length));
$('next').addEventListener('click', () => select(current < BAGS.length ? current + 1 : 1));
$('rebuild').addEventListener('click', () => select(current, playing));
// Karten in der Liste: „3D ansehen“
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-show]');
  if (!btn) return;
  select(+btn.dataset.show);
  document.getElementById('vorschau').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
});
window.addEventListener('hashchange', () => { const m = /^#t(\d{2})$/.exec(location.hash); if (m && +m[1] !== current && +m[1] >= 1 && +m[1] <= 99) select(+m[1]); });

// ── Start ──
const start = /^#t(\d{2})$/.exec(location.hash);
resize();
select(start && +start[1] >= 1 && +start[1] <= 99 ? +start[1] : 1);
requestAnimationFrame(frame);
