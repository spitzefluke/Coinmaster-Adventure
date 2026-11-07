// Haustiere aus Claude Design („Haustiere Viewer“): Voxel-Builder, jedes Tier besteht nur aus Roblox-Teilen
// (Block, Wedge, Ball, Cylinder) mit Roblox-Materialien (Plastic, SmoothPlastic, Metal, Wood, Neon, Glass).
// Tiere schauen hier nach +Z, Boden y = 0. roblox/js/petParts.js macht daraus Studs mit Blick nach −Z.
import * as THREE from 'three';
export { THREE };
export const TAU = Math.PI * 2;

export function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const hash = (str) => { let h = 2166136261; for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };

const _c = new THREE.Color(), _d = new THREE.Color();
export const shade = (hex, k) => '#' + _c.set(hex).multiplyScalar(k).getHexString();
export const mix = (a, b, t) => '#' + _c.set(a).lerp(_d.set(b), t).getHexString();
const V = (a) => new THREE.Vector3(a[0], a[1], a[2]);
const toQ = (r) => (r && r.isQuaternion ? r.clone() : new THREE.Quaternion().setFromEuler(new THREE.Euler(r[0], r[1], r[2])));
export const aim = (dir) => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), V(dir).normalize());

export class Builder {
  constructor(seed, step = 0.14) {
    this.parts = [];
    this.m = new THREE.Matrix4();
    this.st = [];
    this.rnd = rng(seed);
    this.step = step;
    this.ped = false;
  }
  push(pos = [0, 0, 0], rot = [0, 0, 0], s = 1) {
    this.st.push(this.m.clone());
    this.m.multiply(new THREE.Matrix4().compose(V(pos), toQ(rot), new THREE.Vector3(s, s, s)));
  }
  pop() { this.m = this.st.pop(); }
  at(pos, rot, fn, s) { this.push(pos, rot, s); fn(); this.pop(); }
  part(shape, pos, size, color, o = {}) {
    const l = new THREE.Matrix4().compose(V(pos), toQ(o.rot || [0, 0, 0]), V(size));
    const mat = o.mat || 'Plastic';
    let col = color;
    const j = o.j ?? 0.07;
    if (j && mat !== 'Neon') col = shade(color, 1 + (this.rnd() - 0.5) * 2 * j);
    this.parts.push({ shape, m: this.m.clone().multiply(l), color: col, mat, ped: this.ped });
  }
  blk(p, s, c, o) { this.part('Block', p, s, c, o); }
  wedge(p, s, c, o) { this.part('Wedge', p, s, c, o); }
  ball(p, s, c, o) { this.part('Ball', p, typeof s === 'number' ? [s, s, s] : s, c, o); }
  cyl(p, s, c, o) { this.part('Cylinder', p, s, c, o); }
  neon(p, s, c, o = {}) { this.part('Block', p, s, c, { ...o, mat: 'Neon' }); }

