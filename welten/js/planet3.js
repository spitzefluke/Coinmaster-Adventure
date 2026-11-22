// Planet 3 (Korallenriff, Muschelland, Atlantis) unter Wasser: zu den vorhandenen großen Wahrzeichen
// (Wrack, Korallenbogen, Muschelhaus, Perlenbrunnen, Palast) kommt je eines dazu, dazu Wege mit Münz-Lichtungen,
// eine Kulisse am Meeresgrund, Bodendetails, Partikel und Plätze für Klänge.
// Unter Wasser ist der Nebel dichter (FogEnd 560 Studs): die Kulisse steht darum näher als auf Planet 1 und 2.

import * as THREE from 'three';
import { backdropMesh, paths } from './planet1.js';

const TAU = Math.PI * 2;

const PATHS = {
  korallenriff: { color: '#e8d8b0', kind: 'stone' },
  muschelland: { color: '#f2d0c0', kind: 'stone', edge: '#ffffff' },
  atlantis: { color: '#e8eef2', kind: 'tile', glow: '#5affd8', avoid: true },
};

// ── zusätzliche Wahrzeichen ──
const LANDMARK = {
  // Korallenturm (Werkstatt-Wunsch „alles deutlich verbessern“): Felssockel mit Höhlen, gewundener Turm aus
  // sieben Korallenstöcken, an jeder Stufe verzweigte Korallen und leuchtende Anemonen, Seefächer und eine Krone
  // aus Leuchtperlen, Fische kreisen um die Spitze
  korallenriff(ctx, kit) {
    const { M, E, at, group, coral } = kit;
    const p = ctx.spot(3.2, 3, 11);
    if (!p) return;
    const cols = ['#ff7a8a', '#ffb05a', '#ff5fb0', '#b07bff', '#5fd3ff', '#ffe25f', '#7aff8a'];
    const parts = [];
    const rock = at(new THREE.Mesh(new THREE.DodecahedronGeometry(2.4, 1), M('#8a7050')), 0, 0.5, 0);
    rock.scale.set(1, 0.5, 1);
    parts.push(rock);
    for (let k = 0; k < 3; k++) { const a = (k / 3) * TAU; parts.push(at(new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), M('#2a2018')), Math.cos(a) * 2.0, 0.45, Math.sin(a) * 2.0)); }
    for (let i = 0; i < 7; i++) {
      const r = 1.5 - i * 0.17, y = 1.1 + i * 1.0, off = Math.sin(i * 0.9) * 0.25;
      parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.82, r, 1.0, 12), M(cols[i], { emissive: cols[i], emissiveIntensity: 0.12 })), off, y, Math.cos(i * 0.9) * 0.2));
      for (let k = 0; k < 2; k++) {
        const c = coral(cols[(i + 2 + k) % cols.length], ctx.rand);
        c.scale.setScalar(0.85 - i * 0.07);
        const a = i * 2.2 + k * Math.PI;
        c.position.set(off + Math.cos(a) * r, y, Math.sin(a) * r);
        parts.push(c);
      }
      const an = at(new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), E(['#5affd8', '#ff7ae0', '#ffe25f'][i % 3], 1.5)), off + Math.cos(i * 2.2 + 1.5) * r, y + 0.5, Math.sin(i * 2.2 + 1.5) * r);
      parts.push(an);
    }
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * TAU + 0.4, fan = at(new THREE.Mesh(new THREE.CircleGeometry(0.9, 10, 0, Math.PI), M(cols[(k * 2) % cols.length], { side: THREE.DoubleSide })), Math.cos(a) * 2.2, 1.0, Math.sin(a) * 2.2);
      fan.rotation.y = -a + Math.PI / 2;
      parts.push(fan);
    }
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * TAU;
      parts.push(at(new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), E('#5affd8', 1.6)), Math.cos(a) * 0.55, 8.4 + (i % 2) * 0.3, Math.sin(a) * 0.55));
    }
    const fish = new THREE.Group();
    for (let i = 0; i < 6; i++) {
      const f = at(new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), M(cols[i % cols.length])), Math.cos((i / 6) * TAU) * 1.8, 7.2 + (i % 2) * 0.5, Math.sin((i / 6) * TAU) * 1.8);
      f.scale.set(0.6, 0.8, 1.6);
      f.userData.rbx = { skip: true };
      fish.add(f);
    }
    ctx.put(group(...parts, fish), p[0], p[1], { rot: false });
    ctx.anims.push((t) => (fish.rotation.y = t * 0.5));
  },
  // Perlmuschel-Heiligtum (Werkstatt-Wunsch „alles deutlich verbessern“): Felssockel mit Stufen, Kranz aus
  // kleinen Muscheln und Perlenketten, die Riesenmuschel öffnet sich langsam, darin eine große leuchtende Perle
  muschelland(ctx, kit) {
    const { M, E, at, group, scallop } = kit;
    const p = ctx.spot(3.4, 3, 11);
    if (!p) return;
    const parts = [];
    for (let i = 0; i < 3; i++) parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(2.8 - i * 0.45, 3.0 - i * 0.45, 0.3, 20), M(i % 2 ? '#e8d8c8' : '#d8c4b0')), 0, 0.15 + i * 0.3, 0));
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * TAU, sh = scallop(['#ffd8b0', '#ffe8f0', '#e8d0ff'][k % 3], 0.5);
      sh.position.set(Math.cos(a) * 2.6, 0.3, Math.sin(a) * 2.6);
      sh.rotation.y = -a;
      parts.push(sh);
    }
    for (let k = 0; k < 24; k++) { const a = (k / 24) * TAU; parts.push(at(new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), M('#fff6fa', { roughness: 0.2, metalness: 0.2 })), Math.cos(a) * 2.15, 0.62 + Math.sin(a * 3) * 0.04, Math.sin(a) * 2.15)); }
    const clam = scallop('#e8d0ff', 2.6);
    clam.position.y = 0.9;
    const pearl = at(new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 12), E('#fff2fa', 1.8)), 0, 1.9, 0);
    parts.push(clam, pearl);
    for (let k = 0; k < 4; k++) parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.8, 5), E('#ffe8f6', 1.2, { transparent: true, opacity: 0.6 })), Math.cos(k * 1.57) * 0.5, 2.6, Math.sin(k * 1.57) * 0.5));
    const g = group(...parts);
    ctx.put(g, p[0], p[1]);
    const hinge = clam.children[1];
    ctx.anims.push((t) => {
      hinge.rotation.z = 0.55 + Math.sin(t * 0.6) * 0.25;
      pearl.position.y = 1.9 + Math.sin(t * 1.2) * 0.08;
    });
  },
  // Dreizack-Heiligtum (Werkstatt-Wunsch „alles verbessern“): Stufenplattform aus Marmor mit leuchtenden
  // Wasserrinnen, Ring aus sechs Säulen mit Gebälk, in der Mitte ein hoher Sockel mit großem goldenem Dreizack,
  // leuchtende Kristalle an den Spitzen, Becken mit Wasser
  atlantis(ctx, kit) {
    const { M, E, at, group, column } = kit;
    const p = ctx.spot(3.2, 3, 11);
    if (!p) return;
    const marble = M('#f2f6f8'), marble2 = M('#e2eaee'), gold = M('#ffcf4a', { metalness: 0.7, roughness: 0.3, emissive: '#b8860b', emissiveIntensity: 0.25 }), glow = E('#5affd8', 1.4);
    const parts = [];
    for (let i = 0; i < 3; i++) {
      parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(3.0 - i * 0.4, 3.15 - i * 0.4, 0.28, 24), i % 2 ? marble2 : marble), 0, 0.14 + i * 0.28, 0));
      parts.push(at(new THREE.Mesh(new THREE.TorusGeometry(3.05 - i * 0.4, 0.04, 4, 40), glow), 0, 0.29 + i * 0.28, 0));
      parts[parts.length - 1].rotation.x = Math.PI / 2;
    }
    parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.12, 24), M('#4ab0e8', { roughness: 0.05, emissive: '#2a7ab8', emissiveIntensity: 0.4 })), 0, 0.92, 0));
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * TAU;
      parts.push(at(column ? column(2.6, '#f2f6f8') : new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 2.6, 10), marble), Math.cos(a) * 2.1, 0.84, Math.sin(a) * 2.1));
    }
    parts.push(at(new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.16, 6, 36), marble2), 0, 3.55, 0));
    parts[parts.length - 1].rotation.x = Math.PI / 2;
    parts.push(at(new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.05, 4, 36), gold), 0, 3.72, 0));
    parts[parts.length - 1].rotation.x = Math.PI / 2;
    parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.6, 0.8), marble), 0, 1.7, 0));
    parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.1, 0.9), gold), 0, 2.55, 0));
    parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 5.4, 8), gold), 0, 5.2, 0));
    parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.16, 0.16), gold), 0, 7.8, 0));
    for (const x of [-0.8, 0, 0.8]) {
      parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, x ? 1.0 : 1.3, 6), gold), x, x ? 8.35 : 8.5, 0));
      parts.push(at(new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.4, 6), gold), x, x ? 9.05 : 9.35, 0));
      parts.push(at(new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), glow), x, x ? 8.85 : 9.1, 0.18));
    }
    ctx.put(group(...parts), p[0], p[1]);
  },
};

