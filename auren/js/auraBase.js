// Grundbausteine der Auras (Figur, Texturen, kreisende Dinge, Bodenkreise) und die erste Fassung
// createAura. Die Seiten nutzen die überarbeitete Fassung in auraFactory.js, die hierauf aufbaut.
//
// Baut eine Aura samt Roblox-Figur (R6) in 3D. Alles wird in Studs gebaut und dann verkleinert.
// Die Teilchen rechnen ihre Position allein aus der Zeit aus; dadurch brauchen sie keinen Zustand.
//
// createAura(aura, { amount }) → { root, spinner, aura, update(t), dispose() }
// POINT_SCALE.value muss vor dem Rendern auf (Höhe des Viewports in Pixeln / 2) stehen.

import * as THREE from 'three';

const TAU = Math.PI * 2;
export const POINT_SCALE = { value: 300 };
export const FIGURE_SCALE = 0.42;
// Teilchengröße passend zum Viewport (Pixelhöhe inklusive Pixelverhältnis)
export function setPointScale(heightPx, camera) {
  POINT_SCALE.value = (heightPx * 0.5) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
}

export function rng(seed) {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
export const hash = (str) => [...str].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 2147483647, 7);

// ── Teilchen-Texturen ──
const texCache = {};
export function canvasTex(key, draw, size = 64) {
  if (texCache[key]) return texCache[key];
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  draw(g, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return (texCache[key] = t);
}
export function star(g, cx, cy, r1, r2, n) {
  g.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * TAU - Math.PI / 2, r = i % 2 ? r2 : r1;
    g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  g.closePath();
}
export const TEX = {
  dot: (g, s) => {
    const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    r.addColorStop(0, '#fff');
    r.addColorStop(0.3, 'rgba(255,255,255,.7)');
    r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r;
    g.fillRect(0, 0, s, s);
  },
  star: (g, s) => {
    TEX.dot(g, s);
    g.fillStyle = '#fff';
    star(g, s / 2, s / 2, s * 0.48, s * 0.1, 4);
    g.fill();
  },
  flake: (g, s) => {
    g.strokeStyle = '#fff';
    g.lineWidth = s * 0.07;
    g.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI;
      g.beginPath();
      g.moveTo(s / 2 - Math.cos(a) * s * 0.42, s / 2 - Math.sin(a) * s * 0.42);
      g.lineTo(s / 2 + Math.cos(a) * s * 0.42, s / 2 + Math.sin(a) * s * 0.42);
      g.stroke();
    }
  },
  bubble: (g, s) => {
    g.strokeStyle = '#fff';
    g.lineWidth = s * 0.06;
    g.beginPath();
    g.arc(s / 2, s / 2, s * 0.4, 0, TAU);
    g.stroke();
    g.fillStyle = 'rgba(255,255,255,.25)';
    g.fill();
    g.fillStyle = '#fff';
    g.beginPath();
    g.arc(s * 0.38, s * 0.36, s * 0.08, 0, TAU);
    g.fill();
  },
  square: (g, s) => {
    g.fillStyle = '#fff';
    g.fillRect(s * 0.2, s * 0.2, s * 0.6, s * 0.6);
  },
  heart: (g, s) => {
    g.fillStyle = '#fff';
    g.beginPath();
    g.moveTo(s / 2, s * 0.85);
    g.bezierCurveTo(s * 0.05, s * 0.5, s * 0.15, s * 0.1, s / 2, s * 0.32);
    g.bezierCurveTo(s * 0.85, s * 0.1, s * 0.95, s * 0.5, s / 2, s * 0.85);
    g.fill();
  },
  leaf: (g, s) => {
    g.fillStyle = '#fff';
    g.beginPath();
    g.ellipse(s / 2, s / 2, s * 0.42, s * 0.2, -0.7, 0, TAU);
    g.fill();
    g.strokeStyle = 'rgba(0,0,0,.35)';
    g.lineWidth = s * 0.04;
    g.beginPath();
    g.moveTo(s * 0.22, s * 0.78);
    g.lineTo(s * 0.78, s * 0.22);
    g.stroke();
  },
  coin: (g, s) => {
    g.fillStyle = '#fff';
    g.beginPath();
    g.arc(s / 2, s / 2, s * 0.42, 0, TAU);
    g.fill();
    g.strokeStyle = 'rgba(0,0,0,.3)';
    g.lineWidth = s * 0.06;
    g.beginPath();
    g.arc(s / 2, s / 2, s * 0.3, 0, TAU);
    g.stroke();
  },
  note: (g, s) => {
    g.fillStyle = '#fff';
    g.beginPath();
    g.ellipse(s * 0.38, s * 0.72, s * 0.17, s * 0.12, -0.4, 0, TAU);
    g.fill();
    g.fillRect(s * 0.5, s * 0.14, s * 0.07, s * 0.6);
    g.fillRect(s * 0.5, s * 0.14, s * 0.26, s * 0.1);
  },
  glyph: (g, s) => {
    g.fillStyle = '#fff';
    g.font = `700 ${s * 0.8}px monospace`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('ᚠ', s / 2, s / 2);
  },
};
export const ADDITIVE = new Set(['dot', 'star', 'flake', 'bubble', 'glyph']);

