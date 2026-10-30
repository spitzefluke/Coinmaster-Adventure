// Baut aus einem Ei-Datensatz ein animierbares 3D-Objekt.
//
// Aufbau:
//   root
//   ├─ pedestal  Sockel mit leuchtendem Rand (optional)
//   ├─ fx        bleibt aufrecht: Glühen, Strahlen, Partikel, Ringe
//   └─ spinner   dreht sich
//      ├─ shell  die Schale, aufgeteilt in Scherben (sieht ganz aus, kann beim Schlüpfen zerspringen)
//      └─ decor  am Ei befestigte Extras: Ranke, Flügel, Kristalle, Schleife …
//
// Die Schale wird wie die Münzprägung auf Canvas gemalt: Farbe, Höhe (→ Normal-Map),
// Rauheit, Metall und Leuchten. Jedes Ei hat seinen eigenen Maler in SKINS.

import * as THREE from 'three';
import { glowSprite, particles, raysTexture, wingShape } from '../../muenzen/js/coinFactory.js';

const TAU = Math.PI * 2;
export const EGG_H = 1.35; // halbe Höhe
const EGG_R = 1;
const BULGE = 0.14; // unten etwas bauchiger als oben

export function eggRadiusAt(y) {
  const t = Math.acos(Math.max(-1, Math.min(1, -y / EGG_H)));
  return Math.sin(t) * EGG_R * (1 + BULGE * Math.cos(t));
}

function seeded(seed) {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
const gray = (v) => {
  const n = Math.round(Math.min(1, Math.max(0, v)) * 255);
  return `rgb(${n},${n},${n})`;
};

// ── Schale malen ─────────────────────────────────────────────────────────────
// Lathe-UVs: u läuft einmal ums Ei, v von unten (0) nach oben (1). Das Canvas ist breiter als
// hoch (Umfang ≈ 1,5 × Höhe), damit Kreise auf dem Ei rund bleiben. Gezeichnet wird dreimal
// versetzt (−W, 0, +W), damit Muster über die Naht laufen.

class Skin {
  constructor(W, H, glowing) {
    this.W = W;
    this.H = H;
    const mk = () => {
      const cv = document.createElement('canvas');
      cv.width = W;
      cv.height = H;
      return cv.getContext('2d', { willReadFrequently: true });
    };
    this.layers = { color: mk(), height: mk(), rough: mk(), metal: mk(), glow: glowing ? mk() : null };
  }

  // draw(ctx, style, key): style ist die Füllung der Ebene, key der Ebenenname
  paint(draw, styles) {
    for (const [key, ctx] of Object.entries(this.layers)) {
      if (!ctx) continue;
      let style = styles[key];
      if (style === undefined || style === null) continue;
      if (typeof style === 'number') style = gray(style);
      for (const dx of [-this.W, 0, this.W]) {
        ctx.save();
        ctx.translate(dx, 0);
        draw(ctx, style, key);
        ctx.restore();
      }
    }
  }

  // Senkrechter Verlauf als Grund; top/bottom sind Farben
  base(top, bottom, { height = 0.45, rough = 0.5, metal = 0 } = {}) {
    const { W, H } = this;
    const g = this.layers.color.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, top);
    g.addColorStop(1, bottom);
    this.layers.color.fillStyle = g;
    this.layers.color.fillRect(0, 0, W, H);
    for (const [key, v] of [['height', height], ['rough', rough], ['metal', metal]]) {
      this.layers[key].fillStyle = gray(v);
      this.layers[key].fillRect(0, 0, W, H);
    }
    if (this.layers.glow) {
      this.layers.glow.fillStyle = '#000';
      this.layers.glow.fillRect(0, 0, W, H);
    }
  }
}

function polyline(ctx, pts) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
}

function starPath(ctx, x, y, r, points = 5, inner = 0.45, rot = 0) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const a = (i / (points * 2)) * TAU - Math.PI / 2 + rot;
    const rr = i % 2 ? r * inner : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
}

