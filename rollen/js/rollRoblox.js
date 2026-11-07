// Münzrollen 1:1 wie in Roblox: Die Seite führt RollBuilder und RollFx aus dem Installer aus.
// Was herausfliegt (Münzbäume, Gießkannen …), baut LootBuilder aus dem Münzbaumgarten.

import * as THREE from 'three';
import { createLua } from '../../js/rbx/lua.js';
import { RbxWorld } from '../../js/rbx/engine.js';
import { rollDataSource, ROLL_BUILDER, ROLL_FX } from '../../roblox/js/rollLuau.js';
import { gardenDataSource, LOOT_BUILDER, GARDEN_BUILDER } from '../../roblox/js/gardenLuau.js';
import { RARITIES, TREES, TOOLS, FENCES, GARDEN } from '../../garten/js/garden.js';
import { ROLLS } from './rolls.js';

const PREVIEW = `
local root = game:GetService("ReplicatedStorage"):WaitForChild("CoinmasterAdventure")
local GardenData = require(root.GardenData)
local LootBuilder = require(root.LootBuilder)
local GardenBuilder = require(root.GardenBuilder)
local RollData = require(root.RollData)
local RollBuilder = require(root.RollBuilder)
local RollFx = require(root.RollFx)
local previews = {}
function __buildRoll(key, rollId)
	local model = RollBuilder.Build(RollData.ById[rollId])
	model.Parent = workspace
	previews[key] = model
end
function __buildLoot(key, itemId)
	local model = LootBuilder.Build(GardenData.ById[itemId])
	model.Parent = workspace
	previews[key] = model
end
-- plots: "baumId,stufe,reif,fortschritt,neu,golden;;…" (leeres Feld = leeres Beet; neu = 1: Phase gerade erreicht)
function __buildGarden(key, beds, plots, fence, fenceFrom)
	local list, i = {}, 0
	for entry in string.gmatch(plots .. ";", "([^;]*);") do
		i = i + 1
		local id, stage, ripe, progress, fresh, golden = string.match(entry, "([%w-]+),(%d+),(%d+),([%d.]+),(%d),(%d)")
		list[i] = id and { Tree = id, Stage = tonumber(stage), Ripe = tonumber(ripe), Progress = tonumber(progress), Fresh = fresh == "1", Golden = golden == "1" } or false
	end
	local model = GardenBuilder.Build({ Beds = beds, Plots = list, Fence = fence ~= "" and fence or nil, FenceFrom = fenceFrom ~= "" and fenceFrom or nil })
	model.Parent = workspace
	previews[key] = model
end
-- Garten animieren (jedes Bild): Wachsen, Wiegen, Aufploppen
function __gardenAnimate(key, t, dt)
	local m = previews[key]
	if m then GardenBuilder.Animate(m, t, dt) end
end
-- Uhrzeit für Tag und Nacht (Lighting.ClockTime, liest GardenBuilder.Animate)
function __gardenClock(key, hours, still)
	local L = game:GetService("Lighting")
	L.ClockTime = hours
	-- nur Vorschau: nachts bläuliches, gedämpftes Umgebungslicht (im Spiel macht das die Welt selbst)
	local n = GardenBuilder.NightFactor()
	L.OutdoorAmbient = Color3.fromRGB(128, 128, 128):Lerp(Color3.fromRGB(34, 44, 86), n)
	L.Ambient = Color3.fromRGB(70, 70, 70):Lerp(Color3.fromRGB(18, 22, 44), n)
	L.Brightness = 2 - n * 1.3
	local m = previews[key]
	if m and still then GardenBuilder.UpdateNight(m) end
end
-- Timer über wachsenden Bäumen: "beet,text,fortschritt;…"
function __gardenTimers(key, list)
	local m = previews[key]
	if not m then return end
	for i, text, progress in string.gmatch(list, "(%d+),([^,;]*),([%d.]+)") do
		GardenBuilder.SetTimer(m, tonumber(i), text, tonumber(progress))
	end
end
function __open(key, rollId, itemId, window)
	local holder = Instance.new("Folder")
	holder.Name = "Vorschau"
	holder.Parent = workspace
	previews[key] = holder
	task.spawn(function()
		RollFx.Play(rollId, itemId, { Parent = holder, Window = window })
		if __openDone then __openDone(key) end
	end)
end
function __drop(key)
	local m = previews[key]
	if m then m:Destroy() previews[key] = nil end
end
`;

