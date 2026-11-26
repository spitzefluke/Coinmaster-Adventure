// Planet 2 (Mond, Neptun, Mars, Saturn, Alien, Sonne): wie Planet 1 bekommt jede Welt ein Wahrzeichen,
// Wege mit Münz-Lichtungen, eine Kulisse im All (innerhalb der Himmelskuppel), mehr Bodendetails, eigene
// Partikel und Plätze für Klänge. Bausteine aus worldFactory.js (kit), Wege und Kulisse-Helfer aus planet1.js.

import * as THREE from 'three';
import { backdropMesh, paths } from './planet1.js';

const TAU = Math.PI * 2;

// pebble: Steinchen um die Münz-Lichtungen (sonst in der Wegfarbe, auf Mars wirkten Metall-Kiesel fremd)
// trail: ausgetretener Boden unter dem Weg
const PATHS = {
  mond: { color: '#9a9da6', kind: 'stone', trail: ['#82858e', 'Slate'] },
  neptun: { color: '#9fd8ff', kind: 'stone', glass: true, trail: ['#9fc8f4', 'Snow'] },
  mars: { color: '#9aa0a8', kind: 'tile', hidden: true }, // kein sichtbarer Weg (Werkstatt-Wunsch), Münzplätze bleiben
  saturn: { color: '#d8b880', kind: 'stone', trail: ['#b8965e', 'Sand'] },
  alien: { color: '#3a1a60', kind: 'tile', glow: '#7aff5a', trail: ['#4a2a70', 'Slate'] },
  sonne: { color: '#5a1a08', kind: 'tile', glow: '#ffd84a', pebble: '#2a0e04', trail: ['#b8400c', 'CrackedLava'], wide: true, deco: 'feuer' },
};

