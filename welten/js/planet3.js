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
  // Korallenturm (Werkstatt-Wunsch „Form verbessern, detaillierter, mehr Korallen und Leben“): zerklüfteter
  // Riffsockel mit Höhlen, darauf ein gewundener Turm aus zehn Korallenkissen, die nach oben kleiner werden und sich
  // um die Mitte drehen; an jeder Stufe Polypen mit Leuchtspitzen, verzweigte Korallen, Hirnkorallen und
  // Röhrenschwämme, unten große Seefächer; oben eine offene Riesenmuschel mit leuchtender Perle;
  // zwei Fischschwärme kreisen gegenläufig, eine Schildkröte zieht weite Kreise
  korallenriff(ctx, kit) {
    const { M, E, at, group, coral, brainCoral, scallop } = kit;
    const p = ctx.spot(3.4, 3, 11);
    if (!p) return;
    const rand = ctx.rand;
    const cols = ['#ff7a8a', '#ffb05a', '#ff5fb0', '#b07bff', '#5fd3ff', '#ffe25f', '#7aff8a'];
    const stone = ['#e8b0a0', '#f2c8a8', '#d8a0b8', '#c8b0e0'];
    const parts = [];
    // Sockel: fünf Felsbrocken im Kreis, dazwischen dunkle Höhlen
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * TAU + 0.3, r = 1.5 + rand() * 0.4;
      const rock = at(new THREE.Mesh(new THREE.DodecahedronGeometry(1.1 + rand() * 0.4, 0), M(['#8a7050', '#7a6448', '#9a8060'][k % 3])), Math.cos(a) * r, 0.45, Math.sin(a) * r);
      rock.scale.set(1, 0.6, 1);
      rock.rotation.y = rand() * TAU;
      rock.userData.rbx = { facets: true };
      parts.push(rock);
      parts.push(at(new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 6), M('#1e1810')), Math.cos(a + 0.6) * 2.1, 0.35, Math.sin(a + 0.6) * 2.1));
    }
    parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(1.7, 2.1, 0.9, 10), M('#8a7050')), 0, 0.45, 0));
    // gewundener Turm
    let topY = 0.9, last = { x: 0, z: 0, r: 1 };
    for (let i = 0; i < 10; i++) {
      const r = 1.55 - i * 0.11, a = i * 0.75, ox = Math.cos(a) * 0.28 * (i / 9), oz = Math.sin(a) * 0.28 * (i / 9), h = 0.95 - i * 0.03;
      const seg = at(new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), M(stone[i % stone.length], { emissive: stone[i % stone.length], emissiveIntensity: 0.06 })), ox, topY + h * 0.45, oz);
      seg.scale.set(1, (h / r) * 0.62, 1);
      seg.rotation.y = a;
      seg.userData.rbx = { facets: true };
      parts.push(seg);
      // Polypen mit Leuchtspitzen rundherum
      for (let k = 0; k < 5; k++) {
        const b = (k / 5) * TAU + a, px = ox + Math.cos(b) * r * 0.92, pz = oz + Math.sin(b) * r * 0.92, py = topY + h * 0.4;
        parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.22, 6), M(cols[(i + k) % cols.length])), px, py, pz));
        parts.push(at(new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 4), E(['#5affd8', '#ff7ae0', '#ffe25f'][(i + k) % 3], 1.5)), px, py + 0.13, pz));
      }
      // Korallen, Hirnkorallen und Röhrenschwämme an den Stufen
      const c = coral(cols[(i + 2) % cols.length], rand);
      c.scale.setScalar(0.85 - i * 0.05);
      c.position.set(ox + Math.cos(a + 2.2) * r * 0.85, topY + h * 0.55, oz + Math.sin(a + 2.2) * r * 0.85);
      parts.push(c);
      if (i % 2 === 0) {
        const bc = brainCoral(['#ff9a7a', '#d87aff', '#7ad8a0'][i % 3], rand);
        bc.scale.setScalar(0.8 - i * 0.05);
        bc.position.set(ox + Math.cos(a - 2) * r * 0.8, topY + h * 0.5, oz + Math.sin(a - 2) * r * 0.8);
        parts.push(bc);
      }
      if (i % 3 === 1) for (let k = 0; k < 3; k++) {
        const b = a + Math.PI + (k - 1) * 0.35, th = 0.4 + k * 0.15;
        parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, th, 8, 1, true), M(['#ff9a5a', '#b07bff', '#ffe25f'][k], { side: THREE.DoubleSide })), ox + Math.cos(b) * r * 0.95, topY + h * 0.55 + th / 2, oz + Math.sin(b) * r * 0.95));
      }
      topY += h * 0.82;
      last = { x: ox, z: oz, r };
    }
    // große Seefächer am Sockel
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * TAU + 0.9, fan = at(new THREE.Mesh(new THREE.CircleGeometry(1.1, 12, 0, Math.PI), M(cols[(k * 2) % cols.length], { side: THREE.DoubleSide })), Math.cos(a) * 2.5, 0.7, Math.sin(a) * 2.5);
      fan.rotation.y = -a + Math.PI / 2;
      parts.push(fan);
    }
    // Krone: offene Riesenmuschel mit leuchtender Perle
    const clam = scallop('#ffe8f6', 1.3);
    clam.position.set(last.x, topY + 0.05, last.z);
    const pearl = at(new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 12), E('#fff6fa', 2.0)), last.x, topY + 0.45, last.z);
    parts.push(clam, pearl);
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * TAU;
      parts.push(at(new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), E('#5affd8', 1.6)), last.x + Math.cos(a) * 0.75, topY + 0.15, last.z + Math.sin(a) * 0.75));
    }
    // Leben: zwei Fischschwärme, eine Schildkröte
    const fishOf = (c) => {
      const f = new THREE.Group();
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), M(c));
      body.scale.set(0.55, 0.8, 1.5);
      const tail = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.2, 4), M(c));
      tail.rotation.x = -Math.PI / 2;
      tail.position.z = -0.3;
      f.add(body, tail);
      return f;
    };
    const swarms = [[2.3, topY * 0.45, 1], [1.9, topY * 0.8, -1]].map(([r, y, dir]) => {
      const g = new THREE.Group();
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * TAU, f = fishOf(cols[(i + (dir > 0 ? 0 : 3)) % cols.length]);
        f.position.set(Math.cos(a) * r, y + Math.sin(i * 1.7) * 0.25, Math.sin(a) * r);
        f.rotation.y = -a + (dir > 0 ? 0 : Math.PI);
        f.traverse((o) => (o.userData.rbx = { skip: true }));
        g.add(f);
      }
      g.userData.dir = dir;
      return g;
    });
    const turtle = new THREE.Group();
    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 6, 0, TAU, 0, Math.PI / 2), M('#5a7a3a'));
    shell.scale.y = 0.55;
    turtle.add(shell, at(new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), M('#8aa86a')), 0, 0.05, 0.5));
    for (const [x, z] of [[0.4, 0.25], [-0.4, 0.25], [0.3, -0.3], [-0.3, -0.3]]) {
      const fl = at(new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.04, 0.14), M('#8aa86a')), x, 0, z);
      fl.rotation.y = x > 0 ? -0.4 : 0.4;
      turtle.add(fl);
    }
    turtle.traverse((o) => (o.userData.rbx = { skip: true }));
    const orbit = new THREE.Group();
    turtle.position.set(4.2, topY * 0.6, 0);
    orbit.add(turtle);
    ctx.put(group(...parts, ...swarms, orbit), p[0], p[1], { rot: false });
    ctx.anims.push((t) => {
      swarms.forEach((g) => (g.rotation.y = t * 0.45 * g.userData.dir));
      orbit.rotation.y = -t * 0.12;
      turtle.position.y = topY * 0.6 + Math.sin(t * 0.7) * 0.3;
      pearl.material.emissiveIntensity = 1.6 + Math.sin(t * 1.5) * 0.5;
    });
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
    // mehr Details (Werkstatt-Wunsch): vier Bögen aus Perlenschnüren über den Stufen, Muschellaternen dazwischen,
    // Mosaikring auf der oberen Stufe
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * TAU + Math.PI / 4;
      for (let j = 0; j <= 10; j++) {
        const t = (j / 10) * Math.PI, side = Math.cos(t) * 0.7;
        parts.push(at(new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), M('#fff6fa', { roughness: 0.2, metalness: 0.2 })), Math.cos(a) * 2.45 - Math.sin(a) * side, 0.35 + Math.sin(t) * 1.3, Math.sin(a) * 2.45 + Math.cos(a) * side));
      }
      const la = a + Math.PI / 4;
      parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.0, 6), M('#e8d8c8')), Math.cos(la) * 2.7, 0.8, Math.sin(la) * 2.7));
      const lamp = scallop('#ffe8f0', 0.35);
      lamp.position.set(Math.cos(la) * 2.7, 1.3, Math.sin(la) * 2.7);
      parts.push(lamp, at(new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), E('#fff2fa', 1.6)), Math.cos(la) * 2.7, 1.42, Math.sin(la) * 2.7));
    }
    for (let k = 0; k < 20; k++) {
      const a = (k / 20) * TAU, tile = at(new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.03, 0.18), M(['#ffc8d8', '#c8e8ff', '#fff2c8', '#e8d0ff'][k % 4])), Math.cos(a) * 1.75, 0.92, Math.sin(a) * 1.75);
      tile.rotation.y = -a;
      parts.push(tile);
    }
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
    scatter(8, () => rockMesh(rr(0.08, 0.18), '#f2e2c0', rand), 0.15, 2, ctx.R - 2.6); // feste Anzahlen
    scatter(4, () => {
      const s = starfish(['#ff7a4a', '#ffb02e', '#ff5f8a'][Math.floor(rand() * 3)]);
      s.scale.setScalar(0.6);
      return s;
    }, 0.2, 2, ctx.R - 2.6);
  } else if (id === 'muschelland') {
    scatter(10, () => at(new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), M('#fff8f0', { metalness: 0.3, roughness: 0.2, emissive: '#ffe8f0', emissiveIntensity: 0.3 })), 0, 0.07, 0), 0.12, 2, ctx.R - 2.6);
    scatter(6, () => rockMesh(rr(0.08, 0.16), '#e8c8b0', rand), 0.15, 2, ctx.R - 2.6);
  } else if (id === 'atlantis') {
    scatter(6, () => column(rr(0.3, 0.7), '#e8eef2', true), 0.45, 2, ctx.R - 2.6);
    scatter(10, () => at(new THREE.Mesh(new THREE.OctahedronGeometry(0.1, 0), E('#5affd8', 1.4)), 0, 0.1, 0), 0.15, 2, ctx.R - 2.6);
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
