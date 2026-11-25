// ── Befragung, Runde 3 ──

// ── Drache, deutlich verbessert (Nr. 67, 77): Schuppen, Bauchplatten, gebogene Hörner, Ohrflossen,
//    Kiefer mit Zähnen, glühende Augen mit Blinzeln, Flughaut mit Fingern und Daumenkralle, Atem-Glühen ──
dragon = function (B, at, s, c, c2, par) {
  const [x, y, z] = at;
  const pv = B.pivot([x, y, z], [0, 0, 0], par);
  const body = [[0, 0, -0.35, 0.36], [0, 0.04, -0.1, 0.42], [0, 0.06, 0.15, 0.4], [0, 0.1, 0.38, 0.33]];
  body.forEach(([bx, by, bz, r]) => B.ball(r * s, c, 'plastic', [bx, by * s, bz * s], [1, 0.85, 1], pv, 24));
  for (let i = 0; i < 7; i++) B.rbox([0.32 * s, 0.05 * s, 0.13 * s], c2, 'plastic', [0, -0.28 * s + i * 0.01 * s, (-0.45 + i * 0.14) * s], [0.15, 0, 0], pv, 0.02 * s);
  for (let r = 0; r < 3; r++) for (let i = 0; i < 9; i++) { const zz = (-0.5 + i * 0.12) * s, sx = (r - 1) * 0.16 * s; B.ball(0.05 * s, shade(c, r === 1 ? 0.12 : -0.08), 'plastic', [sx, 0.36 * s - Math.abs(r - 1) * 0.06 * s, zz], [1, 0.45, 1.2], pv, 8); }
  for (let i = 0; i < 8; i++) B.cone(0.05 * s, (0.14 + Math.sin(i / 7 * PI) * 0.1) * s, c2, 'plastic', [0, 0.42 * s, (-0.55 + i * 0.13) * s], [-0.35, 0, 0], pv, 6);
  // Hals
  const neck = [[0.22, 0.5], [0.36, 0.62], [0.5, 0.7], [0.62, 0.8], [0.7, 0.92]];
  neck.forEach(([ny, nz], i) => { B.ball((0.22 - i * 0.02) * s, c, 'plastic', [0, ny * s, nz * s], null, pv, 18); B.rbox([0.18 * s, 0.04 * s, 0.1 * s], c2, 'plastic', [0, (ny - 0.17) * s, (nz + 0.06) * s], [0.6, 0, 0], pv, 0.015 * s); B.cone(0.045 * s, 0.14 * s, c2, 'plastic', [0, (ny + 0.19) * s, nz * s], [-0.4, 0, 0], pv, 6); });
  // Kopf
  const head = B.pivot([0, 0.78 * s, 1.08 * s], null, pv);
  B.rbox([0.42 * s, 0.3 * s, 0.4 * s], c, 'plastic', [0, 0, 0], null, head, 0.1 * s);
  B.rbox([0.3 * s, 0.17 * s, 0.36 * s], shade(c, 0.06), 'plastic', [0, -0.01 * s, 0.3 * s], [0.08, 0, 0], head, 0.06 * s);
  B.rbox([0.34 * s, 0.07 * s, 0.14 * s], shade(c, -0.12), 'plastic', [0, 0.13 * s, 0.1 * s], [-0.25, 0, 0], head, 0.03 * s);
  const jaw = B.pivot([0, -0.1 * s, 0.05 * s], null, head);
  B.rbox([0.26 * s, 0.08 * s, 0.4 * s], shade(c, -0.1), 'plastic', [0, -0.03 * s, 0.2 * s], null, jaw, 0.03 * s);
  B.rbox([0.2 * s, 0.03 * s, 0.32 * s], '#7a1f2a', 'plastic', [0, 0.015 * s, 0.2 * s], null, jaw, 0.01 * s);
  const breath = B.glow(0.5 * s, '#ffb347', [0, -0.08 * s, 0.6 * s], head, 0);
  for (const sx of [-1, 1]) {
    for (let t = 0; t < 4; t++) { B.cone(0.018 * s, 0.07 * s, '#fffbe8', 'plastic', [sx * (0.11 - t * 0.012) * s, -0.1 * s, (0.43 - t * 0.07) * s], [PI, 0, 0], head, 6); B.cone(0.016 * s, 0.06 * s, '#fffbe8', 'plastic', [sx * (0.1 - t * 0.012) * s, 0.025 * s, (0.4 - t * 0.07) * s], null, jaw, 6); }
    B.ball(0.028 * s, DARK, 'dark', [sx * 0.07 * s, 0.04 * s, 0.48 * s], [1, 0.6, 0.6], head, 6);
    const eye = B.ball(0.06 * s, '#ffde4a', 'neon', [sx * 0.17 * s, 0.07 * s, 0.14 * s], [0.8, 0.7, 0.9], head, 12);
    B.box([0.012 * s, 0.07 * s, 0.01], '#111', 'dark', [sx * 0.21 * s, 0.07 * s, 0.17 * s], [0, sx * 0.5, 0], head);
    B.glow(0.2 * s, '#ffde4a', [sx * 0.19 * s, 0.07 * s, 0.17 * s], head, 0.6);
    const lid = B.rbox([0.1 * s, 0.03 * s, 0.1 * s], c, 'plastic', [sx * 0.17 * s, 0.1 * s, 0.14 * s], null, head, 0.01);
    B.anims.push((t) => { const b = (t % 4.3) < 0.12; lid.position.y = (b ? 0.06 : 0.11) * s; eye.scale.y = b ? 0.2 : 0.7; });
    // gebogene Hörner aus Kegelketten
    let hp = B.pivot([sx * 0.13 * s, 0.14 * s, -0.12 * s], [-0.9, 0, sx * 0.35], head);
    for (let h = 0; h < 4; h++) { B.cone((0.05 - h * 0.01) * s, 0.13 * s, '#f2e6c8', 'plastic', [0, 0.06 * s, 0], null, hp, 8); hp = B.pivot([0, 0.12 * s, 0], [-0.35, 0, 0], hp); }
    // Ohrflosse
    const fin = B.pivot([sx * 0.21 * s, 0.03 * s, -0.12 * s], [0, sx * 0.6, sx * 0.2], head);
    B.mesh(membraneGeo([[0, 0], [sx * 0.25 * s, 0.1 * s], [sx * 0.3 * s, -0.04 * s], [sx * 0.2 * s, -0.14 * s]]), c2, 'skin', [0, 0, 0], null, fin);
    // Flügel mit Fingern, Flughaut und Daumenkralle
    const wp = B.pivot([sx * 0.28 * s, 0.32 * s, 0.05 * s], [0, sx * 0.55, 0], pv);
    const arm = B.pivot([0, 0, 0], [0, 0, sx * 0.4], wp);
    B.cyl(0.04 * s, 0.03 * s, 0.55 * s, c, 'plastic', [sx * 0.27 * s, 0, 0], [0, 0, PI / 2], arm, 8);
    B.cone(0.025 * s, 0.1 * s, '#f2e6c8', 'plastic', [sx * 0.56 * s, 0.06 * s, 0], [0, 0, -sx * 0.4], arm, 6);
    const tips = [[sx * 0.55 * s, 0]];
    for (let i = 0; i < 4; i++) { const a = 0.95 - i * 0.42, L = (0.95 - i * 0.13) * s; const tx = sx * 0.55 * s + sx * Math.cos(a) * L, ty = Math.sin(a) * L; tips.push([tx, ty]); B.cyl(0.02 * s, 0.008 * s, L, c, 'plastic', [(sx * 0.55 * s + tx) / 2, ty / 2, 0], [0, 0, Math.atan2(ty, tx - sx * 0.55 * s) - PI / 2], arm, 6); }
    tips.push([sx * 0.1 * s, -0.3 * s]);
    B.mesh(membraneGeo([[0, 0], ...tips]), shade(c2, -0.05), 'skin', [0, 0, -0.01], null, arm);
    B.anims.push((t) => { arm.rotation.z = sx * (0.3 + Math.sin(t * 3.2) * 0.4); wp.rotation.y = sx * (0.55 + Math.sin(t * 3.2 + 0.5) * 0.15); });
    // Beine: Oberschenkel, Unterschenkel, Krallen
    B.ball(0.14 * s, c, 'plastic', [sx * 0.27 * s, -0.12 * s, -0.25 * s], [1, 1.2, 1.3], pv, 12);
    B.cyl(0.07 * s, 0.06 * s, 0.24 * s, c, 'plastic', [sx * 0.28 * s, -0.32 * s, -0.2 * s], null, pv, 10);
    B.cyl(0.06 * s, 0.05 * s, 0.22 * s, c, 'plastic', [sx * 0.24 * s, -0.28 * s, 0.28 * s], null, pv, 10);
    for (const [lz] of [[-0.12], [0.36]]) for (let cl = -1; cl <= 1; cl++) B.cone(0.022 * s, 0.09 * s, '#f2e6c8', 'plastic', [sx * 0.26 * s + cl * 0.04 * s, -0.44 * s, (lz + 0.05) * s], [PI / 2 + 0.6, 0, 0], pv, 6);
  }
  B.anims.push((t) => { const k = Math.max(0, Math.sin(t * 0.9) - 0.6) * 2.5; jaw.rotation.x = k * 0.35; breath.material.opacity = k * 0.8; head.rotation.y = Math.sin(t * 0.5) * 0.25; head.rotation.x = -k * 0.15; });
  // Schwanz mit Stacheln und Spitze
  const tail = B.pivot([0, -0.05 * s, -0.6 * s], null, pv);
  let tp = tail; const segs = [];
  for (let i = 0; i < 10; i++) { const r = (0.17 - i * 0.014) * s; const j = i === 0 ? tp : B.pivot([0, -0.02 * s, -0.17 * s], null, tp); B.ball(r, i % 2 ? c : shade(c, -0.06), 'plastic', [0, 0, 0], null, j, 14); if (i % 2 === 0) B.cone(r * 0.4, r * 1.1, c2, 'plastic', [0, r * 0.95, 0], [-0.3, 0, 0], j, 6); segs.push(j); tp = j; }
  B.cone(0.1 * s, 0.26 * s, c2, 'plastic', [0, 0, -0.16 * s], [-PI / 2, 0, 0], tp, 4).scale.set(1.8, 1, 0.3);
  B.anims.push((t) => segs.forEach((j, i) => { j.rotation.y = Math.sin(t * 1.6 - i * 0.5) * 0.12; }));
  return pv;
};

