// Planet 2 (Mond, Neptun, Mars, Saturn, Alien, Sonne): wie Planet 1 bekommt jede Welt ein Wahrzeichen,
// Wege mit Münz-Lichtungen, eine Kulisse im All (innerhalb der Himmelskuppel), mehr Bodendetails, eigene
// Partikel und Plätze für Klänge. Bausteine aus worldFactory.js (kit), Wege und Kulisse-Helfer aus planet1.js.

import * as THREE from 'three';
import { backdropMesh, paths } from './planet1.js';

const TAU = Math.PI * 2;

// pebble: Steinchen um die Münz-Lichtungen (sonst in der Wegfarbe, auf Mars wirkten Metall-Kiesel fremd)
// trail: ausgetretener Boden unter dem Weg
const PATHS = {
  mond: { color: '#9a9da6', kind: 'stone', trail: ['#82858e', 'Slate'] },
  neptun: { color: '#9fd8ff', kind: 'stone', glass: true, trail: ['#9fc8f4', 'Snow'] },
  mars: { color: '#9aa0a8', kind: 'tile', metal: true, glow: '#ff9a5a', pebble: '#6a3422', trail: ['#7a3a22', 'Ground'] },
  saturn: { color: '#d8b880', kind: 'stone', trail: ['#b8965e', 'Sand'] },
  alien: { color: '#3a1a60', kind: 'tile', glow: '#7aff5a', trail: ['#4a2a70', 'Slate'] },
  sonne: { color: '#5a1a08', kind: 'tile', glow: '#ffd84a', pebble: '#2a0e04', trail: ['#3a1206', 'Basalt'] },
};

