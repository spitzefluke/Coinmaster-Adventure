// ── 3D-Baukasten, Version 2: weiche Kanten, Strukturen, Nähte, Schnallen, Münzen mit Rand, geschliffene Steine ──
// Lokale Koordinaten eines Rücken-Items: Ursprung = Mitte des Rückens, +z = vom Rücken weg, +y = oben.
// Der Oberkörper reicht von y -1 bis 1 und x -1 bis 1, die Brust liegt bei z = -1, der Boden bei y = -3.
const PI = Math.PI;
const GOLD = '#ffc93c', LEATHER = '#6e4426', DARK = '#2a2230', WHITE = '#fff6e0', BRASS = '#c9a45a', IRON = '#59606b';

function shade(hex, f) {
  const c = new THREE.Color(hex);
  if (f < 0) c.lerp(new THREE.Color('#000'), -f); else c.lerp(new THREE.Color('#fff'), f);
  return '#' + c.getHexString();
}
const WALK = { k: 0, phase: 0 }; // wird von der Vorschau beim Laufen gesetzt
const rnd = (() => { let s = 1; return { seed(v) { s = v * 9301 + 49297; }, next() { s = (s * 9301 + 49297) % 233280; return s / 233280; } }; })();

// ── Strukturen (Canvas, graustufig; die Materialfarbe färbt sie ein) ──
const TEX = {};
function texture(kind) {
  if (TEX[kind]) return TEX[kind];
  const S = 256, cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const g = cv.getContext('2d');
  const R = (() => { let s = kind.length * 7 + 3; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
  g.fillStyle = '#e8e8e8'; g.fillRect(0, 0, S, S);
  if (kind === 'cloth') {
    for (let y = 0; y < S; y += 4) for (let x = 0; x < S; x += 4) { const v = ((x / 4 + y / 4) % 2 ? 222 : 236) + R() * 14 - 7; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x, y, 4, 4); }
    g.globalAlpha = 0.08; for (let i = 0; i < 40; i++) { g.fillStyle = R() > 0.5 ? '#fff' : '#000'; g.fillRect(0, R() * S, S, 1); }
  } else if (kind === 'leather') {
    for (let i = 0; i < 2600; i++) { const v = 180 + R() * 70; g.fillStyle = `rgba(${v},${v},${v},0.35)`; g.beginPath(); g.arc(R() * S, R() * S, 1 + R() * 3, 0, 7); g.fill(); }
    g.globalAlpha = 0.12; g.strokeStyle = '#000'; for (let i = 0; i < 30; i++) { g.beginPath(); let x = R() * S, y = R() * S; g.moveTo(x, y); for (let j = 0; j < 4; j++) { x += R() * 30 - 15; y += R() * 30 - 15; g.lineTo(x, y); } g.stroke(); }
  } else if (kind === 'wood') {
    for (let x = 0; x < S; x++) { const v = 200 + Math.sin(x * 0.21 + Math.sin(x * 0.05) * 3) * 18 + R() * 8; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x, 0, 1, S); }
    g.fillStyle = 'rgba(0,0,0,0.35)'; for (let x = 0; x < S; x += 64) g.fillRect(x, 0, 2, S);
    g.globalAlpha = 0.25; for (let i = 0; i < 6; i++) { g.strokeStyle = '#000'; g.beginPath(); g.ellipse(R() * S, R() * S, 3 + R() * 4, 8 + R() * 10, 0, 0, 7); g.stroke(); }
  } else if (kind === 'stone') {
    for (let i = 0; i < 900; i++) { const v = 150 + R() * 100; g.fillStyle = `rgba(${v},${v},${v},0.4)`; g.beginPath(); g.arc(R() * S, R() * S, 2 + R() * 9, 0, 7); g.fill(); }
    g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 2; for (let i = 0; i < 8; i++) { g.beginPath(); let x = R() * S, y = R() * S; g.moveTo(x, y); for (let j = 0; j < 5; j++) { x += R() * 50 - 25; y += R() * 50 - 25; g.lineTo(x, y); } g.stroke(); }
  } else if (kind === 'brushed') {
    for (let y = 0; y < S; y++) { const v = 222 + R() * 30; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(0, y, S, 1); }
  } else if (kind === 'glow') {
    const gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.clearRect(0, 0, S, S); g.fillStyle = gr; g.fillRect(0, 0, S, S);
  }
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.encoding = THREE.sRGBEncoding;
  t.anisotropy = 4;
  return (TEX[kind] = t);
}

