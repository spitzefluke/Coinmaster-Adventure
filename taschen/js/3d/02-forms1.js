// ── Grundformen, Teil 1: Beutel, Rucksack, Truhe, Gläser, Sparschwein, Rollen, Schild, Fass, Regal, Schrein, Rüstung, Harnisch, Mantel ──
const SACK_PTS = [[0, -0.98], [0.35, -0.97], [0.62, -0.86], [0.78, -0.6], [0.82, -0.25], [0.78, 0.1], [0.64, 0.4], [0.42, 0.62], [0.27, 0.74], [0.25, 0.8], [0.3, 0.9], [0.39, 1.0], [0.35, 1.05], [0.24, 0.97]];
const sackGeo = () => geo('sack', () => {
  const g = new THREE.LatheGeometry(SACK_PTS.map(([x, y]) => new THREE.Vector2(x, y)), 44);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), a = Math.atan2(z, x);
    const top = y > 0.3 ? (y - 0.3) / 0.75 : 0;
    const f = 1 + 0.07 * Math.sin(a * 11) * top + 0.018 * Math.sin(a * 5 + y * 7) * (1 - top);
    p.setXYZ(i, x * f, y, z * f);
  }
  g.computeVertexNormals();
  return g;
});
const sackRealGeo = () => geo('sackReal', () => {
  const pts = [[0, -0.98], [0.42, -0.98], [0.7, -0.88], [0.86, -0.62], [0.88, -0.3], [0.8, 0.05], [0.62, 0.36], [0.4, 0.6], [0.25, 0.74], [0.22, 0.8], [0.3, 0.92], [0.42, 1.04], [0.4, 1.08], [0.26, 1.0]];
  const g = new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 56, 0, PI * 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const a = Math.atan2(z, x), top = y > 0.25 ? (y - 0.25) / 0.83 : 0, low = y < 0 ? -y : 0;
    const f = 1 + 0.13 * Math.sin(a * 13) * top * top + 0.035 * Math.sin(a * 4 + y * 5) * (1 - top) + 0.02 * Math.sin(a * 9 + y * 11);
    x *= f; z *= f;
    z += Math.max(0, Math.cos(a)) * low * 0.12;          // Inhalt drückt nach vorn unten
    y -= low * low * 0.06 * (1 + Math.cos(a));            // hängt durch
    if (y > 0.98) y += 0.04 * Math.sin(a * 23);           // ausgefranster Rand
    p.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  return g;
});
const sackR = (y) => { for (let i = 1; i < SACK_PTS.length; i++) { const [r0, y0] = SACK_PTS[i - 1], [r1, y1] = SACK_PTS[i]; if (y <= y1) return r0 + (r1 - r0) * ((y - y0) / (y1 - y0 || 1)); } return 0.3; };