// ── Wahrzeichen ──
const LANDMARK = {
  // Rakete auf der Startrampe
  mond(ctx, kit) {
    const { M, E, at, group } = kit;
    const p = ctx.spot(2.4, 4, 10);
    if (!p) return;
    const steel = M('#8a8f9a', { metalness: 0.6, roughness: 0.4 });
    const parts = [at(new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.3, 3.4), M('#5a5d66')), 0, 0.15, 0)];
    // Turm aus vier Stangen mit Querstreben
    for (const [x, z] of [[1.1, -0.5], [1.7, -0.5], [1.1, 0.5], [1.7, 0.5]]) parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(0.12, 7.4, 0.12), steel), x, 3.9, z));
    for (let y = 1; y < 7.6; y += 1.1) parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 1.1), steel), 1.4, y, 0));
    parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(1, 0.1, 0.14), steel), 0.6, 5.6, 0));
    // Rakete
    parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 5.2, 16), M('#f4f4f6')), 0, 3, 0));
    parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.5, 16), M('#d83a3a')), 0, 4.4, 0));
    parts.push(at(new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.5, 16), M('#d83a3a')), 0, 6.35, 0));
    parts.push(at(new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), E('#7ad0ff', 1.4)), 0, 5.1, 0.5));
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * TAU + 0.5;
      const fin = at(new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.2, 0.7), M('#d83a3a')), Math.cos(a) * 0.65, 0.95, Math.sin(a) * 0.65);
      fin.rotation.y = -a;
      parts.push(fin);
    }
    parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 0.4, 12), M('#3a3d46')), 0, 0.5, 0));
    parts.push(at(new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), E('#ff3a4a', 2)), 1.4, 7.75, 0));
    ctx.put(group(...parts), p[0], p[1], { rot: false });
  },
  // Eisturm mit schwebenden Ringen
  neptun(ctx, kit) {
    const { M, E, at, group, crystal } = kit;
    const p = ctx.spot(2.4, 4, 10);
    if (!p) return;
    const spire = crystal(4, '#7ad0ff', ctx.rand, 1.4);
    const core = at(new THREE.Mesh(new THREE.OctahedronGeometry(1, 0), E('#9fe0ff', 0.7, { transparent: true, opacity: 0.9, roughness: 0.15 })), 0, 3.6, 0);
    core.scale.set(1, 3.6, 1);
    const rings = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.3 + i * 0.35, 0.07, 6, 28), E('#bff0ff', 1.2, { transparent: true, opacity: 0.8 }));
      ring.rotation.x = Math.PI / 2 + (i - 1) * 0.25;
      ring.position.y = 2.2 + i * 1.3;
      rings.add(ring);
    }
    const base = at(new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.7, 0.5, 10), M('#2a4fa0')), 0, 0.25, 0);
    ctx.put(group(base, core, spire, rings), p[0], p[1], { rot: false });
    ctx.anims.push((t) => rings.children.forEach((r, i) => (r.rotation.z = t * (0.4 + i * 0.2) * (i % 2 ? -1 : 1))));
  },
  // Radarschüssel der Forschungsstation mit Solarfeld
  mars(ctx, kit) {
    const { M, E, at, group } = kit;
    const p = ctx.spot(2.4, 4, 10);
    if (!p) return;
    const white = M('#e8e8ec'), metal = M('#9aa0a8', { metalness: 0.6, roughness: 0.35 });
    const dish = at(new THREE.Mesh(new THREE.SphereGeometry(1.8, 20, 10, 0, TAU, 0, Math.PI * 0.32), white), 0, 3.4, 0);
    dish.rotation.x = Math.PI + 0.6;
    const parts = [
      at(new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 1.6), M('#c8c8cc')), 0, 0.3, 0),
      at(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 3, 10), metal), 0, 1.9, 0),
      dish,
      at(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.6, 6), metal), 0, 3.0, 0.75),
      at(new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), E('#ff3a4a', 2)), 0, 2.6, 1.3),
    ];
    parts.at(-2).rotation.x = 0.6;
    for (let i = 0; i < 3; i++) {
      const panel = at(new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 0.8), M('#1f3a7a', { metalness: 0.5, roughness: 0.25 })), -2.4 + i * 1.35, 0.7, 1.9);
      panel.rotation.x = -0.5;
      parts.push(panel, at(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 5), metal), -2.4 + i * 1.35, 0.3, 1.9));
    }
    ctx.put(group(...parts), p[0], p[1], { rot: false });
  },
  // Sternwarte mit Kuppel und Teleskop
  saturn(ctx, kit) {
    const { M, E, at, group } = kit;
    const p = ctx.spot(2.2, 4, 10);
    if (!p) return;
    const scope = at(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 2.2, 12), M('#3a3d46', { metalness: 0.5 })), 0.5, 3.6, 0);
    scope.rotation.z = -0.8;
    const parts = [
      at(new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.6, 2.2, 16), M('#f0e2c4')), 0, 1.1, 0),
      at(new THREE.Mesh(new THREE.CylinderGeometry(1.62, 1.62, 0.15, 16), M('#b0905a')), 0, 2.25, 0),
      at(new THREE.Mesh(new THREE.SphereGeometry(1.45, 18, 10, 0, TAU, 0, Math.PI / 2), M('#d8dce4', { metalness: 0.5, roughness: 0.3 })), 0, 2.3, 0),
      scope,
      at(new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.2, 0.12), M('#7a4a2a')), 0, 0.6, 1.58),
      at(new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), E('#ffe2a0', 2)), 0, 1.5, 1.6),
    ];
    ctx.put(group(...parts), p[0], p[1], { rot: false });
  },
  // Alien-Tor: zwei Säulen mit leuchtendem Ring und einer schwebenden Kugel
  alien(ctx, kit) {
    const { M, E, at, group } = kit;
    const p = ctx.spot(2.4, 4, 10);
    if (!p) return;
    const stone = M('#2e1650');
    const parts = [];
    for (const x of [-1.6, 1.6]) {
      parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(0.6, 4.4, 0.6), stone), x, 2.2, 0));
      parts.push(at(new THREE.Mesh(new THREE.OctahedronGeometry(0.35, 0), E('#7aff5a', 1.6)), x, 4.8, 0));
      for (let y = 0.8; y < 4; y += 1.1) parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.1, 0.64), E('#d97aff', 1.2)), x, y, 0));
    }
    const ring = at(new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.12, 8, 30), E('#7aff5a', 1.4)), 0, 2.4, 0);
    const orb = at(new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 10), E('#5affd8', 1.8)), 0, 2.4, 0);
    parts.push(ring, orb);
    ctx.put(group(...parts), p[0], p[1], { rot: false });
    ctx.anims.push((t) => {
      ring.rotation.z = t * 0.7;
      orb.position.y = 2.4 + Math.sin(t * 1.6) * 0.2;
    });
  },
  // Sonnentempel: Säulenkreis mit schwebender Sonnenscheibe
  sonne(ctx, kit) {
    const { M, E, at, group } = kit;
    const p = ctx.spot(2.6, 4, 10);
    if (!p) return;
    const parts = [at(new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.6, 0.4, 16), M('#7a2a08')), 0, 0.2, 0)];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 3, 10), M('#c8501a')), Math.cos(a) * 2, 1.9, Math.sin(a) * 2));
      parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.2, 0.6), E('#ffb02e', 1)), Math.cos(a) * 2, 3.5, Math.sin(a) * 2));
    }
    const sun = at(new THREE.Mesh(new THREE.SphereGeometry(0.9, 18, 12), E('#ffd84a', 2.2)), 0, 3.4, 0);
    const halo = at(new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.08, 6, 28), E('#ff8a1a', 1.6)), 0, 3.4, 0);
    parts.push(sun, halo);
    ctx.put(group(...parts), p[0], p[1], { rot: false });
    ctx.anims.push((t) => (halo.rotation.y = t * 0.5));
  },
};

