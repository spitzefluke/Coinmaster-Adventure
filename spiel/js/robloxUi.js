// Spiel-Oberfläche 1:1 wie in Roblox: Das Modul GameUI aus dem Installer baut HUD, Menü und Shop als
// ScreenGui; die Seite führt es aus (Luau im Browser) und zeichnet die ScreenGuis über der Welt
// (js/rbx/screen.js). Spielstand und Käufe kommen von der Seite (state.js) über Attribute und Rückrufe.

import { createLua } from '../../js/rbx/lua.js';
import { createScreen } from '../../js/rbx/screen.js';
import { eggDataSource, mutationDataSource, WEATHER_FX } from '../../roblox/js/luau.js';
import { auraDataSource } from '../../roblox/js/auraLuau.js';
import { shopDataSource, GAME_UI } from '../../roblox/js/uiLuau.js';
import { EGGS } from '../../eier/js/eggs.js';
import { MUTATIONS, WEATHER, WEATHER_MS } from '../../muenzen/js/mutations.js';
import { AURAS, RARITIES, THEMES, BONUSES } from '../../auren/js/auras.js';
import { BOOSTS, ROBUX } from './state.js';


const q = (s) => JSON.stringify(String(s));

export async function createRobloxUi(host, { onAction, onInvoke }) {
  const canvas = document.createElement('canvas');
  canvas.className = 'rbx-ui';
  canvas.setAttribute('aria-hidden', 'true');
  host.append(canvas);
  const lua = await createLua();
  lua.call('__addModule', 'EggData', eggDataSource({ EGGS }));
  lua.call('__addModule', 'MutationData', mutationDataSource({ MUTATIONS, WEATHER, WEATHER_MS }));
  lua.call('__addModule', 'AuraData', auraDataSource({ AURAS, RARITIES, THEMES, BONUSES }));
  lua.call('__addModule', 'ShopData', shopDataSource({ BOOSTS, ROBUX }));
  lua.call('__addModule', 'WeatherFx', WEATHER_FX);
  lua.call('__addModule', 'GameUI', GAME_UI);
  lua.registerFn('__uiInvoke', (action, a, b) => onInvoke(action, a, b) ?? [false, 'Unbekannt']);
  lua.register('__uiAction', (name, arg) => onAction(name, arg));
  lua.run(`
    local root = game:GetService("ReplicatedStorage"):WaitForChild("CoinmasterAdventure")
    __GameUI = require(root.GameUI)
    __WeatherFx = require(root.WeatherFx)
    __GameUI.Start({
      Invoke = function(action, a, b) return __uiInvoke(action, a, b) end,
      OnAction = function(name, arg) __uiAction(name, arg or "") end,
    })
  `, 'Spiel-Oberfläche');
  const playerGui = lua.get(9);
  const screen = createScreen(canvas, playerGui, lua);

  // Zeiger: was die UI trifft, geht nicht an die Welt darunter
  const at = (e) => {
    const r = canvas.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  const skip = (e) => e.target.closest?.('#panel-layer, #levelup, .spawn-bar, .area-tip, a, input, select');
  const handlers = {
    pointermove: (e) => !skip(e) && screen.pointer('move', ...at(e)),
    pointerdown: (e) => {
      if (skip(e)) return;
      if (screen.pointer('down', ...at(e))) e.stopPropagation();
    },
    pointerup: (e) => {
      if (skip(e)) return;
      if (screen.pointer('up', ...at(e))) e.stopPropagation();
    },
    click: (e) => {
      if (skip(e)) return;
      const [x, y] = at(e);
      if (screen.pointer('hit', x, y)) e.stopPropagation();
    },
    wheel: (e) => {
      if (skip(e)) return;
      if (screen.pointer('wheel', ...at(e), e.deltaY)) e.preventDefault();
    },
    pointerleave: () => screen.pointer('leave', 0, 0),
  };
  for (const [type, fn] of Object.entries(handlers)) host.addEventListener(type, fn, { capture: true, passive: type !== 'wheel' });

  return {
    lua,
    screen,
    // ein Bild: Lua-Zeit (Tweens, task) und Zeichnen
    frame(dt) {
      lua.frame(dt);
      screen.render();
    },
    setAttr(name, value) {
      lua.call('__setAttr', name, value);
    },
    setWeather(id, endsMs) {
      lua.call('__setRSAttr', 'WeatherEnds', Math.round(endsMs / 1000));
      lua.call('__setRSAttr', 'Weather', id);
    },
    announce(id) {
      lua.run(`__WeatherFx.Announce(${q(id)}, game:GetService("Players").LocalPlayer:WaitForChild("PlayerGui"))`, 'Ansage');
    },
    toast(text, color = '#d9b26a') {
      lua.run(`__GameUI.Toast(${q(text)}, Color3.fromHex(${q(color)}))`, 'Hinweis');
    },
    openShop(tab) {
      lua.run(`__GameUI.OpenShop(${tab ? q(tab) : 'nil'})`, 'Shop');
    },
    closeShop() {
      lua.run('__GameUI.CloseShop()', 'Shop');
    },
    shopOpen() {
      let open = false;
      lua.register('__shopState', (v) => (open = v === 1));
      lua.run('__shopState(__GameUI.IsShopOpen() and 1 or 0)', 'Shop');
      return open;
    },
  };
}
