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
  // wide: breiter, durchgehender Weg, der klar von der Mitte zum Rand führt, mit zwei Randleisten und
  // Schmuck am Wegrand (deco: 'saeulen' Marmorsäulen mit Goldkappe, 'feuer' Feuerschalen)
  const wide = !!style.wide, step = wide ? 0.95 : 0.78;
  for (let k = 0; k < 3; k++) {
    const a0 = start + (k * TAU) / 3, wob = (0.25 + rand() * 0.2) * (wide ? 0.35 : 1), ph = rand() * 6;
    let n = 0;
    for (let r = 2.2; r < R - 1.6; r += step, n++) {
      const a = a0 + Math.sin(r * 0.35 + ph) * wob;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (style.avoid && !ctx.free(x, z, 0.1)) continue; // nicht durch Wahrzeichen hindurch (Atlantis)
      // hidden: kein sichtbarer Weg (Mars), nur der Platz bleibt frei
      if (style.hidden) { reserve(x, z, 0.42); continue; }
      if (wide) { wideTile(ctx, kit, style, mat, x, z, a, n); continue; }
      // Platten etwas dicker, an den Hang gelegt und zur Hälfte eingelassen: liegen satt auf, keine Kante schwebt
      const tile = style.kind === 'stone'
        ? new THREE.Mesh(new THREE.CylinderGeometry(0.34 + rand() * 0.08, 0.38, 0.14, 10), mat)
        : new THREE.Mesh(new THREE.BoxGeometry(style.kind === 'plank' ? 0.9 : 0.7, 0.14, style.kind === 'plank' ? 0.32 : 0.62), mat);
      layOnGround(tile, height, x, z, { yaw: -a + (style.kind === 'stone' ? rand() : 0), lift: 0.02 });
      tile.receiveShadow = true;
      root.add(tile);
      (shared.pathTiles = shared.pathTiles || []).push({ mesh: tile, x, z, a, k }); // für Brücken über Bäche
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
      if (style.trail && !style.hidden) ctx.paint?.(x, z, 1.1, ...style.trail);
      for (let i = 0; i < (style.hidden ? 0 : 8); i++) {
        const b = (i / 8) * TAU, sx = x + Math.cos(b) * 0.7, sz = z + Math.sin(b) * 0.7;
        root.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 4), M(style.edge || style.pebble || style.color)), sx, height(sx, sz) + 0.03, sz));
      }
    }
  }
}

