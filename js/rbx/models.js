// Modelle aus assets/modelle/bibliothek.glb (CC0-Pakete) in der Vorschau, so wie in Roblox:
// Dort setzt das Skript CoinmasterModelle an jeden Platzhalter „ModellPlatz“ (unsichtbares Teil in Größe und
// Lage des Modells) das gleichnamige MeshPart aus der importierten Bibliothek. Hier wird das Modell genauso
// in den Kasten des Platzhalters gestreckt. Gleiche Modelle werden gebündelt (InstancedMesh).

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const URL_GLB = new URL('../../assets/modelle/bibliothek.glb', import.meta.url).href;
let libPromise = null;

// Bibliothek einmal laden: je Modell die Liste seiner Meshes (Geometrie in Modell-Koordinaten, Material)
export function loadModelLibrary() {
  if (!libPromise)
    libPromise = new GLTFLoader().loadAsync(URL_GLB).then((gltf) => {
      // Wurzelknoten „CoinmasterModelle“ (darunter ein Knoten je Modell)
      let root = gltf.scene;
      while (root.children.length === 1 && root.children[0].children.length) root = root.children[0];
      root.updateMatrixWorld(true);
      const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
      const lib = new Map();
      for (const node of root.children) {
        const meshes = [];
        const box = new THREE.Box3();
        node.traverse((o) => {
          if (!o.isMesh) return;
          const g = o.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
          g.computeBoundingBox();
          box.union(g.boundingBox);
          const m = o.material.clone();
          // Roblox zeigt MeshParts ohne Glanz wie Plastik
          m.roughness = 0.75;
          m.metalness = 0;
          meshes.push({ geometry: g, material: m });
        });
        lib.set(node.name, { meshes, box });
      }
      return lib;
    });
  return libPromise;
}

// Platzhalter → Matrix, die das Modell in den Kasten des Platzhalters setzt
const m4 = new THREE.Matrix4(), sc = new THREE.Matrix4(), tr = new THREE.Matrix4();
function placeMatrix(p, box, out) {
  const r = p.rot;
  const size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
  out.set(r[0], r[1], r[2], p.pos[0], r[3], r[4], r[5], p.pos[1], r[6], r[7], r[8], p.pos[2], 0, 0, 0, 1);
  out.multiply(sc.makeScale(p.size[0] / Math.max(size.x, 1e-4), p.size[1] / Math.max(size.y, 1e-4), p.size[2] / Math.max(size.z, 1e-4)));
  return out.multiply(tr.makeTranslation(-c.x, -c.y, -c.z));
}

// Fügt alle Platzhalter einer Liste als Modelle in die Gruppe ein (asynchron, sobald die Bibliothek da ist)
export async function addModels(group, places, { shadows = true } = {}) {
  if (!places.length) return 0;
  const lib = await loadModelLibrary();
  const byId = new Map();
  for (const p of places) {
    if (!lib.has(p.model)) continue;
    if (!byId.has(p.model)) byId.set(p.model, []);
    byId.get(p.model).push(p);
  }
  let n = 0;
  for (const [id, ps] of byId) {
    const { meshes, box } = lib.get(id);
    for (const { geometry, material } of meshes) {
      const inst = new THREE.InstancedMesh(geometry, material, ps.length);
      ps.forEach((p, i) => inst.setMatrixAt(i, placeMatrix(p, box, m4)));
      inst.instanceMatrix.needsUpdate = true;
      inst.castShadow = shadows && !ps[0].noShadow;
      inst.receiveShadow = true;
      inst.userData.parts = ps;
      inst.computeBoundingSphere();
      group.add(inst);
    }
    n += ps.length;
  }
  return n;
}
