// Körper-Vorlagen und Zubehör, aus denen die einzelnen Haustiere zusammengesetzt werden.
// Alle Tiere schauen nach +z, der Boden liegt bei y = 0. Die Größe wird später automatisch angepasst.
import { THREE, TAU, lighten, darken, particles, glowSprite, wingShape, v3, furAlbedo } from './kit.js';

export const furMat = (b, color, o = {}) =>
  b.mat(color, { rough: 0.82, sheen: 1, sheenColor: lighten(color, 0.5), surf: 'fur', ns: 0.65, map: furAlbedo(), ...o });

// Partikelschwarm: fn(seed[4], t, out[7], i) schreibt Position (0–2), Helligkeit (3) und optional Farbe (4–6)
export function swarm(b, parent, n, color, size, fn, tex) {
  const pts = particles(n, color, size, tex);
  parent.add(pts);
  const seeds = Array.from({ length: n }, () => [b.rnd(), b.rnd(), b.rnd(), b.rnd()]);
  const P = pts.geometry.attributes.position, C = pts.geometry.attributes.color;
  const o = [0, 0, 0, 1, 1, 1, 1];
  b.on((t) => {
    for (let i = 0; i < n; i++) {
      o[4] = o[5] = o[6] = 1;
      fn(seeds[i], t, o, i);
      P.setXYZ(i, o[0], o[1], o[2]);
      C.setXYZ(i, o[4] * o[3], o[5] * o[3], o[6] * o[3]);
    }
    P.needsUpdate = C.needsUpdate = true;
  });
  return pts;
}

export function blink(b, eyes, ph = b.rnd() * 5) {
  b.on((t) => {
    const c = (t * 0.23 + ph) % 1;
    const k = c < 0.035 ? 1 - Math.sin((c / 0.035) * Math.PI) * 0.92 : 1;
    eyes.forEach((e) => (e.scale.y = k));
  });
}

// Fleck auf einer Ellipsoid-Oberfläche (radii, center), Richtung dir
export function spot(b, parent, m, radii, center, dir, size, flat = 0.22) {
  const d = v3(dir).normalize();
  const p = new THREE.Vector3(d.x * radii[0], d.y * radii[1], d.z * radii[2]).add(v3(center));
  const n = new THREE.Vector3(d.x / radii[0], d.y / radii[1], d.z / radii[2]).normalize();
  const s = typeof size === 'number' ? [size, size * 0.85, size * flat] : size;
  const mesh = b.ball(parent, m, [p.x, p.y, p.z], s);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
  mesh.rotateZ(b.rnd() * TAU);
  return mesh;
}
export function spots(b, parent, m, radii, center, count, size, minY = -0.2, flat) {
  for (let i = 0; i < count; i++) {
    let d;
    do d = new THREE.Vector3(b.rnd() * 2 - 1, b.rnd() * 2 - 1, b.rnd() * 2 - 1);
    while (d.lengthSq() > 1 || d.lengthSq() < 0.05 || d.normalize().y < minY);
    spot(b, parent, m, radii, center, d, size * (0.6 + b.rnd() * 0.7), flat);
  }
}

// Streifen als Bogen über den Rücken (Torus im xy, an Ellipsenquerschnitt angepasst)
export function band(b, parent, m, z, rx, ry, len2, arc = Math.PI * 0.8, thick = 0.035, y = 0) {
  const k = Math.sqrt(Math.max(0, 1 - (z / len2) ** 2)) * 1.01;
  const t = b.torus(parent, m, [0, y, z], 1, thick, [0, 0, Math.PI / 2 - arc / 2], arc);
  t.scale.set(rx * k, ry * k, 0.6);
  return t;
}

export function whiskers(b, head, pos, len = 0.28, color = '#f4f0ea') {
  const m = b.mat(color, { rough: 0.4 });
  for (const sx of [1, -1])
    for (let i = 0; i < 3; i++) {
      const a = [sx * pos[0], pos[1] - i * 0.025, pos[2]];
      b.limb(head, m, a, [a[0] + sx * len, a[1] + (1 - i) * 0.05, a[2] - 0.03], 0.005, 0.002, false);
    }
}

