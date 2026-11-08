// Welten aus Modellen der CC0-Pakete (KayKit, assets/modelle/bibliothek.glb). Ein Modell steht in der
// Webseiten-Szene als unsichtbarer Kasten (Platzhalter) mit userData.rbx.model; der Export macht daraus ein
// Teil „ModellPlatz“, das Roblox-Skript CoinmasterModelle und die Vorschau setzen dort das echte Modell ein.
//
// MODEL_WORLDS[id] = { landmark, build(ctx, kit), backdrop(ctx, kit) }
//   landmark  true: das Wahrzeichen aus planet1.js bleibt (sonst baut build eines)
//   build     ersetzt den alten Grundbau (BUILDERS/EXTRAS in worldFactory.js)
//   backdrop  ersetzt die Kulisse aus planet1.js

import * as THREE from 'three';
import { MODELS } from './modelCatalog.js';
import { backdrop as planet1Backdrop } from './planet1.js';

const TAU = Math.PI * 2;
const HIDDEN = new THREE.MeshBasicMaterial({ visible: false });
const UNIT = new THREE.BoxGeometry(1, 1, 1);

// Modell als Platzhalter; s = Webseiten-Einheiten je Modell-Einheit (1 Einheit = 8 Studs)
export function model(id, s = 1, { sky = false } = {}) {
  const m = MODELS[id];
  if (!m) throw new Error(`Modell ${id} fehlt in modelCatalog.js`);
  const box = new THREE.Mesh(UNIT, HIDDEN);
  box.scale.set(m.size[0], m.size[1], m.size[2]);
  box.position.set(m.center[0], m.center[1], m.center[2]);
  box.userData.rbx = { model: id, fest: m.fest && !sky, ...(sky ? { sky: true } : {}) };
  const g = new THREE.Group();
  g.add(box);
  g.scale.setScalar(s);
  // Bodenkante: Modelle stehen mit ihrer Unterseite auf dem Boden
  g.userData.base = (m.center[1] - m.size[1] / 2) * s;
  g.userData.radius = (Math.max(m.size[0], m.size[2]) / 2) * s;
  return g;
}

const pick = (rand, arr) => arr[Math.floor(rand() * arr.length)];

// Modell auf einen freien Platz stellen (Abstand aus der Grundfläche); gibt die Gruppe oder null zurück
export function place(ctx, id, s, { rMin = 0, rMax = ctx.R - 1, face = null, sink = 0.08, gap = 0.9 } = {}) {
  const g = model(id, s);
  const p = ctx.spot(g.userData.radius * gap, rMin, rMax);
  if (!p) return null;
  return stand(ctx, g, p[0], p[1], { face, sink });
}
export function stand(ctx, g, x, z, { face = null, sink = 0.08, rot = null, origin = false } = {}) {
  // origin: Nullpunkt des Modells auf den Boden (Brücke: der Bogen reicht ins Wasser), sonst die Unterseite
  ctx.put(g, x, z, { rot: false, sink: origin ? sink : sink + g.userData.base });
  g.rotation.y = rot ?? (face ? Math.atan2(face[0] - x, face[1] - z) : ctx.rand() * TAU);
  return g;
}
export function scatterModels(ctx, n, ids, sMin, sMax, opts = {}) {
  for (let i = 0; i < n; i++) place(ctx, pick(ctx.rand, ids), ctx.rr(sMin, sMax), opts);
}

// ── Kulisse: Berge und Hügel aus dem Paket, groß und weit weg (im Ordner „Himmel“) ──
function mountainRing(ctx, ids, { n = 11, sMin = 12, sMax = 17, rMin = 54, rMax = 68, base = -28 } = {}) {
  const { rand } = ctx;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + rand() * 0.3, r = rMin + rand() * (rMax - rMin);
    const g = model(pick(rand, ids), sMin + rand() * (sMax - sMin), { sky: true });
    g.position.set(Math.cos(a) * r, base - g.userData.base, Math.sin(a) * r);
    g.rotation.y = rand() * TAU;
    ctx.root.add(g);
  }
}
function cloudRing(ctx, n = 7) {
  const { rand } = ctx;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + rand() * 0.5, r = 28 + rand() * 18;
    const g = model(rand() < 0.5 ? 'cloud_big' : 'cloud_small', 2.6 + rand() * 2.4, { sky: true });
    g.position.set(Math.cos(a) * r, 9 + rand() * 12, Math.sin(a) * r);
    g.rotation.y = rand() * TAU;
    ctx.root.add(g);
  }
}

// ── Felsunterseite aus Modellen: umgedrehte Felsen in Ringen, die nach unten enger werden (ein Felskegel) ──
// Ersetzt die Schichtscheiben aus worldParts.js (bei Welten mit Himmelsbild, siehe underside dort).
function rockUnderside(ctx, ids, { rings = 6, depth = 13, top = -1.1 } = {}) {
  const { rand, rr, R, root } = ctx;
  for (let i = 0; i < rings; i++) {
    const k = i / (rings - 1);
    const r = (R - 1.1) * (1 - k * 0.88) ** 0.9, y = top - 0.6 - k * depth;
    const w = 4.2 - k * 2;
    const n = Math.max(3, Math.round((TAU * r) / (w * 0.62)));
    for (let j = 0; j < n; j++) {
      const a = (j / n) * TAU + rr(-0.06, 0.06) + i * 0.4;
      const id = pick(rand, ids);
      const g = model(id, w / MODELS[id].size[0], { sky: true });
      g.rotation.set(Math.PI, rand() * TAU, rr(-0.12, 0.12));
      g.scale.y *= 1.3 + k * 1.6 + rand() * 1.2; // oben kurz (die Ranken am Rand bleiben sichtbar), unten lange Spitzen
      g.position.set(Math.cos(a) * r, y + rr(-0.3, 0.3), Math.sin(a) * r);
      root.add(g);
    }
  }
  // Mitte: dicker Kern und eine lange Spitze ganz unten
  for (const [rad, y, w, sy] of [[0, top - depth * 0.55, R * 0.9, 3], [0, top - depth * 0.95, 4, 5]]) {
    const id = pick(rand, ids);
    const g = model(id, w / MODELS[id].size[0], { sky: true });
    g.rotation.set(Math.PI, rand() * TAU, 0);
    g.scale.y *= sy;
    g.position.set(rad, y, 0);
    root.add(g);
  }
}

// ── Hängende Wurzeln unter dem Inselrand: dünne, leicht schräge Glieder, unten ein Wurzelknoten ──
function hangingRoots(ctx, n, { color = '#6b4a2e', tip = '#4f3a26', glow = false, outer = false } = {}) {
  const { rand, rr, R, root } = ctx;
  const mat = new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.9 });
  // glow: leuchtende Knospen (Alien-Ranken)
  const tipMat = glow ? new THREE.MeshStandardMaterial({ color: tip, emissive: tip, emissiveIntensity: 1.8 }) : new THREE.MeshStandardMaterial({ color: tip, flatShading: true, roughness: 0.9 });
  const add = (mesh) => {
    mesh.userData.rbx = { sky: true };
    root.add(mesh);
  };
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + rr(-0.08, 0.08), r = outer ? R + rr(0.4, 1) : R - rr(0.4, 1.6);
    let x = Math.cos(a) * r, z = Math.sin(a) * r, y = outer ? -0.5 : -0.9;
    const segs = 3 + Math.floor(rand() * 3), w = rr(0.1, 0.2);
    for (let j = 0; j < segs; j++) {
      const len = rr(0.8, 1.6), dx = rr(-0.25, 0.25), dz = rr(-0.25, 0.25);
      const m = new THREE.Mesh(new THREE.CylinderGeometry(w * (1 - j * 0.15), w * (1 - (j - 1) * 0.15), len, 6), mat);
      m.position.set(x + dx / 2, y - len / 2, z + dz / 2);
      m.rotation.set(dz * 0.5, 0, -dx * 0.5);
      add(m);
      x += dx; z += dz; y -= len;
    }
    const knot = new THREE.Mesh(new THREE.SphereGeometry(w * 1.3, 6, 4), tipMat);
    knot.position.set(x, y, z);
    add(knot);
  }
}

