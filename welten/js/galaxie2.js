// Juwelnebel (Galaxie 2, nach der Supernova): neun Welten auf drei Planeten. Jede Welt hat ein großes
// Edelstein-Wahrzeichen, Kristallgruppen in ihren Farben, passende Pflanzen oder Bauten und funkelnde Partikel.
// Einheiten der Webseite (1 Einheit = 8 Studs), Inselradius R = 16. Aufbau wie planet4.js.

import * as THREE from 'three';
import { floatingIsles, neighborIsles, domeAt } from './modelWorlds.js';

const TAU = Math.PI * 2;

// ── kleine Bausteine ──
// Geschliffener Edelstein: Würfel auf der Spitze (in Roblox ein gedrehter Block) mit Leuchten
function gemStone(kit, s, c, glow = 0.6) {
  const { E, at } = kit;
  const m = at(new THREE.Mesh(new THREE.BoxGeometry(s * 1.2, s * 1.2, s * 1.2), E(c, glow, { transparent: true, opacity: 0.9, roughness: 0.15, metalness: 0.1 })), 0, s * 1.05, 0);
  m.rotation.set(Math.atan(Math.SQRT1_2), 0, Math.PI / 4, 'ZXY');
  return m;
}
// Brillant im Schliff: Tafel oben, Krone, Rundiste, Pavillon mit Spitze unten (8 Facetten rundum).
// In Roblox Fläche für Fläche aus Keilen nachgebaut (facets), so bleibt jede Facette scharf.
function brilliant(kit, r, c, glow = 1) {
  const { E, group } = kit;
  const mat = E(c, glow, { transparent: true, opacity: 0.88, roughness: 0.1 });
  const profile = [new THREE.Vector2(0.001, -r * 1.3), new THREE.Vector2(r, 0), new THREE.Vector2(r * 0.98, r * 0.08), new THREE.Vector2(r * 0.58, r * 0.5), new THREE.Vector2(0.001, r * 0.5)];
  const m = new THREE.Mesh(new THREE.LatheGeometry(profile, 8), mat);
  m.userData.rbx = { facets: true, facetsAll: true, facetThick: 0.1 };
  const g = group(m);
  g.userData.mat = mat;
  return g;
}
// Kristallgruppe in zwei Farben
function cluster(kit, rand, h, a, b) {
  const g = kit.crystal(h, a, rand, 1.1);
  if (b && rand() < 0.6) {
    const c2 = kit.crystal(h * 0.6, b, rand, 1);
    c2.position.set((rand() - 0.5) * 0.8, 0, (rand() - 0.5) * 0.8);
    g.add(c2);
  }
  return g;
}
// Großes Wahrzeichen: schwebender Edelstein auf einem Sockel, dreht sich langsam
function landmark(ctx, kit, color, { size = 2.4, base = '#6a6488', ring = null, float = 1.2 } = {}) {
  const { M, E, at, group } = kit;
  const p = ctx.spot(3.4, 2.5, 7);
  if (!p) return null;
  const parts = [];
  // Podest (Werkstatt-Wunsch „Podest unter dem Diamant verbessern“, alle Edelsteinwelten): drei achteckige
  // Stufen mit goldenen Kanten und Leuchtfuge in der Steinfarbe, acht Obelisken mit leuchtenden Spitzen,
  // in der Mitte eine Säule mit Kapitell, über der der Stein schwebt, Runen auf den Stufen
  const gold = M('#ffcf4a', { metalness: 0.75, roughness: 0.3, emissive: '#b8860b', emissiveIntensity: 0.25 }), glowM = E(color, 1.3);
  const baseL = '#' + new THREE.Color(base).offsetHSL(0, 0, 0.08).getHexString();
  for (let i = 0; i < 3; i++) {
    const r0 = 2.9 - i * 0.6, y = 0.2 + i * 0.4;
    parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(r0 - 0.08, r0, 0.4, 8), M(i % 2 ? baseL : base)), 0, y, 0));
    const trim = at(new THREE.Mesh(new THREE.TorusGeometry(r0 - 0.05, 0.05, 4, 8), gold), 0, y + 0.2, 0);
    trim.rotation.set(Math.PI / 2, 0, Math.PI / 8);
    parts.push(trim);
    const glowR = at(new THREE.Mesh(new THREE.TorusGeometry(r0 - 0.04, 0.03, 4, 8), glowM), 0, y - 0.05, 0);
    glowR.rotation.set(Math.PI / 2, 0, Math.PI / 8);
    parts.push(glowR);
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU + Math.PI / 8, x = Math.cos(a) * 2.55, z = Math.sin(a) * 2.55;
    parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.18, 1.3, 4), M(baseL)), x, 1.05, z));
    parts.push(at(new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), glowM), x, 1.85, z));
  }
  parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 0.9, 8), M(baseL)), 0, 1.65, 0));
  parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.6, 0.25, 8), gold), 0, 2.2, 0));
  parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.05, 8), glowM), 0, 2.34, 0));
  const gem = brilliant(kit, size, color, 1.1);
  gem.position.y = 2.3 + size * 1.3 + float;
  parts.push(gem);
  let halo = null;
  if (ring) {
    halo = at(new THREE.Mesh(new THREE.TorusGeometry(size * 1.5, 0.12, 6, 32), E(ring, 1.4)), 0, gem.position.y, 0);
    halo.rotation.x = Math.PI / 2.4;
    parts.push(halo);
  }
  // kleine Steine kreisen um den Sockel
  const orbit = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const s = gemStone(kit, 0.22, color, 1.4);
    s.position.set(Math.cos((i / 6) * TAU) * 2.6, 1.6, Math.sin((i / 6) * TAU) * 2.6);
    orbit.add(s);
  }
  parts.push(orbit);
  const lm = group(...parts);
  ctx.put(lm, p[0], p[1], { rot: false });
  const y0 = gem.position.y;
  ctx.anims.push((t) => {
    gem.rotation.y = t * 0.4;
    gem.position.y = y0 + Math.sin(t * 0.9) * 0.25;
    orbit.rotation.y = -t * 0.6;
    if (halo) halo.rotation.z = t * 0.5;
    gem.userData.mat.emissiveIntensity = 0.9 + Math.sin(t * 1.6) * 0.3;
  });
  return lm;
}
// Säule aus Kristall (Quarz, Topas-Obelisk)
function pillar(kit, h, c, glow = 0.4) {
  const { E, at, group } = kit;
  // sechseckige Kristallsäule mit Spitze; in Roblox aus Keilen (Kanten bleiben sechseckig)
  const shaft = at(new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.42, h, 6, 1, true), E(c, glow, { transparent: true, opacity: 0.92, roughness: 0.2 })), 0, h / 2, 0);
  const tip = at(new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.8, 6, 1, true), E(c, glow + 0.2, { transparent: true, opacity: 0.92 })), 0, h + 0.4, 0);
  shaft.userData.rbx = { facets: true };
  tip.userData.rbx = { facets: true };
  return group(shaft, tip);
}
// Baum mit Edelstein-Laub
function gemTree(kit, rand, h, trunkC, leaf) {
  const { M, E, at, group } = kit;
  const g = group(at(new THREE.Mesh(new THREE.CylinderGeometry(h * 0.05, h * 0.08, h * 0.6, 6), M(trunkC)), 0, h * 0.3, 0));
  for (let i = 0; i < 3; i++) {
    const s = h * (0.26 - i * 0.04);
    const b = gemStone(kit, s, leaf, 0.35);
    b.position.set((rand() - 0.5) * h * 0.3, h * (0.6 + i * 0.16), (rand() - 0.5) * h * 0.3);
    g.add(b);
  }
  return g;
}
// Wolkenbausch
function puff(kit, rand, s, c) {
  const { M, at, group } = kit;
  const parts = [];
  for (let i = 0; i < 4; i++) {
    const r = s * (0.45 + rand() * 0.3);
    parts.push(at(new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), M(c, { roughness: 1 })), (i - 1.5) * s * 0.5, r * 0.6, (rand() - 0.5) * s * 0.4));
  }
  return group(...parts);
}
// Pagode / Tempel in Stufen (Werkstatt-Wunsch „Jadetempel deutlich verbessern“): Steinsockel mit Treppe,
// je Stockwerk rote Ecksäulen, Fenster und ein breites Dach mit hochgezogenen goldenen Ecken, rote Laternen an
// den Dachecken, eine Spitze mit Ringen obendrauf; der große Tempel bekommt zwei Löwenwächter
function temple(kit, tiers, w, stone, roof, { grand = false } = {}) {
  const { M, E, at, group } = kit;
  const parts = [];
  const pillarM = M('#c8302a'), gold = M('#ffcf4a', { metalness: 0.7, roughness: 0.3 }), roofM = M(roof, { metalness: 0.5, roughness: 0.35 }), lamp = E('#ff5a3a', 1.4);
  parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(w * 1.25, 0.35, w * 1.25), M('#c8c0b0')), 0, 0.17, 0));
  if (grand) for (let k = 0; k < 4; k++) parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(w * 0.4, 0.12, 0.3), M('#c8c0b0')), 0, 0.06 + k * 0.08, w * 0.62 + 0.3 - k * 0.15));
  let y = 0.35;
  for (let i = 0; i < tiers; i++) {
    const s = w * (1 - i * 0.2);
    parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(s * 0.86, 0.9, s * 0.86), M(stone)), 0, y + 0.45, 0));
    for (const [cx, cz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.9, 8), pillarM), cx * s * 0.45, y + 0.45, cz * s * 0.45));
    for (const [nx, nz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(nz ? s * 0.3 : 0.04, 0.4, nx ? s * 0.3 : 0.04), E('#ffd98a', 0.7)), nx * s * 0.435, y + 0.5, nz * s * 0.435));
    const r = at(new THREE.Mesh(new THREE.ConeGeometry(s * 0.88, 0.55, 4), roofM), 0, y + 1.17, 0);
    r.rotation.y = Math.PI / 4;
    parts.push(r);
    parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(s * 1.24, 0.06, s * 1.24), gold), 0, y + 0.92, 0));
    for (const [cx, cz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const tip = at(new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.35, 5), gold), cx * s * 0.62, y + 1.02, cz * s * 0.62);
      tip.rotation.set(cz * 0.8, 0, -cx * 0.8);
      parts.push(tip);
      parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.25, 4), M('#2a2a2a')), cx * s * 0.6, y + 0.8, cz * s * 0.6));
      parts.push(at(new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), lamp), cx * s * 0.6, y + 0.62, cz * s * 0.6));
    }
    y += 1.5;
  }
  parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 1.0, 6), gold), 0, y + 0.1, 0));
  for (let k = 0; k < 3; k++) parts.push(at(new THREE.Mesh(new THREE.TorusGeometry(0.16 - k * 0.03, 0.025, 4, 12), gold), 0, y - 0.15 + k * 0.25, 0));
  for (let k = parts.length - 3; k < parts.length; k++) parts[k].rotation.x = Math.PI / 2;
  parts.push(at(new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), E('#ffd76a', 1.4)), 0, y + 0.65, 0));
  if (grand)
    for (const sx of [-1, 1]) {
      const lion = new THREE.Group();
      lion.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.4), M('#c8c0b0')), 0, 0.15, 0));
      lion.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.42), M('#5ad8a0')), 0, 0.5, 0));
      lion.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), M('#5ad8a0')), 0, 0.85, 0.08));
      lion.position.set(sx * w * 0.3, 0, w * 0.62 + 0.55);
      parts.push(lion);
    }
  return group(...parts);
}

