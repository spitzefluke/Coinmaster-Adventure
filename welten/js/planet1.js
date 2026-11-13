// Planet 1 (Normal, Wald, Stadt, Eis, Lava, Höhle, Candy): Wahrzeichen, Wege mit Münz-Lichtungen,
// Kulisse in der Ferne (innerhalb der Himmelskuppel), mehr Bodendetails, Leben und Himmelseffekte als
// Partikel und Plätze für Klänge. Die Bausteine (Bäume, Kristalle …) kommen aus worldFactory.js (kit).
//
//   planet1Before(ctx, kit)  vor dem Grundbau: Wahrzeichen und Wege, damit sie Platz haben
//   planet1After(ctx, kit)   nach dem Grundbau: Kulisse, Details, Partikel, Klänge
//
// Ergebnisse für den Roblox-Export stehen in ctx.shared: emitters (Partikelquellen in Webseiten-Einheiten),
// sounds (Klang-Plätze mit Vorschlag) und coinSpots (Münzplätze auf den Lichtungen an den Wegen).

import * as THREE from 'three';
import { layOnGround } from './detail.js';

const TAU = Math.PI * 2;

// Teil der Kulisse: gehört in den Ordner „Himmel“, wirft keinen Schatten
export function backdropMesh(mesh) {
  mesh.userData.rbx = { ...(mesh.userData.rbx || {}), sky: true };
  if (mesh.geometry.type === 'ConeGeometry') mesh.userData.rbx.tiers = 9; // in Roblox feiner gestuft
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  return mesh;
}

// ── Wege: drei geschwungene Pfade von der Mitte zum Rand, mit Lichtungen für Münzen ──
// trail: ausgetretener Boden unter den Platten (Farbe, Roblox-Material), wie ein Trampelpfad
const PATHS = {
  normal: { color: '#d9c9a4', kind: 'stone', trail: ['#a2825a', 'Ground'] },
  wald: { color: '#8a6440', kind: 'plank', trail: ['#5e4630', 'Ground'] },
  eis: { color: '#cdeeff', kind: 'stone', glass: true, trail: ['#cddfee', 'Snow'] },
  lava: { color: '#3a2e2a', kind: 'tile', glow: '#ff5a14', trail: ['#4e403a', 'Slate'] },
  hoehle: { color: '#4a4458', kind: 'stone', glow: '#6ae8ff', trail: ['#3a3448', 'Slate'] },
  candy: { color: '#7a4a2a', kind: 'tile', edge: '#ff8ac8', trail: ['#e0aa78', 'SmoothPlastic'] },
};
export function paths(ctx, kit, style = PATHS[ctx.world.id]) {
  if (!style) return;
  const { M, E, at } = kit;
  const { root, height, reserve, rand, R, shared } = ctx;
  shared.coinSpots = shared.coinSpots || [];
  const mat = M(style.color, style.glass ? { roughness: 0.2, metalness: 0.1 } : style.metal ? { metalness: 0.6, roughness: 0.35 } : {});
  const start = rand() * TAU;
  for (let k = 0; k < 3; k++) {
    const a0 = start + (k * TAU) / 3, wob = 0.25 + rand() * 0.2, ph = rand() * 6;
    for (let r = 2.2; r < R - 1.6; r += 0.78) {
      const a = a0 + Math.sin(r * 0.35 + ph) * wob;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (style.avoid && !ctx.free(x, z, 0.1)) continue; // nicht durch Wahrzeichen hindurch (Atlantis)
      // Platten etwas dicker, an den Hang gelegt und zur Hälfte eingelassen: liegen satt auf, keine Kante schwebt
      const tile = style.kind === 'stone'
        ? new THREE.Mesh(new THREE.CylinderGeometry(0.34 + rand() * 0.08, 0.38, 0.14, 10), mat)
        : new THREE.Mesh(new THREE.BoxGeometry(style.kind === 'plank' ? 0.9 : 0.7, 0.14, style.kind === 'plank' ? 0.32 : 0.62), mat);
      layOnGround(tile, height, x, z, { yaw: -a + (style.kind === 'stone' ? rand() : 0), lift: 0.02 });
      tile.receiveShadow = true;
      root.add(tile);
      reserve(x, z, 0.42);
      if (style.trail) ctx.paint?.(x, z, 0.78, ...style.trail);
      // leuchtende Fugen (Lava) oder Rand (Candy) neben jeder zweiten Platte
      if ((style.glow && style.kind === 'tile') || style.edge) {
        const strip = at(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.62), style.glow ? E(style.glow, 1.3) : M(style.edge)), 0, 0, 0);
        layOnGround(strip, height, x + Math.cos(a) * 0.38, z + Math.sin(a) * 0.38, { yaw: -a, lift: 0.06 });
        root.add(strip);
      }
      // in der Höhle leuchten kleine Pilze am Wegrand
      if (style.glow && style.kind === 'stone' && Math.round(r / 0.78) % 3 === 0) {
        const side = rand() < 0.5 ? -1 : 1;
        const mx = x - Math.sin(a) * side * 0.6, mz = z + Math.cos(a) * side * 0.6;
        root.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), E(style.glow, 1.4)), mx, height(mx, mz) + 0.15, mz));
      }
    }
    // zwei Lichtungen je Weg: daneben ein Kreis aus Steinchen, in der Mitte liegt später eine Münze
    for (const r of [6.5, 11.5]) {
      const a = a0 + Math.sin(r * 0.35 + ph) * wob, side = k % 2 ? 1 : -1;
      const x = Math.cos(a) * r - Math.sin(a) * side * 1.25, z = Math.sin(a) * r + Math.cos(a) * side * 1.25;
      reserve(x, z, 0.85);
      shared.coinSpots.push([x, z]);
      if (style.trail) ctx.paint?.(x, z, 1.1, ...style.trail);
      for (let i = 0; i < 8; i++) {
        const b = (i / 8) * TAU, sx = x + Math.cos(b) * 0.7, sz = z + Math.sin(b) * 0.7;
        root.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 4), M(style.edge || style.color)), sx, height(sx, sz) + 0.03, sz));
      }
    }
  }
}

