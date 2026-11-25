// ── Befragung, Runde 2: Nr. 61 bis 99 ──

// ── Nr. 62 und 79: schwebender Ring ohne Halterung, näher am Rücken ──
A.bigRing = (B, p) => {
  const c = p.c || '#5b2a86';
  if (p.saturn) {
    const pv = B.pivot([0, 0.35, 1.15]);
    B.ball(0.6, '#3d5a9e', 'plastic', [0, 0, 0], null, pv, 32);
    for (let i = 0; i < 5; i++) B.tor(0.6 * Math.cos((i - 2) * 0.3), 0.03, ['#5a7ac4', '#2a4a8e', '#7fa0e0', '#2a4a8e', '#5a7ac4'][i], 'plastic', [0, (i - 2) * 0.18, 0], [PI / 2, 0, 0], pv);
    B.ball(0.63, '#7fb0ff', 'glass', [0, 0, 0], null, pv, 24);
    const rp = B.pivot([0, 0, 0], [1.2, 0, 0.3], pv);
    B.tor(1.05, 0.16, '#e8d29a', 'gold', [0, 0, 0], null, rp).scale.set(1, 1, 0.12);
    B.tor(1.38, 0.09, '#c9b07a', 'gold', [0, 0, 0], null, rp).scale.set(1, 1, 0.12);
    for (let i = 0; i < 26; i++) { const a = i / 26 * PI * 2; B.coin([Math.cos(a) * 1.65, Math.sin(a) * 1.65, 0], [0, 0, a], rp, 0.42); }
    B.spin(rp, 'z', 0.5); B.bob(pv, 0.06, 1.2);
    const moon = B.pivot([0, 0, 0], [0.4, 0, 0], pv); B.ball(0.12, '#c0c6cf', 'stone', [2.0, 0, 0], null, moon, 12); B.spin(moon, 'y', 0.8);
    B.glow(2.8, '#7fb0ff', [0, 0.35, 1.15], null, 0.3);
    B.sparkle(40, [4.4, 3.4, 2.4], '#cfe1ff', [0, 0.35, 1.0], 0.06, 0.2);
    return;
  }
  const pv = B.pivot([0, 0.35, 0.75]);
  const ring = B.pivot([0, 0, 0], null, pv);
  B.tor(1.7, 0.13, c, p.k || 'metal', [0, 0, 0], null, ring);
  B.tor(1.52, 0.04, GOLD, 'gold', [0, 0, 0.06], null, ring);
  B.tor(1.88, 0.04, GOLD, 'gold', [0, 0, 0.06], null, ring);
  for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; B.rbox([0.26, 0.3, 0.1], GOLD, 'gold', [Math.cos(a) * 1.7, Math.sin(a) * 1.7, 0.1], [0, 0, a], ring, 0.04); B.box([0.03, 0.16, 0.02], '#e9d5ff', 'neon', [Math.cos(a) * 1.7, Math.sin(a) * 1.7, 0.16], [0, 0, a + (i % 2) * 0.6], ring); }
  for (let i = 0; i < 24; i++) { const a = (i + 0.5) / 24 * PI * 2; B.cone(0.05, 0.24, GOLD, 'gold', [Math.cos(a) * 1.95, Math.sin(a) * 1.95, 0], [0, 0, a - PI / 2], ring, 4); }
  for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2 + 0.26; B.gem(0.1, '#b77bff', [Math.cos(a) * 1.52, Math.sin(a) * 1.52, 0.1], null, ring); }
  B.spin(ring, 'z', 0.35);
  const inner = B.pivot([0, 0, -0.05], null, pv);
  B.tor(1.2, 0.03, '#d9a8ff', 'neon', [0, 0, 0], null, inner);
  for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; B.coin([Math.cos(a) * 1.2, Math.sin(a) * 1.2, 0], [PI / 2, 0, 0], inner, 0.5); }
  B.spin(inner, 'z', -0.7);
  B.bob(pv, 0.05, 1.3);
  B.glow(4.0, '#b77bff', [0, 0.35, 0.75], null, 0.18);
  B.sparkle(30, [4, 4, 1], '#e2c4ff', [0, 0.35, 0.75], 0.06, 0.3);
};

// ── Nr. 63: Portal ohne Halterung, näher am Rücken ──
A.portal = (B) => {
  const pv = B.pivot([0, 0.4, 0.8]);
  for (let i = 0; i < 18; i++) { const a = i / 18 * PI * 2; B.rbox([0.2, 0.38, 0.32], i % 2 ? '#4a4f5a' : '#5a606b', 'stone', [Math.cos(a) * 1.4, Math.sin(a) * 1.4, 0], [0, 0, a], pv, 0.05); if (i % 3 === 0) B.box([0.12, 0.03, 0.02], '#d9a8ff', 'neon', [Math.cos(a) * 1.4, Math.sin(a) * 1.4, 0.17], [0, 0, a], pv); }
  B.rbox([0.4, 0.4, 0.36], '#5a606b', 'stone', [0, 1.6, 0], [0, 0, PI / 4], pv, 0.06);
  B.gem(0.14, '#b77bff', [0, 1.6, 0.2], [0, 0, 0], pv);
  for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2 + 0.2; B.oct(0.14, '#b77bff', 'gem', [Math.cos(a) * 1.4, Math.sin(a) * 1.4, 0.2], null, null, pv); }
  const disc = B.cyl(1.25, 1.25, 0.04, '#7b2cbf', 'neonT', [0, 0, 0], [PI / 2, 0, 0], pv, 48);
  for (let l = 0; l < 3; l++) { const sw = B.pivot([0, 0, 0.03 + l * 0.02], null, pv); for (let i = 0; i < 14; i++) { const a = i * 0.75 + l, r = 0.15 + i * 0.075; if (l === 0) B.coin([Math.cos(a) * r, Math.sin(a) * r, 0], [PI / 2, 0, 0], sw, 0.5); else B.ball(0.04, l === 1 ? '#e2c4ff' : '#ffffff', 'neon', [Math.cos(a) * r, Math.sin(a) * r, 0], null, sw, 6); } B.spin(sw, 'z', -(1.6 + l * 0.8)); }
  B.pulse(disc, 0.03, 2);
  B.glow(1.2, '#ffffff', [0, 0, 0.1], pv, 0.6);
  B.glow(3.4, '#9d4edd', [0, 0, 0.05], pv, 0.45);
  B.bob(pv, 0.05, 1.1);
  B.sparkle(40, [2.8, 2.8, 0.8], '#e2c4ff', [0, 0.4, 0.9], 0.07, 0.4);
};