const pointsVS = `
attribute float size; attribute float alpha; attribute vec3 color;
uniform float scale; varying vec3 vColor; varying float vAlpha;
void main(){ vColor = color; vAlpha = alpha; vec4 mv = modelViewMatrix * vec4(position,1.0);
gl_PointSize = size * scale / -mv.z; gl_Position = projectionMatrix * mv; }`;
const pointsFS = `
uniform sampler2D map; varying vec3 vColor; varying float vAlpha;
void main(){ vec4 c = texture2D(map, gl_PointCoord); if (c.a * vAlpha < 0.01) discard;
gl_FragColor = vec4(c.rgb * vColor, c.a * vAlpha); }`;

// Teilchen-Gruppe: pos(i, t, out) setzt Position (Studs) und gibt die Sichtbarkeit 0..1 zurück
function particles(n, look, texName, size, pos) {
  const geo = new THREE.BufferGeometry();
  const P = new Float32Array(n * 3), A = new Float32Array(n), C = new Float32Array(n * 3), S = new Float32Array(n);
  const cols = look.cols.map((c) => new THREE.Color(c));
  for (let i = 0; i < n; i++) {
    const c = cols[i % cols.length];
    C.set([c.r, c.g, c.b], i * 3);
    S[i] = size * 0.62 * (0.6 + ((i * 7919) % 100) / 125) * FIGURE_SCALE;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(P, 3));
  geo.setAttribute('alpha', new THREE.BufferAttribute(A, 1));
  geo.setAttribute('color', new THREE.BufferAttribute(C, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(S, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { map: { value: canvasTex(texName, TEX[texName] || TEX.dot) }, scale: POINT_SCALE },
    vertexShader: pointsVS,
    fragmentShader: pointsFS,
    transparent: true,
    depthWrite: false,
    blending: ADDITIVE.has(texName) ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  const v = new THREE.Vector3();
  pts.userData.update = (t) => {
    for (let i = 0; i < n; i++) {
      A[i] = pos(i, t, v);
      P[i * 3] = v.x;
      P[i * 3 + 1] = v.y;
      P[i * 3 + 2] = v.z;
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.alpha.needsUpdate = true;
  };
  return pts;
}

// Glühendes Material (wird von der Szene nicht beleuchtet)
export const glow = (color, opacity = 1, extra = {}) =>
  new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, depthWrite: opacity >= 1, blending: opacity < 1 ? THREE.AdditiveBlending : THREE.NormalBlending, ...extra });
const solid = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.2, ...extra });

// ── Figur ──
export function makeFigure(tint) {
  const g = new THREE.Group();
  const skin = '#f2c8a0', shirt = '#3d4f78', pants = '#2a2f40';
  const emissive = new THREE.Color(tint).multiplyScalar(0.12);
  const part = (w, h, d, color, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color, roughness: 0.5, emissive }));
    m.position.set(x, y, z);
    g.add(m);
    return m;
  };
  part(0.98, 2, 1, pants, -0.5, 1, 0);
  part(0.98, 2, 1, pants, 0.5, 1, 0);
  part(2, 2, 1, shirt, 0, 3, 0);
  part(1, 2, 1, skin, -1.5, 3, 0);
  part(1, 2, 1, skin, 1.5, 3, 0);
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 1.2, 20), new THREE.MeshStandardMaterial({ color: skin, roughness: 0.5, emissive }));
  head.position.y = 4.6;
  g.add(head);
  const ink = new THREE.MeshBasicMaterial({ color: '#141018' });
  for (const x of [-0.2, 0.2]) {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.04), ink);
    eye.position.set(x, 4.72, 0.62);
    g.add(eye);
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.035, 6, 16, Math.PI), ink);
  mouth.rotation.z = Math.PI;
  mouth.position.set(0, 4.45, 0.62);
  g.add(mouth);
  return g;
}

