// Zerlegt eine 3D-Welt aus welten/js/worldFactory.js in Roblox-Teile.
//
// Jede Form wird auf drei Grundformen zurückgeführt, die Roblox ohne hochgeladene Meshes kann:
//   Block (Quader), Cylinder (Achse entlang X wie in Roblox) und Ellipsoid (Block + SpecialMesh Sphere).
// Kegel werden zu gestuften Zylindern, Ringe und Röhren zu Ketten aus Zylindern. Der Inselboden
// wird zu Säulen in einem Raster, die der Hügel-Höhe folgen – das ergibt den typischen Roblox-Look.
//
// Ergebnis: { name, parts, lights, emitter, sky } mit Teilen in Studs (1 Einheit = STUDS).

import * as THREE from 'three';
import { buildWorld, FX } from '../../welten/js/worldFactory.js';

export const STUDS = 8; // 1 Einheit der Webseite = 8 Studs

// Bodenmaterial in Roblox je Welt
const GROUND = {
  normal: 'Grass', wald: 'Grass', stadt: 'Concrete', eis: 'Snow', lava: 'Basalt', hoehle: 'Slate', candy: 'SmoothPlastic',
  mond: 'Rock', neptun: 'Ice', mars: 'Sand', saturn: 'Sand', alien: 'SmoothPlastic', sonne: 'CrackedLava',
  korallenriff: 'Sand', muschelland: 'Sand', atlantis: 'Marble',
};
const ROCK = { lava: 'Basalt', eis: 'Glacier', sonne: 'CrackedLava', mond: 'Rock', hoehle: 'Slate' };
// Material der Erdschicht unter der Grasdecke (sichtbar an Hängen)
const BODY = { Grass: 'Ground', Snow: 'Glacier', Sand: 'Sand', Concrete: 'Concrete', Basalt: 'Basalt', Slate: 'Slate', Rock: 'Rock', Ice: 'Ice', CrackedLava: 'Basalt', Marble: 'Marble', SmoothPlastic: 'SmoothPlastic' };

// Simulator-Stil: kräftigere Farben (Grau und Weiß bleiben, wie sie sind)
export function vivid(hex, k = 0.2) {
  const c = new THREE.Color(hex), hsl = {};
  c.getHSL(hsl);
  if (hsl.s < 0.06) return '#' + c.getHexString();
  c.setHSL(hsl.h, Math.min(1, hsl.s * (1 + k) + 0.02), hsl.l);
  return '#' + c.getHexString();
}
const shade = (hex, s, l) => '#' + new THREE.Color(hex).offsetHSL(0, s, l).getHexString();

// fester Zufall je Welt (gleiche Welt, gleiche Deko)
function seededRand(str) {
  let h = 2166136261;
  for (const ch of str) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}
const UP = [0, -1, 0, 1, 0, 0, 0, 0, 1]; // Zylinder-Achse X → Y
// Drehung, deren X-Achse entlang des Rands und Z-Achse nach außen zeigt
const around = (a) => [-Math.sin(a), 0, Math.cos(a), 0, 1, 0, Math.cos(a), 0, Math.sin(a)];

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const RZ90 = new THREE.Matrix4().makeRotationZ(Math.PI / 2);
const tmp = { p: V(0, 0, 0), q: new THREE.Quaternion(), s: V(1, 1, 1) };

function hex(c) {
  return '#' + new THREE.Color(c).getHexString();
}

// Material eines three.js-Materials in Roblox-Begriffen
function look(mesh, world) {
  const m = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material, rbx = mesh.userData.rbx || {};
  const color = vivid(rbx.color ? hex(rbx.color) : hex(m.color));
  let material = 'SmoothPlastic', transparency = rbx.transparency ?? 0;
  const glow = m.emissive ? m.emissiveIntensity * Math.max(m.emissive.r, m.emissive.g, m.emissive.b) : 0;
  if (rbx.neon || glow > 0.45) material = 'Neon';
  else if (m.metalness > 0.45) material = 'Metal';
  if (m.transparent && m.opacity < 0.95 && !rbx.transparency) {
    transparency = Math.round((1 - m.opacity) * 0.8 * 100) / 100;
    if (material !== 'Neon') material = 'Glass';
  }
  return { color, material, transparency };
}