// ── Nr. 24: Mondbeutel, Öffnung zeigt nach rechts oben, deutlich verbessert ──
A.moonbag = (B, p) => {
  const s = p.size || 1, c = p.c || '#2b2f4a', cz = 0.62 * s;
  B.straps('#3a3f5a', 'leather', { metal: SILVER });
  const m = B.pivot([0, -0.05 * s, cz], [0, 0, -PI * 1.225]);
  const arc0 = -PI * 0.15, arcL = PI * 1.25;
  const body = B.tor(0.62 * s, 0.34 * s, c, 'cloth', [0, 0, 0], [0, 0, arc0], m, arcL); body.scale.set(1, 1, 0.62);
  for (const a of [arc0, arc0 + arcL]) B.ball(0.34 * s, c, 'cloth', [Math.cos(a) * 0.62 * s, Math.sin(a) * 0.62 * s, 0], [1, 1, 0.62], m, 20);
  B.tor(0.62 * s, 0.025 * s, SILVER, 'metal', [0, 0, 0.21 * s], [0, 0, arc0], m, arcL);
  B.tor(0.96 * s, 0.035 * s, SILVER, 'metal', [0, 0, 0], [0, 0, arc0], m, arcL).scale.set(1, 1, 0.5);
  B.tor(0.28 * s, 0.03 * s, '#cfe6ff', 'neon', [0, 0, 0], [0, 0, arc0], m, arcL).scale.set(1, 1, 0.5);
  // Steppnähte quer über die Sichel
  for (let i = 1; i < 10; i++) { const a = arc0 + arcL * i / 10; B.seam([Math.cos(a) * 0.32 * s, Math.sin(a) * 0.32 * s, 0.16 * s], [Math.cos(a) * 0.92 * s, Math.sin(a) * 0.92 * s, 0.13 * s], '#9fb0d8', 4, m, 0.016); }
  // Krater wie auf dem Mond
  for (let i = 0; i < 8; i++) { const a = arc0 + arcL * (0.08 + i * 0.12), r = (0.5 + (i % 3) * 0.12) * s; B.tor(0.05 * s + (i % 2) * 0.025 * s, 0.012 * s, shade(c, 0.25), 'cloth', [Math.cos(a) * r, Math.sin(a) * r, 0.2 * s], null, m); }
  for (let i = 0; i < 9; i++) { const a = arc0 + arcL * (0.05 + i * 0.11), r = (0.47 + ((i + 1) % 3) * 0.14) * s; B.emblem('star', [Math.cos(a) * r, Math.sin(a) * r, 0.22 * s], 0.13 * s, m); }
  // Filigran am Außenrand
  for (let i = 0; i < 12; i++) { const a = arc0 + arcL * (i + 0.5) / 12; B.tor(0.06 * s, 0.01 * s, SILVER, 'metal', [Math.cos(a) * 0.98 * s, Math.sin(a) * 0.98 * s, 0.05], [0, 0, a], m, PI); }
  const mid = arc0 + arcL / 2;
  B.gem(0.13 * s, '#cfe6ff', [Math.cos(mid) * 0.62 * s, Math.sin(mid) * 0.62 * s, 0.24 * s], null, m);
  B.tor(0.15 * s, 0.025 * s, SILVER, 'metal', [Math.cos(mid) * 0.62 * s, Math.sin(mid) * 0.62 * s, 0.22 * s], null, m);
  B.glow(0.9 * s, '#cfe6ff', [Math.cos(mid) * 0.62 * s, Math.sin(mid) * 0.62 * s, 0.3 * s], m, 0.6);
  // Verschluss an der Öffnung und hängende Sternanhänger
  for (const a of [arc0, arc0 + arcL]) { B.ball(0.08 * s, SILVER, 'metal', [Math.cos(a) * 0.62 * s, Math.sin(a) * 0.62 * s, 0.22 * s], null, m, 12); }
  chain(B, [Math.cos(arc0) * 0.62 * s, Math.sin(arc0) * 0.62 * s, 0.24 * s], [Math.cos(arc0 + arcL) * 0.62 * s, Math.sin(arc0 + arcL) * 0.62 * s, 0.24 * s], 9, SILVER, 'metal', 0.03 * s, m);
  for (const x of [-0.45, -0.15, 0.15]) { const h = hanging(B, [x * s, -0.75 * s, cz + 0.1], 0.18, 2 + x, 0.25); B.emblem('star', [0, -0.05, 0], 0.22 * s, h); B.glow(0.25 * s, '#cfe6ff', [0, -0.05, 0.04], h, 0.6); }
  B.glow(2.4 * s, '#9fc4ff', [0, 0, cz], null, 0.15);
  B.sparkle(34, [2 * s, 2 * s, 1.2 * s], '#cfe6ff', [0, 0, cz], 0.06, 0.25);
};

