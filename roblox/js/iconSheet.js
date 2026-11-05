// Icon-Bild für Roblox: alle Linien-Icons (spiel/js/icons.js) in Gold auf einem Bild, 8 pro Zeile,
// je 128 × 128 Pixel. In Roblox schneidet ImageRectOffset/ImageRectSize ein Icon heraus. Solange das Bild
// nicht hochgeladen ist (UITheme.IconSheet leer), zeigt GameUI stattdessen ein Emoji (ICON_EMOJI).

import { ICON_PATHS } from '../../spiel/js/icons.js';

export const ICON_CELL = 128;
export const ICON_COLS = 8;
export const ICON_NAMES = Object.keys(ICON_PATHS);

// Ersatz, solange kein Icon-Bild hochgeladen ist
export const ICON_EMOJI = {
  coin: '🪙', coins: '💰', tree: '🌳', bag: '🎒', shop: '🛒', gear: '⚙️', book: '📖', star: '⭐', close: '✕',
  lock: '🔒', check: '✔', search: '🔍', egg: '🥚', robux: '💎', sound: '🔊', music: '🎵', sparkle: '✨', skip: '⏩',
  numbers: '🔢', boot: '👟', magnet: '🧲', jump: '🦘', radar: '📡', compass: '🧭', clover: '🍀', gem: '💎',
  double: '✌️', cloud: '☁️', hand: '✋', tag: '🏷️', flame: '🔥', paw: '🐾', eggs: '🥚', nest: '🪺', moon: '🌙',
  auto: '🤖', trophy: '🏆', gift: '🎁', key: '🔑', pin: '📍', globe: '🌍', rocket: '🚀', rebirth: '♻️',
  sprout: '🌱', bolt: '⚡', wind: '💨', home: '🏛️', portal: '🌀',
};

export const iconOffset = (name) => {
  const i = ICON_NAMES.indexOf(name);
  return i < 0 ? null : [(i % ICON_COLS) * ICON_CELL, Math.floor(i / ICON_COLS) * ICON_CELL];
};

// Lua-Tabellen für UITheme
export function iconLua() {
  const str = (s) => JSON.stringify(s);
  const cells = ICON_NAMES.map((n) => {
    const [x, y] = iconOffset(n);
    return `${n} = Vector2.new(${x}, ${y})`;
  });
  const emoji = ICON_NAMES.map((n) => `${n} = ${str(ICON_EMOJI[n] || '•')}`);
  return { cells: cells.join(', '), emoji: emoji.join(', ') };
}

// Icon als SVG: dunkler Rand unter goldenem Strich, damit es auf jedem Grund lesbar ist
function svgFor(name) {
  const path = ICON_PATHS[name];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${ICON_CELL}" height="${ICON_CELL}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9a8"/><stop offset="0.55" stop-color="#f2c661"/><stop offset="1" stop-color="#c98f2e"/></linearGradient></defs>
  <g transform="translate(1.2 1.2) scale(0.9)" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <g stroke="#2a1e0a" stroke-width="3.6">${path}</g>
    <g stroke="url(#g)" stroke-width="1.9">${path.replace(/fill="currentColor"/g, 'fill="#f2c661"')}</g>
  </g></svg>`;
}

// Das ganze Bild im Browser zeichnen (Canvas); für die Vorschau und zum Herunterladen
export async function buildIconSheet() {
  const rows = Math.ceil(ICON_NAMES.length / ICON_COLS);
  const canvas = document.createElement('canvas');
  canvas.width = ICON_COLS * ICON_CELL;
  canvas.height = rows * ICON_CELL;
  const g = canvas.getContext('2d');
  await Promise.all(
    ICON_NAMES.map(
      (name) =>
        new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            const [x, y] = iconOffset(name);
            g.drawImage(img, x, y, ICON_CELL, ICON_CELL);
            resolve();
          };
          img.onerror = resolve;
          img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgFor(name));
        }),
    ),
  );
  return canvas;
}
