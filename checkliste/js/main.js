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
      ? h('p', { class: 'cl-readonly' }, 'Die Liste ist nur für die Admins. Mit deinem Code ', h('button', { class: 'cl-btn', type: 'button', text: 'anmelden', onclick: openLogin }), '.')
      : h('p', { class: 'cl-readonly' }, 'Noch nicht eingerichtet. Einmalig checkliste/supabase.sql in Supabase ausführen und in checkliste/js/config.js die Project URL und den Publishable Key eintragen.');
    root.before(msg);
    return;
  }

  const seen = new Set();
  for (const g of d.gruppen) {
    if (!groups.has(g.id)) groups.set(g.id, makeGroup(g));
    const G = groups.get(g.id);
    root.append(G.el); // Reihenfolge wie in den Daten
    const list = d.punkte.filter((p) => p.gruppe === g.id);
    const c = counts(list);
    G.meta.textContent = `${c.fertig} / ${list.length} überarbeitet` + (c.arbeit ? ` · ${c.arbeit} in Arbeit` : '');
    G.barWrap.replaceChildren(bar(c, list.length));
    G.add.hidden = !store.canEdit;
    for (const p of list) {
      seen.add(p.id);
      let it = items.get(p.id);
      if (!it) items.set(p.id, (it = makeItem(p)));
      else it.update(p);
      G.list.append(it.el); // verschiebt nur, wenn nötig
    }
  }
  for (const [id, it] of items) if (!seen.has(id)) {
    it.el.remove();
    items.delete(id);
  }
  for (const [gid, G] of groups) if (!d.gruppen.some((g) => g.id === gid)) G.el.remove();
  renderSummary();
  renderFilters();
  applyFilter();
}

// ── Kopfzeile ──
function renderAccount() {
  const who = $('who');
  if (store.login.code && store.login.name) who.replaceChildren('Angemeldet als ', h('b', { style: `--c:${colorOf(store.login.name)}`, text: store.login.name }));
  else who.textContent = 'Nicht angemeldet';
  $('login-open').textContent = store.login.code ? 'Abmelden' : 'Anmelden';
  $('login-open').hidden = !store.configured;
}
function renderState() {
  const s = $('sync');
  s.dataset.s = store.state.status;
  s.textContent = store.state.text;
}

// ── Anmelden ──
const dlg = $('login');
function openLogin() {
  $('login-code').value = '';
  $('login-msg').textContent = '';
  dlg.showModal();
  $('login-code').focus();
}
$('login-open').addEventListener('click', () => {
  if (!store.login.code) return openLogin();
  if (store.pending.length && !confirm('Es wird gerade noch gespeichert. Trotzdem abmelden?')) return;
  store.signOut();
});
$('login-cancel').addEventListener('click', () => dlg.close());
$('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const code = $('login-code').value.trim();
  const msg = $('login-msg');
  if (!code) {
    msg.dataset.s = 'fehler';
    msg.textContent = 'Bitte deinen Code eingeben.';
    return;
  }
  msg.dataset.s = '';
  msg.textContent = 'Prüfe den Code …';
  $('login-ok').disabled = true;
  try {
    await store.signIn(code);
    msg.dataset.s = 'ok';
    msg.textContent = `Hallo ${store.login.name}!`;
    setTimeout(() => dlg.close(), 500);
  } catch (err) {
    msg.dataset.s = 'fehler';
    msg.textContent = err.message;
  } finally {
    $('login-ok').disabled = false;
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