// Kristall wie in der Natur: sechseckiges Prisma mit Pyramidenspitze, Fuß bei (0, 0, 0), entlang +Y.
// In Roblox Fläche für Fläche aus Keilen (echte Kanten). Zwei Töne: Seiten abwechselnd heller.
function prismCrystal(kit, len, r, c, glow = 0.5) {
  const { E } = kit;
  const body = len * 0.74, pts = [], n = 6;
  const ring = (y, rr) => Array.from({ length: n }, (_, i) => [Math.cos((i / n) * TAU) * rr, y, Math.sin((i / n) * TAU) * rr]);
  const b0 = ring(-0.05, r * 0.92), b1 = ring(body, r);
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    pts.push(...b0[i], ...b1[i], ...b1[j], ...b0[i], ...b1[j], ...b0[j]);
    pts.push(...b1[i], 0, len, 0, ...b1[j]);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  geo.computeVertexNormals();
  const light = '#' + new THREE.Color(c).offsetHSL(0, 0, 0.1).getHexString();
  // Gruppen: Seiten in zwei Tönen, Spitze im hellen Ton
  for (let i = 0; i < n; i++) geo.addGroup(i * 9, 6, i % 2), geo.addGroup(i * 9 + 6, 3, 1);
  const mats = [E(c, glow, { transparent: true, opacity: 0.88, roughness: 0.1 }), E(light, glow, { transparent: true, opacity: 0.88, roughness: 0.1 })];
  const m = new THREE.Mesh(geo, mats);
  m.userData.rbx = { facets: true, facetsAll: true, facetThick: Math.min(0.06, r * 0.3), name: 'Kristall' };
  return m;
}
// Druse: dunkles Muttergestein, aus dem eine Gruppe Kristalle fächerförmig herauswächst (wie Bergkristall
// auf Matrix). size: Größe des Gesteins
function druse(kit, rand, size, rock, gem, gem2) {
  const g = kit.rockMesh(size, rock, rand);
  const n = 4 + Math.floor(rand() * 3), ox = (rand() - 0.5) * size * 0.4, oz = (rand() - 0.5) * size * 0.4;
  for (let i = 0; i < n; i++) {
    const len = size * (0.9 + rand() * 1.3) * (i === 0 ? 1.3 : 1), r = len * (0.09 + rand() * 0.04);
    const cr = prismCrystal(kit, len, r, i % 3 === 2 && gem2 ? gem2 : gem, 0.5);
    const a = rand() * TAU, tilt = i === 0 ? rand() * 0.25 : 0.3 + rand() * 0.6;
    cr.position.set(ox + Math.cos(a) * size * 0.15, size * 0.45, oz + Math.sin(a) * size * 0.15);
    cr.rotation.set(Math.sin(a) * tilt, rand() * TAU, -Math.cos(a) * tilt, 'YXZ');
    g.add(cr);
  }
  return g;
}