// ── Kulisse am Meeresgrund (28–42 Einheiten, aus den Sanddünen ragend) ──
function backdrop(ctx, kit) {
  const { M, E, at } = kit;
  const { root, rand } = ctx;
  const id = ctx.world.id;
  const base = -22;
  const add = (mesh) => {
    root.add(backdropMesh(mesh));
    return mesh;
  };
  // Seetang: schmale, leicht versetzte Glieder, oben ein Blatt
  const kelp = (x, z, h) => {
    const seg = 3;
    for (let y = 0, i = 0; y < h; y += seg, i++) add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, seg, 6), M(i % 2 ? '#2f8a5a' : '#3a9a6a')), x + Math.sin(i * 0.8) * 0.6, base + y + seg / 2, z));
    const leaf = add(at(new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), M('#4aa86a')), x, base + h + 0.6, z));
    leaf.scale.set(1.6, 0.4, 0.8);
  };
  const n = 12;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + rand() * 0.3, r = 28 + rand() * 14;
    const x = Math.cos(a) * r, z = Math.sin(a) * r, h = 12 + rand() * 14;
    if (id === 'korallenriff') {
      // Korallentürme in kräftigen Farben, dazwischen Seetang
      const c = ['#ff7a8a', '#ffb05a', '#ff5fb0', '#b07bff', '#ffe25f'][i % 5];
      add(at(new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3.4, h, 8), M(c, { emissive: c, emissiveIntensity: 0.15 })), x, base + h / 2, z));
      add(at(new THREE.Mesh(new THREE.SphereGeometry(2.6, 10, 8), M(c)), x, base + h, z)).scale.y = 0.6;
      kelp(Math.cos(a + 0.2) * (r - 3), Math.sin(a + 0.2) * (r - 3), 14 + rand() * 10);
    } else if (id === 'muschelland') {
      // aufgestellte Riesenmuscheln und Felsbögen
      if (i % 2) {
        const s = add(at(new THREE.Mesh(new THREE.SphereGeometry(6 + rand() * 3, 14, 8, 0, TAU, 0, Math.PI / 2), M(['#ffd8b0', '#ffe8f0', '#e8d0ff'][i % 3])), x, base + 2, z));
        s.rotation.set(-1.2, -a + Math.PI / 2, 0);
      } else {
        const arch = add(at(new THREE.Mesh(new THREE.TorusGeometry(5 + rand() * 2, 1.2, 6, 14, Math.PI), M('#c8a888')), x, base + 4, z));
        arch.rotation.y = -a + Math.PI / 2;
      }
      if (i % 3 === 0) kelp(x * 0.92, z * 0.92, 10 + rand() * 8);
    } else if (id === 'atlantis') {
      // versunkene Ruinen: Säulen, manche umgestürzt, leuchtende Runensteine
      const ch = h * 0.8;
      const col = add(at(new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, ch, 10), M('#dfe6ea')), x, base + ch / 2, z));
      if (i % 4 === 1) {
        col.rotation.z = 1.35;
        col.position.y = base + 6;
      } else add(at(new THREE.Mesh(new THREE.BoxGeometry(4, 1.2, 4), M('#dfe6ea')), x, base + ch + 0.6, z));
      if (i % 3 === 0) add(at(new THREE.Mesh(new THREE.OctahedronGeometry(1.2, 0), E('#5affd8', 1.4)), x * 0.9, base + 10 + rand() * 6, z * 0.9));
      if (i % 2) kelp(Math.cos(a - 0.2) * (r + 2), Math.sin(a - 0.2) * (r + 2), 12 + rand() * 8);
    }
  }
}