// Teil aus lokaler Einheitsform: world = mesh.matrixWorld · local
function emit(out, mesh, shape, local, lk, extra = {}) {
  const w = new THREE.Matrix4().multiplyMatrices(mesh.matrixWorld, local);
  w.decompose(tmp.p, tmp.q, tmp.s);
  const rot = new THREE.Matrix4().makeRotationFromQuaternion(tmp.q).elements;
  out.push({
    shape,
    pos: [tmp.p.x * STUDS, tmp.p.y * STUDS, tmp.p.z * STUDS],
    // Rotationsmatrix zeilenweise (R00 R01 R02 / R10 … ) wie in Roblox-CFrames
    rot: [rot[0], rot[4], rot[8], rot[1], rot[5], rot[9], rot[2], rot[6], rot[10]],
    size: [Math.abs(tmp.s.x) * STUDS, Math.abs(tmp.s.y) * STUDS, Math.abs(tmp.s.z) * STUDS],
    ...lk,
    ...extra,
  });
}

const S = (x, y, z) => new THREE.Matrix4().makeScale(x, y, z);
const T = (x, y, z) => new THREE.Matrix4().makeTranslation(x, y, z);
const mul = (...ms) => ms.reduce((a, b) => a.multiply(b), new THREE.Matrix4());

// Zylinder (Roblox-Achse X) zwischen zwei lokalen Punkten
function cylLocal(a, b, r) {
  const d = b.clone().sub(a), len = d.length();
  if (len < 1e-5) return null;
  const q = new THREE.Quaternion().setFromUnitVectors(V(1, 0, 0), d.normalize());
  const mid = a.clone().add(b).multiplyScalar(0.5);
  return mul(T(mid.x, mid.y, mid.z), new THREE.Matrix4().makeRotationFromQuaternion(q), S(len, 2 * r, 2 * r));
}

