// Checkliste: Daten und Speichern in Supabase.
//
// Die Liste liegt in Supabase (Tabellen und Funktionen: checkliste/supabase.sql). Die Seite ruft nur Funktionen
// auf, und jede prüft zuerst den Code des Admins: laden, ein Feld setzen, Punkt anlegen, Punkt entfernen. Den Code
// legt jeder Admin beim ersten Mal selbst fest (checkliste_festlegen) und kann ihn später ändern. Jede
// Änderung ist ein einzelnes Feld eines Punkts, darum können beide Admins gleichzeitig arbeiten, ohne sich
// gegenseitig etwas zu überschreiben. Die Seite zeigt eine Änderung sofort an und schickt sie im Hintergrund;
// alle 20 Sekunden lädt sie den Stand des anderen nach.

import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

export const STATUS = [
  { id: 'offen', label: 'Muss überarbeitet werden', kurz: 'Offen' },
  { id: 'arbeit', label: 'In Arbeit', kurz: 'In Arbeit' },
  { id: 'fertig', label: 'Überarbeitet', kurz: 'Überarbeitet' },
];
export const BEIDE = 'Beide';

// ── Operationen (sofort in der Anzeige, dann an Supabase) ──
// set: { type: 'set', id, field: 'status' | 'wer' | 'notiz' | 'titel', value }
// add: { type: 'add', gruppe, titel }   del: { type: 'del', id }
export function applyOp(data, op, who, now = new Date().toISOString()) {
  if (op.type === 'del') data.punkte = data.punkte.filter((p) => p.id !== op.id);
  else if (op.type === 'set') {
    const p = data.punkte.find((q) => q.id === op.id);
    if (p) Object.assign(p, { [op.field]: op.value, geaendert: now, von: who });
  }
  return data;
}

// ── Anmeldung (Code bleibt nur in diesem Browser) ──
const KEY = 'coinmaster.checkliste';
export function loadLogin() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '{}');
    return v.code ? { code: v.code, name: v.name || '' } : {};
  } catch {
    return {};
  }
}
export function saveLogin(v) {
  try {
    if (v.code) localStorage.setItem(KEY, JSON.stringify({ code: v.code, name: v.name }));
    else localStorage.removeItem(KEY);
  } catch {}
}

