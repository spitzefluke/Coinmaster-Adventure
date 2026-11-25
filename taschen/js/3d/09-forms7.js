// ── Befragung, Runde 2: Nr. 36 bis 60 ──

// gewölbtes Blech um den Rücken (Ausschnitt eines Zylinders mit Mittelpunkt vor der Brust)
function curvedPlate(B, y, h, R, c, k, par, open = 1, segs = 28) {
  const half = Math.asin(Math.min(0.99, 1.02 / R)) * open;
  const m = B.mesh(geo(`cp${R}|${h}|${half.toFixed(3)}`, () => new THREE.CylinderGeometry(R, R, h, segs, 1, true, -half, half * 2)), c, k, [0, y, 0.16 - R], null, par);
  m.material.side = THREE.DoubleSide;
  return { m, half };
}
function plateRim(B, y, R, half, c, par) { B.mesh(geo(`pr${R}|${half.toFixed(3)}`, () => new THREE.TorusGeometry(R, 0.03, 8, 40, half * 2)), c, 'gold', [0, y, 0.16 - R], [PI / 2, 0, PI / 2 - half], par); }
function pauldron(B, side, s, c, c2, trim, k, spikes, runes) {
  const g = B.pivot([side * 1.12 * s, 1.0 + (s - 1) * 0.3, -0.5], [0, 0, -side * 0.45]);
  const dome = [[0, 0.32], [0.25, 0.3], [0.45, 0.2], [0.58, 0.04], [0.6, 0]];
  B.lathe(dome.map(([x, y]) => [x * s, y * s]), c, k, [0, 0, 0], null, g, 28, 'pd' + s).scale.set(1, 1, 1.2);
  B.tor(0.6 * s, 0.035 * s, trim, 'gold', [0, 0, 0], [PI / 2, 0, 0], g).scale.set(1, 1.2, 1);
  for (let l = 1; l <= 3; l++) {
    const L = B.pivot([side * 0.08 * l * s, -0.15 * l * s, 0], [0, 0, -side * 0.12 * l], g);
    B.lathe([[0.5, 0], [0.62, -0.02], [0.64, -0.12], [0.58, -0.14]].map(([x, y]) => [x * s, y * s]), l % 2 ? c2 : c, k, [0, 0, 0], null, L, 28, 'lame' + s).scale.set(1, 1, 1.2);
    B.tor(0.63 * s, 0.018 * s, trim, 'gold', [0, -0.12 * s, 0], [PI / 2, 0, 0], L).scale.set(1, 1.2, 1);
    if (runes && l === 2) for (let i = 0; i < 4; i++) { const a = -0.4 + i * 0.28; B.box([0.02, 0.07 * s, 0.02], runes, 'neon', [Math.sin(a) * 0.64 * s, -0.07 * s, Math.cos(a) * 0.76 * s], [0, a, 0], L); }
  }
  for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; B.ball(0.03 * s, trim, 'gold', [Math.cos(a) * 0.5 * s, 0.07 * s, Math.sin(a) * 0.6 * s], null, g, 6); }
  if (spikes) for (let i = 0; i < 3; i++) B.cone(0.08 * s, 0.38 * s, c2, k, [(-0.15 + i * 0.15) * s, 0.42 * s, (-0.2 + i * 0.2) * s], [0, 0, 0], g, 8);
  return g;
}

// ── Nr. 36, 46, 70: echte Plattenrüstung ──
A.plate = (B, p) => {
  const s = p.size || 1, c = p.c, c2 = p.c2 || shade(c, -0.25), trim = p.trim || GOLD, k = p.k || 'gold';
  // Rückenplatte, oben breit, mit Grat, Rand und Gravur
  const up = curvedPlate(B, 0.45, 1.15, 1.6, c, k);
  plateRim(B, 1.02, 1.6, up.half, trim); plateRim(B, -0.12, 1.6, up.half, trim);
  B.rbox([0.09, 1.1, 0.06], shade(c, 0.15), k, [0, 0.45, 0.18], null, null, 0.03);
  for (let i = 0; i < 6; i++) B.ball(0.03, trim, 'gold', [0, 0.0 + i * 0.18, 0.22], null, null, 6);
  for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) { const y = 0.25 + i * 0.22; B.box([0.5, 0.025, 0.02], trim, 'gold', [sx * 0.32, y, 0.12], [0, -sx * 0.32, sx * 0.45]); }
  for (const sx of [-1, 1]) for (let i = 0; i < 6; i++) { const a = sx * up.half * 0.94, y = -0.05 + i * 0.2; B.ball(0.028, trim, 'gold', [Math.sin(a) * 1.6, y, 0.16 - 1.6 + Math.cos(a) * 1.6 + 0.02], null, null, 6); }
  // Bauchreifen (überlappende Folgen)
  for (let l = 0; l < 4; l++) {
    const R = 1.6 + 0.03 + l * 0.025, y = -0.28 - l * 0.22;
    const lm = curvedPlate(B, y, 0.27, R, l % 2 ? c2 : c, k);
    plateRim(B, y - 0.13, R, lm.half, trim);
    if (p.runes) for (let i = 0; i < 5; i++) { const a = (-0.5 + i * 0.25) * lm.half; B.box([0.02, 0.14, 0.02], p.runes, 'neon', [Math.sin(a) * (R + 0.01), y, 0.16 - R + Math.cos(a) * (R + 0.01)], [0, a, (i % 2 ? 0.3 : -0.3)]); }
  }
  // Halsberge
  B.tor(0.66, 0.07, c, k, [0, 1.06, -0.5], [PI / 2, 0, 0]).scale.set(1, 0.85, 1);
  B.tor(0.66, 0.025, trim, 'gold', [0, 1.13, -0.5], [PI / 2, 0, 0]).scale.set(1, 0.85, 1);
  for (const side of [-1, 1]) {
    pauldron(B, side, s, c, c2, trim, k, p.spikes, p.runes);
    B.rbox([0.14, 0.12, 1.0], LEATHER, 'leather', [side * 0.98, 0.15, -0.5], null, null, 0.03);
    B.buckle([side * 1.03, 0.15, -0.95], 0.45, trim).rotation.y = PI / 2;
  }
  B.rbox([2.1, 0.2, 1.12], LEATHER, 'leather', [0, -1.05, -0.5], null, null, 0.05);
  B.buckle([0, -1.05, 0.08], 1.0, trim);
  B.tor(0.24, 0.05, trim, 'gold', [0, 0.45, 0.24]);
  if (p.gem) { B.gem(0.18, p.gem, [0, 0.45, 0.26]); B.glow(0.8, p.gem, [0, 0.45, 0.35], null, 0.55); } else { B.coin([0, 0.45, 0.25], null, null, 0.7); B.emblem('star', [0, 0.45, 0.29], 0.45); }
  if (p.hallmark) { B.rbox([0.32, 0.18, 0.02], shade(c, 0.2), k, [0.45, 0.8, 0.12], [0, -0.28, 0], null, 0.03); B.box([0.04, 0.12, 0.025], '#5a6272', 'metal', [0.41, 0.8, 0.13], [0, -0.28, 0]); B.box([0.12, 0.04, 0.025], '#5a6272', 'metal', [0.41, 0.8, 0.13], [0, -0.28, 0]); B.tor(0.035, 0.012, '#5a6272', 'metal', [0.52, 0.8, 0.1], [0, -0.28, 0]); }
  if (p.glow) B.sparkle(30, [2.8 * s, 2.6 * s, 1.4], p.glow, [0, 0, 0.3], 0.07, 0.4);
  if (p.sheen) { const sh = B.glow(1.4, p.sheen, [0, 0.6, 0.4], null, 0.35); B.anims.push((t) => { sh.position.x = Math.sin(t * 0.8) * 0.8; sh.material.opacity = 0.25 + 0.15 * Math.sin(t * 1.6); }); }
};

