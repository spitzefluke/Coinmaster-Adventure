// Münzrollen 1:1 wie in Roblox: Die Seite führt RollBuilder und RollFx aus dem Installer aus.
// Was herausfliegt (Münzbäume, Gießkannen …), baut LootBuilder aus dem Münzbaumgarten.

import * as THREE from 'three';
import { createLua } from '../../js/rbx/lua.js';
import { RbxWorld } from '../../js/rbx/engine.js';
import { rollDataSource, ROLL_BUILDER, ROLL_FX } from '../../roblox/js/rollLuau.js';
import { gardenDataSource, LOOT_BUILDER, GARDEN_BUILDER } from '../../roblox/js/gardenLuau.js';
import { RARITIES, TREES, TOOLS, GARDEN } from '../../garten/js/garden.js';
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
-- plots: "baumId,stufe,reif;;baumId,stufe,reif" (leeres Feld = leeres Beet)
function __buildGarden(key, beds, plots)
	local list, i = {}, 0
	for entry in string.gmatch(plots .. ";", "([^;]*);") do
		i = i + 1
		local id, stage, ripe = string.match(entry, "([%w-]+),(%d+),(%d+)")
		list[i] = id and { Tree = id, Stage = tonumber(stage), Ripe = tonumber(ripe) } or false
	end
	local model = GardenBuilder.Build({ Beds = beds, Plots = list })
	model.Parent = workspace
	previews[key] = model
end
function __open(key, rollId, ids, perRow)
	local list = {}
	for id in string.gmatch(ids, "[%w-]+") do
		table.insert(list, id)
	end
	RollFx.PerRow = perRow
	local holder = Instance.new("Folder")
	holder.Name = "Vorschau"
	holder.Parent = workspace
	previews[key] = holder
	task.spawn(function()
		RollFx.Play(rollId, list, { Parent = holder })
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
    lua.call('__addModule', 'GardenData', gardenDataSource({ GARDEN_RARITIES: RARITIES, TREES, TOOLS, GARDEN }));
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
// ganzer Garten (GardenBuilder); plots: [{ tree, stage, ripe } | null]
export const createRobloxGarden = (beds, plots, { shadows = true } = {}) =>
  staticModel('__buildGarden', [beds, plots.map((p) => (p ? `${p.tree},${p.stage},${p.ripe}` : '')).join(';')], { shadows, area: 22 });

// Öffnen: RollFx.Play wie im Spiel (der Inhalt ist vorher gezogen)
const doneHandlers = new Map();
export async function createRobloxOpening(roll, items, { shadows = true, perRow = 4, onDone } = {}) {
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
  lua.call('__open', key, roll.id, items.map((i) => i.id).join(','), perRow);
  return {
    world,
    get done() {
      return done;
    },
    // vorspulen: Lua-Zeit laufen lassen, bis RollFx fertig ist
    skip() {
      for (let i = 0; i < 900 && !done; i++) {
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