// ── mehr Details am Boden ──
function details(ctx, kit) {
  const { M, E, at, rockMesh, starfish, column } = kit;
  const { scatter, rand, rr } = ctx;
  const id = ctx.world.id;
  if (id === 'korallenriff') {
    scatter(10, () => rockMesh(rr(0.08, 0.18), '#f2e2c0', rand), 0.15);
    scatter(4, () => {
      const s = starfish(['#ff7a4a', '#ffb02e', '#ff5f8a'][Math.floor(rand() * 3)]);
      s.scale.setScalar(0.6);
      return s;
    }, 0.2);
  } else if (id === 'muschelland') {
    scatter(10, () => at(new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), M('#fff8f0', { metalness: 0.3, roughness: 0.2, emissive: '#ffe8f0', emissiveIntensity: 0.3 })), 0, 0.07, 0), 0.12);
    scatter(8, () => rockMesh(rr(0.08, 0.16), '#e8c8b0', rand), 0.15);
  } else if (id === 'atlantis') {
    scatter(6, () => column(rr(0.3, 0.7), '#e8eef2', true), 0.45, 2, ctx.R - 2.6);
    scatter(20, () => at(new THREE.Mesh(new THREE.OctahedronGeometry(0.1, 0), E('#5affd8', 1.4)), 0, 0.1, 0), 0.15, 2, ctx.R - 2.6);
  }
}

