// Edelsteine in 3D: Schleiftisch mit Steckbrief und Werkbank, Vitrine aller Kristalle und die Mutationen mit 3D-Vorschau.
// Daten und Modelle kommen aus kristalle.js, das auch die Schleiferei nutzt.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import {
  Burst,
  CUTS,
  FXS,
  GEMS,
  GEM_FACTOR,
  INCLUSIONS,
  INC_BY_ID,
  MATS,
  MUT_PREVIEW,
  MUT_ROLL,
  MUT_SOUND,
  MYSTERY,
  POLISH_MUTATIONS,
  Sound,
  TAU,
  TEXS,
  TIERS,
  VIOLET,
  WEIGHTS,
  applyMutFx,
  billboard,
  bumpEl,
  causticTexture,
  classRange,
  cloud,
  consumeNewFind,
  countUp,
  createGem,
  disposeGroup,
  finds,
  fmtChance,
  fmtGrams,
  fmtNum,
  fmtPct,
  fmtValue,
  gemById,
  lookText,
  makeMut,
  mutById,
  mutLabel,
  nebulaTexture,
  nf,
  reduceMotion,
  revealInto,
  roundG,
  tierById,
  v3,
} from './kristalle.js';

const shots = [];
function shot(kind, color, dur, fn, { behind = false, pos = null } = {}) {
  const sp = billboard(kind, color, 1, 1);
  sp.material.depthTest = behind; sp.renderOrder = behind ? -1 : 7;
  scene.add(sp); shots.push({ sp, t0: performance.now(), dur: dur * 1000, fn, pos });
}
function updateShots(now, y) {
  for (let i = shots.length - 1; i >= 0; i--) {
    const s = shots[i], k = (now - s.t0) / s.dur;
    if (k >= 1) { scene.remove(s.sp); s.sp.material.dispose(); shots.splice(i, 1); continue; }
    if (s.pos) s.sp.position.copy(s.pos); else s.sp.position.set(0, y, 0);
    s.fn(k, s.sp);
  }
}
let zoomKick = 0, shakeAmp = 0;
const spring = { s: 1, v: 0 };


// ── Hauptbühne ─────────────────────────────────────────────────────────────
const canvas = document.getElementById('view');
const stageEl = document.getElementById('stage');
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); } catch (e) { document.getElementById('fallback').hidden = false; }

let current = gemById[location.hash.slice(1)] || gemById['quarz'];
let benchGem = null;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(36, 4 / 3.3, 0.1, 100);
camera.position.set(0, 1.9, 5.8);
let controls, live = null, halo, sparkles, glowLight, floor, build = null, composer, bloom, burst;

if (renderer) {
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.03).texture;
  scene.background = nebulaTexture();
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(3, 5, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0xd9b26a, 1.4); rim.position.set(-4, 2, -3); scene.add(rim);
  glowLight = new THREE.PointLight(0xffffff, 0, 6); scene.add(glowLight);
  // zwei kleine Lichter kreisen um den Stein, damit Glanzpunkte über die Facetten wandern
  scene.userData.orbs = [new THREE.PointLight(0xffffff, 7, 6), new THREE.PointLight(0xffe2b0, 5, 6)];
  scene.userData.orbs.forEach((l) => scene.add(l));
  halo = billboard('glow', '#ffffff', 5, 0.2); halo.position.set(0, 0, -1.2); scene.add(halo);
  floor = new THREE.Mesh(new THREE.CircleGeometry(1.8, 64), new THREE.MeshBasicMaterial({ map: causticTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.6 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -1.35; scene.add(floor);
  sparkles = cloud(70, () => { const a = Math.random() * TAU, r = 1.5 + Math.random() * 1.3; return [Math.cos(a) * r, (Math.random() - 0.4) * 2.2, Math.sin(a) * r]; }, { size: 0.15, tex: 'star', opacity: 0.8 });
  scene.add(sparkles);
  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.enablePan = false; controls.minDistance = 3.2; controls.maxDistance = 10;
  controls.autoRotate = !reduceMotion; controls.autoRotateSpeed = 1.6;
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.5, 0.45, 0.9);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  burst = new Burst(); scene.add(burst.points);
  new ResizeObserver(() => { const w = stageEl.clientWidth, h = stageEl.clientHeight; renderer.setSize(w, h, false); composer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); }).observe(stageEl);
}


