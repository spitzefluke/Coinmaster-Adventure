// Haustier-Galerie: ein WebGL-Canvas rendert alle Karten per Scissor-Test (wie die Eierhalle),
// dazu eine Detailansicht mit eigenem Renderer zum Drehen und Zoomen.
import { THREE, makeEnvironment, makeScene } from './kit.js';
import { createPet } from './petFactory.js';
import { petById } from './pets.js';
import { pixelRatio } from '../../js/settings.js';

// Unterkante der klebenden Navigation (js/nav.js)
const navBottom = () => document.querySelector('.site-nav')?.getBoundingClientRect().bottom ?? 0;

export function createGallery(stage) {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas: stage, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(pixelRatio());
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);
  const env = makeEnvironment(renderer);
  const camera = new THREE.PerspectiveCamera(30, 0.8, 0.1, 60);
  camera.position.set(0, 0.3, 10.5);
  camera.lookAt(0, -0.15, 0);
  const resize = () => renderer.setSize(innerWidth, innerHeight, false);
  addEventListener('resize', resize);
  resize();

  const settings = { motion: 'Pendeln' };
  const entries = new Map();
  const io = new IntersectionObserver(
    (list) => list.forEach((e) => {
      const en = entries.get(e.target);
      if (en) en.near = e.isIntersecting;
    }),
    { rootMargin: '500px 0px' },
  );

  function scan() {
    const els = new Set(document.querySelectorAll('[data-pet-view]'));
    for (const [el, en] of entries) {
      if (els.has(el)) continue;
      io.unobserve(el);
      if (en.obj) en.obj.dispose();
      entries.delete(el);
    }
    for (const el of els) {
      if (entries.has(el)) continue;
      const pet = petById[el.dataset.petView];
      if (!pet) continue;
      const en = { pet, view: el, obj: null, scene: null, near: false, hover: false, spin: 0, ph: Math.random() * 6 };
      const card = el.closest('[data-pet-card]') || el;
      card.addEventListener('pointerenter', () => (en.hover = true));
      card.addEventListener('pointerleave', () => (en.hover = false));
      entries.set(el, en);
      io.observe(el);
    }
  }

  let queue = Promise.resolve();
  function ensureBuilt(en) {
    if (en.obj || en.building) return;
    en.building = true;
    queue = queue.then(() => new Promise((res) => requestAnimationFrame(() => {
      try {
        if (entries.get(en.view) === en) {
          en.scene = makeScene(env);
          en.obj = createPet(en.pet);
          en.scene.add(en.obj.root);
        }
      } catch (err) {
        console.error('Haustier', en.pet.id, err);
      }
      res();
    })));
  }

  function yaw(en, t, dt) {
    if (reducedMotion || settings.motion === 'Still') return 0.5;
    if (settings.motion === 'Drehen') return (en.spin += dt * (en.hover ? 1.4 : 0.45));
    if (en.hover) en.spin += dt * 1.4;
    return 0.5 + Math.sin(t * 0.45 + en.ph) * 0.6 + en.spin;
  }

  let overlay = false;
  const clock = new THREE.Clock();
  function renderGallery(t, dt) {
    renderer.setScissorTest(false);
    renderer.clear();
    if (overlay) return;
    renderer.setScissorTest(true);
    const H = stage.clientHeight;
    for (const en of entries.values()) {
      if (!en.near) continue;
      ensureBuilt(en);
      if (!en.obj) continue;
      const r = en.view.getBoundingClientRect();
      // nur unterhalb der Navigation zeichnen
      const top = Math.max(r.top, navBottom());
      if (r.bottom <= top || r.top > H || r.width === 0) continue;
      try {
        en.obj.spinner.rotation.y = yaw(en, t, dt);
        en.obj.update(reducedMotion ? 0 : t);
      } catch (err) {
        if (!en.err) console.error('Haustier', en.pet.id, (en.err = err));
      }
      camera.aspect = r.width / r.height;
      camera.updateProjectionMatrix();
      renderer.setViewport(r.left, H - r.bottom, r.width, r.height);
      renderer.setScissor(r.left, H - r.bottom, r.width, r.bottom - top);
      renderer.render(en.scene, camera);
    }
  }

  // ── Detailansicht ──
  let d = null;
  function openDetail(pet, canvas) {
    if (!d || d.canvas !== canvas) {
      if (d) d.renderer.dispose();
      const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
      r.setPixelRatio(pixelRatio());
      r.toneMapping = THREE.ACESFilmicToneMapping;
      d = { canvas, renderer: r, camera: new THREE.PerspectiveCamera(30, 1, 0.1, 60), scene: makeScene(makeEnvironment(r)), yaw: 0.5, pitch: 0.06, dist: 10, obj: null, drag: null };
      canvas.addEventListener('pointerdown', (e) => {
        d.drag = { x: e.clientX, y: e.clientY };
        canvas.setPointerCapture(e.pointerId);
      });
      canvas.addEventListener('pointermove', (e) => {
        if (!d.drag) return;
        d.yaw += (e.clientX - d.drag.x) * 0.01;
        d.pitch = Math.max(-0.3, Math.min(0.9, d.pitch + (e.clientY - d.drag.y) * 0.006));
        d.drag = { x: e.clientX, y: e.clientY };
      });
      canvas.addEventListener('pointerup', () => (d.drag = null));
      canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        d.dist = Math.max(4.5, Math.min(15, d.dist + e.deltaY * 0.008));
      }, { passive: false });
    }
    if (d.obj) {
      d.scene.remove(d.obj.root);
      d.obj.dispose();
    }
    d.obj = createPet(pet);
    d.scene.add(d.obj.root);
    d.yaw = 0.5;
    d.pitch = 0.06;
    d.dist = 10;
    overlay = true;
    sizeDetail();
  }
  function sizeDetail() {
    if (!d) return;
    const box = d.canvas.parentElement.getBoundingClientRect();
    d.renderer.setSize(box.width, box.height, false);
    d.camera.aspect = box.width / Math.max(1, box.height);
    d.camera.updateProjectionMatrix();
  }
  addEventListener('resize', () => overlay && sizeDetail());
  function closeDetail() {
    overlay = false;
    if (d && d.obj) {
      d.scene.remove(d.obj.root);
      d.obj.dispose();
      d.obj = null;
    }
  }

  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.1);
    const t = clock.elapsedTime;
    renderGallery(t, dt);
    if (overlay && d && d.obj) {
      if (!d.drag && !reducedMotion && settings.motion !== 'Still') d.yaw += dt * 0.3;
      const c = d.camera;
      c.position.set(Math.sin(d.yaw) * Math.cos(d.pitch) * d.dist, -0.15 + Math.sin(d.pitch) * d.dist, Math.cos(d.yaw) * Math.cos(d.pitch) * d.dist);
      c.lookAt(0, -0.1, 0);
      d.obj.update(reducedMotion ? 0 : t);
      d.renderer.render(d.scene, c);
    }
  });

  return { scan, openDetail, closeDetail, settings };
}