export function convertMesh(out, mesh, world) {
  const r = mesh.userData.rbx || {};
  // Modell aus der Bibliothek: unsichtbarer Platzhalter in Größe und Lage des Modells (Einheitswürfel × Skalierung)
  if (r.model)
    return emit(out, mesh, 'Block', new THREE.Matrix4(), { color: '#ffffff', material: 'SmoothPlastic', transparency: 1 }, {
      name: 'ModellPlatz', model: r.model, fest: !!r.fest, canCollide: false, castShadow: false, ...(r.sky ? { noShadow: true } : {}),
    });
  const g = mesh.geometry, P = g.parameters || {}, type = g.type, lk = look(mesh, world);
  const ex = {};
  // Spawn-Bereich (für Klicks im Spiel-Hintergrund)
  for (let o = mesh; o; o = o.parent) if (o.userData.area) {
    ex.area = o.userData.area;
    break;
  }
  if (r.name) ex.name = r.name;
  if (r.className) ex.className = r.className; // z. B. SpawnLocation
  if (r.text) Object.assign(ex, { text: r.text, textColor: r.textColor || '#ffffff' }); // Schild mit SurfaceGui
  switch (type) {
    case 'BoxGeometry': {
      // verformte Quader (z. B. abgerundete Blöcke der Haustiere): Maße aus der Bounding-Box
      const bb = g.boundingBox;
      if (bb && Math.abs(bb.max.x - bb.min.x - P.width) > 1e-3) {
        const c = bb.getCenter(V(0, 0, 0)), sz = bb.getSize(V(0, 0, 0));
        return emit(out, mesh, 'Block', mul(T(c.x, c.y, c.z), S(sz.x, sz.y, sz.z)), lk, ex);
      }
      return emit(out, mesh, 'Block', S(P.width, P.height, P.depth), lk, ex);
    }
    case 'CylinderGeometry': {
      const rt = P.radiusTop, rb = P.radiusBottom, h = P.height, r = Math.max(rt, rb);
      if (P.radialSegments <= 4) return emit(out, mesh, 'Block', S(r * 1.5, h, r * 1.2), lk, ex); // Prisma (Dach)
      if (Math.abs(rt - rb) / r < 0.3) return emit(out, mesh, 'Cylinder', mul(RZ90.clone(), S(h, rt + rb, rt + rb)), lk, ex);
      const n = rt < 0.01 || rb < 0.01 ? 4 : 3;
      for (let i = 0; i < n; i++) {
        const k = (i + 0.5) / n, ri = rb + (rt - rb) * k;
        emit(out, mesh, 'Cylinder', mul(T(0, -h / 2 + k * h, 0), RZ90.clone(), S(h / n, 2 * Math.max(ri, 0.02), 2 * Math.max(ri, 0.02))), lk, ex);
      }
      return;
    }
    case 'ConeGeometry': {
      // große Kegel (Berge der Kulisse) mit mehr Stufen, damit sie nicht wie eine Torte aussehen
      const r = P.radius, h = P.height, n = mesh.userData.rbx?.tiers || 4;
      for (let i = 0; i < n; i++) {
        const k = (i + 0.5) / n, ri = r * (1 - k);
        emit(out, mesh, 'Cylinder', mul(T(0, -h / 2 + k * h, 0), RZ90.clone(), S(h / n, 2 * Math.max(ri, 0.02), 2 * Math.max(ri, 0.02))), lk, ex);
      }
      return;
    }
    case 'SphereGeometry': {
      // Kugelausschnitt (Kuppel, Schale): Ellipsoid in Höhe und Breite des Ausschnitts
      const r = P.radius, t0 = P.thetaStart ?? 0, t1 = t0 + (P.thetaLength ?? Math.PI);
      if (t1 - t0 < Math.PI - 0.01) {
        const y0 = r * Math.cos(t1), y1 = r * Math.cos(t0);
        const wide = t0 < Math.PI / 2 && t1 > Math.PI / 2 ? r : r * Math.max(Math.sin(t0), Math.sin(t1));
        return emit(out, mesh, 'Ellipsoid', mul(T(0, (y0 + y1) / 2, 0), S(2 * wide, Math.max(y1 - y0, 0.02), 2 * wide)), lk, ex);
      }
      return emit(out, mesh, 'Ellipsoid', S(2 * r, 2 * r, 2 * r), lk, ex);
    }
    case 'IcosahedronGeometry':
    case 'DodecahedronGeometry':
    case 'OctahedronGeometry': {
      const r = P.radius;
      return emit(out, mesh, 'Ellipsoid', S(2 * r, 2 * r, 2 * r), lk, ex);
    }
    case 'TorusGeometry': {
      const R = P.radius, tube = P.tube, arc = P.arc ?? Math.PI * 2;
      const n = Math.max(5, Math.round((arc / (Math.PI * 2)) * 18));
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * arc, a1 = ((i + 1) / n) * arc;
        const m = cylLocal(V(Math.cos(a0) * R, Math.sin(a0) * R, 0), V(Math.cos(a1) * R, Math.sin(a1) * R, 0), tube);
        if (m) emit(out, mesh, 'Cylinder', m, lk, ex);
      }
      return;
    }
    case 'TubeGeometry': {
      const path = P.path, r = P.radius, n = Math.min(14, P.tubularSegments || 10);
      for (let i = 0; i < n; i++) {
        const m = cylLocal(path.getPoint(i / n), path.getPoint((i + 1) / n), r);
        if (m) emit(out, mesh, 'Cylinder', m, lk, ex);
      }
      return;
    }
    case 'CircleGeometry':
      // Kreis liegt in der XY-Ebene: flacher Zylinder mit Achse Z
      return emit(out, mesh, 'Cylinder', mul(new THREE.Matrix4().makeRotationY(-Math.PI / 2), S(0.04, 2 * P.radius, 2 * P.radius)), lk, ex);
    case 'RingGeometry': {
      const mid = (P.innerRadius + P.outerRadius) / 2, w = P.outerRadius - P.innerRadius, n = 28;
      for (let i = 0; i < n; i++) {
        const a = ((i + 0.5) / n) * Math.PI * 2;
        emit(out, mesh, 'Block', mul(T(Math.cos(a) * mid, Math.sin(a) * mid, 0), new THREE.Matrix4().makeRotationZ(a), S(w, (Math.PI * 2 * mid) / n + 0.05, 0.04)), lk, ex);
      }
      return;
    }
    case 'PlaneGeometry':
      return emit(out, mesh, 'Block', S(P.width, P.height, 0.03), lk, ex);
    case 'ExtrudeGeometry':
      return emit(out, mesh, 'Ellipsoid', S(0.75, 0.75, 0.12), lk, ex);
    default:
      return; // eigene Geometrien (Boden, Unterseite) werden extra behandelt
  }
}

// Boden als Säulen-Raster entlang der Hügel: oben eine Grasdecke in Flecken aus drei Tönen,
// darunter Erde – an jedem Hang sieht man die Schicht wie in Roblox-Simulatoren
function groundColumns(out, built, world) {
  const R = built.radius, cell = 1.1, material = GROUND[world.id] || 'SmoothPlastic';
  const base = -1.2; // unter dem tiefsten Tal, damit jede Säule bis zum Boden reicht
  const cap = 0.34;
  const g = vivid(world.ground, 0.25);
  const tones = [g, shade(g, 0.03, 0.05), shade(g, 0.02, -0.04)];
  const dirt = vivid(world.side, 0.15), body = BODY[material] || material;
  const rand = seededRand(world.id + ':boden');
  for (let x = -R + cell / 2; x < R; x += cell)
    for (let z = -R + cell / 2; z < R; z += cell) {
      if (Math.hypot(x, z) > R - cell * 0.3) continue;
      const top = built.height(x, z);
      // weiche Flecken plus ein paar einzelne Kacheln
      const n = Math.sin(x * 0.45 + 1.3) * Math.cos(z * 0.38 - 0.7) + Math.sin((x - z) * 0.23) * 0.6 + (rand() - 0.5) * 0.5;
      const tone = n > 0.5 ? tones[1] : n < -0.55 ? tones[2] : tones[0];
      const capBottom = Math.max(base, top - cap);
      out.push({
        shape: 'Block', name: 'Boden',
        pos: [x * STUDS, ((capBottom + top) / 2) * STUDS, z * STUDS],
        rot: [1, 0, 0, 0, 1, 0, 0, 0, 1],
        size: [cell * STUDS, (top - capBottom) * STUDS, cell * STUDS],
        color: tone, material, transparency: 0,
      });
      if (capBottom > base + 0.01)
        out.push({
          shape: 'Block', name: 'Boden',
          pos: [x * STUDS, ((base + capBottom) / 2) * STUDS, z * STUDS],
          rot: [1, 0, 0, 0, 1, 0, 0, 0, 1],
          size: [cell * STUDS, (capBottom - base) * STUDS, cell * STUDS],
          color: dirt, material: body, transparency: 0,
        });
    }
}

