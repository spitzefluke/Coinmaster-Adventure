// Roblox-Stil: Haustiere aus Normal Egg, Wald Egg und Eis Egg
import { THREE, TAU, glowSprite, darken, lighten } from './kit.js';
import { swarm } from './templates.js';
import { blk, sblk, pl, neon, gold, ink, glass, face, chain, quadR, lizardR, birdR, crown, topHat, collarR, cape } from './rbx-kit.js';

// Streifen über den Rücken (flache Platte, die Oberseite und Flanken umgreift)
export const stripe = (b, q, m, z, k = 0.55, t = 0.05) => sblk(b, q.body, m, [0, q.bh * (0.5 - k / 2) + 0.004, z], [q.bw + 0.014, q.bh * k, t], null, 0.4);
// Fleck auf der Flanke
export const patch = (b, q, m, x, y, z, w, h) => sblk(b, q.body, m, [x * (q.bw / 2 + 0.004), y, z], [0.02, h, w], null, 0.45);
const whisk = (b, head, x, y, z, len = 0.2) => {
  const m = b.mat('#f4f0ea', { rough: 0.4 });
  for (const sx of [1, -1]) for (let i = 0; i < 2; i++) blk(b, head, m, [sx * (x + len / 2), y - i * 0.03, z], [len, 0.008, 0.008], 0.004, [0, 0, sx * (0.12 - i * 0.24)]);
};

