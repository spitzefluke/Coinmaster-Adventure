// Baut eine Welt als schwebende 3D-Insel: Boden mit Hügeln, Felsunterseite, Gegenstände je
// Thema, Himmel, Licht und Partikel. Alles aus einfachen Formen (Low-Poly), damit es später in
// Roblox Studio genauso nachgebaut werden kann.
//
//   const w = buildWorld(WORLD, { particles: 1, shadows: true });
//   scene = w.scene; jedes Bild: w.update(t, dt); am Ende: w.dispose();

import * as THREE from 'three';

const R = 16; // Radius der Insel
export const ISLAND_RADIUS = R;
const K = R / 6; // Vergrößerung gegenüber der ersten Fassung (Radius 6)
const AREA = K * K; // so viel mehr Fläche: Streu-Gegenstände, Münzen und Partikel wachsen mit

// ── Zufall mit festem Startwert, damit jede Welt immer gleich aussieht ──
function seeded(str) {
  let a = 2166136261;
  for (const ch of str) a = Math.imul(a ^ ch.charCodeAt(0), 16777619);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Texturen ──
function canvasTex(w, h, draw, { repeat, srgb = true } = {}) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(...repeat);
  }
  return t;
}
const dotTex = () =>
  canvasTex(64, 64, (g) => {
    const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, '#fff');
    r.addColorStop(0.35, '#ffffffcc');
    r.addColorStop(1, '#fff0');
    g.fillStyle = r;
    g.fillRect(0, 0, 64, 64);
  });
const squareTex = () =>
  canvasTex(32, 32, (g) => {
    g.fillStyle = '#fff';
    g.beginPath();
    g.roundRect(4, 12, 24, 8, 4);
    g.fill();
  });
const bubbleTex = () =>
  canvasTex(64, 64, (g) => {
    g.strokeStyle = '#ffffffd0';
    g.lineWidth = 4;
    g.beginPath();
    g.arc(32, 32, 26, 0, Math.PI * 2);
    g.stroke();
    g.fillStyle = '#ffffff30';
    g.fill();
    g.fillStyle = '#ffffffe0';
    g.beginPath();
    g.arc(23, 22, 6, 0, Math.PI * 2);
    g.fill();
  });
const skyTex = ([top, bottom]) =>
  canvasTex(4, 256, (g, w, h) => {
    const l = g.createLinearGradient(0, 0, 0, h);
    l.addColorStop(0, top);
    l.addColorStop(1, bottom);
    g.fillStyle = l;
    g.fillRect(0, 0, w, h);
  });

// ── Materialien ──
const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.85, ...o });
const E = (color, intensity = 1.6, o = {}) =>
  new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, flatShading: true, roughness: 0.5, ...o });

function jitter(geo, rand, amount, keep = () => false) {
  const p = geo.attributes.position;
  const seen = new Map(); // gleiche Ecken gleich verschieben, sonst reißen Kanten auf
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    if (keep(x, y, z)) continue;
    const key = `${x.toFixed(3)},${y.toFixed(3)},${z.toFixed(3)}`;
    if (!seen.has(key)) seen.set(key, [(rand() - 0.5) * amount, (rand() - 0.5) * amount, (rand() - 0.5) * amount]);
    const [dx, dy, dz] = seen.get(key);
    p.setXYZ(i, x + dx, y + dy, z + dz);
  }
  geo.computeVertexNormals();
  return geo;
}

