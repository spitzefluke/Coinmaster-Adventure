// Bausteine für den Feinschliff der Welten (Profi-Überarbeitung): Bänder, die dem Gelände folgen
// (Bäche, Lavaflüsse, Wege), aus flachen Quadern. Jeder Quader wird in Roblox 1:1 ein Block mit Drehung,
// darum keine Röhren (die würden zu liegenden Zylindern) und nichts, was im Boden verschwindet.

import * as THREE from 'three';

// Band entlang einer Kurve: segs flache Quader, jeder vom einen Kurvenpunkt zum nächsten, an den Boden geneigt.
// lift: Abstand der Oberseite über dem Gelände; thick: Dicke (reicht nach unten in den Boden, kein Spalt)
export function ribbon(ctx, curve, { width = 0.9, thick = 0.12, lift = 0.03, segs = 48, material, name, overlap = 0.06 } = {}) {
  const { root, height } = ctx;
  const group = new THREE.Group();
  const pts = [];
  for (let i = 0; i <= segs; i++) {
    const p = curve.getPoint(i / segs);
    pts.push(new THREE.Vector3(p.x, height(p.x, p.z) + lift, p.z));
  }
  for (let i = 0; i < segs; i++) {
    const a = pts[i], b = pts[i + 1];
    const len = a.distanceTo(b);
    if (len < 1e-3) continue;
    const m = new THREE.Mesh(new THREE.BoxGeometry(width, thick, len + overlap), material);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.position.y -= thick / 2;
    m.lookAt(b.x, b.y - thick / 2, b.z);
    if (name) m.userData.rbx = { name };
    m.castShadow = false;
    m.receiveShadow = true;
    group.add(m);
  }
  root.add(group);
  return group;
}

// Bach mit Ufer: dunkles, feuchtes Ufer, darüber das Wasser und in der Mitte ein heller Strömungsstreifen
export function creek(ctx, kit, curve, { width = 0.9, bank = '#5d6b3a', water = '#3fa6e6', light = '#a8e4ff' } = {}) {
  ribbon(ctx, curve, { width: width + 0.55, thick: 0.1, lift: 0.012, material: kit.M(bank, { roughness: 1 }), name: 'Ufer' });
  ribbon(ctx, curve, { width, thick: 0.1, lift: 0.04, material: kit.M(water, { roughness: 0.08, emissive: '#1f6fae', emissiveIntensity: 0.2 }), name: 'Bach' });
  ribbon(ctx, curve, { width: width * 0.28, thick: 0.04, lift: 0.055, segs: 32, material: kit.M(light, { roughness: 0.05, emissive: light, emissiveIntensity: 0.15 }), name: 'Bach' });
}
