// ── Überarbeitungen aus der Befragung (Zusatzteile je Tasche und neue Grundformen) ──
const X = {};
const COPPER = '#b87333', BRONZE = '#cd8a4f', SILVER = '#e8ecf2';

// kleine Bausteine
function pouch(B, p, s, c, tie = '#d8c08a', par) {
  const [x, y, z] = p;
  B.ball(0.16 * s, c, 'leather', [x, y, z], [1, 1.15, 0.8], par, 16);
  B.cyl(0.06 * s, 0.09 * s, 0.08 * s, c, 'leather', [x, y + 0.2 * s, z], null, par, 12);
  B.tor(0.07 * s, 0.015 * s, tie, 'cloth', [x, y + 0.18 * s, z], [PI / 2, 0, 0], par);
  B.coin([x, y + 0.27 * s, z], [PI / 2 + 0.6, 0, 0.3], par, 0.25 * s);
}
function chain(B, a, b, n, c = IRON, k = 'metal', r = 0.04, par) {
  for (let i = 0; i < n; i++) { const t = i / (n - 1), sag = Math.sin(t * PI) * 0.12; B.tor(r, r * 0.3, c, k, [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - sag, a[2] + (b[2] - a[2]) * t], [0, i % 2 ? PI / 2 : 0, Math.atan2(b[1] - a[1], b[0] - a[0])], par); }
}
function hanging(B, p, len = 0.3, speed = 2, amp = 0.15) { const pv = B.pivot(p); B.cyl(0.008, 0.008, len, '#3a2a1c', 'cloth', [0, -len / 2, 0], null, pv, 4); const at = B.pivot([0, -len, 0], null, pv); B.anims.push((t) => { pv.rotation.z = Math.sin(t * speed + p[0] * 3) * amp; }); return at; }
function horseshoe(B, p, s, c, par) { B.tor(0.16 * s, 0.04 * s, c, 'gold', p, [0, 0, PI * 1.12], par, PI * 1.25).scale.set(1, 1.1, 1); for (let i = 0; i < 6; i++) { const a = PI * 1.12 + 0.15 + i * 0.6; B.ball(0.015 * s, DARK, 'dark', [p[0] + Math.cos(a) * 0.16 * s, p[1] + Math.sin(a) * 0.17 * s, p[2] + 0.03], null, par, 6); } }
function dice(B, p, s, par, rot = [0.4, 0.5, 0.2]) {
  const g = B.pivot(p, rot, par);
  B.rbox([0.14 * s, 0.14 * s, 0.14 * s], '#fbf7ee', 'plastic', [0, 0, 0], null, g, 0.025 * s);
  for (const [x, y] of [[-0.035, 0.035], [0, 0], [0.035, -0.035]]) B.ball(0.013 * s, '#c1121f', 'plastic', [x * s, y * s, 0.071 * s], [1, 1, 0.4], g, 6);
  B.ball(0.02 * s, '#c1121f', 'plastic', [0, 0.071 * s, 0], [1, 0.4, 1], g, 6);
}
function ladybug(B, p, s, rot, par) {
  const g = B.pivot(p, rot || [0, 0, 0], par);
  B.ball(0.08 * s, '#d62828', 'plastic', [0, 0, 0], [1, 1.2, 0.55], g, 14);
  B.ball(0.045 * s, '#111', 'dark', [0, 0.09 * s, 0], [1, 0.8, 0.6], g, 10);
  B.box([0.004, 0.18 * s, 0.01], '#111', 'dark', [0, 0, 0.045 * s], null, g);
  for (const [x, y] of [[-0.035, 0.02], [0.035, 0.02], [-0.03, -0.045], [0.03, -0.045]]) B.ball(0.016 * s, '#111', 'dark', [x * s, y * s, 0.04 * s], [1, 1, 0.4], g, 6);
}
function clover(B, p, s, c = '#3fbf5a', glow, par) {
  for (let i = 0; i < 4; i++) { const a = i * PI / 2 + PI / 4; B.ball(0.07 * s, c, glow ? 'neon' : 'plastic', [p[0] + Math.cos(a) * 0.065 * s, p[1] + Math.sin(a) * 0.065 * s, p[2]], [1, 0.75, 0.3], par, 10).rotation.z = a; }
  B.cyl(0.01 * s, 0.01 * s, 0.14 * s, shade(c, -0.3), 'plastic', [p[0] + 0.03 * s, p[1] - 0.1 * s, p[2]], [0, 0, 0.4], par, 4);
  if (glow) B.glow(0.45 * s, c, [p[0], p[1], p[2] + 0.04], par, 0.7);
}
function poster(B, p, s, rz = 0, par) {
  const g = B.pivot(p, [0, 0, rz], par);
  B.rbox([0.36 * s, 0.46 * s, 0.012], '#efe3c2', 'cloth', [0, 0, 0], null, g, 0.004);
  B.box([0.3 * s, 0.06 * s, 0.014], '#7a2a2a', 'plastic', [0, 0.16 * s, 0.002], null, g);
  B.ball(0.07 * s, '#5a3a2a', 'plastic', [0, 0.02 * s, 0.008], [1, 1.1, 0.15], g, 10);
  B.box([0.16 * s, 0.02 * s, 0.014], '#5a3a2a', 'plastic', [0, -0.11 * s, 0.002], null, g);
  B.coin([0, -0.17 * s, 0.01], [PI / 2, 0, 0], g, 0.18 * s);
  B.cone(0.012, 0.05, IRON, 'metal', [0, 0.2 * s, 0.02], [PI / 2, 0, 0], g, 6);
  return g;
}
function lantern(B, p, s, c = '#ffb347', par) {
  const g = B.pivot(p, null, par);
  B.cyl(0.1 * s, 0.11 * s, 0.04 * s, IRON, 'metal', [0, -0.13 * s, 0], null, g, 12);
  B.cyl(0.08 * s, 0.08 * s, 0.22 * s, '#fff1d6', 'glass', [0, 0, 0], null, g, 12);
  for (let i = 0; i < 4; i++) { const a = i * PI / 2; B.box([0.012, 0.24 * s, 0.012], IRON, 'metal', [Math.cos(a) * 0.085 * s, 0, Math.sin(a) * 0.085 * s], null, g); }
  B.cone(0.11 * s, 0.1 * s, IRON, 'metal', [0, 0.16 * s, 0], null, g, 12);
  B.tor(0.04 * s, 0.01 * s, IRON, 'metal', [0, 0.24 * s, 0], null, g);
  const f = B.cone(0.025 * s, 0.07 * s, c, 'neon', [0, -0.02 * s, 0], null, g, 8);
  B.glow(0.55 * s, c, [0, 0, 0], g, 0.8);
  B.pulse(f, 0.18, 11);
  return g;
}

