// Checkliste: Oberfläche. Daten und Speichern in store.js.

import { Store, STATUS, BEIDE } from './store.js';

const store = new Store();
const $ = (id) => document.getElementById(id);
const COLORS = ['#7ab8ff', '#c89bff', '#7ae0d0', '#ffb07a'];
const filter = { status: 'alle', person: 'alle', text: '' };
const items = new Map(); // id → { el, update }
const groups = new Map(); // id → { el, list, meta, bar, add }

// kleines Hilfsmittel: Element mit Eigenschaften und Kindern (Text immer als Text, nie als HTML)
function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (v === true) el.setAttribute(k, '');
    else if (v !== false && v != null) el.setAttribute(k, v);
  }
  el.append(...kids.filter((x) => x != null));
  return el;
}
// Element an die Stelle i im Elternelement bringen, aber nur verschieben, wenn es nicht schon dort steht.
// Jedes Verschieben lässt den Browser die Scrollposition nachführen; wurden bei jeder Änderung alle Gruppen
// neu angehängt, sprang die Seite beim Klicken weiter unten nach oben.
function place(parent, el, i) {
  const at = parent.children[i];
  if (at !== el) parent.insertBefore(el, at || null);
}
const admins = () => store.data?.admins || [];
const colorOf = (name) => (name === BEIDE ? 'var(--brass)' : COLORS[Math.max(0, admins().indexOf(name)) % COLORS.length]);
const when = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }) + ', ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
};
const responsible = (p, name) => p.wer === name || (p.wer === BEIDE && admins().includes(name));

// ── Fortschritt ──
function counts(list) {
  const c = { offen: 0, arbeit: 0, fertig: 0 };
  for (const p of list) c[p.status in c ? p.status : 'offen']++;
  return c;
}
function bar(c, total) {
  return h('div', { class: 'cl-progress', role: 'img', 'aria-label': `${c.fertig} von ${total} überarbeitet, ${c.arbeit} in Arbeit` },
    ...['fertig', 'arbeit'].map((s) => h('span', { style: `width:${total ? (c[s] / total) * 100 : 0}%; --c: var(--st-${s})` })));
}
function renderSummary() {
  const all = store.data.punkte, c = counts(all);
  const card = (title, color, list, extra) => {
    const k = counts(list);
    return h('article', { class: 'cl-card', style: color ? `--c:${color}` : '' },
      h('h2', { text: title }),
      extra,
      bar(k, list.length),
      h('ul', { class: 'cl-counts' }, ...STATUS.map((s) => h('li', {}, h('i', { style: `--c: var(--st-${s.id})` }), h('b', { text: String(k[s.id]) }), ' ' + s.kurz))));
  };
  const total = card('Gesamt', null, all, h('p', { class: 'cl-big' }, `${c.fertig} `, h('small', { text: `von ${all.length} überarbeitet` })));
  const people = admins().map((a) => {
    const mine = all.filter((p) => responsible(p, a));
    return card(a, colorOf(a), mine, h('p', { class: 'cl-big' }, `${mine.length} `, h('small', { text: mine.length === 1 ? 'Aufgabe' : 'Aufgaben' })));
  });
  const nobody = all.filter((p) => !p.wer && p.status !== 'fertig');
  const free = h('article', { class: 'cl-card' }, h('h2', { text: 'Noch niemand zuständig' }), h('p', { class: 'cl-big' }, `${nobody.length} `, h('small', { text: 'nicht überarbeitet' })));
  $('summary').replaceChildren(total, ...people, free);
}

// ── Filter ──
function renderFilters() {
  const chip = (group, value, label, color) =>
    h('button', {
      class: 'filter', type: 'button', 'aria-pressed': String(filter[group] === value), style: color ? `--c:${color}` : '',
      onclick: () => {
        filter[group] = value;
        renderFilters();
        applyFilter();
      },
    }, color ? h('i') : null, label);
  $('status-filter').replaceChildren(chip('status', 'alle', 'Alle'), ...STATUS.map((s) => chip('status', s.id, s.label, `var(--st-${s.id})`)));
  const me = store.canEdit ? store.login.name : null;
  $('person-filter').replaceChildren(
    chip('person', 'alle', 'Alle'),
    ...(me ? [chip('person', me, 'Meine Aufgaben', colorOf(me))] : []),
    ...admins().filter((a) => a !== me).map((a) => chip('person', a, a, colorOf(a))),
    chip('person', '', 'Niemand zuständig'),
  );
}
function matches(p) {
  if (filter.status !== 'alle' && p.status !== filter.status) return false;
  if (filter.person !== 'alle' && (filter.person === '' ? !!p.wer : !responsible(p, filter.person))) return false;
  if (filter.text && !(p.titel + ' ' + (p.notiz || '')).toLowerCase().includes(filter.text)) return false;
  return true;
}
function applyFilter() {
  for (const p of store.data.punkte) items.get(p.id).el.hidden = !matches(p);
  const active = filter.status !== 'alle' || filter.person !== 'alle' || !!filter.text;
  for (const [gid, g] of groups) {
    const any = store.data.punkte.some((p) => p.gruppe === gid && matches(p));
    // mit Filter: Gruppen ohne Treffer ausblenden; ohne Filter: leere Gruppe zeigen (dort kann man Punkte anlegen)
    g.el.hidden = active && !any;
    g.empty.hidden = any;
    g.empty.textContent = active ? 'Keine Punkte für diesen Filter.' : 'Noch keine Punkte.';
  }
}

