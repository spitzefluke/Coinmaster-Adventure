// Edelstein-Schleiferei: ?-Steine aufbrechen und polieren. Erst kurz vor Schluss zeigt sich, welcher der 42 Kristalle
// darin steckt, wie schwer er ist und ob beim Polieren Mutationen entstanden sind. Daten und Modelle aus edelsteine/js/kristalle.js.

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import {
  Burst,
  INCLUSIONS,
  INC_BY_ID,
  MUT_SOUND,
  POLISH_PX,
  REVEAL_AT,
  Sound,
  VIOLET,
  WEIGHTS,
  applyMutFx,
  baseGeometry,
  billboard,
  bumpEl,
  cloud,
  consumeNewFind,
  crackTexture,
  createGem,
  disposeGroup,
  elasticOut,
  finds,
  fmtGrams,
  fmtNum,
  fmtPct,
  foundValue,
  freeDispose,
  gemById,
  logFind,
  mutById,
  mutHooks,
  mutMult,
  nebulaTexture,
  planarUV,
  revealInto,
  rndIn,
  rollGem,
  rollMutations,
  rollWeight,
  roundG,
  surface,
  tierById,
  v3,
} from '../../edelsteine/js/kristalle.js';

const $ = (id) => document.getElementById(id);
const huntEl = $('hunt'), huntCanvas = $('hunt-view');
const H = { temps: [], shots: [], o: null, visible: true, fovKick: 0 };
let opened = 0;

try {
  H.renderer = new THREE.WebGLRenderer({ canvas: huntCanvas, antialias: true });
} catch (e) { $('h-fallback').hidden = false; $('open-ui').hidden = true; }

// Mutationen wirken live auf dem Schleiftisch
mutHooks.isLive = (o) => H.o === o;
mutHooks.kick = (v) => { H.fovKick = Math.min(H.fovKick, v); };
mutHooks.burst = (...a) => H.burstO.spawn(...a);

// Diamantstaub und Funde (teilt sich den Speicher mit der Edelsteine-Seite)
let dust = 0; try { dust = Number(localStorage.getItem('schleiferei-staub')) || 0; } catch (e) { /* egal */ }
const showDust = () => { $('h-dust').textContent = `◆ ${fmtNum(dust)}`; };
function renderFinds() {
  const fresh = consumeNewFind();
  $('h-finds').textContent = `Funde ${finds.length}`;
  $('finds-wrap').hidden = !finds.length; $('finds-empty').hidden = !!finds.length;
  if (!finds.length) return;
  const wById = Object.fromEntries(WEIGHTS.map((w) => [w.id, w]));
  $('findlog').innerHTML = finds.slice(0, 8).map((f, i) => {
    const g = gemById[f.id], w = wById[f.w]; if (!g || !w) return '';
    const mt = (f.m || []).map((id) => (id.startsWith('einschluss:') ? `Einschluss (${INC_BY_ID[id.slice(11)]?.name ?? '?'})` : mutById[id]?.name)).filter(Boolean).join(', ');
    return `<li class="${i === 0 && fresh ? 'new' : ''}" style="--tc:${tierById[g.tier].color};--wc:${w.color}"><a href="../edelsteine/#${g.id}">${g.name}</a>${mt ? `<span class="muts"> · ${mt}</span>` : ''}<span>${fmtGrams(f.g)} · ${w.name}</span></li>`;
  }).join('');
  const best = finds.reduce((a, b) => (b.g > a.g ? b : a));
  const total = finds.reduce((sum, f) => sum + f.g, 0);
  $('record').innerHTML = `Schwerster Fund: <b>${gemById[best.id]?.name ?? '?'} mit ${fmtGrams(best.g)}</b> · zusammen ${fmtGrams(roundG(total))} in ${finds.length} Funden`;
}