// ── Lichter und Rohre unter einer Insel (Stadt): Leitungen hängen aus dem Fels, an den Enden leuchten Lampen ──
function undersideLights(ctx, n, { pipe = '#7a7f8a', glow = '#ffd27a' } = {}) {
  const { rand, rr, R, root } = ctx;
  const pm = new THREE.MeshStandardMaterial({ color: pipe, metalness: 0.6, roughness: 0.4 });
  const lm = new THREE.MeshStandardMaterial({ color: glow, emissive: glow, emissiveIntensity: 1.6 });
  const add = (m) => {
    m.userData.rbx = { sky: true };
    root.add(m);
  };
  for (let i = 0; i < n; i++) {
    // Lampen hängen unter den Felsspitzen der äußeren Ringe (Felskegel siehe rockUnderside)
    const a = (i / n) * TAU + rr(-0.1, 0.1), r = rr(R * 0.45, R * 0.8);
    const y0 = -3 - (1 - r / R) * 10, len = rr(4, 7);
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, len, 8), pm);
    p.position.set(x, y0 - len / 2, z);
    add(p);
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), lm);
    l.position.set(x, y0 - len - 0.25, z);
    add(l);
    if (rand() < 0.4) {
      // waagrechtes Stück zum Nachbarrohr
      const h = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2, 8), pm);
      h.rotation.z = Math.PI / 2;
      h.rotation.y = -a;
      h.position.set(x, y0 - len * 0.4, z);
      add(h);
    }
  }
}

// ── Eiszapfen unter dem Inselrand: umgedrehte, durchscheinende Kegel ──
function icicles(ctx, n, { color = '#cfeeff', glow = false } = {}) {
  const { rr, R, root } = ctx;
  // glow: leuchtende Lavatropfen (Neon) statt Eis
  const mat = glow
    ? new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.6 })
    : new THREE.MeshStandardMaterial({ color, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.85 });
  for (let i = 0; i < n; i++) {
    // am äußersten Rand (vor den Felsen der Unterseite), oben am Grasrand angesetzt
    const a = (i / n) * TAU + rr(-0.06, 0.06), r = R + rr(0.6, 1.1);
    const len = rr(1.4, 3.8), w = rr(0.2, 0.42);
    const m = new THREE.Mesh(new THREE.ConeGeometry(w, len, 6), mat);
    m.rotation.x = Math.PI;
    m.position.set(Math.cos(a) * r, -0.5 - len / 2, Math.sin(a) * r);
    m.userData.rbx = { sky: true };
    root.add(m);
  }
}

// ── Kristallspitzen unter der Insel (Höhle): leuchtende Kristallbüschel hängen aus dem Fels ──
function hangingCrystals(ctx, kit, n, colors) {
  const { rand, rr, R, root } = ctx;
  for (let i = 0; i < n; i++) {
    // am äußersten Rand, vor den Felsen der Unterseite
    const a = (i / n) * TAU + rr(-0.1, 0.1), r = R + rr(0.5, 1.1);
    const c = kit.crystal(rr(1.6, 3), colors[i % colors.length], rand, 2);
    c.rotation.x = Math.PI; // Spitze nach unten
    c.position.set(Math.cos(a) * r, -0.6, Math.sin(a) * r);
    c.traverse((o) => o.isMesh && (o.userData.rbx = { sky: true }));
    root.add(c);
  }
}

// ── Zuckergusstropfen am Inselrand (Candy): kurze, runde Tropfen in Pastellfarben ──
function frostingDrips(ctx, n, colors) {
  const { rr, R, root } = ctx;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + rr(-0.05, 0.05), r = R + rr(0.4, 0.9);
    const len = rr(0.6, 2.2), w = rr(0.25, 0.45), c = colors[i % colors.length];
    const mat = new THREE.MeshStandardMaterial({ color: c, roughness: 0.4 });
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(w, w, len, 10), mat);
    stem.position.set(Math.cos(a) * r, -0.4 - len / 2, Math.sin(a) * r);
    const drop = new THREE.Mesh(new THREE.SphereGeometry(w * 1.25, 10, 8), mat);
    drop.position.set(Math.cos(a) * r, -0.4 - len, Math.sin(a) * r);
    for (const m of [stem, drop]) {
      m.userData.rbx = { sky: true };
      root.add(m);
    }
  }
}

// ── Perlenschnüre unter dem Inselrand (Muschelland): Ketten aus schimmernden Perlen, unten eine große ──
function pearlStrings(ctx, n) {
  const { rr, R, root } = ctx;
  const mat = new THREE.MeshStandardMaterial({ color: '#fff4f8', metalness: 0.3, roughness: 0.2, emissive: '#ffe0f0', emissiveIntensity: 0.35 });
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + rr(-0.05, 0.05), r = R + rr(0.5, 1);
    const count = 4 + Math.floor(rr(0, 5));
    for (let j = 0; j <= count; j++) {
      const big = j === count, s = big ? rr(0.28, 0.4) : 0.15;
      const m = new THREE.Mesh(new THREE.SphereGeometry(s, 10, 8), mat);
      m.position.set(Math.cos(a) * r, -0.5 - j * 0.42 - (big ? 0.1 : 0), Math.sin(a) * r);
      m.userData.rbx = { sky: true };
      root.add(m);
    }
  }
}

// ── Runensteine am Inselrand (Atlantis): leuchtende Tafeln am Fels, nach außen gedreht, darunter Leuchttropfen ──
function runeStones(ctx, n, { color = '#5affd8' } = {}) {
  const { rr, R, root } = ctx;
  const glow = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.8 });
  const stone = new THREE.MeshStandardMaterial({ color: '#4a6470', flatShading: true, roughness: 0.8 });
  const add = (m) => {
    m.userData.rbx = { sky: true };
    root.add(m);
  };
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + rr(-0.04, 0.04), r = R + 0.75, y = -1.6 - rr(0, 1.2);
    const plate = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.8, 0.3), stone);
    plate.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
    plate.rotation.y = -a + Math.PI / 2;
    add(plate);
    // Rune ᛉ: senkrechter Strich und zwei schräge Arme nach oben, leicht vor der Tafel
    const rune = new THREE.Group();
    rune.position.set(Math.cos(a) * (r + 0.18), y, Math.sin(a) * (r + 0.18));
    rune.rotation.y = plate.rotation.y;
    const stroke = (x, yy, rot, h) => {
      const g = new THREE.Mesh(new THREE.BoxGeometry(0.16, h, 0.08), glow);
      g.position.set(x, yy, 0);
      g.rotation.z = rot;
      g.userData.rbx = { sky: true };
      rune.add(g);
    };
    stroke(0, 0, 0, 1.3);
    stroke(-0.22, 0.32, 0.6, 0.6);
    stroke(0.22, 0.32, -0.6, 0.6);
    root.add(rune);
  }
}

// ── Schwebende Inseln (Himmel): Grashügel aus dem Paket auf einem umgedrehten, lang gezogenen Felsen ──
function floatingIsle(ctx, x, y, z, w, topId, rockId = 'rock_single_D') {
  const { rand, root } = ctx;
  const top = model(topId, w / MODELS[topId].size[0], { sky: true });
  top.position.set(x, y - top.userData.base, z);
  top.rotation.y = rand() * TAU;
  root.add(top);
  const rk = model(rockId, (w * 0.92) / MODELS[rockId].size[0], { sky: true });
  rk.rotation.set(Math.PI, rand() * TAU, 0); // Spitze nach unten
  rk.scale.y *= 1.8 + rand() * 0.8;
  rk.position.set(x, y + 0.04 * w, z);
  root.add(rk);
}
// Inselchen in mittlerer Entfernung und kleine Brocken direkt am Inselrand
function floatingIsles(ctx, { far = 6, near = 7, tops = ['hills_A_trees', 'hills_B_trees', 'hill_single_C'], small = ['hill_single_A', 'hill_single_C'], rock = 'rock_single_D', farW = [5, 9], farR = [12, 28] } = {}) {
  const { rand, rr, R } = ctx;
  for (let i = 0; i < far; i++) {
    const a = (i / far) * TAU + rr(-0.25, 0.25), r = rr(R + farR[0], R + farR[1]);
    floatingIsle(ctx, Math.cos(a) * r, rr(-4, 7), Math.sin(a) * r, rr(farW[0], farW[1]), pick(rand, tops), rock);
  }
  for (let i = 0; i < near; i++) {
    const a = rand() * TAU, r = rr(R + 2.5, R + 6.5);
    floatingIsle(ctx, Math.cos(a) * r, rr(-3, 1.5), Math.sin(a) * r, rr(1.2, 2.6), pick(rand, small), rock);
  }
}