// Runder Grasrand, der etwas über die Kante hängt
function rimLip(out, built, world) {
  const R = built.radius, n = Math.round((2 * Math.PI * R) / 1.2);
  const material = GROUND[world.id] || 'SmoothPlastic';
  const light = shade(vivid(world.ground, 0.25), 0.03, 0.06);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, r = R - 0.15;
    const y = Math.max(built.height(Math.cos(a) * (R - 0.5), Math.sin(a) * (R - 0.5)), 0.1);
    out.push({
      shape: 'Ellipsoid', name: 'Rand',
      pos: [Math.cos(a) * r * STUDS, (y - 0.06) * STUDS, Math.sin(a) * r * STUDS],
      rot: around(a),
      size: [1.55 * STUDS, 0.55 * STUDS, 1.15 * STUDS],
      color: light, material, transparency: 0,
    });
  }
}

// Unterseite: gestufte Felsschichten mit Kanten, hängende Felsspitzen, an grünen Inseln Ranken
function underside(out, world, R) {
  const material = ROCK[world.id] || 'Slate', layers = 7, depth = 5.5 * (R / 6);
  const side = vivid(world.side, 0.15), rock = vivid(world.rock, 0.15), mid = '#' + new THREE.Color(side).lerp(new THREE.Color(rock), 0.5).getHexString();
  const tones = [side, mid, rock];
  const rand = seededRand(world.id + ':fels');
  // Erdschicht direkt unter dem Boden
  out.push({
    shape: 'Cylinder', name: 'Fels',
    pos: [0, -0.62 * STUDS, 0],
    rot: UP,
    size: [0.76 * STUDS, 2 * R * 0.985 * STUDS, 2 * R * 0.985 * STUDS],
    color: side, material: 'SmoothPlastic', transparency: 0,
  });
  for (let i = 0; i < layers; i++) {
    const k = i / layers, r = R * 0.96 * (1 - k) + 0.25, y = -1 - (i + 0.5) * (depth / layers);
    out.push({
      shape: 'Cylinder', name: 'Fels',
      pos: [0, y * STUDS, 0],
      rot: UP,
      size: [(depth / layers) * STUDS, 2 * r * STUDS, 2 * r * STUDS],
      color: tones[i % 3], material, transparency: 0,
    });
    // schmale Kante zwischen zwei Schichten
    out.push({
      shape: 'Cylinder', name: 'Fels',
      pos: [0, (y + depth / layers / 2) * STUDS, 0],
      rot: UP,
      size: [0.14 * STUDS, 2 * (r + 0.22) * STUDS, 2 * (r + 0.22) * STUDS],
      color: shade(tones[i % 3], 0, -0.06), material, transparency: 0,
    });
  }
  // hängende Felsspitzen: je drei schmaler werdende Stücke
  for (let i = 0; i < 16; i++) {
    const a = rand() * Math.PI * 2, r = Math.sqrt(rand()) * R * 0.72;
    const top = -1 - depth * (1 - r / (R * 0.96)) + 0.4;
    const len = 1.4 + rand() * 3.4, w = 0.45 + rand() * 0.5;
    for (let j = 0; j < 3; j++) {
      const h = len / 3, rw = w * (1 - j * 0.3);
      out.push({
        shape: 'Cylinder', name: 'Fels',
        pos: [Math.cos(a) * r * STUDS, (top - h * (j + 0.5)) * STUDS, Math.sin(a) * r * STUDS],
        rot: UP,
        size: [h * STUDS, 2 * rw * STUDS, 2 * rw * STUDS],
        color: tones[(i + j) % 3], material, transparency: 0,
      });
    }
  }
  // Ranken an grünen Inseln
  if (['normal', 'wald', 'spawn'].includes(world.id)) {
    for (let i = 0; i < 30; i++) {
      const a = (i / 30) * Math.PI * 2 + rand() * 0.15, r = R + 0.04;
      const len = 1 + rand() * 2.8;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      out.push({ shape: 'Cylinder', name: 'Ranke', pos: [x * STUDS, (-0.3 - len / 2) * STUDS, z * STUDS], rot: UP, size: [len * STUDS, 0.14 * STUDS, 0.14 * STUDS], color: '#3d8a37', material: 'Grass', transparency: 0 });
      for (let j = 0; j < 2; j++) {
        const y = -0.5 - len * (0.35 + j * 0.45);
        out.push({ shape: 'Ellipsoid', name: 'Ranke', pos: [x * STUDS, y * STUDS, z * STUDS], rot: around(a), size: [0.5 * STUDS, 0.32 * STUDS, 0.36 * STUDS], color: j ? '#6fd04f' : '#58b843', material: 'Grass', transparency: 0 });
      }
    }
  }
}