// ── Nr. 31: ohne blauen Strahl vor dem Schloss, mehr Details ──
X[31] = (B, s) => {
  const zc = 0.55 * s, zf = zc + 0.45 * s;
  B.tor(0.18 * s, 0.05 * s, '#e8f3ff', 'neon', [0, 0.55 * s, zc + 0.34 * s], [0.6, 0, 0.6], null, PI * 1.3);
  B.glow(0.9 * s, '#9fc4ff', [0, 0.55 * s, zc + 0.4 * s], null, 0.6);
  const plaque = [0, -0.48 * s, zf + 0.03];
  B.rbox([1.5 * s, 0.24 * s, 0.03], '#1a2240', 'metal', plaque, null, null, 0.04);
  B.rbox([1.54 * s, 0.28 * s, 0.02], SILVER, 'metal', [0, -0.48 * s, zf + 0.015], null, null, 0.04);
  for (let i = 0; i < 5; i++) { const x = (-0.56 + i * 0.28) * s, ph = i / 4; B.ball(0.07 * s, '#3a4a6a', 'plastic', [x, -0.48 * s, zf + 0.06], null, null, 14); B.ball(0.072 * s, '#e8f3ff', 'neon', [x + (0.5 - ph) * 0.07 * s, -0.48 * s, zf + 0.065], [Math.max(0.15, 1 - Math.abs(0.5 - ph) * 1.6), 1, 1], null, 14); }
  for (const sx of [-1, 1]) for (const sy of [-0.74, 0.2]) { B.tor(0.09 * s, 0.012 * s, SILVER, 'metal', [sx * 0.7 * s, sy * s, zf + 0.06], [0, 0, sx * sy > 0 ? 0 : PI], null, PI * 1.5); B.emblem('star', [sx * 0.7 * s, sy * s, zf + 0.08], 0.14 * s); }
  B.tor(0.07 * s, 0.02 * s, SILVER, 'metal', [0, 0.06 * s, zf + 0.1 * s], [0, 0, 0.6], null, PI * 1.3);
  for (let i = 0; i < 8; i++) B.ball(0.025 * s, '#e8f3ff', 'neon', [(-0.6 + i * 0.17) * s, 0.33 * s, zc + 0.47 * s], null, null, 6);
  B.sparkle(34, [2.2 * s, 2.2 * s, 1.8 * s], '#cfe6ff', [0, 0.2, 0.9 * s], 0.07, 0.3);
  B.glow(2.4 * s, '#5fb8ff', [0, 0.1, zc], null, 0.15);
};