// ── Wahrzeichen ──
const LANDMARK = {
  // Windmühle auf dem Hügel
  normal(ctx, kit) {
    const { M, at, group } = kit;
    const p = ctx.spot(2.2, 5, 10);
    if (!p) return;
    const tower = at(new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.15, 3.8, 12), M('#f3ead8')), 0, 1.9, 0);
    const roof = at(new THREE.Mesh(new THREE.ConeGeometry(1.15, 1.4, 12), M('#c8503a')), 0, 4.5, 0);
    const door = at(new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.0, 0.1), M('#7a4a2a')), 0, 0.5, 1.1);
    const hub = at(new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), M('#5a3a22')), 0, 3.6, 0.95);
    const blades = new THREE.Group();
    blades.position.set(0, 3.6, 1.05);
    for (let i = 0; i < 4; i++) {
      const blade = at(new THREE.Mesh(new THREE.BoxGeometry(0.42, 2.7, 0.05), M('#fbf7ec')), 0, 1.45, 0);
      const arm = new THREE.Group();
      arm.add(blade, at(new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.9, 0.08), M('#8a5a32')), 0, 1.45, -0.04));
      arm.rotation.z = (i * Math.PI) / 2 + 0.3;
      blades.add(arm);
    }
    const mill = group(tower, roof, door, hub, blades);
    ctx.put(mill, p[0], p[1], { rot: false });
    mill.lookAt(0, mill.position.y, 0);
    ctx.anims.push((t) => (blades.rotation.z = t * 0.6));
  },
  // Riesenbaum mit Baumhaus
  wald(ctx, kit) {
    const { M, E, at, group } = kit;
    const p = ctx.spot(2.8, 3, 8);
    if (!p) return;
    const parts = [at(new THREE.Mesh(new THREE.CylinderGeometry(0.75, 1.2, 7, 12), M('#6b4a2e')), 0, 3.5, 0)];
    for (let i = 0; i < 4; i++) {
      const root = at(new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.45, 1.8, 8), M('#5e4028')), Math.cos(i * 1.57) * 1.05, 0.5, Math.sin(i * 1.57) * 1.05);
      root.rotation.set(Math.sin(i * 1.57) * 0.7, 0, -Math.cos(i * 1.57) * 0.7);
      parts.push(root);
    }
    const leaves = ['#2f7a3a', '#3f8f45', '#357f3c'];
    // kantige Blattballen (in Roblox Fläche für Fläche aus Keilen, wie die Laubbäume) statt glatter Kugeln
    for (const [x, y, z, r] of [[0, 8.2, 0, 2.6], [1.8, 7.4, 0.6, 1.9], [-1.7, 7.6, -0.4, 2.0], [0.4, 7.1, -1.9, 1.8], [-0.6, 7.3, 1.9, 1.8], [0, 9.6, 0, 1.7]]) {
      const ball = at(new THREE.Mesh(new THREE.IcosahedronGeometry(r * 1.08, 0), M(leaves[Math.abs(Math.round(x + z)) % 3])), x, y, z);
      ball.rotation.set(x * 0.7, y * 0.9, z * 0.5);
      ball.userData.rbx = { facets: true, facetThick: 0.12, name: 'Krone' };
      parts.push(ball);
    }
    // Baumhaus auf halber Höhe
    parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.15, 2.6), M('#9a7048')), 0, 4.2, 0));
    parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.1, 1.2), M('#b58654')), 0.9, 4.85, 0.9));
    parts.push(at(new THREE.Mesh(new THREE.ConeGeometry(1.05, 0.7, 4), M('#7a4a2a')), 0.9, 5.75, 0.9));
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU;
      parts.push(at(new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), E('#ffd76a', 1.6)), Math.cos(a) * 1.35, 3.9, Math.sin(a) * 1.35));
    }
    ctx.put(group(...parts), p[0], p[1], { rot: false });
  },
  // Wolkenkratzer mit Leuchtbändern und Antenne
  stadt(ctx, kit) {
    const { M, E, at, group } = kit;
    const p = ctx.spot(1.8, 6, 11);
    if (!p) return;
    const H = 10;
    const parts = [at(new THREE.Mesh(new THREE.BoxGeometry(2, H, 2), M('#7fa8d8', { metalness: 0.5, roughness: 0.25 })), 0, H / 2, 0)];
    for (let y = 1; y < H; y += 1.1)
      for (const [w, d] of [[2.04, 0.08], [0.08, 2.04]]) parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(w, 0.12, d), E('#bff0ff', 1.1)), 0, y, 0));
    parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.8, 1.4), M('#5f7fa8', { metalness: 0.5 })), 0, H + 0.4, 0));
    parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.4, 6), M('#c8d0d8', { metalness: 0.6 })), 0, H + 2, 0));
    parts.push(at(new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), E('#ff3a4a', 2)), 0, H + 3.25, 0));
    ctx.put(group(...parts), p[0], p[1], { rot: false });
  },
  // Eispalast mit vier Türmen
  eis(ctx, kit) {
    const { M, at, group } = kit;
    const p = ctx.spot(3.2, 4, 9);
    if (!p) return;
    const ice = M('#bfe8ff', { roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.88 });
    const roof = M('#eaf7ff', { roughness: 0.3 });
    const parts = [at(new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.8, 2.6), ice), 0, 1.4, 0), at(new THREE.Mesh(new THREE.ConeGeometry(1.5, 1.8, 4), roof), 0, 3.7, 0)];
    for (const [x, z] of [[1.5, 1.5], [-1.5, 1.5], [1.5, -1.5], [-1.5, -1.5]]) {
      parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 3.8, 10), ice), x, 1.9, z));
      parts.push(at(new THREE.Mesh(new THREE.ConeGeometry(0.62, 1.3, 10), roof), x, 4.45, z));
    }
    parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.4, 0.12), M('#7ab8e0')), 0, 0.7, 1.32));
    ctx.put(group(...parts), p[0], p[1], { rot: false });
  },
  // Lavatempel: Stufenpyramide mit Feuerschale
  lava(ctx, kit) {
    const { M, E, at, group } = kit;
    const p = ctx.spot(2.6, 5, 10);
    if (!p) return;
    const stone = M('#2a221e'), parts = [];
    for (let i = 0; i < 3; i++) {
      const s = 3.4 - i * 0.95;
      parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(s, 0.8, s), stone), 0, 0.4 + i * 0.8, 0));
      parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(s + 0.06, 0.08, s + 0.06), E('#ff5a14', 1.3)), 0, 0.8 + i * 0.8, 0));
    }
    parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.35, 0.4, 12), M('#1a1412')), 0, 2.6, 0));
    parts.push(at(new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 8), E('#ffb02e', 2)), 0, 2.9, 0));
    ctx.put(group(...parts), p[0], p[1], { rot: false });
  },
  // Riesenkristall in der Höhle
  hoehle(ctx, kit) {
    const { crystal, group } = kit;
    const p = ctx.spot(2.6, 3, 9);
    if (!p) return;
    const parts = [];
    const cols = ['#b07bff', '#6ae8ff', '#ff7ae0'];
    for (let i = 0; i < 6; i++) {
      const c = crystal(i === 0 ? 4.5 : 1.6 + ctx.rand() * 1.6, cols[i % 3], ctx.rand, 1.6);
      if (i) {
        const a = (i / 5) * TAU;
        c.position.set(Math.cos(a) * 1.1, 0, Math.sin(a) * 1.1);
        c.rotation.set(Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35);
      }
      parts.push(c);
    }
    ctx.put(group(...parts), p[0], p[1], { rot: false });
  },
  // Zuckerschloss mit Lolli-Türmen
  candy(ctx, kit) {
    const { M, at, group } = kit;
    const p = ctx.spot(3, 4, 9);
    if (!p) return;
    const parts = [at(new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.4, 2.6), M('#ffb3dc')), 0, 1.2, 0), at(new THREE.Mesh(new THREE.BoxGeometry(1, 1.4, 0.12), M('#7a4a2a')), 0, 0.7, 1.32)];
    const tops = ['#ff5fb0', '#5fd3ff', '#ffe25f', '#7aff8a'];
    [[1.4, 1.4], [-1.4, 1.4], [1.4, -1.4], [-1.4, -1.4]].forEach(([x, z], i) => {
      parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 3.4, 12), M(i % 2 ? '#ffffff' : '#ffd6ec')), x, 1.7, z));
      parts.push(at(new THREE.Mesh(new THREE.ConeGeometry(0.62, 1.1, 12), M('#ff5fb0')), x, 3.95, z));
      parts.push(at(new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 8), M(tops[i])), x, 4.75, z));
    });
    parts.push(at(new THREE.Mesh(new THREE.SphereGeometry(0.9, 14, 10), M('#ff8ac8')), 0, 2.9, 0));
    ctx.put(group(...parts), p[0], p[1], { rot: false });
  },
};

