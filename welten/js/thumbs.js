// Vorschaubilder der Welten (für Karten in der Weltkarte und im Teleport-Menü).
// Ein eigener kleiner Renderer zeichnet jede Welt einmal; das Bild wird zwischengespeichert.

import * as THREE from 'three';
import { buildWorld } from './worldFactory.js';

let renderer = null;
const cache = new Map();
let queue = Promise.resolve();

function getRenderer() {
  if (renderer) return renderer;
  renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  return renderer;
}

// Liefert eine data-URL; Aufrufe laufen nacheinander, damit die Seite flüssig bleibt
export function worldThumb(world, w = 360, h = 240) {
  const key = `${world.id}:${w}x${h}`;
  if (cache.has(key)) return cache.get(key);
  const p = (queue = queue.then(
    () =>
      new Promise((resolve) =>
        setTimeout(() => {
          try {
            const r = getRenderer();
            r.setPixelRatio(1);
            r.setSize(w, h, false);
            const built = buildWorld(world, { particles: 0.6 });
            built.update(1.3, 0.016);
            const cam = new THREE.PerspectiveCamera(36, w / h, 0.1, 200);
            cam.position.set(17.5, 12, 21);
            cam.lookAt(0, 0.2, 0);
            r.render(built.scene, cam);
            const url = r.domElement.toDataURL('image/webp', 0.85);
            built.dispose();
            resolve(url);
          } catch (e) {
            console.error('Vorschaubild', world.id, e);
            resolve('');
          }
        }, 0),
      ),
  ));
  cache.set(key, p);
  return p;
}