const MATS = new Map();
function mat(c, k) {
  const key = c + '|' + k;
  if (MATS.has(key)) return MATS.get(key);
  let m;
  const L = (x) => new THREE.Color(x).convertSRGBToLinear();
  const S = (o) => new THREE.MeshStandardMaterial(o);
  switch (k) {
    case 'neon': m = new THREE.MeshBasicMaterial({ color: L(shade(c, 0.25)) }); break;
    case 'neonT': m = new THREE.MeshBasicMaterial({ color: L(shade(c, 0.2)), transparent: true, opacity: 0.45, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }); break;
    case 'haze': m = new THREE.MeshBasicMaterial({ color: L(c), transparent: true, opacity: 0.12, depthWrite: false, blending: THREE.AdditiveBlending }); break;
    case 'glass': m = S({ color: L(c), roughness: 0.04, metalness: 0.1, transparent: true, opacity: 0.28, depthWrite: false, envMapIntensity: 2 }); break;
    case 'gem': m = S({ color: L(c), roughness: 0.05, metalness: 0.3, emissive: L(c), emissiveIntensity: 0.3, transparent: true, opacity: 0.9, envMapIntensity: 2.5, flatShading: true }); break;
    case 'gold': m = S({ color: L(c), roughness: 0.26, metalness: 0.9, envMapIntensity: 2.2, emissive: L(c), emissiveIntensity: 0.08 }); break;
    case 'metal': m = S({ color: L(c), roughness: 0.34, metalness: 0.8, envMapIntensity: 1.8, map: texture('brushed') }); break;
    case 'cloth': m = S({ color: L(c), roughness: 0.95, metalness: 0, map: texture('cloth'), side: THREE.DoubleSide }); break;
    case 'leather': m = S({ color: L(c), roughness: 0.62, metalness: 0, map: texture('leather') }); break;
    case 'wood': m = S({ color: L(c), roughness: 0.75, metalness: 0, map: texture('wood') }); break;
    case 'stone': m = S({ color: L(c), roughness: 0.9, metalness: 0, map: texture('stone') }); break;
    case 'dark': m = S({ color: L(c), roughness: 0.6, metalness: 0.2 }); break;
    case 'skin': m = S({ color: L(c), roughness: 0.7, metalness: 0, side: THREE.DoubleSide, transparent: true, opacity: 0.92 }); break;
    default: m = S({ color: L(c), roughness: 0.5, metalness: 0 });
  }
  MATS.set(key, m);
  return m;
}

