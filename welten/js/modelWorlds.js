// Welten aus Modellen der CC0-Pakete (KayKit, assets/modelle/bibliothek.glb). Ein Modell steht in der
// Webseiten-Szene als unsichtbarer Kasten (Platzhalter) mit userData.rbx.model; der Export macht daraus ein
// Teil „ModellPlatz“, das Roblox-Skript CoinmasterModelle und die Vorschau setzen dort das echte Modell ein.
//
// MODEL_WORLDS[id] = { landmark, build(ctx, kit), backdrop(ctx, kit) }
//   landmark  true: das Wahrzeichen aus planet1.js bleibt (sonst baut build eines)
//   build     ersetzt den alten Grundbau (BUILDERS/EXTRAS in worldFactory.js)
//   backdrop  ersetzt die Kulisse aus planet1.js

import * as THREE from 'three';
import { creek, layOnGround } from './detail.js';
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
// Die Unterseite modelliert jetzt die Inselhülle (roblox/js/islandShell.js); die Modell-Felsen bleiben abgeschaltet.
function rockUnderside(ctx, ids, { rings = 6, depth = 13, top = -1.1 } = {}) {
  if (!ctx.oldUnderside) return;
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
// (abgeschaltet: Wurzeln, Leuchtranken und Seetang hängen jetzt an der Inselhülle, islandShell.js)
function hangingRoots(ctx, n, { color = '#6b4a2e', tip = '#4f3a26', glow = false, outer = false } = {}) {
  if (!ctx.oldUnderside) return;
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
// (abgeschaltet: Rohre und Lampen hängen jetzt an der Inselhülle, islandShell.js)
function undersideLights(ctx, n, { pipe = '#7a7f8a', glow = '#ffd27a' } = {}) {
  if (!ctx.oldUnderside) return;
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
// (abgeschaltet wie die Wurzeln: Eiszapfen, Glut- und Leuchttropfen hängen jetzt an der Inselhülle)
function icicles(ctx, n, { color = '#cfeeff', glow = false } = {}) {
  if (!ctx.oldUnderside) return;
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
  if (!ctx.oldUnderside) return; // Kristalle wachsen jetzt als echte Prismen aus der Inselhülle
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
  if (!ctx.oldUnderside) return; // Zuckerguss läuft jetzt an der Inselhülle über die Kante
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
  if (!ctx.oldUnderside) return; // Perlenschnüre hängen jetzt an der Inselhülle
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
    // an der fast senkrechten Erdwand der Inselhülle (Radius R), leicht davor
    const a = (i / n) * TAU + rr(-0.04, 0.04), r = R + 0.22, y = -1.6 - rr(0, 1.2);
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

// ── Schwebende Inseln (Himmel) ──
// Die Insel selbst modelliert die Hülle (Markierung userData.rbx.isle → islandShell.miniIsland: Kuppel, Rand,
// Felszunge im Stil der Welt). Obendrauf stehen Modelle aus dem Paket; die sechseckigen Hügelplatten werden durch
// einzelne Bäume ersetzt, damit keine kantigen Platten in der Luft hängen.
const HEX_TOP = /^(hills?_|hill_single|mountain_)/;
// Kuppelhöhe einer Mini-Insel im Abstand d von der Mitte (wie islandShell.isleDomeAt)
export function domeAt(w, d) {
  const dome = w * 0.12, k = d / (w * 0.55);
  return k <= 1 ? dome * (1 - 0.3 * k) : dome * 0.7 * Math.max(0, 1 - (d - w * 0.55) / (w * 0.45));
}
// Bäume (oder andere Modelle) verteilt auf der Kuppel einer Insel, außerhalb eines freien Kreises (Berg)
function isleTrees(ctx, x, y, z, half, ids, n, size, keep = null) {
  const { rand, root } = ctx;
  for (let i = 0, tries = 0; i < n && tries < n * 6; tries++) {
    const a = rand() * TAU, d = half * (n > 1 ? 0.12 + rand() * 0.66 : 0);
    const dx = Math.cos(a) * d, dz = Math.sin(a) * d;
    if (keep && Math.hypot(dx - keep[0], dz - keep[1]) < keep[2]) continue;
    const id = pick(rand, ids);
    if (!MODELS[id]) continue;
    const g = model(id, (size[0] + rand() * (size[1] - size[0])) / MODELS[id].size[0], { sky: true });
    g.position.set(x + dx, y + domeAt(half, d) - g.userData.base - 0.05, z + dz);
    g.rotation.y = rand() * TAU;
    root.add(g);
    i++;
  }
}
function treesOf(variant) {
  return ['tree_single_A', 'tree_single_B', 'trees_A_small', 'trees_B_small'].map((t) => t + variant).filter((t) => MODELS[t]);
}
function floatingIsle(ctx, x, y, z, w, topId) {
  const { rand, root } = ctx;
  const half = w / 2, variant = topId.includes('@') ? '@' + topId.split('@')[1] : '';
  const mark = new THREE.Object3D();
  mark.position.set(x, y, z);
  mark.userData.rbx = { isle: { w: half, seed: `${Math.round(x * 10)}:${Math.round(z * 10)}` } };
  root.add(mark);
  if (!HEX_TOP.test(topId)) {
    if (!MODELS[topId]) return;
    const top = model(topId, (w * 0.8) / MODELS[topId].size[0], { sky: true });
    top.position.set(x, y + domeAt(half, 0) - top.userData.base - 0.05, z);
    top.rotation.y = rand() * TAU;
    root.add(top);
    return;
  }
  // Sechseckige Hügel- und Bergplatten des Pakets: Berg aus der Inselhülle, dazu Bäume
  const trees = treesOf(variant);
  if (/^mountain_/.test(topId) && w > 2.5) {
    mark.userData.rbx.isle.peak = { r: half * 0.5, h: half * (0.9 + rand() * 0.5), dx: 0, dz: 0, snow: /@eis/.test(topId) };
    if (/trees/.test(topId) && trees.length) isleTrees(ctx, x, y, z, half, trees, 2, [half * 0.3, half * 0.42], [0, 0, half * 0.55]);
    return;
  }
  const n = w > 4 ? 3 : w > 2.2 ? 2 : 1;
  if (trees.length) isleTrees(ctx, x, y, z, half, trees, n, [Math.min(3.2, w * 0.42), Math.min(3.2, w * 0.6)]);
}
// ── Nachbarinseln: große schwebende Inseln mit Berg und Bäumen in der Ferne (statt der Sechseck-Berge) ──
export function neighborIsles(ctx, { n = 6, w = [5.5, 8.5], r = [50, 63], y = [-10, 2], trees = null, peak = 0.7, snow = false, treeW = [2.2, 3.2], nTrees = [4, 7], onTop = null } = {}) {
  const { rand, rr } = ctx;
  const ids = trees || treesOf('');
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + rr(-0.22, 0.22), rad = rr(r[0], r[1]);
    const x = Math.cos(a) * rad, z = Math.sin(a) * rad, yy = rr(y[0], y[1]), half = rr(w[0], w[1]);
    const mark = new THREE.Object3D();
    mark.position.set(x, yy, z);
    mark.userData.rbx = { isle: { w: half, seed: `n${i}:${Math.round(x * 10)}` } };
    let keep = null;
    if (rand() < peak) {
      const pa = rand() * TAU, pd = half * rr(0, 0.25);
      const pk = { r: half * rr(0.42, 0.56), h: half * rr(1.0, 1.7), dx: Math.cos(pa) * pd, dz: Math.sin(pa) * pd, snow };
      mark.userData.rbx.isle.peak = pk;
      keep = [pk.dx, pk.dz, pk.r * 1.05];
    }
    ctx.root.add(mark);
    if (ids.length) isleTrees(ctx, x, yy, z, half, ids, Math.round(rr(nTrees[0], nTrees[1])), treeW, keep);
    onTop?.(x, yy, z, half, keep);
  }
}
// Inselchen in mittlerer Entfernung und kleine Brocken direkt am Inselrand
// onTop(x, y, z, half): eigene Deko obendrauf (y = Inselmitte, Höhe der Kuppe über domeAt), z. B. Kristalle
export function floatingIsles(ctx, { far = 6, near = 7, tops = ['hills_A_trees', 'hills_B_trees', 'hill_single_C'], small = ['hill_single_A', 'hill_single_C'], rock = 'rock_single_D', farW = [5, 9], farR = [12, 28], onTop = null } = {}) {
  const { rand, rr, R } = ctx;
  const isle = (x, y, z, w, id) => {
    floatingIsle(ctx, x, y, z, w, id);
    onTop?.(x, y, z, w / 2);
  };
  for (let i = 0; i < far; i++) {
    const a = (i / far) * TAU + rr(-0.25, 0.25), r = rr(R + farR[0], R + farR[1]);
    isle(Math.cos(a) * r, rr(-4, 7), Math.sin(a) * r, rr(farW[0], farW[1]), pick(rand, tops));
  }
  for (let i = 0; i < near; i++) {
    const a = rand() * TAU, r = rr(R + 2.5, R + 6.5);
    isle(Math.cos(a) * r, rr(-3, 1.5), Math.sin(a) * r, rr(1.2, 2.6), pick(rand, small));
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
  // flaches Bachbett mit Ufer statt einer Röhre (dem Gelände nach)
  creek(ctx, kit, curve, { width: 0.9 });
  void root;
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
      // festgetretener Dorfplatz um den Brunnen, Trampelpfade zu den Häusern
      ctx.paint(vc[0], vc[1], 2.9, '#b09670', 'Ground');
      stand(ctx, model('building_well_blue', 3.2), vc[0], vc[1]);
      const houses = ['building_home_A_blue', 'building_home_B_red', 'building_home_A_green', 'building_home_B_yellow', 'building_home_A_red'];
      const a0 = rand() * TAU;
      for (let i = 0; i < 5; i++) {
        const a = a0 + (i / 5) * TAU, x = vc[0] + Math.cos(a) * 4.2, z = vc[1] + Math.sin(a) * 4.2;
        if (Math.hypot(x, z) > R - 2 || !ctx.free(x, z, 1.4)) continue;
        reserve(x, z, 1.6);
        stand(ctx, model(houses[i], 3.6), x, z, { face: vc });
        ctx.paint((x + vc[0]) / 2, (z + vc[1]) / 2, 1.1, '#a68a62', 'Ground');
        // Büsche und Blumen am Haus (auf der Seite weg vom Platz)
        const ox = (x - vc[0]) / 4.2, oz = (z - vc[1]) / 4.2;
        for (const s of [-1, 1]) {
          const bx = x + ox * 1.1 - oz * s * 1.5, bz = z + oz * 1.1 + ox * s * 1.5;
          if (ctx.free(bx, bz, 0.3)) ctx.put(rand() < 0.6 ? kit.bush(rr(0.28, 0.4), '#4f9a3f', rand) : kit.flowerPatch(['#ff7a9a', '#ffe25f', '#ffffff'], rand, 4), bx, bz);
        }
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
      ctx.paint(field[0], field[1], 2.3, '#8a6a46', 'Ground'); // Ackerboden unter dem Korn
      stand(ctx, model('building_grain', 1.9), field[0], field[1], { sink: 0.16 }); // Sechseckplatte im Boden versenkt, nur das Korn schaut heraus
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
    // Laubbäume zwischen den Tannen (kantige Kronen), Büsche in Gruppen, Steingruppen. Feste Anzahl:
    // rMax unter R − 2,5, sonst vervielfacht scatter mit der Inselfläche
    const inner = R - 2.6;
    ctx.scatter(6, () => kit.roundTree(rr(2.2, 2.9), pick(rand, ['#4f9a3f', '#5aa84a', '#468f3a']), rand), 1, 4, inner);
    ctx.scatter(14, () => {
      const g = new THREE.Group();
      for (let i = 0; i < 2; i++) {
        const b = kit.bush(rr(0.26, 0.42), pick(rand, ['#4f9a3f', '#3f8a3a', '#5aa84a']), rand);
        b.position.set(rr(-0.45, 0.45), 0, rr(-0.45, 0.45));
        g.add(b);
      }
      return g;
    }, 0.8, 2, inner);
    scatterModels(ctx, 4, ['rock_single_B', 'rock_single_C', 'rock_single_E'], 2.2, 3, { gap: 0.6 });
    // Blumen wachsen in Gruppen einer Farbe (das Paket hat keine Blumen)
    ctx.scatter(16, () => kit.flowerPatch(['#ff7a9a', '#ffe25f', '#ffffff', '#b07bff', '#ff9a4a'], rand), 0.5, 2, inner);
  },
  backdrop(ctx) {
    // Umgebung: Nachbarinseln mit Schneebergen, schwebende Inselchen und Brocken am Rand (Wolken malt das Himmelsbild)
    neighborIsles(ctx, { n: 6, snow: true, trees: ['tree_single_A', 'tree_single_B', 'trees_A_medium', 'trees_B_medium', 'trees_B_small'] });
    floatingIsles(ctx);
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
    // Waldboden wie im Nadelwald: Flecken aus Nadelstreu und dunklem Moos statt glattem Wiesengrün
    for (let i = 0; i < 18; i++) {
      const a = rand() * TAU, r = Math.sqrt(rand()) * (R - 2);
      const [c, m] = pick(rand, [['#55603a', 'Ground'], ['#4a7a30', 'Grass'], ['#635238', 'Ground']]);
      ctx.paint(Math.cos(a) * r, Math.sin(a) * r, rr(1.2, 2.4), c, m);
    }
    // Unterholz: Farne, Moospolster, umgestürzte Stämme mit Moos, junge Tannen
    const inner = R - 2.6;
    ctx.scatter(18, () => kit.fern(rr(0.45, 0.72), pick(rand, ['#3f8a3a', '#4f9a3f', '#5aa848']), rand), 0.45, 2, inner);
    ctx.scatter(14, () => kit.mossMound(rr(0.4, 0.7), pick(rand, ['#5fae3a', '#4f9a32', '#6abf44']), rand), 0.5, 2, inner);
    ctx.scatter(4, () => kit.fallenLog(rr(1.8, 2.6), rr(0.16, 0.24), '#6b4a2e', rand), 1.3, 3, inner);
    scatterModels(ctx, 10, ['tree_single_A', 'tree_single_B'], 0.9, 1.3, { rMax: inner, gap: 0.5 }); // junge Tannen
  },
  backdrop(ctx) {
    neighborIsles(ctx, { n: 7, peak: 0.5, trees: ['trees_A_large', 'trees_A_medium', 'trees_B_large', 'tree_single_A', 'tree_single_B'], nTrees: [6, 9] });
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
  build(ctx, kit) {
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
    // Stadtpark in einer freien Ecke: Rasen, Brunnen, Laubbäume, Bänke zum Brunnen, Blumen
    const park = ctx.spot(2.4, 4, R - 2.4) || ctx.spot(2, 4, R - 2);
    if (park) {
      const [px, pz] = park;
      ctx.paint(px, pz, 2.7, '#5fae4f', 'Grass');
      reserve(px, pz, 2.5);
      ctx.put(kit.fountain(ctx.anims), px, pz, { rot: false });
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * TAU + 0.4, x = px + Math.cos(a) * 2, z = pz + Math.sin(a) * 2;
        ctx.put(kit.roundTree(rr(1.8, 2.3), pick(rand, ['#4f9a3f', '#5aa84a']), rand), x, z);
        const b = a + Math.PI / 4;
        stand(ctx, model('city_bench', 2.6), px + Math.cos(b) * 1.35, pz + Math.sin(b) * 1.35, { face: park });
        ctx.put(kit.flowerPatch(['#ff7a9a', '#ffe25f', '#ffffff'], rand, 4), px + Math.cos(b + 0.4) * 2.1, pz + Math.sin(b + 0.4) * 2.1);
      }
    }
    // Uferpromenade am Inselrand: Geländer aus Pfosten und Handlauf, davor abwechselnd Baum im Kübel,
    // Bank und Laterne (vorher ein leerer grauer Streifen)
    {
      const rail = new THREE.MeshStandardMaterial({ color: '#5a6270', metalness: 0.5, roughness: 0.4 });
      const rr0 = R - 0.45, n = Math.round((TAU * rr0) / 1.3);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU, x = Math.cos(a) * rr0, z = Math.sin(a) * rr0, y = ctx.height(x, z);
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.7, 6), rail);
        post.position.set(x, y + 0.35, z);
        ctx.root.add(post);
        const len = TAU * rr0 / n, bar = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, len), rail);
        const am = a + Math.PI / n;
        bar.position.set(Math.cos(am) * rr0, y + 0.68, Math.sin(am) * rr0);
        bar.rotation.y = -am;
        ctx.root.add(bar);
      }
      const rp = R - 1.7, slots = Math.round((TAU * rp) / 3.2);
      for (let i = 0; i < slots; i++) {
        const a = (i / slots) * TAU + 0.15, x = Math.cos(a) * rp, z = Math.sin(a) * rp;
        if (!ctx.free(x, z, 0.6)) continue;
        reserve(x, z, 0.7);
        const kind = i % 3;
        if (kind === 0) {
          const box = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.35, 0.8), new THREE.MeshStandardMaterial({ color: '#8a8f9a' }));
          box.position.y = 0.17;
          const g = new THREE.Group();
          g.add(box);
          const t = kit.roundTree(rr(1.6, 2), pick(rand, ['#4f9a3f', '#5aa84a']), rand);
          t.position.y = 0.3;
          g.add(t);
          ctx.put(g, x, z);
        } else if (kind === 1) stand(ctx, model('city_bench', 2.6), x, z, { face: [0, 0] });
        else stand(ctx, model('city_streetlight', 2.6), x, z, { face: [0, 0] });
      }
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
  build(ctx, kit) {
    const { R, rr } = ctx;
    place(ctx, 'building_tower_A_blue@eis', 3.6, { rMin: 6, rMax: R - 3, face: [0, 0] });
    const camp = clearing(ctx, 3.2, 4, R - 3);
    if (camp) {
      stand(ctx, model('resource_lumber', 2.4), camp[0], camp[1]);
      around(ctx, camp, [['tent', 3.2], ['tent', 3.2], ['lantern_standing', 0.9], ['crate_A_big', 3.2], ['barrel', 3.2], ['sack', 3.4]], 1.8, 2.8);
    }
    scatterModels(ctx, 6, ['trees_A_large@eis', 'trees_A_medium@eis', 'trees_A_small@eis'], 2.3, 2.8, { gap: 0.6 });
    scatterModels(ctx, 10, ['tree_single_A@eis', 'tree_single_B@eis'], 2.6, 3.4, { gap: 0.75 });
    scatterModels(ctx, 6, ['rock_single_A@eis', 'rock_single_B@eis', 'rock_single_C@eis', 'rock_single_E@eis'], 2.6, 4, { gap: 0.8 });
    // Kontrast wie im Gebirge: dunkle Tannen mit Schneehauben, dunkler Fels ragt aus dem Schnee, Schneewehen
    const inner = R - 2.6;
    ctx.scatter(9, () => kit.snowPine(rr(1.8, 2.8), pick(ctx.rand, ['#2f5a3a', '#355f40', '#2a5236']), ctx.rand), 0.8, 3, inner);
    ctx.scatter(7, () => {
      const g = kit.rockMesh(rr(0.45, 0.8), pick(ctx.rand, ['#5a6270', '#4e5562']), ctx.rand);
      const cap = kit.snowDrift(0.4, ctx.rand);
      cap.position.y = 0.32;
      cap.scale.setScalar(0.9);
      g.add(cap);
      return g;
    }, 0.6, 2, inner);
    ctx.scatter(10, () => kit.snowDrift(rr(0.6, 1.1), ctx.rand), 0.7, 2, inner);
  },
  backdrop(ctx) {
    neighborIsles(ctx, { n: 6, snow: true, peak: 0.8, trees: ['tree_single_A@eis', 'tree_single_B@eis', 'trees_A_medium@eis', 'trees_A_small@eis'] });
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
  build(ctx, kit) {
    const { R, rand, rr } = ctx;
    const forge = place(ctx, 'building_blacksmith_red', 3.6, { rMin: 5, rMax: R - 3, face: [0, 0] });
    if (forge) around(ctx, [forge.position.x, forge.position.z], [['barrel_large', 0.7], ['keg', 0.7], ['torch_lit', 1.6], ['torch_lit', 1.6], ['crates_stacked', 0.7]], 2.6, 3.6);
    const ruin = place(ctx, 'building_destroyed@lava', 3.4, { rMin: 5, rMax: R - 3 });
    if (ruin) around(ctx, [ruin.position.x, ruin.position.z], [['rubble_large', 0.45], ['rubble_half', 0.6], ['chest_gold', 0.8], ['torch_lit', 1.6]], 2.4, 3.6);
    scatterModels(ctx, 7, ['tree_dead_large', 'tree_dead_medium', 'tree_dead_small'], 0.55, 0.75, { gap: 0.8 });
    scatterModels(ctx, 2, ['tree_single_A@lava'], 2.6, 3.2, { gap: 0.8 });
    scatterModels(ctx, 3, ['rubble_half'], 0.35, 0.5, { gap: 0.8 });
    scatterModels(ctx, 9, ['rock_single_A@lava', 'rock_single_B@lava', 'rock_single_C@lava', 'rock_single_D@lava', 'rock_single_E@lava'], 2.8, 4.4, { gap: 0.8 });
    // große Felsbrocken statt der Sechseck-Bergplatten (deren Sockel stand kantig aus dem Boden)
    scatterModels(ctx, 3, ['rock_single_C@lava', 'rock_single_D@lava', 'rock_single_B@lava'], 6.5, 8.5, { rMin: R * 0.55, gap: 0.7 });
    // wie auf einem echten Lavafeld: Flecken aus Asche und erkalteter Kruste, Felder aus scharfkantigem
    // Lavageröll, glühende Risse im Boden, kleine Schlackenkegel und zähe, dunkelgrüne Sträucher
    const inner = R - 2.6;
    for (let i = 0; i < 16; i++) {
      const a = rand() * TAU, r = Math.sqrt(rand()) * (R - 2);
      const [c, m] = pick(rand, [['#3e3632', 'Slate'], ['#5a4e48', 'Ground'], ['#2a2422', 'Basalt']]);
      ctx.paint(Math.cos(a) * r, Math.sin(a) * r, rr(1.2, 2.6), c, m);
    }
    ctx.scatter(7, () => {
      const g = new THREE.Group();
      for (let i = 0; i < 5; i++) {
        const rock = kit.rockMesh(rr(0.45, 0.7), pick(rand, ['#1e1a18', '#2a2422', '#161210']), rand);
        rock.scale.setScalar(rr(0.45, 0.8));
        rock.position.set(rr(-0.7, 0.7), 0, rr(-0.7, 0.7));
        rock.rotation.y = rand() * TAU;
        g.add(rock);
      }
      return g;
    }, 1, 2, inner);
    const glow = new THREE.MeshStandardMaterial({ color: '#ff5a14', emissive: '#ff5a14', emissiveIntensity: 1.4 });
    for (let c = 0; c < 6; c++) {
      const p0 = ctx.spot(0.4, 3, inner);
      if (!p0) continue;
      let [x, z] = p0, a = rand() * TAU;
      for (let s = 0; s < 5; s++) {
        const len = rr(0.5, 0.9), nx = x + Math.cos(a) * len, nz = z + Math.sin(a) * len;
        if (Math.hypot(nx, nz) > inner) break;
        const crack = new THREE.Mesh(new THREE.BoxGeometry(len, 0.04, 0.07), glow);
        layOnGround(crack, ctx.height, (x + nx) / 2, (z + nz) / 2, { yaw: -a, lift: 0.01 });
        ctx.root.add(crack);
        x = nx; z = nz; a += rr(-0.9, 0.9);
      }
    }
    ctx.scatter(2, () => {
      const g = new THREE.Group();
      const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 1.2, 1.1, 9, 1, true), new THREE.MeshStandardMaterial({ color: '#4a2a22', flatShading: true }));
      cone.position.y = 0.5;
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.05, 9), glow);
      top.position.y = 1.0;
      g.add(cone, top);
      return g;
    }, 1.3, 3, inner);
    ctx.scatter(8, () => kit.bush(rr(0.22, 0.34), pick(rand, ['#3f6a3a', '#4a7240', '#365e34']), rand), 0.4, 2, inner);
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
  build(ctx, kit) {
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
    // große Felsbrocken statt der Sechseck-Bergplatten (deren Sockel stand kantig aus dem Boden)
    scatterModels(ctx, 4, ['rock_single_B@hoehle', 'rock_single_D@hoehle', 'rock_single_E@hoehle'], 6, 8, { rMin: R * 0.55, gap: 0.7 });
    scatterModels(ctx, 8, ['rock_single_A@hoehle', 'rock_single_B@hoehle', 'rock_single_C@hoehle', 'rock_single_D@hoehle', 'rock_single_E@hoehle'], 2.8, 4.4, { gap: 0.8 });
    scatterModels(ctx, 5, ['torch_lit'], 1.6, 1.6, { gap: 1 });
    scatterModels(ctx, 3, ['lantern_standing'], 0.9, 0.9, { gap: 1 });
    // nasser, dunkler Boden in Flecken, Geröllhaufen von der Decke
    const { rand, rr } = ctx;
    for (let i = 0; i < 14; i++) {
      const a = rand() * TAU, r = Math.sqrt(rand()) * (R - 2);
      const [c, m] = pick(rand, [['#2e2a3c', 'Slate'], ['#3a3448', 'Pebble'], ['#463e52', 'Slate']]);
      ctx.paint(Math.cos(a) * r, Math.sin(a) * r, rr(1.2, 2.4), c, m);
    }
    ctx.scatter(5, () => {
      const g = new THREE.Group();
      for (let i = 0; i < 4; i++) {
        const rock = kit.rockMesh(rr(0.45, 0.6), pick(rand, ['#2e2838', '#3a3446', '#262230']), rand);
        rock.scale.setScalar(rr(0.5, 0.85));
        rock.position.set(rr(-0.6, 0.6), 0, rr(-0.6, 0.6));
        g.add(rock);
      }
      return g;
    }, 0.9, 2, R - 2.6);
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
    // wie in einem Süßwarenladen: Zuckergussflecken in Minze, Zitrone und Himbeere, Gummibären,
    // Gummidrops in Gruppen, Marshmallow-Türme, Lakritzschnecken
    const { rr } = ctx, inner = R - 2.6;
    for (let i = 0; i < 12; i++) {
      const a = rand() * TAU, r = Math.sqrt(rand()) * (R - 2);
      ctx.paint(Math.cos(a) * r, Math.sin(a) * r, rr(1.2, 2.2), pick(rand, ['#c8f4e0', '#fff2b8', '#ffc0dc', '#d8e4ff']), 'SmoothPlastic');
    }
    ['#ff4a5a', '#ffb02e', '#5ad84a', '#ffe23a', '#ff7ad0'].slice(0, 4).forEach((c) => {
      const p = ctx.spot(0.8, 4, inner);
      if (!p) return;
      ctx.reserve(p[0], p[1], 0.8);
      ctx.put(kit.gummyBear(rr(1.1, 1.6), c), p[0], p[1]);
    });
    ctx.scatter(8, () => {
      const g = new THREE.Group();
      for (let i = 0; i < 5; i++) {
        const d = kit.gumdrop(pick(rand, ['#ff4a7a', '#ffb02e', '#5ad84a', '#7ac8ff', '#c87aff', '#ffe23a']));
        d.position.set(rr(-0.5, 0.5), 0, rr(-0.5, 0.5));
        d.scale.setScalar(rr(0.6, 1));
        g.add(d);
      }
      return g;
    }, 0.6, 2, inner);
    ctx.scatter(5, () => {
      const g = new THREE.Group();
      const n = 2 + Math.floor(rand() * 3);
      for (let i = 0; i < n; i++) {
        const m = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.34, 16), new THREE.MeshStandardMaterial({ color: i % 2 ? '#ffd0e4' : '#fffaf4', roughness: 0.6 }));
        m.position.set(rr(-0.04, 0.04), 0.17 + i * 0.36, rr(-0.04, 0.04));
        m.rotation.y = rand();
        g.add(m);
      }
      return g;
    }, 0.4, 2, inner);
    ctx.scatter(4, () => {
      const g = new THREE.Group();
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.16, 20), new THREE.MeshStandardMaterial({ color: '#1e1a20', roughness: 0.4 }));
      const mid = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.2, 12), new THREE.MeshStandardMaterial({ color: '#ff5fb0' }));
      for (const m of [wheel, mid]) {
        m.rotation.x = Math.PI / 2;
        m.position.y = 0.4;
        g.add(m);
      }
      return g;
    }, 0.5, 2, inner);
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

