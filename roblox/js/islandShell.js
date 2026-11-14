// Inselhülle: Grasnarbe am Rand, Erdschicht und eine nach unten spitz zulaufende Felszunge – als eine durchgehende,
// modellierte Fläche aus Dreiecken (in Roblox je zwei Keile, wie der Boden). Vorbild: schwebende Inseln mit
// überhängender Grasnarbe, darunter Erde mit zackiger Grenze und zerklüfteter Fels mit senkrechten Rippen,
// waagrechten Schichtbändern und Nebenspitzen.
//
//   islandShell(out, built, world)        Hülle der Hauptinsel (ersetzt Grasrand, Erdkante und Felsunterseite)
//   miniIsland(out, center, w, world, …)  kleine schwebende Insel für die Umgebung (gleicher Aufbau, weniger Teile)
//
// Stil je Welt (STYLE): Rand (Gras, Schnee, Zuckerguss, Kante), Gestein und Anhängsel (Grashalme und Wurzeln,
// Eiszapfen, Lava-Adern, Kristalle, Seetang …). Farben kommen aus der Welt (ground, side, rock).

import * as THREE from 'three';
import { triangleWedges, STUDS, vivid, relL } from './worldParts.js';

const TAU = Math.PI * 2;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const P = (a, r, y) => V(Math.cos(a) * r, y, Math.sin(a) * r);

function seeded(str) {
  let h = 2166136261;
  for (const ch of str) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}
const col = (c) => new THREE.Color(c);
const hex = (c) => '#' + c.getHexString();
const mix = (a, b, k) => hex(col(a).lerp(col(b), Math.max(0, Math.min(1, k))));
const tone = (c, s, l) => hex(col(c).offsetHSL(0, s, relL(c, l))); // bei dunklen Farben anteilig, nie schwarz

// ── Stil je Welt ──
// lip: grass | snow | frost (Zuckerguss) | plain (Kante im Bodenton) · hang: Anhängsel unter dem Rand
// glow: Lava-Adern im Fels · crystals: Kristalle aus der Unterseite · depth: Tiefe der Felszunge (× Radius)
const LIP = { Grass: 'grass', Snow: 'snow' };
const STYLE = {
  spawn: { hang: ['grass', 'roots', 'vines'], rockTint: '#a08a72' },
  normal: { hang: ['grass', 'roots', 'vines'], rockTint: '#a08a72' },
  wald: { hang: ['grass', 'roots', 'roots', 'moss'], depth: 1.15, rockTint: '#7a7462' },
  stadt: { lip: 'plain', hang: ['pipes'], rockMat: 'Slate', rockTint: '#8a8c98', rockLift: 0.12 },
  eis: { lip: 'snow', hang: ['icicles'], rockMat: 'Glacier', rockTint: '#9fc4e8' },
  lava: { lip: 'plain', glow: '#ff5a14', hang: ['lavadrips'], rockMat: 'Basalt' },
  hoehle: { lip: 'plain', crystals: ['#b07bff', '#6ae8ff', '#ff7ae0'], hang: ['crystals'], rockMat: 'Slate', rockTint: '#5a4a78', rockLift: 0.12, rimCrystals: true },
  // Candy: oben Tortenschichten (Schokolade, Sahne, Biskuit, Erdbeere), darunter Keks
  candy: { lip: 'frost', lipColor: '#fff4fa', hang: ['frosting'], rockMat: 'SmoothPlastic', soilMat: 'SmoothPlastic', soilDepth: 4.2, layers: ['#6e3a22', '#fff0f6', '#e8b070', '#ff9ac4', '#7a4428', '#fff6e0'] },
  mond: { lip: 'plain', rockMat: 'Rock', depth: 0.95 },
  neptun: { lip: 'plain', crystals: '#9fe0ff', hang: ['icicles', 'crystals'], rockMat: 'Glacier', rockLift: 0.15 },
  mars: { lip: 'plain', rockMat: 'Rock' },
  saturn: { lip: 'plain', rockMat: 'Rock' },
  alien: { lip: 'plain', glow: '#86ff52', hang: ['glowvines'], rockMat: 'Slate' },
  sonne: { lip: 'plain', glow: '#ffb02e', hang: ['lavadrips'], rockMat: 'Basalt' },
  korallenriff: { lip: 'plain', hang: ['kelp', 'corals'], rockMat: 'Pebble', rockTint: '#c8b48e', rockLift: 0.12 },
  muschelland: { lip: 'plain', hang: ['kelp', 'pearls', 'corals'], rockMat: 'Pebble', rockTint: '#d8b8b0', rockLift: 0.12 },
  atlantis: { lip: 'plain', glow: '#5affd8', hang: ['kelp', 'lavadrips'], rockMat: 'Slate' },
  tiefseegraben: { lip: 'plain', glow: '#3ee6ff', hang: ['kelp'], rockMat: 'Basalt' },
  wolkenburg: { lip: 'plain', hang: ['clouds'], rockMat: 'Marble', depth: 0.8 },
  engelsgarten: { hang: ['grass', 'vines', 'clouds'], rockMat: 'Marble' },
  goetterthron: { lip: 'plain', hang: ['clouds'], rockMat: 'Marble' },
  quarzfeld: { lip: 'plain', crystals: '#f0ecff', hang: ['crystals'], rockMat: 'Marble' },
  amethystgrotte: { lip: 'plain', crystals: '#c08bff', hang: ['crystals'], rockMat: 'Slate' },
  topasduenen: { lip: 'plain', crystals: '#ffc04a', hang: ['crystals'], rockMat: 'Rock' },
  smaragdwald: { hang: ['grass', 'roots', 'crystals'], crystals: '#3cff9a', rockTint: '#5e6a62', soilTint: '#5e4430' },
  jadetempel: { hang: ['grass', 'vines', 'crystals'], crystals: '#8affc0', rockTint: '#7a8478', soilTint: '#6a4e34' },
  saphirsee: { lip: 'plain', crystals: '#5a8aff', hang: ['crystals', 'icicles'], rockMat: 'Marble' },
  rubinvulkan: { lip: 'plain', glow: '#ff2a4a', crystals: '#ff3a5a', hang: ['crystals', 'lavadrips'], rockMat: 'Basalt' },
  opalwolken: { lip: 'plain', crystals: '#ffd6ff', hang: ['crystals', 'clouds'], rockMat: 'Marble' },
  diamantkern: { lip: 'plain', crystals: '#e8fcff', hang: ['crystals', 'icicles'], rockMat: 'Glacier' },
};
const GROUND_MAT = {
  normal: 'Grass', wald: 'Grass', spawn: 'Grass', engelsgarten: 'Grass', smaragdwald: 'Grass', jadetempel: 'Grass',
  eis: 'Snow',
};
// Farben der Hülle: Fels etwas heller und erdiger als die Grundfarbe, damit Grate und Schichten Licht fangen
function palette(world, st) {
  const ground = vivid(world.ground, 0.25), soil = st.soilTint ? mix(vivid(world.side, 0.15), st.soilTint, 0.75) : vivid(world.side, 0.15);
  const rockBase = st.rockTint ? mix(vivid(world.rock, 0.12), st.rockTint, 0.55) : vivid(world.rock, 0.12);
  const rock = tone(mix(rockBase, soil, st.rockMix ?? 0.3), -0.04, st.rockLift ?? 0.09);
  return {
    ground, soil, rock,
    rockTones: [tone(rock, 0, 0.11), tone(rock, 0, 0.055), rock, tone(rock, 0.01, -0.055), tone(rock, 0.02, -0.11)],
    soilTones: [tone(soil, 0.02, 0.08), tone(soil, 0, 0.04), soil, tone(soil, 0.02, -0.045), tone(soil, 0.03, -0.09)],
  };
}
// weiche Zufallsreihe rund um die Insel (Nachbarn ähnlich, einzelne dunkle Risse)
function smoothRing(n, rand, passes = 2) {
  let v = Array.from({ length: n }, () => rand());
  for (let p = 0; p < passes; p++) v = v.map((_, j) => (v[(j + n - 1) % n] + 2 * v[j] + v[(j + 1) % n]) / 4);
  const lo = Math.min(...v), hi = Math.max(...v);
  return v.map((x) => (x - lo) / (hi - lo || 1));
}
function styleOf(world) {
  const s = STYLE[world.id] || {};
  const lip = s.lip || LIP[GROUND_MAT[world.id]] || 'plain';
  return { depth: 1.3, rockMat: 'Slate', soilMat: lip === 'grass' ? 'Ground' : s.rockMat || 'Slate', hang: [], ...s, lip };
}