// ── Partikel ────────────────────────────────────────────────────────────────
// mode: fall, rise, drift, wander, swirl
function particles({ count, colors, size, mode, speed = 1, area = R + 1, y0 = 0, y1 = 7, additive = true, blink = 0, tex = 'dot', opacity = 1 }, rand) {
  const pos = new Float32Array(count * 3), col = new Float32Array(count * 3), base = new Float32Array(count * 3);
  const phase = new Float32Array(count), spd = new Float32Array(count);
  const c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const a = rand() * Math.PI * 2, r = Math.sqrt(rand()) * area;
    pos.set([Math.cos(a) * r, y0 + rand() * (y1 - y0), Math.sin(a) * r], i * 3);
    c.set(colors[i % colors.length]);
    base.set([c.r, c.g, c.b], i * 3);
    col.set([c.r, c.g, c.b], i * 3);
    phase[i] = rand() * 100;
    spd[i] = 0.6 + rand() * 0.8;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const map = tex === 'square' ? squareTex() : tex === 'bubble' ? bubbleTex() : dotTex();
  const mat = new THREE.PointsMaterial({
    size, map, vertexColors: true, transparent: true, opacity, depthWrite: false, sizeAttenuation: true,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  const update = (t, dt) => {
    for (let i = 0; i < count; i++) {
      const k = i * 3, s = spd[i] * speed, ph = phase[i];
      let x = pos[k], y = pos[k + 1], z = pos[k + 2];
      if (mode === 'fall') {
        y -= s * dt;
        x += Math.sin(t * 1.3 + ph) * 0.4 * dt;
        z += Math.cos(t * 1.1 + ph) * 0.4 * dt;
      } else if (mode === 'rise') {
        y += s * dt;
        x += Math.sin(t * 2 + ph) * 0.35 * dt;
        z += Math.cos(t * 1.7 + ph) * 0.35 * dt;
      } else if (mode === 'drift') {
        x += s * 0.6 * dt;
        y += Math.sin(t + ph) * 0.15 * dt;
      } else if (mode === 'wander') {
        x += Math.sin(t * 0.7 + ph) * 0.5 * dt;
        y += Math.cos(t * 0.9 + ph * 2) * 0.3 * dt;
        z += Math.sin(t * 0.8 + ph * 3) * 0.5 * dt;
      } else if (mode === 'swirl') {
        const a = Math.atan2(z, x) + s * 0.5 * dt, r = Math.hypot(x, z);
        x = Math.cos(a) * r;
        z = Math.sin(a) * r;
        y += Math.sin(t * 2 + ph) * 0.2 * dt;
      }
      // am Rand des Bereichs auf der anderen Seite wieder einsetzen
      if (y < y0) y = y1;
      if (y > y1) y = y0;
      const r = Math.hypot(x, z);
      if (r > area) {
        x = -x * 0.98;
        z = -z * 0.98;
      }
      pos[k] = x;
      pos[k + 1] = y;
      pos[k + 2] = z;
      if (blink) {
        const b = 1 - blink + blink * (0.5 + 0.5 * Math.sin(t * 3 * spd[i] + ph));
        col[k] = base[k] * b;
        col[k + 1] = base[k + 1] * b;
        col[k + 2] = base[k + 2] * b;
      }
    }
    geo.attributes.position.needsUpdate = true;
    if (blink) geo.attributes.color.needsUpdate = true;
  };
  return { object: pts, update };
}

export const FX = {
  pollen: { count: 70, colors: ['#fff6c0', '#ffffff', '#ffe28a'], size: 0.12, mode: 'wander', blink: 0.4 },
  fireflies: { count: 60, colors: ['#d9ff7a', '#fff27a'], size: 0.22, mode: 'wander', blink: 0.9, y0: 0.3, y1: 4 },
  dust: { count: 60, colors: ['#ffe6c0'], size: 0.1, mode: 'drift', additive: false, opacity: 0.6 },
  snow: { count: 260, colors: ['#ffffff', '#eaf6ff'], size: 0.16, mode: 'fall', speed: 0.9, additive: false, y1: 10 },
  embers: { count: 140, colors: ['#ff6a1a', '#ffb02e', '#ff3a0a'], size: 0.16, mode: 'rise', speed: 1.4, blink: 0.6, y1: 9 },
  spores: { count: 100, colors: ['#b07bff', '#6ae8ff', '#ff7ae0'], size: 0.16, mode: 'rise', speed: 0.35, blink: 0.8, y1: 6 },
  sprinkles: { count: 220, colors: ['#ff5fb0', '#5fd3ff', '#ffe25f', '#7aff8a', '#ffffff', '#b07bff'], size: 0.2, mode: 'fall', speed: 1.2, additive: false, tex: 'square', y1: 10 },
  stars: { count: 70, colors: ['#ffffff', '#cfe0ff'], size: 0.14, mode: 'wander', blink: 0.9 },
  storm: { count: 220, colors: ['#9fd8ff', '#ffffff', '#5aa8ff'], size: 0.12, mode: 'swirl', speed: 2.4, area: R + 3, y1: 6, blink: 0.4 },
  reddust: { count: 140, colors: ['#ff9b6a', '#d8653a'], size: 0.13, mode: 'drift', speed: 2, additive: false, opacity: 0.75, y1: 4 },
  alien: { count: 110, colors: ['#7aff5a', '#5affd8', '#d97aff'], size: 0.17, mode: 'rise', speed: 0.5, blink: 0.9, y1: 7 },
  flares: { count: 160, colors: ['#fff2a0', '#ffb02e', '#ff6a1a'], size: 0.24, mode: 'rise', speed: 2, blink: 0.5, y1: 10 },
  bubbles: { count: 110, colors: ['#e8fbff', '#bff0ff'], size: 0.3, mode: 'rise', speed: 0.9, additive: false, tex: 'bubble', y0: -3, y1: 11 },
};

// ── Welt bauen ──────────────────────────────────────────────────────────────

export function buildWorld(world, { particles: pScale = 1, shadows = false } = {}) {
  const rand = seeded(world.id);
  const rr = (a, b) => a + rand() * (b - a);
  const scene = new THREE.Scene();
  const root = new THREE.Group();
  scene.add(root);
  const anims = []; // (t, dt) => void

  scene.background = skyTex(world.sky);
  scene.fog = new THREE.Fog(world.sky[1], (world.water ? 16 : 26) * K, (world.water ? 46 : 70) * K);

  // Licht
  const space = world.planet === 'p2';
  const hemi = new THREE.HemisphereLight(world.sky[1], world.ground, space ? 1.0 : 1.25);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(world.water ? '#d8f6ff' : '#fff4e0', world.water ? 1.6 : 2.0);
  sun.position.set(7, 14, 6);
  if (shadows) {
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -R * 1.4, right: R * 1.4, top: R * 1.4, bottom: -R * 1.4, near: 1, far: 70 });
    sun.shadow.bias = -0.0015;
    sun.shadow.normalBias = 0.03;
  }
  scene.add(sun);

  // ── Insel ──
  const flat = world.id === 'stadt' ? 0 : world.id === 'atlantis' ? 0.25 : 1; // Stadt eben, Atlantis fast eben
  const s1 = rr(0, 6), s2 = rr(0, 6), s3 = rr(0, 6);
  const height = (x, z) => {
    const r = Math.hypot(x, z) / R;
    const fall = r > 0.8 ? Math.max(0, 1 - (r - 0.8) / 0.2) : 1;
    // weite, sanfte Hügel plus kleine Unebenheiten
    const wide = Math.sin(x * 0.2 + s2) * Math.cos(z * 0.17 + s1) * 0.55 + Math.sin((x + z) * 0.11 + s3) * 0.3;
    return ((wide + Math.sin(x * 0.7 + s1) * Math.cos(z * 0.6 + s2) * 0.14 + Math.sin(x * 1.3 + z * 0.9 + s3) * 0.05) * flat + 0.3) * fall;
  };

  // Oberfläche als Ringgitter
  {
    const rings = 10, segs = 56, verts = [], idx = [];
    verts.push(0, height(0, 0), 0);
    for (let i = 1; i <= rings; i++) {
      for (let j = 0; j < segs; j++) {
        const a = (j / segs) * Math.PI * 2, r = (i / rings) * R * (1 + (i === rings ? 0 : (rand() - 0.5) * 0.04));
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        verts.push(x, height(x, z), z);
      }
    }
    for (let j = 0; j < segs; j++) idx.push(0, 1 + ((j + 1) % segs), 1 + j);
    for (let i = 1; i < rings; i++) {
      const a0 = 1 + (i - 1) * segs, a1 = 1 + i * segs;
      for (let j = 0; j < segs; j++) {
        const j1 = (j + 1) % segs;
        idx.push(a0 + j, a0 + j1, a1 + j, a0 + j1, a1 + j1, a1 + j);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    const top = new THREE.Mesh(g.toNonIndexed(), M(world.ground, { roughness: world.id === 'eis' ? 0.4 : 0.9 }));
    top.userData.rbx = { kind: 'ground' };
    top.geometry.computeVertexNormals();
    top.receiveShadow = true;
    root.add(top);
  }
  // Rand und Unterseite
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(R, R * 0.96, 1, 56, 1, true), M(world.side, { side: THREE.DoubleSide }));
  skirt.position.y = -0.5 + 0.0;
  root.add(skirt);
  const depth = 5.5 * K;
  const under = jitter(new THREE.ConeGeometry(R * 0.96, depth, 24, 5), rand, 0.9, (x, y) => y > depth / 2 - 0.05);
  under.rotateX(Math.PI);
  const rock = new THREE.Mesh(under, M(world.rock));
  rock.userData.rbx = { kind: 'underside' };
  skirt.userData.rbx = { name: 'Rand' };
  rock.position.y = -1 - depth / 2;
  root.add(rock);
  // kleine schwebende Brocken
  for (let i = 0; i < 7; i++) {
    const s = rr(0.3, 0.9);
    const b = new THREE.Mesh(jitter(new THREE.DodecahedronGeometry(s, 0), rand, s * 0.4), M(world.rock));
    const a = rr(0, Math.PI * 2), r = rr(R + 0.8, R + 2.2);
    b.position.set(Math.cos(a) * r, rr(-4, -0.5), Math.sin(a) * r);
    root.add(b);
    const y0 = b.position.y, ph = rr(0, 6);
    anims.push((t) => {
      b.position.y = y0 + Math.sin(t * 0.8 + ph) * 0.25;
      b.rotation.y = t * 0.2 + ph;
    });
  }

  // ── Platzieren ──
  const taken = [];
  const free = (x, z, d) => taken.every(([tx, tz, td]) => Math.hypot(tx - x, tz - z) > d + td);
  const spot = (d = 0.6, rMin = 0, rMax = R - 0.8) => {
    for (let tries = 0; tries < 60; tries++) {
      const a = rand() * Math.PI * 2, r = rMin + Math.sqrt(rand()) * (rMax - rMin);
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (free(x, z, d)) {
        taken.push([x, z, d]);
        return [x, z];
      }
    }
    return null;
  };
  const reserve = (x, z, d) => taken.push([x, z, d]);
  const placed = []; // alles, was per put() auf der Insel steht (für die Lichtung um die Figur)
  const put = (obj, x, z, { sink = 0.05, rot = true } = {}) => {
    placed.push([obj, x, z]);
    obj.position.set(x, height(x, z) - sink, z);
    if (rot) obj.rotation.y = rand() * Math.PI * 2;
    obj.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    root.add(obj);
    return obj;
  };
  const scatter = (n, make, d, rMin, rMax, opts) => {
    // Streut über die ganze (größere) Insel: Anzahl mit der Fläche wachsen lassen
    if ((rMax ?? R) >= R - 2.5) n = Math.round(n * AREA);
    for (let i = 0; i < n; i++) {
      const p = spot(d, rMin, rMax);
      if (p) put(make(i), p[0], p[1], opts);
    }
  };

  const shared = {};
  const ctx = { world, rand, rr, root, scene, anims, put, spot, reserve, free, scatter, height, M, E, shared };
  (BUILDERS[world.id] || BUILDERS.normal)(ctx);
  EXTRAS[world.id]?.(ctx);

  // Teleport-Plattform am Rand: Ankunftsort und Rückweg zum Hub.
  // Daneben bleibt ein freier Platz für den Größenvergleich mit einer Roblox-Figur.
  let figureSpot = null;
  {
    // im dichten Wald gibt es keinen freien Platz mehr: dann wird am Rand eine Lichtung geschlagen
    const p = spot(0.9, R - 2.4, R - 1.1) ?? [Math.cos(0.7) * (R - 1.6), Math.sin(0.7) * (R - 1.6)];
    if (p) {
      for (const [obj, x, z] of placed)
        if (Math.hypot(x - p[0], z - p[1]) < 1.3) {
          root.remove(obj);
          obj.traverse((o) => o.geometry?.dispose());
        }
      const pad = teleportPad(world.accent || '#ffd76a', anims);
      put(pad, p[0], p[1], { rot: false });
      pad.lookAt(0, pad.position.y, 0);
      const a0 = Math.atan2(p[1], p[0]), r0 = Math.hypot(p[0], p[1]);
      for (const da of [0.13, -0.13, 0.2, -0.2, 0.28, -0.28, 0.36, -0.36, 0.45, -0.45]) {
        const r = Math.min(r0, R - 0.9), x = Math.cos(a0 + da) * r, z = Math.sin(a0 + da) * r;
        // auch nach außen (Richtung Kamera beim Vergleich) muss frei sein
        const ox = Math.cos(a0 + da), oz = Math.sin(a0 + da);
        if (free(x, z, 0.5) && free(x + ox * 0.7, z + oz * 0.7, 0.35)) {
          reserve(x, z, 0.5);
          figureSpot = new THREE.Vector3(x, height(x, z), z);
          break;
        }
      }
      // Lichtung: Bäume und Deko direkt um die Figur weglassen, damit man sie sieht
      if (!figureSpot) {
        const r = Math.min(r0, R - 0.9);
        figureSpot = new THREE.Vector3(Math.cos(a0 + 0.2) * r, 0, Math.sin(a0 + 0.2) * r);
        figureSpot.y = height(figureSpot.x, figureSpot.z);
        reserve(figureSpot.x, figureSpot.z, 0.5);
      }
      for (const [obj, x, z] of placed)
        if (obj !== pad && Math.hypot(x - figureSpot.x, z - figureSpot.z) < 1.6) {
          root.remove(obj);
          obj.traverse((o) => o.geometry?.dispose());
        }
    }
  }

  // ── Münzen: in jeder Welt liegen ein paar herum ──
  const coinGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.07, 28);
  const coinMat = new THREE.MeshStandardMaterial({ color: '#ffcf4a', metalness: 0.7, roughness: 0.28, emissive: '#b8860b', emissiveIntensity: 0.55 });
  const glowMat = new THREE.SpriteMaterial({ map: dotTex(), color: world.accent || '#ffd76a', transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending });
  for (let i = 0; i < Math.round(5 * AREA); i++) {
    const p = spot(0.5, 0.5, R - 0.7);
    if (!p) continue;
    const g = new THREE.Group();
    const spin = new THREE.Group();
    const c = new THREE.Mesh(coinGeo, coinMat);
    c.rotation.x = Math.PI / 2;
    c.castShadow = true;
    c.userData.rbx = { name: 'CoinSpawn' };
    spin.add(c);
    const glow = new THREE.Sprite(glowMat);
    glow.scale.setScalar(1.3);
    g.add(glow, spin);
    const y0 = height(p[0], p[1]) + 0.55, ph = rand() * 6;
    g.position.set(p[0], y0, p[1]);
    root.add(g);
    anims.push((t) => {
      spin.rotation.y = t * 2 + ph;
      g.position.y = y0 + Math.sin(t * 2 + ph) * 0.08;
    });
  }

  // ── Partikel ──
  const fxs = [];
  if (pScale > 0 && FX[world.fx]) {
    const cfg = { ...FX[world.fx] };
    cfg.count = Math.max(8, Math.round(cfg.count * pScale * AREA));
    const p = particles(cfg, rand);
    scene.add(p.object);
    fxs.push(p);
  }
  // Sternenhimmel für Weltraumwelten
  if (space) {
    const n = 900, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = rand() * 2 - 1, a = rand() * Math.PI * 2, r = 80 * K;
      const s = Math.sqrt(1 - u * u);
      pos.set([Math.cos(a) * s * r, u * r, Math.sin(a) * s * r], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const stars = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.9, map: dotTex(), color: '#ffffff', transparent: true, depthWrite: false, fog: false }));
    scene.add(stars);
    anims.push((t) => (stars.rotation.y = t * 0.004));
  }

  return {
    scene,
    target: new THREE.Vector3(0, 0.6, 0),
    height,
    radius: R,
    figureSpot,
    update(t, dt) {
      for (const a of anims) a(t, dt);
      for (const f of fxs) f.update(t, Math.min(dt, 0.05));
    },
    dispose() {
      scene.traverse((o) => {
        o.geometry?.dispose();
        const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
        for (const m of mats) {
          for (const v of Object.values(m)) if (v?.isTexture) v.dispose();
          m.dispose();
        }
      });
      scene.background?.dispose?.();
    },
  };
}

// ── Bausteine ───────────────────────────────────────────────────────────────

