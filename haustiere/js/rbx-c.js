// Roblox-Stil: Haustiere aus Admin Egg und Release Egg
import { THREE, TAU, glowSprite, darken, lighten } from './kit.js';
import { swarm } from './templates.js';
import { blk, sblk, pl, neon, gold, ink, glass, face, chain, quadR, lizardR, birdR, partyHat, sparkle } from './rbx-kit.js';

const hover = (b, g, amp = 0.05, base = 0.08, sp = 1.4) => {
  const ph = b.rnd() * 6;
  b.on((t) => (g.position.y = base + Math.sin(t * sp + ph) * amp));
};
const textTex = (b, txt, fg, bg, w = 256, h = 128, font = 'bold 72px monospace') =>
  b.ctex(w, h, (c) => {
    c.fillStyle = bg; c.fillRect(0, 0, w, h);
    c.fillStyle = fg; c.font = font; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, w / 2, h / 2 + 4);
  });
const codeTex = (b) =>
  b.ctex(512, 512, (c, w, h) => {
    c.fillStyle = '#06120c'; c.fillRect(0, 0, w, h);
    c.font = '15px monospace';
    const words = ['fn', 'let', '{', '}', '=>', 'if', '0x1F', 'pet()', 'return', '++', '[]', 'null', 'run', '01', 'egg'];
    for (let y = 14; y < h; y += 18) {
      let x = 6 + Math.floor(b.rnd() * 4) * 16;
      while (x < w) {
        const s = words[Math.floor(b.rnd() * words.length)];
        c.fillStyle = b.rnd() < 0.2 ? '#bfffd0' : '#3dff7a';
        c.fillText(s, x, y);
        x += c.measureText(s).width + 10;
      }
    }
  }, { wrap: true });

