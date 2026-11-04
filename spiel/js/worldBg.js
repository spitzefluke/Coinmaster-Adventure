// Die aktuelle Welt als 3D-Hintergrund hinter dem HUD, 1:1 wie in Roblox (welten/js/robloxWorld.js):
// dieselben Teile wie der Export, Roblox-Licht und das Wetter aus dem Roblox-Modul WeatherFx.
// Die Kamera kreist langsam um die Insel. Klappt WebGL nicht, bleibt der gezeichnete Hintergrund stehen.

import * as THREE from 'three';
import { ISLAND_RADIUS } from '../../welten/js/worldFactory.js';
import { buildRobloxWorld, showWeather, worldLua } from '../../welten/js/robloxWorld.js';
import { pixelRatio, loadSettings, skipAnimations } from '../../js/settings.js';

const CS = (ISLAND_RADIUS / 10) * 8; // Kamerawerte unten gelten für Radius 10, in Studs

export function createWorldBg(host) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, stencil: true });
  } catch (e) {
    console.warn('3D-Hintergrund nicht verfügbar', e);
    return { set() {}, refresh() {}, setWeather() {}, pick: () => null };
  }
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.className = 'world-canvas';
  host.prepend(renderer.domElement);
  host.classList.add('has-3d');

  const camera = new THREE.PerspectiveCamera(40, 1, 0.5, 6000);
  let built = null, worldId = null, lua = null;
  worldLua().then((l) => (lua = l)).catch((e) => console.error('Luau konnte nicht starten', e));
  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(host);

  function applySettings() {
    renderer.setPixelRatio(Math.min(pixelRatio(), 1.5));
    renderer.shadowMap.enabled = loadSettings().quality === 'hoch';
  }

  let weatherId = 'klar';
  function build(world) {
    if (built) {
      lua?.call('__weatherReset');
      built.rw.dispose();
    }
    built = buildRobloxWorld(world, { shadows: renderer.shadowMap.enabled });
    worldId = world.id;
    showWeather(built.rw, weatherId);
  }

  const clock = new THREE.Clock();
  let angle = 0.6;
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.1);
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
    camera.lookAt(0, (camera.aspect < 1 ? -1.2 : 0.4) * 8, 0);
    camera.updateMatrixWorld();
    if (lua) {
      lua.setCamera(camera);
      lua.frame(dt);
    }
    built.rw.update(dt);
    built.rw.render(renderer, camera);
  });

  // Was liegt unter dem Mauszeiger? Liefert den Spawn-Bereich oder null.
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function pick(clientX, clientY) {
    const areas = built?.data.meta.areas;
    if (!areas?.length) return null;
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const meshes = built.rw.staticGroups.flatMap((g) => g.children);
    const hit = ray.intersectObjects(meshes, false).find((x) => x.object.visible && !x.object.material.transparent);
    if (!hit) return null;
    const id = hit.object.userData.parts?.[hit.instanceId]?.area;
    return id ? { id, name: areas.find((a) => a.id === id)?.name ?? id } : null; // vorderstes Teil zählt
  }

  applySettings();
  return {
    pick,
    // Wetter der Welt (aus mutations.js weatherAt)
    setWeather(id) {
      if (id === weatherId) return;
      weatherId = id;
      if (built) showWeather(built.rw, weatherId);
    },
    set(world) {
      if (world.id !== worldId) build(world);
    },
    // nach geänderten Einstellungen (Qualität) neu aufbauen
    refresh(world) {
      applySettings();
      build(world);
    },
  };
}
