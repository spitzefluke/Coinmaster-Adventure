// ── Grundformen, Teil 3: Details auf den Grundgerüsten von Kristall bis Aura ──
const more = (name, fn) => { const base = A[name]; A[name] = (B, p) => { base(B, p); fn(B, p || {}); }; };
// Halterung am Rücken: Platte mit Rahmen, Nieten und Kristall-Lampe
function backplate(B, c = IRON, glowC = '#9fd3ff', w = 1.1, h = 1.3) {
  B.rbox([w, h, 0.12], c, 'metal', [0, 0.05, 0.08], null, null, 0.06);
  B.rbox([w * 0.8, h * 0.8, 0.04], shade(c, -0.3), 'metal', [0, 0.05, 0.15], null, null, 0.03);
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) B.ball(0.04, shade(c, 0.35), 'metal', [sx * (w / 2 - 0.08), 0.05 + sy * (h / 2 - 0.08), 0.15], [1, 1, 0.6], null, 10);
  B.rbox([0.2, 0.06, 0.03], glowC, 'neon', [0, 0.05 - h * 0.32, 0.18], null, null, 0.02);
  B.glow(0.4, glowC, [0, 0.05 - h * 0.32, 0.22], null, 0.7);
}

more('crystal', (B, p) => {
  const c = p.c || '#bff6ff';
  backplate(B, '#d7dde6', c, 1.2, 1.1);
  for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; B.oct(0.12, shade(c, -0.1), 'gem', [Math.cos(a) * 0.5, -0.92, 0.7 + Math.sin(a) * 0.2], [0.6, 1.4, 0.6], [0, 0, Math.cos(a) * 0.4]); }
  for (let i = 0; i < 4; i++) B.tor(0.6, 0.02, '#e8ecf2', 'metal', [0, -0.6 + i * 0.5, 0.85], [PI / 2, 0, 0]).scale.set(1 - Math.abs(i - 1.5) * 0.25, 1 - Math.abs(i - 1.5) * 0.25, 1);
  B.glow(2.2, c, [0, 0.15, 0.9], null, 0.55);
  B.glow(0.9, '#ffffff', [0, 0.15, 0.9], null, 0.8);
});

more('cannon', (B, p) => {
  const c = p.multi ? '#bff6ff' : p.c || '#c1121f';
  B.rbox([1.45, 0.28, 0.5], IRON, 'metal', [0, -0.9, 0.35], null, null, 0.06);
  for (const sx of [-0.55, 0.55]) { B.cyl(0.2, 0.2, 0.12, '#3a3f4a', 'metal', [sx, -0.95, 0.65], [0, 0, PI / 2], null, 18); B.tor(0.2, 0.03, BRASS, 'gold', [sx, -0.95, 0.72]); for (let i = 0; i < 6; i++) B.box([0.03, 0.36, 0.03], BRASS, 'gold', [sx, -0.95, 0.7]).rotation.set(0, 0, i * PI / 6); }
  B.rivets([-0.55, -0.3, 0.52], [0.55, -0.3, 0.52], 6, '#9aa3ad', 0.035);
  for (let i = 0; i < 5; i++) B.coin([-0.5 + i * 0.25, -0.65, 0.55], [PI / 2, 0, 0], null, 0.45);
  B.rbox([0.25, 0.4, 0.2], '#3a3f4a', 'metal', [0.75, -0.3, 0.45], null, null, 0.05);
  B.ball(0.06, c, 'neon', [0.75, -0.2, 0.57], null, null, 10);
  B.glow(0.35, c, [0.75, -0.2, 0.6], null, 0.8);
  B.glow(1.0, c, [0.15 + 0.0, 1.5, 1.55], null, 0.5);
});

more('obelisk', (B, p) => {
  const c = p.c || '#2453c7';
  backplate(B, '#3a3f4a', '#9fd3ff', 0.9, 1.0);
  B.cyl(0.08, 0.08, 1.1, '#9fd3ff', 'neonT', [0, 0.25, 0.95], [PI / 2, 0, 0], null, 10);
  const ring = B.pivot([0, -1.25, 1.7]);
  for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; B.oct(0.12, c, 'gem', [Math.cos(a) * 0.8, 0, Math.sin(a) * 0.8], [0.7, 1.5, 0.7], null, ring); }
  B.spin(ring, 'y', -0.8);
  B.glow(2.4, '#9fd3ff', [0, 0.2, 1.7], null, 0.35);
});