// ── Nr. 1 Zerschlissener Kupferbeutel: echte Risse, Flicken mit Kreuzstich, richtige Beutelform ──
X[1] = (B, s, zf, S, nrm) => {
  // Kreuzstich-Flicken
  for (const [x, ly, w, h] of [[0.3, 0.15, 0.24, 0.2], [-0.38, -0.55, 0.22, 0.18]]) {
    const q = S(x * s, ly, 0.012), r = nrm(x * s, ly);
    const g = B.pivot(q, r);
    B.rbox([w * s, h * s, 0.025], '#7a6448', 'cloth', [0, 0, 0], [0, 0, 0.08], g, 0.01);
    for (let i = 0; i < 5; i++) { const t = -0.5 + i / 4; for (const [ex, ey] of [[t * w, h / 2], [t * w, -h / 2], [w / 2, t * h], [-w / 2, t * h]]) { B.box([0.008, 0.05 * s, 0.008], '#e9d8b0', 'plastic', [ex * s, ey * s, 0.015], [0, 0, 0.7], g); B.box([0.008, 0.05 * s, 0.008], '#e9d8b0', 'plastic', [ex * s, ey * s, 0.015], [0, 0, -0.7], g); } }
  }
  // geflickter Riss mit Nadel und Faden
  const q = S(-0.05 * s, 0.35, 0.01), r = nrm(-0.05 * s, 0.35);
  const g = B.pivot(q, r);
  B.box([0.32 * s, 0.012, 0.01], '#1a120c', 'dark', [0, 0, 0], [0, 0, 0.3], g);
  for (let i = 0; i < 6; i++) B.box([0.008, 0.07 * s, 0.008], '#d9c7a0', 'plastic', [(-0.13 + i * 0.052) * s, (-0.04 + i * 0.016) * s, 0.008], [0, 0, 0.3], g);
  B.cyl(0.006, 0.003, 0.18 * s, '#d7dde6', 'metal', [0.18 * s, 0.1 * s, 0.03], [0, 0, -0.7], g, 4);
  B.cyl(0.003, 0.003, 0.22 * s, '#d9c7a0', 'cloth', [0.12 * s, 0.0, 0.03], [0, 0, 0.4], g, 3);
  // Schmutz und abgewetzte Stellen
  for (const [x, ly] of [[-0.2, -0.8], [0.25, -0.75], [0.0, -0.9], [0.45, -0.3]]) B.ball(0.1 * s, '#5a4632', 'cloth', S(x * s, ly, -0.005), [1.4, 0.8, 0.12], null, 10).rotation.set(...nrm(x * s, ly));
  // Kupfermünzen, die aus dem Riss gefallen sind, liegen in der Schlaufe
  for (let i = 0; i < 3; i++) B.coin(S((0.12 + i * 0.07) * s, -0.97, 0.05), [PI / 2 + 0.9, 0, 0.2 * i], null, 0.4 * s, COPPER);
};

