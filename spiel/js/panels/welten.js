// Welten-Fenster (Teleport-Menü): je Planet ein Reiter mit seinen Welten, dazu Portal und
// Wiedergeburt. Kaufen, Teleportieren und Portale öffnen laufen über den Spielstand.

import { PLANETS, planetById, worldById, worldsOf, playable, fmtLuck, fmtValue, REBIRTH } from '../../../welten/js/worlds.js';
import { worldThumb } from '../../../welten/js/thumbs.js';
import { fmtNumber, currentWorld, ownsWorld, portalOpen, canBuyWorld, portalChecks, canOpenPortal, rebirthCost, canRebirth, rebirth, rebirthMultiplier } from '../state.js';
import { icon } from '../icons.js';

function worldCard(ctx, w, i) {
  const s = ctx.state, short = ctx.settings.shortNumbers;
  if (w.soon) {
    return `<li class="world-card is-soon">
      <span class="world-img"><span class="world-q">?</span></span>
      <p class="world-num">···</p><h3>Coming soon</h3>
      <p class="muted">Kommt mit einem späteren Update.</p>
      <button class="btn" type="button" disabled>${icon('lock', 16)} Bald</button>
    </li>`;
  }
  const here = s.world === w.id, owned = ownsWorld(s, w.id), why = canBuyWorld(s, w.id);
  let action;
  if (here) action = `<button class="btn" type="button" disabled>${icon('check', 16)} Hier bist du</button>`;
  else if (owned) action = `<button class="btn btn-primary" type="button" data-tp="${w.id}">${icon('portal', 16)} Teleportieren</button>`;
  else if (!why || why === 'Zu wenig Taler')
    action = `<button class="btn btn-primary" type="button" data-buy="${w.id}" ${why ? 'aria-disabled="true"' : ''}>Kaufen · ${fmtNumber(w.price, short)} Taler</button>`;
  else action = `<button class="btn" type="button" disabled>${icon('lock', 16)} ${why}</button>`;
  return `<li class="world-card${here ? ' is-here' : ''}${owned ? ' is-owned' : ''}" style="--c:${w.accent}">
    <span class="world-img"><img alt="" data-thumb="${w.id}">${here ? '<span class="world-here">Du bist hier</span>' : ''}</span>
    <p class="world-num">Welt ${i + 1}</p>
    <h3>${w.name}</h3>
    <p class="world-stats"><span title="Chance auf seltene Münzen">${icon('clover', 14)} ${fmtLuck(w)}</span><span title="Münzwert">${icon('gem', 14)} ${fmtValue(w)}</span></p>
    ${action}
  </li>`;
}

function portalBanner(ctx, p) {
  const s = ctx.state;
  if (!p.portal || portalOpen(s, p.id)) return '';
  if (p.soon)
    return `<div class="portal-banner" style="--c:${p.color}"><span class="portal-ico">${icon('lock', 28)}</span>
      <div><h3>${p.name} · Coming soon</h3><p class="muted">${p.text} Kommt mit einem späteren Update.</p></div></div>`;
  const why = canOpenPortal(s, p.id);
  const checks = portalChecks(s, p.id)
    .map(([t, ok]) => `<li class="${ok ? 'is-ok' : ''}">${icon(ok ? 'check' : 'lock', 14)} ${t}</li>`)
    .join('');
  return `<div class="portal-banner" style="--c:${p.color}">
    <span class="portal-ico">${icon(p.id === 'p2' ? 'rocket' : 'portal', 30)}</span>
    <div class="portal-text">
      <h3>${p.portal.name} nach ${p.name}</h3>
      <p class="muted">${p.portal.text}</p>
      <ul class="portal-checks">${checks}</ul>
    </div>
    <button class="btn btn-primary" type="button" data-portal="${p.id}" ${why ? 'disabled' : ''}>${why ? 'Noch verschlossen' : `${p.portal.name} starten`}</button>
  </div>`;
}