function showGem(gem, animate = true) {
  if (!renderer) return;
  if (live) { scene.remove(live.group); disposeGroup(live.group); }
  live = createGem(gem);
  if (previewMut && gem.id !== MYSTERY && mutById[previewMut]) {
    const o = { gem, crystal: live, mutGroup: new THREE.Group(), mutMods: [], mutUp: [], bigScale: 1 };
    live.extras.add(o.mutGroup); applyMutFx(o, makeMut(previewMut, previewInc));
    for (const f of o.mutMods) f(live.mesh.material, 1);
    live.mutO = o;
  }
  live.group.scale.setScalar(1.15);
  scene.add(live.group);
  const t = tierById[gem.tier], tc = new THREE.Color(t.color);
  halo.material.color.copy(new THREE.Color(gem.colors[1]).lerp(tc, 0.4));
  halo.material.opacity = 0.16 + Math.min(t.index, 7) * 0.045;
  floor.material.color.copy(new THREE.Color(gem.colors[1]).lerp(tc, 0.3));
  sparkles.material.color.set(gem.colors[0]);
  sparkles.visible = t.index >= 3 && !gem.look.fx.some((f) => ['regenbogen', 'schweif', 'urknall'].includes(f));
  const glows = gem.look.fx.some((f) => ['glut', 'neon', 'galaxie', 'urknall', 'flammen'].includes(f));
  glowLight.color.set(gem.colors[1]); glowLight.userData.on = glows;
  scene.background.dispose(); scene.background = nebulaTexture(1024, 768, t.color);
  bloom.strength = 0.22 + Math.min(t.index, 7) * 0.04 + (glows ? 0.15 : 0);
  build = null;
  if (animate && !reduceMotion) startBuild(live);
}

// Schleif-Animation: jede Facette fliegt von außen an ihren Platz, von unten nach oben
function startBuild(obj) {
  const geo = obj.mesh.geometry, pos = geo.attributes.position, base = pos.array.slice(), nor = geo.attributes.normal.array;
  const faces = pos.count / 3;
  let minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < pos.count; i++) { const y = base[i * 3 + 1]; minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
  const delay = new Float32Array(faces);
  for (let f = 0; f < faces; f++) delay[f] = (((base[f * 9 + 1] + base[f * 9 + 4] + base[f * 9 + 7]) / 3 - minY) / (maxY - minY || 1)) * 0.62 + Math.random() * 0.12;
  obj.extras.visible = false;
  build = { obj, geo, base, nor, delay, faces, t0: performance.now(), dur: faces > 3000 ? 2300 : 1900 };
  zoomKick = 6; Sound.whoosh(build.dur / 1000 * 0.95);
}
function stepBuild(now) {
  if (!build) return;
  const { obj, geo, base, nor, delay, faces, t0, dur } = build, t = (now - t0) / dur, arr = geo.attributes.position.array;
  for (let f = 0; f < faces; f++) {
    const k = Math.min(1, Math.max(0, (t - delay[f]) / 0.28)), e = 1 - Math.pow(1 - k, 3), o = f * 9;
    const cx = (base[o] + base[o + 3] + base[o + 6]) / 3, cy = (base[o + 1] + base[o + 4] + base[o + 7]) / 3, cz = (base[o + 2] + base[o + 5] + base[o + 8]) / 3;
    const d = (1 - e) * 2.4, fn = o; // Flächennormale ≈ Normale der ersten Ecke
    for (let v = 0; v < 3; v++) {
      const i = o + v * 3;
      arr[i] = cx + (base[i] - cx) * e + nor[fn] * d;
      arr[i + 1] = cy + (base[i + 1] - cy) * e + nor[fn + 1] * d + (1 - e) * 1.2;
      arr[i + 2] = cz + (base[i + 2] - cz) * e + nor[fn + 2] * d;
    }
  }
  geo.attributes.position.needsUpdate = true;
  if (t > 1.05) { arr.set(base); geo.attributes.position.needsUpdate = true; obj.extras.visible = true; build = null; celebrate(benchGem || current); }
}