// ── Normal: Startdorf mit Windmühle, Brunnen, Häusern, Feld und Bach ──
function stream(ctx, kit) {
  const { root, height, reserve, R, shared } = ctx;
  const pts = [];
  for (let i = 0; i <= 16; i++) {
    const x = -R + (i / 16) * 2 * R, z = Math.sin(i * 0.45) * 1.2 + 1.5;
    if (Math.hypot(x, z) < R - 0.35) pts.push(new THREE.Vector3(x, height(x, z) + 0.03, z));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  shared.stream = curve;
  const water = new THREE.Mesh(new THREE.TubeGeometry(curve, 60, 0.45, 6), kit.M('#4ab0e8', { roughness: 0.1, emissive: '#2a7ab8', emissiveIntensity: 0.25 }));
  water.scale.y = 0.25;
  root.add(water);
  for (let i = 0; i <= 30; i++) {
    const p = curve.getPoint(i / 30);
    reserve(p.x, p.z, 0.45);
  }
  return curve;
}

const NORMAL = {
  landmark: false,
  build(ctx, kit) {
    const { rand, rr, R, reserve } = ctx;
    const curve = stream(ctx, kit);
    // Steinbrücke über den Bach
    {
      const t = 0.42, p = curve.getPoint(t), d = curve.getTangent(t);
      const b = model('building_bridge_A', 1.5);
      reserve(p.x, p.z, 1.6);
      stand(ctx, b, p.x, p.z, { rot: Math.atan2(d.x, d.z) + Math.PI / 2, sink: 0.05, origin: true });
    }
    // Wasserpflanzen und Seerosen am Bach
    for (let i = 1; i < 26; i++) {
      if (rand() < 0.45) continue;
      const t = i / 26, p = curve.getPoint(t), d = curve.getTangent(t);
      const side = rand() < 0.5 ? -1 : 1, off = rand() < 0.4 ? 0 : 0.6;
      const x = p.x - d.z * side * off, z = p.z + d.x * side * off;
      const g = model(off ? pick(rand, ['waterplant_A', 'waterplant_B', 'waterplant_C']) : pick(rand, ['waterlily_A', 'waterlily_B']), off ? rr(3.2, 4.4) : rr(4, 5.5));
      stand(ctx, g, x, z, { sink: off ? 0.05 : -0.04 });
    }
    // Windmühle als Wahrzeichen
    place(ctx, pick(rand, ['building_windmill_blue', 'building_windmill_red']), 3.8, { rMin: 6, rMax: R - 3, face: [0, 0] });
    // Dorfplatz: Brunnen in der Mitte, Häuser im Kreis, Blick zum Brunnen
    // freien Platz für das Dorf suchen, aber nur den Brunnen belegen (die Häuser stehen im Kreis darum)
    let vc = null;
    for (let i = 0; i < 80 && !vc; i++) {
      const a = rand() * TAU, r = rr(3.5, 8.5), x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (ctx.free(x, z, 5)) vc = [x, z];
    }
    if (vc) {
      reserve(vc[0], vc[1], 1.2);
      stand(ctx, model('building_well_blue', 3.2), vc[0], vc[1]);
      const houses = ['building_home_A_blue', 'building_home_B_red', 'building_home_A_green', 'building_home_B_yellow', 'building_home_A_red'];
      const a0 = rand() * TAU;
      for (let i = 0; i < 5; i++) {
        const a = a0 + (i / 5) * TAU, x = vc[0] + Math.cos(a) * 4.2, z = vc[1] + Math.sin(a) * 4.2;
        if (Math.hypot(x, z) > R - 2 || !ctx.free(x, z, 1.4)) continue;
        reserve(x, z, 1.6);
        stand(ctx, model(houses[i], 3.6), x, z, { face: vc });
      }
      // Marktstand und Kisten am Platz
      for (const [id, s, d] of [['building_market_red', 2.6, 2.4], ['barrel', 3.4, 1.4], ['crate_A_big', 3.4, 1.6], ['sack', 3.6, 1.2], ['crate_long_A', 3, 1.7], ['wheelbarrow', 3.2, 1.8]]) {
        const a = rand() * TAU, x = vc[0] + Math.cos(a) * d * 1.3, z = vc[1] + Math.sin(a) * d * 1.3;
        if (!ctx.free(x, z, 0.5)) continue;
        reserve(x, z, 0.6);
        stand(ctx, model(id, s), x, z, { face: vc });
      }
    }
    // Weizenfeld mit Holzzaun
    const field = ctx.spot(2.4, 5, R - 3);
    if (field) {
      stand(ctx, model('building_grain', 1.9), field[0], field[1], { sink: 0.02 });
      for (let i = 0; i < 3; i++) {
        const a = Math.atan2(field[1], field[0]) + (i - 1) * 0.55, r = Math.hypot(...field) + 2.4;
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        if (Math.hypot(x, z) < R - 1 && ctx.free(x, z, 0.3)) stand(ctx, model(i === 1 ? 'fence_wood_straight_gate' : 'fence_wood_straight', 2.2), x, z, { rot: -a });
      }
    }
    // Bäume einzeln und in Gruppen, Felsen
    scatterModels(ctx, 9, ['tree_single_A', 'tree_single_B'], 2.4, 3.2, { gap: 0.8 });
    scatterModels(ctx, 2, ['trees_B_small', 'trees_B_medium'], 2.2, 2.6, { rMin: R * 0.5, gap: 0.7 });
    scatterModels(ctx, 6, ['rock_single_A', 'rock_single_B', 'rock_single_C', 'rock_single_D', 'rock_single_E'], 2.6, 4, { gap: 0.8 });
    scatterModels(ctx, 3, ['tree_single_A_cut', 'tree_single_B_cut'], 3, 3.6);
    // Blumen bleiben selbstgebaut (das Paket hat keine)
    ctx.scatter(14, () => kit.flower(['#ff7a9a', '#ffe25f', '#ffffff', '#b07bff'][Math.floor(rand() * 4)]), 0.2);
  },
  backdrop(ctx) {
    mountainRing(ctx, ['mountain_A_grass_trees', 'mountain_B_grass_trees', 'mountain_C_grass_trees', 'hills_A_trees', 'hills_B_trees', 'hills_C_trees', 'mountain_B_grass']);
    floatingIsles(ctx); // Umgebung: schwebende Inseln und Brocken am Rand (Wolken malt das Himmelsbild)
    rockUnderside(ctx, ['rock_single_A', 'rock_single_B', 'rock_single_C', 'rock_single_D', 'rock_single_E']);
  },
};

// ── Wald: dichter Nadelwald, Sägemühle mit Holzlager, Zeltlager ──
const WALD = {
  landmark: true, // Riesenbaum mit Baumhaus aus planet1.js
  build(ctx, kit) {
    const { rand, rr, R, reserve } = ctx;
    // Sägemühle mit Holzstapeln und Stümpfen
    const mill = place(ctx, 'building_lumbermill_green', 3.4, { rMin: 5, rMax: R - 3, face: [0, 0] });
    if (mill) {
      const { x, z } = mill.position;
      for (const [id, s] of [['resource_lumber', 3.4], ['resource_lumber', 3.4], ['trees_A_cut', 2.2], ['wheelbarrow', 3.2], ['crate_long_B', 3]]) {
        const a = rand() * TAU, d = rr(3.2, 4.4), px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d;
        if (Math.hypot(px, pz) > R - 1.2 || !ctx.free(px, pz, 0.6)) continue;
        reserve(px, pz, 0.8);
        stand(ctx, model(id, s), px, pz);
      }
    }
    // Zeltlager mit Feuerholz und Zielscheibe
    const camp = ctx.spot(3.4, 4, R - 3);
    if (camp) {
      const a0 = rand() * TAU;
      [['tent', 3.2, 0], ['tent', 3.2, 1.8], ['barrel', 3.2, 3.4], ['sack', 3.6, 4.2], ['target', 3.4, 5.2], ['flag_green', 3.6, 2.6]].forEach(([id, s, k]) => {
        const a = a0 + k, x = camp[0] + Math.cos(a) * 2.2, z = camp[1] + Math.sin(a) * 2.2;
        if (Math.hypot(x, z) < R - 1.2) stand(ctx, model(id, s), x, z, { face: camp });
      });
      stand(ctx, model('resource_lumber', 2.4), camp[0], camp[1]);
    }
    // Wald: Baumgruppen und Einzelbäume, dazwischen Stümpfe, Felsen, Pilze
    scatterModels(ctx, 7, ['trees_A_large', 'trees_A_medium', 'trees_B_large', 'trees_B_medium'], 2.4, 3, { gap: 0.6 });
    scatterModels(ctx, 4, ['trees_A_small', 'trees_B_small'], 2.4, 2.8, { gap: 0.62 });
    scatterModels(ctx, 14, ['tree_single_A', 'tree_single_B'], 2.8, 3.8, { gap: 0.7 });
    scatterModels(ctx, 4, ['tree_single_A_cut', 'tree_single_B_cut'], 3, 3.8);
    scatterModels(ctx, 4, ['rock_single_B', 'rock_single_C', 'rock_single_E'], 2.6, 3.6);
    ctx.scatter(5, () => kit.mushroom(rr(0.35, 0.6), rand() < 0.5 ? '#e0433a' : '#c8a2ff', rand, true), 0.3);
  },
  backdrop(ctx) {
    mountainRing(ctx, ['mountain_A_grass_trees', 'mountain_B_grass_trees', 'mountain_C_grass_trees', 'hills_A_trees', 'hills_B_trees', 'hills_C_trees'], { n: 12 });
    // Umgebung: schwebende Waldinseln mit Tannengruppen, Felsunterseite, hängende Wurzeln (Wolken malt das Himmelsbild)
    floatingIsles(ctx, { far: 7, near: 6, tops: ['trees_A_large', 'trees_A_medium', 'trees_B_large', 'hills_B_trees'], small: ['trees_A_small', 'hill_single_C'] });
    rockUnderside(ctx, ['rock_single_B', 'rock_single_C', 'rock_single_E', 'rock_single_D']);
    hangingRoots(ctx, 26);
  },
};

// Gegenstände rund um einen Punkt verteilen (nur auf freien Plätzen innerhalb der Insel)
export function around(ctx, c, items, dMin = 2, dMax = 3.4) {
  const { rand, rr, R } = ctx;
  for (const [id, s] of items) {
    for (let tries = 0; tries < 8; tries++) {
      const a = rand() * TAU, d = rr(dMin, dMax), x = c[0] + Math.cos(a) * d, z = c[1] + Math.sin(a) * d;
      const g = model(id, s);
      if (Math.hypot(x, z) > R - 1.2 || !ctx.free(x, z, g.userData.radius * 0.8)) continue;
      ctx.reserve(x, z, g.userData.radius * 0.8);
      stand(ctx, g, x, z, { face: c });
      break;
    }
  }
}
// freien Platz mit Radius d suchen, aber nur die Mitte belegen (für Gruppen von Gegenständen)
export function clearing(ctx, d, rMin, rMax) {
  const { rand, rr } = ctx;
  for (let i = 0; i < 80; i++) {
    const a = rand() * TAU, r = rr(rMin, rMax), x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (ctx.free(x, z, d)) {
      ctx.reserve(x, z, 0.8);
      return [x, z];
    }
  }
  return null;
}

// ── Stadt: Straßenkreuz aus Straßenplatten, Häuserzeilen, Autos, Laternen, Ampeln ──
const STADT = {
  landmark: true, // Wolkenkratzer aus planet1.js
  build(ctx) {
    const { rand, rr, R, reserve } = ctx;
    const T = 3.2, S = T / 2; // Straßenplatte 2 Modell-Einheiten → 3,2 Einheiten
    const k = Math.floor((R - 2.2) / T);
    for (let i = -k; i <= k; i++)
      for (const axis of [0, 1]) {
        if (axis && i === 0) continue;
        const x = axis ? 0 : i * T, z = axis ? i * T : 0;
        const id = i === 0 ? 'city_road_junction' : Math.abs(i) === 2 ? 'city_road_straight_crossing' : 'city_road_straight';
        reserve(x, z, 1.7);
        stand(ctx, model(id, S), x, z, { rot: axis ? 0 : Math.PI / 2, sink: -0.02 });
      }
    // Häuserzeilen beidseits jeder Straße, Vorderseite zur Straße
    const houses = ['city_building_A', 'city_building_B', 'city_building_C', 'city_building_D', 'city_building_E', 'city_building_F', 'city_building_G', 'city_building_H'];
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]])
      for (const side of [-1, 1])
        for (let i = 1; i <= k; i++) {
          const along = i * T + 0.2, off = 3.7 * side;
          const x = dx * along + -dz * off, z = dz * along + dx * off;
          if (Math.hypot(x, z) > R - 2 || !ctx.free(x, z, 1.5)) continue;
          reserve(x, z, 1.7);
          stand(ctx, model(pick(rand, houses), 1.7), x, z, { face: [dx * along, dz * along], sink: 0.02 });
        }
    // Laternen am Straßenrand, Ampeln an der Kreuzung
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]])
      for (let i = 1; i <= k; i += 1) {
        const along = i * T - 1.2, side = i % 2 ? 1 : -1, x = dx * along - dz * 1.85 * side, z = dz * along + dx * 1.85 * side;
        if (Math.hypot(x, z) < R - 1.5) stand(ctx, model('city_streetlight', 2.6), x, z, { face: [dx * along, dz * along] });
      }
    for (const [x, z] of [[1.9, 1.9], [-1.9, 1.9], [1.9, -1.9], [-1.9, -1.9]]) stand(ctx, model('city_trafficlight_A', 2.6), x, z, { face: [0, 0] });
    // Autos auf den Fahrspuren
    const cars = ['city_car_hatchback', 'city_car_sedan', 'city_car_stationwagon', 'city_car_taxi', 'city_car_police'];
    for (let i = 0; i < 6; i++) {
      const axis = i % 2, along = (i < 3 ? 1 : -1) * rr(2.6, (k - 0.5) * T), lane = (rand() < 0.5 ? -1 : 1) * 0.75;
      const x = axis ? lane : along, z = axis ? along : lane;
      const dir = axis ? (lane > 0 ? 0 : Math.PI) : lane > 0 ? Math.PI / 2 : -Math.PI / 2;
      stand(ctx, model(cars[i % cars.length], 2), x, z, { rot: dir, sink: -0.06 });
    }
    // Kleinkram in freien Ecken: Hydranten, Bänke, Büsche im Topf, Container, Wasserturm, Bäume
    scatterModels(ctx, 4, ['city_firehydrant'], 2.6, 2.6, { gap: 1 });
    scatterModels(ctx, 4, ['city_bench'], 2.6, 2.6, { gap: 1 });
    scatterModels(ctx, 6, ['city_bush'], 2.6, 3, { gap: 1 });
    scatterModels(ctx, 2, ['city_dumpster', 'city_box_A', 'city_trash_A'], 2.6, 2.6, { gap: 1 });
    place(ctx, 'city_watertower', 3.2, { rMin: 4, rMax: R - 2 });
    scatterModels(ctx, 6, ['tree_single_B', 'tree_single_A'], 2.2, 2.8, { gap: 0.8 });
  },
  backdrop(ctx, kit) {
    planet1Backdrop(ctx, kit); // Skyline mit Warnlichtern in der Ferne
    // Umgebung: schwebende Häuserinseln, Felsunterseite mit Rohren und Lampen (Wolken malt das Himmelsbild)
    floatingIsles(ctx, { far: 6, near: 5, tops: ['city_building_C', 'city_building_D', 'city_building_G', 'city_building_H', 'city_building_E'], small: ['hill_single_A', 'hill_single_C'], farW: [3.2, 4.6], farR: [18, 32] });
    rockUnderside(ctx, ['rock_single_A', 'rock_single_B', 'rock_single_C', 'rock_single_E']);
    undersideLights(ctx, 16);
  }
};