// Wasserfälle über die Inselkante: Wasser, Lava, Sirup – mit Gischt unten
const FALLS = {
  normal: { color: '#3fb0ff', light: '#d2f1ff', material: 'SmoothPlastic', transparency: 0.12, count: 2 },
  wald: { color: '#349fe6', light: '#c6ecff', material: 'SmoothPlastic', transparency: 0.12, count: 1 },
  eis: { color: '#9fe8ff', light: '#ffffff', material: 'Ice', transparency: 0.15, count: 1 },
  lava: { color: '#ff5512', light: '#ffb052', material: 'Neon', transparency: 0, count: 2 },
  sonne: { color: '#ffa41c', light: '#fff09a', material: 'Neon', transparency: 0, count: 2 },
  candy: { color: '#ff78c6', light: '#ffd4ee', material: 'SmoothPlastic', transparency: 0, count: 2 },
  hoehle: { color: '#3ee6ff', light: '#c8fbff', material: 'Neon', transparency: 0, count: 1 },
  alien: { color: '#86ff52', light: '#e2ffc8', material: 'Neon', transparency: 0, count: 1 },
};
function waterfalls(out, emitters, built, world) {
  const f = FALLS[world.id];
  if (!f) return;
  const R = built.radius, depth = 5.5 * (R / 6), rand = seededRand(world.id + ':fall');
  const start = rand() * Math.PI * 2;
  for (let i = 0; i < f.count; i++) {
    const a = start + i * 2.4;
    const ca = Math.cos(a), sa = Math.sin(a);
    const top = Math.max(built.height(ca * (R - 0.6), sa * (R - 0.6)), 0.1);
    // fällt bis etwa zur Mitte der Unterseite und zerstäubt dort
    const bottom = -depth * 0.62, h = top - bottom, W = 2.1;
    const rot = around(a);
    const at = (r, y) => [ca * r * STUDS, y * STUDS, sa * r * STUDS];
    // Rinne oben auf der Insel
    out.push({ shape: 'Block', name: 'Wasserfall', pos: at(R - 1.3, top + 0.04), rot, size: [W * STUDS, 0.12 * STUDS, 2.6 * STUDS], color: f.color, material: f.material, transparency: f.transparency });
    // fallender Vorhang und heller Streifen davor
    out.push({ shape: 'Block', name: 'Wasserfall', pos: at(R + 0.25, top - h / 2), rot, size: [W * STUDS, h * STUDS, 0.3 * STUDS], color: f.color, material: f.material, transparency: f.transparency });
    // zwei helle Streifen im fallenden Wasser
    for (const off of [-0.45, 0.4]) {
      const p = at(R + 0.42, top - h / 2);
      out.push({ shape: 'Block', name: 'Wasserfall', pos: [p[0] - sa * off * STUDS, p[1], p[2] + ca * off * STUDS], rot, size: [0.32 * STUDS, h * STUDS, 0.06 * STUDS], color: f.light, material: f.material, transparency: f.material === 'Neon' ? 0 : 0.2 });
    }
    // Schaum an der Kante und eine Gischtwolke unten
    out.push({ shape: 'Ellipsoid', name: 'Wasserfall', pos: at(R + 0.15, top), rot, size: [(W + 0.6) * STUDS, 0.5 * STUDS, 0.9 * STUDS], color: f.light, material: 'SmoothPlastic', transparency: 0.05 });
    for (let j = 0; j < 4; j++) {
      const p = at(R + 0.4 + (j % 2) * 0.4, bottom - 0.2 + j * 0.25);
      const off = (j - 1.5) * 0.7;
      out.push({ shape: 'Ellipsoid', name: 'Wasserfall', pos: [p[0] - sa * off * STUDS, p[1], p[2] + ca * off * STUDS], rot, size: [1.6 * STUDS, 1.2 * STUDS, 1.6 * STUDS], color: f.light, material: 'SmoothPlastic', transparency: 0.18 });
    }
    emitters.push({
      name: 'Gischt',
      pos: at(R + 0.3, bottom + 0.2), size: [1.2 * STUDS, 1, 1.2 * STUDS], direction: 'Top',
      colors: [f.light, '#ffffff'], particleSize: 0.9 * STUDS, rate: 22,
      speed: [0.4 * STUDS, 1.1 * STUDS], lifetime: [1.2, 2.4], spread: [40, 40],
      lightEmission: f.material === 'Neon' ? 1 : 0.3, squares: false,
    });
  }
}

