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
  const cyl = (rt, rb, h, m, x, y, z, seg = 12, rx, ry, rz, p) => add(new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m), x, y, z, rx, ry, rz, p);
  const sph = (r, m, x, y, z, p, seg = 12) => add(new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.max(6, seg * 0.6 | 0)), m), x, y, z, 0, 0, 0, p);
  const cone = (r, h, m, x, y, z, seg = 8, rx, ry, rz, p) => add(new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), m), x, y, z, rx, ry, rz, p);
  const tor = (R, r, m, x, y, z, arc = TAU, seg = 16, rx, ry, rz, p) => {
    const t = add(new THREE.Mesh(new THREE.TorusGeometry(R, r, 6, seg, arc), m), x, y, z, rx, ry, rz, p);
    t.userData.rbx = { segs: Math.max(4, Math.min(seg, 18)) }; // so viele Stücke auch in Roblox
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
      else if (type === 'seq') for (const [m, , e0] of mats) m.emissiveIntensity = Math.sin(t * speed - amp) > 0 ? e0 : e0 * 0.15;
    });
    return obj;
  };
  const particles = (spec, x, y, z) => {
    const marker = grp(x, y, z);
    emit.push({ marker, spec: { keep: true, direction: 'Top', spread: [25, 25], lightEmission: 1, ...spec } });
  };

  // ── Portalscheibe, Strudel, Leuchtrand ──
  const disc = ({ color, swirl = '#ffffff', swirl2, rim = color, speed = 1.4, opacity = 0.8, intensity = 0.9 } = {}) => {
    const d = at(new THREE.Mesh(new THREE.CircleGeometry(1.0, 28), E(color, intensity, { transparent: true, opacity, side: THREE.DoubleSide })), 0, DISC_Y, 0);
    d.scale.y = DISC_SY;
    d.userData.rbx = { name: `Portal_${id}` };
    g.add(d);
    // Strudel: drei Lichtbögen, die sich drehen (rund, damit die Drehung in Roblox gleich aussieht)
    const sw = grp(0, DISC_Y, 0.04);
    [[0.32, 0], [0.58, 2.1], [0.84, 4.2]].forEach(([r, a], i) => {
      tor(r, 0.045, E(i === 1 && swirl2 ? swirl2 : swirl, 1.2, { transparent: true, opacity: 0.75 }), 0, 0, 0, Math.PI * 1.1, i === 0 ? 4 : 6, 0, 0, a, sw);
    });
    anim(sw, 'spin', { speed, axis: [0, 0, 1] });
    // innerer Gegenstrudel, kleiner und schneller
    const sw2 = grp(0, DISC_Y, 0.06);
    tor(0.2, 0.035, E(swirl2 || swirl, 1.4, { transparent: true, opacity: 0.8 }), 0, 0, 0, Math.PI * 1.3, 4, 0, 0, 0, sw2);
    anim(sw2, 'spin', { speed: -speed * 1.8, axis: [0, 0, 1] });
    // Leuchtrand pulsiert
    const rm = tor(1.0, 0.055, E(rim, 1.5, { transparent: true, opacity: 0.85 }), 0, DISC_Y, 0.02, TAU, 12);
    rm.scale.y = DISC_SY;
    anim(rm, 'pulse', { speed: 2.2, amp: 0.6 });
    return d;
  };
  // Kette mit Schloss vor dem Tor (PortalFx zeigt sie nur bei gesperrten Welten)
  const lock = () => {
    const lk = grp(0, 0, 0.16);
    const chain = M('#8a8f9a', { metalness: 0.7, roughness: 0.35 });
    for (const s of [-1, 1]) cyl(0.05, 0.05, 2.6, chain, 0, DISC_Y, 0, 6, 0, 0, s * 0.62, lk);
    box(0.42, 0.36, 0.14, M('#d8b040', { metalness: 0.7, roughness: 0.3 }), 0, DISC_Y - 0.1, 0.06, 0, 0, 0, lk);
    tor(0.13, 0.035, chain, 0, DISC_Y + 0.14, 0.06, Math.PI, 8, 0, 0, 0, lk);
    lk.userData.pfx = { id, type: 'lock', speed: 0, amp: 0, axis: [0, 0, 1] };
  };
  const sign = (y = 4.3, bg = '#1e1a26', fg = world.accent) => {
    const g2 = galaxyOfWorld(world).id === 'g2';
    const price = world.soon ? 'Bald' : world.price ? `${fmtShort(world.price)} ${g2 ? 'Staub' : 'Moneten'}` : 'Gratis';
    const s = signBoard(world.soon ? 'Coming soon' : world.name, { w: 2.3, h: 0.62, bg, fg, sub: price });
    s.position.set(0, y, 0);
    g.add(s);
  };

  const build = DESIGNS[id] || DESIGNS._default;
  build({ g, world, planetColor, rand, M, E, add, box, cyl, sph, cone, tor, oct, grp, anim, particles, disc, sign });
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