more('bow', (B) => {
  B.rbox([0.22, 0.32, 0.06], '#2ec4b6', 'gem', [-0.15, 0.1, 0.48], [0, 0, 0.75], null, 0.03);
  for (let i = 0; i < 6; i++) B.ball(0.035, GOLD, 'gold', [-0.15 + Math.cos(0.75) * (i - 2.5) * 0.35, 0.1 + Math.sin(0.75) * (i - 2.5) * 0.35, 0.48], null, null, 8);
  B.tor(0.27, 0.025, GOLD, 'gold', [0.43, -0.75, 0.62], [PI / 2, 0, -0.3]);
  B.seam([0.3, -0.7, 0.9], [0.68, 0.4, 0.88], '#e9d8b0', 8);
  for (let i = 0; i < 4; i++) { B.cone(0.04, 0.12, '#d7dde6', 'metal', [0.73 + i * 0.05, 1.12, 0.55 + (i % 2) * 0.1], [0, 0, -0.3], null, 4); B.feather(0.16, 0.12, i % 2 ? '#e63946' : WHITE, 'plastic', [0.6 + i * 0.05, 0.58, 0.55 + (i % 2) * 0.1], 1.27, null, 1); }
  B.glow(1.0, '#2ec4b6', [-0.15, 0.1, 0.65], null, 0.35);
});

more('tower', (B, p) => {
  const s = p.size || 1, st = p.stone || '#cfd6e0';
  backplate(B, IRON, p.c || '#5fe0b0', 0.9, 1.1);
  const pv = B.pivot([0, 0.35 * s, 1.9 * s]);
  B.bob(pv, 0.1, 1.2);
  for (let r = 0; r < 6; r++) for (let i = 0; i < 10; i++) { const a = i / 10 * PI * 2 + (r % 2) * 0.31; B.box([0.3 * s, 0.025, 0.02], shade(st, -0.35), 'dark', [Math.sin(a) * 0.6 * s, (-0.85 + r * 0.33) * s, Math.cos(a) * 0.6 * s]).rotation.set(0, a + PI / 2, 0); }
  B.half(0.14 * s, 0.05, '#4a2a16', 'wood', [0, -0.75 * s, 0.6 * s], [PI / 2, 0, 0], pv, PI / 2);
  B.rbox([0.28 * s, 0.3 * s, 0.05], '#4a2a16', 'wood', [0, -0.88 * s, 0.6 * s], null, pv, 0.02);
  B.cyl(0.02, 0.02, 0.9 * s, '#d7dde6', 'metal', [0, 2.6 * s, 0], null, pv, 6);
  const flag = B.rbox([0.4 * s, 0.24 * s, 0.02], p.c || '#5fe0b0', 'cloth', [0.2 * s, 2.92 * s, 0], null, pv, 0.01);
  B.anims.push((t) => { flag.rotation.y = Math.sin(t * 3) * 0.3; });
  for (let i = 0; i < 6; i++) B.ball(0.07 * s, '#6b8a4a', 'plastic', [Math.sin(i * 1.3) * 0.75 * s, -1.05 * s, Math.cos(i * 1.3) * 0.75 * s], [1.3, 0.7, 1.3], pv, 10);
  B.glow(1.2 * s, '#ffd77a', [0, 0, 0], pv, 0.25);
});

