A.crystal = (B, p) => {
  const c = p.c || '#bff6ff';
  B.straps('#59606b', 'metal');
  B.box([1.2, 0.3, 0.5], '#d7dde6', 'metal', [0, -0.95, 0.5]);
  const big = B.oct(0.85, c, 'gem', [0, 0.15, 0.85], [0.75, 1.45, 0.75]);
  B.ball(0.25, '#ffffff', 'neon', [0, 0.15, 0.85]);
  for (const [x, y, z, sc] of [[-0.75, -0.55, 0.7, 0.4], [0.7, -0.6, 0.75, 0.45], [-0.5, 0.7, 0.5, 0.3], [0.55, 0.55, 0.55, 0.32]]) B.oct(sc, c, 'gem', [x, y, z], [0.7, 1.5, 0.7], [0, 0, x * 0.4]);
  B.spin(big, 'y', 0.4);
  for (let i = 0; i < 6; i++) B.coin([Math.sin(i) * 0.3, -0.35 + i * 0.12, 0.85], [i, i * 2, 0], null, 0.5);
  B.sparkle(30, [2.2, 2.8, 1.6], '#e9fdff', [0, 0.1, 0.8]);
};

A.cannon = (B, p) => {
  const c = p.c || '#c1121f';
  B.straps('#3a3040', 'metal');
  B.box([1.3, 1.1, 0.4], '#59606b', 'metal', [0, -0.3, 0.3]);
  const barrels = p.multi ? [-0.45, 0, 0.45] : [0.15];
  const pv = B.pivot([0.15, 0.2, 0.7], [-0.55, 0, -0.25]);
  barrels.forEach((x, i) => {
    const bp = B.pivot([p.multi ? x : 0, 0, 0], null, pv);
    B.cyl(0.24, 0.34, 2.1, p.multi ? '#e7f6ff' : c, p.multi ? 'gem' : 'gem', [0, 0.6, 0], null, bp, 16);
    for (const y of [-0.3, 0.5, 1.3]) B.tor(0.32 - y * 0.03, 0.05, GOLD, 'gold', [0, y, 0], [PI / 2, 0, 0], bp);
    B.ball(0.2, p.multi ? '#bff6ff' : '#ff6b6b', 'neon', [0, 1.68, 0], null, bp);
  });
  B.ball(0.42, '#59606b', 'metal', [0, -0.3, 0], null, pv);
  if (p.multi) B.spin(pv, 'y', 2.2);
  B.sparkle(26, [1.2, 1.4, 1.2], p.multi ? '#e9fdff' : '#ff8a8a', [0.6, 1.4, 1.6], 0.1, 0.8);
};

A.obelisk = (B, p) => {
  const c = p.c || '#2453c7';
  const pv = B.pivot([0, 0.2, 1.7]);
  B.cyl(0.3, 0.48, 2.6, c, 'gem', [0, 0, 0], [0, PI / 4, 0], pv, 4);
  B.cone(0.34, 0.5, GOLD, 'gold', [0, 1.55, 0], [0, PI / 4, 0], pv, 4);
  for (let i = 0; i < 4; i++) { const a = i * PI / 2; B.box([0.06, 0.8, 0.02], '#9fd3ff', 'neon', [Math.sin(a) * 0.3, -0.2, Math.cos(a) * 0.3], [0, a, 0], pv); B.coin([Math.sin(a) * 0.36, 0.6, Math.cos(a) * 0.36], [PI / 2, 0, 0], pv, 0.45).rotation.set(PI / 2, 0, 0); }
  B.tor(0.8, 0.04, '#9fd3ff', 'neonT', [0, -1.6, 0], [PI / 2, 0, 0], pv);
  B.bob(pv, 0.14, 1.4); B.spin(pv, 'y', 0.5);
  B.sparkle(20, [1.5, 3, 1.5], '#9fd3ff', [0, 0.2, 1.7]);
};

A.bow = (B) => {
  B.box([0.18, 2.8, 0.06], LEATHER, 'cloth', [0, 0, 0.06], [0, 0, 0.75]);
  B.box([0.2, 0.08, 1.08], LEATHER, 'cloth', [0.55, 1.04, -0.5]);
  const pv = B.pivot([-0.15, 0.1, 0.45], [0, 0, 0.75]);
  B.tor(1.35, 0.07, '#2ec4b6', 'gem', [0, 0, 0], [0, 0, 0.3], pv, PI * 0.82);
  B.cyl(0.012, 0.012, 2.6, '#f2f2f2', 'neon', [0.25, 0.2, 0], [0, 0, 0], pv, 6).rotation.set(0, 0, 0.0);
  for (const [g, a] of [['#e63946', 0.3], ['#4cc9f0', 0.3 + PI * 0.82]]) B.oct(0.13, g, 'gem', [Math.cos(a) * 1.35, Math.sin(a) * 1.35, 0], null, null, pv);
  B.cyl(0.27, 0.23, 1.4, '#7a4a26', 'plastic', [0.5, -0.15, 0.62], [0, 0, -0.3]);
  B.tor(0.27, 0.04, GOLD, 'gold', [0.62, 0.35, 0.62], [PI / 2, 0, -0.3]);
  for (let i = 0; i < 4; i++) { B.cyl(0.02, 0.02, 0.6, '#d9c7a0', 'plastic', [0.66 + i * 0.05, 0.75, 0.55 + (i % 2) * 0.1], [0, 0, -0.3]); B.coin([0.75 + i * 0.05, 1.05, 0.55 + (i % 2) * 0.1], [0, 0, -0.3 + PI / 2], null, 0.4); }
  B.ball(0.12, '#ffe066', 'gem', [-0.15, 0.1, 0.55]);
};