// ── Nr. 65: Galaxie ohne Halterung, näher, mit Sternenarmen ──
A.galaxy = (B) => {
  const pv = B.pivot([0, 0.45, 0.95], [0.35, 0, 0]);
  const n = 900, pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
  const palette = ['#b77bff', '#5fb8ff', '#ffcf4a', '#ff8fd1', '#ffffff'].map((h) => new THREE.Color(h).convertSRGBToLinear());
  for (let i = 0; i < n; i++) {
    const arm = i % 3, t = Math.pow(Math.random(), 0.7), a = arm * (PI * 2 / 3) + t * 4.2 + (Math.random() - 0.5) * 0.5 * (1 - t * 0.5), r = 0.12 + t * 1.55;
    pos.set([Math.cos(a) * r + (Math.random() - 0.5) * 0.08, Math.sin(a) * r + (Math.random() - 0.5) * 0.08, (Math.random() - 0.5) * 0.12 * (1 - t)], i * 3);
    const c = t < 0.2 ? palette[2] : t < 0.4 ? palette[4] : palette[(i * 7) % 5 === 2 ? 3 : arm % 2];
    col.set([c.r, c.g, c.b], i * 3);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.13, vertexColors: true, map: texture('glow'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  pv.add(pts);
  B.ball(0.18, '#fff1a8', 'neon', [0, 0, 0], null, pv, 16);
  B.glow(1.5, '#ffcf4a', [0, 0, 0], pv, 0.8);
  B.glow(3.8, '#b77bff', [0, 0, 0], pv, 0.25);
  for (let arm = 0; arm < 3; arm++) for (let i = 0; i < 5; i++) { const t = 0.25 + i * 0.17, a = arm * (PI * 2 / 3) + t * 4.2, r = 0.12 + t * 1.55; B.coin([Math.cos(a) * r, Math.sin(a) * r, 0.02], [PI / 2, 0, 0], pv, 0.35 + (1 - t) * 0.2); }
  B.spin(pv, 'z', 0.35);
  B.sparkle(40, [4, 4, 1.5], '#d9c8ff', [0, 0.45, 0.95], 0.05, 0.12);
};

// ── Nr. 67: kleinerer Drache auf einem schöneren Münzberg ──
const creature2 = A.creature;
A.creature = (B, p) => {
  if (p.kind === 'dragonHoard') {
    B.straps('#3a2a1c', 'leather');
    B.lathe([[0, -0.4], [0.72, -0.4], [0.92, 0.0], [0.97, 0.32], [0.9, 0.32], [0.86, 0.0], [0.68, -0.33], [0, -0.33]], '#6e4426', 'wood', [0, -0.75, 0.72], null, null, 28, 'basket');
    for (let i = 0; i < 16; i++) { const a = i / 16 * PI * 2; B.box([0.03, 0.66, 0.03], '#4a2a16', 'wood', [Math.sin(a) * 0.86, -0.75, 0.72 + Math.cos(a) * 0.86], [Math.cos(a) * -0.25, 0, Math.sin(a) * 0.25]); }
    B.tor(0.96, 0.06, GOLD, 'gold', [0, -0.43, 0.72], [PI / 2, 0, 0]);
    B.lathe([[0, 0.55], [0.18, 0.5], [0.42, 0.32], [0.68, 0.12], [0.9, 0.0], [0.9, -0.05], [0, -0.05]], GOLD, 'gold', [0, -0.42, 0.72], null, null, 24, 'pile');
    for (let i = 0; i < 40; i++) { const t = (i * 0.618) % 1, a = i * 2.4, r = 0.85 * (1 - t), y = -0.4 + t * 0.55; B.coin([Math.cos(a) * r, y, 0.72 + Math.sin(a) * r], [PI / 2 + Math.sin(i) * 0.5, a, 0.3], null, 0.55, i % 9 === 0 ? '#e8ecf2' : GOLD); }
    for (const [g, x, y, z] of [['#e63946', -0.45, -0.2, 1.25], ['#4cc9f0', 0.42, -0.25, 1.2], ['#2ec4b6', 0.1, -0.05, 1.3], ['#b77bff', -0.2, 0.0, 0.95]]) B.gem(0.1, g, [x, y, z], [0.4, 0.3, 0]);
    B.lathe([[0, 0], [0.1, 0], [0.12, 0.1], [0.08, 0.2], [0.1, 0.28], [0, 0.28]], GOLD, 'gold', [0.55, -0.25, 0.9], [0, 0, -0.3], null, 16, 'goblet');
    B.cone(0.15, 0.3, GOLD, 'gold', [-0.55, -0.15, 0.7], [0, 0, 0.4], null, 5);
    B.glow(2.0, '#ffe08a', [0, -0.05, 0.8], null, 0.35);
    const d = dragon(B, [0, 0.18, 0.72], 0.6, '#c0392b', '#f4a261');
    B.anims.push((t) => { d.rotation.y = Math.sin(t * 0.8) * 0.3; });
    B.sparkle(20, [1.8, 1.2, 1.4], '#ffe08a', [0, 0, 0.8], 0.05, 0.3);
    return;
  }
  if (p.kind === 'griffin2') {
    // Greif als Rucksack: sitzt mittig auf dem Rücken, Flügel schlagen
    const T = '#b98a4e';
    B.straps('#5a3a22', 'leather', { metal: GOLD });
    B.rbox([1.1, 0.16, 0.6], '#5a3a22', 'leather', [0, -0.7, 0.3], null, null, 0.05);
    B.rbox([1.15, 0.06, 0.64], '#7a1f2a', 'cloth', [0, -0.62, 0.3], null, null, 0.02);
    const pv = B.pivot([0, 0.0, 0.62]);
    B.ball(0.55, T, 'plastic', [0, 0, 0], [0.9, 1.15, 0.85], pv, 28);
    for (let r = 0; r < 4; r++) for (let i = 0; i < 6; i++) { const a = -0.9 + i * 0.36; B.feather(0.24, 0.18, r % 2 ? shade(T, -0.1) : T, 'plastic', [Math.sin(a) * 0.45, 0.35 - r * 0.22, 0.25 + Math.cos(a) * 0.2], -PI / 2 + a * 0.3, pv, i % 2 ? 1 : -1); }
    const head = B.pivot([0, 0.78, 0.15], null, pv);
    B.ball(0.32, WHITE, 'plastic', [0, 0, 0], null, head, 24);
    for (let i = 0; i < 8; i++) B.feather(0.25, 0.14, i % 2 ? WHITE : '#ece6d8', 'plastic', [Math.sin(i) * 0.1, 0.15, -0.15], 1.6 + (i - 4) * 0.12, head, i % 2 ? 1 : -1);
    B.cone(0.11, 0.32, GOLD, 'gold', [0, -0.04, 0.36], [PI / 2 + 0.35, 0, 0], head, 10);
    B.cone(0.06, 0.12, shade(GOLD, -0.3), 'gold', [0, -0.14, 0.3], [PI / 2 - 0.6, 0, 0], head, 8);
    for (const sx of [-0.14, 0.14]) { B.ball(0.065, '#ffde4a', 'plastic', [sx, 0.07, 0.24], null, head, 12); B.ball(0.032, '#111', 'dark', [sx * 1.08, 0.07, 0.29], null, head, 6); }
    B.anims.push((t) => { head.rotation.y = Math.sin(t * 0.7) * 0.5; head.rotation.x = Math.sin(t * 1.3) * 0.1 - 0.1; });
    for (const side of [-1, 1]) {
      const w = B.pivot([side * 0.35, 0.3, 0.1], [0.1, -side * 0.3, 0], pv);
      for (let r = 0; r < 2; r++) for (let i = 0; i < 8; i++) { const a = 1.0 - i * 0.26, L = (1.5 - i * 0.1) * (r ? 0.6 : 1); B.feather(L, r ? 0.3 : 0.4, r ? T : (i < 3 ? WHITE : i < 6 ? T : shade(T, -0.25)), 'plastic', [0, 0, r * 0.03 + i * 0.01], a, w, side); }
      B.anims.push((t) => { const f = (Math.sin(t * 2.4) + 1) / 2; w.rotation.y = -side * (0.2 + f * 0.8 + WALK.k * 0.2); w.rotation.z = side * f * 0.15; });
      B.cyl(0.07, 0.06, 0.35, GOLD, 'gold', [side * 0.25, -0.55, 0.25], null, pv, 8);
      for (let cl = -1; cl <= 1; cl++) B.cone(0.03, 0.12, '#333', 'dark', [side * 0.25 + cl * 0.05, -0.74, 0.33], [PI / 2 + 0.5, 0, 0], pv, 6);
    }
    const tail = B.pivot([0, -0.45, -0.2], [0.6, 0, 0], pv);
    for (let i = 0; i < 6; i++) B.ball(0.08 - i * 0.008, T, 'plastic', [0, -i * 0.12, -i * 0.04], null, tail, 10);
    B.cone(0.1, 0.25, shade(T, -0.3), 'plastic', [0, -0.78, -0.24], [PI, 0, 0], tail, 8);
    B.anims.push((t) => { tail.rotation.z = Math.sin(t * 2) * 0.25; });
    B.bob(pv, 0.03, 2.4);
    return;
  }
  if (p.kind === 'kraken2') {
    const K = '#7b3fa0', K2 = '#f2c9e8';
    B.straps('#3a1f4a', 'leather');
    B.ball(0.78, K, 'plastic', [0, 0.25, 0.75], [1, 1.2, 0.9], null, 32);
    for (let i = 0; i < 14; i++) B.ball(0.05 + (i % 3) * 0.02, shade(K, 0.25), 'plastic', [Math.sin(i * 2.1) * 0.55, 0.5 + Math.cos(i * 1.7) * 0.4, 1.32 + Math.cos(i) * 0.05], [1, 1, 0.4], null, 10);
    for (const sx of [-0.28, 0.28]) { B.ball(0.17, '#fff8d0', 'plastic', [sx, 0.3, 1.38], null, null, 16); B.rbox([0.16, 0.05, 0.05], '#111', 'dark', [sx, 0.3, 1.54], null, null, 0.02); B.ball(0.2, K, 'plastic', [sx, 0.42, 1.34], [1, 0.45, 0.8], null, 12); }
    B.cone(0.2, 0.4, GOLD, 'gold', [0, 1.15, 0.75], null, null, 5);
    B.gem(0.08, '#4cc9f0', [0, 1.1, 0.95]);
    for (let k = 0; k < 8; k++) {
      const a0 = -PI * 0.95 + k * (PI * 0.9 / 7);
      let par = B.pivot([Math.cos(a0) * 0.6, -0.15 + Math.sin(a0) * 0.25, 0.75], [0, 0, a0 + PI / 2]);
      const joints = [];
      for (let i = 0; i < 12; i++) {
        const r = 0.16 * (1 - i / 13), L = 0.19;
        const j = i === 0 ? par : B.pivot([0, -L, 0], null, par);
        B.cyl(r, r * 0.92, L + 0.02, K, 'plastic', [0, -L / 2, 0], null, j, 12);
        B.ball(r, K, 'plastic', [0, 0, 0], null, j, 12);
        if (i % 1 === 0 && i > 0) for (const sx of [-1, 1]) B.ball(r * 0.32, K2, 'plastic', [sx * r * 0.35, -L / 2, r * 0.85], [1, 1, 0.5], j, 8);
        joints.push(j); par = j;
      }
      B.cone(0.025, 0.12, K, 'plastic', [0, -0.25, 0], [PI, 0, 0], par, 8);
      if (k % 2 === 0) B.coin([0, -0.12, 0.06], [0.4, 0, 0], joints[11], 0.55);
      B.anims.push((t) => joints.forEach((j, i) => { j.rotation.z = Math.sin(t * 1.8 + k * 0.9 - i * 0.45) * 0.16 + (i > 7 ? 0.22 : 0) * (k % 2 ? 1 : -1); j.rotation.x = Math.cos(t * 1.4 + k - i * 0.35) * 0.1 + (i < 3 ? 0.15 : 0); }));
    }
    B.sparkle(20, [2.5, 2, 2], '#c9a3ff', [0, 0, 1], 0.06, -0.3);
    return;
  }
  if (p.kind === 'nestdog') {
    // goldenes Nest mit liegendem goldenem Hund, der ab und zu aufschaut
    B.straps('#5a3a22', 'leather', { metal: GOLD });
    B.rbox([1.3, 0.18, 0.8], '#5a3a22', 'leather', [0, -0.55, 0.4], null, null, 0.06);
    const nz = 0.7;
    for (let r = 0; r < 5; r++) for (let i = 0; i < 22; i++) { const a = i / 22 * PI * 2 + r * 0.4, R = 0.95 - r * 0.04; B.cyl(0.025, 0.02, 0.45, r % 2 ? '#d4a017' : GOLD, 'gold', [Math.cos(a) * R, -0.42 + r * 0.07, nz + Math.sin(a) * R * 0.75], [Math.sin(a + 1) * 0.5, 0, Math.cos(a + 1) * 0.5 + PI / 2], null, 5); }
    B.lathe([[0, -0.55], [0.6, -0.5], [0.9, -0.2], [0.95, -0.1], [0, -0.3]], '#b8860b', 'gold', [0, 0, nz], null, null, 28, 'nestbowl').scale.set(1, 1, 0.75);
    for (let i = 0; i < 10; i++) B.coin([Math.sin(i * 2.4) * 0.55, -0.28, nz + Math.cos(i * 2.4) * 0.4], [PI / 2 + Math.sin(i) * 0.3, i, 0], null, 0.5);
    const G = '#f2c14e', G2 = '#d9a23a';
    const dog = B.pivot([0, -0.15, nz]);
    B.ball(0.42, G, 'gold', [0, 0, 0], [1.2, 0.6, 0.8], dog, 24);
    for (const sx of [-1, 1]) { B.ball(0.16, G, 'gold', [sx * 0.38, -0.08, 0.25], [1, 0.6, 1.4], dog, 12); B.ball(0.08, G2, 'gold', [sx * 0.42, -0.1, 0.48], null, dog, 8); }
    const tail = B.pivot([-0.5, 0.0, -0.15], [0, 0.5, 0], dog);
    for (let i = 0; i < 6; i++) B.ball(0.08 - i * 0.008, G, 'gold', [-i * 0.08, i * 0.02, i * 0.05], null, tail, 10);
    const head = B.pivot([0.38, 0.12, 0.25], null, dog);
    B.ball(0.25, G, 'gold', [0, 0, 0], null, head, 20);
    B.ball(0.14, G2, 'gold', [0.08, -0.06, 0.2], [1, 0.8, 1.2], head, 14);
    B.ball(0.04, '#2a1a10', 'dark', [0.1, -0.02, 0.36], null, head, 8);
    for (const sx of [-1, 1]) { B.ball(0.12, G2, 'gold', [sx * 0.17, 0.12, -0.04], [0.6, 1.4, 0.4], head, 12).rotation.z = sx * 0.6; const eye = B.ball(0.035, '#2a1a10', 'dark', [sx * 0.09, 0.07, 0.21], null, head, 8); }
    const lid = [-1, 1].map((sx) => B.box([0.08, 0.02, 0.02], G2, 'gold', [sx * 0.09, 0.07, 0.235], null, head));
    B.tor(0.2, 0.03, '#c1121f', 'leather', [0, -0.12, 0.02], [PI / 2 - 0.3, 0, 0], head);
    B.coin([0.0, -0.22, 0.12], [PI / 2 - 0.4, 0, 0], head, 0.25);
    B.anims.push((t) => {
      const cyc = t % 6, up = cyc > 3.5 && cyc < 5.5 ? Math.sin((cyc - 3.5) / 2 * PI) : 0;
      head.position.y = 0.12 + up * 0.3; head.rotation.x = -up * 0.5; head.rotation.y = up * Math.sin(t * 2) * 0.6;
      lid.forEach((l) => { l.visible = up < 0.1; });
      tail.rotation.y = 0.5 + Math.sin(t * (up > 0.1 ? 9 : 1.5)) * (up > 0.1 ? 0.5 : 0.1);
      dog.scale.y = 1 + Math.sin(t * 1.6) * 0.03 * (1 - up);
    });
    B.glow(2.0, '#ffe08a', [0, -0.1, nz], null, 0.35);
    B.sparkle(16, [1.8, 1.0, 1.4], '#ffe9a0', [0, 0.2, nz], 0.05, 0.3);
    return;
  }
  if (p.kind === 'chestDragon') {
    B.straps('#3a2a1c', 'leather', { metal: GOLD });
    const s = 1.1, W = 1.6 * s, D = 0.9 * s, zc = 0.6 * s, zf = zc + D / 2;
    for (let i = 0; i < 4; i++) B.rbox([W, 0.235 * s, D], i % 2 ? '#5a3418' : '#6b3f1f', 'wood', [0, -0.75 * s + i * 0.245 * s, zc], null, null, 0.035 * s);
    for (const sx of [-0.55, 0.55]) B.rbox([0.13 * s, 1.0 * s, D + 0.04], GOLD, 'gold', [sx * s, -0.38 * s, zc], null, null, 0.03);
    for (const sx of [-1, 1]) for (const sy of [-0.82, 0.08]) B.rbox([0.16 * s, 0.16 * s, 0.16 * s], GOLD, 'gold', [sx * (W / 2 - 0.02), sy * s, zf - 0.02], null, null, 0.03);
    B.cyl(0.8 * s * 0.98, 0.8 * s * 0.98, 0.04, GOLD, 'gold', [0, 0.1 * s, zc], null, null, 4).scale.set(1, 1, 0.55);
    for (let i = 0; i < 24; i++) B.coin([Math.sin(i * 2.4) * 0.6 * s, 0.14 * s + (i % 3) * 0.05, zc + Math.cos(i * 2.4) * 0.32 * s], [PI / 2 + Math.sin(i) * 0.4, i, 0.3], null, 0.6 * s);
    for (const [g, x] of [['#e63946', -0.4], ['#4cc9f0', 0.35]]) B.gem(0.1 * s, g, [x * s, 0.25 * s, zc + 0.1]);
    B.glow(2.0 * s, '#ffe08a', [0, 0.35 * s, zc], null, 0.55);
    const lid = B.pivot([0, 0.12 * s, zc - D / 2], [-0.55, 0, 0]);
    B.half(0.45 * s, W, '#6b3f1f', 'wood', [0, 0, D / 2], [0, 0, PI / 2], lid);
    for (const sx of [-0.55, 0.55]) B.tor(0.455 * s, 0.05 * s, GOLD, 'gold', [sx * s, 0, D / 2], [0, PI / 2, 0], lid, PI);
    B.rbox([0.3 * s, 0.25 * s, 0.08], GOLD, 'gold', [0, 0.0, D + 0.02], null, lid, 0.03);
    B.anims.push((t) => { lid.rotation.x = -0.55 - Math.max(0, Math.sin(t * 0.7)) * 0.2; });
    const d = dragon(B, [0.1, 0.62 * s, zc + 0.05], 0.7, '#d4a017', '#7a1f1f');
    B.anims.push((t) => { d.rotation.y = Math.sin(t * 0.6) * 0.4; d.position.y = 0.62 * s + Math.sin(t * 1.4) * 0.03; });
    B.sparkle(26, [2, 1.6, 1.6], '#ffcf4a', [0, 0.4, zc], 0.06, 0.4);
    return;
  }
  return creature2(B, p);
};

// ── Nr. 75: Thron mit mehr Details (Löwenköpfe, Baldachin, Stufen) ──
A.throne = ((orig) => (B, p) => {
  orig(B, p);
  if (!p.dragon) return;
  const s = p.size || 1;
  const pv = B.pivot([0, -0.1 * s, 0.9 * s]);
  B.bob(pv, 0.05, 1.2);
  B.half(0.95 * s, 1.75 * s, '#7a1f2a', 'cloth', [0, 2.15 * s, -0.25 * s], [0, 0, PI / 2], pv).scale.set(1, 1, 0.45);
  for (let i = 0; i < 9; i++) { B.cone(0.06 * s, 0.16 * s, GOLD, 'gold', [(-0.8 + i * 0.2) * s, 1.95 * s, 0.15 * s], [PI, 0, 0], pv, 6); }
  for (const sx of [-1, 1]) { B.cyl(0.04 * s, 0.04 * s, 1.1 * s, GOLD, 'gold', [sx * 0.88 * s, 1.45 * s, 0.15 * s], null, pv, 8); B.ball(0.08 * s, '#ff9a2e', 'gem', [sx * 0.88 * s, 2.02 * s, 0.15 * s], null, pv, 10); }
  for (let i = 0; i < 2; i++) B.rbox([(1.8 - i * 0.2) * s, 0.1 * s, (0.5 - i * 0.12) * s], GOLD, 'gold', [0, (-1.12 - i * 0.1) * s, (0.65 - i * 0.05) * s], null, pv, 0.03);
  for (let i = 0; i < 7; i++) { const a = -0.9 + i * 0.3; B.gem(0.06 * s, ['#ff9a2e', '#e63946', '#ffe066'][i % 3], [Math.sin(a) * 0.7 * s, 1.55 * s + Math.cos(a) * 0.2 * s, -0.25 * s], [0, 0, 0], pv); }
})(A.throne);

// ── Nr. 80: großer Komet; beim Laufen wächst langsam ein Flammenschweif aus Münzen ──
A.comet = (B) => {
  B.straps('#3a3f4a', 'leather', { metal: '#cfd6e0' });
  B.rbox([0.7, 0.6, 0.2], '#59606b', 'metal', [0, 0.2, 0.12], null, null, 0.08);
  const pv = B.pivot([0, 0.25, 0.75]);
  B.oct(0.62, '#6e6458', 'stone', [0, 0, 0], [1, 0.95, 0.9], [0.4, 0.3, 0.1], pv);
  B.oct(0.5, '#8a7e70', 'stone', [0.12, 0.08, 0.1], [1, 0.9, 1], [1.1, 0.6, 0.4], pv);
  for (let i = 0; i < 9; i++) B.oct(0.12, '#bff6ff', 'gem', [Math.sin(i * 2.3) * 0.5, Math.cos(i * 1.7) * 0.45, 0.3 + Math.sin(i) * 0.15], [0.7, 1.4, 0.7], [i, i, 0], pv);
  for (let i = 0; i < 6; i++) B.coin([Math.sin(i * 1.3) * 0.45, Math.cos(i * 2.1) * 0.4, 0.42], [i, i * 0.5, 0], pv, 0.5);
  B.glow(2.0, '#ffe08a', [0, 0, 0], pv, 0.55);
  B.glow(1.0, '#ffffff', [0, 0, 0.3], pv, 0.6);
  B.anims.push((t) => { pv.rotation.z = Math.sin(t * 0.8) * 0.15; pv.rotation.y = t * 0.3; });
  // Flammenschweif aus Münzen: wächst langsam beim Laufen, zieht nach hinten und oben
  const N = 36, trail = [];
  for (let i = 0; i < N; i++) trail.push(i % 3 === 0 ? B.glow(0.9, i < 12 ? '#fff6c8' : i < 24 ? '#ffb347' : '#ff5a1f', [0, 0, 0], null, 0.6) : B.coin([0, 0, 0], [0, 0, 0], null, 0.6, i < 12 ? '#fff1a8' : GOLD));
  let grow = 0, last = 0;
  B.anims.push((t) => {
    const dt = Math.min(0.05, t - last); last = t;
    const target = 0.15 + WALK.k * 0.85;
    grow += (target - grow) * Math.min(1, dt * (target > grow ? 0.45 : 1.2));
    trail.forEach((m, i) => {
      const u = ((i / N) + t * 0.35) % 1, len = grow * 4.2, d = u * len;
      m.position.set(Math.sin(t * 3 + i) * 0.12 * u * 3, 0.25 + d * 0.45 + Math.sin(t * 5 + i) * 0.05, 1.2 + d);
      const sc = (1 - u) * (0.4 + grow * 0.8);
      m.scale.setScalar(m.isSprite ? 1.4 * sc + 0.001 : Math.max(0.001, sc));
      m.rotation.set(t * 6 + i, t * 3, 0);
      m.visible = grow > 0.05;
    });
  });
  B.sparkle(40, [1.4, 2.6, 3.4], '#ffe08a', [0, 1.1, 2.4], 0.08, 0.9);
};

// ── Nr. 84 und 93: Goldstrom als flacher Kreis auf dem Rücken ──
A.stream = (B, p) => {
  const cols = p.cols || [GOLD], glowC = p.glow || '#ffe08a';
  B.straps('#3a3040', 'leather', { metal: GOLD });
  B.rbox([0.6, 0.6, 0.18], '#3a3040', 'metal', [0, 0.1, 0.12], null, null, 0.08);
  const pv = B.pivot([0, 0.1, 0.62]);
  for (const R of [0.7, 1.15]) B.tor(R, 0.05, glowC, 'neonT', [0, 0, 0], null, pv);
  B.tor(1.38, 0.04, GOLD, 'gold', [0, 0, -0.02], null, pv);
  B.tor(0.5, 0.04, GOLD, 'gold', [0, 0, -0.02], null, pv);
  B.cyl(0.45, 0.45, 0.04, '#2a2230', 'dark', [0, 0, -0.03], [PI / 2, 0, 0], pv, 32);
  B.coin([0, 0, 0.01], [PI / 2, 0, 0], pv, 1.2);
  B.emblem('star', [0, 0, 0.06], 0.7, pv);
  B.glow(1.4, glowC, [0, 0, 0.05], pv, 0.55);
  const N = p.n || 40, items = [];
  for (let i = 0; i < N; i++) items.push(i % 4 === 3 ? B.ball(0.06, cols[i % cols.length], 'neon', [0, 0, 0], null, pv, 8) : B.coin([0, 0, 0], [0, 0, 0], pv, 0.5, cols[i % cols.length]));
  const glows = [];
  for (let i = 0; i < 8; i++) glows.push(B.glow(0.55, glowC, [0, 0, 0], pv, 0.45));
  B.anims.push((t) => {
    items.forEach((m, i) => {
      const lane = i % 3, R = 0.8 + lane * 0.22, a = (i / N) * PI * 2 + t * (0.8 - lane * 0.12) * (lane === 1 ? -1 : 1);
      m.position.set(Math.cos(a) * R, Math.sin(a) * R, 0.04 + Math.sin(a * 3 + t) * 0.04);
      m.rotation.set(PI / 2, 0, a + t * 2);
    });
    glows.forEach((g, i) => { const a = i / 8 * PI * 2 + t * 0.8; g.position.set(Math.cos(a) * 1.0, Math.sin(a) * 1.0, 0.05); });
  });
  B.sparkle(40, [3, 3, 0.6], glowC, [0, 0.1, 0.7], 0.06, 0.25);
};

// ── Nr. 85: Schwarzes Loch, näher und mit Linsenring, Akkretionsscheibe und einströmenden Münzen ──
A.blackhole = (B) => {
  const pv = B.pivot([0, 0.4, 1.05], [0.55, 0, 0.15]);
  B.ball(0.5, '#000000', 'dark', [0, 0, 0], null, pv, 32);
  B.tor(0.54, 0.02, '#ffffff', 'neon', [0, 0, 0], [-0.55, 0, 0], pv);
  B.tor(0.6, 0.05, '#ffd9a0', 'neonT', [0, 0, 0], [-0.55, 0, 0], pv);
  const disk = B.pivot([0, 0, 0], [PI / 2, 0, 0], pv);
  [['#ffffff', 0.7, 0.07], ['#ffd27a', 0.85, 0.12], ['#ff9a2e', 1.05, 0.14], ['#ff5a1f', 1.28, 0.12], ['#a4161a', 1.5, 0.08]].forEach(([c, R, r]) => { const m = B.tor(R, r, c, 'neonT', [0, 0, 0], null, disk); m.scale.set(1, 1, 0.12); });
  B.spin(disk, 'z', 0.6);
  const jets = B.pivot([0, 0, 0], null, pv);
  for (const sy of [-1, 1]) for (let i = 0; i < 6; i++) { const g = B.glow(0.55 - i * 0.06, '#9fc4ff', [0, sy * (0.6 + i * 0.3), 0], jets, 0.6); }
  const coins = [];
  for (let i = 0; i < 18; i++) coins.push(B.coin([0, 0, 0], [0, 0, 0], pv, 0.45, i % 3 ? GOLD : '#e8ecf2'));
  B.anims.push((t) => coins.forEach((m, i) => { const u = ((i / 18) + t * 0.15) % 1, R = 2.0 * (1 - u) + 0.45, a = i * 2.1 + u * 9; m.position.set(Math.cos(a) * R, Math.sin(u * 9 + i) * 0.08, Math.sin(a) * R); m.rotation.set(t * 4 + i, a, 0); m.scale.setScalar(0.45 * (0.3 + (1 - u) * 0.7)); }));
  B.glow(4.2, '#ff7a1a', [0, 0, 0], pv, 0.28);
  B.glow(1.6, '#ffffff', [0, 0, 0], pv, 0.25);
  B.bob(pv, 0.05, 1.0);
  B.sparkle(40, [4, 1.4, 4], '#ffb36b', [0, 0.4, 1.05], 0.05, 0.12);
};

// ── Nr. 87: Sonnenrad ohne Halterung, näher am Rücken ──
A.sunwheel = (B) => {
  const pv = B.pivot([0, 0.45, 0.65]);
  const wheel = B.pivot([0, 0, 0], null, pv);
  B.tor(1.3, 0.13, GOLD, 'gold', [0, 0, 0], null, wheel);
  B.tor(1.12, 0.04, '#fff1a8', 'neon', [0, 0, 0.06], null, wheel);
  B.tor(0.5, 0.08, GOLD, 'gold', [0, 0, 0], null, wheel);
  B.ball(0.35, '#fff1a8', 'neon', [0, 0, 0], null, wheel, 20);
  for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; B.rbox([0.75, 0.09, 0.09], GOLD, 'gold', [Math.cos(a) * 0.9, Math.sin(a) * 0.9, 0], [0, 0, a], wheel, 0.03); B.gem(0.08, '#ff9a2e', [Math.cos(a + 0.39) * 1.3, Math.sin(a + 0.39) * 1.3, 0.12], null, wheel); }
  for (let i = 0; i < 16; i++) { const a = i / 16 * PI * 2; B.cone(0.13, i % 2 ? 0.45 : 0.75, i % 2 ? '#ff9a2e' : '#ffe066', 'neon', [Math.cos(a) * (1.55 + (i % 2 ? 0 : 0.15)), Math.sin(a) * (1.55 + (i % 2 ? 0 : 0.15)), 0], [0, 0, a - PI / 2], wheel, 4); }
  B.spin(wheel, 'z', 0.35);
  B.glow(2.4, '#ffcf4a', [0, 0, 0.1], pv, 0.55);
  B.glow(5, '#ff9a2e', [0, 0, 0], pv, 0.16);
  B.bob(pv, 0.04, 1.2);
  B.sparkle(30, [4, 4, 1], '#ffe9a0', [0, 0.45, 0.7], 0.08, 0.3);
};

// ── Nr. 88: Münz-Zitadelle, Insel mittig hinter dem Rücken, etwas mehr Abstand ──
A.citadel = (B) => {
  const pv = B.pivot([0, 0.9, 2.0]);
  B.cone(1.4, 1.3, '#4a4058', 'stone', [0, -0.9, 0], [PI, 0, 0], pv, 10);
  B.cyl(1.42, 1.42, 0.25, '#6b6078', 'stone', [0, -0.15, 0], null, pv, 12);
  for (let i = 0; i < 12; i++) B.ball(0.14 + (i % 3) * 0.04, '#5a8a4a', 'plastic', [Math.sin(i * 2.2) * 1.15, 0.0, Math.cos(i * 2.2) * 1.15], [1, 0.6, 1], pv, 10);
  for (let i = 0; i < 16; i++) { const a = i / 16 * PI * 2; B.rbox([0.18, 0.24, 0.12], GOLD, 'gold', [Math.cos(a) * 1.25, 0.1, Math.sin(a) * 1.25], [0, -a, 0], pv, 0.03); }
  const towers = [[0, 0, 2.0, 0.4], [-0.8, 0.4, 1.3, 0.28], [0.8, 0.4, 1.4, 0.28], [-0.6, -0.6, 1.1, 0.24], [0.6, -0.6, 1.2, 0.24]];
  for (const [x, z, h, r] of towers) {
    B.cyl(r, r * 1.05, h, '#efe6cf', 'stone', [x, h / 2, z], null, pv, 12);
    for (let j = 0; j < Math.floor(h / 0.3); j++) B.tor(r * 1.02, 0.02, GOLD, 'gold', [x, 0.25 + j * 0.3, z], [PI / 2, 0, 0], pv);
    // Dach aus gestapelten Münzen
    for (let j = 0; j < 5; j++) B.coin([x, h + 0.02 + j * 0.06, z], [0, j, 0], pv, (r / 0.3) * (1.2 - j * 0.2));
    B.cone(0.05, 0.2, GOLD, 'gold', [x, h + 0.42, z], null, pv, 6);
    B.rbox([0.1, 0.18, 0.04], '#ffe9a0', 'neon', [x, h * 0.65, z + r + 0.01], null, pv, 0.02);
    const f = B.rbox([0.26, 0.15, 0.01], '#e9c35a', 'cloth', [x + 0.14, h + 0.62, z], null, pv, 0.005);
    B.cyl(0.01, 0.01, 0.4, '#d7dde6', 'metal', [x, h + 0.55, z], null, pv, 4);
    B.anims.push((t) => { f.rotation.y = Math.sin(t * 3 + x) * 0.4; });
  }
  B.rbox([0.7, 0.55, 0.5], '#b8860b', 'gold', [0, 0.35, 0.85], null, pv, 0.06);
  B.half(0.25, 0.52, GOLD, 'gold', [0, 0.62, 0.85], [0, 0, PI / 2], pv);
  B.coin([0, 0.38, 1.11], null, pv, 0.6);
  B.glow(0.9, '#ffe08a', [0, 0.4, 1.2], pv, 0.6);
  for (let i = 0; i < 10; i++) B.coin([Math.sin(i) * 1.1, -0.9 - i * 0.12, Math.cos(i) * 0.5], [i, 0, 1], pv, 0.6);
  const fall = [];
  for (let i = 0; i < 8; i++) fall.push(B.coin([0, 0, 0], [0, 0, 0], pv, 0.45));
  B.anims.push((t) => fall.forEach((m, i) => { const u = ((i / 8) + t * 0.25) % 1; m.position.set(Math.cos(i * 1.6) * 0.8, -1.6 - u * 1.4, Math.sin(i * 1.6) * 0.6); m.rotation.set(t * 5 + i, 0, 0); m.scale.setScalar(0.45 * (1 - u)); }));
  B.bob(pv, 0.12, 1);
  B.glow(3.6, '#ffe08a', [0, 0.6, 0], pv, 0.2);
  B.sparkle(40, [4, 3.5, 3], '#ffe9a0', [0, 1.0, 2.0], 0.07, 0.3);
};

// ── Nr. 89 (neu): Münzkasten mit Engelsflügeln, ohne drehenden Kreis ──
A.angelbox = (B) => {
  B.straps('#e8dcae', 'leather', { metal: GOLD });
  const zc = 0.55, W = 1.2, H = 1.0, D = 0.75;
  B.rbox([W, H, D], '#f6f1e6', 'gold', [0, -0.1, zc], null, null, 0.08);
  for (const y of [-0.55, 0.35]) B.rbox([W + 0.06, 0.1, D + 0.06], GOLD, 'gold', [0, y, zc], null, null, 0.03);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.cyl(0.06, 0.06, H + 0.1, GOLD, 'gold', [sx * W / 2, -0.1, zc + sz * D / 2], null, null, 10);
  B.lathe([[0, 0.25], [0.35, 0.2], [0.6, 0.05], [0.62, 0]], '#f6f1e6', 'gold', [0, 0.42, zc], [0, PI / 4, 0], null, 4, 'abox').scale.set(1.4, 1, 1.0);
  B.rbox([0.4, 0.05, 0.08], '#2a1a0c', 'dark', [0, 0.62, zc], null, null, 0.02);
  const c = B.coin([0, 0.72, zc], [0, 0, PI / 2], null, 0.7);
  B.anims.push((t) => { const k = (t % 3) / 3; c.position.y = 0.72 + 0.3 * (1 - k); c.visible = k < 0.9; });
  B.glow(0.7, '#fff1a8', [0, 0.65, zc], null, 0.7);
  B.coin([0, -0.1, zc + D / 2 + 0.02], null, null, 0.85);
  B.emblem('star', [0, -0.1, zc + D / 2 + 0.06], 0.55);
  for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; B.gem(0.04, '#cfe6ff', [Math.cos(a) * 0.32, -0.1 + Math.sin(a) * 0.32, zc + D / 2 + 0.03]); }
  B.tor(0.45, 0.05, '#fff1a8', 'neon', [0, 1.05, zc], [PI / 2, 0, 0]);
  B.glow(1.2, '#fff1a8', [0, 1.05, zc], null, 0.45);
  for (const side of [-1, 1]) {
    const w = B.pivot([side * 0.55, 0.15, zc - 0.1], [0.1, -side * 0.3, 0]);
    for (let r = 0; r < 3; r++) for (let i = 0; i < 9; i++) { const a = 1.0 - i * 0.24, L = (1.7 - i * 0.11) * [1, 0.62, 0.35][r]; B.feather(L, [0.42, 0.34, 0.28][r], r === 0 ? '#ffffff' : r === 1 ? '#fff6e0' : '#fff1c8', 'plastic', [0, 0, r * 0.03 + i * 0.01], a, w, side); if (r === 0 && i % 2 === 0) B.glow(0.3, '#fff1a8', [side * Math.cos(a) * L, Math.sin(a) * L, 0.05], w, 0.6); }
    B.anims.push((t) => { const f = (Math.sin(t * 2.2) + 1) / 2; w.rotation.y = -side * (0.25 + f * 0.75 + WALK.k * 0.2); });
  }
  B.sparkle(40, [3, 2.4, 1.6], '#fff6c8', [0, 0.3, 0.6], 0.08, 0.4);
};