const SKINS = {
  normal(s, rnd) {
    const { W, H } = s;
    s.base('#fdf6e6', '#dcc497', { height: 0.45, rough: 0.6 });
    // Zickzack-Band
    for (const [y, amp, col, lw] of [[0.5, 22, '#c98a3b', 14], [0.5, 22, '#f4d79b', 5], [0.585, 10, '#b5762e', 6], [0.415, 10, '#b5762e', 6]]) {
      const pts = [];
      for (let x = 0; x <= W; x += W / 32) pts.push([x, H * y + ((x / (W / 32)) % 2 ? -amp : amp)]);
      s.paint((ctx, st) => {
        ctx.strokeStyle = st;
        ctx.lineWidth = lw;
        ctx.lineJoin = 'round';
        polyline(ctx, pts);
        ctx.stroke();
      }, { color: col, height: 0.62, rough: 0.45 });
    }
    // Sprenkel, oben dichter
    const spots = Array.from({ length: 520 }, () => {
      const y = Math.pow(rnd(), 1.6) * H;
      return { x: rnd() * W, y, rx: 2 + rnd() * 9, ry: 2 + rnd() * 6, a: rnd() * TAU, c: ['#8a5a2b', '#a8743d', '#6b4423', '#b98a55'][Math.floor(rnd() * 4)] };
    });
    s.paint((ctx, st, key) => {
      for (const p of spots) {
        if (Math.abs(p.y - H * 0.5) < H * 0.11) continue;
        ctx.fillStyle = key === 'color' ? p.c : st;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.rx, p.ry, p.a, 0, TAU);
        ctx.fill();
      }
    }, { color: '#000', height: 0.52 });
  },

  wald(s, rnd) {
    const { W, H } = s;
    s.base('#b9e47a', '#24461f', { height: 0.42, rough: 0.75 });
    // Moos unten
    const moss = Array.from({ length: 3200 }, () => ({ x: rnd() * W, y: H - Math.pow(rnd(), 1.8) * H * 0.42, r: 1 + rnd() * 3.2, c: ['#2f5a24', '#4f7f2e', '#6c9a3a', '#1f3d18'][Math.floor(rnd() * 4)], h: 0.42 + rnd() * 0.22 }));
    s.paint((ctx, st, key) => {
      for (const m of moss) {
        ctx.fillStyle = key === 'color' ? m.c : key === 'height' ? gray(m.h) : st;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, TAU);
        ctx.fill();
      }
    }, { color: '#000', height: 0.5, rough: 0.9 });
    // Blätter mit Adern
    const leaves = Array.from({ length: 130 }, () => ({ x: rnd() * W, y: H * (0.05 + rnd() * 0.62), l: 22 + rnd() * 26, w: 8 + rnd() * 6, a: rnd() * TAU, c: ['#5aa83a', '#7cc04a', '#3f8a2c', '#94d05a'][Math.floor(rnd() * 4)] }));
    s.paint((ctx, st, key) => {
      for (const f of leaves) {
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.a);
        ctx.fillStyle = key === 'color' ? f.c : st;
        ctx.beginPath();
        ctx.moveTo(-f.l, 0);
        ctx.quadraticCurveTo(0, -f.w * 1.6, f.l, 0);
        ctx.quadraticCurveTo(0, f.w * 1.6, -f.l, 0);
        ctx.fill();
        ctx.restore();
      }
    }, { color: '#000', height: 0.62, rough: 0.55 });
    s.paint((ctx, st) => {
      ctx.strokeStyle = st;
      ctx.lineWidth = 1.6;
      for (const f of leaves) {
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.a);
        ctx.beginPath();
        ctx.moveTo(-f.l * 0.9, 0);
        ctx.lineTo(f.l * 0.9, 0);
        for (let k = -2; k <= 2; k++) {
          ctx.moveTo(k * f.l * 0.3, 0);
          ctx.lineTo(k * f.l * 0.3 + f.l * 0.18, -f.w * 0.7);
          ctx.moveTo(k * f.l * 0.3, 0);
          ctx.lineTo(k * f.l * 0.3 + f.l * 0.18, f.w * 0.7);
        }
        ctx.stroke();
        ctx.restore();
      }
    }, { color: '#2c5a20', height: 0.5 });
    // leuchtende Sporen
    const spores = Array.from({ length: 46 }, () => ({ x: rnd() * W, y: H * (0.15 + rnd() * 0.75), r: 3 + rnd() * 5 }));
    s.paint((ctx, st) => {
      for (const p of spores) {
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2.4);
        g.addColorStop(0, st);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 2.4, 0, TAU);
        ctx.fill();
      }
    }, { color: '#d8ff8a', glow: '#c8ff5a' });
  },

  eis(s, rnd) {
    const { W, H } = s;
    s.base('#f4feff', '#2f86c9', { height: 0.45, rough: 0.07, metal: 0.15 });
    // Inneres Leuchten von unten
    const lg = s.layers.glow.createLinearGradient(0, H, 0, 0);
    lg.addColorStop(0, 'rgba(60,200,255,0.55)');
    lg.addColorStop(0.6, 'rgba(60,200,255,0.05)');
    s.layers.glow.fillStyle = lg;
    s.layers.glow.fillRect(0, 0, W, H);
    // Kristall-Facetten: gerade Bruchkanten
    const facets = [];
    for (let i = 0; i < 70; i++) {
      let x = rnd() * W, y = rnd() * H;
      const pts = [[x, y]];
      for (let k = 0; k < 3 + rnd() * 4; k++) {
        x += (rnd() - 0.5) * 140;
        y += (rnd() - 0.5) * 110;
        pts.push([x, y]);
      }
      facets.push(pts);
    }
    s.paint((ctx, st) => {
      ctx.strokeStyle = st;
      ctx.lineWidth = 2.2;
      facets.forEach((p) => (polyline(ctx, p), ctx.stroke()));
    }, { color: '#dff7ff', height: 0.3, rough: 0.3 });
    // Eisblumen: verzweigte Äste
    const branches = [];
    const grow = (x, y, a, len, depth) => {
      const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
      branches.push([x, y, x2, y2, depth]);
      if (depth <= 0) return;
      for (const da of [-0.6, 0.6]) if (rnd() < 0.85) grow(x2, y2, a + da + (rnd() - 0.5) * 0.3, len * 0.62, depth - 1);
      grow(x2, y2, a + (rnd() - 0.5) * 0.25, len * 0.75, depth - 1);
    };
    for (let i = 0; i < 16; i++) grow(rnd() * W, i % 2 ? H * (0.02 + rnd() * 0.1) : H * (0.88 + rnd() * 0.1), i % 2 ? Math.PI / 2 + (rnd() - 0.5) : -Math.PI / 2 + (rnd() - 0.5), 50 + rnd() * 30, 4);
    s.paint((ctx, st) => {
      ctx.strokeStyle = st;
      ctx.lineCap = 'round';
      for (const [x, y, x2, y2, d] of branches) {
        ctx.lineWidth = 0.8 + d * 0.9;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }, { color: '#ffffff', height: 0.6, rough: 0.5, glow: 'rgba(160,240,255,0.55)' });
  },

  engel(s, rnd) {
    const { W, H } = s;
    s.base('#ffffff', '#ece2d0', { height: 0.45, rough: 0.22, metal: 0.05 });
    // Federschuppen
    s.paint((ctx, st) => {
      ctx.strokeStyle = st;
      ctx.lineWidth = 2.5;
      for (let row = 0, y = 12; y < H; row++, y += 30) {
        for (let x = (row % 2) * 22; x < W + 44; x += 44) {
          ctx.beginPath();
          ctx.arc(x, y, 22, 0.15, Math.PI - 0.15);
          ctx.stroke();
        }
      }
    }, { color: '#e9dcc4', height: 0.36, rough: 0.35 });
    // Goldbänder mit Filigran
    const gold = { color: '#e3b54a', height: 0.7, rough: 0.18, metal: 1 };
    for (const v of [0.3, 0.64]) {
      s.paint((ctx, st) => {
        ctx.fillStyle = st;
        ctx.fillRect(0, H * (1 - v) - 13, W, 26);
      }, gold);
      s.paint((ctx, st) => {
        ctx.fillStyle = st;
        for (let x = 0; x < W; x += 32) {
          ctx.beginPath();
          ctx.arc(x + 16, H * (1 - v), 5, 0, TAU);
          ctx.fill();
        }
      }, { color: '#fff6d8', height: 0.8, rough: 0.1, metal: 1 });
    }
    // Ranken zwischen den Bändern
    s.paint((ctx, st) => {
      ctx.strokeStyle = st;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      const yc = H * (1 - 0.47);
      ctx.beginPath();
      for (let x = 0; x <= W; x += 4) ctx.lineTo(x, yc + Math.sin((x / W) * TAU * 8) * 26);
      ctx.stroke();
      for (let k = 0; k < 16; k++) {
        const x = (k + 0.5) * (W / 16), up = k % 2 ? 1 : -1;
        const y0 = yc + Math.sin(((x / W) * TAU * 8)) * 26;
        ctx.beginPath();
        for (let a = 0; a < TAU * 1.3; a += 0.15) {
          const r = 22 * (1 - a / (TAU * 1.4));
          ctx.lineTo(x + Math.cos(a) * r * up, y0 + up * 26 + Math.sin(a) * r);
        }
        ctx.stroke();
      }
    }, gold);
  },

  galaxie(s, rnd) {
    const { W, H } = s;
    s.base('#1a1236', '#06040f', { height: 0.45, rough: 0.28, metal: 0.4 });
    // Nebel in Farbe und Leuchten
    const clouds = Array.from({ length: 34 }, () => ({ x: rnd() * W, y: rnd() * H, r: 70 + rnd() * 170, h: rnd() < 0.7 ? 255 + rnd() * 70 : 185 + rnd() * 30 }));
    s.paint((ctx, st, key) => {
      ctx.globalCompositeOperation = 'lighter';
      for (const c of clouds) {
        const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
        g.addColorStop(0, `hsla(${c.h},90%,${key === 'glow' ? 55 : 35}%,${key === 'glow' ? 0.35 : 0.3})`);
        g.addColorStop(1, `hsla(${c.h},90%,30%,0)`);
        ctx.fillStyle = g;
        ctx.fillRect(c.x - c.r, c.y - c.r, c.r * 2, c.r * 2);
      }
    }, { color: '#000', glow: '#000' });
    const stars = Array.from({ length: 700 }, () => ({ x: rnd() * W, y: rnd() * H, r: rnd() < 0.06 ? 2.4 : 0.6 + rnd() * 0.9, a: 0.4 + rnd() * 0.6 }));
    s.paint((ctx, st, key) => {
      for (const p of stars) {
        ctx.fillStyle = key === 'color' || key === 'glow' ? `rgba(255,255,255,${p.a})` : st;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, TAU);
        ctx.fill();
      }
    }, { color: '#fff', glow: '#fff' });
    // Sternbilder als silberne Einlage
    const constellations = Array.from({ length: 9 }, () => {
      let x = rnd() * W, y = H * (0.15 + rnd() * 0.7);
      return Array.from({ length: 4 + Math.floor(rnd() * 3) }, () => {
        const p = [x, y];
        x += (rnd() - 0.3) * 90;
        y += (rnd() - 0.5) * 70;
        return p;
      });
    });
    s.paint((ctx, st) => {
      ctx.strokeStyle = ctx.fillStyle = st;
      ctx.lineWidth = 2;
      for (const c of constellations) {
        polyline(ctx, c);
        ctx.stroke();
        for (const [x, y] of c) {
          starPath(ctx, x, y, 7, 4, 0.35);
          ctx.fill();
        }
      }
    }, { color: '#d9e2ff', height: 0.62, rough: 0.15, metal: 1 });
  },

  admin(s, rnd) {
    const { W, H } = s;
    s.base('#17171d', '#060608', { height: 0.5, rough: 0.32, metal: 0.92 });
    // Sechseck-Panzerplatten
    const hr = 34, hw = Math.sqrt(3) * hr;
    s.paint((ctx, st) => {
      ctx.strokeStyle = st;
      ctx.lineWidth = 4;
      for (let row = 0, y = 0; y < H + hr; row++, y += hr * 1.5) {
        for (let x = (row % 2) * (hw / 2); x < W + hw; x += hw) {
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * TAU + Math.PI / 6;
            ctx.lineTo(x + Math.cos(a) * hr, y + Math.sin(a) * hr);
          }
          ctx.closePath();
          ctx.stroke();
        }
      }
    }, { color: '#2a2a33', height: 0.28, rough: 0.6 });
    // Leiterbahnen
    const traces = Array.from({ length: 46 }, () => {
      let x = rnd() * W, y = rnd() * H;
      const pts = [[x, y]];
      for (let k = 0; k < 3 + rnd() * 5; k++) {
        if (k % 2) y += (rnd() - 0.5) * 120;
        else x += (rnd() - 0.5) * 160;
        pts.push([x, y]);
      }
      return pts;
    });
    s.paint((ctx, st) => {
      ctx.strokeStyle = ctx.fillStyle = st;
      ctx.lineWidth = 3;
      for (const t of traces) {
        polyline(ctx, t);
        ctx.stroke();
        for (const [x, y] of [t[0], t[t.length - 1]]) {
          ctx.beginPath();
          ctx.arc(x, y, 6, 0, TAU);
          ctx.fill();
        }
      }
    }, { color: '#ff2e48', height: 0.58, rough: 0.3, metal: 0.4, glow: '#ff2e48' });
    // Band mit Schriftzug
    const by = H * 0.5;
    s.paint((ctx, st) => {
      ctx.fillStyle = st;
      ctx.fillRect(0, by - 34, W, 68);
    }, { color: '#0d0306', height: 0.62, rough: 0.4, metal: 0.6, glow: '#000' });
    s.paint((ctx, st) => {
      ctx.strokeStyle = st;
      ctx.lineWidth = 3;
      for (const y of [by - 34, by + 34]) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      ctx.fillStyle = st;
      ctx.font = '700 40px "JetBrains Mono", ui-monospace, monospace';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      for (let k = 0; k < 4; k++) ctx.fillText('ADMIN ⬢', (k + 0.5) * (W / 4), by + 2);
    }, { color: '#ff2e48', height: 0.72, rough: 0.3, glow: '#ff3a52' });
  },

  release(s, rnd) {
    const { W, H } = s;
    s.base('#fff2b8', '#a8700f', { height: 0.45, rough: 0.22, metal: 1 });
    // Regenbogen-Emaille, schräg
    const rainbow = ['#ff4d6d', '#ff9f43', '#ffe14d', '#3ddc84', '#3ec9ff', '#7a5cff', '#ff5fd2'];
    const n = 14, step = W / n;
    s.paint((ctx, st, key) => {
      for (let i = 0; i < n + 4; i++) {
        const x = i * step - 2 * step;
        ctx.fillStyle = key === 'color' ? rainbow[i % rainbow.length] : st;
        ctx.beginPath();
        ctx.moveTo(x, H * 0.12);
        ctx.lineTo(x + step * 0.55, H * 0.12);
        ctx.lineTo(x + step * 0.55 + H * 0.3, H * 0.88);
        ctx.lineTo(x + H * 0.3, H * 0.88);
        ctx.closePath();
        ctx.fill();
      }
    }, { color: '#000', height: 0.4, rough: 0.28, metal: 0 });
    // Goldstreifen oben/unten
    for (const y of [H * 0.12, H * 0.88]) {
      s.paint((ctx, st) => {
        ctx.fillStyle = st;
        ctx.fillRect(0, y - 9, W, 18);
      }, { color: '#ffe08a', height: 0.7, rough: 0.15, metal: 1 });
    }
    // Sterne
    const stars = Array.from({ length: 40 }, () => ({ x: rnd() * W, y: rnd() < 0.5 ? rnd() * H * 0.1 : H * (0.9 + rnd() * 0.1), r: 8 + rnd() * 8, rot: rnd() }));
    s.paint((ctx, st) => {
      ctx.fillStyle = st;
      for (const p of stars) {
        starPath(ctx, p.x, p.y, p.r, 5, 0.45, p.rot);
        ctx.fill();
      }
    }, { color: '#fff4c4', height: 0.72, rough: 0.12, metal: 1 });
    // Geschenkband (senkrecht, zweimal ums Ei)
    for (const x0 of [0, W / 2]) {
      s.paint((ctx, st) => {
        ctx.fillStyle = st;
        ctx.fillRect(x0 - 34, 0, 68, H);
      }, { color: '#e0243a', height: 0.66, rough: 0.45, metal: 0.1 });
      s.paint((ctx, st) => {
        ctx.fillStyle = st;
        ctx.fillRect(x0 - 38, 0, 6, H);
        ctx.fillRect(x0 + 32, 0, 6, H);
      }, { color: '#ffd76a', height: 0.72, rough: 0.15, metal: 1 });
    }
    // Schriftzug
    s.paint((ctx, st) => {
      ctx.fillStyle = st;
      ctx.font = '700 46px "Marcellus SC", Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const x of [W * 0.25, W * 0.75]) ctx.fillText('RELEASE', x, H * 0.5);
    }, { color: '#ffffff', height: 0.75, rough: 0.2, metal: 0 });
  },
};