A.sack = (B, p) => {
  const s = p.size || 1, c = p.c, k = p.k || 'cloth';
  const sx = 0.95 * s, sy = 0.9 * s, sz = 0.78 * s, cy = -0.1 * s, cz = 0.66 * s;
  const surf = (ly) => cz + sackR(ly) * sz; // vorderste Stelle in Höhe ly (lokal im Beutel)
  B.straps(p.strap || LEATHER, 'leather');
  B.mesh(p.real ? sackRealGeo() : sackGeo(), c, k, [0, cy, cz]).scale.set(sx, sy, sz);
  // Punkt auf der Vorderseite: x in Studs, ly in Beutel-Höhe (-1 bis 1)
  const S = (x, ly, off = 0.01) => { const xn = x / sx, r = sackR(ly) * (p.real ? 1.06 : 1); return [x, cy + ly * sy, cz + Math.sqrt(Math.max(0, r * r - xn * xn)) * sz + off + (p.real && ly < 0 ? -ly * 0.1 * sz : 0)]; };
  const nrm = (x, ly) => [-ly * 0.35, Math.asin(Math.max(-1, Math.min(1, (x / sx) / (sackR(ly) + 0.001)))), 0];
  if (p.tears) p.tears.forEach(([x, ly, w, h, coin]) => {
    const pt = S(x * s, ly, 0.0), r = nrm(x * s, ly);
    B.ball(1, '#1a120c', 'dark', pt, [w * s, h * s, 0.03], null, 16).rotation.set(r[0], r[1], 0);
    for (let i = 0; i < 14; i++) {
      const a = i / 14 * PI * 2, ex = Math.cos(a) * w * s, ey = Math.sin(a) * h * s;
      const q = S(x * s + ex, ly + ey / sy, 0.012);
      B.cyl(0.008 * s, 0.004 * s, 0.07 * s + (i % 3) * 0.03 * s, shade(c, 0.15), 'cloth', q, [r[0] + Math.sin(a) * 0.9, r[1], -a + PI / 2], null, 4);
    }
    if (coin) { B.coin(S(x * s, ly - h * 0.3, -0.02), [PI / 2 - 0.5, r[1], 0.3], null, 0.45 * s, coin === true ? GOLD : coin); B.glow(0.35 * s, '#ffe08a', S(x * s, ly, 0.03), null, 0.5); }
  });
  // Boden-Verstärkung und Mittelnaht
  B.lathe([[0, -0.99], [0.5, -0.975], [0.66, -0.88], [0.7, -0.84]], shade(c, -0.22), k, [0, cy, cz], null, null, 36, 'sackbase').scale.set(sx * 1.01, sy, sz * 1.01);
  const path = [];
  for (let ly = -0.8; ly <= 0.5; ly += 0.13) path.push([0, cy + ly * sy, surf(ly) + 0.012]);
  if (!p.noSeam) for (let i = 1; i < path.length; i++) B.seam(path[i - 1], path[i], shade(c, 0.35), 1);
  // Zugband mit Kordeln, Knoten und Anhänger
  const ny = cy + 0.8 * sy;
  B.tor(0.25 * sx, 0.045 * s, p.tie || '#d8c08a', p.tieK || 'cloth', [0, ny, cz], [PI / 2, 0, 0], null).scale.set(1, sz / sx, 1);
  for (const dx of [-0.08, 0.1]) {
    B.cyl(0.022 * s, 0.022 * s, 0.42 * s, p.tie || '#d8c08a', p.tieK || 'cloth', [dx * s, ny - 0.2 * s, cz + 0.27 * sz], [0.15, 0, dx], null, 8);
    B.ball(0.05 * s, shade(p.tie || '#d8c08a', -0.1), p.tieK || 'cloth', [dx * s * 1.4, ny - 0.42 * s, cz + 0.3 * sz], null, null, 10);
    B.cone(0.045 * s, 0.12 * s, shade(p.tie || '#d8c08a', -0.15), 'cloth', [dx * s * 1.4, ny - 0.52 * s, cz + 0.3 * sz], [PI, 0, 0], null, 8);
  }
  const tag = B.pivot([0.12 * s, ny - 0.5 * s, cz + 0.33 * sz], [0.1, 0, -0.15]);
  B.rbox([0.18 * s, 0.24 * s, 0.025], '#e9d9b0', 'leather', [0, 0, 0], null, tag, 0.01);
  B.tor(0.025 * s, 0.008, BRASS, 'gold', [0, 0.09 * s, 0.015], null, tag);
  B.coin([0, -0.02 * s, 0.02], [PI / 2, 0, 0], tag, 0.3 * s);
  B.anims.push((t) => { tag.rotation.z = -0.15 + Math.sin(t * 2.3) * 0.12; });
  const zf = surf(0) + 0.0;
  if (p.patches) for (const [x, ly, w, h] of [[-0.32, -0.25, 0.26, 0.22], [0.3, 0.12, 0.22, 0.2], [0.05, -0.62, 0.2, 0.16]]) {
    const z = surf(ly) - Math.abs(x) * 0.25 * s + 0.01, y = cy + ly * sy;
    B.rbox([w * s, h * s, 0.03], p.patches, 'cloth', [x * s, y, z], [0, x * 0.5, 0], null, 0.01);
    B.seam([x * s - w * s / 2, y + h * s / 2, z + 0.02], [x * s + w * s / 2, y + h * s / 2, z + 0.02], '#e9d8b0', 3);
    B.seam([x * s - w * s / 2, y - h * s / 2, z + 0.02], [x * s + w * s / 2, y - h * s / 2, z + 0.02], '#e9d8b0', 3);
  }
  if (p.rivets) for (let i = 0; i < 9; i++) { const a = -1.1 + i * 0.275, ly = -0.05; B.ball(0.045 * s, p.rivets, 'gold', [Math.sin(a) * sackR(ly) * sx * 0.98, cy + ly * sy, cz + Math.cos(a) * sackR(ly) * sz * 0.98], null, null, 10); }
  if (p.band) { B.tor(0.8 * sx, 0.05 * s, p.band, 'metal', [0, cy - 0.15 * sy, cz], [PI / 2, 0, 0]).scale.set(1, sz / sx, 1); B.tor(0.62 * sx, 0.04 * s, p.band, 'metal', [0, cy + 0.42 * sy, cz], [PI / 2, 0, 0]).scale.set(1, sz / sx, 1); }
  if (p.coins) {
    for (let i = 0; i < p.coins; i++) B.coin([Math.sin(i * 2.4) * 0.14 * s, ny + 0.12 * s + (i % 4) * 0.045 * s, cz + Math.cos(i * 2.4) * 0.1 * s], [PI / 2 + Math.sin(i) * 0.9, i * 0.7, 0.3], null, 0.55 * s, p.coinC || GOLD);
    B.glow(0.9 * s, '#ffe08a', [0, ny + 0.15 * s, cz], null, 0.5);
  }
  if (p.emblem) B.emblem(p.emblem, [0, cy, surf(0) + 0.01], s * 1.1);
  if (p.flap) { B.half(0.42 * s, 0.95 * s, shade(c, -0.15), k, [0, cy + 0.42 * sy, surf(0.42) - 0.12], [0, 0, PI / 2]).scale.set(1, 1, 0.3); B.ball(0.06 * s, p.rivets || BRASS, 'gold', [0, cy + 0.42 * sy - 0.4 * s, surf(0.0) + 0.02], [1, 1, 0.6], null, 12); }
  if (p.glow) B.sparkle(30, [1.8 * s, 2 * s, 1.4 * s], p.glow, [0, 0, 0.7 * s]);
  if (p.extra) p.extra(B, s, zf, S, nrm);
};

