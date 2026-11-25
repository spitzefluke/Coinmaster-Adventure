// ── Befragung, Runde 2: Nr. 2 bis 35 ──

// Hufeisen mit Öffnung nach oben, flach geschmiedet, mit Nagellöchern und Stollen
horseshoe = function (B, p, s, c, par) {
  const g = B.pivot(p, null, par);
  B.tor(0.17 * s, 0.05 * s, c, 'gold', [0, 0, 0], [0, 0, PI * 0.86], g, PI * 1.28).scale.set(1, 1.12, 0.55);
  for (let i = 0; i < 8; i++) { const a = PI * 0.95 + i * (PI * 1.1 / 7); if (i === 3 || i === 4) continue; B.box([0.018 * s, 0.03 * s, 0.03], DARK, 'dark', [Math.cos(a) * 0.17 * s, Math.sin(a) * 0.19 * s, 0.025 * s], [0, 0, a], g); }
  for (const sx of [-1, 1]) B.rbox([0.07 * s, 0.05 * s, 0.06 * s], shade(c, -0.15), 'gold', [sx * 0.15 * s, 0.13 * s, 0], null, g, 0.015);
  B.ball(0.03 * s, shade(c, 0.3), 'gold', [0, -0.19 * s, 0.03 * s], [1, 1, 0.5], g, 8);
  return g;
};
// Kleeblatt aus vier Herzblättern mit geschwungenem Stiel und Blattadern
clover = function (B, p, s, c = '#3fbf5a', glow, par) {
  const g = B.pivot(p, null, par);
  for (let i = 0; i < 4; i++) {
    const a = i * PI / 2 + PI / 4, lp = B.pivot([0, 0, 0], [0, 0, a - PI / 2], g);
    for (const sx of [-1, 1]) B.ball(0.05 * s, i === 0 ? shade(c, 0.1) : c, glow ? 'neon' : 'plastic', [sx * 0.032 * s, 0.075 * s, 0], [1, 1.25, 0.28], lp, 12).rotation.z = -sx * 0.4;
    B.box([0.006, 0.07 * s, 0.012], shade(c, -0.35), 'plastic', [0, 0.05 * s, 0.012], null, lp);
  }
  B.ball(0.018 * s, shade(c, -0.3), 'plastic', [0, 0, 0.01], null, g, 8);
  for (let i = 0; i < 4; i++) B.cyl(0.008 * s, 0.008 * s, 0.06 * s, shade(c, -0.3), 'plastic', [Math.sin(i * 0.35) * 0.03 * s, -0.04 * s - i * 0.05 * s, 0], [0, 0, 0.35 - i * 0.12], g, 5);
  if (glow) B.glow(0.5 * s, c, [0, 0, 0.04], g, 0.7);
  return g;
};

// ── Nr. 2: Ranzen aus Münzen ──
A.coinpack = (B, p) => {
  const s = p.size || 1, zc = 0.42 * s, W = 1.5 * s, H = 1.7 * s, D = 0.72 * s, zf = zc + D / 2;
  B.straps(LEATHER, 'leather');
  B.rbox([W, H, D], '#8a6a2a', 'gold', [0, 0, zc], null, null, 0.2 * s);
  // Schuppen aus Münzen, von unten nach oben überlappend
  for (let r = 0; r < 9; r++) for (let i = 0; i < 7; i++) {
    const x = (-0.6 + i * 0.2 + (r % 2) * 0.1) * s, y = (-0.72 + r * 0.18) * s;
    if (Math.abs(x) > 0.66 * s) continue;
    const c = (r * 3 + i) % 7 === 0 ? '#c0c6cf' : (r + i) % 5 === 0 ? '#b87333' : GOLD;
    B.coin([x, y, zf + 0.02 + r * 0.004], [PI / 2 - 0.22, 0, (i - 3) * 0.05], null, 0.42 * s, c);
  }
  for (const sx of [-1, 1]) for (let r = 0; r < 7; r++) for (let i = 0; i < 3; i++) B.coin([sx * (W / 2 + 0.02), (-0.65 + r * 0.2) * s, zc + (-0.22 + i * 0.22 + (r % 2) * 0.11) * s], [0, 0, sx * PI / 2], null, 0.4 * s, GOLD).rotation.set(0.2, 0, sx * PI / 2);
  // Klappe aus größeren Münzen
  for (let i = 0; i < 5; i++) B.coin([(-0.5 + i * 0.25) * s, 0.7 * s, zf + 0.08], [PI / 2 - 0.35, 0, 0], null, 0.5 * s, i % 2 ? '#ffd23f' : GOLD);
  B.tor(0.1 * s, 0.025 * s, GOLD, 'gold', [0, 0.92 * s, zc], null, null, PI);
  B.buckle([0, 0.45 * s, zf + 0.12], 0.7 * s, '#fff1a8');
  B.glow(1.8 * s, '#ffe08a', [0, 0, zf + 0.2], null, 0.18);
  B.sparkle(18, [1.8 * s, 2 * s, 1.2 * s], '#fff1a8', [0, 0, 0.6 * s], 0.06, 0.3);
};

// ── Nr. 3: rostiger Sack mit Eisenbändern ──
X[3] = (B, s, zf, S, nrm) => {
  const RUST = ['#7a3410', '#9a4416', '#5e260c', '#b5651d', '#6b4a2a'];
  for (let i = 0; i < 26; i++) { const x = Math.sin(i * 2.7) * 0.6 * s, ly = -0.85 + ((i * 0.37) % 1.5); B.ball(0.06 * s + (i % 4) * 0.025 * s, RUST[i % 5], 'stone', S(x, ly, -0.006), [1.4, 1, 0.12], null, 10).rotation.set(...nrm(x, ly)); }
  for (let i = 0; i < 7; i++) { const x = (-0.45 + i * 0.15) * s; const q = S(x, 0.15 - (i % 3) * 0.12, 0.004); B.cyl(0.014 * s, 0.003 * s, 0.35 * s, '#7a3410', 'stone', [q[0], q[1] - 0.17 * s, q[2]], [0.3, 0, 0], null, 5); }
  for (const ly of [-0.45, 0.25]) {
    const r = sackR(ly) * 0.95 * s * 1.03;
    B.tor(r, 0.045 * s, '#6b3a1a', 'metal', [0, -0.1 * s + ly * 0.9 * s, 0.66 * s], [PI / 2, 0, 0]).scale.set(1, 0.78 / 0.95, 1);
    for (let i = 0; i < 7; i++) { const a = -1.2 + i * 0.4; B.ball(0.03 * s, '#4a2410', 'metal', [Math.sin(a) * r, -0.1 * s + ly * 0.9 * s, 0.66 * s + Math.cos(a) * r * 0.82], null, null, 6); }
  }
  B.rbox([0.18 * s, 0.22 * s, 0.05], '#6b3a1a', 'metal', S(0, 0.25, 0.05), null, null, 0.02);
  B.tor(0.06 * s, 0.018 * s, '#7a4a2a', 'metal', S(0, 0.38, 0.06));
  B.sparkle(10, [1.4 * s, 1.6 * s, 1 * s], '#c9732a', [0, -0.2, 0.9 * s], 0.05, -0.25);
};