export function makeEars(b, head, type, H, S, earM, inner) {
  const ears = [];
  for (const sx of [1, -1]) {
    const e = b.group(head, [sx * H * 0.55, H * 0.62, -H * 0.1]);
    ears.push(e);
    switch (type) {
      case 'pointy':
        e.rotation.z = -sx * 0.32;
        b.cone(e, earM, [0, -H * 0.05, 0], H * 0.3 * S, H * 0.66 * S, null, [1, 1, 0.45]);
        b.cone(e, inner, [0, 0, H * 0.07], H * 0.19 * S, H * 0.48 * S, null, [1, 1, 0.3]);
        break;
      case 'floppy':
        e.position.set(sx * H * 0.78, H * 0.36, -H * 0.05);
        e.rotation.z = sx * 0.25;
        b.ball(e, earM, [0, -H * 0.4 * S, 0], [H * 0.17, H * 0.52 * S, H * 0.32 * S]);
        break;
      case 'round':
        e.position.set(sx * H * 0.62, H * 0.66, -H * 0.12);
        e.rotation.z = -sx * 0.4;
        b.ball(e, earM, [0, 0, 0], [H * 0.27 * S, H * 0.27 * S, H * 0.13]);
        b.ball(e, inner, [0, 0, H * 0.06], [H * 0.16 * S, H * 0.16 * S, H * 0.08]);
        break;
      case 'long':
        e.position.set(sx * H * 0.32, H * 0.72, -H * 0.15);
        e.rotation.set(-0.15, 0, -sx * 0.14);
        b.ball(e, earM, [0, H * 0.78 * S, 0], [H * 0.21, H * 0.82 * S, H * 0.1]);
        b.ball(e, inner, [0, H * 0.78 * S, H * 0.06], [H * 0.12, H * 0.66 * S, H * 0.06]);
        break;
      case 'leaf':
        e.position.set(sx * H * 0.62, H * 0.5, -H * 0.15);
        e.rotation.z = -sx * 0.85;
        b.ball(e, earM, [0, H * 0.42 * S, 0], [H * 0.24 * S, H * 0.46 * S, H * 0.08]);
        b.ball(e, inner, [0, H * 0.42 * S, H * 0.05], [H * 0.15 * S, H * 0.34 * S, H * 0.05]);
        break;
      case 'side':
        e.position.set(sx * H * 0.88, H * 0.3, -H * 0.12);
        e.rotation.z = -sx * 1.3;
        b.ball(e, earM, [0, H * 0.28 * S, 0], [H * 0.14, H * 0.32 * S, H * 0.08]);
        b.ball(e, inner, [0, H * 0.28 * S, H * 0.05], [H * 0.08, H * 0.22 * S, H * 0.05]);
        break;
    }
    e.userData.rx = e.rotation.x;
  }
  return ears;
}

// ── Vierbeiner ───────────────────────────────────────────────────────────────