// Wolken um Inseln mit Tageshimmel
function clouds(out, built, world) {
  const c = new THREE.Color(world.sky[0]);
  const day = 0.3 * c.r + 0.59 * c.g + 0.11 * c.b > 0.2;
  if (!day || world.water || world.planet === 'p2') return;
  const R = built.radius, rand = seededRand(world.id + ':wolken');
  const tint = '#ffffff';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + rand() * 0.4, r = R + 2 + rand() * 5, y = -6 + rand() * 7.5;
    const n = 3 + Math.floor(rand() * 3);
    for (let j = 0; j < n; j++) {
      const s = 1.6 + rand() * 1.8;
      const off = (j - (n - 1) / 2) * 1.3;
      out.push({
        shape: 'Ellipsoid', name: 'Wolke',
        pos: [(Math.cos(a) * r - Math.sin(a) * off) * STUDS, (y + rand() * 0.6) * STUDS, (Math.sin(a) * r + Math.cos(a) * off) * STUDS],
        rot: around(a),
        size: [s * 1.3 * STUDS, s * 0.8 * STUDS, s * STUDS],
        color: tint, material: 'SmoothPlastic', transparency: 0,
      });
    }
  }
}


// ── Abschirmung: jede Insel ist eine eigene kleine Welt ──
// Himmelskuppel (von innen sichtbare Kugel), darunter ein Wolkenmeer (Planet 1 und Spawn),
// ein Nebelmeer (Weltraum) oder Sanddünen (Tiefsee), unter Wasser zusätzlich eine Wasseroberfläche.
// Die Inseln stehen 1500 Studs auseinander; die Kuppel (Durchmesser 1280) verdeckt die Nachbarn.
export const DOME_RADIUS = 640; // Studs
function skyShield(sky, built, world) {
  const top = new THREE.Color(world.sky[0]), horizon = new THREE.Color(world.sky[1]);
  const lum = 0.3 * top.r + 0.59 * top.g + 0.11 * top.b;
  const night = lum < 0.2, space = world.planet === 'p2', water = !!world.water;
  const rand = seededRand(world.id + ':kuppel');
  const D = DOME_RADIUS;
  const id = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  // Kuppel: oben die Himmelsfarbe, zum Horizont hin hellt sie die Atmosphäre auf
  sky.push({ shape: 'Ellipsoid', name: 'Himmelskuppel', inside: true, pos: [0, 0, 0], rot: id, size: [2 * D, 2 * D, 2 * D], color: '#' + top.getHexString(), material: 'SmoothPlastic', transparency: 0, canCollide: false, castShadow: false, noShadow: true });
  // ein zweiter, etwas kleinerer Ring in Horizontfarbe macht den Übergang weich
  sky.push({ shape: 'Ellipsoid', name: 'Himmelskuppel', inside: true, pos: [0, -D * 0.5, 0], rot: id, size: [2 * D * 0.97, D * 0.9, 2 * D * 0.97], color: '#' + horizon.getHexString(), material: 'SmoothPlastic', transparency: 0.6, canCollide: false, castShadow: false, noShadow: true });
  if (water) {
    // Wasseroberfläche hoch über der Insel
    sky.push({ shape: 'Block', name: 'Wasseroberflaeche', pos: [0, D * 0.62, 0], rot: id, size: [2 * D * 0.8, 2, 2 * D * 0.8], color: '#9fe8ff', material: 'Glass', transparency: 0.45, canCollide: false, castShadow: false, noShadow: true });
  }
  // Meer unter der Insel: Wolken, Nebel oder Dünen
  const R = built.radius * STUDS, floor = -1 - 5.5 * (built.radius / 6);
  const y0 = (floor - 6) * STUDS;
  const kind = water ? 'duene' : space ? 'nebel' : 'wolke';
  const colors = water
    ? [vivid(world.side, 0.1), shade(vivid(world.side, 0.1), 0, 0.05), shade(vivid(world.side, 0.1), 0, -0.05)]
    : space
      ? ['#' + horizon.clone().lerp(new THREE.Color(world.accent), 0.4).getHexString(), '#' + horizon.getHexString(), '#' + top.clone().lerp(new THREE.Color(world.accent), 0.25).getHexString()]
      : night
        ? ['#3c3852', '#47425f', '#2f2c43']
        : ['#ffffff', '#f2f6ff', '#e6eefc'];
  const step = 92;
  for (let x = -D; x <= D; x += step)
    for (let z = -D; z <= D; z += step) {
      const jx = x + (rand() - 0.5) * step * 0.6, jz = z + (rand() - 0.5) * step * 0.6;
      if (Math.hypot(jx, jz) > D * 0.93) continue;
      const w = step * (1.5 + rand() * 0.6), h = kind === 'duene' ? 22 + rand() * 18 : 34 + rand() * 30;
      // nahe der Insel etwas höher, damit sie auf den Wolken zu liegen scheint
      const near = Math.max(0, 1 - Math.hypot(jx, jz) / (R * 1.6));
      sky.push({
        shape: 'Ellipsoid', name: kind === 'duene' ? 'Duene' : kind === 'nebel' ? 'Nebel' : 'Wolkenmeer',
        pos: [jx, y0 + rand() * 18 + near * 40, jz], rot: id,
        size: [w, h, w * (0.8 + rand() * 0.4)],
        color: colors[Math.floor(rand() * colors.length)],
        material: kind === 'duene' ? 'Sand' : 'SmoothPlastic',
        transparency: kind === 'nebel' ? 0.35 : 0, canCollide: false, castShadow: false, noShadow: true,
      });
    }
}