const group = (...children) => {
  const g = new THREE.Group();
  g.add(...children);
  return g;
};
const at = (mesh, x, y, z) => {
  mesh.position.set(x, y, z);
  return mesh;
};

function trunk(h, c = '#6b4a2e', r = 0.12) {
  return at(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.8, r, h, 6), M(c)), 0, h / 2, 0);
}
function pine(h, c, rand) {
  const g = group(trunk(h * 0.3));
  for (let i = 0; i < 3; i++) {
    const r = (0.75 - i * 0.18) * h * 0.45;
    const cone = new THREE.Mesh(new THREE.ConeGeometry(r, h * 0.42, 7), M(c));
    cone.position.y = h * (0.35 + i * 0.2);
    cone.rotation.y = rand() * 3;
    g.add(cone);
  }
  return g;
}
function roundTree(h, c, rand) {
  const g = group(trunk(h * 0.5));
  const n = 2 + Math.floor(rand() * 2);
  for (let i = 0; i < n; i++) {
    const s = h * (0.32 - i * 0.05);
    const b = new THREE.Mesh(jitter(new THREE.IcosahedronGeometry(s, 0), rand, s * 0.25), M(c));
    b.position.set((rand() - 0.5) * h * 0.25, h * (0.6 + i * 0.18), (rand() - 0.5) * h * 0.25);
    g.add(b);
  }
  return g;
}
function bush(s, c, rand) {
  return at(new THREE.Mesh(jitter(new THREE.IcosahedronGeometry(s, 0), rand, s * 0.3), M(c)), 0, s * 0.6, 0);
}
function rockMesh(s, c, rand, mat) {
  const m = new THREE.Mesh(jitter(new THREE.DodecahedronGeometry(s, 0), rand, s * 0.45), mat || M(c));
  m.scale.y = 0.7;
  m.position.y = s * 0.35;
  return group(m);
}
function mushroom(h, cap, rand, glow) {
  const stem = at(new THREE.Mesh(new THREE.CylinderGeometry(h * 0.09, h * 0.13, h, 8), M('#f2e6d0')), 0, h / 2, 0);
  const r = h * 0.42;
  const top = at(new THREE.Mesh(new THREE.SphereGeometry(r, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), glow ? E(cap, 0.8) : M(cap)), 0, h * 0.95, 0);
  top.scale.y = 0.75;
  const g = group(stem, top);
  for (let i = 0; i < 5; i++) {
    const a = rand() * Math.PI * 2, e = 0.3 + rand() * 0.8;
    const d = at(new THREE.Mesh(new THREE.SphereGeometry(r * 0.13, 6, 4), M('#ffffff')), Math.cos(a) * Math.sin(e) * r, h * 0.95 + Math.cos(e) * r * 0.75, Math.sin(a) * Math.sin(e) * r);
    g.add(d);
  }
  return g;
}
function flower(c) {
  const stem = at(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 4), M('#3f8a46')), 0, 0.17, 0);
  const head = at(new THREE.Mesh(new THREE.IcosahedronGeometry(0.08, 0), M(c, { emissive: c, emissiveIntensity: 0.15 })), 0, 0.37, 0);
  return group(stem, head);
}
function crystal(h, c, rand, intensity = 1.2) {
  const g = new THREE.Group();
  const mat = E(c, intensity * 0.45, { transparent: true, opacity: 0.92, roughness: 0.2 });
  const n = 3 + Math.floor(rand() * 2);
  for (let i = 0; i < n; i++) {
    const s = h * (i === 0 ? 1 : 0.45 + rand() * 0.35);
    const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), mat);
    m.scale.set(0.7, s * 1.6, 0.7);
    m.position.set(i ? (rand() - 0.5) * 0.5 : 0, s * 0.35, i ? (rand() - 0.5) * 0.5 : 0);
    m.rotation.set(i ? (rand() - 0.5) * 0.8 : 0, rand() * 3, i ? (rand() - 0.5) * 0.8 : 0);
    g.add(m);
  }
  return g;
}

