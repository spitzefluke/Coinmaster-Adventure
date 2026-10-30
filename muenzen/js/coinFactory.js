// Baut aus einem Münz-Datensatz ein animierbares 3D-Objekt.
//
// Aufbau einer Münze:
//   root
//   ├─ spinner   dreht sich: Körper (extrudierte Kontur), Vorder-/Rückseite, Edelsteine, Flügel
//   └─ fx        bleibt aufrecht: Glühen, Strahlen, Partikel, Ringe, Planeten, Heiligenschein
//
// Die Prägung (Motiv, Schrift, Stufenmuster, Zierband) wird pro Münze auf Canvas gezeichnet
// und als Farb-, Normal- und Rauheitstextur verwendet. Das Motiv ist ein eigenes Relief
// (emblems.js) aus demselben Metall wie die Münze – keine Kontur, kein Schlagschatten.

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { tierById } from './coins.js';
import { renderEmblem } from './emblems.js';

const DEPTH = 0.12;
const LEGEND_FONT = '"Marcellus SC", "Cinzel", Georgia, serif';

// ── Kontur ───────────────────────────────────────────────────────────────────
// Alle Münzen sind rund. Geriffelte Stufen bekommen einen fein gezahnten Rand.

function contourPoints(reeded) {
  const n = reeded ? 240 : 192;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r = reeded && i % 2 ? 0.988 : 1;
    pts.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r));
  }
  return pts;
}

// ── Prägung ──────────────────────────────────────────────────────────────────
// Jede Seite wird auf mehrere gleich große Ebenen gezeichnet:
//   Farbe    – Metallfarben, Motiv in die Palette umgefärbt
//   Höhe     – wird zur Normal-Map, damit das Relief auf Licht reagiert
//   Rauheit  – spiegelpolierter Grund, mattiertes Relief (wie bei „Polierter Platte“)
//   Leuchten – nur bei Stufen mit leuchtender Prägung
//
// Aufteilung von innen nach außen (in Münzradien):
//   0 – 0.64   Feld mit graviertem Stufenmuster und Motiv bzw. Nennwert
//   0.64–0.81  Schriftband mit Umschrift
//   0.81–0.9   Zierband der Stufe
//   0.9 – 1    erhöhter Rand

const TAU = Math.PI * 2;
const gray = (v) => {
  const n = Math.round(Math.min(1, Math.max(0, v)) * 255);
  return `rgb(${n},${n},${n})`;
};

class Plate {
  constructor(S, glowing) {
    this.S = S;
    this.c = S / 2;
    this.u = S / 2;
    const mk = () => {
      const cv = document.createElement('canvas');
      cv.width = cv.height = S;
      return cv.getContext('2d', { willReadFrequently: true });
    };
    this.col = mk();
    this.hgt = mk();
    this.rgh = mk();
    this.em = glowing ? mk() : null;
  }

  // Zeichnet dieselbe Form in alle Ebenen. `draw(ctx, style)` setzt Füllung/Linie selbst.
  // height/rough sind 0..1; null lässt die Ebene aus.
  paint(draw, { color, height = null, rough = null, glow = null }) {
    const layers = [
      [this.col, color],
      [this.hgt, height === null ? null : gray(height)],
      [this.rgh, rough === null ? null : gray(rough)],
      [this.em, glow],
    ];
    for (const [ctx, style] of layers) {
      if (!ctx || style === null || style === undefined) continue;
      ctx.save();
      draw(ctx, style);
      ctx.restore();
    }
  }

  // Wölbt eine Form: weich aufgetragene Höhe macht aus flacher Gravur ein Kissenrelief.
  dome(draw, amount, blur) {
    const ctx = this.hgt;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = amount;
    ctx.filter = `blur(${blur}px)`;
    draw(ctx, '#ffffff');
    ctx.restore();
  }

  clipField(ctx, r0, r1) {
    ctx.beginPath();
    ctx.arc(this.c, this.c, r1 * this.u, 0, TAU);
    if (r0 > 0) ctx.arc(this.c, this.c, r0 * this.u, 0, TAU, true);
    ctx.clip('evenodd');
  }
}

function ring(ctx, c, r0, r1) {
  ctx.beginPath();
  ctx.arc(c, c, r1, 0, TAU);
  ctx.arc(c, c, r0, 0, TAU, true);
}

function seeded(seed) {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function starPath(ctx, x, y, r, points = 5, inner = 0.45) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const a = (i / (points * 2)) * TAU - Math.PI / 2;
    const rr = i % 2 ? r * inner : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
}

// ── Gravierte Feldmuster (innerhalb von r < 0.64) ──

