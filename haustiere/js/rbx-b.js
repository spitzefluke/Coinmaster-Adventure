// Roblox-Stil: Haustiere aus Engels Egg und Galaxie Egg
import { THREE, TAU, glowSprite, darken, lighten } from './kit.js';
import { swarm, halo, galaxyTex } from './templates.js';
import { blk, sblk, pl, neon, gold, ink, glass, face, chain, quadR, lizardR, birdR, crown, blockWings, sparkle } from './rbx-kit.js';

const hover = (b, g, amp = 0.05, base = 0.08, sp = 1.4) => {
  const ph = b.rnd() * 6;
  b.on((t) => (g.position.y = base + Math.sin(t * sp + ph) * amp));
};

function biped(b, o) {
  const P = { skin: '#ffd9b8', robe: '#ffffff', trim: '#f2c14e', hair: '#f6d27a', body: [0.5, 0.56, 0.42], head: [0.56, 0.5, 0.48], ...o };
  const g = b.group(b.model), bob = b.group(g);
  const skin = pl(b, P.skin, { sheen: 0.5 }), robe = pl(b, P.robe, { sheen: 1, sheenColor: '#fff6dd', rough: 0.55 }), trim = gold(b);
  const [bw, bh, bd] = P.body, [hw, hh, hd] = P.head;
  for (const sx of [1, -1]) sblk(b, bob, skin, [sx * 0.1, 0.05, 0.04], [0.12, 0.1, 0.16]);
  const body = b.group(bob, [0, 0.08 + bh / 2, 0]);
  sblk(b, body, robe, [0, 0, 0], [bw, bh, bd], null, 0.3, 0.78);
  sblk(b, body, trim, [0, -bh / 2 + 0.03, 0], [bw + 0.02, 0.05, bd + 0.02], null, 0.4);
  sblk(b, body, trim, [0, bh * 0.1, bd * 0.4], [0.06, bh * 0.7, 0.04], null, 0.4);
  const arms = [1, -1].map((sx) => {
    const a = b.group(body, [sx * bw * 0.38, bh * 0.3, 0]);
    sblk(b, a, robe, [sx * 0.04, -0.12, 0], [0.12, 0.26, 0.13], [0, 0, sx * 0.15]);
    sblk(b, a, skin, [sx * 0.07, -0.27, 0.01], [0.1, 0.09, 0.1]);
    return [a, sx];
  });
  const head = b.group(bob, [0, 0.08 + bh + hh * 0.42, 0.02]);
  sblk(b, head, skin, [0, 0, 0], [hw, hh, hd], null, 0.32);
  const eyes = face(b, head, { y: -hh * 0.02, z: hd / 2, gap: hw * 0.2, s: hh * 0.15, iris: P.iris ?? '#3a7be0', mouth: 'smile', mouthY: -hh * 0.26, mouthS: 0.025 });
  return { g, bob, body, head, arms, eyes, skin, robe, trim, bw, bh, bd, hw, hh, hd, P };
}