function floatHunt(pos, text, color, cam) {
  const v = pos.clone().project(cam), r = huntEl.getBoundingClientRect(), el = document.createElement('span');
  el.className = 'float'; el.textContent = text; el.style.setProperty('--tc', color);
  el.style.left = `${(v.x + 1) / 2 * r.width}px`; el.style.top = `${(1 - v.y) / 2 * r.height - 10}px`;
  huntEl.appendChild(el); setTimeout(() => el.remove(), 1000);
}
// Besonderer Auftritt einzelner Mutationen
const MUT_INTRO = {
  rissig: (o, c0) => {
    H.fovKick = -7; o.sp.v += 10;
    H.burstO.spawn(160, c0, [new THREE.Color('#d8d0c4'), new THREE.Color('#8a8290'), new THREE.Color('#fff4dc')], 5, 0.4);
    huntShot(H.open, 'glow', '#ffffff', 0.25, c0, (k, sp) => { sp.scale.setScalar(4 + k * 10); sp.material.opacity = 1 - k; });
    // ein riesiger Riss zieht sich über das Bild
    const crack = new THREE.Sprite(new THREE.SpriteMaterial({ map: crackTexture(6), color: '#fff4dc', transparent: true, depthTest: false, blending: THREE.AdditiveBlending }));
    crack.position.set(0, 0.45, 1.6); crack.renderOrder = 9; H.open.add(crack);
    H.temps.push({ obj: crack, sc: H.open, t0: performance.now(), dur: 1100, fn: (k, sp) => { sp.scale.setScalar(1 + Math.min(1, k * 4) * 5); sp.material.opacity = k < 0.25 ? 1 : (1 - k) / 0.75; } });
    setTimeout(() => { Sound.whoosh(0.2); Sound.tone(55, 0, 0.6, 'sawtooth', 0.15); }, 180);
  },
  glaenzend: (o, c0) => {
    huntShot(H.open, 'glow', '#ffffff', 0.9, c0, (k, sp) => { sp.scale.setScalar(6 + k * 14); sp.material.opacity = Math.pow(1 - k, 2); });
    huntShot(H.open, 'rays', '#ffffff', 1.6, v3(0, 0, 0.6), (k, sp) => { sp.scale.setScalar(2 + k * 9); sp.material.rotation = k * 1.2; sp.material.opacity = (1 - k) * 0.9; });
    // ein Glanzstreifen rast quer über das ganze Bild
    huntShot(H.open, 'glow', '#ffffff', 0.7, v3(-4, 0.45, 1.4), (k, sp) => { sp.position.x = -4 + k * 8; sp.scale.set(0.6, 9, 1); sp.material.rotation = 0.5; sp.material.opacity = Math.sin(k * Math.PI) * 0.9; });
    H.burstO.spawn(160, c0, [new THREE.Color('#ffffff'), new THREE.Color('#dff2ff')], 4.5, 0.6);
  },
  einschluss: (o, c0) => {
    // ein Bernsteintropfen fällt von oben in den Kristall
    const drop = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 16), new THREE.MeshStandardMaterial({ color: '#e0962c', emissive: '#a05010', emissiveIntensity: 0.6, roughness: 0.1, transparent: true }));
    drop.scale.set(1, 1.3, 1); H.open.add(drop);
    H.temps.push({ obj: drop, sc: H.open, t0: performance.now(), dur: 450, fn: (k, m) => { m.position.set(0, 3 - k * k * 2.6, 0.4); m.material.opacity = k > 0.85 ? (1 - k) / 0.15 : 1; } });
    huntShot(H.open, 'ring', '#ffb040', 1.4, c0, (k, sp) => { sp.scale.setScalar(1 + k * 12); sp.material.opacity = (1 - k) * 0.9; });
    huntShot(H.open, 'glow', '#ffb040', 1.2, c0, (k, sp) => { sp.scale.setScalar(3 + k * 6); sp.material.opacity = (1 - k) * 0.8; });
    H.burstO.spawn(120, c0, [new THREE.Color('#ffd27a'), new THREE.Color('#e0962c'), new THREE.Color('#fff0c8')], 2.4, 1.6);
    const inc = o.muts.find((m) => m.id === 'einschluss')?.inc;
    if (inc) {
      const r = INCLUSIONS.indexOf(inc) / (INCLUSIONS.length - 1);
      setTimeout(() => {
        if (H.o !== o) return;
        floatHunt(v3(0, -0.2, 0.6), inc.kind === 'Müll' ? `Nur Müll: ${inc.name} ×${inc.mult.toLocaleString('de-DE')}` : `${inc.kind}: ${inc.name}! ×${inc.mult.toLocaleString('de-DE')}`, inc.color, H.camO);
        const last = huntEl.querySelector('.float:last-of-type'); if (last) last.classList.add('big');
        if (inc.kind === 'Müll') { Sound.tone(160, 0, 0.35, 'triangle', 0.08); Sound.tone(110, 0.18, 0.5, 'triangle', 0.08); }
        else if (r >= 0.6) { H.burstO.spawn(100 + r * 150, c0, [new THREE.Color(inc.color), new THREE.Color('#ffffff'), new THREE.Color('#ffd27a')], 3.5 + r * 2, 1.4); huntShot(H.open, 'rays', inc.color, 2, v3(0, 0.45, -0.5), (k, sp) => { sp.scale.setScalar(2 + k * 6); sp.material.rotation = k * 1.5; sp.material.opacity = (1 - k) * 0.8; }, true); Sound.chime(Math.min(9, 6 + Math.round(r * 3))); H.fovKick = -3 - r * 3; }
        else Sound.chime(5);
      }, 600);
    }
  },  magmakern: (o, c0) => {
    H.fovKick = -5; o.sp.v += 8;
    H.burstO.spawn(200, c0, [new THREE.Color('#ff5a1a'), new THREE.Color('#ffb040'), new THREE.Color('#ff2a0a')], 4.5, 3);
    huntShot(H.open, 'glow', '#ff6a1a', 1, c0, (k, sp) => { sp.scale.setScalar(3 + k * 9); sp.material.opacity = (1 - k) * 0.9; });
    huntShot(H.open, 'ring', '#ff7a2a', 1, c0, (k, sp) => { sp.scale.setScalar(1 + k * 10); sp.material.opacity = (1 - k) * 0.8; });
  },
  giftkristall: (o, c0) => {
    H.burstO.spawn(160, c0, [new THREE.Color('#7aff3a'), new THREE.Color('#3aff1a'), new THREE.Color('#c8ff8a')], 3, 1.2);
    huntShot(H.open, 'glow', '#5aff2a', 1.4, c0, (k, sp) => { sp.scale.setScalar(4 + k * 8); sp.material.opacity = (1 - k) * 0.7; });
    [0, 0.15, 0.3, 0.45].forEach((d) => setTimeout(() => Sound.tone(300 + Math.random() * 300, 0, 0.08, 'sine', 0.06), d * 1000));
  },
  eisherz: (o, c0) => {
    [0, 0.2].forEach((d) => setTimeout(() => huntShot(H.open, 'ring', '#dff6ff', 1, c0, (k, sp) => { sp.scale.setScalar(1 + k * 10); sp.material.opacity = (1 - k) * 0.85; }), d * 1000));
    huntShot(H.open, 'glow', '#bfe8ff', 1, c0, (k, sp) => { sp.scale.setScalar(4 + k * 8); sp.material.opacity = (1 - k) * 0.8; });
    H.burstO.spawn(180, c0, [new THREE.Color('#ffffff'), new THREE.Color('#bfe8ff'), new THREE.Color('#5ac8ff')], 3.6, 0.2);
  },
  blitzkristall: (o, c0) => {
    // ein Blitz schlägt von oben ein
    const g2 = new THREE.BufferGeometry().setFromPoints(Array.from({ length: 16 }, (_, i) => v3((Math.random() - 0.5) * 0.4 * (i > 0 && i < 15 ? 1 : 0), 6 - i * 0.37, 0.4)));
    const bolt = new THREE.Line(g2, new THREE.LineBasicMaterial({ color: '#fffbe0', transparent: true, blending: THREE.AdditiveBlending, depthTest: false })); bolt.renderOrder = 9; H.open.add(bolt);
    H.temps.push({ obj: bolt, sc: H.open, t0: performance.now(), dur: 500, fn: (k, l) => { l.material.opacity = Math.random() < 0.7 ? 1 - k : 0; } });
    huntShot(H.open, 'glow', '#fffbe0', 0.4, c0, (k, sp) => { sp.scale.setScalar(8 + k * 8); sp.material.opacity = 1 - k; });
    H.burstO.spawn(150, c0, [new THREE.Color('#ffe94a'), new THREE.Color('#ffffff')], 5, 0.5);
    H.fovKick = -6; o.sp.v += 9;
  },
  bluetenkristall: (o, c0) => {
    H.burstO.spawn(180, c0, [new THREE.Color('#ffb8e0'), new THREE.Color('#ff6ab8'), new THREE.Color('#ffd23a'), new THREE.Color('#ffffff')], 3, 0.8);
    huntShot(H.open, 'glow', '#ff8ad8', 1.2, c0, (k, sp) => { sp.scale.setScalar(3 + k * 8); sp.material.opacity = (1 - k) * 0.75; });
  },
  regenbogen: (o, c0) => {
    for (let i = 0; i < 7; i++) setTimeout(() => huntShot(H.open, 'ring', new THREE.Color().setHSL(i / 7 * 0.85, 1, 0.6), 1, c0, (k, sp) => { sp.scale.setScalar(1 + k * 9); sp.material.opacity = (1 - k) * 0.8; }), i * 70);
    H.burstO.spawn(180, c0, Array.from({ length: 7 }, (_, i) => new THREE.Color().setHSL(i / 7, 1, 0.62)), 4.4, 1.2);
    // bunte Feuerwerke links und rechts
    [-1.8, 1.8].forEach((x, j) => setTimeout(() => { if (H.o !== o) return; H.burstO.spawn(90, v3(x, 1.4, 0.2), Array.from({ length: 7 }, (_, i) => new THREE.Color().setHSL(i / 7, 1, 0.62)), 3, 0.4); Sound.tone(900 + j * 300, 0, 0.3, 'sine', 0.06); }, 450 + j * 250));
  },
  gigant: (o, c0) => {
    // drei Stampfer: bei jedem wächst der Kristall ein Stück, der Boden reißt, Felsen fliegen
    [0, 0.45, 0.9].forEach((d, i) => setTimeout(() => {
      if (H.o !== o) return;
      H.fovKick = -5 - i * 2; o.sp.v += 8 + i * 3;
      H.burstO.spawn(90 + i * 60, c0.clone().setY(-0.6), [new THREE.Color('#8a7660'), new THREE.Color('#ff9a3c'), new THREE.Color('#ffd27a')], 3 + i * 1.2, 2);
      huntShot(H.open, 'ring', '#ff9a3c', 1.1, c0.clone().setY(-0.5), (k, sp) => { sp.scale.setScalar(1 + k * (8 + i * 3)); sp.material.opacity = (1 - k) * 0.85; });
      Sound.tone(40 + i * 8, 0, 0.9, 'sine', 0.3);
    }, d * 1000));
    const crack = new THREE.Sprite(new THREE.SpriteMaterial({ map: crackTexture(8), color: '#ff7a2a', transparent: true, depthTest: false, blending: THREE.AdditiveBlending }));
    crack.position.set(0, -0.7, 1); crack.renderOrder = 9; H.open.add(crack);
    H.temps.push({ obj: crack, sc: H.open, t0: performance.now(), dur: 1800, fn: (k, sp) => { sp.scale.set(1 + k * 7, 0.6 + k * 1.6, 1); sp.material.opacity = k < 0.6 ? 1 : (1 - k) / 0.4; } });
  },
  phoenix: (o, c0) => {
    H.fovKick = -6; o.sp.v += 10;
    H.burstO.spawn(260, c0, [new THREE.Color('#ffd23a'), new THREE.Color('#ff7a1a'), new THREE.Color('#ff3a1a'), new THREE.Color('#ffffff')], 5.5, 2.5);
    huntShot(H.open, 'rays', '#ffb040', 2, v3(0, 0.45, -0.4), (k, sp) => { sp.scale.setScalar(2 + k * 10); sp.material.rotation = k * 2; sp.material.opacity = (1 - k) * 0.9; }, true);
    huntShot(H.open, 'glow', '#ffd23a', 1.2, c0, (k, sp) => { sp.scale.setScalar(5 + k * 12); sp.material.opacity = (1 - k); });
    const s0 = performance.now(); [0, 0.3, 0.6].forEach((d) => setTimeout(() => huntShot(H.open, 'ring', '#ff7a1a', 1.2, c0, (k, sp) => { sp.scale.setScalar(1 + k * 12); sp.material.opacity = (1 - k) * 0.85; }), d * 1000));
  },
  dimensionsriss: (o, c0) => {
    H.fovKick = -8; o.sp.v += 12;
    huntShot(H.open, 'glow', '#000000', 1.6, v3(0, 0.45, 1.5), (k, sp) => { sp.material.blending = THREE.NormalBlending; sp.scale.setScalar(30); sp.material.opacity = k < 0.3 ? 0.85 : (1 - k) / 0.7 * 0.85; });
    setTimeout(() => {
      if (H.o !== o) return;
      H.burstO.spawn(240, c0, [new THREE.Color('#b450ff'), new THREE.Color('#7af0ff'), new THREE.Color('#ffffff')], 5, 0.5);
      huntShot(H.open, 'glow', '#b450ff', 1.2, c0, (k, sp) => { sp.scale.set(1 + k * 3, 8 * Math.min(1, k * 4), 1); sp.material.opacity = (1 - k); });
      huntShot(H.open, 'ring', '#7af0ff', 1.3, c0, (k, sp) => { sp.scale.setScalar(1 + k * 13); sp.material.opacity = (1 - k) * 0.9; });
    }, 450);
  },
};
function implode(sc, color, dur) {
  const n = 110, start = Array.from({ length: n }, () => v3(...rndIn(1, 1, 1)).normalize().multiplyScalar(2.2 + Math.random() * 1.6));
  const pts = cloud(n, (i) => start[i].toArray(), { size: 0.16, tex: 'star', color });
  pts.renderOrder = 8; sc.add(pts);
  H.temps.push({ obj: pts, sc, t0: performance.now(), dur: dur * 1000, fn: (k, o) => {
    const a = o.geometry.attributes.position, e = k * k * k;
    for (let i = 0; i < n; i++) { const p = start[i].clone().multiplyScalar(1 - e); p.applyAxisAngle(v3(0, 1, 0), e * 2.5); a.setXYZ(i, p.x, p.y, p.z + 0.3); }
    a.needsUpdate = true; o.material.opacity = 0.4 + 0.6 * k;
  } });
}
function huntShot(sc, kind, color, dur, pos, fn, behind = false) {
  const sp = billboard(kind, color, 1, 1); sp.position.copy(pos);
  sp.material.depthTest = behind; sp.renderOrder = behind ? -1 : 7;
  sc.add(sp); H.shots.push({ sp, sc, t0: performance.now(), dur: dur * 1000, fn });
}
function setOpenUI(step, help, prog) {
  $('o-step').textContent = step; $('o-help').textContent = help;
  $('o-bar').style.width = `${Math.round(prog * 100)}%`;
  $('o-bar').parentElement.setAttribute('aria-valuenow', String(Math.round(prog * 100)));
}
function openStone() {
  if (!H.renderer || H.o) return;
  H.bloom.strength = 0.35;
  const gem = rollGem(), wt = rollWeight(gem);
  const shellGeo = baseGeometry('fragezeichen').clone();
  const shellMat = new THREE.MeshStandardMaterial({ map: surface('sprenkel', ['#9a8ab8', '#54476e', '#2a2238']), roughness: 0.75, metalness: 0.05, emissive: '#c77dff', emissiveMap: crackTexture(), emissiveIntensity: 0 });
  const shell = new THREE.Mesh(shellGeo, shellMat); shell.scale.setScalar(0.9);
  H.open.add(shell);
  H.o = { phase: 'break', gem, wt, hits: 0, need: 6 + Math.floor(Math.random() * 4), shell, shake: 0, sp: { s: 1, v: 0 }, prog: 0, needPx: POLISH_PX * (0.9 + Math.random() * 0.25), muts: rollMutations(), mutUp: [], mutMods: [], bigScale: 1, revealed: false };
  $('o-muts').innerHTML = '';
  H.halo.material.color.set('#b450ff');
  $('o-next').hidden = true; $('o-view').hidden = true;
  const rv = $('o-reveal'); rv.textContent = ''; rv.classList.remove('play'); rv.style.opacity = '0';
  setOpenUI('1 · Zerbrechen', `Klicke auf den Stein, bis er zerbricht. Noch ${H.o.need} Schläge.`, 0);
  Sound.whoosh(0.35);
}
function hitShell(hit) {
  const o = H.o; o.hits++;
  o.shake = 0.14; o.sp.v += 3.5; o.shell.material.emissiveIntensity = (o.hits / o.need) * 2.4;
  H.burstO.spawn(16 + o.hits * 2, hit.point, [new THREE.Color('#cfc8dc'), new THREE.Color('#8a7aa8'), VIOLET[0]], 2.2, 0.6);
  Sound.tone(95 + o.hits * 14, 0, 0.2, 'sine', 0.3); Sound.tone(60, 0, 0.25, 'triangle', 0.2); Sound.tick(1, o.hits);
  H.fovKick = -1.2;
  const left = o.need - o.hits;
  floatHunt(hit.point, left > 0 ? `${left}` : 'KRACH!', '#c77dff', H.camO);
  setOpenUI('1 · Zerbrechen', left > 0 ? `Weiter klicken! Noch ${left} ${left === 1 ? 'Schlag' : 'Schläge'}.` : 'Er bricht auf …', o.hits / o.need);
  if (left <= 0) shatter();
}
function shatter() {
  const o = H.o; o.phase = 'burst';
  const geo = o.shell.geometry, pos = geo.attributes.position, faces = pos.count / 3;
  o.base = pos.array.slice(); o.vel = new Float32Array(faces * 3);
  for (let f = 0; f < faces; f++) {
    const c = v3((o.base[f * 9] + o.base[f * 9 + 3] + o.base[f * 9 + 6]) / 3, (o.base[f * 9 + 1] + o.base[f * 9 + 4] + o.base[f * 9 + 7]) / 3, (o.base[f * 9 + 2] + o.base[f * 9 + 5] + o.base[f * 9 + 8]) / 3);
    const d = c.clone().add(v3((Math.random() - 0.5) * 0.6, 0.3, 0.6 + Math.random())).normalize().multiplyScalar(2.5 + Math.random() * 3.5);
    o.vel.set([d.x, d.y, d.z], f * 3);
  }
  o.shell.material.transparent = true; o.tb = performance.now();
  const c0 = v3(0, 0, 0.3);
  H.burstO.spawn(160, c0, [...VIOLET, new THREE.Color('#ffffff'), new THREE.Color('#cfc8dc')], 4.5, 1);
  huntShot(H.open, 'glow', '#ffffff', 0.6, c0, (k, sp) => { sp.scale.setScalar(1 + k * 8); sp.material.opacity = 1 - k; });
  huntShot(H.open, 'ring', '#c77dff', 0.8, c0, (k, sp) => { sp.scale.setScalar(1 + k * 8); sp.material.opacity = (1 - k) * 0.85; });
  Sound.whoosh(0.3); Sound.tone(180, 0, 0.5, 'sawtooth', 0.06); Sound.tone(90, 0, 0.6, 'sine', 0.25);
  H.fovKick = -4;
  // ein Rohklumpen erscheint, der bei jedem Stein gleich aussieht; der Kristall steckt versteckt darin
  const crustGeo = new THREE.IcosahedronGeometry(0.95, 3), cp = crustGeo.attributes.position;
  for (let i = 0; i < cp.count; i++) { const x = cp.getX(i), y = cp.getY(i), z = cp.getZ(i), k = 1 + 0.14 * Math.sin(x * 4.1 + 1) * Math.cos(z * 3.3) + 0.09 * Math.sin(y * 5.7 + z * 2) + 0.05 * Math.sin(x * 9 + y * 7); cp.setXYZ(i, x * k * 1.05, y * k * 0.9, z * k); }
  crustGeo.computeVertexNormals(); planarUV(crustGeo, 'xy');
  const crust = new THREE.Mesh(crustGeo, new THREE.MeshStandardMaterial({ map: surface('sprenkel', ['#a8a0b0', '#6a6274', '#3a3440']), roughness: 0.95, metalness: 0.05, flatShading: true, emissive: '#ffffff', emissiveMap: crackTexture(4), emissiveIntensity: 0, envMapIntensity: 0.3 }));
  crust.scale.setScalar(0.001); H.open.add(crust);
  o.crust = crust; o.crustT = performance.now() / 1000; o.rubTarget = crust;
  const obj = createGem(o.gem); obj.extras.visible = false; obj.group.visible = false;
  const m = obj.mesh.material;
  o.mt = { roughness: m.roughness, transmission: m.transmission, color: m.color.clone(), emissiveIntensity: m.emissiveIntensity, clearcoat: m.clearcoat, iridescence: m.iridescence, env: m.envMapIntensity, spec: m.specularIntensity };
  o.dull = o.mt.color.clone().lerp(new THREE.Color('#5f5868'), 0.82);
  o.mutGroup = new THREE.Group(); obj.group.add(o.mutGroup);
  o.crystal = obj; o.cs = 0.62 + 0.38 * Math.min(1, (Math.log10(o.wt.grams / o.gem.grams[0]) / Math.log10(o.gem.grams[1] / o.gem.grams[0])));
  obj.group.scale.setScalar(0.001); o.growT = performance.now() / 1000;
  H.open.add(obj.group);
  applyPolish(0);
  setTimeout(() => {
    if (H.o !== o) return;
    o.phase = 'polish';
    setOpenUI('2 · Polieren', 'Halte gedrückt und reibe über den Rohklumpen. Was wohl darin steckt?', 0);
  }, 900);
}
function crustPolish(k) {
  const m = H.o.crust.material;
  m.roughness = 0.95 - 0.4 * k; m.envMapIntensity = 0.3 + 0.6 * k; m.emissiveIntensity = k * k * 1.4;
}
function applyPolish(p) {
  const o = H.o, m = o.crystal.mesh.material, mt = o.mt, q = Math.max(0, (p - REVEAL_AT) / (1 - REVEAL_AT)), e = q * q * (3 - 2 * q);
  m.roughness = 0.95 + (mt.roughness - 0.95) * e;
  m.transmission = mt.transmission * e * e;
  m.color.copy(o.dull).lerp(mt.color, e);
  m.emissiveIntensity = mt.emissiveIntensity * e;
  m.clearcoat = mt.clearcoat * e;
  m.iridescence = (mt.iridescence || 0) * e;
  m.envMapIntensity = 0.25 + (mt.env - 0.25) * e;
  m.specularIntensity = 0.15 + (mt.spec - 0.15) * e;
  for (const f of o.mutMods) f(m, e);
}
function rub(e, hit) {
  const o = H.o; if (o.phase !== 'polish' || !rubLast) return;
  const d = Math.hypot(e.clientX - rubLast.x, e.clientY - rubLast.y);
  if (d < 0.5) return;
  o.prog = Math.min(1, o.prog + d / o.needPx);
  (o.revealed ? o.crystal.group : o.crust).rotation.y += (e.clientX - rubLast.x) * 0.004;
  if (!o.revealed) crustPolish(o.prog / REVEAL_AT); else applyPolish(o.prog);
  rubAcc += d;
  if (rubAcc > 55) {
    rubAcc = 0;
    Sound.tone(480 + o.prog * 1100, 0, 0.06, 'sine', 0.035);
    const cols = o.revealed ? o.gem.colors.map((c) => new THREE.Color(c)) : [new THREE.Color('#cfc8dc'), new THREE.Color('#8a8290'), new THREE.Color('#ffffff')];
    H.burstO.spawn(3 + Math.floor(o.prog * 5), hit.point, cols, 0.9, 0.3);
  }
  const help = o.revealed ? 'Da ist er! Noch ein bisschen polieren …'
    : o.prog < 0.3 ? 'Reib weiter. Unter dem Staub steckt etwas …' : o.prog < 0.6 ? 'Die Kruste wird dünner …' : 'Gleich bricht die Kruste auf!';
  setOpenUI('2 · Polieren', help, o.prog);
  if (!o.revealed && o.prog >= REVEAL_AT) revealCrystal(hit.point);
  if (o.prog >= 1) finishOpen();
}
// Die Kruste platzt ab, darunter der matte Kristall
function revealCrystal(at) {
  const o = H.o; o.revealed = true; o.rubTarget = o.crystal.mesh;
  const crust = o.crust, geo = crust.geometry.toNonIndexed(); crust.geometry.dispose(); crust.geometry = geo;
  const pos = geo.attributes.position, base = pos.array.slice(), faces = pos.count / 3, vel = new Float32Array(faces * 3);
  for (let f = 0; f < faces; f++) { const c = v3(base[f * 9] + base[f * 9 + 3] + base[f * 9 + 6], base[f * 9 + 1] + base[f * 9 + 4] + base[f * 9 + 7], base[f * 9 + 2] + base[f * 9 + 5] + base[f * 9 + 8]).divideScalar(3); const dd = c.clone().normalize().add(v3(0, 0.3, 0.4)).normalize().multiplyScalar(2 + Math.random() * 3); vel.set([dd.x, dd.y, dd.z], f * 3); }
  crust.material.transparent = true;
  H.open.remove(crust); const holder = new THREE.Group(); holder.add(crust); crust.position.set(0, 0, 0);
  holder.rotation.copy(crust.rotation); holder.scale.copy(crust.scale); crust.rotation.set(0, 0, 0); crust.scale.setScalar(1);
  H.temps.push({ obj: holder, sc: H.open, t0: performance.now(), dur: 900, fn: (k) => {
    for (let f = 0; f < faces; f++) for (let v = 0; v < 3; v++) { const i = f * 9 + v * 3; pos.array[i] = base[i] + vel[f * 3] * k; pos.array[i + 1] = base[i + 1] + vel[f * 3 + 1] * k - 3 * k * k; pos.array[i + 2] = base[i + 2] + vel[f * 3 + 2] * k; }
    pos.needsUpdate = true; crust.material.opacity = Math.max(0, 1 - k);
  } });
  H.open.add(holder); o.crust = null;
  o.crystal.group.visible = true; o.growT = performance.now() / 1000;
  const c0 = v3(0, 0, 0.3);
  H.burstO.spawn(120, c0, [new THREE.Color('#cfc8dc'), new THREE.Color('#8a8290'), new THREE.Color('#ffffff')], 3.5, 0.6);
  huntShot(H.open, 'glow', '#ffffff', 0.5, c0, (k, sp) => { sp.scale.setScalar(1 + k * 6); sp.material.opacity = (1 - k) * 0.9; });
  Sound.whoosh(0.3); Sound.tone(140, 0, 0.4, 'sawtooth', 0.06); Sound.tick(6, 6);
  H.fovKick = -3; o.sp.v += 5;
  applyPolish(o.prog);
}
// Eine Mutation zeigt sich (erst wenn der Kristall fertig poliert ist)
function revealMutation(mut) {
  const o = H.o;
  const col = new THREE.Color(mut.color), c0 = v3(0, 0.45, 0.3);
  implode(H.open, mut.color, 0.5);
  Sound.whoosh(0.5); Sound.tone(110, 0, 0.5, 'sawtooth', 0.04);
  setTimeout(() => {
    if (H.o !== o) return;
    applyMutFx(o, mut); applyPolish(1);
    H.burstO.spawn(130, c0, [col, new THREE.Color('#ffffff'), col.clone().lerp(new THREE.Color('#ffffff'), 0.5)], 3.8, 1);
    huntShot(H.open, 'glow', mut.color, 0.7, c0, (k, sp) => { sp.scale.setScalar(1 + k * 8); sp.material.opacity = (1 - k) * 0.95; });
    huntShot(H.open, 'ring', mut.color, 0.9, c0, (k, sp) => { sp.scale.setScalar(1 + k * 9); sp.material.opacity = (1 - k) * 0.85; });
    huntShot(H.open, 'ring', '#ffffff', 1.2, c0, (k, sp) => { const q = Math.max(0, k - 0.2) / 0.8; sp.scale.setScalar(1 + q * 11); sp.material.opacity = (1 - q) * 0.5; });
    huntShot(H.open, 'rays', mut.color, 1.4, v3(0, 0.45, -0.6), (k, sp) => { sp.scale.setScalar(2 + k * 4); sp.material.rotation = k * 2; sp.material.opacity = (1 - k) * 0.6; }, true);
    o.sp.v += 8; H.fovKick = -4;
    (MUT_SOUND[mut.id] || (() => Sound.chime(6)))();
    MUT_INTRO[mut.id]?.(o, c0);
    floatHunt(c0.clone().setY(1.4), `MUTATION! ${mut.name} ×${mut.mult.toLocaleString('de-DE')}`, mut.color, H.camO);
    const last = huntEl.querySelector('.float:last-of-type'); if (last) last.classList.add('big');
    const chip = document.createElement('span'); chip.className = 'mut-chip'; chip.style.setProperty('--mc', mut.color);
    chip.textContent = `${mut.name} ×${mut.mult.toLocaleString('de-DE')}`; $('o-muts').appendChild(chip);
    setOpenUI('Mutation entdeckt!', `${mut.name}: ${mut.desc}`, 1);
  }, 480);
}
function finishOpen() {
  const o = H.o; if (o.phase !== 'polish') return;
  o.phase = 'mutating'; applyPolish(1); o.crystal.extras.visible = true;
  o.muts.forEach((m, i) => setTimeout(() => { if (H.o === o) revealMutation(m); }, 300 + i * 1500));
  setTimeout(() => { if (H.o === o) finalizeOpen(); }, o.muts.length ? 300 + o.muts.length * 1500 + 500 : 0);
}
function finalizeOpen() {
  const o = H.o; o.phase = 'done'; applyPolish(1); o.crystal.extras.visible = true; o.doneT = performance.now() / 1000;
  const gem = o.gem, wt = o.wt, t = tierById[gem.tier], ti = t.index;
  const cols = [...gem.colors, t.color].map((c) => new THREE.Color(c)), c0 = v3(0, 0, 0.2);
  H.halo.material.color.set(gem.colors[1]);
  H.bloom.strength = 0.3 + ti * 0.04;
  H.burstO.spawn(50 + ti * 28, c0, cols, 2.6 + ti * 0.25);
  huntShot(H.open, 'glow', '#ffffff', 0.6, c0, (k, sp) => { sp.scale.setScalar(1 + k * 7); sp.material.opacity = (1 - k) * 0.95; });
  huntShot(H.open, 'ring', t.color, 0.85, c0, (k, sp) => { sp.scale.setScalar(1 + k * 7); sp.material.opacity = (1 - k) * 0.85; });
  if (ti >= 4) huntShot(H.open, 'ring', gem.colors[0], 1.1, c0, (k, sp) => { const q = Math.max(0, k - 0.15) / 0.85; sp.scale.setScalar(1 + q * 9); sp.material.opacity = (1 - q) * 0.6; });
  if (ti >= 6) huntShot(H.open, 'rays', gem.colors[0], 2.6, v3(0, 0, -0.5), (k, sp) => { sp.scale.setScalar(2 + Math.sin(Math.min(1, k * 3) * Math.PI / 2) * 5); sp.material.rotation = k * 1.6; sp.material.opacity = (k < 0.6 ? 1 : (1 - k) / 0.4) * 0.7; }, true);
  if (ti >= 8) setTimeout(() => H.burstO.spawn(90, c0, cols, 4.6, 1.2), 260);
  if (ti === 9) setTimeout(() => H.burstO.spawn(160, c0, Array.from({ length: 8 }, (_, i) => new THREE.Color().setHSL(i / 8, 1, 0.62)), 5.5, 2), 520);
  if (wt.index >= 3) setTimeout(() => { if (H.o !== o) return; H.burstO.spawn(40 + wt.index * 30, c0, [new THREE.Color(wt.cls.color), new THREE.Color('#ffffff')], 3 + wt.index * 0.4, 1); huntShot(H.open, 'ring', wt.cls.color, 0.9, c0, (k, sp) => { sp.scale.setScalar(1 + k * 8); sp.material.opacity = (1 - k) * 0.8; }); Sound.chime(Math.min(9, 4 + wt.index)); }, 500);
  o.sp.v += 5; H.fovKick = -3 - ti * 0.3; Sound.chime(ti);
  const muts = o.muts;
  if (muts.length) setTimeout(() => { if (H.o !== o) return; H.burstO.spawn(120, c0, muts.map((m) => new THREE.Color(m.color)), 4, 1.4); Sound.chime(8); }, 800);
  const val = foundValue(gem, wt, muts);
  dust += val; showDust(); bumpEl($('h-dust'));
  try { localStorage.setItem('schleiferei-staub', String(dust)); } catch (err) { /* egal */ }
  logFind(gem, wt, val, muts); renderFinds(); bumpEl($('h-finds'));
  revealInto($('o-reveal'), gem, { weight: wt, keep: true, muts });
  setOpenUI(`Gefunden · ${fmtPct(gem.chance)} Chance`, `${gem.name}, ${fmtGrams(wt.grams)} (${wt.cls.name}, ${fmtPct(wt.cls.chance)})${muts.length ? ` mit ${muts.map((m) => m.name).join(' und ')} ×${mutMult(muts).toLocaleString('de-DE', { maximumFractionDigits: 2 })}` : ''}. +${fmtNum(val)} ◆`, 1);
  $('o-view').hidden = false;
  $('o-next').hidden = false;
  $('opened').textContent = `Geöffnet ${++opened}`; bumpEl($('opened'));
}
function updateOpen(dt, t) {
  const o = H.o; if (!o) return;
  H.orbs.forEach((l, i) => { const a = t * (0.7 + i * 0.35) + i * 2; l.position.set(Math.cos(a) * 2.3, 0.8 + Math.sin(t * 0.9 + i) * 0.9, Math.sin(a) * 2.3 + 0.8); });
  o.sp.v += (-150 * (o.sp.s - 1) - 10 * o.sp.v) * dt; o.sp.s += o.sp.v * dt;
  H.fovKick *= Math.exp(-dt * 3); H.camO.fov = (H.baseFovO || 36) + H.fovKick; H.camO.updateProjectionMatrix();
  if (o.phase === 'break') {
    o.shake *= Math.exp(-dt * 12);
    o.shell.position.set((Math.random() - 0.5) * o.shake, (Math.random() - 0.5) * o.shake * 0.5, 0);
    o.shell.rotation.y = Math.sin(t * 0.8) * 0.35; o.shell.scale.setScalar(0.9 * o.sp.s);
  }
  if (o.base && o.shell.parent) {
    const k = (performance.now() - o.tb) / 900, arr = o.shell.geometry.attributes.position.array;
    for (let f = 0; f < o.vel.length / 3; f++) for (let v = 0; v < 3; v++) {
      const i = f * 9 + v * 3;
      arr[i] = o.base[i] + o.vel[f * 3] * k; arr[i + 1] = o.base[i + 1] + o.vel[f * 3 + 1] * k - 4 * k * k; arr[i + 2] = o.base[i + 2] + o.vel[f * 3 + 2] * k;
    }
    o.shell.geometry.attributes.position.needsUpdate = true;
    o.shell.material.opacity = Math.max(0, 1 - k);
    if (k >= 1) H.open.remove(o.shell);
  }
  if (o.crust) {
    const k = elasticOut(Math.min(1, (performance.now() / 1000 - o.crustT) / 0.7));
    o.crust.scale.setScalar(Math.max(0.001, k * o.sp.s));
    o.crust.position.y = Math.sin(t * 1.4) * 0.05;
    if (!rubbing) o.crust.rotation.y += dt * 0.25;
  }
  if (o.crystal) {
    const g = o.crystal.group, grow = elasticOut(Math.min(1, (performance.now() / 1000 - o.growT) / 0.7));
    o.bigNow = (o.bigNow ?? 1) + ((o.bigScale || 1) - (o.bigNow ?? 1)) * Math.min(1, dt * 4);
    g.scale.setScalar(Math.max(0.001, grow * o.cs * o.sp.s * o.bigNow));
    for (const u of o.mutUp) u(t, dt);
    o.lift = (o.lift || 0) + ((o.phase === 'done' || o.phase === 'mutating' ? 0.45 : 0) - (o.lift || 0)) * Math.min(1, dt * 3);
    g.position.y = Math.sin(t * 1.4) * 0.05 + o.lift;
    if (o.phase !== 'polish') g.rotation.y += dt * (o.phase === 'done' ? 0.5 : 0.2);
    if (o.phase === 'done') o.crystal.update(t, dt, H.camO);
  }
}

