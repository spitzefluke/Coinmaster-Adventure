// Gezeichnete Texturen für die Roblox-Vorschau: Teilchenbilder (wie Roblox' eingebaute
// rbxasset-Texturen) und kachelbare Oberflächen für die Roblox-Materialien.
// Die echten Roblox-Bilder liegen nur in Studio; diese hier sind ihnen nachgezeichnet.

import * as THREE from 'three';

const cache = new Map();
function make(key, size, draw, { repeat = false, srgb = true } = {}) {
  if (cache.has(key)) return cache.get(key);
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  cache.set(key, t);
  return t;
}

function rng(seed) {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

// ── Teilchen ──
const radial = (g, s, stops) => {
  const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  for (const [k, c] of stops) r.addColorStop(k, c);
  g.fillStyle = r;
  g.fillRect(0, 0, s, s);
};
const PARTICLE = {
  // rbxasset://textures/particles/sparkles_main.dds – vierstrahliges Funkeln mit weichem Kern
  sparkles: (g, s) => {
    radial(g, s, [[0, 'rgba(255,255,255,1)'], [0.12, 'rgba(255,255,255,.8)'], [0.35, 'rgba(255,255,255,.18)'], [1, 'rgba(255,255,255,0)']]);
    g.globalCompositeOperation = 'lighter';
    for (const [w, h] of [[s * 0.5, s * 0.03], [s * 0.03, s * 0.5]]) {
      const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      gr.addColorStop(0, 'rgba(255,255,255,1)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr;
      g.fillRect(s / 2 - w, s / 2 - h, w * 2, h * 2);
    }
  },
  // rbxasset://textures/particles/fire_main.dds – weiche Flamme
  fire: (g, s) => {
    const r = rng(3);
    for (let i = 0; i < 9; i++) {
      const x = s / 2 + (r() - 0.5) * s * 0.25, y = s * (0.42 + r() * 0.2), rad = s * (0.18 + r() * 0.16);
      const gr = g.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, 'rgba(255,255,255,.55)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr;
      g.fillRect(0, 0, s, s);
    }
  },
  // rbxasset://textures/particles/smoke_main.dds – Rauchwolke
  smoke: (g, s) => {
    const r = rng(7);
    for (let i = 0; i < 14; i++) {
      const x = s / 2 + (r() - 0.5) * s * 0.4, y = s / 2 + (r() - 0.5) * s * 0.4, rad = s * (0.14 + r() * 0.18);
      const gr = g.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, 'rgba(255,255,255,.35)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr;
      g.fillRect(0, 0, s, s);
    }
  },
  // rbxasset://textures/particles/explosion01_core.dds und andere: weicher Punkt
  dot: (g, s) => radial(g, s, [[0, 'rgba(255,255,255,1)'], [0.3, 'rgba(255,255,255,.7)'], [1, 'rgba(255,255,255,0)']]),
  square: (g, s) => {
    g.fillStyle = '#fff';
    g.fillRect(s * 0.18, s * 0.18, s * 0.64, s * 0.64);
  },
};
const PARTICLE_URL = {
  'rbxasset://textures/particles/sparkles_main.dds': 'sparkles',
  'rbxasset://textures/particles/fire_main.dds': 'fire',
  'rbxasset://textures/particles/smoke_main.dds': 'smoke',
  'rbxasset://textures/particles/explosion01_core.dds': 'dot',
};
export function particleTexture(url) {
  const name = PARTICLE_URL[url] || (url ? 'dot' : 'sparkles');
  return make('p-' + name, 128, PARTICLE[name]);
}

// ── Materialien: Graustufen-Struktur, wird mit der Teilfarbe multipliziert (128 = neutral) ──
function noise(g, s, seed, n, size, alpha, light = true) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const v = light ? (r() > 0.5 ? 255 : 0) : 0;
    g.fillStyle = `rgba(${v},${v},${v},${alpha * r()})`;
    const w = size * (0.5 + r());
    g.fillRect(r() * s, r() * s, w, w);
  }
}
function blotches(g, s, seed, n, rad, alpha) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = r() * s, y = r() * s, rr = rad * (0.5 + r()), v = r() > 0.5 ? 255 : 0;
    for (const dx of [-s, 0, s]) for (const dy of [-s, 0, s]) {
      const gr = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, rr);
      gr.addColorStop(0, `rgba(${v},${v},${v},${alpha})`);
      gr.addColorStop(1, `rgba(${v},${v},${v},0)`);
      g.fillStyle = gr;
      g.fillRect(x + dx - rr, y + dy - rr, rr * 2, rr * 2);
    }
  }
}
function cracks(g, s, seed, n, width, color) {
  const r = rng(seed);
  g.strokeStyle = color;
  g.lineWidth = width;
  for (let i = 0; i < n; i++) {
    let x = r() * s, y = r() * s;
    g.beginPath();
    g.moveTo(x, y);
    for (let k = 0; k < 6; k++) {
      x += (r() - 0.5) * s * 0.25;
      y += (r() - 0.5) * s * 0.25;
      g.lineTo(x, y);
    }
    g.stroke();
  }
}
function tiles(g, s, cols, rows, gap, seed, shade) {
  const r = rng(seed);
  const w = s / cols, h = s / rows;
  g.fillStyle = 'rgb(70,70,70)';
  g.fillRect(0, 0, s, s);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const off = (y % 2) * w * 0.5;
    const v = 128 + (r() - 0.5) * shade;
    g.fillStyle = `rgb(${v},${v},${v})`;
    for (const dx of [-s, 0]) g.fillRect(x * w + off + gap + dx, y * h + gap, w - gap * 2, h - gap * 2);
  }
}
const base = (g, s) => {
  g.fillStyle = 'rgb(128,128,128)';
  g.fillRect(0, 0, s, s);
};
// Kachelgröße in Studs je Material
export const MATERIAL_TILE = { Grass: 8, Slate: 8, Concrete: 6, Sand: 6, Rock: 8, Basalt: 8, CrackedLava: 8, Marble: 10, Snow: 8, Glacier: 8, Ice: 8, Wood: 4, WoodPlanks: 8, Brick: 6, Cobblestone: 6, Pebble: 4, Granite: 6, DiamondPlate: 3, Metal: 6, Foil: 4, Fabric: 2, Plastic: 4 };
const MATERIAL = {
  Grass: (g, s) => { base(g, s); blotches(g, s, 11, 30, s * 0.12, 0.12); noise(g, s, 12, 2200, 2, 0.35); },
  Slate: (g, s) => { base(g, s); blotches(g, s, 21, 18, s * 0.2, 0.12); cracks(g, s, 22, 14, 2, 'rgba(0,0,0,.35)'); noise(g, s, 23, 800, 2, 0.15); },
  Concrete: (g, s) => { base(g, s); blotches(g, s, 31, 20, s * 0.15, 0.06); noise(g, s, 32, 3000, 1.5, 0.25); },
  Sand: (g, s) => { base(g, s); noise(g, s, 41, 5000, 1, 0.3); for (let i = 0; i < 6; i++) { g.strokeStyle = 'rgba(255,255,255,.08)'; g.lineWidth = 6; g.beginPath(); for (let x = 0; x <= s; x += 8) g.lineTo(x, (i + 0.5) * (s / 6) + Math.sin(x / s * Math.PI * 4 + i) * 6); g.stroke(); } },
  Rock: (g, s) => { base(g, s); blotches(g, s, 51, 28, s * 0.14, 0.18); cracks(g, s, 52, 8, 2, 'rgba(0,0,0,.3)'); noise(g, s, 53, 1200, 2, 0.2); },
  Basalt: (g, s) => { tiles(g, s, 4, 4, 2, 61, 50); noise(g, s, 62, 1500, 2, 0.2); },
  CrackedLava: (g, s) => { base(g, s); blotches(g, s, 71, 20, s * 0.15, 0.12); cracks(g, s, 72, 18, 3, 'rgba(255,255,255,.55)'); },
  Marble: (g, s) => { g.fillStyle = 'rgb(150,150,150)'; g.fillRect(0, 0, s, s); blotches(g, s, 81, 10, s * 0.3, 0.08); cracks(g, s, 82, 10, 1.5, 'rgba(0,0,0,.18)'); },
  Snow: (g, s) => { g.fillStyle = 'rgb(140,140,140)'; g.fillRect(0, 0, s, s); blotches(g, s, 91, 24, s * 0.16, 0.06); noise(g, s, 92, 1500, 1.5, 0.12); },
  Glacier: (g, s) => { base(g, s); blotches(g, s, 101, 14, s * 0.2, 0.1); cracks(g, s, 102, 10, 2, 'rgba(255,255,255,.35)'); },
  Ice: (g, s) => { g.fillStyle = 'rgb(140,140,140)'; g.fillRect(0, 0, s, s); cracks(g, s, 111, 6, 1.5, 'rgba(255,255,255,.3)'); },
  Wood: (g, s) => { base(g, s); for (let y = 0; y < s; y += 3) { const v = 128 + Math.sin(y * 0.35 + Math.sin(y * 0.05) * 4) * 22; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(0, y, s, 3); } noise(g, s, 121, 600, 2, 0.1); },
  WoodPlanks: (g, s) => { tiles(g, s, 2, 6, 1.5, 131, 40); for (let y = 0; y < s; y += 2) { g.fillStyle = `rgba(0,0,0,${0.05 + 0.05 * Math.sin(y)})`; g.fillRect(0, y, s, 1); } },
  Brick: (g, s) => { tiles(g, s, 4, 8, 3, 141, 40); noise(g, s, 142, 1500, 2, 0.15); },
  Cobblestone: (g, s) => { g.fillStyle = 'rgb(70,70,70)'; g.fillRect(0, 0, s, s); const r = rng(151); for (let i = 0; i < 40; i++) { const v = 110 + r() * 50; g.fillStyle = `rgb(${v},${v},${v})`; g.beginPath(); g.ellipse(r() * s, r() * s, s * (0.06 + r() * 0.05), s * (0.05 + r() * 0.04), r() * 3, 0, Math.PI * 2); g.fill(); } },
  Pebble: (g, s) => { base(g, s); const r = rng(161); for (let i = 0; i < 160; i++) { const v = 100 + r() * 80; g.fillStyle = `rgb(${v},${v},${v})`; g.beginPath(); g.ellipse(r() * s, r() * s, 3 + r() * 6, 2 + r() * 5, r() * 3, 0, Math.PI * 2); g.fill(); } },
  Granite: (g, s) => { base(g, s); noise(g, s, 171, 6000, 2, 0.4); },
  DiamondPlate: (g, s) => { g.fillStyle = 'rgb(120,120,120)'; g.fillRect(0, 0, s, s); for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.save(); g.translate((x + 0.5 + (y % 2) * 0.5) * s / 4, (y + 0.5) * s / 4); g.rotate(y % 2 ? 0.8 : -0.8); g.fillStyle = 'rgb(175,175,175)'; g.fillRect(-s / 14, -s / 50, s / 7, s / 25); g.restore(); } },
  Metal: (g, s) => { base(g, s); for (let y = 0; y < s; y++) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.06})`; g.fillRect(0, y, s, 1); } },
  Foil: (g, s) => { base(g, s); blotches(g, s, 181, 60, s * 0.06, 0.25); },
  Fabric: (g, s) => { base(g, s); for (let i = 0; i < s; i += 4) { g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(i, 0, 2, s); g.fillRect(0, i, s, 2); } },
  Plastic: (g, s) => { base(g, s); noise(g, s, 191, 400, 1, 0.05); },
};
export function materialTexture(name) {
  if (!MATERIAL[name]) return null;
  return make('m-' + name, 256, MATERIAL[name], { repeat: true, srgb: false });
}
