// Neue Welten aus dem Weltkarten-Design: Tiefseegraben (Planet 3) und Planet 4 „Himmelreich“ mit Wolkenburg,
// Engelsgarten und Götterthron. Jede Welt hat ein großes Wahrzeichen, Wege mit Münz-Lichtungen, Deko aus den
// CC0-Modellen (KayKit) und eigenen Bausteinen, bewegte Teile, Partikel und Plätze für Klänge.
// Einheiten der Webseite (1 Einheit = 8 Studs), Inselradius R = 16.

import * as THREE from 'three';
import { paths } from './planet1.js';
import { model, stand, scatterModels, around, clearing } from './modelWorlds.js';

const TAU = Math.PI * 2;

const PATHS = {
  tiefseegraben: { color: '#3a4652', kind: 'stone', glow: '#5affd8' },
  wolkenburg: { color: '#f4f0ff', kind: 'tile', edge: '#ffd76a' },
  engelsgarten: { color: '#f8f4ea', kind: 'stone' },
  goetterthron: { color: '#fff3d6', kind: 'tile', edge: '#ffcf4a', edgeMetal: true, wide: true, deco: 'saeulen' },
};

// ── kleine Bausteine ──
function gold(M) {
  return M('#ffcf4a', { metalness: 0.7, roughness: 0.3, emissive: '#b8860b', emissiveIntensity: 0.25 });
}
// Wolkenbausch (Werkstatt-Wunsch „vor allem die Wolken verbessern“): flacher, breiter Sockel aus mehreren
// Kugeln, darüber höhere Bäusche, die Mitte am höchsten; unten zart lavendel getönt, oben strahlend weiß
function cloudPuff(kit, rand, s = 1, c = '#ffffff') {
  const { M, at, group } = kit;
  const parts = [];
  const top = M(c, { roughness: 1 }), under = M('#e6e4f6', { roughness: 1 }), mid = M('#f4f3fc', { roughness: 1 });
  for (let i = 0; i < 5; i++) {
    const r = s * (0.45 + rand() * 0.2), x = (i - 2) * s * 0.5, z = (rand() - 0.5) * s * 0.5;
    const m = at(new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), under), x, r * 0.35, z);
    m.scale.set(1.2, 0.6, 1);
    parts.push(m);
  }
  for (let i = 0; i < 4; i++) {
    const r = s * (0.5 + rand() * 0.25) * (i === 1 || i === 2 ? 1.2 : 0.9), x = (i - 1.5) * s * 0.55;
    parts.push(at(new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), i % 2 ? top : mid), x, s * 0.45 + r * 0.55, (rand() - 0.5) * s * 0.35));
  }
  parts.push(at(new THREE.Mesh(new THREE.IcosahedronGeometry(s * 0.55, 1), top), (rand() - 0.5) * s * 0.3, s * 1.15, 0));
  return group(...parts);
}
// weißer Baum mit goldenem Laub
function goldTree(kit, rand, h) {
  const { M, E, at, group } = kit;
  const trunkM = M('#f4f0ea');
  const g = group(at(new THREE.Mesh(new THREE.CylinderGeometry(h * 0.05, h * 0.08, h * 0.55, 7), trunkM), 0, h * 0.27, 0));
  for (const s of [-1, 1]) {
    const b = at(new THREE.Mesh(new THREE.CylinderGeometry(h * 0.025, h * 0.035, h * 0.3, 5), trunkM), s * h * 0.09, h * 0.55, 0);
    b.rotation.z = -s * 0.6;
    g.add(b);
  }
  const leaf = E('#ffd76a', 0.35, { metalness: 0.4, roughness: 0.4 });
  for (let i = 0; i < 3; i++) {
    const r = h * (0.26 - i * 0.04);
    const ball = at(new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), leaf), (rand() - 0.5) * h * 0.3, h * (0.68 + i * 0.13), (rand() - 0.5) * h * 0.3);
    ball.rotation.set(rand() * 3, rand() * 3, 0);
    ball.userData.rbx = { facets: true, facetThick: Math.min(0.15, r * 0.15), name: 'Goldlaub' }; // kantige Krone wie die Laubbäume
    g.add(ball);
  }
  return g;
}

