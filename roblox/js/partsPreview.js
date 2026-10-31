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

export function partsGroup({ parts, sky }) {
  const g = new THREE.Group();
  const mats = new Map();
  const matFor = (p) => {
    const key = `${p.color}|${p.material}|${p.transparency}`;
    if (!mats.has(key)) {
      const neon = p.material === 'Neon';
      mats.set(
        key,
        new THREE.MeshStandardMaterial({
          color: p.color,
          roughness: ROUGH[p.material] ?? 0.8,
          metalness: p.material === 'Metal' ? 0.6 : 0,
          emissive: neon ? p.color : '#000000',
          emissiveIntensity: neon ? 0.9 : 0,
          transparent: p.transparency > 0,
          opacity: 1 - (p.transparency || 0),
          flatShading: p.material !== 'Glass',
        }),
      );
    }
    return mats.get(key);
  };
  const m4 = new THREE.Matrix4();
  for (const p of [...parts, ...sky]) {
    if (p.transparency >= 1) continue;
    const mesh = new THREE.Mesh(geo[p.shape], matFor(p));
    const r = p.rot;
    m4.set(r[0], r[1], r[2], p.pos[0] / STUDS, r[3], r[4], r[5], p.pos[1] / STUDS, r[6], r[7], r[8], p.pos[2] / STUDS, 0, 0, 0, 1);
    mesh.matrixAutoUpdate = false;
    mesh.matrix.copy(m4).multiply(new THREE.Matrix4().makeScale(p.size[0] / STUDS, p.size[1] / STUDS, p.size[2] / STUDS));
    mesh.castShadow = mesh.receiveShadow = true;
    g.add(mesh);
  }
  g.userData.dispose = () => mats.forEach((m) => m.dispose());
  return g;
}