// ── Kulisse: ein Ring aus großen Formen in der Ferne (40–70 Einheiten), aus dem Wolkenmeer ragend ──
export function backdrop(ctx, kit) {
  const { M, E, at } = kit;
  const { root, rand } = ctx;
  const id = ctx.world.id;
  const base = -24; // unter der Oberkante des Wolkenmeers
  const add = (mesh) => root.add(backdropMesh(mesh));
  const n = 16;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + rand() * 0.25, r = 44 + rand() * 24;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    const h = 14 + rand() * 22;
    if (id === 'normal') {
      // grüne Hügel, dazwischen Berge mit Schneekappe
      if (i % 3) add(at(new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), M(['#6fbf4f', '#5fae46', '#7ccf5a'][i % 3])), x, base + h * 0.35, z)).children.at(-1).scale.set(9 + rand() * 6, h * 0.75, 9 + rand() * 6);
      else {
        add(at(new THREE.Mesh(new THREE.ConeGeometry(9, h + 8, 8), M('#8a8f9a')), x, base + (h + 8) / 2, z));
        add(at(new THREE.Mesh(new THREE.ConeGeometry(3.6, 4, 8), M('#ffffff')), x, base + h + 8 - 2.2, z));
      }
    } else if (id === 'wald') {
      add(at(new THREE.Mesh(new THREE.ConeGeometry(7 + rand() * 4, h + 6, 8), M(['#2c5f34', '#356b3b', '#264f2c'][i % 3])), x, base + (h + 6) / 2, z));
    } else if (id === 'stadt') {
      for (let j = 0; j < 3; j++) {
        const w = 3 + rand() * 3, bh = 12 + rand() * 26, ox = (j - 1) * 5;
        add(at(new THREE.Mesh(new THREE.BoxGeometry(w, bh, w), M(['#9fb0c8', '#8aa0bc', '#b0bfd4'][j])), x - Math.sin(a) * ox, base + bh / 2, z + Math.cos(a) * ox));
        if (j === 1) add(at(new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), E('#ff3a4a', 2)), x - Math.sin(a) * ox, base + bh + 0.4, z + Math.cos(a) * ox));
      }
    } else if (id === 'eis') {
      add(at(new THREE.Mesh(new THREE.ConeGeometry(8 + rand() * 4, h + 10, 6), M('#f4fbff')), x, base + (h + 10) / 2, z));
      add(at(new THREE.Mesh(new THREE.ConeGeometry(9.5, 6, 6), M('#a8d8f0')), x, base + 3, z));
    } else if (id === 'lava') {
      add(at(new THREE.Mesh(new THREE.ConeGeometry(8 + rand() * 4, h + 6, 7), M('#2a1e1a')), x, base + (h + 6) / 2, z));
      add(at(new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.2, 1.2, 8), E('#ff5a14', 1.4)), x, base + h + 6 - 0.8, z));
    } else if (id === 'hoehle') {
      // Felssäulen von unten und Tropfsteine von oben: wie in einer riesigen Höhle
      add(at(new THREE.Mesh(new THREE.CylinderGeometry(3 + rand() * 2, 5, 70, 8), M('#2e2838')), x, base + 25, z));
      add(at(new THREE.Mesh(new THREE.ConeGeometry(3.5, 14 + rand() * 10, 7), M('#262030')), x * 0.8, 46, z * 0.8)).children.at(-1).rotation.x = Math.PI;
      if (i % 2) add(at(new THREE.Mesh(new THREE.SphereGeometry(0.9, 8, 6), E(['#b07bff', '#6ae8ff'][i % 2], 1.5)), x * 0.97, base + 10 + rand() * 20, z * 0.97));
    } else if (id === 'candy') {
      // Eisberge: Waffel unten, Kugeln obenauf
      add(at(new THREE.Mesh(new THREE.ConeGeometry(6, 14, 10), M('#e8b070')), x, base + 7, z)).children.at(-1).rotation.x = Math.PI;
      const cols = ['#ffd6ec', '#bfe8ff', '#fff2a0', '#e2c2ff', '#c8ffd4'];
      add(at(new THREE.Mesh(new THREE.SphereGeometry(6.5, 14, 10), M(cols[i % 5])), x, base + 16, z));
      add(at(new THREE.Mesh(new THREE.SphereGeometry(4.5, 14, 10), M(cols[(i + 2) % 5])), x, base + 22, z));
    }
  }
  // Polarlicht über dem Eis: Bänder aus durchscheinendem Leuchten hoch am Himmel
  if (id === 'eis') {
    const cols = ['#5affb0', '#7ad0ff', '#b07bff'];
    for (let i = 0; i < 26; i++) {
      const a = -0.9 + i * 0.075, r = 52;
      const m = E(cols[Math.floor(i / 9) % 3], 1.2, { transparent: true, opacity: 0.45 });
      const band = at(new THREE.Mesh(new THREE.BoxGeometry(4.2, 9 + Math.sin(i * 0.7) * 3, 0.2), m), Math.cos(a) * r, 26 + Math.sin(i * 0.5) * 2.5, Math.sin(a) * r);
      band.rotation.y = -a + Math.PI / 2;
      add(band);
    }
  }
}

