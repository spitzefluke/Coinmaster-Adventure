// Wetter-Fenster: aktuelles Wetter mit Countdown, Vorhersage der nächsten Phasen und alle Mutationen.

import { WEATHER, WEATHER_MS, weatherAt, forecast, mutationForWeather, fmtMultiplier } from '../../../muenzen/js/mutations.js';
import { effect } from '../state.js';
import { icon } from '../icons.js';

const hhmm = (t) => new Date(t).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
const mmss = (ms) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
const total = WEATHER.reduce((a, w) => a + w.weight, 0);

export const wetterPanel = {
  id: 'wetter',
  title: 'Wetter',
  icon: 'cloud',
  tabs: [
    { id: 'vorhersage', label: 'Vorhersage' },
    { id: 'alle', label: 'Alle Wetter' },
  ],
  sub: () => {
    const { w, ends } = weatherAt();
    return `${w.name} · wechselt in ${mmss(ends - Date.now())}`;
  },
  tools: (ctx) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn tool-btn';
    b.textContent = 'Test: Wetter wechseln';
    b.title = 'Nur in der Vorschau: ein zufälliges Wetter für eine Minute';
    b.addEventListener('click', () => {
      const list = WEATHER.filter((w) => w.id !== 'klar');
      ctx.testWeather(list[Math.floor(Math.random() * list.length)].id);
    });
    return [b];
  },
  render(body, ctx, tab) {
    const bonus = effect(ctx.state, 'wetter');
    if (tab === 'alle') {
      body.innerHTML = `
        ${bonus ? `<p class="notice">${icon('cloud', 18)} Wettergespür: +${bonus} Prozentpunkte auf jede Mutation.</p>` : ''}
        <ul class="wx-grid">${WEATHER.map((w) => {
          const m = mutationForWeather(w.id);
          return `<li class="wx-card" style="--weather:${w.color}">
            <p class="wx-name">${w.name}</p>
            <p class="wx-share">${Math.round((w.weight / total) * 100)} % der Zeit</p>
            <p class="wx-text">${w.text}</p>
            ${m ? `<p class="wx-mut"><strong>${m.name}</strong> · ${m.chance + bonus} % · ${fmtMultiplier(m)}</p><p class="wx-fx">${m.effect}</p>` : '<p class="wx-mut">Keine Mutation</p>'}
          </li>`;
        }).join('')}</ul>
        <p class="muted">Das Wetter wechselt alle ${WEATHER_MS / 60000} Minuten und ist für alle Spieler gleich. <a href="../wetter/">Zur Wetter-Seite mit 3D-Vorschau</a></p>`;
      return;
    }
    const list = forecast(9);
    body.innerHTML = `
      <ol class="wx-forecast">${list
        .map(({ w, starts, ends }, i) => {
          const m = mutationForWeather(w.id);
          return `<li class="${i === 0 ? 'is-now' : ''}" style="--weather:${w.color}">
            <span class="wx-time">${i === 0 ? `noch ${mmss(ends - Date.now())}` : hhmm(starts)}</span>
            <span class="wx-dot"></span>
            <span class="wx-label"><strong>${w.name}</strong>${m ? ` · ${m.name} ${m.chance + bonus} % (${fmtMultiplier(m)})` : ''}</span>
          </li>`;
        })
        .join('')}</ol>
      <p class="muted">Die Vorhersage ist sicher: Das Wetter ergibt sich aus der Uhrzeit. Seltene Wetter wie Goldregen und Sternschnuppen lohnen sich besonders. <a href="../wetter/">Zur Wetter-Seite</a></p>`;
  },
};
