// Auras in 3D (überarbeitete Fassung aus dem Claude-Design-Projekt „Auras Vorher Nachher“).
// createAura(aura, { amount }) → { root, spinner, aura, update(t), dispose() }
// POINT_SCALE.value muss vor dem Rendern stimmen: setPointScale(Höhe in Pixeln, Kamera).
//
// 1. Stufen-Grundpaket: Jede Seltenheit bringt feste Zusatzeffekte mit, die sich nach oben aufaddieren.
//    Dadurch erkennt man die Seltenheit auf einen Blick, egal welche Aura.
// 2. Bessere Teilchen: heller Kern, schrumpfen beim Verglühen, Funkeln, Lichtschweife.
// 3. Jeder Effekt (look) ist einzeln überarbeitet. Alles bleibt mit Roblox-Mitteln nachbaubar
//    (ParticleEmitter, Beam, Trail, Neon-Teile, PointLight, Highlight, BillboardGui).
// Die Bausteine (Figur, Texturen, kreisende Dinge) liegen in auraBase.js.

import * as THREE from 'three';
import { POINT_SCALE, FIGURE_SCALE, makeFigure, TEX, canvasTex, orbitThing, ringTexture, fadeTex, rng, hash, glow, ADDITIVE } from './auraBase.js';
import { RARITIES } from './auras.js';
export { setPointScale, POINT_SCALE } from './auraBase.js';

const TAU = Math.PI * 2;
const ADD = THREE.AdditiveBlending;
const TIME = { value: 0 };
export const tierOf = (aura) => Math.max(0, RARITIES.findIndex((r) => r.id === aura.rarity));

// Was jede Stufe dazubringt (gilt auch für alle höheren) und wie es in Roblox gebaut wird
export const TIER_FX = [
  { add: 'Bodenleuchten und Licht in Aura-Farbe', rbx: 'Neon-Scheibe, PointLight' },
  { add: 'Leuchtender Umriss in Seltenheitsfarbe', rbx: 'Highlight (Outline)' },
  { add: 'Pulswellen am Boden, Glimmer', rbx: 'Neon-Ring, ParticleEmitter' },
  { add: 'Lichtstrahlen, Funkelsterne am Kopf', rbx: 'Beams, ParticleEmitter' },
  { add: 'Zwei Energieringe mit Lichtläufern', rbx: 'Trail an kreisenden Attachments' },
  { add: 'Strahlenkranz, Schockwelle, Leuchtkörper', rbx: 'BillboardGui, Neon-Ring, Highlight-Fill' },
];
// Überarbeitung je Effekt
export const UPGRADES = {
  rise: ['Teilchen mit hellem Kern, schrumpfen beim Verglühen, schnelle ziehen Schweife', 'Size/Transparency-Sequenz, LightEmission'],
  fall: ['Teilchen funkeln und blenden weich ein und aus', 'Transparency-Sequenz'],
  swirl: ['Wirbel zieht Lichtschweife', 'Trail'],
  burst: ['Raketen steigen sichtbar auf, Explosion mit Schweifen', 'ParticleEmitter:Emit, Trail'],
  orbit: ['Kreisende Dinge leuchten und ziehen einen Schweif', 'Trail, PointLight'],
  ring: ['Flammen aus echten Teilchen; Runen- und Hex-Kreise doppelt, gegenläufig, mit Lichtkante', 'FIRE-Emitter, zweiter Neon-Ring'],
  halo: ['Heiligenschein mit Glühen und Funkeln', 'Neon-Kugeln, ParticleEmitter'],
  crown: ['Krone mit Glanzlicht', 'PointLight, Sparkles'],
  wings: ['Flügel aus zwei Federlagen, verlieren Lichtfedern', 'Zwei Neon-Lagen, ParticleEmitter'],
  pillar: ['Lichtsäule mit hellem Kern und aufsteigenden Streifen', 'ForceField-Säule, Neon-Kern'],
  shell: ['Hülle leuchtet am Rand statt flach', 'ForceField-Material'],
  beams: ['Lichtbänder wehen und schimmern', 'Beam mit CurveSize'],
  bolts: ['Blitze mit Glühen und Einschlagpunkt', 'zwei Beams pro Blitz, Sparkles'],
  glitch: ['Glitch streut Pixelstaub', 'ParticleEmitter'],
};