A.backpack = (B, p) => {
  const s = p.size || 1, c = p.c, k = p.k || 'leather', c2 = p.c2 || shade(c, -0.25), k2 = p.k2 || k;
  const metal = p.buckle || BRASS;
  B.straps(p.strap || shade(c, -0.4), p.strapK || 'leather', { metal });
  const W = 1.5 * s, H = 1.75 * s, D = 0.74 * s, zc = 0.42 * s, zf = zc + D / 2;
  B.rbox([W, H, D], c, k, [0, 0.0, zc], null, null, 0.2 * s);
  B.rbox([W + 0.03, 0.14 * s, D + 0.03], shade(c, -0.35), 'leather', [0, -H / 2 + 0.06 * s, zc], null, null, 0.06 * s);
  // Reißverschluss rundherum
  for (const sx of [-1, 1]) { B.box([0.03, H * 0.72, 0.04], IRON, 'metal', [sx * (W / 2 + 0.005), 0.08 * s, zc + D * 0.3]); }
  B.rbox([0.05, 0.12, 0.03], metal, 'gold', [W / 2 + 0.03, 0.35 * s, zc + D * 0.3], null, null, 0.012);
  // Tragegriff oben
  B.tor(0.2 * s, 0.04 * s, shade(c, -0.35), 'leather', [0, H / 2 - 0.02, zc], [0, 0, 0], null, PI);
  // Klappe mit Naht, zwei Riemen und Schnallen
  B.rbox([W + 0.04, 0.78 * s, 0.09 * s], c2, k2, [0, 0.52 * s, zf + 0.02], [-0.06, 0, 0], null, 0.06 * s);
  B.seam([-W / 2 + 0.07, 0.18 * s, zf + 0.08 * s], [W / 2 - 0.07, 0.18 * s, zf + 0.08 * s], '#e9d8b0', 12);
  for (const sx of [-0.42, 0.42]) {
    B.rbox([0.13 * s, 0.75 * s, 0.035], shade(c2, -0.25), 'leather', [sx * s, 0.12 * s, zf + 0.1 * s], null, null, 0.015);
    B.buckle([sx * s, -0.18 * s, zf + 0.13 * s], 0.75 * s, metal);
    B.ball(0.03 * s, metal, 'gold', [sx * s, 0.4 * s, zf + 0.12 * s], [1, 1, 0.6], null, 8);
  }
  if (p.pocket !== false) {
    const pc = p.pocketC || c2;
    B.rbox([1.1 * s, 0.62 * s, 0.26 * s], pc, k2, [0, -0.5 * s, zf + 0.1 * s], null, null, 0.08 * s);
    B.rbox([1.12 * s, 0.22 * s, 0.07 * s], shade(pc, -0.12), k2, [0, -0.25 * s, zf + 0.24 * s], [-0.1, 0, 0], null, 0.03 * s);
    B.ball(0.045 * s, metal, 'gold', [0, -0.34 * s, zf + 0.27 * s], [1, 1, 0.6], null, 10);
    B.seam([-0.5 * s, -0.78 * s, zf + 0.235 * s], [0.5 * s, -0.78 * s, zf + 0.235 * s], '#e9d8b0', 9);
  }
  if (p.side) for (const sx of [-1, 1]) {
    B.rbox([0.28 * s, 0.75 * s, 0.52 * s], p.side, k2, [sx * (W / 2 + 0.1 * s), -0.3 * s, zc], null, null, 0.08 * s);
    B.cyl(0.13 * s, 0.12 * s, 0.3 * s, IRON, 'metal', [sx * (W / 2 + 0.1 * s), 0.18 * s, zc], null, null, 16);
    B.cyl(0.07 * s, 0.07 * s, 0.08 * s, '#3a3040', 'dark', [sx * (W / 2 + 0.1 * s), 0.36 * s, zc], null, null, 12);
    B.tor(0.07 * s, 0.018 * s, metal, 'gold', [sx * (W / 2 + 0.02), 0.55 * s, zc], [0, PI / 2, 0]);
  }
  if (p.roll) {
    const ry = H / 2 + 0.2 * s;
    B.cyl(0.24 * s, 0.24 * s, 1.75 * s, p.roll, 'cloth', [0, ry, zc], [0, 0, PI / 2], null, 20);
    for (const sx of [-1, 1]) { B.tor(0.17 * s, 0.03, shade(p.roll, -0.2), 'cloth', [sx * 0.875 * s, ry, zc], [0, PI / 2, 0]); B.tor(0.08 * s, 0.025, shade(p.roll, -0.2), 'cloth', [sx * 0.876 * s, ry, zc], [0, PI / 2, 0]); }
    for (const sx of [-0.5, 0.5]) { B.tor(0.255 * s, 0.035, LEATHER, 'leather', [sx * s, ry, zc], [0, PI / 2, 0]); B.buckle([sx * s, ry, zc + 0.27 * s], 0.5, metal); }
  }
  if (p.rivets) for (const [x, y] of [[-0.68, 0.72], [0.68, 0.72], [-0.68, -0.8], [0.68, -0.8], [-0.68, -0.05], [0.68, -0.05], [-0.68, 0.33], [0.68, 0.33], [-0.68, -0.43], [0.68, -0.43]]) B.ball(0.055 * s, p.rivets, 'gold', [x * s, y * s, zf - 0.06 * s], [1, 1, 0.6], null, 12);
  if (p.trim) {
    const tk = p.trimK || 'metal';
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) { B.rbox([0.2 * s, 0.2 * s, 0.2 * s], p.trim, tk, [sx * (W / 2 - 0.05), sy * (H / 2 - 0.12 * s), zf - 0.05], null, null, 0.04); B.ball(0.035 * s, shade(p.trim, 0.3), 'gold', [sx * (W / 2 - 0.05), sy * (H / 2 - 0.12 * s), zf + 0.06], null, null, 8); }
    B.rbox([W + 0.06, 0.07 * s, 0.07], p.trim, tk, [0, -0.86 * s, zf - 0.02], null, null, 0.02);
  }
  if (p.emblem) B.emblem(p.emblem, [0, -0.5 * s, zf + 0.24 * s], s);
  if (p.glow) B.sparkle(30, [2 * s, 2.2 * s, 1.4 * s], p.glow, [0, 0, 0.6 * s]);
  if (p.extra) p.extra(B, s);
};

A.chest = (B, p) => {
  const s = p.size || 1, c = p.c, k = p.k || 'wood', c2 = p.c2 || '#8a8f99', k2 = p.k2 || 'metal';
  B.straps(p.strap || LEATHER, 'leather');
  const W = 1.6 * s, D = 0.9 * s, zc = 0.55 * s, zf = zc + D / 2;
  for (let i = 0; i < 4; i++) B.rbox([W, 0.235 * s, D], i % 2 ? shade(c, -0.06) : c, k, [0, -0.66 * s + i * 0.245 * s, zc], null, null, 0.035 * s);
  B.half(0.45 * s, W, c, k, [0, 0.25 * s, zc], [0, 0, PI / 2]);
  for (let i = 1; i < 4; i++) { const a = (i / 4) * PI; B.box([W * 0.995, 0.02, 0.02], shade(c, -0.45), 'dark', [0, 0.25 * s + Math.sin(a) * 0.452 * s, zc + Math.cos(a) * 0.452 * s], [a, 0, 0]); }
  B.rbox([W + 0.04, 0.1 * s, D + 0.04], c2, k2, [0, 0.25 * s, zc], null, null, 0.03);
  for (const sx of [-0.55, 0.55]) {
    B.rbox([0.13 * s, 1.02 * s, D + 0.04], c2, k2, [sx * s, -0.25 * s, zc], null, null, 0.03);
    B.tor(0.455 * s, 0.05 * s, c2, k2, [sx * s, 0.25 * s, zc], [0, PI / 2, 0], null, PI);
    B.rivets([sx * s, -0.7 * s, zf + 0.025], [sx * s, 0.18 * s, zf + 0.025], 5, shade(c2, 0.25), 0.03 * s);
  }
  for (const sx of [-1, 1]) for (const sy of [-0.74, 0.2]) B.rbox([0.16 * s, 0.16 * s, 0.16 * s], c2, k2, [sx * (W / 2 - 0.02), sy * s, zf - 0.02], null, null, 0.03);
  for (const sx of [-0.7, 0.7]) B.ball(0.08 * s, c2, k2, [sx * s, -0.8 * s, zc], [1, 0.6, 1], null, 12);
  // Schloss
  B.rbox([0.32 * s, 0.38 * s, 0.08 * s], GOLD, 'gold', [0, 0.06 * s, zf + 0.04 * s], null, null, 0.03);
  B.tor(0.07 * s, 0.022 * s, GOLD, 'gold', [0, 0.28 * s, zf + 0.06 * s], null, null);
  B.cyl(0.035 * s, 0.035 * s, 0.03, DARK, 'dark', [0, 0.1 * s, zf + 0.09 * s], [PI / 2, 0, 0], null, 10);
  B.box([0.025 * s, 0.07 * s, 0.03], DARK, 'dark', [0, 0.05 * s, zf + 0.09 * s]);
  if (p.gems) p.gems.forEach((g, i) => B.gem(0.08 * s, g, [(i - (p.gems.length - 1) / 2) * 0.4 * s, -0.32 * s, zf + 0.05 * s]));
  if (p.coins) {
    B.cone(0.55 * s, 0.35 * s, GOLD, 'gold', [0, 0.8 * s, zc], null, null, 14);
    for (let i = 0; i < p.coins; i++) B.coin([Math.sin(i * 2.3) * 0.6 * s, 0.7 * s + (i % 3) * 0.07, zc + Math.cos(i * 1.7) * 0.4 * s], [PI / 2 + Math.sin(i) * 0.8, i, 0], null, 0.7 * s);
    B.glow(1.6 * s, '#ffe08a', [0, 0.95 * s, zc], null, 0.45);
  }
  if (p.handles) for (const sx of [-1, 1]) { B.rbox([0.05, 0.22 * s, 0.3 * s], c2, k2, [sx * (W / 2 + 0.02), -0.15 * s, zc], null, null, 0.02); B.tor(0.13 * s, 0.03 * s, c2, k2, [sx * (W / 2 + 0.06), -0.2 * s, zc], [0, PI / 2, 0], null, PI); }
  if (p.glow) B.sparkle(34, [2 * s, 2 * s, 1.5 * s], p.glow, [0, 0, 0.6 * s]);
  if (p.extra) p.extra(B, s);
};

