// Archetypen (Vierbeiner, Vogel, Echse) + Zubehör. Tiere schauen nach +z, Boden y = 0.
import { TAU, shade, mix, surf } from './engine.js';

export const INK = '#16121c';
export const GOLD = '#f2c14e';

// Neonadern (für epische Tiere): dünne Linien über die Würfelhülle
export const veins = (glow, f = 3.2, th = 0.1) => (u, p) => {
  const v = Math.sin(p[0] * f * 1.3 + p[1] * f * 0.6 + 1.7) + Math.sin(p[2] * f - p[1] * f * 1.1 + 0.4) + 0.6 * Math.sin((p[0] + p[2]) * f * 2.1);
  return Math.abs(v) < th ? { c: glow, mat: 'Neon' } : null;
};
// dunkle Grundfarbe für epische Tiere
export const dk = (c, glow, k = 0.68) => mix(mix(c, '#0c0a14', k), glow, 0.1);
// erste passende Bemalung gewinnt
export const paints = (...fs) => { const l = fs.filter(Boolean); return l.length ? (u, p) => { for (const f of l) { const r = f(u, p); if (r) return r; } return null; } : null; };
// Sternsprenkel
export const specks = (b, c, k = 0.06, mat = 'Neon') => () => (b.rnd() < k ? { c, mat } : null);

export function eyes(b, hc, hr, o = {}) {
  const s = b.step, gap = o.gap ?? hr[0] * 0.42, y = hc[1] + (o.dy ?? hr[1] * 0.12);
  const sz = o.size ?? Math.max(s * 1.05, hr[1] * 0.3);
  for (const sx of [1, -1]) {
    const x = hc[0] + sx * gap, z = surf(hc, hr, x, y) + s * 0.12;
    if (o.glow) {
      b.neon([x, y, z], [sz * 0.95, sz * 0.7, s * 0.5], o.glow);
    } else {
      b.blk([x, y, z], [sz * 0.85, sz, s * 0.5], INK, { mat: 'Smooth', j: 0 });
      if (o.iris) b.blk([x, y - sz * 0.2, z + s * 0.05], [sz * 0.6, sz * 0.4, s * 0.45], o.iris, { mat: 'Smooth', j: 0 });
      b.blk([x + sz * 0.18, y + sz * 0.22, z + s * 0.1], [sz * 0.3, sz * 0.3, s * 0.4], '#ffffff', { mat: 'Smooth', j: 0 });
    }
    if (o.brow) b.blk([x, y + sz * 0.78, z - s * 0.05], [sz * 1.15, s * 0.42, s * 0.5], o.browC ?? INK, { rot: [0, 0, -sx * o.brow], j: 0 });
    if (o.blush) b.blk([x + sx * sz * 0.5, y - sz * 0.85, z - s * 0.15], [sz * 0.6, s * 0.35, s * 0.4], o.blush, { j: 0 });
  }
}

// Schwanz als Würfelkette
export function chainTail(b, base, o) {
  let p = [...base], a = o.up ?? 0.6;
  const n = o.n ?? 6;
  for (let i = 0; i < n; i++) {
    const w = o.w * (1 - (i / n) * (o.taper ?? 0.45));
    const tip = o.tip && i >= n - (o.tipN ?? 1);
    b.blk(p, [w, w, w * 1.1], tip ? o.tip : o.c, { mat: tip ? o.tipMat : o.mat, rot: [-a, 0, 0] });
    const st = w * 0.85;
    p = [p[0] + (o.side ?? 0) * st, p[1] + Math.sin(a) * st, p[2] - Math.cos(a) * st];
    a += o.curl ?? 0.15;
  }
  return p;
}

