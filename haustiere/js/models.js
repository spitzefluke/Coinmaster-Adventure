// Alle 77 Haustiere (Claude Design „Haustiere Viewer“; Candy, Cartoon, Atlantis und Lava nach „Tier-Eier“). Normale: feines Block-Detail.
// Epische: dunkle Facetten, Neonadern, Kristalldornen.
import { TAU, shade, mix } from './engine.js';
import { INK, GOLD, veins, dk, paints, specks, eyes, chainTail, quad, bird, lizard, collar, crown, halo, wingsAngel, partyHat, topHat, cape } from './kit.js';

const stripes = (c, f = 14, k = 0.45, axis = 2) => (u, p) => (Math.sin(p[axis] * f) > k && u[1] > -0.3 ? c : null);
const blobs = (b, c, k = 0.32, f = 2.6) => (u, p) => (Math.sin(p[0] * f + 1.3) * Math.sin(p[2] * f * 1.2 + 0.5) * Math.sin(p[1] * f + 2) > k * 0.3 ? c : null);
const whiskers = (b, q) => { for (const sx of [1, -1]) for (let i = 0; i < 2; i++) b.blk([sx * (q.snout[0] * 0.5 + 0.12), q.sc[1] - i * 0.05, q.front - 0.04], [0.26, 0.02, 0.02], '#f4f0ea', { rot: [0, 0, sx * (0.12 - i * 0.24)], j: 0 }); };
const tongue = (b, q) => b.blk([0, q.sc[1] - q.snout[1] * 0.55, q.front - 0.02], [q.snout[0] * 0.35, 0.05, 0.14], '#ff7a90', { rot: [0.6, 0, 0], mat: 'Smooth', j: 0 });
// Kristalldornen-Mähne / Rückenkamm
const mane = (b, q, c, glow, n = 18) => {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    b.spike([Math.cos(a) * q.hr[0] * 0.8, q.hc[1] + Math.sin(a) * q.hr[1] * 0.85, q.hc[2] - q.hr[2] * 0.45], [Math.cos(a), Math.sin(a), -0.55], 0.42 + (i % 3) * 0.14, 0.2, i % 4 ? c : glow, { mat: i % 4 ? 'Smooth' : 'Neon' });
  }
};
const ridge = (b, q, c, glow, n = 6) => {
  for (let i = 0; i < n; i++) b.spike([0, q.top - 0.04, q.body[2] * 0.55 - (i / (n - 1)) * q.body[2] * 1.2], [0, 1, -0.45], 0.26 + (i % 2) * 0.12, 0.17, i % 2 ? glow : c, { mat: i % 2 ? 'Neon' : 'Smooth' });
};

// ── Archetypen für Candy, Cartoon, Atlantis und Lava (Ideen aus Claude Design „Tier-Eier“) ──
const R2 = (b) => b.rnd() - 0.5;

// Fisch: liegt waagrecht und schwebt über ein paar Luftblasen
function fish(b, o) {
  const P = { body: [0.42, 0.48, 0.78], y: 0.95, c: '#3fb6c8', belly: null, fin: null, iris: '#1a1a24', glow: null, neon: null, paint: null, tail: 0.5, dorsal: 0.3, mat: null, blush: null, bubbles: true, ...o };
  const s = b.step, [bx, by, bz] = P.body, fin = P.fin ?? shade(P.c, 0.8);
  const bc = [0, P.y, 0];
  b.vox(bc, P.body, P.c, { mat: P.mat, paint: paints(P.paint, P.neon ? veins(P.neon) : null, P.belly ? (u) => (u[1] < -0.35 ? P.belly : null) : null) });
  for (const sy of [1, -1]) b.at([0, P.y, -bz * 0.9], [sy * 0.7, 0, 0], () => b.voxBox([0, 0, -P.tail / 2], [s * 0.7, P.tail * 0.55, P.tail], fin));
  if (P.dorsal) b.at([0, P.y + by * 0.85, -0.05], [-0.5, 0, 0], () => b.voxBox([0, P.dorsal / 2, 0], [s * 0.6, P.dorsal, P.dorsal * 0.9], fin));
  for (const sx of [1, -1]) b.at([sx * bx * 0.9, P.y - by * 0.25, bz * 0.25], [0.4, 0, sx * 0.7], () => b.voxBox([sx * 0.13, 0, 0], [0.26, s * 0.6, 0.3], fin));
  eyes(b, bc, P.body, { gap: bx * 0.6, dy: by * 0.2, size: Math.max(0.12, by * 0.24), iris: P.iris, glow: P.glow, blush: P.blush });
  b.blk([0, P.y - by * 0.25, bz * 0.97], [bx * 0.5, 0.05, 0.06], '#3a1a22', { j: 0 });
  if (P.bubbles) for (let i = 0; i < 4; i++) b.ball([R2(b) * 0.3, 0.1 + i * 0.17, bz * 0.3 + R2(b) * 0.2], 0.08 + (i % 2) * 0.04, '#bff4ff', { mat: 'Glass', j: 0 });
  return { ...P, bc, s };
}

// Schlange: aufgerollt, Kopf vorne oben
function serpent(b, o) {
  const P = { c: '#5fbf3a', band: null, belly: null, N: 54, w: 0.32, r: 0.72, rise: 0.62, iris: '#e0b020', glow: null, neon: null, hood: null, fangs: false, maw: false, fins: null, spikes: null, spikeMat: null, head: [0.28, 0.2, 0.3], mat: null, ...o };
  const s = b.step;
  for (let i = 0; i < P.N; i++) {
    const k = i / P.N, a = k * TAU * 2.1, r = P.r * (1 - k * 0.58), y = 0.16 + k * P.rise, w = P.w * (1 - k * 0.25);
    const band = P.band && i % 7 < 1;
    const pos = [Math.cos(a) * r, y, Math.sin(a) * r];
    b.blk(pos, [w, w * 0.9, 0.2], band ? P.band : P.c, { rot: [0, -a, 0], mat: P.mat });
    if (P.neon && i % 3 === 1) b.neon([pos[0], y + w * 0.46, pos[2]], [w * 0.4, s * 0.25, 0.12], P.neon, { rot: [0, -a, 0] });
    else if (!band && i % 2) b.blk([pos[0], y + w * 0.47, pos[2]], [w * 0.5, s * 0.25, 0.12], shade(P.c, 0.75), { rot: [0, -a, 0] });
    if (P.spikes && i % 5 === 2) b.spike([pos[0], y + w * 0.4, pos[2]], [0, 1, 0], 0.16 + w * 0.3, 0.1, P.spikes, { mat: P.spikeMat });
    if (P.fins && i % 6 === 3) b.at([pos[0], y + w * 0.45, pos[2]], [0, -a, 0], () => b.wedge([0, 0.1, 0], [0.03, 0.22, 0.26], P.fins, { mat: P.spikeMat }));
  }
  const top = 0.16 + P.rise;
  const hr = P.head, hc = [0.05, top + 0.3, 0.28];
  b.at([0.05, top + 0.1, 0.2], [-0.2, 0, 0], () => b.voxBox([0, 0.05, 0], [hr[0] * 0.85, 0.3, hr[0] * 0.85], P.c));
  if (P.hood) b.vox([0.05, hc[1] - 0.02, hc[2] - 0.14], [hr[0] * 1.7, hr[1] * 1.9, 0.07], P.hood, { cut: (u) => u[1] < -0.6 });
  b.vox(hc, hr, P.c, { paint: (u) => (P.belly && u[1] < -0.5 ? P.belly : null) });
  eyes(b, hc, hr, { gap: hr[0] * 0.46, size: Math.max(0.1, hr[1] * 0.55), iris: P.iris, glow: P.glow });
  if (P.maw) {
    b.blk([hc[0], hc[1] - hr[1] * 0.75, hc[2] + hr[2] * 0.6], [hr[0] * 1.3, 0.08, hr[2] * 1.0], shade(P.c, 0.7));
    b.blk([hc[0], hc[1] - hr[1] * 0.5, hc[2] + hr[2] * 0.75], [hr[0] * 1.1, 0.1, 0.06], '#2a0e12', { j: 0 });
    for (let i = 0; i < 5; i++) b.spike([hc[0] + (i - 2) * hr[0] * 0.22, hc[1] - hr[1] * 0.35, hc[2] + hr[2] * 0.85], [0, -1, 0.1], 0.1, 0.05, '#f2ede2', { mat: 'Smooth' });
  } else {
    b.blk([hc[0], hc[1] - 0.08, hc[2] + hr[2] + 0.1], [0.04, 0.02, 0.2], '#e0304a', { j: 0 });
    for (const sx of [1, -1]) b.blk([hc[0] + sx * 0.03, hc[1] - 0.08, hc[2] + hr[2] + 0.22], [0.02, 0.02, 0.08], '#e0304a', { rot: [0, sx * 0.5, 0], j: 0 });
  }
  if (P.fangs) for (const sx of [1, -1]) b.spike([hc[0] + sx * hr[0] * 0.3, hc[1] - hr[1] * 0.45, hc[2] + hr[2] * 0.85], [0, -1, 0.1], 0.12, 0.05, '#f2ede2', { mat: 'Smooth' });
  return { ...P, hc, hr, top };
}

// Krake/Qualle: Kopf über acht Armen (Qualle schwebt, Glas, hängende Fäden)
function octo(b, o) {
  const P = { c: '#a83a4a', b: null, n: 8, R: 0.5, y: 0.7, tl: 1.2, iris: '#1a1a24', glow: null, neon: null, jelly: false, mat: null, paint: null, blush: null, ...o };
  const s = b.step, hy = P.y + P.R * 0.75, hc = [0, hy, -0.02], hr = [P.R, P.R * 1.12, P.R];
  b.vox(hc, hr, P.c, { mat: P.mat, cut: P.jelly ? (u) => u[1] < -0.15 : null, paint: paints(P.paint, P.neon ? veins(P.neon, 3.6, 0.12) : null) });
  if (P.jelly) b.vox([0, hy + 0.05, -0.02], [P.R * 0.45, P.R * 0.4, P.R * 0.45], P.glow ?? P.b ?? P.c, { mat: 'Neon' });
  eyes(b, hc, hr, { gap: P.R * 0.38, dy: P.jelly ? P.R * 0.2 : -P.R * 0.12, size: 0.14, iris: P.iris, glow: P.jelly ? null : P.glow, blush: P.blush });
  for (let i = 0; i < P.n; i++) {
    const a = (i / P.n) * TAU + 0.2;
    const N = P.jelly ? 9 : 13;
    for (let j = 0; j < N; j++) {
      const t = j / (N - 1);
      let rad, y;
      if (P.jelly) { rad = P.R * 0.55 + Math.sin(t * 3 + i) * 0.06; y = hy - P.R * 0.2 - t * P.tl; }
      else { rad = P.R * 0.55 + t * P.tl * 0.7; y = Math.max(0.06, P.y * (1 - t * 1.6)) + (t > 0.75 ? (t - 0.75) * 0.9 : 0); }
      const w = (P.jelly ? 0.06 : 0.17) * (1 - t * 0.6);
      b.blk([Math.cos(a) * rad, y, Math.sin(a) * rad], [w, w, w * 1.2], j % 2 && P.b && !P.jelly ? P.b : P.c, { rot: [0, -a, 0], mat: P.jelly ? 'Glass' : P.mat });
      if (P.neon && !P.jelly && j % 3 === 1) b.neon([Math.cos(a) * rad, y + w * 0.5, Math.sin(a) * rad], [w * 0.5, 0.02, w * 0.5], P.neon);
    }
  }
  return { ...P, hc, hr, top: hy + hr[1] };
}

// Blob: weicher Tropfen mit Gesicht
function blob(b, o) {
  const P = { c: '#fff4ea', r: [0.6, 0.45, 0.55], iris: '#2a1a24', mat: null, paint: null, blush: '#ff9fb2', glow: null, ...o };
  const bc = [0, P.r[1], 0];
  b.vox(bc, P.r, P.c, { mat: P.mat, paint: P.paint });
  eyes(b, bc, P.r, { gap: P.r[0] * 0.36, dy: P.r[1] * 0.18, size: 0.13, iris: P.iris, glow: P.glow, blush: P.blush });
  b.blk([0, P.r[1] * 0.85, P.r[2] * 0.96], [0.14, 0.04, 0.05], '#3a1a22', { j: 0 });
  return { ...P, bc, top: P.r[1] * 2 };
}