A.jars = (B, p = {}) => {
  B.straps(LEATHER, 'leather');
  const W = '#7a5232';
  for (const sx of [-0.85, 0.85]) { B.rbox([0.12, 2.0, 0.12], W, 'wood', [sx, -0.05, 0.55], null, null, 0.03); B.ball(0.09, BRASS, 'gold', [sx, 1.0, 0.55], null, null, 12); }
  for (const y of [-0.98, 0.62]) B.rbox([1.84, 0.1, 0.74], W, 'wood', [0, y, 0.55], null, null, 0.03);
  B.rbox([1.8, 1.65, 0.06], shade(W, -0.2), 'wood', [0, -0.15, 0.15], null, null, 0.02);
  const jar = [[0, -0.6], [0.24, -0.6], [0.28, -0.55], [0.29, 0.35], [0.24, 0.45], [0.21, 0.5], [0.23, 0.55], [0, 0.55]];
  [-0.55, 0, 0.55].forEach((x, j) => {
    const fill = 6 + j * 3;
    const wob = B.pivot([x, -0.9, 0.55]);
    for (let i = 0; i < fill; i++) B.coin([Math.sin(i * 1.7) * 0.02, i * 0.07, Math.cos(i) * 0.02], [Math.sin(i) * 0.15, i, 0], wob, 0.75);
    B.anims.push((t) => { const k = WALK.k, ph = WALK.phase * 2 + j; wob.position.y = -0.9 + Math.abs(Math.sin(ph)) * 0.05 * k; wob.rotation.z = Math.sin(ph) * 0.08 * k; wob.rotation.x = Math.cos(ph * 0.7) * 0.06 * k; });
    B.lathe(jar, '#d8f1ff', 'glass', [x, -0.32, 0.55], null, null, 28, 'jar');
    B.tor(0.23, 0.025, '#d8f1ff', 'glass', [x, 0.22, 0.55], [PI / 2, 0, 0]);
    B.cyl(0.21, 0.22, 0.1, j === 1 ? '#b07a3a' : '#c9b08a', j === 1 ? 'metal' : 'wood', [x, 0.27, 0.55], null, null, 20);
    B.ball(0.05, BRASS, 'gold', [x, 0.34, 0.55], null, null, 10);
    B.rbox([0.32, 0.24, 0.01], '#efe3c2', 'cloth', [x, -0.25, 0.85], null, null, 0.005);
    B.coin([x, -0.25, 0.86], null, null, 0.3);
    B.glow(0.7, '#ffe08a', [x, -0.6, 0.6], null, 0.35);
  });
  B.rbox([1.9, 0.1, 0.06], LEATHER, 'leather', [0, 0.05, 0.93], null, null, 0.02);
  B.buckle([0, 0.05, 0.96], 0.6, BRASS);
  B.sparkle(14, [1.4, 1.2, 0.5], '#fff1a8', [0, -0.3, 0.6], 0.07, 0.25);
  if (p.extra) p.extra(B);
};

