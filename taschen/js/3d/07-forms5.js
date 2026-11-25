// ── Überarbeitungen Nr. 13 bis 24 und neue Grundformen ──

// ── Nr. 13 Münzprägers Rucksack: Spindelpresse oben, Prägestempel, Rohlinge, Hammer ──
X[13] = (B, s) => {
  const zc = 0.42 * s, zf = 0.79 * s, top = 0.875 * s;
  const pr = B.pivot([0, top, zc]);
  for (const sx of [-1, 1]) B.rbox([0.1, 0.8 * s, 0.1], IRON, 'metal', [sx * 0.3 * s, 0.4 * s, 0], null, pr, 0.025);
  B.rbox([0.75 * s, 0.14 * s, 0.16], IRON, 'metal', [0, 0.82 * s, 0], null, pr, 0.04);
  B.rbox([0.5 * s, 0.08, 0.3 * s], '#3a3f4a', 'metal', [0, 0.04, 0], null, pr, 0.02);
  const screw = B.pivot([0, 0.5 * s, 0], null, pr);
  B.cyl(0.05, 0.05, 0.75 * s, '#9aa3ad', 'metal', [0, 0.2 * s, 0], null, screw, 10);
  for (let i = 0; i < 7; i++) B.tor(0.055, 0.012, '#c0c6cf', 'metal', [0, -0.05 * s + i * 0.08 * s, 0], [PI / 2 + 0.15, 0, 0], screw);
  B.cyl(0.02, 0.02, 0.9 * s, BRASS, 'gold', [0, 0.52 * s, 0], [0, 0, PI / 2], screw, 8);
  for (const sx of [-1, 1]) B.ball(0.07, BRASS, 'gold', [sx * 0.45 * s, 0.52 * s, 0], null, screw, 12);
  B.cyl(0.09, 0.09, 0.08, '#3a3f4a', 'metal', [0, -0.18 * s, 0], null, screw, 14);
  B.anims.push((t) => { const k = (Math.sin(t * 1.6) + 1) / 2; screw.rotation.y = k * 2.4; screw.position.y = 0.5 * s - k * 0.12 * s; });
  const fresh = B.coin([0, 0.1, 0], [0, 0, 0], pr, 0.5 * s);
  B.glow(0.5 * s, '#ffcf4a', [0, 0.12, 0], pr, 0.7);
  B.pulse(fresh, 0.06, 3.2);
  // Rohlinge und Stempel
  for (let i = 0; i < 9; i++) B.coin([-0.9 * s, -0.7 * s + i * 0.05, zc + 0.1 * s], [0, i, 0], null, 0.5 * s, '#d9c7a0');
  B.rbox([0.26 * s, 0.6 * s, 0.38 * s], '#5a3a22', 'leather', [0.92 * s, -0.35 * s, zc], null, null, 0.04);
  for (let i = 0; i < 4; i++) { B.cyl(0.03, 0.03, 0.4 * s, '#9aa3ad', 'metal', [0.92 * s, 0.0, zc - 0.12 * s + i * 0.08 * s], null, null, 8); B.cyl(0.05, 0.05, 0.05, GOLD, 'gold', [0.92 * s, 0.2 * s, zc - 0.12 * s + i * 0.08 * s], null, null, 10); }
  const hm = hanging(B, [-0.5 * s, -0.2 * s, zf + 0.3 * s], 0.06, 1.5, 0.1);
  B.rbox([0.05, 0.4 * s, 0.05], '#7a5232', 'wood', [0, -0.2 * s, 0], null, hm, 0.02);
  B.rbox([0.22 * s, 0.1 * s, 0.1 * s], '#59606b', 'metal', [0, -0.42 * s, 0], null, hm, 0.025);
  B.sparkle(16, [0.8 * s, 0.6 * s, 0.8], '#ffcf4a', [0, top + 0.2, zc], 0.06, 1.0);
};