let luaReady = null;
export function rollLua() {
  luaReady ||= (async () => {
    const lua = await createLua();
    lua.call('__addModule', 'GardenData', gardenDataSource({ GARDEN_RARITIES: RARITIES, TREES, TOOLS, FENCES, GARDEN }));
    lua.call('__addModule', 'LootBuilder', LOOT_BUILDER);
    lua.call('__addModule', 'GardenBuilder', GARDEN_BUILDER);
    lua.call('__addModule', 'RollData', rollDataSource({ ROLLS }));
    lua.call('__addModule', 'RollBuilder', ROLL_BUILDER);
    lua.call('__addModule', 'RollFx', ROLL_FX);
    lua.run(PREVIEW, 'Rollen-Vorschau');
    return lua;
  })();
  return luaReady;
}

let nextKey = 1;
function makeWorld({ shadows, area = 9 }) {
  const world = new RbxWorld({ shadows, sky: false });
  world.setShadowArea(new THREE.Vector3(0, 2, 0), area);
  return world;
}

async function staticModel(fn, args, opts = {}) {
  const lua = await rollLua();
  const world = makeWorld(opts);
  const key = 'm' + nextKey++;
  lua.setWorld(world);
  lua.call(fn, key, ...args);
  return {
    world,
    step(dt) {
      world.update(dt);
    },
    // Lua-Funktion für dieses Modell aufrufen (erstes Argument ist sein Schlüssel)
    call(fn, ...rest) {
      lua.call(fn, key, ...rest);
    },
    dispose() {
      lua.call('__drop', key);
      world.dispose();
    },
  };
}

// Rolle auf ihrem Sockel (RollBuilder)
export const createRobloxRoll = (roll, { shadows = false } = {}) => staticModel('__buildRoll', [roll.id], { shadows });
// Baum oder Werkzeug (LootBuilder)
export const createRobloxLoot = (item, { shadows = false } = {}) => staticModel('__buildLoot', [item.id], { shadows });
// ganzer Garten (GardenBuilder); plots: [{ tree, stage, ripe, progress, fresh, golden } | null]
export const createRobloxGarden = (beds, plots, { shadows = true, fence = '', fenceFrom = '' } = {}) =>
  staticModel('__buildGarden', [beds, plots.map((p) => (p ? `${p.tree},${p.stage},${p.ripe},${(p.progress ?? 1).toFixed(3)},${p.fresh ? 1 : 0},${p.golden ? 1 : 0}` : '')).join(';'), fence, fenceFrom], { shadows, area: 22 });

// Öffnen: RollFx.Play wie im Spiel (die Sache ist vorher gezogen); window = halbe Breite des Rollbands
const doneHandlers = new Map();
export async function createRobloxOpening(roll, item, { shadows = true, window = 12, onDone } = {}) {
  const lua = await rollLua();
  if (!lua.openHook) {
    lua.register('__openDone', (key) => doneHandlers.get(key)?.());
    lua.openHook = true;
  }
  const world = makeWorld({ shadows });
  const key = 'o' + nextKey++;
  let done = false;
  doneHandlers.set(key, () => {
    done = true;
    onDone?.();
  });
  lua.setWorld(world);
  lua.call('__open', key, roll.id, item.id, window);
  return {
    world,
    get done() {
      return done;
    },
    // vorspulen: Lua-Zeit laufen lassen, bis RollFx fertig ist
    skip() {
      for (let i = 0; i < 1200 && !done; i++) {
        lua.frame(1 / 30);
        world.update(1 / 30);
      }
    },
    step(dt) {
      world.update(dt);
    },
    dispose() {
      doneHandlers.delete(key);
      lua.call('__drop', key);
      world.dispose();
    },
  };
}