A.piggy = (B, p = {}) => {
  const P = '#f4a7bb', P2 = shade(P, -0.12);
  B.straps('#c7647f', 'leather');
  B.ball(0.85, P, 'plastic', [0, -0.1, 0.8], [1.15, 0.95, 0.9], null, 36);
  B.tor(0.82, 0.04, '#c7647f', 'leather', [0, -0.1, 0.8], [0, 0, 0]).scale.set(1.17, 0.97, 1);
  B.cyl(0.28, 0.3, 0.22, P2, 'plastic', [0, -0.05, 1.6], [PI / 2, 0, 0], null, 24);
  B.tor(0.27, 0.035, shade(P, -0.05), 'plastic', [0, -0.05, 1.71]);
  for (const sx of [-0.1, 0.1]) B.ball(0.055, '#7a2d45', 'dark', [sx, -0.05, 1.71], [1, 1.3, 0.5], null, 10);
  for (const sx of [-0.32, 0.32]) {
    B.ball(0.11, '#ffffff', 'plastic', [sx, 0.27, 1.43], [1, 1.15, 0.6], null, 14);
    B.ball(0.065, '#1a1018', 'dark', [sx, 0.26, 1.5], [1, 1, 0.6], null, 12);
    B.ball(0.02, '#ffffff', 'neon', [sx + 0.02, 0.29, 1.54], null, null, 6);
    B.rbox([0.16, 0.035, 0.03], '#7a2d45', 'plastic', [sx, 0.42, 1.43], [0, 0, -sx * 0.6], null, 0.012);
    B.ball(0.12, '#ff7fa6', 'plastic', [sx * 1.5, 0.02, 1.38], [1, 0.6, 0.3], null, 12);
    B.cone(0.19, 0.32, P2, 'plastic', [sx * 1.4, 0.72, 1.0], [0.4, 0, -sx], null, 12);
    B.cone(0.11, 0.2, '#ff8fb0', 'plastic', [sx * 1.4, 0.7, 1.06], [0.4, 0, -sx], null, 10);
  }
  B.ball(0.05, '#ffcf4a', 'plastic', [0.42, 0.85, 1.0], null, null, 8);
  B.tor(0.05, 0.02, '#e63946', 'plastic', [0.36, 0.85, 1.0], [0, 0, 0.5]);
  B.tor(0.05, 0.02, '#e63946', 'plastic', [0.48, 0.85, 1.0], [0, 0, -0.5]);
  for (const [x, z] of [[-0.5, 0.45], [0.5, 0.45], [-0.5, 1.1], [0.5, 1.1]]) { B.cyl(0.14, 0.15, 0.26, P2, 'plastic', [x, -0.86, z], null, null, 14); B.cyl(0.155, 0.15, 0.08, '#5a2a3a', 'dark', [x, -1.02, z], null, null, 14); }
  B.rbox([0.42, 0.07, 0.1], DARK, 'dark', [0, 0.72, 0.8], null, null, 0.02);
  B.coin([0, 0.86, 0.8], [0, PI / 2, PI / 2], null, 0.8);
  B.glow(0.6, '#ffe08a', [0, 0.85, 0.8], null, 0.5);
  if (p.extra) p.extra(B);
};

A.roll = (B) => {
  B.straps('#5a3a22', 'leather');
  B.rbox([1.8, 0.2, 0.74], '#8a5a33', 'metal', [0, -0.95, 0.5], null, null, 0.05);
  B.rivets([-0.8, -0.95, 0.88], [0.8, -0.95, 0.88], 6, '#cd8a4f', 0.035);
  [-0.6, -0.2, 0.2, 0.6].forEach((x, j) => {
    const n = 18 + (j % 2) * 4;
    for (let i = 0; i < n; i++) B.coin([x + Math.sin(i * 1.3) * 0.008, -0.82 + i * 0.072, 0.5], [0, i * 0.4, 0], null, 0.68, i % 7 === 0 ? '#ffd23f' : GOLD);
    if (j % 2 === 0) {
      const h = n * 0.072 * 0.6, y = -0.82 + n * 0.072 * 0.45;
      B.cyl(0.215, 0.215, h, '#b5763f', 'cloth', [x, y, 0.5], null, null, 24);
      B.tor(0.217, 0.012, '#7a2a2a', 'plastic', [x, y + h * 0.3, 0.5], [PI / 2, 0, 0]);
      B.tor(0.217, 0.012, '#7a2a2a', 'plastic', [x, y - h * 0.3, 0.5], [PI / 2, 0, 0]);
      B.rbox([0.16, 0.12, 0.01], '#efe3c2', 'cloth', [x, y, 0.72], null, null, 0.004);
    }
  });
  for (const y of [-0.3, 0.35]) { B.rbox([1.82, 0.1, 0.06], '#5a3a22', 'leather', [0, y, 0.95], null, null, 0.02); B.buckle([0.92, y, 0.98], 0.55, '#cd8a4f'); }
  B.glow(1.2, '#ffe08a', [0, 0.6, 0.6], null, 0.3);
};

A.shield = (B, p) => {
  if (p.extraBack) p.extraBack(B, p.size || 1);
  const s = p.size || 1, c = p.c, rim = p.rim || GOLD;
  B.straps(LEATHER, 'leather');
  B.cyl(1.0 * s, 1.0 * s, 0.14, p.k === 'gold' ? c : shade(c, -0.25), p.k === 'gold' ? 'gold' : 'wood', [0, 0, 0.22], [PI / 2, 0, 0], null, 44);
  for (let i = -3; i <= 3; i++) { const x = i * 0.27 * s, ch = Math.sqrt(Math.max(0, 1 - (x / s) ** 2)) * 2 * s * 0.98; B.box([0.02, ch, 0.02], shade(c, -0.5), 'dark', [x, 0, 0.3]); }
  B.lathe([[0.55, 0.0], [0.95, 0.0], [0.95, 0.06], [0.55, 0.06]].map(([x, y]) => [x * s, y]), c, p.k || 'metal', [0, 0, 0.29], [PI / 2, 0, 0], null, 48, 'shieldring' + s);
  B.tor(1.03 * s, 0.085 * s, rim, 'gold', [0, 0, 0.26]);
  B.tor(0.94 * s, 0.03 * s, shade(rim, -0.2), 'gold', [0, 0, 0.34]);
  B.tor(0.56 * s, 0.045 * s, rim, 'gold', [0, 0, 0.34]);
  for (let i = 0; i < 4; i++) B.rbox([0.08 * s, 0.5 * s, 0.05], rim, 'gold', [Math.cos(i * PI / 2 + PI / 4) * 0.33 * s, Math.sin(i * PI / 2 + PI / 4) * 0.33 * s, 0.33], [0, 0, i * PI / 2 + PI / 4 - PI / 2], null, 0.02);
  B.lathe([[0, 0.25], [0.12, 0.22], [0.24, 0.12], [0.29, 0.02], [0.3, 0]].map(([x, y]) => [x * s, y * s]), rim, 'gold', [0, 0, 0.34], [PI / 2, 0, 0], null, 32, 'boss' + s);
  B.cone(0.06 * s, 0.25 * s, shade(rim, 0.2), 'gold', [0, 0, 0.7 + 0.0 * s], [PI / 2, 0, 0], null, 12);
  for (let i = 0; i < 16; i++) B.ball(0.04 * s, shade(rim, 0.2), 'gold', [Math.cos(i * PI / 8) * 0.88 * s, Math.sin(i * PI / 8) * 0.88 * s, 0.34], [1, 1, 0.6], null, 10);
  if (p.gem) { B.gem(0.13 * s, p.gem, [0, 0.72 * s, 0.37]); B.gem(0.1 * s, p.gem, [0, -0.72 * s, 0.37]); B.glow(0.7 * s, p.gem, [0, 0.72 * s, 0.45], null, 0.6); }
  if (p.glow) { const r = B.tor(1.18 * s, 0.03, p.glow, 'neonT', [0, 0, 0.3]); B.pulse(r, 0.05, 2); B.sparkle(20, [2.4 * s, 2.4 * s, 0.6], p.glow, [0, 0, 0.5]); }
  if (p.extra) p.extra(B, s);
};