// Zweibeiner: rundlicher Körper, Kopf, Ärmchen, Beinchen
function biped(b, o) {
  const P = { c: '#ff5a7a', belly: null, body: [0.42, 0.42, 0.36], head: [0.4, 0.36, 0.36], legH: 0.24, mat: null, ear: 'round', snout: [0.22, 0.14, 0.1], iris: '#2a1a24', nose: INK, blush: '#ff9fb2', ...o };
  const s = b.step, [bx, by, bz] = P.body;
  for (const sx of [1, -1]) {
    b.voxBox([sx * bx * 0.45, P.legH / 2 + s * 0.3, 0], [0.2, P.legH, 0.22], P.c, { mat: P.mat });
    b.blk([sx * bx * 0.45, s * 0.3, 0.05], [0.24, s * 0.6, 0.3], shade(P.c, 0.85), { mat: P.mat });
  }
  const bc = [0, P.legH + by * 0.9, 0];
  b.vox(bc, P.body, P.c, { mat: P.mat, paint: P.belly ? (u) => (u[2] > 0.5 && u[1] < 0.4 ? P.belly : null) : null });
  for (const sx of [1, -1]) b.at([sx * bx * 0.95, bc[1] + by * 0.2, 0.05], [0, 0, sx * 0.35], () => b.voxBox([0, -0.15, 0], [0.16, 0.34, 0.16], P.c, { mat: P.mat }));
  const hr = P.head, hc = [0, bc[1] + by * 0.85 + hr[1] * 0.6, 0.04];
  b.vox(hc, hr, P.c, { mat: P.mat });
  if (P.ear === 'round') for (const sx of [1, -1]) b.vox([sx * hr[0] * 0.65, hc[1] + hr[1] * 0.75, hc[2] - 0.05], [0.12, 0.12, 0.08], P.c, { mat: P.mat });
  if (P.ear === 'long') for (const sx of [1, -1]) b.at([sx * hr[0] * 0.35, hc[1] + hr[1] * 0.7, hc[2] - 0.05], [-0.1, 0, -sx * 0.12], () => { b.voxBox([0, 0.3, 0], [0.16, 0.62, 0.12], P.c, { mat: P.mat }); b.blk([0, 0.3, 0.07], [0.08, 0.48, 0.03], P.inner ?? '#ffc2cc', { j: 0 }); });
  const [sw, sh, sd] = P.snout;
  const front = hc[2] + hr[2] * 0.9;
  if (sd) b.voxBox([0, hc[1] - hr[1] * 0.3, front], [sw, sh, sd], P.belly ?? P.c, { mat: P.mat });
  b.blk([0, hc[1] - hr[1] * 0.18, front + sd / 2 + 0.02], [sw * 0.4, sh * 0.35, 0.05], P.nose, { mat: 'Smooth', j: 0 });
  eyes(b, hc, hr, { gap: hr[0] * 0.42, dy: hr[1] * 0.15, iris: P.iris, glow: P.glow, blush: P.blush });
  return { ...P, bc, hc, hr, headTop: hc[1] + hr[1], top: bc[1] + by };
}

// Drache: Vierbeiner mit Hörnern, Rückenkamm, Fledermausflügeln und Stachelschwanz
function dragon(b, o) {
  const P = { c: '#9fe6c8', belly: '#ffb3d1', wing: null, horn: '#fff0f6', hornMat: null, glow: null, neon: null, iris: '#2a3a34', tipMat: null, ...o };
  const q = quad(b, { body: [0.62, 0.5, 0.95], head: [0.46, 0.4, 0.46], snout: [0.36, 0.24, 0.36], legW: 0.3, legH: 0.55, ear: 'none', tail: 'thin', tailL: 1.5, tailUp: 0.35, tailCurl: 0.05, tip: P.horn, brow: 0.25, blush: null, ...P, wing: undefined });
  for (const sx of [1, -1]) b.spike([sx * q.hr[0] * 0.45, q.headTop - 0.05, q.hc[2] - 0.15], [sx * 0.35, 1, -0.9], 0.36, 0.12, P.horn, { mat: P.hornMat });
  for (let i = 0; i < 6; i++) b.spike([0, q.top - 0.04, q.body[2] * 0.55 - (i / 5) * q.body[2] * 1.3], [0, 1, -0.45], 0.2 + (i % 2) * 0.08, 0.14, i % 2 && P.neon ? P.neon : P.horn, { mat: i % 2 && P.neon ? 'Neon' : P.hornMat });
  if (q.tailEnd) b.spike(q.tailEnd, [0, 0.3, -1], 0.3, 0.2, P.horn, { mat: P.hornMat });
  const W = P.wing ?? shade(P.c, 0.75);
  for (const sx of [1, -1]) {
    b.push([sx * q.body[0] * 0.7, q.top - 0.08, 0.1], [0, sx * 0.25, sx * 0.55]);
    b.blk([sx * 0.45, 0, 0], [0.9, 0.08, 0.08], shade(P.c, 0.6));
    for (let f = 0; f < 3; f++) {
      const a = 0.5 + f * 0.45;
      b.at([sx * 0.88, 0, 0], [0, -sx * a, 0], () => {
        b.blk([sx * 0.38, 0, 0], [0.76 - f * 0.12, 0.05, 0.05], shade(P.c, 0.6));
        b.blk([sx * 0.3, -0.02, -0.17], [0.62 - f * 0.1, 0.02, 0.34], W, { mat: f === 1 && P.neon ? 'Neon' : null });
      });
    }
    b.blk([sx * 0.45, -0.02, -0.22], [0.8, 0.02, 0.44], W);
    b.pop();
  }
  return q;
}

// Schaf: Vierbeiner mit Wollbällchen
function sheep(b, o) {
  const P = { wool: '#f3efe6', face: '#3a3540', woolMat: null, ...o };
  const q = quad(b, { c: P.face, body: [0.6, 0.5, 0.7], legH: 0.42, legW: 0.22, head: [0.36, 0.36, 0.36], snout: [0.24, 0.16, 0.1], ear: 'side', earS: 0.8, inner: '#ffb0c4', tail: 'stub', tip: P.wool, iris: '#2a2530', paint: () => P.wool, blush: '#ff9fb2', ...P });
  for (let i = 0; i < 22; i++) {
    const a = b.rnd() * TAU, e = 0.2 + b.rnd() * 1.1;
    const p = [Math.cos(a) * Math.sin(e) * 0.62, q.bodyY + Math.cos(e) * 0.5, Math.sin(a) * Math.sin(e) * 0.72];
    b.vox(p, [0.17, 0.15, 0.17], P.wool, { mat: P.woolMat, step: 0.09 });
  }
  b.vox([0, q.headTop, q.hc[2] - 0.05], [0.22, 0.13, 0.2], P.wool, { mat: P.woolMat, step: 0.09 });
  return q;
}

// Schildkröte: kurze Beine, Panzerkuppel mit Platten
function turtle(b, o) {
  const P = { c: '#7d8f55', shell: '#6b4e2e', rim: null, ...o };
  const q = quad(b, { body: [0.5, 0.28, 0.62], legH: 0.22, legW: 0.26, head: [0.3, 0.28, 0.3], headFwd: 0.12, headUp: -0.1, snout: [0.2, 0.12, 0.06], ear: 'none', tail: 'stub', iris: '#2c2418', blush: null, ...P });
  const sc = [0, q.bodyY + 0.12, -0.02];
  b.vox(sc, [0.66, 0.4, 0.78], P.shell, { cut: (u) => u[1] < -0.15, paint: (u, p) => (Math.abs(Math.sin(p[0] * 7)) < 0.18 || Math.abs(Math.sin(p[2] * 7)) < 0.18 ? (P.rim ?? shade(P.shell, 0.7)) : null) });
  return { ...q, shellTop: sc[1] + 0.4, sc };
}

// Käfer: flacher Panzer, sechs Beine, Horn
function beetle(b, o) {
  const P = { c: '#2a1e1c', shell: '#4a2a22', glow: '#ff8a3d', mat: 'Metal', ...o };
  const s = b.step;
  for (const sz of [-0.3, 0, 0.3]) for (const sx of [1, -1]) b.at([sx * 0.45, 0.22, sz], [0, 0, -sx * 0.6], () => { b.blk([sx * 0.15, 0, 0], [0.32, 0.06, 0.06], P.c); b.blk([sx * 0.32, -0.12, 0], [0.06, 0.26, 0.06], P.c, { rot: [0, 0, sx * 0.5] }); });
  b.vox([0, 0.4, -0.05], [0.55, 0.32, 0.68], P.shell, { mat: P.mat, paint: (u, p) => (Math.abs(p[0]) < s * 0.5 && u[1] > 0 ? P.glow ? { c: P.glow, mat: 'Neon' } : INK : null) });
  const hc = [0, 0.38, 0.68], hr = [0.3, 0.22, 0.2];
  b.vox(hc, hr, P.c);
  eyes(b, hc, hr, { gap: 0.13, size: 0.1, glow: P.glow });
  b.spike([0, hc[1] + 0.1, hc[2] + 0.1], [0, 1, 0.8], 0.42, 0.14, P.shell, { mat: P.mat });
  return { hc, hr };
}

// Fähnchen am Stab (zum Halten)
const flag = (b, pos, c = '#ff6a8a') => b.at(pos, [0, 0, 0.15], () => { b.cyl([0, 0.4, 0], [0.04, 0.8, 0.04], '#f4f1ea'); b.blk([0.16, 0.68, 0], [0.3, 0.2, 0.02], c); });
// Lolli am Stab
const lolly = (b, pos) => b.at(pos, [0, 0, -0.15], () => { b.cyl([0, 0.3, 0], [0.04, 0.6, 0.04], '#fbf8f2'); b.cyl([0, 0.72, 0], [0.42, 0.06, 0.42], '#ff5aa5', { rot: [Math.PI / 2, 0, 0], mat: 'Smooth' }); b.ring([0, 0.72, 0.04], 0.13, 10, [0.06, 0.04, 0.03], '#fff4ea', { mat: 'Smooth' }); });
// Schleife
const bow = (b, pos, c) => { for (const sx of [1, -1]) b.wedge([pos[0] + sx * 0.09, pos[1], pos[2]], [0.06, 0.14, 0.14], c, { rot: [0, sx * Math.PI / 2, 0] }); b.ball(pos, 0.07, c); };
// Krone
const smallCrown = (b, pos, k = 0.8) => crown(b, pos, k);
// Flammen aus Neon-Dornen
const flames = (b, pts) => pts.forEach((p, i) => { b.spike(p, [0, 1, -0.2], 0.22 + (i % 2) * 0.1, 0.12, '#ffb347', { mat: 'Neon' }); b.spike(p, [0, 1, -0.2], 0.12, 0.07, '#fff0a0', { mat: 'Neon' }); });
// Streusel
const sprinkle = (b, pts, cols = ['#ff7eb6', '#8be0ff', '#ffe46b', '#a6f08a', '#f4f1ea']) => pts.forEach((p, i) => b.blk(p, [0.1, 0.03, 0.03], cols[i % cols.length], { rot: [b.rnd(), b.rnd() * 3, 0], mat: 'Smooth', j: 0 }));
const onBack = (b, q, n, h = 0) => Array.from({ length: n }, () => { const a = b.rnd() * TAU, e = b.rnd() * 0.9; return [Math.cos(a) * Math.sin(e) * q.body[0] * 0.9, q.bodyY + Math.cos(e) * q.body[1] * 0.98 + h, Math.sin(a) * Math.sin(e) * q.body[2] * 0.9]; });
// Korallen auf dem Panzer
const corals = (b, pts) => pts.forEach((p, i) => { const c = ['#ff7a8a', '#ffb15a', '#c77dff'][i % 3]; b.at(p, [0, b.rnd() * 3, R2(b) * 0.4], () => { b.cyl([0, 0.1, 0], [0.06, 0.2, 0.06], c); for (const a of [-0.6, 0.5]) b.at([0, 0.16, 0], [0, 0, a], () => { b.cyl([0, 0.09, 0], [0.045, 0.18, 0.045], c); b.ball([0, 0.19, 0], 0.07, c); }); }); });