// ── Nr. 37: Mantel aus Stoffbahnen, die beim Bewegen wehen ──
A.cape = (B, p) => {
  const c = p.c || '#8c1d2f', t = p.trim || GOLD, cols = 12, rows = 7, segH = 0.5;
  B.ball(0.62, c, 'cloth', [0, 1.02, 0.05], [1.05, 0.55, 0.75], null, 24);
  for (let i = 0; i < 18; i++) { const a = (i / 18) * PI * 2; B.ball(0.12, '#f2ede4', 'cloth', [Math.cos(a) * 0.68, 1.08, -0.5 + Math.sin(a) * 0.64], null, null, 10); if (i % 3 === 0) B.ball(0.03, '#111', 'dark', [Math.cos(a) * 0.76, 1.1, -0.5 + Math.sin(a) * 0.72], null, null, 6); }
  const segs = [];
  for (let ci = 0; ci < cols; ci++) {
    const u = ci / (cols - 1), x = -1.15 + u * 2.3, z = 0.12 - Math.pow(u * 2 - 1, 2) * 0.35;
    let par = B.pivot([x, 1.0, z], [0, (u - 0.5) * 0.25, 0]);
    for (let r = 0; r < rows; r++) {
      const piv = r === 0 ? par : B.pivot([0, -segH, 0], null, par);
      const col = ci % 2 ? shade(c, -0.12) : c;
      B.rbox([0.235, segH + 0.04, 0.035], col, 'cloth', [0, -segH / 2, 0], null, piv, 0.012);
      B.rbox([0.205, segH + 0.03, 0.01], shade(t, -0.15), 'gold', [0, -segH / 2, -0.024], null, piv, 0.004);
      if (r === rows - 1) { B.rbox([0.22, 0.12, 0.05], '#f2ede4', 'cloth', [0, -segH + 0.02, 0.005], null, piv, 0.02); B.coin([0, -segH + 0.1, 0.035], [PI / 2, 0, 0], piv, 0.42); }
      if ((r === 2 || r === 4) && ci % 3 === 1) B.emblem('star', [0, -segH / 2, 0.025], 0.35, piv);
      segs.push({ piv, ci, r });
      par = piv;
    }
  }
  B.anims.push((tt) => {
    const k = WALK.k;
    for (const { piv, ci, r } of segs) {
      const wave = Math.sin(tt * 1.7 + ci * 0.45 - r * 0.7) * (0.03 + r * 0.012);
      const wind = k * (r === 0 ? 0.22 : 0.06 + Math.sin(tt * 6 + ci * 0.8 - r) * 0.04);
      const base = r === 0 ? 0.14 : 0.0;
      piv.rotation.x = -(base + wave + wind);
      piv.rotation.z = Math.sin(tt * 1.3 + r * 0.5 + ci) * 0.006 * (1 + k);
    }
  });
  for (const sx of [-1, 1]) { B.gem(0.14, '#c1121f', [sx * 0.62, 1.0, -0.98], [PI / 2, 0, 0]); B.tor(0.15, 0.03, t, 'gold', [sx * 0.62, 1.0, -0.99]); }
  for (let i = 0; i < 7; i++) B.tor(0.05, 0.015, t, 'gold', [-0.45 + i * 0.15, 0.93 - Math.sin(i / 6 * PI) * 0.12, -1.0], [0, i % 2 ? PI / 2 : 0, 0]);
};

// ── Nr. 39: Harnisch mit richtigen Schulterteilen ──
A.harness = (B) => {
  const G = GOLD;
  const up = curvedPlate(B, 0.35, 1.0, 1.7, G, 'gold', null, 0.7);
  plateRim(B, 0.85, 1.7, up.half, '#fff1a8'); plateRim(B, -0.15, 1.7, up.half, '#fff1a8');
  B.rbox([0.95, 0.75, 0.04], '#7a1f2a', 'cloth', [0, 0.35, 0.2], null, null, 0.04);
  B.rivets([-0.5, 0.75, 0.19], [0.5, 0.75, 0.19], 7, '#fff1a8', 0.03);
  for (const side of [-1, 1]) {
    pauldron(B, side, 0.9, G, '#b8860b', '#fff1a8', 'gold');
    for (let i = 0; i < 9; i++) { B.cyl(0.02, 0.016, 0.3, G, 'gold', [side * 1.42, 0.62, -0.9 + i * 0.1], null, null, 6); B.ball(0.03, G, 'gold', [side * 1.42, 0.46, -0.9 + i * 0.1], null, null, 6); }
    B.rbox([0.2, 2.5, 0.06], LEATHER, 'leather', [side * 0.3, -0.1, 0.13], [0, 0, side * 0.62], null, 0.02);
    B.seam([side * 0.08, -1.0, 0.17], [side * 0.62, 0.8, 0.17], '#e9d8b0', 12);
  }
  B.rbox([2.1, 0.24, 1.12], LEATHER, 'leather', [0, -0.85, -0.5], null, null, 0.05);
  B.buckle([0, -0.85, 0.08], 1.2, G);
  [[-0.3, 0.32, '#c33'], [0, 0.42, '#36c'], [0.3, 0.32, '#3a3']].forEach(([x, y, col]) => {
    B.rbox([0.13, 0.25, 0.03], col, 'cloth', [x, y + 0.12, 0.24], null, null, 0.01);
    B.box([0.035, 0.25, 0.032], '#fff', 'cloth', [x, y + 0.12, 0.245]);
    B.coin([x, y - 0.1, 0.25], null, null, 0.48);
    B.emblem('star', [x, y - 0.1, 0.28], 0.3);
  });
  chain(B, [-0.45, 0.05, 0.24], [0.45, 0.05, 0.24], 11, G, 'gold', 0.035);
  B.glow(0.9, '#fff1a8', [0, 0.3, 0.35], null, 0.3);
};

// ── Nr. 40: Schmiedewerkzeug am Panzerrucksack ──
X[40] = (B, s) => {
  const zc = 0.42 * s, zf = 0.79 * s;
  const hm = B.pivot([-0.95 * s, 0.0, zc], [0, 0, 0.15]);
  B.rbox([0.06, 0.8 * s, 0.06], '#7a5232', 'wood', [0, 0, 0], null, hm, 0.02);
  B.rbox([0.3 * s, 0.14 * s, 0.14 * s], '#3a3f4a', 'metal', [0, 0.42 * s, 0], null, hm, 0.03);
  B.cone(0.07 * s, 0.14 * s, '#3a3f4a', 'metal', [0.21 * s, 0.42 * s, 0], [0, 0, -PI / 2], hm, 4);
  const tg = B.pivot([0.95 * s, -0.1, zc], [0, 0, -0.1]);
  for (const sx of [-1, 1]) B.cyl(0.02, 0.02, 0.9 * s, '#2a2a30', 'metal', [sx * 0.04 * s, 0, 0], [0, 0, sx * 0.06], tg, 6);
  B.ball(0.04 * s, '#2a2a30', 'metal', [0, 0.25 * s, 0], null, tg, 8);
  for (const sx of [-1, 1]) B.rbox([0.06 * s, 0.14 * s, 0.04], '#2a2a30', 'metal', [sx * 0.06 * s, 0.45 * s, 0], [0, 0, -sx * 0.5], tg, 0.01);
  for (const [x, y] of [[-0.95, 0.45], [0.95, 0.45]]) B.rbox([0.08, 0.1 * s, 0.4 * s], LEATHER, 'leather', [x * s, y * s, zc], null, null, 0.02);
  const fl = B.pivot([0.45 * s, 0.98 * s, zc], [0, 0, 1.3]);
  B.rbox([0.06 * s, 0.6 * s, 0.02], '#7a7f8a', 'metal', [0, 0, 0], null, fl, 0.006);
  for (let i = 0; i < 9; i++) B.box([0.062 * s, 0.006, 0.022], '#4a4f5a', 'metal', [0, (-0.25 + i * 0.06) * s, 0], [0, 0, 0.3], fl);
  B.rbox([0.07, 0.18 * s, 0.06], '#7a5232', 'wood', [0, -0.38 * s, 0], null, fl, 0.02);
  B.rbox([0.6 * s, 0.4 * s, 0.05], '#4a3a2a', 'leather', [0, -0.48 * s, zf + 0.3 * s], null, null, 0.04);
  B.emblem('hammer', [0, -0.48 * s, zf + 0.34 * s], 0.9 * s);
};

