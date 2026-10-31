// Schlüpf-Animation.
//
// Ablauf (siehe timeline()):
//   1. Landung   – das Ei fällt auf den Sockel und federt nach
//   2. Wackeln   – mehrere Stöße, jeder reißt neue leuchtende Risse in die Schale
//   3. Aufladen  – das Ei hebt ab, dreht sich, Licht bricht aus den Rissen,
//                  Teilchen werden angesaugt, eispezifischer Effekt baut sich auf
//   4. Explosion – Blitz, die Schale zerspringt in echte Scherben, Schockwellen
//   5. Schlüpfen – ein Haustier aus dem Ei erscheint, gewürfelt nach Schlupfchance
//
// rank (0–6) steuert Anzahl der Stöße, Länge des Aufladens und Größe der Explosion.

import * as THREE from 'three';
import { pixelRatio, skipAnimations } from '../../js/settings.js';
import { makeEnvironment, makeScene, glowSprite, raysTexture } from '../../muenzen/js/coinFactory.js';
import { Sparks, Warp, ringTexture, beamTexture } from '../../muenzindex/js/discovery.js';
import { createEgg, EGG_H } from './eggFactory.js';
import { createPet } from '../../haustiere/js/petFactory.js';
import { rollPet, fmtChance } from '../../haustiere/js/pets.js';

const TAU = Math.PI * 2;
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const outCubic = (t) => 1 - Math.pow(1 - t, 3);
const outBack = (t) => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2);
const outBounce = (t) => {
  const n = 7.5625, d = 2.75;
  if (t < 1 / d) return n * t * t;
  if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
  if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
  return n * (t -= 2.625 / d) * t + 0.984375;
};

// Zeitpunkte in Sekunden: etwa 4,5 s (Normal) bis 11 s (Release)
export function timeline(r) {
  const drop = 0.8;
  const bursts = [];
  let t = drop + 0.25;
  const n = 2 + Math.ceil(r / 2);
  for (let i = 0; i < n; i++) {
    const dur = 0.42 + i * 0.05 + r * 0.02;
    bursts.push([t, dur]);
    t += dur + 0.38 - r * 0.02;
  }
  const charge = t;
  const burst = charge + 0.9 + r * 0.32;
  return { drop, bursts, charge, burst, ready: burst + 1.6 + r * 0.15 };
}

// Risse: verästelte Linien auf einem Canvas in Schalengröße, Stufe für Stufe sichtbar
class Cracks {
  constructor(W, H, count, seed) {
    this.cv = document.createElement('canvas');
    this.cv.width = W;
    this.cv.height = H;
    this.ctx = this.cv.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.cv);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.tex.wrapS = THREE.RepeatWrapping;
    let s = seed;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    this.lines = [];
    const walk = (x, y, a, steps, width) => {
      const pts = [[x, y]];
      for (let i = 0; i < steps; i++) {
        a += (rnd() - 0.5) * 1.1;
        x += Math.cos(a) * (18 + rnd() * 26);
        y += Math.sin(a) * (14 + rnd() * 20);
        pts.push([x, y]);
        if (rnd() < 0.18 && width > 2) this.lines.push({ pts: walk(x, y, a + (rnd() < 0.5 ? 1 : -1) * 0.9, Math.floor(steps / 2), width * 0.6).pts, width: width * 0.6 });
      }
      return { pts, width };
    };
    for (let i = 0; i < count; i++) {
      // Risse beginnen eher in der Mitte des Eis
      const line = walk(rnd() * W, H * (0.3 + rnd() * 0.4), rnd() * TAU, 7 + Math.floor(rnd() * 6), 4 + rnd() * 2);
      this.lines.splice(Math.floor(rnd() * (this.lines.length + 1)), 0, line);
    }
    this.shown = 0;
  }

  // Zeichnet die ersten `n` Risse
  show(fraction) {
    const n = Math.round(this.lines.length * fraction);
    if (n === this.shown) return;
    const { ctx, cv } = this;
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.lineCap = ctx.lineJoin = 'round';
    for (const pass of [{ blur: 10, a: 0.6, w: 3 }, { blur: 0, a: 1, w: 1 }]) {
      ctx.shadowBlur = pass.blur;
      ctx.shadowColor = '#ffffff';
      ctx.strokeStyle = `rgba(255,255,255,${pass.a})`;
      for (const { pts, width } of this.lines.slice(0, n)) {
        ctx.lineWidth = width * pass.w * 0.6;
        for (const dx of [-cv.width, 0, cv.width]) {
          ctx.beginPath();
          pts.forEach(([x, y], i) => (i ? ctx.lineTo(x + dx, y) : ctx.moveTo(x + dx, y)));
          ctx.stroke();
        }
      }
    }
    this.tex.needsUpdate = true;
    this.shown = n;
  }

  dispose() {
    this.tex.dispose();
  }
}