// ── mehr Details am Boden ──
function details(ctx, kit) {
  const { M, E, at, group, rockMesh, mushroom, flower } = kit;
  const { scatter, rand, rr, R } = ctx;
  // Grasbüschel: fünf spitze Halme, die vom Fuß aus schräg auseinanderstehen (in Roblox je Halm zwei Keile)
  const tuft = (c) => {
    const pts = [];
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + rand() * 0.6, lean = 0.05 + rand() * 0.09, h = 0.2 + rand() * 0.2, w = 0.035;
      const ca = Math.cos(a), sa = Math.sin(a);
      pts.push(-sa * w, 0, ca * w, sa * w, 0, -ca * w, ca * lean, h, sa * lean);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, M(c, { side: THREE.DoubleSide }));
    m.userData.rbx = { facets: true, facetsAll: true, facetThick: 0.015, name: 'Gras' };
    return m;
  };
  const id = ctx.world.id;
  if (id === 'normal' || id === 'wald') {
    scatter(16, () => tuft(rand() < 0.5 ? '#4f9a3f' : '#6fbf4f'), 0.15);
    scatter(4, () => kit.flowerPatch(['#ff5f8f', '#ffd23f', '#ffffff', '#a86bff'], rand), 0.45, 2, R - 2.6);
    scatter(6, () => rockMesh(rr(0.12, 0.22), '#9a9aa6', rand), 0.2);
    if (id === 'wald') scatter(4, () => mushroom(rr(0.25, 0.45), rand() < 0.5 ? '#d84a3a' : '#e8c070', rand, false), 0.25);
  } else if (id === 'stadt') {
    // Blumenkübel mit Busch (Hydranten stehen als Modelle an den Straßen; vorher standen hier über 40 rote Säulen)
    scatter(2, () => {
      const box = at(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.5), M('#8a8f9a')), 0, 0.15, 0);
      const b = kit.bush(0.24, '#4f9a3f', rand);
      b.position.y = 0.22;
      return group(box, b);
    }, 0.3);
  } else if (id === 'eis') {
    scatter(16, () => rockMesh(rr(0.1, 0.22), '#e8f6ff', rand), 0.18);
    scatter(8, () => { const m = at(new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), M('#bfe8ff', { roughness: 0.2 })), 0, 0.25, 0); m.scale.set(0.7, rr(2, 3.5), 0.7); return m; }, 0.15);
  } else if (id === 'lava') {
    scatter(14, () => rockMesh(rr(0.1, 0.22), '#1a1614', rand, rand() < 0.4 ? E('#ff3a0a', 0.8) : null), 0.18);
  } else if (id === 'hoehle') {
    scatter(6, () => mushroom(rr(0.18, 0.32), ['#6ae8ff', '#b07bff', '#ff7ae0'][Math.floor(rand() * 3)], rand, true), 0.2);
  } else if (id === 'candy') {
    const cols = ['#ff5fb0', '#5fd3ff', '#ffe25f', '#7aff8a', '#b07bff'];
    scatter(20, (i) => at(new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), M(cols[i % 5])), 0, 0.1, 0), 0.12);
  }
}

