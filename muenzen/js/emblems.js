// Prägemotive für alle 60 Münzen – als Relief gezeichnet statt aus Emojis umgefärbt.
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

// ── Die 60 Motive ──
const M = {};

// ═══ Normal ═══
M.glut = (g) => {
  // drei Flammenzungen über einem Glutstück
  const coal = 'M-46 52C-40 34 -14 28 0 30C18 28 42 34 48 52C30 66 -28 66 -46 52Z';
  g.shape(coal, { h: 0.5, dome: 0.3, blur: 8 });
  g.groove('M-30 50L-12 40L4 48L22 38L36 50', 1.4, 0.68);
  g.at(0, 34, 0, () => g.shape(FLAME(104, 34, 0.15), { h: 0.6, dome: 0.38, blur: 12 }));
  g.at(-24, 38, -16, () => g.shape(FLAME(70, 20, 0.6), { h: 0.56, dome: 0.3, blur: 8 }));
  g.at(26, 38, 18, () => g.shape(FLAME(64, 18, 0.2), { h: 0.56, dome: 0.3, blur: 8 }));
  g.at(0, 30, 0, () => g.bump(FLAME(56, 16, 0.2), 0.25, 6));
  g.groove('M0 26C6 0 10 -24 2 -54', 1.1, 0.72);
  for (const [x, y] of [[-48, -40], [44, -50], [-30, -64], [56, -14]]) g.shape(C(x, y, 3.4), { h: 0.6, dome: 0.3, blur: 1.5 });
};

M.anker = (g) => {
  g.shape(C(0, -66, 13) , { h: 0.6, dome: 0.3, blur: 3 });
  g.cut(C(0, -66, 6.5));
  g.shape(R(-6, -54, 12, 116, 4), { h: 0.6, dome: 0.25, blur: 3 });
  g.shape(R(-34, -40, 68, 11, 5.5), { h: 0.62, dome: 0.25, blur: 3 });
  g.shape(C(-36, -34.5, 7) + C(36, -34.5, 7), { h: 0.64, dome: 0.3, blur: 2 });
  const arc = 'M-66 20C-62 52 -32 70 0 72C32 70 62 52 66 20L54 24C50 48 28 60 0 61C-28 60 -50 48 -54 24Z';
  g.shape(arc, { h: 0.6, dome: 0.25, blur: 3 });
  g.shape(P([[-74, 26], [-58, 8], [-50, 30]]) + P([[74, 26], [58, 8], [50, 30]]), { h: 0.64, dome: 0.2, blur: 2 });
  g.stipple(R(-8, -54, 16, 116), { n: 40, r: 1.6, depth: 0.7 });
  // Tau um den Schaft
  g.ridge('M-6 -46C24 -30 -26 -14 6 2C30 16 -22 30 4 48', 3.2, 0.7);
};

M.hufeisen = (g) => {
  const shoe = 'M-56 70L-62 0C-66 -50 -36 -80 0 -80C36 -80 66 -50 62 0L56 70L32 70L38 0C40 -36 22 -56 0 -56C-22 -56 -40 -36 -38 0L-32 70Z';
  g.shape(shoe, { h: 0.58, dome: 0.28, blur: 6 });
  g.groove('M-47 66L-52 0C-54 -40 -28 -68 0 -68C28 -68 54 -40 52 0L47 66', 1.4, 0.7);
  for (const [x, y] of [[-50, 46], [-53, 14], [-48, -22], [-30, -54], [50, 46], [53, 14], [48, -22], [30, -54]]) g.pit(C(x, y, 3.6), 0.55);
  g.at(0, 26, 0, () => g.shape(STAR(0, 0, 16, 4, 0.38), { h: 0.62, dome: 0.3, blur: 2 }));
};

M.laterne = (g) => {
  g.ridge('M-16 -70C-16 -88 16 -88 16 -70', 4, 0.62);
  g.shape(P([[-30, -54], [30, -54], [18, -70], [-18, -70]]), { h: 0.6, dome: 0.2, blur: 3 });
  const glass = R(-28, -52, 56, 92, 6);
  g.shape(glass, { h: 0.5, dome: 0.18, blur: 4 });
  g.at(0, 18, 0, () => g.shape(FLAME(50, 15, 0.3), { h: 0.62, dome: 0.4, blur: 6 }));
  g.ridge('M-28 -50L-28 40M28 -50L28 40M0 -52L0 -42M0 30L0 40', 3.4, 0.64);
  g.shape(P([[-34, 40], [34, 40], [26, 58], [-26, 58]]), { h: 0.6, dome: 0.2, blur: 3 });
  g.shape(R(-20, 58, 40, 10, 4), { h: 0.62, dome: 0.2, blur: 2 });
  for (const a of [-60, -30, 30, 60, 0]) g.at(0, -6, a, () => g.ridge('M0 -60L0 -72', 2.2, 0.55));
};

M.pfeil = (g) => {
  g.groove(C(26, 26, 46) + C(26, 26, 30) + C(26, 26, 14), 1.8, 0.7); // Zielscheibe
  g.at(0, 0, 45, () => {
    g.shape(R(-4.5, -54, 9, 132, 3), { h: 0.6, dome: 0.2, blur: 2 });
    g.groove('M0 -50L0 74', 0.8, 0.75);
    g.shape(P([[0, -94], [22, -52], [8, -58], [-8, -58], [-22, -52]]), { h: 0.68, dome: 0.25, blur: 3 });
    g.groove('M0 -88L0 -60M0 -76L12 -58M0 -76L-12 -58', 1, 0.7);
    for (const s2 of [-1, 1]) {
      const fl = P([[s2 * 3, 44], [s2 * 22, 56], [s2 * 22, 82], [s2 * 3, 72]]);
      g.shape(fl, { h: 0.56, dome: 0.2, blur: 2 });
      g.groove(`M${s2 * 4} 52L${s2 * 20} 62M${s2 * 4} 60L${s2 * 20} 70M${s2 * 4} 68L${s2 * 20} 78`, 0.8, 0.76);
    }
  });
};

M.keimling = (g) => {
  g.shape('M-60 66C-40 50 40 50 60 66C40 80 -40 80 -60 66Z', { h: 0.46, dome: 0.2, blur: 6 });
  g.stipple('M-60 66C-40 50 40 50 60 66C40 80 -40 80 -60 66Z', { n: 50, r: 1.4 });
  g.shape('M-4 60C-6 30 -4 0 2 -24L8 -24C4 0 4 30 6 60Z', { h: 0.58, dome: 0.2, blur: 2 });
  g.at(2, -16, -55, () => { g.shape(LEAF(62, 26), { h: 0.6, dome: 0.35, blur: 8 }); g.groove('M0 -4L0 -54', 1, 0.7); });
  g.at(4, -6, 60, () => { g.shape(LEAF(54, 22), { h: 0.58, dome: 0.35, blur: 8 }); g.groove('M0 -4L0 -46', 1, 0.7); });
  g.shape(C(0, 52, 9), { h: 0.56, dome: 0.4, blur: 3 }); // Samenschale
  g.ridge('M-10 48L-20 40M10 48L20 42', 2, 0.55);
};

M.wuerfel = (g) => {
  const top = P([[0, -76], [64, -42], [0, -8], [-64, -42]]);
  const left = P([[-64, -42], [0, -8], [0, 72], [-64, 38]]);
  const right = P([[64, -42], [0, -8], [0, 72], [64, 38]]);
  g.shape(left, { h: 0.52, dome: 0.12, blur: 4 });
  g.shape(right, { h: 0.56, dome: 0.12, blur: 4 });
  g.shape(top, { h: 0.62, dome: 0.12, blur: 4 });
  g.groove(L([[-64, -42], [0, -8], [64, -42]]) + 'M0 -8L0 72', 1.4, 0.66);
  g.pit(E(0, -42, 9, 5), 0.55);
  for (const [x, y] of [[-48, -10], [-32, 14], [-16, 38]]) g.pit(E(x, y, 5, 6), 0.55);
  for (const [x, y] of [[16, 8], [48, -8], [16, 40], [48, 24], [16, 24], [48, 40]]) g.pit(E(x, y - 4, 4.5, 5.5), 0.55);
};