let windowsTexCache;
function windowsTex() {
  return (windowsTexCache ||= canvasTex(64, 128, (g) => {
    g.fillStyle = '#000';
    g.fillRect(0, 0, 64, 128);
    for (let y = 6; y < 128; y += 16)
      for (let x = 6; x < 64; x += 16) {
        g.fillStyle = Math.random() < 0.55 ? '#ffd98a' : '#1a1a24';
        g.fillRect(x, y, 9, 10);
      }
  }));
}
function building(w, h, d, c) {
  const tex = windowsTex().clone();
  tex.needsUpdate = true;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(Math.max(1, Math.round(w * 1.2)), Math.max(1, Math.round(h * 0.6)));
  const body = at(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color: c, emissive: '#ffd98a', emissiveMap: tex, emissiveIntensity: 0.9, roughness: 0.7 })), 0, h / 2, 0);
  const roof = at(new THREE.Mesh(new THREE.BoxGeometry(w * 0.4, 0.3, d * 0.4), M('#4a4652')), 0, h + 0.15, 0);
  return group(body, roof);
}
function lamp() {
  const pole = at(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.4, 6), M('#2a2830')), 0, 0.7, 0);
  const light = at(new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), E('#ffe2a0', 2.5)), 0, 1.45, 0);
  return group(pole, light);
}
function car(c) {
  const body = at(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.25, 0.42), M(c, { roughness: 0.4 })), 0, 0.2, 0);
  const cab = at(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.2, 0.38), M('#cfe8ff', { roughness: 0.2 })), -0.05, 0.42, 0);
  const g = group(body, cab);
  for (const [x, z] of [[0.25, 0.21], [-0.25, 0.21], [0.25, -0.21], [-0.25, -0.21]]) {
    const w = at(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.06, 10), M('#1a1a1a')), x, 0.09, z);
    w.rotation.x = Math.PI / 2;
    g.add(w);
  }
  return g;
}
function stripeTex(a, b, n = 6, vertical = false) {
  return canvasTex(64, 64, (g) => {
    g.fillStyle = a;
    g.fillRect(0, 0, 64, 64);
    g.fillStyle = b;
    for (let i = 0; i < n; i++) {
      g.beginPath();
      if (vertical) g.rect((i * 64) / n, 0, 32 / n, 64);
      else {
        // schräge Streifen
        const y = (i * 64) / n;
        g.moveTo(0, y);
        g.lineTo(64, y + 20);
        g.lineTo(64, y + 20 + 32 / n);
        g.lineTo(0, y + 32 / n);
      }
      g.fill();
    }
  }, { repeat: [1, 1] });
}
function lollipop(c, rand) {
  const stick = at(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.6, 6), M('#ffffff')), 0, 0.8, 0);
  const tex = canvasTex(128, 128, (g) => {
    g.fillStyle = '#fff';
    g.fillRect(0, 0, 128, 128);
    g.strokeStyle = c;
    g.lineWidth = 12;
    g.beginPath();
    for (let a = 0; a < 26; a += 0.1) {
      const r = a * 2.3;
      g.lineTo(64 + Math.cos(a) * r, 64 + Math.sin(a) * r);
    }
    g.stroke();
  });
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.16, 28), [M(c), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.3 }), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.3 })]);
  disc.rotation.x = Math.PI / 2;
  disc.position.y = 2;
  disc.userData.rbx = { color: c };
  const g = group(stick, disc);
  g.rotation.z = (rand() - 0.5) * 0.2;
  return g;
}
function candyCane() {
  const path = new THREE.CurvePath();
  path.add(new THREE.LineCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1.8, 0)));
  path.add(new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 1.8, 0), new THREE.Vector3(0, 2.5, 0), new THREE.Vector3(0.45, 2.5, 0)));
  path.add(new THREE.QuadraticBezierCurve3(new THREE.Vector3(0.45, 2.5, 0), new THREE.Vector3(0.8, 2.5, 0), new THREE.Vector3(0.8, 2.1, 0)));
  const tex = stripeTex('#ffffff', '#ff3a5a', 5, true);
  tex.repeat.set(2.5, 1);
  tex.rotation = 0.5;
  const tube = new THREE.Mesh(new THREE.TubeGeometry(path, 40, 0.13, 10), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.3 }));
  tube.userData.rbx = { color: '#ff5a70' };
  return group(tube);
}
function donut(icing) {
  const base = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.22, 10, 22), M('#d89a5a'));
  base.rotation.x = Math.PI / 2;
  base.position.y = 0.2;
  const top = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.2, 10, 22, Math.PI * 2), M(icing, { roughness: 0.4 }));
  top.rotation.x = Math.PI / 2;
  top.position.y = 0.27;
  top.scale.z = 0.7;
  return group(base, top);
}
function gumdrop(c) {
  const m = at(new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), M(c, { roughness: 0.25, emissive: c, emissiveIntensity: 0.15 })), 0, 0, 0);
  m.scale.y = 1.3;
  return group(m);
}
function crater(r, c, rand) {
  const rim = new THREE.Mesh(jitter(new THREE.TorusGeometry(r, r * 0.22, 6, 18), rand, r * 0.08), M(c));
  rim.rotation.x = Math.PI / 2;
  rim.scale.z = 0.45;
  rim.position.y = 0.05;
  const floor = new THREE.Mesh(new THREE.CircleGeometry(r, 18), M('#8a8d96'));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.02;
  return group(rim, floor);
}
function flag(c) {
  const pole = at(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.8, 6), M('#dddddd', { metalness: 0.6 })), 0, 0.9, 0);
  const cloth = at(new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.5, 6, 2), M(c, { side: THREE.DoubleSide, flatShading: false })), 0.42, 1.5, 0);
  return group(pole, cloth);
}
function planetBackdrop(scene, { color, bands, ring, size = 9, pos = [-22, 10, -34], glow, emissive }) {
  const tex = canvasTex(256, 128, (g) => {
    g.fillStyle = color;
    g.fillRect(0, 0, 256, 128);
    if (bands)
      bands.forEach((b, i) => {
        g.fillStyle = b;
        g.fillRect(0, 10 + i * 22 + Math.sin(i) * 6, 256, 8 + (i % 3) * 5);
      });
  });
  const mat = emissive ? new THREE.MeshBasicMaterial({ map: tex, fog: false }) : new THREE.MeshStandardMaterial({ map: tex, roughness: 1, fog: false });
  const p = new THREE.Mesh(new THREE.SphereGeometry(size, 40, 24), mat);
  p.userData.rbx = { color, name: 'Himmelskoerper', sky: true, neon: !!emissive };
  p.position.set(pos[0] * K, pos[1] * K, pos[2] * K);
  p.scale.setScalar(K);
  p.rotation.z = 0.3;
  scene.add(p);
  if (ring) {
    const rt = canvasTex(256, 256, (g) => {
      for (let r = 128; r > 70; r -= 4) {
        g.strokeStyle = `rgba(${ring}, ${0.25 + ((r * 7) % 10) / 20})`;
        g.lineWidth = 3;
        g.beginPath();
        g.arc(128, 128, r, 0, Math.PI * 2);
        g.stroke();
      }
    });
    const rm = new THREE.Mesh(new THREE.RingGeometry(size * 1.3, size * 2.1, 64), new THREE.MeshBasicMaterial({ map: rt, transparent: true, side: THREE.DoubleSide, fog: false, depthWrite: false }));
    rm.userData.rbx = { color: `rgb(${ring})`, transparency: 0.4, sky: true };
    rm.position.copy(p.position);
    rm.scale.setScalar(K);
    rm.rotation.set(1.2, 0.2, 0.3);
    scene.add(rm);
  }
  if (glow) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex(), color: glow, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    s.scale.setScalar(size * 4.5 * K);
    s.position.copy(p.position);
    scene.add(s);
  }
  return p;
}
function rover() {
  const body = at(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.3, 0.6), M('#e8e8e8', { roughness: 0.5 })), 0, 0.42, 0);
  const panel = at(new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.04, 0.75), M('#1a2a5a', { roughness: 0.2, metalness: 0.4 })), 0, 0.6, 0);
  const mast = at(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6), M('#cccccc')), 0.32, 0.85, 0.15);
  const cam = at(new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.12), M('#444444')), 0.32, 1.1, 0.15);
  const g = group(body, panel, mast, cam);
  for (const x of [-0.35, 0, 0.35])
    for (const z of [-0.35, 0.35]) {
      const w = at(new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.1, 10), M('#2a2a2a')), x, 0.13, z);
      w.rotation.x = Math.PI / 2;
      g.add(w);
    }
  return g;
}
function dome(r, glass, base) {
  const d = at(new THREE.Mesh(new THREE.SphereGeometry(r, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: glass, transparent: true, opacity: 0.35, roughness: 0.05, metalness: 0.2, side: THREE.DoubleSide, depthWrite: false })), 0, 0, 0);
  const ring = at(new THREE.Mesh(new THREE.CylinderGeometry(r * 1.03, r * 1.06, 0.18, 24), M(base)), 0, 0.09, 0);
  return group(d, ring);
}
function alienPlant(stalk, bulb, rand) {
  const h = 1 + rand() * 1.4;
  const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3((rand() - 0.5) * 0.8, h * 0.6, (rand() - 0.5) * 0.8), new THREE.Vector3((rand() - 0.5) * 0.6, h, (rand() - 0.5) * 0.6));
  const stem = new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.06, 6), M(stalk));
  const end = curve.getPoint(1);
  const head = at(new THREE.Mesh(new THREE.IcosahedronGeometry(0.2 + rand() * 0.12, 1), E(bulb, 2)), end.x, end.y, end.z);
  const g = group(stem, head);
  for (let i = 0; i < 2; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.25, 6, 4), M(stalk));
    leaf.scale.set(1, 0.15, 0.45);
    leaf.position.set((i ? 1 : -1) * 0.2, 0.15, 0);
    leaf.rotation.z = (i ? -1 : 1) * 0.5;
    g.add(leaf);
  }
  return g;
}
function coral(c, rand) {
  const g = new THREE.Group();
  const mat = M(c, { emissive: c, emissiveIntensity: 0.12 });
  const branch = (len, r, depth, parent) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.7, r, len, 6), mat);
    m.position.y = len / 2;
    const pivot = new THREE.Group();
    pivot.add(m);
    parent.add(pivot);
    if (depth > 0) {
      const tip = new THREE.Group();
      tip.position.y = len;
      pivot.add(tip);
      const n = 2 + Math.floor(rand() * 2);
      for (let i = 0; i < n; i++) {
        const sub = new THREE.Group();
        sub.rotation.set((rand() - 0.5) * 1.3, rand() * 6, (rand() - 0.5) * 1.3);
        tip.add(sub);
        branch(len * 0.7, r * 0.7, depth - 1, sub);
      }
    } else {
      const ball = at(new THREE.Mesh(new THREE.SphereGeometry(r * 1.4, 6, 5), mat), 0, len, 0);
      pivot.add(ball);
    }
    return pivot;
  };
  branch(0.5 + rand() * 0.3, 0.09, 2, g);
  return g;
}
function brainCoral(c, rand) {
  const m = new THREE.Mesh(jitter(new THREE.IcosahedronGeometry(0.45, 1), rand, 0.12), M(c));
  m.scale.y = 0.7;
  m.position.y = 0.25;
  return group(m);
}
function seaweed(c, rand, anims) {
  const g = new THREE.Group();
  const segs = 6 + Math.floor(rand() * 4), mat = M(c, { side: THREE.DoubleSide });
  let parent = g;
  const joints = [];
  for (let i = 0; i < segs; i++) {
    const j = new THREE.Group();
    j.position.y = i ? 0.32 : 0;
    const leaf = at(new THREE.Mesh(new THREE.BoxGeometry(0.16 - i * 0.008, 0.34, 0.04), mat), 0, 0.17, 0);
    j.add(leaf);
    parent.add(j);
    parent = j;
    joints.push(j);
  }
  const ph = rand() * 6;
  anims.push((t) => joints.forEach((j, i) => (j.rotation.z = Math.sin(t * 1.4 + ph + i * 0.5) * 0.12)));
  return g;
}
function fishSchool(root, anims, rand, colors, n = 7) {
  for (let i = 0; i < n; i++) {
    const c = colors[i % colors.length];
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), M(c, { emissive: c, emissiveIntensity: 0.2 }));
    body.scale.set(1.6, 0.9, 0.6);
    const tail = at(new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.2, 4), M(c)), -0.3, 0, 0);
    tail.rotation.z = Math.PI / 2;
    const f = group(body, tail);
    root.add(f);
    const r = (3 + rand() * 4) * K, y = 1 + rand() * 3, sp = (0.25 + rand() * 0.25) * (rand() < 0.5 ? 1 : -1), ph = rand() * 6;
    anims.push((t) => {
      const a = t * sp + ph;
      f.position.set(Math.cos(a) * r, y + Math.sin(t * 1.5 + ph) * 0.2, Math.sin(a) * r);
      f.rotation.y = -a - (sp > 0 ? Math.PI / 2 : -Math.PI / 2);
      tail.rotation.y = Math.sin(t * 10 + ph) * 0.5;
    });
  }
}
function lightRays(scene, anims, color, rand) {
  // weich auslaufender Strahl statt harter Platte
  const map = canvasTex(64, 256, (g, w, h) => {
    const x = g.createLinearGradient(0, 0, w, 0);
    x.addColorStop(0, '#fff0');
    x.addColorStop(0.5, '#ffff');
    x.addColorStop(1, '#fff0');
    g.fillStyle = x;
    g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'destination-in';
    const y = g.createLinearGradient(0, 0, 0, h);
    y.addColorStop(0, '#ffff');
    y.addColorStop(1, '#fff0');
    g.fillStyle = y;
    g.fillRect(0, 0, w, h);
  });
  const mat = new THREE.MeshBasicMaterial({ color, map, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  for (let i = 0; i < Math.round(6 * K); i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 22), mat);
    m.position.set((rand() - 0.5) * 2 * R, 8, (rand() - 0.5) * 2 * R);
    m.rotation.set(0, rand() * 3, 0.25);
    scene.add(m);
    const ph = rand() * 6, x0 = m.position.x;
    anims.push((t) => (m.position.x = x0 + Math.sin(t * 0.3 + ph) * 0.8));
  }
}
function scallop(c, r) {
  const g = new THREE.Group();
  const mat = M(c, { side: THREE.DoubleSide, roughness: 0.5 });
  const bottom = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat);
  bottom.scale.y = 0.35;
  bottom.position.y = r * 0.35;
  const top = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat);
  top.scale.y = 0.35;
  const hinge = new THREE.Group();
  hinge.position.set(-r, r * 0.35, 0);
  top.position.set(r, 0, 0);
  hinge.add(top);
  hinge.rotation.z = 0.75;
  const pearl = at(new THREE.Mesh(new THREE.SphereGeometry(r * 0.28, 16, 12), new THREE.MeshStandardMaterial({ color: '#fff8f0', roughness: 0.15, metalness: 0.3, emissive: '#ffe8f0', emissiveIntensity: 0.35 })), 0, r * 0.5, 0);
  g.add(bottom, hinge, pearl);
  return g;
}
function conch(c, rand) {
  const geo = new THREE.ConeGeometry(0.35, 1.1, 10, 8);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i), a = (y + 0.55) * 4, x = p.getX(i), z = p.getZ(i);
    p.setX(i, x * Math.cos(a) - z * Math.sin(a));
    p.setZ(i, x * Math.sin(a) + z * Math.cos(a));
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, M(c, { roughness: 0.45 }));
  m.rotation.z = 1.2;
  m.position.y = 0.3;
  m.rotation.y = rand() * 6;
  return group(m);
}
function starfish(c) {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2, r = i % 2 ? 0.14 : 0.38;
    i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  const m = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.07, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 1 }), M(c));
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.04;
  return group(m);
}
function column(h, c, broken) {
  const g = new THREE.Group();
  const base = at(new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.18, 0.7), M(c)), 0, 0.09, 0);
  const shaft = at(new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.27, h, 10), M(c)), 0, h / 2 + 0.18, 0);
  g.add(base, shaft);
  if (!broken) g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.16, 0.66), M(c)), 0, h + 0.26, 0));
  return g;
}


// ── Weitere Bausteine (Details) ─────────────────────────────────────────────