A.barrel = (B) => {
  const W = '#8a5a2b';
  B.straps('#4a3020', 'leather');
  const prof = [[0, -0.95], [0.6, -0.95], [0.66, -0.6], [0.7, -0.15], [0.66, 0.4], [0.6, 0.85], [0, 0.85]];
  B.lathe(prof, W, 'wood', [0, -0.12, 0.8], null, null, 28, 'barrel');
  for (let i = 0; i < 14; i++) { const a = (i / 14) * PI * 2; B.box([0.015, 1.7, 0.015], shade(W, -0.5), 'dark', [Math.sin(a) * 0.705, -0.17, 0.8 + Math.cos(a) * 0.705]).rotation.set(0, a, 0); }
  for (const [y, r] of [[-0.88, 0.62], [-0.45, 0.685], [0.15, 0.69], [0.65, 0.635]]) { B.tor(r, 0.04, IRON, 'metal', [0, y - 0.12, 0.8], [PI / 2, 0, 0]); for (let i = 0; i < 6; i++) { const a = -0.9 + i * 0.36; B.ball(0.025, '#9aa3ad', 'metal', [Math.sin(a) * (r + 0.03), y - 0.12, 0.8 + Math.cos(a) * (r + 0.03)], null, null, 8); } }
  B.tor(0.58, 0.04, shade(W, -0.2), 'wood', [0, 0.73, 0.8], [PI / 2, 0, 0]);
  const g = B.cyl(0.56, 0.56, 0.04, '#ffcf4a', 'gold', [0, 0.69, 0.8], null, null, 32);
  B.bob(g, 0.02, 2.4);
  for (let i = 0; i < 9; i++) B.coin([Math.sin(i * 2.1) * 0.32, 0.74 + (i % 2) * 0.03, 0.8 + Math.cos(i * 1.3) * 0.32], [PI / 2 + i * 0.3, 0, i], null, 0.7);
  B.glow(1.6, '#ffe08a', [0, 0.85, 0.8], null, 0.45);
  B.cyl(0.07, 0.08, 0.25, BRASS, 'gold', [0, -0.55, 1.58], [PI / 2, 0, 0], null, 12);
  B.rbox([0.06, 0.2, 0.04], BRASS, 'gold', [0, -0.45, 1.66], null, null, 0.015);
  B.ball(0.05, '#ffd23f', 'gold', [0, -0.65, 1.68], [1, 1.3, 1], null, 10);
  B.rbox([0.5, 0.18, 0.02], '#efe3c2', 'cloth', [0, -0.05, 1.5], [-0.06, 0, 0], null, 0.008);
  B.coin([0, -0.05, 1.52], null, null, 0.35);
};

A.library = (B, p = {}) => {
  const W = '#7a4a26', BR = '#cd8a4f';
  B.straps('#4a3020', 'leather');
  B.rbox([1.7, 1.95, 0.08], shade(W, -0.25), 'wood', [0, -0.05, 0.12], null, null, 0.02);
  for (const sx of [-0.87, 0.87]) { B.rbox([0.14, 2.05, 0.74], W, 'wood', [sx, -0.05, 0.47], null, null, 0.03); B.ball(0.1, BR, 'gold', [sx, 1.05, 0.8], null, null, 12); B.cyl(0.05, 0.05, 1.7, BR, 'metal', [sx, -0.05, 0.86], null, null, 10); }
  for (const y of [-1.0, -0.37, 0.27, 0.9]) B.rbox([1.84, 0.08, 0.76], BR, 'metal', [0, y, 0.47], null, null, 0.02);
  [-0.68, 0.0, 0.62].forEach((y, row) => {
    for (let i = 0; i < 9; i++) {
      const x = -0.68 + i * 0.17;
      if ((i + row) % 5 === 4) { for (let j = 0; j < 4; j++) B.coin([x, y - 0.24 + j * 0.06, 0.5], [0, j, 0], null, 0.5, j % 2 ? '#e8ecf2' : GOLD); continue; }
      const tilt = (i * 3 + row) % 4 === 0 ? 0.2 : 0;
      B.coin([x, y + 0.04, 0.5], [0, 0, PI / 2 + tilt], null, 0.88, row === 1 ? '#e8ecf2' : row === 2 ? '#e0a050' : GOLD);
    }
  });
  if (!p.noCrest) { B.rbox([1.0, 0.28, 0.1], BR, 'metal', [0, 1.18, 0.8], null, null, 0.05); B.coin([0, 1.2, 0.86], null, null, 0.8); B.glow(0.8, '#ffe9b0', [0, 1.2, 0.95], null, 0.55); }
  // kleine Leiter
  const ld = B.pivot([0.62, -0.3, 0.95], [0, 0, 0.12]);
  for (const sx of [-0.1, 0.1]) B.cyl(0.02, 0.02, 1.3, '#a87a4a', 'wood', [sx, 0, 0], null, ld, 6);
  for (let i = 0; i < 5; i++) B.cyl(0.015, 0.015, 0.2, '#a87a4a', 'wood', [0, -0.5 + i * 0.25, 0], [0, 0, PI / 2], ld, 6);
  if (p.extra) p.extra(B);
};

