// Macht aus einem Haustier (Roblox-Stil, haustiere/js/rbx-*.js) Roblox-Teile: abgerundete Blöcke werden
// zu Blöcken, Kugeln zu Kugeln (SpecialMesh), Zylinder zu Zylindern. Gleiche Umwandlung wie bei den Welten
// (worldParts.js). Ergebnis in Studs, Füße auf y = 0, Blick nach −Z wie Roblox-Figuren.

import * as THREE from 'three';
import { createPet } from '../../haustiere/js/petFactory.js';
import { convertMesh, STUDS } from './worldParts.js';

// Größe im Spiel: normale Tiere 3 Studs hoch, epische 3,6
export const PET_HEIGHT = { normal: 3, epic: 3.6 };

const cache = new Map();
export function petToParts(pet) {
  if (cache.has(pet.id)) return cache.get(pet.id);
  const obj = createPet(pet, { pedestal: false, style: 'rbx' });
  obj.update(0);
  const holder = new THREE.Group();
  // Tiere schauen auf der Webseite nach +Z, in Roblox nach −Z
  holder.rotation.y = Math.PI;
  holder.add(obj.model);
  holder.updateMatrixWorld(true);
  const box = new THREE.Box3(), tmp = new THREE.Box3();
  const meshes = [];
  holder.traverse((o) => {
    if (!o.isMesh || !o.visible || o.userData.outline) return;
    const m = Array.isArray(o.material) ? o.material[0] : o.material;
    if (!m || m.blending === THREE.AdditiveBlending || (m.isMeshBasicMaterial && m.transparent)) return;
    if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
    tmp.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
    box.union(tmp);
    meshes.push(o);
  });
  // auf Zielhöhe skalieren (lange Tiere auch nach der Länge begrenzen) und auf den Boden stellen
  const size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
  const H = pet.epic ? PET_HEIGHT.epic : PET_HEIGHT.normal, W = H * 1.15;
  const studsPerUnit = Math.min(H / Math.max(0.001, size.y), W / Math.max(0.001, size.x, size.z * 0.65));
  const k = studsPerUnit / STUDS;
  const height = size.y * studsPerUnit;
  const wrap = new THREE.Group();
  wrap.scale.setScalar(k);
  wrap.position.set(-c.x * k, -box.min.y * k, -c.z * k);
  wrap.add(holder);
  wrap.updateMatrixWorld(true);
  const parts = [];
  for (const m of meshes) convertMesh(parts, m, null);
  for (const p of parts) {
    p.canCollide = false;
    p.castShadow = true;
    if (p.material === 'SmoothPlastic' || !p.material) p.material = 'SmoothPlastic';
  }
  obj.dispose();
  const out = { pet, parts, height };
  cache.set(pet.id, out);
  return out;
}
