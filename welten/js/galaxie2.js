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
  parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.7, 0.8, 8), M(base)), 0, 0.4, 0));
  parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.9, 0.5, 8), M(base)), 0, 1.05, 0));
  const gem = brilliant(kit, size, color, 1.1);
  gem.position.y = 1.3 + size * 1.3 + float;
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
// Pagode / Tempel in Stufen
function temple(kit, tiers, w, stone, roof) {
  const { M, at, group } = kit;
  const parts = [];
  let y = 0;
  for (let i = 0; i < tiers; i++) {
    const s = w * (1 - i * 0.2);
    parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(s, 0.9, s), M(stone)), 0, y + 0.45, 0));
    const r = at(new THREE.Mesh(new THREE.ConeGeometry(s * 0.82, 0.6, 4), M(roof, { metalness: 0.5, roughness: 0.35 })), 0, y + 1.2, 0);
    r.rotation.y = Math.PI / 4;
    parts.push(r);
    y += 1.5;
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
    for (let i = 0; i < 3; i++) {
      const p = ctx.spot(1.6, 5, ctx.R - 2);
      if (!p) continue;
      const shell = kit.at(new THREE.Mesh(new THREE.SphereGeometry(1.3, 10, 6, 0, TAU, 0, Math.PI / 2), kit.M('#4a3a5a', { side: THREE.DoubleSide })), 0, 0, 0);
      shell.rotation.x = -0.9;
      const g = kit.group(shell);
      for (let k = 0; k < 6; k++) {
        const c = kit.crystal(ctx.rr(0.5, 0.9), '#a35ae8', ctx.rand, 1.4);
        c.position.set((ctx.rand() - 0.5) * 1.4, 0.1, (ctx.rand() - 0.2) * 0.9);
        g.add(c);
      }
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
    if (p) ctx.put(temple(kit, 4, 5, '#8ad0a0', '#e8b84a'), p[0], p[1]);
    ctx.scatter(4, () => temple(kit, 2, 1.8, '#8ad0a0', '#e8b84a'), 1.4, 6, ctx.R - 2.6);
    ctx.scatter(10, () => kit.roundTree(ctx.rr(1.6, 2.4), '#4aa86a', ctx.rand), 0.9, 4, ctx.R - 2.6);
  },
  sounds: [['Gong', 'ferner Tempelgong', 0.25], ['Wind', 'sanfter Bergwind', 0.3]],
});
const SAPHIRSEE = make({
  gem: '#2a5ae8', gem2: '#cfe0ff', base: '#3a5aa0', rock: '#6a8ad0', ring: '#cfe0ff',
  extra(ctx, kit) {
    // See mit Saphiren auf dem Grund
    const p = ctx.spot(3.4, 6, ctx.R - 4) || ctx.spot(3.2, 4, ctx.R - 3.3);
    if (p) ctx.reserve(p[0], p[1], 3.4);
    if (p) {
      const water = kit.at(new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 0.12, 24), kit.E('#2a5ae8', 0.25, { transparent: true, opacity: 0.75, roughness: 0.05 })), 0, 0.12, 0);
      const g = kit.group(water);
      for (let i = 0; i < 9; i++) {
        const a = ctx.rand() * TAU, r = ctx.rand() * 2.4;
        const st = gemStone(kit, 0.16, '#8ab0ff', 1.6);
        st.position.set(Math.cos(a) * r, 0.1, Math.sin(a) * r);
        g.add(st);
      }
      ctx.put(g, p[0], p[1], { sink: 0.02 });
      // Kiesufer wie an einem Gletschersee, Eisschollen auf dem Wasser
      ctx.paint(p[0], p[1], 4.1, '#9ab0d8', 'Pebble');
      for (let i = 0; i < 5; i++) {
        const a = ctx.rand() * TAU, r = ctx.rr(0.6, 2.2);
        const floe = kit.at(new THREE.Mesh(new THREE.CylinderGeometry(ctx.rr(0.3, 0.55), ctx.rr(0.3, 0.55), 0.12, 6), kit.M('#eaf4ff')), p[0] + Math.cos(a) * r, 0, p[1] + Math.sin(a) * r);
        floe.position.y = ctx.height(floe.position.x, floe.position.z) + 0.16;
        floe.rotation.y = ctx.rand() * 3;
        ctx.root.add(floe);
      }
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
    // Vulkan mit glühendem Rubinkrater
    const p = ctx.spot(3.8, 7, ctx.R - 4);
    if (p) {
      const cone = kit.at(new THREE.Mesh(new THREE.CylinderGeometry(0.9, 3.4, 3.6, 10), kit.M('#2a1a20')), 0, 1.8, 0);
      const crater = kit.at(new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.1, 10), kit.E('#ff3a5a', 2)), 0, 3.62, 0);
      const g = kit.group(cone, crater);
      for (let i = 0; i < 4; i++) {
        const st = gemStone(kit, 0.25, '#e8183a', 1.4);
        st.position.set((ctx.rand() - 0.5) * 0.8, 3.75, (ctx.rand() - 0.5) * 0.8);
        g.add(st);
      }
      ctx.put(g, p[0], p[1], { rot: false });
      ctx.anims.push((t) => (crater.material.emissiveIntensity = 1.6 + Math.sin(t * 1.8) * 0.6));
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
  },
  emitters(ctx, add) {
    add('Schimmer', [0, 3, 0], [ctx.R * 2.2, 4, ctx.R * 2.2], ['#ff9ae0', '#5ad8ff', '#fff2a0'], 0.14, 14, [0.1, 0.3], [5, 8], { light: 1 });
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