// ── Tiefseegraben ──
const TIEFSEEGRABEN = {
  build(ctx, kit) {
    const { M, E, at, group } = kit;
    const { rand, rr, R, anims, put, spot, scatter } = ctx;
    // Anglerfisch (Werkstatt-Wunsch, dritte Runde: „größer, gefährlicher, Leuchtangel, echtere Form“): wie der
    // echte Tiefsee-Anglerfisch fast kugelrund mit riesigem Kopf, das Maul weit offen und schräg nach oben, der
    // Unterkiefer schiebt sich weit vor; lange, unregelmäßige, nach innen gebogene Fangzähne (unten auch außen
    // über der Lippe), winzige glühende Augen, fleckige, warzige Haut, kleine Brustflossen, ein Fächerschwanz.
    // Die Angel wächst aus der Stirn und biegt sich in hohem Bogen vor das Maul; am Ende der Köder mit hellem
    // Kern, Lichthof, Leuchtfäden und einem Lichtschein auf dem Boden
    const p = spot(5.2, 3, 9);
    if (p) {
      const skin = M('#1c1a22'), skin2 = M('#2a2630'), spotM = M('#3a3440'), dark = M('#07060a'), toothM = M('#f4efe2', { roughness: 0.35 }), eyeM = E('#c8ff7a', 2.2);
      const parts = [];
      const S = 1.35; // größer als vorher
      const add = (m, x, y, z) => { m.position.set(x * S, y * S, z * S); m.scale.multiplyScalar(S); parts.push(m); return m; };
      // Körper: fast kugelrund, hinten schmaler
      const body = add(new THREE.Mesh(new THREE.SphereGeometry(2.6, 22, 16), skin), 0, 2.9, -0.2);
      body.scale.set(S * 1.0, S * 0.95, S * 1.05);
      const rear = add(new THREE.Mesh(new THREE.SphereGeometry(1.5, 14, 10), skin), 0, 2.8, -2.6);
      rear.scale.set(S * 0.85, S * 0.9, S * 1.1);
      // fleckige, warzige Haut
      for (let k = 0; k < 34; k++) {
        const a = rand() * TAU, b = rr(-0.5, 1.3), r = 2.62;
        const x = Math.cos(a) * Math.cos(b) * r, y = 2.9 + Math.sin(b) * r * 0.95, z = -0.2 + Math.sin(a) * Math.cos(b) * r * 1.05;
        if (z > 1.2 && y < 3.6) continue; // nicht ins Maul
        const m = add(new THREE.Mesh(new THREE.SphereGeometry(k % 3 ? rr(0.1, 0.2) : rr(0.3, 0.5), 6, 4), k % 3 ? skin2 : spotM), x, y, z);
        if (!(k % 3)) m.scale.y *= 0.35;
      }
      // offenes Maul: dunkler Rachen, weit vorgeschobener Unterkiefer
      const throat = add(new THREE.Mesh(new THREE.SphereGeometry(1.9, 16, 12), dark), 0, 2.55, 1.15);
      throat.scale.set(S * 1.05, S * 0.8, S * 0.8);
      add(new THREE.Mesh(new THREE.SphereGeometry(1.15, 12, 8), E('#3a8a7a', 0.3)), 0, 2.5, 1.0);
      const jaw = add(new THREE.Mesh(new THREE.SphereGeometry(2.5, 18, 10, 0, TAU, Math.PI / 2, Math.PI / 2), skin), 0, 2.15, 0.9);
      jaw.scale.set(S * 1.08, S * 0.85, S * 1.45);
      // Fangzähne: unregelmäßig lang, nach innen gebogen; einige untere stehen außen über der Oberlippe
      for (let i = 0; i < 17; i++) {
        const t = -1.25 + (i / 16) * 2.5, len = rr(0.5, 1.35) * (Math.abs(t) < 0.6 ? 1.15 : 0.85);
        const up = add(new THREE.Mesh(new THREE.ConeGeometry(0.08 + len * 0.05, len, 5), toothM), Math.sin(t) * 1.95, 3.0, 1.35 + Math.cos(t) * 1.6);
        up.rotation.set(Math.PI - 0.5, 0, Math.sin(t) * 0.25);
        const lenL = rr(0.7, 1.7) * (Math.abs(t) < 0.7 ? 1.1 : 0.85);
        const lo = add(new THREE.Mesh(new THREE.ConeGeometry(0.1 + lenL * 0.05, lenL, 5), toothM), Math.sin(t) * 2.2, 2.0 + lenL * 0.4, 2.1 + Math.cos(t) * 1.75);
        lo.rotation.set(-0.45 + (i % 4 === 0 ? 0.7 : 0), 0, -Math.sin(t) * 0.2);
      }
      // winzige, glühende Augen oben am Kopf
      for (const sx of [-1, 1]) {
        add(new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 8), M('#0e0c12')), sx * 1.15, 4.45, 1.35);
        add(new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), eyeM), sx * 1.2, 4.5, 1.55);
        // kleine Brustflosse mit Strahlen
        const fin = new THREE.Group();
        fin.add(new THREE.Mesh(new THREE.CircleGeometry(0.9, 10, 0, Math.PI), M('#2e2a36', { side: THREE.DoubleSide, transparent: true, opacity: 0.92 })));
        for (let k = 0; k < 5; k++) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.9, 0.03), M('#4a4454')); r.position.set(Math.cos((k / 4) * Math.PI) * 0.45, Math.sin((k / 4) * Math.PI) * 0.45, 0); r.rotation.z = (k / 4) * Math.PI - Math.PI / 2; fin.add(r); }
        const f = add(fin, sx * 2.55, 2.2, -0.6);
        f.rotation.set(0, sx * 1.3, sx * 0.5);
      }
      // weiche Rückenflosse und Fächerschwanz mit Strahlen
      const dorsal = add(new THREE.Mesh(new THREE.CircleGeometry(0.8, 10, 0, Math.PI), M('#2e2a36', { side: THREE.DoubleSide })), 0, 4.2, -2.4);
      dorsal.rotation.y = Math.PI / 2;
      const tail = new THREE.Group();
      tail.add(new THREE.Mesh(new THREE.CircleGeometry(1.5, 14, Math.PI * 0.6, Math.PI * 0.8), M('#2e2a36', { side: THREE.DoubleSide, transparent: true, opacity: 0.95 })));
      for (let k = 0; k < 7; k++) { const a = Math.PI * 0.6 + (k / 6) * Math.PI * 0.8, r = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.5, 0.04), M('#4a4454')); r.position.set(Math.cos(a) * 0.75, Math.sin(a) * 0.75, 0); r.rotation.z = a - Math.PI / 2; tail.add(r); }
      const tl = add(tail, 0, 2.8, -4.0);
      tl.rotation.set(0, Math.PI / 2, Math.PI);
      // Leuchtpunkte an den Flanken
      for (const sx of [-1, 1]) for (let k = 0; k < 6; k++) add(new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 4), E('#5affd8', 1.3)), sx * (2.5 - Math.abs(k - 2.5) * 0.08), 2.3 + (k % 2) * 0.35, 0.8 - k * 0.6);
      // Angel aus der Stirn: hoher Bogen nach vorn über das Maul
      const rodPts = [[0, 4.7, 1.0], [0, 6.4, 1.2], [0, 7.4, 2.6], [0, 7.0, 4.2], [0, 5.9, 5.0]].map(([x, y, z]) => new THREE.Vector3(x * S, y * S, z * S));
      const rodCurve = new THREE.CatmullRomCurve3(rodPts);
      const rod = new THREE.Mesh(new THREE.TubeGeometry(rodCurve, 20, 0.08 * S, 6), skin2);
      parts.push(rod);
      const tip = rodPts[rodPts.length - 1];
      const lure = new THREE.Group();
      lure.position.copy(tip);
      const escaM = E('#7affe8', 2.6), bulb = new THREE.Mesh(new THREE.SphereGeometry(0.42 * S, 16, 12), M('#2a6a64', { emissive: '#3affd8', emissiveIntensity: 0.9 }));
      bulb.position.y = -0.35 * S;
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.24 * S, 12, 8), escaM);
      core.position.y = -0.4 * S;
      const halo = new THREE.Mesh(new THREE.SphereGeometry(0.9 * S, 14, 10), E('#5affd8', 0.6, { transparent: true, opacity: 0.18 }));
      halo.position.y = -0.4 * S;
      lure.add(bulb, core, halo);
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * TAU, f = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.01, 0.9 * S, 4), E('#9ff3f0', 1.3));
        f.position.set(Math.cos(a) * 0.22 * S, -0.95 * S, Math.sin(a) * 0.22 * S);
        f.rotation.set(Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35);
        lure.add(f);
        const d = new THREE.Mesh(new THREE.SphereGeometry(0.05 * S, 6, 4), escaM);
        d.position.set(Math.cos(a) * 0.38 * S, -1.38 * S, Math.sin(a) * 0.38 * S);
        lure.add(d);
      }
      const light = new THREE.PointLight('#5affd8', 18, 9 * S, 2);
      light.position.y = -0.4 * S;
      lure.add(light);
      parts.push(lure);
      // Lichtschein des Köders auf dem Boden vor dem Maul
      const glowDisc = new THREE.Mesh(new THREE.CylinderGeometry(1.8 * S, 1.8 * S, 0.02, 24), E('#5affd8', 0.35, { transparent: true, opacity: 0.35 }));
      glowDisc.position.set(0, 0.03, 5.0 * S);
      parts.push(glowDisc);
      const fish = group(...parts);
      put(fish, p[0], p[1], { rot: false });
      fish.lookAt(0, fish.position.y, 0);
      const y0 = fish.position.y;
      anims.push((t) => {
        lure.rotation.x = Math.sin(t * 0.9) * 0.18;
        lure.rotation.z = Math.sin(t * 0.6) * 0.12;
        core.material.emissiveIntensity = 2.2 + Math.sin(t * 2.4) * 1.0;
        halo.material.opacity = 0.14 + Math.sin(t * 2.4) * 0.06;
        fish.position.y = y0 + Math.sin(t * 0.5) * 0.15;
      });
    }
    // Schlote (Black Smoker) mit glühender Spitze
    ctx.shared.vents = [];
    for (let i = 0; i < 4; i++) {
      const v = spot(1.2, 4, R - 2);
      if (!v) continue;
      const h = rr(1.6, 3);
      const parts = [];
      for (let j = 0; j < 4; j++) {
        const r = 0.55 - j * 0.09;
        parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.85, r, h / 4 + 0.05, 8), M(j % 2 ? '#1e242c' : '#2a323c')), (rand() - 0.5) * 0.12, (j + 0.5) * (h / 4), (rand() - 0.5) * 0.12));
      }
      parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.12, 8), E('#ff8a3a', 1.6)), 0, h + 0.04, 0));
      // Röhrenwürmer wie an echten Schloten: weiße Röhren mit roten Kiemenbüscheln, dicht am Fuß
      const tube = M('#ece8dc'), plume = E('#e8302a', 0.5);
      for (let k = 0; k < 14; k++) {
        const a = rand() * TAU, d = rr(0.55, 1.1), th = rr(0.35, 0.8);
        const t = at(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, th, 5), tube), Math.cos(a) * d, th / 2, Math.sin(a) * d);
        t.rotation.set(rr(-0.2, 0.2), 0, rr(-0.2, 0.2));
        parts.push(t, at(new THREE.Mesh(new THREE.SphereGeometry(0.075, 6, 4), plume), Math.cos(a) * d, th + 0.04, Math.sin(a) * d));
      }
      put(group(...parts), v[0], v[1]);
      ctx.shared.vents.push([v[0], ctx.height(v[0], v[1]) + h, v[1]]);
      // Bakterienmatten und Muschelbänke rund um den Schlot (bemalter Boden)
      ctx.paint?.(v[0], v[1], 1.8, '#d8d0a0', 'Sand');
      ctx.paint?.(v[0] + rr(-0.8, 0.8), v[1] + rr(-0.8, 0.8), 1.1, '#e8e4c8', 'SmoothPlastic');
    }
    // Kissenlava: gerundete, dunkle Wülste in Gruppen (erstarrt unter Wasser)
    scatter(8, () => {
      const g = new THREE.Group();
      for (let k = 0; k < 5; k++) {
        const m = at(new THREE.Mesh(new THREE.SphereGeometry(rr(0.25, 0.45), 8, 6), M(rand() < 0.5 ? '#141a22' : '#1e2630')), rr(-0.5, 0.5), 0.12, rr(-0.5, 0.5));
        m.scale.set(1.4, 0.6, 1);
        m.rotation.y = rand() * 3;
        g.add(m);
      }
      return g;
    }, 0.8, 2, R - 2.6);
    // Felsen mit leuchtenden Adern (feste Anzahl, sonst mit der Inselfläche vervielfacht); weniger, dafür
    // mit Leuchtfleck am Fuß (Werkstatt-Wunsch „Deko verbessern“)
    scatter(9, () => {
      const g = kit.rockMesh(rr(0.5, 0.9), '#1a222c', rand);
      for (let k = 0; k < 3; k++) g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.05, rr(0.3, 0.6), 0.05), E('#5affd8', 1.4)), rr(-0.3, 0.3), rr(0.2, 0.5), rr(-0.3, 0.3)));
      g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.0, 0.02, 14), E('#5affd8', 0.3, { transparent: true, opacity: 0.4 })), 0, 0.01, 0));
      return g;
    }, 1, 2, R - 2.6);
    // Leuchtquallen schweben über dem Boden
    for (let i = 0; i < 6; i++) {
      const q = spot(0.6, 2, R - 1.5);
      if (!q) continue;
      const c = ['#5affd8', '#ff7ae0', '#7ad0ff'][i % 3];
      const bell = at(new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 8, 0, TAU, 0, Math.PI / 2), E(c, 1.2, { transparent: true, opacity: 0.75 })), 0, 0, 0);
      const parts = [bell];
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * TAU;
        parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.9, 4), E(c, 0.8, { transparent: true, opacity: 0.6 })), Math.cos(a) * 0.25, -0.45, Math.sin(a) * 0.25));
      }
      const jelly = group(...parts);
      const y0 = rr(1.5, 3.2), ph = rand() * 6;
      put(jelly, q[0], q[1], { sink: -y0 });
      const base = jelly.position.y;
      anims.push((t) => (jelly.position.y = base + Math.sin(t * 0.6 + ph) * 0.35));
    }
    scatterModels(ctx, 4, ['rock_single_A@meer', 'rock_single_B@meer', 'rock_single_C@meer', 'rock_single_D@meer'], 2.6, 4.2, { gap: 0.8 });
    scatterModels(ctx, 2, ['rock_single_C@meer', 'rock_single_D@meer'], 6, 7.5, { rMin: R * 0.6, gap: 0.7 }); // Felsbrocken statt Sechseck-Bergplatten
    const loot = clearing(ctx, 2.2, 4, R - 3);
    if (loot) {
      stand(ctx, model('chest_gold', 0.8), loot[0], loot[1]);
      around(ctx, loot, [['lantern_standing', 0.9], ['barrel', 3]], 1.4, 2.2);
    }
    // versunkene Taucherglocke als Forschungsstation (Werkstatt-Wunsch „alle Gebäude verbessern“): Messingglocke
    // mit Bullaugen, Stützbeine, Lampe und Kabel nach oben
    {
      const q = spot(1.6, 4, R - 3);
      if (q) {
        const brass = M('#b08a40', { metalness: 0.7, roughness: 0.35 }), port = E('#9ff3f0', 1.2);
        const bell = new THREE.Group();
        bell.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.1, 1.6, 16), brass), 0, 1.3, 0));
        bell.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.7, 16, 8, 0, TAU, 0, Math.PI / 2), brass), 0, 2.1, 0));
        for (let k = 0; k < 4; k++) { const a = (k / 4) * TAU; const pw = at(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.06, 14), port), Math.cos(a) * 0.92, 1.35, Math.sin(a) * 0.92); pw.rotation.set(0, -a, Math.PI / 2); bell.add(pw); }
        for (let k = 0; k < 3; k++) { const a = (k / 3) * TAU; bell.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.6, 6), M('#4a4f58')), Math.cos(a) * 0.9, 0.3, Math.sin(a) * 0.9)); }
        bell.add(at(new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.04, 6, 12), brass), 0, 2.85, 0));
        bell.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 4, 4), M('#2a2e36')), 0, 4.9, 0));
        bell.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), E('#ffe2a0', 1.6)), 0.75, 2.0, 0.3));
        put(bell, q[0], q[1]);
      }
    }
  },
  emitters(ctx, add) {
    // weniger Partikel (Werkstatt-Wunsch „verringere die Partikel“)
    for (const v of ctx.shared.vents || []) add('Schlotblasen', v, [0.6, 0.2, 0.6], ['#c8d0d8', '#8a96a4'], 0.24, 3, [1.0, 1.6], [4, 6], { spread: [8, 8], light: 0.2 });
    add('Leuchtplankton', [0, 4, 0], [ctx.R * 2.4, 8, ctx.R * 2.4], ['#5affd8', '#7ad0ff', '#ff7ae0'], 0.09, 4, [0.05, 0.15], [6, 10], { light: 1 });
  },
  sounds: [['Tiefe', 'tiefes Grollen und Knacken in großer Tiefe', 0.45], ['Blubbern', 'blubbernde Schlote', 0.25]],
};

