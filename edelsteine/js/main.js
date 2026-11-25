// Edelstein-Taschen: 50 Taschen in fünf Stufen, gekauft mit Diamantstaub. Die Steine selbst zeigt vitrine3d.js in 3D.

import { GEM_BAGS, GEM_BAG_TIERS } from './gems.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const fmt = (n) => n.toLocaleString('de-DE');
const short = (n) => (n >= 1e9 ? `${fmt(n / 1e9)} Mrd.` : n >= 1e6 ? `${fmt(n / 1e6)} Mio.` : fmt(n));

document.getElementById('bags').innerHTML = GEM_BAG_TIERS.map((t) => {
  const list = GEM_BAGS.filter((b) => b.tier === t.id);
  return `<section class="bag-tier" style="--tc:${t.color}" aria-labelledby="bt-${t.id}">
    <div class="bag-tier-head"><h3 id="bt-${t.id}">${esc(t.name)}</h3><small>Nr. ${list[0].nr}–${list.at(-1).nr} · ${fmt(list[0].capacity)} bis ${fmt(list.at(-1).capacity)} Plätze</small></div>
    <ul class="bag-grid">${list
      .map((b) => `<li class="bag-card">
        <span class="nr">Nr. ${b.nr}</span>
        <h4>${esc(b.name)}</h4>
        <p>${esc(b.text)}</p>
        <dl class="facts"><div><dt>Preis</dt><dd>${b.price ? short(b.price) + ' ◆' : 'Gratis'}</dd></div><div><dt>Kapazität</dt><dd>${fmt(b.capacity)}</dd></div></dl>
      </li>`)
      .join('')}</ul>
  </section>`;
}).join('');
