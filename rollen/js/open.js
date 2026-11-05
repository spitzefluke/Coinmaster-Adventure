// Öffnen-Ansicht 1:1 wie in Roblox: Das Modul RollFx aus dem Installer spielt die Animation
// (Rolle wackelt, hebt ab, reißt auf; ein Rollband läuft durch und bleibt auf einer Sache stehen).
// Tippen spult vor, danach zeigt die Seite die Ausbeute. Sie landet im Inventar des Gartens.

import * as THREE from 'three';
import { pixelRatio, skipAnimations } from '../../js/settings.js';
import { rarityById, loadState, saveState, addLoot, lootName, fmtTime } from '../../garten/js/garden.js';
import { orbitEgg } from '../../eier/js/eggRoblox.js';
import { openRoll } from './rolls.js';

// Kann die Rolle bezahlt werden? Robux werden in der Vorschau nur simuliert.
export function canPay(roll, state = loadState()) {
  return !roll.price || roll.price.currency !== 'taler' || state.taler >= roll.price.amount;
}
import { createRobloxOpening, rollLua } from './rollRoblox.js';

const MARKUP = `
  <canvas class="open-canvas"></canvas>
  <div class="open-text" role="dialog" aria-modal="true" aria-labelledby="open-name">
    <p class="open-eyebrow">Aufgerissen!</p>
    <h2 id="open-name" class="open-name">???</h2>
    <p class="open-from"></p>
    <ul class="open-loot"></ul>
    <div class="open-buttons">
      <button class="open-again" type="button" hidden>Noch eine</button>
      <button class="open-done" type="button" hidden>Fertig</button>
    </div>
  </div>
  <a class="open-garden" href="../garten/">Zum Garten →</a>
  <p class="open-hint">Tippen zum Überspringen</p>`;

export class Opener {
  // Ebene samt Inhalt neu anlegen (für Seiten ohne eigenes Markup, z. B. spiel/)
  static mount(parent = document.body) {
    const el = document.createElement('div');
    el.className = 'open';
    el.hidden = true;
    el.innerHTML = MARKUP;
    parent.append(el);
    return new Opener(el);
  }

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
      garden: el.querySelector('.open-garden'),
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

  // items: schon gezogene Sachen (z. B. vom Spiel-Server); dann wird hier nichts bezahlt oder gespeichert
  play(roll, items = null) {
    this.el.hidden = false;
    document.body.style.overflow = 'hidden';
    this.resize();
    this.start(roll, items);
    this.clock = new THREE.Clock();
    this.renderer.setAnimationLoop(() => this.frame());
    return new Promise((res) => (this.resolve = res));
  }

  // preset: schon gezogene Sache (oder Liste, davon die erste), z. B. vom Spiel-Server
  start(roll, preset = null) {
    this.roll = roll;
    this.preset = !!preset;
    const token = (this.token = (this.token || 0) + 1);
    const item = preset ? (Array.isArray(preset) ? preset[0] : preset) : openRoll(roll);
    // bezahlen und ins Garten-Inventar legen (nur auf der Rollen-Seite)
    const state = loadState();
    if (!preset) {
      if (roll.price?.currency === 'taler') state.taler -= roll.price.amount;
      addLoot(state, [item]);
      saveState(state);
      this.onChange?.(state);
    }
    this.ui.garden.hidden = !!preset;
    const tier = rarityById[item.rarity];
    this.view?.dispose();
    this.view = null;
    const u = this.ui;
    this.el.style.setProperty('--roll', roll.glow);
    u.eyebrow.textContent = `${roll.name} · ${tier.name}`;
    u.name.textContent = lootName(item);
    u.name.style.textShadow = `0 0 30px ${tier.color}`;
    const kind = item.type === 'tree' ? 'Samen' : item.type === 'fence' ? 'Zaun' : 'Werkzeug';
    u.from.textContent = `${kind} · liegt jetzt ${preset ? 'unter Garten › Sachen' : 'im Inventar deines Gartens'}`;
    const how = item.type === 'tree' ? `Säen, und in ${fmtTime(item.grow)} wächst daraus ein ${item.name} (${item.harvests}× ernten).` : item.type === 'fence' ? `${item.text} Im Garten anbringen.` : item.text;
    u.loot.innerHTML = `<li style="--t:${tier.color}">${how}</li>`;
    u.again.disabled = !canPay(roll, state);
    u.again.textContent = u.again.disabled ? 'Zu wenig Taler' : 'Noch eine';
    u.text.classList.remove('is-shown');
    u.done.hidden = u.again.hidden = true;
    u.hint.hidden = false;
    this.time = 0;
    this.lift = 0;
    // Rollband: im Hochformat schmaler, damit es ganz ins Bild passt
    this.window = this.portrait ? 6 : 11;
    const finish = () => {
      u.hint.hidden = true;
      u.done.hidden = false;
      u.again.hidden = this.preset;
      setTimeout(() => u.text.classList.add('is-shown'), 250);
    };
    createRobloxOpening(roll, item, { window: this.window, onDone: finish }).then((view) => {
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
    // Abstand so, dass das ganze Rollband ins Bild passt; am Ende rutscht der Gewinn etwas nach oben
    const k = Math.min(1, this.time / 2.5);
    const fit = (this.window + 2) / (Math.tan(THREE.MathUtils.degToRad(17.5)) * this.camera.aspect);
    const base = Math.max(17, fit);
    const angle = this.view.done ? Math.sin(this.time * 0.4) * 0.12 : -0.08 + k * 0.08;
    this.lift += ((this.view.done ? 1 : 0) - this.lift) * Math.min(1, dt * 2.5);
    const y = 3.4 - this.lift * (this.portrait ? 2.6 : 1.4);
    const dist = this.view.done ? base * (1 - (this.portrait ? 0.5 : 0.25) * this.lift) : base * (1.08 - 0.08 * k);
    orbitEgg(this.camera, angle, 0.1, dist, y);
    this.view.world.render(this.renderer, this.camera);
  }
}