const FIELD_PATTERNS = {
  plain() {},

  // feine Drehrillen
  lathe(ctx, c, u) {
    ctx.lineWidth = u * 0.005;
    for (let r = 0.03; r < 0.64; r += 0.022) {
      ctx.beginPath();
      ctx.arc(c, c, r * u, 0, TAU);
      ctx.stroke();
    }
  },

  // Strahlenkranz aus schmalen Keilen
  sunburst(ctx, c, u) {
    const n = 90;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU, w = (TAU / n) * 0.28;
      ctx.beginPath();
      ctx.moveTo(c, c);
      ctx.arc(c, c, u * 0.64, a - w, a + w);
      ctx.closePath();
      ctx.fill();
    }
  },

  // Rautengitter
  crosshatch(ctx, c, u) {
    ctx.lineWidth = u * 0.007;
    const step = u * 0.075;
    for (const dir of [1, -1]) {
      for (let k = -u; k <= u; k += step) {
        ctx.beginPath();
        ctx.moveTo(c + k - u, c - dir * u);
        ctx.lineTo(c + k + u, c + dir * u);
        ctx.stroke();
      }
    }
  },

  // Feuerwirbel
  vortex(ctx, c, u) {
    ctx.lineWidth = u * 0.007;
    for (let k = 0; k < 28; k++) {
      ctx.beginPath();
      for (let r = 0.04; r <= 0.66; r += 0.01) {
        const a = (k / 28) * TAU + r * 3.2;
        ctx.lineTo(c + Math.cos(a) * r * u, c + Math.sin(a) * r * u);
      }
      ctx.stroke();
    }
  },

  // Bannkreis: Siebenstern mit Doppelkreis
  sigil(ctx, c, u) {
    ctx.lineWidth = u * 0.009;
    for (const r of [0.6, 0.56]) {
      ctx.beginPath();
      ctx.arc(c, c, r * u, 0, TAU);
      ctx.stroke();
    }
    ctx.beginPath();
    for (let i = 0; i <= 7; i++) {
      const a = ((i * 3) / 7) * TAU - Math.PI / 2;
      ctx.lineTo(c + Math.cos(a) * u * 0.56, c + Math.sin(a) * u * 0.56);
    }
    ctx.stroke();
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * TAU - Math.PI / 2;
      ctx.beginPath();
      ctx.arc(c + Math.cos(a) * u * 0.58, c + Math.sin(a) * u * 0.58, u * 0.022, 0, TAU);
      ctx.fill();
    }
  },

  // Gloriole: lange und kurze Strahlen im Wechsel
  glory(ctx, c, u) {
    const n = 48;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU, w = (TAU / n) * (i % 2 ? 0.18 : 0.32);
      ctx.beginPath();
      ctx.moveTo(c, c);
      ctx.arc(c, c, u * (i % 2 ? 0.5 : 0.64), a - w, a + w);
      ctx.closePath();
      ctx.fill();
    }
  },

  // Umlaufbahnen und Sternstaub
  orbits(ctx, c, u) {
    ctx.lineWidth = u * 0.006;
    for (const rot of [0.3, 1.35, 2.4]) {
      ctx.beginPath();
      ctx.ellipse(c, c, u * 0.6, u * 0.2, rot, 0, TAU);
      ctx.stroke();
    }
    const rnd = seeded(4242);
    for (let i = 0; i < 40; i++) {
      const a = rnd() * TAU, r = Math.sqrt(rnd()) * 0.62;
      starPath(ctx, c + Math.cos(a) * r * u, c + Math.sin(a) * r * u, u * (0.008 + rnd() * 0.014), 4, 0.35);
      ctx.fill();
    }
  },

  // Guilloche-Rosette wie auf Banknoten
  guilloche(ctx, c, u) {
    ctx.lineWidth = u * 0.0035;
    for (let k = 0; k < 22; k++) {
      ctx.beginPath();
      for (let i = 0; i <= 720; i++) {
        const a = (i / 720) * TAU;
        const r = 0.42 + 0.12 * Math.sin(9 * a + (k / 22) * TAU) + 0.06 * Math.sin(4 * a - (k / 22) * TAU * 2);
        ctx.lineTo(c + Math.cos(a) * r * u, c + Math.sin(a) * r * u);
      }
      ctx.stroke();
    }
  },
};

// ── Zierbänder (0.81 – 0.9) ──