more('crown', (B, p) => {
  const s = p.size || 1;
  const pv = B.pivot([0, 1.25 + 0.5 * s, 1.0 * s], [0.35, 0, 0]);
  B.spin(pv, 'y', 0.6); B.bob(pv, 0.08, 1.5);
  B.cyl(0.66 * s, 0.62 * s, 0.25 * s, p.c === GOLD || !p.c ? '#7a1f2a' : shade(p.c, -0.3), 'cloth', [0, 0.05 * s, 0], null, pv, 28);
  for (let i = 0; i < 24; i++) { const a = i / 24 * PI * 2; B.ball(0.03 * s, '#f6f1e6', 'plastic', [Math.sin(a) * 0.76 * s, 0.13 * s, Math.cos(a) * 0.76 * s], null, pv, 6); }
  for (let i = 0; i < 4; i++) { const a = i / 4 * PI * 2; B.tor(0.62 * s, 0.03 * s, p.c || GOLD, p.k || 'gold', [0, 0.2 * s, 0], [0, a, 0], pv, PI).scale.set(1, 0.8, 1); }
  B.ball(0.13 * s, p.c || GOLD, p.k || 'gold', [0, 0.72 * s, 0], null, pv, 16);
  for (let i = 0; i < 4; i++) B.rbox([0.05 * s, 0.2 * s, 0.05 * s], p.c || GOLD, p.k || 'gold', [0, 0.93 * s, 0], [0, 0, i * PI / 2], pv, 0.015);
  B.gem(0.09 * s, '#e63946', [0, 0.93 * s, 0.06 * s], null, pv);
  B.glow(2.4 * s, '#fff1a8', [0, 0.4 * s, 0], pv, 0.3);
});

more('reactor', (B, p) => {
  const c = p.c || '#7fe7ff', s = p.size || 1;
  for (const sx of [-0.4, 0.4]) { B.cyl(0.05, 0.05, 0.9, '#9aa3ad', 'metal', [sx, -0.6, 0.45], [0.8, 0, 0], null, 8); B.tor(0.06, 0.02, BRASS, 'gold', [sx, -0.45, 0.6], [0.8, 0, 0]); }
  for (let i = 0; i < 5; i++) { B.rbox([0.12, 0.06, 0.03], i < 3 ? '#5fd0a0' : '#3a3f4a', i < 3 ? 'neon' : 'metal', [-0.3 + i * 0.15, -0.65, 0.39], null, null, 0.01); }
  B.rbox([0.8, 0.22, 0.04], '#1a1f2a', 'dark', [0, 0.45, 0.39], null, null, 0.02);
  for (let i = 0; i < 3; i++) B.box([0.18, 0.03, 0.02], c, 'neon', [-0.25 + i * 0.25, 0.45, 0.42]);
  B.glow(2.2 * s, c, [0, 0, 1.05 * s], null, 0.6);
  B.glow(1.0 * s, '#ffffff', [0, 0, 1.05 * s], null, 0.7);
});

more('orbit', (B, p) => {
  backplate(B, '#3a3040', p.core || '#b77bff', 0.8, 0.8);
  B.glow(0.7, p.core || '#b77bff', [0, 0.3, 0.3], null, 0.8);
  if (p.mode === 'runes') B.glow(4, '#b77bff', [0, 0, -0.5], null, 0.18);
});

more('arcSphere', (B) => {
  backplate(B, '#3a3040', '#b77bff', 0.9, 0.9);
  const pv = B.pivot([0, 0.35, 1.7]);
  B.bob(pv, 0.08, 1.3);
  B.glow(2.8, '#b77bff', [0, 0, 0], pv, 0.35);
  B.glow(0.9, '#ffffff', [0, 0, 0], pv, 0.6);
  for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; B.ball(0.05, '#e9d5ff', 'neon', [Math.cos(a) * 1.07, Math.sin(a) * 1.07, 0], null, pv, 8); }
  B.sparkle(26, [2.4, 2.4, 2.4], '#e2c4ff', [0, 0.35, 1.7], 0.07, 0.3);
});

more('staffs', (B) => {
  B.rbox([1.0, 0.42, 0.46], '#3a1f4a', 'leather', [0, -0.2, 0.3], null, null, 0.08);
  B.seam([-0.45, 0.0, 0.54], [0.45, 0.0, 0.54], '#e2c4ff', 9);
  B.emblem('star', [0, -0.25, 0.55], 0.55);
  for (const [r, c] of [[-0.5, '#ff5a1f'], [0, '#b77bff'], [0.5, '#2f9bff']]) { const x = -Math.sin(r) * 1.95, y = -0.2 + Math.cos(r) * 1.95; B.glow(0.9, c, [x, y, 0.5], null, 0.75); }
  for (let i = 0; i < 3; i++) B.feather(0.4, 0.2, ['#ff5a1f', '#b77bff', '#2f9bff'][i], 'plastic', [-0.3 + i * 0.3, -0.45, 0.6], -1.4, null, 1);
});

