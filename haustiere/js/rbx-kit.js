// Roblox-Stil: glatte Kunststoff-Blöcke mit weich gerundeten Kanten, große Köpfe, glänzende Knopfaugen.
// Gleiche Konventionen wie templates.js: Tiere schauen nach +z, Boden bei y = 0, Größe passt petFactory an.
import { THREE, TAU, lighten, darken, glowSprite } from './kit.js';
import { blink } from './templates.js';

// ── Geometrie ────────────────────────────────────────────────────────────────
// Abgerundeter Quader mit analytischen Normalen (keine Kanten-Facetten). tx/tz verjüngen die Oberseite.
const gcache = new Map();
export function rgeo(w, h, d, r, tx = 1, tz = tx) {
  r = Math.max(0.002, Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4));
  const key = [w, h, d, r, tx, tz].map((n) => n.toFixed(4)).join();
  let g = gcache.get(key);
  if (g) return g;
  const S = 16, E = 0.5;
  g = new THREE.BoxGeometry(2, 2, 2, S, S, S);
  const P = g.attributes.position, N = g.attributes.normal;
  const half = [w / 2 - r, h / 2 - r, d / 2 - r], inner = [0, 0, 0], dv = [0, 0, 0], q = [0, 0, 0];
  const dir = new THREE.Vector3();
  for (let i = 0; i < P.count; i++) {
    q[0] = P.getX(i); q[1] = P.getY(i); q[2] = P.getZ(i);
    for (let k = 0; k < 3; k++) {
      const a = Math.abs(q[k]), s = Math.sign(q[k]);
      if (a <= 1 - E) { inner[k] = (q[k] / (1 - E)) * half[k]; dv[k] = 0; }
      else { inner[k] = s * half[k]; dv[k] = (s * (a - (1 - E))) / E; }
    }
    dir.set(dv[0], dv[1], dv[2]);
    if (dir.lengthSq() < 1e-9) dir.set(0, 1, 0);
    dir.normalize();
    const y = inner[1] + dir.y * r, k = y / h + 0.5;
    P.setXYZ(i, (inner[0] + dir.x * r) * (1 + (tx - 1) * k), y, (inner[2] + dir.z * r) * (1 + (tz - 1) * k));
    N.setXYZ(i, dir.x, dir.y, dir.z);
  }
  if (tx !== 1 || tz !== 1) g.computeVertexNormals();
  g.computeBoundingBox();
  g.computeBoundingSphere();
  gcache.set(key, g);
  return g;
}

export function blk(b, p, m, pos, size, r = 0.04, rot, tx = 1, tz = tx) {
  const mesh = b.place(new THREE.Mesh(rgeo(size[0], size[1], size[2], r, tx, tz), m), p, pos, null, rot);
  if (b.outline !== false && Math.min(...size) > 0.045) outline(b, mesh, size, m);
  return mesh;
}
// Comic-Kontur: Rückseiten-Hülle in sehr dunkler Eigenfarbe, konstante Strichstärke
function outline(b, mesh, size, m) {
  if (m.transparent || !m.color) return;
  if (m.emissive && m.emissiveIntensity > 0 && m.emissive.r + m.emissive.g + m.emissive.b > 0.3) return;
  const t = b.outlineW ?? 0.012;
  b._ol ??= {};
  const key = m.color.getHexString();
  const om = (b._ol[key] ??= b.track(new THREE.MeshBasicMaterial({ color: m.color.clone().multiplyScalar(0.16), side: THREE.BackSide })));
  const o = new THREE.Mesh(mesh.geometry, om);
  o.scale.set(1 + (2 * t) / size[0], 1 + (2 * t) / size[1], 1 + (2 * t) / size[2]);
  o.userData.outline = o.userData.nofit = true;
  mesh.add(o);
}
// weicher Block: Rundung = 35 % der kleinsten Kante
export const sblk = (b, p, m, pos, size, rot, k = 0.35, tx, tz) => blk(b, p, m, pos, size, Math.min(...size) * k, rot, tx, tz);

// ── Materialien ──────────────────────────────────────────────────────────────
export const pl = (b, c, o = {}) => b.mat(c, { rough: 0.4, coat: 0.45, coatRough: 0.3, sheen: 0.3, sheenColor: lighten(c, 0.55), ...o });
export const neon = (b, c, ei = 1.6, o = {}) => b.mat(c, { glow: c, ei, rough: 0.3, coat: 0.6, ...o });
export const gold = (b, o = {}) => b.mat('#f2c14e', { metal: 1, rough: 0.22, coat: 0.6, ...o });
export const ink = (b) => b.mat('#141018', { rough: 0.15, coat: 1, coatRough: 0.05 });
export const glass = (b, c, o = {}) => b.mat(c, { rough: 0.05, coat: 1, coatRough: 0.03, opacity: 0.55, irid: 0.3, ...o });

