// ── Grundformen, Teil 2: Flügel und Kreaturen ──
function membraneGeo(pts) {
  const s = new THREE.Shape();
  s.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, l = Math.hypot(mx, my) || 1;
    // Bogen zwischen zwei Knochenspitzen nach innen ziehen
    if (i > 1) s.quadraticCurveTo(mx - (mx / l) * 0.35, my - (my / l) * 0.35, x1, y1); else s.lineTo(x1, y1);
  }
  s.lineTo(0, 0);
  return new THREE.ShapeGeometry(s, 8);
}

A.wings = (B, p) => {
  const n = p.feathers || 7, span = p.span || 2.4, cols = p.cols || [p.c || WHITE], k = p.k || 'plastic';
  const mount = p.mount || GOLD;
  B.straps(p.strap || shade(mount, -0.45), 'leather', { metal: mount });
  B.rbox([0.62, 0.55, 0.26], mount, 'gold', [0, 0.45, 0.14], null, null, 0.08);
  B.tor(0.17, 0.035, shade(mount, 0.2), 'gold', [0, 0.45, 0.28]);
  B.gem(0.1, cols[Math.min(1, cols.length - 1)], [0, 0.45, 0.3]);
  B.glow(0.5, cols[0], [0, 0.45, 0.36], null, 0.5);
  const sets = p.four ? [[0.62, 0.15, 1], [0.05, -0.35, 0.72]] : [[0.45, 0.05, 1]];
  const col = (t) => cols[Math.min(cols.length - 1, Math.floor(t * cols.length))];
  for (const [yy, tilt, sc] of sets) {
    for (const side of [-1, 1]) {
      const pv = B.pivot([side * 0.25, yy, 0.32], [0.12, -side * 0.3, 0]);
      const arm = 0.95 + tilt, armL = span * sc * 0.55;
      // Flügelknochen (Arm) mit Gelenk
      const ax = side * Math.cos(arm) * armL, ay = Math.sin(arm) * armL;
      if (p.style !== 'membrane') {
        B.cyl(0.08, 0.05, armL, p.bone || shade(cols[0], -0.15), p.style === 'light' ? 'neon' : 'gold', [ax / 2, ay / 2, 0.06], [0, 0, Math.atan2(ay, ax) - PI / 2], pv, 10);
        B.ball(0.09, p.bone || shade(cols[0], -0.15), p.style === 'light' ? 'neon' : 'gold', [ax, ay, 0.06], null, pv, 12);
      }
      if (p.style === 'membrane') {
        const tips = [];
        const bone = p.bone || col(0), skin = p.skin || col(0);
        for (let i = 0; i < n; i++) {
          const t = n === 1 ? 0 : i / (n - 1), a = 1.05 - t * 1.9 + tilt, L = span * sc * (1 - 0.35 * t);
          const x = side * Math.cos(a) * L, y = Math.sin(a) * L;
          tips.push([x, y]);
          B.cyl(0.06 - t * 0.02, 0.025, L, bone, 'gold', [x / 2, y / 2, 0.02], [0, 0, Math.atan2(y, x) - PI / 2], pv, 8);
          B.ball(0.055, bone, 'gold', [x / 2, y / 2, 0.02], null, pv, 8);
          B.cone(0.05, 0.22, shade(bone, 0.25), 'gold', [x * 1.04, y * 1.04, 0.02], [0, 0, Math.atan2(y, x) - PI / 2], pv, 8);
        }
        const g = membraneGeo([[0, 0], ...(side > 0 ? tips : tips.slice())]);
        B.mesh(g, skin, p.skinK === 'gold' ? 'skin' : 'skin', [0, 0, 0], null, pv);
        B.mesh(g, shade(skin, -0.3), 'skin', [0, 0, -0.015], null, pv);
        B.cone(0.08, 0.35, shade(bone, 0.25), 'gold', [side * Math.cos(1.05 + tilt) * span * sc * 1.06, Math.sin(1.05 + tilt) * span * sc * 1.06 + 0.1, 0.02], [0, 0, -side * 0.3], pv, 8);
      } else {
        if (p.style === 'crystal') { const tips = []; for (let i = 0; i < n; i++) { const t = n === 1 ? 0 : i / (n - 1), a = 1.05 - t * 2.05 + tilt, L = span * sc * (1 - 0.42 * t); tips.push([side * Math.cos(a) * L * 0.98, Math.sin(a) * L * 0.98]); } const g = membraneGeo([[0, 0], ...tips]); B.mesh(g, col(0.5), 'glass', [0, 0, -0.01], null, pv); B.mesh(g, col(0.2), 'neonT', [0, 0, -0.02], null, pv).scale.setScalar(0.96); }
        // Deckfedern (kurz), Schwungfedern (lang)
        const rows = [{ n: n, len: 1, w: p.style === 'metal' ? 0.3 : 0.26, z: 0 }, { n: Math.max(3, n - 2), len: 0.58, w: 0.22, z: 0.03 }, { n: Math.max(3, n - 3), len: 0.32, w: 0.18, z: 0.06 }];
        rows.forEach((r, ri) => {
          for (let i = 0; i < r.n; i++) {
            const t = r.n === 1 ? 0 : i / (r.n - 1);
            const a = 1.05 - t * 2.05 + tilt;
            const L = span * sc * (1 - 0.42 * t) * r.len;
            const c = ri === 0 ? col(t) : col(Math.max(0, t * 0.5));
            const base = ri === 0 ? [side * Math.cos(arm) * armL * (1 - t) * 0.55, Math.sin(arm) * armL * (1 - t) * 0.55] : [side * Math.cos(arm) * armL * (1 - t) * 0.35, Math.sin(arm) * armL * (1 - t) * 0.35];
            const rz = side > 0 ? a : a;
            if (p.style === 'crystal') B.oct(L / 2, c, 'gem', [base[0] + side * Math.cos(a) * L / 2, base[1] + Math.sin(a) * L / 2, r.z + i * 0.012], [1, 0.12, 0.07], [0, 0, side > 0 ? a : -a], pv);
            else if (p.style === 'metal') B.rbox([L, r.w * sc, 0.045], ri % 2 ? shade(c, -0.12) : c, k === 'plastic' ? 'metal' : k, [base[0] + side * Math.cos(a) * L / 2, base[1] + Math.sin(a) * L / 2, r.z + i * 0.012], [0, 0, side > 0 ? a : -a], pv, 0.02);
            else B.feather(L, r.w * sc * 2.0, c, p.style === 'light' ? 'neonT' : k, [base[0], base[1], r.z + i * 0.012], rz, pv, side);
            if (p.tips && ri === 0) { B.ball(0.06, p.tips, 'neon', [base[0] + side * Math.cos(a) * L * 0.97, base[1] + Math.sin(a) * L * 0.97, r.z + 0.04], null, pv, 8); if (i % 2 === 0) B.glow(0.3, p.tips, [base[0] + side * Math.cos(a) * L, base[1] + Math.sin(a) * L, 0.1], pv, 0.7); }
          }
        });
      }
      const ph = sc === 1 ? 0 : 0.6;
      // Flügelschlag nach hinten: die Spitzen schwingen vom Rücken weg und wieder zurück
      B.anims.push((t) => { const f = (Math.sin(t * (p.flap || 2.2) + ph) + 1) / 2; pv.rotation.y = -side * (0.25 + f * 0.75 + WALK.k * 0.2); pv.rotation.x = 0.12 + f * 0.12; });
    }
  }
  if (p.sparkle) B.sparkle(p.sparkleN || 40, [span * 2.2, span * 1.3, 1.2], p.sparkle, [0, 0.4, 0.6], 0.09, p.rise || 0.5);
};