// ── Nr. 2 Münzsammlers Ranzen: Lupe, Münzalbum, Sammlerbeutel, Fundstücke ──
X[2] = (B, s) => {
  const zf = 0.79 * s;
  const lp = hanging(B, [0.8 * s, 0.25 * s, 0.42 * s], 0.28, 2.1, 0.2);
  B.tor(0.13 * s, 0.022 * s, BRASS, 'gold', [0, -0.14 * s, 0], [0, PI / 2, 0], lp);
  B.cyl(0.12 * s, 0.12 * s, 0.015, '#dff1ff', 'glass', [0, -0.14 * s, 0], [0, 0, PI / 2], lp, 20);
  B.rbox([0.05, 0.22 * s, 0.05], '#6b4426', 'wood', [0, -0.37 * s, 0], null, lp, 0.02);
  // Münzalbum vorn
  B.rbox([0.72 * s, 0.5 * s, 0.1 * s], '#6b1f2a', 'leather', [0, -0.5 * s, zf + 0.29 * s], null, null, 0.03);
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) B.cone(0.06 * s, 0.06 * s, GOLD, 'gold', [sx * 0.33 * s, -0.5 * s + sy * 0.22 * s, zf + 0.35 * s], [PI / 2, 0, PI / 4], null, 3);
  [[-0.2, COPPER], [0, SILVER], [0.2, GOLD]].forEach(([x, c]) => B.coin([x * s, -0.5 * s, zf + 0.35 * s], null, null, 0.35 * s, c));
  B.rbox([0.5 * s, 0.035, 0.01], GOLD, 'gold', [0, -0.34 * s, zf + 0.345 * s], null, null, 0.005);
  for (let i = 0; i < 4; i++) B.rbox([0.03, 0.04 * s, 0.11 * s], '#efe3c2', 'cloth', [0.37 * s, -0.5 * s - 0.15 * s + i * 0.1 * s, zf + 0.29 * s], null, null, 0.005);
  // Sammlerbeutel an der linken Seite
  pouch(B, [-0.88 * s, -0.25 * s, 0.42 * s], s, '#8a5a33');
  pouch(B, [-0.86 * s, -0.62 * s, 0.55 * s], s * 0.8, '#5a4a3a', BRASS);
  // Fundstücke: alte Münzen an Nadeln auf der Klappe
  [[-0.5, COPPER], [0.5, '#c0c6cf']].forEach(([x, c]) => { B.coin([x * s, 0.6 * s, zf + 0.12 * s], [PI / 2 - 0.06, 0, 0], null, 0.3 * s, c); B.cyl(0.006, 0.006, 0.12, '#d7dde6', 'metal', [x * s, 0.72 * s, zf + 0.13 * s], null, null, 4); B.ball(0.02, '#e63946', 'plastic', [x * s, 0.78 * s, zf + 0.13 * s], null, null, 6); });
  B.sparkle(10, [1.6 * s, 1.4 * s, 1 * s], '#ffe9a0', [0, 0, 0.7 * s], 0.05, 0.2);
};

// ── Nr. 3 Rostiger Pennysack: Rost, aufgenähte Pennys, rostige Kette ──
X[3] = (B, s, zf, S, nrm) => {
  const RUST = ['#8a3b12', '#a34a1a', '#6b2a0e', '#b5651d'];
  for (let i = 0; i < 16; i++) { const x = Math.sin(i * 2.7) * 0.55 * s, ly = -0.8 + ((i * 0.37) % 1.4); B.ball(0.07 * s + (i % 3) * 0.025 * s, RUST[i % 4], 'stone', S(x, ly, -0.008), [1.3, 1, 0.12], null, 10).rotation.set(...nrm(x, ly)); }
  for (let i = 0; i < 5; i++) { const x = (-0.4 + i * 0.2) * s; B.cyl(0.012 * s, 0.004 * s, 0.25 * s, '#8a3b12', 'stone', S(x, 0.48 - (i % 2) * 0.1, 0.0), [0.4, 0, 0], null, 5); }
  [[-0.35, -0.15], [0.32, -0.25], [0.0, -0.5], [-0.15, 0.15], [0.4, 0.15]].forEach(([x, ly]) => {
    const q = S(x * s, ly, 0.03), r = nrm(x * s, ly);
    const c = B.coin(q, [r[0] + PI / 2, r[1], 0], null, 0.42 * s, COPPER);
    const g = B.pivot(q, r);
    B.box([0.01, 0.12 * s, 0.01], '#e9d8b0', 'plastic', [0, 0, 0.02], [0, 0, 0.785], g);
    B.box([0.01, 0.12 * s, 0.01], '#e9d8b0', 'plastic', [0, 0, 0.02], [0, 0, -0.785], g);
    B.ball(0.03 * s, '#4f8a6b', 'stone', [0.06 * s, -0.04 * s, 0.025], [1, 1, 0.3], g, 6);
  });
  chain(B, S(-0.55 * s, 0.05, 0.05), S(0.55 * s, 0.05, 0.05), 13, '#8a4b2a', 'metal', 0.05 * s);
  B.rbox([0.16 * s, 0.2 * s, 0.03], '#8a4b2a', 'metal', S(0, 0.05 - 0.06, 0.05), null, null, 0.02);
  B.tor(0.05 * s, 0.015 * s, '#8a4b2a', 'metal', S(0, 0.15, 0.06));
};