M.feder = (g) => {
  g.at(-8, 60, 28, () => {
    g.shape('M0 0C24 -30 26 -90 0 -140C-26 -90 -24 -30 0 0Z', { h: 0.56, dome: 0.3, blur: 8 });
    g.groove('M0 10L0 -134', 1.6, 0.66);
    for (let i = 1; i < 12; i++) {
      const y = -i * 11;
      const w = Math.sin((i / 12) * Math.PI) * 22 + 3;
      g.groove(`M0 ${y}Q${w * 0.6} ${y - 6} ${w} ${y - 14}M0 ${y}Q${-w * 0.6} ${y - 6} ${-w} ${y - 14}`, 0.7, 0.8);
    }
    g.cut('M14 -64L26 -70L22 -56Z');
    g.ridge('M0 0L0 18', 3.2, 0.62);
  });
  g.shape('M38 70C28 60 34 50 46 52C50 62 48 70 38 70Z', { h: 0.5, dome: 0.4, blur: 3 }); // Tintentropfen
};

M.pilzprinz = (g) => {
  const stem = 'M-18 6C-20 30 -24 50 -28 68C-8 74 8 74 28 68C24 50 20 30 18 6Z';
  g.shape(stem, { h: 0.52, blur: 9 });
  g.hatch(stem, { angle: 90, gap: 6, w: 0.8, depth: 0.84, wave: 1 });
  const cap = 'M-70 8C-72 -40 -36 -66 0 -66C36 -66 72 -40 70 8C42 18 -42 18 -70 8Z';
  g.shape(cap, { h: 0.56, dome: 0.42, blur: 14 });
  for (const [x, y, r] of [[-36, -28, 9], [6, -44, 7], [34, -18, 10], [-6, -12, 6], [52, -38, 5]]) g.pit(C(x, y, r), 0.72, 2);
  g.pit(C(-8, 34, 3) + C(8, 34, 3), 0.58);
  g.groove('M-8 46Q0 52 8 46', 1.2, 0.68);
  g.at(0, -64, 0, () => crown(g), 0.34);
};

// ═══ Selten ═══
M.falke = (g) => {
  g.at(-6, 8, 0, () => wing(g, { n: 7, a0: 18, a1: 92, l0: 82, l1: 50, w: 10 }), -1, 1);
  g.at(6, 8, 0, () => wing(g, { n: 7, a0: 18, a1: 92, l0: 82, l1: 50, w: 10 }));
  const body = 'M0 -34C14 -34 18 -14 16 10C14 34 8 52 0 66C-8 52 -14 34 -16 10C-18 -14 -14 -34 0 -34Z';
  g.shape(body, { h: 0.62, dome: 0.32, blur: 6 });
  g.scales(body, { r: 5, w: 0.8, depth: 0.76 });
  g.shape(C(0, -40, 13), { h: 0.66, dome: 0.35, blur: 4 });
  g.shape(P([[-4, -36], [4, -36], [0, -22]]), { h: 0.72, dome: 0.2, blur: 1 });
  g.pit(C(-6, -44, 2.4) + C(6, -44, 2.4), 0.5);
  g.shape(P([[-10, 62], [0, 82], [10, 62]]), { h: 0.6, dome: 0.2, blur: 2 });
};

M.frostzahn = (g) => {
  const shards = [[0, -84, 22, 0], [-38, -50, 14, -28], [40, -46, 14, 26], [-22, -66, 10, -12], [24, -70, 10, 14]];
  for (const [x, y, w, rot] of shards) {
    g.at(x * 0.4, 50, rot, () => {
      const len = 50 - y;
      g.shape(P([[0, -len], [w, -len * 0.45], [w * 0.6, 0], [-w * 0.6, 0], [-w, -len * 0.45]]), { h: 0.62, dome: 0.1, blur: 2 });
      g.groove(`M0 ${-len + 6}L0 -4M0 ${-len * 0.45}L${w * 0.8} ${-len * 0.45}`, 0.9, 0.7);
    });
  }
  g.shape('M-64 50C-40 40 40 40 64 50C50 70 -50 70 -64 50Z', { h: 0.52, dome: 0.25, blur: 6 });
  g.groove(STAR(0, 58, 8, 6, 0.3), 0.8, 0.72);
};

M.fledermaus = (g) => {
  const wingD = 'M8 -6C30 -40 60 -48 84 -36C76 -24 76 -10 82 4C70 -2 58 0 52 10C44 2 32 4 26 14C20 6 12 4 8 6Z';
  g.shape(wingD, { h: 0.56, dome: 0.2, blur: 4 });
  g.at(0, 0, 0, () => g.shape(wingD, { h: 0.56, dome: 0.2, blur: 4 }), -1, 1);
  g.groove('M10 -4L56 -40M28 2L60 -20M40 6L78 -14M-10 -4L-56 -40M-28 2L-60 -20M-40 6L-78 -14', 1, 0.7);
  const body = E(0, 4, 14, 24);
  g.shape(body, { h: 0.64, dome: 0.35, blur: 4 });
  g.hatch(body, { angle: 90, gap: 3, w: 0.6, depth: 0.82 });
  g.shape(C(0, -22, 12), { h: 0.66, dome: 0.3, blur: 3 });
  g.shape(P([[-10, -28], [-14, -46], [-3, -32]]) + P([[10, -28], [14, -46], [3, -32]]), { h: 0.64, dome: 0.2, blur: 1 });
  g.pit(C(-5, -22, 2.4) + C(5, -22, 2.4), 0.48);
  g.groove(C(30, 52, 14), 1.4, 0.7); // kleiner Mond
  g.cut(C(36, 48, 12));
};

M.fuchs = (g) => {
  const head = 'M0 64C-22 50 -52 20 -60 -12L-66 -70L-30 -40C-18 -46 18 -46 30 -40L66 -70L60 -12C52 20 22 50 0 64Z';
  g.shape(head, { h: 0.56, dome: 0.32, blur: 10 });
  g.shape('M-54 -54L-34 -38L-50 -18Z', { h: 0.48, dome: 0.1, blur: 2 });
  g.shape('M54 -54L34 -38L50 -18Z', { h: 0.48, dome: 0.1, blur: 2 });
  g.shape('M-58 -6C-40 20 -16 22 0 26C16 22 40 20 58 -6C44 34 18 56 0 64C-18 56 -44 34 -58 -6Z', { h: 0.64, dome: 0.25, blur: 6 });
  g.hatch('M-58 -6C-40 20 -16 22 0 26C16 22 40 20 58 -6C44 34 18 56 0 64C-18 56 -44 34 -58 -6Z', { angle: 70, gap: 4, w: 0.6, depth: 0.82, wave: 0.8 });
  g.pit('M-36 -8L-14 -4L-18 4L-34 2Z' + 'M36 -8L14 -4L18 4L34 2Z', 0.5, 1);
  g.shape(E(0, 46, 8, 6), { h: 0.72, dome: 0.3, blur: 1.5 });
};

M.kompass = (g) => {
  g.groove(C(0, 0, 78) + C(0, 0, 66), 1.6, 0.7);
  for (let i = 0; i < 32; i++) g.at(0, 0, i * 11.25, () => g.groove(`M0 -78L0 ${i % 4 ? -72 : -66}`, 0.9, 0.72));
  g.shape(STAR(0, 0, 62, 4, 0.22, 45), { h: 0.52, dome: 0.15, blur: 3 });
  g.shape(STAR(0, 0, 72, 4, 0.2), { h: 0.62, dome: 0.15, blur: 3 });
  for (let i = 0; i < 4; i++) g.at(0, 0, i * 90, () => g.groove('M0 -6L0 -66', 1, 0.68));
  g.shape(C(0, 0, 9), { h: 0.7, dome: 0.4, blur: 2 });
  g.at(0, -70, 0, () => g.shape(P([[-6, 6], [0, -10], [6, 6]]), { h: 0.74, dome: 0.2, blur: 1 }));
};