A.shrine = (B, p) => {
  const s = p.size || 1, c = p.c, c2 = p.c2 || GOLD, k = p.k || 'metal';
  B.straps(p.strap || '#3a3040', 'leather', { metal: c2 });
  B.rbox([1.6 * s, 0.18 * s, 1.1 * s], c, k, [0, -1.0 * s, 0.6 * s], null, null, 0.04);
  B.rbox([1.45 * s, 0.16 * s, 0.98 * s], c, k, [0, -0.85 * s, 0.6 * s], null, null, 0.04);
  B.rbox([1.32 * s, 0.1 * s, 0.86 * s], c2, 'gold', [0, -0.74 * s, 0.6 * s], null, null, 0.03);
  for (const [x, z] of [[-0.55, 0.25], [0.55, 0.25], [-0.55, 0.95], [0.55, 0.95]]) {
    B.cyl(0.075 * s, 0.09 * s, 1.15 * s, c, k, [x * s, -0.1 * s, z * s], null, null, 12);
    for (let f = 0; f < 6; f++) { const a = f / 6 * PI * 2; B.box([0.012, 1.0 * s, 0.012], shade(c, -0.3), 'dark', [x * s + Math.cos(a) * 0.082 * s, -0.1 * s, z * s + Math.sin(a) * 0.082 * s]); }
    B.rbox([0.22 * s, 0.07 * s, 0.22 * s], c2, 'gold', [x * s, 0.5 * s, z * s], null, null, 0.02);
    B.rbox([0.22 * s, 0.07 * s, 0.22 * s], c2, 'gold', [x * s, -0.66 * s, z * s], null, null, 0.02);
  }
  B.rbox([1.5 * s, 0.14 * s, 1.05 * s], c2, 'gold', [0, 0.6 * s, 0.6 * s], null, null, 0.03);
  if (!p.noRoof) { B.cone(1.1 * s, 0.62 * s, c, k, [0, 0.98 * s, 0.6 * s], [0, PI / 4, 0], null, 4).scale.set(1, 1, 0.7); for (let i = 1; i < 4; i++) B.box([1.55 * s * (1 - i * 0.22), 0.02, 0.025], c2, 'gold', [0, 0.7 * s + i * 0.13 * s, 0.6 * s + 0.5 * s * (1 - i * 0.24)]); B.ball(0.1 * s, c2, 'gold', [0, 1.33 * s, 0.6 * s], null, null, 14); B.cone(0.05 * s, 0.25 * s, c2, 'gold', [0, 1.5 * s, 0.6 * s], null, null, 8); }
  if (p.glass) B.rbox([1.12 * s, 1.18 * s, 0.75 * s], '#dff1ff', 'glass', [0, -0.08 * s, 0.6 * s], null, null, 0.03);
  const pv = B.pivot([0, -0.12 * s, 0.6 * s]);
  B.coin([0, 0, 0], [PI / 2, 0, 0], pv, 1.15 * s);
  B.coin([0, 0, 0], [0, 0, PI / 2], pv, 1.15 * s);
  B.ball(0.12 * s, p.core || '#fff1a8', 'neon', [0, 0, 0], null, pv, 14);
  B.glow(1.1 * s, p.core || '#fff1a8', [0, 0, 0], pv, 0.7);
  B.spin(pv, 'y', 1.2);
  B.bob(pv, 0.06, 2);
  for (const x of [-0.42, 0.42]) { B.cyl(0.04 * s, 0.04 * s, 0.18 * s, '#f6f1e6', 'plastic', [x * s, -0.6 * s, 1.0 * s], null, null, 8); const f = B.cone(0.03 * s, 0.08 * s, '#ffb347', 'neon', [x * s, -0.47 * s, 1.0 * s], null, null, 8); B.glow(0.3 * s, '#ffb347', [x * s, -0.46 * s, 1.0 * s], null, 0.8); B.pulse(f, 0.15, 9); }
  if (p.glow) B.sparkle(28, [1.6 * s, 2 * s, 1.4 * s], p.glow, [0, 0, 0.6 * s]);
  if (p.extra) p.extra(B, s);
};

A.armor = (B, p) => {
  const s = p.size || 1, c = p.c, c2 = p.c2 || shade(c, -0.3), k = p.k || 'gold';
  B.rbox([1.95 * s, 2.05 * s, 0.14], c2, 'metal', [0, -0.02, 0.08], null, null, 0.06);
  for (let row = 0; row < 8; row++) {
    const y = 0.82 * s - row * 0.235 * s, off = row % 2 ? 0.13 : 0;
    for (let i = 0; i < 8; i++) {
      const x = (-0.91 + i * 0.26 + off) * s;
      if (Math.abs(x) > 0.86 * s) continue;
      if (p.square) B.rbox([0.24 * s, 0.26 * s, 0.05], c, k, [x, y, 0.2 + row * 0.012], [0.22, 0, 0], null, 0.04 * s);
      else B.ball(0.16 * s, row % 3 === 0 ? shade(c, 0.12) : c, k, [x, y, 0.2 + row * 0.012], [0.85, 1, 0.22], null, 16).rotation.x = 0.25;
    }
  }
  // Rahmen
  for (const sx of [-1, 1]) B.rbox([0.09 * s, 2.05 * s, 0.1], shade(c, 0.15), k, [sx * 0.97 * s, -0.02, 0.2], null, null, 0.03);
  B.rbox([1.98 * s, 0.09 * s, 0.1], shade(c, 0.15), k, [0, 1.0 * s, 0.2], null, null, 0.03);
  B.rbox([2.05 * s, 0.22 * s, 1.16], LEATHER, 'leather', [0, -0.92 * s, -0.5], null, null, 0.05);
  B.buckle([0, -0.92 * s, 0.11], 1.1, shade(c, 0.1));
  for (const sx of [-1, 1]) {
    for (let l = 0; l < 3; l++) B.ball((0.6 - l * 0.08) * s, l % 2 ? c2 : c, k, [sx * (1.08 + l * 0.06) * s, (0.98 - l * 0.16) * (1 + (s - 1) * 0.3), -0.5], [0.95, 0.55, 1.15], null, 24);
    B.tor(0.5 * s, 0.045 * s, shade(c, 0.2), k, [sx * 1.08 * s, 0.98, -0.5], [PI / 2, 0, 0]);
    B.rivets([sx * 0.9 * s, 1.18, -0.95], [sx * 0.9 * s, 1.18, -0.05], 4, shade(c, 0.3), 0.04);
    if (p.spikes) for (let j = 0; j < 3; j++) B.cone(0.1 * s, 0.38 * s, c2, 'metal', [sx * (1.05 + j * 0.12) * s, 1.38, -0.75 + j * 0.25], [0, 0, -sx * 0.4], null, 8);
  }
  if (p.spine) for (let i = 0; i < 6; i++) B.cone(0.09 * s, 0.32 * s, p.spine, p.spineK || 'gold', [0, 0.85 * s - i * 0.33 * s, 0.36], [PI / 2 - 0.5, 0, 0], null, 8);
  B.tor(0.24 * s, 0.05 * s, shade(c, 0.25), 'gold', [0, 0.15, 0.4]);
  if (p.gem) { B.gem(0.2 * s, p.gem, [0, 0.15, 0.42]); B.glow(0.9 * s, p.gem, [0, 0.15, 0.55], null, 0.6); }
  else B.coin([0, 0.15, 0.42], null, null, 0.75 * s);
  if (p.runes) for (let i = 0; i < 4; i++) { B.rbox([0.06, 0.42 * s, 0.02], p.runes, 'neon', [(-0.6 + i * 0.4) * s, -0.68 * s, 0.3], null, null, 0.01); B.glow(0.45 * s, p.runes, [(-0.6 + i * 0.4) * s, -0.68 * s, 0.35], null, 0.6); }
  if (p.glow) B.sparkle(30, [2.6 * s, 2.4 * s, 1.2], p.glow, [0, 0, 0.5]);
};

