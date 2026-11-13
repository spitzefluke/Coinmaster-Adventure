// Neue Welten aus dem Weltkarten-Design: Tiefseegraben (Planet 3) und Planet 4 „Himmelreich“ mit Wolkenburg,
// Engelsgarten und Götterthron. Jede Welt hat ein großes Wahrzeichen, Wege mit Münz-Lichtungen, Deko aus den
// CC0-Modellen (KayKit) und eigenen Bausteinen, bewegte Teile, Partikel und Plätze für Klänge.
// Einheiten der Webseite (1 Einheit = 8 Studs), Inselradius R = 16.

import * as THREE from 'three';
import { paths } from './planet1.js';
import { model, stand, scatterModels, around, clearing } from './modelWorlds.js';

const TAU = Math.PI * 2;

const PATHS = {
  tiefseegraben: { color: '#3a4652', kind: 'stone', glow: '#5affd8' },
  wolkenburg: { color: '#f4f0ff', kind: 'tile', edge: '#ffd76a' },
  engelsgarten: { color: '#f8f4ea', kind: 'stone' },
  goetterthron: { color: '#ffe7a8', kind: 'tile', edge: '#fff8e0' },
};

// ── kleine Bausteine ──
function gold(M) {
  return M('#ffcf4a', { metalness: 0.7, roughness: 0.3, emissive: '#b8860b', emissiveIntensity: 0.25 });
}
function cloudPuff(kit, rand, s = 1, c = '#ffffff') {
  const { M, at, group } = kit;
  const parts = [];
  for (let i = 0; i < 4; i++) {
    const r = s * (0.5 + rand() * 0.3);
    parts.push(at(new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), M(c, { roughness: 1 })), (i - 1.5) * s * 0.55, r * 0.6 + rand() * 0.1 * s, (rand() - 0.5) * s * 0.5));
  }
  return group(...parts);
}
// weißer Baum mit goldenem Laub
function goldTree(kit, rand, h) {
  const { M, E, at, group } = kit;
  const trunkM = M('#f4f0ea');
  const g = group(at(new THREE.Mesh(new THREE.CylinderGeometry(h * 0.05, h * 0.08, h * 0.55, 7), trunkM), 0, h * 0.27, 0));
  for (const s of [-1, 1]) {
    const b = at(new THREE.Mesh(new THREE.CylinderGeometry(h * 0.025, h * 0.035, h * 0.3, 5), trunkM), s * h * 0.09, h * 0.55, 0);
    b.rotation.z = -s * 0.6;
    g.add(b);
  }
  const leaf = E('#ffd76a', 0.35, { metalness: 0.4, roughness: 0.4 });
  for (let i = 0; i < 3; i++) {
    const r = h * (0.26 - i * 0.04);
    const ball = at(new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), leaf), (rand() - 0.5) * h * 0.3, h * (0.68 + i * 0.13), (rand() - 0.5) * h * 0.3);
    ball.rotation.set(rand() * 3, rand() * 3, 0);
    ball.userData.rbx = { facets: true, facetThick: Math.min(0.15, r * 0.15), name: 'Goldlaub' }; // kantige Krone wie die Laubbäume
    g.add(ball);
  }
  return g;
}