// ── Nr. 4: ohne die zwei Riemen vorn ──
X[4] = (B, s) => {
  const zc = 0.55 * s, zf = zc + 0.45 * s;
  for (const sx of [-1, 1]) { B.tor(0.15 * s, 0.035 * s, '#d9c7a0', 'cloth', [sx * 0.86 * s, -0.12 * s, zc], [0, PI / 2, 0], null, PI); for (let i = 0; i < 6; i++) B.box([0.015, 0.06, 0.07], '#b8a37a', 'cloth', [sx * 0.86 * s, -0.12 * s + Math.sin(i / 5 * PI) * 0.15 * s, zc + Math.cos(i / 5 * PI) * 0.15 * s], [i * 0.5, 0, 0]); }
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

// ── Nr. 5: ohne Münzberge und Münzanstecker ──
X[5] = (B) => {
  for (const sx of [-1, 1]) {
    B.rbox([0.32, 0.5, 0.5], '#8a5a33', 'leather', [sx * 1.08, -0.25, 0.8], null, null, 0.08);
    B.rbox([0.34, 0.2, 0.52], '#6e4426', 'leather', [sx * 1.09, -0.06, 0.8], [0, 0, sx * 0.1], null, 0.05);
    B.buckle([sx * 1.26, -0.2, 0.8], 0.45, BRASS).rotation.y = PI / 2;
    B.seam([sx * 1.255, -0.48, 0.6], [sx * 1.255, -0.48, 1.0], '#e9d8b0', 5);
  }
  B.rbox([1.6, 0.06, 0.16], '#8a5a33', 'leather', [0, 0.32, 0.8], null, null, 0.02);
  for (const sx of [-1, 1]) B.cone(0.11, 0.18, '#3a5bd9', 'cloth', [sx * 0.1, -0.5, 1.48], [0, 0, sx * PI / 2], null, 4).scale.set(1, 1, 0.4);
  B.ball(0.05, '#2a3f99', 'cloth', [0, -0.5, 1.5], null, null, 10);
  for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; B.ball(0.045, '#ffffff', 'plastic', [-0.5 + Math.cos(a) * 0.055, 0.9 + Math.sin(a) * 0.055, 1.05], [1, 1, 0.4], null, 8); }
  B.ball(0.035, '#ffcf4a', 'plastic', [-0.5, 0.9, 1.07], null, null, 8);
  B.sparkle(14, [2, 1.6, 1.4], '#ffe9a0', [0, 0.2, 0.9], 0.06, 0.4);
};

// ── Nr. 6: ohne Waage und Rechenbrett, mit mehr kleinen Taschen an den Seiten ──
X[6] = (B, s) => {
  const zc = 0.42 * s;
  for (const sx of [-1, 1]) {
    B.rbox([0.06, 1.5 * s, 0.08], '#3a2414', 'leather', [sx * 0.8 * s, 0, zc], null, null, 0.02);
    [[0.45, '#8a5a33'], [0.0, '#6b1f2a'], [-0.45, '#2a4d8f']].forEach(([y, c], i) => {
      const off = sx > 0 ? (i + 1) % 3 : i;
      pouch(B, [sx * 0.95 * s, y * s, zc + (i % 2 ? 0.12 : -0.05) * s], s * (0.85 + (i % 2) * 0.1), [c, '#5a4a3a', '#7a4a26'][off], GOLD);
    });
  }
  B.rbox([1.0 * s, 0.5 * s, 0.22 * s], '#3a2414', 'leather', [0, -0.5 * s, zc + 0.48 * s], null, null, 0.06);
  B.rbox([1.02 * s, 0.2 * s, 0.06], '#2a180c', 'leather', [0, -0.3 * s, zc + 0.6 * s], [-0.1, 0, 0], null, 0.02);
  B.buckle([0, -0.38 * s, zc + 0.63 * s], 0.5 * s, GOLD);
  B.coin([0, -0.55 * s, zc + 0.6 * s], null, null, 0.4 * s);
  B.emblem('star', [0, -0.55 * s, zc + 0.64 * s], 0.25 * s);
};

// ── Nr. 7 (neu): günstiger Rucksack mit Preisschild ──
X[7] = (B, s) => {
  const zf = 0.79 * s;
  const tag = hanging(B, [0.45 * s, 0.88 * s, 0.6 * s], 0.32, 2.6, 0.3);
  B.rbox([0.26 * s, 0.36 * s, 0.012], '#f6f1e2', 'cloth', [0, -0.16 * s, 0], [0, 0, 0.1], tag, 0.02);
  B.tor(0.025 * s, 0.008, '#c0c6cf', 'metal', [0.02 * s, 0.0, 0.008], null, tag);
  for (let i = 0; i < 12; i++) B.box([i % 3 ? 0.006 : 0.012, 0.08 * s, 0.014], '#111', 'dark', [(-0.08 + i * 0.014) * s, -0.24 * s, 0.003], [0, 0, 0.1], tag);
  B.cyl(0.07 * s, 0.07 * s, 0.016, '#e63946', 'plastic', [0.02 * s, -0.08 * s, 0.006], [PI / 2, 0, 0], tag, 20);
  B.coin([0.02 * s, -0.08 * s, 0.014], [PI / 2, 0, 0], tag, 0.16 * s);
  B.rbox([0.3 * s, 0.12 * s, 0.01], '#ffd23f', 'plastic', [-0.42 * s, 0.6 * s, zf + 0.11 * s], [-0.06, 0, 0.25], null, 0.03);
  B.rbox([0.2 * s, 0.025 * s, 0.012], '#e63946', 'plastic', [-0.42 * s, 0.6 * s, zf + 0.115 * s], [-0.06, 0, 0.25], null, 0.008);
  for (const sx of [-1, 1]) B.rbox([0.1 * s, 0.14 * s, 0.05], '#1a1a1a', 'plastic', [sx * 0.42 * s, -0.18 * s, zf + 0.12 * s], null, null, 0.02);
  B.box([0.9 * s, 0.02, 0.03], '#1a1a1a', 'plastic', [0, -0.17 * s, zf + 0.24 * s]);
  B.rbox([0.05, 0.1, 0.02], '#9aa3ad', 'metal', [0.3 * s, -0.22 * s, zf + 0.25 * s], null, null, 0.01);
  for (let i = 0; i < 6; i++) B.box([0.012, 0.03, 0.012], '#e9d8b0', 'plastic', [0.62 * s, (0.3 - i * 0.12) * s, zf - 0.08 * s], [0, 0, (i % 2 ? 0.5 : -0.5)]);
};

