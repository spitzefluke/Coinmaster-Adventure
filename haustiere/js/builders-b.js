// Haustiere aus Engels Egg und Galaxie Egg
import { THREE, TAU, glowSprite, raysTexture, v3 } from './kit.js';
import { quad, lizard, furMat, collar, whiskers, spots, spot, swarm, blink, makeEars, halo, angelWings, featherWing, galaxyTex } from './templates.js';

const gold = (b, o = {}) => b.mat('#f2c14e', { metal: 1, rough: 0.22, ...o });

function cloud(b, parent, y = 0.12, R = 0.55, n = 16, color = '#ffffff') {
  const m = b.mat(color, { rough: 0.9, sheen: 1, sheenColor: '#fff4d8', surf: 'snow', ns: 0.3 });
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + b.rnd() * 0.3, r = R * (0.55 + b.rnd() * 0.45);
    b.ball(parent, m, [Math.cos(a) * r, y + b.rnd() * 0.08, Math.sin(a) * r], 0.14 + b.rnd() * 0.1);
  }
  b.ball(parent, m, [0, y, 0], [R * 0.8, 0.14, R * 0.8]);
}

function starShape(r = 0.1, inner = 0.45, n = 5) {
  const s = new THREE.Shape();
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * TAU + Math.PI / 2, rr = i % 2 ? r * inner : r;
    i ? s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  s.closePath();
  return s;
}

function orbiters(b, parent, list, tilt = 0.35, y = 0.6) {
  const plane = b.group(parent, [0, y, 0], [tilt, 0, 0.15]);
  plane.userData.nofit = true;
  const items = list.map(([mesh, r, sp, ph]) => {
    plane.add(mesh);
    return [mesh, r, sp, ph];
  });
  b.on((t) => items.forEach(([m, r, sp, ph]) => m.position.set(Math.cos(t * sp + ph) * r, 0, Math.sin(t * sp + ph) * r)));
  return plane;
}