// ── Nr. 14 Bronze-Münzrolle (neu): drehbare Bronzetrommel mit sechs gläsernen Münzröhren ──
A.rollcase = (B, p) => {
  const s = p.size || 1;
  B.straps('#4a2a16', 'leather', { metal: BRONZE });
  B.rbox([1.2 * s, 0.5 * s, 0.25], '#4a2a16', 'leather', [0, -0.95 * s, 0.25], null, null, 0.06);
  const drum = B.pivot([0, 0.05 * s, 0.85 * s], [0, 0, 0]);
  for (const y of [-0.85, 0.85]) {
    B.cyl(0.62 * s, 0.62 * s, 0.1, BRONZE, 'metal', [0, y * s, 0], null, drum, 36);
    B.tor(0.62 * s, 0.04 * s, GOLD, 'gold', [0, y * s, 0], [PI / 2, 0, 0], drum);
    B.tor(0.35 * s, 0.025 * s, shade(BRONZE, 0.2), 'gold', [0, y * s + Math.sign(y) * 0.06, 0], [PI / 2, 0, 0], drum);
    for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; B.ball(0.03 * s, shade(BRONZE, 0.3), 'gold', [Math.cos(a) * 0.52 * s, y * s + Math.sign(y) * 0.055, Math.sin(a) * 0.52 * s], null, drum, 6); }
    B.gem(0.1 * s, '#c1121f', [0, y * s + Math.sign(y) * 0.08, 0], [y > 0 ? 0 : PI, 0, 0], drum);
  }
  B.cyl(0.08 * s, 0.08 * s, 1.7 * s, GOLD, 'gold', [0, 0, 0], null, drum, 12);
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * PI * 2, x = Math.cos(a) * 0.4 * s, z = Math.sin(a) * 0.4 * s;
    B.cyl(0.17 * s, 0.17 * s, 1.6 * s, '#dff1ff', 'glass', [x, 0, z], null, drum, 18);
    const n = 18 + (i % 3) * 3;
    for (let j = 0; j < n; j++) B.coin([x, -0.78 * s + j * 0.075 * s, z], [0, j, 0], drum, 0.5 * s, i % 2 ? GOLD : BRONZE);
    B.tor(0.17 * s, 0.02 * s, BRONZE, 'gold', [x, 0, z], [PI / 2, 0, 0], drum);
  }
  B.spin(drum, 'y', 0.5);
  for (const sx of [-1, 1]) { B.rbox([0.08, 1.9 * s, 0.08], BRONZE, 'metal', [sx * 0.7 * s, 0.05 * s, 0.85 * s], null, null, 0.03); B.ball(0.07 * s, GOLD, 'gold', [sx * 0.7 * s, 1.02 * s, 0.85 * s], null, null, 10); }
  B.glow(2.2 * s, '#ffb36b', [0, 0.05 * s, 0.85 * s], null, 0.25);
  B.sparkle(18, [1.6 * s, 2 * s, 1.4 * s], '#ffd6a0', [0, 0.05 * s, 0.85 * s], 0.06, 0.3);
};