// ── Texturen ──
const dotTex = () => canvasTex('dot', TEX.dot);
const flareTex = () => canvasTex('flare2', (g, s) => {
  TEX.dot(g, s);
  g.globalCompositeOperation = 'lighter';
  for (const [w, h] of [[s * 0.5, s * 0.025], [s * 0.025, s * 0.5]]) {
    const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.fillRect(s / 2 - w, s / 2 - h, w * 2, h * 2);
  }
}, 128);
const raysTex = () => canvasTex('rays2', (g, s) => {
  g.translate(s / 2, s / 2);
  for (let i = 0; i < 20; i++) {
    g.save();
    g.rotate((i / 20) * TAU);
    const len = s * (i % 2 ? 0.34 : 0.49), w = s * (i % 2 ? 0.018 : 0.03);
    const grd = g.createLinearGradient(0, 0, 0, -len);
    grd.addColorStop(0, 'rgba(255,255,255,.95)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.beginPath();
    g.moveTo(-w, 0);
    g.lineTo(-w * 0.15, -len);
    g.lineTo(w * 0.15, -len);
    g.lineTo(w, 0);
    g.fill();
    g.restore();
  }
  const c = g.createRadialGradient(0, 0, 0, 0, 0, s * 0.18);
  c.addColorStop(0, 'rgba(255,255,255,.9)');
  c.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = c;
  g.fillRect(-s / 2, -s / 2, s, s);
}, 512);
const streakTex = () => {
  const t = canvasTex('streak2', (g, s) => {
    const r = rng(5);
    for (let i = 0; i < 46; i++) {
      const x = r() * s, y = r() * s, h = s * (0.12 + r() * 0.3), w = 1 + r() * 2.5;
      const grd = g.createLinearGradient(0, 0, 0, h);
      grd.addColorStop(0, 'rgba(255,255,255,0)');
      grd.addColorStop(0.5, 'rgba(255,255,255,.95)');
      grd.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grd;
      for (const dy of [0, -s]) {
        g.save();
        g.translate(x, y + dy);
        g.fillRect(0, 0, w, h);
        g.restore();
      }
    }
  }, 128);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};
const wingTex2 = (cols) => canvasTex('wing2' + cols.join(), (g, s) => {
  const c0 = cols[0], c1 = cols[1] || cols[0];
  for (const layer of [0, 1]) for (let i = 0; i < 9; i++) {
    const a = -0.05 - i * 0.16 - layer * 0.08;
    const len = s * (layer ? 0.6 - i * 0.03 : 0.97 - i * 0.065), wd = s * (layer ? 0.045 : 0.065);
    g.save();
    g.translate(s * 0.06, s * 0.9);
    g.rotate(a);
    const grd = g.createLinearGradient(0, 0, len, 0);
    grd.addColorStop(0, layer ? '#ffffff' : c0);
    grd.addColorStop(0.6, layer ? c0 : c1);
    grd.addColorStop(1, c1 + '00');
    g.fillStyle = grd;
    g.beginPath();
    g.moveTo(0, 0);
    g.quadraticCurveTo(len * 0.5, -wd * 1.7, len, 0);
    g.quadraticCurveTo(len * 0.5, wd * 1.1, 0, 0);
    g.fill();
    g.strokeStyle = 'rgba(255,255,255,.5)';
    g.lineWidth = s * 0.004;
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(len * 0.9, 0);
    g.stroke();
    g.restore();
  }
}, 512);

// ── Teilchen mit hellem Kern, Funkeln und Schweif ──
const VS = `attribute float size; attribute float alpha; attribute vec3 color; attribute float seed;
uniform float scale; uniform float time; uniform float twinkle;
varying vec3 vColor; varying float vAlpha;
void main(){ vColor = color; vAlpha = alpha * (1.0 - twinkle + twinkle * (0.5 + 0.5 * sin(time * 7.0 + seed * 43.0)));
vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = size * (0.4 + 0.6 * alpha) * scale / -mv.z; gl_Position = projectionMatrix * mv; }`;
const FS = `uniform sampler2D map; uniform float hot; varying vec3 vColor; varying float vAlpha;
void main(){ vec4 c = texture2D(map, gl_PointCoord); float a = c.a * vAlpha; if (a < 0.01) discard;
gl_FragColor = vec4(mix(c.rgb * vColor, vec3(1.0), hot * c.a * c.a * 0.55), a); }`;

function particles(n, cols, texName, size, pos, o = {}) {
  const trail = o.trail || 1, gap = o.gap || 0.035, total = n * trail;
  const add = ADDITIVE.has(texName) || o.add;
  const geo = new THREE.BufferGeometry();
  const P = new Float32Array(total * 3), A = new Float32Array(total), C = new Float32Array(total * 3), S = new Float32Array(total), D = new Float32Array(total);
  const cc = cols.map((c) => new THREE.Color(c));
  for (let i = 0; i < n; i++) for (let k = 0; k < trail; k++) {
    const j = i * trail + k, c = cc[i % cc.length];
    C.set([c.r, c.g, c.b], j * 3);
    S[j] = size * 0.62 * (0.6 + ((i * 7919) % 100) / 125) * FIGURE_SCALE * (1 - (k / trail) * 0.6);
    D[j] = (i * 0.618) % 1;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(P, 3));
  geo.setAttribute('alpha', new THREE.BufferAttribute(A, 1));
  geo.setAttribute('color', new THREE.BufferAttribute(C, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(S, 1));
  geo.setAttribute('seed', new THREE.BufferAttribute(D, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      map: { value: canvasTex(texName, TEX[texName] || TEX.dot) }, scale: POINT_SCALE, time: TIME,
      hot: { value: o.hot ?? (add ? 0.6 : 0.12) }, twinkle: { value: o.twinkle ?? 0.25 },
    },
    vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false,
    blending: add ? ADD : THREE.NormalBlending,
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  const v = new THREE.Vector3();
  pts.userData.update = (t) => {
    for (let i = 0; i < n; i++) for (let k = 0; k < trail; k++) {
      const j = i * trail + k;
      A[j] = pos(i, t - k * gap, v) * (k ? Math.pow(1 - k / trail, 1.3) * 0.75 : 1);
      P[j * 3] = v.x;
      P[j * 3 + 1] = v.y;
      P[j * 3 + 2] = v.z;
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.alpha.needsUpdate = true;
  };
  return pts;
}

const sprite = (color, size, opacity = 1, map = dotTex()) => {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map, color, transparent: true, opacity, depthWrite: false, blending: ADD }));
  s.scale.setScalar(size);
  return s;
};
const addMat = (color, extra = {}) => new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false, blending: ADD, side: THREE.DoubleSide, ...extra });

