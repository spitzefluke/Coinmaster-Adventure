// ── Nr. 80 komplett neu: Komet mit Gesteinskern, Glutrissen, Koma, goldener Trage und Partikelschweif aus Gold und Münzen ──
A.comet = (B, p) => {
  const G = GOLD;
  // Trage: Rückenplatte, Ring um den Kometen, drei Streben
  B.straps('#3a2a1c', 'leather', { metal: G });
  B.rbox([0.7, 0.75, 0.16], '#3a3040', 'metal', [0, 0.25, 0.1], null, null, 0.08);
  B.tor(0.2, 0.04, G, 'gold', [0, 0.25, 0.19]);
  B.gem(0.1, '#ff9a2e', [0, 0.25, 0.21]);
  const c = [0, 0.45, 1.0];
  const ring = B.pivot(c, [0.35, 0, 0]);
  B.tor(0.95, 0.05, G, 'gold', [0, 0, 0], [PI / 2, 0, 0], ring);
  B.tor(0.95, 0.018, '#fff1a8', 'neon', [0, 0.05, 0], [PI / 2, 0, 0], ring);
  for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; B.ball(0.05, G, 'gold', [Math.cos(a) * 0.95, 0, Math.sin(a) * 0.95], null, ring, 8); }
  for (const a of [-PI / 2 - 0.9, -PI / 2, -PI / 2 + 0.9]) {
    const from = new THREE.Vector3(Math.cos(a) * 0.3, 0.25 + Math.sin(a) * 0.3, 0.2), to = new THREE.Vector3(Math.cos(a) * 0.9 * 0.7, c[1] + Math.sin(a) * 0.9, c[2] - 0.15);
    const mid = from.clone().add(to).multiplyScalar(0.5); const d = from.distanceTo(to);
    const m = B.cyl(0.04, 0.05, d, G, 'gold', [mid.x, mid.y, mid.z], null, null, 8);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize());
    B.ball(0.07, G, 'gold', [to.x, to.y, to.z], null, null, 10);
  }
  // Kern: zerklüfteter Fels (verformter Ikosaeder) mit Glutrissen, Eiskristallen und eingeschlossenen Münzen
  const core = B.pivot(c);
  const rock = geo('cometRock', () => {
    const g = new THREE.IcosahedronGeometry(0.62, 3);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(pos, i);
      const n = Math.sin(v.x * 7.1) * Math.cos(v.y * 6.3) * Math.sin(v.z * 5.7) * 0.09 + Math.sin(v.x * 17 + v.z * 13) * 0.025;
      v.multiplyScalar(1 + n + (v.z > 0.3 ? 0.08 : 0));
      pos.setXYZ(i, v.x, v.y * 0.92, v.z);
    }
    g.computeVertexNormals();
    return g;
  });
  B.mesh(rock, '#5a5048', 'stone', [0, 0, 0], null, core);
  const cracks = [[0.1, 0.55, 0.25, -0.1, 0.3, 0.52], [-0.2, 0.3, 0.55, 0.15, -0.2, 0.58], [0.35, -0.1, 0.5, 0.05, -0.45, 0.4], [-0.45, 0.05, 0.42, -0.3, -0.35, 0.45], [0.5, 0.3, 0.3, 0.55, -0.15, 0.3]];
  for (const [x0, y0, z0, x1, y1, z1] of cracks) {
    const a = new THREE.Vector3(x0, y0, z0), b = new THREE.Vector3(x1, y1, z1); const mid = a.clone().add(b).multiplyScalar(0.5); const d = a.distanceTo(b);
    const m = B.cyl(0.022, 0.012, d, '#ffb347', 'neon', [mid.x, mid.y, mid.z], null, core, 5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    B.glow(0.35, '#ff9a2e', [mid.x, mid.y, mid.z + 0.05], core, 0.7);
  }
  for (let i = 0; i < 10; i++) { const a = i * 2.39, b = (i % 5 - 2) * 0.45; B.oct(0.09 + (i % 3) * 0.03, '#bff6ff', 'gem', [Math.cos(a) * Math.cos(b) * 0.6, Math.sin(b) * 0.55, Math.sin(a) * Math.cos(b) * 0.6], [0.6, 1.5, 0.6], [a, b, 0], core); }
  for (let i = 0; i < 9; i++) { const a = i * 1.7 + 0.4, b = (i % 3 - 1) * 0.5; B.coin([Math.cos(a) * Math.cos(b) * 0.62, Math.sin(b) * 0.58, Math.sin(a) * Math.cos(b) * 0.62], [a, b, 0.4], core, 0.55); }
  B.spin(core, 'y', 0.35);
  B.anims.push((t) => { core.rotation.x = Math.sin(t * 0.6) * 0.15; });
  // Koma: Schichten aus Licht und ein durchscheinender Mantel
  B.ball(0.82, '#ffe08a', 'haze', c, null, null, 24);
  B.ball(1.05, '#ff9a2e', 'haze', c, null, null, 24);
  for (const [sz, col, op] of [[1.3, '#ffffff', 0.55], [2.4, '#ffd27a', 0.4], [3.8, '#ff9a2e', 0.2]]) { const g = B.glow(sz, col, c, null, op); B.pulse(g, 0.06, 2.5 + sz); }
  // Schweif aus Partikeln (Gold → Orange → Rot) und Münzen; wächst langsam beim Laufen
  const N = 420, pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  const parts = Array.from({ length: N }, (_, i) => ({ age: (i / N) * 3, life: 1.6 + (i % 7) * 0.25, v: new THREE.Vector3(), p: new THREE.Vector3() }));
  const geoP = new THREE.BufferGeometry(); geoP.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geoP.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const pts = new THREE.Points(geoP, new THREE.PointsMaterial({ size: 0.32, vertexColors: true, map: texture('glow'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  pts.frustumCulled = false;
  B.parts[0].parent.add(pts);
  const c0 = new THREE.Color('#ffe08a').convertSRGBToLinear(), c1 = new THREE.Color('#ffb347').convertSRGBToLinear(), c2 = new THREE.Color('#c1121f').convertSRGBToLinear();
  const coins = Array.from({ length: 26 }, (_, i) => ({ m: B.coin([0, 0, 0], [0, 0, 0], null, 0.5), age: (i / 26) * 2.5, life: 2.2 + (i % 4) * 0.3, v: new THREE.Vector3(), p: new THREE.Vector3() }));
  const ion = Array.from({ length: 12 }, (_, i) => B.glow(0.7, '#9fd3ff', c, null, 0.45));
  let grow = 0.25, last = 0;
  const spawn = (o, k) => {
    const a = Math.random() * PI * 2, r = Math.random() * 0.5;
    o.p.set(c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r * 0.8, c[2] + 0.35);
    o.v.set(Math.cos(a) * 0.25 + (Math.random() - 0.5) * 0.3, 0.35 + Math.random() * 0.45, 1.2 + Math.random() * 1.4 + k * 2.5);
    o.age = 0;
  };
  B.anims.push((t) => {
    const dt = Math.min(0.05, t - last); last = t;
    const target = 0.25 + WALK.k * 0.75;
    grow += (target - grow) * Math.min(1, dt * (target > grow ? 0.35 : 1.0));   // wächst langsam, schrumpft schneller
    for (let i = 0; i < N; i++) {
      const o = parts[i];
      o.age += dt;
      const life = o.life * (0.45 + grow);
      if (o.age > life || o.p.lengthSq() === 0) spawn(o, grow);
      o.v.y += dt * 0.25; o.v.x *= 1 - dt * 0.4;
      o.p.addScaledVector(o.v, dt * (0.4 + grow));
      const u = Math.min(1, o.age / life);
      pos[i * 3] = o.p.x + Math.sin(t * 3 + i) * 0.05 * u; pos[i * 3 + 1] = o.p.y; pos[i * 3 + 2] = o.p.z;
      const cc = u < 0.35 ? c0.clone().lerp(c1, u / 0.35) : c1.clone().lerp(c2, (u - 0.35) / 0.65);
      const f = (1 - u) * (1.0 + grow * 0.8);
      col[i * 3] = cc.r * f; col[i * 3 + 1] = cc.g * f; col[i * 3 + 2] = cc.b * f;
    }
    geoP.attributes.position.needsUpdate = true; geoP.attributes.color.needsUpdate = true;
    coins.forEach((o, i) => {
      o.age += dt;
      const life = o.life * (0.4 + grow);
      if (o.age > life || o.p.lengthSq() === 0) spawn(o, grow);
      o.p.addScaledVector(o.v, dt * (0.35 + grow * 0.9));
      const u = Math.min(1, o.age / life);
      o.m.position.copy(o.p); o.m.rotation.set(t * 7 + i, t * 4 + i, 0);
      o.m.scale.setScalar(Math.max(0.001, (1 - u) * (0.35 + grow * 0.45)));
    });
    ion.forEach((g, i) => { const u = i / 12, L = 1.2 + grow * 4; g.position.set(c[0], c[1] + 0.1 + u * L * 0.2, c[2] + 0.5 + u * L); g.scale.setScalar(0.9 * (1 - u * 0.75)); g.material.opacity = 0.5 * (1 - u) * (0.4 + grow); });
  });
  // kleine Bruchstücke, die den Kern umkreisen
  const orb = B.pivot(c, [0.5, 0, 0.2]);
  for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; B.oct(0.08, i % 2 ? '#6e6458' : '#bff6ff', i % 2 ? 'stone' : 'gem', [Math.cos(a) * 1.25, Math.sin(i * 2) * 0.1, Math.sin(a) * 1.25], [1, 0.8, 1], [i, i, 0], orb); }
  B.spin(orb, 'y', 1.1);
  B.bob(core, 0.05, 1.4);
};
