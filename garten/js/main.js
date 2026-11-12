import { FRUIT_XP } from '../../haustiere/js/pets.js';
// Münzbaumgarten: Garten kaufen, Beete, Samen säen, Gießen, Düngen, Ernten. Wachsende Bäume zeigen einen Timer.
// Geerntet werden Früchte: Sie liegen im Inventar, sind Futter für die Haustiere (Pet-EP) oder werden zu Samen gezogen.
// Der Garten in 3D ist GardenBuilder aus dem Installer (1:1 wie in Roblox), die Regeln stehen in
// garden.js (wie GardenData). Moneten und Inventar teilt sich die Seite mit den Münzrollen.

import * as THREE from 'three';
import {
  TREES, LOOT, GARDEN, lootById, fenceById, rarityById, stage, ripe, grownAt, boostMult, harvestFruits, harvestsLeft,
  loadState, saveState, freshState, now, setSpeed, fmt, fmtTime, lootName, phaseOf, progressOf, PHASE_NAME,
  marketMult, fruitPrice, marketLeft, seedCost, fruitLabel, treeName,
} from './garden.js';
import { createRobloxGarden, rollLua } from '../../rollen/js/rollRoblox.js';
import { rbxRenderer } from '../../muenzen/js/coinRoblox.js';
import { orbitEgg } from '../../eier/js/eggRoblox.js';

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let state = loadState();
// Tageszeit im 3D-Garten: 'tag', 'nacht' oder 'echt' (Uhrzeit dieses Geräts); nur eine Vorliebe dieses Browsers
let daytime = 'tag';
try {
  daytime = localStorage.getItem('coinmaster.garten.tageszeit') || 'tag';
} catch {}
const targetHour = () => (daytime === 'nacht' ? 23 : daytime === 'echt' ? new Date().getHours() + new Date().getMinutes() / 60 : 13);
let clockHour = targetHour();
let selected = null; // Id einer Sache aus dem Inventar, die man gerade auf ein Beet anwenden will

const $ = (id) => document.getElementById(id);
const ICON = { bush: '🌿', round: '🌳', oval: '🌳', cone: '🌲', spruce: '🌲', oak: '🌳', maple: '🍁', blossom: '🌸', weeping: '🌳', palm: '🌴', star: '🌌', mushroom: '🍄', cloud: '☁️', crystal: '💎', planet: '🪐', angel: '😇', rainbow: '🌈', can: '💧', sack: '🌱', bag: '💰', spade: '⚒️', chest: '💎' };
const FRUIT_ICON = { apple: '🍎', pear: '🍐', berry: '🫐', cone: '🌰', acorn: '🌰', cherry: '🍒', drop: '💧', dragon: '🐉', star: '⭐', moon: '🌕' };
const fruitIcon = (tree) => FRUIT_ICON[tree.fruitShape] || '🍎';
const icon = (item) => ICON[item.crown || item.model] || '🌳';

function save() {
  saveState(state);
  render();
}
function hint(html) {
  $('hint').innerHTML = html;
}

// ── Aktionen ─────────────────────────────────────────────────────────────────

function take(id) {
  state.inv[id]--;
  if (state.inv[id] <= 0) {
    delete state.inv[id];
    if (selected === id) selected = null;
  }
}

function buyGarden() {
  if (state.owned || state.taler < GARDEN.price) return;
  state.taler -= GARDEN.price;
  state.owned = true;
  state.beds = GARDEN.startBeds;
  state.plots = [];
  hint('Der Garten gehört dir! Öffne <a href="../rollen/">Münzrollen</a>, um Bäume zu bekommen.');
  save();
}

function buyBed() {
  const price = GARDEN.bedPrice(state.beds);
  if (!state.owned || state.beds >= GARDEN.maxBeds || state.taler < price) return;
  state.taler -= price;
  state.beds++;
  hint(`Beet ${state.beds} ist umgegraben.`);
  save();
}