function fresnelMat(color, power = 2, k = 1) {
  return new THREE.ShaderMaterial({
    uniforms: { c: { value: new THREE.Color(color) }, p: { value: power }, k: { value: k } },
    vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 c; uniform float p; uniform float k; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), p); gl_FragColor = vec4(c, f * k); }`,
    transparent: true, depthWrite: false, blending: ADD, side: THREE.FrontSide,
  });
}
function bandMat(color, phase) {
  return new THREE.ShaderMaterial({
    uniforms: { c: { value: new THREE.Color(color) }, time: TIME, ph: { value: phase }, op: { value: 0.5 } },
    vertexShader: `uniform float time; uniform float ph; varying vec2 vUv; void main(){ vUv = uv; vec3 p = position;
p.x += sin(p.y * 0.7 + time * 1.8 + ph) * 0.35; p.z += cos(p.y * 0.5 + time * 1.3 + ph) * 0.25;
gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`,
    fragmentShader: `uniform vec3 c; uniform float op; uniform float time; uniform float ph; varying vec2 vUv; void main(){
float v = smoothstep(0.0, 0.12, vUv.y) * (1.0 - vUv.y); float e = 1.0 - abs(vUv.x - 0.5) * 2.0;
float sh = 0.65 + 0.35 * sin(vUv.y * 24.0 - time * 4.0 + ph); gl_FragColor = vec4(c * 1.3, v * pow(e, 0.8) * sh * op); }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: ADD,
  });
}

