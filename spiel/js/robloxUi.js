// Spiel-Oberfläche 1:1 wie in Roblox: Das Modul GameUI aus dem Installer baut HUD, Menü, Shop, Inventar und Welten als
// ScreenGui; die Seite führt es aus (Luau im Browser) und zeichnet die ScreenGuis über der Welt
// (js/rbx/screen.js). Spielstand und Käufe kommen von der Seite (state.js) über Attribute und Rückrufe.

import { createLua } from '../../js/rbx/lua.js';
import { createScreen } from '../../js/rbx/screen.js';
import { registerImage } from '../../js/rbx/engine.js';
import { buildIconSheet } from '../../roblox/js/iconSheet.js';
import { eggDataSource, mutationDataSource, coinDataSource, worldDataSource, WEATHER_FX, COIN_BUILDER, EGG_BUILDER, MUTATION_FX } from '../../roblox/js/luau.js';
import { auraDataSource } from '../../roblox/js/auraLuau.js';
import { shopDataSource, GAME_UI, UI_THEME } from '../../roblox/js/uiLuau.js';
import { skillDataSource, rewardDataSource } from '../../roblox/js/uiMoreLuau.js';
import { EGGS } from '../../eier/js/eggs.js';
import { MUTATIONS, WEATHER, WEATHER_RARITIES, WEATHER_BLOCK, WEATHER_WARN } from '../../muenzen/js/mutations.js';
import { AURAS, RARITIES, THEMES, BONUSES } from '../../auren/js/auras.js';
import { BOOSTS, ROBUX, pointsForLevel } from './state.js';
import { BRANCHES, SKILLS } from './skills.js';
import { DAILY, WHEEL, GROUP_BONUS, BOARDS } from './rewards.js';
import { TIERS, COINS } from '../../muenzen/js/coins.js';
import { PLANETS, WORLDS, REBIRTH } from '../../welten/js/worlds.js';
import { gardenDataSource } from '../../roblox/js/gardenLuau.js';
import { rollDataSource } from '../../roblox/js/rollLuau.js';
import { RARITIES as GARDEN_RARITIES, TREES, TOOLS, FENCES, GARDEN } from '../../garten/js/garden.js';
import { ROLLS } from '../../rollen/js/rolls.js';


const q = (s) => JSON.stringify(String(s));

