// Shop-Reiter „Auras“: kaufen mit Talern, eine anlegen. Oben eine kleine 3D-Vorschau der gewählten Aura.

import * as THREE from 'three';
import { AURAS, THEMES, rarityById, themeById, auraById, bonusText } from '../../../auren/js/auras.js';
import { createAuraPreview, auraLua } from '../../../auren/js/auraRoblox.js';
import { equippedAura, fmtNumber } from '../state.js';
import { pixelRatio, skipAnimations } from '../../../js/settings.js';

let theme = 'alle';
let selected = null;
let view = null; // { canvas, renderer, camera, obj, id }

// 3D-Vorschau wie in Roblox: dieselben Module AuraData und AuraFx wie im Installer
function preview(host, aura) {
  if (!view) {
    const canvas = document.createElement('canvas');
    canvas.className = 'aura-canvas';
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, stencil: true });
    renderer.setPixelRatio(pixelRatio());
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 2000);
    view = { canvas, renderer, camera, obj: null, id: null, lua: null };
    auraLua().then((l) => (view.lua = l));
    const clock = new THREE.Clock();
    renderer.setAnimationLoop(() => {
      const dt = Math.min(clock.getDelta(), 0.1), t = clock.elapsedTime;
      if (!canvas.isConnected || !view.obj) return;
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (w && h && canvas.width !== Math.round(w * renderer.getPixelRatio())) {
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }
      view.lua?.frame(dt);
      const a = skipAnimations() ? -0.5 : -0.5 + t * 0.4;
      camera.position.set(Math.sin(a) * 17, 5.6, -Math.cos(a) * 17);
      camera.lookAt(0, 3.6, 0);
      view.obj.step(skipAnimations() ? 1 : t, dt);
      view.obj.world.render(renderer, camera);
    });
  }
  host.append(view.canvas);
  if (view.id !== aura.id) {
    view.id = aura.id;
    const id = aura.id;
    createAuraPreview(aura).then((obj) => {
      if (view.id !== id) return obj.dispose();
      view.obj?.dispose();
      view.obj = obj;
    });
  }
}

// Farbiger Punkt als Vorschau in der Liste
const swatch = (a) => `background: radial-gradient(circle at 50% 55%, #fff8 0 14%, transparent 15%), conic-gradient(${a.look.cols.concat(a.look.cols[0]).join(',')})`;

export function renderAuras(body, ctx, buy) {
  const s = ctx.state, short = ctx.settings.shortNumbers;
  const eq = equippedAura(s);
  const sel = auraById[selected] || eq || AURAS[0];
  selected = sel.id;
  const owned = (a) => s.auras.includes(a.id);
  const list = AURAS.filter((a) => theme === 'alle' || a.theme === theme);
  const action = (a) =>
    eq?.id === a.id
      ? `<button class="btn" type="button" data-unequip>Ablegen</button>`
      : owned(a)
        ? `<button class="btn btn-primary" type="button" data-equip="${a.id}">Anlegen</button>`
        : `<button class="btn btn-primary" type="button" data-buy="${a.id}" ${s.taler < a.price ? 'aria-disabled="true"' : ''}>Kaufen · ${fmtNumber(a.price, short)} Taler</button>`;
  const r = rarityById[sel.rarity];
  body.innerHTML = `
    <div class="aura-shop">
      <section class="aura-stage" style="--a:${sel.color};--r:${r.color}">
        <div class="aura-view" id="aura-view"></div>
        <div class="aura-info">
          <p class="tier-pill" style="--tier:${r.color}">${r.name}</p>
          <h3>${sel.name}</h3>
          <p class="muted aura-text">${sel.text}</p>
          <p class="aura-bonus">${bonusText(sel)}${sel.bonus.type === 'tempo' ? '<span> (wirkt erst im Roblox-Spiel)</span>' : ''}</p>
          <p class="shop-meta">${themeById[sel.theme].name} · ${owned(sel) ? (eq?.id === sel.id ? 'angelegt' : 'gekauft') : `${fmtNumber(sel.price, short)} Taler`}</p>
          ${action(sel)}
          <p class="aura-eq">${eq ? `Angelegt: <strong>${eq.name}</strong> · ${bonusText(eq)}` : 'Keine Aura angelegt.'} <a href="../auren/">Alle Auras ansehen</a></p>
        </div>
      </section>
      <div class="aura-filter" role="group" aria-label="Thema">
        ${[{ id: 'alle', name: 'Alle' }, ...THEMES].map((t) => `<button type="button" data-theme="${t.id}" aria-pressed="${theme === t.id}">${t.name}</button>`).join('')}
      </div>
      <ul class="aura-list">${list.map((a) => {
        const ra = rarityById[a.rarity];
        return `<li class="aura-row${a.id === sel.id ? ' is-sel' : ''}${owned(a) ? ' is-owned' : ''}" style="--r:${ra.color}">
          <button type="button" class="aura-pick" data-pick="${a.id}" aria-pressed="${a.id === sel.id}">
            <span class="aura-dot" style="${swatch(a)}"></span>
            <span class="aura-name">${a.name}</span>
            <span class="aura-rar">${ra.name}</span>
            <span class="aura-b">${bonusText(a)}</span>
            <span class="aura-price">${eq?.id === a.id ? '<em>angelegt</em>' : owned(a) ? 'gekauft' : `${fmtNumber(a.price, short)}`}</span>
          </button>
        </li>`;
      }).join('')}</ul>
    </div>`;
  preview(body.querySelector('#aura-view'), sel);

  body.querySelectorAll('[data-theme]').forEach((b) => b.addEventListener('click', () => {
    theme = b.dataset.theme;
    ctx.rerender();
  }));
  body.querySelectorAll('[data-pick]').forEach((b) => b.addEventListener('click', () => {
    selected = b.dataset.pick;
    const y = body.scrollTop;
    ctx.rerender();
    body.scrollTop = y;
    body.querySelector(`[data-pick="${selected}"]`)?.focus({ preventScroll: true });
  }));
  body.querySelectorAll('[data-buy]').forEach((b) => b.addEventListener('click', () => {
    const a = auraById[b.dataset.buy];
    buy(ctx, a.price, () => {
      s.auras.push(a.id);
      s.aura = a.id; // gleich anlegen
    }, `${a.name} gekauft und angelegt`);
  }));
  body.querySelectorAll('[data-equip]').forEach((b) => b.addEventListener('click', () => {
    s.aura = b.dataset.equip;
    ctx.save();
    ctx.sound(1.2);
    ctx.toast(`${auraById[s.aura].name} angelegt: ${bonusText(auraById[s.aura])}`, auraById[s.aura].color);
    ctx.rerender();
  }));
  body.querySelectorAll('[data-unequip]').forEach((b) => b.addEventListener('click', () => {
    s.aura = null;
    ctx.save();
    ctx.rerender();
  }));
}
