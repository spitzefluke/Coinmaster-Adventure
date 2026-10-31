// Inventar-Fenster: Münzen (sortieren, filtern, verkaufen) und Eier.

import { COINS, TIERS, tierById } from '../../../muenzen/js/coins.js';
import { mutationById, fmtMultiplier } from '../../../muenzen/js/mutations.js';
import { EGGS } from '../../../eier/js/eggs.js';
import { coinValue, slots, fmtNumber } from '../state.js';
import { coinThumb } from '../thumbs.js';
import { icon } from '../icons.js';

const view = { sort: 'neu', tier: 'alle', onlyMutated: false, selected: null };

const tierIndex = (entry) => tierById[COINS[entry.id].tier].index;

function sorted(state) {
  let list = state.inventory.map((e, i) => ({ ...e, i }));
  if (view.tier !== 'alle') list = list.filter((e) => COINS[e.id].tier === view.tier);
  if (view.onlyMutated) list = list.filter((e) => e.mutation);
  const by = {
    neu: (a, b) => b.at - a.at,
    wert: (a, b) => coinValue(b) - coinValue(a),
    selten: (a, b) => tierIndex(b) - tierIndex(a) || coinValue(b) - coinValue(a),
    name: (a, b) => COINS[a.id].name.localeCompare(COINS[b.id].name, 'de'),
  }[view.sort];
  return list.sort(by);
}

function sell(ctx, indices) {
  const set = new Set(indices);
  let total = 0;
  ctx.state.inventory = ctx.state.inventory.filter((e, i) => {
    if (!set.has(i)) return true;
    total += coinValue(e);
    return false;
  });
  total = Math.round(total * 100) / 100;
  ctx.state.taler = Math.round((ctx.state.taler + total) * 100) / 100;
  view.selected = null;
  ctx.save();
  ctx.sound(0.9);
  ctx.toast(`${indices.length} Münze${indices.length > 1 ? 'n' : ''} für ${fmtNumber(total, ctx.settings.shortNumbers)} Taler verkauft`, '#d9b26a');
  ctx.rerender();
}

