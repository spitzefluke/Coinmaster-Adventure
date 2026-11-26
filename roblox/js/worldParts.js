// Zerlegt eine 3D-Welt aus welten/js/worldFactory.js in Roblox-Teile.
//
// Jede Form wird auf drei Grundformen zurückgeführt, die Roblox ohne hochgeladene Meshes kann:
//   Block (Quader), Cylinder (Achse entlang X wie in Roblox) und Ellipsoid (Block + SpecialMesh Sphere).
// Kegel werden zu gestuften Zylindern, Ringe und Röhren zu Ketten aus Zylindern. Der Inselboden
// wird zu Säulen in einem Raster, die der Hügel-Höhe folgen – das ergibt den typischen Roblox-Look.
//
// Ergebnis: { name, parts, lights, emitter, sky } mit Teilen in Studs (1 Einheit = STUDS).

import { SKYBOXES } from '../../welten/js/skyboxes.js';
import * as THREE from 'three';
import { buildWorld, FX, ISLAND_RADIUS } from '../../welten/js/worldFactory.js';
import { islandShell, miniIsland } from './islandShell.js';

export const STUDS = 8; // 1 Einheit der Webseite = 8 Studs

// Bodenmaterial in Roblox je Welt
const GROUND = {
  normal: 'Grass', wald: 'Grass', stadt: 'Concrete', eis: 'Snow', lava: 'Basalt', hoehle: 'Slate', candy: 'SmoothPlastic',
  mond: 'Rock', neptun: 'Ice', mars: 'Sand', saturn: 'Sand', alien: 'SmoothPlastic', sonne: 'CrackedLava',
  korallenriff: 'Sand', muschelland: 'Sand', atlantis: 'Marble',
  tiefseegraben: 'Slate', wolkenburg: 'Marble', engelsgarten: 'Grass', goetterthron: 'Marble',
  quarzfeld: 'Marble', amethystgrotte: 'Slate', topasduenen: 'Sand', smaragdwald: 'Grass', jadetempel: 'Grass',
  saphirsee: 'Marble', rubinvulkan: 'Basalt', opalwolken: 'Marble', diamantkern: 'Ice',
};
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
// Ton heller oder dunkler: bei dunklen Farben im Verhältnis zur Helligkeit (three.js rechnet HSL linear, ein
// dunkles Rot hat dort nur l ≈ 0,03; ein fester Abzug ergab reines Schwarz)
export function relL(hex, l) {
  const L = new THREE.Color(hex).getHSL({}).l;
  return L < 0.25 ? l * Math.max(0.12, L / 0.25) : l;
}
const shade = (hex, s, l) => '#' + new THREE.Color(hex).offsetHSL(0, s, relL(hex, l)).getHexString();

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