M.runenschild = (g) => {
  g.shape(C(0, 0, 78), { h: 0.52, dome: 0.18, blur: 8 });
  g.ridge(C(0, 0, 72), 4, 0.64);
  for (let i = 0; i < 12; i++) g.at(0, 0, i * 30, () => g.shape(C(0, -66, 4), { h: 0.68, dome: 0.4, blur: 1.5 }));
  g.hatch(C(0, 0, 60), { angle: 0, gap: 12, w: 1.2, depth: 0.78 });
  g.shape(C(0, 0, 20), { h: 0.64, dome: 0.4, blur: 4 });
  // Rune Othala
  g.ridge('M0 -46L-24 -20L0 6L24 -20Z M-6 0L-28 44M6 0L28 44', 5, 0.72);
};

M.mondsplitter = (g) => {
  g.shape(C(-6, 0, 66), { h: 0.58, dome: 0.4, blur: 14 });
  g.cut(C(24, -14, 58));
  g.pit(C(-40, 10, 7) + C(-26, 38, 5) + C(-46, -22, 4), 0.72, 1.5);
  g.groove('M-30 -36L-20 -20L-34 -6', 1, 0.7);
  for (const [x, y, r] of [[36, -48, 9], [56, 6, 6], [30, 42, 7], [60, -26, 4]]) g.shape(STAR(x, y, r, 4, 0.35), { h: 0.66, dome: 0.3, blur: 1 });
  g.shape(P([[20, 6], [30, 0], [26, 14]]) + P([[6, 54], [16, 50], [12, 62]]), { h: 0.6, dome: 0.2, blur: 1 }); // Splitter
};

M.welle = (g) => {
  const wave = 'M-80 40C-60 30 -50 -20 -10 -46C26 -70 70 -54 76 -20C60 -38 30 -36 16 -16C40 -24 58 -8 50 12C40 -4 20 -2 10 12C0 28 10 46 30 52L-80 60Z';
  g.shape(wave, { h: 0.58, dome: 0.3, blur: 10 });
  g.groove('M-66 40C-46 20 -36 -18 -4 -36C20 -50 50 -44 62 -30M-50 48C-30 30 -20 0 0 -16', 1.2, 0.7);
  g.shape('M-82 60C-50 52 -20 66 10 58C40 50 60 64 82 58L82 70L-82 70Z', { h: 0.5, dome: 0.15, blur: 4 });
  for (const [x, y] of [[66, -8], [56, 24], [72, 10], [40, -60]]) g.shape(C(x, y, 3.5), { h: 0.62, dome: 0.4, blur: 1 });
};

// ═══ Sehr selten ═══
M.krone = (g) => {
  g.at(0, 4, 0, () => crown(g), 1);
  for (const x of [-56, 0, 56]) g.shape(STAR(x, -66 + Math.abs(x) * 0.25, 6, 4, 0.35), { h: 0.7, dome: 0.3, blur: 1 });
};

M.schwerter = (g) => {
  g.at(0, 4, -38, () => sword(g, 92), 1.12);
  g.at(0, 4, 38, () => sword(g, 92), 1.12);
  g.shape(C(0, 0, 13), { h: 0.72, dome: 0.4, blur: 3 });
  g.pit(C(0, 0, 4.5), 0.62);
};

M.karte = (g) => {
  const paper = 'M-72 -56L-30 -66L20 -54L72 -64L66 54L22 64L-28 54L-70 62Z';
  g.shape(paper, { h: 0.5, dome: 0.1, blur: 4 });
  g.groove('M-30 -66L-28 54M20 -54L22 64', 1.2, 0.72);
  g.groove('M-56 40C-40 20 -30 30 -14 10C0 -8 -8 -20 10 -26C24 -30 30 -10 40 -20', 1.6, 0.68);
  g.pit(C(-56, 40, 3) + C(-40, 26, 2) + C(-24, 22, 2) + C(-12, 6, 2), 0.6);
  g.ridge('M34 -34L52 -16M52 -34L34 -16', 4.2, 0.7);
  g.shape(STAR(-48, -38, 10, 4, 0.3), { h: 0.62, dome: 0.2, blur: 1 });
  g.groove(C(-48, -38, 13), 0.8, 0.75);
  g.shape('M30 30C40 22 54 28 52 40C48 50 34 50 30 30Z', { h: 0.56, dome: 0.3, blur: 3 }); // Insel
};

M.biene = (g) => {
  for (const s of [-1, 1]) {
    g.at(s * 8, -16, 0, () => g.shape(`M0 0C${s * 20} -40 ${s * 70} -48 ${s * 66} -14C${s * 62} 6 ${s * 22} 10 0 0Z`, { h: 0.5, dome: 0.18, blur: 4 }));
    g.at(s * 8, -16, 0, () => g.groove(`M0 0C${s * 24} -24 ${s * 46} -30 ${s * 58} -20`, 0.8, 0.75));
    g.at(s * 6, -4, 0, () => g.shape(`M0 0C${s * 16} -2 ${s * 46} 8 ${s * 44} 26C${s * 30} 30 ${s * 10} 14 0 0Z`, { h: 0.48, dome: 0.15, blur: 3 }));
  }
  const body = E(0, 22, 24, 40);
  g.shape(body, { h: 0.64, dome: 0.38, blur: 8 });
  g.groove('M-22 10Q0 18 22 10M-24 26Q0 34 24 26M-20 42Q0 50 20 42', 4, 0.68, body);
  g.shape(C(0, -26, 16), { h: 0.66, dome: 0.38, blur: 4 });
  g.ridge('M-6 -38C-12 -54 -20 -60 -26 -60M6 -38C12 -54 20 -60 26 -60', 2, 0.62);
  g.shape(C(-26, -60, 4) + C(26, -60, 4), { h: 0.68, dome: 0.3, blur: 1 });
  g.at(0, -40, 0, () => crown(g), 0.22);
  g.shape(P([[-5, 60], [0, 74], [5, 60]]), { h: 0.66, dome: 0.2, blur: 1 });
};

M.klee = (g) => {
  for (let i = 0; i < 4; i++) {
    g.at(0, -6, 45 + i * 90, () => {
      const heart = 'M0 0C-6 -14 -40 -30 -36 -56C-32 -74 -8 -70 0 -54C8 -70 32 -74 36 -56C40 -30 6 -14 0 0Z';
      g.shape(heart, { h: 0.58, dome: 0.38, blur: 10 });
      g.groove('M0 -4L0 -52', 1.1, 0.7);
      g.groove('M0 -26L-18 -44M0 -26L18 -44', 0.8, 0.75);
    });
  }
  g.ridge('M0 -6C4 24 14 50 30 74', 5, 0.6);
};

M.skarabaeus = (g) => {
  g.shape(C(0, -60, 22), { h: 0.52, dome: 0.4, blur: 6 }); // Sonnenkugel
  for (let i = 0; i < 9; i++) g.at(0, -60, i * 40, () => g.groove('M0 -14L0 -20', 1, 0.7));
  const shell = 'M0 -30C30 -30 44 0 40 30C36 56 18 70 0 72C-18 70 -36 56 -40 30C-44 0 -30 -30 0 -30Z';
  g.shape(shell, { h: 0.62, dome: 0.4, blur: 10 });
  g.groove('M0 -30L0 72M-36 4Q0 -2 36 4', 1.3, 0.66);
  g.shape('M-14 -42C-14 -50 14 -50 14 -42L10 -30L-10 -30Z', { h: 0.66, dome: 0.3, blur: 2 });
  for (const s of [-1, 1]) {
    g.ridge(`M${s * 34} 14L${s * 58} 0L${s * 70} 8M${s * 38} 34L${s * 64} 36L${s * 72} 50M${s * 30} 54L${s * 50} 70L${s * 50} 82`, 3, 0.6);
    g.ridge(`M${s * 12} -40L${s * 30} -40L${s * 38} -46`, 3, 0.6);
  }
  g.pit(C(-16, 22, 4) + C(16, 22, 4) + C(-14, 46, 3) + C(14, 46, 3), 0.6);
};

