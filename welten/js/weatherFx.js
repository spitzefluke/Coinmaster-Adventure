// Wetter als 3D-Schicht über einer Welt aus buildWorld(): Himmel, Licht, Nebel und Effekte.
//
//   const fx = createWeatherFx(built, 'gewitter');
//   jedes Bild nach built.update(): fx.update(t, dt);   am Ende: fx.dispose();
//
// Blitze und Farbwechsel sind bewusst ruhig gehalten (kein schnelles Flackern).

import * as THREE from 'three';
import { weatherById } from '../../muenzen/js/mutations.js';

const TAU = Math.PI * 2;

function tex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const dot = () =>
  tex(64, 64, (g) => {
    const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, '#fff');
    r.addColorStop(0.35, '#ffffffcc');
    r.addColorStop(1, '#fff0');
    g.fillStyle = r;
    g.fillRect(0, 0, 64, 64);
  });
const glyph = (ch) =>
  tex(64, 64, (g) => {
    g.fillStyle = '#fff';
    g.font = '700 50px JetBrains Mono, monospace';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(ch, 32, 35);
  });
const skyGrad = (top, bottom) =>
  tex(4, 256, (g, w, h) => {
    const l = g.createLinearGradient(0, 0, 0, h);
    l.addColorStop(0, top);
    l.addColorStop(1, bottom);
    g.fillStyle = l;
    g.fillRect(0, 0, w, h);
  });
const mix = (a, b, k) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), k).getHexString();

