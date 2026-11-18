// Checkliste: Daten und Speichern.
//
// Die Liste liegt als checkliste/daten.json im Repo. Ohne Anmeldung liest die Seite die Datei so, wie GitHub
// Pages sie ausliefert (nur ansehen). Mit einem GitHub-Token liest und schreibt sie über die GitHub-API:
// jede Änderung (Status, wer, Notiz, Titel, neuer oder gelöschter Punkt) ist eine Operation. Beim Speichern
// holt die Seite den neuesten Stand, wendet die eigenen Operationen darauf an und schreibt ihn als Commit
// zurück. Hat der andere Admin dazwischen gespeichert (anderer sha), beginnt sie von vorn. So gehen keine
// Häkchen verloren, auch wenn beide gleichzeitig arbeiten; nur dasselbe Feld desselben Punkts gewinnt der,
// der zuletzt speichert.

export const STATUS = [
  { id: 'offen', label: 'Muss überarbeitet werden', kurz: 'Offen' },
  { id: 'arbeit', label: 'In Arbeit', kurz: 'In Arbeit' },
  { id: 'fertig', label: 'Überarbeitet', kurz: 'Überarbeitet' },
];
export const BEIDE = 'Beide';
const PATH = 'checkliste/daten.json';
const BRANCH = 'main';

// Repo aus der Adresse (owner.github.io/repo/…), sonst das Coinmaster-Repo
export function repoFromLocation(loc = globalThis.location) {
  const host = loc?.hostname || '';
  if (host.endsWith('.github.io')) {
    const repo = loc.pathname.split('/').filter(Boolean)[0];
    if (repo) return { owner: host.split('.')[0], repo };
  }
  return { owner: 'spitzefluke', repo: 'Coinmaster-Adventure' };
}

// ── Operationen ──
// set: { type: 'set', id, field: 'status' | 'wer' | 'notiz' | 'titel', value }
// add: { type: 'add', punkt }   del: { type: 'del', id }
export function applyOp(data, op, who, now = new Date().toISOString()) {
  if (op.type === 'add') {
    if (!data.punkte.some((p) => p.id === op.punkt.id)) data.punkte.push({ ...op.punkt, geaendert: now, von: who });
  } else if (op.type === 'del') {
    data.punkte = data.punkte.filter((p) => p.id !== op.id);
  } else if (op.type === 'set') {
    const p = data.punkte.find((q) => q.id === op.id);
    if (p) Object.assign(p, { [op.field]: op.value, geaendert: now, von: who });
  }
  return data;
}