// Ausgabe: Dreieck → Keile (Studs), Körper nach innen (outward zeigt nach außen)
function tri(out, a, b, c, color, material, name, outward, thick = 0.2) {
  for (const w of triangleWedges(a, b, c, thick, outward)) {
    out.push({
      shape: 'Wedge', className: 'WedgePart', name,
      pos: [w.pos.x * STUDS, w.pos.y * STUDS, w.pos.z * STUDS], rot: w.rot,
      size: [w.size[0] * STUDS, w.size[1] * STUDS, w.size[2] * STUDS],
      color, material, transparency: 0,
    });
  }
}
// Zwei Ringe (gleich viele Punkte, geschlossen) zu Dreiecken verbinden; colorOf(j, k) gibt Farbe und Material je Viereck
function band(out, A, B, colorOf, name, outY, center, thick) {
  const n = A.length;
  for (let j = 0; j < n; j++) {
    const j1 = (j + 1) % n;
    const [c0, m0] = colorOf(j, 0), [c1, m1] = colorOf(j, 1);
    const q = [[A[j], B[j], B[j1], c0, m0], [A[j], B[j1], A[j1], c1, m1]];
    for (const [a, b, c, color, mat] of q) {
      const mid = a.clone().add(b).add(c).multiplyScalar(1 / 3);
      const o = V(mid.x - center.x, 0, mid.z - center.z).normalize();
      o.y = outY;
      tri(out, a, b, c, color, mat, name, o, thick);
    }
  }
}
// Spitzer Kegel (Eiszapfen, Felsspitze, Kristall): Grundfläche bei top (n Ecken), Spitze bei tip
function spike(out, top, tip, r, n, color, material, name, rand, twist = 0) {
  const ring = [];
  const ax = tip.clone().sub(top).normalize();
  const u = Math.abs(ax.y) > 0.9 ? V(1, 0, 0) : V(0, 1, 0);
  const s1 = u.clone().cross(ax).normalize(), s2 = ax.clone().cross(s1).normalize();
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + twist, rr = r * (0.85 + rand() * 0.3);
    ring.push(top.clone().addScaledVector(s1, Math.cos(a) * rr).addScaledVector(s2, Math.sin(a) * rr));
  }
  for (let i = 0; i < n; i++) {
    const a = ring[i], b = ring[(i + 1) % n];
    const mid = a.clone().add(b).add(tip).multiplyScalar(1 / 3);
    const ctr = top.clone().add(tip).multiplyScalar(0.5);
    tri(out, a, b, tip, Array.isArray(color) ? color[i % color.length] : color, material, name, mid.sub(ctr), Math.min(0.12, r * 0.5));
  }
}
// Kristall: sechseckiges Prisma mit Spitze (wie die Kristalle des Juwelnebels, aber frei ausgerichtet)
function crystal(out, base, dir, len, r, color, rand, mat = 'Glass') {
  const ax = dir.clone().normalize();
  const u = Math.abs(ax.y) > 0.9 ? V(1, 0, 0) : V(0, 1, 0);
  const s1 = u.clone().cross(ax).normalize(), s2 = ax.clone().cross(s1).normalize();
  const n = 6, body = len * 0.72, a0 = rand() * TAU;
  const ring = (d, rr) => Array.from({ length: n }, (_, i) => base.clone().addScaledVector(ax, d).addScaledVector(s1, Math.cos(a0 + (i / n) * TAU) * rr).addScaledVector(s2, Math.sin(a0 + (i / n) * TAU) * rr));
  const b0 = ring(-0.1 * len, r * 0.9), b1 = ring(body, r);
  const tip = base.clone().addScaledVector(ax, len);
  const light = tone(color, 0, 0.12), dark = tone(color, 0, -0.1);
  for (let i = 0; i < n; i++) {
    const i1 = (i + 1) % n, c = i % 2 ? light : color;
    const ctr = base.clone().addScaledVector(ax, body * 0.5);
    const m1 = b0[i].clone().add(b1[i1]).multiplyScalar(0.5).sub(ctr);
    tri(out, b0[i], b1[i], b1[i1], c, mat, 'Kristall', m1, 0.06);
    tri(out, b0[i], b1[i1], b0[i1], c, mat, 'Kristall', m1, 0.06);
    const m2 = b1[i].clone().add(b1[i1]).add(tip).multiplyScalar(1 / 3).sub(ctr);
    tri(out, b1[i], b1[i1], tip, i % 2 ? dark : light, mat, 'Kristall', m2, 0.06);
  }
}