const DESIGNS = {
  // Ersatz für Welten ohne eigenes Design
  _default({ g, M, box, tor, disc, sign, planetColor, world }) {
    const stone = M('#4a4458'), trim = M(planetColor, { metalness: 0.4, roughness: 0.4 });
    for (const x of [-1.2, 1.2]) box(0.4, 2.4, 0.5, stone, x, 1.2, 0);
    tor(1.2, 0.22, trim, 0, 2.4, 0, Math.PI, 14);
    disc({ color: world.accent });
    sign();
  },

  // ── Planet 1 ──
  // Holztor mit Windmühle: Bauerntor aus Balken, oben ein Windrad, das sich dreht; sanfter Himmelsstrudel
  normal({ M, E, box, cyl, cone, grp, anim, disc, sign, particles }) {
    const wood = M('#8a5a32'), dark = M('#5a3a20'), roof = M('#c8402e');
    for (const s of [-1, 1]) {
      box(0.32, 3.2, 0.32, wood, s * 1.25, 1.6, 0);
      box(0.12, 1.4, 0.1, dark, s * 1.25, 0.9, 0.18, 0, 0, s * 0.5);
      box(0.5, 0.18, 0.5, M('#9a9488'), s * 1.25, 0.09, 0);
    }
    box(3.0, 0.28, 0.36, wood, 0, 3.2, 0);
    box(2.6, 0.12, 0.3, dark, 0, 2.95, 0.02);
    // Dächlein mit Windmühle
    cone(1.7, 0.7, roof, 0, 3.7, 0, 4, 0, Math.PI / 4, 0).scale.set(1, 1, 0.35);
    cyl(0.18, 0.22, 0.7, M('#efe6d0'), 0, 4.0, 0, 8);
    const rotor = grp(0, 4.15, 0.28);
    for (let i = 0; i < 4; i++) {
      const arm = grp(0, 0, 0, rotor);
      arm.rotation.z = (i / 4) * TAU;
      box(0.08, 0.95, 0.04, dark, 0, 0.5, 0, 0, 0, 0, arm);
      box(0.28, 0.7, 0.03, M('#f4ecd8'), 0.14, 0.6, 0.02, 0, 0, 0, arm);
    }
    cyl(0.07, 0.07, 0.12, dark, 0, 0, 0, 8, Math.PI / 2, 0, 0, rotor);
    anim(rotor, 'spin', { speed: 1.1, axis: [0, 0, 1] });
    // Blumenkästen
    for (const s of [-1, 1]) {
      box(0.6, 0.2, 0.3, dark, s * 1.25, 0.45, 0.32);
      for (let k = -1; k <= 1; k++) cyl(0.07, 0.07, 0.06, E(['#ff5a8a', '#ffd84a', '#ffffff'][k + 1], 0.4), s * 1.25 + k * 0.18, 0.6, 0.32, 8);
    }
    disc({ color: '#8ad8ff', swirl: '#ffffff', swirl2: '#d8f4ff', rim: '#ffe28a', speed: 1.0 });
    sign(4.95, '#5a3a20', '#ffe7a8');
    particles({ name: 'PortalBlueten', colors: ['#ffd84a', '#ff8ac8', '#ffffff'], particleSize: 0.12, sizeEnd: 0.1, rate: 3, speed: [0.3, 0.6], lifetime: [3, 5], spread: [40, 40], size: [1.6, 0.2, 0.4], acceleration: [0, -0.05, 0.1] }, 0, 0.6, 0.4);
  },
  // Baumtor: zwei Bäume wachsen zum Bogen zusammen, Wurzeln und Pilze; Blätterstrudel mit Glühwürmchen
  wald({ M, E, cyl, sph, tor, grp, anim, disc, sign, particles, rand }) {
    const bark = M('#6b4a2e'), leaf = M('#3f8a3f'), leaf2 = M('#5aa84a');
    for (const s of [-1, 1]) {
      cyl(0.2, 0.32, 2.6, bark, s * 1.25, 1.3, 0, 7, 0, 0, s * -0.08);
      for (let k = 0; k < 3; k++) cyl(0.05, 0.12, 0.9, bark, s * (1.25 + 0.25 * (k - 1)), 0.2, 0.25 * (k - 1), 5, 0.5 * (k - 1), 0, s * 0.9);
      // Pilze am Fuß
      cyl(0.03, 0.04, 0.2, M('#f0e8d8'), s * 1.65, 0.1, 0.3, 6);
      sph(0.12, E('#e0433a', 0.3), s * 1.65, 0.22, 0.3).scale.y = 0.5;
    }
    tor(1.25, 0.2, bark, 0, 2.55, 0, Math.PI, 12);
    // Blätterkrone, wiegt sich leicht
    const crown = grp(0, 3.4, 0);
    for (let i = 0; i < 9; i++) {
      const a = (i / 8) * Math.PI;
      sph(0.55 + rand() * 0.2, i % 2 ? leaf : leaf2, Math.cos(a) * 1.4, Math.sin(a) * 0.55 - 0.2, (rand() - 0.5) * 0.4, crown, 8);
    }
    anim(crown, 'sway', { speed: 0.9, amp: 0.05, axis: [0, 0, 1] });
    disc({ color: '#4ac86a', swirl: '#c8ff8a', swirl2: '#8affc8', rim: '#d9ff7a', speed: 1.2 });
    sign(4.5, '#2f5a2a', '#e8ffd0');
    particles({ name: 'PortalGluehwuermchen', colors: ['#e8ff7a', '#b4ffd6'], particleSize: 0.08, sizeEnd: 0.05, rate: 4, speed: [0.1, 0.3], lifetime: [3, 6], spread: [180, 180], size: [2.2, 2.4, 0.6] }, 0, 1.6, 0.3);
  },
  // U-Bahn-Eingang: Treppe nach unten mit Geländer und Schild, Lichtstreifen rasen durch wie ein Zug
  stadt({ M, E, box, cyl, grp, anim, disc, sign, particles }) {
    const tile = M('#d8dce4'), metal = M('#4a5060', { metalness: 0.6, roughness: 0.35 }), green = M('#2a8a5a');
    // Rahmen wie ein Bahnhofseingang
    for (const s of [-1, 1]) {
      box(0.36, 3.0, 0.5, tile, s * 1.3, 1.5, 0);
      box(0.4, 0.1, 0.55, metal, s * 1.3, 3.0, 0);
      // Geländer
      box(0.06, 0.06, 1.2, metal, s * 1.15, 1.0, 0.65, -0.45, 0, 0);
      for (const z of [0.2, 1.1]) cyl(0.03, 0.03, 0.9, metal, s * 1.15, 0.6 + (1.1 - z) * 0.4, z, 6);
    }
    box(3.0, 0.5, 0.5, green, 0, 3.25, 0);
    // U-Schild (blau, leuchtend)
    box(0.55, 0.55, 0.1, E('#2a6ae8', 0.9), 0, 3.25, 0.28);
    box(0.12, 0.32, 0.04, E('#ffffff', 1), -0.1, 3.25, 0.34);
    box(0.12, 0.32, 0.04, E('#ffffff', 1), 0.1, 3.25, 0.34);
    box(0.32, 0.1, 0.04, E('#ffffff', 1), 0, 3.12, 0.34);
    // Stufen hinab ins Portal
    for (let k = 0; k < 4; k++) box(2.3, 0.12, 0.3, M('#8a8f9a'), 0, 0.42 - k * 0.12, 0.85 - k * 0.3);
    // Lichtstreifen wie ein vorbeirasender Zug (der Reihe nach an/aus)
    for (let k = 0; k < 6; k++) {
      const l = box(0.28, 0.08, 0.06, E('#ffe27a', 1.8), -0.85 + k * 0.34, 2.75, 0.28);
      anim(l, 'seq', { speed: 7, amp: k * 0.9 });
    }
    disc({ color: '#5a6ae8', swirl: '#ff7ad8', swirl2: '#7ad0ff', rim: '#ffe27a', speed: 2.2 });
    sign(4.15, '#2a8a5a', '#ffffff');
    particles({ name: 'PortalStadtlicht', colors: ['#ff7ad8', '#7ad0ff', '#ffe27a'], particleSize: 0.07, sizeEnd: 0.03, rate: 5, speed: [0.6, 1.2], lifetime: [0.8, 1.4], spread: [60, 60], size: [1.6, 0.2, 0.2] }, 0, 0.3, 0.3);
  },
  // Eiskristall-Tor: Bogen aus großen Eiskristallen, Schneesturm im Portal, Schneeflocken fallen heraus
  eis({ M, E, box, oct, grp, anim, disc, sign, particles, rand }) {
    const ice = E('#bfeeff', 0.35, { transparent: true, opacity: 0.88, roughness: 0.15 }), ice2 = E('#e8fbff', 0.5, { transparent: true, opacity: 0.9, roughness: 0.1 });
    box(3.0, 0.22, 0.8, M('#e8f4ff'), 0, 0.11, 0);
    for (const [x, y, a] of arcPoints(9, 1.3, 1.85)) oct(0.32 + rand() * 0.1, rand() < 0.5 ? ice : ice2, x, y, 0, 0.8, 1.9, 0.8).rotation.z = a - Math.PI / 2;
    // große Spitzen außen
    for (const s of [-1, 1]) {
      oct(0.45, ice, s * 1.55, 0.9, 0, 0.8, 2.4, 0.8).rotation.z = s * -0.2;
      oct(0.26, ice2, s * 1.68, 0.45, 0.2, 0.8, 1.5, 0.8).rotation.z = s * -0.5;
    }
    // Schneeflocken-Stern oben, dreht sich
    const star = grp(0, 3.75, 0.05);
    for (let i = 0; i < 6; i++) {
      const arm = grp(0, 0, 0, star);
      arm.rotation.z = (i / 6) * TAU;
      box(0.06, 0.5, 0.05, E('#e8fbff', 1.2), 0, 0.25, 0, 0, 0, 0, arm);
      box(0.18, 0.04, 0.04, E('#e8fbff', 1.2), 0, 0.32, 0, 0, 0, 0, arm);
    }
    anim(star, 'spin', { speed: 0.7, axis: [0, 0, 1] });
    disc({ color: '#8ad8ff', swirl: '#ffffff', swirl2: '#cfeeff', rim: '#e8fbff', speed: 1.9 });
    sign(4.55, '#2a5a8a', '#e8fbff');
    particles({ name: 'PortalSchnee', colors: ['#ffffff', '#e8f6ff'], particleSize: 0.1, sizeEnd: 0.08, rate: 6, speed: [0.2, 0.5], lifetime: [3, 5], spread: [30, 30], direction: 'Bottom', size: [2.6, 0.2, 0.8], acceleration: [0.05, -0.1, 0.1] }, 0, 3.1, 0.3);
  },
  // Vulkantor: schwarzer Basaltbogen mit glühenden Lavarissen, brodelnder Lavastrudel, Funken und Rauch
  lava({ M, E, box, cone, tor, grp, anim, disc, sign, particles, rand }) {
    const basalt = M('#2a2224'), glow = E('#ff5a12', 1.6);
    for (const s of [-1, 1]) {
      for (let k = 0; k < 4; k++) box(0.55 - k * 0.04, 0.75, 0.55, basalt, s * (1.3 + (rand() - 0.5) * 0.08), 0.38 + k * 0.72, 0, 0, rand() * 0.4, (rand() - 0.5) * 0.1);
      // Lavarisse
      const crack = box(0.06, 2.4, 0.04, glow, s * 1.3, 1.4, 0.29, 0, 0, s * 0.08);
      anim(crack, 'pulse', { speed: 2.4, amp: 0.4 });
      cone(0.4, 0.8, basalt, s * 1.62, 0.4, 0.15, 6);
    }
    tor(1.3, 0.3, basalt, 0, 2.85, 0, Math.PI, 10);
    const rim = tor(1.3, 0.08, glow, 0, 2.85, 0.27, Math.PI, 10);
    anim(rim, 'pulse', { speed: 1.8, amp: 0.5 });
    // Lavaschale oben mit Glut
    cone(0.55, 0.5, basalt, 0, 4.0, 0, 7, Math.PI, 0, 0);
    const pool = tor(0.38, 0.12, E('#ffb02e', 2), 0, 4.2, 0, TAU, 10, Math.PI / 2, 0, 0);
    anim(pool, 'pulse', { speed: 3, amp: 0.35 });
    disc({ color: '#ff4a00', swirl: '#ffd27a', swirl2: '#ff8a2a', rim: '#ffb02e', speed: 1.6, intensity: 1.2 });
    sign(4.75, '#2a1a14', '#ffb05a');
    particles({ name: 'PortalFunken', colors: ['#ffd27a', '#ff5a12'], particleSize: 0.08, sizeEnd: 0.03, rate: 6, speed: [1.2, 2.2], lifetime: [0.8, 1.4], spread: [25, 25], size: [0.6, 0.1, 0.6], acceleration: [0, -1.2, 0] }, 0, 4.25, 0);
    particles({ name: 'PortalRauch', texture: 'smoke', colors: ['#3a302c', '#6a605a'], particleSize: 0.5, sizeEnd: 1.6, rate: 1.5, speed: [0.4, 0.7], lifetime: [3, 4.5], spread: [10, 10], lightEmission: 0, size: [0.4, 0.1, 0.4], transparency: [[0, 1], [0.15, 0.4], [1, 1]] }, 0, 4.4, 0);
  },
  // Minenschacht: Holzbalken-Eingang mit Laternen und Lore; Lichtpunkte ziehen ins Dunkel
  hoehle({ M, E, box, cyl, sph, tor, grp, anim, disc, sign, particles }) {
    const wood = M('#6b4a2e'), dark = M('#3a2a1a'), rock = M('#4a4458'), iron = M('#5a5a62', { metalness: 0.6, roughness: 0.4 });
    // Felsen außen
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) sph(0.45 - k * 0.08, rock, s * (1.5 - k * 0.05), 0.4 + k * 0.85, -0.15, undefined, 7);
    // Balkenrahmen, leicht schief
    for (const s of [-1, 1]) box(0.3, 3.0, 0.3, wood, s * 1.2, 1.5, 0.05, 0, 0, s * 0.04);
    box(3.0, 0.32, 0.36, wood, 0, 3.05, 0.05, 0, 0, 0.03);
    box(2.6, 0.14, 0.1, dark, 0, 2.75, 0.22);
    // Schild „Mine“
    box(1.1, 0.3, 0.06, M('#8a6a3a'), 0, 3.05, 0.26, 0, 0, -0.05);
    // Laternen, schaukeln
    for (const s of [-1, 1]) {
      const lt = grp(s * 1.2, 2.7, 0.35);
      cyl(0.01, 0.01, 0.25, iron, 0, -0.12, 0, 4, 0, 0, 0, lt);
      box(0.18, 0.24, 0.18, iron, 0, -0.35, 0, 0, 0, 0, lt);
      box(0.12, 0.16, 0.12, E('#ffb02e', 1.8), 0, -0.35, 0, 0, 0, 0, lt);
      anim(lt, 'sway', { speed: 1.4, amp: 0.18, axis: [0, 0, 1] });
    }
    // Schienen und Lore
    for (const s of [-1, 1]) box(0.06, 0.06, 1.6, iron, s * 0.4, 0.05, 0.6);
    for (let k = 0; k < 4; k++) box(1.1, 0.05, 0.12, dark, 0, 0.02, 0.0 + k * 0.4);
    const cart = grp(-0.95, 0.12, 0.9);
    box(0.7, 0.35, 0.5, iron, 0, 0.25, 0, 0, 0, 0, cart);
    for (const sx of [-0.25, 0.25]) for (const sz of [-0.2, 0.2]) cyl(0.08, 0.08, 0.05, dark, sx, 0.05, sz, 8, 0, 0, Math.PI / 2, cart);
    sph(0.12, E('#ffd76a', 0.6), -0.1, 0.48, 0, cart, 6);
    sph(0.1, E('#b07bff', 0.8), 0.12, 0.47, 0.08, cart, 6);
    disc({ color: '#3a2a6a', swirl: '#ffd27a', swirl2: '#b07bff', rim: '#ffb02e', speed: 1.3, opacity: 0.9, intensity: 0.6 });
    sign(4.0, '#3a2a1a', '#ffd27a');
    particles({ name: 'PortalLichtpunkte', colors: ['#ffd27a', '#b07bff'], particleSize: 0.06, sizeEnd: 0.02, rate: 4, speed: [0.2, 0.4], lifetime: [2, 3.5], spread: [180, 180], size: [1.6, 2.2, 0.3] }, 0, 1.6, 0.1);
  },
  // Zuckerstangen-Tor: zwei Zuckerstangen, Bogen aus Lollis und Gummibärchen; Spiralstrudel, Konfetti
  candy({ M, E, cyl, sph, tor, grp, anim, disc, sign, particles }) {
    for (const s of [-1, 1]) {
      // Zuckerstange: Ringe abwechselnd rot und weiß, oben der Haken
      for (let k = 0; k < 12; k++) cyl(0.2, 0.2, 0.25, M(k % 2 ? '#ffffff' : '#ff3a5a'), s * 1.3, 0.13 + k * 0.25, 0, 10);
      tor(0.32, 0.2, M('#ff3a5a'), s * 1.3 - s * 0.32, 3.0, 0, Math.PI, 8, 0, s < 0 ? Math.PI : 0, 0);
      // Lolli am Fuß
      cyl(0.03, 0.03, 0.8, M('#ffffff'), s * 1.6, 0.4, 0.3, 6);
      const lo = grp(s * 1.6, 0.9, 0.3);
      cyl(0.28, 0.28, 0.08, E('#ff7ad8', 0.3), 0, 0, 0, 14, Math.PI / 2, 0, 0, lo);
      tor(0.17, 0.035, M('#ffffff'), 0, 0, 0.05, TAU, 12, 0, 0, 0, lo);
      anim(lo, 'spin', { speed: 1.2 * s, axis: [0, 0, 1] });
    }
    // Bogen aus Bonbons und Gummibärchen
    const colors = ['#ffd84a', '#7aff8a', '#5fd3ff', '#ff8ac8', '#b07bff', '#ff8a3d', '#ffd84a'];
    arcPoints(7, 0.95, 1.85, 0.3, Math.PI - 0.3).forEach(([x, y], i) => {
      const b = sph(0.17, E(colors[i], 0.35), x, y + 0.2, 0.05, undefined, 10);
      b.scale.set(1, 1.2, 1);
      if (i % 2 === 0) anim(b, 'bob', { speed: 2 + i * 0.3, amp: 0.05 });
    });
    disc({ color: '#ff8ac8', swirl: '#ffffff', swirl2: '#ffe0f4', rim: '#ffffff', speed: 1.8 });
    sign(4.0, '#ff5fb0', '#ffffff');
    particles({ name: 'PortalKonfetti', colors: ['#ff5fb0', '#5fd3ff', '#ffe25f', '#7aff8a'], particleSize: 0.08, sizeEnd: 0.08, rate: 6, speed: [0.6, 1.2], lifetime: [1.5, 2.5], spread: [55, 55], size: [1.4, 0.2, 0.3], acceleration: [0, -0.5, 0] }, 0, 0.4, 0.4);
  },

  // ── Planet 2 ──
  // Mondsichel-Tor: silberne Mondsichel als Bogen auf einem Kraterstein; Sternenstrudel, Sternenstaub
  mond({ M, E, box, cyl, sph, tor, oct, grp, anim, disc, sign, particles }) {
    const rock = M('#9a9ca8'), silver = E('#e8ecf8', 0.4, { metalness: 0.6, roughness: 0.3 });
    cyl(1.35, 1.5, 0.35, rock, 0, 0.17, 0, 14);
    for (const [x, z, r] of [[-0.9, 0.5, 0.22], [0.8, 0.6, 0.18], [0.3, -0.6, 0.25]]) tor(r, 0.06, M('#7a7c88'), x, 0.36, z, TAU, 10, Math.PI / 2, 0, 0);
    // Sichel: zwei versetzte Bögen ergeben die Mondform
    tor(1.35, 0.26, silver, 0, DISC_Y, 0, Math.PI * 1.55, 18, 0, 0, -Math.PI * 0.27).scale.y = 1.35;
    // kleine Sterne an der Sichel, funkeln der Reihe nach
    [[1.4, 2.9], [-1.45, 2.6], [1.55, 1.2], [-1.6, 0.9], [0, 3.6]].forEach(([x, y], i) => {
      const s = oct(0.12, E('#fff6c0', 1.6), x, y, 0.1, 0.6, 1.2, 0.6);
      anim(s, 'seq', { speed: 2.4, amp: i * 1.2 });
    });
    // kleine Erde, kreist über dem Tor
    const orbit = grp(0, 3.85, 0);
    sph(0.22, M('#3a8ae8'), 0.6, 0, 0, orbit, 10);
    sph(0.12, M('#4ac86a'), 0.66, 0.08, 0.12, orbit, 6);
    anim(orbit, 'spin', { speed: 0.6, axis: [0, 1, 0] });
    disc({ color: '#1a1a4a', swirl: '#e8ecff', swirl2: '#9fd8ff', rim: '#cfe0ff', speed: 1.2, intensity: 0.7 });
    sign(4.55, '#2a2a4a', '#e8ecff');
    particles({ name: 'PortalSternenstaub', colors: ['#ffffff', '#cfe0ff'], particleSize: 0.06, sizeEnd: 0.02, rate: 5, speed: [0.3, 0.6], lifetime: [2, 3], spread: [20, 20], size: [1.6, 0.2, 0.3] }, 0, 0.4, 0.2);
  },
  // Sturmwirbel-Tor: Bogen aus blauem Eis und Metall, tiefblauer Sturmstrudel mit Blitzen, Windböen ziehen herum
  neptun({ M, E, box, cyl, tor, oct, grp, anim, disc, sign, particles, rand }) {
    const metal = M('#4a6a9a', { metalness: 0.6, roughness: 0.35 }), ice = E('#7ad0ff', 0.4, { transparent: true, opacity: 0.85 });
    for (const s of [-1, 1]) {
      box(0.4, 3.0, 0.45, metal, s * 1.3, 1.5, 0);
      for (let k = 0; k < 3; k++) oct(0.22, ice, s * 1.55, 0.6 + k * 0.9, 0.1, 0.8, 1.6, 0.8).rotation.z = s * -0.4;
    }
    tor(1.3, 0.22, metal, 0, 3.0, 0, Math.PI, 12);
    // Windringe um das Tor, kreisen schräg
    for (const [r, tilt, sp] of [[1.6, 0.5, 1.3], [1.75, -0.4, -1.0]]) {
      const ring = grp(0, DISC_Y + 0.2, 0);
      ring.rotation.x = tilt;
      tor(r, 0.04, E('#bff0ff', 1, { transparent: true, opacity: 0.5 }), 0, 0, 0, Math.PI * 0.6, 8, Math.PI / 2, 0, 0, ring);
      anim(ring, 'spin', { speed: sp, axis: [0, 1, 0] });
    }
    // Blitze im Strudel, flackern
    for (const [x, y, a] of [[-0.3, 2.0, 0.5], [0.35, 1.2, -0.6]]) {
      const b = box(0.05, 0.6, 0.03, E('#ffffff', 2.4), x, y, 0.1, 0, 0, a);
      anim(b, 'seq', { speed: 5.3 + rand(), amp: x * 3 });
    }
    disc({ color: '#1a4ab8', swirl: '#9fd8ff', swirl2: '#ffffff', rim: '#5aa8ff', speed: 2.6 });
    sign(4.15, '#1a3a6a', '#bff0ff');
    particles({ name: 'PortalBoeen', colors: ['#ffffff', '#bff0ff'], particleSize: 0.05, sizeEnd: 0.15, rate: 5, speed: [1.2, 2], lifetime: [0.8, 1.2], spread: [80, 80], size: [2.4, 2.6, 0.4], transparency: [[0, 1], [0.3, 0.5], [1, 1]] }, 0, 1.6, 0.1);
  },
  // Forschungsstation-Tor: Metallrahmen mit Panzerplatten, Antennen, Warnlichtern; roter Staubstrudel
  mars({ M, E, box, cyl, sph, grp, anim, disc, sign, particles }) {
    const plate = M('#c8ccd4', { metalness: 0.5, roughness: 0.4 }), dark = M('#4a4e58', { metalness: 0.6 }), orange = M('#e8702a');
    for (const s of [-1, 1]) {
      box(0.5, 3.1, 0.55, plate, s * 1.3, 1.55, 0);
      for (let k = 0; k < 4; k++) box(0.52, 0.08, 0.57, k % 2 ? orange : dark, s * 1.3, 0.4 + k * 0.75, 0);
      // Warnlichter blinken abwechselnd
      const w = sph(0.1, E('#ff3a1a', 2), s * 1.3, 3.25, 0.25, undefined, 8);
      anim(w, 'seq', { speed: 4, amp: s > 0 ? 0 : Math.PI });
    }
    box(3.1, 0.4, 0.6, plate, 0, 3.1, 0);
    // Warnstreifen
    for (let k = 0; k < 7; k++) box(0.22, 0.38, 0.02, k % 2 ? M('#1a1a1a') : M('#ffd23a'), -1.2 + k * 0.4, 3.1, 0.31, 0, 0, 0.5);
    // Antenne mit Schüssel, dreht sich
    cyl(0.04, 0.04, 0.8, dark, 1.0, 3.7, 0, 6);
    const dish = grp(1.0, 4.1, 0);
    sph(0.28, plate, 0, 0, 0.1, dish, 10).scale.set(1, 1, 0.35);
    cyl(0.02, 0.02, 0.3, dark, 0, 0, 0.25, 4, Math.PI / 2, 0, 0, dish);
    anim(dish, 'spin', { speed: 0.5, axis: [0, 1, 0] });
    cyl(0.03, 0.03, 0.9, dark, -1.0, 3.75, 0, 4);
    sph(0.07, E('#7aff8a', 1.5), -1.0, 4.22, 0, undefined, 6);
    disc({ color: '#c8402e', swirl: '#ffb07a', swirl2: '#ff7a3a', rim: '#ff9b6a', speed: 1.7 });
    sign(4.75, '#4a4e58', '#ffb07a');
    particles({ name: 'PortalStaub', colors: ['#d8653a', '#e0905a'], particleSize: 0.12, sizeEnd: 0.3, rate: 4, speed: [0.5, 1], lifetime: [1.5, 2.5], spread: [70, 70], lightEmission: 0, size: [2, 0.2, 0.6], transparency: [[0, 1], [0.2, 0.4], [1, 1]] }, 0, 0.3, 0.3);
  },
  // Ringplanet-Tor: goldener Ring wie Saturns Ringe ums Portal, Brocken kreisen darum; goldener Strudel
  saturn({ M, E, box, cyl, sph, tor, oct, grp, anim, disc, sign, particles, rand }) {
    const gold = M('#d8b070', { metalness: 0.6, roughness: 0.35 });
    cyl(1.0, 1.2, 0.3, M('#b08850'), 0, 0.15, 0, 12);
    for (const s of [-1, 1]) cyl(0.18, 0.24, 0.7, gold, s * 0.9, 0.55, 0, 8);
    // Rahmen: kräftiger Ring um die Scheibe
    tor(1.15, 0.2, gold, 0, DISC_Y, 0, TAU, 20).scale.y = DISC_SY;
    // Saturnring schräg ums Tor, mit Brocken, dreht sich
    const ring = grp(0, DISC_Y, 0);
    ring.rotation.set(0.25, 0, 0.35);
    tor(1.65, 0.06, E('#e8d0a0', 0.4, { transparent: true, opacity: 0.8 }), 0, 0, 0, TAU, 14, Math.PI / 2, 0, 0, ring);
    tor(1.82, 0.04, E('#c8a060', 0.3, { transparent: true, opacity: 0.6 }), 0, 0, 0, TAU, 14, Math.PI / 2, 0, 0, ring);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU + rand() * 0.3;
      oct(0.08 + rand() * 0.015, i % 3 ? M('#a88a5a') : E('#fff2c8', 0.9), Math.cos(a) * 1.74, (rand() - 0.5) * 0.06, Math.sin(a) * 1.74, 1, 1, 1, ring);
    }
    anim(ring, 'spin', { speed: 0.5, axis: [0, 1, 0] });
    // kleiner Saturn oben
    const top = grp(0, 3.65, 0);
    sph(0.3, M('#e8c890'), 0, 0, 0, top, 12);
    tor(0.48, 0.04, M('#c8a060'), 0, 0, 0, TAU, 16, Math.PI / 2 - 0.3, 0, 0, top);
    anim(top, 'spin', { speed: 0.8, axis: [0, 1, 0] });
    disc({ color: '#e0a040', swirl: '#fff2c8', swirl2: '#ffd8a0', rim: '#ffe2a0', speed: 1.3 });
    sign(4.4, '#5a4a32', '#ffe2a0');
    particles({ name: 'PortalGoldstaub', colors: ['#ffe2a0', '#fff6d0'], particleSize: 0.06, sizeEnd: 0.03, rate: 5, speed: [0.2, 0.4], lifetime: [2, 3], spread: [180, 180], size: [2.4, 2.4, 0.4] }, 0, DISC_Y, 0);
  },
  // Alien-Tentakel-Bogen: organischer Bogen aus Tentakeln mit Saugnäpfen; Schleimstrudel in Neongrün
  alien({ M, E, cyl, sph, grp, anim, disc, sign, particles }) {
    const skin = M('#5a2a8a'), skin2 = M('#7a3ab0'), sucker = E('#d97aff', 0.6);
    // Tentakel aus Kugelketten, die nach oben dünner werden und sich zur Mitte neigen; wiegen sich
    for (const s of [-1, 1]) {
      const t = grp(s * 1.3, 0, 0);
      let x = 0, y = 0.2;
      for (let k = 0; k < 11; k++) {
        const r = 0.34 - k * 0.022, a = (k / 10) * 1.45;
        x = -s * (1 - Math.cos(a)) * 1.25;
        y = 0.2 + Math.sin(a) * 2.9;
        sph(r, k % 2 ? skin : skin2, x, y, 0, t, 8);
        if (k % 2 === 0 && k < 9) sph(r * 0.35, sucker, x + s * r * 0.55 * 0, y, r * 0.85, t, 6);
      }
      anim(t, 'sway', { speed: 1.1, amp: 0.06, axis: [0, 0, 1] });
      // kleine Tentakel am Fuß
      for (let k = 0; k < 3; k++) sph(0.11 - k * 0.02, skin2, s * (1.55 + k * 0.12), 0.12 + k * 0.12, 0.3, undefined, 6);
    }
    // Auge oben, blickt umher
    const eye = grp(0, 3.5, 0.1);
    sph(0.3, M('#e8ffe0'), 0, 0, 0, eye, 12);
    sph(0.14, E('#7aff5a', 1.2), 0, 0, 0.22, eye, 10);
    sph(0.06, M('#101010'), 0, 0, 0.33, eye, 6);
    anim(eye, 'sway', { speed: 0.7, amp: 0.5, axis: [0, 1, 0] });
    disc({ color: '#3aff3a', swirl: '#d9ff7a', swirl2: '#d97aff', rim: '#7aff5a', speed: 2.0, intensity: 1.1 });
    sign(4.3, '#3a1a60', '#9aff7a');
    particles({ name: 'PortalSchleim', colors: ['#7aff5a', '#d9ff7a'], particleSize: 0.1, sizeEnd: 0.04, rate: 4, speed: [0.3, 0.6], lifetime: [1.5, 2.5], spread: [30, 30], direction: 'Bottom', size: [1.6, 0.2, 0.3], acceleration: [0, -0.6, 0] }, 0, 2.8, 0.2);
  },
  // Sonnentor: goldener Ring mit Strahlenkranz, der sich dreht; glühender Feuerstrudel, Eruptionen
  sonne({ M, E, box, cyl, cone, tor, grp, anim, disc, sign, particles }) {
    const gold = M('#ffcf4a', { metalness: 0.7, roughness: 0.3, emissive: '#b8860b', emissiveIntensity: 0.3 });
    cyl(1.0, 1.25, 0.3, M('#c8a040', { metalness: 0.5 }), 0, 0.15, 0, 12);
    tor(1.15, 0.2, gold, 0, DISC_Y, 0, TAU, 20).scale.y = DISC_SY;
    // Strahlenkranz dreht sich
    const rays = grp(0, DISC_Y, -0.05);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU, long = i % 2 === 0;
      box(long ? 0.2 : 0.16, long ? 0.8 : 0.5, 0.06, E(long ? '#ffb02e' : '#ffd84a', 1.3), Math.cos(a) * (long ? 1.75 : 1.6), Math.sin(a) * (long ? 1.75 : 1.6) * 1.2, 0, 0, 0, a - Math.PI / 2, rays);
    }
    anim(rays, 'spin', { speed: 0.4, axis: [0, 0, 1] });
    const inner = tor(1.32, 0.05, E('#fff2a0', 2, { transparent: true, opacity: 0.8 }), 0, DISC_Y, 0.05, TAU, 20);
    inner.scale.y = DISC_SY * 0.95;
    anim(inner, 'pulse', { speed: 3, amp: 0.5 });
    disc({ color: '#ff8a1a', swirl: '#fff6c0', swirl2: '#ffd84a', rim: '#ffffff', speed: 1.9, intensity: 1.4 });
    sign(4.35, '#6a3a0a', '#fff2a0');
    particles({ name: 'PortalEruption', colors: ['#fff2a0', '#ffb02e', '#ff6a1a'], particleSize: 0.1, sizeEnd: 0.03, rate: 6, speed: [1, 1.8], lifetime: [0.8, 1.3], spread: [180, 180], size: [0.4, 0.4, 0.2], acceleration: [0, -0.4, 0] }, 0, DISC_Y, 0.1);
  },

  // ── Planet 3 ──
  // Korallenbogen: bunte Korallen wachsen zum Bogen; türkiser Wasserstrudel, Blasen und Fische schwimmen durch
  korallenriff({ M, E, cyl, sph, cone, grp, anim, disc, sign, particles, rand }) {
    const cols = ['#ff7a8a', '#ffb05a', '#c87aff', '#5ad8a0', '#ffd84a', '#ff5a8a'];
    cyl(1.4, 1.55, 0.25, M('#e8d4a0'), 0, 0.12, 0, 14);
    arcPoints(11, 1.3, 1.85).forEach(([x, y], i) => {
      const c = cols[i % cols.length];
      sph(0.28 + rand() * 0.1, M(c), x, y, (rand() - 0.5) * 0.15, undefined, 8);
      // Korallenfinger
      for (let k = 0; k < 2; k++) cyl(0.04, 0.07, 0.4, M(c), x + (rand() - 0.5) * 0.3, y + 0.25, (rand() - 0.5) * 0.2, 5, (rand() - 0.5) * 0.6, 0, (rand() - 0.5) * 0.8);
    });
    // Seeanemonen am Fuß, wiegen sich
    for (const s of [-1, 1]) {
      const an = grp(s * 1.5, 0.25, 0.35);
      for (let k = 0; k < 6; k++) cyl(0.02, 0.03, 0.35, E('#ff9ad5', 0.4), Math.cos(k) * 0.1, 0.17, Math.sin(k) * 0.1, 4, Math.cos(k) * 0.4, 0, Math.sin(k) * 0.4, an);
      anim(an, 'sway', { speed: 1.3, amp: 0.15, axis: [0, 0, 1] });
    }
    // Fischchen kreisen um das Tor
    const fish = grp(0, DISC_Y, 0);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * TAU, f = grp(Math.cos(a) * 1.5, (i - 1) * 0.5, Math.sin(a) * 1.5, fish);
      f.rotation.y = -a;
      sph(0.1, M(['#ffd76a', '#ff8a3d', '#5fd3ff'][i]), 0, 0, 0, f, 8).scale.set(0.6, 0.8, 1.6);
      cone(0.08, 0.14, M(['#ffd76a', '#ff8a3d', '#5fd3ff'][i]), 0, 0, -0.2, 4, -Math.PI / 2, 0, 0, f);
    }
    anim(fish, 'spin', { speed: 0.9, axis: [0, 1, 0] });
    disc({ color: '#2ab0c8', swirl: '#e8ffff', swirl2: '#9ff3f0', rim: '#bff8ff', speed: 1.4 });
    sign(4.3, '#0a4a6a', '#bff8ff');
    particles({ name: 'PortalBlasen', colors: ['#ffffff', '#bff8ff'], particleSize: 0.08, sizeEnd: 0.12, rate: 4, speed: [0.5, 0.9], lifetime: [2.5, 3.5], spread: [12, 12], size: [1.8, 0.2, 0.4] }, 0, 0.3, 0.2);
  },
  // Muschel-Torbogen: Bogen aus vielen bunten Muscheln; Glitzerstrudel
  muschelland({ M, E, cyl, sph, tor, grp, anim, disc, sign, particles, rand }) {
    const cols = ['#ffd8ec', '#ffe8d0', '#f4c8e0', '#ffffff', '#ffd0a8', '#e8d0ff'];
    cyl(1.4, 1.55, 0.25, M('#ffe6c8'), 0, 0.12, 0, 14);
    arcPoints(9, 1.32, 1.85).forEach(([x, y, a], i) => {
      // Fächermuschel: Halbscheibe mit Rippen
      const sh = grp(x, y, 0);
      sh.rotation.z = a - Math.PI / 2;
      cyl(0.36, 0.36, 0.1, M(cols[i % cols.length]), 0, 0, 0, 10, Math.PI / 2, 0, 0, sh).scale.set(1, 1, 0.8);
      for (let k = -2; k <= 2; k++) cyl(0.012, 0.012, 0.34, M('#c89ab0'), Math.sin(k * 0.3) * 0.14, Math.cos(k * 0.3) * 0.14, 0.06, 3, 0, 0, -k * 0.3, sh);
    });
    // große Muschel oben mit Perle, Perle schimmert
    const top = grp(0, 3.6, 0);
    cyl(0.55, 0.55, 0.12, M('#ffd8ec'), 0, 0, 0, 12, Math.PI / 2, 0, 0, top);
    const pearl = sph(0.2, E('#fff4fb', 0.9), 0, 0.05, 0.12, top, 12);
    anim(pearl, 'pulse', { speed: 2, amp: 0.4 });
    // Seesterne am Fuß
    for (const s of [-1, 1]) {
      const st = grp(s * 1.5, 0.3, 0.4);
      for (let k = 0; k < 5; k++) cyl(0.03, 0.06, 0.25, M('#ff8a5a'), Math.cos((k / 5) * TAU) * 0.1, Math.sin((k / 5) * TAU) * 0.1, 0, 4, 0, 0, (k / 5) * TAU - Math.PI / 2, st);
    }
    disc({ color: '#e08ac0', swirl: '#ffffff', swirl2: '#ffe8f8', rim: '#ffd8f0', speed: 1.5 });
    sign(4.35, '#8a3a6a', '#ffe8f8');
    particles({ name: 'PortalGlitzer', colors: ['#fff2fa', '#e8d0ff', '#ffffff'], particleSize: 0.06, sizeEnd: 0.02, rate: 6, speed: [0.2, 0.4], lifetime: [1.5, 2.5], spread: [180, 180], size: [2.2, 2.6, 0.4] }, 0, DISC_Y, 0.1);
  },
  // Tempeltor mit Runen: weißes Säulentor mit Dreizack oben und leuchtenden türkisen Runen; Wasserstrudel
  atlantis({ M, E, box, cyl, cone, grp, anim, disc, sign, particles }) {
    const marble = M('#e8eef2'), gold = M('#ffd76a', { metalness: 0.7, roughness: 0.3 });
    box(3.2, 0.25, 0.9, marble, 0, 0.12, 0);
    for (const s of [-1, 1]) {
      cyl(0.24, 0.27, 2.8, marble, s * 1.3, 1.65, 0, 10);
      box(0.6, 0.18, 0.6, marble, s * 1.3, 0.34, 0);
      box(0.6, 0.18, 0.6, marble, s * 1.3, 3.1, 0);
    }
    box(3.2, 0.3, 0.7, marble, 0, 3.33, 0);
    // Giebel
    cone(1.75, 0.6, marble, 0, 3.78, 0, 3, 0, 0, 0).scale.set(1, 1, 0.35);
    // Runen leuchten der Reihe nach
    for (let k = 0; k < 5; k++) {
      const r = box(0.18, 0.18, 0.03, E('#5affd8', 1.8), -0.8 + k * 0.4, 3.33, 0.36, 0, 0, 0.785);
      anim(r, 'seq', { speed: 2, amp: k * 1.1 });
    }
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) {
      const r = box(0.1, 0.18, 0.03, E('#5affd8', 1.6), s * 1.3, 1.0 + k * 0.6, 0.27);
      anim(r, 'seq', { speed: 2, amp: k * 1.1 + (s > 0 ? 3 : 0) });
    }
    // Dreizack auf dem Giebel
    const tri = grp(0, 4.1, 0);
    cyl(0.03, 0.03, 0.8, gold, 0, 0.4, 0, 6, 0, 0, 0, tri);
    for (const x of [-0.15, 0, 0.15]) cone(0.04, 0.22, gold, x, 0.9, 0, 4, 0, 0, 0, tri);
    box(0.34, 0.04, 0.04, gold, 0, 0.78, 0, 0, 0, 0, tri);
    anim(tri, 'bob', { speed: 1.2, amp: 0.06 });
    disc({ color: '#0a6a8a', swirl: '#5affd8', swirl2: '#bff8ff', rim: '#5affd8', speed: 1.5 });
    sign(5.0, '#0a3a5a', '#5affd8');
    particles({ name: 'PortalBlasen', colors: ['#ffffff', '#bff8ff'], particleSize: 0.08, sizeEnd: 0.12, rate: 3, speed: [0.5, 0.9], lifetime: [2.5, 3.5], spread: [12, 12], size: [2, 0.2, 0.4] }, 0, 0.3, 0.2);
  },
  // Tiefsee-Kraken: Krakententakel winden sich um das Portal und bewegen sich
  tiefseegraben({ M, E, sph, grp, anim, disc, sign, particles, cyl }) {
    const skin = M('#7a2a3a'), skin2 = M('#9a3a4a'), sucker = M('#e8b0b8');
    sph(0.9, M('#1a222c'), 0, 0.15, -0.2, undefined, 8).scale.set(1.7, 0.4, 1);
    // vier Tentakel: zwei seitlich hoch, zwei vorne gebogen; jeder wiegt sich
    const tentacle = (x, z, dir, h, lean, sp) => {
      const t = grp(x, 0.2, z);
      for (let k = 0; k < 10; k++) {
        const u = k / 9, r = 0.24 * (1 - u * 0.75);
        const px = dir * Math.sin(u * 2.2) * lean, py = u * h;
        sph(r, k % 2 ? skin : skin2, px, py, 0, t, 8);
        if (k % 2 === 0) sph(r * 0.4, sucker, px - dir * r * 0.7, py, r * 0.5, t, 6);
      }
      anim(t, 'sway', { speed: sp, amp: 0.12, axis: [0, 0, 1] });
    };
    tentacle(-1.35, 0, 1, 3.4, 0.9, 0.9);
    tentacle(1.35, 0, -1, 3.2, 0.9, 1.1);
    tentacle(-1.45, 0.45, -1, 1.5, 0.35, 1.4);
    tentacle(1.45, 0.45, 1, 1.3, 0.35, 1.2);
    // Leuchtpunkte auf den Tentakeln (Biolumineszenz)
    for (const [x, y] of [[-1.1, 2.4], [1.1, 2.2], [-0.6, 3.3], [0.6, 3.1]]) {
      const l = sph(0.06, E('#5affd8', 2), x, y, 0.2, undefined, 6);
      anim(l, 'pulse', { speed: 2.5, amp: 0.7 });
    }
    disc({ color: '#06142a', swirl: '#5affd8', swirl2: '#ff7ae0', rim: '#2affd8', speed: 1.2, opacity: 0.92, intensity: 0.6 });
    sign(4.35, '#10161e', '#5affd8');
    particles({ name: 'PortalPlankton', colors: ['#5affd8', '#7ad0ff', '#ff7ae0'], particleSize: 0.05, sizeEnd: 0.02, rate: 5, speed: [0.1, 0.3], lifetime: [3, 5], spread: [180, 180], size: [2.6, 2.8, 0.6] }, 0, DISC_Y, 0.1);
    void cyl;
  },

  // ── Planet 4 ──
  // Wolkentor: Bogen aus dicken Wolken mit goldenem Rand; heller Himmelsstrudel, kleine Wolken ziehen durch
  wolkenburg({ M, E, sph, tor, grp, anim, disc, sign, particles, rand }) {
    const cloud = M('#ffffff', { roughness: 1 }), cloud2 = M('#eef2ff', { roughness: 1 });
    sph(1.2, cloud, 0, 0.1, 0, undefined, 10).scale.set(1.4, 0.35, 0.8);
    arcPoints(9, 1.35, 1.9).forEach(([x, y], i) => sph(0.38 + rand() * 0.14, i % 2 ? cloud : cloud2, x, y, (rand() - 0.5) * 0.2, undefined, 9));
    tor(1.12, 0.06, M('#ffcf4a', { metalness: 0.7, roughness: 0.3, emissive: '#b8860b', emissiveIntensity: 0.4 }), 0, DISC_Y, 0.15, TAU, 22).scale.y = DISC_SY;
    // kleine Wolken schweben seitlich auf und ab
    for (const s of [-1, 1]) {
      const c = grp(s * 1.7, 2.4, 0.3);
      sph(0.25, cloud, 0, 0, 0, c, 8);
      sph(0.18, cloud2, 0.22, -0.04, 0, c, 8);
      sph(0.18, cloud2, -0.22, -0.04, 0, c, 8);
      anim(c, 'bob', { speed: 0.9 + s * 0.2, amp: 0.15 });
    }
    disc({ color: '#8ac4f6', swirl: '#ffffff', swirl2: '#fff3c4', rim: '#ffe28a', speed: 1.1 });
    sign(4.45, '#4a78b8', '#ffffff');
    particles({ name: 'PortalWoelkchen', texture: 'smoke', colors: ['#ffffff'], particleSize: 0.3, sizeEnd: 0.6, rate: 2, speed: [0.3, 0.5], lifetime: [2.5, 3.5], spread: [40, 40], lightEmission: 0.3, size: [1.6, 0.3, 0.3], transparency: [[0, 1], [0.2, 0.3], [1, 1]] }, 0, 0.6, 0.3);
  },
  // Flügeltor: zwei große Engelsflügel bilden den Bogen, Heiligenschein oben; goldener Lichtstrudel, Federn
  engelsgarten({ M, E, box, cyl, sph, tor, grp, anim, disc, sign, particles }) {
    const white = M('#fbfaf6', { roughness: 0.6 }), gold = M('#ffcf4a', { metalness: 0.7, roughness: 0.3, emissive: '#b8860b', emissiveIntensity: 0.4 });
    cyl(1.0, 1.2, 0.3, M('#f4f0e6'), 0, 0.15, 0, 12);
    for (const s of [-1, 1]) {
      cyl(0.16, 0.2, 2.6, white, s * 1.15, 1.45, 0, 10);
      // Flügel aus gestaffelten Federn, schlagen langsam
      const wing = grp(s * 1.2, 2.5, -0.1);
      for (let row = 0; row < 3; row++)
        for (let k = 0; k < 5; k++) {
          const len = 1.3 - row * 0.3 - k * 0.08;
          const f = box(0.14, len * 0.85, 0.06, row === 0 ? white : M('#fff6e0'), s * (0.2 + k * 0.15), 0.3 - row * 0.32 - k * 0.12, -row * 0.03, 0, 0, s * (-0.35 - k * 0.12), wing);
          f.position.y -= len * 0.1;
        }
      anim(wing, 'sway', { speed: 1.0, amp: 0.1 * s, axis: [0, 1, 0] });
    }
    // Heiligenschein schwebt
    const halo = grp(0, 3.8, 0);
    tor(0.4, 0.06, E('#fff2a0', 1.8), 0, 0, 0, TAU, 18, Math.PI / 2, 0, 0, halo);
    anim(halo, 'bob', { speed: 1.2, amp: 0.08 });
    tor(1.05, 0.05, gold, 0, DISC_Y, 0.05, TAU, 22).scale.y = DISC_SY;
    disc({ color: '#ffd76a', swirl: '#ffffff', swirl2: '#fff2a0', rim: '#ffffff', speed: 1.2, intensity: 1.1 });
    sign(4.5, '#c8a040', '#ffffff');
    particles({ name: 'PortalFedern', colors: ['#ffffff', '#fff6e0'], particleSize: 0.1, sizeEnd: 0.1, rate: 2, speed: [0.1, 0.3], lifetime: [4, 6], spread: [50, 50], direction: 'Bottom', lightEmission: 0.3, size: [2.6, 0.2, 0.4], acceleration: [0.05, -0.05, 0] }, 0, 3.2, 0.1);
  },
  // Göttertor: riesiges goldenes Tor mit Marmorsäulen und Krone oben; Blitze zucken, goldener Strudel
  goetterthron({ M, E, box, cyl, cone, oct, grp, anim, disc, sign, particles }) {
    const marble = M('#f4f0e8'), gold = M('#ffcf4a', { metalness: 0.75, roughness: 0.25, emissive: '#b8860b', emissiveIntensity: 0.4 });
    box(3.2, 0.25, 1.0, marble, 0, 0.12, 0);
    box(2.9, 0.2, 0.8, gold, 0, 0.34, 0);
    for (const s of [-1, 1]) {
      cyl(0.26, 0.3, 3.0, marble, s * 1.35, 1.9, 0, 12);
      cyl(0.36, 0.36, 0.2, gold, s * 1.35, 3.45, 0, 12);
      cyl(0.36, 0.36, 0.2, gold, s * 1.35, 0.5, 0, 12);
    }
    box(3.4, 0.35, 0.75, gold, 0, 3.7, 0);
    // Krone
    const crown = grp(0, 4.0, 0);
    cyl(0.5, 0.45, 0.3, gold, 0, 0.15, 0, 12, 0, 0, 0, crown);
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * TAU;
      box(0.12, 0.35, 0.12, gold, Math.cos(a) * 0.45, 0.45, Math.sin(a) * 0.45, 0, -a, Math.PI / 4 * 0, crown);
      oct(0.06, E(['#ff3a5a', '#3a8aff', '#3aff8a'][k % 3], 1.2), Math.cos(a) * 0.48, 0.2, Math.sin(a) * 0.48, 1, 1, 1, crown);
    }
    anim(crown, 'spin', { speed: 0.5, axis: [0, 1, 0] });
    // Blitze an den Säulen zucken
    for (const s of [-1, 1]) for (let k = 0; k < 2; k++) {
      const b = box(0.05, 0.5, 0.03, E('#fff6c0', 2.6), s * 1.0, 1.4 + k * 1.1, 0.25, 0, 0, s * (0.4 - k * 0.8));
      anim(b, 'seq', { speed: 6.1, amp: k * 2 + (s > 0 ? 1 : 0) });
    }
    disc({ color: '#ffb02e', swirl: '#ffffff', swirl2: '#fff2a0', rim: '#ffe7a8', speed: 1.6, intensity: 1.2 });
    sign(5.0, '#8a6a20', '#ffffff');
    particles({ name: 'PortalGoldfunken', colors: ['#ffe7a8', '#ffffff'], particleSize: 0.06, sizeEnd: 0.02, rate: 6, speed: [0.4, 0.8], lifetime: [1.5, 2.5], spread: [180, 180], size: [2.6, 3, 0.4] }, 0, 1.9, 0.1);
  },

  // ── Juwelnebel ──
  // Quarzkristall-Tor: Bogen aus weiß-rosa Quarzspitzen; Kristallstrudel, Regenbogenfunkeln
  quarzfeld(ctx) { gemArch(ctx, { a: '#f4f0ff', b: '#ffd0e8', disc: '#d8ccff', swirl: '#ffffff', swirl2: '#ff9ad5', bg: '#6a5a8a', sparkle: ['#ffffff', '#ff9ad5', '#9fd8ff', '#fff27a'] }); },
  // Amethyst-Geode: riesige aufgebrochene Geode voller violetter Kristalle; violetter Strudel, Sporen glitzern
  amethystgrotte({ M, E, sph, oct, cyl, grp, anim, disc, sign, particles, rand }) {
    const shell = M('#6a5a6a'), shell2 = M('#8a7a7a');
    // Geodenschale: Ring aus Felsbrocken, innen Kristalle
    arcPoints(14, 1.35, 1.9, -0.5, TAU - 0.9).forEach(([x, y], i) => sph(0.32 + rand() * 0.1, i % 2 ? shell : shell2, x, y, -0.05, undefined, 7));
    cyl(1.35, 1.5, 0.3, shell, 0, 0.15, 0, 12);
    arcPoints(16, 1.12, 1.62, -0.5, TAU - 0.9).forEach(([x, y, a]) => {
      const c = oct(0.14 + rand() * 0.06, E(rand() < 0.5 ? '#c98bff' : '#8a4ad8', 0.6, { transparent: true, opacity: 0.92 }), x, y, 0.08, 0.7, 1.8, 0.7);
      c.rotation.z = a + Math.PI / 2;
    });
    // großer Kristall oben pulsiert
    const big = oct(0.32, E('#d8a0ff', 1, { transparent: true, opacity: 0.9 }), 0, 3.85, 0, 0.8, 1.7, 0.8);
    anim(big, 'pulse', { speed: 1.8, amp: 0.45 });
    const spin = grp(0, 3.85, 0);
    for (let k = 0; k < 3; k++) oct(0.08, E('#ff8ae0', 1.4), Math.cos((k / 3) * TAU) * 0.55, 0, Math.sin((k / 3) * TAU) * 0.55, 0.7, 1.4, 0.7, spin);
    anim(spin, 'spin', { speed: 1.1, axis: [0, 1, 0] });
    disc({ color: '#7a3ad8', swirl: '#ead2ff', swirl2: '#ff8ae0', rim: '#c98bff', speed: 1.6 });
    sign(4.6, '#4a2a7a', '#ead2ff');
    particles({ name: 'PortalSporen', colors: ['#c98bff', '#ead2ff', '#ff8ae0'], particleSize: 0.06, sizeEnd: 0.02, rate: 5, speed: [0.2, 0.4], lifetime: [2, 3.5], spread: [180, 180], size: [2.4, 2.8, 0.4] }, 0, DISC_Y, 0.1);
  },
  // Wüstentor: Sandsteinbogen mit goldenen Topasen; Sandstrudel mit Goldstaub
  topasduenen({ M, E, box, cone, oct, tor, grp, anim, disc, sign, particles }) {
    const sand = M('#e0b878'), sand2 = M('#c8985a');
    box(3.2, 0.25, 0.9, sand2, 0, 0.12, 0);
    for (const s of [-1, 1]) {
      box(0.5, 3.0, 0.6, sand, s * 1.3, 1.5, 0);
      for (let k = 0; k < 4; k++) box(0.54, 0.06, 0.64, sand2, s * 1.3, 0.5 + k * 0.7, 0);
      // Topase in den Säulen funkeln
      for (let k = 0; k < 3; k++) {
        const t = oct(0.1, E('#ffb02e', 1.2), s * 1.3, 0.85 + k * 0.7, 0.31, 0.8, 1.2, 0.6);
        anim(t, 'seq', { speed: 2.2, amp: k * 1.4 + (s > 0 ? 0.7 : 0) });
      }
      cone(0.3, 0.6, sand, s * 1.3, 3.3, 0, 4, 0, Math.PI / 4, 0);
    }
    tor(1.3, 0.25, sand, 0, 2.9, 0, Math.PI, 12);
    // großer Topas oben, dreht sich
    const gem = grp(0, 3.95, 0);
    oct(0.3, E('#ffcf4a', 1, { transparent: true, opacity: 0.92 }), 0, 0, 0, 0.9, 1.5, 0.9, gem);
    anim(gem, 'spin', { speed: 0.9, axis: [0, 1, 0] });
    disc({ color: '#d8901a', swirl: '#fff0b8', swirl2: '#ffd76a', rim: '#ffcf4a', speed: 1.8 });
    sign(4.75, '#8a5a1a', '#fff0b8');
    particles({ name: 'PortalSand', colors: ['#ffd76a', '#e0b878'], particleSize: 0.06, sizeEnd: 0.03, rate: 6, speed: [0.6, 1.2], lifetime: [1, 1.8], spread: [70, 70], size: [1.8, 0.2, 0.3] }, 0, 0.3, 0.3);
  },
  // Smaragd-Baumtor: zwei Bäume mit Smaragden statt Blättern; grüner Strudel mit Glühwürmchen
  smaragdwald({ M, E, cyl, tor, oct, grp, anim, disc, sign, particles, rand }) {
    const bark = M('#4a3a2a');
    for (const s of [-1, 1]) cyl(0.2, 0.3, 2.7, bark, s * 1.25, 1.35, 0, 7, 0, 0, s * -0.08);
    tor(1.25, 0.18, bark, 0, 2.6, 0, Math.PI, 12);
    const crown = grp(0, 3.35, 0);
    for (let i = 0; i < 8; i++) {
      const a = (i / 7) * Math.PI;
      oct(0.26 + rand() * 0.1, E(rand() < 0.5 ? '#1ec870' : '#3ee08a', 0.6, { transparent: true, opacity: 0.92 }), Math.cos(a) * 1.45, Math.sin(a) * 0.6 - 0.2 + rand() * 0.2, (rand() - 0.5) * 0.4, 0.9, 1.3, 0.9, crown);
    }
    anim(crown, 'sway', { speed: 0.8, amp: 0.05, axis: [0, 0, 1] });
    disc({ color: '#1ea860', swirl: '#d9ff7a', swirl2: '#b4ffd6', rim: '#3ee08a', speed: 1.3 });
    sign(4.4, '#1a5a3a', '#b4ffd6');
    particles({ name: 'PortalGluehwuermchen', colors: ['#d9ff7a', '#b4ffd6'], particleSize: 0.07, sizeEnd: 0.04, rate: 4, speed: [0.1, 0.3], lifetime: [3, 6], spread: [180, 180], size: [2.4, 2.6, 0.6] }, 0, 1.7, 0.3);
  },
  // Pagoden-Tor (Torii) aus Jade mit geschwungenem Dach und Laternen; Jadestrudel, Kirschblüten
  jadetempel({ M, E, box, cyl, sph, grp, anim, disc, sign, particles }) {
    const jade = M('#3aa878', { roughness: 0.4 }), dark = M('#1a4a3a'), red = M('#c8302a');
    for (const s of [-1, 1]) {
      cyl(0.18, 0.22, 3.2, jade, s * 1.3, 1.6, 0, 10);
      box(0.5, 0.25, 0.5, dark, s * 1.3, 0.12, 0);
    }
    box(3.3, 0.18, 0.3, jade, 0, 2.95, 0);
    // geschwungener oberer Balken (Kasagi): drei Teile, außen nach oben gebogen
    box(2.6, 0.25, 0.4, dark, 0, 3.4, 0);
    for (const s of [-1, 1]) box(0.8, 0.22, 0.38, dark, s * 1.55, 3.5, 0, 0, 0, s * 0.25);
    box(0.4, 0.4, 0.08, red, 0, 3.15, 0.18);
    // Laternen schaukeln
    for (const s of [-1, 1]) {
      const lt = grp(s * 0.9, 2.85, 0.2);
      cyl(0.01, 0.01, 0.2, dark, 0, -0.1, 0, 4, 0, 0, 0, lt);
      sph(0.16, E('#ff6a3a', 1.2), 0, -0.32, 0, lt, 10).scale.y = 1.3;
      anim(lt, 'sway', { speed: 1.3, amp: 0.15, axis: [0, 0, 1] });
    }
    disc({ color: '#2a9a6a', swirl: '#d8ffe8', swirl2: '#ffb8d0', rim: '#5ad8a0', speed: 1.3 });
    sign(4.3, '#1a4a3a', '#d8ffe8');
    particles({ name: 'PortalKirschblueten', colors: ['#ffb8d0', '#ffd8e8', '#ffffff'], particleSize: 0.08, sizeEnd: 0.08, rate: 3, speed: [0.2, 0.4], lifetime: [3, 5], spread: [50, 50], direction: 'Bottom', lightEmission: 0.2, size: [3, 0.2, 0.6], acceleration: [0.1, -0.08, 0.05] }, 0, 3.6, 0.2);
  },
  // Wassertor: Bogen aus blauen Saphiren, Wasser fällt als Vorhang; Wellenstrudel, Tropfen funkeln
  saphirsee({ M, E, box, oct, tor, grp, anim, disc, sign, particles, rand }) {
    const stone = M('#c8d4e8');
    box(3.2, 0.25, 0.9, stone, 0, 0.12, 0);
    for (const [x, y, a] of arcPoints(11, 1.32, 1.88)) oct(0.18 + rand() * 0.06, E(rand() < 0.5 ? '#2a5ae8' : '#5a8aff', 0.7, { transparent: true, opacity: 0.92 }), x, y, 0, 0.8, 1.5, 0.8).rotation.z = a - Math.PI / 2;
    // Wasservorhang links und rechts (pulsiert wie fließendes Wasser)
    for (const s of [-1, 1]) {
      const w = box(0.25, 3.0, 0.05, E('#8ac8ff', 0.6, { transparent: true, opacity: 0.55 }), s * 1.6, 1.6, 0.1);
      anim(w, 'pulse', { speed: 4, amp: 0.4 });
    }
    // Wasserbecken mit Wellenring
    const pool = tor(0.9, 0.05, E('#bfe0ff', 1, { transparent: true, opacity: 0.7 }), 0, 0.27, 0.4, TAU, 16, Math.PI / 2, 0, 0);
    anim(pool, 'pulse', { speed: 2.5, amp: 0.6 });
    const gem = grp(0, 3.8, 0);
    oct(0.28, E('#3a6aff', 1.1, { transparent: true, opacity: 0.92 }), 0, 0, 0, 0.9, 1.4, 0.9, gem);
    anim(gem, 'spin', { speed: 0.8, axis: [0, 1, 0] });
    disc({ color: '#1a4ac8', swirl: '#cfe0ff', swirl2: '#ffffff', rim: '#5a8aff', speed: 1.7 });
    sign(4.55, '#1a2a6a', '#cfe0ff');
    particles({ name: 'PortalTropfen', colors: ['#cfe0ff', '#ffffff'], particleSize: 0.06, sizeEnd: 0.04, rate: 6, speed: [0.4, 0.8], lifetime: [1, 1.6], spread: [20, 20], direction: 'Bottom', size: [3.2, 0.2, 0.2], acceleration: [0, -1.5, 0] }, 0, 3.2, 0.1);
  },
  // Rubin-Vulkantor: dunkler Felsbogen mit Rubinen und Glutadern; roter Feuerstrudel, Funken
  rubinvulkan({ M, E, box, cone, oct, tor, grp, anim, disc, sign, particles, rand }) {
    const rock = M('#3a2a30'), glow = E('#ff3a5a', 1.6);
    for (const s of [-1, 1]) {
      for (let k = 0; k < 4; k++) box(0.55, 0.75, 0.55, rock, s * 1.3, 0.38 + k * 0.72, 0, 0, rand() * 0.5, 0);
      const vein = box(0.05, 2.6, 0.04, glow, s * 1.3, 1.4, 0.29, 0, 0, s * 0.1);
      anim(vein, 'pulse', { speed: 2, amp: 0.45 });
      for (let k = 0; k < 2; k++) oct(0.13, E('#e8183a', 0.9, { transparent: true, opacity: 0.92 }), s * 1.55, 0.7 + k * 1.2, 0.25, 0.8, 1.4, 0.8);
    }
    tor(1.3, 0.3, rock, 0, 2.85, 0, Math.PI, 10);
    // Rubin oben pulsiert wie ein Herzschlag
    const ruby = grp(0, 3.9, 0);
    oct(0.32, E('#ff1a4a', 1.2, { transparent: true, opacity: 0.94 }), 0, 0, 0, 0.9, 1.3, 0.9, ruby);
    anim(ruby, 'spin', { speed: 0.7, axis: [0, 1, 0] });
    for (const s of [-1, 1]) cone(0.32, 0.6, rock, s * 1.62, 0.3, 0.15, 6);
    disc({ color: '#c81a3a', swirl: '#ffb07a', swirl2: '#ff3a5a', rim: '#ff6a8a', speed: 1.8, intensity: 1.1 });
    sign(4.6, '#3a1a20', '#ffb07a');
    particles({ name: 'PortalFunken', colors: ['#ffb07a', '#ff3a5a'], particleSize: 0.07, sizeEnd: 0.03, rate: 5, speed: [1, 1.8], lifetime: [0.8, 1.3], spread: [30, 30], size: [0.5, 0.1, 0.5], acceleration: [0, -1, 0] }, 0, 4.1, 0);
  },
  // Opal-Wolkentor: Bogen aus schimmernden Opalwolken in Regenbogenfarben; Farben wechseln, Regenbogenstrudel
  opalwolken({ M, E, sph, grp, anim, disc, sign, particles, rand }) {
    const cols = ['#ffd0f0', '#d0e8ff', '#d8ffe8', '#fff2c8', '#e8d0ff'];
    sph(1.2, M('#f4f0ff', { roughness: 0.6 }), 0, 0.1, 0, undefined, 10).scale.set(1.4, 0.35, 0.8);
    arcPoints(9, 1.35, 1.9).forEach(([x, y], i) => {
      const c = sph(0.38 + rand() * 0.14, E(cols[i % cols.length], 0.25, { roughness: 0.3, metalness: 0.2 }), x, y, (rand() - 0.5) * 0.2, undefined, 9);
      // abwechselnd leicht schimmernd
      if (i % 2 === 0) anim(c, 'pulse', { speed: 1.5 + i * 0.2, amp: 0.25 });
    });
    // Regenbogenbögen hinter dem Tor
    const rb = grp(0, DISC_Y, -0.15);
    ['#ff5a5a', '#ffb02e', '#ffe25f', '#5aff8a', '#5ad1ff', '#b07bff'].forEach((c, i) => {
      const t = new THREE.Mesh(new THREE.TorusGeometry(1.6 + i * 0.09, 0.045, 4, 16, Math.PI), E(c, 0.9, { transparent: true, opacity: 0.75 }));
      t.position.set(0, 0, 0);
      rb.add(t);
    });
    anim(rb, 'pulse', { speed: 1.4, amp: 0.4 });
    disc({ color: '#c8a8f4', swirl: '#ffffff', swirl2: '#ffd0f0', rim: '#e8d0ff', speed: 1.4 });
    sign(4.5, '#6a5a9a', '#ffffff');
    particles({ name: 'PortalSchimmer', colors: ['#ffd0f0', '#d0e8ff', '#fff2c8'], particleSize: 0.07, sizeEnd: 0.02, rate: 5, speed: [0.2, 0.4], lifetime: [2, 3], spread: [180, 180], size: [2.6, 2.8, 0.4] }, 0, DISC_Y, 0.1);
  },
  // Diamant-Tor: großer geschliffener Diamant als Rahmen, Facetten blitzen; weiß-blauer Strudel, Regenbogenfunkeln
  diamantkern({ M, E, box, cyl, oct, tor, grp, anim, disc, sign, particles }) {
    const dia = E('#e8fdff', 0.5, { transparent: true, opacity: 0.85, roughness: 0.05, metalness: 0.2 });
    cyl(1.3, 1.5, 0.3, M('#c8e8f0', { metalness: 0.4 }), 0, 0.15, 0, 8);
    // Rahmen aus Diamantfacetten: Kranz aus Oktaedern, der sich langsam um die Scheibe dreht
    const ring = grp(0, DISC_Y, 0);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU;
      const d = oct(0.24, dia, Math.cos(a) * 1.3, Math.sin(a) * 1.3, 0, 0.9, 1.6, 0.9, ring);
      d.rotation.z = a + Math.PI / 2;
    }
    anim(ring, 'spin', { speed: 0.25, axis: [0, 0, 1] });
    // großer Diamant oben (Brillantschliff angedeutet)
    const top = grp(0, 3.6, 0);
    cyl(0.32, 0.4, 0.14, dia, 0, 0.07, 0, 8, 0, 0, 0, top);
    cyl(0.4, 0.01, 0.42, dia, 0, -0.21, 0, 8, 0, 0, 0, top);
    anim(top, 'spin', { speed: 0.9, axis: [0, 1, 0] });
    // Blitze der Facetten
    for (let k = 0; k < 4; k++) {
      const f = oct(0.06, E('#ffffff', 2.4), [-1.1, 1.0, -0.8, 1.2][k], [2.6, 2.3, 0.6, 0.9][k], 0.25, 0.5, 1.5, 0.5);
      anim(f, 'seq', { speed: 3, amp: k * 1.6 });
    }
    disc({ color: '#8af0ff', swirl: '#ffffff', swirl2: '#c84ad8', rim: '#e8fdff', speed: 1.6, intensity: 1.1 });
    sign(4.3, '#2a5a6a', '#e8fdff');
    particles({ name: 'PortalRegenbogen', colors: ['#ffffff', '#8af0ff', '#ff9ad5', '#fff27a'], particleSize: 0.06, sizeEnd: 0.02, rate: 6, speed: [0.3, 0.6], lifetime: [1.5, 2.5], spread: [180, 180], size: [2.6, 2.8, 0.4] }, 0, DISC_Y, 0.1);
    void box; void tor;
  },
};

