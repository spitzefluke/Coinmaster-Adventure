// Edelsteine: alle Steine des Juwelnebels als Karten, nach Seltenheit gruppiert, mit Wert und Drop-Chance.

import { GEMS, TIERS, tierById, gemBaseValue, gemsOfTier } from './gems.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const fmt = (n) => n.toLocaleString('de-DE');
const CUTS = { rund: 'Rund', oval: 'Oval', tropfen: 'Tropfen', smaragd: 'Smaragdschliff', herz: 'Herz', prinzess: 'Prinzess', stern: 'Stern' };

$('legend').innerHTML = TIERS.map((t) => `<li style="--c:${t.color}"><b>${t.name}</b><span>${t.chance.toLocaleString('de-DE')} % · ${gemsOfTier(t.id).length} Steine</span></li>`).join('');

let filter = 'alle';
function renderFilters() {
  const chips = [{ id: 'alle', name: `Alle ${GEMS.length}`, color: 'var(--brass)' }, ...TIERS];
  $('filters').innerHTML = chips
    .map((t) => `<button class="filter" type="button" data-tier="${t.id}" style="--c:${t.color}" aria-pressed="${filter === t.id}"><i></i>${esc(t.name)}</button>`)
    .join('');
}

function card(g) {
  const t = tierById[g.tier];
  const i = TIERS.indexOf(t);
  const cls = ['card', i >= 6 ? 'is-top' : '', i === TIERS.length - 1 ? 'is-secret' : ''].filter(Boolean).join(' ');
  return `<li class="${cls}" style="--c:${t.color}">
    <span class="gem cut-${g.cut}" style="--l:${g.colors[0]};--m:${g.colors[1]};--d:${g.colors[2]}" aria-hidden="true"></span>
    <p class="pill">${t.name}</p>
    <h3>${esc(g.name)}</h3>
    <p>${esc(g.text)}</p>
    <dl class="facts">
      <div><dt>Grundwert</dt><dd>${fmt(gemBaseValue(g))} Taler</dd></div>
      <div><dt>Schliff</dt><dd>${CUTS[g.cut] || g.cut}</dd></div>
    </dl>
  </li>`;
}

function render() {
  const tiers = filter === 'alle' ? TIERS : TIERS.filter((t) => t.id === filter);
  $('sections').innerHTML = tiers
    .map((t) => {
      const list = gemsOfTier(t.id);
      return `<section class="section" id="${t.id}" aria-labelledby="h-${t.id}" style="--c:${t.color}">
        <div class="section-head">
          <h2 id="h-${t.id}">${esc(t.name)}</h2>
          <p class="section-meta">${list.length} Steine · ${t.chance.toLocaleString('de-DE')} % Drop-Chance</p>
        </div>
        <ul class="cards">${list.map(card).join('')}</ul>
      </section>`;
    })
    .join('');
}

$('filters').addEventListener('click', (e) => {
  const b = e.target.closest('[data-tier]');
  if (!b) return;
  filter = b.dataset.tier;
  renderFilters();
  render();
});

renderFilters();
render();