// ── Nr. 42: verbesserte Schildmitte (Sonnenrelief mit Edelsteinkranz) ──
X[42] = (B, s) => {
  for (let i = 0; i < 16; i++) { const a = i / 16 * PI * 2; B.cone(0.05 * s, (i % 2 ? 0.22 : 0.32) * s, '#fff1a8', 'gold', [Math.cos(a) * 0.42 * s, Math.sin(a) * 0.42 * s, 0.36], [0, 0, a - PI / 2], null, 4).scale.set(1, 1, 0.35); }
  B.cyl(0.32 * s, 0.32 * s, 0.06, GOLD, 'gold', [0, 0, 0.38], [PI / 2, 0, 0], null, 36);
  for (let i = 0; i < 10; i++) { const a = i / 10 * PI * 2; B.gem(0.045 * s, ['#e63946', '#4cc9f0', '#2ec4b6', '#b77bff', '#ffe066'][i % 5], [Math.cos(a) * 0.27 * s, Math.sin(a) * 0.27 * s, 0.42]); }
  B.coin([0, 0, 0.43], null, null, 0.6 * s, '#ffd23f');
  B.emblem('star', [0, 0, 0.47], 0.55 * s);
  B.glow(1.0 * s, '#ffe08a', [0, 0, 0.55], null, 0.45);
};

// ── Nr. 43: besseres Schwert in Scheide, schräg über dem Rucksack ──
X[43] = (B, s) => {
  const zf = 0.79 * s;
  const sw = B.pivot([0.15 * s, 0.1 * s, zf + 0.32 * s], [0, 0, -0.55]);
  B.rbox([0.16 * s, 1.5 * s, 0.07], '#3a1f14', 'leather', [0, -0.3 * s, 0], null, sw, 0.04);
  for (const y of [-0.95, 0.3]) B.rbox([0.18 * s, 0.1 * s, 0.08], GOLD, 'gold', [0, y * s, 0], null, sw, 0.03);
  B.cone(0.09 * s, 0.16 * s, GOLD, 'gold', [0, -1.1 * s, 0], [PI, 0, 0], sw, 4).scale.set(1, 1, 0.45);
  B.tor(0.2 * s, 0.035 * s, GOLD, 'gold', [0, 0.53 * s, 0], [0, 0, PI], sw, PI).scale.set(1, 0.35, 1);
  B.ball(0.05 * s, '#c1121f', 'gem', [0, 0.5 * s, 0.04], null, sw, 10);
  B.cyl(0.04 * s, 0.045 * s, 0.32 * s, '#3a1f14', 'leather', [0, 0.7 * s, 0], null, sw, 10);
  for (let i = 0; i < 6; i++) B.tor(0.045 * s, 0.012 * s, GOLD, 'gold', [0, (0.57 + i * 0.05) * s, 0], [PI / 2, 0, 0.3], sw);
  B.lathe([[0, -0.06], [0.07, -0.03], [0.08, 0.02], [0.04, 0.07], [0, 0.08]].map(([x, y]) => [x * s, y * s]), GOLD, 'gold', [0, 0.9 * s, 0], null, sw, 16, 'pommel' + s);
  B.gem(0.05 * s, '#c1121f', [0, 0.9 * s, 0.07], [0, 0, 0], sw);
  B.glow(0.4 * s, '#ff6b6b', [0, 0.9 * s, 0.12], sw, 0.5);
  for (const y of [-0.6, 0.1]) { B.rbox([1.0 * s, 0.07 * s, 0.03], '#2a1a10', 'leather', [0, y * s, -0.04], [0, 0, 0.55], sw, 0.01); }
};

// ── Nr. 44: Golem aus Felsbrocken mit Goldadern, Moos und Kristallen ──
A.creature = ((orig) => (B, p) => {
  if (p.kind !== 'golem2') return orig(B, p);
  const S = '#8a7b5a', S2 = '#6e624a';
  B.straps('#4a3a2a', 'leather', { plain: true });
  const chunks = [[0, -0.15, 0.7, 0.62, 0.55, 0.45], [-0.35, 0.15, 0.95, 0.3, 0.28, 0.25], [0.38, -0.3, 0.98, 0.28, 0.3, 0.22], [0.1, -0.55, 0.95, 0.3, 0.2, 0.2], [-0.3, -0.5, 0.9, 0.22, 0.2, 0.2]];
  chunks.forEach(([x, y, z, w, h, d], i) => B.rbox([w * 2, h * 2, d * 2], i % 2 ? S2 : S, 'stone', [x, y, z], [i * 0.2, i * 0.3, i * 0.1], null, 0.08));
  const hd = B.pivot([0, 0.72, 0.95]);
  B.rbox([0.8, 0.6, 0.66], shade(S, 0.08), 'stone', [0, 0, 0], null, hd, 0.14);
  B.rbox([0.7, 0.14, 0.12], S2, 'stone', [0, 0.18, 0.33], [0.25, 0, 0], hd, 0.04);
  B.rbox([0.5, 0.16, 0.2], S2, 'stone', [0, -0.25, 0.25], null, hd, 0.05);
  for (const sx of [-0.17, 0.17]) { B.gem(0.07, '#ffcf4a', [sx, 0.05, 0.34], [0, 0, 0], hd); B.glow(0.4, '#ffcf4a', [sx, 0.05, 0.4], hd, 0.85); }
  for (let i = 0; i < 4; i++) B.box([0.06, 0.07, 0.04], '#e9e2cf', 'plastic', [-0.15 + i * 0.1, -0.2, 0.36], null, hd);
  B.anims.push((t) => { hd.rotation.y = Math.sin(t * 0.6) * 0.25; hd.rotation.x = Math.sin(t * 0.9) * 0.06; });
  for (const sx of [-1, 1]) {
    B.rbox([0.42, 0.55, 0.42], S, 'stone', [sx * 0.86, 0.3, 0.45], [0.6, 0, -sx * 0.2], null, 0.1);
    B.rbox([0.38, 0.55, 0.38], S2, 'stone', [sx * 0.8, 0.85, -0.05], [1.2, 0, -sx * 0.15], null, 0.1);
    const hand = B.pivot([sx * 0.72, 1.12, -0.48]);
    B.rbox([0.44, 0.3, 0.36], shade(S, -0.1), 'stone', [0, 0, 0], null, hand, 0.08);
    for (let f = -1; f <= 1; f++) B.rbox([0.11, 0.24, 0.11], S2, 'stone', [f * 0.13, -0.1, -0.24], [0.6, 0, 0], hand, 0.03);
    B.rbox([0.4, 0.62, 0.4], S, 'stone', [sx * 0.4, -1.0, 0.88], [0.1, 0, sx * 0.05], null, 0.1);
    B.oct(0.16, '#7fe7ff', 'gem', [sx * 0.72, 0.62, 0.62], [0.6, 1.6, 0.6], [0, 0, -sx * 0.5]);
    B.oct(0.11, '#7fe7ff', 'gem', [sx * 0.85, 0.55, 0.5], [0.6, 1.5, 0.6], [0.3, 0, -sx * 0.9]);
  }
  const veins = [[-0.5, 0.3, -0.1, -0.2], [-0.1, -0.2, 0.25, -0.55], [0.25, -0.55, 0.45, -0.1], [-0.1, -0.2, -0.45, -0.45], [0.2, 0.25, -0.1, -0.2]];
  for (const [x0, y0, x1, y1] of veins) { const d = Math.hypot(x1 - x0, y1 - y0); B.box([0.035, d, 0.03], '#ffcf4a', 'neon', [(x0 + x1) / 2, (y0 + y1) / 2, 1.27], [0, 0, Math.atan2(y1 - y0, x1 - x0) - PI / 2]); }
  B.glow(1.6, '#ffcf4a', [0, -0.15, 1.3], null, 0.3);
  for (const [x, y, sz] of [[-0.42, 0.05, 0.13], [0.42, -0.1, 0.11], [0.05, -0.6, 0.1], [0.2, 0.2, 0.09]]) B.oct(sz, GOLD, 'gold', [x, y, 1.2], [1, 1.3, 0.7], [0, 0, x]);
  for (const [x, y, z] of [[-0.3, 0.42, 0.95], [0.25, 0.42, 1.0], [0.0, 1.03, 0.95], [0.55, -0.6, 0.9], [-0.55, 0.35, 0.75]]) B.ball(0.14, '#4f7a3a', 'cloth', [x, y, z], [1.4, 0.35, 1.1], null, 10);
  B.gem(0.12, '#2ec4b6', [0, 0.0, 1.29]);
  B.glow(0.6, '#2ec4b6', [0, 0, 1.35], null, 0.6);
})(A.creature);