// ── Nr. 8: Mini-Gläser, deren Münzen beim Laufen wackeln ──
X[8] = (B) => {
  [-0.6, -0.2, 0.2, 0.6].forEach((x, i) => {
    B.cyl(0.13, 0.13, 0.3, '#d8f1ff', 'glass', [x, 0.82, 0.55], null, null, 18);
    const wob = B.pivot([x, 0.7, 0.55]);
    for (let j = 0; j < 2 + i; j++) B.coin([0, j * 0.06, 0], [0, j, 0], wob, 0.38, i % 2 ? '#e8ecf2' : '#b87333');
    B.anims.push((t) => { const ph = WALK.phase * 2 + i * 1.3, k = WALK.k; wob.position.y = 0.7 + Math.abs(Math.sin(ph)) * 0.04 * k; wob.rotation.z = Math.sin(ph) * 0.15 * k; });
    B.cyl(0.11, 0.09, 0.08, '#c9a27a', 'wood', [x, 1.0, 0.55], null, null, 12);
    const tag = hanging(B, [x + 0.1, 0.92, 0.68], 0.08, 2 + i * 0.3, 0.2);
    B.rbox([0.09, 0.06, 0.01], '#efe3c2', 'cloth', [0, -0.03, 0], null, tag, 0.004);
  });
  B.rbox([1.84, 0.06, 0.6], '#7a5232', 'wood', [0, 0.67, 0.55], null, null, 0.02);
  for (const y of [-0.6, -0.1]) B.tor(0.9, 0.02, '#d9c7a0', 'cloth', [0, y, 0.55], [PI / 2, 0, 0]).scale.set(1, 0.5, 1);
  const sp = hanging(B, [-0.95, 0.35, 0.8], 0.2, 1.8, 0.15);
  B.cyl(0.015, 0.015, 0.45, '#9aa3ad', 'metal', [0, -0.22, 0], null, sp, 6);
  B.lathe([[0, -0.06], [0.08, -0.05], [0.1, 0.02], [0, 0.0]], '#9aa3ad', 'metal', [0, -0.48, 0], null, sp, 16, 'scoop');
  B.coin([0, -0.45, 0], [0, 0, 0], sp, 0.25);
};

// ── Nr. 9: schlichter Lederbeutel, oben schauen Centmünzen heraus ──
X[9] = (B, s, zf, S, nrm) => {
  for (const ly of [-0.55, -0.2, 0.15]) for (let i = 0; i < 11; i++) { const x = (-0.6 + i * 0.12) * s; B.ball(0.026 * s, '#4a2c18', 'leather', S(x, ly + Math.sin(i * 1.3) * 0.04, 0.002), [1.2, 0.6, 0.3], null, 6).rotation.set(...nrm(x, ly)); }
  for (const sx of [-1, 1]) B.ball(0.045 * s, '#c9a227', 'gold', S(sx * 0.45 * s, -0.1, 0.01), [1, 1, 0.6], null, 10);
  B.glow(0.9 * s, '#ffb36b', [0, 0.85 * s, 0.66 * s], null, 0.45);
};

// ── Nr. 10: ohne das Hängende unten, bessere Pfanne ──
X[10] = (B, s) => {
  const zc = 0.42 * s, zf = 0.79 * s;
  const pan = B.pivot([-0.92 * s, -0.25 * s, zc + 0.05], [0, -PI / 2 + 0.25, 0.15]);
  B.lathe([[0, -0.02], [0.24, -0.02], [0.28, 0.02], [0.3, 0.07], [0.285, 0.075], [0.26, 0.03], [0.22, 0.0], [0, 0.0]].map(([x, y]) => [x * s, y * s]), '#2a2a30', 'metal', [0, 0, 0], [PI / 2, 0, 0], pan, 32, 'pan2' + s);
  B.tor(0.17 * s, 0.006, '#3a3a42', 'metal', [0, 0, 0.002], null, pan);
  B.rbox([0.06 * s, 0.42 * s, 0.035], '#2a2a30', 'metal', [0, 0.48 * s, 0.03], null, pan, 0.015);
  B.rbox([0.075 * s, 0.22 * s, 0.05], '#6b4a2a', 'wood', [0, 0.6 * s, 0.03], null, pan, 0.02);
  B.tor(0.025 * s, 0.008, '#2a2a30', 'metal', [0, 0.73 * s, 0.03], null, pan);
  for (const sx of [-1, 1]) B.ball(0.015 * s, '#9aa3ad', 'metal', [sx * 0.02 * s, 0.31 * s, 0.05], null, pan, 6);
  B.rbox([0.08, 0.5 * s, 0.03], LEATHER, 'leather', [-0.92 * s, -0.25 * s, zc + 0.05], [0, 0, 0.15], null, 0.01);
  lantern(B, [0.95 * s, 0.5 * s, zc + 0.1 * s], s);
  B.tor(0.04, 0.012, IRON, 'metal', [0.95 * s, 0.76 * s, zc + 0.1 * s]);
  const cp = [-0.52, 0.55, -1.14];
  B.cyl(0.1, 0.1, 0.04, BRASS, 'gold', cp, [PI / 2, 0, 0], null, 18);
  B.cyl(0.085, 0.085, 0.045, '#f2ede4', 'plastic', cp, [PI / 2, 0, 0], null, 18);
  const nd = B.pivot([cp[0], cp[1], cp[2] - 0.03]);
  B.cone(0.015, 0.14, '#c1121f', 'plastic', [0, 0.035, 0], null, nd, 4);
  B.anims.push((t) => { nd.rotation.z = Math.sin(t * 0.7) * 0.4; });
  B.cyl(0.035, 0.04, 2.6, '#7a5232', 'wood', [0.6 * s, 0.4, zc - 0.15], [0, 0, -0.35], null, 8);
  B.tor(0.045, 0.012, LEATHER, 'leather', [0.6 * s + 0.2, 0.95, zc - 0.15], [PI / 2, 0, -0.35]);
  B.ball(0.06, '#7a5232', 'wood', [0.6 * s + 0.44, 1.62, zc - 0.15], null, null, 10);
  B.cyl(0.08, 0.07, 0.14, '#9aa3ad', 'metal', [-0.6 * s, 0.6 * s, zf + 0.15 * s], null, null, 12);
  B.tor(0.05, 0.012, '#9aa3ad', 'metal', [-0.7 * s, 0.6 * s, zf + 0.15 * s], [0, PI / 2, 0], null, PI);
};

// ── Nr. 11: besseres Hufeisen (Öffnung oben) und Glücksklee ──
X[11] = (B, s) => {
  const zf = 0.79 * s;
  horseshoe(B, [0, 0.62 * s, zf + 0.12 * s], s * 1.25, GOLD);
  B.glow(0.7 * s, '#ffe08a', [0, 0.62 * s, zf + 0.2 * s], null, 0.4);
  const d = hanging(B, [0.55 * s, -0.2 * s, zf + 0.3 * s], 0.15, 2.3, 0.25);
  dice(B, [0, -0.05, 0], s, d);
  dice(B, [0.1, -0.12, 0.02], s * 0.9, d, [0.9, 0.2, 0.7]);
  ladybug(B, [-0.52, 0.75, -1.1], 1, [0, PI, 0.3]);
  for (const [x, y] of [[-0.62, 0.2], [0.62, 0.0], [-0.62, -0.6]]) { const h = hanging(B, [x * s, y * s, zf - 0.02], 0.12, 2 + x, 0.2); clover(B, [0, -0.08, 0.02], s * 0.9, '#3fbf5a', true, h); }
  B.sparkle(20, [1.8 * s, 2 * s, 1.2 * s], '#9dffb0', [0, 0, 0.7 * s], 0.06, 0.4);
};