// ── Gesicht ──────────────────────────────────────────────────────────────────
// Knopfaugen mit Iris-Schimmer und zwei Glanzpunkten, Brauen, Wangen, Mund.
export function face(b, p, o) {
  const epic = !!b.pet?.epic;
  const F = { y: 0, z: 0, gap: 0.12, s: 0.1, iris: epic && !o.glow ? b.pet.glow : null, type: 'round', mouth: 'w', blush: '#ff8fa6', brow: epic ? 0.16 : null, glow: null, yaw: 0, ...o };
  if (F.iris == null && epic && !F.glow) F.iris = b.pet.glow;
  const s = F.s, black = ink(b);
  const hi = b.mat('#ffffff', { glow: '#ffffff', ei: 1.1 });
  const eyes = [];
  for (const sx of [1, -1]) {
    const e = b.group(p, [sx * F.gap, F.y, F.z], [0, sx * F.yaw, 0]);
    if (F.type === 'happy') {
      b.torus(e, black, [0, -s * 0.35, 0], s * 0.6, s * 0.17, null, Math.PI);
    } else {
      const base = F.glow ? neon(b, F.glow, 1.8) : F.type === 'cat' ? b.mat(F.iris ?? '#8bd23a', { rough: 0.12, coat: 1 }) : black;
      b.ball(e, base, [0, 0, 0], [s * 0.78, s, s * 0.32]);
      if (F.type === 'cat') b.ball(e, black, [0, 0, s * 0.12], [s * 0.2, s * 0.8, s * 0.24]);
      else if (F.iris && !F.glow) b.ball(e, b.mat(F.iris, { rough: 0.12, coat: 1, glow: F.iris, ei: 0.3 }), [0, -s * 0.3, s * 0.08], [s * 0.56, s * 0.48, s * 0.26]);
      b.ball(e, hi, [s * 0.28, s * 0.36, s * 0.26], [s * 0.24, s * 0.28, s * 0.1]);
      b.ball(e, hi, [-s * 0.22, -s * 0.4, s * 0.25], [s * 0.1, s * 0.1, s * 0.06]);
      if (epic) {
        const st = b.group(e, [s * 0.3, s * 0.36, s * 0.34]);
        for (const r of [0, Math.PI / 2]) blk(b, st, hi, [0, 0, 0], [s * 0.08, s * 0.5, s * 0.04], s * 0.02, [0, 0, r + Math.PI / 4]);
        b.on((t) => { const k = 0.6 + Math.pow(Math.max(0, Math.sin(t * 1.7 + sx)), 8) * 0.8; st.scale.setScalar(k); st.rotation.z = t * 0.8; });
      }
      eyes.push(e);
    }
    if (F.brow != null) blk(b, e, black, [sx * s * 0.1, s * 1.35, s * 0.05], [s * 1.2, s * 0.24, s * 0.22], s * 0.1, [0, 0, -sx * F.brow]);
    if (F.blush) b.ball(e, b.mat(F.blush, { rough: 0.7, opacity: 0.7 }), [sx * s * 0.75, -s * 1.05, -s * 0.05], [s * 0.5, s * 0.28, s * 0.12]);
  }
  const mm = b.mat('#3a1a22', { rough: 0.4, coat: 0.6 });
  const my = F.mouthY ?? F.y - s * 1.55, mz = F.mouthZ ?? F.z;
  const mr = F.mouthS ?? s * 0.32;
  if (F.mouth === 'w') for (const sx of [1, -1]) b.torus(p, mm, [sx * mr, my, mz], mr, mr * 0.28, [0, 0, Math.PI], Math.PI);
  else if (F.mouth === 'smile') b.torus(p, mm, [0, my, mz], mr * 1.6, mr * 0.3, [0, 0, Math.PI], Math.PI);
  else if (F.mouth === 'o') b.ball(p, mm, [0, my, mz], [mr * 0.8, mr, mr * 0.4]);
  if (eyes.length) blink(b, eyes);
  return eyes;
}

// ── Ohren ────────────────────────────────────────────────────────────────────
function ears(b, head, type, hw, hh, hd, S, m, inner) {
  const out = [];
  for (const sx of [1, -1]) {
    let e;
    switch (type) {
      case 'pointy':
        e = b.group(head, [sx * hw * 0.3, hh * 0.44, -hd * 0.12], [0, 0, -sx * 0.2]);
        blk(b, e, m, [0, hh * 0.2 * S, 0], [hw * 0.3 * S, hh * 0.46 * S, hd * 0.18], hw * 0.05, null, 0.18, 0.6);
        blk(b, e, inner, [0, hh * 0.17 * S, hd * 0.07], [hw * 0.17 * S, hh * 0.3 * S, hd * 0.06], hw * 0.025, null, 0.2, 0.6);
        break;
      case 'floppy':
        e = b.group(head, [sx * hw * 0.5, hh * 0.32, -hd * 0.04], [0, 0, sx * 0.14]);
        sblk(b, e, m, [sx * hw * 0.04, -hh * 0.26 * S, 0], [hw * 0.15, hh * 0.66 * S, hd * 0.42], null, 0.45);
        break;
      case 'round':
        e = b.group(head, [sx * hw * 0.34, hh * 0.46, -hd * 0.1], [0, 0, -sx * 0.3]);
        sblk(b, e, m, [0, hh * 0.08 * S, 0], [hw * 0.28 * S, hw * 0.26 * S, hd * 0.16], null, 0.48);
        sblk(b, e, inner, [0, hh * 0.08 * S, hd * 0.06], [hw * 0.16 * S, hw * 0.14 * S, hd * 0.06], null, 0.48);
        break;
      case 'long':
        e = b.group(head, [sx * hw * 0.2, hh * 0.44, -hd * 0.14], [-0.12, 0, -sx * 0.12]);
        sblk(b, e, m, [0, hh * 0.5 * S, 0], [hw * 0.2, hh * 1.0 * S, hd * 0.12], null, 0.48);
        sblk(b, e, inner, [0, hh * 0.5 * S, hd * 0.05], [hw * 0.11, hh * 0.8 * S, hd * 0.05], null, 0.48);
        break;
      case 'side':
        e = b.group(head, [sx * hw * 0.48, hh * 0.3, -hd * 0.12], [0, 0, -sx * 1.15]);
        sblk(b, e, m, [0, hh * 0.24 * S, 0], [hw * 0.2, hh * 0.5 * S, hd * 0.1], null, 0.48);
        sblk(b, e, inner, [0, hh * 0.24 * S, hd * 0.045], [hw * 0.1, hh * 0.36 * S, hd * 0.04], null, 0.48);
        break;
      default:
        continue;
    }
    e.userData.rx = e.rotation.x;
    out.push(e);
  }
  return out;
}