A.tower = (B, p) => {
  const s = p.size || 1, c = p.c || '#5fe0b0', st = p.stone || '#cfd6e0';
  const pv = B.pivot([0, 0.35 * s, 1.9 * s]);
  B.cone(0.85 * s, 1 * s, '#6b5a4a', 'plastic', [0, -1.55 * s, 0], [PI, 0, 0], pv, 7);
  B.cyl(0.55 * s, 0.62 * s, 2.1 * s, st, 'plastic', [0, -0.05 * s, 0], null, pv, 12);
  for (let i = 0; i < 8; i++) { const a = i * PI / 4; B.box([0.22 * s, 0.25 * s, 0.22 * s], st, 'plastic', [Math.sin(a) * 0.52 * s, 1.12 * s, Math.cos(a) * 0.52 * s], [0, a, 0], pv); }
  B.cone(0.68 * s, 1 * s, c, p.roofK || 'gem', [0, 1.75 * s, 0], null, pv, 12);
  B.ball(0.1 * s, GOLD, 'gold', [0, 2.3 * s, 0], null, pv);
  for (const y of [-0.5, 0.3]) for (const a of [0, 1.6, 3.2, 4.8]) B.box([0.16 * s, 0.3 * s, 0.05], '#ffd77a', 'neon', [Math.sin(a) * 0.6 * s, y * s, Math.cos(a) * 0.6 * s], [0, a, 0], pv);
  if (p.overflow) { B.cone(0.45 * s, 0.4 * s, GOLD, 'gold', [0, 1.1 * s, 0], null, pv, 12); for (let i = 0; i < 10; i++) B.coin([Math.sin(i * 2) * 0.62 * s, 0.3 * s - i * 0.18 * s, Math.cos(i * 2) * 0.62 * s], [i, 0, 1], pv, 0.6 * s); }
  B.bob(pv, 0.1, 1.2);
  B.tor(0.5, 0.03, c, 'neonT', [0, 0.1, 0.4], [0, 0, 0]);
  B.sparkle(20, [2, 3.2, 2], p.glow || c, [0, 0.2, 1.9 * s]);
};

A.crown = (B, p) => {
  const s = p.size || 1, c = p.c || GOLD, k = p.k || 'gold', gems = p.gems || ['#e63946', '#4cc9f0', '#2ec4b6', '#b77bff'];
  const pv = B.pivot([0, 1.25 + 0.5 * s, 1.0 * s], [0.35, 0, 0]);
  B.cyl(0.75 * s, 0.7 * s, 0.35 * s, c, k, [0, 0, 0], null, pv, 32);
  const n = p.spikes || 8;
  for (let i = 0; i < n; i++) {
    const a = i / n * PI * 2;
    B.cone(0.14 * s, 0.55 * s, c, k, [Math.sin(a) * 0.72 * s, 0.42 * s, Math.cos(a) * 0.72 * s], null, pv, 4);
    B.ball(0.09 * s, gems[i % gems.length], 'gem', [Math.sin(a) * 0.72 * s, 0.75 * s, Math.cos(a) * 0.72 * s], null, pv);
    B.ball(0.08 * s, gems[(i + 1) % gems.length], 'gem', [Math.sin(a + 0.4) * 0.77 * s, 0, Math.cos(a + 0.4) * 0.77 * s], null, pv);
  }
  B.tor(0.74 * s, 0.05 * s, shade(GOLD, 0.2), 'gold', [0, -0.17 * s, 0], [PI / 2, 0, 0], pv);
  if (p.halo) B.tor(1.05 * s, 0.04, p.halo, 'neonT', [0, 0.2 * s, 0], [PI / 2, 0, 0], pv);
  if (p.orbit) { const o = B.pivot([0, 0.2 * s, 0], null, pv); for (let i = 0; i < 7; i++) { const a = i / 7 * PI * 2; B.ball(0.08, '#fff6c8', 'neon', [Math.sin(a) * 1.35 * s, Math.sin(a * 2) * 0.15, Math.cos(a) * 1.35 * s], null, o); } B.spin(o, 'y', -1.4); }
  B.spin(pv, 'y', 0.6); B.bob(pv, 0.08, 1.5);
  if (p.glow) B.sparkle(30, [2.4 * s, 1.8 * s, 2.4 * s], p.glow, [0, 1.5 + 0.5 * s, 1.0 * s]);
};