// ── Nr. 12: Platte vorn entfernt, Oberteil mit Bronzekragen und Edelsteinen ──
X[12] = (B, s, zf, S, nrm) => {
  const ny = -0.1 * s + 0.8 * 0.9 * s, cz = 0.66 * s;
  B.lathe([[0.28, -0.1], [0.32, -0.05], [0.33, 0.06], [0.29, 0.1]].map(([x, y]) => [x * s, y * s]), BRONZE, 'metal', [0, ny, cz], null, null, 32, 'collar' + s).scale.set(1, 1, 0.82);
  for (let i = 0; i < 10; i++) { const a = i / 10 * PI * 2; B.gem(0.035 * s, i % 2 ? '#c1121f' : '#2ec4b6', [Math.sin(a) * 0.33 * s, ny, cz + Math.cos(a) * 0.33 * s * 0.82], [PI / 2, a, 0]); }
  for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; B.cone(0.05 * s, 0.14 * s, BRONZE, 'gold', [Math.sin(a) * 0.3 * s, ny + 0.16 * s, cz + Math.cos(a) * 0.25 * s], [Math.cos(a) * 0.4, 0, -Math.sin(a) * 0.4], null, 6); }
  for (let i = 0; i < 7; i++) B.coin([Math.sin(i * 2.4) * 0.12 * s, ny + 0.16 * s + (i % 3) * 0.05 * s, cz + Math.cos(i * 2.4) * 0.1 * s], [PI / 2 + Math.sin(i) * 0.8, i, 0.3], null, 0.5 * s, i % 2 ? BRONZE : GOLD);
  B.glow(1.0 * s, '#ffb36b', [0, ny + 0.2 * s, cz], null, 0.5);
  chain(B, S(-0.6 * s, 0.35, 0.03), S(0.6 * s, 0.35, 0.03), 14, BRONZE, 'gold', 0.045 * s);
  for (const sx of [-1, 1]) { const q = S(sx * 0.62 * s, 0.35, 0.05); B.ball(0.07 * s, BRONZE, 'gold', q, null, null, 10); B.gem(0.04 * s, '#c1121f', [q[0], q[1], q[2] + 0.06]); }
};

// ── Nr. 13 (neu): Rucksack mit hängendem Prägewerkzeug ──
X[13] = (B, s) => {
  const zc = 0.42 * s, zf = 0.79 * s;
  B.rbox([1.4 * s, 0.08 * s, 0.06], IRON, 'metal', [0, 0.25 * s, zf + 0.1 * s], null, null, 0.02);
  for (let i = 0; i < 5; i++) B.tor(0.035, 0.01, '#9aa3ad', 'metal', [(-0.56 + i * 0.28) * s, 0.2 * s, zf + 0.14 * s], [0, PI / 2, 0], null, PI);
  const hooks = (-0.56), step = 0.28;
  // Hammer
  let h = hanging(B, [hooks * s, 0.18 * s, zf + 0.15 * s], 0.06, 1.5, 0.12);
  B.rbox([0.05, 0.42 * s, 0.05], '#7a5232', 'wood', [0, -0.25 * s, 0], null, h, 0.02);
  B.rbox([0.24 * s, 0.1 * s, 0.1 * s], '#59606b', 'metal', [0, -0.47 * s, 0], null, h, 0.025);
  // Prägestempel (Ober- und Unterstempel) mit Münzbild
  h = hanging(B, [(hooks + step) * s, 0.18 * s, zf + 0.15 * s], 0.08, 1.7, 0.12);
  for (const y of [-0.18, -0.38]) { B.cyl(0.07 * s, 0.07 * s, 0.17 * s, '#9aa3ad', 'metal', [0, y * s, 0], null, h, 14); B.coin([0, (y - 0.09) * s, 0], [0, 0, 0], h, 0.22 * s, GOLD); }
  // Zange
  h = hanging(B, [(hooks + 2 * step) * s, 0.18 * s, zf + 0.15 * s], 0.05, 1.9, 0.1);
  for (const sx of [-1, 1]) B.cyl(0.015, 0.015, 0.55 * s, '#3a3f4a', 'metal', [sx * 0.03 * s, -0.3 * s, 0], [0, 0, sx * 0.08], h, 6);
  B.ball(0.03 * s, '#3a3f4a', 'metal', [0, -0.1 * s, 0], null, h, 8);
  for (const sx of [-1, 1]) B.rbox([0.05 * s, 0.1 * s, 0.03], '#3a3f4a', 'metal', [sx * 0.045 * s, -0.6 * s, 0], [0, 0, -sx * 0.4], h, 0.01);
  // Punzen-Rolle
  h = hanging(B, [(hooks + 3 * step) * s, 0.18 * s, zf + 0.15 * s], 0.04, 1.6, 0.08);
  B.rbox([0.22 * s, 0.4 * s, 0.05], '#6b3f22', 'leather', [0, -0.22 * s, 0], null, h, 0.03);
  for (let i = 0; i < 4; i++) { B.cyl(0.015, 0.015, 0.3 * s, '#c0c6cf', 'metal', [(-0.07 + i * 0.047) * s, -0.2 * s, 0.03], null, h, 6); B.ball(0.02, GOLD, 'gold', [(-0.07 + i * 0.047) * s, -0.04 * s, 0.03], null, h, 6); }
  // Feile
  h = hanging(B, [(hooks + 4 * step) * s, 0.18 * s, zf + 0.15 * s], 0.05, 2.1, 0.12);
  B.rbox([0.05 * s, 0.45 * s, 0.015], '#7a7f8a', 'metal', [0, -0.3 * s, 0], null, h, 0.005);
  for (let i = 0; i < 8; i++) B.box([0.052 * s, 0.006, 0.017], '#4a4f5a', 'metal', [0, (-0.12 - i * 0.045) * s, 0], [0, 0, 0.3], h);
  B.rbox([0.06, 0.15 * s, 0.05], '#7a5232', 'wood', [0, -0.03 * s, 0], null, h, 0.02);
  // Rohlinge und ein kleiner Amboss-Block oben
  B.rbox([0.5 * s, 0.22 * s, 0.35 * s], '#4a4f5a', 'metal', [0, 0.98 * s, zc], null, null, 0.04);
  for (let i = 0; i < 5; i++) B.coin([0.1 * s, 1.1 * s + i * 0.03, zc], [0, i, 0], null, 0.4 * s, '#d9c7a0');
  B.coin([-0.12 * s, 1.11 * s, zc], [0, 0, 0], null, 0.45 * s);
  B.glow(0.5 * s, '#ffcf4a', [-0.12 * s, 1.14 * s, zc], null, 0.6);
};