function useItem(id) {
  const item = lootById[id] || fenceById[id];
  // Zaun: anbringen (bleibt im Inventar, der Holzzaun ist immer da)
  if (item.type === 'fence' || item.standard) {
    if (!state.owned) return hint('Kauf zuerst den Garten.');
    state.fence = id;
    hint(`<strong>${item.name}</strong> angebracht.`);
    return save();
  }
  if (item.kind === 'taler') {
    state.taler += item.amount;
    take(id);
    hint(`<strong>+${fmt(item.amount)} Moneten</strong> aus dem ${item.name}.`);
    return save();
  }
  if (item.kind === 'bed') {
    if (!state.owned || state.beds >= GARDEN.maxBeds) return hint(state.owned ? 'Der Garten ist schon so groß wie möglich.' : 'Kauf zuerst den Garten.');
    state.beds++;
    take(id);
    hint(`Der ${item.name} gräbt Beet ${state.beds}.`);
    return save();
  }
  selected = selected === id ? null : id;
  hint(selected ? `<strong>${lootName(item)}</strong> ausgewählt. Tippe bei einem Beet auf „${actionName(item)}“.` : '');
  render();
}

const actionName = (item) => (item.type === 'tree' ? 'Säen' : item.kind === 'water' ? 'Gießen' : 'Düngen');

// Kann die ausgewählte Sache auf Beet i benutzt werden?
function canApply(i, t) {
  if (!selected || !state.owned) return false;
  const item = lootById[selected];
  const plot = state.plots[i];
  if (item.type === 'tree') return !plot;
  if (!plot) return false;
  if (item.kind === 'water') return stage(plot, t) < 3;
  if (item.kind === 'boost') return true;
  return false;
}

function apply(i) {
  const t = now(state);
  if (!canApply(i, t)) return;
  const item = lootById[selected];
  if (item.type === 'tree') {
    const golden = Math.random() < GARDEN.goldenChance;
    state.plots[i] = { tree: item.id, planted: t, bonus: 0, harvested: 0, boost: 1, boostEnd: 0, golden };
    hint(golden
      ? `✨ <strong>${lootName(item)}</strong> in Beet ${i + 1} gesät: Es wächst ein <strong>${treeName(item, true)}</strong> mit doppelter Ernte!`
      : `${lootName(item)} in Beet ${i + 1} gesät. Der Timer zeigt, wann der Baum ausgewachsen ist.`);
  } else if (item.kind === 'water') {
    const plot = state.plots[i];
    const left = grownAt(plot) - t;
    plot.bonus += Math.min(item.seconds, left);
    hint(`Beet ${i + 1} gegossen${item.seconds >= left ? ': ausgewachsen!' : ` (${fmtTime(item.seconds)} schneller).`}`);
  } else if (item.kind === 'boost') {
    const plot = state.plots[i];
    plot.boost = item.mult;
    plot.boostEnd = t + item.seconds;
    hint(`Beet ${i + 1} gedüngt: ×${item.mult} Ernte für ${fmtTime(item.seconds)}.`);
  }
  take(item.id);
  save();
}

// Ernten zählen mit: ist die Grenze des Baums erreicht, ist er abgeerntet und das Beet wird frei.
// Die Früchte kommen in den Fruchtkorb (state.fruits).
const gone = [];
function harvest(i, quiet, got = {}) {
  const t = now(state);
  const plot = state.plots[i];
  const n = plot ? ripe(plot, t) : 0;
  if (!n) return got;
  const fruits = harvestFruits(plot, t);
  state.fruits[plot.tree] = (state.fruits[plot.tree] || 0) + fruits;
  got[plot.tree] = (got[plot.tree] || 0) + fruits;
  plot.harvested = t;
  plot.count = (plot.count || 0) + n;
  const tree = lootById[plot.tree];
  const done = plot.count >= tree.harvests;
  if (done) {
    state.plots[i] = null;
    gone.push(tree.name);
  }
  if (!quiet) {
    hint(`<strong>+${fruitLabel(tree, fruits)}</strong> aus Beet ${i + 1} in den Fruchtkorb.${done ? ` Der ${tree.name} ist abgeerntet, das Beet ist frei.` : ''}`);
    gone.length = 0;
    save();
  }
  return got;
}
const gotText = (got) => Object.entries(got).map(([id, n]) => '+' + fruitLabel(lootById[id], n)).join(', ');

function harvestAll() {
  const got = {};
  for (let i = 0; i < state.beds; i++) harvest(i, true, got);
  hint(Object.keys(got).length ? `<strong>${gotText(got)}</strong> in den Fruchtkorb.${gone.length ? ` Abgeerntet: ${gone.join(', ')}.` : ''}` : 'Noch nichts reif.');
  gone.length = 0;
  save();
}