// ── Leben: Luftblasen, Plankton, Quallen (Webseiten-Einheiten) ──
function emitters(ctx) {
  const R = ctx.R, id = ctx.world.id, list = (ctx.shared.emitters = ctx.shared.emitters || []);
  const add = (name, pos, size, colors, particleSize, rate, speed, lifetime, opts = {}) =>
    list.push({ name, pos, size, colors, particleSize, rate, speed, lifetime, spread: opts.spread ?? [180, 180], direction: opts.direction ?? 'Top', lightEmission: opts.light ?? 0 });
  // Blasen steigen aus dem Boden auf, ein paar größere aus der Tiefe neben der Insel
  add('Luftblasen', [0, 0.2, 0], [R * 2, 1, R * 2], ['#ffffff', '#bff8ff'], 0.22, 10, [1.2, 2.2], [5, 8], { spread: [8, 8], light: 0.3 });
  add('Luftblasen', [R + 3, -6, 0], [3, 1, 3], ['#ffffff', '#bff8ff'], 0.45, 6, [2, 3], [6, 9], { spread: [6, 6], light: 0.3 });
  if (id === 'korallenriff') add('Plankton', [0, 4, 0], [R * 2.4, 8, R * 2.4], ['#bff8ff', '#ffe25f', '#ff9ad5'], 0.12, 14, [0.1, 0.3], [6, 10], { light: 1 });
  else if (id === 'muschelland') add('Perlenglitzern', [0, 2, 0], [R * 2, 4, R * 2], ['#fff2fa', '#e8d0ff'], 0.16, 8, [0.1, 0.3], [5, 8], { light: 1 });
  else if (id === 'atlantis') add('Quallen', [0, 6, 0], [R * 2.4, 8, R * 2.4], ['#ff9ad5', '#5affd8', '#b07bff'], 0.9, 2, [0.2, 0.5], [10, 14], { light: 0.8, spread: [20, 20] });
}

// ── Plätze für Klänge ──
const SOUNDS = {
  korallenriff: [['Unterwasser', 'gedämpftes Unterwasser-Rauschen', 0.45], ['Blasen', 'blubbernde Luftblasen', 0.25]],
  muschelland: [['Wellen', 'sanftes Wellenrauschen von oben', 0.35], ['Wale', 'Walgesang in der Ferne', 0.25]],
  atlantis: [['Musik', 'geheimnisvolle Harfe oder Chor unter Wasser', 0.35], ['Tiefe', 'tiefes Grollen und ferne Glocken', 0.25]],
};

export const PLANET3 = new Set(Object.keys(PATHS));

export function planet3Before(ctx, kit) {
  if (!PLANET3.has(ctx.world.id)) return;
  if (!ctx.modelWorld || ctx.modelWorld.landmark) LANDMARK[ctx.world.id](ctx, kit);
  paths(ctx, kit, PATHS[ctx.world.id]);
}

export function planet3After(ctx, kit) {
  if (!PLANET3.has(ctx.world.id)) return;
  if (ctx.modelWorld?.backdrop) ctx.modelWorld.backdrop(ctx, kit);
  else backdrop(ctx, kit);
  details(ctx, kit);
  emitters(ctx);
  ctx.shared.sounds = SOUNDS[ctx.world.id].map(([name, hint, volume]) => ({ name, hint, volume }));
}
