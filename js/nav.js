// Gemeinsame Navigation für alle Seiten (Design aus Claude Design: „Navigation“).
//
// Breit: Leiste mit gleitender Messing-Markierung für die aktuelle Seite und einer weichen
// Markierung unter der Maus. Schmal (unter 1100 px, weil die Leiste 8 Einträge hat): Knopf „Menü“, der eine Liste mit großen,
// nummerierten Einträgen ausklappt. Das Münz-Logo dreht sich beim Darüberfahren und Klicken,
// ein Klick klingt wie eine Münze. Dazu ein „Nach oben“-Knopf.
//
// Jede Seite bindet nur dieses Skript ein; Links werden relativ zu seinem Speicherort gebaut.

const root = new URL('..', import.meta.url);
const here = location.pathname.replace(/index\.html$/, '');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const COMPACT = matchMedia('(max-width: 1099px)');

const LINKS = [
  { href: '', label: 'Start' },
  { href: 'muenzen/', label: 'Münzkabinett' },
  { href: 'muenzindex/', label: 'Münzindex' },
  { href: 'eier/', label: 'Eierhalle' },
  { href: 'haustiere/', label: 'Haustiere' },
  { href: 'welten/', label: 'Welten' },
  { href: 'spiel/', label: 'Spiel' },
  { href: 'roblox/', label: 'Roblox Studio', locked: true },
].map((l) => ({ ...l, url: new URL(l.href, root) }));

// Exakter Treffer, sonst der Bereich, in dessen Ordner die Seite liegt (z. B. haustiere/roblox-modelle.html)
const exact = LINKS.findIndex((l) => l.url.pathname === here);
const active = exact >= 0 ? exact : Math.max(0, LINKS.findIndex((l, i) => i > 0 && here.startsWith(l.url.pathname)));

const LOCK =
  '<svg class="nav-lock" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path fill="currentColor" d="M4 7V5a4 4 0 1 1 8 0v2h.5A1.5 1.5 0 0 1 14 8.5v5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 13.5v-5A1.5 1.5 0 0 1 3.5 7H4Zm2 0h4V5a2 2 0 1 0-4 0v2Z"/></svg>';

// ── Klang ────────────────────────────────────────────────────────────────────
// Kurzer Münz-Klang aus drei Obertönen, nur nach einem Klick (Browser erlauben Ton erst dann).

let audio;
function clink(pitch = 1) {
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    const t = audio.currentTime;
    for (const [f, g, d] of [[2637, 0.16, 0.38], [3951, 0.08, 0.26], [5274, 0.04, 0.16]]) {
      const o = audio.createOscillator(), gain = audio.createGain();
      o.type = 'sine';
      o.frequency.value = f * pitch;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(g, t + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(gain).connect(audio.destination);
      o.start(t);
      o.stop(t + d + 0.02);
    }
  } catch {}
}

// ── Aufbau ───────────────────────────────────────────────────────────────────

const nav = document.createElement('nav');
nav.className = 'site-nav';
nav.setAttribute('aria-label', 'Bereiche');
nav.innerHTML = `
  <div class="site-nav-inner">
    <a class="site-brand" href="${LINKS[0].url.href}">
      <span class="site-brand-coin" aria-hidden="true"></span>Coinmaster Adventure
    </a>
    <ul class="nav-tray">
      <li class="nav-hover" aria-hidden="true"></li>
      <li class="nav-active" aria-hidden="true"></li>
      ${LINKS.map((l, i) => `<li class="nav-item"><a href="${l.url.href}" data-i="${i}"${i === active ? ' aria-current="page"' : ''}>${l.locked ? LOCK : ''}${l.label}</a></li>`).join('')}
    </ul>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="nav-panel">
      <span class="nav-toggle-label">Menü</span>
      <span class="nav-burger" aria-hidden="true"><span></span><span></span></span>
    </button>
  </div>
  <div class="nav-line" aria-hidden="true"></div>
  <div class="nav-panel" id="nav-panel">
    <div class="nav-panel-inner">
      <ul>
        ${LINKS.map(
          (l, i) => `<li style="--d:${0.05 + i * 0.05}s"><a href="${l.url.href}" data-i="${i}"${i === active ? ' aria-current="page"' : ''}>
            <span class="nav-num">${String(i + 1).padStart(2, '0')}</span>
            <span class="nav-label">${l.label}</span>
            ${l.locked ? LOCK : ''}
            <span class="nav-dot" aria-hidden="true"></span>
          </a></li>`,
        ).join('')}
      </ul>
    </div>
  </div>`;
