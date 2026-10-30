// Prägemotive für alle 50 Münzen – als Relief gezeichnet statt aus Emojis umgefärbt.
//
// Jedes Motiv ist eine Funktion, die mit einem kleinen Relief-Werkzeug (`g`) in einem
// 200×200-Raster (Mitte 0,0, y nach unten) arbeitet:
//   g.shape(d)     erhabene Fläche (Plateau + Wölbung, wie ein Kissenrelief)
//   g.bump(d)      zusätzliche Wölbung auf vorhandenem Relief
//   g.ridge(d, w)  erhabene Linie (Fühler, Ketten, Strahlen)
//   g.groove(d, w) eingravierte Linie (Federn, Fell, Konturen)
//   g.pit(d)       Vertiefung (Augen, Löcher, Samen)
//   g.cut(d)       entfernt Relief bis auf den Grund
//   g.hatch/scales/stipple/bricks  Strukturen, auf eine Form begrenzt
//   g.at(x, y, rot, fn, sx, sy)    verschiebt/dreht/spiegelt alles in fn
// Pfade sind SVG-Pfad-Strings. Aus dem Höhenbild entstehen Farbe (Metallpalette mit
// eingebackenem Streiflicht), Normal-Map und Silhouette – das Motiv ist dadurch aus
// demselben Metall wie die Münze und wirkt eingeprägt statt aufgeklebt.

const TAU = Math.PI * 2;
const f = (n) => +n.toFixed(2);
const gray = (v) => {
  const n = Math.round(Math.min(1, Math.max(0, v)) * 255);
  return `rgb(${n},${n},${n})`;
};

// ── Pfad-Helfer ──
const C = (x, y, r) => `M${f(x - r)} ${f(y)}A${f(r)} ${f(r)} 0 1 0 ${f(x + r)} ${f(y)}A${f(r)} ${f(r)} 0 1 0 ${f(x - r)} ${f(y)}Z`;
const E = (x, y, rx, ry) => `M${f(x - rx)} ${f(y)}A${f(rx)} ${f(ry)} 0 1 0 ${f(x + rx)} ${f(y)}A${f(rx)} ${f(ry)} 0 1 0 ${f(x - rx)} ${f(y)}Z`;
const L = (pts) => 'M' + pts.map((p) => f(p[0]) + ' ' + f(p[1])).join('L');
const P = (pts) => L(pts) + 'Z';
const R = (x, y, w, h, r = 0) =>
  r
    ? `M${x + r} ${y}L${x + w - r} ${y}Q${x + w} ${y} ${x + w} ${y + r}L${x + w} ${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}L${x + r} ${y + h}Q${x} ${y + h} ${x} ${y + h - r}L${x} ${y + r}Q${x} ${y} ${x + r} ${y}Z`
    : `M${x} ${y}L${x + w} ${y}L${x + w} ${y + h}L${x} ${y + h}Z`;
const STAR = (x, y, r, n = 5, inner = 0.45, rot = 0) =>
  P(Array.from({ length: n * 2 }, (_, i) => {
    const a = (i / (n * 2)) * TAU - Math.PI / 2 + (rot * Math.PI) / 180;
    const rr = i % 2 ? r * inner : r;
    return [x + Math.cos(a) * rr, y + Math.sin(a) * rr];
  }));
const polar = (cx, cy, n, rf, sx = 1, sy = 1) =>
  P(Array.from({ length: n }, (_, i) => {
    const a = (i / n) * TAU;
    const r = rf(a, i);
    return [cx + Math.cos(a) * r * sx, cy + Math.sin(a) * r * sy];
  }));
// Blatt/Feder von (0,0) nach oben (−y)
const LEAF = (len, w) => `M0 0C${w} ${-len * 0.3} ${w * 0.8} ${-len * 0.8} 0 ${-len}C${-w * 0.8} ${-len * 0.8} ${-w} ${-len * 0.3} 0 0Z`;
// Flammenzunge, Spitze zur Seite gebogen
const FLAME = (len, w, bend = 0.5) =>
  `M0 0C${w} ${-len * 0.3} ${w * 1.2} ${-len * 0.65} ${w * bend} ${-len}C${-w * 0.2} ${-len * 0.7} ${-w} ${-len * 0.35} 0 0Z`;
const spiral = (cx, cy, r0, r1, turns, start = 0, n = 220) =>
  L(Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n, a = (start * Math.PI) / 180 + t * turns * TAU, r = r0 + (r1 - r0) * t;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  }));
// Röhre mit abnehmender Breite = Vereinigung vieler Kreise entlang einer Punktfolge
const tube = (pts, w0, w1) => pts.map((p, i) => C(p[0], p[1], (w0 + (w1 - w0) * (i / Math.max(1, pts.length - 1))) / 2)).join('');
const bez = (p0, p1, p2, p3, n = 40) =>
  Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n, u = 1 - t;
    return [
      u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
      u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
    ];
  });

function seeded(seed) {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// ── Relief-Werkzeug ──
class Relief {
  constructor(S, seed) {
    const mk = () => {
      const cv = document.createElement('canvas');
      cv.width = cv.height = S;
      return cv.getContext('2d', { willReadFrequently: true });
    };
    this.S = S;
    this.k = S / 200;
    this.M = mk();
    this.H = mk();
    this.m = new DOMMatrix();
    this.rnd = seeded(seed);
  }
  T() { return new DOMMatrix().translate(this.S / 2, this.S / 2).scale(this.k).multiply(this.m); }
  sc() { return this.k * Math.hypot(this.m.a, this.m.b); }
  p(d) { const p = new Path2D(); p.addPath(new Path2D(d), this.T()); return p; }
  at(x, y, rot, fn, sx = 1, sy = sx) {
    const old = this.m;
    this.m = old.translate(x, y).rotate(rot).scale(sx, sy);
    fn();
    this.m = old;
  }
  _do(ctx, clip, fn) {
    ctx.save();
    if (clip) ctx.clip(this.p(clip));
    fn(ctx);
    ctx.restore();
  }
  shape(d, { h = 0.55, dome = 0.3, blur = 6, clip, rule = 'nonzero' } = {}) {
    const p = this.p(d);
    this._do(this.M, clip, (c) => { c.fillStyle = '#fff'; c.fill(p, rule); });
    this._do(this.H, clip, (c) => { c.fillStyle = gray(h); c.fill(p, rule); });
    if (dome > 0) this.bump(d, dome, blur, { clip, rule });
  }
  bump(d, amt = 0.15, blur = 4, { clip, rule = 'nonzero' } = {}) {
    const p = this.p(d);
    this._do(this.H, clip, (c) => {
      c.clip(p, rule);
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = amt;
      c.filter = `blur(${blur * this.sc()}px)`;
      c.fillStyle = '#fff';
      c.fill(p, rule);
    });
  }
  ridge(d, w = 3, h = 0.6, { clip } = {}) {
    const p = this.p(d), lw = w * this.sc();
    const st = (c, style, width) => {
      c.strokeStyle = style; c.lineWidth = width; c.lineCap = c.lineJoin = 'round'; c.stroke(p);
    };
    this._do(this.M, clip, (c) => st(c, '#fff', lw));
    this._do(this.H, clip, (c) => {
      st(c, gray(h), lw);
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = 0.22;
      c.filter = `blur(${lw * 0.22}px)`;
      st(c, '#fff', lw * 0.5);
    });
  }
  groove(d, w = 1.6, depth = 0.62, clip) {
    const p = this.p(d);
    this._do(this.H, clip, (c) => {
      c.globalCompositeOperation = 'multiply';
      c.strokeStyle = gray(depth); c.lineWidth = w * this.sc(); c.lineCap = c.lineJoin = 'round';
      c.stroke(p);
    });
  }
  pit(d, depth = 0.6, blur = 1, clip) {
    const p = this.p(d);
    this._do(this.H, clip, (c) => {
      c.globalCompositeOperation = 'multiply';
      c.filter = `blur(${blur * this.sc()}px)`;
      c.fillStyle = gray(depth);
      c.fill(p);
    });
  }
  cut(d) {
    const p = this.p(d);
    for (const ctx of [this.M, this.H]) this._do(ctx, null, (c) => { c.globalCompositeOperation = 'destination-out'; c.fill(p); });
  }
  hatch(clip, { gap = 6, angle = 45, w = 1, depth = 0.72, wave = 0 } = {}) {
    const a = (angle * Math.PI) / 180, dx = Math.cos(a), dy = Math.sin(a);
    let s = '';
    for (let k = -150; k <= 150; k += gap) {
      const cx = -dy * k, cy = dx * k;
      if (!wave) s += `M${f(cx - dx * 150)} ${f(cy - dy * 150)}L${f(cx + dx * 150)} ${f(cy + dy * 150)}`;
      else {
        const pts = [];
        for (let t = -150; t <= 150; t += 4) {
          const o = Math.sin(t * 0.08 + k) * wave;
          pts.push([cx + dx * t - dy * o, cy + dy * t + dx * o]);
        }
        s += L(pts);
      }
    }
    this.groove(s, w, depth, clip);
  }
  scales(clip, { r = 7, w = 1.1, depth = 0.7 } = {}) {
    let s = '';
    let row = 0;
    for (let y = -110; y < 110; y += r * 0.85, row++) {
      const off = row % 2 ? r : 0;
      for (let x = -110 - off; x < 110; x += 2 * r) s += `M${f(x - r)} ${f(y)}A${r} ${r} 0 0 0 ${f(x + r)} ${f(y)}`;
    }
    this.groove(s, w, depth, clip);
  }
  stipple(clip, { n = 160, r = 1.3, depth = 0.72 } = {}) {
    let s = '';
    for (let i = 0; i < n; i++) s += C(this.rnd() * 200 - 100, this.rnd() * 200 - 100, r * (0.6 + this.rnd() * 0.8));
    this.pit(s, depth, 0.4, clip);
  }
  bricks(clip, { bw = 14, bh = 8, w = 0.9, depth = 0.74 } = {}) {
    let s = '';
    let row = 0;
    for (let y = -120; y < 120; y += bh, row++) {
      s += `M-120 ${y}L120 ${y}`;
      for (let x = -120 + (row % 2) * (bw / 2); x < 120; x += bw) s += `M${x} ${y}L${x} ${y + bh}`;
    }
    this.groove(s, w, depth, clip);
  }
  // Höhe → Farbe in der Metallpalette, mit eingebackenem Streiflicht von oben links
  finish(pal) {
    const { S, M, H } = this;
    H.save();
    H.globalCompositeOperation = 'destination-in';
    H.drawImage(M.canvas, 0, 0);
    H.restore();
    const hd = H.getImageData(0, 0, S, S).data;
    const out = new ImageData(S, S);
    const o = out.data;
    const [cHi, cMid, cLo] = pal.map(hexToRgb);
    const d = Math.max(1, Math.round(S / 260));
    const v = (x, y) => {
      x = Math.min(S - 1, Math.max(0, x)); y = Math.min(S - 1, Math.max(0, y));
      const i = (y * S + x) * 4;
      return hd[i + 3] ? hd[i] / 255 : 0.3;
    };
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const i = (y * S + x) * 4;
        if (!hd[i + 3]) continue;
        const h = hd[i] / 255;
        const shade = Math.max(-0.32, Math.min(0.32, (v(x - d, y - d) - v(x + d, y + d)) * 2.6));
        const t = Math.min(1, Math.max(0, 0.18 + (h - 0.3) * 0.75 + shade));
        for (let k = 0; k < 3; k++) {
          o[i + k] = t < 0.5 ? cLo[k] + (cMid[k] - cLo[k]) * t * 2 : cMid[k] + (cHi[k] - cMid[k]) * (t - 0.5) * 2;
        }
        o[i + 3] = hd[i + 3];
      }
    }
    const colorCv = document.createElement('canvas');
    colorCv.width = colorCv.height = S;
    colorCv.getContext('2d').putImageData(out, 0, 0);
    return { colorCv, heightCv: H.canvas, maskCv: M.canvas };
  }
}