// Höhenbild → Normal-Map; in x wird um die Naht herum gelesen
function heightToNormal(hctx, W, H, strength) {
  const src = hctx.getImageData(0, 0, W, H).data;
  const out = new ImageData(W, H);
  const o = out.data;
  const h = (x, y) => src[(Math.min(H - 1, Math.max(0, y)) * W + ((x + W) % W)) * 4] / 255;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const dx = (h(x + 1, y - 1) + 2 * h(x + 1, y) + h(x + 1, y + 1) - h(x - 1, y - 1) - 2 * h(x - 1, y) - h(x - 1, y + 1)) * strength;
      const dy = (h(x - 1, y + 1) + 2 * h(x, y + 1) + h(x + 1, y + 1) - h(x - 1, y - 1) - 2 * h(x, y - 1) - h(x + 1, y - 1)) * strength;
      const inv = 1 / Math.hypot(dx, dy, 1);
      const i = (y * W + x) * 4;
      o[i] = (-dx * inv * 0.5 + 0.5) * 255;
      o[i + 1] = (dy * inv * 0.5 + 0.5) * 255;
      o[i + 2] = (inv * 0.5 + 0.5) * 255;
      o[i + 3] = 255;
    }
  }
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  cv.getContext('2d').putImageData(out, 0, 0);
  return cv;
}