export async function createRobloxUi(host, { onAction, onInvoke, onQuery, onSound, devTools = false, codeHint = '' }) {
  const canvas = document.createElement('canvas');
  canvas.className = 'rbx-ui';
  canvas.setAttribute('aria-hidden', 'true');
  host.append(canvas);
  const lua = await createLua();
  lua.call('__addModule', 'EggData', eggDataSource({ EGGS }));
  lua.call('__addModule', 'CoinData', coinDataSource({ TIERS, COINS }));
  lua.call('__addModule', 'WorldData', worldDataSource({ PLANETS, WORLDS, REBIRTH }));
  lua.call('__addModule', 'MutationData', mutationDataSource({ MUTATIONS, WEATHER, WEATHER_RARITIES, WEATHER_BLOCK, WEATHER_WARN }));
  lua.call('__addModule', 'AuraData', auraDataSource({ AURAS, RARITIES, THEMES, BONUSES }));
  lua.call('__addModule', 'ShopData', shopDataSource({ BOOSTS, ROBUX }));
  lua.call('__addModule', 'SkillData', skillDataSource({ BRANCHES, SKILLS, pointsForLevel }));
  lua.call('__addModule', 'RewardData', rewardDataSource({ DAILY, WHEEL, GROUP_BONUS, BOARDS }));
  lua.call('__addModule', 'WeatherFx', WEATHER_FX);
  // für 3D-Vorschauen in den Fenstern (ViewportFrame)
  lua.call('__addModule', 'CoinBuilder', COIN_BUILDER);
  lua.call('__addModule', 'EggBuilder', EGG_BUILDER);
  lua.call('__addModule', 'MutationFx', MUTATION_FX);
  lua.call('__addModule', 'UITheme', UI_THEME);
  lua.call('__addModule', 'GardenData', gardenDataSource({ GARDEN_RARITIES, TREES, TOOLS, FENCES, GARDEN }));
  lua.call('__addModule', 'RollData', rollDataSource({ ROLLS }));
  lua.call('__addModule', 'GameUI', GAME_UI);
  lua.registerFn('__uiInvoke', (action, a, b) => onInvoke(action, a, b) ?? [false, 'Unbekannt']);
  lua.register('__uiAction', (name, arg) => onAction(name, arg));
  lua.register('__uiSound', (kind, level) => onSound?.(kind, level));
  // Daten für Fenster (Vorhersage, Rangliste) als JSON; in Roblox kämen sie vom Server
  lua.registerFn('__uiQuery', (kind, arg) => [JSON.stringify(onQuery(kind, arg) ?? null)]);
  // Icon-Bild wie in Roblox nach dem Hochladen (UITheme.IconSheet)
  try {
    registerImage('coinmaster://icons', await buildIconSheet());
    lua.run('require(game:GetService("ReplicatedStorage").CoinmasterAdventure.UITheme).IconSheet = "coinmaster://icons"', 'Icons');
  } catch (e) {
    console.warn('Icon-Bild nicht gezeichnet, es bleiben Emojis', e);
  }
  lua.run(`
    local root = game:GetService("ReplicatedStorage"):WaitForChild("CoinmasterAdventure")
    __GameUI = require(root.GameUI)
    __WeatherFx = require(root.WeatherFx)
    function __applyInventory(kind, a, b) __GameUI.ApplyInventory(kind, a, b) end
    __GameUI.Start({
      Invoke = function(action, a, b) return __uiInvoke(action, a, b) end,
      PlayRoll = function(rollId, itemId) __uiAction("playRoll", rollId .. "|" .. itemId) end,
      OnAction = function(name, arg) __uiAction(name, arg or "") end,
      Sound = function(kind, level) __uiSound(kind, level or 1) end,
      LevelBanner = false, -- die Vorschau zeigt den Level-Aufstieg als eigene Karte
      DevTools = ${devTools ? 'true' : 'false'},
      CodeHint = ${codeHint ? q(codeHint) : 'nil'},
      Query = function(kind, arg) return game:GetService("HttpService"):JSONDecode(__uiQuery(kind, arg or "")) end,
    })
  `, 'Spiel-Oberfläche');
  const playerGui = lua.get(9);
  const screen = createScreen(canvas, playerGui, lua);
  // Bildschirmgröße wie Camera.ViewportSize in Roblox (für die Handy-Anordnung)
  const viewport = () => {
    const r = canvas.getBoundingClientRect();
    if (r.width && r.height) lua.call('__setViewport', Math.round(r.width), Math.round(r.height));
  };
  new ResizeObserver(viewport).observe(canvas);
  viewport();

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

  let checks = 0;
  return {
    lua,
    screen,
    // ein Bild: Lua-Zeit (Tweens, task) und Zeichnen
    frame(dt) {
      lua.frame(dt);
      screen.render();
      // HTML-Teile über der Welt (Spawn-Leiste) ausblenden, solange ein Roblox-Fenster offen ist
      if (++checks % 6 === 0) host.classList.toggle('rbx-window-open', this.isOpen());
    },
    // Münz-Inventar wie vom Server: ("full", Liste) oder ("set", Schlüssel, Stapel oder null)
    inventory(kind, a, b) {
      if (kind === 'full') lua.call('__applyInventory', 'full', JSON.stringify(a));
      else if (b) lua.call('__applyInventory', 'set', a, JSON.stringify(b));
      else lua.call('__applyInventory', 'set', a);
    },
    setAttr(name, value) {
      lua.call('__setAttr', name, value);
    },
    setWeather(id, endsMs, nextId = '', nextAtMs = 0) {
      lua.call('__setRSAttr', 'WeatherNext', nextId);
      lua.call('__setRSAttr', 'WeatherNextAt', Math.round(nextAtMs / 1000));
      lua.call('__setRSAttr', 'WeatherEnds', Math.round(endsMs / 1000));
      lua.call('__setRSAttr', 'Weather', id);
    },
    announce(id) {
      lua.run(`__WeatherFx.Announce(${q(id)}, game:GetService("Players").LocalPlayer:WaitForChild("PlayerGui"))`, 'Ansage');
    },
    // Vorwarnung mit Countdown bis zum Beginn (WeatherFx.Warn)
    warn(id, startsMs) {
      lua.run(`__WeatherFx.Warn(${q(id)}, ${Math.round(startsMs / 1000)}, game:GetService("Players").LocalPlayer:WaitForChild("PlayerGui"))`, 'Vorwarnung');
    },
    // Fund mit Effekten je nach Seltenheit (GameUI.Found)
    found({ coinId, mutation, count, value, xp, upgraded }) {
      lua.run(`__GameUI.Found({ CoinId = ${coinId}, Mutation = ${mutation ? q(mutation) : 'nil'}, Count = ${count}, Value = ${value}, Xp = ${xp}, Upgraded = ${upgraded ? 'true' : 'false'} })`, 'Fund');
    },
    toast(text, color = '#d9b26a') {
      lua.run(`__GameUI.Toast(${q(text)}, Color3.fromHex(${q(color)}))`, 'Hinweis');
    },
    // Fenster: shop, inventar, welten
    open(key, tab) {
      lua.run(`__GameUI.Open(${q(key)}, ${tab ? q(tab) : 'nil'})`, 'Fenster');
      host.classList.add('rbx-window-open');
    },
    close(key) {
      lua.run(`__GameUI.Close(${key ? q(key) : 'nil'})`, 'Fenster');
    },
    isOpen(key) {
      let open = false;
      lua.register('__winState', (v) => (open = v === 1));
      lua.run(`__winState(__GameUI.IsOpen(${key ? q(key) : 'nil'}) and 1 or 0)`, 'Fenster');
      return open;
    },
    openShop(tab) {
      this.open('shop', tab);
    },
    closeShop() {
      this.close('shop');
    },
    shopOpen() {
      return this.isOpen('shop');
    },
  };
}