// ── Nr. 4 Holz-Münzkiste: Seilgriffe, Vorhängeschloss, Lederriemen, geschnitztes Münzwappen, Einwurfschlitz ──
X[4] = (B, s) => {
  const zc = 0.55 * s, zf = zc + 0.45 * s;
  for (const sx of [-1, 1]) { B.tor(0.15 * s, 0.035 * s, '#d9c7a0', 'cloth', [sx * 0.86 * s, -0.12 * s, zc], [0, PI / 2, 0], null, PI); for (let i = 0; i < 6; i++) B.box([0.015, 0.06, 0.07], '#b8a37a', 'cloth', [sx * 0.86 * s, -0.12 * s + Math.sin(i / 5 * PI) * 0.15 * s, zc + Math.cos(i / 5 * PI) * 0.15 * s], [i * 0.5, 0, 0]); }
  for (const sx of [-0.3, 0.3]) { B.rbox([0.12 * s, 1.55 * s, 0.03], '#4a2a16', 'leather', [sx * s, -0.05 * s, zf + 0.03], null, null, 0.01); B.buckle([sx * s, -0.45 * s, zf + 0.05], 0.55 * s, BRASS); B.seam([sx * s - 0.045 * s, -0.7 * s, zf + 0.05], [sx * s - 0.045 * s, 0.2 * s, zf + 0.05], '#e9d8b0', 8); }
  const lk = hanging(B, [0, -0.06 * s, zf + 0.1 * s], 0.02, 1.7, 0.1);
  B.tor(0.07 * s, 0.018 * s, '#9aa3ad', 'metal', [0, -0.02 * s, 0], null, lk, PI);
  B.rbox([0.2 * s, 0.17 * s, 0.07 * s], '#c9a227', 'gold', [0, -0.12 * s, 0], null, lk, 0.03);
  B.cyl(0.015 * s, 0.015 * s, 0.02, DARK, 'dark', [0, -0.12 * s, 0.04 * s], [PI / 2, 0, 0], lk, 8);
  B.tor(0.17 * s, 0.025 * s, '#7a4a20', 'wood', [0, 0.47 * s, zc + 0.38 * s], [0.55, 0, 0]);
  B.coin([0, 0.47 * s, zc + 0.4 * s], [PI / 2 + 0.55, 0, 0], null, 0.45 * s, '#c9a227');
  B.rbox([0.35 * s, 0.05 * s, 0.1 * s], '#2a1a0c', 'dark', [0, 0.69 * s, zc], null, null, 0.02);
  B.coin([0, 0.76 * s, zc], [0, 0, PI / 2], null, 0.5 * s);
  B.glow(0.5 * s, '#ffe08a', [0, 0.72 * s, zc], null, 0.6);
  for (let i = 0; i < 3; i++) B.box([1.55 * s, 0.012, 0.012], '#3a2010', 'dark', [0, -0.5 * s + i * 0.25 * s, zf + 0.005]);
};

// ── Nr. 5 Sparschwein-Rucksack: Satteltaschen, Fliege, Münzstapel, Blume, Ringelschwanz ──
X[5] = (B) => {
  const P = '#f4a7bb';
  for (const sx of [-1, 1]) {
    B.rbox([0.32, 0.5, 0.5], '#8a5a33', 'leather', [sx * 1.08, -0.25, 0.8], null, null, 0.08);
    B.rbox([0.34, 0.2, 0.52], '#6e4426', 'leather', [sx * 1.09, -0.06, 0.8], [0, 0, sx * 0.1], null, 0.05);
    B.buckle([sx * 1.26, -0.2, 0.8], 0.45, BRASS).rotation.y = PI / 2;
    B.coin([sx * 1.1, 0.07, 0.75], [0.4, 0, sx * 0.3], null, 0.5);
    B.seam([sx * 1.255, -0.48, 0.6], [sx * 1.255, -0.48, 1.0], '#e9d8b0', 5);
  }
  B.rbox([1.6, 0.06, 0.16], '#8a5a33', 'leather', [0, 0.32, 0.8], null, null, 0.02);
  // Fliege unter dem Rüssel
  for (const sx of [-1, 1]) B.cone(0.11, 0.18, '#3a5bd9', 'cloth', [sx * 0.1, -0.5, 1.48], [0, 0, sx * PI / 2], null, 4).scale.set(1, 1, 0.4);
  B.ball(0.05, '#2a3f99', 'cloth', [0, -0.5, 1.5], null, null, 10);
  // Münzstapel auf dem Rücken
  for (let i = 0; i < 7; i++) B.coin([0.3 + Math.sin(i) * 0.01, 0.72 + i * 0.05, 0.55], [0, i, 0], null, 0.55);
  for (let i = 0; i < 5; i++) B.coin([-0.32, 0.7 + i * 0.05, 0.6], [0, i, 0], null, 0.5, '#e8ecf2');
  // Blume am Ohr
  for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; B.ball(0.045, '#ffffff', 'plastic', [-0.5 + Math.cos(a) * 0.055, 0.9 + Math.sin(a) * 0.055, 1.05], [1, 1, 0.4], null, 8); }
  B.ball(0.035, '#ffcf4a', 'plastic', [-0.5, 0.9, 1.07], null, null, 8);
  // Namensschild-Münze am Bauchgurt
  B.coin([0.55, -0.35, 1.48], [PI / 2, -0.4, 0], null, 0.5);
  B.emblem('star', [0.56, -0.35, 1.52], 0.28);
  B.sparkle(18, [2, 1.6, 1.4], '#ffe9a0', [0, 0.2, 0.9], 0.06, 0.4);
};