// ── Formen (zwischengespeichert) ──
const GEO = new Map();
const geo = (key, make) => { if (!GEO.has(key)) GEO.set(key, make()); return GEO.get(key); };
function rboxGeo(w, h, d, r) {
  r = Math.max(0.005, Math.min(r, w / 2 - 0.002, h / 2 - 0.002, d / 2 - 0.002));
  return geo(`rb${w.toFixed(3)}|${h.toFixed(3)}|${d.toFixed(3)}|${r.toFixed(3)}`, () => {
    const s = new THREE.Shape(), x = (w - 2 * r) / 2, y = (h - 2 * r) / 2, q = Math.min(x, y) * 0.6;
    s.moveTo(-x + q, -y); s.lineTo(x - q, -y); s.quadraticCurveTo(x, -y, x, -y + q); s.lineTo(x, y - q); s.quadraticCurveTo(x, y, x - q, y);
    s.lineTo(-x + q, y); s.quadraticCurveTo(-x, y, -x, y - q); s.lineTo(-x, -y + q); s.quadraticCurveTo(-x, -y, -x + q, -y);
    const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(0.001, d - 2 * r), bevelEnabled: true, bevelThickness: r, bevelSize: r, bevelSegments: 3, curveSegments: 4 });
    g.center();
    const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 0.5, uv.getY(i) * 0.5);
    return g;
  });
}
const COIN_GEO = () => geo('coin', () => {
  const pts = [[0, 0.022], [0.2, 0.022], [0.215, 0.032], [0.24, 0.036], [0.3, 0.036], [0.305, 0], [0.3, -0.036], [0.24, -0.036], [0.215, -0.032], [0.2, -0.022], [0, -0.022]].map(([x, y]) => new THREE.Vector2(x, y));
  const g = new THREE.LatheGeometry(pts, 28);
  return g;
});
const GEM_GEO = () => geo('gem', () => {
  const pts = [[0, -0.55], [0.62, 0.02], [0.66, 0.1], [0.42, 0.32], [0, 0.32]].map(([x, y]) => new THREE.Vector2(x, y));
  const g = new THREE.LatheGeometry(pts, 8);
  return g.toNonIndexed();
});
const FEATHER_GEO = () => geo('feather', () => {
  const s = new THREE.Shape();
  s.moveTo(0, 0); s.bezierCurveTo(0.08, 0.42, 0.35, 0.5, 1, 0.12); s.bezierCurveTo(1.02, 0.05, 1.0, -0.02, 0.97, -0.05); s.bezierCurveTo(0.6, -0.42, 0.1, -0.3, 0, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.02, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 1, curveSegments: 10 });
  return g;
});