export function quad(b, o) {
  const P = {
    len: 1.1, bodyR: 0.34, bodyW: 0.32, legH: 0.42, legR: 0.08, headR: 0.3, headUp: 0.18, headFwd: 0.1,
    snoutL: 0.2, snoutR: 0.13, ear: 'pointy', earS: 1, tail: 'thin', tailL: 0.7, tailR: 0.06,
    color: '#c8894a', nose: '#1d1416', iris: '#4a2c14', eyeS: 0.2, wag: 3, wagAmp: 0.35, ...o,
  };
  const fur = P.furMat ?? furMat(b, P.color, P.matOpts);
  const belly = P.belly ? P.bellyMat ?? furMat(b, P.belly, P.matOpts) : fur;
  const legM = P.legColor ? furMat(b, P.legColor, P.matOpts) : fur;
  const headM = P.headColor ? furMat(b, P.headColor, P.matOpts) : fur;
  const g = b.group(b.model);
  const bodyY = P.legH + P.bodyR * 0.7;
  const body = b.group(g, [0, bodyY, 0]);
  b.ball(body, fur, [0, 0, 0], [P.bodyW, P.bodyR, P.len / 2]);
  b.ball(body, fur, [0, P.bodyR * 0.1, P.len * 0.26], [P.bodyW * 1.06, P.bodyR * 1.04, P.len * 0.27]);
  b.ball(body, fur, [0, P.bodyR * 0.04, -P.len * 0.28], [P.bodyW * 1.02, P.bodyR, P.len * 0.26]);
  if (P.belly) {
    b.ball(body, belly, [0, -P.bodyR * 0.3, 0.02], [P.bodyW * 0.8, P.bodyR * 0.72, P.len * 0.42]);
    b.ball(body, belly, [0, -P.bodyR * 0.02, P.len * 0.42], [P.bodyW * 0.7, P.bodyR * 0.74, P.len * 0.13]);
  }
  // Schulterblätter und Rückenlinie
  for (const sx of [1, -1]) b.ball(body, fur, [sx * P.bodyW * 0.42, P.bodyR * 0.42, P.len * 0.3], [P.bodyW * 0.42, P.bodyR * 0.5, P.len * 0.17]);
  b.ball(body, fur, [0, P.bodyR * 0.62, -P.len * 0.06], [P.bodyW * 0.5, P.bodyR * 0.4, P.len * 0.36]);
  // Beine: Vorderbein mit Ellbogen, Hinterbein mit Knie und Sprunggelenk, Pfote mit Zehen
  const hipY = bodyY - P.bodyR * 0.35;
  const legs = [];
  const pawM = P.paw ? b.mat(P.paw, { rough: 0.6 }) : legM;
  const clawM = b.mat(P.claw ?? '#2a2224', { rough: 0.3, coat: 0.8 });
  for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    const leg = b.group(g, [sx * P.bodyW * 0.58, hipY, sz * P.len * 0.32]);
    const r = P.legR * (sz < 0 ? 1.1 : 1);
    const foot = -(hipY - r * 0.7), fz = sz < 0 ? -0.02 : 0.02;
    if (sz > 0) {
      b.ball(leg, fur, [0, P.bodyR * 0.12, 0.01], [r * 2.0, r * 2.7, r * 2.3]);
      const elbow = [0, foot * 0.42, -r * 0.35], wrist = [0, foot * 0.86, fz + r * 0.1];
      b.limb(leg, legM, [0, 0, 0], elbow, r * 1.45, r * 1.12);
      b.limb(leg, legM, elbow, wrist, r * 1.12, r * 0.88);
      b.limb(leg, legM, wrist, [0, foot, fz + r * 0.15], r * 0.88, r * 0.92);
    } else {
      b.ball(leg, fur, [0, P.bodyR * 0.16, -0.01], [r * 2.3, r * 3.0, r * 2.8]);
      const knee = [0, foot * 0.36, r * 0.95], hock = [0, foot * 0.7, -r * 0.9];
      b.limb(leg, legM, [0, 0, 0], knee, r * 1.7, r * 1.15);
      b.limb(leg, legM, knee, hock, r * 1.15, r * 0.78);
      b.limb(leg, legM, hock, [0, foot, fz], r * 0.78, r * 0.85);
    }
    if (P.hoof) {
      const hm = b.mat(P.hoof, { rough: 0.35, coat: 0.6 });
      b.cyl(leg, hm, [0, foot - r * 0.25, fz], r * 1.05, r * 1.28, r * 1.1);
      b.torus(leg, furMat(b, P.fetlock ?? (P.legColor ?? P.color), P.matOpts), [0, foot + r * 0.35, fz], r * 0.95, r * 0.35, [Math.PI / 2, 0, 0]);
    } else {
      const pz = fz + r * 0.45;
      b.ball(leg, pawM, [0, foot - r * 0.05, pz], [r * 1.3, r * 0.72, r * 1.5]);
      for (let k = 0; k < 4; k++) {
        const tx = (k - 1.5) * r * 0.62, tz = pz + r * (1.05 - Math.abs(k - 1.5) * 0.22);
        b.ball(leg, pawM, [tx, foot - r * 0.2, tz], [r * 0.38, r * 0.4, r * 0.42]);
        if (P.claws !== false) b.cone(leg, clawM, [tx, foot - r * 0.33, tz + r * 0.28], r * 0.1, r * 0.3, [Math.PI / 2 + 0.5, 0, 0]);
      }
    }
    legs.push(leg);
  }
  // Hals und Kopf
  const H = P.headR;
  const hy = bodyY + P.bodyR * 0.6 + P.headUp, hz = P.len * 0.5 + P.headFwd;
  const neck = { a: [0, bodyY + P.bodyR * 0.25, P.len * 0.33], c: [0, hy - H * 0.35, hz - H * 0.25], r0: P.bodyR * 0.62, r1: H * 0.62 };
  b.limb(g, fur, neck.a, neck.c, neck.r0, neck.r1, false);
  const head = b.group(g, [0, hy, hz]);
  const HW = P.headW ?? 1, HL = P.headL ?? 0.95;
  b.ball(head, headM, [0, 0, 0], [H * HW, H * 0.9, H * HL]);
  b.ball(head, P.cheek ? belly : headM, [0, -H * 0.3, H * 0.32], [H * 0.74 * HW, H * 0.55, H * 0.6]);
  const snZ = H * HL * 0.75 + P.snoutL * 0.35, snY = -H * 0.25;
  const muzzle = P.muzzle ? furMat(b, P.muzzle, P.matOpts) : P.belly && P.cheek ? belly : headM;
  b.ball(head, muzzle, [0, snY, snZ], [P.snoutR * 1.15, P.snoutR * 0.85, P.snoutL * 0.75]);
  const noseM = b.mat(P.nose, { rough: 0.3, coat: 0.8 });
  b.ball(head, noseM, [0, snY + P.snoutR * 0.45, snZ + P.snoutL * 0.68], [P.snoutR * 0.42, P.snoutR * 0.3, P.snoutR * 0.3]);
  const nostril = b.mat('#050405', { rough: 0.6 });
  for (const sx of [1, -1]) b.ball(head, nostril, [sx * P.snoutR * 0.17, snY + P.snoutR * 0.4, snZ + P.snoutL * 0.68 + P.snoutR * 0.25], [P.snoutR * 0.09, P.snoutR * 0.06, P.snoutR * 0.07], [0, 0, sx * 0.5]);
  b.limb(head, nostril, [0, snY + P.snoutR * 0.2, snZ + P.snoutL * 0.68 + P.snoutR * 0.24], [0, snY - P.snoutR * 0.25, snZ + P.snoutL * 0.6], P.snoutR * 0.025, P.snoutR * 0.02, false);
  // Brauenwulst und Wangen für mehr Ausdruck
  for (const sx of [1, -1]) {
    b.ball(head, headM, [sx * H * 0.38, H * 0.42, H * HL * 0.62], [H * 0.3, H * 0.13, H * 0.22], [0, 0, sx * 0.25]);
    b.ball(head, P.cheek ? belly : headM, [sx * H * 0.55 * HW, -H * 0.18, H * 0.25], [H * 0.36, H * 0.38, H * 0.42]);
  }
  b.ball(head, b.mat('#2a1618', { rough: 0.5 }), [0, snY - P.snoutR * 0.62, snZ + P.snoutL * 0.25], [P.snoutR * 0.55, P.snoutR * 0.08, P.snoutL * 0.42]);
  const ex = 0.42, ey = 0.2;
  const ez = H * HL * Math.sqrt(Math.max(0.05, 1 - (ex / HW) ** 2 - (ey / 0.9) ** 2)) - H * 0.07;
  const eyes = [1, -1].map((sx) =>
    b.eye(head, [sx * H * ex, H * ey, ez], H * P.eyeS, P.iris, [sx * 0.5, 0.12, 0.86], { slit: P.slit, glow: P.eyeGlow, lid: P.eyeGlow ? null : headM }),
  );
  const inner = b.mat(P.innerEar ?? '#e6a3a0', { rough: 0.7, sheen: 0.4 });
  const ears = P.ear === 'none' ? [] : makeEars(b, head, P.ear, H, P.earS, P.earColor ? furMat(b, P.earColor, P.matOpts) : headM, inner);
  // Schwanz
  const tail = b.group(g, [0, bodyY + P.bodyR * 0.3, -P.len * 0.5]);
  const L = P.tailL, R = P.tailR, tailM = P.tailMat ?? fur;
  switch (P.tail) {
    case 'thin':
      b.taper(tail, tailM, [[0, 0, 0], [0, L * 0.35, -L * 0.35], [0, L * 0.75, -L * 0.45], [0, L * 0.95, -L * 0.3]], R, R * 0.55);
      break;
    case 'bushy': {
      const pts = [[0, 0, 0], [0, -L * 0.15, -L * 0.35], [0, -L * 0.08, -L * 0.7], [0, L * 0.12, -L]];
      const mesh = b.taper(tail, tailM, pts, R * 0.5, R * 0.3, { profile: (t) => R * (0.45 + 1.2 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 0.85 + 0.08)), 0.7)) });
      if (P.tipColor) {
        const c = mesh.userData.curve, p = c.getPointAt(0.93), tan = c.getTangentAt(0.93);
        const tip = b.ball(tail, P.tipMat ?? furMat(b, P.tipColor, P.matOpts), [p.x, p.y, p.z], [R * 0.95, R * 0.95, R * 1.5]);
        tip.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tan);
      }
      break;
    }
    case 'curly': {
      const pts = [];
      for (let i = 0; i <= 24; i++) {
        const a = (i / 24) * TAU * 1.6;
        pts.push([Math.sin(a) * 0.07, Math.cos(a) * 0.07 - 0.02 + i * 0.004, -0.04 - i * 0.008]);
      }
      b.taper(tail, tailM, pts, R, R * 0.6, { seg: 60 });
      break;
    }
    case 'short':
      b.ball(tail, P.tailMat ?? (P.tipColor ? furMat(b, P.tipColor, P.matOpts) : fur), [0, 0, -R * 0.6], [R * 1.6, R * 1.5, R * 1.3]);
      break;
    case 'tuft': {
      const pts = [[0, 0, 0], [0, -L * 0.3, -L * 0.18], [0, -L * 0.7, -L * 0.2], [0, -L, -L * 0.12]];
      b.taper(tail, tailM, pts, R, R * 0.6);
      b.ball(tail, furMat(b, P.tuft ?? '#2a1a12', P.matOpts), [0, -L - R, -L * 0.12], [R * 1.8, R * 2.8, R * 1.8]);
      break;
    }
    case 'horse': {
      const hm = furMat(b, P.tuft ?? '#2a1a12', { surf: 'fur', ns: 0.9 });
      for (let i = 0; i < 7; i++) {
        const sx = (i - 3) * 0.018, w = (b.rnd() - 0.5) * 0.08;
        b.taper(tail, hm, [[sx, 0, 0], [sx * 1.5, -L * 0.25, -L * 0.3], [sx * 2 + w, -L * 0.65, -L * 0.38], [sx * 2.5 + w, -L, -L * 0.3]], R * 0.7, R * 0.15);
      }
      break;
    }
  }
  const ph = b.rnd() * 6;
  b.on((t) => {
    body.scale.y = 1 + Math.sin(t * 2.2 + ph) * 0.018;
    head.rotation.y = Math.sin(t * 0.6 + ph) * 0.18 + (P.headYaw ?? 0);
    head.rotation.x = Math.sin(t * 0.9 + ph) * 0.05 + (P.headPitch ?? 0);
    tail.rotation.y = Math.sin(t * P.wag + ph) * P.wagAmp;
    ears.forEach((e, i) => (e.rotation.x = e.userData.rx - Math.pow(Math.max(0, Math.sin(t * 0.8 + ph + i * 1.7)), 30) * 0.35));
  });
  blink(b, eyes);
  return { g, body, head, legs, tail, ears, eyes, fur, belly, headM, H, HL, bodyY, P, neck, hy, hz, snZ, snY };
}