A.reactor = (B, p) => {
  const c = p.c || '#7fe7ff', s = p.size || 1;
  B.straps('#3a3f4a', 'metal');
  B.box([1.0, 1.4, 0.35], '#59606b', 'metal', [0, -0.1, 0.2]);
  for (const y of [-0.55, 0.35]) B.cyl(0.12, 0.12, 0.6, '#9aa3ad', 'metal', [0, y, 0.6], [PI / 2, 0, 0]);
  const pv = B.pivot([0, 0, 1.05 * s]);
  const core = B.ball(0.42 * s, c, 'neon', [0, 0, 0], null, pv);
  if (p.shell) B.ball(0.6 * s, p.shell, 'glass', [0, 0, 0], null, pv);
  const rings = [[0, 0, 0], [PI / 2, 0, 0], [0, PI / 2, 0.6]].map((r, i) => { const rp = B.pivot([0, 0, 0], r, pv); B.tor(0.78 * s, 0.05 * s, i === 1 ? GOLD : '#d7dde6', i === 1 ? 'gold' : 'metal', [0, 0, 0], null, rp); B.ball(0.08, c, 'neon', [0.78 * s, 0, 0], null, rp); return rp; });
  rings.forEach((rp, i) => B.spin(rp, ['x', 'y', 'z'][i], 0.9 + i * 0.4));
  B.pulse(core, p.pulse || 0.07, p.pulse ? 5 : 3);
  if (p.crust) for (let i = 0; i < 8; i++) B.box([0.3, 0.3, 0.06], '#3a2a24', 'plastic', [Math.sin(i) * 0.36, Math.cos(i * 1.3) * 0.3, 0.3 + (i % 2) * 0.05], [i, i * 0.5, 0], pv);
  B.sparkle(p.sparks || 24, [1.8 * s, 1.8 * s, 1.8 * s], p.spark || c, [0, 0, 1.05 * s], 0.1, p.pulse ? 1.2 : 0.5);
};

A.orbit = (B, p) => {
  const pv = B.pivot([0, 0, -0.5], [p.tilt || 0.25, 0, 0]);
  B.box([0.6, 0.4, 0.2], '#3a3040', 'metal', [0, 0.3, 0.1]);
  B.ball(0.14, p.core || '#b77bff', 'neon', [0, 0.3, 0.25]);
  if (p.mode === 'vortex') {
    for (let r = 0; r < 3; r++) { const rp = B.pivot([0, -0.8 + r * 0.8, 0], null, pv); const n = 12 + r * 3, R = 1.85 + r * 0.25; for (let i = 0; i < n; i++) { const a = i / n * PI * 2; B.coin([Math.cos(a) * R, Math.sin(i * 1.7) * 0.1, Math.sin(a) * R], [0.5, -a, 0.3], rp, 0.75); } B.spin(rp, 'y', 1.6 - r * 0.3); }
    B.sparkle(30, [3.5, 2.5, 3.5], '#e2c4ff', [0, 0, -0.5]);
  } else if (p.mode === 'runes') {
    const rp = B.pivot([0, 0.1, 0], null, pv);
    for (let i = 0; i < 7; i++) { const a = i / 7 * PI * 2; const g = B.pivot([Math.cos(a) * 2.1, Math.sin(i * 2) * 0.2, Math.sin(a) * 2.1], [0, -a, 0], rp); B.cyl(0.32, 0.32, 0.08, '#5b2a86', 'metal', [0, 0, 0], [0, 0, PI / 2], g, 6); B.box([0.04, 0.32, 0.18], '#d9a8ff', 'neon', [0.05, 0, 0], [0.5 * i, 0, 0], g); B.box([0.04, 0.05, 0.3], '#d9a8ff', 'neon', [0.05, 0.06, 0], null, g); }
    B.spin(rp, 'y', 0.8);
    B.tor(2.1, 0.02, '#d9a8ff', 'neonT', [0, 0.1, 0], [PI / 2, 0, 0], pv);
  } else if (p.mode === 'elements') {
    const els = [['#ff5a1f', '#ffb347'], ['#2f9bff', '#a8e1ff'], ['#4b8b3b', '#b5a26a'], ['#e6f7ff', '#ffffff']];
    const rp = B.pivot([0, 0, 0], null, pv);
    els.forEach(([c, c2], i) => { const a = i / 4 * PI * 2; const g = B.pivot([Math.cos(a) * 2.05, 0.2, Math.sin(a) * 2.05], null, rp); B.ball(0.32, c, i === 2 ? 'plastic' : 'neon', [0, 0, 0], null, g); B.ball(0.42, c2, 'glass', [0, 0, 0], null, g); B.tor(0.45, 0.025, GOLD, 'gold', [0, 0, 0], [PI / 2, 0, 0], g); B.spin(g, 'y', 2); });
    B.spin(rp, 'y', 0.7);
    B.sparkle(30, [3.6, 1.5, 3.6], '#fff1a8', [0, 0.2, -0.5]);
  }
};

A.arcSphere = (B) => {
  const pv = B.pivot([0, 0.35, 1.7]);
  B.ball(1.05, '#c9a3ff', 'glass', [0, 0, 0], null, pv);
  B.ball(0.25, '#e9d5ff', 'neon', [0, 0, 0], null, pv);
  const inner = B.pivot([0, 0, 0], null, pv);
  for (let i = 0; i < 14; i++) B.coin([Math.sin(i * 2.1) * 0.6, Math.cos(i * 1.3) * 0.5, Math.cos(i * 2.1) * 0.6], [i, i * 0.5, 0], inner, 0.55);
  B.spin(inner, 'y', 1.1);
  for (const [r, sp] of [[[1.2, 0, 0.3], 0.8], [[-0.4, 0.5, 1.2], -0.6]]) { const rp = B.pivot([0, 0, 0], r, pv); B.tor(1.25, 0.04, '#b77bff', 'neon', [0, 0, 0], null, rp); B.spin(rp, 'z', sp); }
  B.box([0.3, 0.3, 1.0], '#3a3040', 'metal', [0, 0.35, 0.55]);
  B.straps('#3a3040', 'metal');
  B.bob(pv, 0.08, 1.3);
};