function dig(i) {
  const plot = state.plots[i];
  if (!plot) return;
  const t = now(state);
  const got = harvest(i, true);
  gone.length = 0;
  const tree = lootById[plot.tree];
  // nur ein noch nicht ausgewachsener Baum gibt seine Samen zurück (sonst ließe sich die Erntegrenze umgehen)
  const back = stage(plot, t) < 3;
  if (back) state.inv[plot.tree] = (state.inv[plot.tree] || 0) + 1;
  state.plots[i] = null;
  const extra = Object.keys(got).length ? ` ${gotText(got)} in den Fruchtkorb.` : '';
  hint((back ? `${tree.name} ausgegraben, die ${lootName(tree)} liegen wieder im Inventar.` : `${tree.name} ausgerissen, das Beet ist frei.`) + extra);
  save();
}

// Marktstand: Früchte zum Preis von jetzt verkaufen (id oder 'all')
function sell(id) {
  // Früchte kann man nicht mehr verkaufen: Sie sind Futter für die Haustiere
  if (id) return hint('Früchte kann man nicht verkaufen. Im Spiel fütterst du damit deine Haustiere (Inventar › Haustiere).');
  const t = now(state);
  let total = 0;
  let count = 0;
  for (const k of Object.keys(state.fruits)) {
    if (id !== 'all' && k !== id) continue;
    total += state.fruits[k] * fruitPrice(k, t);
    count += state.fruits[k];
    delete state.fruits[k];
  }
  if (!count) return;
  state.taler += total;
  hint(`${id === 'all' ? `${fmt(count)} Früchte` : fruitLabel(lootById[id], count)} verkauft: <strong>+${fmt(total)} Moneten</strong>.`);
  save();
}

// Samen ziehen: seedCost Früchte gegen einen Samen desselben Baums
function seed(id) {
  const tree = lootById[id];
  const cost = seedCost(tree);
  if ((state.fruits[id] || 0) < cost) return;
  state.fruits[id] -= cost;
  if (state.fruits[id] <= 0) delete state.fruits[id];
  state.inv[id] = (state.inv[id] || 0) + 1;
  hint(`${fruitLabel(tree, cost)} eingetauscht: <strong>1 ${lootName(tree)}</strong>. Liegt im Inventar.`);
  save();
}

// ── Anzeige ──────────────────────────────────────────────────────────────────

function renderBar() {
  $('taler').textContent = fmt(state.taler);
  for (const b of document.querySelectorAll('[data-speed]')) b.setAttribute('aria-pressed', String(Number(b.dataset.speed) === state.clock.speed));
  for (const b of document.querySelectorAll('[data-daytime]')) b.setAttribute('aria-pressed', String(b.dataset.daytime === daytime));
  const buy = $('buy');
  buy.hidden = state.owned;
  $('buy-text').textContent = `${GARDEN.startBeds} Beete, umzäunt, mit Tor und Schild. Später auf bis zu ${GARDEN.maxBeds} Beete erweiterbar.`;
  const bb = $('buy-btn');
  bb.textContent = state.taler >= GARDEN.price ? `Kaufen für ${fmt(GARDEN.price)} Moneten` : `Zu wenig Moneten (${fmt(GARDEN.price)})`;
  bb.disabled = state.taler < GARDEN.price;
  const bed = $('buy-bed');
  bed.hidden = !state.owned;
  const price = GARDEN.bedPrice(state.beds);
  bed.textContent = state.beds >= GARDEN.maxBeds ? 'Alle Beete gekauft' : `Beet kaufen · ${fmt(price)} Moneten`;
  bed.disabled = state.beds >= GARDEN.maxBeds || state.taler < price;
  $('harvest-all').hidden = !state.owned;
}