// ── Punkt ──
function makeItem(p) {
  const edit = () => store.canEdit;
  const statusBtns = STATUS.map((s) =>
    h('button', { type: 'button', dataset: { s: s.id }, title: s.label, 'aria-label': s.label, onclick: () => cur.status !== s.id && store.change({ type: 'set', id: cur.id, field: 'status', value: s.id }) },
      h('b', { 'aria-hidden': 'true' }), h('span', { text: s.kurz })));
  const status = h('div', { class: 'cl-status', role: 'group', 'aria-label': 'Status' }, ...statusBtns);
  const title = h('p', { class: 'cl-title' });
  const meta = h('p', { class: 'cl-meta' });
  const note = h('p', { class: 'cl-note' });
  const who = h('select', { class: 'cl-who-select', 'aria-label': 'Wer macht das?', onchange: () => store.change({ type: 'set', id: cur.id, field: 'wer', value: who.value }) });
  const moreBtn = h('button', { class: 'cl-btn cl-more', type: 'button', 'aria-expanded': 'false', 'aria-label': 'Details: Notiz, Name, Entfernen', onclick: () => toggleDetails() }, h('span', { text: 'Details' }));
  const noteInput = h('textarea', { rows: 3, placeholder: 'Was ist zu tun, was fehlt noch …' });
  const titleInput = h('input', { type: 'text', maxlength: 120 });
  const details = h('div', { class: 'cl-details', hidden: true },
    h('label', {}, 'Notiz', noteInput),
    h('label', {}, 'Name', titleInput),
    h('div', { class: 'cl-details-actions' },
      h('button', {
        class: 'cl-btn cl-danger', type: 'button', text: 'Punkt entfernen',
        onclick: () => confirm(`„${cur.titel}“ wirklich entfernen?`) && store.change({ type: 'del', id: cur.id }),
      }),
      h('button', {
        class: 'cl-btn cl-btn-primary', type: 'button', text: 'Übernehmen',
        onclick: () => {
          if (noteInput.value !== (cur.notiz || '')) store.change({ type: 'set', id: cur.id, field: 'notiz', value: noteInput.value.trim() });
          const t = titleInput.value.trim();
          if (t && t !== cur.titel) store.change({ type: 'set', id: cur.id, field: 'titel', value: t });
          toggleDetails(false);
        },
      })));
  const el = h('li', { class: 'cl-item' }, status, h('div', { class: 'cl-text' }, title, note, meta), who, moreBtn, details);
  let cur = p;
  function toggleDetails(open = details.hidden) {
    details.hidden = !open;
    moreBtn.setAttribute('aria-expanded', String(open));
    if (open) {
      noteInput.value = cur.notiz || '';
      titleInput.value = cur.titel;
      noteInput.focus();
    }
  }
  function update(q) {
    cur = q;
    el.dataset.status = q.status;
    el.dataset.id = q.id;
    for (const b of statusBtns) {
      b.setAttribute('aria-pressed', String(b.dataset.s === q.status));
      b.disabled = !edit();
    }
    title.textContent = q.titel;
    note.textContent = q.notiz || '';
    note.hidden = !q.notiz;
    meta.textContent = q.geaendert ? `zuletzt ${q.von || '?'} · ${when(q.geaendert)}` : '';
    meta.hidden = !q.geaendert;
    // Auswahl neu aufbauen (Namen können sich ändern), Wert setzen
    const opts = [['', '— niemand —'], ...admins().map((a) => [a, a]), [BEIDE, 'Beide']];
    if (q.wer && !opts.some(([v]) => v === q.wer)) opts.push([q.wer, q.wer]);
    if (who.options.length !== opts.length || [...who.options].some((o, i) => o.value !== opts[i][0])) who.replaceChildren(...opts.map(([v, t]) => h('option', { value: v, text: t })));
    who.value = q.wer || '';
    who.dataset.empty = String(!q.wer);
    who.style.color = q.wer ? colorOf(q.wer) : '';
    who.disabled = !edit();
    // Notiz steht schon in der Zeile; Details (Notiz, Name, Entfernen) nur zum Bearbeiten
    moreBtn.hidden = !edit();
    if (!edit()) details.hidden = true;
  }
  update(p);
  return { el, update };
}