// ── Nr. 48 und 55: Kanonen, stark verbessert (Lafette mit Rädern, Rückstoß, Münzschüsse) ──
A.cannon = (B, p) => {
  const multi = !!p.multi, c = multi ? '#e7f6ff' : p.c || '#c1121f', k = 'gem', G = GOLD, W = '#5a3a22';
  B.straps('#3a2618', 'leather', { metal: G });
  const zc = multi ? 0.75 : 0.55;
  B.rbox([1.4, 0.3, 0.9], W, 'wood', [0, -0.75, zc], null, null, 0.05);
  for (const sx of [-1, 1]) B.rbox([0.14, 0.7, 0.9], W, 'wood', [sx * 0.55, -0.4, zc], null, null, 0.04);
  B.rivets([-0.6, -0.62, zc + 0.46], [0.6, -0.62, zc + 0.46], 7, '#9aa3ad', 0.03);
  for (const sx of [-1, 1]) {
    const wh = B.pivot([sx * 0.78, -0.75, zc]);
    B.cyl(0.42, 0.42, 0.08, '#6b4a2a', 'wood', [0, 0, 0], [0, 0, PI / 2], wh, 24);
    B.tor(0.42, 0.04, IRON, 'metal', [0, 0, 0], [0, PI / 2, 0], wh);
    for (let i = 0; i < 8; i++) B.box([0.06, 0.78, 0.05], '#4a2a16', 'wood', [sx * 0.03, 0, 0], [i * PI / 8, 0, 0], wh);
    B.cyl(0.09, 0.09, 0.14, G, 'gold', [0, 0, 0], [0, 0, PI / 2], wh, 12);
    B.anims.push((t) => { wh.rotation.x = WALK.k ? -t * 3 * WALK.k : 0; });
  }
  const pv = B.pivot([0, -0.1, zc + 0.1], [-0.65, 0, 0]);
  const recoil = B.pivot([0, 0, 0], null, pv);
  const prof = [[0.2, -0.95], [0.3, -0.9], [0.31, -0.78], [0.27, -0.72], [0.25, 0.6], [0.29, 0.65], [0.29, 0.75], [0.24, 0.8], [0.27, 0.98], [0.34, 1.05], [0.34, 1.12], [0.22, 1.12]];
  const barrels = multi ? [[-0.42, 0], [0.42, 0], [0, 0.4]] : [[0, 0]];
  const gat = B.pivot([0, 0.2, 0], null, recoil);
  barrels.forEach(([bx, bz]) => {
    const b = B.pivot([bx * (multi ? 0.7 : 1), 0, bz * 0.7], null, gat);
    const sc = multi ? 0.6 : 1;
    B.lathe(prof.map(([x, y]) => [x * sc, y * sc]), c, k, [0, 0, 0], null, b, 28, 'barrel' + sc);
    for (const y of [-0.82, 0.68, 1.06]) B.tor(0.3 * sc, 0.035 * sc, G, 'gold', [0, y * sc, 0], [PI / 2, 0, 0], b);
    B.cyl(0.19 * sc, 0.19 * sc, 0.02, '#1a0a0a', 'dark', [0, 1.13 * sc, 0], null, b, 20);
    for (let i = 0; i < 4; i++) B.gem(0.05 * sc, multi ? '#bff6ff' : '#ff6b6b', [Math.sin(i * PI / 2) * 0.26 * sc, 0.1 * sc, Math.cos(i * PI / 2) * 0.26 * sc], [0, i * PI / 2, 0], b);
  });
  if (multi) { B.tor(0.55, 0.06, G, 'gold', [0, 0.2, 0.1], [PI / 2, 0, 0], recoil); B.tor(0.55, 0.06, G, 'gold', [0, -0.2, 0.1], [PI / 2, 0, 0], recoil); B.spin(gat, 'y', 2.4); }
  B.ball(0.12, G, 'gold', [0, -0.85, 0], null, recoil, 12);
  B.cyl(0.015, 0.015, 0.2, '#3a2a1c', 'cloth', [0.15, -0.7, 0], [0, 0, -0.6], recoil, 5);
  const spark = B.glow(0.3, '#ffb347', [0.24, -0.62, 0], recoil, 0.9);
  B.pulse(spark, 0.4, 14);
  const flash = B.glow(1.6, multi ? '#bff6ff' : '#ff6b6b', [0, (multi ? 0.95 : 1.4), 0], pv, 0);
  const shot = B.coin([0, 1.4, 0], [0, 0, 0], pv, 0.6);
  const puffs = [0, 1, 2].map((i) => B.ball(0.18 + i * 0.05, '#d8d2c8', 'haze', [0, 1.5, 0], null, pv, 10));
  B.anims.push((t) => {
    const per = multi ? 0.6 : 3.0, ph = (t % per) / per;
    const kick = ph < 0.08 ? ph / 0.08 : Math.max(0, 1 - (ph - 0.08) / 0.3);
    recoil.position.y = -kick * (multi ? 0.05 : 0.18);
    flash.material.opacity = ph < 0.12 ? 0.9 * (1 - ph / 0.12) : 0;
    shot.position.y = 1.4 + ph * 5; shot.rotation.x = t * 10; shot.visible = ph < 0.7;
    puffs.forEach((pf, i) => { const q = Math.min(1, ph * 2 + i * 0.1); pf.position.set(Math.sin(i * 2) * 0.2 * q, 1.5 + q * (0.6 + i * 0.3), Math.cos(i * 2) * 0.2 * q); pf.scale.setScalar(0.5 + q * 1.5); pf.visible = ph < 0.6; });
  });
  for (let i = 0; i < 6; i++) { const r = i < 3 ? 0 : i < 5 ? 1 : 2; const x = [-0.15, 0, 0.15, -0.075, 0.075, 0][i]; B.ball(0.08, multi ? '#bff6ff' : '#c1121f', 'gem', [0.95 + x, -0.65 + r * 0.13, zc + 0.15 + (r === 1 ? 0.05 : 0)], null, null, 12); }
  B.sparkle(18, [1.4, 1.8, 1.2], multi ? '#e9fdff' : '#ff8a8a', [0, 1.0, zc + 1.2], 0.07, 0.8);
};

