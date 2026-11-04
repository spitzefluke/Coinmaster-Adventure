// Münzrollen 1:1 wie in Roblox: Die Seite führt RollBuilder und RollFx aus dem Installer aus.
// Die Münzen baut dasselbe CoinBuilder wie im Münzkabinett, mit Motiv als Decal.

import * as THREE from 'three';
import { createLua } from '../../js/rbx/lua.js';
import { RbxWorld } from '../../js/rbx/engine.js';
import { coinDataSource, COIN_BUILDER } from '../../roblox/js/luau.js';
import { rollDataSource, ROLL_BUILDER, ROLL_FX } from '../../roblox/js/rollLuau.js';
import { PREVIEW_DECAL, ensureEmblem } from '../../muenzen/js/coinRoblox.js';
import { TIERS, COINS } from '../../muenzen/js/coins.js';
import { ROLLS } from './rolls.js';

const PREVIEW = `
local root = game:GetService("ReplicatedStorage"):WaitForChild("CoinmasterAdventure")
local CoinData = require(root.CoinData)
local RollData = require(root.RollData)
local RollBuilder = require(root.RollBuilder)
local RollFx = require(root.RollFx)
for i, coin in ipairs(CoinData.Coins) do
	coin.DecalId = ${PREVIEW_DECAL} + i
end
local previews = {}
function __buildRoll(key, rollId)
	local model = RollBuilder.Build(RollData.ById[rollId])
	model.Parent = workspace
	previews[key] = model
end
function __open(key, rollId, ids, perRow)
	local list = {}
	for id in string.gmatch(ids, "%d+") do
		table.insert(list, tonumber(id))
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
    lua.call('__addModule', 'CoinData', coinDataSource({ TIERS, COINS }));
    lua.call('__addModule', 'CoinBuilder', COIN_BUILDER);
    lua.call('__addModule', 'RollData', rollDataSource({ ROLLS }));
    lua.call('__addModule', 'RollBuilder', ROLL_BUILDER);
    lua.call('__addModule', 'RollFx', ROLL_FX);
    lua.run(PREVIEW, 'Rollen-Vorschau');
    return lua;
  })();
  return luaReady;
}

let nextKey = 1;
function makeWorld({ shadows }) {
  const world = new RbxWorld({ shadows, sky: false });
  world.setShadowArea(new THREE.Vector3(0, 2, 0), 9);
  return world;
}

// Rolle auf ihrem Sockel (RollBuilder)
export async function createRobloxRoll(roll, { shadows = false } = {}) {
  const lua = await rollLua();
  const world = makeWorld({ shadows });
  const key = 'r' + nextKey++;
  lua.setWorld(world);
  lua.call('__buildRoll', key, roll.id);
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

// Öffnen: RollFx.Play wie im Spiel (die Münzen sind vorher gezogen)
const doneHandlers = new Map();
export async function createRobloxOpening(roll, coins, { shadows = true, perRow = 4, onDone } = {}) {
  const lua = await rollLua();
  if (!lua.openHook) {
    lua.register('__openDone', (key) => doneHandlers.get(key)?.());
    lua.openHook = true;
  }
  const ids = coins.map((c) => {
    const i = COINS.indexOf(c);
    ensureEmblem(i);
    return i + 1;
  });
  const world = makeWorld({ shadows });
  const key = 'o' + nextKey++;
  let done = false;
  doneHandlers.set(key, () => {
    done = true;
    onDone?.();
  });
  lua.setWorld(world);
  lua.call('__open', key, roll.id, ids.join(','), perRow);
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