// ── Aura bauen ──
export function createAura(aura, { amount = 1 } = {}) {
  const look = aura.look;
  const tier = tierOf(aura), rc = RARITIES[tier].color;
  const r = rng(hash(aura.id));
  const root = new THREE.Group();
  root.name = 'Aura-' + aura.id;
  const spinner = new THREE.Group();
  const studs = new THREE.Group();
  studs.scale.setScalar(FIGURE_SCALE);
  studs.position.y = -1.45;
  root.add(spinner);
  spinner.add(studs);
  const figure = makeFigure(look.cols[0]);
  figure.traverse((o) => o.isMesh && o.material.emissive && o.material.emissive.set(look.cols[0]).multiplyScalar(0.05 + tier * 0.018));
  studs.add(figure);
  const updates = [];
  const cols = look.cols;
  const col = (i) => cols[i % cols.length];
  const N = (n) => Math.max(4, Math.round(n * amount * (1 + tier * 0.08)));
  const tex = look.tex || 'dot';
  const seeds = (n) => Array.from({ length: n }, () => [r(), r(), r(), r()]);
  const add = (o) => (studs.add(o), o);

  // ═══ Stufen-Grundpaket ═══
  // 0 · Bodenleuchten und Licht
  const g0 = 0.28 + tier * 0.09;
  const ground = add(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), addMat(cols[0], { map: dotTex(), opacity: g0 })));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0.04;
  ground.scale.setScalar(5 + tier * 0.8);
  updates.push((t) => (ground.material.opacity = g0 * (0.85 + Math.sin(t * 1.7) * 0.15)));
  const light = new THREE.PointLight(cols[0], 0.3 + tier * 0.15, 4.5, 2);
  light.position.set(0, 2.6, 2.4);
  studs.add(light);

  // 1 · Umriss in Seltenheitsfarbe
  if (tier >= 1) {
    const mat = new THREE.MeshBasicMaterial({ color: rc, transparent: true, opacity: 0.5, side: THREE.BackSide, depthWrite: false, blending: ADD });
    const outline = new THREE.Group();
    outline.name = 'outline';
    for (const m of [...figure.children]) {
      if (!m.isMesh || !m.material.isMeshStandardMaterial) continue;
      const p = m.geometry.parameters, o = new THREE.Mesh(m.geometry, mat), e = 0.2;
      o.position.copy(m.position);
      if (p.width) o.scale.set((p.width + e) / p.width, (p.height + e) / p.height, (p.depth + e) / p.depth);
      else o.scale.set((p.radiusTop + e / 2) / p.radiusTop, (p.height + e) / p.height, (p.radiusTop + e / 2) / p.radiusTop);
      outline.add(o);
    }
    figure.add(outline);
    updates.push((t) => (mat.opacity = 0.3 + Math.sin(t * 2.5) * 0.15));
  }

  // 2 · Pulswellen und Glimmer
  if (tier >= 2) {
    const waves = [0, 1].map(() => {
      const m = add(new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 64), addMat(rc)));
      m.rotation.x = -Math.PI / 2;
      m.position.y = 0.08;
      return m;
    });
    updates.push((t) => waves.forEach((m, k) => {
      const u = (t / 2.4 + k * 0.5) % 1, s = 1 + u * 3.4;
      m.scale.set(s, s, 1);
      m.material.opacity = (1 - u) * (1 - u) * 0.9;
    }));
    const n = N(22), sd = seeds(n);
    add(particles(n, [rc, '#ffffff'], 'star', 0.55, (i, t, v) => {
      const [a, b, c, d] = sd[i];
      const u = (t * (0.05 + d * 0.05) + a) % 1, ang = b * TAU + t * 0.3, rad = 1 + c * 2.2;
      v.set(Math.cos(ang) * rad, 0.3 + u * 6.5, Math.sin(ang) * rad);
      return Math.sin(Math.PI * u) * 0.9;
    }, { twinkle: 0.8 }));
  }

  // 3 · Lichtstrahlen und Funkelsterne
  if (tier >= 3) {
    const shafts = [0, 1, 2].map((i) => add(new THREE.Mesh(new THREE.PlaneGeometry(0.35, 10), addMat(i ? cols[0] : rc, { map: fadeTex() }))));
    updates.push((t) => shafts.forEach((m, i) => {
      const a = (i / 3) * TAU + t * 0.25;
      m.position.set(Math.cos(a) * 1.25, 5, Math.sin(a) * 1.25);
      m.rotation.y = -a + Math.PI / 2;
      m.material.opacity = 0.14 + 0.1 * Math.sin(t * 2 + i * 2);
    }));
    const fl = [0, 1, 2, 3].map((i) => add(sprite(i % 2 ? '#ffffff' : rc, 1, 1, flareTex())));
    updates.push((t) => fl.forEach((s, i) => {
      const w = t * 0.45 + i * 0.25, u = w % 1, a = i * 1.9 + Math.floor(w) * 2.3, k = Math.sin(Math.PI * u);
      s.position.set(Math.cos(a) * 1.1, 4.2 + Math.sin(a * 1.7) * 0.9, Math.sin(a) * 1.1);
      s.scale.setScalar(0.2 + k * 1.5);
      s.material.opacity = k;
      s.material.rotation = t * 0.8;
    }));
  }

  // 4 · Energieringe mit Lichtläufern
  if (tier >= 4) {
    const rings = [0, 1].map((k) => {
      const g = new THREE.Group();
      g.rotation.set(k ? 1.1 : -1.0, 0, k ? 0.35 : -0.4);
      g.position.y = 2.8;
      g.add(new THREE.Mesh(new THREE.TorusGeometry(2.9, 0.035, 6, 96), glow(k ? rc : cols[0], 0.5)));
      g.add(particles(3, [k ? rc : cols[0]], 'dot', 1.1, (i, t, v) => {
        const a = (i / 3) * TAU + t * (k ? 1.6 : -1.3);
        v.set(Math.cos(a) * 2.9, Math.sin(a) * 2.9, 0);
        return 1;
      }, { trail: 14, gap: 0.03, hot: 0.8 }));
      const holder = new THREE.Group();
      holder.add(g);
      studs.add(holder);
      return holder;
    });
    updates.push((t) => rings.forEach((h, k) => (h.rotation.y = t * (k ? 0.4 : -0.3))));
  }

  // 5 · Strahlenkranz, Schockwelle, Leuchtkörper
  if (tier >= 5) {
    const raysA = add(sprite('#fff2a0', 11, 0.25, raysTex()));
    const raysB = add(sprite(cols[0], 8, 0.18, raysTex()));
    raysA.position.y = raysB.position.y = 3.4;
    const shock = add(new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 64), addMat('#fff6d0', { opacity: 0 })));
    shock.rotation.x = -Math.PI / 2;
    shock.position.y = 2.6;
    const flash = add(sprite('#ffffff', 1, 0));
    flash.position.y = 3;
    updates.push((t) => {
      raysA.material.rotation = t * 0.15;
      raysB.material.rotation = -t * 0.22;
      raysA.material.opacity = 0.22 + Math.sin(t * 1.3) * 0.08;
      const u = (t / 4) % 1, k = u / 0.25;
      if (u < 0.25) {
        shock.scale.set(1 + k * 7, 1 + k * 7, 1);
        shock.material.opacity = (1 - k) * 0.9;
        flash.scale.setScalar(3 + k * 7);
        flash.material.opacity = (1 - k) * 0.35;
      } else shock.material.opacity = flash.material.opacity = 0;
    });
  }

  // ═══ Effekte aus look ═══
  if (look.rise) {
    const n = N(look.rise.n), sd = seeds(n), sp = look.rise.speed;
    add(particles(n, cols, tex, 0.95, (i, t, v) => {
      const [a, b, c, d] = sd[i];
      const u = (t * sp * (0.12 + d * 0.1) + a) % 1;
      const ang = b * TAU + u * 1.2, rad = (1.3 + c * 1.1) * (1 - u * 0.25);
      v.set(Math.cos(ang) * rad, u * 7, Math.sin(ang) * rad);
      return Math.sin(Math.PI * u);
    }, { trail: sp >= 1 ? 3 : 1, gap: 0.04, hot: 0.7 }));
  }
  if (look.fall) {
    const n = N(look.fall.n), sd = seeds(n);
    add(particles(n, cols, tex, 0.85, (i, t, v) => {
      const [a, b, c, d] = sd[i];
      const u = (t * (0.18 + d * 0.12) + a) % 1;
      const ang = b * TAU + Math.sin(t + a * 9) * 0.3, rad = 0.5 + Math.sqrt(c) * 2.8;
      v.set(Math.cos(ang) * rad, 9 - u * 9, Math.sin(ang) * rad);
      return Math.min(1, (1 - u) * 4) * Math.min(1, u * 6);
    }, { twinkle: 0.45 }));
  }
  if (look.swirl) {
    const n = N(look.swirl.n), sd = seeds(n), H = look.swirl.low ? 2.6 : 6.6;
    add(particles(n, cols, tex, look.swirl.n > 120 ? 0.6 : 0.75, (i, t, v) => {
      const [a, b, c, d] = sd[i];
      const u = (t * (0.08 + d * 0.06) + a) % 1;
      const ang = b * TAU + t * (1.4 + c) + u * 5, rad = 1.7 + c * 0.9 + Math.sin(u * 8 + a * 6) * 0.25;
      v.set(Math.cos(ang) * rad, 0.2 + u * H, Math.sin(ang) * rad);
      return Math.sin(Math.PI * u);
    }, { trail: 4, gap: 0.03 }));
  }
  if (look.burst) {
    const n = N(120), sd = seeds(n), B = 4;
    const centers = Array.from({ length: B }, () => [(r() - 0.5) * 4, 7.5 + r() * 2, (r() - 0.5) * 3, r()]);
    add(particles(n, cols, 'star', 0.8, (i, t, v) => {
      const [a, b] = sd[i];
      const cc = centers[i % B], u = (t * 0.5 + cc[3]) % 1;
      const th = a * TAU, ph = Math.acos(2 * b - 1), sp = 2.6 * (1 - Math.pow(1 - u, 3));
      v.set(cc[0] + Math.sin(ph) * Math.cos(th) * sp, cc[1] + Math.cos(ph) * sp - u * u * 2, cc[2] + Math.sin(ph) * Math.sin(th) * sp);
      return u < 0.1 ? 0 : 1 - u;
    }, { trail: 4, gap: 0.03 }));
    add(particles(B, cols, 'dot', 1.2, (i, t, v) => {
      const cc = centers[i], u = (t * 0.5 + cc[3]) % 1, k = Math.min(1, u / 0.1);
      v.set(cc[0] * k, 1 + (cc[1] - 1) * k * (2 - k), cc[2] * k);
      return u < 0.1 ? 1 : 0;
    }, { trail: 6, gap: 0.025, hot: 0.9 }));
  }
  if (look.orbit) {
    const { kind, n } = look.orbit;
    const single = n === 1 && ['hole', 'disco', 'moon'].includes(kind);
    const glows = !['hole', 'disco', 'cat', 'rock', 'book'].includes(kind);
    const paths = [];
    for (let i = 0; i < n; i++) {
      const thing = orbitThing(kind, col(i), r);
      studs.add(thing);
      if (glows) thing.add(sprite(kind === 'coin' ? '#ffcf4a' : col(i), kind === 'moon' ? 3.2 : 1.7, 0.55));
      const ph = (i / n) * TAU, tilt = (r() - 0.5) * 0.6;
      if (single && kind !== 'moon') {
        if (kind === 'hole') thing.add(sprite('#b49cff', 5, 0.35));
        updates.push((t) => {
          thing.position.set(0, 8 + Math.sin(t * 1.3) * 0.2, 0);
          thing.rotation.y = t * (kind === 'disco' ? 1.2 : 0.6);
        });
        continue;
      }
      const rad = single ? 3.4 : kind === 'cat' ? 2.8 : 2.5 + (i % 2) * 0.3, y0 = single ? 5.4 : kind === 'cat' ? 0.5 : 3.3;
      const sp = kind === 'cat' ? 0.9 : kind === 'rock' ? 0.5 : 0.8, amp = kind === 'cat' ? 0.05 : 0.5;
      const at = (t, v) => {
        const a = ph + t * sp;
        return v.set(Math.cos(a) * rad, y0 + Math.sin(a * 2 + ph) * amp + Math.sin(a) * tilt * 3, Math.sin(a) * rad);
      };
      paths.push(at);
      updates.push((t) => {
        at(t, thing.position);
        const a = ph + t * sp;
        if (kind === 'cat') thing.rotation.y = -a;
        else if (kind === 'coin') thing.rotation.y = t * 3 + ph;
        else {
          thing.rotation.y = t * 1.5 + ph;
          thing.rotation.x = Math.sin(t + ph) * 0.4;
        }
      });
    }
    if (paths.length && kind !== 'cat') {
      const tc = kind === 'coin' ? ['#ffcf4a'] : kind === 'rock' ? ['#b59b7a'] : paths.map((_, i) => col(i));
      add(particles(paths.length, tc, 'dot', 0.8, (i, t, v) => (paths[i](t - 0.05, v), 0.8), { trail: 12, gap: 0.035, twinkle: 0 }));
    }
  }
  if (look.ring) {
    if (look.ring === 'flame') {
      const n = N(70), sd = seeds(n);
      add(particles(n, cols, 'dot', 1.35, (i, t, v) => {
        const [a, b, c, d] = sd[i];
        const u = (t * (0.9 + d * 0.6) + a) % 1, ang = b * TAU + Math.sin(t * 2 + a * 7) * 0.05, rad = 2.3 + (c - 0.5) * 0.35;
        v.set(Math.cos(ang) * rad, u * u * 2.4 * (0.6 + c * 0.6), Math.sin(ang) * rad);
        return (1 - u) * Math.min(1, u * 8);
      }, { hot: 0.9, twinkle: 0.1 }));
    }
    const disk = add(new THREE.Mesh(new THREE.PlaneGeometry(6.4, 6.4), new THREE.MeshBasicMaterial({ map: ringTexture(look.ring === 'flame' ? 'ring' : look.ring, cols), transparent: true, depthWrite: false, blending: ADD })));
    disk.rotation.x = -Math.PI / 2;
    disk.position.y = 0.06;
    updates.push((t) => {
      disk.rotation.z = t * 0.4;
      disk.material.opacity = 0.8 + Math.sin(t * 2) * 0.2;
    });
    if (look.ring === 'rune' || look.ring === 'hex') {
      const inner = add(new THREE.Mesh(disk.geometry, disk.material.clone()));
      inner.rotation.x = -Math.PI / 2;
      inner.position.y = 0.07;
      inner.scale.setScalar(0.58);
      const lift = add(new THREE.Mesh(new THREE.CylinderGeometry(2.95, 2.95, 1.4, 48, 1, true), addMat(cols[0], { map: fadeTex(), opacity: 0.4 })));
      lift.position.y = 0.7;
      updates.push((t) => {
        inner.rotation.z = -t * 0.7;
        lift.material.opacity = 0.3 + Math.sin(t * 2) * 0.12;
      });
    }
  }
  if (look.halo) {
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.09, 8, 40), glow('#fff2b0'));
    halo.add(new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.28, 8, 40), glow(cols[0], 0.35)));
    halo.rotation.x = Math.PI / 2;
    studs.add(halo);
    const hg = add(sprite('#fff2b0', 2.8, 0.5));
    const hy = (t) => 5.9 + Math.sin(t * 2) * 0.12;
    add(particles(10, ['#ffffff', cols[0]], 'star', 0.5, (i, t, v) => {
      const a = (i / 10) * TAU + t * 1.2;
      v.set(Math.cos(a) * 0.85, hy(t), Math.sin(a) * 0.85);
      return 1;
    }, { twinkle: 1 }));
    updates.push((t) => (halo.position.y = hg.position.y = hy(t)));
  }
  if (look.crown) {
    const crown = new THREE.Group();
    const gold = new THREE.MeshStandardMaterial({ color: '#ffcf4a', metalness: 0.9, roughness: 0.2, emissive: '#5a3a00', side: THREE.DoubleSide });
    crown.add(new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.7, 0.4, 20, 1, true), gold));
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      const sp = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.5, 4), gold);
      sp.position.set(Math.cos(a) * 0.72, 0.42, Math.sin(a) * 0.72);
      crown.add(sp);
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.1), glow(col(i + 1)));
      gem.position.set(Math.cos(a) * 0.76, 0.02, Math.sin(a) * 0.76);
      crown.add(gem);
    }
    crown.add(sprite('#ffe08a', 2.4, 0.45));
    const fl = sprite('#ffffff', 1, 0, flareTex());
    crown.add(fl);
    studs.add(crown);
    updates.push((t) => {
      crown.position.y = 6 + Math.sin(t * 1.6) * 0.15 + (look.halo ? 0.6 : 0);
      crown.rotation.y = t * 0.6;
      const u = (t * 0.6) % 1, k = u < 0.2 ? Math.sin((u / 0.2) * Math.PI) : 0;
      fl.position.set(0.72, 0.65, 0);
      fl.scale.setScalar(0.3 + k * 1.4);
      fl.material.opacity = k;
    });
  }
  if (look.wings) {
    const mat = new THREE.MeshBasicMaterial({ map: wingTex2(cols), transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: ADD });
    const wings = [-1, 1].map((sx) => {
      const pivot = new THREE.Group();
      pivot.position.set(0, 3.6, -0.6);
      const w = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 4.6), mat);
      w.position.set(sx * 2.2, 1, 0);
      w.scale.x = -sx;
      pivot.add(w);
      const w2 = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.2), mat);
      w2.position.set(sx * 1.6, 0.2, -0.15);
      w2.scale.x = -sx;
      w2.rotation.z = sx * -0.35;
      pivot.add(w2);
      studs.add(pivot);
      return [pivot, sx];
    });
    updates.push((t) => wings.forEach(([p, sx]) => (p.rotation.y = sx * (0.35 + Math.sin(t * 2.4) * 0.25))));
    const n = N(16), sd = seeds(n);
    add(particles(n, cols, 'dot', 0.7, (i, t, v) => {
      const [a, b, c, d] = sd[i];
      const u = (t * (0.18 + d * 0.1) + a) % 1, sx = i % 2 ? 1 : -1;
      v.set(sx * (0.9 + b * 3) + Math.sin(t * 2 + a * 9) * 0.3, 6.2 - u * 6 - b * 1.5, -0.9 - c * 0.8);
      return Math.sin(Math.PI * u) * 0.9;
    }, { trail: 3, gap: 0.05 }));
  }
  if (look.pillar) {
    const pil = add(new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 11, 32, 1, true), addMat(cols[0], { map: fadeTex() })));
    pil.position.y = 5.5;
    const core = add(new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 11, 24, 1, true), addMat('#ffffff', { map: fadeTex(), opacity: 0.1 })));
    core.position.y = 5.5;
    const st = streakTex().clone();
    st.needsUpdate = true;
    st.repeat.set(3, 1);
    const streaks = add(new THREE.Mesh(new THREE.CylinderGeometry(1.85, 1.85, 11, 32, 1, true), addMat(col(1), { map: st, opacity: 0.4 })));
    streaks.position.y = 5.5;
    updates.push((t) => {
      pil.material.opacity = 0.26 + Math.sin(t * 3) * 0.08;
      core.material.opacity = 0.1 + Math.sin(t * 3 + 1) * 0.04;
      st.offset.y = -t * 0.35;
    });
  }
  if (look.shell) {
    const fm = fresnelMat(cols[0], 2, 0.9);
    const sh = add(new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), fm));
    sh.position.y = 2.7;
    updates.push((t) => {
      const k = 1 + Math.sin(t * 2.2) * 0.04;
      sh.scale.set(2.3 * k, 3.4 * k, 2.3 * k);
      fm.uniforms.k.value = 0.75 + Math.sin(t * 2.2) * 0.2;
    });
  }
  if (look.beams) {
    const n = Math.min(cols.length * 2, 8);
    const bands = Array.from({ length: n }, (_, i) => add(new THREE.Mesh(new THREE.PlaneGeometry(1.4, 8, 1, 24), bandMat(col(i), i * 1.7))));
    updates.push((t) => bands.forEach((b, i) => {
      const a = (i / n) * TAU + t * 0.35;
      b.position.set(Math.cos(a) * 2.6, 4 + Math.sin(t * 1.5 + i) * 0.4, Math.sin(a) * 2.6);
      b.rotation.y = -a + Math.PI / 2;
      b.material.uniforms.op.value = 0.45 + Math.sin(t * 2 + i * 1.7) * 0.2;
    }));
  }
  if (look.bolts) {
    const segs = [], ends = [];
    const mats = cols.map((c) => glow(c)), halos = cols.map((c) => glow(c, 0.3));
    const geo = new THREE.BoxGeometry(0.12, 0.12, 1), geo2 = new THREE.BoxGeometry(0.45, 0.45, 1);
    for (let b = 0; b < 3; b++) {
      for (let s = 0; s < 6; s++) {
        const m = add(new THREE.Mesh(geo, mats[b % mats.length]));
        m.add(new THREE.Mesh(geo2, halos[b % halos.length]));
        segs.push(m);
      }
      ends.push(add(sprite(col(b), 1.3, 0.9, flareTex())));
    }
    const a = new THREE.Vector3(), c = new THREE.Vector3();
    let last = -1;
    updates.push((t) => {
      const slot = Math.floor(t * 12);
      if (slot === last) return;
      last = slot;
      const rr = rng(slot * 97 + 13);
      for (let b = 0; b < 3; b++) {
        const ang = rr() * TAU;
        a.set(Math.cos(ang) * 1.6, 1 + rr() * 4, Math.sin(ang) * 1.6);
        const end = new THREE.Vector3(Math.cos(ang + 1.5) * 2.4, 1 + rr() * 5, Math.sin(ang + 1.5) * 2.4);
        let vis = false;
        for (let s = 0; s < 6; s++) {
          c.lerpVectors(a, end, (s + 1) / 6);
          if (s < 5) c.add(new THREE.Vector3((rr() - 0.5) * 0.9, (rr() - 0.5) * 0.9, (rr() - 0.5) * 0.9));
          const m = segs[b * 6 + s];
          m.position.lerpVectors(a, c, 0.5);
          m.scale.z = a.distanceTo(c);
          m.lookAt(studs.localToWorld(c.clone()));
          m.visible = rr() > 0.15;
          vis = vis || m.visible;
          a.copy(c);
        }
        ends[b].position.copy(end);
        ends[b].visible = vis;
        ends[b].scale.setScalar(0.8 + rr() * 1.2);
      }
    });
  }
  if (look.glitch) {
    const ghosts = [cols[0], cols[1] || '#20f0ff'].map((c) => {
      const gh = figure.clone();
      gh.remove(gh.getObjectByName('outline'));
      const m = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.5, depthWrite: false, blending: ADD });
      gh.traverse((o) => o.isMesh && (o.material = m));
      studs.add(gh);
      return gh;
    });
    const on = (t) => rng(Math.floor(t * 10) * 31 + 7)() < 0.45;
    updates.push((t) => {
      const rr = rng(Math.floor(t * 10) * 31 + 7), vis = rr() < 0.45;
      ghosts.forEach((g, i) => {
        g.visible = vis;
        g.position.set((i ? 1 : -1) * (0.15 + rr() * 0.35), (rr() - 0.5) * 0.2, 0);
      });
      figure.position.x = rr() < 0.15 ? (rr() - 0.5) * 0.6 : 0;
    });
    const n = N(40), sd = seeds(n);
    add(particles(n, cols, 'square', 0.5, (i, t, v) => {
      const [a, b, c] = sd[i], slot = Math.floor(t * 10);
      v.set((a - 0.5) * 3.4 + Math.sin(slot * 1.7 + i) * 0.4, b * 5.4, (c - 0.5) * 1.4);
      return on(t) ? 0.9 : 0;
    }, { twinkle: 0 }));
  }

  studs.traverse((o) => o.userData.update && updates.push(o.userData.update));

  return {
    root, spinner, aura,
    update(t) {
      TIME.value = t;
      for (const u of updates) u(t);
    },
    dispose() {
      root.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) [].concat(o.material).forEach((m) => m.dispose());
      });
    },
  };
}
