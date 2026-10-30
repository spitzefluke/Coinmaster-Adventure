// Entdeckungs-Animation für neue Münzen.
//
// Ablauf (siehe timeline()):
//   1. Anflug     – eine dunkle „?“-Münze fliegt heran
//   2. Aufladen   – sie steigt Stufe für Stufe auf (Normal → Selten → …) bis zur echten
//                   Seltenheit. Jede Stufe pulsiert, je seltener, desto mehr Stufen.
//   3. Spannung   – Zittern, Glühen, ab Mystisch Runenkreis, ab Galaktisch Sternen-Warp
//   4. Enthüllung – Blitz, Schockwellen, Funken, die echte Münze dreht sich ein
//
// Effekte kommen ab einer Stufe dazu und bleiben für alle höheren erhalten:
//   Selten Schockwelle · Sehr selten Strahlen · Episch Beben · Legendär Funkenfontäne ·
//   Mystisch Runenkreis · Engelsgleich Himmelslicht · Göttlich Mehrfach-Blitze ·
//   Galaktisch Sternen-Warp · Unerreichbar Regenbogen-Glitch

import * as THREE from 'three';
import { TIERS, tierById } from '../../muenzen/js/coins.js';
import { createCoin, makeEnvironment, makeScene, glowSprite, raysTexture, sparkTexture } from '../../muenzen/js/coinFactory.js';

const TAU = Math.PI * 2;
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const outCubic = (t) => 1 - Math.pow(1 - t, 3);
const outBack = (t) => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2);

// Zeitpunkte in Sekunden. Länge wächst mit der Seltenheit: ca. 2,5 s (Normal) bis 10 s (Unerreichbar).
export function timeline(k) {
  const intro = 0.7;
  const steps = [];
  let t = intro;
  for (let i = 0; i <= k; i++) {
    steps.push(t);
    t += i === 0 ? 0.5 : 0.42 + i * 0.025;
  }
  const reveal = t + 0.25 + k * 0.12;
  return { intro, steps, reveal, ready: reveal + 0.9 + k * 0.17 };
}

// ── Texturen ─────────────────────────────────────────────────────────────────