// ── Nr. 49: Obelisk aus Stein mit Saphirrissen, ohne Münzen ──
A.obelisk = (B, p) => {
  const c = p.c || '#2453c7', ST = '#5a6070';
  const pv = B.pivot([0, 0.25, 1.45]);
  B.cyl(0.3, 0.46, 2.6, ST, 'stone', [0, 0, 0], [0, PI / 4, 0], pv, 4);
  B.rbox([0.8, 0.14, 0.8], shade(ST, -0.1), 'stone', [0, -1.36, 0], [0, PI / 4, 0], pv, 0.03);
  B.cone(0.35, 0.5, c, 'gem', [0, 1.55, 0], [0, PI / 4, 0], pv, 4);
  B.glow(0.9, '#6fa8ff', [0, 1.55, 0], pv, 0.6);
  for (let f = 0; f < 4; f++) {
    const a = f * PI / 2, nx = Math.sin(a), nz = Math.cos(a);
    let x = (f % 2 ? 0.05 : -0.05), y = -1.1;
    for (let i = 0; i < 7; i++) {
      const nxp = x + (i % 2 ? 0.1 : -0.1) * (0.6 + (f % 3) * 0.2), ny = y + 0.32, w = 0.3 + 0.16 * ((ny + 1.3) / 2.6) * -1 + 0.16;
      const r = 0.46 - (ny + 1.3) / 2.6 * 0.16 + 0.005;
      const d = Math.hypot(nxp - x, 0.32);
      const mx = (x + nxp) / 2, my = (y + ny) / 2, rr = 0.46 - (my + 1.3) / 2.6 * 0.16 + 0.006;
      const m = B.box([0.035, d, 0.02], '#5fa0ff', 'neon', [nx * rr * 0.72 + Math.cos(a) * mx, my, nz * rr * 0.72 - Math.sin(a) * mx], [0, a, Math.atan2(ny - y, nxp - x) - PI / 2], pv);
      x = nxp; y = ny;
    }
    B.glow(0.6, '#5fa0ff', [nx * 0.4, -0.2, nz * 0.4], pv, 0.35);
  }
  const ring = B.pivot([0, -1.0, 0], null, pv);
  for (let i = 0; i < 7; i++) { const a = i / 7 * PI * 2; B.oct(0.12 + (i % 3) * 0.04, i % 2 ? ST : c, i % 2 ? 'stone' : 'gem', [Math.cos(a) * 0.9, Math.sin(i * 2) * 0.12, Math.sin(a) * 0.9], [1, 0.8, 1], [i, i, 0], ring); }
  B.spin(ring, 'y', -0.6);
  B.bob(pv, 0.12, 1.3); B.spin(pv, 'y', 0.35);
  B.glow(2.6, '#5fa0ff', [0, 0.25, 1.45], null, 0.2);
  B.sparkle(26, [1.6, 3, 1.6], '#9fd3ff', [0, 0.2, 1.45], 0.06, 0.4);
};

// ── Nr. 50: Bogen mit geschwungenen Wurfarmen, Sehne und gefiederten Pfeilen ──
A.bow = (B) => {
  B.rbox([0.18, 2.8, 0.06], LEATHER, 'leather', [0, 0, 0.06], [0, 0, 0.75], null, 0.02);
  B.rbox([0.2, 0.08, 1.08], LEATHER, 'leather', [0.55, 1.04, -0.5], null, null, 0.02);
  const pv = B.pivot([-0.2, 0.05, 0.42], [0, 0, 0.7]);
  const pts = [[0.05, -1.45], [0.22, -1.25], [0.28, -0.9], [0.18, -0.4], [0.08, -0.12], [0.08, 0.12], [0.18, 0.4], [0.28, 0.9], [0.22, 1.25], [0.05, 1.45]].map(([x, y]) => new THREE.Vector3(x, y, 0));
  B.mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.05, 8), '#2ec4b6', 'gem', [0, 0, 0], null, pv);
  B.mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.slice(2, 8).map((v) => v.clone().add(new THREE.Vector3(0.012, 0, 0)))), 30, 0.035, 6), GOLD, 'gold', [0, 0, 0.015], null, pv);
  B.cyl(0.075, 0.075, 0.34, '#3a1f14', 'leather', [0.08, 0, 0], null, pv, 10);
  for (let i = 0; i < 5; i++) B.tor(0.077, 0.012, GOLD, 'gold', [0.08, -0.14 + i * 0.07, 0], [PI / 2, 0, 0], pv);
  for (const sy of [-1, 1]) { B.gem(0.07, sy > 0 ? '#e63946' : '#4cc9f0', [0.05, sy * 1.48, 0], [0, 0, 0], pv); B.glow(0.35, sy > 0 ? '#e63946' : '#4cc9f0', [0.05, sy * 1.48, 0.05], pv, 0.6); }
  B.mesh(new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(0.05, -1.43, 0), new THREE.Vector3(0.05, 1.43, 0)), 2, 0.008, 4), '#f2ede4', 'plastic', [0, 0, 0], null, pv);
  // Köcher mit Pfeilen
  const q = B.pivot([0.48, -0.1, 0.6], [0, 0, -0.3]);
  B.lathe([[0.17, -0.7], [0.2, -0.6], [0.2, 0.6], [0.22, 0.66], [0.2, 0.7]], '#6b3f22', 'leather', [0, 0, 0], null, q, 20, 'quiver');
  for (const y of [-0.55, 0.0, 0.55]) B.tor(0.205, 0.02, GOLD, 'gold', [0, y, 0], [PI / 2, 0, 0], q);
  B.seam([0, -0.6, 0.205], [0, 0.6, 0.205], '#e9d8b0', 9);
  B.emblem('star', [0, 0, 0.22], 0.4, q);
  for (let i = 0; i < 6; i++) {
    const a = i * 1.05, ax = Math.cos(a) * 0.08, az = Math.sin(a) * 0.08, tilt = (i % 3 - 1) * 0.08;
    const ar = B.pivot([ax, 0.7, az], [tilt, 0, tilt], q);
    B.cyl(0.015, 0.015, 0.5, '#d9c7a0', 'wood', [0, 0.1, 0], null, ar, 5);
    for (let f = 0; f < 3; f++) B.feather(0.2, 0.18, i % 2 ? '#e63946' : '#f6f1e6', 'plastic', [0, 0.18, 0], PI / 2, B.pivot([0, 0, 0], [0, f * 2.09, 0], ar), 1);
    B.cone(0.025, 0.06, GOLD, 'gold', [0, 0.38, 0], null, ar, 6);
  }
  B.sparkle(12, [2, 2.6, 1], '#9ff5d0', [-0.2, 0, 0.5], 0.05, 0.25);
};