// ── Tiefseegraben ──
const TIEFSEEGRABEN = {
  build(ctx, kit) {
    const { M, E, at, group } = kit;
    const { rand, rr, R, anims, put, spot, scatter } = ctx;
    // Anglerfisch so groß wie ein Haus, der Leuchtköder wippt
    const p = spot(3.6, 3, 9);
    if (p) {
      const skin = M('#1a2230'), dark = M('#0c1018');
      const body = at(new THREE.Mesh(new THREE.SphereGeometry(2.4, 16, 12), skin), 0, 2.6, 0);
      body.scale.set(1, 0.85, 1.25);
      const jaw = at(new THREE.Mesh(new THREE.SphereGeometry(2.2, 14, 8, 0, TAU, Math.PI / 2, Math.PI / 2), dark), 0, 2.2, 0.7);
      jaw.scale.set(1, 0.7, 1.25);
      const parts = [body, jaw];
      for (let i = 0; i < 9; i++) {
        const a = -0.9 + (i / 8) * 1.8;
        const tooth = at(new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.6, 5), M('#f2f0e8')), Math.sin(a) * 1.9, 2.15, 1.5 + Math.cos(a) * 1.1);
        tooth.rotation.x = Math.PI;
        parts.push(tooth);
      }
      for (const s of [-1, 1]) {
        parts.push(at(new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), M('#e8f0f0')), s * 1.1, 3.6, 2));
        parts.push(at(new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), E('#5affd8', 1.4)), s * 1.15, 3.65, 2.35));
        const fin = at(new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.6, 4), skin), s * 2.4, 2.3, -0.4);
        fin.rotation.z = s * 1.3;
        parts.push(fin);
      }
      const tail = at(new THREE.Mesh(new THREE.ConeGeometry(1.1, 2, 4), skin), 0, 2.6, -3.4);
      tail.rotation.x = -Math.PI / 2;
      parts.push(tail);
      // Angel mit Leuchtköder
      const rod = new THREE.Group();
      rod.position.set(0, 4.6, 0.8);
      const stalk = at(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 2.6, 6), skin), 0, 1.3, 0);
      rod.add(stalk);
      const bulb = at(new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 10), E('#5affd8', 2.4)), 0, 2.7, 1.1);
      rod.add(bulb, at(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.3, 5), skin), 0, 2.4, 0.55));
      rod.children.at(-1).rotation.x = 1.1;
      parts.push(rod);
      const fish = group(...parts);
      put(fish, p[0], p[1], { rot: false });
      fish.lookAt(0, fish.position.y, 0);
      const y0 = fish.position.y;
      anims.push((t) => {
        rod.rotation.x = Math.sin(t * 0.8) * 0.18;
        bulb.material.emissiveIntensity = 2 + Math.sin(t * 2.2) * 0.8;
        fish.position.y = y0 + Math.sin(t * 0.5) * 0.12;
        jaw.rotation.x = Math.max(0, Math.sin(t * 0.4)) * 0.12;
      });
    }
    // Schlote (Black Smoker) mit glühender Spitze
    ctx.shared.vents = [];
    for (let i = 0; i < 4; i++) {
      const v = spot(1.2, 4, R - 2);
      if (!v) continue;
      const h = rr(1.6, 3);
      const parts = [];
      for (let j = 0; j < 4; j++) {
        const r = 0.55 - j * 0.09;
        parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.85, r, h / 4 + 0.05, 8), M(j % 2 ? '#1e242c' : '#2a323c')), (rand() - 0.5) * 0.12, (j + 0.5) * (h / 4), (rand() - 0.5) * 0.12));
      }
      parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.12, 8), E('#ff8a3a', 1.6)), 0, h + 0.04, 0));
      // Röhrenwürmer wie an echten Schloten: weiße Röhren mit roten Kiemenbüscheln, dicht am Fuß
      const tube = M('#ece8dc'), plume = E('#e8302a', 0.5);
      for (let k = 0; k < 14; k++) {
        const a = rand() * TAU, d = rr(0.55, 1.1), th = rr(0.35, 0.8);
        const t = at(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, th, 5), tube), Math.cos(a) * d, th / 2, Math.sin(a) * d);
        t.rotation.set(rr(-0.2, 0.2), 0, rr(-0.2, 0.2));
        parts.push(t, at(new THREE.Mesh(new THREE.SphereGeometry(0.075, 6, 4), plume), Math.cos(a) * d, th + 0.04, Math.sin(a) * d));
      }
      put(group(...parts), v[0], v[1]);
      ctx.shared.vents.push([v[0], ctx.height(v[0], v[1]) + h, v[1]]);
      // Bakterienmatten und Muschelbänke rund um den Schlot (bemalter Boden)
      ctx.paint?.(v[0], v[1], 1.8, '#d8d0a0', 'Sand');
      ctx.paint?.(v[0] + rr(-0.8, 0.8), v[1] + rr(-0.8, 0.8), 1.1, '#e8e4c8', 'SmoothPlastic');
    }
    // Kissenlava: gerundete, dunkle Wülste in Gruppen (erstarrt unter Wasser)
    scatter(8, () => {
      const g = new THREE.Group();
      for (let k = 0; k < 5; k++) {
        const m = at(new THREE.Mesh(new THREE.SphereGeometry(rr(0.25, 0.45), 8, 6), M(rand() < 0.5 ? '#141a22' : '#1e2630')), rr(-0.5, 0.5), 0.12, rr(-0.5, 0.5));
        m.scale.set(1.4, 0.6, 1);
        m.rotation.y = rand() * 3;
        g.add(m);
      }
      return g;
    }, 0.8, 2, R - 2.6);
    // Felsen mit leuchtenden Adern (feste Anzahl, sonst mit der Inselfläche vervielfacht)
    scatter(14, () => {
      const g = kit.rockMesh(rr(0.5, 0.9), '#1a222c', rand);
      for (let k = 0; k < 3; k++) g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.05, rr(0.3, 0.6), 0.05), E('#5affd8', 1.4)), rr(-0.3, 0.3), rr(0.2, 0.5), rr(-0.3, 0.3)));
      return g;
    }, 1, 2, R - 2.6);
    // Leuchtquallen schweben über dem Boden
    for (let i = 0; i < 6; i++) {
      const q = spot(0.6, 2, R - 1.5);
      if (!q) continue;
      const c = ['#5affd8', '#ff7ae0', '#7ad0ff'][i % 3];
      const bell = at(new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 8, 0, TAU, 0, Math.PI / 2), E(c, 1.2, { transparent: true, opacity: 0.75 })), 0, 0, 0);
      const parts = [bell];
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * TAU;
        parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.9, 4), E(c, 0.8, { transparent: true, opacity: 0.6 })), Math.cos(a) * 0.25, -0.45, Math.sin(a) * 0.25));
      }
      const jelly = group(...parts);
      const y0 = rr(1.5, 3.2), ph = rand() * 6;
      put(jelly, q[0], q[1], { sink: -y0 });
      const base = jelly.position.y;
      anims.push((t) => (jelly.position.y = base + Math.sin(t * 0.6 + ph) * 0.35));
    }
    scatterModels(ctx, 8, ['rock_single_A@meer', 'rock_single_B@meer', 'rock_single_C@meer', 'rock_single_D@meer'], 2.6, 4.2, { gap: 0.8 });
    scatterModels(ctx, 2, ['rock_single_C@meer', 'rock_single_D@meer'], 6, 7.5, { rMin: R * 0.6, gap: 0.7 }); // Felsbrocken statt Sechseck-Bergplatten
    const loot = clearing(ctx, 2.2, 4, R - 3);
    if (loot) {
      stand(ctx, model('chest_gold', 0.8), loot[0], loot[1]);
      around(ctx, loot, [['lantern_standing', 0.9], ['barrel', 3]], 1.4, 2.2);
    }
  },
  emitters(ctx, add) {
    for (const v of ctx.shared.vents || []) add('Schlotblasen', v, [0.6, 0.2, 0.6], ['#c8d0d8', '#8a96a4'], 0.3, 8, [1.2, 2], [4, 6], { spread: [8, 8], light: 0.2 });
    add('Leuchtplankton', [0, 4, 0], [ctx.R * 2.4, 8, ctx.R * 2.4], ['#5affd8', '#7ad0ff', '#ff7ae0'], 0.12, 14, [0.05, 0.2], [6, 10], { light: 1 });
  },
  sounds: [['Tiefe', 'tiefes Grollen und Knacken in großer Tiefe', 0.45], ['Blubbern', 'blubbernde Schlote', 0.25]],
};

