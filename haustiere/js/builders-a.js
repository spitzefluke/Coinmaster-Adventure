// Haustiere aus Normal Egg, Wald Egg und Eis Egg
import { THREE, TAU, glowSprite, v3, lighten } from './kit.js';
import { quad, lizard, furMat, collar, band, whiskers, spots, spot, swarm, blink, makeEars } from './templates.js';

const gold = (b, o = {}) => b.mat('#f2c14e', { metal: 1, rough: 0.22, ...o });

function leafShape(len = 0.3, w = 0.1) {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.quadraticCurveTo(w * 1.6, len * 0.5, 0, len);
  s.quadraticCurveTo(-w * 1.6, len * 0.5, 0, 0);
  return s;
}

// Verzweigter Ast (Geweih, Zweige); ruft leaf(p, dir) an den Enden
function branch(b, parent, m, from, dir, len, r, depth, leaf) {
  const A = v3(from), d = v3(dir).normalize();
  const B = A.clone().addScaledVector(d, len);
  const mid = A.clone().lerp(B, 0.5).add(new THREE.Vector3((b.rnd() - 0.5) * len * 0.15, 0, (b.rnd() - 0.5) * len * 0.15));
  b.taper(parent, m, [A, mid, B], r, r * 0.65, { seg: 10, radial: 8 });
  if (depth <= 0) return leaf && leaf(B, d);
  for (let k = 0; k < 2; k++) {
    const nd = d.clone().add(new THREE.Vector3((b.rnd() - 0.5) * 1.1, 0.35 + b.rnd() * 0.3, (b.rnd() - 0.5) * 0.8)).normalize();
    branch(b, parent, m, B, nd, len * 0.68, r * 0.65, depth - 1, leaf);
  }
}

