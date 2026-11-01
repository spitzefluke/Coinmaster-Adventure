// Baut aus einem Haustier-Datensatz ein animierbares 3D-Objekt.
//
//   root
//   ├─ pedestal  Sockel wie bei den Eiern
//   ├─ fx        bleibt aufrecht und unskaliert: Glühen, Strahlen, Aura
//   └─ spinner   dreht sich
//      └─ model  das Tier, automatisch auf Sockelgröße skaliert
import { THREE, TAU, Builder, seeded, hashStr, glowSprite, raysTexture, addRim, shadowTexture, runeTexture } from './kit.js';
import { swarm } from './templates.js';
import { BUILDERS as A } from './builders-a.js';
import { BUILDERS as B } from './builders-b.js';
import { BUILDERS as C } from './builders-c.js';
import { BUILDERS as RA } from './rbx-a.js';
import { BUILDERS as RB } from './rbx-b.js';
import { BUILDERS as RC } from './rbx-c.js';

const ALL = { ...A, ...B, ...C };
// Roblox-Stil (rbx-*.js); fehlt ein Bauplan, wird der alte genommen
const RBX = { ...RA, ...RB, ...RC };
export const STYLE = { current: 'rbx' };
export const PED_TOP = -1.33;

function fit(model, H, W) {
  model.updateMatrixWorld(true);
  const box = new THREE.Box3(), tmp = new THREE.Box3();
  model.traverse((o) => {
    if (!o.isMesh || !o.visible) return;
    for (let p = o; p && p !== model; p = p.parent) if (p.userData.nofit) return;
    if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
    tmp.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
    box.union(tmp);
  });
  if (box.isEmpty()) return;
  const size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
  const s = Math.min(H / size.y, W / Math.max(size.x, size.z * 0.65));
  model.scale.setScalar(s);
  model.position.set(-c.x * s, PED_TOP - box.min.y * s, -c.z * s);
  return { w: size.x * s, d: size.z * s };
}