function makeBuilder(root) {
  const parts = [];
  const anims = [];
  const V = (a) => a || [0, 0, 0];
  function place(mesh, p, r, par) {
    const [x, y, z] = V(p), [rx, ry, rz] = V(r);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    (par || root).add(mesh);
    parts.push(mesh);
    return mesh;
  }
  const M = (g, c, k) => new THREE.Mesh(g, mat(c, k));
  const B = {
    parts, anims, shade, rnd,
    box(s, c, k, p, r, par) { return place(M(geo('b' + s.join('|'), () => new THREE.BoxGeometry(...s)), c, k), p, r, par); },
    rbox(s, c, k, p, r, par, rad = 0.05) { return place(M(rboxGeo(s[0], s[1], s[2], rad), c, k), p, r, par); },
    cyl(rt, rb, h, c, k, p, r, par, seg = 24) { return place(M(geo(`c${rt}|${rb}|${h}|${seg}`, () => new THREE.CylinderGeometry(rt, rb, h, seg)), c, k), p, r, par); },
    half(rad, len, c, k, p, r, par, t0 = 0) { return place(M(geo(`h${rad}|${len}|${t0}`, () => new THREE.CylinderGeometry(rad, rad, len, 28, 1, false, t0, PI)), c, k), p, r, par); },
    ball(rad, c, k, p, sc, par, seg = 24) { const m = place(M(geo(`s${rad}|${seg}`, () => new THREE.SphereGeometry(rad, seg, Math.max(8, seg * 0.67 | 0))), c, k), p, null, par); if (sc) m.scale.set(...sc); return m; },
    tor(R, t, c, k, p, r, par, arc = PI * 2) { return place(M(geo(`t${R}|${t}|${arc}`, () => new THREE.TorusGeometry(R, t, 12, 56, arc)), c, k), p, r, par); },
    cone(rad, h, c, k, p, r, par, seg = 16) { return place(M(geo(`k${rad}|${h}|${seg}`, () => new THREE.ConeGeometry(rad, h, seg)), c, k), p, r, par); },
    oct(rad, c, k, p, sc, r, par) { const m = place(M(geo(`o${rad}`, () => new THREE.OctahedronGeometry(rad)), c, k), p, r, par); if (sc) m.scale.set(...sc); return m; },
    lathe(pts, c, k, p, r, par, seg = 32, key) { return place(M(geo('l' + (key || JSON.stringify(pts)) + seg, () => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg)), c, k), p, r, par); },
    mesh(g, c, k, p, r, par) { return place(new THREE.Mesh(g, mat(c, k)), p, r, par); },
    coin(p, r, par, s = 1, c = GOLD) { const m = place(M(COIN_GEO(), c, 'gold'), p, r || [PI / 2, 0, 0], par); m.scale.setScalar(s); return m; },
    gem(rad, c, p, r, par) { const m = place(M(GEM_GEO(), c, 'gem'), p, r || [PI / 2, 0, 0], par); m.scale.setScalar(rad / 0.62); return m; },
    feather(L, w, c, k, p, rz, par, side = 1) { const m = place(M(FEATHER_GEO(), c, k), p, [0, side < 0 ? PI : 0, rz], par); m.scale.set(L, w, 1); return m; },
    glow(size, c, p, par, op = 0.8) {
      const key = 'glow|' + c + op;
      if (!MATS.has(key)) MATS.set(key, new THREE.SpriteMaterial({ map: texture('glow'), color: new THREE.Color(shade(c, 0.1)).convertSRGBToLinear(), transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending }));
      const s = new THREE.Sprite(MATS.get(key));
      s.scale.setScalar(size);
      const [x, y, z] = V(p); s.position.set(x, y, z);
      (par || root).add(s); parts.push(s);
      return s;
    },
    // Linie aus Stichen zwischen zwei Punkten
    seam(a, b, c = '#e9d8b0', n, par, w = 0.022) {
      const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b), d = Bv.clone().sub(A), len = d.length();
      n = n || Math.max(2, Math.round(len / 0.12));
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
      const g = geo(`seam${w}|${(len / n * 0.55).toFixed(3)}`, () => new THREE.BoxGeometry(w, len / n * 0.55, w));
      for (let i = 0; i < n; i++) { const m = new THREE.Mesh(g, mat(c, 'plastic')); m.position.copy(A).addScaledVector(d, (i + 0.5) / n); m.quaternion.copy(q); (par || root).add(m); parts.push(m); }
    },
    rivets(a, b, n, c = BRASS, r = 0.045, par) { for (let i = 0; i < n; i++) { const t = n === 1 ? 0.5 : i / (n - 1); B.ball(r, c, 'gold', [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t], [1, 1, 0.6], par, 10); } },
    buckle(p, s = 1, c = BRASS, par, rz = 0) {
      const g = B.pivot(p, [0, 0, rz], par);
      B.box([0.24 * s, 0.035 * s, 0.035 * s], c, 'gold', [0, 0.1 * s, 0], null, g);
      B.box([0.24 * s, 0.035 * s, 0.035 * s], c, 'gold', [0, -0.1 * s, 0], null, g);
      B.box([0.035 * s, 0.235 * s, 0.035 * s], c, 'gold', [-0.105 * s, 0, 0], null, g);
      B.box([0.035 * s, 0.235 * s, 0.035 * s], c, 'gold', [0.105 * s, 0, 0], null, g);
      B.box([0.02 * s, 0.2 * s, 0.02 * s], shade(c, -0.2), 'gold', [0, 0, 0.02 * s], null, g);
      return g;
    },
    pivot(p, r, par) { const g = new THREE.Group(); const [x, y, z] = V(p), [rx, ry, rz] = V(r); g.position.set(x, y, z); g.rotation.set(rx, ry, rz); (par || root).add(g); return g; },
    spin(o, axis, speed) { const base = o.rotation[axis]; anims.push((t) => { o.rotation[axis] = base + t * speed; }); },
    bob(o, amp = 0.12, speed = 1.6) { const y0 = o.position.y; anims.push((t) => { o.position.y = y0 + Math.sin(t * speed) * amp; }); },
    pulse(o, amp = 0.08, speed = 3) { const s0 = o.scale.clone(); anims.push((t) => { const f = 1 + Math.sin(t * speed) * amp; o.scale.set(s0.x * f, s0.y * f, s0.z * f); }); },
    sparkle(n, spread, c, center = [0, 0, 1], size = 0.09, rise = 0.5) {
      const g = new THREE.BufferGeometry();
      const pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        pos[i * 3] = center[0] + (Math.random() - 0.5) * spread[0];
        pos[i * 3 + 1] = center[1] + (Math.random() - 0.5) * spread[1];
        pos[i * 3 + 2] = center[2] + (Math.random() - 0.5) * spread[2];
      }
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: new THREE.Color(shade(c, 0.3)).convertSRGBToLinear(), size: size * 1.6, map: texture('glow'), transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending }));
      root.add(pts);
      const lo = center[1] - spread[1] / 2, span = spread[1];
      let last = 0;
      anims.push((t) => {
        const dt = Math.min(0.05, t - last); last = t;
        const a = g.attributes.position;
        for (let i = 0; i < n; i++) {
          let y = a.getY(i) + dt * rise * (0.5 + (i % 5) / 5);
          if (y > lo + span) y = lo;
          if (y < lo) y = lo + span;
          a.setY(i, y);
        }
        a.needsUpdate = true;
      });
      return pts;
    },
    // Tragegurte: gepolstert, mit Naht, Schnalle und Schulterpolster
    straps(c = LEATHER, k = 'leather', o = {}) {
      const metal = o.metal || BRASS;
      for (const sx of [-0.52, 0.52]) {
        B.rbox([0.26, 1.95, 0.1], c, k, [sx, 0, 0.05], null, null, 0.035);
        B.rbox([0.26, 0.11, 1.12], c, k, [sx, 1.05, -0.5], null, null, 0.035);
        B.rbox([0.26, 1.0, 0.1], c, k, [sx, 0.5, -1.05], null, null, 0.035);
        B.rbox([0.36, 0.13, 0.62], shade(c, -0.18), k, [sx, 1.1, -0.42], null, null, 0.06);
        if (!o.plain) {
          B.seam([sx - 0.09, -0.85, 0.105], [sx - 0.09, 0.85, 0.105], '#e9d8b0', 10);
          B.seam([sx + 0.09, -0.85, 0.105], [sx + 0.09, 0.85, 0.105], '#e9d8b0', 10);
          const bk = B.buckle([sx, 0.25, -1.12], 1.05, metal);
          bk.rotation.y = PI;
          B.rbox([0.22, 0.4, 0.06], shade(c, -0.1), k, [sx, -0.05, -1.12], null, null, 0.02);
          B.ball(0.045, metal, 'gold', [sx, -0.85, 0.11], [1, 1, 0.5], null, 10);
        }
      }
      if (o.chest !== false && !o.plain) {
        B.rbox([1.18, 0.11, 0.06], shade(c, -0.1), k, [0, 0.42, -1.13], null, null, 0.02);
        B.buckle([0, 0.42, -1.16], 0.8, metal).rotation.y = PI;
      }
    },
    emblem(type, p, s = 1, par) {
      const [x, y, z] = p;
      if (type === 'coin') { B.ball(0.32 * s, '#ffe08a', 'haze', [x, y, z], [1, 1, 0.2], par, 12); B.coin([x, y, z + 0.04 * s], null, par, s * 0.95); B.emblem('star', [x, y, z + 0.08 * s], s * 0.55, par); }
      else if (type === 'clover') { for (const [dx, dy] of [[-0.1, 0.1], [0.1, 0.1], [-0.1, -0.1], [0.1, -0.1]]) B.ball(0.12 * s, '#3fbf5a', 'plastic', [x + dx * s, y + dy * s, z], [1, 1, 0.35], par); B.ball(0.05 * s, '#2a8a3a', 'plastic', [x, y, z + 0.04], [1, 1, 0.5], par); B.rbox([0.045 * s, 0.26 * s, 0.04], '#2a8a3a', 'plastic', [x + 0.06 * s, y - 0.24 * s, z], [0, 0, 0.4], par, 0.015); B.tor(0.24 * s, 0.025 * s, BRASS, 'gold', [x, y, z - 0.02], null, par); }
      else if (type === 'shield') { B.rbox([0.42 * s, 0.34 * s, 0.06], '#b33a3a', 'plastic', [x, y + 0.06 * s, z], null, par, 0.02); B.cone(0.3 * s, 0.26 * s, '#b33a3a', 'plastic', [x, y - 0.21 * s, z], [PI, 0, 0], par, 4).scale.set(1, 1, 0.2); B.box([0.06 * s, 0.42 * s, 0.07], GOLD, 'gold', [x, y, z + 0.01], null, par); B.box([0.38 * s, 0.06 * s, 0.07], GOLD, 'gold', [x, y + 0.08 * s, z + 0.01], null, par); B.tor(0.04 * s, 0.015 * s, GOLD, 'gold', [x, y + 0.08 * s, z + 0.05], null, par); }
      else if (type === 'moon') { B.tor(0.22 * s, 0.065 * s, '#cfe6ff', 'neon', [x, y, z], [0, 0, 0.6], par, PI * 1.25); B.glow(0.9 * s, '#9fc4ff', [x, y, z + 0.1], par, 0.6); for (const [dx, dy] of [[0.25, 0.2], [0.3, -0.12], [0.12, 0.33]]) B.ball(0.025 * s, '#ffffff', 'neon', [x + dx * s, y + dy * s, z], null, par, 8); }
      else if (type === 'hammer') { B.rbox([0.07 * s, 0.42 * s, 0.05], '#7a5a3a', 'wood', [x - 0.12 * s, y, z], [0, 0, 0.6], par, 0.02); B.rbox([0.24 * s, 0.11 * s, 0.08], '#9aa3ad', 'metal', [x - 0.02 * s, y + 0.15 * s, z + 0.01], [0, 0, 0.6], par, 0.02); B.rbox([0.34 * s, 0.11 * s, 0.07], IRON, 'metal', [x + 0.1 * s, y - 0.17 * s, z], null, par, 0.02); B.rbox([0.14 * s, 0.14 * s, 0.07], IRON, 'metal', [x + 0.1 * s, y - 0.26 * s, z], null, par, 0.02); B.glow(0.25 * s, '#ffb347', [x + 0.06 * s, y + 0.02 * s, z + 0.05], par, 0.8); }
      else if (type === 'eye') { B.ball(0.17 * s, '#fff', 'plastic', [x, y, z], [1.2, 0.8, 0.4], par); B.ball(0.09 * s, '#ff4a4a', 'neon', [x, y, z + 0.04], [1, 1, 0.5], par); B.ball(0.04 * s, '#200', 'dark', [x, y, z + 0.07], null, par, 8); B.tor(0.2 * s, 0.035 * s, GOLD, 'gold', [x, y, z], [0, 0, 0], par).scale.set(1.2, 0.8, 1); B.glow(0.6 * s, '#ff4a4a', [x, y, z + 0.1], par, 0.7); }
      else if (type === 'star') { for (let i = 0; i < 5; i++) B.cone(0.08 * s, 0.25 * s, GOLD, 'gold', [x + Math.sin(i * 1.2566) * 0.12 * s, y + Math.cos(i * 1.2566) * 0.12 * s, z], [0, 0, -i * 1.2566], par, 4).scale.set(1, 1, 0.45); B.ball(0.085 * s, '#fff1a8', 'neon', [x, y, z], [1, 1, 0.6], par, 12); }
      else if (type === 'arrow') { B.rbox([0.42 * s, 0.08 * s, 0.05], '#ffd77a', 'neon', [x, y, z], [0, 0, 0.5], par, 0.02); B.cone(0.1 * s, 0.17 * s, '#ffd77a', 'neon', [x + 0.2 * s, y + 0.12 * s, z], [0, 0, -1.07], par, 4); B.glow(0.7 * s, '#ffcf4a', [x, y, z + 0.05], par, 0.55); }
    },
  };
  return B;
}

const A = {};
function buildItem(B, recipe) {
  A[recipe.a](B, recipe);
}