function teleportPad(color, anims) {
  const base = at(new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.85, 0.18, 24), M('#4a4458', { roughness: 0.6 })), 0, 0.09, 0);
  const plate = at(new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.06, 24), E(color, 0.9)), 0, 0.2, 0);
  plate.userData.rbx = { name: 'TeleportPad' };
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.05, 6, 24), E(color, 1.4));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.6;
  const g = group(base, plate, ring);
  // zwei Pfosten mit Leuchtkugeln
  for (const x of [-0.7, 0.7]) {
    g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1, 6), M('#4a4458')), x, 0.6, 0));
    g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), E(color, 1.6)), x, 1.15, 0));
  }
  anims.push((t) => {
    ring.position.y = 0.35 + ((t * 0.5) % 1) * 0.9;
    ring.material.opacity = 1;
    ring.scale.setScalar(1 - ((t * 0.5) % 1) * 0.3);
  });
  return g;
}
function fence(len, c = '#8a6a44') {
  const g = new THREE.Group();
  const n = Math.max(2, Math.round(len / 0.6) + 1);
  for (let i = 0; i < n; i++) g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.08), M(c)), -len / 2 + (i / (n - 1)) * len, 0.25, 0));
  for (const y of [0.2, 0.4]) g.add(at(new THREE.Mesh(new THREE.BoxGeometry(len, 0.05, 0.04), M(c)), 0, y, 0));
  return g;
}
function bridge(len, w = 0.9) {
  const g = new THREE.Group();
  const n = Math.round(len / 0.22);
  for (let i = 0; i < n; i++) {
    const x = -len / 2 + (i + 0.5) * (len / n);
    g.add(at(new THREE.Mesh(new THREE.BoxGeometry(len / n - 0.03, 0.06, w), M(i % 2 ? '#a07a50' : '#8a6a44')), x, 0.12 + Math.sin((i / (n - 1)) * Math.PI) * 0.12, 0));
  }
  for (const z of [-w / 2, w / 2]) {
    g.add(at(new THREE.Mesh(new THREE.BoxGeometry(len, 0.05, 0.05), M('#6b4a2e')), 0, 0.45, z));
    for (const x of [-len / 2, 0, len / 2]) g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.4, 0.07), M('#6b4a2e')), x, 0.28, z));
  }
  return g;
}
function cottage(wall, roof) {
  const body = at(new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 1), M(wall)), 0, 0.45, 0);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 1.3, 3), M(roof));
  top.rotation.set(Math.PI / 2, 0, Math.PI / 2);
  top.scale.set(1, 1, 0.85);
  top.position.y = 1.15;
  const door = at(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.5, 0.05), M('#6b4a2e')), 0, 0.25, 0.51);
  const win = at(new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.22, 0.05), E('#ffd98a', 0.6)), 0.35, 0.55, 0.51);
  const chimney = at(new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.5, 0.18), M('#8a5a4a')), -0.35, 1.35, -0.2);
  return group(body, top, door, win, chimney);
}
function signpost() {
  const pole = at(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1, 6), M('#6b4a2e')), 0, 0.5, 0);
  const board = at(new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.25, 0.05), M('#a07a50')), 0.15, 0.85, 0);
  const coin = at(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 14), M('#ffcf4a', { metalness: 0.6 })), 0.15, 0.85, 0.035);
  coin.rotation.x = Math.PI / 2;
  return group(pole, board, coin);
}
function stump(r = 0.25) {
  const s = at(new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.15, 0.3, 9), M('#6b4a2e')), 0, 0.15, 0);
  const top = at(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.9, r * 0.9, 0.02, 9), M('#c8a070')), 0, 0.31, 0);
  return group(s, top);
}
function log(len = 1.4, r = 0.17) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 8), M('#6b4a2e'));
  m.rotation.z = Math.PI / 2;
  m.position.y = r;
  const moss = at(new THREE.Mesh(new THREE.SphereGeometry(r * 0.9, 6, 4), M('#4f9a3f')), len * 0.2, r * 1.8, 0);
  moss.scale.set(1.6, 0.4, 1);
  return group(m, moss);
}
function fern(c, rand) {
  const g = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 4), M(c));
    leaf.scale.set(0.35, 0.12, 1);
    const a = (i / 5) * Math.PI * 2 + rand();
    leaf.position.set(Math.sin(a) * 0.18, 0.14, Math.cos(a) * 0.18);
    leaf.rotation.set(-0.5 * Math.cos(a), a, 0.5 * Math.sin(a));
    g.add(leaf);
  }
  return g;
}
function fountain(anims) {
  const bowl = at(new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1, 0.3, 20), M('#c9c4d6')), 0, 0.15, 0);
  const water = at(new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.04, 20), M('#4ab0e8', { roughness: 0.1, emissive: '#2a7ab8', emissiveIntensity: 0.3 })), 0, 0.29, 0);
  const pillar = at(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.8, 10), M('#c9c4d6')), 0, 0.6, 0);
  const top = at(new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.2, 0.12, 14), M('#c9c4d6')), 0, 1.02, 0);
  const coin = at(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.05, 20), M('#ffcf4a', { metalness: 0.7, roughness: 0.3, emissive: '#b8860b', emissiveIntensity: 0.4 })), 0, 1.32, 0);
  coin.rotation.x = Math.PI / 2;
  anims.push((t) => (coin.rotation.z = t * 1.5));
  return group(bowl, water, pillar, top, coin);
}
function bench() {
  const seat = at(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 0.3), M('#a07a50')), 0, 0.3, 0);
  const back = at(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.25, 0.05), M('#a07a50')), 0, 0.5, -0.14);
  const g = group(seat, back);
  for (const x of [-0.38, 0.38]) g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 0.28), M('#2a2830')), x, 0.15, 0));
  return g;
}
function iceSpike(h, rand) {
  const m = new THREE.Mesh(new THREE.ConeGeometry(0.22, h, 6), E('#bfe8ff', 0.25, { transparent: true, opacity: 0.85, roughness: 0.1 }));
  m.position.y = h / 2;
  m.rotation.set((rand() - 0.5) * 0.3, 0, (rand() - 0.5) * 0.3);
  return group(m);
}
function sled() {
  const g = new THREE.Group();
  g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 0.45), M('#c8403a')), 0, 0.2, 0));
  for (const z of [-0.2, 0.2]) {
    g.add(at(new THREE.Mesh(new THREE.BoxGeometry(1, 0.04, 0.04), M('#cfd8e8', { metalness: 0.6 })), 0.05, 0.04, z));
    for (const x of [-0.3, 0.3]) g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.16, 0.04), M('#cfd8e8')), x, 0.12, z));
  }
  return g;
}
function rails(len, anims) {
  const g = new THREE.Group();
  for (const z of [-0.22, 0.22]) g.add(at(new THREE.Mesh(new THREE.BoxGeometry(len, 0.05, 0.05), M('#8a8d96', { metalness: 0.7, roughness: 0.4 })), 0, 0.07, z));
  for (let i = 0; i < Math.round(len / 0.35); i++) g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.04, 0.65), M('#5e4430')), -len / 2 + 0.18 + i * 0.35, 0.02, 0));
  const cart = new THREE.Group();
  cart.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.35, 0.5), M('#6a6470', { metalness: 0.5, roughness: 0.5 })), 0, 0.32, 0));
  cart.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.4), E('#b07bff', 1)), 0, 0.5, 0)); // Kristallladung
  for (const x of [-0.2, 0.2])
    for (const z of [-0.22, 0.22]) {
      const w = at(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.04, 10), M('#2a2830')), x, 0.12, z);
      w.rotation.x = Math.PI / 2;
      cart.add(w);
    }
  g.add(cart);
  anims.push((t) => (cart.position.x = Math.sin(t * 0.4) * (len / 2 - 0.4)));
  return g;
}
function cupcake(c) {
  const base = at(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.22, 0.3, 10), M('#d89a5a')), 0, 0.15, 0);
  const cream = at(new THREE.Mesh(new THREE.SphereGeometry(0.33, 12, 8), M(c, { roughness: 0.4 })), 0, 0.38, 0);
  cream.scale.y = 0.75;
  const cherry = at(new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), M('#e0233a', { roughness: 0.2 })), 0, 0.66, 0);
  return group(base, cream, cherry);
}
function iceCream(c) {
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.7, 10), M('#e0a860'));
  cone.rotation.x = Math.PI;
  cone.position.y = 0.35;
  const ball = at(new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 10), M(c, { roughness: 0.4 })), 0, 0.82, 0);
  return group(cone, ball);
}
function dish() {
  const pole = at(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.8, 8), M('#cfcfd8', { metalness: 0.5 })), 0, 0.4, 0);
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 6, 0, Math.PI * 2, 0, Math.PI / 3), M('#e8e8ee', { side: THREE.DoubleSide, metalness: 0.3 }));
  bowl.rotation.x = Math.PI * 0.75;
  bowl.position.y = 1;
  const tip = at(new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), E('#ff4058', 1.5)), 0, 1.15, 0.25);
  return group(pole, bowl, tip);
}
function geyser(anims, rand) {
  const cone = at(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.45, 0.4, 10), M('#2a4fa0')), 0, 0.2, 0);
  const jet = at(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.14, 1.6, 8), E('#9fd8ff', 0.8, { transparent: true, opacity: 0.55 })), 0, 1.2, 0);
  const ph = rand() * 6;
  anims.push((t) => {
    const s = Math.max(0.05, Math.sin(t * 1.2 + ph));
    jet.scale.y = s;
    jet.position.y = 0.4 + 0.8 * s;
  });
  return group(cone, jet);
}
function solarPanel() {
  const pole = at(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 6), M('#cccccc')), 0, 0.25, 0);
  const panel = at(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.04, 0.55), M('#1a2a5a', { metalness: 0.5, roughness: 0.2 })), 0, 0.55, 0);
  panel.rotation.x = -0.5;
  return group(pole, panel);
}
function pod(c) {
  const m = at(new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), E(c, 0.6, { transparent: true, opacity: 0.85 })), 0, 0.35, 0);
  m.scale.y = 1.35;
  const cup = at(new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.2, 0.2, 10), M('#3a1a60')), 0, 0.1, 0);
  return group(m, cup);
}
function chest(anims) {
  const body = at(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.45, 0.5), M('#8a5a2e')), 0, 0.22, 0);
  const lidPivot = new THREE.Group();
  lidPivot.position.set(0, 0.45, -0.25);
  const lid = at(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.12, 0.5), M('#8a5a2e')), 0, 0.06, 0.25);
  lidPivot.add(lid);
  lidPivot.rotation.x = -0.9;
  const gold = at(new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.4), E('#ffcf4a', 0.6, { metalness: 0.7 })), 0, 0.44, 0);
  const g = group(body, lidPivot, gold);
  for (const x of [-0.3, 0.3]) g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.47, 0.52), M('#c8a040', { metalness: 0.7 })), x, 0.23, 0));
  anims.push((t) => (lidPivot.rotation.x = -0.8 - Math.sin(t * 0.8) * 0.15));
  return g;
}
function sandcastle() {
  const c = '#e8c890';
  const g = group(at(new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.45, 1.1), M(c)), 0, 0.22, 0));
  for (const [x, z] of [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]]) {
    g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.75, 8), M(c)), x, 0.37, z));
    const roof = at(new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.3, 8), M('#d8a870')), x, 0.9, z);
    g.add(roof);
  }
  g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.6, 10), M(c)), 0, 0.75, 0));
  g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.4, 0.02), M('#6b4a2e')), 0, 1.25, 0));
  g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.15, 0.02), M('#ff5f8a')), 0.13, 1.37, 0));
  return g;
}
function statue(c) {
  const ped = at(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.6), M('#d8e4ea')), 0, 0.2, 0);
  const body = at(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 0.8, 10), M(c)), 0, 0.8, 0);
  const head = at(new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), M(c)), 0, 1.33, 0);
  const staff = at(new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.5, 6), M('#ffd76a', { metalness: 0.8, roughness: 0.3 })), 0.28, 0.95, 0);
  const g = group(ped, body, head, staff);
  for (const dx of [-0.08, 0, 0.08]) g.add(at(new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.18, 5), M('#ffd76a', { metalness: 0.8 })), 0.28 + dx, 1.78, 0));
  return g;
}
function obsidian(h, rand) {
  return crystal(h, '#4a2a6a', rand, 0.3);
}
function steam(anims, rand) {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: '#ffd0b0', transparent: true, opacity: 0.25, depthWrite: false });
  const puffs = [];
  for (let i = 0; i < 4; i++) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), mat);
    g.add(p);
    puffs.push(p);
  }
  const ph = rand() * 6;
  anims.push((t) =>
    puffs.forEach((p, i) => {
      const k = (t * 0.4 + i / puffs.length + ph) % 1;
      p.position.set(Math.sin(k * 6 + i) * 0.1, 0.2 + k * 2.2, 0);
      p.scale.setScalar(0.6 + k * 1.6);
    }),
  );
  g.userData.rbx = { skip: true };
  return g;
}