function coinsTab(body, ctx) {
  const st = ctx.state, short = ctx.settings.shortNumbers;
  const list = sorted(st);
  const cap = slots(st);
  const full = st.inventory.length >= cap;
  const normalIdx = st.inventory.map((e, i) => [e, i]).filter(([e]) => tierIndex(e) === 0 && !e.mutation).map(([, i]) => i);
  const sel = view.selected != null ? st.inventory[view.selected] : null;

  body.innerHTML = `
    <div class="inv">
      <div class="inv-main">
        <div class="inv-toolbar">
          <p class="inv-cap ${full ? 'is-full' : ''}"><strong>${st.inventory.length}</strong> / ${cap} Plätze${full ? ' · voll' : ''}</p>
          <label class="inv-field">Sortieren
            <select id="inv-sort">
              <option value="neu">Neueste zuerst</option>
              <option value="wert">Höchster Wert</option>
              <option value="selten">Seltenste</option>
              <option value="name">Name</option>
            </select>
          </label>
          <label class="inv-field">Stufe
            <select id="inv-tier"><option value="alle">Alle</option>${TIERS.map((t) => `<option value="${t.id}">${t.name}</option>`).join('')}</select>
          </label>
          <label class="inv-check"><input id="inv-mut" type="checkbox"> Nur Mutationen</label>
        </div>
        ${list.length
          ? `<ul class="inv-grid">${list
              .map((e) => {
                const c = COINS[e.id], t = tierById[c.tier], m = e.mutation && mutationById[e.mutation];
                return `<li><button type="button" class="inv-item${view.selected === e.i ? ' is-selected' : ''}" data-i="${e.i}" style="--tier:${t.color}${m ? `;--mut:${m.color}` : ''}" aria-label="${c.name}, ${t.name}${m ? `, ${m.name}` : ''}, ${fmtNumber(coinValue(e), short)} Taler">
                  <img src="${coinThumb(e.id)}" alt="" width="64" height="64">
                  ${m ? `<span class="inv-mut" title="${m.name}"></span>` : ''}
                  <span class="inv-name">${c.name}</span>
                  <span class="inv-value">${fmtNumber(coinValue(e), short)}</span>
                </button></li>`;
              })
              .join('')}</ul>`
          : `<p class="empty">${st.inventory.length ? 'Keine Münze passt zum Filter.' : 'Noch keine Münzen. Mit „Münze suchen“ findest du welche.'}</p>`}
      </div>
      <aside class="inv-side">
        ${sel
          ? (() => {
              const c = COINS[sel.id], t = tierById[c.tier], m = sel.mutation && mutationById[sel.mutation];
              return `
                <img class="inv-big" src="${coinThumb(sel.id, 160)}" alt="" width="140" height="140">
                <p class="tier-pill" style="--tier:${t.color}">${t.name}</p>
                <h3>${c.name}</h3>
                ${m ? `<p class="mut-pill" style="--mut:${m.color}">${m.name} ${fmtMultiplier(m)}</p>` : ''}
                <p class="muted">${c.text}</p>
                <dl class="side-facts"><div><dt>Wert</dt><dd>${fmtNumber(coinValue(sel), short)} Taler</dd></div>
                <div><dt>Gefunden</dt><dd>${new Date(sel.at).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}</dd></div></dl>
                <button class="btn btn-primary" type="button" id="sell-one">Verkaufen für ${fmtNumber(coinValue(sel), short)} Taler</button>`;
            })()
          : `<div class="side-empty">${icon('coin', 32)}<p>Wähle eine Münze, um sie dir anzusehen oder zu verkaufen.</p></div>`}
        <hr>
        <button class="btn" type="button" id="sell-normal" ${normalIdx.length ? '' : 'disabled'}>Alle normalen Münzen verkaufen (${normalIdx.length})</button>
        <p class="muted small">Münzen mit Mutation bleiben dabei im Inventar.</p>
      </aside>
    </div>`;

  body.querySelector('#inv-sort').value = view.sort;
  body.querySelector('#inv-tier').value = view.tier;
  body.querySelector('#inv-mut').checked = view.onlyMutated;
  body.querySelector('#inv-sort').addEventListener('change', (e) => ((view.sort = e.target.value), ctx.rerender()));
  body.querySelector('#inv-tier').addEventListener('change', (e) => ((view.tier = e.target.value), ctx.rerender()));
  body.querySelector('#inv-mut').addEventListener('change', (e) => ((view.onlyMutated = e.target.checked), ctx.rerender()));
  body.querySelectorAll('.inv-item').forEach((b) =>
    b.addEventListener('click', () => {
      view.selected = +b.dataset.i;
      ctx.rerender();
      body.querySelector(`.inv-item[data-i="${b.dataset.i}"]`)?.focus({ preventScroll: true });
    }),
  );
  body.querySelector('#sell-one')?.addEventListener('click', () => sell(ctx, [view.selected]));
  body.querySelector('#sell-normal').addEventListener('click', () => sell(ctx, normalIdx));
}

function eggsTab(body, ctx) {
  const owned = EGGS.filter((e) => ctx.state.eggs[e.id] > 0);
  body.innerHTML = owned.length
    ? `<ul class="egg-list">${owned
        .map((e) => `<li style="--egg:${e.glow}"><span class="egg-shape" aria-hidden="true"></span><div><strong>${e.name}</strong><span class="muted">${e.rankName}</span></div><span class="egg-count">×${ctx.state.eggs[e.id]}</span></li>`)
        .join('')}</ul>
       <p class="muted">Eier schlüpfen im Spiel nach einer Brutzeit. Die Schlüpf-Animation siehst du schon jetzt in der <a href="../eier/">Eierhalle</a>.</p>`
    : `<p class="empty">Noch keine Eier. Im Shop gibt es welche.</p>`;
}

export const inventarPanel = {
  id: 'inventar',
  title: 'Inventar',
  icon: 'bag',
  tabs: [
    { id: 'muenzen', label: 'Münzen' },
    { id: 'eier', label: 'Eier' },
    { id: 'tiere', label: 'Haustiere' },
  ],
  sub: (ctx) => `${ctx.state.inventory.length} Münzen · ${Object.values(ctx.state.eggs).reduce((a, b) => a + b, 0)} Eier`,
  render(body, ctx, tab) {
    if (tab === 'eier') return eggsTab(body, ctx);
    if (tab === 'tiere') {
      body.innerHTML = `<p class="empty">Hier erscheinen deine geschlüpften Haustiere mit ihrem Bonus, sobald das Schlüpfen im Spiel läuft. Alle 49 kannst du dir schon unter <a href="../haustiere/">Haustiere</a> ansehen.</p>`;
      return;
    }
    coinsTab(body, ctx);
  },
};

