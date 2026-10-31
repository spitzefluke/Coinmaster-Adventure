// Roblox-Modelle: lädt die Hyper3D-Modelle aus ../modelle/<id>.glb. Ein Renderer zeichnet nacheinander
// die Vorschaubilder der Kacheln, danach dient er als drehbarer Betrachter.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EGGS, PETS, petById } from './pets.js';

// Pets, deren Modell im Ordner haustiere/modelle liegt
export const MODELLE = [
  'adler', 'engelsfuchs', 'engel', 'gott', 'loewe',
  'galaxiewolf', 'singularity', 'sternbild', 'hamster', 'komet', 'ringgleiter', 'nebelwelpe',
  'glitchhund', 'banhammer',
];
const vorhanden = new Set(MODELLE);
const url = (id) => `modelle/${id}.glb`;

const canvas = document.getElementById('viewer');
const status = document.getElementById('viewer-status');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.setClearColor(0x000000, 0);
const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.position.set(3, 5, 4);
scene.add(sun);
const camera = new THREE.PerspectiveCamera(32, 1, 0.01, 100);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.autoRotate = !matchMedia('(prefers-reduced-motion: reduce)').matches;
controls.autoRotateSpeed = 1.6;

const loader = new GLTFLoader();
const cache = new Map();
function load(id) {
  if (!cache.has(id)) {
    cache.set(id, loader.loadAsync(url(id)).then((g) => {
      const m = g.scene;
      const box = new THREE.Box3().setFromObject(m);
      const size = box.getSize(new THREE.Vector3());
      const s = 2 / Math.max(size.x, size.y, size.z);
      m.scale.setScalar(s);
      m.position.copy(box.getCenter(new THREE.Vector3()).multiplyScalar(-s));
      const holder = new THREE.Group();
      holder.add(m);
      return holder;
    }));
  }
  return cache.get(id);
}

function frame(view = new THREE.Vector3(1.9, 1.05, 3.1)) {
  camera.position.copy(view);
  controls.target.set(0, 0, 0);
  controls.update();
}

function resize(w, h) {
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

let current = null;
let busy = Promise.resolve();

// Vorschaubild: rendert das Modell kurz in den Canvas und liest ihn aus
async function thumb(id) {
  const obj = await load(id);
  scene.add(obj);
  resize(256, 256);
  frame();
  renderer.render(scene, camera);
  const src = canvas.toDataURL('image/png');
  scene.remove(obj);
  return src;
}

async function show(id) {
  const p = petById[id];
  document.getElementById('info-name').textContent = p.name;
  document.getElementById('info-text').textContent = p.text;
  const egg = document.getElementById('info-egg');
  egg.textContent = p.eggName;
  egg.style.setProperty('--glow', p.glow);
  const dl = document.getElementById('info-download');
  dl.href = url(id);
  dl.download = `${id}.glb`;
  document.querySelectorAll('.model-tile').forEach((t) => t.setAttribute('aria-pressed', t.dataset.id === id));
  status.textContent = 'Lädt …';
  const obj = await load(id);
  if (current) scene.remove(current);
  current = obj;
  scene.add(obj);
  status.textContent = '';
  frame();
}

function fitViewer() {
  const r = canvas.parentElement.getBoundingClientRect();
  resize(r.width, r.height);
}

function loop() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

// Kacheln je Ei
const grid = document.getElementById('model-grid');
grid.innerHTML = EGGS.map((e) => `
  <section class="model-egg" style="--glow:${e.glow}">
    <h2>${e.name}</h2>
    <div class="model-tiles">${PETS.filter((p) => p.egg === e.id).map((p) => `
      <button type="button" class="model-tile" data-id="${p.id}" ${vorhanden.has(p.id) ? '' : 'disabled'}>
        <span class="ph">${vorhanden.has(p.id) ? 'Lädt …' : 'Noch kein Modell'}</span>${p.name}
      </button>`).join('')}
    </div>
  </section>`).join('');
grid.addEventListener('click', (e) => {
  const t = e.target.closest('.model-tile');
  if (t && !t.disabled) busy = busy.then(() => show(t.dataset.id));
});

// Erst alle Vorschaubilder, dann der Betrachter
(async () => {
  for (const id of MODELLE) {
    try {
      const src = await thumb(id);
      const ph = grid.querySelector(`[data-id="${id}"] .ph`);
      ph.outerHTML = `<img src="${src}" alt="">`;
    } catch (err) {
      console.error('Modell', id, err);
    }
  }
  fitViewer();
  addEventListener('resize', fitViewer);
  await show(MODELLE[0]);
  loop();
})();
