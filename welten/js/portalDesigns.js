// Portale im Spawn (Werkstatt-Wunsch „jedes Portal verbessern, eigenes Design mit Portalanimation“):
// je Welt ein eigenes Tor mit Strudel und eigener Animation. Gemeinsam für alle:
//   - Portalscheibe „Portal_<welt>“ (Ellipse, Mitte 1,55 über dem Boden, 2 breit, 2,9 hoch): das Teil, das im Spiel
//     den Teleport auslöst; davor ein drehender Strudel aus Lichtbögen und ein pulsierender Leuchtrand
//   - Schild mit Name und Preis oben
//   - Kette mit Schloss (wird im Spiel nur gezeigt, solange die Welt nicht gekauft ist; dann ist das Tor grau)
//   - Partikel der Welt (Blüten, Schnee, Funken, Blasen …)
//
// Animationen: anim(obj, art, {speed, amp, axis}) bewegt das Objekt auf der Webseite (three.js) und kennzeichnet es für
// den Export (userData.pfx). worldParts.js schreibt daraus Teilenamen „PFX:<welt>:<art>:…“, die das Luau-Modul
// PortalFx (roblox/js/portalFxLuau.js) in Roblox und in der Werkstatt-Vorschau bewegt. Arten:
//   spin  dreht sich um die eigene Achse (axis, lokal)      sway  schwingt hin und her (amp = Winkel)
//   bob   schwebt auf und ab (amp = Höhe)                   pulse Durchsichtigkeit pulsiert (amp = Stärke)
//   seq   Licht an/aus der Reihe nach (amp = Versatz)
//
//   const g = portalDesign(world, planetColor, anims, rand, K);  // K: Bausteine aus worldFactory.js

import * as THREE from 'three';
import { galaxyOfWorld } from './worlds.js';

const TAU = Math.PI * 2;
const DISC_Y = 1.55, DISC_SY = 1.45;

export function portalDesign(world, planetColor, anims, rand, K) {
  const { M, E, at, signBoard } = K;
  const g = new THREE.Group();
  g.userData.portalOf = world.id;
  const id = world.id;
  const emit = (g.userData.emit = []);

  // ── kleine Bausteine ──
  const add = (mesh, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, parent = g) => {
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    parent.add(mesh);
    return mesh;
  };
  const box = (w, h, d, m, x, y, z, rx, ry, rz, p) => add(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m), x, y, z, rx, ry, rz, p);
  // kleine, verjüngte Zylinder (Tentakel, Laternendeckel, Finger) mit mehr Ecken: in Roblox dann wenige gestufte
  // Zylinder statt vieler Keilflächen
  const cyl = (rt, rb, h, m, x, y, z, seg = 12, rx, ry, rz, p) =>
    add(new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, Math.max(rt, rb) < 0.15 && Math.abs(rt - rb) > 0.003 ? 16 : seg), m), x, y, z, rx, ry, rz, p);
  const sph = (r, m, x, y, z, p, seg = 12) => add(new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.max(6, seg * 0.6 | 0)), m), x, y, z, 0, 0, 0, p);
  const cone = (r, h, m, x, y, z, seg = 8, rx, ry, rz, p) => add(new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), m), x, y, z, rx, ry, rz, p);
  const tor = (R, r, m, x, y, z, arc = TAU, seg = 16, rx, ry, rz, p) => {
    const t = add(new THREE.Mesh(new THREE.TorusGeometry(R, r, 6, seg, arc), m), x, y, z, rx, ry, rz, p);
    t.userData.rbx = { segs: Math.max(4, Math.min(seg, 20)) }; // so viele Stücke auch in Roblox
    return t;
  };
  const oct = (r, m, x, y, z, sx = 1, sy = 1, sz = 1, p) => {
    const o = add(new THREE.Mesh(new THREE.OctahedronGeometry(r, 0), m), x, y, z, 0, 0, 0, p);
    o.scale.set(sx, sy, sz);
    if (r >= 0.1) o.userData.rbx = { facets: true }; // kleine Splitter als Kugel (weniger Teile)
    return o;
  };
  const grp = (x = 0, y = 0, z = 0, p = g) => {
    const o = new THREE.Group();
    o.position.set(x, y, z);
    p.add(o);
    return o;
  };
  // Werkstatt-Wunsch „Details deutlich verbessern“: echte Roblox-Materialien (Holz, Marmor, Metall, Eis …)
  const T = (m, rbx) => ((m.userData.rbxMaterial = rbx), m);
  const mat = {
    wood: (c = '#8a5a32') => T(M(c, { roughness: 0.9 }), 'Wood'),
    planks: (c = '#7a5030') => T(M(c, { roughness: 0.9 }), 'WoodPlanks'),
    marble: (c = '#eef0f2') => T(M(c, { roughness: 0.4 }), 'Marble'),
    stone: (c = '#8a8494') => T(M(c), 'Slate'),
    rock: (c = '#6a6474') => T(M(c), 'Rock'),
    basalt: (c = '#2a2224') => T(M(c), 'Basalt'),
    granite: (c = '#9a94a0') => T(M(c), 'Granite'),
    metal: (c = '#8a8f9a') => T(M(c, { metalness: 0.65, roughness: 0.35 }), 'Metal'),
    plate: (c = '#c8ccd4') => T(M(c, { metalness: 0.55, roughness: 0.4 }), 'DiamondPlate'),
    gold: (c = '#ffcf4a') => T(M(c, { metalness: 0.75, roughness: 0.28, emissive: '#b8860b', emissiveIntensity: 0.25 }), 'Foil'),
    ice: (c = '#bfeeff', op = 0.85) => T(E(c, 0.3, { transparent: true, opacity: op, roughness: 0.1 }), 'Ice'),
    glass: (c = '#e8fdff', op = 0.8, glow = 0.45) => T(E(c, glow, { transparent: true, opacity: op, roughness: 0.05 }), 'Glass'),
    sand: (c = '#e0c890') => T(M(c), 'Sand'),
    snow: (c = '#f4faff') => T(M(c), 'Snow'),
    concrete: (c = '#c8ccd4') => T(M(c), 'Concrete'),
    pebble: (c = '#c8b8a0') => T(M(c), 'Pebble'),
    brick: (c = '#b85a3a') => T(M(c), 'Brick'),
    fabric: (c = '#ffffff') => T(M(c, { roughness: 1 }), 'Fabric'),
    plastic: (c) => M(c, { roughness: 0.35 }),
  };
  // Säule mit Sockel und Kapitell (Kanten und Zierleisten): eckig (Kasten) oder rund
  const pillar = (x, h, w, m, trimM = m, { z = 0, round = false, y0 = 0, seg = 12 } = {}) => {
    const b = round ? cyl(w * 0.62, w * 0.62, 0.12, trimM, x, y0 + 0.06, z, seg) : box(w * 1.3, 0.12, w * 1.3, trimM, x, y0 + 0.06, z);
    if (round) cyl(w * 0.56, w * 0.56, 0.08, trimM, x, y0 + 0.16, z, seg);
    else box(w * 1.15, 0.08, w * 1.15, trimM, x, y0 + 0.16, z);
    const shaft = round ? cyl(w * 0.45, w * 0.5, h - 0.44, m, x, y0 + 0.2 + (h - 0.44) / 2, z, seg) : box(w, h - 0.44, w, m, x, y0 + 0.2 + (h - 0.44) / 2, z);
    if (round) {
      cyl(w * 0.56, w * 0.5, 0.1, trimM, x, y0 + h - 0.19, z, seg);
      cyl(w * 0.62, w * 0.62, 0.12, trimM, x, y0 + h - 0.06, z, seg);
    } else {
      box(w * 1.15, 0.1, w * 1.15, trimM, x, y0 + h - 0.19, z);
      box(w * 1.3, 0.12, w * 1.3, trimM, x, y0 + h - 0.06, z);
    }
    return shaft || b;
  };
  // Animation auf der Webseite und Kennzeichen für den Export
  const anim = (obj, type, { speed = 1, amp = 0, axis = [0, 0, 1] } = {}) => {
    obj.userData.pfx = { id, type, speed, amp, axis };
    const q0 = obj.quaternion.clone(), p0 = obj.position.clone(), ax = new THREE.Vector3(...axis).normalize(), q = new THREE.Quaternion();
    const mats = [];
    if (type === 'pulse' || type === 'seq')
      obj.traverse((o) => {
        if (!o.isMesh) return;
        o.material = o.material.clone();
        o.material.transparent = true;
        mats.push([o.material, o.material.opacity, o.material.emissiveIntensity]);
      });
    const ph = rand() * TAU;
    anims.push((t) => {
      if (type === 'spin') obj.quaternion.copy(q0).multiply(q.setFromAxisAngle(ax, t * speed));
      else if (type === 'sway') obj.quaternion.copy(q0).multiply(q.setFromAxisAngle(ax, Math.sin(t * speed + ph) * amp));
      else if (type === 'bob') obj.position.y = p0.y + Math.sin(t * speed + ph) * amp;
      else if (type === 'pulse') for (const [m, o0] of mats) m.opacity = o0 * (1 - amp * (0.5 + 0.5 * Math.sin(t * speed + ph)));
      else if (type === 'seq') {
        const on = Math.min(1, Math.max(0, Math.sin(t * speed - amp) * 2.5 + 0.5)), f = on * on * (3 - 2 * on);
        for (const [m, , e0] of mats) m.emissiveIntensity = e0 * (0.15 + 0.85 * f);
      }
    });
    return obj;
  };
  const particles = (spec, x, y, z) => {
    const marker = grp(x, y, z);
    emit.push({ marker, spec: { keep: true, direction: 'Top', spread: [25, 25], lightEmission: 1, ...spec } });
  };

  // ── Portalscheibe, Strudel, Leuchtrand ──
  const disc = ({ color, swirl = '#ffffff', swirl2, rim = color, speed = 1.2, opacity = 0.8, intensity = 0.9 } = {}) => {
    const d = at(new THREE.Mesh(new THREE.CircleGeometry(1.0, 32), E(color, intensity, { transparent: true, opacity, side: THREE.DoubleSide })), 0, DISC_Y, 0);
    d.scale.y = DISC_SY;
    d.userData.rbx = { name: `Portal_${id}` };
    g.add(d);
    // heller Kern: das Portal leuchtet zur Mitte hin stärker (Tiefenwirkung)
    const core = at(new THREE.Mesh(new THREE.CircleGeometry(0.55, 24), E(swirl2 || swirl, intensity * 1.2, { transparent: true, opacity: 0.35, side: THREE.DoubleSide })), 0, DISC_Y, 0.015);
    core.scale.y = DISC_SY;
    core.userData.rbx = { noCollide: true };
    g.add(core);
    // Strudel: drei Lichtbögen mit dickem Kopf und dünnem Schweif, die sich drehen (rund, damit die Drehung in Roblox
    // gleich aussieht)
    const sw = grp(0, DISC_Y, 0.04);
    [[0.32, 0], [0.58, 2.1], [0.84, 4.2]].forEach(([r, a], i) => {
      const c = i === 1 && swirl2 ? swirl2 : swirl;
      tor(r, 0.06, E(c, 1.3, { transparent: true, opacity: 0.85 }), 0, 0, 0, Math.PI * 0.45, 4, 0, 0, a + Math.PI * 0.65, sw);
      tor(r, 0.035, E(c, 1.1, { transparent: true, opacity: 0.6 }), 0, 0, 0, Math.PI * 0.7, i === 0 ? 4 : 5, 0, 0, a, sw);
    });
    anim(sw, 'spin', { speed, axis: [0, 0, 1] });
    // innerer Gegenstrudel, kleiner und schneller
    const sw2 = grp(0, DISC_Y, 0.06);
    tor(0.2, 0.035, E(swirl2 || swirl, 1.4, { transparent: true, opacity: 0.8 }), 0, 0, 0, Math.PI * 1.3, 4, 0, 0, 0, sw2);
    anim(sw2, 'spin', { speed: -speed * 1.5, axis: [0, 0, 1] });
    // Rand: dunklere Fassung außen, darin ein pulsierender Leuchtring
    const frame = tor(1.0, 0.06, M(new THREE.Color(rim).multiplyScalar(0.55).getStyle(), { roughness: 0.5 }), 0, DISC_Y, -0.01, TAU, 20);
    frame.scale.y = DISC_SY;
    const rm = tor(0.97, 0.04, E(rim, 1.6, { transparent: true, opacity: 0.9 }), 0, DISC_Y, 0.03, TAU, 14);
    rm.scale.y = DISC_SY;
    anim(rm, 'pulse', { speed: 1.8, amp: 0.5 });
    chaseLater = rim;
    return d;
  };
  let chaseLater = null;
  // Kette mit Schloss vor dem Tor (PortalFx zeigt sie nur bei gesperrten Welten)
  const lock = () => {
    const lk = grp(0, 0, 0.16);
    const chain = M('#8a8f9a', { metalness: 0.7, roughness: 0.35 });
    for (const s of [-1, 1]) cyl(0.05, 0.05, 2.6, chain, 0, DISC_Y, 0, 6, 0, 0, s * 0.62, lk);
    box(0.42, 0.36, 0.14, M('#d8b040', { metalness: 0.7, roughness: 0.3 }), 0, DISC_Y - 0.1, 0.06, 0, 0, 0, lk);
    tor(0.13, 0.045, chain, 0, DISC_Y + 0.08, 0.06, Math.PI, 8, 0, 0, 0, lk);
    cyl(0.05, 0.05, 0.03, M('#3a3020'), 0, DISC_Y - 0.12, 0.14, 8, Math.PI / 2, 0, 0, lk); // Schlüsselloch
    lk.userData.pfx = { id, type: 'lock', speed: 0, amp: 0, axis: [0, 0, 1] };
  };
  // Schild mit Name und Preis im Stil der Welt (Werkstatt-Wunsch „Schild mit dem Preis bei jedem anpassen“):
  // Tafel mit Schrift (signBoard), Rahmen, Halterung und Verzierung. st:
  //   w, h, font            Größe und Schrift der Tafel
  //   frame, frameT         Material und Stärke des Rahmens (ohne: kein Rahmen)
  //   inner                 dünne Innenleiste (Material, z. B. Glut, Neon)
  //   mount                 'posts' (Pfosten bis drop), 'chains' (Ketten nach oben bis top), 'holo' (Projektor darunter)
  //   deco                  Liste: corners, rivets, moss, icicles, snow, drips, sprinkles, runes, shells, pearls, algae,
  //                         clouds, scroll, laurel, rainbow, facets, hazard, lamps, emblemPlanet, emblemSun, vines,
  //                         tassels, barnacles, glyphs, logs
  //   tilt                  leicht schief (Minenbrett)
  const sign = (y = 4.3, bg = '#1e1a26', fg = world.accent, st = {}) => {
    const g2 = galaxyOfWorld(world).id === 'g2';
    const price = world.soon ? 'Bald' : world.price ? `${fmtShort(world.price)} ${g2 ? 'Staub' : 'Moneten'}` : 'Gratis';
    const w = st.w || 2.3, h = st.h || 0.62;
    // Werkstatt-Wunsch „Schilder auf Spielerhöhe am Rahmen“: rechts am Rahmen (vom Spieler aus gesehen), Mitte etwa auf
    // Augenhöhe einer Roblox-Figur, kleiner als früher, damit es das Portal nicht verdeckt. st.x/st.z/st.hy verschieben.
    void y;
    const sc = st.scale ?? 0.55, hy = st.hy ?? 0.55;
    const sg = grp(st.x ?? 1.3, hy, st.z ?? 0.4);
    sg.scale.setScalar(sc);
    const ground = hy / sc - h / 2; // Abstand Tafelunterkante bis Boden (in Schild-Einheiten)
    if (st.tilt) sg.rotation.z = st.tilt;
    const plate = signBoard(world.soon ? 'Coming soon' : world.name, { w, h, bg, fg, sub: price, ...(st.font ? { font: st.font } : {}) });
    sg.add(plate);
    const ft = st.frameT || 0.08, fd = 0.12;
    if (st.frame) {
      box(w + ft * 2, ft, fd, st.frame, 0, h / 2 + ft / 2, 0, 0, 0, 0, sg);
      box(w + ft * 2, ft, fd, st.frame, 0, -h / 2 - ft / 2, 0, 0, 0, 0, sg);
      for (const sx of [-1, 1]) box(ft, h, fd, st.frame, sx * (w / 2 + ft / 2), 0, 0, 0, 0, 0, sg);
    }
    if (st.inner) {
      box(w, 0.02, 0.07, st.inner, 0, h / 2 - 0.01, 0.01, 0, 0, 0, sg);
      box(w, 0.02, 0.07, st.inner, 0, -h / 2 + 0.01, 0.01, 0, 0, 0, sg);
    }
    const back = box(w + ft * 2 - 0.02, h + ft * 2 - 0.02, 0.04, st.frame || M(bg), 0, 0, -0.05, 0, 0, 0, sg); // Rückwand
    void back;
    const X = w / 2 + ft, Y = h / 2 + ft, deco = new Set(st.deco || []), c2 = st.accent || fg;
    // Halterung
    const holdM = st.postM || st.frame || M('#4a4458');
    if (st.mount === 'posts') {
      // zwei kurze Pfosten bis zum Boden
      for (const sx of [-1, 1]) cyl(0.04, 0.05, ground, holdM, sx * (w * 0.36), -h / 2 - ground / 2, -0.02, 8, 0, 0, 0, sg);
    } else if (st.mount === 'holo') {
      // Projektor am Boden, Lichtkegel bis zur Tafel
      cyl(0.22, 0.28, 0.12, mat.metal('#3a4a5a'), 0, -h / 2 - ground + 0.06, 0, 12, 0, 0, 0, sg);
      const ring = tor(0.2, 0.025, E(c2, 1.6), 0, -h / 2 - ground + 0.13, 0, TAU, 10, Math.PI / 2, 0, 0, sg);
      anim(ring, 'pulse', { speed: 3, amp: 0.5 });
      const beam = cyl(w * 0.4, 0.18, Math.max(0.1, ground - 0.14), E(c2, 0.6, { transparent: true, opacity: 0.25 }), 0, -h / 2 - ground / 2 + 0.07, 0, 12, 0, 0, 0, sg);
      anim(beam, 'pulse', { speed: 2.2, amp: 0.35 });
    } else {
      // hängt an zwei Ketten an einem Haken-Arm, der vom Rahmen kommt
      const chainM = st.mount === 'chains' && st.postM ? st.postM : M('#8a8f9a', { metalness: 0.7 });
      box(w * 0.9, 0.06, 0.06, holdM, 0, h / 2 + 0.42, -0.16, 0, 0, 0, sg);
      box(0.06, 0.06, 0.6, holdM, 0, h / 2 + 0.42, -0.42, 0, 0, 0, sg); // Arm zum Rahmen
      for (const sx of [-1, 1]) for (let k = 0; k < 4; k++) tor(0.04, 0.012, chainM, sx * (w * 0.38), h / 2 + 0.06 + k * 0.09, -0.08 - k * 0.02, TAU, 5, 0, k % 2 ? Math.PI / 2 : 0, 0, sg);
    }
    // Verzierungen
    const corners = [[-X, Y], [X, Y], [-X, -Y], [X, -Y]];
    if (deco.has('corners')) for (const [cx, cy] of corners) oct(0.1, st.cornerM || mat.glass(c2, 0.9, 0.8), cx, cy, 0.05, 0.8, 1.2, 0.8, sg);
    if (deco.has('rivets')) for (const [cx, cy] of corners) sph(0.03, st.rivetM || mat.metal('#5a5a62'), cx * 0.97, cy * 0.9, 0.07, sg, 6);
    if (deco.has('moss')) for (let k = 0; k < 7; k++) sph(0.07 + rand() * 0.05, M(['#3f8a3f', '#5aa84a', '#2f6f34'][k % 3]), -X + (k + 0.5) * (2 * X / 7), Y + 0.02, 0.02, sg, 8).scale.y = 0.6;
    if (deco.has('vines')) for (const sx of [-1, 1]) for (let k = 0; k < 4; k++) sph(0.05, M('#4a9a3f'), sx * (X + 0.02), Y - k * (h / 3), 0.06, sg, 6);
    if (deco.has('snow')) { box(w + ft * 2 + 0.04, 0.08, fd + 0.06, mat.snow('#ffffff'), 0, Y + 0.04, 0, 0, 0, 0, sg); for (const sx of [-1, 0, 1]) sph(0.08, mat.snow('#ffffff'), sx * w * 0.35, Y + 0.08, 0.02, sg, 8).scale.y = 0.5; }
    if (deco.has('icicles')) for (let k = 0; k < 9; k++) cone(0.035, 0.12 + (k % 3) * 0.07, mat.ice('#d8f4ff', 0.85), -X + (k + 0.5) * (2 * X / 9), -Y - 0.08 - (k % 3) * 0.035, 0.03, 6, Math.PI, 0, 0, sg);
    if (deco.has('drips')) for (let k = 0; k < 8; k++) { const dx = -X + (k + 0.5) * (2 * X / 8); box(2 * X / 8 + 0.01, 0.06, fd + 0.03, M('#fff0f8', { roughness: 0.3 }), dx, Y + 0.02, 0.01, 0, 0, 0, sg); sph(0.035, M('#fff0f8', { roughness: 0.3 }), dx, Y - 0.04 - (k % 3) * 0.03, 0.065, sg, 6).scale.y = 1.5; }
    if (deco.has('sprinkles')) for (let k = 0; k < 14; k++) box(0.05, 0.015, 0.015, M(['#ff5fb0', '#5fd3ff', '#ffe25f', '#7aff8a'][k % 4]), -X + rand() * 2 * X, (rand() < 0.5 ? 1 : -1) * (Y - ft / 2), 0.065, 0, 0, rand() * 3, sg);
    if (deco.has('runes')) for (let k = 0; k < 6; k++) { const r = box(0.07, 0.07, 0.02, E(c2, 1.8), -X * 0.8 + k * (X * 1.6 / 5), -Y + ft / 2, 0.065, 0, 0, 0.785, sg); anim(r, 'seq', { speed: 1.6, amp: k * 0.9 }); }
    if (deco.has('glyphs')) for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU, r = sph(0.03, E(c2, 2), Math.cos(a) * (X + 0.08), Math.sin(a) * (Y + 0.08), 0.03, sg, 6); anim(r, 'seq', { speed: 2.2, amp: k * 0.8 }); }
    if (deco.has('shells')) for (const [cx, cy] of corners) { const sh = cyl(0.08, 0.08, 0.03, mat.marble('#ffd8ec'), cx, cy, 0.07, 10, Math.PI / 2, 0, 0, sg); sh.scale.set(1, 1, 0.8); }
    if (deco.has('barnacles')) for (let k = 0; k < 6; k++) cyl(0.025, 0.035, 0.03, M('#c8c0b0'), -X + rand() * 2 * X, (rand() < 0.5 ? 1 : -1) * Y, 0.07, 6, Math.PI / 2, 0, 0, sg);
    if (deco.has('pearls')) { const n = 16; for (let k = 0; k < n; k++) { const u = k / n, t2 = u * 4, side = Math.floor(t2), f = t2 - side; const [px, py] = side === 0 ? [-X + f * 2 * X, Y] : side === 1 ? [X, Y - f * 2 * Y] : side === 2 ? [X - f * 2 * X, -Y] : [-X, -Y + f * 2 * Y]; sph(0.04, M('#fff8fc', { roughness: 0.15 }), px, py, 0.07, sg, 8); } }
    if (deco.has('algae')) for (let k = 0; k < 6; k++) { const a = sph(0.04, E('#5affd8', 1.6), -X + rand() * 2 * X, (rand() < 0.5 ? 1 : -1) * Y, 0.07, sg, 6); anim(a, 'pulse', { speed: 1.5 + rand(), amp: 0.6 }); }
    if (deco.has('clouds')) for (const [cx, cy, r] of [[-X - 0.1, -Y + 0.05, 0.22], [X + 0.1, -Y + 0.05, 0.22], [-X * 0.5, -Y - 0.08, 0.2], [X * 0.5, -Y - 0.08, 0.2], [0, -Y - 0.12, 0.22]]) sph(r, M('#ffffff', { roughness: 1 }), cx, cy, -0.06, sg, 10);
    if (deco.has('scroll')) for (const sx of [-1, 1]) { cyl(0.09, 0.09, h + 0.1, st.frame || M('#e8d8b0'), sx * (w / 2 + 0.05), 0, 0.02, 12, 0, 0, 0, sg); for (const sy of [-1, 1]) sph(0.06, mat.gold('#ffcf4a'), sx * (w / 2 + 0.05), sy * (h / 2 + 0.08), 0.02, sg, 8); }
    if (deco.has('laurel')) for (const sx of [-1, 1]) for (let k = 0; k < 5; k++) { const lf = sph(0.07, M('#7a9a3a'), sx * (X + 0.08 + Math.sin(k * 0.6) * 0.05), -Y + 0.05 + k * (2 * Y / 5), 0.03, sg, 6); lf.scale.set(0.6, 1.4, 0.4); lf.rotation.z = sx * -0.5; }
    if (deco.has('rainbow')) ['#ff5a5a', '#ffb02e', '#ffe25f', '#5aff8a', '#5ad1ff', '#b07bff'].forEach((c, k) => box(w + ft * 2 - k * 0.04, 0.025, fd + 0.01, E(c, 0.8), 0, Y + 0.015 + k * 0.025, 0, 0, 0, 0, sg));
    if (deco.has('facets')) for (let k = 0; k < 10; k++) oct(0.05, mat.glass('#e8fdff', 0.8, 0.6), -X + (k + 0.5) * (2 * X / 10), Y, 0.05, 1, 1, 1, sg);
    if (deco.has('hazard')) for (let k = 0; k < 12; k++) box(2 * X / 12 + 0.002, ft, fd + 0.01, M(k % 2 ? '#1a1a1a' : '#ffd23a'), -X + (k + 0.5) * (2 * X / 12), -Y + ft / 2 - 0.0, 0.005, 0, 0, 0, sg);
    if (deco.has('lamps')) for (const sx of [-1, 1]) { const l = sph(0.05, E(st.lampC || '#ff3a1a', 2), sx * X, Y + 0.06, 0.03, sg, 8); anim(l, 'seq', { speed: 3, amp: sx > 0 ? 0 : Math.PI }); }
    if (deco.has('emblemPlanet')) { sph(0.12, M('#e8c890'), 0, Y + 0.14, 0.02, sg, 12); tor(0.2, 0.02, mat.gold('#c8a060'), 0, Y + 0.14, 0.02, TAU, 12, Math.PI / 2 - 0.3, 0, 0, sg); }
    if (deco.has('emblemSun')) { sph(0.11, E('#ffcf4a', 1.2), 0, Y + 0.08, 0.02, sg, 10); for (let k = 0; k < 7; k++) { const a = (k / 6) * Math.PI; box(0.04, 0.12, 0.02, mat.gold('#ffcf4a'), Math.cos(a) * 0.2, Y + 0.08 + Math.sin(a) * 0.2, 0.02, 0, 0, a - Math.PI / 2, sg); } }
    if (deco.has('tassels')) for (const sx of [-1, 1]) { cyl(0.01, 0.01, 0.3, M('#c8302a'), sx * X, -Y - 0.15, 0, 4, 0, 0, 0, sg); cyl(0.015, 0.035, 0.14, mat.gold('#e0b040'), sx * X, -Y - 0.36, 0, 6, 0, 0, 0, sg); }
    if (deco.has('logs')) { cyl(0.06, 0.06, w + 0.3, st.frame || mat.wood('#a08a6a'), 0, Y + 0.02, 0.02, 8, 0, 0, Math.PI / 2, sg); cyl(0.06, 0.06, w + 0.2, st.frame || mat.wood('#a08a6a'), 0.05, -Y - 0.02, 0.02, 8, 0, 0, Math.PI / 2 + 0.03, sg); }
    return sg;
  };
  // Lauflichter rund um den Portalrand (Werkstatt-Wunsch „jedes Portal nochmal verbessern, Animation“)
  const chase = (color, n = 10) => {
    for (let k = 0; k < n; k++) {
      const a = (k / n) * TAU + 0.15;
      const l = sph(0.045, E(color, 2), Math.cos(a) * 1.1, DISC_Y + Math.sin(a) * 1.1 * DISC_SY, 0.05, undefined, 8);
      anim(l, 'seq', { speed: 3.2, amp: k * (TAU / n) * 1.5 });
    }
  };

  const build = DESIGNS[id] || DESIGNS._default;
  build({ g, world, planetColor, rand, M, E, add, box, cyl, sph, cone, tor, oct, grp, anim, particles, disc, sign, mat, pillar, T });
  if (chaseLater) chase(chaseLater);
  lock();
  return g;
}