// ── Nr. 15 Taverne → Bierkrug: Holzkrug mit Goldreifen, Deckel klappt auf, Schaum, Blasen, Münzen ──
A.tankard = (B, p) => {
  const s = p.size || 1, W = '#8a5a2b', G = GOLD;
  B.straps('#4a3020', 'leather', { metal: G });
  const cz = 0.82 * s;
  B.lathe([[0, -0.95], [0.66, -0.95], [0.7, -0.85], [0.66, 0.6], [0.69, 0.75], [0.6, 0.75], [0.56, -0.8], [0, -0.8]].map(([x, y]) => [x * s, y * s]), W, 'wood', [0, -0.05 * s, cz], null, null, 32, 'mug' + s);
  for (let i = 0; i < 16; i++) { const a = i / 16 * PI * 2; B.box([0.015, 1.4 * s, 0.015], '#4a2a16', 'dark', [Math.sin(a) * 0.685 * s, -0.12 * s, cz + Math.cos(a) * 0.685 * s], [0, a, 0]); }
  for (const y of [-0.8, -0.2, 0.5]) { B.tor(0.7 * s, 0.045 * s, G, 'gold', [0, y * s, cz], [PI / 2, 0, 0]); for (let i = 0; i < 8; i++) { const a = -1.4 + i * 0.4; B.ball(0.025 * s, '#fff1a8', 'gold', [Math.sin(a) * 0.74 * s, y * s, cz + Math.cos(a) * 0.74 * s], null, null, 6); } }
  // Henkel
  B.tor(0.38 * s, 0.07 * s, W, 'wood', [0.72 * s, -0.12 * s, cz], [0, 0, -PI / 2], null, PI);
  B.tor(0.38 * s, 0.025 * s, G, 'gold', [0.72 * s, -0.12 * s, cz + 0.07 * s], [0, 0, -PI / 2], null, PI);
  // Wappen vorn
  B.tor(0.2 * s, 0.03 * s, G, 'gold', [0, 0.15 * s, cz + 0.7 * s]);
  B.coin([0, 0.15 * s, cz + 0.71 * s], null, null, 0.55 * s);
  B.emblem('star', [0, 0.15 * s, cz + 0.75 * s], 0.35 * s);
  // Bier und Schaum
  B.cyl(0.58 * s, 0.58 * s, 0.05, '#e0a02a', 'gold', [0, 0.64 * s, cz], null, null, 28);
  const foam = B.pivot([0, 0.74 * s, cz]);
  for (let i = 0; i < 22; i++) { const a = i * 2.4, r = (i % 3) * 0.2 * s; B.ball((0.18 - (i % 3) * 0.03) * s, '#fff8e6', 'plastic', [Math.cos(a) * r, (0.05 + (i % 4) * 0.04) * s, Math.sin(a) * r], [1, 0.7, 1], foam, 12); }
  for (const a of [0.4, 2.2, 4.3]) { B.ball(0.08 * s, '#fff8e6', 'plastic', [Math.cos(a) * 0.66 * s, -0.12 * s, Math.sin(a) * 0.66 * s], [1, 2.2, 0.7], foam, 10); }
  for (let i = 0; i < 4; i++) B.coin([Math.sin(i * 1.7) * 0.25 * s, 0.22 * s, Math.cos(i * 1.7) * 0.25 * s], [0.6 + i * 0.3, i, 0.4], foam, 0.45 * s);
  B.anims.push((t) => { foam.position.y = 0.74 * s + Math.sin(t * 2.2) * 0.03 * s; foam.scale.y = 1 + Math.sin(t * 2.2) * 0.05; });
  B.sparkle(26, [1.1 * s, 1.6 * s, 1.1 * s], '#fff1c8', [0, 1.3 * s, cz], 0.07, 0.8);
  B.glow(1.4 * s, '#ffd27a', [0, 0.8 * s, cz], null, 0.3);
};

