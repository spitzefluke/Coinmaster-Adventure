// Gemeinsame Navigation für alle Seiten: Leiste oben mit allen Bereichen und ein
// „Nach oben“-Knopf. Jede Seite bindet nur dieses Skript ein; die Links werden relativ
// zum Speicherort dieser Datei gebaut und funktionieren dadurch aus jedem Unterordner.

const root = new URL('..', import.meta.url);
const here = location.pathname.replace(/index\.html$/, '');

const LINKS = [
  { href: '', label: 'Start' },
  { href: 'muenzen/', label: 'Münzkabinett' },
  { href: 'muenzindex/', label: 'Münzindex' },
  { href: 'eier/', label: 'Eierhalle' },
  { href: 'roblox/', label: 'Roblox Studio', locked: true },
];

const LOCK_ICON =
  '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path fill="currentColor" d="M4 7V5a4 4 0 1 1 8 0v2h.5A1.5 1.5 0 0 1 14 8.5v5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 13.5v-5A1.5 1.5 0 0 1 3.5 7H4Zm2 0h4V5a2 2 0 1 0-4 0v2Z"/></svg>';

const nav = document.createElement('nav');
nav.className = 'site-nav';
nav.setAttribute('aria-label', 'Bereiche');
const inner = document.createElement('div');
inner.className = 'site-nav-inner';
const brand = document.createElement('a');
brand.className = 'site-brand';
brand.href = root.href;
brand.innerHTML = '<span class="site-brand-coin" aria-hidden="true"></span>Coinmaster Adventure';
const list = document.createElement('ul');
for (const l of LINKS) {
  const url = new URL(l.href, root);
  const li = document.createElement('li');
  const a = document.createElement('a');
  a.href = url.href;
  a.innerHTML = (l.locked ? LOCK_ICON : '') + l.label;
  if (url.pathname === here) a.setAttribute('aria-current', 'page');
  li.append(a);
  list.append(li);
}
inner.append(brand, list);
nav.append(inner);
document.body.prepend(nav);

// „Nach oben“ erscheint, sobald man ein Stück gescrollt hat
const up = document.createElement('button');
up.type = 'button';
up.className = 'to-top';
up.setAttribute('aria-label', 'Nach oben');
up.innerHTML = '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M3 10l5-5 5 5"/></svg>';
up.hidden = true;
up.addEventListener('click', () => scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }));
document.body.append(up);
addEventListener('scroll', () => (up.hidden = scrollY < 600), { passive: true });