let last = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  if (!renderer) return;
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  const t = now / 1000;
  stepBuild(now);
  controls.update();
  let gy = 0;
  if (live) {
    // Feder für Pop-Effekte, Wackeln, leichtes Schwingen
    spring.v += (-140 * (spring.s - 1) - 10 * spring.v) * dt; spring.s += spring.v * dt;
    gy = reduceMotion ? 0 : Math.sin(now / 900) * 0.05;
    const sx = (Math.random() - 0.5) * shakeAmp, sy = (Math.random() - 0.5) * shakeAmp;
    live.group.position.set(sx, gy + sy, 0);
    live.group.rotation.z = reduceMotion ? 0 : Math.sin(now / 1600) * 0.04;
    live.group.scale.setScalar(1.15 * spring.s * (live.mutO?.bigScale || 1));
    if (live.mutO) for (const u of live.mutO.mutUp) u(reduceMotion ? 1.5 : t, reduceMotion ? 0 : dt, camera);
    live.update(reduceMotion ? 1.5 : t, reduceMotion ? 0 : dt, camera);
    if (['unerreichbar', 'unbekannt'].includes((benchGem || current).tier)) halo.material.color.setHSL((t * 0.08) % 1, 0.85, 0.6);
  }
  shakeAmp *= Math.exp(-dt * 7); zoomKick *= Math.exp(-dt * 2.6);
  camera.fov = 36 + zoomKick; camera.updateProjectionMatrix();
  burst.update(dt); updateShots(now, gy);
  if (sparkles.visible && !reduceMotion) { sparkles.rotation.y += dt * 0.15; sparkles.material.opacity = 0.55 + Math.sin(now / 260) * 0.3; }
  glowLight.intensity = glowLight.userData.on ? 5 + Math.sin(now / 500) * 2 : 0;
  scene.userData.orbs.forEach((l, i) => { const a = t * (0.7 + i * 0.35) + i * 2; l.position.set(Math.cos(a) * 2.3, 0.8 + Math.sin(t * 0.9 + i) * 0.9, Math.sin(a) * 2.3 + 0.6); });
  if (!reduceMotion) floor.rotation.z = t * 0.12;
  composer.render();
}
requestAnimationFrame(loop);

// ── Steckbrief ─────────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);
function fillInfo(gem) {
  const t = tierById[gem.tier];
  const chip = $('i-tier'); chip.textContent = t.name; chip.style.setProperty('--tc', t.color);
  $('i-name').textContent = gem.name;
  $('i-new').hidden = !gem.isNew;
  $('i-text').textContent = gem.text;
  $('i-cut').textContent = CUTS[gem.cut];
  $('i-mat').textContent = MATS[gem.look.mat];
  $('i-value').textContent = `${fmtValue(gem)} ◆`; $('i-value').title = 'Diamantstaub';
  $('i-chance').textContent = fmtChance(gem);
  $('i-fx').textContent = lookText(gem);
  $('unveil').hidden = gem.id !== MYSTERY;
  $('i-weight-row').hidden = gem.id === MYSTERY;
  if (gem.id !== MYSTERY) $('i-weight').textContent = `${fmtGrams(gem.grams[0])} bis ${fmtGrams(gem.grams[1])}`;
  $('i-value-label').textContent = gem.id === MYSTERY ? 'Grundwert' : 'Grundwert (Splitter)';
  renderWeights(gem);
  $('mut-preview').hidden = gem.id === MYSTERY;
  $('finds-wrap').hidden = gem.id !== MYSTERY || !finds.length;
  $('i-sw').innerHTML = gem.colors.map((c) => `<span style="background:${c}" title="${c}"></span>`).join('');
}
let previewMut = null;
function select(gem, { animate = true, mut = null } = {}) {
  current = gem; benchGem = null; previewMut = mut; renderMutChips();
  fillInfo(gem); showGem(gem, animate);
  document.querySelectorAll('.card').forEach((c) => c.setAttribute('aria-current', String(c.dataset.id === gem.id)));
  try { history.replaceState(null, '', '#' + gem.id); } catch (e) { /* egal */ }
}

// ── Vitrine ────────────────────────────────────────────────────────────────
const tiersEl = $('tiers');
tiersEl.innerHTML = TIERS.map((t) => {
  const gems = GEMS.filter((g) => g.tier === t.id).sort((a, b) => (a.isNew ? 1 : 0) - (b.isNew ? 1 : 0));
  const val = t.value * GEM_FACTOR;
  return `<div class="tier" data-tier="${t.id}">
    <div class="tier-meta">
      <span class="tier-chip${t.id === 'unerreichbar' || t.id === 'unbekannt' ? ' rainbow' : ''}" style="--tc:${t.color}">${t.name}</span>
      <small>${!val ? '? ◆ · 1 % · verwandelt sich' : (val >= 1e6 ? nf.format(val / 1e6) + ' Mio.' : nf.format(val)) + ' ◆ · ' + t.chance.toLocaleString('de-DE') + ' % Stufe'}</small>
    </div>
    <div class="grid">${gems.map((g) => `
      <button class="card" type="button" data-id="${g.id}" data-new="${g.isNew ? 1 : 0}" style="--tc:${t.color}" aria-current="false">
        <span class="thumb" id="th-${g.id}"><span class="ph" style="--l:${g.colors[0]};--m:${g.colors[1]};--d:${g.colors[2]}"></span></span>
        <span class="card-name">${g.name}</span>
        <span class="card-cut">${CUTS[g.cut]}${g.id === MYSTERY ? '' : ' · ' + fmtPct(g.chance)}</span>
        ${g.isNew ? '<span class="new-tag">NEU</span>' : ''}
      </button>`).join('')}
    </div>
  </div>`;
}).join('');