export const MODELS = {
  // ── Normal Egg ──
  hund(b) {
    const q = quad(b, { c: '#c98a4b', belly: '#f6e1bd', ear: 'floppy', earC: '#8f5627', tail: 'thin', muzzle: '#f6e1bd', iris: '#6b3a12', headPaint: (u) => (u[0] > 0.25 && u[1] > -0.05 && u[2] > 0.3 ? '#8f5627' : null) });
    collar(b, q, '#d23a3a'); tongue(b, q);
  },
  katze(b) {
    const q = quad(b, { c: '#a3a3ad', belly: '#f2efe8', body: [0.55, 0.46, 0.84], head: [0.58, 0.5, 0.46], legW: 0.26, snout: [0.32, 0.18, 0.12], ear: 'pointy', earS: 1.15, tail: 'thin', tailL: 1.4, tailUp: 1.2, tailCurl: 0.08, iris: '#8bd23a', nose: '#e48f98', paint: stripes('#5d5d6a'), headPaint: (u, p) => (u[1] > 0.55 && Math.abs(Math.sin(p[0] * 22)) > 0.7 ? '#5d5d6a' : null) });
    whiskers(b, q);
  },
  kueken(b) {
    const s = b.step, Y = '#ffd23f', SH = '#fbf4e4', OR = '#ff9a1f';
    b.vox([0, 0.32, 0], [0.62, 0.36, 0.62], SH, { cut: (u) => u[1] > 0.2 });
    for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU; b.spike([Math.cos(a) * 0.55, 0.36, Math.sin(a) * 0.55], [Math.cos(a) * 0.2, 1, Math.sin(a) * 0.2], 0.16 + (i % 2) * 0.08, 0.16, SH); }
    b.vox([0, 0.72, 0], [0.5, 0.42, 0.48], Y);
    const hc = [0, 1.25, 0.06], hr = [0.42, 0.36, 0.38];
    b.vox(hc, hr, Y);
    b.at([0, hc[1] - 0.04, 0.5], [Math.PI / 2, 0, 0], () => b.blk([0, 0, 0], [0.18, 0.16, 0.12], OR));
    b.wedge([0, hc[1] - 0.04, 0.6], [0.16, 0.1, 0.14], OR, { rot: [0, Math.PI, 0] });
    eyes(b, hc, hr, { gap: 0.15, size: 0.12, blush: '#ff9fb2' });
    for (const [x, r] of [[-0.06, 0.4], [0, 0], [0.06, -0.4]]) b.blk([x, hc[1] + hr[1] + 0.06, 0], [0.05, 0.16, 0.05], Y, { rot: [0, 0, r] });
    b.at([0.05, hc[1] + 0.26, 0], [0.1, 0, -0.3], () => b.vox([0, 0, 0], [0.34, 0.12, 0.32], SH, { cut: (u) => u[1] < -0.2 }));
    for (const sx of [1, -1]) {
      b.voxBox([sx * 0.5, 0.78, 0], [s, 0.3, 0.36], Y);
      for (const a of [-0.4, 0, 0.4]) b.blk([sx * 0.16 + Math.sin(a) * 0.08, 0.03, 0.5 + Math.cos(a) * 0.08], [0.06, 0.05, 0.18], OR, { rot: [0, a, 0] });
    }
  },
  pferd(b) {
    const D = '#25160f';
    const q = quad(b, { c: '#7b4a2b', body: [0.55, 0.52, 1.05], legH: 1.05, legW: 0.26, head: [0.34, 0.4, 0.55], headUp: 0.55, headFwd: 0.2, snout: [0.36, 0.3, 0.26], muzzle: '#4e2e1c', ear: 'pointy', earS: 0.75, tail: 'horse', tailC: D, hoof: '#2a2422', nose: '#2a1a14', blush: null, headPaint: (u) => (Math.abs(u[0]) < 0.25 && u[2] > 0.5 && u[1] > -0.2 ? '#f4efe6' : null) });
    b.at([0, q.bodyY + 0.55, q.body[2] * 0.75], [-0.6, 0, 0], () => b.voxBox([0, 0.2, 0], [0.42, 0.7, 0.4], q.c));
    for (let i = 0; i < 7; i++) b.blk([0, q.hc[1] + q.hr[1] * 0.6 - i * 0.12, q.hc[2] - q.hr[2] * 0.7 - i * 0.07], [0.12, 0.18, 0.16], D, { rot: [-0.6, 0, 0] });
    b.voxBox([0, q.top + 0.02, 0], [q.body[0] * 2.08, 0.12, 0.6], '#8a1f2a', { paint: (u) => (Math.abs(u[1]) < 0.2 && Math.abs(u[2]) > 0.8 ? GOLD : null) });
    b.blk([0, q.top + 0.12, 0.22], [0.12, 0.1, 0.1], GOLD, { mat: 'Metal' });
  },
  kuh(b) {
    const q = quad(b, { c: '#f7f4ee', body: [0.7, 0.58, 0.98], legW: 0.32, head: [0.56, 0.5, 0.46], snout: [0.52, 0.3, 0.2], muzzle: '#f2a6b0', nose: '#d06c7c', ear: 'side', inner: '#f2a6b0', tail: 'tuft', tip: '#2a2224', hoof: '#3a302c', paint: blobs(b, '#2a2224', 0.35, 3.4), headPaint: (u) => (u[0] < -0.2 && u[1] > 0 ? '#2a2224' : null) });
    for (const sx of [1, -1]) b.spike([sx * q.hr[0] * 0.6, q.headTop - 0.04, q.hc[2] - 0.05], [sx, 0.9, 0], 0.22, 0.1, '#efe2c4');
    collar(b, q, '#3a6fd8', false);
    b.cyl([0, q.neck[1] - 0.3, q.neck[2] + 0.38], [0.2, 0.2, 0.2], GOLD, { mat: 'Metal', j: 0 });
    b.blk([0, q.neck[1] - 0.42, q.neck[2] + 0.38], [0.24, 0.06, 0.24], GOLD, { mat: 'Metal', j: 0 });
  },
  frettchen(b) {
    const G = '#ffd89a', C = dk('#e9d6b4', G, 0.6);
    const q = quad(b, { c: C, body: [0.44, 0.4, 1.0], legH: 0.42, legW: 0.24, legC: dk('#5a3c26', G, 0.5), head: [0.42, 0.38, 0.38], snout: [0.26, 0.16, 0.14], ear: 'round', earS: 0.8, tail: 'bushy', tailL: 0.8, tailUp: 0.25, tip: dk('#5a3c26', G, 0.5), neon: G, glow: G, brow: -0.15, headPaint: (u) => (u[2] > 0.4 && Math.abs(u[1]) < 0.22 ? dk('#6a4630', G, 0.5) : null) });
    crown(b, [0, q.headTop - 0.04, q.hc[2]], 1.05);
    cape(b, [0, q.top + 0.08, q.body[2] * 0.6], 0.95, 0.85, '#7a0f22', '#fbf8f2');
    b.at([q.body[0] + 0.18, 0.1, q.body[2] * 0.4], [0.2, 0, -0.15], () => {
      b.cyl([0, 0.5, 0], [0.05, 1, 0.05], GOLD, { mat: 'Metal' });
      b.blk([0, 1.06, 0], [0.12, 0.16, 0.12], '#e3263f', { mat: 'Neon', rot: [0.6, 0.6, 0] });
    });
    ridge(b, q, dk('#e9d6b4', G, 0.4), G, 5);
  },
  otter(b) {
    const G = '#ffd89a', SEA = '#3fd2e8', C = dk('#7a4f2e', SEA, 0.55);
    const q = quad(b, { c: C, belly: dk('#d9b98e', SEA, 0.5), body: [0.56, 0.46, 0.88], legH: 0.42, head: [0.5, 0.44, 0.42], snout: [0.36, 0.2, 0.14], ear: 'round', earS: 0.6, tail: 'thin', tailL: 1.2, tailUp: 0.15, tailCurl: 0.02, neon: SEA, glow: SEA, headUp: 0.08 });
    whiskers(b, q);
    for (let i = 0; i < 5; i++) b.spike([(i - 2) * 0.1, q.headTop - 0.03, q.hc[2] - 0.04], [(i - 2) * 0.25, 1, 0], 0.18 + (2 - Math.abs(i - 2)) * 0.07, 0.11, SEA, { mat: i % 2 ? 'Neon' : 'Glass' });
    b.ball([0, q.headTop + 0.32, q.hc[2] - 0.04], 0.12, '#fff6f0', { mat: 'Neon' });
    b.at([q.body[0] + 0.2, 0.05, q.body[2] * 0.35], [0.15, 0, -0.12], () => {
      b.cyl([0, 0.75, 0], [0.05, 1.5, 0.05], GOLD, { mat: 'Metal' });
      b.blk([0, 1.48, 0], [0.4, 0.06, 0.06], GOLD, { mat: 'Metal' });
      for (const x of [-0.17, 0, 0.17]) b.spike([x, 1.5, 0], [0, 1, 0], x ? 0.24 : 0.32, 0.08, GOLD, { mat: 'Metal' });
    });
  },

  // ── Wald Egg ──
  fuchs(b) {
    const W = '#fff3e2';
    quad(b, { c: '#e8752a', belly: W, muzzle: W, body: [0.55, 0.48, 0.86], legW: 0.26, legC: '#3a2620', head: [0.58, 0.48, 0.44], snout: [0.3, 0.2, 0.28], ear: 'pointy', earS: 1.25, inner: '#3a2620', tail: 'bushy', tailL: 1.1, tailUp: 0.4, tip: W, iris: '#9a5a10', headPaint: (u) => (u[1] < -0.15 && Math.abs(u[0]) > 0.3 ? W : null) });
  },
  reh(b) {
    const q = quad(b, { c: '#b9784a', belly: '#f6e8d6', muzzle: '#f6e8d6', body: [0.5, 0.46, 0.86], legH: 0.95, legW: 0.2, head: [0.4, 0.4, 0.42], headUp: 0.25, snout: [0.28, 0.2, 0.18], ear: 'side', earS: 0.95, inner: '#f2c0b0', tail: 'stub', tip: '#ffffff', hoof: '#2a2220', iris: '#2a1810', paint: (u) => (u[1] > 0.2 && b.rnd() < 0.12 ? '#fbf5ea' : null) });
    b.at([0, q.bodyY + 0.4, q.body[2] * 0.75], [-0.5, 0, 0], () => b.voxBox([0, 0.15, 0], [0.32, 0.5, 0.32], q.c));
  },
  frosch(b) {
    const s = b.step, M = '#6cc24a', BE = '#e9f5b8', SP = '#3e8a35';
    b.cyl([0, 0.04, 0], [1.9, 0.08, 1.9], '#3e9b45', { j: 0 });
    b.blk([0.5, 0.09, 0.3], [0.7, 0.02, 0.04], '#2f7a37', { rot: [0, -0.5, 0], j: 0 });
    for (let i = 0; i < 6; i++) b.spike([-0.55, 0.1, -0.4], [Math.cos(i), 1.2, Math.sin(i)], 0.22, 0.1, '#ff9fc4');
    const bc = [0, 0.42, 0];
    b.vox(bc, [0.6, 0.34, 0.54], M, { paint: (u, p) => (u[2] > 0.5 && u[1] < 0.1 ? BE : u[1] > 0.5 && Math.sin(p[0] * 9) * Math.sin(p[2] * 9) > 0.5 ? SP : null) });
    for (const sx of [1, -1]) {
      const ec = [sx * 0.28, 0.76, 0.24];
      b.vox(ec, [0.18, 0.17, 0.17], M);
      eyes(b, [ec[0], ec[1], ec[2]], [0.18, 0.17, 0.17], { gap: 0, dy: 0.02, size: 0.13, iris: '#d8a020' });
      b.voxBox([sx * 0.52, 0.24, -0.18], [0.24, 0.36, 0.46], M);
      b.voxBox([sx * 0.56, 0.06, 0.08], [0.22, s, 0.36], M);
      b.voxBox([sx * 0.32, 0.18, 0.42], [s, 0.3, s], M);
      b.blk([sx * 0.34, 0.06, 0.5], [0.2, 0.05, 0.14], M);
    }
    b.blk([0, 0.36, 0.56], [0.44, 0.04, 0.04], '#2a4a1e', { j: 0 });
    b.vox([0, 0.26, 0.48], [0.18, 0.1, 0.08], '#f2f7c8');
  },
  dachs(b) {
    const BL = '#24222a';
    quad(b, { c: '#8e8e94', body: [0.66, 0.44, 0.92], legH: 0.36, legW: 0.3, legC: BL, head: [0.48, 0.4, 0.46], headC: '#f4f2ee', snout: [0.28, 0.2, 0.26], muzzle: '#f4f2ee', ear: 'round', earS: 0.7, earC: BL, tail: 'stub', iris: '#2a1810', paint: (u) => (u[1] > 0.6 ? '#6a6a72' : null), headPaint: (u) => (Math.abs(Math.abs(u[0]) - 0.45) < 0.2 && u[2] > -0.2 ? BL : null) });
  },
  schlange(b) {
    const M = '#5fbf3a', BAND = '#f2d03a', BE = '#e9f2b0', s = b.step;
    const N = 54;
    for (let i = 0; i < N; i++) {
      const k = i / N, a = k * TAU * 2.1, r = 0.72 - k * 0.42, y = 0.16 + k * 0.62, w = 0.32 - k * 0.08;
      const band = i % 7 < 1;
      b.blk([Math.cos(a) * r, y, Math.sin(a) * r], [w, w * 0.9, 0.2], band ? BAND : M, { rot: [0, -a, 0] });
      if (!band && i % 2) b.blk([Math.cos(a) * r, y + w * 0.47, Math.sin(a) * r], [w * 0.5, s * 0.25, 0.12], shade(M, 0.75), { rot: [0, -a, 0] });
    }
    const hc = [0.05, 0.92, 0.28], hr = [0.28, 0.2, 0.3];
    b.at([0.05, 0.72, 0.2], [-0.2, 0, 0], () => b.voxBox([0, 0.05, 0], [0.24, 0.3, 0.24], M));
    b.vox(hc, hr, M, { paint: (u) => (u[1] < -0.5 ? BE : null) });
    eyes(b, hc, hr, { gap: 0.13, size: 0.11, iris: '#e0b020' });
    b.blk([hc[0], hc[1] - 0.08, hc[2] + hr[2] + 0.1], [0.04, 0.02, 0.2], '#e0304a', { j: 0 });
    for (const sx of [1, -1]) b.blk([hc[0] + sx * 0.03, hc[1] - 0.08, hc[2] + hr[2] + 0.22], [0.02, 0.02, 0.08], '#e0304a', { rot: [0, sx * 0.5, 0], j: 0 });
  },
  baer(b) {
    const G = '#b6ff6a', C = dk('#7a5032', G, 0.6);
    const q = quad(b, { c: C, belly: dk('#b8875a', G, 0.55), muzzle: dk('#c89a6a', G, 0.45), body: [0.86, 0.66, 1.0], legH: 0.5, legW: 0.38, head: [0.6, 0.52, 0.5], snout: [0.38, 0.26, 0.2], ear: 'round', earS: 0.85, tail: 'stub', neon: G, glow: G, brow: -0.12 });
    const moss = '#3f7a2e';
    b.vox([0, q.top - 0.06, -0.05], [0.62, 0.12, 0.72], moss, { cut: (u) => u[1] < 0, paint: () => (b.rnd() < 0.08 ? { c: G, mat: 'Neon' } : null) });
    for (const [x, z] of [[0.25, -0.4], [-0.3, 0.15]]) { b.blk([x, q.top + 0.12, z], [0.06, 0.16, 0.06], '#f4ead8'); b.blk([x, q.top + 0.22, z], [0.2, 0.07, 0.2], '#e0402e'); }
    for (const sx of [1, -1]) b.at([sx * q.hr[0] * 0.45, q.headTop - 0.05, q.hc[2] - 0.05], [0, 0, -sx * 0.35], () => {
      b.blk([0, 0.25, 0], [0.08, 0.5, 0.08], '#5a3b22', { mat: 'Wood' });
      b.blk([sx * 0.1, 0.4, 0], [0.24, 0.07, 0.07], '#5a3b22', { mat: 'Wood', rot: [0, 0, sx * 0.6] });
      b.blk([-sx * 0.06, 0.56, 0], [0.07, 0.24, 0.07], '#5a3b22', { mat: 'Wood', rot: [0, 0, -sx * 0.4] });
      for (const [x, y] of [[sx * 0.24, 0.54], [-sx * 0.12, 0.7], [0, 0.56]]) b.neon([x, y, 0], [0.1, 0.14, 0.03], G, { rot: [0, 0, x] });
    });
  },
  wolf(b) {
    const G = '#b6ff6a', C = dk('#6e7686', G, 0.6);
    const q = quad(b, { c: C, belly: dk('#d8dde6', G, 0.6), muzzle: dk('#d8dde6', G, 0.55), body: [0.62, 0.54, 0.96], legH: 0.62, legW: 0.28, head: [0.52, 0.46, 0.46], snout: [0.32, 0.22, 0.34], ear: 'pointy', earS: 1.25, inner: dk('#3a3f4a', G), tail: 'bushy', tailL: 1.1, tailUp: 0.25, tip: G, neon: G, glow: G, brow: 0.3 });
    mane(b, q, dk('#9aa4b0', G, 0.45), G, 16);
    ridge(b, q, dk('#9aa4b0', G, 0.45), G, 6);
  },

  // ── Eis Egg ──
  schneemann(b) {
    const SN = '#f6f9ff', snowP = () => (b.rnd() < 0.1 ? '#e2ecfa' : null);
    b.vox([0, 0.42, 0], [0.56, 0.42, 0.54], SN, { paint: snowP });
    b.vox([0, 1.04, 0], [0.42, 0.34, 0.4], SN, { paint: snowP });
    const hc = [0, 1.56, 0.02], hr = [0.34, 0.3, 0.32];
    b.vox(hc, hr, SN, { paint: snowP });
    eyes(b, hc, hr, { gap: 0.12, size: 0.09, blush: '#ffb0c0' });
    for (let i = 0; i < 5; i++) { const a = Math.PI + 0.5 + (i / 4) * (Math.PI - 1); b.blk([Math.cos(a) * 0.12, hc[1] - 0.04 + Math.sin(a) * 0.05, 0.33], [0.04, 0.04, 0.04], INK, { j: 0 }); }
    b.spike([0, hc[1] + 0.02, 0.3], [0, 0, 1], 0.32, 0.1, '#ff8a1f');
    topHat(b, [0, hc[1] + hr[1] - 0.04, 0], 1.1);
    for (const y of [0.92, 1.06, 1.2]) b.blk([0, y, 0.4], [0.07, 0.07, 0.05], INK, { j: 0 });
    b.ring([0, 1.34, 0], 0.32, 14, [0.16, 0.12, 0.12], '#d23a3a');
    for (let i = 0; i < 4; i++) b.blk([0.18, 1.26 - i * 0.11, 0.34], [0.13, 0.1, 0.05], i % 2 ? '#f6f2ea' : '#d23a3a');
    for (const sx of [1, -1]) b.at([sx * 0.38, 1.1, 0], [0, 0, -sx * 0.5], () => {
      b.blk([sx * 0.3, 0, 0], [0.6, 0.05, 0.05], '#6a4426', { mat: 'Wood' });
      b.blk([sx * 0.52, 0.07, 0], [0.18, 0.04, 0.04], '#6a4426', { mat: 'Wood', rot: [0, 0, sx * 0.7] });
    });
  },
  polarhase(b) {
    const q = quad(b, { c: '#f7f9fc', body: [0.52, 0.5, 0.6], legH: 0.32, head: [0.5, 0.44, 0.42], snout: [0.24, 0.16, 0.1], ear: 'long', earS: 1.05, earTip: '#2a2a34', inner: '#ffc2cc', tail: 'stub', tip: '#ffffff', nose: '#ff9fae', iris: '#7aaee0', headUp: 0.05 });
    whiskers(b, q);
  },
  eisbaer(b) {
    const q = quad(b, { c: '#f2f5f8', body: [0.88, 0.66, 1.04], legH: 0.5, legW: 0.4, paw: '#e6ebf0', head: [0.58, 0.5, 0.48], snout: [0.38, 0.26, 0.24], muzzle: '#ffffff', ear: 'round', earS: 0.7, inner: '#c8d2dc', tail: 'stub', iris: '#2a2a3a' });
    collar(b, q, '#3a8ee0', false);
    b.voxBox([0.3, q.neck[1] - 0.35, q.neck[2] + 0.4], [0.16, 0.42, 0.08], '#3a8ee0');
    b.blk([q.body[0] + 0.32, 0.16, q.body[2] * 0.5], [0.3, 0.3, 0.3], '#bff4ff', { mat: 'Glass', rot: [0, 0.5, 0] });
  },
  robbe(b) {
    const M = '#9aa4b0', BE = '#d8dee6', SP = '#6e7884', s = b.step;
    b.vox([0, 0.32, -0.15], [0.48, 0.32, 0.82], M, { paint: (u) => (u[1] < -0.4 ? BE : b.rnd() < 0.06 ? SP : null) });
    for (const sx of [1, -1]) b.blk([sx * 0.16, 0.1, -1.0], [0.28, 0.06, 0.32], M, { rot: [0, sx * 0.4, 0] });
    const hc = [0, 0.78, 0.48], hr = [0.4, 0.36, 0.36];
    b.vox(hc, hr, M);
    b.voxBox([0, 0.66, 0.84], [0.26, 0.16, 0.12], BE);
    b.blk([0, 0.74, 0.91], [0.12, 0.06, 0.04], INK, { mat: 'Smooth', j: 0 });
    eyes(b, hc, hr, { gap: 0.15, size: 0.12, blush: '#ff9fb2' });
    for (const sx of [1, -1]) for (let i = 0; i < 2; i++) b.blk([sx * 0.26, 0.66 - i * 0.04, 0.86], [0.26, 0.015, 0.015], '#f4f0ea', { rot: [0, 0, sx * (0.12 - i * 0.24)], j: 0 });
    for (const sx of [1, -1]) b.voxBox([sx * 0.52, 0.12, 0.3], [0.32, s * 0.6, 0.3], M);
    b.at([0.4, 0.08, 0.95], [0, 0.6, 0], () => { b.voxBox([0, 0, 0], [0.1, 0.14, 0.3], '#ff9a3a'); b.wedge([0, 0, -0.2], [0.04, 0.14, 0.12], '#ff9a3a'); });
  },
  pinguin(b) {
    const M = '#1e2230', BE = '#f7f6f2', Y = '#ffcf3a', OR = '#ff9a1f', s = b.step;
    for (const sx of [1, -1]) b.blk([sx * 0.16, 0.04, 0.12], [0.22, 0.07, 0.32], OR);
    b.vox([0, 0.6, 0], [0.48, 0.58, 0.42], M, { paint: (u) => (u[2] > 0.35 && Math.abs(u[0]) < 0.62 && u[1] < 0.55 ? BE : null) });
    const hc = [0, 1.38, 0.04], hr = [0.4, 0.34, 0.36];
    b.vox(hc, hr, M, { paint: (u) => (u[2] > 0.55 && u[1] < 0.1 && Math.abs(u[0]) < 0.5 ? BE : Math.abs(u[0]) > 0.75 && u[1] > -0.2 && u[1] < 0.4 ? Y : null) });
    b.ring([0, 1.08, 0.02], 0.36, 12, [0.14, 0.08, 0.1], Y);
    b.at([0, hc[1] - 0.06, 0.42], [Math.PI / 2, 0, 0], () => b.blk([0, 0, 0], [0.14, 0.18, 0.1], OR));
    b.wedge([0, hc[1] - 0.06, 0.55], [0.12, 0.08, 0.1], OR, { rot: [0, Math.PI, 0] });
    eyes(b, hc, hr, { gap: 0.13, size: 0.1 });
    for (const sx of [1, -1]) b.at([sx * 0.48, 0.92, 0], [0, 0, sx * 0.18], () => b.voxBox([0, -0.3, 0], [s, 0.62, 0.3], M));
  },
  schneegolem(b) {
    const G = '#9ff0ff', ICE = dk('#bfeaff', G, 0.45), DK = dk('#7cc6f0', G, 0.62), SN = '#e8f4ff';
    b.step = 0.2;
    for (const sx of [1, -1]) { b.voxBox([sx * 0.28, 0.3, 0], [0.36, 0.6, 0.4], DK, { paint: veins(G) }); b.voxBox([sx * 0.28, 0.06, 0.04], [0.42, 0.12, 0.5], SN); }
    const bc = [0, 1.05, 0];
    b.voxBox(bc, [1.2, 0.9, 0.76], ICE, { paint: veins(G, 3, 0.24) });
    b.voxBox([0, 1.54, 0], [1.26, 0.12, 0.82], SN);
    b.blk([0, 1.08, 0.42], [0.22, 0.32, 0.12], G, { mat: 'Neon', rot: [0, 0, Math.PI / 4] });
    const hc = [0, 1.84, 0.06];
    b.voxBox(hc, [0.6, 0.46, 0.52], ICE, { paint: veins(G, 4, 0.18) });
    b.voxBox([0, 2.1, 0.06], [0.66, 0.1, 0.58], SN);
    for (const sx of [1, -1]) { b.neon([sx * 0.14, 1.88, 0.33], [0.14, 0.08, 0.04], G); b.blk([sx * 0.14, 1.98, 0.33], [0.18, 0.04, 0.04], INK, { rot: [0, 0, -sx * 0.3], j: 0 }); }
    for (const sx of [1, -1]) {
      for (let i = 0; i < 3; i++) b.spike([sx * (0.46 - i * 0.14), 1.58, -0.05 + i * 0.05], [sx * 0.4, 1, 0], 0.34 - i * 0.07, 0.16, i % 2 ? G : mix(G, '#ffffff', 0.4), { mat: i % 2 ? 'Neon' : 'Glass' });
      b.voxBox([sx * 0.78, 1.0, 0], [0.32, 0.7, 0.36], DK, { paint: veins(G) });
      b.voxBox([sx * 0.8, 0.52, 0.04], [0.42, 0.3, 0.42], ICE);
    }
  },
  polarfuchs(b) {
    const G = '#9ff0ff', C = dk('#f5f9ff', G, 0.72);
    const q = quad(b, { c: C, belly: dk('#ffffff', G, 0.6), muzzle: dk('#ffffff', G, 0.6), body: [0.52, 0.46, 0.84], legW: 0.24, head: [0.56, 0.48, 0.44], snout: [0.3, 0.2, 0.28], ear: 'pointy', earS: 1.3, earTip: G, inner: G, tail: 'none', neon: G, glow: G, brow: 0.25 });
    for (const yaw of [-0.55, 0, 0.55]) b.at(q.tb, [0.4, yaw, 0], () => b.vox([0, 0, -0.5], [0.2, 0.2, 0.5], C, { paint: paints((u) => (u[2] < -0.45 ? { c: G, mat: 'Neon' } : null), veins(G)) }));
    for (let i = 0; i < 5; i++) b.spike([(i - 2) * 0.11, q.headTop - 0.04, q.hc[2]], [(i - 2) * 0.2, 1, 0], 0.18 + (2 - Math.abs(i - 2)) * 0.09, 0.12, G, { mat: i % 2 ? 'Neon' : 'Glass' });
  },

  // ── Engels Egg ──
  engelshund(b) {
    const q = quad(b, { c: '#fbf3e4', belly: '#ffffff', muzzle: '#ffffff', ear: 'floppy', earC: '#f1dcb8', tail: 'thin', iris: '#4a8ad8' });
    halo(b, [0, q.headTop + 0.18, q.hc[2]]);
    wingsAngel(b, [q.body[0] * 0.7, q.top - 0.1, 0.1], 0.6);
    tongue(b, q);
  },
  engelskatze(b) {
    const q = quad(b, { c: '#ffffff', body: [0.55, 0.46, 0.84], head: [0.58, 0.5, 0.46], legW: 0.26, snout: [0.32, 0.18, 0.12], ear: 'pointy', earS: 1.15, inner: '#ffd0dc', tail: 'thin', tailL: 1.4, tailUp: 1.2, tailCurl: 0.08, tip: '#ffe9a8', iris: '#5ab8ff', nose: '#ffa0b4' });
    halo(b, [0, q.headTop + 0.2, q.hc[2]]);
    wingsAngel(b, [q.body[0] * 0.7, q.top - 0.1, 0.05], 0.6);
    whiskers(b, q);
  },
  adler(b) {
    bird(b, { c: '#6a4426', headC: '#fbf8f2', wingC: '#5a361c', beak: '#ffc62e', legs: '#ffc62e', iris: '#e0a020', brow: 0.35, tip: GOLD, tipMat: 'Metal', spread: 0.75, wingL: 1.3, tail: 7 });
  },
  engelsfuchs(b) {
    const W = '#ffffff';
    const q = quad(b, { c: '#fbe9cf', belly: W, muzzle: W, body: [0.55, 0.48, 0.86], legW: 0.26, head: [0.58, 0.48, 0.44], snout: [0.3, 0.2, 0.28], ear: 'pointy', earS: 1.25, inner: '#ffd9a8', tail: 'bushy', tailL: 1.1, tailUp: 0.4, iris: '#d89a2a' });
    b.at(q.tb, [0.4, 0, 0], () => b.vox([0, 0, -1.02], [0.16, 0.16, 0.14], '#fff1b0', { mat: 'Neon' }));
    halo(b, [0, q.headTop + 0.18, q.hc[2]]);
  },
  engel(b) {
    const SK = '#ffd9b8', RO = '#ffffff', HA = '#f6c94e';
    for (const sx of [1, -1]) b.blk([sx * 0.12, 0.06, 0.06], [0.16, 0.12, 0.22], SK);
    b.vox([0, 0.55, 0], [0.42, 0.45, 0.36], RO, { cut: (u) => u[1] < -0.85, paint: (u) => (u[1] < -0.6 || (Math.abs(u[0]) < 0.15 && u[2] > 0.5) ? GOLD : null) });
    for (const sx of [1, -1]) { b.voxBox([sx * 0.46, 0.72, 0], [0.16, 0.36, 0.18], RO); b.blk([sx * 0.47, 0.5, 0.02], [0.14, 0.12, 0.14], SK); }
    const hc = [0, 1.32, 0.02], hr = [0.4, 0.36, 0.36];
    b.vox(hc, hr, SK);
    b.vox([0, hc[1] + 0.06, hc[2] - 0.06], [0.44, 0.38, 0.36], HA, { cut: (u) => u[2] > 0.3 && u[1] < 0.55 });
    eyes(b, hc, hr, { gap: 0.13, size: 0.11, iris: '#3a7be0', blush: '#ff9fb2' });
    b.blk([0, hc[1] - 0.16, 0.37], [0.12, 0.03, 0.02], '#3a1a22', { j: 0 });
    halo(b, [0, hc[1] + 0.52, hc[2]]);
    wingsAngel(b, [0.22, 0.9, -0.3], 0.75);
    b.at([0.5, 0.58, 0.22], [0, Math.PI / 2, 0], () => {
      for (let i = 0; i < 9; i++) { const a = (i / 8) * Math.PI * 1.2 - 0.2; b.blk([0, 0.12 + Math.sin(a) * 0.13, Math.cos(a) * 0.13], [0.04, 0.05, 0.05], GOLD, { mat: 'Metal' }); }
      for (let i = 0; i < 4; i++) b.neon([0, 0.12, -0.08 + i * 0.05], [0.01, 0.2, 0.01], '#fff4c8');
    });
  },
  gott(b) {
    const G = '#ffd36a', RO = dk('#fbf8f2', G, 0.66), SK = '#d9a882', BE = '#e6e6ee';
    for (const [x, z, k] of [[0, 0, 1], [0.55, 0.1, 0.7], [-0.55, 0.05, 0.72], [0.25, 0.5, 0.6], [-0.3, 0.45, 0.6], [0.2, -0.5, 0.62], [-0.3, -0.4, 0.6]]) b.vox([x, 0.2, z], [0.42 * k, 0.24 * k, 0.36 * k], '#ffffff', { paint: () => (b.rnd() < 0.15 ? '#e6efff' : null) });
    b.vox([0, 0.92, 0], [0.5, 0.52, 0.4], RO, { paint: paints((u) => (Math.abs(u[1] - 0.05) < 0.12 ? { c: G, mat: 'Neon' } : null), veins(G, 3, 0.18)) });
    b.at([0.24, 0.95, 0.02], [0, 0, -0.5], () => b.voxBox([0, 0, 0], [0.16, 0.95, 0.82], dk('#7a3ad8', G, 0.45)));
    const hc = [0, 1.66, 0.04], hr = [0.36, 0.34, 0.33];
    b.vox(hc, hr, SK);
    b.vox([0, hc[1] - 0.24, hc[2] + 0.12], [0.34, 0.3, 0.24], BE, { cut: (u) => u[1] > 0.5 && Math.abs(u[0]) < 0.6 });
    for (let i = 0; i < 3; i++) b.spike([(i - 1) * 0.13, hc[1] - 0.46, hc[2] + 0.22], [0, -1, 0.2], 0.24, 0.12, BE);
    b.vox([0, hc[1] + 0.22, hc[2] - 0.04], [0.38, 0.14, 0.34], BE);
    eyes(b, hc, hr, { gap: 0.13, size: 0.1, glow: '#bff4ff', brow: 0.15, browC: BE });
    crown(b, [0, hc[1] + hr[1] - 0.02, hc[2]], 1.0, ['#5ab8ff', '#ffffff']);
    b.push([0, 1.7, -0.5]);
    b.cyl([0, 0, 0], [1.0, 0.06, 1.0], GOLD, { mat: 'Metal', rot: [Math.PI / 2, 0, 0], j: 0 });
    for (let i = 0; i < 18; i++) { const a = (i / 18) * TAU; b.neon([Math.cos(a) * 0.68, Math.sin(a) * 0.68, -0.02], [0.07, i % 2 ? 0.18 : 0.3, 0.04], G, { rot: [0, 0, a - Math.PI / 2] }); }
    b.pop();
    b.at([0.6, 0.55, 0.18], [0, 0, -0.1], () => {
      b.cyl([0, 0.55, 0], [0.06, 1.1, 0.06], GOLD, { mat: 'Metal' });
      b.ball([0, 1.18, 0], 0.18, '#bff4ff', { mat: 'Neon' });
      b.blk([-0.06, 0.6, 0.04], [0.14, 0.14, 0.14], SK);
    });
  },
  loewe(b) {
    const G = '#ffd36a', C = dk('#e3a94a', '#b49cff', 0.72);
    const q = quad(b, { c: C, belly: dk('#f6dca6', '#b49cff', 0.65), muzzle: dk('#f6dca6', '#b49cff', 0.55), body: [0.7, 0.58, 1.0], legH: 0.62, legW: 0.34, head: [0.52, 0.48, 0.46], snout: [0.38, 0.26, 0.24], ear: 'round', earS: 0.6, tail: 'tuft', tip: G, neon: G, glow: G, brow: 0.3 });
    mane(b, q, dk('#b05a1c', '#b49cff', 0.4), G, 22);
    for (const sx of [1, -1]) b.spike([sx * 0.12, q.sc[1] - 0.12, q.front - 0.04], [0, -1, 0.1], 0.14, 0.06, '#ffffff', { mat: 'Smooth' });
    b.voxBox([0, q.top + 0.02, 0.05], [q.body[0] * 1.6, 0.1, q.body[2] * 1.1], GOLD, { mat: 'Metal' });
    b.neon([0, q.top + 0.1, q.body[2] * 0.5], [0.12, 0.12, 0.12], '#e3263f', { rot: [0.6, 0.6, 0] });
    wingsAngel(b, [q.body[0] * 0.65, q.top + 0.05, 0.1], 1.05, { c: dk('#fbf8f2', G, 0.55), tip: G, tipMat: 'Neon' });
  },

  // ── Galaxie Egg ──
  galaxiewolf(b) {
    const C = '#1e1a48', G = '#b49cff';
    const sky = paints(specks(b, '#ffffff', 0.05), specks(b, G, 0.04), (u, p) => (Math.sin(p[0] * 3 + p[2] * 2) > 0.6 ? '#3a2a7a' : null));
    quad(b, { c: C, body: [0.6, 0.52, 0.94], legH: 0.58, legW: 0.28, head: [0.52, 0.46, 0.46], snout: [0.32, 0.22, 0.32], muzzle: '#2a2468', ear: 'pointy', earS: 1.25, inner: '#ff8ee8', tail: 'bushy', tailL: 1.1, tailUp: 0.3, glow: '#c6b4ff', brow: 0.2, paint: sky, headPaint: sky, blush: null });
  },
  singularity(b) {
    const SH = '#3a2a7a', L = '#1e1838', s = b.step;
    b.vox([0, 0.42, -0.05], [0.56, 0.3, 0.7], SH, { paint: (u, p) => (Math.abs(p[0]) < s * 0.5 && u[1] > 0 ? INK : u[1] > 0.3 && b.rnd() < 0.2 ? '#5a3aa8' : null) });
    const hc = [0, 0.4, 0.72], hr = [0.3, 0.2, 0.18];
    b.vox(hc, hr, L);
    eyes(b, hc, hr, { gap: 0.11, size: 0.1, glow: '#b49cff' });
    for (const sx of [1, -1]) {
      b.spike([sx * 0.1, 0.32, 0.86], [sx * -0.3, 0, 1], 0.2, 0.07, L);
      b.at([sx * 0.12, 0.56, 0.74], [-0.4, 0, -sx * 0.4], () => { b.blk([0, 0.18, 0], [0.04, 0.36, 0.04], L); b.ball([0, 0.38, 0], 0.07, '#b49cff', { mat: 'Neon' }); });
      for (const z of [0.35, 0, -0.35]) b.at([sx * 0.5, 0.36, z], [0, 0, -sx * 0.5], () => { b.blk([sx * 0.12, 0, 0], [0.28, 0.07, 0.07], L); b.blk([sx * 0.26, -0.16, 0], [0.07, 0.32, 0.07], L, { rot: [0, 0, sx * 0.4] }); });
    }
    b.push([0, 1.1, -0.05], [0.3, 0, 0]);
    b.ball([0, 0, 0], 0.32, '#050308', { mat: 'Smooth', j: 0 });
    b.ring([0, 0, 0], 0.42, 22, [0.1, 0.03, 0.06], '#ffb060', { mat: 'Neon' });
    b.ring([0, 0, 0], 0.56, 28, [0.09, 0.02, 0.04], '#b49cff', { mat: 'Neon' });
    b.pop();
  },
  sternbild(b) {
    const C = '#141a44', ST = '#ffffff', LI = '#aee0ff';
    const q = quad(b, { c: C, body: [0.55, 0.46, 0.84], head: [0.58, 0.5, 0.46], legW: 0.26, snout: [0.32, 0.18, 0.12], muzzle: '#1e2660', ear: 'pointy', earS: 1.15, inner: '#6a8aff', tail: 'thin', tailL: 1.4, tailUp: 1.2, tailCurl: 0.08, tip: ST, glow: '#ffffff', nose: '#aee0ff', blush: null, paint: specks(b, '#6a8aff', 0.03), headPaint: specks(b, '#6a8aff', 0.03) });
    const link = (pts) => pts.forEach((v, i) => {
      b.neon(v, [0.08, 0.08, 0.08], ST, { rot: [0.6, 0.6, 0] });
      if (!i) return;
      const a = pts[i - 1], d = [v[0] - a[0], v[1] - a[1], v[2] - a[2]], len = Math.hypot(...d);
      b.push([(a[0] + v[0]) / 2, (a[1] + v[1]) / 2, (a[2] + v[2]) / 2], [0, 0, 0]);
      b.blk([0, 0, 0], [0.025, 0.025, len], LI, { mat: 'Neon', rot: [-Math.asin(d[1] / len), Math.atan2(d[0], d[2]), 0] });
      b.pop();
    });
    const bx = q.body[0] + 0.03, y = q.bodyY;
    for (const sx of [1, -1]) link([[sx * bx * 0.9, y + 0.15, 0.5], [sx * bx, y, 0.1], [sx * bx, y + 0.2, -0.25], [sx * bx * 0.9, y - 0.08, -0.6]]);
    link([[0, q.top + 0.04, 0.5], [0.12, q.top + 0.06, 0], [-0.1, q.top + 0.04, -0.5]]);
    link([[-0.28, q.headTop, q.hc[2]], [0, q.headTop + 0.05, q.hc[2] + 0.12], [0.28, q.headTop, q.hc[2]]]);
  },
  hamster(b) {
    const q = quad(b, { c: '#e8a86a', belly: '#fff3e2', muzzle: '#fff3e2', body: [0.72, 0.6, 0.66], legH: 0.24, legW: 0.26, paw: '#ffc8c8', head: [0.62, 0.52, 0.46], snout: [0.24, 0.14, 0.08], ear: 'round', earS: 0.7, tail: 'stub', iris: '#3a2410', nose: '#ff9fae', headUp: -0.12, headPaint: (u) => (Math.abs(u[0]) > 0.55 && u[1] < 0.1 ? '#fff3e2' : null) });
    for (const sx of [1, -1]) b.vox([sx * q.hr[0] * 0.9, q.hc[1] - 0.12, q.hc[2] + 0.04], [0.2, 0.22, 0.26], '#fff3e2');
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU + 0.4, r = 1.2 + (i % 2) * 0.18, p = [Math.cos(a) * r, q.bodyY + 0.3 + Math.sin(i * 2.3) * 0.25, Math.sin(a) * r];
      if (i < 3) b.vox(p, [0.13 + (i % 2) * 0.05, 0.13 + (i % 2) * 0.05, 0.13 + (i % 2) * 0.05], ['#c8c8d8', '#7a5ad8', '#3a8ad8'][i], { step: 0.07, paint: () => (b.rnd() < 0.2 ? { c: '#b49cff', mat: 'Neon' } : null) });
      else b.blk(p, [0.08, 0.18, 0.12], '#3a3030', { rot: [i, i * 2, 0] });
    }
    b.ring([0, q.bodyY + 0.3, 0], 1.28, 40, [0.05, 0.015, 0.02], '#b49cff', { mat: 'Neon' });
  },
  komet(b) {
    const q = lizard(b, { c: '#3a6fd8', belly: '#bfe8ff', glow: '#bff4ff', spikeC: '#7ae8ff', spikeMat: 'Neon', tip: '#bff4ff', tipMat: 'Neon', tailN: 11 });
    const e = q.segs[q.segs.length - 1];
    for (let i = 0; i < 18; i++) b.neon([e[0] + (b.rnd() - 0.5) * 0.4 * (1 + i * 0.1), e[1] + 0.1 + (b.rnd() - 0.3) * 0.3, e[2] - 0.1 - i * 0.08], [0.06, 0.06, 0.06], i % 3 ? '#9ff0ff' : '#ffffff', { rot: [i, i, 0] });
  },
  ringgleiter(b) {
    const G = '#b49cff', C = dk('#7a5ad8', G, 0.55);
    const q = quad(b, { c: C, belly: dk('#e6dcff', G, 0.55), muzzle: dk('#e6dcff', G, 0.5), body: [0.58, 0.44, 0.84], legH: 0.42, head: [0.54, 0.48, 0.44], snout: [0.28, 0.16, 0.12], ear: 'round', earS: 0.9, inner: '#ff8ee8', tail: 'bushy', tailL: 1.0, tailUp: 0.9, tip: G, neon: G, glow: '#ff8ee8', nose: '#ff8ee8' });
    for (const sx of [1, -1]) b.voxBox([sx * (q.body[0] + 0.2), q.bodyY - 0.1, 0], [0.36, b.step * 0.5, q.body[2] * 1.5], dk('#9a7ae8', G, 0.4), { paint: (u) => (Math.abs(u[0]) > 0.8 ? { c: G, mat: 'Neon' } : null) });
    b.push([0, q.bodyY, 0], [0.4, 0, 0.2]);
    b.ring([0, 0, 0], 1.3, 44, [0.18, 0.04, 0.09], '#ffd9a0', { mat: 'Metal' });
    b.ring([0, 0, 0], 1.46, 50, [0.17, 0.03, 0.05], G, { mat: 'Neon' });
    b.pop();
  },
  nebelwelpe(b) {
    const G = '#ff8ee8', C = dk('#5a2a7a', G, 0.5);
    const neb = paints(specks(b, '#ffffff', 0.04), (u, p) => (Math.sin(p[0] * 2.4 + p[1] * 3) * Math.cos(p[2] * 2.2) > 0.55 ? '#7a2a8a' : null));
    const q = quad(b, { c: C, body: [0.58, 0.5, 0.74], legH: 0.42, legW: 0.3, head: [0.62, 0.54, 0.5], muzzle: dk('#ffb8e8', G, 0.45), ear: 'floppy', earC: dk(G, G, 0.4), tail: 'thin', neon: G, glow: '#ffd0f4', paint: neb, headPaint: neb });
    for (let i = 0; i < 10; i++) b.neon([(b.rnd() - 0.5) * 0.6, q.hc[1] + 0.2 + b.rnd() * 0.6, q.front + 0.1 + b.rnd() * 0.3], [0.06, 0.06, 0.06], i % 2 ? '#ffffff' : G, { rot: [i, i, 0] });
  },

  // ── Admin Egg ──
  glitchhund(b) {
    const q = quad(b, { c: '#8a8f9a', belly: '#c8ccd6', muzzle: '#c8ccd6', ear: 'pointy', earS: 0.9, tail: 'thin', glow: '#ff4058', brow: 0.15, blush: null, paint: (u, p) => (u[0] > 0.6 && Math.abs(u[1]) < 0.4 && Math.abs(u[2]) < 0.3 ? ((Math.round(p[1] / b.step) + Math.round(p[2] / b.step)) % 2 ? '#ff00dc' : '#000000') : null) });
    for (let i = 0; i < 9; i++) {
      const p = [(b.rnd() - 0.5) * 1.6, 0.3 + b.rnd() * 1.4, (b.rnd() - 0.5) * 2];
      b.blk(p, [0.08 + b.rnd() * 0.3, 0.04, 0.04 + b.rnd() * 0.2], i % 2 ? '#20f0ff' : '#ff2040', { mat: 'Neon' });
    }
    b.blk([0, q.headTop + 0.3, q.hc[2]], [0.62, 0.18, 0.04], '#120a10', { j: 0 });
    for (let i = 0; i < 7; i++) b.neon([-0.24 + i * 0.08, q.headTop + 0.3, q.hc[2] + 0.03], [0.05, 0.1, 0.02], '#ff4058');
  },
  banhammer(b) {
    const q = lizard(b, { c: '#4a8a3a', belly: '#d8e6a0', snout: [0.46, 0.22, 0.6], head: [0.42, 0.3, 0.38], body: [0.56, 0.36, 0.95], iris: '#ffcf3a', tailW: 0.36, spikeC: '#2f6a28' });
    for (const sx of [1, -1]) for (let i = 0; i < 6; i++) b.spike([sx * 0.2, q.sc[1] - 0.08, q.sc[2] - 0.24 + i * 0.1], [0, -1, 0], 0.07, 0.05, '#ffffff', { mat: 'Smooth' });
    b.at([0, q.sc[1], q.sc[2] - 0.05], [0, 0, 0.12], () => {
      b.cyl([0, 0, 0], [0.06, 0.9, 0.06], '#3a2a20', { mat: 'Wood', rot: [0, 0, Math.PI / 2] });
      b.voxBox([0.55, 0, 0], [0.3, 0.46, 0.34], '#9aa4b0', { mat: 'Metal', paint: (u) => (Math.abs(u[1]) < 0.3 ? { c: '#ff2040', mat: 'Neon' } : null) });
      b.blk([0.55, 0, 0.18], [0.24, 0.16, 0.02], '#c0102a', { j: 0 });
    });
  },
  lagschwein(b) {
    const q = quad(b, { c: '#f5a3b5', body: [0.66, 0.54, 0.8], legH: 0.36, head: [0.56, 0.5, 0.46], snout: [0.3, 0.24, 0.12], muzzle: '#ff8aa4', nose: '#a8405a', ear: 'pointy', earS: 0.8, inner: '#ff8aa4', tail: 'curl', hoof: '#c86a80', iris: '#3a2028' });
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; b.blk([Math.cos(a) * 0.2, q.headTop + 0.42 + Math.sin(a) * 0.2, q.hc[2]], [0.08, 0.08, 0.08], mix('#1a3a44', '#38f0ff', i / 7), { mat: i > 4 ? 'Neon' : 'Smooth' }); }
  },
  uivogel(b) {
    const q = bird(b, { c: '#e8ebf0', headC: '#ffffff', wingC: '#c8ced8', tip: '#3a7be0', beak: '#3a7be0', legs: '#5a6070', iris: '#3a7be0', tail: 3, spread: 0.15 });
    const [bx, by, bz] = q.body, z = bz + 0.02;
    b.voxBox([0, q.bodyY + by * 0.55, 0.04], [bx * 1.7, 0.14, bz * 1.6], '#3a7be0');
    ['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => b.blk([-0.24 + i * 0.1, q.bodyY + by * 0.55, z * 0.85 + 0.06], [0.06, 0.06, 0.03], c, { mat: 'Smooth', j: 0 }));
    [0.05, -0.12, -0.29].forEach((y, i) => {
      b.blk([0, q.bodyY + y, z + 0.02], [0.5, 0.025, 0.02], '#9aa4b0', { j: 0 });
      b.blk([-0.16 + i * 0.14, q.bodyY + y, z + 0.04], [0.07, 0.07, 0.04], '#3a7be0', { mat: 'Smooth', j: 0 });
    });
    b.blk([-0.06, q.hc[1] + q.hr[1] + 0.1, q.hc[2]], [0.06, 0.16, 0.05], '#28c840', { rot: [0, 0, 0.7] });
    b.blk([0.06, q.hc[1] + q.hr[1] + 0.16, q.hc[2]], [0.06, 0.3, 0.05], '#28c840', { rot: [0, 0, -0.6] });
  },
  dateikatze(b) {
    const PA = '#f6f7fb', FU = '#f0a24a', s = b.step;
    b.voxBox([0, 0.85, 0], [0.84, 1.0, 0.2], PA, { j: 0.03 });
    b.wedge([0.31, 1.24, 0.1], [0.04, 0.22, 0.22], '#c8ced8', { rot: [0, -Math.PI / 2, 0] });
    for (let i = 0; i < 4; i++) b.blk([-0.06, 1.1 - i * 0.13, 0.11], [i === 3 ? 0.34 : 0.54, 0.04, 0.02], '#9aa4b0', { j: 0 });
    b.blk([0, 0.48, 0.11], [0.46, 0.15, 0.02], '#ff5a1f', { j: 0 });
    const hc = [0, 1.62, 0], hr = [0.42, 0.34, 0.34];
    b.vox(hc, hr, FU);
    b.voxBox([0, 1.5, 0.32], [0.3, 0.16, 0.08], '#fff3e2');
    b.blk([0, 1.56, 0.37], [0.08, 0.05, 0.03], '#e48f98', { mat: 'Smooth', j: 0 });
    eyes(b, hc, hr, { gap: 0.15, size: 0.11, iris: '#3a7be0', blush: '#ff9fb2' });
    for (const sx of [1, -1]) {
      for (let k = 0; k < 3; k++) b.blk([sx * (0.24 + k * 0.02), 1.92 + k * 0.1, 0], [0.2 * (1 - k * 0.28), 0.1, 0.1], FU);
      b.vox([sx * 0.28, 0.3, 0.08], [0.12, 0.08, 0.14], FU);
      b.vox([sx * 0.38, 1.18, 0.14], [0.1, 0.07, 0.1], FU);
    }
    chainTail(b, [0.3, 0.5, -0.12], { c: FU, w: s * 1.1, n: 7, up: -0.3, curl: 0.35, side: 0.3 });
  },
  codedrache(b) {
    const G = '#3dff7a', C = '#0f1a14';
    const code = (u, p) => (Math.abs(Math.sin(p[1] * 26)) > 0.92 && Math.sin(p[0] * 9 + p[2] * 7 + Math.floor(p[1] * 8)) > 0 ? { c: G, mat: 'Neon' } : null);
    const q = lizard(b, { c: C, body: [0.52, 0.36, 0.9], head: [0.4, 0.3, 0.4], snout: [0.4, 0.2, 0.42], glow: '#7dff9a', spikeC: G, spikeMat: 'Neon', tailN: 11, tailW: 0.34, neon: G, paint: code, legH: 0.42 });
    for (const sx of [1, -1]) b.spike([sx * 0.16, q.hc[1] + q.hr[1] * 0.8, q.hc[2] - 0.1], [sx * 0.3, 1, -0.8], 0.34, 0.12, G, { mat: 'Neon' });
    for (const sx of [1, -1]) {
      b.push([sx * 0.4, q.bodyY + 0.3, 0.1], [0, 0, sx * 0.35]);
      b.blk([sx * 0.55, 0.1, 0], [1.1, 0.06, 0.06], '#bfffd0', { mat: 'Neon', rot: [0, 0, sx * 0.15] });
      for (let i = 0; i < 4; i++) {
        const x = sx * (0.22 + i * 0.25);
        b.blk([x, -0.02 + i * 0.03, -0.3 - i * 0.03], [0.24, 0.03, 0.6 - i * 0.08], '#123a20', { j: 0.1 });
        b.neon([x + sx * 0.12, 0.02 + i * 0.04, -0.3], [0.025, 0.035, 0.56 - i * 0.08], '#bfffd0');
      }
      b.pop();
    }
  },
  serverchamaeleon(b) {
    b.voxBox([0, 0.24, 0], [1.3, 0.48, 1.0], '#1e2230', { mat: 'Metal', j: 0.03 });
    for (let r = 0; r < 3; r++) {
      b.blk([0, 0.1 + r * 0.14, 0.51], [1.2, 0.1, 0.02], '#2a3040', { j: 0 });
      for (let i = 0; i < 6; i++) b.neon([0.3 + i * 0.06, 0.1 + r * 0.14, 0.53], [0.03, 0.03, 0.02], ['#38f0ff', '#3dff7a', '#ffb020', '#ff4058'][(i + r) % 4]);
    }
    b.push([0, 0.48, 0]);
    const cols = ['#3dff7a', '#ffb020', '#ff4058', '#38a0ff'];
    lizard(b, { c: '#1a2a24', glow: '#ff8a1f', curl: true, tailN: 12, spikes: true, spikeC: '#ffe07a', spikeMat: 'Neon', neon: null, paint: (u, p) => { const v = Math.sin(p[0] * 9 + p[1] * 4) + Math.sin(p[2] * 8 - p[1] * 6); return Math.abs(v) < 0.22 ? { c: cols[Math.floor((p[2] + 2) * 2) % 4], mat: 'Neon' } : null; } });
    b.pop();
  },

  // ── Release Egg ──
  dackel(b) {
    const q = quad(b, { c: '#9a4e22', belly: '#c8803e', muzzle: '#c8803e', body: [0.5, 0.42, 1.2], legH: 0.24, legW: 0.24, head: [0.46, 0.42, 0.42], snout: [0.3, 0.2, 0.34], ear: 'floppy', earS: 1.15, earC: '#6a3214', tail: 'thin', tailUp: 0.5, iris: '#3a2010' });
    partyHat(b, [0.04, q.headTop - 0.04, q.hc[2]], 1.0);
    tongue(b, q);
  },
  konfetti(b) {
    const cols = ['#ff5aa5', '#ffe07a', '#5ad1ff', '#8cff7a', '#c48bff'];
    const q = lizard(b, { c: '#ff5aa5', belly: '#fff3fa', curl: true, tailN: 11, spikes: false, iris: '#5ad1ff', paint: () => (b.rnd() < 0.16 ? cols[Math.floor(b.rnd() * 5)] : null) });
    partyHat(b, [0, q.hc[1] + q.hr[1] + 0.18, q.hc[2] - 0.06], 0.75);
  },
  ballonschwein(b) {
    const M = '#ff7aa8';
    const q = quad(b, { c: M, body: [0.64, 0.56, 0.78], legH: 0.4, head: [0.52, 0.48, 0.44], snout: [0.3, 0.22, 0.12], muzzle: '#ff5a90', nose: '#c0306a', ear: 'pointy', earS: 0.8, inner: '#ff5a90', tail: 'none', iris: '#3a2028' });
    for (const p of q.legs) b.blk([p[0], 0.02, p[1]], [0.22, 0.04, 0.22], '#ff5a90', { mat: 'Smooth' });
    b.wedge([0, q.bodyY, -q.body[2] - 0.08], [0.14, 0.14, 0.12], M, { mat: 'Smooth', rot: [-Math.PI / 2, 0, 0] });
    for (let i = 0; i < 10; i++) b.blk([Math.sin(i * 0.9) * 0.05, q.bodyY - 0.1 - i * 0.06, -q.body[2] - 0.12 - i * 0.015], [0.015, 0.06, 0.015], '#ffffff', { j: 0 });
    for (const [x, y, z] of [[0.24, 0.32, 0.22], [-0.18, 0.36, -0.2]]) b.blk([x, q.bodyY + y, z], [0.12, 0.04, 0.16], '#ffffff', { mat: 'Neon' });
  },
  wunderkerze(b) {
    const W = '#fff3e2';
    const q = quad(b, { c: '#e8752a', belly: W, muzzle: W, body: [0.55, 0.48, 0.86], legW: 0.26, legC: '#3a2620', head: [0.58, 0.48, 0.44], snout: [0.3, 0.2, 0.28], ear: 'pointy', earS: 1.25, inner: '#3a2620', tail: 'bushy', tailL: 1.1, tailUp: 0.4, tip: W, iris: '#9a5a10' });
    b.push([0.08, q.sc[1] - 0.04, q.front - 0.04], [0, 0.6, 0.35]);
    b.cyl([0.3, 0, 0], [0.025, 0.6, 0.025], '#8a8f9a', { mat: 'Metal', rot: [0, 0, Math.PI / 2] });
    b.cyl([0.42, 0, 0], [0.05, 0.3, 0.05], '#5a4a40', { rot: [0, 0, Math.PI / 2] });
    for (let i = 0; i < 16; i++) { const a = i * 2.39, e = (i / 16) * Math.PI; b.neon([0.6 + Math.cos(a) * Math.sin(e) * 0.2, Math.cos(e) * 0.2, Math.sin(a) * Math.sin(e) * 0.2], [0.05, 0.05, 0.05], i % 3 ? '#ffd36a' : '#ffffff', { rot: [a, e, 0] }); }
    b.pop();
  },
  qualle(b) {
    const BL = '#ffe7a0';
    const bc = [0, 1.15, 0];
    b.vox(bc, [0.6, 0.55, 0.6], BL, { mat: 'Glass', cut: (u) => u[1] < -0.05 });
    b.vox([0, 1.2, 0], [0.3, 0.2, 0.3], '#ffd36a', { mat: 'Neon' });
    b.ring([0, 1.1, 0], 0.6, 24, [0.18, 0.06, 0.08], GOLD, { mat: 'Metal' });
    eyes(b, bc, [0.6, 0.55, 0.6], { gap: 0.16, dy: 0.18, size: 0.12, blush: '#ff9fb2' });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU;
      for (let k = 0; k < 6; k++) b.blk([Math.cos(a) * (0.38 + Math.sin(k + i) * 0.05), 1.0 - k * 0.14, Math.sin(a) * (0.38 + Math.sin(k + i) * 0.05)], [0.08 - k * 0.008, 0.13, 0.08 - k * 0.008], BL, { mat: 'Glass' });
    }
    for (let i = 0; i < 14; i++) b.ball([(b.rnd() - 0.5) * 1.2, 0.3 + b.rnd() * 1.8, (b.rnd() - 0.5) * 1.2], 0.04 + b.rnd() * 0.05, '#fff6d0', { mat: 'Neon' });
  },
  roboter(b) {
    const G = '#ffe07a', ME = dk('#d4d9e2', '#38f0ff', 0.55), DA = '#1e212a', AC = '#ff5a1f';
    b.step = 0.18;
    for (const sx of [1, -1]) { b.voxBox([sx * 0.2, 0.22, 0], [0.18, 0.34, 0.18], DA); b.voxBox([sx * 0.2, 0.06, 0.04], [0.28, 0.12, 0.36], ME, { mat: 'Metal' }); }
    b.voxBox([0, 0.8, 0], [0.9, 0.8, 0.64], ME, { mat: 'Metal', paint: paints((u) => (u[1] < -0.85 ? AC : null), veins('#38f0ff', 3, 0.16)) });
    b.blk([0, 0.84, 0.33], [0.54, 0.3, 0.02], '#04121a', { j: 0 });
    b.neon([-0.1, 0.84, 0.35], [0.08, 0.16, 0.01], '#38f0ff'); b.neon([0.1, 0.84, 0.35], [0.12, 0.04, 0.01], '#38f0ff');
    const hc = [0, 1.5, 0];
    b.voxBox(hc, [0.8, 0.6, 0.62], ME, { mat: 'Metal' });
    b.blk([0, 1.48, 0.31], [0.66, 0.44, 0.04], INK, { mat: 'Smooth', j: 0 });
    for (const sx of [1, -1]) { b.neon([sx * 0.15, 1.52, 0.34], [0.12, 0.14, 0.03], '#38f0ff'); b.cyl([sx * 0.42, 1.5, 0], [0.16, 0.06, 0.16], AC, { rot: [0, 0, Math.PI / 2] }); }
    b.neon([0, 1.38, 0.34], [0.14, 0.03, 0.03], '#38f0ff');
    b.cyl([0, 1.9, 0], [0.03, 0.22, 0.03], DA); b.ball([0, 2.04, 0], 0.08, '#ff4058', { mat: 'Neon' });
    for (const sx of [1, -1]) { b.voxBox([sx * 0.56, 0.86, 0], [0.16, 0.42, 0.16], DA); b.voxBox([sx * 0.56, 0.58, 0], [0.22, 0.16, 0.22], ME, { mat: 'Metal' }); }
    for (const sx of [1, -1]) {
      b.cyl([sx * 0.22, 0.56, -0.36], [0.2, 0.18, 0.2], DA, { rot: [Math.PI / 2, 0, 0] });
      b.spike([sx * 0.22, 0.5, -0.38], [0, -1, -0.3], 0.38, 0.16, AC, { mat: 'Neon' });
      b.spike([sx * 0.22, 0.5, -0.38], [0, -1, -0.3], 0.24, 0.1, G, { mat: 'Neon' });
    }
  },
  phoenix(b) {
    const G = '#ffb020';
    bird(b, { c: dk('#ff5a1f', G, 0.45), headC: dk('#ff8a1f', G, 0.4), belly: dk('#ffcf3a', G, 0.45), wingC: dk('#ff5a1f', G, 0.35), beak: '#ffe07a', legs: '#ffb020', tip: '#ffe07a', tipMat: 'Neon', crest: '#ffcf3a', crestMat: 'Neon', glow: '#fff3a0', spread: 0.9, wingL: 1.6, tail: 7, tailL: 1.5, neon: G, brow: 0.25 });
    for (let i = 0; i < 16; i++) { const a = b.rnd() * TAU, r = 0.4 + b.rnd() * 0.9; b.neon([Math.cos(a) * r, 0.6 + b.rnd() * 2, -0.3 + Math.sin(a) * r * 0.6], [0.06, 0.06, 0.06], ['#ff5a3a', '#ffe07a', '#5ad1ff'][i % 3], { rot: [i, i, 0] }); }
  },
  // ── Candy Egg ──
  gummibaer(b) {
    const q = biped(b, { c: '#ff5a7a', mat: 'Glass', body: [0.44, 0.44, 0.38], head: [0.42, 0.38, 0.36], snout: [0.24, 0.14, 0.1], nose: '#a8203a', iris: '#5a1424' });
    b.vox(q.bc, [0.3, 0.3, 0.26], '#ff8fa6', { mat: 'Neon', step: 0.1 });
  },
  zuckerwatteschaf(b) {
    const q = sheep(b, { wool: '#ffc2de', face: '#8a5a7a', iris: '#3a2030' });
    sprinkle(b, onBack(b, q, 14, 0.1));
  },
  lollihase(b) {
    const q = quad(b, { c: '#fff0f6', body: [0.5, 0.48, 0.58], legH: 0.3, head: [0.5, 0.44, 0.42], snout: [0.24, 0.16, 0.1], ear: 'long', earS: 1.05, earTip: '#ffb3d1', inner: '#ffb3d1', tail: 'stub', tip: '#ffffff', nose: '#ff8fb0', iris: '#5ad1ff', headUp: 0.05 });
    lolly(b, [q.body[0] + 0.12, 0.25, q.body[2] * 0.6]);
    bow(b, [q.hr[0] * 0.5, q.headTop - 0.02, q.hc[2] + 0.1], '#8be0ff');
  },
  marshmallow(b) {
    const q = blob(b, { c: '#fff4ea', r: [0.6, 0.48, 0.56], iris: '#5a3446', paint: (u) => (u[1] < -0.6 ? '#ffd9e8' : null) });
    for (let i = 0; i < 4; i++) b.vox([Math.sin(i * 1.7) * 0.06, q.top - 0.02 + i * 0.13, Math.cos(i * 1.7) * 0.06], [0.34 - i * 0.07, 0.08, 0.34 - i * 0.07], i % 2 ? '#fff4ea' : '#ffc2de', { step: 0.09 });
    sprinkle(b, Array.from({ length: 16 }, () => { const a = b.rnd() * TAU, e = b.rnd() * 1.1; return [Math.cos(a) * Math.sin(e) * 0.58, 0.48 + Math.cos(e) * 0.47, Math.sin(a) * Math.sin(e) * 0.54]; }));
  },
  bonbonfisch(b) {
    const q = fish(b, { c: '#ffd84a', belly: '#fff4c0', fin: '#ff7eb6', body: [0.5, 0.5, 0.52], y: 0.85, tail: 0.38, dorsal: 0.22, iris: '#5a3a10', blush: '#ff9fb2' });
    for (let i = 0; i < 22; i++) {
      const a = b.rnd() * TAU, e = 0.3 + b.rnd() * 2.4, d = [Math.cos(a) * Math.sin(e), Math.cos(e), Math.sin(a) * Math.sin(e)];
      if (d[2] > 0.6) continue;
      b.spike([d[0] * 0.48, 0.85 + d[1] * 0.48, d[2] * 0.5], d, 0.12, 0.06, '#fff4c0', { mat: 'Smooth' });
    }
    for (let i = 0; i < 3; i++) b.blk([0, 0.85, 0.5 - i * 0.02], [0.9, 0.06, 0.02], i % 2 ? '#ff7eb6' : '#8be0ff', { rot: [0, 0, 0.5 - i * 0.5], mat: 'Smooth', j: 0 });
  },
  lakritzschlange(b) {
    const G = '#ff4f8a', C = dk('#2a1a22', G, 0.5);
    serpent(b, { c: C, band: G, belly: '#f7eff2', neon: G, glow: '#ff8fc8', hood: dk('#ff4f8a', G, 0.45), fangs: true, w: 0.36, r: 0.78, rise: 0.75, head: [0.32, 0.22, 0.32] });
  },
  zuckerdrache(b) {
    const G = '#ff8fc8';
    const q = dragon(b, { c: dk('#9fe6c8', G, 0.35), belly: dk('#ffb3d1', G, 0.3), muzzle: dk('#ffb3d1', G, 0.3), horn: '#fff0f6', hornMat: 'Smooth', wing: dk('#ffb3d1', G, 0.2), glow: G, neon: G, paint: (u, p) => (b.rnd() < 0.06 ? { c: ['#ff7eb6', '#8be0ff', '#ffe46b'][Math.floor(b.rnd() * 3)], mat: 'Neon' } : null) });
    sprinkle(b, onBack(b, q, 10, 0.08));
  },

  // ── Cartoon Egg ──
  kritzelkatze(b) {
    const q = quad(b, { c: '#ff9d3d', belly: '#fff4e0', body: [0.55, 0.46, 0.84], head: [0.6, 0.52, 0.46], legW: 0.26, snout: [0.32, 0.18, 0.12], ear: 'pointy', earS: 1.2, tail: 'thin', tailL: 1.4, tailUp: 1.2, tailCurl: 0.08, iris: '#4ab0ff', nose: '#2a1a10', paint: (u, p) => (Math.sin(p[2] * 12) > 0.55 && u[1] > -0.2 ? '#2a1a10' : null), headPaint: (u, p) => (u[1] > 0.5 && Math.abs(Math.sin(p[0] * 18)) > 0.75 ? '#2a1a10' : null) });
    for (const sx of [1, -1]) for (let i = 0; i < 2; i++) b.blk([sx * (q.snout[0] * 0.5 + 0.14), q.sc[1] - i * 0.05, q.front - 0.04], [0.3, 0.025, 0.025], '#2a1a10', { rot: [0, 0, sx * (0.12 - i * 0.24)], j: 0 });
  },
  quietschente(b) {
    const q = bird(b, { c: '#ffe14a', headC: '#ffe14a', wingC: '#fff2a0', beak: '#ff8a2a', legs: '#ff8a2a', legH: 0.22, body: [0.55, 0.5, 0.62], head: [0.44, 0.42, 0.42], wingL: 0.7, tail: 3, iris: '#4ab0ff' });
    b.blk([0, q.hc[1] - q.hr[1] * 0.75, q.hc[2] + 0.1], [0.06, 0.06, 0.02], '#ff6a8a', { mat: 'Smooth', j: 0 });
  },
  wackelpudding(b) {
    const q = blob(b, { c: '#7ae07a', r: [0.62, 0.5, 0.58], mat: 'Glass', iris: '#1a3a1a', blush: '#ff6a8a' });
    b.vox([0, 0.45, 0], [0.4, 0.3, 0.38], '#c8ffb0', { mat: 'Neon', step: 0.1 });
    b.vox([0, q.top + 0.02, 0], [0.32, 0.08, 0.3], '#fff4ea', { step: 0.09 });
    b.ball([0, q.top + 0.18, 0], 0.18, '#ff3a5a', { mat: 'Smooth' });
    b.blk([0.03, q.top + 0.33, 0], [0.02, 0.14, 0.02], '#3a6a2a', { rot: [0, 0, -0.4] });
  },
  comichase(b) {
    const q = biped(b, { c: '#f4f0ff', belly: '#ffffff', ear: 'long', inner: '#ff9db8', body: [0.4, 0.42, 0.34], head: [0.42, 0.38, 0.36], snout: [0.2, 0.12, 0.08], nose: '#ff9db8', iris: '#4ab0ff' });
    flag(b, [q.body[0] + 0.1, q.bc[1] - 0.1, 0.12], '#ff6a8a');
    bow(b, [0, q.hc[1] - q.hr[1] - 0.04, q.hc[2] + q.hr[2] * 0.8], '#4ab0ff');
  },
  toonhai(b) {
    const q = fish(b, { c: '#4ab0ff', belly: '#f4f8ff', fin: '#3a8ad8', body: [0.42, 0.42, 0.95], y: 0.8, tail: 0.55, dorsal: 0.45, iris: '#0e1a2a' });
    for (let i = 0; i < 7; i++) b.spike([(i - 3) * 0.06, 0.8 - 0.1, 0.88], [0, -1, 0.3], 0.08, 0.05, '#ffffff', { mat: 'Smooth' });
    b.blk([0, 0.68, 0.86], [0.42, 0.04, 0.1], '#2a0e16', { rot: [0.3, 0, 0], j: 0 });
  },
  zappelkrake(b) {
    const G = '#ffe14a';
    const q = octo(b, { c: dk('#ff6a8a', G, 0.4), b: dk('#ffb3c4', G, 0.35), R: 0.52, y: 0.62, tl: 1.4, glow: G, neon: G });
    for (let i = 0; i < 5; i++) b.neon([(b.rnd() - 0.5) * 1.6, 0.3 + b.rnd() * 1.4, (b.rnd() - 0.5) * 1.6], [0.08, 0.08, 0.08], i % 2 ? '#4ab0ff' : G, { rot: [i, i, 0] });
    partyHat(b, [0.05, q.top - 0.05, -0.02], 1.0, ['#ff6a8a', '#ffe14a', '#4ab0ff']);
  },
  superdrache(b) {
    const G = '#ffe14a';
    const q = dragon(b, { c: dk('#7a5aff', G, 0.4), belly: dk('#ffe14a', G, 0.3), muzzle: dk('#ffe14a', G, 0.3), horn: '#ffe14a', hornMat: 'Neon', wing: dk('#ff6a8a', G, 0.35), glow: G, neon: G, iris: '#1a1040' });
    smallCrown(b, [0, q.headTop - 0.02, q.hc[2]], 0.9);
    cape(b, [0, q.top + 0.06, q.body[2] * 0.55], 0.9, 0.8, '#ff3a5a', '#ffe14a');
  },

  // ── Atlantis Egg ──
  perlenfisch(b) {
    const q = fish(b, { c: '#3fb6c8', belly: '#e8f4f0', fin: '#2f8a9a', iris: '#0a2228' });
    b.ball([0, q.y + q.body[1] + 0.12, 0.05], 0.22, '#f4efe6', { mat: 'Smooth' });
    b.ring([0, q.y + q.body[1] - 0.02, 0.05], 0.12, 10, [0.06, 0.04, 0.04], '#ffd36b', { mat: 'Metal' });
  },
  korallenkroete(b) {
    const q = turtle(b, { c: '#4f8a7a', shell: '#2f6a72', rim: '#1f4a52' });
    corals(b, [[0.15, q.shellTop - 0.05, 0.1], [-0.22, q.shellTop - 0.1, -0.15], [0.05, q.shellTop - 0.08, -0.35]]);
  },
  tiefseequalle(b) {
    octo(b, { c: '#3ad0e0', b: '#a6f4ff', jelly: true, mat: 'Glass', glow: '#7affea', R: 0.55, y: 1.25, tl: 1.0, n: 8, iris: '#06161c', blush: '#ff9fb2' });
  },
  riffhai(b) {
    const q = fish(b, { c: '#5a7a8a', belly: '#dfe8ea', fin: '#4a6a7a', body: [0.4, 0.42, 1.0], y: 0.8, tail: 0.6, dorsal: 0.5, iris: '#0e1a20' });
    for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) b.spike([(i - 2.5) * 0.06, 0.7 + r * 0.02, 0.9 - r * 0.05], [0, r % 2 ? 1 : -1, 0.2], 0.06, 0.04, '#f2f0ea', { mat: 'Smooth' });
  },
  seeschlange(b) {
    serpent(b, { c: '#1f6a72', band: '#3fb6a8', belly: '#e6f6f0', fins: '#4ff0e0', fangs: true, iris: '#4ff0e0' });
  },
  kraken(b) {
    const G = '#4ff0e0';
    const q = octo(b, { c: dk('#a83a4a', G, 0.5), b: dk('#e07a6a', G, 0.45), R: 0.58, y: 0.7, tl: 1.6, glow: G, neon: G });
    crown(b, [0, q.top - 0.06, -0.02], 1.1, ['#4ff0e0', '#ffd36b']);
  },
  leviathan(b) {
    const G = '#4ff0e0';
    const q = serpent(b, { c: dk('#1c4a5a', G, 0.45), band: '#d9b45a', belly: '#f2e6c0', neon: G, glow: G, fins: dk('#4ff0e0', G, 0.3), spikes: '#d9b45a', spikeMat: 'Metal', maw: true, w: 0.42, r: 0.85, rise: 0.85, N: 60, head: [0.36, 0.26, 0.38] });
    crown(b, [q.hc[0], q.hc[1] + q.hr[1] - 0.02, q.hc[2] - 0.05], 0.9, ['#4ff0e0', '#ff7a8a']);
    corals(b, [[0.6, 0.3, -0.3], [-0.55, 0.3, 0.2]]);
  },

  // ── Lava Egg ──
  glutmolch(b) {
    const q = lizard(b, { c: '#3a2420', belly: '#ff8a3d', body: [0.42, 0.24, 0.72], head: [0.34, 0.24, 0.34], snout: [0.36, 0.16, 0.26], legH: 0.24, iris: '#ffb347', spikes: false, tailN: 10, tailW: 0.28, paint: (u, p) => (Math.sin(p[0] * 9 + 1) * Math.sin(p[2] * 8) > 0.55 ? { c: '#ff8a3d', mat: 'Neon' } : null) });
    flames(b, [[0, q.bodyY + 0.2, 0.25], [0, q.bodyY + 0.22, -0.1], [0, q.bodyY + 0.2, -0.45]]);
  },
  aschekaefer(b) {
    beetle(b, { c: '#2a1e1c', shell: '#4a2a22', glow: '#ff8a3d' });
  },
  magmahund(b) {
    const q = quad(b, { c: '#3a2a26', belly: '#ff7a2a', muzzle: '#4a342e', ear: 'floppy', earC: '#2a1e1a', tail: 'thin', iris: '#ffb347', brow: 0.25, blush: null, paint: (u, p) => (Math.abs(Math.sin(p[0] * 6 + p[2] * 5) + Math.sin(p[1] * 7 - p[2] * 4)) < 0.15 ? { c: '#ff8a3d', mat: 'Neon' } : null) });
    for (let i = 0; i < 5; i++) b.spike([0, q.top - 0.04, q.body[2] * 0.5 - i * 0.28], [0, 1, -0.4], 0.18, 0.12, '#ff7a2a', { mat: 'Neon' });
    for (const sx of [1, -1]) b.spike([sx * 0.1, q.sc[1] - 0.1, q.front - 0.03], [0, -1, 0.1], 0.12, 0.05, '#f2ede2', { mat: 'Smooth' });
  },
  feuerfalke(b) {
    bird(b, { c: '#c8452a', headC: '#c8452a', belly: '#ff9d4a', wingC: '#a8351a', beak: '#ffcf6a', legs: '#ffcf6a', iris: '#ffcf6a', brow: 0.35, tip: '#ffcf6a', crest: '#ff9d4a', spread: 0.8, wingL: 1.3, tail: 7 });
  },
  vulkanschnecke(b) {
    const s = b.step;
    b.vox([0, 0.2, 0.05], [0.4, 0.2, 0.85], '#5a3a30', { paint: (u) => (u[1] < -0.4 ? '#3a2420' : null) });
    const hc = [0, 0.45, 0.72], hr = [0.26, 0.24, 0.24];
    b.vox(hc, hr, '#5a3a30');
    eyes(b, hc, hr, { gap: 0.1, size: 0.1, iris: '#ffb347', blush: '#ff8a6a' });
    for (const sx of [1, -1]) { b.at([sx * 0.1, 0.62, 0.72], [-0.3, 0, -sx * 0.25], () => b.blk([0, 0.14, 0], [0.04, 0.28, 0.04], '#5a3a30')); b.ball([sx * 0.17, 0.88, 0.8], 0.08, '#ff7a2a', { mat: 'Neon' }); }
    b.vox([0, 0.68, -0.15], [0.48, 0.48, 0.46], '#3a2a26', { paint: (u, p) => (Math.abs(Math.sin(Math.atan2(p[1] - 0.68, p[2] + 0.15) * 2 + Math.hypot(p[1] - 0.68, p[2] + 0.15) * 9)) < 0.2 ? { c: '#ff7a2a', mat: 'Neon' } : null) });
    for (let i = 0; i < 4; i++) { const w = 0.34 - i * 0.07; b.voxBox([0, 1.15 + i * 0.09, -0.15], [w, 0.09, w], i === 3 ? '#ff7a2a' : '#4a3430', { mat: i === 3 ? 'Neon' : null, step: s * 0.7 }); }
    for (let i = 0; i < 6; i++) b.neon([R2(b) * 0.2, 1.55 + i * 0.12, -0.15 + R2(b) * 0.2], [0.06, 0.06, 0.06], i % 2 ? '#ffcf6a' : '#ff6a3a', { rot: [i, i, 0] });
  },
  lavawurm(b) {
    const G = '#ff9d3d';
    serpent(b, { c: dk('#2a1a16', G, 0.4), band: '#ff6a2a', belly: '#ffcf6a', neon: G, glow: '#ffcf6a', spikes: dk('#ff6a2a', G, 0.2), spikeMat: 'Metal', maw: true, w: 0.38, rise: 0.75, head: [0.34, 0.24, 0.34] });
  },
  infernodrache(b) {
    const G = '#ff9d3d';
    const q = dragon(b, { c: dk('#2a1a18', G, 0.4), belly: dk('#ff6a2a', G, 0.35), muzzle: dk('#4a2a22', G, 0.3), horn: dk('#ffcf6a', G, 0.2), hornMat: 'Metal', wing: dk('#ff6a2a', G, 0.45), glow: '#ffcf6a', neon: G, iris: '#ffcf6a' });
    smallCrown(b, [0, q.headTop - 0.02, q.hc[2]], 0.9);
    flames(b, [[0.35, q.top - 0.1, -0.3], [-0.35, q.top - 0.1, -0.3], [0, q.top, 0.4]]);
  },
};