// ── Nr. 16 Söldners Münzsack (neu): Kriegsgepäck mit Rundschild, gekreuztem Schwert und Axt, Kettenhemd, Soldbeuteln, Helm ──
A.merc = (B, p) => {
  const s = p.size || 1, L = '#4a3424', G = GOLD;
  B.straps('#3a2618', 'leather', { metal: G });
  B.rbox([1.5 * s, 1.6 * s, 0.6 * s], L, 'leather', [0, 0.0, 0.35 * s], null, null, 0.16 * s);
  B.seam([-0.68 * s, -0.75 * s, 0.66 * s], [-0.68 * s, 0.7 * s, 0.66 * s], '#c9b27a', 12);
  B.seam([0.68 * s, -0.75 * s, 0.66 * s], [0.68 * s, 0.7 * s, 0.66 * s], '#c9b27a', 12);
  // gekreuzte Waffen hinter dem Schild
  const sw = B.pivot([0, 0.15 * s, 0.75 * s], [0, 0, 0.75]);
  B.rbox([0.12 * s, 1.9 * s, 0.03], '#e8ecf2', 'metal', [0, 0.4 * s, 0], null, sw, 0.02);
  B.box([0.02, 1.7 * s, 0.035], '#9aa3ad', 'metal', [0, 0.4 * s, 0]);
  sw.add(B.parts.at(-1));
  B.rbox([0.55 * s, 0.08 * s, 0.1], G, 'gold', [0, -0.6 * s, 0], null, sw, 0.03);
  B.cyl(0.04 * s, 0.045 * s, 0.35 * s, '#3a2414', 'leather', [0, -0.82 * s, 0], null, sw, 8);
  B.gem(0.07 * s, '#c1121f', [0, -1.02 * s, 0], [0, 0, 0], sw);
  const ax = B.pivot([0, 0.15 * s, 0.72 * s], [0, 0, -0.75]);
  B.cyl(0.035 * s, 0.04 * s, 2.0 * s, '#6b4a2a', 'wood', [0, 0.1 * s, 0], null, ax, 8);
  B.half(0.32 * s, 0.03, '#c0c6cf', 'metal', [0.2 * s, 0.9 * s, 0], [PI / 2, 0, 0], ax);
  B.rbox([0.14 * s, 0.22 * s, 0.05], '#59606b', 'metal', [0, 0.9 * s, 0], null, ax, 0.02);
  // Rundschild mit Dellen und Goldbuckel
  const sh = B.pivot([0, -0.05 * s, 0.9 * s]);
  B.cyl(0.62 * s, 0.62 * s, 0.1, '#7a1f2a', 'wood', [0, 0, 0], [PI / 2, 0, 0], sh, 36);
  B.tor(0.62 * s, 0.05 * s, '#9aa3ad', 'metal', [0, 0, 0], null, sh);
  for (let i = 0; i < 4; i++) B.rbox([0.06 * s, 1.15 * s, 0.03], '#9aa3ad', 'metal', [0, 0, 0.06], [0, 0, i * PI / 4], sh, 0.015);
  B.lathe([[0, 0.16], [0.1, 0.13], [0.18, 0.05], [0.2, 0]].map(([x, y]) => [x * s, y * s]), G, 'gold', [0, 0, 0.06], [PI / 2, 0, 0], sh, 24, 'mboss' + s);
  for (const [x, y] of [[0.3, 0.25], [-0.28, -0.3], [0.1, -0.42]]) B.ball(0.05 * s, '#3a0f14', 'dark', [x * s, y * s, 0.05], [1, 1, 0.2], sh, 8);
  for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; B.ball(0.03 * s, G, 'gold', [Math.cos(a) * 0.52 * s, Math.sin(a) * 0.52 * s, 0.07], null, sh, 6); }
  // Gürtel mit Soldbeuteln
  B.rbox([1.7 * s, 0.13 * s, 0.68 * s], '#2a1a10', 'leather', [0, -0.6 * s, 0.35 * s], null, null, 0.04);
  B.buckle([0, -0.6 * s, 0.7 * s], 0.7 * s, G);
  for (const [x, c] of [[-0.85, '#8a5a33'], [0.85, '#5a4a3a'], [-0.55, '#6b1f2a']]) pouch(B, [x * s, -0.85 * s, 0.6 * s], s * 0.9, c, G);
  // Soldvertrag mit Siegel
  B.cyl(0.08 * s, 0.08 * s, 0.6 * s, '#efe3c2', 'cloth', [0.88 * s, 0.35 * s, 0.35 * s], [0.2, 0, 0.1], null, 12);
  B.cyl(0.07 * s, 0.07 * s, 0.03, '#a4161a', 'plastic', [0.97 * s, 0.35 * s, 0.35 * s], [0, 0, PI / 2], null, 12);
  // Helm an der Seite
  const hm = hanging(B, [-0.88 * s, 0.35 * s, 0.4 * s], 0.1, 1.4, 0.1);
  B.ball(0.25 * s, '#9aa3ad', 'metal', [0, -0.25 * s, 0], [1, 1.05, 1], hm, 20);
  B.rbox([0.06 * s, 0.25 * s, 0.05], '#9aa3ad', 'metal', [0, -0.38 * s, 0.24 * s], null, hm, 0.02);
  B.tor(0.25 * s, 0.025 * s, G, 'gold', [0, -0.3 * s, 0], [PI / 2, 0, 0], hm);
};