// ── Vierbeiner ──
export function quad(b, o) {
  const P = {
    body: [0.62, 0.52, 0.92], head: [0.56, 0.5, 0.48], legH: 0.62, legW: 0.3, c: '#c98a4b', belly: null, ear: 'pointy', earC: null, earS: 1,
    inner: '#f2a7ad', tail: 'thin', tailC: null, tip: null, tailL: 1, tailUp: 0.7, snout: [0.4, 0.28, 0.3], muzzle: null, nose: INK,
    iris: null, glow: null, neon: null, headUp: 0, headFwd: 0, paint: null, headPaint: null, hoof: null, paw: null, legC: null, headC: null, brow: null, blush: '#ff9fb2',
    ...o,
  };
  const s = b.step, [bx, by, bz] = P.body;
  const bodyY = P.legH + by * 0.7;
  const bc = [0, bodyY, 0];
  const bellyP = P.belly ? (u) => (u[1] < -0.5 || (u[2] > 0.62 && u[1] < 0.2) ? P.belly : null) : null;
  const vein = P.neon ? veins(P.neon) : null;
  b.vox(bc, P.body, P.c, { paint: paints(P.paint, vein, bellyP) });
  const legs = [];
  const lx = bx * 0.55, lz = bz * 0.6, lh = P.legH + by * 0.25;
  for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    const x = sx * lx, z = sz * lz;
    b.voxBox([x, lh / 2 + s * 0.5, z], [P.legW, lh - s, P.legW], P.legC ?? P.c);
    b.blk([x, s * 0.5, z + s * 0.2], [P.legW * 1.12, s, P.legW * 1.3], P.hoof ?? P.paw ?? shade(P.legC ?? P.c, 0.82));
    if (!P.hoof) for (const t of [-1, 1]) b.blk([x + t * P.legW * 0.2, s * 0.5, z + s * 0.2 + P.legW * 0.66], [s * 0.18, s * 0.6, s * 0.2], shade(P.paw ?? P.legC ?? P.c, 0.45), { j: 0 });
    if (P.neon) b.neon([x, lh * 0.45, z], [P.legW * 1.1, s * 0.35, P.legW * 1.1], P.neon);
    legs.push([x, z]);
  }
  const hr = P.head;
  const hc = [0, bodyY + by * 0.55 + hr[1] * 0.5 + P.headUp, bz * 0.72 + hr[2] * 0.4 + P.headFwd];
  const hvein = P.neon ? veins(P.neon, 4.2, 0.08) : null;
  b.vox(hc, hr, P.headC ?? P.c, { paint: paints(P.headPaint, hvein) });
  const [sw, sh, sd] = P.snout;
  const sc = [0, hc[1] - hr[1] * 0.32, hc[2] + hr[2] * 0.72 + sd * 0.25];
  if (sd > 0) b.voxBox(sc, [sw, sh, sd], P.muzzle ?? P.belly ?? P.headC ?? P.c);
  const front = sd > 0 ? sc[2] + sd / 2 : surf(hc, hr, 0, sc[1]);
  b.blk([0, sc[1] + sh * 0.3, front + s * 0.15], [sw * 0.42, sh * 0.32, s * 0.5], P.nose, { mat: 'Smooth', j: 0 });
  b.blk([0, sc[1] - sh * 0.28, front + s * 0.05], [sw * 0.55, s * 0.22, s * 0.3], '#3a1a22', { j: 0 });
  eyes(b, hc, hr, { iris: P.iris, glow: P.glow, brow: P.brow, blush: P.glow ? null : P.blush });
  // Ohren
  const ec = P.earC ?? P.headC ?? P.c, ES = P.earS;
  for (const sx of [1, -1]) {
    const ex = sx * hr[0] * 0.5, ey = hc[1] + hr[1] * 0.72, ez = hc[2] - hr[2] * 0.1;
    switch (P.ear) {
      case 'pointy':
        for (let k = 0; k < 4; k++) {
          const w = hr[0] * 0.5 * ES * (1 - k * 0.24);
          b.blk([ex + sx * k * s * 0.15, ey + k * s * 0.9 * ES, ez], [w, s * 0.95 * ES, s * 1.1], k === 3 && P.earTip ? P.earTip : ec);
          if (k < 3) b.blk([ex + sx * k * s * 0.15, ey + k * s * 0.9 * ES, ez + s * 0.5], [w * 0.5, s * 0.8 * ES, s * 0.2], P.inner, { j: 0 });
        }
        break;
      case 'floppy':
        b.voxBox([sx * (hr[0] + s * 0.3), hc[1] - hr[1] * 0.15 * ES, hc[2] - hr[2] * 0.05], [s * 1.1, hr[1] * 1.25 * ES, hr[2] * 0.75], ec);
        break;
      case 'round':
        b.vox([ex * 1.1, ey + s * 0.4, ez], [hr[0] * 0.3 * ES, hr[0] * 0.3 * ES, s * 0.7], ec);
        b.blk([ex * 1.1, ey + s * 0.4, ez + s * 0.5], [hr[0] * 0.3 * ES, hr[0] * 0.3 * ES, s * 0.2], P.inner, { j: 0 });
        break;
      case 'long':
        b.at([sx * hr[0] * 0.3, ey, ez], [-0.12, 0, -sx * 0.12], () => {
          b.voxBox([0, hr[1] * 0.9 * ES, 0], [hr[0] * 0.38, hr[1] * 1.9 * ES, s * 1.2], ec, { paint: P.earTip ? (u) => (u[1] > 0.7 ? P.earTip : null) : null });
          b.blk([0, hr[1] * 0.85 * ES, s * 0.62], [hr[0] * 0.18, hr[1] * 1.5 * ES, s * 0.2], P.inner, { j: 0 });
        });
        break;
      case 'side':
        b.at([sx * hr[0] * 0.9, hc[1] + hr[1] * 0.35, ez], [0, 0, -sx * 0.25], () => {
          b.voxBox([sx * hr[0] * 0.35 * ES, 0, 0], [hr[0] * 0.7 * ES, s * 1.6, s * 1.1], ec);
          b.blk([sx * hr[0] * 0.38 * ES, 0, s * 0.56], [hr[0] * 0.5 * ES, s * 0.9, s * 0.2], P.inner, { j: 0 });
        });
        break;
    }
  }
  // Schwanz
  const tb = [0, bodyY + by * 0.25, -bz * 0.92];
  const tc = P.tailC ?? P.c, L = P.tailL;
  let tailEnd = tb;
  switch (P.tail) {
    case 'thin': tailEnd = chainTail(b, tb, { c: tc, w: s * 1.5, n: Math.round(7 * L), up: P.tailUp, curl: P.tailCurl ?? 0.12, tip: P.tip }); break;
    case 'bushy':
      b.at(tb, [P.tailUp, 0, 0], () => b.vox([0, 0, -0.55 * L], [0.24, 0.24, 0.55 * L], tc, { paint: paints(P.neon ? veins(P.neon) : null, P.tip ? (u) => (u[2] < -0.5 ? P.tip : null) : null) }));
      break;
    case 'stub': b.vox([tb[0], tb[1] + 0.05, tb[2] - 0.05], [0.16, 0.16, 0.14], P.tip ?? tc); break;
    case 'curl':
      for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU * 0.85; b.blk([0, tb[1] + Math.sin(a) * 0.14 + 0.1, tb[2] - 0.12 - Math.cos(a) * 0.14 + 0.12], [s * 0.8, s * 0.8, s * 0.8], tc); }
      break;
    case 'tuft': {
      const e = chainTail(b, tb, { c: tc, w: s, n: Math.round(6 * L), up: -0.4, curl: 0.05 });
      b.vox(e, [0.13, 0.16, 0.13], P.tip ?? tc);
      break;
    }
    case 'horse':
      b.at(tb, [-0.5, 0, 0], () => b.voxBox([0, -0.05, -0.45], [0.22, 0.2, 0.9], tc));
      break;
  }
  return { ...P, s, bc, bodyY, hc, hr, sc, front, legs, tb, tailEnd, top: bodyY + by, headTop: hc[1] + hr[1], neck: [0, bodyY + by * 0.55, bz * 0.72] };
}