// Halsband um den Hals eines Vierbeiners
export function collar(b, q, color, tagColor = null, at = 0.62, size = 1) {
  const a = v3(q.neck.a), c = v3(q.neck.c), d = c.clone().sub(a).normalize();
  const p = a.clone().lerp(c, at), R = q.neck.r0 + (q.neck.r1 - q.neck.r0) * at + 0.012;
  const ring = b.torus(q.g, b.mat(color, { rough: 0.4, coat: 0.6 }), [p.x, p.y, p.z], R, 0.035 * size);
  ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), d);
  const perp = new THREE.Vector3(0, -d.z, d.y).normalize();
  const tp = p.clone().addScaledVector(perp, R + 0.045 * size);
  let tag = null;
  if (tagColor) {
    tag = b.cyl(q.g, b.mat(tagColor, { metal: 1, rough: 0.25 }), [tp.x, tp.y, tp.z], 0.05 * size, 0.05 * size, 0.014, null, 24);
    tag.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), perp);
  }
  return { ring, tag, pos: tp, perp };
}

// Heiligenschein mit Leuchten
export function halo(b, parent, pos, R = 0.2) {
  const h = b.torus(parent, b.mat('#ffe08a', { glow: '#ffcf4d', ei: 1.8, metal: 1, rough: 0.2 }), pos, R, R * 0.12, [Math.PI / 2 - 0.2, 0, 0]);
  const gl = glowSprite('#ffe9a8', R * 3.5, 0.6);
  gl.position.set(...pos);
  parent.add(gl);
  const ph = b.rnd() * 6;
  b.on((t) => (h.position.y = gl.position.y = pos[1] + Math.sin(t * 2 + ph) * R * 0.15));
  h.userData.nofit = true;
  return h;
}