more('bigRing', (B, p) => {
  if (p.saturn) { const pv = B.pivot([0, 0.35, 1.5]); B.glow(2.6, '#7fb0ff', [0, 0, 0], pv, 0.35); for (let i = 0; i < 4; i++) B.tor(0.605, 0.01, '#9fc4ff', 'neon', [0, (i - 1.5) * 0.22, 0], [PI / 2, 0, 0], pv).scale.set(Math.cos((i - 1.5) * 0.38), Math.cos((i - 1.5) * 0.38), 1); return; }
  backplate(B, '#3a3040', '#e9d5ff', 0.9, 0.9);
  const pv = B.pivot([0, 0.35, 1.0]);
  B.spin(pv, 'z', 0.4);
  for (let i = 0; i < 24; i++) { const a = i / 24 * PI * 2; B.cone(0.05, 0.22, GOLD, 'gold', [Math.cos(a) * 2.12, Math.sin(a) * 2.12, 0], [0, 0, a - PI / 2], pv, 4); }
  for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; B.gem(0.1, '#b77bff', [Math.cos(a) * 1.62, Math.sin(a) * 1.62, 0.08], null, pv); }
  B.glow(4.2, '#b77bff', [0, 0, 0], pv, 0.2);
});

more('portal', (B) => {
  backplate(B, '#3a3040', '#b77bff', 0.8, 0.8);
  const pv = B.pivot([0, 0.4, 1.15]);
  for (let i = 0; i < 16; i++) { const a = i / 16 * PI * 2; B.rbox([0.16, 0.36, 0.3], i % 2 ? '#4a4f5a' : '#59606b', 'stone', [Math.cos(a) * 1.4, Math.sin(a) * 1.4, 0], [0, 0, a], pv, 0.04); }
  for (let i = 0; i < 4; i++) B.box([0.12, 0.03, 0.02], '#d9a8ff', 'neon', [Math.cos(i * PI / 2 + PI / 4) * 1.4, Math.sin(i * PI / 2 + PI / 4) * 1.4, 0.17], [0, 0, i * PI / 2 + PI / 4], pv);
  B.glow(3.2, '#9d4edd', [0, 0, 0.05], pv, 0.45);
  B.sparkle(30, [2.6, 2.6, 0.8], '#e2c4ff', [0, 0.4, 1.25], 0.07, 0.4);
});

more('galaxy', (B) => {
  backplate(B, '#3a3040', '#ffcf4a', 0.8, 0.8);
  B.glow(1.8, '#ffcf4a', [0, 0.5, 1.4], null, 0.6);
  B.glow(4.2, '#b77bff', [0, 0.5, 1.4], null, 0.18);
});

more('clockwork', (B) => {
  B.rbox([1.78, 1.98, 0.06], '#8a6a3a', 'metal', [0, -0.05, 0.14], null, null, 0.04);
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) B.ball(0.05, BRASS, 'gold', [sx * 0.8, sy * 0.9, 0.18], [1, 1, 0.6], null, 10);
  const pend = B.pivot([0, -0.6, 0.48]);
  B.cyl(0.015, 0.015, 0.7, BRASS, 'gold', [0, -0.35, 0], null, pend, 6);
  B.cyl(0.12, 0.12, 0.04, GOLD, 'gold', [0, -0.72, 0], [PI / 2, 0, 0], pend, 18);
  B.anims.push((t) => { pend.rotation.z = Math.sin(t * 2.4) * 0.4; });
  for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; B.box([0.02, i % 3 ? 0.04 : 0.08, 0.01], DARK, 'dark', [Math.sin(a) * 0.35, 1.25 + Math.cos(a) * 0.35, 0.61]).rotation.set(0, 0, -a); }
  for (let i = 0; i < 3; i++) { B.cyl(0.04, 0.04, 0.3, '#9aa3ad', 'metal', [-0.75 + i * 0.05, 0.85, 0.3], null, null, 8); }
  B.glow(0.8, '#b9f2ff', [0, 1.25, 0.7], null, 0.3);
});