// ── Vogel ──
export function bird(b, o) {
  const P = { body: [0.55, 0.65, 0.6], head: [0.44, 0.42, 0.42], c: '#ffffff', belly: null, headC: null, wingC: null, tip: null, tipMat: null, beak: '#ffb02e', legs: '#ffb02e', legH: 0.4, spread: 0, wingL: 1.1, tail: 5, crest: null, crestMat: null, iris: null, glow: null, neon: null, brow: null, ...o };
  const s = b.step, [bx, by, bz] = P.body;
  for (const sx of [1, -1]) {
    b.voxBox([sx * bx * 0.35, P.legH / 2, 0], [s, P.legH, s], P.legs);
    for (const a of [-0.5, 0, 0.5]) b.blk([sx * bx * 0.35 + Math.sin(a) * s * 1.2, s * 0.3, Math.cos(a) * s * 1.2], [s * 0.6, s * 0.6, s * 2], P.legs, { rot: [0, a, 0] });
  }
  const bodyY = P.legH + by * 0.9;
  const bc = [0, bodyY, 0];
  b.vox(bc, P.body, P.c, { paint: paints(P.neon ? veins(P.neon) : null, P.belly ? (u) => (u[2] > 0.45 && u[1] < 0.35 ? P.belly : null) : null) });
  const hr = P.head, hc = [0, bodyY + by * 0.8 + hr[1] * 0.4, bz * 0.3];
  b.vox(hc, hr, P.headC ?? P.c, { paint: P.neon ? veins(P.neon, 4.2, 0.08) : null });
  const bz0 = surf(hc, hr, 0, hc[1] - hr[1] * 0.1);
  b.at([0, hc[1] - hr[1] * 0.05, bz0 + s * 0.3], [Math.PI / 2, 0, 0], () => {
    b.blk([0, 0, 0], [hr[0] * 0.55, s * 1.4, s * 1.2], P.beak);
    b.wedge([0, s * 1.4, -s * 0.15], [hr[0] * 0.45, s * 1.4, s * 0.9], P.beak, { rot: [0, Math.PI, 0] });
  });
  b.blk([0, hc[1] - hr[1] * 0.32, bz0 + s * 0.6], [hr[0] * 0.4, s * 0.6, s * 1.6], shade(P.beak, 0.8));
  eyes(b, hc, hr, { gap: hr[0] * 0.55, iris: P.iris, glow: P.glow, brow: P.brow });
  if (P.crest) for (let i = 0; i < 4; i++) b.spike([0, hc[1] + hr[1] * 0.8, hc[2] - i * s * 1.2], [0, 1, -0.4 - i * 0.4], 0.35 - i * 0.05, s * 1.2, P.crest, { mat: P.crestMat });
  // Flügel: Reihen aus Federplanken, nach hinten/unten gefächert (spread hebt sie zur Seite)
  const wc = P.wingC ?? P.c;
  for (const sx of [1, -1]) {
    b.push([sx * bx * 0.92, bodyY + by * 0.35, 0.05], [0, 0, sx * (0.15 + P.spread * 1.15)]);
    const L = P.wingL;
    for (let r = 0; r < 4; r++) {
      const n = 4 + r;
      for (let f = 0; f < n; f++) {
        const len = L * (0.35 + r * 0.17) * (1 - f * 0.04), z = 0.15 - f * s * 1.25;
        const tipped = P.tip && r >= 2;
        b.blk([sx * (s * 0.6 + r * s * 0.15), -len / 2 - r * s * 0.2, z], [s * 0.5, len, s * 1.15], tipped ? (r === 3 ? P.tip : mix(wc, P.tip, 0.5)) : shade(wc, 1 - r * 0.06), { mat: tipped && r === 3 ? P.tipMat : null, rot: [0.25 + f * 0.05, 0, 0] });
      }
    }
    b.pop();
  }
  // Schwanzfedern
  for (let i = 0; i < P.tail; i++) {
    const a = (i - (P.tail - 1) / 2) * 0.28;
    b.at([0, bodyY - by * 0.35, -bz * 0.85], [0.7, a, 0], () => {
      b.blk([0, 0, -0.32 * (P.tailL ?? 1)], [s * 1.2, s * 0.4, 0.64 * (P.tailL ?? 1)], i % 2 && P.tip ? P.tip : wc, { mat: i % 2 && P.tip ? P.tipMat : null });
    });
  }
  return { ...P, s, bc, bodyY, hc, hr };
}

