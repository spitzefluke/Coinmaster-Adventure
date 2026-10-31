// Einstellungen-Fenster. Grafik und „Animationen überspringen“ gelten auch für
// Münzkabinett, Münzindex und Eierhalle (gemeinsam gespeichert in js/settings.js).

import { saveSettings, DEFAULT_SETTINGS, freshState } from '../state.js';
import { icon } from '../icons.js';

const row = (ico, label, hint, control) => `
  <div class="set-row">
    <span class="set-ico">${icon(ico, 20)}</span>
    <div class="set-text"><p class="set-label">${label}</p><p class="set-hint">${hint}</p></div>
    <div class="set-control">${control}</div>
  </div>`;

const toggle = (id, on) => `<button type="button" class="switch" role="switch" id="${id}" aria-checked="${on}"><span></span></button>`;

export const settingsPanel = {
  id: 'einstellungen',
  title: 'Einstellungen',
  icon: 'gear',
  sub: () => 'Gilt für alle Bereiche der Seite',
  render(body, ctx) {
    const s = ctx.settings;
    body.innerHTML = `
      <div class="settings">
        <h3 class="set-group">Ton</h3>
        ${row('sound', 'Effekte', 'Klänge beim Finden, Kaufen und Lernen', `<input type="range" id="set-sfx" min="0" max="100" step="5" value="${s.sfx}" aria-label="Lautstärke Effekte"><output id="out-sfx">${s.sfx} %</output>`)}
        ${row('music', 'Musik', 'Gilt im Spiel; in der Vorschau gibt es noch keine Musik', `<input type="range" id="set-music" min="0" max="100" step="5" value="${s.music}" aria-label="Lautstärke Musik"><output id="out-music">${s.music} %</output>`)}
        <h3 class="set-group">Grafik</h3>
        ${row('sparkle', 'Qualität', 'Schärfe der 3D-Münzen und -Eier. Niedrig schont schwache Geräte.', `<div class="seg" role="radiogroup" aria-label="Grafikqualität">${['niedrig', 'mittel', 'hoch'].map((q) => `<button type="button" role="radio" data-q="${q}" aria-checked="${s.quality === q}">${q[0].toUpperCase() + q.slice(1)}</button>`).join('')}</div>`)}
        ${row('sparkle', 'Weniger Partikel', 'Ruhigere Spielwelt mit weniger Glitzern', toggle('set-particles', s.fewerParticles))}
        <h3 class="set-group">Spiel</h3>
        ${row('skip', 'Animationen überspringen', 'Entdeckung neuer Münzen und Schlüpfen laufen in Kurzfassung', toggle('set-skip', s.skipAnimations))}
        ${row('numbers', 'Kurze Zahlen', 'Große Beträge als 12,5K statt 12.500', toggle('set-short', s.shortNumbers))}
        <h3 class="set-group">Spielstand</h3>
        <div class="set-actions">
          <button type="button" class="btn" id="set-defaults">Einstellungen zurücksetzen</button>
          <button type="button" class="btn danger-btn" id="set-reset">Spielstand neu beginnen</button>
        </div>
      </div>`;

    const apply = (patch) => {
      Object.assign(s, patch);
      saveSettings(s);
      ctx.applySettings();
    };
    for (const k of ['sfx', 'music']) {
      const input = body.querySelector(`#set-${k}`);
      input.addEventListener('input', () => {
        body.querySelector(`#out-${k}`).textContent = `${input.value} %`;
        apply({ [k]: +input.value });
      });
      if (k === 'sfx') input.addEventListener('change', () => ctx.sound(1));
    }
    body.querySelectorAll('[data-q]').forEach((b) =>
      b.addEventListener('click', () => {
        apply({ quality: b.dataset.q });
        body.querySelectorAll('[data-q]').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
      }),
    );
    for (const [id, key] of [['set-particles', 'fewerParticles'], ['set-skip', 'skipAnimations'], ['set-short', 'shortNumbers']]) {
      const sw = body.querySelector('#' + id);
      sw.addEventListener('click', () => {
        const on = sw.getAttribute('aria-checked') !== 'true';
        sw.setAttribute('aria-checked', String(on));
        apply({ [key]: on });
      });
    }
    body.querySelector('#set-defaults').addEventListener('click', () => {
      apply({ ...DEFAULT_SETTINGS });
      ctx.toast('Einstellungen zurückgesetzt', '#d9b26a');
      ctx.rerender();
    });
    const reset = body.querySelector('#set-reset');
    reset.addEventListener('click', () => {
      if (!reset.dataset.armed) {
        reset.dataset.armed = '1';
        reset.textContent = 'Wirklich alles verlieren? Nochmal klicken';
        setTimeout(() => {
          delete reset.dataset.armed;
          reset.textContent = 'Spielstand neu beginnen';
        }, 3500);
        return;
      }
      Object.keys(ctx.state).forEach((k) => delete ctx.state[k]);
      Object.assign(ctx.state, freshState());
      ctx.save();
      ctx.toast('Neuer Spielstand mit Beispiel-Inventar', '#d9b26a');
      ctx.rerender();
    });
  },
};