M.truhe = (g) => {
  const lid = 'M-70 -10C-70 -60 70 -60 70 -10Z';
  g.shape(lid, { h: 0.6, dome: 0.3, blur: 8 });
  g.groove('M-70 -10C-70 -52 70 -52 70 -10', 0.1, 1);
  const box = R(-70, -10, 140, 74, 4);
  g.shape(box, { h: 0.56, dome: 0.15, blur: 5 });
  g.hatch(box, { angle: 0, gap: 14, w: 1, depth: 0.78 });
  g.ridge('M-50 -48L-50 64M50 -48L50 64M-70 -10L70 -10', 6, 0.66);
  for (const [x, y] of [[-50, -36], [-50, 52], [50, -36], [50, 52], [-50, 4], [50, 4]]) g.shape(C(x, y, 3), { h: 0.74, dome: 0.3, blur: 1 });
  g.shape(R(-14, -18, 28, 32, 5), { h: 0.7, dome: 0.3, blur: 2 });
  g.pit('M0 -6m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0M-2 -2L2 -2L3 8L-3 8Z', 0.5);
  // Münzen quellen heraus
  for (const [x, y] of [[-30, -46], [-6, -52], [20, -50], [40, -42], [6, -62]]) { g.shape(E(x, y, 9, 4), { h: 0.7, dome: 0.3, blur: 1 }); }
};

// ═══ Episch ═══
M.ouroboros = (g) => {
  const ring = C(0, 0, 70);
  g.shape(ring, { h: 0.58, dome: 0.3, blur: 10 });
  g.cut(C(0, 0, 46));
  g.scales(ring, { r: 6, w: 0.9, depth: 0.74 });
  g.groove(C(0, 0, 58), 1, 0.7);
  // Kopf beißt in den Schwanz (oben)
  g.at(0, -58, 0, () => {
    g.shape('M-30 -14C-10 -24 20 -20 34 -4C30 10 10 16 -30 12Z', { h: 0.66, dome: 0.35, blur: 4 });
    g.pit(C(10, -6, 3.5), 0.5);
    g.groove('M34 -4L14 4', 1.2, 0.66);
    g.shape(P([[-30, -6], [-48, -2], [-30, 6]]), { h: 0.6, dome: 0.15, blur: 1 }); // Schwanzspitze
  });
  g.shape(STAR(0, 0, 22, 6, 0.5), { h: 0.62, dome: 0.3, blur: 2 });
};

M.kristallherz = (g) => {
  const heart = 'M0 70C-30 44 -78 10 -72 -30C-68 -60 -30 -72 0 -44C30 -72 68 -60 72 -30C78 10 30 44 0 70Z';
  g.shape(heart, { h: 0.6, dome: 0.15, blur: 6 });
  g.groove('M0 -44L0 70M-72 -30L0 -10L72 -30M-40 30L0 -10L40 30M-44 -62L-30 -20L0 -10M44 -62L30 -20L0 -10M-30 -20L-72 -30M30 -20L72 -30', 1.3, 0.66);
  g.bump('M0 -10L-30 -20L-44 -62L-14 -54Z', 0.25, 2);
  g.bump('M0 -10L40 30L0 70Z', 0.12, 2);
  for (const [x, y] of [[-56, -66], [62, -48], [52, 40]]) g.shape(STAR(x, y, 7, 4, 0.3), { h: 0.66, dome: 0.3, blur: 1 });
};

M.tornado = (g) => {
  for (let i = 0; i < 7; i++) {
    const y = -64 + i * 20, w = 70 - i * 9;
    g.shape(E(Math.sin(i) * 6, y, w, 10), { h: 0.56 + i * 0.01, dome: 0.3, blur: 4 });
    g.groove(`M${-w + 10} ${y}Q0 ${y + 8} ${w - 10} ${y}`, 1, 0.72);
  }
  g.shape(E(4, 76, 10, 6), { h: 0.6, dome: 0.3, blur: 2 });
  for (const [x, y, r] of [[-62, 20, 6], [58, 30, 5], [-50, 52, 4], [66, -10, 4]]) g.shape(E(x, y, r, r * 0.45), { h: 0.66, dome: 0.3, blur: 1 });
  g.ridge('M-78 -30Q-60 -10 -70 10M78 -40Q60 -20 70 4', 2.4, 0.56);
};

M.zauberhut = (g) => {
  const hat = 'M-20 46C-14 10 -4 -30 10 -56C20 -74 40 -84 56 -74C40 -66 30 -44 26 -20C24 6 26 30 30 46Z';
  g.shape(hat, { h: 0.6, dome: 0.32, blur: 10 });
  g.shape('M-74 50C-50 32 50 32 74 50C50 66 -50 66 -74 50Z', { h: 0.56, dome: 0.25, blur: 6 });
  g.shape('M-22 34C-4 30 18 30 32 34L30 46C14 42 -6 42 -20 46Z', { h: 0.66, dome: 0.2, blur: 2 });
  for (const [x, y, r] of [[2, -6, 9], [16, -40, 6], [-6, 20, 5], [36, 8, 4]]) g.shape(STAR(x, y, r, 5, 0.42), { h: 0.7, dome: 0.3, blur: 1 });
  g.shape(P([[-10, 22], [-4, 20], [-6, 26]]), { h: 0.7, dome: 0.2, blur: 1 });
  g.shape(C(58, -76, 6), { h: 0.68, dome: 0.4, blur: 1.5 });
  g.shape('M-58 -40C-60 -60 -40 -66 -34 -50C-44 -52 -50 -46 -46 -38Z', { h: 0.62, dome: 0.3, blur: 2 }); // Mond
};

M.skorpion = (g) => {
  const body = 'M0 -10C14 -10 18 10 16 30C14 46 6 56 0 58C-6 56 -14 46 -16 30C-18 10 -14 -10 0 -10Z';
  g.shape(body, { h: 0.62, dome: 0.35, blur: 6 });
  g.groove('M-15 6Q0 10 15 6M-16 22Q0 26 16 22M-14 38Q0 42 14 38', 1, 0.7);
  g.shape(C(0, -20, 12), { h: 0.64, dome: 0.3, blur: 3 });
  // Schwanz bogenförmig über den Körper
  const tail = tube(bez([0, 56], [10, 90], [70, 60], [56, -10], 26), 14, 8);
  g.shape(tail, { h: 0.6, dome: 0.3, blur: 3 });
  g.at(56, -14, 30, () => g.shape('M0 0C10 -8 12 -24 0 -36C4 -22 -2 -10 -10 -6Z', { h: 0.7, dome: 0.3, blur: 2 }));
  for (const s of [-1, 1]) {
    g.ridge(`M${s * 8} -26L${s * 26} -46L${s * 30} -62`, 4, 0.6);
    g.shape(`M${s * 30} -62C${s * 46} -70 ${s * 50} -54 ${s * 38} -50C${s * 46} -60 ${s * 36} -62 ${s * 30} -56Z`, { h: 0.64, dome: 0.3, blur: 2 });
    for (let i = 0; i < 3; i++) g.ridge(`M${s * 14} ${4 + i * 14}L${s * 34} ${-2 + i * 16}L${s * 44} ${10 + i * 18}`, 2.4, 0.56);
  }
};

M.spinne = (g) => {
  let web = '';
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    web += `M0 0L${f(Math.cos(a) * 80)} ${f(Math.sin(a) * 80)}`;
  }
  for (const r of [22, 40, 58, 76]) web += polar(0, 0, 8, () => r);
  g.ridge(web, 1.6, 0.56);
  g.shape(E(0, 8, 14, 18), { h: 0.66, dome: 0.4, blur: 4 });
  g.shape(C(0, -14, 9), { h: 0.66, dome: 0.35, blur: 2 });
  g.groove(STAR(0, 8, 8, 4, 0.3), 0.9, 0.7);
  for (const s of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const y = -10 + i * 8;
      g.ridge(`M${s * 10} ${y}L${s * (26 + i * 2)} ${y - 18 + i * 6}L${s * (40 + i * 2)} ${y + 6 + i * 6}`, 2.6, 0.62);
    }
  }
};

