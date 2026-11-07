// Export der Haustiere als .glb (glTF binär) – direkt in Blender importierbar (Datei › Import › glTF 2.0).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { buildPet } from '../../roblox/js/petParts.js';
import { PETS } from './pets.js';

async function loadExporter() {
  const { GLTFExporter } = await import('three/addons/exporters/GLTFExporter.js');
  return GLTFExporter;
}

// Wedge wie im Design: Boden unten, hohe Kante bei −Z
function wedgeGeo() {
  const a = [-0.5, -0.5, -0.5], b = [0.5, -0.5, -0.5], c = [0.5, -0.5, 0.5], d = [-0.5, -0.5, 0.5], e = [0.5, 0.5, -0.5], f = [-0.5, 0.5, -0.5];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([a, b, c, a, c, d, a, e, b, a, f, e, f, d, c, f, c, e, a, d, f, b, e, c].flat(), 3));
  g.computeVertexNormals();
  return g;
}
const GEO = {
  Block: () => new THREE.BoxGeometry(1, 1, 1).toNonIndexed(),
  Wedge: wedgeGeo,
  Ball: () => new THREE.IcosahedronGeometry(0.5, 2),
  Cylinder: () => new THREE.CylinderGeometry(0.5, 0.5, 1, 18).toNonIndexed(),
};
function material(name) {
  const m = { Neon: { emissive: '#ffffff', emissiveIntensity: 1, roughness: 1 }, Metal: { metalness: 0.85, roughness: 0.3 }, Smooth: { roughness: 0.28 }, Wood: { roughness: 0.9 }, Glass: { roughness: 0.05, transparent: true, opacity: 0.55 } }[name] || { roughness: 0.62 };
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, ...m });
  mat.name = name;
  return mat;
}

// Ein Tier als Gruppe: je Material ein Mesh, Farbe je Teil als Vertexfarbe. Füße auf y = 0, Blick nach +Z.
function petNode(pet) {
  const { parts, box } = buildPet(pet);
  const byMat = new Map(), col = new THREE.Color();
  for (const p of parts) {
    const g = GEO[p.shape]();
    g.applyMatrix4(p.m);
    col.set(p.color);
    const n = g.attributes.position.count, c = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) col.toArray(c, i * 3);
    g.setAttribute('color', new THREE.BufferAttribute(c, 3));
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'color'].includes(k)) g.deleteAttribute(k);
    if (!byMat.has(p.mat)) byMat.set(p.mat, []);
    byMat.get(p.mat).push(g);
  }
  const grp = new THREE.Group();
  grp.name = pet.name;
  for (const [mat, list] of byMat) {
    const mesh = new THREE.Mesh(mergeGeometries(list), material(mat));
    mesh.name = `${pet.name} · ${mat}`;
    grp.add(mesh);
  }
  const c = box.getCenter(new THREE.Vector3());
  grp.position.set(-c.x, -box.min.y, -c.z);
  const wrap = new THREE.Group();
  wrap.name = pet.name;
  wrap.add(grp);
  return wrap;
}

function save(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.append(a);
  a.click();
  setTimeout(() => (URL.revokeObjectURL(a.href), a.remove()), 1000);
}

const slug = (s) => s.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function exportScene(scene, file) {
  const GLTFExporter = await loadExporter();
  const buf = await new GLTFExporter().parseAsync(scene, { binary: true, onlyVisible: true, maxTextureSize: 1024 });
  save(new Blob([buf], { type: 'model/gltf-binary' }), file);
}

export async function exportPet(pet) {
  const scene = new THREE.Scene();
  scene.add(petNode(pet));
  await exportScene(scene, slug(pet.name) + '.glb');
}

// Alle 49 Tiere in einer Datei: eine Reihe pro Ei, jedes Tier als eigenes Objekt
export async function exportAll() {
  const scene = new THREE.Scene();
  const eggs = [...new Set(PETS.map((p) => p.egg))];
  eggs.forEach((egg, row) => {
    const grp = new THREE.Group();
    grp.name = egg;
    PETS.filter((p) => p.egg === egg).forEach((p, i) => {
      const n = petNode(p);
      n.position.x = i * 4;
      grp.add(n);
    });
    grp.position.z = -row * 4;
    scene.add(grp);
  });
  await exportScene(scene, 'haustiere-alle-49.glb');
}