// ── Wahrzeichen ──
const LANDMARK = {
  // Rakete auf der Startrampe
  mond(ctx, kit) {
    const { M, E, at, group } = kit;
    const p = ctx.spot(2.4, 4, 10);
    if (!p) return;
    const steel = M('#8a8f9a', { metalness: 0.6, roughness: 0.4 });
    const parts = [at(new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.3, 3.4), M('#5a5d66')), 0, 0.15, 0)];
    // Turm aus vier Stangen mit Querstreben
    for (const [x, z] of [[1.1, -0.5], [1.7, -0.5], [1.1, 0.5], [1.7, 0.5]]) parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(0.12, 7.4, 0.12), steel), x, 3.9, z));
    for (let y = 1; y < 7.6; y += 1.1) parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 1.1), steel), 1.4, y, 0));
    parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(1, 0.1, 0.14), steel), 0.6, 5.6, 0));
    // Rakete
    parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 5.2, 16), M('#f4f4f6')), 0, 3, 0));
    parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.5, 16), M('#d83a3a')), 0, 4.4, 0));
    parts.push(at(new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.5, 16), M('#d83a3a')), 0, 6.35, 0));
    parts.push(at(new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), E('#7ad0ff', 1.4)), 0, 5.1, 0.5));
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * TAU + 0.5;
      const fin = at(new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.2, 0.7), M('#d83a3a')), Math.cos(a) * 0.65, 0.95, Math.sin(a) * 0.65);
      fin.rotation.y = -a;
      parts.push(fin);
    }
    parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 0.4, 12), M('#3a3d46')), 0, 0.5, 0));
    parts.push(at(new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), E('#ff3a4a', 2)), 1.4, 7.75, 0));
    ctx.put(group(...parts), p[0], p[1], { rot: false });
  },
  // Eisturm (Werkstatt-Wunsch „Licht-Gebäude verbessern“): Sockel mit Stufen, Kranz aus Eiskristallen, hohe
  // Kristallnadel mit leuchtendem Kern, drei schwebende Lichtringe, Leuchtstreifen und ein Lichtstrahl nach oben
  neptun(ctx, kit) {
    const { M, E, at, group, crystal } = kit;
    const p = ctx.spot(3.2, 4, 10);
    if (!p) return;
    const parts = [];
    const ice = M('#bfe8ff', { roughness: 0.1, transparent: true, opacity: 0.85 }), deep = M('#2a4fa0'), glow = E('#9fe0ff', 1.4);
    for (let i = 0; i < 3; i++) parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(2.6 - i * 0.5, 2.8 - i * 0.5, 0.3, 12), i % 2 ? M('#3a6fd1') : deep), 0, 0.15 + i * 0.3, 0));
    parts.push(at(new THREE.Mesh(new THREE.TorusGeometry(2.0, 0.05, 6, 40), glow), 0, 0.92, 0));
    parts[parts.length - 1].rotation.x = Math.PI / 2;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2, c = crystal(1.2 + (i % 2) * 0.8, i % 2 ? '#7ad0ff' : '#bff0ff', ctx.rand, 1.2);
      c.position.set(Math.cos(a) * 2.1, 0.9, Math.sin(a) * 2.1);
      c.rotation.set(Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3);
      parts.push(c);
    }
    const spire = crystal(6.5, '#7ad0ff', ctx.rand, 1.6);
    spire.position.y = 0.9;
    parts.push(spire);
    const core = at(new THREE.Mesh(new THREE.OctahedronGeometry(0.9, 0), E('#dff6ff', 1.6, { transparent: true, opacity: 0.95 })), 0, 4.6, 0);
    core.scale.set(1, 1.8, 1);
    parts.push(core);
    for (let i = 0; i < 4; i++) parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(0.08, 4.6, 0.08), glow), Math.cos(i * 1.57 + 0.78) * 0.9, 3.2, Math.sin(i * 1.57 + 0.78) * 0.9));
    parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 14, 10, 1, true), E('#bff0ff', 0.8, { transparent: true, opacity: 0.25 })), 0, 13, 0));
    const rings = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.6 + i * 0.45, 0.09, 8, 36), E(i === 1 ? '#7af0ff' : '#bff0ff', 1.3, { transparent: true, opacity: 0.85 }));
      ring.rotation.x = Math.PI / 2 + (i - 1) * 0.28;
      ring.position.y = 3.2 + i * 1.5;
      rings.add(ring);
    }
    ctx.put(group(...parts, rings), p[0], p[1], { rot: false });
    ctx.anims.push((t) => {
      rings.children.forEach((r, i) => (r.rotation.z = t * (0.4 + i * 0.2) * (i % 2 ? -1 : 1)));
      core.rotation.y = t * 0.6;
    });
  },
  // Radarstation (Werkstatt-Wunsch „Satellit verbessern“): Betonsockel mit Treppe, Gittermast, große Schüssel mit
  // Rippen und Empfänger, Warnleuchten, Kabelkanal zum Kontrollhaus, Solarfeld mit Wechselrichter
  mars(ctx, kit) {
    const { M, E, at, group } = kit;
    const p = ctx.spot(3.4, 4, 10);
    if (!p) return;
    const white = M('#e8e8ec'), metal = M('#9aa0a8', { metalness: 0.6, roughness: 0.35 }), dark = M('#4a4f58', { metalness: 0.5 });
    const parts = [at(new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.5, 2.4), M('#b8b4ae')), 0, 0.25, 0)];
    for (let i = 0; i < 3; i++) parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.16, 0.3), M('#a8a49e')), 0, 0.08 + i * 0.16, 1.35 + (2 - i) * 0.3));
    // Gittermast: vier Stützen mit Querstreben
    for (const [x, z] of [[0.45, 0.45], [-0.45, 0.45], [0.45, -0.45], [-0.45, -0.45]]) parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.6, 0.08), metal), x * (1 - 0.0), 1.8, z));
    for (let y = 0.9; y < 3.1; y += 0.5) for (const r of [0, Math.PI / 2]) { const b = at(new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.05, 0.05), metal), 0, y, 0); b.rotation.y = r; parts.push(b); }
    const head = new THREE.Group();
    head.position.set(0, 3.25, 0);
    head.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.3, 12), dark), 0, 0, 0));
    const dish = at(new THREE.Mesh(new THREE.SphereGeometry(2.2, 24, 10, 0, Math.PI * 2, 0, Math.PI * 0.3), white), 0, 1.7, 0);
    dish.rotation.x = Math.PI + 0.7;
    head.add(dish);
    for (let i = 0; i < 6; i++) {
      const rib = at(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 2.0), metal), 0, 0.5, 0.35);
      rib.rotation.set(-0.7 + 0.35, (i / 6) * Math.PI * 2, 0);
      head.add(rib);
    }
    // Schüssel noch detaillierter (Werkstatt-Wunsch): Paneelring am Rand, drei Streben zum Empfängerhorn,
    // Gegengewicht hinten, Wartungsleiter am Mast, Kabelbündel und Positionslichter am Rand
    const dishC = new THREE.Vector3(0, 1.7, 0), tiltQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.7, 0, 0));
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2, v = new THREE.Vector3(Math.cos(a) * 1.78, -1.25, Math.sin(a) * 1.78).applyQuaternion(tiltQ).add(dishC);
      const pan = at(new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.04, 0.3), i % 2 ? white : M('#d0d4dc')), v.x, v.y, v.z);
      pan.quaternion.copy(tiltQ).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -a));
      head.add(pan);
      if (i % 4 === 0) head.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 4), E('#ffb02e', 2)), v.x, v.y + 0.05, v.z));
    }
    const horn = new THREE.Vector3(0, 0.1, 1.6).applyQuaternion(tiltQ).add(new THREE.Vector3(0, 1.7, 0));
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2, foot = new THREE.Vector3(Math.cos(a) * 1.2, -0.9, Math.sin(a) * 1.2).applyQuaternion(tiltQ).add(dishC);
      const mid = foot.clone().add(horn).multiplyScalar(0.5), len = foot.distanceTo(horn);
      const st = at(new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, len, 5), metal), mid.x, mid.y, mid.z);
      st.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), horn.clone().sub(foot).normalize());
      head.add(st);
    }
    head.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 0.4, 10), dark), horn.x, horn.y, horn.z));
    head.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), E('#ff3a4a', 2)), horn.x, horn.y + 0.25, horn.z));
    head.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.4), dark), 0, 0.2, -0.6));
    parts.push(head);
    for (const [x, z] of [[1.1, 1.1], [-1.1, -1.1]]) parts.push(at(new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), E('#ffb02e', 2)), x, 0.6, z));
    for (let y = 0.7; y < 3.0; y += 0.22) parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.03, 0.03), metal), 0, y, 0.5));
    for (const sx of [-0.15, 0.15]) parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(0.03, 2.3, 0.03), metal), sx, 1.85, 0.5));
    parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.5, 0.12), M('#2a2e36')), -0.45, 1.75, 0.0));
    // Kontrollhaus mit Fenster, Kabelkanal
    parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.0, 1.0), white), 2.4, 0.5, -0.6));
    parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.3, 0.05), E('#7ad0ff', 0.9)), 2.4, 0.65, -0.08));
    parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.2), dark), 1.45, 0.05, -0.6));
    // Solarfeld
    for (let i = 0; i < 4; i++) {
      const panel = at(new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.06, 0.75), M('#1f3a7a', { metalness: 0.5, roughness: 0.25 })), -2.6 + i * 1.25, 0.7, 2.2);
      panel.rotation.x = -0.5;
      parts.push(panel, at(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 5), metal), -2.6 + i * 1.25, 0.3, 2.2));
      for (let k = -1; k <= 1; k++) { const l = at(new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.07, 0.72), M('#c8d0d8')), -2.6 + i * 1.25 + k * 0.36, 0.71, 2.2); l.rotation.x = -0.5; parts.push(l); }
    }
    ctx.put(group(...parts), p[0], p[1], { rot: false });
    ctx.anims.push((t) => (head.rotation.y = t * 0.25));
  },
  // Sternwarte (Werkstatt-Wunsch „Auskuckgebäude verbessern“): runder Bau mit Gesims, Kuppel mit offenem Spalt
  // und großem Teleskop, umlaufender Balkon mit Geländer, Treppe, Fenster und Laternen, Sternkarte am Eingang
  saturn(ctx, kit) {
    const { M, E, at, group } = kit;
    const p = ctx.spot(3.0, 4, 10);
    if (!p) return;
    const wall = M('#f0e2c4'), trim = M('#b0905a'), dome = M('#d8dce4', { metalness: 0.5, roughness: 0.3 }), warm = E('#ffe2a0', 1.4);
    const parts = [
      at(new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.1, 0.3, 20), M('#c8b890')), 0, 0.15, 0),
      at(new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.7, 2.6, 20), wall), 0, 1.6, 0),
      at(new THREE.Mesh(new THREE.CylinderGeometry(1.85, 1.85, 0.14, 20), trim), 0, 2.95, 0),
    ];
    // Balkon mit Geländer
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.4, 0.05), trim), Math.cos(a) * 1.8, 3.2, Math.sin(a) * 1.8)); }
    parts.push(at(new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.03, 4, 40), trim), 0, 3.4, 0));
    parts[parts.length - 1].rotation.x = Math.PI / 2;
    // Kuppel aus zwei Hälften mit Spalt, darin das Teleskop
    for (const sx of [-1, 1]) {
      const half = at(new THREE.Mesh(new THREE.SphereGeometry(1.5, 18, 10, sx > 0 ? 0.12 : Math.PI + 0.12, Math.PI - 0.24, 0, Math.PI / 2), dome), 0, 3.0, 0);
      half.rotation.y = Math.PI / 2;
      parts.push(half);
    }
    const scope = new THREE.Group();
    scope.position.set(0, 3.4, 0);
    const tube = at(new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.38, 2.8, 14), M('#3a3d46', { metalness: 0.5 })), 0, 1.0, 0.5);
    tube.rotation.x = 0.7;
    scope.add(tube, at(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 14), E('#9fd8ff', 1)), 0, 2.08, 1.42));
    parts.push(scope);
    // Eingang, Treppe, Fenster, Laternen
    parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.3, 0.12), M('#7a4a2a')), 0, 0.95, 1.66));
    for (let i = 0; i < 3; i++) parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 0.3), M('#c8b890')), 0, 0.06 + i * 0.1, 2.3 - i * 0.22));
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + 0.5; if (Math.abs(a - Math.PI / 2) < 0.4) continue; const w = at(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.5, 0.06), warm), Math.cos(a) * 1.66, 1.9, Math.sin(a) * 1.66); w.rotation.y = -a + Math.PI / 2; parts.push(w); }
    for (const sx of [-0.8, 0.8]) parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.2, 6), M('#4a4458')), sx, 0.6, 2.1), at(new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.24, 0.18), warm), sx, 1.32, 2.1));
    // Sternkarte als Schild
    parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.7, 0.05), M('#1a1e3a')), 1.2, 1.2, 1.7));
    for (let i = 0; i < 7; i++) parts.push(at(new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 4), E('#ffffff', 2)), 1.2 - 0.38 + ((i * 37) % 76) / 100, 1.2 - 0.25 + ((i * 53) % 50) / 100, 1.73));
    ctx.put(group(...parts), p[0], p[1], { rot: false });
    ctx.anims.push((t) => (scope.rotation.y = Math.sin(t * 0.2) * 0.8));
  },
  // Alien-Tor (Werkstatt-Wunsch „Kern und Halterung verbessern“): Stufensockel mit Leuchtfugen, zwei geschwungene
  // Halterungen aus Stein mit Runenbändern und Krallen, dazwischen ein großer Energiekern in zwei gegenläufigen
  // Ringen, Energiestrahlen von den Halterungen zum Kern
  alien(ctx, kit) {
    const { M, E, at, group } = kit;
    const p = ctx.spot(3.2, 4, 10);
    if (!p) return;
    const stone = M('#2e1650'), stoneL = M('#46246e'), rune = E('#7aff5a', 1.4), pink = E('#d97aff', 1.2);
    const parts = [];
    for (let i = 0; i < 3; i++) {
      parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(2.6 - i * 0.45, 2.75 - i * 0.45, 0.28, 8), i % 2 ? stoneL : stone), 0, 0.14 + i * 0.28, 0));
      parts.push(at(new THREE.Mesh(new THREE.TorusGeometry(2.62 - i * 0.45, 0.035, 4, 8), rune), 0, 0.29 + i * 0.28, 0));
      parts[parts.length - 1].rotation.x = Math.PI / 2;
    }
    for (const sx of [-1, 1]) {
      // Halterung: drei Blöcke, nach innen geneigt, mit Runenbändern und einer Kralle oben
      for (let k = 0; k < 3; k++) {
        const b = at(new THREE.Mesh(new THREE.BoxGeometry(0.75 - k * 0.12, 1.5, 0.75 - k * 0.12), k % 2 ? stoneL : stone), sx * (1.9 - k * 0.22), 1.6 + k * 1.4, 0);
        b.rotation.z = sx * 0.12 * k;
        parts.push(b);
        parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(0.8 - k * 0.12, 0.1, 0.8 - k * 0.12), k === 1 ? pink : rune), sx * (1.9 - k * 0.22), 1.0 + k * 1.4, 0));
      }
      const claw = at(new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.9, 6), stoneL), sx * 1.2, 5.35, 0);
      claw.rotation.z = sx * 1.1;
      parts.push(claw);
      parts.push(at(new THREE.Mesh(new THREE.OctahedronGeometry(0.3, 0), rune), sx * 1.9, 5.3, 0));
      const beam = at(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.3, 6), E('#7aff5a', 1.6, { transparent: true, opacity: 0.6 })), sx * 1.15, 3.2, 0);
      beam.rotation.z = Math.PI / 2;
      parts.push(beam);
    }
    const core = at(new THREE.Mesh(new THREE.IcosahedronGeometry(0.75, 1), E('#5affd8', 1.9)), 0, 3.2, 0);
    const shell = at(new THREE.Mesh(new THREE.IcosahedronGeometry(0.95, 0), E('#b07bff', 0.8, { transparent: true, opacity: 0.35 })), 0, 3.2, 0);
    const ringA = at(new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.08, 8, 32), rune), 0, 3.2, 0);
    const ringB = at(new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.06, 8, 32), pink), 0, 3.2, 0);
    ringB.rotation.x = Math.PI / 2;
    parts.push(core, shell, ringA, ringB);
    ctx.put(group(...parts), p[0], p[1], { rot: false });
    ctx.anims.push((t) => {
      ringA.rotation.set(t * 0.7, t * 0.4, 0);
      ringB.rotation.set(Math.PI / 2 + Math.sin(t * 0.5) * 0.4, 0, -t * 0.9);
      core.position.y = 3.2 + Math.sin(t * 1.6) * 0.15;
      shell.rotation.y = -t * 0.5;
    });
  },
  // Sonnentempel (Werkstatt-Wunsch „alle Gebäude verbessern“): Stufenplattform mit Glutfugen, Säulenkreis mit
  // goldenen Kapitellen und Gebälk, Feuerschalen, schwebende Sonnenscheibe mit Strahlenkranz und Ringen
  sonne(ctx, kit) {
    const { M, E, at, group } = kit;
    const p = ctx.spot(3.4, 4, 10);
    if (!p) return;
    const stone = M('#7a2a08'), col = M('#c8501a'), gold = M('#ffcf4a', { metalness: 0.7, roughness: 0.3, emissive: '#b8860b', emissiveIntensity: 0.3 }), ember = E('#ffb02e', 1.3);
    const parts = [];
    for (let i = 0; i < 3; i++) {
      parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(3.0 - i * 0.4, 3.15 - i * 0.4, 0.3, 16), i % 2 ? M('#8a3410') : stone), 0, 0.15 + i * 0.3, 0));
      parts.push(at(new THREE.Mesh(new THREE.TorusGeometry(3.05 - i * 0.4, 0.04, 4, 32), ember), 0, 0.3 + i * 0.3, 0));
      parts[parts.length - 1].rotation.x = Math.PI / 2;
    }
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2, x = Math.cos(a) * 2.0, z = Math.sin(a) * 2.0;
      parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 3.0, 10), col), x, 2.4, z));
      parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.5), gold), x, 3.98, z));
      parts.push(at(new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.14, 0.48), M('#a83a10')), x, 0.97, z));
    }
    parts.push(at(new THREE.Mesh(new THREE.TorusGeometry(2.0, 0.16, 6, 32), M('#a83a10')), 0, 4.15, 0));
    parts[parts.length - 1].rotation.x = Math.PI / 2;
    for (const [x, z] of [[2.9, 0], [-2.9, 0], [0, 2.9], [0, -2.9]]) {
      parts.push(at(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.18, 0.25, 10), gold), x, 1.05, z));
      parts.push(at(new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.55, 8), E('#ffd84a', 1.8)), x, 1.42, z));
    }
    const sun = at(new THREE.Mesh(new THREE.SphereGeometry(1.0, 20, 14), E('#ffd84a', 2.2)), 0, 5.6, 0);
    const halo = new THREE.Group();
    halo.position.set(0, 5.6, 0);
    for (let i = 0; i < 12; i++) { const r = at(new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.8, 4), E(i % 2 ? '#ffb02e' : '#ff8a1a', 1.6)), Math.cos((i / 12) * Math.PI * 2) * 1.55, Math.sin((i / 12) * Math.PI * 2) * 1.55, 0); r.rotation.z = (i / 12) * Math.PI * 2 - Math.PI / 2; halo.add(r); }
    const ringA = at(new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.07, 6, 32), E('#ff8a1a', 1.6)), 0, 5.6, 0);
    parts.push(sun, ringA);
    ctx.put(group(...parts, halo), p[0], p[1], { rot: false });
    ctx.anims.push((t) => {
      halo.rotation.y = t * 0.4;
      halo.rotation.z = t * 0.3;
      ringA.rotation.set(Math.PI / 2 + Math.sin(t * 0.4) * 0.5, t * 0.5, 0);
    });
  },
};