export const BUILDERS = {
  // ── Normal Egg ──
  hund(b) {
    const q = quad(b, { color: '#c98a4b', belly: '#f3dcb4', cheek: true, ear: 'floppy', earS: 1.05, earColor: '#9c602e', tail: 'thin', tailL: 0.5, tailR: 0.065, snoutL: 0.26, snoutR: 0.14, headR: 0.31, wag: 9, wagAmp: 0.45, iris: '#5a3412' });
    collar(b, q, '#d23a3a', '#f2c14e');
    b.ball(q.head, b.mat('#e66a7a', { rough: 0.4, coat: 0.6 }), [0, q.snY - q.P.snoutR * 0.8, q.snZ + q.P.snoutL * 0.35], [0.05, 0.014, 0.075], [0.5, 0, 0]);
  },

  katze(b) {
    const q = quad(b, { color: '#a3a3ad', belly: '#eeebe4', cheek: true, len: 1.0, bodyR: 0.27, bodyW: 0.25, legH: 0.4, legR: 0.062, headR: 0.28, headW: 1.05, snoutL: 0.1, snoutR: 0.11, ear: 'pointy', earS: 1.15, innerEar: '#f0b2b2', tail: 'thin', tailL: 0.85, tailR: 0.05, iris: '#86d23a', slit: true, nose: '#e48f98', wag: 1.3, wagAmp: 0.25, eyeS: 0.22 });
    const st = furMat(b, '#5a5a66');
    for (const z of [-0.38, -0.24, -0.1, 0.04, 0.18, 0.31]) band(b, q.body, st, z, q.P.bodyW * 1.05, q.P.bodyR * 1.04, 0.54, Math.PI * 0.7, 0.03);
    for (const x of [-0.06, 0, 0.06]) spot(b, q.head, st, [q.H * 1.05, q.H * 0.9, q.H * 0.95], [0, 0, 0], [x, 0.8, 0.45], [0.018, 0.07, 0.01]);
    whiskers(b, q.head, [0.07, q.snY, q.snZ + 0.05], 0.26);
  },

  kueken(b) {
    const g = b.group(b.model);
    const y = furMat(b, '#ffd23f', { sheen: 1, sheenColor: '#fff2a0' });
    const shell = b.mat('#fbf4e4', { rough: 0.5, coat: 0.4, double: true, surf: 'short', ns: 0.3 });
    const orange = b.mat('#ff9a1f', { rough: 0.4, coat: 0.5 });
    const lower = b.track(new THREE.SphereGeometry(0.46, 40, 20, 0, TAU, Math.PI * 0.48, Math.PI * 0.52));
    lower.scale(1, 1.25, 1);
    b.place(new THREE.Mesh(lower, shell), g, [0, 0.58, 0]);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * TAU;
      b.cone(g, shell, [Math.cos(a) * 0.452, 0.6, Math.sin(a) * 0.452], 0.065, 0.08 + (i % 3) * 0.03, [0, Math.PI / 2 - a, 0], [1, 1, 0.2], 4);
    }
    b.ball(g, y, [0, 0.66, 0], [0.4, 0.38, 0.4]);
    const head = b.group(g, [0, 1.04, 0.06]);
    b.ball(head, y, [0, 0, 0], 0.29);
    for (const [x, r] of [[-0.05, -0.4], [0, 0], [0.05, 0.4]]) b.ball(head, y, [x, 0.3, -0.02], [0.03, 0.09, 0.03], [0, 0, r]);
    b.cone(head, orange, [0, -0.04, 0.26], 0.07, 0.15, [Math.PI / 2, 0, 0], [1, 0.7, 1]);
    b.cone(head, b.mat('#f07a10', { rough: 0.4 }), [0, -0.08, 0.24], 0.05, 0.09, [Math.PI / 2 + 0.3, 0, 0], [1, 0.6, 1]);
    const eyes = [1, -1].map((sx) => b.eye(head, [sx * 0.12, 0.05, 0.23], 0.065, '#2a1a10', [sx * 0.4, 0.1, 0.9]));
    for (const sx of [1, -1]) b.ball(head, b.mat('#ff9aa8', { rough: 0.7 }), [sx * 0.19, -0.05, 0.19], [0.05, 0.03, 0.02], [0, sx * 0.7, 0]);
    const cap = b.track(new THREE.SphereGeometry(0.31, 32, 12, 0, TAU, 0, Math.PI * 0.32));
    cap.scale(1, 1.2, 1);
    b.place(new THREE.Mesh(cap, shell), head, [0.03, 0.04, -0.01], null, [0.1, 0, -0.3]);
    const wings = [1, -1].map((sx) => {
      const w = b.group(g, [sx * 0.37, 0.76, -0.02]);
      b.ball(w, y, [0, -0.1, 0], [0.07, 0.17, 0.2]);
      return [w, sx];
    });
    blink(b, eyes);
    b.on((t) => {
      head.rotation.z = Math.sin(t * 1.4) * 0.1;
      head.rotation.x = Math.sin(t * 2.1) * 0.06;
      wings.forEach(([w, s]) => (w.rotation.z = s * (0.2 + Math.max(0, Math.sin(t * 9)) * 0.5 * (Math.sin(t * 0.7) > 0.4 ? 1 : 0))));
    });
  },

  pferd(b) {
    const q = quad(b, { color: '#7b4a2b', len: 1.25, bodyR: 0.33, bodyW: 0.29, legH: 0.78, legR: 0.07, headR: 0.23, headL: 1.15, headW: 0.9, headUp: 0.45, headFwd: 0.1, headPitch: 0.3, snoutL: 0.36, snoutR: 0.15, muzzle: '#4e2e1c', ear: 'pointy', earS: 0.75, tail: 'horse', tailL: 0.85, tailR: 0.05, tuft: '#25160f', hoof: '#2a2422', iris: '#2a1a10', nose: '#2a1a14', wag: 1.2, wagAmp: 0.15 });
    const mane = furMat(b, '#25160f', { ns: 0.9 });
    const a = v3(q.neck.a), c = v3(q.neck.c);
    for (let i = 0; i <= 10; i++) {
      const k = i / 10, p = a.clone().lerp(c, k), r = q.neck.r0 + (q.neck.r1 - q.neck.r0) * k;
      b.ball(q.g, mane, [0, p.y + r * 0.82, p.z - r * 0.35], [0.05, 0.11, 0.09], [-0.5, 0, 0]);
    }
    const H = q.H;
    b.ball(q.head, mane, [0, H * 0.8, H * 0.35], [0.05, 0.07, 0.11], [0.4, 0, 0]);
    b.ball(q.head, furMat(b, '#f4efe6'), [0, H * 0.15, H * 0.92], [H * 0.16, H * 0.5, H * 0.22], [0.25, 0, 0]);
  },

  kuh(b) {
    const q = quad(b, { color: '#f5f2ea', len: 1.3, bodyR: 0.4, bodyW: 0.36, legH: 0.48, legR: 0.09, headR: 0.28, headUp: 0.04, headFwd: 0.14, snoutL: 0.22, snoutR: 0.2, muzzle: '#f0a3a6', nose: '#c8707c', ear: 'side', earS: 1.1, innerEar: '#f0a3a6', tail: 'tuft', tailL: 0.75, tailR: 0.035, tuft: '#1d1a1a', hoof: '#3a302a', iris: '#1a1412', matOpts: { surf: 'short', ns: 0.4, sheen: 0.4 } });
    const blk = furMat(b, '#1e1b1c', { surf: 'short', ns: 0.4, sheen: 0.4 });
    const { bodyW, bodyR, len } = q.P;
    spots(b, q.body, blk, [bodyW * 1.06, bodyR * 1.05, len * 0.53], [0, 0, 0], 10, 0.17, -0.2, 0.18);
    spot(b, q.head, blk, [q.H * 1.0, q.H * 0.9, q.H * 0.95], [0, 0, 0], [0.55, 0.55, 0.4], 0.12);
    const cream = b.mat('#efe3c4', { rough: 0.35, coat: 0.5 });
    for (const sx of [1, -1]) b.cone(q.head, cream, [sx * q.H * 0.45, q.H * 0.7, -q.H * 0.12], 0.045, 0.17, [0, 0, -sx * 0.95]);
    const pink = b.mat('#f0a3a6', { rough: 0.6, sheen: 0.4 });
    b.ball(q.body, pink, [0, -bodyR * 0.85, -len * 0.2], [0.15, 0.1, 0.14]);
    for (const [x, z] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) b.ball(q.body, pink, [x * 0.06, -bodyR * 1.1, -len * 0.2 + z * 0.06], [0.022, 0.05, 0.022]);
    const cl = collar(b, q, '#7a4a24', null, 0.42, 1.25);
    const g = gold(b);
    b.cone(q.g, g, [cl.pos.x, cl.pos.y - 0.13, cl.pos.z + 0.02], 0.075, 0.13, null, null, 28);
    b.ball(q.g, g, [cl.pos.x, cl.pos.y - 0.15, cl.pos.z + 0.02], 0.025);
  },

  frettchen(b) {
    const dark = furMat(b, '#4a3426');
    const q = quad(b, { color: '#f0e3c8', len: 1.35, bodyR: 0.22, bodyW: 0.21, legH: 0.24, legR: 0.055, legColor: '#4a3426', headR: 0.2, headL: 1.1, headUp: 0.14, headFwd: 0.05, snoutL: 0.14, snoutR: 0.09, ear: 'round', earS: 0.95, tail: 'bushy', tailL: 0.55, tailR: 0.075, tailMat: dark, iris: '#1a1010', nose: '#e89a9a', innerEar: '#e8b8a8' });
    const H = q.H, { bodyW, bodyR, len } = q.P;
    for (const sx of [1, -1]) spot(b, q.head, furMat(b, '#6a4c38'), [H, H * 0.9, H * 1.1], [0, 0, 0], [sx * 0.45, 0.25, 0.8], [H * 0.34, H * 0.22, H * 0.08]);
    // Königsmantel mit Hermelinbesatz
    const capeM = b.mat('#b3122e', { rough: 0.6, sheen: 1, sheenColor: '#ff7a8a', double: true, surf: 'short', ns: 0.3 });
    const th = Math.PI * 0.56;
    const cg = b.track(new THREE.SphereGeometry(1, 40, 20, 0, TAU, 0, th));
    const cape = b.place(new THREE.Mesh(cg, capeM), q.body, [0, bodyR * 0.05, -len * 0.08], [bodyW * 1.22, bodyR * 1.25, len * 0.42]);
    const ermine = furMat(b, '#fbfaf6');
    const ty = bodyR * 0.05 + Math.cos(th) * bodyR * 1.25;
    const trim = b.torus(q.body, ermine, [0, ty, -len * 0.08], 1, 0.16, [Math.PI / 2, 0, 0]);
    trim.scale.set(Math.sin(th) * bodyW * 1.22, Math.sin(th) * len * 0.42, 0.35);
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * TAU;
      b.ball(q.body, b.mat('#141012', { rough: 0.5 }), [Math.cos(a) * Math.sin(th) * bodyW * 1.22 * 1.12, ty, -len * 0.08 + Math.sin(a) * Math.sin(th) * len * 0.42 * 1.04], [0.012, 0.02, 0.012]);
    }
    for (let i = 0; i < 9; i++) b.ball(q.body, ermine, [0, bodyR * 1.3 - 0.02, -len * 0.28 + i * 0.05], [0.045, 0.025, 0.03]);
    b.ball(q.body, b.mat('#141012'), [0, bodyR * 1.33, -len * 0.08], [0.015, 0.02, 0.025]);
    // Krone
    const gd = gold(b, { double: true });
    const crown = b.group(q.head, [0, H * 0.82, -H * 0.05], [-0.15, 0, 0.14]);
    b.ball(crown, b.mat('#8a0f24', { rough: 0.6, sheen: 1, sheenColor: '#ff7a8a' }), [0, 0.04, 0], [H * 0.36, H * 0.3, H * 0.36]);
    b.cyl(crown, gd, [0, 0.03, 0], H * 0.44, H * 0.4, 0.07, null, 40, true);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      b.cone(crown, gd, [Math.cos(a) * H * 0.43, 0.06, Math.sin(a) * H * 0.43], 0.025, 0.07, null, [1, 1, 0.5], 4).rotation.y = -a;
      b.ball(crown, b.mat('#fff4d0', { metal: 0.3, rough: 0.1, coat: 1 }), [Math.cos(a) * H * 0.43, 0.135, Math.sin(a) * H * 0.43], 0.012);
      b.octa(crown, b.mat(i % 2 ? '#e0243a' : '#2f6bff', { rough: 0.05, coat: 1, flat: true, glow: i % 2 ? '#801020' : '#102a80', ei: 0.6 }), [Math.cos(a) * H * 0.445, 0.03, Math.sin(a) * H * 0.445], 0.018);
    }
    b.ball(crown, gd, [0, 0.13, 0], 0.025);
    // Medaillon
    const cl = collar(b, q, '#f2c14e', '#f2c14e', 0.5, 1.1);
    b.octa(q.g, b.mat('#e0243a', { rough: 0.05, coat: 1, flat: true, glow: '#ff2040', ei: 0.8 }), [cl.pos.x, cl.pos.y, cl.pos.z + 0.012], 0.03);
  },

  otter(b) {
    const g = b.group(b.model);
    const fur = furMat(b, '#74502f'), cream = furMat(b, '#e8d2ae'), dark = furMat(b, '#4a3220');
    const body = b.group(g);
    b.ball(body, fur, [0, 0.64, 0], [0.32, 0.5, 0.28]);
    b.ball(body, cream, [0, 0.7, 0.1], [0.24, 0.42, 0.2]);
    b.ball(body, fur, [0, 0.3, -0.02], [0.34, 0.3, 0.3]);
    for (const sx of [1, -1]) {
      b.ball(g, fur, [sx * 0.2, 0.2, 0.05], [0.12, 0.16, 0.15]);
      b.ball(g, dark, [sx * 0.18, 0.05, 0.16], [0.11, 0.055, 0.18]);
    }
    const tail = b.group(g);
    b.taper(tail, fur, [[0, 0.25, -0.22], [0, 0.1, -0.45], [0.05, 0.05, -0.8]], 0.11, 0.035);
    const head = b.group(g, [0, 1.22, 0.05]);
    b.ball(head, fur, [0, 0, 0], [0.26, 0.23, 0.25]);
    b.ball(head, cream, [0, -0.08, 0.16], [0.18, 0.12, 0.14]);
    b.ball(head, b.mat('#1e1410', { rough: 0.3, coat: 0.8 }), [0, -0.03, 0.29], [0.05, 0.035, 0.03]);
    const eyes = [1, -1].map((sx) => b.eye(head, [sx * 0.11, 0.05, 0.2], 0.05, '#1a0e08', [sx * 0.45, 0.1, 0.88]));
    makeEars(b, head, 'round', 0.26, 0.6, fur, dark);
    whiskers(b, head, [0.06, -0.07, 0.25], 0.2);
    blink(b, eyes);
    const gd = gold(b);
    // Dreizack (rechts) und Perle (links)
    const tri = b.group(g, [0.42, 0, 0.24]);
    b.cyl(tri, gd, [0, 0.95, 0], 0.022, 0.022, 1.8, null, 16);
    b.cyl(tri, gd, [0, 1.82, 0], 0.15, 0.15, 0.03, [0, 0, Math.PI / 2], 16).scale.set(1, 1, 0.3);
    for (const x of [-0.13, 0, 0.13]) {
      b.limb(tri, gd, [x * 0.6, 1.82, 0], [x, 1.98, 0], 0.016, 0.016);
      b.cone(tri, gd, [x, 1.98, 0], 0.03, x ? 0.11 : 0.15, null, [1, 1, 0.5], 4);
    }
    b.ball(tri, b.mat('#7fe8ff', { glow: '#3fd0ff', ei: 1.5, rough: 0.1 }), [0, 1.88, 0.02], 0.035);
    for (const [sx, hand] of [[1, [0.4, 0.82, 0.22]], [-1, [-0.12, 0.8, 0.3]]]) {
      b.limb(g, fur, [sx * 0.24, 0.95, 0.04], hand, 0.075, 0.06);
      b.ball(g, dark, hand, [0.06, 0.055, 0.06]);
      b.torus(g, gd, [sx * 0.3, 0.88, 0.12], 0.07, 0.016, [Math.PI / 2, 0, sx * 0.6]);
    }
    const pearl = b.ball(g, b.mat('#fff6fb', { rough: 0.08, coat: 1, irid: 1, glow: '#bfe9ff', ei: 0.5 }), [-0.08, 0.9, 0.38], 0.085);
    const pg = glowSprite('#9fe8ff', 0.6, 0.7);
    pg.position.copy(pearl.position);
    g.add(pg);
    // Perlen-Diadem
    b.torus(head, gd, [0, 0.13, -0.02], 0.2, 0.014, [Math.PI / 2 - 0.25, 0, 0]);
    for (const x of [-0.1, 0, 0.1]) b.ball(head, b.mat('#ffffff', { rough: 0.1, coat: 1, irid: 1 }), [x, 0.2 - Math.abs(x) * 0.5, 0.15], 0.025);
    // Wasserringe
    const water = b.mat('#7fdcff', { rough: 0.05, coat: 1, glow: '#2fb6ff', ei: 0.5, opacity: 0.55, depthWrite: false });
    const rings = [[0.55, 0.3, 0.25], [0.62, 0.75, -0.35]].map(([R, y, tilt]) => {
      const r = b.torus(g, water, [0, y, 0], R, 0.025, [Math.PI / 2 + tilt, 0, 0]);
      r.userData.nofit = true;
      return r;
    });
    swarm(b, g, 26, '#9fe8ff', 0.07, (s, t, o) => {
      const a = s[0] * TAU + t * (0.6 + s[1] * 0.6), r = 0.6 + s[2] * 0.15;
      o[0] = Math.cos(a) * r;
      o[1] = 0.2 + s[3] * 0.9 + Math.sin(t * 2 + s[0] * 9) * 0.06;
      o[2] = Math.sin(a) * r;
      o[3] = 0.4 + 0.6 * Math.abs(Math.sin(t * 2 + s[1] * 7));
    });
    b.on((t) => {
      rings[0].rotation.z = t * 0.8;
      rings[1].rotation.z = -t * 0.6;
      head.rotation.y = Math.sin(t * 0.6) * 0.2;
      tail.rotation.y = Math.sin(t * 1.4) * 0.2;
      pearl.position.y = pg.position.y = 0.9 + Math.sin(t * 2) * 0.03;
      body.scale.y = 1 + Math.sin(t * 2) * 0.012;
    });
  },

  // ── Wald Egg ──
  fuchs(b) {
    quad(b, { color: '#e0702b', belly: '#fbf3e6', cheek: true, len: 1.05, bodyR: 0.27, bodyW: 0.25, legH: 0.4, legR: 0.058, legColor: '#2c1d16', headR: 0.26, headW: 1.05, snoutL: 0.3, snoutR: 0.1, ear: 'pointy', earS: 1.4, earColor: '#d0601f', innerEar: '#fbf3e6', tail: 'bushy', tailL: 0.85, tailR: 0.13, tipColor: '#fbf3e6', iris: '#c87a12', nose: '#1a1214', wag: 2, wagAmp: 0.3 });
  },

  reh(b) {
    const q = quad(b, { color: '#a8693a', belly: '#f1e4d0', len: 1.05, bodyR: 0.27, bodyW: 0.24, legH: 0.72, legR: 0.048, headR: 0.21, headL: 1.1, headUp: 0.4, headFwd: 0.06, snoutL: 0.2, snoutR: 0.1, muzzle: '#c9a07a', ear: 'leaf', earS: 1.25, innerEar: '#f1e4d0', tail: 'short', tailR: 0.07, tipColor: '#ffffff', hoof: '#2a2018', iris: '#1a120c', nose: '#1a1416', eyeS: 0.22 });
    const { bodyW, bodyR, len } = q.P;
    spots(b, q.body, furMat(b, '#fbf6ee'), [bodyW * 1.04, bodyR * 1.04, len * 0.53], [0, 0, 0], 18, 0.045, 0.35, 0.3);
    const ant = b.mat('#c9b48e', { rough: 0.6, surf: 'stone', ns: 0.4 });
    const H = q.H;
    for (const sx of [1, -1]) {
      b.taper(q.head, ant, [[sx * H * 0.28, H * 0.7, -H * 0.1], [sx * H * 0.38, H * 1.3, -H * 0.22], [sx * H * 0.32, H * 1.8, -H * 0.08]], 0.025, 0.01);
      b.taper(q.head, ant, [[sx * H * 0.36, H * 1.15, -H * 0.2], [sx * H * 0.42, H * 1.35, H * 0.1]], 0.016, 0.008);
    }
  },

  frosch(b) {
    const g = b.group(b.model);
    const skin = b.mat('#5dbb46', { rough: 0.3, coat: 0.8, surf: 'short', ns: 0.35 });
    const belly = b.mat('#e9f2b6', { rough: 0.5, surf: 'short', ns: 0.3 });
    const dark = b.mat('#2f7a2c', { rough: 0.35, coat: 0.6 });
    const pad = b.mat('#3c8a34', { rough: 0.55, coat: 0.3, double: true, surf: 'short', ns: 0.3 });
    b.place(new THREE.Mesh(b.track(new THREE.CylinderGeometry(0.85, 0.85, 0.035, 48, 1, false, 0.25, TAU - 0.5)), pad), g, [0, 0.018, 0], null, [0, Math.PI, 0]);
    const vein = b.mat('#2e6e28', { rough: 0.6 });
    for (let i = 0; i < 9; i++) {
      const a = Math.PI + 0.45 + (i / 8) * (TAU - 0.9);
      b.limb(g, vein, [0, 0.037, 0], [Math.sin(a) * 0.8, 0.037, Math.cos(a) * 0.8], 0.008, 0.004, false);
    }
    const petal = b.mat('#ff9ec4', { rough: 0.5, sheen: 0.6, double: true });
    const fl = b.group(g, [0.55, 0.05, -0.38]);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU;
      b.ball(fl, petal, [Math.cos(a) * 0.08, 0.03, Math.sin(a) * 0.08], [0.05, 0.022, 0.1], [0.4, -a + Math.PI / 2, 0]);
    }
    b.ball(fl, b.mat('#ffd23f', { rough: 0.6 }), [0, 0.05, 0], 0.035);
    const fr = b.group(g, [0, 0.035, 0.05]);
    const bodyG = b.group(fr, [0, 0.3, -0.05], [-0.3, 0, 0]);
    b.ball(bodyG, skin, [0, 0, 0], [0.4, 0.28, 0.38]);
    spots(b, bodyG, dark, [0.4, 0.28, 0.38], [0, 0, 0], 9, 0.07, 0.25);
    b.ball(fr, belly, [0, 0.24, 0.1], [0.32, 0.2, 0.28], [-0.3, 0, 0]);
    b.ball(fr, skin, [0, 0.46, 0.2], [0.36, 0.2, 0.3]);
    b.ball(fr, belly, [0, 0.39, 0.25], [0.3, 0.12, 0.24]);
    const mouth = [];
    for (let i = 0; i <= 12; i++) {
      const a = -1 + (i / 12) * 2;
      mouth.push([Math.sin(a) * 0.36, 0.43, 0.2 + Math.cos(a) * 0.3]);
    }
    b.taper(fr, b.mat('#1f4a1c', { rough: 0.5 }), mouth, 0.011, 0.011, { seg: 30, radial: 6 });
    for (const sx of [1, -1]) b.ball(fr, dark, [sx * 0.05, 0.55, 0.47], 0.012);
    const eyes = [1, -1].map((sx) => {
      b.ball(fr, skin, [sx * 0.19, 0.6, 0.22], 0.125);
      return b.eye(fr, [sx * 0.2, 0.63, 0.27], 0.1, '#e8b52a', [sx * 0.45, 0.35, 0.82], { wide: true });
    });
    blink(b, eyes);
    for (const sx of [1, -1]) {
      const hand = [sx * 0.3, 0.05, 0.38];
      b.limb(fr, skin, [sx * 0.24, 0.3, 0.24], hand, 0.06, 0.045);
      for (const a of [-0.5, 0, 0.5]) {
        const tip = [hand[0] + Math.sin(a + sx * 0.3) * 0.1, 0.01, hand[2] + Math.cos(a + sx * 0.3) * 0.1];
        b.limb(fr, skin, hand, tip, 0.018, 0.014);
        b.ball(fr, belly, tip, 0.024);
      }
      b.ball(fr, skin, [sx * 0.36, 0.2, -0.12], [0.14, 0.13, 0.26], [0, sx * 0.3, 0]);
      b.ball(fr, skin, [sx * 0.47, 0.04, 0.05], [0.09, 0.035, 0.24], [0, -sx * 0.4, 0]);
    }
    const throat = b.ball(fr, belly, [0, 0.31, 0.37], [0.13, 0.1, 0.08]);
    b.on((t) => {
      const k = 1 + Math.pow(Math.max(0, Math.sin(t * 2.5)), 2) * 0.8;
      throat.scale.set(0.13 * k, 0.1 * k, 0.08 * k);
      fr.rotation.y = Math.sin(t * 0.5) * 0.12;
    });
  },

  dachs(b) {
    const q = quad(b, { color: '#8b8885', belly: '#2e2a28', headColor: '#f4f1ea', len: 1.15, bodyR: 0.29, bodyW: 0.33, legH: 0.2, legR: 0.075, legColor: '#2a2624', headR: 0.24, headL: 1.2, headUp: 0.02, headFwd: 0.08, headPitch: 0.12, snoutL: 0.3, snoutR: 0.1, ear: 'round', earS: 0.75, earColor: '#2a2624', innerEar: '#f2efe8', tail: 'short', tailR: 0.08, iris: '#140e0c', nose: '#141012', eyeS: 0.22 });
    const black = furMat(b, '#1e1b1a'), H = q.H, R = [H * 1.0, H * 0.9, H * q.HL];
    for (const sx of [1, -1])
      for (let i = 0; i < 7; i++) {
        const k = i / 6;
        spot(b, q.head, black, R, [0, 0, 0], [sx * 0.42, 0.18 + k * 0.55, 0.92 - k * 1.25], [H * 0.2, H * 0.2, H * 0.06]);
      }
    const claw = b.mat('#f2ece0', { rough: 0.3, coat: 0.6 });
    q.legs.slice(0, 2).forEach((leg) => {
      const fy = -(q.bodyY - q.P.bodyR * 0.35 - q.P.legR * 0.7);
      for (const x of [-0.03, 0, 0.03]) b.cone(leg, claw, [x, fy - 0.04, q.P.legR * 1.4], 0.012, 0.06, [Math.PI / 2 + 0.3, 0, 0]);
    });
  },

  schlange(b) {
    const g = b.group(b.model);
    const tex = b.ctex(1024, 64, (ctx, w, h) => {
      ctx.fillStyle = '#3f9a3e';
      ctx.fillRect(0, 0, w, h);
      for (let x = 0; x < w + 40; x += 34)
        for (const v of [0.25, 0.75]) {
          const cx = x + (v > 0.5 ? 17 : 0), cy = v * h;
          for (const [s, col] of [[1, '#1d5221'], [0.5, '#9bd45a']]) {
            ctx.fillStyle = col;
            ctx.beginPath();
            ctx.moveTo(cx - 15 * s, cy);
            ctx.lineTo(cx, cy - 12 * s);
            ctx.lineTo(cx + 15 * s, cy);
            ctx.lineTo(cx, cy + 12 * s);
            ctx.fill();
          }
        }
    });
    const skin = b.mat('#ffffff', { map: tex, rough: 0.35, coat: 0.7, surf: 'scales', ns: 0.8, nrep: [60, 3] });
    const headM = b.mat('#3f9a3e', { rough: 0.35, coat: 0.7, surf: 'scales', ns: 0.6 });
    const pts = [];
    const N = 44;
    for (let i = 0; i <= N; i++) {
      const k = i / N, a = k * TAU * 2.2, r = 0.62 - k * 0.3;
      pts.push([Math.cos(a) * r, 0.13 + k * 0.34, Math.sin(a) * r]);
    }
    pts.push([0.06, 0.72, 0.28], [0, 0.98, 0.32], [0, 1.1, 0.42]);
    b.taper(g, skin, pts, 0.1, 0.1, { seg: 220, profile: (t) => (t < 0.12 ? 0.015 + 0.125 * (t / 0.12) : 0.14 - 0.045 * ((t - 0.12) / 0.88)) });
    const head = b.group(g, [0, 1.12, 0.46]);
    b.ball(head, headM, [0, 0, 0.02], [0.13, 0.075, 0.18]);
    b.ball(head, b.mat('#d9d36a', { rough: 0.5 }), [0, -0.035, 0.03], [0.11, 0.045, 0.16]);
    const eyes = [1, -1].map((sx) => b.eye(head, [sx * 0.085, 0.035, 0.08], 0.035, '#f2c230', [sx * 0.8, 0.2, 0.55], { slit: true }));
    blink(b, eyes);
    for (const sx of [1, -1]) b.ball(head, b.mat('#0e1a0e'), [sx * 0.035, 0.02, 0.19], 0.01);
    const tongue = b.group(head, [0, -0.02, 0.18]);
    const red = b.mat('#e0243a', { rough: 0.35, coat: 0.6 });
    b.limb(tongue, red, [0, 0, 0], [0, 0, 0.1], 0.008, 0.007);
    for (const sx of [1, -1]) b.limb(tongue, red, [0, 0, 0.1], [sx * 0.025, -0.005, 0.15], 0.006, 0.003);
    b.on((t) => {
      head.rotation.y = Math.sin(t * 0.8) * 0.25;
      head.position.x = Math.sin(t * 0.8) * 0.03;
      const f = (t * 0.6) % 1;
      tongue.scale.z = f < 0.15 ? Math.sin((f / 0.15) * Math.PI) : 0.001;
    });
  },

  baer(b) {
    const q = quad(b, { color: '#5b3b23', len: 1.35, bodyR: 0.46, bodyW: 0.44, legH: 0.42, legR: 0.13, headR: 0.36, headUp: 0.0, headFwd: 0.12, snoutL: 0.24, snoutR: 0.17, muzzle: '#a37a52', ear: 'round', earS: 0.9, tail: 'short', tailR: 0.09, iris: '#c8ff5a', eyeGlow: '#9dff3a', nose: '#1a1210', eyeS: 0.17 });
    const { bodyW, bodyR, len } = q.P, H = q.H;
    b.ball(q.body, q.fur, [0, bodyR * 0.45, len * 0.2], [bodyW * 0.8, bodyR * 0.6, len * 0.25]);
    // Moosmantel
    const moss = ['#2f5a24', '#4f7f2e', '#6c9a3a'].map((c) => furMat(b, c, { ns: 1 }));
    for (let i = 0; i < 46; i++) {
      let d;
      do d = new THREE.Vector3(b.rnd() * 2 - 1, b.rnd(), b.rnd() * 2 - 1);
      while (d.lengthSq() > 1 || d.normalize().y < 0.45);
      spot(b, q.body, moss[i % 3], [bodyW * 1.02, bodyR * 1.0, len * 0.5], [0, bodyR * 0.08, 0], d, 0.13 + b.rnd() * 0.06, 0.45);
    }
    const leafGeoM = b.mat('#5fae3c', { glow: '#244a14', rough: 0.5, double: true });
    for (let i = 0; i < 14; i++) {
      const z = (b.rnd() - 0.5) * len * 0.8, x = (b.rnd() - 0.5) * bodyW;
      const lf = b.extrude(q.body, leafGeoM, leafShape(0.2, 0.07), 0.005, [x, bodyR * 1.0, z], [-0.6 - b.rnd() * 0.5, b.rnd() * TAU, 0], null, 0.004);
      lf.rotation.order = 'YXZ';
    }
    const capM = b.mat('#d8322e', { rough: 0.4 }), stemM = b.mat('#f3ead8', { rough: 0.6 }), dotM = b.mat('#ffffff', { rough: 0.5 });
    for (const [x, z, s] of [[0.12, -0.25, 1], [-0.15, 0.05, 0.75], [0.05, 0.3, 0.85]]) {
      const m = b.group(q.body, [x, bodyR * 0.98, z]);
      m.scale.setScalar(s);
      b.cyl(m, stemM, [0, 0.06, 0], 0.03, 0.04, 0.12, null, 12);
      b.place(new THREE.Mesh(b.track(new THREE.SphereGeometry(0.09, 20, 10, 0, TAU, 0, Math.PI / 2)), capM), m, [0, 0.11, 0]);
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * TAU;
        b.ball(m, dotM, [Math.cos(a) * 0.055, 0.17, Math.sin(a) * 0.055], 0.013);
      }
    }
    // Geweih aus Ästen mit leuchtenden Blättern
    const wood = b.mat('#6b4a2a', { rough: 0.75, surf: 'stone', ns: 0.6 });
    const glowLeaf = b.mat('#9dff5a', { glow: '#6aff2a', ei: 1.2, double: true, rough: 0.4 });
    const leaves = [];
    for (const sx of [1, -1])
      branch(b, q.head, wood, [sx * H * 0.38, H * 0.72, -H * 0.12], [sx * 0.55, 1, -0.25], H * 0.75, 0.04, 2, (p, d) => {
        const lf = b.extrude(q.head, glowLeaf, leafShape(0.14, 0.05), 0.004, [p.x, p.y, p.z], [b.rnd() * 0.6, b.rnd() * TAU, sx * 0.4], null, 0.003);
        leaves.push(lf);
      });
    // Ranken-Armreifen und Runen
    const vine = b.mat('#3d6b2a', { rough: 0.6 });
    const rune = b.mat('#9dff3a', { glow: '#7aff2a', ei: 2 });
    q.legs.forEach((leg) => b.torus(leg, vine, [0, -0.18, 0], q.P.legR * 1.25, 0.02, [Math.PI / 2, 0, 0]));
    band(b, q.body, rune, len * 0.24, bodyW * 1.07, bodyR * 1.06, 0.53, Math.PI * 0.45, 0.012);
    band(b, q.body, rune, -len * 0.26, bodyW * 1.06, bodyR * 1.04, 0.53, Math.PI * 0.45, 0.012);
    const claw = b.mat('#efe6d0', { rough: 0.3, coat: 0.6 });
    q.legs.slice(0, 2).forEach((leg) => {
      const fy = -(q.bodyY - bodyR * 0.35 - q.P.legR * 0.7);
      for (const x of [-0.06, -0.02, 0.02, 0.06]) b.cone(leg, claw, [x, fy - 0.06, q.P.legR * 1.6], 0.018, 0.08, [Math.PI / 2 + 0.4, 0, 0]);
    });
    swarm(b, b.model, 24, '#d8ff6a', 0.1, (s, t, o) => {
      const a = s[0] * TAU + t * 0.25 * (0.5 + s[1]);
      o[0] = Math.cos(a) * (0.6 + s[2] * 0.4);
      o[1] = 0.9 + s[3] * 0.9 + Math.sin(t * s[1] * 3 + s[0] * 9) * 0.12;
      o[2] = Math.sin(a) * (0.7 + s[2] * 0.5);
      o[3] = Math.pow(0.5 + 0.5 * Math.sin(t * 2.5 * (0.5 + s[1]) + s[3] * 9), 2);
    });
    b.on((t) => {
      rune.emissiveIntensity = 1.5 + Math.sin(t * 2) * 0.7;
      glowLeaf.emissiveIntensity = 1 + Math.sin(t * 1.6) * 0.4;
    });
  },

  wolf(b) {
    const q = quad(b, { color: '#5b6272', belly: '#d9dde6', cheek: true, len: 1.2, bodyR: 0.3, bodyW: 0.28, legH: 0.52, legR: 0.07, headR: 0.27, headUp: 0.32, headFwd: 0.0, headPitch: -0.6, snoutL: 0.34, snoutR: 0.11, ear: 'pointy', earS: 1.15, innerEar: '#2a2e38', tail: 'bushy', tailL: 0.9, tailR: 0.13, tipColor: '#2b2f3a', iris: '#b6ff6a', eyeGlow: '#9dff3a', wag: 1, wagAmp: 0.15 });
    const { bodyW, bodyR, len } = q.P;
    const ruff = furMat(b, '#c5cad6', { ns: 0.9 });
    const a = v3(q.neck.a), c = v3(q.neck.c);
    for (let i = 0; i < 4; i++) {
      const k = 0.15 + i * 0.22, p = a.clone().lerp(c, k), r = q.neck.r0 + (q.neck.r1 - q.neck.r0) * k;
      for (let j = 0; j < 8; j++) {
        const an = (j / 8) * TAU;
        b.ball(q.g, ruff, [Math.cos(an) * r * 0.9, p.y + Math.sin(an) * r * 0.9, p.z + 0.02], [0.07, 0.09, 0.07]);
      }
    }
    // Rankenrüstung
    const vine = b.mat('#2f5a24', { rough: 0.6, surf: 'stone', ns: 0.3 });
    const pts = [];
    for (let i = 0; i <= 40; i++) {
      const k = i / 40, an = k * TAU * 3.2, z = (k - 0.5) * len * 0.95;
      const e = Math.sqrt(Math.max(0.15, 1 - (z / (len * 0.55)) ** 2));
      pts.push([Math.cos(an) * bodyW * 1.12 * e, Math.sin(an) * bodyR * 1.1 * e + 0.02, z]);
    }
    const vineMesh = b.taper(q.body, vine, pts, 0.022, 0.022, { seg: 160, radial: 8 });
    const glowLeaf = b.mat('#b6ff6a', { glow: '#7aff2a', ei: 1.4, double: true });
    for (let i = 1; i < 18; i++) {
      const p = vineMesh.userData.curve.getPointAt(i / 18);
      if (p.y < -bodyR * 0.3) continue;
      b.extrude(q.body, glowLeaf, leafShape(0.12, 0.045), 0.004, [p.x, p.y, p.z], [b.rnd() * 2, b.rnd() * TAU, 0], null, 0.003);
    }
    const rune = b.mat('#b6ff6a', { glow: '#8aff3a', ei: 2 });
    band(b, q.body, rune, len * 0.28, bodyW * 1.07, bodyR * 1.05, 0.54, Math.PI * 0.4, 0.01);
    band(b, q.body, rune, -len * 0.3, bodyW * 1.05, bodyR * 1.03, 0.54, Math.PI * 0.4, 0.01);
    // Geisterflammen entlang des Rückens
    const flame = b.basic('#9dff5a', { opacity: 0.7 });
    const flames = [];
    for (let i = 0; i < 7; i++) {
      const z = (i / 6 - 0.5) * len * 0.8;
      const f = b.cone(q.body, flame, [0, bodyR * 0.95, z], 0.05, 0.22, [-0.3, 0, 0]);
      f.userData.nofit = true;
      flames.push(f);
    }
    swarm(b, b.model, 30, '#b6ff6a', 0.09, (s, t, o) => {
      const life = (t * (0.25 + s[0] * 0.2) + s[1]) % 1;
      o[0] = (s[2] - 0.5) * 0.4 + Math.sin(t + s[3] * 9) * 0.1;
      o[1] = q.bodyY + bodyR + life * 0.9;
      o[2] = (s[3] - 0.5) * len;
      o[3] = Math.sin(life * Math.PI) * 0.9;
    });
    b.on((t) => {
      flames.forEach((f, i) => f.scale.set(1, 0.7 + Math.sin(t * 8 + i * 1.7) * 0.3 + Math.sin(t * 13 + i) * 0.15, 1));
      rune.emissiveIntensity = 1.4 + Math.sin(t * 2.2) * 0.7;
    });
  },

  // ── Eis Egg ──
  schneemann(b) {
    const g = b.group(b.model);
    const snow = b.mat('#f6fbff', { rough: 0.85, surf: 'snow', ns: 0.7, sheen: 0.5, sheenColor: '#cfefff' });
    const coal = b.mat('#1b1b20', { rough: 0.7, surf: 'stone', ns: 0.5 });
    b.ball(g, snow, [0, 0.03, 0], [0.7, 0.08, 0.7]);
    b.ball(g, snow, [0, 0.42, 0], 0.45);
    b.ball(g, snow, [0, 1.04, 0], 0.33);
    for (const y of [0.9, 1.04, 1.18]) b.ball(g, coal, [0, y, Math.sqrt(0.33 ** 2 - (y - 1.04) ** 2)], 0.035);
    const head = b.group(g, [0, 1.52, 0]);
    b.ball(head, snow, [0, 0, 0], 0.25);
    for (const sx of [1, -1]) b.ball(head, coal, [sx * 0.08, 0.06, 0.225], [0.035, 0.04, 0.025]);
    for (let i = 0; i < 5; i++) {
      const a = -0.6 + i * 0.3, x = Math.sin(a) * 0.12, y = -0.1 + a * a * 0.1;
      b.ball(head, coal, [x, y, Math.sqrt(Math.max(0, 0.25 ** 2 - x * x - y * y)) - 0.005], 0.018);
    }
    const carrot = b.mat('#ff7a1a', { rough: 0.55, surf: 'short', ns: 0.5 });
    b.cone(head, carrot, [0, 0, 0.21], 0.045, 0.26, [Math.PI / 2, 0, 0]);
    const wood = b.mat('#5a3a20', { rough: 0.8, surf: 'stone', ns: 0.5 });
    const arms = [1, -1].map((sx) => {
      const arm = b.group(g, [sx * 0.28, 1.12, 0]);
      b.taper(arm, wood, [[0, 0, 0], [sx * 0.22, 0.12, 0.02], [sx * 0.45, 0.3, 0.05]], 0.025, 0.012);
      b.taper(arm, wood, [[sx * 0.32, 0.2, 0.03], [sx * 0.4, 0.36, 0.05]], 0.012, 0.006);
      b.taper(arm, wood, [[sx * 0.38, 0.26, 0.04], [sx * 0.52, 0.28, 0.06]], 0.01, 0.005);
      return [arm, sx];
    });
    const stripes = b.ctex(256, 32, (ctx, w, h) => {
      for (let x = 0; x < w; x += 32) {
        ctx.fillStyle = '#d52a3a';
        ctx.fillRect(x, 0, 18, h);
        ctx.fillStyle = '#f4efe6';
        ctx.fillRect(x + 18, 0, 14, h);
      }
    }, { wrap: true });
    stripes.repeat.set(3, 1);
    const scarf = b.mat('#ffffff', { map: stripes, rough: 0.9, sheen: 0.8, surf: 'fur', ns: 0.4 });
    b.torus(g, scarf, [0, 1.29, 0], 0.24, 0.07, [Math.PI / 2, 0, 0]);
    b.rbox(g, scarf, [0.13, 1.12, 0.24], [0.13, 0.34, 0.05], 0.02, [0.1, 0, 0.18]);
    const hat = b.group(head, [0.02, 0.18, -0.02], [0, 0, -0.15]);
    const black = b.mat('#16151a', { rough: 0.5, sheen: 0.5 });
    b.cyl(hat, black, [0, 0, 0], 0.3, 0.3, 0.025, null, 40);
    b.cyl(hat, black, [0, 0.17, 0], 0.18, 0.17, 0.32, null, 40);
    b.cyl(hat, b.mat('#d52a3a', { rough: 0.5 }), [0, 0.06, 0], 0.175, 0.175, 0.06, null, 40);
    b.on((t) => {
      head.rotation.z = Math.sin(t * 0.9) * 0.06;
      head.rotation.y = Math.sin(t * 0.5) * 0.15;
      arms.forEach(([a, s]) => (a.rotation.z = s * Math.sin(t * 1.6 + s) * 0.12));
    });
  },

  polarhase(b) {
    const g = b.group(b.model);
    const fur = furMat(b, '#f5f8fa', { sheenColor: '#cfe9ff' });
    const pink = b.mat('#f2b0b8', { rough: 0.6, sheen: 0.4 });
    const tipM = furMat(b, '#3a3f48');
    const body = b.group(g);
    b.ball(body, fur, [0, 0.44, -0.06], [0.36, 0.42, 0.42]);
    b.ball(body, fur, [0, 0.56, 0.14], [0.27, 0.32, 0.25]);
    for (const sx of [1, -1]) {
      b.ball(g, fur, [sx * 0.24, 0.3, -0.12], [0.17, 0.24, 0.3]);
      b.ball(g, fur, [sx * 0.2, 0.05, 0.12], [0.1, 0.06, 0.26]);
      b.limb(g, fur, [sx * 0.13, 0.48, 0.24], [sx * 0.12, 0.07, 0.3], 0.055, 0.045);
      b.ball(g, fur, [sx * 0.12, 0.04, 0.34], [0.06, 0.045, 0.08]);
    }
    b.ball(g, fur, [0, 0.32, -0.48], 0.1);
    const H = 0.25;
    const head = b.group(g, [0, 0.98, 0.2]);
    b.ball(head, fur, [0, 0, 0], [H, H * 0.92, H * 0.98]);
    for (const sx of [1, -1]) b.ball(head, fur, [sx * 0.09, -0.08, 0.15], [0.1, 0.08, 0.09]);
    const nose = b.ball(head, pink, [0, -0.03, 0.245], [0.035, 0.025, 0.02]);
    const eyes = [1, -1].map((sx) => b.eye(head, [sx * 0.13, 0.04, 0.18], 0.055, '#2a1a14', [sx * 0.7, 0.1, 0.7]));
    whiskers(b, head, [0.05, -0.06, 0.22], 0.22);
    const ears = makeEars(b, head, 'long', H, 1.05, fur, pink);
    ears.forEach((e) => b.ball(e, tipM, [0, H * 1.52, 0.005], [H * 0.17, H * 0.2, H * 0.09]));
    blink(b, eyes);
    b.on((t) => {
      nose.scale.y = 0.025 * (1 + Math.max(0, Math.sin(t * 14)) * 0.3 * (Math.sin(t * 0.8) > 0.3 ? 1 : 0));
      ears.forEach((e, i) => (e.rotation.z = (i ? 1 : -1) * (0.14 + Math.sin(t * 1.2 + i) * 0.08)));
      head.rotation.y = Math.sin(t * 0.6) * 0.2;
      body.scale.y = 1 + Math.sin(t * 2.4) * 0.015;
    });
  },

  eisbaer(b) {
    const q = quad(b, { color: '#eef2f2', len: 1.3, bodyR: 0.42, bodyW: 0.4, legH: 0.38, legR: 0.12, headR: 0.28, headL: 1.15, headUp: -0.02, headFwd: 0.2, snoutL: 0.24, snoutR: 0.14, ear: 'round', earS: 0.7, innerEar: '#c9d6dc', tail: 'short', tailR: 0.07, iris: '#120c0a', nose: '#121012', eyeS: 0.16, matOpts: { sheenColor: '#bfe8ff' } });
    const claw = b.mat('#2a2a30', { rough: 0.3, coat: 0.7 });
    q.legs.slice(0, 2).forEach((leg) => {
      const fy = -(q.bodyY - q.P.bodyR * 0.35 - q.P.legR * 0.7);
      for (const x of [-0.06, -0.02, 0.02, 0.06]) b.cone(leg, claw, [x, fy - 0.05, q.P.legR * 1.6], 0.014, 0.05, [Math.PI / 2 + 0.4, 0, 0]);
    });
    const fish = b.group(b.model, [0.35, 0.05, 0.95], [0, 0.6, Math.PI / 2]);
    const fm = b.mat('#9fb8c8', { metal: 0.6, rough: 0.25, irid: 0.6 });
    b.ball(fish, fm, [0, 0, 0], [0.05, 0.16, 0.08]);
    b.cone(fish, fm, [0, -0.14, 0], 0.07, 0.08, [Math.PI, 0, 0], [1, 1, 0.2], 3);
  },

  robbe(b) {
    const g = b.group(b.model);
    const skin = b.mat('#9eabb6', { rough: 0.3, coat: 0.7, surf: 'short', ns: 0.3, sheen: 0.3 });
    const light = b.mat('#cdd5dc', { rough: 0.35, coat: 0.6, surf: 'short', ns: 0.3 });
    const dark = b.mat('#5d6a76', { rough: 0.3, coat: 0.7 });
    const body = b.group(g);
    b.ball(body, skin, [0, 0.3, 0], [0.33, 0.3, 0.55]);
    b.ball(body, skin, [0, 0.2, -0.5], [0.22, 0.16, 0.32]);
    b.ball(body, light, [0, 0.21, 0.1], [0.27, 0.2, 0.42]);
    b.ball(body, skin, [0, 0.52, 0.32], [0.24, 0.26, 0.24]);
    spots(b, body, dark, [0.33, 0.3, 0.55], [0, 0.3, 0], 14, 0.05, 0.1);
    const head = b.group(g, [0, 0.74, 0.45]);
    b.ball(head, skin, [0, 0, 0], [0.22, 0.2, 0.22]);
    for (const sx of [1, -1]) b.ball(head, light, [sx * 0.05, -0.06, 0.17], [0.08, 0.065, 0.07]);
    b.ball(head, b.mat('#1a1416', { rough: 0.3, coat: 0.8 }), [0, -0.02, 0.225], [0.04, 0.028, 0.022]);
    const eyes = [1, -1].map((sx) => b.eye(head, [sx * 0.09, 0.05, 0.16], 0.065, '#0e0b0c', [sx * 0.4, 0.1, 0.9]));
    whiskers(b, head, [0.08, -0.07, 0.2], 0.18);
    blink(b, eyes);
    const flips = [1, -1].map((sx) => {
      const f = b.group(g, [sx * 0.28, 0.14, 0.22]);
      b.ball(f, skin, [sx * 0.06, -0.05, 0.05], [0.07, 0.035, 0.2], [0, sx * 0.5, sx * 0.3]);
      return [f, sx];
    });
    for (const sx of [1, -1]) b.ball(g, skin, [sx * 0.1, 0.12, -0.84], [0.14, 0.03, 0.12], [0, sx * 0.5, 0]);
    b.on((t) => {
      head.rotation.x = -0.15 + Math.sin(t * 0.8) * 0.1;
      head.rotation.y = Math.sin(t * 0.5) * 0.25;
      const clap = Math.max(0, Math.sin(t * 6)) * (Math.sin(t * 0.6) > 0.5 ? 1 : 0);
      flips.forEach(([f, s]) => (f.rotation.y = -s * clap * 0.6));
    });
  },

  pinguin(b) {
    const g = b.group(b.model);
    const black = b.mat('#1e2430', { rough: 0.4, sheen: 0.6, sheenColor: '#6a7a9a', surf: 'feather', ns: 0.25 });
    const white = b.mat('#f6f6f2', { rough: 0.5, sheen: 0.5, surf: 'feather', ns: 0.2 });
    const orange = b.mat('#ffa21f', { rough: 0.4, coat: 0.5 });
    const body = b.group(g);
    b.ball(body, black, [0, 0.62, 0], [0.36, 0.55, 0.32]);
    b.ball(body, white, [0, 0.58, 0.08], [0.3, 0.48, 0.27]);
    b.ball(body, b.mat('#ffd64a', { rough: 0.5, sheen: 0.4 }), [0, 0.95, 0.12], [0.22, 0.1, 0.15]);
    const head = b.group(g, [0, 1.12, 0.02]);
    b.ball(head, black, [0, 0, 0], [0.26, 0.26, 0.25]);
    for (const sx of [1, -1]) b.ball(head, orange, [sx * 0.2, -0.08, 0.06], [0.05, 0.1, 0.08], [0, 0, sx * 0.3]);
    b.cone(head, black, [0, -0.04, 0.2], 0.05, 0.16, [Math.PI / 2, 0, 0], [1, 0.6, 1]);
    b.ball(head, orange, [0, -0.06, 0.25], [0.035, 0.014, 0.05]);
    const eyes = [1, -1].map((sx) => b.eye(head, [sx * 0.1, 0.05, 0.2], 0.04, '#2a1a10', [sx * 0.5, 0.1, 0.85]));
    blink(b, eyes);
    const flippers = [1, -1].map((sx) => {
      const f = b.group(g, [sx * 0.33, 0.85, 0]);
      b.ball(f, black, [sx * 0.03, -0.22, 0], [0.06, 0.28, 0.12], [0, 0, sx * 0.2]);
      return [f, sx];
    });
    for (const sx of [1, -1]) b.ball(g, orange, [sx * 0.13, 0.03, 0.14], [0.1, 0.03, 0.13], [0, sx * 0.25, 0]);
    b.cone(g, black, [0, 0.12, -0.27], 0.08, 0.14, [-2.4, 0, 0], [1, 1, 0.4]);
    b.on((t) => {
      g.rotation.z = Math.sin(t * 3) * 0.05;
      head.rotation.y = Math.sin(t * 0.7) * 0.3;
      flippers.forEach(([f, s]) => (f.rotation.z = s * (0.1 + Math.abs(Math.sin(t * 3)) * 0.25)));
    });
  },

  schneegolem(b) {
    const g = b.group(b.model);
    const snow = b.mat('#eef6fb', { rough: 0.85, surf: 'snow', ns: 0.9, sheen: 0.4, sheenColor: '#bfe9ff' });
    const pack = b.mat('#c9dbe6', { rough: 0.7, surf: 'stone', ns: 0.6 });
    const ice = b.mat('#bdeeff', { rough: 0.06, coat: 1, glow: '#2fb6ff', ei: 0.45, opacity: 0.9, flat: true, irid: 0.4 });
    const core = b.mat('#c8f6ff', { glow: '#5fe0ff', ei: 2.4, flat: true });
    for (const sx of [1, -1]) {
      b.rbox(g, pack, [sx * 0.3, 0.3, 0], [0.34, 0.5, 0.36], 0.1);
      b.rbox(g, snow, [sx * 0.3, 0.07, 0.05], [0.42, 0.14, 0.48], 0.06);
    }
    b.ball(g, snow, [0, 0.6, 0], [0.45, 0.22, 0.32]);
    const torso = b.group(g, [0, 1.05, 0]);
    b.ball(torso, snow, [0, 0, 0], [0.62, 0.5, 0.42]);
    for (const [x, y, r] of [[-0.3, 0.15, 0.3], [0.32, -0.1, -0.2], [0, -0.3, 0.1]]) b.rbox(torso, pack, [x, y, 0.33], [0.26, 0.2, 0.1], 0.05, [0, x * 0.8, r]);
    const heart = b.octa(torso, core, [0, 0.05, 0.42], 0.13, [0.1, 0.17, 0.1]);
    const hg = glowSprite('#5fe0ff', 0.9, 0.8);
    hg.position.set(0, 0.05, 0.5);
    torso.add(hg);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      b.octa(torso, ice, [Math.cos(a) * 0.17, 0.05 + Math.sin(a) * 0.17, 0.38], 0.05, [0.03, 0.08, 0.03], [0, 0, a + Math.PI / 2]);
    }
    const head = b.group(g, [0, 1.64, 0.12]);
    b.rbox(head, snow, [0, 0, 0], [0.36, 0.3, 0.32], 0.1);
    const eyeM = b.mat('#bff6ff', { glow: '#5fe0ff', ei: 3 });
    for (const sx of [1, -1]) {
      b.rbox(head, eyeM, [sx * 0.08, 0.02, 0.16], [0.09, 0.035, 0.02], 0.008, [0, 0, -sx * 0.15]);
      b.cone(head, ice, [sx * 0.1, 0.12, 0.08], 0.035, 0.16, [-0.4, 0, -sx * 0.6]);
    }
    b.rbox(head, b.mat('#5a7080', { rough: 0.6 }), [0, -0.08, 0.16], [0.16, 0.025, 0.02], 0.008);
    for (const sx of [1, -1]) {
      b.ball(g, snow, [sx * 0.62, 1.36, 0], 0.26);
      for (let k = 0; k < 6; k++) b.octa(g, ice, [sx * (0.6 + b.rnd() * 0.15), 1.55 + b.rnd() * 0.06, (b.rnd() - 0.5) * 0.3], 0.1, [0.06, 0.18 + b.rnd() * 0.12, 0.06], [b.rnd() * 0.4 - 0.2, 0, -sx * (0.2 + b.rnd() * 0.6)]);
      const arm = b.group(g, [sx * 0.68, 1.28, 0]);
      b.limb(arm, pack, [0, 0, 0], [sx * 0.13, -0.44, 0.05], 0.15, 0.13);
      b.limb(arm, snow, [sx * 0.13, -0.44, 0.05], [sx * 0.15, -0.82, 0.12], 0.16, 0.18);
      b.ball(arm, snow, [sx * 0.15, -0.93, 0.14], [0.22, 0.2, 0.22]);
      for (const z of [-0.08, 0, 0.08]) b.octa(arm, ice, [sx * 0.15, -0.88, 0.32 + z * 0.2], 0.05, [0.04, 0.04, 0.07]);
      for (let k = 0; k < 4; k++) b.cone(arm, ice, [sx * (0.08 + k * 0.03), -0.55 - k * 0.06, 0.12], 0.025, 0.12 + k * 0.03, [Math.PI, 0, 0]);
      const ph = sx;
      b.on((t) => (arm.rotation.x = Math.sin(t * 1.1 + ph) * 0.12));
    }
    for (let k = 0; k < 7; k++) b.cone(torso, ice, [-0.4 + k * 0.13, -0.42, 0.22], 0.025, 0.1 + (k % 3) * 0.05, [Math.PI, 0, 0]);
    swarm(b, b.model, 60, '#dff8ff', 0.07, (s, t, o) => {
      const a = s[0] * TAU + t * (0.3 + s[1] * 0.4), r = 0.75 + s[2] * 0.45, life = (t * 0.15 + s[3]) % 1;
      o[0] = Math.cos(a) * r;
      o[1] = 2.1 - life * 2.1;
      o[2] = Math.sin(a) * r;
      o[3] = Math.sin(life * Math.PI);
    });
    b.on((t) => {
      core.emissiveIntensity = 2 + Math.sin(t * 2.4) * 0.8;
      eyeM.emissiveIntensity = 2.5 + Math.sin(t * 3) * 0.8;
      heart.rotation.y = t;
      head.rotation.y = Math.sin(t * 0.5) * 0.2;
    });
  },

  polarfuchs(b) {
    const q = quad(b, { color: '#f2f7fb', belly: '#ffffff', cheek: true, len: 1.05, bodyR: 0.28, bodyW: 0.26, legH: 0.4, legR: 0.058, headR: 0.26, headW: 1.05, snoutL: 0.24, snoutR: 0.1, ear: 'pointy', earS: 1.1, innerEar: '#cfe6f2', tail: 'none', iris: '#6fdcff', eyeGlow: '#5fd8ff', nose: '#1e2630', matOpts: { sheenColor: '#bfefff' } });
    const ice = b.mat('#c8f2ff', { rough: 0.05, coat: 1, glow: '#2bb8ff', ei: 0.6, opacity: 0.92, flat: true, irid: 0.5 });
    const tipM = b.mat('#bff6ff', { glow: '#5fe0ff', ei: 1.6, rough: 0.5, sheen: 1 });
    const L = 0.85, R = 0.12;
    const tails = [[-0.6, 0.2], [0, 0], [0.6, -0.2]].map(([ry, rz], i) => {
      const tg = b.group(q.tail, [0, 0, 0], [0.2 + (i === 1 ? 0.35 : 0), ry, rz]);
      const mesh = b.taper(tg, q.fur, [[0, 0, 0], [0, -L * 0.1, -L * 0.35], [0, 0, -L * 0.7], [0, L * 0.2, -L]], R, R, { profile: (t) => R * (0.45 + 1.2 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 0.85 + 0.08)), 0.7)) });
      const c = mesh.userData.curve, p = c.getPointAt(0.93), tan = c.getTangentAt(0.93);
      b.ball(tg, tipM, [p.x, p.y, p.z], [R, R, R * 1.5]).quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tan);
      const e = c.getPointAt(1);
      b.octa(tg, ice, [e.x, e.y + 0.06, e.z - 0.04], 0.06, [0.04, 0.1, 0.04]);
      return tg;
    });
    const H = q.H;
    const crown = b.group(q.head, [0, H * 0.8, -H * 0.05]);
    for (let i = 0; i < 7; i++) {
      const a = Math.PI * (0.15 + (i / 6) * 0.7);
      const h = i === 3 ? 0.2 : 0.09 + Math.sin((i / 6) * Math.PI) * 0.06;
      b.octa(crown, ice, [Math.cos(a) * H * 0.42, h * 0.5, Math.sin(a) * H * 0.3 + 0.02], 0.05, [0.03, h * 0.6, 0.03], [0, 0, (Math.PI / 2 - a) * 0.6]);
    }
    const a = v3(q.neck.a), c = v3(q.neck.c), p = a.clone().lerp(c, 0.55), r = q.neck.r0 * 0.75 + q.neck.r1 * 0.25;
    for (let i = 0; i < 12; i++) {
      const an = (i / 12) * TAU;
      b.octa(q.g, ice, [Math.cos(an) * r, p.y + Math.sin(an) * r, p.z + 0.03], 0.04, [0.03, 0.07, 0.03], [0, 0, an - Math.PI / 2]);
    }
    // Polarlicht-Band
    const auroraTex = b.ctex(256, 64, (ctx, w, h) => {
      const gr = ctx.createLinearGradient(0, 0, w, 0);
      gr.addColorStop(0, 'rgba(80,255,170,0)');
      gr.addColorStop(0.2, 'rgba(80,255,170,1)');
      gr.addColorStop(0.55, 'rgba(90,220,255,1)');
      gr.addColorStop(0.85, 'rgba(170,120,255,1)');
      gr.addColorStop(1, 'rgba(170,120,255,0)');
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'destination-in';
      const v = ctx.createLinearGradient(0, 0, 0, h);
      v.addColorStop(0, 'rgba(0,0,0,0)');
      v.addColorStop(0.6, 'rgba(0,0,0,1)');
      v.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = v;
      ctx.fillRect(0, 0, w, h);
    });
    const ag = b.track(new THREE.PlaneGeometry(3.6, 0.6, 90, 1));
    const aurora = new THREE.Mesh(ag, b.basic('#ffffff', { map: auroraTex, double: true, opacity: 0.75 }));
    aurora.position.set(0, 1.25, -0.7);
    b.fx.add(aurora);
    const base = ag.attributes.position.array.slice();
    b.on((t) => {
      const P = ag.attributes.position;
      for (let i = 0; i < P.count; i++) {
        const x = base[i * 3];
        P.setY(i, base[i * 3 + 1] + Math.sin(x * 1.8 + t * 0.9) * 0.18);
        P.setZ(i, Math.cos(x * 1.3 + t * 0.6) * 0.3);
      }
      P.needsUpdate = true;
      tails.forEach((tg, i) => (tg.rotation.y = [-0.6, 0, 0.6][i] + Math.sin(t * 1.4 + i * 1.3) * 0.15));
      tipM.emissiveIntensity = 1.3 + Math.sin(t * 2) * 0.5;
    });
    swarm(b, b.model, 40, '#dff8ff', 0.07, (s, t, o) => {
      const life = (t * 0.2 + s[0]) % 1;
      o[0] = (s[1] - 0.5) * 1.6;
      o[1] = 1.9 - life * 1.9;
      o[2] = (s[2] - 0.5) * 1.8 + Math.sin(t + s[3] * 9) * 0.1;
      o[3] = Math.sin(life * Math.PI) * 0.9;
    });
  },
};