// ── Scherben ─────────────────────────────────────────────────────────────────
// Jedes Dreieck der Schale gehört zur nächstgelegenen von `count` Richtungen (Voronoi auf der
// Kugel). So ergibt sich ein lückenloses Ei aus Scherben, die einzeln wegfliegen können.

function buildShards(geo, count, rnd) {
  const g = geo.toNonIndexed();
  const pos = g.attributes.position.array, nor = g.attributes.normal.array, uv = g.attributes.uv.array;
  const seeds = Array.from({ length: count }, () => new THREE.Vector3(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1).normalize());
  const groups = seeds.map(() => ({ p: [], n: [], u: [] }));
  const c = new THREE.Vector3();
  for (let t = 0; t < pos.length / 9; t++) {
    c.set(0, 0, 0);
    for (let k = 0; k < 3; k++) c.x += pos[t * 9 + k * 3], c.y += pos[t * 9 + k * 3 + 1] / EGG_H, c.z += pos[t * 9 + k * 3 + 2];
    c.normalize();
    let best = 0, bd = -2;
    seeds.forEach((s, i) => {
      const d = s.dot(c);
      if (d > bd) (bd = d), (best = i);
    });
    const gr = groups[best];
    for (let k = 0; k < 9; k++) gr.p.push(pos[t * 9 + k]), gr.n.push(nor[t * 9 + k]);
    for (let k = 0; k < 6; k++) gr.u.push(uv[t * 6 + k]);
  }
  g.dispose();
  return groups
    .filter((gr) => gr.p.length)
    .map((gr) => {
      const bg = new THREE.BufferGeometry();
      bg.setAttribute('position', new THREE.Float32BufferAttribute(gr.p, 3));
      bg.setAttribute('normal', new THREE.Float32BufferAttribute(gr.n, 3));
      bg.setAttribute('uv', new THREE.Float32BufferAttribute(gr.u, 2));
      bg.computeBoundingBox();
      const center = bg.boundingBox.getCenter(new THREE.Vector3());
      bg.translate(-center.x, -center.y, -center.z);
      return { geometry: bg, center };
    });
}