// ── Nr. 92: Säulen ohne Dach, mit besseren Blitzen ──
A.columns = (B) => {
  B.straps('#d7dde6', 'leather', { metal: GOLD });
  B.rbox([2.3, 0.25, 0.8], '#f2ede4', 'stone', [0, -1.05, 0.65], null, null, 0.05);
  B.rbox([2.1, 0.12, 0.7], GOLD, 'gold', [0, -0.88, 0.65], null, null, 0.03);
  const tops = [];
  for (const x of [-0.95, -0.32, 0.32, 0.95]) {
    B.cyl(0.17, 0.2, 2.3, '#f6f1e6', 'stone', [x, 0.3, 0.65], null, null, 16);
    for (let f = 0; f < 10; f++) { const a = f / 10 * PI * 2; B.box([0.015, 2.2, 0.015], '#d8d0c0', 'stone', [x + Math.cos(a) * 0.19, 0.3, 0.65 + Math.sin(a) * 0.19]); }
    B.rbox([0.48, 0.12, 0.48], GOLD, 'gold', [x, 1.5, 0.65], null, null, 0.03);
    for (const sx of [-1, 1]) B.tor(0.08, 0.03, GOLD, 'gold', [x + sx * 0.18, 1.42, 0.85], [0, 0, 0]);
    B.tor(0.22, 0.04, GOLD, 'gold', [x, -0.78, 0.65], [PI / 2, 0, 0]);
    B.gem(0.09, '#fff1a8', [x, 1.62, 0.65], [0, 0, 0]);
    B.glow(0.7, '#fff1a8', [x, 1.66, 0.65], null, 0.7);
    tops.push(x);
  }
  // Blitze: zackig, verzweigt, flackernd, zwischen den Säulenköpfen und hinab zur Basis
  const bolts = [];
  function bolt(a, b, seed) {
    const g = B.pivot([0, 0, 0]);
    const n = 7; let prev = a;
    for (let i = 1; i <= n; i++) {
      const t = i / n, jit = i === n ? 0 : 0.18;
      const pt = [a[0] + (b[0] - a[0]) * t + Math.sin(seed * 7 + i * 3.3) * jit, a[1] + (b[1] - a[1]) * t + Math.cos(seed * 5 + i * 2.1) * jit, a[2] + (b[2] - a[2]) * t + 0.05];
      const d = Math.hypot(pt[0] - prev[0], pt[1] - prev[1], pt[2] - prev[2]);
      const m = B.cyl(0.025, 0.025, d, '#ffffff', 'neon', [(pt[0] + prev[0]) / 2, (pt[1] + prev[1]) / 2, (pt[2] + prev[2]) / 2], null, g, 5);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(pt[0] - prev[0], pt[1] - prev[1], pt[2] - prev[2]).normalize());
      if (i % 3 === 0) { B.glow(0.5, '#fff1a8', pt, g, 0.8); const br = [pt[0] + 0.25, pt[1] - 0.25, pt[2]]; const bd = Math.hypot(0.25, 0.25); const bm = B.cyl(0.015, 0.015, bd, '#fff6c8', 'neon', [(pt[0] + br[0]) / 2, (pt[1] + br[1]) / 2, pt[2]], [0, 0, -PI / 4 + (seed % 2 ? 0 : PI / 2)], g, 4); }
      prev = pt;
    }
    bolts.push(g);
    return g;
  }
  for (let i = 0; i < 3; i++) bolt([tops[i] + 0.18, 1.5, 0.7], [tops[i + 1] - 0.18, 1.5, 0.7], i + 1);
  for (let i = 0; i < 3; i++) bolt([(tops[i] + tops[i + 1]) / 2, 1.45, 0.72], [(tops[i] + tops[i + 1]) / 2, -0.85, 0.72], i + 4);
  B.anims.push((t) => bolts.forEach((g, i) => { const v = Math.sin(t * (13 + i * 3) + i * 7) + Math.sin(t * 7.3 + i); g.visible = v > -0.2; g.scale.x = 1 + Math.sin(t * 31 + i) * 0.08; }));
  B.coin([0, -0.95, 1.06], null, null, 0.8);
  B.glow(2.4, '#fff1a8', [0, 0.4, 0.8], null, 0.25);
  B.sparkle(40, [3, 3.2, 1.5], '#fff6c8', [0, 0.4, 0.7], 0.08, 0.6);
};