// Himmelskörper (Erde, Neptun, Sonne …) stehen auf der Webseite weit draußen. In Roblox lägen sie hinter der
// Himmelskuppel und wären unsichtbar: alle fernen Teile gemeinsam zur Mitte ziehen und im selben Maß
// verkleinern. So sehen sie von der Insel aus gleich groß aus, und Planet und Ring bleiben beisammen.
function pullInsideDome(sky) {
  const far = sky.filter((p) => Math.hypot(...p.pos) > DOME_RADIUS * 0.92);
  if (!far.length) return;
  const reach = Math.max(...far.map((p) => Math.hypot(...p.pos) + Math.max(...p.size) / 2));
  const f = Math.min(1, (DOME_RADIUS * 0.86) / reach);
  if (f >= 1) return;
  for (const p of far) {
    p.pos = p.pos.map((v) => v * f);
    p.size = p.size.map((v) => v * f);
  }
}

// Partikel der Welt als ParticleEmitter-Einstellungen
function emitterFor(world, R) {
  const cfg = FX[world.fx];
  if (!cfg) return null;
  const area = (cfg.area || R + 1) * 2 * STUDS;
  const y0 = (cfg.y0 ?? 0) * STUDS, y1 = (cfg.y1 ?? 7) * STUDS;
  const speed = (cfg.speed || 1) * STUDS * 0.8;
  const fall = cfg.mode === 'fall', rise = cfg.mode === 'rise';
  const spanY = y1 - y0;
  return {
    pos: [0, fall ? y1 : rise ? y0 : (y0 + y1) / 2, 0],
    size: [area, 1, area],
    direction: fall ? 'Bottom' : 'Top',
    colors: cfg.colors,
    particleSize: cfg.size * STUDS * 1.2,
    rate: Math.round((cfg.count * (R / 6) ** 2) / 3),
    speed: fall || rise ? [speed * 0.7, speed * 1.2] : [speed * 0.2, speed * 0.5],
    lifetime: fall || rise ? [spanY / (speed * 1.2), spanY / (speed * 0.7)] : [3, 6],
    spread: fall || rise ? [12, 12] : [180, 180],
    lightEmission: cfg.additive === false ? 0 : 1,
    squares: cfg.tex === 'square',
  };
}