// ── wiederverwendbare Bauteile ──
function feather(g, len, w, { h = 0.56, barbs = 3, shape = LEAF } = {}) {
  g.shape(shape(len, w), { h, dome: 0.28, blur: Math.max(2, w * 0.5) });
  g.groove(`M0 -2L0 ${-len * 0.88}`, 0.9, 0.7);
  for (let i = 1; i <= barbs; i++) {
    const y = -len * (i / (barbs + 1));
    g.groove(`M0 ${f(y)}L${f(w * 0.65)} ${f(y - len * 0.12)}M0 ${f(y)}L${f(-w * 0.65)} ${f(y - len * 0.12)}`, 0.6, 0.8);
  }
}
// Flügel als Fächer (nach rechts oben); für links mit sx = −1 spiegeln
function wing(g, { n = 7, a0 = 10, a1 = 95, l0 = 78, l1 = 52, w = 11, coverts = true, shape = LEAF, h = 0.54 } = {}) {
  for (let i = n - 1; i >= 0; i--) {
    const t = i / (n - 1);
    g.at(0, 0, a0 + (a1 - a0) * t, () => feather(g, l0 + (l1 - l0) * t, w, { h, shape }));
  }
  if (coverts) {
    for (let i = n - 2; i >= 0; i--) {
      const t = i / (n - 1);
      g.at(0, 0, a0 + 6 + (a1 - a0 - 6) * t, () => feather(g, (l0 + (l1 - l0) * t) * 0.5, w * 0.9, { h: h + 0.06, barbs: 1, shape }));
    }
  }
}
function sword(g, len = 92) {
  const blade = P([[0, -len], [8, -len + 12], [7, 30], [-7, 30], [-8, -len + 12]]);
  g.shape(blade, { h: 0.6, dome: 0.12, blur: 3 });
  g.groove(`M0 ${-len + 14}L0 24`, 2.2, 0.62);
  g.shape(R(-30, 28, 60, 9, 4.5), { h: 0.64, dome: 0.25, blur: 3 });
  g.shape(C(-32, 32.5, 6) + C(32, 32.5, 6), { h: 0.66, dome: 0.3, blur: 2 });
  const grip = R(-5, 37, 10, 30, 2);
  g.shape(grip, { h: 0.58, dome: 0.2, blur: 2 });
  g.hatch(grip, { angle: 30, gap: 3.6, w: 0.9, depth: 0.7 });
  g.shape(C(0, 72, 7.5), { h: 0.64, dome: 0.35, blur: 2 });
  g.pit(C(0, 72, 3), 0.7);
}
function crown(g, s = 1) {
  g.at(0, 0, 0, () => {
    const body = 'M-72 28L-84 -40L-46 -6L-24 -60L0 -14L24 -60L46 -6L84 -40L72 28Z';
    g.shape(body, { h: 0.55, dome: 0.32, blur: 9 });
    g.groove('M-62 18L-70 -22M-34 16L-24 -40M0 16L0 -2M34 16L24 -40M62 18L70 -22', 1, 0.78);
    g.shape(C(-84, -40, 7) + C(-24, -60, 7) + C(24, -60, 7) + C(84, -40, 7) + C(0, -16, 6), { h: 0.66, dome: 0.35, blur: 2 });
    const band = R(-76, 26, 152, 26, 4);
    g.shape(band, { h: 0.62, dome: 0.25, blur: 4 });
    g.groove('M-74 31L74 31M-74 47L74 47', 1, 0.7);
    g.shape(E(0, 39, 10, 7), { h: 0.72, dome: 0.3, blur: 2 });
    g.groove(E(0, 39, 6, 3.5), 0.8, 0.75);
    for (const x of [-50, -28, 28, 50]) {
      g.shape(P([[x, 33], [x + 6, 39], [x, 45], [x - 6, 39]]), { h: 0.7, dome: 0.2, blur: 1.5 });
    }
    for (const x of [-64, -40, -16, 16, 40, 64]) g.pit(C(x, 39, 1.8), 0.6);
  }, s);
}

// ── Die 50 Motive ──
const M = {};

// Normal
M.pilz = (g) => {
  g.shape('M-62 74C-30 66 30 66 62 74C40 82 -40 82 -62 74Z', { h: 0.44, dome: 0.1 });
  for (const [x, c] of [[-52, -9], [-44, -2], [-30, -7], [44, 6], [54, 10]]) g.ridge(`M${x} 74Q${x + c * 0.3} 62 ${x + c} 54`, 2.2, 0.5);
  const stem = 'M-20 4C-22 30 -27 52 -32 72C-10 77 10 77 32 72C27 52 22 30 20 4Z';
  g.shape(stem, { h: 0.52, blur: 10 });
  g.hatch(stem, { angle: 90, gap: 5.5, w: 0.8, depth: 0.84, wave: 1.2 });
  g.ridge('M-23 26Q0 35 23 26', 4.5, 0.66);
  const cap = 'M-76 4C-78 -50 -38 -82 0 -82C38 -82 78 -50 76 4C46 14 -46 14 -76 4Z';
  g.shape(cap, { h: 0.56, dome: 0.42, blur: 16 });
  g.groove('M-68 2C-40 10 40 10 68 2', 1.4, 0.7);
  for (const [x, y, r] of [[-42, -36, 13], [2, -60, 15], [42, -32, 11], [-8, -26, 8], [62, -8, 6], [-64, -10, 6], [22, -10, 6]]) {
    g.bump(C(x, y, r), 0.16, 3);
    g.groove(C(x, y, r), 1.1, 0.72);
  }
};

M.schnecke = (g) => {
  g.ridge('M74 -10Q70 -26 63 -42', 3, 0.58);
  g.ridge('M84 -11Q88 -28 94 -40', 3, 0.58);
  g.shape(C(63, -44, 4.5) + C(94, -42, 4.5), { h: 0.66, dome: 0.25, blur: 2 });
  const body = 'M-86 62C-84 48 -60 44 -30 46L46 46C60 46 66 32 66 12C66 -2 72 -12 80 -12C90 -12 92 0 90 16C88 42 78 64 50 66L-76 68C-84 68 -87 66 -86 62Z';
  g.shape(body, { h: 0.5, blur: 8 });
  g.stipple(body, { n: 110, r: 1.1 });
  g.groove('M-80 60C-40 56 20 56 62 58', 1, 0.8);
  g.pit(C(80, 0, 3.4), 0.5);
  g.groove('M77 24Q83 29 89 24', 1.2);
  const shell = C(-4, -6, 50);
  g.shape(shell, { h: 0.58, dome: 0.4, blur: 14 });
  g.groove(spiral(-4, -6, 3, 47, 3.1, -90), 2.6, 0.55);
  for (let i = 0; i < 30; i++) {
    const a = (i / 30) * TAU;
    g.groove(`M${f(-4 + Math.cos(a) * 40)} ${f(-6 + Math.sin(a) * 40)}L${f(-4 + Math.cos(a) * 48)} ${f(-6 + Math.sin(a) * 48)}`, 0.7, 0.82);
  }
};

M.brot = (g) => {
  g.shape(R(-92, 40, 184, 14, 5), { h: 0.46, dome: 0.1 });
  g.hatch(R(-92, 40, 184, 14), { angle: 0, gap: 4, w: 0.6, depth: 0.85, wave: 0.8 });
  const loaf = 'M-84 40C-92 -4 -72 -44 -30 -50C0 -55 32 -55 58 -47C90 -36 94 8 84 40C42 50 -42 50 -84 40Z';
  g.shape(loaf, { h: 0.54, dome: 0.45, blur: 18 });
  g.stipple(loaf, { n: 260, r: 1, depth: 0.8 });
  for (const x of [-50, -16, 18, 50]) {
    g.groove(`M${x - 10} -38C${x - 4} -20 ${x + 4} 0 ${x + 12} 16`, 6.5, 0.6);
    g.groove(`M${x - 9} -34C${x - 3} -18 ${x + 4} 0 ${x + 10} 12`, 1.6, 0.6);
  }
  g.at(-58, 68, 70, () => { g.shape(LEAF(22, 6), { h: 0.55, dome: 0.3, blur: 2 }); g.groove('M0 -3L0 -18', 0.8); });
  g.at(64, 70, -64, () => { g.shape(LEAF(20, 6), { h: 0.55, dome: 0.3, blur: 2 }); g.groove('M0 -3L0 -16', 0.8); });
};

M.fisch = (g) => {
  g.ridge('M-86 72Q-66 62 -46 72T-6 72T34 72T74 72', 2.6, 0.5);
  g.ridge('M-60 86Q-44 78 -28 86T4 86T36 86', 2.2, 0.48);
  const tail = 'M48 -4L90 -42C82 -14 82 10 90 36Z';
  g.shape(tail, { h: 0.5, blur: 6 });
  for (let i = 0; i < 8; i++) g.groove(`M52 -3L${88 - Math.abs(i - 3.5) * 2} ${-38 + i * 10}`, 0.9, 0.75);
  const fin = 'M-26 -30C-14 -62 20 -62 32 -30Z';
  g.shape(fin, { h: 0.5, blur: 5 });
  for (let i = 0; i < 7; i++) g.groove(`M${-20 + i * 8} -32L${-16 + i * 7} -54`, 0.8, 0.76);
  g.shape('M-10 26C-2 48 18 50 22 32Z', { h: 0.5, blur: 4 });
  const body = 'M-80 0C-58 -46 20 -50 56 -6C22 42 -58 42 -80 0Z';
  g.shape(body, { h: 0.56, dome: 0.38, blur: 14 });
  g.scales(body, { r: 7, w: 1, depth: 0.74 });
  g.shape('M-80 0C-72 -22 -56 -36 -38 -38C-31 -14 -31 14 -38 36C-56 34 -72 22 -80 0Z', { h: 0.62, dome: 0.3, blur: 8 });
  g.groove('M-38 -36C-28 -12 -28 12 -38 36', 1.8, 0.6);
  g.shape(C(-58, -8, 7.5), { h: 0.72, dome: 0.2, blur: 2 });
  g.pit(C(-58, -8, 3.4), 0.5);
  g.groove('M-79 3L-68 7', 1.4);
  for (const [x, y, r] of [[-82, -24, 3], [-90, -36, 2.2], [-86, -48, 1.6]]) g.ridge(C(x, y, r), 1, 0.5);
};

M.aehre = (g) => {
  for (const s of [-1, 1]) g.at(0, 62, s * 38, () => { g.shape(LEAF(58, 9), { h: 0.5, blur: 4 }); g.groove('M0 -3L0 -52', 0.9, 0.72); });
  g.ridge('M0 92C2 40 0 0 0 -66', 4, 0.55);
  for (let i = 6; i >= 0; i--) {
    const y = -58 + i * 13;
    for (const s of [-1, 1]) {
      g.at(s * 3, y, s * 30, () => {
        g.ridge('M0 -20L0 -46', 0.9, 0.52);
        g.shape(LEAF(22, 8), { h: 0.6, dome: 0.4, blur: 4 });
        g.groove('M0 -4L0 -18', 0.9, 0.72);
      });
    }
  }
  g.at(0, -66, 0, () => {
    g.ridge('M0 -20L0 -36', 0.9, 0.52);
    g.shape(LEAF(22, 8), { h: 0.6, dome: 0.4, blur: 4 });
    g.groove('M0 -4L0 -18', 0.9, 0.72);
  });
};