// ── Leben und Himmelseffekte als Partikelquellen (Webseiten-Einheiten) ──
function emitters(ctx) {
  const R = ctx.R, id = ctx.world.id, list = (ctx.shared.emitters = ctx.shared.emitters || []);
  const add = (name, pos, size, colors, particleSize, rate, speed, lifetime, opts = {}) =>
    list.push({ name, pos, size, colors, particleSize, rate, speed, lifetime, spread: opts.spread ?? [180, 180], direction: opts.direction ?? 'Top', lightEmission: opts.light ?? 0 });
  const birds = () => add('Voegel', [0, 13, 0], [R * 2.4, 2, R * 2.4], ['#3a3a48', '#55556a'], 0.5, 3, [1.2, 2.2], [8, 12]);
  if (id === 'normal') {
    add('Schmetterlinge', [0, 2, 0], [R * 2, 3, R * 2], ['#ff8ad8', '#ffd84a', '#8ad8ff', '#ffffff'], 0.32, 6, [0.25, 0.7], [6, 10], { light: 0.2 });
    birds();
  } else if (id === 'wald') {
    add('Blaetter', [0, 10, 0], [R * 2, 1, R * 2], ['#5aa850', '#3f8a46', '#e8a040'], 0.3, 10, [0.4, 0.9], [9, 14], { direction: 'Bottom', spread: [25, 25] });
    birds();
  } else if (id === 'stadt') {
    birds();
    add('Lichter', [0, 6, 0], [R * 2, 8, R * 2], ['#ffe7a8', '#bff0ff'], 0.18, 6, [0.1, 0.3], [5, 9], { light: 1 });
  } else if (id === 'eis') {
    add('Polarlicht', [0, 26, 0], [R * 4, 6, R * 4], ['#5affb0', '#7ad0ff', '#b07bff'], 1.4, 8, [0.2, 0.5], [6, 10], { light: 1 });
  } else if (id === 'lava') {
    add('Asche', [0, 0.5, 0], [R * 2, 1, R * 2], ['#5a4a44', '#8a7a70'], 0.3, 14, [0.6, 1.4], [8, 12], { spread: [20, 20] });
    add('Rauchfahne', [-50, 18, -30], [6, 2, 6], ['#3a302c', '#5a4a44'], 4, 6, [1.5, 3], [8, 12], { spread: [15, 15] });
  } else if (id === 'hoehle') {
    add('Leuchtfalter', [0, 2.5, 0], [R * 2, 4, R * 2], ['#6ae8ff', '#b07bff', '#ff7ae0'], 0.25, 6, [0.2, 0.6], [6, 10], { light: 1 });
  } else if (id === 'candy') {
    add('Zuckerfunkeln', [0, 1, 0], [R * 2, 2, R * 2], ['#ffd6ec', '#bfe8ff', '#fff2a0'], 0.3, 8, [0.2, 0.5], [6, 10], { light: 0.6, spread: [25, 25] });
  }
}

