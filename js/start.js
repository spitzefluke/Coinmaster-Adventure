// Startseite: Bereichs-Kacheln.

import { BEREICHE } from './bereiche.js';

// ── Kacheln ──────────────────────────────────────────────────────────────────

const grid = document.getElementById('area-grid');
for (const b of BEREICHE) {
  const live = b.status !== 'geplant';
  const el = document.createElement(live ? 'a' : 'div');
  el.className = 'area' + (live ? '' : ' is-planned') + (b.status === 'code' ? ' is-locked' : '');
  if (live) el.href = b.href;
  const label = { vorschau: 'Vorschau', code: 'Nur mit Code', geplant: 'Geplant' }[b.status];
  el.innerHTML = `
    <span class="area-status">${label}</span>
    <h3>${b.titel}</h3>
    <p>${b.text}</p>
    ${b.eckdaten.length ? `<ul class="area-facts">${b.eckdaten.map((e) => `<li>${e}</li>`).join('')}</ul>` : ''}
    ${live ? '<span class="area-go">Öffnen →</span>' : ''}`;
  grid.append(el);
}