A.staffs = (B) => {
  B.straps('#3a2a40');
  B.box([0.9, 0.35, 0.4], '#5b2a86', 'cloth', [0, -0.2, 0.3]);
  [[-0.5, '#ff5a1f'], [0, '#b77bff'], [0.5, '#2f9bff']].forEach(([r, c], i) => {
    const pv = B.pivot([0, -0.2, 0.42 + i * 0.05], [0, 0, r]);
    B.cyl(0.06, 0.07, 2.6, '#6b4a2a', 'plastic', [0, 0.5, 0], null, pv, 8);
    B.tor(0.13, 0.04, GOLD, 'gold', [0, 1.75, 0], [PI / 2, 0, 0], pv);
    const orb = B.ball(0.18, c, 'neon', [0, 1.95, 0], null, pv);
    B.ball(0.27, c, 'glass', [0, 1.95, 0], null, pv);
    B.pulse(orb, 0.15, 3 + i);
    for (let j = 0; j < 3; j++) B.coin([0, 1.0 - j * 0.3, 0.07], null, pv, 0.4);
  });
  B.sparkle(26, [2.4, 1.2, 1], '#e2c4ff', [0, 1.7, 0.5]);
};

A.bigRing = (B, p) => {
  const c = p.c || '#b77bff';
  B.straps('#3a3040', 'metal');
  B.box([0.4, 0.4, 0.9], '#3a3040', 'metal', [0, 0.3, 0.45]);
  if (p.saturn) {
    const pv = B.pivot([0, 0.35, 1.5]);
    B.ball(0.6, '#3d5a9e', 'plastic', [0, 0, 0], null, pv);
    B.ball(0.62, '#7fb0ff', 'glass', [0, 0, 0], null, pv);
    const rp = B.pivot([0, 0, 0], [1.2, 0, 0.3], pv);
    B.tor(1.2, 0.18, '#e8d29a', 'gold', [0, 0, 0], null, rp).scale.set(1, 1, 0.15);
    B.tor(1.55, 0.08, '#c9b07a', 'gold', [0, 0, 0], null, rp).scale.set(1, 1, 0.15);
    for (let i = 0; i < 24; i++) { const a = i / 24 * PI * 2; B.coin([Math.cos(a) * 1.85, Math.sin(a) * 1.85, 0], [0, 0, a], rp, 0.45); }
    B.spin(rp, 'z', 0.5);
    B.sparkle(40, [5, 4, 3], '#cfe1ff', [0, 0.3, 1.2], 0.07, 0.2);
    return;
  }
  const pv = B.pivot([0, 0.35, 1.0]);
  B.tor(1.9, 0.14, c, p.k || 'metal', [0, 0, 0], null, pv);
  B.tor(1.62, 0.04, GOLD, 'gold', [0, 0, 0], null, pv);
  for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; B.cyl(0.24, 0.24, 0.1, GOLD, 'gold', [Math.cos(a) * 1.9, Math.sin(a) * 1.9, 0.12], [PI / 2, 0, 0], pv, 6); B.box([0.04, 0.18, 0.02], '#e9d5ff', 'neon', [Math.cos(a) * 1.9, Math.sin(a) * 1.9, 0.18], [0, 0, a], pv); }
  B.spin(pv, 'z', 0.4);
  B.sparkle(26, [4, 4, 1], '#e2c4ff', [0, 0.35, 1]);
};

A.portal = (B) => {
  B.straps('#3a3040', 'metal');
  B.box([0.5, 0.5, 0.8], '#3a3040', 'metal', [0, 0.2, 0.45]);
  const pv = B.pivot([0, 0.4, 1.15]);
  B.tor(1.4, 0.18, '#59606b', 'metal', [0, 0, 0], null, pv);
  for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; B.oct(0.16, '#b77bff', 'gem', [Math.cos(a) * 1.4, Math.sin(a) * 1.4, 0.18], null, null, pv); }
  const disc = B.cyl(1.3, 1.3, 0.04, '#7b2cbf', 'neonT', [0, 0, 0], [PI / 2, 0, 0], pv, 40);
  const sw = B.pivot([0, 0, 0.05], null, pv);
  for (let i = 0; i < 18; i++) { const a = i * 0.7, r = 0.15 + i * 0.065; B.coin([Math.cos(a) * r, Math.sin(a) * r, 0], [PI / 2, 0, 0], sw, 0.55); }
  B.spin(sw, 'z', -2.2); B.pulse(disc, 0.03, 2);
  B.ball(0.2, '#ffffff', 'neon', [0, 0, 0.05], null, pv);
};

A.galaxy = (B) => {
  B.straps('#3a3040', 'metal');
  B.box([0.4, 0.4, 0.8], '#3a3040', 'metal', [0, 0.3, 0.4]);
  const pv = B.pivot([0, 0.5, 1.4], [0.5, 0, 0]);
  B.ball(0.25, '#fff1a8', 'neon', [0, 0, 0], null, pv);
  B.ball(0.45, '#ffcf4a', 'neonT', [0, 0, 0], null, pv);
  const cols = ['#b77bff', '#5fb8ff', '#ffcf4a', '#ff8fd1'];
  for (let arm = 0; arm < 3; arm++) for (let i = 0; i < 16; i++) {
    const a = arm * (PI * 2 / 3) + i * 0.28, r = 0.3 + i * 0.1;
    if (i % 3 === 0) B.coin([Math.cos(a) * r, Math.sin(a) * r, 0], [0, 0, 0], pv, 0.4).rotation.set(0, 0, a);
    else B.ball(0.04 + (16 - i) * 0.003, cols[(i + arm) % 4], 'neon', [Math.cos(a) * r, Math.sin(a) * r, (Math.random() - 0.5) * 0.1], null, pv);
  }
  pv.rotation.x = 0;
  B.spin(pv, 'z', 0.5);
  B.sparkle(50, [4, 4, 1.5], '#d9c8ff', [0, 0.5, 1.4], 0.06, 0.15);
};