// ── Nr. 32: Amboss-Rucksack mit echter Amboss-Silhouette, Hardyloch, Riemen, Barren und Zange ──
A.anvilpack = (B, p) => {
  const s = p.size || 1, zc = 0.5 * s;
  B.straps('#3a2618', 'leather', { metal: '#cfd6e0' });
  const sh = new THREE.Shape();
  sh.moveTo(-0.55, -0.75); sh.lineTo(0.55, -0.75); sh.lineTo(0.45, -0.6); sh.lineTo(0.22, -0.52); sh.quadraticCurveTo(0.2, -0.1, 0.42, -0.02); sh.lineTo(0.72, 0.0); sh.lineTo(0.72, 0.25); sh.lineTo(-0.55, 0.25); sh.quadraticCurveTo(-0.95, 0.2, -1.35, 0.12); sh.quadraticCurveTo(-0.95, 0.0, -0.45, -0.04); sh.quadraticCurveTo(-0.2, -0.12, -0.22, -0.52); sh.lineTo(-0.45, -0.6); sh.lineTo(-0.55, -0.75);
  const g = geo('anvilpackshape', () => { const e = new THREE.ExtrudeGeometry(sh, { depth: 0.6, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2 }); e.translate(0, 0, -0.3); return e; });
  const pv = B.pivot([0.15 * s, -0.1 * s, zc], null);
  pv.scale.setScalar(1.15 * s);
  B.mesh(g, '#4a4f5a', 'metal', [0, 0, 0], null, pv);
  B.rbox([1.3, 0.03, 0.62], '#c0c6cf', 'metal', [0.08, 0.28, 0], null, pv, 0.01);
  B.rbox([0.1, 0.04, 0.1], '#111', 'dark', [0.55, 0.29, 0], null, pv, 0.01);
  B.cyl(0.035, 0.035, 0.04, '#111', 'dark', [0.38, 0.29, 0], null, pv, 10);
  B.rbox([1.35, 0.14, 0.9], '#5a3a22', 'wood', [0, -0.86, 0], null, pv, 0.03);
  B.rivets([-0.55, -0.8, 0.46], [0.55, -0.8, 0.46], 5, '#9aa3ad', 0.03, pv);
  for (const sy of [-0.35, -0.1]) { B.rbox([0.5, 0.07, 0.66], LEATHER, 'leather', [0, sy, 0], null, pv, 0.02); B.buckle([0, sy, 0.34], 0.4, '#cfd6e0', pv); }
  for (let i = 0; i < 9; i++) B.coin([(-0.4 + (i % 5) * 0.2), 0.33 + Math.floor(i / 5) * 0.04, ((i * 0.37) % 0.4 - 0.2)], [0, i, 0], pv, 0.55, i % 3 === 0 ? '#e8ecf2' : GOLD);
  for (let i = 0; i < 5; i++) B.coin([0.3, 0.33 + i * 0.045, -0.15], [0, i, 0], pv, 0.5);
  const ingot = B.rbox([0.3, 0.08, 0.14], '#ffb347', 'neon', [-0.65, 0.33, 0.1], [0, 0.4, 0], pv, 0.02);
  B.glow(0.7, '#ff9a2e', [-0.65, 0.4, 0.1], pv, 0.7);
  B.pulse(ingot, 0.05, 4);
  B.glow(1.2, '#ffe08a', [0, 0.45, 0], pv, 0.3);
  const tg = B.pivot([-0.95 * s, -0.4 * s, zc], [0, 0, 0.25]);
  for (const sx of [-1, 1]) B.cyl(0.02, 0.02, 0.8 * s, '#2a2a30', 'metal', [sx * 0.04, 0, 0], [0, 0, sx * 0.06], tg, 6);
  B.ball(0.04, '#2a2a30', 'metal', [0, 0.22 * s, 0], null, tg, 8);
  const hm = B.pivot([1.0 * s, -0.45 * s, zc], [0, 0, -0.3]);
  B.rbox([0.06, 0.8 * s, 0.06], '#7a5232', 'wood', [0, 0, 0], null, hm, 0.02);
  B.rbox([0.28 * s, 0.13 * s, 0.13 * s], '#59606b', 'metal', [0, 0.42 * s, 0], null, hm, 0.03);
  B.sparkle(20, [1.2, 0.8, 0.8], '#ffb347', [0, 0.4, zc], 0.06, 0.9);
};

