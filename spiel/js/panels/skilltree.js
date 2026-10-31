// Skilltree-Fenster: Baum als SVG links, Details zum gewählten Skill rechts.

import { BRANCHES, SKILLS, skillById, branchById } from '../skills.js';
import { skillLevel, canLearn, freePoints, spentPoints } from '../state.js';
import { icon } from '../icons.js';

const U = 120; // Abstand zweier Rasterpunkte in px
const R = 30; // Radius eines Knotens

let selected = 'kern';

const pos = (k) => [k.x * U, k.y * U];
const colorOf = (k) => (k.branch ? branchById[k.branch].color : '#d9b26a');

// Icon als eingebettetes SVG an Position x, y
const iconAt = (name, x, y, size) =>
  icon(name, size).replace('<svg class="ico"', `<svg class="ico" x="${x - size / 2}" y="${y - size / 2}"`);

function treeSvg(state) {
  const xs = SKILLS.map((k) => k.x * U), ys = SKILLS.map((k) => k.y * U);
  // Platz für Ast-Namen: seitlich halbe Textbreite, oben/unten eine Zeile
  const minX = Math.min(...xs) - R - 70, maxX = Math.max(...xs) + R + 70;
  const minY = Math.min(...ys) - R - 50, maxY = Math.max(...ys) + R + 62;

  const lines = SKILLS.filter((k) => k.req)
    .map((k) => {
      const [x1, y1] = pos(skillById[k.req]);
      const [x2, y2] = pos(k);
      const on = skillLevel(state, k.id) > 0;
      const open = skillLevel(state, k.req) > 0;
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="edge${on ? ' is-on' : open ? ' is-open' : ''}" style="--c:${colorOf(k)}"/>`;
    })
    .join('');

  // Ast-Beschriftung an der Spitze jedes Astes
  const labels = BRANCHES.map((b) => {
    const tip = SKILLS.filter((k) => k.branch === b.id).reduce((far, k) => (Math.hypot(k.x, k.y) > Math.hypot(far.x, far.y) ? k : far));
    const [x, y] = pos(tip);
    // über der Spitze, beim unteren Ast darunter
    const ly = tip.y > 0 ? y + R + 50 : y - R - 18;
    return `<text x="${x}" y="${ly}" text-anchor="middle" class="branch-label" style="fill:${b.color}">${b.name}</text>`;
  }).join('');

  const nodes = SKILLS.map((k) => {
    const [x, y] = pos(k);
    const lvl = skillLevel(state, k.id);
    const why = canLearn(state, k.id);
    const status = lvl >= k.max ? 'is-max' : lvl > 0 ? 'is-some' : k.req && skillLevel(state, k.req) < 1 ? 'is-locked' : 'is-open';
    const learnable = !why ? ' is-learnable' : '';
    const circ = 2 * Math.PI * (R + 5);
    const prog = (lvl / k.max) * circ;
    return `<g class="node ${status}${learnable}${k.id === selected ? ' is-selected' : ''}" data-id="${k.id}" tabindex="0" role="button"
        aria-label="${k.name}, Stufe ${lvl} von ${k.max}${why ? '' : ', lernbar'}" style="--c:${colorOf(k)}" transform="translate(${x} ${y})">
      <circle class="node-glow" r="${R + 12}"/>
      <circle class="node-track" r="${R + 5}"/>
      <circle class="node-prog" r="${R + 5}" stroke-dasharray="${prog} ${circ}" transform="rotate(-90)"/>
      <circle class="node-core" r="${R}"/>
      ${iconAt(lvl === 0 && status === 'is-locked' ? 'lock' : k.icon, 0, 0, 26)}
      <text class="node-level" y="${R + 22}">${lvl}/${k.max}</text>
    </g>`;
  }).join('');

  return `<svg class="tree-svg" viewBox="${minX} ${minY} ${maxX - minX} ${maxY - minY}" role="group" aria-label="Skilltree">${lines}${labels}${nodes}</svg>`;
}

function detailsHtml(state) {
  const k = skillById[selected];
  const lvl = skillLevel(state, k.id);
  const why = canLearn(state, k.id);
  const branch = k.branch ? branchById[k.branch] : null;
  const now = lvl > 0 ? k.format(lvl * k.per) : 'Noch nicht gelernt';
  const next = lvl < k.max ? k.format((lvl + 1) * k.per) : null;
  const pips = Array.from({ length: k.max }, (_, i) => `<i class="${i < lvl ? 'is-on' : ''}"></i>`).join('');
  return `
    <p class="skill-branch" style="color:${branch?.color || '#d9b26a'}">${branch ? branch.name : 'Kern'}</p>
    <h3 class="skill-name">${k.name}</h3>
    <p class="skill-text">${k.text}</p>
    <div class="skill-pips" style="--c:${branch?.color || '#d9b26a'}" aria-label="Stufe ${lvl} von ${k.max}">${pips}</div>
    <dl class="skill-facts">
      <div><dt>Jetzt</dt><dd>${now}</dd></div>
      ${next ? `<div><dt>Nächste Stufe</dt><dd>${next}</dd></div>` : ''}
      ${k.cost ? `<div><dt>Kosten</dt><dd>${k.cost} Skillpunkt${k.cost > 1 ? 'e' : ''} pro Stufe</dd></div>` : ''}
      ${k.req ? `<div><dt>Braucht</dt><dd>${skillById[k.req].name}</dd></div>` : ''}
    </dl>
    ${k.cost ? `<button class="btn btn-primary learn-btn" type="button" ${why ? 'disabled' : ''}>${why || `Lernen · ${k.cost} Punkt${k.cost > 1 ? 'e' : ''}`}</button>` : ''}`;
}

export const skillPanel = {
  id: 'skills',
  title: 'Skilltree',
  icon: 'tree',
  sub: (ctx) => `${freePoints(ctx.state)} Skillpunkte frei · Level ${ctx.state.level}`,
  tools: (ctx) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn tool-btn';
    b.textContent = 'Zurücksetzen';
    b.disabled = spentPoints(ctx.state) === 0;
    b.title = 'Alle Skillpunkte zurückbekommen';
    b.addEventListener('click', () => {
      if (b.dataset.armed) {
        ctx.state.skills = { kern: 1 };
        ctx.save();
        ctx.toast('Alle Skillpunkte zurückerstattet', '#d9b26a');
        ctx.rerender();
        return;
      }
      b.dataset.armed = '1';
      b.textContent = 'Wirklich? Nochmal klicken';
      setTimeout(() => {
        delete b.dataset.armed;
        b.textContent = 'Zurücksetzen';
      }, 3000);
    });
    return [b];
  },
  render(body, ctx) {
    const old = body.querySelector('.tree-wrap');
    const keep = old ? [old.scrollLeft, old.scrollTop] : null;
    body.innerHTML = `
      <div class="skilltree">
        <div class="tree-wrap">${treeSvg(ctx.state)}</div>
        <aside class="skill-details" aria-live="polite">${detailsHtml(ctx.state)}</aside>
      </div>
      <ul class="branch-legend">${BRANCHES.map((b) => `<li style="--c:${b.color}"><strong>${b.name}</strong> ${b.text}</li>`).join('')}</ul>`;
    const wrap = body.querySelector('.tree-wrap');
    if (keep) [wrap.scrollLeft, wrap.scrollTop] = keep;
    else {
      // Kern in die Mitte rücken (wichtig, wenn der Baum auf schmalen Bildschirmen scrollt)
      const svg = wrap.querySelector('svg'), vb = svg.viewBox.baseVal;
      const scale = svg.clientWidth / vb.width;
      wrap.scrollLeft = -vb.x * scale - wrap.clientWidth / 2;
      wrap.scrollTop = -vb.y * scale - wrap.clientHeight / 2;
    }
    const pick = (id) => {
      selected = id;
      ctx.rerender();
      body.querySelector(`.node[data-id="${id}"]`)?.focus({ preventScroll: true });
    };
    body.querySelectorAll('.node').forEach((n) => {
      n.addEventListener('click', () => pick(n.dataset.id));
      n.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (selected === n.dataset.id && !canLearn(ctx.state, selected)) learn();
          else pick(n.dataset.id);
        }
      });
    });
    const learn = () => {
      if (canLearn(ctx.state, selected)) return;
      const k = skillById[selected];
      ctx.state.skills[k.id] = skillLevel(ctx.state, k.id) + 1;
      ctx.save();
      ctx.sound(1.2);
      ctx.toast(`${k.name} auf Stufe ${ctx.state.skills[k.id]}`, k.branch ? branchById[k.branch].color : '#d9b26a');
      ctx.rerender();
      body.querySelector(`.node[data-id="${k.id}"]`)?.classList.add('just-learned');
    };
    body.querySelector('.learn-btn')?.addEventListener('click', learn);
  },
};