// Zusätzliche Details je Welt (nach dem Grundbau)
const EXTRAS = {
  normal({ put, scatter, rand, rr, shared, spot, reserve, height }) {
    // Brücke über den Bach
    if (shared.stream) {
      const t = 0.45, p = shared.stream.getPoint(t), d = shared.stream.getTangent(t);
      const b = bridge(1.5);
      reserve(p.x, p.z, 0.9);
      put(b, p.x, p.z, { rot: false, sink: 0 });
      b.rotation.y = Math.atan2(d.x, d.z);
    }
    const h = spot(1.1, 2, R - 1.4);
    if (h) {
      const house = put(cottage('#f2e6d0', '#c8503a'), h[0], h[1], { rot: false });
      house.lookAt(0, house.position.y, 0);
      const f = put(fence(1.8), h[0] * 0.75, h[1] * 0.75 + 0.9, { rot: false });
      f.rotation.y = Math.atan2(h[0], h[1]) + Math.PI / 2;
    }
    scatter(1, () => signpost(), 0.3, 0.5, 2.5);
    scatter(2, () => stump(0.2), 0.3);
    scatter(4, () => bush(rr(0.2, 0.3), '#3f8a3a', rand), 0.3);
  },
  wald({ scatter, rand, rr }) {
    scatter(3, () => log(rr(1, 1.6)), 0.8);
    scatter(4, () => stump(rr(0.18, 0.3)), 0.35);
    scatter(10, () => fern(rand() < 0.5 ? '#3f8a46' : '#5aa850', rand), 0.25);
  },
  stadt({ put, rand, anims, reserve }) {
    // Kreisverkehr mit Brunnen in der Mitte
    reserve(0, 0, 1.1);
    put(fountain(anims), 0, 0, { rot: false });
    for (const [x, z, r] of [[1.4, 2.6, 0], [-2.6, -1.4, Math.PI / 2], [2.6, -1.5, -Math.PI / 2]]) {
      const b = put(bench(), x, z, { rot: false });
      b.rotation.y = r;
    }
  },
  eis({ scatter, rand, rr, put, spot }) {
    scatter(7, () => iceSpike(rr(0.6, 1.4), rand), 0.35);
    const s = spot(0.7);
    if (s) put(sled(), s[0], s[1]);
    scatter(4, () => rockMesh(rr(0.2, 0.4), '#cfe4f5', rand), 0.3);
  },
  lava({ scatter, rand, rr, anims }) {
    scatter(5, () => obsidian(rr(0.8, 1.4), rand), 0.45);
    scatter(3, () => steam(anims, rand), 0.3);
  },
  hoehle({ put, spot, anims }) {
    const p = spot(1.6, 1, 3);
    if (p) put(rails(3, anims), p[0], p[1]);
  },
  candy({ scatter, rand }) {
    const cols = ['#ff9ad5', '#bfe8ff', '#fff2a0', '#c8a2ff', '#a8ffb8'];
    scatter(5, (i) => cupcake(cols[i % cols.length]), 0.45);
    scatter(4, (i) => iceCream(cols[(i + 2) % cols.length]), 0.35);
  },
  mond({ put, spot, scatter, rand, rr }) {
    const p = spot(0.6);
    if (p) put(dish(), p[0], p[1]);
    scatter(5, () => rockMesh(rr(0.15, 0.3), '#8a8d96', rand), 0.25);
  },
  neptun({ scatter, rand, anims }) {
    scatter(4, () => geyser(anims, rand), 0.5);
  },
  mars({ scatter }) {
    scatter(4, () => solarPanel(), 0.6);
  },
  saturn({ scatter, rand, rr }) {
    scatter(4, () => obsidian(rr(0.6, 1), rand), 0.4);
  },
  alien({ scatter }) {
    const cols = ['#7aff5a', '#5affd8', '#ff7ae0'];
    scatter(7, (i) => pod(cols[i % 3]), 0.4);
  },
  sonne({ scatter, rand, anims }) {
    scatter(3, () => steam(anims, rand), 0.3);
  },
  korallenriff({ put, spot, anims }) {
    const p = spot(0.8, 0.5, 3.5);
    if (p) put(chest(anims), p[0], p[1]);
  },
  muschelland({ put, spot }) {
    const p = spot(1.1, 1, 3.8);
    if (p) put(sandcastle(), p[0], p[1]);
  },
  atlantis({ scatter, put, spot }) {
    for (let i = 0; i < 2; i++) {
      const p = spot(0.6, 2, R - 1.2);
      if (p) {
        const st = put(statue('#e8eef2'), p[0], p[1], { rot: false });
        st.lookAt(0, st.position.y, 0);
      }
    }
  },
};

// ── Welten ──────────────────────────────────────────────────────────────────