export function createWeatherFx(built, weatherId, { amount = 1 } = {}) {
  const w = weatherById[weatherId];
  const { scene, radius: R, height } = built;
  const world = built.world ?? {};
  const g = new THREE.Group();
  g.name = 'Wetter';
  g.userData.rbx = { skip: true };
  scene.add(g);
  const disposables = [];
  const track = (x) => (disposables.push(x), x);
  const ups = [];
  if (!w || w.id === 'klar') return { update() {}, dispose() { scene.remove(g); }, weather: w };

  // ── Himmel, Licht, Nebel ──
  const old = { bg: scene.background, fog: scene.fog ? { color: scene.fog.color.clone(), near: scene.fog.near, far: scene.fog.far } : null, hemi: built.lights?.hemi.intensity, sun: built.lights?.sun.intensity };
  const k = (w.light ?? 1) < 0.5 ? 0.96 : 0.75; // Nacht-Wetter: Himmel fast ganz dunkel
  let skyTex = null;
  if (scene.background?.isTexture && world.sky) {
    skyTex = track(skyGrad(mix(world.sky[0], w.sky, k), mix(world.sky[1], w.sky, k * 0.8)));
    scene.background = skyTex;
  }
  const fogCol = new THREE.Color(mix(world.sky?.[1] ?? '#888888', w.sky, k));
  const thick = { regen: 0.7, gewitter: 0.6, schneesturm: 0.45, erdbeben: 0.8, blutmond: 0.8, datensturm: 0.75 }[w.id] ?? 1;
  if (scene.fog) {
    scene.fog.color.copy(fogCol);
    scene.fog.far = old.fog.far * thick;
    scene.fog.near = old.fog.near * thick;
  }
  // Licht in Wetterfarbe tönen (z. B. rot beim Blutmond)
  const tint = { disconacht: 0.3, blutmond: 0.55, neonsturm: 0.3, goldregen: 0.35, datensturm: 0.45, sternschnuppen: 0.3, gewitter: 0.15 }[w.id];
  if (tint && built.lights) {
    const h0 = built.lights.hemi.color.clone(), s0 = built.lights.sun.color.clone();
    built.lights.hemi.color.lerp(new THREE.Color(w.color), tint);
    built.lights.sun.color.lerp(new THREE.Color(w.color), tint);
    disposables.push({ dispose: () => (built.lights.hemi.color.copy(h0), built.lights.sun.color.copy(s0)) });
  }
  const hub = !!world.hub; // im Spawn stellt der Tag-Nacht-Wechsel Himmel und Licht jedes Bild neu
  const applyLight = () => {
    if (!built.lights) return;
    const f = w.light ?? 1;
    built.lights.hemi.intensity = (hub ? built.lights.hemi.intensity : old.hemi) * f;
    built.lights.sun.intensity = (hub ? built.lights.sun.intensity : old.sun) * f;
    if (hub && scene.background?.isColor) {
      scene.background.lerp(new THREE.Color(w.sky), k * 0.8);
      scene.fog?.color.copy(scene.background);
    }
  };
  applyLight();

  // ── Bausteine ──
  const area = R + 3;
  // Punktwolke, die per Funktion bewegt wird; f(i, t, out) setzt x, y, z
  function cloud(n, { size, color, map, additive = true, opacity = 1, colors }) {
    n = Math.max(8, Math.round(n * amount));
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
    const c = new THREE.Color();
    for (let i = 0; i < n; i++) {
      c.set(colors ? colors[i % colors.length] : color);
      col.set([c.r, c.g, c.b], i * 3);
    }
    const geo = track(new THREE.BufferGeometry());
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const mat = track(new THREE.PointsMaterial({ size, map: track(map ?? dot()), vertexColors: true, transparent: true, opacity, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending }));
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    g.add(pts);
    const seeds = Array.from({ length: n }, () => [Math.random(), Math.random(), Math.random(), Math.random()]);
    return { pts, pos, col, n, seeds, mat };
  }
  const inDisc = (s) => {
    const a = s[0] * TAU, r = Math.sqrt(s[1]) * area;
    return [Math.cos(a) * r, Math.sin(a) * r];
  };
  // fallende Striche (Regen)
  function streaks(n, color, len, speed, wind = 0.15, opacity = 0.55) {
    n = Math.max(20, Math.round(n * amount));
    const pos = new Float32Array(n * 6);
    const geo = track(new THREE.BufferGeometry());
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = track(new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false }));
    const l = new THREE.LineSegments(geo, mat);
    l.frustumCulled = false;
    g.add(l);
    const seeds = Array.from({ length: n }, () => [Math.random(), Math.random(), Math.random()]);
    ups.push((t) => {
      for (let i = 0; i < n; i++) {
        const s = seeds[i], [x, z] = inDisc(s);
        const y = 14 - ((t * speed * (0.8 + s[2] * 0.4) + s[2] * 14) % 15);
        pos.set([x + wind * y, y, z, x + wind * (y + len), y + len, z], i * 6);
      }
      geo.attributes.position.needsUpdate = true;
    });
    return l;
  }
  function moon(color, size, pos, glowCol, glowSize) {
    const m = new THREE.Mesh(track(new THREE.SphereGeometry(size, 32, 20)), track(new THREE.MeshBasicMaterial({ color, fog: false })));
    m.position.set(...pos);
    g.add(m);
    const s = new THREE.Sprite(track(new THREE.SpriteMaterial({ map: track(dot()), color: glowCol, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })));
    s.scale.setScalar(glowSize);
    s.position.copy(m.position);
    g.add(s);
    return { m, s };
  }
  function cloudBank(color, n, y, opacity = 0.9) {
    const mat = track(new THREE.MeshStandardMaterial({ color, roughness: 1, flatShading: true, transparent: opacity < 1, opacity }));
    const geo = track(new THREE.IcosahedronGeometry(1, 1));
    const list = [];
    for (let i = 0; i < n; i++) {
      const c = new THREE.Group();
      for (let j = 0; j < 4; j++) {
        const b = new THREE.Mesh(geo, mat);
        const s = 1.4 + Math.random() * 1.6;
        b.scale.set(s * 1.4, s * 0.7, s);
        b.position.set((j - 1.5) * 1.6 + Math.random(), Math.random() * 0.6, Math.random() * 1.2);
        c.add(b);
      }
      const a = (i / n) * TAU + Math.random(), r = Math.random() * R * 0.9;
      c.position.set(Math.cos(a) * r, y + Math.random() * 2, Math.sin(a) * r);
      g.add(c);
      list.push([c, a, r, 0.01 + Math.random() * 0.02]);
    }
    ups.push((t) => list.forEach(([c, a, r, sp]) => c.position.set(Math.cos(a + t * sp) * r, c.position.y, Math.sin(a + t * sp) * r)));
    return mat;
  }
  function bolt() {
    const mat = track(new THREE.MeshBasicMaterial({ color: '#fff7c0', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    const m = new THREE.Mesh(track(new THREE.BufferGeometry()), mat);
    g.add(m);
    const light = new THREE.PointLight('#dfe8ff', 0, R * 3, 1.5);
    g.add(light);
    return {
      mat,
      light,
      strike() {
        const a = Math.random() * TAU, r = Math.random() * R * 0.85;
        const x = Math.cos(a) * r, z = Math.sin(a) * r, y0 = height(x, z);
        const pts = [];
        for (let i = 0; i <= 12; i++) {
          const k = i / 12;
          pts.push(new THREE.Vector3(x + (i && i < 12 ? (Math.random() - 0.5) * 1.6 : 0), y0 + (1 - k) * 15, z + (i && i < 12 ? (Math.random() - 0.5) * 1.6 : 0)));
        }
        m.geometry.dispose();
        m.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0), 36, 0.09, 5);
        light.position.set(x, y0 + 6, z);
      },
    };
  }

  // ── Wetter ──
  const W = {
    regen() {
      streaks(1400, '#cfe8ff', 0.6, 14, 0.12);
      cloudBank('#7a8a9a', 6, 13, 0.95);
      // Pfützen
      const pm = track(new THREE.MeshStandardMaterial({ color: '#7ab8e0', roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.7 }));
      for (let i = 0; i < Math.round(14 * amount); i++) {
        const a = Math.random() * TAU, r = Math.sqrt(Math.random()) * (R - 1.5);
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        const p = new THREE.Mesh(track(new THREE.CircleGeometry(0.4 + Math.random() * 0.6, 16)), pm);
        p.rotation.x = -Math.PI / 2;
        p.scale.y = 0.7;
        p.position.set(x, height(x, z) + 0.025, z);
        g.add(p);
      }
      // Ringe auf den Pfützen
      const rings = cloud(60, { size: 0.25, color: '#dff4ff', opacity: 0.6 });
      ups.push((t) => {
        for (let i = 0; i < rings.n; i++) {
          const s = rings.seeds[i], [x, z] = inDisc(s), k = (t * 1.5 + s[2]) % 1;
          rings.pos.set([x, height(x, z) + 0.05, z], i * 3);
          const b = 1 - k;
          rings.col.set([b, b, b], i * 3);
        }
        rings.pts.geometry.attributes.position.needsUpdate = rings.pts.geometry.attributes.color.needsUpdate = true;
      });
    },
    gewitter() {
      streaks(1000, '#c8d4e4', 0.7, 16, 0.25, 0.45);
      cloudBank('#3a4050', 9, 12, 1);
      const b = bolt();
      let next = 1, flashT = -9;
      ups.push((t) => {
        if (t > next) {
          b.strike();
          flashT = t;
          next = t + 2.5 + Math.random() * 3; // höchstens alle 2,5 Sekunden
        }
        const e = t - flashT, f = e < 0.6 ? Math.exp(-e * 6) : 0;
        b.mat.opacity = f;
        b.light.intensity = f * 300;
      });
    },
    erdbeben() {
      // Beben der Insel: weich, wenige Pixel
      const root = built.root;
      const base = root.position.clone();
      ups.push((t) => {
        const s = 0.5 + 0.5 * Math.sin(t * 0.7);
        root.position.set(base.x + Math.sin(t * 23) * 0.05 * s, base.y + Math.sin(t * 31) * 0.03 * s, base.z + Math.cos(t * 19) * 0.05 * s);
      });
      disposables.push({ dispose: () => root.position.copy(base) });
      // Risse im Boden
      const cm = track(new THREE.MeshBasicMaterial({ color: '#2a1a10' }));
      for (let i = 0; i < Math.round(10 * amount); i++) {
        const a = Math.random() * TAU, r = Math.random() * (R - 2);
        let x = Math.cos(a) * r, z = Math.sin(a) * r, dir = Math.random() * TAU;
        for (let j = 0; j < 6; j++) {
          const len = 0.5 + Math.random() * 0.6, nx = x + Math.cos(dir) * len, nz = z + Math.sin(dir) * len;
          const seg = new THREE.Mesh(track(new THREE.BoxGeometry(len, 0.03, 0.08)), cm);
          seg.position.set((x + nx) / 2, height((x + nx) / 2, (z + nz) / 2) + 0.03, (z + nz) / 2);
          seg.rotation.y = -dir;
          g.add(seg);
          x = nx;
          z = nz;
          dir += (Math.random() - 0.5) * 1.2;
        }
      }
      // fallende Steine und Staub
      const rockGeo = track(new THREE.DodecahedronGeometry(0.22, 0)), rockMat = track(new THREE.MeshStandardMaterial({ color: '#7d7166', flatShading: true }));
      const rocks = Array.from({ length: Math.round(16 * amount) }, () => {
        const m = new THREE.Mesh(rockGeo, rockMat);
        g.add(m);
        return [m, Math.random() * TAU, Math.sqrt(Math.random()) * (R - 1), Math.random()];
      });
      const dust = cloud(160, { size: 0.9, color: '#c9b49a', additive: false, opacity: 0.35 });
      ups.push((t) => {
        rocks.forEach(([m, a, r, off]) => {
          const k = (t * 0.35 + off) % 1, x = Math.cos(a) * r, z = Math.sin(a) * r, gy = height(x, z);
          m.position.set(x, gy + 12 * (1 - k * k), z);
          m.rotation.set(t * 3 + off * 9, t * 2, 0);
        });
        for (let i = 0; i < dust.n; i++) {
          const s = dust.seeds[i], [x, z] = inDisc(s);
          dust.pos.set([x + Math.sin(t * 0.3 + s[2] * 9), height(x, z) + 0.3 + s[3] * 1.6 + Math.sin(t + s[2] * 6) * 0.2, z], i * 3);
        }
        dust.pts.geometry.attributes.position.needsUpdate = true;
      });
    },
    schneesturm() {
      const snow = cloud(2600, { size: 0.3, color: '#ffffff', additive: false, opacity: 0.95 });
      ups.push((t) => {
        for (let i = 0; i < snow.n; i++) {
          const s = snow.seeds[i];
          const y = 14 - ((t * (1.2 + s[2]) + s[3] * 14) % 14);
          // Wind treibt seitlich
          const a = s[0] * TAU, r = Math.sqrt(s[1]) * area;
          let x = Math.cos(a) * r + ((t * 3 + s[2] * 40) % (area * 2)) - area, z = Math.sin(a) * r;
          if (Math.hypot(x, z) > area) x -= Math.sign(x) * area * 1.6;
          snow.pos.set([x, y + Math.sin(t * 2 + i) * 0.2, z + Math.sin(t + s[3] * 6) * 0.5], i * 3);
        }
        snow.pts.geometry.attributes.position.needsUpdate = true;
      });
      // Boden wird weiß
      scene.traverse((o) => {
        if (o.userData.rbx?.kind !== 'ground' || !o.material?.color) return;
        const c0 = o.material.color.clone();
        o.material.color.lerp(new THREE.Color('#f4f8ff'), 0.7);
        disposables.push({ dispose: () => o.material.color.copy(c0) });
      });
      // Schnee bleibt am Boden liegen
      const ground = cloud(900, { size: 0.6, color: '#ffffff', additive: false, opacity: 0.8 });
      for (let i = 0; i < ground.n; i++) {
        const [x, z] = inDisc(ground.seeds[i]);
        const r = Math.hypot(x, z);
        if (r > R - 0.4) {
          ground.pos.set([x * ((R - 0.6) / r), 0, z * ((R - 0.6) / r)], i * 3);
          ground.pos[i * 3 + 1] = height(ground.pos[i * 3], ground.pos[i * 3 + 2]) + 0.05;
        } else ground.pos.set([x, height(x, z) + 0.05, z], i * 3);
      }
      ground.pts.geometry.attributes.position.needsUpdate = true;
    },
    disconacht() {
      const ballG = new THREE.Group();
      ballG.position.set(0, height(0, 0) + 11, 0);
      const ball = new THREE.Mesh(track(new THREE.IcosahedronGeometry(1.2, 2)), track(new THREE.MeshStandardMaterial({ color: '#ffffff', metalness: 1, roughness: 0.05, flatShading: true, emissive: '#555566', emissiveIntensity: 0.6 })));
      ballG.add(ball);
      ballG.add(new THREE.Mesh(track(new THREE.CylinderGeometry(0.03, 0.03, 6, 6)), track(new THREE.MeshBasicMaterial({ color: '#888888' }))).translateY(3.6));
      g.add(ballG);
      const cols = ['#ff3df2', '#3de8ff', '#ffe23d', '#7a5cff', '#3dff8a'];
      const beams = cols.map((c, i) => {
        const cone = new THREE.Mesh(track(new THREE.ConeGeometry(2.2, 12, 20, 1, true)), track(new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })));
        cone.geometry.translate(0, -6, 0);
        const piv = new THREE.Group();
        piv.position.copy(ballG.position);
        piv.add(cone);
        g.add(piv);
        const l = new THREE.PointLight(c, 40, R, 1.5);
        g.add(l);
        return [piv, l, i];
      });
      const spots = cloud(260, { size: 0.35, colors: cols });
      ups.push((t) => {
        ball.rotation.y = t * 0.6;
        beams.forEach(([piv, l, i]) => {
          const a = t * 0.5 + (i / beams.length) * TAU;
          piv.rotation.set(Math.cos(a) * 0.7, 0, Math.sin(a) * 0.7);
          const x = Math.cos(a) * R * 0.5, z = Math.sin(a) * R * 0.5;
          l.position.set(x, height(x, z) + 2, z);
        });
        for (let i = 0; i < spots.n; i++) {
          const s = spots.seeds[i], a = s[0] * TAU + t * 0.4, r = Math.sqrt(s[1]) * R;
          const x = Math.cos(a) * r, z = Math.sin(a) * r;
          spots.pos.set([x, height(x, z) + 0.1 + s[2] * 6, z], i * 3);
        }
        spots.pts.geometry.attributes.position.needsUpdate = true;
      });
    },
    blutmond() {
      const { m, s } = moon('#ff3a2a', 5, [-R * 1.4, R * 0.55, -R * 2.2], '#ff2a1a', 34);
      const embers = cloud(420, { size: 0.22, colors: ['#ff3a10', '#ff7a2a', '#ff1a1a'] });
      ups.push((t) => {
        s.material.opacity = 0.5 + Math.sin(t * 0.8) * 0.1;
        for (let i = 0; i < embers.n; i++) {
          const e = embers.seeds[i], [x, z] = inDisc(e), k = (t * 0.12 * (0.6 + e[2]) + e[3]) % 1;
          embers.pos.set([x + Math.sin(t + i) * 0.3, height(x, z) + k * 10, z], i * 3);
        }
        embers.pts.geometry.attributes.position.needsUpdate = true;
      });
      // rotes Licht vom Mond
      const red = new THREE.DirectionalLight('#ff3a2a', 1.4);
      red.position.copy(m.position);
      g.add(red);
    },
    neonsturm() {
      // weich die Farbe wechselnde Nebelschwaden
      const ribbons = [];
      for (let i = 0; i < 7; i++) {
        const geo = track(new THREE.TorusGeometry(R * (0.35 + i * 0.1), 0.35, 8, 64));
        const mat = track(new THREE.MeshBasicMaterial({ color: '#c6ff00', transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending }));
        const m = new THREE.Mesh(geo, mat);
        m.position.y = height(0, 0) + 2 + i * 0.9;
        m.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.5;
        g.add(m);
        ribbons.push([m, mat, i]);
      }
      const bits = cloud(500, { size: 0.3, color: '#ffffff' });
      const c = new THREE.Color();
      ups.push((t) => {
        ribbons.forEach(([m, mat, i]) => {
          c.setHSL((t * 0.05 + i * 0.14) % 1, 1, 0.55);
          mat.color.copy(c);
          m.rotation.z = t * (0.1 + i * 0.03);
        });
        for (let i = 0; i < bits.n; i++) {
          const s = bits.seeds[i], a = s[0] * TAU + t * (0.2 + s[2] * 0.3), r = Math.sqrt(s[1]) * area;
          bits.pos.set([Math.cos(a) * r, height(0, 0) + 1 + s[3] * 9, Math.sin(a) * r], i * 3);
          c.setHSL((s[2] + t * 0.05) % 1, 1, 0.6);
          bits.col.set([c.r, c.g, c.b], i * 3);
        }
        bits.pts.geometry.attributes.position.needsUpdate = bits.pts.geometry.attributes.color.needsUpdate = true;
      });
    },
    goldregen() {
      streaks(700, '#ffd23a', 0.5, 9, 0.05, 0.7);
      const coins = cloud(260, { size: 0.35, colors: ['#ffd23a', '#fff2a0', '#ffb020'] });
      ups.push((t) => {
        for (let i = 0; i < coins.n; i++) {
          const s = coins.seeds[i], [x, z] = inDisc(s);
          coins.pos.set([x, 14 - ((t * (2 + s[2] * 2) + s[3] * 14) % 14), z], i * 3);
        }
        coins.pts.geometry.attributes.position.needsUpdate = true;
      });
      const glow = new THREE.PointLight('#ffd23a', 60, R * 2.5, 1.2);
      glow.position.set(0, height(0, 0) + 8, 0);
      g.add(glow);
      // Goldglanz auf dem Boden
      const shine = cloud(240, { size: 0.3, color: '#fff2a0' });
      ups.push((t) => {
        for (let i = 0; i < shine.n; i++) {
          const s = shine.seeds[i], [x, z] = inDisc(s);
          shine.pos.set([x, height(x, z) + 0.08, z], i * 3);
          const b = Math.pow(Math.max(0, Math.sin(t * 2 + s[2] * 20)), 8);
          shine.col.set([b, b * 0.85, b * 0.4], i * 3);
        }
        shine.pts.geometry.attributes.position.needsUpdate = shine.pts.geometry.attributes.color.needsUpdate = true;
      });
    },
    datensturm() {
      const rain = ['0', '1'].map((ch) => cloud(700, { size: 0.8, color: '#3dff7a', map: glyph(ch) }));
      ups.push((t) =>
        rain.forEach((r) => {
          for (let i = 0; i < r.n; i++) {
            const s = r.seeds[i], [x, z] = inDisc(s), k = (t * 0.2 * (0.6 + s[2]) + s[3]) % 1;
            r.pos.set([Math.round(x * 2) / 2, 14 - k * 14, Math.round(z * 2) / 2], i * 3);
            const b = Math.sin(k * Math.PI);
            r.col.set([0.35 * b, 1.4 * b, 0.6 * b], i * 3);
          }
          r.pts.geometry.attributes.position.needsUpdate = r.pts.geometry.attributes.color.needsUpdate = true;
        }),
      );
      // schwebende Glitch-Würfel
      const cubes = [];
      const cm = track(new THREE.MeshBasicMaterial({ color: '#3dff7a', wireframe: true }));
      for (let i = 0; i < Math.round(10 * amount); i++) {
        const c = new THREE.Mesh(track(new THREE.BoxGeometry(1, 1, 1)), cm);
        const a = Math.random() * TAU, r = Math.random() * R;
        c.position.set(Math.cos(a) * r, height(0, 0) + 2 + Math.random() * 6, Math.sin(a) * r);
        c.scale.setScalar(0.4 + Math.random() * 1.2);
        g.add(c);
        cubes.push([c, Math.random() * 6]);
      }
      ups.push((t) => cubes.forEach(([c, ph]) => {
        c.rotation.set(t * 0.4 + ph, t * 0.3, 0);
        c.visible = Math.sin(t * 1.3 + ph * 3) > -0.6;
      }));
    },
    sternschnuppen() {
      const stars = cloud(900, { size: 0.5, colors: ['#ffffff', '#cfe0ff', '#e0c8ff'] });
      for (let i = 0; i < stars.n; i++) {
        const s = stars.seeds[i], u = s[0] * 0.9 + 0.1, a = s[1] * TAU, r = 90;
        const sx = Math.sqrt(1 - u * u);
        stars.pos.set([Math.cos(a) * sx * r, u * r * 0.6 + 5, Math.sin(a) * sx * r], i * 3);
      }
      stars.pts.geometry.attributes.position.needsUpdate = true;
      stars.mat.fog = false;
      // Sternschnuppen: helle Striche mit Schweif
      const trails = Array.from({ length: 6 }, (_, i) => {
        const mat = track(new THREE.LineBasicMaterial({ color: '#fff6e0', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
        const geo = track(new THREE.BufferGeometry());
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
        const l = new THREE.LineSegments(geo, mat);
        l.frustumCulled = false;
        g.add(l);
        return { l, mat, geo, t0: i * 0.9, from: new THREE.Vector3(), dir: new THREE.Vector3() };
      });
      const sparkle = cloud(120, { size: 0.3, color: '#e0c8ff' });
      ups.push((t) => {
        trails.forEach((s) => {
          let e = t - s.t0;
          if (e > 1.6) {
            s.t0 = t + Math.random() * 1.5;
            const a = Math.random() * TAU;
            s.from.set(Math.cos(a) * R * 1.5, 18 + Math.random() * 8, Math.sin(a) * R * 1.5);
            s.dir.set(-Math.cos(a) * 0.6 + (Math.random() - 0.5) * 0.4, -0.5, -Math.sin(a) * 0.6).normalize();
            e = -1;
          }
          if (e < 0) return (s.mat.opacity = 0);
          const head = s.from.clone().addScaledVector(s.dir, e * 22), tail = head.clone().addScaledVector(s.dir, -4);
          s.geo.attributes.position.array.set([head.x, head.y, head.z, tail.x, tail.y, tail.z]);
          s.geo.attributes.position.needsUpdate = true;
          s.mat.opacity = Math.sin((e / 1.6) * Math.PI);
        });
        for (let i = 0; i < sparkle.n; i++) {
          const s = sparkle.seeds[i], [x, z] = inDisc(s), k = (t * 0.1 + s[3]) % 1;
          sparkle.pos.set([x, height(x, z) + 0.2 + k * 3, z], i * 3);
          const b = Math.sin(k * Math.PI);
          sparkle.col.set([0.9 * b, 0.8 * b, b], i * 3);
        }
        sparkle.pts.geometry.attributes.position.needsUpdate = sparkle.pts.geometry.attributes.color.needsUpdate = true;
      });
    },
  };
  W[w.id]?.();

  return {
    weather: w,
    update(t, dt) {
      if (hub) applyLight();
      for (const u of ups) u(t, dt);
    },
    dispose() {
      scene.remove(g);
      g.traverse((o) => o.geometry?.dispose());
      disposables.forEach((d) => d.dispose?.());
      if (skyTex) scene.background = old.bg;
      if (scene.fog && old.fog) {
        scene.fog.color.copy(old.fog.color);
        scene.fog.near = old.fog.near;
        scene.fog.far = old.fog.far;
      }
      if (built.lights && !hub) {
        built.lights.hemi.intensity = old.hemi;
        built.lights.sun.intensity = old.sun;
      }
    },
  };
}