// ── Gruppen ──
function makeGroup(g) {
  const meta = h('p', { class: 'cl-group-meta' });
  const barWrap = h('div', { style: 'flex: 1 1 140px; max-width: 260px; align-self: center' });
  const list = h('ul', { class: 'cl-list' });
  const empty = h('p', { class: 'cl-empty', text: 'Keine Punkte für diesen Filter.', hidden: true });
  const input = h('input', { type: 'text', placeholder: 'Neuer Punkt …', maxlength: 120, 'aria-label': `Neuer Punkt in ${g.titel}` });
  const add = h('form', {
    class: 'cl-add',
    onsubmit: (e) => {
      e.preventDefault();
      const t = input.value.trim();
      if (!t) return;
      store.change({ type: 'add', gruppe: g.id, titel: t });
      input.value = '';
    },
  }, input, h('button', { class: 'cl-btn', type: 'submit', text: 'Hinzufügen' }));
  const el = h('section', { class: 'cl-group', 'aria-labelledby': 'g-' + g.id },
    h('header', { class: 'cl-group-head' }, h('h2', { id: 'g-' + g.id, text: g.titel }), meta, barWrap), list, empty, add);
  return { el, list, meta, barWrap, empty, add };
}

function render() {
  const d = store.data;
  const root = $('groups');
  // ohne Anmeldung: nichts von der Liste zeigen, nur den Weg zur Anmeldung
  document.querySelector('.cl-readonly')?.remove();
  for (const el of [$('summary'), document.querySelector('.cl-tools')]) el.hidden = !d;
  if (!d) {
    root.replaceChildren();
    items.clear();
    groups.clear();
    const msg = store.configured
      ? h('p', { class: 'cl-readonly' }, 'Die Liste ist nur für die Admins. Mit deinem Code ', h('button', { class: 'cl-btn', type: 'button', text: 'anmelden', onclick: openLogin }), '. Beim ersten Mal legst du deinen Code dort selbst fest.')
      : h('p', { class: 'cl-readonly' }, 'Noch nicht eingerichtet. Einmalig checkliste/supabase.sql in Supabase ausführen und in checkliste/js/config.js die Project URL und den Publishable Key eintragen.');
    root.before(msg);
    return;
  }

  // Weggefallene Punkte und Gruppen zuerst entfernen, dann alles an seine Stelle bringen
  const ids = new Set(d.punkte.map((p) => p.id));
  for (const [id, it] of items) if (!ids.has(id)) {
    it.el.remove();
    items.delete(id);
  }
  for (const [gid, G] of groups) if (!d.gruppen.some((g) => g.id === gid)) {
    G.el.remove();
    groups.delete(gid);
  }
  d.gruppen.forEach((g, gi) => {
    if (!groups.has(g.id)) groups.set(g.id, makeGroup(g));
    const G = groups.get(g.id);
    place(root, G.el, gi); // Reihenfolge wie in den Daten
    const list = d.punkte.filter((p) => p.gruppe === g.id);
    const c = counts(list);
    G.meta.textContent = `${c.fertig} / ${list.length} überarbeitet` + (c.arbeit ? ` · ${c.arbeit} in Arbeit` : '');
    G.barWrap.replaceChildren(bar(c, list.length));
    G.add.hidden = !store.canEdit;
    // Offene und angefangene Punkte oben, fertige unten; sonst bleibt die Reihenfolge wie in den Daten
    const sorted = [...list.filter((p) => p.status !== 'fertig'), ...list.filter((p) => p.status === 'fertig')];
    sorted.forEach((p, i) => {
      let it = items.get(p.id);
      if (!it) items.set(p.id, (it = makeItem(p)));
      else it.update(p);
      place(G.list, it.el, i);
    });
  });
  renderSummary();
  renderFilters();
  applyFilter();
}

// ── Kopfzeile ──
function renderAccount() {
  const who = $('who');
  if (store.login.code && store.login.name) who.replaceChildren('Angemeldet als ', h('b', { style: `--c:${colorOf(store.login.name)}`, text: store.login.name }));
  else who.textContent = 'Nicht angemeldet';
  $('login-open').textContent = store.login.code ? 'Konto' : 'Anmelden';
  $('login-open').hidden = !store.configured;
}
function renderState() {
  const s = $('sync');
  s.dataset.s = store.state.status;
  s.textContent = store.state.text;
}