const BUILDERS = {
  normal({ scatter, rand, rr, root, height, reserve, shared }) {
    // Bach quer über die Insel
    const pts = [];
    for (let i = 0; i <= 16; i++) {
      const x = -R + (i / 16) * 2 * R, z = Math.sin(i * 0.45) * 1.2 + 1.5;
      if (Math.hypot(x, z) < R - 0.35) pts.push(new THREE.Vector3(x, height(x, z) + 0.03, z));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    shared.stream = curve;
    const water = new THREE.Mesh(new THREE.TubeGeometry(curve, 60, 0.35, 6), M('#4ab0e8', { roughness: 0.1, emissive: '#2a7ab8', emissiveIntensity: 0.25 }));
    water.scale.y = 0.25;
    root.add(water);
    // Bach freihalten
    for (let i = 0; i <= 24; i++) {
      const p = curve.getPoint(i / 24);
      reserve(p.x, p.z, 0.3);
    }
    scatter(6, () => roundTree(rr(1.6, 2.4), ['#4f9a3f', '#5fae4f', '#3f8a3a'][Math.floor(rand() * 3)], rand), 0.9, 1, R - 1);
    scatter(5, () => bush(rr(0.3, 0.45), '#4a9a44', rand), 0.4);
    scatter(4, () => rockMesh(rr(0.25, 0.45), '#8a8794', rand), 0.4);
    scatter(16, () => flower(['#ff7a9a', '#ffe25f', '#ffffff', '#b07bff'][Math.floor(rand() * 4)]), 0.2);
  },

  wald({ put, scatter, rand, rr }) {
    scatter(3, () => mushroom(rr(1, 1.5), '#e0433a', rand), 0.8, 0.5, 3.5);
    scatter(16, () => pine(rr(2, 3.4), ['#2f6b3a', '#24583a', '#3a7a40'][Math.floor(rand() * 3)], rand), 0.75);
    scatter(6, () => mushroom(rr(0.3, 0.5), rand() < 0.5 ? '#e0433a' : '#c8a2ff', rand, true), 0.3);
    scatter(4, () => rockMesh(rr(0.3, 0.5), '#5a6458', rand), 0.4);
    scatter(6, () => bush(rr(0.25, 0.4), '#2f7a3a', rand), 0.3);
  },

  stadt({ put, root, scatter, rand, rr, reserve, free }) {
    // Straßenkreuz
    const road = M('#3a3842', { roughness: 0.95 });
    for (const rot of [0, Math.PI / 2]) {
      const r = new THREE.Mesh(new THREE.BoxGeometry(R * 2 - 0.4, 0.05, 1.1), road);
      r.rotation.y = rot;
      r.position.y = 0.32; // ebener Stadtboden liegt bei 0,3
      root.add(r);
      for (let i = -(R - 1); i <= R - 1; i++) {
        const line = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.06, 0.06), M('#ffe25f'));
        line.position.set(rot ? 0 : i, 0.33, rot ? i : 0);
        line.rotation.y = rot;
        root.add(line);
      }
    }
    for (let i = -2 * R; i <= 2 * R; i++) {
      reserve(i * 0.5, 0, 0.6);
      reserve(0, i * 0.5, 0.6);
    }
    const colors = ['#c9c4d6', '#8fa8c8', '#d6b89a', '#a8b8a0', '#e0d4c0', '#7a8aa8'];
    for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      const n = 2 + Math.floor(rand() * 2);
      for (let i = 0; i < n + Math.round(1.5 * AREA); i++) {
        // innen Hochhäuser, außen niedrigere
        const outer = i >= n, lo = outer ? 4.4 : 1.4, hi = outer ? R - 1.6 : 3.8;
        const x = sx * rr(lo, hi), z = sz * rr(lo, hi);
        if (Math.hypot(x, z) > R - 1.2) continue;
        if (!free(x, z, 0.9)) continue;
        const b = building(rr(0.9, 1.4), outer ? rr(1, 2.4) : rr(1.4, 4.2), rr(0.9, 1.3), colors[Math.floor(rand() * colors.length)]);
        reserve(x, z, 0.9);
        put(b, x, z, { rot: false });
      }
    }
    for (let d = 2.4; d < R - 0.8; d += 1.8)
      for (const [x, z] of [[0.8, d], [-0.8, -d], [d, -0.8], [-d, 0.8]]) put(lamp(), x, z, { rot: false });
    const c1 = put(car('#e0433a'), 2, -0.25, { rot: false });
    const c2 = put(car('#3a8fd1'), -0.25, -2.5, { rot: false });
    c2.rotation.y = Math.PI / 2;
    scatter(5, () => roundTree(rr(1, 1.4), '#4f9a3f', rand), 0.5, 4.2, R - 0.6);
    return [c1, c2];
  },

  eis({ put, scatter, rand, rr, root }) {
    const ig = new THREE.Group();
    const shell = new THREE.Mesh(new THREE.SphereGeometry(1.1, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2), M('#ffffff', { roughness: 0.5 }));
    const door = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.8, 10, 1, false, 0, Math.PI), M('#f2f8ff'));
    door.rotation.set(0, 0, Math.PI / 2);
    door.rotation.order = 'ZYX';
    door.position.set(1.05, 0, 0);
    const hole = at(new THREE.Mesh(new THREE.CircleGeometry(0.35, 12, 0, Math.PI), M('#2a3a50')), 1.46, 0.02, 0);
    hole.rotation.y = Math.PI / 2;
    ig.add(shell, door, hole);
    put(ig, -1.5, -1, { rot: false });
    scatter(9, () => crystal(rr(0.9, 1.6), rand() < 0.5 ? '#8ae6ff' : '#bfe8ff', rand, 0.7), 0.6);
    scatter(7, () => pine(rr(1.6, 2.4), '#e8f4ff', rand), 0.7);
    // Schneemann
    const sm = new THREE.Group();
    [[0.42, 0.38], [0.3, 0.95], [0.22, 1.35]].forEach(([r, y]) => sm.add(at(new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), M('#ffffff')), 0, y, 0)));
    const nose = at(new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.25, 6), M('#ff8a2a')), 0.25, 1.36, 0);
    nose.rotation.z = -Math.PI / 2;
    sm.add(nose);
    put(sm, 1.8, 1.4);
    // gefrorener See
    const lake = new THREE.Mesh(new THREE.CircleGeometry(1.3, 20), M('#a8dcff', { roughness: 0.05, metalness: 0.3 }));
    lake.rotation.x = -Math.PI / 2;
    put(lake, 1.6, -2, { sink: -0.04, rot: false });
  },

  lava({ put, scatter, rand, rr, root, anims, world }) {
    const vol = new THREE.Group();
    const cone = new THREE.Mesh(jitter(new THREE.CylinderGeometry(0.7, 2.4, 2.8, 12, 3, true), rand, 0.25, (x, y) => y > 1.3), M('#2a201c'));
    cone.position.y = 1.4;
    const lavaTop = at(new THREE.Mesh(new THREE.CircleGeometry(0.72, 14), E('#ff4a00', 1.1)), 0, 2.7, 0);
    lavaTop.rotation.x = -Math.PI / 2;
    vol.add(cone, lavaTop);
    // Lavastrom den Hang hinunter
    const path = new THREE.CatmullRomCurve3([new THREE.Vector3(0.5, 2.75, 0), new THREE.Vector3(1.3, 1.6, 0.4), new THREE.Vector3(2.3, 0.4, 0.2), new THREE.Vector3(3.6, 0.2, -0.6)]);
    const flow = new THREE.Mesh(new THREE.TubeGeometry(path, 30, 0.18, 6), E('#ff5000', 1));
    vol.add(flow);
    put(vol, -0.8, -0.6, { rot: false });
    const glow = new THREE.PointLight('#ff6a1a', 25, 9 * K, 2);
    glow.position.set(-0.8, 3.4, -0.6);
    root.add(glow);
    const pools = [];
    for (let i = 0; i < 4; i++) {
      const pool = new THREE.Mesh(new THREE.CircleGeometry(rr(0.4, 0.8), 14), E('#ff3a00', 1));
      pool.rotation.x = -Math.PI / 2;
      const p = [[2.8, 2.2], [-3, 2.4], [1.2, -3.4], [-3.6, -1.6]][i];
      put(pool, p[0], p[1], { sink: -0.03, rot: false });
      pools.push(pool);
    }
    anims.push((t) => {
      pools.forEach((p, i) => (p.material.emissiveIntensity = 0.9 + Math.sin(t * 2 + i) * 0.3));
      lavaTop.material.emissiveIntensity = 1.1 + Math.sin(t * 3) * 0.35;
      glow.intensity = 22 + Math.sin(t * 3) * 6;
    });
    scatter(10, () => rockMesh(rr(0.25, 0.6), '#1a1614', rand, rand() < 0.3 ? E('#ff3a0a', 0.6) : null), 0.45);
    scatter(5, () => {
      const t = group(trunk(rr(0.8, 1.3), '#1a1412', 0.08));
      return t;
    }, 0.3);
  },

  hoehle({ put, scatter, rand, rr, root, anims, world }) {
    const arch = new THREE.Mesh(jitter(new THREE.TorusGeometry(4.6, 0.85, 7, 18, Math.PI), rand, 0.5), M('#3a3446'));
    arch.position.set(0, -0.1, -0.6);
    arch.castShadow = true;
    root.add(arch);
    for (let i = 0; i < 7; i++) {
      const a = Math.PI * (0.12 + (i / 6) * 0.76);
      const st = new THREE.Mesh(new THREE.ConeGeometry(rr(0.12, 0.25), rr(0.5, 1.1), 6), M('#2e2838'));
      st.rotation.x = Math.PI;
      st.position.set(Math.cos(a) * 3.8, Math.sin(a) * 3.8 - 0.4, -0.6);
      root.add(st);
    }
    const colors = ['#b07bff', '#6ae8ff', '#ff7ae0'];
    const cr = [];
    scatter(11, (i) => {
      const c = crystal(rr(0.8, 1.7), colors[i % 3], rand, 1.4);
      cr.push(c);
      return c;
    }, 0.55);
    scatter(8, () => {
      const s = new THREE.Mesh(new THREE.ConeGeometry(rr(0.15, 0.3), rr(0.6, 1.4), 6), M('#4a4458'));
      s.position.y = 0.3;
      return group(s);
    }, 0.35);
    scatter(4, () => mushroom(rr(0.35, 0.6), '#6ae8ff', rand, true), 0.3);
    const light = new THREE.PointLight('#b07bff', 20, 12 * K, 2);
    light.position.set(0, 2.5, 0);
    root.add(light);
    anims.push((t) => (light.intensity = 18 + Math.sin(t * 1.5) * 5));
  },

  candy({ put, scatter, rand, rr }) {
    const cols = ['#ff5fb0', '#5fd3ff', '#ffe25f', '#7aff8a', '#b07bff', '#ff8a3d'];
    scatter(4, (i) => lollipop(cols[i % cols.length], rand), 0.8, 1, R - 1);
    scatter(4, () => candyCane(), 0.7);
    scatter(4, () => donut(['#ff9ad5', '#7a4a2a', '#bfe8ff'][Math.floor(rand() * 3)]), 0.6);
    scatter(12, (i) => gumdrop(cols[i % cols.length]), 0.3);
    scatter(5, () => {
      // Zuckerwatte-Baum
      return roundTree(rr(1.4, 2), ['#ffc2e2', '#c2e8ff', '#e2c2ff'][Math.floor(rand() * 3)], rand);
    }, 0.8);
  },

  mond({ put, scatter, rand, rr, scene }) {
    planetBackdrop(scene, { color: '#2a6ad1', bands: ['#3fae5a', '#ffffff55', '#2f8a4a', '#ffffff40'], size: 6, pos: [-20, 5, -32], glow: '#4a8aff' });
    scatter(6, () => crater(rr(0.6, 1.1), '#a0a3ac', rand), 1.1);
    put(flag('#ffd76a'), 0.6, 0.4);
    scatter(8, () => rockMesh(rr(0.2, 0.45), '#9a9da6', rand), 0.35);
    // Mondlandefähre
    const lander = new THREE.Group();
    lander.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.6, 8), M('#e8c86a', { metalness: 0.5, roughness: 0.4 })), 0, 0.8, 0));
    lander.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.45, 0.6), M('#d8d8d8')), 0, 1.3, 0));
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.78;
      const leg = at(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 5), M('#bbbbbb')), Math.cos(a) * 0.55, 0.4, Math.sin(a) * 0.55);
      leg.rotation.set(Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4);
      lander.add(leg);
    }
    put(lander, -2, -1.6);
  },

  neptun({ scatter, rand, rr, scene, anims, put }) {
    planetBackdrop(scene, { color: '#2a5ad8', bands: ['#4a8aff', '#1a3a9a', '#6aa8ff', '#2a4ab8', '#8ac8ff'], size: 10, pos: [24, 8, -38], glow: '#3a7aff' });
    scatter(10, () => crystal(rr(1.2, 2.6), rand() < 0.5 ? '#3a9aff' : '#6ac8ff', rand, 1), 0.7);
    scatter(8, () => rockMesh(rr(0.3, 0.6), '#2a4fa0', rand), 0.45);
    // Sturmwirbel in der Mitte
    const vortex = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.4 + i * 0.25, 0.04, 6, 30), E('#9fd8ff', 1.2, { transparent: true, opacity: 0.6 }));
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.3 + i * 0.5;
      vortex.add(ring);
    }
    put(vortex, 0, 0, { rot: false });
    anims.push((t) => vortex.children.forEach((r, i) => (r.rotation.z = t * (1 + i * 0.4))));
  },

  mars({ put, scatter, rand, rr, scene }) {
    planetBackdrop(scene, { color: '#d8743a', bands: ['#b0502a', '#e8a070'], size: 4, pos: [20, 16, -40], glow: '#ff9a5a' }); // Phobos-ähnlicher Mond
    put(rover(), 1.6, 1.2);
    const base = new THREE.Group();
    base.add(dome(1, '#cfe8ff', '#e0e0e0'));
    const tunnel = at(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.2, 10), M('#e0e0e0')), 1.4, 0.3, 0);
    tunnel.rotation.z = Math.PI / 2;
    base.add(tunnel, at(dome(0.6, '#cfe8ff', '#e0e0e0'), 2.2, 0, 0));
    put(base, -2.6, -1);
    scatter(12, () => rockMesh(rr(0.25, 0.7), ['#8a3a1e', '#a0482a', '#6a2a16'][Math.floor(rand() * 3)], rand), 0.5);
    put(flag('#ffd76a'), 0.4, -2.8);
  },

  saturn({ root, scatter, rand, rr, anims, scene }) {
    planetBackdrop(scene, { color: '#d8b880', bands: ['#c8a060', '#e8d0a0', '#b08850', '#f0dcb0'], size: 6, pos: [-30, 3, -44], ring: '220, 190, 140', glow: '#ffd8a0' });
    // Ring um die Insel
    const rt = canvasTex(256, 256, (g) => {
      for (let r = 128; r > 80; r -= 3) {
        g.strokeStyle = `rgba(255, ${200 + ((r * 13) % 50)}, ${140 + ((r * 7) % 60)}, ${0.35 + ((r * 7) % 10) / 18})`;
        g.lineWidth = 2.5;
        g.beginPath();
        g.arc(128, 128, r, 0, Math.PI * 2);
        g.stroke();
      }
    });
    const ring = new THREE.Mesh(new THREE.RingGeometry(R + 1.2, R + 3.8, 80), new THREE.MeshBasicMaterial({ map: rt, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
    ring.userData.rbx = { color: '#e8d0a0', transparency: 0.35 };
    ring.rotation.x = -Math.PI / 2 + 0.25;
    ring.position.y = 0.4;
    root.add(ring);
    const chunks = new THREE.Group();
    for (let i = 0; i < 24; i++) {
      const s = rr(0.08, 0.28);
      const c = new THREE.Mesh(jitter(new THREE.DodecahedronGeometry(s, 0), rand, s * 0.4), M('#c8a870'));
      const a = (i / 24) * Math.PI * 2 + rand() * 0.2, r = rr(R + 1.5, R + 3.4);
      c.position.set(Math.cos(a) * r, rr(-0.15, 0.15), Math.sin(a) * r);
      chunks.add(c);
    }
    chunks.rotation.x = 0.25;
    chunks.position.y = 0.4;
    root.add(chunks);
    anims.push((t) => {
      chunks.rotation.y = t * 0.1;
      ring.rotation.z = t * 0.05;
    });
    scatter(9, () => rockMesh(rr(0.3, 0.7), '#b0905a', rand), 0.5);
    scatter(6, () => crystal(rr(0.6, 1.1), '#ffe2a0', rand, 0.8), 0.5);
  },

  alien({ put, scatter, rand, rr, root, anims, scene }) {
    planetBackdrop(scene, { color: '#5a1a8a', bands: ['#7a2ab0', '#3a0a60', '#9a4ad0'], size: 7, pos: [22, 12, -36], glow: '#b07bff' });
    scatter(14, (i) => alienPlant(['#3a8a4a', '#2a6a7a'][i % 2], ['#7aff5a', '#5affd8', '#ff7ae0'][i % 3], rand), 0.5);
    scatter(6, () => mushroom(rr(0.5, 0.9), '#5affd8', rand, true), 0.4);
    scatter(5, () => rockMesh(rr(0.3, 0.6), '#3a1a60', rand), 0.4);
    // UFO
    const ufo = new THREE.Group();
    const disk = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12), M('#b8c0cc', { metalness: 0.8, roughness: 0.3, flatShading: false }));
    disk.scale.set(1.3, 0.28, 1.3);
    const cab = at(new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#7affd8', transparent: true, opacity: 0.6, roughness: 0.05, emissive: '#2a8a6a', emissiveIntensity: 0.6 })), 0, 0.15, 0);
    ufo.add(disk, cab);
    const lights = [];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const l = at(new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 4), E('#7aff5a', 2.5)), Math.cos(a) * 1.25, -0.02, Math.sin(a) * 1.25);
      ufo.add(l);
      lights.push(l);
    }
    const beam = new THREE.Mesh(new THREE.ConeGeometry(1, 3.4, 20, 1, true), new THREE.MeshBasicMaterial({ color: '#7aff5a', transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
    beam.position.y = -1.75;
    ufo.add(beam);
    ufo.position.set(1.2, 4, -0.8);
    root.add(ufo);
    anims.push((t) => {
      ufo.rotation.y = t * 0.8;
      ufo.position.y = 4 + Math.sin(t * 1.2) * 0.25;
      lights.forEach((l, i) => (l.material.emissiveIntensity = ((i + Math.floor(t * 6)) % 3 === 0 ? 3 : 0.6)));
    });
  },

  sonne({ put, scatter, rand, rr, root, anims, scene }) {
    const sunBall = planetBackdrop(scene, { color: '#ffd84a', bands: ['#ffb02e', '#fff2a0', '#ff8a1a'], size: 12, pos: [0, 4, -45], glow: '#ff9a2a', emissive: true });
    // Sonnenbögen
    const arcs = [];
    for (let i = 0; i < 4; i++) {
      const arc = new THREE.Mesh(new THREE.TorusGeometry(rr(0.8, 1.5), 0.13, 8, 24, Math.PI), E(i % 2 ? '#ff8a1a' : '#ff4a00', 1.1));
      const g = group(arc);
      put(g, ...[[2.4, 1.6], [-2.6, 1.2], [1, -3], [-1.6, -2.8]][i]);
      arcs.push(arc);
    }
    anims.push((t) => {
      arcs.forEach((a, i) => (a.scale.setScalar(1 + Math.sin(t * 2 + i) * 0.08)));
      sunBall.rotation.y = t * 0.03;
    });
    scatter(10, () => rockMesh(rr(0.25, 0.6), '#a02a08', rand, E('#c83a08', 0.6)), 0.45);
    scatter(6, () => crystal(rr(0.8, 1.4), '#ffc83a', rand, 1.4), 0.5);
    const glow = new THREE.PointLight('#ffb02e', 30, 14 * K, 2);
    glow.position.set(0, 3, 0);
    root.add(glow);
  },

  korallenriff({ scatter, rand, rr, root, anims, scene }) {
    lightRays(scene, anims, '#bff8ff', rand);
    const cols = ['#ff7a8a', '#ffb05a', '#ff5fb0', '#b07bff', '#ffe25f'];
    scatter(10, (i) => coral(cols[i % cols.length], rand), 0.6);
    scatter(6, (i) => brainCoral(['#ff9a7a', '#d87aff', '#7ad8a0'][i % 3], rand), 0.55);
    scatter(10, () => seaweed(rand() < 0.5 ? '#2f8a5a' : '#4aa86a', rand, anims), 0.3);
    scatter(4, () => rockMesh(rr(0.3, 0.55), '#8a7050', rand), 0.4);
    fishSchool(root, anims, rand, ['#ffb02e', '#5fd3ff', '#ff5fb0', '#ffe25f'], 9);
  },

  muschelland({ scatter, rand, rr, root, anims, scene, put }) {
    lightRays(scene, anims, '#e0fbff', rand);
    put(scallop('#ffc8d8', 1.2), -1.2, -0.6);
    scatter(4, (i) => scallop(['#ffd8b0', '#ffe8f0', '#e8d0ff'][i % 3], rr(0.45, 0.7)), 0.8);
    scatter(6, (i) => conch(['#ffb08a', '#f2d0b0', '#ffc8e0'][i % 3], rand), 0.55);
    scatter(8, (i) => starfish(['#ff7a4a', '#ff5f8a', '#ffb02e'][i % 3]), 0.4);
    scatter(6, () => seaweed('#3a9a6a', rand, anims), 0.3);
    fishSchool(root, anims, rand, ['#ffd0e8', '#bff0ff', '#ffe25f'], 6);
  },

  atlantis({ put, scatter, rand, rr, root, anims, scene, reserve }) {
    lightRays(scene, anims, '#9ff3f0', rand);
    // Tempel
    const temple = new THREE.Group();
    temple.add(at(new THREE.Mesh(new THREE.BoxGeometry(3, 0.25, 2.2), M('#e8eef2')), 0, 0.12, 0));
    temple.add(at(new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.2, 1.9), M('#dfe7ec')), 0, 0.35, 0));
    for (const x of [-1.1, -0.37, 0.37, 1.1])
      for (const z of [-0.75, 0.75]) temple.add(at(column(1.6, '#f2f6f8'), x, 0.45, z));
    temple.add(at(new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.22, 2.1), M('#e8eef2')), 0, 2.45, 0));
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 2.9, 3), M('#d8e4ea'));
    roof.rotation.set(0, 0, Math.PI / 2);
    roof.scale.set(1, 1, 0.5);
    roof.position.y = 2.9;
    temple.add(roof);
    reserve(-1.4, -1.6, 1.9);
    put(temple, -1.4, -1.6, { rot: false });
    temple.rotation.y = 0.5;
    // goldene Kuppel
    const d = dome(1.1, '#9ff3f0', '#c8a040');
    const spire = at(new THREE.Mesh(new THREE.ConeGeometry(0.18, 1.3, 8), E('#ffd76a', 1.2, { metalness: 0.8 })), 0, 0.65, 0);
    d.add(spire);
    reserve(2.2, 1.4, 1.2);
    put(d, 2.2, 1.4, { rot: false });
    anims.push((t) => (spire.material.emissiveIntensity = 1 + Math.sin(t * 2) * 0.5));
    scatter(6, () => {
      const c = column(rr(0.5, 1.3), '#e8eef2', true);
      c.rotation.z = (rand() - 0.5) * 0.3;
      return c;
    }, 0.5);
    scatter(5, () => seaweed('#2f8a6a', rand, anims), 0.3);
    scatter(4, (i) => coral(['#ff7a8a', '#ffb05a'][i % 2], rand), 0.5);
    fishSchool(root, anims, rand, ['#ffd76a', '#9ff3f0'], 6);
  },
};