function renderRebirth(body, ctx) {
  const s = ctx.state, short = ctx.settings.shortNumbers;
  const cost = rebirthCost(s), why = canRebirth(s);
  const pct = Math.min(100, (s.taler / cost) * 100);
  const next = PLANETS.find((p) => p.portal && !p.soon && p.portal.rebirths > s.rebirths);
  body.innerHTML = `
    <div class="rebirth">
      <div class="rebirth-hero">
        <span class="rebirth-ico">${icon('rebirth', 40)}</span>
        <p class="rebirth-count">${s.rebirths}</p>
        <p class="muted">Wiedergeburt${s.rebirths === 1 ? '' : 'en'}</p>
      </div>
      <div class="rebirth-main">
        <dl class="rebirth-facts">
          <div><dt>Münzwert jetzt</dt><dd>×${rebirthMultiplier(s.rebirths).toLocaleString('de-DE')}</dd></div>
          <div><dt>Nach der Wiedergeburt</dt><dd class="up">×${rebirthMultiplier(s.rebirths + 1).toLocaleString('de-DE')}</dd></div>
          <div><dt>Kosten</dt><dd>${fmtNumber(cost, short)} Taler</dd></div>
          ${next ? `<div><dt>${next.portal.name}</dt><dd>ab ${next.portal.rebirths} Wiedergeburt${next.portal.rebirths > 1 ? 'en' : ''}</dd></div>` : ''}
        </dl>
        <div class="rebirth-bar" role="progressbar" aria-label="Taler für die nächste Wiedergeburt" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.floor(pct)}"><span style="width:${pct}%"></span></div>
        <p class="muted">${fmtNumber(Math.floor(s.taler), short)} von ${fmtNumber(cost, short)} Taler</p>
        <ul class="rebirth-rules">
          <li class="is-lost">${icon('close', 14)} Deine Taler sind danach weg</li>
          <li>${icon('check', 14)} Welten, Portale, Münzen, Eier, Level und Skills bleiben</li>
          <li>${icon('check', 14)} Jede Münze ist für immer ${Math.round(REBIRTH.bonus * 100)} % mehr wert</li>
        </ul>
        <button id="rebirth-btn" class="btn btn-primary rebirth-btn" type="button" ${why ? 'disabled' : ''}>${why ? `Noch ${fmtNumber(Math.ceil(cost - s.taler), short)} Taler` : 'Wiedergeboren werden'}</button>
      </div>
    </div>`;
  const btn = body.querySelector('#rebirth-btn');
  btn.addEventListener('click', () => {
    if (canRebirth(s)) return;
    if (!btn.dataset.armed) {
      btn.dataset.armed = '1';
      btn.textContent = 'Sicher? Nochmal klicken';
      setTimeout(() => {
        if (!btn.isConnected) return;
        delete btn.dataset.armed;
        btn.textContent = 'Wiedergeboren werden';
      }, 3000);
      return;
    }
    rebirth(s);
    ctx.save();
    ctx.sound(1.5);
    ctx.flash?.('#ffd76a');
    ctx.toast(`Wiedergeburt ${s.rebirths}! Münzwert jetzt ×${rebirthMultiplier(s.rebirths).toLocaleString('de-DE')}`, '#ffd76a');
    ctx.rerender();
  });
}

export const weltenPanel = {
  id: 'welten',
  title: 'Welten',
  icon: 'globe',
  tabs: [...PLANETS.map((p) => ({ id: p.id, label: p.name })), { id: 'wiedergeburt', label: 'Wiedergeburt' }],
  defaultTab: (ctx) => currentWorld(ctx.state).planet,
  sub: (ctx) => {
    const w = currentWorld(ctx.state);
    return `${planetById[w.planet].name} · ${w.name} · ${fmtNumber(ctx.state.taler, ctx.settings.shortNumbers)} Taler`;
  },
  tools: (ctx) => {
    // nur für die Vorschau: Taler verzehnfachen, um spätere Welten auszuprobieren
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn tool-btn';
    b.textContent = '+ Test-Taler';
    b.title = 'Nur in der Vorschau: Taler ×10 (mindestens 1 Mio.)';
    b.addEventListener('click', () => {
      ctx.state.taler = Math.max(1e6, Math.round(ctx.state.taler * 10));
      ctx.save();
      ctx.toast(`Test: ${fmtNumber(ctx.state.taler, true)} Taler`, '#9fd0ff');
      ctx.rerender();
    });
    return [b];
  },
  render(body, ctx, tab) {
    if (tab === 'wiedergeburt') return renderRebirth(body, ctx);
    const s = ctx.state, p = planetById[tab] || PLANETS[0];
    const open = portalOpen(s, p.id);
    body.innerHTML = `
      <div class="planet-head" style="--c:${p.color}">
        <p class="planet-eyebrow">${p.name}</p>
        <h3>${p.title}</h3>
        <p class="muted">${p.text}</p>
      </div>
      ${portalBanner(ctx, p)}
      <ul class="world-grid${open ? '' : ' is-locked'}">${worldsOf(p.id).map((w) => worldCard(ctx, w, playable(p.id).indexOf(w))).join('')}</ul>`;

    body.querySelectorAll('img[data-thumb]').forEach(async (img) => {
      const url = await worldThumb(worldById[img.dataset.thumb], 320, 200);
      if (url) img.src = url;
    });
    body.querySelectorAll('[data-tp]').forEach((b) => b.addEventListener('click', () => ctx.teleport(b.dataset.tp)));
    body.querySelectorAll('[data-buy]').forEach((b) =>
      b.addEventListener('click', () => {
        const w = worldById[b.dataset.buy], why = canBuyWorld(s, w.id);
        if (why) {
          ctx.toast(why === 'Zu wenig Taler' ? `Dafür fehlen noch ${fmtNumber(Math.ceil(w.price - s.taler), ctx.settings.shortNumbers)} Taler` : why, '#ff8a96');
          return;
        }
        s.taler -= w.price;
        s.worlds.push(w.id);
        ctx.save();
        ctx.toast(`${w.name} freigeschaltet!`, w.accent);
        ctx.teleport(w.id);
      }),
    );
    body.querySelectorAll('[data-portal]').forEach((b) =>
      b.addEventListener('click', () => {
        if (canOpenPortal(s, p.id)) return;
        s.portals.push(p.id);
        ctx.save();
        ctx.sound(1.6);
        ctx.flash?.(p.color);
        ctx.toast(`${p.portal.name} bereit: ${p.name} ist offen!`, p.color);
        ctx.rerender();
      }),
    );
  },
};