// ── Profil der Felszunge ──
// f(t): Radius-Anteil in Tiefe t (0 oben … 1 Spitze): oben fast senkrecht (Erdwand), dann bauchig, unten spitz
const profile = (t) => Math.max(0, 1 - Math.pow(t, 1.75)) * (1 - 0.06 * t);

// Rippen: scharfe senkrechte Grate (Grat = 1 − |sin|) rund um die Zunge, mit der Tiefe leicht verdreht,
// dazu breite Ausbuchtungen. Ergebnis etwa −1 … 1.
function ridgeField(rand) {
  const sharp = [[9, 1], [15, 0.7], [23, 0.45]].map(([k, w]) => ({ k, w, ph: rand() * TAU, drift: (rand() - 0.5) * 0.9 }));
  const broad = [[3, 1], [5, 0.6]].map(([k, w]) => ({ k, w, ph: rand() * TAU }));
  const ts = sharp.reduce((s, x) => s + x.w, 0), tb = broad.reduce((s, x) => s + x.w, 0);
  return (a, t) =>
    (sharp.reduce((s, x) => s + x.w * (1 - 2 * Math.abs(Math.sin(x.k * a * 0.5 + x.ph + x.drift * t))), 0) / ts) * 0.6 +
    (broad.reduce((s, x) => s + x.w * Math.sin(x.k * a + x.ph), 0) / tb) * 0.4;
}

// Ringe der Zunge: t-Werte (dicht oben, wo die Erdwand Details hat)
const LEVELS = [0, 0.035, 0.08, 0.13, 0.19, 0.26, 0.34, 0.43, 0.53, 0.63, 0.73, 0.82, 0.9, 0.96];