// ── Nr. 51 und 74: Turm näher am Rücken, mit Portal und Effekten ──
A.tower = (B, p) => {
  const s = p.size || 1, c = p.c || '#5fe0b0', st = p.stone || '#cfd6e0';
  backplate(B, IRON, c, 0.9, 1.1);
  B.rbox([0.3, 0.3, 0.6 * s], IRON, 'metal', [0, 0.35 * s, 0.4 * s], null, null, 0.06);
  const pv = B.pivot([0, 0.3 * s, 1.15 * s]);
  B.cone(0.8 * s, 0.9 * s, '#6b5a4a', 'stone', [0, -1.45 * s, 0], [PI, 0, 0], pv, 8);
  for (let i = 0; i < 7; i++) B.ball(0.08 * s, '#6b8a4a', 'plastic', [Math.sin(i * 1.3) * 0.7 * s, -1.0 * s, Math.cos(i * 1.3) * 0.7 * s], [1.3, 0.6, 1.3], pv, 10);
  B.cyl(0.55 * s, 0.62 * s, 2.0 * s, st, 'stone', [0, 0, 0], null, pv, 16);
  for (let r = 0; r < 6; r++) for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2 + (r % 2) * 0.26; B.box([0.26 * s, 0.022, 0.02], shade(st, -0.35), 'dark', [Math.sin(a) * 0.6 * s, (-0.8 + r * 0.32) * s, Math.cos(a) * 0.6 * s], [0, a + PI / 2, 0], pv); }
  for (let i = 0; i < 10; i++) { const a = i / 10 * PI * 2; B.rbox([0.2 * s, 0.24 * s, 0.2 * s], st, 'stone', [Math.sin(a) * 0.55 * s, 1.12 * s, Math.cos(a) * 0.55 * s], [0, a, 0], pv, 0.03); }
  B.cone(0.7 * s, 1.0 * s, c, p.roofK || 'gem', [0, 1.75 * s, 0], null, pv, 16);
  B.ball(0.1 * s, GOLD, 'gold', [0, 2.3 * s, 0], null, pv, 12);
  for (const y of [-0.2, 0.5]) for (const a of [1.6, 3.2, 4.8]) { B.rbox([0.16 * s, 0.3 * s, 0.05], '#ffd77a', 'neon', [Math.sin(a) * 0.61 * s, y * s, Math.cos(a) * 0.61 * s], [0, a, 0], pv, 0.03); }
  // Portal am Turmfuß
  const door = B.pivot([0, -0.62 * s, 0.6 * s], null, pv);
  B.tor(0.32 * s, 0.06 * s, GOLD, 'gold', [0, 0, 0], null, door, PI);
  B.rbox([0.06 * s, 0.32 * s, 0.1], GOLD, 'gold', [-0.32 * s, -0.16 * s, 0], null, door, 0.02);
  B.rbox([0.06 * s, 0.32 * s, 0.1], GOLD, 'gold', [0.32 * s, -0.16 * s, 0], null, door, 0.02);
  const sw = B.pivot([0, -0.05 * s, 0.02], null, door);
  B.cyl(0.29 * s, 0.29 * s, 0.02, c, 'neonT', [0, 0, 0], [PI / 2, 0, 0], sw, 28);
  for (let i = 0; i < 10; i++) { const a = i * 0.8, r = (0.04 + i * 0.024) * s; B.coin([Math.cos(a) * r, Math.sin(a) * r, 0.02], [PI / 2, 0, 0], sw, 0.22 * s); }
  B.spin(sw, 'z', -2.4);
  B.glow(1.0 * s, c, [0, -0.1 * s, 0.1], door, 0.75);
  // Runenring um den Turm
  const ring = B.pivot([0, -0.9 * s, 0], null, pv);
  B.tor(0.95 * s, 0.02, c, 'neon', [0, 0, 0], [PI / 2, 0, 0], ring);
  for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; B.rbox([0.1 * s, 0.14 * s, 0.03], c, 'neon', [Math.cos(a) * 0.95 * s, 0.05, Math.sin(a) * 0.95 * s], [0, -a, 0], ring, 0.01); }
  B.spin(ring, 'y', 0.9);
  if (p.overflow) { B.cone(0.45 * s, 0.4 * s, GOLD, 'gold', [0, 1.1 * s, 0], null, pv, 12); for (let i = 0; i < 12; i++) B.coin([Math.sin(i * 2) * 0.62 * s, 0.3 * s - i * 0.16 * s, Math.cos(i * 2) * 0.62 * s], [i, 0, 1], pv, 0.6 * s); }
  B.bob(pv, 0.08, 1.2);
  B.glow(2.4 * s, p.glow || c, [0, 0.3 * s, 1.15 * s], null, 0.2);
  B.sparkle(40, [1.8 * s, 3.2 * s, 1.8 * s], p.glow || c, [0, 0.3 * s, 1.15 * s], 0.07, 0.7);
};

// ── Nr. 52, 81, 97: Krone mittig, mit kleinem Abstand am Rücken ──
A.crown = (B, p) => {
  const s = p.size || 1, c = p.c || GOLD, k = p.k || 'gold', gems = p.gems || ['#e63946', '#4cc9f0', '#2ec4b6', '#b77bff'];
  B.rbox([0.45, 0.45, 0.12], c === GOLD ? '#b8860b' : shade(c, -0.3), k, [0, 0.2, 0.08], null, null, 0.06);
  B.tor(0.13, 0.03, GOLD, 'gold', [0, 0.2, 0.15]);
  B.glow(0.6, '#fff1a8', [0, 0.2, 0.25], null, 0.5);
  const pv = B.pivot([0, 0.25, 0.4 + 0.75 * s], [0.25, 0, 0]);
  B.cyl(0.7 * s, 0.64 * s, 0.32 * s, c, k, [0, 0, 0], null, pv, 40);
  B.cyl(0.62 * s, 0.58 * s, 0.5 * s, p.cap || '#7a1f2a', 'cloth', [0, 0.2 * s, 0], null, pv, 32);
  B.ball(0.6 * s, p.cap || '#7a1f2a', 'cloth', [0, 0.42 * s, 0], [1, 0.55, 1], pv, 24);
  for (let i = 0; i < 30; i++) { const a = i / 30 * PI * 2; B.ball(0.045 * s, '#f6f1e6', 'cloth', [Math.sin(a) * 0.72 * s, -0.17 * s, Math.cos(a) * 0.72 * s], null, pv, 8); if (i % 5 === 0) B.ball(0.018 * s, '#111', 'dark', [Math.sin(a) * 0.76 * s, -0.17 * s, Math.cos(a) * 0.76 * s], null, pv, 5); }
  const n = p.spikes || 8;
  for (let i = 0; i < n; i++) {
    const a = i / n * PI * 2;
    B.cone(0.13 * s, 0.5 * s, c, k, [Math.sin(a) * 0.7 * s, 0.4 * s, Math.cos(a) * 0.7 * s], null, pv, 6);
    B.ball(0.05 * s, '#f6f1e6', 'plastic', [Math.sin(a) * 0.7 * s, 0.68 * s, Math.cos(a) * 0.7 * s], null, pv, 10);
    B.gem(0.08 * s, gems[i % gems.length], [Math.sin(a) * 0.72 * s, 0.02 * s, Math.cos(a) * 0.72 * s], [PI / 2, a, 0], pv);
  }
  for (let i = 0; i < 4; i++) { const a = i / 4 * PI * 2; B.tor(0.62 * s, 0.03 * s, c, k, [0, 0.3 * s, 0], [0, a, 0], pv, PI).scale.set(1, 0.95, 1); for (let j = 1; j < 6; j++) { const b = j / 6 * PI; B.ball(0.025 * s, '#f6f1e6', 'plastic', [Math.cos(b) * 0.62 * s * Math.cos(a), 0.3 * s + Math.sin(b) * 0.59 * s, -Math.cos(b) * 0.62 * s * Math.sin(a)], null, pv, 6); } }
  B.ball(0.12 * s, c, k, [0, 0.95 * s, 0], null, pv, 16);
  B.tor(0.12 * s, 0.02 * s, '#fff1a8', 'gold', [0, 0.95 * s, 0], [PI / 2, 0, 0], pv);
  for (let i = 0; i < 2; i++) B.rbox([0.05 * s, 0.26 * s, 0.05 * s], c, k, [0, 1.15 * s, 0], [0, 0, i * PI / 2], pv, 0.015);
  B.gem(0.07 * s, gems[0], [0, 1.18 * s, 0.03 * s], [0, 0, 0], pv);
  if (p.halo) B.tor(1.0 * s, 0.035, p.halo, 'neonT', [0, 0.2 * s, 0], [PI / 2, 0, 0], pv);
  if (p.orbit) { const o = B.pivot([0, 0.2 * s, 0], null, pv); for (let i = 0; i < 9; i++) { const a = i / 9 * PI * 2; B.ball(0.07, '#fff6c8', 'neon', [Math.sin(a) * 1.3 * s, Math.sin(a * 2) * 0.15, Math.cos(a) * 1.3 * s], null, o, 8); B.glow(0.3, '#fff1a8', [Math.sin(a) * 1.3 * s, Math.sin(a * 2) * 0.15, Math.cos(a) * 1.3 * s], o, 0.6); } B.spin(o, 'y', -1.2); }
  B.spin(pv, 'y', 0.5); B.bob(pv, 0.06, 1.5);
  B.glow(2.2 * s, '#fff1a8', [0, 0.3 * s, 0], pv, 0.25);
  if (p.glow) B.sparkle(30, [2.2 * s, 1.8 * s, 2.2 * s], p.glow, [0, 0.4, 0.4 + 0.75 * s], 0.07, 0.4);
};

