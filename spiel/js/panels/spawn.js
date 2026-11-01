// Fenster für den Spawn: Ranglisten, Belohnungen (täglich, Glücksrad, Gruppe) und Codes.

import { fmtNumber } from '../state.js';
import { icon } from '../icons.js';
import { BOARDS, board, DAILY, dailyStatus, claimDaily, msToMidnight, prizeText, WHEEL, wheelReady, spinWheel, GROUP_BONUS, joinGroup, redeem, CODES } from '../rewards.js';

const clock = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};
const prizeIcon = (p) => icon(p.taler ? 'coins' : p.boost ? (p.boost === 'xp' ? 'star' : 'clover') : p.egg ? 'egg' : 'sparkle', 22);

// ── Ranglisten ──────────────────────────────────────────────────────────────
export const ranglistenPanel = {
  id: 'ranglisten',
  title: 'Ranglisten',
  icon: 'trophy',
  tabs: BOARDS.map((b) => ({ id: b.id, label: b.label })),
  sub: () => 'Die besten Spieler im Spawn',
  render(body, ctx, tab) {
    const { board: b, top, me, place } = board(ctx.state, tab);
    const short = ctx.settings.shortNumbers;
    const inTop = top.some((r) => r.me);
    body.innerHTML = `
      <div class="rank" style="--c:${b.color}">
        <ol class="rank-list">${top
          .map((r, i) => `<li class="${r.me ? 'is-me' : ''}"><span class="rank-no">${i + 1}</span><span class="rank-name">${r.name}</span><span class="rank-val">${fmtNumber(r.value, short)}</span></li>`)
          .join('')}</ol>
        ${inTop ? '' : `<p class="rank-me"><span class="rank-no">${place.toLocaleString('de-DE')}</span><span class="rank-name">Du</span><span class="rank-val">${fmtNumber(me.value, short)}</span></p>`}
        <p class="muted">${inTop ? `Du bist auf Platz ${place}. Stark!` : `Bis Platz 10 fehlen dir noch ${fmtNumber(Math.max(0, top[9].value - me.value + 1), short)}.`} Die anderen Namen sind Beispiel-Spieler, im Roblox-Spiel stehen hier echte.</p>
      </div>`;
  },
};

// ── Belohnungen ─────────────────────────────────────────────────────────────
let spinning = false;
export const belohnungPanel = {
  id: 'belohnung',
  title: 'Belohnungen',
  icon: 'gift',
  tabs: [
    { id: 'taeglich', label: 'Täglich' },
    { id: 'rad', label: 'Glücksrad' },
    { id: 'gruppe', label: 'Gruppe' },
  ],
  sub: (ctx) => {
    const d = dailyStatus(ctx.state);
    return d.claimedToday ? `Nächstes Geschenk in ${clock(msToMidnight())}` : 'Heute wartet ein Geschenk';
  },
  tools: (ctx) => {
    // nur Vorschau: einen Tag vorspulen
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn tool-btn';
    b.textContent = 'Test: nächster Tag';
    b.title = 'Nur in der Vorschau: tut so, als wäre schon morgen';
    b.addEventListener('click', () => {
      const s = ctx.state, y = new Date(Date.now() - 86400000);
      const key = `${y.getFullYear()}-${y.getMonth() + 1}-${y.getDate()}`;
      if (s.daily?.lastDay) s.daily.lastDay = key;
      if (s.wheel?.lastDay) s.wheel.lastDay = key;
      ctx.save();
      ctx.toast('Test: ein Tag ist vergangen', '#9fd0ff');
      ctx.rerender();
    });
    return [b];
  },
  render(body, ctx, tab) {
    const s = ctx.state;
    if (tab === 'rad') return renderWheel(body, ctx);
    if (tab === 'gruppe') {
      body.innerHTML = `
        <div class="group-card">
          <span class="group-ico">${icon('star', 34)}</span>
          <h3>Coinmaster-Gruppe</h3>
          <p>Tritt der Gruppe bei und bekomme einmalig <strong>${prizeText(GROUP_BONUS)}</strong>. In Roblox prüft das Spiel, ob du Mitglied bist.</p>
          <button id="join-group" class="btn btn-primary" type="button" ${s.group ? 'disabled' : ''}>${s.group ? `${icon('check', 16)} Schon beigetreten` : 'Gruppe beitreten'}</button>
        </div>`;
      body.querySelector('#join-group').addEventListener('click', () => {
        const p = joinGroup(s);
        if (!p) return;
        ctx.save();
        ctx.sound(1.3);
        ctx.toast(`Willkommen in der Gruppe! +${prizeText(p)}`, '#3a7be0');
        ctx.rerender();
      });
      return;
    }
    const d = dailyStatus(s);
    body.innerHTML = `
      <p class="notice">${icon('gift', 18)} Hol dir jeden Tag ein Geschenk. Wer einen Tag auslässt, fängt wieder bei Tag 1 an.</p>
      <ol class="daily">${DAILY.map((p, i) => {
        const done = i < d.next || (d.claimedToday && d.next === 0 && d.streak > 0); // nach Tag 7 alles erledigt
        const today = i === d.next && !d.claimedToday;
        return `<li class="${done ? 'is-done' : ''}${today ? ' is-today' : ''}"><span class="daily-day">Tag ${i + 1}</span>${prizeIcon(p)}<span class="daily-prize">${prizeText(p)}</span>${done ? `<span class="daily-check">${icon('check', 14)}</span>` : ''}</li>`;
      }).join('')}</ol>
      <div class="daily-foot">
        <p class="muted">Serie: <strong>${d.streak} Tag${d.streak === 1 ? '' : 'e'}</strong>${d.claimedToday ? ` · nächstes Geschenk in <span id="daily-clock">${clock(msToMidnight())}</span>` : ''}</p>
        <button id="claim" class="btn btn-primary" type="button" ${d.claimedToday ? 'disabled' : ''}>${d.claimedToday ? 'Morgen wieder' : `Tag ${d.next + 1} abholen`}</button>
      </div>`;
    body.querySelector('#claim').addEventListener('click', () => {
      const r = claimDaily(s);
      if (!r) return;
      ctx.save();
      ctx.sound(1.4);
      ctx.flash?.('#ffd76a');
      ctx.toast(`Tag ${r.day}: ${prizeText(r.prize)}!`, '#ffd76a');
      ctx.rerender();
    });
  },
};