// ── Schwanz als Gliederkette (jedes Glied schwingt verzögert nach) ───────────
export function chain(b, parent, n, seg) {
  const segs = [];
  let p = parent;
  for (let i = 0; i < n; i++) {
    const g = b.group(p);
    const len = seg(g, i);
    segs.push(g);
    const next = b.group(g, [0, 0, -len]);
    p = next;
  }
  return segs;
}

function makeTail(b, tail, P, M) {
  const L = P.tailL, W = P.tailW, tipM = P.tipColor ? pl(b, P.tipColor, P.matO) : M;
  switch (P.tail) {
    case 'thin':
      return chain(b, tail, 5, (g, i) => {
        const w = W * (1 - i * 0.12), l = L / 5 + 0.02;
        sblk(b, g, i === 4 ? tipM : M, [0, 0, -l / 2], [w, w, l], null, 0.48);
        g.rotation.x = i ? P.tailCurl ?? 0.28 : 0;
        return l - 0.02;
      });
    case 'bushy':
      return chain(b, tail, 4, (g, i) => {
        const w = W * [0.6, 1.25, 1.45, 1.1][i], l = L * [0.18, 0.28, 0.3, 0.24][i];
        sblk(b, g, i === 3 ? tipM : M, [0, 0, -l / 2], [w, w * 0.95, l + 0.04], null, 0.46);
        g.rotation.x = i ? P.tailCurl ?? 0.18 : 0;
        return l;
      });
    case 'stub':
      sblk(b, tail, tipM, [0, 0, -W * 0.3], [W * 1.4, W * 1.3, W * 1.1], null, 0.48);
      return [tail];
    case 'curl': {
      const t = b.torus(tail, M, [0, 0.02, -W * 1.2], W * 1.1, W * 0.35, [0, Math.PI / 2, 0], TAU * 0.8);
      return [tail];
    }
    case 'tuft': {
      const segs = chain(b, tail, 4, (g, i) => {
        const l = L / 4;
        sblk(b, g, M, [0, 0, -l / 2], [W * 0.5, W * 0.5, l + 0.02], null, 0.48);
        g.rotation.x = i ? -0.32 : 0;
        return l;
      });
      sblk(b, segs[3], tipM, [0, 0, -L / 4 - W * 0.5], [W * 1.1, W * 1.1, W * 1.6], null, 0.45);
      return segs;
    }
    case 'horse': {
      const hm = pl(b, P.tipColor ?? P.color, { rough: 0.6, sheen: 0.8 });
      return chain(b, tail, 4, (g, i) => {
        const l = L / 4;
        sblk(b, g, hm, [0, 0, -l / 2], [W * (1.1 + i * 0.25), W * (0.9 + i * 0.1), l + 0.03], null, 0.4);
        g.rotation.x = i ? -0.42 : 0;
        return l;
      });
    }
    default:
      return [];
  }
}