  // Ellipsoid aus Würfeln (nur die Hülle). paint(u, p) → Farbe | {c, mat} | null; cut(u, p) → überspringen
  vox(c, r, color, o = {}) {
    const s = o.step ?? this.step, g = o.gap ?? 0.95;
    const n = r.map((v) => Math.max(0, Math.ceil(v / s)));
    const ins = (i, j, k) => { const x = (i * s) / r[0], y = (j * s) / r[1], z = (k * s) / r[2]; return x * x + y * y + z * z <= 1.0001; };
    for (let i = -n[0]; i <= n[0]; i++) for (let j = -n[1]; j <= n[1]; j++) for (let k = -n[2]; k <= n[2]; k++) {
      if (!ins(i, j, k)) continue;
      if (ins(i + 1, j, k) && ins(i - 1, j, k) && ins(i, j + 1, k) && ins(i, j - 1, k) && ins(i, j, k + 1) && ins(i, j, k - 1)) continue;
      const u = [(i * s) / r[0], (j * s) / r[1], (k * s) / r[2]];
      const p = [c[0] + i * s, c[1] + j * s, c[2] + k * s];
      if (o.cut && o.cut(u, p)) continue;
      let col = color, mat = o.mat;
      const pr = o.paint && o.paint(u, p);
      if (pr) { if (typeof pr === 'string') col = pr; else { col = pr.c; mat = pr.mat ?? mat; } }
      this.blk(p, [s * g, s * g, s * g], col, { mat, j: o.j });
    }
  }
  // Quader aus Würfeln (Hülle)
  voxBox(c, size, color, o = {}) {
    const s = o.step ?? this.step;
    const n = size.map((v) => Math.max(1, Math.round(v / s)));
    const d = size.map((v, i) => v / n[i]);
    for (let i = 0; i < n[0]; i++) for (let j = 0; j < n[1]; j++) for (let k = 0; k < n[2]; k++) {
      if (i && j && k && i < n[0] - 1 && j < n[1] - 1 && k < n[2] - 1) continue;
      const u = [n[0] > 1 ? (i / (n[0] - 1)) * 2 - 1 : 0, n[1] > 1 ? (j / (n[1] - 1)) * 2 - 1 : 0, n[2] > 1 ? (k / (n[2] - 1)) * 2 - 1 : 0];
      const p = [c[0] + (i - (n[0] - 1) / 2) * d[0], c[1] + (j - (n[1] - 1) / 2) * d[1], c[2] + (k - (n[2] - 1) / 2) * d[2]];
      let col = color, mat = o.mat;
      const pr = o.paint && o.paint(u, p);
      if (pr) { if (typeof pr === 'string') col = pr; else { col = pr.c; mat = pr.mat ?? mat; } }
      this.blk(p, [d[0] * 0.96, d[1] * 0.96, d[2] * 0.96], col, { mat, j: o.j });
    }
  }
  // Dorn aus zwei gekreuzten Wedge-Paaren, zeigt entlang dir
  spike(pos, dir, len, w, color, o = {}) {
    this.push(pos, aim(dir));
    for (const ry of [0, Math.PI / 2]) {
      this.push([0, len / 2, 0], [0, ry, 0]);
      this.wedge([0, 0, w / 4], [w * 0.42, len, w / 2], color, o);
      this.push([0, 0, -w / 4], [0, Math.PI, 0]);
      this.wedge([0, 0, 0], [w * 0.42, len, w / 2], color, o);
      this.pop();
      this.pop();
    }
    this.pop();
  }
  // Achteck aus 8 Blöcken (Apothem r)
  octa(c, r, h, color, o = {}) {
    const chord = 2 * r * Math.tan(Math.PI / 8) + 0.02;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU + (o.rot ?? 0);
      this.blk([c[0] + Math.cos(a) * r * 0.5, c[1], c[2] + Math.sin(a) * r * 0.5], [chord, h, r], color, { rot: [0, Math.PI / 2 - a, 0], mat: o.mat, j: o.j ?? 0.05 });
    }
  }
  // Ring aus Blöcken (liegt in xz-Ebene)
  ring(c, r, n, size, color, o = {}) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      this.blk([c[0] + Math.cos(a) * r, c[1], c[2] + Math.sin(a) * r], size, color, { ...o, rot: [0, Math.PI / 2 - a, 0] });
    }
  }
}

// Punkt auf der Vorderseite eines Ellipsoids
export const surf = (c, r, x, y) => c[2] + r[2] * Math.sqrt(Math.max(0, 1 - ((x - c[0]) / r[0]) ** 2 - ((y - c[1]) / r[1]) ** 2));

// ── Geometrien & Materialien (für den Blender-Export) ──
// Wedge wie im Design: Boden unten, hohe Kante bei −Z
function wedgeGeo() {
  const a = [-0.5, -0.5, -0.5], b = [0.5, -0.5, -0.5], c = [0.5, -0.5, 0.5], d = [-0.5, -0.5, 0.5], e = [0.5, 0.5, -0.5], f = [-0.5, 0.5, -0.5];
  const v = [a, b, c, a, c, d, a, e, b, a, f, e, f, d, c, f, c, e, a, d, f, b, e, c].flat();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  g.computeVertexNormals();
  return g;
}
let GEO = null;
const geo = () => (GEO ??= {
  Block: new THREE.BoxGeometry(1, 1, 1),
  Wedge: wedgeGeo(),
  Ball: new THREE.IcosahedronGeometry(0.5, 2),
  Cylinder: new THREE.CylinderGeometry(0.5, 0.5, 1, 18),
});
function makeMat(name) {
  switch (name) {
    case 'Neon': return new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false });
    case 'Metal': return new THREE.MeshStandardMaterial({ color: '#ffffff', metalness: 0.85, roughness: 0.3 });
    case 'Smooth': return new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.28, metalness: 0.05 });
    case 'Wood': return new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9 });
    case 'Glass': return new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.05, transparent: true, opacity: 0.55, clearcoat: 1 });
    default: return new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.62, metalness: 0 });
  }
}
// Teile → InstancedMeshes (eins je Form × Material)
export function toMeshes(parts) {
  const groups = new Map();
  for (const p of parts) {
    const k = p.shape + '|' + p.mat;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(p);
  }
  const out = new THREE.Group(), col = new THREE.Color();
  for (const [k, list] of groups) {
    const [shape, mat] = k.split('|');
    const m = new THREE.InstancedMesh(geo()[shape], makeMat(mat), list.length);
    list.forEach((p, i) => {
      m.setMatrixAt(i, p.m);
      col.set(p.color);
      m.setColorAt(i, col);
    });
    m.instanceMatrix.needsUpdate = true;
    m.userData.mat = mat;
    m.computeBoundingSphere();
    out.add(m);
  }
  return out;
}
export function bounds(parts) {
  const box = new THREE.Box3(), v = new THREE.Vector3();
  for (const p of parts) for (let i = 0; i < 8; i++) {
    v.set(i & 1 ? 0.5 : -0.5, i & 2 ? 0.5 : -0.5, i & 4 ? 0.5 : -0.5).applyMatrix4(p.m);
    box.expandByPoint(v);
  }
  return box;
}