// ── Nr. 6 Händlers Münzrucksack (neu: Händlergepäck mit Waage, Beuteln, Rechenbrett, Kontobuch) ──
X[6] = (B, s) => {
  const zc = 0.42 * s, zf = 0.79 * s, top = 0.875 * s;
  // Balkenwaage oben
  const sc = B.pivot([0, top + 0.05, zc]);
  B.cyl(0.03, 0.04, 0.8 * s, GOLD, 'gold', [0, 0.4 * s, 0], null, sc, 10);
  B.ball(0.06, GOLD, 'gold', [0, 0.82 * s, 0], null, sc, 12);
  const beam = B.pivot([0, 0.78 * s, 0], null, sc);
  B.rbox([1.3 * s, 0.05, 0.05], GOLD, 'gold', [0, 0, 0], null, beam, 0.02);
  for (const sx of [-1, 1]) {
    const pan = B.pivot([sx * 0.62 * s, 0, 0], null, beam);
    for (const a of [0, 2.1, 4.2]) B.cyl(0.006, 0.006, 0.45 * s, '#d7dde6', 'metal', [Math.cos(a) * 0.09, -0.22 * s, Math.sin(a) * 0.09], [Math.sin(a) * 0.2, 0, -Math.cos(a) * 0.2], pan, 4);
    B.lathe([[0, -0.03], [0.16, -0.03], [0.2, 0.03], [0.19, 0.035], [0, 0.0]].map(([x, y]) => [x * s, y * s]), GOLD, 'gold', [0, -0.45 * s, 0], null, pan, 24, 'pan' + s);
    for (let i = 0; i < (sx > 0 ? 5 : 2); i++) B.coin([Math.sin(i * 2) * 0.05, -0.43 * s + i * 0.03, Math.cos(i * 2) * 0.05], [0, i, 0], pan, 0.35 * s);
    B.anims.push((t) => { pan.rotation.z = -beam.rotation.z; });
  }
  B.anims.push((t) => { beam.rotation.z = -0.12 + Math.sin(t * 1.3) * 0.08; });
  // Rechenbrett vorn auf der Tasche
  B.rbox([0.86 * s, 0.42 * s, 0.05], '#5a3a22', 'wood', [0, -0.5 * s, zf + 0.25 * s], null, null, 0.02);
  for (let r = 0; r < 4; r++) { const y = -0.64 * s + r * 0.09 * s; B.cyl(0.006, 0.006, 0.78 * s, GOLD, 'gold', [0, y, zf + 0.28 * s], [0, 0, PI / 2], null, 4); for (let i = 0; i < 5; i++) B.ball(0.03 * s, ['#c1121f', '#2a4d8f', '#e9c35a', '#2a8a4a'][r], 'plastic', [(-0.3 + i * 0.06 + (i > 2 ? 0.2 : 0) + r * 0.02) * s, y, zf + 0.28 * s], [0.7, 1, 1], null, 8); }
  // Beutel an der Seite
  pouch(B, [-0.92 * s, -0.05 * s, zc], s, '#8a5a33', GOLD);
  pouch(B, [-0.9 * s, -0.5 * s, zc + 0.15 * s], s * 0.85, '#6b1f2a', GOLD);
  pouch(B, [0.92 * s, -0.45 * s, zc], s * 0.9, '#2a4d8f', GOLD);
  // Kontobuch mit Lesebändchen rechts
  B.rbox([0.14 * s, 0.6 * s, 0.45 * s], '#2a4d3a', 'leather', [0.88 * s, 0.25 * s, zc], null, null, 0.03);
  B.rbox([0.12 * s, 0.56 * s, 0.41 * s], '#f2e8cf', 'cloth', [0.89 * s, 0.25 * s, zc], null, null, 0.01);
  B.box([0.02, 0.2 * s, 0.03], '#c1121f', 'cloth', [0.9 * s, -0.12 * s, zc + 0.1 * s]);
  B.coin([0.955 * s, 0.25 * s, zc], [0, 0, PI / 2], null, 0.4 * s);
  B.sparkle(14, [1.8 * s, 1.2 * s, 1], '#ffe9a0', [0, top + 0.5, zc], 0.06, 0.3);
};