// ── Echse ──
export function lizard(b, o) {
  const P = { body: [0.5, 0.32, 0.8], head: [0.4, 0.3, 0.4], c: '#3f9a3e', belly: null, legH: 0.35, tailN: 9, tailW: 0.32, curl: false, spikes: true, spikeC: null, spikeMat: null, iris: '#e0b020', glow: null, neon: null, tip: null, tipMat: null, paint: null, snout: [0.5, 0.2, 0.4], ...o };
  const s = b.step, [bx, by, bz] = P.body;
  const bodyY = P.legH + by * 0.6;
  b.vox([0, bodyY, 0], P.body, P.c, { paint: paints(P.paint, P.neon ? veins(P.neon) : null, P.belly ? (u) => (u[1] < -0.45 ? P.belly : null) : null) });
  for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    b.voxBox([sx * (bx + 0.08), bodyY - by * 0.2, sz * bz * 0.5], [0.3, s * 1.4, s * 1.4], P.c);
    b.voxBox([sx * (bx + 0.2), (bodyY - by * 0.2) / 2, sz * bz * 0.5], [s * 1.4, bodyY - by * 0.2, s * 1.4], P.c);
    b.blk([sx * (bx + 0.2), s * 0.3, sz * bz * 0.5 + s], [s * 2.4, s * 0.6, s * 2.6], P.belly ?? shade(P.c, 0.8));
  }
  const hr = P.head, hc = [0, bodyY + by * 0.35, bz + hr[2] * 0.5];
  b.vox(hc, hr, P.c, { paint: P.neon ? veins(P.neon, 4, 0.08) : null });
  const [sw, sh, sd] = P.snout;
  const sc = [0, hc[1] - hr[1] * 0.25, hc[2] + hr[2] * 0.7 + sd * 0.3];
  b.voxBox(sc, [sw, sh, sd], P.c);
  if (P.belly) b.blk([0, sc[1] - sh * 0.45, sc[2]], [sw * 0.9, s * 0.4, sd * 0.95], P.belly);
  for (const sx of [1, -1]) {
    b.vox([sx * hr[0] * 0.6, hc[1] + hr[1] * 0.75, hc[2] + hr[2] * 0.2], [s * 1.4, s * 1.4, s * 1.4], P.c);
  }
  eyes(b, [0, hc[1] + hr[1] * 0.75, hc[2] + hr[2] * 0.2], [hr[0] * 0.9, s * 1.4, s * 1.4], { gap: hr[0] * 0.6, dy: 0, size: s * 1.3, iris: P.iris, glow: P.glow });
  // Schwanz
  let p = [0, bodyY, -bz * 0.9], a = -0.15;
  const segs = [];
  for (let i = 0; i < P.tailN; i++) {
    const w = P.tailW * (1 - (i / P.tailN) * 0.7), tip = P.tip && i >= P.tailN - 2;
    b.blk(p, [w * 1.2, w, w * 1.2], tip ? P.tip : P.c, { mat: tip ? P.tipMat : null, rot: [-a, 0, 0] });
    if (P.neon && i % 2) b.neon([p[0], p[1] + w * 0.52, p[2]], [w * 0.5, s * 0.3, w * 0.9], P.neon, { rot: [-a, 0, 0] });
    segs.push(p);
    const st = w * 0.95;
    p = [p[0], p[1] + Math.sin(a) * st, p[2] - Math.cos(a) * st];
    a += P.curl ? 0.62 : 0.02;
  }
  if (P.spikes) for (let i = 0; i < 7; i++) b.spike([0, bodyY + by * 0.85, bz * 0.6 - i * bz * 0.22], [0, 1, -0.3], 0.16 + (i % 2) * 0.06, s * 1.2, P.spikeC ?? shade(P.c, 0.6), { mat: P.spikeMat });
  return { ...P, s, bodyY, hc, hr, sc, segs };
}