M.hammer = (g) => {
  const anvil = 'M-92 8C-64 10 -48 20 -42 20L62 20L62 38L32 40L22 60L46 72L-46 72L-22 60L-32 40L-50 38C-72 34 -86 24 -92 8Z';
  g.shape(anvil, { h: 0.52, dome: 0.2, blur: 8 });
  g.groove('M-42 26L60 26', 1.2, 0.7);
  g.groove('M-30 40L30 40M-22 60L22 60', 1, 0.72);
  g.stipple('M-46 40L46 40L46 72L-46 72Z', { n: 60, r: 0.9 });
  g.ridge('M-70 84L70 84', 3, 0.48);
  g.at(28, -34, -40, () => {
    const handle = R(-6, -6, 12, 84, 4);
    g.shape(handle, { h: 0.58, dome: 0.25, blur: 3 });
    g.hatch(handle, { angle: 88, gap: 3.5, w: 0.7, depth: 0.82, wave: 0.8 });
    const head = R(-32, -28, 64, 24, 3);
    g.shape(head, { h: 0.66, dome: 0.28, blur: 5 });
    g.groove('M-28 -16L28 -16', 0.8, 0.82);
    g.shape(P([[-32, -29], [-40, -24], [-40, -8], [-32, -3]]), { h: 0.7, dome: 0.1 });
    g.groove('M-9 -28L-9 -4M9 -28L9 -4', 0.9, 0.7);
  });
  for (let i = 0; i < 7; i++) {
    const a = (-170 + i * 22) * Math.PI / 180;
    g.ridge(`M${f(-46 + Math.cos(a) * 14)} ${f(10 + Math.sin(a) * 14)}L${f(-46 + Math.cos(a) * 26)} ${f(10 + Math.sin(a) * 26)}`, 2, 0.6);
  }
  g.shape(STAR(-70, -18, 6, 4, 0.3) + STAR(-30, -24, 5, 4, 0.3), { h: 0.66, dome: 0.1 });
};

M.frosch = (g) => {
  const pad = 'M-90 70C-90 52 -40 44 0 44C40 44 90 52 90 70C90 86 40 92 0 92C-40 92 -90 86 -90 70Z';
  g.shape(pad, { h: 0.44, dome: 0.12, blur: 10 });
  for (let i = 0; i < 9; i++) g.groove(`M0 68L${-80 + i * 20} ${i % 2 ? 86 : 52}`, 0.8, 0.8);
  g.cut('M0 68L-12 92L12 92Z');
  for (const s of [-1, 1]) {
    g.at(0, 0, 0, () => {
      g.shape(E(50, 50, 26, 20), { h: 0.52, dome: 0.3, blur: 6 });
      for (const a of [-30, 0, 30]) g.ridge(`M70 60L${f(70 + Math.cos(a * Math.PI / 180) * 18)} ${f(66 + Math.sin(a * Math.PI / 180) * 10)}`, 3, 0.56);
    }, s, 1);
  }
  const body = E(0, 26, 48, 40);
  g.shape(body, { h: 0.54, dome: 0.4, blur: 12 });
  g.stipple(body, { n: 40, r: 2.2, depth: 0.8 });
  g.shape(E(0, 34, 26, 24), { h: 0.58, dome: 0.2, blur: 6 });
  const head = 'M-62 -12C-64 -50 -30 -62 0 -55C30 -62 64 -50 62 -12C56 18 -56 18 -62 -12Z';
  g.shape(head, { h: 0.58, dome: 0.4, blur: 12 });
  for (const s of [-1, 1]) {
    g.shape(C(s * 34, -50, 18), { h: 0.66, dome: 0.4, blur: 5 });
    g.groove(C(s * 34, -50, 11), 1.2, 0.7);
    g.pit(E(s * 34, -50, 6, 8), 0.5);
  }
  g.groove('M-44 -8Q0 14 44 -8', 2.2, 0.58);
  g.pit(C(-8, -24, 2) + C(8, -24, 2), 0.55);
};

M.kaese = (g) => {
  const top = 'M-84 6L36 -50L86 -14Z';
  const front = 'M-84 6L86 -14L86 50L-84 62Z';
  g.shape(front, { h: 0.52, dome: 0.15, blur: 8 });
  g.shape(top, { h: 0.64, dome: 0.15, blur: 8 });
  g.groove('M-84 6L86 -14', 1.6, 0.6);
  g.groove('M-84 14L86 -6', 0.8, 0.82);
  for (const [x, y, r] of [[-44, 32, 10], [4, 22, 14], [52, 30, 9], [30, 4, 5], [-64, 46, 5], [-12, 48, 6], [70, 8, 6]]) {
    g.pit(C(x, y, r), 0.62, 2);
    g.groove(`M${x - r * 0.8} ${y - r * 0.4}A${r} ${r} 0 0 1 ${x + r * 0.8} ${y - r * 0.4}`, 1, 0.6);
  }
  for (const [x, y, rx, ry] of [[22, -24, 8, 3.5], [54, -14, 5, 2.2], [-20, -8, 6, 2.5]]) g.pit(E(x, y, rx, ry), 0.6, 1.5);
  g.ridge('M-60 78Q-30 72 0 78', 2, 0.5);
  g.shape(E(66, 76, 14, 6), { h: 0.5, dome: 0.2 });
};

M.ente = (g) => {
  g.ridge('M-90 66Q-70 58 -50 66T-10 66T30 66T70 66T96 64', 2.6, 0.5);
  g.ridge('M-60 80Q-44 74 -28 80T4 80T36 80', 2, 0.48);
  const body = 'M-74 4C-86 -16 -82 -24 -70 -16C-60 -8 -44 4 -20 6C0 8 20 4 40 -4C64 -12 82 4 78 26C72 52 40 62 0 60C-40 58 -76 44 -74 4Z';
  g.shape(body, { h: 0.54, dome: 0.42, blur: 14 });
  const wingD = 'M-46 18C-30 6 6 8 24 22C10 40 -20 44 -46 18Z';
  g.shape(wingD, { h: 0.6, dome: 0.3, blur: 6 });
  for (let i = 0; i < 4; i++) g.groove(`M${-40 + i * 12} ${22 + i}Q${-30 + i * 12} ${30 + i * 2} ${-22 + i * 13} ${26 + i}`, 1, 0.68);
  g.shape(C(34, -32, 30), { h: 0.58, dome: 0.42, blur: 10 });
  g.shape('M58 -32C72 -40 92 -32 90 -22C84 -14 68 -14 58 -18Z', { h: 0.64, dome: 0.2, blur: 3 });
  g.groove('M60 -25L88 -24', 1, 0.7);
  g.shape(C(40, -40, 5.5), { h: 0.7, dome: 0.2, blur: 1.5 });
  g.pit(C(41, -40, 2.6), 0.5);
  g.groove('M18 -50Q26 -64 38 -62', 1, 0.75);
};

// Selten
M.wolf = (g) => {
  g.shape(C(52, -56, 30), { h: 0.44, dome: 0.15, blur: 10 });
  for (const [x, y, r] of [[44, -62, 6], [62, -46, 4], [58, -70, 3]]) { g.pit(C(x, y, r), 0.8, 1.5); g.groove(C(x, y, r), 0.7, 0.85); }
  g.shape('M-96 90C-70 70 -40 68 -10 74C20 70 60 76 96 90Z', { h: 0.46, dome: 0.12 });
  const head = 'M-30 92L-34 62L-44 54L-35 48L-46 38L-35 32L-44 20L-33 14C-36 0 -40 -12 -48 -26L-70 -46L-56 -52L-78 -62L-74 -68C-60 -68 -48 -70 -38 -74L-24 -96L-14 -78L-4 -92L2 -72C12 -60 18 -40 20 -20C24 10 28 50 36 92Z';
  g.shape(head, { h: 0.56, dome: 0.38, blur: 12 });
  g.hatch(head, { angle: 70, gap: 3.6, w: 0.6, depth: 0.84, wave: 1.2 });
  for (let i = 0; i < 5; i++) { const y = 20 + i * 12; g.groove(`M-30 ${y}l8 -5l-2 8l8 -4`, 1, 0.64); }
  g.groove('M-56 -52L-44 -40', 1.4, 0.58);
  g.groove('M-70 -46C-60 -38 -50 -34 -42 -32', 1, 0.66);
  g.shape(E(-36, -64, 5, 3), { h: 0.68, dome: 0.15 });
  g.pit(C(-36, -64, 1.8), 0.45);
  g.groove('M-46 -68Q-36 -74 -26 -68', 1, 0.66);
  g.pit(C(-75, -64, 2.4), 0.55);
  g.groove('M-22 -88L-18 -78M-6 -86L-4 -76', 1, 0.66);
  g.groove('M14 -30C14 10 20 50 28 88', 1, 0.72);
  g.groove('M-20 -40C-10 -20 -14 10 -10 40', 0.9, 0.76);
};

M.mond = (g) => {
  g.shape(C(-6, 4, 74), { h: 0.56, dome: 0.42, blur: 16 });
  g.cut(C(30, -14, 64));
  for (const [x, y, r] of [[-56, 4, 8], [-40, 42, 6], [-30, -44, 5], [-62, -22, 4], [-20, 62, 4]]) {
    g.pit(C(x, y, r), 0.72, 1.5);
    g.groove(`M${x - r} ${y}A${r} ${r} 0 0 1 ${x + r} ${y}`, 0.8, 0.85);
  }
  g.groove('M-36 -2Q-28 6 -20 0', 1.6, 0.6);
  g.groove('M-36 -10Q-30 -14 -22 -10', 1, 0.72);
  g.bump(E(-26, 18, 6, 4), 0.12, 2);
  for (const [x, y, r] of [[42, -26, 11], [66, 22, 7], [20, 46, 6], [70, -50, 5], [42, 70, 4]]) g.shape(STAR(x, y, r, 4, 0.28), { h: 0.62, dome: 0.15, blur: 1 });
  for (const [x, y] of [[54, 0], [26, 14], [58, 46], [84, -6]]) g.shape(C(x, y, 1.6), { h: 0.6, dome: 0 });
};

M.dolch = (g) => {
  for (const s of [-1, 1]) g.at(0, 0, 0, () => {
    g.ridge('M8 74C30 70 52 50 56 20', 2, 0.5);
    for (let i = 0; i < 5; i++) {
      const t = i / 4, x = 14 + t * 38, y = 72 - t * 50;
      g.at(x, y, 30 + t * 20, () => { g.shape(LEAF(16, 5), { h: 0.55, dome: 0.25, blur: 1.5 }); g.groove('M0 -2L0 -13', 0.6, 0.75); });
    }
  }, s, 1);
  g.at(0, -4, 0, () => sword(g, 94));
};

M.eule = (g) => {
  const branch = 'M-96 70C-60 62 -20 66 20 64C50 62 76 66 96 60L96 70C70 74 40 74 10 76C-30 78 -70 76 -96 80Z';
  g.shape(branch, { h: 0.5, dome: 0.15 });
  g.hatch(branch, { angle: 2, gap: 3, w: 0.6, depth: 0.82, wave: 0.6 });
  const body = 'M-50 -30C-56 -70 -36 -80 -32 -90L-14 -62C-5 -66 5 -66 14 -62L32 -90C36 -80 56 -70 50 -30C62 10 52 58 0 72C-52 58 -62 10 -50 -30Z';
  g.shape(body, { h: 0.54, dome: 0.4, blur: 14 });
  g.scales(E(0, 28, 34, 40), { r: 5.5, w: 1, depth: 0.72 });
  for (const s of [-1, 1]) {
    g.shape(`M${s * 46} -20C${s * 62} 10 ${s * 56} 46 ${s * 30} 64C${s * 40} 40 ${s * 40} 10 ${s * 46} -20Z`, { h: 0.58, dome: 0.25, blur: 4 });
    for (let i = 0; i < 4; i++) g.groove(`M${s * (48 - i * 2)} ${-4 + i * 14}Q${s * 52} ${10 + i * 14} ${s * (40 - i)} ${18 + i * 14}`, 0.8, 0.72);
    g.shape(C(s * 21, -34, 22), { h: 0.6, dome: 0.3, blur: 6 });
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * TAU;
      g.groove(`M${f(s * 21 + Math.cos(a) * 12)} ${f(-34 + Math.sin(a) * 12)}L${f(s * 21 + Math.cos(a) * 20)} ${f(-34 + Math.sin(a) * 20)}`, 0.6, 0.8);
    }
    g.shape(C(s * 21, -34, 10), { h: 0.68, dome: 0.3, blur: 2 });
    g.pit(C(s * 21, -34, 5), 0.45);
    for (const dx of [-6, 0, 6]) g.ridge(`M${s * 14 + dx} 64L${s * 14 + dx * 1.3} 72`, 2.6, 0.62);
  }
  g.shape('M-6 -24L6 -24L0 -8Z', { h: 0.72, dome: 0.1 });
  g.groove('M-30 -56L-14 -50M30 -56L14 -50', 1.2, 0.66);
};

