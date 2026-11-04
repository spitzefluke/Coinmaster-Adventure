// Vorschaubilder der Welten (für Karten in der Weltkarte und im Teleport-Menü), gezeichnet wie in
// Roblox (robloxWorld.js). Ein eigener kleiner Renderer zeichnet jede Welt einmal; das Bild wird
// zwischengespeichert.

import * as THREE from 'three';
import { ISLAND_RADIUS } from './worldFactory.js';
import { buildRobloxWorld } from './robloxWorld.js';

let renderer = null;
const cache = new Map();
let queue = Promise.resolve();

function getRenderer() {
  if (renderer) return renderer;
  renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, stencil: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
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
            const { rw } = buildRobloxWorld(world, { shadows: false });
            rw.update(0.5);
            const cam = new THREE.PerspectiveCamera(36, w / h, 0.5, 6000);
            const k = (ISLAND_RADIUS / 10) * 8;
            cam.position.set(17.5 * k, 12 * k, 21 * k);
            cam.lookAt(0, 1.6, 0);
            cam.updateMatrixWorld();
            rw.render(r, cam);
            const url = r.domElement.toDataURL('image/webp', 0.85);
            rw.dispose();
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