// ── Vierbeiner ───────────────────────────────────────────────────────────────
export function quadR(b, o) {
  const P = {
    body: [0.6, 0.5, 0.82], head: [0.76, 0.64, 0.62], leg: [0.17, 0.24, 0.18], snout: [0.36, 0.22, 0.14],
    color: '#c98a4b', ear: 'pointy', earS: 1, tail: 'thin', tailL: 0.42, tailW: 0.11, tailUp: 0.7,
    eyeS: 0.16, iris: null, eye: 'round', mouth: 'w', nose: '#2a1a1e', inner: '#f2a7ad', wag: 6, wagAmp: 0.35, ...o,
  };
  const [bw, bh, bl] = P.body, [hw, hh, hd] = P.head, [lw, lh, ld] = P.leg;
  const M = P.mat ?? pl(b, P.color, P.matO);
  const belly = P.belly ? pl(b, P.belly, P.matO) : null;
  const legM = P.legColor ? pl(b, P.legColor, P.matO) : M;
  const headM = P.headMat ?? (P.headColor ? pl(b, P.headColor, P.matO) : M);
  const g = b.group(b.model), bob = b.group(g);
  // Beine: Drehpunkt an der Hüfte, Pfote mit Zehenrillen oder Huf
  const legs = [];
  const lx = bw / 2 - lw / 2 - 0.015, lz = bl / 2 - ld / 2 - 0.05;
  const pawM = P.hoof ? b.mat(P.hoof, { rough: 0.3, coat: 0.8 }) : P.paw ? pl(b, P.paw) : legM;
  const groove = b.mat(darken(P.paw ?? P.legColor ?? P.color, 0.45), { rough: 0.6 });
  for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    const leg = b.group(bob, [sx * lx, lh, sz * lz]);
    sblk(b, leg, legM, [0, -lh / 2 + 0.02, 0], [lw, lh + 0.04, ld], null, 0.34);
    sblk(b, leg, pawM, [0, -lh + lh * 0.15, 0.012], [lw * 1.1, lh * 0.3, ld * 1.16], null, 0.34);
    if (!P.hoof) for (const tx of [-1, 1]) blk(b, leg, groove, [tx * lw * 0.18, -lh + lh * 0.14, ld * 0.58 + 0.012], [0.012, lh * 0.17, 0.02], 0.005);
    legs.push(leg);
  }
  // Rumpf
  const by = lh + bh / 2 - 0.03;
  const body = b.group(bob, [0, by, 0]);
  sblk(b, body, M, [0, 0, 0], [bw, bh, bl], null, 0.32);
  if (belly) {
    sblk(b, body, belly, [0, -bh * 0.1, bl / 2 - 0.05], [bw * 0.64, bh * 0.6, 0.12], null, 0.4);
    sblk(b, body, belly, [0, -bh / 2 + 0.025, 0.02], [bw * 0.7, 0.07, bl * 0.72], null, 0.4);
  }
  // Epische Tiere: Neonadern in Eifarbe, goldene Schulterplatten, Leuchtringe an den Beinen
  let epicGlow = null;
  if (b.pet?.epic && P.trim !== false) {
    epicGlow = neon(b, b.pet.glow, 1.6);
    for (const sx of [1, -1]) {
      blk(b, body, epicGlow, [sx * (bw / 2 + 0.006), bh * 0.08, -bl * 0.02], [0.02, 0.035, bl * 0.66], 0.012);
      blk(b, body, epicGlow, [sx * (bw / 2 + 0.006), -bh * 0.12, -bl * 0.1], [0.02, 0.025, bl * 0.42], 0.01);
      const pd = b.group(body, [sx * (bw / 2 - 0.01), bh * 0.24, bl * 0.3], [0, 0, -sx * 0.35]);
      sblk(b, pd, gold(b), [0, 0, 0], [0.1, Math.min(0.2, bh * 0.36), Math.min(0.26, bl * 0.3)], null, 0.4);
      b.octa(pd, b.mat(b.pet.glow, { rough: 0.05, coat: 1, flat: true, glow: b.pet.glow, ei: 0.9 }), [sx * 0.055, 0, 0], 0.03, [0.02, 0.05, 0.05]);
    }
    legs.forEach((l) => blk(b, l, epicGlow, [0, -lh + lh * 0.36, 0], [lw * 1.06, 0.026, ld * 1.06], 0.012));
  }
  // Kopf mit Schnauze, Nase und Gesicht
  const hy = by + bh * 0.5 + hh * 0.26 + (P.headUp ?? 0), hz = bl / 2 - hd * 0.08 + (P.headFwd ?? 0);
  const head = b.group(bob, [0, hy, hz]);
  sblk(b, head, headM, [0, 0, 0], [hw, hh, hd], null, 0.3);
  const [sw, sh, sd] = P.snout;
  const snM = P.muzzle ? pl(b, P.muzzle) : belly ?? headM;
  const sy = -hh * 0.2, sz = hd / 2 + sd / 2 - 0.05;
  if (sd > 0) sblk(b, head, snM, [0, sy, sz], [sw, sh, sd], null, 0.4);
  const front = sd > 0 ? sz + sd / 2 : hd / 2;
  const noseM = b.mat(P.nose, { rough: 0.18, coat: 1, coatRough: 0.05 });
  sblk(b, head, noseM, [0, sy + sh * 0.22, front], [sw * 0.36, sh * 0.3, 0.07], null, 0.45);
  const eyes = face(b, head, {
    y: hh * 0.1, z: hd / 2, gap: hw * 0.24, s: hh * P.eyeS, iris: P.iris, type: P.eye, glow: P.eyeGlow, brow: P.brow,
    mouth: P.mouth, mouthY: sy - sh * 0.12, mouthZ: front - 0.005, mouthS: sw * 0.11, blush: P.blush ?? '#ff8fa6',
  });
  const inner = b.mat(P.inner, { rough: 0.6, sheen: 0.4 });
  const earM = P.earColor ? pl(b, P.earColor, P.matO) : headM;
  const earList = ears(b, head, P.ear, hw, hh, hd, P.earS, earM, inner);
  // Schwanz
  const tail = b.group(bob, [0, by + bh * 0.18, -bl / 2 + 0.03], [P.tailUp, 0, 0]);
  const tailSegs = makeTail(b, tail, P, P.tailMat ?? M);
  const ph = b.rnd() * 6;
  b.on((t) => {
    const br = Math.sin(t * 2.2 + ph);
    body.scale.set(1 + br * 0.012, 1 + br * 0.02, 1);
    // Freudensprung alle paar Sekunden: Ausholen, Sprung mit Strecken, Landung mit Stauchen
    const hk = ((t + ph * 2) % 6.5) / 6.5;
    const crouch = hk < 0.03 ? Math.sin((hk / 0.03) * Math.PI) : hk > 0.15 && hk < 0.19 ? Math.sin(((hk - 0.15) / 0.04) * Math.PI) : 0;
    const air = hk >= 0.03 && hk <= 0.15 ? Math.sin(((hk - 0.03) / 0.12) * Math.PI) : 0;
    bob.position.y = Math.pow(Math.max(0, Math.sin(t * 1.3 + ph)), 6) * 0.04 + air * (P.hop ?? 0.22);
    body.scale.y *= 1 - crouch * 0.1 + air * 0.05;
    legs.forEach((l, i) => (l.rotation.x = (i < 2 ? -1 : 1) * air * 0.5));
    if (epicGlow) epicGlow.emissiveIntensity = 1.3 + Math.sin(t * 2.4) * 0.5 + air * 1.5;
    head.rotation.y = Math.sin(t * 0.6 + ph) * 0.16 + (P.headYaw ?? 0);
    head.rotation.x = Math.sin(t * 0.9 + ph) * 0.05 + (P.headPitch ?? 0) - air * 0.2;
    head.rotation.z = Math.sin(t * 0.45 + ph) * 0.05;
    tailSegs.forEach((s, i) => (s.rotation.y = Math.sin(t * P.wag + ph - i * 0.7) * P.wagAmp * (0.6 + i * 0.15)));
    earList.forEach((e, i) => (e.rotation.x = e.userData.rx - Math.pow(Math.max(0, Math.sin(t * 0.8 + ph + i * 1.7)), 30) * 0.4));
  });
  return { g, bob, body, head, legs, tail, tailSegs, ears: earList, eyes, M, belly, headM, by, hy, hz, bw, bh, bl, hw, hh, hd, lh, front, sy, sw, sh, P };
}