// Kleine Engelsflügel wie am Engels Egg (wingShape aus dem Münzkabinett)
export function angelWings(b, parent, pos, scale = 0.5, o = {}) {
  const geo = b.track(new THREE.ExtrudeGeometry(wingShape(), { depth: 0.04, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2, curveSegments: 18 }));
  geo.translate(0, -0.1, -0.04);
  const m = b.mat(o.color ?? '#ffffff', { glow: o.glow ?? '#fff3d0', ei: 0.3, rough: 0.35, coat: 1, irid: 0.5, double: true, surf: 'feather', ns: 0.35 });
  const wings = [1, -1].map((s) => {
    const pivot = b.group(parent, [s * pos[0], pos[1], pos[2]]);
    const w = new THREE.Mesh(geo, m);
    w.scale.set(s * scale, scale, scale);
    w.rotation.z = s * (o.tilt ?? 0.35);
    pivot.add(w);
    return [pivot, s];
  });
  const sp = o.speed ?? 3, ph = b.rnd() * 6;
  b.on((t) => wings.forEach(([p, s]) => (p.rotation.y = s * ((o.base ?? 0.9) + Math.sin(t * sp + ph) * 0.3))));
  return wings;
}

// Gefiederter Flügel: Vorderkante nach außen, Federn hängen nach unten/hinten
export function featherWing(b, parent, side, o) {
  const P = { len: 0.9, color: '#ffffff', rows: 3, n: 8, fl: 0.55, ...o };
  const w = b.group(parent, P.pos ?? [0, 0, 0]);
  const mo = { rough: 0.5, sheen: 0.6, sheenColor: lighten(P.color, 0.5), surf: 'feather', ns: 0.35, double: true, ...(P.mat ?? {}) };
  const mats = [P.tip ?? P.color, P.mid ?? P.color, P.color].map((c) => b.mat(c, mo));
  const edge = b.group(w);
  const end = [side * P.len, P.len * 0.38, -P.len * 0.08];
  b.limb(edge, mats[2], [0, 0, 0], end, P.len * 0.05, P.len * 0.025);
  for (let row = 0; row < P.rows; row++) {
    const n = P.n - row;
    for (let i = 0; i < n; i++) {
      const k = i / Math.max(1, n - 1);
      const at = [end[0] * (0.08 + 0.92 * k), end[1] * (0.08 + 0.92 * k) - row * 0.02, end[2] * k + row * 0.02];
      const L = P.len * P.fl * (0.55 + 0.6 * k) * (1 - row * 0.3);
      const f = b.group(edge, at, [0, 0, side * (0.08 + 1.25 * Math.pow(k, 1.3))]);
      b.ball(f, mats[Math.min(row, 2)], [0, -L / 2, -row * 0.01], [P.len * 0.065, L / 2, P.len * 0.018]);
    }
  }
  return w;
}