// ── Nr. 94: Hort ohne Halterung, näher, mit mehr Schätzen ──
A.hoard = (B) => {
  const pv = B.pivot([0, 0.3, 1.15]);
  B.lathe([[0, 0.65], [0.25, 0.58], [0.55, 0.35], [0.85, 0.12], [1.15, -0.05], [1.15, -0.1], [0, -0.1]], GOLD, 'gold', [0, -0.4, 0], null, pv, 28, 'hoardpile');
  B.cone(1.15, 0.55, '#6b5a4a', 'stone', [0, -0.78, 0], [PI, 0, 0], pv, 12);
  for (let i = 0; i < 50; i++) { const t = (i * 0.618) % 1, a = i * 2.4, r = 1.1 * (1 - t); B.coin([Math.cos(a) * r, -0.45 + t * 0.7, Math.sin(a) * r], [PI / 2 + Math.sin(i) * 0.5, a, 0.4], pv, 0.6, i % 11 === 0 ? '#e8ecf2' : GOLD); }
  for (let i = 0; i < 6; i++) B.gem(0.1, ['#e63946', '#4cc9f0', '#2ec4b6', '#b77bff', '#ffe066', '#ff8fd1'][i], [Math.sin(i * 1.7) * 0.75, -0.2 + (i % 3) * 0.15, Math.cos(i * 1.7) * 0.75], [i, 0, 0], pv);
  B.cyl(0.08, 0.06, 0.8, GOLD, 'gold', [0.35, 0.35, 0.2], [0.2, 0, -0.5], pv, 8);
  B.ball(0.18, GOLD, 'gold', [0.55, 0.65, 0.25], [1, 0.5, 1], pv, 12);
  B.lathe([[0, 0], [0.12, 0], [0.15, 0.12], [0.1, 0.25], [0.12, 0.32], [0, 0.32]], GOLD, 'gold', [-0.45, 0.05, 0.4], [0.3, 0, 0.4], pv, 18, 'goblet');
  const cr = B.pivot([0, 0.4, 0], [0.3, 0, 0.2], pv);
  B.cyl(0.22, 0.2, 0.14, GOLD, 'gold', [0, 0, 0], null, cr, 16);
  for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; B.cone(0.05, 0.14, GOLD, 'gold', [Math.sin(a) * 0.2, 0.13, Math.cos(a) * 0.2], null, cr, 4); }
  B.spin(pv, 'y', 0.3); B.bob(pv, 0.08, 1.1);
  B.glow(3, '#ffe08a', [0, 0, 0], pv, 0.3);
  B.sparkle(40, [3, 3, 3], '#ffe08a', [0, 0.3, 1.15], 0.08, 0.5);
};