// ── Nr. 7 Taschengeld-Tornister: Reflektoren, Namensschild, Federmappe, Lineal, Anhänger ──
X[7] = (B, s) => {
  const zf = 0.79 * s;
  for (const y of [0.42, 0.72]) B.rbox([1.4 * s, 0.06 * s, 0.02], '#f2f5f8', 'metal', [0, y * s, zf + 0.09 * s], [-0.06, 0, 0], null, 0.01);
  for (const sx of [-1, 1]) { B.rbox([0.06 * s, 0.4 * s, 0.02], '#f2f5f8', 'metal', [sx * 0.6 * s, -0.5 * s, zf + 0.24 * s], null, null, 0.01); }
  B.rbox([0.36 * s, 0.2 * s, 0.02], '#ffffff', 'plastic', [-0.35 * s, 0.58 * s, zf + 0.1 * s], null, null, 0.02);
  B.rbox([0.28 * s, 0.03 * s, 0.022], '#2a4d8f', 'plastic', [-0.35 * s, 0.61 * s, zf + 0.105 * s], null, null, 0.005);
  B.coin([-0.42 * s, 0.53 * s, zf + 0.12 * s], null, null, 0.18 * s);
  // Federmappe und Lineal auf der Seite
  B.cyl(0.1 * s, 0.1 * s, 0.6 * s, '#ffcf4a', 'cloth', [-0.95 * s, 0.25 * s, 0.42 * s], null, null, 14);
  B.box([0.02, 0.5 * s, 0.03], IRON, 'metal', [-0.95 * s, 0.25 * s, 0.53 * s]);
  B.rbox([0.05, 0.12, 0.03], '#c1121f', 'plastic', [-0.95 * s, 0.55 * s, 0.54 * s], null, null, 0.01);
  B.rbox([0.08 * s, 0.9 * s, 0.015], '#ffe066', 'plastic', [0.6 * s, 0.95 * s, 0.2 * s], [0, 0, -0.15], null, 0.005);
  for (let i = 0; i < 8; i++) B.box([0.03, 0.006, 0.017], DARK, 'dark', [0.585 * s + i * 0.11 * s * 0.15, 0.6 * s + i * 0.1 * s, 0.205 * s]);
  for (const [c, dx] of [['#c1121f', 0], ['#2a8a4a', 0.04], ['#2a4d8f', 0.08]]) { B.cyl(0.014, 0.014, 0.55 * s, c, 'plastic', [0.35 * s + dx, 1.0 * s, 0.25 * s], [0, 0, -0.05], null, 6); B.cone(0.014, 0.05, '#f2d6a0', 'wood', [0.35 * s + dx - 0.015, 1.3 * s, 0.25 * s], null, null, 6); }
  // Anhänger: kleiner Teddy und Stern
  const t1 = hanging(B, [0.55 * s, -0.15 * s, zf + 0.28 * s], 0.18, 2.6, 0.25);
  B.ball(0.08, '#a0703a', 'cloth', [0, -0.07, 0], null, t1, 12);
  B.ball(0.06, '#a0703a', 'cloth', [0, 0.04, 0], null, t1, 12);
  for (const sx of [-1, 1]) { B.ball(0.025, '#a0703a', 'cloth', [sx * 0.045, 0.09, 0], null, t1, 8); B.ball(0.03, '#a0703a', 'cloth', [sx * 0.07, -0.07, 0.02], null, t1, 8); B.ball(0.01, '#111', 'dark', [sx * 0.02, 0.05, 0.055], null, t1, 6); }
  const t2 = hanging(B, [-0.55 * s, -0.15 * s, zf + 0.28 * s], 0.14, 2.9, 0.3);
  B.emblem('star', [0, -0.05, 0], 0.45, t2);
  B.glow(0.35, '#ffe08a', [0, -0.05, 0.03], t2, 0.5);
};