// Jedes Beet wird nur neu gebaut, wenn sich etwas Grundlegendes ändert (Baum, Stufe, Ernten,
// Auswahl). Countdown und Balken laufen über data-live-Felder, damit die Knöpfe stehen bleiben.
let bedsOwned = null;
function renderBeds(t) {
  const el = $('beds');
  if (!state.owned) {
    if (bedsOwned !== false) el.innerHTML = '<p class="bed-empty">Noch kein Garten. Kauf ihn oben für Moneten.</p>';
    bedsOwned = false;
    return;
  }
  if (bedsOwned !== true) el.innerHTML = '';
  bedsOwned = true;
  while (el.children.length > state.beds) el.lastElementChild.remove();
  for (let i = 0; i < state.beds; i++) {
    const { key, html } = bedHtml(i, t);
    let card = el.children[i];
    if (!card) {
      card = document.createElement('article');
      el.append(card);
    }
    if (card.dataset.key !== key) {
      card.dataset.key = key;
      const rr = state.plots[i] && rarityById[lootById[state.plots[i].tree].rarity];
      card.className = 'bed' + (canApply(i, t) ? ' is-target' : '') + (rr?.rainbow ? ' is-rainbow' : '');
      card.innerHTML = html;
      const plot = state.plots[i];
      card.style.setProperty('--t', plot ? rarityById[lootById[plot.tree].rarity].color : '');
    }
    updateLive(card, i, t);
  }
}

function bedHtml(i, t) {
  const plot = state.plots[i];
  const target = canApply(i, t);
  const sel = selected && lootById[selected];
  const applyBtn = target ? `<button class="btn gold small" data-apply="${i}">${actionName(sel)}: ${lootName(sel)}</button>` : '';
  if (!plot) {
    return {
      key: `leer|${target ? selected : ''}`,
      html: `<div class="bed-head"><span class="bed-no">Beet ${i + 1}</span></div>
        <p class="bed-empty">Leer. Säe Samen aus dem Inventar.</p>
        <div class="bed-actions">${applyBtn}</div>`,
    };
  }
  const tree = lootById[plot.tree];
  const st = stage(plot, t);
  const ph = phaseOf(progressOf(plot, t));
  const r = ripe(plot, t);
  const rar = rarityById[tree.rarity];
  const mult = boostMult(plot, t);
  const info =
    st < 3
      ? `<p class="bed-state">${PHASE_NAME[ph]} · ausgewachsen in <span data-live="grow"></span></p><div class="meter"><span data-live="meter"></span></div>`
      : `<p class="bed-state">Trägt ${tree.fruitPlural} · <span data-live="next"></span></p><div class="ripe" aria-label="${r} von ${GARDEN.maxRipe} Ernten reif">${Array.from({ length: GARDEN.maxRipe }, (_, k) => `<i class="${k < r ? 'on' : ''}"></i>`).join('')}</div>`;
  const left = harvestsLeft(plot);
  const harvestInfo = `<p class="bed-harvests${left <= 2 ? ' is-low' : ''}">Ernten übrig: <strong>${left}</strong> von ${tree.harvests}</p>`;
  const golden = plot.golden ? `<span class="badge gold-badge${rar.rainbow ? ' rainbow-fill' : ''}">✨ ${rar.rainbow ? 'Schillernd' : 'Golden'} · doppelte Ernte</span>` : '';
  return {
    key: `${plot.tree}|${plot.planted}|${ph}|${r}|${mult}|${plot.count || 0}|${target ? selected : ''}`,
    html: `<div class="bed-head"><span class="bed-no">Beet ${i + 1}</span><span class="bed-no${rar.rainbow ? ' rainbow-text' : ''}" style="color:${rar.color}">${rar.name}</span></div>
      <h3 class="bed-name">${treeName(tree, plot.golden)}</h3>
      ${golden}
      ${info}
      ${harvestInfo}
      ${mult > 1 ? `<span class="badge">Dünger ×${mult} · noch <span data-live="boost"></span></span>` : ''}
      <div class="bed-actions">
        ${r > 0 ? `<button class="btn gold small" data-harvest="${i}">Ernten · +${fruitLabel(tree, harvestFruits(plot, t))}</button>` : ''}
        ${applyBtn}
        <button class="btn ghost small" data-dig="${i}">Ausgraben</button>
      </div>`,
  };
}

function updateLive(card, i, t) {
  const plot = state.plots[i];
  if (!plot) return;
  const tree = lootById[plot.tree];
  const set = (name, fn) => {
    const e = card.querySelector(`[data-live="${name}"]`);
    if (e) fn(e);
  };
  set('grow', (e) => (e.textContent = fmtTime(grownAt(plot) - t)));
  set('meter', (e) => (e.style.width = (Math.min(1, (t - plot.planted + plot.bonus) / tree.grow) * 100).toFixed(1) + '%'));
  set('next', (e) => {
    const since = Math.max(grownAt(plot), plot.harvested);
    e.textContent = ripe(plot, t) >= GARDEN.maxRipe ? 'voll, bitte ernten' : `nächste Ernte in ${fmtTime(tree.cycle - ((t - since) % tree.cycle))}`;
  });
  set('boost', (e) => (e.textContent = fmtTime(plot.boostEnd - t)));
}