// ── Nr. 95: Urmünze mit Prägung (Kopf, Lorbeer, Inschrift), ohne Halterung ──
A.primal = (B) => {
  const pv = B.pivot([0, 0.45, 0.85]);
  B.cyl(1.15, 1.15, 0.2, '#e0a92e', 'gold', [0, 0, 0], [PI / 2, 0, 0], pv, 64);
  for (let i = 0; i < 64; i++) { const a = i / 64 * PI * 2; B.box([0.025, 0.2, 0.05], shade(GOLD, -0.2), 'gold', [Math.cos(a) * 1.16, Math.sin(a) * 1.16, 0], [0, 0, a], pv); }
  for (const z of [0.1, -0.1]) {
    const face = B.pivot([0, 0, z], z < 0 ? [0, PI, 0] : null, pv);
    B.tor(1.05, 0.05, GOLD, 'gold', [0, 0, 0.01], null, face);
    for (let i = 0; i < 40; i++) { const a = i / 40 * PI * 2; B.ball(0.025, '#fff1a8', 'gold', [Math.cos(a) * 0.93, Math.sin(a) * 0.93, 0.02], [1, 1, 0.5], face, 6); }
    for (const sx of [-1, 1]) for (let i = 0; i < 9; i++) { const a = -PI / 2 + sx * (0.35 + i * 0.25); B.ball(0.07, '#d4a017', 'gold', [Math.cos(a) * 0.72, Math.sin(a) * 0.72, 0.02], [1.6, 0.7, 0.4], face, 8).rotation.z = a + sx * 0.6; }
    // Profilkopf im Relief
    B.ball(0.32, '#f2c14e', 'gold', [0.02, 0.12, 0.03], [0.85, 1, 0.25], face, 20);
    B.ball(0.08, '#f2c14e', 'gold', [-0.27, 0.12, 0.04], [0.7, 1.2, 0.3], face, 10);
    B.ball(0.12, '#f2c14e', 'gold', [-0.22, -0.08, 0.04], [0.9, 0.7, 0.3], face, 10);
    B.ball(0.2, '#f2c14e', 'gold', [0.05, -0.3, 0.03], [0.6, 0.9, 0.25], face, 12);
    for (let i = 0; i < 7; i++) { const a = PI * 0.15 + i * 0.22; B.ball(0.05, '#ffd23f', 'gold', [0.05 + Math.cos(a) * 0.3, 0.12 + Math.sin(a) * 0.32, 0.06], [1.4, 0.6, 0.5], face, 6).rotation.z = a + PI / 2; }
    for (let i = 0; i < 5; i++) B.cone(0.04, 0.12, '#ffd23f', 'gold', [-0.05 + (i - 2) * 0.09, 0.5, 0.05], null, face, 4).scale.set(1, 1, 0.4);
    B.emblem('star', [0.55, 0.55, 0.04], 0.35, face);
  }
  B.spin(pv, 'y', 0.6); B.bob(pv, 0.06, 1.2);
  B.glow(3.2, '#ffe08a', [0, 0.45, 0.85], null, 0.35);
  B.sparkle(40, [3, 3, 2], '#fff1a8', [0, 0.45, 0.9], 0.08, 0.4);
};