// ── Wolkenburg ──
const WOLKENBURG = {
  build(ctx, kit) {
    const { M, E, at, group } = kit;
    const { rand, rr, R, anims, put, spot, reserve, root, height } = ctx;
    const marble = M('#f4f2fa'), marble2 = M('#e4e0f0'), gm = gold(M), roof = M('#8a9ae8');
    // Burg aus weißem Marmor: Bergfried, vier Ecktürme, Mauern mit Zinnen, Tor
    const parts = [];
    const keep = at(new THREE.Mesh(new THREE.BoxGeometry(3, 5, 3), marble), 0, 2.5, 0);
    parts.push(keep, at(new THREE.Mesh(new THREE.ConeGeometry(2.4, 2.6, 4), roof), 0, 6.3, 0));
    parts[1].rotation.y = Math.PI / 4;
    parts.push(at(new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), gm), 0, 7.8, 0));
    for (const [x, z] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) {
      parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 4.2, 12), marble2), x, 2.1, z));
      parts.push(at(new THREE.Mesh(new THREE.ConeGeometry(1.1, 1.8, 12), roof), x, 5.1, z));
      parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1, 4), gm), x, 6.4, z));
      const flag = at(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.35, 0.03), M('#ffd76a')), x + 0.32, 6.7, z);
      parts.push(flag);
      anims.push((t) => (flag.rotation.y = Math.sin(t * 2 + x) * 0.3));
    }
    for (const [x, z, w, d] of [[0, -3, 6, 0.5], [0, 3, 6, 0.5], [-3, 0, 0.5, 6], [3, 0, 0.5, 6]]) {
      const isGate = z === 3;
      if (isGate) {
        for (const s of [-1, 1]) parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.2, d), marble), s * 1.9, 1.1, z));
        parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, d), marble), 0, 1.9, z));
      } else parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(w, 2.2, d), marble), x, 1.1, z));
      const n = 8;
      for (let i = 0; i < n; i++) {
        const u = (i + 0.5) / n - 0.5;
        if (isGate && Math.abs(u) < 0.15) continue;
        parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(w > 1 ? 0.4 : 0.6, 0.4, d > 1 ? 0.4 : 0.6), marble2), x + (w > 1 ? u * w : 0), 2.4, z + (d > 1 ? u * d : 0)));
      }
    }
    // Fenster leuchten golden, auf allen Seiten und zwei Etagen; goldene Bänder, Banner, Fallgitter im Tor
    for (const [nx, nz] of [[0, 1], [0, -1], [1, 0], [-1, 0]])
      for (const y of [2.0, 3.6])
        for (const s of [-1, 1]) parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(nz ? 0.45 : 0.05, 0.75, nx ? 0.45 : 0.05), E('#ffd76a', 1)), nx * 1.53 + (nz ? s * 0.7 : 0), y, nz * 1.53 + (nx ? s * 0.7 : 0)));
    for (const y of [1.0, 4.95]) parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(3.08, 0.12, 3.08), gm), 0, y, 0));
    // Burg (Werkstatt-Wunsch „Burg verbessern“): Zinnenkranz und Balkon am Bergfried, Zinnenringe an den Türmen,
    // Wehrgang auf den Mauern, goldene Uhr über dem Tor
    for (let k = 0; k < 12; k++) {
      const u = (k % 3) / 3 - 0.33, side = Math.floor(k / 3), nx = [0, 1, 0, -1][side], nz = [1, 0, -1, 0][side];
      parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), marble2), nx * 1.45 + (nz ? u * 2.6 : 0), 5.2, nz * 1.45 + (nx ? u * 2.6 : 0)));
    }
    parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.6), marble2), 0, 3.0, 1.8));
    for (let k = -3; k <= 3; k++) parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 5), gm), k * 0.24, 3.25, 2.08));
    for (const [x, z] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) for (let k = 0; k < 8; k++) { const b = (k / 8) * TAU; parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.32, 0.22), marble), x + Math.cos(b) * 0.92, 4.35, z + Math.sin(b) * 0.92)); }
    for (const [x, z, w, d] of [[0, -3, 5.4, 0.3], [-3, 0, 0.3, 5.4], [3, 0, 0.3, 5.4]]) parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, d), M('#c8b8a0')), x, 2.24, z));
    parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.08, 20), gm), 0, 2.85, 3.3));
    parts[parts.length - 1].rotation.x = Math.PI / 2;
    parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.09, 20), M('#fff8e8')), 0, 2.85, 3.31));
    parts[parts.length - 1].rotation.x = Math.PI / 2;
    for (const [nx, nz] of [[1, 0], [-1, 0]]) parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.2, 0.7), M('#5a7aff')), nx * 1.55, 3.0, nz));
    for (let k = -2; k <= 2; k++) parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.5, 0.06), gm), k * 0.28, 0.85, 3.05));
    for (const y of [0.4, 0.9, 1.4]) parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.06, 0.06), gm), 0, y, 3.05));
    for (const [x, z] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) for (const y of [1.5, 3.0]) parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.12), E('#ffd76a', 0.9)), x + Math.sign(x) * 0.0, y, z + Math.sign(z) * 0.9));
    const castle = group(...parts);
    reserve(0, 0, 4.6);
    put(castle, 0, 0, { rot: false });
    castle.rotation.y = rand() * TAU;
    // Burgplatz wie in einer Altstadt: gepflasterter Platz um die Burg, Pflasterwege nach außen, Beete mit
    // Hecken und Blumen am Platzrand, Fahnenmasten; Wolkenbäusche nur noch am Inselrand
    ctx.paint(0, 0, 6.6, '#e8dcc4', 'Cobblestone');
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * TAU + 0.4;
      for (let r = 6; r < R - 1.5; r += 1) ctx.paint(Math.cos(a) * r, Math.sin(a) * r, 0.9, '#dccfb4', 'Cobblestone');
    }
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU + 0.15, x = Math.cos(a) * 7.2, z = Math.sin(a) * 7.2;
      if (!ctx.free(x, z, 0.6)) continue;
      reserve(x, z, 0.7);
      const bed = new THREE.Group();
      bed.add(at(new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.22, 0.7), marble), 0, 0.11, 0));
      const hedge = kit.bush(0.32, '#4f9a3f', rand);
      hedge.position.set(-0.35, 0.2, 0);
      bed.add(hedge, at(kit.flowerPatch(['#ff7a9a', '#ffe25f', '#b07bff', '#ffffff'], rand, 4), 0.35, 0.2, 0));
      put(bed, x, z, { rot: false });
      bed.rotation.y = -a + Math.PI / 2;
    }
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU, x = Math.cos(a) * 5.4, z = Math.sin(a) * 5.4;
      if (!ctx.free(x, z, 0.3)) continue;
      const pole = new THREE.Group();
      pole.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 3.2, 6), gm), 0, 1.6, 0));
      pole.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.55, 0.03), M(['#5a7aff', '#ffd76a', '#ff7a9a'][i % 3], { side: THREE.DoubleSide })), 0.47, 2.85, 0));
      put(pole, x, z, { rot: false });
      pole.rotation.y = -a;
    }
    ctx.scatter(24, () => cloudPuff(kit, rand, rr(0.6, 1.2)), 0.9, R - 3, R - 1);
    // Wolkenkranz um den Burgsockel: die Burg steht wie auf einer Wolke
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU + rand() * 0.2, r = 4.6 + rand() * 0.4, x = Math.cos(a) * r, z = Math.sin(a) * r;
      const c = cloudPuff(kit, rand, rr(0.7, 1.0));
      c.position.set(x, height(x, z) - 0.2, z);
      c.rotation.y = -a;
      root.add(c);
    }
    // goldene Brücken zu kleinen Wolkeninseln außerhalb der Insel
    for (let i = 0; i < 2; i++) {
      const a = rand() * TAU * 0.4 + i * Math.PI;
      const r0 = R - 1.4, r1 = R + 5.5;
      const len = r1 - r0;
      const bridge = new THREE.Group();
      // Brücke (Werkstatt-Wunsch „Brücken verbessern“): Bohlen im Bogen abwechselnd Marmor und Gold, Geländer mit
      // Pfosten, die dem Bogen folgen, Laternen am Anfang, in der Mitte und am Ende, Wolken unter den Enden
      const nP = Math.round(len / 0.5), arc = (k) => Math.sin((k / nP) * Math.PI) * 0.8;
      for (let k = 0; k < nP; k++) {
        bridge.add(at(new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.1, 0.44), k % 2 ? gm : marble), 0, arc(k), k * 0.5));
        for (const sd of [-1, 1]) {
          bridge.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 5), gm), sd * 0.6, arc(k) + 0.3, k * 0.5));
          if (k < nP - 1) {
            const rl = at(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.52), gm), sd * 0.6, (arc(k) + arc(k + 1)) / 2 + 0.6, k * 0.5 + 0.25);
            rl.rotation.x = -Math.atan2(arc(k + 1) - arc(k), 0.5);
            bridge.add(rl);
          }
        }
        if (k === 0 || k === nP - 1 || k === Math.floor(nP / 2))
          for (const sd of [-1, 1]) {
            bridge.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.3, 6), gm), sd * 0.66, arc(k) + 0.65, k * 0.5));
            bridge.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.18), E('#fff3c4', 1.5)), sd * 0.66, arc(k) + 1.38, k * 0.5));
          }
      }
      for (const kz of [0.3, len - 0.3]) { const c = cloudPuff(kit, rand, 0.7); c.position.set(0, -0.7, kz); bridge.add(c); }
      const x0 = Math.cos(a) * r0, z0 = Math.sin(a) * r0;
      bridge.position.set(x0, height(x0, z0) + 0.1, z0);
      bridge.rotation.y = Math.atan2(Math.cos(a), Math.sin(a));
      root.add(bridge);
      reserve(x0, z0, 1);
      // Wolkeninsel mit Pavillon
      const isle = new THREE.Group();
      isle.add(cloudPuff(kit, rand, 2.4));
      isle.add(at(new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.15, 14), marble), 0, 1.1, 0));
      for (let k = 0; k < 4; k++) {
        const b = (k / 4) * TAU + 0.4;
        isle.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.4, 6), marble2), Math.cos(b) * 0.9, 1.85, Math.sin(b) * 0.9));
      }
      isle.add(at(new THREE.Mesh(new THREE.ConeGeometry(1.3, 0.8, 14), gm), 0, 2.9, 0));
      const x1 = Math.cos(a) * (r1 + 1.6), z1 = Math.sin(a) * (r1 + 1.6);
      isle.position.set(x1, 0, z1);
      root.add(isle);
      const ph = rand() * 6;
      anims.push((t) => (isle.position.y = Math.sin(t * 0.5 + ph) * 0.15));
    }
    scatterModels(ctx, 6, ['tree_single_A', 'tree_single_B'], 2.2, 2.6, { rMin: 6, rMax: R - 1.4, gap: 0.7 });
    scatterModels(ctx, 6, ['post_lantern'], 0.8, 0.8, { rMin: 5, rMax: 10, gap: 1 });
    scatterModels(ctx, 3, ['building_well_blue'], 1.6, 1.6, { rMin: 6, rMax: R - 3, gap: 0.9 });
  },
  emitters(ctx, add) {
    add('Wolkenglitzern', [0, 3, 0], [ctx.R * 2.2, 6, ctx.R * 2.2], ['#ffffff', '#fff3c4'], 0.14, 12, [0.1, 0.3], [5, 8], { light: 1 });
  },
  sounds: [['Wind', 'sanfter Höhenwind', 0.35], ['Glocken', 'ferne Burgglocken', 0.2]],
};