// ── Eis: verschneiter Tannenwald, Wachturm, Zeltlager mit Laternen ──
const EIS = {
  landmark: true, // Eispalast
  keepBase: true, // Iglu, Kristalle, Schneemann, gefrorener See
  baseSpots: [[-1.5, -1, 1.5], [1.8, 1.4, 0.7], [1.6, -2, 1.4]],
  build(ctx) {
    const { R } = ctx;
    place(ctx, 'building_tower_A_blue@eis', 3.6, { rMin: 6, rMax: R - 3, face: [0, 0] });
    const camp = clearing(ctx, 3.2, 4, R - 3);
    if (camp) {
      stand(ctx, model('resource_lumber', 2.4), camp[0], camp[1]);
      around(ctx, camp, [['tent', 3.2], ['tent', 3.2], ['lantern_standing', 0.9], ['crate_A_big', 3.2], ['barrel', 3.2], ['sack', 3.4]], 1.8, 2.8);
    }
    scatterModels(ctx, 6, ['trees_A_large@eis', 'trees_A_medium@eis', 'trees_A_small@eis'], 2.3, 2.8, { gap: 0.6 });
    scatterModels(ctx, 10, ['tree_single_A@eis', 'tree_single_B@eis'], 2.6, 3.4, { gap: 0.75 });
    scatterModels(ctx, 6, ['rock_single_A@eis', 'rock_single_B@eis', 'rock_single_C@eis', 'rock_single_E@eis'], 2.6, 4, { gap: 0.8 });
  },
  backdrop(ctx) {
    mountainRing(ctx, ['mountain_A_grass_trees@eis', 'mountain_B_grass_trees@eis', 'mountain_C_grass_trees@eis', 'hills_A_trees@eis', 'hills_B_trees@eis', 'mountain_B_grass@eis']);
    // Umgebung: schwebende Eisschollen mit verschneiten Tannen, bläuliche Felsunterseite mit Eiszapfen
    floatingIsles(ctx, { far: 7, near: 6, tops: ['hills_A_trees@eis', 'hills_B_trees@eis', 'trees_A_medium@eis', 'mountain_B_grass@eis'], small: ['rock_single_C@eis', 'trees_A_small@eis'], rock: 'rock_single_B@eis' });
    rockUnderside(ctx, ['rock_single_A@eis', 'rock_single_B@eis', 'rock_single_C@eis', 'rock_single_E@eis']);
    icicles(ctx, 34);
  },
};