tiersEl.addEventListener('click', (e) => {
  const card = e.target.closest('.card'); if (!card) return;
  showTab('info', false); select(gemById[card.dataset.id]);
  stageEl.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
});
document.querySelectorAll('.filter .chip').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('.filter .chip').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  const f = b.dataset.f;
  document.querySelectorAll('.card').forEach((c) => { const isNew = c.dataset.new === '1'; c.classList.toggle('is-hidden', (f === 'neu' && !isNew) || (f === 'alt' && isNew)); });
}));

// Vorschaubilder: ein kleiner zweiter Renderer zeichnet alle 40 Steine nacheinander
function renderThumbs() {
  let tr;
  try { tr = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); } catch (e) { return; }
  const S = 240;
  tr.setSize(S, S, false); tr.setPixelRatio(1);
  tr.toneMapping = THREE.ACESFilmicToneMapping; tr.toneMappingExposure = 1.1; tr.outputColorSpace = THREE.SRGBColorSpace;
  const ts = new THREE.Scene(), pm = new THREE.PMREMGenerator(tr);
  ts.environment = pm.fromScene(new RoomEnvironment(tr), 0.03).texture;
  ts.background = nebulaTexture(256, 256, '#3a2a5a');
  const k = new THREE.DirectionalLight(0xffffff, 2.2); k.position.set(3, 5, 4); ts.add(k);
  const r2 = new THREE.DirectionalLight(0xd9b26a, 1.2); r2.position.set(-4, 2, -3); ts.add(r2);
  const cam = new THREE.PerspectiveCamera(32, 1, 0.1, 50); cam.position.set(0, 1.9, 5.4); cam.lookAt(0, -0.05, 0);
  let i = 0;
  const next = () => {
    if (i >= GEMS.length) {
      // danach je Mutation ein Beispielkristall
      const mi = i - GEMS.length; if (mi >= POLISH_MUTATIONS.length) { tr.dispose(); pm.dispose(); return; }
      i++;
      const mut = POLISH_MUTATIONS[mi], gem = gemById[MUT_PREVIEW[mut.id]] || GEMS[0];
      const obj = createGem(gem), o = { gem, crystal: obj, mutGroup: new THREE.Group(), mutMods: [], mutUp: [], bigScale: 1 };
      obj.group.add(o.mutGroup); applyMutFx(o, makeMut(mut.id, 'ammonit'));
      for (const f of o.mutMods) f(obj.mesh.material, 1);
      obj.update(1.3, 0.016, cam); for (const u of o.mutUp) u(1.3, 0.016, cam);
      obj.group.rotation.y = 0.5; obj.group.scale.setScalar(0.85 * o.bigScale);
      ts.add(obj.group); tr.render(ts, cam);
      const url = tr.domElement.toDataURL('image/png');
      ts.remove(obj.group); disposeGroup(obj.group);
      const holder = document.getElementById('mt-' + mut.id); if (holder) holder.innerHTML = `<img alt="" src="${url}">`;
      requestAnimationFrame(next); return;
    }
    const g = GEMS[i++];
    const obj = createGem(g);
    obj.group.rotation.y = 0.5;
    obj.update(1.3, 0.016, cam);
    ts.add(obj.group); tr.render(ts, cam);
    const url = tr.domElement.toDataURL('image/png');
    ts.remove(obj.group); disposeGroup(obj.group);
    const holder = document.getElementById('th-' + g.id);
    if (holder) holder.innerHTML = `<img alt="" src="${url}">`;
    requestAnimationFrame(next);
  };
  requestAnimationFrame(next);
}

// ── Tabs ───────────────────────────────────────────────────────────────────
function showTab(which, refresh = true) {
  const info = which === 'info';
  $('tab-info').setAttribute('aria-selected', String(info));
  $('tab-bench').setAttribute('aria-selected', String(!info));
  $('pane-info').hidden = !info; $('pane-bench').hidden = info;
  if (!refresh) return;
  if (info) { if (benchGem) { benchGem = null; showGem(current, false); } }
  else updateBench(true);
}
$('tab-info').addEventListener('click', () => showTab('info'));
$('tab-bench').addEventListener('click', () => { loadBench(current); showTab('bench'); });
$('to-bench').addEventListener('click', () => { loadBench(current); showTab('bench'); });

