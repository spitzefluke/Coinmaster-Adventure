// Schlüpf-Ansicht 1:1 wie in Roblox: Das Modul HatchFx aus dem Installer spielt die Animation in fünf Akten
// (Wackeln, Aufladen, Platzen, Enthüllung, Name). Die Seite zeigt sie im Vollbild, schreibt den Akt dazu,
// blitzt beim Platzen auf und lässt die Kamera wackeln. Tippen spult vor, danach schließt ein Tippen die Ansicht.

import * as THREE from 'three';
import { pixelRatio, skipAnimations } from '../../js/settings.js';
import { rollPet, fmtChance } from '../../haustiere/js/pets.js';
import { createRobloxHatch, eggLua, orbitEgg } from './eggRoblox.js';

const PHASE_TEXT = { wobble: 'Es wackelt …', charge: 'Es lädt auf …', burst: '!!!' };

export class Hatch {
  constructor(el) {
    this.el = el;
    this.ui = {
      canvas: el.querySelector('.hatch-canvas'),
      flash: el.querySelector('.hatch-flash'),
      text: el.querySelector('.hatch-text'),
      eyebrow: el.querySelector('.hatch-eyebrow'),
      note: el.querySelector('.hatch-note'),
      name: el.querySelector('.hatch-name'),
      from: el.querySelector('.hatch-from'),
      done: el.querySelector('.hatch-done'),
      again: el.querySelector('.hatch-again'),
      actions: el.querySelector('.hatch-actions'),
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
      if (e.target.closest('.hatch-again')) return this.again();
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
    this.dist = w / h < 0.8 ? 21 : 16;
    this.camera.updateProjectionMatrix();
  }

  setPhase(phase) {
    const u = this.ui;
    this.phase = phase;
    if (PHASE_TEXT[phase]) {
      u.stage.textContent = PHASE_TEXT[phase];
      u.stage.classList.add('is-shown');
    } else u.stage.classList.remove('is-shown');
    if (phase === 'burst') {
      this.flash = 1;
      this.shake = 0.5 + this.egg.rank * 0.06;
    }
    if (phase === 'reveal') this.revealAt = this.time;
  }

  play(egg) {
    const pet = rollPet(egg.id);
    this.view?.dispose();
    this.view = null;
    this.egg = egg;
    const u = this.ui;
    this.el.style.setProperty('--egg', egg.glow);
    this.el.dataset.egg = egg.id;
    this.el.dataset.epic = pet.epic ? '1' : '';
    u.name.textContent = pet.name;
    u.from.textContent = `aus dem ${egg.name}`;
    u.eyebrow.textContent = pet.epic ? 'Episch geschlüpft!' : 'Geschlüpft!';
    u.note.textContent = `${pet.epic ? 'Episch' : 'Normal'} · ${fmtChance(pet.chance)} Schlupfchance`;
    u.text.classList.remove('is-shown');
    u.actions.hidden = true;
    u.hint.hidden = false;
    u.stage.classList.remove('is-shown');
    u.flash.style.opacity = 0;
    Object.assign(this, { flash: 0, shake: 0, phase: 'start', revealAt: null, time: 0 });
    this.el.hidden = false;
    document.body.style.overflow = 'hidden';
    this.resize();
    const finish = () => {
      u.hint.hidden = true;
      u.actions.hidden = false;
      u.stage.classList.remove('is-shown');
      setTimeout(() => u.text.classList.add('is-shown'), 200);
    };
    createRobloxHatch(egg, pet, { onDone: finish, onPhase: (p) => this.setPhase(p) }).then((view) => {
      if (this.el.hidden) return view.dispose();
      this.view = view;
      if (skipAnimations()) view.skip();
    });
    this.clock = new THREE.Clock();
    this.renderer.setAnimationLoop(() => this.frame());
    this.closed ||= new Promise((res) => (this.resolve = res));
    return this.closed;
  }

  again() {
    if (this.egg) this.play(this.egg);
  }

  close() {
    if (this.el.hidden) return;
    this.renderer.setAnimationLoop(null);
    this.el.hidden = true;
    document.body.style.overflow = '';
    this.view?.dispose();
    this.view = null;
    this.closed = null;
    this.resolve?.();
  }

  frame() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.time += dt;
    if (!this.view) return;
    this.lua?.frame(dt);
    this.view.step(dt);
    this.flash = Math.max(0, this.flash - dt * 2.2);
    this.shake = Math.max(0, this.shake - dt * 1.4);
    this.ui.flash.style.opacity = this.flash.toFixed(3);
    // langsam ans Ei heran, nach dem Platzen etwas zurück (Tier und Namensschild im Bild); am Ende leicht kreisen
    const charging = this.phase === 'wobble' || this.phase === 'charge';
    const k = charging || this.revealAt == null ? Math.min(1, this.time / 3) : 1;
    const kr = this.revealAt == null ? 0 : Math.min(1, (this.time - this.revealAt) / 1.2);
    const angle = this.view.done ? Math.sin(this.time * 0.4) * 0.35 : -0.25 + k * 0.25;
    const dist = this.dist * (1.12 - 0.14 * k) * (1 + 0.06 * kr);
    orbitEgg(this.camera, angle, 0.16, dist, 2.7 + 0.5 * kr);
    if (this.shake > 0) {
      this.camera.position.x += (Math.random() - 0.5) * this.shake;
      this.camera.position.y += (Math.random() - 0.5) * this.shake;
    }
    this.view.world.render(this.renderer, this.camera);
  }
}