export const BUILDERS = {
  // ── Normal Egg ──
  hund(b) {
    const q = quadR(b, { color: '#c98a4b', belly: '#f6e1bd', ear: 'floppy', earColor: '#8f5627', tail: 'thin', tailL: 0.34, wag: 10, wagAmp: 0.5, iris: '#6b3a12', muzzle: '#f6e1bd' });
    collarR(b, q, '#d23a3a');
    sblk(b, q.head, pl(b, '#ff7a90', { coat: 0.9 }), [0, q.sy - q.sh * 0.55, q.front - 0.02], [q.sw * 0.34, 0.03, 0.09], [0.6, 0, 0], 0.45);
    sblk(b, q.head, pl(b, '#8f5627'), [q.hw * 0.22, q.hh * 0.14, q.hd / 2 - 0.02], [q.hw * 0.3, q.hh * 0.36, 0.04], null, 0.45);
  },

  katze(b) {
    const q = quadR(b, { color: '#a3a3ad', belly: '#f2efe8', body: [0.52, 0.44, 0.78], leg: [0.14, 0.24, 0.15], head: [0.74, 0.6, 0.56], snout: [0.3, 0.16, 0.08], ear: 'pointy', earS: 1.15, tail: 'thin', tailL: 0.6, tailW: 0.09, tailUp: 1.1, tailCurl: 0.2, wag: 1.4, wagAmp: 0.3, eye: 'cat', iris: '#8bd23a', nose: '#e48f98' });
    const st = pl(b, '#5d5d6a');
    for (const z of [-0.26, -0.1, 0.06, 0.22]) stripe(b, q, st, z);
    for (const x of [-0.08, 0, 0.08]) sblk(b, q.head, st, [x, q.hh / 2 - 0.004, q.hd * 0.12], [0.035, 0.03, q.hd * 0.4], null, 0.4);
    q.tailSegs.forEach((s, i) => i % 2 && sblk(b, s, st, [0, 0, -0.06], [0.1, 0.1, 0.04], null, 0.4));
    whisk(b, q.head, q.sw * 0.5, q.sy, q.front - 0.03);
  },

  kueken(b) {
    const g = b.group(b.model), bob = b.group(g);
    const y = pl(b, '#ffd23f', { sheen: 1, sheenColor: '#fff2a0' });
    const shell = pl(b, '#fbf4e4', { rough: 0.5 });
    const orange = pl(b, '#ff9a1f');
    sblk(b, g, shell, [0, 0.2, 0], [0.78, 0.4, 0.78], null, 0.4);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU;
      blk(b, g, shell, [Math.cos(a) * 0.35, 0.44, Math.sin(a) * 0.35], [0.16, 0.12 + (i % 2) * 0.06, 0.06], 0.015, [0, Math.PI / 2 - a, 0], 0.15, 1);
    }
    sblk(b, bob, y, [0, 0.62, 0], [0.7, 0.6, 0.66], null, 0.42);
    const head = b.group(bob, [0, 1.02, 0.04]);
    sblk(b, head, y, [0, 0, 0], [0.6, 0.5, 0.52], null, 0.42);
    for (const [x, r] of [[-0.05, 0.4], [0, 0], [0.05, -0.4]]) sblk(b, head, y, [x, 0.3, -0.02], [0.04, 0.14, 0.04], [0, 0, r], 0.45);
    blk(b, head, orange, [0, -0.04, 0.24], [0.16, 0.14, 0.1], 0.02, [Math.PI / 2, 0, 0], 0.2, 0.5);
    face(b, head, { y: 0.06, z: 0.26, gap: 0.15, s: 0.075, mouth: 'none' });
    const cap = b.group(head, [0.04, 0.24, -0.02], [0.1, 0, -0.3]);
    sblk(b, cap, shell, [0, 0, 0], [0.5, 0.12, 0.44], null, 0.45);
    for (let i = 0; i < 6; i++) blk(b, cap, shell, [-0.2 + i * 0.08, -0.08, 0.22], [0.07, 0.07, 0.03], 0.01, [Math.PI, 0, 0], 0.1, 1);
    const wings = [1, -1].map((sx) => {
      const w = b.group(bob, [sx * 0.35, 0.78, 0]);
      sblk(b, w, y, [sx * 0.02, -0.12, 0], [0.08, 0.26, 0.32], null, 0.45);
      return [w, sx];
    });
    for (const sx of [1, -1]) for (const a of [-0.4, 0, 0.4]) sblk(b, g, orange, [sx * 0.14 + Math.sin(a) * 0.06, 0.02, 0.36 + Math.cos(a) * 0.06], [0.05, 0.04, 0.14], [0, a, 0]);
    b.on((t) => {
      bob.position.y = Math.pow(Math.max(0, Math.sin(t * 1.8)), 4) * 0.05;
      head.rotation.z = Math.sin(t * 1.4) * 0.1;
      head.rotation.x = Math.sin(t * 2.1) * 0.06;
      wings.forEach(([w, s]) => (w.rotation.z = s * (0.15 + Math.max(0, Math.sin(t * 10)) * 0.6 * (Math.sin(t * 0.7) > 0.4 ? 1 : 0))));
    });
  },

  pferd(b) {
    const q = quadR(b, { color: '#7b4a2b', body: [0.52, 0.5, 1.0], leg: [0.15, 0.56, 0.16], head: [0.5, 0.52, 0.72], snout: [0.36, 0.3, 0.2], headUp: 0.22, headFwd: 0.06, muzzle: '#4e2e1c', ear: 'pointy', earS: 0.75, tail: 'horse', tailL: 0.6, tailW: 0.1, tailUp: -0.5, tipColor: '#25160f', hoof: '#2a2422', nose: '#2a1a14', wag: 1.2, wagAmp: 0.15, eyeS: 0.15 });
    const mane = pl(b, '#25160f', { rough: 0.6, sheen: 1 });
    for (let i = 0; i < 5; i++) sblk(b, q.head, mane, [0, q.hh / 2 + 0.03, q.hd * 0.28 - i * 0.12], [0.1, 0.12, 0.14], [-0.3, 0, 0], 0.4);
    for (let i = 0; i < 4; i++) sblk(b, q.bob, mane, [0, q.hy - 0.05 - i * 0.08, q.hz - q.hd * 0.42 - i * 0.04], [0.1, 0.14, 0.12], [-0.6, 0, 0], 0.4);
    sblk(b, q.head, pl(b, '#f4efe6'), [0, q.hh * 0.1, q.hd / 2 + 0.004], [0.08, q.hh * 0.5, 0.03], null, 0.45);
    const saddle = pl(b, '#8a1f2a', { sheen: 0.6 });
    sblk(b, q.body, saddle, [0, q.bh / 2 - 0.02, 0], [q.bw + 0.04, 0.08, 0.36], null, 0.4);
    sblk(b, q.body, gold(b), [0, q.bh / 2 + 0.03, 0.12], [0.1, 0.06, 0.06], null, 0.4);
  },

  kuh(b) {
    const q = quadR(b, { color: '#f7f4ee', body: [0.66, 0.54, 0.96], leg: [0.17, 0.3, 0.18], head: [0.64, 0.56, 0.54], snout: [0.5, 0.28, 0.16], muzzle: '#f2a6b0', nose: '#d06c7c', ear: 'side', earS: 1.1, inner: '#f2a6b0', tail: 'tuft', tailL: 0.42, tailW: 0.1, tailUp: -0.3, tipColor: '#2a2224', hoof: '#3a302c', wag: 1.6, wagAmp: 0.3 });
    const blackM = pl(b, '#2a2224');
    patch(b, q, blackM, 1, 0.06, 0.14, 0.32, 0.24);
    patch(b, q, blackM, -1, -0.02, -0.2, 0.28, 0.3);
    sblk(b, q.body, blackM, [0.08, q.bh / 2 + 0.004, -0.1], [0.24, 0.02, 0.3], null, 0.4);
    sblk(b, q.head, blackM, [-q.hw * 0.22, q.hh * 0.18, q.hd / 2 + 0.003], [q.hw * 0.32, q.hh * 0.36, 0.02], null, 0.45);
    const horn = pl(b, '#efe2c4');
    for (const sx of [1, -1]) blk(b, q.head, horn, [sx * q.hw * 0.36, q.hh / 2 + 0.06, -0.04], [0.07, 0.16, 0.07], 0.025, [0, 0, -sx * 0.55], 0.4);
    const bell = b.group(q.bob, [0, q.hy - q.hh * 0.62, q.hz + q.hd * 0.22]);
    b.torus(bell, pl(b, '#3a6fd8'), [0, 0.07, -0.06], q.hw * 0.32, 0.03, [Math.PI / 2 - 0.3, 0, 0]);
    b.lathe(bell, gold(b), [[0, 0.02], [0.05, 0.02], [0.06, -0.02], [0.08, -0.09], [0, -0.09]], [0, 0, 0], 32);
    b.on((t) => (bell.rotation.x = Math.sin(t * 2.2) * 0.2));
  },

  frettchen(b) {
    const q = quadR(b, { color: '#e9d6b4', headColor: '#e9d6b4', body: [0.42, 0.4, 1.06], leg: [0.13, 0.16, 0.14], legColor: '#5a3c26', head: [0.56, 0.48, 0.5], snout: [0.26, 0.16, 0.12], muzzle: '#fff8ea', ear: 'round', earS: 0.85, tail: 'bushy', tailL: 0.5, tailW: 0.12, tailUp: 0.2, tipColor: '#5a3c26', iris: '#3a2410', brow: -0.15, wag: 2, wagAmp: 0.3 });
    sblk(b, q.head, pl(b, '#6a4630'), [0, q.hh * 0.1, q.hd / 2 - 0.006], [q.hw * 0.86, q.hh * 0.28, 0.03], null, 0.45);
    crown(b, q.head, [0, q.hh / 2 - 0.02, 0], 0.95);
    cape(b, q.bob, [0, q.hy - q.hh * 0.3, q.hz - q.hd * 0.42], q.bw + 0.18, 0.5, '#b01c34', '#fbf8f2');
    const sc = b.group(q.bob, [q.bw / 2 + 0.06, q.lh + 0.1, q.bl * 0.32], [0.2, 0, -0.15]);
    b.cyl(sc, gold(b), [0, 0.25, 0], 0.018, 0.018, 0.5, null, 12);
    b.octa(sc, b.mat('#e3263f', { rough: 0.05, coat: 1, flat: true, glow: '#e3263f', ei: 0.5 }), [0, 0.54, 0], 0.05, [0.05, 0.07, 0.05]);
  },

  otter(b) {
    const q = quadR(b, { color: '#7a4f2e', belly: '#d9b98e', body: [0.54, 0.44, 0.9], leg: [0.15, 0.17, 0.16], head: [0.62, 0.52, 0.5], snout: [0.36, 0.2, 0.12], muzzle: '#d9b98e', ear: 'round', earS: 0.6, tail: 'thin', tailL: 0.62, tailW: 0.16, tailUp: 0.1, tailCurl: 0.05, iris: '#2a6fa0', wag: 1.6, wagAmp: 0.3, headUp: 0.06 });
    whisk(b, q.head, q.sw * 0.45, q.sy, q.front - 0.03, 0.16);
    const sea = b.mat('#3fd2e8', { rough: 0.05, coat: 1, glow: '#1aa6d8', ei: 0.4, irid: 0.6 });
    const cr = b.group(q.head, [0, q.hh / 2, -0.02]);
    for (let i = 0; i < 5; i++) blk(b, cr, sea, [(i - 2) * 0.08, 0.06 + (2 - Math.abs(i - 2)) * 0.02, 0], [0.07, 0.12 + (2 - Math.abs(i - 2)) * 0.04, 0.05], 0.02, [0, 0, (i - 2) * 0.2], 0.2, 0.6);
    const pearl = b.ball(cr, b.mat('#fff6f0', { rough: 0.08, coat: 1, irid: 1, sheen: 1, sheenColor: '#ffd9f4' }), [0, 0.24, 0], 0.055);
    const pg = glowSprite('#bff4ff', 0.4, 0.6); pg.position.set(0, 0.24, 0); cr.add(pg);
    const tri = b.group(q.bob, [q.bw / 2 + 0.07, q.lh + 0.02, q.bl * 0.28], [0.15, 0, -0.12]);
    const tm = gold(b);
    b.cyl(tri, tm, [0, 0.45, 0], 0.02, 0.02, 0.9, null, 12);
    sblk(b, tri, tm, [0, 0.9, 0], [0.22, 0.04, 0.04], null, 0.45);
    for (const x of [-0.1, 0, 0.1]) blk(b, tri, tm, [x, 1.0, 0], [0.035, x ? 0.16 : 0.2, 0.035], 0.012, null, 0.2);
    b.on((t) => (pearl.position.y = 0.24 + Math.sin(t * 2) * 0.02));
  },

  // ── Wald Egg ──
  fuchs(b) {
    const q = quadR(b, { color: '#e8752a', belly: '#fff3e2', muzzle: '#fff3e2', body: [0.52, 0.46, 0.84], leg: [0.14, 0.24, 0.15], legColor: '#3a2620', head: [0.72, 0.58, 0.54], snout: [0.3, 0.18, 0.2], ear: 'pointy', earS: 1.2, earColor: '#e8752a', inner: '#3a2620', tail: 'bushy', tailL: 0.7, tailW: 0.17, tailUp: 0.35, tipColor: '#fff3e2', iris: '#9a5a10', wag: 2.2, wagAmp: 0.35 });
    for (const sx of [1, -1]) sblk(b, q.head, pl(b, '#fff3e2'), [sx * q.hw * 0.34, -q.hh * 0.24, q.hd / 2 - 0.03], [q.hw * 0.3, q.hh * 0.3, 0.06], null, 0.45);
  },

  reh(b) {
    const q = quadR(b, { color: '#b9784a', belly: '#f6e8d6', muzzle: '#f6e8d6', body: [0.46, 0.44, 0.84], leg: [0.11, 0.48, 0.12], head: [0.5, 0.48, 0.5], snout: [0.28, 0.2, 0.14], headUp: 0.14, ear: 'side', earS: 1.35, inner: '#f2c0b0', tail: 'stub', tailW: 0.1, tipColor: '#ffffff', hoof: '#2a2220', iris: '#2a1810', eyeS: 0.19, wag: 4, wagAmp: 0.3 });
    const w = pl(b, '#fbf5ea');
    for (const [x, z] of [[0.6, 0.2], [-0.5, 0.05], [0.3, -0.12], [-0.7, -0.25], [0, 0.3], [0.1, -0.3], [-0.2, 0.15]]) sblk(b, q.body, w, [x * q.bw * 0.4, q.bh / 2 + 0.002, z], [0.06, 0.02, 0.06], null, 0.45);
    for (const sx of [1, -1]) for (const z of [0.15, -0.15]) patch(b, q, w, sx, 0.1, z, 0.06, 0.06);
  },

  frosch(b) {
    const g = b.group(b.model), bob = b.group(g);
    const pad = pl(b, '#3e9b45', { rough: 0.5 });
    const padG = b.group(g, [0, 0.03, 0]);
    b.cyl(padG, pad, [0, 0, 0], 0.62, 0.64, 0.05, null, 40);
    blk(b, padG, b.mat('#2f7a37', { rough: 0.6 }), [0.4, 0.03, 0.2], [0.4, 0.01, 0.02], 0.004, [0, -0.5, 0]);
    const lotus = pl(b, '#ff9fc4');
    for (let i = 0; i < 5; i++) blk(b, padG, lotus, [-0.42 + Math.cos(i * 1.26) * 0.05, 0.08, -0.25 + Math.sin(i * 1.26) * 0.05], [0.06, 0.12, 0.03], 0.015, [0, i * 1.26, 0.4], 0.2, 0.8);
    const M = pl(b, '#6cc24a', { coat: 0.8 }), belly = pl(b, '#e9f5b8');
    const body = b.group(bob, [0, 0.3, 0]);
    sblk(b, body, M, [0, 0, 0], [0.74, 0.42, 0.66], null, 0.42);
    sblk(b, body, belly, [0, -0.06, 0.3], [0.54, 0.26, 0.1], null, 0.45);
    const throat = sblk(b, body, b.mat('#f2f7c8', { rough: 0.2, coat: 1, opacity: 0.9 }), [0, -0.12, 0.33], [0.3, 0.16, 0.12], null, 0.48);
    const spots = pl(b, '#3e8a35');
    for (const [x, z] of [[0.18, 0], [-0.2, -0.12], [0.05, -0.2], [-0.05, 0.12]]) sblk(b, body, spots, [x, 0.21, z], [0.1, 0.02, 0.1], null, 0.45);
    for (const sx of [1, -1]) {
      const eb = b.group(body, [sx * 0.2, 0.24, 0.14]);
      sblk(b, eb, M, [0, 0, 0], [0.22, 0.2, 0.2], null, 0.48);
      face(b, eb, { y: 0.01, z: 0.1, gap: 0, s: 0.07, mouth: 'none', blush: null, iris: '#d8a020' });
      sblk(b, bob, M, [sx * 0.34, 0.16, -0.14], [0.18, 0.26, 0.34], null, 0.45);
      sblk(b, bob, M, [sx * 0.36, 0.08, 0.06], [0.14, 0.06, 0.24], null, 0.45);
      sblk(b, bob, M, [sx * 0.22, 0.14, 0.28], [0.08, 0.2, 0.08], null, 0.45);
      sblk(b, bob, M, [sx * 0.24, 0.07, 0.34], [0.14, 0.04, 0.1], null, 0.45);
    }
    b.torus(body, b.mat('#2a4a1e', { rough: 0.4 }), [0, -0.02, 0.32], 0.18, 0.012, [0, 0, Math.PI + 0.25], Math.PI - 0.5);
    for (const sx of [1, -1]) b.ball(body, b.mat('#ff8fa6', { opacity: 0.7 }), [sx * 0.26, 0.02, 0.33], [0.05, 0.03, 0.01]);
    b.on((t) => {
      const k = (t * 0.5) % 1, s = k < 0.3 ? Math.sin((k / 0.3) * Math.PI) : 0;
      throat.scale.set(1 + s * 0.5, 1 + s * 0.8, 1 + s * 0.6);
      bob.position.y = Math.pow(Math.max(0, Math.sin(t * 1.1 + 2)), 10) * 0.12;
    });
  },

  dachs(b) {
    const q = quadR(b, { color: '#8e8e94', body: [0.62, 0.42, 0.9], leg: [0.17, 0.16, 0.18], legColor: '#24222a', head: [0.6, 0.48, 0.56], headColor: '#f4f2ee', snout: [0.28, 0.18, 0.2], muzzle: '#f4f2ee', ear: 'round', earS: 0.7, earColor: '#24222a', tail: 'stub', tailW: 0.12, tipColor: '#8e8e94', iris: '#2a1810', wag: 3, wagAmp: 0.3 });
    const blackM = pl(b, '#24222a');
    for (const sx of [1, -1]) sblk(b, q.head, blackM, [sx * q.hw * 0.24, q.hh * 0.05, q.hd / 2 - 0.02], [q.hw * 0.18, q.hh * 1.0, 0.07], null, 0.45);
    sblk(b, q.head, blackM, [0, q.hh / 2 - 0.004, 0], [q.hw * 0.2, 0.03, q.hd * 0.7], null, 0.4);
    stripe(b, q, pl(b, '#6a6a72'), 0.1, 0.4, q.bl * 0.4);
  },

  schlange(b) {
    const g = b.group(b.model);
    const M = pl(b, '#5fbf3a', { coat: 0.8 }), band = pl(b, '#f2d03a'), belly = pl(b, '#e9f2b0');
    const N = 46;
    const segs = [];
    for (let i = 0; i < N; i++) {
      const k = i / N, a = k * TAU * 2.1, r = 0.48 - k * 0.3, y = 0.1 + k * 0.42;
      const w = 0.2 - k * 0.04;
      const m = sblk(b, g, i % 6 < 1 ? band : M, [Math.cos(a) * r, y, Math.sin(a) * r], [w, w * 0.9, 0.2], [0, -a, 0], 0.45);
      segs.push(m);
    }
    const head = b.group(g, [0.02, 0.62, 0.18]);
    sblk(b, head, M, [0, 0, 0], [0.34, 0.24, 0.36], null, 0.4);
    sblk(b, head, belly, [0, -0.09, 0.02], [0.28, 0.06, 0.32], null, 0.45);
    face(b, head, { y: 0.05, z: 0.18, gap: 0.09, s: 0.06, mouth: 'smile', mouthY: -0.04, mouthS: 0.025, iris: '#e0b020', type: 'cat' });
    const tongue = b.group(head, [0, -0.04, 0.18]);
    const tm = pl(b, '#e0304a');
    sblk(b, tongue, tm, [0, 0, 0.06], [0.03, 0.012, 0.12], null, 0.45);
    for (const sx of [1, -1]) sblk(b, tongue, tm, [sx * 0.02, 0, 0.13], [0.012, 0.01, 0.05], [0, sx * 0.5, 0], 0.45);
    b.on((t) => {
      const k = (t * 0.6) % 1;
      tongue.scale.z = k < 0.2 ? Math.sin((k / 0.2) * Math.PI) : 0.001;
      head.rotation.y = Math.sin(t * 0.8) * 0.3;
      head.position.y = 0.62 + Math.sin(t * 1.6) * 0.02;
    });
  },

  baer(b) {
    const q = quadR(b, { color: '#7a5032', belly: '#b8875a', muzzle: '#c89a6a', body: [0.84, 0.66, 1.0], leg: [0.24, 0.26, 0.26], head: [0.78, 0.64, 0.6], snout: [0.36, 0.24, 0.16], ear: 'round', earS: 0.85, tail: 'stub', tailW: 0.14, iris: '#2a1810', wag: 2, wagAmp: 0.2, brow: -0.12 });
    const moss = pl(b, '#4e9a3a', { rough: 0.85, sheen: 1, sheenColor: '#b6ff6a' });
    for (const [x, z, w] of [[0, 0.1, 0.5], [0.15, -0.22, 0.36], [-0.18, -0.05, 0.3]]) sblk(b, q.body, moss, [x, q.bh / 2 + 0.01, z], [w, 0.06, w * 0.9], null, 0.45);
    const shroom = pl(b, '#e0402e');
    for (const [x, z] of [[0.2, -0.3], [-0.24, 0.12]]) {
      sblk(b, q.body, pl(b, '#f4ead8'), [x, q.bh / 2 + 0.07, z], [0.04, 0.1, 0.04], null, 0.4);
      sblk(b, q.body, shroom, [x, q.bh / 2 + 0.12, z], [0.12, 0.05, 0.12], null, 0.45, 0.6);
    }
    const wood = pl(b, '#5a3b22', { rough: 0.8 }), leaf = pl(b, '#7bd84a', { glow: '#3fae4a', ei: 0.15 });
    for (const sx of [1, -1]) {
      const a = b.group(q.head, [sx * q.hw * 0.22, q.hh / 2, -0.04], [0, 0, -sx * 0.35]);
      sblk(b, a, wood, [0, 0.14, 0], [0.06, 0.3, 0.06], null, 0.45);
      sblk(b, a, wood, [sx * 0.06, 0.24, 0], [0.16, 0.05, 0.05], [0, 0, sx * 0.6], 0.45);
      sblk(b, a, wood, [-sx * 0.04, 0.32, 0], [0.05, 0.16, 0.05], [0, 0, -sx * 0.4], 0.45);
      for (const [x, y] of [[sx * 0.14, 0.32], [-sx * 0.08, 0.42], [0, 0.32]]) blk(b, a, leaf, [x, y, 0], [0.07, 0.1, 0.02], 0.01, [0, 0, x], 0.3, 1);
    }
    swarm(b, q.g, 12, '#c6ff4a', 0.08, (s, t, o) => {
      const a = s[0] * TAU + t * 0.4;
      o[0] = Math.cos(a) * 0.7; o[1] = 0.5 + s[1] * 0.8 + Math.sin(t + s[2] * 6) * 0.1; o[2] = Math.sin(a) * 0.7;
      o[3] = 0.5 + 0.5 * Math.sin(t * 3 + s[3] * 6);
    });
  },

  wolf(b) {
    const glowM = neon(b, '#7dff6a', 2.2);
    const q = quadR(b, { color: '#6e7686', belly: '#d8dde6', muzzle: '#d8dde6', body: [0.6, 0.52, 0.94], leg: [0.16, 0.3, 0.17], head: [0.68, 0.56, 0.56], snout: [0.32, 0.2, 0.24], ear: 'pointy', earS: 1.2, inner: '#3a3f4a', tail: 'bushy', tailL: 0.7, tailW: 0.16, tailUp: 0.2, tipColor: '#d8dde6', eyeGlow: '#9dff6a', brow: 0.25, wag: 1.5, wagAmp: 0.2 });
    for (const sx of [1, -1]) {
      for (const [y, z, l, r] of [[0.08, 0.2, 0.36, 0.3], [-0.06, -0.12, 0.3, -0.4], [0.12, -0.3, 0.2, 0.6]]) blk(b, q.body, glowM, [sx * (q.bw / 2 + 0.004), y, z], [0.02, 0.035, l], 0.008, [r, 0, 0]);
      blk(b, q.legs[sx > 0 ? 0 : 1], glowM, [sx * 0.086, -0.15, 0], [0.008, 0.18, 0.02], 0.004);
    }
    for (let i = 0; i < 4; i++) blk(b, q.body, glowM, [0, q.bh / 2 + 0.004, 0.3 - i * 0.2], [0.03, 0.012, 0.12], 0.006, [0, i % 2 ? 0.4 : -0.4, 0]);
    const howl = q.head;
    b.on((t) => {
      const k = (t % 9) / 9, s = k > 0.75 ? Math.sin(((k - 0.75) / 0.25) * Math.PI) : 0;
      howl.rotation.x = -s * 0.6;
      glowM.emissiveIntensity = 1.4 + s * 2.4;
    });
  },

  // ── Eis Egg ──
  schneemann(b) {
    const g = b.group(b.model), bob = b.group(g);
    const snow = pl(b, '#f6f9ff', { rough: 0.75, sheen: 1, sheenColor: '#cfe8ff', surf: 'snow', ns: 0.3 });
    sblk(b, bob, snow, [0, 0.27, 0], [0.7, 0.54, 0.66], null, 0.42);
    sblk(b, bob, snow, [0, 0.72, 0], [0.54, 0.42, 0.5], null, 0.42);
    const head = b.group(bob, [0, 1.1, 0.02]);
    sblk(b, head, snow, [0, 0, 0], [0.48, 0.4, 0.44], null, 0.4);
    const coal = ink(b);
    face(b, head, { y: 0.06, z: 0.22, gap: 0.1, s: 0.05, mouth: 'none', blush: '#ffb0c0' });
    for (let i = 0; i < 5; i++) { const a = Math.PI + 0.5 + (i / 4) * (Math.PI - 1); sblk(b, head, coal, [Math.cos(a) * 0.11, -0.07 + Math.sin(a) * 0.04 + 0.04, 0.22], [0.03, 0.03, 0.02]); }
    blk(b, head, pl(b, '#ff8a1f'), [0, 0, 0.22], [0.07, 0.2, 0.07], 0.02, [Math.PI / 2, 0, 0], 0.15);
    topHat(b, head, [0, 0.19, -0.01], 1.05);
    for (const y of [0.62, 0.74, 0.86]) sblk(b, bob, coal, [0, y, 0.25], [0.05, 0.05, 0.03]);
    const scarf = pl(b, '#d23a3a', { rough: 0.8, sheen: 1 }), sc2 = pl(b, '#f6f2ea', { rough: 0.8, sheen: 1 });
    sblk(b, bob, scarf, [0, 0.92, 0.01], [0.56, 0.1, 0.52], null, 0.45);
    const tailS = b.group(bob, [0.16, 0.9, 0.24]);
    for (let i = 0; i < 3; i++) sblk(b, tailS, i % 2 ? sc2 : scarf, [0, -0.06 - i * 0.08, 0], [0.1, 0.08, 0.04], null, 0.4);
    const stick = pl(b, '#6a4426', { rough: 0.9 });
    const arms = [1, -1].map((sx) => {
      const a = b.group(bob, [sx * 0.26, 0.76, 0], [0, 0, -sx * 0.5]);
      sblk(b, a, stick, [sx * 0.2, 0, 0], [0.4, 0.035, 0.035], null, 0.45);
      sblk(b, a, stick, [sx * 0.36, 0.05, 0], [0.12, 0.03, 0.03], [0, 0, sx * 0.7], 0.45);
      return [a, sx];
    });
    b.on((t) => {
      head.rotation.z = Math.sin(t * 0.9) * 0.06;
      tailS.rotation.z = Math.sin(t * 1.6) * 0.15;
      arms.forEach(([a, s], i) => (a.rotation.z = -s * (0.5 + (i ? Math.max(0, Math.sin(t * 3)) * 0.5 : 0))));
    });
  },

  polarhase(b) {
    const q = quadR(b, { color: '#f7f9fc', body: [0.5, 0.52, 0.6], leg: [0.15, 0.14, 0.2], head: [0.64, 0.56, 0.52], snout: [0.26, 0.16, 0.08], ear: 'long', earS: 1.05, inner: '#ffc2cc', tail: 'stub', tailW: 0.14, tailUp: 0, nose: '#ff9fae', iris: '#7aaee0', eyeS: 0.18, headUp: 0.04, wag: 6, wagAmp: 0.2 });
    for (const sx of [1, -1]) sblk(b, q.head, pl(b, '#ffffff'), [sx * 0.03, q.sy - q.sh * 0.6, q.front - 0.02], [0.05, 0.06, 0.02], null, 0.4);
    q.ears.forEach((e) => sblk(b, e, pl(b, '#2a2a34'), [0, q.hh * 0.98, 0], [q.hw * 0.21, q.hh * 0.12, q.hd * 0.13], null, 0.45));
    whisk(b, q.head, q.sw * 0.5, q.sy, q.front - 0.02, 0.16);
  },

  eisbaer(b) {
    const q = quadR(b, { color: '#f2f5f8', body: [0.86, 0.66, 1.04], leg: [0.25, 0.26, 0.27], paw: '#e6ebf0', head: [0.72, 0.6, 0.6], snout: [0.36, 0.24, 0.2], muzzle: '#ffffff', ear: 'round', earS: 0.7, inner: '#c8d2dc', tail: 'stub', tailW: 0.14, iris: '#2a2a3a', wag: 2, wagAmp: 0.2, matO: { sheen: 1, sheenColor: '#dff2ff' } });
    const sc = pl(b, '#3a8ee0', { rough: 0.8, sheen: 1 });
    sblk(b, q.bob, sc, [0, q.hy - q.hh * 0.5, q.hz - q.hd * 0.2], [q.hw * 0.8, 0.1, q.hd * 0.7], null, 0.45);
    sblk(b, q.bob, sc, [q.hw * 0.25, q.hy - q.hh * 0.75, q.hz + q.hd * 0.1], [0.12, 0.24, 0.05], [0, 0, 0.1], 0.4);
    const ice = glass(b, '#bff4ff', { glow: '#4fc8ff', ei: 0.3 });
    blk(b, q.g, ice, [q.bw / 2 + 0.12, 0.09, q.bl * 0.38], [0.16, 0.18, 0.16], 0.03, [0, 0.5, 0]);
  },

  robbe(b) {
    const g = b.group(b.model), bob = b.group(g);
    const M = pl(b, '#9aa4b0', { coat: 0.9, coatRough: 0.15 }), belly = pl(b, '#d8dee6'), spot = pl(b, '#6e7884');
    const body = b.group(bob, [0, 0.22, -0.1]);
    sblk(b, body, M, [0, 0, 0], [0.56, 0.42, 0.9], null, 0.45);
    sblk(b, body, belly, [0, -0.13, 0.05], [0.44, 0.18, 0.76], null, 0.45);
    for (const [x, y, z] of [[0.28, 0.06, 0.1], [-0.28, 0.0, -0.15], [0.1, 0.21, -0.2], [-0.1, 0.21, 0.15]]) sblk(b, body, spot, [x, y, z], x && Math.abs(x) > 0.2 ? [0.02, 0.06, 0.08] : [0.07, 0.02, 0.06], null, 0.45);
    const tail = b.group(body, [0, -0.08, -0.44]);
    for (const sx of [1, -1]) sblk(b, tail, M, [sx * 0.1, 0, -0.08], [0.18, 0.05, 0.2], [0, sx * 0.4, 0], 0.45);
    const head = b.group(bob, [0, 0.52, 0.3]);
    sblk(b, head, M, [0, 0, 0], [0.48, 0.42, 0.42], null, 0.42);
    sblk(b, head, belly, [0, -0.08, 0.22], [0.26, 0.16, 0.1], null, 0.45);
    sblk(b, head, ink(b), [0, -0.02, 0.27], [0.1, 0.05, 0.04], null, 0.45);
    face(b, head, { y: 0.08, z: 0.21, gap: 0.11, s: 0.075, mouth: 'w', mouthY: -0.1, mouthZ: 0.27, mouthS: 0.022 });
    whisk(b, head, 0.12, -0.08, 0.25, 0.16);
    const fl = [1, -1].map((sx) => {
      const f = b.group(bob, [sx * 0.26, 0.14, 0.18]);
      sblk(b, f, M, [sx * 0.08, -0.06, 0.04], [0.2, 0.05, 0.22], [0, 0, sx * 0.4], 0.45);
      return [f, sx];
    });
    const fish = b.group(g, [0.2, 0.04, 0.48], [0, 0.6, 0]);
    const fm = pl(b, '#ff9a3a');
    sblk(b, fish, fm, [0, 0.04, 0], [0.06, 0.08, 0.16]);
    blk(b, fish, fm, [0, 0.04, -0.1], [0.08, 0.06, 0.02], 0.01);
    b.on((t) => {
      bob.rotation.z = Math.sin(t * 1.2) * 0.05;
      head.rotation.x = Math.sin(t * 0.9) * 0.08 - 0.08;
      tail.rotation.x = Math.sin(t * 2) * 0.2;
      fl.forEach(([f, s]) => (f.rotation.z = s * Math.max(0, Math.sin(t * 5)) * 0.4 * (Math.sin(t * 0.6) > 0.3 ? 1 : 0)));
    });
  },

  pinguin(b) {
    const g = b.group(b.model), bob = b.group(g);
    const M = pl(b, '#1e2230', { coat: 0.9 }), belly = pl(b, '#f7f6f2'), yel = pl(b, '#ffcf3a'), orange = pl(b, '#ff9a1f');
    for (const sx of [1, -1]) {
      sblk(b, g, orange, [sx * 0.13, 0.025, 0.08], [0.16, 0.05, 0.22]);
    }
    const body = b.group(bob, [0, 0.4, 0]);
    sblk(b, body, M, [0, 0, 0], [0.6, 0.72, 0.52], null, 0.42, 0.9);
    sblk(b, body, belly, [0, -0.04, 0.22], [0.46, 0.6, 0.12], null, 0.45);
    sblk(b, body, M, [0, -0.2, -0.3], [0.3, 0.2, 0.12], [-0.4, 0, 0], 0.45, 0.6);
    const head = b.group(bob, [0, 0.92, 0.02]);
    sblk(b, head, M, [0, 0, 0], [0.54, 0.44, 0.46], null, 0.42);
    sblk(b, head, belly, [0, -0.04, 0.2], [0.38, 0.3, 0.08], null, 0.45);
    for (const sx of [1, -1]) sblk(b, head, yel, [sx * 0.24, 0.0, 0.08], [0.06, 0.18, 0.18], null, 0.45);
    sblk(b, bob, yel, [0, 0.72, 0.18], [0.36, 0.06, 0.12], null, 0.45);
    blk(b, head, orange, [0, -0.06, 0.24], [0.1, 0.12, 0.08], 0.02, [Math.PI / 2, 0, 0], 0.25, 0.5);
    face(b, head, { y: 0.06, z: 0.24, gap: 0.1, s: 0.065, mouth: 'none' });
    const fl = [1, -1].map((sx) => {
      const f = b.group(body, [sx * 0.3, 0.22, 0]);
      sblk(b, f, M, [sx * 0.02, -0.22, 0], [0.06, 0.46, 0.26], null, 0.45);
      return [f, sx];
    });
    b.on((t) => {
      bob.rotation.z = Math.sin(t * 3) * 0.06;
      bob.position.y = Math.abs(Math.sin(t * 3)) * 0.02;
      fl.forEach(([f, s]) => (f.rotation.z = s * (0.15 + Math.max(0, Math.sin(t * 6)) * 0.3)));
    });
  },

  schneegolem(b) {
    const g = b.group(b.model), bob = b.group(g);
    const ice = b.mat('#bfeaff', { rough: 0.12, coat: 1, coatRough: 0.05, irid: 0.4, glow: '#2a8ad8', ei: 0.18, sheen: 0.4 });
    const dark = b.mat('#7cc6f0', { rough: 0.2, coat: 1, glow: '#2a8ad8', ei: 0.25 });
    const snow = pl(b, '#ffffff', { rough: 0.8, sheen: 1, surf: 'snow', ns: 0.3 });
    for (const sx of [1, -1]) {
      sblk(b, bob, dark, [sx * 0.2, 0.18, 0], [0.26, 0.36, 0.3], null, 0.35);
      sblk(b, bob, snow, [sx * 0.2, 0.04, 0.02], [0.3, 0.08, 0.36], null, 0.4);
    }
    const body = b.group(bob, [0, 0.72, 0]);
    sblk(b, body, ice, [0, 0, 0], [0.86, 0.72, 0.56], null, 0.3, 1.1);
    sblk(b, body, snow, [0, 0.36, 0], [0.9, 0.1, 0.6], null, 0.4);
    const core = b.octa(body, b.mat('#e8fbff', { rough: 0.02, coat: 1, glow: '#4fe0ff', ei: 2.2, flat: true }), [0, 0.02, 0.3], 0.1, [0.1, 0.15, 0.06]);
    const cg = glowSprite('#7ae8ff', 0.7, 0.8); cg.position.set(0, 0.02, 0.34); body.add(cg);
    const head = b.group(bob, [0, 1.22, 0.04]);
    sblk(b, head, ice, [0, 0, 0], [0.44, 0.34, 0.38], null, 0.3);
    sblk(b, head, snow, [0, 0.17, 0], [0.48, 0.08, 0.42], null, 0.4);
    face(b, head, { y: 0.02, z: 0.19, gap: 0.1, s: 0.06, glow: '#7ae8ff', mouth: 'none', blush: null, brow: 0.25 });
    for (const sx of [1, -1]) {
      for (let i = 0; i < 3; i++) blk(b, body, ice, [sx * (0.32 - i * 0.1), 0.42, -0.05 + i * 0.03], [0.07, 0.2 - i * 0.04, 0.07], 0.015, [0, 0, -sx * 0.25], 0.1);
    }
    const arms = [1, -1].map((sx) => {
      const a = b.group(body, [sx * 0.46, 0.2, 0]);
      sblk(b, a, dark, [sx * 0.08, -0.22, 0], [0.24, 0.48, 0.26], null, 0.35);
      sblk(b, a, ice, [sx * 0.08, -0.52, 0.02], [0.3, 0.2, 0.3], null, 0.35);
      return [a, sx];
    });
    b.on((t) => {
      core.rotation.y = t * 1.5;
      core.material.emissiveIntensity = 1.8 + Math.sin(t * 3) * 0.6;
      body.rotation.y = Math.sin(t * 0.6) * 0.06;
      arms.forEach(([a, s], i) => (a.rotation.x = Math.sin(t * 1.2 + i * Math.PI) * 0.12));
    });
  },

  polarfuchs(b) {
    const q = quadR(b, { color: '#f5f9ff', belly: '#ffffff', muzzle: '#ffffff', body: [0.5, 0.46, 0.84], leg: [0.14, 0.26, 0.15], head: [0.7, 0.58, 0.54], snout: [0.3, 0.18, 0.2], ear: 'pointy', earS: 1.2, inner: '#bfe8ff', tail: 'none', eyeGlow: '#7ae8ff', matO: { sheen: 1, sheenColor: '#cfefff' } });
    const frost = b.mat('#e8f8ff', { rough: 0.2, coat: 1, sheen: 1, sheenColor: '#9ff0ff', glow: '#4fc8ff', ei: 0.15 });
    const tip = b.mat('#bff4ff', { rough: 0.05, coat: 1, glow: '#4fc8ff', ei: 0.7, irid: 0.6 });
    const tails = [-0.5, 0, 0.5].map((yaw) => {
      const t = b.group(q.bob, [0, q.by + q.bh * 0.15, -q.bl / 2 + 0.04], [0.35, yaw, 0]);
      const segs = chain(b, t, 4, (g, i) => {
        const w = 0.15 * [0.6, 1.2, 1.3, 1][i], l = [0.1, 0.18, 0.2, 0.16][i];
        sblk(b, g, i === 3 ? tip : frost, [0, 0, -l / 2], [w, w, l + 0.04], null, 0.46);
        g.rotation.x = i ? 0.22 : 0;
        return l;
      });
      return [segs, yaw];
    });
    const cr = b.group(q.head, [0, q.hh / 2 - 0.01, 0]);
    for (let i = 0; i < 5; i++) b.octa(cr, tip, [(i - 2) * 0.07, 0.06 + (2 - Math.abs(i - 2)) * 0.03, 0], 0.04, [0.03, 0.07 + (2 - Math.abs(i - 2)) * 0.04, 0.03]);
    b.on((t) => tails.forEach(([segs, yaw], k) => segs.forEach((s, i) => (s.rotation.y = Math.sin(t * 1.6 + k * 1.2 - i * 0.6) * 0.18))));
  },
};