// ── Engelsgarten ──
const ENGELSGARTEN = {
  build(ctx, kit) {
    const { M, E, at, group } = kit;
    const { rand, rr, R, anims, put, spot, root, height } = ctx;
    const marble = M('#f8f6f0'), gm = gold(M);
    // Lichtbaum: riesiger weißer Stamm, goldene Krone, leuchtet
    const p = spot(3, 0, 5) ?? [0, 0];
    {
      const h = 9;
      const tree = goldTree(kit, rand, h);
      const halo = at(new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.08, 6, 40), E('#fff2a0', 1.8)), 0, h * 0.85, 0);
      halo.rotation.x = Math.PI / 2;
      tree.add(halo);
      put(tree, p[0], p[1]);
      anims.push((t) => (halo.rotation.z = t * 0.2));
    }
    // Springbrunnen aus Licht
    const f = spot(1.6, 5, 10);
    if (f) {
      const parts = [
        at(new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.5, 0.4, 20), marble), 0, 0.2, 0),
        at(new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 0.05, 20), E('#bff8ff', 0.9, { transparent: true, opacity: 0.8 })), 0, 0.4, 0),
        at(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 1.2, 10), marble), 0, 0.9, 0),
      ];
      const jet = at(new THREE.Mesh(new THREE.ConeGeometry(0.45, 2.4, 12, 1, true), E('#fff8e0', 1.6, { transparent: true, opacity: 0.55 })), 0, 2.6, 0);
      jet.rotation.x = Math.PI;
      parts.push(jet);
      put(group(...parts), f[0], f[1]);
      anims.push((t) => {
        jet.scale.set(1, 0.85 + Math.sin(t * 1.5) * 0.15, 1);
        jet.material.opacity = 0.45 + Math.sin(t * 2) * 0.15;
      });
    }
    // mehr Details (Werkstatt-Wunsch „vieles detaillierter“): Engelsstatuen um den Lichtbrunnen, Rosenbögen,
    // ein Pavillon mit goldener Kuppel und Bänken, Laternen
    const angel = () => {
      const g = new THREE.Group();
      g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 0.4, 10), marble), 0, 0.2, 0));
      g.add(at(new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.9, 10), marble), 0, 0.85, 0));
      g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), marble), 0, 1.4, 0));
      for (const sx of [-1, 1]) { const w = at(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.05), marble), sx * 0.28, 1.05, -0.12); w.rotation.set(0.2, sx * 0.5, sx * 0.3); g.add(w); }
      const h = at(new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.025, 6, 16), E('#fff2a0', 1.6)), 0, 1.65, 0);
      h.rotation.x = Math.PI / 2;
      g.add(h);
      return g;
    };
    if (f) for (let i = 0; i < 4; i++) {
      const a = (i / 4) * TAU + 0.4, x = f[0] + Math.cos(a) * 2.6, z = f[1] + Math.sin(a) * 2.6;
      if (!ctx.free(x, z, 0.3)) continue;
      const an = angel();
      put(an, x, z, { rot: false });
      an.lookAt(f[0], an.position.y, f[1]);
      ctx.reserve(x, z, 0.5);
    }
    for (let i = 0; i < 3; i++) {
      const q = spot(1.0, 5, R - 3);
      if (!q) continue;
      const arch = new THREE.Group();
      for (const sx of [-0.7, 0.7]) arch.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.8, 0.1), M('#f2ead8')), sx, 0.9, 0));
      arch.add(at(new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.06, 6, 16, Math.PI), M('#f2ead8')), 0, 1.8, 0));
      for (let k = 0; k < 9; k++) { const b = (k / 8) * Math.PI; arch.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 4), M(k % 2 ? '#ff7a9a' : '#4f9a3f')), Math.cos(b) * 0.72, 1.8 + Math.sin(b) * 0.72, 0)); }
      for (const sx of [-0.7, 0.7]) for (let k = 0; k < 4; k++) arch.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 4), M(k % 2 ? '#ffd6e0' : '#5aa84a')), sx, 0.4 + k * 0.4, 0.05));
      put(arch, q[0], q[1]);
    }
    {
      const q = spot(2.0, 4, R - 3);
      if (q) {
        const pav = new THREE.Group();
        pav.add(at(new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.8, 0.25, 16), marble), 0, 0.12, 0));
        for (let k = 0; k < 8; k++) pav.add(at(kit.column(2.0, '#f8f6f0', false), Math.cos((k / 8) * TAU) * 1.45, 0.25, Math.sin((k / 8) * TAU) * 1.45));
        pav.add(at(new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 0.2, 16), marble), 0, 2.35, 0));
        pav.add(at(new THREE.Mesh(new THREE.SphereGeometry(1.5, 16, 10, 0, TAU, 0, Math.PI / 2), gm), 0, 2.45, 0));
        pav.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), E('#fff2a0', 1.6)), 0, 4.05, 0));
        for (let k = 0; k < 3; k++) { const sb = at(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.1, 0.35), M('#c8a878')), Math.cos((k / 3) * TAU) * 0.9, 0.55, Math.sin((k / 3) * TAU) * 0.9); sb.rotation.y = -(k / 3) * TAU; pav.add(sb); }
        put(pav, q[0], q[1], { rot: false });
        ctx.reserve(q[0], q[1], 2.0);
      }
    }
    // Treppen, die ins Nichts führen: am Rand nach außen und oben
    for (let i = 0; i < 2; i++) {
      const a = rand() * TAU;
      const stairs = new THREE.Group();
      for (let k = 0; k < 12; k++) {
        const step = at(new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.18, 0.5), marble), 0, 0.1 + k * 0.32, k * 0.48);
        stairs.add(step);
        if (k > 6) {
          const ph = k;
          anims.push((t) => (step.position.y = 0.1 + ph * 0.32 + Math.sin(t * 0.7 + ph) * 0.05));
        }
      }
      stairs.add(at(new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.05, 6, 24), E('#fff2a0', 1.6)), 0, 4.6, 5.8));
      // goldenes Geländer mit Laternen an den Treppen
      for (const sx of [-0.62, 0.62]) for (let k = 0; k < 12; k += 2) {
        stairs.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 5), gm), sx, 0.45 + k * 0.32, k * 0.48));
        if (k % 4 === 0) stairs.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 4), E('#fff2a0', 1.5)), sx, 0.85 + k * 0.32, k * 0.48));
      }
      const r0 = R - 3;
      const x0 = Math.cos(a) * r0, z0 = Math.sin(a) * r0;
      stairs.position.set(x0, height(x0, z0), z0);
      stairs.rotation.y = Math.atan2(Math.cos(a), Math.sin(a));
      root.add(stairs);
      ctx.reserve(x0, z0, 1.4);
    }
    // Lichtbrunnen in einem Rondell wie in einem englischen Garten: Kiesplatz, Beeteinfassung aus Steinen
    if (f) {
      ctx.paint(f[0], f[1], 3.4, '#ece4d4', 'Pebble');
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * TAU, x = f[0] + Math.cos(a) * 2.1, z = f[1] + Math.sin(a) * 2.1;
        const st = at(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.3), M(['#d8d0c0', '#c8c0b0', '#e2dacc'][i % 3])), 0, 0.05, 0);
        put(group(st), x, z, { rot: false });
        st.parent.rotation.y = -a;
      }
    }
    // Wege aus hellem Kies, gesäumt von weißen Hecken und Lavendel-, Rosen- und Lilienbeeten
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * TAU + rand();
      for (let r = 3; r < R - 2; r += 1.1) ctx.paint(Math.cos(a) * r, Math.sin(a) * r, 0.8, '#efe8da', 'Pebble');
    }
    ctx.scatter(6, () => goldTree(kit, rand, rr(2.2, 3.2)), 1.2, 4, R - 2.6);
    // Deko natürlicher (Werkstatt-Wunsch „Deko verbessern“): weniger einzelne Hecken, dafür Blumenbeete mit
    // Steinkante, Lavendel in Gruppen, zwei Vogelbäder aus Marmor mit Gold und weißen Tauben
    ctx.scatter(8, () => {
      const g = new THREE.Group();
      for (let i = 0; i < 3; i++) {
        const b = kit.bush(rr(0.28, 0.42), ['#6aa85a', '#5a984a'][i % 2], rand); // grüne Hecken heben sich vom hellen Boden ab
        b.position.set(i * 0.55 - 0.55, 0, rr(-0.1, 0.1));
        g.add(b);
      }
      return g;
    }, 0.9, 3, R - 2.6);
    ctx.scatter(5, (i) => {
      const g = new THREE.Group();
      for (let k = 0; k < 14; k++) {
        const a = (k / 14) * TAU, st = at(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.1, 0.14), M('#e8e4da')), Math.cos(a) * 0.85, 0.05, Math.sin(a) * 0.85);
        st.rotation.y = -a;
        g.add(st);
      }
      g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.05, 18), M('#6a5040')), 0, 0.03, 0));
      const cols = [['#ffffff', '#ffd76a'], ['#c8a8ff', '#ffffff'], ['#ffc8e0', '#ffffff'], ['#ffd76a', '#c8a8ff']][i % 4];
      for (let k = 0; k < 5; k++) g.add(at(kit.flowerPatch(cols, rand, 5), k ? Math.cos(k * 1.57) * 0.4 : 0, 0.05, k ? Math.sin(k * 1.57) * 0.4 : 0));
      return g;
    }, 1.0, 2, R - 2.6);
    ctx.scatter(2, () => {
      const g = new THREE.Group();
      g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 0.7, 10), marble), 0, 0.35, 0));
      g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.25, 0.18, 16), marble), 0, 0.79, 0));
      g.add(at(new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.03, 4, 20), gm), 0, 0.88, 0)).children.at(-1).rotation.x = Math.PI / 2;
      g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.02, 16), M('#bfe8ff', { roughness: 0.05, transparent: true, opacity: 0.8 })), 0, 0.87, 0));
      for (let k = 0; k < 2; k++) {
        const dove = new THREE.Group(), a = k * Math.PI + 0.4;
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), M('#ffffff'));
        body.scale.set(0.8, 0.8, 1.4);
        const head = at(new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), M('#ffffff')), 0, 0.07, 0.09);
        dove.add(body, head);
        dove.position.set(Math.cos(a) * 0.45, 0.95, Math.sin(a) * 0.45);
        dove.rotation.y = -a;
        g.add(dove);
      }
      return g;
    }, 0.6, 3, R - 2.6);
    // Lavendel: dichte violette Büschel aus schmalen Ähren
    ctx.scatter(5, () => {
      const g = new THREE.Group();
      for (let i = 0; i < 27; i++) {
        const c = (i % 3) * 2.1, cx = Math.cos(c) * 0.32, cz = Math.sin(c) * 0.32;
        const h = rr(0.35, 0.55), a = rand() * TAU, d = rand() * 0.25;
        const stalk = at(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.015, h, 4), M('#6a8a5a')), cx + Math.cos(a) * d, h / 2, cz + Math.sin(a) * d);
        const head = at(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.16, 5), M('#9a7ad8')), cx + Math.cos(a) * d, h + 0.06, cz + Math.sin(a) * d);
        g.add(stalk, head);
      }
      return g;
    }, 0.6, 2, R - 2.6);
    ctx.scatter(3, () => kit.column(rr(1.2, 2), '#f8f6f0', rand() < 0.4), 0.5, 5, R - 2.6);
  },
  emitters(ctx, add) {
    add('Lichtfunken', [0, 2, 0], [ctx.R * 2.2, 4, ctx.R * 2.2], ['#fff2a0', '#ffffff'], 0.16, 14, [0.1, 0.4], [5, 8], { light: 1 });
    add('Goldlaub', [0, 7, 0], [ctx.R * 1.8, 1, ctx.R * 1.8], ['#ffd76a', '#ffe7a8'], 0.18, 6, [0.3, 0.6], [8, 12], { direction: 'Bottom', spread: [30, 30], light: 0.5 });
  },
  sounds: [['Chor', 'leiser, heller Chor', 0.3], ['Brunnen', 'plätschernder Lichtbrunnen', 0.25]],
};