more('throne', (B, p) => {
  const s = p.size || 1, c = p.c || GOLD;
  const pv = B.pivot([0, -0.1 * s, 0.9 * s]);
  B.bob(pv, 0.05, 1.2);
  for (let i = 0; i < 9; i++) B.ball(0.04 * s, shade(c, 0.3), 'gold', [-0.6 * s + i * 0.15 * s, -0.47 * s, 0.5 * s], null, pv, 8);
  for (let r = 0; r < 4; r++) for (let i = 0; i < 4; i++) B.ball(0.04 * s, shade(p.cushion || '#7a1f2a', 0.2), 'cloth', [(-0.45 + i * 0.3) * s, (0.0 + r * 0.32) * s, -0.24 * s], [1, 1, 0.5], pv, 8);
  for (const sx of [-1, 1]) { B.tor(0.12 * s, 0.03 * s, c, 'gold', [sx * 0.8 * s, -0.6 * s, 0.4 * s], [0, PI / 2, 0], pv); B.rbox([0.06 * s, 1.6 * s, 0.06 * s], shade(c, 0.15), 'gold', [sx * 0.74 * s, 0.55 * s, -0.28 * s], null, pv, 0.02); }
  B.coin([0, 1.15 * s, -0.27 * s], [PI / 2, 0, 0], pv, 0.9 * s);
  B.glow(1.0 * s, p.gem || '#e63946', [0, 1.55 * s, -0.1 * s], pv, 0.5);
  B.rbox([1.3 * s, 0.05, 0.6 * s], '#7a1f2a', 'cloth', [0, -0.73 * s, 0.75 * s], [0.5, 0, 0], pv, 0.02);
  for (let i = 0; i < 8; i++) B.cyl(0.015, 0.015, 0.12 * s, GOLD, 'gold', [-0.6 * s + i * 0.17 * s, -0.98 * s, 0.98 * s], null, pv, 5);
});

more('comet', (B) => {
  backplate(B, '#3a3f4a', '#ffe08a', 0.8, 0.8);
  const pv = B.pivot([0, 0.5, 0.5]);
  B.anims.push((t) => { pv.rotation.z = Math.sin(t * 1.4) * 0.12; pv.rotation.x = Math.sin(t * 1.1) * 0.06; });
  B.oct(0.36, '#8a7b6a', 'stone', [0, 0.2, 0.2], [1, 0.9, 1], [0.4, 0.3, 0], pv);
  for (let i = 0; i < 6; i++) B.coin([Math.sin(i) * 0.25, 0.2 + Math.cos(i * 1.3) * 0.25, 0.2 + Math.sin(i * 2) * 0.25], [i, i, 0], pv, 0.45);
  for (let i = 0; i < 8; i++) { const t = i / 7; B.glow(1.4 * (1 - t * 0.75), t < 0.4 ? '#fff6c8' : '#ff9a2e', [Math.sin(t * 3) * 0.4 * t, 0.2 + t * 2.4, 0.2 + t * 2.6], pv, 0.5); }
});

more('blackhole', (B) => {
  backplate(B, '#2a2230', '#ff7a1a', 0.8, 0.8);
  const pv = B.pivot([0, 0.4, 1.7], [0.6, 0, 0.2]);
  B.glow(3.6, '#ff7a1a', [0, 0, 0], pv, 0.3);
  B.glow(1.8, '#ffffff', [0, 0, 0], pv, 0.25);
  const jet = B.pivot([0, 0, 0], null, pv);
  for (const sy of [-1, 1]) for (let i = 0; i < 5; i++) B.glow(0.5 - i * 0.06, '#9fc4ff', [0, sy * (0.7 + i * 0.35), 0], jet, 0.6);
});

more('sunwheel', (B) => {
  backplate(B, '#6e5a3a', '#ffe066', 0.8, 0.8);
  const pv = B.pivot([0, 0.4, 1.0]);
  B.spin(pv, 'z', 0.35);
  B.glow(2.2, '#ffcf4a', [0, 0, 0.1], pv, 0.55);
  B.glow(4.5, '#ff9a2e', [0, 0, 0], pv, 0.18);
  for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2 + PI / 8; B.gem(0.08, '#ff9a2e', [Math.cos(a) * 1.3, Math.sin(a) * 1.3, 0.12], null, pv); }
  B.tor(0.95, 0.03, '#fff1a8', 'neon', [0, 0, 0.06], null, pv);
});