// ── Kreisende Dinge ──
export function orbitThing(kind, color, r) {
  const g = new THREE.Group();
  const add = (geo, mat, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    g.add(m);
    return m;
  };
  switch (kind) {
    case 'coin': {
      const c = add(new THREE.CylinderGeometry(0.45, 0.45, 0.1, 20), solid('#ffcf4a', { metalness: 0.9, roughness: 0.25, emissive: '#7a5200' }));
      c.rotation.x = Math.PI / 2;
      break;
    }
    case 'gem':
      add(new THREE.OctahedronGeometry(0.42), solid(color, { metalness: 0.1, roughness: 0.1, emissive: new THREE.Color(color).multiplyScalar(0.4), flatShading: true }));
      break;
    case 'diamond': {
      const d = add(new THREE.OctahedronGeometry(0.55), solid('#e8f8ff', { roughness: 0.05, metalness: 0.4, emissive: '#305068', flatShading: true }));
      d.scale.y = 1.4;
      break;
    }
    case 'crystal': {
      const d = add(new THREE.OctahedronGeometry(0.4), glow(color, 0.8));
      d.scale.y = 2;
      break;
    }
    case 'rock':
      add(new THREE.DodecahedronGeometry(0.5), solid(color, { roughness: 0.95, metalness: 0, flatShading: true }));
      break;
    case 'orb':
      add(new THREE.SphereGeometry(0.3, 16, 12), glow('#ffffff'));
      add(new THREE.SphereGeometry(0.55, 16, 12), glow(color, 0.45));
      break;
    case 'planet': {
      add(new THREE.SphereGeometry(0.45, 20, 14), solid(color, { emissive: new THREE.Color(color).multiplyScalar(0.3) }));
      if (r() < 0.5) {
        const ring = add(new THREE.TorusGeometry(0.75, 0.06, 6, 30), glow(color, 0.7));
        ring.rotation.x = 1.2;
      }
      break;
    }
    case 'moon':
      add(new THREE.SphereGeometry(0.8, 24, 16), solid('#dfe4ee', { roughness: 0.9, emissive: '#303848' }));
      add(new THREE.SphereGeometry(1.15, 20, 14), glow('#9ab0d0', 0.25));
      break;
    case 'star': {
      const s = add(new THREE.OctahedronGeometry(0.35), glow('#ffffff'));
      s.scale.set(1, 1, 0.3);
      add(new THREE.SphereGeometry(0.6, 12, 10), glow(color, 0.3));
      break;
    }
    case 'hole': {
      add(new THREE.SphereGeometry(0.9, 24, 16), new THREE.MeshBasicMaterial({ color: '#000000' }));
      const disk = add(new THREE.RingGeometry(1.05, 2.1, 48), glow('#ffb060', 0.8, { side: THREE.DoubleSide }));
      disk.rotation.x = Math.PI / 2 - 0.35;
      add(new THREE.SphereGeometry(1.2, 20, 14), glow('#b49cff', 0.35));
      break;
    }
    case 'book': {
      add(new THREE.BoxGeometry(0.8, 1, 0.24), solid(color, { emissive: new THREE.Color(color).multiplyScalar(0.25) }));
      add(new THREE.BoxGeometry(0.72, 0.92, 0.26), solid('#f4ead0'), 0.05, 0, 0);
      break;
    }
    case 'cube':
      add(new THREE.BoxGeometry(0.5, 0.5, 0.5), glow(color, 0.85));
      break;
    case 'disco':
      add(new THREE.IcosahedronGeometry(1, 1), solid('#d8dce8', { metalness: 1, roughness: 0.15, flatShading: true, emissive: '#2a2a40' }));
      add(new THREE.CylinderGeometry(0.03, 0.03, 2), glow('#cccccc'), 0, 1.6, 0);
      break;
    case 'cat': {
      const fur = solid(color, { metalness: 0 });
      add(new THREE.BoxGeometry(0.5, 0.45, 0.9), fur, 0, 0, 0);
      add(new THREE.BoxGeometry(0.5, 0.45, 0.45), fur, 0, 0.3, 0.5);
      for (const x of [-0.15, 0.15]) add(new THREE.ConeGeometry(0.1, 0.2, 4), fur, x, 0.6, 0.5);
      for (const x of [-0.18, 0.18]) for (const z of [-0.3, 0.3]) add(new THREE.BoxGeometry(0.14, 0.3, 0.14), fur, x, -0.3, z);
      break;
    }
    default:
      add(new THREE.SphereGeometry(0.35, 12, 10), glow(color));
  }
  return g;
}