// ── Werkbank ───────────────────────────────────────────────────────────────
const opts = (obj) => Object.entries(obj).map(([id, n]) => `<option value="${id}">${n}</option>`).join('');
$('b-tier').innerHTML = TIERS.map((t) => `<option value="${t.id}">${t.name}</option>`).join('');
$('b-cut').innerHTML = opts(Object.fromEntries(Object.entries(CUTS).sort((a, b) => a[1].localeCompare(b[1], 'de'))));
$('b-mat').innerHTML = opts(MATS);
$('b-tex').innerHTML = opts(TEXS);
$('b-fx').innerHTML = opts(Object.fromEntries(Object.entries(FXS).map(([k, v]) => [k, v.split(',')[0]])));

function loadBench(gem) {
  $('b-name').value = `${gem.name} (Kopie)`;
  $('b-tier').value = gem.tier; $('b-text').value = gem.text;
  [0, 1, 2].forEach((k) => ($('b-c' + k).value = gem.colors[k]));
  $('b-cut').value = gem.cut; $('b-mat').value = gem.look.mat; $('b-tex').value = gem.look.tex || '';
  $('b-fx').value = gem.look.fx[0] || '';
}
const slug = (s) => s.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'stein';
const esc = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
function updateBench(animate = false) {
  const name = $('b-name').value.trim() || 'Mein Stein';
  const look = { cut: $('b-cut').value, mat: $('b-mat').value, tex: $('b-tex').value, fx: $('b-fx').value ? [$('b-fx').value] : [] };
  benchGem = { id: slug(name), name, tier: $('b-tier').value, cut: look.cut, colors: [0, 1, 2].map((k) => $('b-c' + k).value), text: $('b-text').value.trim(), look };
  const lk = [`cut: '${look.cut}'`, `mat: '${look.mat}'`, look.tex ? `tex: '${look.tex}'` : '', look.fx.length ? `fx: ['${look.fx[0]}']` : ''].filter(Boolean).join(', ');
  $('b-code').textContent = `{ id: '${benchGem.id}', name: '${esc(name)}', tier: '${benchGem.tier}', colors: [${benchGem.colors.map((c) => `'${c}'`).join(', ')}], text: '${esc(benchGem.text)}', look: { ${lk} } },`;
  showGem(benchGem, animate);
}
['b-name', 'b-text', 'b-c0', 'b-c1', 'b-c2', 'b-tier'].forEach((id) => $(id).addEventListener('input', () => updateBench(false)));
['b-cut', 'b-mat', 'b-tex', 'b-fx'].forEach((id) => $(id).addEventListener('input', () => updateBench(true)));

$('b-random').addEventListener('click', () => {
  const h = Math.random() * 360;
  const hsl = (s, l, dh = 0) => '#' + new THREE.Color().setHSL(((h + dh) % 360) / 360, s, l).getHexString();
  $('b-c0').value = hsl(0.9, 0.9); $('b-c1').value = hsl(0.8, 0.55); $('b-c2').value = hsl(0.85, 0.22, Math.random() < 0.3 ? 120 : 0);
  const pick = (o) => { const k = Object.keys(o); return k[Math.floor(Math.random() * k.length)]; };
  $('b-cut').value = pick(CUTS); $('b-mat').value = pick(MATS);
  $('b-tex').value = Math.random() < 0.3 ? pick(TEXS) : ''; $('b-fx').value = Math.random() < 0.6 ? pick(FXS) : '';
  updateBench(true);
});
$('b-copy').addEventListener('click', async () => {
  const text = $('b-code').textContent;
  try { await navigator.clipboard.writeText(text); $('b-toast').textContent = 'Kopiert'; }
  catch (e) { const r = document.createRange(); r.selectNodeContents($('b-code')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); $('b-toast').textContent = 'Markiert, mit Strg+C kopieren'; }
  setTimeout(() => ($('b-toast').textContent = ''), 2400);
});

// ── Bühnen-Knöpfe ──────────────────────────────────────────────────────────
$('rebuild').addEventListener('click', () => { if (live && !reduceMotion) showGem(benchGem || current, true); });
$('spin').addEventListener('click', () => {
  if (!controls) return;
  controls.autoRotate = !controls.autoRotate;
  $('spin').setAttribute('aria-pressed', String(controls.autoRotate));
  $('spin').textContent = `Drehen: ${controls.autoRotate ? 'an' : 'aus'}`;
});
if (reduceMotion) { $('spin').setAttribute('aria-pressed', 'false'); $('spin').textContent = 'Drehen: aus'; }
addEventListener('hashchange', () => { const g = gemById[location.hash.slice(1)]; if (g && g !== current) select(g); });