// ── Wolkenburg ──
const WOLKENBURG = {
  build(ctx, kit) {
    const { M, E, at, group } = kit;
    const { rand, rr, R, anims, put, spot, reserve, root, height } = ctx;
    const marble = M('#f4f2fa'), marble2 = M('#e4e0f0'), gm = gold(M), roof = M('#8a9ae8');
    // Burg aus weißem Marmor: Bergfried, vier Ecktürme, Mauern mit Zinnen, Tor
    const parts = [];
    const keep = at(new THREE.Mesh(new THREE.BoxGeometry(3, 5, 3), marble), 0, 2.5, 0);
    parts.push(keep, at(new THREE.Mesh(new THREE.ConeGeometry(2.4, 2.6, 4), roof), 0, 6.3, 0));
    parts[1].rotation.y = Math.PI / 4;
    parts.push(at(new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), gm), 0, 7.8, 0));
    for (const [x, z] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) {
      parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 4.2, 12), marble2), x, 2.1, z));
      parts.push(at(new THREE.Mesh(new THREE.ConeGeometry(1.1, 1.8, 12), roof), x, 5.1, z));
      parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1, 4), gm), x, 6.4, z));
      const flag = at(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.35, 0.03), M('#ffd76a')), x + 0.32, 6.7, z);
      parts.push(flag);
      anims.push((t) => (flag.rotation.y = Math.sin(t * 2 + x) * 0.3));
    }
    for (const [x, z, w, d] of [[0, -3, 6, 0.5], [0, 3, 6, 0.5], [-3, 0, 0.5, 6], [3, 0, 0.5, 6]]) {
      const isGate = z === 3;
      if (isGate) {
        for (const s of [-1, 1]) parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.2, d), marble), s * 1.9, 1.1, z));
        parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, d), marble), 0, 1.9, z));
        parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.6, 0.1), gm), 0, 0.8, z + 0.2));
      } else parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(w, 2.2, d), marble), x, 1.1, z));
      const n = 8;
      for (let i = 0; i < n; i++) {
        const u = (i + 0.5) / n - 0.5;
        if (isGate && Math.abs(u) < 0.15) continue;
        parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(w > 1 ? 0.4 : 0.6, 0.4, d > 1 ? 0.4 : 0.6), marble2), x + (w > 1 ? u * w : 0), 2.4, z + (d > 1 ? u * d : 0)));
      }
    }
    // Fenster leuchten golden
    for (const s of [-1, 1]) parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, 0.05), E('#ffd76a', 1)), s * 0.7, 3.4, 1.53));
    const castle = group(...parts);
    reserve(0, 0, 4.6);
    put(castle, 0, 0, { rot: false });
    castle.rotation.y = rand() * TAU;
    // Burgplatz wie in einer Altstadt: gepflasterter Platz um die Burg, Pflasterwege nach außen, Beete mit
    // Hecken und Blumen am Platzrand, Fahnenmasten; Wolkenbäusche nur noch am Inselrand
    ctx.paint(0, 0, 6.6, '#e8dcc4', 'Cobblestone');
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * TAU + 0.4;
      for (let r = 6; r < R - 1.5; r += 1) ctx.paint(Math.cos(a) * r, Math.sin(a) * r, 0.9, '#dccfb4', 'Cobblestone');
    }
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU + 0.15, x = Math.cos(a) * 7.2, z = Math.sin(a) * 7.2;
      if (!ctx.free(x, z, 0.6)) continue;
      reserve(x, z, 0.7);
      const bed = new THREE.Group();
      bed.add(at(new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.22, 0.7), marble), 0, 0.11, 0));
      const hedge = kit.bush(0.32, '#4f9a3f', rand);
      hedge.position.set(-0.35, 0.2, 0);
      bed.add(hedge, at(kit.flowerPatch(['#ff7a9a', '#ffe25f', '#b07bff', '#ffffff'], rand, 4), 0.35, 0.2, 0));
      put(bed, x, z, { rot: false });
      bed.rotation.y = -a + Math.PI / 2;
    }
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU, x = Math.cos(a) * 5.4, z = Math.sin(a) * 5.4;
      if (!ctx.free(x, z, 0.3)) continue;
      const pole = new THREE.Group();
      pole.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 3.2, 6), gm), 0, 1.6, 0));
      pole.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.55, 0.03), M(['#5a7aff', '#ffd76a', '#ff7a9a'][i % 3], { side: THREE.DoubleSide })), 0.47, 2.85, 0));
      put(pole, x, z, { rot: false });
      pole.rotation.y = -a;
    }
    ctx.scatter(16, () => cloudPuff(kit, rand, rr(0.6, 1.1)), 0.9, R - 3, R - 1);
    // goldene Brücken zu kleinen Wolkeninseln außerhalb der Insel
    for (let i = 0; i < 2; i++) {
      const a = rand() * TAU * 0.4 + i * Math.PI;
      const r0 = R - 1.4, r1 = R + 5.5;
      const len = r1 - r0;
      const bridge = new THREE.Group();
      for (let k = 0; k < Math.round(len / 0.5); k++) bridge.add(at(new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.42), gm), 0, Math.sin((k / (len / 0.5)) * Math.PI) * 0.8, k * 0.5));
      for (const s of [-1, 1]) bridge.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, len), gm), s * 0.58, 0.7, len / 2));
      const x0 = Math.cos(a) * r0, z0 = Math.sin(a) * r0;
      bridge.position.set(x0, height(x0, z0) + 0.1, z0);
      bridge.rotation.y = Math.atan2(Math.cos(a), Math.sin(a));
      root.add(bridge);
      reserve(x0, z0, 1);
      // Wolkeninsel mit Pavillon
      const isle = new THREE.Group();
      isle.add(cloudPuff(kit, rand, 2.4));
      isle.add(at(new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.15, 14), marble), 0, 1.1, 0));
      for (let k = 0; k < 4; k++) {
        const b = (k / 4) * TAU + 0.4;
        isle.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.4, 6), marble2), Math.cos(b) * 0.9, 1.85, Math.sin(b) * 0.9));
      }
      isle.add(at(new THREE.Mesh(new THREE.ConeGeometry(1.3, 0.8, 14), gm), 0, 2.9, 0));
      const x1 = Math.cos(a) * (r1 + 1.6), z1 = Math.sin(a) * (r1 + 1.6);
      isle.position.set(x1, 0, z1);
      root.add(isle);
      const ph = rand() * 6;
      anims.push((t) => (isle.position.y = Math.sin(t * 0.5 + ph) * 0.15));
    }
    scatterModels(ctx, 6, ['tree_single_A', 'tree_single_B'], 2.2, 2.6, { rMin: 6, rMax: R - 1.4, gap: 0.7 });
    scatterModels(ctx, 6, ['post_lantern'], 0.8, 0.8, { rMin: 5, rMax: 10, gap: 1 });
    scatterModels(ctx, 3, ['building_well_blue'], 1.6, 1.6, { rMin: 6, rMax: R - 3, gap: 0.9 });
  },
  emitters(ctx, add) {
    add('Wolkenglitzern', [0, 3, 0], [ctx.R * 2.2, 6, ctx.R * 2.2], ['#ffffff', '#fff3c4'], 0.14, 12, [0.1, 0.3], [5, 8], { light: 1 });
  },
  sounds: [['Wind', 'sanfter Höhenwind', 0.35], ['Glocken', 'ferne Burgglocken', 0.2]],
};