// ── Nr. 17: besseres Oberteil (Haube mit Griff, Messingkappen, Feldflasche) ──
X[17] = (B, s) => {
  const zc = 0.42 * s, top = 0.875 * s;
  B.lathe([[0, 0.22], [0.4, 0.2], [0.62, 0.1], [0.72, 0], [0, 0]].map(([x, y]) => [x * s, y * s]), '#3a4325', 'leather', [0, top - 0.06, zc], null, null, 28, 'hood' + s).scale.set(1.05, 1, 0.55);
  B.seam([-0.6 * s, top + 0.02, zc + 0.36 * s], [0.6 * s, top + 0.02, zc + 0.36 * s], '#e9d8b0', 10);
  B.tor(0.18 * s, 0.035 * s, '#2a3018', 'leather', [0, top + 0.18 * s, zc], null, null, PI);
  for (const sx of [-1, 1]) { B.rbox([0.08 * s, 0.06, 0.08], '#cd8a4f', 'metal', [sx * 0.18 * s, top + 0.16 * s, zc], null, null, 0.02); }
  const roll = top + 0.42 * s;
  for (const sx of [-1, 1]) { B.cyl(0.25 * s, 0.25 * s, 0.05, '#cd8a4f', 'metal', [sx * 0.88 * s, roll, zc], [0, 0, PI / 2], null, 20); B.ball(0.05 * s, '#cd8a4f', 'gold', [sx * 0.92 * s, roll, zc], null, null, 10); }
  B.lathe([[0, -0.15], [0.12, -0.14], [0.13, 0.08], [0.06, 0.14], [0.04, 0.2], [0, 0.2]].map(([x, y]) => [x * s, y * s]), '#5a6b4a', 'metal', [0.95 * s, -0.2 * s, zc], null, null, 18, 'flask' + s);
  B.tor(0.13 * s, 0.015, '#3a2414', 'leather', [0.95 * s, -0.2 * s, zc], [PI / 2, 0, 0]);
};

// ── Nr. 19: Schildmitte mit großer Münzprägung und Runenring ──
X[19] = ((orig) => (B, s) => {
  orig(B, s);
  B.cyl(0.42 * s, 0.42 * s, 0.05, '#b5763f', 'gold', [0, 0, 0.36], [PI / 2, 0, 0], null, 40);
  B.tor(0.42 * s, 0.03 * s, '#ffd23f', 'gold', [0, 0, 0.39]);
  for (let i = 0; i < 16; i++) { const a = i / 16 * PI * 2; B.rbox([0.02, 0.07 * s, 0.015], '#ffe08a', 'neon', [Math.cos(a) * 0.5 * s, Math.sin(a) * 0.5 * s, 0.37], [0, 0, a + (i % 2) * 0.5], null, 0.005); }
  B.emblem('star', [0, 0, 0.42], 1.1 * s);
})(X[19]);

// ── Nr. 20: mehr Details (Gürtel mit Taschen, Patronenschlaufen, Sporn) ──
X[20] = ((orig) => (B, s, zf, S, nrm) => {
  orig(B, s, zf, S, nrm);
  const ly = -0.55, r = sackR(ly) * 0.95 * s * 1.04, y = -0.1 * s + ly * 0.9 * s;
  B.tor(r, 0.05 * s, '#3a2414', 'leather', [0, y, 0.66 * s], [PI / 2, 0, 0]).scale.set(1, 0.82, 1);
  for (let i = 0; i < 9; i++) { const a = -1.0 + i * 0.25; B.cyl(0.025 * s, 0.025 * s, 0.12 * s, BRONZE, 'gold', [Math.sin(a) * (r + 0.03), y + 0.03, 0.66 * s + Math.cos(a) * (r + 0.03) * 0.82], null, null, 8); }
  B.buckle(S(0, ly, 0.06), 0.6 * s, BRONZE);
  const sp = hanging(B, S(-0.45 * s, ly - 0.05, 0.05), 0.08, 2.2, 0.2);
  B.cyl(0.08 * s, 0.08 * s, 0.015, '#c0c6cf', 'metal', [0, -0.08 * s, 0], [PI / 2, 0, 0], sp, 10);
  for (let i = 0; i < 8; i++) B.cone(0.012, 0.05 * s, '#c0c6cf', 'metal', [Math.cos(i * 0.785) * 0.09 * s, -0.08 * s + Math.sin(i * 0.785) * 0.09 * s, 0], [0, 0, i * 0.785 - PI / 2], sp, 4);
})(X[20]);

// ── Nr. 21: ohne Krone und Münze ──
X[21] = (B) => {
  for (const sx of [-1, 1]) {
    const door = B.pivot([sx * 0.85, -0.05, 0.86], [0, -sx * 1.15, 0]);
    B.rbox([0.86, 1.95, 0.04], '#cd8a4f', 'metal', [-sx * 0.43, 0, 0], null, door, 0.02);
    B.rbox([0.72, 1.8, 0.05], '#dff1ff', 'glass', [-sx * 0.43, 0, 0], null, door, 0.01);
    for (const y of [-0.3, 0.33]) B.box([0.74, 0.03, 0.05], '#cd8a4f', 'metal', [-sx * 0.43, y, 0], null, door);
    B.ball(0.04, GOLD, 'gold', [-sx * 0.78, 0, 0.05], null, door, 8);
    B.anims.push((t) => { door.rotation.y = -sx * (1.15 + Math.sin(t * 0.6) * 0.25); });
  }
  B.rbox([1.9, 0.16, 0.2], '#6b1f2a', 'cloth', [0, 0.9, 0.9], null, null, 0.05);
  for (let i = 0; i < 9; i++) { B.cone(0.06, 0.16, '#6b1f2a', 'cloth', [-0.8 + i * 0.2, 0.75, 0.95], [PI, 0, 0], null, 8); B.ball(0.025, GOLD, 'gold', [-0.8 + i * 0.2, 0.66, 0.95], null, null, 6); }
  B.rbox([1.86, 0.1, 0.2], '#cd8a4f', 'metal', [0, 1.05, 0.6], null, null, 0.03);
  for (const sx of [-1, 1]) lantern(B, [sx * 1.05, 0.6, 0.85], 0.9, '#ffd27a');
  for (const [x, c] of [[-0.6, '#c1121f'], [0.6, '#2ec4b6'], [0, '#4cc9f0']]) B.gem(0.07, c, [x, 1.05, 0.71]);
  B.sparkle(14, [1.6, 2, 1], '#ffe9b0', [0, 0, 0.7], 0.05, 0.2);
};