A.clockwork = (B) => {
  B.straps('#4a3a22', 'metal');
  B.box([1.7, 1.9, 0.1], '#6e5a3a', 'metal', [0, -0.05, 0.1]);
  const gear = (r, teeth, p, sp, c) => { const g = B.pivot(p); B.cyl(r, r, 0.12, c, 'gold', [0, 0, 0], [PI / 2, 0, 0], g, 24); B.cyl(r * 0.3, r * 0.3, 0.16, '#3a3040', 'metal', [0, 0, 0], [PI / 2, 0, 0], g, 12); for (let i = 0; i < teeth; i++) { const a = i / teeth * PI * 2; B.box([0.12, 0.16, 0.12], c, 'gold', [Math.cos(a) * (r + 0.06), Math.sin(a) * (r + 0.06), 0], [0, 0, a], g); } for (let i = 0; i < 4; i++) B.box([r * 1.6, 0.05, 0.13], shade(c, -0.25), 'metal', [0, 0, 0.01], [0, 0, i * PI / 4], g); B.spin(g, 'z', sp); };
  gear(0.6, 14, [-0.35, 0.3, 0.3], 0.6, GOLD);
  gear(0.38, 10, [0.55, 0.65, 0.32], -0.95, '#cd8a4f');
  gear(0.45, 12, [0.45, -0.45, 0.3], -0.8, '#d7dde6');
  gear(0.28, 8, [-0.45, -0.7, 0.34], 1.3, '#cd8a4f');
  const pv = B.pivot([0, 1.25, 0.55]);
  B.cyl(0.42, 0.42, 0.1, '#f2ede4', 'plastic', [0, 0, 0], [PI / 2, 0, 0], pv, 32);
  B.tor(0.42, 0.05, GOLD, 'gold', [0, 0, 0], null, pv);
  const hand = B.pivot([0, 0, 0.07], null, pv); B.box([0.04, 0.3, 0.02], DARK, 'dark', [0, 0.13, 0], null, hand); B.spin(hand, 'z', -0.8);
  B.sparkle(16, [1.8, 2, 1], '#b9f2ff', [0, 0, 0.5], 0.07, 0.2);
};

A.throne = (B, p) => {
  const s = p.size || 1, c = p.c || GOLD, cu = p.cushion || '#7a1f2a';
  const pv = B.pivot([0, -0.1 * s, 0.9 * s]);
  B.box([1.6 * s, 0.25 * s, 1.0 * s], c, 'gold', [0, -0.6 * s, 0], null, pv);
  B.box([1.4 * s, 0.15 * s, 0.85 * s], cu, 'cloth', [0, -0.42 * s, 0.03], null, pv);
  B.box([1.6 * s, 2.2 * s, 0.2 * s], c, 'gold', [0, 0.55 * s, -0.4 * s], null, pv);
  B.box([1.3 * s, 1.7 * s, 0.06], cu, 'cloth', [0, 0.45 * s, -0.28 * s], null, pv);
  B.half(0.8 * s, 0.22 * s, c, 'gold', [0, 1.65 * s, -0.4 * s], [PI / 2, 0, 0], pv, PI / 2);
  for (const sx of [-1, 1]) { B.box([0.18 * s, 0.5 * s, 0.95 * s], c, 'gold', [sx * 0.8 * s, -0.28 * s, 0], null, pv); B.ball(0.14 * s, p.gem || '#e63946', 'gem', [sx * 0.8 * s, 0.02 * s, 0.42 * s], null, pv); B.box([0.18 * s, 0.6 * s, 0.18 * s], c, 'gold', [sx * 0.7 * s, -1.0 * s, 0.35 * s], null, pv); B.cone(0.12 * s, 0.6 * s, c, 'gold', [sx * 0.72 * s, 1.85 * s, -0.4 * s], null, pv, 6); }
  B.ball(0.22 * s, p.gem || '#e63946', 'gem', [0, 1.55 * s, -0.25 * s], null, pv);
  if (p.dragon) for (const sx of [-1, 1]) { B.box([0.3 * s, 0.26 * s, 0.4 * s], '#7a1f1f', 'plastic', [sx * 0.8 * s, 0.15 * s, 0.4 * s], null, pv); B.cone(0.05 * s, 0.3 * s, '#f2e6c8', 'plastic', [sx * 0.85 * s, 0.38 * s, 0.25 * s], [-0.6, 0, sx * 0.3], pv, 6); B.box([0.06, 0.05, 0.03], '#ffde4a', 'neon', [sx * 0.8 * s, 0.2 * s, 0.61 * s], null, pv); }
  if (p.ultimate) {
    B.tor(1.6 * s, 0.05, '#fff1a8', 'neon', [0, 0.6 * s, -0.55 * s], null, pv);
    const o = B.pivot([0, 0.2 * s, -0.4 * s], [0.3, 0, 0], pv);
    for (let i = 0; i < 16; i++) { const a = i / 16 * PI * 2; B.coin([Math.cos(a) * 2.2 * s, Math.sin(i * 3) * 0.2, Math.sin(a) * 2.2 * s], [0.4, -a, 0], o, 0.9); }
    B.spin(o, 'y', 0.6);
    B.ball(2.6 * s, '#ffe9a0', 'haze', [0, 0.3 * s, -0.4 * s], null, pv);
  }
  B.straps('#3a2a1c', 'metal');
  B.bob(pv, 0.05, 1.2);
  if (p.glow) B.sparkle(p.ultimate ? 70 : 30, [3.4 * s, 3.4 * s, 3 * s], p.glow, [0, 0.3, 0.9 * s]);
};