// ── Sockel: achteckige Insel, je Ei eigenes Material ──
const THEME = {
  normal: { top: '#6fbf4a', top2: '#5aa63a', side: '#8a5a34', under: '#6b5a4c' },
  wald: { top: '#3f7a2e', top2: '#2f6424', side: '#4a3322', under: '#3a3530' },
  eis: { top: '#eef6ff', top2: '#d6e8fa', side: '#9fd8f0', under: '#6aa8c8' },
  engel: { top: '#fbf8f2', top2: '#efe6d2', side: '#e6dcc4', under: '#c8bca0' },
  galaxie: { top: '#2a2440', top2: '#3a2f5a', side: '#1e1a30', under: '#161326' },
  admin: { top: '#2a2e3a', top2: '#1e212a', side: '#3a3f4c', under: '#22252e' },
  release: { top: '#5a2a7a', top2: '#7a3a9a', side: '#3a1f50', under: '#2a1638' },
  candy: { top: '#ffc2de', top2: '#fff1d6', side: '#f4b6cf', under: '#c87a9a' },
  cartoon: { top: '#7ae07a', top2: '#ffe14a', side: '#e8e2d4', under: '#4ab0ff' },
  atlantis: { top: '#c9b98a', top2: '#b0a070', side: '#2b5a5e', under: '#1c3a3e' },
  lava: { top: '#3a2a26', top2: '#ff6a2a', side: '#2a1e1a', under: '#1c110e' },
};
export function pedestal(b, egg, epic, glow) {
  const T = THEME[egg] ?? THEME.normal, R = 2.3;
  b.ped = true;
  const top = epic ? dk(T.top, glow, 0.74) : T.top, side = epic ? dk(T.side, glow, 0.78) : T.side, under = epic ? dk(T.under, glow, 0.8) : T.under;
  b.octa([0, -0.14, 0], R, 0.28, top);
  b.octa([0, -0.56, 0], R * 0.97, 0.56, side, { rot: TAU / 16 });
  b.octa([0, -1.0, 0], R * 0.78, 0.36, under);
  b.octa([0, -1.3, 0], R * 0.5, 0.3, under, { rot: TAU / 16 });
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * TAU + b.rnd() * 0.2, r = R * (0.9 + b.rnd() * 0.1), h = 0.2 + b.rnd() * 0.4;
    b.blk([Math.cos(a) * r, -0.35 - b.rnd() * 0.45, Math.sin(a) * r], [0.3 + b.rnd() * 0.3, h, 0.3 + b.rnd() * 0.2], b.rnd() < 0.5 ? side : under, { rot: [b.rnd() * 0.3, -a, b.rnd() * 0.3] });
  }
  for (let i = 0; i < 12; i++) {
    const a = b.rnd() * TAU, r = b.rnd() * R * 0.8, w = 0.25 + b.rnd() * 0.35;
    b.blk([Math.cos(a) * r, 0.005, Math.sin(a) * r], [w, 0.02, w * (0.6 + b.rnd() * 0.6)], epic ? dk(T.top2, glow, 0.7) : T.top2, { rot: [0, b.rnd() * 3, 0] });
  }
  for (let i = 0; i < 5; i++) {
    const a = b.rnd() * TAU, r = R * (0.72 + b.rnd() * 0.15);
    b.blk([Math.cos(a) * r, 0.08, Math.sin(a) * r], [0.14 + b.rnd() * 0.14, 0.16 + b.rnd() * 0.12, 0.14 + b.rnd() * 0.12], under, { rot: [b.rnd(), b.rnd() * 3, b.rnd()] });
  }
  if (epic) {
    const chord = 2 * R * Math.tan(Math.PI / 8);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; b.neon([Math.cos(a) * (R + 0.01), -0.05, Math.sin(a) * (R + 0.01)], [chord * 0.9, 0.04, 0.04], glow, { rot: [0, Math.PI / 2 - a, 0] }); }
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + 0.3; b.spike([Math.cos(a) * R * 0.85, 0, Math.sin(a) * R * 0.85], [Math.cos(a) * 0.3, 1, Math.sin(a) * 0.3], 0.3 + b.rnd() * 0.3, 0.16, i % 2 ? glow : side, { mat: i % 2 ? 'Neon' : 'Smooth' }); }
  }
  b.ped = false;
}