// ── Nr. 8 Münzglas-Träger: Mini-Gläser oben, Seilbindung, Schöpflöffel, Preisschilder ──
X[8] = (B) => {
  [-0.6, -0.2, 0.2, 0.6].forEach((x, i) => {
    B.cyl(0.13, 0.13, 0.3, '#d8f1ff', 'glass', [x, 0.82, 0.55], null, null, 18);
    for (let j = 0; j < 2 + i; j++) B.coin([x, 0.7 + j * 0.06, 0.55], [0, j, 0], null, 0.38, i % 2 ? '#e8ecf2' : COPPER);
    B.cyl(0.11, 0.09, 0.08, '#c9a27a', 'wood', [x, 1.0, 0.55], null, null, 12);
    const tag = hanging(B, [x + 0.1, 0.92, 0.68], 0.08, 2 + i * 0.3, 0.2);
    B.rbox([0.09, 0.06, 0.01], '#efe3c2', 'cloth', [0, -0.03, 0], null, tag, 0.004);
  });
  B.rbox([1.84, 0.06, 0.6], '#7a5232', 'wood', [0, 0.67, 0.55], null, null, 0.02);
  for (const y of [-0.6, -0.1]) { B.tor(0.9, 0.02, '#d9c7a0', 'cloth', [0, y, 0.55], [PI / 2, 0, 0]).scale.set(1, 0.5, 1); }
  const sp = hanging(B, [-0.95, 0.35, 0.8], 0.2, 1.8, 0.15);
  B.cyl(0.015, 0.015, 0.45, '#9aa3ad', 'metal', [0, -0.22, 0], null, sp, 6);
  B.lathe([[0, -0.06], [0.08, -0.05], [0.1, 0.02], [0, 0.0]], '#9aa3ad', 'metal', [0, -0.48, 0], null, sp, 16, 'scoop');
  B.coin([0, -0.45, 0], [0, 0, 0], sp, 0.25);
};

// ── Nr. 9 Lederner Centbeutel: geprägtes Leder, goldener Bügelverschluss, Fransen, Stein ──
X[9] = (B, s, zf, S, nrm) => {
  for (const ly of [-0.6, -0.3, 0.0]) { for (let i = 0; i < 10; i++) { const x = (-0.55 + i * 0.12) * s; B.ball(0.03 * s, '#4a2c18', 'leather', S(x, ly + Math.sin(i * 1.3) * 0.05, 0.002), [1.2, 0.6, 0.3], null, 6).rotation.set(...nrm(x, ly)); } }
  // Bügelverschluss
  B.tor(0.35 * s, 0.035 * s, GOLD, 'gold', S(0, 0.42, 0.04), [0, 0, 0], null, PI);
  B.rbox([0.72 * s, 0.06 * s, 0.06], GOLD, 'gold', S(0, 0.4, 0.03), null, null, 0.02);
  for (const sx of [-1, 1]) B.ball(0.06 * s, GOLD, 'gold', S(sx * 0.08 * s, 0.75, 0.05), null, null, 12);
  B.gem(0.08 * s, '#c1121f', S(0, 0.4, 0.08));
  B.glow(0.4 * s, '#ff6b6b', S(0, 0.4, 0.12), null, 0.5);
  // Fransen unten
  for (let i = 0; i < 16; i++) { const x = (-0.6 + i * 0.08) * s; const q = S(x, -0.85, -0.02); B.cyl(0.012 * s, 0.008 * s, 0.25 * s, '#5a3418', 'leather', [q[0], q[1] - 0.12 * s, q[2]], [0.2, 0, 0], null, 5); B.ball(0.02 * s, GOLD, 'gold', [q[0], q[1] - 0.25 * s, q[2] + 0.02], null, null, 6); }
  for (const sx of [-1, 1]) B.ball(0.05 * s, GOLD, 'gold', S(sx * 0.5 * s, -0.2, 0.01), [1, 1, 0.6], null, 10);
};

// ── Nr. 10 Wanderer-Münzranzen: Pfanne, Laterne, Kompass, Wanderstab, Becher, Seil ──
X[10] = (B, s) => {
  const zc = 0.42 * s, zf = 0.79 * s;
  const pan = hanging(B, [-0.6 * s, -0.25 * s, zf + 0.3 * s], 0.08, 1.6, 0.12);
  B.cyl(0.24 * s, 0.2 * s, 0.05, '#2a2a30', 'metal', [0, -0.26 * s, 0], [PI / 2, 0, 0], pan, 20);
  B.rbox([0.05, 0.32 * s, 0.03], '#2a2a30', 'metal', [0, 0.05 * s, 0], null, pan, 0.015);
  lantern(B, [0.95 * s, 0.5 * s, zc + 0.1 * s], s);
  B.tor(0.04, 0.012, IRON, 'metal', [0.95 * s, 0.76 * s, zc + 0.1 * s]);
  // Kompass am Gurt
  const cp = [-0.52, 0.55, -1.14];
  B.cyl(0.1, 0.1, 0.04, BRASS, 'gold', cp, [PI / 2, 0, 0], null, 18);
  B.cyl(0.085, 0.085, 0.045, '#f2ede4', 'plastic', cp, [PI / 2, 0, 0], null, 18);
  const nd = B.pivot([cp[0], cp[1], cp[2] - 0.03]);
  B.cone(0.015, 0.14, '#c1121f', 'plastic', [0, 0.035, 0], null, nd, 4);
  B.anims.push((t) => { nd.rotation.z = Math.sin(t * 0.7) * 0.4; });
  // Wanderstab schräg
  B.cyl(0.035, 0.04, 2.6, '#7a5232', 'wood', [0.6 * s, 0.4, zc - 0.15], [0, 0, -0.35], null, 8);
  B.tor(0.045, 0.012, LEATHER, 'leather', [0.6 * s + 0.2, 0.95, zc - 0.15], [PI / 2, 0, -0.35]);
  B.ball(0.06, '#7a5232', 'wood', [0.6 * s + 0.44, 1.62, zc - 0.15], null, null, 10);
  // Becher und Seilrolle
  B.cyl(0.08, 0.07, 0.14, '#9aa3ad', 'metal', [-0.85 * s, 0.35 * s, zc + 0.25 * s], null, null, 12);
  B.tor(0.05, 0.012, '#9aa3ad', 'metal', [-0.95 * s, 0.35 * s, zc + 0.25 * s], [0, PI / 2, 0], null, PI);
  for (let i = 0; i < 4; i++) B.tor(0.22 * s - i * 0.004, 0.025, '#c9b27a', 'cloth', [0, -0.95 * s - i * 0.05, zc], [PI / 2, 0, 0]);
  B.coin([0, -1.12 * s, zc + 0.2 * s], [PI / 2, 0, 0], null, 0.35 * s);
};

