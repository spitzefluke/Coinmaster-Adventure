// Schlüpf-Ansicht 1:1 wie in Roblox: Das Modul HatchFx aus dem Installer spielt die Animation
// (Ei wackelt, leuchtet, platzt; das Tier wächst heraus; Name und Chance als BillboardGui).
// Die Seite zeigt sie im Vollbild; Tippen spult vor, danach schließt ein Tippen die Ansicht.

import * as THREE from 'three';
import { pixelRatio, skipAnimations } from '../../js/settings.js';
import { rollPet, fmtChance } from '../../haustiere/js/pets.js';
import { createRobloxHatch, eggLua, orbitEgg } from './eggRoblox.js';

export class Hatch {
  constructor(el) {
    this.el = el;
    this.ui = {
      canvas: el.querySelector('.hatch-canvas'),
      text: el.querySelector('.hatch-text'),
      eyebrow: el.querySelector('.hatch-eyebrow'),
      note: el.querySelector('.hatch-note'),
      name: el.querySelector('.hatch-name'),
      from: el.querySelector('.hatch-from'),
      done: el.querySelector('.hatch-done'),
      hint: el.querySelector('.hatch-hint'),
      stage: el.querySelector('.hatch-stage'),
    };
    const r = (this.renderer = new THREE.WebGLRenderer({ canvas: this.ui.canvas, antialias: true, alpha: true, stencil: true }));
    r.setPixelRatio(pixelRatio());
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.NoToneMapping;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.setClearColor(0x000000, 0);
    this.camera = new THREE.PerspectiveCamera(35, 1, 0.1, 500);
    eggLua().then((lua) => (this.lua = lua));

    el.addEventListener('click', (e) => {
      if (e.target.closest('.hatch-done')) return this.close();
      if (!this.view) return;
      if (!this.view.done) this.view.skip();
      else this.close();
    });
    addEventListener('keydown', (e) => {
      if (this.el.hidden) return;
      if (['Escape', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        if (this.view && !this.view.done && e.key !== 'Escape') this.view.skip();
        else this.close();
      }
    });
    addEventListener('resize', () => !this.el.hidden && this.resize());
  }

  resize() {
    const w = this.el.clientWidth, h = this.el.clientHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.dist = w / h < 0.8 ? 19 : 14;
    this.camera.updateProjectionMatrix();
  }

  play(egg) {
    const pet = rollPet(egg.id);
    this.view?.dispose();
    this.view = null;
    const u = this.ui;
    this.el.style.setProperty('--egg', egg.glow);
    this.el.dataset.egg = egg.id;
    this.el.dataset.epic = pet.epic ? '1' : '';
    u.name.textContent = pet.name;
    u.from.textContent = `aus dem ${egg.name}`;
    u.eyebrow.textContent = pet.epic ? 'Episch geschlüpft!' : 'Geschlüpft!';
    u.note.textContent = `${pet.epic ? 'Episch' : 'Normal'} · ${fmtChance(pet.chance)} Schlupfchance`;
    u.text.classList.remove('is-shown');
    u.done.hidden = true;
    u.hint.hidden = false;
    u.stage?.classList.remove('is-shown');
    this.el.hidden = false;
    document.body.style.overflow = 'hidden';
    this.resize();
    this.time = 0;
    const finish = () => {
      u.hint.hidden = true;
      u.done.hidden = false;
      setTimeout(() => u.text.classList.add('is-shown'), 200);
    };
    createRobloxHatch(egg, pet, { onDone: finish }).then((view) => {
      if (this.el.hidden) return view.dispose();
      this.view = view;
      if (skipAnimations()) view.skip();
    });
    this.clock = new THREE.Clock();
    this.renderer.setAnimationLoop(() => this.frame());
    return new Promise((res) => (this.resolve = res));
  }

  close() {
    if (this.el.hidden) return;
    this.renderer.setAnimationLoop(null);
    this.el.hidden = true;
    document.body.style.overflow = '';
    this.view?.dispose();
    this.view = null;
    this.resolve?.();
  }

  frame() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.time += dt;
    if (!this.view) return;
    this.lua?.frame(dt);
    this.view.step(dt);
    // langsam heranfahren, nach dem Schlüpfen leicht um das Tier kreisen
    const k = Math.min(1, this.time / 2.5);
    const angle = this.view.done ? Math.sin(this.time * 0.4) * 0.35 : -0.15 + k * 0.15;
    orbitEgg(this.camera, angle, 0.16, this.dist * (1.15 - 0.15 * k), 2.8);
    this.view.world.render(this.renderer, this.camera);
  }
}