function epicFx(b, fx, color) {
  const accent = new THREE.Color(color);
  const rays = new THREE.Sprite(new THREE.SpriteMaterial({ map: raysTexture(), color: accent, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false }));
  rays.scale.setScalar(5.8);
  rays.renderOrder = -2;
  rays.position.y = 0.1;
  fx.add(rays);
  const ringMat = b.basic(accent, { opacity: 0.85 });
  const rings = [1.3, 1.5].map((r) => {
    const m = b.torus(fx, ringMat, [0, PED_TOP + 0.03, 0], r, 0.012, [Math.PI / 2, 0, 0]);
    return m;
  });
  const gemMat = b.mat(color, { glow: color, ei: 1.4, rough: 0.1, flat: true });
  const gems = Array.from({ length: 8 }, (_, i) => b.octa(fx, gemMat, [0, 0, 0], 0.06, [0.045, 0.08, 0.045]));
  // Runenkreis auf dem Sockel
  const rune = new THREE.Mesh(b.track(new THREE.PlaneGeometry(2.3, 2.3)), b.basic(accent, { map: runeTexture(), opacity: 0.55 }));
  rune.rotation.x = -Math.PI / 2;
  rune.position.y = PED_TOP + 0.012;
  fx.add(rune);
  // Lichtsäule
  const pillarTex = b.ctex(16, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, h, 0, 0);
    g.addColorStop(0, 'rgba(255,255,255,0.9)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.25)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
  const pillarMat = b.basic(accent, { map: pillarTex, opacity: 0.06 });
  pillarMat.side = THREE.BackSide;
  const pillar = b.cyl(fx, pillarMat, [0, PED_TOP + 0.7, 0], 1.12, 1.16, 1.4, null, 64, true);
  pillar.renderOrder = -3;
  // Druckwellen
  const waveMat = Array.from({ length: 2 }, () => b.basic(accent, { opacity: 0 }));
  const waves = waveMat.map((m) => b.torus(fx, m, [0, PED_TOP + 0.04, 0], 1, 0.02, [Math.PI / 2, 0, 0]));
  // Glutfunken, die nach oben wirbeln
  swarm(b, fx, 40, '#ffffff', 0.07, (s, t, o) => {
    const life = (t * (0.35 + s[0] * 0.3) + s[1]) % 1;
    const a = s[2] * TAU + life * 5;
    const r = 0.35 + s[3] * 0.9 + life * 0.3;
    o[0] = Math.cos(a) * r;
    o[1] = PED_TOP + 0.05 + life * 2.6;
    o[2] = Math.sin(a) * r;
    o[3] = Math.sin(life * Math.PI) * 1.2;
    o[4] = accent.r * 0.5 + 0.5;
    o[5] = accent.g * 0.5 + 0.5;
    o[6] = accent.b * 0.5 + 0.5;
  });
  swarm(b, fx, 56, accent.clone().lerp(new THREE.Color('#ffffff'), 0.35), 0.12, (s, t, o) => {
    const life = (t * (0.18 + s[0] * 0.15) + s[1]) % 1;
    const a = s[2] * TAU + life * 2.2;
    const r = 1.05 + s[3] * 0.55;
    o[0] = Math.cos(a) * r;
    o[1] = PED_TOP + 0.1 + life * 3.2;
    o[2] = Math.sin(a) * r * 0.7;
    o[3] = Math.sin(life * Math.PI);
  });
  b.on((t) => {
    rays.material.rotation = t * 0.15;
    rays.material.opacity = 0.24 + Math.sin(t * 1.6) * 0.08;
    rings[0].scale.setScalar(1 + Math.sin(t * 2) * 0.02);
    rings[1].rotation.z = t * 0.3;
    ringMat.opacity = 0.6 + Math.sin(t * 2.2) * 0.25;
    rune.rotation.z = -t * 0.12;
    rune.material.opacity = 0.45 + Math.sin(t * 1.7) * 0.15;
    pillar.material.opacity = 0.06 + Math.sin(t * 1.3) * 0.02;
    waves.forEach((w, i) => {
      const k = (t * 0.45 + i * 0.5) % 1;
      w.scale.setScalar(0.9 + k * 1.1);
      waveMat[i].opacity = (1 - k) * 0.7;
    });
    gems.forEach((g, i) => {
      const a = (i / 8) * TAU + t * 0.4;
      g.position.set(Math.cos(a) * 1.42, PED_TOP + 0.3 + Math.sin(t * 2 + i) * 0.08, Math.sin(a) * 1.42);
      g.rotation.y = t * 2 + i;
    });
  });
}

// ── Zusätzliche Effekte für epische Tiere: Schweben, Kraftschub, Blitze, Themen-Partikel und Orbit-Objekte ──

const SURGE_T = 7;
export const surgeAt = (t) => {
  const p = (t % SURGE_T) / SURGE_T;
  return p < 0.12 ? Math.sin((p / 0.12) * Math.PI) : 0;
};

const themeTex = {};
function tex(kind) {
  if (themeTex[kind]) return themeTex[kind];
  const cv = document.createElement('canvas');
  cv.width = cv.height = 64;
  const c = cv.getContext('2d');
  c.translate(32, 32);
  c.fillStyle = c.strokeStyle = '#fff';
  c.lineCap = 'round';
  if (kind === 'leaf') {
    c.rotate(0.6);
    c.beginPath();
    c.ellipse(0, 0, 12, 26, 0, 0, TAU);
    c.fill();
    c.globalCompositeOperation = 'destination-out';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(0, -24);
    c.lineTo(0, 24);
    c.stroke();
  } else if (kind === 'snow') {
    c.lineWidth = 3;
    for (let i = 0; i < 6; i++) {
      c.rotate(TAU / 6);
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(0, -28);
      c.moveTo(0, -16);
      c.lineTo(-8, -24);
      c.moveTo(0, -16);
      c.lineTo(8, -24);
      c.stroke();
    }
  } else if (kind === 'feather') {
    c.rotate(0.5);
    c.beginPath();
    c.moveTo(0, -28);
    c.quadraticCurveTo(14, -6, 2, 26);
    c.quadraticCurveTo(-12, -2, 0, -28);
    c.fill();
  } else if (kind === 'square') {
    c.fillRect(-18, -18, 36, 36);
  } else if (kind === 'confetti') {
    c.rotate(0.4);
    c.fillRect(-8, -22, 16, 44);
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return (themeTex[kind] = t);
}

const THEMES = {
  normal: { tex: 'spark', mode: 'rise', cols: ['#ffd36a', '#fff2b8', '#ffb347'], orbit: 'coin' },
  wald: { tex: 'leaf', mode: 'swirl', cols: ['#7bd84a', '#c6ff6a', '#3fae4a', '#e0c35a'], orbit: 'firefly' },
  eis: { tex: 'snow', mode: 'fall', cols: ['#ffffff', '#bff4ff', '#8ee3ff'], orbit: 'shard' },
  engel: { tex: 'feather', mode: 'fall', cols: ['#ffffff', '#fff1c4', '#ffe08a'], orbit: 'halo' },
  galaxie: { tex: 'spark', mode: 'disc', cols: ['#b49cff', '#7ad7ff', '#ff8ee8', '#ffffff'], orbit: 'planet' },
  admin: { tex: 'square', mode: 'rise', cols: ['#ff4058', '#38f0ff', '#ffffff'], orbit: 'cube' },
  release: { tex: 'confetti', mode: 'burst', cols: ['#ff5aa5', '#ffe07a', '#5ad1ff', '#8cff7a', '#c48bff'], orbit: 'star' },
};

function epicPlus(b, fx, spinner, pet, glow, fp) {
  const accent = new THREE.Color(pet.glow), white = new THREE.Color('#ffffff');
  const th = THEMES[pet.egg] ?? THEMES.normal;
  const cols = th.cols.map((c) => new THREE.Color(c));
  const H = 2.7, midY = PED_TOP + H * 0.5;

  // Themen-Partikel
  swarm(b, fx, 46, '#ffffff', th.tex === 'spark' ? 0.12 : 0.16, (s, t, o, i) => {
    const c = cols[i % cols.length];
    o[4] = c.r; o[5] = c.g; o[6] = c.b;
    const sp = 0.12 + s[0] * 0.12, life = (t * sp + s[1]) % 1, a = s[2] * TAU;
    if (th.mode === 'fall') {
      const r = 0.4 + s[3] * 1.3;
      o[0] = Math.cos(a + t * 0.3) * r + Math.sin(t * 1.3 + i) * 0.12;
      o[1] = PED_TOP + 3.1 - life * 3.1;
      o[2] = Math.sin(a + t * 0.3) * r * 0.8;
      o[3] = Math.min(1, Math.sin(life * Math.PI) * 1.6) * 0.9;
    } else if (th.mode === 'swirl') {
      const r = 1.0 + s[3] * 0.6 - life * 0.3, ang = a + life * TAU * 1.4;
      o[0] = Math.cos(ang) * r;
      o[1] = PED_TOP + 0.1 + life * 2.8;
      o[2] = Math.sin(ang) * r;
      o[3] = Math.sin(life * Math.PI);
    } else if (th.mode === 'disc') {
      const r = 1.25 + s[3] * 0.5, ang = a + t * (0.5 + s[0] * 0.4);
      o[0] = Math.cos(ang) * r;
      o[1] = midY + Math.sin(ang) * r * 0.22 + (s[1] - 0.5) * 0.12;
      o[2] = Math.sin(ang) * r * 0.95;
      o[3] = 0.55 + Math.sin(t * 3 + i) * 0.45;
    } else if (th.mode === 'burst') {
      const k = (t % SURGE_T) / SURGE_T, up = Math.min(1, k * 6), fall = Math.max(0, k * 6 - 1) / 5;
      const r = 0.2 + up * (0.8 + s[3] * 0.9);
      o[0] = Math.cos(a) * r + Math.sin(t * 2 + i) * 0.06 * fall;
      o[1] = PED_TOP + 0.6 + up * (1.6 + s[0] * 1.0) - fall * fall * 2.6;
      o[2] = Math.sin(a) * r * 0.85;
      o[3] = k < 0.98 && o[1] > PED_TOP ? 1 : 0;
    } else {
      const r = 0.5 + s[3] * 0.9;
      o[0] = Math.cos(a) * r + Math.sin(t + i) * 0.1;
      o[1] = PED_TOP + 0.1 + life * 3.0;
      o[2] = Math.sin(a) * r * 0.85;
      o[3] = Math.sin(life * Math.PI) * (th.orbit === 'cube' ? (Math.sin(t * 20 + i * 7) > -0.3 ? 1 : 0) : 1);
    }
  }, th.tex === 'spark' ? undefined : tex(th.tex));

  // Orbit-Objekte
  const orbitG = new THREE.Group();
  orbitG.position.y = midY;
  fx.add(orbitG);
  const items = [];
  const N = th.orbit === 'planet' ? 4 : 6;
  for (let i = 0; i < N; i++) {
    const g = new THREE.Group();
    orbitG.add(g);
    const c = cols[i % cols.length].getStyle();
    switch (th.orbit) {
      case 'coin': {
        const gold = b.mat('#f0b93a', { metal: 1, rough: 0.22, coat: 0.6 });
        b.cyl(g, gold, [0, 0, 0], 0.11, 0.11, 0.025, [Math.PI / 2, 0, 0], 32);
        b.torus(g, b.mat('#ffd36a', { metal: 1, rough: 0.15 }), [0, 0, 0.0], 0.1, 0.012);
        b.cyl(g, b.mat('#c8901f', { metal: 1, rough: 0.3 }), [0, 0, 0.014], 0.05, 0.05, 0.004, [Math.PI / 2, 0, 0], 6);
        break;
      }
      case 'firefly':
        b.ball(g, b.mat('#eaff9a', { glow: '#c6ff4a', ei: 3 }), [0, 0, 0], 0.035);
        g.add(glowSprite('#c6ff4a', 0.35, 0.8));
        break;
      case 'shard':
        b.octa(g, b.mat('#d8f8ff', { rough: 0.05, coat: 1, glow: '#4fc8ff', ei: 0.7, opacity: 0.85, flat: true, irid: 0.6 }), [0, 0, 0], 1, [0.06, 0.2, 0.06]);
        break;
      case 'halo':
        b.torus(g, b.mat('#ffe08a', { glow: '#ffcf4d', ei: 2, metal: 1, rough: 0.2 }), [0, 0, 0], 0.09, 0.012, [Math.PI / 2, 0, 0]);
        g.add(glowSprite('#ffe9a8', 0.4, 0.5));
        break;
      case 'planet': {
        const r = 0.07 + (i % 2) * 0.05;
        b.ball(g, b.mat(c, { rough: 0.5, glow: c, ei: 0.35, surf: 'stone', ns: 0.4 }), [0, 0, 0], r);
        if (i % 2) b.torus(g, b.basic(c, { opacity: 0.7 }), [0, 0, 0], r * 1.7, r * 0.12, [Math.PI / 2 - 0.4, 0, 0]);
        g.add(glowSprite(c, r * 6, 0.4));
        break;
      }
      case 'cube':
        b.rbox(g, b.mat(c, { glow: c, ei: 1.6, rough: 0.3 }), [0, 0, 0], [0.11, 0.11, 0.11], 0.01);
        b.rbox(g, b.basic(c, { opacity: 0.25 }), [0, 0, 0], [0.17, 0.17, 0.17], 0.01);
        break;
      case 'star': {
        const s = new THREE.Shape();
        for (let k = 0; k < 10; k++) {
          const a = (k / 10) * TAU + Math.PI / 2, r = k % 2 ? 0.05 : 0.12;
          k ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        b.extrude(g, b.mat(c, { glow: c, ei: 1.2, metal: 0.4, rough: 0.25 }), s, 0.03, [0, 0, 0], null, null, 0.01);
        break;
      }
    }
    items.push({ g, ph: (i / N) * TAU, tilt: (i % 3 - 1) * 0.35, r: 1.3 + (i % 2) * 0.22, sp: 0.5 + (i % 3) * 0.12 });
  }

  // Blitzbögen während des Kraftschubs
  const boltMat = b.track(new THREE.LineBasicMaterial({ color: accent.clone().lerp(white, 0.5), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  const bolts = Array.from({ length: 4 }, () => {
    const geo = b.track(new THREE.BufferGeometry());
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(14 * 3), 3));
    const l = new THREE.Line(geo, boltMat);
    l.frustumCulled = false;
    l.userData.nofit = true;
    fx.add(l);
    return l;
  });
  const zap = (l) => {
    const P = l.geometry.attributes.position, a0 = b.rnd() * TAU, a1 = a0 + 0.8 + b.rnd() * 1.6;
    const A = new THREE.Vector3(Math.cos(a0) * 1.25, PED_TOP + 0.3 + b.rnd() * 2.2, Math.sin(a0) * 1.25);
    const B = new THREE.Vector3(Math.cos(a1) * 1.25, PED_TOP + 0.3 + b.rnd() * 2.2, Math.sin(a1) * 1.25);
    for (let i = 0; i < 14; i++) {
      const k = i / 13, p = A.clone().lerp(B, k);
      p.setLength(p.length() + Math.sin(k * Math.PI) * 0.3);
      if (i && i < 13) p.add(new THREE.Vector3(b.rnd() - 0.5, b.rnd() - 0.5, b.rnd() - 0.5).multiplyScalar(0.22));
      P.setXYZ(i, p.x, p.y, p.z);
    }
    P.needsUpdate = true;
  };

  // Druckwelle beim Kraftschub
  const burstMat = b.basic(accent.clone().lerp(white, 0.3), { opacity: 0 });
  const burst = b.torus(fx, burstMat, [0, PED_TOP + 0.05, 0], 1, 0.04, [Math.PI / 2, 0, 0]);
  const flash = glowSprite(accent.clone().lerp(white, 0.4), 4, 0);
  flash.position.y = midY;
  fx.add(flash);

  const baseY = spinner.position.y;
  let lastZap = 0;
  b.on((t) => {
    const s = surgeAt(t), k = (t % SURGE_T) / SURGE_T;
    // Schweben
    spinner.position.y = baseY + 0.1 + Math.sin(t * 1.4) * 0.06 + s * 0.08;
    spinner.scale.setScalar(1 + s * 0.045);
    // Randlicht pulsiert, beim Kraftschub hell
    b.rimMats?.forEach((m) => m.userData.rim?.u && (m.userData.rim.u.value = 0.3 + Math.sin(t * 2) * 0.06 + s * 0.9));
    glow.material.opacity = 0.38 + Math.sin(t * 2) * 0.08 + s * 0.3;
    flash.material.opacity = s * 0.55;
    const bk = Math.min(1, k / 0.3);
    burst.scale.setScalar(0.6 + bk * 1.6);
    burstMat.opacity = k < 0.3 ? (1 - bk) * 0.9 : 0;
    if (s > 0.05 && t - lastZap > 0.07) {
      bolts.forEach(zap);
      lastZap = t;
    }
    boltMat.opacity = s > 0.05 ? (0.6 + b.rnd() * 0.4) * s : 0;
    // Orbit
    items.forEach((it, i) => {
      const a = it.ph + t * it.sp * (1 + s * 2);
      it.g.position.set(Math.cos(a) * it.r, Math.sin(a + it.tilt * 3) * 0.35 + it.tilt * 0.6, Math.sin(a) * it.r);
      it.g.rotation.set(t * 0.7 + i, t * 1.6 + i, 0);
      if (th.orbit === 'firefly') it.g.visible = Math.sin(t * 2.3 + i * 1.7) > -0.4;
      if (th.orbit === 'cube') it.g.visible = Math.sin(t * 11 + i * 3) > -0.85;
    });
    orbitG.rotation.z = Math.sin(t * 0.3) * 0.12;
  });
}

export function createPet(pet, { pedestal = true, style = STYLE.current } = {}) {
  const root = new THREE.Group(), spinner = new THREE.Group(), model = new THREE.Group(), fx = new THREE.Group();
  spinner.add(model);
  root.add(fx, spinner);
  const b = new Builder(seeded(hashStr(pet.id) + 99), model, fx);
  b.pet = pet;
  const build = (style === 'rbx' && RBX[pet.id]) || ALL[pet.id];
  if (build) build(b);
  else b.ball(model, b.mat(pet.glow, { rough: 0.4 }), [0, 0.5, 0], 0.5);
  const fp = fit(model, pet.epic ? 2.7 : 2.3, pet.epic ? 3.0 : 2.55);

  // Randlicht: neutral für normale, in Akzentfarbe für epische Tiere
  const rimCol = new THREE.Color(pet.epic ? '#ffffff' : '#cfd8ff').lerp(new THREE.Color(pet.glow), pet.epic ? 0.5 : 0.35);
  const seen = new Set();
  model.traverse((o) => {
    if (!o.isMesh || seen.has(o.material)) return;
    seen.add(o.material);
    if (o.material.blending === THREE.AdditiveBlending) return;
    addRim(o.material, rimCol, pet.epic ? 0.32 : 0.25, pet.epic ? 3.2 : 3.4);
  });
  b.rimMats = seen;

  // Kontaktschatten auf dem Sockel
  if (fp) {
    const sh = new THREE.Mesh(b.track(new THREE.PlaneGeometry(1, 1)), b.track(new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false, opacity: 0.75 })));
    sh.rotation.x = -Math.PI / 2;
    const r = Math.min(2.2, Math.max(fp.w, fp.d) * 0.95);
    sh.scale.set(r, r, 1);
    sh.position.y = PED_TOP + 0.006;
    sh.renderOrder = 1;
    fx.add(sh);
  }

  const accent = new THREE.Color(pet.glow);
  let pedestalGroup = null;
  if (pedestal && style === 'rbx') {
    // Roblox-Sockel: achteckige Stufen, Neonkanten in Eifarbe, Noppen
    pedestalGroup = new THREE.Group();
    const oct = (rt, rb, h, y, m) => {
      const o = new THREE.Mesh(b.track(new THREE.CylinderGeometry(rt, rb, h, 8)), m);
      o.position.y = y;
      o.rotation.y = Math.PI / 8;
      pedestalGroup.add(o);
      return o;
    };
    const stoneM = b.mat('#262130', { rough: 0.5, metal: 0.3, coat: 0.4 });
    const topM = b.mat('#352e42', { rough: 0.3, metal: 0.6, coat: 0.8 });
    oct(1.32, 1.44, 0.3, -0.07, stoneM);
    oct(1.14, 1.2, 0.16, 0.16, topM);
    const rimMat = b.track(new THREE.MeshBasicMaterial({ color: accent }));
    const ring = (R, y, m, t = 0.028) => {
      const r = new THREE.Mesh(b.track(new THREE.TorusGeometry(R, t, 4, 8)), m);
      r.rotation.set(Math.PI / 2, 0, Math.PI / 8);
      r.position.y = y;
      pedestalGroup.add(r);
      return r;
    };
    ring(1.15, 0.24, rimMat);
    ring(1.33, 0.08, rimMat, 0.018);
    const studM = pet.epic ? b.mat('#f2c14e', { metal: 1, rough: 0.22, coat: 0.6 }) : b.mat('#4a4258', { rough: 0.35, metal: 0.4, coat: 0.6 });
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * TAU;
      const s = new THREE.Mesh(b.track(new THREE.CylinderGeometry(0.045, 0.045, 0.04, 16)), studM);
      s.position.set(Math.cos(a) * 1.25, 0.1, Math.sin(a) * 1.25);
      pedestalGroup.add(s);
    }
    if (pet.epic) {
      const gm = b.mat('#d9b26a', { metal: 1, rough: 0.25 });
      ring(1.44, -0.21, gm, 0.035);
      oct(1.5, 1.56, 0.1, -0.27, stoneM);
    }
    pedestalGroup.position.y = PED_TOP - 0.24;
    root.add(pedestalGroup);
    b.on((t) => rimMat.color.copy(accent).multiplyScalar(0.8 + Math.sin(t * 2) * 0.3));
  } else if (pedestal) {
    pedestalGroup = new THREE.Group();
    const stone = new THREE.Mesh(b.track(new THREE.CylinderGeometry(1.25, 1.45, 0.34, 64)), b.track(new THREE.MeshStandardMaterial({ color: '#2a2532', metalness: 0.5, roughness: 0.45 })));
    const top = new THREE.Mesh(b.track(new THREE.CylinderGeometry(1.12, 1.18, 0.08, 64)), b.track(new THREE.MeshStandardMaterial({ color: '#3a3346', metalness: 0.8, roughness: 0.3 })));
    top.position.y = 0.2;
    const rimMat = b.track(new THREE.MeshBasicMaterial({ color: accent }));
    const rim = new THREE.Mesh(b.track(new THREE.TorusGeometry(1.19, 0.025, 8, 96)), rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.2;
    pedestalGroup.add(stone, top, rim);
    if (pet.epic) {
      const trim = new THREE.Mesh(b.track(new THREE.TorusGeometry(1.44, 0.03, 8, 96)), b.mat('#d9b26a', { metal: 1, rough: 0.25 }));
      trim.rotation.x = Math.PI / 2;
      trim.position.y = -0.16;
      pedestalGroup.add(trim);
    }
    pedestalGroup.position.y = PED_TOP - 0.24;
    root.add(pedestalGroup);
    b.on((t) => rimMat.color.copy(accent).multiplyScalar(0.75 + Math.sin(t * 2) * 0.25));
  }

  const glow = glowSprite(accent, pet.epic ? 4.6 : 3.6, pet.epic ? 0.42 : 0.26);
  glow.scale.y *= 1.15;
  fx.add(glow);
  if (pet.epic) {
    epicFx(b, fx, pet.glow);
    epicPlus(b, fx, spinner, pet, glow, fp);
  } else {
    swarm(b, fx, 14, accent.clone().lerp(new THREE.Color('#ffffff'), 0.4), 0.07, (s, t, o) => {
      const a = s[0] * TAU + t * 0.12;
      o[0] = Math.cos(a) * (1.1 + s[1] * 0.4);
      o[1] = PED_TOP + 0.3 + s[2] * 2.2 + Math.sin(t * 0.5 + s[3] * 6) * 0.15;
      o[2] = Math.sin(a) * (1.1 + s[1] * 0.4);
      o[3] = 0.3 + 0.3 * Math.sin(t * 1.5 + s[3] * 6);
    });
  }

  return {
    root,
    spinner,
    model,
    fx,
    pet,
    update(t) {
      const tt = b.warp ? b.warp(t) : t;
      for (const fn of b.updaters) fn(tt, t);
    },
    dispose() {
      b.disposables.forEach((d) => d.dispose && d.dispose());
      root.traverse((o) => {
        if (o.material && !b.disposables.includes(o.material) && !o.material.map?.isCanvasTexture) o.material.dispose?.();
      });
    },
  };
}