// ── Nr. 11 Glücksmünzen-Tasche: Hufeisen, Würfel, Marienkäfer, Kleeblätter, Goldbeschläge ──
X[11] = (B, s) => {
  const zf = 0.79 * s;
  horseshoe(B, [0, 0.6 * s, zf + 0.12 * s], s * 1.1, GOLD);
  B.glow(0.6 * s, '#ffe08a', [0, 0.6 * s, zf + 0.2 * s], null, 0.4);
  const d = hanging(B, [0.55 * s, -0.2 * s, zf + 0.3 * s], 0.15, 2.3, 0.25);
  dice(B, [0, -0.05, 0], s, d);
  dice(B, [0.1, -0.12, 0.02], s * 0.9, d, [0.9, 0.2, 0.7]);
  ladybug(B, [-0.52, 0.75, -1.1], 1, [0, PI, 0.3]);
  ladybug(B, [0.4 * s, -0.25 * s, zf + 0.25 * s], s, [0, 0, -0.5]);
  for (const [x, y] of [[-0.62, 0.2], [0.62, 0.0], [-0.62, -0.6]]) { const h = hanging(B, [x * s, y * s, zf - 0.02], 0.12, 2 + x, 0.2); clover(B, [0, -0.06, 0.02], s * 0.8, '#3fbf5a', true, h); }
  B.sparkle(20, [1.8 * s, 2 * s, 1.2 * s], '#9dffb0', [0, 0, 0.7 * s], 0.06, 0.4);
};

// ── Nr. 12 Bronzener Schatzbeutel: Bronzeplatte mit Löwenkopf-Ring, Edelsteine, Kette, Bronzemünzen ──
X[12] = (B, s, zf, S, nrm) => {
  const q = S(0, -0.25, 0.02), r = nrm(0, -0.25);
  const g = B.pivot(q, r);
  B.rbox([0.62 * s, 0.6 * s, 0.05], BRONZE, 'metal', [0, 0, 0], null, g, 0.05);
  B.tor(0.25 * s, 0.025 * s, shade(BRONZE, 0.25), 'gold', [0, 0, 0.03], null, g);
  B.ball(0.13 * s, '#b5763f', 'gold', [0, 0.05 * s, 0.05], [1, 1, 0.6], g, 16);
  for (const sx of [-1, 1]) { B.ball(0.03 * s, '#111', 'dark', [sx * 0.045 * s, 0.08 * s, 0.12], null, g, 6); B.cone(0.05 * s, 0.08 * s, '#b5763f', 'gold', [sx * 0.1 * s, 0.15 * s, 0.05], [0, 0, -sx * 0.5], g, 6); }
  for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; B.cone(0.035 * s, 0.09 * s, '#8a5a33', 'gold', [Math.cos(a) * 0.17 * s, 0.05 * s + Math.sin(a) * 0.17 * s, 0.03], [0, 0, a - PI / 2], g, 5); }
  B.tor(0.12 * s, 0.025 * s, GOLD, 'gold', [0, -0.12 * s, 0.1], null, g);
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) B.gem(0.06 * s, sx * sy > 0 ? '#c1121f' : '#2ec4b6', [sx * 0.24 * s, sy * 0.24 * s, 0.04], null, g);
  chain(B, S(-0.6 * s, 0.35, 0.03), S(0.6 * s, 0.35, 0.03), 14, BRONZE, 'gold', 0.045 * s);
  for (let i = 0; i < 6; i++) B.coin(S((-0.4 + i * 0.16) * s, 0.55 + (i % 2) * 0.05, 0.02), [PI / 2 - 0.3, 0, i * 0.4], null, 0.35 * s, i % 2 ? BRONZE : GOLD);
  B.glow(1.2 * s, '#ffb36b', S(0, -0.25, 0.2), null, 0.3);
};