const fmtShort = (n) => {
  for (const [v, u] of [[1e12, ' Bio.'], [1e9, ' Mrd.'], [1e6, ' Mio.'], [1e3, 'K']]) if (n >= v) return (n / v).toLocaleString('de-DE', { maximumFractionDigits: 1 }) + u;
  return String(n);
};

// Bogen aus n Teilen entlang einer Ellipse um die Scheibe (für Kristall-, Korallen-, Muschelbögen)
function arcPoints(n, rx = 1.25, ry = 1.75, from = -0.1, to = Math.PI + 0.1) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = from + ((to - from) * i) / (n - 1);
    pts.push([Math.cos(a) * rx, DISC_Y + Math.sin(a) * ry, a]);
  }
  return pts;
}


// Werkstatt-Wunsch „Details jedes Portals deutlich verbessern“ (nur die vorhandenen Teile, nichts Neues): feinere
// Formen, passende Roblox-Materialien und Farbverläufe, Sockel, Kapitelle und Zierleisten, ruhigere Animationen.
const DESIGNS = {
  // Ersatz für Welten ohne eigenes Design
  _default({ disc, sign, pillar, tor, mat, planetColor, world }) {
    const stone = mat.stone('#4a4458'), trim = mat.metal(planetColor);
    for (const x of [-1.2, 1.2]) pillar(x, 2.4, 0.4, stone, trim);
    tor(1.2, 0.22, trim, 0, 2.4, 0, Math.PI, 14);
    disc({ color: world.accent });
    sign();
  },

  // ── Planet 1 ──
  // Holztor mit Windmühle: Pfosten mit Steinsockel und Kopfband, Querbalken mit Fase, Satteldach aus Schindeln,
  // Mühlenturm mit Kappe, Flügel als Gitter mit Segeltuch, Blumenkästen aus Brettern
  normal({ M, E, box, cyl, cone, grp, anim, disc, sign, particles, mat }) {
    const wood = mat.wood('#8a5a32'), dark = mat.wood('#5a3a20'), planks = mat.planks('#7a5030'), roof = mat.brick('#c8402e'), stone = mat.stone('#9a9488');
    for (const s of [-1, 1]) {
      box(0.5, 0.14, 0.5, stone, s * 1.25, 0.07, 0);
      box(0.42, 0.1, 0.42, stone, s * 1.25, 0.19, 0);
      box(0.3, 3.0, 0.3, wood, s * 1.25, 1.74, 0);
      box(0.34, 0.06, 0.34, dark, s * 1.25, 1.2, 0); // Eisenband
      box(0.34, 0.06, 0.34, dark, s * 1.25, 2.6, 0);
      box(0.1, 1.3, 0.1, dark, s * 1.0, 2.6, 0.02, 0, 0, s * 0.62); // Kopfband (Strebe zum Balken)
    }
    box(3.1, 0.26, 0.36, wood, 0, 3.24, 0);
    box(3.2, 0.06, 0.4, dark, 0, 3.39, 0); // Fase oben
    box(2.6, 0.1, 0.3, dark, 0, 3.05, 0.02);
    // Satteldach: zwei geneigte Schindelflächen und ein First
    for (const s of [-1, 1]) box(1.0, 0.07, 0.5, roof, s * 0.42, 3.62, 0, 0, 0, s * -0.55);
    box(0.08, 0.08, 0.52, dark, 0, 3.88, 0);
    // Mühlenturm mit Kappe
    cyl(0.17, 0.22, 0.7, mat.plastic('#efe6d0'), 0, 4.2, 0, 10);
    cone(0.24, 0.22, roof, 0, 4.66, 0, 10);
    const rotor = grp(0, 4.3, 0.26);
    for (let i = 0; i < 4; i++) {
      const arm = grp(0, 0, 0, rotor);
      arm.rotation.z = (i / 4) * TAU;
      box(0.06, 0.95, 0.04, dark, 0, 0.5, 0, 0, 0, 0, arm);
      // Flügelgitter mit Segeltuch
      box(0.26, 0.68, 0.02, mat.fabric('#f4ecd8'), 0.15, 0.6, 0.02, 0, 0, 0, arm);
      for (let k = 0; k < 4; k++) box(0.3, 0.025, 0.03, dark, 0.15, 0.3 + k * 0.2, 0.035, 0, 0, 0, arm);
      box(0.025, 0.7, 0.03, dark, 0.28, 0.6, 0.035, 0, 0, 0, arm);
    }
    cyl(0.07, 0.07, 0.14, dark, 0, 0, 0, 10, Math.PI / 2, 0, 0, rotor);
    anim(rotor, 'spin', { speed: 0.9, axis: [0, 0, 1] });
    // Blumenkästen aus Brettern mit Erde und Blüten
    for (const s of [-1, 1]) {
      box(0.62, 0.22, 0.3, planks, s * 1.25, 0.46, 0.32);
      box(0.56, 0.04, 0.24, mat.plastic('#5a3a24'), s * 1.25, 0.58, 0.32);
      for (let k = -1; k <= 1; k++) {
        cyl(0.012, 0.012, 0.1, M('#3f8a3f'), s * 1.25 + k * 0.18, 0.64, 0.32, 4);
        cyl(0.07, 0.05, 0.05, E(['#ff5a8a', '#ffd84a', '#ffffff'][k + 1], 0.4), s * 1.25 + k * 0.18, 0.7, 0.32, 8);
      }
    }
    // Torbogen-Ausbau: Querriegel mit Kreuzstreben zwischen den Pfosten, Firstbalken mit Zierbrettern
    for (const s of [-1, 1]) {
      box(0.06, 0.95, 0.06, mat.wood('#5a3a20'), s * 1.25, 0.75, 0.17, 0, 0, s * 0.35);
      box(0.08, 0.08, 0.36, mat.wood('#4a2e18'), s * 1.25, 3.05, 0);
      box(0.32, 0.05, 0.04, mat.wood('#4a2e18'), s * 0.75, 3.24, 0.19, 0, 0, s * 0.3);
    }
    cyl(0.03, 0.03, 0.4, mat.metal('#5a5a62'), 0, 3.95, 0.12, 8, Math.PI / 2, 0, 0); // Achse der Mühle
    disc({ color: '#8ad8ff', swirl: '#ffffff', swirl2: '#d8f4ff', rim: '#ffe28a', speed: 0.9 });
    sign(5.75, '#7a5030', '#fff0c8', { z: 0.55, frame: mat.wood('#4a2e18'), frameT: 0.09, mount: 'posts', drop: 3.42, postM: mat.wood('#5a3a20'), deco: ['rivets'], rivetM: mat.metal('#3a3a40') });
    particles({ name: 'PortalBlueten', colors: ['#ffd84a', '#ff8ac8', '#ffffff'], particleSize: 0.12, sizeEnd: 0.1, rate: 3, speed: [0.3, 0.6], lifetime: [3, 5], spread: [40, 40], size: [1.6, 0.2, 0.4], acceleration: [0, -0.05, 0.1] }, 0, 0.6, 0.4);
  },
  // Baumtor: Stämme mit Rinde (Wood) und verjüngten Wurzeln, Bogen als gewachsener Ast, Krone in drei Grüntönen,
  // Pilze mit Tupfen
  wald({ M, E, cyl, sph, cone, tor, grp, anim, disc, sign, particles, rand, mat }) {
    const bark = mat.wood('#6b4a2e'), bark2 = mat.wood('#5a3c24'), leaf = M('#3f8a3f'), leaf2 = M('#5aa84a'), leaf3 = M('#2f6f34');
    for (const s of [-1, 1]) {
      cyl(0.19, 0.3, 1.4, bark, s * 1.27, 0.7, 0, 10, 0, 0, s * -0.04);
      cyl(0.16, 0.2, 1.3, bark2, s * 1.22, 1.95, 0, 10, 0, 0, s * -0.1);
      // Wurzeln: verjüngte Kegel, flach ausgestreckt
      for (let k = 0; k < 4; k++) {
        const a = (k / 4) * TAU + 0.4;
        cone(0.1, 0.7, bark2, s * 1.27 + Math.cos(a) * 0.3, 0.12, Math.sin(a) * 0.3, 6, Math.sin(a) * 1.25, 0, -Math.cos(a) * 1.25);
      }
      // Pilz mit weißen Tupfen
      cyl(0.03, 0.045, 0.22, M('#f0e8d8'), s * 1.62, 0.11, 0.32, 8);
      sph(0.13, E('#e0433a', 0.25), s * 1.62, 0.24, 0.32, undefined, 12).scale.y = 0.55;
      for (const [dx, dz] of [[0.05, 0.06], [-0.06, 0.03], [0.01, -0.07]]) sph(0.022, M('#ffffff'), s * 1.62 + dx, 0.3, 0.32 + dz, undefined, 6);
    }
    tor(1.24, 0.17, bark, 0, 2.6, 0, Math.PI, 16);
    tor(1.24, 0.07, bark2, 0, 2.6, 0.12, Math.PI, 16); // Rindenwulst vorne
    // Blätterkrone in Schichten, wiegt sich leicht
    const crown = grp(0, 3.45, 0);
    for (let i = 0; i < 9; i++) {
      const a = (i / 8) * Math.PI;
      sph(0.5 + rand() * 0.18, [leaf, leaf2, leaf3][i % 3], Math.cos(a) * 1.4, Math.sin(a) * 0.55 - 0.2, -0.1 + (rand() - 0.5) * 0.3, crown, 12);
      sph(0.3, leaf2, Math.cos(a) * 1.25, Math.sin(a) * 0.6 - 0.05, 0.3, crown, 10);
    }
    anim(crown, 'sway', { speed: 0.7, amp: 0.04, axis: [0, 0, 1] });
    // Efeu rankt an den Stämmen hoch, Astansätze, Laub am Fuß
    for (const s of [-1, 1]) {
      for (let k = 0; k < 7; k++) sph(0.06 + (k % 2) * 0.02, M(['#3f8a3f', '#5aa84a'][k % 2]), s * (1.27 + Math.sin(k * 1.3) * 0.18), 0.4 + k * 0.33, 0.2 + Math.cos(k * 1.3) * 0.08, undefined, 8);
      cyl(0.04, 0.08, 0.5, mat.wood('#5a3c24'), s * 1.45, 2.0, 0, 8, 0, 0, s * -0.9);
      sph(0.14, M('#5aa84a'), s * 1.7, 2.18, 0, undefined, 10);
      for (let k = 0; k < 3; k++) sph(0.08, M(['#c8a040', '#a8682a', '#d8b050'][k]), s * (1.0 + k * 0.25), 0.04, 0.45 + (k % 2) * 0.1, undefined, 6).scale.y = 0.3;
    }
    disc({ color: '#4ac86a', swirl: '#c8ff8a', swirl2: '#8affc8', rim: '#d9ff7a', speed: 1.0 });
    sign(4.75, '#6b4a2e', '#f0ffd8', { z: 0.45, frame: mat.wood('#4a3020'), frameT: 0.1, deco: ['moss', 'vines'], w: 2.2 });
    particles({ name: 'PortalGluehwuermchen', colors: ['#e8ff7a', '#b4ffd6'], particleSize: 0.08, sizeEnd: 0.05, rate: 4, speed: [0.1, 0.3], lifetime: [3, 6], spread: [180, 180], size: [2.2, 2.4, 0.6] }, 0, 1.6, 0.3);
  },
  // U-Bahn-Eingang: gefliester Rahmen mit Metallkanten, Gesims, U-Schild mit Rahmen, Stufen mit gelben Kanten,
  // runde Geländer mit Pfosten, Lauflicht
  stadt({ M, E, box, cyl, grp, anim, disc, sign, particles, mat }) {
    const tile = mat.marble('#dfe3ea'), metal = mat.metal('#4a5060'), green = mat.metal('#2a8a5a'), step = mat.concrete('#9a9fa8');
    for (const s of [-1, 1]) {
      box(0.36, 2.9, 0.5, tile, s * 1.3, 1.55, 0);
      box(0.42, 0.1, 0.56, metal, s * 1.3, 0.05, 0); // Sockel
      box(0.06, 2.9, 0.06, metal, s * 1.12, 1.55, 0.25); // Kantenschutz
      box(0.06, 2.9, 0.06, metal, s * 1.48, 1.55, 0.25);
      // Geländer: Handlauf rund, zwei Pfosten
      cyl(0.03, 0.03, 1.25, metal, s * 1.15, 0.98, 0.66, 8, Math.PI / 2 - 0.45, 0, 0);
      for (const z of [0.15, 1.12]) cyl(0.025, 0.025, 0.95, metal, s * 1.15, 0.5 + (1.12 - z) * 0.42, z, 8);
    }
    box(3.0, 0.46, 0.5, green, 0, 3.24, 0);
    box(3.1, 0.06, 0.56, metal, 0, 3.0, 0); // Gesims unten
    box(3.1, 0.06, 0.56, metal, 0, 3.49, 0); // Gesims oben
    // U-Schild mit Rahmen
    box(0.62, 0.62, 0.08, metal, 0, 3.24, 0.26);
    box(0.54, 0.54, 0.1, E('#2a6ae8', 0.9), 0, 3.24, 0.28);
    box(0.1, 0.3, 0.04, E('#ffffff', 1), -0.1, 3.27, 0.34);
    box(0.1, 0.3, 0.04, E('#ffffff', 1), 0.1, 3.27, 0.34);
    box(0.3, 0.09, 0.04, E('#ffffff', 1), 0, 3.12, 0.34);
    // Stufen mit gelber Trittkante
    for (let k = 0; k < 4; k++) {
      box(2.3, 0.12, 0.3, step, 0, 0.42 - k * 0.12, 0.85 - k * 0.3);
      box(2.3, 0.02, 0.04, mat.plastic('#ffd23a'), 0, 0.485 - k * 0.12, 0.98 - k * 0.3);
    }
    // Lauflicht wie ein vorbeirasender Zug (weich der Reihe nach)
    for (let k = 0; k < 6; k++) {
      const l = box(0.28, 0.07, 0.05, E('#ffe27a', 1.8), -0.85 + k * 0.34, 2.78, 0.28);
      anim(l, 'seq', { speed: 6, amp: k * 0.8 });
    }
    // Bahnsteig-Ausbau: Pfeilerköpfe mit Leuchten, Gitter über dem Eingang, Bodenplatte mit Kante
    for (const s of [-1, 1]) {
      box(0.44, 0.12, 0.58, mat.metal('#3a4050'), s * 1.3, 3.06, 0);
      const lamp = cyl(0.06, 0.08, 0.1, E('#ffe27a', 1.6), s * 1.3, 2.86, 0.27, 10, Math.PI / 2, 0, 0);
      anim(lamp, 'pulse', { speed: 1.1, amp: 0.25 });
    }
    for (let k = 0; k < 9; k++) box(0.025, 0.4, 0.025, mat.metal('#4a5060'), -1.0 + k * 0.25, 3.24, -0.26);
    box(2.9, 0.04, 1.4, mat.concrete('#b8bcc4'), 0, 0.02, 0.55);
    disc({ color: '#5a6ae8', swirl: '#ff7ad8', swirl2: '#7ad0ff', rim: '#ffe27a', speed: 1.7 });
    sign(4.3, '#14181f', '#ffd84a', { x: 1.75, scale: 0.45, font: 'Barlow, system-ui, sans-serif', frame: mat.metal('#3a4050'), frameT: 0.07, inner: E('#ffd84a', 1.4), mount: 'posts', drop: 3.52, postM: mat.metal('#4a5060'), deco: ['lamps', 'rivets'], lampC: '#7ad0ff' });
    particles({ name: 'PortalStadtlicht', colors: ['#ff7ad8', '#7ad0ff', '#ffe27a'], particleSize: 0.07, sizeEnd: 0.03, rate: 5, speed: [0.6, 1.2], lifetime: [0.8, 1.4], spread: [60, 60], size: [1.6, 0.2, 0.2] }, 0, 0.3, 0.3);
  },
  // Eiskristall-Tor: Kristalle aus echtem Eis in zwei Tönen, Sockel aus Schnee mit Kante, Schneestern mit
  // Verästelungen
  eis({ E, box, cyl, oct, grp, anim, disc, sign, particles, rand, mat , sph, cone}) {
    const ice = mat.ice('#bfeeff', 0.86), ice2 = mat.ice('#e8fbff', 0.9), deep = mat.ice('#7ac8f0', 0.88);
    box(3.0, 0.2, 0.8, mat.snow('#eef6ff'), 0, 0.1, 0);
    box(3.1, 0.06, 0.86, mat.ice('#d8f2ff', 0.9), 0, 0.22, 0);
    arcPoints(11, 1.3, 1.85).forEach(([x, y, a], i) => {
      const c = oct(0.28 + rand() * 0.08, i % 3 === 0 ? deep : rand() < 0.5 ? ice : ice2, x, y, 0, 0.75, 1.9, 0.75);
      c.rotation.z = a - Math.PI / 2;
      oct(0.14, ice2, x * 1.12, y + 0.05, 0.12, 0.7, 1.6, 0.7).rotation.z = a - Math.PI / 2 + 0.4;
    });
    for (const s of [-1, 1]) {
      oct(0.42, ice, s * 1.52, 0.9, 0, 0.75, 2.4, 0.75).rotation.z = s * -0.18;
      oct(0.24, ice2, s * 1.66, 0.45, 0.2, 0.75, 1.6, 0.75).rotation.z = s * -0.48;
    }
    // Schneeflocken-Stern mit Verästelungen, dreht sich langsam
    const star = grp(0, 3.8, 0.05);
    const flake = E('#e8fbff', 1.2);
    for (let i = 0; i < 6; i++) {
      const arm = grp(0, 0, 0, star);
      arm.rotation.z = (i / 6) * TAU;
      box(0.05, 0.52, 0.04, flake, 0, 0.26, 0, 0, 0, 0, arm);
      for (const [y, l] of [[0.22, 0.16], [0.36, 0.11]]) for (const sx of [-1, 1]) box(0.03, l, 0.03, flake, sx * l * 0.35, y + l * 0.3, 0, 0, 0, sx * -0.8, arm);
    }
    cyl(0.07, 0.07, 0.05, flake, 0, 0, 0, 6, Math.PI / 2, 0, 0, star);
    anim(star, 'spin', { speed: 0.5, axis: [0, 0, 1] });
    // Eissockel mit Frostkante, Schneewehen, Eiszapfen am Bogen, Reif-Glitzer pulsiert
    for (const s of [-1, 1]) {
      sph(0.4, mat.snow('#f4faff'), s * 1.45, 0.12, 0.25, undefined, 12).scale.set(1.3, 0.35, 0.9);
      for (let k = 0; k < 3; k++) cone(0.05, 0.22 + k * 0.08, mat.ice('#d8f4ff', 0.85), s * (0.5 + k * 0.28), 3.42 - k * 0.12, 0.16, 6, Math.PI, 0, 0);
    }
    for (let k = 0; k < 6; k++) {
      const gl = oct(0.05, E('#ffffff', 2), [-1.2, 1.25, -0.9, 0.95, -0.4, 0.5][k], [1.0, 1.6, 2.6, 2.9, 3.25, 3.3][k], 0.25, 0.6, 1.4, 0.6);
      anim(gl, 'seq', { speed: 2.4, amp: k * 1.1 });
    }
    disc({ color: '#8ad8ff', swirl: '#ffffff', swirl2: '#cfeeff', rim: '#e8fbff', speed: 1.5 });
    sign(4.7, '#d8f2ff', '#1a4a7a', { z: 0.5, frame: mat.ice('#bfeeff', 0.88), frameT: 0.09, deco: ['snow', 'icicles'] });
    particles({ name: 'PortalSchnee', colors: ['#ffffff', '#e8f6ff'], particleSize: 0.1, sizeEnd: 0.08, rate: 6, speed: [0.2, 0.5], lifetime: [3, 5], spread: [30, 30], direction: 'Bottom', size: [2.6, 0.2, 0.8], acceleration: [0.05, -0.1, 0.1] }, 0, 3.1, 0.3);
  },
  // Vulkantor: Basaltsäulen aus kantigen Blöcken (versetzt, sechseckig), Glutrisse in Fugen, Bogen mit Glutkante,
  // Lavaschale mit Rand
  lava({ E, cyl, cone, tor, grp, anim, disc, sign, particles, rand, mat , box, sph}) {
    const basalt = mat.basalt('#2a2224'), basalt2 = mat.basalt('#3a3034'), glow = E('#ff5a12', 1.6), crust = mat.basalt('#1a1416');
    for (const s of [-1, 1]) {
      // sechseckige Basaltsäulen, leicht versetzt
      for (let k = 0; k < 4; k++) cyl(0.3 - k * 0.02, 0.32 - k * 0.02, 0.72, k % 2 ? basalt2 : basalt, s * (1.3 + (rand() - 0.5) * 0.06), 0.36 + k * 0.72, 0, 6, 0, rand(), 0);
      // Glut in den Fugen zwischen den Blöcken
      for (let k = 1; k < 4; k++) {
        const f = cyl(0.31 - k * 0.02, 0.31 - k * 0.02, 0.04, glow, s * 1.3, k * 0.72, 0, 6);
        anim(f, 'pulse', { speed: 2.0, amp: 0.4 });
      }
      cone(0.4, 0.8, crust, s * 1.62, 0.4, 0.15, 6);
    }
    tor(1.3, 0.3, basalt, 0, 2.85, 0, Math.PI, 14);
    const rim = tor(1.3, 0.07, glow, 0, 2.85, 0.27, Math.PI, 14);
    anim(rim, 'pulse', { speed: 1.6, amp: 0.45 });
    tor(1.3, 0.06, glow, 0, 2.85, -0.27, Math.PI, 12);
    // Lavaschale: Kegel mit Kragen und brodelnder Glut
    cone(0.55, 0.5, basalt, 0, 4.0, 0, 8, Math.PI, 0, 0);
    tor(0.5, 0.08, crust, 0, 4.25, 0, TAU, 12, Math.PI / 2, 0, 0);
    const pool = cyl(0.42, 0.42, 0.05, E('#ffb02e', 2), 0, 4.22, 0, 12);
    anim(pool, 'pulse', { speed: 2.4, amp: 0.3 });
    // Glutadern über den Bogen, Lavatropfen an der Schale, Krustenbrocken am Fuß
    for (let k = 0; k < 7; k++) {
      const a = (k / 6) * Math.PI, v = box(0.04, 0.22, 0.03, E('#ff5a12', 1.6), Math.cos(a) * 1.3, 2.85 + Math.sin(a) * 1.3, 0.3, 0, 0, a);
      anim(v, 'seq', { speed: 1.6, amp: k * 0.7 });
    }
    for (const sx of [-0.35, 0.3]) { const d = sph(0.05, E('#ffb02e', 1.8), sx, 3.75, 0.2, undefined, 8); d.scale.y = 1.6; anim(d, 'bob', { speed: 1.4, amp: 0.05 }); }
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) cyl(0.12 - k * 0.02, 0.15 - k * 0.02, 0.15, mat.basalt('#1a1416'), s * (1.75 + k * 0.12), 0.07, 0.45 - k * 0.1, 6);
    disc({ color: '#ff4a00', swirl: '#ffd27a', swirl2: '#ff8a2a', rim: '#ffb02e', speed: 1.3, intensity: 1.2 });
    sign(4.95, '#141012', '#ffb05a', { z: 0.6, frame: mat.basalt('#2a2224'), frameT: 0.1, inner: E('#ff5a12', 1.6), mount: 'posts', drop: 3.55, postM: mat.basalt('#1a1416'), deco: ['corners'], cornerM: E('#ff7a2a', 1.4), accent: '#ff7a2a' });
    particles({ name: 'PortalFunken', colors: ['#ffd27a', '#ff5a12'], particleSize: 0.08, sizeEnd: 0.03, rate: 6, speed: [1.2, 2.2], lifetime: [0.8, 1.4], spread: [25, 25], size: [0.6, 0.1, 0.6], acceleration: [0, -1.2, 0] }, 0, 4.25, 0);
    particles({ name: 'PortalRauch', texture: 'smoke', colors: ['#3a302c', '#6a605a'], particleSize: 0.5, sizeEnd: 1.6, rate: 1.5, speed: [0.4, 0.7], lifetime: [3, 4.5], spread: [10, 10], lightEmission: 0, size: [0.4, 0.1, 0.4], transparency: [[0, 1], [0.15, 0.4], [1, 1]] }, 0, 4.4, 0);
  },
  // Minenschacht: Felsen aus Schiefer, Balken aus Holz mit Eisenbeschlägen, Schild mit Rahmen, Laternen mit Glas und
  // Dach, Schienen auf Schwellen, Lore mit Rand und Speichenrädern
  hoehle({ M, E, box, cyl, sph, grp, anim, disc, sign, particles, mat , oct}) {
    const wood = mat.wood('#6b4a2e'), dark = mat.wood('#3a2a1a'), rock = mat.rock('#4a4458'), rock2 = mat.stone('#5a5466'), iron = mat.metal('#5a5a62');
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) {
      const r = sph(0.45 - k * 0.08, k % 2 ? rock2 : rock, s * (1.5 - k * 0.05), 0.4 + k * 0.85, -0.15, undefined, 9);
      r.scale.set(1, 0.85, 0.9);
    }
    for (const s of [-1, 1]) {
      box(0.3, 3.0, 0.3, wood, s * 1.2, 1.5, 0.05, 0, 0, s * 0.04);
      for (const y of [0.5, 1.6, 2.6]) box(0.33, 0.05, 0.33, iron, s * (1.2 + y * 0.002), y, 0.05, 0, 0, s * 0.04); // Beschläge
    }
    box(3.0, 0.32, 0.36, wood, 0, 3.05, 0.05, 0, 0, 0.03);
    for (const x of [-1.2, 1.2]) box(0.2, 0.34, 0.38, iron, x, 3.05, 0.05, 0, 0, 0.03); // Winkel an den Ecken
    box(2.6, 0.14, 0.1, dark, 0, 2.75, 0.22);
    // Schild „Mine“ mit Rahmen
    box(1.18, 0.38, 0.05, dark, 0, 3.05, 0.25, 0, 0, -0.05);
    box(1.1, 0.3, 0.06, mat.planks('#8a6a3a'), 0, 3.05, 0.26, 0, 0, -0.05);
    // Laternen: Bügel, Dach, Glas und Flamme; schaukeln
    for (const s of [-1, 1]) {
      const lt = grp(s * 1.2, 2.7, 0.35);
      cyl(0.012, 0.012, 0.22, iron, 0, -0.11, 0, 4, 0, 0, 0, lt);
      cyl(0.02, 0.13, 0.08, iron, 0, -0.24, 0, 4, 0, Math.PI / 4, 0, lt);
      box(0.16, 0.2, 0.16, mat.glass('#ffe8b0', 0.55, 0.3), 0, -0.38, 0, 0, 0, 0, lt);
      box(0.08, 0.12, 0.08, E('#ffb02e', 1.8), 0, -0.38, 0, 0, 0, 0, lt);
      box(0.18, 0.03, 0.18, iron, 0, -0.49, 0, 0, 0, 0, lt);
      anim(lt, 'sway', { speed: 1.2, amp: 0.15, axis: [0, 0, 1] });
    }
    // Schienen auf Schwellen
    for (const s of [-1, 1]) {
      box(0.05, 0.07, 1.6, iron, s * 0.4, 0.07, 0.6);
      box(0.1, 0.02, 1.6, iron, s * 0.4, 0.03, 0.6);
    }
    for (let k = 0; k < 4; k++) box(1.1, 0.05, 0.12, dark, 0, 0.02, 0.0 + k * 0.4);
    // Lore mit Rand und Speichenrädern
    const cart = grp(-0.95, 0.12, 0.9);
    box(0.7, 0.33, 0.5, iron, 0, 0.25, 0, 0, 0, 0, cart);
    box(0.76, 0.04, 0.56, mat.metal('#3a3a40'), 0, 0.42, 0, 0, 0, 0, cart);
    for (const sx of [-0.25, 0.25]) for (const sz of [-0.27, 0.27]) {
      cyl(0.09, 0.09, 0.04, dark, sx, 0.06, sz, 10, Math.PI / 2, 0, 0, cart);
      cyl(0.03, 0.03, 0.05, iron, sx, 0.06, sz, 6, Math.PI / 2, 0, 0, cart);
    }
    sph(0.12, E('#ffd76a', 0.6), -0.1, 0.48, 0, cart, 10);
    sph(0.1, E('#b07bff', 0.8), 0.12, 0.47, 0.08, cart, 10);
    // Stützbalken schräg an den Pfosten, Erzadern im Fels, Spitzhacke an der Wand
    for (const s of [-1, 1]) box(0.14, 1.4, 0.14, mat.wood('#5a3c24'), s * 1.0, 0.65, 0.25, 0, 0, s * -0.35);
    for (const [x, y, c] of [[-1.55, 0.9, '#ffd76a'], [1.5, 1.6, '#b07bff'], [-1.45, 2.0, '#6ae8ff'], [1.55, 0.6, '#ffd76a']]) { const o = oct(0.07, E(c, 1.2), x, y, 0.2, 0.7, 1.2, 0.7); anim(o, 'pulse', { speed: 1.4, amp: 0.4 }); }
    const pick = grp(1.15, 1.9, 0.24);
    pick.rotation.z = 0.6;
    box(0.05, 0.75, 0.05, mat.wood('#8a5a32'), 0, 0, 0, 0, 0, 0, pick);
    box(0.5, 0.06, 0.05, mat.metal('#6a6a72'), 0, 0.36, 0, 0, 0, 0.1, pick);
    disc({ color: '#3a2a6a', swirl: '#ffd27a', swirl2: '#b07bff', rim: '#ffb02e', speed: 1.1, opacity: 0.9, intensity: 0.6 });
    sign(4.05, '#8a6a3a', '#2a1a0a', { z: 0.45, frame: mat.wood('#5a3a20'), frameT: 0.1, tilt: -0.06, mount: 'chains', top: 4.9, deco: ['rivets'], rivetM: mat.metal('#3a3a40'), w: 2.2 });
    particles({ name: 'PortalLichtpunkte', colors: ['#ffd27a', '#b07bff'], particleSize: 0.06, sizeEnd: 0.02, rate: 4, speed: [0.2, 0.4], lifetime: [2, 3.5], spread: [180, 180], size: [1.6, 2.2, 0.3] }, 0, 1.6, 0.1);
  },
  // Zuckerstangen-Tor: Stangen aus schräg versetzten Ringen (Spiraleindruck) mit glänzendem Lack, Haken rund,
  // Lollis mit Spirale, Bonbons mit Glanzpunkt
  candy({ M, E, cyl, sph, tor, grp, anim, disc, sign, particles }) {
    const red = M('#ff3a5a', { roughness: 0.25 }), white = M('#fff8f8', { roughness: 0.25 });
    for (const s of [-1, 1]) {
      for (let k = 0; k < 14; k++) {
        const r = cyl(0.19, 0.19, 0.21, k % 2 ? white : red, s * 1.3, 0.11 + k * 0.212, 0, 12);
        r.rotation.z = 0.12 * s; // schräge Streifen
      }
      tor(0.32, 0.19, red, s * 1.3 - s * 0.32, 3.05, 0, Math.PI, 12, 0, s < 0 ? Math.PI : 0, 0);
      tor(0.32, 0.195, white, s * 1.3 - s * 0.32, 3.05, 0, Math.PI * 0.25, 4, 0, s < 0 ? Math.PI : 0, Math.PI * 0.35);
      cyl(0.03, 0.03, 0.8, white, s * 1.6, 0.4, 0.3, 8);
      const lo = grp(s * 1.6, 0.9, 0.3);
      cyl(0.28, 0.28, 0.08, E('#ff7ad8', 0.3, { roughness: 0.25 }), 0, 0, 0, 16, Math.PI / 2, 0, 0, lo);
      tor(0.2, 0.03, white, 0, 0, 0.05, TAU, 14, 0, 0, 0, lo);
      tor(0.1, 0.03, white, 0, 0, 0.05, TAU, 10, 0, 0, 0, lo);
      anim(lo, 'spin', { speed: 0.9 * s, axis: [0, 0, 1] });
    }
    const colors = ['#ffd84a', '#7aff8a', '#5fd3ff', '#ff8ac8', '#b07bff', '#ff8a3d', '#ffd84a'];
    arcPoints(7, 0.95, 1.85, 0.3, Math.PI - 0.3).forEach(([x, y], i) => {
      const b = grp(x, y + 0.2, 0.05);
      sph(0.17, E(colors[i], 0.35, { roughness: 0.2 }), 0, 0, 0, b, 14).scale.set(1, 1.2, 1);
      sph(0.04, M('#ffffff'), -0.06, 0.08, 0.13, b, 6); // Glanzpunkt
      if (i % 2 === 0) anim(b, 'bob', { speed: 1.6 + i * 0.2, amp: 0.05 });
    });
    // Bogen-Ausbau: Zuckerguss-Wellen auf den Haken, Gummibärchen auf dem Sockel, Bonbon-Sockel
    for (const s of [-1, 1]) {
      cyl(0.32, 0.36, 0.12, M('#ff8ac8', { roughness: 0.3 }), s * 1.3, 0.06, 0, 16);
      tor(0.3, 0.04, M('#fff0f8', { roughness: 0.3 }), s * 1.3, 0.13, 0, TAU, 12, Math.PI / 2, 0, 0);
      const bear = grp(s * 1.85, 0.0, 0.35);
      sph(0.1, M(s < 0 ? '#ff5a5a' : '#7aff8a', { transparent: true, opacity: 0.85, roughness: 0.2 }), 0, 0.12, 0, bear, 10).scale.y = 1.2;
      sph(0.07, M(s < 0 ? '#ff5a5a' : '#7aff8a', { transparent: true, opacity: 0.85, roughness: 0.2 }), 0, 0.3, 0, bear, 10);
      for (const ex of [-0.05, 0.05]) sph(0.03, M(s < 0 ? '#ff5a5a' : '#7aff8a'), ex, 0.36, 0, bear, 6);
      anim(bear, 'bob', { speed: 1.6, amp: 0.04 });
    }
    disc({ color: '#ff8ac8', swirl: '#ffffff', swirl2: '#ffe0f4', rim: '#ffffff', speed: 1.4 });
    sign(4.15, '#5a2e14', '#fff0f8', { z: 0.5, frame: M('#7a4424', { roughness: 0.4 }), frameT: 0.1, deco: ['drips', 'sprinkles'] });
    particles({ name: 'PortalKonfetti', colors: ['#ff5fb0', '#5fd3ff', '#ffe25f', '#7aff8a'], particleSize: 0.08, sizeEnd: 0.08, rate: 6, speed: [0.6, 1.2], lifetime: [1.5, 2.5], spread: [55, 55], size: [1.4, 0.2, 0.3], acceleration: [0, -0.5, 0] }, 0, 0.4, 0.4);
  },

  // ── Planet 2 ──
  // Mondsichel-Tor: Kraterstein aus Basalt mit Kraterrändern, Sichel aus poliertem Metall mit dünnerer Innenkante,
  // Sterne, Erde mit Wolkenband
  mond({ M, E, cyl, sph, tor, oct, grp, anim, disc, sign, particles, mat , box}) {
    const rock = mat.stone('#9a9ca8'), rock2 = mat.stone('#7a7c88'), silver = T2(mat.metal('#e8ecf8'));
    cyl(1.35, 1.5, 0.35, rock, 0, 0.17, 0, 18);
    cyl(1.3, 1.36, 0.05, rock2, 0, 0.37, 0, 18);
    for (const [x, z, r] of [[-0.9, 0.5, 0.22], [0.8, 0.6, 0.18], [0.3, -0.6, 0.25]]) {
      tor(r, 0.06, rock2, x, 0.38, z, TAU, 12, Math.PI / 2, 0, 0);
      cyl(r * 0.9, r * 0.9, 0.02, mat.stone('#6a6c78'), x, 0.37, z, 10);
    }
    const sickle = tor(1.35, 0.26, silver, 0, DISC_Y, 0, Math.PI * 1.55, 20, 0, 0, -Math.PI * 0.27);
    sickle.scale.y = 1.35;
    const inner = tor(1.2, 0.08, mat.metal('#c8cedc'), 0, DISC_Y, 0.12, Math.PI * 1.45, 18, 0, 0, -Math.PI * 0.22);
    inner.scale.y = 1.32;
    [[1.4, 2.9], [-1.45, 2.6], [1.55, 1.2], [-1.6, 0.9], [0, 3.6]].forEach(([x, y], i) => {
      const s = oct(0.12, E('#fff6c0', 1.6), x, y, 0.1, 0.6, 1.2, 0.6);
      anim(s, 'seq', { speed: 1.8, amp: i * 1.2 });
    });
    const orbit = grp(0, 3.9, 0);
    sph(0.22, M('#3a8ae8'), 0.6, 0, 0, orbit, 14);
    sph(0.12, M('#4ac86a'), 0.66, 0.08, 0.12, orbit, 8);
    tor(0.225, 0.02, M('#ffffff'), 0.6, 0, 0, TAU, 12, Math.PI / 2 + 0.3, 0, 0, orbit);
    anim(orbit, 'spin', { speed: 0.5, axis: [0, 1, 0] });
    // Mondgestein am Fuß, Fußabdrücke im Staub, Sternenspur über der Sichel
    for (const [x, z, r] of [[-1.3, 0.6, 0.18], [1.25, 0.4, 0.14], [-0.5, 0.8, 0.1]]) sph(r, mat.stone('#8a8c98'), x, 0.38, z, undefined, 8).scale.y = 0.6;
    for (let k = 0; k < 4; k++) box(0.08, 0.01, 0.14, mat.stone('#6a6c78'), -0.15 + (k % 2) * 0.2, 0.36, 0.55 + k * 0.22);
    for (let k = 0; k < 8; k++) { const a = Math.PI * 0.15 + k * 0.14, st2 = sph(0.025, E('#fff6c0', 2), Math.cos(a) * 1.65, DISC_Y + Math.sin(a) * 2.0, 0.05, undefined, 6); anim(st2, 'seq', { speed: 3, amp: k * 0.6 }); }
    disc({ color: '#1a1a4a', swirl: '#e8ecff', swirl2: '#9fd8ff', rim: '#cfe0ff', speed: 1.0, intensity: 0.7 });
    sign(4.75, '#c8ccd8', '#1a2a4a', { hy: 0.62, font: 'Barlow, system-ui, sans-serif', frame: mat.metal('#8a8f9a'), frameT: 0.08, inner: E('#7ad0ff', 1.4), deco: ['rivets'], rivetM: mat.metal('#5a5a62') });
    particles({ name: 'PortalSternenstaub', colors: ['#ffffff', '#cfe0ff'], particleSize: 0.06, sizeEnd: 0.02, rate: 5, speed: [0.3, 0.6], lifetime: [2, 3], spread: [20, 20], size: [1.6, 0.2, 0.3] }, 0, 0.4, 0.2);
  },
  // Sturmwirbel-Tor: Säulen aus Riffelblech mit Sockel und Kapitell, Eiskristalle in zwei Tönen, Bogen mit Leiste,
  // Windringe, Blitze
  neptun({ E, box, tor, oct, grp, anim, disc, sign, particles, rand, mat, pillar , cyl}) {
    const metal = mat.plate('#4a6a9a'), trim = mat.metal('#2a4a7a'), ice = mat.ice('#7ad0ff', 0.85), ice2 = mat.ice('#bff0ff', 0.88);
    for (const s of [-1, 1]) {
      pillar(s * 1.3, 3.0, 0.38, metal, trim);
      for (let k = 0; k < 3; k++) {
        oct(0.22, k % 2 ? ice2 : ice, s * 1.55, 0.6 + k * 0.9, 0.1, 0.75, 1.6, 0.75).rotation.z = s * -0.4;
        oct(0.12, ice2, s * 1.62, 0.85 + k * 0.9, 0.22, 0.7, 1.4, 0.7).rotation.z = s * -0.7;
      }
    }
    tor(1.3, 0.22, metal, 0, 3.0, 0, Math.PI, 16);
    tor(1.3, 0.06, trim, 0, 3.0, 0.2, Math.PI, 16);
    tor(1.3, 0.06, trim, 0, 3.0, -0.2, Math.PI, 16);
    for (const [r, tilt, sp] of [[1.6, 0.5, 1.0], [1.75, -0.4, -0.8]]) {
      const ring = grp(0, DISC_Y + 0.2, 0);
      ring.rotation.x = tilt;
      tor(r, 0.04, E('#bff0ff', 1, { transparent: true, opacity: 0.5 }), 0, 0, 0, Math.PI * 0.6, 8, Math.PI / 2, 0, 0, ring);
      tor(r, 0.025, E('#ffffff', 1, { transparent: true, opacity: 0.4 }), 0, 0, 0, Math.PI * 0.3, 4, Math.PI / 2, 0, 0.5, ring);
      anim(ring, 'spin', { speed: sp, axis: [0, 1, 0] });
    }
    // Blitze als Zickzack aus zwei Stücken
    for (const [x, y, a] of [[-0.3, 2.0, 0.5], [0.35, 1.2, -0.6]]) {
      const b = grp(x, y, 0.1);
      box(0.05, 0.35, 0.03, E('#ffffff', 2.4), 0, 0.15, 0, 0, 0, a, b);
      box(0.05, 0.35, 0.03, E('#ffffff', 2.4), 0.06, -0.15, 0, 0, 0, -a * 0.6, b);
      anim(b, 'seq', { speed: 4.5 + rand(), amp: x * 3 });
    }
    // Sturmfahnen an den Säulen, Wirbelscheibe auf dem Bogen, Eisschollen am Fuß
    for (const s of [-1, 1]) {
      const fl = grp(s * 1.3, 3.25, 0);
      cyl(0.02, 0.02, 0.5, mat.metal('#2a4a7a'), 0, 0.25, 0, 6, 0, 0, 0, fl);
      box(0.32, 0.18, 0.02, E('#5aa8ff', 0.6), s * 0.16, 0.42, 0, 0, 0, 0, fl);
      anim(fl, 'sway', { speed: 2.4, amp: 0.25, axis: [0, 1, 0] });
      for (let k = 0; k < 2; k++) cyl(0.18 - k * 0.05, 0.2 - k * 0.05, 0.05, mat.ice('#bff0ff', 0.85), s * (1.6 + k * 0.25), 0.03, 0.4, 7);
    }
    const whirl = grp(0, 3.15, 0.25);
    for (let k = 0; k < 3; k++) tor(0.12 + k * 0.07, 0.015, E('#bff0ff', 1.4, { transparent: true, opacity: 0.7 }), 0, 0, 0, Math.PI * 1.2, 4, 0, 0, k * 2.1, whirl);
    anim(whirl, 'spin', { speed: 2.2, axis: [0, 0, 1] });
    disc({ color: '#1a4ab8', swirl: '#9fd8ff', swirl2: '#ffffff', rim: '#5aa8ff', speed: 2.0 });
    sign(4.35, '#0a2a4a', '#bff0ff', { font: 'Barlow, system-ui, sans-serif', frame: E('#5aa8ff', 1.2, { transparent: true, opacity: 0.7 }), frameT: 0.04, mount: 'holo', deco: ['glyphs'], accent: '#7ad0ff' });
    particles({ name: 'PortalBoeen', colors: ['#ffffff', '#bff0ff'], particleSize: 0.05, sizeEnd: 0.15, rate: 5, speed: [1.2, 2], lifetime: [0.8, 1.2], spread: [80, 80], size: [2.4, 2.6, 0.4], transparency: [[0, 1], [0.3, 0.5], [1, 1]] }, 0, 1.6, 0.1);
  },
  // Forschungsstation-Tor: Riffelblech mit Nietenleisten, Warnlichter mit Fassung, Warnstreifen sauber gerahmt,
  // Antenne mit Gelenk, Schüssel mit Rand und Empfänger
  mars({ M, E, box, cyl, sph, grp, anim, disc, sign, particles, mat , tor}) {
    const plate = mat.plate('#c8ccd4'), dark = mat.metal('#4a4e58'), orange = mat.metal('#e8702a');
    for (const s of [-1, 1]) {
      box(0.6, 0.12, 0.66, dark, s * 1.3, 0.06, 0);
      box(0.5, 2.9, 0.55, plate, s * 1.3, 1.57, 0);
      for (let k = 0; k < 4; k++) box(0.52, 0.08, 0.57, k % 2 ? orange : dark, s * 1.3, 0.45 + k * 0.72, 0);
      for (let k = 0; k < 6; k++) sph(0.025, dark, s * 1.3 + 0.18, 0.3 + k * 0.45, 0.28, undefined, 6); // Nieten
      cyl(0.13, 0.13, 0.06, dark, s * 1.3, 3.22, 0.25, 10, Math.PI / 2, 0, 0); // Fassung
      const w = sph(0.1, E('#ff3a1a', 2), s * 1.3, 3.22, 0.3, undefined, 10);
      anim(w, 'seq', { speed: 3, amp: s > 0 ? 0 : Math.PI });
    }
    box(3.1, 0.4, 0.6, plate, 0, 3.1, 0);
    box(3.2, 0.05, 0.66, dark, 0, 2.9, 0);
    box(3.2, 0.05, 0.66, dark, 0, 3.3, 0);
    box(2.9, 0.32, 0.02, M('#1a1a1a'), 0, 3.1, 0.305);
    for (let k = 0; k < 7; k++) box(0.2, 0.36, 0.02, M('#ffd23a'), -1.2 + k * 0.4, 3.1, 0.315, 0, 0, 0.5);
    cyl(0.04, 0.05, 0.8, dark, 1.0, 3.7, 0, 8);
    sph(0.06, dark, 1.0, 4.1, 0, undefined, 8); // Gelenk
    const dish = grp(1.0, 4.12, 0);
    sph(0.28, plate, 0, 0, 0.1, dish, 14).scale.set(1, 1, 0.35);
    tor(0.27, 0.02, dark, 0, 0, 0.12, TAU, 14, 0, 0, 0, dish);
    cyl(0.015, 0.015, 0.3, dark, 0, 0, 0.25, 6, Math.PI / 2, 0, 0, dish);
    sph(0.03, E('#ff3a1a', 1.2), 0, 0, 0.4, dish, 6);
    anim(dish, 'spin', { speed: 0.4, axis: [0, 1, 0] });
    cyl(0.03, 0.03, 0.9, dark, -1.0, 3.75, 0, 6);
    sph(0.07, E('#7aff8a', 1.5), -1.0, 4.22, 0, undefined, 8);
    // Rohrleitungen an den Säulen, Lüftungsgitter, Marsgestein am Fuß
    for (const s of [-1, 1]) {
      cyl(0.04, 0.04, 2.6, mat.metal('#8a8f9a'), s * 1.62, 1.5, -0.1, 8);
      for (const y of [0.5, 1.5, 2.5]) box(0.12, 0.05, 0.1, mat.metal('#4a4e58'), s * 1.58, y, -0.1);
      for (let k = 0; k < 4; k++) box(0.3, 0.025, 0.02, mat.metal('#3a3e48'), s * 1.3, 2.1 + k * 0.08, 0.285);
      for (let k = 0; k < 2; k++) sph(0.13 - k * 0.04, mat.rock('#b85a2e'), s * (1.75 + k * 0.2), 0.08, 0.35, undefined, 8).scale.y = 0.6;
    }
    disc({ color: '#c8402e', swirl: '#ffb07a', swirl2: '#ff7a3a', rim: '#ff9b6a', speed: 1.4 });
    sign(4.95, '#2a2e38', '#ffd23a', { font: 'Barlow, system-ui, sans-serif', frame: mat.metal('#4a4e58'), frameT: 0.08, mount: 'posts', drop: 3.32, postM: mat.metal('#4a4e58'), deco: ['hazard', 'lamps', 'rivets'] });
    particles({ name: 'PortalStaub', colors: ['#d8653a', '#e0905a'], particleSize: 0.12, sizeEnd: 0.3, rate: 4, speed: [0.5, 1], lifetime: [1.5, 2.5], spread: [70, 70], lightEmission: 0, size: [2, 0.2, 0.6], transparency: [[0, 1], [0.2, 0.4], [1, 1]] }, 0, 0.3, 0.3);
  },
  // Ringplanet-Tor: Sockel aus Sandstein mit Stufe, Stützen aus Gold, Rahmen mit Innenleiste, Ringe in zwei Tönen,
  // Brocken, kleiner Saturn mit Bändern
  saturn({ M, E, cyl, sph, tor, oct, grp, anim, disc, sign, particles, rand, mat }) {
    const gold = mat.gold('#d8b070'), sandM = mat.sand('#b08850');
    cyl(1.0, 1.2, 0.22, sandM, 0, 0.11, 0, 16);
    cyl(0.85, 0.95, 0.12, mat.sand('#c8a068'), 0, 0.28, 0, 16);
    for (const s of [-1, 1]) {
      cyl(0.16, 0.22, 0.6, gold, s * 0.9, 0.62, 0, 10);
      sph(0.16, gold, s * 0.9, 0.95, 0, undefined, 10);
    }
    tor(1.15, 0.2, gold, 0, DISC_Y, 0, TAU, 20).scale.y = DISC_SY;
    tor(1.15, 0.05, mat.metal('#a07840'), 0, DISC_Y, 0.19, TAU, 20).scale.y = DISC_SY;
    const ring = grp(0, DISC_Y, 0);
    ring.rotation.set(0.25, 0, 0.35);
    tor(1.65, 0.06, E('#e8d0a0', 0.4, { transparent: true, opacity: 0.8 }), 0, 0, 0, TAU, 14, Math.PI / 2, 0, 0, ring);
    tor(1.82, 0.04, E('#c8a060', 0.3, { transparent: true, opacity: 0.6 }), 0, 0, 0, TAU, 14, Math.PI / 2, 0, 0, ring);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU + rand() * 0.3;
      oct(0.08 + rand() * 0.015, i % 3 ? M('#a88a5a') : E('#fff2c8', 0.9), Math.cos(a) * 1.74, (rand() - 0.5) * 0.06, Math.sin(a) * 1.74, 1, 1, 1, ring);
    }
    anim(ring, 'spin', { speed: 0.4, axis: [0, 1, 0] });
    const top = grp(0, 3.7, 0);
    sph(0.3, M('#e8c890'), 0, 0, 0, top, 16);
    for (const [y, c] of [[0.1, '#c8a060'], [-0.08, '#d8b078']]) cyl(0.29, 0.29, 0.05, M(c), 0, y, 0, 16, 0, 0, 0, top);
    tor(0.48, 0.04, M('#c8a060'), 0, 0, 0, TAU, 16, Math.PI / 2 - 0.3, 0, 0, top);
    tor(0.56, 0.025, M('#e8d0a0'), 0, 0, 0, TAU, 16, Math.PI / 2 - 0.3, 0, 0, top);
    anim(top, 'spin', { speed: 0.6, axis: [0, 1, 0] });
    // Sternwarten-Ausbau: Stufensockel mit Goldkante, Zierkugeln auf den Stützen pulsieren, zweiter Brockenring
    tor(1.0, 0.03, mat.gold('#ffe2a0'), 0, 0.23, 0, TAU, 18, Math.PI / 2, 0, 0);
    for (const s of [-1, 1]) { const k2 = sph(0.07, E('#fff2c8', 1.4), s * 0.9, 1.15, 0, undefined, 8); anim(k2, 'pulse', { speed: 1.6, amp: 0.5 }); }
    const ring2 = grp(0, DISC_Y, 0);
    ring2.rotation.set(-0.2, 0, -0.3);
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; oct(0.06, M('#c8a870'), Math.cos(a) * 1.95, 0, Math.sin(a) * 1.95, 1, 1, 1, ring2); }
    anim(ring2, 'spin', { speed: -0.3, axis: [0, 1, 0] });
    disc({ color: '#e0a040', swirl: '#fff2c8', swirl2: '#ffd8a0', rim: '#ffe2a0', speed: 1.1 });
    sign(4.6, '#5a4a32', '#ffe2a0', { hy: 0.6, frame: mat.gold('#d8b070'), frameT: 0.08, deco: ['emblemPlanet', 'rivets'], rivetM: mat.gold('#ffe2a0') });
    particles({ name: 'PortalGoldstaub', colors: ['#ffe2a0', '#fff6d0'], particleSize: 0.06, sizeEnd: 0.03, rate: 5, speed: [0.2, 0.4], lifetime: [2, 3], spread: [180, 180], size: [2.4, 2.4, 0.4] }, 0, DISC_Y, 0);
  },
  // Alien-Tentakel-Bogen: Tentakel aus mehr, eng überlappenden Gliedern mit Farbverlauf, Saugnäpfe mit Ring, Auge mit
  // Iris und Lid
  alien({ M, E, sph, tor, grp, anim, disc, sign, particles , cyl}) {
    const tones = ['#4a2278', '#5a2a8a', '#6a32a0', '#7a3ab0', '#8a44c0'], sucker = E('#d97aff', 0.6);
    for (const s of [-1, 1]) {
      const t = grp(s * 1.3, 0, 0);
      for (let k = 0; k < 16; k++) {
        const u = k / 15, r = 0.34 - u * 0.24, a = u * 1.45;
        const x = -s * (1 - Math.cos(a)) * 1.25, y = 0.2 + Math.sin(a) * 2.9;
        sph(r, M(tones[Math.min(4, Math.floor(u * 5))]), x, y, 0, t, 12);
        if (k % 2 === 0 && k < 13) {
          sph(r * 0.32, sucker, x, y, r * 0.85, t, 8);
          tor(r * 0.34, r * 0.07, M('#b05ad8'), x, y, r * 0.86, TAU, 5, 0, 0, 0, t);
        }
      }
      anim(t, 'sway', { speed: 0.9, amp: 0.05, axis: [0, 0, 1] });
      for (let k = 0; k < 3; k++) sph(0.11 - k * 0.02, M(tones[3]), s * (1.55 + k * 0.12), 0.12 + k * 0.12, 0.3, undefined, 8);
    }
    const eye = grp(0, 3.5, 0.1);
    sph(0.3, M('#e8ffe0', { roughness: 0.3 }), 0, 0, 0, eye, 16);
    sph(0.15, E('#7aff5a', 1.2), 0, 0, 0.2, eye, 12);
    sph(0.07, M('#101010'), 0, 0, 0.3, eye, 8);
    sph(0.025, M('#ffffff'), 0.04, 0.05, 0.36, eye, 6); // Glanz
    sph(0.31, M(tones[2]), 0, 0.12, -0.02, eye, 14).scale.set(1, 0.45, 1); // Lid
    anim(eye, 'sway', { speed: 0.6, amp: 0.45, axis: [0, 1, 0] });
    // Schleimpfütze am Fuß, Sporenkapseln, leuchtende Pusteln auf den Tentakeln
    const goo = cyl(0.9, 0.95, 0.03, E('#5aff3a', 0.8, { transparent: true, opacity: 0.7 }), 0, 0.02, 0.35, 16);
    goo.scale.z = 0.5;
    anim(goo, 'pulse', { speed: 1.3, amp: 0.3 });
    for (const s of [-1, 1]) for (let k = 0; k < 2; k++) {
      const pod = grp(s * (1.7 + k * 0.2), 0.0, 0.1 - k * 0.2);
      cyl(0.02, 0.03, 0.35, M('#4a2278'), 0, 0.17, 0, 6, 0, 0, 0, pod);
      const b = sph(0.08, E('#d97aff', 1), 0, 0.38, 0, pod, 10);
      anim(b, 'pulse', { speed: 1.8 + k, amp: 0.4 });
    }
    disc({ color: '#3aff3a', swirl: '#d9ff7a', swirl2: '#d97aff', rim: '#7aff5a', speed: 1.6, intensity: 1.1 });
    sign(4.5, '#0a2a0a', '#9aff7a', { z: 0.5, font: 'Barlow, system-ui, sans-serif', frame: E('#7aff5a', 1.2, { transparent: true, opacity: 0.7 }), frameT: 0.04, mount: 'holo', deco: ['glyphs'], accent: '#7aff5a' });
    particles({ name: 'PortalSchleim', colors: ['#7aff5a', '#d9ff7a'], particleSize: 0.1, sizeEnd: 0.04, rate: 4, speed: [0.3, 0.6], lifetime: [1.5, 2.5], spread: [30, 30], direction: 'Bottom', size: [1.6, 0.2, 0.3], acceleration: [0, -0.6, 0] }, 0, 2.8, 0.2);
  },
  // Sonnentor: Sockel aus Gold mit Stufe, Ring mit Innenleiste, Strahlen als Rauten (lang und kurz, zwei Töne),
  // innerer Glutring
  sonne({ E, box, cyl, tor, grp, anim, disc, sign, particles, mat , sph, cone}) {
    const gold = mat.gold('#ffcf4a'), dgold = mat.gold('#c8a040');
    cyl(1.0, 1.25, 0.22, dgold, 0, 0.11, 0, 16);
    cyl(0.85, 0.95, 0.12, gold, 0, 0.28, 0, 16);
    tor(1.15, 0.2, gold, 0, DISC_Y, 0, TAU, 20).scale.y = DISC_SY;
    tor(1.15, 0.05, dgold, 0, DISC_Y, 0.19, TAU, 20).scale.y = DISC_SY;
    const rays = grp(0, DISC_Y, -0.05);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * TAU, long = i % 2 === 0, r = long ? 1.78 : 1.58;
      // Raute: um die eigene Achse gedrehter Quader
      const ray = box(long ? 0.17 : 0.13, long ? 0.8 : 0.48, long ? 0.17 : 0.13, E(long ? '#ffb02e' : '#ffd84a', 1.3), Math.cos(a) * r, Math.sin(a) * r * 1.2, 0, 0, 0, a - Math.PI / 2, rays);
      ray.rotateY(Math.PI / 4);
    }
    anim(rays, 'spin', { speed: 0.3, axis: [0, 0, 1] });
    const inner = tor(1.32, 0.05, E('#fff2a0', 2, { transparent: true, opacity: 0.8 }), 0, DISC_Y, 0.05, TAU, 20);
    inner.scale.y = DISC_SY * 0.95;
    anim(inner, 'pulse', { speed: 2.4, amp: 0.45 });
    // Flammenkranz am Sockel, Sonnenscheiben seitlich, Sockelrunen
    for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU, f = cone(0.07, 0.24, E(k % 2 ? '#ff8a1a' : '#ffd84a', 1.8), Math.cos(a) * 0.95, 0.42, Math.sin(a) * 0.45 + 0.1, 6); anim(f, 'bob', { speed: 4 + k * 0.3, amp: 0.03 }); }
    for (const s of [-1, 1]) { const dsk = cyl(0.18, 0.18, 0.04, mat.gold('#ffcf4a'), s * 1.75, DISC_Y, 0, 14, Math.PI / 2, 0, 0); void dsk; const g3 = sph(0.09, E('#fff2a0', 1.6), s * 1.75, DISC_Y, 0.05, undefined, 8); anim(g3, 'pulse', { speed: 2.2, amp: 0.45 }); }
    disc({ color: '#ff8a1a', swirl: '#fff6c0', swirl2: '#ffd84a', rim: '#ffffff', speed: 1.5, intensity: 1.4 });
    sign(4.6, '#6a3a0a', '#fff2a0', { hy: 0.6, frame: mat.gold('#ffcf4a'), frameT: 0.08, inner: E('#ffb02e', 1.6), deco: ['emblemSun'] });
    particles({ name: 'PortalEruption', colors: ['#fff2a0', '#ffb02e', '#ff6a1a'], particleSize: 0.1, sizeEnd: 0.03, rate: 6, speed: [1, 1.8], lifetime: [0.8, 1.3], spread: [180, 180], size: [0.4, 0.4, 0.2], acceleration: [0, -0.4, 0] }, 0, DISC_Y, 0.1);
  },

  // ── Planet 3 ──
  // Korallenbogen: Sandsockel mit Rand, Korallen mit Polypen-Struktur (Pebble), verzweigte Finger, Anemonen mit
  // Leuchtspitzen, Fische mit Flosse
  korallenriff({ M, E, cyl, sph, cone, grp, anim, disc, sign, particles, rand, mat }) {
    const cols = ['#ff7a8a', '#ffb05a', '#c87aff', '#5ad8a0', '#ffd84a', '#ff5a8a'];
    cyl(1.4, 1.55, 0.22, mat.sand('#e8d4a0'), 0, 0.11, 0, 18);
    cyl(1.42, 1.42, 0.04, mat.sand('#d8c090'), 0, 0.23, 0, 18);
    arcPoints(11, 1.3, 1.85).forEach(([x, y], i) => {
      const c = cols[i % cols.length];
      sph(0.28 + rand() * 0.1, mat.pebble(c), x, y, (rand() - 0.5) * 0.15, undefined, 12);
      for (let k = 0; k < 3; k++) {
        const fx = x + (rand() - 0.5) * 0.32, fy = y + 0.22, fz = (rand() - 0.5) * 0.2, rx = (rand() - 0.5) * 0.6, rz = (rand() - 0.5) * 0.8;
        cyl(0.035, 0.065, 0.42, mat.pebble(c), fx, fy, fz, 6, rx, 0, rz);
        sph(0.045, M(new THREE.Color(c).lerp(new THREE.Color('#ffffff'), 0.4).getStyle()), fx - Math.sin(rz) * 0.2, fy + 0.2, fz + Math.sin(rx) * 0.2, undefined, 6);
      }
    });
    for (const s of [-1, 1]) {
      const an = grp(s * 1.5, 0.25, 0.35);
      cyl(0.08, 0.1, 0.12, M('#d86aa8'), 0, 0.06, 0, 10, 0, 0, 0, an);
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * TAU;
        cyl(0.018, 0.028, 0.35, E('#ff9ad5', 0.4), Math.cos(a) * 0.08, 0.28, Math.sin(a) * 0.08, 5, Math.cos(a) * 0.45, 0, Math.sin(a) * 0.45, an);
        sph(0.025, E('#fff0f8', 1), Math.cos(a) * 0.16, 0.44, Math.sin(a) * 0.16, an, 6);
      }
      anim(an, 'sway', { speed: 1.1, amp: 0.13, axis: [0, 0, 1] });
    }
    const fish = grp(0, DISC_Y, 0);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * TAU, f = grp(Math.cos(a) * 1.5, (i - 1) * 0.5, Math.sin(a) * 1.5, fish), c = ['#ffd76a', '#ff8a3d', '#5fd3ff'][i];
      f.rotation.y = -a;
      sph(0.1, M(c), 0, 0, 0, f, 12).scale.set(0.6, 0.8, 1.6);
      cone(0.08, 0.14, M(c), 0, 0, -0.2, 6, -Math.PI / 2, 0, 0, f);
      cone(0.04, 0.1, M(c), 0, 0.09, -0.02, 4, 0, 0, 0, f); // Rückenflosse
      sph(0.018, M('#101010'), 0.05, 0.03, 0.1, f, 6);
    }
    anim(fish, 'spin', { speed: 0.7, axis: [0, 1, 0] });
    // Seegras am Sockel, Sanddollar und Steinchen, Seestern auf dem Bogen
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) {
      const sg2 = grp(s * (0.9 + k * 0.2), 0.24, 0.55 - k * 0.12);
      cyl(0.012, 0.03, 0.55, M('#3a9a6a'), 0, 0.27, 0, 6, 0, 0, 0, sg2);
      anim(sg2, 'sway', { speed: 1.2 + k * 0.2, amp: 0.2, axis: [0, 0, 1] });
    }
    for (const [x, z] of [[-0.6, 0.7], [0.5, 0.75]]) cyl(0.1, 0.1, 0.02, mat.sand('#f0e0c0'), x, 0.25, z, 12);
    const star = grp(0.6, 3.35, 0.2);
    for (let k = 0; k < 5; k++) cyl(0.02, 0.045, 0.2, M('#ff8a5a'), Math.cos((k / 5) * TAU) * 0.08, Math.sin((k / 5) * TAU) * 0.08, 0, 5, 0, 0, (k / 5) * TAU - Math.PI / 2, star);
    disc({ color: '#2ab0c8', swirl: '#e8ffff', swirl2: '#9ff3f0', rim: '#bff8ff', speed: 1.1 });
    sign(4.5, '#a08a6a', '#0a3a4a', { z: 0.65, frame: mat.wood('#8a7458'), frameT: 0.09, deco: ['logs', 'shells', 'barnacles'] });
    particles({ name: 'PortalBlasen', colors: ['#ffffff', '#bff8ff'], particleSize: 0.08, sizeEnd: 0.12, rate: 4, speed: [0.5, 0.9], lifetime: [2.5, 3.5], spread: [12, 12], size: [1.8, 0.2, 0.4] }, 0, 0.3, 0.2);
  },
  // Muschel-Torbogen: Muscheln aus Marmor (Perlmutt) mit Fächerrippen und Schlossrand, große Muschel mit zwei Schalen,
  // Perle, Seesterne mit Noppen
  muschelland({ M, E, cyl, sph, grp, anim, disc, sign, particles, mat , tor}) {
    const cols = ['#ffd8ec', '#ffe8d0', '#f4c8e0', '#ffffff', '#ffd0a8', '#e8d0ff'];
    cyl(1.4, 1.55, 0.22, mat.sand('#ffe6c8'), 0, 0.11, 0, 18);
    cyl(1.42, 1.42, 0.04, mat.sand('#f0d0b0'), 0, 0.23, 0, 18);
    const shell = (parent, r, c) => {
      cyl(r, r, 0.1, mat.marble(c), 0, 0, 0, 14, Math.PI / 2, 0, 0, parent).scale.set(1, 1, 0.8);
      for (let k = -3; k <= 3; k++) cyl(0.014, 0.01, r * 0.95, mat.marble('#d8a8c0'), Math.sin(k * 0.24) * r * 0.42, Math.cos(k * 0.24) * r * 0.42, 0.06, 4, 0, 0, -k * 0.24, parent);
      cyl(r * 0.25, r * 0.25, 0.12, mat.marble('#e8c0d4'), 0, -r * 0.05, 0.01, 8, Math.PI / 2, 0, 0, parent).scale.set(1.4, 1, 0.6); // Schloss
    };
    arcPoints(9, 1.32, 1.85).forEach(([x, y, a], i) => {
      const sh = grp(x, y, 0);
      sh.rotation.z = a - Math.PI / 2;
      shell(sh, 0.36, cols[i % cols.length]);
    });
    const top = grp(0, 3.6, 0);
    shell(top, 0.55, '#ffd8ec');
    const lid = grp(0, 0.1, -0.08, top);
    lid.rotation.x = -0.5;
    shell(lid, 0.53, '#f4c8e0');
    const pearl = sph(0.2, E('#fff4fb', 0.9, { roughness: 0.15 }), 0, 0.05, 0.12, top, 16);
    anim(pearl, 'pulse', { speed: 1.6, amp: 0.35 });
    for (const s of [-1, 1]) {
      const st = grp(s * 1.5, 0.3, 0.4);
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * TAU;
        cyl(0.025, 0.06, 0.26, M('#ff8a5a'), Math.cos(a) * 0.1, Math.sin(a) * 0.1, 0, 5, 0, 0, a - Math.PI / 2, st);
        sph(0.018, M('#ffc0a0'), Math.cos(a) * 0.15, Math.sin(a) * 0.15, 0.03, st, 4);
      }
      sph(0.06, M('#ff9a6a'), 0, 0, 0.01, st, 8);
    }
    // Perlenschnüre an der großen Muschel, Perlmutt-Sockel mit Perlenkante, Schneckenhäuser am Fuß
    for (let k = 0; k < 14; k++) { const a = (k / 14) * TAU; sph(0.035, M('#fff8fc', { roughness: 0.15 }), Math.cos(a) * 1.45, 0.25, Math.sin(a) * 1.45 * 0.5 + 0.1, undefined, 6); }
    for (const s of [-1, 1]) {
      const sn = grp(s * 1.75, 0.08, 0.2);
      for (let k = 0; k < 4; k++) tor(0.1 - k * 0.022, 0.035 - k * 0.006, mat.marble(s < 0 ? '#ffd0a8' : '#e8d0ff'), 0, k * 0.05, 0, TAU, 8, Math.PI / 2, 0, 0, sn);
    }
    for (let k = 0; k < 6; k++) { const a = Math.PI * 0.2 + k * 0.12, pr = sph(0.03, E('#fff4fb', 1.2), Math.cos(a) * 0.62, 3.6 + Math.sin(a) * 0.3, 0.08, undefined, 6); anim(pr, 'seq', { speed: 2, amp: k * 0.8 }); }
    disc({ color: '#e08ac0', swirl: '#ffffff', swirl2: '#ffe8f8', rim: '#ffd8f0', speed: 1.2 });
    sign(4.65, '#f4e4f0', '#8a3a6a', { frame: mat.marble('#e8c8dc'), frameT: 0.07, deco: ['pearls'] });
    particles({ name: 'PortalGlitzer', colors: ['#fff2fa', '#e8d0ff', '#ffffff'], particleSize: 0.06, sizeEnd: 0.02, rate: 6, speed: [0.2, 0.4], lifetime: [1.5, 2.5], spread: [180, 180], size: [2.2, 2.6, 0.4] }, 0, DISC_Y, 0.1);
  },
  // Tempeltor mit Runen: Stufensockel und Säulen aus Marmor mit Basis, Ringen und Kapitell, Gebälk mit Leisten,
  // Giebel mit Rahmen, Runen, goldener Dreizack
  atlantis({ E, box, cyl, cone, grp, anim, disc, sign, particles, mat, pillar }) {
    const marble = mat.marble('#e8eef2'), marble2 = mat.marble('#d0dce4'), gold = mat.gold('#ffd76a');
    box(3.3, 0.14, 1.0, marble2, 0, 0.07, 0);
    box(3.1, 0.12, 0.85, marble, 0, 0.2, 0);
    for (const s of [-1, 1]) {
      pillar(s * 1.3, 2.95, 0.48, marble, marble2, { round: true, y0: 0.26 });
      for (const y of [1.2, 2.2]) cyl(0.26, 0.26, 0.04, marble2, s * 1.3, y, 0, 12); // Zierringe
    }
    box(3.3, 0.12, 0.75, marble2, 0, 3.27, 0);
    box(3.2, 0.24, 0.7, marble, 0, 3.45, 0);
    box(3.3, 0.06, 0.76, marble2, 0, 3.6, 0);
    const ped = cone(1.75, 0.6, marble, 0, 3.93, 0, 3, 0, 0, 0);
    ped.scale.set(1, 1, 0.35);
    for (let k = 0; k < 5; k++) {
      const r = box(0.16, 0.16, 0.03, E('#5affd8', 1.8), -0.8 + k * 0.4, 3.45, 0.36, 0, 0, 0.785);
      anim(r, 'seq', { speed: 1.6, amp: k * 1.1 });
    }
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) {
      const r = box(0.09, 0.16, 0.03, E('#5affd8', 1.6), s * 1.3, 1.0 + k * 0.6, 0.25);
      anim(r, 'seq', { speed: 1.6, amp: k * 1.1 + (s > 0 ? 3 : 0) });
    }
    const tri = grp(0, 4.25, 0);
    cyl(0.03, 0.03, 0.8, gold, 0, 0.4, 0, 8, 0, 0, 0, tri);
    for (const x of [-0.15, 0, 0.15]) cone(0.04, 0.22, gold, x, 0.9, 0, 6, 0, 0, 0, tri);
    for (const x of [-0.15, 0.15]) cyl(0.022, 0.022, 0.14, gold, x, 0.73, 0, 6, 0, 0, 0, tri);
    box(0.36, 0.04, 0.04, gold, 0, 0.78, 0, 0, 0, 0, tri);
    anim(tri, 'bob', { speed: 1.0, amp: 0.05 });
    // Wasserrinnen an den Säulen, Akroterien auf dem Giebel, Muschelreliefs am Sockel
    for (const s of [-1, 1]) {
      const w = box(0.06, 2.4, 0.03, E('#5affd8', 0.6, { transparent: true, opacity: 0.5 }), s * 1.3, 1.6, 0.27);
      anim(w, 'pulse', { speed: 2.4, amp: 0.4 });
      cone(0.1, 0.25, mat.marble('#d0dce4'), s * 1.62, 3.75, 0, 6);
      cyl(0.09, 0.09, 0.03, mat.marble('#c0ccd4'), s * 0.9, 0.2, 0.44, 10, Math.PI / 2, 0, 0);
    }
    cone(0.1, 0.25, mat.marble('#d0dce4'), 0, 4.3, 0, 6);
    disc({ color: '#0a6a8a', swirl: '#5affd8', swirl2: '#bff8ff', rim: '#5affd8', speed: 1.2 });
    sign(5.35, '#e8eef2', '#0a5a6a', { frame: mat.marble('#c0ccd4'), frameT: 0.09, deco: ['runes'], accent: '#5affd8' });
    particles({ name: 'PortalBlasen', colors: ['#ffffff', '#bff8ff'], particleSize: 0.08, sizeEnd: 0.12, rate: 3, speed: [0.5, 0.9], lifetime: [2.5, 3.5], spread: [12, 12], size: [2, 0.2, 0.4] }, 0, 0.3, 0.2);
  },
  // Tiefsee-Kraken: Fels aus Schiefer, Tentakel aus mehr Gliedern mit Farbverlauf und gleichmäßigem Schwung,
  // Saugnäpfe mit Ring, Leuchtpunkte
  tiefseegraben({ M, E, sph, tor, grp, anim, disc, sign, particles, mat , box, cyl}) {
    const tones = ['#5a1a2a', '#6a2232', '#7a2a3a', '#8a323f', '#9a3a4a'], sucker = M('#e8b0b8');
    sph(0.9, mat.stone('#1a222c'), 0, 0.15, -0.2, undefined, 12).scale.set(1.7, 0.4, 1);
    const tentacle = (x, z, dir, h, lean, sp) => {
      const t = grp(x, 0.2, z);
      for (let k = 0; k < 14; k++) {
        const u = k / 13, r = 0.25 * (1 - u * 0.78);
        const px = dir * Math.sin(u * 2.2) * lean, py = u * h;
        sph(r, M(tones[Math.min(4, Math.floor(u * 5))]), px, py, 0, t, 12);
        if (k % 2 === 0 && k < 12) {
          sph(r * 0.36, sucker, px - dir * r * 0.65, py, r * 0.5, t, 8);
          tor(r * 0.36, r * 0.07, M('#c88a94'), px - dir * r * 0.67, py, r * 0.52, TAU, 5, 0, dir * 0.9, 0, t);
        }
      }
      anim(t, 'sway', { speed: sp, amp: 0.1, axis: [0, 0, 1] });
    };
    tentacle(-1.35, 0, 1, 3.4, 0.9, 0.75);
    tentacle(1.35, 0, -1, 3.2, 0.9, 0.9);
    tentacle(-1.45, 0.45, -1, 1.5, 0.35, 1.1);
    tentacle(1.45, 0.45, 1, 1.3, 0.35, 1.0);
    for (const [x, y] of [[-1.1, 2.4], [1.1, 2.2], [-0.6, 3.3], [0.6, 3.1]]) {
      const l = sph(0.06, E('#5affd8', 2), x, y, 0.2, undefined, 8);
      anim(l, 'pulse', { speed: 2.0, amp: 0.65 });
    }
    // Leuchtpilze und Röhrenwürmer am Fels, Wrackplanken am Fuß
    for (const s of [-1, 1]) {
      for (let k = 0; k < 3; k++) { const tw = grp(s * (0.9 + k * 0.25), 0.28, 0.3 - k * 0.1); cyl(0.025, 0.03, 0.35 + k * 0.1, M('#e8e0d0'), 0, 0.18, 0, 6, 0, 0, 0, tw); sph(0.05, E('#ff5a7a', 1.2), 0, 0.38 + k * 0.1, 0, tw, 8); anim(tw, 'sway', { speed: 1.5 + k * 0.3, amp: 0.15, axis: [0, 0, 1] }); }
      box(0.7, 0.05, 0.14, mat.wood('#3a3228'), s * 1.25, 0.32, 0.55, 0, s * 0.4, 0.1);
    }
    disc({ color: '#06142a', swirl: '#5affd8', swirl2: '#ff7ae0', rim: '#2affd8', speed: 1.0, opacity: 0.92, intensity: 0.6 });
    sign(4.6, '#2a2620', '#5affd8', { x: 1.75, frame: mat.wood('#3a3228'), frameT: 0.1, tilt: 0.05, deco: ['algae', 'barnacles'] });
    particles({ name: 'PortalPlankton', colors: ['#5affd8', '#7ad0ff', '#ff7ae0'], particleSize: 0.05, sizeEnd: 0.02, rate: 5, speed: [0.1, 0.3], lifetime: [3, 5], spread: [180, 180], size: [2.6, 2.8, 0.6] }, 0, DISC_Y, 0.1);
  },

  // ── Planet 4 ──
  // Wolkentor: Wolken aus mehreren Bäuschen mit hellerer Oberseite, goldener Rand mit Innenleiste, kleine Wolken
  wolkenburg({ M, sph, tor, grp, anim, disc, sign, particles, rand, mat , E, box}) {
    const cloud = M('#ffffff', { roughness: 1 }), cloud2 = M('#eef2ff', { roughness: 1 }), shade = M('#dce4f6', { roughness: 1 });
    sph(1.2, cloud2, 0, 0.1, 0, undefined, 14).scale.set(1.4, 0.35, 0.8);
    for (const x of [-0.9, 0, 0.9]) sph(0.42, cloud, x, 0.3, 0.1, undefined, 12);
    arcPoints(9, 1.35, 1.9).forEach(([x, y], i) => {
      const r = 0.36 + rand() * 0.12;
      sph(r, shade, x, y - r * 0.25, -0.05, undefined, 12);
      sph(r * 0.85, i % 2 ? cloud : cloud2, x, y + r * 0.15, 0.08, undefined, 12);
    });
    tor(1.12, 0.06, mat.gold('#ffcf4a'), 0, DISC_Y, 0.15, TAU, 22).scale.y = DISC_SY;
    tor(1.05, 0.025, mat.gold('#ffe7a8'), 0, DISC_Y, 0.17, TAU, 20).scale.y = DISC_SY;
    for (const s of [-1, 1]) {
      const c = grp(s * 1.7, 2.4, 0.3);
      sph(0.25, cloud, 0, 0, 0, c, 12);
      sph(0.18, cloud2, 0.22, -0.04, 0, c, 10);
      sph(0.18, cloud2, -0.22, -0.04, 0, c, 10);
      sph(0.16, shade, 0, -0.1, -0.05, c, 10);
      anim(c, 'bob', { speed: 0.8 + s * 0.15, amp: 0.13 });
    }
    // Goldene Zinnen auf der Wolke, Sonnenstrahlen hinter dem Tor, Wolkenpuffer schweben
    for (let k = 0; k < 5; k++) box(0.1, 0.16, 0.06, mat.gold('#ffcf4a'), -0.5 + k * 0.25, 0.48, 0.42);
    const rays = grp(0, DISC_Y, -0.2);
    for (let k = 0; k < 10; k++) { const a = (k / 10) * TAU; box(0.06, 0.5, 0.02, E('#fff3c4', 1, { transparent: true, opacity: 0.6 }), Math.cos(a) * 1.75, Math.sin(a) * 2.1, 0, 0, 0, a - Math.PI / 2, rays); }
    anim(rays, 'spin', { speed: 0.15, axis: [0, 0, 1] });
    disc({ color: '#8ac4f6', swirl: '#ffffff', swirl2: '#fff3c4', rim: '#ffe28a', speed: 0.9 });
    sign(4.65, '#ffffff', '#4a78b8', { hy: 0.65, z: 0.6, frame: mat.gold('#ffcf4a'), frameT: 0.05, deco: ['clouds'] });
    particles({ name: 'PortalWoelkchen', texture: 'smoke', colors: ['#ffffff'], particleSize: 0.3, sizeEnd: 0.6, rate: 2, speed: [0.3, 0.5], lifetime: [2.5, 3.5], spread: [40, 40], lightEmission: 0.3, size: [1.6, 0.3, 0.3], transparency: [[0, 1], [0.2, 0.3], [1, 1]] }, 0, 0.6, 0.3);
  },
  // Flügeltor: Marmorsockel mit Stufe, Säulen mit Basis und Kapitell aus Gold, Federn mit Kiel und Abstufung, Heiligen-
  // schein doppelt, goldener Rand
  engelsgarten({ M, E, box, cyl, tor, grp, anim, disc, sign, particles, mat, pillar , sph, oct}) {
    const white = mat.marble('#fbfaf6'), feather = M('#fffdf8', { roughness: 0.7 }), feather2 = M('#fff3dc', { roughness: 0.7 }), gold = mat.gold('#ffcf4a');
    cyl(1.0, 1.2, 0.2, mat.marble('#f4f0e6'), 0, 0.1, 0, 16);
    cyl(0.85, 0.95, 0.12, white, 0, 0.26, 0, 16);
    for (const s of [-1, 1]) {
      pillar(s * 1.15, 2.6, 0.36, white, gold, { round: true, y0: 0.15 });
      const wing = grp(s * 1.2, 2.5, -0.1);
      for (let row = 0; row < 3; row++)
        for (let k = 0; k < 5; k++) {
          const len = (1.3 - row * 0.3 - k * 0.08) * 0.85;
          const f = box(0.14, len, 0.05, row === 0 ? feather : feather2, s * (0.2 + k * 0.15), 0.3 - row * 0.32 - k * 0.12 - len * 0.12, -row * 0.03, 0, 0, s * (-0.35 - k * 0.12), wing);
          box(0.02, len * 0.95, 0.055, M('#f0e4c8'), 0, 0, 0.005, 0, 0, 0, f); // Kiel
          f.scale.set(1, 1, 1);
        }
      anim(wing, 'sway', { speed: 0.8, amp: 0.09 * s, axis: [0, 1, 0] });
    }
    const halo = grp(0, 3.85, 0);
    tor(0.4, 0.06, E('#fff2a0', 1.8), 0, 0, 0, TAU, 20, Math.PI / 2, 0, 0, halo);
    tor(0.4, 0.025, E('#ffffff', 2), 0, 0.05, 0, TAU, 16, Math.PI / 2, 0, 0, halo);
    anim(halo, 'bob', { speed: 1.0, amp: 0.07 });
    tor(1.05, 0.05, gold, 0, DISC_Y, 0.05, TAU, 22).scale.y = DISC_SY;
    // Rosenranken an den Säulen, goldene Sterne um den Heiligenschein, Federn auf dem Sockel
    for (const s of [-1, 1]) for (let k = 0; k < 5; k++) sph(0.06, M(k % 2 ? '#ff9ab8' : '#5aa84a'), s * (1.15 + Math.sin(k * 1.4) * 0.22), 0.5 + k * 0.45, 0.2 + Math.cos(k * 1.4) * 0.05, undefined, 8);
    for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU, st2 = oct(0.05, E('#fff2a0', 2), Math.cos(a) * 0.62, 3.85, Math.sin(a) * 0.62, 0.6, 1.2, 0.6); anim(st2, 'seq', { speed: 2, amp: k * 1.2 }); }
    for (const s of [-1, 1]) box(0.08, 0.3, 0.02, M('#fffdf8'), s * 0.6, 0.34, 0.6, Math.PI / 2 - 0.1, 0, s * 0.4);
    disc({ color: '#ffd76a', swirl: '#ffffff', swirl2: '#fff2a0', rim: '#ffffff', speed: 1.0, intensity: 1.1 });
    sign(4.75, '#fff6dc', '#8a6a20', { hy: 0.6, frame: M('#e8d8b0'), frameT: 0.03, deco: ['scroll', 'tassels'], w: 2.1 });
    particles({ name: 'PortalFedern', colors: ['#ffffff', '#fff6e0'], particleSize: 0.1, sizeEnd: 0.1, rate: 2, speed: [0.1, 0.3], lifetime: [4, 6], spread: [50, 50], direction: 'Bottom', lightEmission: 0.3, size: [2.6, 0.2, 0.4], acceleration: [0.05, -0.05, 0] }, 0, 3.2, 0.1);
  },
  // Göttertor: Stufensockel, kannelierte Marmorsäulen (Rillen) mit Goldbasis und Kapitell, Gebälk mit Leisten, Krone
  // mit Zacken und Edelsteinen, Blitze im Zickzack
  goetterthron({ E, box, cyl, oct, grp, anim, disc, sign, particles, mat , tor, M, sph}) {
    const marble = mat.marble('#f4f0e8'), marble2 = mat.marble('#e0d8c8'), gold = mat.gold('#ffcf4a');
    box(3.2, 0.14, 1.0, marble2, 0, 0.07, 0);
    box(3.0, 0.12, 0.88, marble, 0, 0.2, 0);
    box(2.9, 0.12, 0.8, gold, 0, 0.32, 0);
    for (const s of [-1, 1]) {
      cyl(0.26, 0.3, 2.85, marble, s * 1.35, 1.9, 0, 16);
      for (let k = 0; k < 8; k++) { // Kanneluren
        const a = (k / 8) * TAU;
        box(0.03, 2.6, 0.03, marble2, s * 1.35 + Math.cos(a) * 0.28, 1.9, Math.sin(a) * 0.28);
      }
      cyl(0.38, 0.38, 0.12, gold, s * 1.35, 3.38, 0, 16);
      cyl(0.32, 0.36, 0.1, gold, s * 1.35, 3.27, 0, 16);
      cyl(0.36, 0.38, 0.12, gold, s * 1.35, 0.44, 0, 16);
      cyl(0.32, 0.32, 0.06, marble2, s * 1.35, 0.53, 0, 16);
    }
    box(3.4, 0.08, 0.8, gold, 0, 3.48, 0);
    box(3.3, 0.3, 0.75, gold, 0, 3.67, 0);
    box(3.45, 0.06, 0.82, mat.gold('#e0b030'), 0, 3.85, 0);
    const crown = grp(0, 4.0, 0);
    cyl(0.5, 0.45, 0.3, gold, 0, 0.15, 0, 16, 0, 0, 0, crown);
    tor(0.5, 0.04, mat.gold('#e0b030'), 0, 0.3, 0, TAU, 16, Math.PI / 2, 0, 0, crown);
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * TAU;
      const z = box(0.12, 0.35, 0.05, gold, Math.cos(a) * 0.46, 0.45, Math.sin(a) * 0.46, 0, -a + Math.PI / 2, 0, crown);
      z.rotateZ(Math.PI / 4);
      z.scale.set(0.7, 0.7, 1);
      oct(0.06, E(['#ff3a5a', '#3a8aff', '#3aff8a'][k % 3], 1.2), Math.cos(a) * 0.5, 0.18, Math.sin(a) * 0.5, 1, 1, 1, crown);
    }
    anim(crown, 'spin', { speed: 0.4, axis: [0, 1, 0] });
    for (const s of [-1, 1]) for (let k = 0; k < 2; k++) {
      const b = grp(s * 1.0, 1.4 + k * 1.1, 0.25);
      box(0.05, 0.3, 0.03, E('#fff6c0', 2.6), 0, 0.12, 0, 0, 0, s * (0.4 - k * 0.8), b);
      box(0.05, 0.3, 0.03, E('#fff6c0', 2.6), s * 0.05, -0.12, 0, 0, 0, -s * (0.4 - k * 0.8) * 0.5, b);
      anim(b, 'seq', { speed: 5, amp: k * 2 + (s > 0 ? 1 : 0) });
    }
    // Adler-Akroterien aus Gold auf dem Gebälk, Lorbeer an den Säulen, Strahlen hinter der Krone
    for (const s of [-1, 1]) {
      const ea = grp(s * 1.45, 3.95, 0);
      sph(0.1, mat.gold('#ffcf4a'), 0, 0.08, 0, ea, 8);
      box(0.32, 0.05, 0.12, mat.gold('#ffcf4a'), s * 0.12, 0.14, 0, 0, 0, s * 0.4, ea);
      for (let k = 0; k < 4; k++) { const lf = sph(0.06, M('#7a9a3a'), s * 1.35 + Math.cos(k * 1.5) * 0.3, 1.0 + k * 0.6, Math.sin(k * 1.5) * 0.3, undefined, 6); lf.scale.set(0.6, 1.3, 0.4); }
    }
    const halo = grp(0, 4.3, -0.1);
    for (let k = 0; k < 9; k++) { const a = (k / 8) * Math.PI; box(0.04, 0.35, 0.02, E('#fff2a0', 1.2, { transparent: true, opacity: 0.7 }), Math.cos(a) * 0.75, Math.sin(a) * 0.75, 0, 0, 0, a - Math.PI / 2, halo); }
    anim(halo, 'pulse', { speed: 1.4, amp: 0.4 });
    disc({ color: '#ffb02e', swirl: '#ffffff', swirl2: '#fff2a0', rim: '#ffe7a8', speed: 1.3, intensity: 1.2 });
    sign(5.25, '#8a6a20', '#ffffff', { hy: 0.62, frame: mat.gold('#ffcf4a'), frameT: 0.09, deco: ['laurel', 'corners'], cornerM: E('#ff3a5a', 1.2) });
    particles({ name: 'PortalGoldfunken', colors: ['#ffe7a8', '#ffffff'], particleSize: 0.06, sizeEnd: 0.02, rate: 6, speed: [0.4, 0.8], lifetime: [1.5, 2.5], spread: [180, 180], size: [2.6, 3, 0.4] }, 0, 1.9, 0.1);
  },

  // ── Juwelnebel ──
  quarzfeld(ctx) { gemArch(ctx, { a: '#f4f0ff', b: '#ffd0e8', disc: '#d8ccff', swirl: '#ffffff', swirl2: '#ff9ad5', bg: '#6a5a8a', base: '#e8e0f0', sparkle: ['#ffffff', '#ff9ad5', '#9fd8ff', '#fff27a'] }); },
  // Amethyst-Geode: Schale aus Granit mit rauer Außenseite und heller Innenkante, Kristalle aus Glas in zwei Tönen
  // und zwei Größen, großer Kristall mit Fuß
  amethystgrotte({ E, sph, oct, cyl, tor, grp, anim, disc, sign, particles, rand, mat }) {
    const shell = mat.granite('#6a5a6a'), shell2 = mat.rock('#8a7a7a'), rim = mat.marble('#d8c8e0');
    arcPoints(14, 1.35, 1.9, -0.5, TAU - 0.9).forEach(([x, y], i) => sph(0.32 + rand() * 0.1, i % 2 ? shell : shell2, x, y, -0.05, undefined, 10).scale.set(1, 0.9, 0.85));
    const edge = tor(1.18, 0.06, rim, 0, DISC_Y, 0.06, TAU - 0.4, 18, 0, 0, -0.5);
    edge.scale.y = 1.38;
    cyl(1.35, 1.5, 0.3, shell, 0, 0.15, 0, 16);
    arcPoints(16, 1.12, 1.62, -0.5, TAU - 0.9).forEach(([x, y, a], i) => {
      const c = oct(0.14 + rand() * 0.06, mat.glass(i % 2 ? '#c98bff' : '#8a4ad8', 0.85, 0.6), x, y, 0.08, 0.65, 1.8, 0.65);
      c.rotation.z = a + Math.PI / 2;
      if (i % 2 === 0) oct(0.08, mat.glass('#ead2ff', 0.85, 0.7), x * 0.93, y * 0.97 + 0.04, 0.14, 0.6, 1.5, 0.6).rotation.z = a + Math.PI / 2 + 0.4;
    });
    cyl(0.18, 0.24, 0.12, shell, 0, 3.4, 0, 8);
    const big = oct(0.32, mat.glass('#d8a0ff', 0.85, 1), 0, 3.85, 0, 0.75, 1.7, 0.75);
    anim(big, 'pulse', { speed: 1.4, amp: 0.4 });
    const spin = grp(0, 3.85, 0);
    for (let k = 0; k < 3; k++) oct(0.08, E('#ff8ae0', 1.4), Math.cos((k / 3) * TAU) * 0.55, 0, Math.sin((k / 3) * TAU) * 0.55, 0.7, 1.4, 0.7, spin);
    anim(spin, 'spin', { speed: 0.9, axis: [0, 1, 0] });
    // Kristallgruppen am Fuß, Glanzadern in der Schale
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) oct(0.12 - k * 0.02, mat.glass(k % 2 ? '#c98bff' : '#8a4ad8', 0.88, 0.6), s * (1.6 + k * 0.15), 0.25, 0.3 - k * 0.12, 0.7, 1.7, 0.7).rotation.z = s * (-0.3 - k * 0.2);
    for (let k = 0; k < 5; k++) { const v = sph(0.03, E('#ff8ae0', 2), Math.cos(k * 1.3) * 1.42, DISC_Y + Math.sin(k * 1.3) * 1.95, 0.12, undefined, 6); anim(v, 'seq', { speed: 2, amp: k }); }
    disc({ color: '#7a3ad8', swirl: '#ead2ff', swirl2: '#ff8ae0', rim: '#c98bff', speed: 1.3 });
    sign(4.8, '#3a2a4a', '#ead2ff', { frame: mat.granite('#6a5a6a'), frameT: 0.1, deco: ['facets', 'corners'], cornerM: mat.glass('#c98bff', 0.9, 0.7) });
    particles({ name: 'PortalSporen', colors: ['#c98bff', '#ead2ff', '#ff8ae0'], particleSize: 0.06, sizeEnd: 0.02, rate: 5, speed: [0.2, 0.4], lifetime: [2, 3.5], spread: [180, 180], size: [2.4, 2.8, 0.4] }, 0, DISC_Y, 0.1);
  },
  // Wüstentor: Sandsteinsäulen mit Basis, Schichtfugen und Kapitell, Topase mit Goldfassung, Bogen mit Leiste,
  // Spitzen als Pyramidchen, großer Topas
  topasduenen({ E, box, cone, oct, tor, cyl, grp, anim, disc, sign, particles, mat, pillar , sph}) {
    const sand = mat.sand('#e0b878'), sand2 = mat.sand('#c8985a'), gold = mat.gold('#e8b040');
    box(3.3, 0.14, 1.0, sand2, 0, 0.07, 0);
    box(3.1, 0.12, 0.88, sand, 0, 0.2, 0);
    for (const s of [-1, 1]) {
      pillar(s * 1.3, 2.9, 0.48, sand, sand2, { y0: 0.26 });
      for (let k = 0; k < 4; k++) box(0.5, 0.03, 0.5, sand2, s * 1.3, 0.7 + k * 0.6, 0);
      for (let k = 0; k < 3; k++) {
        cyl(0.11, 0.11, 0.04, gold, s * 1.3, 0.95 + k * 0.62, 0.25, 8, Math.PI / 2, 0, 0);
        const t = oct(0.09, E('#ffb02e', 1.2), s * 1.3, 0.95 + k * 0.62, 0.3, 0.8, 1.2, 0.6);
        anim(t, 'seq', { speed: 1.8, amp: k * 1.4 + (s > 0 ? 0.7 : 0) });
      }
      cone(0.3, 0.6, sand, s * 1.3, 3.5, 0, 4, 0, Math.PI / 4, 0);
    }
    tor(1.3, 0.25, sand, 0, 3.1, 0, Math.PI, 16);
    tor(1.3, 0.06, sand2, 0, 3.1, 0.23, Math.PI, 16);
    const gem = grp(0, 4.15, 0);
    oct(0.3, mat.glass('#ffcf4a', 0.9, 1), 0, 0, 0, 0.85, 1.5, 0.85, gem);
    tor(0.22, 0.03, gold, 0, 0, 0, TAU, 12, Math.PI / 2, 0, 0, gem);
    anim(gem, 'spin', { speed: 0.7, axis: [0, 1, 0] });
    // Sanddünen am Fuß, Hieroglyphen-Bänder an den Säulen, Kapitell-Topase
    for (const s of [-1, 1]) {
      sph(0.5, mat.sand('#e8c890'), s * 1.5, 0.05, 0.35, undefined, 12).scale.set(1.2, 0.25, 0.7);
      for (let k = 0; k < 4; k++) box(0.08, 0.06, 0.02, mat.sand('#8a5a1a'), s * 1.3 + (k % 2 ? 0.08 : -0.08), 2.4 + k * 0.1, 0.25);
    }
    disc({ color: '#d8901a', swirl: '#fff0b8', swirl2: '#ffd76a', rim: '#ffcf4a', speed: 1.4 });
    sign(5.1, '#e0b878', '#5a3a10', { frame: mat.sand('#c8985a'), frameT: 0.1, deco: ['corners'], cornerM: mat.glass('#ffb02e', 0.9, 0.9) });
    particles({ name: 'PortalSand', colors: ['#ffd76a', '#e0b878'], particleSize: 0.06, sizeEnd: 0.03, rate: 6, speed: [0.6, 1.2], lifetime: [1, 1.8], spread: [70, 70], size: [1.8, 0.2, 0.3] }, 0, 0.3, 0.3);
  },
  // Smaragd-Baumtor: Stämme aus Holz in zwei Abschnitten mit Wurzelansatz, Ast-Bogen mit Wulst, Smaragde aus Glas mit
  // kleineren Begleitern
  smaragdwald({ cyl, cone, tor, oct, grp, anim, disc, sign, particles, rand, mat , M, sph}) {
    const bark = mat.wood('#4a3a2a'), bark2 = mat.wood('#3a2c20');
    for (const s of [-1, 1]) {
      cyl(0.2, 0.3, 1.4, bark, s * 1.27, 0.7, 0, 10, 0, 0, s * -0.04);
      cyl(0.16, 0.2, 1.4, bark2, s * 1.22, 2.0, 0, 10, 0, 0, s * -0.1);
      for (let k = 0; k < 3; k++) {
        const a = (k / 3) * TAU + 0.6;
        cone(0.09, 0.6, bark2, s * 1.27 + Math.cos(a) * 0.28, 0.1, Math.sin(a) * 0.28, 6, Math.sin(a) * 1.25, 0, -Math.cos(a) * 1.25);
      }
    }
    tor(1.24, 0.17, bark, 0, 2.65, 0, Math.PI, 16);
    tor(1.24, 0.06, bark2, 0, 2.65, 0.12, Math.PI, 16);
    const crown = grp(0, 3.4, 0);
    for (let i = 0; i < 8; i++) {
      const a = (i / 7) * Math.PI, x = Math.cos(a) * 1.45, y = Math.sin(a) * 0.6 - 0.2 + rand() * 0.2, z = (rand() - 0.5) * 0.4;
      oct(0.26 + rand() * 0.08, mat.glass(i % 2 ? '#1ec870' : '#3ee08a', 0.88, 0.6), x, y, z, 0.85, 1.3, 0.85, crown);
      oct(0.08, mat.glass('#b4ffd6', 0.85, 0.8), x * 0.85, y + 0.2, z + 0.15, 0.7, 1.2, 0.7, crown);
    }
    anim(crown, 'sway', { speed: 0.65, amp: 0.04, axis: [0, 0, 1] });
    // Ranken mit Smaragdknospen, Moospolster an den Wurzeln
    for (const s of [-1, 1]) {
      for (let k = 0; k < 6; k++) sph(0.055, M('#3a9a5a'), s * (1.27 + Math.sin(k * 1.2) * 0.17), 0.45 + k * 0.38, 0.18, undefined, 8);
      for (let k = 0; k < 2; k++) { const b = oct(0.06, mat.glass('#3ee08a', 0.9, 1), s * 1.42, 0.9 + k * 0.9, 0.2, 0.7, 1.2, 0.7); anim(b, 'pulse', { speed: 1.6 + k * 0.4, amp: 0.4 }); }
      sph(0.25, M('#3f8a3f'), s * 1.45, 0.06, 0.25, undefined, 10).scale.y = 0.35;
    }
    disc({ color: '#1ea860', swirl: '#d9ff7a', swirl2: '#b4ffd6', rim: '#3ee08a', speed: 1.1 });
    sign(4.65, '#3a2c20', '#b4ffd6', { frame: mat.wood('#2a2018'), frameT: 0.1, deco: ['corners', 'vines'], cornerM: mat.glass('#1ec870', 0.9, 0.7) });
    particles({ name: 'PortalGluehwuermchen', colors: ['#d9ff7a', '#b4ffd6'], particleSize: 0.07, sizeEnd: 0.04, rate: 4, speed: [0.1, 0.3], lifetime: [3, 6], spread: [180, 180], size: [2.4, 2.6, 0.6] }, 0, 1.7, 0.3);
  },
  // Pagoden-Tor (Torii): Jade-Pfosten mit Steinfuß und Metallring, Querbalken mit Keilen, geschwungenes Dach in fünf
  // Stücken mit Spitzen, Tafel mit Rahmen, Laternen mit Deckel und Quaste
  jadetempel({ M, E, box, cyl, sph, grp, anim, disc, sign, particles, mat , tor}) {
    const jade = mat.marble('#3aa878'), dark = mat.wood('#1a4a3a'), red = M('#c8302a'), stone = mat.stone('#8a9488'), gold = mat.gold('#e0b040');
    for (const s of [-1, 1]) {
      cyl(0.17, 0.21, 3.2, jade, s * 1.3, 1.8, 0, 12);
      cyl(0.3, 0.32, 0.22, stone, s * 1.3, 0.11, 0, 8);
      cyl(0.23, 0.23, 0.06, gold, s * 1.3, 0.26, 0, 12);
      cyl(0.21, 0.21, 0.05, gold, s * 1.3, 2.9, 0, 12);
    }
    box(3.3, 0.18, 0.28, jade, 0, 2.95, 0);
    for (const s of [-1, 1]) box(0.12, 0.26, 0.34, dark, s * 1.3, 2.95, 0); // Keile
    // Dach (Kasagi) in fünf Stücken, außen nach oben geschwungen, mit Spitzen
    box(1.6, 0.24, 0.42, dark, 0, 3.4, 0);
    for (const s of [-1, 1]) {
      box(0.7, 0.23, 0.41, dark, s * 1.1, 3.43, 0, 0, 0, s * 0.1);
      box(0.6, 0.21, 0.4, dark, s * 1.68, 3.53, 0, 0, 0, s * 0.3);
      box(0.12, 0.06, 0.42, gold, s * 1.97, 3.65, 0, 0, 0, s * 0.3);
    }
    box(2.7, 0.06, 0.46, mat.marble('#2a7a58'), 0, 3.53, 0);
    box(0.46, 0.46, 0.06, gold, 0, 3.15, 0.15);
    box(0.4, 0.4, 0.08, red, 0, 3.15, 0.18);
    for (const s of [-1, 1]) {
      const lt = grp(s * 0.9, 2.85, 0.2);
      cyl(0.01, 0.01, 0.2, dark, 0, -0.1, 0, 4, 0, 0, 0, lt);
      cyl(0.06, 0.1, 0.05, dark, 0, -0.18, 0, 8, 0, 0, 0, lt);
      sph(0.16, E('#ff6a3a', 1.2), 0, -0.34, 0, lt, 14).scale.y = 1.25;
      for (const y of [-0.27, -0.41]) cyl(0.155, 0.155, 0.015, dark, 0, y, 0, 12, 0, 0, 0, lt);
      cyl(0.05, 0.08, 0.04, dark, 0, -0.55, 0, 8, 0, 0, 0, lt);
      cyl(0.01, 0.02, 0.12, M('#e0b040'), 0, -0.63, 0, 4, 0, 0, 0, lt); // Quaste
      anim(lt, 'sway', { speed: 1.0, amp: 0.13, axis: [0, 0, 1] });
    }
    // Wolkenmuster am Dach, Steinlöwen am Fuß, Glöckchen an den Dachspitzen
    for (const s of [-1, 1]) {
      const li = grp(s * 1.75, 0, 0.35);
      box(0.3, 0.12, 0.3, mat.stone('#8a9488'), 0, 0.06, 0, 0, 0, 0, li);
      sph(0.13, mat.stone('#9aa498'), 0, 0.25, 0, li, 10);
      sph(0.09, mat.stone('#9aa498'), 0, 0.42, 0.05, li, 10);
      const bell = grp(s * 1.97, 3.55, 0.1);
      cyl(0.04, 0.06, 0.08, mat.gold('#e0b040'), 0, -0.06, 0, 8, 0, 0, 0, bell);
      anim(bell, 'sway', { speed: 2.5, amp: 0.25, axis: [0, 0, 1] });
    }
    for (let k = 0; k < 4; k++) tor(0.07, 0.015, mat.gold('#e0b040'), -0.6 + k * 0.4, 3.4, 0.22, Math.PI, 6);
    disc({ color: '#2a9a6a', swirl: '#d8ffe8', swirl2: '#ffb8d0', rim: '#5ad8a0', speed: 1.1 });
    sign(4.3, '#a8201a', '#ffd76a', { z: 0.6, frame: mat.gold('#e0b040'), frameT: 0.06, w: 1.7, h: 0.55, deco: ['tassels'] });
    particles({ name: 'PortalKirschblueten', colors: ['#ffb8d0', '#ffd8e8', '#ffffff'], particleSize: 0.08, sizeEnd: 0.08, rate: 3, speed: [0.2, 0.4], lifetime: [3, 5], spread: [50, 50], direction: 'Bottom', lightEmission: 0.2, size: [3, 0.2, 0.6], acceleration: [0.1, -0.08, 0.05] }, 0, 3.6, 0.2);
  },
  // Wassertor: Marmorsockel mit Stufe, Saphire aus Glas mit Silberfassung, Wasservorhänge in zwei Schichten,
  // Becken mit Rand, Saphir oben mit Fassung
  saphirsee({ E, box, cyl, oct, tor, grp, anim, disc, sign, particles, rand, mat , M, sph}) {
    const stone = mat.marble('#c8d4e8'), stone2 = mat.marble('#aebcd8'), silver = mat.metal('#d8e0ec');
    box(3.3, 0.14, 1.0, stone2, 0, 0.07, 0);
    box(3.1, 0.12, 0.88, stone, 0, 0.2, 0);
    for (const [x, y, a] of arcPoints(11, 1.32, 1.88)) {
      const c = oct(0.18 + rand() * 0.05, mat.glass(rand() < 0.5 ? '#2a5ae8' : '#5a8aff', 0.9, 0.7), x, y, 0, 0.75, 1.5, 0.75);
      c.rotation.z = a - Math.PI / 2;
      tor(0.12, 0.025, silver, x * 0.92, y * 0.97 + 0.03, 0.05, TAU, 8, 0, 0, 0);
    }
    for (const s of [-1, 1]) {
      const w = box(0.25, 3.0, 0.05, E('#8ac8ff', 0.6, { transparent: true, opacity: 0.5 }), s * 1.6, 1.7, 0.1);
      anim(w, 'pulse', { speed: 3, amp: 0.35 });
      const w2 = box(0.15, 3.0, 0.04, E('#d8f0ff', 0.8, { transparent: true, opacity: 0.45 }), s * 1.6, 1.7, 0.14);
      anim(w2, 'pulse', { speed: 3.7, amp: 0.45 });
    }
    cyl(0.98, 0.98, 0.08, stone2, 0, 0.3, 0.4, 18).scale.z = 0.5;
    const pool = tor(0.9, 0.05, E('#bfe0ff', 1, { transparent: true, opacity: 0.7 }), 0, 0.36, 0.4, TAU, 16, Math.PI / 2, 0, 0);
    pool.scale.y = 0.5;
    anim(pool, 'pulse', { speed: 2.0, amp: 0.55 });
    const gem = grp(0, 3.85, 0);
    oct(0.28, mat.glass('#3a6aff', 0.9, 1.1), 0, 0, 0, 0.85, 1.4, 0.85, gem);
    tor(0.2, 0.03, silver, 0, 0, 0, TAU, 12, Math.PI / 2, 0, 0, gem);
    anim(gem, 'spin', { speed: 0.6, axis: [0, 1, 0] });
    // Seerosen im Becken, Wellenkämme, Tropfen-Laternen an den Seiten
    for (const [x, c] of [[-0.45, '#ff9ad5'], [0.35, '#ffffff']]) { const lily = grp(x, 0.37, 0.45); cyl(0.12, 0.12, 0.015, M('#3a9a5a'), 0, 0, 0, 10, 0, 0, 0, lily); sph(0.05, M(c), 0, 0.04, 0, lily, 8); anim(lily, 'bob', { speed: 1.2, amp: 0.015 }); }
    for (const s of [-1, 1]) { const d = sph(0.08, mat.glass('#8ac8ff', 0.8, 1), s * 1.8, 2.6, 0.1, undefined, 10); d.scale.y = 1.4; anim(d, 'pulse', { speed: 1.5, amp: 0.4 }); }
    disc({ color: '#1a4ac8', swirl: '#cfe0ff', swirl2: '#ffffff', rim: '#5a8aff', speed: 1.3 });
    sign(4.8, '#1a3a8a', '#ffffff', { frame: mat.metal('#d8e0ec'), frameT: 0.07, deco: ['corners'], cornerM: mat.glass('#8ac8ff', 0.85, 0.8) });
    particles({ name: 'PortalTropfen', colors: ['#cfe0ff', '#ffffff'], particleSize: 0.06, sizeEnd: 0.04, rate: 6, speed: [0.4, 0.8], lifetime: [1, 1.6], spread: [20, 20], direction: 'Bottom', size: [3.2, 0.2, 0.2], acceleration: [0, -1.5, 0] }, 0, 3.2, 0.1);
  },
  // Rubin-Vulkantor: sechseckige Basaltsäulen mit Glutfugen, Rubine aus Glas, Bogen mit Glutkante, Rubin mit Fassung
  rubinvulkan({ E, cyl, cone, oct, tor, grp, anim, disc, sign, particles, rand, mat , box}) {
    const rock = mat.basalt('#3a2a30'), rock2 = mat.basalt('#4a3640'), glow = E('#ff3a5a', 1.6), gold = mat.gold('#d89040');
    for (const s of [-1, 1]) {
      for (let k = 0; k < 4; k++) cyl(0.3 - k * 0.015, 0.32 - k * 0.015, 0.72, k % 2 ? rock2 : rock, s * 1.3, 0.36 + k * 0.72, 0, 6, 0, rand(), 0);
      for (let k = 1; k < 4; k++) {
        const f = cyl(0.31 - k * 0.015, 0.31 - k * 0.015, 0.04, glow, s * 1.3, k * 0.72, 0, 6);
        anim(f, 'pulse', { speed: 1.7, amp: 0.4 });
      }
      for (let k = 0; k < 2; k++) oct(0.13, mat.glass('#e8183a', 0.92, 0.9), s * 1.55, 0.7 + k * 1.2, 0.25, 0.75, 1.4, 0.75);
    }
    tor(1.3, 0.3, rock, 0, 2.85, 0, Math.PI, 14);
    const edge = tor(1.3, 0.06, glow, 0, 2.85, 0.27, Math.PI, 14);
    anim(edge, 'pulse', { speed: 1.5, amp: 0.4 });
    const ruby = grp(0, 3.95, 0);
    oct(0.32, mat.glass('#ff1a4a', 0.94, 1.2), 0, 0, 0, 0.85, 1.3, 0.85, ruby);
    tor(0.24, 0.035, gold, 0, 0, 0, TAU, 12, Math.PI / 2, 0, 0, ruby);
    anim(ruby, 'spin', { speed: 0.55, axis: [0, 1, 0] });
    for (const s of [-1, 1]) cone(0.32, 0.6, rock2, s * 1.62, 0.3, 0.15, 6);
    // Glutadern im Bogen, Rubinsplitter am Fuß, Glutdunst
    for (let k = 0; k < 7; k++) { const a = (k / 6) * Math.PI, v = box(0.04, 0.22, 0.03, E('#ff3a5a', 1.6), Math.cos(a) * 1.3, 2.85 + Math.sin(a) * 1.3, 0.3, 0, 0, a); anim(v, 'seq', { speed: 1.5, amp: k * 0.7 }); }
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) oct(0.06, mat.glass('#ff3a5a', 0.9, 1), s * (1.0 + k * 0.25), 0.08, 0.5 - k * 0.1, 0.8, 1.2, 0.8);
    disc({ color: '#c81a3a', swirl: '#ffb07a', swirl2: '#ff3a5a', rim: '#ff6a8a', speed: 1.4, intensity: 1.1 });
    sign(4.85, '#141012', '#ff9a9a', { z: 0.55, frame: mat.basalt('#3a2a30'), frameT: 0.1, inner: E('#ff3a5a', 1.6), deco: ['corners'], cornerM: mat.glass('#e8183a', 0.92, 1) });
    particles({ name: 'PortalFunken', colors: ['#ffb07a', '#ff3a5a'], particleSize: 0.07, sizeEnd: 0.03, rate: 5, speed: [1, 1.8], lifetime: [0.8, 1.3], spread: [30, 30], size: [0.5, 0.1, 0.5], acceleration: [0, -1, 0] }, 0, 4.1, 0);
  },
  // Opal-Wolkentor: Opalwolken aus mehreren Bäuschen mit Schimmer (Glas), Regenbogenbögen sauber gestaffelt
  opalwolken({ M, E, sph, grp, anim, disc, sign, particles, rand, mat }) {
    const cols = ['#ffd0f0', '#d0e8ff', '#d8ffe8', '#fff2c8', '#e8d0ff'];
    sph(1.2, mat.marble('#f4f0ff'), 0, 0.1, 0, undefined, 14).scale.set(1.4, 0.35, 0.8);
    arcPoints(9, 1.35, 1.9).forEach(([x, y], i) => {
      const r = 0.36 + rand() * 0.12, c = cols[i % cols.length];
      sph(r, mat.marble(c), x, y - r * 0.2, -0.05, undefined, 12);
      const top = sph(r * 0.8, mat.glass(cols[(i + 2) % cols.length], 0.75, 0.35), x, y + r * 0.2, 0.08, undefined, 12);
      if (i % 2 === 0) anim(top, 'pulse', { speed: 1.2 + i * 0.15, amp: 0.25 });
    });
    const rb = grp(0, DISC_Y, -0.15);
    ['#ff5a5a', '#ffb02e', '#ffe25f', '#5aff8a', '#5ad1ff', '#b07bff'].forEach((c, i) => {
      const t = new THREE.Mesh(new THREE.TorusGeometry(1.6 + i * 0.085, 0.04, 4, 18, Math.PI), E(c, 0.9, { transparent: true, opacity: 0.75 }));
      t.userData.rbx = { segs: 14 };
      rb.add(t);
    });
    anim(rb, 'pulse', { speed: 1.1, amp: 0.35 });
    // Schimmerperlen um den Bogen, kleine Opal-Wölkchen schweben
    for (let k = 0; k < 7; k++) { const a = (k / 6) * Math.PI, pr = sph(0.04, E(['#ffd0f0', '#d0e8ff', '#d8ffe8', '#fff2c8'][k % 4], 1.4), Math.cos(a) * 1.15, DISC_Y + Math.sin(a) * 1.7, 0.2, undefined, 8); anim(pr, 'seq', { speed: 1.8, amp: k * 0.9 }); }
    for (const s of [-1, 1]) { const c = grp(s * 1.75, 2.6, 0.3); sph(0.18, mat.glass('#ffd0f0', 0.8, 0.4), 0, 0, 0, c, 10); sph(0.13, mat.glass('#d0e8ff', 0.8, 0.4), s * 0.15, -0.05, 0, c, 10); anim(c, 'bob', { speed: 0.9, amp: 0.12 }); }
    disc({ color: '#c8a8f4', swirl: '#ffffff', swirl2: '#ffd0f0', rim: '#e8d0ff', speed: 1.1 });
    sign(4.75, '#f4f0ff', '#6a5a9a', { hy: 0.65, z: 0.6, frame: mat.marble('#e8e0f8'), frameT: 0.07, deco: ['rainbow', 'pearls'] });
    particles({ name: 'PortalSchimmer', colors: ['#ffd0f0', '#d0e8ff', '#fff2c8'], particleSize: 0.07, sizeEnd: 0.02, rate: 5, speed: [0.2, 0.4], lifetime: [2, 3], spread: [180, 180], size: [2.6, 2.8, 0.4] }, 0, DISC_Y, 0.1);
    void M;
  },
  // Diamant-Tor: Sockel als achteckiger Schliff mit Fase, Facettenkranz aus Glas, Brillant oben mit Krone und
  // Unterteil, Facettenblitze
  diamantkern({ E, cyl, oct, grp, anim, disc, sign, particles, mat , box}) {
    const dia = mat.glass('#e8fdff', 0.82, 0.5), base = mat.marble('#c8e8f0');
    cyl(1.3, 1.5, 0.22, base, 0, 0.11, 0, 8);
    cyl(1.1, 1.3, 0.12, mat.metal('#d8f0f8'), 0, 0.28, 0, 8);
    const ring = grp(0, DISC_Y, 0);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU;
      const d = oct(0.24, dia, Math.cos(a) * 1.3, Math.sin(a) * 1.3, 0, 0.85, 1.6, 0.85, ring);
      d.rotation.z = a + Math.PI / 2;
    }
    anim(ring, 'spin', { speed: 0.2, axis: [0, 0, 1] });
    const top = grp(0, 3.65, 0);
    cyl(0.2, 0.32, 0.1, dia, 0, 0.17, 0, 8, 0, 0, 0, top); // Tafel
    cyl(0.32, 0.4, 0.12, dia, 0, 0.06, 0, 8, 0, 0, 0, top); // Krone
    cyl(0.4, 0.01, 0.45, dia, 0, -0.22, 0, 8, 0, 0, 0, top); // Pavillon
    anim(top, 'spin', { speed: 0.7, axis: [0, 1, 0] });
    for (let k = 0; k < 4; k++) {
      const f = oct(0.06, E('#ffffff', 2.4), [-1.1, 1.0, -0.8, 1.2][k], [2.6, 2.3, 0.6, 0.9][k], 0.25, 0.5, 1.5, 0.5);
      anim(f, 'seq', { speed: 2.4, amp: k * 1.6 });
    }
    // zweiter, gegenläufiger Facettenkranz innen, Lichtbrechungsstrahlen
    const ring2 = grp(0, DISC_Y, 0.08);
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + 0.3; const d = oct(0.12, mat.glass('#ffffff', 0.8, 0.8), Math.cos(a) * 1.12, Math.sin(a) * 1.12, 0, 0.8, 1.4, 0.8, ring2); d.rotation.z = a + Math.PI / 2; }
    anim(ring2, 'spin', { speed: -0.35, axis: [0, 0, 1] });
    for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU, r = box(0.03, 0.6, 0.01, E(['#ff9ad5', '#8af0ff', '#fff27a'][k % 3], 1.2, { transparent: true, opacity: 0.6 }), Math.cos(a) * 0.5, 3.65 + Math.sin(a) * 0.5, 0, 0, 0, a - Math.PI / 2); anim(r, 'pulse', { speed: 2, amp: 0.5 }); }
    disc({ color: '#8af0ff', swirl: '#ffffff', swirl2: '#c84ad8', rim: '#e8fdff', speed: 1.3, intensity: 1.1 });
    sign(4.55, '#e8fdff', '#2a5a6a', { hy: 0.6, frame: mat.glass('#c8f0ff', 0.85, 0.5), frameT: 0.07, deco: ['facets', 'corners'], cornerM: mat.glass('#ffffff', 0.85, 1) });
    particles({ name: 'PortalRegenbogen', colors: ['#ffffff', '#8af0ff', '#ff9ad5', '#fff27a'], particleSize: 0.06, sizeEnd: 0.02, rate: 6, speed: [0.3, 0.6], lifetime: [1.5, 2.5], spread: [180, 180], size: [2.6, 2.8, 0.4] }, 0, DISC_Y, 0.1);
  },
};

