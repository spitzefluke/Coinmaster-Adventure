// Münzkabinett: alle Münzen nach Seltenheitsstufe, nur mit Namen. Dazu Drop-Tabelle, Filter und Suche.
// Die 3D-Vorschau der Münzen gibt es hier nicht mehr (die Münzen in 3D zeigen Münzindex und Wetter-Seite).

import { TIERS, COINS, tierById } from './coins.js';

const fmtPct = (n) => n.toLocaleString('de-DE', { maximumFractionDigits: n < 0.1 ? 3 : 2 }) + ' %';

const tierCount = Object.fromEntries(TIERS.map((t) => [t.id, COINS.filter((c) => c.tier === t.id).length]));
const coinChance = (coin) => tierById[coin.tier].chance / tierCount[coin.tier];

// ── DOM aufbauen ─────────────────────────────────────────────────────────────

const cabinet = document.getElementById('cabinet');
const dropbar = document.getElementById('dropbar');
const chipsEl = document.getElementById('chips');
const cards = [];
const sections = {};

TIERS.forEach((tier, i) => {
  const sec = document.createElement('section');
  sec.className = 'tier-section';
  sec.style.setProperty('--tier', tier.color);
  sec.style.setProperty('--rank', i);
  sec.innerHTML = `
    <div class="tier-head">
      <h2>${tier.name}</h2>
      <p class="facts">${tierCount[tier.id]} Münzen · ${fmtPct(tier.chance)} Drop-Chance · Nennwert ${tier.value}</p>
    </div>
    <ul class="grid"></ul>`;
  const grid = sec.querySelector('.grid');
  COINS.filter((c) => c.tier === tier.id).forEach((coin) => {
    const card = document.createElement('li');
    card.className = 'card';
    card.style.setProperty('--tier', tier.color);
    card.innerHTML = `<h3 class="card-name">${coin.name}</h3>`;
    grid.append(card);
    cards.push({ coin, card });
  });
  cabinet.append(sec);
  sections[tier.id] = sec;

  const seg = document.createElement('button');
  seg.type = 'button';
  seg.style.setProperty('--tier', tier.color);
  seg.style.setProperty('--share', Math.max(tier.chance, 0.6));
  seg.title = `${tier.name}: ${fmtPct(tier.chance)}`;
  seg.setAttribute('aria-label', `${tier.name} ${fmtPct(tier.chance)}`);
  seg.dataset.tier = tier.id;
  dropbar.append(seg);

  const chip = document.createElement('button');
  chip.type = 'button';
  chip.className = 'chip';
  chip.style.setProperty('--tier', tier.color);
  chip.dataset.tier = tier.id;
  chip.innerHTML = `${tier.name} <span class="num">${fmtPct(tier.chance)}</span>`;
  chipsEl.append(chip);
});

const allChip = document.createElement('button');
allChip.type = 'button';
allChip.className = 'chip';
allChip.dataset.tier = 'all';
allChip.innerHTML = `Alle <span class="num">50</span>`;
chipsEl.prepend(allChip);

let activeTier = 'all';
function setFilter(id) {
  activeTier = activeTier === id ? 'all' : id;
  applySearch();
  for (const el of [...chipsEl.children, ...dropbar.children]) {
    const t = el.dataset.tier;
    el.setAttribute('aria-pressed', String(activeTier === 'all' ? t === 'all' || el.parentElement === dropbar : t === activeTier));
  }
}
// Suche nach Namen, kombiniert mit dem Stufen-Filter
const search = document.getElementById('search');
function applySearch() {
  const q = search.value.trim().toLocaleLowerCase('de-DE');
  for (const e of cards) e.card.hidden = !!q && !e.coin.name.toLocaleLowerCase('de-DE').includes(q);
  let shown = 0;
  for (const [tid, sec] of Object.entries(sections)) {
    const visible = cards.filter((e) => e.coin.tier === tid && !e.card.hidden).length;
    sec.hidden = (activeTier !== 'all' && activeTier !== tid) || visible === 0;
    if (!sec.hidden) shown += visible;
  }
  document.getElementById('no-results').hidden = shown > 0;
  document.getElementById('search-count').textContent = q || activeTier !== 'all' ? `${shown} von ${COINS.length} Münzen` : '';
}
search.addEventListener('input', applySearch);

for (const el of [...chipsEl.children, ...dropbar.children]) el.addEventListener('click', () => setFilter(el.dataset.tier));
setFilter('all');