// ── Nr. 54, 82, 86: Reaktor mit Gehäuse, Rohren, Spulen, Anzeigen und Halterung ──
A.reactor = (B, p) => {
  const c = p.c || '#7fe7ff', s = p.size || 1, M = '#59606b';
  B.straps('#2a2f3a', 'leather', { metal: '#cfd6e0' });
  B.rbox([1.25, 1.55, 0.3], '#3a3f4a', 'metal', [0, -0.05, 0.16], null, null, 0.08);
  B.rbox([1.0, 1.3, 0.05], '#2a2f3a', 'metal', [0, -0.05, 0.33], null, null, 0.03);
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) B.ball(0.05, '#cfd6e0', 'metal', [sx * 0.52, -0.05 + sy * 0.65, 0.33], [1, 1, 0.6], null, 10);
  for (let i = 0; i < 2; i++) { const g = B.pivot([-0.3 + i * 0.6, -0.55, 0.37]); B.cyl(0.1, 0.1, 0.04, '#cfd6e0', 'metal', [0, 0, 0], [PI / 2, 0, 0], g, 18); B.cyl(0.085, 0.085, 0.045, '#f6f1e6', 'plastic', [0, 0, 0], [PI / 2, 0, 0], g, 18); const nd = B.pivot([0, 0, 0.03], null, g); B.box([0.012, 0.08, 0.01], '#c1121f', 'plastic', [0, 0.035, 0], null, nd); B.anims.push((t) => { nd.rotation.z = Math.sin(t * (1.3 + i)) * 0.8; }); }
  const zc = 0.95 * s;
  // Klammern (Halterung), die den Kern greifen
  for (let i = 0; i < 4; i++) { const a = i / 4 * PI * 2 + PI / 4; const cl = B.pivot([Math.cos(a) * 0.32, -0.05 + Math.sin(a) * 0.32, 0.35], [-Math.sin(a) * 0.5, Math.cos(a) * 0.5, 0]); B.rbox([0.1, 0.1, 0.55 * s], M, 'metal', [0, 0, 0.27 * s], null, cl, 0.03); B.cone(0.06, 0.15, '#cfd6e0', 'metal', [0, 0, 0.6 * s], [PI / 2, 0, 0], cl, 6); }
  // Rohre vom Rücken zum Kern
  for (const sx of [-1, 1]) { const pts = [[sx * 0.5, -0.6, 0.35], [sx * 0.75, -0.3, 0.6], [sx * 0.7, 0.2, 0.85], [sx * 0.45, 0.25, zc]].map(([x, y, z]) => new THREE.Vector3(x, y, z)); B.mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 30, 0.05, 8), '#9aa3ad', 'metal', [0, 0, 0]); for (let j = 0; j < 3; j++) { const q = new THREE.CatmullRomCurve3(pts).getPoint(0.2 + j * 0.3); B.tor(0.065, 0.015, BRASS, 'gold', [q.x, q.y, q.z], [PI / 2, 0, 0]); } }
  const pv = B.pivot([0, -0.05, zc]);
  const core = B.ball(0.38 * s, c, 'neon', [0, 0, 0], null, pv, 24);
  if (p.crust) for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2, b = (i % 3 - 1) * 0.6; B.rbox([0.26 * s, 0.26 * s, 0.06], '#3a2a24', 'stone', [Math.cos(a) * Math.cos(b) * 0.39 * s, Math.sin(b) * 0.39 * s, Math.sin(a) * Math.cos(b) * 0.39 * s], [0, -a + PI / 2, 0], pv, 0.03); }
  B.ball(0.55 * s, p.shell || c, 'glass', [0, 0, 0], null, pv, 24);
  for (let i = 0; i < 6; i++) B.tor(0.58 * s, 0.025, '#cfd6e0', 'metal', [0, (-0.35 + i * 0.14) * s, 0], [PI / 2, 0, 0], pv).scale.setScalar(Math.cos(((-0.35 + i * 0.14) / 0.58)) * 1.0);
  const rings = [[0, 0, 0], [PI / 2, 0, 0], [0, PI / 2, 0.6]].map((r, i) => { const rp = B.pivot([0, 0, 0], r, pv); B.tor(0.78 * s, 0.04 * s, i === 1 ? GOLD : '#d7dde6', i === 1 ? 'gold' : 'metal', [0, 0, 0], null, rp); B.ball(0.07, c, 'neon', [0.78 * s, 0, 0], null, rp, 8); B.glow(0.3, c, [0.78 * s, 0, 0], rp, 0.7); return rp; });
  rings.forEach((rp, i) => B.spin(rp, ['x', 'y', 'z'][i], 0.9 + i * 0.4));
  const arcs = [];
  for (let i = 0; i < 5; i++) { const a = B.pivot([0, 0, 0], [i, i * 1.7, i * 0.6], pv); for (let j = 0; j < 4; j++) B.box([0.02, 0.14, 0.02], '#ffffff', 'neon', [0.4 * s + j * 0.04, (j % 2 ? 0.05 : -0.05), 0], [0, 0, j % 2 ? 0.6 : -0.6], a); arcs.push(a); }
  B.anims.push((t) => arcs.forEach((a, i) => { a.visible = Math.sin(t * 9 + i * 2.3) > 0.3; a.rotation.y = t * (1 + i * 0.3); }));
  B.pulse(core, p.pulse || 0.07, p.pulse ? 5 : 3);
  B.glow(2.4 * s, c, [0, -0.05, zc], null, 0.55);
  B.glow(1.0 * s, '#ffffff', [0, -0.05, zc], null, 0.7);
  B.sparkle(p.sparks || 24, [1.8 * s, 1.8 * s, 1.8 * s], p.spark || c, [0, -0.05, zc], 0.08, p.pulse ? 1.2 : 0.5);
};