const BORDER_PATTERNS = {
  beads(ctx, c, u) {
    for (let i = 0; i < 64; i++) {
      const a = (i / 64) * TAU;
      ctx.beginPath();
      ctx.arc(c + Math.cos(a) * u * 0.855, c + Math.sin(a) * u * 0.855, u * 0.016, 0, TAU);
      ctx.fill();
    }
  },

  // gedrehte Kordel
  rope(ctx, c, u) {
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * TAU;
      ctx.beginPath();
      ctx.ellipse(c + Math.cos(a) * u * 0.855, c + Math.sin(a) * u * 0.855, u * 0.032, u * 0.011, a + 0.9, 0, TAU);
      ctx.fill();
    }
  },

  // Lorbeerkranz
  laurel(ctx, c, u) {
    ctx.lineWidth = u * 0.006;
    ctx.beginPath();
    ctx.arc(c, c, u * 0.855, 0, TAU);
    ctx.stroke();
    for (let i = 0; i < 56; i++) {
      const a = (i / 56) * TAU, side = i % 2 ? 1 : -1;
      const r = 0.855 + side * 0.018;
      ctx.beginPath();
      ctx.ellipse(c + Math.cos(a) * u * r, c + Math.sin(a) * u * r, u * 0.026, u * 0.011, a + Math.PI / 2 + side * 0.5, 0, TAU);
      ctx.fill();
    }
  },

  zigzag(ctx, c, u) {
    ctx.lineWidth = u * 0.014;
    ctx.lineJoin = 'miter';
    ctx.beginPath();
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * TAU, r = i % 2 ? 0.83 : 0.88;
      ctx.lineTo(c + Math.cos(a) * u * r, c + Math.sin(a) * u * r);
    }
    ctx.stroke();
  },

  // Runen aus wenigen geraden Strichen, für jede Münze gleich (fester Startwert)
  runes(ctx, c, u) {
    const rnd = seeded(777);
    ctx.lineWidth = u * 0.008;
    ctx.lineCap = 'round';
    const n = 26, h = u * 0.05;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      ctx.save();
      ctx.translate(c + Math.cos(a) * u * 0.855, c + Math.sin(a) * u * 0.855);
      ctx.rotate(a + Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, -h / 2);
      ctx.lineTo(0, h / 2);
      const strokes = 1 + Math.floor(rnd() * 3);
      for (let k = 0; k < strokes; k++) {
        const y0 = (rnd() - 0.5) * h, y1 = (rnd() - 0.5) * h, s = rnd() < 0.5 ? -1 : 1;
        ctx.moveTo(0, y0);
        ctx.lineTo(s * h * 0.4, y1);
      }
      ctx.stroke();
      ctx.restore();
    }
  },

  feathers(ctx, c, u) {
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * TAU;
      ctx.save();
      ctx.translate(c + Math.cos(a) * u * 0.855, c + Math.sin(a) * u * 0.855);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(-u * 0.035, 0);
      ctx.quadraticCurveTo(0, -u * 0.03, u * 0.035, 0);
      ctx.quadraticCurveTo(0, u * 0.012, -u * 0.035, 0);
      ctx.fill();
      ctx.restore();
    }
  },

  rays(ctx, c, u) {
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * TAU, w = TAU / 48 / 2.4;
      ctx.beginPath();
      ctx.moveTo(c + Math.cos(a - w) * u * 0.82, c + Math.sin(a - w) * u * 0.82);
      ctx.lineTo(c + Math.cos(a) * u * 0.895, c + Math.sin(a) * u * 0.895);
      ctx.lineTo(c + Math.cos(a + w) * u * 0.82, c + Math.sin(a + w) * u * 0.82);
      ctx.closePath();
      ctx.fill();
    }
  },

  stars(ctx, c, u) {
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * TAU, x = c + Math.cos(a) * u * 0.855, y = c + Math.sin(a) * u * 0.855;
      if (i % 2) {
        ctx.beginPath();
        ctx.arc(x, y, u * 0.008, 0, TAU);
      } else starPath(ctx, x, y, u * 0.03);
      ctx.fill();
    }
  },

  diamonds(ctx, c, u) {
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * TAU;
      ctx.save();
      ctx.translate(c + Math.cos(a) * u * 0.855, c + Math.sin(a) * u * 0.855);
      ctx.rotate(a);
      ctx.beginPath();
      if (i % 2) ctx.arc(0, 0, u * 0.01, 0, TAU);
      else {
        ctx.moveTo(-u * 0.03, 0);
        ctx.lineTo(0, -u * 0.018);
        ctx.lineTo(u * 0.03, 0);
        ctx.lineTo(0, u * 0.018);
        ctx.closePath();
      }
      ctx.fill();
      ctx.restore();
    }
  },
};

function arcText(ctx, str, c, radius, top, maxAngle) {
  const chars = [...str];
  const gap = ctx.measureText('M').width * 0.12;
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((s, w) => s + w, 0) + gap * (chars.length - 1);
  const span = total / radius;
  const squeeze = span > maxAngle ? maxAngle / span : 1;
  let angle = top ? -Math.PI / 2 - (span * squeeze) / 2 : Math.PI / 2 + (span * squeeze) / 2;
  chars.forEach((ch, i) => {
    const step = (widths[i] * squeeze) / radius;
    const a = top ? angle + step / 2 : angle - step / 2;
    ctx.save();
    ctx.translate(c + Math.cos(a) * radius, c + Math.sin(a) * radius);
    ctx.rotate(top ? a + Math.PI / 2 : a - Math.PI / 2);
    ctx.scale(squeeze, 1);
    ctx.fillText(ch, 0, 0);
    ctx.restore();
    angle += (top ? 1 : -1) * (step + (gap * squeeze) / radius);
  });
}

// Höhenbild → Normal-Map (Sobel). Canvas-y zeigt nach unten, Texturen werden beim
// Hochladen gespiegelt – daher das Vorzeichen bei ny.
export function heightToNormal(hctx, S, strength) {
  const blurred = document.createElement('canvas');
  blurred.width = blurred.height = S;
  const bctx = blurred.getContext('2d', { willReadFrequently: true });
  bctx.filter = `blur(${Math.max(0.6, S / 700)}px)`;
  bctx.drawImage(hctx.canvas, 0, 0);
  const src = bctx.getImageData(0, 0, S, S).data;
  const out = new ImageData(S, S);
  const o = out.data;
  const h = (x, y) => src[(Math.min(S - 1, Math.max(0, y)) * S + Math.min(S - 1, Math.max(0, x))) * 4] / 255;
  const k = strength * (S / 512);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const dx = (h(x + 1, y - 1) + 2 * h(x + 1, y) + h(x + 1, y + 1) - h(x - 1, y - 1) - 2 * h(x - 1, y) - h(x - 1, y + 1)) * k;
      const dy = (h(x - 1, y + 1) + 2 * h(x, y + 1) + h(x + 1, y + 1) - h(x - 1, y - 1) - 2 * h(x, y - 1) - h(x + 1, y - 1)) * k;
      const nx = -dx, ny = dy, inv = 1 / Math.hypot(nx, ny, 1);
      const i = (y * S + x) * 4;
      o[i] = (nx * inv * 0.5 + 0.5) * 255;
      o[i + 1] = (ny * inv * 0.5 + 0.5) * 255;
      o[i + 2] = (inv * 0.5 + 0.5) * 255;
      o[i + 3] = 255;
    }
  }
  bctx.filter = 'none';
  bctx.putImageData(out, 0, 0);
  return blurred;
}