// ── Echse ────────────────────────────────────────────────────────────────────
export function lizardR(b, o) {
  const P = {
    body: [0.5, 0.34, 0.8], head: [0.48, 0.34, 0.44], snout: [0.34, 0.19, 0.26], leg: [0.12, 0.2], color: '#3f9a3e',
    tailN: 7, tailL: 1.0, tailW: 0.2, spikes: true, iris: '#e0b020', eyeS: 0.32, ...o,
  };
  const [bw, bh, bl] = P.body, [hw, hh, hd] = P.head, [sw, sh, sd] = P.snout, [lw, lh] = P.leg;
  const M = P.mat ?? pl(b, P.color, { rough: 0.35, ...(P.matO ?? {}) });
  const belly = P.belly ? pl(b, P.belly) : M;
  const g = b.group(b.model), bob = b.group(g);
  const legs = [];
  const ly = lh + 0.04;
  for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    const leg = b.group(bob, [sx * bw * 0.42, ly, sz * bl * 0.3]);
    sblk(b, leg, M, [sx * 0.08, 0, 0], [0.18, lw, lw], null, 0.45);
    sblk(b, leg, M, [sx * 0.15, -lh / 2, 0], [lw, lh, lw], null, 0.45);
    sblk(b, leg, belly, [sx * 0.15, -lh + 0.02, 0.03], [lw * 1.7, 0.05, lw * 1.9], null, 0.4);
    legs.push(leg);
  }
  const by = ly + bh * 0.12;
  const body = b.group(bob, [0, by, 0]);
  sblk(b, body, M, [0, 0, 0], [bw, bh, bl], null, 0.4);
  if (P.belly) sblk(b, body, belly, [0, -bh * 0.36, 0], [bw * 0.8, bh * 0.34, bl * 0.86], null, 0.45);
  const head = b.group(bob, [0, by + bh * 0.16, bl / 2 + hd * 0.3]);
  sblk(b, head, M, [0, 0, 0], [hw, hh, hd], null, 0.35);
  const snz = hd / 2 + sd / 2 - 0.05;
  sblk(b, head, M, [0, -hh * 0.14, snz], [sw, sh, sd], null, 0.4);
  if (P.belly) sblk(b, head, belly, [0, -hh * 0.36, snz - 0.02], [sw * 0.86, sh * 0.4, sd * 0.94], null, 0.4);
  const mm = b.mat('#2a1418', { rough: 0.5 });
  for (const sx of [1, -1]) blk(b, head, mm, [sx * sw * 0.5, -hh * 0.2, snz - 0.02], [0.012, 0.014, sd * 0.9], 0.006);
  for (const sx of [1, -1]) blk(b, head, mm, [sx * sw * 0.16, -hh * 0.14 + sh * 0.3, snz + sd / 2 - 0.01], [0.03, 0.02, 0.02], 0.008);
  const eyeBumps = [];
  for (const sx of [1, -1]) {
    const eb = b.group(head, [sx * hw * 0.38, hh * 0.42, 0]);
    sblk(b, eb, M, [0, 0, 0], [hh * 0.5, hh * 0.46, hh * 0.5], null, 0.48);
    eyeBumps.push(eb);
  }
  const eyes = [];
  for (const [i, sx] of [[0, 1], [1, -1]])
    eyes.push(...face(b, eyeBumps[i], { y: 0, z: hh * 0.25, gap: 0, s: hh * P.eyeS * 0.55, iris: P.iris, glow: P.eyeGlow, mouth: 'none', blush: null, type: P.eye ?? 'round' }).filter((_, k) => k === 0));
  const tail = b.group(bob, [0, by, -bl / 2 + 0.05], [-0.18, 0, 0]);
  const tailSegs = chain(b, tail, P.tailN, (gg, i) => {
    const k = 1 - i / P.tailN, w = P.tailW * (0.35 + 0.65 * k), l = P.tailL / P.tailN;
    sblk(b, gg, i === P.tailN - 1 && P.tipColor ? pl(b, P.tipColor) : M, [0, 0, -l / 2], [w * (bw / bh) * 0.7, w, l + 0.04], null, 0.45);
    gg.rotation.x = i ? (P.curl ? -0.62 : 0.07) : 0;
    return l;
  });
  if (P.spikes) {
    const sm = P.spikeMat ?? pl(b, P.spikeColor ?? darken(P.color, 0.3));
    for (let i = 0; i < 6; i++) blk(b, body, sm, [0, bh / 2 - 0.01, bl * (0.32 - i * 0.12)], [0.03, 0.08 + (i % 2) * 0.03, 0.08], 0.01, [-0.2, 0, 0], 0.2, 0.2);
  }
  let eg = null;
  if (b.pet?.epic && P.trim !== false) {
    eg = neon(b, b.pet.glow, 1.6);
    for (const sx of [1, -1]) blk(b, body, eg, [sx * (bw / 2 + 0.005), bh * 0.05, 0], [0.02, 0.03, bl * 0.7], 0.012);
    tailSegs.forEach((s, i) => i % 2 && blk(b, s, eg, [0, 0, -P.tailL / P.tailN / 2], [P.tailW * 0.9, P.tailW * 0.6, 0.025], 0.01));
    sblk(b, head, gold(b), [0, hh / 2 + 0.01, -hd * 0.05], [hw * 0.5, 0.05, hd * 0.6], null, 0.4);
  }
  const ph = b.rnd() * 6;
  b.on((t) => {
    const hk = ((t + ph * 2) % 7) / 7, air = hk < 0.1 ? Math.sin((hk / 0.1) * Math.PI) : 0;
    bob.position.y = air * 0.14;
    if (eg) eg.emissiveIntensity = 1.3 + Math.sin(t * 2.4) * 0.5 + air * 1.5;
    body.scale.y = 1 + Math.sin(t * 2 + ph) * 0.025;
    head.rotation.y = Math.sin(t * 0.7 + ph) * 0.2;
    head.rotation.x = Math.sin(t * 1.1 + ph) * 0.04;
    tailSegs.forEach((s, i) => (s.rotation.y = Math.sin(t * 1.4 + ph - i * 0.5) * 0.12));
  });
  return { g, bob, body, head, legs, tail, tailSegs, eyes, M, belly, by, bw, bh, bl, hw, hh, hd, snz, sw, sh, sd, P };
}

