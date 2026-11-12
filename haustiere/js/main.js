// Haustiere: alle Pets als Karten, nach Ei gruppiert, mit Seltenheit, Drop-Chance und kurzer Beschreibung.

import { EGGS, PETS, PET_RARITIES, rarityById, fmtChance } from './pets.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

$('legend').innerHTML = PET_RARITIES.map((r) => `<li style="--c:${r.color}"><b>${r.name}</b><span>${fmtChance(r.chance)}</span></li>`).join('');

let filter = 'alle';
function renderFilters() {
  const chips = [{ id: 'alle', name: `Alle ${EGGS.length} Eier`, glow: 'var(--brass)' }, ...EGGS];
  $('filters').innerHTML = chips
    .map((e) => `<button class="filter" type="button" data-egg="${e.id}" style="--c:${e.glow}" aria-pressed="${filter === e.id}"><i></i>${esc(e.name)}</button>`)
    .join('');
}

function card(p) {
  const r = rarityById[p.rarity];
  const cls = ['card', r.index >= 6 ? 'is-top' : '', p.rarity === 'secret' ? 'is-secret' : ''].filter(Boolean).join(' ');
  return `<li class="${cls}" style="--c:${r.color}">
    <p class="pill">${r.name}</p>
    <h3>${esc(p.name)}</h3>
    <p>${esc(p.text)}</p>
    <dl class="facts"><div><dt>Chance</dt><dd>${fmtChance(p.chance)}</dd></div></dl>
  </li>`;
}

function render() {
  const eggs = filter === 'alle' ? EGGS : EGGS.filter((e) => e.id === filter);
  $('sections').innerHTML = eggs
    .map((egg, i) => {
      const pets = PETS.filter((p) => p.egg === egg.id);
      return `<section class="section" id="${egg.id}" aria-labelledby="h-${egg.id}" style="--c:${egg.glow}">
        <div class="section-head">
          <h2 id="h-${egg.id}">${EGGS.indexOf(egg) + 1}. ${esc(egg.name)}</h2>
          <p class="section-meta">${pets.length} Pets</p>
          ${egg.built ? '' : '<span class="badge">Ei kommt noch</span>'}
        </div>
        <ul class="cards">${pets.map(card).join('')}</ul>
      </section>`;
    })
    .join('');
}

$('filters').addEventListener('click', (e) => {
  const b = e.target.closest('[data-egg]');
  if (!b) return;
  filter = b.dataset.egg;
  renderFilters();
  render();
});

renderFilters();
render();