export const BUILDERS = {
  // ── Engels Egg ──
  engelshund(b) {
    const q = quadR(b, { color: '#fbf3e4', belly: '#ffffff', muzzle: '#ffffff', ear: 'floppy', earColor: '#f1dcb8', tail: 'thin', tailL: 0.34, wag: 8, wagAmp: 0.45, iris: '#4a8ad8', matO: { sheen: 1, sheenColor: '#fff3d0' } });
    halo(b, q.head, [0, q.hh / 2 + 0.14, -0.02], 0.17);
    blockWings(b, q.body, [q.bw / 2 - 0.02, q.bh * 0.3, 0.05], 0.55, { tip: '#ffe9a8' });
    sblk(b, q.head, pl(b, '#ff7a90'), [0, q.sy - q.sh * 0.55, q.front - 0.02], [q.sw * 0.3, 0.03, 0.08], [0.6, 0, 0], 0.45);
  },

  engelskatze(b) {
    const q = quadR(b, { color: '#ffffff', body: [0.52, 0.44, 0.78], leg: [0.14, 0.24, 0.15], head: [0.74, 0.6, 0.56], snout: [0.3, 0.16, 0.08], ear: 'pointy', earS: 1.15, inner: '#ffd0dc', tail: 'thin', tailL: 0.6, tailW: 0.09, tailUp: 1.1, tailCurl: 0.2, wag: 1.4, wagAmp: 0.3, eye: 'cat', iris: '#5ab8ff', nose: '#ffa0b4', tipColor: '#ffe9a8', matO: { sheen: 1, sheenColor: '#fff3d0' } });
    halo(b, q.head, [0, q.hh / 2 + 0.16, -0.02], 0.17);
    blockWings(b, q.body, [q.bw / 2 - 0.02, q.bh * 0.3, 0.02], 0.55, { tip: '#ffe9a8' });
    hover(b, q.g, 0.05, 0.1);
  },

  adler(b) {
    const q = birdR(b, { color: '#6a4426', headColor: '#fbf8f2', belly: '#7a5232', beak: '#ffc62e', legs: '#ffc62e', iris: '#e0a020', brow: 0.3, tip: '#f2c14e', tipMat: gold(b), wingL: 0.44, beakL: 0.22, tail: 5, eyeS: 0.15, blush: null, wingColor: '#5a361c' });
    sblk(b, q.body, pl(b, '#fbf8f2'), [0, q.bh / 2 - 0.04, 0.06], [q.bw * 0.8, 0.1, q.bl * 0.6], null, 0.45);
  },

  engelsfuchs(b) {
    const q = quadR(b, { color: '#fbe9cf', belly: '#ffffff', muzzle: '#ffffff', body: [0.52, 0.46, 0.84], leg: [0.14, 0.24, 0.15], head: [0.72, 0.58, 0.54], snout: [0.3, 0.18, 0.2], ear: 'pointy', earS: 1.2, inner: '#ffd9a8', tail: 'bushy', tailL: 0.7, tailW: 0.17, tailUp: 0.35, tipColor: '#fff4c8', iris: '#d89a2a', wag: 2, wagAmp: 0.3, matO: { sheen: 1, sheenColor: '#fff3d0' } });
    const last = q.tailSegs[q.tailSegs.length - 1];
    last.children[0].material = neon(b, '#fff1b0', 1.4);
    const gl = sparkle(b, last, [0, 0, -0.14], '#ffe9a8', 0.8);
    halo(b, q.head, [0, q.hh / 2 + 0.14, -0.02], 0.15);
    b.on((t) => (gl.material.opacity = 0.6 + Math.sin(t * 2.4) * 0.25));
  },

  engel(b) {
    const q = biped(b, {});
    const hair = pl(b, '#f6c94e', { sheen: 1, sheenColor: '#fff2a0' });
    const { head, hh, hw, hd } = q;
    for (let i = 0; i < 9; i++) { const a = (i / 8) * Math.PI; sblk(b, head, hair, [Math.cos(a) * hw * 0.44, hh * 0.36 + Math.sin(a) * hh * 0.18, -hd * 0.05], [0.14, 0.14, hd * 0.9], null, 0.48); }
    sblk(b, head, hair, [0, hh * 0.1, -hd * 0.42], [hw * 0.9, hh * 0.7, 0.12], null, 0.45);
    for (const sx of [1, -1]) sblk(b, head, hair, [sx * hw * 0.32, hh * 0.38, hd * 0.36], [0.1, 0.08, 0.1], null, 0.48);
    halo(b, head, [0, hh / 2 + 0.16, 0], 0.18);
    blockWings(b, q.body, [q.bw * 0.3, q.bh * 0.25, -q.bd / 2], 0.6, { tip: '#ffe9a8' });
    const harp = b.group(q.arms[0][0], [0.1, -0.3, 0.1]);
    b.torus(harp, gold(b), [0, 0.08, 0], 0.09, 0.012, [0, Math.PI / 2, 0], Math.PI * 1.3);
    for (let i = 0; i < 4; i++) blk(b, harp, neon(b, '#fff4c8', 0.8), [0, 0.06, -0.05 + i * 0.03], [0.004, 0.12, 0.004], 0.002);
    hover(b, q.g, 0.05, 0.12);
    b.on((t) => q.arms[1][0].rotation.z = -0.3 - Math.sin(t * 2) * 0.2);
  },

  gott(b) {
    const g = b.group(b.model);
    const cloud = pl(b, '#ffffff', { rough: 0.8, sheen: 1, sheenColor: '#e6efff' });
    for (const [x, y, z, s] of [[0, 0.12, 0, 0.5], [0.34, 0.1, 0.06, 0.34], [-0.34, 0.1, 0.04, 0.36], [0.16, 0.12, 0.3, 0.3], [-0.18, 0.1, 0.28, 0.3], [0.1, 0.1, -0.3, 0.32], [-0.2, 0.14, -0.22, 0.3]]) sblk(b, g, cloud, [x, y, z], [s * 1.3, s * 0.7, s * 1.1], null, 0.48);
    const bob = b.group(g, [0, 0.26, 0]);
    const robe = pl(b, '#fbf8f2', { sheen: 1, sheenColor: '#fff2c8', rough: 0.55 }), skin = pl(b, '#f2c8a0'), beard = pl(b, '#f4f4f8', { rough: 0.7, sheen: 1 });
    const body = b.group(bob, [0, 0.3, 0]);
    sblk(b, body, robe, [0, 0, 0], [0.62, 0.6, 0.48], null, 0.3, 0.8);
    sblk(b, body, gold(b), [0, 0.02, 0.24], [0.62, 0.06, 0.04], null, 0.4);
    sblk(b, body, pl(b, '#7a3ad8', { sheen: 1 }), [0.18, 0.05, 0], [0.12, 0.62, 0.5], [0, 0, -0.5], 0.4);
    const head = b.group(bob, [0, 0.82, 0.02]);
    sblk(b, head, skin, [0, 0, 0], [0.5, 0.46, 0.44], null, 0.32);
    sblk(b, head, beard, [0, 0.2, -0.04], [0.54, 0.12, 0.48], null, 0.45);
    sblk(b, head, beard, [0, -0.18, 0.18], [0.44, 0.34, 0.14], null, 0.4, 1.0);
    for (let i = 0; i < 3; i++) sblk(b, head, beard, [(i - 1) * 0.12, -0.38, 0.2], [0.12, 0.18, 0.1], null, 0.45, 0.6);
    sblk(b, head, beard, [0, -0.03, 0.235], [0.28, 0.05, 0.04], null, 0.45);
    face(b, head, { y: 0.06, z: 0.22, gap: 0.1, s: 0.065, iris: '#5ab8ff', mouth: 'none', brow: 0.15, blush: null });
    crown(b, head, [0, 0.22, 0], 0.95, { gems: ['#5ab8ff', '#ffffff'] });
    const sun = b.group(bob, [0, 0.86, -0.36]);
    const sm = b.mat('#ffd36a', { metal: 1, rough: 0.2, glow: '#ffb020', ei: 0.9 });
    b.cyl(sun, sm, [0, 0, 0], 0.42, 0.42, 0.04, [Math.PI / 2, 0, 0], 48);
    for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU; blk(b, sun, sm, [Math.cos(a) * 0.54, Math.sin(a) * 0.54, 0], [0.06, i % 2 ? 0.14 : 0.22, 0.03], 0.01, [0, 0, a - Math.PI / 2], 0.2); }
    const sg = glowSprite('#ffd36a', 2.2, 0.5); sun.add(sg);
    const sc = b.group(bob, [0.4, 0.4, 0.12], [0, 0, -0.1]);
    b.cyl(sc, gold(b), [0, 0.2, 0], 0.025, 0.025, 0.8, null, 16);
    b.ball(sc, b.mat('#bff4ff', { rough: 0.02, coat: 1, glow: '#4fc8ff', ei: 1.2, irid: 0.6 }), [0, 0.64, 0], 0.08);
    sblk(b, sc, skin, [-0.04, 0.2, 0.02], [0.1, 0.1, 0.1]);
    b.on((t) => { sun.rotation.z = t * 0.2; bob.position.y = 0.26 + Math.sin(t * 1.1) * 0.03; });
  },

  loewe(b) {
    const q = quadR(b, { color: '#e3a94a', belly: '#f6dca6', muzzle: '#f6dca6', body: [0.68, 0.56, 1.0], leg: [0.2, 0.3, 0.21], head: [0.66, 0.58, 0.54], snout: [0.36, 0.24, 0.18], ear: 'round', earS: 0.6, tail: 'tuft', tailL: 0.5, tailW: 0.1, tailUp: -0.1, tipColor: '#a8571e', iris: '#e0a020', brow: 0.2, wag: 1.4, wagAmp: 0.3 });
    const mane = pl(b, '#b05a1c', { rough: 0.6, sheen: 1, sheenColor: '#ffb060' });
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * TAU;
      sblk(b, q.head, mane, [Math.cos(a) * q.hw * 0.56, Math.sin(a) * q.hh * 0.6 + 0.02, -q.hd * 0.2], [0.2, 0.2, 0.3], [0, 0, a], 0.42);
    }
    sblk(b, q.head, mane, [0, 0, -q.hd * 0.4], [q.hw * 1.2, q.hh * 1.2, 0.16], null, 0.42);
    const ar = gold(b), gem = b.mat('#e3263f', { rough: 0.05, coat: 1, flat: true, glow: '#e3263f', ei: 0.4 });
    sblk(b, q.body, ar, [0, q.bh / 2 - 0.01, 0.02], [q.bw * 0.86, 0.07, q.bl * 0.6], null, 0.4);
    for (const z of [-0.2, 0, 0.2]) sblk(b, q.body, ar, [0, q.bh / 2 + 0.035, z], [q.bw * 0.5, 0.04, 0.12], null, 0.4);
    sblk(b, q.body, ar, [0, 0, q.bl / 2 - 0.02], [q.bw * 0.6, q.bh * 0.5, 0.06], null, 0.4);
    b.octa(q.body, gem, [0, 0.02, q.bl / 2 + 0.02], 0.05, [0.05, 0.07, 0.03]);
    sblk(b, q.head, ar, [0, q.hh / 2 + 0.01, 0.02], [q.hw * 0.5, 0.06, q.hd * 0.6], null, 0.4);
    blockWings(b, q.body, [q.bw / 2 - 0.02, q.bh * 0.35, 0.08], 0.95, { tip: '#f2c14e', tipMat: gold(b), base: 0.4, speed: 2 });
  },

  // ── Galaxie Egg ──
  galaxiewolf(b) {
    const gx = galaxyTex(b, 240, 300);
    const M = b.mat('#ffffff', { map: gx.map, emap: gx.stars, glow: '#ffffff', ei: 1.1, rough: 0.35, coat: 0.7 });
    const q = quadR(b, { mat: M, headMat: M, color: '#2a1f5a', body: [0.6, 0.52, 0.94], leg: [0.16, 0.3, 0.17], head: [0.68, 0.56, 0.56], snout: [0.32, 0.2, 0.24], muzzle: '#b8a8ff', ear: 'pointy', earS: 1.2, inner: '#ff8ee8', tail: 'bushy', tailL: 0.7, tailW: 0.16, tailUp: 0.25, eyeGlow: '#c6b4ff', brow: 0.2, wag: 1.5, wagAmp: 0.25, blush: '#ff8ee8' });
    b.on((t) => { gx.map.offset.set(t * 0.01, t * 0.004); gx.stars.offset.set(-t * 0.006, t * 0.01); });
  },

  singularity(b) {
    const g = b.group(b.model), bob = b.group(g);
    const shell = b.mat('#3a2a7a', { rough: 0.15, coat: 1, coatRough: 0.05, irid: 0.9, metal: 0.3 });
    const legM = pl(b, '#1e1838');
    const body = b.group(bob, [0, 0.26, 0]);
    sblk(b, body, shell, [0, 0, 0], [0.62, 0.32, 0.74], null, 0.42, 0.8);
    blk(b, body, ink(b), [0, 0.12, -0.02], [0.012, 0.1, 0.72], 0.005);
    const head = b.group(bob, [0, 0.24, 0.42]);
    sblk(b, head, legM, [0, 0, 0], [0.4, 0.26, 0.24], null, 0.4);
    face(b, head, { y: 0.03, z: 0.12, gap: 0.1, s: 0.06, glow: '#b49cff', mouth: 'none', blush: null });
    for (const sx of [1, -1]) {
      blk(b, head, legM, [sx * 0.08, -0.08, 0.16], [0.04, 0.04, 0.12], 0.015, [0, -sx * 0.4, 0], 1, 1);
      const an = b.group(head, [sx * 0.1, 0.12, 0.04], [-0.4, 0, -sx * 0.4]);
      sblk(b, an, legM, [0, 0.12, 0], [0.025, 0.24, 0.025], null, 0.45);
      b.ball(an, neon(b, '#b49cff', 2), [0, 0.25, 0], 0.03);
      for (const z of [0.22, 0, -0.22]) {
        const l = b.group(bob, [sx * 0.28, 0.2, z], [0, 0, -sx * 0.5]);
        sblk(b, l, legM, [sx * 0.08, 0, 0], [0.18, 0.05, 0.05], null, 0.45);
        sblk(b, l, legM, [sx * 0.17, -0.1, 0], [0.05, 0.2, 0.05], [0, 0, sx * 0.4], 0.45);
      }
    }
    const hole = b.group(bob, [0, 0.62, -0.02]);
    b.ball(hole, b.mat('#000000', { rough: 1 }), [0, 0, 0], 0.12);
    const disk = b.torus(hole, b.basic('#ffb060', { opacity: 0.9 }), [0, 0, 0], 0.2, 0.035, [Math.PI / 2 - 0.3, 0, 0]);
    const disk2 = b.torus(hole, b.basic('#b49cff', { opacity: 0.7 }), [0, 0, 0], 0.27, 0.02, [Math.PI / 2 - 0.3, 0, 0]);
    hole.add(glowSprite('#b49cff', 0.9, 0.6));
    swarm(b, hole, 30, '#ffd0a0', 0.05, (s, t, o) => {
      const k = (t * (0.3 + s[0] * 0.3) + s[1]) % 1, r = 0.45 * (1 - k) + 0.13, a = s[2] * TAU + k * 8;
      o[0] = Math.cos(a) * r; o[1] = Math.sin(a) * r * 0.3; o[2] = Math.sin(a) * r; o[3] = k;
    });
    b.on((t) => { disk.rotation.z = t * 2; disk2.rotation.z = -t * 1.3; hole.position.y = 0.62 + Math.sin(t * 1.5) * 0.03; });
  },

  sternbild(b) {
    const M = b.mat('#1a1f4a', { rough: 0.1, coat: 1, glow: '#2a3a9a', ei: 0.45, opacity: 0.85 });
    const q = quadR(b, { mat: M, headMat: M, color: '#1a1f4a', body: [0.52, 0.44, 0.78], leg: [0.14, 0.24, 0.15], head: [0.74, 0.6, 0.56], snout: [0.3, 0.16, 0.08], muzzle: '#2a3478', ear: 'pointy', earS: 1.15, inner: '#6a8aff', tail: 'thin', tailL: 0.6, tailW: 0.09, tailUp: 1.1, tailCurl: 0.2, wag: 1.4, wagAmp: 0.3, eyeGlow: '#ffffff', nose: '#aee0ff', blush: '#6a8aff' });
    const star = neon(b, '#ffffff', 2.4), line = neon(b, '#aee0ff', 1.4);
    const link = (p, pts) => {
      pts.forEach((v, i) => {
        b.octa(p, star, v, 0.03, [0.03, 0.03, 0.03]);
        const s = glowSprite('#cfe8ff', 0.22, 0.85); s.position.set(...v); p.add(s);
        if (i) b.limb(p, line, pts[i - 1], v, 0.006, 0.006, false);
      });
    };
    for (const sx of [1, -1]) link(q.body, [[sx * 0.265, 0.12, 0.3], [sx * 0.265, 0.02, 0.05], [sx * 0.265, 0.14, -0.15], [sx * 0.265, -0.06, -0.32]]);
    link(q.body, [[0, 0.225, 0.3], [0.08, 0.225, 0.0], [-0.06, 0.225, -0.3]]);
    link(q.head, [[-0.2, 0.305, 0], [0, 0.305, 0.1], [0.2, 0.305, 0]]);
    q.tailSegs.forEach((s) => { const st = b.octa(s, star, [0, 0, 0], 0.025, [0.025, 0.025, 0.025]); });
    hover(b, q.g, 0.04, 0.06);
  },

  hamster(b) {
    const q = quadR(b, { color: '#e8a86a', belly: '#fff3e2', muzzle: '#fff3e2', body: [0.72, 0.6, 0.66], leg: [0.15, 0.12, 0.16], paw: '#ffc8c8', head: [0.82, 0.66, 0.6], snout: [0.26, 0.14, 0.06], ear: 'round', earS: 0.7, tail: 'stub', tailW: 0.1, iris: '#3a2410', nose: '#ff9fae', headUp: -0.06 });
    for (const sx of [1, -1]) sblk(b, q.head, pl(b, '#fff3e2'), [sx * q.hw * 0.46, -q.hh * 0.18, q.hd * 0.1], [0.22, 0.28, 0.36], null, 0.48);
    sblk(b, q.head, pl(b, '#ffffff'), [0, q.sy - q.sh * 0.6, q.front - 0.01], [0.06, 0.06, 0.02], null, 0.4);
    const orbit = b.group(q.g, [0, q.hy * 0.7, 0]);
    const items = [];
    for (let i = 0; i < 5; i++) {
      const it = b.group(orbit);
      if (i < 3) b.ball(it, b.mat(['#c8c8d8', '#b49cff', '#7ad7ff'][i], { rough: 0.6, surf: 'stone', ns: 0.5, glow: ['#555', '#6a4ad8', '#2a8ad8'][i], ei: 0.3 }), [0, 0, 0], 0.06 + (i % 2) * 0.02);
      else blk(b, it, pl(b, '#3a3030'), [0, 0, 0], [0.04, 0.1, 0.06], 0.02, null, 0.4);
      items.push(it);
    }
    b.on((t) => items.forEach((it, i) => {
      const a = t * (0.8 + i * 0.12) + (i / 5) * TAU, r = 0.62 + (i % 2) * 0.12;
      it.position.set(Math.cos(a) * r, Math.sin(a * 1.3 + i) * 0.12, Math.sin(a) * r);
      it.rotation.set(t + i, t * 1.4, 0);
    }));
  },

  komet(b) {
    const q = lizardR(b, { color: '#3a6fd8', belly: '#bfe8ff', iris: '#7ae8ff', eyeGlow: '#bff4ff', spikeMat: neon(b, '#7ae8ff', 1.4), tipColor: '#bff4ff', tailL: 1.1 });
    const last = q.tailSegs[q.tailSegs.length - 1];
    last.children[0].material = neon(b, '#bff4ff', 1.6);
    const tg = sparkle(b, last, [0, 0, -0.1], '#9ff0ff', 0.6);
    swarm(b, q.g, 40, '#bff4ff', 0.07, (s, t, o) => {
      const k = (t * (0.5 + s[0] * 0.4) + s[1]) % 1;
      o[0] = (s[2] - 0.5) * 0.3 * (1 + k); o[1] = 0.3 + (s[3] - 0.5) * 0.2 + k * 0.2; o[2] = -0.5 - k * 1.2; o[3] = 1 - k;
    });
  },

  ringgleiter(b) {
    const q = quadR(b, { color: '#7a5ad8', belly: '#e6dcff', muzzle: '#e6dcff', body: [0.56, 0.42, 0.84], leg: [0.14, 0.2, 0.15], head: [0.7, 0.58, 0.54], snout: [0.28, 0.16, 0.1], ear: 'round', earS: 0.9, inner: '#ff8ee8', tail: 'bushy', tailL: 0.6, tailW: 0.16, tailUp: 0.8, tipColor: '#e6dcff', iris: '#ff8ee8', eyeS: 0.18, nose: '#ff8ee8' });
    const mem = pl(b, '#9a7ae8', { sheen: 1, sheenColor: '#e6dcff' });
    for (const sx of [1, -1]) sblk(b, q.body, mem, [sx * (q.bw / 2 + 0.07), -q.bh * 0.15, 0], [0.16, 0.03, q.bl * 0.82], [0, 0, -sx * 0.25], 0.4);
    const ring = b.group(q.g, [0, q.by, 0], [0.4, 0, 0.2]);
    b.torus(ring, b.mat('#ffd9a0', { rough: 0.3, glow: '#ffb060', ei: 0.5, metal: 0.4 }), [0, 0, 0], 0.72, 0.035, [Math.PI / 2, 0, 0]);
    b.torus(ring, b.mat('#b49cff', { rough: 0.3, glow: '#b49cff', ei: 0.6 }), [0, 0, 0], 0.82, 0.02, [Math.PI / 2, 0, 0]);
    b.torus(ring, b.basic('#ffd9a0', { opacity: 0.25 }), [0, 0, 0], 0.77, 0.06, [Math.PI / 2, 0, 0], TAU, [1, 1, 0.15]);
    hover(b, q.g, 0.06, 0.12, 1.1);
    b.on((t) => { ring.rotation.y = t * 0.6; q.g.rotation.z = Math.sin(t * 0.9) * 0.08; });
  },

  nebelwelpe(b) {
    const gx = galaxyTex(b, 300, 200, '#1a0828');
    const M = b.mat('#ffffff', { map: gx.map, emap: gx.stars, glow: '#ffffff', ei: 1.1, rough: 0.35, coat: 0.7 });
    const q = quadR(b, { mat: M, headMat: M, color: '#5a2a7a', body: [0.56, 0.48, 0.74], leg: [0.16, 0.22, 0.17], head: [0.8, 0.66, 0.62], muzzle: '#ffb8e8', ear: 'floppy', earColor: '#ff8ee8', tail: 'thin', tailL: 0.34, wag: 9, wagAmp: 0.45, eyeGlow: '#ffd0f4', blush: '#ff8ee8' });
    b.on((t) => { gx.map.offset.set(-t * 0.012, t * 0.005); gx.stars.offset.set(t * 0.008, -t * 0.006); });
    swarm(b, q.g, 24, '#ffd0f4', 0.08, (s, t, o) => {
      const k = (t * (0.3 + s[0] * 0.2) + s[1]) % 1, a = s[2] * TAU;
      o[0] = Math.cos(a) * k * 0.4; o[1] = q.hy - 0.12 + k * 0.5; o[2] = q.hz + q.front + 0.1 + Math.sin(a) * k * 0.3; o[3] = Math.sin(k * Math.PI);
    });
  },
};