// Facettierte Form → Keile. Jede Dreiecksfläche wird zu zwei Keilen, deren Körper nach innen zeigt.
function facetMesh(out, mesh, lk, r, world) {
  // mehrere Materialien (Gruppen der Geometrie, z. B. Blüte und Blatt): Farbe je Dreieck aus seiner Gruppe
  const multi = Array.isArray(mesh.material) && mesh.geometry.groups.length;
  const lookAt = (i) => {
    if (!multi) return lk;
    const grp = mesh.geometry.groups.find((q) => i >= q.start && i < q.start + q.count);
    return grp ? look({ material: mesh.material[grp.materialIndex] ?? mesh.material[0], userData: mesh.userData }, world) : lk;
  };
  const g = mesh.geometry, pos = g.attributes.position, idx = g.index;
  const n = idx ? idx.count : pos.count;
  const center = new THREE.Vector3();
  new THREE.Box3().setFromBufferAttribute(pos).getCenter(center);
  center.applyMatrix4(mesh.matrixWorld);
  const thick = r.facetThick ?? 0.06;
  const vtx = (i) => new THREE.Vector3().fromBufferAttribute(pos, idx ? idx.getX(i) : i).applyMatrix4(mesh.matrixWorld);
  for (let i = 0; i + 2 < n; i += 3) {
    const a = vtx(i), b = vtx(i + 1), c = vtx(i + 2);
    const mid = a.clone().add(b).add(c).multiplyScalar(1 / 3);
    const outward = mid.clone().sub(center);
    const nrm = b.clone().sub(a).cross(c.clone().sub(a)).normalize();
    if (nrm.dot(outward) < 0) nrm.negate();
    if (nrm.y < -0.35 && !r.facetsAll) continue;
    for (const w of triangleWedges(a, b, c, thick, outward)) {
      out.push({
        shape: 'Wedge', className: 'WedgePart', name: r.name || 'Kristall',
        pos: [w.pos.x * STUDS, w.pos.y * STUDS, w.pos.z * STUDS], rot: w.rot,
        size: [w.size[0] * STUDS, w.size[1] * STUDS, w.size[2] * STUDS],
        ...lookAt(i),
      });
    }
  }
}
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
  // facets: Kristalle und Edelsteine Fläche für Fläche aus Keilen (echte Kanten statt Kugel oder Stufen).
  // Nach unten zeigende Flächen fallen weg (stecken im Boden oder sind nie zu sehen).
  if (r.facets && g.attributes.position) return facetMesh(out, mesh, lk, r, world);
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
      // stark verjüngt mit wenigen Ecken (Vulkankegel, Schalen, Turmdächer): Flächen aus Keilen statt Stufen
      const cu = mesh.userData.rbx || {};
      if (!cu.sky && !cu.text && P.radialSegments <= 12 && P.heightSegments <= 4)
        return facetMesh(out, mesh, lk, { facetThick: Math.min(0.14, r * 0.2), name: ex.name || 'Kegel', facetsAll: P.openEnded }, world);
      const n = rt < 0.01 || rb < 0.01 ? 4 : 3;
      for (let i = 0; i < n; i++) {
        const k = (i + 0.5) / n, ri = rb + (rt - rb) * k;
        emit(out, mesh, 'Cylinder', mul(T(0, -h / 2 + k * h, 0), RZ90.clone(), S(h / n, 2 * Math.max(ri, 0.02), 2 * Math.max(ri, 0.02))), lk, ex);
      }
      return;
    }
    case 'ConeGeometry': {
      // Kegel auf der Insel (Tannen, Dächer, Spitzen) mit wenigen Ecken: Fläche für Fläche aus Keilen, echte Kanten
      // statt gestufter Zylinder („Torte“). Der Boden zeigt nach unten und fällt weg.
      const ru = mesh.userData.rbx || {};
      if (!ru.sky && !ru.tiers && !ru.text && P.radialSegments <= 12)
        return facetMesh(out, mesh, lk, { facetThick: Math.min(0.12, P.radius * 0.25), name: ex.name || 'Kegel' }, world);
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
      const closed = arc > Math.PI * 1.99;
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * arc, a1 = ((i + 1) / n) * arc;
        const m = cylLocal(V(Math.cos(a0) * R, Math.sin(a0) * R, 0), V(Math.cos(a1) * R, Math.sin(a1) * R, 0), tube);
        if (m) emit(out, mesh, 'Cylinder', m, lk, ex);
        // Kugelgelenk an jedem Knick: keine Lücke zwischen den Zylinderstücken (bei dicken Ringen sichtbar)
        if ((i > 0 || closed) && tube > 0.06) emit(out, mesh, 'Ellipsoid', mul(T(Math.cos(a0) * R, Math.sin(a0) * R, 0), S(2 * tube, 2 * tube, 2 * tube)), lk, ex);
      }
      return;
    }
    case 'TubeGeometry': {
      const path = P.path, r = P.radius, n = Math.min(14, P.tubularSegments || 10);
      for (let i = 0; i < n; i++) {
        const m = cylLocal(path.getPoint(i / n), path.getPoint((i + 1) / n), r);
        if (m) emit(out, mesh, 'Cylinder', m, lk, ex);
        // Kugelgelenk an jedem Knick (Zuckerstangen, Ranken, Bögen)
        if (i > 0 && r > 0.06) {
          const q = path.getPoint(i / n);
          emit(out, mesh, 'Ellipsoid', mul(T(q.x, q.y, q.z), S(2 * r, 2 * r, 2 * r)), lk, ex);
        }
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

// ── Boden: glatte Geländeoberfläche aus Dreiecken ─────────────────────────────
// Jedes Dreieck wird in Roblox aus zwei Keilen (WedgePart) gebaut, wie bei Profi-Terrain aus Parts: Die Seitenfläche
// der Keile liegt genau auf dem Dreieck, der Körper (TERRAIN_THICK) hängt darunter. Das Gitter folgt Ringen um die
// Mitte, so bleibt der Inselrand rund. Farbe je Dreieck: weiche Flecken in fünf Tönen, Hänge etwas dunkler und
// erdiger, am Rand ein Hauch heller (Sonnenkante). Gegenstände stehen auf built.height und damit genau auf dem Boden.
// 11 Ringe × 56 Stücke: rund 1.200 Dreiecke, glatt genug und sparsam mit Teilen
const TERRAIN_RINGS = 11, TERRAIN_SEGS = 56, TERRAIN_THICK = 0.16;

// Dreieck a, b, c (THREE.Vector3 in Einheiten) → zwei Keile; Seitenfläche auf dem Dreieck, Körper unter der Fläche
export function triangleWedges(a, b, c, thick = TERRAIN_THICK, outward = null) {
  let ab = b.clone().sub(a), ac = c.clone().sub(a), bc = c.clone().sub(b);
  const abd = ab.dot(ab), acd = ac.dot(ac), bcd = bc.dot(bc);
  if (abd > acd && abd > bcd) [c, a] = [a, c];
  else if (acd > bcd && acd > abd) [a, b] = [b, a];
  ab = b.clone().sub(a);
  ac = c.clone().sub(a);
  bc = c.clone().sub(b);
  const right = ac.clone().cross(ab);
  if (right.lengthSq() < 1e-10) return [];
  right.normalize();
  const up = bc.clone().cross(right).normalize();
  const back = bc.clone().normalize();
  const h = Math.abs(ab.dot(up));
  // nach oben (bzw. nach außen) zeigende Normale: der Körper der Keile liegt darunter (bzw. innen)
  const n = outward ? (right.dot(outward) >= 0 ? right.clone() : right.clone().negate()) : right.y >= 0 ? right.clone() : right.clone().negate();
  const sink = n.clone().multiplyScalar(-thick / 2);
  const rot = (X, Y, Z) => [X.x, Y.x, Z.x, X.y, Y.y, Z.y, X.z, Y.z, Z.z];
  return [
    { pos: a.clone().add(b).multiplyScalar(0.5).add(sink), rot: rot(right, up, back), size: [thick, h, Math.abs(ab.dot(back))] },
    { pos: a.clone().add(c).multiplyScalar(0.5).add(sink), rot: rot(right.clone().negate(), up, back.clone().negate()), size: [thick, h, Math.abs(ac.dot(back))] },
  ].filter((w) => w.size[1] > 1e-4 && w.size[2] > 1e-4);
}

function terrainSurface(out, built, world) {
  const R = built.radius, material = GROUND[world.id] || 'SmoothPlastic';
  const rand = seededRand(world.id + ':boden');
  const g = vivid(world.ground, 0.25);
  // fünf Töne von etwas dunkler bis etwas heller, dazu ein Hang-Ton zwischen Boden und Rand-Erde
  // Wiesen: dunkle Flecken etwas bläulicher, helle etwas gelblicher (wie trockenes und frisches Gras)
  const grassy = material === 'Grass';
  const hue = (hex, h, s, l) => '#' + new THREE.Color(hex).offsetHSL(grassy ? h : 0, s, relL(hex, l)).getHexString();
  const tones = [hue(g, 0.012, 0.03, -0.085), hue(g, 0.006, 0.015, -0.04), g, hue(g, -0.012, 0.02, 0.035), hue(g, -0.025, 0.02, 0.06)];
  const slopeTone = '#' + new THREE.Color(g).lerp(new THREE.Color(vivid(world.side, 0.15)), 0.32).getHexString();
  const rimTone = shade(g, 0.03, 0.075);
  // Gitterpunkte auf Ringen (innere Ringe leicht unregelmäßig, damit kein Muster entsteht)
  const ring = [[new THREE.Vector3(0, built.height(0, 0), 0)]];
  for (let i = 1; i <= TERRAIN_RINGS; i++) {
    const row = [];
    for (let j = 0; j < TERRAIN_SEGS; j++) {
      const wob = i === TERRAIN_RINGS ? 0 : (rand() - 0.5) * 0.35;
      const a = ((j + (i % 2) * 0.5 + (i === TERRAIN_RINGS ? 0 : (rand() - 0.5) * 0.3)) / TERRAIN_SEGS) * Math.PI * 2;
      const r = Math.min(R - 0.02, (i / TERRAIN_RINGS) * R + wob * (R / TERRAIN_RINGS));
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      row.push(new THREE.Vector3(x, built.height(x, z), z));
    }
    ring.push(row);
  }
  const tris = [];
  for (let j = 0; j < TERRAIN_SEGS; j++) tris.push([ring[0][0], ring[1][j], ring[1][(j + 1) % TERRAIN_SEGS]]);
  for (let i = 1; i < TERRAIN_RINGS; i++)
    for (let j = 0; j < TERRAIN_SEGS; j++) {
      const j1 = (j + 1) % TERRAIN_SEGS;
      const a0 = ring[i][j], a1 = ring[i][j1], b0 = ring[i + 1][j], b1 = ring[i + 1][j1];
      // Diagonale abwechselnd, so wirken die Flächen nicht gekämmt
      if ((i + j) % 2) tris.push([a0, b0, b1], [a0, b1, a1]);
      else tris.push([a0, b0, a1], [a1, b0, b1]);
    }
  for (const [a, b, c] of tris) {
    const cx = (a.x + b.x + c.x) / 3, cz = (a.z + b.z + c.z) / 3;
    const nrm = c.clone().sub(a).cross(b.clone().sub(a)).normalize();
    const slope = 1 - Math.abs(nrm.y);
    // weiche Flecken: zwei überlagerte Wellen plus wenig Zufall, auf fünf Stufen abgebildet
    const n = Math.sin(cx * 0.31 + 1.3) * Math.cos(cz * 0.27 - 0.7) * 0.65 + Math.sin((cx - cz) * 0.15 + 0.4) * 0.45 + Math.sin(cx * 0.9 + cz * 0.7) * 0.12 + (rand() - 0.5) * 0.3;
    let color = tones[Math.max(0, Math.min(4, Math.round((n + 1) * 2)))];
    if (slope > 0.2) color = slopeTone;
    else if (slope > 0.12) color = '#' + new THREE.Color(color).lerp(new THREE.Color(slopeTone), 0.5).getHexString();
    if (Math.hypot(cx, cz) > R * 0.955) color = rimTone;
    // bemalter Boden (ausgetretene Pfade, Plätze, Felder): Rand leicht ausgefranst, zwei Töne
    let mat = material;
    const fray = 0.8 + ((Math.sin(cx * 12.9898 + cz * 78.233) * 43758.5453) % 1 + 1) % 1 * 0.45;
    for (const p of built.paint || []) {
      if (Math.hypot(cx - p.x, cz - p.z) > p.r * fray) continue;
      color = n > 0 ? p.color : shade(p.color, 0.02, -0.035);
      mat = p.material || material;
      break;
    }
    for (const w of triangleWedges(a, b, c)) {
      out.push({
        shape: 'Wedge', className: 'WedgePart', name: 'Boden',
        pos: [w.pos.x * STUDS, w.pos.y * STUDS, w.pos.z * STUDS], rot: w.rot,
        size: [w.size[0] * STUDS, w.size[1] * STUDS, w.size[2] * STUDS],
        color, material: mat, transparency: 0,
      });
    }
  }
  // tiefster Punkt des Bodens: die Felsplatte darunter muss tiefer liegen
  let low = Infinity;
  for (const row of ring) for (const v of row) low = Math.min(low, v.y);
  built.groundLow = low;
}


// Wasserfälle über die Inselkante: Wasser, Lava, Sirup – mit Gischt unten
const FALLS = {
  // real: Wasser fällt im Bogen über die Kante, wird nach unten breiter und durchscheinend, strömt sichtbar
  normal: { color: '#3a9fd8', light: '#e4f6ff', deep: '#2a78b0', material: 'Glass', transparency: 0.2, count: 2, real: true },
  wald: { color: '#2f8fc8', light: '#dcf2ff', deep: '#22648f', material: 'Glass', transparency: 0.2, count: 1, real: true },
  eis: { color: '#9fe8ff', light: '#ffffff', material: 'Ice', transparency: 0.15, count: 1 },
  // Lava: glühender Fall im Bogen, unten Rauch und aufsteigende Funken
  lava: { color: '#ff5a12', light: '#ffd27a', deep: '#c42a06', material: 'Neon', transparency: 0, count: 2, real: true, kind: 'lava' },
  sonne: { color: '#ffa41c', light: '#fff09a', material: 'Neon', transparency: 0, count: 2 },
  // Candy: dicker Schokoladenfall, fließt langsam, glänzende Streifen, unten Schokospritzer
  candy: { color: '#6e3a1c', light: '#b0703e', deep: '#3e1d0c', material: 'SmoothPlastic', transparency: 0, count: 2, real: true, kind: 'schoko' },
  // hoehle: kein Kristallwasser mehr (Werkstatt-Wunsch)
  alien: { color: '#86ff52', light: '#e2ffc8', material: 'Neon', transparency: 0, count: 1 },
};
// Wolkenmeer unter der Insel (Einheiten): Grundhöhe und Mulde unter der Insel (gleich in skyShield)
// Die Höhe hängt an der Inseltiefe, die für alle Inseln gleich ist (auch für den größeren Spawn)
function seaBase() {
  return -1 - 5.5 * (ISLAND_RADIUS / 6) - 6;
}
function seaDip(R, d) {
  const nr = Math.max(0, 1 - d / (R * 2.3));
  return -(nr * nr * (3 - 2 * nr)) * 2.6;
}
function waterfalls(out, emitters, built, world) {
  const f = FALLS[world.id];
  if (!f) return;
  if (f.real) return realFalls(out, emitters, built, world, f);
  const R = built.radius, depth = 5.5 * (ISLAND_RADIUS / 6), rand = seededRand(world.id + ':fall');
  const start = rand() * Math.PI * 2;
  for (let i = 0; i < f.count; i++) {
    const a = start + i * 2.4;
    const ca = Math.cos(a), sa = Math.sin(a);
    const top = Math.max(built.height(ca * (R - 0.6), sa * (R - 0.6)), 0.1);
    // fällt frei an der Felszunge vorbei bis ins Wolkenmeer: oben ein dichter Vorhang, unten breiter und
    // durchscheinender (das Wasser zerstäubt), unten eine Gischtwolke auf dem Meer
    const bottom = seaBase() + 3.4 + seaDip(R, R + 0.6) * (40 / STUDS), W = 2.1;
    const mid = Math.min(-depth * 0.45, top - 6), h1 = top - mid, h2 = mid - bottom;
    const rot = around(a);
    const at = (r, y) => [ca * r * STUDS, y * STUDS, sa * r * STUDS];
    const side = (p, off) => [p[0] - sa * off * STUDS, p[1], p[2] + ca * off * STUDS];
    // Rinne oben auf der Insel
    out.push({ shape: 'Block', name: 'Wasserfall', pos: at(R - 1.3, top + 0.04), rot, size: [W * STUDS, 0.12 * STUDS, 2.6 * STUDS], color: f.color, material: f.material, transparency: f.transparency });
    // fallender Vorhang (die Narbe ragt bis R + 0,2 hinaus) und helle Streifen davor
    out.push({ shape: 'Block', name: 'Wasserfall', pos: at(R + 0.4, top - h1 / 2), rot, size: [W * STUDS, h1 * STUDS, 0.3 * STUDS], color: f.color, material: f.material, transparency: f.transparency });
    out.push({ shape: 'Block', name: 'Wasserfall', pos: at(R + 0.45, mid - h2 / 2 + 0.3), rot, size: [W * 1.35 * STUDS, (h2 + 0.6) * STUDS, 0.3 * STUDS], color: f.color, material: f.material, transparency: Math.min(0.75, f.transparency + 0.4) });
    for (const off of [-0.45, 0.4]) {
      out.push({ shape: 'Block', name: 'Wasserfall', pos: side(at(R + 0.57, top - h1 / 2), off), rot, size: [0.32 * STUDS, h1 * STUDS, 0.06 * STUDS], color: f.light, material: f.material, transparency: f.material === 'Neon' ? 0 : 0.2 });
      out.push({ shape: 'Block', name: 'Wasserfall', pos: side(at(R + 0.62, mid - h2 / 2), off * 1.3), rot, size: [0.26 * STUDS, h2 * STUDS, 0.06 * STUDS], color: f.light, material: f.material, transparency: 0.5 });
    }
    // Schaum an der Kante und eine Gischtwolke auf dem Meer
    out.push({ shape: 'Ellipsoid', name: 'Wasserfall', pos: at(R + 0.3, top), rot, size: [(W + 0.6) * STUDS, 0.5 * STUDS, 0.9 * STUDS], color: f.light, material: 'SmoothPlastic', transparency: 0.05 });
    for (let j = 0; j < 5; j++) {
      const off = (j - 2) * 0.9;
      out.push({ shape: 'Ellipsoid', name: 'Wasserfall', pos: side(at(R + 0.6 + (j % 2) * 0.5, bottom + 0.4 + (j % 3) * 0.35), off), rot, size: [(2 + (j % 2)) * STUDS, 1.4 * STUDS, 2 * STUDS], color: f.light, material: 'SmoothPlastic', transparency: 0.25 });
    }
    emitters.push({
      name: 'Gischt',
      pos: at(R + 0.5, bottom + 0.6), size: [1.2 * STUDS, 1, 1.2 * STUDS], direction: 'Top',
      colors: [f.light, '#ffffff'], particleSize: 0.9 * STUDS, rate: 22,
      speed: [0.4 * STUDS, 1.1 * STUDS], lifetime: [1.2, 2.4], spread: [40, 40],
      lightEmission: f.material === 'Neon' ? 1 : 0.3, squares: false,
    });
  }
}

// Wasserfall wie in echt: der Bach läuft in einer Rinne zur Kante, das Wasser schießt im Bogen hinaus und fällt
// auf einer Wurfparabel (x = v·t, y = −g/2·t²). Der Vorhang ist oben dicht und schmal, unten breiter, dünner und
// durchscheinend. Helle Schlieren laufen mit, Partikel strömen sichtbar nach unten, unten steigt Gischt auf.
function realFalls(out, emitters, built, world, f) {
  const R = built.radius, rand = seededRand(world.id + ':fall');
  const start = built.fallAngle ?? rand() * Math.PI * 2;
  const kind = f.kind || 'wasser';
  const VX = kind === 'schoko' ? 0.5 : 0.85, G = 2.2; // Einheiten/s und Einheiten/s² (nur für die Form der Bahn)
  const GROW = kind === 'schoko' ? 0.2 : kind === 'lava' ? 0.35 : 0.55; // wie stark der Vorhang nach unten breiter wird
  const thick = kind !== 'wasser'; // Schokolade und Lava sind dick und undurchsichtig
  const mix = (a, b, k) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), k).getHexString();
  for (let i = 0; i < f.count; i++) {
    const a = start + i * 2.4, ca = Math.cos(a), sa = Math.sin(a);
    const top = Math.max(built.height(ca * (R - 0.6), sa * (R - 0.6)), 0.1);
    const bottom = seaBase() + 3.4 + seaDip(R, R + 2) * (40 / STUDS);
    const tEnd = Math.sqrt((2 * (top - bottom)) / G);
    const W = 2.0;
    // Punkte der Bahn (r = Abstand zur Inselmitte, y), oben dichter, damit der Bogen rund wirkt
    const N = 14, path = [];
    for (let j = 0; j <= N; j++) {
      const t = tEnd * (j / N) ** 1.6;
      path.push({ r: R + 0.15 + VX * t, y: top + 0.05 - (G / 2) * t * t, k: j / N });
    }
    const P3 = (r, y, off = 0) => new THREE.Vector3(ca * r - sa * off, y, sa * r + ca * off);
    // Block zwischen zwei Bahnpunkten: Y entlang der Bahn, Z nach außen, X quer
    const seg = (p0, p1, off, w, thick, push, look) => {
      const ur = p0.r - p1.r, uy = p0.y - p1.y, len = Math.hypot(ur, uy);
      const nr = uy / len, ny = -ur / len; // Normale nach außen
      const Y = new THREE.Vector3(ca * ur, uy, sa * ur).divideScalar(len);
      const Z = new THREE.Vector3(ca * nr, ny, sa * nr);
      const X = new THREE.Vector3().crossVectors(Y, Z);
      const m = P3((p0.r + p1.r) / 2 + nr * push, (p0.y + p1.y) / 2 + ny * push, off);
      out.push({
        shape: 'Block', name: 'Wasserfall', pos: [m.x * STUDS, m.y * STUDS, m.z * STUDS],
        rot: [X.x, Y.x, Z.x, X.y, Y.y, Z.y, X.z, Y.z, Z.z],
        size: [w * STUDS, (len + 0.08) * STUDS, thick * STUDS], ...look,
      });
    };
    // Rinne auf der Insel: Wasser mit hellem Schaumrand, fließt zur Kante
    const rot = around(a), at = (r, y, off = 0) => { const p = P3(r, y, off); return [p.x * STUDS, p.y * STUDS, p.z * STUDS]; };
    out.push({ shape: 'Block', name: 'Wasserfall', pos: at(R - 1.4, top + 0.05), rot, size: [W * 0.9 * STUDS, 0.1 * STUDS, 3 * STUDS], color: f.color, material: f.material, transparency: f.transparency });
    for (const off of [-1, 1])
      out.push({ shape: 'Block', name: 'Wasserfall', pos: at(R - 1.4, top + 0.08, off * W * 0.45), rot, size: [0.18 * STUDS, 0.06 * STUDS, 3 * STUDS], color: f.light, material: 'SmoothPlastic', transparency: 0.25 });
    // Vorhang: dunklerer Kern hinten, darüber die helle Wasserhaut, außen ein durchscheinender Schleier
    for (let j = 0; j < N; j++) {
      const p0 = path[j], p1 = path[j + 1], k = p1.k;
      const grow = 1 + k * GROW;
      if (thick) {
        // dicker Strang: dunkler Kern, glänzende (Schoko) oder glühende (Lava) Haut, nach unten nur wenig dünner
        seg(p0, p1, 0, W * grow * 0.9, 0.42 * (1 - k * 0.3), -0.08, { color: kind === 'lava' ? mix(f.deep, f.color, 0.35 + 0.3 * (1 - k)) : f.deep, material: kind === 'lava' ? 'Neon' : 'SmoothPlastic', transparency: 0 });
        seg(p0, p1, 0, W * grow, 0.12, 0.14, { color: kind === 'lava' ? mix(f.color, f.deep, k * 0.45) : mix(f.color, f.deep, k * 0.3), material: f.material, transparency: kind === 'lava' ? Math.min(0.5, k * 0.35) : 0 });
        continue;
      }
      seg(p0, p1, 0, W * grow * 0.86, 0.32 * (1 - k * 0.5), -0.08, { color: mix(f.deep, f.color, 0.3), material: f.material, transparency: Math.min(0.6, f.transparency + k * 0.3) });
      seg(p0, p1, 0, W * grow, 0.14, 0.12, { color: mix(f.color, f.light, 0.25 + 0.35 * k), material: f.material, transparency: Math.min(0.8, f.transparency + 0.1 + k * 0.45) });
      if (k > 0.25) seg(p0, p1, 0, W * grow * 1.35, 0.06, 0.3, { color: f.light, material: 'SmoothPlastic', transparency: Math.min(0.9, 0.55 + k * 0.3) });
    }
    // helle Schlieren in unterschiedlicher Breite und Länge, die mit dem Wasser fallen
    for (let s = 0; s < 9; s++) {
      const off = (rand() - 0.5) * W * 0.85, w = 0.08 + rand() * 0.16;
      const j0 = Math.floor(rand() * 4), j1 = Math.min(N, j0 + 5 + Math.floor(rand() * (N - 5)));
      const tr = 0.1 + rand() * 0.35;
      for (let j = j0; j < j1; j++) {
        const k = path[j + 1].k;
        seg(path[j], path[j + 1], off * (1 + k * GROW), w * (1 + k * 0.6), 0.04, 0.2 + s * 0.005, { color: f.light, material: kind === 'lava' ? 'Neon' : 'SmoothPlastic', transparency: Math.min(0.92, (thick ? tr * 0.6 : tr) + k * (thick ? 0.3 : 0.5)) });
      }
    }
    // weißer Wasserwulst an der Abbruchkante
    out.push({ shape: 'Ellipsoid', name: 'Wasserfall', pos: at(R + 0.2, top + 0.02), rot, size: [(W + 0.3) * STUDS, 0.32 * STUDS, 0.7 * STUDS], color: f.light, material: 'SmoothPlastic', transparency: 0.15 });
    // Gischtwolke am Aufprall: mehrere weiche, durchscheinende Ballen (Schokolade und Lava: keine Gischt)
    const end = path[N];
    for (let j = 0; j < (thick ? 0 : 7); j++) {
      const off = (j - 3) * 0.75 + (rand() - 0.5) * 0.4, s = 1.6 + rand() * 1.4;
      out.push({ shape: 'Ellipsoid', name: 'Wasserfall', pos: at(end.r + (rand() - 0.3) * 1.2, bottom + 0.3 + rand() * 0.6, off), rot, size: [s * STUDS, s * 0.6 * STUDS, s * 0.9 * STUDS], color: f.light, material: 'SmoothPlastic', transparency: 0.35 + rand() * 0.25 });
    }
    // Partikel: Wasser strömt über die Kante und fällt (Schwerkraft wie die Bahn oben), unten Gischt und Nebel.
    // Schokolade: dicke Tropfen, unten Spritzer. Lava: glühende Brocken, unten Rauch und aufsteigende Funken.
    const ER = [sa, 0, ca, 0, 1, 0, -ca, 0, sa]; // X quer, Y hoch, Z nach außen
    emitters.push({
      name: kind === 'lava' ? 'Lavastrom' : kind === 'schoko' ? 'Schokostrom' : 'Wasserstrom', pos: at(R + 0.25, top + 0.05), rot: ER, size: [W * 0.9 * STUDS, 0.2 * STUDS, 0.3 * STUDS], direction: 'Back',
      colors: thick ? [f.light, f.color] : [f.light, mix(f.color, f.light, 0.5)], particleSize: (thick ? 0.45 : 0.6) * STUDS, sizeEnd: (thick ? 0.6 : 1.1) * STUDS, rate: thick ? 40 : 70,
      speed: [VX * 0.9 * STUDS, VX * 1.15 * STUDS], lifetime: [tEnd * 0.95, tEnd * 1.05], spread: [4, 4],
      acceleration: [0, -G * STUDS, 0], squash: 0.9, transparency: thick ? [[0, 0], [0.8, 0.2], [1, 1]] : [[0, 0.2], [0.7, 0.45], [1, 1]],
      lightEmission: kind === 'lava' ? 1 : kind === 'schoko' ? 0 : 0.25, rotSpeed: [0, 0],
    });
    if (kind === 'schoko') {
      emitters.push({
        name: 'Schokospritzer', pos: at(end.r, bottom + 0.3), rot: ER, size: [W * 1.4 * STUDS, 0.3 * STUDS, 1 * STUDS], direction: 'Top',
        colors: [f.light, f.color], particleSize: 0.3 * STUDS, sizeEnd: 0.2 * STUDS, rate: 16,
        speed: [0.8 * STUDS, 1.6 * STUDS], lifetime: [0.8, 1.3], spread: [40, 40], acceleration: [0, -3 * STUDS, 0],
        transparency: [[0, 0], [0.8, 0.1], [1, 1]], lightEmission: 0,
      });
      continue;
    }
    if (kind === 'lava') {
      emitters.push({
        name: 'Lavarauch', pos: at(end.r, bottom + 0.6), rot: ER, size: [W * 1.6 * STUDS, 0.4 * STUDS, 1.4 * STUDS], direction: 'Top',
        colors: ['#4a3a36', '#2a2224'], particleSize: 1.4 * STUDS, sizeEnd: 3.4 * STUDS, rate: 10,
        speed: [0.5 * STUDS, 1.1 * STUDS], lifetime: [3, 5], spread: [30, 30], drag: 0.4,
        transparency: [[0, 1], [0.15, 0.55], [0.7, 0.8], [1, 1]], lightEmission: 0,
      });
      emitters.push({
        name: 'Lavafunken', pos: at(end.r, bottom + 0.5), rot: ER, size: [W * 1.4 * STUDS, 0.3 * STUDS, 1 * STUDS], direction: 'Top',
        colors: ['#ffd27a', '#ff5a12'], particleSize: 0.22 * STUDS, sizeEnd: 0.08 * STUDS, rate: 14,
        speed: [1.2 * STUDS, 2.4 * STUDS], lifetime: [1, 1.8], spread: [35, 35], acceleration: [0, -1.2 * STUDS, 0],
        transparency: [[0, 0], [0.7, 0.2], [1, 1]], lightEmission: 1,
      });
      continue;
    }
    emitters.push({
      name: 'Gischt', pos: at(end.r, bottom + 0.4), rot: ER, size: [W * 1.6 * STUDS, 0.4 * STUDS, 1.4 * STUDS], direction: 'Top',
      colors: ['#ffffff', f.light], particleSize: 1.1 * STUDS, sizeEnd: 2.6 * STUDS, rate: 18,
      speed: [0.3 * STUDS, 0.9 * STUDS], lifetime: [2, 3.5], spread: [55, 55], drag: 0.6,
      transparency: [[0, 1], [0.15, 0.55], [0.7, 0.75], [1, 1]], lightEmission: 0.1,
    });
    emitters.push({
      name: 'Spruehnebel', pos: at(end.r - 0.4, bottom + 2.2), rot: ER, size: [W * 1.3 * STUDS, 3 * STUDS, 1.2 * STUDS], direction: 'Back',
      colors: ['#ffffff'], particleSize: 0.7 * STUDS, sizeEnd: 1.8 * STUDS, rate: 8,
      speed: [0.2 * STUDS, 0.5 * STUDS], lifetime: [3, 5], spread: [70, 70], drag: 0.4, acceleration: [0, 0.15 * STUDS, 0],
      transparency: [[0, 1], [0.3, 0.75], [1, 1]], lightEmission: 0.1,
    });
  }
}