// ── Nr. 23: richtiger Rucksack (Kompressionsriemen, Netztaschen, Griff, Spanngummi) ──
X[23] = (B, s) => {
  const zc = 0.42 * s, zf = 0.79 * s, W = 0.75 * s;
  for (const sx of [-1, 1]) {
    for (const y of [-0.35, 0.3]) { B.rbox([0.05, 0.08 * s, 0.6 * s], '#2a2f3a', 'cloth', [sx * (W + 0.02), y * s, zc], null, null, 0.02); B.buckle([sx * (W + 0.05), y * s, zc + 0.15 * s], 0.4 * s, SILVER).rotation.y = PI / 2; }
    B.lathe([[0.18, -0.2], [0.2, 0.15], [0.17, 0.2]].map(([x, y]) => [x * s, y * s]), '#cfd6e0', 'cloth', [sx * (W + 0.15 * s), -0.5 * s, zc], null, null, 16, 'mesh' + s).scale.set(0.8, 1, 1);
    B.cyl(0.11 * s, 0.11 * s, 0.4 * s, '#3a8ac4', 'plastic', [sx * (W + 0.15 * s), -0.42 * s, zc], null, null, 14);
    B.cyl(0.07 * s, 0.07 * s, 0.08 * s, '#1a1a1a', 'plastic', [sx * (W + 0.15 * s), -0.18 * s, zc], null, null, 12);
  }
  for (let i = 0; i < 6; i++) { const x0 = (-0.45 + (i % 2) * 0.9) * s, x1 = (-0.45 + ((i + 1) % 2) * 0.9) * s, y0 = (0.05 - i * 0.12) * s, y1 = (0.05 - (i + 1) * 0.12) * s; const d = Math.hypot(x1 - x0, y1 - y0); B.cyl(0.012, 0.012, d, '#111', 'plastic', [(x0 + x1) / 2, (y0 + y1) / 2, zf + 0.28 * s], [0, 0, Math.atan2(y1 - y0, x1 - x0) - PI / 2], null, 5); }
  for (let i = 0; i < 7; i++) B.ball(0.02, SILVER, 'metal', [(i % 2 ? 0.45 : -0.45) * s, (0.05 - i * 0.12) * s, zf + 0.28 * s], null, null, 6);
  B.tor(0.15 * s, 0.03 * s, '#2a2f3a', 'cloth', [0, 0.93 * s, zc], null, null, PI);
  for (const x of [-0.3, 0.3]) { B.rbox([0.03, 0.1, 0.02], SILVER, 'metal', [x * s, 0.82 * s, zf + 0.04], null, null, 0.01); B.tor(0.02, 0.006, SILVER, 'metal', [x * s, 0.76 * s, zf + 0.04]); }
  B.coin([0, -0.5 * s, zf + 0.24 * s], null, null, 0.4 * s, SILVER);
  B.emblem('star', [0, -0.5 * s, zf + 0.27 * s], 0.22 * s);
};

// ── Nr. 24 (neu): Beutel in Mondform ──
A.moonbag = (B, p) => {
  const s = p.size || 1, c = p.c || '#2b2f4a', cz = 0.62 * s;
  B.straps('#3a3f5a', 'leather', { metal: SILVER });
  const m = B.tor(0.62 * s, 0.34 * s, c, 'cloth', [0, -0.05 * s, cz], [0, 0, -PI * 0.15], null, PI * 1.25);
  m.scale.set(1, 1, 0.62);
  for (const a of [-PI * 0.15, PI * 1.1]) B.ball(0.34 * s, c, 'cloth', [Math.cos(a) * 0.62 * s, -0.05 * s + Math.sin(a) * 0.62 * s, cz], [1, 1, 0.62], null, 20);
  B.tor(0.62 * s, 0.025 * s, SILVER, 'metal', [0, -0.05 * s, cz + 0.2 * s], [0, 0, -PI * 0.15], null, PI * 1.25);
  B.tor(0.96 * s, 0.03 * s, SILVER, 'metal', [0, -0.05 * s, cz], [0, 0, -PI * 0.15], null, PI * 1.25).scale.set(1, 1, 0.5);
  for (let i = 0; i < 9; i++) { const a = -PI * 0.1 + i * (PI * 1.15 / 8), r = (0.45 + (i % 3) * 0.12) * s; B.emblem('star', [Math.cos(a) * r, -0.05 * s + Math.sin(a) * r, cz + 0.21 * s], 0.16 * s); }
  B.gem(0.12 * s, '#cfe6ff', [-0.62 * s, -0.25 * s, cz + 0.22 * s]);
  B.glow(0.8 * s, '#cfe6ff', [-0.62 * s, -0.25 * s, cz + 0.3 * s], null, 0.6);
  for (const a of [PI * 0.3, PI * 0.55, PI * 0.8]) { const x = Math.cos(a) * 0.96 * s, y = -0.05 * s + Math.sin(a) * 0.96 * s; B.cyl(0.03 * s, 0.05 * s, 0.14 * s, SILVER, 'metal', [x, y - 0.1 * s, cz], null, null, 8); for (let i = 0; i < 5; i++) B.cyl(0.006, 0.006, 0.16 * s, '#cfd6e0', 'metal', [x + Math.cos(i) * 0.03 * s, y - 0.25 * s, cz + Math.sin(i) * 0.03 * s], null, null, 3); }
  B.tor(0.12 * s, 0.03 * s, SILVER, 'metal', [0.35 * s, 0.6 * s, cz], [PI / 2, 0, 0]);
  B.cyl(0.11 * s, 0.13 * s, 0.14 * s, c, 'cloth', [0.35 * s, 0.52 * s, cz], null, null, 14);
  B.glow(2.4 * s, '#9fc4ff', [0, 0, cz], null, 0.15);
  B.sparkle(30, [2 * s, 2 * s, 1.2 * s], '#cfe6ff', [0, 0, cz], 0.06, 0.25);
};

// ── Nr. 25: schlichter, mit sauberen Details ──
X[25] = (B, s) => {
  const zc = 0.42 * s, zf = 0.79 * s;
  for (const sx of [-1, 1]) for (const y of [-0.35, 0.3]) { B.rbox([0.05, 0.08 * s, 0.6 * s], '#2a3a4a', 'cloth', [sx * 0.77 * s, y * s, zc], null, null, 0.02); B.buckle([sx * 0.8 * s, y * s, zc + 0.15 * s], 0.4 * s, SILVER).rotation.y = PI / 2; }
  B.tor(0.15 * s, 0.03 * s, '#2a3a4a', 'cloth', [0, 0.93 * s, zc], null, null, PI);
  B.coin([0, -0.5 * s, zf + 0.24 * s], null, null, 0.45 * s, SILVER);
};

// ── Nr. 28 (neu): Beutel mit eingestricktem Wappen ──
X[28] = (B, s, zf, S, nrm) => {
  // Wappen als Strickbild (wie Kreuzstich-Pixel)
  const art = [
    '..YYYYYYY..',
    '.YRRRYBBBY.',
    '.YRRRYBBBY.',
    '.YRYRYBWBY.',
    '.YRRRYBBBY.',
    '.YYYYYYYYY.',
    '.YBBBYRRRY.',
    '.YBWBYRYRY.',
    '..YBBYRRY..',
    '...YYYYY...',
    '....YYY....',
  ];
  const col = { Y: '#e9c35a', R: '#a4161a', B: '#2a4d8f', W: '#f2ede4' };
  const px = 0.06 * s;
  art.forEach((row, r) => [...row].forEach((ch, i) => { if (ch === '.') return; const x = (i - 5) * px, ly = 0.05 - r * 0.075; B.ball(px * 0.55, col[ch], 'cloth', S(x, ly, 0.008), [1, 0.85, 0.35], null, 6).rotation.set(...nrm(x, ly)); }));
  for (let i = 0; i < 3; i++) { const x = (-0.1 + i * 0.1) * s; B.cone(0.035 * s, 0.09 * s, '#e9c35a', 'cloth', S(x, 0.14, 0.01), null, null, 4); }
  for (const ly of [0.25, -0.85]) for (let i = 0; i < 16; i++) { const x = (-0.6 + i * 0.08) * s; B.box([0.03 * s, 0.03 * s, 0.015], i % 2 ? '#a4161a' : '#e9c35a', 'cloth', S(x, ly, 0.006), [0, 0, PI / 4]).rotation.y = nrm(x, ly)[1]; }
};