// Platte eines breiten Wegs: 1,6 breit, quer zur Laufrichtung, mit Randleisten links und rechts;
// jede dritte Platte trägt am Rand abwechselnd links und rechts den Schmuck der Welt
function wideTile(ctx, kit, style, mat, x, z, a, n) {
  const { M, E, at } = kit;
  const { root, height, reserve } = ctx;
  const W = 1.6, D = 0.92;
  const tile = new THREE.Mesh(new THREE.BoxGeometry(D, 0.14, W), mat);
  layOnGround(tile, height, x, z, { yaw: -a, lift: 0.02 });
  tile.receiveShadow = true;
  root.add(tile);
  reserve(x, z, 0.95);
  if (style.trail) ctx.paint?.(x, z, 1.1, ...style.trail);
  const sx = -Math.sin(a), sz = Math.cos(a); // quer zum Weg
  const edgeMat = style.glow ? E(style.glow, 1.3) : M(style.edge || '#ffffff', style.edgeMetal ? { metalness: 0.7, roughness: 0.3, emissive: '#b8860b', emissiveIntensity: 0.25 } : {});
  for (const side of [-1, 1]) {
    const ex = x + sx * side * (W / 2 + 0.04), ez = z + sz * side * (W / 2 + 0.04);
    const strip = new THREE.Mesh(new THREE.BoxGeometry(D + 0.04, 0.1, 0.09), edgeMat);
    layOnGround(strip, height, ex, ez, { yaw: -a, lift: 0.07 });
    root.add(strip);
  }
  // Fugen: glühend (Sonne) oder fein (Götterthron), quer über die Platte
  if (style.glow) {
    const seam = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, W - 0.1), E(style.glow, 1.2));
    layOnGround(seam, height, x + Math.cos(a) * (D / 2), z + Math.sin(a) * (D / 2), { yaw: -a, lift: 0.075 });
    root.add(seam);
  }
  if (n % 3 !== 1) return;
  const side = n % 6 === 1 ? 1 : -1;
  const px = x + sx * side * (W / 2 + 0.45), pz = z + sz * side * (W / 2 + 0.45), y = height(px, pz);
  reserve(px, pz, 0.35);
  if (style.deco === 'saeulen') {
    const marble = M('#f6f1e6'), g = M('#ffcf4a', { metalness: 0.7, roughness: 0.3, emissive: '#b8860b', emissiveIntensity: 0.25 });
    root.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.42), marble), px, y + 0.07, pz));
    root.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 1.1, 12), marble), px, y + 0.69, pz));
    root.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.1, 0.36), g), px, y + 1.29, pz));
    root.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), g), px, y + 1.44, pz));
  } else if (style.deco === 'feuer') {
    const iron = M('#2a1a12', { metalness: 0.5, roughness: 0.5 });
    root.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.6, 8), iron), px, y + 0.3, pz));
    root.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.14, 0.18, 12), iron), px, y + 0.68, pz));
    root.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.04, 12), E('#ff7a1a', 1.4)), px, y + 0.76, pz));
    root.add(at(new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.42, 8), E('#ffd84a', 1.8)), px, y + 0.98, pz));
    (ctx.shared.emitters = ctx.shared.emitters || []).push({ name: 'Feuerschale', pos: [px, y + 0.9, pz], size: [0.3, 0.05, 0.3], colors: ['#ffd84a', '#ff6a1a'], particleSize: 0.12, sizeEnd: 0.04, rate: 4, speed: [0.4, 0.8], lifetime: [0.6, 1], spread: [15, 15], direction: 'Top', lightEmission: 1 });
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
    const p = ctx.spot(4.2, 4, 8);
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
    // Baumhaus (Werkstatt-Wunsch): große Plattform mit Geländer und Laternen, Bretterhaus mit Spitzdach,
    // warm leuchtenden Fenstern und Blumenkästen, Wendeltreppe um den Stamm, Hängebrücke zu einer zweiten
    // Plattform, Fahne, Seilrolle mit Korb und Vogelhäuschen
    const wood = M('#9a7048'), plank = M('#b58654'), darkWood = M('#6e4a2c'), roofM = M('#7a3e24'), rope = M('#c8b088');
    const warm = E('#ffcf6a', 1.5), PY = 4.2, PS = 3.8;
    const box = (w, h, d, m, x, y, z, ry = 0) => { const b = at(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m), x, y, z); b.rotation.y = ry; parts.push(b); return b; };
    box(PS, 0.16, PS, wood, 0, PY, 0);
    for (let i = -1; i <= 1; i += 2) box(PS, 0.18, 0.16, darkWood, 0, PY - 0.14, i * (PS / 2 - 0.1)); // Tragbalken
    // Geländer: Pfosten und Handlauf an drei Seiten (vorne offen zur Treppe und zur Brücke)
    for (const [sx, sz, along] of [[0, -1, 'x'], [-1, 0, 'z'], [0, 1, 'x']]) {
      for (let k = -2; k <= 2; k++) {
        const o = (k / 2) * (PS / 2 - 0.12);
        box(0.1, 0.7, 0.1, darkWood, along === 'x' ? o : sx * (PS / 2 - 0.08), PY + 0.43, along === 'z' ? o : sz * (PS / 2 - 0.08));
      }
      box(along === 'x' ? PS : 0.1, 0.08, along === 'z' ? PS : 0.1, darkWood, sx * (PS / 2 - 0.08), PY + 0.8, sz * (PS / 2 - 0.08));
    }
    for (const [x, z] of [[-1.8, -1.8], [-1.8, 1.8], [1.8, 1.8]]) {
      box(0.12, 0.9, 0.12, darkWood, x, PY + 0.53, z);
      parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.26, 0.22), warm), x, PY + 1.1, z));
    }
    // Bretterhaus mit Spitzdach (zwei schräge Dachflächen), Tür, Fenster und Blumenkästen
    const HX = 0.95, HZ = 0.95, HW = 1.7, HH = 1.35, HD = 1.5;
    box(HW, HH, HD, plank, HX, PY + 0.08 + HH / 2, HZ);
    for (let y = 0.2; y < HH; y += 0.27) box(HW + 0.03, 0.04, HD + 0.03, darkWood, HX, PY + 0.08 + y, HZ); // Bretterfugen
    for (const sgn of [-1, 1]) {
      const r = box(HW + 0.3, 0.1, HD * 0.62, roofM, HX, PY + HH + 0.42, HZ + sgn * HD * 0.27);
      r.rotation.x = sgn * 0.62;
    }
    box(0.12, 0.62, HD * 0.2, darkWood, HX + HW / 2 + 0.01, PY + HH + 0.25, HZ); // Giebel
    box(0.45, 0.8, 0.05, darkWood, HX, PY + 0.48, HZ + HD / 2 + 0.02); // Tür
    for (const [x, z, ry] of [[HX - HW / 2 - 0.02, HZ, Math.PI / 2], [HX + 0.45, HZ + HD / 2 + 0.02, 0], [HX - 0.45, HZ + HD / 2 + 0.02, 0]]) {
      if (Math.abs(ry) > 0) {
        box(0.04, 0.38, 0.42, warm, x, PY + 0.85, z);
        box(0.18, 0.12, 0.5, M('#8a5a32'), x - 0.08, PY + 0.6, z);
        for (let f = -1; f <= 1; f++) parts.push(at(new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 4), M(['#ff7a9a', '#ffe25f', '#ffffff'][f + 1])), x - 0.12, PY + 0.7, z + f * 0.15));
      } else {
        box(0.34, 0.34, 0.04, warm, x, PY + 0.88, z);
        box(0.42, 0.1, 0.16, M('#8a5a32'), x, PY + 0.64, z + 0.07);
        for (let f = -1; f <= 1; f++) parts.push(at(new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 4), M(['#ff7a9a', '#ffe25f', '#b07bff'][f + 1])), x + f * 0.12, PY + 0.73, z + 0.1));
      }
    }
    // Fahne auf dem Dach
    box(0.05, 1.0, 0.05, darkWood, HX - HW / 2 + 0.1, PY + HH + 1.0, HZ);
    box(0.04, 0.32, 0.5, M('#d8402e'), HX - HW / 2 + 0.1, PY + HH + 1.32, HZ + 0.27);
    // Wendeltreppe um den Stamm bis zur Plattform
    const steps = 15;
    for (let i = 0; i < steps; i++) {
      const a = Math.PI * 1.1 + i * 0.42, y = 0.2 + (i * (PY - 0.2)) / steps, r = 1.6;
      box(0.75, 0.1, 0.36, plank, Math.cos(a) * r, y, Math.sin(a) * r, -a);
      if (i % 3 === 0) box(0.07, 0.75, 0.07, darkWood, Math.cos(a) * (r + 0.36), y + 0.4, Math.sin(a) * (r + 0.36));
    }
    // zweite Plattform auf Stelzen mit Hängebrücke
    const P2 = [3.7, 3.5, -1.6];
    box(1.5, 0.14, 1.5, wood, P2[0], P2[1], P2[2]);
    for (const [dx, dz] of [[0.6, 0.6], [-0.6, 0.6], [0.6, -0.6], [-0.6, -0.6]]) parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, P2[1], 6), darkWood), P2[0] + dx, P2[1] / 2, P2[2] + dz));
    parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.26, 0.24), warm), P2[0] + 0.6, P2[1] + 0.3, P2[2] + 0.6));
    {
      const A = new THREE.Vector3(PS / 2, PY, -1.1), B = new THREE.Vector3(P2[0] - 0.7, P2[1], P2[2] + 0.2), n = 8;
      const dir = B.clone().sub(A), ang = Math.atan2(dir.x, dir.z), side = new THREE.Vector3(dir.z, 0, -dir.x).normalize().multiplyScalar(0.36);
      for (let i = 0; i <= n; i++) {
        const t = i / n, q = A.clone().lerp(B, t);
        q.y -= Math.sin(t * Math.PI) * 0.35;
        box(0.68, 0.06, 0.2, plank, q.x, q.y, q.z, ang);
        if (i % 2 === 0) for (const sg of [-1, 1]) box(0.04, 0.5, 0.04, rope, q.x + side.x * sg, q.y + 0.25, q.z + side.z * sg);
      }
      for (const sg of [-1, 1]) {
        const m = A.clone().lerp(B, 0.5).add(side.clone().multiplyScalar(sg));
        const r = box(0.04, 0.04, dir.length(), rope, m.x, m.y + 0.45, m.z, ang);
        r.rotation.x = -Math.atan2(B.y - A.y, Math.hypot(dir.x, dir.z));
      }
    }
    // Seilrolle mit Korb und Vogelhäuschen am Stamm
    box(0.9, 0.08, 0.08, darkWood, -2.15, PY + 1.2, 0.4);
    parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.4, 5), rope), -2.5, PY - 0.0, 0.4));
    box(0.42, 0.3, 0.42, M('#c89a5a'), -2.5, PY - 1.25, 0.4);
    box(0.32, 0.32, 0.32, plank, -0.4, 2.8, 1.1);
    const bh = at(new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.22, 4), roofM), -0.4, 3.07, 1.1);
    bh.rotation.y = Math.PI / 4;
    parts.push(bh);
    parts.push(at(new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 4), M('#2a1a10')), -0.4, 2.85, 1.27));
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU;
      parts.push(at(new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), E('#ffd76a', 1.6)), Math.cos(a) * 1.35, 3.9, Math.sin(a) * 1.35));
    }
    ctx.put(group(...parts), p[0], p[1], { rot: false });
  },
  // Hochhaus (Werkstatt-Wunsch): gestaffelte Stockwerke mit Fensterbändern (einige Fenster warm beleuchtet),
  // Sockel mit Vorplatz, Eingang mit Vordach, Drehtür und Schriftzug, Pflanzkübel; auf dem Dach ein
  // Hubschrauberlandeplatz, Antenne mit Blinklicht und Leuchtreklame
  stadt(ctx, kit) {
    const { M, E, at, group, signBoard } = kit;
    const p = ctx.spot(2.6, 6, 11);
    if (!p) return;
    const rand = ctx.rand;
    const parts = [];
    const box = (w, h, d, m, x, y, z) => { const b = at(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m), x, y, z); parts.push(b); return b; };
    const frame = M('#d4dae4', { roughness: 0.6 }), glass = M('#35557e', { metalness: 0.6, roughness: 0.18 }), lit = E('#ffe2a0', 1.2);
    const stone = M('#bdb6aa'), dark = M('#4a5262', { metalness: 0.5, roughness: 0.35 });
    // Vorplatz und Sockel
    box(3.6, 0.12, 3.6, stone, 0, 0.06, 0);
    box(2.7, 1.2, 2.7, M('#8f97a6'), 0, 0.72, 0);
    // Stockwerke: drei Stufen, jede schmaler; je Stockwerk ein Glasband ringsum und Fensterteilung
    const FH = 0.62;
    let y = 1.32;
    const tiers = [[2.3, 8], [1.85, 6], [1.4, 4]];
    for (const [w, floors] of tiers) {
      box(w, floors * FH, w, frame, 0, y + (floors * FH) / 2, 0);
      for (let f = 0; f < floors; f++) {
        const fy = y + f * FH + FH * 0.5;
        for (const [dx, dz, ww, dd] of [[0, w / 2, w * 0.92, 0.06], [0, -w / 2, w * 0.92, 0.06], [w / 2, 0, 0.06, w * 0.92], [-w / 2, 0, 0.06, w * 0.92]]) {
          box(ww, FH * 0.55, dd, glass, dx, fy, dz);
          // beleuchtete Fenster: einzelne Felder im Band
          const cols = 4;
          for (let c = 0; c < cols; c++) {
            if (rand() > 0.32) continue;
            const o = ((c + 0.5) / cols - 0.5) * w * 0.86;
            box(ww > 0.1 ? w * 0.18 : 0.07, FH * 0.45, ww > 0.1 ? 0.07 : w * 0.18, lit, dx + (ww > 0.1 ? o : Math.sign(dx) * 0.01), fy, dz + (ww > 0.1 ? Math.sign(dz) * 0.01 : o));
          }
        }
      }
      // Fensterteilung: senkrechte Streben an den Kanten
      for (const [cx, cz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) box(0.12, floors * FH, 0.12, frame, (cx * w) / 2, y + (floors * FH) / 2, (cz * w) / 2);
      y += floors * FH;
      box(w + 0.14, 0.14, w + 0.14, frame, 0, y + 0.07, 0); // Gesims
      y += 0.14;
    }
    // Eingang: Vordach auf zwei Stützen, Drehtür aus Glas, Schriftzug darüber
    box(1.5, 0.08, 0.75, dark, 0, 1.0, 1.35 + 0.37);
    for (const sx of [-0.65, 0.65]) box(0.07, 0.95, 0.07, dark, sx, 0.52, 2.0);
    parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.8, 16), M('#bfe6ff', { transparent: true, opacity: 0.45, roughness: 0.1 })), 0, 0.52, 1.38));
    for (let i = 0; i < 3; i++) {
      const v = box(0.6, 0.76, 0.03, dark, 0, 0.52, 1.38);
      v.rotation.y = (i / 3) * Math.PI;
    }
    const sign = signBoard('COIN TOWER', { w: 1.8, h: 0.4, bg: '#16202e', fg: '#7ad0ff' });
    sign.position.set(0, 1.28, 1.37);
    parts.push(sign);
    // Pflanzkübel mit Büschen auf dem Vorplatz
    for (const [x, z] of [[1.45, 1.45], [-1.45, 1.45], [1.45, -1.45], [-1.45, -1.45]]) {
      box(0.5, 0.35, 0.5, M('#7a7f8a'), x, 0.3, z);
      const b = kit.bush(0.32, '#4f9a3f', rand);
      b.position.set(x, 0.45, z);
      parts.push(b);
    }
    // Dach: Hubschrauberlandeplatz mit H und Ring, Antenne mit Blinklicht, Leuchtreklame
    const top = y;
    parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.05, 24), M('#3a3f48')), 0, top + 0.03, 0));
    const ring = at(new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.03, 4, 28), M('#ffd23f')), 0, top + 0.07, 0);
    ring.rotation.x = Math.PI / 2;
    parts.push(ring);
    for (const x of [-0.16, 0.16]) box(0.07, 0.02, 0.5, M('#ffffff'), x, top + 0.07, 0);
    box(0.3, 0.02, 0.07, M('#ffffff'), 0, top + 0.07, 0);
    box(0.08, 2.2, 0.08, M('#c8d0d8', { metalness: 0.6 }), 0.55, top + 1.1, -0.55);
    const blink = E('#ff3a4a', 2);
    parts.push(at(new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), blink), 0.55, top + 2.28, -0.55));
    const ad = signBoard('COINMASTER', { w: 1.3, h: 0.32, bg: '#1a0e24', fg: '#ff7ae0' });
    ad.position.set(0, top + 0.32, 0.72);
    parts.push(ad);
    const tower = group(...parts);
    ctx.put(tower, p[0], p[1], { rot: false });
    tower.lookAt(0, tower.position.y, 0); // Eingang zur Inselmitte
    ctx.anims.push((t) => (blink.emissiveIntensity = Math.sin(t * 4) > 0 ? 2.2 : 0.2));
  },
  // Eisburg (Werkstatt-Wunsch): Ringmauer mit Zinnen und Eiszapfen, vier Ecktürme und ein hoher Bergfried mit
  // Spitzhelmen aus durchscheinendem Eis, Tor mit Bogen, innen leuchtet es blau aus den Fensterschlitzen
  eis(ctx, kit) {
    const { M, E, at, group } = kit;
    const p = ctx.spot(4.4, 4, 9);
    if (!p) return;
    const parts = [];
    const add = (m, x, y, z) => { at(m, x, y, z); parts.push(m); return m; };
    const ice = M('#bfe8ff', { roughness: 0.12, metalness: 0.1, transparent: true, opacity: 0.85 });
    const iceDeep = M('#8fd0f4', { roughness: 0.1, metalness: 0.15, transparent: true, opacity: 0.9 });
    const snow = M('#f4fbff', { roughness: 0.6 }), spire = M('#dff4ff', { roughness: 0.08, transparent: true, opacity: 0.75 });
    const glow = E('#5ac8ff', 1.4);
    const W = 5.4, WH = 1.7, WT = 0.45;
    // Ringmauer mit Zinnen und Eiszapfen (vorne mit Tor)
    for (const [dx, dz, along] of [[0, -1, 'x'], [-1, 0, 'z'], [1, 0, 'z'], [0, 1, 'x']]) {
      const front = dz === 1;
      const segs = front ? [[-W / 2, -0.7], [0.7, W / 2]] : [[-W / 2, W / 2]];
      for (const [a0, a1] of segs) {
        const len = a1 - a0, mid = (a0 + a1) / 2;
        const wx = along === 'x' ? mid : (dx * W) / 2, wz = along === 'z' ? mid : (dz * W) / 2;
        add(new THREE.Mesh(new THREE.BoxGeometry(along === 'x' ? len : WT, WH, along === 'z' ? len : WT), ice), wx, WH / 2, wz);
        add(new THREE.Mesh(new THREE.BoxGeometry(along === 'x' ? len : WT + 0.08, 0.1, along === 'z' ? len : WT + 0.08), snow), wx, WH + 0.05, wz);
        for (let t = a0 + 0.25; t < a1 - 0.1; t += 0.55) {
          const mx = along === 'x' ? t : (dx * W) / 2, mz = along === 'z' ? t : (dz * W) / 2;
          add(new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.32, 0.28), iceDeep), mx, WH + 0.26, mz);
          const ic = add(new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.32 + ((t * 7) % 0.25), 5), spire), mx + dx * (WT / 2 + 0.02), WH - 0.2, mz + dz * (WT / 2 + 0.02));
          ic.rotation.x = Math.PI;
        }
      }
    }
    // Tor: Bogen aus Eis über der Öffnung, Torflügel halb offen, Licht dahinter
    add(new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.16, 6, 14, Math.PI), iceDeep), 0, WH - 0.35, W / 2);
    for (const sx of [-1, 1]) add(new THREE.Mesh(new THREE.BoxGeometry(0.22, WH + 0.5, 0.6), iceDeep), sx * 0.82, (WH + 0.5) / 2, W / 2);
    add(new THREE.Mesh(new THREE.BoxGeometry(1.2, WH - 0.4, 0.05), glow), 0, (WH - 0.4) / 2, W / 2 - 0.4);
    // Ecktürme mit Spitzhelm
    for (const [x, z] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      const tx = (x * W) / 2, tz = (z * W) / 2, TH = 3.2;
      add(new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.7, TH, 12), ice), tx, TH / 2, tz);
      add(new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.16, 12), snow), tx, TH + 0.08, tz);
      add(new THREE.Mesh(new THREE.ConeGeometry(0.74, 1.9, 12), spire), tx, TH + 1.1, tz);
      add(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.42, 0.05), glow), tx + x * 0.02, TH * 0.65, tz + z * 0.69);
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        const ic = add(new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.3, 5), spire), tx + Math.cos(a) * 0.68, TH - 0.18, tz + Math.sin(a) * 0.68);
        ic.rotation.x = Math.PI;
      }
    }
    // Bergfried in der Mitte: hoher Turm mit Galerie, leuchtenden Fenstern und schlanker Spitze
    add(new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.6, 2.2), ice), 0, 1.8, -0.4);
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 2.6, 12), iceDeep), 0, 4.9, -0.4);
    add(new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.14, 12), snow), 0, 6.27, -0.4);
    add(new THREE.Mesh(new THREE.ConeGeometry(1.0, 3.0, 12), spire), 0, 7.85, -0.4);
    add(new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), glow), 0, 9.6, -0.4);
    for (const [x, z] of [[0, 0.71], [0.71, 0], [-0.71, 0], [0, -0.71]]) {
      add(new THREE.Mesh(new THREE.BoxGeometry(Math.abs(x) > 0 ? 0.05 : 0.22, 0.7, Math.abs(z) > 0 ? 0.05 : 0.22), glow), x * 1.55, 2.4, -0.4 + z * 1.55);
      add(new THREE.Mesh(new THREE.BoxGeometry(Math.abs(x) > 0 ? 0.05 : 0.18, 0.5, Math.abs(z) > 0 ? 0.05 : 0.18), glow), x * 1.27, 5.1, -0.4 + z * 1.27);
    }
    const castle = group(...parts);
    ctx.put(castle, p[0], p[1], { rot: false });
    castle.lookAt(0, castle.position.y, 0); // Tor zur Inselmitte
  },
  // Lava: kein Lavatempel mehr (Werkstatt-Wunsch), Wahrzeichen ist der Vulkan (worldFactory.js)
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
  // Zuckerschloss (Werkstatt-Wunsch „Palast verbessern“): Tortensockel mit Zuckergussrand, Hauptbau wie eine
  // Etagentorte, vier Zuckerstangen-Türme mit Waffeldach und Streuseln, Tor mit Gummibärchen-Wachen,
  // rosa leuchtende Fenster, Lollis als Fahnen und eine Kirsche obendrauf
  candy(ctx, kit) {
    const { M, E, at, group } = kit;
    const p = ctx.spot(4, 4, 9);
    if (!p) return;
    const parts = [];
    const add = (m, x, y, z) => (parts.push(at(m, x, y, z)), parts[parts.length - 1]);
    const icing = M('#fff4fa'), pink = M('#ffb3dc'), choco = M('#7a4428'), glow = E('#ff8ac8', 1.2);
    add(new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.7, 0.4, 24), choco), 0, 0.2, 0);
    add(new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.14, 6, 40), icing), 0, 0.42, 0).rotation.x = Math.PI / 2;
    for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; add(new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), icing), Math.cos(a) * 3.6, 0.32, Math.sin(a) * 3.6).scale.set(1, 1.6, 1); }
    // Hauptbau als Etagentorte
    const tiers = [[2.0, 1.6, '#ffb3dc'], [1.5, 1.3, '#fff0f6'], [1.0, 1.1, '#ffd6ec']];
    let y = 0.4;
    for (const [r, h, c] of tiers) {
      add(new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 24), M(c)), 0, y + h / 2, 0);
      add(new THREE.Mesh(new THREE.TorusGeometry(r, 0.1, 6, 36), icing), 0, y + h, 0).rotation.x = Math.PI / 2;
      for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; add(new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 4), icing), Math.cos(a) * r, y + h - 0.12, Math.sin(a) * r).scale.set(1, 1.8, 1); }
      for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2 + 0.3; const w = add(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.42, 0.06), glow), Math.cos(a) * (r + 0.01), y + h * 0.5, Math.sin(a) * (r + 0.01)); w.rotation.y = -a + Math.PI / 2; }
      y += h;
    }
    add(new THREE.Mesh(new THREE.SphereGeometry(0.4, 14, 10), M('#e0203a', { roughness: 0.3 })), 0, y + 0.35, 0);
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 5), M('#3a8a3a')), 0.1, y + 0.85, 0);
    // vier Zuckerstangen-Türme mit Waffeldach und Streuseln, Lolli-Fahnen
    const tops = ['#ff5fb0', '#5fd3ff', '#ffe25f', '#7aff8a'];
    [[2.6, 2.6], [-2.6, 2.6], [2.6, -2.6], [-2.6, -2.6]].forEach(([x, z], i) => {
      for (let k = 0; k < 8; k++) add(new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.5, 14), M(k % 2 ? '#ffffff' : '#ff3a5a')), x, 0.65 + k * 0.5, z);
      add(new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.16, 14), icing), x, 4.5, z);
      add(new THREE.Mesh(new THREE.ConeGeometry(0.78, 1.5, 14), M('#e0a860')), x, 5.3, z);
      for (let k = 0; k < 6; k++) add(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.04), M(tops[(i + k) % 4])), x + Math.cos(k * 1.1) * 0.45, 4.95 + (k % 3) * 0.2, z + Math.sin(k * 1.1) * 0.45);
      add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 5), icing), x, 6.4, z);
      add(new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.08, 16), M(tops[i])), x, 6.9, z).rotation.x = Math.PI / 2;
      add(new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.32, 0.06), glow), x * 1.21, 2.5, z * 1.21);
    });
    // Tor mit Gummibärchen-Wachen
    add(new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.3, 0.12), choco), 0, 1.05, 2.02);
    add(new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.12, 6, 16, Math.PI), M('#ff5fb0')), 0, 1.7, 2.05);
    for (const sx of [-1, 1]) {
      const bear = new THREE.Group();
      const c = M(sx > 0 ? '#ff5a5a' : '#5ad18a', { transparent: true, opacity: 0.85, roughness: 0.2 });
      bear.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), c), 0, 0.35, 0), at(new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), c), 0, 0.85, 0));
      for (const ex of [-0.15, 0.15]) bear.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 4), c), ex, 1.06, 0));
      bear.position.set(sx * 1.1, 0.4, 2.6);
      parts.push(bear);
    }
    const castle = group(...parts);
    ctx.put(castle, p[0], p[1], { rot: false });
    castle.lookAt(0, castle.position.y, 0);
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
  // Polarlicht über dem Eis: ein Lichtvorhang aus WorldFx (roblox/js/worldFxLuau.js, auroraCurtain)
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
    scatter(9, () => rockMesh(rr(0.1, 0.22), '#1a1614', rand, rand() < 0.4 ? E('#ff3a0a', 0.8) : null), 0.18);
  } else if (id === 'hoehle') {
    scatter(4, () => mushroom(rr(0.18, 0.32), ['#6ae8ff', '#b07bff', '#ff7ae0'][Math.floor(rand() * 3)], rand, true), 0.2);
  } else if (id === 'candy') {
    const cols = ['#ff5fb0', '#5fd3ff', '#ffe25f', '#7aff8a', '#b07bff'];
    scatter(3, (i) => at(new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), M(cols[i % 5])), 0, 0.1, 0), 0.12);
  }
}

