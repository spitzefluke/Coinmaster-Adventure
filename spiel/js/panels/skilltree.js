// Skilltree-Fenster: Baum als SVG links, Details zum gewählten Skill rechts.
// Der Baum lässt sich zoomen (Knöpfe, Mausrad, zwei Finger) und verschieben (ziehen).
// Sichtbar sind nur Skills, die man schon hat oder deren Vorgänger gelernt ist – der Rest
// bleibt verborgen, bis man dorthin vorgedrungen ist.

import { BRANCHES, SKILLS, skillById, branchById } from '../skills.js';
import { skillLevel, canLearn, freePoints, spentPoints } from '../state.js';
import { icon } from '../icons.js';

const U = 120; // Abstand zweier Rasterpunkte in px
const R = 30; // Radius eines Knotens

const ZMIN = 0.6, ZMAX = 3;

let selected = 'kern';
let zoom = 1;
let ro = null; // passt die Fläche an, wenn sich die Fenstergröße ändert
let seen = null; // beim letzten Zeichnen sichtbare Skills, für die Aufdeck-Animation

const pos = (k) => [k.x * U, k.y * U];
const colorOf = (k) => (k.branch ? branchById[k.branch].color : '#d9b26a');

// Sichtbar: gelernt, Kern oder Vorgänger gelernt
export const isVisible = (state, k) => !k.req || skillLevel(state, k.id) > 0 || skillLevel(state, k.req) > 0;

// Icon als eingebettetes SVG an Position x, y
const iconAt = (name, x, y, size) =>
  icon(name, size).replace('<svg class="ico"', `<svg class="ico" x="${x - size / 2}" y="${y - size / 2}"`);