// ── Zubehör ──
export function collar(b, q, color = '#d23a3a', tag = true) {
  const c = [0, q.neck[1] + 0.02, q.neck[2] + 0.05];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    b.blk([Math.cos(a) * 0.34, c[1] + Math.sin(a) * 0.12, c[2] + Math.sin(a) * 0.3], [0.14, 0.09, 0.14], color, { rot: [0, Math.PI / 2 - a, 0] });
  }
  if (tag) b.cyl([0, c[1] - 0.22, c[2] + 0.34], [0.14, 0.03, 0.14], GOLD, { mat: 'Metal', rot: [Math.PI / 2, 0, 0], j: 0 });
}
export function crown(b, pos, k = 1, gems = ['#e3263f', '#2a7de1']) {
  b.push(pos, [0, 0, 0], k);
  b.octa([0, 0.06, 0], 0.22, 0.12, GOLD, { mat: 'Metal', j: 0.03 });
  for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU + TAU / 16; b.spike([Math.cos(a) * 0.24, 0.12, Math.sin(a) * 0.24], [0, 1, 0], 0.16, 0.09, GOLD, { mat: 'Metal' }); }
  for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + Math.PI / 2; b.blk([Math.cos(a) * 0.26, 0.06, Math.sin(a) * 0.26], [0.06, 0.06, 0.06], gems[i % gems.length], { mat: 'Neon', rot: [0.6, Math.PI / 2 - a, 0.6] }); }
  b.pop();
}
export function halo(b, pos, r = 0.26, c = '#ffe9a8') { b.ring(pos, r, 14, [0.11, 0.05, 0.06], c, { mat: 'Neon' }); }
export function wingsAngel(b, pos, k = 1, o = {}) {
  const c = o.c ?? '#fbf8f2', tip = o.tip ?? '#ffe9a8';
  for (const sx of [1, -1]) {
    b.push([sx * pos[0], pos[1], pos[2]], [0, sx * 0.5, sx * 0.35], k);
    [0.95, 0.78, 0.6, 0.42].forEach((L, i) => b.blk([sx * L / 2, -i * 0.13, -i * 0.04], [L, 0.14, 0.07], i === 3 ? tip : shade(c, 1 - i * 0.04), { rot: [0, 0, -sx * i * 0.18], mat: i === 3 ? o.tipMat : null }));
    b.blk([sx * 0.92, 0.04, 0], [0.16, 0.16, 0.08], tip, { mat: o.tipMat });
    b.pop();
  }
}
export function partyHat(b, pos, k = 1, cols = ['#ff5aa5', '#ffe07a', '#5ad1ff']) {
  b.push(pos, [0, 0, 0.2], k);
  for (let i = 0; i < 6; i++) { const w = 0.34 * (1 - i / 6.5); b.blk([0, i * 0.075, 0], [w, 0.075, w], cols[i % 2 ? 1 : 0], { rot: [0, i * 0.2, 0] }); }
  b.ball([0, 0.48, 0], 0.1, '#ffffff', { mat: 'Smooth' });
  b.pop();
}
export function topHat(b, pos, k = 1) {
  b.push(pos, [0, 0, -0.1], k);
  b.cyl([0, 0.02, 0], [0.52, 0.04, 0.52], '#1b1820', { j: 0 });
  b.cyl([0, 0.2, 0], [0.32, 0.36, 0.32], '#1b1820', { j: 0 });
  b.cyl([0, 0.08, 0], [0.335, 0.07, 0.335], '#c0283a', { j: 0 });
  b.pop();
}
export function cape(b, pos, w, h, color, trim) {
  b.push(pos, [0.2, 0, 0]);
  b.voxBox([0, -h / 2, 0], [w, h, b.step * 0.6], color, { paint: (u) => (u[1] < -0.8 ? trim : null) });
  if (trim) { b.voxBox([0, 0, 0.04], [w * 0.92, b.step * 1.2, b.step * 1.2], trim); for (let i = -2; i <= 2; i++) b.blk([i * w * 0.18, -h + b.step * 0.4, -b.step * 0.4], [0.04, 0.06, 0.02], INK, { j: 0 }); }
  b.pop();
}