// ── Lava: Schmiede am Vulkan, Ruinen, verkohlte Bäume, Fackeln, Schatztruhe ──
const LAVA = {
  landmark: true, // Lavatempel
  keepBase: true, // Vulkan mit Lavastrom und Lavaseen
  baseSpots: [[-0.8, -0.6, 3], [2.8, 2.2, 0.9], [-3, 2.4, 0.9], [1.2, -3.4, 0.9], [-3.6, -1.6, 0.9], [2.2, -0.4, 1.2]],
  build(ctx) {
    const { R } = ctx;
    const forge = place(ctx, 'building_blacksmith_red', 3.6, { rMin: 5, rMax: R - 3, face: [0, 0] });
    if (forge) around(ctx, [forge.position.x, forge.position.z], [['barrel_large', 0.7], ['keg', 0.7], ['torch_lit', 1.6], ['torch_lit', 1.6], ['crates_stacked', 0.7]], 2.6, 3.6);
    const ruin = place(ctx, 'building_destroyed@lava', 3.4, { rMin: 5, rMax: R - 3 });
    if (ruin) around(ctx, [ruin.position.x, ruin.position.z], [['rubble_large', 0.45], ['rubble_half', 0.6], ['chest_gold', 0.8], ['torch_lit', 1.6]], 2.4, 3.6);
    scatterModels(ctx, 7, ['tree_dead_large', 'tree_dead_medium', 'tree_dead_small'], 0.55, 0.75, { gap: 0.8 });
    scatterModels(ctx, 2, ['tree_single_A@lava'], 2.6, 3.2, { gap: 0.8 });
    scatterModels(ctx, 3, ['rubble_half'], 0.35, 0.5, { gap: 0.8 });
    scatterModels(ctx, 9, ['rock_single_A@lava', 'rock_single_B@lava', 'rock_single_C@lava', 'rock_single_D@lava', 'rock_single_E@lava'], 2.8, 4.4, { gap: 0.8 });
    scatterModels(ctx, 3, ['mountain_A@lava', 'mountain_C@lava'], 1.6, 2.2, { rMin: R * 0.55, gap: 0.7 });
  },
  backdrop(ctx, kit) {
    // keine gestuften Vulkane aus planet1.js: die Fernkulisse von WorldFx hat schon Vulkane
    void kit;
    // Umgebung: schwebende Vulkanbrocken, Basaltunterseite mit Lavatropfen (Glutmeer siehe skyboxes.js)
    floatingIsles(ctx, { far: 7, near: 6, tops: ['mountain_A@lava', 'mountain_C@lava', 'hills_A@lava', 'rock_single_D@lava'], small: ['rock_single_C@lava', 'rock_single_E@lava'], rock: 'rock_single_B@lava' });
    rockUnderside(ctx, ['rock_single_A@lava', 'rock_single_B@lava', 'rock_single_C@lava', 'rock_single_D@lava', 'rock_single_E@lava']);
    icicles(ctx, 18, { color: '#ff6a1a', glow: true });
  }
};

// ── Höhle: Mine mit Lager, Säulenruinen, Fackeln, Schatztruhen zwischen den Kristallen ──
const HOEHLE = {
  landmark: true, // Riesenkristall
  keepBase: true, // Felsbogen, Kristalle, Tropfsteine, Leuchtpilze
  baseSpots: [[4.6, -0.6, 1.3], [-4.6, -0.6, 1.3], [0, -0.6, 1.2]],
  build(ctx) {
    const { R } = ctx;
    const mine = place(ctx, 'building_mine_blue@hoehle', 3.6, { rMin: 6, rMax: R - 3, face: [0, 0] });
    if (mine) around(ctx, [mine.position.x, mine.position.z], [['crates_stacked', 0.7], ['barrel_large', 0.7], ['torch_lit', 1.6], ['torch_lit', 1.6], ['chest_gold', 0.8], ['box_stacked', 0.6]], 2.8, 4);
    // Ruinenhalle: vier Säulen im Quadrat, in der Mitte eine Truhe zwischen Kerzen
    const hall = clearing(ctx, 3, 4, R - 3);
    if (hall) {
      for (const [ox, oz] of [[1.6, 1.6], [-1.6, 1.6], [1.6, -1.6], [-1.6, -1.6]]) stand(ctx, model(ox * oz > 0 ? 'pillar_decorated' : 'pillar', 0.75), hall[0] + ox, hall[1] + oz, { face: hall });
      stand(ctx, model('chest_gold', 0.85), hall[0], hall[1]);
      around(ctx, hall, [['candle_triple', 1.4], ['candle_triple', 1.4], ['rubble_half', 0.5]], 0.9, 1.4);
    }
    scatterModels(ctx, 3, ['mountain_A@hoehle', 'mountain_C@hoehle'], 1.6, 2.2, { rMin: R * 0.55, gap: 0.7 });
    scatterModels(ctx, 8, ['rock_single_A@hoehle', 'rock_single_B@hoehle', 'rock_single_C@hoehle', 'rock_single_D@hoehle', 'rock_single_E@hoehle'], 2.8, 4.4, { gap: 0.8 });
    scatterModels(ctx, 5, ['torch_lit'], 1.6, 1.6, { gap: 1 });
    scatterModels(ctx, 3, ['lantern_standing'], 0.9, 0.9, { gap: 1 });
  },
  backdrop(ctx, kit) {
    // keine Felssäulen aus planet1.js: sie standen direkt vor der Insel und verdeckten die Sicht
    // Umgebung: schwebende Felsbrocken mit Kristallen, violette Felsunterseite mit Kristallspitzen
    floatingIsles(ctx, { far: 6, near: 6, tops: ['mountain_A@hoehle', 'mountain_C@hoehle', 'rock_single_D@hoehle'], small: ['rock_single_C@hoehle', 'rock_single_E@hoehle'], rock: 'rock_single_B@hoehle' });
    rockUnderside(ctx, ['rock_single_A@hoehle', 'rock_single_B@hoehle', 'rock_single_C@hoehle', 'rock_single_D@hoehle', 'rock_single_E@hoehle']);
    hangingCrystals(ctx, kit, 22, ['#b07bff', '#6ae8ff', '#ff7ae0']);
  }
};