// Drache aus Kugelketten: Hals, Kopf mit Kiefer, Hörnern und Zähnen, Rückenzacken, Flughäute, Schwanz mit Spitze
function dragon(B, at, s, c, c2, par) {
  const [x, y, z] = at;
  const pv = B.pivot([x, y, z], [0, 0, 0], par);
  B.ball(0.45 * s, c, 'plastic', [0, 0, 0], [1, 0.82, 1.3], pv, 28);
  for (let i = 0; i < 5; i++) B.ball(0.2 * s, c2, 'plastic', [0, -0.25 * s, -0.35 * s + i * 0.17 * s], [1.2, 0.45, 0.6], pv, 14);
  // Hals
  const neck = [[0, 0.2, 0.42], [0, 0.38, 0.55], [0, 0.55, 0.65], [0, 0.66, 0.78]];
  neck.forEach(([nx, ny, nz], i) => { B.ball((0.2 - i * 0.02) * s, c, 'plastic', [nx, ny * s, nz * s], null, pv, 16); B.cone(0.05 * s, 0.16 * s, c2, 'plastic', [nx, (ny + 0.17) * s, nz * s], [-0.4, 0, 0], pv, 6); });
  // Kopf
  const hz = 0.95 * s, hy = 0.72 * s;
  B.rbox([0.38 * s, 0.28 * s, 0.4 * s], c, 'plastic', [0, hy, hz], null, pv, 0.08 * s);
  B.rbox([0.27 * s, 0.14 * s, 0.32 * s], shade(c, 0.08), 'plastic', [0, hy - 0.02 * s, hz + 0.3 * s], null, pv, 0.05 * s);
  B.rbox([0.24 * s, 0.07 * s, 0.34 * s], shade(c, -0.1), 'plastic', [0, hy - 0.13 * s, hz + 0.22 * s], [0.15, 0, 0], pv, 0.03 * s);
  for (const sx of [-1, 1]) {
    B.ball(0.055 * s, '#ffde4a', 'neon', [sx * 0.15 * s, hy + 0.06 * s, hz + 0.16 * s], [1, 0.7, 0.6], pv, 10);
    B.ball(0.025 * s, DARK, 'dark', [sx * 0.165 * s, hy + 0.06 * s, hz + 0.19 * s], [0.5, 1, 0.5], pv, 6);
    B.ball(0.025 * s, DARK, 'dark', [sx * 0.07 * s, hy + 0.03 * s, hz + 0.46 * s], null, pv, 6);
    for (let h = 0; h < 3; h++) B.cone((0.05 - h * 0.012) * s, 0.14 * s, '#f2e6c8', 'plastic', [sx * (0.13 + h * 0.03) * s, hy + (0.18 + h * 0.1) * s, hz - (0.12 + h * 0.08) * s], [-0.9 - h * 0.3, 0, sx * 0.3], pv, 8);
    for (let t = 0; t < 3; t++) B.cone(0.018 * s, 0.06 * s, '#ffffff', 'plastic', [sx * (0.04 + t * 0.03) * s, hy - 0.1 * s, hz + (0.38 - t * 0.06) * s], [PI, 0, 0], pv, 6);
    // Flughaut
    const wp = B.pivot([sx * 0.25 * s, 0.25 * s, 0], [0, 0, 0], pv);
    const tips = [];
    for (let i = 0; i < 4; i++) { const a = 1.2 - i * 0.5, L = (0.9 - i * 0.12) * s, tx = sx * Math.cos(a) * L, ty = Math.sin(a) * L; tips.push([tx, ty]); B.cyl(0.025 * s, 0.012 * s, L, c, 'plastic', [tx / 2, ty / 2, 0], [0, 0, Math.atan2(ty, tx) - PI / 2], wp, 6); }
    B.mesh(membraneGeo([[0, 0], ...tips]), shade(c2, -0.05), 'skin', [0, 0, 0], [0, 0, 0], wp);
    wp.rotation.y = sx * 0.6;
    B.anims.push((t) => { wp.rotation.z = sx * Math.sin(t * 3.2) * 0.35; });
    // Beine mit Krallen
    B.cyl(0.08 * s, 0.07 * s, 0.32 * s, c, 'plastic', [sx * 0.25 * s, -0.33 * s, 0.25 * s], null, pv, 10);
    for (let cl = -1; cl <= 1; cl++) B.cone(0.025 * s, 0.09 * s, '#f2e6c8', 'plastic', [sx * 0.25 * s + cl * 0.04 * s, -0.5 * s, 0.33 * s], [PI / 2 + 0.6, 0, 0], pv, 6);
  }
  // Rückenzacken
  for (let i = 0; i < 5; i++) B.cone(0.06 * s, 0.18 * s, c2, 'plastic', [0, 0.36 * s - i * 0.02 * s, 0.3 * s - i * 0.2 * s], [-0.3, 0, 0], pv, 6);
  // Schwanz
  for (let i = 0; i < 9; i++) { const r = (0.2 - i * 0.019) * s; B.ball(r, i % 2 ? c : shade(c, -0.08), 'plastic', [Math.sin(i * 0.7) * 0.28 * s, -0.15 * s - i * 0.04 * s, -0.5 * s - i * 0.18 * s], null, pv, 14); if (i % 2 === 0) B.cone(r * 0.35, r * 0.9, c2, 'plastic', [Math.sin(i * 0.7) * 0.28 * s, -0.15 * s - i * 0.04 * s + r, -0.5 * s - i * 0.18 * s], null, pv, 6); }
  B.cone(0.1 * s, 0.24 * s, c2, 'plastic', [Math.sin(8.4) * 0.28 * s, -0.52 * s, -2.12 * s], [-PI / 2, 0, 0], pv, 4).scale.set(1.6, 1, 0.35);
  return pv;
}

