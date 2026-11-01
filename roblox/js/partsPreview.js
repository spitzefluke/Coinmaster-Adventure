// Zeigt die Roblox-Teile einer Welt in three.js an – so, wie die Insel nach dem Import in
// Roblox Studio aus Blöcken, Zylindern und Kugeln aussieht.

import * as THREE from 'three';
import { STUDS } from './worldParts.js';

const geo = {
  Block: new THREE.BoxGeometry(1, 1, 1),
  Cylinder: new THREE.CylinderGeometry(0.5, 0.5, 1, 20).rotateZ(-Math.PI / 2), // Achse X wie in Roblox
  Ellipsoid: new THREE.SphereGeometry(0.5, 20, 14),
};

// Roblox-Materialien grob nachgestellt
const ROUGH = { SmoothPlastic: 0.55, Neon: 0.4, Metal: 0.3, Glass: 0.05, Ice: 0.15, Glacier: 0.2, Marble: 0.35 };

// Teile werden nach Form und Material gebündelt und als InstancedMesh gezeichnet:
// wenige Draw-Calls statt tausender einzelner Meshes, die Farbe kommt pro Instanz.
export function partsGroup({ parts, sky }) {
  const g = new THREE.Group();
  const buckets = new Map();
  const list = [...parts, ...sky].filter((p) => p.transparency < 1);
  for (const p of list) {
    const key = `${p.shape}|${p.material}|${p.transparency || 0}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(p);
  }
  const mats = [];
  const m4 = new THREE.Matrix4(), sc = new THREE.Matrix4(), col = new THREE.Color();
  for (const [key, ps] of buckets) {
    const { shape, material, transparency = 0 } = ps[0];
    const mat =
      material === 'Neon'
        ? new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: transparency > 0, opacity: 1 - transparency })
        : new THREE.MeshStandardMaterial({
            color: '#ffffff',
            roughness: ROUGH[material] ?? 0.8,
            metalness: material === 'Metal' ? 0.6 : 0,
            transparent: transparency > 0,
            opacity: 1 - transparency,
            flatShading: material !== 'Glass',
          });
    mats.push(mat);
    const inst = new THREE.InstancedMesh(geo[shape], mat, ps.length);
    ps.forEach((p, i) => {
      const r = p.rot;
      m4.set(r[0], r[1], r[2], p.pos[0] / STUDS, r[3], r[4], r[5], p.pos[1] / STUDS, r[6], r[7], r[8], p.pos[2] / STUDS, 0, 0, 0, 1);
      m4.multiply(sc.makeScale(p.size[0] / STUDS, p.size[1] / STUDS, p.size[2] / STUDS));
      inst.setMatrixAt(i, m4);
      inst.setColorAt(i, col.set(p.color));
    });
    inst.instanceMatrix.needsUpdate = true;
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
    inst.castShadow = inst.receiveShadow = true;
    inst.name = key;
    g.add(inst);
  }
  g.userData.count = list.length;
  g.userData.dispose = () => mats.forEach((m) => m.dispose());
  return g;
}