// ── Nr. 33: Rucksack rund ums Auge stark verbessert (Panzerplatten, Lüftungsgitter, Schläuche, Lampen) ──
X[33] = ((orig) => (B, s) => {
  orig(B, s);
  const zc = 0.42 * s, zf = 0.79 * s;
  for (const sx of [-1, 1]) {
    B.rbox([0.32 * s, 1.45 * s, 0.06], '#3a3f4a', 'metal', [sx * 0.56 * s, 0, zf + 0.04], null, null, 0.03);
    for (let i = 0; i < 6; i++) B.ball(0.025 * s, '#cfd6e0', 'metal', [sx * (0.45 + (i % 2) * 0.22) * s, (-0.6 + Math.floor(i / 2) * 0.6) * s, zf + 0.08], null, null, 6);
    for (let i = 0; i < 6; i++) B.box([0.03, 0.03, 0.4 * s], '#1a1f2a', 'dark', [sx * (0.78 * s), (-0.2 + i * 0.07) * s, zc]);
    const hose = [[sx * 0.45, -0.7, zf + 0.1], [sx * 0.85, -0.5, zf - 0.05], [sx * 0.9, 0.2, zc], [sx * 0.6, 0.85, zc]].map(([x, y, z]) => new THREE.Vector3(x * s, y * s, z));
    B.mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(hose), 24, 0.04 * s, 8), '#2a2a30', 'plastic', [0, 0, 0]);
    const lamp = B.ball(0.05 * s, sx > 0 ? '#5fd0a0' : '#e9c35a', 'neon', [sx * 0.56 * s, 0.62 * s, zf + 0.09], null, null, 10);
    B.glow(0.25 * s, sx > 0 ? '#5fd0a0' : '#e9c35a', [sx * 0.56 * s, 0.62 * s, zf + 0.12], null, 0.7);
    B.anims.push((t) => { lamp.visible = Math.sin(t * (sx > 0 ? 2 : 3.3)) > -0.5; });
  }
  B.rbox([1.3 * s, 0.22 * s, 0.82 * s], '#2a2f3a', 'metal', [0, -0.85 * s, zc], null, null, 0.05);
  B.rivets([-0.55 * s, -0.85 * s, zc + 0.42 * s], [0.55 * s, -0.85 * s, zc + 0.42 * s], 6, '#cfd6e0', 0.025 * s);
  B.tor(0.16 * s, 0.035 * s, '#2a2f3a', 'metal', [0, 0.95 * s, zc], null, null, PI);
  B.rbox([0.6 * s, 0.06, 0.04], '#cfd6e0', 'metal', [0, 0.55 * s, zf + 0.1], null, null, 0.02);
})(X[33]);