export class Hatch {
  constructor(el) {
    this.el = el;
    this.ui = {
      canvas: el.querySelector('.hatch-canvas'),
      flash: el.querySelector('.hatch-flash'),
      stage: el.querySelector('.hatch-stage'),
      text: el.querySelector('.hatch-text'),
      eyebrow: el.querySelector('.hatch-eyebrow'),
      note: el.querySelector('.hatch-note'),
      name: el.querySelector('.hatch-name'),
      from: el.querySelector('.hatch-from'),
      done: el.querySelector('.hatch-done'),
      hint: el.querySelector('.hatch-hint'),
    };
    // wird bei jedem Abspielen neu gelesen, damit die Einstellung sofort wirkt
    this.reducedMotion = skipAnimations();
    const r = (this.renderer = new THREE.WebGLRenderer({ canvas: this.ui.canvas, antialias: true, alpha: true }));
    r.setPixelRatio(pixelRatio());
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.05;
    this.scene = makeScene(makeEnvironment(r));
    this.camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);

    // wiederverwendbare Effekte
    const s = this.scene;
    const rtex = ringTexture();
    this.rings = Array.from({ length: 8 }, () => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({ map: rtex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
      m.userData = { t: 1, dur: 1, max: 1 };
      return m;
    });
    this.rays = new THREE.Sprite(new THREE.SpriteMaterial({ map: raysTexture(), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.rays.renderOrder = -2;
    this.beam = new THREE.Mesh(new THREE.PlaneGeometry(3, 16), new THREE.MeshBasicMaterial({ map: beamTexture(), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.beam.position.set(0, 4, -2);
    this.core = glowSprite('#ffffff', 1, 0);
    this.burst = new Sparks(900, 0.15, { gravity: -3.5, drag: 1.3 });
    this.chips = new Sparks(300, 0.1, { gravity: -6, drag: 0.6 });
    this.suck = new Sparks(300, 0.12, { gravity: 0, drag: 0 });
    this.rise = new Sparks(400, 0.14, { gravity: 1.2, drag: 0.5 });
    this.warp = new Warp(320);
    s.add(this.beam, this.rays, this.warp.lines, this.core, ...this.rings, this.burst.points, this.chips.points, this.suck.points, this.rise.points);

    el.addEventListener('click', (e) => {
      if (e.target.closest('.hatch-done')) return this.close();
      if (this.time < this.tl.burst) this.time = Math.max(this.time, this.tl.burst - 0.05);
      else if (this.time > this.tl.burst + 0.8) this.close();
    });
    addEventListener('keydown', (e) => {
      if (this.el.hidden) return;
      if (['Escape', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        if (this.time < this.tl.burst) this.time = this.tl.burst - 0.05;
        else this.close();
      }
    });
    addEventListener('resize', () => !this.el.hidden && this.resize());
  }

  resize() {
    const w = this.el.clientWidth, h = this.el.clientHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.baseZ = w / h < 0.8 ? 12.5 : 9;
    this.camera.updateProjectionMatrix();
  }

  ring(color, { dur = 0.9, max = 6, y = 0 } = {}) {
    const m = this.rings.find((r) => r.userData.t >= r.userData.dur) || this.rings[0];
    m.material.color.set(color);
    m.position.set(0, y, 0.2);
    m.userData = { t: 0, dur, max };
  }

  flash(peak, dur, color = '#ffffff') {
    this.ui.flash.style.background = color;
    this.ui.flash.animate([{ opacity: peak }, { opacity: 0 }], { duration: dur, easing: 'ease-out' });
  }

  stage(text) {
    const s = this.ui.stage;
    s.textContent = text;
    s.classList.add('is-shown');
    s.animate([{ transform: 'scale(1.4)', opacity: 0.2 }, { transform: 'scale(1)', opacity: 1 }], { duration: 300, easing: 'cubic-bezier(.2,1.6,.4,1)' });
  }

  play(egg) {
    this.reducedMotion = skipAnimations();
    const r = egg.rank;
    this.data = egg;
    this.r = r;
    this.tl = this.reducedMotion ? { drop: 0.01, bursts: [[0.05, 0.1]], charge: 0.2, burst: 0.3, ready: 0.8 } : timeline(r);
    this.time = 0;
    this.burstsDone = 0;
    this.exploded = false;
    this.shake = 0;
    this.extraFlashes = [];
    this.color = new THREE.Color(egg.glow);

    // Ei bauen, Risse über jede Scherbe legen
    if (this.egg) {
      this.scene.remove(this.egg.root);
      this.egg.dispose();
      this.cracks.dispose();
    }
    this.egg = createEgg(egg, { resolution: 1024 });
    this.cracks = new Cracks(this.egg.skin.W, this.egg.skin.H, 8 + r * 3, 1000 + r * 37);
    this.crackMat = new THREE.MeshBasicMaterial({
      map: this.cracks.tex,
      color: this.color,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
    for (const shard of this.egg.shards) {
      shard.add(new THREE.Mesh(shard.geometry, this.crackMat));
      shard.userData.vel = new THREE.Vector3();
      shard.userData.spin = new THREE.Vector3();
    }
    this.scene.add(this.egg.root);
    this.egg.spinner.position.y = 6;

    // Haustier würfeln und bauen; es steht auf dem Sockel des Eis
    if (this.petObj) {
      this.scene.remove(this.petObj.root);
      this.petObj.dispose();
    }
    this.pet = rollPet(egg.id);
    this.petObj = createPet(this.pet, { pedestal: false });
    this.petObj.root.visible = false;
    this.scene.add(this.petObj.root);

    // Effekte zurücksetzen
    this.rings.forEach((m) => ((m.userData.t = m.userData.dur), (m.material.opacity = 0)));
    [this.burst, this.chips, this.suck, this.rise].forEach((p) => p.clear());
    this.rays.material.opacity = this.beam.material.opacity = this.core.material.opacity = 0;
    this.warp.intensity = 0;
    this.warp.update(0);

    const u = this.ui;
    this.el.style.setProperty('--egg', egg.glow);
    this.el.dataset.egg = egg.id;
    u.name.textContent = this.pet.name;
    u.from.textContent = `aus dem ${egg.name}`;
    u.eyebrow.textContent = this.pet.epic ? 'Episch geschlüpft!' : 'Geschlüpft!';
    u.note.textContent = `${this.pet.epic ? 'Episch' : 'Normal'} · ${fmtChance(this.pet.chance)} Schlupfchance`;
    this.el.dataset.epic = this.pet.epic ? '1' : '';
    u.text.classList.remove('is-shown');
    u.done.hidden = true;
    u.hint.hidden = false;
    u.stage.classList.remove('is-shown');
    u.canvas.getAnimations().forEach((a) => a.cancel());

    this.el.hidden = false;
    document.body.style.overflow = 'hidden';
    this.resize();
    this.clock = new THREE.Clock();
    this.renderer.setAnimationLoop(() => this.frame());
    return new Promise((res) => (this.resolve = res));
  }

  close() {
    if (this.el.hidden) return;
    this.renderer.setAnimationLoop(null);
    this.el.hidden = true;
    document.body.style.overflow = '';
    this.ui.canvas.getAnimations().forEach((a) => a.cancel());
    this.resolve?.();
  }

  // Ein Wackel-Stoß beginnt
  onBurst(i, total) {
    const r = this.r;
    this.cracks.show((i + 1) / (total + 1));
    this.crackMat.opacity = 0.6 + (i / total) * 0.4;
    this.shake = Math.max(this.shake, 0.04 + i * 0.03 + r * 0.01);
    this.chips.emit(8 + i * 6 + r * 2, this.data.color, { speed: 3 + i * 0.5, origin: [0, 0.2, 0], spread: [1.6, 2, 1.6], up: 2, life: 1 });
    this.burst.emit(6 + i * 4, this.data.glow, { speed: 2.5, life: 0.6 });
    if (r >= 2) this.ring(this.data.glow, { dur: 0.6, max: 4 + i });
    if (i === total - 1 && r >= 4) this.flash(0.25, 260, this.data.glow);
    this.stage(['Es wackelt …', 'Es bewegt sich!', 'Da ist was drin!', 'Gleich …', 'Es bricht auf!'][Math.min(i, 4)]);
  }

  explode() {
    const r = this.r, e = this.egg, glow = this.data.glow;
    this.exploded = true;
    this.explodedAt = this.time;
    this.flash(0.7 + r * 0.04, 500 + r * 120);
    this.shake = 0.2 + r * 0.05;
    for (const s of e.shards) {
      const dir = s.userData.home.clone().normalize();
      s.userData.vel.copy(dir).multiplyScalar(3.5 + r * 0.7 + Math.random() * 2).add(new THREE.Vector3(0, 2 + Math.random() * 2, 0));
      s.userData.spin.set((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
    }
    e.decor.visible = false;
    e.fx.visible = false;
    const waves = 2 + Math.floor(r / 2);
    for (let i = 0; i < waves; i++) setTimeout(() => this.ring(i % 2 ? '#ffffff' : glow, { dur: 1 + i * 0.15, max: 8 + i * 2.5, y: 0.3 }), i * 110);
    this.burst.emit(120 + r * 70, glow, { speed: 6 + r, origin: [0, 0.3, 0], life: 1.6 });
    this.burst.emit(40 + r * 10, '#ffffff', { speed: 5, origin: [0, 0.3, 0], life: 0.9 });
    this.chips.emit(80 + r * 20, this.data.color, { speed: 6 + r * 0.6, origin: [0, 0.3, 0], up: 3, life: 1.8 });
    // eispezifische Explosion
    const extra = {
      wald: () => this.rise.emit(160, '#8fe04a', { speed: 2, up: 3, origin: [0, -0.5, 0], spread: [2.5, 0.5, 2], life: 2.6 }),
      eis: () => this.burst.emit(200, '#dff9ff', { speed: 8, origin: [0, 0.3, 0], life: 1.4 }),
      engel: () => this.rise.emit(200, '#fff3cf', { speed: 1.2, up: 2.5, origin: [0, 0, 0], spread: [3, 1, 2], life: 3 }),
      galaxie: () => this.burst.emit(260, '#b49cff', { speed: 10, origin: [0, 0.3, 0], life: 1.8 }),
      admin: () => {
        this.burst.emit(220, '#ff2e48', { speed: 9, origin: [0, 0.3, 0], life: 1.2 });
        this.ui.canvas.animate(
          [{ filter: 'none' }, { filter: 'saturate(3) hue-rotate(-20deg) contrast(1.4)' }, { filter: 'none' }, { filter: 'invert(1)' }, { filter: 'none' }],
          { duration: 600, iterations: 2, easing: 'steps(5)' },
        );
      },
      release: () => {
        ['#ff4d6d', '#ffb84d', '#ffe14d', '#3ddc84', '#3ec9ff', '#7a5cff', '#ff5fd2'].forEach((c) =>
          this.rise.emit(45, c, { speed: 4, up: 4, origin: [0, -1, 0], spread: [3, 0.5, 2], life: 3 }),
        );
      },
    }[this.data.id];
    extra?.();
    if (r >= 5) this.extraFlashes = [this.time + 0.4, this.time + 0.8];
    this.ui.stage.classList.remove('is-shown');
    this.ui.hint.hidden = true;
    this.petObj.root.visible = true;
    setTimeout(() => this.ui.text.classList.add('is-shown'), 350);
  }

  frame() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.time += dt;
    const t = this.time, tl = this.tl, r = this.r, e = this.egg;
    e.update(t);

    // 1. Landung
    const land = clamp01(t / tl.drop);
    if (!this.exploded) e.spinner.position.y = 6 * (1 - outBounce(land));
    if (land >= 1 && !this.landed) {
      this.landed = true;
      this.shake = 0.08;
      this.chips.emit(14, '#bfb4a6', { speed: 1.5, origin: [0, -EGG_H, 0], spread: [2, 0.1, 2], up: 1, life: 0.8 });
    }
    if (land < 1) this.landed = false;

    // 2. Wackel-Stöße
    let wobble = 0;
    tl.bursts.forEach(([start, dur], i) => {
      if (t >= start && this.burstsDone === i) {
        this.burstsDone++;
        this.onBurst(i, tl.bursts.length);
      }
      if (t >= start && t < start + dur) {
        const p = (t - start) / dur;
        wobble = Math.sin(p * Math.PI * (6 + i * 2)) * Math.sin(p * Math.PI) * (0.12 + i * 0.05 + r * 0.01);
      }
    });

    // 3. Aufladen
    const charge = clamp01((t - tl.charge) / (tl.burst - tl.charge));
    if (!this.exploded) {
      e.spinner.rotation.z = wobble + (charge > 0 ? (Math.random() - 0.5) * charge * 0.08 : 0);
      e.spinner.rotation.y += dt * (0.3 + charge * charge * (6 + r * 2));
      if (charge > 0) e.spinner.position.y = outCubic(charge) * (0.5 + r * 0.05);
      this.crackMat.opacity = Math.max(this.crackMat.opacity, 0.7 + charge * 1.3);
      if (charge > 0) this.cracks.show(1);
      this.shake = Math.max(this.shake, charge * (0.03 + r * 0.015));
      // Licht bricht heraus
      this.rays.material.color.set(this.data.glow);
      this.rays.material.opacity = charge * (0.25 + r * 0.04);
      this.rays.material.rotation += dt * (0.3 + charge * 1.5);
      this.rays.scale.setScalar(2 + charge * (4 + r * 0.6));
      this.rays.position.y = e.spinner.position.y;
      this.core.material.color.set(this.data.glow);
      this.core.material.opacity = charge * 0.9;
      this.core.scale.setScalar(1 + charge * 4);
      this.core.position.y = e.spinner.position.y;
      // Teilchen werden angesaugt
      if (charge > 0 && Math.random() < dt * (20 + r * 10)) {
        const a = Math.random() * TAU, rad = 4 + Math.random() * 2;
        const i = this.suck.next;
        this.suck.emit(1, this.data.glow, { speed: 0, origin: [Math.cos(a) * rad, e.spinner.position.y + Math.sin(a) * rad, 0], spread: [0, 0, 0], life: 0.9 });
        this.suck.vel.set([-Math.cos(a) * rad * 1.1, -Math.sin(a) * rad * 1.1, 0], i * 3);
      }
      // eispezifisches Aufladen
      if (this.data.id === 'engel' || r >= 3) this.beam.material.opacity = charge * 0.6;
      this.beam.material.color.set(this.data.glow);
      if (this.data.id === 'galaxie') this.warp.intensity = charge;
      if (this.data.id === 'admin' && charge > 0 && Math.random() < dt * 6) this.flash(0.2, 80, '#ff2e48');
      if (this.data.id === 'eis' && charge > 0 && Math.random() < dt * 3) this.ring('#bff4ff', { dur: 0.7, max: 3 + charge * 3, y: e.spinner.position.y });
      if (this.data.id === 'wald' && charge > 0 && Math.random() < dt * 20) this.rise.emit(1, '#9be05a', { speed: 0.5, up: 1.5, origin: [(Math.random() - 0.5) * 3, -1.5, 0.5], spread: [0.2, 0.2, 0.5], life: 1.5 });
    }

    if (!this.exploded && t >= tl.burst) this.explode();
    if (this.extraFlashes.length && t >= this.extraFlashes[0]) {
      this.extraFlashes.shift();
      this.flash(0.6, 360);
      this.ring('#ffffff', { dur: 1.1, max: 11, y: 0.3 });
      this.burst.emit(100, this.data.glow, { speed: 8, origin: [0, 0.3, 0], life: 1.2 });
      this.shake = Math.max(this.shake, 0.2);
    }

    // 4./5. Scherben fliegen, Haustier erscheint
    if (this.exploded) {
      const since = t - this.explodedAt;
      for (const s of e.shards) {
        const u = s.userData;
        u.vel.y -= 7 * dt;
        u.vel.multiplyScalar(Math.exp(-0.6 * dt));
        s.position.addScaledVector(u.vel, dt);
        s.rotation.x += u.spin.x * dt;
        s.rotation.y += u.spin.y * dt;
        s.rotation.z += u.spin.z * dt;
        s.scale.setScalar(Math.max(0.001, 1 - clamp01((since - 0.9) / 0.8)));
      }
      this.crackMat.opacity = Math.max(0, 2 - since * 3);
      this.rays.material.opacity = Math.max(0.25, 0.9 - since * 0.4) * (0.4 + r * 0.06);
      this.rays.material.rotation += dt * 0.3;
      this.rays.scale.setScalar(5 + r * 0.8);
      this.rays.position.y = 0.2;
      this.core.material.opacity = Math.max(0.35, 1 - since);
      this.core.scale.setScalar(3 + r * 0.3);
      this.core.position.y = 0.2;
      this.beam.material.opacity = (r >= 3 ? 0.5 : 0) * clamp01(1.5 - since * 0.3);
      if (this.data.id === 'galaxie') this.warp.intensity = Math.max(0, 0.6 - since * 0.5);

      const pop = outBack(clamp01((since - 0.15) / 0.7));
      const pet = this.petObj;
      pet.root.scale.setScalar(Math.max(0.001, pop));
      pet.spinner.rotation.y = Math.sin(since * 0.9) * 0.5;
      pet.update(since);
      if (since < 3 && Math.random() < dt * 14) this.rise.emit(1, this.data.glow, { speed: 0.4, up: 1, origin: [0, -0.3, 0], spread: [1.6, 0.3, 1], life: 1.6 });
      if (t >= tl.ready && this.ui.done.hidden) this.ui.done.hidden = false;
    }

    // Schockwellen und Teilchen
    for (const m of this.rings) {
      const d = m.userData;
      if (d.t >= d.dur) {
        m.material.opacity = 0;
        continue;
      }
      d.t += dt;
      const p = clamp01(d.t / d.dur);
      m.scale.setScalar(0.4 + outCubic(p) * d.max);
      m.material.opacity = Math.pow(1 - p, 1.5) * 0.7;
    }
    this.burst.update(dt);
    this.chips.update(dt);
    this.suck.update(dt);
    this.rise.update(dt);
    if (this.data.id === 'galaxie') this.warp.update(dt);

    // Kamera
    this.shake *= Math.exp(-dt * 3.5);
    const z = this.baseZ - clamp01(t / tl.burst) * 1.2 + (this.exploded ? 0.6 : 0);
    // nach dem Schlüpfen Bild nach oben schieben, damit unten Platz für den Text bleibt
    const look = -0.2 - (this.exploded ? outCubic(clamp01((t - this.explodedAt) / 0.8)) * 0.7 : 0);
    this.camera.position.set((Math.random() - 0.5) * this.shake, look + 0.4 + (Math.random() - 0.5) * this.shake, z);
    this.camera.lookAt(0, look, 0);
    this.renderer.render(this.scene, this.camera);
  }
}
