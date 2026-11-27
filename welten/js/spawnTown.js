// Der Spawn als große Münzstadt mit viel Platz für die Spieler.
//
// Aufbau von innen nach außen (Einheiten, 1 Einheit = 8 Studs; Maße für Radius 24, bei größerer Insel rückt alles mit S = R / 24
// nach außen):
//   Marktplatz (bis 8,5)   weite, freie Fläche: Brunnen in der Mitte, vier Spawn-Pads, Bänke am Rand
//   Läden-Ring (um 12)     Läden, Münzindex und Ranglisten mit breiten Gassen dazwischen
//   Ringstraße (14,8–16,4) breiter Rundweg um die Innenstadt
//   Äußerer Ring (um 19)   Portal-Hallen, Obby-Turm, Spielbereiche und ein Pavillon
//   Stadtmauer (23,1)      mit acht Türmen
// Vier Boulevards (3 Einheiten breit) führen vom Platz zu den Portal-Hallen und zum Obby-Turm.
//
// Wird von worldFactory.js aufgerufen; die Bausteine (Materialien, Schilder, Portale …) kommen
// über K herein, damit es keine Kreis-Importe gibt. Alles, was man im Spiel antippen kann, trägt
// userData.area (siehe AREA_ACTIONS in spiel/js/main.js).

import { portalDesign } from './portalDesigns.js';
import * as THREE from 'three';

const TAU = Math.PI * 2;
const deg = (d) => (d * Math.PI) / 180;
const polar = (a, r) => [Math.cos(a) * r, Math.sin(a) * r];

// Maße der Stadt bei Inselradius 24; buildSpawnTown rückt sie mit der Insel nach außen (S = R / 24),
// die Gebäude selbst behalten ihre Größe: eine größere Insel gibt mehr Freiraum dazwischen
const BASE = { PLAZA: 8.5, SHOP_R: 12, RING_IN: 14.8, RING_OUT: 16.4, OUTER_R: 19, HALL_R: 18.6, WALK_PLAZA: 7.1 };
const ROAD_W = 3.0; // Breite der Boulevards