// ── Götterthron ──
const GOETTERTHRON = {
  build(ctx, kit) {
    const { M, E, at, group } = kit;
    const { rand, rr, R, anims, put, reserve } = ctx;
    const stone = M('#e8dcc0'), stone2 = M('#d8c8a0'), gm = gold(M);
    // Gipfel in der Mitte mit Stufen, oben der Thron unter einer Sonnenscheibe
    const parts = [];
    for (let k = 0; k < 4; k++) parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(4.2 - k * 0.9, 4.5 - k * 0.9, 1, 10), k % 2 ? stone2 : stone), 0, 0.5 + k, 0));
    // Treppe nach vorne
    for (let k = 0; k < 8; k++) parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 0.6), stone), 0, 0.25 + k * 0.5, 4.3 - k * 0.42));
    const top = 4;
    // Thron (Werkstatt-Wunsch „Thron verbessern“): Podest mit Stufe, Sitz mit rotem Kissen, hohe Lehne mit
    // gestuftem Giebel und Krone, Armlehnen mit Löwenköpfen, eingesetzte leuchtende Edelsteine, Baldachin auf
    // vier goldenen Säulen
    const red = M('#c0283a'), gemR = E('#ff3a5a', 1.4), gemB = E('#5ac8ff', 1.4);
    parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.3, 2.2), stone2), 0, top + 0.15, 0));
    parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.6, 1.5), gm), 0, top + 0.6, 0));
    parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.2, 1.1), red), 0, top + 1.0, 0.05));
    parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(1.9, 2.8, 0.3), gm), 0, top + 2.1, -0.65));
    parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.2, 0.08), red), 0, top + 2.0, -0.48));
    for (let k = 0; k < 3; k++) parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(1.5 - k * 0.45, 0.3, 0.32), gm), 0, top + 3.65 + k * 0.3, -0.65));
    parts.push(at(new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), gemR), 0, top + 4.55, -0.65));
    for (const [x, y, c] of [[0, 3.2, gemR], [-0.6, 2.6, gemB], [0.6, 2.6, gemB], [0, 1.8, gemB]]) parts.push(at(new THREE.Mesh(new THREE.OctahedronGeometry(0.13, 0), c), x, top + y, -0.47));
    for (const s of [-1, 1]) {
      parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.6, 1.4), gm), s * 1.0, top + 1.2, 0));
      parts.push(at(new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), gm), s * 1.0, top + 1.6, 0.7));
      parts.push(at(new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 4), gemR), s * 1.0 + s * 0.0, top + 1.65, 0.9));
    }
    for (const [x, z] of [[-1.25, 1.0], [1.25, 1.0], [-1.25, -1.0], [1.25, -1.0]]) parts.push(at(kit.column(3.6, '#ffe7a8', false), x, top + 0.3, z));
    parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.2, 2.4), gm), 0, top + 4.0, 0));
    parts.push(at(new THREE.Mesh(new THREE.SphereGeometry(1.25, 18, 10, 0, TAU, 0, Math.PI / 2), M('#fff2d0', { metalness: 0.3 })), 0, top + 4.1, 0));
    const sunDisk = at(new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.1, 28), E('#ffe7a8', 1.5)), 0, top + 6.2, -0.7);
    sunDisk.rotation.x = Math.PI / 2;
    parts.push(sunDisk);
    const rays = new THREE.Group();
    rays.position.set(0, top + 6.2, -0.75);
    for (let k = 0; k < 12; k++) {
      const ray = at(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.9, 0.05), E('#ffcf4a', 1.4)), 0, 1.75, 0);
      const piv = new THREE.Group();
      piv.rotation.z = (k / 12) * TAU;
      piv.add(ray);
      rays.add(piv);
    }
    parts.push(rays);
    // Feuerschalen an den Ecken der obersten Stufe
    for (const [x, z] of [[-1.3, 1.1], [1.3, 1.1]]) {
      parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.2, 0.4, 10), gm), x, top + 0.2, z));
      const flame = at(new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.7, 8), E('#ff9a2a', 2)), x, top + 0.75, z);
      parts.push(flame);
      anims.push((t) => flame.scale.set(1, 0.8 + Math.abs(Math.sin(t * 6 + x)) * 0.4, 1));
    }
    const peak = group(...parts);
    reserve(0, 0, 5);
    put(peak, 0, 0, { rot: false });
    peak.rotation.y = rand() * TAU;
    anims.push((t) => (rays.rotation.z = t * 0.15));
    // Ring aus Säulen (Werkstatt-Wunsch „Säulen drumherum verbessern“): Sockel mit Stufe, hohe Marmorsäulen mit
    // goldenen Kapitellen und Basen, oben je ein leuchtender Edelstein, dazwischen Feuerschalen auf Dreifüßen
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU, r = 7.5;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (!ctx.free(x, z, 0.5)) continue;
      reserve(x, z, 0.6);
      const g = new THREE.Group();
      g.add(at(new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.3, 1.0), stone2), 0, 0.15, 0));
      g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 0.8), gm), 0, 0.4, 0));
      g.add(at(kit.column(3.2, '#f6eedc', false), 0, 0.5, 0));
      g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.22, 0.85), gm), 0, 3.85, 0));
      g.add(at(new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), E(['#ffcf4a', '#ff5a7a', '#5ac8ff'][i % 3], 1.6)), 0, 4.35, 0));
      put(g, x, z, { rot: false });
      if (i % 2) continue;
      const b = (i + 0.5) / 12 * TAU, bx = Math.cos(b) * r, bz = Math.sin(b) * r;
      if (!ctx.free(bx, bz, 0.4)) continue;
      const tri = new THREE.Group();
      for (let k = 0; k < 3; k++) { const leg = at(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 1.1, 5), gm), Math.cos(k * 2.1) * 0.18, 0.55, Math.sin(k * 2.1) * 0.18); leg.rotation.set(Math.sin(k * 2.1) * 0.2, 0, -Math.cos(k * 2.1) * 0.2); tri.add(leg); }
      tri.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.18, 0.22, 10), gm), 0, 1.15, 0));
      const fl = at(new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.55, 8), E('#ff9a2a', 2)), 0, 1.5, 0);
      tri.add(fl);
      anims.push((t) => fl.scale.set(1, 0.8 + Math.abs(Math.sin(t * 6 + i)) * 0.4, 1));
      put(tri, bx, bz, { rot: false });
    }
    // Tempelruine wie am Olympieion: Säulenhof aus hohen Säulen mit Gebälk (Architrav) obendrauf,
    // daneben umgestürzte Säulentrommeln; Boden aus Marmorplatten und hellem Kalkstein
    ctx.paint(0, 0, 6.2, '#efe2c4', 'Marble');
    const tp = ctx.spot(3.2, 9, R - 3);
    if (tp) {
      ctx.reserve(tp[0], tp[1], 3);
      const temple = new THREE.Group(), H = 3.4;
      const cols = [[-1.6, -1], [0, -1], [1.6, -1], [-1.6, 1], [0, 1], [1.6, 1]];
      for (const [x, z] of cols) temple.add(at(kit.column(H, '#efe0c0', false), x, 0, z));
      // Gebälk: über jedem Säulenpaar ein Balken, die äußeren Ecken ohne (Ruine)
      for (const z of [-1, 1])
        for (const x of [-0.8, 0.8]) if (!(z === 1 && x > 0)) temple.add(at(new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.42, 0.62), M('#e6d6b2')), x, H + 0.71, z));
      temple.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.42, 2.6), M('#e6d6b2')), -1.6, H + 0.71, 0));
      temple.add(at(new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.18, 3), M('#e8dcc0')), 0, 0.02, 0));
      put(temple, tp[0], tp[1], { rot: false });
      temple.rotation.y = -Math.atan2(tp[1], tp[0]) + Math.PI / 2;
    }
    ctx.scatter(4, () => {
      const g = new THREE.Group();
      for (let k = 0; k < 3; k++) {
        const d = at(new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.55, 12), M('#e8d8b4')), k * 0.6, 0.27, rr(-0.1, 0.1));
        d.rotation.z = Math.PI / 2;
        d.rotation.y = rr(-0.2, 0.2);
        g.add(d);
      }
      return g;
    }, 1, 6, R - 2.6);
    // weniger Deko (Werkstatt-Wunsch „reduzieren und etwas verbessern“): Wolkenbäusche in fester Anzahl (vorher mit
    // der Inselfläche etwa 56), weniger Säulen, Truhen und Felsen; dafür Lorbeerbüsche mit Goldbeeren in Marmorkübeln
    ctx.scatter(5, () => cloudPuff(kit, rand, rr(0.6, 1)), 0.9, 9, R - 2.6);
    scatterModels(ctx, 2, ['pillar_decorated', 'column'], 0.7, 0.85, { rMin: 9, gap: 0.9 });
    scatterModels(ctx, 1, ['chest_gold'], 0.8, 0.8, { rMin: 9, rMax: R - 2, gap: 1 });
    scatterModels(ctx, 2, ['rock_single_A', 'rock_single_C'], 2.4, 3, { rMin: 10, rMax: R - 1.2, gap: 0.8 });
    ctx.scatter(4, () => {
      const g = new THREE.Group();
      g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.28, 0.45, 12), M('#f4ecdc')), 0, 0.22, 0));
      g.add(at(new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.03, 4, 18), gold(M)), 0, 0.44, 0)).children.at(-1).rotation.x = Math.PI / 2;
      const bush = kit.bush(0.42, '#4f7a3a', rand);
      bush.position.y = 0.42;
      g.add(bush);
      for (let k = 0; k < 6; k++) g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 4), E('#ffcf4a', 0.8)), Math.cos(k) * 0.3, 0.75 + (k % 2) * 0.15, Math.sin(k) * 0.3));
      return g;
    }, 0.6, 6, R - 2.6);
  },
  emitters(ctx, add) {
    add('Goldfunken', [0, 5, 0], [ctx.R * 1.2, 4, ctx.R * 1.2], ['#ffe7a8', '#ffcf4a'], 0.16, 14, [0.4, 1], [3, 5], { direction: 'Top', spread: [30, 30], light: 1 });
  },
  sounds: [['Fanfare', 'ferne, feierliche Fanfaren', 0.3], ['Wind', 'Gipfelwind über den Wolken', 0.35]],
};

