// Mutationen und Wetter.
//
// Jede Münze kann beim Ziehen eine Mutation bekommen, aber nur während des passenden Wetters.
// Eine Mutation ist dauerhaft an der Münze sichtbar (Partikel, Licht, Anbauten) und
// multipliziert ihren Wert. Werte und Chancen sind Vorschläge und hier anpassbar.
//
// applyMutation() hängt die Effekte an eine fertige Münze aus createCoin().

import * as THREE from 'three';

export const MUTATIONS = [
  {
    id: 'nass', name: 'Nass', multiplier: 1.1, color: '#5cc8ff',
    weather: 'regen', chance: 25,
    effect: 'Glänzend nass, Tropfen auf der Prägung, Wasser tropft herunter.',
  },
  {
    id: 'gestein', name: 'Gestein', multiplier: 1.25, color: '#b59b7a',
    weather: 'erdbeben', chance: 18,
    effect: 'Felsbrocken am Rand, steinerner Belag, rieselnder Staub.',
  },
  {
    id: 'disco', name: 'Disco', multiplier: 1.5, color: '#ff5fd2',
    weather: 'disconacht', chance: 12,
    effect: 'Bunte Discolichter kreisen um die Münze, Lichtpunkte tanzen.',
  },
  {
    id: 'daemonisch', name: 'Dämonisch', multiplier: 2, color: '#ff2a2a',
    weather: 'blutmond', chance: 8,
    effect: 'Hörner, rote Aura, Höllenflammen und ein Ring aus Blut.',
  },
  {
    id: 'augenkrebs', name: 'Augenkrebs', multiplier: 2.5, color: '#c6ff00',
    weather: 'neonsturm', chance: 5,
    effect: 'Grelle Neonfarben wechseln durch, schrille Formen schwirren herum.',
  },
  {
    id: 'hacked', name: 'Hacked', multiplier: 3, color: '#3dff7a',
    weather: 'datensturm', chance: 3,
    effect: 'Grüner Code-Regen, Glitch-Zucken und ein HACKED-Schild.',
  },
];

// weight: wie oft das Wetter vorkommt (Anteil an allen Wetterphasen)
export const WEATHER = [
  { id: 'klar', name: 'Klar', weight: 40, color: '#d9b26a', text: 'Keine besonderen Einflüsse.' },
  { id: 'regen', name: 'Regen', weight: 20, color: '#5cc8ff', text: 'Gezogene Münzen können nass werden.' },
  { id: 'erdbeben', name: 'Erdbeben', weight: 12, color: '#b59b7a', text: 'Gestein bricht auf und bleibt an Münzen hängen.' },
  { id: 'disconacht', name: 'Disconacht', weight: 12, color: '#ff5fd2', text: 'Die Münzen tanzen mit.' },
  { id: 'blutmond', name: 'Blutmond', weight: 7, color: '#ff2a2a', text: 'Etwas Dämonisches erwacht.' },
  { id: 'neonsturm', name: 'Neonsturm', weight: 5, color: '#c6ff00', text: 'Grelle Farben überall. Bitte nicht direkt hinsehen.' },
  { id: 'datensturm', name: 'Datensturm', weight: 4, color: '#3dff7a', text: 'Das System ist kompromittiert.' },
];

export const mutationById = Object.fromEntries(MUTATIONS.map((m) => [m.id, m]));
export const weatherById = Object.fromEntries(WEATHER.map((w) => [w.id, w]));
export const mutationForWeather = (weatherId) => MUTATIONS.find((m) => m.weather === weatherId) || null;

// Würfelt beim Ziehen, ob die Münze mutiert. Gibt die Mutation oder null zurück.
export function rollMutation(weatherId, random = Math.random) {
  const m = mutationForWeather(weatherId);
  return m && random() * 100 < m.chance ? m : null;
}

// Nennwert mit Multiplikator. '∞' bleibt unendlich.
export function mutatedValue(value, mutation) {
  if (!mutation) return value;
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return (Math.round(n * mutation.multiplier * 100) / 100).toLocaleString('de-DE');
}