// Hülle der Hauptinsel
export function islandShell(out, built, world) {
  const R = built.radius, st = styleOf(world);
  const rand = seeded(world.id + ':huelle');
  const N = 80;
  const { ground, rockTones, soilTones } = palette(world, st);
  const ridge = ridgeField(rand);
  const depth = st.depth * R;
  const yTop = -0.25;
  const angle = (j) => (j / N) * TAU;
  // Radius der Zunge bei Winkel a und Tiefe t (ohne Zufall; die Anhängsel sitzen darauf)
  const amp = (t) => 0.03 + 0.2 * Math.pow(t, 0.85);
  const surf = (a, t) => (R + 0.02) * profile(t) * (1 + ridge(a, t) * amp(t));
  const yAt = (t) => yTop - t * depth;
  // die Zunge hängt nach unten leicht schief (wie gewachsener Fels, nicht gedrechselt)
  const leanA = rand() * TAU, leanR = R * (0.1 + rand() * 0.08);
  const PL = (a, r, y) => {
    const t = Math.max(0, Math.min(1.05, (yTop - y) / depth));
    return P(a, r, y).add(V(Math.cos(leanA) * leanR * t * t, 0, Math.sin(leanA) * leanR * t * t));
  };
  // Höhe des Bodens am Rand je Winkel
  const rimH = Array.from({ length: N }, (_, j) => Math.max(built.height(Math.cos(angle(j)) * (R - 0.3), Math.sin(angle(j)) * (R - 0.3)), 0.05));
  const drip = Array.from({ length: N }, () => rand()); // wie weit die Grasnarbe herunterhängt
  // Grenze Erde/Fels: zackig, im Mittel 2,4 Einheiten unter dem Rand
  const soilLine = Array.from({ length: N }, (_, j) => -(st.soilDepth ?? 2.6) - 1.1 * Math.sin(angle(j) * 7 + 1.1) - 0.7 * Math.sin(angle(j) * 17 + 0.3) - (rand() - 0.5) * 1.4);
  // senkrechte Streifen: weich über die Spalten verlaufend, über alle Ringe gleich; dazu einzelne dunkle Risse
  const streak = smoothRing(N, rand, 2);
  const crack = Array.from({ length: N }, () => rand() < 0.12);
  const center = V(0, 0, 0);

  // ── Rand: überhängende Narbe (Gras, Schnee, Zuckerguss) oder abgerundete Kante im Bodenton ──
  const lipColor = st.lip === 'grass' ? ground : st.lip === 'snow' ? '#ffffff' : st.lip === 'frost' ? st.lipColor : ground;
  const lipMat = st.lip === 'grass' ? 'Grass' : st.lip === 'snow' ? 'Snow' : st.lip === 'frost' ? 'SmoothPlastic' : (st.soilMat === 'Ground' ? 'Slate' : st.rockMat);
  const over = st.lip === 'plain' ? 0.08 : 0.2; // Überhang
  const lipDrop = st.lip === 'plain' ? 0.25 : 0.45;
  const L = [
    (j) => P(angle(j), R - 0.55, rimH[j] + 0.035),
    (j) => P(angle(j), R - 0.08, rimH[j] + 0.075),
    (j) => P(angle(j), R + over, rimH[j] - 0.1),
    (j) => P(angle(j), R + over * 0.75, rimH[j] - lipDrop - drip[j] * (st.lip === 'plain' ? 0.1 : 0.35)),
  ];
  const lipRings = L.map((f) => Array.from({ length: N }, (_, j) => f(j)));
  const lipTones = [tone(lipColor, 0.02, 0.05), lipColor, tone(lipColor, 0.03, -0.07)];
  for (let i = 0; i < 3; i++) band(out, lipRings[i], lipRings[i + 1], () => [lipTones[i], lipMat], 'Rand', i < 2 ? 1 : -0.2, center, 0.22);

  // ── Körper: Erdwand und Fels bis zur Spitze ──
  const rings = LEVELS.map((t, i) =>
    Array.from({ length: N }, (_, j) => {
      const a = angle(j);
      // oberster Ring sitzt unter der Narbe; sonst kleine Unruhe, damit keine Linie zu gerade ist
      if (i === 0) return P(a, R + 0.03, Math.min(rimH[j] - 0.3, yTop + 0.1));
      const ledge = 0.02 * Math.sin(t * 23 + Math.sin(a * 3) * 0.8); // waagrechte Schichtstufen
      const r = surf(a, t) * (1 + ledge + (rand() - 0.5) * 0.03);
      return PL(a + (rand() - 0.5) * 0.004, Math.max(0.12, r), yAt(t) + (rand() - 0.5) * 0.18);
    }),
  );
  // Farbe je Viereck (beide Dreiecke gleich): Erde über der Zackenlinie, darunter Fels.
  // Grate heller, Rinnen dunkler, senkrechte Streifen und schwache waagrechte Schichten, nach unten dunkler.
  const quadColor = (i, j) => {
    const t = (LEVELS[i] + LEVELS[i + 1]) / 2, a = angle(j + 0.5);
    const y = yAt(t);
    const rg = ridge(a, t);
    const strata = Math.sin(y * 1.3 + Math.sin(a * 2) * 0.8) * 0.35;
    const v = -rg * 1.1 + (streak[j] - 0.5) * 1.5 + strata + (crack[j] && t > 0.1 ? 1 : 0);
    if (y > soilLine[j]) {
      if (st.layers) return [st.layers[Math.floor(Math.max(0, -y - 0.2) / 0.62) % st.layers.length], st.soilMat];
      return [soilTones[Math.max(0, Math.min(4, Math.round(2 + v * 0.8)))], st.soilMat];
    }
    const deep = t > 0.7 ? 0.6 : 0;
    return [rockTones[Math.max(0, Math.min(4, Math.round(2 + v + deep)))], st.rockMat];
  };
  for (let i = 0; i + 1 < rings.length; i++)
    band(out, rings[i], rings[i + 1], (j) => quadColor(i, j), LEVELS[i + 1] < 0.2 ? 'Erde' : 'Fels', -0.25, center, 0.3);
  // Spitze schließen (leicht aus der Mitte)
  const tip = PL(0, 0, yAt(1.04)).add(V((rand() - 0.5) * R * 0.08, 0, (rand() - 0.5) * R * 0.08));
  const last = rings[rings.length - 1];
  for (let j = 0; j < N; j++) {
    const mid = last[j].clone().add(last[(j + 1) % N]).add(tip).multiplyScalar(1 / 3);
    tri(out, last[j], last[(j + 1) % N], tip, rockTones[(j % 2) + 3], st.rockMat, 'Fels', V(mid.x, -0.5, mid.z), 0.3);
  }

  // ── Nebenspitzen: kleinere Zungen hängen außen aus der Unterseite ──
  const nTips = 8;
  for (let i = 0; i < nTips; i++) {
    const a = (i / nTips) * TAU + rand() * 0.5, t = 0.3 + rand() * 0.35;
    const rr = surf(a, t) * 0.84, y = yAt(t) + 0.6;
    const len = depth * (0.14 + rand() * 0.18);
    spike(out, PL(a, rr, y), PL(a + (rand() - 0.5) * 0.08, rr * 0.9, y - len), R * (0.11 + rand() * 0.06), 7, [rockTones[2], rockTones[3], rockTones[2], rockTones[4]], st.rockMat, 'Fels', rand, rand() * TAU);
  }
  hangers(out, st, { R, N, angle, rimH, drip, surf, yAt, depth, rand, lipRings, rockTones, soilLine, world, PL });
}