// ── Vogel ────────────────────────────────────────────────────────────────────
export function birdR(b, o) {
  const P = {
    body: [0.5, 0.56, 0.56], head: [0.48, 0.44, 0.44], color: '#ffffff', beak: '#ffb02e', legs: '#ffb02e',
    wingL: 0.42, flap: 2.2, flapAmp: 0.25, eyeS: 0.17, tail: 3, ...o,
  };
  const [bw, bh, bl] = P.body, [hw, hh, hd] = P.head;
  const M = P.mat ?? pl(b, P.color, P.matO);
  const belly = P.belly ? pl(b, P.belly, P.matO) : M;
  const headM = P.headColor ? pl(b, P.headColor, P.matO) : M;
  const wingM = P.wingColor ? pl(b, P.wingColor, P.matO) : M;
  const tipM = P.tip ? (P.tipMat ?? pl(b, P.tip, P.matO)) : wingM;
  const g = b.group(b.model), bob = b.group(g);
  const legM = pl(b, P.legs);
  const ly = 0.15;
  for (const sx of [1, -1]) {
    sblk(b, bob, legM, [sx * bw * 0.2, ly / 2, 0], [0.045, ly, 0.045], null, 0.45);
    for (const a of [-0.45, 0, 0.45]) sblk(b, bob, legM, [sx * bw * 0.2 + Math.sin(a) * 0.05, 0.015, Math.cos(a) * 0.05], [0.035, 0.03, 0.11], [0, a, 0], 0.45);
  }
  const by = ly + bh / 2 - 0.03;
  const body = b.group(bob, [0, by, 0]);
  sblk(b, body, M, [0, 0, 0], [bw, bh, bl], null, 0.38, 0.86);
  if (P.belly) sblk(b, body, belly, [0, -bh * 0.08, bl / 2 - 0.05], [bw * 0.66, bh * 0.68, 0.12], null, 0.45);
  const head = b.group(bob, [0, by + bh / 2 + hh * 0.28, bl * 0.1]);
  sblk(b, head, headM, [0, 0, 0], [hw, hh, hd], null, 0.36);
  const bm = b.mat(P.beak, { rough: 0.3, coat: 0.8 });
  blk(b, head, bm, [0, -hh * 0.08, hd / 2 - 0.02], [hw * 0.36, (P.beakL ?? 0.18), hh * 0.22], 0.025, [Math.PI / 2, 0, 0], 0.25, 0.4);
  blk(b, head, b.mat(darken(P.beak, 0.2), { rough: 0.35 }), [0, -hh * 0.2, hd / 2 - 0.03], [hw * 0.26, (P.beakL ?? 0.18) * 0.7, hh * 0.1], 0.02, [Math.PI / 2 + 0.2, 0, 0], 0.3, 0.5);
  const eyes = face(b, head, { y: hh * 0.12, z: hd / 2 - 0.01, gap: hw * 0.3, s: hh * P.eyeS, iris: P.iris, glow: P.eyeGlow, brow: P.brow, mouth: 'none', yaw: 0.25, blush: P.blush ?? '#ff8fa6' });
  if (P.crest) {
    const cm = pl(b, P.crest, P.crestO);
    for (let i = 0; i < 3; i++) blk(b, head, cm, [0, hh / 2 + 0.05, -hd * 0.1 - i * 0.07], [0.05, 0.14 - i * 0.025, 0.07], 0.02, [-0.4 - i * 0.25, 0, 0], 0.4);
  }
  const wings = [1, -1].map((sx) => {
    const w = b.group(bob, [sx * bw / 2, by + bh * 0.22, 0]);
    const L = P.wingL;
    sblk(b, w, wingM, [sx * 0.02, -L * 0.3, 0], [0.07, L * 0.62, bl * 0.62], null, 0.45);
    for (let i = 0; i < 3; i++) sblk(b, w, i === 2 ? tipM : wingM, [sx * 0.035, -L * (0.45 + i * 0.14), -bl * (0.05 + i * 0.08)], [0.05, L * 0.3, bl * (0.5 - i * 0.1)], [0.3 + i * 0.2, 0, 0], 0.45);
    return [w, sx];
  });
  const tailG = b.group(bob, [0, by - bh * 0.1, -bl / 2 + 0.04], [0.5, 0, 0]);
  for (let i = 0; i < P.tail; i++) {
    const a = (i - (P.tail - 1) / 2) * 0.35;
    sblk(b, tailG, i % 2 ? tipM : wingM, [Math.sin(a) * 0.08, 0, -0.14], [0.08, 0.035, 0.3], [0, a, 0], 0.45);
  }
  let eg = null;
  if (b.pet?.epic) {
    eg = neon(b, b.pet.glow, 1.6);
    wings.forEach(([w, sx]) => blk(b, w, eg, [sx * 0.07, -P.wingL * 0.05, 0], [0.02, 0.03, bl * 0.6], 0.012));
    b.torus(bob, gold(b), [0, by + bh / 2 - 0.02, bl * 0.08], hw * 0.42, 0.03, [Math.PI / 2, 0, 0], TAU, [1, 0.85, 1]);
  }
  const ph = b.rnd() * 6;
  b.on((t) => {
    if (eg) eg.emissiveIntensity = 1.3 + Math.sin(t * 2.4) * 0.6;
    body.scale.y = 1 + Math.sin(t * 2.2 + ph) * 0.02;
    head.rotation.y = Math.sin(t * 0.8 + ph) * 0.25;
    head.rotation.z = Math.sin(t * 1.3 + ph) * 0.08;
    const f = P.fly ? Math.sin(t * P.flap * 2.5 + ph) : Math.max(0, Math.sin(t * 9)) * (Math.sin(t * 0.7 + ph) > 0.5 ? 1 : 0);
    wings.forEach(([w, s]) => (w.rotation.z = s * ((P.fly ? 0.6 : 0.1) + f * (P.fly ? 0.7 : P.flapAmp * 2))));
    tailG.rotation.y = Math.sin(t * 1.7 + ph) * 0.12;
  });
  return { g, bob, body, head, wings, tailG, eyes, M, belly, headM, by, bw, bh, bl, hw, hh, hd, P };
}

