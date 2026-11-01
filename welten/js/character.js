// Normal große Roblox-Figur für den Größenvergleich auf den Inseln.
// Klassische Block-Proportionen in Studs: Beine 1×2×1, Rumpf 2×2×1, Arme 1×2×1, Kopf rund 1,2 –
// zusammen gut 5 Studs hoch. Die Webseite rechnet 1 Einheit = 8 Studs (wie der Roblox-Export).

import * as THREE from 'three';

export const STUDS = 8;
export const FIGURE_STUDS = 5.2;

const u = (studs) => studs / STUDS;

// Quader mit leicht gerundeten Kanten (wie Roblox-Teile mit SmoothPlastic)
function part(w, h, d, color, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(u(w), u(h), u(d)), new THREE.MeshStandardMaterial({ color, roughness: 0.45 }));
  m.position.set(u(x), u(y), u(z));
  m.castShadow = m.receiveShadow = true;
  return m;
}

function labelTexture(text) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#0f0d14e0';
  g.beginPath();
  g.roundRect(4, 14, 504, 100, 50);
  g.fill();
  g.strokeStyle = '#00a2ff';
  g.lineWidth = 6;
  g.stroke();
  g.fillStyle = '#ffffff';
  g.font = '600 46px Barlow, system-ui, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, 256, 66);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Figur samt Leuchtsäule und Schild; Füße bei y = 0
export function makeCharacter() {
  const g = new THREE.Group();
  g.name = 'Groessenvergleich';
  const skin = '#f2c8a0', shirt = '#00a2ff', pants = '#2f3a52';
  // Beine
  g.add(part(1, 2, 1, pants, -0.5, 1, 0), part(1, 2, 1, pants, 0.5, 1, 0));
  // Rumpf
  g.add(part(2, 2, 1, shirt, 0, 3, 0));
  // Arme
  g.add(part(1, 2, 1, skin, -1.5, 3, 0), part(1, 2, 1, skin, 1.5, 3, 0));
  // Kopf mit Gesicht
  const head = new THREE.Mesh(new THREE.CylinderGeometry(u(0.62), u(0.62), u(1.2), 20), new THREE.MeshStandardMaterial({ color: skin, roughness: 0.45 }));
  head.position.y = u(4.6);
  head.castShadow = true;
  g.add(head);
  const ink = new THREE.MeshBasicMaterial({ color: '#141018' });
  for (const x of [-0.2, 0.2]) {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(u(0.12), u(0.22), u(0.04)), ink);
    eye.position.set(u(x), u(4.72), u(0.62));
    g.add(eye);
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(u(0.2), u(0.035), 6, 16, Math.PI), ink);
  mouth.rotation.z = Math.PI;
  mouth.position.set(0, u(4.45), u(0.62));
  g.add(mouth);

  // Leuchtsäule, damit man die winzige Figur auch aus der Ferne findet
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(u(0.1), u(0.1), u(40), 8),
    new THREE.MeshBasicMaterial({ color: '#00a2ff', transparent: true, opacity: 0.55, depthWrite: false }),
  );
  beam.position.y = u(8 + 20);
  g.add(beam);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(u(2.4), u(0.12), 6, 40), new THREE.MeshBasicMaterial({ color: '#00a2ff' }));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.02;
  g.add(ring);
  // Schild über dem Kopf, immer gleich groß auf dem Bildschirm
  const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTexture('Roblox-Figur · 5 Studs'), depthTest: false, sizeAttenuation: false }));
  label.scale.set(0.2, 0.05, 1);
  label.position.y = u(6.8);
  label.renderOrder = 10;
  g.add(label);

  g.userData.update = (t) => {
    ring.scale.setScalar(1 + Math.sin(t * 3) * 0.08);
    beam.material.opacity = 0.4 + Math.sin(t * 3) * 0.15;
  };
  g.userData.dispose = () =>
    g.traverse((o) => {
      o.geometry?.dispose();
      o.material?.map?.dispose();
      o.material?.dispose();
    });
  return g;
}