M.tanne = (g) => {
  g.shape('M-96 76C-50 62 50 62 96 76L96 100L-96 100Z', { h: 0.48, dome: 0.15 });
  g.stipple('M-96 70L96 70L96 100L-96 100Z', { n: 50, r: 1 });
  const tree = (x, y, s, h) => g.at(x, y, 0, () => {
    g.shape(R(-7, 56, 14, 22, 2), { h, dome: 0.15 });
    g.hatch(R(-7, 56, 14, 22), { angle: 90, gap: 3, w: 0.6, depth: 0.8 });
    for (let i = 3; i >= 0; i--) {
      const top = -78 + i * 30, bot = top + 50, w = 22 + i * 14;
      const tier = P([[0, top], [w, bot], [w * 0.55, bot - 6], [w * 0.25, bot - 1], [0, bot - 6], [-w * 0.25, bot - 1], [-w * 0.55, bot - 6], [-w, bot]]);
      g.shape(tier, { h: h + i * 0.012, dome: 0.3, blur: 6 });
      for (let k = 1; k < 4; k++) g.groove(`M0 ${top + 8 + k * 6}L${f(w * 0.25 * k)} ${bot - 8}M0 ${top + 8 + k * 6}L${f(-w * 0.25 * k)} ${bot - 8}`, 0.7, 0.76);
      g.groove(`M0 ${top + 6}L0 ${bot - 8}`, 0.9, 0.76);
    }
  }, s);
  tree(-58, 26, 0.55, 0.48);
  tree(62, 30, 0.48, 0.48);
  tree(0, 4, 0.92, 0.55);
  g.shape(STAR(0, -76, 9, 5, 0.45), { h: 0.72, dome: 0.2, blur: 1.5 });
};

M.flocke = (g) => {
  for (let i = 0; i < 6; i++) g.at(0, 0, i * 60, () => {
    g.ridge('M0 0L0 -84', 7, 0.58);
    for (const [y, l] of [[-34, 24], [-58, 17], [-76, 9]]) g.ridge(`M0 ${y}L${-l * 0.8} ${y - l}M0 ${y}L${l * 0.8} ${y - l}`, 4.4, 0.58);
    g.shape(P([[0, -98], [7, -88], [0, -79], [-7, -88]]), { h: 0.66, dome: 0.2, blur: 1.5 });
  });
  for (let i = 0; i < 6; i++) g.at(0, 0, i * 60, () => {
    g.groove('M0 -18L0 -80', 1, 0.74);
    g.groove('M0 -34L-17 -55M0 -34L17 -55', 0.8, 0.76);
  });
  g.at(0, 0, 30, () => g.ridge('M0 -14L0 -36', 3, 0.56));
  for (let i = 1; i < 6; i++) g.at(0, 0, 30 + i * 60, () => g.ridge('M0 -14L0 -36', 3, 0.56));
  const hex = polar(0, 0, 6, () => 20);
  g.shape(hex, { h: 0.66, dome: 0.25, blur: 4 });
  g.groove(polar(0, 0, 6, () => 12), 1, 0.7);
  g.pit(STAR(0, 0, 7, 6, 0.5), 0.6);
};

M.pinguin = (g) => {
  const floe = 'M-80 70L80 70L70 88L-72 88Z';
  g.shape(floe, { h: 0.48, dome: 0.1 });
  g.groove('M-40 74L-34 86M20 72L30 86M56 74L52 86', 0.8, 0.75);
  const body = 'M0 -86C30 -86 40 -56 40 -30C56 0 58 40 40 70L-40 70C-58 40 -56 0 -40 -30C-40 -56 -30 -86 0 -86Z';
  g.shape(body, { h: 0.56, dome: 0.42, blur: 14 });
  g.hatch(body, { angle: 80, gap: 5, w: 0.5, depth: 0.86 });
  const belly = 'M0 -44C22 -44 28 -20 30 0C36 30 32 54 20 68L-20 68C-32 54 -36 30 -30 0C-28 -20 -22 -44 0 -44Z';
  g.shape(belly, { h: 0.5, dome: 0.32, blur: 12 });
  g.stipple(belly, { n: 60, r: 0.9, depth: 0.82 });
  for (const s of [-1, 1]) {
    g.shape(`M${s * 38} -20C${s * 62} 0 ${s * 66} 30 ${s * 60} 46C${s * 52} 30 ${s * 46} 14 ${s * 38} 4Z`, { h: 0.6, dome: 0.3, blur: 5 });
    g.shape(E(s * 16, 72, 14, 5), { h: 0.6, dome: 0.2 });
    g.shape(E(s * 14, -60, 6, 7), { h: 0.64, dome: 0.3, blur: 2 });
    g.pit(C(s * 14, -60, 2.8), 0.5);
  }
  g.shape('M-8 -48L8 -48L0 -36Z', { h: 0.68, dome: 0.1 });
  g.shape('M0 -30L-16 -38L-16 -22Z M0 -30L16 -38L16 -22Z', { h: 0.66, dome: 0.15 });
  g.shape(C(0, -30, 3.5), { h: 0.72, dome: 0.1 });
  g.pit(C(0, -6, 2) + C(0, 8, 2) + C(0, 22, 2), 0.6);
};

M.socke = (g) => {
  const sock = 'M-34 -86L22 -86L22 14C22 30 38 36 58 40C86 46 92 82 58 84L-2 84C-34 84 -40 60 -36 38Z';
  g.shape(sock, { h: 0.52, dome: 0.38, blur: 12 });
  let v = '';
  for (let y = -48; y < 90; y += 8) for (let x = -40; x < 96; x += 8) v += `M${x} ${y}L${x + 4} ${y + 5}L${x + 8} ${y}`;
  g.groove(v, 0.7, 0.8, sock);
  for (const y of [-40, -22, -4]) g.ridge(`M-40 ${y}L30 ${y}`, 6, 0.6, { clip: sock });
  g.shape(E(20, 44, 24, 20), { h: 0.58, dome: 0.2, blur: 4, clip: sock });
  g.shape(E(72, 64, 26, 26), { h: 0.58, dome: 0.2, blur: 4, clip: sock });
  const cuff = R(-38, -92, 64, 30, 4);
  g.shape(cuff, { h: 0.62, dome: 0.25, blur: 5 });
  g.hatch(cuff, { angle: 90, gap: 5, w: 1.4, depth: 0.66 });
  g.groove('M-38 -62L26 -62', 1.2, 0.66);
};

// Sehr selten
M.krone = (g) => {
  g.at(0, 10, 0, () => crown(g));
  g.ridge('M-70 76Q0 66 70 76', 3, 0.5);
  for (let i = 0; i < 9; i++) g.shape(C(-64 + i * 16, 74 - Math.sin(i / 8 * Math.PI) * 6, 3.2), { h: 0.6, dome: 0.2, blur: 1 });
};

M.loewe = (g) => {
  const mane = polar(0, 4, 180, (a) => 84 + 7 * Math.sin(a * 16));
  g.shape(mane, { h: 0.5, dome: 0.3, blur: 12 });
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * TAU, b = a + 0.16;
    g.groove(`M${f(Math.cos(a) * 46)} ${f(4 + Math.sin(a) * 46)}Q${f(Math.cos(b) * 66)} ${f(4 + Math.sin(b) * 66)} ${f(Math.cos(a) * 84)} ${f(4 + Math.sin(a) * 84)}`, 1.2, 0.68);
  }
  for (const s of [-1, 1]) { g.shape(C(s * 36, -42, 12), { h: 0.56, dome: 0.3, blur: 3 }); g.pit(C(s * 36, -42, 5), 0.7, 2); }
  const face = 'M0 -50C26 -50 42 -32 42 -6C42 24 24 50 0 56C-24 50 -42 24 -42 -6C-42 -32 -26 -50 0 -50Z';
  g.shape(face, { h: 0.58, dome: 0.38, blur: 12 });
  g.hatch(face, { angle: 90, gap: 4, w: 0.45, depth: 0.88, wave: 0.6 });
  for (const s of [-1, 1]) {
    g.groove(`M${s * 28} -10Q${s * 18} -20 ${s * 6} -12Q${s * 16} -6 ${s * 28} -10Z`, 1.2, 0.62);
    g.pit(C(s * 16, -12, 2.6), 0.5);
    g.groove(`M${s * 32} -22Q${s * 18} -30 ${s * 6} -22`, 1.4, 0.64);
    g.shape(E(s * 11, 32, 13, 10), { h: 0.64, dome: 0.3, blur: 3 });
    for (let k = 0; k < 3; k++) g.pit(C(s * (8 + k * 5), 30 + (k % 2) * 4, 1.2), 0.6);
  }
  g.ridge('M0 -2L0 14', 4, 0.64);
  g.shape('M-11 14L11 14L0 26Z', { h: 0.72, dome: 0.2, blur: 2 });
  g.groove('M0 26L0 36M-10 46Q0 52 10 46', 1.2, 0.62);
};

M.burg = (g) => {
  g.shape('M-96 80C-60 58 60 58 96 80L96 100L-96 100Z', { h: 0.44, dome: 0.1 });
  g.hatch('M-96 64L96 64L96 100L-96 100Z', { angle: 8, gap: 5, w: 0.6, depth: 0.82, wave: 1 });
  const walls = 'M-46 14L-34 14L-34 72L-46 72Z M34 14L46 14L46 72L34 72Z';
  g.shape(walls, { h: 0.5, dome: 0.1 });
  for (const s of [-1, 1]) {
    const tw = `M${s * 46} 72L${s * 46} -10L${s * 72} -10L${s * 72} 72Z`;
    g.shape(tw, { h: 0.54, dome: 0.18, blur: 6 });
    g.bricks(tw, { bw: 10, bh: 7 });
    g.shape(`M${s * 42} -10L${s * 59} -56L${s * 76} -10Z`, { h: 0.6, dome: 0.2, blur: 4 });
    g.hatch(`M${s * 42} -10L${s * 59} -56L${s * 76} -10Z`, { angle: 0, gap: 5, w: 0.7, depth: 0.76 });
    g.pit(`M${s * 55} 20L${s * 55} 8C${s * 55} 2 ${s * 63} 2 ${s * 63} 8L${s * 63} 20Z`, 0.5);
  }
  g.ridge('M-59 -56L-59 -76', 1.8, 0.6);
  g.shape('M-59 -77L-42 -71L-59 -65Z', { h: 0.62, dome: 0.1 });
  const keep = 'M-34 72L-34 -48L-24 -48L-24 -40L-14 -40L-14 -48L-4 -48L-4 -40L4 -40L4 -48L14 -48L14 -40L24 -40L24 -48L34 -48L34 72Z';
  g.shape(keep, { h: 0.58, dome: 0.2, blur: 6 });
  g.bricks(keep, { bw: 12, bh: 8 });
  const tower = R(-13, -78, 26, 34);
  g.shape(tower, { h: 0.62, dome: 0.2, blur: 4 });
  g.bricks(tower, { bw: 9, bh: 7 });
  g.shape('M-17 -78L0 -98L17 -78Z', { h: 0.66, dome: 0.2, blur: 3 });
  g.pit('M-4 -56L-4 -64C-4 -68 4 -68 4 -64L4 -56Z', 0.5);
  const gate = 'M-14 72L-14 44C-14 28 14 28 14 44L14 72Z';
  g.pit(gate, 0.55, 1);
  g.hatch(gate, { angle: 90, gap: 5, w: 1, depth: 0.8 });
  g.hatch(gate, { angle: 0, gap: 7, w: 1, depth: 0.8 });
  for (const x of [-24, 18]) g.pit(`M${x} 0L${x} -12C${x} -16 ${x + 6} -16 ${x + 6} -12L${x + 6} 0Z`, 0.5);
};