function treeSvg(state) {
  const vis = SKILLS.filter((k) => isVisible(state, k));
  const fresh = seen ? vis.filter((k) => !seen.has(k.id)).map((k) => k.id) : [];
  seen = new Set(vis.map((k) => k.id));
  // Rahmen um den sichtbaren Teil: Der Baum wächst mit, je weiter man vordringt.
  // Seitlich mehr Platz für die Ast-Namen.
  const xs = vis.map((k) => k.x * U), ys = vis.map((k) => k.y * U);
  const minX = Math.min(...xs) - R - 190, maxX = Math.max(...xs) + R + 190;
  const minY = Math.min(...ys) - R - 60, maxY = Math.max(...ys) + R + 70;

  const lines = vis.filter((k) => k.req)
    .map((k) => {
      const [x1, y1] = pos(skillById[k.req]);
      const [x2, y2] = pos(k);
      const on = skillLevel(state, k.id) > 0;
      const open = skillLevel(state, k.req) > 0;
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="edge${on ? ' is-on' : open ? ' is-open' : ''}${fresh.includes(k.id) ? ' just-revealed' : ''}" style="--c:${colorOf(k)}"/>`;
    })
    .join('');

  // Ast-Namen wandern mit der Spitze des sichtbaren Astes nach außen
  const labels = BRANCHES.map((b) => {
    // Richtung des Astes (vom Kern zum ersten Skill) und dessen äußerste sichtbare Skills
    const first = SKILLS.find((k) => k.branch === b.id && k.req === 'kern');
    const dx = Math.sign(first.x), dy = Math.sign(first.y);
    const mine = vis.filter((k) => k.branch === b.id);
    const far = Math.max(...mine.map((k) => k.x * dx + k.y * dy));
    const tips = mine.filter((k) => k.x * dx + k.y * dy > far - 0.01);
    const along = far * U, across = (tips.reduce((s, k) => s + (dx ? k.y : k.x), 0) / tips.length) * U;
    // Name außen hinter die Spitze setzen
    const [x, y, anchor] = dx
      ? [along * dx + (R + 16) * dx, across + 7, dx > 0 ? 'start' : 'end']
      : [across, along * dy + (dy < 0 ? -R - 18 : R + 46), 'middle'];
    return `<text x="${x}" y="${y}" text-anchor="${anchor}" class="branch-label" style="fill:${b.color}">${b.name}</text>`;
  }).join('');

  const nodes = vis.map((k) => {
    const [x, y] = pos(k);
    const lvl = skillLevel(state, k.id);
    const why = canLearn(state, k.id);
    const status = lvl >= k.max ? 'is-max' : lvl > 0 ? 'is-some' : k.req && skillLevel(state, k.req) < 1 ? 'is-locked' : 'is-open';
    const learnable = !why ? ' is-learnable' : '';
    const circ = 2 * Math.PI * (R + 5);
    const prog = (lvl / k.max) * circ;
    return `<g class="node ${status}${learnable}${k.id === selected ? ' is-selected' : ''}${fresh.includes(k.id) ? ' just-revealed' : ''}" data-id="${k.id}" tabindex="0" role="button"
        aria-label="${k.name}, Stufe ${lvl} von ${k.max}${why ? '' : ', lernbar'}" style="--c:${colorOf(k)}" transform="translate(${x} ${y})">
      <circle class="node-glow" r="${R + 12}"/>
      <circle class="node-track" r="${R + 5}"/>
      <circle class="node-prog" r="${R + 5}" stroke-dasharray="${prog} ${circ}" transform="rotate(-90)"/>
      <circle class="node-core" r="${R}"/>
      ${iconAt(lvl === 0 && status === 'is-locked' ? 'lock' : k.icon, 0, 0, 26)}
      <text class="node-level" y="${R + 22}">${lvl}/${k.max}</text>
    </g>`;
  }).join('');

  return `<svg class="tree-svg" preserveAspectRatio="xMidYMid meet" viewBox="${minX} ${minY} ${maxX - minX} ${maxY - minY}" role="group" aria-label="Skilltree">${lines}${labels}${nodes}</svg>`;
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
    if (!old) seen = null; // Fenster neu geöffnet: nichts als „neu aufgedeckt“ markieren
    // Nach einem Zurücksetzen kann der gewählte Skill wieder verborgen sein
    if (!isVisible(ctx.state, skillById[selected])) selected = 'kern';
    const hidden = SKILLS.filter((k) => !isVisible(ctx.state, k)).length;
    body.innerHTML = `
      <div class="skilltree">
        <div class="tree-box">
          <div class="tree-wrap">${treeSvg(ctx.state)}</div>
          <div class="zoom-ctl" role="group" aria-label="Zoom">
            <button type="button" data-zoom="in" aria-label="Heranzoomen" title="Heranzoomen">+</button>
            <output class="zoom-val" aria-live="polite"></output>
            <button type="button" data-zoom="out" aria-label="Herauszoomen" title="Herauszoomen">−</button>
            <button type="button" data-zoom="fit" aria-label="Ganzen Baum zeigen" title="Ganzen Baum zeigen">⤢</button>
          </div>
          ${hidden ? `<p class="fog-note">${icon('lock', 14)} ${hidden} Skill${hidden > 1 ? 's' : ''} noch verborgen</p>` : ''}
        </div>
        <aside class="skill-details" aria-live="polite">${detailsHtml(ctx.state)}</aside>
      </div>
      <ul class="branch-legend">${BRANCHES.map((b) => `<li style="--c:${b.color}"><strong>${b.name}</strong> ${b.text}</li>`).join('')}</ul>`;
    const wrap = body.querySelector('.tree-wrap');
    const svg = wrap.querySelector('svg');
    const zoomVal = body.querySelector('.zoom-val');

    // Zoom: Die SVG-Fläche wird größer als das Fenster, das Fenster scrollt.
    // (cx, cy) ist der Punkt im Fenster, der beim Zoomen an seiner Stelle bleibt.
    const applyZoom = (z, cx = wrap.clientWidth / 2, cy = wrap.clientHeight / 2) => {
      z = Math.min(ZMAX, Math.max(ZMIN, z));
      const ratio = z / zoom;
      const sx = wrap.scrollLeft, sy = wrap.scrollTop;
      zoom = z;
      svg.style.width = `${wrap.clientWidth * z}px`;
      svg.style.height = `${wrap.clientHeight * z}px`;
      wrap.scrollLeft = (sx + cx) * ratio - cx;
      wrap.scrollTop = (sy + cy) * ratio - cy;
      zoomVal.textContent = `${Math.round(z * 100)} %`;
      body.querySelector('[data-zoom="in"]').disabled = z >= ZMAX;
      body.querySelector('[data-zoom="out"]').disabled = z <= ZMIN;
    };
    const z0 = zoom;
    zoom = 1;
    applyZoom(z0);
    if (keep) [wrap.scrollLeft, wrap.scrollTop] = keep;
    else {
      // Kern in die Mitte rücken
      const vb = svg.viewBox.baseVal;
      const scale = Math.min(svg.clientWidth / vb.width, svg.clientHeight / vb.height);
      wrap.scrollLeft = svg.clientWidth / 2 - (vb.x + vb.width / 2) * scale - wrap.clientWidth / 2;
      wrap.scrollTop = svg.clientHeight / 2 - (vb.y + vb.height / 2) * scale - wrap.clientHeight / 2;
    }

    ro?.disconnect();
    let lastW = wrap.clientWidth, lastH = wrap.clientHeight;
    ro = new ResizeObserver(() => {
      if (!wrap.isConnected) return ro.disconnect();
      if (wrap.clientWidth === lastW && wrap.clientHeight === lastH) return;
      lastW = wrap.clientWidth;
      lastH = wrap.clientHeight;
      applyZoom(zoom);
    });
    ro.observe(wrap);

    // Tasten + und − zoomen, 0 zeigt den ganzen Baum
    wrap.addEventListener('keydown', (e) => {
      const b = { '+': 'in', '=': 'in', '-': 'out', '0': 'fit' }[e.key];
      if (!b) return;
      e.preventDefault();
      body.querySelector(`[data-zoom="${b}"]`).click();
    });

    body.querySelectorAll('[data-zoom]').forEach((b) =>
      b.addEventListener('click', () => {
        const how = b.dataset.zoom;
        if (how === 'fit') {
          applyZoom(1);
          wrap.scrollLeft = wrap.scrollTop = 0;
        } else applyZoom(zoom * (how === 'in' ? 1.25 : 0.8));
      }),
    );

    // Mausrad zoomt um den Mauszeiger
    wrap.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        const r = wrap.getBoundingClientRect();
        const step = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
        applyZoom(zoom * Math.exp(-step * 0.0015), e.clientX - r.left, e.clientY - r.top);
      },
      { passive: false },
    );

    // Ziehen verschiebt, zwei Finger zoomen
    const pts = new Map();
    let drag = null, pinch = null, moved = false;
    wrap.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      moved = false;
      if (pts.size === 1) drag = { x: e.clientX, y: e.clientY, sl: wrap.scrollLeft, st: wrap.scrollTop, id: e.pointerId };
      if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: zoom };
        drag = null;
      }
    });
    wrap.addEventListener('pointermove', (e) => {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch && pts.size === 2) {
        const [a, b] = [...pts.values()];
        const r = wrap.getBoundingClientRect();
        applyZoom(pinch.z * (Math.hypot(a.x - b.x, a.y - b.y) / pinch.d), (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top);
        moved = true;
      } else if (drag && drag.id === e.pointerId) {
        const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        if (!moved && Math.hypot(dx, dy) < 5) return;
        if (!moved) {
          moved = true;
          wrap.setPointerCapture(e.pointerId);
          wrap.classList.add('is-dragging');
        }
        wrap.scrollLeft = drag.sl - dx;
        wrap.scrollTop = drag.st - dy;
      }
    });
    const up = (e) => {
      pts.delete(e.pointerId);
      if (pts.size < 2) pinch = null;
      if (!pts.size) {
        drag = null;
        wrap.classList.remove('is-dragging');
      }
    };
    wrap.addEventListener('pointerup', up);
    wrap.addEventListener('pointercancel', up);
    // Nach dem Ziehen keinen Klick auf einen Knoten auslösen
    wrap.addEventListener('click', (e) => moved && (e.stopPropagation(), (moved = false)), true);

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