// ── Nr. 57 und 61: Umlaufbahn mit Runensteinen bzw. detaillierten Planeten (mehr Abstand) ──
A.orbit = ((orig) => (B, p) => {
  if (p.mode === 'vortex') return orig(B, p);
  backplate(B, '#3a3040', p.core || '#b77bff', 0.8, 0.8);
  B.glow(0.7, p.core || '#b77bff', [0, 0.3, 0.3], null, 0.8);
  const pv = B.pivot([0, 0, -0.5], [p.tilt || 0.25, 0, 0]);
  if (p.mode === 'runes') {
    const rp = B.pivot([0, 0.1, 0], null, pv);
    const shapes = [[[0, 0.1, 0, -0.1], [0, 0.1, 0.07, 0.03]], [[-0.05, 0.1, -0.05, -0.1], [-0.05, 0.1, 0.06, 0], [-0.05, 0, 0.06, -0.1]], [[0, 0.1, 0, -0.1], [-0.06, 0.05, 0.06, -0.05]], [[-0.06, 0.1, 0, -0.1], [0, -0.1, 0.06, 0.1]], [[0, 0.1, 0, -0.1], [0, 0, 0.07, 0.08], [0, 0, 0.07, -0.08]], [[-0.06, 0.1, 0.06, 0.1], [0, 0.1, 0, -0.1]], [[-0.06, -0.1, 0, 0.1], [0, 0.1, 0.06, -0.1], [-0.03, 0, 0.03, 0]]];
    for (let i = 0; i < 7; i++) {
      const a = i / 7 * PI * 2, g = B.pivot([Math.cos(a) * 2.2, Math.sin(i * 2) * 0.2, Math.sin(a) * 2.2], [0, -a + PI / 2, 0], rp);
      B.rbox([0.42, 0.56, 0.16], i % 2 ? '#4a4058' : '#5a5068', 'stone', [0, 0, 0], [0, 0, (i % 3 - 1) * 0.1], g, 0.06);
      for (const [x0, y0, x1, y1] of shapes[i]) { const d = Math.hypot(x1 - x0, y1 - y0); B.box([0.025, d * 1.8, 0.02], '#e2b8ff', 'neon', [(x0 + x1) * 0.9, (y0 + y1) * 0.9, 0.085], [0, 0, Math.atan2(y1 - y0, x1 - x0) - PI / 2], g); }
      B.glow(0.7, '#d9a8ff', [0, 0, 0.12], g, 0.6);
      B.tor(0.32, 0.015, GOLD, 'gold', [0, 0, 0], [PI / 2, 0, 0], g);
      B.bob(g, 0.06, 1.5 + i * 0.2);
    }
    B.spin(rp, 'y', 0.6);
    for (let i = 0; i < 3; i++) B.tor(2.2, 0.012, '#d9a8ff', 'neonT', [0, 0.1 + (i - 1) * 0.03, 0], [PI / 2, 0, 0], pv);
    B.sparkle(40, [4.6, 1.2, 4.6], '#e2c4ff', [0, 0.1, -0.5], 0.06, 0.2);
  } else {
    const rp = B.pivot([0, 0, 0], null, pv);
    const planets = [
      (g) => { B.ball(0.38, '#c1121f', 'plastic', [0, 0, 0], null, g, 24); for (let i = 0; i < 8; i++) B.box([0.03, 0.3, 0.02], '#ffb347', 'neon', [Math.cos(i) * 0.36, Math.sin(i * 1.7) * 0.2, Math.sin(i) * 0.36], [i, i * 0.6, 0], g); B.glow(1.2, '#ff5a1f', [0, 0, 0], g, 0.55); },
      (g) => { B.ball(0.38, '#1f6fd1', 'plastic', [0, 0, 0], null, g, 24); for (let i = 0; i < 6; i++) B.ball(0.12, '#ffffff', 'plastic', [Math.cos(i * 1.1) * 0.33, Math.sin(i * 2.1) * 0.18, Math.sin(i * 1.1) * 0.33], [1.6, 0.4, 1.2], g, 10); B.glow(1.1, '#5fb8ff', [0, 0, 0], g, 0.4); },
      (g) => { B.ball(0.36, '#4b8b3b', 'plastic', [0, 0, 0], null, g, 24); for (let i = 0; i < 7; i++) B.ball(0.12, '#8a6a3a', 'stone', [Math.cos(i * 1.4) * 0.3, Math.sin(i * 2.3) * 0.22, Math.sin(i * 1.4) * 0.3], [1.3, 0.5, 1.3], g, 10); const m = B.pivot([0, 0, 0], [0.3, 0, 0], g); B.ball(0.09, '#c0c6cf', 'stone', [0.6, 0, 0], null, m, 12); B.spin(m, 'y', 2); },
      (g) => { B.ball(0.34, '#e6f7ff', 'plastic', [0, 0, 0], null, g, 24); for (let i = 0; i < 3; i++) B.tor(0.36, 0.03, '#ffffff', 'neonT', [0, (i - 1) * 0.15, 0], [PI / 2, 0, 0], g).scale.setScalar(1 - Math.abs(i - 1) * 0.25); const r = B.tor(0.55, 0.04, '#cfe6ff', 'gold', [0, 0, 0], [PI / 2 - 0.4, 0, 0], g); r.scale.set(1, 1, 0.3); B.glow(1.0, '#ffffff', [0, 0, 0], g, 0.35); },
    ];
    planets.forEach((mk, i) => { const a = i / 4 * PI * 2; const g = B.pivot([Math.cos(a) * 2.5, 0.2, Math.sin(a) * 2.5], null, rp); mk(g); B.spin(g, 'y', 1.5); B.tor(0.5, 0.02, GOLD, 'gold', [0, -0.45, 0], [PI / 2, 0, 0], g); });
    B.spin(rp, 'y', 0.6);
    B.tor(2.5, 0.012, '#fff1a8', 'neonT', [0, 0.2, 0], [PI / 2, 0, 0], pv);
    B.sparkle(40, [5.2, 1.5, 5.2], '#fff1a8', [0, 0.2, -0.5], 0.06, 0.2);
  }
})(A.orbit);

// ── Nr. 59: Zauberstäbe mit Spiralen und Krallenfassung, verbessertes Unterteil ──
A.staffs = (B) => {
  B.straps('#3a2a40', 'leather', { metal: GOLD });
  B.lathe([[0.42, -0.55], [0.46, -0.45], [0.46, 0.15], [0.5, 0.22], [0.47, 0.25]], '#3a1f4a', 'leather', [0, -0.45, 0.42], null, null, 28, 'sholder').scale.set(1.2, 1, 0.75);
  for (const y of [-0.92, -0.55, -0.25]) B.tor(0.47, 0.03, GOLD, 'gold', [0, y, 0.42], [PI / 2, 0, 0]).scale.set(1.2, 0.75, 1);
  for (let i = 0; i < 5; i++) { const a = -0.8 + i * 0.4; B.gem(0.045, ['#ff5a1f', '#b77bff', '#2f9bff'][i % 3], [Math.sin(a) * 0.56, -0.55, 0.42 + Math.cos(a) * 0.36]); }
  B.emblem('star', [0, -0.72, 0.8], 0.55);
  for (const sx of [-1, 1]) { B.rbox([0.06, 0.3, 0.16], LEATHER, 'leather', [sx * 0.58, -0.6, 0.42], null, null, 0.02); B.buckle([sx * 0.61, -0.6, 0.42], 0.4, GOLD).rotation.y = PI / 2; }
  for (let i = 0; i < 5; i++) { const x = -0.4 + i * 0.2; const t = hanging(B, [x, -1.0, 0.72], 0.05, 2.2 + i * 0.2, 0.15); for (let j = 0; j < 4; j++) B.cyl(0.006, 0.006, 0.18, ['#ff5a1f', '#b77bff', '#2f9bff', GOLD][i % 4], 'cloth', [Math.cos(j) * 0.015, -0.1, Math.sin(j) * 0.015], null, t, 3); B.ball(0.025, GOLD, 'gold', [0, -0.01, 0], null, t, 6); }
  [[-0.45, '#ff5a1f'], [0, '#b77bff'], [0.45, '#2f9bff']].forEach(([r, c], i) => {
    const pv = B.pivot([0, -0.3, 0.42 + i * 0.04], [0, 0, r]);
    B.cyl(0.055, 0.065, 2.5, '#5a3a22', 'wood', [0, 0.55, 0], null, pv, 10);
    for (let j = 0; j < 14; j++) B.tor(0.065, 0.014, GOLD, 'gold', [0, 0.05 + j * 0.12, 0], [PI / 2 + 0.35, j * 0.5, 0], pv);
    const top = 1.85;
    for (let j = 0; j < 4; j++) { const a = j * PI / 2; const cl = B.pivot([Math.cos(a) * 0.06, top, Math.sin(a) * 0.06], [Math.sin(a) * -0.5, 0, Math.cos(a) * 0.5], pv); B.cone(0.03, 0.32, GOLD, 'gold', [0, 0.16, 0], null, cl, 6); }
    B.oct(0.17, c, 'gem', [0, top + 0.2, 0], [0.9, 1.3, 0.9], null, pv);
    const orb = B.ball(0.09, '#ffffff', 'neon', [0, top + 0.2, 0], null, pv, 12);
    B.glow(0.9, c, [0, top + 0.2, 0], pv, 0.75);
    B.pulse(orb, 0.2, 3 + i);
    const sp = B.pivot([0, top + 0.2, 0], null, pv);
    for (let j = 0; j < 3; j++) B.ball(0.025, c, 'neon', [Math.cos(j * 2.1) * 0.25, 0, Math.sin(j * 2.1) * 0.25], null, sp, 6);
    B.spin(sp, 'y', 2.5 + i);
  });
  B.sparkle(30, [2.4, 1.4, 1], '#e2c4ff', [0, 1.6, 0.5], 0.06, 0.4);
};