// ── Plätze für Klänge (in Roblox Sound-Objekte ohne SoundId; Vorschlag steht daneben) ──
const SOUNDS = {
  normal: [['Voegel', 'Vogelgezwitscher auf einer Wiese', 0.4], ['Bach', 'leise plätschernder Bach', 0.3], ['Wind', 'sanfter Wind', 0.2]],
  wald: [['Wald', 'Waldgeräusche mit Vögeln und Rascheln', 0.45], ['Eule', 'ferne Eule, ab und zu', 0.2]],
  stadt: [['Stadt', 'Stadtgeräusche: Verkehr in der Ferne, Stimmen', 0.35], ['Brunnen', 'plätschernder Brunnen', 0.25]],
  eis: [['Wind', 'eisiger Wind, pfeifend', 0.45], ['Knirschen', 'knirschendes Eis, leise', 0.2]],
  lava: [['Lava', 'blubbernde Lava und Grollen', 0.45], ['Feuer', 'knisterndes Feuer', 0.3]],
  hoehle: [['Hoehle', 'tropfendes Wasser und Hall in einer Höhle', 0.45], ['Kristalle', 'leises Glockenklingen von Kristallen', 0.2]],
  candy: [['Musik', 'fröhliche Spieluhr- oder Glockenspiel-Musik', 0.35], ['Funkeln', 'leises Glitzern', 0.2]],
};
function sounds(ctx) {
  const list = SOUNDS[ctx.world.id];
  if (list) ctx.shared.sounds = list.map(([name, hint, volume]) => ({ name, hint, volume }));
}

export const PLANET1 = new Set(['normal', 'wald', 'stadt', 'eis', 'lava', 'hoehle', 'candy']);

export function planet1Before(ctx, kit) {
  if (!PLANET1.has(ctx.world.id)) return;
  if (!ctx.modelWorld || ctx.modelWorld.landmark) LANDMARK[ctx.world.id]?.(ctx, kit);
  paths(ctx, kit);
}

export function planet1After(ctx, kit) {
  if (!PLANET1.has(ctx.world.id)) return;
  if (ctx.modelWorld?.backdrop) ctx.modelWorld.backdrop(ctx, kit);
  else backdrop(ctx, kit);
  details(ctx, kit);
  emitters(ctx);
  sounds(ctx);
}