if (H.renderer) {
  const R = H.renderer;
  R.setPixelRatio(Math.min(devicePixelRatio, 2));
  R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.1; R.outputColorSpace = THREE.SRGBColorSpace;
  const env = new THREE.PMREMGenerator(R).fromScene(new RoomEnvironment(R), 0.03).texture;

  // Schleiftisch zum Öffnen
  const O = H.open = new THREE.Scene();
  O.environment = env; O.background = nebulaTexture(1024, 768, '#b450ff');
  const k2 = new THREE.DirectionalLight(0xffffff, 2.2); k2.position.set(3, 5, 4); O.add(k2);
  const r2 = new THREE.DirectionalLight(0xd9b26a, 1.3); r2.position.set(-4, 2, -3); O.add(r2);
  O.add(new THREE.AmbientLight(0x6a5a86, 0.6));
  H.halo = billboard('glow', '#b450ff', 6, 0.25); H.halo.position.z = -1.5; O.add(H.halo);
  H.orbs = [new THREE.PointLight(0xffffff, 7, 6), new THREE.PointLight(0xffe2b0, 5, 6)]; H.orbs.forEach((l) => O.add(l));
  H.burstO = new Burst(700); O.add(H.burstO.points);
  H.camO = new THREE.PerspectiveCamera(36, 16 / 8.4, 0.1, 100); H.camO.position.set(0, 0.35, 6.4); H.camO.lookAt(0, 0, 0);

  H.composer = new EffectComposer(R);
  H.composer.addPass(new RenderPass(O, H.camO));
  H.bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.35, 0.45, 0.88); H.composer.addPass(H.bloom);
  H.composer.addPass(new OutputPass());

  new ResizeObserver(() => {
    const w = huntEl.clientWidth, h = huntEl.clientHeight;
    R.setSize(w, h, false); H.composer.setSize(w, h);
    H.camO.aspect = w / h; H.camO.fov = w / h < 1 ? 46 : 36; H.camO.updateProjectionMatrix();
    H.baseFovO = H.camO.fov;
  }).observe(huntEl);
  new IntersectionObserver(([e]) => { H.visible = e.isIntersecting; }).observe(huntEl);
}