// ── Nr. 19 Bronzeschild-Münzträger: größer, Speere, Lorbeerkranz, Banner, Stacheln, Münzfächer ──
X[19] = (B, s) => {
  for (const r of [0.6, -0.6]) { const pv = B.pivot([0, 0, 0.12], [0, 0, r]); B.cyl(0.035, 0.035, 2.8 * s, '#6b4a2a', 'wood', [0, 0, 0], null, pv, 8); B.cone(0.08, 0.3, '#c0c6cf', 'metal', [0, 1.5 * s, 0], null, pv, 4); B.tor(0.045, 0.015, BRONZE, 'gold', [0, 1.3 * s, 0], [PI / 2, 0, 0], pv); }
  for (let i = 0; i < 14; i++) { const a = PI * 0.15 + i / 13 * PI * 0.7 * 2; for (const side of [-1, 1]) { const aa = -PI / 2 + side * (0.25 + i * 0.16); B.ball(0.06 * s, '#5aa04a', 'plastic', [Math.cos(aa) * 0.4 * s, Math.sin(aa) * 0.4 * s, 0.4], [1, 0.5, 0.3], null, 8).rotation.z = aa; } }
  for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2 + PI / 12; B.cone(0.05 * s, 0.22 * s, shade(BRONZE, 0.2), 'gold', [Math.cos(a) * 1.15 * s, Math.sin(a) * 1.15 * s, 0.26], [0, 0, a - PI / 2], null, 6); }
  const bn = B.pivot([0, -1.05 * s, 0.28]);
  B.rbox([0.5 * s, 0.6 * s, 0.02], '#7a1f2a', 'cloth', [0, -0.32 * s, 0], null, bn, 0.01);
  B.cone(0.25 * s, 0.2 * s, '#7a1f2a', 'cloth', [0, -0.68 * s, 0], [PI, 0, 0], bn, 3).scale.set(1, 1, 0.05);
  B.coin([0, -0.32 * s, 0.02], [PI / 2, 0, 0], bn, 0.5 * s);
  B.anims.push((t) => { bn.rotation.z = Math.sin(t * 1.7) * 0.08; bn.rotation.x = Math.sin(t * 1.3) * 0.1; });
  for (const a of [PI * 0.25, PI * 0.75, PI * 1.25, PI * 1.75]) { const x = Math.cos(a) * 0.72 * s, y = Math.sin(a) * 0.72 * s; B.rbox([0.22 * s, 0.22 * s, 0.1], BRONZE, 'metal', [x, y, 0.36], [0, 0, a], null, 0.03); B.coin([x, y, 0.42], null, null, 0.35 * s); }
  B.glow(1.4 * s, '#ffb36b', [0, 0, 0.5], null, 0.3);
};