export const fmtMultiplier = (m) => '×' + m.multiplier.toLocaleString('de-DE');

// ── Effekte ──────────────────────────────────────────────────────────────────
// ctx kommt aus createCoin: { spinner, fx, faces, bodyMat, faceZ, track, onUpdate, particles, glowSprite }

const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);

function glyphTexture(text, color) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 64;
  const c = cv.getContext('2d');
  c.fillStyle = color;
  c.font = '700 46px "JetBrains Mono", ui-monospace, monospace';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(text, 32, 34);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function labelSprite(text, color, track) {
  const cv = document.createElement('canvas');
  cv.width = 256;
  cv.height = 64;
  const c = cv.getContext('2d');
  c.fillStyle = 'rgba(0,0,0,0.65)';
  c.fillRect(0, 8, 256, 48);
  c.strokeStyle = color;
  c.lineWidth = 3;
  c.strokeRect(2, 10, 252, 44);
  c.fillStyle = color;
  c.font = '700 30px "JetBrains Mono", ui-monospace, monospace';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(text, 128, 33);
  const tex = track(new THREE.CanvasTexture(cv));
  tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(track(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })));
  s.scale.set(0.9, 0.225, 1);
  return s;
}

const faceMats = (ctx) => [ctx.faces.front.material, ctx.faces.back.material];