// ── Engelsgarten ──
const ENGELSGARTEN = {
  build(ctx, kit) {
    const { M, E, at, group } = kit;
    const { rand, rr, R, anims, put, spot, root, height } = ctx;
    const marble = M('#f8f6f0'), gm = gold(M);
    // Lichtbaum: riesiger weißer Stamm, goldene Krone, leuchtet
    const p = spot(3, 0, 5) ?? [0, 0];
    {
      const h = 9;
      const tree = goldTree(kit, rand, h);
      const halo = at(new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.08, 6, 40), E('#fff2a0', 1.8)), 0, h * 0.85, 0);
      halo.rotation.x = Math.PI / 2;
      tree.add(halo);
      put(tree, p[0], p[1]);
      anims.push((t) => (halo.rotation.z = t * 0.2));
    }
    // Springbrunnen aus Licht
    const f = spot(1.6, 5, 10);
    if (f) {
      const parts = [
        at(new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.5, 0.4, 20), marble), 0, 0.2, 0),
        at(new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 0.05, 20), E('#bff8ff', 0.9, { transparent: true, opacity: 0.8 })), 0, 0.4, 0),
        at(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 1.2, 10), marble), 0, 0.9, 0),
      ];
      const jet = at(new THREE.Mesh(new THREE.ConeGeometry(0.45, 2.4, 12, 1, true), E('#fff8e0', 1.6, { transparent: true, opacity: 0.55 })), 0, 2.6, 0);
      jet.rotation.x = Math.PI;
      parts.push(jet);
      put(group(...parts), f[0], f[1]);
      anims.push((t) => {
        jet.scale.set(1, 0.85 + Math.sin(t * 1.5) * 0.15, 1);
        jet.material.opacity = 0.45 + Math.sin(t * 2) * 0.15;
      });
    }
    // Treppen, die ins Nichts führen: am Rand nach außen und oben
    for (let i = 0; i < 2; i++) {
      const a = rand() * TAU;
      const stairs = new THREE.Group();
      for (let k = 0; k < 12; k++) {
        const step = at(new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.18, 0.5), marble), 0, 0.1 + k * 0.32, k * 0.48);
        stairs.add(step);
        if (k > 6) {
          const ph = k;
          anims.push((t) => (step.position.y = 0.1 + ph * 0.32 + Math.sin(t * 0.7 + ph) * 0.05));
        }
      }
      stairs.add(at(new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.05, 6, 24), E('#fff2a0', 1.6)), 0, 4.6, 5.8));
      const r0 = R - 3;
      const x0 = Math.cos(a) * r0, z0 = Math.sin(a) * r0;
      stairs.position.set(x0, height(x0, z0), z0);
      stairs.rotation.y = Math.atan2(Math.cos(a), Math.sin(a));
      root.add(stairs);
      ctx.reserve(x0, z0, 1.4);
    }
    // Lichtbrunnen in einem Rondell wie in einem englischen Garten: Kiesplatz, Beeteinfassung aus Steinen
    if (f) {
      ctx.paint(f[0], f[1], 3.4, '#ece4d4', 'Pebble');
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * TAU, x = f[0] + Math.cos(a) * 2.1, z = f[1] + Math.sin(a) * 2.1;
        const st = at(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.3), M(['#d8d0c0', '#c8c0b0', '#e2dacc'][i % 3])), 0, 0.05, 0);
        put(group(st), x, z, { rot: false });
        st.parent.rotation.y = -a;
      }
    }
    // Wege aus hellem Kies, gesäumt von weißen Hecken und Lavendel-, Rosen- und Lilienbeeten
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * TAU + rand();
      for (let r = 3; r < R - 2; r += 1.1) ctx.paint(Math.cos(a) * r, Math.sin(a) * r, 0.8, '#efe8da', 'Pebble');
    }
    ctx.scatter(6, () => goldTree(kit, rand, rr(2.2, 3.2)), 1.2, 4, R - 2.6);
    ctx.scatter(14, () => {
      const g = new THREE.Group();
      for (let i = 0; i < 3; i++) {
        const b = kit.bush(rr(0.28, 0.42), ['#6aa85a', '#5a984a'][i % 2], rand); // grüne Hecken heben sich vom hellen Boden ab
        b.position.set(i * 0.55 - 0.55, 0, rr(-0.1, 0.1));
        g.add(b);
      }
      return g;
    }, 0.9, 3, R - 2.6);
    ctx.scatter(16, () => kit.flowerPatch(['#ffffff', '#ffd76a', '#c8a8ff', '#ffc8e0'], rand, 6), 0.5, 2, R - 2.6);
    // Lavendel: dichte violette Büschel aus schmalen Ähren
    ctx.scatter(10, () => {
      const g = new THREE.Group();
      for (let i = 0; i < 9; i++) {
        const h = rr(0.35, 0.55), a = rand() * TAU, d = rand() * 0.25;
        const stalk = at(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.015, h, 4), M('#6a8a5a')), Math.cos(a) * d, h / 2, Math.sin(a) * d);
        const head = at(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.16, 5), M('#9a7ad8')), Math.cos(a) * d, h + 0.06, Math.sin(a) * d);
        g.add(stalk, head);
      }
      return g;
    }, 0.4, 2, R - 2.6);
    ctx.scatter(4, () => kit.column(rr(1.2, 2), '#f8f6f0', rand() < 0.4), 0.5, 5, R - 2.6);
  },
  emitters(ctx, add) {
    add('Lichtfunken', [0, 2, 0], [ctx.R * 2.2, 4, ctx.R * 2.2], ['#fff2a0', '#ffffff'], 0.16, 14, [0.1, 0.4], [5, 8], { light: 1 });
    add('Goldlaub', [0, 7, 0], [ctx.R * 1.8, 1, ctx.R * 1.8], ['#ffd76a', '#ffe7a8'], 0.18, 6, [0.3, 0.6], [8, 12], { direction: 'Bottom', spread: [30, 30], light: 0.5 });
  },
  sounds: [['Chor', 'leiser, heller Chor', 0.3], ['Brunnen', 'plätschernder Lichtbrunnen', 0.25]],
};