// Licht und Himmel einer Welt in Roblox: Lighting-Werte und eine Atmosphere, getönt mit den Himmelsfarben.
// Der Export legt sie in den Ordner „Licht“, das Skript CoinmasterWorldLighting setzt sie im Spiel,
// die Vorschau auf der Webseite nutzt genau dieselben Werte.
export function worldLighting(world) {
  const [top, horizon] = world.sky;
  const c = new THREE.Color(top);
  const lum = 0.3 * c.r + 0.59 * c.g + 0.11 * c.b;
  const night = lum < 0.2;
  const dim = (hex, k) => '#' + new THREE.Color(hex).multiplyScalar(k).getHexString();
  return {
    ClockTime: night ? 0.5 : 14,
    Brightness: night ? 1.2 : 2.6,
    Ambient: night ? dim(horizon, 0.55) : '#585858',
    OutdoorAmbient: night ? dim(horizon, 0.9) : '#8c8c8c',
    FogColor: horizon,
    // weit genug, dass die Fernkulisse am Rand der Kuppel (WorldFx) zu sehen ist; dahinter verschwimmt alles
    FogStart: world.water ? 110 : 360,
    FogEnd: world.water ? 900 : 1500,
    atmosphere: { Density: world.water ? 0.55 : night ? 0.4 : 0.42, Offset: 0.08, Color: horizon, Decay: top, Glare: night ? 0 : 0.25, Haze: world.water ? 2.6 : 1.8 },
    // Neon und Lava leuchten weich nach (nur in Roblox; die Vorschau zeigt kein Bloom)
    bloom: { Intensity: night ? 0.7 : 0.45, Size: 24, Threshold: night ? 1.2 : 1.6 },
  };
}

// Platz neben der Teleport-Plattform für die Vergleichsfigur (in Webseiten-Einheiten)
function compareSpot(built) {
  if (built.figureSpot) return built.figureSpot.clone();
  let pad = null;
  built.scene.traverse((o) => o.userData.rbx?.name === 'TeleportPad' && (pad = o.getWorldPosition(V(0, 0, 0))));
  const p = pad ?? V(built.radius - 2, 0, 0);
  const out = V(p.x, 0, p.z).normalize(), side = V(-out.z, 0, out.x);
  let x = p.x + side.x * 1.3, z = p.z + side.z * 1.3;
  const r = Math.hypot(x, z), max = built.radius - 0.9;
  if (r > max) (x *= max / r), (z *= max / r);
  return V(x, built.height(x, z), z);
}

export function worldToParts(world) {
  const built = buildWorld(world, { particles: 0 });
  built.update(1, 0.016); // Grundhaltung der Animationen
  built.scene.updateMatrixWorld(true);
  const parts = [], sky = [], lights = [];
  built.scene.traverse((o) => {
    if (o.isPointLight) {
      const p = o.getWorldPosition(V(0, 0, 0));
      lights.push({ pos: [p.x * STUDS, p.y * STUDS, p.z * STUDS], color: '#' + o.color.getHexString(), range: Math.min(60, (o.distance || 10) * STUDS * 0.6), brightness: 2 });
      return;
    }
    if (!o.isMesh || !o.visible) return;
    const rbx = o.userData.rbx || {};
    let p = o.parent, skip = rbx.skip;
    while (p && !skip) {
      skip = p.userData.rbx?.skip;
      p = p.parent;
    }
    if (skip || rbx.kind === 'ground' || rbx.kind === 'underside' || rbx.name === 'Rand') return;
    if (o.material.blending === THREE.AdditiveBlending) return; // Lichtstrahlen, Strahl unter dem UFO
    convertMesh(rbx.sky ? sky : parts, o, world);
  });
  pullInsideDome(sky);
  groundColumns(parts, built, world);
  rimLip(parts, built, world);
  underside(parts, world, built.radius);
  clouds(sky, built, world);
  skyShield(sky, built, world);
  const emitter = emitterFor(world, built.radius);
  const emitters = emitter ? [emitter] : [];
  waterfalls(parts, emitters, built, world);
  // weitere Partikel der Welt (Schmetterlinge, Vögel, Blätter, Polarlicht …) von Einheiten in Studs
  for (const e of built.emitters || [])
    emitters.push({
      name: e.name,
      pos: e.pos.map((v) => v * STUDS),
      size: e.size.map((v) => Math.max(1, v * STUDS)),
      direction: e.direction,
      colors: e.colors,
      particleSize: e.particleSize * STUDS,
      rate: e.rate,
      speed: e.speed.map((v) => v * STUDS),
      lifetime: e.lifetime,
      spread: e.spread,
      lightEmission: e.lightEmission,
      squares: false,
    });
  // Daten für die Vorschau in Studs: Inselradius, Bereiche des Spawns, Platz für die Vergleichsfigur
  const spot = compareSpot(built).multiplyScalar(STUDS);
  const meta = {
    radius: built.radius * STUDS,
    spot: [spot.x, spot.y, spot.z],
    sounds: (built.sounds || []).map((x) => ({ ...x })),
    areas: (built.areas || []).map((a) => ({ id: a.id, name: a.name, pos: [a.pos.x * STUDS, a.pos.y * STUDS, a.pos.z * STUDS] })),
  };
  built.dispose();
  return { world, parts, sky, lights, emitter, emitters, meta, sounds: meta.sounds, lighting: worldLighting(world) };
}