// ── Bodenkreise ──
export function ringTexture(kind, cols) {
  return canvasTex(`ring-${kind}-${cols.join()}`, (g, s) => {
    const c = s / 2;
    g.translate(c, c);
    g.strokeStyle = cols[0];
    g.fillStyle = cols[0];
    g.shadowColor = cols[0];
    g.shadowBlur = s * 0.03;
    if (kind === 'rune') {
      g.lineWidth = s * 0.012;
      for (const r of [0.46, 0.4, 0.22]) {
        g.beginPath();
        g.arc(0, 0, s * r, 0, TAU);
        g.stroke();
      }
      g.beginPath();
      star(g, 0, 0, s * 0.4, s * 0.4, 3);
      g.stroke();
      g.rotate(Math.PI);
      g.beginPath();
      star(g, 0, 0, s * 0.4, s * 0.4, 3);
      g.stroke();
      g.font = `700 ${s * 0.045}px monospace`;
      g.textAlign = 'center';
      g.fillStyle = cols[1] || cols[0];
      const runes = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ';
      for (let i = 0; i < 24; i++) {
        g.save();
        g.rotate((i / 24) * TAU);
        g.fillText(runes[i], 0, -s * 0.418);
        g.restore();
      }
    } else if (kind === 'hex') {
      g.lineWidth = s * 0.015;
      for (const r of [0.46, 0.3]) {
        g.beginPath();
        for (let i = 0; i <= 6; i++) g.lineTo(Math.cos((i / 6) * TAU) * s * r, Math.sin((i / 6) * TAU) * s * r);
        g.stroke();
      }
      for (let i = 0; i < 6; i++) {
        g.beginPath();
        g.moveTo(Math.cos((i / 6) * TAU) * s * 0.3, Math.sin((i / 6) * TAU) * s * 0.3);
        g.lineTo(Math.cos((i / 6) * TAU) * s * 0.46, Math.sin((i / 6) * TAU) * s * 0.46);
        g.stroke();
      }
    } else {
      const grd = g.createRadialGradient(0, 0, s * 0.3, 0, 0, s * 0.5);
      grd.addColorStop(0, 'rgba(0,0,0,0)');
      grd.addColorStop(0.7, cols[0]);
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grd;
      g.beginPath();
      g.arc(0, 0, s * 0.5, 0, TAU);
      g.fill();
    }
  }, 512);
}