export const NEW_WORLDS = { tiefseegraben: TIEFSEEGRABEN, wolkenburg: WOLKENBURG, engelsgarten: ENGELSGARTEN, goetterthron: GOETTERTHRON };
for (const w of Object.values(NEW_WORLDS)) w.landmark = false;

export function planet4Before(ctx, kit) {
  const style = PATHS[ctx.world.id];
  if (style) paths(ctx, kit, style);
}

export function planet4After(ctx) {
  const def = NEW_WORLDS[ctx.world.id];
  if (!def) return;
  const R = ctx.R, list = (ctx.shared.emitters = ctx.shared.emitters || []);
  const add = (name, pos, size, colors, particleSize, rate, speed, lifetime, opts = {}) =>
    list.push({ name, pos, size, colors, particleSize, rate, speed, lifetime, spread: opts.spread ?? [180, 180], direction: opts.direction ?? 'Top', lightEmission: opts.light ?? 0 });
  if (ctx.world.water) add('Luftblasen', [0, 0.2, 0], [R * 2, 1, R * 2], ['#ffffff', '#bff8ff'], 0.22, 8, [1.2, 2.2], [5, 8], { spread: [8, 8], light: 0.3 });
  def.emitters?.(ctx, add);
  ctx.shared.sounds = (def.sounds || []).map(([name, hint, volume]) => ({ name, hint, volume }));
}