M.schluessel = (g) => {
  g.at(0, 4, -38, () => {
    const bow = C(-14, -62, 15) + C(14, -62, 15) + C(0, -76, 15) + C(0, -48, 15);
    g.shape(bow, { h: 0.58, dome: 0.38, blur: 6 });
    g.groove(C(0, -62, 22), 1, 0.7);
    g.shape(C(0, -62, 9), { h: 0.64, dome: 0.3, blur: 2 });
    g.cut(C(0, -62, 4.5));
    for (const [x, y] of [[-18, -62], [18, -62], [0, -80], [0, -44]]) g.pit(C(x, y, 4), 0.55);
    const shaft = R(-6, -36, 12, 104, 3);
    g.shape(shaft, { h: 0.6, dome: 0.3, blur: 3 });
    for (const y of [-32, -26, 8]) g.ridge(`M-9 ${y}L9 ${y}`, 3.5, 0.66);
    g.groove('M0 -20L0 60', 1, 0.74);
    const bit = P([[6, 38], [32, 38], [32, 46], [24, 46], [24, 54], [32, 54], [32, 68], [6, 68]]);
    g.shape(bit, { h: 0.58, dome: 0.15, blur: 2 });
    g.groove('M10 44L20 44M10 60L28 60', 0.8, 0.75);
  });
  g.ridge('M-80 50C-60 70 -30 80 -10 72C10 64 24 76 40 86', 3, 0.5);
  g.shape(STAR(54, -64, 8, 4, 0.3) + STAR(70, -40, 5, 4, 0.3), { h: 0.64, dome: 0.1 });
};

M.adler = (g) => {
  for (const s of [-1, 1]) g.at(s * 14, -18, 0, () => wing(g, { n: 7, a0: 8, a1: 100, l0: 80, l1: 46, w: 10 }), s, 1);
  for (let i = 0; i < 5; i++) g.at(0, 30, 160 + i * 10, () => feather(g, 44, 9, { h: 0.54 }));
  const body = E(0, 6, 20, 36);
  g.shape(body, { h: 0.6, dome: 0.38, blur: 8 });
  g.scales(body, { r: 4.5, w: 0.8, depth: 0.74 });
  for (const s of [-1, 1]) for (const dx of [-5, 0, 5]) g.ridge(`M${s * 12 + dx} 36L${s * 14 + dx * 1.6} 50`, 2.6, 0.62);
  g.shape(C(0, -42, 14), { h: 0.64, dome: 0.35, blur: 4 });
  g.hatch(C(0, -42, 14), { angle: 120, gap: 3, w: 0.5, depth: 0.84 });
  g.shape('M8 -46C20 -48 28 -42 24 -30C20 -34 16 -36 8 -36Z', { h: 0.7, dome: 0.15, blur: 2 });
  g.pit(C(2, -46, 2.4), 0.5);
  g.groove('M-4 -50Q2 -54 8 -50', 0.9, 0.66);
};

M.pizza = (g) => {
  const slice = 'M0 88L-58 -54C-22 -70 22 -70 58 -54Z';
  g.shape(slice, { h: 0.52, dome: 0.2, blur: 10 });
  g.stipple(slice, { n: 90, r: 1.3, depth: 0.8 });
  for (const [x, y, l] of [[-28, 22, 10], [20, 44, 14], [-6, 70, 8]]) {
    g.shape(`M${x - 5} ${y}C${x - 6} ${y + l} ${x + 6} ${y + l} ${x + 5} ${y}Z`, { h: 0.56, dome: 0.3, blur: 3 });
  }
  const crust = 'M-62 -52C-22 -74 22 -74 62 -52L54 -36C20 -52 -20 -52 -54 -36Z';
  g.shape(crust, { h: 0.62, dome: 0.4, blur: 6 });
  g.stipple(crust, { n: 60, r: 1, depth: 0.76 });
  for (const [x, y, r] of [[-20, -22, 13], [20, -14, 12], [0, 18, 11], [-6, 48, 8], [24, 22, 6]]) {
    g.shape(C(x, y, r), { h: 0.62, dome: 0.3, blur: 3 });
    g.groove(C(x, y, r - 2.5), 0.7, 0.82);
    for (let k = 0; k < 4; k++) g.pit(C(x + Math.cos(k * 1.7) * r * 0.45, y + Math.sin(k * 1.7) * r * 0.45, 1.2), 0.6);
  }
  g.ridge(C(-24, 8, 4) + C(10, 64 - 30, 3.5), 2, 0.6);
  g.at(-30, -40, 30, () => { g.shape(LEAF(14, 6), { h: 0.62, dome: 0.3, blur: 1 }); g.groove('M0 -2L0 -12', 0.7); });
};

M.sonnenblume = (g) => {
  for (let i = 0; i < 22; i++) g.at(0, 0, i * (360 / 22), () => g.at(0, -26, 0, () => {
    g.shape(LEAF(58, 12), { h: 0.52, dome: 0.3, blur: 4 });
    g.groove('M0 -4L0 -50', 0.9, 0.72);
  }));
  for (let i = 0; i < 22; i++) g.at(0, 0, i * (360 / 22) + 8.2, () => g.at(0, -26, 0, () => {
    g.shape(LEAF(46, 10), { h: 0.58, dome: 0.3, blur: 4 });
    g.groove('M0 -4L0 -40', 0.9, 0.72);
  }));
  g.shape(C(0, 0, 33), { h: 0.62, dome: 0.32, blur: 8 });
  let seeds = '';
  for (let i = 1; i < 150; i++) {
    const r = 2.55 * Math.sqrt(i), a = i * 2.39996;
    seeds += C(Math.cos(a) * r, Math.sin(a) * r, 1.35);
  }
  g.pit(seeds, 0.6, 0.4);
  g.ridge(C(0, 0, 33), 2, 0.66);
};

// Episch
M.drache = (g) => {
  const head = 'M-78 92C-70 52 -62 22 -44 -2C-34 -22 -12 -36 10 -38L58 -30C74 -27 86 -20 90 -10L72 -4L84 6C72 14 50 14 30 10C18 22 10 32 -4 42C-18 56 -24 74 -20 92Z';
  for (let i = 0; i < 8; i++) {
    const t = i / 7, x = -74 + t * 38 + (t * t) * 20, y = 84 - t * 92;
    g.shape(P([[x - 4, y + 6], [x - 18, y - 4], [x + 4, y - 6]]), { h: 0.56, dome: 0.15 });
  }
  g.shape('M-14 -36C-36 -64 -58 -76 -80 -80C-60 -62 -48 -46 -38 -24Z', { h: 0.58, dome: 0.3, blur: 4 });
  g.shape('M4 -38C-6 -66 -22 -84 -40 -94C-28 -72 -22 -54 -18 -34Z', { h: 0.6, dome: 0.3, blur: 4 });
  g.groove('M-30 -40C-44 -56 -58 -66 -72 -74M-14 -46C-20 -62 -28 -76 -36 -86', 0.8, 0.72);
  g.shape(head, { h: 0.56, dome: 0.38, blur: 12 });
  g.scales('M-80 100L-80 0L20 10L20 100Z', { r: 5.5, w: 0.9, depth: 0.74 });
  g.scales(head, { r: 3.4, w: 0.6, depth: 0.86 });
  g.groove('M30 10C40 6 56 2 72 -4', 1.6, 0.58);
  for (let i = 0; i < 5; i++) g.shape(P([[40 + i * 8, 8], [44 + i * 8, 15], [48 + i * 8, 7]]), { h: 0.66, dome: 0 });
  g.shape('M4 -26C14 -34 30 -32 34 -24C26 -18 12 -18 4 -26Z', { h: 0.68, dome: 0.25, blur: 2 });
  g.pit(E(20, -25, 2, 5), 0.42);
  g.groove('M0 -32C14 -44 30 -40 40 -32', 1.6, 0.6);
  g.pit(E(80, -18, 3.5, 2), 0.5);
  g.ridge('M88 -12C98 -20 100 -34 94 -44', 1.6, 0.56);
};

M.orakel = (g) => {
  const base = 'M-44 50C-30 62 30 62 44 50L56 80L-56 80Z';
  g.shape(base, { h: 0.52, dome: 0.2, blur: 6 });
  g.shape(R(-62, 78, 124, 12, 4), { h: 0.56, dome: 0.15 });
  g.groove('M-50 66L50 66', 1, 0.7);
  for (let i = 0; i < 7; i++) g.pit(C(-36 + i * 12, 72, 2), 0.6);
  const orb = C(0, -12, 60);
  g.shape(orb, { h: 0.54, dome: 0.48, blur: 22 });
  g.groove(spiral(0, -12, 4, 50, 1.6, 0), 1.4, 0.72, orb);
  g.groove(spiral(0, -12, 4, 46, 1.4, 180), 1.4, 0.72, orb);
  g.groove('M-56 -4C-30 -20 0 0 30 -12S56 -20 60 -16', 1, 0.78, orb);
  for (const [x, y, r] of [[-20, -38, 6], [26, -40, 4], [18, 14, 5], [-30, 10, 3.5], [0, -56, 3]]) g.shape(STAR(x, y, r, 4, 0.3), { h: 0.86, dome: 0.1, clip: orb });
  g.bump(E(-24, -42, 14, 9), 0.22, 4);
  for (const s of [-1, 1]) {
    g.ridge(`M${s * 40} 56C${s * 60} 40 ${s * 64} 14 ${s * 56} -6`, 7, 0.6);
    g.ridge(`M${s * 56} -6L${s * 50} -16`, 4, 0.62);
  }
  g.ridge('M0 58L0 44', 7, 0.6);
};

M.donner = (g) => {
  const cloud = C(-44, -66, 22) + C(-14, -80, 28) + C(22, -76, 24) + C(50, -62, 18) + R(-66, -68, 132, 22, 11);
  g.shape(cloud, { h: 0.48, dome: 0.36, blur: 10 });
  g.groove('M-56 -54C-48 -68 -32 -68 -26 -58M-8 -60C0 -78 20 -78 28 -64M30 -52C38 -62 52 -60 56 -52', 1, 0.7);
  for (const [x, y] of [[-70, -20], [-60, 10], [-78, 30], [60, -24], [72, 4], [56, 34], [80, 50], [-56, 52]]) g.ridge(`M${x} ${y}L${x - 5} ${y + 12}`, 2, 0.5);
  const bolt = 'M14 -96L-46 6L-6 6L-26 96L52 -16L10 -16L36 -96Z';
  g.shape(bolt, { h: 0.66, dome: 0.12, blur: 3 });
  g.groove('M16 -84L-32 0L2 0L-14 70L40 -10L2 -10L26 -84Z', 1, 0.7);
  g.bump('M14 -96L-46 6L-6 6L-26 96Z', 0.12, 2);
  g.shape(STAR(-34, 82, 8, 4, 0.3) + STAR(-14, 92, 5, 4, 0.3), { h: 0.7, dome: 0.1 });
};

M.einhorn = (g) => {
  const head = 'M40 90C30 56 32 32 30 12C20 2 -10 12 -40 26C-58 34 -70 26 -68 12C-66 0 -50 -12 -30 -26C-16 -40 -6 -54 8 -60L18 -70L28 -58C46 -50 56 -30 60 0C66 30 70 60 74 90Z';
  for (let i = 0; i < 6; i++) {
    const t = i / 5;
    g.at(34 + t * 34, -54 + t * 110, -20 + t * 20, () => {
      g.shape('M0 0C18 8 28 24 22 46C14 32 6 18 -6 12Z', { h: 0.52, dome: 0.3, blur: 4 });
      g.groove('M2 6C12 14 18 24 18 36', 0.8, 0.72);
    });
  }
  g.shape('M18 -62L28 -88L36 -56Z', { h: 0.56, dome: 0.2 });
  g.shape(head, { h: 0.58, dome: 0.4, blur: 12 });
  g.groove('M-40 22C-20 30 0 30 22 18', 1.2, 0.68);
  g.groove('M30 12C34 30 34 50 40 88', 1, 0.74);
  g.shape('M-6 -32C2 -38 12 -36 16 -30C10 -26 0 -26 -6 -32Z', { h: 0.66, dome: 0.2, blur: 2 });
  g.pit(C(5, -31, 2.4), 0.45);
  g.pit(E(-58, 10, 4, 3), 0.55);
  g.groove('M-66 18Q-58 22 -50 20', 1, 0.7);
  const horn = 'M-2 -52L-34 -100L12 -60Z';
  g.shape(horn, { h: 0.68, dome: 0.25, blur: 3 });
  g.hatch(horn, { angle: -10, gap: 5, w: 1, depth: 0.66 });
  g.shape(STAR(-60, -70, 6, 4, 0.3) + STAR(-74, -44, 4, 4, 0.3) + STAR(-46, -88, 4, 4, 0.3), { h: 0.66, dome: 0.1 });
};