// ── Nr. 35: verbesserte Säbel (geschwungene Klinge, Korbgefäß, umwickelter Griff) ──
X[35] = (B, s) => {
  const zc = 0.55 * s, zf = zc + 0.45 * s;
  const bl = new THREE.Shape();
  bl.moveTo(0, -0.035); bl.quadraticCurveTo(0.6, -0.05, 1.05, 0.1); bl.quadraticCurveTo(1.15, 0.16, 1.12, 0.2); bl.quadraticCurveTo(0.7, 0.07, 0, 0.04); bl.lineTo(0, -0.035);
  const bg = geo('sabre', () => new THREE.ExtrudeGeometry(bl, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.008, bevelSegments: 1 }));
  for (const sx of [-1, 1]) {
    const sb = B.pivot([0, -0.25 * s, zf + 0.1 * s], [0, 0, sx > 0 ? 0.85 : PI - 0.85]);
    const blade = B.mesh(bg, '#e8ecf2', 'metal', [0.12 * s, 0, 0], [sx > 0 ? 0 : PI, 0, 0], sb); blade.scale.setScalar(s);
    B.box([0.9 * s, 0.006, 0.02], '#9aa3ad', 'metal', [0.55 * s, 0.0, 0.012], [0, 0, 0.05 * (sx > 0 ? 1 : -1)], sb);
    B.lathe([[0, 0.0], [0.1, 0.02], [0.13, 0.08], [0.1, 0.13]].map(([x, y]) => [x * s, y * s]), GOLD, 'gold', [0.12 * s, 0, 0], [0, 0, PI / 2], sb, 16, 'guard' + s);
    B.tor(0.1 * s, 0.015 * s, GOLD, 'gold', [0.02 * s, -0.08 * s * (sx > 0 ? 1 : -1), 0], [0, 0, 0], sb, PI);
    B.cyl(0.035 * s, 0.04 * s, 0.24 * s, '#3a1f14', 'leather', [-0.02 * s, 0, 0], [0, 0, PI / 2], sb, 10);
    for (let i = 0; i < 5; i++) B.tor(0.04 * s, 0.008 * s, GOLD, 'gold', [(-0.12 + i * 0.05) * s, 0, 0], [0, PI / 2, 0.4], sb);
    B.ball(0.05 * s, GOLD, 'gold', [-0.16 * s, 0, 0], null, sb, 12);
    B.gem(0.035 * s, '#c1121f', [-0.2 * s, 0, 0], [0, 0, PI / 2], sb);
  }
  B.ball(0.13 * s, '#f2ede4', 'plastic', [0, 0.47 * s, zc + 0.38 * s], [1, 1, 0.6], null, 16);
  for (const sx of [-0.045, 0.045]) B.ball(0.03 * s, '#111', 'dark', [sx * s, 0.49 * s, zc + 0.45 * s], null, null, 6);
  for (const r of [0.8, -0.8]) B.rbox([0.32 * s, 0.05 * s, 0.03], '#f2ede4', 'plastic', [0, 0.47 * s, zc + 0.36 * s], [0.55, 0, r], null, 0.02);
  B.tor(0.42 * s, 0.03 * s, '#c9b27a', 'cloth', [0, -0.25 * s, zf + 0.02], [0, 0, 0], null, PI);
};

// ── Nr. 48 und 55: Kanonen schießen zur Seite statt über den Kopf ──
A.cannon = ((orig) => (B, p) => {
  const before = B.parts.length;
  orig(B, p);
  // das Rohr-Gelenk ist das erste Kind-Pivot mit Rotation -0.65: zur Seite drehen
  const root = B.parts[before].parent;
  root.children.forEach((o) => { if (o.isGroup && Math.abs(o.rotation.x + 0.65) < 0.01) { o.rotation.set(0, 0, -PI / 2 + 0.35); o.position.x = 0.45; o.position.y = 0.0; } });
})(A.cannon);

// ── Nr. 49: Obelisk näher am Rücken ──
A.obelisk = ((orig) => (B, p) => {
  const before = B.parts.length;
  orig(B, p);
  const root = B.parts[before].parent;
  root.children.forEach((o) => { if (o.isGroup && Math.abs(o.position.z - 1.45) < 0.01) o.position.z = 0.95; });
  root.children.forEach((o) => { if (o.isSprite && Math.abs(o.position.z - 1.45) < 0.01) o.position.z = 0.95; });
})(A.obelisk);