export function newId() {
  return 'p-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// Kurzer Text für die Commit-Nachricht
export function describe(ops, data) {
  const name = (id) => data.punkte.find((p) => p.id === id)?.titel || id;
  const one = (op) => {
    if (op.type === 'add') return `neu: ${op.punkt.titel}`;
    if (op.type === 'del') return `entfernt: ${name(op.id)}`;
    if (op.field === 'status') return `${name(op.id)} → ${STATUS.find((s) => s.id === op.value)?.kurz || op.value}`;
    if (op.field === 'wer') return `${name(op.id)}: ${op.value || 'niemand'} zuständig`;
    if (op.field === 'notiz') return `${name(op.id)}: Notiz`;
    return `${name(op.id)}: umbenannt`;
  };
  const first = one(ops[0]);
  return ops.length > 1 ? `${first} (+${ops.length - 1} weitere)` : first;
}

// Lesbares JSON: ein Punkt pro Zeile (kleine Diffs im Repo)
export function formatData(d) {
  const line = (o) => '    ' + JSON.stringify(o);
  return [
    '{',
    `  "admins": ${JSON.stringify(d.admins)},`,
    '  "gruppen": [',
    d.gruppen.map(line).join(',\n'),
    '  ],',
    '  "punkte": [',
    d.punkte.map(line).join(',\n'),
    '  ]',
    '}',
    '',
  ].join('\n');
}

// Base64 mit UTF-8 (Umlaute)
export function encodeB64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
export function decodeB64(b64) {
  const bin = atob(b64.replace(/\s/g, ''));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

// ── Anmeldung (nur in diesem Browser) ──
const KEY = 'coinmaster.checkliste';
export function loadLogin() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}
export function saveLogin(v) {
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch {}
}

// ── Speicher ──
export class Store {
  constructor({ fetchImpl = (...a) => fetch(...a), repo = repoFromLocation(), localUrl = 'daten.json', delay = 1200 } = {}) {
    this.fetch = fetchImpl;
    this.repo = repo;
    this.localUrl = localUrl;
    this.delay = delay;
    this.data = null;
    this.sha = null;
    this.pending = [];
    this.saving = false;
    this.timer = null;
    this.login = loadLogin(); // { name, token }
    this.listeners = new Set();
    this.state = { status: 'laden', text: 'Lade die Liste …' };
  }
  get canEdit() {
    return !!(this.login.token && this.login.name);
  }
  on(fn) {
    this.listeners.add(fn);
  }
  emit(kind) {
    for (const fn of this.listeners) fn(kind);
  }
  setState(status, text) {
    this.state = { status, text };
    this.emit('state');
  }
  api(path) {
    return `https://api.github.com/repos/${this.repo.owner}/${this.repo.repo}${path}`;
  }
  headers() {
    return { Accept: 'application/vnd.github+json', Authorization: `Bearer ${this.login.token}`, 'X-GitHub-Api-Version': '2022-11-28' };
  }

  // neuesten Stand holen: mit Token über die API (aktuell, mit sha), sonst die Datei der Webseite
  async fetchLatest() {
    if (this.login.token) {
      const r = await this.fetch(this.api(`/contents/${PATH}?ref=${BRANCH}`), { headers: this.headers(), cache: 'no-store' });
      if (!r.ok) throw await apiError(r);
      const j = await r.json();
      return { data: JSON.parse(decodeB64(j.content)), sha: j.sha };
    }
    const r = await this.fetch(this.localUrl, { cache: 'no-store' });
    if (!r.ok) throw new Error(`Liste nicht gefunden (${r.status})`);
    return { data: await r.json(), sha: null };
  }

  async load() {
    try {
      const { data, sha } = await this.fetchLatest();
      this.sha = sha;
      // noch nicht gespeicherte eigene Änderungen bleiben sichtbar
      for (const op of this.pending) applyOp(data, op, this.login.name);
      this.data = data;
      this.emit('data');
      this.setState(this.pending.length ? 'offen' : 'ok', this.pending.length ? 'Ungespeicherte Änderungen …' : this.canEdit ? 'Alles gespeichert' : 'Nur ansehen');
    } catch (e) {
      this.setState('fehler', `Laden fehlgeschlagen: ${e.message}`);
      if (!this.data && this.login.token) {
        // Token kaputt? Dann wenigstens die Datei der Webseite zeigen
        try {
          const r = await this.fetch(this.localUrl, { cache: 'no-store' });
          if (r.ok) {
            this.data = await r.json();
            this.emit('data');
          }
        } catch {}
      }
    }
  }

  change(op) {
    if (!this.canEdit) return;
    applyOp(this.data, op, this.login.name);
    this.pending.push(op);
    this.emit('data');
    this.setState('offen', 'Ungespeicherte Änderungen …');
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.save(), this.delay);
  }

  async save() {
    if (this.saving) {
      this.again = true;
      return;
    }
    if (!this.pending.length || !this.canEdit) return;
    this.saving = true;
    this.setState('speichert', 'Speichert …');
    const ops = this.pending.slice();
    try {
      for (let attempt = 0; ; attempt++) {
        const { data, sha } = await this.fetchLatest();
        for (const op of ops) applyOp(data, op, this.login.name);
        const r = await this.fetch(this.api(`/contents/${PATH}`), {
          method: 'PUT',
          headers: { ...this.headers(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: `Checkliste: ${describe(ops, data)} (${this.login.name})`, content: encodeB64(formatData(data)), sha, branch: BRANCH }),
        });
        if (r.ok) {
          const j = await r.json();
          this.sha = j.content?.sha || null;
          this.pending.splice(0, ops.length);
          for (const op of this.pending) applyOp(data, op, this.login.name);
          this.data = data;
          this.emit('data');
          this.setState(this.pending.length ? 'offen' : 'ok', this.pending.length ? 'Ungespeicherte Änderungen …' : 'Alles gespeichert');
          break;
        }
        // der andere Admin hat dazwischen gespeichert: neu holen und noch einmal
        if ((r.status === 409 || r.status === 422) && attempt < 4) {
          await new Promise((res) => setTimeout(res, 400 * 2 ** attempt));
          continue;
        }
        throw await apiError(r);
      }
    } catch (e) {
      this.setState('fehler', `Nicht gespeichert: ${e.message}`);
    } finally {
      this.saving = false;
      if (this.again || (this.pending.length && this.state.status === 'offen')) {
        this.again = false;
        this.save();
      }
    }
  }

  // Anmelden: Token prüfen (Lesen der Liste und Schreibrecht laut Konto)
  async checkLogin(name, token) {
    const h = { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}` };
    const [u, repo] = await Promise.all([
      this.fetch('https://api.github.com/user', { headers: h, cache: 'no-store' }),
      this.fetch(this.api(''), { headers: h, cache: 'no-store' }),
    ]);
    if (u.status === 401) throw new Error('Der Token ist ungültig oder abgelaufen.');
    if (!repo.ok) throw new Error(`Kein Zugriff auf ${this.repo.owner}/${this.repo.repo} (${repo.status}).`);
    const user = u.ok ? await u.json() : {};
    const rj = await repo.json();
    return { login: user.login || '', push: !!rj.permissions?.push, name, token };
  }
  setLogin(v) {
    this.login = v;
    saveLogin(v);
    this.emit('login');
  }
}

async function apiError(r) {
  let msg = '';
  try {
    msg = (await r.json()).message || '';
  } catch {}
  if (r.status === 401) return new Error('Token ungültig oder abgelaufen (401)');
  if (r.status === 403 || r.status === 404) return new Error(`keine Berechtigung (${r.status}${msg ? ': ' + msg : ''})`);
  return new Error(`${r.status}${msg ? ': ' + msg : ''}`);
}