export const BUILDERS = {
  // ── Admin Egg ──
  glitchhund(b) {
    const q = quadR(b, { color: '#8a8f9a', belly: '#c8ccd6', muzzle: '#c8ccd6', ear: 'pointy', earS: 0.9, tail: 'thin', tailL: 0.34, wag: 10, wagAmp: 0.5, eyeGlow: '#ff4058', brow: 0.15, blush: null });
    const check = b.ctex(64, 64, (c) => { for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { c.fillStyle = (x + y) % 2 ? '#000' : '#ff00dc'; c.fillRect(x * 16, y * 16, 16, 16); } });
    check.magFilter = THREE.NearestFilter;
    sblk(b, q.body, b.mat('#ffffff', { map: check, rough: 0.4 }), [q.bw / 2 + 0.005, 0.04, -0.1], [0.02, 0.2, 0.26], null, 0.2);
    const red = blk(b, q.body, b.basic('#ff2040', { opacity: 0.35 }), [0.05, 0, 0], [q.bw, q.bh, q.bl], 0.12);
    const cyan = blk(b, q.body, b.basic('#20f0ff', { opacity: 0.35 }), [-0.05, 0, 0], [q.bw, q.bh, q.bl], 0.12);
    const hr = blk(b, q.head, b.basic('#ff2040', { opacity: 0.35 }), [0.05, 0, 0], [q.hw, q.hh, q.hd], 0.15);
    const hc = blk(b, q.head, b.basic('#20f0ff', { opacity: 0.35 }), [-0.05, 0, 0], [q.hw, q.hh, q.hd], 0.15);
    const err = blk(b, q.head, b.mat('#ffffff', { map: textTex(b, 'ERR_404', '#ff4058', '#120a10', 256, 64, 'bold 40px monospace'), glow: '#ffffff', emap: textTex(b, 'ERR_404', '#ff4058', '#000000', 256, 64, 'bold 40px monospace'), ei: 1 }), [0, q.hh / 2 + 0.16, 0], [0.4, 0.1, 0.02], 0.01);
    b.on((t) => {
      const on = Math.sin(t * 13) > 0.6 && Math.sin(t * 1.7) > 0.2;
      [red, cyan, hr, hc].forEach((m) => (m.visible = on));
      err.visible = Math.sin(t * 3) > -0.2;
      q.head.position.x = on ? (Math.sin(t * 91) * 0.04) : 0;
      q.body.position.x = on ? (Math.sin(t * 57) * 0.03) : 0;
    });
  },

  banhammer(b) {
    const q = lizardR(b, { color: '#4a8a3a', belly: '#d8e6a0', snout: [0.38, 0.2, 0.46], head: [0.5, 0.34, 0.38], body: [0.56, 0.36, 0.9], leg: [0.13, 0.22], iris: '#ffcf3a', tailL: 0.7, tailW: 0.24, spikeColor: '#2f6a28', brow: 0.3 });
    const tooth = pl(b, '#ffffff');
    for (const sx of [1, -1]) for (let i = 0; i < 5; i++) blk(b, q.head, tooth, [sx * q.sw * 0.44, -q.hh * 0.26, q.snz - q.sd * 0.4 + i * q.sd * 0.18], [0.03, 0.05, 0.03], 0.008, [Math.PI, 0, 0], 0.15);
    const ham = b.group(q.head, [0, -q.hh * 0.1, q.snz - q.sd * 0.1]);
    b.cyl(ham, pl(b, '#3a2a20'), [0, 0, 0], 0.025, 0.025, 0.5, [0, 0, Math.PI / 2], 16);
    const hg = b.group(ham, [0.28, 0, 0]);
    const steel = b.mat('#9aa4b0', { metal: 1, rough: 0.25 });
    sblk(b, hg, steel, [0, 0, 0], [0.18, 0.3, 0.22], null, 0.2);
    sblk(b, hg, neon(b, '#ff2040', 0.6), [0, 0, 0], [0.19, 0.08, 0.23], null, 0.2);
    const ban = textTex(b, 'BAN', '#ffffff', '#c0102a');
    sblk(b, hg, b.mat('#ffffff', { map: ban, rough: 0.4, glow: '#ff2040', ei: 0.2 }), [0, 0, 0.115], [0.16, 0.12, 0.01], null, 0.2);
    b.on((t) => { ham.rotation.z = Math.sin(t * 1.4) * 0.12; });
  },

  lagschwein(b) {
    const q = quadR(b, { color: '#f5a3b5', body: [0.64, 0.52, 0.8], leg: [0.16, 0.2, 0.17], head: [0.72, 0.6, 0.56], snout: [0.3, 0.22, 0.1], muzzle: '#ff8aa4', nose: '#ff8aa4', ear: 'pointy', earS: 0.8, inner: '#ff8aa4', tail: 'curl', tailW: 0.07, hoof: '#c86a80', iris: '#3a2028', mouth: 'smile' });
    for (const sx of [1, -1]) sblk(b, q.head, pl(b, '#a8405a'), [sx * 0.05, q.sy, q.front + 0.002], [0.04, 0.07, 0.02], null, 0.45);
    q.ears.forEach((e) => (e.rotation.x = e.userData.rx = 0.5));
    const spin = b.group(q.head, [0, q.hh / 2 + 0.25, 0]);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU;
      b.ball(spin, b.mat('#ffffff', { glow: '#38f0ff', ei: 0.3 + (i / 8) * 1.6, opacity: 0.3 + (i / 8) * 0.7 }), [Math.cos(a) * 0.12, Math.sin(a) * 0.12, 0], 0.025);
    }
    b.on((t, raw) => (spin.rotation.z = -Math.floor(raw * 4) * (TAU / 8)));
    b.warp = (t) => Math.floor(t * 4) / 4;
  },

  uivogel(b) {
    const win = pl(b, '#e8ebf0', { rough: 0.3 });
    const q = birdR(b, { mat: win, color: '#e8ebf0', headColor: '#ffffff', wingColor: '#c8ced8', tip: '#3a7be0', beak: '#3a7be0', legs: '#5a6070', iris: '#3a7be0', tail: 3 });
    const bar = pl(b, '#3a7be0');
    sblk(b, q.body, bar, [0, q.bh / 2 - 0.05, 0], [q.bw + 0.01, 0.1, q.bl + 0.01], null, 0.3);
    ['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => b.ball(q.body, pl(b, c), [-q.bw * 0.3 + i * 0.07, q.bh / 2 - 0.05, q.bl / 2 + 0.005], [0.022, 0.022, 0.01]));
    sblk(b, q.body, pl(b, '#ffffff'), [0, -0.06, q.bl / 2 + 0.002], [q.bw * 0.7, q.bh * 0.5, 0.02], null, 0.3);
    const knob = pl(b, '#3a7be0');
    const sliders = [0.02, -0.08, -0.18].map((y, i) => {
      blk(b, q.body, pl(b, '#9aa4b0'), [0, y, q.bl / 2 + 0.014], [q.bw * 0.5, 0.012, 0.01], 0.005);
      return b.ball(q.body, knob, [0, y, q.bl / 2 + 0.02], [0.03, 0.03, 0.015]);
    });
    const ck = pl(b, '#28c840');
    blk(b, q.head, ck, [-0.04, q.hh / 2 + 0.06, 0], [0.05, 0.1, 0.03], 0.01, [0, 0, 0.7]);
    blk(b, q.head, ck, [0.04, q.hh / 2 + 0.09, 0], [0.05, 0.18, 0.03], 0.01, [0, 0, -0.6]);
    q.wings.forEach(([w, sx]) => sblk(b, w, pl(b, '#3a7be0'), [sx * 0.03, -0.1, 0.04], [0.02, 0.05, 0.12], null, 0.4));
    b.on((t) => sliders.forEach((s, i) => (s.position.x = Math.sin(t * (1 + i * 0.4) + i) * q.bw * 0.22)));
  },

  dateikatze(b) {
    const g = b.group(b.model), bob = b.group(g, [0, 0.1, 0]);
    const paper = pl(b, '#f6f7fb', { rough: 0.5 }), fold = pl(b, '#c8ced8'), line = pl(b, '#9aa4b0'), fur = pl(b, '#f0a24a');
    const body = b.group(bob, [0, 0.4, 0]);
    sblk(b, body, paper, [0, 0, 0], [0.6, 0.74, 0.14], null, 0.15);
    blk(b, body, fold, [0.22, 0.29, 0.07], [0.15, 0.15, 0.01], 0.01, [0, 0, Math.PI / 4]);
    for (let i = 0; i < 4; i++) blk(b, body, line, [-0.04, 0.12 - i * 0.1, 0.072], [i === 3 ? 0.24 : 0.38, 0.03, 0.01], 0.008);
    const tag = textTex(b, '.CAT', '#ffffff', '#ff5a1f', 256, 96, 'bold 64px sans-serif');
    blk(b, body, b.mat('#ffffff', { map: tag, rough: 0.4 }), [0, -0.27, 0.075], [0.34, 0.12, 0.01], 0.02);
    const head = b.group(bob, [0, 0.98, 0]);
    sblk(b, head, fur, [0, 0, 0], [0.56, 0.44, 0.44], null, 0.3);
    sblk(b, head, pl(b, '#fff3e2'), [0, -0.1, 0.21], [0.24, 0.14, 0.08], null, 0.4);
    sblk(b, head, b.mat('#e48f98', { rough: 0.2, coat: 1 }), [0, -0.06, 0.255], [0.07, 0.04, 0.03], null, 0.4);
    face(b, head, { y: 0.06, z: 0.22, gap: 0.13, s: 0.075, type: 'cat', iris: '#3a7be0', mouth: 'w', mouthY: -0.12, mouthZ: 0.255, mouthS: 0.02 });
    for (const sx of [1, -1]) {
      const e = b.group(head, [sx * 0.17, 0.2, -0.05], [0, 0, -sx * 0.2]);
      blk(b, e, fur, [0, 0.08, 0], [0.16, 0.18, 0.08], 0.02, null, 0.18, 0.6);
      sblk(b, bob, fur, [sx * 0.2, 0.06, 0.06], [0.14, 0.1, 0.16], null, 0.45);
      sblk(b, body, fur, [sx * 0.26, 0.24, 0.08], [0.12, 0.08, 0.1], null, 0.45);
    }
    const tail = b.group(body, [0.2, -0.2, -0.07], [0, -0.3, 0]);
    const segs = chain(b, tail, 5, (gg, i) => { sblk(b, gg, fur, [0, 0, -0.05], [0.08, 0.08, 0.12], null, 0.48); gg.rotation.x = i ? 0.3 : 0; return 0.09; });
    hover(b, bob, 0.06, 0.12, 1.2);
    b.on((t) => { segs.forEach((s, i) => (s.rotation.y = Math.sin(t * 1.6 - i * 0.6) * 0.25)); body.rotation.z = Math.sin(t * 0.8) * 0.05; head.rotation.z = Math.sin(t * 1.1) * 0.07; });
  },

  codedrache(b) {
    const ct = codeTex(b), ce = ct;
    const M = b.mat('#ffffff', { map: ct, emap: ce, glow: '#ffffff', ei: 0.9, rough: 0.3, coat: 0.8 });
    const q = lizardR(b, { mat: M, color: '#0f1a14', body: [0.5, 0.36, 0.86], head: [0.46, 0.32, 0.42], snout: [0.34, 0.18, 0.28], leg: [0.12, 0.2], eyeGlow: '#7dff9a', spikeMat: neon(b, '#3dff7a', 1.8), tailL: 1.1, tailW: 0.24 });
    for (const sx of [1, -1]) blk(b, q.head, neon(b, '#3dff7a', 1.2), [sx * 0.12, q.hh / 2 + 0.06, -0.1], [0.05, 0.18, 0.05], 0.015, [-0.5, 0, -sx * 0.25], 0.2);
    const memb = b.mat('#3dff7a', { glow: '#1aa84a', ei: 0.9, rough: 0.3, opacity: 0.55, double: true });
    const bone = neon(b, '#bfffd0', 1.2);
    const wings = [1, -1].map((sx) => {
      const piv = b.group(q.body, [sx * q.bw * 0.4, q.bh * 0.4, 0.1]);
      sblk(b, piv, bone, [sx * 0.28, 0.08, 0], [0.56, 0.04, 0.04], [0, 0, sx * 0.25], 0.45);
      for (let i = 0; i < 3; i++) {
        const x = sx * (0.18 + i * 0.16);
        blk(b, piv, memb, [x, -0.06 + i * 0.03, -0.14 - i * 0.02], [0.17, 0.02, 0.32 - i * 0.05], 0.008, [0, 0, sx * 0.25]);
        blk(b, piv, bone, [x + sx * 0.06, 0.02 + i * 0.04, -0.14], [0.02, 0.02, 0.3 - i * 0.04], 0.008, [0, 0, sx * 0.25]);
      }
      return [piv, sx];
    });
    hover(b, q.g, 0.06, 0.14, 1.3);
    b.on((t) => { ct.offset.y = -t * 0.08; wings.forEach(([p, s]) => (p.rotation.z = s * Math.sin(t * 3.2) * 0.45)); });
  },

  serverchamaeleon(b) {
    const M = pl(b, '#3dff7a', { rough: 0.3, glow: '#000000', ei: 0.4 });
    const g0 = b.group(b.model);
    const rack = pl(b, '#1e2230', { metal: 0.4, rough: 0.35 });
    sblk(b, g0, rack, [0, 0.16, 0], [0.9, 0.32, 0.7], null, 0.1);
    const leds = [];
    for (let row = 0; row < 3; row++) {
      blk(b, g0, pl(b, '#2a3040'), [0, 0.06 + row * 0.1, 0.352], [0.84, 0.07, 0.01], 0.01);
      for (let i = 0; i < 6; i++) leds.push(b.ball(g0, b.mat('#38f0ff', { glow: '#38f0ff', ei: 2 }), [0.28 + i * 0.03, 0.06 + row * 0.1, 0.36], 0.008));
    }
    const lizard = b.group(b.model, [0, 0.32, 0]);
    const keep = b.model;
    b.model = lizard;
    const q = lizardR(b, { mat: M, color: '#3dff7a', curl: true, tailN: 9, tailL: 0.9, spikes: true, spikeColor: '#ffe07a', iris: '#ff8a1f', eyeS: 0.4 });
    b.model = keep;
    const cols = ['#3dff7a', '#ffb020', '#ff4058', '#38a0ff'].map((c) => new THREE.Color(c));
    const tmp = new THREE.Color();
    b.on((t) => {
      const k = (t * 0.25) % cols.length, i = Math.floor(k), f = k - i;
      tmp.copy(cols[i]).lerp(cols[(i + 1) % cols.length], Math.min(1, f * 3));
      M.color.copy(tmp); M.emissive.copy(tmp).multiplyScalar(0.25);
      leds.forEach((l, j) => (l.visible = Math.sin(t * 6 + j * 2.3) > -0.3));
    });
  },

  // ── Release Egg ──
  dackel(b) {
    const q = quadR(b, { color: '#9a4e22', belly: '#c8803e', muzzle: '#c8803e', body: [0.46, 0.4, 1.12], leg: [0.12, 0.14, 0.13], head: [0.6, 0.5, 0.5], snout: [0.3, 0.18, 0.26], ear: 'floppy', earS: 1.15, earColor: '#6a3214', tail: 'thin', tailL: 0.42, tailW: 0.08, tailUp: 0.5, wag: 11, wagAmp: 0.5, iris: '#3a2010' });
    partyHat(b, q.head, [0.02, q.hh / 2 - 0.02, 0], 0.9);
    sblk(b, q.head, pl(b, '#ff7a90'), [0, q.sy - q.sh * 0.55, q.front - 0.02], [q.sw * 0.34, 0.03, 0.09], [0.6, 0, 0], 0.45);
  },

  konfetti(b) {
    const M = pl(b, '#ff5aa5', { rough: 0.3 });
    const q = lizardR(b, { mat: M, color: '#ff5aa5', curl: true, tailN: 9, tailL: 0.9, spikes: false, iris: '#5ad1ff', eyeS: 0.4, belly: '#fff3fa' });
    const cols = ['#ff5aa5', '#ffe07a', '#5ad1ff', '#8cff7a', '#c48bff'];
    for (let i = 0; i < 16; i++) {
      const sx = i % 2 ? 1 : -1, z = (b.rnd() - 0.5) * q.bl * 0.8, y = (b.rnd() - 0.2) * q.bh * 0.5;
      blk(b, q.body, pl(b, cols[i % cols.length]), i < 6 ? [(b.rnd() - 0.5) * q.bw * 0.6, q.bh / 2 + 0.003, z] : [sx * (q.bw / 2 + 0.003), y, z], i < 6 ? [0.05, 0.01, 0.03] : [0.01, 0.03, 0.05], 0.004, [0, b.rnd() * 3, 0]);
    }
    partyHat(b, q.head, [0, q.hh / 2 + 0.12, -0.04], 0.6);
    const tc = cols.map((c) => new THREE.Color(c)), tmp = new THREE.Color();
    b.on((t) => { const k = (t * 0.35) % tc.length, i = Math.floor(k); tmp.copy(tc[i]).lerp(tc[(i + 1) % tc.length], k - i); M.color.copy(tmp); });
  },

  ballonschwein(b) {
    const M = b.mat('#ff7aa8', { rough: 0.06, coat: 1, coatRough: 0.02, sheen: 0.3, sheenColor: '#ffd0e0' });
    const q = quadR(b, { mat: M, headMat: M, color: '#ff7aa8', body: [0.6, 0.52, 0.76], leg: [0.15, 0.22, 0.16], head: [0.62, 0.54, 0.52], snout: [0.3, 0.2, 0.1], muzzle: '#ff5a90', nose: '#ff5a90', ear: 'pointy', earS: 0.8, inner: '#ff5a90', tail: 'none', iris: '#3a2028', mouth: 'smile', matO: {} });
    const knot = b.group(q.body, [0, 0.02, -q.bl / 2 - 0.02]);
    blk(b, knot, M, [0, 0, -0.03], [0.07, 0.06, 0.07], 0.02, [-Math.PI / 2, 0, 0], 0.5);
    const pts = [];
    for (let i = 0; i <= 20; i++) { const k = i / 20; pts.push([Math.sin(k * 9) * 0.04, -k * 0.5, -0.06 - k * 0.1 + Math.cos(k * 9) * 0.03]); }
    b.taper(knot, b.mat('#ffffff', { rough: 0.5 }), pts, 0.006, 0.004, { seg: 60, radial: 6 });
    for (const [x, y, z] of [[0.15, 0.18, 0.2], [-0.12, 0.2, -0.1]]) b.ball(q.body, b.mat('#ffffff', { glow: '#ffffff', ei: 0.6, opacity: 0.8 }), [x, y, z], [0.05, 0.02, 0.06]);
    hover(b, q.g, 0.06, 0.12, 1.2);
    b.on((t) => (q.g.rotation.z = Math.sin(t * 1.3) * 0.06));
  },

  wunderkerze(b) {
    const q = quadR(b, { color: '#e8752a', belly: '#fff3e2', muzzle: '#fff3e2', body: [0.52, 0.46, 0.84], leg: [0.14, 0.24, 0.15], legColor: '#3a2620', head: [0.72, 0.58, 0.54], snout: [0.3, 0.18, 0.2], ear: 'pointy', earS: 1.2, inner: '#3a2620', tail: 'bushy', tailL: 0.7, tailW: 0.17, tailUp: 0.35, tipColor: '#fff3e2', iris: '#9a5a10', mouth: 'none', wag: 3, wagAmp: 0.4 });
    const st = b.group(q.head, [0.06, q.sy - q.sh * 0.3, q.front - 0.02], [0, 0.5, 0.3]);
    b.cyl(st, b.mat('#8a8f9a', { metal: 1, rough: 0.4 }), [0.16, 0, 0], 0.008, 0.008, 0.34, [0, 0, Math.PI / 2], 8);
    b.cyl(st, pl(b, '#5a4a40', { rough: 0.9 }), [0.24, 0, 0], 0.018, 0.018, 0.16, [0, 0, Math.PI / 2], 12);
    const tip = b.group(st, [0.33, 0, 0]);
    const fl = glowSprite('#ffe9a8', 0.5, 0.95); tip.add(fl);
    swarm(b, tip, 40, '#ffd36a', 0.06, (s, t, o) => {
      const k = (t * (1.2 + s[0]) + s[1]) % 1, a = s[2] * TAU, e = s[3] * Math.PI;
      const r = k * 0.32;
      o[0] = Math.cos(a) * Math.sin(e) * r; o[1] = Math.cos(e) * r - k * k * 0.1; o[2] = Math.sin(a) * Math.sin(e) * r; o[3] = 1 - k;
    });
    b.on((t) => (fl.scale.setScalar(0.45 + Math.sin(t * 30) * 0.08)));
  },

  qualle(b) {
    const g = b.group(b.model), bob = b.group(g, [0, 0.5, 0]);
    const bell = b.mat('#ffe7a0', { rough: 0.05, coat: 1, coatRough: 0.03, opacity: 0.7, irid: 0.8, glow: '#ffb030', ei: 0.25, sheen: 0.6 });
    const inner = neon(b, '#ffd36a', 0.5, { opacity: 0.45 });
    const dome = b.lathe(bob, bell, [[0, 0.42], [0.18, 0.4], [0.32, 0.32], [0.4, 0.16], [0.42, 0.02], [0.38, 0]], [0, 0.1, 0], 48);
    b.lathe(bob, b.mat('#ffd36a', { metal: 1, rough: 0.2 }), [[0.39, 0.0], [0.44, 0.02], [0.44, -0.02], [0.39, -0.02]], [0, 0.12, 0], 48);
    b.ball(bob, inner, [0, 0.24, 0], [0.16, 0.1, 0.16]);
    face(b, bob, { y: 0.26, z: 0.38, gap: 0.1, s: 0.06, mouth: 'smile', mouthY: 0.17, mouthZ: 0.4, mouthS: 0.018 });
    const tm = b.mat('#ffe7a0', { rough: 0.1, coat: 1, opacity: 0.75, glow: '#ffb030', ei: 0.3 });
    const tent = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU, r = 0.26;
      const root = b.group(bob, [Math.cos(a) * r, 0.1, Math.sin(a) * r], [-Math.PI / 2, 0, 0]);
      tent.push(chain(b, root, 5, (gg, k) => { const w = 0.05 - k * 0.006; sblk(b, gg, tm, [0, 0, -0.05], [w, w, 0.11], null, 0.48); return 0.09; }));
    }
    swarm(b, g, 34, '#fff6d0', 0.07, (s, t, o) => {
      const k = (t * (0.18 + s[0] * 0.2) + s[1]) % 1, a = s[2] * TAU;
      o[0] = Math.cos(a) * (0.2 + s[3] * 0.4) + Math.sin(t * 2 + s[3] * 6) * 0.03; o[1] = 0.1 + k * 1.4; o[2] = Math.sin(a) * (0.2 + s[3] * 0.4); o[3] = Math.sin(k * Math.PI);
    });
    b.on((t) => {
      const p = Math.sin(t * 2.2);
      dome.scale.set(1 + p * 0.05, 1 - p * 0.06, 1 + p * 0.05);
      bob.position.y = 0.5 + Math.sin(t * 1.1) * 0.06;
      tent.forEach((segs, i) => segs.forEach((s, k) => (s.rotation.x = k ? Math.sin(t * 2.2 - k * 0.7 + i) * 0.22 : 0)));
    });
  },

  roboter(b) {
    const g = b.group(b.model), bob = b.group(g);
    const metal = b.mat('#d4d9e2', { metal: 0.85, rough: 0.28, coat: 0.6 }), dark = pl(b, '#2a2e3a', { metal: 0.4 }), accent = pl(b, '#ff5a1f');
    for (const sx of [1, -1]) {
      sblk(b, bob, dark, [sx * 0.14, 0.14, 0], [0.12, 0.24, 0.12]);
      sblk(b, bob, metal, [sx * 0.14, 0.04, 0.03], [0.18, 0.08, 0.24], null, 0.3);
    }
    const body = b.group(bob, [0, 0.52, 0]);
    sblk(b, body, metal, [0, 0, 0], [0.62, 0.56, 0.44], null, 0.2);
    sblk(b, body, accent, [0, -0.26, 0], [0.64, 0.06, 0.46], null, 0.3);
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 128;
    const scr = new THREE.CanvasTexture(cv); scr.colorSpace = THREE.SRGBColorSpace; b.track(scr);
    const draw = (txt) => { const c = cv.getContext('2d'); c.fillStyle = '#04121a'; c.fillRect(0, 0, 256, 128); c.fillStyle = '#38f0ff'; c.font = 'bold 72px monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, 128, 68); scr.needsUpdate = true; };
    draw('T-3');
    blk(b, body, b.mat('#ffffff', { map: scr, emap: scr, glow: '#ffffff', ei: 1.2, rough: 0.1, coat: 1 }), [0, 0.04, 0.222], [0.38, 0.2, 0.01], 0.02);
    const head = b.group(bob, [0, 1.06, 0]);
    sblk(b, head, metal, [0, 0, 0], [0.56, 0.44, 0.44], null, 0.22);
    sblk(b, head, ink(b), [0, -0.01, 0.2], [0.46, 0.32, 0.06], null, 0.25);
    const eyeM = neon(b, '#38f0ff', 2.2);
    const eyes = [1, -1].map((sx) => sblk(b, head, eyeM, [sx * 0.1, 0.03, 0.235], [0.08, 0.1, 0.02], null, 0.45));
    b.torus(head, eyeM, [0, -0.08, 0.235], 0.05, 0.012, [0, 0, Math.PI], Math.PI);
    b.cyl(head, dark, [0, 0.3, 0], 0.012, 0.012, 0.16, null, 8);
    const bulb = b.ball(head, neon(b, '#ff4058', 2), [0, 0.4, 0], 0.035);
    for (const sx of [1, -1]) b.cyl(head, accent, [sx * 0.29, 0, 0], 0.06, 0.06, 0.04, [0, 0, Math.PI / 2], 24);
    const arms = [1, -1].map((sx) => {
      const a = b.group(body, [sx * 0.34, 0.18, 0]);
      sblk(b, a, dark, [sx * 0.04, -0.14, 0], [0.1, 0.3, 0.1]);
      sblk(b, a, metal, [sx * 0.04, -0.32, 0], [0.14, 0.1, 0.14], null, 0.3);
      return [a, sx];
    });
    const flames = [1, -1].map((sx) => {
      b.cyl(body, dark, [sx * 0.15, -0.12, -0.26], 0.07, 0.09, 0.14, [Math.PI / 2, 0, 0], 20);
      const f = b.cone(body, b.mat('#ffb020', { glow: '#ff6a10', ei: 2.4, opacity: 0.85 }), [sx * 0.15, -0.2, -0.3], 0.06, 0.26, [Math.PI, 0, 0], null, 16);
      const gl = glowSprite('#ff8a20', 0.5, 0.8); gl.position.set(sx * 0.15, -0.36, -0.3); body.add(gl);
      return [f, gl];
    });
    let last = -1;
    hover(b, g, 0.05, 0.14, 1.3);
    b.on((t) => {
      const n = 3 - (Math.floor(t) % 4);
      if (n !== last) { draw(n ? 'T-' + n : 'GO!'); last = n; }
      bulb.visible = Math.sin(t * 6) > 0;
      flames.forEach(([f, gl]) => { const k = 0.8 + Math.random() * 0.4 + (n === 0 ? 0.6 : 0); f.scale.set(1, k, 1); gl.material.opacity = 0.5 * k; });
      arms.forEach(([a, s], i) => (a.rotation.z = s * (0.1 + (n === 0 ? 0.9 : 0) * (i === 0 ? 1 : 0))));
      eyes.forEach((e) => (e.scale.y = (t * 0.3) % 1 < 0.04 ? 0.15 : 1));
    });
  },

  phoenix(b) {
    const fire = neon(b, '#ffb020', 1.2);
    const q = birdR(b, { color: '#ff5a1f', headColor: '#ff8a1f', belly: '#ffcf3a', beak: '#ffe07a', legs: '#ffb020', tip: '#ffe07a', tipMat: neon(b, '#ffe07a', 1.6), crest: '#ffcf3a', crestO: { glow: '#ffb020', ei: 1.4 }, eyeGlow: '#fff3a0', fly: true, flap: 1.4, wingL: 0.6, tail: 5, blush: null, brow: 0.2 });
    q.wings.forEach(([w]) => w.scale.setScalar(1.25));
    q.tailG.scale.set(1.3, 1.3, 1.8);
    q.body.add(Object.assign(glowSprite('#ff8a1f', 1.6, 0.5)));
    swarm(b, q.g, 50, '#ffd36a', 0.08, (s, t, o, i) => {
      const k = (t * (0.4 + s[0] * 0.3) + s[1]) % 1, a = s[2] * TAU;
      o[0] = Math.cos(a) * (0.2 + k * 0.5); o[1] = 0.3 + k * 1.2 - (s[3] > 0.5 ? k * k * 0.6 : 0); o[2] = -0.2 + Math.sin(a) * (0.2 + k * 0.5); o[3] = 1 - k;
      const c = [[1, 0.35, 0.4], [1, 0.88, 0.48], [0.35, 0.82, 1]][i % 3]; o[4] = c[0]; o[5] = c[1]; o[6] = c[2];
    });
    hover(b, q.g, 0.06, 0.16, 1.2);
  },
};