// ── Zubehör ──────────────────────────────────────────────────────────────────
export function crown(b, p, pos, s = 1, o = {}) {
  const gm = o.mat ?? gold(b), g = b.group(p, pos, o.rot);
  g.scale.setScalar(s);
  b.cyl(g, gm, [0, 0.045, 0], 0.17, 0.18, 0.09, null, 8);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU + TAU / 16;
    blk(b, g, gm, [Math.cos(a) * 0.168, 0.14, Math.sin(a) * 0.168], [0.075, 0.11, 0.03], 0.01, [0, Math.PI / 2 - a, 0], 0.15, 1);
    b.ball(g, gm, [Math.cos(a) * 0.168, 0.205, Math.sin(a) * 0.168], 0.018);
  }
  const gems = o.gems ?? ['#e3263f', '#2a7de1'];
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 2 - (i / 4) * TAU;
    b.octa(g, b.mat(gems[i % gems.length], { rough: 0.05, coat: 1, flat: true, glow: gems[i % gems.length], ei: 0.35 }), [Math.cos(a) * 0.182, 0.045, Math.sin(a) * 0.182], 0.03, [0.032, 0.036, 0.018], [0, Math.PI / 2 - a, 0]);
  }
  return g;
}

export function partyHat(b, p, pos, s = 1, cols = ['#ff5aa5', '#ffe07a', '#5ad1ff']) {
  const g = b.group(p, pos, [0, 0, 0.25]);
  g.scale.setScalar(s);
  b.cone(g, pl(b, cols[0], { coat: 0.8 }), [0, 0, 0], 0.15, 0.36, null, null, 32);
  for (let i = 0; i < 2; i++) b.torus(g, pl(b, cols[1 + (i % (cols.length - 1))]), [0, 0.06 + i * 0.12, 0], 0.13 - i * 0.05, 0.015, [Math.PI / 2, 0, 0]);
  b.ball(g, pl(b, '#ffffff', { sheen: 1 }), [0, 0.37, 0], 0.045);
  return g;
}

