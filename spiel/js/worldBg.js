// Die aktuelle Welt als 3D-Hintergrund hinter dem HUD. Die Kamera kreist langsam um die Insel.
// Klappt WebGL nicht, bleibt der gezeichnete Hintergrund (Himmel und Hügel) stehen.

import * as THREE from 'three';
import { buildWorld, ISLAND_RADIUS } from '../../welten/js/worldFactory.js';

const CS = ISLAND_RADIUS / 10; // Kamerawerte unten gelten für Radius 10
import { pixelRatio, loadSettings, skipAnimations } from '../../js/settings.js';

export function createWorldBg(host) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true });
  } catch (e) {
    console.warn('3D-Hintergrund nicht verfügbar', e);
    return { set() {}, refresh() {} };
  }
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.domElement.className = 'world-canvas';
  host.prepend(renderer.domElement);
  host.classList.add('has-3d');

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 500);
  let built = null, worldId = null;
  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(host);

  function applySettings() {
    renderer.setPixelRatio(Math.min(pixelRatio(), 1.5));
    const shadows = loadSettings().quality === 'hoch';
    renderer.shadowMap.enabled = shadows;
  }

  function build(world) {
    built?.dispose();
    const s = loadSettings();
    built = buildWorld(world, { particles: s.fewerParticles ? 0.35 : 1, shadows: renderer.shadowMap.enabled });
    worldId = world.id;
  }

  const clock = new THREE.Clock();
  let angle = 0.6;
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.1), t = clock.elapsedTime;
    if (!visible || !built) return;
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    const pr = renderer.getPixelRatio();
    if (renderer.domElement.width !== Math.round(w * pr) || renderer.domElement.height !== Math.round(h * pr)) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    if (!skipAnimations()) angle += dt * 0.05;
    // schmale Bildschirme: weiter weg, damit die Insel ganz zu sehen ist
    const dist = CS * Math.min(56, Math.max(25, 11.8 / (Math.tan(THREE.MathUtils.degToRad(20)) * camera.aspect)));
    camera.position.set(Math.cos(angle) * dist, 10.5 * CS, Math.sin(angle) * dist);
    camera.lookAt(0, camera.aspect < 1 ? -1.2 : 0.4, 0);
    built.update(t, dt);
    renderer.render(built.scene, camera);
  });

  // Was liegt unter dem Mauszeiger? Liefert den Spawn-Bereich (userData.area) oder null.
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function pick(clientX, clientY) {
    if (!built?.areas?.length) return null;
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    for (const hit of ray.intersectObjects(built.scene.children, true)) {
      if (!hit.object.isMesh || !hit.object.visible) continue;
      for (let o = hit.object; o; o = o.parent) {
        const id = o.userData.area;
        if (id) return { id, name: built.areas.find((a) => a.id === id)?.name ?? id };
      }
      return null; // vorderstes Objekt gehört zu keinem Bereich
    }
    return null;
  }

  applySettings();
  return {
    pick,
    set(world) {
      if (world.id !== worldId) build(world);
    },
    // nach geänderten Einstellungen (Qualität, Partikel) neu aufbauen
    refresh(world) {
      applySettings();
      build(world);
    },
  };
}