more('citadel', (B) => {
  const pv = B.pivot([0, 1.7, 1.5]);
  B.bob(pv, 0.12, 1);
  for (let i = 0; i < 14; i++) { const a = i / 14 * PI * 2; B.rbox([0.18, 0.16, 0.18], '#cfd6e0', 'stone', [Math.cos(a) * 1.25, 0.06, Math.sin(a) * 1.25], [0, -a, 0], pv, 0.03); }
  for (let i = 0; i < 10; i++) B.ball(0.12 + (i % 3) * 0.04, '#5a8a4a', 'plastic', [Math.sin(i * 2.2) * 1.0, 0.02, Math.cos(i * 2.2) * 1.0], [1, 0.7, 1], pv, 10);
  for (const [x, z, h] of [[0, 0, 2.0], [-0.8, 0.4, 1.3], [0.8, 0.4, 1.4]]) { B.cyl(0.01, 0.01, 0.4, '#d7dde6', 'metal', [x, h * 1.45 + 0.2, z], null, pv, 4); const f = B.rbox([0.24, 0.14, 0.01], '#5fb8ff', 'cloth', [x + 0.12, h * 1.45 + 0.32, z], null, pv, 0.005); B.anims.push((t) => { f.rotation.y = Math.sin(t * 3 + x) * 0.4; }); }
  for (let i = 0; i < 4; i++) { const st = B.cyl(0.02, 0.02, 0.8, '#9fd3ff', 'neonT', [Math.cos(i * 1.6) * 0.7, -1.3 - i * 0.1, Math.sin(i * 1.6) * 0.5], null, pv, 6); B.pulse(st, 0.2, 3 + i); }
  B.glow(3.6, '#9fd3ff', [0, 0.6, 0], pv, 0.22);
  backplate(B, IRON, '#9fd3ff', 0.8, 0.8);
});

more('halo', (B) => {
  const pv = B.pivot([0, 2.35, -0.5]);
  B.bob(pv, 0.05, 2);
  B.glow(2.0, '#fff1a8', [0, 0, 0], pv, 0.4);
  for (const sx of [-1, 1]) { const w = B.pivot([sx * 0.35, 0.45, 0.25], [0, sx * 0.4, 0]); for (let i = 0; i < 5; i++) { const a = 0.9 - i * 0.35; B.feather(0.9 - i * 0.1, 0.3, i % 2 ? '#fff6e0' : '#ffffff', 'plastic', [0, 0, i * 0.01], a, w, sx); } B.anims.push((t) => { w.rotation.y = sx * (0.4 + Math.sin(t * 2.4) * 0.25); }); }
  B.rbox([0.5, 0.4, 0.15], '#e8dcae', 'gold', [0, 0.45, 0.12], null, null, 0.06);
  B.emblem('star', [0, 0.45, 0.22], 0.6);
});

more('columns', (B) => {
  for (const x of [-0.95, -0.32, 0.32, 0.95]) for (let f = 0; f < 8; f++) { const a = f / 8 * PI * 2; B.box([0.015, 2.2, 0.015], '#d8d0c0', 'stone', [x + Math.cos(a) * 0.19, 0.28, 0.65 + Math.sin(a) * 0.19]); }
  for (const x of [-0.95, -0.32, 0.32, 0.95]) { B.tor(0.2, 0.04, GOLD, 'gold', [x, 1.35, 0.65], [PI / 2, 0, 0]); B.tor(0.22, 0.04, GOLD, 'gold', [x, -0.78, 0.65], [PI / 2, 0, 0]); }
  for (let i = 0; i < 9; i++) B.emblem('star', [-1.0 + i * 0.25, 1.6, 1.11], 0.25);
  B.rbox([2.3, 0.08, 0.06], GOLD, 'gold', [0, 1.45, 1.1], null, null, 0.02);
  B.glow(1.4, '#fff1a8', [0, 1.62, 1.2], null, 0.5);
  for (const x of [-0.64, 0.64]) B.glow(1.3, '#fff1a8', [x, 0.3, 0.8], null, 0.35);
});

more('stream', (B, p) => {
  B.rbox([0.8, 0.8, 0.3], '#3a3040', 'metal', [0, -0.5, 0.3], null, null, 0.08);
  B.tor(0.3, 0.06, GOLD, 'gold', [0, -0.5, 0.46]);
  B.cyl(0.26, 0.26, 0.04, p.glow || '#ffe08a', 'neon', [0, -0.5, 0.46], [PI / 2, 0, 0], null, 20);
  B.glow(1.4, p.glow || '#ffe08a', [0, -0.5, 0.6], null, 0.6);
  B.rivets([-0.32, -0.12, 0.46], [0.32, -0.12, 0.46], 4, BRASS, 0.03);
});