// ── Anhängsel je Stil ──
function hangers(out, st, g) {
  const { R, N, angle, rimH, rand, lipRings, surf, yAt, rockTones } = g;
  const P = g.PL; // Punkte auf der (schiefen) Zunge
  const kinds = new Set(st.hang);
  const lipBottom = lipRings[3];
  if (kinds.has('grass')) {
    // Grashalme hängen in Büscheln von der Narbe
    const green = vivid('#4f9a3c', 0.2), light = vivid('#79c24f', 0.2);
    for (let j = 0; j < N; j++) {
      for (let h = 0; h < 3; h++) {
        const a = angle(j) + (h / 3) * (TAU / N) + (rand() - 0.5) * 0.02;
        const top = P(a, R + 0.08, lipBottom[j].y + 0.12);
        const len = 0.25 + rand() * (rand() < 0.15 ? 1.1 : 0.45);
        const w = 0.09 + rand() * 0.06;
        const t1 = P(a - w / R, R + 0.1, top.y), t2 = P(a + w / R, R + 0.1, top.y);
        const end = P(a + (rand() - 0.5) * 0.03, R + 0.12 + rand() * 0.12, top.y - len);
        tri(out, t1, t2, end, rand() < 0.5 ? green : light, 'Grass', 'Gras', V(Math.cos(a), 0, Math.sin(a)), 0.03);
      }
    }
  }
  if (kinds.has('roots')) {
    // Wurzeln wachsen aus der Erdschicht, gebogen und dünner werdend
    const wood = '#6b4a2e', dark = '#4f3824';
    const n = kinds.has('moss') ? 34 : 22;
    for (let i = 0; i < n; i++) {
      const a = rand() * TAU;
      let p = P(a, R + 0.02, -0.6 - rand() * 0.6), w = 0.08 + rand() * 0.06;
      const segs = 3 + Math.floor(rand() * 3);
      for (let s = 0; s < segs; s++) {
        const len = 0.5 + rand() * 0.6;
        const next = p.clone().add(V(Math.cos(a) * (0.05 + rand() * 0.15) + (rand() - 0.5) * 0.2, -len, Math.sin(a) * (0.05 + rand() * 0.15) + (rand() - 0.5) * 0.2));
        spike(out, p, next.clone().addScaledVector(next.clone().sub(p).normalize(), w), w, 5, [wood, dark], 'Wood', 'Wurzel', rand);
        p = next;
        w *= 0.8;
      }
    }
  }
  if (kinds.has('moss')) {
    // Moospolster an der Erdkante
    for (let i = 0; i < 40; i++) {
      const a = rand() * TAU, y = -0.5 - rand() * 0.9;
      const c = P(a, R + 0.08, y);
      spike(out, c.clone().add(V(0, 0.15, 0)), c.clone().add(V(Math.cos(a) * 0.05, -0.35 - rand() * 0.3, Math.sin(a) * 0.05)), 0.28 + rand() * 0.2, 6, ['#3f7a2e', '#5a9a3c'], 'Grass', 'Moos', rand);
    }
  }
  if (kinds.has('vines')) {
    // Ranken mit Blättern, länger als die Halme
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * TAU + rand() * 0.2;
      let p = P(a, R + 0.12, rimH[Math.floor((a / TAU) * N) % N] - 0.3);
      const segs = 4 + Math.floor(rand() * 5);
      for (let s = 0; s < segs; s++) {
        const next = p.clone().add(V((rand() - 0.5) * 0.25, -0.45 - rand() * 0.25, (rand() - 0.5) * 0.25)).add(V(Math.cos(a) * 0.04, 0, Math.sin(a) * 0.04));
        spike(out, p, next.clone().add(V(0, -0.06, 0)), 0.05, 4, '#3d8a37', 'Grass', 'Ranke', rand);
        if (s % 2 === 1) {
          const leaf = next.clone();
          const side = V(-Math.sin(a), 0, Math.cos(a)).multiplyScalar(rand() < 0.5 ? 0.22 : -0.22);
          tri(out, leaf, leaf.clone().add(side).add(V(0, 0.1, 0)), leaf.clone().add(side.clone().multiplyScalar(0.6)).add(V(Math.cos(a) * 0.1, -0.12, Math.sin(a) * 0.1)), rand() < 0.5 ? '#58b843' : '#6fd04f', 'Grass', 'Ranke', V(Math.cos(a), 0, Math.sin(a)), 0.03);
        }
        p = next;
      }
    }
  }
  if (kinds.has('icicles')) {
    for (let j = 0; j < N; j++) {
      if (rand() < 0.35) continue;
      const a = angle(j) + (rand() - 0.5) * 0.05;
      const top = P(a, R + 0.05, lipRings[3][j].y + 0.1);
      const len = 0.35 + rand() * (rand() < 0.2 ? 1.6 : 0.6);
      spike(out, top, P(a, R + 0.08, top.y - len), 0.07 + rand() * 0.07, 5, ['#e8f8ff', '#bfe8ff'], 'Ice', 'Eiszapfen', rand);
    }
    // große Zapfen unter der Felszunge
    for (let i = 0; i < 14; i++) {
      const a = rand() * TAU, t = 0.15 + rand() * 0.55;
      const rr = surf(a, t) * 0.9, y = yAt(t);
      spike(out, P(a, rr, y), P(a, rr * 0.95, y - 1 - rand() * 2.2), 0.18 + rand() * 0.15, 6, ['#d8f4ff', '#9fd8f4'], 'Ice', 'Eiszapfen', rand);
    }
  }
  if (kinds.has('frosting')) {
    // Zuckerguss läuft in runden Tropfen über die Kante
    const cream = '#fff4fa', pink = '#ffd0e8';
    for (let j = 0; j < N; j++) {
      const a = angle(j);
      const top = P(a, R + 0.12, lipRings[3][j].y + 0.15);
      const len = 0.25 + rand() * (rand() < 0.3 ? 1.2 : 0.4);
      spike(out, top, P(a, R + 0.15, top.y - len), 0.16, 6, [cream, pink], 'SmoothPlastic', 'Zuckerguss', rand);
      out.push({ shape: 'Ellipsoid', name: 'Zuckerguss', pos: P(a, R + 0.15, top.y - len).multiplyScalar(STUDS).toArray(), rot: [1, 0, 0, 0, 1, 0, 0, 0, 1], size: [0.34 * STUDS, 0.38 * STUDS, 0.34 * STUDS], color: cream, material: 'SmoothPlastic', transparency: 0 });
    }
    // bunte Streusel auf dem Zuckerguss
    const spr = ['#ff5fb0', '#7ad7ff', '#ffe25f', '#8cff7a', '#c48bff'];
    for (let i = 0; i < 90; i++) {
      const a = rand() * TAU, j = Math.floor((a / TAU) * N) % N;
      out.push({ shape: 'Block', name: 'Streusel', pos: P(a, R + 0.12, rimH[j] - 0.05 - rand() * 0.2).multiplyScalar(STUDS).toArray(), rot: [Math.cos(a), 0, Math.sin(a), 0, 1, 0, -Math.sin(a), 0, Math.cos(a)], size: [0.25 * STUDS, 0.07 * STUDS, 0.07 * STUDS], color: spr[i % spr.length], material: 'SmoothPlastic', transparency: 0 });
    }
  }
  if (kinds.has('lavadrips') || st.glow) {
    const glow = st.glow || '#ff5a14';
    // glühende Adern: Risse, die im Zickzack die Felswand hinunterlaufen und sich verzweigen
    // (schmale Neon-Bänder knapp vor der Wand, nach unten dünner)
    const crackFrom = (a, t, w, segs) => {
      for (let s = 0; s < segs && t < 0.92; s++) {
        const t2 = t + 0.05 + rand() * 0.06, a2 = a + (rand() - 0.5) * 0.09;
        const p0 = P(a, surf(a, t) + 0.05, yAt(t)), p1 = P(a2, surf(a2, t2) + 0.05, yAt(t2));
        const side = V(-Math.sin(a), 0, Math.cos(a)).multiplyScalar(w / 2);
        const o = V(Math.cos(a), 0, Math.sin(a));
        tri(out, p0.clone().add(side), p0.clone().sub(side), p1, glow, 'Neon', 'Glut', o, 0.02);
        if (rand() < 0.22) crackFrom(a2, t2, w * 0.7, Math.floor(segs / 2));
        a = a2;
        t = t2;
        w *= 0.85;
      }
    };
    for (let i = 0; i < 16; i++) crackFrom(rand() * TAU, 0.04 + rand() * 0.3, 0.22 + rand() * 0.1, 5 + Math.floor(rand() * 5));
    if (kinds.has('lavadrips'))
      for (let i = 0; i < 16; i++) {
        const a = rand() * TAU, t = 0.1 + rand() * 0.5;
        const rr = surf(a, t) * 0.92, y = yAt(t);
        spike(out, P(a, rr, y), P(a, rr * 0.97, y - 0.6 - rand() * 1.2), 0.14, 5, [glow, tone(glow, 0, 0.1)], 'Neon', 'Glut', rand);
      }
  }
  if (kinds.has('crystals') && st.crystals) {
    const cc = [].concat(st.crystals);
    // Leuchtkristalle schräg aus der Erdkante direkt unter dem Rand (Höhle)
    if (st.rimCrystals)
      for (let i = 0; i < 20; i++) {
        const a = (i / 20) * TAU + (rand() - 0.5) * 0.15, t = 0.02 + rand() * 0.06;
        const base = P(a, surf(a, t) - 0.1, yAt(t));
        for (let k = 0; k < 2 + Math.floor(rand() * 2); k++) {
          const dir = V(Math.cos(a) * (0.7 + rand() * 0.4), -0.3 - rand() * 0.7, Math.sin(a) * (0.7 + rand() * 0.4)).add(V((rand() - 0.5) * 0.5, 0, (rand() - 0.5) * 0.5));
          crystal(out, base.clone().add(V((rand() - 0.5) * 0.4, (rand() - 0.5) * 0.3, (rand() - 0.5) * 0.4)), dir, 0.8 + rand() * 1.2, 0.16 + rand() * 0.12, cc[i % cc.length], rand, 'Neon');
        }
      }
    for (let i = 0; i < 18; i++) {
      const a = rand() * TAU, t = 0.12 + rand() * 0.75;
      const rr = surf(a, t) * 0.9, y = yAt(t);
      const base = P(a, rr, y);
      const n = 2 + Math.floor(rand() * 3);
      for (let k = 0; k < n; k++) {
        const dir = V(Math.cos(a) * (0.4 + rand() * 0.5), -0.6 - rand() * 0.6, Math.sin(a) * (0.4 + rand() * 0.5)).add(V((rand() - 0.5) * 0.5, 0, (rand() - 0.5) * 0.5));
        crystal(out, base.clone().add(V((rand() - 0.5) * 0.5, (rand() - 0.5) * 0.4, (rand() - 0.5) * 0.5)), dir, 1.2 + rand() * 2, 0.22 + rand() * 0.18, cc[i % cc.length], rand);
      }
    }
  }
  if (kinds.has('glowvines')) {
    for (let i = 0; i < 26; i++) {
      const a = rand() * TAU;
      let p = P(a, R + 0.1, -0.4 - rand() * 0.4);
      const segs = 3 + Math.floor(rand() * 4);
      for (let s = 0; s < segs; s++) {
        const next = p.clone().add(V((rand() - 0.5) * 0.3, -0.5 - rand() * 0.3, (rand() - 0.5) * 0.3));
        spike(out, p, next, 0.06, 4, '#5a2a8a', 'SmoothPlastic', 'Ranke', rand);
        p = next;
      }
      out.push({ shape: 'Ball', name: 'Ranke', pos: p.multiplyScalar(STUDS).toArray(), rot: [1, 0, 0, 0, 1, 0, 0, 0, 1], size: [0.3 * STUDS, 0.3 * STUDS, 0.3 * STUDS], color: '#86ff52', material: 'Neon', transparency: 0 });
    }
  }
  if (kinds.has('kelp')) {
    // Seetang: lange, flache, leicht gewellte Bänder
    for (let i = 0; i < 30; i++) {
      const a = rand() * TAU;
      let p = P(a, R + 0.1, -0.3 - rand() * 0.8);
      const segs = 4 + Math.floor(rand() * 5);
      const c = rand() < 0.5 ? '#3f8a4a' : '#5aa04a';
      for (let s = 0; s < segs; s++) {
        const next = p.clone().add(V(Math.cos(a) * 0.06 + Math.sin(s * 1.7) * 0.12, -0.55, Math.sin(a) * 0.06 + Math.cos(s * 1.7) * 0.12));
        const side = V(-Math.sin(a), 0, Math.cos(a)).multiplyScalar(0.14);
        tri(out, p.clone().add(side), p.clone().sub(side), next, c, 'SmoothPlastic', 'Seetang', V(Math.cos(a), 0, Math.sin(a)), 0.02);
        p = next;
      }
    }
  }
  if (kinds.has('corals')) {
    // Korallenstöcke und Schwämme wachsen schräg aus der Erdkante (Riff)
    const cols = ['#ff7a9a', '#ffb05a', '#c87aff', '#ff5f6a', '#ffd05a'];
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * TAU + (rand() - 0.5) * 0.15, t = 0.02 + rand() * 0.14;
      const base = P(a, surf(a, t) - 0.05, yAt(t)), c = cols[i % cols.length];
      for (let k = 0; k < 3; k++) {
        const tipP = base.clone().add(V(Math.cos(a) * (0.5 + rand() * 0.5) + (rand() - 0.5) * 0.5, 0.2 + rand() * 0.6, Math.sin(a) * (0.5 + rand() * 0.5) + (rand() - 0.5) * 0.5));
        spike(out, base, tipP, 0.1 + rand() * 0.05, 4, [c, tone(c, 0, -0.08)], 'SmoothPlastic', 'Koralle', rand);
        out.push({ shape: 'Ball', name: 'Koralle', pos: tipP.clone().multiplyScalar(STUDS).toArray(), rot: [1, 0, 0, 0, 1, 0, 0, 0, 1], size: [0.22 * STUDS, 0.22 * STUDS, 0.22 * STUDS], color: tone(c, 0, 0.1), material: 'SmoothPlastic', transparency: 0 });
      }
      if (rand() < 0.5) out.push({ shape: 'Ellipsoid', name: 'Schwamm', pos: P(a, surf(a, t) + 0.2, yAt(t) - 0.3).multiplyScalar(STUDS).toArray(), rot: [1, 0, 0, 0, 1, 0, 0, 0, 1], size: [0.6 * STUDS, 0.45 * STUDS, 0.6 * STUDS], color: cols[(i + 2) % cols.length], material: 'Pebble', transparency: 0 });
    }
  }
  if (kinds.has('pearls')) {
    for (let i = 0; i < 16; i++) {
      const a = rand() * TAU;
      for (let s = 0; s < 4 + Math.floor(rand() * 4); s++) {
        out.push({ shape: 'Ball', name: 'Perle', pos: P(a, R + 0.15, -0.5 - s * 0.32).multiplyScalar(STUDS).toArray(), rot: [1, 0, 0, 0, 1, 0, 0, 0, 1], size: [0.24 * STUDS, 0.24 * STUDS, 0.24 * STUDS], color: '#fff6ee', material: 'SmoothPlastic', transparency: 0 });
      }
    }
  }
  if (kinds.has('pipes')) {
    // Rohre und Lampen hängen unter der Stadt
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU + rand() * 0.3, t = 0.15 + rand() * 0.3;
      const rr = surf(a, t) * 0.92, y = yAt(t);
      const len = 1.5 + rand() * 2.5;
      out.push({ shape: 'Cylinder', name: 'Rohr', pos: P(a, rr, y - len / 2).multiplyScalar(STUDS).toArray(), rot: [0, -1, 0, 1, 0, 0, 0, 0, 1], size: [len * STUDS, 0.22 * STUDS, 0.22 * STUDS], color: '#7a7f8a', material: 'Metal', transparency: 0 });
      out.push({ shape: 'Ball', name: 'Lampe', pos: P(a, rr, y - len - 0.2).multiplyScalar(STUDS).toArray(), rot: [1, 0, 0, 0, 1, 0, 0, 0, 1], size: [0.5 * STUDS, 0.5 * STUDS, 0.5 * STUDS], color: '#ffd27a', material: 'Neon', transparency: 0 });
    }
  }
  if (kinds.has('clouds')) {
    // Wolkenbäusche kleben an der Unterseite (Himmelswelten)
    for (let i = 0; i < 16; i++) {
      const a = rand() * TAU, t = 0.2 + rand() * 0.6;
      const rr = surf(a, t) * 0.95, y = yAt(t);
      const s = 1.2 + rand() * 1.6;
      for (let k = 0; k < 3; k++) {
        const c = P(a + (k - 1) * 0.08, rr + 0.3, y - (rand() - 0.5) * 0.6);
        out.push({ shape: 'Ball', name: 'Wolke', pos: c.multiplyScalar(STUDS).toArray(), rot: [1, 0, 0, 0, 1, 0, 0, 0, 1], size: [s * STUDS, s * 0.8 * STUDS, s * STUDS], color: '#ffffff', material: 'SmoothPlastic', transparency: 0.05 });
      }
    }
  }
}