export function buildSpawnTown(ctx, K) {
  const { put, reserve, free, root, anims, rand, rr, scatter, height, shared, scene, lights, R } = ctx;
  const { M, E, at, signBoard, column, lamp, chest, bench, roundTree, bush, flowerPatch, crystal, portalArch, leaderboard, rankRows, coinStatue, indexBook, codesTerminal, eggIcon, potionIcon, canvasTex, dotTex } = K;
  const y0 = height(0, 0);
  const S = R / 24;
  const PLAZA = BASE.PLAZA * S; // Radius des Marktplatzes
  const SHOP_R = BASE.SHOP_R * S; // Mitte der Läden
  const RING_IN = BASE.RING_IN * S, RING_OUT = RING_IN + (BASE.RING_OUT - BASE.RING_IN) * Math.min(S, 1.25), RING_MID = (RING_IN + RING_OUT) / 2; // Ringstraße
  const OUTER_R = BASE.OUTER_R * S; // Spielbereiche im äußeren Ring
  const HALL_R = BASE.HALL_R * S; // Portal-Hallen
  const WALK_PLAZA = BASE.WALK_PLAZA * S; // Rundweg der Spaziergänger am Platzrand
  const WR = R - 0.9; // Stadtmauer
  const areas = (shared.areas = []);
  const lampMats = []; // leuchten nachts heller
  const addArea = (id, name, x, z) => areas.push({ id, name, pos: new THREE.Vector3(x, y0, z) });
  // Objekt bei Winkel/Radius aufstellen, Vorderseite (+z) zur Stadtmitte
  const placeAt = (obj, a, r, d = 1.6, face = true) => {
    const [x, z] = polar(a, r);
    reserve(x, z, d);
    const o = put(obj, x, z, { rot: false });
    if (face) o.lookAt(0, o.position.y, 0);
    return o;
  };

  // ── Pflaster ──
  const cobble = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#b8ad98';
    g.fillRect(0, 0, w, h);
    let s = 3;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let y = 0; y < 8; y++)
      for (let x = 0; x < 8; x++) {
        const off = y % 2 ? 16 : 0;
        const v = 200 + Math.floor(rnd() * 40);
        g.fillStyle = `rgb(${v},${v - 10},${v - 28})`;
        g.beginPath();
        g.roundRect(x * 32 + off - 14 + 2, y * 32 + 2, 28, 28, 7);
        g.fill();
      }
  }, { repeat: [22, 22] });
  const cobbleM = new THREE.MeshStandardMaterial({ map: cobble, color: '#ffffff', roughness: 0.85 });
  const plaza = at(new THREE.Mesh(new THREE.CylinderGeometry(PLAZA, PLAZA, 0.08, 72), cobbleM), 0, y0 + 0.04, 0);
  plaza.userData.rbx = { color: '#d2c8b4' };
  plaza.receiveShadow = true;
  root.add(plaza);
  reserve(0, 0, PLAZA + 0.3); // der Platz bleibt frei: keine Streu-Deko, keine Modelle
  // Schmuckringe im Pflaster: innen um den Brunnen und außen vor den Bänken
  for (const [r0, r1, c] of [[3.1 * S, 3.1 * S + 0.25, '#c8a86a'], [6.3 * S, 6.3 * S + 0.3, '#b89a5e']]) {
    const m = new THREE.Mesh(new THREE.RingGeometry(r0, r1, 96), M(c, { roughness: 0.6 }));
    m.rotation.x = -Math.PI / 2;
    m.position.y = y0 + 0.085;
    m.userData.rbx = { color: c };
    root.add(m);
  }
  const streetM = new THREE.MeshStandardMaterial({ map: cobble, color: '#e8e0d0', roughness: 0.85 });
  // Wege (Werkstatt-Wunsch): Randsteine, Querbänder und Rauten im Pflaster, zu den Portal-Hallen zwei leuchtende
  // Linien in der Farbe des Planeten, am Platzrand ein Wegweiser je Boulevard
  const planetColor = {};
  for (const p of ctx.portals || []) planetColor[p.world.planet] ??= p.color;
  const BLVD = [
    { name: 'Obby-Turm', sub: 'Sprungstrecke', glow: null },
    { name: 'Heimat-Tor', sub: 'Planet 1', glow: planetColor.p1 || '#5fd38d' },
    { name: 'Raketenstart', sub: 'Planet 2', glow: planetColor.p2 || '#8a9cff' },
    { name: 'Tiefsee & Himmel', sub: 'Planet 3 und 4', glow: planetColor.p3 || '#5ad1ff' },
  ];
  function roadDecor(a, r0, len, mid, k) {
    const ca = Math.cos(a), sa = Math.sin(a);
    const at2 = (d, o) => [ca * d - sa * o, sa * d + ca * o];
    const flat = (w, h, dd, mat, d, o, y, rot = 0) => {
      const [x, z] = at2(d, o);
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, dd), mat);
      m.position.set(x, y0 + y, z);
      m.rotation.y = -a + rot;
      root.add(m);
      return m;
    };
    const curb = M('#a89e8c'), band = M('#c8b48a'), inlay = M('#c8a040', { metalness: 0.4, roughness: 0.5 });
    for (const sg of [-1, 1]) flat(len, 0.12, 0.2, curb, mid, sg * (ROAD_W / 2 + 0.08), 0.06);
    for (let d = r0 + 0.9; d < r0 + len - 0.4; d += 1.8) flat(0.22, 0.08, ROAD_W - 0.3, band, d, 0, 0.04);
    for (let d = r0 + 1.8; d < r0 + len - 0.8; d += 3.6) flat(0.55, 0.085, 0.55, inlay, d, 0, 0.045, Math.PI / 4);
    const b = BLVD[k];
    if (b.glow) {
      const g = E(b.glow, 1.2);
      lampMats.push(g);
      for (const sg of [-1, 1]) flat(len - 0.6, 0.09, 0.1, g, mid, sg * 0.75, 0.045);
    }
    // Wegweiser am Platzrand
    const [px, pz] = at2(PLAZA + 0.5, ROAD_W / 2 + 0.75);
    const post = new THREE.Group();
    post.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 2.2, 8), M('#6b4a2e')), 0, 1.1, 0));
    const sign = signBoard(b.name, { w: 1.8, h: 0.5, bg: '#2a2232', fg: b.glow || '#ffe7a8', sub: b.sub });
    sign.position.set(0, 2.0, 0.05);
    post.add(sign);
    const arrow = at(new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.36, 4), M(b.glow || '#ffe7a8')), 1.05, 2.0, 0.05);
    arrow.rotation.z = -Math.PI / 2;
    post.add(arrow);
    post.position.set(px, y0, pz);
    post.rotation.y = Math.atan2(-ca, -sa); // Schild zum Platz
    root.add(post);
    reserve(px, pz, 0.4);
  }

  // vier Boulevards: zu den drei Portal-Hallen und zum Obby-Turm
  const roadEnd = HALL_R - 2.2;
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * TAU, r0 = PLAZA - 0.3, len = roadEnd - r0, mid = r0 + len / 2;
    const road = new THREE.Mesh(new THREE.BoxGeometry(len, 0.07, ROAD_W), streetM);
    road.position.set(Math.cos(a) * mid, y0 + 0.035, Math.sin(a) * mid);
    road.rotation.y = -a;
    road.userData.rbx = { color: '#d8cfbc' };
    root.add(road);
    for (let d = PLAZA; d < roadEnd; d += 0.7) reserve(Math.cos(a) * d, Math.sin(a) * d, ROAD_W / 2 + 0.2);
    roadDecor(a, r0, len, mid, k);
    // Laternen am Rand mit Lichterketten
    let prev = null;
    for (let d = PLAZA + 1.0; d < roadEnd - 0.5; d += 2.6)
      for (const side of [-1, 1]) {
        const off = ROAD_W / 2 + 0.35;
        const x = Math.cos(a) * d - Math.sin(a) * side * off, z = Math.sin(a) * d + Math.cos(a) * side * off;
        const l = put(lamp(), x, z, { rot: false });
        l.traverse((o) => o.isMesh && o.material.emissiveIntensity > 1 && lampMats.push(o.material));
        if (side === 1) {
          if (prev) stringLights(prev, l.position.clone().add(new THREE.Vector3(0, 1.4, 0)));
          prev = l.position.clone().add(new THREE.Vector3(0, 1.4, 0));
        }
      }
  }
  // Ringstraße
  const ring = new THREE.Mesh(new THREE.RingGeometry(RING_IN, RING_OUT, 128), streetM);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = y0 + 0.03;
  ring.userData.rbx = { color: '#d8cfbc' };
  root.add(ring);
  for (let i = 0; i < 180; i++) reserve(...polar((i / 180) * TAU, RING_MID), (RING_OUT - RING_IN) / 2 + 0.15);
  // Randsteine an der Ringstraße und ein Mosaikstern auf dem Platz (Werkstatt-Wunsch: Wege mit Mustern)
  for (const [r0, r1] of [[RING_IN - 0.18, RING_IN], [RING_OUT, RING_OUT + 0.18]]) {
    const c = new THREE.Mesh(new THREE.RingGeometry(r0, r1, 160), M('#a89e8c'));
    c.rotation.x = -Math.PI / 2;
    c.position.y = y0 + 0.07;
    c.userData.rbx = { color: '#a89e8c' };
    root.add(c);
  }
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TAU, long = i % 2 === 0, r0 = 3.4 * (PLAZA / 8.5), r1 = (long ? 5.6 : 4.6) * (PLAZA / 8.5);
    const m = new THREE.Mesh(new THREE.BoxGeometry(r1 - r0, 0.02, long ? 0.34 : 0.22), M(long ? '#c8a040' : '#5aa8b8', { roughness: 0.5 }));
    m.position.set(Math.cos(a) * (r0 + r1) / 2, y0 + 0.09, Math.sin(a) * (r0 + r1) / 2);
    m.rotation.y = -a;
    root.add(m);
  }

  function stringLights(a, b) {
    const n = 9, cols = ['#ffd76a', '#ff8ac8', '#7ad0ff', '#8cff7a'];
    for (let i = 1; i < n; i++) {
      const k = i / n, p = a.clone().lerp(b, k);
      p.y -= Math.sin(k * Math.PI) * 0.35;
      const m = E(cols[i % cols.length], 1.4);
      lampMats.push(m);
      root.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 4), m), p.x, p.y, p.z));
    }
  }

  // ── Springbrunnen mit Münzstatue ──
  {
    const g = new THREE.Group();
    const stone = M('#d8d0c0'), trim = M('#c8a040', { metalness: 0.6, roughness: 0.35 });
    g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.6, 0.55, 40), stone), 0, 0.27, 0));
    g.add(at(new THREE.Mesh(new THREE.TorusGeometry(2.45, 0.12, 8, 48), trim), 0, 0.56, 0)).children.at(-1).rotation.x = Math.PI / 2;
    // Wasser knapp über dem Steinbecken (vorher steckte es im massiven Becken und war in Roblox unsichtbar)
    const waterM = M('#4ab0e8', { roughness: 0.1, emissive: '#2a7ab8', emissiveIntensity: 0.35 });
    const water = at(new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.3, 0.06, 40), waterM), 0, 0.58, 0);
    g.add(water);
    const statue = coinStatue(anims);
    statue.scale.setScalar(0.85);
    statue.position.y = 0.45;
    g.add(statue);
    // obere Schale um die Säule; aus ihr fällt ein Wasservorhang ringsum ins Becken (wie eine Wasserglocke)
    g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(1.35, 0.8, 0.3, 24), stone), 0, 1.7, 0));
    g.add(at(new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.06, 6, 32), trim), 0, 1.86, 0)).children.at(-1).rotation.x = Math.PI / 2;
    g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(1.26, 1.26, 0.05, 32), waterM), 0, 1.84, 0));
    g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(1.38, 1.62, 1.18, 32), M('#aee4ff', { roughness: 0.1, transparent: true, opacity: 0.45, emissive: '#7ad0ff', emissiveIntensity: 0.25 })), 0, 1.15, 0));
    // Fontänen: Tropfen fliegen im Bogen ins Becken
    const drops = [], dropM = M('#bfeaff', { roughness: 0.1, emissive: '#7ad0ff', emissiveIntensity: 0.4, transparent: true, opacity: 0.85 });
    for (let j = 0; j < 8; j++)
      for (let i = 0; i < 6; i++) {
        const d = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 4), dropM);
        d.userData.rbx = { skip: true };
        g.add(d);
        drops.push([d, (j / 8) * TAU, i / 6]);
      }
    anims.push((t) =>
      drops.forEach(([d, a, ph]) => {
        const k = (t * 0.6 + ph) % 1, r = 0.9 + k * 1.2;
        d.position.set(Math.cos(a) * r, 1.4 + Math.sin(k * Math.PI) * 1.3 - k * 0.9, Math.sin(a) * r);
      }),
    );
    // prächtiger (Werkstatt-Wunsch „Platz und Brunnen“): äußeres Becken mit Goldrand, Stufe rundherum, vier
    // Figuren auf dem Rand, die eine Münze hochhalten, acht Wasserstrahlen vom Rand zur Mitte
    g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.75, 0.18, 48), M('#c8bfa8')), 0, 0.09, 0));
    for (const [r0, r1, h, c] of [[3.35, 3.45, 0.42, '#d8d0c0'], [3.45, 3.5, 0.08, '#c8a040']]) {
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(r1, r1, h, 48, 1, true), M(c, c === '#c8a040' ? { metalness: 0.6, side: THREE.DoubleSide } : { side: THREE.DoubleSide }));
      ring.position.y = c === '#c8a040' ? 0.46 : 0.21;
      g.add(ring);
      void r0;
    }
    g.add(at(new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.08, 6, 48), M('#c8a040', { metalness: 0.6 })), 0, 0.44, 0)).children.at(-1).rotation.x = Math.PI / 2;
    g.add(at(new THREE.Mesh(new THREE.RingGeometry(2.62, 3.32, 48), M('#3a8ac8', { roughness: 0.1, emissive: '#1a5a98', emissiveIntensity: 0.3, side: THREE.DoubleSide })), 0, 0.36, 0)).children.at(-1).rotation.x = -Math.PI / 2;
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * TAU + Math.PI / 4, fig = new THREE.Group();
      fig.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.3, 10), M('#d8d0c0')), 0, 0.15, 0));
      fig.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 0.75, 10), M('#e8e0d0')), 0, 0.68, 0));
      fig.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), M('#e8e0d0')), 0, 1.15, 0));
      fig.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 0.06), M('#e8e0d0')), 0.12, 1.3, 0));
      fig.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.03, 16), M('#ffcf4a', { metalness: 0.7, emissive: '#b8860b', emissiveIntensity: 0.4 })), 0.12, 1.55, 0)).children.at(-1).rotation.x = Math.PI / 2;
      fig.position.set(Math.cos(a) * 3.4, 0.42, Math.sin(a) * 3.4);
      fig.lookAt(0, 0.42, 0);
      g.add(fig);
    }
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * TAU + Math.PI / 8;
      g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), M('#c8a040', { metalness: 0.6 })), Math.cos(a) * 3.38, 0.5, Math.sin(a) * 3.38));
    }
    put(g, 0, 0, { rot: false, sink: -0.08 });
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * TAU + Math.PI / 8, x = Math.cos(a) * 3.3, z = Math.sin(a) * 3.3;
      (shared.emitters = shared.emitters || []).push({ name: 'Wasserstrahl', pos: [x, y0 + 0.6, z], size: [0.1, 0.1, 0.1], colors: ['#d8f4ff', '#9fdcff'], particleSize: 0.12, rate: 18, speed: [2.0, 2.3], lifetime: [0.7, 0.8], spread: [6, 6], direction: 'Top', lightEmission: 0.3, acceleration: [-x * 0.9, -6, -z * 0.9] });
    }
    // in Roblox: Fontäne aus Wasserpartikeln (die Tropfen oben gibt es nur auf der Webseite), dazu Gischt im Becken
    const em = (shared.emitters = shared.emitters || []);
    em.push({ name: 'Fontaene', pos: [0, y0 + 2.75, 0], size: [0.6, 0.2, 0.6], colors: ['#d8f4ff', '#9fdcff'], particleSize: 0.22, rate: 60, speed: [2.2, 2.8], lifetime: [0.9, 1.2], spread: [28, 28], direction: 'Top', lightEmission: 0.3, acceleration: [0, -6, 0] });
    em.push({ name: 'Gischt', pos: [0, y0 + 0.7, 0], size: [3.2, 0.1, 3.2], colors: ['#ffffff', '#d8f4ff'], particleSize: 0.3, rate: 14, speed: [0.2, 0.5], lifetime: [0.6, 1], spread: [60, 60], direction: 'Top', lightEmission: 0.2 });
  }
  // ── Vier Spawn-Pads rund um den Brunnen: neue Spieler verteilen sich auf den ganzen Platz ──
  {
    const padM = M('#3a3046'), ringM = E('#ffd76a', 1.3);
    lampMats.push(ringM);
    for (const d of [45, 135, 225, 315]) {
      const [x, z] = polar(deg(d), 4.8 * S);
      const pad = at(new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.14, 32), padM), x, y0 + 0.11, z);
      pad.userData.rbx = { name: 'SpawnLocation', className: 'SpawnLocation' };
      root.add(pad);
      const pr = at(new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.07, 6, 32), ringM), x, y0 + 0.19, z);
      pr.rotation.x = Math.PI / 2;
      root.add(pr);
    }
    // Platz für die Vergleichsfigur neben dem vorderen Pad
    const [fx, fz] = polar(deg(64), 5.0 * S);
    shared.figureSpot = new THREE.Vector3(fx, y0 + 0.08, fz);
    addArea('spawn', 'Marktplatz', 0, 4);
  }
  // Bänke am Platzrand zum Ausruhen und Treffen
  for (let i = 0; i < 8; i++) {
    const g = new THREE.Group();
    for (const x of [-0.55, 0.55]) g.add(at(bench(), x, 0, 0));
    placeAt(g, deg(22.5 + i * 45), 7.75 * S, 0.8);
  }

  // ── Stadtmauer (Werkstatt-Wunsch: echte Burgmauer) ──
  // Mauer aus Steinquadern (drei Töne, Fugen), außen Brustwehr mit Zinnen und Schießscharten, innen ein
  // Wehrgang aus Bohlen; acht hohe Türme mit Zinnenkranz, Spitzdach, Fahne und leuchtenden Fenstern
  {
    const tones = [M('#bdb3a0'), M('#aea490'), M('#c8bfad')], joint = M('#8f8676'), plank = M('#7a5a3a'), slit = M('#2a2420');
    const roofM = M('#b0402e'), warm = E('#ffd98a', 0.9);
    lampMats.push(warm);
    const segs = 96, WH = 2.2, WT = 0.9;
    for (let i = 0; i < segs; i++) {
      const am = ((i + 0.5) / segs) * TAU;
      const len = 2 * WR * Math.sin(Math.PI / segs) + 0.04;
      const [x, z] = polar(am, WR);
      const seg = new THREE.Group();
      seg.add(at(new THREE.Mesh(new THREE.BoxGeometry(len, WH, WT), tones[i % 3]), 0, WH / 2, 0));
      for (const y of [0.55, 1.1, 1.65]) seg.add(at(new THREE.Mesh(new THREE.BoxGeometry(len, 0.04, 0.02), joint), 0, y, WT / 2 + 0.005));
      seg.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.03, WH * 0.9, 0.02), joint), (i % 2 ? 0.25 : -0.25) * len, WH / 2, WT / 2 + 0.005));
      seg.add(at(new THREE.Mesh(new THREE.BoxGeometry(len, 0.4, 0.26), tones[(i + 1) % 3]), 0, WH + 0.2, WT / 2 - 0.13)); // Brustwehr
      seg.add(at(new THREE.Mesh(new THREE.BoxGeometry(len * 0.46, 0.42, 0.28), tones[(i + 2) % 3]), 0, WH + 0.61, WT / 2 - 0.13)); // Zinne
      seg.add(at(new THREE.Mesh(new THREE.BoxGeometry(len, 0.08, WT - 0.3), plank), 0, WH + 0.04, -0.13)); // Wehrgang
      if (i % 2 === 0) seg.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.55, 0.03), slit), 0, 1.3, WT / 2 + 0.01));
      seg.position.set(x, height(x, z), z);
      seg.rotation.y = -am + Math.PI / 2;
      root.add(seg);
    }
    for (let i = 0; i < 8; i++) {
      const a = deg(i * 45), [x, z] = polar(a, WR);
      const t = new THREE.Group();
      const TH = 4.8;
      t.add(at(new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.32, TH, 16), tones[i % 3]), 0, TH / 2, 0));
      for (const y of [0.9, 2.2, 3.5]) t.add(at(new THREE.Mesh(new THREE.CylinderGeometry(1.2 - y * 0.02, 1.2 - y * 0.02, 0.08, 16), joint), 0, y, 0));
      t.add(at(new THREE.Mesh(new THREE.CylinderGeometry(1.42, 1.3, 0.3, 16), tones[(i + 1) % 3]), 0, TH + 0.1, 0));
      for (let k = 0; k < 10; k++) {
        const b = (k / 10) * TAU;
        t.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.42, 0.26), tones[(i + 2) % 3]), Math.cos(b) * 1.3, TH + 0.45, Math.sin(b) * 1.3)).children.at(-1).rotation.y = -b;
      }
      t.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.9, 16), tones[i % 3]), 0, TH + 0.7, 0));
      t.add(at(new THREE.Mesh(new THREE.ConeGeometry(1.25, 2.4, 16), roofM), 0, TH + 2.35, 0));
      t.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), M('#ffd76a', { metalness: 0.7 })), 0, TH + 3.6, 0));
      // leuchtende Fenster auf zwei Etagen (innen und außen), Tür zur Stadt
      for (const [y, side] of [[1.8, 1], [3.2, 1], [1.8, -1], [3.2, -1]]) t.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.48, 0.06), warm), 0, y, side * 1.3));
      t.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.1, 0.06), M('#5a3a22')), 0, 0.55, 1.33));
      t.add(flag(i % 2 ? '#d9b26a' : '#b0402e', TH + 3.6));
      reserve(x, z, 1.5);
      const o = put(t, x, z, { rot: false });
      o.lookAt(0, o.position.y, 0);
    }
  }
  function flag(c, h) {
    const g = new THREE.Group();
    g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 6), M('#6b6478')), 0, h, 0));
    const pivot = new THREE.Group();
    pivot.position.set(0, h + 0.45, 0);
    pivot.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.03), M(c, { side: THREE.DoubleSide })), 0.45, 0, 0));
    g.add(pivot);
    const ph = rand() * 6;
    anims.push((t) => (pivot.rotation.y = Math.sin(t * 2 + ph) * 0.35));
    return g;
  }
  // Dachfläche mit Ziegelreihen (Werkstatt-Wunsch „jedes Gebäude genauer“): die Fläche selbst plus Reihen aus
  // dunkleren Ziegelleisten, parallel zum First, und ein Firstbalken
  function tiledRoof(g, w, d, h, color, { slope = 0.6, rows = 5 } = {}) {
    const dark = M('#' + new THREE.Color(color).offsetHSL(0, 0, -0.08).getHexString()), base = M(color);
    for (const sz of [-1, 1]) {
      const sl = new THREE.Group();
      sl.position.set(0, h + 0.45, sz * d * 0.26);
      sl.rotation.x = sz * slope;
      sl.add(new THREE.Mesh(new THREE.BoxGeometry(w + 0.5, 0.14, d * 0.62), base));
      for (let k = 0; k < rows; k++) sl.add(at(new THREE.Mesh(new THREE.BoxGeometry(w + 0.52, 0.05, 0.06), dark), 0, 0.09, -d * 0.29 + ((k + 0.5) * d * 0.58) / rows));
      g.add(sl);
    }
    g.add(at(new THREE.Mesh(new THREE.BoxGeometry(w + 0.6, 0.12, 0.16), dark), 0, h + 0.78, 0));
  }
  // Fenster mit Rahmen und Fensterbank an den Seitenwänden (x = ±w/2), warm beleuchtet
  function sideWindows(g, w, d, h, { n = 2, y = 0.55 } = {}) {
    const frame = M('#f4ecdc'), glass = E('#ffe2a0', 0.9);
    lampMats.push(glass);
    for (const sx of [-1, 1])
      for (let k = 0; k < n; k++) {
        const z = -d / 2 + ((k + 0.5) * d) / n, x = sx * (w / 2 + 0.06);
        g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.04, h * 0.32, 0.5), glass), x, h * y, z));
        g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.62), frame), x, h * y + h * 0.17, z));
        g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.66), frame), x + sx * 0.02, h * y - h * 0.17, z));
        g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.06, h * 0.32, 0.04), frame), x, h * y, z));
      }
  }
  // Details am Gebäude (Werkstatt-Wunsch „mehr Details überall“): Laternen an der Vorderseite, Blumenkübel,
  // optional ein Steinsockel; w und d in lokalen Einheiten der Gruppe, Vorderseite +z
  function dress(g, w, d, { plinth = false, lanterns = true, planters = true } = {}) {
    if (plinth) g.add(at(new THREE.Mesh(new THREE.BoxGeometry(w + 0.4, 0.16, d + 0.4), M('#b8ae9c')), 0, 0.08, 0));
    if (lanterns)
      for (const sx of [-1, 1]) {
        g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.6, 8), M('#3a3446')), sx * (w / 2 + 0.35), 0.8, d / 2 + 0.35));
        const l = E('#ffd98a', 1.2);
        lampMats.push(l);
        g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.3, 0.22), l), sx * (w / 2 + 0.35), 1.72, d / 2 + 0.35));
        g.add(at(new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.18, 4), M('#3a3446')), sx * (w / 2 + 0.35), 1.96, d / 2 + 0.35)).children.at(-1).rotation.y = Math.PI / 4;
      }
    if (planters)
      for (const sx of [-1, 1]) {
        const px = sx * (w / 2 + 0.35), pz = d / 2 - 0.4;
        g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.36, 0.5), M('#9a6a4a')), px, 0.18, pz));
        const f = flowerPatch(['#ff7a9a', '#ffe25f', '#ffffff', '#b07bff'], rand);
        f.position.set(px, 0.36, pz);
        f.scale.setScalar(0.6);
        g.add(f);
      }
  }
  // ── Große Läden (Läden-Ring) ──
  function shopHouse({ name, sub, wall, roof, accent, items, keeper }) {
    const g = new THREE.Group();
    const W = 3.6, D = 3.0, H = 2.6, wallM = M(wall), roofM = M(roof), trimM = M(accent, { metalness: 0.4, roughness: 0.4 });
    // Rück- und Seitenwände, Boden
    g.add(at(new THREE.Mesh(new THREE.BoxGeometry(W, 0.12, D), M('#a07a50')), 0, 0.06, 0));
    g.add(at(new THREE.Mesh(new THREE.BoxGeometry(W, H, 0.2), wallM), 0, H / 2, -D / 2));
    for (const s of [-1, 1]) g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.2, H, D), wallM), (s * W) / 2, H / 2, 0));
    // Vorderseite: großer Eingangsbogen, Schaufenster links und rechts
    for (const s of [-1, 1]) {
      g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.5, H, 0.2), wallM), s * (W / 2 - 0.25), H / 2, D / 2));
      g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.75, 1.0, 0.06), E('#bff6ff', 0.25, { transparent: true, opacity: 0.45, roughness: 0.05 })), s * 1.0, 1.2, D / 2 + 0.02));
      g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.12, 0.25), trimM), s * 1.0, 0.65, D / 2 + 0.05));
    }
    g.add(at(new THREE.Mesh(new THREE.BoxGeometry(W, 0.6, 0.2), wallM), 0, H - 0.3, D / 2));
    // Satteldach mit Ziegelreihen, Fenster an den Seiten, Eckquader aus Stein
    tiledRoof(g, W, D, H, roof);
    void roofM;
    sideWindows(g, W, D, H);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (let k = 0; k < 4; k++) g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.3, 0.26), M(k % 2 ? '#c8bca4' : '#b0a48c')), sx * (W / 2), 0.2 + k * 0.62, sz * (D / 2)));
    // Giebeldreiecke als Stufen
    for (let i = 0; i < 3; i++) for (const sx of [-1, 1]) g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.28, D * (0.8 - i * 0.26)), wallM), sx * (W / 2), H + 0.14 + i * 0.28, 0));
    g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.0, 0.35), M('#8a5a4a')), W * 0.3, H + 0.8, -0.4));
    // Firstbalken, Fensterrahmen, Blumenkästen unter den Schaufenstern
    g.add(at(new THREE.Mesh(new THREE.BoxGeometry(W + 0.6, 0.14, 0.18), trimM), 0, H + 0.82, 0));
    for (const s of [-1, 1]) {
      for (const [w, h, dx, dy] of [[0.85, 0.06, 0, 0.53], [0.85, 0.06, 0, -0.53], [0.06, 1.1, -0.42, 0], [0.06, 1.1, 0.42, 0]]) g.add(at(new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.05), trimM), s * 1.0 + dx, 1.2 + dy, D / 2 + 0.05));
      for (let k = 0; k < 4; k++) g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 4), M(['#ff7a9a', '#ffe25f', '#ffffff', '#b07bff'][k])), s * 1.0 - 0.3 + k * 0.2, 0.76, D / 2 + 0.08));
    }
    dress(g, W, D, { plinth: true });
    // Leuchtschrift über dem Eingang
    const sign = signBoard(name, { w: 3.0, h: 0.75, bg: accent, fg: '#ffffff', sub });
    sign.material[4].emissiveIntensity = 0.6;
    sign.position.set(0, H + 0.15, D / 2 + 0.16);
    g.add(sign);
    // Innen: Theke, Regale, Verkäufer
    g.add(at(new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.8, 0.5), M('#8a5a3a')), 0, 0.4, -0.3));
    g.add(at(new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.08, 0.6), trimM), 0, 0.82, -0.3));
    for (const y of [0.9, 1.6]) g.add(at(new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.08, 0.4), M('#6b4a2e')), 0, y, -D / 2 + 0.32));
    g.add(at(npc(keeper ?? accent), 0, 0, -0.85));
    if (items) items(g, D);
    return g;
  }

  // Blockfigur (R6-Proportionen, 1 Einheit = 8 Studs)
  function npc(shirt, pants = '#2f3a52', skin = '#f2c8a0') {
    const u = (s) => s / 8, g = new THREE.Group();
    const legs = [-0.5, 0.5].map((x) => {
      const p = new THREE.Group();
      p.position.set(u(x), u(2), 0);
      p.add(at(new THREE.Mesh(new THREE.BoxGeometry(u(1), u(2), u(1)), M(pants)), 0, -u(1), 0));
      g.add(p);
      return p;
    });
    g.add(at(new THREE.Mesh(new THREE.BoxGeometry(u(2), u(2), u(1)), M(shirt)), 0, u(3), 0));
    const arms = [-1.5, 1.5].map((x) => {
      const p = new THREE.Group();
      p.position.set(u(x), u(4), 0);
      p.add(at(new THREE.Mesh(new THREE.BoxGeometry(u(1), u(2), u(1)), M(skin)), 0, -u(1), 0));
      g.add(p);
      return p;
    });
    g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(u(0.62), u(0.62), u(1.2), 14), M(skin)), 0, u(4.6), 0));
    for (const x of [-0.2, 0.2]) g.add(at(new THREE.Mesh(new THREE.BoxGeometry(u(0.12), u(0.22), u(0.04)), M('#141018')), u(x), u(4.72), u(0.62)));
    g.userData.legs = legs;
    g.userData.arms = arms;
    return g;
  }

  const shops = [
    { a: 30, id: 'eier', name: 'Eier-Laden', sub: 'Eier für Haustiere', wall: '#fbf3e4', roof: '#e0a030', accent: '#c8801a',
      items: (g, D) => ['#ffd89a', '#b6ff6a', '#9ff0ff', '#fff4cf', '#b49cff', '#ff4058', '#ffe07a'].forEach((c, i) => {
        const e = eggIcon(c);
        e.scale.setScalar(0.42);
        e.position.set(-1.2 + (i % 4) * 0.8, i < 4 ? 0.95 : 1.65, -D / 2 + 0.32);
        g.add(e);
      }) },
    { a: 60, id: 'boosts', name: 'Boost-Labor', sub: 'Glück, EP, Wetter', wall: '#eef0ff', roof: '#5a3ab0', accent: '#7a5ad8',
      items: (g, D) => ['#b07bff', '#7ad0ff', '#7aff8a', '#ffd76a', '#ff8ac8'].forEach((c, i) => {
        const p = potionIcon(c);
        p.scale.setScalar(0.38);
        p.position.set(-1.2 + i * 0.6, 0.94, -D / 2 + 0.32);
        g.add(p);
      }) },
    { a: 120, id: 'robux', name: 'Robux-Palast', sub: 'Angebote & VIP-Pass', wall: '#f2fff6', roof: '#e8c060', accent: '#2aa860', palace: true },
    { a: 150, id: 'haustiere', name: 'Haustier-Hof', sub: 'Ausrüsten & pflegen', wall: '#fff0f6', roof: '#d84a8a', accent: '#d84a8a' },
    { a: 210, id: 'verkaufen', name: 'Verkaufs-Kontor', sub: 'Münzen gegen Moneten', wall: '#fff4e0', roof: '#8a5a3a', accent: '#c8701a',
      items: (g, D) => [[-1, 0.95], [0, 0.95], [1, 0.95], [-0.5, 1.65], [0.5, 1.65]].forEach(([x, y]) => {
        for (let k = 0; k < 4; k++) g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.05, 16), M('#ffcf4a', { metalness: 0.7, roughness: 0.3 })), x, y + k * 0.055, -D / 2 + 0.32));
      }) },
    // Taschen-Laden (Werkstatt-Wunsch „Taschenshop“): Edelstein-Taschen in wachsender Größe im Regal,
    // eine große Tasche mit Diamant vor der Tür
    { a: 150, id: 'taschen', name: 'Taschen-Laden', sub: 'Edelstein-Taschen', wall: '#eaf4ff', roof: '#2a5ab0', accent: '#3a8ae8',
      items: (g, D) => ['#c98a4b', '#8a9aa8', '#e8c060', '#5ad1ff', '#b07bff'].forEach((c, i) => {
        const b = gemBag(c, 0.18 + i * 0.03);
        b.position.set(-1.25 + i * 0.62, i < 5 ? 0.86 : 1.6, -D / 2 + 0.34);
        g.add(b);
      }) },
  ];
  // Edelstein-Tasche: Beutel mit Zugband und Knoten, vorne ein leuchtender Edelstein
  function gemBag(c, s) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(s, 14, 10), M(c, { roughness: 0.8 }));
    body.scale.set(1, 0.9, 0.85);
    body.position.y = s * 0.9;
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.32, s * 0.5, s * 0.4, 10), M(c, { roughness: 0.8 }));
    neck.position.y = s * 1.75;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.36, s * 0.36, s * 0.1, 10), M('#e8c060', { metalness: 0.6 }));
    band.position.y = s * 1.62;
    const top = new THREE.Mesh(new THREE.ConeGeometry(s * 0.45, s * 0.4, 8), M(c, { roughness: 0.8 }));
    top.position.y = s * 2.1;
    top.rotation.x = Math.PI;
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(s * 0.3, 0), E('#7ae8ff', 0.9));
    gem.position.set(0, s * 0.95, s * 0.82);
    gem.scale.z = 0.5;
    g.add(body, neck, band, top, gem);
    return g;
  }
  // Markthalle (Werkstatt-Wunsch „weniger Gebäude“): Eier-Laden, Boost-Labor, Robux-Palast und Haustier-Hof
  // als vier Theken unter einem Dach; die Bereiche (userData.area) bleiben je Theke erhalten
  const MARKET = new Set(['eier', 'boosts', 'robux', 'haustiere']);
  marketHall(shops.filter((s) => MARKET.has(s.id)));
  for (const s of shops.filter((x) => !MARKET.has(x.id))) {
    const house = shopHouse(s);
    if (s.palace) {
      // Robux-Palast: goldene Kuppel und zwei Türmchen
      const d = K.dome(1.3, '#ffe7a0', '#c8a040');
      d.position.set(0, 3.4, -0.2);
      house.add(d);
      for (const x of [-1.7, 1.7]) {
        house.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 3.6, 10), M('#f2fff6')), x, 1.8, -1.2));
        house.add(at(new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.9, 10), M('#e8c060', { metalness: 0.6 })), x, 4.05, -1.2));
      }
    }
    if (s.id === 'taschen') {
      // große Tasche mit Diamant vor der Tür, zwei Laternen
      const big = gemBag('#3a6ad8', 0.55);
      big.position.set(-1.6, 0, 2.0);
      house.add(big);
      const d = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), E('#9ff0ff', 1.2));
      d.position.set(1.6, 0.95, 2.0);
      d.userData.spin = 0.8;
      house.add(d, at(new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.32, 0.55, 10), M('#e8dfcc')), 1.6, 0.28, 2.0));
    }
    if (s.id === 'haustiere') {
      // Gehege mit Haustieren vor dem Hof
      for (let i = 0; i < 3; i++) {
        const p = pet(['#c98a4b', '#a3a3ad', '#ffd23f'][i]);
        p.position.set(-1 + i, 0, 2.2);
        house.add(p);
      }
    }
    house.scale.setScalar(1.15); // größere Läden: drinnen ist Platz für mehrere Spieler
    placeAt(house, deg(s.a), SHOP_R, 2.7);
    house.userData.area = s.id;
    addArea(s.id, s.name, ...polar(deg(s.a), SHOP_R - 2.6));
  }
  // Event-Podest (Werkstatt-Wunsch „Platz für Event-Shops“): ein leeres rundes Podest mit drei Stufen,
  // Goldkanten, vier Fahnenmasten mit leeren Bannern und einem Schild – hier kommt der Shop des nächsten Events hin
  {
    const g = new THREE.Group();
    const gold = M('#e8c060', { metalness: 0.6, roughness: 0.35 });
    [[2.6, 0.16, '#d8cfbc'], [2.15, 0.32, '#e8dfcc'], [1.7, 0.48, '#f2ece0']].forEach(([r, y, c]) => {
      g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(r, r + 0.05, 0.16, 32), M(c)), 0, y - 0.08, 0));
      g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(r + 0.06, r + 0.06, 0.04, 32), gold), 0, y, 0));
    });
    g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.02, 32), E('#ffe7a8', 0.35)), 0, 0.5, 0));
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4, x = Math.cos(a) * 2.35, z = Math.sin(a) * 2.35;
      g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 2.6, 8), gold), x, 1.4, z));
      g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), gold), x, 2.75, z));
      const banner = at(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.9, 0.5), M(['#d84a8a', '#3a8ae8', '#2aa860', '#e0a030'][i])), x, 2.1, z);
      banner.rotation.y = -a;
      banner.position.x += Math.cos(a + Math.PI / 2) * 0.27;
      banner.position.z += Math.sin(a + Math.PI / 2) * 0.27;
      g.add(banner);
    }
    const sign = signBoard('Event-Shop', { w: 2.2, h: 0.55, bg: '#2a2232', fg: '#ffe7a8', sub: 'Bald hier: das nächste Event' });
    sign.position.set(0, 0.85, 2.75);
    g.add(sign);
    placeAt(g, deg(120), SHOP_R, 2.8);
    g.userData.area = 'event';
    addArea('event', 'Event-Podest', ...polar(deg(120), SHOP_R - 2.8));
  }
  function marketHall(list) {
    const g = new THREE.Group();
    const HW = 10.4, HD = 5.0, HH = 3.4;
    const stone = M('#e8dfcc'), stoneD = M('#c8bca4'), roofM = M('#b0402e'), gold = M('#e8c060', { metalness: 0.6, roughness: 0.35 });
    g.add(at(new THREE.Mesh(new THREE.BoxGeometry(HW, 0.18, HD), M('#cfc4ae')), 0, 0.09, 0));
    g.add(at(new THREE.Mesh(new THREE.BoxGeometry(HW, HH, 0.3), stone), 0, HH / 2, -HD / 2));
    for (const sx of [-1, 1]) g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.3, HH, HD), stone), (sx * HW) / 2, HH / 2, 0));
    // Arkaden vorne: Säulen mit Bögen
    for (let i = 0; i <= 4; i++) {
      const x = -HW / 2 + 0.3 + (i * (HW - 0.6)) / 4;
      g.add(at(column(HH - 0.4, '#efe8db'), x, 0.18, HD / 2 - 0.1));
    }
    g.add(at(new THREE.Mesh(new THREE.BoxGeometry(HW + 0.2, 0.5, 0.35), stoneD), 0, HH - 0.05, HD / 2 - 0.1));
    // Satteldach mit Ziegelreihen, Gesims und Laterne obenauf; Fenster in den Seitenwänden, Stufen vorne,
    // Schachbrettboden aus hellen und dunklen Platten
    const roofG = new THREE.Group();
    roofG.position.y = 0.3;
    tiledRoof(roofG, HW + 0.1, HD, HH, '#b0402e', { slope: 0.55, rows: 6 });
    g.add(roofG);
    void roofM;
    sideWindows(g, HW, HD, HH, { n: 2 });
    for (let k = 0; k < 3; k++) g.add(at(new THREE.Mesh(new THREE.BoxGeometry(HW * 0.6, 0.1, 0.35), M('#d8cfbc')), 0, 0.05 + k * 0.06, HD / 2 + 0.55 - k * 0.15));
    for (let ix = 0; ix < 10; ix++) for (let iz = 0; iz < 4; iz++) if ((ix + iz) % 2) g.add(at(new THREE.Mesh(new THREE.BoxGeometry((HW - 0.6) / 10, 0.02, (HD - 0.6) / 4), M('#9a8a72')), -HW / 2 + 0.3 + ((ix + 0.5) * (HW - 0.6)) / 10, 0.19, -HD / 2 + 0.3 + ((iz + 0.5) * (HD - 0.6)) / 4));
    g.add(at(new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 1.2), stone), 0, HH + 1.75, 0));
    g.add(at(new THREE.Mesh(new THREE.ConeGeometry(0.95, 0.9, 4), roofM), 0, HH + 2.6, 0)).children.at(-1).rotation.y = Math.PI / 4;
    g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), gold), 0, HH + 3.15, 0));
    const big = signBoard('Markthalle', { w: 4.2, h: 0.8, bg: '#7a2a1e', fg: '#ffe7a8', sub: 'Eier · Boosts · Robux · Haustiere' });
    big.position.set(0, HH + 0.55, HD / 2 + 0.12);
    g.add(big);
    // Theken
    const stalls = [];
    list.forEach((sh, i) => {
      const st = new THREE.Group();
      const x = -HW / 2 + 1.3 + (i * (HW - 2.6)) / (list.length - 1 || 1);
      st.position.set(x, 0.18, -0.6);
      const acc = M(sh.accent, { metalness: 0.3, roughness: 0.5 });
      st.add(at(new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.8, 0.6), M('#8a5a3a')), 0, 0.4, 0.5));
      st.add(at(new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.08, 0.7), acc), 0, 0.84, 0.5));
      for (const y of [0.9, 1.6]) st.add(at(new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 0.4), M('#6b4a2e')), 0, y, -0.6));
      // gestreifte Markise in der Ladenfarbe
      for (let k = 0; k < 5; k++) {
        const aw = at(new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.06, 1.0), k % 2 ? acc : M('#ffffff')), -0.88 + k * 0.44, 1.95, 0.75);
        aw.rotation.x = 0.35;
        st.add(aw);
      }
      const sg = signBoard(sh.name, { w: 2.0, h: 0.5, bg: sh.accent, fg: '#ffffff', sub: sh.sub });
      sg.position.set(0, 2.45, 0.3); // unter dem Arkadenbalken, von vorne zu lesen
      st.add(sg);
      st.add(at(npc(sh.keeper ?? sh.accent), 0, 0, -0.15));
      if (sh.items) {
        const it = new THREE.Group();
        sh.items(it, 1.84);
        it.scale.setScalar(0.78);
        it.position.z = -0.25;
        st.add(it);
      }
      if (sh.palace) {
        const d = K.dome(0.75, '#ffe7a0', '#c8a040');
        d.position.set(0, 3.3, -0.3);
        st.add(d);
      }
      if (sh.id === 'haustiere')
        for (let k = 0; k < 3; k++) {
          const pp = pet(['#c98a4b', '#a3a3ad', '#ffd23f'][k]);
          pp.position.set(-0.6 + k * 0.6, 0, 1.4);
          st.add(pp);
        }
      // Warenkisten und Körbe neben der Theke
      for (const sx of [-1, 1]) {
        st.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.4), M('#8a6440')), sx * 1.15, 0.15, 0.9));
        for (let k = 0; k < 3; k++) st.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 4), M([sh.accent, '#ffd76a', '#ffffff'][k])), sx * 1.15 + (k - 1) * 0.12, 0.36, 0.9));
      }
      st.userData.area = sh.id;
      g.add(st);
      stalls.push([st, sh]);
    });
    dress(g, HW, HD, { plinth: true });
    // Laternen zwischen den Arkadensäulen
    for (let i = 0; i < 4; i++) {
      const lx = -HW / 2 + 0.3 + ((i + 0.5) * (HW - 0.6)) / 4, l = E('#ffd98a', 1.2);
      lampMats.push(l);
      g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 5), M('#3a3446')), lx, HH - 0.5, HD / 2 - 0.1));
      g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.26, 0.2), l), lx, HH - 0.82, HD / 2 - 0.1));
    }
    const o = placeAt(g, deg(45), SHOP_R, 5.4);
    o.updateMatrixWorld(true);
    for (const [st, sh] of stalls) {
      const w = st.localToWorld(new THREE.Vector3(0, 0, 2.2));
      addArea(sh.id, sh.name, w.x, w.z);
    }
  }
  // Kleines Block-Haustier, hüpft
  function pet(c) {
    const g = new THREE.Group();
    const b = at(new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.26, 0.42), M(c)), 0, 0.2, 0);
    const h = at(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.28, 0.26), M(c)), 0, 0.42, 0.2);
    for (const x of [-0.09, 0.09]) h.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.07, 0.02), M('#141018')), x, 0.02, 0.135));
    for (const x of [-0.1, 0.1]) h.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.05), M(c)), x, 0.18, -0.03));
    g.add(b, h);
    const ph = rand() * 6;
    anims.push((t) => (g.children.forEach((m) => (m.position.y = (m === h ? 0.42 : 0.2) + Math.abs(Math.sin(t * 4 + ph)) * 0.08))));
    return g;
  }

  // ── Ranglisten, Münzindex ──
  {
    // Ruhmeshalle (Werkstatt-Wunsch „epischer“): Podest mit Stufen, drei Steinstelen mit Goldrahmen, die mittlere
    // höher und mit Krone, leuchtende Plaketten für Platz 1 bis 3, Feuerschalen an den Seiten
    const boards = [['Münzen gesammelt', '#7ad0ff', 'coins'], ['Meiste Moneten', '#ffd76a', 'taler'], ['Wiedergeburten', '#ff8ac8', 'rebirths']];
    const mon = new THREE.Group();
    const stone = M('#d8d0c0'), stoneD = M('#a89e8c'), gold = M('#ffcf4a', { metalness: 0.75, roughness: 0.3, emissive: '#b8860b', emissiveIntensity: 0.25 });
    for (let i = 0; i < 3; i++) mon.add(at(new THREE.Mesh(new THREE.BoxGeometry(12 - i * 1.0, 0.25, 3.4 - i * 0.5), i % 2 ? stoneD : stone), 0, 0.125 + i * 0.25, -i * 0.15));
    boards.forEach(([t, c, k], i) => {
      const x = (i - 1) * 3.75, lift = i === 1 ? 0.7 : 0, base = 0.75;
      const stele = at(new THREE.Mesh(new THREE.BoxGeometry(3.6, 3.9 + lift, 0.45), stoneD), x, base + (3.9 + lift) / 2, -0.75);
      mon.add(stele);
      for (const [w, h, dx, dy] of [[3.75, 0.14, 0, 3.9 + lift], [3.75, 0.14, 0, 0.05], [0.14, 3.9 + lift, -1.84, (3.9 + lift) / 2], [0.14, 3.9 + lift, 1.84, (3.9 + lift) / 2]]) mon.add(at(new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.12), gold), x + dx, base + dy, -0.48));
      const lb = leaderboard(t, c, rankRows(k, rand));
      lb.position.set(x, base + lift - 0.25, -0.35);
      mon.add(lb);
      // Plakette mit der Platzfarbe unter jeder Tafel
      mon.add(at(new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.28, 0.08), E(['#cfd8e8', '#ffd24a', '#e0975a'][i], 0.9)), x, base + 0.2, -0.28));
    });
    // Krone auf der mittleren Stele
    const crown = new THREE.Group();
    crown.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.55, 0.36, 16, 1, true), gold), 0, 0.18, 0));
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * TAU;
      crown.add(at(new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.42, 6), gold), Math.cos(a) * 0.56, 0.55, Math.sin(a) * 0.56));
      crown.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), E(['#ff3a5a', '#3ad8ff', '#7aff5a', '#ffd23f', '#c88aff'][k], 1.2)), Math.cos(a) * 0.6, 0.2, Math.sin(a) * 0.6));
    }
    crown.position.set(0, 0.75 + 4.6 + 0.08, -0.75);
    mon.add(crown);
    anims.push((tt) => (crown.rotation.y = tt * 0.4));
    // Feuerschalen links und rechts
    for (const sx of [-1, 1]) {
      const fx = sx * 5.6;
      mon.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 1.6, 10), stone), fx, 0.75 + 0.8, 0.6));
      mon.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.24, 0.3, 12), gold), fx, 0.75 + 1.75, 0.6));
      const fl = at(new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.7, 8), E('#ffb02e', 1.8)), fx, 0.75 + 2.25, 0.6);
      mon.add(fl);
      anims.push((tt) => fl.scale.set(1, 0.85 + Math.sin(tt * 9 + sx) * 0.15, 1));
    }
    const sgn = signBoard('Ruhmeshalle', { w: 3.2, h: 0.6, bg: '#3a2a12', fg: '#ffd76a', sub: 'Die Besten des Servers' });
    sgn.position.set(0, 0.62, 1.55);
    sgn.rotation.x = -0.25;
    mon.add(sgn);
    const mo = placeAt(mon, deg(315), SHOP_R + 0.4, 5.6);
    mo.userData.area = 'ranglisten';
    addArea('ranglisten', 'Ranglisten', ...polar(deg(315), SHOP_R - 2.4));
    const lib = new THREE.Group();
    // Rotunde um das Index-Buch
    for (let i = 0; i < 8; i++) {
      const [x, z] = polar((i / 8) * TAU, 1.6);
      if (i === 2) continue; // Eingang zur Stadtmitte
      lib.add(at(column(2.2, '#efe8db'), x, 0, z));
    }
    const rd = K.dome(1.9, '#d8c8a0', '#c8a040');
    rd.position.y = 2.4;
    lib.add(rd);
    const book = indexBook();
    lib.add(book);
    lib.add(at(new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.2, 0.16, 24), M('#b8ae9c')), 0, 0.08, 0));
    // Bücherregale zwischen den Säulen, Bodenmosaik, Stufen zum Eingang
    for (let i = 0; i < 8; i++) {
      if (i === 2) continue;
      const a = ((i + 0.5) / 8) * TAU, sh = new THREE.Group();
      sh.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.2, 0.25), M('#6b4a2e')), 0, 0.76, 0));
      for (let r = 0; r < 3; r++) for (let b = 0; b < 5; b++) sh.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.28, 0.2), M(['#c8302a', '#2a6ac8', '#2aa860', '#e0a030', '#7a3ab0'][(b + r) % 5])), -0.32 + b * 0.16, 0.4 + r * 0.38, 0.04));
      sh.position.set(Math.cos(a) * 1.55, 0, Math.sin(a) * 1.55);
      sh.rotation.y = -a - Math.PI / 2;
      lib.add(sh);
    }
    for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU; const m = at(new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.02, 0.1), M(k % 2 ? '#c8a040' : '#5aa8b8')), Math.cos(a) * 0.75, 0.17, Math.sin(a) * 0.75); m.rotation.y = -a; lib.add(m); }
    for (let k = 0; k < 3; k++) lib.add(at(new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.3), M('#c8bca4')), 0, 0.04 + k * 0.05, 2.35 - k * 0.15));
    dress(lib, 3.4, 3.4, { planters: true });
    lib.scale.setScalar(1.15);
    const o = placeAt(lib, deg(240), SHOP_R, 2.4);
    o.userData.area = 'index';
    addArea('index', 'Münzindex', ...polar(deg(240), SHOP_R - 2.4));
  }

  // ── Belohnungs-Haus (Werkstatt-Wunsch „weniger Gebäude“): tägliche Belohnung, Codes, Gruppen-Belohnung und
  // Quest-Brett unter einem Dach; jede Station behält ihren Bereich (userData.area) ──
  {
    const g = new THREE.Group();
    const HW = 8.6, HD = 3.8, HH = 3.0;
    const wall = M('#fff4e0'), trim = M('#e0a030', { metalness: 0.4, roughness: 0.4 }), roofM = M('#3a7be0');
    g.add(at(new THREE.Mesh(new THREE.BoxGeometry(HW, 0.18, HD), M('#d8cfbc')), 0, 0.09, 0));
    g.add(at(new THREE.Mesh(new THREE.BoxGeometry(HW, HH, 0.25), wall), 0, HH / 2, -HD / 2));
    for (const sx of [-1, 1]) g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.25, HH, HD), wall), (sx * HW) / 2, HH / 2, 0));
    for (let i = 0; i <= 4; i++) g.add(at(column(HH - 0.3, '#fff8ea'), -HW / 2 + 0.25 + (i * (HW - 0.5)) / 4, 0.18, HD / 2 - 0.1));
    g.add(at(new THREE.Mesh(new THREE.BoxGeometry(HW + 0.3, 0.32, HD + 0.3), roofM), 0, HH + 0.1, 0));
    g.add(at(new THREE.Mesh(new THREE.BoxGeometry(HW + 0.36, 0.1, HD + 0.36), trim), 0, HH - 0.08, 0));
    // Brüstung mit Goldkugeln auf dem Dach, Wimpelkette vorne, Bodenmuster, Seitenfenster
    for (let k = 0; k <= 8; k++) g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), M('#ffcf4a', { metalness: 0.7 })), -HW / 2 + (k * HW) / 8, HH + 0.38, HD / 2 + 0.1));
    for (let k = 0; k < 14; k++) {
      const x = -HW / 2 + 0.3 + (k * (HW - 0.6)) / 13, sag = Math.sin((k / 13) * Math.PI) * 0.35;
      const fl = at(new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.26, 3), M(['#ff5aa5', '#ffd76a', '#5ad1ff', '#8cff7a'][k % 4])), x, HH - 0.45 - sag, HD / 2 + 0.05);
      fl.rotation.x = Math.PI;
      g.add(fl);
    }
    for (let k = 0; k < 6; k++) g.add(at(new THREE.Mesh(new THREE.BoxGeometry(HW / 6 - 0.05, 0.02, HD - 0.4), M(k % 2 ? '#e8dcc0' : '#d0c4a8')), -HW / 2 + ((k + 0.5) * HW) / 6, 0.19, 0));
    sideWindows(g, HW, HD, HH);
    const big = signBoard('Belohnungen', { w: 3.6, h: 0.75, bg: '#e0a030', fg: '#ffffff', sub: 'Täglich · Codes · Gruppe · Quests' });
    big.position.set(0, HH + 0.75, HD / 2 + 0.05);
    g.add(big);
    for (const sx of [-1, 1]) {
      const gift = new THREE.Group();
      gift.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), M(sx > 0 ? '#ff5aa5' : '#5ad1ff')), 0, 0.25, 0));
      gift.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.1, 0.12), trim), 0, 0.5, 0));
      gift.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.54), trim), 0, 0.5, 0));
      gift.position.set(sx * (HW / 2 - 0.5), HH + 0.26, HD / 2 - 0.3);
      g.add(gift);
    }
    const stations = [];
    const station = (id, name, x, build) => {
      const st = new THREE.Group();
      st.position.set(x, 0.18, -0.4);
      build(st);
      st.userData.area = id;
      g.add(st);
      stations.push([st, id, name]);
    };
    station('belohnung', 'Tägliche Belohnung', -3.15, (st) => {
      st.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.85, 0.3, 8), M('#4a4458')), 0, 0.15, 0));
      const c = chest(anims);
      c.position.y = 0.3;
      c.scale.setScalar(1.15);
      st.add(c);
      const sg = signBoard('Täglich', { w: 1.6, h: 0.45, bg: '#e0a030', fg: '#ffffff', sub: 'Jeden Tag ein Geschenk' });
      sg.position.set(0, 2.15, -0.6);
      st.add(sg);
    });
    station('codes', 'Codes', -1.05, (st) => {
      const t = codesTerminal(anims);
      t.scale.setScalar(0.85);
      st.add(t);
    });
    station('gruppe', 'Gruppen-Belohnung', 1.05, (st) => {
      st.add(at(new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.85, 0.85), M('#3a7be0')), 0, 0.42, 0));
      st.add(at(new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 0.95), M('#ffd76a', { metalness: 0.6 })), 0, 0.9, 0));
      const sg = signBoard('Gruppe', { w: 1.5, h: 0.45, bg: '#3a7be0', fg: '#ffffff', sub: 'Beitreten = Bonus' });
      sg.position.set(0, 2.15, -0.6);
      st.add(sg);
    });
    station('quests', 'Quest-Brett', 3.15, (st) => {
      for (const sx of [-1, 1]) st.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.0, 0.12), M('#6b4a2e')), sx * 0.9, 1.0, -0.3));
      st.add(at(new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.2, 0.1), M('#8a5a3a')), 0, 1.35, -0.3));
      ['#fff6d0', '#d0f0ff', '#ffd0e0', '#e0ffd0'].forEach((c, k) => st.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.45, 0.02), M(c)), -0.6 + k * 0.4, 1.35 + (k % 2 ? 0.18 : -0.12), -0.24)));
      const sg = signBoard('Quests', { w: 1.5, h: 0.45, bg: '#6b4a2e', fg: '#ffe7a8', sub: 'Tagesaufgaben' });
      sg.position.set(0, 2.25, -0.25);
      st.add(sg);
    });
    dress(g, HW, HD, { plinth: true });
    const o = placeAt(g, deg(125), OUTER_R, 4.6);
    o.updateMatrixWorld(true);
    for (const [st, id, name] of stations) {
      const w = st.localToWorld(new THREE.Vector3(0, 0, 2.0));
      addArea(id, name, w.x, w.z);
    }
  }

  // ── Portal-Hallen je Planet (äußerer Ring, am Ende der Boulevards) ──
  const byPlanet = {};
  for (const p of ctx.portals || []) (byPlanet[p.world.planet] ??= []).push(p);
  const hall = (planetId, d, build) => {
    const a = deg(d), [cx, cz] = polar(a, HALL_R - 0.6); // etwas nach innen: die Portale stehen fast rundum
    const g = new THREE.Group();
    build(g);
    // Portale im Halbkreis hinter der Mitte, Blick zur Hallenmitte
    const list = [...(byPlanet[planetId] || [])];
    if (planetId === 'p3') list.push(...(byPlanet.p4 || []));
    if (planetId === 'p5') list.push(...(byPlanet.p6 || []), ...(byPlanet.p7 || []));
    // Werkstatt-Wunsch „jedes Portal mit eigenem Design und Animation“ (portalDesigns.js), etwas größer als vorher
    // (0,94 statt 0,72); in der Sternentor-Halle stehen neun Portale, dort etwas kleiner und weiter gefächert
    const many = list.length > 7;
    const ring = many ? 4.6 : 4.0, scale = many ? 0.8 : 0.94, spreadMax = deg(many ? 280 : 260);
    list.forEach(({ world, color }, i) => {
      const spread = Math.min(spreadMax, deg(43) * (list.length - 1)); // fast rundum, vorne bleibt der Eingang frei
      const t = list.length > 1 ? -spread / 2 + (i / (list.length - 1)) * spread : 0;
      const pa = portalDesign(world, color, anims, rand, K);
      pa.scale.setScalar(scale);
      const px = Math.sin(t) * ring, pz = -Math.cos(t) * ring + 0.3;
      pa.position.set(px, 0.2, pz);
      pa.lookAt(0, 0.2, 0.6);
      g.add(pa);
      portalsOut.push(pa);
    });
    // prächtiger (Werkstatt-Wunsch): Podest mit Leuchtring in Planetenfarbe unter den Portalen, zwei Obelisken
    // mit leuchtenden Kristallen am Eingang, Feuerschalen und Banner
    const pc = list[0]?.color || '#ffd76a', glowM = E(pc, 1.3);
    lampMats.push(glowM);
    const podR = many ? 5.3 : 4.7;
    g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(podR - 0.2, podR, 0.22, 40), M('#d8d0c0')), 0, 0.11, 0.2));
    g.add(at(new THREE.Mesh(new THREE.TorusGeometry(podR - 0.45, 0.06, 6, 60), glowM), 0, 0.23, 0.2)).children.at(-1).rotation.x = Math.PI / 2;
    for (const sx of [-1, 1]) {
      const ox = sx * (many ? 6.0 : 5.5), oz = many ? 4.0 : 3.6;
      g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.4, 0.9), M('#a89e8c')), ox, 0.2, oz));
      const ob = at(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.42, 5.4, 4), M('#e8e0d0')), ox, 3.1, oz);
      ob.rotation.y = Math.PI / 4;
      g.add(ob);
      g.add(at(new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), glowM), ox, 6.25, oz));
      g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.24, 0.32, 12), M('#c8a040', { metalness: 0.6 })), sx * 1.7, 0.95, 4.5));
      g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.8, 8), M('#4a4458')), sx * 1.7, 0.4, 4.5));
      const fl = at(new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.65, 8), E('#ffb02e', 1.8)), sx * 1.7, 1.42, 4.5);
      g.add(fl);
      anims.push((tt) => fl.scale.set(1, 0.85 + Math.sin(tt * 8 + sx * 2) * 0.15, 1));
      const ban = at(new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.6, 0.7), M(pc)), ox + sx * 0.25, 4.0, oz);
      g.add(ban);
    }
    g.scale.setScalar(many ? 1.2 : 1.3);
    reserve(cx, cz, many ? 6.6 : 6.0);
    const o = put(g, cx, cz, { rot: false });
    o.lookAt(0, o.position.y, 0);
    o.userData.area = `portale-${planetId}`;
    // Partikel der Portale (Blüten, Schnee, Funken …) an ihren Platz in der Welt rechnen
    o.updateMatrixWorld(true);
    for (const pa of portalsOut.splice(0)) {
      const k = pa.getWorldScale(new THREE.Vector3()).x;
      for (const { marker, spec } of pa.userData.emit || []) {
        const w = marker.getWorldPosition(new THREE.Vector3());
        (shared.emitters ||= []).push({ ...spec, pos: [w.x, w.y, w.z], size: spec.size.map((v) => v * k), particleSize: spec.particleSize * k, sizeEnd: (spec.sizeEnd ?? spec.particleSize) * k, speed: spec.speed.map((v) => v * k), ...(spec.acceleration ? { acceleration: spec.acceleration.map((v) => v * k) } : {}) });
      }
    }
    return o;
  };
  const portalsOut = [];  // Heimat-Tor (Planet 1)
  hall('p1', 90, (g) => {
    const stone = M('#c8bea8');
    for (const s of [-1, 1]) {
      g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.8, 4.8, 0.8), stone), s * 5.4, 2.4, 4.6));
      g.add(at(new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.9, 4), M('#3f8a46')), s * 5.4, 5.25, 4.6));
    }
    // breiter und höher als früher: die größeren Portale stehen frei dahinter
    g.add(at(new THREE.Mesh(new THREE.BoxGeometry(11.6, 0.6, 0.8), stone), 0, 4.9, 4.6));
    const sg = signBoard('Heimatplanet', { w: 3.4, h: 0.7, bg: '#2f6a3a', fg: '#ffffff', sub: '7 Welten · mit Moneten kaufen' });
    sg.position.set(0, 4.25, 5.05);
    g.add(sg);
    for (const s of [-1, 1]) {
      const b = flag('#5fd38d', 3.6);
      b.position.set(s * 4.4, 0, 4.6);
      g.add(b);
    }
    // Bäume seitlich hinter den Torpfeilern (vorher standen sie vor den äußeren Portalen)
    for (const [x, z] of [[-6.2, 2.2], [6.2, 2.2]]) g.add(at(roundTree(1.6, '#4f9a3f', rand), x, 0, z));
  });
  addArea('portale-p1', 'Heimat-Tor (Planet 1)', ...polar(deg(90), HALL_R - 3.4));
  // Raketenstartplatz (Planet 2)
  hall('p2', 180, (g) => {
    const metal = M('#8a8f9a', { metalness: 0.6, roughness: 0.35 });
    g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 0.3, 24), metal), 0, 0.15, -0.6));
    const rocket = new THREE.Group();
    rocket.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 3.4, 20), M('#f2f2f6')), 0, 2.0, 0));
    rocket.add(at(new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.2, 20), M('#e0433a')), 0, 4.3, 0));
    for (let i = 0; i < 4; i++) {
      const f = at(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 0.6), M('#e0433a')), 0, 0.75, 0);
      const piv = new THREE.Group();
      piv.rotation.y = (i / 4) * TAU;
      f.position.z = 0.75;
      piv.add(f);
      rocket.add(piv);
    }
    rocket.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.06, 16), E('#7ad0ff', 0.8)), 0, 3.0, 0.57)).children.at(-1).rotation.x = Math.PI / 2;
    const flame = at(new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.9, 12), E('#ffb020', 2, { transparent: true, opacity: 0.85 })), 0, 0.05, 0);
    flame.rotation.x = Math.PI;
    flame.userData.rbx = { skip: true };
    rocket.add(flame);
    rocket.position.set(0, 0.3, -0.6);
    g.add(rocket);
    anims.push((t) => {
      flame.scale.set(1, 0.7 + Math.random() * 0.5, 1);
      rocket.position.y = 0.3 + Math.max(0, Math.sin(t * 0.3)) * 0.05;
    });
    // Startturm
    for (const [x, z] of [[1.2, -1.4], [1.9, -1.4], [1.2, -0.7], [1.9, -0.7]]) g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.12, 4.4, 0.12), M('#c8402e')), x, 2.2, z));
    for (let y = 0.6; y < 4.4; y += 0.8) g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.08, 0.85), M('#c8402e')), 1.55, y, -1.05));
    const sg = signBoard('Raketenstartplatz', { w: 3.4, h: 0.7, bg: '#3a2a7a', fg: '#ffffff', sub: 'Planet 2 · ab 1 Wiedergeburt' });
    sg.position.set(0, 0.9, 2.0);
    sg.rotation.x = -0.3;
    g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.9, 0.1), M('#4a4458')), 0, 0.45, 1.95));
    g.add(sg);
    const blink = E('#ff4058', 2);
    for (const x of [-1.5, 1.5]) g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), blink), x, 0.35, 0.9));
    anims.push((t) => (blink.emissiveIntensity = Math.sin(t * 5) > 0 ? 2.4 : 0.2));
  });
  addArea('portale-p2', 'Raketenstartplatz (Planet 2)', ...polar(deg(180), HALL_R - 3.4));
  // Tiefsee-Strudel (Planet 3)
  hall('p3', 270, (g) => {
    g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(1.9, 2.0, 0.4, 32), M('#8aa4b0')), 0, 0.2, -0.3));
    const water = at(new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 0.05, 32), M('#1a7ab8', { roughness: 0.05, emissive: '#0a4a7a', emissiveIntensity: 0.6 })), 0, 0.4, -0.3);
    g.add(water);
    const swirl = [];
    for (let i = 0; i < 4; i++) {
      const r = at(new THREE.Mesh(new THREE.TorusGeometry(0.4 + i * 0.35, 0.05, 6, 32), E('#9ff3f0', 1.1, { transparent: true, opacity: 0.7 })), 0, 0.45 + i * 0.02, -0.3);
      r.rotation.x = Math.PI / 2;
      g.add(r);
      swirl.push(r);
    }
    anims.push((t) => swirl.forEach((r, i) => (r.rotation.z = t * (1.6 - i * 0.3))));
    // Kristalle seitlich am Hallenrand (vorher standen sie vor den äußeren Portalen)
    for (const [x, z, c] of [[-5.9, 3.4, '#ff7a8a'], [5.9, 3.4, '#ffb05a']]) g.add(at(crystal(1.2, c, rand, 0.8), x, 0, z));
    // Planet 4 teilt sich die Halle: goldene Himmelsleiter hinter dem Strudel
    const sky = (byPlanet.p4 || []).length > 0;
    if (sky) {
      const goldM = M('#ffcf4a', { metalness: 0.7, roughness: 0.3, emissive: '#b8860b', emissiveIntensity: 0.35 });
      // steigt jetzt mitten aus dem Strudel auf (dahinter stehen die Portale)
      for (const sx of [-0.45, 0.45]) g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.1, 6, 0.1), goldM), sx, 3.4, -0.3));
      for (let y = 0.9; y < 6.4; y += 0.55) g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.08), goldM), 0, y, -0.3));
      g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.9, 12, 8), M('#ffffff', { roughness: 1 })), 0, 6.6, -0.3));
    }
    const sg = signBoard(sky ? 'Tiefsee & Himmel' : 'Tiefsee-Portal', { w: 3.0, h: 0.7, bg: '#0a4a6a', fg: '#9ff3f0', sub: sky ? 'Planet 3 ab 3 · Planet 4 ab 6 Wiedergeburten' : 'Planet 3 · ab 3 Wiedergeburten' });
    sg.position.set(0, 0.9, 2.0);
    sg.rotation.x = -0.3;
    g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.9, 0.1), M('#4a4458')), 0, 0.45, 1.95));
    g.add(sg);
  });
  addArea('portale-p3', (byPlanet.p4 || []).length ? 'Tiefsee-Strudel und Himmelsleiter (Planet 3 und 4)' : 'Tiefsee-Strudel (Planet 3)', ...polar(deg(270), HALL_R - 3.4));
  // Sternentor (Juwelnebel, Planeten 5 bis 7; Werkstatt-Wunsch „eigene Halle für die Edelstein-Portale“): neun Portale im
  // weiten Halbkreis, dahinter ein schwebender Sternenring aus Kristallen, der sich dreht
  if ((byPlanet.p5 || []).length) {
    hall('p5', 335, (g) => {
      const ringG = new THREE.Group();
      ringG.position.set(0, 7.0, 0);
      const cols = ['#c98bff', '#3ee08a', '#8af0ff', '#ff5fd2'];
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU;
        const c = at(new THREE.Mesh(new THREE.OctahedronGeometry(0.3, 0), E(cols[i % 4], 1.1)), Math.cos(a) * 1.6, Math.sin(a) * 1.6, 0);
        c.scale.set(0.7, 1.4, 0.7);
        c.rotation.z = a + Math.PI / 2;
        c.userData.rbx = { facets: true };
        ringG.add(c);
      }
      ringG.add(at(new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.06, 6, 24), E('#ffffff', 1.2)), 0, 0, 0));
      ringG.children.at(-1).userData.rbx = { segs: 12 };
      ringG.userData.pfx = { id: 'sternentor', type: 'spin', speed: 0.4, amp: 0, axis: [0, 0, 1] };
      g.add(ringG);
      anims.push((t) => (ringG.rotation.z = t * 0.4));
      g.add(at(new THREE.Mesh(new THREE.OctahedronGeometry(0.5, 0), E('#ffffff', 1.6)), 0, 7.0, 0)).children.at(-1).scale.set(0.8, 1.4, 0.8);
      for (const s of [-1, 1]) g.add(at(crystal(1.4, s < 0 ? '#c98bff' : '#8af0ff', rand, 0.9), s * 6.6, 0, 2.4));
      const sg = signBoard('Sternentor', { w: 3.4, h: 0.7, bg: '#3a1a5a', fg: '#ffd0f4', sub: 'Juwelnebel · Planet 5 bis 7 · nach der Supernova' });
      sg.position.set(0, 0.9, 4.4);
      sg.rotation.x = -0.3;
      g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.9, 0.1), M('#4a4458')), 0, 0.45, 4.35));
      g.add(sg);
    });
    addArea('portale-p5', 'Sternentor (Juwelnebel)', ...polar(deg(335), HALL_R - 3.4));
  }

  // ── Spielbereiche im äußeren Ring ──
  // Ei-Schlüpfplatz: alle elf Eier auf Podesten im Halbkreis
  {
    const g = new THREE.Group();
    const eggs = ['#ffd89a', '#b6ff6a', '#9ff0ff', '#fff4cf', '#b49cff', '#ff8fc8', '#ff4058', '#ffe07a', '#4ff0e0', '#ff8a3d', '#ffe14a'];
    eggs.forEach((c, i) => {
      const t = (i - 5) * 0.29, x = Math.sin(t) * 2.6, z = -Math.cos(t) * 2.6 + 1.9;
      g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.4, 0.5, 8), M('#4a4458')), x, 0.25, z));
      const e = eggIcon(c);
      e.scale.setScalar(0.68);
      e.position.set(x, 0.5, z);
      g.add(e);
      g.add(at(new THREE.Mesh(new THREE.TorusGeometry(0.37, 0.035, 6, 24), E(c, 1.2)), x, 0.52, z)).children.at(-1).rotation.x = Math.PI / 2;
      const ph = i;
      anims.push((tt) => (e.rotation.y = tt * 0.5 + ph));
    });
    const sg = signBoard('Ei-Schlüpfplatz', { w: 2.8, h: 0.65, bg: '#c8801a', fg: '#ffffff', sub: 'Ei antippen & schlüpfen' });
    sg.position.set(0, 2.6, -0.4);
    g.add(sg);
    g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.4, 0.14, 32, 1, false, Math.PI * 0.5, Math.PI), M('#b8ae9c')), 0, 0.07, 1.9));
    // Mitte: Nest aus Zweigen mit großem goldenem Ei, darüber ein Bogen mit Lichtern
    for (let k = 0; k < 10; k++) { const a = (k / 10) * TAU, tw = at(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 5), M('#8a6440')), Math.cos(a) * 0.55, 0.25, Math.sin(a) * 0.55 + 1.6); tw.rotation.set(Math.PI / 2, 0, a); g.add(tw); }
    const bigEgg = eggIcon('#ffe14a');
    bigEgg.scale.setScalar(1.1);
    bigEgg.position.set(0, 0.3, 1.6);
    g.add(bigEgg);
    anims.push((tt) => (bigEgg.rotation.z = Math.sin(tt * 3) * 0.08));
    g.add(at(new THREE.Mesh(new THREE.TorusGeometry(2.0, 0.08, 6, 24, Math.PI), M('#c8801a')), 0, 0.2, 1.6));
    for (let k = 0; k <= 8; k++) { const b = (k / 8) * Math.PI; const l = E(['#ffd89a', '#b49cff', '#4ff0e0'][k % 3], 1.4); lampMats.push(l); g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 4), l), Math.cos(b) * 2.0, 0.2 + Math.sin(b) * 2.0, 1.65)); }
    dress(g, 5.2, 3.6, { planters: false });
    placeAt(g, deg(30), OUTER_R, 2.8).userData.area = 'schluepfen';
    addArea('schluepfen', 'Ei-Schlüpfplatz', ...polar(deg(30), OUTER_R - 1.6));
  }
  // (Glücksrad entfernt, Werkstatt-Wunsch; gedreht wird es weiter im Belohnungs-Fenster)
  // VIP-Lounge
  {
    const g = new THREE.Group();
    g.add(at(new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.12, 3.2), M('#d9b26a', { metalness: 0.5, roughness: 0.35 })), 0, 0.06, 0));
    g.add(at(new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.05, 3.0), M('#b0102a')), 0, 0.14, 0.3)); // roter Teppich
    for (const s of [-1, 1]) {
      g.add(at(new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.45, 0.6), M('#5a1a3a')), s * 1.4, 0.35, -0.9));
      g.add(at(new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 0.15), M('#5a1a3a')), s * 1.4, 0.65, -1.15));
      for (const z of [0.6, 1.5]) g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.8, 8), M('#ffd76a', { metalness: 0.7 })), s * 0.65, 0.4, z));
      g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 6), M('#b0102a')), s * 0.65, 0.7, 1.05)).children.at(-1).rotation.x = Math.PI / 2;
    }
    const sg = signBoard('VIP-Lounge', { w: 2.4, h: 0.6, bg: '#1a1408', fg: '#ffd76a', sub: 'Nur mit VIP-Pass' });
    sg.position.set(0, 2.0, -1.4);
    g.add(sg);
    g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 12), E('#ffd76a', 0.9)), 0, 1.1, -1.0));
    // Baldachin auf vier goldenen Pfosten, Palmen in Kübeln, goldene Scheinwerfer, Leuchtkante
    for (const [x, z] of [[-1.9, -1.4], [1.9, -1.4], [-1.9, 1.4], [1.9, 1.4]]) g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 2.6, 8), M('#ffd76a', { metalness: 0.7 })), x, 1.3, z));
    g.add(at(new THREE.Mesh(new THREE.BoxGeometry(4.1, 0.08, 3.1), M('#5a1a3a')), 0, 2.62, 0));
    for (let k = 0; k < 12; k++) g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.25, 0.04), M(k % 2 ? '#5a1a3a' : '#ffd76a')), -1.9 + ((k + 0.5) * 3.8) / 12, 2.45, 1.57));
    const vipGlow = E('#ffd76a', 1.3);
    lampMats.push(vipGlow);
    g.add(at(new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.04, 0.06), vipGlow), 0, 0.14, 1.62));
    for (const sx of [-1, 1]) {
      g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.2, 0.4, 10), M('#3a2a1a')), sx * 2.4, 0.2, 1.2));
      g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.4, 6), M('#8a6440')), sx * 2.4, 1.1, 1.2));
      for (let k = 0; k < 5; k++) { const lf = at(new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.03, 0.18), M('#3f9a44')), sx * 2.4 + Math.cos(k * 1.25) * 0.3, 1.8, 1.2 + Math.sin(k * 1.25) * 0.3); lf.rotation.set(0, -k * 1.25, -0.4); g.add(lf); }
      g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.08, 0.3, 10), M('#ffd76a', { metalness: 0.7 })), sx * 1.7, 2.4, -1.2));
    }
    dress(g, 4.2, 3.2);
    placeAt(g, deg(210), OUTER_R, 2.6).userData.area = 'vip';
    addArea('vip', 'VIP-Lounge', ...polar(deg(210), OUTER_R - 1.8));
  }
  // Obby-Turm mit Sprungstrecke
  {
    const g = new THREE.Group();
    g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 7, 12), M('#9a907e')), 0, 3.5, -0.5));
    const cols = ['#ff5aa5', '#ffe07a', '#5ad1ff', '#8cff7a', '#c48bff', '#ff8a3d'];
    for (let i = 0; i < 12; i++) {
      const a = i * 0.75, r = 1.7, y = 0.4 + i * 0.55;
      const p = at(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.18, 0.8), M(cols[i % cols.length])), Math.cos(a) * r, y, Math.sin(a) * r - 0.5);
      g.add(p);
      if (i % 4 === 3) g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 6), M('#ffffff')), Math.cos(a) * r, y + 0.4, Math.sin(a) * r - 0.5));
    }
    const top = chest(anims);
    top.position.set(0, 7.0, -0.5);
    g.add(top);
    // Startbogen unten, leuchtende Checkpoint-Platten, Plattform mit Geländer oben
    for (const sx of [-0.7, 0.7]) g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.6, 0.16), M('#2a2232')), sx + 1.7, 0.8, -0.5));
    g.add(at(new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.3, 0.2), M('#8cff7a')), 1.7, 1.65, -0.5));
    for (let i = 3; i < 12; i += 4) { const a = i * 0.75; const cp = E('#8cff7a', 1.2); lampMats.push(cp); g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.04, 0.82), cp), Math.cos(a) * 1.7, 0.4 + i * 0.55 + 0.11, Math.sin(a) * 1.7 - 0.5)); }
    g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.12, 16), M('#9a907e')), 0, 6.95, -0.5));
    for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU; g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 5), M('#ffd76a', { metalness: 0.7 })), Math.cos(a) * 1.05, 7.25, Math.sin(a) * 1.05 - 0.5)); }
    const sg = signBoard('Obby', { w: 1.6, h: 0.5, bg: '#2a2232', fg: '#8cff7a', sub: 'Oben wartet eine Truhe' });
    sg.position.set(0, 1.1, 1.6);
    g.add(sg);
    g.scale.setScalar(1.25); // höher als früher: vom ganzen Platz aus zu sehen
    placeAt(g, 0, OUTER_R + 0.6, 3.0).userData.area = 'obby';
    addArea('obby', 'Obby-Turm', ...polar(0, OUTER_R - 2.4));
  }
  // (Pavillon entfernt, Werkstatt-Wunsch „weniger Gebäude“)
  // ── Leben: Spaziergänger mit Haustieren, Münzregen, Feuerwerk ──
  const walkers = [];
  for (let i = 0; i < 12; i++) {
    const n = npc(['#e0433a', '#3a8fd1', '#5fd38d', '#ffb02e', '#b07bff', '#ff8ac8', '#2aa860', '#7a5ad8', '#ff5aa5', '#5ad1ff', '#c8801a', '#8cff7a'][i]);
    n.userData.rbx = { skip: true };
    const pt = pet(['#c98a4b', '#f7f9fc', '#e8752a', '#9a4e22'][i % 4]);
    pt.userData.rbx = { skip: true };
    root.add(n, pt);
    walkers.push({ n, pt, r: i % 2 ? WALK_PLAZA : RING_MID, sp: (0.07 + rand() * 0.05) * (i % 3 ? 1 : -1), ph: rand() * TAU });
  }
  anims.push((t) =>
    walkers.forEach(({ n, pt, r, sp, ph }) => {
      const a = ph + t * sp, x = Math.cos(a) * r, z = Math.sin(a) * r;
      n.position.set(x, height(x, z) + 0.04, z);
      n.rotation.y = -a + (sp > 0 ? Math.PI : 0);
      const sw = Math.sin(t * 7 + ph) * 0.6;
      n.userData.legs.forEach((l, k) => (l.rotation.x = k ? sw : -sw));
      n.userData.arms.forEach((l, k) => (l.rotation.x = k ? -sw : sw));
      const b = a - Math.sign(sp) * 0.08, px = Math.cos(b) * (r + 0.3), pz = Math.sin(b) * (r + 0.3);
      pt.position.set(px, height(px, pz), pz);
      pt.rotation.y = n.rotation.y;
    }),
  );
  // Münzregen über dem Marktplatz
  const rain = [], coinM = M('#ffcf4a', { metalness: 0.7, roughness: 0.3, emissive: '#b8860b', emissiveIntensity: 0.4 });
  for (let i = 0; i < 40; i++) {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.04, 14), coinM);
    c.userData.rbx = { skip: true };
    root.add(c);
    rain.push([c, rand() * TAU, 1 + rand() * (PLAZA - 2), rand(), 0.5 + rand() * 0.5]);
  }
  anims.push((t) =>
    rain.forEach(([c, a, r, ph, sp]) => {
      const k = (t * 0.12 * sp + ph) % 1;
      c.position.set(Math.cos(a) * r, y0 + 9 - k * 9, Math.sin(a) * r);
      c.rotation.set(t * 3 + ph * 9, t * 2, 0);
      c.visible = k < 0.97;
    }),
  );
  // Feuerwerk (nachts häufiger)
  const fw = [], FWN = 7, FWP = 60;
  for (let f = 0; f < FWN; f++) {
    const pos = new Float32Array(FWP * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ size: 0.35, map: dotTex(), color: ['#ff5aa5', '#ffe07a', '#5ad1ff', '#8cff7a', '#c48bff', '#ff8a3d', '#ffffff'][f], transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    scene.add(pts);
    const dirs = Array.from({ length: FWP }, () => new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize().multiplyScalar(2 + rand()));
    fw.push({ pts, pos, mat, dirs, at: new THREE.Vector3(), t0: -99, ph: f * 1.7 });
  }

  // ── Tag und Nacht ──
  const day = new THREE.Color('#7ec8f0'), dusk = new THREE.Color('#f29f6b'), night = new THREE.Color('#141a3a');
  const bg = new THREE.Color();
  scene.background = bg;
  const fog = scene.fog;
  const CYCLE = 90; // Sekunden für einen ganzen Tag
  anims.push((t) => {
    const k = (t / CYCLE) % 1; // 0 = Mittag
    const n = Math.max(0, Math.min(1, (Math.cos(k * TAU) * -1 + 0.2) * 1.4)); // 0 Tag … 1 Nacht
    bg.copy(day).lerp(dusk, Math.min(1, n * 2)).lerp(night, Math.max(0, n * 2 - 1));
    fog?.color.copy(bg);
    if (lights) {
      lights.hemi.intensity = 1.25 - n * 0.75;
      lights.sun.intensity = 2.0 - n * 1.6;
    }
    lampMats.forEach((m) => (m.emissiveIntensity = 1.2 + n * 2.2));
    // Feuerwerk
    fw.forEach((f) => {
      const every = n > 0.5 ? 2.6 : 7;
      const cyc = Math.floor((t + f.ph) / every);
      if (cyc !== f.cyc) {
        f.cyc = cyc;
        f.t0 = t;
        const a = rand() * TAU, r = 2 + rand() * 14;
        f.at.set(Math.cos(a) * r, y0 + 7 + rand() * 4, Math.sin(a) * r);
      }
      const e = t - f.t0;
      for (let i = 0; i < FWP; i++) {
        const d = f.dirs[i];
        f.pos[i * 3] = f.at.x + d.x * e * 1.6;
        f.pos[i * 3 + 1] = f.at.y + d.y * e * 1.6 - e * e * 0.9;
        f.pos[i * 3 + 2] = f.at.z + d.z * e * 1.6;
      }
      f.pts.geometry.attributes.position.needsUpdate = true;
      f.mat.opacity = Math.max(0, 1 - e / 1.8) * (0.4 + n * 0.6);
    });
  });

  // ── Simulator-Glanz ──
  // leuchtender Goldrand um den Platz
  {
    const glow = E('#ffd76a', 1.4);
    lampMats.push(glow);
    const rim = at(new THREE.Mesh(new THREE.TorusGeometry(PLAZA + 0.04, 0.07, 6, 96), glow), 0, y0 + 0.1, 0);
    rim.rotation.x = Math.PI / 2;
    root.add(rim);
  }
  // goldene Münzen schweben im Kreis um den Brunnen
  {
    const gold = M('#f2c14e', { metalness: 0.7, roughness: 0.3 });
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU, r = 3.5, y = y0 + 2.3 + (i % 2) * 0.6;
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.08, 24), gold);
      c.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
      c.rotation.set(0, -a, Math.PI / 2);
      root.add(c);
      anims.push((t) => {
        c.position.y = y + Math.sin(t * 1.2 + i) * 0.15;
        c.rotation.set(0, -a + t * 0.8, Math.PI / 2);
      });
    }
  }

  // ── Platz und Straßen genauer (Werkstatt-Wunsch „Platz und Brunnen“, „Straßen und Leben“) ──
  {
    // Ringe im Pflaster um das Brunnenbecken und am Platzrand
    for (const [r0, r1, c] of [[3.85 * 1, 4.05, '#b89a5e'], [PLAZA - 1.1, PLAZA - 0.95, '#c8a86a']]) {
      const m = new THREE.Mesh(new THREE.RingGeometry(r0, r1, 96), M(c, { roughness: 0.6 }));
      m.rotation.x = -Math.PI / 2;
      m.position.y = y0 + 0.086;
      m.userData.rbx = { color: c };
      root.add(m);
    }
    // Bäume hinter den Bänken, Blumenbeete zwischen den Bänken
    for (let i = 0; i < 8; i++) {
      const a = deg(22.5 + i * 45), [x, z] = polar(a, 7.75 * S + 0.95);
      root.add(at(roundTree(1.5, ['#4f9a3f', '#5fae4f'][i % 2], rand), x, height(x, z), z));
      reserve(x, z, 0.7);
    }
    for (let i = 0; i < 4; i++) {
      const a = deg(45 + i * 90), [x, z] = polar(a, 7.75 * S + 0.2);
      const bed = new THREE.Group();
      bed.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.95, 0.3, 20), M('#c8bca4')), 0, 0.15, 0));
      bed.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.06, 20), M('#5a3a22')), 0, 0.3, 0));
      const fp = flowerPatch(['#ff5f8f', '#ffd23f', '#ffffff', '#a86bff'], rand, 8);
      fp.position.y = 0.32;
      bed.add(fp);
      bed.add(at(bush(0.35, '#4fb04a', rand), 0, 0.32, 0));
      put(bed, x, z, { rot: false });
      reserve(x, z, 1.0);
    }
    // Tauben in kleinen Gruppen auf dem Platz (picken auf der Webseite)
    for (let gI = 0; gI < 4; gI++) {
      const a = deg(70 + gI * 90), [cx, cz] = polar(a, 8.4 * S);
      for (let k = 0; k < 4; k++) {
        const bird = new THREE.Group();
        bird.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), M('#8a8f9a')), 0, 0.1, 0));
        bird.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), M('#5a6070')), 0, 0.18, 0.08));
        bird.add(at(new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.06, 4), M('#e0a030')), 0, 0.18, 0.15)).children.at(-1).rotation.x = Math.PI / 2;
        const x = cx + Math.cos(k * 1.7) * 0.5, z = cz + Math.sin(k * 1.7) * 0.5;
        bird.position.set(x, y0 + 0.08, z);
        bird.rotation.y = k * 1.3;
        root.add(bird);
        const ph = gI * 3 + k;
        anims.push((tt) => (bird.children[1].position.y = 0.18 - Math.max(0, Math.sin(tt * 4 + ph)) * 0.06));
      }
    }
    // Boulevards: Bäume und Blumenkübel zwischen den Laternen, Wimpelketten quer über die Straße
    const roadEnd2 = HALL_R - 2.2;
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * TAU, ca = Math.cos(a), sa = Math.sin(a);
      for (let d = PLAZA + 2.3, n = 0; d < roadEnd2 - 1; d += 2.6, n++) {
        for (const side of [-1, 1]) {
          const off = ROAD_W / 2 + 1.0, x = ca * d - sa * side * off, z = sa * d + ca * side * off;
          if (!free(x, z, 0.55)) continue;
          if (n % 2) {
            const pl = new THREE.Group();
            pl.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.4, 0.55), M('#9a6a4a')), 0, 0.2, 0));
            pl.add(at(bush(0.3, '#4fb04a', rand), 0, 0.4, 0));
            root.add(at(pl, x, height(x, z), z));
          } else root.add(at(roundTree(1.4, '#4f9a3f', rand), x, height(x, z), z));
          reserve(x, z, 0.55);
        }
        if (n % 2 === 0) {
          const cols = ['#ff5aa5', '#ffd76a', '#5ad1ff', '#8cff7a', '#c48bff'];
          for (let f = 0; f <= 8; f++) {
            const o = -ROAD_W / 2 - 0.35 + (f * (ROAD_W + 0.7)) / 8, sag = Math.sin((f / 8) * Math.PI) * 0.4;
            const fl = at(new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.24, 3), M(cols[f % cols.length])), ca * (d - 1.3) - sa * o, y0 + 1.45 - sag, sa * (d - 1.3) + ca * o);
            fl.rotation.x = Math.PI;
            root.add(fl);
          }
        }
      }
    }
    // Marktstände mit Händlern an den Boulevards zur Raketen- und Tiefsee-Halle
    const goods = [['#ff5a3a', '#ffd23f', '#8cff7a'], ['#c8302a', '#ffe7a8', '#ffb05a'], ['#5ad1ff', '#ffffff', '#b07bff'], ['#ffcf4a', '#f2c14e', '#e0a030']];
    let gi = 0;
    for (const k of [2, 3])
      for (const side of [-1, 1]) {
        const a = (k / 4) * TAU, ca = Math.cos(a), sa = Math.sin(a), d = PLAZA + 3.6, off = ROAD_W / 2 + 1.9;
        const x = ca * d - sa * side * off, z = sa * d + ca * side * off;
        if (!free(x, z, 1.0)) continue;
        reserve(x, z, 1.1);
        const st = new THREE.Group(), cl = goods[gi++ % goods.length];
        st.add(at(new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.7, 0.6), M('#8a5a3a')), 0, 0.35, 0.2));
        for (const sx of [-0.65, 0.65]) st.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.8, 6), M('#6b4a2e')), sx, 0.9, 0.45));
        for (let f = 0; f < 4; f++) { const aw = at(new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.05, 0.9), M(f % 2 ? cl[0] : '#ffffff')), -0.57 + f * 0.38, 1.82, 0.2); aw.rotation.x = 0.25; st.add(aw); }
        for (let f = 0; f < 9; f++) st.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 4), M(cl[f % 3])), -0.5 + (f % 5) * 0.25, 0.78, 0.1 + Math.floor(f / 5) * 0.18));
        st.add(at(npc(cl[0]), 0, 0, -0.35));
        const o = put(st, x, z, { rot: false });
        o.lookAt(ca * d, o.position.y, sa * d);
      }
  }

  // ── Grün ──
  // Blumenbeete und Büsche zwischen den Läden (der Platz und die Straßen sind reserviert und bleiben frei)
  scatter(Math.round(16 * S), () => flowerPatch(['#ff5f8f', '#ffd23f', '#ffffff', '#a86bff', '#ff8a3d'], rand), 0.45, PLAZA + 0.6, RING_IN - 0.3);
  scatter(Math.round(18 * S), () => bush(rr(0.22, 0.34), ['#4fb04a', '#3f9a44'][Math.floor(rand() * 2)], rand), 0.3, PLAZA + 0.6, RING_IN - 0.3);
  // äußerer Ring: zwischen den Spielbereichen (rMax unter R - 2,5, sonst vervielfacht scatter die Anzahl)
  scatter(Math.round(22 * S * S), () => bush(rr(0.25, 0.4), '#4a9a44', rand), 0.35, RING_OUT + 0.4, R - 2.6);
  scatter(Math.round(14 * S * S), () => flowerPatch(['#ff7a9a', '#ffe25f', '#ffffff', '#b07bff'], rand), 0.45, RING_OUT + 0.4, R - 2.6);
  if (!ctx.modelWorld) scatter(Math.round(18 * S * S), () => roundTree(rr(1.3, 2.0), ['#4f9a3f', '#5fae4f'][Math.floor(rand() * 2)], rand), 0.9, OUTER_R + 1.4, R - 2.6); // sonst Bäume als Modelle
}