const showReveal = (gem) => revealInto($('reveal'), gem);
function celebrate(gem) {
  if (!live) return;
  const t = tierById[gem.tier], ti = t.index;
  const cols = [...gem.colors, t.color].map((c) => new THREE.Color(c));
  const o = v3(0, live.group.position.y, 0);
  burst.spawn(36 + ti * 26, o, cols, 2.3 + ti * 0.25);
  shot('glow', '#ffffff', 0.55, (k, sp) => { sp.scale.setScalar(1 + k * 6); sp.material.opacity = (1 - k) * 0.9; });
  shot('ring', t.color, 0.85, (k, sp) => { sp.scale.setScalar(1.4 + k * 7); sp.material.opacity = (1 - k) * 0.85; });
  if (ti >= 4) shot('ring', gem.colors[0], 1.1, (k, sp) => { const q = Math.max(0, k - 0.15) / 0.85; sp.scale.setScalar(1 + q * 9); sp.material.opacity = (1 - q) * 0.6; });
  if (ti >= 6) shot('rays', gem.colors[0], 2, (k, sp) => { sp.scale.setScalar(2 + Math.sin(Math.min(1, k * 3) * Math.PI / 2) * 5.5); sp.material.rotation = k * 1.6; sp.material.opacity = (k < 0.6 ? 1 : (1 - k) / 0.4) * 0.7; }, { behind: true });
  if (ti >= 8) setTimeout(() => burst.spawn(90, o, cols, 4.6, 1.2), 260);
  if (ti === 9) setTimeout(() => burst.spawn(160, o, Array.from({ length: 8 }, (_, i) => new THREE.Color().setHSL(i / 8, 1, 0.62)), 5.5, 2), 520);
  spring.v += 4 + ti * 0.5; zoomKick = -3 - ti * 0.35; shakeAmp = 0.04 + ti * 0.014;
  Sound.chime(ti);
  showReveal(gem);
  countUp($('i-value'), t.value * GEM_FACTOR, ' ◆');
  const nm = $('i-name'); nm.classList.remove('pop'); void nm.offsetWidth; nm.classList.add('pop');
}


// ── Polieren: Stein antippen ───────────────────────────────────────────────
let dust = 0; try { dust = Number(localStorage.getItem('schleiferei-staub')) || 0; } catch (e) { /* egal */ }
const dustEl = $('dust'), comboEl = $('combo');
const showDust = () => { dustEl.textContent = `◆ ${fmtNum(dust)}`; const h = document.getElementById('h-dust'); if (h) h.textContent = `◆ ${fmtNum(dust)}`; };
showDust();
let combo = 0, lastTap = 0, comboTimer;
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function pick(e) {
  if (!live) return null;
  const r = canvas.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  return ray.intersectObject(live.mesh, false)[0] || null;
}
function floatText(e, text, color) {
  const r = stageEl.getBoundingClientRect(), el = document.createElement('span');
  el.className = 'float'; el.textContent = text; el.style.setProperty('--tc', color);
  el.style.left = `${e.clientX - r.left}px`; el.style.top = `${e.clientY - r.top - 10}px`;
  stageEl.appendChild(el); setTimeout(() => el.remove(), 1000);
}

$('unveil').addEventListener('click', () => { location.href = '../schleiferei/'; });
function polish(hit, e) {
  const gem = benchGem || current, t = tierById[gem.tier];
  if (gem.id === MYSTERY && !benchGem) {
    burst.spawn(14, hit.point, VIOLET, 1.5, 0.6); spring.v += 2.5; shakeAmp = Math.max(shakeAmp, 0.03); Sound.tick(5, 4);
    floatText(e, '? Öffne mich in der Schleiferei', t.color);
    return;
  }
  const now = performance.now();
  combo = now - lastTap < 650 ? Math.min(combo + 1, 25) : 1; lastTap = now;
  const mult = Math.min(10, 1 + Math.floor((combo - 1) / 3));
  const amount = t.value * GEM_FACTOR * mult;
  dust += amount; showDust(); bumpEl(dustEl);
  try { localStorage.setItem('schleiferei-staub', String(dust)); } catch (err) { /* egal */ }
  burst.spawn(12 + t.index * 3 + combo, hit.point, [...gem.colors, t.color].map((c) => new THREE.Color(c)), 1.5 + combo * 0.05, 0.6);
  spring.v += 2 + Math.min(combo, 10) * 0.25; shakeAmp = Math.max(shakeAmp, 0.015 + combo * 0.002);
  Sound.tick(t.index, combo);
  floatText(e, `+${fmtNum(amount)} ◆${mult > 1 ? `  ×${mult}` : ''}`, t.color);
  comboEl.style.setProperty('--tc', t.color);
  if (combo >= 3) { comboEl.textContent = `Combo ×${mult} · ${combo} Treffer`; comboEl.classList.add('on'); bumpEl(comboEl); }
  if (combo > 0 && combo % 10 === 0) { shot('ring', t.color, 0.6, (k, sp) => { sp.scale.setScalar(1 + k * 5); sp.material.opacity = (1 - k) * 0.8; }); Sound.chime(Math.min(9, t.index + 2)); }
  clearTimeout(comboTimer); comboTimer = setTimeout(() => { comboEl.classList.remove('on'); combo = 0; }, 900);
}
let down = null;
canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
canvas.addEventListener('pointerup', (e) => {
  if (!down) return;
  const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y); down = null;
  if (moved > 6 || build) return;
  const hit = pick(e); if (hit) polish(hit, e);
});
let hoverQueued = false;
canvas.addEventListener('pointermove', (e) => {
  if (e.buttons || hoverQueued) return; hoverQueued = true;
  requestAnimationFrame(() => { hoverQueued = false; canvas.style.cursor = pick(e) ? 'pointer' : 'grab'; });
});

