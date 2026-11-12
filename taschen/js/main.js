// Taschen: alle Rücken-Items als Karten, nach Stufe gruppiert, mit Beschreibung, Preis und Kapazität.

import { BAGS, BAG_TIERS, tierById, fmtCoins } from './bags.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const ofTier = (id) => BAGS.filter((b) => b.tier === id);
const capText = (b) => (b.capacity === null ? 'Unbegrenzt' : `${fmtCoins(b.capacity)} Münzen`);

$('legend').innerHTML = BAG_TIERS.map((t) => {
  const list = ofTier(t.id);
  return `<li style="--c:${t.color}"><b>${t.name}</b><span>Nr. ${list[0].nr}–${list.at(-1).nr}</span></li>`;
}).join('');

let filter = 'alle';
function renderFilters() {
  const chips = [{ id: 'alle', name: `Alle ${BAGS.length}`, color: 'var(--brass)' }, ...BAG_TIERS];
  $('filters').innerHTML = chips
    .map((t) => `<button class="filter" type="button" data-tier="${t.id}" style="--c:${t.color}" aria-pressed="${filter === t.id}"><i></i>${esc(t.name)}</button>`)
    .join('');
}

function card(b) {
  const t = tierById[b.tier];
  const cls = ['card', t.index >= 6 ? 'is-top' : '', b.capacity === null ? 'is-secret' : ''].filter(Boolean).join(' ');
  return `<li class="${cls}" style="--c:${t.color}">
    <span class="nr">Nr. ${b.nr}</span>
    <p class="pill">${t.name}</p>
    <h3>${esc(b.name)}</h3>
    <p>${esc(b.text)}</p>
    <dl class="facts">
      <div><dt>Preis</dt><dd>${b.price === 0 ? 'Gratis' : fmtCoins(b.price)}</dd></div>
      <div><dt>Kapazität</dt><dd>${capText(b)}</dd></div>
    </dl>
  </li>`;
}

function render() {
  const tiers = filter === 'alle' ? BAG_TIERS : BAG_TIERS.filter((t) => t.id === filter);
  $('sections').innerHTML = tiers
    .map((t) => {
      const list = ofTier(t.id);
      const first = list[0], last = list.at(-1);
      const meta = `${list.length} Taschen · ${first.price === 0 ? 'Gratis' : fmtCoins(first.price)} bis ${fmtCoins(last.price)} Münzen`;
      return `<section class="section" id="${t.id}" aria-labelledby="h-${t.id}" style="--c:${t.color}">
        <div class="section-head">
          <h2 id="h-${t.id}">${esc(t.name)}</h2>
          <p class="section-meta">${meta}</p>
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