// Senkrechter Verlauf (unten hell, oben weg) für Säulen und Lichtbänder
export const fadeTex = () => canvasTex('fade', (g, s) => {
  const grd = g.createLinearGradient(0, s, 0, 0);
  grd.addColorStop(0, 'rgba(255,255,255,0)');
  grd.addColorStop(0.12, 'rgba(255,255,255,.9)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, s, s);
});
const wingTex = (cols) => canvasTex('wing' + cols.join(), (g, s) => {
  // Flügel aus fünf Federn, Ansatz links unten
  for (let i = 0; i < 5; i++) {
    const a = -0.15 - i * 0.28, len = s * (0.95 - i * 0.12);
    g.save();
    g.translate(s * 0.05, s * 0.85);
    g.rotate(a);
    const grd = g.createLinearGradient(0, 0, len, 0);
    grd.addColorStop(0, cols[0]);
    grd.addColorStop(1, (cols[1] || cols[0]) + '00');
    g.fillStyle = grd;
    g.beginPath();
    g.ellipse(len / 2, 0, len / 2, s * 0.07, 0, 0, TAU);
    g.fill();
    g.restore();
  }
}, 256);

// ── Aura bauen ──
export function createAura(aura, { amount = 1 } = {}) {
  const look = aura.look;
  const r = rng(hash(aura.id));
  const root = new THREE.Group();
  root.name = 'Aura-' + aura.id;
  const spinner = new THREE.Group();
  const studs = new THREE.Group();
  studs.scale.setScalar(FIGURE_SCALE);
  studs.position.y = -1.45;
  root.add(spinner);
  spinner.add(studs);
  const figure = makeFigure(look.cols[0]);
  studs.add(figure);
  const updates = [];
  const cols = look.cols;
  const col = (i) => cols[i % cols.length];
  const N = (n) => Math.max(4, Math.round(n * amount));
  const tex = look.tex || 'dot';
  const seeds = (n) => Array.from({ length: n }, () => [r(), r(), r(), r()]);

  // Aufsteigen
  if (look.rise) {
    const n = N(look.rise.n), sd = seeds(n), sp = look.rise.speed;
    studs.add(particles(n, look, tex, 0.9, (i, t, v) => {
      const [a, b, c, d] = sd[i];
      const u = (t * sp * (0.12 + d * 0.1) + a) % 1;
      const ang = b * TAU + u * 1.2, rad = 1.3 + c * 1.1;
      v.set(Math.cos(ang) * rad, u * 7, Math.sin(ang) * rad);
      return Math.sin(Math.PI * u);
    }));
  }
  // Fallen
  if (look.fall) {
    const n = N(look.fall.n), sd = seeds(n);
    studs.add(particles(n, look, tex, 0.8, (i, t, v) => {
      const [a, b, c, d] = sd[i];
      const u = (t * (0.18 + d * 0.12) + a) % 1;
      const ang = b * TAU + Math.sin(t + a * 9) * 0.3, rad = 0.5 + Math.sqrt(c) * 2.8;
      v.set(Math.cos(ang) * rad, 9 - u * 9, Math.sin(ang) * rad);
      return Math.min(1, (1 - u) * 4) * Math.min(1, u * 6);
    }));
  }
  // Spirale
  if (look.swirl) {
    const n = N(look.swirl.n), sd = seeds(n), H = look.swirl.low ? 2.6 : 6.6;
    studs.add(particles(n, look, tex, look.swirl.n > 120 ? 0.6 : 0.75, (i, t, v) => {
      const [a, b, c, d] = sd[i];
      const u = (t * (0.08 + d * 0.06) + a) % 1;
      const ang = b * TAU + t * (1.4 + c) + u * 5, rad = 1.7 + c * 0.9 + Math.sin(u * 8 + a * 6) * 0.25;
      v.set(Math.cos(ang) * rad, 0.2 + u * H, Math.sin(ang) * rad);
      return Math.sin(Math.PI * u);
    }));
  }
  // Feuerwerk
  if (look.burst) {
    const n = N(120), sd = seeds(n), B = 4;
    const centers = Array.from({ length: B }, () => [(r() - 0.5) * 4, 7.5 + r() * 2, (r() - 0.5) * 3, r()]);
    studs.add(particles(n, look, 'star', 0.8, (i, t, v) => {
      const [a, b] = sd[i];
      const k = i % B, cc = centers[k];
      const u = (t * 0.5 + cc[3]) % 1;
      const th = a * TAU, ph = Math.acos(2 * b - 1), sp = 2.6 * (1 - Math.pow(1 - u, 3));
      v.set(cc[0] + Math.sin(ph) * Math.cos(th) * sp, cc[1] + Math.cos(ph) * sp - u * u * 2, cc[2] + Math.sin(ph) * Math.sin(th) * sp);
      return u < 0.08 ? 0 : 1 - u;
    }));
  }
  // Kreisende Dinge
  if (look.orbit) {
    const { kind, n } = look.orbit;
    const single = n === 1 && ['hole', 'disco', 'moon'].includes(kind);
    for (let i = 0; i < n; i++) {
      const thing = orbitThing(kind, col(i), r);
      studs.add(thing);
      const ph = (i / n) * TAU, tilt = (r() - 0.5) * 0.6;
      if (single && kind !== 'moon') {
        updates.push((t) => {
          thing.position.set(0, 8 + Math.sin(t * 1.3) * 0.2, 0);
          thing.rotation.y = t * (kind === 'disco' ? 1.2 : 0.6);
        });
      } else {
        const rad = single ? 3.4 : kind === 'cat' ? 2.8 : 2.5 + (i % 2) * 0.3, y0 = single ? 5.4 : kind === 'cat' ? 0.5 : 3.3, sp = kind === 'cat' ? 0.9 : kind === 'rock' ? 0.5 : 0.8;
        updates.push((t) => {
          const a = ph + t * sp;
          thing.position.set(Math.cos(a) * rad, y0 + Math.sin(a * 2 + ph) * (kind === 'cat' ? 0.05 : 0.5) + Math.sin(a) * tilt * 3, Math.sin(a) * rad);
          if (kind === 'cat') thing.rotation.y = -a;
          else if (kind === 'coin') thing.rotation.y = t * 3 + ph;
          else {
            thing.rotation.y = t * 1.5 + ph;
            thing.rotation.x = Math.sin(t + ph) * 0.4;
          }
        });
      }
    }
  }
  // Bodenkreis
  if (look.ring) {
    if (look.ring === 'flame') {
      const flames = [];
      const n = 16;
      for (let i = 0; i < n; i++) {
        const f = new THREE.Mesh(new THREE.ConeGeometry(0.28, 1.2, 6), glow(col(i), 0.75));
        const a = (i / n) * TAU;
        f.position.set(Math.cos(a) * 2.3, 0.6, Math.sin(a) * 2.3);
        studs.add(f);
        flames.push(f);
      }
      updates.push((t) => flames.forEach((f, i) => {
        const k = 0.7 + Math.sin(t * 9 + i * 2.1) * 0.25 + Math.sin(t * 13 + i) * 0.1;
        f.scale.set(1, k, 1);
        f.position.y = 0.6 * k;
      }));
    }
    const disk = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 6.4), new THREE.MeshBasicMaterial({ map: ringTexture(look.ring === 'flame' ? 'ring' : look.ring, cols), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    disk.rotation.x = -Math.PI / 2;
    disk.position.y = 0.06;
    studs.add(disk);
    updates.push((t) => {
      disk.rotation.z = t * 0.4;
      disk.material.opacity = 0.75 + Math.sin(t * 2) * 0.25;
    });
  }
  // Heiligenschein
  if (look.halo) {
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.09, 8, 40), glow('#fff2b0'));
    const haze = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.28, 8, 40), glow(cols[0], 0.35));
    halo.add(haze);
    halo.rotation.x = Math.PI / 2;
    studs.add(halo);
    updates.push((t) => (halo.position.y = 5.9 + Math.sin(t * 2) * 0.12));
  }
  // Krone
  if (look.crown) {
    const crown = new THREE.Group();
    const gold = solid('#ffcf4a', { metalness: 0.9, roughness: 0.2, emissive: '#5a3a00' });
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.7, 0.4, 20, 1, true), gold);
    band.material.side = THREE.DoubleSide;
    crown.add(band);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      const sp = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.5, 4), gold);
      sp.position.set(Math.cos(a) * 0.72, 0.42, Math.sin(a) * 0.72);
      crown.add(sp);
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.1), glow(col(i + 1)));
      gem.position.set(Math.cos(a) * 0.76, 0.02, Math.sin(a) * 0.76);
      crown.add(gem);
    }
    studs.add(crown);
    updates.push((t) => {
      crown.position.y = 6 + Math.sin(t * 1.6) * 0.15 + (look.halo ? 0.6 : 0);
      crown.rotation.y = t * 0.6;
    });
  }
  // Flügel
  if (look.wings) {
    const mat = new THREE.MeshBasicMaterial({ map: wingTex(cols), transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
    const wings = [-1, 1].map((sx) => {
      const pivot = new THREE.Group();
      pivot.position.set(0, 3.6, -0.6);
      const w = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 4.2), mat);
      w.position.set(sx * 2.05, 0.9, 0);
      w.scale.x = -sx;
      pivot.add(w);
      studs.add(pivot);
      return [pivot, sx];
    });
    updates.push((t) => wings.forEach(([p, sx]) => (p.rotation.y = sx * (0.35 + Math.sin(t * 2.4) * 0.25))));
  }
  // Lichtsäule
  if (look.pillar) {
    const pil = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 11, 32, 1, true), new THREE.MeshBasicMaterial({ color: cols[0], map: fadeTex(), transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
    pil.position.y = 5.5;
    studs.add(pil);
    updates.push((t) => (pil.material.opacity = 0.35 + Math.sin(t * 3) * 0.12));
  }
  // Hülle
  if (look.shell) {
    const sh = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 20), new THREE.MeshBasicMaterial({ color: cols[0], transparent: true, opacity: 0.18, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide }));
    sh.scale.set(2.3, 3.4, 2.3);
    sh.position.y = 2.7;
    studs.add(sh);
    updates.push((t) => {
      const k = 1 + Math.sin(t * 2.2) * 0.04;
      sh.scale.set(2.3 * k, 3.4 * k, 2.3 * k);
      sh.material.opacity = 0.16 + Math.sin(t * 2.2) * 0.05;
    });
  }
  // Lichtbänder (Nordlicht, Regenbogen, Strahlen)
  if (look.beams) {
    const n = Math.min(cols.length * 2, 8);
    const bands = [];
    for (let i = 0; i < n; i++) {
      const b = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 8), new THREE.MeshBasicMaterial({ color: col(i), map: fadeTex(), transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
      studs.add(b);
      bands.push(b);
    }
    updates.push((t) => bands.forEach((b, i) => {
      const a = (i / n) * TAU + t * 0.35;
      b.position.set(Math.cos(a) * 2.6, 4 + Math.sin(t * 1.5 + i) * 0.4, Math.sin(a) * 2.6);
      b.rotation.y = -a + Math.PI / 2;
      b.material.opacity = 0.35 + Math.sin(t * 2 + i * 1.7) * 0.2;
    }));
  }
  // Blitze: Ketten aus dünnen Balken, die ständig neu springen
  if (look.bolts) {
    const segs = [];
    const mats = cols.map((c) => glow(c));
    const geo = new THREE.BoxGeometry(0.12, 0.12, 1);
    for (let b = 0; b < 3; b++) for (let s = 0; s < 6; s++) {
      const m = new THREE.Mesh(geo, mats[b % mats.length]);
      studs.add(m);
      segs.push(m);
    }
    const a = new THREE.Vector3(), c = new THREE.Vector3();
    let last = -1;
    updates.push((t) => {
      const slot = Math.floor(t * 12);
      if (slot === last) return;
      last = slot;
      const rr = rng(slot * 97 + 13);
      for (let b = 0; b < 3; b++) {
        const ang = rr() * TAU;
        a.set(Math.cos(ang) * 1.6, 1 + rr() * 4, Math.sin(ang) * 1.6);
        const end = new THREE.Vector3(Math.cos(ang + 1.5) * 2.4, 1 + rr() * 5, Math.sin(ang + 1.5) * 2.4);
        for (let s = 0; s < 6; s++) {
          const k = (s + 1) / 6;
          c.lerpVectors(a, end, k);
          if (s < 5) c.add(new THREE.Vector3((rr() - 0.5) * 0.9, (rr() - 0.5) * 0.9, (rr() - 0.5) * 0.9));
          const m = segs[b * 6 + s];
          m.position.lerpVectors(a, c, 0.5);
          m.scale.z = a.distanceTo(c);
          m.lookAt(studs.localToWorld(c.clone()));
          m.visible = rr() > 0.15;
          a.copy(c);
        }
      }
    });
  }
  // Glitch: farbige Doppelgänger und Zucken
  if (look.glitch) {
    const ghosts = [cols[0], cols[1] || '#20f0ff'].map((c) => {
      const gh = figure.clone();
      const m = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending });
      gh.traverse((o) => o.isMesh && (o.material = m));
      studs.add(gh);
      return gh;
    });
    updates.push((t) => {
      const slot = Math.floor(t * 10), rr = rng(slot * 31 + 7);
      const on = rr() < 0.45;
      ghosts.forEach((g, i) => {
        g.visible = on;
        g.position.set((i ? 1 : -1) * (0.15 + rr() * 0.35), (rr() - 0.5) * 0.2, 0);
      });
      figure.position.x = rr() < 0.15 ? (rr() - 0.5) * 0.6 : 0;
    });
  }
  // Partikel aktualisieren
  studs.traverse((o) => o.userData.update && updates.push(o.userData.update));

  return {
    root,
    spinner,
    aura,
    update(t) {
      for (const u of updates) u(t);
    },
    dispose() {
      root.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) [].concat(o.material).forEach((m) => m.dispose());
      });
    },
  };
}
