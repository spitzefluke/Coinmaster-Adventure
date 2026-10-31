// Gemeinsame 3D-Bausteine für alle Haustiere.
import * as THREE from 'three';
export { THREE };

export const TAU = Math.PI * 2;

export function seeded(seed) {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
export function hashStr(str) {
  let h = 7;
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) % 2147483647;
  return h;
}
export const lighten = (c, k) => '#' + new THREE.Color(c).lerp(new THREE.Color('#ffffff'), k).getHexString();
export const darken = (c, k) => '#' + new THREE.Color(c).multiplyScalar(1 - k).getHexString();

// ── Effekt-Texturen (wie in muenzen/js/coinFactory.js) ───────────────────────

const shared = {};
function canvasTexture(key, size, draw) {
  if (shared[key]) return shared[key];
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  draw(cv.getContext('2d'), size);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return (shared[key] = t);
}

export const glowTexture = () =>
  canvasTexture('glow', 256, (ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.25, 'rgba(255,255,255,0.55)');
    g.addColorStop(0.55, 'rgba(255,255,255,0.15)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  });

export const sparkTexture = () =>
  canvasTexture('spark', 64, (ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.2, 'rgba(255,255,255,0.8)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillRect(s / 2 - 1, 2, 2, s - 4);
    ctx.fillRect(2, s / 2 - 1, s - 4, 2);
  });

export const raysTexture = () =>
  canvasTexture('rays', 512, (ctx, s) => {
    const c = s / 2;
    ctx.translate(c, c);
    for (let i = 0; i < 24; i++) {
      ctx.rotate(TAU / 24);
      const len = c * (i % 2 ? 0.75 : 1);
      const g = ctx.createLinearGradient(0, 0, len, 0);
      g.addColorStop(0, 'rgba(255,255,255,0.9)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(len, -c * 0.045);
      ctx.lineTo(len, c * 0.045);
      ctx.closePath();
      ctx.fill();
    }
  });

// Feine Haarsträhnen als Helligkeitsvariation (multipliziert die Fellfarbe)
export const furAlbedo = () =>
  canvasTexture('furAlb', 256, (ctx, s) => {
    const r = seeded(4711);
    ctx.fillStyle = '#ececec';
    ctx.fillRect(0, 0, s, s);
    ctx.lineCap = 'round';
    for (let i = 0; i < 5200; i++) {
      const x = r() * s, y = r() * s, a = Math.PI / 2 + (r() - 0.5) * 0.5, l = 3 + r() * 8, v = 175 + r() * 80;
      ctx.strokeStyle = `rgb(${v},${v},${v})`;
      ctx.lineWidth = 0.6 + r() * 0.9;
      for (const dx of [-s, 0, s])
        for (const dy of [-s, 0, s]) {
          ctx.beginPath();
          ctx.moveTo(x + dx, y + dy);
          ctx.lineTo(x + dx + Math.cos(a) * l, y + dy + Math.sin(a) * l);
          ctx.stroke();
        }
    }
  });

export const shadowTexture = () =>
  canvasTexture('shadow', 128, (ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(0,0,0,0.85)');
    g.addColorStop(0.45, 'rgba(0,0,0,0.5)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  });

export const runeTexture = () =>
  canvasTexture('rune', 512, (ctx, s) => {
    const c = s / 2, r = seeded(99);
    ctx.translate(c, c);
    ctx.strokeStyle = '#fff';
    ctx.fillStyle = '#fff';
    for (const [rad, w] of [[0.97, 3], [0.9, 1.5], [0.66, 2.5], [0.6, 1]]) {
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.arc(0, 0, c * rad, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < 36; i++) {
      ctx.save();
      ctx.rotate((i / 36) * TAU);
      ctx.translate(0, -c * 0.78);
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let k = 0; k < 3; k++) {
        const x0 = (r() - 0.5) * 18, y0 = (r() - 0.5) * 22;
        k ? ctx.lineTo(x0, y0) : ctx.moveTo(x0, y0);
      }
      ctx.stroke();
      ctx.restore();
    }
    ctx.lineWidth = 2;
    for (let k = 0; k < 2; k++) {
      ctx.beginPath();
      for (let i = 0; i <= 6; i++) {
        const a = (i / 6) * TAU + k * (TAU / 12);
        i ? ctx.lineTo(Math.cos(a) * c * 0.6, Math.sin(a) * c * 0.6) : ctx.moveTo(Math.cos(a) * c * 0.6, Math.sin(a) * c * 0.6);
      }
      ctx.stroke();
    }
  });

// Fresnel-Randlicht in eine Physical-Material-Instanz einspeisen
export function addRim(m, color, k = 0.4, p = 2.6) {
  if (!m || !m.isMeshPhysicalMaterial || m.userData.rim) return;
  m.userData.rim = { c: new THREE.Color(color), k };
  m.onBeforeCompile = (sh) => {
    sh.uniforms.rimC = { value: m.userData.rim.c };
    sh.uniforms.rimK = { value: k };
    m.userData.rim.u = sh.uniforms.rimK;
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 rimC; uniform float rimK;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>\n{ float rf = pow(1.0 - saturate(abs(dot(normalize(vViewPosition), normal))), ${p.toFixed(2)}); totalEmissiveRadiance += rimC * rimK * rf; }`);
  };
  m.customProgramCacheKey = () => 'rim' + p.toFixed(2);
  m.needsUpdate = true;
}

export function glowSprite(color, scale, opacity = 0.75) {
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: glowTexture(), color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  s.scale.setScalar(scale);
  s.renderOrder = -1;
  s.userData.nofit = true;
  return s;
}

export function particles(count, color, size, texture = sparkTexture()) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 3).fill(1), 3));
  const mat = new THREE.PointsMaterial({ size, map: texture, color, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const p = new THREE.Points(geo, mat);
  p.userData.nofit = true;
  p.frustumCulled = false;
  return p;
}

export function wingShape() {
  const s = new THREE.Shape();
  s.moveTo(0, 0.3);
  s.bezierCurveTo(0.35, 0.75, 1.05, 0.95, 1.55, 0.78);
  s.bezierCurveTo(1.4, 0.62, 1.48, 0.5, 1.3, 0.42);
  s.bezierCurveTo(1.42, 0.28, 1.3, 0.14, 1.12, 0.12);
  s.bezierCurveTo(1.18, -0.04, 1.02, -0.16, 0.86, -0.1);
  s.bezierCurveTo(0.86, -0.28, 0.66, -0.36, 0.52, -0.24);
  s.bezierCurveTo(0.42, -0.4, 0.18, -0.36, 0.08, -0.18);
  s.lineTo(0, 0.3);
  return s;
}

// ── Bühne ────────────────────────────────────────────────────────────────────
// Ersatz für RoomEnvironment: heller Raum mit Lichtflächen, als Umgebungslicht vorberechnet.
export function makeEnvironment(renderer) {
  const scene = new THREE.Scene();
  const box = new THREE.BoxGeometry();
  const room = new THREE.Mesh(box, new THREE.MeshBasicMaterial({ color: new THREE.Color(0.16, 0.15, 0.18), side: THREE.BackSide }));
  room.scale.set(14, 9, 14);
  room.position.y = 2;
  scene.add(room);
  const panel = (x, y, z, sx, sy, sz, k, tint = '#ffffff') => {
    const m = new THREE.Mesh(box, new THREE.MeshBasicMaterial({ color: new THREE.Color(tint).multiplyScalar(k) }));
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    scene.add(m);
  };
  panel(0, 6.3, 0, 6, 0.1, 6, 4.5);
  panel(-6.8, 2.6, 1.5, 0.1, 3.5, 4.5, 3, '#fff0dc');
  panel(6.8, 2, -1, 0.1, 2.8, 3.5, 2.2, '#dbe4ff');
  panel(0, 2.2, 6.8, 5, 2.6, 0.1, 2);
  panel(2, 1.2, -6.8, 3, 1.6, 0.1, 1.1);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(scene, 0.04).texture;
  pmrem.dispose();
  return env;
}

export function makeScene(env) {
  const scene = new THREE.Scene();
  scene.environment = env;
  const key = new THREE.DirectionalLight('#fff1dc', 2.4);
  key.position.set(2.5, 3.5, 4);
  const rim = new THREE.DirectionalLight('#9fb4ff', 1.6);
  rim.position.set(-3, 1.5, -3.5);
  const top = new THREE.DirectionalLight('#ffffff', 0.6);
  top.position.set(0, 6, 0.5);
  scene.add(key, rim, top, new THREE.HemisphereLight('#e4ecff', '#3a2c26', 0.4), new THREE.AmbientLight('#ffffff', 0.1));
  return scene;
}

// ── Oberflächen (kachelbare Normal-Maps) ─────────────────────────────────────

function wrap(ctx, S, fn) {
  for (const dx of [-S, 0, S])
    for (const dy of [-S, 0, S]) {
      ctx.save();
      ctx.translate(dx, dy);
      fn();
      ctx.restore();
    }
}
const grayc = (v) => {
  const n = Math.round(Math.min(255, Math.max(0, v)));
  return `rgb(${n},${n},${n})`;
};

const SURF = {
  fur(ctx, S, r) {
    ctx.lineCap = 'round';
    for (let i = 0; i < 4200; i++) {
      const x = r() * S, y = r() * S, a = Math.PI / 2 + (r() - 0.5) * 0.6, l = 3 + r() * 8;
      ctx.strokeStyle = grayc(60 + r() * 170);
      ctx.lineWidth = 0.7 + r() * 1.1;
      wrap(ctx, S, () => {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
        ctx.stroke();
      });
    }
  },
  short(ctx, S, r) {
    for (let i = 0; i < 3500; i++) {
      const x = r() * S, y = r() * S, rad = 0.5 + r() * 1.4;
      ctx.fillStyle = grayc(90 + r() * 110);
      wrap(ctx, S, () => {
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, TAU);
        ctx.fill();
      });
    }
  },
  scales(ctx, S) {
    for (let row = -1; row <= S / 8 + 1; row++)
      for (let col = -1; col <= S / 16 + 1; col++) {
        const x = col * 16 + (((row % 2) + 2) % 2) * 8, y = row * 8;
        const g = ctx.createRadialGradient(x, y - 3, 1, x, y, 10);
        g.addColorStop(0, '#d8d8d8');
        g.addColorStop(0.75, '#7a7a7a');
        g.addColorStop(1, '#3a3a3a');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, 9.5, 0, TAU);
        ctx.fill();
      }
  },
  feather(ctx, S) {
    ctx.strokeStyle = grayc(205);
    ctx.lineWidth = 2.5;
    for (let row = -1, y = -16; y <= S + 16; row++, y += 16)
      for (let x = (((row % 2) + 2) % 2) * 16 - 32; x <= S + 32; x += 32) {
        ctx.beginPath();
        ctx.arc(x, y, 16, 0.15, Math.PI - 0.15);
        ctx.stroke();
      }
  },
  snow(ctx, S, r) {
    for (let i = 0; i < 900; i++) {
      const x = r() * S, y = r() * S, rad = 2 + r() * 6, v = 150 + r() * 90;
      wrap(ctx, S, () => {
        const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
        g.addColorStop(0, grayc(v));
        g.addColorStop(1, 'rgba(128,128,128,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      });
    }
  },
  stone(ctx, S, r) {
    for (let i = 0; i < 420; i++) {
      const x = r() * S, y = r() * S, rad = 4 + r() * 12;
      ctx.fillStyle = grayc(90 + r() * 90);
      wrap(ctx, S, () => {
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, TAU);
        ctx.fill();
      });
    }
    ctx.strokeStyle = grayc(30);
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 26; i++) {
      let x = r() * S, y = r() * S;
      const pts = [[x, y]];
      for (let k = 0; k < 5; k++) pts.push([(x += (r() - 0.5) * 50), (y += (r() - 0.5) * 50)]);
      wrap(ctx, S, () => {
        ctx.beginPath();
        pts.forEach(([a, b], j) => (j ? ctx.lineTo(a, b) : ctx.moveTo(a, b)));
        ctx.stroke();
      });
    }
  },
  panel(ctx, S, r) {
    ctx.fillStyle = grayc(40);
    for (let k = 0; k < S; k += 64) {
      ctx.fillRect(k, 0, 3, S);
      ctx.fillRect(0, k, S, 3);
    }
    ctx.fillStyle = grayc(220);
    for (let x = 0; x < S; x += 64)
      for (let y = 0; y < S; y += 64)
        for (const [dx, dy] of [[9, 9], [55, 9], [9, 55], [55, 55]]) {
          ctx.beginPath();
          ctx.arc(x + dx, y + dy, 2.4, 0, TAU);
          ctx.fill();
        }
    ctx.fillStyle = grayc(70);
    for (let i = 0; i < 14; i++) {
      const x = Math.floor(r() * 4) * 64 + 18, y = Math.floor(r() * 4) * 64 + 20;
      for (let k = 0; k < 4; k++) ctx.fillRect(x, y + k * 7, 28, 3);
    }
  },
};

function heightToNormal(cv, k) {
  const S = cv.width, ctx = cv.getContext('2d', { willReadFrequently: true });
  const src = ctx.getImageData(0, 0, S, S).data;
  const h = (x, y) => src[(((y + S) % S) * S + ((x + S) % S)) * 4] / 255;
  const out = ctx.createImageData(S, S), o = out.data;
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const dx = (h(x + 1, y - 1) + 2 * h(x + 1, y) + h(x + 1, y + 1) - h(x - 1, y - 1) - 2 * h(x - 1, y) - h(x - 1, y + 1)) * k;
      const dy = (h(x - 1, y + 1) + 2 * h(x, y + 1) + h(x + 1, y + 1) - h(x - 1, y - 1) - 2 * h(x, y - 1) - h(x + 1, y - 1)) * k;
      const inv = 1 / Math.hypot(dx, dy, 1), i = (y * S + x) * 4;
      o[i] = (-dx * inv * 0.5 + 0.5) * 255;
      o[i + 1] = (dy * inv * 0.5 + 0.5) * 255;
      o[i + 2] = (inv * 0.5 + 0.5) * 255;
      o[i + 3] = 255;
    }
  ctx.putImageData(out, 0, 0);
  return cv;
}

const surfCache = {};
export function surface(type) {
  if (surfCache[type]) return surfCache[type];
  const S = 256, cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = grayc(128);
  ctx.fillRect(0, 0, S, S);
  SURF[type](ctx, S, seeded(hashStr(type) + 11));
  const t = new THREE.CanvasTexture(heightToNormal(cv, type === 'fur' ? 1.6 : 2.2));
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 3);
  t.colorSpace = THREE.NoColorSpace;
  return (surfCache[type] = t);
}

// ── Builder ──────────────────────────────────────────────────────────────────

const UP = new THREE.Vector3(0, 1, 0), FWD = new THREE.Vector3(0, 0, 1);
const geoCache = {};
const unit = (key, make) => geoCache[key] || (geoCache[key] = make());
const SPHERE = () => unit('sphere', () => new THREE.SphereGeometry(1, 36, 26));
const v3 = (a) => (a.isVector3 ? a.clone() : new THREE.Vector3(a[0], a[1], a[2]));
export { v3 };

export class Builder {
  constructor(rnd, model, fx) {
    this.rnd = rnd;
    this.model = model;
    this.fx = fx;
    this.disposables = [];
    this.updaters = [];
    this.matCache = new Map();
  }
  track(o) {
    this.disposables.push(o);
    return o;
  }
  on(fn) {
    this.updaters.push(fn);
  }
  place(mesh, p, pos, s, rot) {
    if (pos) mesh.position.set(pos[0], pos[1], pos[2]);
    if (s !== undefined && s !== null) typeof s === 'number' ? mesh.scale.setScalar(s) : mesh.scale.set(s[0], s[1], s[2]);
    if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
    p.add(mesh);
    return mesh;
  }
  group(p, pos = [0, 0, 0], rot) {
    return this.place(new THREE.Group(), p, pos, null, rot);
  }

  // color + Optionen: rough, metal, coat, sheen, sheenColor, glow, ei, opacity, flat, double, irid, surf, ns, map, emap, add
  mat(color, o = {}) {
    const key = color + '|' + JSON.stringify(o, (k, v) => (v && v.isTexture ? v.uuid : v));
    if (this.matCache.has(key)) return this.matCache.get(key);
    const m = new THREE.MeshPhysicalMaterial({
      color,
      roughness: o.rough ?? 0.6,
      metalness: o.metal ?? 0,
      clearcoat: o.coat ?? 0,
      clearcoatRoughness: o.coatRough ?? 0.25,
      sheen: o.sheen ?? 0,
      sheenRoughness: 0.55,
      sheenColor: new THREE.Color(o.sheenColor ?? '#ffffff'),
      emissive: new THREE.Color(o.glow ?? '#000000'),
      emissiveIntensity: o.ei ?? 1,
      transparent: (o.opacity ?? 1) < 1 || !!o.add,
      opacity: o.opacity ?? 1,
      flatShading: !!o.flat,
      side: o.double ? THREE.DoubleSide : THREE.FrontSide,
      iridescence: o.irid ?? 0,
    });
    if (o.map) m.map = o.map;
    if (o.emap) m.emissiveMap = o.emap;
    if (o.surf) {
      m.normalMap = o.nrep ? this.track(surface(o.surf).clone()) : surface(o.surf);
      if (o.nrep) {
        m.normalMap.repeat.set(o.nrep[0], o.nrep[1]);
        m.normalMap.needsUpdate = true;
      }
      m.normalScale.set(o.ns ?? 0.7, o.ns ?? 0.7);
    }
    if (o.add) {
      m.blending = THREE.AdditiveBlending;
      m.depthWrite = false;
    }
    if (o.opacity < 1) m.depthWrite = o.depthWrite ?? true;
    this.matCache.set(key, this.track(m));
    return m;
  }
  basic(color, o = {}) {
    const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: o.opacity ?? 1, side: o.double ? THREE.DoubleSide : THREE.FrontSide, map: o.map ?? null });
    if (o.add !== false) {
      m.blending = THREE.AdditiveBlending;
      m.depthWrite = false;
    }
    return this.track(m);
  }

  ball(p, m, pos, s = 1, rot) {
    return this.place(new THREE.Mesh(SPHERE(), m), p, pos, s, rot);
  }
  // Glied zwischen zwei Punkten, Radius r0 → r1, mit Kugelkappen
  limb(p, m, a, c, r0, r1 = r0, caps = true) {
    const A = v3(a), B = v3(c), d = B.clone().sub(A), len = Math.max(1e-4, d.length());
    const mesh = new THREE.Mesh(this.track(new THREE.CylinderGeometry(r1, r0, len, 20, 1, true)), m);
    mesh.position.copy(A).add(B).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(UP, d.normalize());
    p.add(mesh);
    if (caps) {
      this.ball(p, m, [A.x, A.y, A.z], r0);
      this.ball(p, m, [B.x, B.y, B.z], r1);
    }
    return mesh;
  }
  // Kegel: Grundfläche am Ursprung, Spitze zeigt nach +y
  cone(p, m, pos, r, h, rot, s, segs = 24) {
    const g = this.track(new THREE.ConeGeometry(r, h, segs));
    g.translate(0, h / 2, 0);
    return this.place(new THREE.Mesh(g, m), p, pos, s, rot);
  }
  cyl(p, m, pos, rTop, rBot, h, rot, segs = 32, open = false) {
    return this.place(new THREE.Mesh(this.track(new THREE.CylinderGeometry(rTop, rBot, h, segs, 1, open)), m), p, pos, null, rot);
  }
  torus(p, m, pos, R, r, rot, arc = TAU, s) {
    return this.place(new THREE.Mesh(this.track(new THREE.TorusGeometry(R, r, 14, 64, arc)), m), p, pos, s, rot);
  }
  octa(p, m, pos, r, s, rot) {
    return this.place(new THREE.Mesh(unit('octa', () => new THREE.OctahedronGeometry(1, 0)), m), p, pos, s ?? r, rot);
  }
  rbox(p, m, pos, size, rad = 0.03, rot) {
    const [w, h, d] = size;
    rad = Math.min(rad, w / 2.2, h / 2.2, d / 2.2);
    const iw = w - 2 * rad, ih = h - 2 * rad, cr = Math.min(rad * 0.6, iw / 2.1, ih / 2.1);
    const s = new THREE.Shape();
    s.moveTo(-iw / 2 + cr, -ih / 2);
    s.lineTo(iw / 2 - cr, -ih / 2);
    s.quadraticCurveTo(iw / 2, -ih / 2, iw / 2, -ih / 2 + cr);
    s.lineTo(iw / 2, ih / 2 - cr);
    s.quadraticCurveTo(iw / 2, ih / 2, iw / 2 - cr, ih / 2);
    s.lineTo(-iw / 2 + cr, ih / 2);
    s.quadraticCurveTo(-iw / 2, ih / 2, -iw / 2, ih / 2 - cr);
    s.lineTo(-iw / 2, -ih / 2 + cr);
    s.quadraticCurveTo(-iw / 2, -ih / 2, -iw / 2 + cr, -ih / 2);
    const g = this.track(new THREE.ExtrudeGeometry(s, { depth: Math.max(1e-3, d - 2 * rad), bevelEnabled: true, bevelThickness: rad, bevelSize: rad, bevelSegments: 3, curveSegments: 4 }));
    g.translate(0, 0, -(d - 2 * rad) / 2);
    return this.place(new THREE.Mesh(g, m), p, pos, null, rot);
  }
  lathe(p, m, pts, pos, segs = 48, rot) {
    return this.place(new THREE.Mesh(this.track(new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), segs)), m), p, pos, null, rot);
  }
  extrude(p, m, shape, depth, pos, rot, s, bevel = 0.015) {
    const g = this.track(new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 16 }));
    g.translate(0, 0, -depth / 2);
    return this.place(new THREE.Mesh(g, m), p, pos, s, rot);
  }
  // Röhre entlang Punkten, Radius über profile(t) oder linear r0 → r1
  taper(p, m, pts, r0, r1 = r0, o = {}) {
    const curve = new THREE.CatmullRomCurve3(pts.map(v3));
    const n = o.seg ?? 48, rad = o.radial ?? 14;
    const g = this.track(new THREE.TubeGeometry(curve, n, 1, rad, false));
    const pos = g.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i <= n; i++) {
      const t = i / n, c = curve.getPointAt(t);
      const r = Math.max(0.002, o.profile ? o.profile(t) : r0 + (r1 - r0) * t);
      for (let j = 0; j <= rad; j++) {
        const k = i * (rad + 1) + j;
        v.fromBufferAttribute(pos, k).sub(c).multiplyScalar(r).add(c);
        pos.setXYZ(k, v.x, v.y, v.z);
      }
    }
    const mesh = new THREE.Mesh(g, m);
    p.add(mesh);
    if (o.caps !== false) {
      const a = curve.getPointAt(0), e = curve.getPointAt(1);
      const ra = o.profile ? o.profile(0) : r0, re = o.profile ? o.profile(1) : r1;
      if (ra > 0.004) this.ball(p, m, [a.x, a.y, a.z], ra);
      if (re > 0.004) this.ball(p, o.capMat ?? m, [e.x, e.y, e.z], re);
    }
    mesh.userData.curve = curve;
    return mesh;
  }
  // Auge: Augapfel, Iris, Pupille, Glanzpunkt. out = Blickrichtung
  eye(p, pos, r, iris = '#3a2a1a', out = [0, 0, 1], o = {}) {
    const g = this.group(p, pos);
    g.quaternion.setFromUnitVectors(FWD, v3(out).normalize());
    const white = this.mat(o.sclera ?? '#f7f3ee', { rough: 0.25, coat: 1 });
    const im = o.glow
      ? this.mat(iris, { rough: 0.2, coat: 1, glow: o.glow, ei: 1.6 })
      : this.mat(iris, { rough: 0.25, coat: 1 });
    const pm = this.mat(o.pupil ?? '#08070a', { rough: 0.15, coat: 1 });
    this.ball(g, white, [0, 0, 0], r);
    // Iris mit dunklem Limbusring und hellem Innenkranz
    this.ball(g, this.mat(darken(iris, 0.6), { rough: 0.3, coat: 1 }), [0, 0, r * 0.6], [r * 0.74, r * 0.74, r * 0.44]);
    this.ball(g, im, [0, 0, r * 0.6], [r * 0.66, r * 0.66, r * 0.47]);
    this.ball(g, o.glow ? im : this.mat(lighten(iris, 0.35), { rough: 0.25, coat: 1 }), [0, 0, r * 0.62], [r * 0.42, r * 0.42, r * 0.46]);
    if (!o.noPupil) this.ball(g, pm, [0, 0, r * 0.86], o.slit ? [r * 0.14, r * 0.5, r * 0.26] : o.wide ? [r * 0.5, r * 0.22, r * 0.26] : [r * 0.38, r * 0.38, r * 0.26]);
    this.ball(g, this.mat('#ffffff', { glow: '#ffffff', ei: 1.4 }), [r * 0.3, r * 0.34, r * 0.9], r * 0.15);
    this.ball(g, this.mat('#ffffff', { glow: '#ffffff', ei: 0.8 }), [-r * 0.24, -r * 0.28, r * 0.95], r * 0.06);
    // Hornhaut: klare Glanzschicht
    this.ball(g, this.mat('#ffffff', { rough: 0.02, coat: 1, coatRough: 0.02, opacity: 0.12, depthWrite: false }), [0, 0, r * 0.12], r * 1.0);
    if (o.lid) {
      this.ball(g, o.lid, [0, r * 0.56, -r * 0.02], [r * 1.1, r * 0.62, r * 1.07]);
      this.ball(g, o.lid, [0, -r * 0.62, -r * 0.08], [r * 1.06, r * 0.45, r * 1.0]);
    }
    return g;
  }
  ctex(w, h, draw, o = {}) {
    const cv = document.createElement('canvas');
    cv.width = w;
    cv.height = h;
    draw(cv.getContext('2d'), w, h);
    const t = this.track(new THREE.CanvasTexture(cv));
    t.colorSpace = o.linear ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    if (o.wrap) t.wrapS = t.wrapT = THREE.RepeatWrapping;
    if (o.repeat) t.repeat.set(o.repeat[0], o.repeat[1]);
    t.anisotropy = 4;
    return t;
  }
}