// Steuerung: Klicken zum Zerbrechen, gedrückt halten und reiben zum Polieren
const huntRay = new THREE.Raycaster(), huntNdc = new THREE.Vector2();
function huntPick(e, cam, obj) {
  const r = huntCanvas.getBoundingClientRect();
  huntNdc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  huntRay.setFromCamera(huntNdc, cam);
  return huntRay.intersectObject(obj, false)[0] || null;
}
let hDown = null, rubbing = false, rubLast = null, rubAcc = 0;
huntCanvas.addEventListener('pointerdown', (e) => {
  huntCanvas.focus({ preventScroll: true });
  hDown = { x: e.clientX, y: e.clientY };
  if (H.o?.phase === 'polish') { rubbing = true; rubLast = { x: e.clientX, y: e.clientY }; huntCanvas.setPointerCapture(e.pointerId); }
});
huntCanvas.addEventListener('pointermove', (e) => {
  if (H.o?.phase === 'polish') {
    const hit = huntPick(e, H.camO, H.o.rubTarget);
    huntCanvas.style.cursor = hit ? 'grab' : 'default';
    if (rubbing && hit) rub(e, hit);
    if (rubbing) rubLast = { x: e.clientX, y: e.clientY };
  } else if (H.o?.phase === 'break') {
    huntCanvas.style.cursor = huntPick(e, H.camO, H.o.shell) ? 'pointer' : 'default';
  } else huntCanvas.style.cursor = 'default';
});
huntCanvas.addEventListener('pointerup', (e) => {
  rubbing = false;
  if (!hDown) return;
  const moved = Math.hypot(e.clientX - hDown.x, e.clientY - hDown.y); hDown = null;
  if (moved > 8) return;
  if (H.o?.phase === 'break') { const hit = huntPick(e, H.camO, H.o.shell); if (hit) hitShell(hit); }
});
huntCanvas.addEventListener('pointercancel', () => { rubbing = false; hDown = null; });
// Tastatur: Leertaste schlägt auf den Stein
huntCanvas.addEventListener('keydown', (e) => {
  if ((e.key === ' ' || e.key === 'Enter') && H.o?.phase === 'break') { e.preventDefault(); hitShell({ point: v3((Math.random() - 0.5) * 0.6, (Math.random() - 0.3) * 0.6, 0.8) }); }
});