// Karten kippen zur Maus
tiersEl.addEventListener('pointermove', (e) => {
  const c = e.target.closest('.card'); if (!c || reduceMotion) return;
  const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
  c.style.setProperty('--ry', `${(x * 16).toFixed(1)}deg`); c.style.setProperty('--rx', `${(-y * 16).toFixed(1)}deg`);
});
tiersEl.addEventListener('pointerout', (e) => {
  const c = e.target.closest('.card');
  if (c && !c.contains(e.relatedTarget)) { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); }
});


function renderFinds() {
  const fresh = consumeNewFind();
  ['finds'].forEach((id) => { const el = $(id); if (!el) return; el.hidden = !finds.length; el.textContent = `Funde ${finds.length}`; });
  $('finds-wrap').hidden = current.id !== MYSTERY || !finds.length;
  if (!finds.length) return;
  const wById = Object.fromEntries(WEIGHTS.map((w) => [w.id, w]));
  $('findlog').innerHTML = finds.slice(0, 5).map((f, i) => {
    const g = gemById[f.id], w = wById[f.w]; if (!g || !w) return '';
    const mt = (f.m || []).map((id) => (id.startsWith('einschluss:') ? `Einschluss (${INC_BY_ID[id.slice(11)]?.name ?? '?'})` : mutById[id]?.name)).filter(Boolean).join(', ');
    return `<li class="${i === 0 && fresh ? 'new' : ''}" style="--tc:${tierById[g.tier].color};--wc:${w.color}"><span>${g.name}${mt ? ` · ${mt}` : ''}</span><span>${fmtGrams(f.g)} · ${w.name}</span></li>`;
  }).join('');
  const best = finds.reduce((a, b) => (b.g > a.g ? b : a));
  const total = finds.reduce((sum, f) => sum + f.g, 0);
  $('record').innerHTML = `Schwerster Fund: <b>${gemById[best.id]?.name ?? '?'} mit ${fmtGrams(best.g)}</b> · zusammen ${fmtGrams(roundG(total))} in ${finds.length} Funden`;
}
// Gewichtstabelle im Steckbrief: beim Kristall seine Gewichtsklassen, beim ?-Stein die Stufen-Chancen
function renderWeights(gem) {
  $('mut-info').hidden = gem.id !== MYSTERY;
  if (gem.id === MYSTERY) {
    const per = (m) => m.chance * MUT_ROLL;
    $('muttable').innerHTML = POLISH_MUTATIONS.map((m) => `<li style="--wc:${m.color}" title="${m.desc}"><span>${m.name}</span><span class="num">${mutLabel(m)}</span><span class="num chance">${fmtPct(per(m))}</span></li>`).join('')
      + `<li style="--wc:var(--muted)"><span class="num">Chance pro Wurf, 4 verdeckte Würfe, höchstens 2 Mutationen</span><span></span><span></span></li>`;
    $('w-title').textContent = 'Was in einem ?-Stein stecken kann';
    $('wtable').innerHTML = TIERS.filter((t) => t.id !== 'unbekannt').map((t) => {
      const sum = GEMS.filter((g) => g.tier === t.id).reduce((a, g) => a + g.chance, 0);
      return `<li style="--wc:${t.color}"><span>${t.name}</span><span class="num">${GEMS.filter((g) => g.tier === t.id).length} Kristalle</span><span class="num chance">${fmtPct(sum)}</span></li>`;
    }).join('');
  } else {
    $('w-title').textContent = 'Gewicht beim Fund';
    $('wtable').innerHTML = WEIGHTS.map((w) => {
      const [lo, hi] = classRange(gem, w);
      return `<li style="--wc:${w.color}"><span>${w.name} <span class="num">×${w.mult}</span></span><span class="num">${fmtGrams(lo).replace(' g', '')}–${fmtGrams(hi)}</span><span class="num chance">${fmtPct(w.chance)}</span></li>`;
    }).join('');
  }
}


