// Export nach Roblox Studio, hinter einem Freischalt-Code.
//
// Der Code steht nicht im Klartext hier, nur sein SHA-256-Hash (mit Präfix). Das hält
// Neugierige ab, ist aber kein echter Schutz: Die Seite läuft komplett im Browser, und
// alles, was sie anzeigt, steckt auch in ihren Dateien. Für echten Schutz bräuchte es einen Server.

import { TIERS, COINS } from '../../muenzen/js/coins.js';
import { MUTATIONS, WEATHER } from '../../muenzen/js/mutations.js';
import { renderEmblem } from '../../muenzen/js/emblems.js';
import { EGGS } from '../../eier/js/eggs.js';
import { PLANETS, WORLDS, REBIRTH } from '../../welten/js/worlds.js';
import { moduleSources, installerSource } from './luau.js';
import { makeZip } from './zip.js';

const CODE_HASH = 'c3b410ec23ada5956961769cb9d1ff25d6b73d2842551e78da41bf602425868b';
const UNLOCK_KEY = 'coinmaster.roblox.unlocked';

const gate = document.getElementById('gate');
const exportEl = document.getElementById('export');
const form = document.getElementById('gate-form');
const input = document.getElementById('code');
const msg = document.getElementById('gate-msg');

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const session = {
  get: () => {
    try {
      return sessionStorage.getItem(UNLOCK_KEY) === '1';
    } catch {
      return false;
    }
  },
  set: (on) => {
    try {
      on ? sessionStorage.setItem(UNLOCK_KEY, '1') : sessionStorage.removeItem(UNLOCK_KEY);
    } catch {}
  },
};

// Nach mehreren Fehlversuchen kurz warten lassen
let fails = 0, blockedUntil = 0;
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (Date.now() < blockedUntil) {
    msg.textContent = `Zu viele Versuche. Bitte ${Math.ceil((blockedUntil - Date.now()) / 1000)} Sekunden warten.`;
    return;
  }
  const code = input.value.trim();
  if ((await sha256('coinmaster:' + code)) === CODE_HASH) {
    fails = 0;
    session.set(true);
    unlock();
    return;
  }
  fails++;
  if (fails >= 5) {
    blockedUntil = Date.now() + 30000;
    fails = 0;
  }
  msg.textContent = 'Der Code stimmt nicht.';
  input.select();
  gate.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'translateX(0)' }], { duration: 260 });
});

document.getElementById('lock-btn').addEventListener('click', () => {
  session.set(false);
  exportEl.hidden = true;
  gate.hidden = false;
  input.value = '';
  msg.textContent = '';
  input.focus();
});

// ── Export ───────────────────────────────────────────────────────────────────

const data = { TIERS, COINS, MUTATIONS, WEATHER, EGGS, PLANETS, WORLDS, REBIRTH };
let built = null;

function unlock() {
  gate.hidden = true;
  exportEl.hidden = false;
  if (!built) build();
}

function build() {
  const modules = moduleSources(data);
  const installer = installerSource(data);
  built = { modules, installer };

  document.getElementById('summary').innerHTML = [
    ['Münzen', COINS.length],
    ['Stufen', TIERS.length],
    ['Mutationen', MUTATIONS.length],
    ['Wetter', WEATHER.length],
    ['Eier', EGGS.length],
    ['Welten', WORLDS.filter((w) => !w.soon).length],
    ['Module', modules.length],
  ]
    .map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`)
    .join('');
  document.getElementById('installer-size').textContent = `${installer.split('\n').length.toLocaleString('de-DE')} Zeilen · ${(new Blob([installer]).size / 1024).toFixed(0)} KB`;

  const tabs = document.getElementById('module-tabs');
  const code = document.getElementById('module-code');
  let current = 0;
  const show = (i) => {
    current = i;
    code.textContent = modules[i].source;
    [...tabs.children].forEach((t, k) => t.setAttribute('aria-selected', String(k === i)));
  };
  modules.forEach((m, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'tab');
    b.textContent = m.name;
    b.addEventListener('click', () => show(i));
    tabs.append(b);
  });
  show(0);
  document.getElementById('copy-module').addEventListener('click', () => copy(modules[current].source, `${modules[current].name} kopiert`));
}

document.getElementById('copy-installer').addEventListener('click', () => copy(built.installer, 'Installer kopiert. Jetzt in die Befehlsleiste von Roblox Studio einfügen.'));
document.getElementById('download-installer').addEventListener('click', () =>
  download(new Blob([built.installer], { type: 'text/plain;charset=utf-8' }), 'CoinmasterAdventure-Installer.lua'),
);

// Motive als PNG-Dateien in einem ZIP
document.getElementById('download-emblems').addEventListener('click', async (e) => {
  const btn = e.currentTarget;
  const status = document.getElementById('emblem-status');
  btn.disabled = true;
  const files = [];
  for (const [i, c] of COINS.entries()) {
    status.textContent = `Male Motiv ${i + 1} von ${COINS.length} …`;
    // kurz Luft lassen, damit die Seite reagiert (setTimeout läuft auch in Hintergrund-Tabs weiter)
    await new Promise((r) => setTimeout(r, 0));
    const { colorCv } = renderEmblem(c.emblem, 512, c.metal);
    const blob = await new Promise((r) => colorCv.toBlob(r, 'image/png'));
    files.push({ name: `motive/${String(i + 1).padStart(2, '0')}-${c.emblem}.png`, data: new Uint8Array(await blob.arrayBuffer()) });
  }
  const readme = `Coinmaster Adventure · Motive für Roblox

1. In Roblox Studio: Ansicht > Asset-Manager > Bilder importieren (oder im Creator Hub als Decal hochladen).
2. Die Asset-ID jedes Bilds kopieren (Rechtsklick > Asset-ID kopieren).
3. In ReplicatedStorage > CoinmasterAdventure > CoinData bei der passenden Münze DecalId = <ID> eintragen.
   Die Nummer vorne im Dateinamen ist die Münz-ID (Id in CoinData).
4. Installer neu ausführen oder CoinBuilder.Build(coin) neu aufrufen.

${COINS.map((c, i) => `${String(i + 1).padStart(2, '0')}  ${c.name}`).join('\n')}
`;
  files.push({ name: 'motive/LIESMICH.txt', data: new TextEncoder().encode(readme) });
  download(makeZip(files), 'CoinmasterAdventure-Motive.zip');
  status.textContent = `${COINS.length} Motive im ZIP`;
  btn.disabled = false;
});

// ── Helfer ───────────────────────────────────────────────────────────────────

function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  toast(`${name} wird heruntergeladen`);
}

async function copy(text, done) {
  try {
    await navigator.clipboard.writeText(text);
    toast(done);
  } catch {
    // Fallback: Text in ein Feld legen und markieren
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;inset:0;opacity:0';
    document.body.append(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    toast(ok ? done : 'Kopieren hat nicht geklappt. Bitte die .lua-Datei herunterladen.');
  }
}

const toastEl = document.getElementById('toast');
let toastTimer;
function toast(text) {
  toastEl.textContent = text;
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toastEl.hidden = true), 3200);
}

if (session.get()) unlock();
else input.focus();