more('hoard', (B) => {
  const pv = B.pivot([0, 0.3, 1.5]);
  B.spin(pv, 'y', 0.3); B.bob(pv, 0.1, 1.1);
  B.cyl(0.08, 0.06, 0.7, GOLD, 'gold', [0.35, 0.35, 0.2], [0.2, 0, -0.5], pv, 8);
  B.ball(0.18, GOLD, 'gold', [0.55, 0.62, 0.25], [1, 0.5, 1], pv, 12);
  B.lathe([[0, 0], [0.12, 0], [0.15, 0.12], [0.1, 0.25], [0.12, 0.32], [0, 0.32]], GOLD, 'gold', [-0.4, 0.1, 0.4], [0.3, 0, 0.4], pv, 18, 'goblet');
  B.cyl(0.12, 0.12, 0.35, '#e8ecf2', 'metal', [0.1, 0.0, -0.6], [0.6, 0, 0.3], pv, 12);
  for (let i = 0; i < 4; i++) B.gem(0.09, ['#e63946', '#4cc9f0', '#2ec4b6', '#b77bff'][i], [Math.sin(i * 1.7) * 0.7, -0.4 + i * 0.12, Math.cos(i * 1.7) * 0.7], [i, 0, 0], pv);
  B.glow(3, '#ffe08a', [0, 0, 0], pv, 0.3);
  backplate(B, '#6e5a3a', '#ffe08a', 0.8, 0.8);
});

more('primal', (B) => {
  const pv = B.pivot([0, 0.4, 1.3]);
  B.spin(pv, 'y', 0.6);
  for (let i = 0; i < 48; i++) { const a = i / 48 * PI * 2; B.box([0.03, 0.2, 0.06], shade(GOLD, -0.15), 'gold', [Math.cos(a) * 1.15, Math.sin(a) * 1.15, 0], [0, 0, a], pv); }
  for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; for (const z of [0.12, -0.12]) B.ball(0.035, '#fff1a8', 'gold', [Math.cos(a) * 0.92, Math.sin(a) * 0.92, z], null, pv, 8); }
  B.glow(3.2, '#ffe08a', [0, 0, 0], pv, 0.35);
});

more('anvil', (B) => {
  const pv = B.pivot([0, -0.1, 1.0]);
  B.rbox([1.3, 0.12, 0.85], '#5a3a22', 'wood', [0, -1.0, 0], null, pv, 0.03);
  B.rivets([-0.5, -0.85, 0.36], [0.5, -0.85, 0.36], 4, '#9aa3ad', 0.035, pv);
  B.glow(1.2, '#ffb347', [0.25, 0.3, 0.1], pv, 0.6);
  B.rbox([0.5, 0.5, 0.12], '#4a3a2a', 'leather', [0, -0.2, 0.15], null, null, 0.05);
  for (let i = 0; i < 3; i++) B.cyl(0.03, 0.03, 0.45, '#9aa3ad', 'metal', [-0.15 + i * 0.15, -0.2, 0.25], [0, 0, 0.1 * (i - 1)], null, 6);
});

more('aura', (B) => {
  const pv = B.pivot([0, 0.6, -0.5]);
  B.glow(6.5, '#ffe08a', [0, 0, 0], pv, 0.25);
  B.glow(3.2, '#fff1a8', [0, 0.4, 0], pv, 0.25);
  const sym = B.pivot([0, 0, 1.6], null, pv);
  for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; B.rbox([0.04, 0.5, 0.02], '#fff1a8', 'neon', [Math.cos(a) * 1.0, Math.sin(a) * 1.0, 0], [0, 0, a], sym, 0.01); }
  B.tor(0.75, 0.025, '#fff1a8', 'neon', [0, 0, 0], null, sym);
  B.emblem('star', [0, 0, 0.05], 1.6, sym);
  B.spin(sym, 'z', -0.4);
  B.rbox([0.5, 0.5, 0.15], GOLD, 'gold', [0, 0.3, 0.12], null, null, 0.06);
});