// ── Nr. 20 Kopfgeldjäger-Beutel: Bronzestern, Steckbriefe, Handschellen, Lasso, Belohnungs-Gold ──
X[20] = (B, s, zf, S, nrm) => {
  poster(B, S(-0.3 * s, -0.15, 0.03), s, 0.12).rotation.y = nrm(-0.3 * s, -0.15)[1];
  poster(B, S(0.33 * s, -0.25, 0.03), s * 0.9, -0.15).rotation.y = nrm(0.33 * s, -0.25)[1];
  const st = B.pivot(S(0.05 * s, 0.32, 0.05), nrm(0.05 * s, 0.32));
  for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; B.cone(0.06 * s, 0.2 * s, BRONZE, 'gold', [Math.sin(a) * 0.1 * s, Math.cos(a) * 0.1 * s, 0], [0, 0, -a], st, 4).scale.set(1, 1, 0.4); B.ball(0.025 * s, GOLD, 'gold', [Math.sin(a) * 0.21 * s, Math.cos(a) * 0.21 * s, 0], null, st, 6); }
  B.cyl(0.08 * s, 0.08 * s, 0.03, GOLD, 'gold', [0, 0, 0.01], [PI / 2, 0, 0], st, 16);
  B.glow(0.5 * s, '#ffcf4a', [0, 0, 0.05], st, 0.5);
  const hc = hanging(B, [0.72 * s, -0.25 * s, 0.9 * s], 0.08, 1.8, 0.2);
  B.tor(0.09 * s, 0.022 * s, '#c0c6cf', 'metal', [0, -0.1 * s, 0], null, hc);
  B.tor(0.09 * s, 0.022 * s, '#c0c6cf', 'metal', [0.05 * s, -0.36 * s, 0.03], [0, 0.6, 0], hc);
  chain(B, [0, -0.19 * s, 0], [0.04 * s, -0.27 * s, 0.02], 3, '#c0c6cf', 'metal', 0.03 * s, hc);
  for (let i = 0; i < 5; i++) B.tor(0.24 * s - i * 0.005, 0.022, '#c9b27a', 'cloth', [-0.85 * s, -0.35 * s + i * 0.045, 0.55 * s], [0, PI / 2, 0]);
  B.cyl(0.02, 0.02, 0.5, '#c9b27a', 'cloth', [-0.85 * s, -0.75 * s, 0.6 * s], [0.2, 0, 0], null, 5);
  for (let i = 0; i < 10; i++) B.coin([Math.sin(i * 2.1) * 0.18 * s, 0.85 * s + (i % 4) * 0.05, 0.69 * s + Math.cos(i * 2.1) * 0.12 * s], [PI / 2 + Math.sin(i), i, 0.3], null, 0.5 * s);
  B.glow(1.0 * s, '#ffe08a', [0, 0.95 * s, 0.7 * s], null, 0.5);
  for (const sx of [-1, 1]) B.rbox([0.25 * s, 0.25 * s, 0.04], BRONZE, 'metal', S(sx * 0.45 * s, -0.7, 0.0), [0, sx * 0.5, sx * 0.785], null, 0.03);
};

// ── Nr. 21 Bronzene Münzbibliothek: Glastüren, Krone, Lampen, Samtvorhang, Edelsteine ──
X[21] = (B) => {
  for (const sx of [-1, 1]) {
    const door = B.pivot([sx * 0.85, -0.05, 0.86], [0, -sx * 1.15, 0]);
    B.rbox([0.86, 1.95, 0.04], '#cd8a4f', 'metal', [-sx * 0.43, 0, 0], null, door, 0.02);
    B.rbox([0.72, 1.8, 0.05], '#dff1ff', 'glass', [-sx * 0.43, 0, 0], null, door, 0.01);
    for (const y of [-0.3, 0.33]) B.box([0.74, 0.03, 0.05], '#cd8a4f', 'metal', [-sx * 0.43, y, 0]);
    door.add(B.parts.at(-1)); door.add(B.parts.at(-2));
    B.ball(0.04, GOLD, 'gold', [-sx * 0.78, 0, 0.05], null, door, 8);
    B.anims.push((t) => { door.rotation.y = -sx * (1.15 + Math.sin(t * 0.6) * 0.25); });
  }
  B.rbox([1.9, 0.16, 0.2], '#6b1f2a', 'cloth', [0, 0.9, 0.9], null, null, 0.05);
  for (let i = 0; i < 9; i++) B.cone(0.06, 0.16, '#6b1f2a', 'cloth', [-0.8 + i * 0.2, 0.75, 0.95], [PI, 0, 0], null, 8);
  for (let i = 0; i < 9; i++) B.ball(0.025, GOLD, 'gold', [-0.8 + i * 0.2, 0.66, 0.95], null, null, 6);
  // Krone
  const cr = B.pivot([0, 1.45, 0.8]);
  B.cyl(0.22, 0.2, 0.12, GOLD, 'gold', [0, 0, 0], null, cr, 20);
  for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; B.cone(0.05, 0.16, GOLD, 'gold', [Math.sin(a) * 0.2, 0.12, Math.cos(a) * 0.2], null, cr, 4); B.ball(0.03, ['#c1121f', '#2ec4b6', '#4cc9f0'][i % 3], 'gem', [Math.sin(a) * 0.2, 0.22, Math.cos(a) * 0.2], null, cr, 8); }
  B.spin(cr, 'y', 0.5);
  for (const sx of [-1, 1]) lantern(B, [sx * 1.05, 0.6, 0.85], 0.9, '#ffd27a');
  for (const [x, y, c] of [[-0.6, 1.05, '#c1121f'], [0.6, 1.05, '#2ec4b6']]) B.gem(0.07, c, [x, y, 0.86]);
  B.sparkle(14, [1.6, 2, 1], '#ffe9b0', [0, 0, 0.7], 0.05, 0.2);
};