$('mut-list').innerHTML = POLISH_MUTATIONS.map((m) => `<li style="--mc:${m.color}"${m.premium ? ' class="premium"' : ''}><span class="thumb mut-thumb" id="mt-${m.id}"><span class="ph" style="--l:${m.color};--m:${m.color};--d:#1a1424"></span></span><div class="mut-head"><span class="mut-chip" style="--mc:${m.color}">${m.name} ${mutLabel(m)}</span><span class="num">${fmtPct(m.chance * MUT_ROLL)} pro Wurf</span></div><p>${m.desc}</p>${m.id === 'einschluss' ? `<ul class="wtable inc-table">${INCLUSIONS.map((i) => `<li style="--wc:${i.color}"><span>${i.name} <span class="num">${i.kind}</span></span><span class="num">×${i.mult.toLocaleString('de-DE')}</span><span class="num chance">${fmtPct(i.chance)}</span></li>`).join('')}</ul>` : ''}</li>`).join('');

// Mutationen im Betrachter in 3D ansehen
let previewInc = 'ammonit';
function renderMutChips() {
  const el = $('mut-chips'); if (!el) return;
  const ie = $('inc-chips'); ie.hidden = previewMut !== 'einschluss';
  ie.innerHTML = INCLUSIONS.map((i) => `<button class="chip" type="button" data-inc="${i.id}" style="--mc:${i.color}" aria-pressed="${previewInc === i.id}">${i.name} ×${i.mult.toLocaleString('de-DE')}</button>`).join('');
  el.innerHTML = `<button class="chip" type="button" data-mut="" aria-pressed="${!previewMut}">Ohne</button>` + POLISH_MUTATIONS.map((m) => `<button class="chip" type="button" data-mut="${m.id}" style="--mc:${m.color}" aria-pressed="${previewMut === m.id}">${m.name}</button>`).join('');
}
function previewMutation(id) {
  previewMut = id || null; renderMutChips();
  showGem(benchGem || current, false);
  if (previewMut && live) {
    const m = mutById[previewMut], c = new THREE.Color(m.color);
    burst.spawn(80, v3(0, 0, 0.3), [c, new THREE.Color('#ffffff')], 3, 1);
    shot('ring', m.color, 0.8, (k, sp) => { sp.scale.setScalar(1 + k * 7); sp.material.opacity = (1 - k) * 0.8; });
    (MUT_SOUND[m.id] || (() => Sound.chime(6)))();
  }
}
$('mut-chips').addEventListener('click', (e) => { const b = e.target.closest('[data-mut]'); if (b) previewMutation(b.dataset.mut); });
$('inc-chips').addEventListener('click', (e) => { const b = e.target.closest('[data-inc]'); if (b) { previewInc = b.dataset.inc; previewMutation('einschluss'); } });
renderMutChips();
$('mut-list').querySelectorAll(':scope > li').forEach((li, i) => {
  const m = POLISH_MUTATIONS[i]; li.tabIndex = 0; li.setAttribute('role', 'button'); li.setAttribute('aria-label', `${m.name} in 3D ansehen`);
  const go = () => { showTab('info', false); select(gemById[MUT_PREVIEW[m.id]] || GEMS[0], { animate: false, mut: m.id }); previewMutation(m.id); stageEl.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' }); };
  li.addEventListener('click', go); li.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
});

const soundBtn = $('sound');
const showSound = () => { soundBtn.setAttribute('aria-pressed', String(Sound.on)); soundBtn.textContent = `Ton: ${Sound.on ? 'an' : 'aus'}`; };
showSound();
soundBtn.addEventListener('click', () => {
  Sound.on = !Sound.on; showSound();
  try { localStorage.setItem('schleiferei-ton', Sound.on ? 'an' : 'aus'); } catch (e) { /* egal */ }
  if (Sound.on) Sound.tick(5, 1);
});

select(current);
renderFinds();
if (gemById[location.hash.slice(1)]) requestAnimationFrame(() => stageEl.scrollIntoView({ block: 'center' }));
setTimeout(renderThumbs, 300);