// Welt-Rezept: Farben und was gestreut wird
function make({ gem, gem2, base, ring, rock, extra, emitters, sounds, landmarkSize }) {
  return {
    build(ctx, kit) {
      const { rand, rr, R, scatter } = ctx;
      landmark(ctx, kit, gem, { size: landmarkSize ?? 2.4, base, ring });
      extra?.(ctx, kit);
      // Boden: Flecken aus Gestein und Kristallsand, leicht dunkler und heller als der Bodenton der Welt
      // (fest dunkle Flecken wirkten auf dunklen Welten wie Löcher)
      const g0 = ctx.world.ground, gl = new THREE.Color(g0).getHSL({}).l;
      // auf sehr dunklem Boden beide Töne heller (dunkler als der Boden wäre fast schwarz)
      const dark = '#' + new THREE.Color(g0).offsetHSL(0, -0.04, gl < 0.25 ? 0.035 : -0.07).getHexString();
      const pale = '#' + new THREE.Color(g0).offsetHSL(0, -0.02, gl < 0.25 ? 0.085 : 0.07).getHexString();
      for (let i = 0; i < 14; i++) {
        const a = rand() * TAU, r = Math.sqrt(rand()) * (R - 2);
        // Material des Bodens behalten (Schiefer und Kies färbten dunkle Böden fast schwarz)
        ctx.paint(Math.cos(a) * r, Math.sin(a) * r, rr(1.2, 2.4), i % 2 ? dark : pale, null);
      }
      // Drusen aus dunklem Gestein mit Kristallfächern; dazu wenige lose Kristallgruppen und Steine.
      // Feste Anzahl (rMax unter R − 2,5), vorher vervielfachte scatter alles mit der Inselfläche
      const inner = R - 2.6;
      // Muttergestein deutlich dunkler als der Boden, damit die Kristalle davor leuchten
      const hsl = new THREE.Color(rock).getHSL({});
      const matrix = '#' + new THREE.Color().setHSL(hsl.h, hsl.s * 0.5, Math.min(hsl.l, 0.2)).getHexString();
      scatter(10, () => druse(kit, rand, rr(0.6, 1), matrix, gem, gem2), 1.3, 3, inner);
      scatter(10, () => cluster(kit, rand, rr(0.8, 1.6), gem, gem2), 0.8, 3, inner);
      scatter(8, () => kit.rockMesh(rr(0.4, 0.8), rock, rand), 0.7, 3, inner);
      scatter(14, () => gemStone(kit, rr(0.14, 0.22), rand() < 0.5 ? gem : gem2 || gem, 0.9), 0.3, 2, inner);
    },
    emitters(ctx, add) {
      add('Funkeln', [0, 2, 0], [ctx.R * 2.2, 4, ctx.R * 2.2], [gem, '#ffffff'], 0.14, 16, [0.1, 0.4], [3, 6], { light: 1 });
      emitters?.(ctx, add);
    },
    sounds: sounds || [['Klingen', 'leises Klingen von Kristallen', 0.3]],
    // Umgebung: Nachbarinseln mit Felsgipfel und schwebende Inselchen, auf allen wachsen Kristallgruppen
    backdrop(ctx, kit) {
      const { rand, rr, root } = ctx;
      const crystals = (x, y, z, half, n, keep) => {
        for (let i = 0, tries = 0; i < n && tries < n * 5; tries++) {
          const a = rand() * TAU, d = n > 1 ? half * rr(0.1, 0.7) : 0;
          const dx = Math.cos(a) * d, dz = Math.sin(a) * d;
          if (keep && Math.hypot(dx - keep[0], dz - keep[1]) < keep[2]) continue;
          const c = cluster(kit, rand, Math.min(2.6, half * rr(0.35, 0.6)), gem, gem2);
          c.position.set(x + dx, y + domeAt(half, d) - 0.1, z + dz);
          c.rotation.y = rand() * TAU;
          c.traverse((o) => o.isMesh && (o.userData.rbx = { ...(o.userData.rbx || {}), sky: true }));
          root.add(c);
          i++;
        }
      };
      neighborIsles(ctx, { n: 5, w: [5, 7.5], peak: 0.6, trees: [], onTop: (x, y, z, half, keep) => crystals(x, y, z, half, 4, keep) });
      floatingIsles(ctx, { far: 5, near: 6, tops: ['-'], small: ['-'], onTop: (x, y, z, half) => crystals(x, y, z, half, half > 1.5 ? 2 : 1) });
    },
  };
}