A.comet = (B) => {
  B.straps('#3a3f4a', 'metal');
  B.box([0.5, 0.5, 0.4], '#59606b', 'metal', [0, 0.4, 0.2]);
  const pv = B.pivot([0, 0.5, 0.5]);
  for (let i = 0; i < 16; i++) { const t = i / 15; B.ball(0.42 * (1 - t * 0.8), t < 0.3 ? '#fff6c8' : t < 0.65 ? GOLD : '#ff9a2e', i < 3 ? 'neon' : 'neonT', [Math.sin(t * 3) * 0.4 * t, 0.2 + t * 2.4, 0.2 + t * 2.6], null, pv); }
  B.anims.push((t) => { pv.rotation.z = Math.sin(t * 1.4) * 0.12; pv.rotation.x = Math.sin(t * 1.1) * 0.06; });
  B.sparkle(40, [1.5, 3, 3], '#ffe08a', [0, 1.7, 1.8], 0.08, 0.9);
};

A.blackhole = (B) => {
  B.straps('#1a1420', 'metal');
  B.box([0.4, 0.4, 1.0], '#2a2230', 'metal', [0, 0.3, 0.5]);
  const pv = B.pivot([0, 0.4, 1.7], [0.6, 0, 0.2]);
  B.ball(0.55, '#000000', 'dark', [0, 0, 0], null, pv);
  B.tor(0.62, 0.03, '#ffffff', 'neon', [0, 0, 0], [-0.6, 0, 0], pv);
  const d1 = B.tor(1.05, 0.28, '#ff7a1a', 'neonT', [0, 0, 0], [PI / 2, 0, 0], pv); d1.scale.set(1, 1, 0.12);
  const d2 = B.tor(1.5, 0.15, '#ffcf4a', 'neonT', [0, 0, 0], [PI / 2, 0, 0], pv); d2.scale.set(1, 1, 0.1);
  const o = B.pivot([0, 0, 0], null, pv);
  for (let i = 0; i < 14; i++) { const a = i * 0.9, r = 0.8 + i * 0.09; B.coin([Math.cos(a) * r, (Math.random() - 0.5) * 0.15, Math.sin(a) * r], [0.3, a, 0], o, 0.55); }
  B.spin(o, 'y', 2.4);
  B.sparkle(30, [4, 1.5, 4], '#ffb36b', [0, 0.4, 1.7], 0.06, 0.15);
};

A.sunwheel = (B) => {
  B.straps('#4a3a22', 'metal');
  B.box([0.5, 0.5, 0.7], '#6e5a3a', 'metal', [0, 0.3, 0.35]);
  const pv = B.pivot([0, 0.4, 1.0]);
  B.tor(1.3, 0.13, GOLD, 'gold', [0, 0, 0], null, pv);
  B.tor(0.55, 0.08, GOLD, 'gold', [0, 0, 0], null, pv);
  B.ball(0.35, '#fff1a8', 'neon', [0, 0, 0], null, pv);
  for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; B.box([0.75, 0.08, 0.08], GOLD, 'gold', [Math.cos(a) * 0.92, Math.sin(a) * 0.92, 0], [0, 0, a], pv); }
  for (let i = 0; i < 16; i++) { const a = i / 16 * PI * 2; B.cone(0.13, i % 2 ? 0.45 : 0.75, i % 2 ? '#ff9a2e' : '#ffe066', 'neon', [Math.cos(a) * (1.55 + (i % 2 ? 0 : 0.15)), Math.sin(a) * (1.55 + (i % 2 ? 0 : 0.15)), 0], [0, 0, a - PI / 2], pv, 4); }
  B.spin(pv, 'z', 0.35);
  B.sparkle(30, [4, 4, 1], '#ffe9a0', [0, 0.4, 1.0], 0.08, 0.3);
};

A.citadel = (B) => {
  const pv = B.pivot([0, 1.7, 1.5]);
  B.cone(1.4, 1.3, '#4a4058', 'plastic', [0, -0.9, 0], [PI, 0, 0], pv, 8);
  B.cyl(1.4, 1.4, 0.25, '#6b6078', 'plastic', [0, -0.15, 0], null, pv, 8);
  for (const [x, z, h, r] of [[0, 0, 2.0, 0.38], [-0.8, 0.4, 1.3, 0.26], [0.8, 0.4, 1.4, 0.26], [-0.6, -0.6, 1.1, 0.22], [0.6, -0.6, 1.2, 0.22]]) {
    B.cyl(r, r * 1.05, h, '#d7dde6', 'plastic', [x, h / 2, z], null, pv, 10);
    B.cone(r * 1.3, h * 0.45, '#5fb8ff', 'gem', [x, h + h * 0.22, z], null, pv, 10);
    B.box([0.1, 0.18, 0.04], '#ffe9a0', 'neon', [x, h * 0.65, z + r + 0.01], null, pv);
  }
  B.box([1.6, 0.4, 0.12], '#cfd6e0', 'plastic', [0, 0.2, 0.55], null, pv);
  B.tor(1.7, 0.03, '#9fd3ff', 'neonT', [0, -0.1, 0], [PI / 2, 0, 0], pv);
  for (let i = 0; i < 8; i++) B.coin([Math.sin(i) * 1.1, -0.9 - i * 0.12, Math.cos(i) * 0.5], [i, 0, 1], pv, 0.6);
  B.bob(pv, 0.12, 1);
  B.tor(0.55, 0.04, '#9fd3ff', 'neon', [0, 0.4, 0.3], null);
  B.sparkle(40, [4, 3.5, 3], '#cfe9ff', [0, 1.6, 1.5], 0.07, 0.3);
};