A.creature = (B, p) => {
  const kind = p.kind;
  if (kind === 'golem') {
    const S = '#8a7b5a';
    B.straps('#4a3a2a', 'leather', { plain: true });
    B.rbox([1.3, 1.15, 0.9], S, 'stone', [0, -0.15, 0.7], null, null, 0.18);
    B.rbox([0.78, 0.62, 0.66], shade(S, 0.08), 'stone', [0, 0.72, 0.95], null, null, 0.14);
    B.rbox([0.6, 0.12, 0.1], shade(S, -0.2), 'stone', [0, 0.92, 1.28], [0.2, 0, 0], null, 0.04);
    for (const sx of [-0.17, 0.17]) { B.rbox([0.13, 0.09, 0.05], '#ffcf4a', 'neon', [sx, 0.78, 1.29], null, null, 0.02); B.glow(0.35, '#ffcf4a', [sx, 0.78, 1.35], null, 0.8); }
    B.rbox([0.32, 0.06, 0.04], '#3a2a1c', 'dark', [0, 0.58, 1.29], null, null, 0.02);
    for (const sx of [-1, 1]) {
      B.rbox([0.4, 1.1, 0.4], S, 'stone', [sx * 0.86, 0.55, 0.25], [0.75, 0, -sx * 0.2], null, 0.1);
      B.rbox([0.44, 0.34, 0.44], shade(S, -0.1), 'stone', [sx * 0.72, 1.05, -0.35], null, null, 0.1);
      for (let f = -1; f <= 1; f++) B.rbox([0.1, 0.2, 0.1], shade(S, -0.15), 'stone', [sx * 0.72 + f * 0.12, 1.1, -0.6], [0.5, 0, 0], null, 0.03);
      B.rbox([0.38, 0.62, 0.38], S, 'stone', [sx * 0.38, -1.0, 0.85], null, null, 0.1);
      B.ball(0.18, shade(S, -0.15), 'stone', [sx * 0.62, 0.45, 0.9], null, null, 12);
    }
    for (const [x, y, sz] of [[-0.35, 0, 0.14], [0.3, -0.35, 0.12], [0.15, 0.25, 0.1], [-0.2, -0.5, 0.11], [0.45, 0.1, 0.08], [-0.45, -0.3, 0.09]]) { B.oct(sz, GOLD, 'gold', [x, y, 1.15], [1, 1.3, 0.7], [0, 0, x]); B.glow(sz * 3, '#ffe08a', [x, y, 1.2], null, 0.35); }
    for (let i = 0; i < 6; i++) B.box([0.02, 0.3, 0.02], '#ffcf4a', 'neon', [-0.4 + i * 0.16, -0.1 + Math.sin(i) * 0.2, 1.155], [0, 0, i]);
    B.cone(0.15, 0.3, GOLD, 'gold', [0, 1.18, 0.95], null, null, 5);
    B.gem(0.08, '#4cc9f0', [0, 1.12, 1.15]);
  } else if (kind === 'dragonHoard') {
    B.straps('#3a2a1c', 'leather');
    B.lathe([[0, -0.4], [0.72, -0.4], [0.92, 0.0], [0.97, 0.32], [0.9, 0.32], [0.86, 0.0], [0.68, -0.33], [0, -0.33]], '#6e4426', 'wood', [0, -0.7, 0.72], null, null, 28, 'basket');
    for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; B.box([0.03, 0.66, 0.03], '#4a2a16', 'wood', [Math.sin(a) * 0.86, -0.7, 0.72 + Math.cos(a) * 0.86]).rotation.set(Math.cos(a) * -0.25, 0, Math.sin(a) * 0.25); }
    B.tor(0.96, 0.06, GOLD, 'gold', [0, -0.38, 0.72], [PI / 2, 0, 0]);
    B.cone(0.9, 0.6, GOLD, 'gold', [0, -0.05, 0.72], null, null, 16);
    for (let i = 0; i < 18; i++) B.coin([Math.sin(i * 2.4) * (0.2 + (i % 4) * 0.15), -0.3 + (i % 3) * 0.12, 0.72 + Math.cos(i * 2.4) * (0.2 + (i % 4) * 0.13)], [PI / 2 + Math.sin(i) * 0.6, i, 0], null, 0.8);
    for (const [g, x, zz] of [['#e63946', -0.45, 1.25], ['#4cc9f0', 0.4, 1.2], ['#2ec4b6', 0.05, 1.35]]) B.gem(0.11, g, [x, -0.18, zz], [0.4, 0.3, 0]);
    B.cyl(0.04, 0.04, 0.5, GOLD, 'gold', [0.55, -0.1, 0.5], [0.3, 0, -0.4], null, 8);
    B.ball(0.09, '#e63946', 'gem', [0.65, 0.14, 0.58], null, null, 10);
    B.glow(2, '#ffe08a', [0, 0.1, 0.8], null, 0.35);
    const d = dragon(B, [0, 0.55, 0.75], 0.85, '#c0392b', '#f4a261');
    B.anims.push((t) => { d.rotation.y = Math.sin(t * 0.8) * 0.25; });
  } else if (kind === 'dragonBig') {
    const c = '#d4a017', c2 = '#7a1f1f';
    const ring = B.pivot([0, -0.3, -0.5]);
    for (let i = 0; i < 22; i++) { const a = i / 22 * PI * 2 * 0.92 + 0.3; const r = 0.32 - i * 0.009; B.ball(r, i % 2 ? c : shade(c, -0.12), 'gold', [Math.cos(a) * 1.35, -0.45 + i * 0.04, Math.sin(a) * 1.15], null, ring, 16); if (i % 2 === 0) B.cone(r * 0.4, r, c2, 'plastic', [Math.cos(a) * 1.35, -0.45 + i * 0.04 + r * 0.9, Math.sin(a) * 1.15], null, ring, 6); }
    const d = dragon(B, [0.7, 0.9, 0.9], 1.6, c, c2);
    d.rotation.y = -0.35;
    B.anims.push((t) => { d.position.y = 0.9 + Math.sin(t * 1.3) * 0.08; });
    B.glow(1.0, '#ff9a2e', [0.7, 2.05, 2.45], null, 0.4);
    B.sparkle(36, [3, 3, 2.5], '#ffcf4a', [0, 0, 0.6]);
  } else if (kind === 'griffin') {
    const T = '#b98a4e';
    B.straps('#5a3a22', 'leather');
    B.rbox([0.56, 0.14, 0.66], '#5a3a22', 'leather', [0.62, 1.08, -0.3], null, null, 0.05);
    B.rbox([0.6, 0.06, 0.7], '#7a1f2a', 'cloth', [0.62, 1.16, -0.3], null, null, 0.02);
    const pv = B.pivot([0.62, 1.42, 0.05]);
    B.ball(0.42, T, 'plastic', [0, 0, 0], [0.9, 0.85, 1.25], pv, 24);
    for (let i = 0; i < 10; i++) B.feather(0.28, 0.2, i % 2 ? WHITE : shade(WHITE, -0.08), 'plastic', [Math.sin(i * 0.6) * 0.2, 0.25 - i * 0.02, -0.15 + (i % 3) * 0.05], -PI / 2 - 0.3 + i * 0.06, pv, i % 2 ? 1 : -1);
    B.ball(0.3, WHITE, 'plastic', [0, 0.45, -0.3], null, pv, 20);
    B.cone(0.1, 0.3, GOLD, 'gold', [0, 0.4, -0.65], [-PI / 2 - 0.4, 0, 0], pv, 10);
    B.cone(0.06, 0.12, shade(GOLD, -0.3), 'gold', [0, 0.32, -0.6], [-PI / 2 + 0.6, 0, 0], pv, 8);
    for (const sx of [-0.13, 0.13]) { B.ball(0.06, '#ffde4a', 'plastic', [sx, 0.52, -0.52], null, pv, 10); B.ball(0.03, '#111', 'dark', [sx * 1.05, 0.52, -0.57], null, pv, 6); B.feather(0.2, 0.12, WHITE, 'plastic', [sx, 0.7, -0.35], 1.9, pv, sx > 0 ? 1 : -1); }
    for (const sx of [-1, 1]) for (let i = 0; i < 7; i++) { const a = 0.9 - i * 0.26; B.feather(1.15 - i * 0.1, 0.36, i < 2 ? WHITE : i < 4 ? T : shade(T, -0.2), 'plastic', [sx * 0.25, 0.15, 0.15 + i * 0.01], a, pv, sx); }
    for (const sx of [-0.2, 0.2]) { B.cyl(0.05, 0.04, 0.3, GOLD, 'gold', [sx, -0.35, -0.3], null, pv, 8); for (let cl = -1; cl <= 1; cl++) B.cone(0.02, 0.1, '#333', 'dark', [sx + cl * 0.04, -0.5, -0.36], [PI / 2 + 0.4, 0, 0], pv, 6); }
    B.cyl(0.04, 0.02, 0.7, T, 'plastic', [0, -0.1, 0.65], [1.1, 0, 0], pv, 8);
    B.cone(0.08, 0.2, shade(T, -0.3), 'plastic', [0, -0.35, 0.95], [1.6, 0, 0], pv, 8);
    B.bob(pv, 0.04, 2);
  } else if (kind === 'wolf') {
    const G = GOLD;
    B.straps('#5a3a22', 'leather');
    B.rbox([0.5, 0.3, 0.12], G, 'gold', [0, 0.2, 0.12], null, null, 0.05);
    B.emblem('star', [0, 0.2, 0.2], 0.5);
    const pv = B.pivot([1.5, -2.25, 2.1], [0, 0.4, 0]);
    B.rbox([0.62, 0.62, 1.45], G, 'gold', [0, 0.2, 0], null, pv, 0.2);
    B.rbox([0.7, 0.7, 0.5], shade(G, 0.1), 'gold', [0, 0.35, -0.45], null, pv, 0.22);
    B.rbox([0.55, 0.5, 0.5], G, 'gold', [0, 0.62, -0.88], null, pv, 0.14);
    B.rbox([0.3, 0.24, 0.38], shade(G, -0.1), 'gold', [0, 0.52, -1.22], null, pv, 0.08);
    B.ball(0.06, '#222', 'dark', [0, 0.58, -1.42], null, pv, 8);
    B.rbox([0.26, 0.06, 0.3], shade(G, -0.25), 'gold', [0, 0.38, -1.18], null, pv, 0.02);
    for (const sx of [-0.16, 0.16]) {
      B.cone(0.11, 0.28, G, 'gold', [sx, 0.97, -0.82], null, pv, 4);
      B.cone(0.06, 0.16, '#ffe9a0', 'gold', [sx, 0.95, -0.85], null, pv, 4);
      B.rbox([0.1, 0.06, 0.03], '#7fe7ff', 'neon', [sx, 0.7, -1.13], null, pv, 0.015);
      B.glow(0.3, '#7fe7ff', [sx, 0.7, -1.2], pv, 0.8);
    }
    for (let i = 0; i < 6; i++) B.cone(0.06, 0.2, shade(G, 0.2), 'gold', [0, 0.55, -0.3 + i * 0.22], [-0.4, 0, 0], pv, 5);
    const legs = [];
    for (const [x, z] of [[-0.2, -0.5], [0.2, -0.5], [-0.2, 0.5], [0.2, 0.5]]) { const lg = B.pivot([x, -0.05, z], null, pv); B.rbox([0.17, 0.55, 0.17], shade(G, -0.15), 'gold', [0, -0.27, 0], null, lg, 0.05); B.rbox([0.2, 0.08, 0.24], shade(G, -0.3), 'gold', [0, -0.55, -0.03], null, lg, 0.03); legs.push(lg); }
    const tail = B.pivot([0, 0.45, 0.72], [0.9, 0, 0], pv);
    for (let i = 0; i < 5; i++) B.ball(0.12 - i * 0.015, G, 'gold', [0, i * 0.14, 0], null, tail, 12);
    B.ball(0.06, '#fff1a8', 'neon', [0, 0.72, 0], null, tail, 8);
    legs.forEach((l, i) => B.anims.push((t) => { l.rotation.x = Math.sin(t * 6 + (i % 2 ? PI : 0) + (i > 1 ? PI / 2 : 0)) * 0.45; }));
    B.anims.push((t) => { pv.position.y = -2.25 + Math.abs(Math.sin(t * 6)) * 0.06; tail.rotation.z = Math.sin(t * 5) * 0.4; });
    B.sparkle(22, [1.2, 1.2, 2], '#ffe9a0', [1.5, -2, 2.3], 0.07, 0.4);
  } else if (kind === 'kraken') {
    const K = '#7b3fa0';
    B.straps('#3a1f4a', 'leather');
    B.ball(0.78, K, 'plastic', [0, 0.25, 0.75], [1, 1.2, 0.9], null, 32);
    for (let i = 0; i < 10; i++) B.ball(0.06 + (i % 3) * 0.02, shade(K, 0.25), 'plastic', [Math.sin(i * 2.1) * 0.5, 0.55 + Math.cos(i * 1.7) * 0.35, 1.32 + Math.cos(i) * 0.05], [1, 1, 0.4], null, 10);
    for (const sx of [-0.28, 0.28]) { B.ball(0.17, '#fff8d0', 'plastic', [sx, 0.3, 1.38], null, null, 16); B.rbox([0.16, 0.05, 0.05], '#111', 'dark', [sx, 0.3, 1.54], null, null, 0.02); B.ball(0.2, K, 'plastic', [sx, 0.42, 1.34], [1, 0.45, 0.8], null, 12); }
    B.tor(0.12, 0.03, '#4a1f60', 'plastic', [0, 0.0, 1.45], [0, 0, 0], null, PI);
    B.cone(0.2, 0.4, GOLD, 'gold', [0, 1.15, 0.75], null, null, 5);
    B.gem(0.08, '#4cc9f0', [0, 1.1, 0.95]);
    for (let k = 0; k < 8; k++) {
      const a0 = -PI * 0.92 + k * (PI * 0.84 / 7);
      const pv = B.pivot([Math.cos(a0) * 0.55, -0.2 + Math.sin(a0) * 0.2, 0.75]);
      for (let i = 0; i < 10; i++) {
        const px = Math.cos(a0) * i * 0.21, py = -i * 0.1 + Math.sin(i * 0.5) * 0.15, pz = Math.sin(i * 0.6) * 0.25, r = 0.17 - i * 0.014;
        B.ball(r, K, 'plastic', [px, py, pz], null, pv, 14);
        if (i % 2 === 0) B.ball(r * 0.45, '#f2c9e8', 'plastic', [px, py - r * 0.7, pz + r * 0.3], [1, 0.5, 1], pv, 8);
      }
      if (k % 2 === 0) B.coin([Math.cos(a0) * 2.15, -0.95, 0.3], [PI / 2, 0, 0.4], pv, 0.8);
      B.anims.push((t) => { pv.rotation.z = Math.sin(t * 1.6 + k) * 0.25; pv.rotation.x = Math.cos(t * 1.3 + k) * 0.2; });
    }
    B.sparkle(20, [2.5, 2, 2], '#c9a3ff', [0, 0, 1], 0.06, -0.3);
  }
};