// Reifenspuren: zwei parallele, dunkle Streifen entlang einer geschwungenen Fahrt (Mond, Mars)
function tracks(ctx, color, { n = 2, len = 14 } = {}) {
  const { rand, rr, R } = ctx;
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 1 });
  for (let t = 0; t < n; t++) {
    const p0 = ctx.spot(0.3, 3, R - 4);
    if (!p0) continue;
    let [x, z] = p0, a = rand() * TAU;
    for (let s = 0; s < len; s++) {
      const step = 0.7, nx = x + Math.cos(a) * step, nz = z + Math.sin(a) * step;
      if (Math.hypot(nx, nz) > R - 2) break;
      for (const side of [-1, 1]) {
        const ox = -Math.sin(a) * 0.32 * side, oz = Math.cos(a) * 0.32 * side;
        const strip = new THREE.Mesh(new THREE.BoxGeometry(step + 0.04, 0.025, 0.13), mat);
        layOnGround(strip, ctx.height, (x + nx) / 2 + ox, (z + nz) / 2 + oz, { yaw: -a, lift: 0.005 });
        ctx.root.add(strip);
      }
      x = nx; z = nz; a += rr(-0.25, 0.25);
    }
  }
}
// große, scharfkantige Findlinge (wie „Tracy's Rock“ bei Apollo 17) und Regolith-Flecken
function boulders(ctx, kit, colors, n = 3, size = [1.1, 1.7]) {
  const { rand, rr, R } = ctx;
  for (let i = 0; i < n; i++) {
    const p = ctx.spot(size[1] * 1.2, 3, R - 3);
    if (!p) continue;
    ctx.reserve(p[0], p[1], size[1]);
    const g = kit.rockMesh(rr(size[0], size[1]), pick(rand, colors), rand);
    g.scale.y = rr(0.9, 1.3);
    // zwei kleinere Bruchstücke daneben
    for (let k = 0; k < 2; k++) {
      const f = kit.rockMesh(rr(0.45, 0.6), pick(rand, colors), rand);
      const a = rand() * TAU;
      f.position.set(Math.cos(a) * size[0] * 1.1, 0, Math.sin(a) * size[0] * 1.1);
      g.add(f);
    }
    ctx.put(g, p[0], p[1]);
  }
}
function groundPatches(ctx, n, palette) {
  const { rand, rr, R } = ctx;
  for (let i = 0; i < n; i++) {
    const a = rand() * TAU, r = Math.sqrt(rand()) * (R - 2);
    const [c, m] = pick(rand, palette);
    ctx.paint(Math.cos(a) * r, Math.sin(a) * r, rr(1.3, 2.6), c, m);
  }
}