M.zauberer = (g) => {
  const beard = 'M-36 2C-40 42 -20 82 0 98C20 82 40 42 36 2Z';
  g.shape(beard, { h: 0.54, dome: 0.35, blur: 10 });
  for (let x = -28; x <= 28; x += 7) g.groove(`M${x} 14Q${x + 5} 34 ${x * 0.9} 52T${x * 0.6} ${86 - Math.abs(x) * 0.8}`, 0.9, 0.7, beard);
  const face = R(-28, -14, 56, 28, 12);
  g.shape(face, { h: 0.6, dome: 0.3, blur: 5 });
  for (const s of [-1, 1]) { g.groove(`M${s * 20} -2Q${s * 13} -7 ${s * 6} -2`, 1.4, 0.6); g.ridge(`M${s * 22} -8Q${s * 13} -13 ${s * 4} -8`, 3, 0.66); }
  g.shape(E(0, 4, 5, 8), { h: 0.68, dome: 0.3, blur: 2 });
  g.shape('M0 10C-10 6 -26 10 -36 22C-22 18 -10 20 0 16C10 20 22 18 36 22C26 10 10 6 0 10Z', { h: 0.68, dome: 0.25, blur: 2 });
  g.groove('M-4 13C-14 12 -24 16 -30 20M4 13C14 12 24 16 30 20', 0.7, 0.74);
  const cone = 'M-40 -20C-32 -50 -8 -74 26 -96C20 -76 26 -48 40 -20Z';
  g.shape(cone, { h: 0.56, dome: 0.35, blur: 8 });
  g.groove('M-26 -40C-10 -46 10 -46 32 -40', 0.8, 0.8);
  g.shape(STAR(4, -54, 8) + STAR(-16, -32, 4.5) + STAR(18, -72, 4), { h: 0.68, dome: 0.15, blur: 1 });
  g.ridge('M-40 -24C-10 -30 10 -30 40 -24', 6, 0.62);
  g.shape(E(0, -16, 72, 11), { h: 0.6, dome: 0.3, blur: 5 });
  g.groove(E(0, -16, 62, 6), 0.8, 0.78);
};

M.krake = (g) => {
  for (let k = 0; k < 8; k++) {
    const a0 = ((8 + k * (164 / 7)) * Math.PI) / 180, dir = Math.cos(a0) >= 0 ? 1 : -1;
    const pts = [];
    let x = Math.cos(a0) * 26, y = -6 + Math.sin(a0) * 8, a = a0;
    const n = k === 3 || k === 4 ? 30 : 38;
    for (let i = 0; i < n; i++) {
      pts.push([x, y]);
      const tt = i / (n - 1);
      a -= dir * (0.01 + tt * tt * 0.16) * (k === 3 || k === 4 ? -1 : 1);
      x += Math.cos(a) * 2.3; y += Math.sin(a) * 2.3;
    }
    g.shape(tube(pts, 14, 4), { h: 0.54 + (k % 2) * 0.02, dome: 0.25, blur: 4 });
    let cups = '';
    for (let i = 4; i < n - 3; i += 3) {
      const [px, py] = pts[i], [qx, qy] = pts[i + 1];
      const l = Math.hypot(qx - px, qy - py) || 1, nx = -(qy - py) / l * dir, ny = (qx - px) / l * dir;
      cups += C(px + nx * 3, py + ny * 3, 2.1 - i * 0.035);
    }
    g.pit(cups, 0.6, 0.5);
  }
  const head = 'M-40 -6C-46 -60 -22 -88 0 -88C22 -88 46 -60 40 -6C30 10 -30 10 -40 -6Z';
  g.shape(head, { h: 0.58, dome: 0.42, blur: 14 });
  g.stipple(head, { n: 30, r: 2.4, depth: 0.8 });
  for (const s of [-1, 1]) {
    g.shape(E(s * 16, -18, 9, 10), { h: 0.66, dome: 0.3, blur: 2 });
    g.pit(E(s * 16, -18, 6, 2.4), 0.45);
  }
  g.groove('M-10 -2Q0 4 10 -2', 1.2, 0.66);
};

// Legendär
M.phoenix = (g) => {
  for (const [p1, p2, p3] of [[[-10, 60], [-40, 70], [-48, 94]], [[4, 64], [24, 76], [18, 98]], [[14, 56], [50, 64], [62, 86]]]) {
    g.ridge(`M0 30C${p1[0]} ${p1[1]} ${p2[0]} ${p2[1]} ${p3[0]} ${p3[1]}`, 7, 0.54);
    g.groove(`M0 32C${p1[0]} ${p1[1]} ${p2[0]} ${p2[1]} ${p3[0]} ${p3[1]}`, 1, 0.7);
  }
  for (const s of [-1, 1]) g.at(s * 8, -8, 0, () => wing(g, { n: 8, a0: 4, a1: 72, l0: 82, l1: 50, w: 10, shape: (l, w) => FLAME(l, w, 1.2) }), s, 1);
  for (let i = -2; i <= 2; i++) g.at(0, 28, 180 + i * 18, () => g.shape(FLAME(34, 8, i * 0.5), { h: 0.58, dome: 0.3, blur: 3 }));
  const body = 'M0 -38C14 -32 16 0 10 30C4 40 -4 40 -10 30C-16 0 -14 -32 0 -38Z';
  g.shape(body, { h: 0.62, dome: 0.35, blur: 5 });
  g.scales(body, { r: 3.6, w: 0.7, depth: 0.76 });
  g.ridge('M-4 -56Q-16 -76 -8 -90M0 -58Q-4 -78 6 -92M4 -56Q12 -72 22 -78', 3, 0.6);
  g.shape(C(0, -48, 11), { h: 0.66, dome: 0.3, blur: 3 });
  g.shape('M8 -51L24 -46L8 -41Z', { h: 0.72, dome: 0.1 });
  g.pit(C(2, -50, 2.2), 0.45);
};

M.klinge = (g) => {
  const shield = 'M-48 -54L48 -54L48 -2C48 36 20 58 0 72C-20 58 -48 36 -48 -2Z';
  g.shape(shield, { h: 0.52, dome: 0.22, blur: 10 });
  g.groove('M-42 -48L42 -48L42 -2C42 32 18 52 0 64C-18 52 -42 32 -42 -2Z', 1.2, 0.66);
  g.hatch('M0 -48L42 -48L42 8L0 8Z', { angle: 90, gap: 4, w: 0.6, depth: 0.8 });
  g.hatch('M-42 8L0 8L0 70L-42 70Z', { angle: 90, gap: 4, w: 0.6, depth: 0.8 });
  g.groove('M0 -48L0 64M-46 8L46 8', 1.2, 0.66);
  for (const s of [-1, 1]) g.at(0, 4, s * 42, () => sword(g, 92));
  g.shape(C(0, 8, 10), { h: 0.68, dome: 0.4, blur: 3 });
  g.groove(C(0, 8, 6), 0.8, 0.72);
};

M.rex = (g) => {
  for (const s of [-1, 1]) g.at(s * 70, 84, s * -8, () => {
    for (let i = 0; i < 5; i++) g.at(0, 0, -40 + i * 20, () => { g.shape(LEAF(26 - Math.abs(i - 2) * 4, 5), { h: 0.5, dome: 0.2, blur: 1.5 }); g.groove('M0 -2L0 -18', 0.6, 0.78); });
  });
  const rex = 'M-94 30C-62 20 -42 10 -22 0C-12 -30 8 -45 28 -50C44 -62 70 -62 86 -50L88 -38L70 -36L86 -28C80 -18 62 -18 46 -20C36 -6 30 10 26 20C20 40 24 56 30 70L40 80L18 80L8 50C0 46 -10 46 -20 50L-14 74L-4 82L-28 82L-36 50C-56 44 -76 40 -94 30Z';
  g.shape(rex, { h: 0.56, dome: 0.38, blur: 12 });
  g.stipple(rex, { n: 160, r: 1.1, depth: 0.78 });
  for (let i = 0; i < 8; i++) g.groove(`M${-20 + i * 4} ${-6 - i * 4}l4 6`, 1, 0.66);
  g.ridge('M30 -4L40 6L46 4M32 4L40 12', 2.6, 0.6);
  g.groove('M70 -36L50 -34', 1.4, 0.6);
  for (let i = 0; i < 5; i++) g.shape(P([[52 + i * 6, -36], [55 + i * 6, -31], [58 + i * 6, -36]]), { h: 0.66, dome: 0 });
  g.shape(E(52, -48, 5, 4), { h: 0.66, dome: 0.2 });
  g.pit(C(53, -48, 2), 0.45);
  g.groove('M42 -54Q52 -60 62 -54', 1.2, 0.62);
  g.pit(C(82, -50, 1.8), 0.55);
  g.groove('M6 50C10 36 14 20 20 8M-26 50C-24 40 -20 32 -14 26', 1, 0.7);
};

M.vulkan = (g) => {
  const plume = C(0, -54, 16) + C(-20, -68, 18) + C(18, -72, 20) + C(-4, -88, 15) + C(32, -88, 11) + C(-34, -86, 10);
  g.shape(plume, { h: 0.5, dome: 0.4, blur: 8 });
  g.groove('M-30 -66C-24 -78 -10 -78 -6 -68M8 -70C14 -84 30 -84 32 -72M-12 -90C-6 -98 4 -98 6 -90', 1, 0.7);
  for (const [x, y, tx, ty] of [[-56, -58, -30, -30], [60, -52, 34, -30], [-70, -24, -40, -20], [74, -14, 44, -18]]) {
    g.ridge(`M${tx} ${ty}Q${(x + tx) / 2} ${y - 6} ${x} ${y}`, 1.4, 0.5);
    g.shape(C(x, y, 5), { h: 0.62, dome: 0.3, blur: 1 });
  }
  const mtn = 'M-96 82L-40 -22C-34 -30 -24 -32 -18 -26C-8 -32 8 -32 18 -26C24 -32 34 -30 40 -22L96 82Z';
  g.shape(mtn, { h: 0.54, dome: 0.26, blur: 12 });
  g.hatch(mtn, { angle: 62, gap: 7, w: 0.8, depth: 0.78, wave: 2 });
  g.hatch(mtn, { angle: -62, gap: 11, w: 0.6, depth: 0.84, wave: 2 });
  g.groove(E(0, -26, 20, 4.5), 1.6, 0.55);
  for (const d of ['M-6 -22C-14 0 -4 20 -18 46S-24 70 -34 82', 'M8 -22C12 -2 4 12 14 34S24 62 36 82', 'M-24 -16C-30 0 -44 14 -52 40']) g.ridge(d, 5, 0.7);
};

M.pokal = (g) => {
  for (const s of [-1, 1]) g.at(0, 0, 0, () => {
    g.ridge('M44 -60C74 -60 76 -18 30 -12', 6, 0.6);
    g.groove('M44 -60C74 -60 76 -18 30 -12', 1, 0.72);
    for (let i = 0; i < 6; i++) {
      const t = i / 5;
      g.at(30 + t * 26, 70 - t * 54, 20 + t * 15, () => { g.shape(LEAF(15, 5), { h: 0.55, dome: 0.25, blur: 1.5 }); g.groove('M0 -2L0 -12', 0.6, 0.75); });
    }
  }, s, 1);
  const cup = 'M-46 -72L46 -72C46 -22 30 0 8 10L8 34C8 40 26 45 30 56L-30 56C-26 45 -8 40 -8 34L-8 10C-30 0 -46 -22 -46 -72Z';
  g.shape(cup, { h: 0.58, dome: 0.4, blur: 14 });
  g.ridge('M-48 -72L48 -72', 5, 0.66);
  g.ridge('M-42 -50C-14 -44 14 -44 42 -50', 2.4, 0.64);
  g.shape(STAR(0, -26, 16, 5, 0.42), { h: 0.68, dome: 0.2, blur: 2 });
  g.groove(STAR(0, -26, 10, 5, 0.42), 0.8, 0.75);
  g.shape(E(0, 22, 11, 5), { h: 0.64, dome: 0.3, blur: 2 });
  g.shape(R(-36, 56, 72, 12, 2), { h: 0.62, dome: 0.2 });
  const plinth = R(-44, 68, 88, 16, 2);
  g.shape(plinth, { h: 0.58, dome: 0.15 });
  g.groove(R(-30, 72, 60, 8, 1), 0.8, 0.72);
};