// ── Extras ───────────────────────────────────────────────────────────────────

function leafShape(len = 0.3, w = 0.1) {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.quadraticCurveTo(w * 1.6, len * 0.5, 0, len);
  s.quadraticCurveTo(-w * 1.6, len * 0.5, 0, 0);
  return s;
}

function canvasTex(w, h, draw) {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ── Ei ───────────────────────────────────────────────────────────────────────

export function createEgg(egg, { resolution = 1024, pedestal = true } = {}) {
  const rnd = seeded(egg.id.length * 7919 + egg.rank * 104729);
  const root = new THREE.Group();
  const spinner = new THREE.Group();
  const shell = new THREE.Group();
  const decor = new THREE.Group();
  const fx = new THREE.Group();
  spinner.add(shell, decor);
  root.add(fx, spinner);

  const disposables = [];
  const track = (o) => (disposables.push(o), o);
  const updaters = [];
  const onUpdate = (fn) => updaters.push(fn);
  const accent = new THREE.Color(egg.glow);

  // Schale
  const W = resolution, H = Math.round(resolution * 0.69);
  const glowing = ['wald', 'eis', 'galaxie', 'admin'].includes(egg.id);
  const skin = new Skin(W, H, glowing);
  SKINS[egg.id](skin, rnd);
  const tex = (cv, srgb) => {
    const t = track(new THREE.CanvasTexture(cv));
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.wrapS = THREE.RepeatWrapping;
    t.anisotropy = 8;
    return t;
  };
  const L = skin.layers;
  const blurred = document.createElement('canvas');
  blurred.width = W;
  blurred.height = H;
  const bctx = blurred.getContext('2d', { willReadFrequently: true });
  bctx.filter = 'blur(1px)';
  bctx.drawImage(L.height.canvas, 0, 0);
  const shellMat = track(
    new THREE.MeshPhysicalMaterial({
      map: tex(L.color.canvas, true),
      normalMap: tex(heightToNormal(bctx, W, H, 2.4 * (resolution / 1024)), false),
      roughnessMap: tex(L.rough.canvas, false),
      metalnessMap: tex(L.metal.canvas, false),
      roughness: 1,
      metalness: 1,
      clearcoat: egg.id === 'eis' || egg.id === 'engel' || egg.id === 'release' ? 1 : 0.3,
      clearcoatRoughness: 0.15,
      side: THREE.DoubleSide,
    }),
  );
  if (egg.id === 'engel') Object.assign(shellMat, { iridescence: 0.7, iridescenceIOR: 1.4, sheen: 1, sheenColor: new THREE.Color('#fff0d0') });
  if (egg.id === 'eis') Object.assign(shellMat, { iridescence: 0.35 });
  if (glowing) {
    shellMat.emissiveMap = tex(L.glow.canvas, true);
    shellMat.emissive = new THREE.Color('#ffffff');
    shellMat.emissiveIntensity = egg.id === 'eis' ? 0.9 : 1.3;
  }
  const geo = track(new THREE.LatheGeometry(
    Array.from({ length: 97 }, (_, i) => {
      const t = (i / 96) * Math.PI;
      return new THREE.Vector2(Math.max(1e-4, Math.sin(t) * EGG_R * (1 + BULGE * Math.cos(t))), -Math.cos(t) * EGG_H);
    }),
    128,
  ));
  const shards = buildShards(geo, 18, rnd).map(({ geometry, center }) => {
    track(geometry);
    const m = new THREE.Mesh(geometry, shellMat);
    m.position.copy(center);
    m.userData.home = center.clone();
    shell.add(m);
    return m;
  });

  // Sockel
  let pedestalGroup = null;
  if (pedestal) {
    pedestalGroup = new THREE.Group();
    const stone = new THREE.Mesh(
      track(new THREE.CylinderGeometry(1.25, 1.45, 0.34, 64)),
      track(new THREE.MeshStandardMaterial({ color: '#2a2532', metalness: 0.5, roughness: 0.45 })),
    );
    const top = new THREE.Mesh(
      track(new THREE.CylinderGeometry(1.12, 1.18, 0.08, 64)),
      track(new THREE.MeshStandardMaterial({ color: '#3a3346', metalness: 0.8, roughness: 0.3 })),
    );
    top.position.y = 0.2;
    const rim = new THREE.Mesh(
      track(new THREE.TorusGeometry(1.19, 0.025, 8, 96)),
      track(new THREE.MeshBasicMaterial({ color: accent })),
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.2;
    pedestalGroup.add(stone, top, rim);
    pedestalGroup.position.y = -EGG_H - 0.22;
    root.add(pedestalGroup);
    onUpdate((t) => rim.material.color.copy(accent).multiplyScalar(0.75 + Math.sin(t * 2) * 0.25));
  }

  const glow = glowSprite(accent, 3.8 + egg.rank * 0.25, 0.35 + egg.rank * 0.05);
  glow.scale.y *= 1.25;
  fx.add(glow);

  // ── Ei-spezifische Extras ──
  if (egg.id === 'normal') {
    // Strohnest aus vielen Halmen
    const straw = track(new THREE.CylinderGeometry(0.014, 0.014, 0.75, 5));
    const mat = track(new THREE.MeshStandardMaterial({ color: '#d4ad62', roughness: 0.85 }));
    const n = 150;
    const nest = new THREE.InstancedMesh(straw, mat, n);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    const col = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const a = rnd() * TAU, r = 0.72 + rnd() * 0.42, y = -EGG_H + 0.08 + rnd() * 0.28;
      e.set((rnd() - 0.5) * 0.9, -a, Math.PI / 2 + (rnd() - 0.5) * 0.6);
      q.setFromEuler(e);
      m.compose(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r), q, new THREE.Vector3(1, 0.8 + rnd() * 0.5, 1));
      nest.setMatrixAt(i, m);
      nest.setColorAt(i, col.set(['#d4ad62', '#b98d45', '#e8c983', '#9c7436'][Math.floor(rnd() * 4)]));
    }
    root.add(nest);
    const motes = particles(24, '#ffe7b0', 0.07);
    fx.add(motes);
    const seeds = Array.from({ length: 24 }, () => [rnd() * TAU, 1.1 + rnd() * 0.6, rnd() * 2.5 - 1.2, rnd() * 6]);
    onUpdate((t) => {
      const p = motes.geometry.attributes.position, c = motes.geometry.attributes.color;
      seeds.forEach(([a, r, y, ph], i) => {
        p.setXYZ(i, Math.cos(a + t * 0.1) * r, y + Math.sin(t * 0.4 + ph) * 0.2, Math.sin(a + t * 0.1) * r);
        const b = 0.3 + 0.3 * Math.sin(t * 1.5 + ph);
        c.setXYZ(i, b, b, b);
      });
      p.needsUpdate = c.needsUpdate = true;
    });
  }

  if (egg.id === 'wald') {
    // Ranke als Spirale um die Schale
    const pts = [];
    for (let i = 0; i <= 60; i++) {
      const y = -EGG_H * 0.92 + (i / 60) * EGG_H * 1.78;
      const a = i * 0.36;
      const r = eggRadiusAt(y) + 0.035;
      pts.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const vine = new THREE.Mesh(
      track(new THREE.TubeGeometry(curve, 240, 0.038, 8)),
      track(new THREE.MeshStandardMaterial({ color: '#3d6b2a', roughness: 0.7 })),
    );
    decor.add(vine);
    const leafGeo = track(new THREE.ShapeGeometry(leafShape(0.32, 0.11), 6));
    const leafMat = track(new THREE.MeshStandardMaterial({ color: '#5fae3c', emissive: '#244a14', roughness: 0.5, side: THREE.DoubleSide }));
    for (let i = 1; i < 26; i++) {
      const p = curve.getPoint(i / 26);
      const out = new THREE.Vector3(p.x, 0, p.z).normalize();
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.copy(p).addScaledVector(out, 0.02);
      leaf.lookAt(p.clone().addScaledVector(out, 1));
      leaf.rotateZ((i % 2 ? 1 : -1) * (0.9 + rnd() * 0.5));
      leaf.rotateX(-0.5);
      decor.add(leaf);
    }
    // Pilze am Fuß
    const capMat = track(new THREE.MeshStandardMaterial({ color: '#d8322e', roughness: 0.4 }));
    const stemMat = track(new THREE.MeshStandardMaterial({ color: '#f3ead8', roughness: 0.6 }));
    const dotMat = track(new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.5 }));
    for (const [a, s] of [[0.4, 1], [2.3, 0.75], [4.4, 0.9]]) {
      const g = new THREE.Group();
      const stem = new THREE.Mesh(track(new THREE.CylinderGeometry(0.05, 0.07, 0.24, 12)), stemMat);
      stem.position.y = 0.12;
      const cap = new THREE.Mesh(track(new THREE.SphereGeometry(0.17, 20, 12, 0, TAU, 0, Math.PI / 2)), capMat);
      cap.position.y = 0.22;
      g.add(stem, cap);
      for (let k = 0; k < 5; k++) {
        const d = new THREE.Mesh(track(new THREE.SphereGeometry(0.025, 8, 6)), dotMat);
        const da = (k / 5) * TAU;
        d.position.set(Math.cos(da) * 0.11, 0.33, Math.sin(da) * 0.11);
        g.add(d);
      }
      g.scale.setScalar(s);
      g.position.set(Math.cos(a) * 1.0, -EGG_H - 0.02, Math.sin(a) * 1.0);
      root.add(g);
    }
    const flies = particles(30, '#d8ff6a', 0.12);
    fx.add(flies);
    const seeds = Array.from({ length: 30 }, () => [rnd() * TAU, 1.2 + rnd() * 0.7, rnd() * 2.6 - 1.2, rnd() * 6, 0.4 + rnd()]);
    onUpdate((t) => {
      const p = flies.geometry.attributes.position, c = flies.geometry.attributes.color;
      seeds.forEach(([a, r, y, ph, sp], i) => {
        const ang = a + t * 0.2 * sp;
        p.setXYZ(i, Math.cos(ang) * r, y + Math.sin(t * sp + ph) * 0.25, Math.sin(ang) * r);
        const b = Math.pow(0.5 + 0.5 * Math.sin(t * 2.5 * sp + ph), 2);
        c.setXYZ(i, b, b, b);
      });
      p.needsUpdate = c.needsUpdate = true;
    });
  }

  if (egg.id === 'eis') {
    // Eiskristalle am Fuß
    const crystalGeo = track(new THREE.OctahedronGeometry(0.16, 0));
    const crystalMat = track(
      new THREE.MeshPhysicalMaterial({ color: '#c8f2ff', emissive: '#2bb8ff', emissiveIntensity: 0.35, metalness: 0, roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.88, flatShading: true }),
    );
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * TAU + rnd() * 0.3, r = 0.85 + rnd() * 0.35;
      const c = new THREE.Mesh(crystalGeo, crystalMat);
      const s = 0.6 + rnd() * 0.9;
      c.scale.set(0.55 * s, 2.6 * s, 0.55 * s);
      c.position.set(Math.cos(a) * r, -EGG_H + 0.1 + 0.15 * s, Math.sin(a) * r);
      c.rotation.set(Math.sin(a) * 0.5, rnd(), -Math.cos(a) * 0.5);
      root.add(c);
    }
    const snow = particles(80, '#ffffff', 0.09);
    fx.add(snow);
    const seeds = Array.from({ length: 80 }, () => [(rnd() - 0.5) * 4, (rnd() - 0.5) * 3, rnd(), 0.2 + rnd() * 0.3]);
    onUpdate((t) => {
      const p = snow.geometry.attributes.position, c = snow.geometry.attributes.color;
      seeds.forEach(([x, z, off, sp], i) => {
        const life = (t * sp * 0.4 + off) % 1;
        p.setXYZ(i, x + Math.sin(t + i) * 0.15, 2.2 - life * 4.4, z);
        const b = Math.sin(life * Math.PI) * 0.9;
        c.setXYZ(i, b, b, b);
      });
      p.needsUpdate = c.needsUpdate = true;
    });
    onUpdate((t) => (shellMat.emissiveIntensity = 0.8 + Math.sin(t * 1.6) * 0.25));
  }

  if (egg.id === 'engel') {
    const wingGeo = track(new THREE.ExtrudeGeometry(wingShape(), { depth: 0.04, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2, curveSegments: 18 }));
    wingGeo.translate(0, 0, -0.04);
    const wingMat = track(new THREE.MeshPhysicalMaterial({ color: '#ffffff', emissive: '#fff3d0', emissiveIntensity: 0.3, roughness: 0.35, clearcoat: 1, iridescence: 0.5, side: THREE.DoubleSide }));
    const wings = [1, -1].map((s) => {
      const pivot = new THREE.Group();
      pivot.position.set(s * 0.82, 0.25, -0.25);
      const w = new THREE.Mesh(wingGeo, wingMat);
      w.scale.set(s * 0.95, 0.95, 1);
      pivot.add(w);
      decor.add(pivot);
      return [pivot, s];
    });
    onUpdate((t) => wings.forEach(([p, s]) => (p.rotation.y = s * (0.5 + Math.sin(t * 2.6) * 0.3))));
    const halo = new THREE.Mesh(
      track(new THREE.TorusGeometry(0.55, 0.05, 12, 64)),
      track(new THREE.MeshStandardMaterial({ color: '#ffe08a', emissive: '#ffcf4d', emissiveIntensity: 1.8, metalness: 1, roughness: 0.2 })),
    );
    halo.rotation.x = Math.PI / 2 - 0.2;
    fx.add(halo);
    const hg = glowSprite('#ffe9a8', 1.8, 0.6);
    fx.add(hg);
    onUpdate((t) => (halo.position.y = hg.position.y = EGG_H + 0.42 + Math.sin(t * 2) * 0.06));
    const motes = particles(30, '#fff1c4', 0.1);
    fx.add(motes);
    const seeds = Array.from({ length: 30 }, () => [rnd() * TAU, 1.2 + rnd() * 0.6, rnd(), 0.3 + rnd() * 0.5]);
    onUpdate((t) => {
      const p = motes.geometry.attributes.position, c = motes.geometry.attributes.color;
      seeds.forEach(([a, r, off, sp], i) => {
        const life = (t * sp * 0.3 + off) % 1;
        p.setXYZ(i, Math.cos(a + t * 0.2) * r, 2 - life * 3.8, Math.sin(a + t * 0.2) * r * 0.6);
        const b = Math.sin(life * Math.PI);
        c.setXYZ(i, b, b, b);
      });
      p.needsUpdate = c.needsUpdate = true;
    });
  }

  if (egg.id === 'galaxie') {
    const plane = new THREE.Group();
    plane.rotation.set(Math.PI / 2 - 0.42, 0, 0.18);
    fx.add(plane);
    const ringTex = track(canvasTex(512, 512, (ctx, s) => {
      const c = s / 2;
      for (let r = c * 0.69; r < c; r += 2) {
        const k = (r - c * 0.69) / (c * 0.31);
        ctx.strokeStyle = `hsla(${255 + k * 60},80%,${60 + Math.sin(r * 0.3) * 15}%,${0.25 + 0.45 * Math.abs(Math.sin(r * 0.11))})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(c, c, r, 0, TAU);
        ctx.stroke();
      }
    }));
    const ring = new THREE.Mesh(
      track(new THREE.RingGeometry(1.4, 1.95, 160)),
      track(new THREE.MeshBasicMaterial({ map: ringTex, transparent: true, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })),
    );
    plane.add(ring);
    const belt = particles(260, '#d6ccff', 0.06);
    const bp = belt.geometry.attributes.position;
    for (let i = 0; i < 260; i++) {
      const a = rnd() * TAU, r = 1.45 + rnd() * 0.5;
      bp.setXYZ(i, Math.cos(a) * r, Math.sin(a) * r, (rnd() - 0.5) * 0.06);
    }
    plane.add(belt);
    const planets = [['#ff9d5c', 0.13, 2.1, 0.5, 0], ['#5cd6ff', 0.09, 2.1, 0.5, 3]].map(([col, size, r, sp, ph]) => {
      const p = new THREE.Mesh(track(new THREE.SphereGeometry(size, 24, 16)), track(new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.5, roughness: 0.6 })));
      plane.add(p);
      return [p, r, sp, ph];
    });
    onUpdate((t) => {
      belt.rotation.z = t * 0.12;
      ring.rotation.z = t * 0.05;
      planets.forEach(([p, r, sp, ph]) => p.position.set(Math.cos(t * sp + ph) * r, Math.sin(t * sp + ph) * r, 0));
      shellMat.emissiveMap.offset.x = t * 0.01;
    });
  }

  if (egg.id === 'admin') {
    const ringMat = track(new THREE.MeshBasicMaterial({ color: '#ff2e48', transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
    const rings = [[1.55, 0.3], [1.75, -0.5]].map(([r, tilt]) => {
      const m = new THREE.Mesh(track(new THREE.TorusGeometry(r, 0.012, 6, 140)), ringMat);
      m.rotation.set(Math.PI / 2 + tilt, 0, 0);
      fx.add(m);
      return m;
    });
    // Code-Band, das sich ums Ei dreht
    const codeTex = track(canvasTex(1024, 64, (ctx, w, h) => {
      ctx.fillStyle = '#ff3a52';
      ctx.font = '600 22px "JetBrains Mono", ui-monospace, monospace';
      ctx.textBaseline = 'middle';
      let x = 0;
      const r = seeded(31);
      while (x < w) {
        const chunk = Array.from({ length: 8 }, () => (r() < 0.5 ? '0' : '1')).join('');
        ctx.globalAlpha = 0.5 + r() * 0.5;
        ctx.fillText(chunk, x, h / 2);
        x += ctx.measureText(chunk + '  ').width;
      }
    }));
    codeTex.wrapS = THREE.RepeatWrapping;
    const code = new THREE.Mesh(
      track(new THREE.CylinderGeometry(1.45, 1.45, 0.16, 96, 1, true)),
      track(new THREE.MeshBasicMaterial({ map: codeTex, transparent: true, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false })),
    );
    code.position.y = 0.55;
    fx.add(code);
    const cubes = Array.from({ length: 14 }, (_, i) => {
      const c = new THREE.Mesh(track(new THREE.BoxGeometry(0.09, 0.09, 0.09)), track(new THREE.MeshStandardMaterial({ color: i % 3 ? '#ff2e48' : '#ffffff', emissive: i % 3 ? '#ff2e48' : '#ffffff', emissiveIntensity: 1 })));
      fx.add(c);
      return [c, rnd() * TAU, 1.3 + rnd() * 0.6, (rnd() - 0.5) * 2.4, 0.3 + rnd() * 0.6];
    });
    let glitchUntil = 0;
    onUpdate((t) => {
      rings[0].rotation.z = t * 0.5;
      rings[1].rotation.z = -t * 0.35;
      code.rotation.y = -t * 0.4;
      cubes.forEach(([c, a, r, y, sp]) => {
        c.position.set(Math.cos(a + t * sp) * r, y + Math.sin(t * sp * 2) * 0.1, Math.sin(a + t * sp) * r);
        c.rotation.set(t * sp * 2, t * sp, 0);
      });
      // gelegentlicher Glitch
      if (t > glitchUntil + 2.2 && Math.random() < 0.02) glitchUntil = t + 0.18;
      const g = t < glitchUntil;
      shell.position.x = g ? (Math.random() - 0.5) * 0.12 : 0;
      shell.scale.x = g ? 1 + (Math.random() - 0.5) * 0.15 : 1;
      shellMat.emissiveIntensity = g ? 3 : 1.2 + Math.sin(t * 3) * 0.25;
    });
  }

  if (egg.id === 'release') {
    // Schleife oben
    const ribbonMat = track(new THREE.MeshStandardMaterial({ color: '#e0243a', roughness: 0.4, metalness: 0.1 }));
    const bow = new THREE.Group();
    for (const s of [1, -1]) {
      const loop = new THREE.Mesh(track(new THREE.TorusGeometry(0.24, 0.075, 14, 40)), ribbonMat);
      loop.scale.set(1, 0.62, 0.55);
      loop.position.set(s * 0.25, 0.08, 0);
      loop.rotation.z = s * 0.35;
      bow.add(loop);
      const tail = new THREE.Mesh(track(new THREE.BoxGeometry(0.1, 0.4, 0.03)), ribbonMat);
      tail.position.set(s * 0.12, -0.12, 0.05);
      tail.rotation.z = s * 0.5;
      bow.add(tail);
    }
    const knot = new THREE.Mesh(track(new THREE.SphereGeometry(0.1, 16, 12)), ribbonMat);
    knot.position.y = 0.06;
    bow.add(knot);
    bow.position.y = EGG_H - 0.02;
    decor.add(bow);
    const rays = new THREE.Sprite(new THREE.SpriteMaterial({ map: raysTexture(), color: '#ffd76a', transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false }));
    rays.scale.setScalar(5.2);
    rays.renderOrder = -1;
    fx.add(rays);
    const N = 70;
    const confetti = particles(N, '#ffffff', 0.12);
    fx.add(confetti);
    const cols = ['#ff4d6d', '#ffb84d', '#ffe14d', '#3ddc84', '#3ec9ff', '#7a5cff', '#ff5fd2'].map((c) => new THREE.Color(c));
    const seeds = Array.from({ length: N }, () => [(rnd() - 0.5) * 4.4, (rnd() - 0.5) * 2, rnd(), 0.25 + rnd() * 0.35, Math.floor(rnd() * 7)]);
    onUpdate((t) => {
      rays.material.rotation = t * 0.2;
      const p = confetti.geometry.attributes.position, c = confetti.geometry.attributes.color;
      seeds.forEach(([x, z, off, sp, ci], i) => {
        const life = (t * sp * 0.35 + off) % 1;
        p.setXYZ(i, x + Math.sin(t * 2 + i) * 0.2, 2.3 - life * 4.6, z);
        const b = Math.sin(life * Math.PI);
        c.setXYZ(i, cols[ci].r * b, cols[ci].g * b, cols[ci].b * b);
      });
      p.needsUpdate = c.needsUpdate = true;
    });
  }

  return {
    root,
    spinner,
    shell,
    shards,
    decor,
    fx,
    pedestal: pedestalGroup,
    shellMat,
    glow,
    skin: { W, H, glow: L.glow ? L.glow.canvas : null },
    update(t) {
      for (const fn of updaters) fn(t);
    },
    dispose() {
      disposables.forEach((d) => d.dispose());
      root.traverse((o) => {
        if (o.material && !disposables.includes(o.material)) o.material.dispose();
        if (o.geometry && !disposables.includes(o.geometry)) o.geometry.dispose();
      });
    },
  };
}
