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

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const RZ90 = new THREE.Matrix4().makeRotationZ(Math.PI / 2);
const tmp = { p: V(0, 0, 0), q: new THREE.Quaternion(), s: V(1, 1, 1) };

function hex(c) {
  return '#' + new THREE.Color(c).getHexString();
}

// Material eines three.js-Materials in Roblox-Begriffen
function look(mesh, world) {
  const m = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material, rbx = mesh.userData.rbx || {};
  const color = rbx.color ? hex(rbx.color) : hex(m.color);
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

function convertMesh(out, mesh, world) {
  const g = mesh.geometry, P = g.parameters || {}, type = g.type, lk = look(mesh, world);
  const name = mesh.userData.rbx?.name;
  const ex = name ? { name } : {};
  switch (type) {
    case 'BoxGeometry':
      return emit(out, mesh, 'Block', S(P.width, P.height, P.depth), lk, ex);
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
      const r = P.radius, h = P.height, n = 4;
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

// Boden als Säulen-Raster entlang der Hügel
function groundColumns(out, built, world) {
  const R = built.radius, cell = 0.6, material = GROUND[world.id] || 'SmoothPlastic';
  const base = -0.25;
  const light = '#' + new THREE.Color(world.ground).offsetHSL(0, 0, 0.03).getHexString();
  for (let x = -R + cell / 2; x < R; x += cell)
    for (let z = -R + cell / 2; z < R; z += cell) {
      if (Math.hypot(x, z) > R - cell * 0.3) continue;
      const top = built.height(x, z);
      const h = top - base;
      out.push({
        shape: 'Block', name: 'Boden',
        pos: [x * STUDS, (base + h / 2) * STUDS, z * STUDS],
        rot: [1, 0, 0, 0, 1, 0, 0, 0, 1],
        size: [cell * STUDS, h * STUDS, cell * STUDS],
        color: (Math.round(x / cell) + Math.round(z / cell)) % 2 ? light : world.ground, material, transparency: 0,
      });
    }
}

// Unterseite: gestufte Zylinder, die nach unten schmaler werden
function underside(out, world, R) {
  const material = ROCK[world.id] || 'Slate', layers = 6, depth = 5.5;
  // Erdschicht direkt unter dem Boden
  out.push({
    shape: 'Cylinder', name: 'Fels',
    pos: [0, -0.62 * STUDS, 0],
    rot: [0, -1, 0, 1, 0, 0, 0, 0, 1],
    size: [0.76 * STUDS, 2 * R * 0.985 * STUDS, 2 * R * 0.985 * STUDS],
    color: world.side, material: 'SmoothPlastic', transparency: 0,
  });
  for (let i = 0; i < layers; i++) {
    const k = i / layers, r = R * 0.96 * (1 - k) + 0.25, y = -1 - (i + 0.5) * (depth / layers);
    out.push({
      shape: 'Cylinder', name: 'Fels',
      pos: [0, y * STUDS, 0],
      rot: [0, -1, 0, 1, 0, 0, 0, 0, 1], // Achse X → Y
      size: [(depth / layers) * STUDS, 2 * r * STUDS, 2 * r * STUDS],
      color: i % 2 ? world.rock : world.side, material, transparency: 0,
    });
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
    rate: Math.round(cfg.count / 3),
    speed: fall || rise ? [speed * 0.7, speed * 1.2] : [speed * 0.2, speed * 0.5],
    lifetime: fall || rise ? [spanY / (speed * 1.2), spanY / (speed * 0.7)] : [3, 6],
    spread: fall || rise ? [12, 12] : [180, 180],
    lightEmission: cfg.additive === false ? 0 : 1,
    squares: cfg.tex === 'square',
  };
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
  groundColumns(parts, built, world);
  underside(parts, world, built.radius);
  const emitter = emitterFor(world, built.radius);
  built.dispose();
  return { world, parts, sky, lights, emitter };
}