// ── Götterthron ──
const GOETTERTHRON = {
  build(ctx, kit) {
    const { M, E, at, group } = kit;
    const { rand, rr, R, anims, put, reserve } = ctx;
    const stone = M('#e8dcc0'), stone2 = M('#d8c8a0'), gm = gold(M);
    // Gipfel in der Mitte mit Stufen, oben der Thron unter einer Sonnenscheibe
    const parts = [];
    for (let k = 0; k < 4; k++) parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(4.2 - k * 0.9, 4.5 - k * 0.9, 1, 10), k % 2 ? stone2 : stone), 0, 0.5 + k, 0));
    // Treppe nach vorne
    for (let k = 0; k < 8; k++) parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 0.6), stone), 0, 0.25 + k * 0.5, 4.3 - k * 0.42));
    const top = 4;
    parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.7, 1.4), gm), 0, top + 0.35, 0));
    parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.6, 0.3), gm), 0, top + 1.6, -0.6));
    for (const s of [-1, 1]) parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.6, 1.3), gm), s * 0.95, top + 1, 0));
    parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.15, 1), M('#c0283a')), 0, top + 0.78, 0.05));
    const sunDisk = at(new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.1, 28), E('#ffe7a8', 1.5)), 0, top + 3.4, -0.7);
    sunDisk.rotation.x = Math.PI / 2;
    parts.push(sunDisk);
    const rays = new THREE.Group();
    rays.position.set(0, top + 3.4, -0.75);
    for (let k = 0; k < 12; k++) {
      const ray = at(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.9, 0.05), E('#ffcf4a', 1.4)), 0, 1.75, 0);
      const piv = new THREE.Group();
      piv.rotation.z = (k / 12) * TAU;
      piv.add(ray);
      rays.add(piv);
    }
    parts.push(rays);
    // Feuerschalen an den Ecken der obersten Stufe
    for (const [x, z] of [[-1.3, 1.1], [1.3, 1.1]]) {
      parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.2, 0.4, 10), gm), x, top + 0.2, z));
      const flame = at(new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.7, 8), E('#ff9a2a', 2)), x, top + 0.75, z);
      parts.push(flame);
      anims.push((t) => flame.scale.set(1, 0.8 + Math.abs(Math.sin(t * 6 + x)) * 0.4, 1));
    }
    const peak = group(...parts);
    reserve(0, 0, 5);
    put(peak, 0, 0, { rot: false });
    peak.rotation.y = rand() * TAU;
    anims.push((t) => (rays.rotation.z = t * 0.15));
    // Ring aus goldenen Säulen
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU, r = 7.5;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (!ctx.free(x, z, 0.5)) continue;
      reserve(x, z, 0.5);
      const c = kit.column(rr(2.4, 3), '#ffe7a8', i % 4 === 3);
      c.traverse((o) => o.isMesh && (o.material = gm));
      put(c, x, z, { rot: false });
    }
    ctx.scatter(8, () => cloudPuff(kit, rand, rr(0.6, 1)), 0.9, 9, R - 1);
    scatterModels(ctx, 4, ['pillar_decorated', 'column'], 0.7, 0.85, { rMin: 9, gap: 0.9 });
    scatterModels(ctx, 3, ['chest_gold'], 0.8, 0.8, { rMin: 9, rMax: R - 2, gap: 1 });
    scatterModels(ctx, 4, ['rock_single_A', 'rock_single_C'], 2.4, 3, { rMin: 10, rMax: R - 1.2, gap: 0.8 });
  },
  emitters(ctx, add) {
    add('Goldfunken', [0, 5, 0], [ctx.R * 1.2, 4, ctx.R * 1.2], ['#ffe7a8', '#ffcf4a'], 0.16, 14, [0.4, 1], [3, 5], { direction: 'Top', spread: [30, 30], light: 1 });
  },
  sounds: [['Fanfare', 'ferne, feierliche Fanfaren', 0.3], ['Wind', 'Gipfelwind über den Wolken', 0.35]],
};