// ── Kulisse im All: Asteroiden, Felsen und Formen in der Ferne (40–70 Einheiten) ──
function backdrop(ctx, kit) {
  const { M, E, at } = kit;
  const { root, rand, world } = ctx;
  const id = world.id;
  const base = -24; // Oberkante des Nebelmeers liegt darüber
  const add = (mesh) => {
    root.add(backdropMesh(mesh));
    return mesh;
  };
  const asteroid = (x, y, z, s, c) => {
    const m = add(at(new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), M(c)), x, y, z));
    m.scale.set(1, 0.7 + rand() * 0.3, 0.8 + rand() * 0.3);
    m.rotation.set(rand() * 3, rand() * 3, rand() * 3);
    return m;
  };
  const n = 14;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + rand() * 0.3, r = 44 + rand() * 24;
    const x = Math.cos(a) * r, z = Math.sin(a) * r, h = 14 + rand() * 20;
    if (id === 'mond') {
      // Kraterränder: flache, breite Felsringe, darüber schwebende Brocken
      add(at(new THREE.Mesh(new THREE.CylinderGeometry(9, 12, h * 0.7, 10), M(['#8a8d96', '#9a9da6', '#6a6d76'][i % 3])), x, base + h * 0.35, z));
      if (i % 2) asteroid(x * 0.9, 8 + rand() * 18, z * 0.9, 1.5 + rand() * 2.5, '#8a8d96');
    } else if (id === 'neptun') {
      add(at(new THREE.Mesh(new THREE.ConeGeometry(5 + rand() * 3, h + 14, 6), M(['#3a6fd1', '#4a8aff', '#2a4fa0'][i % 3])), x, base + (h + 14) / 2, z));
      if (i % 3 === 0) add(at(new THREE.Mesh(new THREE.OctahedronGeometry(1.4, 0), E('#7ad0ff', 1.4)), x, base + h + 16, z));
    } else if (id === 'mars') {
      // Tafelberge in Schichten
      const w = 8 + rand() * 6;
      add(at(new THREE.Mesh(new THREE.CylinderGeometry(w, w * 1.15, h, 9), M('#8a3a1e')), x, base + h / 2, z));
      add(at(new THREE.Mesh(new THREE.CylinderGeometry(w * 0.98, w, 2.4, 9), M('#c4582e')), x, base + h + 1.2, z));
    } else if (id === 'saturn') {
      // ein Gürtel aus Brocken rund um die Insel
      for (let j = 0; j < 3; j++) {
        const b = a + j * 0.14, rb = 52 + (rand() - 0.5) * 8;
        asteroid(Math.cos(b) * rb, 6 + (rand() - 0.5) * 4, Math.sin(b) * rb, 1 + rand() * 2.2, ['#c8a870', '#b0905a', '#e0c08a'][j]);
      }
    } else if (id === 'alien') {
      // Riesenpilze mit leuchtenden Hüten
      const sh = h + 4;
      add(at(new THREE.Mesh(new THREE.CylinderGeometry(1.4, 2, sh, 8), M('#4a2478')), x, base + sh / 2, z));
      add(at(new THREE.Mesh(new THREE.SphereGeometry(6 + rand() * 3, 16, 8, 0, TAU, 0, Math.PI / 2), E(['#7aff5a', '#5affd8', '#d97aff'][i % 3], 0.9)), x, base + sh - 0.5, z));
    } else if (id === 'sonne') {
      // Sonnenbögen, die aus dem Glutmeer steigen
      const arc = add(at(new THREE.Mesh(new THREE.TorusGeometry(7 + rand() * 4, 0.9, 6, 20, Math.PI), E(i % 2 ? '#ff8a1a' : '#ff4a00', 1.3)), x, base + 6, z));
      arc.rotation.y = -a + Math.PI / 2;
      if (i % 2) asteroid(x * 0.85, 4 + rand() * 14, z * 0.85, 1.2 + rand() * 1.6, '#a02a08');
    }
  }
  // zwei ferne UFOs über der Alien-Welt
  if (id === 'alien')
    for (const [x, y, z] of [[-40, 26, 30], [36, 32, -42]]) {
      const d = add(at(new THREE.Mesh(new THREE.SphereGeometry(3, 16, 8), M('#b8c0cc', { metalness: 0.7 })), x, y, z));
      d.scale.set(1, 0.3, 1);
      add(at(new THREE.Mesh(new THREE.TorusGeometry(3, 0.25, 6, 20), E('#7aff5a', 1.8)), x, y, z)).rotation.x = Math.PI / 2;
    }
}