// ── Nr. 30: besseres Dach (geschwungenes Pagodendach mit Ziegeln) ──
X[30] = (B, s) => {
  const c = '#e8ecf2', g = GOLD, zc = 0.6 * s;
  for (let tier = 0; tier < 2; tier++) {
    const y = (0.72 + tier * 0.32) * s, w = (1.7 - tier * 0.55) * s, d = (1.2 - tier * 0.4) * s;
    B.lathe([[0, 0.3], [0.2, 0.26], [0.45, 0.14], [0.62, 0.04], [0.72, 0.0], [0.74, 0.03]].map(([x, yy]) => [x, yy]), c, 'metal', [0, y, zc], [0, PI / 4, 0], null, 4, 'roof').scale.set(w * 0.95, s * (1 - tier * 0.15), d * 0.95);
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { B.cone(0.05 * s, 0.22 * s, g, 'gold', [sx * w * 0.5, y + 0.06 * s, zc + sz * d * 0.5], [sz * 0.7, 0, -sx * 0.7], null, 6); B.ball(0.04 * s, g, 'gold', [sx * w * 0.52, y + 0.15 * s, zc + sz * d * 0.52], null, null, 8); }
    for (let i = 0; i < 9; i++) B.box([0.02, 0.012, d * 0.9], shade(c, -0.25), 'metal', [(-0.4 + i * 0.1) * w, y + 0.12 * s * (1 - Math.abs(-0.4 + i * 0.1) * 1.6), zc]);
    B.rbox([w * 0.75, 0.06 * s, d * 0.75], g, 'gold', [0, y - 0.02 * s, zc], null, null, 0.02);
  }
  B.lathe([[0, 0], [0.08, 0.05], [0.05, 0.15], [0.09, 0.22], [0, 0.45]].map(([x, y]) => [x * s, y * s]), g, 'gold', [0, 1.3 * s, zc], null, null, 16, 'finial' + s);
  B.gem(0.07 * s, '#fff1a8', [0, 1.62 * s, zc], [0, 0, 0]);
  B.glow(0.6 * s, '#fff1a8', [0, 1.62 * s, zc], null, 0.7);
  for (const sx of [-1, 1]) { const bell = hanging(B, [sx * 0.78 * s, 0.7 * s, zc + 0.55 * s], 0.08, 2.5, 0.25); B.lathe([[0, 0.06], [0.04, 0.05], [0.05, -0.04], [0, -0.04]], g, 'gold', [0, -0.04, 0], null, bell, 12, 'bell2'); }
};

// ── Nr. 31: bessere Mondeffekte an der Truhe ──
X[31] = (B, s) => {
  const zc = 0.55 * s, zf = zc + 0.45 * s;
  B.tor(0.18 * s, 0.05 * s, '#e8f3ff', 'neon', [0, 0.55 * s, zc + 0.34 * s], [0.6, 0, 0.6], null, PI * 1.3);
  B.glow(0.9 * s, '#9fc4ff', [0, 0.55 * s, zc + 0.4 * s], null, 0.7);
  for (let i = 0; i < 5; i++) {
    const x = (-0.56 + i * 0.28) * s, ph = i / 4;
    B.ball(0.07 * s, '#3a4a6a', 'plastic', [x, -0.48 * s, zf + 0.02], null, null, 14);
    const lit = B.ball(0.072 * s, '#e8f3ff', 'neon', [x + (0.5 - ph) * 0.07 * s, -0.48 * s, zf + 0.025], [Math.max(0.15, 1 - Math.abs(0.5 - ph) * 1.6), 1, 1], null, 14);
  }
  const beam = B.pivot([0, 0.1 * s, zf + 0.09 * s]);
  for (let i = 0; i < 5; i++) { const cn = B.cone(0.12 * s + i * 0.04 * s, 1.1 * s, '#9fc4ff', 'neonT', [0, 0, 0.55 * s], [PI / 2, 0, 0], beam, 16); cn.scale.set(1, 1, 0.3 + i * 0.05); }
  B.anims.push((t) => { beam.rotation.y = Math.sin(t * 0.8) * 0.2; beam.scale.setScalar(0.9 + Math.sin(t * 2) * 0.1); });
  B.sparkle(40, [2.2 * s, 2.2 * s, 1.8 * s], '#cfe6ff', [0, 0.2, 0.9 * s], 0.07, 0.3);
  B.glow(2.4 * s, '#5fb8ff', [0, 0.1, zc], null, 0.18);
};

// ── Nr. 32 (neu): Rucksack in Amboss-Form mit Münzen obendrauf ──
A.anvilpack = (B, p) => {
  const s = p.size || 1, I = '#4a4f5a', zc = 0.5 * s;
  B.straps('#3a2618', 'leather', { metal: '#cfd6e0' });
  B.rbox([1.3 * s, 0.3 * s, 0.85 * s], I, 'metal', [0, -0.85 * s, zc], null, null, 0.05);
  B.rbox([0.75 * s, 0.6 * s, 0.6 * s], shade(I, -0.1), 'metal', [0, -0.4 * s, zc], null, null, 0.06);
  B.rbox([1.7 * s, 0.38 * s, 0.75 * s], shade(I, 0.15), 'metal', [0.1 * s, 0.05 * s, zc], null, null, 0.05);
  B.cone(0.3 * s, 0.75 * s, shade(I, 0.15), 'metal', [-1.12 * s, 0.07 * s, zc], [0, 0, PI / 2], null, 16).scale.set(1, 1, 0.8);
  B.rbox([0.14 * s, 0.05, 0.14 * s], '#1a1a1a', 'dark', [0.65 * s, 0.25 * s, zc], null, null, 0.01);
  B.rbox([1.72 * s, 0.04, 0.77 * s], '#c0c6cf', 'metal', [0.1 * s, 0.25 * s, zc], null, null, 0.01);
  for (let i = 0; i < 9; i++) B.coin([(-0.45 + (i % 5) * 0.22) * s, 0.29 * s + Math.floor(i / 5) * 0.04, zc + ((i * 0.37) % 0.4 - 0.2) * s], [0, i, 0], null, 0.55 * s, i % 3 === 0 ? '#e8ecf2' : GOLD);
  for (let i = 0; i < 4; i++) B.coin([0.35 * s, 0.29 * s + i * 0.045, zc - 0.15 * s], [0, i, 0], null, 0.5 * s);
  B.glow(1.2 * s, '#ffe08a', [0, 0.4 * s, zc], null, 0.35);
  B.emblem('hammer', [0, -0.4 * s, zc + 0.31 * s], 1.4 * s);
  const hm = B.pivot([0.9 * s, -0.4 * s, zc], [0, 0, -0.3]);
  B.rbox([0.06, 0.8 * s, 0.06], '#7a5232', 'wood', [0, 0, 0], null, hm, 0.02);
  B.rbox([0.28 * s, 0.13 * s, 0.13 * s], '#59606b', 'metal', [0, 0.42 * s, 0], null, hm, 0.03);
};