// ── Anmelden und Code festlegen ──
const dlg = $('login');
const say = (el, text, kind = '') => {
  el.dataset.s = kind;
  el.textContent = text;
};
async function openLogin() {
  for (const id of ['login-code', 'setup-code', 'setup-code2']) $(id).value = '';
  say($('login-msg'), '');
  say($('setup-msg'), '');
  $('setup-form').hidden = true;
  dlg.showModal();
  $('login-code').focus();
  // Bereich „Zum ersten Mal hier?“ nur, wenn jemand noch keinen Code hat
  try {
    const free = (await store.status()).filter((a) => !a.hat_code).map((a) => a.name);
    $('setup-names').replaceChildren(...free.map((n, i) => h('label', {}, h('input', { type: 'radio', name: 'setup-name', value: n, checked: i === 0 }), n)));
    $('setup-form').hidden = !free.length;
  } catch {}
}
$('login-cancel').addEventListener('click', () => dlg.close());
$('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const code = $('login-code').value.trim(), msg = $('login-msg');
  if (!code) return say(msg, 'Bitte deinen Code eingeben.', 'fehler');
  say(msg, 'Prüfe den Code …');
  $('login-ok').disabled = true;
  try {
    await store.signIn(code);
    say(msg, `Hallo ${store.login.name}!`, 'ok');
    setTimeout(() => dlg.close(), 500);
  } catch (err) {
    say(msg, err.message, 'fehler');
  } finally {
    $('login-ok').disabled = false;
  }
});
$('setup-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = $('setup-msg');
  const name = dlg.querySelector('input[name="setup-name"]:checked')?.value;
  const code = $('setup-code').value.trim();
  if (!name) return say(msg, 'Bitte deinen Namen wählen.', 'fehler');
  if (code.length < 8) return say(msg, 'Der Code muss mindestens 8 Zeichen lang sein.', 'fehler');
  if (code !== $('setup-code2').value.trim()) return say(msg, 'Die beiden Eingaben sind nicht gleich.', 'fehler');
  say(msg, 'Lege den Code fest …');
  $('setup-ok').disabled = true;
  try {
    await store.setup(name, code);
    say(msg, `Fertig, ${name}! Ab jetzt meldest du dich mit diesem Code an.`, 'ok');
    setTimeout(() => dlg.close(), 1200);
  } catch (err) {
    say(msg, err.message, 'fehler');
  } finally {
    $('setup-ok').disabled = false;
  }
});

// ── Konto: Code ändern, abmelden ──
const konto = $('konto');
$('login-open').addEventListener('click', () => {
  if (!store.login.code) return openLogin();
  $('konto-who').textContent = `Angemeldet als ${store.login.name}. Hier kannst du deinen Code ändern oder dich in diesem Browser abmelden.`;
  for (const id of ['konto-code', 'konto-code2']) $(id).value = '';
  say($('konto-msg'), '');
  konto.showModal();
});
$('konto-close').addEventListener('click', () => konto.close());
$('konto-out').addEventListener('click', () => {
  if (store.pending.length && !confirm('Es wird gerade noch gespeichert. Trotzdem abmelden?')) return;
  konto.close();
  store.signOut();
});
$('konto-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = $('konto-msg'), code = $('konto-code').value.trim();
  if (code.length < 8) return say(msg, 'Der Code muss mindestens 8 Zeichen lang sein.', 'fehler');
  if (code !== $('konto-code2').value.trim()) return say(msg, 'Die beiden Eingaben sind nicht gleich.', 'fehler');
  $('konto-ok').disabled = true;
  try {
    await store.changeCode(code);
    say(msg, 'Code geändert. Ab jetzt gilt der neue.', 'ok');
    setTimeout(() => konto.close(), 1200);
  } catch (err) {
    say(msg, err.message, 'fehler');
  } finally {
    $('konto-ok').disabled = false;
  }
});

// ── Ereignisse ──
store.on((kind) => {
  if (kind === 'data') {
    render();
    renderAccount(); // Farbe des Namens hängt an der Admin-Liste aus den Daten
  }
  if (kind === 'state') renderState();
  if (kind === 'login') {
    renderAccount();
    for (const it of items.values()) it.el.querySelector('.cl-details').hidden = true;
    render();
  }
});
$('search').addEventListener('input', (e) => {
  filter.text = e.target.value.trim().toLowerCase();
  if (store.data) applyFilter();
});
$('reload').addEventListener('click', () => store.load());
// Warnung beim Schließen, solange noch etwas nicht gespeichert ist
addEventListener('beforeunload', (e) => {
  if (!store.pending.length) return;
  e.preventDefault();
  e.returnValue = '';
});
// alle 20 Sekunden nachsehen, ob der andere Admin etwas geändert hat (und beim Zurückkehren auf den Tab)
const refresh = () => {
  if (document.visibilityState === 'visible' && store.login.code && !store.pending.length) store.load();
};
setInterval(refresh, 20000);
document.addEventListener('visibilitychange', refresh);

renderAccount();
renderState();
store.load();