// ── Kleine schwebende Insel (Umgebung) ──
// center: Mitte der Oberseite (Einheiten), w: Radius. Oberseite: flache Kuppel im Bodenton mit Rand wie die Hauptinsel.
// Gibt die Höhe der Oberseite über center zurück (für Bäume und Häuser obendrauf).
export function miniIsland(out, center, w, world, seedStr, { name = 'Insel', peak = null } = {}) {
  const st = styleOf(world), rand = seeded(world.id + ':' + seedStr);
  // Auflösung nach Größe: kleine Brocken grob, große Nachbarinseln feiner
  const N = w < 1.6 ? 9 : w < 4 ? 12 : 15;
  const { ground, soilTones, rockTones } = palette(world, st);
  const ridge = ridgeField(rand);
  const top = st.lip === 'snow' ? '#ffffff' : st.lip === 'frost' ? st.lipColor : ground;
  const topMat = st.lip === 'grass' ? 'Grass' : st.lip === 'snow' ? 'Snow' : st.lip === 'frost' ? 'SmoothPlastic' : st.rockMat;
  const a = (j) => (j / N) * TAU;
  const C = (j, r, y) => P(a(j), r, y).add(center);
  const dome = w * 0.12;
  // Kuppel oben
  const r1 = Array.from({ length: N }, (_, j) => C(j, w * 0.55, dome * 0.7));
  const r2 = Array.from({ length: N }, (_, j) => C(j, w * (1 + (rand() - 0.5) * 0.08), 0));
  const apex = center.clone().add(V(0, dome, 0));
  for (let j = 0; j < N; j++) tri(out, apex, r1[j], r1[(j + 1) % N], tone(top, 0.02, 0.04), topMat, name, V(0, 1, 0), 0.15);
  band(out, r1, r2, () => [top, topMat], name, 1, center, 0.15);
  // Rand und Körper
  const r3 = Array.from({ length: N }, (_, j) => C(j, w * 1.03, -w * 0.06 - rand() * w * 0.04));
  band(out, r2, r3, () => [tone(top, 0.03, -0.06), topMat], name, -0.2, center, 0.15);
  const rows = [r3];
  const depth = w * 1.25;
  const T = w < 1.6 ? [0.14, 0.45, 0.76] : w < 4 ? [0.1, 0.3, 0.52, 0.72, 0.87] : [0.1, 0.24, 0.4, 0.56, 0.72, 0.86];
  for (const t of T) {
    rows.push(Array.from({ length: N }, (_, j) => C(j, w * profile(t) * (1 + ridge(a(j), t) * (0.06 + 0.16 * t)), -w * 0.1 - t * depth + (rand() - 0.5) * w * 0.04)));
  }
  // oben Erde (zackig), darunter Fels in weichen senkrechten Streifen, nach unten etwas dunkler
  const streak = smoothRing(N, rand, 1), soilRows = Array.from({ length: N }, () => (rand() < 0.5 ? 1 : 2));
  const quad = (i, j) => {
    const v = -ridge(a(j + 0.5), T[Math.min(i, T.length - 1)]) * 1.1 + (streak[j] - 0.5) * 1.4 + (i > T.length * 0.6 ? 0.6 : 0);
    if (i < soilRows[j]) return [soilTones[Math.max(0, Math.min(4, Math.round(2 + v * 0.7)))], st.soilMat];
    return [rockTones[Math.max(0, Math.min(4, Math.round(2 + v)))], st.rockMat];
  };
  for (let i = 0; i + 1 < rows.length; i++) band(out, rows[i], rows[i + 1], (j) => quad(i, j), name, -0.35, center, 0.15);
  const tipP = center.clone().add(V((rand() - 0.5) * w * 0.2, -w * 0.1 - depth * 1.05, (rand() - 0.5) * w * 0.2));
  const last = rows[rows.length - 1];
  for (let j = 0; j < N; j++) tri(out, last[j], last[(j + 1) % N], tipP, rockTones[3 + (j % 2)], st.rockMat, name, V(last[j].x - center.x, -0.4, last[j].z - center.z), 0.15);
  if (st.lip === 'grass') {
    for (let j = 0; j < N * 2; j++) {
      const aa = (j / (N * 2)) * TAU, len = w * (0.08 + rand() * 0.14);
      const t0 = P(aa - 0.04, w * 1.03, -w * 0.03).add(center), t1 = P(aa + 0.04, w * 1.03, -w * 0.03).add(center);
      tri(out, t0, t1, P(aa, w * 1.05, -w * 0.03 - len).add(center), rand() < 0.5 ? '#4f9a3c' : '#79c24f', 'Grass', name, V(Math.cos(aa), 0, Math.sin(aa)), 0.03);
    }
  }
  if (peak) islePeak(out, center.clone().add(V(peak.dx || 0, dome * 0.55, peak.dz || 0)), peak.r, peak.h, world, rand, { snow: peak.snow });
  return dome;
}