// Metall leicht glänzend auf der Webseite (Roblox: Metal)
function T2(m) {
  m.emissive = new THREE.Color('#e8ecf8');
  m.emissiveIntensity = 0.25;
  return m;
}

// Kristallbogen (Quarzfeld): Sockel aus Marmor mit Stufe, Kristalle aus Glas in zwei Tönen mit Begleitern,
// schwebender Kristall mit Splittern
function gemArch({ sph, E, box, oct, grp, anim, disc, sign, particles, rand, mat }, o) {
  box(3.3, 0.14, 1.0, mat.marble(o.base), 0, 0.07, 0);
  box(3.1, 0.12, 0.88, mat.marble('#f4f0fa'), 0, 0.2, 0);
  arcPoints(11, 1.32, 1.88).forEach(([x, y, a], i) => {
    const c = oct(0.2 + rand() * 0.07, mat.glass(i % 2 ? o.a : o.b, 0.88, 0.5), x, y, 0, 0.75, 1.7, 0.75);
    c.rotation.z = a - Math.PI / 2;
    if (i % 2 === 0) oct(0.1, mat.glass(o.b, 0.85, 0.6), x * 1.1, y + 0.05, 0.12, 0.7, 1.5, 0.7).rotation.z = a - Math.PI / 2 + 0.45;
  });
  for (const s of [-1, 1]) {
    oct(0.35, mat.glass(o.a, 0.88, 0.5), s * 1.62, 0.65, 0.1, 0.75, 2, 0.75).rotation.z = s * -0.25;
    oct(0.2, mat.glass(o.b, 0.88, 0.5), s * 1.72, 0.38, 0.3, 0.75, 1.5, 0.75).rotation.z = s * -0.5;
  }
  const top = grp(0, 3.8, 0);
  oct(0.28, mat.glass(o.a, 0.9, 1), 0, 0, 0, 0.75, 1.6, 0.75, top);
  anim(top, 'spin', { speed: 0.6, axis: [0, 1, 0] });
  const sp = grp(0, 3.8, 0);
  for (let k = 0; k < 4; k++) oct(0.07, E(o.sparkle[k % o.sparkle.length], 1.6), Math.cos((k / 4) * TAU) * 0.6, 0, Math.sin((k / 4) * TAU) * 0.6, 0.6, 1.2, 0.6, sp);
  anim(sp, 'spin', { speed: -1.1, axis: [0, 1, 0] });
  disc({ color: o.disc, swirl: o.swirl, swirl2: o.swirl2, rim: o.a, speed: 1.2 });
  sign(4.75, '#f4eaff', '#6a5a8a', { frame: mat.metal('#d8dce8'), frameT: 0.07, deco: ['corners'], cornerM: mat.glass(o.b, 0.9, 0.8) });
  // Kristallgruppen am Fuß und Funkelpunkte im Bogen
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) oct(0.11 - k * 0.02, mat.glass(k % 2 ? o.a : o.b, 0.88, 0.6), s * (1.0 + k * 0.2), 0.28, 0.4 - k * 0.1, 0.7, 1.6, 0.7).rotation.z = s * (-0.2 - k * 0.2);
  for (let k = 0; k < 6; k++) { const a = (k / 5) * Math.PI, f = sph(0.03, E(o.sparkle[k % o.sparkle.length], 2), Math.cos(a) * 1.5, DISC_Y + Math.sin(a) * 2.05, 0.1, undefined, 6); anim(f, 'seq', { speed: 2.2, amp: k }); }
  particles({ name: 'PortalFunkeln', colors: o.sparkle, particleSize: 0.06, sizeEnd: 0.02, rate: 6, speed: [0.3, 0.6], lifetime: [1.5, 2.5], spread: [180, 180], size: [2.6, 2.8, 0.4] }, 0, DISC_Y, 0.1);
}