// ── mehr Details am Boden ──
function details(ctx, kit) {
  const { M, E, at, rockMesh, crystal } = kit;
  const { scatter, rand, rr } = ctx;
  const id = ctx.world.id;
  if (id === 'mond') {
    scatter(10, () => rockMesh(rr(0.1, 0.2), '#a0a3ac', rand), 0.18);
    // Fußspuren
    scatter(8, () => at(new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.02, 0.3), M('#7a7d86')), 0, 0.01, 0), 0.15);
  } else if (id === 'neptun') {
    scatter(4, () => crystal(rr(0.3, 0.6), '#9fd8ff', rand, 0.8), 0.2);
  } else if (id === 'mars') {
    scatter(12, () => rockMesh(rr(0.1, 0.22), ['#8a3a1e', '#a0482a'][Math.floor(rand() * 2)], rand), 0.18);
    // Messsonden mit Lämpchen
    scatter(3, () => {
      const g = new THREE.Group();
      g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.7, 5), M('#c8c8cc')), 0, 0.35, 0));
      g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 4), E('#7aff5a', 2)), 0, 0.74, 0));
      return g;
    }, 0.3);
  } else if (id === 'saturn') {
    scatter(12, () => rockMesh(rr(0.08, 0.18), '#ffe2a0', rand), 0.15);
  } else if (id === 'alien') {
    scatter(24, () => at(new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), E(['#7aff5a', '#5affd8', '#d97aff'][Math.floor(rand() * 3)], 1.4)), 0, 0.08, 0), 0.15, 2, ctx.R - 2.6);
  } else if (id === 'sonne') {
    scatter(12, () => rockMesh(rr(0.1, 0.2), '#3a0e04', rand, rand() < 0.5 ? E('#ff8a1a', 0.9) : null), 0.18);
  }
}