// Mystisch
M.auge = (g) => {
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * TAU - Math.PI / 2;
    const r0 = 64, r1 = i % 2 ? 84 : 96;
    g.ridge(`M${f(Math.cos(a) * r0)} ${f(8 + Math.sin(a) * r0)}L${f(Math.cos(a) * r1)} ${f(8 + Math.sin(a) * r1)}`, i % 2 ? 2 : 3.2, 0.52);
  }
  const tri = 'M0 -82L80 58L-80 58Z';
  g.shape(tri, { h: 0.5, dome: 0.15, blur: 10 });
  g.ridge(tri, 4, 0.62);
  g.groove('M0 -66L66 50L-66 50Z', 0.8, 0.76);
  const eye = 'M-54 12C-28 -22 28 -22 54 12C28 44 -28 44 -54 12Z';
  g.shape(eye, { h: 0.58, dome: 0.3, blur: 6 });
  for (let i = 0; i < 9; i++) {
    const t = i / 8, x = -40 + t * 80, y = -6 - Math.sin(t * Math.PI) * 8;
    g.ridge(`M${f(x)} ${f(y)}L${f(x + (t - 0.5) * 10)} ${f(y - 9)}`, 1.6, 0.6);
  }
  g.shape(C(0, 12, 22), { h: 0.64, dome: 0.3, blur: 4 });
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * TAU;
    g.groove(`M${f(Math.cos(a) * 10)} ${f(12 + Math.sin(a) * 10)}L${f(Math.cos(a) * 20)} ${f(12 + Math.sin(a) * 20)}`, 0.7, 0.76);
  }
  g.pit(C(0, 12, 8), 0.42, 1);
  g.bump(C(-6, 6, 3), 0.4, 1);
};