// Kristallbogen (Quarzfeld)
function gemArch({ M, E, box, oct, grp, anim, disc, sign, particles, rand }, o) {
  box(3.2, 0.25, 0.9, M('#e8e0f0'), 0, 0.12, 0);
  for (const [x, y, a] of arcPoints(11, 1.32, 1.88)) {
    const c = oct(0.2 + rand() * 0.08, E(rand() < 0.5 ? o.a : o.b, 0.5, { transparent: true, opacity: 0.9 }), x, y, 0, 0.8, 1.7, 0.8);
    c.rotation.z = a - Math.PI / 2;
  }
  for (const s of [-1, 1]) {
    oct(0.35, E(o.a, 0.5, { transparent: true, opacity: 0.9 }), s * 1.65, 0.6, 0.1, 0.8, 2, 0.8).rotation.z = s * -0.25;
    oct(0.2, E(o.b, 0.5, { transparent: true, opacity: 0.9 }), s * 1.72, 0.35, 0.3, 0.8, 1.5, 0.8).rotation.z = s * -0.5;
  }
  // schwebender Kristall oben dreht sich, kleine Splitter kreisen
  const top = grp(0, 3.75, 0);
  oct(0.28, E(o.a, 1, { transparent: true, opacity: 0.92 }), 0, 0, 0, 0.8, 1.6, 0.8, top);
  anim(top, 'spin', { speed: 0.8, axis: [0, 1, 0] });
  const sp = grp(0, 3.75, 0);
  for (let k = 0; k < 4; k++) oct(0.07, E(o.sparkle[k % o.sparkle.length], 1.6), Math.cos((k / 4) * TAU) * 0.6, 0, Math.sin((k / 4) * TAU) * 0.6, 0.6, 1.2, 0.6, sp);
  anim(sp, 'spin', { speed: -1.4, axis: [0, 1, 0] });
  disc({ color: o.disc, swirl: o.swirl, swirl2: o.swirl2, rim: o.a, speed: 1.5 });
  sign(4.55, o.bg, '#ffffff');
  particles({ name: 'PortalFunkeln', colors: o.sparkle, particleSize: 0.06, sizeEnd: 0.02, rate: 6, speed: [0.3, 0.6], lifetime: [1.5, 2.5], spread: [180, 180], size: [2.6, 2.8, 0.4] }, 0, DISC_Y, 0.1);
}