// ── Candy: Lebkuchendorf mit Zuckerguss, Pastellbäume ──
const CANDY = {
  landmark: true, // Zuckerschloss
  keepBase: true, // Lollis, Zuckerstangen, Donuts, Gummibärchen
  build(ctx, kit) {
    const { rand, R } = ctx;
    place(ctx, 'building_windmill_red@candy', 3.6, { rMin: 6, rMax: R - 3, face: [0, 0] });
    const vc = clearing(ctx, 4.4, 4, 9);
    if (vc) {
      stand(ctx, model('building_well_blue@candy', 3.2), vc[0], vc[1]);
      const a0 = rand() * TAU;
      ['building_home_A_red@candy', 'building_home_B_red@candy', 'building_home_A_red@candy', 'building_home_B_red@candy'].forEach((id, i) => {
        const a = a0 + (i / 4) * TAU, x = vc[0] + Math.cos(a) * 4, z = vc[1] + Math.sin(a) * 4;
        if (Math.hypot(x, z) > R - 2 || !ctx.free(x, z, 1.4)) return;
        ctx.reserve(x, z, 1.6);
        stand(ctx, model(id, 3.6), x, z, { face: vc });
      });
      around(ctx, vc, [['fence_wood_straight@candy', 2.2], ['fence_wood_straight@candy', 2.2]], 2.2, 2.8);
    }
    scatterModels(ctx, 4, ['trees_B_small@candy', 'trees_B_medium@candy'], 2.2, 2.6, { gap: 0.62 });
    scatterModels(ctx, 9, ['tree_single_A@candy', 'tree_single_B@candy'], 2.4, 3.2, { gap: 0.75 });
    scatterModels(ctx, 4, ['rock_single_C@candy'], 3, 4, { gap: 0.8 });
    void kit;
  },
  backdrop(ctx, kit) {
    planet1Backdrop(ctx, kit); // Eisberge (Waffel und Kugeln) in der Ferne
    // Umgebung: schwebende Pastellinseln mit Bäumen, Felsunterseite, Zuckergusstropfen am Rand
    floatingIsles(ctx, { far: 7, near: 6, tops: ['hills_A_trees@candy', 'hills_B_trees@candy', 'trees_B_medium@candy'], small: ['rock_single_C@candy', 'tree_single_A@candy'], rock: 'rock_single_C@candy' });
    rockUnderside(ctx, ['rock_single_C@candy']);
    frostingDrips(ctx, 30, ['#ff8ac8', '#ffffff', '#8ad8ff', '#fff28a']);
  }
};

// ── Planet 2: Weltraumbasen aus Space Base Bits; Felsen und Geländeblöcke je Planet umgefärbt (@mond …) ──
// Felsen und Tafelberge in der Ferne, aus dem Nebelmeer ragend
function spaceBackdrop(ctx, v) {
  const sfx = v ? '@' + v : '';
  mountainRing(ctx, [`rocks_B${sfx}`], { n: 8, sMin: 10, sMax: 15, rMin: 52, rMax: 68, base: -26 });
  mountainRing(ctx, [`rock_B${sfx}`, `rock_A${sfx}`], { n: 6, sMin: 24, sMax: 34, rMin: 56, rMax: 70, base: -26 });
}
// Station: Module in einer Reihe, verbunden durch Röhren
function station(ctx, c, modules, s = 3, dir = null) {
  const a = dir ?? ctx.rand() * TAU, dx = Math.cos(a), dz = Math.sin(a);
  const step = 2.35 * s;
  modules.forEach((id, i) => {
    const off = (i - (modules.length - 1) / 2) * step;
    const x = c[0] + dx * off, z = c[1] + dz * off;
    if (Math.hypot(x, z) > ctx.R - 2) return;
    ctx.reserve(x, z, 1.1 * s);
    stand(ctx, model(id, s), x, z, { rot: -a + Math.PI / 2 });
    if (i < modules.length - 1) {
      const tx = x + dx * step / 2, tz = z + dz * step / 2;
      if (Math.hypot(tx, tz) < ctx.R - 2) stand(ctx, model('tunnel_straight_A', s * 0.55), tx, tz, { rot: -a });
    }
  });
}
function rocksOf(ctx, v, n = 7) {
  const sfx = v ? '@' + v : '';
  scatterModels(ctx, n, [`rock_A${sfx}`, `rock_B${sfx}`, `rocks_A${sfx}`], 2.6, 4, { gap: 0.8 });
  scatterModels(ctx, 3, [`rocks_B${sfx}`], 1.4, 1.9, { rMin: ctx.R * 0.55, gap: 0.75 });
}

const MOND = {
  landmark: true, // Rakete auf der Startrampe
  keepBase: true, // Erde am Himmel, Krater, Flagge, Landefähre
  baseSpots: [[0.6, 0.4, 0.6], [-2, -1.6, 1.3]],
  build(ctx) {
    const { R } = ctx;
    const base = clearing(ctx, 6, 5, R - 4);
    if (base) station(ctx, base, ['basemodule_A', 'basemodule_E', 'basemodule_garage']);
    const pad = place(ctx, 'landingpad_large', 2.6, { rMin: 4, rMax: R - 3 });
    if (pad) stand(ctx, model('lander_A', 2.6), pad.position.x, pad.position.z, { sink: -1.2 });
    const solar = clearing(ctx, 3, 4, R - 3);
    if (solar) around(ctx, solar, [['solarpanel', 2.6], ['solarpanel', 2.6], ['solarpanel', 2.6], ['space_lights', 2.4]], 1.4, 2.4);
    scatterModels(ctx, 3, ['cargo_A_stacked', 'cargo_B_stacked', 'spacetruck'], 2.4, 2.8, { gap: 0.9 });
    rocksOf(ctx, 'mond');
  },
  backdrop(ctx) {
    spaceBackdrop(ctx, 'mond');
    // Umgebung: schwebende Mondbrocken, Felsunterseite aus grauem Mondgestein (Sterne malt das Himmelsbild)
    floatingIsles(ctx, { far: 7, near: 7, tops: ['rocks_B@mond', 'rocks_A@mond', 'rock_B@mond'], small: ['rock_A@mond', 'rock_B@mond'], rock: 'rock_A@mond' });
    rockUnderside(ctx, ['rock_A@mond', 'rock_B@mond']);
  },
};