// ── Nr. 50: Bogen stark verbessert (Pfeil eingelegt, Sehnenwicklung, Nocken, Griffschale, Anhänger) ──
A.bow = ((orig) => (B, p) => {
  const before = B.parts.length;
  orig(B, p);
  const pv = B.pivot([-0.2, 0.05, 0.42], [0, 0, 0.7]);
  for (const sy of [-1, 1]) { B.cyl(0.03, 0.03, 0.06, GOLD, 'gold', [0.05, sy * 1.42, 0], null, pv, 8); B.ball(0.03, GOLD, 'gold', [0.05, sy * 1.46, 0], null, pv, 8); }
  B.cyl(0.012, 0.012, 0.3, '#c9b27a', 'cloth', [0.05, 0, 0], null, pv, 6);
  B.rbox([0.06, 0.12, 0.08], GOLD, 'gold', [0.13, 0.12, 0], null, pv, 0.02);
  // eingelegter Pfeil
  const ar = B.pivot([0.05, 0.0, 0.0], [0, 0, -PI / 2], pv);
  B.cyl(0.015, 0.015, 1.1, '#d9c7a0', 'wood', [0, 0.45, 0], null, ar, 6);
  B.cone(0.035, 0.12, '#cfd6e0', 'metal', [0, 1.05, 0], null, ar, 4);
  for (let f = 0; f < 3; f++) B.feather(0.22, 0.2, f ? '#f6f1e6' : '#e63946', 'plastic', [0, 0.05, 0], PI / 2, B.pivot([0, 0, 0], [0, f * 2.09, 0], ar), 1);
  B.glow(0.4, '#9ff5d0', [0, 1.05, 0], ar, 0.6);
  // Anhänger mit Federn
  const h = hanging(B, [-0.2 + Math.cos(0.7 + PI / 2) * 0.15, 0.05 - 0.15, 0.48], 0.15, 2.4, 0.25);
  for (let i = 0; i < 3; i++) B.feather(0.18, 0.14, ['#2ec4b6', '#ffe066', '#e63946'][i], 'plastic', [0, -0.05, 0.01 * i], -PI / 2 + (i - 1) * 0.3, h, 1);
  B.ball(0.03, GOLD, 'gold', [0, 0, 0], null, h, 8);
})(A.bow);

// ── Nr. 51 und 74: Turm ohne Halterung ──
A.tower = ((orig) => (B, p) => {
  const before = B.parts.length;
  orig(B, p);
  // Halterung (Rückenplatte, Verbindung) und die Gurte ausblenden: alles, was nicht im Turm-Pivot hängt und nah am Rücken liegt
  for (let i = before; i < B.parts.length; i++) { const m = B.parts[i]; if (m.parent && !m.parent.isGroup) continue; }
  const root = B.parts[before].parent;
  root.children.slice().forEach((o) => { if (!o.isGroup && o.position.z < 0.9 && !o.isSprite && !o.isPoints) { o.visible = false; o.scale.setScalar(0.0001); } });
})(A.tower);

// ── Nr. 67, 71, 72, 77: Greif und Krake verbessert ──
const creature3 = A.creature;
A.creature = (B, p) => {
  const before = B.parts.length;
  creature3(B, p);
  if (p.kind === 'griffin2') {
    const T = '#b98a4e';
    const pv = B.pivot([0, 0.0, 0.62]);
    // Brustflaum, Löwenhinterteil mit Pfoten und Quastenschwanz, Federkrone, Geschirr
    for (let i = 0; i < 12; i++) B.feather(0.22, 0.16, i % 2 ? WHITE : '#f2ead8', 'plastic', [Math.sin(i) * 0.25, 0.45 - (i % 4) * 0.08, 0.38], -PI / 2 + (i - 6) * 0.08, pv, i % 2 ? 1 : -1);
    B.ball(0.42, shade(T, 0.05), 'cloth', [0, -0.45, 0.05], [1, 0.8, 0.95], pv, 20);
    for (const sx of [-1, 1]) { B.ball(0.16, T, 'cloth', [sx * 0.3, -0.62, 0.12], [1, 1.3, 1], pv, 12); B.ball(0.1, shade(T, -0.1), 'cloth', [sx * 0.32, -0.85, 0.22], [1.1, 0.6, 1.3], pv, 10); for (let t = -1; t <= 1; t++) B.ball(0.03, shade(T, -0.25), 'cloth', [sx * 0.32 + t * 0.04, -0.87, 0.33], null, pv, 6); }
    const head = pv; for (let i = 0; i < 5; i++) B.feather(0.3, 0.12, i % 2 ? WHITE : GOLD, 'plastic', [(i - 2) * 0.05, 1.05, -0.05], 1.6 + (i - 2) * 0.15, pv, 1);
    B.rbox([0.8, 0.08, 0.04], '#5a3a22', 'leather', [0, 0.25, 0.47], [0, 0, 0], pv, 0.02);
    B.coin([0, 0.25, 0.5], null, pv, 0.4);
    B.emblem('star', [0, 0.25, 0.53], 0.25, pv);
  }
  if (p.kind === 'kraken2') {
    const K = '#7b3fa0';
    // Mantel mit Flecken, Schlitzpupillen mit Lidern, Siphon, Schwimmhaut zwischen den Armen
    B.lathe([[0, 1.25], [0.3, 1.18], [0.5, 0.95], [0.62, 0.6], [0.66, 0.3], [0.6, 0.0], [0.3, -0.15], [0, -0.18]], K, 'plastic', [0, -0.05, 0.75], [0.25, 0, 0], null, 32, 'mantle').scale.set(1.05, 1, 0.85);
    for (let i = 0; i < 18; i++) { const a = i * 2.4, y = 0.2 + (i % 6) * 0.15; B.ball(0.05 + (i % 3) * 0.02, shade(K, -0.25), 'plastic', [Math.sin(a) * 0.55, y, 0.75 + Math.cos(a) * 0.45], [1, 1, 0.3], null, 8); }
    for (const sx of [-0.3, 0.3]) { B.ball(0.19, '#fff3b0', 'plastic', [sx, 0.3, 1.36], null, null, 18); B.rbox([0.18, 0.04, 0.05], '#111', 'dark', [sx, 0.3, 1.53], null, null, 0.02); B.ball(0.21, K, 'plastic', [sx, 0.44, 1.32], [1, 0.4, 0.85], null, 12); B.glow(0.3, '#fff3b0', [sx, 0.3, 1.55], null, 0.35); }
    B.cyl(0.08, 0.11, 0.25, shade(K, 0.1), 'plastic', [0.48, -0.05, 1.15], [0.6, 0, -0.6], null, 12);
    for (let k = 0; k < 7; k++) { const a0 = -PI * 0.95 + (k + 0.5) * (PI * 0.9 / 7); B.mesh(membraneGeo([[0, 0], [Math.cos(a0 - 0.2) * 0.9, Math.sin(a0 - 0.2) * 0.5], [Math.cos(a0 + 0.2) * 0.9, Math.sin(a0 + 0.2) * 0.5]]), shade(K, 0.15), 'skin', [0, -0.15, 0.85], null); }
    for (let i = 0; i < 5; i++) B.gem(0.07, ['#4cc9f0', '#e63946', '#2ec4b6', '#ffe066', '#b77bff'][i], [(-0.4 + i * 0.2), 0.95, 0.95 + Math.sin(i) * 0.05]);
  }
};