const QUARZFELD = make({
  gem: '#f4f0ff', gem2: '#d8ccff', base: '#a8a0c4', rock: '#c8c2dc', ring: '#c98bff',
  extra(ctx, kit) {
    ctx.scatter(8, () => pillar(kit, ctx.rr(1.4, 3.2), '#f4f0ff', 0.35), 0.9, 4, ctx.R - 2.6);
  },
});
const AMETHYSTGROTTE = make({
  gem: '#a35ae8', gem2: '#ead2ff', base: '#4a2e72', rock: '#3a2458', ring: '#ead2ff',
  extra(ctx, kit) {
    // aufgebrochene Drusen: Halbkugel aus Fels, innen voller Kristalle
    // (Werkstatt-Wunsch „Steine verbessern“): größer, außen rauer Fels mit Buckeln, innen eine dunkle
    // Schale, dicht besetzt mit leuchtenden Kristallen, die zur Mitte zeigen; Kristalle auch am Rand
    for (let i = 0; i < 4; i++) {
      const p = ctx.spot(2.4, 5, ctx.R - 2.4);
      if (!p) continue;
      const S = ctx.rr(1.7, 2.2);
      const tilt = -0.85;
      const shell = kit.at(new THREE.Mesh(new THREE.SphereGeometry(S, 14, 8, 0, TAU, 0, Math.PI / 2), kit.M('#4a3a5a', { side: THREE.DoubleSide })), 0, 0, 0);
      shell.rotation.x = tilt;
      const inner = kit.at(new THREE.Mesh(new THREE.SphereGeometry(S * 0.88, 14, 8, 0, TAU, 0, Math.PI / 2), kit.M('#2a1840', { side: THREE.DoubleSide })), 0, 0.02, 0);
      inner.rotation.x = tilt;
      const g = kit.group(shell, inner);
      for (let k = 0; k < 10; k++) {
        const b = kit.at(new THREE.Mesh(new THREE.DodecahedronGeometry(ctx.rr(0.25, 0.45), 0), kit.M('#5a4a6a')), 0, 0, 0);
        const a = ctx.rand() * TAU, ph = ctx.rr(0.1, 1.3);
        const v = new THREE.Vector3(Math.cos(a) * Math.sin(ph), Math.cos(ph), Math.sin(a) * Math.sin(ph)).multiplyScalar(S * 0.98).applyAxisAngle(new THREE.Vector3(1, 0, 0), tilt);
        if (v.y < 0) continue;
        b.position.copy(v);
        g.add(b);
      }
      const cols = ['#a35ae8', '#c98bff', '#ead2ff', '#8a3ad8'];
      for (let k = 0; k < 16; k++) {
        const a = ctx.rand() * TAU, ph = ctx.rr(0.2, 1.4);
        const dir = new THREE.Vector3(Math.cos(a) * Math.sin(ph), Math.cos(ph), Math.sin(a) * Math.sin(ph)).applyAxisAngle(new THREE.Vector3(1, 0, 0), tilt);
        const c = kit.crystal(ctx.rr(0.45, 0.9), cols[k % 4], ctx.rand, 1.6);
        c.position.copy(dir.clone().multiplyScalar(S * 0.82));
        c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().negate());
        g.add(c);
      }
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * TAU, c = kit.crystal(ctx.rr(0.5, 0.8), '#c98bff', ctx.rand, 1.6);
        c.position.set(Math.cos(a) * S * 1.02, 0.05, Math.sin(a) * S * 1.02 * 0.6 + S * 0.25);
        g.add(c);
      }
      g.add(kit.at(new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8), kit.E('#e2b8ff', 1.4, { transparent: true, opacity: 0.6 })), 0, S * 0.35, S * 0.15));
      ctx.put(g, p[0], p[1]);
    }
  },
  emitters(ctx, add) {
    add('Sporen', [0, 1, 0], [ctx.R * 2, 2, ctx.R * 2], ['#c98bff', '#ead2ff'], 0.12, 8, [0.2, 0.5], [6, 9], { light: 0.8 });
  },
  sounds: [['Grotte', 'Tropfen und hallendes Klingen in einer Grotte', 0.35]],
});
const TOPASDUENEN = make({
  gem: '#ffb02e', gem2: '#fff0b8', base: '#c8904a', rock: '#d8a25a', ring: '#fff0b8',
  extra(ctx, kit) {
    // Topas-Obelisk und Dünenkämme
    const p = ctx.spot(1.2, 6, ctx.R - 3);
    if (p) ctx.put(pillar(kit, 5, '#ffb02e', 0.5), p[0], p[1]);
    ctx.scatter(4, () => {
      const d = kit.at(new THREE.Mesh(new THREE.SphereGeometry(1.2, 10, 6, 0, TAU, 0, Math.PI / 2), kit.M('#f2c46a')), 0, 0, 0);
      d.scale.set(1.6, 0.45, 0.8);
      return kit.group(d);
    }, 1.4, 5, ctx.R - 2.6);
    // Sandrippeln quer zum Wind
    ctx.scatter(10, () => {
      const g = new THREE.Group();
      for (let i = 0; i < 4; i++) {
        const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.4, 0), kit.M('#f2c46a'));
        m.userData.rbx = { facets: true, facetThick: 0.04, name: 'Sandrippel' };
        m.scale.set(0.5, 0.18, 2.6);
        m.position.set(i * 0.42, 0, 0);
        g.add(m);
      }
      return g;
    }, 1.2, 3, ctx.R - 2.6, { rot: false });
  },
  emitters(ctx, add) {
    add('Goldstaub', [0, 1, 0], [ctx.R * 2.2, 1, ctx.R * 2.2], ['#ffd76a', '#fff0b8'], 0.12, 10, [0.6, 1.2], [4, 6], { spread: [10, 80] });
  },
  sounds: [['Wüstenwind', 'warmer Wind über Dünen', 0.35]],
});
const SMARAGDWALD = make({
  gem: '#1ec870', gem2: '#b4ffd6', base: '#1e6a44', rock: '#2a5a40', ring: '#b4ffd6',
  extra(ctx, kit) {
    ctx.scatter(18, () => gemTree(kit, ctx.rand, ctx.rr(2.4, 3.8), '#5a4430', ctx.rand() < 0.7 ? '#1ec870' : '#3ee08a'), 1.1, 4, ctx.R - 2.6);
    ctx.scatter(16, () => kit.bush(ctx.rr(0.3, 0.5), '#2fa86a', ctx.rand), 0.5, 3, ctx.R - 2.6);
    // Unterholz wie im Regenwald: Farne und Moospolster
    ctx.scatter(16, () => kit.fern(ctx.rr(0.5, 0.8), ctx.rand() < 0.5 ? '#2f9a5a' : '#3fb06a', ctx.rand), 0.5, 2, ctx.R - 2.6);
    ctx.scatter(10, () => kit.mossMound(ctx.rr(0.4, 0.7), '#2a8a4a', ctx.rand), 0.5, 2, ctx.R - 2.6);
  },
  emitters(ctx, add) {
    add('Glühwürmchen', [0, 1.5, 0], [ctx.R * 2, 3, ctx.R * 2], ['#b4ffd6', '#d9ff7a'], 0.12, 10, [0.1, 0.3], [4, 7], { light: 1 });
  },
  sounds: [['Glöckchen', 'Blätter aus Smaragd klingen im Wind wie Glöckchen', 0.3], ['Vögel', 'fremde Vögel im Dschungel', 0.2]],
});
const JADETEMPEL = make({
  gem: '#5ad8a0', gem2: '#ffd76a', base: '#3a6a4a', rock: '#5a9a70', ring: '#ffd76a', landmarkSize: 1.8,
  extra(ctx, kit) {
    const p = ctx.spot(3.6, 7, ctx.R - 4);
    if (p) ctx.put(temple(kit, 4, 5, '#8ad0a0', '#e8b84a', { grand: true }), p[0], p[1]);
    ctx.scatter(4, () => temple(kit, 2, 1.8, '#8ad0a0', '#e8b84a'), 1.4, 6, ctx.R - 2.6);
    ctx.scatter(10, () => kit.roundTree(ctx.rr(1.6, 2.4), '#4aa86a', ctx.rand), 0.9, 4, ctx.R - 2.6);
  },
  sounds: [['Gong', 'ferner Tempelgong', 0.25], ['Wind', 'sanfter Bergwind', 0.3]],
});
const SAPHIRSEE = make({
  gem: '#2a5ae8', gem2: '#cfe0ff', base: '#3a5aa0', rock: '#6a8ad0', ring: '#cfe0ff',
  extra(ctx, kit) {
    // Saphirsee (Werkstatt-Wunsch „Saphirsee verbessern“): größerer See mit tiefblauer Mitte und hellem Rand,
    // Ufer aus Steinen, Saphire auf dem Grund, eine Insel mit großem Saphir, ein Holzsteg mit Laterne,
    // Kristallgruppen am Ufer und Seerosen
    const p = ctx.spot(4.2, 6, ctx.R - 4.6) || ctx.spot(3.8, 4, ctx.R - 4);
    if (p) {
      ctx.reserve(p[0], p[1], 4.2);
      const LR = 3.6;
      const g = kit.group(
        kit.at(new THREE.Mesh(new THREE.CylinderGeometry(LR, LR, 0.12, 32), kit.E('#5a8aff', 0.25, { transparent: true, opacity: 0.7, roughness: 0.05 })), 0, 0.12, 0),
        kit.at(new THREE.Mesh(new THREE.CylinderGeometry(LR * 0.6, LR * 0.6, 0.13, 28), kit.E('#1a3ac8', 0.35, { transparent: true, opacity: 0.8, roughness: 0.05 })), 0, 0.125, 0),
      );
      for (let i = 0; i < 22; i++) {
        const a = (i / 22) * TAU + ctx.rand() * 0.15;
        const st = kit.rockMesh(ctx.rr(0.18, 0.32), '#8a9ac0', ctx.rand);
        st.position.set(Math.cos(a) * (LR + 0.1), 0.05, Math.sin(a) * (LR + 0.1));
        g.add(st);
      }
      for (let i = 0; i < 12; i++) {
        const a = ctx.rand() * TAU, r = ctx.rand() * (LR - 0.6);
        const st = gemStone(kit, 0.16, '#8ab0ff', 1.6);
        st.position.set(Math.cos(a) * r, 0.1, Math.sin(a) * r);
        g.add(st);
      }
      // Insel mit großem Saphir
      const isle = kit.at(new THREE.Mesh(new THREE.DodecahedronGeometry(0.75, 0), kit.M('#6a7aa0')), 0.6, 0.1, -0.5);
      isle.scale.set(1, 0.45, 1);
      g.add(isle);
      const big = gemStone(kit, 0.45, '#2a5ae8', 1.8);
      big.position.set(0.6, 0.55, -0.5);
      g.add(big);
      // Holzsteg mit Laterne
      const a0 = ctx.rand() * TAU, ca = Math.cos(a0), sa = Math.sin(a0);
      for (let k = 0; k < 6; k++) {
        const r = LR + 0.4 - k * 0.42, plank = kit.at(new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.06, 0.36), kit.M('#8a6440')), ca * r, 0.26, sa * r);
        plank.rotation.y = -a0 + Math.PI / 2;
        g.add(plank);
        if (k % 2 === 0) for (const sd of [-1, 1]) g.add(kit.at(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.4, 5), kit.M('#6a4a2e')), ca * r - sa * sd * 0.35, 0.15, sa * r + ca * sd * 0.35));
      }
      const rr2 = LR + 0.4 - 5 * 0.42;
      g.add(kit.at(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.8, 5), kit.M('#3a3446')), ca * rr2, 0.65, sa * rr2));
      g.add(kit.at(new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.2, 0.16), kit.E('#cfe0ff', 1.4)), ca * rr2, 1.1, sa * rr2));
      // Seerosen
      for (let k = 0; k < 6; k++) {
        const a = ctx.rand() * TAU, r = ctx.rr(1.2, LR - 0.4);
        g.add(kit.at(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 10), kit.M('#3a8a4a')), Math.cos(a) * r, 0.2, Math.sin(a) * r));
        g.add(kit.at(new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 4), kit.M(k % 2 ? '#ffffff' : '#ffd6ec')), Math.cos(a) * r, 0.25, Math.sin(a) * r));
      }
      // Kristallgruppen am Ufer
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * TAU + 0.6, cg = new THREE.Group();
        for (let m = 0; m < 3; m++) {
          const c = kit.crystal(ctx.rr(0.4, 0.8), m % 2 ? '#cfe0ff' : '#5a8aff', ctx.rand, 1.4);
          c.position.set(ctx.rr(-0.2, 0.2), 0, ctx.rr(-0.2, 0.2));
          c.rotation.set(ctx.rr(-0.3, 0.3), 0, ctx.rr(-0.3, 0.3));
          cg.add(c);
        }
        cg.position.set(Math.cos(a) * (LR + 0.6), 0, Math.sin(a) * (LR + 0.6));
        g.add(cg);
      }
      ctx.put(g, p[0], p[1], { sink: 0.02, rot: false });
      ctx.paint(p[0], p[1], LR + 1.0, '#9ab0d8', 'Pebble');
    }
  },
  emitters(ctx, add) {
    add('Sterne', [0, 6, 0], [ctx.R * 2.4, 2, ctx.R * 2.4], ['#cfe0ff', '#ffffff'], 0.1, 8, [0, 0.1], [4, 7], { light: 1 });
  },
  sounds: [['Wasser', 'ruhiges Plätschern am See', 0.3]],
});
const RUBINVULKAN = make({
  gem: '#e8183a', gem2: '#ff8a9a', base: '#2a1018', rock: '#2a1a20', ring: '#ff4a6a',
  extra(ctx, kit) {
    // Vulkan (Werkstatt-Wunsch „Vulkan verbessern“): hoher, zerklüfteter Kegel (Fläche für Fläche in Roblox),
    // glühender Kraterrand, Rubinsee im Krater mit großen Rubinkristallen, glühende Rinnen an den Flanken,
    // Rubine wachsen aus dem Hang, aktiv mit Rauch und Glut
    const p = ctx.spot(4.6, 7, ctx.R - 4.6) || ctx.spot(4.2, 5, ctx.R - 4.2);
    if (p) {
      const VR = 4.2, VT = 0.95, VH = 6.4;
      const geo = new THREE.CylinderGeometry(VT, VR, VH, 14, 5, true);
      const pos = geo.attributes.position;
      for (let k = 0; k < pos.count; k++) {
        const y = pos.getY(k);
        if (y > VH / 2 - 0.05) continue;
        const n = Math.sin(pos.getX(k) * 3.1 + pos.getZ(k) * 2.3) * 0.25;
        pos.setXYZ(k, pos.getX(k) * (1 + n * 0.3), y, pos.getZ(k) * (1 + n * 0.3));
      }
      geo.computeVertexNormals();
      const cone = kit.at(new THREE.Mesh(geo, kit.M('#2a1a20')), 0, VH / 2, 0);
      cone.userData.rbx = { facets: true, facetThick: 0.3, name: 'Vulkan' };
      const crater = kit.at(new THREE.Mesh(new THREE.CylinderGeometry(VT * 0.85, VT * 0.85, 0.1, 14), kit.E('#ff3a5a', 2)), 0, VH + 0.02, 0);
      const rim = kit.at(new THREE.Mesh(new THREE.TorusGeometry(VT * 0.92, 0.08, 6, 24), kit.E('#ff6a7a', 1.6)), 0, VH + 0.02, 0);
      rim.rotation.x = Math.PI / 2;
      const g = kit.group(cone, crater, rim);
      for (let i = 0; i < 5; i++) {
        const c = kit.crystal(ctx.rr(0.6, 1.1), i % 2 ? '#ff4a6a' : '#e8183a', ctx.rand, 1.8);
        c.position.set(Math.cos(i * 1.3) * 0.35, VH, Math.sin(i * 1.3) * 0.35);
        c.rotation.set(ctx.rr(-0.4, 0.4), 0, ctx.rr(-0.4, 0.4));
        g.add(c);
      }
      // glühende Rinnen vom Krater zum Fuß
      const glowM = kit.E('#ff2a4a', 1.3);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU + ctx.rand() * 0.3;
        for (let k = 0; k < 4; k++) {
          const t0 = k / 4, t1 = (k + 1) / 4;
          const pt = (t) => new THREE.Vector3(Math.cos(a) * (VT + (VR - VT) * t + 0.06), VH * (1 - t), Math.sin(a) * (VT + (VR - VT) * t + 0.06));
          const p0 = pt(t0), p1 = pt(t1), m = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, p0.distanceTo(p1) + 0.04), glowM);
          m.position.copy(p0).add(p1).multiplyScalar(0.5);
          m.lookAt(p1);
          g.add(m);
        }
      }
      // Rubine wachsen aus dem Hang
      for (let i = 0; i < 8; i++) {
        const a = ctx.rand() * TAU, t = ctx.rr(0.3, 0.85), r = VT + (VR - VT) * t;
        const c = kit.crystal(ctx.rr(0.35, 0.6), '#e8183a', ctx.rand, 1.5);
        c.position.set(Math.cos(a) * r, VH * (1 - t), Math.sin(a) * r);
        c.rotation.set(Math.sin(a) * 0.7, 0, -Math.cos(a) * 0.7);
        g.add(c);
      }
      ctx.put(g, p[0], p[1], { rot: false });
      ctx.anims.push((t) => (crater.material.emissiveIntensity = 1.6 + Math.sin(t * 1.8) * 0.6));
      const top = ctx.height(p[0], p[1]) + VH;
      (ctx.shared.emitters = ctx.shared.emitters || []).push(
        { name: 'Vulkanrauch', keep: true, pos: [p[0], top + 0.4, p[1]], size: [1.2, 0.2, 1.2], colors: ['#3a2a30', '#5a4048'], particleSize: 1.2, sizeEnd: 3.6, rate: 5, speed: [0.8, 1.3], lifetime: [6, 9], spread: [10, 10], direction: 'Top', lightEmission: 0, drag: 0.08, transparency: [[0, 1], [0.1, 0.4], [0.7, 0.75], [1, 1]] },
        { name: 'Kraterglut', keep: true, pos: [p[0], top + 0.2, p[1]], size: [1.2, 0.1, 1.2], colors: ['#ffb07a', '#ff3a5a'], particleSize: 0.12, sizeEnd: 0.04, rate: 8, speed: [0.8, 1.6], lifetime: [0.8, 1.5], spread: [20, 20], direction: 'Top', lightEmission: 1 },
      );
    }
    // glühende Risse im dunklen Boden, verzweigt wie auf einem Lavafeld
    const glow = kit.E('#ff3a5a', 1.4);
    for (let c = 0; c < 7; c++) {
      const p0 = ctx.spot(0.4, 3, ctx.R - 2.6);
      if (!p0) continue;
      let [x, z] = p0, a = ctx.rand() * TAU;
      for (let k = 0; k < 5; k++) {
        const len = ctx.rr(0.5, 0.9), nx = x + Math.cos(a) * len, nz = z + Math.sin(a) * len;
        if (Math.hypot(nx, nz) > ctx.R - 2.6) break;
        const crack = new THREE.Mesh(new THREE.BoxGeometry(len, 0.04, 0.07), glow);
        crack.position.set((x + nx) / 2, ctx.height((x + nx) / 2, (z + nz) / 2) + 0.02, (z + nz) / 2);
        crack.rotation.y = -a;
        ctx.root.add(crack);
        x = nx; z = nz; a += ctx.rr(-0.9, 0.9);
      }
    }
  },
  emitters(ctx, add) {
    add('Glut', [0, 0.5, 0], [ctx.R * 2, 1, ctx.R * 2], ['#ff3a5a', '#ffb07a'], 0.12, 12, [0.6, 1.4], [3, 5], { spread: [12, 12], light: 1 });
  },
  sounds: [['Grollen', 'tiefes Vulkangrollen', 0.4]],
});
const OPALWOLKEN = make({
  gem: '#ff9ae0', gem2: '#5ad8ff', base: '#d0c8f0', rock: '#e8e2fa', ring: '#5ad8ff',
  extra(ctx, kit) {
    const colors = ['#ffe2f6', '#e2f0ff', '#f0ffe8', '#fff2d8'];
    ctx.scatter(12, (i) => puff(kit, ctx.rand, ctx.rr(0.8, 1.4), colors[i % colors.length]), 1.2, 4, ctx.R - 2.6);
    // kleine Details (Werkstatt-Wunsch): schimmernde Opalsteine mit Farbflecken, Kristallsplitter,
    // Wolkenblumen und Grasbüschel in Pastell zwischen den Wolkenbuckeln
    const { rand, rr } = ctx, inner = ctx.R - 2.6;
    const fleck = ['#ff9ae0', '#5ad8ff', '#a8ffb8', '#fff2a0', '#c8a2ff'];
    ctx.scatter(22, () => {
      const g = new THREE.Group(), s0 = rr(0.12, 0.24);
      const body = kit.at(new THREE.Mesh(new THREE.SphereGeometry(s0, 10, 6), kit.M('#f4eefc', { roughness: 0.15, metalness: 0.1, emissive: '#e8dcff', emissiveIntensity: 0.15 })), 0, s0 * 0.35, 0);
      body.scale.set(1.25, 0.55, 1);
      g.add(body);
      for (let i = 0; i < 3; i++) {
        const c = fleck[Math.floor(rand() * fleck.length)];
        const f = kit.at(new THREE.Mesh(new THREE.SphereGeometry(s0 * 0.32, 6, 4), kit.E(c, 0.5)), rr(-0.5, 0.5) * s0, s0 * 0.55, rr(-0.4, 0.4) * s0);
        f.scale.set(1.2, 0.35, 1);
        g.add(f);
      }
      return g;
    }, 0.3, 2, inner);
    ctx.scatter(10, () => {
      const g = new THREE.Group();
      for (let i = 0; i < 3; i++) {
        const c = kit.crystal(rr(0.18, 0.32), fleck[Math.floor(rand() * fleck.length)], rand, 1.2);
        c.position.set(rr(-0.15, 0.15), 0, rr(-0.15, 0.15));
        c.rotation.set(rr(-0.4, 0.4), rand() * TAU, rr(-0.4, 0.4));
        g.add(c);
      }
      return g;
    }, 0.35, 2, inner);
    const petals = ['#ffd6f0', '#d6ecff', '#e8dcff', '#fff2c8'];
    ctx.scatter(18, () => {
      const g = new THREE.Group(), c = petals[Math.floor(rand() * petals.length)], h = rr(0.18, 0.32);
      g.add(kit.at(new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, h, 5), kit.M('#a8d8b8')), 0, h / 2, 0));
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * TAU;
        const p = kit.at(new THREE.Mesh(new THREE.SphereGeometry(0.055, 6, 4), kit.M(c, { roughness: 0.6 })), Math.cos(a) * 0.06, h, Math.sin(a) * 0.06);
        p.scale.set(1, 0.45, 1);
        g.add(p);
      }
      g.add(kit.at(new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4), kit.E('#fff2a0', 0.4)), 0, h + 0.02, 0));
      return g;
    }, 0.2, 2, inner);
    ctx.scatter(16, () => {
      const g = new THREE.Group(), c = rand() < 0.5 ? '#b8e8c8' : '#d8c8f0';
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * TAU + rand() * 0.5, h = rr(0.14, 0.26);
        const blade = kit.at(new THREE.Mesh(new THREE.ConeGeometry(0.025, h, 4), kit.M(c)), Math.cos(a) * 0.04, h / 2, Math.sin(a) * 0.04);
        blade.rotation.set(Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35);
        g.add(blade);
      }
      return g;
    }, 0.18, 2, inner);
  },
  sounds: [['Höhenwind', 'leiser Wind über den Wolken', 0.3]],
});
const DIAMANTKERN = make({
  gem: '#e8fdff', gem2: '#8af0ff', base: '#5a8aa0', rock: '#9ad0e0', ring: '#8af0ff', landmarkSize: 3,
  extra(ctx, kit) {
    // Kristallbögen
    ctx.scatter(2, () => {
      const arc = kit.at(new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.18, 6, 16, Math.PI), kit.E('#8af0ff', 0.6, { transparent: true, opacity: 0.85 })), 0, 0, 0);
      return kit.group(arc);
    }, 1.6, 6, ctx.R - 2.6);
    ctx.scatter(8, () => pillar(kit, ctx.rr(1.2, 2.4), '#e8fdff', 0.5), 0.8, 4, ctx.R - 2.6);
  },
  emitters(ctx, add) {
    add('Lichtstrahlen', [0, 0.5, 0], [ctx.R * 1.6, 1, ctx.R * 1.6], ['#e8fdff', '#8af0ff'], 0.18, 8, [1, 2], [3, 5], { spread: [6, 6], light: 1 });
  },
  sounds: [['Summen', 'hohes, reines Summen des Diamanten', 0.3]],
});

export const GEM_WORLDS = {
  quarzfeld: QUARZFELD, amethystgrotte: AMETHYSTGROTTE, topasduenen: TOPASDUENEN,
  smaragdwald: SMARAGDWALD, jadetempel: JADETEMPEL, saphirsee: SAPHIRSEE,
  rubinvulkan: RUBINVULKAN, opalwolken: OPALWOLKEN, diamantkern: DIAMANTKERN,
};
for (const w of Object.values(GEM_WORLDS)) w.landmark = false;

// Partikel und Klänge wie bei planet4After
export function galaxy2After(ctx, kit) {
  const def = GEM_WORLDS[ctx.world.id];
  if (!def) return;
  def.backdrop?.(ctx, kit);
  const list = (ctx.shared.emitters = ctx.shared.emitters || []);
  const add = (name, pos, size, colors, particleSize, rate, speed, lifetime, opts = {}) =>
    list.push({ name, pos, size, colors, particleSize, rate, speed, lifetime, spread: opts.spread ?? [180, 180], direction: opts.direction ?? 'Top', lightEmission: opts.light ?? 0 });
  def.emitters?.(ctx, add);
  ctx.shared.sounds = (def.sounds || []).map(([name, hint, volume]) => ({ name, hint, volume }));
}