A.harness = (B) => {
  const G = GOLD;
  B.rbox([1.35, 1.55, 0.12], G, 'gold', [0, 0.05, 0.08], null, null, 0.08);
  B.rbox([1.05, 1.2, 0.06], '#7a1f2a', 'cloth', [0, 0.05, 0.16], null, null, 0.04);
  B.rivets([-0.6, 0.75, 0.17], [0.6, 0.75, 0.17], 7, '#fff1a8', 0.035);
  B.rivets([-0.6, -0.65, 0.17], [0.6, -0.65, 0.17], 7, '#fff1a8', 0.035);
  for (const sx of [-1, 1]) {
    B.rbox([0.2, 2.6, 0.06], LEATHER, 'leather', [sx * 0.3, 0, 0.13], [0, 0, sx * 0.62], null, 0.02);
    for (let l = 0; l < 3; l++) B.ball(0.5 - l * 0.07, l % 2 ? '#b8860b' : G, 'gold', [sx * (1.05 + l * 0.05), 0.98 - l * 0.14, -0.5], [0.9, 0.55, 1.1], null, 24);
    for (let i = 0; i < 7; i++) { B.cyl(0.025, 0.02, 0.32, G, 'gold', [sx * (1.42 + 0.0), 0.65 - 0.0, -0.95 + i * 0.15], [0, 0, 0], null, 6); B.ball(0.035, G, 'gold', [sx * 1.42, 0.48, -0.95 + i * 0.15], null, null, 6); }
    B.rbox([0.22, 0.09, 1.1], LEATHER, 'leather', [sx * 0.55, 1.04, -0.5], null, null, 0.03);
  }
  B.rbox([2.1, 0.24, 1.12], LEATHER, 'leather', [0, -0.85, -0.5], null, null, 0.05);
  B.buckle([0, -0.85, 0.08], 1.2, G);
  [[-0.32, 0.32, '#c33'], [0, 0.42, '#36c'], [0.32, 0.32, '#3a3']].forEach(([x, y, col]) => {
    B.rbox([0.13, 0.25, 0.03], col, 'cloth', [x, y + 0.12, 0.22], null, null, 0.01);
    B.box([0.035, 0.25, 0.032], '#fff', 'cloth', [x, y + 0.12, 0.225]);
    B.coin([x, y - 0.1, 0.23], null, null, 0.48);
    B.emblem('star', [x, y - 0.1, 0.26], 0.3);
  });
  for (let i = 0; i < 9; i++) B.tor(0.035, 0.012, G, 'gold', [-0.32 + i * 0.08, 0.02 - Math.sin(i / 8 * PI) * 0.08, 0.22], [0, i % 2 ? PI / 2 : 0, 0]);
  B.emblem('star', [0, -0.35, 0.22], 1.25);
  B.glow(0.8, '#fff1a8', [0, -0.35, 0.3], null, 0.4);
};

A.cloak = (B, p) => {
  const c = p.c || '#8c1d2f', t = p.trim || GOLD, lining = shade(t, -0.1);
  B.ball(0.62, c, 'cloth', [0, 1.02, 0.05], [1.05, 0.55, 0.75], null, 24);
  for (let i = 0; i < 16; i++) { const a = (i / 16) * PI * 2; B.ball(0.12, '#f2ede4', 'cloth', [Math.cos(a) * 0.66, 1.08, -0.5 + Math.sin(a) * 0.62], null, null, 10); }
  const folds = 7;
  for (let i = 0; i < folds; i++) {
    const x = -0.95 + i * (1.9 / (folds - 1)), ry = (i % 2 ? 0.22 : -0.22);
    B.rbox([0.36, 3.35, 0.07], i % 2 ? shade(c, -0.12) : c, 'cloth', [x, -0.75, 0.32 + Math.abs(x) * -0.08 + (i % 2) * 0.05], [-0.13, ry, 0], null, 0.03);
  }
  for (const sx of [-1, 1]) { B.rbox([0.6, 3.15, 0.06], shade(c, -0.18), 'cloth', [sx * 1.22, -0.75, 0.04], [-0.1, sx * 0.7, 0], null, 0.03); B.rbox([0.5, 3.0, 0.04], lining, 'gold', [sx * 1.2, -0.72, 0.0], [-0.1, sx * 0.7, 0], null, 0.02); }
  B.rbox([2.2, 0.2, 0.12], '#f2ede4', 'cloth', [0, -2.38, 0.6], [-0.13, 0, 0], null, 0.05);
  for (let i = 0; i < 11; i++) B.coin([-1.0 + i * 0.2, -2.18, 0.63], [PI / 2 - 0.13, 0, 0], null, 0.52);
  for (let r = 0; r < 3; r++) for (let i = 0; i < 4; i++) B.emblem('star', [-0.6 + i * 0.4 + (r % 2) * 0.2, -0.2 - r * 0.6, 0.47 + r * 0.075], 0.45);
  for (const sx of [-1, 1]) { B.gem(0.14, '#c1121f', [sx * 0.62, 1.0, -0.98], [PI / 2, 0, 0]); B.tor(0.15, 0.03, t, 'gold', [sx * 0.62, 1.0, -0.99]); }
  for (let i = 0; i < 7; i++) B.tor(0.05, 0.015, t, 'gold', [-0.45 + i * 0.15, 0.93 - Math.sin(i / 6 * PI) * 0.12, -1.0], [0, i % 2 ? PI / 2 : 0, 0]);
  B.emblem('star', [0, -0.75, 0.6], 1.9);
  B.glow(1.0, '#fff1a8', [0, -0.75, 0.7], null, 0.35);
};