// ── Nr. 22 Glücksbringer-Rucksack: leuchtendes Kleeblatt, Bronze-Hufeisen, Glücksmünze, Marienkäfer ──
X[22] = (B, s) => {
  const zf = 0.79 * s;
  clover(B, [0, 0.55 * s, zf + 0.13 * s], s * 1.6, '#6dff8a', true);
  horseshoe(B, [-0.45 * s, -0.5 * s, zf + 0.25 * s], s, BRONZE);
  const lc = hanging(B, [0.4 * s, 0.05 * s, zf + 0.15 * s], 0.25, 2.2, 0.2);
  B.coin([0, -0.05, 0], [PI / 2, 0, 0], lc, 0.5 * s);
  clover(B, [0, -0.05, 0.03], s * 0.5, '#2a8a3a', false, lc);
  B.tor(0.17 * s, 0.015, BRONZE, 'gold', [0, -0.05, 0], null, lc);
  ladybug(B, [0.55 * s, -0.4 * s, zf + 0.25 * s], s, [0, 0, 0.6]);
  ladybug(B, [-0.52, 0.2, -1.12], 1, [0, PI, -0.4]);
  for (let i = 0; i < 5; i++) { const h = hanging(B, [(-0.6 + i * 0.3) * s, -0.88 * s, zf - 0.05], 0.12, 2 + i * 0.3, 0.2); B.ball(0.035, i % 2 ? '#6dff8a' : BRONZE, i % 2 ? 'neon' : 'gold', [0, -0.03, 0], null, h, 8); }
  B.sparkle(30, [2 * s, 2.2 * s, 1.4 * s], '#9dffb0', [0, 0, 0.7 * s], 0.07, 0.5);
  B.glow(2.2 * s, '#6dff8a', [0, 0.2 * s, 0.6 * s], null, 0.15);
};