export const NEW_WORLDS = { tiefseegraben: TIEFSEEGRABEN, wolkenburg: WOLKENBURG, engelsgarten: ENGELSGARTEN, goetterthron: GOETTERTHRON };
for (const w of Object.values(NEW_WORLDS)) w.landmark = false;

export function planet4Before(ctx, kit) {
  const style = PATHS[ctx.world.id];
  if (style) paths(ctx, kit, style);
}

export function planet4After(ctx) {
  const def = NEW_WORLDS[ctx.world.id];
  if (!def) return;
  const R = ctx.R, list = (ctx.shared.emitters = ctx.shared.emitters || []);
  const add = (name, pos, size, colors, particleSize, rate, speed, lifetime, opts = {}) =>
    list.push({ name, pos, size, colors, particleSize, rate, speed, lifetime, spread: opts.spread ?? [180, 180], direction: opts.direction ?? 'Top', lightEmission: opts.light ?? 0 });
  if (ctx.world.water) add('Luftblasen', [0, 0.2, 0], [R * 2, 1, R * 2], ['#ffffff', '#bff8ff'], 0.22, 8, [1.2, 2.2], [5, 8], { spread: [8, 8], light: 0.3 });
  def.emitters?.(ctx, add);
  ctx.shared.sounds = (def.sounds || []).map(([name, hint, volume]) => ({ name, hint, volume }));
}