function clearOpen() {
  const o = H.o; if (!o) return;
  if (o.shell.parent) H.open.remove(o.shell);
  freeDispose(o.shell);
  if (o.crust) { H.open.remove(o.crust); freeDispose(o.crust); }
  if (o.crystal) { H.open.remove(o.crystal.group); disposeGroup(o.crystal.group); }
  H.o = null;
}
$('o-next').addEventListener('click', () => { clearOpen(); openStone(); huntCanvas.focus({ preventScroll: true }); });
$('o-view').addEventListener('click', () => { const g = H.o?.gem; if (g) location.href = `../edelsteine/#${g.id}`; });

let hLast = performance.now();
function huntLoop(now) {
  requestAnimationFrame(huntLoop);
  const dt = Math.min(0.05, (now - hLast) / 1000); hLast = now;
  if (!H.visible) return;
  const t = now / 1000;
  updateOpen(dt, t);
  for (let i = H.shots.length - 1; i >= 0; i--) {
    const s = H.shots[i], k = (now - s.t0) / s.dur;
    if (k >= 1) { s.sc.remove(s.sp); s.sp.material.dispose(); H.shots.splice(i, 1); } else s.fn(k, s.sp);
  }
  for (let i = H.temps.length - 1; i >= 0; i--) {
    const s = H.temps[i], k = (now - s.t0) / s.dur;
    if (k >= 1) { s.sc.remove(s.obj); freeDispose(s.obj); H.temps.splice(i, 1); } else s.fn(k, s.obj);
  }
  H.burstO.update(dt);
  H.composer.render();
}

const soundBtn = $('sound');
const showSound = () => { soundBtn.setAttribute('aria-pressed', String(Sound.on)); soundBtn.textContent = `Ton: ${Sound.on ? 'an' : 'aus'}`; };
showSound();
soundBtn.addEventListener('click', () => {
  Sound.on = !Sound.on; showSound();
  try { localStorage.setItem('schleiferei-ton', Sound.on ? 'an' : 'aus'); } catch (e) { /* egal */ }
  if (Sound.on) Sound.tick(5, 1);
});

showDust();
renderFinds();
if (H.renderer) { openStone(); requestAnimationFrame(huntLoop); }