A.halo = (B) => {
  B.straps('#e8dcae', 'metal');
  const pv = B.pivot([0, 2.35, -0.5]);
  B.tor(0.75, 0.08, '#fff1a8', 'neon', [0, 0, 0], [PI / 2, 0, 0], pv);
  B.tor(0.95, 0.03, '#ffe08a', 'neonT', [0, 0, 0], [PI / 2, 0, 0], pv);
  const o = B.pivot([0, 0, 0], null, pv);
  for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; B.coin([Math.cos(a) * 0.75, 0.1, Math.sin(a) * 0.75], [0, -a, 0], o, 0.45); }
  B.spin(o, 'y', 1.2); B.bob(pv, 0.05, 2);
  const disc = B.pivot([0, 1.6, 0.35]);
  for (let i = 0; i < 24; i++) { const a = i / 24 * PI * 2; B.box([0.06, i % 2 ? 0.6 : 0.95, 0.03], '#fff1a8', 'neonT', [Math.cos(a) * 0.95, Math.sin(a) * 0.95, 0], [0, 0, a - PI / 2], disc); }
  B.tor(0.7, 0.05, '#ffe08a', 'neon', [0, 0, 0], null, disc);
  B.spin(disc, 'z', 0.25);
  B.sparkle(30, [2, 2.2, 1.5], '#fff6c8', [0, 1.6, 0], 0.08, 0.4);
};

A.columns = (B) => {
  B.straps('#d7dde6', 'metal');
  B.box([2.3, 0.25, 0.8], '#f2ede4', 'plastic', [0, -1.05, 0.65]);
  B.box([2.5, 0.3, 0.9], '#f2ede4', 'plastic', [0, 1.6, 0.65]);
  B.cone(1.35, 0.5, '#f2ede4', 'plastic', [0, 2.0, 0.65], [0, PI / 4, 0], null, 4).scale.set(1, 1, 0.4);
  for (const x of [-0.95, -0.32, 0.32, 0.95]) { B.cyl(0.17, 0.2, 2.4, '#f6f1e6', 'plastic', [x, 0.28, 0.65], null, null, 12); B.box([0.48, 0.12, 0.48], GOLD, 'gold', [x, 1.45, 0.65]); B.box([0.48, 0.1, 0.48], GOLD, 'gold', [x, -0.88, 0.65]); }
  const bolts = [];
  for (const x of [-0.64, 0.64]) { const g = B.pivot([x, 0.3, 0.75]); for (let i = 0; i < 5; i++) B.box([0.06, 0.5, 0.04], '#fff1a8', 'neon', [(i % 2 ? 0.1 : -0.1), 0.9 - i * 0.42, 0], [0, 0, i % 2 ? 0.5 : -0.5], g); bolts.push(g); }
  bolts.forEach((g, i) => B.anims.push((t) => { g.visible = Math.sin(t * 7 + i * 2) > -0.3; }));
  B.coin([0, 1.62, 1.12], null, null, 1);
  B.sparkle(30, [3, 3, 1.5], '#fff6c8', [0, 0.3, 0.7], 0.08, 0.6);
};

A.stream = (B, p) => {
  const cols = p.cols || [GOLD];
  B.straps('#3a3040', 'metal');
  B.box([0.5, 0.5, 0.5], '#3a3040', 'metal', [0, -0.5, 0.3]);
  const N = p.n || 34, H = p.h || 5;
  const path = (u) => { const a = u * PI * (p.turns || 2.2); const r = 0.5 + u * 1.2; return [Math.cos(a) * r, -0.4 + u * H, 0.9 + Math.sin(a) * r * 0.6]; };
  const items = [];
  for (let i = 0; i < N; i++) items.push(i % 4 === 3 ? B.ball(0.08, cols[i % cols.length], 'neon', [0, 0, 0]) : B.coin([0, 0, 0], [PI / 2, 0, 0], null, 0.7, cols[i % cols.length]));
  const glow = [];
  for (let i = 0; i < 10; i++) glow.push(B.ball(0.25 - i * 0.012, p.glow || '#ffe08a', 'neonT', [0, 0, 0]));
  B.anims.push((t) => {
    items.forEach((m, i) => { const u = ((i / N) + t * 0.08) % 1; const [x, y, z] = path(u); m.position.set(x, y, z); m.rotation.y = t * 3 + i; });
    glow.forEach((m, i) => { const [x, y, z] = path(i / 10); m.position.set(x, y, z); });
  });
  B.sparkle(40, [3, H, 3], p.glow || '#ffe08a', [0, H / 2 - 0.4, 1], 0.08, 1.2);
};