let invHtml = '';
function renderInv() {
  const el = $('inv');
  const set = (html) => {
    if (html !== invHtml) el.innerHTML = invHtml = html;
  };
  const ids = LOOT.map((l) => l.id).filter((id) => state.inv[id] > 0);
  // anderer Zaun angebracht: Holzzaun zum Zurückwechseln anbieten
  if (state.owned && state.fence && state.fence !== 'holzzaun') ids.unshift('holzzaun');
  if (!ids.length) {
    set('<p class="inv-empty">Leer. Öffne <a href="../rollen/">Münzrollen</a>, um Samen, Gießkannen und mehr zu bekommen.</p>');
    return;
  }
  set(ids
    .map((id) => {
      const item = lootById[id] || fenceById[id];
      const rar = rarityById[item.rarity];
      const isFence = item.type === 'fence' || item.standard;
      const fenceOn = isFence && (state.fence || 'holzzaun') === id;
      const direct = item.kind === 'taler' || item.kind === 'bed' || isFence;
      const label = isFence ? (fenceOn ? 'Angebracht' : 'Anbringen') : direct ? 'Benutzen' : selected === id ? 'Abwählen' : `Auswählen zum ${actionName(item)}`;
      const sub = item.type === 'tree' ? `Wächst in ${fmtTime(item.grow)} zum ${item.name}, dann alle ${fmtTime(item.cycle)} ${item.fruitName === item.fruitPlural ? 'ein' : 'eine'} ${item.fruitName}, ${item.harvests}× ernten` : item.text;
      const kind = item.type === 'tree' ? 'Samen' : isFence ? 'Zaun' : 'Werkzeug';
      const count = item.standard ? '' : `<small>×${state.inv[id]}</small>`;
      const usable = state.owned || item.kind === 'taler';
      return `<article class="item${selected === id || fenceOn ? ' is-selected' : ''}" style="--t:${rar.color}">
        <span class="item-icon" aria-hidden="true">${item.type === 'tree' ? '🌱' : isFence ? '🏡' : icon(item)}</span>
        <p class="item-name">${lootName(item)}${count}</p>
        <p class="item-rar${rar.rainbow ? ' rainbow-text' : ''}">${rar.name} · ${kind}</p>
        <p class="item-text">${sub}</p>
        <button class="btn small${direct || selected === id ? '' : ' gold'}${isFence && !fenceOn ? ' gold' : ''}" data-use="${id}" ${usable && !fenceOn ? '' : 'disabled'}>${usable ? label : 'Erst Garten kaufen'}</button>
      </article>`;
    })
    .join(''));
}

// Früchte: Futter für die Haustiere (verkaufen geht nicht), daraus lassen sich Samen ziehen
let marketHtml = '';
function renderMarket(t) {
  const el = $('market');
  const ids = TREES.map((x) => x.id).filter((id) => state.fruits[id] > 0);
  $('market-left').textContent = fmtTime(marketLeft(t));
  $('sell-all').hidden = true;
  const html = !ids.length
    ? '<p class="inv-empty">Noch keine Früchte. Ernte ausgewachsene Bäume, dann landen ihre Früchte hier und im Inventar.</p>'
    : ids.map((id) => {
        const tree = lootById[id];
        const rar = rarityById[tree.rarity];
        const n = state.fruits[id];
        const cost = seedCost(tree);
        return `<article class="item fruit" style="--t:${rar.color}">
          <span class="item-icon" aria-hidden="true">${fruitIcon(tree)}</span>
          <p class="item-name">${n === 1 ? tree.fruitName : tree.fruitPlural}<small>×${fmt(n)}</small></p>
          <p class="item-rar${rar.rainbow ? ' rainbow-text' : ''}">${rar.name} · vom ${tree.name}</p>
          <p class="item-text">Futter: +${FRUIT_XP[tree.rarity] || 1} Pet-EP je Stück</p>
          <div class="item-btns">
            <button class="btn small" data-seed="${id}" ${n >= cost ? '' : 'disabled'} title="${cost} Früchte ergeben einen Samen">Samen ziehen · ${cost} Stück</button>
          </div>
        </article>`;
      }).join('');
  if (html !== marketHtml) el.innerHTML = marketHtml = html;
}