// ── Nr. 75: rotes Teil oben am Thron (Baldachin) entfernen ──
A.throne = ((orig) => (B, p) => {
  const before = B.parts.length;
  orig(B, p);
  if (!p.dragon) return;
  for (let i = before; i < B.parts.length; i++) {
    const m = B.parts[i];
    const isCanopy = m.material && m.material.color && m.geometry && m.geometry.type === 'CylinderGeometry' && m.geometry.parameters.thetaLength < 3.2 && m.geometry.parameters.radiusTop > 0.9;
    const isTassel = m.geometry && m.geometry.type === 'ConeGeometry' && Math.abs(m.position.y - 1.95 * (p.size || 1)) < 0.01;
    if (isCanopy || isTassel) { m.visible = false; m.scale.setScalar(0.0001); }
  }
})(A.throne);

// ── Nr. 80: Komet deutlich verbessert (Kern mit Kratern, Koma, Ionen- und Münzschweif, Halterung) ──
A.comet = ((orig) => (B, p) => {
  orig(B, p);
  const pv = B.pivot([0, 0.25, 0.75]);
  for (let i = 0; i < 7; i++) { const a = i * 2.2, b = i * 1.3; B.tor(0.07 + (i % 3) * 0.03, 0.02, '#4a4238', 'stone', [Math.cos(a) * Math.cos(b) * 0.55, Math.sin(b) * 0.5, Math.sin(a) * Math.cos(b) * 0.5 + 0.1], [a, b, 0], pv); }
  for (let i = 0; i < 3; i++) B.glow(1.6 + i * 0.9, ['#bff6ff', '#ffe08a', '#ff9a2e'][i], [0, 0, 0], pv, 0.35 - i * 0.08);
  // Ionenschweif (blau, gerade) – wird beim Laufen länger
  const ion = [];
  for (let i = 0; i < 10; i++) ion.push(B.glow(0.6, '#9fd3ff', [0, 0, 0], null, 0.5));
  B.anims.push((t) => ion.forEach((g, i) => { const u = i / 10, L = 1 + WALK.k * 3; g.position.set(0, 0.35 + u * L * 0.25, 1.2 + u * L); g.scale.setScalar(0.7 * (1 - u * 0.7)); g.material.opacity = 0.45 * (1 - u); }));
  // Halterung: Klammern um den Kern
  for (let i = 0; i < 3; i++) { const a = -PI / 2 + (i - 1) * 0.9; const cl = B.pivot([Math.cos(a) * 0.25, 0.25 + Math.sin(a) * 0.25, 0.25], [0, 0, a + PI / 2]); B.rbox([0.08, 0.08, 0.5], '#59606b', 'metal', [0, 0, 0.2], null, cl, 0.03); B.cone(0.05, 0.12, '#cfd6e0', 'metal', [0, 0, 0.48], [PI / 2, 0, 0], cl, 6); }
})(A.comet);