// ── Kulisse im All: Asteroiden, Felsen und Formen in der Ferne (40–70 Einheiten) ──
function backdrop(ctx, kit) {
  const { M, E, at } = kit;
  const { root, rand, world } = ctx;
  const id = world.id;
  const base = -24; // Oberkante des Nebelmeers liegt darüber
  const add = (mesh) => {
    root.add(backdropMesh(mesh));
    return mesh;
  };
  const asteroid = (x, y, z, s, c) => {
    const m = add(at(new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), M(c)), x, y, z));
    m.scale.set(1, 0.7 + rand() * 0.3, 0.8 + rand() * 0.3);
    m.rotation.set(rand() * 3, rand() * 3, rand() * 3);
    return m;
  };
  const n = 14;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + rand() * 0.3, r = 44 + rand() * 24;
    const x = Math.cos(a) * r, z = Math.sin(a) * r, h = 14 + rand() * 20;
    if (id === 'mond') {
      // Kraterränder: flache, breite Felsringe, darüber schwebende Brocken
      add(at(new THREE.Mesh(new THREE.CylinderGeometry(9, 12, h * 0.7, 10), M(['#8a8d96', '#9a9da6', '#6a6d76'][i % 3])), x, base + h * 0.35, z));
      if (i % 2) asteroid(x * 0.9, 8 + rand() * 18, z * 0.9, 1.5 + rand() * 2.5, '#8a8d96');
    } else if (id === 'neptun') {
      add(at(new THREE.Mesh(new THREE.ConeGeometry(5 + rand() * 3, h + 14, 6), M(['#3a6fd1', '#4a8aff', '#2a4fa0'][i % 3])), x, base + (h + 14) / 2, z));
      if (i % 3 === 0) add(at(new THREE.Mesh(new THREE.OctahedronGeometry(1.4, 0), E('#7ad0ff', 1.4)), x, base + h + 16, z));
    } else if (id === 'mars') {
      // Tafelberge in Schichten
      const w = 8 + rand() * 6;
      add(at(new THREE.Mesh(new THREE.CylinderGeometry(w, w * 1.15, h, 9), M('#8a3a1e')), x, base + h / 2, z));
      add(at(new THREE.Mesh(new THREE.CylinderGeometry(w * 0.98, w, 2.4, 9), M('#c4582e')), x, base + h + 1.2, z));
    } else if (id === 'saturn') {
      // ein Gürtel aus Brocken rund um die Insel
      for (let j = 0; j < 3; j++) {
        const b = a + j * 0.14, rb = 52 + (rand() - 0.5) * 8;
        asteroid(Math.cos(b) * rb, 6 + (rand() - 0.5) * 4, Math.sin(b) * rb, 1 + rand() * 2.2, ['#c8a870', '#b0905a', '#e0c08a'][j]);
      }
    } else if (id === 'alien') {
      // Riesenpilze mit leuchtenden Hüten
      const sh = h + 4;
      add(at(new THREE.Mesh(new THREE.CylinderGeometry(1.4, 2, sh, 8), M('#4a2478')), x, base + sh / 2, z));
      add(at(new THREE.Mesh(new THREE.SphereGeometry(6 + rand() * 3, 16, 8, 0, TAU, 0, Math.PI / 2), E(['#7aff5a', '#5affd8', '#d97aff'][i % 3], 0.9)), x, base + sh - 0.5, z));
    } else if (id === 'sonne') {
      // Sonnenbögen, die aus dem Glutmeer steigen
      const arc = add(at(new THREE.Mesh(new THREE.TorusGeometry(7 + rand() * 4, 0.9, 6, 20, Math.PI), E(i % 2 ? '#ff8a1a' : '#ff4a00', 1.3)), x, base + 6, z));
      arc.rotation.y = -a + Math.PI / 2;
      if (i % 2) asteroid(x * 0.85, 4 + rand() * 14, z * 0.85, 1.2 + rand() * 1.6, '#a02a08');
    }
  }
  // zwei ferne UFOs über der Alien-Welt
  if (id === 'alien')
    for (const [x, y, z] of [[-40, 26, 30], [36, 32, -42]]) {
      const d = add(at(new THREE.Mesh(new THREE.SphereGeometry(3, 16, 8), M('#b8c0cc', { metalness: 0.7 })), x, y, z));
      d.scale.set(1, 0.3, 1);
      add(at(new THREE.Mesh(new THREE.TorusGeometry(3, 0.25, 6, 20), E('#7aff5a', 1.8)), x, y, z)).rotation.x = Math.PI / 2;
    }
}