// Erzeugt Farbe, Relief, Rauheit und (optional) Leuchtmaske einer Münzseite.
function paintFace(coin, tier, side, S) {
  const pal = coin.metal;
  const glowing = tier.id === 'mystisch';
  const plate = new Plate(S, glowing);
  const { c, u } = plate;
  const dark = tier.id === 'galaktisch' || tier.id === 'mystisch';
  const engrave = dark ? pal[1] : pal[2];
  const raised = pal[0];

  // Grund: spiegelnd poliertes Feld
  plate.paint(
    (ctx, style) => {
      ctx.fillStyle = style;
      ctx.fillRect(0, 0, S, S);
    },
    { color: dark ? '#000000' : pal[1], height: 0.3, rough: 0.12 },
  );
  const field = plate.col.createRadialGradient(c * 0.75, c * 0.7, 0, c, c, u);
  field.addColorStop(0, dark ? pal[2] : pal[1]);
  field.addColorStop(1, dark ? '#000000' : pal[2]);
  plate.col.fillStyle = field;
  plate.col.fillRect(0, 0, S, S);

  // Graviertes Stufenmuster im Feld (vertieft und mattiert)
  plate.paint(
    (ctx, style) => {
      plate.clipField(ctx, 0, 0.635);
      ctx.fillStyle = ctx.strokeStyle = style;
      FIELD_PATTERNS[tier.field](ctx, c, u);
    },
    { color: engrave, height: 0.22, rough: 0.55, glow: glowing ? coin.glow : null },
  );

  // Fadenkreise um das Schriftband
  for (const r of [0.645, 0.81]) {
    const draw = (ctx, style) => {
      ctx.strokeStyle = style;
      ctx.lineWidth = u * 0.008;
      ctx.beginPath();
      ctx.arc(c, c, r * u, 0, TAU);
      ctx.stroke();
    };
    plate.paint(draw, { color: raised, height: 0.55, rough: 0.35, glow: glowing ? coin.glow : null });
  }

  // Zierband der Stufe (erhaben)
  const border = (ctx, style) => {
    ctx.fillStyle = ctx.strokeStyle = style;
    BORDER_PATTERNS[tier.border](ctx, c, u);
  };
  plate.paint(border, { color: raised, height: 0.62, rough: 0.4, glow: glowing ? coin.glow : null });
  plate.dome(border, 0.15, u * 0.01);

  // Erhöhter Rand mit Schräge nach innen
  const rimColor = plate.col.createRadialGradient(c, c, u * 0.9, c, c, u);
  rimColor.addColorStop(0, pal[2]);
  rimColor.addColorStop(0.35, pal[0]);
  rimColor.addColorStop(1, pal[1]);
  const rimHeight = plate.hgt.createRadialGradient(c, c, u * 0.895, c, c, u);
  rimHeight.addColorStop(0, gray(0.35));
  rimHeight.addColorStop(0.4, gray(0.85));
  rimHeight.addColorStop(1, gray(0.8));
  plate.paint(
    (ctx, style) => {
      ring(ctx, c, u * 0.895, u * 1.01);
      ctx.fillStyle = ctx === plate.col ? rimColor : ctx === plate.hgt ? rimHeight : style;
      ctx.fill('evenodd');
    },
    { color: 'x', height: 0.8, rough: 0.22 },
  );

  // Umschrift (erhaben, mit Schatten in der Farbebene)
  const legendTop = side === 'front' ? coin.name.toUpperCase() : 'COINMASTER';
  const legendBottom = side === 'front' ? `· ${tier.name.toUpperCase()} ·` : 'ADVENTURE';
  const legend = (ctx, style) => {
    ctx.font = `${Math.round(u * 0.1)}px ${LEGEND_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = style;
    arcText(ctx, legendTop, c, u * 0.728, true, Math.PI * 0.95);
    arcText(ctx, legendBottom, c, u * 0.728, false, Math.PI * 0.7);
  };
  plate.col.save();
  plate.col.translate(u * 0.008, u * 0.01);
  plate.col.globalAlpha = 0.6;
  legend(plate.col, '#000000');
  plate.col.restore();
  plate.paint(legend, { color: raised, height: 0.68, rough: 0.5, glow: glowing ? coin.glow : null });
  plate.dome(legend, 0.12, u * 0.006);

  // Zentrum
  if (side === 'front') {
    const es = Math.round(u * 1.12);
    const { colorCv, heightCv, maskCv } = renderEmblem(coin.emblem, es, pal);
    const x = c - es / 2, y = c - es / 2;
    // nur ein enger Kontaktschatten – das Motiv sitzt im Metall, nicht darauf
    plate.col.save();
    plate.col.shadowColor = 'rgba(0,0,0,0.45)';
    plate.col.shadowBlur = u * 0.012;
    plate.col.shadowOffsetX = u * 0.004;
    plate.col.shadowOffsetY = u * 0.006;
    plate.col.drawImage(colorCv, x, y);
    plate.col.restore();
    plate.hgt.drawImage(heightCv, x, y);
    plate.dome((ctx) => ctx.drawImage(maskCv, x, y), 0.08, u * 0.04);
    plate.rgh.save();
    plate.rgh.globalAlpha = 0.85;
    plate.rgh.filter = `brightness(0) invert(0.6)`;
    plate.rgh.drawImage(maskCv, x, y);
    plate.rgh.restore();
    if (plate.em) {
      plate.em.save();
      plate.em.globalAlpha = 0.4;
      plate.em.filter = `blur(${Math.round(S / 120)}px)`;
      plate.em.drawImage(maskCv, x, y);
      plate.em.restore();
    }
  } else {
    const value = tier.value;
    const fs = value.length > 3 ? 0.34 : value.length > 2 ? 0.44 : 0.58;
    const numeral = (ctx, style) => {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = style;
      ctx.font = `${Math.round(u * fs)}px ${LEGEND_FONT}`;
      ctx.fillText(value, c, c - u * 0.04);
      ctx.font = `${Math.round(u * 0.09)}px ${LEGEND_FONT}`;
      ctx.fillText('TALER', c, c + u * 0.36);
      for (const sx of [-1, 1]) {
        starPath(ctx, c + sx * u * 0.42, c + u * 0.32, u * 0.04);
        ctx.fill();
      }
    };
    plate.col.save();
    plate.col.shadowColor = 'rgba(0,0,0,0.65)';
    plate.col.shadowBlur = u * 0.03;
    plate.col.shadowOffsetX = u * 0.012;
    plate.col.shadowOffsetY = u * 0.018;
    numeral(plate.col, raised);
    plate.col.restore();
    plate.paint(numeral, { color: null, height: 0.62, rough: 0.55, glow: glowing ? coin.glow : null });
    plate.dome(numeral, 0.3, u * 0.03);
  }

  const tex = (cv, srgb) => {
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.anisotropy = 4;
    return t;
  };
  return {
    map: tex(plate.col.canvas, true),
    normalMap: tex(heightToNormal(plate.hgt, S, 2.2), false),
    roughnessMap: tex(plate.rgh.canvas, false),
    emissiveMap: plate.em ? tex(plate.em.canvas, true) : null,
  };
}

// ── Gemeinsame Effekt-Texturen ───────────────────────────────────────────────

const shared = {};

function canvasTexture(key, size, draw) {
  if (shared[key]) return shared[key];
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  draw(cv.getContext('2d'), size);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return (shared[key] = t);
}

export const glowTexture = () =>
  canvasTexture('glow', 256, (ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.25, 'rgba(255,255,255,0.55)');
    g.addColorStop(0.55, 'rgba(255,255,255,0.15)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  });

export const sparkTexture = () =>
  canvasTexture('spark', 64, (ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.2, 'rgba(255,255,255,0.8)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillRect(s / 2 - 1, 2, 2, s - 4);
    ctx.fillRect(2, s / 2 - 1, s - 4, 2);
  });

export const raysTexture = () =>
  canvasTexture('rays', 512, (ctx, s) => {
    const c = s / 2;
    ctx.translate(c, c);
    for (let i = 0; i < 24; i++) {
      ctx.rotate((Math.PI * 2) / 24);
      const len = c * (i % 2 ? 0.75 : 1);
      const g = ctx.createLinearGradient(0, 0, len, 0);
      g.addColorStop(0, 'rgba(255,255,255,0.9)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(len, -c * 0.045);
      ctx.lineTo(len, c * 0.045);
      ctx.closePath();
      ctx.fill();
    }
  });

const rainbowTexture = () =>
  canvasTexture('rainbow', 256, (ctx, s) => {
    const g = ctx.createConicGradient(0, s / 2, s / 2);
    ['#ff4d6d', '#ffb84d', '#fff94d', '#4dff88', '#4dd2ff', '#7a4dff', '#ff4dd8', '#ff4d6d'].forEach((c, i, a) =>
      g.addColorStop(i / (a.length - 1), c),
    );
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    // radial ausblenden
    ctx.globalCompositeOperation = 'destination-in';
    const r = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    r.addColorStop(0, 'rgba(0,0,0,1)');
    r.addColorStop(0.4, 'rgba(0,0,0,0.6)');
    r.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = r;
    ctx.fillRect(0, 0, s, s);
  });

function nebulaTexture(seedHue) {
  return canvasTexture('nebula' + seedHue, 512, (ctx, s) => {
    const c = s / 2;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, s, s);
    ctx.globalCompositeOperation = 'lighter';
    let seed = seedHue * 997 + 13;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 26; i++) {
      const a = rnd() * Math.PI * 2, r = Math.pow(rnd(), 0.7) * c * 0.75;
      const x = c + Math.cos(a) * r, y = c + Math.sin(a) * r;
      const rad = c * (0.15 + rnd() * 0.35);
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      const h = seedHue + (rnd() - 0.5) * 120;
      g.addColorStop(0, `hsla(${h},90%,60%,0.32)`);
      g.addColorStop(1, `hsla(${h},90%,40%,0)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
    }
    for (let i = 0; i < 260; i++) {
      const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * c * 0.95;
      ctx.fillStyle = `rgba(255,255,255,${0.3 + rnd() * 0.7})`;
      const sz = rnd() < 0.08 ? 2.4 : 1.1;
      ctx.fillRect(c + Math.cos(a) * r, c + Math.sin(a) * r, sz, sz);
    }
    // runde, weiche Maske
    ctx.globalCompositeOperation = 'destination-in';
    const m = ctx.createRadialGradient(c, c, c * 0.6, c, c, c);
    m.addColorStop(0, 'rgba(0,0,0,1)');
    m.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = m;
    ctx.fillRect(0, 0, s, s);
  });
}