// ═══ Legendär ═══
M.drachenkopf = (g) => {
  // Kopf im Profil nach rechts, Maul offen, Feuer
  const upper = 'M-64 -6C-64 -36 -44 -54 -14 -54C6 -54 22 -48 36 -40L66 -30C72 -26 70 -18 62 -16L30 -10C14 -8 0 -6 -10 -4Z';
  const lower = 'M-62 6C-52 2 -30 0 -10 2L20 8L50 18C56 22 52 28 46 28L14 26C-6 30 -30 40 -44 38C-58 34 -64 22 -62 6Z';
  g.shape(upper, { h: 0.62, dome: 0.32, blur: 8 });
  g.shape(lower, { h: 0.58, dome: 0.28, blur: 6 });
  g.scales('M-64 -6C-64 -36 -44 -54 -14 -54L-14 38C-30 40 -58 34 -64 -6Z', { r: 6, w: 0.8, depth: 0.76 });
  for (const x of [8, 20, 32, 44, 56]) g.shape(P([[x - 3, -12], [x + 3, -12], [x, -4]]), { h: 0.7, dome: 0.1, blur: 0.5 });
  for (const x of [14, 26, 38]) g.shape(P([[x - 3, 22], [x + 3, 22], [x, 14]]), { h: 0.7, dome: 0.1, blur: 0.5 });
  g.shape(P([[-36, -48], [-64, -84], [-22, -54]]) + P([[-14, -54], [-30, -88], [0, -54]]), { h: 0.64, dome: 0.2, blur: 2 });
  g.shape(E(-6, -34, 10, 6), { h: 0.7, dome: 0.3, blur: 1 });
  g.pit(E(-4, -34, 3, 5), 0.45);
  g.pit(C(60, -26, 2.4), 0.55);
  g.ridge('M-60 20C-50 50 -30 64 -6 76M-44 34C-36 50 -24 60 -10 66', 3, 0.56); // Bart/Hals
  // Feuer aus dem Maul
  for (const [y, l, w] of [[-2, 30, 14], [8, 26, 12]]) g.at(56, y, 70, () => g.shape(FLAME(l, w, 0.5), { h: 0.6, dome: 0.3, blur: 3 }));
  g.shape(C(78, 0, 7) + C(84, -12, 4) + C(84, 12, 4), { h: 0.62, dome: 0.4, blur: 2 });
};

M.kriegshammer = (g) => {
  g.at(0, 0, -20, () => {
    g.shape(R(-6, -40, 12, 120, 4), { h: 0.58, dome: 0.25, blur: 3 });
    g.hatch(R(-6, 40, 12, 36), { angle: 30, gap: 4, w: 0.9, depth: 0.7 });
    const head = R(-56, -72, 112, 44, 6);
    g.shape(head, { h: 0.64, dome: 0.25, blur: 5 });
    g.groove('M-44 -72L-44 -28M44 -72L44 -28M-56 -50L56 -50', 1.4, 0.66);
    g.shape(R(-16, -64, 32, 28, 4), { h: 0.7, dome: 0.3, blur: 2 });
    g.shape(STAR(0, -50, 9, 4, 0.35), { h: 0.74, dome: 0.3, blur: 1 });
    g.shape(C(0, 82, 8), { h: 0.64, dome: 0.4, blur: 2 });
  });
  for (const a of [-50, -20, 20, 50]) g.at(-30, 20, a, () => g.ridge('M0 34L0 48', 2.6, 0.55));
};

M.feuervogel = (g) => {
  g.at(0, 4, 0, () => {
    const fl = (l, w) => FLAME(l, w, 0.7);
    g.at(-6, -6, 0, () => wing(g, { n: 7, a0: 8, a1: 78, l0: 92, l1: 62, w: 12, shape: fl }), -1, 1);
    g.at(6, -6, 0, () => wing(g, { n: 7, a0: 8, a1: 78, l0: 92, l1: 62, w: 12, shape: fl }));
    const body = 'M0 -44C14 -44 18 -22 16 0C14 22 7 34 0 38C-7 34 -14 22 -16 0C-18 -22 -14 -44 0 -44Z';
    g.shape(body, { h: 0.66, dome: 0.35, blur: 5 });
    g.shape(C(0, -50, 12), { h: 0.68, dome: 0.35, blur: 3 });
    g.shape(P([[-4, -46], [4, -46], [0, -34]]), { h: 0.72, dome: 0.2, blur: 1 });
    g.pit(C(-5, -53, 2) + C(5, -53, 2), 0.5);
    g.at(0, -60, 0, () => { for (const a of [-32, 0, 32]) g.at(0, 0, a, () => g.shape(FLAME(24, 7, 0.4), { h: 0.66, dome: 0.3, blur: 1.5 })); });
    for (const [a, l] of [[150, 50], [180, 62], [210, 50]]) g.at(0, 32, a, () => g.shape(FLAME(l, 11, 0.6), { h: 0.6, dome: 0.3, blur: 3 }));
  });
};

M.meteor = (g) => {
  for (const [w, o] of [[30, 0], [20, 14], [16, -14]]) g.at(24, -24, -135, () => g.shape(FLAME(120, w, 0.3), { h: 0.5 - Math.abs(o) * 0.002, dome: 0.25, blur: 6 }));
  const rock = polar(28, 26, 14, (a, i) => 34 + Math.sin(i * 2.7) * 5);
  g.shape(rock, { h: 0.62, dome: 0.4, blur: 8 });
  g.pit(C(16, 18, 7) + C(38, 38, 5) + C(36, 10, 4) + C(18, 44, 3), 0.7, 1.5);
  g.groove('M8 30L24 32L30 46', 1, 0.7);
  for (const [x, y] of [[-60, 40], [-40, 64], [60, -60], [-70, -10]]) g.shape(STAR(x, y, 5, 4, 0.3), { h: 0.66, dome: 0.3, blur: 1 });
};

M.loewenherz = (g) => {
  for (let i = 0; i < 16; i++) g.at(0, 6, i * 22.5, () => g.shape(FLAME(84, 13, 0.5), { h: 0.5, dome: 0.25, blur: 4 }));
  const heart = 'M0 54C-22 36 -56 12 -52 -16C-48 -40 -20 -46 0 -26C20 -46 48 -40 52 -16C56 12 22 36 0 54Z';
  g.shape(heart, { h: 0.64, dome: 0.4, blur: 10 });
  g.groove('M0 -18L0 40M-20 6L20 6', 2.2, 0.66);
  g.at(0, -40, 0, () => crown(g), 0.34);
};

// ═══ Mystisch ═══
M.geist = (g) => {
  const ghost = 'M-46 60L-46 -14C-46 -50 -24 -72 0 -72C24 -72 46 -50 46 -14L46 60L32 48L18 62L4 48L-10 62L-24 48Z';
  g.shape(ghost, { h: 0.56, dome: 0.4, blur: 14 });
  g.pit(E(-16, -24, 8, 11) + E(16, -24, 8, 11), 0.5, 2);
  g.pit(E(0, 6, 8, 10), 0.6, 2);
  g.ridge('M-46 -10C-66 -4 -72 16 -64 30M46 -10C66 -4 72 16 64 30', 4, 0.56);
  for (const [x, y] of [[-66, -50], [64, -46], [-70, 48]]) g.at(x, y, 0, () => g.shape(FLAME(16, 6, 0.4), { h: 0.6, dome: 0.3, blur: 1 }));
};

M.zeitriss = (g) => {
  g.shape(C(0, 0, 72), { h: 0.52, dome: 0.2, blur: 8 });
  g.ridge(C(0, 0, 66), 3, 0.62);
  for (let i = 0; i < 12; i++) g.at(0, 0, i * 30, () => g.shape(R(-2.5, -60, 5, i % 3 ? 8 : 14, 1), { h: 0.68, dome: 0.2, blur: 1 }));
  g.at(0, 0, -50, () => g.shape(P([[-4, 4], [0, -40], [4, 4]]), { h: 0.72, dome: 0.2, blur: 1 }));
  g.at(0, 0, 110, () => g.shape(P([[-3, 4], [0, -54], [3, 4]]), { h: 0.72, dome: 0.2, blur: 1 }));
  g.shape(C(0, 0, 6), { h: 0.74, dome: 0.4, blur: 1 });
  // Riss quer durch
  g.cut('M-74 -20L-40 -10L-30 -28L-8 -12L10 -30L30 -8L44 -22L76 -6L76 0L44 -14L30 0L10 -22L-8 -4L-30 -20L-40 -2L-74 -12Z');
  g.groove('M-40 -2L-50 20M10 -22L16 -48M44 -14L58 8', 1.2, 0.62);
};