// ── mehr Details am Boden ──
function details(ctx, kit) {
  const { M, E, at, rockMesh, crystal } = kit;
  const { scatter, rand, rr } = ctx;
  const id = ctx.world.id;
  if (id === 'mond') {
    scatter(10, () => rockMesh(rr(0.1, 0.2), '#a0a3ac', rand), 0.18);
    // Fußspuren
    scatter(8, () => at(new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.02, 0.3), M('#7a7d86')), 0, 0.01, 0), 0.15);
  } else if (id === 'neptun') {
    scatter(10, () => crystal(rr(0.3, 0.6), '#9fd8ff', rand, 0.8), 0.2);
  } else if (id === 'mars') {
    scatter(12, () => rockMesh(rr(0.1, 0.22), ['#8a3a1e', '#a0482a'][Math.floor(rand() * 2)], rand), 0.18);
    // Messsonden mit Lämpchen
    scatter(3, () => {
      const g = new THREE.Group();
      g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.7, 5), M('#c8c8cc')), 0, 0.35, 0));
      g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 4), E('#7aff5a', 2)), 0, 0.74, 0));
      return g;
    }, 0.3);
  } else if (id === 'saturn') {
    scatter(12, () => rockMesh(rr(0.08, 0.18), '#ffe2a0', rand), 0.15);
  } else if (id === 'alien') {
    scatter(24, () => at(new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), E(['#7aff5a', '#5affd8', '#d97aff'][Math.floor(rand() * 3)], 1.4)), 0, 0.08, 0), 0.15, 2, ctx.R - 2.6);
  } else if (id === 'sonne') {
    scatter(12, () => rockMesh(rr(0.1, 0.2), '#3a0e04', rand, rand() < 0.5 ? E('#ff8a1a', 0.9) : null), 0.18);
  }
}