const NEPTUN = {
  landmark: true, // Eisturm mit Ringen
  keepBase: true, // Sturmwirbel, Kristalle, Geysire
  baseSpots: [[0, 0, 1.3]],
  build(ctx) {
    const { R } = ctx;
    const base = clearing(ctx, 5, 5, R - 4);
    if (base) station(ctx, base, ['basemodule_E', 'basemodule_C']);
    scatterModels(ctx, 3, ['windturbine_tall', 'windturbine_low'], 2.4, 2.8, { rMin: 4, gap: 0.8 });
    scatterModels(ctx, 2, ['structure_tall'], 2.4, 2.4, { gap: 0.9 });
    scatterModels(ctx, 3, ['containers_B', 'cargo_B', 'space_lights'], 2.6, 2.6, { gap: 1 });
    rocksOf(ctx, 'neptun');
  },
  backdrop(ctx) {
    spaceBackdrop(ctx, 'neptun');
    // Umgebung: schwebende Eisbrocken, Unterseite aus blauem Eisgestein mit Eiszapfen
    floatingIsles(ctx, { far: 7, near: 7, tops: ['rocks_B@neptun', 'rocks_A@neptun', 'rock_B@neptun'], small: ['rock_A@neptun', 'rock_B@neptun'], rock: 'rock_A@neptun' });
    rockUnderside(ctx, ['rock_A@neptun', 'rock_B@neptun']);
    icicles(ctx, 26, { color: '#9fe0ff' });
  },
};

const MARS = {
  landmark: true, // Radarschüssel mit Solarfeld
  keepBase: true, // Rover, Kuppeln, Flagge, Phobos am Himmel
  baseSpots: [[1.6, 1.2, 1.1], [-2.6, -1, 2.8], [0.4, -2.8, 0.6]],
  build(ctx) {
    const { R } = ctx;
    // Abbaugrube: der Geländeblock steckt im Boden, nur der Rand mit der Grube schaut heraus
    const mine = place(ctx, 'terrain_mining', 1.8, { rMin: 5, rMax: R - 3, sink: 3.3 });
    if (mine) {
      stand(ctx, model('drill_structure', 2.6), mine.position.x, mine.position.z, { sink: -0.3 });
      around(ctx, [mine.position.x, mine.position.z], [['spacetruck_large', 2.6], ['spacetruck_trailer', 2.6], ['cargo_A_stacked', 2.6]], 2.8, 3.8);
    }
    const base = clearing(ctx, 4.6, 4, R - 4);
    if (base) station(ctx, base, ['basemodule_B', 'basemodule_D'], 2.8);
    const pad = place(ctx, 'landingpad_small', 2.6, { rMin: 4, rMax: R - 3 });
    if (pad) stand(ctx, model('lander_B', 2.6), pad.position.x, pad.position.z, { sink: -1.2 });
    scatterModels(ctx, 2, ['roofmodule_solarpanels'], 2.6, 2.6, { gap: 0.9 });
    rocksOf(ctx, null, 9);
  },
  backdrop(ctx) {
    spaceBackdrop(ctx, null);
    // Umgebung: schwebende rote Felsbrocken, Unterseite aus rotem Gestein (Staubdünen siehe skyboxes.js)
    floatingIsles(ctx, { far: 7, near: 7, tops: ['rocks_B', 'rocks_A', 'rock_B'], small: ['rock_A', 'rock_B'], rock: 'rock_A' });
    rockUnderside(ctx, ['rock_A', 'rock_B']);
  },
};

const SATURN = {
  landmark: true, // Sternwarte
  keepBase: true, // Ring um die Insel, Obsidian, Kristalle
  build(ctx) {
    const { R } = ctx;
    // Handelsposten: drei Frachtlager um einen Landeplatz
    const hub = clearing(ctx, 6, 4, R - 5);
    if (hub) {
      stand(ctx, model('landingpad_large', 2.6), hub[0], hub[1]);
      stand(ctx, model('lander_base', 2.4), hub[0], hub[1], { sink: -1.2 });
      around(ctx, hub, [['cargodepot_A', 2.6], ['cargodepot_B', 2.6], ['cargodepot_C', 2.6], ['containers_A', 2.6], ['containers_C', 2.6]], 4.2, 5.4);
    }
    scatterModels(ctx, 2, ['structure_low', 'space_lights'], 2.4, 2.6, { gap: 0.9 });
    rocksOf(ctx, 'saturn');
  },
  backdrop(ctx) {
    spaceBackdrop(ctx, 'saturn');
    // Umgebung: schwebende goldene Felsbrocken, Unterseite aus Sandstein (Ringe malt das Himmelsbild)
    floatingIsles(ctx, { far: 7, near: 7, tops: ['rocks_B@saturn', 'rocks_A@saturn', 'rock_B@saturn'], small: ['rock_A@saturn', 'rock_B@saturn'], rock: 'rock_A@saturn' });
    rockUnderside(ctx, ['rock_A@saturn', 'rock_B@saturn']);
  },
};

const ALIEN = {
  landmark: true, // Alien-Tor
  keepBase: true, // UFO, leuchtende Pflanzen, Kapseln
  build(ctx) {
    const { R } = ctx;
    // Forschungslager der Menschen, die die Aliens beobachten
    const camp = clearing(ctx, 5, 5, R - 4);
    if (camp) {
      station(ctx, camp, ['basemodule_C', 'basemodule_A']);
      around(ctx, camp, [['structure_low', 2.4], ['space_lights', 2.4], ['roofmodule_cargo_B', 2.4]], 4, 5);
    }
    const pad = place(ctx, 'landingpad_small', 2.6, { rMin: 4, rMax: R - 3 });
    if (pad) stand(ctx, model('lander_A', 2.6), pad.position.x, pad.position.z, { sink: -1.2 });
    rocksOf(ctx, 'alien');
  },
  backdrop(ctx) {
    spaceBackdrop(ctx, 'alien');
    // Umgebung: schwebende violette Felsbrocken, Felsunterseite, leuchtende Alien-Ranken am Rand
    floatingIsles(ctx, { far: 7, near: 7, tops: ['rocks_B@alien', 'rocks_A@alien', 'rock_B@alien'], small: ['rock_A@alien', 'rock_B@alien'], rock: 'rock_A@alien' });
    rockUnderside(ctx, ['rock_A@alien', 'rock_B@alien']);
    hangingRoots(ctx, 28, { color: '#2a6a4a', tip: '#7aff5a', glow: true, outer: true });
  },
};

const SONNE = {
  landmark: true, // Sonnentempel
  keepBase: true, // Sonne am Himmel, Sonnenbögen, Dampf, Glutkristalle
  baseSpots: [[2.4, 1.6, 1.6], [-2.6, 1.2, 1.6], [1, -3, 1.6], [-1.6, -2.8, 1.6]],
  build(ctx) {
    const { R } = ctx;
    // Sonnenkraftwerk: Reihen von Solarpaneelen und zwei Masten
    const plant = clearing(ctx, 5, 5, R - 4);
    if (plant) {
      const a = Math.atan2(plant[1], plant[0]);
      for (let i = -2; i <= 2; i++)
        for (const j of [-1, 1]) {
          const x = plant[0] + Math.cos(a) * j * 1.6 - Math.sin(a) * i * 1.9, z = plant[1] + Math.sin(a) * j * 1.6 + Math.cos(a) * i * 1.9;
          if (Math.hypot(x, z) < R - 1.6 && ctx.free(x, z, 0.6)) stand(ctx, model('solarpanel', 2.4), x, z, { rot: a + Math.PI / 2 });
        }
      around(ctx, plant, [['structure_tall', 2.4], ['structure_tall', 2.4], ['space_lights', 2.4]], 4, 5.2);
    }
    scatterModels(ctx, 2, ['roofmodule_solarpanels'], 2.6, 2.6, { gap: 0.9 });
    rocksOf(ctx, 'sonne');
  },
  backdrop(ctx) {
    spaceBackdrop(ctx, 'sonne');
    // Umgebung: schwebende glühende Felsbrocken, Felsunterseite mit Glut-Tropfen (Plasmameer siehe skyboxes.js)
    floatingIsles(ctx, { far: 7, near: 7, tops: ['rocks_B@sonne', 'rocks_A@sonne', 'rock_B@sonne'], small: ['rock_A@sonne', 'rock_B@sonne'], rock: 'rock_A@sonne' });
    rockUnderside(ctx, ['rock_A@sonne', 'rock_B@sonne']);
    icicles(ctx, 22, { color: '#ffb02e', glow: true });
  },
};

