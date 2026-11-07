// Macht aus einem Haustier (Claude Design „Haustiere Viewer“, haustiere/js/models.js) Roblox-Teile.
// Die Tiere bestehen dort schon nur aus Block, Wedge, Ball und Cylinder mit Roblox-Materialien; hier werden
// sie in Studs umgerechnet: Füße auf y = 0, Blick nach −Z wie Roblox-Figuren, Zylinder entlang X,
// Keile mit der hohen Seite nach +Z (WedgePart).

import * as THREE from 'three';
import { Builder, hash, bounds } from '../../haustiere/js/engine.js';
import { MODELS, pedestal } from '../../haustiere/js/models.js';

// Größe im Spiel: normale Tiere 3 Studs hoch, epische 3,6
export const PET_HEIGHT = { normal: 3, epic: 3.6 };

const MAT = { Plastic: 'Plastic', Smooth: 'SmoothPlastic', Metal: 'Metal', Wood: 'Wood', Neon: 'Neon', Glass: 'Glass' };
const FLIP = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
const CYL = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2);

// Teile des Designs (Matrix je Teil) bauen; pedestal: Sockelinsel des Viewers mitbauen
export function buildPet(pet, { withPedestal = false } = {}) {
  const make = MODELS[pet.id];
  if (!make) throw new Error(`Kein Modell für ${pet.id}`);
  const b = new Builder(hash(pet.id));
  make(b);
  const own = b.parts.length;
  if (withPedestal) pedestal(b, pet.egg, pet.epic, pet.glow);
  return { parts: b.parts, box: bounds(b.parts.slice(0, own)) };
}

const cache = new Map();
export function petToParts(pet, { withPedestal = false } = {}) {
  const key = pet.id + (withPedestal ? '+sockel' : '');
  if (cache.has(key)) return cache.get(key);
  const { parts: raw, box } = buildPet(pet, { withPedestal });
  // auf Zielhöhe skalieren (lange Tiere auch nach der Länge begrenzen) und auf den Boden stellen
  const size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
  const H = pet.epic ? PET_HEIGHT.epic : PET_HEIGHT.normal, W = H * 1.5;
  const k = Math.min(H / Math.max(0.001, size.y), W / Math.max(0.001, size.x, size.z * 0.6));
  const height = size.y * k;
  // größte waagrechte Ausdehnung (für die Kamera der Vorschau), mit Sockel dessen Breite
  const full = withPedestal ? bounds(raw).getSize(new THREE.Vector3()) : size;
  const width = Math.max(full.x, full.z) * k;
  const pos = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3(), r = new THREE.Matrix4();
  const parts = [];
  for (const p of raw) {
    p.m.decompose(pos, q, s);
    // Mitte auf x/z = 0, Füße auf y = 0, dann um 180° drehen (Blick nach −Z)
    pos.set(-(pos.x - c.x) * k, (pos.y - box.min.y) * k, -(pos.z - c.z) * k);
    q.premultiply(FLIP);
    let size3 = [s.x * k, s.y * k, s.z * k];
    if (p.shape === 'Cylinder') {
      // Design-Zylinder stehen entlang Y, Roblox-Zylinder liegen entlang X
      q.multiply(CYL);
      size3 = [s.y * k, s.x * k, s.z * k];
    } else if (p.shape === 'Wedge') {
      // hohe Kante im Design bei −Z, beim WedgePart bei +Z
      q.multiply(FLIP);
    } else if (p.shape === 'Ball') {
      const d = Math.min(...size3);
      size3 = [d, d, d];
    }
    r.makeRotationFromQuaternion(q);
    const e = r.elements; // spaltenweise → Zeilen für CFrame
    const mat = MAT[p.mat] ?? 'Plastic';
    parts.push({
      shape: p.shape,
      className: p.shape === 'Wedge' ? 'WedgePart' : undefined,
      name: p.ped ? 'Sockel' : undefined,
      pos: [pos.x, pos.y, pos.z],
      rot: [e[0], e[4], e[8], e[1], e[5], e[9], e[2], e[6], e[10]],
      size: size3,
      color: p.color,
      material: mat,
      transparency: mat === 'Glass' ? 0.45 : 0,
      canCollide: false,
      castShadow: mat !== 'Neon' && mat !== 'Glass',
    });
  }
  const out = { pet, parts, height, width };
  cache.set(key, out);
  return out;
}