function canvasTex(w, h, draw) {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const mysteryTexture = () =>
  canvasTex(512, 512, (ctx, s) => {
    const c = s / 2;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(c, c, c * 0.86, 0, TAU);
    ctx.stroke();
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(c, c, c * 0.78, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = `${Math.round(s * 0.5)}px "Marcellus SC", Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', c, c + s * 0.03);
  });

const runeTexture = () =>
  canvasTex(1024, 1024, (ctx, s) => {
    const c = s / 2;
    ctx.strokeStyle = ctx.fillStyle = '#fff';
    ctx.lineWidth = 6;
    for (const r of [0.96, 0.9, 0.62]) {
      ctx.beginPath();
      ctx.arc(c, c, r * c, 0, TAU);
      ctx.stroke();
    }
    ctx.lineWidth = 5;
    ctx.beginPath();
    for (let i = 0; i <= 7; i++) {
      const a = ((i * 3) / 7) * TAU - Math.PI / 2;
      ctx.lineTo(c + Math.cos(a) * c * 0.88, c + Math.sin(a) * c * 0.88);
    }
    ctx.stroke();
    // Runenzeichen im Band zwischen 0.9 und 0.96
    let seed = 99;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * TAU, h = c * 0.045;
      ctx.save();
      ctx.translate(c + Math.cos(a) * c * 0.93, c + Math.sin(a) * c * 0.93);
      ctx.rotate(a + Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, -h / 2);
      ctx.lineTo(0, h / 2);
      ctx.moveTo(0, (rnd() - 0.5) * h);
      ctx.lineTo((rnd() < 0.5 ? -1 : 1) * h * 0.45, (rnd() - 0.5) * h);
      ctx.stroke();
      ctx.restore();
    }
  });

const beamTexture = () =>
  canvasTex(64, 512, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, 'rgba(255,255,255,1)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'destination-in';
    const v = ctx.createLinearGradient(0, 0, 0, h);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(0.35, 'rgba(0,0,0,1)');
    v.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, w, h);
  });

const ringTexture = () =>
  canvasTex(256, 256, (ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, s * 0.3, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.75, 'rgba(255,255,255,0.9)');
    g.addColorStop(0.85, 'rgba(255,255,255,1)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  });

const additive = (opts) =>
  new THREE.MeshBasicMaterial({ transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, ...opts });

// ── Funken-System ────────────────────────────────────────────────────────────
// Feste Anzahl Teilchen, die wiederverwendet werden. Tote Teilchen sind schwarz (additiv = unsichtbar).

class Sparks {
  constructor(n, size, { gravity = -3, drag = 1.2 } = {}) {
    this.n = n;
    this.gravity = gravity;
    this.drag = drag;
    this.pos = new Float32Array(n * 3);
    this.col = new Float32Array(n * 3);
    this.vel = new Float32Array(n * 3);
    this.life = new Float32Array(n);
    this.maxLife = new Float32Array(n).fill(1);
    this.tint = new Float32Array(n * 3);
    this.next = 0;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    this.points = new THREE.Points(
      geo,
      new THREE.PointsMaterial({ size, map: sparkTexture(), vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    this.points.frustumCulled = false;
  }

  emit(count, color, { speed = 4, origin = [0, 0, 0], up = 0, spread = [1, 1, 1], life = 1.4 } = {}) {
    const c = new THREE.Color(color);
    for (let k = 0; k < count; k++) {
      const i = this.next;
      this.next = (this.next + 1) % this.n;
      const v = new THREE.Vector3().randomDirection().multiplyScalar(speed * (0.35 + Math.random() * 0.65));
      this.pos.set([origin[0] + (Math.random() - 0.5) * spread[0], origin[1] + (Math.random() - 0.5) * spread[1], origin[2] + (Math.random() - 0.5) * spread[2] * 0.2], i * 3);
      this.vel.set([v.x, v.y + up, v.z * 0.6], i * 3);
      this.life[i] = this.maxLife[i] = life * (0.6 + Math.random() * 0.6);
      const m = 0.75 + Math.random() * 0.5;
      this.tint.set([c.r * m, c.g * m, c.b * m], i * 3);
    }
  }

  update(dt) {
    const damp = Math.exp(-this.drag * dt);
    for (let i = 0; i < this.n; i++) {
      if (this.life[i] <= 0) {
        this.col[i * 3] = this.col[i * 3 + 1] = this.col[i * 3 + 2] = 0;
        continue;
      }
      this.life[i] -= dt;
      const j = i * 3;
      this.vel[j] *= damp;
      this.vel[j + 1] = this.vel[j + 1] * damp + this.gravity * dt;
      this.vel[j + 2] *= damp;
      this.pos[j] += this.vel[j] * dt;
      this.pos[j + 1] += this.vel[j + 1] * dt;
      this.pos[j + 2] += this.vel[j + 2] * dt;
      const f = Math.sin(clamp01(this.life[i] / this.maxLife[i]) * Math.PI * 0.5);
      this.col[j] = this.tint[j] * f;
      this.col[j + 1] = this.tint[j + 1] * f;
      this.col[j + 2] = this.tint[j + 2] * f;
    }
    this.points.geometry.attributes.position.needsUpdate = true;
    this.points.geometry.attributes.color.needsUpdate = true;
  }

  clear() {
    this.life.fill(0);
    this.col.fill(0);
  }
}

// ── Sternen-Warp ─────────────────────────────────────────────────────────────

class Warp {
  constructor(n) {
    this.n = n;
    this.stars = Array.from({ length: n }, () => this.spawn({}, true));
    this.pos = new Float32Array(n * 6);
    this.col = new Float32Array(n * 6);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    this.lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.lines.frustumCulled = false;
    this.intensity = 0;
  }

  spawn(s, anywhere) {
    const a = Math.random() * TAU, r = 1.5 + Math.random() * 9;
    s.x = Math.cos(a) * r;
    s.y = Math.sin(a) * r;
    s.z = anywhere ? -40 + Math.random() * 44 : -40;
    s.hue = Math.random();
    return s;
  }

  update(dt) {
    const speed = 6 + this.intensity * 60, len = 0.1 + this.intensity * 3.5;
    this.stars.forEach((s, i) => {
      s.z += speed * dt;
      if (s.z > 6) this.spawn(s, false);
      this.pos.set([s.x, s.y, s.z, s.x, s.y, s.z - len], i * 6);
      const b = this.intensity * clamp01((s.z + 40) / 20);
      const c = new THREE.Color().setHSL(0.6 + s.hue * 0.25, 0.8, 0.75);
      this.col.set([c.r * b, c.g * b, c.b * b, 0, 0, 0], i * 6);
    });
    this.lines.geometry.attributes.position.needsUpdate = true;
    this.lines.geometry.attributes.color.needsUpdate = true;
  }
}

// ── Animation ────────────────────────────────────────────────────────────────

export class Discovery {
  constructor(el) {
    this.el = el;
    this.ui = {
      canvas: el.querySelector('.reveal-canvas'),
      flash: el.querySelector('.reveal-flash'),
      stage: el.querySelector('.reveal-stage'),
      text: el.querySelector('.reveal-text'),
      eyebrow: el.querySelector('.reveal-eyebrow'),
      banner: el.querySelector('.reveal-banner'),
      name: el.querySelector('.reveal-name'),
      tier: el.querySelector('.reveal-tier'),
      meta: el.querySelector('.reveal-meta'),
      hint: el.querySelector('.reveal-hint'),
      done: el.querySelector('.reveal-continue'),
    };
    this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

    const r = (this.renderer = new THREE.WebGLRenderer({ canvas: this.ui.canvas, antialias: true, alpha: true }));
    r.setPixelRatio(Math.min(devicePixelRatio, 2));
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.05;
    this.scene = makeScene(makeEnvironment(r));
    this.camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    this.buildProps();

    el.addEventListener('click', (e) => {
      if (e.target.closest('.reveal-continue')) return this.close();
      if (this.time < this.tl.reveal) this.time = this.tl.reveal - 0.05; // überspringen bis zur Enthüllung
      else if (this.time >= this.tl.reveal + 0.6) this.close();
    });
    addEventListener('keydown', (e) => {
      if (this.el.hidden) return;
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (this.time < this.tl.reveal) this.time = this.tl.reveal - 0.05;
        else this.close();
      }
    });
    addEventListener('resize', () => !this.el.hidden && this.resize());
  }

  buildProps() {
    const s = this.scene;

    // „?“-Münze
    const mtex = mysteryTexture();
    this.mystery = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 0.16, 96).rotateX(Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: '#1a1722', metalness: 1, roughness: 0.35, emissive: '#ffffff', emissiveMap: mtex, emissiveIntensity: 1 }),
    );
    // Deckel-UVs zeigen nach oben (+y) – nach der Drehung nach vorne. Damit das „?“ aufrecht steht:
    mtex.center.set(0.5, 0.5);
    mtex.rotation = Math.PI / 2;
    this.mysteryGlow = glowSprite('#ffffff', 3, 0.8);

    this.rays = new THREE.Sprite(new THREE.SpriteMaterial({ map: raysTexture(), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.rays.renderOrder = -2;

    this.rune = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), additive({ map: runeTexture(), opacity: 0 }));
    this.rune.position.z = -0.6;

    this.beam = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 14), additive({ map: beamTexture(), opacity: 0 }));
    this.beam.position.set(0, 3, -1.2);

    const rtex = ringTexture();
    this.rings = Array.from({ length: 8 }, () => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), additive({ map: rtex, opacity: 0 }));
      m.userData = { t: 1, dur: 1, max: 1 };
      return m;
    });

    this.burst = new Sparks(700, 0.16, { gravity: -3.2, drag: 1.4 });
    this.rise = new Sparks(400, 0.13, { gravity: 1.4, drag: 0.6 });
    this.motes = new Sparks(160, 0.22, { gravity: -0.35, drag: 2.2 });
    this.warp = new Warp(320);

    s.add(this.beam, this.rays, this.rune, this.warp.lines, this.mysteryGlow, this.mystery, ...this.rings, this.burst.points, this.rise.points, this.motes.points);
  }

  resize() {
    const w = this.el.clientWidth, h = this.el.clientHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // auf schmalen Bildschirmen weiter weg, damit Effekte ins Bild passen
    this.baseZ = w / h < 0.8 ? 10.5 : 7.5;
    this.camera.updateProjectionMatrix();
  }

  ring(color, { dur = 0.9, max = 6, z = 0.1 } = {}) {
    const m = this.rings.find((r) => r.userData.t >= r.userData.dur) || this.rings[0];
    m.material.color.set(color);
    m.position.z = z;
    m.userData = { t: 0, dur, max };
  }

  flash(peak, dur) {
    this.ui.flash.animate([{ opacity: peak }, { opacity: 0 }], { duration: dur, easing: 'ease-out' });
  }

  // Spielt die Animation. Gibt ein Promise zurück, das beim Schließen erfüllt wird.
  play(coin, { number, total, chance, eyebrow = 'Neue Münze entdeckt' }) {
    const tier = tierById[coin.tier];
    const k = tier.index;
    this.k = k;
    this.tier = tier;
    this.tl = timeline(k);
    if (this.reducedMotion) this.tl = { intro: 0, steps: [0], reveal: 0.05, ready: 0.4 };
    this.time = 0;
    this.stepShown = -1;
    this.revealed = false;
    this.shake = 0;
    this.pulse = 0;
    this.extraFlashes = [];

    if (this.coin) {
      this.scene.remove(this.coin.root);
      this.coin.dispose();
    }
    this.coin = createCoin(coin, { resolution: 1024 });
    this.coin.root.visible = false;
    this.scene.add(this.coin.root);

    this.mystery.visible = this.mysteryGlow.visible = true;
    this.mystery.position.set(0, 0, -18);
    this.rays.material.opacity = this.rune.material.opacity = this.beam.material.opacity = 0;
    this.rings.forEach((r) => (r.userData.t = r.userData.dur, r.material.opacity = 0));
    [this.burst, this.rise, this.motes].forEach((p) => p.clear());
    this.warp.intensity = 0;

    // Texte vorbereiten
    const u = this.ui;
    this.el.style.setProperty('--tier', tier.color);
    this.el.dataset.rank = k;
    u.eyebrow.textContent = eyebrow;
    u.banner.textContent = tier.name + '!';
    u.banner.hidden = k < 4;
    u.name.textContent = '';
    [...coin.name].forEach((ch, i) => {
      const span = document.createElement('span');
      span.textContent = ch;
      span.style.animationDelay = `${(k >= 5 ? i * 45 : 0) + (k >= 4 ? 350 : 0)}ms`;
      u.name.append(span);
    });
    u.tier.textContent = tier.name;
    u.meta.textContent = `#${String(number).padStart(2, '0')} von ${total} · ${chance} Drop-Chance`;
    u.text.classList.remove('is-shown', 'is-glitch');
    u.done.hidden = true;
    u.hint.hidden = false;
    u.stage.textContent = '';
    u.stage.classList.remove('is-shown');
    this.ui.canvas.style.filter = '';

    this.el.hidden = false;
    document.body.style.overflow = 'hidden';
    this.resize();
    this.camera.position.set(0, 0, this.baseZ);
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

  onStep(i) {
    const t = TIERS[i];
    const u = this.ui;
    u.stage.textContent = t.name;
    u.stage.style.setProperty('--step', t.color);
    u.stage.classList.add('is-shown');
    u.stage.animate([{ transform: 'scale(1.35)', opacity: 0.3 }, { transform: 'scale(1)', opacity: 1 }], { duration: 320, easing: 'cubic-bezier(.2,1.6,.4,1)' });
    this.pulse = 1;
    if (i > 0) {
      this.ring(t.color, { dur: 0.7, max: 3.2 + i * 0.25 });
      this.shake = Math.max(this.shake, i >= 3 ? 0.03 + i * 0.006 : 0);
      this.burst.emit(6 + i * 3, t.color, { speed: 2 + i * 0.3, life: 0.6 });
      if (i >= 7) this.flash(0.15, 200);
    }
  }

  doReveal() {
    const k = this.k, color = this.tier.color, u = this.ui;
    this.revealed = true;
    this.revealAt = this.time;
    this.mystery.visible = this.mysteryGlow.visible = false;
    this.coin.root.visible = true;
    this.flash(0.55 + k * 0.05, 450 + k * 90);
    this.shake = k >= 3 ? 0.08 + k * 0.025 : 0.02;

    const waves = 1 + Math.floor(k / 2);
    for (let i = 0; i < waves; i++) setTimeout(() => this.ring(i % 2 ? '#ffffff' : color, { dur: 1 + i * 0.15, max: 7 + i * 2 }), i * 120);
    this.burst.emit(40 + k * 30, color, { speed: 5 + k * 0.7, life: 1.4 + k * 0.08 });
    this.burst.emit(12 + k * 4, '#ffffff', { speed: 4 + k * 0.5, life: 0.8 });
    if (k >= 4) this.rise.emit(80 + k * 20, color, { speed: 1.5, up: 3.5, origin: [0, -1.2, 0], spread: [2.4, 0.4, 1], life: 2.4 });
    if (k >= 7) this.extraFlashes = [this.time + 0.45, this.time + 0.9];
    if (k >= 9) {
      u.text.classList.add('is-glitch');
      this.ui.canvas.animate(
        [{ filter: 'hue-rotate(0deg) saturate(1.4)' }, { filter: 'hue-rotate(360deg) saturate(1.4)' }],
        { duration: 1600, iterations: Infinity },
      );
    }

    u.stage.classList.remove('is-shown');
    u.hint.hidden = true;
    setTimeout(() => u.text.classList.add('is-shown'), 150);
  }

  frame() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.time += dt;
    const t = this.time, tl = this.tl, k = this.k;

    // Stufen-Aufstieg
    let step = -1;
    tl.steps.forEach((s, i) => t >= s && (step = i));
    if (!this.revealed && step > this.stepShown) {
      for (let i = this.stepShown + 1; i <= step; i++) this.onStep(i);
      this.stepShown = step;
    }
    if (!this.revealed && t >= tl.reveal) this.doReveal();
    if (this.extraFlashes.length && t >= this.extraFlashes[0]) {
      this.extraFlashes.shift();
      this.flash(0.7, 380);
      this.ring('#ffffff', { dur: 1.1, max: 10 });
      this.burst.emit(80, this.tier.color, { speed: 7, life: 1.2 });
      this.shake = Math.max(this.shake, 0.15);
    }

    this.pulse *= Math.exp(-dt * 5);
    const stepColor = new THREE.Color(TIERS[Math.max(0, step)].color);

    // „?“-Münze: Anflug, immer schneller drehen, vor der Enthüllung zittern
    if (!this.revealed) {
      const fly = outCubic(clamp01(t / Math.max(0.01, tl.intro)));
      const tension = clamp01((t - tl.steps[tl.steps.length - 1]) / Math.max(0.01, tl.reveal - tl.steps[tl.steps.length - 1]));
      const jitter = tension * (0.02 + k * 0.012);
      this.mystery.position.set((Math.random() - 0.5) * jitter, (Math.random() - 0.5) * jitter, -18 * (1 - fly));
      this.mystery.rotation.y += dt * (3 + Math.max(0, step) * 2.2 + tension * 10);
      this.mystery.rotation.x = Math.sin(t * 2) * 0.15;
      this.mystery.material.emissive.lerp(stepColor, 0.2);
      this.mystery.material.emissiveIntensity = 0.9 + this.pulse * 1.5 + tension;
      this.mysteryGlow.material.color.copy(stepColor);
      this.mysteryGlow.position.copy(this.mystery.position);
      this.mysteryGlow.scale.setScalar((2.4 + Math.max(0, step) * 0.12 + this.pulse * 0.8 + tension * 0.8) * fly);
      this.mysteryGlow.material.opacity = 0.5 + this.pulse * 0.2 + tension * 0.25;
      if (k >= 3 && tension > 0) this.shake = Math.max(this.shake, tension * (0.02 + k * 0.006));
    }

    // Runenkreis ab Mystisch – erscheint, sobald die Aufladung Mystisch erreicht
    if (k >= 5) {
      const on = this.revealed ? 1 - clamp01((t - this.revealAt - 1.5) / 1.5) * 0.6 : clamp01((t - tl.steps[5]) / 0.6);
      this.rune.material.opacity = on * 0.85;
      this.rune.material.color.copy(this.revealed ? new THREE.Color(this.tier.color) : stepColor);
      this.rune.rotation.z += dt * (0.4 + (this.revealed ? 0.2 : 1.2));
      this.rune.scale.setScalar(3.4 + (this.revealed ? outCubic(clamp01((t - this.revealAt) / 0.8)) * 1.4 : 0));
    }

    // Sternen-Warp ab Galaktisch
    if (k >= 8) {
      const target = this.revealed ? Math.max(0, 1 - (t - this.revealAt) * 1.2) * 0.4 : clamp01((t - tl.steps[8]) / 0.8);
      this.warp.intensity += (target - this.warp.intensity) * Math.min(1, dt * 4);
      this.warp.update(dt);
    }

    // Echte Münze nach der Enthüllung
    if (this.revealed) {
      const since = t - this.revealAt;
      const pop = outBack(clamp01(since / 0.7));
      const settle = clamp01(since / (1.3 + k * 0.12));
      this.coin.root.scale.setScalar(0.25 + 0.75 * pop);
      this.coin.spinner.rotation.y = (1 - outCubic(settle)) * TAU * (2 + k * 0.4) + (settle >= 1 ? Math.sin((since - 1.3 - k * 0.12) * 0.9) * 0.35 : 0);
      this.coin.spinner.rotation.x = Math.sin(since * 1.1) * 0.08;
      this.coin.update(t);

      if (k >= 2) {
        const on = outCubic(clamp01(since / 0.6));
        this.rays.material.color.set(this.tier.color);
        this.rays.material.opacity = on * (0.3 + k * 0.02);
        this.rays.material.rotation += dt * 0.25;
        this.rays.scale.setScalar(on * (4.5 + k * 0.45));
      }
      if (k >= 6) {
        this.beam.material.opacity = Math.min(0.8, since * 1.5) * (0.85 + Math.sin(t * 3) * 0.15);
        this.beam.material.color.set(this.tier.color).lerp(new THREE.Color('#ffffff'), 0.6);
        if (Math.random() < dt * 30) this.motes.emit(1, '#fff6dc', { speed: 0.3, origin: [(Math.random() - 0.5) * 6, 3.5, 0.5], spread: [0.5, 0.2, 1], life: 3.2 });
      }
      if (k >= 4 && since < 2.5 && Math.random() < dt * 25) this.rise.emit(2, this.tier.color, { speed: 0.8, up: 2.5, origin: [0, -1.1, 0], spread: [2, 0.2, 1], life: 2 });

      if (t >= tl.ready && this.ui.done.hidden) this.ui.done.hidden = false;
    }

    // Schockwellen
    for (const r of this.rings) {
      const d = r.userData;
      if (d.t >= d.dur) {
        r.material.opacity = 0;
        continue;
      }
      d.t += dt;
      const p = clamp01(d.t / d.dur);
      r.scale.setScalar(0.4 + outCubic(p) * d.max);
      r.material.opacity = Math.pow(1 - p, 1.5) * 0.6;
    }

    this.burst.update(dt);
    this.rise.update(dt);
    this.motes.update(dt);

    // Kamera: langsames Heranfahren, Beben, nach der Enthüllung Bild nach oben schieben,
    // damit unten Platz für Name und Stufe bleibt
    this.shake *= Math.exp(-dt * 3.5);
    const after = this.revealed ? outCubic(clamp01((t - this.revealAt) / 0.9)) : 0;
    const z = this.baseZ - (this.revealed ? 0.4 - after * k * 0.3 : clamp01(t / tl.reveal) * 0.8);
    const lift = after * (0.75 + k * 0.03) * (this.baseZ / 7.5);
    this.camera.position.set((Math.random() - 0.5) * this.shake, -lift + (Math.random() - 0.5) * this.shake, z);
    this.camera.lookAt(0, -lift, 0);

    this.renderer.render(this.scene, this.camera);
  }
}