M.portal = (g) => {
  for (let k = 0; k < 6; k++) {
    const pts = [];
    for (let i = 0; i <= 70; i++) {
      const t = i / 70, a = (k / 6) * TAU + t * 2.3 * Math.PI, r = 12 + t * 70;
      pts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
    g.shape(tube(pts, 4, 12), { h: 0.52 + k * 0.006, dome: 0.3, blur: 4 });
    g.groove(L(pts.slice(6)), 0.9, 0.72);
  }
  let dust = '';
  const rnd = seeded(91);
  for (let i = 0; i < 40; i++) {
    const a = rnd() * TAU, r = 20 + rnd() * 76;
    dust += C(Math.cos(a) * r, Math.sin(a) * r, 0.8 + rnd() * 1.4);
  }
  g.shape(dust, { h: 0.62, dome: 0 });
  g.shape(C(0, 0, 16), { h: 0.6, dome: 0.2 });
  g.pit(C(0, 0, 12), 0.35, 4);
};

M.schaedel = (g) => {
  for (const s of [-1, 1]) g.at(0, 30, s * 38, () => {
    g.shape(R(-82, -6, 164, 12, 6), { h: 0.5, dome: 0.2, blur: 3 });
    g.shape(C(-84, -6, 8) + C(-84, 6, 8) + C(84, -6, 8) + C(84, 6, 8), { h: 0.54, dome: 0.3, blur: 3 });
  });
  const skull = 'M-48 8C-56 -42 -30 -78 0 -78C30 -78 56 -42 48 8C46 22 36 28 30 34L30 52L-30 52L-30 34C-36 28 -46 22 -48 8Z';
  g.shape(skull, { h: 0.58, dome: 0.42, blur: 14 });
  for (const s of [-1, 1]) {
    g.pit(E(s * 20, -10, 14, 15), 0.42, 3);
    g.groove(E(s * 20, -10, 15, 16), 1, 0.7);
    g.bump(E(s * 32, 14, 9, 6), 0.15, 3);
  }
  g.pit('M0 8L-7 22L7 22Z', 0.45, 1);
  g.groove('M-26 38L26 38', 1, 0.6);
  for (let x = -21; x <= 21; x += 7) g.groove(`M${x} 32L${x} 52`, 1, 0.62);
  g.groove('M10 -76L4 -62L12 -52L6 -40', 1.2, 0.58);
  g.groove('M-36 -50Q-20 -58 -8 -54', 0.8, 0.8);
};

M.schattenmond = (g) => {
  const moon = C(0, -4, 72);
  g.shape(moon, { h: 0.54, dome: 0.4, blur: 18 });
  g.pit(C(30, -18, 64), 0.72, 10, moon);
  for (const [x, y, r] of [[-30, -30, 12], [-44, 18, 8], [6, 30, 14], [30, -40, 7], [-10, -52, 6], [44, 10, 9], [-20, 50, 5]]) {
    g.ridge(C(x, y, r), 2, 0.62, { clip: moon });
    g.pit(C(x, y, r * 0.75), 0.7, 2);
  }
  g.stipple(moon, { n: 70, r: 1 });
  for (const d of ['M-96 52C-70 42 -50 58 -24 50S20 44 40 54', 'M-10 74C14 64 40 76 70 64S94 60 100 62']) g.ridge(d, 5, 0.6);
  const bat = 'M0 0C-4 -4 -10 -6 -18 -2C-13 -2 -10 2 -12 5C-8 2 -4 4 0 7C4 4 8 2 12 5C10 2 13 -2 18 -2C10 -6 4 -4 0 0Z';
  g.at(66, -72, -10, () => g.shape(bat, { h: 0.62, dome: 0.1 }), 1.3);
  g.at(84, -50, 12, () => g.shape(bat, { h: 0.62, dome: 0.1 }), 0.9);
};

// Engelsgleich
M.taube = (g) => {
  g.ridge('M-72 -12C-84 -2 -90 12 -92 26', 2, 0.56);
  for (const [x, y, r] of [[-78, -6, -50], [-86, 6, 60], [-88, 18, -40], [-82, 2, 120]]) g.at(x, y, r, () => { g.shape(LEAF(16, 5), { h: 0.6, dome: 0.2, blur: 1 }); g.groove('M0 -2L0 -12', 0.6, 0.78); });
  g.shape(E(-91, 24, 4, 5), { h: 0.64, dome: 0.3 });
  const body = 'M-50 -6C-30 -26 10 -22 34 -4C50 6 70 8 90 2C80 18 62 24 42 22C14 30 -20 26 -40 12C-46 8 -50 2 -50 -6Z';
  g.shape(body, { h: 0.56, dome: 0.38, blur: 10 });
  for (let i = 0; i < 5; i++) g.groove(`M${50 + i * 2} ${10 + i * 2}L${88 - i} ${4 + i * 3}`, 0.8, 0.72);
  g.shape(C(-48, -16, 14), { h: 0.6, dome: 0.38, blur: 4 });
  g.shape('M-60 -18L-75 -13L-60 -9Z', { h: 0.68, dome: 0.1 });
  g.pit(C(-50, -19, 2.2), 0.45);
  g.at(-4, -10, 0, () => wing(g, { n: 7, a0: 10, a1: 70, l0: 86, l1: 56, w: 11, h: 0.58 }));
  g.at(4, 16, 0, () => wing(g, { n: 4, a0: 100, a1: 130, l0: 44, l1: 34, w: 8, coverts: false, h: 0.5 }));
};

M.heiligenschein = (g) => {
  for (const s of [-1, 1]) g.at(s * 40, 10, 0, () => wing(g, { n: 5, a0: 40, a1: 110, l0: 52, l1: 34, w: 9, h: 0.5 }), s, 1);
  for (let i = 0; i < 16; i++) {
    const a = Math.PI + (i / 15) * Math.PI;
    g.groove(`M${f(Math.cos(a) * 56)} ${f(-68 + Math.sin(a) * 16)}L${f(Math.cos(a) * 66)} ${f(-68 + Math.sin(a) * 22)}`, 0.8, 0.8);
  }
  g.shape(E(0, -68, 48, 13), { h: 0.6, dome: 0.3, blur: 4 });
  g.cut(E(0, -68, 36, 7));
  const face = C(0, 14, 48);
  g.shape(face, { h: 0.56, dome: 0.46, blur: 16 });
  let curls = '';
  for (let i = 0; i < 9; i++) { const a = Math.PI * 1.08 + (i / 8) * Math.PI * 0.84; curls += C(Math.cos(a) * 44, 14 + Math.sin(a) * 44, 11); }
  g.shape(curls, { h: 0.6, dome: 0.3, blur: 4 });
  for (let i = 0; i < 9; i++) { const a = Math.PI * 1.08 + (i / 8) * Math.PI * 0.84; g.groove(spiral(Math.cos(a) * 44, 14 + Math.sin(a) * 44, 1, 8, 1.4, i * 40, 40), 1, 0.7); }
  for (const s of [-1, 1]) { g.groove(`M${s * 28} 8Q${s * 18} 16 ${s * 8} 8`, 1.6, 0.6); g.bump(E(s * 26, 26, 10, 7), 0.12, 4); }
  g.bump(E(0, 18, 5, 6), 0.1, 2);
  g.groove('M-16 34Q0 46 16 34', 1.6, 0.6);
};

M.seraph = (g) => {
  for (const s of [-1, 1]) {
    g.at(s * 8, 10, 0, () => wing(g, { n: 5, a0: 120, a1: 165, l0: 52, l1: 40, w: 9, coverts: false, h: 0.5 }), s, 1);
    g.at(s * 10, -10, 0, () => wing(g, { n: 5, a0: -5, a1: 40, l0: 70, l1: 56, w: 10, coverts: false, h: 0.53 }), s, 1);
    g.at(s * 12, 0, 0, () => wing(g, { n: 6, a0: 50, a1: 110, l0: 82, l1: 60, w: 10, h: 0.56 }), s, 1);
  }
  g.shape(C(0, 0, 22), { h: 0.62, dome: 0.3, blur: 5 });
  g.shape(STAR(0, 0, 20, 8, 0.5), { h: 0.68, dome: 0.2, blur: 2 });
  g.groove(C(0, 0, 8), 1, 0.7);
  g.pit(C(0, 0, 4), 0.55);
};

M.posaune = (g) => {
  for (let i = 0; i < 3; i++) g.ridge(`M${70 + i * 9} -66Q${84 + i * 10} -44 ${74 + i * 9} -20`, 2, 0.52);
  g.at(-4, 8, -26, () => {
    const banner = 'M-62 6C-40 10 -20 10 2 6L2 52L-12 44L-30 58L-48 44L-62 52Z';
    g.shape(banner, { h: 0.52, dome: 0.2, blur: 6 });
    g.hatch(banner, { angle: 90, gap: 6, w: 0.6, depth: 0.8, wave: 1 });
    g.shape(STAR(-30, 26, 10, 5, 0.45), { h: 0.6, dome: 0.2, blur: 1 });
    g.ridge('M-40 5C-40 28 10 28 10 5', 6, 0.58);
    g.shape(R(-86, -5, 118, 10, 4), { h: 0.6, dome: 0.3, blur: 2 });
    g.shape(P([[-96, -8], [-86, -4], [-86, 4], [-96, 8]]), { h: 0.62, dome: 0.1 });
    for (const x of [-26, -14, -2]) { g.shape(R(x, -22, 7, 18, 2), { h: 0.62, dome: 0.2 }); g.shape(R(x - 1, -26, 9, 4, 1.5), { h: 0.66, dome: 0.1 }); }
    const bell = 'M28 -9C46 -12 62 -28 82 -44C88 -20 88 20 82 44C62 28 46 12 28 9Z';
    g.shape(bell, { h: 0.6, dome: 0.4, blur: 8 });
    g.ridge('M82 -44C88 -20 88 20 82 44', 4, 0.68);
    g.groove('M40 -8C54 -12 66 -24 78 -34', 0.8, 0.78);
  });
};

// Göttlich
M.sonne = (g) => {
  for (let i = 0; i < 24; i++) g.at(0, 0, i * 15, () => {
    if (i % 2) g.shape('M-6 -50C-10 -62 4 -70 -2 -82C8 -72 -2 -64 6 -50Z', { h: 0.52, dome: 0.2, blur: 2 });
    else { g.shape('M-8 -50L0 -96L8 -50Z', { h: 0.54, dome: 0.15, blur: 2 }); g.groove('M0 -54L0 -88', 0.8, 0.72); }
  });
  g.ridge(C(0, 0, 51), 3, 0.62);
  const face = C(0, 0, 46);
  g.shape(face, { h: 0.58, dome: 0.44, blur: 14 });
  for (const s of [-1, 1]) {
    g.shape(`M${s * 26} -8Q${s * 16} -18 ${s * 6} -8Q${s * 16} -2 ${s * 26} -8Z`, { h: 0.66, dome: 0.2 });
    g.pit(C(s * 16, -8, 3), 0.5);
    g.groove(`M${s * 30} -20Q${s * 18} -28 ${s * 4} -20`, 1.4, 0.6);
    g.bump(E(s * 26, 14, 9, 6), 0.14, 3);
  }
  g.ridge('M0 -10L-4 12L4 12', 2.6, 0.66);
  g.shape('M-14 24Q0 20 14 24Q0 36 -14 24Z', { h: 0.66, dome: 0.2 });
  g.groove('M-14 24Q0 28 14 24', 0.8, 0.7);
};

M.dreizack = (g) => {
  for (let i = 0; i < 3; i++) g.ridge(`M-90 ${66 + i * 12}Q-75 ${56 + i * 12} -60 ${66 + i * 12}T-30 ${66 + i * 12}T0 ${66 + i * 12}T30 ${66 + i * 12}T60 ${66 + i * 12}T90 ${66 + i * 12}`, 2.6, 0.5);
  const shaft = R(-5, -30, 10, 124, 3);
  g.shape(shaft, { h: 0.58, dome: 0.25, blur: 2 });
  g.hatch(shaft, { angle: 30, gap: 4, w: 0.7, depth: 0.78 });
  const prongs = 'M-5 -30C-30 -30 -38 -46 -38 -76L-46 -70L-38 -98L-30 -70L-32 -72C-32 -50 -22 -42 -5 -42Z M5 -30C30 -30 38 -46 38 -76L46 -70L38 -98L30 -70L32 -72C32 -50 22 -42 5 -42Z M-6 -36L-6 -82L-12 -78L0 -102L12 -78L6 -82L6 -36Z';
  g.shape(prongs, { h: 0.64, dome: 0.15, blur: 2 });
  g.groove('M0 -40L0 -88M-34 -48C-34 -60 -36 -70 -38 -86M34 -48C34 -60 36 -70 38 -86', 0.8, 0.7);
  g.shape(R(-18, -36, 36, 10, 4), { h: 0.68, dome: 0.25, blur: 2 });
  g.shape(E(0, -18, 9, 6) + E(0, 4, 8, 5), { h: 0.66, dome: 0.3, blur: 2 });
  g.groove('M-16 -31L16 -31', 0.8, 0.72);
};

M.waage = (g) => {
  g.shape(R(-52, 80, 104, 10, 3), { h: 0.56, dome: 0.1 });
  g.shape('M-40 80L40 80L26 66L-26 66Z', { h: 0.58, dome: 0.2 });
  g.shape(R(-5, -64, 10, 132, 3), { h: 0.6, dome: 0.25, blur: 2 });
  for (const y of [-20, 30]) g.shape(E(0, y, 9, 4), { h: 0.64, dome: 0.3 });
  g.ridge('M-72 -56L72 -56', 6, 0.64);
  g.shape(C(0, -60, 9), { h: 0.68, dome: 0.35, blur: 2 });
  g.shape(STAR(0, -82, 10, 6, 0.45), { h: 0.7, dome: 0.15 });
  for (const s of [-1, 1]) {
    let ch = '';
    for (const ex of [-22, 22]) {
      for (let t = 0; t <= 1; t += 0.08) ch += C(s * 72 + ex * t, -56 + t * 64, 1.6);
    }
    g.shape(ch, { h: 0.6, dome: 0.15 });
    g.shape(C(s * 72, -56, 4), { h: 0.66, dome: 0.2 });
    const pan = `M${s * 72 - 26} 8C${s * 72 - 24} 32 ${s * 72 + 24} 32 ${s * 72 + 26} 8Z`;
    g.shape(pan, { h: 0.6, dome: 0.3, blur: 4 });
    g.groove(`M${s * 72 - 26} 10L${s * 72 + 26} 10`, 1, 0.66);
  }
};

// Galaktisch
M.saturn = (g) => {
  const ring = E(0, 0, 96, 24) + E(0, 0, 66, 15);
  g.at(0, 4, -16, () => {
    g.shape(ring, { h: 0.52, dome: 0.15, rule: 'evenodd' });
    g.groove(E(0, 0, 84, 20), 1, 0.7);
  });
  const planet = C(0, 4, 46);
  g.shape(planet, { h: 0.58, dome: 0.44, blur: 16 });
  g.at(0, 4, -16, () => {
    for (const y of [-26, -12, 2, 16, 30]) g.groove(`M-60 ${y}Q0 ${y + 8} 60 ${y}`, y % 2 ? 1.6 : 2.6, 0.68, C(0, 0, 46));
    g.shape(ring, { h: 0.6, dome: 0.15, rule: 'evenodd', clip: R(-120, 0, 240, 120) });
    g.groove(E(0, 0, 84, 20), 1, 0.7, R(-120, 0, 240, 120));
    g.groove(E(0, 0, 76, 18), 0.6, 0.78, R(-120, 0, 240, 120));
  });
  g.shape(C(-66, -54, 7) + C(72, 54, 5), { h: 0.6, dome: 0.4, blur: 2 });
  g.shape(STAR(54, -64, 7, 4, 0.28) + STAR(-74, 50, 6, 4, 0.28) + STAR(-30, -80, 4, 4, 0.3), { h: 0.66, dome: 0.1 });
};

M.milchstrasse = (g) => {
  const rnd = seeded(2024);
  let stars = '';
  for (let k = 0; k < 2; k++) {
    for (let i = 0; i < 120; i++) {
      const t = rnd(), a = k * Math.PI + t * 3.4 * Math.PI, r = 14 + t * 78;
      const j = (rnd() - 0.5) * (6 + t * 18);
      stars += C(Math.cos(a) * r + j * Math.sin(a), Math.sin(a) * r * 0.82 - j * Math.cos(a), (1 - t) * 3 + 1.8 + rnd() * 1.6);
    }
  }
  g.shape(stars, { h: 0.56, dome: 0.25, blur: 1.5 });
  for (let k = 0; k < 2; k++) {
    const pts = [];
    for (let i = 0; i <= 60; i++) { const t = i / 60, a = k * Math.PI + t * 3.4 * Math.PI, r = 14 + t * 78; pts.push([Math.cos(a) * r, Math.sin(a) * r * 0.82]); }
    g.ridge(L(pts), 5, 0.6);
    g.groove(L(pts), 1, 0.7);
  }
  g.shape(E(0, 0, 24, 18), { h: 0.6, dome: 0.5, blur: 10 });
  g.shape(STAR(58, -56, 9, 4, 0.22) + STAR(-64, 50, 7, 4, 0.22) + STAR(-48, -66, 5, 4, 0.25) + STAR(70, 40, 5, 4, 0.25), { h: 0.68, dome: 0.1 });
};

// Unerreichbar
M.sanduhr = (g) => {
  const glass = 'M-32 -72C-32 -30 -6 -14 -6 0C-6 14 -32 30 -32 72L32 72C32 30 6 14 6 0C6 -14 32 -30 32 -72Z';
  g.shape(glass, { h: 0.48, dome: 0.3, blur: 10 });
  const sandB = 'M-30 72C-26 50 -10 40 0 38C10 40 26 50 30 72Z';
  g.shape(sandB, { h: 0.58, dome: 0.2, blur: 4 });
  g.stipple(sandB, { n: 50, r: 0.9 });
  const sandT = 'M-26 -50C-16 -30 -6 -20 0 -8C6 -20 16 -30 26 -50Z';
  g.shape(sandT, { h: 0.56, dome: 0.2, blur: 4 });
  g.stipple(sandT, { n: 30, r: 0.9 });
  g.ridge('M0 -8L0 38', 1.4, 0.6);
  g.groove('M-22 -62C-22 -40 -10 -26 -8 -16', 1, 0.66);
  for (const s of [-1, 1]) {
    g.shape(R(s * 42 - 4, -72, 8, 144, 3), { h: 0.6, dome: 0.25 });
    for (const y of [-56, -30, 0, 30, 56]) g.shape(E(s * 42, y, 7, 4), { h: 0.66, dome: 0.3, blur: 1.5 });
  }
  for (const y of [-86, 72]) {
    g.shape(R(-54, y, 108, 14, 4), { h: 0.62, dome: 0.2, blur: 3 });
    g.groove(`M-48 ${y + 7}L48 ${y + 7}`, 0.8, 0.74);
  }
  g.ridge('M-14 -94C-24 -104 -24 -84 -14 -94C-6 -102 6 -86 14 -94C24 -104 24 -84 14 -94C6 -102 -6 -86 -14 -94Z', 2.4, 0.64);
};

M.kartoffel = (g) => {
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * TAU;
    g.ridge(`M${f(Math.cos(a) * 82)} ${f(14 + Math.sin(a) * 74)}L${f(Math.cos(a) * (i % 2 ? 92 : 100))} ${f(14 + Math.sin(a) * (i % 2 ? 82 : 88))}`, i % 2 ? 1.6 : 2.6, 0.5);
  }
  const rnd = seeded(5);
  const ph = [rnd() * TAU, rnd() * TAU, rnd() * TAU];
  const blob = polar(0, 16, 120, (a) => 56 + 6 * Math.sin(a * 2 + ph[0]) + 4 * Math.sin(a * 3 + ph[1]) + 2.5 * Math.sin(a * 5 + ph[2]), 1.28, 1);
  g.shape(blob, { h: 0.54, dome: 0.46, blur: 18 });
  g.stipple(blob, { n: 180, r: 1, depth: 0.8 });
  for (const [x, y, r] of [[-40, 4, 4], [-10, 36, 3.5], [30, 12, 4.5], [50, 40, 3], [-56, 38, 3], [12, -12, 3]]) {
    g.pit(E(x, y, r, r * 0.7), 0.55, 1);
    g.groove(`M${x - r * 1.6} ${y - r}Q${x} ${y - r * 2} ${x + r * 1.6} ${y - r}`, 0.9, 0.7);
  }
  g.at(0, -50, 0, () => crown(g), 0.42);
};

// Motive, die sonst zu nah an den Fadenkreis reichen: [Maßstab, dx, dy]
const SCALE = { krake: [0.92, 0, 8] };

export const EMBLEMS = Object.keys(M);

let seedCounter = 1;
// Zeichnet ein Motiv auf `size`×`size` Pixel in der Metallpalette [hell, mittel, dunkel].
export function renderEmblem(key, size, pal) {
  const fn = M[key] || M.pilz;
  const sc = SCALE[key];
  const draw = sc ? (g) => g.at(sc[1], sc[2], 0, () => fn(g), sc[0]) : fn;
  const g = new Relief(size, [...key].reduce((s, ch) => s * 31 + ch.charCodeAt(0), 7) || seedCounter++);
  draw(g);
  return g.finish(pal);
}