// ── Planet 3 unter Wasser: Felsen in Meeresfarben (@meer), Wasserpflanzen, Schätze, Ruinen ──
// Seetang-Felder aus den Wasserpflanzen des Pakets, groß gezogen
function seaweedBeds(ctx, n) {
  for (let i = 0; i < n; i++) {
    const c = clearing(ctx, 1.4, 2, ctx.R - 1.5);
    if (!c) continue;
    for (let j = 0; j < 4; j++) {
      const a = ctx.rand() * TAU, d = ctx.rr(0.2, 1.1);
      stand(ctx, model(pick(ctx.rand, ['waterplant_A@meer', 'waterplant_B@meer', 'waterplant_C@meer']), ctx.rr(6, 9)), c[0] + Math.cos(a) * d, c[1] + Math.sin(a) * d);
    }
  }
}
function seaRocks(ctx, n = 7) {
  scatterModels(ctx, n, ['rock_single_A@meer', 'rock_single_B@meer', 'rock_single_C@meer', 'rock_single_D@meer', 'rock_single_E@meer'], 2.8, 4.6, { gap: 0.8 });
  scatterModels(ctx, 2, ['mountain_A@meer', 'mountain_C@meer'], 1.3, 1.8, { rMin: ctx.R * 0.6, gap: 0.7 });
}

const KORALLENRIFF = {
  landmark: true, // Korallenturm
  keepBase: true, // Wrack, Korallenbogen, Korallen, Fische
  build(ctx) {
    const { R } = ctx;
    // Schatzplatz: offene Truhe zwischen Fässern und Kisten, wie aus dem Wrack gespült
    const loot = clearing(ctx, 2.6, 4, R - 3);
    if (loot) {
      stand(ctx, model('chest_gold', 0.85), loot[0], loot[1]);
      around(ctx, loot, [['barrel_large', 0.6], ['crates_stacked', 0.6], ['trunk_large_A', 0.7], ['barrel', 3]], 1.4, 2.4);
    }
    seaweedBeds(ctx, 5);
    seaRocks(ctx);
  },
  backdrop(ctx) {
    // Umgebung: schwebende Riff-Felsen mit Seetang, Felsunterseite in Meeresfarben, Seetang hängt vom Rand
    floatingIsles(ctx, { far: 6, near: 7, tops: ['mountain_A@meer', 'mountain_C@meer', 'rock_single_D@meer'], small: ['rock_single_C@meer', 'waterplant_B@meer'], rock: 'rock_single_B@meer' });
    rockUnderside(ctx, ['rock_single_A@meer', 'rock_single_B@meer', 'rock_single_C@meer', 'rock_single_D@meer', 'rock_single_E@meer']);
    hangingRoots(ctx, 30, { color: '#2f8a5a', tip: '#5affc8', outer: true });
  }
};

const MUSCHELLAND = {
  landmark: true, // Riesen-Perlmuschel
  keepBase: true, // Muschelhaus, Perlenbrunnen, Muscheln, Seesterne
  build(ctx) {
    const { R } = ctx;
    // Felsentor aus Stein mit Laternen davor
    const gate = place(ctx, 'arch', 0.75, { rMin: 5, rMax: R - 3, face: [0, 0] });
    if (gate) around(ctx, [gate.position.x, gate.position.z], [['lantern_standing', 0.9], ['lantern_standing', 0.9], ['chest_gold', 0.7]], 2.4, 3.2);
    seaweedBeds(ctx, 4);
    seaRocks(ctx, 8);
  },
  backdrop(ctx) {
    // Umgebung: schwebende Muschelfelsen, Felsunterseite in Meeresfarben, Perlenschnüre am Rand
    floatingIsles(ctx, { far: 6, near: 7, tops: ['mountain_C@meer', 'mountain_A@meer', 'rock_single_D@meer'], small: ['rock_single_C@meer', 'rock_single_E@meer'], rock: 'rock_single_B@meer' });
    rockUnderside(ctx, ['rock_single_A@meer', 'rock_single_B@meer', 'rock_single_C@meer', 'rock_single_D@meer', 'rock_single_E@meer']);
    pearlStrings(ctx, 26);
  }
};

const ATLANTIS = {
  landmark: true, // Dreizack-Denkmal
  keepBase: true, // Palast mit Säulenallee, Tempel
  build(ctx) {
    const { R } = ctx;
    // Ruinenfeld: Säulen (manche verziert), Trümmer, ein Tor mit Gitter, ein Schrein mit Laternen
    scatterModels(ctx, 6, ['pillar', 'pillar_decorated', 'column'], 0.7, 0.85, { rMin: 4, gap: 0.9 });
    scatterModels(ctx, 4, ['rubble_half', 'rubble_large'], 0.35, 0.5, { rMin: 4, gap: 0.8 });
    const gate = place(ctx, 'arch_gate', 0.75, { rMin: 6, rMax: R - 3, face: [0, 0] });
    const shrine = place(ctx, 'shrine', 0.9, { rMin: 4, rMax: R - 3, face: [0, 0] });
    if (shrine) around(ctx, [shrine.position.x, shrine.position.z], [['lantern_standing', 0.9], ['lantern_standing', 0.9], ['chest_gold', 0.75]], 1.6, 2.4);
    void gate;
    seaweedBeds(ctx, 3);
    seaRocks(ctx, 5);
  },
  backdrop(ctx) {
    // Umgebung: schwebende Ruinenfelsen mit Säulen, Felsunterseite, leuchtende Runensteine am Rand
    floatingIsles(ctx, { far: 6, near: 6, tops: ['mountain_A@meer', 'column', 'rock_single_D@meer', 'column'], small: ['pillar', 'rock_single_C@meer'], rock: 'rock_single_B@meer', farW: [4, 6.5] });
    rockUnderside(ctx, ['rock_single_A@meer', 'rock_single_B@meer', 'rock_single_C@meer', 'rock_single_D@meer', 'rock_single_E@meer']);
    runeStones(ctx, 14);
    icicles(ctx, 16, { color: '#5affd8', glow: true });
  }
};

// ── Spawn: die Münzstadt bleibt; Modelle füllen nur freie Plätze (Bäume im äußeren Ring, Marktkram, Laternen) ──
const SPAWN = {
  landmark: true,
  keepBase: true,
  after: true,
  build(ctx) {
    const { R } = ctx;
    scatterModels(ctx, 14, ['tree_single_A', 'tree_single_B'], 2.2, 2.8, { rMin: 11, rMax: R - 1.4, gap: 0.7 });
    scatterModels(ctx, 3, ['trees_B_small'], 2, 2.2, { rMin: 11, rMax: R - 1.6, gap: 0.65 });
    scatterModels(ctx, 6, ['post_lantern'], 0.8, 0.8, { rMin: 5.6, rMax: 9.4, gap: 1 });
    scatterModels(ctx, 8, ['barrel', 'crate_A_big', 'sack', 'crate_long_C', 'bucket_water'], 3, 3.4, { rMin: 5.6, rMax: 13, gap: 1 });
    scatterModels(ctx, 4, ['rock_single_A', 'rock_single_C', 'rock_single_E'], 2.6, 3.4, { rMin: 11, rMax: R - 1.4, gap: 0.8 });
  },
};

export const MODEL_WORLDS = { normal: NORMAL, wald: WALD, stadt: STADT, eis: EIS, lava: LAVA, hoehle: HOEHLE, candy: CANDY, mond: MOND, neptun: NEPTUN, mars: MARS, saturn: SATURN, alien: ALIEN, sonne: SONNE, korallenriff: KORALLENRIFF, muschelland: MUSCHELLAND, atlantis: ATLANTIS, spawn: SPAWN };