// ── Nr. 96: Amboss als echte Silhouette mit Horn und Hardyloch, besserer Hammer ──
A.anvil = (B) => {
  B.straps('#3a3f4a', 'leather', { metal: '#cfd6e0' });
  const pv = B.pivot([0, -0.15, 0.95]);
  const sh = new THREE.Shape();
  sh.moveTo(-0.55, -0.75); sh.lineTo(0.55, -0.75); sh.lineTo(0.45, -0.6); sh.lineTo(0.22, -0.52); sh.quadraticCurveTo(0.2, -0.1, 0.42, -0.02); sh.lineTo(0.72, 0.0); sh.lineTo(0.72, 0.25); sh.lineTo(-0.55, 0.25); sh.quadraticCurveTo(-0.95, 0.2, -1.35, 0.12); sh.quadraticCurveTo(-0.95, 0.0, -0.45, -0.04); sh.quadraticCurveTo(-0.2, -0.12, -0.22, -0.52); sh.lineTo(-0.45, -0.6); sh.lineTo(-0.55, -0.75);
  const g = new THREE.ExtrudeGeometry(sh, { depth: 0.5, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2 });
  g.translate(0, 0, -0.25);
  B.mesh(g, '#4a4f5a', 'metal', [0, 0, 0], null, pv);
  B.rbox([1.3, 0.03, 0.52], '#c0c6cf', 'metal', [0.08, 0.28, 0], null, pv, 0.01);
  B.rbox([0.1, 0.04, 0.1], '#111', 'dark', [0.55, 0.29, 0], null, pv, 0.01);
  B.cyl(0.04, 0.04, 0.04, '#111', 'dark', [0.38, 0.29, 0], null, pv, 10);
  B.rbox([1.35, 0.14, 0.85], '#5a3a22', 'wood', [0, -0.86, 0], null, pv, 0.03);
  B.rivets([-0.55, -0.8, 0.43], [0.55, -0.8, 0.43], 5, '#9aa3ad', 0.03, pv);
  const hot = B.coin([0.15, 0.33, 0], [0, 0, 0], pv, 1.1, '#ffb347');
  B.glow(0.9, '#ff9a2e', [0.15, 0.36, 0], pv, 0.8);
  const h = B.pivot([0.95, 0.95, 0.05], null, pv);
  B.cyl(0.05, 0.06, 1.0, '#7a5232', 'wood', [0, 0, 0], [0, 0, 0.6], h, 10);
  for (let i = 0; i < 6; i++) B.tor(0.062, 0.015, '#3a1f14', 'leather', [Math.sin(0.6) * (-0.35 + i * 0.06), -Math.cos(0.6) * (-0.35 + i * 0.06), 0], [PI / 2, 0, 0.6], h);
  const hd = B.pivot([-0.29, 0.41, 0], [0, 0, 0.6], h);
  B.rbox([0.42, 0.18, 0.2], '#59606b', 'metal', [0, 0, 0], null, hd, 0.03);
  B.cone(0.1, 0.16, '#59606b', 'metal', [0.28, 0, 0], [0, 0, -PI / 2], hd, 4).scale.set(1, 1, 0.5);
  B.cyl(0.1, 0.1, 0.06, '#7a7f8a', 'metal', [-0.24, 0, 0], [0, 0, PI / 2], hd, 14);
  B.anims.push((t) => { const k = Math.max(0, Math.sin(t * 3)); h.rotation.z = -k * 0.7; hot.scale.setScalar(1.1 * (1 + (k > 0.95 ? 0.08 : 0))); });
  B.sparkle(50, [1.4, 1.2, 1.0], '#ffb347', [0.15, 0.7, 0.95], 0.09, 1.6);
};