// Höhe der Kuppel einer Mini-Insel im Abstand d von der Mitte (für Bäume und Häuser obendrauf)
export function isleDomeAt(w, d) {
  const dome = w * 0.12, k = d / (w * 0.55);
  return k <= 1 ? dome * (1 - 0.3 * k) : dome * 0.7 * Math.max(0, 1 - (d - w * 0.55) / (w * 0.45));
}

// ── Berg auf einer Insel: Fuß im Boden der Welt, zerfurchte Flanken, Grate, oben Fels oder Schnee ──
// base: Mitte des Fußes (Einheiten), r: Radius des Fußes, h: Höhe
export function islePeak(out, base, r, h, world, rand, { snow = false, name = 'Berg', N = 9 } = {}) {
  const st = styleOf(world), { ground, rockTones } = palette(world, st);
  const ridge = ridgeField(rand);
  const T = [0, 0.3, 0.56, 0.8], RAD = [1, 0.7, 0.43, 0.2];
  const rings = T.map((t, i) =>
    Array.from({ length: N }, (_, j) => {
      const a = (j / N) * TAU + i * 0.17;
      const rr = r * RAD[i] * (1 + ridge(a, t) * 0.24 + (rand() - 0.5) * 0.1);
      return P(a, rr, i ? t * h + (rand() - 0.5) * h * 0.05 : -0.15).add(base);
    }),
  );
  const tip = base.clone().add(V((rand() - 0.5) * r * 0.15, h, (rand() - 0.5) * r * 0.15));
  const grass = st.lip === 'grass', SNOW = '#f6f9ff';
  const snowFrom = Array.from({ length: N }, () => (rand() < 0.45 ? 1 : 2)); // zackige Schneegrenze
  const green = Array.from({ length: N }, () => rand() < 0.6); // Wiese reicht unterschiedlich hoch
  const colorOf = (i) => (j) => {
    const v = Math.round(2 - ridge((j / N) * TAU, T[i]) * 1.2 + (rand() - 0.5) * 0.8);
    if (snow && i >= snowFrom[j]) return [i === 1 ? tone(SNOW, 0, -0.04) : SNOW, 'Snow'];
    if (grass && (i === 0 || (i === 1 && green[j] && !snow))) return [i === 0 ? ground : tone(ground, -0.05, -0.05), 'Grass'];
    return [rockTones[Math.max(0, Math.min(4, v - (i > 1 ? 1 : 0)))], st.rockMat];
  };
  for (let i = 0; i + 1 < rings.length; i++) band(out, rings[i], rings[i + 1], colorOf(i), name, 0.6, base, 0.18);
  const last = rings[rings.length - 1];
  for (let j = 0; j < N; j++) {
    const mid = last[j].clone().add(last[(j + 1) % N]).add(tip).multiplyScalar(1 / 3);
    const [c, m] = snow ? [j % 2 ? SNOW : tone(SNOW, 0, -0.03), 'Snow'] : [rockTones[j % 2], st.rockMat];
    tri(out, last[j], last[(j + 1) % N], tip, c, m, name, V(mid.x - base.x, 0.5, mid.z - base.z), 0.18);
  }
}