A.hoard = (B) => {
  const pv = B.pivot([0, 0.3, 1.5]);
  const pile = B.cone(1.15, 1.3, GOLD, 'gold', [0, -0.2, 0], null, pv, 16);
  B.cone(1.15, 0.5, GOLD, 'gold', [0, -1.1, 0], [PI, 0, 0], pv, 16);
  for (let i = 0; i < 26; i++) { const a = i * 2.4, h = Math.random(); B.coin([Math.cos(a) * (1.1 - h * 0.9), -0.85 + h * 1.25, Math.sin(a) * (1.1 - h * 0.9)], [Math.random() * 3, a, 0.5], pv, 0.7); }
  for (const [g, x, y] of [['#e63946', 0.4, -0.2], ['#4cc9f0', -0.5, -0.4], ['#2ec4b6', 0.1, 0.3]]) B.oct(0.14, g, 'gem', [x, y, 0.5], null, null, pv);
  B.pulse(pile, 0.04, 1.2);
  B.spin(pv, 'y', 0.3); B.bob(pv, 0.1, 1.1);
  B.tor(1.3, 0.03, '#ffe08a', 'neonT', [0, -0.9, 0], [PI / 2, 0, 0], pv);
  B.box([0.4, 0.4, 0.9], '#6e5a3a', 'metal', [0, 0.3, 0.45]);
  B.straps('#4a3a22', 'metal');
  B.sparkle(40, [3, 3, 3], '#ffe08a', [0, 0.3, 1.5], 0.08, 0.5);
};

A.primal = (B) => {
  B.straps('#4a3a22', 'metal');
  B.box([0.5, 0.5, 0.6], '#6e5a3a', 'metal', [0, 0.3, 0.3]);
  const pv = B.pivot([0, 0.4, 1.3]);
  B.cyl(1.15, 1.15, 0.2, '#e0a92e', 'gold', [0, 0, 0], [PI / 2, 0, 0], pv, 40);
  B.tor(1.1, 0.07, GOLD, 'gold', [0, 0, 0.1], null, pv);
  B.tor(1.1, 0.07, GOLD, 'gold', [0, 0, -0.1], null, pv);
  B.tor(0.75, 0.04, '#fff1a8', 'neon', [0, 0, 0.11], null, pv);
  B.tor(0.75, 0.04, '#fff1a8', 'neon', [0, 0, -0.11], null, pv);
  B.emblem('star', [0, 0, 0.12], 2.6, pv);
  B.ball(1.45, '#ffe08a', 'haze', [0, 0, 0], [1, 1, 0.3], pv);
  B.spin(pv, 'y', 0.6);
  B.sparkle(40, [3, 3, 2], '#fff1a8', [0, 0.4, 1.3]);
};

A.anvil = (B) => {
  B.straps('#3a3f4a', 'metal');
  const pv = B.pivot([0, -0.1, 1.0]);
  const I = '#4a4f5a';
  B.box([1.0, 0.25, 0.7], I, 'metal', [0, -0.85, 0], null, pv);
  B.box([0.5, 0.55, 0.45], I, 'metal', [0, -0.45, 0], null, pv);
  B.box([1.5, 0.35, 0.6], shade(I, 0.15), 'metal', [0.05, 0.0, 0], null, pv);
  B.cone(0.3, 0.8, shade(I, 0.15), 'metal', [-1.05, 0.02, 0], [0, 0, PI / 2], pv, 12).scale.set(1, 1, 0.75);
  B.box([0.4, 0.04, 0.4], GOLD, 'gold', [0.25, 0.19, 0], null, pv);
  const glow = B.coin([0.25, 0.25, 0], [0, 0, 0], pv, 1.1, '#ffd23f');
  B.ball(0.15, '#ffffff', 'neon', [0.25, 0.3, 0], null, pv);
  const h = B.pivot([0.85, 1.0, 0.1], null, pv);
  B.cyl(0.06, 0.06, 1.1, '#7a5a3a', 'plastic', [0, 0, 0], [0, 0, 0.6], h, 8);
  B.box([0.45, 0.22, 0.25], '#d7dde6', 'metal', [-0.33, 0.43, 0], [0, 0, 0.6], h);
  B.anims.push((t) => { h.rotation.z = -Math.max(0, Math.sin(t * 3)) * 0.6; });
  B.pulse(glow, 0.06, 6);
  B.sparkle(40, [1.6, 1.4, 1.2], '#ffb347', [0.25, 0.7, 1.0], 0.09, 1.4);
};

A.aura = (B) => {
  const pv = B.pivot([0, 0.6, -0.5]);
  B.ball(2.3, '#ffe08a', 'haze', [0, 0, 0], [1, 1.25, 1], pv);
  B.ball(1.7, '#fff1a8', 'haze', [0, 0, 0], [1, 1.25, 1], pv);
  const rays = B.pivot([0, 0, 0], null, pv);
  for (let i = 0; i < 20; i++) { const a = i / 20 * PI * 2; B.box([0.06, 1.2, 0.04], '#fff1a8', 'neonT', [Math.cos(a) * 2.6, Math.sin(a) * 2.6, 0.9], [0, 0, a - PI / 2], rays); }
  B.spin(rays, 'z', 0.3);
  for (let r = 0; r < 3; r++) { const o = B.pivot([0, -1.4 + r * 1.3, 0], [0.2 * (r - 1), 0, 0], pv); for (let i = 0; i < 10; i++) { const a = i / 10 * PI * 2; B.coin([Math.cos(a) * (1.9 - Math.abs(r - 1) * 0.4), 0, Math.sin(a) * (1.9 - Math.abs(r - 1) * 0.4)], [0.5, -a, 0], o, 0.7); } B.spin(o, 'y', r % 2 ? -1 : 1); }
  B.sparkle(80, [5, 6, 5], '#fff1a8', [0, 0.5, -0.5], 0.09, 0.9);
};