// ── Nr. 98 (neu): Münzgott auf dem Rücken ──
A.coingod = (B) => {
  B.straps('#e8dcae', 'leather', { metal: GOLD });
  B.rbox([0.55, 0.55, 0.18], GOLD, 'gold', [0, 0.2, 0.12], null, null, 0.08);
  const pv = B.pivot([0, 0.6, 1.2]);
  // Wolkensockel
  for (let i = 0; i < 9; i++) B.ball(0.32 - (i % 3) * 0.06, '#fff8e6', 'plastic', [Math.cos(i * 0.7) * 0.5, -1.15 + (i % 2) * 0.08, Math.sin(i * 0.7) * 0.35], null, pv, 14);
  // Gewand
  B.lathe([[0, -1.05], [0.55, -1.05], [0.48, -0.6], [0.34, -0.1], [0.3, 0.25], [0.2, 0.42], [0, 0.45]], '#fff1c8', 'cloth', [0, 0, 0], null, pv, 28, 'robe');
  B.lathe([[0.56, -1.04], [0.58, -0.95], [0.5, -0.94]], GOLD, 'gold', [0, 0, 0], null, pv, 28, 'robehem');
  B.tor(0.32, 0.04, GOLD, 'gold', [0, -0.12, 0], [PI / 2, 0, 0], pv);
  B.rbox([0.12, 1.0, 0.03], GOLD, 'gold', [0.05, -0.55, 0.33], [0.12, 0, 0.1], pv, 0.02);
  // Kopf mit Bart, Krone und Heiligenschein
  const head = B.pivot([0, 0.68, 0], null, pv);
  B.ball(0.24, '#f2c9a0', 'plastic', [0, 0, 0], null, head, 20);
  B.cone(0.2, 0.36, '#f6f1e6', 'plastic', [0, -0.25, 0.08], [PI + 0.2, 0, 0], head, 12);
  for (const sx of [-0.08, 0.08]) B.ball(0.03, '#3a6ea5', 'neon', [sx, 0.04, 0.21], null, head, 8);
  B.cyl(0.2, 0.18, 0.12, GOLD, 'gold', [0, 0.25, 0], null, head, 16);
  for (let i = 0; i < 7; i++) { const a = i / 7 * PI * 2; B.cone(0.04, 0.14, GOLD, 'gold', [Math.sin(a) * 0.19, 0.37, Math.cos(a) * 0.19], null, head, 4); B.ball(0.025, ['#e63946', '#4cc9f0', '#2ec4b6'][i % 3], 'gem', [Math.sin(a) * 0.19, 0.46, Math.cos(a) * 0.19], null, head, 6); }
  B.tor(0.42, 0.04, '#fff1a8', 'neon', [0, 0.15, -0.18], null, head);
  B.glow(1.2, '#fff1a8', [0, 0.15, -0.2], head, 0.6);
  B.anims.push((t) => { head.rotation.y = Math.sin(t * 0.5) * 0.3; });
  // Arme halten eine riesige Münze über dem Kopf
  const coin = B.pivot([0, 1.55, 0], null, pv);
  B.coin([0, 0, 0], [PI / 2, 0, 0], coin, 1.6);
  B.emblem('star', [0, 0, 0.06], 0.6, coin);
  B.glow(1.8, '#ffe08a', [0, 0, 0.05], coin, 0.6);
  B.spin(coin, 'y', 1.0);
  for (const sx of [-1, 1]) {
    const arm = B.pivot([sx * 0.3, 0.3, 0], [0, 0, sx * 0.35], pv);
    B.cyl(0.08, 0.1, 0.75, '#fff1c8', 'cloth', [0, 0.35, 0], null, arm, 10);
    B.ball(0.08, '#f2c9a0', 'plastic', [0, 0.75, 0], null, arm, 10);
    B.tor(0.09, 0.025, GOLD, 'gold', [0, 0.6, 0], [PI / 2, 0, 0], arm);
  }
  // Münzen kreisen, Strahlen
  const o = B.pivot([0, 0, 0], [0.3, 0, 0], pv);
  for (let i = 0; i < 14; i++) { const a = i / 14 * PI * 2; B.coin([Math.cos(a) * 1.3, Math.sin(i * 3) * 0.15, Math.sin(a) * 1.3], [0.4, -a, 0], o, 0.7); }
  B.spin(o, 'y', 0.9);
  const rays = B.pivot([0, 0.3, -0.5], null, pv);
  for (let i = 0; i < 18; i++) { const a = i / 18 * PI * 2; B.box([0.05, 0.9, 0.02], '#fff1a8', 'neonT', [Math.cos(a) * 1.5, Math.sin(a) * 1.5, 0], [0, 0, a - PI / 2], rays); }
  B.spin(rays, 'z', 0.2);
  B.bob(pv, 0.1, 1.0);
  B.glow(4.5, '#ffe08a', [0, 0.6, 1.2], null, 0.25);
  B.sparkle(70, [4, 5, 3], '#fff1a8', [0, 0.8, 1.2], 0.09, 0.7);
};