const CLOUD_RING = false;
// Wolken um Inseln mit Tageshimmel
function clouds(out, built, world) {
  const c = new THREE.Color(world.sky[0]);
  const day = 0.3 * c.r + 0.59 * c.g + 0.11 * c.b > 0.2;
  // mit Himmelsbild malt das Bild die Wolken, der Ring direkt an der Insel fällt weg
  if (!day || world.water || world.planet === 'p2' || SKYBOXES[world.id]) return;
  // Der Ring liegt im Eigenschatten der Lichtrichtung und wirkte als graue Klumpen. Die Welten ohne Himmelsbild
  // haben Wolkenbänke in der Ferne (WorldFx) und das Wolkenmeer darunter; das reicht für eine ruhige Umgebung.
  if (!CLOUD_RING) return;
  const R = built.radius, rand = seededRand(world.id + ':wolken');
  const tint = '#ffffff';
  for (let i = 0; i < 12; i++) {
    // knapp unter der Inselkante: von oben sieht man die besonnte Oberseite der Wolken
    const a = (i / 12) * Math.PI * 2 + rand() * 0.4, r = R + 2.5 + rand() * 5, y = -2.8 + rand() * 3;
    const n = 3 + Math.floor(rand() * 3);
    for (let j = 0; j < n; j++) {
      const s = 1.6 + rand() * 1.8;
      const off = (j - (n - 1) / 2) * 1.3;
      out.push({
        shape: 'Ellipsoid', name: 'Wolke',
        pos: [(Math.cos(a) * r - Math.sin(a) * off) * STUDS, (y + rand() * 0.6) * STUDS, (Math.sin(a) * r + Math.cos(a) * off) * STUDS],
        rot: around(a),
        size: [s * 1.3 * STUDS, s * 0.8 * STUDS, s * STUDS],
        // ohne Schatten: im Schatten der Insel sähen die Wolken grau aus
        color: tint, material: 'SmoothPlastic', transparency: 0, canCollide: false, castShadow: false, noShadow: true,
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
  // ein zweiter, etwas kleinerer Ring in Horizontfarbe macht den Übergang weich. Seine Oberkante liegt unter der
  // Inselspitze: sonst schnitte die durchscheinende Fläche quer durch die Insel (heller Streifen von unten gesehen).
  const hh = D * 0.45, htop = -D * 0.42;
  sky.push({ shape: 'Ellipsoid', name: 'Horizont', inside: true, pos: [0, htop - hh, 0], rot: id, size: [2 * D * 0.97, 2 * hh, 2 * D * 0.97], color: '#' + horizon.getHexString(), material: 'SmoothPlastic', transparency: 0.6, canCollide: false, castShadow: false, noShadow: true });
  // Mit Himmelsbild: eine Wolkenwand am Horizont verdeckt die Nachbarinseln (1500 Studs entfernt), darüber sieht
  // man das Himmelsbild. Sie steht hinter der fernen Kulisse von WorldFx (600–630 Studs) und noch in der Kuppel.
  // Die Kuppel blendet das Licht-Skript aus, sobald die Bild-IDs eingetragen sind.
  const box = SKYBOXES[world.id];
  if (box?.wall) {
    const W = box.wall, wr = seededRand(world.id + ':wand');
    const rows = [
      { y: -70, h: [200, 260], w: [300, 380], c: W.low },
      { y: 40, h: [130, 170], w: [190, 260], c: W.top },
    ];
    rows.forEach((row, ri) => {
      const n = Math.round((2 * Math.PI * 620) / ((row.w[0] + row.w[1]) / 2) * 1.15);
      for (let i = 0; i < n; i++) {
        const a = ((i + wr() * 0.6 + ri * 0.5) / n) * Math.PI * 2, r = 600 + wr() * 30;
        const w = row.w[0] + wr() * (row.w[1] - row.w[0]), h = row.h[0] + wr() * (row.h[1] - row.h[0]);
        // obere Reihe mit Lücken: dort schaut das Himmelsbild durch
        if (ri === 1 && wr() < 0.4) continue;
        // Wolkenturm: breiter, flacher Sockel und darauf seitlich versetzte Bäusche (wie Haufenwolken),
        // oben heller als unten
        const y = row.y + (wr() - 0.5) * 24, tx = -Math.sin(a), tz = Math.cos(a);
        const cloud = (dx, dy, sw, sh, c) => sky.push({
          shape: 'Ellipsoid', name: 'Wolkenwand', pos: [Math.cos(a) * r + tx * dx, y + dy, Math.sin(a) * r + tz * dx], rot: around(a),
          size: [sw, sh, sw * 0.9], color: c, material: 'SmoothPlastic', transparency: 0, canCollide: false, castShadow: false, noShadow: true,
        });
        // im All und in der Höhle keine Haufenwolken (wirkten dort wie Blasen): eine große, ruhige Nebelwand
        if (!box.sun) {
          cloud(0, 0, w, h, row.c[Math.floor(wr() * row.c.length)]);
          continue;
        }
        cloud(0, -h * 0.14, w * 1.1, h * 0.5, row.c[Math.floor(wr() * row.c.length)]);
        const puffs = 4 + Math.floor(wr() * 2);
        for (let k = 0; k < puffs; k++) {
          const u = k / (puffs - 1) - 0.5, mid = 1 - Math.abs(u) * 1.4;
          const sw = w * (0.3 + wr() * 0.1) * (0.8 + mid * 0.4);
          const c = (mid < 0.4 ? W.low : W.mid || W.top)[Math.floor(wr() * 2)];
          cloud(u * w * 0.78 + (wr() - 0.5) * w * 0.06, h * (0.02 + mid * 0.16 + wr() * 0.05), sw * 1.15, sw * (0.7 + wr() * 0.15), c);
        }
      }
    });
  }
  if (water && !SKYBOXES[world.id]) {
    // Wasseroberfläche hoch über der Insel (mit Himmelsbild malt das Bild die Oberfläche)
    sky.push({ shape: 'Block', name: 'Wasseroberflaeche', pos: [0, D * 0.62, 0], rot: id, size: [2 * D * 0.8, 2, 2 * D * 0.8], color: '#9fe8ff', material: 'Glass', transparency: 0.45, canCollide: false, castShadow: false, noShadow: true });
  }
  // Meer unter der Insel: Wolken, Nebel oder Dünen
  const R = built.radius * STUDS;
  const y0 = seaBase() * STUDS;
  const kind = water ? 'duene' : space ? 'nebel' : 'wolke';
  const colors = water
    ? [vivid(world.side, 0.1), shade(vivid(world.side, 0.1), 0, 0.05), shade(vivid(world.side, 0.1), 0, -0.05)]
    : space
      ? ['#' + horizon.clone().lerp(new THREE.Color(world.accent), 0.4).getHexString(), '#' + horizon.getHexString(), '#' + top.clone().lerp(new THREE.Color(world.accent), 0.25).getHexString()]
      : SKYBOXES[world.id]?.sea
        ? SKYBOXES[world.id].sea // Farbe passend zum Himmelsbild
        : night
          ? ['#3c3852', '#47425f', '#2f2c43']
          : ['#ffffff', '#f2f6ff', '#e6eefc'];
  const step = 92;
  for (let x = -D; x <= D; x += step)
    for (let z = -D; z <= D; z += step) {
      const jx = x + (rand() - 0.5) * step * 0.6, jz = z + (rand() - 0.5) * step * 0.6;
      if (Math.hypot(jx, jz) > D * 0.93) continue;
      const w = step * (1.5 + rand() * 0.6), h = kind === 'duene' ? 22 + rand() * 18 : 34 + rand() * 30;
      // unter der Insel eine Mulde im Meer: die Felsspitze schwebt frei über den Wolken wie im Vorbild
      const near = seaDip(R, Math.hypot(jx, jz));
      // Glutmeer (Lava): zwischen der dunklen Kruste leuchten flachere Lavabecken etwas tiefer
      const glow = SKYBOXES[world.id]?.seaGlow;
      if (glow && rand() < glow.share) {
        sky.push({
          shape: 'Ellipsoid', name: 'Lavameer', pos: [jx, y0 + 4 + rand() * 6 + near * 30, jz], rot: id,
          size: [w * 1.1, h * 0.45, w], color: glow.colors[Math.floor(rand() * glow.colors.length)],
          material: 'Neon', transparency: 0, canCollide: false, castShadow: false, noShadow: true,
        });
        continue;
      }
      sky.push({
        shape: 'Ellipsoid', name: kind === 'duene' ? 'Duene' : kind === 'nebel' ? 'Nebel' : 'Wolkenmeer',
        pos: [jx, y0 + rand() * 18 + near * 40, jz], rot: id,
        size: [w, h, w * (0.8 + rand() * 0.4)],
        color: colors[Math.floor(rand() * colors.length)],
        material: kind === 'duene' ? 'Sand' : SKYBOXES[world.id]?.seaMaterial || 'SmoothPlastic',
        // undurchsichtig: durchscheinende, sich überlagernde Kugeln wirkten zum Horizont hin wie Blasen
        transparency: 0, canCollide: false, castShadow: false, noShadow: true,
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
// Feinschliff je Welt für die Roblox-Partikel (die Webseite nutzt weiter FX aus worldFactory.js)
const EMIT_TWEAK = {
  // Eis: wenige, feine Flocken, die langsam trudelnd sinken (Luftwiderstand, leichter Wind, Drehung)
  eis: (e, R) => ({
    ...e,
    particleSize: 0.12 * STUDS, sizeEnd: 0.1 * STUDS,
    rate: Math.round(2.4 * (R / 6) ** 2), speed: [0.25 * STUDS, 0.5 * STUDS], lifetime: [16, 22],
    spread: [30, 30], drag: 0.3, acceleration: [0.05 * STUDS, -0.03 * STUDS, 0.03 * STUDS], rotSpeed: [-90, 90],
    transparency: [[0, 1], [0.08, 0.2], [0.85, 0.3], [1, 1]], lightEmission: 0.2,
  }),
  // Wald: wenige, kleine Glühwürmchen in Bodennähe, die langsam schweben und sanft pulsieren statt zu flimmern
  wald: (e, R) => ({
    ...e,
    pos: [0, 1.6 * STUDS, 0], size: [e.size[0] * 0.9, 2.4 * STUDS, e.size[2] * 0.9],
    particleSize: 0.17 * STUDS, sizeEnd: 0.13 * STUDS,
    rate: Math.round(1.6 * (R / 6) ** 2), lifetime: [6, 10],
    speed: [0.15 * STUDS, 0.4 * STUDS], spread: [180, 180], drag: 0.35, acceleration: [0, 0.03 * STUDS, 0],
    transparency: [[0, 1], [0.12, 0.25], [0.28, 0.85], [0.45, 0.2], [0.62, 0.9], [0.8, 0.3], [1, 1]],
    rotSpeed: [0, 0],
  }),
};
// Werkstatt-Wünsche: in diesen Welten wie Wald und Eis weniger, kleinere Teilchen, die langsam schweben,
// trudeln und sanft pulsieren statt zu flimmern; in NO_PARTICLES gar keine schwebenden Teilchen
const CALM = new Set(['candy', 'lava', 'neptun', 'sonne', 'quarzfeld', 'smaragdwald', 'jadetempel', 'saphirsee', 'diamantkern', 'tiefseegraben', 'korallenriff']);
const NO_PARTICLES = new Set(['opalwolken', 'alien', 'goetterthron', 'hoehle']);
const LIFE = /Voegel|Schmetterling|Fisch|Wal|Qualle|Vogel|Sternschnuppen/; // Tiere und Sternschnuppen am Himmel sind keine schwebenden Partikel
function calm(e, { pulse = false } = {}) {
  return {
    ...e,
    rate: Math.max(1, Math.round(e.rate * 0.35)),
    particleSize: e.particleSize * 0.75, sizeEnd: (e.sizeEnd ?? e.particleSize * 0.8) * 0.75,
    speed: e.speed.map((v) => v * 0.55), lifetime: e.lifetime.map((v) => v * 1.5),
    drag: e.drag ?? 0.3, rotSpeed: e.rotSpeed ?? [-60, 60],
    ...(e.acceleration ? { acceleration: e.acceleration.map((v) => v * 0.5) } : {}),
    transparency: pulse
      ? [[0, 1], [0.12, 0.3], [0.3, 0.8], [0.48, 0.3], [0.66, 0.85], [0.84, 0.35], [1, 1]]
      : [[0, 1], [0.12, 0.3], [0.8, 0.45], [1, 1]],
  };
}
function emitterFor(world, R) {
  if (NO_PARTICLES.has(world.id)) return null;
  const e = baseEmitter(world, R);
  if (e && EMIT_TWEAK[world.id]) return EMIT_TWEAK[world.id](e, R);
  return e && CALM.has(world.id) ? calm(e, { pulse: (FX[world.fx]?.blink || 0) >= 0.8 }) : e;
}
function baseEmitter(world, R) {
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
    // Himmelsbild (Skybox) der Welt, falls gemalt (welten/js/skyboxes.js)
    himmel: SKYBOXES[world.id] ? { id: world.id, sun: SKYBOXES[world.id].sun !== false } : null,
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

// flach und auf dem Boden (Weg, Platz, Bach, Pad): gehört zur Insel, nicht zu den Gebäuden.
// Geprüft wird das ganze Objekt, das auf der Insel steht (direkt unter root), damit z. B. der flache
// Fußboden eines Ladens beim Laden bleibt. Ergebnis je Objekt merken.
const flatBox = new THREE.Box3(), flatC = new THREE.Vector3(), flatCache = new WeakMap();
function flatOnGround(mesh, built) {
  let top = mesh;
  while (top.parent && top.parent !== built.root) top = top.parent;
  if (!top.parent) top = mesh; // hängt nicht an der Insel (z. B. direkt in der Szene)
  if (flatCache.has(top)) return flatCache.get(top);
  flatBox.setFromObject(top);
  let flat = false;
  if (!flatBox.isEmpty() && flatBox.max.y - flatBox.min.y <= 0.3) {
    flatBox.getCenter(flatC);
    flat = flatBox.min.y < built.height(flatC.x, flatC.z) + 0.25;
  }
  flatCache.set(top, flat);
  return flat;
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
    if (o.userData.rbx?.isle) {
      const c = o.getWorldPosition(V(0, 0, 0));
      miniIsland(sky, c, o.userData.rbx.isle.w, world, o.userData.rbx.isle.seed, { peak: o.userData.rbx.isle.peak });
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
    const out = rbx.sky ? sky : parts, n0 = out.length;
    convertMesh(out, o, world);
    // Ebenen für die Vorschau (die Werkstatt blendet sie einzeln aus):
    //   deko  Streu-Deko (Bäume, Büsche, Felsen, Kisten …)
    //   bau   feste Gebäude und alles andere, was auf der Insel steht
    //   (ohne Kennzeichen) Boden: flache Teile auf dem Boden wie Wege, Plätze, Bäche, Pads
    if (!rbx.sky) {
      let deko = false;
      for (let q = o; q && !deko; q = q.parent) deko = !!q.userData.deko;
      const layer = deko ? 'deko' : flatOnGround(o, built) ? null : 'bau';
      if (layer) for (let i = n0; i < out.length; i++) out[i][layer] = true;
    }
  });
  pullInsideDome(sky);
  // Kulisse (Schwebeinseln, Nachbarinseln, ferne Modelle) wirft keine Schatten: sonst lagen große, schwarze
  // Schattenflecken der Nachbarinseln auf der Hauptinsel
  for (const p of sky) if (p.castShadow === undefined) Object.assign(p, { castShadow: false, noShadow: true });
  terrainSurface(parts, built, world);
  // Grasnarbe, Erdschicht und Felszunge als eine modellierte Hülle (roblox/js/islandShell.js)
  islandShell(parts, built, world);
  clouds(sky, built, world);
  skyShield(sky, built, world);
  const emitter = emitterFor(world, built.radius);
  const emitters = emitter ? [emitter] : [];
  waterfalls(parts, emitters, built, world);
  // weitere Partikel der Welt (Schmetterlinge, Vögel, Blätter, Polarlicht …) von Einheiten in Studs
  const n0 = emitters.length;
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
      ...(e.acceleration ? { acceleration: e.acceleration.map((v) => v * STUDS) } : {}), // Schwerkraft (Fontäne)
      ...(e.drag ? { drag: e.drag } : {}),
      ...(e.rotSpeed ? { rotSpeed: e.rotSpeed } : {}),
      ...(e.transparency ? { transparency: e.transparency } : {}),
      ...(e.rot ? { rot: e.rot } : {}),
      ...(e.keep ? { keep: true } : {}),
      ...(e.sizeEnd ? { sizeEnd: e.sizeEnd * STUDS } : {}),
      ...(e.squash ? { squash: e.squash } : {}),
      squares: false,
    });
  // Werkstatt-Wünsche: weitere Teilchen der Welt ebenso beruhigen oder entfernen (Tiere bleiben)
  for (let i = emitters.length - 1; i >= n0; i--) {
    if (LIFE.test(emitters[i].name || '') || emitters[i].keep) continue;
    if (NO_PARTICLES.has(world.id)) emitters.splice(i, 1);
    else if (CALM.has(world.id)) emitters[i] = calm(emitters[i]);
  }
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
