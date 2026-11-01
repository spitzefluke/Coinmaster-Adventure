// Der Spawn als prachtvolle Münzstadt: Marktplatz mit Springbrunnen, Stadtmauer mit Türmen,
// große Läden mit Innenraum, Portal-Hallen je Planet, Spielbereiche und viel Leben.
//
// Wird von worldFactory.js aufgerufen; die Bausteine (Materialien, Schilder, Portale …) kommen
// über K herein, damit es keine Kreis-Importe gibt. Alles, was man im Spiel antippen kann, trägt
// userData.area (siehe AREA_ACTIONS in spiel/js/main.js).

import * as THREE from 'three';

const TAU = Math.PI * 2;
const deg = (d) => (d * Math.PI) / 180;
const polar = (a, r) => [Math.cos(a) * r, Math.sin(a) * r];

export function buildSpawnTown(ctx, K) {
  const { put, reserve, root, anims, rand, rr, scatter, height, shared, scene, lights, R } = ctx;
  const { M, E, at, group, signBoard, column, lamp, chest, bench, roundTree, bush, flower, crystal, portalArch, leaderboard, rankRows, coinStatue, indexBook, codesTerminal, eggIcon, potionIcon, canvasTex, dotTex } = K;
  const y0 = height(0, 0);
  const areas = (shared.areas = []);
  const lampMats = []; // leuchten nachts heller
  const addArea = (id, name, x, z, obj) => {
    areas.push({ id, name, pos: new THREE.Vector3(x, y0, z) });
    if (obj) obj.userData.area = id;
  };
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
  }, { repeat: [14, 14] });
  const cobbleM = new THREE.MeshStandardMaterial({ map: cobble, color: '#ffffff', roughness: 0.85 });
  const plaza = at(new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.2, 0.08, 56), cobbleM), 0, y0 + 0.04, 0);
  plaza.userData.rbx = { color: '#d2c8b4' };
  plaza.receiveShadow = true;
  root.add(plaza);
  reserve(0, 0, 5.4);
  const streetM = new THREE.MeshStandardMaterial({ map: cobble, color: '#e8e0d0', roughness: 0.85 });
  // vier Hauptstraßen zu den Portal-Hallen und dem Obby-Turm
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * TAU, len = 8.6, mid = 5 + len / 2;
    const road = new THREE.Mesh(new THREE.BoxGeometry(len, 0.07, 2.0), streetM);
    road.position.set(Math.cos(a) * mid, y0 + 0.035, Math.sin(a) * mid);
    road.rotation.y = -a;
    road.userData.rbx = { color: '#d8cfbc' };
    root.add(road);
    for (let d = 5; d < 13.8; d += 0.6) reserve(Math.cos(a) * d, Math.sin(a) * d, 1.0);
    // Laternen mit Lichterketten
    let prev = null;
    for (let d = 6.2; d < 13; d += 2.2)
      for (const side of [-1, 1]) {
        const x = Math.cos(a) * d - Math.sin(a) * side * 1.35, z = Math.sin(a) * d + Math.cos(a) * side * 1.35;
        const l = put(lamp(), x, z, { rot: false });
        l.traverse((o) => o.isMesh && o.material.emissiveIntensity > 1 && lampMats.push(o.material));
        if (side === 1) {
          if (prev) stringLights(prev, l.position.clone().add(new THREE.Vector3(0, 1.4, 0)));
          prev = l.position.clone().add(new THREE.Vector3(0, 1.4, 0));
        }
      }
  }
  // Ringstraße
  const ring = new THREE.Mesh(new THREE.RingGeometry(9.6, 10.8, 96), streetM);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = y0 + 0.03;
  ring.userData.rbx = { color: '#d8cfbc' };
  root.add(ring);
  for (let i = 0; i < 96; i++) reserve(...polar((i / 96) * TAU, 10.2), 0.7);

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
    const water = at(new THREE.Mesh(new THREE.CylinderGeometry(2.25, 2.25, 0.06, 40), M('#4ab0e8', { roughness: 0.1, emissive: '#2a7ab8', emissiveIntensity: 0.35 })), 0, 0.5, 0);
    g.add(water);
    const statue = coinStatue(anims);
    statue.scale.setScalar(0.85);
    statue.position.y = 0.45;
    g.add(statue);
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
    put(g, 0, 0, { rot: false, sink: -0.08 });
  }
  // Spawn-Pad vor dem Brunnen
  {
    const pad = at(new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.14, 32), M('#3a3046')), 0, y0 + 0.11, 3.7);
    pad.userData.rbx = { name: 'SpawnLocation', className: 'SpawnLocation' };
    root.add(pad);
    const pr = at(new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.07, 6, 32), E('#ffd76a', 1.3)), 0, y0 + 0.19, 3.7);
    pr.rotation.x = Math.PI / 2;
    root.add(pr);
    shared.figureSpot = new THREE.Vector3(1.6, y0 + 0.08, 3.9);
    addArea('spawn', 'Marktplatz', 0, 2.5);
  }

  // ── Stadtmauer mit Türmen und Fahnen ──
  {
    const WR = R - 0.9, stone = M('#b8ae9c'), dark = M('#9a907e'), roofM = M('#b0402e');
    const segs = 48;
    for (let i = 0; i < segs; i++) {
      const a0 = (i / segs) * TAU, a1 = ((i + 1) / segs) * TAU, am = (a0 + a1) / 2;
      // Lücken für die vier Tore
      if ([0, 90, 180, 270].some((d) => Math.abs(((am - deg(d) + Math.PI * 3) % TAU) - Math.PI) < deg(5))) continue;
      const len = 2 * WR * Math.sin(Math.PI / segs) + 0.05;
      const [x, z] = polar(am, WR);
      const w = new THREE.Mesh(new THREE.BoxGeometry(len, 1.7, 0.55), i % 2 ? stone : dark);
      w.position.set(x, height(x, z) + 0.85, z);
      w.rotation.y = -am + Math.PI / 2;
      root.add(w);
      const cr = new THREE.Mesh(new THREE.BoxGeometry(len * 0.45, 0.35, 0.6), stone);
      cr.position.set(x, height(x, z) + 1.85, z);
      cr.rotation.y = w.rotation.y;
      root.add(cr);
    }
    for (let i = 0; i < 8; i++) {
      const a = deg(22.5 + i * 45), [x, z] = polar(a, WR);
      const t = new THREE.Group();
      t.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.0, 3.4, 12), stone), 0, 1.7, 0));
      t.add(at(new THREE.Mesh(new THREE.ConeGeometry(1.15, 1.5, 12), roofM), 0, 4.15, 0));
      t.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.45, 0.06), E('#ffd98a', 0.6)), 0, 2.4, 0.95));
      t.add(flag(i % 2 ? '#d9b26a' : '#b0402e', 4.9));
      reserve(x, z, 1.2);
      const o = put(t, x, z, { rot: false });
      o.lookAt(0, o.position.y, 0);
    }
    // Torbögen über den vier Straßen
    for (const d of [0, 90, 180, 270]) {
      const a = deg(d), [x, z] = polar(a, WR);
      const gate = new THREE.Group();
      for (const s of [-1, 1]) gate.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.9, 3, 0.9), stone), s * 1.6, 1.5, 0));
      const arc = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.35, 6, 16, Math.PI), stone);
      arc.position.y = 3;
      gate.add(arc);
      gate.add(flag('#d9b26a', 4.4));
      const o = put(gate, x, z, { rot: false });
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

  // ── Große Läden ──
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
    // Satteldach
    for (const sz of [-1, 1]) {
      const slope = new THREE.Mesh(new THREE.BoxGeometry(W + 0.5, 0.14, D * 0.62), roofM);
      slope.rotation.x = sz * 0.6;
      slope.position.set(0, H + 0.45, sz * D * 0.26);
      g.add(slope);
    }
    // Giebeldreiecke als Stufen
    for (let i = 0; i < 3; i++) for (const sx of [-1, 1]) g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.28, D * (0.8 - i * 0.26)), wallM), sx * (W / 2), H + 0.14 + i * 0.28, 0));
    g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.0, 0.35), M('#8a5a4a')), W * 0.3, H + 0.8, -0.4));
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

  const shopRing = 7.9;
  const shops = [
    { a: 25, id: 'eier', name: 'Eier-Laden', sub: 'Eier für Haustiere', wall: '#fbf3e4', roof: '#e0a030', accent: '#c8801a',
      items: (g, D) => ['#ffd89a', '#b6ff6a', '#9ff0ff', '#fff4cf', '#b49cff', '#ff4058', '#ffe07a'].forEach((c, i) => {
        const e = eggIcon(c);
        e.scale.setScalar(0.42);
        e.position.set(-1.2 + (i % 4) * 0.8, i < 4 ? 0.95 : 1.65, -D / 2 + 0.32);
        g.add(e);
      }) },
    { a: 65, id: 'boosts', name: 'Boost-Labor', sub: 'Glück, EP, Wetter', wall: '#eef0ff', roof: '#5a3ab0', accent: '#7a5ad8',
      items: (g, D) => ['#b07bff', '#7ad0ff', '#7aff8a', '#ffd76a', '#ff8ac8'].forEach((c, i) => {
        const p = potionIcon(c);
        p.scale.setScalar(0.38);
        p.position.set(-1.2 + i * 0.6, 0.94, -D / 2 + 0.32);
        g.add(p);
      }) },
    { a: 115, id: 'robux', name: 'Robux-Palast', sub: 'Angebote & VIP-Pass', wall: '#f2fff6', roof: '#e8c060', accent: '#2aa860', palace: true },
    { a: 155, id: 'haustiere', name: 'Haustier-Hof', sub: 'Ausrüsten & pflegen', wall: '#fff0f6', roof: '#d84a8a', accent: '#d84a8a' },
    { a: 205, id: 'verkaufen', name: 'Verkaufs-Kontor', sub: 'Münzen gegen Taler', wall: '#fff4e0', roof: '#8a5a3a', accent: '#c8701a',
      items: (g, D) => [[-1, 0.95], [0, 0.95], [1, 0.95], [-0.5, 1.65], [0.5, 1.65]].forEach(([x, y]) => {
        for (let k = 0; k < 4; k++) g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.05, 16), M('#ffcf4a', { metalness: 0.7, roughness: 0.3 })), x, y + k * 0.055, -D / 2 + 0.32));
      }) },
  ];
  for (const s of shops) {
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
    if (s.id === 'haustiere') {
      // Gehege mit Haustieren vor dem Hof
      for (let i = 0; i < 3; i++) {
        const p = pet(['#c98a4b', '#a3a3ad', '#ffd23f'][i]);
        p.position.set(-1 + i, 0, 2.2);
        house.add(p);
      }
    }
    placeAt(house, deg(s.a), shopRing, 2.3);
    house.userData.area = s.id;
    addArea(s.id, s.name, ...polar(deg(s.a), shopRing - 1.6));
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
    const boards = [['Meiste Taler', '#ffd76a', 'taler'], ['Münzen gesammelt', '#7ad0ff', 'coins'], ['Wiedergeburten', '#ff8ac8', 'rebirths']];
    boards.forEach(([t, c, k], i) => {
      const o = placeAt(leaderboard(t, c, rankRows(k, rand)), deg(292 + i * 25), 7.8, 1.6);
      o.userData.area = 'ranglisten';
    });
    addArea('ranglisten', 'Ranglisten', ...polar(deg(317), 6.2));
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
    const o = placeAt(lib, deg(245), 7.8, 2.2);
    o.userData.area = 'index';
    addArea('index', 'Münzindex', ...polar(deg(245), 6.4));
  }

  // ── Belohnung, Codes, Gruppen-Belohnung ──
  {
    const ch = new THREE.Group();
    ch.add(at(new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.15, 0.4, 8), M('#4a4458')), 0, 0.2, 0));
    const c = chest(anims);
    c.position.y = 0.4;
    c.scale.setScalar(1.4);
    ch.add(c);
    const s1 = signBoard('Tägliche Belohnung', { w: 2.6, h: 0.6, bg: '#e0a030', fg: '#ffffff', sub: 'Jeden Tag ein Geschenk' });
    s1.position.set(0, 2.2, 0);
    ch.add(s1);
    placeAt(ch, deg(20), 12.6, 1.5).userData.area = 'belohnung';
    addArea('belohnung', 'Tägliche Belohnung', ...polar(deg(20), 11.2));
    placeAt(codesTerminal(anims), deg(150), 12.8, 0.8).userData.area = 'codes';
    addArea('codes', 'Codes', ...polar(deg(150), 11.6));
    const grp = new THREE.Group();
    grp.add(at(new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 0.9), M('#3a7be0')), 0, 0.45, 0));
    grp.add(at(new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 1.0), M('#ffd76a', { metalness: 0.6 })), 0, 0.95, 0));
    const s2 = signBoard('Gruppe', { w: 1.8, h: 0.55, bg: '#3a7be0', fg: '#ffffff', sub: 'Beitreten = Bonus' });
    s2.position.set(0, 1.7, 0);
    grp.add(s2);
    placeAt(grp, deg(112), 12.8, 1.0).userData.area = 'gruppe';
    addArea('gruppe', 'Gruppen-Belohnung', ...polar(deg(112), 11.5));
  }

  // ── Portal-Hallen je Planet ──
  const byPlanet = {};
  for (const p of ctx.portals || []) (byPlanet[p.world.planet] ??= []).push(p);
  const hall = (planetId, d, build) => {
    const a = deg(d), [cx, cz] = polar(a, 12.0);
    const g = new THREE.Group();
    build(g);
    // Portale im Halbkreis hinter der Mitte, Blick zur Hallenmitte
    const list = byPlanet[planetId] || [];
    if (planetId === 'p3') list.push(...(byPlanet.p4 || []));
    list.forEach(({ world, color }, i) => {
      const spread = Math.min(deg(170), deg(28) * (list.length - 1));
      const t = list.length > 1 ? -spread / 2 + (i / (list.length - 1)) * spread : 0;
      const pa = portalArch(world, color, anims, rand);
      pa.scale.setScalar(0.72);
      const px = Math.sin(t) * 2.8, pz = -Math.cos(t) * 2.8 + 0.3;
      pa.position.set(px, 0, pz);
      pa.lookAt(0, 0, 0.6);
      g.add(pa);
    });
    reserve(cx, cz, 3.4);
    const o = put(g, cx, cz, { rot: false });
    o.lookAt(0, o.position.y, 0);
    o.userData.area = `portale-${planetId}`;
    return o;
  };
  // Heimat-Tor (Planet 1)
  hall('p1', 90, (g) => {
    const stone = M('#c8bea8');
    for (const s of [-1, 1]) {
      g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.8, 4, 0.8), stone), s * 3.4, 2, 1.6));
      g.add(at(new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.9, 4), M('#3f8a46')), s * 3.4, 4.45, 1.6));
    }
    g.add(at(new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.6, 0.8), stone), 0, 4.1, 1.6));
    const sg = signBoard('Heimatplanet', { w: 3.4, h: 0.7, bg: '#2f6a3a', fg: '#ffffff', sub: '7 Welten · mit Talern kaufen' });
    sg.position.set(0, 3.45, 2.05);
    g.add(sg);
    for (const s of [-1, 1]) {
      const b = flag('#5fd38d', 3.6);
      b.position.set(s * 2.6, 0, 1.6);
      g.add(b);
    }
    for (const [x, z] of [[-2.2, 0.8], [2.2, 0.8]]) g.add(at(roundTree(1.6, '#4f9a3f', rand), x, 0, z));
  });
  addArea('portale-p1', 'Heimat-Tor (Planet 1)', ...polar(deg(90), 9.4));
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
  addArea('portale-p2', 'Raketenstartplatz (Planet 2)', ...polar(deg(180), 9.4));
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
    for (const [x, z, c] of [[-2.0, 0.9, '#ff7a8a'], [2.0, 0.9, '#ffb05a']]) g.add(at(crystal(1.2, c, rand, 0.8), x, 0, z));
    const sg = signBoard('Tiefsee-Portal', { w: 3.0, h: 0.7, bg: '#0a4a6a', fg: '#9ff3f0', sub: 'Planet 3 · ab 3 Wiedergeburten' });
    sg.position.set(0, 0.9, 2.0);
    sg.rotation.x = -0.3;
    g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.9, 0.1), M('#4a4458')), 0, 0.45, 1.95));
    g.add(sg);
  });
  addArea('portale-p3', 'Tiefsee-Strudel (Planet 3)', ...polar(deg(270), 9.4));

  // ── Spielbereiche im äußeren Ring ──
  // Ei-Schlüpfplatz: alle sieben Eier auf Podesten
  {
    const g = new THREE.Group();
    const eggs = ['#ffd89a', '#b6ff6a', '#9ff0ff', '#fff4cf', '#b49cff', '#ff4058', '#ffe07a'];
    eggs.forEach((c, i) => {
      const t = (i - 3) * 0.42, x = Math.sin(t) * 2.2, z = -Math.cos(t) * 2.2 + 1.6;
      g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.5, 8), M('#4a4458')), x, 0.25, z));
      const e = eggIcon(c);
      e.scale.setScalar(0.85);
      e.position.set(x, 0.5, z);
      g.add(e);
      g.add(at(new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.04, 6, 24), E(c, 1.2)), x, 0.52, z)).children.at(-1).rotation.x = Math.PI / 2;
      const ph = i;
      anims.push((tt) => (e.rotation.y = tt * 0.5 + ph));
    });
    const sg = signBoard('Ei-Schlüpfplatz', { w: 2.8, h: 0.65, bg: '#c8801a', fg: '#ffffff', sub: 'Ei antippen & schlüpfen' });
    sg.position.set(0, 2.6, -0.4);
    g.add(sg);
    placeAt(g, deg(45), 12.6, 2.6).userData.area = 'schluepfen';
    addArea('schluepfen', 'Ei-Schlüpfplatz', ...polar(deg(45), 11.4));
  }
  // Glücksrad
  {
    const g = new THREE.Group();
    g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.6, 0.3), M('#4a4458')), 0, 1.3, -0.2));
    const wheel = new THREE.Group();
    wheel.position.set(0, 2.6, 0.05);
    const cols = ['#ff5aa5', '#ffe07a', '#5ad1ff', '#8cff7a', '#c48bff', '#ff8a3d', '#ffffff', '#ff4058'];
    for (let i = 0; i < 8; i++) {
      const seg = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.12, 6, 1, false, (i / 8) * TAU, TAU / 8), M(cols[i]));
      seg.rotation.x = Math.PI / 2;
      seg.userData.rbx = { skip: true };
      wheel.add(seg);
    }
    // für Roblox: Scheibe als Ganzes
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.48, 1.48, 0.1, 24), M('#ff8ac8'));
    disc.rotation.x = Math.PI / 2;
    disc.position.z = -0.04; // liegt hinter den Segmenten
    wheel.add(disc);
    wheel.add(at(new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.08, 8, 40), M('#ffd76a', { metalness: 0.7 })), 0, 0, 0.02));
    wheel.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.25, 16), M('#ffd76a', { metalness: 0.7 })), 0, 0, 0.08)).children.at(-1).rotation.x = Math.PI / 2;
    g.add(wheel);
    const pin = at(new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.4, 4), M('#e0433a')), 0, 4.25, 0.12);
    pin.rotation.z = Math.PI;
    g.add(pin);
    anims.push((t) => (wheel.rotation.z = t * 0.9 + Math.sin(t * 0.3) * 2));
    const sg = signBoard('Glücksrad', { w: 2.0, h: 0.55, bg: '#c8306a', fg: '#ffffff', sub: '1× täglich gratis' });
    sg.position.set(0, 0.8, 0.4);
    g.add(sg);
    placeAt(g, deg(135), 12.8, 1.8).userData.area = 'gluecksrad';
    addArea('gluecksrad', 'Glücksrad', ...polar(deg(135), 11.4));
  }
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
    placeAt(g, deg(225), 12.7, 2.3).userData.area = 'vip';
    addArea('vip', 'VIP-Lounge', ...polar(deg(225), 11.2));
  }
  // Quest-Brett
  {
    const g = new THREE.Group();
    for (const s of [-1, 1]) g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.2, 0.15), M('#6b4a2e')), s * 1.1, 1.1, 0));
    g.add(at(new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.4, 0.1), M('#8a5a3a')), 0, 1.5, 0));
    const notes = ['#fff6d0', '#d0f0ff', '#ffd0e0', '#e0ffd0', '#fff6d0'];
    notes.forEach((c, i) => g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.5, 0.02), M(c)), -0.85 + i * 0.42, 1.5 + (i % 2 ? 0.2 : -0.15), 0.07)));
    const sg = signBoard('Quests', { w: 1.6, h: 0.45, bg: '#6b4a2e', fg: '#ffe7a8', sub: 'Tagesaufgaben' });
    sg.position.set(0, 2.5, 0.05);
    g.add(sg);
    placeAt(g, deg(315), 12.9, 1.4).userData.area = 'quests';
    addArea('quests', 'Quest-Brett', ...polar(deg(315), 11.6));
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
    const sg = signBoard('Obby', { w: 1.6, h: 0.5, bg: '#2a2232', fg: '#8cff7a', sub: 'Oben wartet eine Truhe' });
    sg.position.set(0, 1.1, 1.6);
    g.add(sg);
    placeAt(g, 0, 12.4, 2.4).userData.area = 'obby';
    addArea('obby', 'Obby-Turm', ...polar(0, 10.6));
  }

  // ── Leben: Spaziergänger mit Haustieren, Münzregen, Feuerwerk ──
  const walkers = [];
  for (let i = 0; i < 8; i++) {
    const n = npc(['#e0433a', '#3a8fd1', '#5fd38d', '#ffb02e', '#b07bff', '#ff8ac8', '#2aa860', '#7a5ad8'][i]);
    n.userData.rbx = { skip: true };
    const pt = pet(['#c98a4b', '#f7f9fc', '#e8752a', '#9a4e22'][i % 4]);
    pt.userData.rbx = { skip: true };
    root.add(n, pt);
    walkers.push({ n, pt, r: i % 2 ? 4.5 : 10.2, sp: (0.07 + rand() * 0.05) * (i % 3 ? 1 : -1), ph: rand() * TAU });
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
  for (let i = 0; i < 24; i++) {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.04, 14), coinM);
    c.userData.rbx = { skip: true };
    root.add(c);
    rain.push([c, rand() * TAU, 1 + rand() * 4, rand(), 0.5 + rand() * 0.5]);
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
  const fw = [], FWN = 5, FWP = 60;
  for (let f = 0; f < FWN; f++) {
    const pos = new Float32Array(FWP * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ size: 0.35, map: dotTex(), color: ['#ff5aa5', '#ffe07a', '#5ad1ff', '#8cff7a', '#c48bff'][f], transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
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
        const a = rand() * TAU, r = 2 + rand() * 8;
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

  // ── Grün ──
  scatter(12, () => roundTree(rr(1.3, 2.0), ['#4f9a3f', '#5fae4f'][Math.floor(rand() * 2)], rand), 0.9, 11, 13.4);
  scatter(24, () => bush(rr(0.25, 0.4), '#4a9a44', rand), 0.35, 5.6, 13.4);
  scatter(60, () => flower(['#ff7a9a', '#ffe25f', '#ffffff', '#b07bff'][Math.floor(rand() * 4)]), 0.2, 5.6, 13.4);
}
