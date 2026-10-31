// Kleine Münzbilder für Inventar und Fund-Liste: Metallscheibe mit dem Relief-Motiv.
// Ohne 3D, damit auch 100 Münzen im Inventar schnell erscheinen. Ergebnis wird zwischengespeichert.

import { COINS, tierById } from '../../muenzen/js/coins.js';
import { renderEmblem } from '../../muenzen/js/emblems.js';

const cache = new Map();

export function coinThumb(id, size = 96) {
  const key = `${id}:${size}`;
  if (cache.has(key)) return cache.get(key);
  const coin = COINS[id];
  const [hi, mid, lo] = coin.metal;
  const s = size * 2; // für scharfe Darstellung auf hochauflösenden Bildschirmen
  const cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const ctx = cv.getContext('2d');
  const c = s / 2;
  // Rand
  let g = ctx.createLinearGradient(0, 0, s, s);
  g.addColorStop(0, hi);
  g.addColorStop(0.5, mid);
  g.addColorStop(1, lo);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(c, c, c - 1, 0, Math.PI * 2);
  ctx.fill();
  // Feld
  g = ctx.createRadialGradient(c * 0.8, c * 0.7, 0, c, c, c * 0.86);
  g.addColorStop(0, mid);
  g.addColorStop(1, lo);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(c, c, c * 0.86, 0, Math.PI * 2);
  ctx.fill();
  // Perlkreis
  ctx.fillStyle = hi;
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(c + Math.cos(a) * c * 0.79, c + Math.sin(a) * c * 0.79, s * 0.012, 0, Math.PI * 2);
    ctx.fill();
  }
  // Motiv
  const es = Math.round(s * 0.66);
  const { colorCv } = renderEmblem(coin.emblem, es, coin.metal);
  ctx.drawImage(colorCv, c - es / 2, c - es / 2);
  const url = cv.toDataURL('image/png');
  cache.set(key, url);
  return url;
}

export const tierOf = (id) => tierById[COINS[id].tier];