document.body.prepend(nav);

const coin = nav.querySelector('.site-brand-coin');
const tray = nav.querySelector('.nav-tray');
const pillActive = nav.querySelector('.nav-active');
const pillHover = nav.querySelector('.nav-hover');
const trayLinks = [...tray.querySelectorAll('a')];
const toggle = nav.querySelector('.nav-toggle');
const panel = nav.querySelector('.nav-panel');
const panelLinks = [...panel.querySelectorAll('a')];
// zugeklappt: Einträge nicht per Tab erreichbar
panel.inert = true;

// Münz-Logo dreht sich: halbe Drehung beim Darüberfahren, ganze beim Klicken
let flips = 0;
const flip = (amount) => {
  flips += amount;
  coin.style.transform = `rotateY(${flips * 360}deg)`;
};
nav.querySelector('.site-brand').addEventListener('mouseenter', () => flip(0.5));

// ── Gleitende Markierungen ──
function place(pill, i) {
  const a = trayLinks[i];
  if (!a) return;
  pill.style.left = a.parentElement.offsetLeft + 'px';
  pill.style.width = a.offsetWidth + 'px';
}
function placeActive(i) {
  place(pillActive, i);
  trayLinks.forEach((a, k) => a.classList.toggle('is-on', k === i));
}
let current = active;
const measure = () => {
  if (COMPACT.matches) return;
  // beim ersten Platzieren ohne Animation
  pillActive.classList.add('no-anim');
  placeActive(current);
  void pillActive.offsetWidth;
  pillActive.classList.remove('no-anim');
};
measure();
document.fonts?.ready.then(measure);
addEventListener('resize', measure);
COMPACT.addEventListener?.('change', measure);

trayLinks.forEach((a, i) => {
  a.addEventListener('mouseenter', () => {
    place(pillHover, i);
    pillHover.style.opacity = i === current ? 0 : 1;
  });
});
tray.addEventListener('mouseleave', () => (pillHover.style.opacity = 0));

// Klick: Klang, Markierung gleitet zum Ziel, dann geht es zur Seite.
// Mit Strg/Cmd/Umschalt oder mittlerer Maustaste öffnet der Browser wie gewohnt.
function go(e, i) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const href = e.currentTarget.href;
  clink(1 + i * 0.06);
  flip(1);
  if (i === current) {
    e.preventDefault();
    closePanel();
    return;
  }
  if (reducedMotion) return;
  e.preventDefault();
  current = i;
  placeActive(i);
  pillHover.style.opacity = 0;
  pillActive.classList.add('is-pressed');
  setTimeout(() => pillActive.classList.remove('is-pressed'), 160);
  setTimeout(() => (location.href = href), 320);
}
[...trayLinks, ...panelLinks].forEach((a) => a.addEventListener('click', (e) => go(e, +a.dataset.i)));
nav.querySelector('.site-brand').addEventListener('click', (e) => go(e, 0));

// ── Mobil-Menü ──
function setOpen(open) {
  nav.classList.toggle('is-open', open);
  panel.inert = !open;
  toggle.setAttribute('aria-expanded', String(open));
  toggle.querySelector('.nav-toggle-label').textContent = open ? 'Schließen' : 'Menü';
}
function closePanel() {
  setOpen(false);
}
toggle.addEventListener('click', () => {
  const open = !nav.classList.contains('is-open');
  clink(open ? 1.1 : 0.85);
  flip(1);
  setOpen(open);
});
addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && nav.classList.contains('is-open')) {
    setOpen(false);
    toggle.focus();
  }
});

// ── „Nach oben“ ──
const up = document.createElement('button');
up.type = 'button';
up.className = 'to-top';
up.setAttribute('aria-label', 'Nach oben');
up.innerHTML = '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M3 10l5-5 5 5"/></svg>';
up.hidden = true;
up.addEventListener('click', () => scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' }));
document.body.append(up);
addEventListener('scroll', () => (up.hidden = scrollY < 600), { passive: true });