// ── Bausteine ────────────────────────────────────────────────────────────────

export function glowSprite(color, scale, opacity = 0.75) {
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture(),
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  s.scale.setScalar(scale);
  s.renderOrder = -1;
  return s;
}

export function particles(count, color, size, texture = sparkTexture()) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 3).fill(1), 3));
  const mat = new THREE.PointsMaterial({
    size,
    map: texture,
    color,
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  return new THREE.Points(geo, mat);
}

export function wingShape() {
  const s = new THREE.Shape();
  s.moveTo(0, 0.3);
  s.bezierCurveTo(0.35, 0.75, 1.05, 0.95, 1.55, 0.78);
  s.bezierCurveTo(1.4, 0.62, 1.48, 0.5, 1.3, 0.42);
  s.bezierCurveTo(1.42, 0.28, 1.3, 0.14, 1.12, 0.12);
  s.bezierCurveTo(1.18, -0.04, 1.02, -0.16, 0.86, -0.1);
  s.bezierCurveTo(0.86, -0.28, 0.66, -0.36, 0.52, -0.24);
  s.bezierCurveTo(0.42, -0.4, 0.18, -0.36, 0.08, -0.18);
  s.lineTo(0, 0.3);
  return s;
}

// ── Bühne ─────────────────────────────────────────────────────────────────────
export function makeEnvironment(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  pmrem.dispose();
  return env;
}

export function makeScene(env) {
  const scene = new THREE.Scene();
  scene.environment = env;
  const key = new THREE.DirectionalLight('#fff4e0', 2.2);
  key.position.set(2.5, 3, 4);
  const rim = new THREE.DirectionalLight('#9fb4ff', 1.2);
  rim.position.set(-3, -1, -2);
  scene.add(key, rim, new THREE.AmbientLight('#ffffff', 0.25));
  return scene;
}

// ── Münze ────────────────────────────────────────────────────────────────────

export function createCoin(coin, { resolution = 512 } = {}) {
  const tier = tierById[coin.tier];
  const fx = new Set(tier.fx);
  const pal = coin.metal;
  const accent = new THREE.Color(coin.glow || coin.gem || coin.ember || tier.color);

  const root = new THREE.Group();
  const spinner = new THREE.Group();
  const fxGroup = new THREE.Group();
  root.add(fxGroup, spinner);

  const disposables = [];
  const track = (o) => (disposables.push(o), o);

  // Körper
  const reeded = tier.edge === 'reeded';
  const pts = contourPoints(reeded);
  const bodyShape = new THREE.Shape(pts);
  const bevel = reeded ? 0.012 : 0.035;
  const bodyGeo = track(
    new THREE.ExtrudeGeometry(bodyShape, {
      depth: DEPTH,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: reeded ? 2 : 4,
      curveSegments: 1,
    }),
  );
  bodyGeo.translate(0, 0, -DEPTH / 2);

  const MatClass = fx.has('rainbow') || fx.has('wings') ? THREE.MeshPhysicalMaterial : THREE.MeshStandardMaterial;
  const bodyMat = track(
    new MatClass({
      color: new THREE.Color(tier.id === 'galaktisch' || tier.id === 'mystisch' ? pal[2] : pal[1]),
      metalness: 1,
      roughness: tier.id === 'normal' ? 0.42 : 0.26,
    }),
  );
  if (tier.id === 'mystisch') {
    bodyMat.emissive = accent.clone();
    bodyMat.emissiveIntensity = 0.12;
  }
  if (fx.has('wings')) Object.assign(bodyMat, { metalness: 0.55, clearcoat: 1, iridescence: 0.4 });
  if (fx.has('rainbow')) Object.assign(bodyMat, { iridescence: 1, iridescenceIOR: 1.6, clearcoat: 1 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  spinner.add(body);

  // Seiten
  const faceShape = new THREE.Shape(contourPoints(false));
  const faceGeo = track(new THREE.ShapeGeometry(faceShape, 1));
  const uv = faceGeo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 0.5 + 0.5, uv.getY(i) * 0.5 + 0.5);
  const faceZ = DEPTH / 2 + bevel + 0.002;

  const faces = {};
  for (const side of ['front', 'back']) {
    const t = paintFace(coin, tier, side, resolution);
    Object.values(t).forEach((x) => x && track(x));
    const mat = track(
      new (fx.has('rainbow') ? THREE.MeshPhysicalMaterial : THREE.MeshStandardMaterial)({
        map: t.map,
        normalMap: t.normalMap,
        roughnessMap: t.roughnessMap,
        roughness: 1,
        metalness: fx.has('wings') ? 0.75 : 1,
      }),
    );
    if (t.emissiveMap) {
      mat.emissiveMap = t.emissiveMap;
      mat.emissive = new THREE.Color('#ffffff');
      mat.emissiveIntensity = 1.4;
    }
    if (fx.has('rainbow')) Object.assign(mat, { iridescence: 1, iridescenceIOR: 1.5, iridescenceThicknessRange: [200, 800] });
    const m = new THREE.Mesh(faceGeo, mat);
    m.position.z = side === 'front' ? faceZ : -faceZ;
    if (side === 'back') m.rotation.y = Math.PI;
    spinner.add(m);
    faces[side] = m;
  }

  const updaters = [];
  const onUpdate = (fn) => updaters.push(fn);

  // ── Effekte ──
  if (fx.has('glow')) {
    const big = tier.index >= 7;
    const base = fx.has('rainbow') ? 0.35 : big ? 0.75 : 0.6;
    const glow = glowSprite(accent, big ? 4.2 : 3.6, base);
    fxGroup.add(glow);
    onUpdate((t) => (glow.material.opacity = base + Math.sin(t * 2) * 0.1));
  }

  if (fx.has('shine')) {
    const glint = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: sparkTexture(), color: '#fff7d0', blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, depthTest: false }),
    );
    glint.scale.setScalar(0.5);
    fxGroup.add(glint);
    onUpdate((t) => {
      const cycle = (t * 0.45) % 1;
      const k = Math.max(0, Math.sin(Math.min(1, cycle * 4) * Math.PI));
      glint.material.opacity = k;
      glint.material.rotation = t;
      const a = Math.floor(t * 0.45) * 2.3;
      glint.position.set(Math.cos(a) * 0.72, Math.sin(a) * 0.72, 0.4);
    });
  }

  if (fx.has('gems')) {
    const gemGeo = track(new THREE.OctahedronGeometry(0.075, 0));
    const gemMat = track(
      new THREE.MeshPhysicalMaterial({
        color: coin.gem,
        emissive: coin.gem,
        emissiveIntensity: 0.35,
        metalness: 0,
        roughness: 0.05,
        clearcoat: 1,
        flatShading: true,
      }),
    );
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const r = 0.95;
      for (const s of [1, -1]) {
        const gem = new THREE.Mesh(gemGeo, gemMat);
        gem.position.set(Math.cos(a) * r, Math.sin(a) * r, s * (faceZ + 0.015));
        gem.scale.set(1, 1, 0.55);
        gem.rotation.z = a;
        spinner.add(gem);
      }
    }
  }

  if (fx.has('embers')) {
    const N = 46;
    const pts = particles(N, coin.ember, 0.14);
    const seeds = Array.from({ length: N }, () => [Math.random() * Math.PI * 2, Math.random(), 0.6 + Math.random() * 0.8]);
    fxGroup.add(pts);
    onUpdate((t) => {
      const p = pts.geometry.attributes.position, col = pts.geometry.attributes.color;
      seeds.forEach(([a, off, sp], i) => {
        const life = (t * 0.35 * sp + off) % 1;
        const r = 0.85 + Math.sin(a * 3 + t) * 0.15 + life * 0.25;
        p.setXYZ(i, Math.cos(a) * r, -1.1 + life * 2.9, Math.sin(a) * r * 0.6);
        const fade = Math.sin(life * Math.PI);
        col.setXYZ(i, fade, fade, fade);
      });
      p.needsUpdate = col.needsUpdate = true;
    });
  }

  if (fx.has('runes') || fx.has('orbitRing')) {
    const mats = [faces.front.material, faces.back.material];
    onUpdate((t) => mats.forEach((m) => (m.emissiveIntensity = 1.1 + Math.sin(t * 2.4) * 0.6)));
    const ringMat = track(
      new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    const rings = [1.42, 1.58].map((r, i) => {
      const ring = new THREE.Mesh(track(new THREE.TorusGeometry(r, 0.012, 6, 120)), ringMat);
      ring.rotation.x = Math.PI / 2 - 0.35 + i * 0.7;
      fxGroup.add(ring);
      return ring;
    });
    // kleine Runensteine auf der Umlaufbahn
    const stones = particles(10, accent, 0.18);
    const tilt = new THREE.Euler(rings[0].rotation.x, 0, 0);
    const v = new THREE.Vector3();
    fxGroup.add(stones);
    onUpdate((t) => {
      rings[0].rotation.z = t * 0.6;
      rings[1].rotation.z = -t * 0.4;
      const p = stones.geometry.attributes.position;
      for (let i = 0; i < 10; i++) {
        const a = t * 0.6 + (i / 10) * Math.PI * 2;
        v.set(Math.cos(a) * 1.42, Math.sin(a) * 1.42, 0).applyEuler(tilt);
        p.setXYZ(i, v.x, v.y, v.z);
      }
      p.needsUpdate = true;
    });
  }

  if (fx.has('wings')) {
    const wingGeo = track(
      new THREE.ExtrudeGeometry(wingShape(), { depth: 0.03, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 2, curveSegments: 16 }),
    );
    wingGeo.translate(0, 0, -0.03);
    const wingMat = track(
      new THREE.MeshPhysicalMaterial({
        color: '#ffffff',
        emissive: '#fff3d0',
        emissiveIntensity: 0.25,
        metalness: 0.2,
        roughness: 0.35,
        clearcoat: 1,
        iridescence: 0.5,
        side: THREE.DoubleSide,
      }),
    );
    const wings = [1, -1].map((s) => {
      const pivot = new THREE.Group();
      pivot.position.set(s * 0.82, 0.1, -0.02);
      const w = new THREE.Mesh(wingGeo, wingMat);
      w.scale.set(s * 0.95, 0.95, 1);
      pivot.add(w);
      spinner.add(pivot);
      return [pivot, s];
    });
    onUpdate((t) => wings.forEach(([p, s]) => (p.rotation.y = s * (-0.35 + Math.sin(t * 3) * 0.3))));
  }

  if (fx.has('halo')) {
    const halo = new THREE.Mesh(
      track(new THREE.TorusGeometry(0.5, 0.045, 12, 64)),
      track(new THREE.MeshStandardMaterial({ color: '#ffe08a', emissive: '#ffcf4d', emissiveIntensity: 1.6, metalness: 1, roughness: 0.2 })),
    );
    halo.rotation.x = Math.PI / 2 - 0.25;
    fxGroup.add(halo);
    const haloGlow = glowSprite('#ffe9a8', 1.6, 0.6);
    fxGroup.add(haloGlow);
    onUpdate((t) => {
      halo.position.y = haloGlow.position.y = 1.32 + Math.sin(t * 2) * 0.05;
    });
  }

  if (fx.has('rays')) {
    const rays = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: raysTexture(),
        color: fx.has('rainbow') ? '#ffffff' : accent,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    rays.scale.setScalar(fx.has('rainbow') ? 4.4 : 4.0);
    rays.renderOrder = -1;
    fxGroup.add(rays);
    onUpdate((t) => {
      rays.material.rotation = t * 0.25;
      rays.material.opacity = (fx.has('rainbow') ? 0.22 : 0.42) + Math.sin(t * 1.7) * 0.12;
    });
  }

  if (fx.has('nebula')) {
    const hue = coin.name.length * 37 % 360;
    const neb = new THREE.Mesh(
      track(new THREE.CircleGeometry(0.66, 64)),
      track(new THREE.MeshBasicMaterial({ map: nebulaTexture(hue), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })),
    );
    neb.position.z = faceZ + 0.004;
    const nebBack = neb.clone();
    nebBack.position.z = -faceZ - 0.004;
    nebBack.rotation.y = Math.PI;
    spinner.add(neb, nebBack);
    onUpdate((t) => {
      neb.rotation.z = t * 0.15;
      nebBack.rotation.z = -t * 0.15;
    });
  }

  if (fx.has('planets')) {
    const plane = new THREE.Group();
    plane.rotation.set(Math.PI / 2 - 0.3, 0.25, 0);
    fxGroup.add(plane);
    const orbit = new THREE.Mesh(
      track(new THREE.RingGeometry(1.55, 1.575, 128)),
      track(new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.5, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false })),
    );
    plane.add(orbit);
    const planets = [
      ['#ff9d5c', 0.11, 1.56, 0.9, 0],
      ['#5cd6ff', 0.08, 1.56, 0.9, 2.4],
      ['#e8d0ff', 0.06, 1.56, 0.9, 4.1],
    ].map(([color, size, r, speed, phase]) => {
      const p = new THREE.Mesh(
        track(new THREE.SphereGeometry(size, 20, 14)),
        track(new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6, roughness: 0.6 })),
      );
      plane.add(p);
      return [p, r, speed, phase];
    });
    onUpdate((t) =>
      planets.forEach(([p, r, speed, phase]) => p.position.set(Math.cos(t * speed + phase) * r, Math.sin(t * speed + phase) * r, 0)),
    );
  }

  if (fx.has('rings')) {
    const rings = [1.3, 1.48, 1.66].map((r, i) => {
      const ring = new THREE.Mesh(
        track(new THREE.TorusGeometry(r, 0.014, 8, 140)),
        track(new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false })),
      );
      ring.rotation.set(Math.PI / 2 + (i - 1) * 0.6, i * 0.5, 0);
      fxGroup.add(ring);
      return ring;
    });
    onUpdate((t) =>
      rings.forEach((ring, i) => {
        ring.rotation.y = t * (0.3 + i * 0.15) * (i % 2 ? -1 : 1);
        ring.material.color.setHSL((t * 0.12 + i / 3) % 1, 0.95, 0.65);
      }),
    );
  }

  if (fx.has('rainbow')) {
    const rb = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: rainbowTexture(), transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    rb.scale.setScalar(3.8);
    rb.renderOrder = -2;
    fxGroup.add(rb);
    const glowSpr = fxGroup.children.find((c) => c.isSprite && c.material.map === glowTexture());
    const base = new THREE.Color(pal[1]);
    onUpdate((t) => {
      rb.material.rotation = -t * 0.4;
      const h = (t * 0.08) % 1;
      bodyMat.color.setHSL(h, 0.7, 0.72);
      glowSpr && glowSpr.material.color.setHSL((h + 0.5) % 1, 1, 0.65);
      faces.front.material.color.copy(base).lerp(new THREE.Color().setHSL(h, 1, 0.8), 0.35);
    });
  }

  if (fx.has('sparkles')) {
    const N = tier.index >= 8 ? 40 : 26;
    const pts = particles(N, fx.has('rainbow') ? '#ffffff' : accent.clone().lerp(new THREE.Color('#ffffff'), 0.5), 0.13);
    const seeds = Array.from({ length: N }, () => [Math.random() * Math.PI * 2, 1.1 + Math.random() * 0.9, (Math.random() - 0.5) * 2.6, Math.random() * 10, 0.3 + Math.random()]);
    fxGroup.add(pts);
    onUpdate((t) => {
      const p = pts.geometry.attributes.position, col = pts.geometry.attributes.color;
      seeds.forEach(([a, r, y, ph, sp], i) => {
        const ang = a + t * 0.25 * sp;
        p.setXYZ(i, Math.cos(ang) * r, y + Math.sin(t * sp + ph) * 0.1, Math.sin(ang) * r * 0.5);
        const tw = Math.pow(0.5 + 0.5 * Math.sin(t * 3 * sp + ph), 3);
        if (fx.has('rainbow')) {
          const c = new THREE.Color().setHSL((i / N + t * 0.1) % 1, 1, 0.5 + tw * 0.3);
          col.setXYZ(i, c.r * tw, c.g * tw, c.b * tw);
        } else col.setXYZ(i, tw, tw, tw);
      });
      p.needsUpdate = col.needsUpdate = true;
    });
  }

  return {
    root,
    spinner,
    tier,
    update(t) {
      for (const fn of updaters) fn(t);
    },
    dispose() {
      disposables.forEach((d) => d.dispose());
      root.traverse((o) => o.material && !disposables.includes(o.material) && o.material.dispose());
    },
  };
}
