// Öffnen-Ansicht 1:1 wie in Roblox: Das Modul RollFx aus dem Installer spielt die Animation
// (Rolle wackelt, hebt ab, reißt auf; Bäume und Gartenwerkzeug springen heraus und reihen sich auf).
// Tippen spult vor, danach zeigt die Seite die Ausbeute. Sie landet im Inventar des Gartens.

import * as THREE from 'three';
import { pixelRatio, skipAnimations } from '../../js/settings.js';
import { rarityById, loadState, saveState, addLoot } from '../../garten/js/garden.js';
import { orbitEgg } from '../../eier/js/eggRoblox.js';
import { openRoll } from './rolls.js';

// Kann die Rolle bezahlt werden? Robux werden in der Vorschau nur simuliert.
export function canPay(roll, state = loadState()) {
  return !roll.price || roll.price.currency !== 'taler' || state.taler >= roll.price.amount;
}
import { createRobloxOpening, rollLua } from './rollRoblox.js';

export class Opener {
  constructor(el) {
    this.el = el;
    this.ui = {
      canvas: el.querySelector('.open-canvas'),
      text: el.querySelector('.open-text'),
      eyebrow: el.querySelector('.open-eyebrow'),
      name: el.querySelector('.open-name'),
      from: el.querySelector('.open-from'),
      loot: el.querySelector('.open-loot'),
      done: el.querySelector('.open-done'),
      again: el.querySelector('.open-again'),
      hint: el.querySelector('.open-hint'),
    };
    const r = (this.renderer = new THREE.WebGLRenderer({ canvas: this.ui.canvas, antialias: true, alpha: true, stencil: true }));
    r.setPixelRatio(pixelRatio());
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.NoToneMapping;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.setClearColor(0x000000, 0);
    this.camera = new THREE.PerspectiveCamera(35, 1, 0.1, 500);
    rollLua().then((lua) => (this.lua = lua));

    el.addEventListener('click', (e) => {
      if (e.target.closest('.open-done')) return this.close();
      if (e.target.closest('.open-again')) return canPay(this.roll) ? this.start(this.roll) : null;
      if (!this.view) return;
      if (!this.view.done) this.view.skip();
    });
    addEventListener('keydown', (e) => {
      if (this.el.hidden) return;
      if (e.key === 'Escape') return this.close();
      if (['Enter', ' '].includes(e.key)) {
        e.preventDefault();
        if (this.view && !this.view.done) this.view.skip();
        else this.close();
      }
    });
    addEventListener('resize', () => !this.el.hidden && this.resize());
  }

  resize() {
    const w = this.el.clientWidth, h = this.el.clientHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.portrait = w / h < 0.8;
    this.camera.updateProjectionMatrix();
  }

  play(roll) {
    this.el.hidden = false;
    document.body.style.overflow = 'hidden';
    this.resize();
    this.start(roll);
    this.clock = new THREE.Clock();
    this.renderer.setAnimationLoop(() => this.frame());
    return new Promise((res) => (this.resolve = res));
  }

  start(roll) {
    this.roll = roll;
    const token = (this.token = (this.token || 0) + 1);
    const items = openRoll(roll);
    // bezahlen und Inhalt ins Garten-Inventar legen
    const state = loadState();
    if (roll.price?.currency === 'taler') state.taler -= roll.price.amount;
    addLoot(state, items);
    saveState(state);
    this.onChange?.(state);
    const best = items[items.length - 1];
    const bestTier = rarityById[best.rarity];
    this.view?.dispose();
    this.view = null;
    const u = this.ui;
    this.el.style.setProperty('--roll', roll.glow);
    u.eyebrow.textContent = `${roll.name} aufgerissen`;
    u.name.textContent = best.name;
    u.name.style.textShadow = `0 0 30px ${bestTier.color}`;
    u.from.textContent = `Bestes Stück: ${bestTier.name} · alles liegt jetzt im Inventar deines Gartens`;
    u.loot.innerHTML = items
      .map((c) => `<li style="--t:${rarityById[c.rarity].color}">${c.name}</li>`)
      .join('');
    u.again.disabled = !canPay(roll, state);
    u.again.textContent = u.again.disabled ? 'Zu wenig Taler' : 'Noch eine';
    u.text.classList.remove('is-shown');
    u.done.hidden = u.again.hidden = true;
    u.hint.hidden = false;
    this.time = 0;
    this.lift = 0;
    // im Hochformat eine Sache pro Reihe weniger, damit alles aufs Bild passt
    const perRow = this.portrait ? 3 : 4;
    this.rows = Math.ceil(items.length / perRow);
    const finish = () => {
      u.hint.hidden = true;
      u.done.hidden = u.again.hidden = false;
      setTimeout(() => u.text.classList.add('is-shown'), 250);
    };
    createRobloxOpening(roll, items, { perRow, onDone: finish }).then((view) => {
      if (this.el.hidden || token !== this.token) return view.dispose();
      this.view = view;
      if (skipAnimations()) view.skip();
    });
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
    // langsam heranfahren; mit vielen Reihen etwas weiter weg und höher schauen
    const k = Math.min(1, this.time / 2.5);
    const base = (this.portrait ? 26 : 17) + (this.rows - 1) * 2.8;
    const angle = this.view.done ? Math.sin(this.time * 0.4) * 0.12 : -0.12 + k * 0.12;
    // ist alles draußen, rutscht das Bild etwas nach oben, damit unten Platz für die Ausbeute ist
    this.lift += ((this.view.done ? 1 : 0) - this.lift) * Math.min(1, dt * 2.5);
    const y = 2.9 + (this.rows - 1) * 1.2 - this.lift * (this.portrait ? 3.6 : 2);
    orbitEgg(this.camera, angle, 0.1, base * (1.12 - 0.12 * k), y);
    this.view.world.render(this.renderer, this.camera);
  }
}
