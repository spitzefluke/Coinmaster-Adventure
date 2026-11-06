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
function place(ctx, id, s, { rMin = 0, rMax = ctx.R - 1, face = null, sink = 0.08, gap = 0.9 } = {}) {
  const g = model(id, s);
  const p = ctx.spot(g.userData.radius * gap, rMin, rMax);
  if (!p) return null;
  return stand(ctx, g, p[0], p[1], { face, sink });
}
function stand(ctx, g, x, z, { face = null, sink = 0.08, rot = null, origin = false } = {}) {
  // origin: Nullpunkt des Modells auf den Boden (Brücke: der Bogen reicht ins Wasser), sonst die Unterseite
  ctx.put(g, x, z, { rot: false, sink: origin ? sink : sink + g.userData.base });
  g.rotation.y = rot ?? (face ? Math.atan2(face[0] - x, face[1] - z) : ctx.rand() * TAU);
  return g;
}
function scatterModels(ctx, n, ids, sMin, sMax, opts = {}) {
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
    cloudRing(ctx);
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
    cloudRing(ctx, 5);
  },
};

// Gegenstände rund um einen Punkt verteilen (nur auf freien Plätzen innerhalb der Insel)
function around(ctx, c, items, dMin = 2, dMax = 3.4) {
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
function clearing(ctx, d, rMin, rMax) {
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
    cloudRing(ctx, 6);
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
};

export const MODEL_WORLDS = { normal: NORMAL, wald: WALD, stadt: STADT, eis: EIS, lava: LAVA, hoehle: HOEHLE, candy: CANDY };