export const BUILDERS = {
  // ── Engels Egg ──
  engelshund(b) {
    const q = quad(b, { color: '#fbf6ec', belly: '#ffffff', cheek: true, ear: 'floppy', earS: 1.05, earColor: '#f0d9a8', tail: 'thin', tailL: 0.5, tailR: 0.06, snoutL: 0.25, snoutR: 0.14, headR: 0.31, wag: 8, wagAmp: 0.45, iris: '#3b6fd6', nose: '#3a2a24', matOpts: { sheenColor: '#fff1c8' } });
    collar(b, q, '#f2c14e', '#fff4d0');
    halo(b, q.head, [0, q.H * 1.3, -q.H * 0.1], q.H * 0.55);
    angelWings(b, q.body, [q.P.bodyW * 0.55, q.P.bodyR * 0.65, q.P.len * 0.12], 0.42);
  },

  engelskatze(b) {
    const q = quad(b, { color: '#fffdf8', belly: '#ffffff', cheek: true, len: 1.0, bodyR: 0.27, bodyW: 0.25, legH: 0.4, legR: 0.062, headR: 0.28, headW: 1.05, snoutL: 0.1, snoutR: 0.11, ear: 'pointy', earS: 1.15, innerEar: '#f6c6cc', tail: 'thin', tailL: 0.85, tailR: 0.05, iris: '#5aa8ff', slit: true, nose: '#f2a0aa', wag: 1.3, wagAmp: 0.25, eyeS: 0.22, matOpts: { sheenColor: '#fff1c8' } });
    whiskers(b, q.head, [0.07, q.snY, q.snZ + 0.05], 0.26);
    const cl = collar(b, q, '#e5c06a', null, 0.6);
    b.ball(q.g, gold(b), [cl.pos.x, cl.pos.y - 0.02, cl.pos.z], 0.045);
    halo(b, q.head, [0, q.H * 1.45, -q.H * 0.1], q.H * 0.5);
    angelWings(b, q.body, [q.P.bodyW * 0.55, q.P.bodyR * 0.65, q.P.len * 0.12], 0.38);
  },

  adler(b) {
    const g = b.group(b.model);
    const brown = b.mat('#4e3420', { rough: 0.6, sheen: 0.6, sheenColor: '#c8a070', surf: 'feather', ns: 0.45 });
    const white = furMat(b, '#f7f4ee', { surf: 'feather', ns: 0.3 });
    const yellow = b.mat('#f2b51e', { rough: 0.35, coat: 0.6 });
    const talon = b.mat('#1a1614', { rough: 0.3, coat: 0.8 });
    const rock = b.mat('#c9c1b0', { rough: 0.85, surf: 'stone', ns: 0.8 });
    b.ball(g, rock, [0, 0.12, 0], [0.55, 0.2, 0.45]);
    b.ball(g, rock, [0.28, 0.1, -0.2], [0.3, 0.16, 0.3]);
    b.torus(g, gold(b), [0, 0.2, 0], 0.5, 0.018, [Math.PI / 2, 0, 0]).scale.set(1, 0.82, 1);
    const body = b.group(g, [0, 0.3, 0]);
    b.ball(body, brown, [0, 0.48, -0.02], [0.3, 0.44, 0.3], [0.25, 0, 0]);
    b.ball(body, b.mat('#6a4a2e', { rough: 0.6, sheen: 0.6, surf: 'feather', ns: 0.45 }), [0, 0.5, 0.1], [0.24, 0.36, 0.22], [0.25, 0, 0]);
    const head = b.group(body, [0, 0.98, 0.12]);
    b.ball(head, white, [0, -0.12, -0.04], [0.21, 0.18, 0.2]);
    b.ball(head, white, [0, 0, 0], [0.2, 0.19, 0.23]);
    b.ball(head, yellow, [0, -0.03, 0.22], [0.065, 0.06, 0.1]);
    b.cone(head, yellow, [0, -0.0, 0.29], 0.042, 0.1, [Math.PI * 0.78, 0, 0]);
    for (const sx of [1, -1]) b.ball(head, white, [sx * 0.08, 0.07, 0.15], [0.07, 0.03, 0.07], [0, 0, sx * 0.2]);
    const eyes = [1, -1].map((sx) => b.eye(head, [sx * 0.105, 0.03, 0.15], 0.045, '#f2c230', [sx * 0.65, 0.05, 0.75]));
    blink(b, eyes);
    const wings = [1, -1].map((s) => {
      const w = featherWing(b, body, s, { pos: [s * 0.24, 0.75, -0.06], len: 1.05, color: '#4e3420', mid: '#6a4a2e', tip: '#f0c860', rows: 3, n: 9, fl: 0.62, mat: { metal: 0.15 } });
      w.rotation.y = s * 0.35;
      return [w, s];
    });
    for (let i = -3; i <= 3; i++) {
      const f = b.group(body, [0, 0.16, -0.24], [0.7, 0, i * 0.13]);
      b.ball(f, white, [0, -0.2, 0], [0.05, 0.22, 0.015]);
    }
    for (const sx of [1, -1]) {
      const foot = [sx * 0.12, -0.02, 0.1];
      b.limb(body, yellow, [sx * 0.1, 0.15, 0.04], foot, 0.04, 0.03);
      for (const a of [-0.4, 0, 0.4]) b.cone(body, talon, [foot[0] + Math.sin(a) * 0.05, -0.03, foot[2] + 0.05], 0.015, 0.07, [Math.PI / 2 + 0.6, a, 0]);
      b.cone(body, talon, [foot[0], -0.03, foot[2] - 0.04], 0.015, 0.06, [-Math.PI / 2 - 0.6, 0, 0]);
    }
    b.on((t) => {
      wings.forEach(([w, s]) => (w.rotation.z = s * (0.05 + Math.sin(t * 1.6) * 0.16)));
      head.rotation.y = Math.sin(t * 0.7) * 0.35;
    });
  },

  engelsfuchs(b) {
    const tipMat = b.mat('#ffe9a8', { glow: '#ffcf4d', ei: 1.4, rough: 0.6, sheen: 1, surf: 'fur', ns: 0.4 });
    const q = quad(b, { color: '#fff1dc', belly: '#ffffff', cheek: true, len: 1.05, bodyR: 0.27, bodyW: 0.25, legH: 0.4, legR: 0.058, legColor: '#f3dcb4', headR: 0.26, headW: 1.05, snoutL: 0.3, snoutR: 0.1, ear: 'pointy', earS: 1.35, innerEar: '#ffe2b0', tail: 'bushy', tailL: 0.85, tailR: 0.13, tipColor: 'x', tipMat, iris: '#d89a22', nose: '#4a3428', wag: 2, wagAmp: 0.3, matOpts: { sheenColor: '#ffe9b8' } });
    halo(b, q.head, [0, q.H * 1.55, -q.H * 0.15], q.H * 0.5);
    angelWings(b, q.body, [q.P.bodyW * 0.55, q.P.bodyR * 0.65, q.P.len * 0.12], 0.4);
    b.on((t) => (tipMat.emissiveIntensity = 1.1 + Math.sin(t * 2) * 0.4));
  },

  engel(b) {
    const g = b.group(b.model);
    cloud(b, g, 0.1, 0.45, 12);
    const fl = b.group(g, [0, 0.22, 0]);
    const robe = b.mat('#fbf8f2', { rough: 0.55, sheen: 1, sheenColor: '#ffe8b0', surf: 'short', ns: 0.15 });
    const skin = b.mat('#f6d3b8', { rough: 0.55, sheen: 0.5 });
    const gd = gold(b);
    b.lathe(fl, robe, [[0.001, 0], [0.36, 0], [0.38, 0.05], [0.33, 0.3], [0.25, 0.6], [0.18, 0.82], [0.13, 0.9], [0.001, 0.93]], [0, 0.05, 0]);
    b.torus(fl, gd, [0, 0.09, 0], 0.37, 0.02, [Math.PI / 2, 0, 0]);
    b.torus(fl, gd, [0, 0.62, 0], 0.235, 0.022, [Math.PI / 2, 0, 0]);
    const head = b.group(fl, [0, 1.16, 0]);
    b.ball(head, skin, [0, 0, 0], 0.22);
    const hair = b.mat('#f0c050', { rough: 0.4, metal: 0.3, sheen: 1 });
    for (let i = 0; i < 26; i++) {
      let d;
      do d = new THREE.Vector3(b.rnd() * 2 - 1, b.rnd() * 2 - 1, b.rnd() * 2 - 1);
      while (d.lengthSq() > 1 || d.normalize().y < 0.1 - (d.z < 0 ? 0.6 : 0) || (d.z > 0.55 && d.y < 0.55));
      b.ball(head, hair, [d.x * 0.2, d.y * 0.2 + 0.02, d.z * 0.2], 0.065);
    }
    const eyes = [1, -1].map((sx) => b.eye(head, [sx * 0.075, 0.0, 0.19], 0.04, '#3a7bd5', [sx * 0.35, 0, 0.94]));
    blink(b, eyes);
    for (const sx of [1, -1]) b.ball(head, b.mat('#ff9aa8', { rough: 0.7 }), [sx * 0.12, -0.07, 0.165], [0.04, 0.025, 0.02], [0, sx * 0.6, 0]);
    b.ball(head, skin, [0, -0.04, 0.22], 0.025);
    for (const sx of [1, -1]) {
      b.limb(fl, robe, [sx * 0.15, 0.86, 0], [sx * 0.1, 0.68, 0.22], 0.06, 0.055);
      b.ball(fl, skin, [sx * 0.07, 0.67, 0.26], 0.04);
    }
    const lyre = b.group(fl, [0, 0.55, 0.3]);
    b.torus(lyre, gd, [0, 0.1, 0], 0.09, 0.012, [0, 0, Math.PI], Math.PI);
    b.limb(lyre, gd, [-0.1, 0.12, 0], [0.1, 0.12, 0], 0.01, 0.01);
    for (const x of [-0.04, 0, 0.04]) b.limb(lyre, b.mat('#fff4d0', { glow: '#ffe9a8', ei: 0.6 }), [x, 0.02, 0], [x, 0.12, 0], 0.003, 0.003, false);
    angelWings(b, fl, [0.12, 0.82, -0.14], 0.45, { base: 0.7 });
    halo(b, fl, [0, 1.48, -0.03], 0.15);
    b.on((t) => {
      fl.position.y = 0.22 + Math.sin(t * 1.6) * 0.04;
      head.rotation.z = Math.sin(t * 1.1) * 0.08;
    });
  },

  gott(b) {
    const g = b.group(b.model);
    cloud(b, g, 0.12, 0.65, 20);
    const fig = b.group(g, [0, 0.25, 0]);
    const robe = b.mat('#fbf8f2', { rough: 0.5, sheen: 1, sheenColor: '#ffe2a0', surf: 'short', ns: 0.15 });
    const skin = b.mat('#e8c4a0', { rough: 0.55, sheen: 0.4 });
    const beardM = furMat(b, '#f4f2ee', { sheenColor: '#ffffff', ns: 0.9 });
    const gd = gold(b);
    const glowGold = b.mat('#ffe08a', { glow: '#ffcf4d', ei: 2, metal: 1, rough: 0.2 });
    b.lathe(fig, robe, [[0.001, 0], [0.55, 0], [0.56, 0.06], [0.48, 0.4], [0.38, 0.8], [0.33, 1.05], [0.36, 1.18], [0.28, 1.28], [0.001, 1.3]], [0, 0, 0], 64);
    b.torus(fig, gd, [0, 0.05, 0], 0.55, 0.03, [Math.PI / 2, 0, 0]);
    b.torus(fig, gd, [0, 0.82, 0], 0.385, 0.025, [Math.PI / 2, 0, 0]);
    b.taper(fig, b.mat('#6b2fb3', { rough: 0.5, sheen: 1, sheenColor: '#c89aff' }), [[-0.3, 1.22, 0.18], [-0.05, 1.0, 0.38], [0.25, 0.72, 0.38], [0.4, 0.5, 0.15]], 0.07, 0.06, { seg: 40 });
    b.ball(fig, robe, [0, 1.22, 0], [0.42, 0.14, 0.28]);
    const head = b.group(fig, [0, 1.52, 0.02]);
    b.ball(head, skin, [0, 0, 0], [0.19, 0.21, 0.2]);
    b.ball(head, beardM, [0, 0.05, -0.04], [0.21, 0.21, 0.2]);
    b.cone(head, beardM, [0, -0.04, 0.1], 0.17, 0.48, [Math.PI, 0, 0], [1, 1, 0.55]);
    b.cone(head, beardM, [0, 0.0, -0.08], 0.2, 0.42, [Math.PI, 0, 0], [1, 1, 0.5]);
    for (const sx of [1, -1]) b.ball(head, beardM, [sx * 0.07, -0.06, 0.17], [0.08, 0.03, 0.04], [0, 0, -sx * 0.4]);
    const eyeM = b.mat('#fff2b0', { glow: '#ffcf4d', ei: 3 });
    for (const sx of [1, -1]) {
      b.ball(head, eyeM, [sx * 0.07, 0.03, 0.17], [0.03, 0.018, 0.02]);
      b.ball(head, beardM, [sx * 0.07, 0.075, 0.17], [0.045, 0.015, 0.025], [0, 0, -sx * 0.25]);
    }
    b.ball(head, skin, [0, -0.0, 0.2], [0.025, 0.04, 0.03]);
    const laurel = b.group(head, [0, 0.12, 0], [-0.15, 0, 0]);
    b.torus(laurel, gd, [0, 0, 0], 0.2, 0.012, [Math.PI / 2, 0, 0]);
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * TAU;
      if (Math.abs(Math.sin(a)) > 0.92 && Math.sin(a) > 0) continue;
      b.ball(laurel, gd, [Math.cos(a) * 0.2, 0.03 * (i % 2 ? 1 : -1), Math.sin(a) * 0.2], [0.018, 0.012, 0.045], [0, -a, 0.5 * (i % 2 ? 1 : -1)]);
    }
    // Rechter Arm mit Zepter
    b.limb(fig, robe, [0.36, 1.2, 0], [0.55, 1.15, 0.15], 0.1, 0.09);
    b.limb(fig, robe, [0.55, 1.15, 0.15], [0.6, 1.38, 0.22], 0.09, 0.075);
    b.ball(fig, skin, [0.6, 1.44, 0.22], 0.06);
    b.cyl(fig, gd, [0.6, 1.1, 0.22], 0.025, 0.025, 2.0, null, 16);
    const orb = b.ball(fig, glowGold, [0.6, 2.15, 0.22], 0.1);
    b.torus(fig, gd, [0.6, 2.15, 0.22], 0.15, 0.012, [0.4, 0, 0.3]);
    const og = glowSprite('#ffe9a8', 1.0, 0.8);
    og.position.copy(orb.position);
    fig.add(og);
    // Linker Arm mit Lichtkugel
    b.limb(fig, robe, [-0.36, 1.2, 0], [-0.5, 1.0, 0.25], 0.1, 0.09);
    b.limb(fig, robe, [-0.5, 1.0, 0.25], [-0.45, 0.98, 0.45], 0.09, 0.075);
    b.ball(fig, skin, [-0.45, 0.98, 0.5], [0.07, 0.035, 0.07]);
    const sun = b.ball(fig, b.mat('#fff6d0', { glow: '#ffd76a', ei: 3 }), [-0.45, 1.12, 0.5], 0.06);
    const sg = glowSprite('#ffd76a', 0.7, 0.9);
    sg.position.copy(sun.position);
    fig.add(sg);
    // Sonnenscheibe
    const disc = b.group(fig, [0, 1.55, -0.38]);
    disc.userData.nofit = true;
    b.torus(disc, glowGold, [0, 0, 0], 0.62, 0.035);
    b.torus(disc, gd, [0, 0, 0], 0.5, 0.015);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * TAU;
      b.cone(disc, gd, [Math.cos(a) * 0.64, Math.sin(a) * 0.64, 0], 0.04, i % 2 ? 0.18 : 0.3, [0, 0, a - Math.PI / 2], [1, 1, 0.3], 4);
    }
    const rays = new THREE.Sprite(new THREE.SpriteMaterial({ map: raysTexture(), color: '#ffd76a', transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
    rays.scale.setScalar(2.4);
    disc.add(rays);
    const dg = glowSprite('#ffe9a8', 1.6, 0.5);
    disc.add(dg);
    b.on((t) => {
      disc.rotation.z = t * 0.2;
      rays.material.rotation = -t * 0.3;
      eyeM.emissiveIntensity = 2.5 + Math.sin(t * 2) * 0.8;
      sun.position.y = sg.position.y = 1.12 + Math.sin(t * 2) * 0.03;
      fig.position.y = 0.25 + Math.sin(t * 1.2) * 0.03;
      head.rotation.y = Math.sin(t * 0.5) * 0.12;
    });
  },

  loewe(b) {
    const q = quad(b, { color: '#d9a54e', belly: '#f3d9a4', cheek: true, len: 1.3, bodyR: 0.36, bodyW: 0.33, legH: 0.5, legR: 0.1, headR: 0.3, headUp: 0.15, snoutL: 0.22, snoutR: 0.16, muzzle: '#f3d9a4', ear: 'round', earS: 0.8, tail: 'tuft', tailL: 0.85, tailR: 0.04, tuft: '#7a3e16', iris: '#ffcf4d', eyeGlow: '#ffb000', nose: '#5a2a1a', eyeS: 0.17 });
    const H = q.H, { bodyW, bodyR, len } = q.P;
    const manes = ['#8a4a1a', '#a85a22', '#6e3412'].map((c) => furMat(b, c, { ns: 1 }));
    for (let layer = 0; layer < 3; layer++) {
      const n = 16 + layer * 4;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + layer * 0.2, R = H * (0.95 + layer * 0.22);
        b.ball(q.head, manes[(i + layer) % 3], [Math.cos(a) * R, Math.sin(a) * R + H * 0.05, -H * 0.15 - layer * 0.06], [0.1, 0.2, 0.12], [0, 0, a - Math.PI / 2]);
      }
    }
    const a = v3(q.neck.a), c = v3(q.neck.c);
    for (let i = 0; i < 12; i++) {
      const p = a.clone().lerp(c, b.rnd()), an = b.rnd() * TAU;
      b.ball(q.g, manes[i % 3], [Math.cos(an) * 0.2, p.y + Math.sin(an) * 0.2, p.z], [0.12, 0.16, 0.12]);
    }
    const gd = gold(b, { coat: 1 });
    const ruby = b.mat('#e0243a', { rough: 0.05, coat: 1, flat: true, glow: '#ff2040', ei: 0.8 });
    b.ball(q.body, gd, [0, -0.02, len * 0.4], [bodyW * 0.88, bodyR * 0.86, len * 0.15]);
    b.octa(q.body, ruby, [0, 0.02, len * 0.55], 0.05);
    for (const sx of [1, -1]) {
      b.ball(q.body, gd, [sx * bodyW * 0.82, bodyR * 0.42, len * 0.27], [0.12, 0.1, 0.17]);
      b.torus(q.body, gd, [sx * bodyW * 0.82, bodyR * 0.42, len * 0.27], 0.12, 0.015, [0, Math.PI / 2, 0]);
    }
    b.ball(q.body, gd, [0, bodyR * 0.88, -len * 0.05], [bodyW * 0.7, bodyR * 0.25, len * 0.28]);
    b.octa(q.head, ruby, [0, H * 0.55, H * 0.75], 0.035);
    const wings = [1, -1].map((s) => {
      const w = featherWing(b, q.body, s, { pos: [s * bodyW * 0.45, bodyR * 0.85, len * 0.12], len: 1.2, color: '#fff6e0', mid: '#f7dc8e', tip: '#e8b23a', rows: 3, n: 10, fl: 0.6, mat: { metal: 0.35, rough: 0.35 } });
      w.rotation.y = s * 0.45;
      return [w, s];
    });
    halo(b, q.head, [0, H * 1.65, -H * 0.2], H * 0.55);
    b.on((t) => wings.forEach(([w, s]) => (w.rotation.z = s * (0.35 + Math.sin(t * 1.4) * 0.15))));
  },

  // ── Galaxie Egg ──
  galaxiewolf(b) {
    const gt = galaxyTex(b, 230, 290, '#0a0c26');
    const gal = b.mat('#ffffff', { map: gt.map, emap: gt.stars, glow: '#ffffff', ei: 0.9, rough: 0.55, sheen: 0.7, sheenColor: '#9a8cff' });
    const q = quad(b, { furMat: gal, len: 1.15, bodyR: 0.29, bodyW: 0.27, legH: 0.5, legR: 0.068, headR: 0.27, headUp: 0.22, snoutL: 0.32, snoutR: 0.11, ear: 'pointy', earS: 1.15, innerEar: '#7a5cff', tail: 'bushy', tailL: 0.85, tailR: 0.12, tipColor: 'x', tipMat: b.mat('#d6ccff', { glow: '#b49cff', ei: 1.5 }), iris: '#6ff0ff', eyeGlow: '#5fe8ff', nose: '#1a1838' });
    swarm(b, b.model, 24, '#cbb8ff', 0.06, (s, t, o) => {
      const life = (t * 0.2 + s[0]) % 1;
      o[0] = (s[1] - 0.5) * 0.6;
      o[1] = q.bodyY + 0.2 + life * 0.8;
      o[2] = (s[2] - 0.5) * 1.2;
      o[3] = Math.sin(life * Math.PI);
    });
    b.on((t) => {
      gt.map.offset.x = t * 0.01;
      gt.stars.offset.x = t * 0.015;
    });
  },

  singularity(b) {
    const g = b.group(b.model);
    const gt = galaxyTex(b, 260, 300, '#100c22');
    const shell = b.mat('#2a2050', { metal: 0.6, rough: 0.2, coat: 1, irid: 1, emap: gt.stars, glow: '#9a8cff', ei: 0.5 });
    const under = b.mat('#151020', { rough: 0.5, surf: 'short', ns: 0.3 });
    const legM = b.mat('#1d1830', { rough: 0.35, coat: 0.6, metal: 0.3 });
    const glowP = b.mat('#d0b8ff', { glow: '#b49cff', ei: 2 });
    b.ball(g, under, [0, 0.36, 0], [0.34, 0.2, 0.55]);
    for (const sx of [1, -1]) b.ball(g, shell, [sx * 0.16, 0.45, -0.08], [0.2, 0.2, 0.5], [0, 0, -sx * 0.12]);
    b.limb(g, b.mat('#0a0812'), [0, 0.65, 0.35], [0, 0.6, -0.5], 0.008, 0.008, false);
    b.ball(g, shell, [0, 0.44, 0.42], [0.27, 0.17, 0.18]);
    b.ball(g, under, [0, 0.37, 0.6], [0.15, 0.11, 0.12]);
    b.taper(g, shell, [[0, 0.46, 0.55], [0, 0.62, 0.72], [0, 0.82, 0.7]], 0.05, 0.012);
    for (const sx of [1, -1]) {
      b.ball(g, glowP, [sx * 0.11, 0.4, 0.66], 0.035);
      b.taper(g, legM, [[sx * 0.06, 0.32, 0.68], [sx * 0.1, 0.3, 0.78], [sx * 0.03, 0.29, 0.84]], 0.02, 0.008);
      const ant = [[sx * 0.06, 0.44, 0.66], [sx * 0.16, 0.6, 0.8], [sx * 0.28, 0.72, 0.85]];
      b.taper(g, legM, ant, 0.012, 0.008);
      b.ball(g, glowP, ant[2], 0.025);
      for (const z of [0.3, 0.05, -0.22]) {
        const hip = [sx * 0.25, 0.3, z], knee = [sx * 0.48, 0.42, z + 0.04], foot = [sx * 0.62, 0.02, z + 0.08];
        b.limb(g, legM, hip, knee, 0.035, 0.028);
        b.limb(g, legM, knee, foot, 0.028, 0.015);
      }
    }
    const hole = b.group(g, [0, 0.98, -0.05]);
    b.ball(hole, b.track(new THREE.MeshBasicMaterial({ color: '#000000' })), [0, 0, 0], 0.17);
    const diskTex = b.ctex(256, 256, (ctx, s) => {
      const gr = ctx.createRadialGradient(s / 2, s / 2, s * 0.2, s / 2, s / 2, s / 2);
      gr.addColorStop(0, 'rgba(255,255,255,1)');
      gr.addColorStop(0.15, 'rgba(255,200,120,0.95)');
      gr.addColorStop(0.45, 'rgba(255,110,60,0.6)');
      gr.addColorStop(0.75, 'rgba(160,80,255,0.35)');
      gr.addColorStop(1, 'rgba(80,40,200,0)');
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, s, s);
      ctx.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 60; i++) {
        ctx.strokeStyle = `rgba(0,0,0,${0.15 + b.rnd() * 0.3})`;
        ctx.lineWidth = 1 + b.rnd() * 2;
        ctx.beginPath();
        ctx.arc(s / 2, s / 2, s * (0.22 + b.rnd() * 0.28), b.rnd() * TAU, b.rnd() * TAU);
        ctx.stroke();
      }
    });
    const disk = b.place(new THREE.Mesh(b.track(new THREE.RingGeometry(0.2, 0.55, 96)), b.basic('#ffffff', { map: diskTex, double: true })), hole, null, null, [-Math.PI / 2 + 0.4, 0, 0]);
    disk.userData.nofit = true;
    b.torus(hole, b.basic('#ffe8c8'), [0, 0, 0], 0.185, 0.008, [0.2, 0, 0]);
    hole.add(glowSprite('#b49cff', 1.5, 0.6));
    swarm(b, hole, 40, '#ffd0a0', 0.05, (s, t, o) => {
      const life = (t * (0.3 + s[0] * 0.3) + s[1]) % 1, r = 0.62 * (1 - life) + 0.18, a = s[2] * TAU + life * 7;
      const p = new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r).applyAxisAngle(new THREE.Vector3(1, 0, 0), 0.4);
      o[0] = p.x;
      o[1] = p.y;
      o[2] = p.z;
      o[3] = Math.sin(life * Math.PI);
    });
    b.on((t) => (disk.rotation.z = t * 0.8));
  },

  sternbild(b) {
    const gt = galaxyTex(b, 220, 250, '#0a1236');
    const body = b.mat('#1c2a6a', { rough: 0.4, glow: '#3a5cff', ei: 0.5, emap: gt.stars, opacity: 0.82, coat: 1 });
    const q = quad(b, { furMat: body, len: 0.9, bodyR: 0.25, bodyW: 0.23, legH: 0.32, legR: 0.06, headR: 0.3, headW: 1.05, snoutL: 0.09, snoutR: 0.1, ear: 'pointy', earS: 1.1, innerEar: '#4a6cff', tail: 'thin', tailL: 0.8, tailR: 0.045, iris: '#9fd8ff', eyeGlow: '#6fc8ff', nose: '#9fd8ff', eyeS: 0.25, wag: 1.2, wagAmp: 0.2 });
    const { bodyW, bodyR, len, tailL, legH } = q.P, H = q.H, by = q.bodyY;
    const starM = b.mat('#ffffff', { glow: '#cfe4ff', ei: 2.5 });
    const lineM = b.basic('#9fc4ff', { opacity: 0.85 });
    const pts = {
      nape: [0, by + bodyR * 1.15, len * 0.3], back: [0, by + bodyR * 1.1, 0], rump: [0, by + bodyR * 1.05, -len * 0.32],
      tail1: [0, by + bodyR * 0.3 + tailL * 0.4, -len * 0.5 - tailL * 0.38], tail2: [0, by + bodyR * 0.3 + tailL * 0.95, -len * 0.5 - tailL * 0.3],
      fl: [bodyW * 0.62, 0.03, len * 0.36], fr: [-bodyW * 0.62, 0.03, len * 0.36], bl: [bodyW * 0.62, 0.03, -len * 0.3], br: [-bodyW * 0.62, 0.03, -len * 0.3],
      sh: [0, by - bodyR * 0.1, len * 0.42], hip: [0, by - bodyR * 0.1, -len * 0.36],
    };
    const stars = [];
    for (const p of Object.values(pts)) stars.push(b.octa(q.g, starM, p, 0.035, [0.025, 0.045, 0.025]));
    const L = (a, c) => b.limb(q.g, lineM, pts[a], pts[c], 0.006, 0.006, false);
    L('nape', 'back'); L('back', 'rump'); L('rump', 'tail1'); L('tail1', 'tail2'); L('nape', 'sh'); L('sh', 'fl'); L('sh', 'fr'); L('rump', 'hip'); L('hip', 'bl'); L('hip', 'br');
    for (const sx of [1, -1]) {
      const tip = [sx * H * 0.75, H * 1.15, -H * 0.1];
      stars.push(b.octa(q.head, starM, tip, 0.035, [0.025, 0.045, 0.025]));
      b.limb(q.head, lineM, [0, H * 0.95, 0], tip, 0.006, 0.006, false);
    }
    stars.push(b.octa(q.head, starM, [0, H * 0.95, 0], 0.035, [0.03, 0.05, 0.03]));
    swarm(b, b.model, 20, '#cfe4ff', 0.08, (s, t, o) => {
      o[0] = (s[0] - 0.5) * 1.6;
      o[1] = s[1] * 1.4;
      o[2] = (s[2] - 0.5) * 1.6;
      o[3] = Math.pow(0.5 + 0.5 * Math.sin(t * 2 + s[3] * 20), 3);
    });
    b.on((t) => stars.forEach((s, i) => s.scale.setScalar(0.03 * (0.8 + Math.pow(0.5 + 0.5 * Math.sin(t * 3 + i * 1.3), 3) * 0.8))));
  },

  hamster(b) {
    const g = b.group(b.model);
    const padM = b.mat('#2a1f4a', { metal: 0.6, rough: 0.3, glow: '#6a4cff', ei: 0.4 });
    b.cyl(g, padM, [0, 0.025, 0], 0.42, 0.48, 0.05, null, 48);
    b.torus(g, b.basic('#b49cff'), [0, 0.055, 0], 0.4, 0.012, [Math.PI / 2, 0, 0]);
    const beam = b.place(new THREE.Mesh(b.track(new THREE.CylinderGeometry(0.3, 0.42, 0.4, 32, 1, true)), b.basic('#8a6cff', { opacity: 0.12, double: true })), g, [0, 0.25, 0]);
    beam.userData.nofit = true;
    const fl = b.group(g, [0, 0.38, 0]);
    const fur = furMat(b, '#e6a35c'), white = furMat(b, '#fbf2e4'), pink = b.mat('#f2a0a8', { rough: 0.6, sheen: 0.4 });
    b.ball(fl, fur, [0, 0.38, -0.04], [0.42, 0.38, 0.42]);
    b.ball(fl, white, [0, 0.32, 0.1], [0.34, 0.3, 0.33]);
    b.ball(fl, fur, [0, 0.62, 0.18], [0.3, 0.26, 0.26]);
    for (const sx of [1, -1]) b.ball(fl, white, [sx * 0.2, 0.52, 0.27], [0.16, 0.14, 0.14]);
    b.ball(fl, white, [0, 0.55, 0.38], [0.1, 0.08, 0.06]);
    b.ball(fl, pink, [0, 0.6, 0.44], [0.032, 0.024, 0.02]);
    const eyes = [1, -1].map((sx) => b.eye(fl, [sx * 0.13, 0.68, 0.37], 0.055, '#140c0a', [sx * 0.45, 0.15, 0.88]));
    blink(b, eyes);
    for (const sx of [1, -1]) {
      const e = b.group(fl, [sx * 0.2, 0.84, 0.1]);
      b.ball(e, fur, [0, 0, 0], [0.08, 0.08, 0.04]);
      b.ball(e, pink, [0, 0, 0.02], [0.05, 0.05, 0.03]);
      b.ball(fl, pink, [sx * 0.06, 0.42, 0.44], [0.035, 0.03, 0.03]);
      b.ball(fl, pink, [sx * 0.18, 0.04, 0.2], [0.07, 0.035, 0.09]);
    }
    whiskers(b, fl, [0.05, 0.57, 0.42], 0.2);
    const seedM = b.mat('#3a3436', { rough: 0.5 });
    b.ball(fl, seedM, [0, 0.44, 0.48], [0.03, 0.02, 0.05], [0.5, 0, 0]);
    const list = [];
    for (let i = 0; i < 6; i++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), seedM);
      b.track(s.geometry);
      s.scale.set(0.035, 0.022, 0.06);
      list.push([s, 0.72, 0.9, (i / 6) * TAU]);
    }
    const mk = (c, r, o = {}) => {
      const m = new THREE.Mesh(b.track(new THREE.SphereGeometry(r, 24, 16)), b.mat(c, { rough: 0.6, glow: c, ei: 0.25, ...o }));
      return m;
    };
    const ringed = mk('#ffb86a', 0.07);
    ringed.add(new THREE.Mesh(b.track(new THREE.RingGeometry(0.1, 0.15, 48)), b.basic('#ffe0b0', { double: true, opacity: 0.7 })));
    ringed.children[0].rotation.x = 1.2;
    list.push([mk('#6ad0ff', 0.05), 0.9, 0.5, 1], [ringed, 0.95, 0.4, 3.5], [mk('#b8b0c8', 0.04, { surf: 'stone' }), 0.62, -0.7, 2]);
    const orb = orbiters(b, fl, list, 0.4, 0.4);
    b.torus(orb, b.basic('#8a6cff', { opacity: 0.5 }), [0, 0, 0], 0.72, 0.006, [Math.PI / 2, 0, 0]);
    b.on((t) => {
      fl.position.y = 0.38 + Math.sin(t * 1.4) * 0.05;
      fl.rotation.z = Math.sin(t * 0.7) * 0.08;
      fl.rotation.x = Math.sin(t * 0.9) * 0.05;
    });
  },

  komet(b) {
    const q = lizard(b, { color: '#3346c8', belly: '#9ad8ff', iris: '#bff4ff', eyeGlow: '#7fe8ff', len: 0.95, tailL: 1.15 });
    const flame = b.basic('#7fe8ff', { opacity: 0.8 });
    const crest = [];
    for (let i = 0; i < 9; i++) {
      const z = q.P.len * 0.45 - (i / 8) * q.P.len * 0.95;
      const f = b.cone(q.body, flame, [0, q.P.bodyR * 0.8, z], 0.04, 0.16 + Math.sin((i / 8) * Math.PI) * 0.1, [-0.5, 0, 0]);
      f.userData.nofit = true;
      crest.push(f);
    }
    for (let i = 0; i < 3; i++) {
      const f = b.cone(q.head, flame, [0, q.H * 0.6, -q.H * 0.2 - i * 0.06], 0.035, 0.14, [-0.6, 0, 0]);
      f.userData.nofit = true;
      crest.push(f);
    }
    spots(b, q.body, b.mat('#bff4ff', { glow: '#7fe8ff', ei: 1.5 }), [q.P.bodyW, q.P.bodyR, q.P.len / 2], [0, 0, 0], 12, 0.025, 0.2, 0.5);
    const c = q.tailMesh.userData.curve, e = c.getPointAt(1);
    const core = b.ball(q.tail, b.mat('#ffffff', { glow: '#bff4ff', ei: 3 }), [e.x, e.y + 0.04, e.z], 0.07);
    const cg = glowSprite('#7fe8ff', 0.8, 0.9);
    cg.position.copy(core.position);
    q.tail.add(cg);
    swarm(b, q.tail, 40, '#9ff0ff', 0.08, (s, t, o) => {
      const life = (t * (0.6 + s[0] * 0.5) + s[1]) % 1;
      o[0] = e.x + (s[2] - 0.5) * 0.15 * life + Math.sin(t * 3 + s[3] * 9) * 0.03;
      o[1] = e.y + 0.04 + life * 0.25 + (s[3] - 0.5) * 0.1 * life;
      o[2] = e.z - life * 0.7;
      o[3] = 1 - life;
    });
    b.on((t) => crest.forEach((f, i) => f.scale.set(1, 0.7 + Math.sin(t * 9 + i * 1.3) * 0.25, 1)));
  },

  ringgleiter(b) {
    const g = b.group(b.model);
    const padM = b.mat('#1e1840', { metal: 0.6, rough: 0.3, glow: '#6a4cff', ei: 0.5 });
    b.cyl(g, padM, [0, 0.025, 0], 0.5, 0.55, 0.05, null, 48);
    const fl = b.group(g, [0, 1.0, 0]);
    const gt = galaxyTex(b, 200, 290, '#0a0a2a');
    const skin = b.mat('#ffffff', { map: gt.map, emap: gt.stars, glow: '#ffffff', ei: 0.9, rough: 0.35, coat: 1, double: true });
    const belly = b.mat('#d8d0ff', { rough: 0.5, glow: '#6a5cff', ei: 0.35 });
    const edgeM = b.mat('#bff4ff', { glow: '#7fe8ff', ei: 2.2 });
    b.ball(fl, skin, [0, 0, 0], [0.32, 0.14, 0.62]);
    b.ball(fl, belly, [0, -0.05, 0.02], [0.26, 0.09, 0.52]);
    b.ball(fl, skin, [0, 0.08, -0.05], [0.18, 0.1, 0.35]);
    for (const sx of [1, -1]) {
      b.taper(fl, skin, [[sx * 0.12, 0, 0.5], [sx * 0.17, -0.02, 0.72], [sx * 0.12, -0.07, 0.84]], 0.055, 0.02);
      b.eye(fl, [sx * 0.25, 0.04, 0.38], 0.05, '#7fe8ff', [sx * 0.6, 0.2, 0.75], { glow: '#5fe0ff' });
    }
    const shape = new THREE.Shape();
    shape.moveTo(0, 0.5);
    shape.quadraticCurveTo(0.6, 0.38, 1.3, -0.12);
    shape.quadraticCurveTo(0.75, -0.18, 0.38, -0.52);
    shape.lineTo(0, -0.45);
    shape.closePath();
    const wings = [1, -1].map((s) => {
      const wp = b.group(fl, [s * 0.24, 0, 0.05]);
      const m = b.extrude(wp, skin, shape, 0.03, [0, 0, 0], [Math.PI / 2, 0, 0], [s, 1, 1], 0.02);
      const edge = [];
      for (let i = 0; i <= 16; i++) {
        const k = i / 16, x = 2 * k * (1 - k) * 0.6 + k * k * 1.3, y = 0.5 * (1 - k) * (1 - k) + 2 * k * (1 - k) * 0.38 - 0.12 * k * k;
        edge.push([s * x, 0.02, y]);
      }
      b.taper(wp, edgeM, edge, 0.018, 0.008, { seg: 40, radial: 8 });
      for (let i = 0; i < 5; i++) b.ball(wp, edgeM, [s * (0.3 + i * 0.17), 0.025, 0.1 - i * 0.03], 0.02);
      return [wp, s];
    });
    const tail = b.taper(fl, skin, [[0, 0, -0.58], [0, 0.03, -1.0], [0, 0.1, -1.45]], 0.045, 0.008);
    const te = tail.userData.curve.getPointAt(1);
    b.extrude(fl, edgeM, starShape(0.07), 0.015, [te.x, te.y, te.z], [0, 0, 0], null, 0.005);
    // Planetenring
    const ringTex = b.ctex(512, 512, (ctx, s) => {
      const c = s / 2;
      for (let r = c * 0.69; r < c; r += 2) {
        const k = (r - c * 0.69) / (c * 0.31);
        ctx.strokeStyle = `hsla(${200 + k * 80},80%,${60 + Math.sin(r * 0.3) * 15}%,${0.25 + 0.45 * Math.abs(Math.sin(r * 0.11))})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(c, c, r, 0, TAU);
        ctx.stroke();
      }
    });
    const plane = b.group(fl, [0, 0, 0], [Math.PI / 2 - 0.35, 0, 0.2]);
    plane.userData.nofit = true;
    const ring = b.place(new THREE.Mesh(b.track(new THREE.RingGeometry(1.15, 1.65, 160)), b.basic('#ffffff', { map: ringTex, double: true })), plane);
    const moons = [['#ffb86a', 0.08, 1.4, 0.5, 0], ['#7fe8ff', 0.06, 1.55, 0.35, 2.5]].map(([c, r, R, sp, ph]) => {
      const m = b.ball(plane, b.mat(c, { glow: c, ei: 0.5, rough: 0.6 }), [0, 0, 0], r);
      return [m, R, sp, ph];
    });
    b.on((t) => {
      fl.position.y = 1.0 + Math.sin(t * 1.2) * 0.07;
      fl.rotation.z = Math.sin(t * 0.8) * 0.08;
      wings.forEach(([w, s]) => (w.rotation.z = s * Math.sin(t * 1.6) * 0.32));
      ring.rotation.z = t * 0.08;
      moons.forEach(([m, R, sp, ph]) => m.position.set(Math.cos(t * sp + ph) * R, Math.sin(t * sp + ph) * R, 0));
      gt.map.offset.x = t * 0.01;
    });
  },

  nebelwelpe(b) {
    const gt = galaxyTex(b, 300, 190, '#2a0a3a');
    const neb = b.mat('#ffffff', { map: gt.map, emap: gt.stars, glow: '#ffffff', ei: 1.1, rough: 0.5, sheen: 1, sheenColor: '#ff9cf0' });
    const q = quad(b, { furMat: neb, len: 0.85, bodyR: 0.3, bodyW: 0.29, legH: 0.3, legR: 0.08, headR: 0.36, headW: 1.05, snoutL: 0.16, snoutR: 0.14, ear: 'floppy', earS: 1.0, earColor: null, tail: 'thin', tailL: 0.45, tailR: 0.07, iris: '#7fe8ff', eyeGlow: '#9ff0ff', eyeS: 0.24, nose: '#2a0a3a', wag: 7, wagAmp: 0.5 });
    const cl = collar(b, q, '#ffd76a', null, 0.6);
    const star = b.extrude(q.g, b.mat('#ffe08a', { glow: '#ffcf4d', ei: 1.8, metal: 1, rough: 0.2 }), starShape(0.075), 0.02, [cl.pos.x, cl.pos.y - 0.03, cl.pos.z + 0.01], [0, 0, 0], null, 0.008);
    star.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), cl.perp);
    const wisp = b.basic('#ff7ae8', { opacity: 0.35 });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU;
      const w = b.ball(q.g, wisp, [Math.cos(a) * 0.4, 0.05, Math.sin(a) * 0.5], [0.22, 0.07, 0.22]);
      w.userData.nofit = true;
    }
    const clouds = ['#ff6ae0', '#6ad8ff', '#a87aff', '#ff6ae0', '#6ad8ff', '#a87aff'].map((c, i) => {
      const s = glowSprite(c, 1.4 + (i % 3) * 0.3, 0.22);
      b.fx.add(s);
      return s;
    });
    const list = [['#ffb86a', 0.07], ['#7fe8ff', 0.05], ['#ff8ae8', 0.06]].map(([c, r], i) => [new THREE.Mesh(b.track(new THREE.SphereGeometry(r, 20, 14)), b.mat(c, { glow: c, ei: 0.5, rough: 0.6 })), 0.85 + i * 0.12, 0.5 - i * 0.12, i * 2]);
    orbiters(b, q.g, list, 0.3, 0.75);
    swarm(b, q.head, 22, '#ffffff', 0.07, (s, t, o) => {
      const a = s[0] * TAU, r = 0.45 + s[1] * 0.3;
      o[0] = Math.cos(a) * r;
      o[1] = (s[2] - 0.3) * 0.6;
      o[2] = Math.sin(a) * r * 0.6;
      o[3] = Math.pow(Math.max(0, Math.sin(t * 1.5 + s[3] * 20)), 6);
    });
    b.on((t) => {
      clouds.forEach((c, i) => {
        const a = (i / 6) * TAU + t * 0.15;
        c.position.set(Math.cos(a) * 0.9, -0.3 + Math.sin(t * 0.4 + i) * 0.4, Math.sin(a) * 0.6);
      });
      gt.map.offset.x = t * 0.012;
      gt.stars.offset.y = t * 0.01;
    });
  },
};
