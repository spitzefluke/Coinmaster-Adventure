// Eier, Schlüpfen und Haustiere 1:1 wie in Roblox: Die Seite führt EggBuilder, PetBuilder und HatchFx aus
// dem Installer aus. Die Pets haben noch keine Modelle: PetBuilder zeigt eine leuchtende Kugel in der Farbe
// der Seltenheit.

import * as THREE from 'three';
import { createLua } from '../../js/rbx/lua.js';
import { RbxWorld } from '../../js/rbx/engine.js';
import { eggDataSource, EGG_BUILDER } from '../../roblox/js/luau.js';
import { petDataSource, PET_BUILDER, HATCH_FX } from '../../roblox/js/petLuau.js';
import { EGGS } from './eggs.js';
import { PETS } from '../../haustiere/js/pets.js';

const PREVIEW = `
local root = game:GetService("ReplicatedStorage"):WaitForChild("CoinmasterAdventure")
local EggData = require(root.EggData)
local EggBuilder = require(root.EggBuilder)
local HatchFx = require(root.HatchFx)
local previews = {}
function __buildEgg(key, eggId, withStage)
	local egg = EggData.ById[eggId]
	local holder = Instance.new("Folder")
	holder.Name = "Vorschau"
	holder.Parent = workspace
	previews[key] = holder
	EggBuilder.Build(egg).Parent = holder
	-- Detailansicht: mit Bühne, Licht und Nebel der Ei-Welt
	if withStage then
		EggBuilder.BuildStage(egg).Parent = holder
		EggBuilder.ApplyEnvironment(egg)
	end
end
function __hatch(key, eggId, petId)
	local holder = Instance.new("Folder")
	holder.Name = "Vorschau"
	holder.Parent = workspace
	previews[key] = holder
	task.spawn(function()
		HatchFx.Play(eggId, petId, { Parent = holder, Lighting = true, OnPhase = function(phase) if __hatchPhase then __hatchPhase(key, phase) end end })
		if __hatchDone then __hatchDone(key) end
	end)
end
function __drop(key)
	local m = previews[key]
	if m then m:Destroy() previews[key] = nil end
end
`;

let luaReady = null;
export function eggLua() {
  luaReady ||= (async () => {
    const lua = await createLua();
    lua.call('__addModule', 'EggData', eggDataSource({ EGGS }));
    lua.call('__addModule', 'PetData', petDataSource({ PETS }));
    lua.call('__addModule', 'EggBuilder', EGG_BUILDER);
    lua.call('__addModule', 'PetBuilder', PET_BUILDER);
    lua.call('__addModule', 'HatchFx', HATCH_FX);
    lua.run(PREVIEW, 'Ei-Vorschau');
    return lua;
  })();
  return luaReady;
}

let nextKey = 1;
function makeWorld({ shadows, sky }) {
  const world = new RbxWorld({ shadows, sky });
  world.setShadowArea(new THREE.Vector3(0, 2, 0), 11);
  return world;
}

// Ei auf seinem Sockel (EggBuilder); parts = Anzahl der Teile
export async function createRobloxEgg(egg, { shadows = false, stage = false } = {}) {
  const lua = await eggLua();
  const world = makeWorld({ shadows, sky: false });
  const key = 'e' + nextKey++;
  lua.setWorld(world);
  lua.call('__buildEgg', key, egg.id, stage);
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

// Schlüpfen: HatchFx.Play wie im Spiel (das Tier ist vorher gezogen); onPhase meldet die Abschnitte
const doneHandlers = new Map();
const phaseHandlers = new Map();
export async function createRobloxHatch(egg, pet, { shadows = true, onDone, onPhase } = {}) {
  const lua = await eggLua();
  if (!lua.hatchHook) {
    lua.register('__hatchDone', (key) => doneHandlers.get(key)?.());
    lua.register('__hatchPhase', (key, phase) => phaseHandlers.get(key)?.(phase));
    lua.hatchHook = true;
  }
  const world = makeWorld({ shadows, sky: false });
  const key = 'h' + nextKey++;
  let done = false;
  doneHandlers.set(key, () => {
    done = true;
    onDone?.();
  });
  if (onPhase) phaseHandlers.set(key, onPhase);
  lua.setWorld(world);
  lua.call('__hatch', key, egg.id, pet.id);
  return {
    world,
    lua,
    get done() {
      return done;
    },
    // vorspulen: Lua-Zeit laufen lassen, bis HatchFx fertig ist
    skip() {
      for (let i = 0; i < 600 && !done; i++) {
        lua.frame(1 / 30);
        world.update(1 / 30);
      }
    },
    step(dt) {
      world.update(dt);
    },
    dispose() {
      doneHandlers.delete(key);
      phaseHandlers.delete(key);
      lua.call('__drop', key);
      world.dispose();
    },
  };
}

// Kamera vor das Ei (Roblox-Modelle schauen nach −Z)
export function orbitEgg(camera, angle, tilt, dist, y = 2.6) {
  camera.position.set(Math.sin(angle) * Math.cos(tilt) * dist, y + Math.sin(tilt) * dist, -Math.cos(angle) * Math.cos(tilt) * dist);
  camera.lookAt(0, y, 0);
  camera.updateMatrixWorld();
}