export function topHat(b, p, pos, s = 1, band = '#c0283a') {
  const g = b.group(p, pos, [0, 0, -0.12]);
  g.scale.setScalar(s);
  const m = pl(b, '#1b1820', { rough: 0.5, coat: 0.6 });
  b.cyl(g, m, [0, 0.012, 0], 0.22, 0.22, 0.024, null, 40);
  b.cyl(g, m, [0, 0.15, 0], 0.13, 0.14, 0.27, null, 40);
  b.cyl(g, pl(b, band), [0, 0.06, 0], 0.142, 0.142, 0.05, null, 40);
  return g;
}

export function collarR(b, q, color = '#d23a3a', tag = true) {
  const g = b.group(q.bob, [0, q.hy - q.hh * 0.48, q.hz - q.hd * 0.18], [0.35, 0, 0]);
  b.torus(g, pl(b, color, { coat: 0.8 }), [0, 0, 0], q.hw * 0.36, 0.035, [Math.PI / 2, 0, 0]);
  g.children[0].scale.set(1, 0.8, 1);
  let t = null;
  if (tag) {
    t = b.cyl(g, gold(b), [0, -0.06, q.hw * 0.29 + 0.03], 0.055, 0.055, 0.016, [Math.PI / 2, 0, 0], 32);
    b.torus(g, gold(b), [0, -0.005, q.hw * 0.29 + 0.03], 0.016, 0.006);
  }
  return { g, tag: t };
}

// Blockflügel: drei gestufte Federn je Seite, sanfter Flügelschlag
export function blockWings(b, p, pos, s = 1, o = {}) {
  const m = pl(b, o.color ?? '#ffffff', { sheen: 1, sheenColor: '#fff6dd', glow: o.glow ?? '#fff3d0', ei: o.ei ?? 0.12 });
  const tip = o.tip ? (o.tipMat ?? pl(b, o.tip, { metal: o.tipMetal ? 1 : 0, rough: 0.3, glow: o.tip, ei: 0.15 })) : m;
  const wings = [1, -1].map((sx) => {
    const piv = b.group(p, [sx * pos[0], pos[1], pos[2]]);
    const w = b.group(piv, [0, 0, 0], [0, 0, sx * 0.35]);
    w.scale.setScalar(s);
    const lens = [0.62, 0.5, 0.38];
    lens.forEach((L, i) => {
      sblk(b, w, i === 0 ? m : i === 1 ? m : tip, [sx * L / 2, -i * 0.11, -i * 0.03], [L, 0.13, 0.05], [0, 0, -sx * i * 0.22], 0.45);
    });
    sblk(b, w, tip, [sx * 0.6, 0.02, 0], [0.1, 0.1, 0.055], null, 0.45);
    return [piv, sx];
  });
  const sp = o.speed ?? 2.6, ph = b.rnd() * 6;
  b.on((t) => wings.forEach(([pv, sx]) => (pv.rotation.y = sx * ((o.base ?? 0.55) + Math.sin(t * sp + ph) * 0.3))));
  return wings;
}

export function cape(b, p, pos, w, h, color, trim) {
  const g = b.group(p, pos, [0.18, 0, 0]);
  sblk(b, g, pl(b, color, { sheen: 1, sheenColor: lighten(color, 0.4), rough: 0.55 }), [0, -h / 2, 0], [w, h, 0.05], null, 0.4);
  if (trim) {
    const tm = pl(b, trim, { sheen: 1, rough: 0.8 });
    sblk(b, g, tm, [0, -h + 0.03, 0.005], [w + 0.03, 0.09, 0.08], null, 0.45);
    sblk(b, g, tm, [0, 0.01, 0.01], [w * 0.9, 0.1, 0.1], null, 0.45);
    const dot = ink(b);
    for (let i = -2; i <= 2; i++) sblk(b, g, dot, [i * w * 0.18, -h + 0.03, -0.042], [0.025, 0.04, 0.012], null, 0.4);
  }
  const ph = b.rnd() * 6;
  b.on((t) => (g.rotation.x = 0.18 + Math.sin(t * 1.2 + ph) * 0.06));
  return g;
}

export function sparkle(b, p, pos, color, scale = 0.4) {
  const s = glowSprite(color, scale, 0.8);
  s.position.set(pos[0], pos[1], pos[2]);
  p.add(s);
  return s;
}
