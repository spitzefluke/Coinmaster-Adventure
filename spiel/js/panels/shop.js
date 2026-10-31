// Shop-Fenster: Eier und Boosts für Taler, Robux-Angebote (in der Vorschau nur angedeutet).

import { EGGS } from '../../../eier/js/eggs.js';
import { BOOSTS, boostActive, eggPrice, fmtNumber, effect } from '../state.js';
import { icon } from '../icons.js';

const ROBUX = [
  { id: 'taler-s', name: 'Beutel Taler', text: '5.000 Taler', robux: 49 },
  { id: 'taler-m', name: 'Truhe Taler', text: '30.000 Taler', robux: 249, badge: 'Beliebt' },
  { id: 'release', name: 'Release Egg', text: 'Nur zum Release des Spiels', robux: 199, badge: 'Limitiert' },
  { id: 'vip', name: 'VIP-Pass', text: 'Doppelte Taler aus Verkäufen, für immer', robux: 499 },
];

function buy(ctx, price, apply, label) {
  if (ctx.state.taler < price) {
    ctx.toast(`Dafür fehlen noch ${fmtNumber(Math.ceil(price - ctx.state.taler), ctx.settings.shortNumbers)} Taler`, '#ff8a96');
    return;
  }
  ctx.state.taler = Math.round((ctx.state.taler - price) * 100) / 100;
  apply();
  ctx.save();
  ctx.sound(1.1);
  ctx.toast(label, '#d9b26a');
  ctx.rerender();
}

export const shopPanel = {
  id: 'shop',
  title: 'Shop',
  icon: 'shop',
  tabs: [
    { id: 'eier', label: 'Eier' },
    { id: 'boosts', label: 'Boosts' },
    { id: 'robux', label: 'Robux' },
  ],
  sub: (ctx) => `${fmtNumber(ctx.state.taler, ctx.settings.shortNumbers)} Taler verfügbar`,
  render(body, ctx, tab) {
    const short = ctx.settings.shortNumbers;
    if (tab === 'boosts') {
      body.innerHTML = `<ul class="shop-grid">${BOOSTS.map((b) => {
        const active = boostActive(ctx.state, b.id);
        const left = active ? Math.ceil((ctx.state.boosts[b.id] - Date.now()) / 60000) : 0;
        return `<li class="shop-card">
          <span class="shop-ico">${icon(b.icon, 28)}</span>
          <h3>${b.name}</h3>
          <p class="muted">${b.text}</p>
          <p class="shop-meta">${b.minutes} Minuten${active ? ` · aktiv, noch ${left} Min.` : ''}</p>
          <button class="btn btn-primary" type="button" data-boost="${b.id}" ${ctx.state.taler < b.price ? 'aria-disabled="true"' : ''}>${active ? 'Verlängern' : 'Kaufen'} · ${fmtNumber(b.price, short)} Taler</button>
        </li>`;
      }).join('')}</ul>`;
      body.querySelectorAll('[data-boost]').forEach((btn) =>
        btn.addEventListener('click', () => {
          const b = BOOSTS.find((x) => x.id === btn.dataset.boost);
          buy(ctx, b.price, () => {
            const from = Math.max(Date.now(), ctx.state.boosts[b.id] || 0);
            ctx.state.boosts[b.id] = from + b.minutes * 60000;
          }, `${b.name} aktiv`);
        }),
      );
      return;
    }
    if (tab === 'robux') {
      body.innerHTML = `
        <p class="notice">${icon('robux', 18)} In der Vorschau lassen sich keine Robux ausgeben. Im Spiel laufen diese Käufe über Roblox.</p>
        <ul class="shop-grid">${ROBUX.map((r) => `<li class="shop-card">
          ${r.badge ? `<span class="shop-badge">${r.badge}</span>` : ''}
          <span class="shop-ico">${icon(r.id === 'release' ? 'egg' : r.id === 'vip' ? 'star' : 'coins', 28)}</span>
          <h3>${r.name}</h3>
          <p class="muted">${r.text}</p>
          <button class="btn robux-btn" type="button" data-robux="${r.id}">${icon('robux', 16)} R$ ${r.robux}</button>
        </li>`).join('')}</ul>`;
      body.querySelectorAll('[data-robux]').forEach((btn) =>
        btn.addEventListener('click', () => ctx.toast('Robux-Käufe gibt es erst im Spiel', '#9fd0ff')),
      );
      return;
    }
    // Eier
    const discount = effect(ctx.state, 'feilscher');
    body.innerHTML = `
      ${discount ? `<p class="notice">${icon('tag', 18)} Feilscher: alle Eier ${discount} % günstiger.</p>` : ''}
      <ul class="shop-grid">${EGGS.map((e) => {
        const price = e.price && e.price.currency === 'muenzen' ? eggPrice(ctx.state, e.price.amount) : null;
        const owned = ctx.state.eggs[e.id] || 0;
        const action = price != null
          ? `<button class="btn btn-primary" type="button" data-egg="${e.id}" ${ctx.state.taler < price ? 'aria-disabled="true"' : ''}>Kaufen · ${fmtNumber(price, short)} Taler</button>`
          : e.price?.currency === 'robux'
            ? `<button class="btn robux-btn" type="button" data-egg-robux>${icon('robux', 16)} R$ ${e.price.amount}</button>`
            : `<button class="btn" type="button" disabled>${icon('lock', 16)} ${e.availability}</button>`;
        return `<li class="shop-card egg-card" style="--egg:${e.glow}">
          <span class="egg-shape" aria-hidden="true"></span>
          <h3>${e.name}</h3>
          <p class="shop-meta">${e.rankName}${owned ? ` · im Inventar: ${owned}` : ''}</p>
          ${price != null && discount ? `<p class="old-price">statt ${fmtNumber(e.price.amount, short)} Taler</p>` : ''}
          ${action}
        </li>`;
      }).join('')}</ul>`;
    body.querySelectorAll('[data-egg]').forEach((btn) =>
      btn.addEventListener('click', () => {
        const e = EGGS.find((x) => x.id === btn.dataset.egg);
        buy(ctx, eggPrice(ctx.state, e.price.amount), () => (ctx.state.eggs[e.id] = (ctx.state.eggs[e.id] || 0) + 1), `${e.name} gekauft`);
      }),
    );
    body.querySelectorAll('[data-egg-robux]').forEach((btn) => btn.addEventListener('click', () => ctx.toast('Robux-Käufe gibt es erst im Spiel', '#9fd0ff')));
  },
};