// ── Nr. 33: Auge in der Mitte, Rucksack drumherum verbessert ──
X[33] = (B, s) => {
  const zf = 0.79 * s;
  B.lathe([[0, 0.1], [0.3, 0.08], [0.36, 0], [0.38, -0.02], [0, -0.02]].map(([x, y]) => [x * s, y * s]), '#3a3f4a', 'metal', [0, 0.05 * s, zf + 0.06], [PI / 2, 0, 0], null, 28, 'eyeplate' + s);
  B.tor(0.36 * s, 0.03 * s, '#cfd6e0', 'metal', [0, 0.05 * s, zf + 0.07]);
  for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; B.ball(0.025 * s, '#cfd6e0', 'metal', [Math.cos(a) * 0.31 * s, 0.05 * s + Math.sin(a) * 0.31 * s, zf + 0.12], null, null, 6); }
  B.ball(0.24 * s, '#f6f1e6', 'plastic', [0, 0.05 * s, zf + 0.1], [1, 1, 0.55], null, 20);
  const iris = B.pivot([0, 0.05 * s, zf + 0.2]);
  B.ball(0.13 * s, '#ff3b3b', 'neon', [0, 0, 0], [1, 1, 0.4], iris, 16);
  B.ball(0.06 * s, '#200', 'dark', [0, 0, 0.03], [1, 1, 0.4], iris, 10);
  B.ball(0.02 * s, '#fff', 'neon', [0.03 * s, 0.03 * s, 0.05], null, iris, 6);
  B.glow(0.7 * s, '#ff3b3b', [0, 0.05 * s, zf + 0.3], null, 0.55);
  const lid = B.pivot([0, 0.05 * s, zf + 0.1]);
  B.half(0.25 * s, 0.05, '#3a3f4a', 'metal', [0, 0, 0], [PI / 2, 0, 0], lid, PI / 2).scale.set(1, 1, 0.6);
  B.anims.push((t) => { iris.position.x = Math.sin(t * 0.9) * 0.08 * s; iris.position.y = 0.05 * s + Math.sin(t * 1.3) * 0.04 * s; const bl = Math.max(0, Math.sin(t * 0.7) - 0.97) * 33; lid.rotation.x = -PI / 2 + bl * PI / 2; lid.visible = bl > 0.02; });
  for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) B.rbox([0.08 * s, 0.25 * s, 0.03], i % 2 ? '#e9c35a' : '#1a1a1a', 'plastic', [sx * (0.45 + i * 0.07) * s, -0.62 * s, zf + 0.26 * s], [0, 0, 0.5 * sx], null, 0.01);
  const ant = B.pivot([0.55 * s, 0.9 * s, 0.42 * s]);
  B.cyl(0.015, 0.015, 0.6 * s, '#9aa3ad', 'metal', [0, 0.3 * s, 0], null, ant, 6);
  const led = B.ball(0.05 * s, '#ff3b3b', 'neon', [0, 0.62 * s, 0], null, ant, 10);
  B.anims.push((t) => { led.visible = Math.sin(t * 5) > 0; });
};

// ── Nr. 34: ohne Pfeil, Goldgräber-Rucksack (Spitzhacke, Goldwaschpfanne, Nuggets) ──
X[34] = (B, s) => {
  const zc = 0.42 * s, zf = 0.79 * s;
  const pk = B.pivot([0, 0.3 * s, zc - 0.2], [0, 0, 0.6]);
  B.cyl(0.035, 0.04, 2.0 * s, '#7a5232', 'wood', [0, 0, 0], null, pk, 8);
  const head = B.pivot([0, 1.0 * s, 0], null, pk);
  B.tor(0.45 * s, 0.05 * s, '#59606b', 'metal', [0, -0.4 * s, 0], [0, 0, 0], head, PI * 0.5).rotation.z = PI * 0.25;
  B.tor(0.45 * s, 0.05 * s, '#59606b', 'metal', [0, -0.4 * s, 0], [0, PI, PI * 0.25], head, PI * 0.5);
  B.lathe([[0, -0.02], [0.28, -0.02], [0.33, 0.06], [0.31, 0.07], [0.26, 0.01], [0, 0.0]].map(([x, y]) => [x * s, y * s]), '#8a8f99', 'metal', [-0.88 * s, -0.2 * s, zc], [0, 0, PI / 2], null, 28, 'gpan' + s);
  for (let i = 0; i < 5; i++) B.oct(0.04 * s, GOLD, 'gold', [-0.92 * s, -0.2 * s + Math.sin(i * 2) * 0.12 * s, zc + Math.cos(i * 2) * 0.12 * s], [1, 0.7, 1], [i, i, 0]);
  B.lathe([[0.16, -0.18], [0.18, 0.1], [0.15, 0.16]].map(([x, y]) => [x * s, y * s]), '#cfc6a8', 'cloth', [0.88 * s, -0.35 * s, zc], null, null, 14, 'npouch' + s);
  for (let i = 0; i < 8; i++) B.oct(0.045 * s, GOLD, 'gold', [0.88 * s + Math.sin(i * 2.3) * 0.08 * s, -0.3 * s + (i % 3) * 0.08 * s, zc + Math.cos(i * 2.3) * 0.08 * s], [1, 0.75, 1], [i, i * 2, 0]);
  B.glow(0.7 * s, '#ffe08a', [0.88 * s, -0.15 * s, zc], null, 0.5);
  B.oct(0.12 * s, GOLD, 'gold', [0, -0.5 * s, zf + 0.3 * s], [1.3, 0.9, 0.7], [0.2, 0.4, 0.1]);
  B.glow(0.6 * s, '#ffe08a', [0, -0.5 * s, zf + 0.36 * s], null, 0.6);
};

// ── Nr. 35: ohne Münzen und Edelstein, verziert mit Säbeln ──
X[35] = (B, s) => {
  const zc = 0.55 * s, zf = zc + 0.45 * s;
  for (const sx of [-1, 1]) {
    const sb = B.pivot([0, -0.25 * s, zf + 0.1 * s], [0, 0, sx * 0.75]);
    B.tor(1.1 * s, 0.04 * s, '#d7dde6', 'metal', [-1.1 * s * 0.98, 0.0, 0], [0, 0, -0.38], sb, 0.75).scale.set(1, 1, 0.3);
    B.rbox([0.32 * s, 0.05 * s, 0.06], GOLD, 'gold', [0, -0.55 * s, 0], null, sb, 0.02);
    B.tor(0.12 * s, 0.025 * s, GOLD, 'gold', [0.05 * s, -0.62 * s, 0], [0, 0, 0], sb, PI);
    B.cyl(0.035 * s, 0.04 * s, 0.25 * s, '#3a1f14', 'leather', [0, -0.7 * s, 0], null, sb, 8);
    B.ball(0.05 * s, GOLD, 'gold', [0, -0.85 * s, 0], null, sb, 10);
  }
  B.ball(0.13 * s, '#f2ede4', 'plastic', [0, 0.47 * s, zc + 0.38 * s], [1, 1, 0.6], null, 16);
  for (const sx of [-0.045, 0.045]) B.ball(0.03 * s, '#111', 'dark', [sx * s, 0.49 * s, zc + 0.45 * s], null, null, 6);
  for (const r of [0.8, -0.8]) B.rbox([0.32 * s, 0.05 * s, 0.03], '#f2ede4', 'plastic', [0, 0.47 * s, zc + 0.36 * s], [0.55, 0, r], null, 0.02);
  B.tor(0.42 * s, 0.03 * s, '#c9b27a', 'cloth', [0, -0.25 * s, zf + 0.02], [0, 0, 0], null, PI);
};