M.runenportal = (g) => {
  g.shape(C(0, 0, 76), { h: 0.52, dome: 0.15, blur: 6 });
  g.cut(C(0, 0, 50));
  const runes = ['M-4 -6L-4 6M-4 -6L4 0', 'M0 -6L0 6M0 0L5 -5M0 0L5 5', 'M-4 6L0 -6L4 6', 'M-4 -6L4 6M4 -6L-4 6', 'M0 -6L0 6M-4 -2L4 -2', 'M-4 6L-4 -6L4 -2L-4 2'];
  for (let i = 0; i < 12; i++) g.at(0, 0, i * 30, () => g.at(0, -63, 0, () => g.ridge(runes[i % runes.length], 2.4, 0.7)));
  g.groove(C(0, 0, 70) + C(0, 0, 56), 1.2, 0.7);
  g.ridge(spiral(0, 0, 4, 44, 2.6, 0), 3.2, 0.6);
  g.shape(C(0, 0, 6), { h: 0.66, dome: 0.4, blur: 1 });
};

M.kraehe = (g) => {
  const body = 'M-60 30C-40 0 -10 -24 20 -30C34 -44 52 -46 62 -36L76 -32L60 -26C58 -10 44 6 24 14L-10 30L-50 64L-40 36Z';
  g.shape(body, { h: 0.58, dome: 0.32, blur: 8 });
  g.at(-8, -10, 0, () => wing(g, { n: 6, a0: -60, a1: -20, l0: 74, l1: 50, w: 10, coverts: false }), -1, 1);
  g.pit(C(54, -36, 3), 0.5);
  g.groove('M62 -36L76 -32L60 -28', 1, 0.68);
  g.ridge('M0 26L-4 50L-14 56M0 50L6 58M12 22L14 46L6 54M14 46L22 52', 2.4, 0.6);
  g.shape(C(30, 68, 7), { h: 0.6, dome: 0.4, blur: 2 }); // Münze in den Krallen
  g.shape('M-60 -60C-62 -78 -44 -84 -38 -70C-48 -72 -54 -66 -50 -58Z', { h: 0.6, dome: 0.3, blur: 2 });
};

// ═══ Engelsgleich ═══
M.harfe = (g) => {
  const frame = 'M-40 70L-50 -40C-52 -66 -30 -78 -10 -66C10 -54 30 -58 46 -74C56 -60 50 -40 40 -30L36 70Z';
  g.shape(frame, { h: 0.6, dome: 0.3, blur: 6 });
  g.cut('M-34 58L-40 -38C-40 -54 -26 -60 -14 -52C6 -40 24 -44 38 -54C40 -46 34 -38 28 -32L26 58Z');
  for (let i = 0; i < 7; i++) {
    const x = -30 + i * 9;
    const top = -50 + Math.sin((i / 6) * Math.PI) * 6 + i * 2;
    g.ridge(`M${x} ${top}L${x} 58`, 1.4, 0.6);
  }
  g.shape(R(-44, 58, 84, 12, 4), { h: 0.64, dome: 0.25, blur: 2 });
  g.at(-50, -40, -20, () => wing(g, { n: 5, a0: 200, a1: 250, l0: 40, l1: 28, w: 7, coverts: false }));
};

M.lichtfeder = (g) => {
  g.groove(C(0, -50, 22), 3, 0.7);
  g.ridge(E(0, -66, 26, 7), 3, 0.62); // Heiligenschein
  g.at(0, 70, 8, () => {
    g.shape('M0 0C22 -30 24 -90 0 -130C-24 -90 -22 -30 0 0Z', { h: 0.6, dome: 0.3, blur: 8 });
    g.groove('M0 6L0 -124', 1.4, 0.66);
    for (let i = 1; i < 11; i++) {
      const y = -i * 11, w = Math.sin((i / 11) * Math.PI) * 20 + 3;
      g.groove(`M0 ${y}Q${w * 0.6} ${y - 6} ${w} ${y - 12}M0 ${y}Q${-w * 0.6} ${y - 6} ${-w} ${y - 12}`, 0.6, 0.82);
    }
  });
  for (let i = 0; i < 10; i++) g.at(0, 0, i * 36 + 18, () => g.ridge('M0 -70L0 -80', 2, 0.55));
};

M.wolkenschloss = (g) => {
  for (const [x, w, h] of [[-36, 18, 64], [0, 24, 92], [36, 18, 70]]) {
    g.shape(R(x - w / 2, 30 - h, w, h, 1), { h: 0.6, dome: 0.15, blur: 3 });
    g.shape(P([[x - w / 2 - 4, 30 - h], [x, 30 - h - 26], [x + w / 2 + 4, 30 - h]]), { h: 0.64, dome: 0.2, blur: 2 });
    g.pit(R(x - 3, 30 - h + 14, 6, 10, 3), 0.6);
  }
  g.ridge('M0 -88L0 -100L12 -96L0 -92', 2, 0.6);
  g.shape(R(-50, 0, 100, 30, 2), { h: 0.62, dome: 0.15, blur: 3 });
  g.bricks(R(-50, 0, 100, 30), { bw: 12, bh: 7 });
  g.pit(R(-8, 10, 16, 20, 8), 0.55);
  const cloud = C(-52, 46, 22) + C(-20, 40, 26) + C(18, 42, 26) + C(52, 48, 22) + C(0, 58, 24) + C(-38, 60, 18) + C(38, 62, 18);
  g.shape(cloud, { h: 0.66, dome: 0.4, blur: 10 });
};

M.glocke = (g) => {
  const bell = 'M-6 -66C-34 -64 -44 -30 -46 6C-48 30 -58 42 -70 50L70 50C58 42 48 30 46 6C44 -30 34 -64 6 -66Z';
  g.shape(bell, { h: 0.6, dome: 0.38, blur: 12 });
  g.groove('M-50 30L50 30M-46 40L46 40', 1.4, 0.66);
  g.shape(C(0, 62, 10), { h: 0.66, dome: 0.4, blur: 2 });
  g.ridge('M-8 -66C-8 -82 8 -82 8 -66', 4, 0.62);
  g.at(-46, -10, 0, () => wing(g, { n: 5, a0: 210, a1: 260, l0: 40, l1: 26, w: 7, coverts: false }));
  g.at(46, -10, 0, () => wing(g, { n: 5, a0: 210, a1: 260, l0: 40, l1: 26, w: 7, coverts: false }), -1, 1);
  for (const a of [-40, -20, 20, 40]) g.at(0, 62, a, () => g.ridge('M0 18L0 26', 2, 0.55));
};

// ═══ Göttlich ═══
M.donnerkeil = (g) => {
  for (const s of [-1, 1]) {
    for (let i = 0; i < 8; i++) {
      g.at(s * 54, 56 - i * 15, s * (8 + i * 9), () => { g.shape(LEAF(22, 7), { h: 0.54, dome: 0.3, blur: 2 }); });
    }
  }
  const bolt = 'M14 -84L-30 6L-4 6L-22 84L34 -14L6 -14L28 -84Z';
  g.shape(bolt, { h: 0.66, dome: 0.3, blur: 5 });
  g.groove('M18 -76L-18 0M-8 72L24 -8', 1.2, 0.7);
  for (const [x, y] of [[-40, -50], [44, 40], [-46, 50]]) g.shape(STAR(x, y, 6, 4, 0.3), { h: 0.7, dome: 0.3, blur: 1 });
};