// ── Leben und Himmelseffekte (Webseiten-Einheiten) ──
function emitters(ctx) {
  const R = ctx.R, id = ctx.world.id, list = (ctx.shared.emitters = ctx.shared.emitters || []);
  const add = (name, pos, size, colors, particleSize, rate, speed, lifetime, opts = {}) =>
    list.push({ name, pos, size, colors, particleSize, rate, speed, lifetime, spread: opts.spread ?? [180, 180], direction: opts.direction ?? 'Top', lightEmission: opts.light ?? 0 });
  // Sternschnuppen: schnelle, helle Funken hoch über der Insel, die seitlich davonziehen
  const shooting = (c) => add('Sternschnuppen', [0, 28, 0], [R * 4, 4, R * 4], [c, '#ffffff'], 0.35, 2, [14, 22], [1.2, 2], { direction: 'Left', spread: [10, 10], light: 1 });
  if (id === 'mond') {
    shooting('#e8ecf5');
    add('Mondstaub', [0, 0.4, 0], [R * 2, 1, R * 2], ['#c8ccd4', '#a0a3ac'], 0.2, 6, [0.1, 0.3], [5, 8], { spread: [30, 30] });
  } else if (id === 'neptun') {
    add('Sturmboeen', [0, 4, 0], [R * 2, 6, R * 2], ['#ffffff', '#bff0ff'], 0.25, 18, [6, 10], [1.5, 2.5], { direction: 'Right', spread: [12, 12], light: 0.4 });
    shooting('#7ad0ff');
  } else if (id === 'mars') {
    add('Staubteufel', [R * 0.4, 0.2, -R * 0.3], [2, 1, 2], ['#c4602e', '#e0905a'], 0.6, 16, [1.5, 3], [3, 5], { spread: [12, 12] });
    shooting('#ffb07a');
  } else if (id === 'saturn') {
    add('Goldstaub', [0, 3, 0], [R * 2, 5, R * 2], ['#ffe2a0', '#e0c08a'], 0.18, 8, [0.1, 0.3], [6, 9], { light: 0.8 });
    shooting('#ffe2a0');
  } else if (id === 'alien') {
    add('Leuchtsporen', [0, 0.5, 0], [R * 2, 1, R * 2], ['#7aff5a', '#5affd8', '#d97aff'], 0.22, 8, [0.4, 0.9], [6, 10], { spread: [15, 15], light: 1 });
    shooting('#7aff5a');
  } else if (id === 'sonne') {
    add('Funkenflug', [0, 0.3, 0], [R * 2, 1, R * 2], ['#fff2a0', '#ffb02e', '#ff4a00'], 0.2, 14, [1.2, 2.6], [3, 5], { spread: [15, 15], light: 1 });
  }
}