const MOND = {
  landmark: true, // Rakete auf der Startrampe
  keepBase: true, // Erde am Himmel, Krater, Flagge, Landefähre
  baseSpots: [[0.6, 0.4, 0.6], [-2, -1.6, 1.3]],
  build(ctx, kit) {
    const { R } = ctx;
    const base = clearing(ctx, 6, 5, R - 4);
    if (base) station(ctx, base, ['basemodule_A', 'basemodule_E', 'basemodule_garage']);
    // Regolith in helleren und dunkleren Flecken, Findlinge, Reifenspuren des Mondautos
    groundPatches(ctx, 14, [['#c2c4ca', 'Slate'], ['#8e9098', 'Rock'], ['#a8aab2', 'Sand']]);
    boulders(ctx, kit, ['#9a9da6', '#8a8d96', '#a8abb2'], 3);
    tracks(ctx, '#7a7d86', { n: 2, len: 16 });
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
  build(ctx, kit) {
    const { R, rand, rr } = ctx;
    const base = clearing(ctx, 5, 5, R - 4);
    if (base) station(ctx, base, ['basemodule_E', 'basemodule_C']);
    // wie in einer Gletscherhöhle: blankes Tiefeneis, Reif und dunkler Schotter im Wechsel
    groundPatches(ctx, 14, [['#1e4aa8', 'Glacier'], ['#cfe6ff', 'Snow'], ['#1a2648', 'Pebble'], ['#2f62c8', 'Ice']]);
    // vom Sturm geschliffene Eisrippen, alle in Windrichtung (+X) ausgerichtet
    const inner = R - 2.6;
    ctx.scatter(12, () => {
      const g = new THREE.Group();
      for (let i = 0; i < 3; i++) {
        const s = rr(0.4, 0.7);
        const m = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 0), new THREE.MeshStandardMaterial({ color: pick(rand, ['#bfe0ff', '#9fd0ff', '#e2f2ff']), flatShading: true }));
        m.userData.rbx = { facets: true, facetThick: 0.05, name: 'Eisrippe' };
        m.scale.set(2.4, 0.42, 0.7);
        m.position.set(i * 0.9 - 0.9 + rr(-0.2, 0.2), s * 0.15, rr(-0.5, 0.5));
        g.add(m);
      }
      return g;
    }, 1.2, 2, inner, { rot: false });
    // Eisblöcke aus klarem, blau leuchtendem Eis mit dunklen Schlieren
    ctx.scatter(6, () => {
      const g = new THREE.Group();
      const n = 2 + Math.floor(rand() * 3);
      for (let i = 0; i < n; i++) {
        const h = rr(1, 2.4), cone = kit.coneFacets(rr(0.3, 0.5), h, 5, new THREE.MeshStandardMaterial({ color: pick(rand, ['#4a9aff', '#6ab8ff', '#2f7ae8']), transparent: true, opacity: 0.8, roughness: 0.1, emissive: '#1a5ad8', emissiveIntensity: 0.35 }), rand, { wob: 0.4, tw: rand() * 3, name: 'Eisblock' });
        cone.position.set(rr(-0.5, 0.5), 0, rr(-0.5, 0.5));
        cone.rotation.set(rr(-0.25, 0.25), 0, rr(-0.25, 0.25));
        g.add(cone);
      }
      return g;
    }, 0.9, 2, inner);
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
  build(ctx, kit) {
    const { R, rand, rr } = ctx;
    // wie auf den Bildern der Rover: Staub in helleren und dunkleren Flecken, ein Feld aus kantigen dunklen
    // Steinen in allen Größen, kleine Sandrippeln, Reifenspuren
    groundPatches(ctx, 16, [['#d07a4a', 'Sand'], ['#9a4426', 'Ground'], ['#b8603a', 'Sand'], ['#7a3a22', 'Slate']]);
    const inner = R - 2.6;
    ctx.scatter(16, () => {
      const g = new THREE.Group();
      const n = 2 + Math.floor(rand() * 4);
      for (let i = 0; i < n; i++) {
        const rock = kit.rockMesh(0.5, pick(rand, ['#5a2a1a', '#6a3422', '#4a241a', '#7a3e28']), rand);
        rock.scale.setScalar(rr(0.25, 0.75));
        rock.position.set(rr(-0.9, 0.9), 0, rr(-0.9, 0.9));
        rock.rotation.y = rand() * TAU;
        g.add(rock);
      }
      return g;
    }, 0.9, 2, inner);
    ctx.scatter(8, () => {
      const g = new THREE.Group();
      for (let i = 0; i < 4; i++) {
        const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.4, 0), new THREE.MeshStandardMaterial({ color: '#d8885a', flatShading: true }));
        m.userData.rbx = { facets: true, facetThick: 0.04, name: 'Sandrippel' };
        m.scale.set(0.5, 0.18, 2.6);
        m.position.set(i * 0.42, 0, rr(-0.1, 0.1));
        g.add(m);
      }
      return g;
    }, 1.2, 2, inner, { rot: false });
    tracks(ctx, '#8a3a20', { n: 2, len: 14 });
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
  build(ctx, kit) {
    const { R, rand, rr } = ctx;
    // Handelsposten: drei Frachtlager um einen Landeplatz
    const hub = clearing(ctx, 6, 4, R - 5);
    if (hub) {
      stand(ctx, model('landingpad_large', 2.6), hub[0], hub[1]);
      stand(ctx, model('lander_base', 2.4), hub[0], hub[1], { sink: -1.2 });
      around(ctx, hub, [['cargodepot_A', 2.6], ['cargodepot_B', 2.6], ['cargodepot_C', 2.6], ['containers_A', 2.6], ['containers_C', 2.6]], 4.2, 5.4);
    }
    scatterModels(ctx, 2, ['structure_low', 'space_lights'], 2.4, 2.6, { gap: 0.9 });
    rocksOf(ctx, 'saturn');
    // erst nach Handelsposten und Sternwarte (die brauchen Platz)
    // Sandsteinwüste wie im Colorado-Plateau: ein großer Felsbogen, geschichtete Tafelfelsen in Ocker- und
    // Rosttönen, glatte Sandsteinplatten (Slickrock), Sandrippeln und zähe Wüstensträucher
    const inner = R - 2.6, bands = ['#c88a52', '#e0b07a', '#b8703e', '#d89a62', '#a8643a'];
    groundPatches(ctx, 14, [['#d8a868', 'Sand'], ['#c88a52', 'Rock'], ['#e6c08a', 'Sand'], ['#b07a48', 'Ground']]);
    const archAt = ctx.spot(2.8, 4, inner) || ctx.spot(2.2, 3, inner);
    if (archAt) {
      ctx.reserve(archAt[0], archAt[1], 2.6);
      // quer zur Insel gestellt: von der Mitte aus blickt man durch den Bogen
      const arch = kit.rockArch(2.3, 0.4, bands, rand);
      ctx.put(arch, archAt[0], archAt[1], { rot: false });
      arch.rotation.y = -Math.atan2(archAt[1], archAt[0]) - Math.PI / 2;
    }
    ctx.scatter(5, () => kit.butte(rr(1.6, 3.2), rr(0.6, 1), bands, rand), 1.2, 3, inner);
    ctx.scatter(9, () => {
      const m = kit.rockMesh(rr(0.6, 1), pick(rand, ['#d8a868', '#c88a52']), rand);
      m.scale.set(rr(1.6, 2.4), 0.35, rr(1.2, 1.8));
      return m;
    }, 1.2, 2, inner);
    ctx.scatter(8, () => {
      const g = new THREE.Group();
      for (let i = 0; i < 4; i++) {
        const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.4, 0), new THREE.MeshStandardMaterial({ color: '#e6c08a', flatShading: true }));
        m.userData.rbx = { facets: true, facetThick: 0.04, name: 'Sandrippel' };
        m.scale.set(0.5, 0.18, 2.6);
        m.position.set(i * 0.42, 0, rr(-0.1, 0.1));
        g.add(m);
      }
      return g;
    }, 1.2, 2, inner, { rot: false });
    ctx.scatter(10, () => kit.bush(rr(0.18, 0.3), pick(rand, ['#6a7a3a', '#7a8a48', '#5a6a32']), rand), 0.35, 2, inner);
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
  scatterModels(ctx, 2, ['rock_single_C@meer', 'rock_single_D@meer'], 6, 8, { rMin: ctx.R * 0.6, gap: 0.7 });
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
    SPAWN.backdrop(ctx); // der Spawn gehört zu keinem Planeten, darum ruft planet1/2/3 die Kulisse nicht auf
  },
  backdrop(ctx) {
    // Umgebung: schwebende Inseln mit Bäumen und Häuschen, Felsunterseite mit Ranken (Wolken malt das Himmelsbild)
    floatingIsles(ctx, { far: 7, near: 5, tops: ['hills_A_trees', 'hills_B_trees', 'hills_C_trees'], small: ['trees_B_small', 'trees_A_small'] });
    rockUnderside(ctx, ['rock_single_A', 'rock_single_B', 'rock_single_C', 'rock_single_D', 'rock_single_E']);
  }
};

export const MODEL_WORLDS = { normal: NORMAL, wald: WALD, stadt: STADT, eis: EIS, lava: LAVA, hoehle: HOEHLE, candy: CANDY, mond: MOND, neptun: NEPTUN, mars: MARS, saturn: SATURN, alien: ALIEN, sonne: SONNE, korallenriff: KORALLENRIFF, muschelland: MUSCHELLAND, atlantis: ATLANTIS, spawn: SPAWN };