// ── Nr. 23 Silbertaler-Rucksack: Talerreihe, Filigran, Silberketten, Eckkappen, Glöckchen ──
X[23] = (B, s) => {
  const zf = 0.79 * s;
  for (let i = 0; i < 5; i++) { const x = (-0.56 + i * 0.28) * s; B.coin([x, 0.55 * s, zf + 0.12 * s], [PI / 2 - 0.06, 0, 0], null, 0.42 * s, SILVER); B.emblem('star', [x, 0.55 * s, zf + 0.15 * s], 0.22 * s); }
  for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) B.tor(0.12 * s, 0.012 * s, SILVER, 'metal', [sx * (0.2 + i * 0.13) * s, -0.5 * s, zf + 0.24 * s], [0, 0, sx > 0 ? 0 : PI], null, PI * 1.3);
  chain(B, [-0.7 * s, 0.25 * s, zf + 0.02], [0.7 * s, 0.25 * s, zf + 0.02], 15, SILVER, 'metal', 0.04 * s);
  const bell = hanging(B, [0, 0.2 * s, zf + 0.06], 0.12, 2.4, 0.25);
  B.lathe([[0, 0.1], [0.05, 0.08], [0.07, 0], [0.09, -0.06], [0, -0.06]], SILVER, 'metal', [0, -0.05, 0], null, bell, 16, 'bell');
  B.ball(0.02, '#9aa3ad', 'metal', [0, -0.12, 0], null, bell, 6);
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) B.lathe([[0, 0], [0.1, 0], [0.12, 0.06], [0, 0.1]].map(([x, y]) => [x * s, y * s]), SILVER, 'metal', [sx * 0.72 * s, sy * 0.82 * s, zf - 0.05], [sy > 0 ? 0 : PI, 0, 0], null, 12, 'cap' + s);
  B.sparkle(18, [1.8 * s, 2 * s, 1.2 * s], '#ffffff', [0, 0, 0.7 * s], 0.05, 0.3);
};

// ── Nr. 24 Mondmünzen-Beutel: Silbermond-Verschluss, Sternbild, Mondstein, Silberquasten, kreisender Mond ──
X[24] = (B, s, zf, S, nrm) => {
  B.tor(0.3 * s, 0.05 * s, SILVER, 'metal', S(0, 0.6, 0.06), [0, 0, 0.5], null, PI * 1.3);
  const stars = [[-0.45, 0.1], [-0.25, 0.3], [0.05, 0.22], [0.3, 0.38], [0.48, 0.05], [0.2, -0.3], [-0.3, -0.45], [0.42, -0.55]];
  stars.forEach(([x, ly], i) => { const q = S(x * s, ly, 0.012); B.ball(0.03 * s, '#ffffff', 'neon', q, null, null, 8); if (i % 2 === 0) B.glow(0.18 * s, '#cfe6ff', q, null, 0.8); });
  for (let i = 1; i < 5; i++) { const a = S(stars[i - 1][0] * s, stars[i - 1][1], 0.012), b = S(stars[i][0] * s, stars[i][1], 0.012); const d = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]); B.cyl(0.004, 0.004, d, '#9fc4ff', 'neon', [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], [0, 0, Math.atan2(b[1] - a[1], b[0] - a[0]) - PI / 2], null, 4); }
  B.gem(0.1 * s, '#cfe6ff', S(0, -0.12, 0.08));
  B.glow(0.6 * s, '#cfe6ff', S(0, -0.12, 0.12), null, 0.7);
  for (const x of [-0.35, -0.12, 0.12, 0.35]) { const q = S(x * s, -0.9, -0.02); B.cyl(0.03 * s, 0.05 * s, 0.18 * s, SILVER, 'metal', [q[0], q[1] - 0.1 * s, q[2]], null, null, 8); for (let i = 0; i < 6; i++) B.cyl(0.006, 0.006, 0.16 * s, '#cfd6e0', 'metal', [q[0] + Math.cos(i) * 0.03 * s, q[1] - 0.26 * s, q[2] + Math.sin(i) * 0.03 * s], null, null, 3); }
  const orb = B.pivot([0, 0.2 * s, 0.66 * s]);
  B.ball(0.13 * s, '#e8ecf2', 'plastic', [1.15 * s, 0.2, 0], null, orb, 16);
  B.ball(0.03 * s, '#b0b8c4', 'plastic', [1.2 * s, 0.25, 0.1 * s], [1, 1, 0.3], orb, 6);
  B.glow(0.6 * s, '#cfe6ff', [1.15 * s, 0.2, 0], orb, 0.6);
  B.spin(orb, 'y', 0.7);
};