// ── Plätze für Klänge ──
const SOUNDS = {
  mond: [['Weltraum', 'ruhiges, tiefes Weltraum-Summen', 0.4], ['Funk', 'leises Funkpiepen, ab und zu', 0.2]],
  neptun: [['Sturm', 'heulender Sturm', 0.45], ['Kristalle', 'klirrende Eiskristalle', 0.2]],
  mars: [['Wind', 'trockener Wüstenwind', 0.4], ['Station', 'Brummen einer Forschungsstation', 0.2]],
  saturn: [['Weltraum', 'tiefes Dröhnen im All', 0.4], ['Sand', 'leise rieselnder Sand', 0.2]],
  alien: [['Alien', 'seltsames Zirpen und Alien-Stimmen', 0.4], ['UFO', 'brummendes UFO', 0.3]],
  sonne: [['Feuer', 'tosendes Feuer', 0.45], ['Sonnenwind', 'grollender Sonnenwind', 0.3]],
};

export const PLANET2 = new Set(Object.keys(PATHS));

export function planet2Before(ctx, kit) {
  if (!PLANET2.has(ctx.world.id)) return;
  if (!ctx.modelWorld || ctx.modelWorld.landmark) LANDMARK[ctx.world.id](ctx, kit);
  paths(ctx, kit, PATHS[ctx.world.id]);
}

export function planet2After(ctx, kit) {
  if (!PLANET2.has(ctx.world.id)) return;
  if (ctx.modelWorld?.backdrop) ctx.modelWorld.backdrop(ctx, kit);
  else backdrop(ctx, kit);
  details(ctx, kit);
  emitters(ctx);
  ctx.shared.sounds = SOUNDS[ctx.world.id].map(([name, hint, volume]) => ({ name, hint, volume }));
}