M.ra = (g) => {
  for (let i = 0; i < 24; i++) g.at(0, -20, i * 15, () => g.ridge('M0 -60L0 -76', 2, 0.55));
  g.shape(C(0, -20, 30), { h: 0.52, dome: 0.3, blur: 8 });
  const eye = 'M-60 0C-36 -26 36 -26 60 0C36 22 -36 22 -60 0Z';
  g.shape(eye, { h: 0.6, dome: 0.2, blur: 4 });
  g.shape(C(0, -2, 14), { h: 0.7, dome: 0.4, blur: 2 });
  g.pit(C(0, -2, 6), 0.5);
  g.ridge('M-60 0L-72 -4M-64 -12C-40 -36 40 -36 64 -12', 3, 0.66);
  g.ridge('M-10 16C-14 36 -6 52 6 60C18 66 24 54 16 48M14 14L26 52', 3.4, 0.66);
};

M.weltenbaum = (g) => {
  const trunk = 'M-10 40C-12 10 -8 -10 -4 -24L4 -24C8 -10 12 10 10 40Z';
  g.shape(trunk, { h: 0.6, dome: 0.25, blur: 4 });
  g.hatch(trunk, { angle: 90, gap: 4, w: 0.7, depth: 0.78, wave: 1 });
  const crownD = C(0, -46, 30) + C(-34, -34, 24) + C(34, -34, 24) + C(-20, -66, 20) + C(20, -66, 20) + C(-52, -12, 16) + C(52, -12, 16);
  g.shape(crownD, { h: 0.6, dome: 0.4, blur: 12 });
  g.stipple(crownD, { n: 90, r: 1.6, depth: 0.74 });
  g.ridge('M0 -24C-10 -36 -24 -40 -36 -34M0 -24C10 -36 24 -40 36 -34M0 -30L0 -60', 3, 0.62);
  // Wurzeln bis an den Rand
  g.ridge('M-8 40C-20 54 -40 58 -66 54M-4 44C-10 60 -20 72 -34 78M0 44L0 82M4 44C10 60 20 72 34 78M8 40C20 54 40 58 66 54', 4, 0.6);
  g.groove(C(0, 0, 80), 1.2, 0.72);
};

// ═══ Galaktisch ═══
M.schwarzesloch = (g) => {
  g.at(0, 0, -18, () => {
    g.shape(E(0, 0, 80, 26), { h: 0.56, dome: 0.3, blur: 6 });
    g.groove(E(0, 0, 70, 21) + E(0, 0, 58, 17) + E(0, 0, 46, 13), 1, 0.7);
  });
  g.shape(C(0, 0, 32), { h: 0.62, dome: 0.4, blur: 6 });
  g.pit(C(0, 0, 26), 0.35, 6);
  g.ridge(spiral(0, 0, 34, 76, 1.2, 40), 2, 0.55);
  g.ridge(spiral(0, 0, 34, 76, 1.2, 220), 2, 0.55);
  for (const [x, y] of [[-60, -56], [62, 50], [56, -62], [-66, 46]]) g.shape(STAR(x, y, 5, 4, 0.3), { h: 0.66, dome: 0.3, blur: 1 });
};

M.komet = (g) => {
  for (const [w, a] of [[34, -132], [22, -122], [22, -142]]) g.at(34, -30, a, () => g.shape(FLAME(130, w, 0.35), { h: 0.5, dome: 0.25, blur: 6 }));
  g.at(34, -30, -132, () => g.hatch(FLAME(130, 34, 0.35), { angle: 90, gap: 6, w: 0.7, depth: 0.82 }));
  g.shape(C(34, -30, 20), { h: 0.68, dome: 0.45, blur: 5 });
  g.shape(STAR(34, -30, 30, 8, 0.25), { h: 0.6, dome: 0.2, blur: 2 });
  for (const [x, y, r] of [[-56, -50, 6], [-62, 10, 4], [60, 40, 6], [20, 60, 4], [-20, -70, 4]]) g.shape(STAR(x, y, r, 4, 0.3), { h: 0.66, dome: 0.3, blur: 1 });
  g.ridge('M-70 30C-40 50 0 60 40 70', 1.4, 0.55);
};

// ═══ Unerreichbar ═══
M.unendlich = (g) => {
  const pts = [];
  for (let i = 0; i <= 200; i++) {
    const t = (i / 200) * TAU;
    const d = 1 + Math.sin(t) ** 2;
    pts.push([(76 * Math.cos(t)) / d, (76 * Math.sin(t) * Math.cos(t)) / d]);
  }
  g.shape(tube(pts, 22, 22), { h: 0.62, dome: 0.4, blur: 8 });
  g.groove(L(pts), 1.4, 0.7);
  for (let i = 0; i < 16; i++) g.at(0, 0, i * 22.5, () => g.ridge('M0 -60L0 -72', 1.6, 0.55));
  for (const [x, y] of [[0, -46], [0, 46]]) g.shape(STAR(x, y, 8, 4, 0.3), { h: 0.7, dome: 0.3, blur: 1 });
};

M.huhn = (g) => {
  const body = 'M-50 30C-60 0 -40 -30 -10 -30C0 -50 10 -66 28 -64C44 -62 50 -46 44 -30C60 -20 62 10 50 30C36 52 -30 54 -50 30Z';
  g.shape(body, { h: 0.6, dome: 0.38, blur: 12 });
  g.at(-10, 6, 0, () => wing(g, { n: 5, a0: -80, a1: -40, l0: 44, l1: 30, w: 9, coverts: false }), -1, 1);
  for (const [x, y] of [[20, -74], [30, -78], [40, -72]]) g.shape(C(x, y, 6), { h: 0.66, dome: 0.4, blur: 1.5 }); // Kamm
  g.shape(P([[46, -50], [62, -44], [46, -40]]), { h: 0.7, dome: 0.2, blur: 1 });
  g.shape(E(46, -34, 4, 7), { h: 0.64, dome: 0.3, blur: 1 });
  g.pit(C(34, -52, 3), 0.5);
  for (const a of [210, 230, 250]) g.at(-50, 10, a, () => g.shape(LEAF(36, 10), { h: 0.58, dome: 0.3, blur: 2 }));
  g.ridge('M-10 50L-14 66L-22 70M-14 66L-8 72M14 50L12 66L4 70M12 66L18 72', 2.4, 0.6);
  for (const [x, y] of [[50, 64], [64, 54], [36, 70]]) g.shape(E(x, y, 9, 4), { h: 0.7, dome: 0.3, blur: 1 }); // Münzen statt Eier
};

// ═══ Premium (aus dem Münzlabor) ═══
M.pixel = (g) => {
  // 8-Bit-Herz aus Würfeln, daneben kleine hüpfende Pixel
  const rows = ['.XX..XX.', 'XXXXXXXX', 'XXXXXXXX', 'XXXXXXXX', '.XXXXXX.', '..XXXX..', '...XX...'];
  const s = 15;
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch !== 'X') return;
    const px = -60 + x * s, py = -56 + y * s;
    g.shape(R(px + 1, py + 1, s - 2, s - 2, 1.5), { h: 0.58 + ((x + y) % 2) * 0.04, dome: 0.12, blur: 1.5 });
    g.groove(`M${px + 3} ${py + 3}L${px + s - 5} ${py + 3}`, 0.9, 0.85);
  }));
  for (const [x, y] of [[-64, 62], [-46, 70], [50, 66], [66, 56]]) g.shape(R(x, y, 9, 9, 1), { h: 0.62, dome: 0.1, blur: 1 });
};

M.magma = (g) => {
  const rock = polar(0, 0, 18, (a, i) => 74 + Math.sin(i * 1.9) * 5);
  g.shape(rock, { h: 0.56, dome: 0.35, blur: 12 });
  g.stipple(rock, { n: 120, r: 1.5, depth: 0.74 });
  // Lava-Adern als tiefe Risse
  const veins = 'M-64 -20L-30 -10L-20 -40L0 -20L24 -52M0 -20L10 10L44 6L66 22M10 10L-6 40L-40 46M-6 40L14 66M-30 -10L-50 24';
  g.groove(veins, 5, 0.42);
  g.groove(veins, 2, 0.75);
  g.shape(C(10, 10, 12), { h: 0.48, dome: 0.5, blur: 4 }); // glühender Kern
};