// ── Nr. 99 (neu): Münzgalaxie in Form einer liegenden Acht (Unendlichkeit) ──
A.infinity = (B) => {
  B.straps('#e8dcae', 'leather', { metal: GOLD });
  B.rbox([0.6, 0.6, 0.18], GOLD, 'gold', [0, 0.15, 0.12], null, null, 0.08);
  const pv = B.pivot([0, 0.35, 0.85], [0.15, 0, 0]);
  const A2 = 1.5, lem = (t) => { const d = 1 + Math.sin(t) ** 2; return [A2 * Math.cos(t) / d, A2 * Math.sin(t) * Math.cos(t) / d * 1.3]; };
  const n = 1400, pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
  const pal = ['#ffcf4a', '#ffffff', '#b77bff', '#5fb8ff', '#ff8fd1'].map((h) => new THREE.Color(h).convertSRGBToLinear());
  for (let i = 0; i < n; i++) { const t = Math.random() * PI * 2, [x, y] = lem(t), sp = 0.05 + Math.random() * 0.16; pos.set([x + (Math.random() - 0.5) * sp * 2, y + (Math.random() - 0.5) * sp * 2, (Math.random() - 0.5) * sp], i * 3); const c = pal[i % 5 === 0 ? 2 + (i % 3) : i % 2]; col.set([c.r, c.g, c.b], i * 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  pv.add(new THREE.Points(g, new THREE.PointsMaterial({ size: 0.11, vertexColors: true, map: texture('glow'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })));
  const N = 34, coins = [];
  for (let i = 0; i < N; i++) coins.push(i % 5 === 4 ? B.glow(0.45, '#fff1a8', [0, 0, 0], pv, 0.7) : B.coin([0, 0, 0], [0, 0, 0], pv, 0.5, i % 7 === 0 ? '#e8ecf2' : GOLD));
  B.anims.push((t) => coins.forEach((m, i) => { const u = (i / N) * PI * 2 + t * 0.6; const [x, y] = lem(u); m.position.set(x, y, Math.sin(u * 2) * 0.08); m.rotation.set(PI / 2, 0, u * 3); }));
  for (const sx of [-1, 1]) { B.ball(0.14, '#fff1a8', 'neon', [sx * A2 * 0.72, 0, 0], null, pv, 14); B.glow(1.3, sx > 0 ? '#ffcf4a' : '#b77bff', [sx * A2 * 0.72, 0, 0], pv, 0.6); }
  B.gem(0.16, '#ffffff', [0, 0, 0.05], [0, 0, 0], pv);
  B.glow(1.4, '#ffffff', [0, 0, 0.1], pv, 0.7);
  B.glow(5, '#ffe08a', [0, 0, 0], pv, 0.15);
  B.bob(pv, 0.06, 1.0);
  B.sparkle(60, [4.4, 2.6, 1.6], '#fff1a8', [0, 0.35, 0.85], 0.07, 0.25);
};