export class Store {
  constructor({ fetchImpl = (...a) => fetch(...a), url = SUPABASE_URL, key = SUPABASE_KEY } = {}) {
    this.fetch = fetchImpl;
    this.url = (url || '').replace(/\/+$/, '');
    this.key = key || '';
    this.data = null;
    this.pending = []; // noch nicht bestätigte Änderungen
    this.queue = Promise.resolve();
    this.login = loadLogin(); // { code, name }
    this.listeners = new Set();
    this.state = { status: 'laden', text: 'Lade …' };
  }
  get configured() {
    return !!(this.url && this.key);
  }
  get canEdit() {
    return !!(this.login.code && this.login.name && this.data);
  }
  get saving() {
    return this.pending.length > 0;
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

  // Funktion in Supabase aufrufen (PostgREST: POST /rest/v1/rpc/<name>)
  async rpc(name, args) {
    const headers = { apikey: this.key, 'Content-Type': 'application/json', Accept: 'application/json' };
    // alter anon-Key ist ein JWT und gehört auch in Authorization; der neue Publishable Key nur in apikey
    if (this.key.startsWith('eyJ')) headers.Authorization = `Bearer ${this.key}`;
    let r;
    try {
      r = await this.fetch(`${this.url}/rest/v1/rpc/${name}`, { method: 'POST', headers, body: JSON.stringify(args), cache: 'no-store' });
    } catch {
      throw new Error('Keine Verbindung zu Supabase.');
    }
    let j = null;
    try {
      j = await r.json();
    } catch {}
    if (!r.ok) {
      if (r.status === 404 || j?.code === 'PGRST202') throw new Error('Die Funktionen fehlen in Supabase. Bitte checkliste/supabase.sql ausführen.');
      if (r.status === 401) throw new Error('Supabase-Schlüssel ungültig. checkliste/js/config.js prüfen.');
      throw new Error(j?.message || `Supabase-Fehler ${r.status}`);
    }
    if (j?.fehler) {
      const e = new Error(j.fehler);
      e.code = j.fehler === 'Falscher Code.' ? 'code' : 'fehler';
      throw e;
    }
    return j;
  }

  take(j) {
    this.data = { admins: j.admins || [], gruppen: j.gruppen || [], punkte: j.punkte || [] };
    // eigene, noch unterwegs befindliche Änderungen bleiben sichtbar
    for (const op of this.pending) applyOp(this.data, op, this.login.name);
  }

  async load() {
    if (!this.configured) {
      this.data = null;
      this.emit('data');
      return this.setState('fehler', 'Noch nicht eingerichtet: Supabase-Adresse und Schlüssel fehlen in checkliste/js/config.js.');
    }
    if (!this.login.code) {
      this.data = null;
      this.emit('data');
      return this.setState('aus', '');
    }
    try {
      const j = await this.rpc('checkliste_laden', { p_code: this.login.code });
      if (j.ich && j.ich !== this.login.name) this.setLogin({ ...this.login, name: j.ich });
      this.take(j);
      this.emit('data');
      this.setState(this.pending.length ? 'speichert' : 'ok', this.pending.length ? 'Speichert …' : 'Alles gespeichert');
    } catch (e) {
      if (e.code === 'code') {
        // Code wurde geändert: abmelden
        this.setLogin({});
        this.data = null;
        this.emit('data');
        return this.setState('fehler', 'Dein Code gilt nicht mehr. Bitte neu anmelden.');
      }
      this.setState('fehler', `Laden fehlgeschlagen: ${e.message}`);
    }
  }

  async signIn(code) {
    if (!this.configured) throw new Error('Noch nicht eingerichtet: Supabase-Adresse und Schlüssel fehlen in checkliste/js/config.js.');
    const j = await this.rpc('checkliste_laden', { p_code: code });
    this.setLogin({ code, name: j.ich });
    this.take(j);
    this.emit('data');
    this.setState('ok', 'Alles gespeichert');
  }
  // Wer hat schon einen Code? [{ name, hat_code }]
  async status() {
    if (!this.configured) return [];
    return (await this.rpc('checkliste_status', {})) || [];
  }
  // Eigenen Code beim ersten Mal festlegen; danach ist man angemeldet
  async setup(name, code) {
    if (!this.configured) throw new Error('Noch nicht eingerichtet: Supabase-Adresse und Schlüssel fehlen in checkliste/js/config.js.');
    const j = await this.rpc('checkliste_festlegen', { p_name: name, p_code: code });
    this.setLogin({ code, name: j.ich });
    this.take(j);
    this.emit('data');
    this.setState('ok', 'Alles gespeichert');
  }
  // Eigenen Code ändern (mit dem gespeicherten bisherigen Code)
  async changeCode(neu) {
    await this.rpc('checkliste_code_aendern', { p_code: this.login.code, p_neu: neu });
    this.setLogin({ ...this.login, code: neu });
  }
  signOut() {
    this.setLogin({});
    this.data = null;
    this.pending = [];
    this.emit('data');
    this.setState('aus', '');
  }
  setLogin(v) {
    this.login = v;
    saveLogin(v);
    this.emit('login');
  }

  change(op) {
    if (!this.canEdit) return;
    if (op.type !== 'add') applyOp(this.data, op, this.login.name);
    this.pending.push(op);
    this.emit('data');
    this.setState('speichert', 'Speichert …');
    // nacheinander schicken, damit die Reihenfolge stimmt
    this.queue = this.queue.then(() => this.send(op));
  }

  async send(op) {
    const code = this.login.code;
    try {
      let j;
      if (op.type === 'set') j = await this.rpc('checkliste_setzen', { p_code: code, p_id: op.id, p_feld: op.field, p_wert: op.value });
      else if (op.type === 'add') j = await this.rpc('checkliste_neu', { p_code: code, p_gruppe: op.gruppe, p_titel: op.titel });
      else j = await this.rpc('checkliste_loeschen', { p_code: code, p_id: op.id });
      this.pending.splice(this.pending.indexOf(op), 1);
      if (j?.punkt && this.data) {
        // Stand aus der Datenbank übernehmen (Zeit und Name von dort)
        const i = this.data.punkte.findIndex((p) => p.id === j.punkt.id);
        if (i >= 0) this.data.punkte[i] = { ...j.punkt };
        else this.data.punkte.push({ ...j.punkt });
        for (const o of this.pending) if (o.type === 'set' && o.id === j.punkt.id) applyOp(this.data, o, this.login.name);
        this.emit('data');
      }
      if (!this.pending.length) this.setState('ok', 'Alles gespeichert');
    } catch (e) {
      this.pending.splice(this.pending.indexOf(op), 1);
      this.setState('fehler', `Nicht gespeichert: ${e.message}`);
      // Anzeige wieder auf den Stand der Datenbank bringen
      if (e.code === 'code') return this.load();
      if (!this.pending.length) await this.load().then(() => this.setState('fehler', `Nicht gespeichert: ${e.message}`));
    }
  }
}