function renderCatalog() {
  $('cat').innerHTML = TREES.map((t) => {
    const rar = rarityById[t.rarity];
    return `<tr><td>${icon(t)} ${t.name}</td><td style="--t:${rar.color}"><span class="dot${rar.rainbow ? ' rainbow-fill' : ''}"></span><span class="${rar.rainbow ? 'rainbow-text' : ''}">${rar.name}</span></td><td>${fmtTime(t.grow)}</td><td>alle ${fmtTime(t.cycle)}</td><td>${fruitIcon(t)} ${t.fruitName}</td><td>${fmt(t.yield)}</td><td>${t.harvests}×</td><td>${fmt(t.yield * t.harvests)}</td></tr>`;
  }).join('');
}

function render() {
  const t = now(state);
  renderBar();
  renderBeds(t);
  renderMarket(t);
  renderInv();
  update3d(t);
}

// ── Knöpfe ───────────────────────────────────────────────────────────────────

document.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.use) useItem(b.dataset.use);
  else if (b.dataset.apply) apply(Number(b.dataset.apply));
  else if (b.dataset.harvest) harvest(Number(b.dataset.harvest));
  else if (b.dataset.dig) dig(Number(b.dataset.dig));
  else if (b.dataset.sell) sell(b.dataset.sell);
  else if (b.dataset.seed) seed(b.dataset.seed);
  else if (b.dataset.daytime) {
    daytime = b.dataset.daytime;
    try {
      localStorage.setItem('coinmaster.garten.tageszeit', daytime);
    } catch {}
    renderBar();
  } else if (b.dataset.speed) {
    setSpeed(state, Number(b.dataset.speed));
    save();
  }
});
$('buy-btn').addEventListener('click', buyGarden);
$('buy-bed').addEventListener('click', buyBed);
$('harvest-all').addEventListener('click', harvestAll);
$('sell-all').addEventListener('click', () => sell('all'));
$('cheat').addEventListener('click', () => {
  state.taler += 100000;
  save();
});
$('reset').addEventListener('click', () => {
  if (!confirm('Garten, Inventar und Moneten der Vorschau zurücksetzen?')) return;
  state = freshState();
  selected = null;
  hint('');
  save();
});
// Änderungen aus der Rollen-Seite (anderer Tab) übernehmen
addEventListener('storage', () => {
  state = loadState();
  render();
});
addEventListener('pageshow', () => {
  state = loadState();
  render();
});

// ── 3D ───────────────────────────────────────────────────────────────────────

const canvas = $('garden-canvas');
const renderer = rbxRenderer(canvas, { shadows: true });
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const camera = new THREE.PerspectiveCamera(35, 16 / 9, 0.1, 800);
const baseExposure = renderer.toneMappingExposure;
let lua = null;
let garden = null, sig = '', building = false;
const cam = { angle: 0, tilt: 0.62, drag: null, zoom: 1 };

rollLua().then((l) => {
  lua = l;
  update3d(now(state));
});

const lastStage = [];
let lastFence = null; // Zaun beim letzten Bau (für die Wechsel-Animation)
async function update3d(t) {
  if (!lua || building) return;
  const beds = state.owned ? state.beds : GARDEN.startBeds;
  const plots = Array.from({ length: beds }, (_, i) => {
    const p = state.owned && state.plots[i];
    if (!p) return null;
    const progress = progressOf(p, t);
    return { tree: p.tree, stage: stage(p, t), ripe: ripe(p, t), progress, phase: phaseOf(progress), golden: !!p.golden };
  });
  const fence = state.owned ? state.fence || 'holzzaun' : 'holzzaun';
  const s = beds + '|' + fence + '|' + plots.map((p) => (p ? `${p.tree},${p.phase},${p.ripe},${p.golden}` : '')).join(';');
  if (s === sig) return updateTimers(t);
  // Beete mit neuer Phase ploppen auf (nicht beim ersten Bau)
  plots.forEach((p, i) => {
    const key = p ? p.tree + p.phase : '-';
    if (p && sig && lastStage[i] !== key) p.fresh = true;
    lastStage[i] = key;
  });
  building = true;
  try {
    // neuer Zaun: alter versinkt, neuer wächst aus dem Boden
    const fenceFrom = !reducedMotion && lastFence && lastFence !== fence ? lastFence : '';
    const next = await createRobloxGarden(beds, plots, { fence, fenceFrom });
    lastFence = fence;
    garden?.dispose();
    garden = next;
    garden.rows = Math.ceil(beds / 4);
    sig = s;
    updateTimers(t);
  } catch (err) {
    console.error('Garten', err);
  }
  building = false;
}

