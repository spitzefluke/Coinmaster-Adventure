// Export der Haustiere als .glb (glTF binär) – direkt in Blender importierbar (Datei › Import › glTF 2.0).
import { THREE } from './kit.js';
import { createPet } from './petFactory.js';
import { PETS } from './pets.js';

async function loadExporter() {
  const { GLTFExporter } = await import('three/addons/exporters/GLTFExporter.js');
  return GLTFExporter;
}

function petNode(pet) {
  const obj = createPet(pet, { pedestal: false });
  obj.update(1);
  const model = obj.model;
  obj.spinner.remove(model);
  const drop = [];
  model.traverse((o) => (o.isSprite || o.isPoints || o.isLine || o.userData.outline) && drop.push(o));
  drop.forEach((o) => o.parent.remove(o));
  model.name = pet.name;
  // Sockel-Höhe herausrechnen: Füße auf y = 0
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  model.position.y -= box.min.y;
  return model;
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