function renderWheel(body, ctx) {
  const s = ctx.state, n = WHEEL.length, seg = 360 / n;
  const grad = WHEEL.map((p, i) => `${p.color} ${i * seg}deg ${(i + 1) * seg}deg`).join(', ');
  const ready = wheelReady(s);
  body.innerHTML = `
    <div class="wheel-wrap">
      <div class="wheel-box">
        <span class="wheel-pin" aria-hidden="true"></span>
        <div id="wheel" class="wheel" style="background:conic-gradient(${grad})">
          ${WHEEL.map((p, i) => `<span class="wheel-label" style="--a:${i * seg + seg / 2}deg">${prizeText(p).replace(' Taler', '').replace(/ \(.*\)/, '')}</span>`).join('')}
          <span class="wheel-hub"></span>
        </div>
      </div>
      <div class="wheel-side">
        <h3>Glücksrad</h3>
        <p class="muted">Einmal am Tag gratis drehen. Der seltene rote Bereich bringt 25.000 Taler.</p>
        <ul class="wheel-legend">${WHEEL.map((p) => `<li><span style="background:${p.color}"></span>${prizeText(p)}</li>`).join('')}</ul>
        <button id="spin" class="btn btn-primary" type="button" ${ready ? '' : 'disabled'}>${ready ? 'Drehen!' : `Wieder in ${clock(msToMidnight())}`}</button>
      </div>
    </div>`;
  const wheel = body.querySelector('#wheel');
  body.querySelector('#spin').addEventListener('click', (e) => {
    if (spinning || !wheelReady(s)) return;
    const r = spinWheel(s);
    if (!r) return;
    ctx.save();
    spinning = true;
    e.currentTarget.disabled = true;
    // Zeiger oben: Segment i in die Mitte oben drehen, plus ein paar volle Runden
    const target = 360 * 6 - (r.index * seg + seg / 2) + (Math.random() - 0.5) * seg * 0.6;
    wheel.style.transition = ctx.settings.skipAnimations ? 'none' : 'transform 4.2s cubic-bezier(.15,.85,.2,1)';
    wheel.style.transform = `rotate(${target}deg)`;
    const done = () => {
      spinning = false;
      ctx.sound(1.5);
      ctx.toast(`Glücksrad: ${prizeText(r.prize)}!`, r.prize.color);
      ctx.rerender();
    };
    if (ctx.settings.skipAnimations) done();
    else setTimeout(done, 4300);
  });
}

// ── Codes ───────────────────────────────────────────────────────────────────
export const codesPanel = {
  id: 'codes',
  title: 'Codes',
  icon: 'key',
  sub: (ctx) => `${(ctx.state.codes ?? []).length} von ${Object.keys(CODES).length} eingelöst`,
  render(body, ctx) {
    const used = ctx.state.codes ?? [];
    body.innerHTML = `
      <form id="code-form" class="code-form" autocomplete="off">
        <label for="code-input">Code eingeben</label>
        <div class="code-row">
          <input id="code-input" type="text" maxlength="20" placeholder="z. B. COINMASTER" spellcheck="false">
          <button class="btn btn-primary" type="submit">Einlösen</button>
        </div>
        <p id="code-msg" class="code-msg" aria-live="polite"></p>
      </form>
      <p class="muted">Neue Codes gibt es zu Updates und Feiertagen. Für die Vorschau funktionieren: <code>COINMASTER</code>, <code>SPAWN</code>, <code>GLUECK</code>, <code>RELEASE</code>, <code>DANKE</code>.</p>
      ${used.length ? `<ul class="code-used">${used.map((c) => `<li>${icon('check', 14)} <code>${c}</code> · ${prizeText(CODES[c])}</li>`).join('')}</ul>` : ''}`;
    const input = body.querySelector('#code-input'), msg = body.querySelector('#code-msg');
    body.querySelector('#code-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const r = redeem(ctx.state, input.value);
      if (r.error) {
        msg.textContent = r.error;
        msg.className = 'code-msg is-bad';
        return;
      }
      ctx.save();
      ctx.sound(1.4);
      ctx.toast(`Code ${r.code}: ${prizeText(r.prize)}!`, '#38f0ff');
      ctx.rerender();
      body.querySelector('#code-msg').textContent = `Eingelöst: ${prizeText(r.prize)}`;
      body.querySelector('#code-msg').className = 'code-msg is-ok';
    });
    setTimeout(() => input.focus(), 50);
  },
};