// Timer über wachsenden Bäumen im 3D-Garten weiterzählen (GardenBuilder.SetTimer)
function updateTimers(t) {
  if (!garden || !state.owned) return;
  const list = [];
  state.plots.forEach((p, i) => {
    if (!p || stage(p, t) >= 3) return;
    const tree = lootById[p.tree];
    const left = grownAt(p) - t;
    list.push(`${i + 1},${fmtTime(left)},${Math.max(0, Math.min(1, 1 - left / tree.grow)).toFixed(3)}`);
  });
  if (list.length) garden.call('__gardenTimers', list.join(';'));
}

function resize() {
  const r = canvas.getBoundingClientRect();
  renderer.setSize(r.width, r.height, false);
  camera.aspect = r.width / Math.max(1, r.height);
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(canvas);

canvas.addEventListener('pointerdown', (e) => {
  cam.drag = { x: e.clientX, y: e.clientY };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!cam.drag) return;
  cam.angle -= (e.clientX - cam.drag.x) * 0.008;
  cam.tilt = Math.max(0.2, Math.min(1.25, cam.tilt + (e.clientY - cam.drag.y) * 0.005));
  cam.drag = { x: e.clientX, y: e.clientY };
});
canvas.addEventListener('pointerup', () => (cam.drag = null));
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  cam.zoom = Math.max(0.55, Math.min(1.6, cam.zoom + e.deltaY * 0.001));
}, { passive: false });

const clock = new THREE.Clock();
let tick = 0;
// solange ein Finger oder die Maus gedrückt ist, nichts neu zeichnen (sonst geht der Klick verloren)
let pressing = false;
addEventListener('pointerdown', () => (pressing = true), true);
addEventListener('pointerup', () => setTimeout(() => (pressing = false), 0), true);
addEventListener('pointercancel', () => (pressing = false), true);
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.1);
  tick += dt;
  // Texte und Garten jede halbe Sekunde auffrischen (Wachsen, Reifen, Countdown)
  if (tick > 0.5 && !pressing) {
    tick = 0;
    render();
  }
  if (!garden) return;
  lua?.frame(dt);
  // Tageszeit gleitet zur gewählten Stunde (über den Abend bzw. Morgen), GardenBuilder.Animate liest sie
  const goal = targetHour();
  const diff = ((goal - clockHour + 36) % 24) - 12;
  clockHour = reducedMotion ? goal : (clockHour + diff * Math.min(1, dt * 1.5) + 24) % 24;
  garden.call('__gardenClock', clockHour, reducedMotion);
  // nachts das ganze Bild abdunkeln (die Umgebungsspiegelung der Vorschau kennt keine Uhrzeit); wie GardenBuilder.NightFactor
  const night = clockHour >= 20 || clockHour < 5 ? 1 : clockHour >= 17 ? (clockHour - 17) / 3 : clockHour < 7 ? 1 - (clockHour - 5) / 2 : 0;
  renderer.toneMappingExposure = baseExposure * (1 - night * 0.42);
  // Bäume wachsen sanft, wiegen sich und ploppen bei neuer Stufe auf (GardenBuilder.Animate)
  if (!reducedMotion) garden.call('__gardenAnimate', clock.elapsedTime, dt);
  garden.step(dt);
  if (!cam.drag && !reducedMotion) cam.angle = cam.angle * 0.995 + Math.sin(clock.elapsedTime * 0.15) * 0.0012;
  // so weit weg, dass der ganze Garten (31 Studs breit) ins Bild passt, auch im Hochformat
  const fit = 19 / (Math.tan(THREE.MathUtils.degToRad(17.5)) * camera.aspect);
  const dist = Math.max(36 + (garden.rows - 1) * 6, fit) * cam.zoom;
  orbitEgg(camera, cam.angle, cam.tilt, dist, 1.5);
  garden.world.render(renderer, camera);
});

renderCatalog();
render();