// Sternentextur für galaktische Tiere
export function galaxyTex(b, hueA = 250, hueB = 320, base = '#0b0820') {
  const r = b.rnd;
  const map = b.ctex(512, 512, (ctx, s) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, s, s);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 40; i++) {
      const x = r() * s, y = r() * s, rad = 40 + r() * 120, h = r() < 0.6 ? hueA + r() * 30 : hueB + r() * 30;
      for (const dx of [-s, 0, s])
        for (const dy of [-s, 0, s]) {
          const g = ctx.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, rad);
          g.addColorStop(0, `hsla(${h},90%,45%,0.35)`);
          g.addColorStop(1, `hsla(${h},90%,30%,0)`);
          ctx.fillStyle = g;
          ctx.fillRect(x + dx - rad, y + dy - rad, rad * 2, rad * 2);
        }
    }
  }, { wrap: true, repeat: [2, 2] });
  const stars = b.ctex(512, 512, (ctx, s) => {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 520; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.35 + r() * 0.65})`;
      const sz = r() < 0.06 ? 3 : 1.4;
      ctx.beginPath();
      ctx.arc(r() * s, r() * s, sz, 0, TAU);
      ctx.fill();
    }
  }, { wrap: true, repeat: [2, 2] });
  return { map, stars };
}

// ── Echse ────────────────────────────────────────────────────────────────────

export function lizard(b, o) {
  const P = { len: 1.0, bodyR: 0.17, bodyW: 0.21, headR: 0.17, snoutL: 0.16, tailL: 1.1, tailR: 0.11, color: '#3f9a3e', belly: null, iris: '#e0b020', legR: 0.05, ...o };
  const skin = P.skinMat ?? b.mat(P.color, { rough: 0.4, coat: 0.5, surf: 'scales', ns: 0.7 });
  const belly = P.belly ? b.mat(P.belly, { rough: 0.5, surf: 'scales', ns: 0.4 }) : skin;
  const g = b.group(b.model);
  const bodyY = P.bodyY ?? 0.26;
  const body = b.group(g, [0, bodyY, 0]);
  b.ball(body, skin, [0, 0, 0], [P.bodyW, P.bodyR, P.len / 2]);
  if (P.belly) b.ball(body, belly, [0, -P.bodyR * 0.3, 0], [P.bodyW * 0.85, P.bodyR * 0.75, P.len * 0.46]);
  // Kopf
  const H = P.headR;
  const head = b.group(g, [0, bodyY + 0.05, P.len / 2 + H * 0.7]);
  b.limb(g, skin, [0, bodyY, P.len * 0.38], [0, bodyY + 0.04, P.len / 2 + H * 0.3], P.bodyR * 0.85, H * 0.75, false);
  b.ball(head, skin, [0, 0, 0], [H * 0.95, H * 0.72, H * 1.05]);
  b.ball(head, skin, [0, -H * 0.12, H * 0.75 + P.snoutL * 0.3], [H * 0.68, H * 0.45, P.snoutL + H * 0.25]);
  if (P.belly) b.ball(head, belly, [0, -H * 0.35, H * 0.5], [H * 0.7, H * 0.32, H * 0.75]);
  const mouth = b.mat('#2a1418', { rough: 0.5 });
  for (const sx of [1, -1]) b.limb(head, mouth, [sx * H * 0.55, -H * 0.3, H * 0.15], [sx * H * 0.25, -H * 0.3, H * 0.95 + P.snoutL * 0.8], 0.008, 0.008, false);
  const eyes = [];
  for (const sx of [1, -1]) {
    if (P.turret) {
      const tur = b.group(head, [sx * H * 0.7, H * 0.32, H * 0.2]);
      b.ball(tur, skin, [0, 0, 0], H * 0.38);
      eyes.push(b.eye(tur, [sx * H * 0.12, 0, H * 0.12], H * 0.25, P.iris, [sx * 0.7, 0.1, 0.7], { glow: P.eyeGlow }));
      const ph = b.rnd() * 6;
      b.on((t) => (tur.rotation.y = Math.sin(t * 0.9 + ph + sx) * 0.5));
    } else {
      b.ball(head, skin, [sx * H * 0.6, H * 0.38, H * 0.25], H * 0.3);
      b.ball(head, skin, [sx * H * 0.62, H * 0.6, H * 0.3], [H * 0.3, H * 0.1, H * 0.24], [0, 0, -sx * 0.3]);
      eyes.push(b.eye(head, [sx * H * 0.66, H * 0.42, H * 0.32], H * 0.24, P.iris, [sx * 0.75, 0.25, 0.6], { slit: true, glow: P.eyeGlow, lid: P.eyeGlow ? null : skin }));
    }
  }
  // Beine, seitlich abgespreizt
  const legs = [];
  for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    const leg = b.group(g, [sx * P.bodyW * 0.75, bodyY - P.bodyR * 0.2, sz * P.len * 0.3]);
    const r = P.legR;
    const elbow = [sx * 0.17, 0.06, sz * 0.02], foot = [sx * 0.22, -(bodyY - P.bodyR * 0.2 - (P.ground ?? 0)) + r * 0.5, sz * 0.04 + 0.05];
    b.limb(leg, skin, [0, 0, 0], elbow, r * 1.4, r);
    b.limb(leg, skin, elbow, foot, r, r * 0.8);
    for (let k = -1.5; k <= 1.5; k++) {
      const a = k * 0.4;
      b.limb(leg, skin, foot, [foot[0] + Math.sin(a) * 0.09, foot[1] - r * 0.3, foot[2] + Math.cos(a) * 0.09], r * 0.45, r * 0.25);
    }
    legs.push(leg);
  }
  // Schwanz
  const tail = b.group(g, [0, bodyY, -P.len * 0.45]);
  const L = P.tailL;
  let pts;
  if (P.curl) {
    const R0 = 0.2 * (P.curlS ?? 1), cy = -0.02 - R0, cz = -L * 0.3;
    pts = [[0, 0, 0], [0, -0.01, -L * 0.15]];
    for (let i = 1; i <= 18; i++) {
      const a = (i / 18) * TAU * 1.25, r = R0 * (1 - i / 24);
      pts.push([0, cy + Math.cos(a) * r, cz - Math.sin(a) * r]);
    }
  } else pts = [[0, 0, 0], [0, -bodyY * 0.55, -L * 0.3], [0.12, -bodyY * 0.85, -L * 0.65], [-0.05, -bodyY * 0.9, -L]];
  const tailMesh = b.taper(tail, skin, pts, P.tailR, 0.012, { seg: 72 });
  // Rückenhöcker als Schuppenkamm
  if (P.ridge !== false) {
    const rm = P.ridgeMat ?? b.mat(darken(P.color, 0.35), { rough: 0.35, coat: 0.6 });
    for (let i = 0; i < 9; i++) {
      const z = P.len * (0.38 - i * 0.09), k = Math.sqrt(Math.max(0, 1 - (z / (P.len / 2)) ** 2));
      b.cone(body, rm, [0, P.bodyR * k * 0.92, z], P.bodyR * 0.12, P.bodyR * (0.22 + 0.1 * Math.sin(i)), [-0.3, 0, 0], null, 6);
    }
  }
  const ph = b.rnd() * 6;
  b.on((t) => {
    body.scale.y = 1 + Math.sin(t * 2 + ph) * 0.02;
    head.rotation.y = Math.sin(t * 0.7 + ph) * 0.22;
    head.rotation.x = Math.sin(t * 1.1 + ph) * 0.04;
    tail.rotation.y = Math.sin(t * 1.3 + ph) * 0.15;
  });
  blink(b, eyes);
  return { g, body, head, legs, tail, tailMesh, skin, belly, H, bodyY, P, eyes };
}
