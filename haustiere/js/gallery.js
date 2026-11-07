// Haustier-Galerie 1:1 wie in Roblox: Jedes Tier besteht aus denselben Roblox-Teilen wie in
// Haustiere.rbxmx (roblox/js/petParts.js) und wird mit der Roblox-Engine gezeichnet (js/rbx).
// Ein WebGL-Canvas rendert alle Karten per Scissor-Test, die Detailansicht hat einen eigenen Renderer.
import * as THREE from 'three';
import { RbxWorld } from '../../js/rbx/engine.js';
import { petToParts } from '../../roblox/js/petParts.js';
import { petById } from './pets.js';
import { rbxRenderer } from '../../muenzen/js/coinRoblox.js';

// Unterkante der klebenden Navigation (js/nav.js)
const navBottom = () => document.querySelector('.site-nav')?.getBoundingClientRect().bottom ?? 0;

function petWorld(pet, withPedestal = false) {
  const { parts, height, width } = petToParts(pet, { withPedestal });
  const world = new RbxWorld({ shadows: false, sky: false });
  world.addStaticParts(parts);
  return { world, height, width };
}
// Kamera vor dem Tier (Roblox-Modelle schauen nach −Z)
function orbit(cam, yaw, pitch, dist, height) {
  const y = height * 0.5;
  cam.position.set(Math.sin(yaw) * Math.cos(pitch) * dist, y + Math.sin(pitch) * dist, -Math.cos(yaw) * Math.cos(pitch) * dist);
  cam.lookAt(0, y, 0);
  cam.updateMatrixWorld();
}

export function createGallery(stage) {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = rbxRenderer(stage);
  const camera = new THREE.PerspectiveCamera(30, 0.8, 0.1, 500);
  const resize = () => renderer.setSize(innerWidth, innerHeight, false);
  addEventListener('resize', resize);
  resize();

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
      en.obj?.world.dispose();
      entries.delete(el);
    }
    for (const el of els) {
      if (entries.has(el)) continue;
      const pet = petById[el.dataset.petView];
      if (!pet) continue;
      const en = { pet, view: el, obj: null, near: false, hover: false, spin: 0, ph: Math.random() * 6 };
      const card = el.closest('[data-pet-card]') || el;
      card.addEventListener('pointerenter', () => (en.hover = true));
      card.addEventListener('pointerleave', () => (en.hover = false));
      entries.set(el, en);
      io.observe(el);
    }
  }

  let overlay = false;
  const clock = new THREE.Clock();
  function renderGallery(t, dt) {
    renderer.setScissorTest(false);
    renderer.clear();
    if (overlay) return;
    renderer.setScissorTest(true);
    const H = stage.clientHeight;
    let built = 0;
    for (const en of entries.values()) {
      if (!en.near) continue;
      if (!en.obj) {
        if (built++ > 0) continue; // eins pro Bild bauen
        try {
          en.obj = petWorld(en.pet);
        } catch (err) {
          console.error('Haustier', en.pet.id, err);
          en.near = false;
          continue;
        }
      }
      const r = en.view.getBoundingClientRect();
      const top = Math.max(r.top, navBottom());
      if (r.bottom <= top || r.top > H || r.width === 0) continue;
      en.spin += reducedMotion ? 0 : dt * (en.hover ? 1.4 : 0.35);
      camera.aspect = r.width / r.height;
      camera.updateProjectionMatrix();
      orbit(camera, -0.5 + Math.sin(t * 0.45 + en.ph) * (reducedMotion ? 0 : 0.6) + en.spin, 0.18, Math.max(3.6 * en.obj.height, 2.3 * en.obj.width) + 0.6, en.obj.height);
      renderer.setViewport(r.left, H - r.bottom, r.width, r.height);
      renderer.setScissor(r.left, H - r.bottom, r.width, r.bottom - top);
      en.obj.world.render(renderer, camera);
    }
  }

  // ── Detailansicht ──
  let d = null;
  function openDetail(pet, canvas) {
    if (!d || d.canvas !== canvas) {
      d = { canvas, renderer: rbxRenderer(canvas), camera: new THREE.PerspectiveCamera(30, 1, 0.1, 500), yaw: -0.5, pitch: 0.18, dist: 9.5, obj: null, drag: null };
      canvas.addEventListener('pointerdown', (e) => {
        d.drag = { x: e.clientX, y: e.clientY };
        canvas.setPointerCapture(e.pointerId);
      });
      canvas.addEventListener('pointermove', (e) => {
        if (!d.drag) return;
        d.yaw += (e.clientX - d.drag.x) * 0.01;
        d.pitch = Math.max(-0.2, Math.min(1.1, d.pitch + (e.clientY - d.drag.y) * 0.006));
        d.drag = { x: e.clientX, y: e.clientY };
      });
      canvas.addEventListener('pointerup', () => (d.drag = null));
      canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        d.dist = Math.max(5, Math.min(40, d.dist + e.deltaY * 0.01));
      }, { passive: false });
    }
    d.obj?.world.dispose();
    // Detailansicht mit der Sockelinsel aus dem Design
    d.obj = petWorld(pet, true);
    Object.assign(d, { yaw: -0.5, pitch: 0.32, dist: Math.max(3.4 * d.obj.height, 2.5 * d.obj.width) });
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
    d?.obj?.world.dispose();
    if (d) d.obj = null;
  }

  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.1);
    const t = clock.elapsedTime;
    renderGallery(t, dt);
    if (overlay && d && d.obj) {
      if (!d.drag && !reducedMotion) d.yaw += dt * 0.3;
      orbit(d.camera, d.yaw, d.pitch, d.dist, d.obj.height);
      d.obj.world.render(d.renderer, d.camera);
    }
  });

  return { scan, openDetail, closeDetail };
}