const EFFECTS = {
  nass(ctx) {
    const { spinner, fx, faceZ, track, onUpdate, particles, bodyMat } = ctx;
    bodyMat.roughness *= 0.45;
    bodyMat.color.lerp(new THREE.Color('#9fd8ff'), 0.12);
    faceMats(ctx).forEach((m) => {
      m.roughness = 0.55;
      m.color.lerp(new THREE.Color('#cfeeff'), 0.15);
    });
    // Tropfen auf beiden Seiten
    const dropGeo = track(new THREE.SphereGeometry(1, 16, 10));
    const dropMat = track(new THREE.MeshPhysicalMaterial({ color: '#dff4ff', metalness: 0, roughness: 0, clearcoat: 1, transparent: true, opacity: 0.7, envMapIntensity: 3, emissive: '#4aa8e0', emissiveIntensity: 0.15 }));
    for (const side of [1, -1]) {
      for (let i = 0; i < 24; i++) {
        const a = rand(0, TAU), r = Math.sqrt(Math.random()) * 0.88, s = rand(0.03, 0.075);
        const d = new THREE.Mesh(dropGeo, dropMat);
        d.position.set(Math.cos(a) * r, Math.sin(a) * r, side * (faceZ + s * 0.25));
        d.scale.set(s, s * rand(1, 1.4), s * 0.45);
        spinner.add(d);
      }
    }
    // herabfallende Tropfen
    const N = 26;
    const drips = particles(N, '#bfe8ff', 0.12);
    fx.add(drips);
    const seeds = Array.from({ length: N }, () => [rand(-0.7, 0.7), Math.random(), rand(0.5, 1)]);
    onUpdate((t) => {
      const p = drips.geometry.attributes.position, c = drips.geometry.attributes.color;
      seeds.forEach(([x, off, sp], i) => {
        const life = (t * 0.6 * sp + off) % 1;
        p.setXYZ(i, x, -0.95 - life * life * 1.2, 0);
        const b = life < 0.15 ? life / 0.15 : 1 - (life - 0.15) / 0.85;
        c.setXYZ(i, b, b, b);
      });
      p.needsUpdate = c.needsUpdate = true;
    });
  },

  gestein(ctx) {
    const { spinner, fx, track, onUpdate, particles, bodyMat } = ctx;
    bodyMat.color.lerp(new THREE.Color('#8a7f73'), 0.45);
    bodyMat.roughness = Math.max(bodyMat.roughness, 0.6);
    faceMats(ctx).forEach((m) => m.color.lerp(new THREE.Color('#a39482'), 0.35));
    const rockMat = track(new THREE.MeshStandardMaterial({ color: '#7d7166', roughness: 0.95, metalness: 0.05, flatShading: true }));
    const darkMat = track(new THREE.MeshStandardMaterial({ color: '#5a5048', roughness: 1, flatShading: true }));
    for (let i = 0; i < 11; i++) {
      const a = (i / 11) * TAU + rand(-0.2, 0.2);
      const size = rand(0.1, 0.22);
      const rock = new THREE.Mesh(track(new THREE.DodecahedronGeometry(size, 0)), i % 3 ? rockMat : darkMat);
      rock.position.set(Math.cos(a) * rand(0.92, 1.02), Math.sin(a) * rand(0.92, 1.02), rand(-0.08, 0.08));
      rock.rotation.set(rand(0, TAU), rand(0, TAU), rand(0, TAU));
      rock.scale.set(1, rand(0.7, 1.1), rand(0.6, 0.9));
      spinner.add(rock);
    }
    const N = 30;
    const dust = particles(N, '#c9b49a', 0.07);
    fx.add(dust);
    const seeds = Array.from({ length: N }, () => [rand(0, TAU), rand(0.7, 1.2), Math.random(), rand(0.3, 0.8)]);
    onUpdate((t) => {
      const p = dust.geometry.attributes.position, c = dust.geometry.attributes.color;
      seeds.forEach(([a, r, off, sp], i) => {
        const life = (t * 0.25 * sp + off) % 1;
        p.setXYZ(i, Math.cos(a) * r, Math.sin(a) * r * 0.9 - life * 0.9, Math.sin(a * 3) * 0.3);
        const b = Math.sin(life * Math.PI) * 0.7;
        c.setXYZ(i, b, b, b);
      });
      p.needsUpdate = c.needsUpdate = true;
    });
  },

  disco(ctx) {
    const { fx, onUpdate, particles, track } = ctx;
    const colors = ['#ff3df2', '#3de8ff', '#ffe23d', '#7a5cff'];
    const lights = colors.map((c) => {
      const l = new THREE.PointLight(c, 45, 0, 2);
      fx.add(l);
      return l;
    });
    const N = 60;
    const spots = particles(N, '#ffffff', 0.18);
    fx.add(spots);
    const seeds = Array.from({ length: N }, () => [rand(0, TAU), rand(-1.2, 1.2), Math.floor(rand(0, colors.length)), rand(0, 6)]);
    const cols = colors.map((c) => new THREE.Color(c));
    const ball = new THREE.Mesh(
      track(new THREE.IcosahedronGeometry(0.13, 1)),
      track(new THREE.MeshStandardMaterial({ color: '#ffffff', metalness: 1, roughness: 0.05, flatShading: true })),
    );
    ball.position.set(0.95, 0.95, 0.2);
    fx.add(ball);
    onUpdate((t) => {
      lights.forEach((l, i) => {
        const a = t * 1.2 + (i / lights.length) * TAU;
        l.position.set(Math.cos(a) * 1.3, Math.sin(a * 0.7) * 1.1, 1.4 + Math.sin(a) * 0.5);
      });
      ball.rotation.y = t * 1.5;
      const p = spots.geometry.attributes.position, c = spots.geometry.attributes.color;
      seeds.forEach(([a, y, ci, ph], i) => {
        const ang = a + t * 0.8;
        p.setXYZ(i, Math.cos(ang) * 1.5, y, Math.sin(ang) * 1.5);
        const b = 0.4 + 0.6 * Math.pow(0.5 + 0.5 * Math.sin(t * 2 + ph), 2);
        const col = cols[(ci + Math.floor(t * 0.8 + ph)) % cols.length];
        c.setXYZ(i, col.r * b, col.g * b, col.b * b);
      });
      p.needsUpdate = c.needsUpdate = true;
    });
  },

  daemonisch(ctx) {
    const { spinner, fx, track, onUpdate, particles, glowSprite, bodyMat } = ctx;
    bodyMat.color.lerp(new THREE.Color('#5a0a0a'), 0.5);
    faceMats(ctx).forEach((m) => {
      m.color.lerp(new THREE.Color('#ff4a3a'), 0.3);
      if (!m.emissiveMap) {
        m.emissive = new THREE.Color('#ff1a0a');
        m.emissiveIntensity = 0.08;
      }
    });
    // Hörner oben am Rand, gebogen aus drei Kegelstücken
    const hornMat = track(new THREE.MeshStandardMaterial({ color: '#2a0606', roughness: 0.4, metalness: 0.3, emissive: '#5a0000', emissiveIntensity: 0.4 }));
    for (const s of [-1, 1]) {
      const horn = new THREE.Group();
      [[0.075, 0.14, 0], [0.055, 0.13, 0.25], [0.035, 0.14, 0.55]].reduce((y, [r, h, bend]) => {
        const seg = new THREE.Mesh(track(new THREE.CylinderGeometry(r * 0.7, r, h, 12)), hornMat);
        seg.position.set(s * bend * 0.12, y + h / 2, 0);
        seg.rotation.z = -s * bend;
        horn.add(seg);
        return y + h * 0.92;
      }, 0);
      const tip = new THREE.Mesh(track(new THREE.ConeGeometry(0.03, 0.12, 10)), hornMat);
      tip.position.set(s * 0.13, 0.46, 0);
      tip.rotation.z = -s * 0.9;
      horn.add(tip);
      horn.position.set(s * 0.42, 0.88, 0);
      horn.rotation.z = -s * 0.35;
      spinner.add(horn);
    }
    const aura = glowSprite('#ff1a1a', 3.6, 0.5);
    fx.add(aura);
    const ring = new THREE.Mesh(
      track(new THREE.TorusGeometry(1.3, 0.02, 8, 120)),
      track(new THREE.MeshBasicMaterial({ color: '#ff1a1a', transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false })),
    );
    ring.rotation.x = Math.PI / 2 - 0.25;
    fx.add(ring);
    const N = 50;
    const flames = particles(N, '#ff3a10', 0.17);
    fx.add(flames);
    const seeds = Array.from({ length: N }, () => [rand(0, TAU), Math.random(), rand(0.6, 1.3)]);
    onUpdate((t) => {
      aura.material.opacity = 0.42 + Math.sin(t * 2.2) * 0.12;
      ring.rotation.z = t * 0.5;
      const p = flames.geometry.attributes.position, c = flames.geometry.attributes.color;
      seeds.forEach(([a, off, sp], i) => {
        const life = (t * 0.5 * sp + off) % 1;
        const r = 0.9 - life * 0.4;
        p.setXYZ(i, Math.cos(a) * r, -0.9 + life * 2.4, Math.sin(a) * r * 0.5);
        const b = Math.sin(life * Math.PI);
        c.setXYZ(i, b, b * (0.7 - life * 0.6), b * 0.2);
      });
      p.needsUpdate = c.needsUpdate = true;
    });
  },

  // Bewusst ohne schnelles Blitzen: Farben laufen weich durch (unter 3 Wechseln pro Sekunde),
  // damit die Mutation grell ist, aber für niemanden gefährlich.
  augenkrebs(ctx) {
    const { spinner, fx, track, onUpdate, particles, bodyMat } = ctx;
    const mats = faceMats(ctx);
    mats.forEach((m) => {
      if (!m.emissiveMap) m.emissive = new THREE.Color('#000000');
    });
    const N = 34;
    const bits = particles(N, '#ffffff', 0.2);
    fx.add(bits);
    const seeds = Array.from({ length: N }, () => [rand(0, TAU), rand(1.1, 1.6), rand(-1, 1), rand(0, 1), rand(0.5, 1.5)]);
    const zig = new THREE.Mesh(
      track(new THREE.TorusGeometry(1.25, 0.035, 4, 24)),
      track(new THREE.MeshBasicMaterial({ color: '#ff00ff', wireframe: true })),
    );
    fx.add(zig);
    const c1 = new THREE.Color(), c2 = new THREE.Color();
    onUpdate((t) => {
      const h = (t * 0.35) % 1;
      c1.setHSL(h, 1, 0.6);
      c2.setHSL((h + 0.5) % 1, 1, 0.55);
      bodyMat.color.copy(c2);
      mats.forEach((m) => {
        m.color.copy(c1).lerp(new THREE.Color('#ffffff'), 0.3);
        if (!m.emissiveMap) {
          m.emissive.copy(c1);
          m.emissiveIntensity = 0.25;
        }
      });
      zig.material.color.setHSL((h + 0.25) % 1, 1, 0.55);
      zig.rotation.set(t * 0.7, t * 0.5, t * 0.3);
      spinner.scale.set(1 + Math.sin(t * 2.5) * 0.04, 1 - Math.sin(t * 2.5) * 0.04, 1);
      const p = bits.geometry.attributes.position, c = bits.geometry.attributes.color;
      seeds.forEach(([a, r, y, hh, sp], i) => {
        const ang = a + t * sp;
        p.setXYZ(i, Math.cos(ang) * r, y + Math.sin(t * sp * 2) * 0.2, Math.sin(ang) * r);
        c2.setHSL((hh + t * 0.3) % 1, 1, 0.55);
        c.setXYZ(i, c2.r, c2.g, c2.b);
      });
      p.needsUpdate = c.needsUpdate = true;
    });
  },

  hacked(ctx) {
    const { spinner, fx, track, onUpdate, bodyMat } = ctx;
    bodyMat.color.lerp(new THREE.Color('#1a3a22'), 0.4);
    const mats = faceMats(ctx);
    mats.forEach((m) => {
      m.color.lerp(new THREE.Color('#6dff9a'), 0.2);
      if (!m.emissiveMap) {
        m.emissive = new THREE.Color('#0aff5a');
        m.emissiveIntensity = 0.06;
      }
    });
    // Code-Regen aus 0 und 1
    const rain = [0, 1].map((n) => {
      const N = 26;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
      geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
      const pts = new THREE.Points(
        geo,
        track(new THREE.PointsMaterial({ size: 0.24, map: track(glyphTexture(String(n), '#ffffff')), vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })),
      );
      fx.add(pts);
      return [pts, Array.from({ length: N }, () => [rand(-1.4, 1.4), rand(-0.6, 0.6), Math.random(), rand(0.5, 1.2)])];
    });
    const label = labelSprite('HACKED', '#3dff7a', track);
    label.position.set(0, -1.2, 0.3);
    fx.add(label);
    let glitchUntil = 0, next = 1;
    onUpdate((t) => {
      for (const [pts, seeds] of rain) {
        const p = pts.geometry.attributes.position, c = pts.geometry.attributes.color;
        seeds.forEach(([x, z, off, sp], i) => {
          const life = (t * 0.45 * sp + off) % 1;
          p.setXYZ(i, x, 1.4 - life * 2.8, z);
          const b = Math.sin(life * Math.PI);
          c.setXYZ(i, 0.35 * b, 1.4 * b, 0.6 * b);
        });
        p.needsUpdate = c.needsUpdate = true;
      }
      // gelegentlicher Glitch
      if (t > next) {
        glitchUntil = t + 0.16;
        next = t + rand(1.4, 3);
      }
      const g = t < glitchUntil;
      spinner.position.x = g ? rand(-0.08, 0.08) : 0;
      spinner.scale.x = g ? rand(0.9, 1.15) : 1;
      label.position.x = g ? rand(-0.1, 0.1) : 0;
      label.material.opacity = g && Math.random() < 0.5 ? 0.3 : 1;
    });
  },
};

export function applyMutation(id, ctx) {
  EFFECTS[id]?.(ctx);
}