// ── Leben und Himmelseffekte als Partikelquellen (Webseiten-Einheiten) ──
function emitters(ctx) {
  const R = ctx.R, id = ctx.world.id, list = (ctx.shared.emitters = ctx.shared.emitters || []);
  const add = (name, pos, size, colors, particleSize, rate, speed, lifetime, opts = {}) =>
    list.push({ name, pos, size, colors, particleSize, rate, speed, lifetime, spread: opts.spread ?? [180, 180], direction: opts.direction ?? 'Top', lightEmission: opts.light ?? 0, ...opts.extra });
  const birds = () => add('Voegel', [0, 13, 0], [R * 2.4, 2, R * 2.4], ['#3a3a48', '#55556a'], 0.5, 3, [1.2, 2.2], [8, 12]);
  if (id === 'normal') {
    add('Schmetterlinge', [0, 2, 0], [R * 2, 3, R * 2], ['#ff8ad8', '#ffd84a', '#8ad8ff', '#ffffff'], 0.32, 6, [0.25, 0.7], [6, 10], { light: 0.2 });
    birds();
  } else if (id === 'wald') {
    // wenige Blätter, die langsam taumelnd sinken: Luftwiderstand bremst, ein leichter Wind treibt sie seitlich
    add('Blaetter', [0, 9, 0], [R * 2, 3, R * 2], ['#5aa850', '#3f8a46', '#e8a040'], 0.22, 3, [0.15, 0.4], [14, 20], {
      direction: 'Bottom', spread: [50, 50],
      extra: { acceleration: [0.08, -0.06, 0.05], drag: 0.5, rotSpeed: [-160, 160], transparency: [[0, 1], [0.1, 0.25], [0.85, 0.35], [1, 1]] },
    });
    birds();
  } else if (id === 'stadt') {
    birds();
    add('Lichter', [0, 6, 0], [R * 2, 8, R * 2], ['#ffe7a8', '#bff0ff'], 0.18, 6, [0.1, 0.3], [5, 9], { light: 1 });
  } else if (id === 'eis') {
    // Polarlicht: der Lichtvorhang aus WorldFx (auroraCurtain); früher hier Leuchtpartikel am Himmel
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