M.lotus = (g) => {
  for (const [a, l, w, h] of [[-75, 58, 20, 0.52], [75, 58, 20, 0.52], [-48, 68, 22, 0.56], [48, 68, 22, 0.56], [-22, 74, 22, 0.6], [22, 74, 22, 0.6], [0, 78, 24, 0.64]]) {
    g.at(0, 34, a, () => { g.shape(LEAF(l, w), { h, dome: 0.35, blur: 6 }); g.groove(`M0 -6L0 ${-l + 10}`, 0.9, 0.72); });
  }
  g.shape('M-72 46C-40 30 40 30 72 46C50 60 -50 60 -72 46Z', { h: 0.5, dome: 0.25, blur: 6 });
  g.groove('M-60 46Q0 36 60 46', 1, 0.72);
  for (const [x, y] of [[-60, -50], [62, -40], [-40, -70]]) g.at(x, y, 30, () => g.shape(LEAF(14, 6), { h: 0.6, dome: 0.3, blur: 1 }));
};

const gear = (g, x, y, r, teeth, h = 0.6) => {
  const d = polar(x, y, teeth * 4, (a, i) => (Math.floor(i / 2) % 2 ? r : r + 9));
  g.shape(d, { h, dome: 0.2, blur: 3 });
  g.cut(C(x, y, r * 0.35));
  g.groove(C(x, y, r * 0.7), 1, 0.7);
  for (let i = 0; i < 4; i++) g.at(x, y, i * 45, () => g.pit(R(-2, -r * 0.62, 4, r * 0.24, 1), 0.7));
};
M.uhrwerk = (g) => {
  gear(g, -18, 12, 42, 10, 0.58);
  gear(g, 40, -34, 24, 7, 0.62);
  gear(g, 36, 46, 18, 6, 0.64);
  g.groove(C(0, 0, 80), 2, 0.7); // Sichtfenster
  g.at(-18, 12, 0, () => { g.ridge('M0 0L0 -30', 3, 0.72); g.ridge('M0 0L22 6', 3, 0.72); });
};

M.galaxie = (g) => {
  g.shape(C(0, 0, 18), { h: 0.64, dome: 0.5, blur: 6 });
  for (const s of [0, 180]) {
    g.ridge(spiral(0, 0, 14, 70, 0.9, s), 9, 0.56);
    g.ridge(spiral(0, 0, 14, 70, 0.9, s), 3, 0.62);
  }
  g.stipple(C(0, 0, 76), { n: 60, r: 1.4, depth: 0.7 });
  g.at(0, 0, -20, () => g.ridge(E(0, 0, 84, 22), 3.4, 0.62)); // Saturn-Ring
  for (const [x, y] of [[-56, -48], [54, 52], [60, -40]]) g.shape(STAR(x, y, 6, 4, 0.3), { h: 0.68, dome: 0.3, blur: 1 });
};

M.prisma = (g) => {
  const out = P([[0, -82], [54, -40], [54, 40], [0, 82], [-54, 40], [-54, -40]]);
  g.shape(out, { h: 0.58, dome: 0.1, blur: 4 });
  g.groove(L([[0, -82], [0, -30], [54, -40]]) + L([[0, -30], [-54, -40]]) + L([[0, -30], [-30, 10], [-54, 40]]) + L([[0, -30], [30, 10], [54, 40]]) + L([[-30, 10], [0, 82], [30, 10]]) + L([[-30, 10], [30, 10]]), 1.3, 0.66);
  g.bump(P([[0, -30], [30, 10], [-30, 10]]), 0.3, 2);
  g.shape(P([[0, -14], [14, 4], [0, 22], [-14, 4]]), { h: 0.72, dome: 0.2, blur: 1 }); // Edelstein-Herz
  for (const [x, y] of [[-62, -60], [64, -62], [66, 62]]) g.shape(STAR(x, y, 7, 4, 0.3), { h: 0.66, dome: 0.3, blur: 1 });
};

M.drachenauge = (g) => {
  const lid = 'M-80 0C-50 -50 50 -50 80 0C50 50 -50 50 -80 0Z';
  g.shape(C(0, 0, 80), { h: 0.5, dome: 0.15, blur: 6 });
  g.scales(C(0, 0, 80), { r: 8, w: 1, depth: 0.72 });
  g.shape(lid, { h: 0.6, dome: 0.25, blur: 4 });
  g.shape(C(0, 0, 32), { h: 0.66, dome: 0.4, blur: 4 });
  for (let i = 0; i < 18; i++) g.at(0, 0, i * 20, () => g.groove('M0 -10L0 -30', 0.8, 0.75));
  g.pit(E(0, 0, 6, 28), 0.42, 1);
  g.shape(C(-10, -12, 4), { h: 0.78, dome: 0.4, blur: 1 }); // Glanzpunkt
};

M.glitch = (g) => {
  // eine Münze, in Streifen verschoben
  const bands = [[-70, -40, 8], [-40, -14, -10], [-14, 10, 14], [10, 34, -6], [34, 70, 6]];
  for (const [y0, y1, dx] of bands) {
    g.shape(C(dx, 0, 66), { h: 0.56, dome: 0.25, blur: 6, clip: R(-90, y0, 180, y1 - y0) });
    g.groove(C(dx, 0, 54), 1.2, 0.7, R(-90, y0, 180, y1 - y0));
  }
  g.ridge('M-14 -30L14 -30L14 -6L0 -6L0 10', 6, 0.7); // „?“-artiges Fehlerzeichen
  g.shape(R(-4, 20, 8, 8, 1), { h: 0.72, dome: 0.1, blur: 0.5 });
  for (const [x, y, w] of [[-80, -52, 18], [62, -20, 22], [-76, 30, 14], [58, 52, 18]]) g.shape(R(x, y, w, 5, 0), { h: 0.62, dome: 0, blur: 0 });
};

M.engelsmuenze = (g) => {
  g.at(-20, 0, 0, () => wing(g, { n: 7, a0: 0, a1: 80, l0: 70, l1: 44, w: 9 }), -1, 1);
  g.at(20, 0, 0, () => wing(g, { n: 7, a0: 0, a1: 80, l0: 70, l1: 44, w: 9 }));
  g.shape(C(0, 6, 30), { h: 0.62, dome: 0.4, blur: 6 });
  g.groove(C(0, 6, 22), 1.2, 0.7);
  g.shape(STAR(0, 6, 12, 5, 0.45), { h: 0.7, dome: 0.3, blur: 1 });
  g.ridge(E(0, -46, 30, 8), 3.4, 0.66);
};

M.mystery = (g) => {
  g.groove(C(0, 0, 78), 1.4, 0.7);
  const q = 'M-34 -34C-34 -70 34 -74 36 -36C38 -10 10 -4 8 18L8 30L-10 30L-10 14C-8 -12 18 -16 16 -36C14 -54 -14 -52 -14 -34Z';
  g.shape(q, { h: 0.64, dome: 0.35, blur: 6 });
  g.shape(C(-1, 52, 11), { h: 0.66, dome: 0.4, blur: 3 });
  for (const [x, y, r] of [[-60, -40, 7], [60, -50, 5], [56, 40, 7], [-56, 50, 5]]) g.shape(STAR(x, y, r, 4, 0.35), { h: 0.66, dome: 0.3, blur: 1 });
};

// Motive, die sonst zu nah an den Fadenkreis reichen: [Maßstab, dx, dy]
const SCALE = {};

export const EMBLEMS = Object.keys(M);

let seedCounter = 1;
// Zeichnet ein Motiv auf `size`×`size` Pixel in der Metallpalette [hell, mittel, dunkel].
export function renderEmblem(key, size, pal) {
  const fn = M[key] || M.mystery;
  const sc = SCALE[key];
  const draw = sc ? (g) => g.at(sc[1], sc[2], 0, () => fn(g), sc[0]) : fn;
  const g = new Relief(size, [...key].reduce((s, ch) => s * 31 + ch.charCodeAt(0), 7) || seedCounter++);
  draw(g);
  return g.finish(pal);
}
