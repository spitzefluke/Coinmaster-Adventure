// Startseite (Claude Design „Startseite v3“): Auftritt des Kopfes, schimmernder Titel, Zahlen zählen hoch,
// schwebende Goldfunken, Suche über alle Bereiche (Taste „/“, Enter öffnet den ersten Treffer, Esc leert)
// und Kacheln mit einem Lichtfleck, der der Maus folgt.
// Alle Bewegungen fallen weg bei „Bewegung reduzieren“ oder der Einstellung „Animationen überspringen“.

import { BEREICHE } from './bereiche.js';
import { skipAnimations } from './settings.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const OUT = 'cubic-bezier(0.2, 0.8, 0.2, 1)';
const motion = !matchMedia('(prefers-reduced-motion: reduce)').matches && !skipAnimations();
const run = (el, kf, opts) => (motion && el ? el.animate(kf, opts) : null);

const LOCK = '<svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true"><path fill="currentColor" d="M4 7V5a4 4 0 1 1 8 0v2h.5A1.5 1.5 0 0 1 14 8.5v5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 13.5v-5A1.5 1.5 0 0 1 3.5 7H4Zm2 0h4V5a2 2 0 1 0-4 0v2Z"/></svg>';

const AREAS = BEREICHE.map((b) => ({
  ...b,
  hay: [b.gruppe, b.titel, b.kurz, b.alias || '', ...b.eckdaten].join(' ').toLowerCase(),
}));

// ── Kacheln ──────────────────────────────────────────────────────────────────

const grid = $('area-grid');
function card(b) {
  const live = b.status !== 'geplant', locked = b.status === 'code' || b.status === 'admin';
  return `<${live ? `a href="${b.href}"` : 'div'} class="area${live ? '' : ' is-planned'}">
    <span class="area-group">${esc(b.gruppe)}</span>
    <div class="area-top"><h3>${esc(b.titel)}</h3>${live && !locked ? '<span class="area-go" aria-hidden="true">→</span>' : ''}</div>
    ${locked ? `<span class="area-lock">${LOCK}${b.status === 'admin' ? 'Für Admins' : 'Nur mit Code'}</span>` : ''}
    <p>${esc(b.kurz)}</p>
    <div class="area-facts">${b.eckdaten.map(esc).join(' · ')}</div>
  </${live ? 'a' : 'div'}>`;
}

let shown = AREAS;
function render(reveal = 0) {
  const q = $('area-search').value.trim().toLowerCase();
  shown = q ? AREAS.filter((a) => q.split(/\s+/).every((t) => a.hay.includes(t))) : AREAS;
  grid.innerHTML = shown.map(card).join('');
  grid.hidden = !shown.length;
  $('area-empty').hidden = shown.length > 0;
  $('area-query').textContent = $('area-search').value.trim();
  $('area-count').textContent = q ? `${shown.length} von ${AREAS.length}` : String(AREAS.length);
  if (reveal !== false) revealCards(reveal, reveal ? 45 : 22);
}
function revealCards(delay, step) {
  [...grid.children].forEach((el, i) =>
    run(el, [{ opacity: 0, transform: 'translateY(16px) scale(0.97)' }, { opacity: 1, transform: 'none' }], { duration: 520, delay: delay + i * step, easing: OUT, fill: 'backwards' }));
}

// Lichtfleck folgt der Maus
grid.addEventListener('pointermove', (e) => {
  const el = e.target.closest('.area');
  if (!el) return;
  const r = el.getBoundingClientRect();
  el.style.setProperty('--mx', `${e.clientX - r.left}px`);
  el.style.setProperty('--my', `${e.clientY - r.top}px`);
});
grid.addEventListener('pointerout', (e) => {
  const el = e.target.closest('.area');
  if (el && !el.contains(e.relatedTarget)) el.style.setProperty('--my', '-300px');
});

// ── Suche ────────────────────────────────────────────────────────────────────

const input = $('area-search');
input.addEventListener('input', () => render(0));
input.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    input.value = '';
    render(0);
    input.blur();
  }
  if (e.key === 'Enter' && shown[0] && shown[0].status !== 'geplant') location.href = shown[0].href;
});
$('area-clear').addEventListener('click', () => {
  input.value = '';
  render(0);
  input.focus();
});
addEventListener('keydown', (e) => {
  if (e.key !== '/' || e.target.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
  e.preventDefault();
  input.focus();
});

// ── Auftritt und Dauerschleifen ──────────────────────────────────────────────

render(420);
const sky = $('sky');
[...$('hero').children].forEach((el, i) =>
  run(el, [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 650, delay: 80 + i * 90, easing: OUT, fill: 'backwards' }));
run(sky, [{ opacity: 0, transform: 'scale(1.08)' }, { opacity: 0.6, transform: 'none' }], { duration: 1800, easing: OUT, fill: 'backwards' });
run(sky, [{ transform: 'translate(0, 0) scale(1)' }, { transform: 'translate(-3%, 10px) scale(1.05)' }], { duration: 28000, delay: 1800, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' });
run($('title'), [{ backgroundPosition: '100% 0' }, { backgroundPosition: '0% 0', offset: 0.35 }, { backgroundPosition: '0% 0' }], { duration: 6500, delay: 900, iterations: Infinity, easing: 'ease-in-out' });
run($('live-dot'), [{ opacity: 1, boxShadow: '0 0 10px #d9b26a' }, { opacity: 0.35, boxShadow: '0 0 2px #d9b26a' }], { duration: 1200, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' });
run($('primary'), [{ boxShadow: '0 8px 24px -10px #d9b26a88' }, { boxShadow: '0 8px 30px -6px #d9b26acc' }], { duration: 1800, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' });

// Goldfunken steigen langsam auf
if (motion) {
  const box = document.createElement('div');
  box.className = 'motes';
  box.setAttribute('aria-hidden', 'true');
  document.body.prepend(box);
  for (let i = 0; i < 26; i++) {
    const m = document.createElement('span'), s = 2 + Math.random() * 3;
    Object.assign(m.style, { left: `${Math.random() * 100}%`, top: `${20 + Math.random() * 85}%`, width: `${s}px`, height: `${s}px`, boxShadow: `0 0 ${s * 3}px #d9b26a` });
    box.append(m);
    const d = 7000 + Math.random() * 9000, dx = (Math.random() - 0.5) * 60;
    m.animate([{ opacity: 0, transform: 'translate(0,0)' }, { opacity: 0.25 + Math.random() * 0.5, offset: 0.3 }, { opacity: 0, transform: `translate(${dx}px,-${140 + Math.random() * 160}px)` }], { duration: d, delay: -Math.random() * d, iterations: Infinity, easing: 'ease-in-out' });
  }
}

// Zahlen zählen hoch
if (motion) {
  const dds = [...$('stats').querySelectorAll('dd')];
  const t0 = performance.now();
  const tick = (now) => {
    const t = Math.max(0, Math.min(1, (now - t0 - 500) / 1200)), e = 1 - Math.pow(1 - t, 3);
    for (const d of dds) d.textContent = Math.round(Number(d.dataset.to) * e);
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