// ── Leben und Himmelseffekte (Webseiten-Einheiten) ──
function emitters(ctx) {
  const R = ctx.R, id = ctx.world.id, list = (ctx.shared.emitters = ctx.shared.emitters || []);
  const add = (name, pos, size, colors, particleSize, rate, speed, lifetime, opts = {}) =>
    list.push({ name, pos, size, colors, particleSize, rate, speed, lifetime, spread: opts.spread ?? [180, 180], direction: opts.direction ?? 'Top', lightEmission: opts.light ?? 0 });
  // Sternschnuppen: schnelle, helle Funken hoch über der Insel, die seitlich davonziehen
  const shooting = (c) => add('Sternschnuppen', [0, 28, 0], [R * 4, 4, R * 4], [c, '#ffffff'], 0.35, 2, [14, 22], [1.2, 2], { direction: 'Left', spread: [10, 10], light: 1 });
  if (id === 'mond') {
    shooting('#e8ecf5');
    add('Mondstaub', [0, 0.4, 0], [R * 2, 1, R * 2], ['#c8ccd4', '#a0a3ac'], 0.2, 6, [0.1, 0.3], [5, 8], { spread: [30, 30] });
  } else if (id === 'neptun') {
    add('Sturmboeen', [0, 4, 0], [R * 2, 6, R * 2], ['#ffffff', '#bff0ff'], 0.25, 18, [6, 10], [1.5, 2.5], { direction: 'Right', spread: [12, 12], light: 0.4 });
    shooting('#7ad0ff');
  } else if (id === 'mars') {
    add('Staubteufel', [R * 0.4, 0.2, -R * 0.3], [2, 1, 2], ['#c4602e', '#e0905a'], 0.6, 16, [1.5, 3], [3, 5], { spread: [12, 12] });
    shooting('#ffb07a');
  } else if (id === 'saturn') {
    add('Goldstaub', [0, 3, 0], [R * 2, 5, R * 2], ['#ffe2a0', '#e0c08a'], 0.18, 8, [0.1, 0.3], [6, 9], { light: 0.8 });
    shooting('#ffe2a0');
  } else if (id === 'alien') {
    add('Leuchtsporen', [0, 0.5, 0], [R * 2, 1, R * 2], ['#7aff5a', '#5affd8', '#d97aff'], 0.22, 8, [0.4, 0.9], [6, 10], { spread: [15, 15], light: 1 });
    shooting('#7aff5a');
  } else if (id === 'sonne') {
    add('Funkenflug', [0, 0.3, 0], [R * 2, 1, R * 2], ['#fff2a0', '#ffb02e', '#ff4a00'], 0.2, 14, [1.2, 2.6], [3, 5], { spread: [15, 15], light: 1 });
  }
}

// ── Plätze für Klänge ──
const SOUNDS = {
  mond: [['Weltraum', 'ruhiges, tiefes Weltraum-Summen', 0.4], ['Funk', 'leises Funkpiepen, ab und zu', 0.2]],
  neptun: [['Sturm', 'heulender Sturm', 0.45], ['Kristalle', 'klirrende Eiskristalle', 0.2]],
  mars: [['Wind', 'trockener Wüstenwind', 0.4], ['Station', 'Brummen einer Forschungsstation', 0.2]],
  saturn: [['Weltraum', 'tiefes Dröhnen im All', 0.4], ['Sand', 'leise rieselnder Sand', 0.2]],
  alien: [['Alien', 'seltsames Zirpen und Alien-Stimmen', 0.4], ['UFO', 'brummendes UFO', 0.3]],
  sonne: [['Feuer', 'tosendes Feuer', 0.45], ['Sonnenwind', 'grollender Sonnenwind', 0.3]],
};

export const PLANET2 = new Set(Object.keys(PATHS));

export function planet2Before(ctx, kit) {
  if (!PLANET2.has(ctx.world.id)) return;
  if (!ctx.modelWorld || ctx.modelWorld.landmark) LANDMARK[ctx.world.id](ctx, kit);
  paths(ctx, kit, PATHS[ctx.world.id]);
}

export function planet2After(ctx, kit) {
  if (!PLANET2.has(ctx.world.id)) return;
  if (ctx.modelWorld?.backdrop) ctx.modelWorld.backdrop(ctx, kit);
  else backdrop(ctx, kit);
  details(ctx, kit);
  emitters(ctx);
  ctx.shared.sounds = SOUNDS[ctx.world.id].map(([name, hint, volume]) => ({ name, hint, volume }));
}
